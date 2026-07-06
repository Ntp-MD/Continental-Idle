import type { BranchId, AIOwnerState, AITemperament, EventDefinition } from '@/types'
import { gameState } from './game-state'
import { eventBus } from './event-bus'
import { BRANCHES, getBranchDef } from '@/data/branches'
import { getAIName, getAITemperamentForBranch, getTemperamentDef } from '@/data/ai-owners'
import { getBranchIncomePerSecond } from './income-engine'
import { getAIEventTemplate, buildAIEventDefinition } from '@/data/ai-events'
import type { AIEventType } from '@/data/ai-events'
export type { AIEventType } from '@/data/ai-events'

export function createAIOwner(branchId: BranchId): AIOwnerState {
  const temperament = getAITemperamentForBranch(branchId)
  const def = getTemperamentDef(temperament)
  const branchDef = getBranchDef(branchId)

  return {
    branchId,
    name: getAIName(branchId),
    temperament,
    power: def.basePower + branchDef.unlockPrestige * 100,
    maxPower: def.basePower * 3 + branchDef.unlockPrestige * 200,
    aggression: def.baseAggression,
    lastActionTick: 0,
    actionCooldown: def.baseCooldown,
    defeated: false,
    relations: 0,
    threatLevel: 0,
  }
}

export function initAIOwners(): Record<BranchId, AIOwnerState> {
  const owners: Record<BranchId, AIOwnerState> = {} as Record<BranchId, AIOwnerState>
  BRANCHES.forEach(b => {
    owners[b.id] = createAIOwner(b.id)
  })
  return owners
}

export function getAIOwner(branchId: BranchId): AIOwnerState | undefined {
  return gameState.get().aiOwners[branchId]
}

export function getAllAIOwners(): AIOwnerState[] {
  const state = gameState.get()
  return Object.values(state.aiOwners)
}

export function getActiveAIOwners(): AIOwnerState[] {
  const state = gameState.get()
  return Object.values(state.aiOwners).filter(o =>
    !o.defeated &&
    !state.worldMap.unlockedBranches.includes(o.branchId) &&
    o.branchId !== state.hqBranch
  )
}

export function getPlayerPower(): number {
  const state = gameState.get()
  let power = 0
  state.worldMap.unlockedBranches.forEach(branchId => {
    const branch = state.branches[branchId]
    if (!branch) return
    power += getBranchIncomePerSecond(branchId) * 10
    power += Object.values(branch.assassins).length * 200
    power += Object.values(branch.staff).length * 50
    power += branch.prestige * 500
  })
  power += state.totalPrestige * 1000
  return Math.round(power)
}

export function getPowerBalance(): { player: number; ai: number; ratio: number } {
  const playerPower = getPlayerPower()
  const aiPower = getActiveAIOwners().reduce((sum, o) => sum + o.power, 0)
  const ratio = aiPower > 0 ? playerPower / aiPower : Infinity
  return { player: playerPower, ai: aiPower, ratio }
}

export function getThreatLevel(branchId: BranchId): 'low' | 'medium' | 'high' | 'critical' {
  const owner = getAIOwner(branchId)
  if (!owner || owner.defeated) return 'low'
  const playerPower = getPlayerPower()
  if (owner.power > playerPower * 2) return 'critical'
  if (owner.power > playerPower * 1.3) return 'high'
  if (owner.power > playerPower * 0.7) return 'medium'
  return 'low'
}

export function tickAIOwners(_tickCount: number): void {
  const activeOwners = getActiveAIOwners()
  if (activeOwners.length === 0) return

  const playerPower = getPlayerPower()

  activeOwners.forEach(owner => {
    const def = getTemperamentDef(owner.temperament)

    // Power growth
    owner.power = Math.min(owner.maxPower, owner.power + def.powerGrowthPerTick)

    // Threat assessment
    if (owner.power > playerPower * 1.5) {
      owner.threatLevel = Math.min(10, owner.threatLevel + 0.1)
    } else if (owner.power < playerPower * 0.5) {
      owner.threatLevel = Math.max(0, owner.threatLevel - 0.1)
    }

    // Relations drift toward 0
    if (owner.relations > 0) owner.relations = Math.max(0, owner.relations - 0.01)
    if (owner.relations < 0) owner.relations = Math.min(0, owner.relations + 0.005)
  })
}

