import { test, expect } from '@playwright/test'
import {
	bootWithOneFloor, canvasGeometry, dragPaletteTo, importAsset,
	marqueeSelect, placedObjects, selectionRects, userToPage,
} from './canvasFixtures'

/**
 * Marquee (rubber-band) selection on the real canvas, and the group drag that should follow it.
 *
 * Loop 9 fixed group dragging a shift-clicked selection; this proves the same anchor rule holds
 * for the *other* way a user builds a selection, where `hitIds` come back in floor-object order
 * rather than click order, so the primary is whichever the marquee happened to hit first.
 */

test('a marquee over two objects selects both, and dragging one moves the pair', async ({ page }) => {
	await bootWithOneFloor(page)
	await importAsset(page, 'Marquee Test')
	const geo = await canvasGeometry(page)
	const t = geo.tileSize

	await dragPaletteTo(page, { x: geo.cx - t * 6, y: geo.cy - t * 4 })
	await dragPaletteTo(page, { x: geo.cx + t * 5, y: geo.cy + t * 4 })
	const before = await placedObjects(page)
	expect(before).toHaveLength(2)

	await marqueeSelect(page,
		{ x: geo.cx - t * 10, y: geo.cy - t * 8 },
		{ x: geo.cx + t * 10, y: geo.cy + t * 8 },
	)
	await expect(selectionRects(page)).toHaveCount(2)

	// Grab the member that marquee order puts second: the anchor must follow the grabbed
	// object, not the selection order.
	const second = await userToPage(page, before[1]!.x + t, before[1]!.y + t)
	await page.mouse.move(second.x, second.y)
	await page.mouse.down()
	await page.waitForTimeout(80)
	await expect(selectionRects(page)).toHaveCount(2)
	await page.mouse.move(second.x + t * 3, second.y - t * 3, { steps: 10 })
	await page.mouse.up()

	const after = await placedObjects(page)
	const dx = after[1]!.x - before[1]!.x
	const dy = after[1]!.y - before[1]!.y
	expect(Math.abs(dx), 'the grabbed member moved').toBeGreaterThan(t)
	expect(after[0]!.x - before[0]!.x, 'the other member followed by the same delta').toBe(dx)
	expect(after[0]!.y - before[0]!.y).toBe(dy)
})

test('a marquee over empty canvas clears the selection', async ({ page }) => {
	await bootWithOneFloor(page)
	await importAsset(page, 'Clear Test')
	const geo = await canvasGeometry(page)
	const t = geo.tileSize

	await dragPaletteTo(page, { x: geo.cx - t * 4, y: geo.cy - t * 3 })
	const [placed] = await placedObjects(page)
	const onObject = await userToPage(page, placed!.x + t, placed!.y + t)
	await page.mouse.click(onObject.x, onObject.y)
	await expect(selectionRects(page)).toHaveCount(1)

	// A marquee that touches nothing must not leave a stale selection behind, or arrow-key
	// nudges and Delete would act on an object the user can no longer see is selected.
	await marqueeSelect(page,
		{ x: geo.cx + t * 8, y: geo.cy + t * 6 },
		{ x: geo.cx + t * 14, y: geo.cy + t * 12 },
	)
	await expect(selectionRects(page)).toHaveCount(0)
})

test('clicking the same spot twice cycles between two stacked objects', async ({ page }) => {
	await bootWithOneFloor(page)
	await importAsset(page, 'Cycle Test')
	const geo = await canvasGeometry(page)
	const t = geo.tileSize

	// Both land on the same cell because decorative SVG art is exempt as the placed side, so a
	// stacked pair is reachable without disabling the placement gate.
	const spot = { x: geo.cx - t * 4, y: geo.cy - t * 3 }
	await dragPaletteTo(page, spot)
	await dragPaletteTo(page, spot)
	const origin = await placedObjects(page)
	expect(origin).toHaveLength(2)

	const onStack = await userToPage(page, origin[0]!.x + t / 2, origin[0]!.y + t / 2)

	// First click selects one of the pair; a nudge moves exactly that one.
	await page.mouse.click(onStack.x, onStack.y)
	await expect(selectionRects(page)).toHaveCount(1)
	await page.keyboard.press('ArrowRight')
	const afterFirst = await placedObjects(page)
	const movedFirst = afterFirst.findIndex((o, i) => o.x !== origin[i]!.x)
	expect(movedFirst, 'the first click selected one object of the stack').toBeGreaterThanOrEqual(0)

	// Second click on the same spot should cycle to the other object, not reselect the first.
	await page.mouse.click(onStack.x + 1, onStack.y + 1)
	await expect(selectionRects(page)).toHaveCount(1)
	await page.keyboard.press('ArrowRight')
	const afterSecond = await placedObjects(page)
	const movedSecond = afterSecond.findIndex((o, i) => o.x !== afterFirst[i]!.x)
	expect(movedSecond, 'cycling moved the selection to the other object of the stack').not.toBe(movedFirst)
	expect(movedSecond).toBeGreaterThanOrEqual(0)
})
