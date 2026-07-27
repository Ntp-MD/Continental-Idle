import { state, currentFloor, snap, assetMap, dragState } from './state'
import * as actions from './actions'

export * from './actions'
export { dragState, startAssetDrag, endAssetDrag, startRoomTemplateDrag, endRoomTemplateDrag } from './state'

export function useAssetsStore() {
  return {
    state,
    currentFloor,
    snap,
    assetMap,
    dragState,
    ...actions,
  }
}

export type AssetsStore = ReturnType<typeof useAssetsStore>

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    const hot = import.meta.hot!
    hot.data._editorLayout = JSON.stringify(state.layout)
    hot.data._editorState = {
      currentFloorId: state.currentFloorId,
      mode: state.mode,
      selectionState: state.selectionState,
      selectedAssetId: state.selectedAssetId,
      assetRegistry: state.assetRegistry,
      globalTags: state.globalTags,
    }
  })
}
