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
  { id: 'armoryExpansion', name: 'Armory Expansion', description: 'Increases assassin cap from 3 to 4', cost: 20_000_000 },
  { id: 'continentalCharter', name: 'Continental Charter', description: 'Inactive branch income +10% (50% to 60%)', cost: 50_000_000 },
  { id: 'goldStandard', name: 'Gold Standard', description: 'Safe House interest +50%', cost: 100_000_000 },
  { id: 'diplomaticChannels', name: 'Diplomatic Channels', description: 'New BRANCHES start with 100 reputation', cost: 250_000_000 },
  { id: 'trainingGrounds', name: 'Training Grounds', description: 'Staff XP gain +20%', cost: 500_000_000 },
]

export function getUpgradeDef(id: string): UpgradeDefinition | undefined {
  return UPGRADES.find(u => u.id === id)
}

export function isUpgradePurchased(id: string): boolean {
  const state = gameState.get()
  const branch = state.branches[state.activeBranch]
  if (!branch) return false
  return branch.upgrades.includes(id)
}

export function purchaseUpgrade(id: string): boolean {
  const state = gameState.get()
  const branch = state.branches[state.activeBranch]
  if (!branch) return false

  const def = getUpgradeDef(id)
  if (!def) return false
  if (branch.upgrades.includes(id)) return false
  if (branch.currency < def.cost) return false

  branch.currency -= def.cost
  branch.upgrades.push(id)
  eventBus.emit('upgrade:purchased', { id })
  eventBus.emit('income:update')
  return true
}
