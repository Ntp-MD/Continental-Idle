import { computed, type ComputedRef } from 'vue'
import type { AssetDef, FloorData, ObjectData, Rect, WallSegment } from '../domain/types'
import { CANVAS_WALL_OBJECT_TYPE, resolveObjectDef, resolveWallSegmentsForObject } from '../domain/types'
import { findAssetCached, doorPanelsData, doorSlideDir, type DoorPanel } from '../assets/assetUtils'
import { useCanvasWallStyle } from './useCanvasWallStyle'

export interface TileRun {
	x: number
	y: number
	w: number
	h: number
	state: string
}

export interface WallRun extends WallSegment {
	objectId: string
}

export interface ObjWallLine extends WallSegment {
	id: string
}

export interface CanvasRunsSources {
	floor: ComputedRef<FloorData | undefined>
	tileSize: () => number
	assetMap: () => Map<string, AssetDef>
}

export function useCanvasRuns(sources: CanvasRunsSources) {
	const { wallThickness } = useCanvasWallStyle()

	const objDefMap = computed(() => {
		const map = new Map<string, ReturnType<typeof resolveObjectDef>>()
		const assets = sources.assetMap()
		for (const obj of sources.floor.value?.objects ?? []) {
			map.set(obj.id, resolveObjectDef(obj.rotation, findAssetCached(assets, obj.type), { w: obj.w, h: obj.h }))
		}
		return map
	})

	const objAssetMap = computed(() => {
		const map = new Map<string, AssetDef | undefined>()
		const assets = sources.assetMap()
		for (const obj of sources.floor.value?.objects ?? []) {
			map.set(obj.id, findAssetCached(assets, obj.type))
		}
		return map
	})

	const walkableRuns = computed<TileRun[]>(() => {
		const tileStates = sources.floor.value?.walkable?.tileStates
		if (!tileStates) return []
		const t = sources.tileSize()
		const runs: TileRun[] = []
		for (let r = 0; r < tileStates.length; r++) {
			const row = tileStates[r]
			let c = 0
			while (c < row.length) {
				const state = row[c]
				let endC = c + 1
				while (endC < row.length && row[endC] === state) endC++
				runs.push({ x: c * t, y: r * t, w: (endC - c) * t, h: t, state })
				c = endC
			}
		}
		return runs
	})

	const wallRuns = computed<WallRun[]>(() => {
		const fl = sources.floor.value
		if (!fl) return []
		const t = sources.tileSize()
		return fl.objects
			.filter((object) => object.isWall && object.type === CANVAS_WALL_OBJECT_TYPE)
			.flatMap((object) => {
				if ([object.x1, object.y1, object.x2, object.y2].some((value) => typeof value !== 'number')) return []
				const run: WallRun = {
					objectId: object.id,
					x1: object.x1! * t,
					y1: object.y1! * t,
					x2: object.x2! * t,
					y2: object.y2! * t,
				}
				if (object.door) run.door = true
				return [run]
			})
	})

	const objWallLines = computed<ObjWallLine[]>(() => {
		const fl = sources.floor.value
		if (!fl) return []
		const assets = sources.assetMap()
		const t = sources.tileSize()
		return fl.objects.flatMap((object) => {
			const asset = assets.get(object.type)
			if (!asset?.wallSegments?.length) return []
			return resolveWallSegmentsForObject(asset.wallSegments, asset, object, t).map((segment) => ({
				...segment,
				id: object.id,
			}))
		})
	})

	const wallRunsNoDoors = computed(() => wallRuns.value.filter((w) => !w.door))
	const objWallLinesNoDoors = computed(() => objWallLines.value.filter((w) => !w.door))

	const doorPanels = computed<DoorPanel[]>(() => {
		const thickness = wallThickness.value
		const objects = sources.floor.value?.objects ?? []
		const panels: DoorPanel[] = []
		const pushPanels = (segments: readonly WallSegment[], ownerId: string, ownerWalls: readonly WallSegment[]) => {
			const blockers = objects.filter(o => o.id !== ownerId)
			for (const panel of doorPanelsData(segments, 1, thickness)) {
				const halfT = panel.thickness / 2
				const ownWalls: Rect[] = ownerWalls
					.filter(s => !s.door && (
						panel.horizontal
							? s.y1 === s.y2 && Math.abs(s.y1 - panel.cy) <= halfT
							: s.x1 === s.x2 && Math.abs(s.x1 - panel.cx) <= halfT
					))
					.map(s => ({ x: Math.min(s.x1, s.x2), y: Math.min(s.y1, s.y2), w: Math.abs(s.x2 - s.x1), h: Math.abs(s.y2 - s.y1) }))
				panels.push({ ...panel, slideDir: doorSlideDir(panel, blockers, ownWalls) })
			}
		}
		for (const run of wallRuns.value) {
			if (run.door) pushPanels([run], run.objectId, [])
		}
		for (const line of objWallLines.value) {
			if (line.door) pushPanels([line], line.id, objWallLines.value.filter(o => o.id === line.id && !o.door))
		}
		return panels
	})

	function objDef(obj: ObjectData) {
		return (
			objDefMap.value.get(obj.id) ??
			resolveObjectDef(obj.rotation, findAssetCached(sources.assetMap(), obj.type), { w: obj.w, h: obj.h })
		)
	}

	return { objDefMap, objAssetMap, walkableRuns, wallRuns, objWallLines, wallRunsNoDoors, objWallLinesNoDoors, doorPanels, objDef }
}
