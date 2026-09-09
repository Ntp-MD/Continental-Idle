import { computed, type ComputedRef } from 'vue'
import type { AssetDef, FloorData, ObjectData } from '../domain/types'
import { resolveObjectDef } from '../domain/types'
import { findAssetCached } from '../assets/assetUtils'

export interface TileRun {
	x: number
	y: number
	w: number
	h: number
	state: string
}

export interface CanvasRunsSources {
	floor: ComputedRef<FloorData | undefined>
	tileSize: () => number
	assetMap: () => Map<string, AssetDef>
}

export function useCanvasRuns(sources: CanvasRunsSources) {
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

	function objDef(obj: ObjectData) {
		return (
			objDefMap.value.get(obj.id) ??
			resolveObjectDef(obj.rotation, findAssetCached(sources.assetMap(), obj.type), { w: obj.w, h: obj.h })
		)
	}

	return { objAssetMap, walkableRuns, objDef }
}
