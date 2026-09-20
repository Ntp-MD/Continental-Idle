import { resolveInteractSpotAnchor, resolveStreetTiles, spawnZoneAllowsRole } from '../domain/types'
import type { AssetDef, CanvasConfig, FloorData, FloorLayoutData, NpcSimulationConfig, NpcSpawnZone } from '../domain/types'

export interface PortalValidationResult {
	errors: string[]
	warnings: string[]
}

export interface SettingsCompletenessResult {
	issues: string[]
}

function collectFloorAssetTags(layout: FloorLayoutData, assetMap: Map<string, AssetDef>): Set<string> {
	const tags = new Set<string>()
	for (const floor of layout.floors) {
		for (const object of floor.objects) {
			const asset = assetMap.get(object.type)
			if (!asset?.tags) continue
			for (const tag of asset.tags) tags.add(tag.trim().toLowerCase())
		}
	}
	return tags
}

function floorHasSpawnZoneForRole(floor: FloorData, roleId: string): boolean {
	const zones = floor.spawnZones
	if (!zones?.length) return false
	return zones.some(zone => spawnZoneAllowsRole(zone, roleId))
}

function roleCanReachFloor(roleId: string, floor: FloorData, poolFloorIds: string[] | undefined): boolean {
	if (floor.allowedRoleIds?.length && !floor.allowedRoleIds.includes(roleId)) return false
	if (poolFloorIds?.length && !poolFloorIds.includes(floor.id)) return false
	return true
}

export function isGuestRoleId(roleId: string): boolean {
	return roleId.toLowerCase().includes('guest')
}

function zoneOverlapsStreetRing(zone: NpcSpawnZone, canvas: CanvasConfig, streetWidthTiles: number): boolean {
	const tileSize = Math.max(1, canvas.tileSize)
	const cols = Math.max(0, Math.ceil(canvas.width / tileSize))
	const rows = Math.max(0, Math.ceil(canvas.height / tileSize))
	const band = streetWidthTiles
	// Mirror the engine: no street cells exist when the ring covers the whole canvas.
	if (cols <= band * 2 || rows <= band * 2) return false
	for (let ty = 0; ty < rows; ty++) {
		const rowBand = ty < band || ty >= rows - band
		for (let tx = 0; tx < cols; tx++) {
			if (!rowBand && !(tx < band || tx >= cols - band)) continue
			// Engine spawn predicate (filterNpcSpawnTiles): a cell spawns iff its
			// center px lands inside the zone. A zone that contains no street cell
			// center can never spawn a guest, so it does NOT satisfy the convention.
			const px = (tx + 0.5) * tileSize
			const py = (ty + 0.5) * tileSize
			if (px >= zone.x && px < zone.x + zone.w && py >= zone.y && py < zone.y + zone.h) return true
		}
	}
	return false
}

export interface FloorEntrance {
	key: string
	x: number
	y: number
}

export function collectFloorEntrances(
	floor: FloorData,
	canvas: CanvasConfig,
	streetWidthTiles: number,
): FloorEntrance[] {
	const tileSize = Math.max(1, Math.round(canvas.tileSize))
	const cols = Math.max(1, Math.ceil(canvas.width / tileSize))
	const rows = Math.max(1, Math.ceil(canvas.height / tileSize))
	const states = floor.walkable?.tileStates
	if (!states?.length) return []
	const isStreetCell = (x: number, y: number): boolean =>
		x < streetWidthTiles || y < streetWidthTiles || x >= cols - streetWidthTiles || y >= rows - streetWidthTiles
	const entrances: FloorEntrance[] = []
	for (let y = 0; y < Math.min(rows, states.length); y++) {
		const row = states[y]
		if (!row) continue
		for (let x = 0; x < Math.min(cols, row.length); x++) {
			if (row[x] !== 'door') continue
			const neighbors = [
				[x - 1, y],
				[x + 1, y],
				[x, y - 1],
				[x, y + 1],
			].filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < cols && ny < rows)
			const nearStreet = neighbors.some(([nx, ny]) => isStreetCell(nx, ny))
			const nearInterior = neighbors.some(([nx, ny]) => !isStreetCell(nx, ny))
			if (nearStreet && nearInterior) entrances.push({ key: `${x},${y}`, x, y })
		}
	}
	return entrances
}

