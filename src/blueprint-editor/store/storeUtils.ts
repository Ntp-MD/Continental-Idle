export function genId(prefix: string): string {
  const arr = new Uint8Array(5)
  crypto.getRandomValues(arr)
  const suffix = Array.from(arr, b => b.toString(16).padStart(2, '0')).join('')
  return `${prefix}-${suffix}`
}

export const editorLog = {
  error(context: string, error: unknown) {
    console.error(`[BlueprintEditor] ${context}:`, error)
  },
  warn(context: string, ...args: unknown[]) {
    console.warn(`[BlueprintEditor] ${context}:`, ...args)
  },
  info(context: string, ...args: unknown[]) {
    console.info(`[BlueprintEditor] ${context}:`, ...args)
  },
}

export function assignSyncKey(label: string, index: number, usedKeys: Set<string>): string {
	const canonical = editorFloorLabelToFloorId(label)
	let base = canonical ?? (index === 0 ? 'G' : String(index))
	if (!usedKeys.has(base)) return base
	let n = 2
	while (usedKeys.has(`${base}_${n}`)) n++
	return `${base}_${n}`
}

export function editorFloorLabelToFloorId(label: string): string | null {
	if (label === 'G') return 'G'
	const match = label.match(/^F(\d+)$/)
	if (match) {
		const floorNumber = parseInt(match[1], 10)
		return floorNumber === 0 ? 'G' : String(floorNumber)
	}
	return null
}
