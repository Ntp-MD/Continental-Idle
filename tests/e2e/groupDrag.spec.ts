import { test, expect } from '@playwright/test'
import {
	bootWithOneFloor, canvasGeometry, dragPaletteTo, importAsset,
	objectGroup, placedObjects, selectionRects, beginObjectDrag, userToPage,
} from './canvasFixtures'

/**
 * Group drag on the real canvas, against the production build.
 *
 * Shift-click builds a multi-selection, then grabbing one member has to move the whole group
 * by the same delta. Two separate defects used to break this, both invisible to jsdom because
 * they live in the pointer path: `onObjectMouseDown` replaced the selection with the grabbed
 * object, and even with the selection kept, `moveSelectedTo` measures its delta from the
 * primary - so a stale primary would jump the group instead of following the cursor.
 */

test.beforeEach(async ({ page }) => {
	await bootWithOneFloor(page)
	await importAsset(page, 'Group Member')
})

test('dragging one member of a multi-selection moves the whole group by one delta', async ({ page }) => {
	const geo = await canvasGeometry(page)
	const t = geo.tileSize

	await dragPaletteTo(page, { x: geo.cx - t * 5, y: geo.cy - t * 5 })
	await dragPaletteTo(page, { x: geo.cx + t * 6, y: geo.cy + t * 6 })
	const before = await placedObjects(page)
	expect(before).toHaveLength(2)

	// Click one, shift-click the other: the documented multi-selection affordance.
	const a = await userToPage(page, before[0]!.x + t, before[0]!.y + t)
	await page.mouse.click(a.x, a.y)
	await expect(selectionRects(page)).toHaveCount(1)
	const b = await userToPage(page, before[1]!.x + t, before[1]!.y + t)
	await page.keyboard.down('Shift')
	await page.mouse.click(b.x, b.y)
	await page.keyboard.up('Shift')
	await expect(selectionRects(page)).toHaveCount(2)

	// Grab the first member and drag it: the selection must survive the mousedown.
	await page.mouse.move(a.x, a.y)
	await page.mouse.down()
	await page.waitForTimeout(80)
	await expect(selectionRects(page)).toHaveCount(2)
	await page.mouse.move(a.x + t * 4, a.y + t * 4, { steps: 10 })
	await page.mouse.up()
	await expect(selectionRects(page)).toHaveCount(2)

	const after = await placedObjects(page)
	const dxa = after[0]!.x - before[0]!.x
	const dya = after[0]!.y - before[0]!.y
	expect(Math.abs(dxa)).toBeGreaterThan(t)
	expect(after[1]!.x - before[1]!.x).toBe(dxa)
	expect(after[1]!.y - before[1]!.y).toBe(dya)
})

test('dragging a group that contains a locked object says why nothing moves', async ({ page }) => {
	const geo = await canvasGeometry(page)
	const t = geo.tileSize

	await dragPaletteTo(page, { x: geo.cx - t * 5, y: geo.cy - t * 5 })
	await dragPaletteTo(page, { x: geo.cx + t * 6, y: geo.cy + t * 6 })
	const before = await placedObjects(page)
	expect(before).toHaveLength(2)

	// Lock the first member with the documented shortcut.
	const a = await userToPage(page, before[0]!.x + t, before[0]!.y + t)
	await page.mouse.click(a.x, a.y)
	await page.keyboard.press('l')
	await expect(page.getByRole('status').filter({ hasText: 'Object locked' })).toBeVisible()

	// Add the unlocked member and drag it: the store refuses the whole group because one
	// member is locked, and before this path existed it did so with no message at all.
	const b = await userToPage(page, before[1]!.x + t, before[1]!.y + t)
	await page.keyboard.down('Shift')
	await page.mouse.click(b.x, b.y)
	await page.keyboard.up('Shift')
	await expect(selectionRects(page)).toHaveCount(2)

	await page.mouse.move(b.x, b.y)
	await page.mouse.down()
	await page.waitForTimeout(80)
	await page.mouse.move(b.x + t * 4, b.y + t * 4, { steps: 10 })
	await page.mouse.up()

	await expect(page.getByRole('alert').filter({ hasText: 'it includes a locked object' })).toBeVisible()
	const after = await placedObjects(page)
	// One message per gesture, not one per animation frame.
	await expect(page.getByRole('alert').filter({ hasText: 'it includes a locked object' })).toHaveCount(1)
	expect(after[0]!.x).toBe(before[0]!.x)
	expect(after[1]!.x).toBe(before[1]!.x)
})

