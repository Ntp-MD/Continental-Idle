import { ref, watch, onUnmounted, type Ref } from 'vue'

export function useDebouncedRef<T>(source: Ref<T>, delayMs: number): Ref<T> {
  const debounced = ref(source.value) as Ref<T>
  let timer: ReturnType<typeof setTimeout> | null = null

  watch(source, (value) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      debounced.value = value
      timer = null
    }, delayMs)
  })

  onUnmounted(() => {
    if (timer) clearTimeout(timer)
  })

  return debounced
}

export function useDebouncedCallback<T extends (...args: never[]) => void>(fn: T, delayMs: number): T {
  let timer: ReturnType<typeof setTimeout> | null = null
  const wrapped = ((...args: never[]) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn(...args)
      timer = null
    }, delayMs)
  }) as T

  onUnmounted(() => {
    if (timer) clearTimeout(timer)
  })

  return wrapped
}