export function validateSettingsCompleteness(
	layout: FloorLayoutData,
	assetMap: Map<string, AssetDef>,
	npcConfig: NpcSimulationConfig | undefined,
): SettingsCompletenessResult {
	const issues: string[] = []

	if (!npcConfig) {
		issues.push('No NPC configuration defined')
		return { issues }
	}

	if (!npcConfig.roles.length) {
		issues.push('No NPC roles defined')
		return { issues }
	}

	if (!npcConfig.pool.length) {
		issues.push('NPC pool is empty - no NPCs will spawn')
	}

	const floorAssetTags = collectFloorAssetTags(layout, assetMap)
	const roleIds = new Set(npcConfig.roles.map(role => role.id))
	const taskIdsReferenced = new Set<string>()

	for (const role of npcConfig.roles) {
		const focusTags = role.focusTags
		const hasTasks = role.taskIds.length > 0
		for (const taskId of role.taskIds) taskIdsReferenced.add(taskId)

		if (role.focusChance > 0 && focusTags.length === 0 && !hasTasks) {
			issues.push(`Role "${role.label}" has focusChance=${role.focusChance}% but no focus tags or tasks assigned`)
		}

		if (role.restrictedTags.length > 0) {
			const matching = role.restrictedTags.some(tag => floorAssetTags.has(tag.trim().toLowerCase()))
			if (!matching) {
				issues.push(`Role "${role.label}" restricts to tags [${role.restrictedTags.join(', ')}] but no asset on any floor matches`)
			}
		}

		if (role.spawnRule?.targetTags?.length) {
			const matching = role.spawnRule.targetTags.some(tag => floorAssetTags.has(tag.trim().toLowerCase()))
			if (!matching) {
				issues.push(`Role "${role.label}" spawn rule targets tags [${role.spawnRule.targetTags.join(', ')}] but no asset on any floor matches`)
			}
		}

		for (const floor of layout.floors) {
			const allowed = !floor.allowedRoleIds?.length || floor.allowedRoleIds.includes(role.id)
			if (!allowed) continue
			if (!floorHasSpawnZoneForRole(floor, role.id)) {
				issues.push(`Floor "${floor.label}" allows role "${role.label}" but has no spawn zone for it`)
			}
		}
	}

	for (const task of npcConfig.tasks) {
		if (!taskIdsReferenced.has(task.id)) {
			issues.push(`Task "${task.label}" is not assigned to any role`)
		}
		const post = task.post
		if (!post) continue
		const asset = assetMap.get(post.assetId)
		if (!asset) {
			issues.push(`Task "${task.label}" posts to unknown asset "${post.assetId}" - it behaves as a plain tag task`)
			continue
		}
		const spots = asset.interactSpots ?? []
		const matching = post.post ? spots.filter(spot => spot.post === post.post) : spots
		if (!matching.length) {
			issues.push(`Task "${task.label}" posts to "${post.post ?? 'any spot'}" but asset "${asset.name}" has no matching spot`)
			continue
		}
		if ((asset.tags ?? []).includes('portal')) {
			issues.push(`Task "${task.label}" posts to portal asset "${asset.name}" - the post index ignores portals`)
		}
		const anchors = new Map<string, string>()
		for (const spot of matching) {
			const anchor = spot.kind === 'edge'
				? resolveInteractSpotAnchor(spot, asset.svgViewBox?.w ?? 0, asset.svgViewBox?.h ?? 0)
				: { x: spot.x, y: spot.y }
			const key = `${anchor.x},${anchor.y}`
			const prev = anchors.get(key)
			if (prev !== undefined && prev !== (spot.post ?? '')) {
				issues.push(`Asset "${asset.name}" has different posts sharing one cell - "${prev || 'unnamed'}" vs "${spot.post ?? 'unnamed'}"`)
			} else {
				anchors.set(key, spot.post ?? '')
			}
		}
		const placedFloors = layout.floors.filter(floor => floor.objects.some(object => object.type === asset.id))
		if (!placedFloors.length) {
			issues.push(`Task "${task.label}" posts to asset "${asset.name}" which is not placed on any floor`)
			continue
		}
		const assetTags = new Set((asset.tags ?? []).map(tag => tag.trim().toLowerCase()))
		for (const role of npcConfig.roles.filter(candidate => candidate.taskIds.includes(task.id))) {
			const poolEntry = npcConfig.pool.find(entry => entry.roleId === role.id)
			const poolCount = poolEntry?.count ?? 0
			if (poolCount <= 0) {
				issues.push(`Task "${task.label}" posts role "${role.label}" but its pool count is 0 - nobody will man the post`)
			}
			if (role.restrictedTags.some(tag => assetTags.has(tag.trim().toLowerCase()))) {
				issues.push(`Task "${task.label}" posts role "${role.label}" to asset "${asset.name}" whose tags it restricts - the post may be unreachable`)
			}
			const reachable = placedFloors.some(floor => roleCanReachFloor(role.id, floor, poolEntry?.floorIds))
			if (!reachable) {
				issues.push(`Task "${task.label}" posts role "${role.label}" but every floor with "${asset.name}" excludes it`)
			}
		}
	}

	for (const entry of npcConfig.pool) {
		if (!roleIds.has(entry.roleId)) {
			issues.push(`Pool entry references unknown role "${entry.roleId}"`)
			continue
		}
		if (entry.count <= 0) {
			const role = npcConfig.roles.find(r => r.id === entry.roleId)
			issues.push(`Pool entry for role "${role?.label ?? entry.roleId}" has count ${entry.count} - no NPCs will spawn`)
		}
		if (entry.count > 0 && entry.floorIds?.length) {
			const role = npcConfig.roles.find(r => r.id === entry.roleId)
			for (const floorId of entry.floorIds) {
				const floor = layout.floors.find(f => f.id === floorId)
				if (floor && floor.objects.length === 0) {
					issues.push(`Pool entry for role "${role?.label ?? entry.roleId}" targets floor "${floor.label}" with no placed objects - NPCs will spawn with nothing to do`)
				}
			}
		}
	}

	for (const floor of layout.floors) {
		if (!floor.objects.length) continue
		const floorTags = new Set<string>()
		const floorAssetIds = new Set<string>()
		const floorPosts = new Map<string, Set<string>>()
		for (const object of floor.objects) {
			const asset = assetMap.get(object.type)
			if (!asset) continue
			floorAssetIds.add(asset.id)
			for (const tag of asset.tags ?? []) floorTags.add(tag.trim().toLowerCase())
			if (!floorPosts.has(asset.id)) {
				floorPosts.set(asset.id, new Set((asset.interactSpots ?? []).map(spot => spot.post).filter((post): post is string => !!post)))
			}
		}
		for (const zone of floor.spawnZones ?? []) {
			const zonedRoleIds = zone.roleIds?.length ? zone.roleIds : npcConfig.roles.map(role => role.id)
			for (const roleId of zonedRoleIds) {
				const role = npcConfig.roles.find(candidate => candidate.id === roleId)
				if (!role) continue
				if (role.taskIds.length === 0 && role.focusTags.length === 0) continue
				const resolves = role.taskIds.some(taskId => {
					const task = npcConfig.tasks.find(candidate => candidate.id === taskId)
					if (!task) return false
					if (task.tags.some(tag => floorTags.has(tag.trim().toLowerCase()))) return true
					if (task.post && floorAssetIds.has(task.post.assetId)) {
						if (!task.post.post) return true
						return floorPosts.get(task.post.assetId)?.has(task.post.post) ?? false
					}
					return false
				}) || role.focusTags.some(tag => floorTags.has(tag.trim().toLowerCase()))
				if (!resolves) {
					issues.push(`Floor "${floor.label}" spawn zone "${zone.label}" spawns role "${role.label}" but none of its tasks or focus tags match anything on this floor`)
				}
			}
		}
	}

	const streetFloorId = layout.streetFloorId
	if (streetFloorId) {
		const streetFloor = layout.floors.find(floor => floor.id === streetFloorId)
		if (streetFloor) {
			const streetGuestRoleIds = new Set(npcConfig.pool
				.filter(entry => entry.count > 0
					&& isGuestRoleId(entry.roleId)
					&& (!entry.floorIds?.length || entry.floorIds.includes(streetFloorId))
					&& (!streetFloor.allowedRoleIds?.length || streetFloor.allowedRoleIds.includes(entry.roleId)))
				.map(entry => entry.roleId))
			const streetWidth = resolveStreetTiles(layout)
			const served = [...streetGuestRoleIds].some(roleId =>
				(streetFloor.spawnZones ?? []).some(zone =>
					spawnZoneAllowsRole(zone, roleId)
					&& zoneOverlapsStreetRing(zone, layout.canvas, streetWidth)))
			if (streetGuestRoleIds.size > 0) {
				if (!served) {
					issues.push(`Floor "${streetFloor.label}" is the street floor but no spawn zone covers its sidewalk - guest arrivals need a street-side spawn zone`)
				} else if (collectFloorEntrances(streetFloor, layout.canvas, streetWidth).length === 0) {
					issues.push(`Floor "${streetFloor.label}" has street-side spawn zones but no door connects the street to the building - guest arrivals need an entrance door on the street floor`)
				}
			}
		}
	}

	for (const floor of layout.floors) {
		const states = floor.walkable?.tileStates
		if (states?.length) {
			let masses = 0
			for (let row = 0; row < states.length - 1; row++) {
				const upper = states[row]
				const lower = states[row + 1]
				if (!upper || !lower) continue
				for (let col = 0; col < Math.min(upper.length, lower.length) - 1; col++) {
					if (upper[col] === 'blocked' && upper[col + 1] === 'blocked' && lower[col] === 'blocked' && lower[col + 1] === 'blocked') masses++
				}
			}
			if (masses > 0) {
				issues.push(`Floor "${floor.label}" has ${masses} 2x2 solid wall block(s) - walls must stay single-tile`)
			}
		}
		const interactableObjects = floor.objects.filter(object => {
			const asset = assetMap.get(object.type)
			if (!asset) return false
			if (asset.walkable) return false
			return true
		})
		const withInteractSpots = interactableObjects.filter(object => {
			const asset = assetMap.get(object.type)
			return asset?.interactSpots?.length
		})
		if (interactableObjects.length > 0 && withInteractSpots.length === 0) {
			issues.push(`Floor "${floor.label}" has ${interactableObjects.length} object(s) but none have interact spots - NPCs cannot interact here`)
		}

		for (const object of floor.objects) {
			const asset = assetMap.get(object.type)
			if (!asset) {
				issues.push(`Object "${object.id}" on floor "${floor.label}" references unknown asset type "${object.type}"`)
			}
		}
	}

	return { issues }
}


