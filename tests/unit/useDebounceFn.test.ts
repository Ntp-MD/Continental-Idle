import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick, effectScope } from 'vue'
import { useDebouncedRef, useDebouncedCallback } from '@/composables/useDebounceFn'

describe('useDebouncedRef', () => {
  let scope: ReturnType<typeof effectScope>
  beforeEach(() => {
    vi.useFakeTimers()
    scope = effectScope()
  })
  afterEach(() => {
    scope.stop()
    vi.useRealTimers()
  })

  it('emits initial value immediately', () => {
    scope.run(() => {
      const source = ref('hello')
      const debounced = useDebouncedRef(source, 100)
      expect(debounced.value).toBe('hello')
    })
  })

  it('debounces updates', async () => {
    scope.run(async () => {
      const source = ref('a')
      const debounced = useDebouncedRef(source, 100)
      source.value = 'b'
      source.value = 'c'
      await nextTick()
      expect(debounced.value).toBe('a')
      vi.advanceTimersByTime(100)
      expect(debounced.value).toBe('c')
    })
  })

  it('does not emit intermediate values', async () => {
    scope.run(async () => {
      const source = ref(0)
      const debounced = useDebouncedRef(source, 50)
      source.value = 1
      await nextTick()
      vi.advanceTimersByTime(25)
      source.value = 2
      await nextTick()
      vi.advanceTimersByTime(50)
      expect(debounced.value).toBe(2)
    })
  })
})

describe('useDebouncedCallback', () => {
  let scope: ReturnType<typeof effectScope>
  beforeEach(() => {
    vi.useFakeTimers()
    scope = effectScope()
  })
  afterEach(() => {
    scope.stop()
    vi.useRealTimers()
  })

  it('debounces function calls', () => {
    scope.run(() => {
      const fn = vi.fn()
      const debounced = useDebouncedCallback(fn, 100)
      debounced('a')
      debounced('b')
      debounced('c')
      expect(fn).not.toHaveBeenCalled()
      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith('c')
    })
  })
})
