import type { AssetDef, BlueprintTagDefinition, NpcSimulationConfig } from '../domain/types'

export interface TagUsage {
	assets: string[]
	roles: string[]
	tasks: string[]
}

export interface TagCatalog {
	definitions: readonly BlueprintTagDefinition[]
	activeTags: readonly string[]
	assetsByTag: ReadonlyMap<string, readonly string[]>
	usageByTag: ReadonlyMap<string, TagUsage>
	orphanReferences: readonly string[]
}

function addUsage(map: Map<string, TagUsage>, tag: string, key: keyof TagUsage, id: string): void {
	const usage = map.get(tag) ?? { assets: [], roles: [], tasks: [] }
	if (!usage[key].includes(id)) usage[key].push(id)
	map.set(tag, usage)
}

export function buildTagCatalog(
	definitions: readonly BlueprintTagDefinition[],
	assets: readonly AssetDef[],
	npcConfig: NpcSimulationConfig | undefined,
): TagCatalog {
	const known = new Set(definitions.map(tag => tag.id))
	const active = new Set<string>()
	const usage = new Map<string, TagUsage>()
	const assetsByTag = new Map<string, string[]>()

	for (const asset of assets) {
		for (const tag of asset.tags ?? []) {
			active.add(tag)
			const ids = assetsByTag.get(tag) ?? []
			if (!ids.includes(asset.id)) ids.push(asset.id)
			assetsByTag.set(tag, ids)
			addUsage(usage, tag, 'assets', asset.id)
		}
	}
	for (const role of npcConfig?.roles ?? []) {
		for (const tag of [...role.focusTags, ...role.restrictedTags, ...(role.spawnRule?.targetTags ?? [])]) {
			active.add(tag)
			addUsage(usage, tag, 'roles', role.id)
		}
	}
	for (const task of npcConfig?.tasks ?? []) {
		for (const tag of task.tags) {
			active.add(tag)
			addUsage(usage, tag, 'tasks', task.id)
		}
	}

	return {
		definitions,
		activeTags: [...active].sort((a, b) => a.localeCompare(b)),
		assetsByTag,
		usageByTag: usage,
		orphanReferences: [...active].filter(tag => !known.has(tag)).sort((a, b) => a.localeCompare(b)),
	}
}
