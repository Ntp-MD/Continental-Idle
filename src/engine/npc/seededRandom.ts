/**
 * The seeded `random` streams the tests and tools hand the engine, in one place instead of one
 * private copy per caller. The app never imports this: the played house runs unseeded, and a seed
 * there would be a lie.
 *
 * Two generators because a swap rewrites the numbers a caller was measured on: `mulberry32` feeds
 * the test beds and the perf runs, `lcg32` feeds the arch tool's measured days and the engine tests.
 */

/** Bryc's mulberry32, the stream the test beds were recorded on. */
export function mulberry32(seed: number): () => number {
	return () => {
		seed |= 0
		seed = (seed + 0x6d2b79f5) | 0
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

/** The arch tool's stream; the `|| 1` keeps a zero seed advancing. */
export function lcg32(seed: number): () => number {
	let state = seed >>> 0 || 1
	return () => {
		state = (state * 1664525 + 1013904223) >>> 0
		return state / 4294967296
	}
}
