import type { ObjectData } from '../types'
import { currentFloor } from './state'
import { genId, genAssetId, editorLog, editorFloorLabelToFloorId, assignSyncKey, emptyNpcConfig } from './storeUtils'

export { genId, genAssetId, editorLog, editorFloorLabelToFloorId, assignSyncKey, emptyNpcConfig }

export function getLinkedObjects(obj: ObjectData): ObjectData[] {
	const floor = currentFloor.value
	if (!floor || !obj.linkGroupId) return []
	return floor.objects.filter(o => o.id !== obj.id && o.linkGroupId === obj.linkGroupId)
}
