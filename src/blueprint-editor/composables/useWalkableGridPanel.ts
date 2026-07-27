import { ref } from 'vue'

const showWalkableGridPanel = ref(false)

export function useWalkableGridPanel() {
  return {
    showWalkableGridPanel,
    openWalkableGridPanel: () => { showWalkableGridPanel.value = true },
    closeWalkableGridPanel: () => { showWalkableGridPanel.value = false },
  }
}
