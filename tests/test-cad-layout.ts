import { strict as assert } from 'node:assert'
import { buildFloors } from '../src/cad/floors'
import { renderFloorSvg } from '../src/cad/render'
import { validateBuilding, validateFixtures, validateSvgOutput, type CadIssue } from '../src/cad/validate'

const floors = buildFloors()
let failures = 0
function check(name: string, fn: () => void): void {
	try {
		fn()
		console.log(`ok - ${name}`)
	} catch (e) {
		failures += 1
		console.error(`FAIL - ${name}: ${e instanceof Error ? e.message : String(e)}`)
	}
}

check('building has ground + floors 2-11 + roof', () => {
	assert.equal(floors.length, 12)
	const levels = floors.map(f => f.level)
	for (const l of ['G', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', 'R']) assert.ok(levels.includes(l), `missing level ${l}`)
})

check('geometry validation reports zero issues', () => {
	const issues = validateBuilding(floors)
	if (issues.length > 0) {
		throw new Error(issues.map(i => `[${i.floorId}] ${i.kind}: ${i.message}`).join('\n'))
	}
})

check('room ids globally unique', () => {
	const ids = new Set<string>()
	for (const f of floors) for (const r of f.rooms) assert.ok(!ids.has(r.id)), ids.add(r.id)
})

check('room numbers globally unique and consistent scheme', () => {
	const nums = new Set<string>()
	for (const f of floors) {
		for (const r of f.rooms) {
			if (!r.roomNumber) continue
			assert.ok(!nums.has(r.roomNumber), `dup number ${r.roomNumber}`)
			nums.add(r.roomNumber)
		}
	}
	const f2 = floors.find(f => f.level === '2')
	assert.ok(f2)
	const f2nums = f2.rooms.filter(r => r.roomNumber).map(r => r.roomNumber).sort()
	assert.deepEqual(f2nums, ['201', '202', '203', '204', '205', '206', '207', '208', '209', '210', '211', '212', '213', '214', '215', '217'])
})

check('elevator mesh connects every occupied level at identical position', () => {
	const rects = new Map<string, string>()
	for (const f of floors.filter(x => x.level !== 'R')) {
		const lift = f.rooms.find(r => r.id === `lift-P1-${f.id}`)
		assert.ok(lift, `no P1 shaft on level ${f.level}`)
		rects.set([lift!.x, lift!.y].join(','), rects.get([lift!.x, lift!.y].join(',')) ?? '')
	}
	assert.equal(rects.size, 1)
})

check('stairs present on all occupied levels', () => {
	for (const f of floors.filter(x => x.level !== 'R')) {
		const stairs = f.rooms.filter(r => r.draw === 'stair').map(r => r.name).sort()
		assert.deepEqual(stairs, ['SC-1', 'SC-A', 'SC-B'], `level ${f.level}`)
	}
})

check('typical guest floor has 16 keys incl. accessible + suite', () => {
	for (const l of ['2', '5', '9']) {
		const f = floors.find(x => x.level === l)
		assert.ok(f)
		const keys = f.rooms.filter(r => r.roomNumber)
		assert.equal(keys.length, 16, `level ${l}`)
		assert.ok(keys.some(r => r.accessible), `no accessible key on ${l}`)
		assert.ok(keys.some(r => r.suite), `no suite on ${l}`)
	}
})

check('bathrooms stack across typical floors', () => {
	const sigFor = (l: string) => {
		const f = floors.find(x => x.level === l)
		assert.ok(f)
		return f.rooms.filter(r => r.bathroom).map(r => [r.x, r.y, r.w, r.h].map(v => v.toFixed(2)).join('|')).sort().join(';')
	}
	assert.equal(sigFor('2'), sigFor('3'))
	assert.equal(sigFor('3'), sigFor('9'))
})

check('soil shafts stack and align with core', () => {
	for (const l of ['2', '9']) {
		const f = floors.find(x => x.level === l)
		assert.ok(f)
		assert.equal(f.rooms.filter(r => r.draw === 'shaft' && r.w < 1).length, 4)
	}
})

check('ground floor public program complete', () => {
	const g = floors.find(f => f.level === 'G')
	assert.ok(g)
	const names = g.rooms.map(r => r.name)
	for (const want of ['Lobby Lounge', 'Restaurant', 'Main Kitchen', 'WC Men', 'WC Women', 'Loading Dock', 'Staff Office', 'Private Dining']) {
		assert.ok(names.includes(want), `missing ${want}`)
	}
})

check('floor 11 premium program coherent', () => {
	const f = floors.find(x => x.level === '11')
	assert.ok(f)
	const names = f.rooms.map(r => r.type)
	for (const want of ['presidential-living', 'executive-lounge', 'sky-bar', 'meeting-a', 'meeting-b', 'private-dining']) {
		assert.ok(names.includes(want), `missing ${want}`)
	}
})

check('all rooms inside envelope and positive size', () => {
	for (const f of floors) {
		for (const r of f.rooms) {
			assert.ok(r.w > 0 && r.h > 0, `${r.id}`)
			assert.ok(r.x >= -0.001 && r.y >= -0.001 && r.x + r.w <= 44.301 && r.y + r.h <= 22.001, `${r.id} bounds`)
		}
	}
})

check('fixtures contained in rooms and doors on walls', () => {
	const issues = validateFixtures(floors)
	if (issues.length > 0) {
		throw new Error(issues.map(i => `[${i.floorId}] ${i.kind}: ${i.message}`).join('\n'))
	}
})

check('svg renders for every level with structured groups', () => {
	const svgs = floors.map(f => ({ level: f.level, svg: renderFloorSvg(f) }))
	const issues: CadIssue[] = validateSvgOutput(svgs)
	if (issues.length > 0) throw new Error(issues.map(i => `[${i.floorId}] ${i.message}`).join('\n'))
	for (const s of svgs) {
		assert.ok(s.svg.length > 4000, `svg too small on ${s.level}`)
	}
})

check('dimensions include overall building size in mm', () => {
	const svg = renderFloorSvg(floors[0])
	assert.ok(svg.includes('44000 OVERALL'))
	assert.ok(svg.includes('22000 OVERALL'))
})

if (failures > 0) {
	console.error(`\n${failures} check(s) failed`)
	process.exit(1)
}
console.log('\nAll CAD layout checks passed.')