export function validatePortalConfiguration(
	layout: FloorLayoutData,
	assetMap: Map<string, AssetDef>,
	npcConfig: NpcSimulationConfig | undefined,
): PortalValidationResult {
	const errors: string[] = []
	const warnings: string[] = []

	const roleIds = new Set(npcConfig?.roles?.map(role => role.id) ?? [])


	const portalFloorLabels: string[] = []
	const portalSpotCounts = new Map<string, number>()
	for (const floor of layout.floors) {
		let hasPortal = false
		for (const object of floor.objects) {
			const asset = assetMap.get(object.type)
			const isPortal = asset?.tags?.includes('portal') ?? false
			if (!isPortal) continue
			hasPortal = true
			if (!asset?.interactSpots?.length) {
				warnings.push(`Portal object "${object.id}" on floor "${floor.label}" has no interactSpots on its asset "${object.type}"`)
			} else {
				portalSpotCounts.set(object.type, asset.interactSpots.length)
			}
		}
		if (hasPortal) portalFloorLabels.push(floor.label)
	}

	if (new Set(portalSpotCounts.values()).size > 1) {
		const detail = [...portalSpotCounts.entries()].map(([type, count]) => `"${type}": ${count}`).join(', ')
		warnings.push(`Portal assets have mismatched interactSpot counts (${detail}) - cross-floor travel falls back to the last available spot; align the spot counts for predictable routing`)
	}

	if (portalFloorLabels.length > 0 && portalFloorLabels.length < 2) {
		warnings.push(`Portals exist on only 1 floor (${portalFloorLabels[0]}); cross-floor travel requires portals on at least 2 floors`)
	}


	for (const floor of layout.floors) {
		if (!floor.allowedRoleIds?.length) continue
		for (const roleId of floor.allowedRoleIds) {
			if (!roleIds.has(roleId)) {
				warnings.push(`Floor "${floor.label}" allowedRoleIds references unknown role "${roleId}"`)
			}
		}
	}

	return { errors, warnings }
}
