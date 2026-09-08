import { shallowRef, onUnmounted } from 'vue'
import type { DoorPanel } from '../assets/assetUtils'
import type { NpcSimDot } from '../domain/types'
import type { NpcEngineEvent } from '@/engine/npc'

export interface DoorAnimState {
	progress: number
	target: 0 | 1
	/** Timestamp of the last close transition; null while the door has never closed. */
	lastClosed: number | null
	/** Timestamp of the last observed room occupancy; drives the auto-close stability hold. */
	lastOccupied: number | null
}

const DOOR_CLOSE_DELAY_MS = 1000
const DOOR_ANIM_SPEED = 0.08
const DOOR_PROXIMITY_TILES = 2

export interface DoorAnimationHost {
	getDoors(): DoorPanel[]
	getNpcs(): readonly NpcSimDot[]
	getTileSize(): number
	getDoorPassageEvents?(): readonly NpcEngineEvent[]
}

function matchDoorPanel(panels: readonly DoorPanel[], edgeFromX: number, edgeFromY: number, edgeToX: number, edgeToY: number, tileSize: number): DoorPanel | undefined {
	const midPx = ((edgeFromX + edgeToX) / 2) * tileSize
	const midPy = ((edgeFromY + edgeToY) / 2) * tileSize
	const halfTile = tileSize / 2
	for (const panel of panels) {
		if (panel.horizontal) {
			const minX = panel.cx - panel.length / 2
			const maxX = panel.cx + panel.length / 2
			if (midPx >= minX && midPx <= maxX && Math.abs(midPy - panel.cy) <= halfTile) return panel
		} else {
			const minY = panel.cy - panel.length / 2
			const maxY = panel.cy + panel.length / 2
			if (midPy >= minY && midPy <= maxY && Math.abs(midPx - panel.cx) <= halfTile) return panel
		}
	}
	return undefined
}

function groupKeyOf(panel: DoorPanel): string {
	return panel.group ?? panel.key
}

