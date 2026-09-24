import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import type { NpcSimDot, TileState } from '../domain/types'
import { groupDoorCells } from '../domain/types'

export interface DoorCellRect {
	key: string
	groupKey: string
	x: number
	y: number
	w: number
	h: number
	slideDir: -1 | 1
	axis: 'x' | 'y'
}

const CLOSE_DELAY_MS = 500
const APPROACH_TILES = 1

export function useDoorTileAnimation(opts: {
	tileStates: () => TileState[][] | undefined
	floorId: () => string
	tileSize: () => number
	npcs: () => NpcSimDot[]
}): { cells: ComputedRef<DoorCellRect[]>; openKeys: Ref<Set<string>> } {
	const groups = computed(() => groupDoorCells(opts.tileStates() ?? []))

	const cells = computed<DoorCellRect[]>(() => {
		const size = opts.tileSize()
		return groups.value.flatMap((group) =>
			group.cells.map((cell) => ({
				key: `${group.key}:${cell.row},${cell.col}`,
				groupKey: group.key,
				x: cell.col * size,
				y: cell.row * size,
				w: size,
				h: size,
				slideDir: cell.slideDir,
				axis: group.axis,
			})),
		)
	})

	const openKeys = ref<Set<string>>(new Set())
	const closeTimers = new Map<string, ReturnType<typeof setTimeout>>()

	// Door geometry only moves when the groups or the tile size move; the NPC watcher runs
	// every frame, so the per-group bounds belong here and not inside that loop.
	const groupBounds = computed(() => {
		const size = opts.tileSize()
		const pad = APPROACH_TILES * size
		return groups.value.map((group) => {
			const rows = group.cells.map((cell) => cell.row)
			const cols = group.cells.map((cell) => cell.col)
			return {
				key: group.key,
				minX: Math.min(...cols) * size - pad,
				maxX: (Math.max(...cols) + 1) * size + pad,
				minY: Math.min(...rows) * size - pad,
				maxY: (Math.max(...rows) + 1) * size + pad,
			}
		})
	})

	watch(groups, () => {
		for (const timer of closeTimers.values()) clearTimeout(timer)
		closeTimers.clear()
		openKeys.value = new Set()
	})

	watch(
		() => opts.npcs(),
		(dots) => {
			const bounds = groupBounds.value
			const floorId = opts.floorId()
			const near = new Set<string>()
			for (const group of bounds) {
				for (const dot of dots) {
					if (dot.floorId !== floorId) continue
					if (dot.x >= group.minX && dot.x <= group.maxX && dot.y >= group.minY && dot.y <= group.maxY) {
						near.add(group.key)
						break
					}
				}
			}
			const next = new Set(openKeys.value)
			for (const key of near) {
				const timer = closeTimers.get(key)
				if (timer) {
					clearTimeout(timer)
					closeTimers.delete(key)
				}
				next.add(key)
			}
			for (const key of next) {
				if (near.has(key) || closeTimers.has(key)) continue
				closeTimers.set(
					key,
					setTimeout(() => {
						closeTimers.delete(key)
						const remaining = new Set(openKeys.value)
						remaining.delete(key)
						openKeys.value = remaining
					}, CLOSE_DELAY_MS),
				)
			}
			openKeys.value = next
		},
	)

	return { cells, openKeys }
}