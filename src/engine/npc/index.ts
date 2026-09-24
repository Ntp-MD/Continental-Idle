export { NpcEngine } from './npcEngine'
export { findNpcGridPath } from './pathfinding'
export { selectBestTarget } from './targetScoring'
export type { TargetScoringContext, TargetScoringOptions } from './targetScoring'
export { WanderMemory } from './wanderMemory'
export { NPC_ENGINE_TICKS_PER_SECOND, NPC_ENGINE_DEFAULT_AGENT_CLEARANCE, NPC_ENGINE_DEFAULT_OPTIONS } from './config'
export { floorMatchesTargetTags, getObjectTags, getRoleFocusTags, hasMatchingTag } from './tagMatching'
export { buildNpcQueues } from './queueBuild'
export {
	buildNpcEngineLayout,
	buildRoleWalkableMap,
	buildWalkableMap,
	filterNpcSpawnTiles,
	cellSizeOf,
	cellToPixel,
	pixelToCell,
	toEngineWalkablePoints,
} from './layoutBuild'
export type {
	GetAssetDef,
	GetAssetTags,
	NpcCanvasBounds,
	NpcLayoutBuildResult,
} from './layoutBuild'
export { interactionTargetKey, tileKey } from './keys'
export { chatPairKey, resolveChatExchange } from './socialLines'
export { createNpcEnginePolicy } from './policy'
export type { NpcEnginePolicy, NpcPolicyContext } from './policy'
export type {
	NpcEngineAgent,
	NpcEngineAgentStatus,
	NpcEngineEvent,
	NpcEngineEventType,
	NpcEngineFloor,
	NpcEngineInteractionTarget,
	NpcEngineLayout,
	NpcEngineOptions,
	NpcEngineQueue,
	NpcWalkableMap,
	NpcEnginePathfinder,
	NpcEnginePoint,
	NpcEngineWaitReason,
} from './types'