export function useDoorAnimation(host: DoorAnimationHost) {
	const doorStates = shallowRef<Map<string, DoorAnimState>>(new Map())
	let rafId: number | null = null
	let lastConsumedEventTick = -1
	const passageCounts = new Map<string, number>()

	function tick(now: number): void {
		const doors = host.getDoors()
		if (!doors.length) {
			rafId = requestAnimationFrame(tick)
			return
		}
		const tileSize = host.getTileSize()
		const proximityPx = DOOR_PROXIMITY_TILES * tileSize
		const npcs = host.getNpcs()
		const states = new Map(doorStates.value)
		let changed = false
		const cycleClosed = new Set<string>()
		const agentById = new Map(npcs.map(npc => [npc.id, npc]))
		const panelsByGroup = new Map<string, DoorPanel[]>()
		for (const door of doors) {
			const g = groupKeyOf(door)
			const arr = panelsByGroup.get(g)
			if (arr) arr.push(door)
			else panelsByGroup.set(g, [door])
		}
		function groupMembers(door: DoorPanel): DoorPanel[] {
			return panelsByGroup.get(groupKeyOf(door)) ?? [door]
		}

		function doorOccupied(door: DoorPanel): boolean {
			const members = groupMembers(door)
			for (const member of members) {
				const prefix = `${member.key}|`
				for (const passageKey of passageCounts.keys()) {
					if (!passageKey.startsWith(prefix)) continue
					const status = agentById.get(passageKey.slice(prefix.length))?.status
					if (status === 'interacting' || status === 'chatting') return true
				}
			}
		for (const member of members) {
			for (const npc of npcs) {
				if (npc.status !== 'interacting') continue
				if (Math.hypot(npc.x - member.cx, npc.y - member.cy) >= proximityPx) continue
				return true
			}
		}
		return false
	}

	function doorRoomOccupied(door: DoorPanel, occupants: readonly NpcSimDot[]): boolean {
		if (!door.ownerObjectId) return false
		const ownerRef = `object:${door.ownerObjectId}`
		for (const npc of occupants) {
			if (npc.status !== 'interacting' && npc.status !== 'chatting') continue
			const key = npc.interactSpotKey ?? npc.interactTargetKey
			if (!key) continue
			const remainder = key.startsWith(`${npc.floorId}:`) ? key.slice(npc.floorId.length + 1) : key
			if (remainder === ownerRef || remainder.startsWith(`${ownerRef}:`)) return true
		}
		return false
	}

	function doorInTransit(door: DoorPanel): boolean {
		for (const member of groupMembers(door)) {
			const prefix = `${member.key}|`
			for (const passageKey of passageCounts.keys()) {
				if (passageKey.startsWith(prefix)) return true
			}
		}
		return false
	}

	function doorApproached(door: DoorPanel, occupants: readonly NpcSimDot[], proximityPx: number): boolean {
		for (const member of groupMembers(door)) {
			for (const npc of occupants) {
				if (npc.status !== 'walking' && npc.status !== 'idle' && npc.status !== 'waiting') continue
				if (Math.hypot(npc.x - member.cx, npc.y - member.cy) >= proximityPx) continue
				return true
			}
		}
		return false
	}

		const passageEvents = host.getDoorPassageEvents?.()
		if (passageEvents && passageEvents.length) {
			let maxTick = lastConsumedEventTick
			let batchMax = -1
			for (const evt of passageEvents) {
				if (evt.type === 'door-passage' && evt.doorEdge && evt.tick > batchMax) batchMax = evt.tick
			}
			if (batchMax >= 0 && lastConsumedEventTick >= 0 && batchMax < lastConsumedEventTick) {
				lastConsumedEventTick = -1
				passageCounts.clear()
				maxTick = -1
			}
			for (const evt of passageEvents) {
				if (evt.type !== 'door-passage' || evt.tick <= lastConsumedEventTick) continue
				if (!evt.doorEdge) continue
				const panel = matchDoorPanel(doors, evt.doorEdge.from.x, evt.doorEdge.from.y, evt.doorEdge.to.x, evt.doorEdge.to.y, tileSize)
				if (!panel) continue
				for (const member of groupMembers(panel)) {
					let state = states.get(member.key)
					if (!state) { state = { progress: 0, target: 0, lastClosed: null, lastOccupied: null }; states.set(member.key, state); changed = true }
					const cycleKey = `${member.key}|${evt.agentId}`
					const count = (passageCounts.get(cycleKey) ?? 0) + 1
					if (count % 2 === 0) {
						passageCounts.delete(cycleKey)
						cycleClosed.add(member.key)
					} else {
						passageCounts.set(cycleKey, count)
					}
				}
				maxTick = Math.max(maxTick, evt.tick)
			}
			lastConsumedEventTick = maxTick
		}

		for (const members of panelsByGroup.values()) {
			const door = members[0]
			if (members.some(m => cycleClosed.has(m.key))) continue
			for (const m of members) {
				if (!states.get(m.key)) { states.set(m.key, { progress: 0, target: 0, lastClosed: null, lastOccupied: null }); changed = true }
			}
			const setGroupTarget = (target: 0 | 1): void => {
				for (const m of members) {
					const st = states.get(m.key)!
					if (st.target !== target) { st.target = target; changed = true }
				}
			}
			if (door.mode === 'auto-close') {
				if (doorRoomOccupied(door, npcs)) {
					setGroupTarget(0)
					for (const m of members) states.get(m.key)!.lastOccupied = now
					changed = true
					continue
				}
				if (doorInTransit(door)) {
					setGroupTarget(1)
					continue
				}
				if (members.some(m => { const st = states.get(m.key)!; return st.lastOccupied !== null && now - st.lastOccupied < DOOR_CLOSE_DELAY_MS })) {
					setGroupTarget(0)
					continue
				}
				if (doorApproached(door, npcs, proximityPx)) {
					setGroupTarget(1)
					continue
				}
				setGroupTarget(0)
				continue
			}
			if (doorOccupied(door)) {
				setGroupTarget(0)
				continue
			}
			if (members.some(m => { const st = states.get(m.key)!; return st.lastClosed !== null && now - st.lastClosed < DOOR_CLOSE_DELAY_MS })) {
				setGroupTarget(0)
				continue
			}
			setGroupTarget(1)
		}

		for (const key of cycleClosed) {
			let state = states.get(key)
			if (!state) { state = { progress: 0, target: 0, lastClosed: null, lastOccupied: null }; states.set(key, state) }
			if (state.target !== 0) state.target = 0
			state.lastClosed = now
			changed = true
		}

		for (const door of doors) {
			const state = states.get(door.key)
			if (!state) continue
			const next = state.progress + (state.target - state.progress) * DOOR_ANIM_SPEED
			if (Math.abs(state.target - next) < 0.01) {
				if (state.progress !== state.target) { state.progress = state.target; changed = true }
			} else if (next !== state.progress) {
				state.progress = next
				changed = true
			}
		}
		if (changed) doorStates.value = states
		rafId = requestAnimationFrame(tick)
	}

	function start(): void {
		if (rafId === null) rafId = requestAnimationFrame(tick)
	}

	function stop(): void {
		if (rafId !== null) cancelAnimationFrame(rafId)
		rafId = null
	}

	function reset(): void {
		doorStates.value = new Map()
		lastConsumedEventTick = -1
		passageCounts.clear()
	}

	onUnmounted(stop)

	return {
		doorStates,
		start,
		stop,
		reset,
	}
}
