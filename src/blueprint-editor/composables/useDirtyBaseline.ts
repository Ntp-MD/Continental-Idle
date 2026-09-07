import { computed, shallowRef } from 'vue'

function snapshot<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function useDirtyBaseline<T>(current: () => T) {
  const baseline = shallowRef<T>(snapshot(current()))

  function saveBaseline(): void {
    baseline.value = snapshot(current())
  }

  const dirty = computed(() => JSON.stringify(current()) !== JSON.stringify(baseline.value))

  return { dirty, saveBaseline }
}
