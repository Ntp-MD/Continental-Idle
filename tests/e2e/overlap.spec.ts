import { test, expect, type Page } from '@playwright/test'
import {
	bootWithOneFloor, canvasGeometry, importAsset, paintWall, userToPage,
} from './canvasFixtures'

/**
 * Browser-level proof of the placement rule on the real canvas drag path - the one thing
 * the jsdom suites cannot reach. Runs against the production build, so persistence is
 * IndexedDB and `src/blueprint-editor/data/blueprint-data.json` is never touched.
 *
 * Covers: a palette drag onto open floor is accepted, the ghost preview rectangle is the
 * rectangle the object actually lands on (`placementRect` == landed rect), painting a wall
 * over a placed object gives it the persistent red `editor__object--collapsed` state
 * instead of only a toast that fades, and a drag onto painted geometry is refused and adds
 * nothing.
 *
 * Every target point is derived from the rendered canvas, never from a hardcoded size: the
 * view is fitted first and points are taken from the svg's own centre, so pan and zoom
 * cannot move a drop off the authored area.
 */

// 40x40 viewBox = a 2-tile footprint on the 25px seed grid.


function ghostRect(page: Page) {
	return page.locator('.editor__svg g > rect[fill^="color-mix"]').first()
}

async function dragAssetTo(page: Page, assetName: string, target: { x: number; y: number }) {
	// Grab the row's label area, left of the reorder buttons that stop mousedown propagation.
	const row = page.locator('.assets__item', { hasText: assetName }).first()
	await row.scrollIntoViewIfNeeded()
	const box = await row.boundingBox()
	if (!box) throw new Error('asset row has no box')
	const start = { x: box.x + 30, y: box.y + box.height / 2 }
	const end = await userToPage(page, target.x, target.y)

	await page.mouse.move(start.x, start.y)
	await page.mouse.down()
	// The window mousemove/mouseup listeners attach in a watcher on dragState.assetId.
	await page.waitForTimeout(80)
	await page.mouse.move(end.x, end.y, { steps: 12 })
	await expect(ghostRect(page)).toBeVisible()
	return end
}

test('a palette drag onto open floor lands on the rect the ghost showed', async ({ page }) => {
	await bootWithOneFloor(page)
	await importAsset(page, 'Landing Test')
	const view = await canvasGeometry(page)
	const t = view.tileSize

	await dragAssetTo(page, 'Landing Test', { x: view.cx, y: view.cy })
	await expect(ghostRect(page)).toHaveAttribute('stroke', /accent-green/)
	const ghost = await ghostRect(page).evaluate(el => ({
		x: Number(el.getAttribute('x')),
		y: Number(el.getAttribute('y')),
		w: Number(el.getAttribute('width')),
		h: Number(el.getAttribute('height')),
	}))
	await page.mouse.up()

	await expect.poll(() => page.locator('[data-obj-id]').count()).toBe(1)
	const landed = await page.evaluate(() => {
		const g = document.querySelector('[data-obj-id]')
		if (!g) return null
		const m = /translate\(\s*([-\d.]+)[,\s]+([-\d.]+)\s*\)/.exec(g.getAttribute('transform') ?? '')
		return m ? { x: Number(m[1]), y: Number(m[2]) } : null
	})
	expect(landed, 'the placed object renders with a transform').not.toBeNull()
	// The ghost is drawn from the same `placementRect` the gate validates, so preview and
	// landing must agree exactly - a snapped-then-overwritten size would split them here.
	expect(landed!.x).toBe(ghost.x)
	expect(landed!.y).toBe(ghost.y)
	expect(ghost.w).toBe(t * 2)
	expect(ghost.h).toBe(t * 2)
})

test('painting a wall over a placed object keeps it flagged red after the toast fades', async ({ page }) => {
	await bootWithOneFloor(page)
	await importAsset(page, 'Burial Test')
	const view = await canvasGeometry(page)
	const t = view.tileSize

	await dragAssetTo(page, 'Burial Test', { x: view.cx, y: view.cy })
	await page.mouse.up()
	await expect.poll(() => page.locator('[data-obj-id]').count()).toBe(1)

	const obj = page.locator('[data-obj-id]').first()
	await expect(obj).not.toHaveClass(/editor__object--collapsed/)

	await paintWall(page, { x: view.cx - t * 2, y: view.cy - t * 2 }, { x: view.cx + t * 2, y: view.cy + t * 2 })

	await expect(page.getByRole('alert').filter({ hasText: 'now sit on wall geometry' })).toBeVisible()
	await expect(obj).toHaveClass(/editor__object--collapsed/)
})

test('a palette drag onto painted wall geometry is refused and adds nothing', async ({ page }) => {
	await bootWithOneFloor(page)
	await importAsset(page, 'Refusal Test')
	const view = await canvasGeometry(page)
	const t = view.tileSize

	await paintWall(page, { x: view.cx - t * 3, y: view.cy - t * 3 }, { x: view.cx + t * 3, y: view.cy + t * 3 })

	await dragAssetTo(page, 'Refusal Test', { x: view.cx, y: view.cy })
	await expect(ghostRect(page)).toHaveAttribute('stroke', /accent-red/)
	await page.mouse.up()

	await expect(page.getByRole('alert').filter({ hasText: 'it overlaps another object or wall geometry' })).toBeVisible()
	await expect(page.locator('[data-obj-id]')).toHaveCount(0)
})
