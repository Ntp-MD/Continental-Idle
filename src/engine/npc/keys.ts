import type { NpcEngineInteractionTarget } from './types'

const spotKeyByTarget = new WeakMap<object, string>()
const itemKeyByTarget = new WeakMap<object, string>()

type TargetKeyParts = Pick<NpcEngineInteractionTarget, 'floorId' | 'itemId' | 'interactSpotId'>

// These keys are built once per target and reused: the reservation lookups run per
// candidate target per agent, so the string allocation used to dominate the tick.
export function interactionTargetKey(target: TargetKeyParts): string {
	let key = spotKeyByTarget.get(target)
	if (key === undefined) {
		key = `${target.floorId}:${target.itemId}:${target.interactSpotId}`
		spotKeyByTarget.set(target, key)
	}
	return key
}

export function reservationItemKey(target: Pick<NpcEngineInteractionTarget, 'floorId' | 'itemId'>): string {
	let key = itemKeyByTarget.get(target)
	if (key === undefined) {
		key = `${target.floorId}:${target.itemId}`
		itemKeyByTarget.set(target, key)
	}
	return key
}
