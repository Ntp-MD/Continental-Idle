import { computed, shallowRef } from 'vue'

export function useDirtyBaseline<T>(current: () => T) {
  const baseline = shallowRef<T>(current())

  function saveBaseline(): void {
    baseline.value = current()
  }

  const dirty = computed(() => JSON.stringify(current()) !== JSON.stringify(baseline.value))

  return { dirty, saveBaseline }
}
