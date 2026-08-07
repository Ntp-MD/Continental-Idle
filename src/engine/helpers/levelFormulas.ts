


export function getXpToNext(level: number, baseCost: number, multiplier: number): number {
	return Math.ceil(baseCost * Math.pow(multiplier, level))
}

export function getLevelUpCost(baseCost: number, costFactor: number, multiplier: number, exponent: number): number {
	return Math.ceil(baseCost * costFactor * Math.pow(multiplier, exponent))
}
