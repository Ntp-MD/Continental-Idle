import { MAX_NPC_ENTRIES } from '../../limits'
import { editorLog } from '../logger'
import { MAX_DATA_STRING_LENGTH, clampInt, isFiniteNumber, isRecord, isValidColor, normalizeIdentifier, normalizeTag, normalizeTags, normalizeText } from './helpers'

export interface NpcTaskPost {
	assetId: string
	post?: string
}

export interface NpcTask {
	id: string
	label: string
	tags: string[]
	post?: NpcTaskPost
}

function sanitizeTaskPost(value: unknown): NpcTaskPost | undefined {
	if (value === undefined || value === null) return undefined
	if (!isRecord(value)) return undefined
	const assetId = normalizeIdentifier(value.assetId)
	if (!assetId) return undefined
	const post = normalizeTag(value.post)
	return { assetId, ...(post ? { post } : {}) }
}


export interface NpcSpawnRule {

	targetTags?: string[]

	/** Dead field: kept readable for old saves, never written, ignored by the engine. */
	count?: number
}

export interface NpcRole {
	id: string
	label: string
	color: string

	focusTags: string[]

	restrictedTags: string[]

	taskIds: string[]

	focusChance: number
	spawnRule?: NpcSpawnRule
}

export interface NpcDeploymentPool {
	roleId: string
	count: number
	floorIds?: string[]
}

export const NPC_DEFAULT_SPEED = 0.2

export const NPC_OPTION_DEFAULTS = {
	crossFloorCooldownSeconds: 30,
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
} as const

export const NPC_FRAME_DEFAULTS = {
	frameSimBudgetMs: 6,
	maxSimulationSteps: 8,
} as const

export interface NpcSimulationConfig {
	speed: number
	defaultRoleId: string
	roles: NpcRole[]
	tasks: NpcTask[]
	pool: NpcDeploymentPool[]

	tagTriggerRates?: Record<string, number>
	crossFloorCooldownSeconds: number
	progressWatchdogTicks: number
	maxRepathAttempts: number
	repathCooldownSeconds: number
	repathCooldownExponent: number
	pathBudgetMinPerTick: number
	pathBudgetAgentsPerCall: number
	chooseTargetMinPerTick: number
	chooseTargetAgentsPerSlot: number
	wanderMemorySize: number
	wanderSmallMapThreshold: number
	triggerRatePeriodSeconds: number
	frameSimBudgetMs: number
	maxSimulationSteps: number
}

export interface NpcSimDot {
	id: string
	floorId: string
	type: string
	x: number
	y: number
	targetX: number
	targetY: number
	speed: number
	color: string
	status: 'walking' | 'queued' | 'waiting' | 'interacting' | 'chatting' | 'idle'
	pauseTimer: number
	pathIdx: number
	path: [number, number][]
	interactTargetKey: string | null
	interactSpotKey: string | null
	interactDurationMin: number
	interactDurationMax: number
}

export function isValidTagTriggerRates(value: unknown): boolean {
	if (value === undefined) return true
	if (!isRecord(value) || Object.keys(value).length > 256) return false
	return Object.entries(value).every(([tag, rate]) => !!normalizeTag(tag) && isFiniteNumber(rate) && rate >= 0 && rate <= 100)
}

export function normalizeTagTriggerRates(value: unknown): Record<string, number> | undefined {
	if (!isRecord(value)) return undefined
	const rates: Record<string, number> = {}
	for (const [tag, rate] of Object.entries(value)) {
		const normalized = normalizeTag(tag)
		if (normalized && isFiniteNumber(rate) && rate > 0) rates[normalized] = clampInt(rate, 0, 100)
	}
	return Object.keys(rates).length ? rates : undefined
}

export function isNpcConfig(value: unknown): value is NpcSimulationConfig {
	if (!isRecord(value)) return false
	const c = value
	if (!isFiniteNumber(c.speed) || c.speed < 0 || c.speed > 1) return false
	if (typeof c.defaultRoleId !== 'string' || (c.defaultRoleId !== '' && !normalizeIdentifier(c.defaultRoleId))) return false
	if (!Array.isArray(c.roles) || c.roles.length > MAX_NPC_ENTRIES) return false
	if (!Array.isArray(c.tasks) || c.tasks.length > MAX_NPC_ENTRIES) return false
	if (!Array.isArray(c.pool) || c.pool.length > MAX_NPC_ENTRIES) return false
	if (c.roles.some((role: unknown) => !isValidRole(role))) return false
	if (c.tasks.some((task: unknown) => !isValidTask(task))) return false
	if (c.pool.some((pool: unknown) => !isValidPoolEntry(pool))) return false
	if (!isValidTagTriggerRates(c.tagTriggerRates)) return false
	const numericFields: Array<keyof typeof c> = ['crossFloorCooldownSeconds', 'progressWatchdogTicks', 'maxRepathAttempts', 'repathCooldownSeconds', 'repathCooldownExponent', 'pathBudgetMinPerTick', 'pathBudgetAgentsPerCall', 'chooseTargetMinPerTick', 'chooseTargetAgentsPerSlot', 'wanderMemorySize', 'wanderSmallMapThreshold', 'triggerRatePeriodSeconds', 'frameSimBudgetMs', 'maxSimulationSteps']
	for (const field of numericFields) {
		const v = c[field]
		if (v !== undefined && !isFiniteNumber(v)) return false
	}
	return true
}

