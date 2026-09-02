import type { NpcSimulationConfig, NpcTask } from '../types'

export function genId(prefix: string): string {
	const arr = new Uint8Array(5)
	crypto.getRandomValues(arr)
	const suffix = Array.from(arr, b => b.toString(16).padStart(2, '0')).join('')
	return `${prefix}-${suffix}`
}

export function taskMatchesQuery(task: NpcTask, query: string): boolean {
	return task.label.toLowerCase().includes(query) || task.tags.some((tag) => tag.toLowerCase().includes(query))
}

export function emptyNpcConfig(): NpcSimulationConfig {
	return {
		speed: 0.2,
		defaultRoleId: '',
		roles: [],
		tasks: [],
		pool: [],
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
		frameSimBudgetMs: 6,
		maxSimulationSteps: 8,
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

export const editorLog = {
	error(context: string, error: unknown) {
		console.error(`[BlueprintEditor] ${context}:`, error)
	},
	warn(context: string, ...args: unknown[]) {
		console.warn(`[BlueprintEditor] ${context}:`, ...args)
	},
	info(context: string, ...args: unknown[]) {
		console.info(`[BlueprintEditor] ${context}:`, ...args)
	},
}

export function assignSyncKey(label: string, index: number, usedKeys: Set<string>): string {
	const canonical = editorFloorLabelToFloorId(label)
	const base = canonical ?? (index === 0 ? 'G' : String(index))
	if (!usedKeys.has(base)) return base
	let n = 2
	while (usedKeys.has(`${base}_${n}`)) n++
	return `${base}_${n}`
}

function editorFloorLabelToFloorId(label: string): string | null {
	if (label === 'G') return 'G'
	const match = label.match(/^F(\d+)$/)
	if (match) {
		const floorNumber = parseInt(match[1], 10)
		return floorNumber === 0 ? 'G' : String(floorNumber)
	}
	return null
}
