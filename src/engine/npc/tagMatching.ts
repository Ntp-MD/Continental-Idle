import type { FloorData, NpcRole, NpcSimulationConfig, ObjectData } from '../../blueprint-editor/types'

export function hasMatchingTag(tags: readonly string[] | undefined, targetTags: readonly string[]): boolean {
	if (!tags || targetTags.length === 0) return false
	const normalized = new Set(tags.map(tag => tag.trim().toLowerCase()))
	return targetTags.some(tag => normalized.has(tag.trim().toLowerCase()))
}

export function getObjectTags(object: ObjectData, getAssetTags?: (type: string) => string[] | undefined): string[] {
	return getAssetTags?.(object.type) ?? []
}

export function floorMatchesTargetTags(
	floor: FloorData,
	targetTags: readonly string[],
	getAssetTags?: (type: string) => string[] | undefined,
): boolean {
	if (targetTags.length === 0) return true
	return floor.objects.some(object => hasMatchingTag(getObjectTags(object, getAssetTags), targetTags))
}

export function getRoleFocusTags(config: NpcSimulationConfig, role: NpcRole, managedTags?: readonly string[]): string[] {
	const tags = [...new Set([
		...role.focusTags,
		...role.taskIds.flatMap(id => config.tasks.find(task => task.id === id)?.tags ?? []),
	])]
	if (!managedTags) return tags
	const managed = new Set(managedTags)
	return tags.filter(tag => managed.has(tag))
}
