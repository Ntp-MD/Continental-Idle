import type { FloorData, NpcRole, NpcSimulationConfig, NpcTask, ObjectData } from '../../blueprint-editor/domain/types'

// Tag arrays hang off targets and assets that live as long as the layout, so the
// normalized set is built once per array instead of once per candidate comparison.
const normalizedByTags = new WeakMap<object, Set<string>>()

function normalizedTagSet(tags: readonly string[]): Set<string> {
	let set = normalizedByTags.get(tags)
	if (set === undefined) {
		set = new Set(tags.map(tag => tag.trim().toLowerCase()))
		normalizedByTags.set(tags, set)
	}
	return set
}

export function hasMatchingTag(tags: readonly string[] | undefined, targetTags: readonly string[]): boolean {
	if (!tags || targetTags.length === 0) return false
	const normalized = normalizedTagSet(tags)
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

const tasksByIdByConfig = new WeakMap<NpcSimulationConfig, Map<string, NpcTask>>()

function taskIndex(config: NpcSimulationConfig): Map<string, NpcTask> {
	let index = tasksByIdByConfig.get(config)
	if (index === undefined) {
		index = new Map(config.tasks.map(task => [task.id, task]))
		tasksByIdByConfig.set(config, index)
	}
	return index
}

export function getRoleFocusTags(config: NpcSimulationConfig, role: NpcRole, managedTags?: readonly string[]): string[] {
	const index = taskIndex(config)
	const tags: string[] = []
	const seen = new Set<string>()
	const push = (tag: string): void => {
		if (seen.has(tag)) return
		seen.add(tag)
		tags.push(tag)
	}
	for (const tag of role.focusTags) push(tag)
	for (const id of role.taskIds) for (const tag of index.get(id)?.tags ?? []) push(tag)
	if (!managedTags) return tags
	const managed = new Set(managedTags)
	return tags.filter(tag => managed.has(tag))
}

function isPostTargetTag(tag: string): boolean {
	return tag.startsWith('post:')
}

export function hasPostTag(tags: readonly string[] | undefined): boolean {
	if (!tags) return false
	return tags.some(isPostTargetTag)
}
