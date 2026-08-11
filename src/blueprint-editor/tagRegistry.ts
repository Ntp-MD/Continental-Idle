export type TagCategory = 'asset' | 'activity'

export interface TagDef {
	id: string
	category: TagCategory
	label: string
}

export const TAG_REGISTRY: readonly TagDef[] = [
	// Asset tags
	{ id: 'reception', category: 'asset', label: 'Reception' },
	{ id: 'lounge', category: 'asset', label: 'Lounge' },
	{ id: 'dining', category: 'asset', label: 'Dining' },
	{ id: 'guestroom', category: 'asset', label: 'Guest Room' },
	{ id: 'corridor', category: 'asset', label: 'Corridor' },
	{ id: 'kitchen', category: 'asset', label: 'Kitchen' },
	{ id: 'storage', category: 'asset', label: 'Storage' },
	{ id: 'parking', category: 'asset', label: 'Parking' },
	{ id: 'security', category: 'asset', label: 'Security' },
	{ id: 'office', category: 'asset', label: 'Office' },
	{ id: 'gym', category: 'asset', label: 'Gym' },
	{ id: 'pool', category: 'asset', label: 'Pool' },
	{ id: 'spa', category: 'asset', label: 'Spa' },
	{ id: 'bar', category: 'asset', label: 'Bar' },
	{ id: 'meeting', category: 'asset', label: 'Meeting' },
	{ id: 'laundry', category: 'asset', label: 'Laundry' },

	// Activity tags
	{ id: 'rest', category: 'activity', label: 'Rest' },
	{ id: 'hygiene', category: 'activity', label: 'Hygiene' },
	{ id: 'eat', category: 'activity', label: 'Eat' },
	{ id: 'drink', category: 'activity', label: 'Drink' },
	{ id: 'exercise', category: 'activity', label: 'Exercise' },
	{ id: 'work', category: 'activity', label: 'Work' },
	{ id: 'social', category: 'activity', label: 'Social' },
	{ id: 'checkin', category: 'activity', label: 'Check-in' },
	{ id: 'checkout', category: 'activity', label: 'Check-out' },
] as const

export const VALID_TAG_IDS: ReadonlySet<string> = new Set(TAG_REGISTRY.map(t => t.id))

export function isKnownTag(id: string): boolean {
	return VALID_TAG_IDS.has(id)
}

export function getTagDef(id: string): TagDef | undefined {
	return TAG_REGISTRY.find(t => t.id === id)
}

export function getTagsByCategory(category: TagCategory): TagDef[] {
	return TAG_REGISTRY.filter(t => t.category === category)
}

// ── Asset Category Registry ──────────────────────────────

export const ASSET_CATEGORIES = [
	'Special',
	'Furniture',
	'Fixture',
	'Structure',
	'Decoration',
	'Service',
	'Flattened',
] as const

export type AssetCategoryId = typeof ASSET_CATEGORIES[number]

export const VALID_ASSET_CATEGORIES: ReadonlySet<string> = new Set(ASSET_CATEGORIES)

export function isKnownAssetCategory(id: string): boolean {
	return VALID_ASSET_CATEGORIES.has(id)
}

// ── NPC Role Registry (dynamic, derived from config) ────

export function getKnownRoleIds(roles: { id: string }[]): ReadonlySet<string> {
	return new Set(roles.map(r => r.id))
}

export function isKnownRoleId(roleId: string, knownRoles: ReadonlySet<string>): boolean {
	return knownRoles.has(roleId)
}
