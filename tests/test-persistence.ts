import assert from 'node:assert/strict'
import {
	createBlueprintStore,
	createLocalPersistencePort,
	createMemoryStorage,
	PayloadTooLargeError,
	type BlueprintStore, type PersistencePort, type SyncPort,
} from '../src/blueprint-editor/store/index'
import { defaultSeed } from '../src/blueprint-editor/store/seed'
import { createHttpPersistencePort } from '../src/blueprint-editor/store/httpPorts'
import { MAX_PAYLOAD_BYTES } from '../src/blueprint-editor/limits'
import type { BlueprintDataFile } from '../src/blueprint-editor/domain/types'

type SaveMode = 'ok' | 'reject' | 'false' | 'payload'

// ── Harness: recording in-memory port (replaces the old fetch stub) ──
function createRecordingPort() {
	const saves: BlueprintDataFile[] = []
	let mode: SaveMode = 'ok'
	let inFlight = 0
	let maxInFlight = 0
	const port: PersistencePort = {
		async load() { return null },
		async save(data) {
			inFlight++
			maxInFlight = Math.max(maxInFlight, inFlight)
			await new Promise(resolve => setTimeout(resolve, 0))
			inFlight--
			saves.push(data)
			if (mode === 'reject') throw new Error('disk is full')
			if (mode === 'payload') throw new PayloadTooLargeError()
			if (mode === 'false') return false
			return true
		},
	}
	return {
		port,
		saves,
		setMode: (next: SaveMode) => { mode = next },
		maxConcurrentSaves: () => maxInFlight,
	}
}

const sync: SyncPort = { emit() {} }
const harness = createRecordingPort()
const store: BlueprintStore = createBlueprintStore({ persistence: harness.port, sync, seed: await defaultSeed() })

assert.ok(store.state.layout.floors.length > 0, 'expected at least one floor')
const originalName = store.state.layout.floors[0].name

// ── 1. success: one write, verified by the port ──
assert.equal(await store.save(), true, 'save resolves true when the port accepts the write')
assert.equal(harness.saves.length, 1, 'one write hits the port')
const payload = harness.saves[0]
assert.equal(payload.layout.floors[0].name, originalName, 'payload carries the current layout')
assert.ok(payload.originAssets.length > 0, 'payload carries the asset registry')
assert.ok(payload.tags, 'payload carries the tag definitions')
assert.ok(payload.npcConfig, 'payload carries the npc config')
assert.ok(payload.$schema.length > 0, 'payload is a schema-stamped blueprint file')

// ── 2. port rejects: state reverts to the last saved snapshot ──
store.state.layout.floors[0].name = 'MUTATED-SHOULD-REVERT'
harness.setMode('reject')
await assert.rejects(store.save(), 'save rejects when the port write fails')
assert.equal(store.state.layout.floors[0].name, originalName, 'state reverts to the last saved snapshot on failure')
assert.equal(store.toast.toasts.value.at(-1)?.message, 'Failed to save blueprint data', 'the store reports the failed save')
assert.equal(harness.saves.length, 2, 'the store does not retry - retry policy lives in the port')

// ── 3. port reports failure without throwing ──
harness.setMode('false')
store.state.layout.floors[0].name = 'MUTATED-AGAIN'
await assert.rejects(store.save(), 'a false port result is treated as a failed save')
assert.equal(store.state.layout.floors[0].name, originalName, 'state reverts when the port reports failure without throwing')

// ── 3b. payload-too-large: the store surfaces a specific message ──
harness.setMode('payload')
store.state.layout.floors[0].name = 'TOO-BIG'
await assert.rejects(store.save(), 'a payload-cap rejection rejects')
assert.equal(store.state.layout.floors[0].name, originalName, 'state still reverts on a payload-cap rejection')
assert.equal(
	store.toast.toasts.value.at(-1)?.message,
	'Failed to save blueprint data - it exceeds the maximum save size',
	'the payload-cap failure names the size limit instead of the generic save error',
)

