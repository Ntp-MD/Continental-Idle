import { test } from 'vitest'
import assert from 'node:assert/strict'
import { FIXTURES, fixtureFloors, fixtureToDataFile } from '../../scripts/arch/fixtures'
import { readBlueprintDataFile } from '../../src/blueprint-editor/store/schemaMigration'

/**
 * Every plan the design harness can draw has to be a file the editor can open.
 *
 * `arch` writes fixture payloads and reads them back through its own loader, which is looser than the
 * ingress the app uses at boot and on import - so a fixture can be perfectly measurable and still be
 * something no player could ever load. That is a one-way door the tool has been building behind itself,
 * and it is also why `arch compare` cannot rank fixtures on money: `measureTakings` reads through the
 * strict path. This is the claim stated where it can fail.
 */
/**
 * Skipped, not softened: this is the claim, and it is currently false.
 *
 * Running it reports `12 of 14 fixtures draw plans the app cannot load`. Two causes were found and one
 * is fixed - `fixtureToDataFile` now writes the full declared `npcConfig` (speed, and each role's colour,
 * focus/restricted tags and focus chance), which is what `normalizeNpcConfig` needs before it will keep a
 * role at all, and the control fixture passes strict ingress since then. The remaining 13 still fail
 * `normalizeNpcConfig` for a second reason that has not been pinned down; `tags: []` is *not* it (the
 * whole-file normalizer accepts an undeclared asset tag). The next pass should diff a passing fixture's
 * config against a failing one - the difference is the bug.
 */
const CURRENTLY_BROKEN = false

test.skipIf(CURRENTLY_BROKEN)('every fixture payload survives the ingress the editor itself uses', () => {
	const rejected: string[] = []
	for (const fixture of FIXTURES) {
		try {
			readBlueprintDataFile(fixtureToDataFile(fixture))
		} catch (error) {
			rejected.push(`${fixture.id}: ${error instanceof Error ? error.message : String(error)}`)
		}
	}
	assert.deepEqual(rejected, [], `${rejected.length} of ${FIXTURES.length} fixtures draw plans the app cannot load:\n${rejected.join('\n')}`)
})

test.skipIf(CURRENTLY_BROKEN)('a fixture payload keeps its floors and placements through the strict load', () => {
	for (const fixture of FIXTURES) {
		const drawn = fixtureToDataFile(fixture) as { layout: { floors: { objects: unknown[] }[] } }
		const loaded = readBlueprintDataFile(drawn)
		const expected = fixtureFloors(fixture)
		assert.equal(loaded.layout.floors.length, expected.length, `${fixture.id}: a floor was lost through ingress`)
		assert.equal(
			loaded.layout.floors.reduce((sum, floor) => sum + floor.objects.length, 0),
			drawn.layout.floors.reduce((sum, floor) => sum + floor.objects.length, 0),
			`${fixture.id}: a placement was dropped by the loader that drew it`,
		)
	}
})
