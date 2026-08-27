import type { NpcSimulationConfig, NpcRole, NpcTask, NpcDeploymentPool } from '../types'
import { isNpcConfig } from '../types'
import { genId } from './storeUtils'

export function migrateNpcConfig(value: unknown): NpcSimulationConfig {
	const empty: NpcSimulationConfig = { speed: 1 / 30, defaultRoleId: '', roles: [], tasks: [], pool: [] }
	if (!value || typeof value !== 'object') return empty
	const c = value as Record<string, unknown>

	if (isNpcConfig(c)) return c

	const speed = (typeof c.speed === 'number' && isFinite(c.speed)) ? c.speed : empty.speed
	const defaultRoleId = typeof c.defaultRoleId === 'string' ? c.defaultRoleId : (typeof c.role === 'string' ? c.role : '')


	const existingTasks: NpcTask[] = Array.isArray(c.tasks)
		? c.tasks.filter((t: unknown) => {
			const rec = t as Record<string, unknown>
			return rec && typeof rec.id === 'string' && typeof rec.label === 'string'
				&& Array.isArray(rec.tags) && rec.tags.every((tag: unknown) => typeof tag === 'string')
		}).map((t: unknown) => {
			const rec = t as Record<string, unknown>
			return { id: rec.id as string, label: rec.label as string, tags: [...(rec.tags as string[])] }
		})
		: []


	const taskTags = (taskId: string): string[] => existingTasks.find(t => t.id === taskId)?.tags ?? []


	type OldRole = { id?: string; label?: string; color?: string; behavior?: { focusTaskId?: string; focusChance?: number; restrictedTaskIds?: string[] }; focusTags?: string[]; restrictedTags?: string[]; taskIds?: string[]; focusChance?: number }
	let rawRoles: OldRole[] = []
	if (Array.isArray(c.roles)) {
		rawRoles = c.roles.filter((r: unknown) => r != null && typeof r === 'object') as OldRole[]
	} else if (c.roleBehaviors && typeof c.roleBehaviors === 'object') {
		const roleBehaviors = c.roleBehaviors as Record<string, unknown>
		const selectedRole = typeof c.role === 'string' ? c.role : ''
		const legacyColors: Record<string, string> = {
			guest: '#22d3ee',
			staff: '#f472b6',
			visitor: '#a78bfa',
			assassin: '#ef4444',
		}
		for (const roleId of Object.keys(roleBehaviors ?? {})) {
			rawRoles.push({ id: roleId, label: roleId.charAt(0).toUpperCase() + roleId.slice(1), color: legacyColors[roleId] ?? '#3b82f6' })
		}
		if (selectedRole && !rawRoles.some(r => r.id === selectedRole)) {
			rawRoles.push({ id: selectedRole, label: selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1), color: legacyColors[selectedRole] ?? '#22d3ee' })
		}
	}

	if (rawRoles.length === 0) return empty

	let pool: NpcDeploymentPool[] = []
	if (Array.isArray(c.pool)) {
		pool = c.pool.map((p: unknown) => {
			const rec = p as Record<string, unknown>
			return { roleId: typeof rec.roleId === 'string' ? rec.roleId : defaultRoleId, count: typeof rec.count === 'number' ? Math.max(0, Math.floor(rec.count)) : 0 }
		}).filter(p => p.count > 0)
	}

	const roles: NpcRole[] = rawRoles.map(r => {
		const id = typeof r.id === 'string' ? r.id : genId('role')
		const label = typeof r.label === 'string' ? r.label : id
		const color = typeof r.color === 'string' ? r.color : '#22d3ee'


		if (Array.isArray(r.focusTags) || Array.isArray(r.restrictedTags) || Array.isArray(r.taskIds)) {
			return {
				id,
				label,
				color,
				focusTags: Array.isArray(r.focusTags) ? r.focusTags.filter((t): t is string => typeof t === 'string') : [],
				restrictedTags: Array.isArray(r.restrictedTags) ? r.restrictedTags.filter((t): t is string => typeof t === 'string') : [],
				taskIds: Array.isArray(r.taskIds) ? r.taskIds.filter((t): t is string => typeof t === 'string') : [],
				focusChance: typeof r.focusChance === 'number' ? Math.max(0, Math.min(100, Math.floor(r.focusChance))) : 100,
			}
		}


		const b = r.behavior
		const focusTaskId = b?.focusTaskId
		const restrictedTaskIds = b?.restrictedTaskIds ?? []
		const focusChance = typeof b?.focusChance === 'number' ? Math.max(0, Math.min(100, Math.floor(b.focusChance))) : 100


		const focusTags = focusTaskId ? taskTags(focusTaskId) : []
		const restrictedTags = restrictedTaskIds.flatMap(id => taskTags(id))

		return {
			id,
			label,
			color,
			focusTags,
			restrictedTags,
			taskIds: focusTaskId ? [focusTaskId] : [],
			focusChance,
		}
	})

	if (roles.length === 0) return empty

	return { speed, defaultRoleId, roles, tasks: existingTasks, pool }
}
