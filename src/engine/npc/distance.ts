export function octileDistance(ax: number, ay: number, bx: number, by: number): number {
	const dx = Math.abs(ax - bx)
	const dy = Math.abs(ay - by)
	return (dx + dy) + (Math.SQRT2 - 2) * Math.min(dx, dy)
}
