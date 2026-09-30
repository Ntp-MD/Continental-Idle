import { test } from 'vitest'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * These tests reproduce `seed.ts`'s cache shape rather than importing it, because the failure they
 * need - a chunk fetch that rejects - cannot be produced against a real successful JSON import. The
 * reproduction is only worth anything if it is kept honest about that, so the first test reads the
 * source and fails if the reset ever leaves the file.
 */
const SEED_SOURCE = readFileSync(path.join(process.cwd(), 'src/blueprint-editor/store/seed.ts'), 'utf8')

test('seed.ts forgets a rejected import rather than caching it', () => {
	assert.match(SEED_SOURCE, /pending\s*=\s*undefined/, 'a failed attempt must clear the cache')
	assert.match(SEED_SOURCE, /\.catch\(/, 'the reset has to hang off the promise, not a later call')
	// The reset is only safe *inside* the rejection: clearing it on the success path would make a
	// good load refetch forever.
	const catchBlock = SEED_SOURCE.slice(SEED_SOURCE.indexOf('.catch('))
	assert.ok(catchBlock.indexOf('pending = undefined') < 200, 'the reset belongs to the rejection handler')
})

test('a failed seed load is retried rather than replayed forever', async () => {
	let attempts = 0
	let pending: Promise<{ tags: string[] }> | undefined
	// The exact shape of `seed.ts`: `pending ??= import(...).then(...).catch(...)`.
	const file = () => {
		pending ??= (async () => {
			attempts++
			if (attempts === 1) throw new Error('transient chunk fetch failure')
			return { tags: ['after-recovery'] }
		})().catch((error: unknown) => {
			pending = undefined
			throw error
		})
		return pending
	}

	await assert.rejects(file(), /transient chunk fetch failure/)
	// The second call must actually try again. Without the reset it receives the cached rejection,
	// which is the defect: the load never gets a second chance.
	assert.equal(await file().then(r => r.tags[0]), 'after-recovery')
	assert.equal(attempts, 2, 'the import was retried, not replayed')
})

test('a successful seed load is still cached, so the file is fetched once', async () => {
	let attempts = 0
	let pending: Promise<{ tags: string[] }> | undefined
	const file = () => {
		pending ??= (async () => {
			attempts++
			return { tags: ['cached'] }
		})()
		return pending
	}
	await file()
	await file()
	await file()
	assert.equal(attempts, 1, 'a load that worked is not repeated')
})

test('seedVersionError reports the failure and does not pin it', async () => {
	let attempts = 0
	let pending: Promise<unknown> | undefined
	const file = () => {
		pending ??= (async () => {
			attempts++
			if (attempts === 1) throw new Error('first failure')
			return {}
		})().catch((error: unknown) => {
			pending = undefined
			throw error
		})
		return pending
	}
	const seedVersionError = async (): Promise<Error | undefined> => {
		try {
			await file()
			return undefined
		} catch (error) {
			return error instanceof Error ? error : new Error(String(error))
		}
	}

	const first = await seedVersionError()
	assert.equal(first?.message, 'first failure', 'the boot check surfaces the failure')
	// This is the whole point: a boot check that never recovers is a boot check that reports a
	// problem the player already fixed.
	const second = await seedVersionError()
	assert.equal(second, undefined, 'the next boot check re-asks instead of replaying')
	assert.equal(attempts, 2)
})