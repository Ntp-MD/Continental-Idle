import type { ZoneData } from '../types'
import { genId, snap, clamp, currentFloor } from './state'
import { pushHistory } from './history'
import { saveLayout } from './persistence'

export async function addZone(x: number, y: number, w: number, h: number, label?: string, color?: string): Promise<ZoneData | null> {
  const floor = currentFloor.value
  if (!floor) return null
  pushHistory()
  const rect = clamp({ x: snap(x), y: snap(y), w: snap(w), h: snap(h) })
  const zone: ZoneData = { id: genId('zone'), x: rect.x, y: rect.y, w: rect.w, h: rect.h, label: label || 'New Zone', color: color || '#06b6d4' }
  if (!floor.zones) floor.zones = []
  floor.zones.push(zone)
  await saveLayout()
  return zone
}

export async function updateZone(id: string, patch: Partial<ZoneData>): Promise<void> {
  const floor = currentFloor.value
  if (!floor?.zones) return
  const z = floor.zones.find(z => z.id === id)
  if (!z) return
  pushHistory()
  if (patch.x !== undefined) z.x = clamp({ x: snap(patch.x), y: z.y, w: z.w, h: z.h }).x
  if (patch.y !== undefined) z.y = clamp({ x: z.x, y: snap(patch.y), w: z.w, h: z.h }).y
  if (patch.w !== undefined) z.w = clamp({ x: z.x, y: z.y, w: snap(patch.w), h: z.h }).w
  if (patch.h !== undefined) z.h = clamp({ x: z.x, y: z.y, w: z.w, h: snap(patch.h) }).h
  if (patch.label !== undefined) z.label = patch.label
  if (patch.color !== undefined) z.color = patch.color
  await saveLayout()
}

export async function deleteZone(id: string): Promise<void> {
  const floor = currentFloor.value
  if (!floor?.zones) return
  pushHistory()
  floor.zones = floor.zones.filter(z => z.id !== id)
  if (floor.zones.length === 0) delete floor.zones
  await saveLayout()
}
