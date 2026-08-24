/**
 * verify-assets.mjs
 *
 * Loads originAssets.data.ts (the live asset registry served/saved by the
 * dev-server /__blueprint-data middleware) and validates every asset against
 * the current AssetDef shape. Catches:
 * - Fields present in data but no longer on the type (stale data after removal)
 * - Fields required by the type but missing from data (incomplete migration)
 * - Shape mismatches (e.g. interactSpots entries as [x,y] tuples instead of {x,y})
 *
 * Run via: npm run verify:assets
 *
 * This script is the runtime companion to the "Definition type change gate"
 * in AGENTS.md. The type-level checks live in types.ts normalize* helpers;
 * this script exercises those helpers against the real data file.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataPath = path.join(root, 'src', 'blueprint-editor', 'data', 'originAssets.data.ts')

function readOriginAssets() {
	const source = fs.readFileSync(dataPath, 'utf8').replace(/^\uFEFF/, '')
	const prefix = 'export const originAssetsData ='
	if (!source.trimStart().startsWith(prefix)) throw new Error('originAssets.data.ts has an invalid export')
	return JSON.parse(source.trimStart().slice(prefix.length).trim().replace(/;\s*$/, ''))
}

// ─── Known AssetDef field set (must match types.ts AssetBase + AssetDef) ───
// Keep in sync with ASSET_DEF_FIELD_COVERAGE (assetUtils.ts).
const REQUIRED_FIELDS = ['id', 'name', 'w', 'h']
const OPTIONAL_FIELDS = [
	'origin', 'category', 'custom', 'isWall',
	'pxW', 'pxH', 'usePx',
	'linkedParts', 'svg', 'svgViewBox', 'svgRoles',
	'walkable', 'entranceRequired',
	'walkableGrid', 'tileStates', 'tileEdges',
	'interactSpots', 'interact', 'queue',
	'defaultPadding', 'defaultRx',
	'defaultFillColor', 'defaultStrokeColor',
	'defaultLabel', 'defaultRadius', 'defaultLabelPadding',
	'defaultLocked',
	'tags',
]
const ALL_KNOWN_FIELDS = new Set([...REQUIRED_FIELDS, ...OPTIONAL_FIELDS, '$schema', 'version'])

// ─── Shape validators (mirror types.ts normalize* helpers) ───
function isFiniteNum(v) { return typeof v === 'number' && isFinite(v) }

function validateAnchorPoints(value) {
	if (!Array.isArray(value)) return 'must be an array'
	for (let i = 0; i < value.length; i++) {
		const a = value[i]
		if (Array.isArray(a)) return `entry ${i}: legacy [x,y] tuple — must be {x,y} object`
		if (!a || typeof a !== 'object') return `entry ${i}: must be an object`
		if (!isFiniteNum(a.x) || !isFiniteNum(a.y)) return `entry ${i}: x and y must be finite numbers`
	}
	return null
}

function validateInteract(value) {
	if (!value || typeof value !== 'object') return 'must be an object'
	if (value.capacity !== undefined && typeof value.capacity !== 'number') return 'capacity must be a number'
	if (value.durationMin !== undefined && !isFiniteNum(value.durationMin)) return 'durationMin must be a finite number'
	if (value.durationMax !== undefined && !isFiniteNum(value.durationMax)) return 'durationMax must be a finite number'
	if (value.durationMin !== undefined && value.durationMax !== undefined && value.durationMax < value.durationMin) {
		return 'durationMax must be >= durationMin'
	}
	return null
}

function validateWalkableGrid(value) {
	if (!Array.isArray(value)) return 'must be an array'
	for (let i = 0; i < value.length; i++) {
		if (!Array.isArray(value[i])) return `row ${i}: must be an array`
		for (let j = 0; j < value[i].length; j++) {
			if (typeof value[i][j] !== 'boolean') return `cell [${i}][${j}]: must be boolean`
		}
	}
	return null
}

function validateTileStates(value) {
	if (!Array.isArray(value)) return 'must be an array'
	const valid = ['walkable', 'blocked', 'entrance']
	for (let i = 0; i < value.length; i++) {
		if (!Array.isArray(value[i])) return `row ${i}: must be an array`
		for (let j = 0; j < value[i].length; j++) {
			if (!valid.includes(value[i][j])) return `cell [${i}][${j}]: invalid TileState "${value[i][j]}"`
		}
	}
	return null
}

function validateTileEdges(value) {
	if (!Array.isArray(value)) return 'must be an array'
	for (let i = 0; i < value.length; i++) {
		if (!Array.isArray(value[i])) return `row ${i}: must be an array`
		for (let j = 0; j < value[i].length; j++) {
			const e = value[i][j]
			if (e === null || e === undefined) continue
			if (typeof e !== 'object') return `cell [${i}][${j}]: must be an object`
		}
	}
	return null
}

function validateDefaultRx(value) {
	if (!value || typeof value !== 'object') return 'must be an object'
	for (const k of ['tl', 'tr', 'br', 'bl']) {
		if (!isFiniteNum(value[k])) return `corner ${k}: must be a finite number`
	}
	return null
}

const SHAPE_VALIDATORS = {
	interactSpots: validateAnchorPoints,
	interact: validateInteract,
	walkableGrid: validateWalkableGrid,
	tileStates: validateTileStates,
	tileEdges: validateTileEdges,
	defaultRx: validateDefaultRx,
}

// ─── Main ───
let errors = 0
let warnings = 0

function error(assetId, msg) {
	console.error(`  ✗ [${assetId}] ${msg}`)
	errors++
}
function warn(assetId, msg) {
	console.warn(`  ⚠ [${assetId}] ${msg}`)
	warnings++
}

console.log('Verifying originAssets.data.ts against AssetDef shape...\n')

let raw
try {
	raw = readOriginAssets()
} catch (e) {
	console.error(`Failed to read/parse originAssets.data.ts: ${e.message}`)
	process.exit(1)
}

if (!Array.isArray(raw)) {
	console.error(`File-level: originAssetsData must be an array, got ${typeof raw}`)
	process.exit(1)
}

console.log(`Checking ${raw.length} assets...\n`)

const seenIds = new Set()
for (const asset of raw) {
	const id = asset.id ?? '<no-id>'

	// Required fields
	for (const f of REQUIRED_FIELDS) {
		if (asset[f] === undefined) {
			error(id, `missing required field: ${f}`)
		}
	}

	// w/h must be positive finite numbers
	if (asset.w !== undefined && (!isFiniteNum(asset.w) || asset.w <= 0)) {
		error(id, `w must be a positive finite number, got ${asset.w}`)
	}
	if (asset.h !== undefined && (!isFiniteNum(asset.h) || asset.h <= 0)) {
		error(id, `h must be a positive finite number, got ${asset.h}`)
	}

	// Duplicate id
	if (seenIds.has(id)) {
		error(id, `duplicate asset id`)
	}
	seenIds.add(id)

	// Stale fields (in data but not on type)
	for (const key of Object.keys(asset)) {
		if (!ALL_KNOWN_FIELDS.has(key)) {
			warn(id, `stale field not in AssetDef type: "${key}" — remove from data or add to type`)
		}
	}

	// Shape validators
	for (const [field, validator] of Object.entries(SHAPE_VALIDATORS)) {
		if (asset[field] !== undefined) {
			const err = validator(asset[field])
			if (err) error(id, `${field}: ${err}`)
		}
	}

	// tags must be string array
	if (asset.tags !== undefined) {
		if (!Array.isArray(asset.tags)) {
			error(id, `tags: must be an array`)
		} else if (!asset.tags.every(t => typeof t === 'string')) {
			error(id, `tags: all entries must be strings`)
		}
	}

	// origin must be valid
	if (asset.origin !== undefined) {
		const validOrigins = ['drawn', 'svg-import', 'linked', 'flattened']
		if (!validOrigins.includes(asset.origin)) {
			error(id, `origin: invalid value "${asset.origin}" — must be one of ${validOrigins.join(', ')}`)
		}
	}
}

// ─── Summary ───
console.log('\n' + '─'.repeat(50))
if (errors > 0) {
	console.error(`\nFAIL: ${errors} error(s), ${warnings} warning(s)`)
	console.error('Fix the errors above before marking the definition type change complete.')
	process.exit(1)
} else if (warnings > 0) {
	console.warn(`\nPASS (with warnings): 0 errors, ${warnings} warning(s)`)
	process.exit(0)
	} else {
		console.log(`\nPASS: ${raw.length} assets valid, 0 errors, 0 warnings`)
		process.exit(0)
	}
