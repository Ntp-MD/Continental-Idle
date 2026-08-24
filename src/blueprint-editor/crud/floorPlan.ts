import type { FloorData } from '../types'
import {
	deleteFloor,
	duplicateFloor,
	renameFloor,
	reorderFloors,
	selectFloor,
	updateFloor,
} from '../store/floors'
import {
	canPlaceObject,
	deleteSelected,
	moveSelectedTo,
	commitMove,
	rotateSelected,
	linkObjects,
	unlinkObject,
	toggleObjectLock,
} from '../store/objects'

import { state } from '../store/state'

export function getFloor(id: string): FloorData | undefined {
	return state.layout.floors.find(floor => floor.id === id)
}

export { deleteFloor, duplicateFloor, renameFloor, reorderFloors, selectFloor, updateFloor }
export { canPlaceObject, deleteSelected, moveSelectedTo, commitMove, rotateSelected, linkObjects, unlinkObject, toggleObjectLock }
