import type { NpcEngineOptions } from './types'

export const NPC_ENGINE_TICKS_PER_SECOND = 60

export const NPC_ENGINE_DEFAULT_AGENT_CLEARANCE = 0.5

export type NpcEngineResolvedOptions = NpcEngineOptions & { [K in NpcEngineNumericOption]-?: NonNullable<NpcEngineOptions[K]> }

type NpcEngineNumericOption = Exclude<keyof NpcEngineOptions, 'pathfinder' | 'targetSelector' | 'queueSelector' | 'crossFloorSelector' | 'wanderSelector' | 'socialSelector' | 'targetTags' | 'random'>

export const NPC_ENGINE_DEFAULT_OPTIONS: { [K in NpcEngineNumericOption]-?: NonNullable<NpcEngineOptions[K]> } = {
	ticksPerSecond: 60,
	agentClearance: 0.5,
	crossFloorCooldownSeconds: 30,
	queuePatienceSeconds: 30,
	socialRadius: 0,
	socialCooldownSeconds: 45,
	socialChatDurationMinSeconds: 3,
	socialChatDurationMaxSeconds: 8,
	progressWatchdogTicks: 120,
	maxRepathAttempts: 4,
	repathCooldownSeconds: 2,
	repathCooldownExponent: 1.5,
	pathBudgetMinPerTick: 2,
	pathBudgetAgentsPerCall: 100,
	chooseTargetMinPerTick: 8,
	chooseTargetAgentsPerSlot: 20,
	wanderMemorySize: 32,
	wanderSmallMapThreshold: 8,
	triggerRatePeriodSeconds: 60,
}
