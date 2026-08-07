


export function computeBuildingCost(baseCost: number, costGrowth: number, currentLevel: number, count: number = 1): number {
  let totalCost = 0
  for (let i = 0; i < count; i++) {
    totalCost += baseCost * Math.pow(costGrowth, currentLevel + i)
  }
  return Math.ceil(totalCost)
}

export function computeAffordableLevels(baseCost: number, costGrowth: number, maxLevel: number, currentLevel: number, currency: number): number {
  const remaining = maxLevel - currentLevel
  if (remaining <= 0) return 0
  if (baseCost === 0) return remaining

  const g = costGrowth
  const baseCostAtN = baseCost * Math.pow(g, currentLevel)

  if (currency < baseCostAtN) return 0
  if (g === 1) return Math.min(remaining, Math.floor(currency / baseCostAtN))

  const levels = Math.floor(
    Math.log((currency * (g - 1) / baseCostAtN) + 1) / Math.log(g) + 1e-9
  )
  return Math.max(0, Math.min(levels, remaining))
}
