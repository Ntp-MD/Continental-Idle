export function genId(prefix: string): string {
  const arr = new Uint8Array(5)
  crypto.getRandomValues(arr)
  const suffix = Array.from(arr, b => b.toString(16).padStart(2, '0')).join('')
  return `${prefix}-${suffix}`
}
