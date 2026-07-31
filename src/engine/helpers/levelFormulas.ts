/**
 * Shared XP and level-up cost formulas used by staff and assassin managers.
 *
 * XP-to-next follows an exponential curve: baseCost * multiplier^level.
 * Level-up cost follows: baseCost * costFactor * multiplier^exponent.
 */

export function getXpToNext(level: number, baseCost: number, multiplier: number): number {
	return Math.ceil(baseCost * Math.pow(multiplier, level))
}

export function getLevelUpCost(baseCost: number, costFactor: number, multiplier: number, exponent: number): number {
	return Math.ceil(baseCost * costFactor * Math.pow(multiplier, exponent))
}
