import type { NpcEngineOptions } from './types'
import { NPC_OPTION_DEFAULTS } from '../../blueprint-editor/domain/types'

export const NPC_ENGINE_TICKS_PER_SECOND = 60

export const NPC_ENGINE_DEFAULT_AGENT_CLEARANCE = 0.5

export type NpcEngineResolvedOptions = NpcEngineOptions & { [K in NpcEngineNumericOption]-?: NonNullable<NpcEngineOptions[K]> }

type NpcEngineNumericOption = Exclude<keyof NpcEngineOptions, 'pathfinder' | 'targetSelector' | 'queueSelector' | 'crossFloorSelector' | 'wanderSelector' | 'socialSelector' | 'targetTags' | 'random'>

export const NPC_ENGINE_DEFAULT_OPTIONS: { [K in NpcEngineNumericOption]-?: NonNullable<NpcEngineOptions[K]> } = {
	ticksPerSecond: 60,
	agentClearance: 0.5,
	queuePatienceSeconds: 30,
	socialRadius: 0,
	socialCooldownSeconds: 45,
	socialChatDurationMinSeconds: 3,
	socialChatDurationMaxSeconds: 8,
	...NPC_OPTION_DEFAULTS,
}
