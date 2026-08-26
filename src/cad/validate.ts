import type { CadFloorPlan, CadRoom } from './types'
import { BLD } from './spec'

export interface CadIssue {
	floorId: string
	kind: string
	message: string
}

const EPS = 0.02
const ADJ = 0.35

function overlapArea(a: CadRoom, b: CadRoom): number {
	const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
	const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
	return w > 0 && h > 0 ? w * h : 0
}

function sharesEdge(a: CadRoom, b: CadRoom): boolean {
	const aX1 = a.x + a.w
	const bX1 = b.x + b.w
	const aY1 = a.y + a.h
	const bY1 = b.y + b.h
	const near = (p: number, q: number) => Math.abs(p - q) < ADJ
	const vSpan = Math.min(aY1, bY1) - Math.max(a.y, b.y)
	const hSpan = Math.min(aX1, bX1) - Math.max(a.x, b.x)
	if ((near(aY1, b.y) || near(bY1, a.y)) && hSpan > 0.6) return true
	if ((near(aX1, b.x) || near(bX1, a.x)) && vSpan > 0.6) return true
	return false
}

export function validateBuilding(floors: CadFloorPlan[]): CadIssue[] {
	const issues: CadIssue[] = []
	const globalIds = new Set<string>()
	const globalNums = new Set<string>()

	for (const f of floors) {
		for (const r of f.rooms) {
			if (globalIds.has(r.id)) issues.push({ floorId: f.id, kind: 'duplicate-id', message: `Duplicate room id ${r.id}` })
			globalIds.add(r.id)
			if (r.roomNumber) {
				if (globalNums.has(r.roomNumber)) issues.push({ floorId: f.id, kind: 'duplicate-number', message: `Duplicate room number ${r.roomNumber}` })
				globalNums.add(r.roomNumber)
			}
			if (!(r.w > 0) || !(r.h > 0)) issues.push({ floorId: f.id, kind: 'dimension', message: `Non-positive size on ${r.id}` })
			if (r.x < BLD.extWall - EPS || r.y < -EPS * 10 || r.x + r.w > BLD.w - BLD.extWall + EPS || r.y + r.h > BLD.d - BLD.extWall + EPS) {
				issues.push({ floorId: f.id, kind: 'bounds', message: `${r.id} outside building envelope (${r.x.toFixed(2)},${r.y.toFixed(2)},${(r.x + r.w).toFixed(2)},${(r.y + r.h).toFixed(2)})` })
			}
			if (r.category === 'guest' && !r.bathroom && r.type !== 'entry-hall' && r.type !== 'sitting-area' && !r.suite && (r.w * r.h < 14 || r.w * r.h > 60)) {
				issues.push({ floorId: f.id, kind: 'area', message: `Implausible guest area ${(r.w * r.h).toFixed(1)} sqm on ${r.id}` })
			}
		}
		for (let i = 0; i < f.rooms.length; i++) {
			for (let j = i + 1; j < f.rooms.length; j++) {
				const a = f.rooms[i]
				const b = f.rooms[j]
				const solid = (r: CadRoom) => r.draw === 'shaft' || r.draw === 'elevator' || r.draw === 'void'
				if (solid(a) || solid(b)) continue
				const ov = overlapArea(a, b)
				if (ov > EPS) issues.push({ floorId: f.id, kind: 'overlap', message: `${a.id} overlaps ${b.id} by ${ov.toFixed(2)} sqm` })
			}
		}
	}

	for (const f of floors) {
		if (f.level === 'R') continue
		const passable = f.rooms.filter(r => !['shaft', 'elevator', 'stair', 'void'].includes(r.draw ?? 'plain') || r.category === 'circulation')
		const start = passable.find(r => r.type === 'corridor')
		if (!start) {
			issues.push({ floorId: f.id, kind: 'connectivity', message: 'No corridor room found' })
			continue
		}
		const seen = new Set<string>([start.id])
		const queue = [start]
		while (queue.length > 0) {
			const cur = queue.pop()
			if (!cur) break
			for (const other of passable) {
				if (seen.has(other.id)) continue
				if (sharesEdge(cur, other)) {
					seen.add(other.id)
					queue.push(other)
				}
			}
		}
		for (const r of passable) {
			if (!seen.has(r.id) && r.category !== 'service') {
				issues.push({ floorId: f.id, kind: 'connectivity', message: `${r.id} (${r.name || r.type}) not reachable from corridor` })
			}
		}
	}

	const coreFloors = floors.filter(f => f.level !== 'R')
	const coreStairRects = new Map<string, string>()
	for (const f of coreFloors) {
		const s = f.rooms.find(r => r.id === `core-stair-${f.id}`)
		if (!s) {
			issues.push({ floorId: f.id, kind: 'core', message: 'Core stair SC-1 missing' })
			continue
		}
		const key = [s.x, s.y, s.w, s.h].map(v => v.toFixed(2)).join(',')
		coreStairRects.set(key, coreStairRects.get(key) ?? f.id)
	}
	if (coreStairRects.size > 1) {
		issues.push({ floorId: [...coreStairRects.values()].join('+'), kind: 'stacking', message: 'Core stair not vertically aligned across all levels' })
	}

	for (const f of coreFloors) {
		const lifts = f.rooms.filter(r => r.draw === 'elevator')
		if (lifts.length !== 4) issues.push({ floorId: f.id, kind: 'elevators', message: `Expected 4 elevator shafts, found ${lifts.length}` })
		const stairs = f.rooms.filter(r => r.draw === 'stair')
		if (stairs.length !== 3) issues.push({ floorId: f.id, kind: 'stairs', message: `Expected 3 stairs (SC-A, SC-1, SC-B), found ${stairs.length}` })
	}

	const guestLevels = floors.filter(f => ['2', '3', '4', '5', '6', '7', '8', '9'].includes(f.level))
	const bathSig = new Map<string, string>()
	for (const f of guestLevels) {
		for (const r of f.rooms.filter(x => x.bathroom)) {
			const key = [r.x, r.y, r.w, r.h].map(v => v.toFixed(2)).join(',')
			bathSig.set(key, bathSig.get(key) ?? f.id)
		}
	}
	const bathCount = guestLevels.map(f => f.rooms.filter(x => x.bathroom).length)
	if (new Set(bathCount).size > 1) {
		issues.push({ floorId: 'guest', kind: 'stacking', message: `Bathroom counts differ across typical floors: ${bathCount.join(',')}` })
	}

	return issues
}

