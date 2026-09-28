import { expect, type Page, type Locator } from '@playwright/test'

/**
 * Shared browser fixtures for the canvas e2e specs. Every coordinate is derived from the
 * rendered svg rather than assumed, because the view opens zoomed out: the `viewBox` is the
 * visible window in user space, not the canvas size, so treating it as the canvas puts drop
 * targets off the authored area.
 */

// 40x40 viewBox = a 2-tile footprint on the 25px seed grid.
export const SVG_ONE = '<svg viewBox="0 0 40 40"><rect x="2" y="2" width="36" height="36"/></svg>'

export interface CanvasView { tileSize: number; cx: number; cy: number }
export interface Placed { id: string; x: number; y: number }

/** Canvas user-space geometry: tile size plus the user point sitting at the viewport centre. */
export async function canvasGeometry(page: Page): Promise<CanvasView> {
	return page.evaluate(() => {
		const svg = document.querySelector('.editor__svg')
		if (!(svg instanceof SVGSVGElement)) throw new Error('canvas svg not mounted')
		const tileSize = Number(svg.querySelector('pattern#grid')?.getAttribute('width') ?? 0)
		if (!tileSize) throw new Error('tile size not readable')
		const box = svg.getBoundingClientRect()
		const ctm = svg.getScreenCTM()
		if (!ctm) throw new Error('no screen CTM')
		const p = new DOMPoint(box.x + box.width / 2, box.y + box.height / 2).matrixTransform(ctm.inverse())
		return { tileSize, cx: p.x, cy: p.y }
	})
}

/** Maps canvas user space to viewport pixels, the same inverse the app's own hit-testing uses. */
export async function userToPage(page: Page, x: number, y: number): Promise<{ x: number; y: number }> {
	return page.evaluate(([ux, uy]) => {
		const svg = document.querySelector('.editor__svg')
		if (!(svg instanceof SVGSVGElement)) throw new Error('canvas svg not mounted')
		const ctm = svg.getScreenCTM()
		if (!ctm) throw new Error('no screen CTM')
		const p = new DOMPoint(ux, uy).matrixTransform(ctm)
		return { x: p.x, y: p.y }
	}, [x, y] as const)
}

/** Placed objects read back from their rendered transform origin. */
export function placedObjects(page: Page): Promise<Placed[]> {
	return page.evaluate(() => [...document.querySelectorAll('[data-obj-id]')].map(g => {
		const m = /translate\(\s*([-\d.]+)[,\s]+([-\d.]+)\s*\)/.exec(g.getAttribute('transform') ?? '')
		return { id: g.getAttribute('data-obj-id') ?? '', x: m ? Number(m[1]) : NaN, y: m ? Number(m[2]) : NaN }
	}))
}

/** One rect per selected object; counting them is the only external read of selection size. */
export function selectionRects(page: Page): Locator {
	return page.locator('.editor__overlay.flag--active')
}

/** The rect whose `collapsed` class carries the overlap / buried-by-wall flag. */
export function objectGroup(page: Page, index = 0): Locator {
	return page.locator('[data-obj-id]').nth(index)
}

/**
 * Cold workspace, then exactly one floor. The toolbar renders in both cold states, so it is
 * the mount gate: probing `isVisible()` on an unmounted tree returns false and silently skips
 * floor creation, which is how a whole spec ends up dragging onto a floor that does not exist.
 */
export async function bootWithOneFloor(page: Page) {
	await page.goto('/')
	await expect(page.getByRole('button', { name: 'Switch to draw mode' })).toBeVisible()
	const create = page.getByRole('button', { name: 'Create the first floor' })
	if (await create.isVisible()) {
		await create.click()
		await expect(page.getByRole('status').filter({ hasText: 'Floor created' })).toBeVisible()
	}
	await expect(page.locator('.editor__title')).toContainText('F1')
}

export async function importAsset(page: Page, name: string, opts?: { svg?: string; tiles?: string }) {
	await page.getByRole('button', { name: 'Import SVG asset' }).click()
	// Name first, then markup: the viewBox parse is debounced 200ms and under parallel load it
	// can land between two fills and re-render the form mid-submit.
	await page.getByLabel('SVG asset name').fill(name)
	await page.getByLabel('SVG content').fill(opts?.svg ?? SVG_ONE)
	await expect(page.getByTitle(`Tile size ${opts?.tiles ?? '2 by 2'}`)).toBeVisible()
	await page.getByRole('button', { name: 'Import SVG', exact: true }).click()
	await expect(page.locator('.assets__item', { hasText: name })).toBeVisible()
	await page.getByRole('button', { name: 'Fit to screen' }).click()
	await page.waitForTimeout(150)
}