// ── 4. single writer: queued saves never overlap ──
harness.setMode('ok')
const savesBefore = harness.saves.length
const results = await Promise.all([store.save(), store.save()])
assert.deepEqual(results, [true, true], 'both queued saves resolve')
assert.equal(harness.saves.length, savesBefore + 2, 'both queued saves reach the port')
assert.equal(harness.maxConcurrentSaves(), 1, 'saves run one at a time (single writer)')

// ── 4b. local-first port: storage round-trip + failure modes ──
const localStore = createMemoryStorage()
const localPort = createLocalPersistencePort(localStore)
assert.equal(await localPort.load(), null, 'empty storage loads as null (fresh workspace)')
assert.equal(await localPort.save(payload), true, 'a local save resolves true')
const reloaded = await localPort.load()
assert.ok(reloaded, 'a local load returns the saved file')
assert.equal(reloaded!.layout.floors.length, payload.layout.floors.length, 'a local round-trip keeps the floors')
assert.equal(reloaded!.$schema, payload.$schema, 'a local round-trip keeps the schema stamp')

await localStore.write('{ not json')
await assert.rejects(localPort.load(), 'corrupt JSON rejects instead of silently returning null')

await localStore.write('{"$schema":"blueprint-data.v2.json","version":2}')
await assert.rejects(localPort.load(), 'a structurally invalid file rejects instead of silently returning null')

await localStore.write(JSON.stringify({ ...payload, version: 999 }))
await assert.rejects(localPort.load(), 'a newer file version rejects')

const oversized = { ...payload, tags: [{ id: 'x', label: 'y'.repeat(MAX_PAYLOAD_BYTES) }] }
await assert.rejects(localPort.save(oversized), 'a payload over the byte cap rejects before writing')

// ── 5. HTTP port: retry / 413 / read-back verification live here now ──
const realFetch = globalThis.fetch
const realSetTimeout = globalThis.setTimeout
const calls: Array<{ method?: string; save: string | null; body: string }> = []
const queued: Array<() => Response> = []
const verifiedResponse = () => new Response(JSON.stringify({ ok: true, data: payload }), { status: 200, headers: { 'content-type': 'application/json' } })
const invalidResponse = () => new Response(JSON.stringify({ ok: true, data: { nope: true } }), { status: 200, headers: { 'content-type': 'application/json' } })

try {
	globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
		const headers = (init?.headers ?? {}) as Record<string, string>
		calls.push({
			method: init?.method,
			save: headers['X-Blueprint-Save'] ?? null,
			body: typeof init?.body === 'string' ? init.body : '',
		})
		const next = queued.shift()
		if (!next) throw new Error('unexpected fetch')
		return next()
	}) as typeof fetch

	const httpPort = createHttpPersistencePort()

	queued.push(verifiedResponse)
	assert.equal(await httpPort.save(payload), true, 'HTTP port resolves true on a verified read-back')
	assert.equal(calls.length, 1, 'one POST attempt on success')
	assert.equal(calls[0].method, 'POST', 'uses POST')
	assert.equal(calls[0].save, '1', 'sets the save header')
	assert.ok(calls[0].body.includes('"$schema"'), 'body is the serialized blueprint file')

	queued.push(() => new Response('', { status: 413 }))
	await assert.rejects(httpPort.save(payload), 'a 413 payload-too-large response rejects')
	assert.equal(calls.length, 2, '413 fails immediately without retry')

	// Retry paths: the mock resolves the backoff timer at once, so the suite stays fast.
	globalThis.setTimeout = ((fn: () => void) => { fn(); return 0 }) as unknown as typeof setTimeout

	queued.push(() => { throw new Error('network down') }, verifiedResponse)
	assert.equal(await httpPort.save(payload), true, 'a transient failure retries and then succeeds')
	assert.equal(calls.length, 4, 'two attempts for the transient path')

	queued.push(invalidResponse, invalidResponse, invalidResponse)
	await assert.rejects(httpPort.save(payload), 'an unverifiable read-back rejects')
	assert.equal(calls.length, 7, 'unverifiable read-back exhausts the attempt limit then fails')
} finally {
	globalThis.fetch = realFetch
	globalThis.setTimeout = realSetTimeout
}

console.log('Persistence save checks passed')