function isValidRole(r: unknown): r is NpcRole {
	if (!isRecord(r)) return false
	const role = r
	const color = normalizeText(role.color, 32)
	if (!normalizeIdentifier(role.id) || !normalizeText(role.label) || !color || !isValidColor(color)) return false
	if (!isFiniteNumber(role.focusChance) || role.focusChance < 0 || role.focusChance > 100) return false
	if (!Array.isArray(role.focusTags) || !normalizeTags(role.focusTags)) return false
	if (!Array.isArray(role.restrictedTags) || !normalizeTags(role.restrictedTags)) return false
	if (!Array.isArray(role.taskIds) || role.taskIds.length > MAX_NPC_ENTRIES || role.taskIds.some((taskId: unknown) => !normalizeIdentifier(taskId))) return false
	if (role.spawnRule !== undefined) {
		if (!isRecord(role.spawnRule)) return false
		if (role.spawnRule.count !== undefined && (!isFiniteNumber(role.spawnRule.count) || role.spawnRule.count < 0 || role.spawnRule.count > 1000)) return false
		if (role.spawnRule.targetTags !== undefined && (!Array.isArray(role.spawnRule.targetTags) || !normalizeTags(role.spawnRule.targetTags))) return false
	}
	return true
}

function isValidTask(t: unknown): t is NpcTask {
	if (!isRecord(t)) return false
	return !!normalizeIdentifier(t.id) && !!normalizeText(t.label)
		&& Array.isArray(t.tags) && !!normalizeTags(t.tags)
		&& (t.post === undefined || isRecord(t.post))
}

function isValidPoolEntry(p: unknown): p is NpcDeploymentPool {
	if (!isRecord(p)) return false
	if (!normalizeIdentifier(p.roleId) || !isFiniteNumber(p.count) || p.count < 0 || p.count > 1000) return false
	return p.floorIds === undefined
		|| (Array.isArray(p.floorIds) && p.floorIds.length <= MAX_NPC_ENTRIES && p.floorIds.every((id: unknown) => !!normalizeIdentifier(id)))
}

