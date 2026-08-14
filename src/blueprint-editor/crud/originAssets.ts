import type { AssetDef } from '../types'
import { state } from '../store/state'
import {
	addAsset,
	addSvgAsset,
	updateAsset,
	deleteAsset,
	rotateAsset,
	duplicateAsset,
} from '../store/assets'

export function listOriginAssets(): readonly AssetDef[] {
	return state.assetRegistry
}

export function getOriginAsset(id: string): AssetDef | undefined {
	return state.assetRegistry.find(asset => asset.id === id)
}

export const createOriginAsset = addAsset
export const createSvgOriginAsset = addSvgAsset
export { updateAsset, deleteAsset, rotateAsset, duplicateAsset }
