import { ref, onBeforeUnmount } from 'vue'

const FLASH_ERROR_MS = 1200

export function useFieldError() {
  const errorFields = ref<Record<string, boolean>>({})
  const flashErrorTimers = new Map<string, number>()

  function flashError(field: string): void {
    const existing = flashErrorTimers.get(field)
    if (existing) window.clearTimeout(existing)
    errorFields.value[field] = true
    const id = window.setTimeout(() => {
      errorFields.value[field] = false
      flashErrorTimers.delete(field)
    }, FLASH_ERROR_MS)
    flashErrorTimers.set(field, id)
  }

  onBeforeUnmount(() => {
    for (const id of flashErrorTimers.values()) window.clearTimeout(id)
    flashErrorTimers.clear()
  })

  return { errorFields, flashError }
}
