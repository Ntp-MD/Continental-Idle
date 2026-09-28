import { test, expect, type Page } from '@playwright/test'
import {
	bootWithOneFloor, canvasGeometry, dragPaletteTo, dropBrush, importAsset, objectGroup,
	objectTransforms, paintWall, placedObjects, selectionBoxes, selectionRects, userToPage,
} from './canvasFixtures'

// 60x20 viewBox on the 25px seed grid derives to a 2x1 tile asset, so its box is 50x25 and
// rotation is observable. A square asset swaps to identical dimensions and shows nothing.
const SVG_WIDE = '<svg viewBox="0 0 60 20"><rect x="1" y="1" width="58" height="18"/></svg>'

/**
 * The last two unexercised canvas gestures, on the production build: rotate (R) and flatten.
 * Rotation is where the placement gate meets a transform - `rotateSelected` clamps, gates the
 * swapped box and then rotates the walkable tiles - and flatten is the one command that writes
 * a new origin into the registry and has to roll it back when the gate refuses the merge.
 */

test('R rotates an object in 90 degree steps, swapping its box and back', async ({ page }) => {
	await bootWithOneFloor(page)
	await importAsset(page, 'Rotate Test', { svg: SVG_WIDE, tiles: '2 by 1' })
	const geo = await canvasGeometry(page)
	const t = geo.tileSize

	await dragPaletteTo(page, { x: geo.cx - t * 4, y: geo.cy - t * 3 }, 'Rotate Test')
	const placed = await placedObjects(page)
	expect(placed).toHaveLength(1)

	const at = await userToPage(page, placed[0]!.x + t / 2, placed[0]!.y + t / 2)
	await page.mouse.click(at.x, at.y)
	await expect(selectionRects(page)).toHaveCount(1)

	const upright = await selectionBoxes(page)
	expect(upright[0]!.w).toBe(t * 2)
	expect(upright[0]!.h).toBe(t)

	await page.keyboard.press('r')
	await expect.poll(() => rotationOf(page)).toMatch(/rotate\(90/)
	const sideways = await selectionBoxes(page)
	expect(sideways[0]!.w).toBe(t)
	expect(sideways[0]!.h).toBe(t * 2)

	// Three more quarter turns bring it home: a full cycle must not leave a residual rotation
	// or a box that drifted by a pixel.
	await page.keyboard.press('r')
	await expect.poll(() => rotationOf(page)).toMatch(/rotate\(180/)
	await page.keyboard.press('r')
	await expect.poll(() => rotationOf(page)).toMatch(/rotate\(270/)
	await page.keyboard.press('r')
	// Polled, not snapshotted: the box is a rendered attribute, so reading it straight after
	// the keypress can catch the pre-rotation frame and look like a rotation that never lands.
	await expect.poll(() => rotationOf(page)).not.toMatch(/rotate\(/)
	await expect
		.poll(async () => (await selectionBoxes(page))[0])
		.toEqual(upright[0])
})

const rotationOf = async (page: Page): Promise<string> => {
	const [transform = ''] = await objectTransforms(page)
	return transform
}

test('a rotation that would land on painted wall geometry is refused with a reason', async ({ page }) => {
	await bootWithOneFloor(page)
	await importAsset(page, 'Blocker', { svg: SVG_WIDE, tiles: '2 by 1' })
	const geo = await canvasGeometry(page)
	const t = geo.tileSize

	// Two objects would not do: both are decorative art, and art is exempt as the placed side by
	// design, so an art-on-art rotation is allowed. Painted cells are never exempt. The box is
	// 2x1, so rotating it in place grows it one tile downward - the wall goes exactly there.
	const upper = { x: geo.cx - t * 6, y: geo.cy - t * 4 }
	await dragPaletteTo(page, upper, 'Blocker')
	const [placed] = await placedObjects(page)

	await paintWall(page,
		{ x: upper.x, y: upper.y + t },
		{ x: upper.x + t, y: upper.y + t * 2 },
	)
	await dropBrush(page)

	const at = await userToPage(page, placed!.x + t / 2, placed!.y + t / 2)
	await page.mouse.click(at.x, at.y)
	await expect(selectionRects(page)).toHaveCount(1)
	await expect(objectGroup(page)).not.toHaveClass(/editor__object--collapsed/)
	const boxBefore = await selectionBoxes(page)

	await page.keyboard.press('r')
	await expect(page.getByRole('alert').filter({ hasText: 'Cannot rotate' })).toBeVisible()
	// Refused outright: the box is untouched and the object is still not inside the wall.
	expect(await selectionBoxes(page)).toEqual(boxBefore)
	await expect(objectGroup(page)).not.toHaveClass(/editor__object--collapsed/)
})

test('flatten merges a pair into one placed object and one new origin', async ({ page }) => {
	await bootWithOneFloor(page)
	await importAsset(page, 'Merge Me', { svg: SVG_WIDE, tiles: '2 by 1' })
	const geo = await canvasGeometry(page)
	const t = geo.tileSize

	const a = { x: geo.cx + t * 4, y: geo.cy + t * 5 }
	const b = { x: geo.cx + t * 6, y: geo.cy + t * 5 }
	await dragPaletteTo(page, a, 'Merge Me')
	await dragPaletteTo(page, b, 'Merge Me')
	expect(await placedObjects(page)).toHaveLength(2)

	// Select both, then flatten from the properties panel.
	const first = await placedObjects(page)
	const pa = await userToPage(page, first[0]!.x + t / 2, first[0]!.y + t / 2)
	await page.mouse.click(pa.x, pa.y)
	const pb = await userToPage(page, first[1]!.x + t / 2, first[1]!.y + t / 2)
	await page.keyboard.down('Shift')
	await page.mouse.click(pb.x, pb.y)
	await page.keyboard.up('Shift')
	await expect(selectionRects(page)).toHaveCount(2)

	const assetsBefore = await page.locator('.assets__item').count()
	await page.getByRole('button', { name: 'Flatten to SVG Asset' }).click()
	await page.getByRole('button', { name: 'Flatten', exact: true }).click()

	await expect.poll(async () => (await placedObjects(page)).length).toBe(1)
	await expect(page.locator('.assets__item')).toHaveCount(assetsBefore + 1)
})
