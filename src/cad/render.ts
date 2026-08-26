import type { CadDimension, CadDoor, CadFloorPlan, CadRoom } from './types'
import { BLD, COL, GRID_LETTERS, SCALE, XS, YS } from './spec'
import { P, fixtureSymbol } from './symbols'

const INK = '#20262b'
const MID = '#3a4046'
const FAINT = '#8b9299'
const POCHE = '#2c3237'
const FONT = "Consolas, 'Courier New', monospace"

const SHEET_W = 1402
const SHEET_H = 918
const ORG_X = 112
const ORG_Y = 104

function fmtMm(m: number): string {
	return String(Math.round(m * 1000))
}

function esc(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function text(x: number, y: number, s: string, size: number, opts: { fill?: string; anchor?: string; bold?: boolean; rotate?: number } = {}): string {
	const weight = opts.bold ? ' font-weight="bold"' : ''
	const rot = opts.rotate ? ` transform="rotate(${opts.rotate},${x},${y})"` : ''
	return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" fill="${opts.fill ?? INK}" text-anchor="${opts.anchor ?? 'middle'}"${weight}${rot}>${esc(s)}</text>`
}

function drawEnvelope(): string {
	const w = P(BLD.w)
	const h = P(BLD.d)
	const t = P(BLD.extWall)
	return `<path d="M0 0 L${w} 0 L${w} ${h} L0 ${h} Z M${t} ${t} L${t} ${h - t} L${w - t} ${h - t} L${w - t} ${t} Z" fill="${POCHE}" fill-rule="evenodd"/>`
}

function roomFill(r: CadRoom): string {
	if (r.draw === 'void') return ''
	let fill = '#ffffff'
	if (r.category === 'circulation') fill = '#f3f4f5'
	else if (r.category === 'service') fill = '#fafaf8'
	if (r.draw === 'terrace') {
		return `<rect x="${P(r.x)}" y="${P(r.y)}" width="${P(r.w)}" height="${P(r.h)}" fill="#fbfaf5"/><rect x="${P(r.x)}" y="${P(r.y)}" width="${P(r.w)}" height="${P(r.h)}" fill="url(#terrace-hatch)"/>`
	}
	return `<rect x="${P(r.x)}" y="${P(r.y)}" width="${P(r.w)}" height="${P(r.h)}" fill="${fill}"/>`
}

function roomStroke(r: CadRoom): string {
	const sw = r.category === 'service' ? 0.6 : 0.85
	return `<rect x="${P(r.x)}" y="${P(r.y)}" width="${P(r.w)}" height="${P(r.h)}" fill="none" stroke="${INK}" stroke-width="${sw}"/>`
}

function drawColumns(): string {
	const s = COL * SCALE
	const out: string[] = []
	for (const x of XS) {
		for (const y of YS) {
			out.push(`<rect x="${P(x) - s / 2}" y="${P(y) - s / 2}" width="${s}" height="${s}" fill="${POCHE}"/>`)
		}
	}
	return out.join('')
}

function drawGrid(): string {
	const out: string[] = []
	const ext = 26
	XS.forEach((x, i) => {
		const cx = ORG_X + P(x)
		out.push(`<line x1="${cx}" y1="${ORG_Y - ext}" x2="${cx}" y2="${ORG_Y + P(BLD.d) + 14}" stroke="${FAINT}" stroke-width="0.5" stroke-dasharray="10 3 2 3"/>`)
		const by = ORG_Y - 32
		out.push(`<circle cx="${cx}" cy="${by}" r="10" fill="#ffffff" stroke="${MID}" stroke-width="0.9"/>`)
		out.push(text(cx, by + 3.5, GRID_LETTERS[i], 10, { bold: true }))
	})
	YS.forEach((y, i) => {
		const cy = ORG_Y + P(y)
		out.push(`<line x1="${ORG_X - ext}" y1="${cy}" x2="${ORG_X + P(BLD.w) + 14}" y2="${cy}" stroke="${FAINT}" stroke-width="0.5" stroke-dasharray="10 3 2 3"/>`)
		const bx = ORG_X - 32
		out.push(`<circle cx="${bx}" cy="${cy}" r="10" fill="#ffffff" stroke="${MID}" stroke-width="0.9"/>`)
		out.push(text(bx, cy + 3.5, String(i + 1), 10, { bold: true }))
	})
	return `<g>${out.join('')}</g>`
}

function doorGap(d: CadDoor): string {
	const t = d.t ?? BLD.partWall
	if (d.orient === 'h') return `<rect x="${P(d.x)}" y="${P(d.y) - P(t) / 2}" width="${P(d.len)}" height="${P(t)}" fill="#ffffff"/>`
	return `<rect x="${P(d.x) - P(t) / 2}" y="${P(d.y)}" width="${P(t)}" height="${P(d.len)}" fill="#ffffff"/>`
}

function windowGlyph(win: { x: number; y: number; len: number; orient: 'h' | 'v'; storefront?: boolean }): string {
	const t = BLD.extWall
	const out: string[] = []
	if (win.orient === 'h') {
		const x = P(win.x)
		const y = P(win.y) - P(t) / 2
		const wpx = P(win.len)
		out.push(`<rect x="${x}" y="${y}" width="${wpx}" height="${P(t)}" fill="#ffffff"/>`)
		out.push(`<rect x="${x}" y="${y}" width="${wpx}" height="${P(t)}" fill="none" stroke="${INK}" stroke-width="0.7"/>`)
		out.push(`<line x1="${x}" y1="${y + P(t) / 2}" x2="${x + wpx}" y2="${y + P(t) / 2}" stroke="${INK}" stroke-width="${win.storefront ? 0.9 : 0.55}"/>`)
		if (!win.storefront) out.push(`<line x1="${x}" y1="${y + P(t) * 0.28}" x2="${x + wpx}" y2="${y + P(t) * 0.28}" stroke="${FAINT}" stroke-width="0.4"/>`)
	} else {
		const x = P(win.x) - P(t) / 2
		const y = P(win.y)
		const hpx = P(win.len)
		out.push(`<rect x="${x}" y="${y}" width="${P(t)}" height="${hpx}" fill="#ffffff"/>`)
		out.push(`<rect x="${x}" y="${y}" width="${P(t)}" height="${hpx}" fill="none" stroke="${INK}" stroke-width="0.7"/>`)
		out.push(`<line x1="${x + P(t) / 2}" y1="${y}" x2="${x + P(t) / 2}" y2="${y + hpx}" stroke="${INK}" stroke-width="${win.storefront ? 0.9 : 0.55}"/>`)
	}
	return out.join('')
}

function doorSwing(d: CadDoor): string {
	const len = P(d.len)
	const out: string[] = []
	const leafStyle = `stroke="${MID}" stroke-width="1.1" fill="none"`
	const arcStyle = `stroke="${MID}" stroke-width="0.5" fill="none" opacity="0.45"`
	if (d.orient === 'h') {
		const hx = P(d.hinge === 0 ? d.x : d.x + d.len)
		const hy = P(d.y)
		if (d.double) {
			const half = len / 2
			const mx = P(d.x + d.len / 2)
			for (const side of [0, 1]) {
				const jx = side === 0 ? P(d.x) : P(d.x + d.len)
				out.push(`<line x1="${jx}" y1="${hy}" x2="${jx}" y2="${hy - d.swing! * half}" ${leafStyle}/>`)
				const sweep = side === 0 ? (d.swing === 1 ? 0 : 1) : d.swing === 1 ? 1 : 0
				out.push(`<path d="M ${mx} ${hy} A ${half} ${half} 0 0 ${sweep} ${jx} ${hy - d.swing! * half}" ${arcStyle}/>`)
			}
		} else {
			const tipY = hy - d.swing! * len
			out.push(`<line x1="${hx}" y1="${hy}" x2="${hx}" y2="${tipY}" ${leafStyle}/>`)
			const sx = d.hinge === 0 ? P(d.x + d.len) : P(d.x)
			const sweep = (d.hinge === 1) !== (d.swing === -1) ? 1 : 0
			out.push(`<path d="M ${sx} ${hy} A ${len} ${len} 0 0 ${sweep} ${hx} ${tipY}" ${arcStyle}/>`)
		}
	} else {
		const hy = P(d.hinge === 0 ? d.y : d.y + d.len)
		const hx = P(d.x)
		if (d.double) {
			const half = len / 2
			const my = P(d.y + d.len / 2)
			for (const side of [0, 1]) {
				const jy = side === 0 ? P(d.y) : P(d.y + d.len)
				out.push(`<line x1="${hx}" y1="${jy}" x2="${hx + d.swing! * half}" y2="${jy}" ${leafStyle}/>`)
				const sweep = side === 0 ? (d.swing === -1 ? 0 : 1) : d.swing === 1 ? 1 : 0
				out.push(`<path d="M ${hx} ${my} A ${half} ${half} 0 0 ${sweep} ${hx + d.swing! * half} ${jy}" ${arcStyle}/>`)
			}
		} else {
			const tipX = hx + d.swing! * len
			out.push(`<line x1="${hx}" y1="${hy}" x2="${tipX}" y2="${hy}" ${leafStyle}/>`)
			const sy = d.hinge === 0 ? P(d.y + d.len) : P(d.y)
			const sweep = (d.hinge === 1) !== (d.swing === -1) ? 1 : 0
			out.push(`<path d="M ${hx} ${sy} A ${len} ${len} 0 0 ${sweep} ${tipX} ${hy}" ${arcStyle}/>`)
		}
	}
	return out.join('')
}

function drawStair(r: CadRoom): string {
	const x = P(r.x)
	const y = P(r.y)
	const w = P(r.w)
	const h = P(r.h)
	const well = 5
	const flightW = (w - well) / 2
	const landingH = P(1.15)
	const runLen = h - landingH - P(0.35)
	const risers = 9
	const treadH = runLen / risers
	const flightsTop = y + landingH + P(0.35)
	const midX = x + w / 2
	const out: string[] = []
	out.push(`<rect x="${x}" y="${y}" width="${w}" height="${landingH}" fill="none" stroke="${MID}" stroke-width="0.5"/>`)
	for (const fx of [x, midX + well / 2]) {
		out.push(`<rect x="${fx}" y="${flightsTop}" width="${flightW}" height="${runLen}" fill="none" stroke="${MID}" stroke-width="0.5"/>`)
		for (let i = 1; i < risers; i++) {
			out.push(`<line x1="${fx}" y1="${flightsTop + treadH * i}" x2="${fx + flightW}" y2="${flightsTop + treadH * i}" stroke="${MID}" stroke-width="0.45"/>`)
		}
	}
	const ax = midX + well / 2 + flightW / 2
	const ay = flightsTop + runLen - 4
	out.push(`<polyline points="${ax},${ay} ${ax},${y + landingH * 0.55} ${x + flightW * 0.5},${y + landingH * 0.55} ${x + flightW * 0.5},${y + landingH + runLen * 0.45}" fill="none" stroke="${INK}" stroke-width="0.9"/>`)
	out.push(`<polygon points="${x + flightW * 0.5},${y + landingH + runLen * 0.45 + 5} ${x + flightW * 0.5 - 4},${y + landingH + runLen * 0.45 - 4} ${x + flightW * 0.5 + 4},${y + landingH + runLen * 0.45 - 4}" fill="${INK}"/>`)
	out.push(`<line x1="${midX + well / 2 + 2}" y1="${flightsTop + runLen * 0.42}" x2="${midX + well / 2 + flightW - 2}" y2="${flightsTop + runLen * 0.42 + 12}" stroke="#ffffff" stroke-width="2.4"/>`)
	out.push(`<line x1="${midX + well / 2 + 2}" y1="${flightsTop + runLen * 0.42}" x2="${midX + well / 2 + flightW - 2}" y2="${flightsTop + runLen * 0.42 + 12}" stroke="${INK}" stroke-width="1.2"/>`)
	return out.join('')
}

function drawElevator(r: CadRoom, id: string): string {
	const x = P(r.x)
	const y = P(r.y)
	const w = P(r.w)
	const h = P(r.h)
	const out: string[] = []
	out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${INK}" stroke-width="0.85"/>`)
	out.push(`<line x1="${x}" y1="${y}" x2="${x + w}" y2="${y + h}" stroke="${FAINT}" stroke-width="0.4"/>`)
	out.push(`<line x1="${x + w}" y1="${y}" x2="${x}" y2="${y + h}" stroke="${FAINT}" stroke-width="0.4"/>`)
	out.push(`<rect x="${x + 3}" y="${y + 4}" width="${w - 6}" height="${h - 8}" fill="none" stroke="${MID}" stroke-width="0.6"/>`)
	const dw = P(1.1)
	out.push(`<rect x="${x + w / 2 - dw / 2}" y="${y - 3}" width="${dw}" height="3" fill="#ffffff"/>`)
	out.push(`<line x1="${x + w / 2 - dw / 2 + 1}" y1="${y}" x2="${x + w / 2 - 1}" y2="${y}" stroke="${INK}" stroke-width="1"/>`)
	out.push(`<line x1="${x + w / 2 + 1}" y1="${y}" x2="${x + w / 2 + dw / 2 - 1}" y2="${y}" stroke="${INK}" stroke-width="1"/>`)
	out.push(text(x + w / 2, y + h / 2 + 3, id, 7.5, { fill: MID }))
	return out.join('')
}

function drawShaftRoom(r: CadRoom): string {
	const x = P(r.x)
	const y = P(r.y)
	const w = P(r.w)
	const h = P(r.h)
	return `<line x1="${x}" y1="${y}" x2="${x + w}" y2="${y + h}" stroke="${FAINT}" stroke-width="0.4"/><line x1="${x + w}" y1="${y}" x2="${x}" y2="${y + h}" stroke="${FAINT}" stroke-width="0.4"/>`
}

function drawDim(d: CadDimension): string {
	const out: string[] = []
	const horizontal = Math.abs(d.y1 - d.y2) < 0.001
	const x1 = ORG_X + P(d.x1)
	const y1 = ORG_Y + P(d.y1)
	const x2 = ORG_X + P(d.x2)
	const y2 = ORG_Y + P(d.y2)
	out.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${MID}" stroke-width="0.5"/>`)
	for (const [tx, ty] of [
		[x1, y1],
		[x2, y2],
	]) {
		out.push(`<line x1="${tx - 3.5}" y1="${ty + 3.5}" x2="${tx + 3.5}" y2="${ty - 3.5}" stroke="${MID}" stroke-width="0.9"/>`)
	}
	if (horizontal && d.refY !== undefined) {
		const ry = ORG_Y + P(d.refY)
		if (Math.abs(ry - y1) > 3) {
			out.push(`<line x1="${x1}" y1="${ry}" x2="${x1}" y2="${y1}" stroke="${FAINT}" stroke-width="0.4"/>`)
			out.push(`<line x1="${x2}" y1="${ry}" x2="${x2}" y2="${y2}" stroke="${FAINT}" stroke-width="0.4"/>`)
		}
	}
	if (!horizontal && d.refX !== undefined) {
		const rx = ORG_X + P(d.refX)
		if (Math.abs(rx - x1) > 3) {
			out.push(`<line x1="${rx}" y1="${y1}" x2="${x1}" y2="${y1}" stroke="${FAINT}" stroke-width="0.4"/>`)
			out.push(`<line x1="${rx}" y1="${y2}" x2="${x2}" y2="${y2}" stroke="${FAINT}" stroke-width="0.4"/>`)
		}
	}
	const label = d.text ?? fmtMm(horizontal ? Math.abs(d.x2 - d.x1) : Math.abs(d.y2 - d.y1))
	const mx = (x1 + x2) / 2
	const my = (y1 + y2) / 2
	if (horizontal) {
		out.push(text(mx, my - 3.5, label, 8, { fill: MID }))
	} else {
		out.push(text(mx - 3.5, my, label, 8, { fill: MID, rotate: -90 }))
	}
	return out.join('')
}

function roomLabels(plan: CadFloorPlan): string[] {
	const out: string[] = []
	for (const r of plan.rooms) {
		if (r.category === 'guest' || r.type.startsWith('suite') || r.suite) continue
		if (r.draw === 'shaft' || r.draw === 'void') continue
		if (r.w * r.h < 1.2) continue
		const cx = ORG_X + P(r.x + r.w / 2)
		let cy = ORG_Y + P(r.y + r.h / 2)
		if (r.showArea) {
			out.push(text(cx, cy - 4, `${r.name.toUpperCase()}`, 7.5, { bold: true }))
			cy += 9
			out.push(text(cx, cy, `${r.area.toFixed(1)} SQM`, 6.5, { fill: MID }))
		} else if (r.h > 1.6) {
			out.push(text(cx, cy + 2.5, r.name.toUpperCase(), 7, {}))
		} else {
			out.push(text(cx, cy + 2, r.name.toUpperCase(), 6, {}))
		}
	}
	for (const r of plan.rooms) {
		if (!(r.category === 'guest' || r.suite)) continue
		if (!r.roomNumber) continue
		const cx = ORG_X + P(r.x + r.w / 2)
		const cy = ORG_Y + P(r.y + r.h / 2)
		out.push(text(cx, cy, r.roomNumber, 11, { bold: true }))
		out.push(text(cx, cy + 9.5, r.name.toUpperCase(), 5.8, { fill: MID }))
	}
	return out
}

function titleBlock(plan: CadFloorPlan): string {
	const bw = 400
	const bh = 170
	const bx = SHEET_W - 14 - bw
	const by = SHEET_H - 14 - bh
	const out: string[] = []
	out.push(`<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="#ffffff" stroke="${INK}" stroke-width="1.4"/>`)
	out.push(`<text x="${bx + 14}" y="${by + 30}" font-family="${FONT}" font-size="19" font-weight="bold" fill="${INK}">CONTINENTAL HOTEL</text>`)
	out.push(`<text x="${bx + 14}" y="${by + 48}" font-family="${FONT}" font-size="9" fill="${MID}">ELEVEN-STOREY URBAN HOTEL - OVERALL PLAN SET</text>`)
	out.push(`<line x1="${bx}" y1="${by + 60}" x2="${bx + bw}" y2="${by + 60}" stroke="${INK}" stroke-width="0.8"/>`)
	out.push(text(bx + 14, by + 82, plan.name.toUpperCase(), 12, { anchor: 'start', bold: true }))
	out.push(text(bx + 14, by + 97, `LEVEL ${plan.level}`, 8.5, { anchor: 'start', fill: MID }))
	out.push(text(bx + bw - 14, by + 82, plan.drawingNo, 15, { anchor: 'end', bold: true }))
	out.push(text(bx + bw - 14, by + 97, `KEYS ${plan.stats.keys} - GFA ${plan.stats.gfa.toFixed(1)} SQM`, 7.5, { anchor: 'end', fill: MID }))
	out.push(`<line x1="${bx}" y1="${by + 108}" x2="${bx + bw}" y2="${by + 108}" stroke="${INK}" stroke-width="0.8"/>`)
	out.push(text(bx + 14, by + 128, 'SCALE 1:100 @ A1', 8.5, { anchor: 'start', fill: MID }))
	out.push(text(bx + 160, by + 128, 'DATE 2026-08-25', 8.5, { anchor: 'start', fill: MID }))
	out.push(text(bx + 290, by + 128, 'REV 0', 8.5, { anchor: 'start', fill: MID }))
	out.push(text(bx + 14, by + 146, `STRUCTURAL GRID ${(XS[1] - XS[0]).toFixed(1)} M - FLOOR TO FLOOR ${(BLD.floorH * 1000).toFixed(0)} MM`, 7.5, { anchor: 'start', fill: FAINT }))
	out.push(text(bx + 14, by + 158, 'DIMENSIONS IN MILLIMETES. AREAS NET INTERNAL.', 7, { anchor: 'start', fill: FAINT }))
	return out.join('')
}

function legend(): string {
	const lx = 34
	const ly = SHEET_H - 186
	const out: string[] = []
	out.push(`<rect x="${lx}" y="${ly}" width="300" height="172" fill="#ffffff" stroke="${INK}" stroke-width="1"/>`)
	out.push(text(lx + 12, ly + 18, 'LEGEND', 9.5, { anchor: 'start', bold: true }))
	const rows: [string, string][] = [
		['STRUCTURAL COLUMN / EXTERNAL WALL', 'poch'],
		['PARTITION WALL 200 MM', 'wall'],
		['LIGHT PARTITION 100 MM', 'light'],
		['WINDOW / STOREFRONT GLAZING', 'win'],
		['DOOR SWING 900-1100 MM', 'door'],
		['PLUMBING / MEP RISER SHAFT', 'shaft'],
		['FIXTURES AND FURNITURE', 'fix'],
	]
	rows.forEach((row, i) => {
		const ry = ly + 36 + i * 18
		switch (row[1]) {
			case 'poch':
				out.push(`<rect x="${lx + 12}" y="${ry - 5}" width="34" height="7" fill="${POCHE}"/>`)
				break
			case 'wall':
				out.push(`<line x1="${lx + 12}" y1="${ry - 1}" x2="${lx + 46}" y2="${ry - 1}" stroke="${INK}" stroke-width="1.6"/>`)
				break
			case 'light':
				out.push(`<line x1="${lx + 12}" y1="${ry - 1}" x2="${lx + 46}" y2="${ry - 1}" stroke="${MID}" stroke-width="0.7"/>`)
				break
			case 'win':
				out.push(`<rect x="${lx + 12}" y="${ry - 5}" width="34" height="7" fill="none" stroke="${INK}" stroke-width="0.7"/><line x1="${lx + 12}" y1="${ry - 1.5}" x2="${lx + 46}" y2="${ry - 1.5}" stroke="${INK}" stroke-width="0.5"/>`)
				break
			case 'door':
				out.push(`<line x1="${lx + 12}" y1="${ry + 2}" x2="${lx + 24}" y2="${ry + 2}" stroke="${MID}" stroke-width="1"/><path d="M ${lx + 24} ${ry + 2} A 12 12 0 0 0 ${lx + 36} ${ry - 10}" stroke="${MID}" stroke-width="0.5" fill="none" opacity="0.5"/>`)
				break
			case 'shaft':
				out.push(`<rect x="${lx + 12}" y="${ry - 6}" width="14" height="11" fill="none" stroke="${FAINT}" stroke-width="0.5"/><line x1="${lx + 12}" y1="${ry - 6}" x2="${lx + 26}" y2="${ry + 5}" stroke="${FAINT}" stroke-width="0.4"/><line x1="${lx + 26}" y1="${ry - 6}" x2="${lx + 12}" y2="${ry + 5}" stroke="${FAINT}" stroke-width="0.4"/>`)
				break
			default:
				out.push(`<rect x="${lx + 12}" y="${ry - 5}" width="20" height="9" fill="none" stroke="${MID}" stroke-width="0.6"/>`)
		}
		out.push(text(lx + 56, ry + 2.5, row[0], 7.5, { anchor: 'start', fill: MID }))
	})
	return out.join('')
}

function northArrow(): string {
	const cx = SHEET_W - 70
	const cy = 54
	return `<circle cx="${cx}" cy="${cy}" r="17" fill="#ffffff" stroke="${INK}" stroke-width="1"/><polygon points="${cx},${cy - 13} ${cx - 6},${cy + 9} ${cx},${cy + 4}" fill="${INK}"/><polygon points="${cx},${cy - 13} ${cx + 6},${cy + 9} ${cx},${cy + 4}" fill="#ffffff" stroke="${INK}" stroke-width="0.7"/>${text(cx, cy + 30, 'N', 10, { bold: true })}`
}

function scaleBar(): string {
	const x = 380
	const y = SHEET_H - 40
	const seg = 2 * SCALE
	const out: string[] = []
	for (let i = 0; i < 5; i++) {
		out.push(`<rect x="${x + i * seg}" y="${y}" width="${seg}" height="5" fill="${i % 2 === 0 ? POCHE : '#ffffff'}" stroke="${INK}" stroke-width="0.6"/>`)
	}
	out.push(text(x, y - 4, '0', 7, { fill: MID }))
	out.push(text(x + seg * 5, y - 4, '10 M', 7, { fill: MID }))
	return out.join('')
}

export function renderFloorSvg(plan: CadFloorPlan): string {
	const parts: string[] = []
	parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SHEET_W} ${SHEET_H}" font-family="${FONT}">`)
	parts.push('<defs><pattern id="terrace-hatch" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M 0 8 L 8 0" stroke="#b9bec4" stroke-width="0.5"/></pattern></defs>')
	parts.push(`<rect width="${SHEET_W}" height="${SHEET_H}" fill="#ffffff"/>`)
	parts.push(`<g id="sheet-frame"><rect x="8" y="8" width="${SHEET_W - 16}" height="${SHEET_H - 16}" fill="none" stroke="${INK}" stroke-width="2"/><rect x="14" y="14" width="${SHEET_W - 28}" height="${SHEET_H - 28}" fill="none" stroke="${INK}" stroke-width="0.8"/></g>`)

	parts.push('<g id="building">')
	parts.push(drawGrid())
	parts.push('<g id="structural">')
	parts.push('</g>')
	parts.push('<g id="rooms">')
	for (const r of plan.rooms) parts.push(roomFill(r))
	parts.push('</g>')
	parts.push('<g id="walls">')
	parts.push(drawEnvelope())
	for (const r of plan.rooms) {
		if (r.draw !== 'elevator' && r.draw !== 'stair') parts.push(roomStroke(r))
	}
	parts.push('</g>')
	parts.push('<g id="columns">')
	parts.push(drawColumns())
	parts.push('</g>')
	parts.push('<g id="windows">')
	for (const win of plan.windows) parts.push(windowGlyph(win))
	parts.push('</g>')
	parts.push('<g id="doors">')
	for (const d of plan.doors) parts.push(doorGap(d))
	for (const d of plan.doors) if (!d.open) parts.push(doorSwing(d))
	parts.push('</g>')
	parts.push('<g id="shafts">')
	for (const r of plan.rooms) if (r.draw === 'shaft') parts.push(drawShaftRoom(r))
	parts.push('</g>')
	parts.push('<g id="elevators">')
	for (const r of plan.rooms) if (r.draw === 'elevator') parts.push(drawElevator(r, r.name))
	parts.push('</g>')
	parts.push('<g id="stairs">')
	for (const r of plan.rooms) if (r.draw === 'stair') parts.push(drawStair(r))
	parts.push('</g>')
	parts.push('<g id="furniture">')
	for (const f of plan.fixtures) {
		const sym = fixtureSymbol(f)
		if (sym) parts.push(`<g transform="${sym.pos}">${sym.body}</g>`)
	}
	parts.push('</g>')
	parts.push('<g id="circulation">')
	parts.push('</g>')
	parts.push('<g id="dimensions">')
	for (const d of plan.dimensions) parts.push(drawDim(d))
	parts.push('</g>')
	parts.push('<g id="labels">')
	parts.push(roomLabels(plan).join(''))
	parts.push('</g>')
	parts.push('<g id="annotations">')
	for (const n of plan.notes) {
		const size = n.size ?? 8
		parts.push(text(ORG_X + P(n.x), ORG_Y + P(n.y), n.text, size, { anchor: n.anchor ?? 'middle', rotate: n.rotate, bold: n.bold, fill: n.bold ? INK : MID }))
	}
	parts.push('</g>')
	parts.push('</g>')

	parts.push(titleBlock(plan))
	parts.push(legend())
	parts.push(northArrow())
	parts.push(scaleBar())
	parts.push('</svg>')
	return parts.join('\n')
}
