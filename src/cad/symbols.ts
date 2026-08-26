import type { CadFixture } from './types'

export const P = (m: number): number => Math.round(m * 28 * 100) / 100

const S = 'stroke="#33383f" stroke-width="0.6" fill="none"'

function bed(w: number, h: number): string {
	const pw = P(1.35)
	const px = (P(w) - pw) / 2
	return `<rect x="0.3" y="0.3" width="${P(w) - 0.6}" height="${P(h) - 0.6}" ${S}/><line x1="0.3" y1="${P(0.55)}" x2="${P(w) - 0.3}" y2="${P(0.55)}" stroke="#33383f" stroke-width="0.5"/><rect x="${px}" y="${P(0.12)}" width="${pw}" height="${P(0.4)}" ${S}/><line x1="${P(w) - 0.3}" y1="0.3" x2="${P(w) - P(0.55)}" y2="${P(h) - 0.3}" stroke="#33383f" stroke-width="0.4"/>`
}

function singleBed(w: number, h: number): string {
	return `<rect x="0.3" y="0.3" width="${P(w) - 0.6}" height="${P(h) - 0.6}" ${S}/><line x1="0.3" y1="${P(0.45)}" x2="${P(w) - 0.3}" y2="${P(0.45)}" stroke="#33383f" stroke-width="0.5"/><rect x="${(P(w) - P(0.7)) / 2}" y="${P(0.1)}" width="${P(0.7)}" height="${P(0.32)}" ${S}/>`
}

function chairAt(x: number, y: number, r: number): string {
	return `<rect x="${x - r}" y="${y - r}" width="${r * 2}" height="${r * 2}" ${S}/>`
}

function tableSet(n: 2 | 4 | 6, w: number, h: number): string {
	const W = P(w)
	const H = P(h)
	const parts: string[] = []
	if (n === 2) {
		parts.push(`<circle cx="${W / 2}" cy="${H / 2}" r="${Math.min(W, H) / 2 - 1}" ${S}/>`)
		parts.push(chairAt(W / 2, H / 4, P(0.18)))
		parts.push(chairAt(W / 2, (H * 3) / 4, P(0.18)))
	} else if (n === 4) {
		parts.push(`<rect x="${W * 0.25}" y="${H * 0.25}" width="${W * 0.5}" height="${H * 0.5}" ${S}/>`)
		parts.push(chairAt(W / 2, H * 0.13, P(0.17)))
		parts.push(chairAt(W / 2, H * 0.87, P(0.17)))
		parts.push(chairAt(W * 0.13, H / 2, P(0.17)))
		parts.push(chairAt(W * 0.87, H / 2, P(0.17)))
	} else {
		parts.push(`<rect x="${W * 0.22}" y="${H * 0.3}" width="${W * 0.56}" height="${H * 0.4}" ${S}/>`)
		for (const f of [0.14, 0.38, 0.62, 0.86]) {
			parts.push(chairAt(W * f, H * 0.16, P(0.16)))
			parts.push(chairAt(W * f, H * 0.84, P(0.16)))
		}
	}
	return parts.join('')
}

function sofa(w: number, h: number): string {
	return `<rect x="0.3" y="0.3" width="${P(w) - 0.6}" height="${P(h) - 0.6}" rx="2" ${S}/><line x1="0.3" y1="${P(0.28)}" x2="${P(w) - 0.3}" y2="${P(0.28)}" stroke="#33383f" stroke-width="0.5"/><line x1="${P(w) / 2}" y1="${P(0.28)}" x2="${P(w) / 2}" y2="${P(h) - 0.3}" stroke="#33383f" stroke-width="0.5"/>`
}

function toilet(w: number, _h: number): string {
	const cx = P(w) / 2
	return `<rect x="${cx - P(0.26)}" y="0.3" width="${P(0.52)}" height="${P(0.2)}" ${S}/><ellipse cx="${cx}" cy="${P(w) / 2 + P(0.12)}" rx="${P(0.19)}" ry="${P(0.26)}" ${S}/>`
}

function basin(w: number, h: number): string {
	return `<rect x="0.3" y="0.3" width="${P(w) - 0.6}" height="${Math.min(P(h) - 0.6, P(0.5))}" ${S}/><ellipse cx="${P(w) / 2}" cy="${Math.min(P(0.25), P(h) / 2)}" rx="${P(0.16)}" ry="${P(0.12)}" ${S}/>`
}

