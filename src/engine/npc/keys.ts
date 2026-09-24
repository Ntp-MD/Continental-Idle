import type { NpcEngineInteractionTarget } from './types'
import type { NpcRole } from '../../blueprint-editor/domain/types'

const spotKeyByTarget = new WeakMap<object, string>()
const itemKeyByTarget = new WeakMap<object, string>()
const restrictionKeyByRole = new WeakMap<NpcRole, string>()

type TargetKeyParts = Pick<NpcEngineInteractionTarget, 'floorId' | 'itemId' | 'interactSpotId'>

// The one cell-key format in the engine. It lived in layoutBuild, which rooms.ts could not
// import without re-forming the module cycle, so five sites hand-rolled their own.
export function tileKey(x: number, y: number): string {
	return `${x},${y}`
}

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

// Role config is replaced wholesale on reload, so the role object is a safe cache key:
// the four policy caches used to JSON.stringify restrictedTags on every lookup.
export function roleFloorCacheKey(role: NpcRole, floorId: string): string {
	let restrictions = restrictionKeyByRole.get(role)
	if (restrictions === undefined) {
		restrictions = JSON.stringify(role.restrictedTags)
		restrictionKeyByRole.set(role, restrictions)
	}
	return `${role.id}:${floorId}:${restrictions}`
}
