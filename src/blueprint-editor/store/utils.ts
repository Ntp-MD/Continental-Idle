import type { ObjectData } from '../types'
import { currentFloor } from './state'
import { genId, editorLog, editorFloorLabelToFloorId, assignSyncKey } from './storeUtils'

export { genId, editorLog, editorFloorLabelToFloorId, assignSyncKey }

export function getLinkedObjects(obj: ObjectData): ObjectData[] {
	const floor = currentFloor.value
	if (!floor || !obj.linkGroupId) return []
	return floor.objects.filter(o => o.id !== obj.id && o.linkGroupId === obj.linkGroupId)
}