test('dragging an object into painted wall geometry reports the refusal once', async ({ page }) => {
	const geo = await canvasGeometry(page)
	const t = geo.tileSize

	await dragPaletteTo(page, { x: geo.cx - t * 14, y: geo.cy - t * 10 })
	const before = await placedObjects(page)
	expect(before).toHaveLength(1)

	// Paint a wall block well away from the object, then drag the object into it.
	const wall = { x: geo.cx + t * 8, y: geo.cy + t * 6 }
	await page.getByRole('button', { name: 'Paint wall tiles on the current floor' }).click()
	const from = await userToPage(page, wall.x - t * 2, wall.y - t * 2)
	const to = await userToPage(page, wall.x + t * 2, wall.y + t * 2)
	await page.mouse.move(from.x, from.y)
	await page.mouse.down()
	await page.mouse.move(to.x, to.y, { steps: 6 })
	await page.mouse.up()

	const start = await userToPage(page, before[0]!.x + t, before[0]!.y + t)
	// Painting leaves the brush armed, and `onObjectMouseDown` ignores clicks while a brush is
	// set - drop it via the tool switch before trying to drag.
	await page.getByRole('button', { name: 'Switch to move mode' }).click()
	await page.mouse.move(start.x, start.y)
	await page.mouse.down()
	await page.waitForTimeout(80)
	const target = await userToPage(page, wall.x, wall.y)
	await page.mouse.move(target.x, target.y, { steps: 12 })
	await page.mouse.up()

	// The point of this test is the feedback, not the resting position: a refused drag stops
	// dead short of the geometry, so the object ends up partway along the gesture by design.
	await expect(page.getByRole('alert').filter({ hasText: 'it overlaps another object or wall geometry' })).toBeVisible()
	await expect(page.getByRole('alert').filter({ hasText: 'it overlaps another object or wall geometry' })).toHaveCount(1)
})

test('dragging the second member anchors on it, so the group follows the cursor', async ({ page }) => {
	const geo = await canvasGeometry(page)
	const t = geo.tileSize

	await dragPaletteTo(page, { x: geo.cx - t * 5, y: geo.cy - t * 5 })
	await dragPaletteTo(page, { x: geo.cx + t * 6, y: geo.cy + t * 6 })
	const before = await placedObjects(page)
	expect(before).toHaveLength(2)

	const a = await userToPage(page, before[0]!.x + t, before[0]!.y + t)
	await page.mouse.click(a.x, a.y)
	const b = await userToPage(page, before[1]!.x + t, before[1]!.y + t)
	await page.keyboard.down('Shift')
	await page.mouse.click(b.x, b.y)
	await page.keyboard.up('Shift')
	await expect(selectionRects(page)).toHaveCount(2)

	// Grab the member that is NOT items[0]: with a stale primary the whole group would be
	// displaced by the distance between the two objects instead of by the drag delta.
	await page.mouse.move(b.x, b.y)
	await page.mouse.down()
	await page.waitForTimeout(80)
	await page.mouse.move(b.x - t * 3, b.y - t * 3, { steps: 10 })
	await page.mouse.up()

	const after = await placedObjects(page)
	const dxb = after[1]!.x - before[1]!.x
	const dyb = after[1]!.y - before[1]!.y
	expect(Math.abs(dxb)).toBeGreaterThan(t)
	expect(after[0]!.x - before[0]!.x).toBe(dxb)
	expect(after[0]!.y - before[0]!.y).toBe(dyb)
})

test('Escape during a drag releases the object instead of leaving it grabbed', async ({ page }) => {
	await bootWithOneFloor(page)
	await importAsset(page, 'Abort Test')
	const geo = await canvasGeometry(page)
	const t = geo.tileSize

	await dragPaletteTo(page, { x: geo.cx - t * 4, y: geo.cy - t * 3 })
	const [placed] = await placedObjects(page)
	const obj = objectGroup(page)

	const start = await beginObjectDrag(page, { x: placed!.x + t / 2, y: placed!.y + t / 2 })
	const mid = await userToPage(page, placed!.x + t * 6, placed!.y + t * 6)
	await page.mouse.move(mid.x, mid.y, { steps: 8 })
	await expect(obj).toHaveClass(/editor__object--dragging/)

	await page.keyboard.press('Escape')
	await expect(obj).not.toHaveClass(/editor__object--dragging/)
	await expect(selectionRects(page)).toHaveCount(0)

	// The pointer is still down and the listeners are gone, so releasing must be inert.
	await page.mouse.move(start.x, start.y, { steps: 4 })
	const afterRelease = await placedObjects(page)
	await page.mouse.up()
	await expect.poll(async () => (await placedObjects(page))[0]!.x).toBe(afterRelease[0]!.x)
})
