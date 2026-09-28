import { test, expect } from '@playwright/test'
import {
	bootWithOneFloor, canvasGeometry, dropBrush, importAsset, objectGroup,
	paintWall, placedObjects, selectionRects, userToPage, dragPaletteTo,
} from './canvasFixtures'

/**
 * The escape hatch, in a browser. F3 gave painted wall geometry a persistent red flag, and the
 * rule that a buried object may always be moved out is what stops that flag becoming a trap.
 * Neither half is provable in jsdom: the flag is a rendered class and the move is a pointer
 * gesture, so this is the spec that would catch a user whose object turns red and then refuses
 * to leave the wall.
 */

test('an object buried by painted wall geometry can be dragged out, and the flag clears', async ({ page }) => {
	await bootWithOneFloor(page)
	await importAsset(page, 'Escape Test')
	const geo = await canvasGeometry(page)
	const t = geo.tileSize

	const spot = { x: geo.cx - t * 3, y: geo.cy - t * 3 }
	await dragPaletteTo(page, spot)
	const [placed] = await placedObjects(page)
	expect(placed, 'the object placed').toBeTruthy()

	const obj = objectGroup(page)
	await expect(obj).not.toHaveClass(/editor__object--collapsed/)

	// Bury it.
	await paintWall(page, { x: spot.x - t * 2, y: spot.y - t * 2 }, { x: spot.x + t * 3, y: spot.y + t * 3 })
	await expect(page.getByRole('alert').filter({ hasText: 'now sit on wall geometry' })).toBeVisible()
	await expect(obj).toHaveClass(/editor__object--collapsed/)

	// Drag it out. Without the escape hatch this gesture is refused, because the drag target
	// path would compare the moving object against geometry it is already inside.
	const openFloor = { x: geo.cx + t * 16, y: geo.cy + t * 12 }
	await dropBrush(page)
	const start = await userToPage(page, placed!.x + t, placed!.y + t)
	await page.mouse.move(start.x, start.y)
	await page.mouse.down()
	await page.waitForTimeout(80)
	const end = await userToPage(page, openFloor.x, openFloor.y)
	await page.mouse.move(end.x, end.y, { steps: 14 })
	await page.mouse.up()

	const after = await placedObjects(page)
	expect(Math.abs(after[0]!.x - placed!.x), 'the buried object moved out of the wall').toBeGreaterThan(t)
	expect(after[0]!.x).toBeLessThan(openFloor.x + t * 4)
	await expect(objectGroup(page)).not.toHaveClass(/editor__object--collapsed/)
	await expect(selectionRects(page)).toHaveCount(1)
})

test('a buried object still refuses to move from one wall straight into another', async ({ page }) => {
	await bootWithOneFloor(page)
	await importAsset(page, 'Trap Test')
	const geo = await canvasGeometry(page)
	const t = geo.tileSize

	const spot = { x: geo.cx - t * 6, y: geo.cy - t * 4 }
	await dragPaletteTo(page, spot)
	const [placed] = await placedObjects(page)

	await paintWall(page, { x: spot.x - t * 2, y: spot.y - t * 2 }, { x: spot.x + t * 2, y: spot.y + t * 2 })
	await expect(objectGroup(page)).toHaveClass(/editor__object--collapsed/)

	// Second wall block, well away from the first. Drag from inside one wall into the other:
	// the escape hatch lets a buried object move, it must not let it land in more geometry.
	const other = { x: geo.cx + t * 10, y: geo.cy + t * 8 }
	await paintWall(page, { x: other.x - t * 3, y: other.y - t * 3 }, { x: other.x + t * 3, y: other.y + t * 3 })
	await dropBrush(page)

	const start = await userToPage(page, placed!.x + t, placed!.y + t)
	await page.mouse.move(start.x, start.y)
	await page.mouse.down()
	await page.waitForTimeout(80)
	const end = await userToPage(page, other.x, other.y)
	await page.mouse.move(end.x, end.y, { steps: 14 })
	await page.mouse.up()

	await expect(page.getByRole('alert').filter({ hasText: 'it overlaps another object or wall geometry' })).toBeVisible()
	// The guarantee is that it never comes to rest inside the second wall. Once the object has
	// left the first wall mid-drag it is no longer buried, so the ordinary geometry guard
	// resumes and refuses the rest of the gesture - which stops it short, wherever that is.
	const after = await placedObjects(page)
	const landedAtTarget = Math.abs(after[0]!.x - (other.x - t)) < t && Math.abs(after[0]!.y - (other.y - t)) < t
	expect(landedAtTarget, 'a refused drag must not leave the object inside the second wall').toBe(false)
})
