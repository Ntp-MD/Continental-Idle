export function sanitizeString(input: string, maxLength = 100): string {
	return input.trim().slice(0, maxLength).replace(/[<>]/g, '')
}
