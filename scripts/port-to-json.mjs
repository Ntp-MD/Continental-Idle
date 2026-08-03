// One-shot port script: extracts data from generated TS files into JSON.
// Run with: node scripts/port-to-json.mjs
// Safe to re-run; overwrites the four JSON files in src/blueprint-editor/data.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const dataDir = path.resolve(root, 'src/blueprint-editor/data')
fs.mkdirSync(dataDir, { recursive: true })

function extractJsonObject(content, marker) {
	const startIdx = content.indexOf(marker)
	if (startIdx === -1) throw new Error(`Cannot find "${marker}"`)
	const objStart = content.indexOf('{', startIdx + marker.length)
	if (objStart === -1) throw new Error(`Cannot find opening brace after "${marker}"`)
	let depth = 0
	let inString = false
	let escape = false
	for (let i = objStart; i < content.length; i++) {
		const ch = content[i]
		if (escape) { escape = false; continue }
		if (ch === '\\') { escape = true; continue }
		if (ch === '"') { inString = !inString; continue }
		if (inString) continue
		if (ch === '{') depth++
		else if (ch === '}') {
			depth--
			if (depth === 0) return content.substring(objStart, i + 1)
		}
	}
	throw new Error('Unmatched braces')
}

function extractJsonArray(content, marker) {
	const startIdx = content.indexOf(marker)
	if (startIdx === -1) throw new Error(`Cannot find "${marker}"`)
	const eqIdx = content.indexOf('=', startIdx + marker.length)
	if (eqIdx === -1) throw new Error(`Cannot find "=" after "${marker}"`)
	const arrStart = content.indexOf('[', eqIdx)
	if (arrStart === -1) throw new Error(`Cannot find opening bracket after "${marker}"`)
	let depth = 0
	let inString = false
	let escape = false
	for (let i = arrStart; i < content.length; i++) {
		const ch = content[i]
		if (escape) { escape = false; continue }
		if (ch === '\\') { escape = true; continue }
		if (ch === '"') { inString = !inString; continue }
		if (inString) continue
		if (ch === '[') depth++
		else if (ch === ']') {
			depth--
			if (depth === 0) return content.substring(arrStart, i + 1)
		}
	}
	throw new Error('Unmatched brackets')
}

// 1. Port assetRegistry.ts -> assetCatalog.json
const assetRegistryPath = path.resolve(root, 'src/blueprint-editor/assetRegistry.ts')
const assetRegistryContent = fs.readFileSync(assetRegistryPath, 'utf-8')
const assetRegistryJson = extractJsonArray(assetRegistryContent, 'ASSET_REGISTRY:')
const assetRegistry = JSON.parse(assetRegistryJson)
const assetCatalog = {
	$schema: 'asset-catalog.v1.json',
	version: 1,
	assets: assetRegistry,
}
fs.writeFileSync(path.join(dataDir, 'assetCatalog.json'), JSON.stringify(assetCatalog, null, 2) + '\n', 'utf-8')
console.log(`assetCatalog.json: ${assetRegistry.length} assets`)

// 2. Port floorLayout.ts -> blueprintLayout.json + npcConfig.json + customAssets.json
const floorLayoutPath = path.resolve(root, 'src/blueprint-editor/store/floorLayout.ts')
const floorLayoutContent = fs.readFileSync(floorLayoutPath, 'utf-8')
const savedLayoutJson = extractJsonObject(floorLayoutContent, 'SAVED_LAYOUT:')
const savedLayout = JSON.parse(savedLayoutJson)

// blueprintLayout.json: version, canvas, floors, roomTemplates, globalTags
const blueprintLayout = {
	$schema: 'blueprint-layout.v1.json',
	version: savedLayout.version,
	canvas: savedLayout.canvas,
	floors: savedLayout.floors,
	roomTemplates: savedLayout.roomTemplates ?? [],
	globalTags: savedLayout.globalTags ?? [],
}
fs.writeFileSync(path.join(dataDir, 'blueprintLayout.json'), JSON.stringify(blueprintLayout, null, 2) + '\n', 'utf-8')
console.log(`blueprintLayout.json: ${blueprintLayout.floors.length} floors, version ${blueprintLayout.version}`)

// npcConfig.json: speed, defaultRoleId, roles, tasks, pool
const npcConfig = {
	$schema: 'npc-config.v1.json',
	version: 1,
	...savedLayout.npcConfig,
}
fs.writeFileSync(path.join(dataDir, 'npcConfig.json'), JSON.stringify(npcConfig, null, 2) + '\n', 'utf-8')
console.log(`npcConfig.json: ${npcConfig.roles.length} roles, ${npcConfig.tasks.length} tasks`)

// customAssets.json: customAssets (empty on port) + deletedDefaultIds
const customAssets = {
	$schema: 'custom-assets.v1.json',
	version: 1,
	customAssets: [],
	deletedDefaultIds: savedLayout.deletedDefaultIds ?? [],
}
fs.writeFileSync(path.join(dataDir, 'customAssets.json'), JSON.stringify(customAssets, null, 2) + '\n', 'utf-8')
console.log(`customAssets.json: ${customAssets.customAssets.length} custom assets, ${customAssets.deletedDefaultIds.length} deleted defaults`)

console.log('Port complete.')
