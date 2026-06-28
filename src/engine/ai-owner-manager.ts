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

export function tickAIOwners(tickCount: number): void {
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

    // Check if AI should take action
    if (tickCount - owner.lastActionTick < owner.actionCooldown) return

    const actionRoll = Math.random()
    const aggressionMult = owner.aggression * (1 + owner.threatLevel * 0.1)

    if (actionRoll < aggressionMult * 0.3) {
      // AI decides to act — emit an AI event
      const eventType = pickAIEvent(owner, playerPower)
      if (eventType) {
        eventBus.emit('ai:action', {
          branchId: owner.branchId,
          ownerName: owner.name,
          temperament: owner.temperament,
          eventType,
          power: owner.power,
        })
        owner.lastActionTick = tickCount
        // Action cooldown varies by temperament
        owner.actionCooldown = def.baseCooldown + Math.floor(Math.random() * 20)
      }
    }
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

  // Filter by conditions
  const validActions = actions.filter(action => {
    if (action === 'raid' && owner.power < playerPower * 0.5) return false
    if (action === 'truce' && owner.relations < -20) return false
    if (action === 'tribute' && owner.power < playerPower * 0.8) return false
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

export function generateAIEvent(
  owner: AIOwnerState,
  eventType: AIEventType,
  targetBranch: BranchId
): EventDefinition {
  const template = getAIEventTemplate(eventType)
  const ownerBranchName = getBranchDef(owner.branchId).name
  const targetBranchName = getBranchDef(targetBranch).name

  return buildAIEventDefinition(template, owner.name, ownerBranchName, targetBranchName)
}
