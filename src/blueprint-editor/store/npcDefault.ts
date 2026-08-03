import { ASSASSIN_TYPES } from '@/data/assassins'
import { STAFF_TYPES } from '@/data/staff'
import type { NpcRole, NpcSimulationConfig, NpcTask } from '../types'
import { state } from './state'
import { saveNpcConfig } from './persistence'

export interface NpcRoleMeta {
	category: 'staff' | 'assassin' | 'custom'
	summary: string
	rank?: string
	recommendedTags: string[]
}

const ASSASSIN_ROLE_TAGS: Record<string, string[]> = {
	streetSamurai: ['security', 'entrance'],
	enforcer: ['security', 'armory', 'vault'],
	shadowBlade: ['intelNetwork', 'underground'],
	royalGuard: ['security', 'vault', 'safeHouse'],
	highTableEnforcer: ['security', 'controlCenter', 'vault'],
}

const ROLE_COLORS: Record<string, string> = {
	concierge: '#3b82f6',
	bartender: '#f0c040',
	chef: '#3dd68c',
	cleaner: '#a0a0a8',
	sommelier: '#f0c040',
	intelOfficer: '#3b82f6',
	adjudicator: '#3b82f6',
	vaultKeeper: '#f0c040',
	streetSamurai: '#ef4444',
	enforcer: '#ef4444',
	shadowBlade: '#ef4444',
	royalGuard: '#f0c040',
	highTableEnforcer: '#ef4444',
}

function getRoleTags(roleId: string): string[] {
	const staff = STAFF_TYPES.find(role => role.id === roleId)
	if (staff) return [...staff.bestMatch]
	return [...(ASSASSIN_ROLE_TAGS[roleId] ?? ['security'])]
}

function getRoleLabel(roleId: string): string {
	return STAFF_TYPES.find(role => role.id === roleId)?.name
		?? ASSASSIN_TYPES.find(role => role.id === roleId)?.name
		?? roleId
}

export const NPC_ROLE_META: Record<string, NpcRoleMeta> = Object.fromEntries([
	...STAFF_TYPES.map(role => [role.id, {
		category: 'staff' as const,
		summary: role.maxAbility,
		recommendedTags: [...role.bestMatch],
	}]),
	...ASSASSIN_TYPES.map(role => [role.id, {
		category: 'assassin' as const,
		summary: role.ability,
		rank: role.rank,
		recommendedTags: [...(ASSASSIN_ROLE_TAGS[role.id] ?? ['security'])],
	}]),
])

export const NPC_ROLE_PRESETS: NpcRole[] = [...STAFF_TYPES, ...ASSASSIN_TYPES].map(role => ({
	id: role.id,
	label: getRoleLabel(role.id),
	color: ROLE_COLORS[role.id] ?? '#3b82f6',
	behavior: {
		focusTaskId: `task-${role.id}`,
		focusChance: 100,
		restrictedTaskIds: [],
	},
}))

export const NPC_TASK_PRESETS: NpcTask[] = NPC_ROLE_PRESETS.map(role => ({
	id: `task-${role.id}`,
	label: `${role.label} duty`,
	tags: getRoleTags(role.id),
}))

export function getDefaultNpcConfig(): NpcSimulationConfig {
	const concierge = NPC_ROLE_PRESETS.find(role => role.id === 'concierge') ?? NPC_ROLE_PRESETS[0]
	return {
		speed: 1 / 30,
		defaultRoleId: concierge.id,
		roles: NPC_ROLE_PRESETS.map(role => ({ ...role, behavior: { ...role.behavior, restrictedTaskIds: [] } })),
		tasks: NPC_TASK_PRESETS.map(task => ({ ...task, tags: [...task.tags] })),
		pool: [
			{ roleId: concierge.id, count: 10 },
		],
	}
}

export function mergeNpcConfig(config: NpcSimulationConfig): NpcSimulationConfig {
	const roleIds = new Set(config.roles.map(role => role.id))
	const taskIds = new Set(config.tasks.map(task => task.id))

	return {
		...config,
		roles: config.roles.map(role => ({
			...role,
			behavior: {
				...role.behavior,
				restrictedTaskIds: role.behavior.restrictedTaskIds.filter(id => taskIds.has(id)),
			},
		})),
		tasks: config.tasks,
		pool: config.pool.filter(entry => roleIds.has(entry.roleId)),
	}
}

function deepClone<T>(value: T): T {
	return JSON.parse(JSON.stringify(value))
}

export async function updateNpcConfig(config: NpcSimulationConfig): Promise<void> {
	state.layout.npcConfig = deepClone(config)
	const saved = await saveNpcConfig()
	if (!saved) throw new Error('NPC configuration was not saved to npcConfig.json')
}
