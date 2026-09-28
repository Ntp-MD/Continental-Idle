/**
 * png.ts - a minimal 8-bit RGBA PNG encoder.
 *
 * The harness must be able to hand the agent an actual picture of the geometry, and the
 * repo adds no image dependency for it: node:zlib supplies DEFLATE, so all that is left is
 * the container. Writes true-colour RGBA, filter type 0 per scanline, no interlace.
 */
import zlib from 'node:zlib'

const CRC_TABLE = (() => {
	const table = new Int32Array(256)
	for (let n = 0; n < 256; n++) {
		let c = n
		for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
		table[n] = c
	}
	return table
})()

function crc32(bytes: Buffer): number {
	let crc = -1
	for (let i = 0; i < bytes.length; i++) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8)
	return (crc ^ -1) >>> 0
}

function chunk(type: string, data: Buffer): Buffer {
	const length = Buffer.alloc(4)
	length.writeUInt32BE(data.length, 0)
	const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
	const crc = Buffer.alloc(4)
	crc.writeUInt32BE(crc32(body), 0)
	return Buffer.concat([length, body, crc])
}

export interface Rgb {
	r: number
	g: number
	b: number
}

export function parseHexColor(hex: string, fallback: Rgb): Rgb {
	const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
	if (!match) return fallback
	const value = Number.parseInt(match[1], 16)
	return { r: (value >> 16) & 0xff, g: (value >> 8) & 0xff, b: value & 0xff }
}

/** Rasterises an RGBA buffer into a PNG file body. */
export function encodePng(width: number, height: number, rgba: Uint8Array): Buffer {
	if (rgba.length !== width * height * 4) {
		throw new Error(`encodePng: expected ${width * height * 4} bytes, got ${rgba.length}`)
	}
	const header = Buffer.alloc(13)
	header.writeUInt32BE(width, 0)
	header.writeUInt32BE(height, 4)
	header[8] = 8 // bit depth
	header[9] = 6 // colour type: RGBA
	header[10] = 0 // deflate
	header[11] = 0 // filter
	header[12] = 0 // no interlace

	const stride = width * 4
	const raw = Buffer.alloc((stride + 1) * height)
	for (let y = 0; y < height; y++) {
		raw[y * (stride + 1)] = 0 // filter: none
		rgba.subarray(y * stride, (y + 1) * stride).forEach((byte, i) => {
			raw[y * (stride + 1) + 1 + i] = byte
		})
	}

	return Buffer.concat([
		Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
		chunk('IHDR', header),
		chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
		chunk('IEND', Buffer.alloc(0)),
	])
}

export class Raster {
	readonly data: Uint8Array

	constructor(readonly width: number, readonly height: number, background: Rgb) {
		this.data = new Uint8Array(width * height * 4)
		this.fill(background)
	}

	fill(color: Rgb): void {
		for (let i = 0; i < this.width * this.height; i++) this.setPixel(i % this.width, (i / this.width) | 0, color)
	}

	setPixel(x: number, y: number, color: Rgb, alpha = 255): void {
		if (x < 0 || y < 0 || x >= this.width || y >= this.height) return
		const i = (y * this.width + x) * 4
		this.data[i] = color.r
		this.data[i + 1] = color.g
		this.data[i + 2] = color.b
		this.data[i + 3] = alpha
	}

