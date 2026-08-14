import type { FloorData, ObjectData } from '../types'
import { state } from '../store/state'
import {
	addFloor,
	deleteFloor,
	duplicateFloor,
	renameFloor,
	reorderFloors,
	selectFloor,
	updateFloor,
} from '../store/floors'
import {
	addObject,
	canPlaceObject,
	deleteSelected,
	moveSelectedTo,
	commitMove,
	rotateSelected,
	updateObjectProps,
	linkObjects,
	unlinkObject,
	toggleObjectLock,
} from '../store/objects'

export function listFloors(): readonly FloorData[] {
	return state.layout.floors
}

export function getFloor(id: string): FloorData | undefined {
	return state.layout.floors.find(floor => floor.id === id)
}

export { addFloor as createFloor, deleteFloor, duplicateFloor, renameFloor, reorderFloors, selectFloor, updateFloor }
export { addObject as createPlacedObject, canPlaceObject, deleteSelected, moveSelectedTo, commitMove, rotateSelected, updateObjectProps, linkObjects, unlinkObject, toggleObjectLock }

export function getPlacedObject(id: string): ObjectData | undefined {
	for (const floor of state.layout.floors) {
		const object = floor.objects.find(item => item.id === id)
		if (object) return object
	}
	return undefined
}
