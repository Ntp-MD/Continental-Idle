import { normalizeNpcConfig, type NpcRole, type NpcSimulationConfig, type NpcTask } from '../types'
import { state } from '../store/state'
import { genId } from '../store/utils'
import { mergeNpcConfig, updateNpcConfig } from '../store/npcDefault'

function currentConfig(): NpcSimulationConfig {
	return state.layout.npcConfig ?? { speed: 1 / 30, defaultRoleId: '', roles: [], tasks: [], pool: [] }
}

function cloneConfig(): NpcSimulationConfig {
	return JSON.parse(JSON.stringify(currentConfig())) as NpcSimulationConfig
}

export function listNpcRoles(): readonly NpcRole[] {
	return currentConfig().roles
}

export function getNpcRole(id: string): NpcRole | undefined {
	return currentConfig().roles.find(role => role.id === id)
}

export function listNpcTasks(): readonly NpcTask[] {
	return currentConfig().tasks
}

export function getNpcTask(id: string): NpcTask | undefined {
	return currentConfig().tasks.find(task => task.id === id)
}

export async function createNpcRole(input: Omit<NpcRole, 'id'>): Promise<NpcRole> {
	const config = cloneConfig()
	const role: NpcRole = { ...input, id: genId('role') }
	config.roles.push(role)
	if (!config.defaultRoleId) config.defaultRoleId = role.id
	const normalized = normalizeNpcConfig(mergeNpcConfig(config))
	if (!normalized) throw new Error('Invalid NPC role configuration')
	await updateNpcConfig(normalized)
	return normalized.roles.find(item => item.id === role.id) ?? role
}

export async function updateNpcRole(id: string, patch: Partial<NpcRole>): Promise<NpcRole | null> {
	const config = cloneConfig()
	const role = config.roles.find(item => item.id === id)
	if (!role) return null
	Object.assign(role, patch, { id })
	const normalized = normalizeNpcConfig(mergeNpcConfig(config))
	if (!normalized) return null
	await updateNpcConfig(normalized)
	return normalized.roles.find(item => item.id === id) ?? null
}

export async function deleteNpcRole(id: string): Promise<boolean> {
	const config = cloneConfig()
	if (config.defaultRoleId === id) return false
	const before = config.roles.length
	config.roles = config.roles.filter(role => role.id !== id)
	config.pool = config.pool.filter(entry => entry.roleId !== id)
	if (config.roles.length === before) return false
	const normalized = normalizeNpcConfig(mergeNpcConfig(config))
	if (!normalized) return false
	await updateNpcConfig(normalized)
	return true
}

export async function createNpcTask(input: Omit<NpcTask, 'id'>): Promise<NpcTask> {
	const config = cloneConfig()
	const task: NpcTask = { ...input, id: genId('task') }
	config.tasks.push(task)
	const normalized = normalizeNpcConfig(mergeNpcConfig(config))
	if (!normalized) throw new Error('Invalid NPC task configuration')
	await updateNpcConfig(normalized)
	return normalized.tasks.find(item => item.id === task.id) ?? task
}

export async function updateNpcTask(id: string, patch: Partial<NpcTask>): Promise<NpcTask | null> {
	const config = cloneConfig()
	const task = config.tasks.find(item => item.id === id)
	if (!task) return null
	Object.assign(task, patch, { id })
	const normalized = normalizeNpcConfig(mergeNpcConfig(config))
	if (!normalized) return null
	await updateNpcConfig(normalized)
	return normalized.tasks.find(item => item.id === id) ?? null
}

export async function deleteNpcTask(id: string): Promise<boolean> {
	const config = cloneConfig()
	const before = config.tasks.length
	config.tasks = config.tasks.filter(task => task.id !== id)
	if (config.tasks.length === before) return false
	for (const role of config.roles) role.taskIds = role.taskIds.filter(taskId => taskId !== id)
	const normalized = normalizeNpcConfig(mergeNpcConfig(config))
	if (!normalized) return false
	await updateNpcConfig(normalized)
	return true
}

export async function updateNpcSettings(config: NpcSimulationConfig): Promise<void> {
	const normalized = normalizeNpcConfig(mergeNpcConfig(config))
	if (!normalized) throw new Error('Invalid NPC settings')
	await updateNpcConfig(normalized)
}
