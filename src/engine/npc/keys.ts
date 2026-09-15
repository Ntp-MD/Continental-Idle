import type { NpcEngineInteractionTarget } from './types'

export function interactionTargetKey(target: Pick<NpcEngineInteractionTarget, 'floorId' | 'itemId' | 'interactSpotId'>): string {
	return `${target.floorId}:${target.itemId}:${target.interactSpotId}`
}
