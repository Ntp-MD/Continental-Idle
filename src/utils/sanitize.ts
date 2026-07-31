export function sanitizeString(input: string, maxLength = 100): string {
  return input.trim().slice(0, maxLength).replace(/[<>]/g, '')
}
export function sanitizeTag(input: string): string {
  return sanitizeString(input, 50).toLowerCase().replace(/[^a-z0-9-]/g, '')
}