export function normalizeNpcConfig(value: unknown): NpcSimulationConfig | undefined {
	if (!isRecord(value)) return undefined
	const c = value
	if (!isFiniteNumber(c.speed) || c.speed < 0 || c.speed > 1) return undefined
	if (typeof c.defaultRoleId !== 'string' || c.defaultRoleId.length > MAX_DATA_STRING_LENGTH) return undefined
	if (!Array.isArray(c.roles) || c.roles.length > MAX_NPC_ENTRIES || !Array.isArray(c.tasks) || c.tasks.length > MAX_NPC_ENTRIES || !Array.isArray(c.pool) || c.pool.length > MAX_NPC_ENTRIES) return undefined
	const rawRoles = c.roles as unknown[]
	const rawTasks = c.tasks as unknown[]
	const rawPool = c.pool as unknown[]
	const roles = rawRoles.filter(isValidRole)
	const tasks = rawTasks.filter(isValidTask)
	const validPool = rawPool.filter(isValidPoolEntry)
	const pool = validPool.filter(entry => roles.some(role => role.id === entry.roleId))
	const droppedRoles = rawRoles.length - roles.length
	const droppedTasks = rawTasks.length - tasks.length
	const droppedPool = rawPool.length - pool.length
	if (droppedRoles > 0 || droppedTasks > 0 || droppedPool > 0) {
		const parts: string[] = []
		if (droppedRoles > 0) parts.push(`${droppedRoles} role(s)`)
		if (droppedTasks > 0) parts.push(`${droppedTasks} task(s)`)
		if (droppedPool > 0) parts.push(`${droppedPool} pool entr(y/ies)`)
		editorLog.warn('NPC config salvage', `dropped ${parts.join(', ')} during normalization`)
	}
	if (roles.length === 0) return undefined
	const taskIds = new Set(tasks.map(task => task.id.trim()))
	const config: NpcSimulationConfig = {
		speed: Math.max(0.001, Math.min(1, c.speed)),
		defaultRoleId: c.defaultRoleId.trim(),
		roles: roles.map(role => {
			const normalized: NpcRole = {
				id: role.id.trim(),
				label: role.label.trim(),
				color: role.color.trim(),
				focusTags: normalizeTags(role.focusTags) ?? [],
				restrictedTags: normalizeTags(role.restrictedTags) ?? [],
				taskIds: [...new Set(role.taskIds.map(taskId => taskId.trim()).filter(taskId => taskIds.has(taskId)))],
				focusChance: clampInt(role.focusChance, 0, 100),
			}
			if (role.spawnRule) {
				normalized.spawnRule = {
					targetTags: normalizeTags(role.spawnRule.targetTags) ?? [],
				}
			}
			return normalized
		}),
		tasks: tasks.map(task => {
			const post = sanitizeTaskPost(task.post)
			return {
				id: task.id.trim(),
				label: task.label.trim(),
				tags: normalizeTags(task.tags) ?? [],
				...(post ? { post } : {}),
			}
		}),
		pool: pool.map(entry => ({
			roleId: entry.roleId.trim(),
			count: clampInt(entry.count, 0, 1000),
			...(entry.floorIds?.length ? { floorIds: [...new Set(entry.floorIds.map(id => id.trim()).filter(Boolean))] } : {}),
		})),
		crossFloorCooldownSeconds: isFiniteNumber(c.crossFloorCooldownSeconds) && c.crossFloorCooldownSeconds > 0 ? c.crossFloorCooldownSeconds : NPC_OPTION_DEFAULTS.crossFloorCooldownSeconds,
		progressWatchdogTicks: isFiniteNumber(c.progressWatchdogTicks) && c.progressWatchdogTicks > 0 ? Math.floor(c.progressWatchdogTicks) : NPC_OPTION_DEFAULTS.progressWatchdogTicks,
		maxRepathAttempts: isFiniteNumber(c.maxRepathAttempts) && c.maxRepathAttempts > 0 ? Math.floor(c.maxRepathAttempts) : NPC_OPTION_DEFAULTS.maxRepathAttempts,
		repathCooldownSeconds: isFiniteNumber(c.repathCooldownSeconds) && c.repathCooldownSeconds > 0 ? c.repathCooldownSeconds : NPC_OPTION_DEFAULTS.repathCooldownSeconds,
		repathCooldownExponent: isFiniteNumber(c.repathCooldownExponent) && c.repathCooldownExponent > 0 ? c.repathCooldownExponent : NPC_OPTION_DEFAULTS.repathCooldownExponent,
		pathBudgetMinPerTick: isFiniteNumber(c.pathBudgetMinPerTick) && c.pathBudgetMinPerTick > 0 ? Math.floor(c.pathBudgetMinPerTick) : NPC_OPTION_DEFAULTS.pathBudgetMinPerTick,
		pathBudgetAgentsPerCall: isFiniteNumber(c.pathBudgetAgentsPerCall) && c.pathBudgetAgentsPerCall > 0 ? Math.floor(c.pathBudgetAgentsPerCall) : NPC_OPTION_DEFAULTS.pathBudgetAgentsPerCall,
		chooseTargetMinPerTick: isFiniteNumber(c.chooseTargetMinPerTick) && c.chooseTargetMinPerTick > 0 ? Math.floor(c.chooseTargetMinPerTick) : NPC_OPTION_DEFAULTS.chooseTargetMinPerTick,
		chooseTargetAgentsPerSlot: isFiniteNumber(c.chooseTargetAgentsPerSlot) && c.chooseTargetAgentsPerSlot > 0 ? Math.floor(c.chooseTargetAgentsPerSlot) : NPC_OPTION_DEFAULTS.chooseTargetAgentsPerSlot,
		wanderMemorySize: isFiniteNumber(c.wanderMemorySize) && c.wanderMemorySize > 0 ? Math.floor(c.wanderMemorySize) : NPC_OPTION_DEFAULTS.wanderMemorySize,
		wanderSmallMapThreshold: isFiniteNumber(c.wanderSmallMapThreshold) && c.wanderSmallMapThreshold > 0 ? Math.floor(c.wanderSmallMapThreshold) : NPC_OPTION_DEFAULTS.wanderSmallMapThreshold,
		triggerRatePeriodSeconds: isFiniteNumber(c.triggerRatePeriodSeconds) && c.triggerRatePeriodSeconds > 0 ? c.triggerRatePeriodSeconds : NPC_OPTION_DEFAULTS.triggerRatePeriodSeconds,
		frameSimBudgetMs: isFiniteNumber(c.frameSimBudgetMs) && c.frameSimBudgetMs > 0 ? c.frameSimBudgetMs : NPC_FRAME_DEFAULTS.frameSimBudgetMs,
		maxSimulationSteps: isFiniteNumber(c.maxSimulationSteps) && c.maxSimulationSteps > 0 ? Math.floor(c.maxSimulationSteps) : NPC_FRAME_DEFAULTS.maxSimulationSteps,
	}
	config.tagTriggerRates = normalizeTagTriggerRates(c.tagTriggerRates)
	if (!config.roles.some(role => role.id === config.defaultRoleId)) config.defaultRoleId = config.roles[0]?.id ?? ''
	return config
}