	fillRect(x0: number, y0: number, w: number, h: number, color: Rgb): void {
		for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) this.setPixel(x, y, color)
	}

	strokeRect(x0: number, y0: number, w: number, h: number, color: Rgb): void {
		for (let x = x0; x < x0 + w; x++) {
			this.setPixel(x, y0, color)
			this.setPixel(x, y0 + h - 1, color)
		}
		for (let y = y0; y < y0 + h; y++) {
			this.setPixel(x0, y, color)
			this.setPixel(x0 + w - 1, y, color)
		}
	}

	line(x0: number, y0: number, x1: number, y1: number, color: Rgb): void {
		const dx = Math.abs(x1 - x0)
		const dy = -Math.abs(y1 - y0)
		const sx = x0 < x1 ? 1 : -1
		const sy = y0 < y1 ? 1 : -1
		let err = dx + dy
		let x = x0
		let y = y0
		for (let guard = 0; guard < 100_000; guard++) {
			this.setPixel(x, y, color)
			if (x === x1 && y === y1) return
			const e2 = 2 * err
			if (e2 >= dy) {
				err += dy
				x += sx
			}
			if (e2 <= dx) {
				err += dx
				y += sy
			}
		}
	}

	toPng(): Buffer {
		return encodePng(this.width, this.height, this.data)
	}
}

/** 5x7 bitmap glyphs, enough to label rooms and axes on a plan without a font dependency. */
const GLYPHS: Record<string, string[]> = {
	' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
	A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
	B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
	C: ['.####', '#....', '#....', '#....', '#....', '#....', '.####'],
	D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
	E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
	F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
	G: ['.####', '#....', '#....', '#..##', '#...#', '#...#', '.###.'],
	H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
	I: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'],
	J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
	K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
	L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
	M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
	N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
	O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
	P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
	Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
	R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
	S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
	T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
	U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
	V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
	W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
	X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
	Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
	Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
	'0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
	'1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
	'2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
	'3': ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
	'4': ['#..#.', '#..#.', '#..#.', '#####', '...#.', '...#.', '...#.'],
	'5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
	'6': ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'],
	'7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
	'8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
	'9': ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
	'-': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'],
	'.': ['.....', '.....', '.....', '.....', '.....', '.##..', '.##..'],
	':': ['.....', '.##..', '.##..', '.....', '.##..', '.##..', '.....'],
	'/': ['....#', '...#.', '...#.', '..#..', '.#...', '.#...', '#....'],
	'#': ['.#.#.', '#####', '.#.#.', '.#.#.', '#####', '.#.#.', '.#.#.'],
	'!': ['..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
	'?': ['.###.', '#...#', '....#', '..##.', '..#..', '.....', '..#..'],
	'(': ['...#.', '..#..', '.#...', '.#...', '.#...', '..#..', '...#.'],
	')': ['.#...', '..#..', '...#.', '...#.', '...#.', '..#..', '.#...'],
	',': ['.....', '.....', '.....', '.....', '.##..', '.##..', '.#...'],
	'=': ['.....', '.....', '#####', '.....', '#####', '.....', '.....'],
	'*': ['.....', '#.#.#', '.###.', '#####', '.###.', '#.#.#', '.....'],
	'+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
	'%': ['#...#', '...#.', '...#.', '..#..', '.#...', '.#...', '#...#'],
	'<': ['...#.', '..#..', '.#...', '#....', '.#...', '..#..', '...#.'],
	'>': ['.#...', '..#..', '...#.', '....#', '...#.', '..#..', '.#...'],
	'[': ['.###.', '.#...', '.#...', '.#...', '.#...', '.#...', '.###.'],
	']': ['.###.', '...#.', '...#.', '...#.', '...#.', '...#.', '.###.'],
	_ : ['.....', '.....', '.....', '.....', '.....', '.....', '#####'],
}

/** Draws `text` with the top-left at (x,y) at `scale` pixels per glyph cell. */
export function drawText(raster: Raster, text: string, x: number, y: number, scale: number, color: Rgb): void {
	const upper = text.toUpperCase()
	let cursor = x
	for (const char of upper) {
		const glyph = GLYPHS[char] ?? GLYPHS['?']
		for (let row = 0; row < 7; row++) {
			for (let col = 0; col < 5; col++) {
				if (glyph[row][col] !== '#') continue
				raster.fillRect(cursor + col * scale, y + row * scale, scale, scale, color)
			}
		}
		cursor += 6 * scale
	}
}

export function textWidth(text: string, scale: number): number {
	return text.length * 6 * scale
}