function shower(w: number, h: number): string {
	const W = P(w)
	const H = P(h)
	return `<rect x="0.3" y="0.3" width="${W - 0.6}" height="${H - 0.6}" ${S}/><circle cx="${W / 2}" cy="${H / 2}" r="1.8" ${S}/><line x1="0.3" y1="0.3" x2="${W / 2 - 1.9}" y2="${H / 2 - 1.7}" stroke="#33383f" stroke-width="0.4"/><line x1="${W - 0.3}" y1="0.3" x2="${W / 2 + 1.9}" y2="${H / 2 - 1.7}" stroke="#33383f" stroke-width="0.4"/>`
}

function tub(w: number, h: number): string {
	const W = P(w)
	const H = P(h)
	return `<rect x="0.3" y="0.3" width="${W - 0.6}" height="${H - 0.6}" rx="4" ${S}/><path d="M ${W * 0.18} ${H * 0.3} Q ${W * 0.5} ${H * 0.15} ${W * 0.82} ${H * 0.3}" ${S}/><circle cx="${W * 0.82}" cy="${H * 0.72}" r="1.6" ${S}/>`
}

export function fixtureSymbol(f: CadFixture): { pos: string; body: string; label?: string } | null {
	const w = f.w
	const h = f.h
	const rot = f.rotation ?? 0
	const pos = `translate(${P(f.x)},${P(f.y)})${rot ? ` rotate(${rot},${P(w) / 2},${P(h) / 2})` : ''}`
	switch (f.kind) {
		case 'bed-king':
			return { pos, body: bed(w, h) }
		case 'bed-single':
			return { pos, body: singleBed(w, h) }
		case 'nightstand':
			return { pos, body: `<rect x="0.3" y="0.3" width="${P(w) - 0.6}" height="${P(h) - 0.6}" ${S}/><circle cx="${P(w) / 2}" cy="${P(h) / 2}" r="2" ${S}/>` }
		case 'desk':
			return { pos, body: `<rect x="0.3" y="0.3" width="${P(w) - 0.6}" height="${P(h) * 0.55}" ${S}/>${chairAt(P(w) / 2, P(h) * 0.78, P(0.2))}` }
		case 'wardrobe':
			return { pos, body: `<rect x="0.3" y="0.3" width="${P(w) - 0.6}" height="${P(h) - 0.6}" ${S}/><line x1="${P(0.35)}" y1="${P(h) / 2}" x2="${P(w) - 0.35}" y2="${P(h) / 2}" stroke="#33383f" stroke-width="0.5"/><circle cx="${P(w) / 2}" cy="${P(h) / 2 - P(0.08)}" r="1.4" ${S}/>` }
		case 'tv':
			return { pos, body: `<rect x="0.3" y="0.3" width="${P(w) - 0.6}" height="${Math.max(2, P(h) * 0.35)}" fill="#33383f"/>` }
		case 'luggage':
			return { pos, body: `<rect x="0.3" y="0.3" width="${P(w) - 0.6}" height="${P(h) - 0.6}" ${S}/><line x1="${P(w) * 0.33}" y1="0.3" x2="${P(w) * 0.33}" y2="${P(h) - 0.3}" stroke="#33383f" stroke-width="0.4"/><line x1="${P(w) * 0.66}" y1="0.3" x2="${P(w) * 0.66}" y2="${P(h) - 0.3}" stroke="#33383f" stroke-width="0.4"/>` }
		case 'armchair':
			return { pos, body: `<rect x="0.3" y="0.3" width="${P(w) - 0.6}" height="${P(h) - 0.6}" rx="3" ${S}/><line x1="0.3" y1="${P(0.3)}" x2="${P(w) - 0.3}" y2="${P(0.3)}" stroke="#33383f" stroke-width="0.5"/>` }
		case 'sofa':
		case 'lounge-seat':
			return { pos, body: sofa(w, h) }
		case 'coffee-table':
			return { pos, body: `<rect x="0.3" y="0.3" width="${P(w) - 0.6}" height="${P(h) - 0.6}" rx="3" ${S}/>` }
		case 'dining-2':
			return { pos, body: tableSet(2, w, h) }
		case 'dining-4':
			return { pos, body: tableSet(4, w, h) }
		case 'dining-6':
			return { pos, body: tableSet(6, w, h) }
		case 'toilet':
			return { pos, body: toilet(w, h) }
		case 'basin':
			return { pos, body: basin(w, h) }
		case 'shower':
			return { pos, body: shower(w, h) }
		case 'tub':
			return { pos, body: tub(w, h) }
		case 'reception-desk': {
			const W = P(w)
			const H = P(h)
			return { pos, body: `<path d="M 2 ${H} L 2 ${H * 0.55} Q ${W * 0.5} ${-H * 0.35} ${W - 2} ${H * 0.55} L ${W - 2} ${H}" fill="#eef0f2" stroke="#33383f" stroke-width="0.7"/><path d="M ${W * 0.18} ${H} L ${W * 0.18} ${H * 0.75} M ${W * 0.82} ${H} L ${W * 0.82} ${H * 0.75}" stroke="#33383f" stroke-width="0.5" fill="none"/>` }
		}
		case 'concierge-desk':
			return { pos, body: `<rect x="0.3" y="0.3" width="${P(w) - 0.6}" height="${P(h) * 0.6}" ${S}/>${chairAt(P(w) / 2, P(h) * 0.85, P(0.2))}` }
		case 'plant':
			return { pos, body: `<circle cx="${P(w) / 2}" cy="${P(h) / 2}" r="${Math.min(P(w), P(h)) / 2 - 0.5}" ${S}/><circle cx="${P(w) / 2}" cy="${P(h) / 2}" r="${Math.min(P(w), P(h)) / 4}" ${S}/>` }
		case 'bar-counter':
			return { pos, body: `<rect x="0.3" y="${P(h) * 0.2}" width="${P(w) - 0.6}" height="${P(h) * 0.55}" rx="2" fill="#eef0f2" stroke="#33383f" stroke-width="0.7"/><line x1="0.3" y1="${P(h) * 0.85}" x2="${P(w) - 0.3}" y2="${P(h) * 0.85}" stroke="#33383f" stroke-width="0.5"/>` }
		case 'back-bar':
			return { pos, body: `<rect x="0.3" y="0.3" width="${P(w) - 0.6}" height="${P(h) * 0.4}" ${S}/>` }
		case 'service-station':
			return { pos, body: `<rect x="0.3" y="0.3" width="${P(w) - 0.6}" height="${P(h) - 0.6}" ${S}/><line x1="0.3" y1="${P(h) / 2}" x2="${P(w) - 0.3}" y2="${P(h) / 2}" stroke="#33383f" stroke-width="0.4"/>` }
		case 'prep-line': {
			const n = Math.max(2, Math.round(w / 1.2))
			const seg = (P(w) - 0.6) / n
			let s = `<rect x="0.3" y="0.3" width="${P(w) - 0.6}" height="${P(h) - 0.6}" ${S}/>`
			for (let i = 1; i < n; i++) s += `<line x1="${0.3 + seg * i}" y1="0.3" x2="${0.3 + seg * i}" y2="${P(h) - 0.3}" stroke="#33383f" stroke-width="0.4"/>`
			return { pos, body: s }
		}
		case 'range-line': {
			const n = Math.max(2, Math.round(w / 0.9))
			const seg = (P(w) - 0.6) / n
			let s = `<rect x="0.3" y="0.3" width="${P(w) - 0.6}" height="${P(h) - 0.6}" ${S}/>`
			for (let i = 0; i < n; i++) s += `<circle cx="${0.3 + seg * (i + 0.5)}" cy="${P(h) / 2}" r="${Math.min(seg / 2 - 1, P(0.16))}" ${S}/>`
			return { pos, body: s }
		}
		case 'cold-store':
			return { pos, body: `<rect x="0.3" y="0.3" width="${P(w) - 0.6}" height="${P(h) - 0.6}" ${S}/><line x1="0.3" y1="0.3" x2="${P(w) - 0.3}" y2="${P(h) - 0.3}" stroke="#33383f" stroke-width="0.4"/><line x1="${P(w) - 0.3}" y1="0.3" x2="0.3" y2="${P(h) - 0.3}" stroke="#33383f" stroke-width="0.4"/>` }
		case 'shelf':
		case 'locker':
		case 'worktable':
			return { pos, body: `<rect x="0.3" y="0.3" width="${P(w) - 0.6}" height="${P(h) - 0.6}" ${S}/><line x1="0.3" y1="${P(h) / 2}" x2="${P(w) - 0.3}" y2="${P(h) / 2}" stroke="#33383f" stroke-width="0.4"/>` }
		case 'washer': {
			const n = Math.max(1, Math.round(w / 0.8))
			const cell = (P(w) - 0.6) / n
			let s = `<rect x="0.3" y="0.3" width="${P(w) - 0.6}" height="${P(h) - 0.6}" ${S}/>`
			for (let i = 0; i < n; i++) s += `<circle cx="${0.3 + cell * (i + 0.5)}" cy="${P(h) / 2}" r="${Math.min(cell / 2 - 1.5, P(0.22))}" ${S}/>`
			return { pos, body: s }
		}
		case 'boardroom':
		case 'meeting-table': {
			const W = P(w)
			const H = P(h)
			let s = `<rect x="${W * 0.15}" y="${H * 0.3}" width="${W * 0.7}" height="${H * 0.4}" rx="3" fill="#eef0f2" stroke="#33383f" stroke-width="0.7"/>`
			const seats = Math.max(4, Math.round(w / 0.75))
			for (let i = 0; i < seats; i++) {
				const fx = W * (0.18 + (0.64 * i) / (seats - 1))
				s += chairAt(fx, H * 0.18, P(0.17))
				s += chairAt(fx, H * 0.82, P(0.17))
			}
			return { pos, body: s }
		}
		case 'piano':
			return { pos, body: `<path d="M ${P(0.2)} ${P(h) - 0.3} L ${P(0.2)} ${P(h) * 0.35} Q ${P(w) * 0.5} 0.3 ${P(w) * 0.75} ${P(h) * 0.4} L ${P(w) - 0.3} ${P(h) * 0.75} L ${P(w) - 0.3} ${P(h) - 0.3} Z" ${S}/><line x1="${P(0.2)}" y1="${P(h) * 0.62}" x2="${P(w) * 0.72}" y2="${P(h) * 0.62}" stroke="#33383f" stroke-width="0.4"/>` }
		case 'ahu':
			return { pos, body: `<rect x="0.3" y="0.3" width="${P(w) - 0.6}" height="${P(h) - 0.6}" ${S}/><line x1="${P(w) * 0.3}" y1="0.3" x2="${P(w) * 0.3}" y2="${P(h) - 0.3}" stroke="#33383f" stroke-width="0.4"/><line x1="${P(w) * 0.65}" y1="0.3" x2="${P(w) * 0.65}" y2="${P(h) - 0.3}" stroke="#33383f" stroke-width="0.4"/>` }
		case 'chiller':
			return { pos, body: `<rect x="0.3" y="0.3" width="${P(w) - 0.6}" height="${P(h) - 0.6}" ${S}/><circle cx="${P(w) * 0.3}" cy="${P(h) / 2}" r="${P(0.2)}" ${S}/><circle cx="${P(w) * 0.7}" cy="${P(h) / 2}" r="${P(0.2)}" ${S}/>` }
		case 'cooling-tower':
			return { pos, body: `<rect x="0.3" y="0.3" width="${P(w) - 0.6}" height="${P(h) - 0.6}" ${S}/><circle cx="${P(w) / 2}" cy="${P(h) / 2}" r="${Math.min(P(w), P(h)) / 3}" ${S}/><line x1="0.3" y1="0.3" x2="${P(w) - 0.3}" y2="${P(h) - 0.3}" stroke="#33383f" stroke-width="0.4"/>` }
		case 'solar-array': {
			const cols = Math.max(1, Math.round(w / 1.6))
			const rows = Math.max(1, Math.round(h / 1.1))
			const cw = (P(w) - 0.6) / cols
			const ch = (P(h) - 0.6) / rows
			let s = ''
			for (let r = 0; r < rows; r++)
				for (let c = 0; c < cols; c++)
					s += `<rect x="${0.3 + c * cw}" y="${0.3 + r * ch}" width="${cw - 1}" height="${ch - 1}" ${S}/><line x1="${0.3 + c * cw}" y1="${0.3 + r * ch}" x2="${0.3 + c * cw + cw - 1}" y2="${0.3 + r * ch + ch - 1}" stroke="#33383f" stroke-width="0.3"/>`
			return { pos, body: s }
		}
		case 'dish':
			return { pos, body: `<circle cx="${P(w) / 2}" cy="${P(h) / 2}" r="${Math.min(P(w), P(h)) / 2 - 0.5}" ${S}/><line x1="${P(w) / 2}" y1="${P(h) / 2}" x2="${P(w) / 2 + P(0.2)}" y2="${P(h) / 2 - P(0.2)}" stroke="#33383f" stroke-width="0.5"/>` }
		case 'hatch':
			return { pos, body: `<rect x="0.3" y="0.3" width="${P(w) - 0.6}" height="${P(h) - 0.6}" ${S}/><line x1="0.3" y1="0.3" x2="${P(w) - 0.3}" y2="${P(h) - 0.3}" stroke="#33383f" stroke-width="0.4"/><line x1="${P(w) - 0.3}" y1="0.3" x2="0.3" y2="${P(h) - 0.3}" stroke="#33383f" stroke-width="0.4"/>` }
		default:
			return null
	}
}
