import { computed, shallowRef } from 'vue'
import { cloneDeepRaw, deepEqualRaw } from '../store/storeUtils'

export function useDirtyBaseline<T>(current: () => T) {
  const baseline = shallowRef<T>(cloneDeepRaw(current()))

  function saveBaseline(): void {
    baseline.value = cloneDeepRaw(current())
  }

  const dirty = computed(() => !deepEqualRaw(current(), baseline.value))

  return { dirty, saveBaseline }
}