export function pickAIEvent(owner: AIOwnerState, playerPower: number): AIEventType | null {
  const temperamentActions: Record<AITemperament, AIEventType[]> = {
    aggressive: ['raid', 'raid', 'provocation', 'tribute'],
    diplomatic: ['tribute', 'truce', 'provocation', 'spy'],
    shadow: ['sabotage', 'spy', 'sabotage', 'raid'],
    defensive: ['truce', 'spy', 'tribute'],
  }

  const actions = temperamentActions[owner.temperament]
  if (!actions || actions.length === 0) return null

  const validActions = actions.filter(action => {
    // Power-based conditions — AI must be strong enough to attempt aggressive actions
    if (action === 'raid' && owner.power < playerPower * 0.5) return false
    if (action === 'tribute' && owner.power < playerPower * 0.8) return false
    if (action === 'sabotage' && owner.power < playerPower * 0.4) return false
    if (action === 'provocation' && owner.power < playerPower * 0.6) return false

    // Relations-based conditions — AI won't attack allies or offer truces to enemies
    if (action === 'raid' && owner.relations > 20) return false
    if (action === 'tribute' && owner.relations > 30) return false
    if (action === 'sabotage' && owner.relations > 10) return false
    if (action === 'provocation' && owner.relations > 15) return false
    if (action === 'truce' && owner.relations < -20) return false
    if (action === 'truce' && owner.threatLevel < 2) return false

    // Spy is always available — low-cost intelligence gathering

    return true
  })

  if (validActions.length === 0) return null
  return validActions[Math.floor(Math.random() * validActions.length)]
}

export function defeatAIOwner(branchId: BranchId): void {
  const owner = gameState.get().aiOwners[branchId]
  if (!owner) return
  owner.defeated = true
  owner.power = 0
  owner.threatLevel = 0
  eventBus.emit('ai:defeated', { branchId, ownerName: owner.name })
}

export function improveRelations(branchId: BranchId, amount: number): void {
  const owner = gameState.get().aiOwners[branchId]
  if (!owner) return
  owner.relations = Math.min(100, owner.relations + amount)
}

export function worsenRelations(branchId: BranchId, amount: number): void {
  const owner = gameState.get().aiOwners[branchId]
  if (!owner) return
  owner.relations = Math.max(-100, owner.relations - amount)
}

const GIFT_COST = 500_000
const TRUCE_COST = 5

export function canSendGift(branchId: BranchId): boolean {
  const state = gameState.get()
  const owner = state.aiOwners[branchId]
  if (!owner || owner.defeated) return false
  const branch = state.branches[state.activeBranch]
  if (!branch) return false
  return branch.currency >= GIFT_COST
}

export function sendGift(branchId: BranchId): boolean {
  const state = gameState.get()
  const owner = state.aiOwners[branchId]
  if (!owner || owner.defeated) return false
  const branch = state.branches[state.activeBranch]
  if (!branch || branch.currency < GIFT_COST) return false

  branch.currency -= GIFT_COST
  const gain = owner.relations < 0 ? 12 : 6
  improveRelations(branchId, gain)
  eventBus.emit('diplomacy:gift', { branchId, ownerName: owner.name, gain })
  return true
}

export function canProposeTruce(branchId: BranchId): boolean {
  const state = gameState.get()
  const owner = state.aiOwners[branchId]
  if (!owner || owner.defeated) return false
  if (owner.relations >= 0) return false
  return state.goldenCoins >= TRUCE_COST
}

export function proposeTruce(branchId: BranchId): boolean {
  const state = gameState.get()
  const owner = state.aiOwners[branchId]
  if (!owner || owner.defeated) return false
  if (state.goldenCoins < TRUCE_COST) return false
  if (owner.relations >= 0) return false

  state.goldenCoins -= TRUCE_COST
  improveRelations(branchId, 20)
  eventBus.emit('diplomacy:truce', { branchId, ownerName: owner.name })
  return true
}

export function generateAIEvent(
  owner: AIOwnerState,
  eventType: AIEventType,
  targetBranch: BranchId
): EventDefinition {
  const template = getAIEventTemplate(eventType)
  const ownerBranchName = getBranchDef(owner.branchId).name
  const targetBranchName = getBranchDef(targetBranch).name

  const def = buildAIEventDefinition(template, owner.name, ownerBranchName, targetBranchName)

  // Scale effects by owner power relative to player
  const playerPower = getPlayerPower()
  const powerRatio = playerPower > 0 ? owner.power / playerPower : 1
  const scale = Math.max(0.5, Math.min(3.0, powerRatio))

  def.choices = def.choices.map(choice => ({
    ...choice,
    penalties: choice.penalties.map(p => {
      if (p.type === 'loseCurrency' && p.scaling === 'currencyPercent') {
        return { ...p, value: Math.min(0.20, p.value * scale) }
      }
      if (p.type === 'incomeMultiplier' && p.value < 1) {
        return { ...p, value: Math.max(0.3, p.value * (2 - scale)) }
      }
      if (p.type === 'incomeFreeze') {
        return { ...p, value: Math.min(120, Math.round(p.value * scale)) }
      }
      return p
    }),
    rewards: choice.rewards.map(r => {
      if (r.type === 'incomeMultiplier' && r.value > 1) {
        return { ...r, value: Math.min(2.0, r.value * (0.5 + scale * 0.5)) }
      }
      return r
    }),
  }))

  // Set autoResolveAction based on event type
  def.autoResolveAction = eventType === 'truce' ? 'best' : 'safe'

  return def
}
