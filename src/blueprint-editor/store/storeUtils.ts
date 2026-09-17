import { toRaw } from 'vue'
import { NPC_DEFAULT_SPEED, NPC_OPTION_DEFAULTS, NPC_FRAME_DEFAULTS, type NpcSimulationConfig, type NpcTask } from '../domain/types'

export function genId(prefix: string): string {
	const arr = new Uint8Array(5)
	crypto.getRandomValues(arr)
	const suffix = Array.from(arr, b => b.toString(16).padStart(2, '0')).join('')
	return `${prefix}-${suffix}`
}

export function taskMatchesQuery(task: NpcTask, query: string): boolean {
	return task.label.toLowerCase().includes(query) || task.tags.some((tag) => tag.toLowerCase().includes(query))
}

export function cloneDeepRaw<T>(value: T): T {
	return structuredClone(deepToRaw(value))
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

export { editorLog } from '../domain/logger'
