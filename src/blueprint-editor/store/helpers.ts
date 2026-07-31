import type { ObjectData } from '../types'
import { currentFloor } from './state'

export function getLinkedObjects(obj: ObjectData): ObjectData[] {
	const floor = currentFloor.value
	if (!floor || !obj.linkGroupId) return []
	return floor.objects.filter(o => o.id !== obj.id && o.linkGroupId === obj.linkGroupId)
}

export function editorFloorLabelToFloorId(label: string): string | null {
	if (label === 'G') return 'G'
	const match = label.match(/^F(\d+)$/)
	if (match) {
		const floorNumber = parseInt(match[1], 10)
		return floorNumber === 0 ? 'G' : String(floorNumber)
	}
	return null
}
