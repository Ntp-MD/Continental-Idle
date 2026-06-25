import { ref } from 'vue'

export interface Toast {
  id: number
  message: string
  type: 'success' | 'warning' | 'error' | 'info'
}

const toasts = ref<Toast[]>([])
let nextId = 0

function show(message: string, type: Toast['type'] = 'info', duration = 3000) {
  const id = nextId++
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, duration)
}

export function useToast() {
  return {
    toasts,
    success: (msg: string) => show(msg, 'success'),
    warning: (msg: string) => show(msg, 'warning'),
    error: (msg: string) => show(msg, 'error'),
    info: (msg: string) => show(msg, 'info'),
  }
}
