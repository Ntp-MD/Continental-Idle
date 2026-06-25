import { gameState } from './game-state'
import { eventBus } from './event-bus'

interface UpgradeDefinition {
  id: string
  name: string
  description: string
  cost: number
}

export const UPGRADES: UpgradeDefinition[] = [
  { id: 'privateWing', name: 'Private Wing', description: 'Unlocks Sommelier staff hire', cost: 5_000_000 },
]

export function getUpgradeDef(id: string): UpgradeDefinition | undefined {
  return UPGRADES.find(u => u.id === id)
}

export function isUpgradePurchased(id: string): boolean {
  const state = gameState.get()
  const theme = state.themes[state.activeTheme]
  if (!theme) return false
  return theme.upgrades.includes(id)
}

export function purchaseUpgrade(id: string): boolean {
  const state = gameState.get()
  const theme = state.themes[state.activeTheme]
  if (!theme) return false

  const def = getUpgradeDef(id)
  if (!def) return false
  if (theme.upgrades.includes(id)) return false
  if (theme.currency < def.cost) return false

  theme.currency -= def.cost
  theme.upgrades.push(id)
  eventBus.emit('upgrade:purchased', { id })
  eventBus.emit('income:update')
  return true
}
