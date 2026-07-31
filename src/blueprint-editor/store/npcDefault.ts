import { ASSASSIN_TYPES } from '@/data/assassins'
import { STAFF_TYPES } from '@/data/staff'
import type { NpcRole, NpcSimulationConfig, NpcTask } from '../types'

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
	concierge: 'var(--accent-blue)',
	bartender: 'var(--accent-gold)',
	chef: 'var(--accent-green)',
	cleaner: 'var(--text-secondary)',
	sommelier: 'var(--accent-gold)',
	intelOfficer: 'var(--accent-blue)',
	adjudicator: 'var(--accent-blue)',
	vaultKeeper: 'var(--accent-gold)',
	streetSamurai: 'var(--accent-red)',
	enforcer: 'var(--accent-red)',
	shadowBlade: 'var(--accent-red)',
	royalGuard: 'var(--accent-gold)',
	highTableEnforcer: 'var(--accent-red)',
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
	color: ROLE_COLORS[role.id] ?? 'var(--accent-blue)',
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
	const roles = [...config.roles]
	const tasks = [...config.tasks]
	const roleIds = new Set(roles.map(role => role.id))
	const taskIds = new Set(tasks.map(task => task.id))

	for (const preset of NPC_ROLE_PRESETS) {
		if (!roleIds.has(preset.id)) {
			roles.push({ ...preset, behavior: { ...preset.behavior, restrictedTaskIds: [] } })
		}
	}
	for (const preset of NPC_TASK_PRESETS) {
		if (!taskIds.has(preset.id)) tasks.push({ ...preset, tags: [...preset.tags] })
	}

	return { ...config, roles, tasks }
}
