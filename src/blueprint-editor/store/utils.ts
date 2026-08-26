import type { NpcSimulationConfig, ObjectData } from '../types'
import { currentFloor } from './state'
import { genId, genAssetId, editorLog, editorFloorLabelToFloorId, assignSyncKey } from './storeUtils'

export { genId, genAssetId, editorLog, editorFloorLabelToFloorId, assignSyncKey }

export function emptyNpcConfig(): NpcSimulationConfig {
	return { speed: 0.2, defaultRoleId: '', roles: [], tasks: [], pool: [] }
}

export function getLinkedObjects(obj: ObjectData): ObjectData[] {
	const floor = currentFloor.value
	if (!floor || !obj.linkGroupId) return []
	return floor.objects.filter(o => o.id !== obj.id && o.linkGroupId === obj.linkGroupId)
}
