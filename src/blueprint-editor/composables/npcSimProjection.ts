import { cellToPixel } from '@/engine/npc'
import type { NpcEngineAgent } from '@/engine/npc'
import type { NpcRoleHat, NpcSimDot } from '@/blueprint-editor/domain/types'

export interface NpcSimLook {
	skinTone?: string
	trousers?: string
	hat?: NpcRoleHat
	hatColor?: string
}

export function blankSimDot(agent: Pick<NpcEngineAgent, 'id' | 'floorId' | 'roleId'>): NpcSimDot {
	return {
		id: agent.id,
		floorId: agent.floorId,
		type: agent.roleId ?? '',
		x: 0,
		y: 0,
		targetX: 0,
		targetY: 0,
		speed: 0,
		color: '#8ecae6',
		skinTone: '',
		trousers: '',
		hat: 'none',
		hatColor: '',
		status: 'idle',
		pauseTimer: 0,
		pathIdx: 0,
		path: [],
		interactTargetKey: null,
		interactSpotKey: null,
		interactDurationMin: 0,
		interactDurationMax: 0,
	}
}

export function updateSimDot(
	existing: NpcSimDot | undefined,
	agent: NpcEngineAgent,
	cellSize: number,
	resolveColor: (roleId: string) => string,
	resolveLook?: (roleId: string) => NpcSimLook,
): NpcSimDot {
	const dot: NpcSimDot = existing ?? blankSimDot(agent)
	dot.floorId = agent.floorId
	dot.type = agent.roleId ?? ''
	dot.x = cellToPixel(agent.x, cellSize)
	dot.y = cellToPixel(agent.y, cellSize)
	dot.targetX = cellToPixel(agent.targetX, cellSize)
	dot.targetY = cellToPixel(agent.targetY, cellSize)
	dot.status = agent.status
	if (agent.reservationItemId !== null && agent.reservationInteractSpotId !== null) {
		dot.interactTargetKey = `${agent.floorId}:${agent.reservationItemId}`
		dot.interactSpotKey = `${agent.floorId}:${agent.reservationItemId}:${agent.reservationInteractSpotId}`
	} else {
		dot.interactTargetKey = null
		dot.interactSpotKey = null
	}
	if (dot.path.length !== agent.path.length || agent.pathIndex < dot.pathIdx) {
		dot.path = agent.path.map(point => [cellToPixel(point.x, cellSize), cellToPixel(point.y, cellSize)] as [number, number])
	}
	dot.pathIdx = agent.pathIndex
	dot.color = resolveColor(agent.roleId ?? '')
	const look = resolveLook?.(agent.roleId ?? '')
	dot.skinTone = look?.skinTone ?? ''
	dot.trousers = look?.trousers ?? ''
	dot.hat = look?.hat ?? 'none'
	dot.hatColor = look?.hatColor ?? ''
	return dot
}

export function pruneStaleDots(frameDots: Map<string, NpcSimDot>, seenIds: ReadonlySet<string>): void {
	if (frameDots.size <= seenIds.size) return
	for (const id of frameDots.keys()) {
		if (!seenIds.has(id)) frameDots.delete(id)
	}
}

export function pruneWaitReasons(waitReasons: Map<string, string>, frameDots: ReadonlyMap<string, NpcSimDot>): void {
	for (const id of waitReasons.keys()) {
		const dot = frameDots.get(id)
		if (!dot || (dot.status !== 'waiting' && dot.status !== 'queued')) waitReasons.delete(id)
	}
}

export function filterDotsForFloor(dots: Iterable<NpcSimDot>, floorId: string | null): NpcSimDot[] {
	return [...dots].filter(dot => dot.floorId === floorId)
}
