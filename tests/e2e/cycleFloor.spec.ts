import { test, expect } from '@playwright/test'
import {
	addFloorViaManager, bootWithOneFloor, canvasGeometry, dragPaletteTo, importAsset,
	placedObjects, selectionRects, switchFloorViaNav, userToPage,
} from './canvasFixtures'

/**
 * Pins the loop-12 fix: the alt-cycle cache holds object refs for one floor, and only
 * `tryCycleSelect` ever cleared it, so after a floor switch a click on a cluster could hand
 * back an id belonging to the previous floor - selecting something that is not on screen.
 *
 * The repro needs the stale state to be reachable, which is why it is built the way it is:
 * two floors, each holding a stacked pair at the same user-space point, so the distance check
 * that drives cycling is satisfied across the floor boundary.
 */
test('the alt-cycle cache does not carry object refs across a floor switch', async ({ page }) => {
	await bootWithOneFloor(page)
	await importAsset(page, 'Cross Floor')
	const geo = await canvasGeometry(page)
	const t = geo.tileSize

	// Decorative art is exempt as the placed side, so a stack of two is reachable without
	// disabling the placement gate.
	const stack = { x: geo.cx - t * 3, y: geo.cy - t * 2 }
	await dragPaletteTo(page, stack)
	await dragPaletteTo(page, stack)
	const onStack = await userToPage(page, stack.x + t / 2, stack.y + t / 2)

	// Build the cycle candidate list on floor 1.
	await page.mouse.click(onStack.x, onStack.y)
	await expect(selectionRects(page)).toHaveCount(1)

	// Same coordinates, second floor, same stacked pair.
	await addFloorViaManager(page)
	await switchFloorViaNav(page, 'F2')
	await dragPaletteTo(page, stack)
	await dragPaletteTo(page, stack)
	const floorTwo = await placedObjects(page)
	expect(floorTwo).toHaveLength(2)

	await page.mouse.click(onStack.x, onStack.y)
	await expect(selectionRects(page), 'a floor-2 object is selected, not a stale floor-1 id').toHaveCount(1)

	// The decisive check: the selection is real on THIS floor, so nudging moves one of them.
	await page.keyboard.press('ArrowRight')
	const afterNudge = await placedObjects(page)
	const moved = afterNudge.filter((o, i) => o.x !== floorTwo[i]!.x)
	expect(moved, 'the selected object belongs to the visible floor and responded to the nudge').toHaveLength(1)
})