/** Real palette drag: mousedown on the asset row, window mousemove, mouseup over the canvas. */
export async function dragPaletteTo(page: Page, target: { x: number; y: number }, assetName?: string) {
	const row = assetName
		? page.locator('.assets__item', { hasText: assetName }).first()
		: page.locator('.assets__item').first()
	const box = await row.boundingBox()
	if (!box) throw new Error('asset row has no box')
	const end = await userToPage(page, target.x, target.y)
	await page.mouse.move(box.x + 30, box.y + box.height / 2)
	await page.mouse.down()
	// The window mousemove/mouseup listeners attach in a watcher on dragState.assetId.
	await page.waitForTimeout(80)
	await page.mouse.move(end.x, end.y, { steps: 12 })
	await page.mouse.up()
	await expect.poll(() => page.locator('[data-obj-id]').count()).toBeGreaterThan(0)
}

/** Paint a wall run with the Wall brush. Leaves the brush armed - `dropBrush` clears it. */
export async function paintWall(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
	// The brush button is a toggle, so clicking it again disarms the brush and the stroke
	// paints nothing - a second call in one test would silently test nothing.
	const wallButton = page.getByRole('button', { name: 'Paint wall tiles on the current floor' })
	const armed = await wallButton.evaluate(el => el.classList.contains('flag--active'))
	if (!armed) await wallButton.click()
	const a = await userToPage(page, from.x, from.y)
	const b = await userToPage(page, to.x, to.y)
	await page.mouse.move(a.x, a.y)
	await page.mouse.down()
	await page.mouse.move(b.x, b.y, { steps: 6 })
	await page.mouse.up()
	await page.waitForTimeout(120)
}

/**
 * Disarm the tile brush without changing the tool. `onObjectMouseDown` ignores canvas clicks
 * while a brush is armed, and in `move` mode a canvas drag pans instead of marquee-selecting -
 * so toggling the brush off keeps the app in the object mode real authoring happens in.
 */
export async function dropBrush(page: Page) {
	const wallButton = page.getByRole('button', { name: 'Paint wall tiles on the current floor' })
	if (await wallButton.evaluate(el => el.classList.contains('flag--active'))) await wallButton.click()
}

/**
 * Rubber-band select: drag across empty canvas in object mode. `onCanvasMouseDown` clears the
 * selection first, so a marquee over nothing leaves nothing selected by design.
 */
export async function marqueeSelect(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
	const a = await userToPage(page, from.x, from.y)
	const b = await userToPage(page, to.x, to.y)
	await page.mouse.move(a.x, a.y)
	await page.mouse.down()
	await page.waitForTimeout(60)
	await page.mouse.move(b.x, b.y, { steps: 10 })
	await page.mouse.up()
	await page.waitForTimeout(120)
}

/** Add a floor through the Floor Manager. The new floor does not become the current one. */
export async function addFloorViaManager(page: Page) {
	await page.getByRole('button', { name: 'Open floor manager' }).click()
	// Scoped by the modal's own id: several `role="dialog"` nodes exist at once, so an
	// unscoped lookup is ambiguous and a strict-mode failure looks like a product bug.
	const manager = page.locator('#modal-floor-manager')
	await expect(manager).toBeVisible()
	await manager.getByRole('button', { name: '+ Add', exact: true }).click()
	// The modal body has its own button literally named "Close", so the header control is
	// targeted by class rather than by accessible name.
	await manager.locator('button.modal__close').click()
}

/** Switch the current floor with the canvas floor nav - the UI that actually sets currentFloorId. */
export async function switchFloorViaNav(page: Page, label: string) {
	await page.getByRole('button', { name: 'Switch floor' }).click()
	await page.getByRole('listbox', { name: 'Floors' }).getByRole('option').filter({ hasText: label }).click()
	await expect(page.locator('.editor__title')).toContainText(label)
}

/** Rendered transform strings of every placed object, in floor order. */
export function objectTransforms(page: Page): Promise<string[]> {
	return page.evaluate(() => [...document.querySelectorAll('[data-obj-id]')]
		.map(g => g.getAttribute('transform') ?? ''))
}

/** Selection outline box per selected object: the only live read of an object's w/h. */
export function selectionBoxes(page: Page): Promise<Array<{ w: number; h: number }>> {
	return page.locator('.editor__overlay.flag--active').evaluateAll(els => els.map(e => ({
		w: Number(e.getAttribute('width')),
		h: Number(e.getAttribute('height')),
	})))
}

/** Press and hold on a placed object at a user-space point, leaving the drag in flight. */
export async function beginObjectDrag(page: Page, at: { x: number; y: number }) {
	const p = await userToPage(page, at.x, at.y)
	await page.mouse.move(p.x, p.y)
	await page.mouse.down()
	await page.waitForTimeout(80)
	return p
}
