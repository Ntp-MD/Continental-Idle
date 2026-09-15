import assert from 'node:assert/strict'
import { state } from '../src/blueprint-editor/store/state'
import { saveBlueprintData } from '../src/blueprint-editor/store/persistence'
import { buildBlueprintData } from '../src/blueprint-editor/store/dataLoader'

const originalFetch = globalThis.fetch
const calls: Array<{ method?: string; save: string | null }> = []
let mode: 'ok' | 'tooLarge' = 'ok'

globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
	const headers = (init?.headers ?? {}) as Record<string, string>
	calls.push({ method: init?.method, save: headers['X-Blueprint-Save'] ?? null })
	if (mode === 'tooLarge') return new Response('', { status: 413 })
	const data = buildBlueprintData(state.layout, state.assetRegistry, state.layout.npcConfig, state.tagDefinitions)
	return new Response(JSON.stringify({ ok: true, data }), { status: 200, headers: { 'content-type': 'application/json' } })
}) as typeof fetch

try {
	mode = 'ok'
	const ok = await saveBlueprintData()
	assert.equal(ok, true, 'save returns true on a verified response')
	assert.equal(calls.length, 1, 'one POST attempt on success')
	assert.equal(calls[0].method, 'POST', 'uses POST')
	assert.equal(calls[0].save, '1', 'sets the save header')

	const floor = state.layout.floors[0]
	assert.ok(floor, 'expected at least one floor')
	const originalName = floor.name
	floor.name = 'MUTATED-SHOULD-REVERT'
	mode = 'tooLarge'
	await assert.rejects(saveBlueprintData(), 'save rejects on 413')
	assert.equal(calls.length, 2, '413 fails without retry')
	assert.equal(state.layout.floors[0].name, originalName, 'state reverts to the last saved snapshot on failure')
} finally {
	globalThis.fetch = originalFetch
}

console.log('Persistence save checks passed')