export function validateFixtures(floors: CadFloorPlan[]): CadIssue[] {
	const issues: CadIssue[] = []
	for (const f of floors) {
		for (const fx of f.fixtures) {
			if (f.level === 'R') continue
			const inside = f.rooms.some(
				r => r.draw !== 'shaft' && r.draw !== 'elevator' &&
					fx.x >= r.x - EPS && fx.y >= r.y - EPS && fx.x + fx.w <= r.x + r.w + EPS && fx.y + fx.h <= r.y + r.h + EPS,
			)
			if (!inside) {
				issues.push({ floorId: f.id, kind: 'fixture-bounds', message: `${fx.kind} at (${fx.x},${fx.y}) not contained in any room` })
			}
		}
		for (const dr of f.doors) {
			if (dr.open) continue
			const onEdge = f.rooms.some(r => {
				const t = dr.t ?? BLD.partWall
				if (dr.orient === 'h') {
					return Math.abs(dr.y - r.y) < t || Math.abs(dr.y - (r.y + r.h)) < t
				}
				return Math.abs(dr.x - r.x) < t || Math.abs(dr.x - (r.x + r.w)) < t
			})
			if (!onEdge) issues.push({ floorId: f.id, kind: 'door-edge', message: `Door at (${dr.x},${dr.y}) not on any room edge` })
		}
	}
	return issues
}

export function validateSvgOutput(svgs: Array<{ level: string; svg: string }>): CadIssue[] {
	const issues: CadIssue[] = []
	for (const { level, svg } of svgs) {
		if (!svg.startsWith('<svg')) issues.push({ floorId: level, kind: 'svg', message: 'Missing svg root' })
		if (!svg.includes('</svg>')) issues.push({ floorId: level, kind: 'svg', message: 'Unclosed svg root' })
		if (svg.includes('NaN') || svg.includes('undefined')) issues.push({ floorId: level, kind: 'svg', message: 'Invalid numeric output in svg' })
		const opens = (svg.match(/<g[ >]/g) ?? []).length
		const closes = (svg.match(/<\/g>/g) ?? []).length
		if (opens !== closes) issues.push({ floorId: level, kind: 'svg', message: `Unbalanced g elements (${opens} vs ${closes})` })
		for (const group of ['id="structural"', 'id="walls"', 'id="columns"', 'id="rooms"', 'id="doors"', 'id="windows"', 'id="shafts"', 'id="elevators"', 'id="stairs"', 'id="furniture"', 'id="dimensions"', 'id="labels"', 'id="annotations"']) {
			if (!svg.includes(group)) issues.push({ floorId: level, kind: 'svg', message: `Missing group ${group}` })
		}
	}
	return issues
}
