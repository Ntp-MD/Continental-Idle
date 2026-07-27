import { ref } from 'vue'

export function useAsyncAction() {
  const pending = ref(false)

  async function run<T>(fn: () => Promise<T>): Promise<T> {
    if (pending.value) throw new Error('Action already in progress')
    pending.value = true
    try {
      return await fn()
    } finally {
      pending.value = false
    }
  }

  return { pending, run }
}
