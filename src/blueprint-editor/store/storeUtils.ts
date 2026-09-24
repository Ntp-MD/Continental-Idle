import { toRaw } from 'vue'
import { NPC_DEFAULT_SPEED, NPC_OPTION_DEFAULTS, NPC_FRAME_DEFAULTS, type AssetDef, type FloorData, type FloorLayoutData, type NpcSimulationConfig, type NpcTask, type TileState } from '../domain/types'

export function floorHasContent(floor: FloorData): boolean {
	if (floor.objects.length > 0) return true
	if (floor.spawnZones?.length) return true
	const defaultState: TileState = floor.defaultWalkable === false ? 'blocked' : 'walkable'
	const states = floor.walkable?.tileStates
	if (states) return states.some(row => row.some(cell => cell !== defaultState))
	const defaultCell = floor.defaultWalkable !== false
	const grid = floor.walkable?.walkableGrid
	if (grid) return grid.some(row => row.some(cell => cell !== defaultCell))
	return false
}

export function layoutHasContent(layout: FloorLayoutData): boolean {
	return layout.floors.some(floorHasContent)
}

export function genId(prefix: string): string {
	const arr = new Uint8Array(5)
	crypto.getRandomValues(arr)
	const suffix = Array.from(arr, b => b.toString(16).padStart(2, '0')).join('')
	return `${prefix}-${suffix}`
}

export function taskMatchesQuery(task: NpcTask, query: string): boolean {
	return task.label.toLowerCase().includes(query) || task.tags.some((tag) => tag.toLowerCase().includes(query))
}

export function pruneNpcReferences(layout: FloorLayoutData, assets: readonly AssetDef[]): string[] {
	const notes: string[] = []
	const config = layout.npcConfig
	if (!config) return notes
	const postsByAsset = new Map(assets.map(asset => [asset.id, new Set(
		(asset.interactSpots ?? []).map(spot => spot.post).filter((post): post is string => !!post),
	)]))
	const roleIds = new Set(config.roles.map(role => role.id))
	const taskIds = new Set(config.tasks.map(task => task.id))
	const floorIds = new Set(layout.floors.map(floor => floor.id))
	config.pool = config.pool.filter(entry => {
		if (!roleIds.has(entry.roleId)) {
			notes.push(`Pool entry for unknown role "${entry.roleId}" removed`)
			return false
		}
		if (entry.floorIds?.length) {
			const kept = entry.floorIds.filter(id => floorIds.has(id))
			const dropped = entry.floorIds.length - kept.length
			if (dropped > 0) notes.push(`Pool entry for role "${entry.roleId}" dropped ${dropped} deleted floor(s)`)
			if (!kept.length) {
				notes.push(`Pool entry for role "${entry.roleId}" removed (no floors left)`)
				return false
			}
			entry.floorIds = kept
		}
		return true
	})
	for (const role of config.roles) {
		const before = role.taskIds.length
		role.taskIds = role.taskIds.filter(id => taskIds.has(id))
		if (role.taskIds.length !== before) notes.push(`Role "${role.label}" dropped ${before - role.taskIds.length} deleted task(s)`)
		if (role.spawnRule && role.spawnRule.count !== undefined) {
			notes.push(`Role "${role.label}" dropped dead spawnRule.count`)
			delete role.spawnRule.count
		}
	}
	for (const task of config.tasks) {
		if (!task.post) continue
		const livePosts = postsByAsset.get(task.post.assetId)
		if (!livePosts) {
			notes.push(`Task "${task.label}" post to deleted asset "${task.post.assetId}" removed`)
			delete task.post
			continue
		}
		if (task.post.post && !livePosts.has(task.post.post)) {
			notes.push(`Task "${task.label}" post "${task.post.post}" no longer exists - kept asset binding`)
			delete task.post.post
		}
	}
	const usedTags = new Set<string>()
	for (const role of config.roles) {
		for (const tag of role.focusTags) usedTags.add(tag)
		for (const tag of role.restrictedTags) usedTags.add(tag)
		for (const tag of role.spawnRule?.targetTags ?? []) usedTags.add(tag)
	}
	for (const task of config.tasks) {
		for (const tag of task.tags) usedTags.add(tag)
	}
	if (config.tagTriggerRates) {
		for (const tag of Object.keys(config.tagTriggerRates)) {
			if (!usedTags.has(tag)) {
				notes.push(`Trigger rate for unused tag "${tag}" removed`)
				delete config.tagTriggerRates[tag]
			}
		}
		if (Object.keys(config.tagTriggerRates).length === 0) delete config.tagTriggerRates
	}
	if (config.defaultRoleId && !roleIds.has(config.defaultRoleId)) {
		const fallback = config.roles[0]?.id ?? ''
		notes.push(`Default role reset to "${fallback || 'none'}"`)
		config.defaultRoleId = fallback
	}
	for (const floor of layout.floors) {
		if (floor.allowedRoleIds?.length) {
			const kept = floor.allowedRoleIds.filter(id => roleIds.has(id))
			if (kept.length !== floor.allowedRoleIds.length) notes.push(`Floor "${floor.label}" dropped deleted role(s)`)
			if (kept.length) floor.allowedRoleIds = kept
			else delete floor.allowedRoleIds
		}
		for (const zone of floor.spawnZones ?? []) {
			if (zone.roleIds?.length) {
				const kept = zone.roleIds.filter(id => roleIds.has(id))
				if (kept.length !== zone.roleIds.length) notes.push(`Spawn zone "${zone.label}" dropped deleted role(s)`)
				if (kept.length) zone.roleIds = kept
				else delete zone.roleIds
			}
		}
	}
	return notes
}

export function cloneDeepRaw<T>(value: T): T {
	// deepToRaw already rebuilds every array and object, so its result is a fresh tree:
	// a second structuredClone over it doubled the cost of every snapshot.
	return deepToRaw(value)
}

function deepToRaw<T>(value: T): T {
	const raw = toRaw(value) as T
	if (Array.isArray(raw)) return raw.map((item) => deepToRaw(item)) as T
	if (raw !== null && typeof raw === 'object') {
		const out: Record<string, unknown> = {}
		for (const [key, entry] of Object.entries(raw)) out[key] = deepToRaw(entry)
		return out as T
	}
	return raw
}

export function deepEqualRaw(a: unknown, b: unknown): boolean {
	if (a === b) return true
	if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false
	if (Array.isArray(a) || Array.isArray(b)) {
		if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
		for (let i = 0; i < a.length; i++) if (!deepEqualRaw(a[i], b[i])) return false
		return true
	}
	const aRec = a as Record<string, unknown>
	const bRec = b as Record<string, unknown>
	const aKeys = Object.keys(aRec)
	if (aKeys.length !== Object.keys(bRec).length) return false
	for (const key of aKeys) {
		if (!Object.prototype.hasOwnProperty.call(bRec, key) || !deepEqualRaw(aRec[key], bRec[key])) return false
	}
	return true
}

export function emptyNpcConfig(): NpcSimulationConfig {
	return {
		speed: NPC_DEFAULT_SPEED,
		defaultRoleId: '',
		roles: [],
		tasks: [],
		pool: [],
		...NPC_OPTION_DEFAULTS,
		...NPC_FRAME_DEFAULTS,
	}
}

function assetSlug(name: string): string {
	const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
	return slug || 'asset'
}

export function genAssetId(prefix: string, name: string, isTaken: (candidate: string) => boolean): string {
	const base = `${prefix}-${assetSlug(name)}`
	if (!isTaken(base)) return base
	let n = 2
	while (isTaken(`${base}-${n}`)) n++
	return `${base}-${n}`
}

