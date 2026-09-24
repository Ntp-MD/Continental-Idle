export const MAX_DATA_STRING_LENGTH = 512
export const MAX_SVG_ATTRIBUTE_LENGTH = 4096
export const MAX_SVG_LENGTH = 250_000
export const MAX_INTERACT_SPOTS = 512
export const MAX_SVG_ROLES = 512
export const MAX_ASSET_DIMENSION = 10_000
export const MAX_PIXEL_DIMENSION = 1_000_000
export const SAFE_SVG_TAGS = new Set(['svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polygon', 'polyline', 'text', 'tspan'])

export function isRecord(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === 'object' && !Array.isArray(value)
}

export function hasOwn(record: Record<string, unknown>, key: string): boolean {
	return Object.prototype.hasOwnProperty.call(record, key)
}

export function normalizeText(value: unknown, maxLength = MAX_DATA_STRING_LENGTH): string | undefined {
	if (typeof value !== 'string') return undefined
	const text = value.trim()
	return text && text.length <= maxLength && !/[\u0000-\u001f\u007f]/.test(text) ? text : undefined
}

export function normalizeIdentifier(value: unknown, maxLength = 128): string | undefined {
	const identifier = normalizeText(value, maxLength)
	return identifier && /^[a-z0-9_][a-z0-9._:-]*$/i.test(identifier) ? identifier : undefined
}

export function normalizeTag(value: unknown): string | undefined {
	const tag = normalizeText(value, 128)?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '')
	return tag || undefined
}

export function isFiniteNumber(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value)
}

export function clampInt(value: number, min: number, max: number): number {
	if (Number.isNaN(value)) return min
	return Math.max(min, Math.min(max, Math.floor(value)))
}

export function positiveNumber(value: unknown, fallback: number): number {
	return isFiniteNumber(value) && value > 0 ? value : fallback
}

export function positiveInt(value: unknown, fallback: number): number {
	return isFiniteNumber(value) && value > 0 ? Math.floor(value) : fallback
}

export function normalizeTags(value: unknown): string[] | undefined {
	if (value === undefined || value === null) return undefined
	if (!Array.isArray(value) || value.length > 256) return undefined
	if (value.length === 0) return []
	const seen = new Set<string>()
	const result: string[] = []
	for (const tag of value) {
		if (typeof tag !== 'string') return undefined
		if (!tag.trim()) continue
		const id = normalizeTag(tag)
		if (!id) return undefined
		if (seen.has(id)) continue
		seen.add(id)
		result.push(id)
	}
	return result
}

export const SVG_COLOR_VALUE_RE = /^(#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|rgba?\([^)]*\)|hsla?\([^)]*\))$/

export function isSafeSvgMarkup(svg: string): boolean {
	if (!svg || svg.length > MAX_SVG_LENGTH) return false
	const tagPattern = /<\s*([a-z][a-z0-9:-]*)\b/gi
	let tagMatch: RegExpExecArray | null
	while ((tagMatch = tagPattern.exec(svg)) !== null) {
		if (!SAFE_SVG_TAGS.has(tagMatch[1].toLowerCase())) return false
	}
	return !/<\s*!\s*(?:DOCTYPE|ENTITY)\b/i.test(svg)
		&& !/\bon[\w:-]+\s*=/i.test(svg)
		&& !/\bstyle\s*=\s*["'][^"']*(?:expression\s*\(|javascript:|vbscript:|mhtml:|@import|behavior:|binding:|url\s*\()/i.test(svg)
		&& !/\b(?:href|xlink:href)\s*=\s*["']\s*(?:javascript|data|blob|vbscript|mhtml):/i.test(svg)
		&& !/\b(?:javascript|vbscript|data|blob|mhtml):/i.test(svg)
}

const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

export function isHexColor(c: string | undefined): c is string {
	return typeof c === 'string' && HEX_COLOR_RE.test(c)
}

export function isValidColor(c: string | undefined): boolean {
	if (!c) return true
	if (c === 'transparent') return true
	return SVG_COLOR_VALUE_RE.test(c)
}
