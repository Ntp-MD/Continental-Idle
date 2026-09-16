import { ref } from 'vue'

export interface Toast {
  id: number
  message: string
  type: 'success' | 'warning' | 'error' | 'info'
}

const toasts = ref<Toast[]>([])
let nextId = 0

const DURATION: Record<Toast['type'], number> = {
  success: 3000,
  info: 3000,
  warning: 6000,
  error: 0,
}

function dismiss(id: number) {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}

function show(message: string, type: Toast['type'] = 'info', duration = DURATION[type]) {
  const id = nextId++
  if (toasts.value.length >= 5) toasts.value.shift()
  toasts.value.push({ id, message, type })
  if (duration > 0) setTimeout(() => dismiss(id), duration)
}

export function useToast() {
  return {
    toasts,
    dismiss,
    success: (msg: string) => show(msg, 'success'),
    warning: (msg: string) => show(msg, 'warning'),
    error: (msg: string) => show(msg, 'error'),
    info: (msg: string) => show(msg, 'info'),
  }
}

export function reportSaved(ok: boolean, okMsg: string, failMsg: string): boolean {
  show(ok ? okMsg : failMsg, ok ? 'success' : 'error')
  return ok
}
