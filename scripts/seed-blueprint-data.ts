import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { BLUEPRINT_DATA_SCHEMA, BLUEPRINT_DATA_VERSION, normalizeBlueprintDataFile } from '../src/blueprint-editor/domain/types'
import { originAssetsData } from '../src/blueprint-editor/data/originAssets.data'
import { floorPlanData } from '../src/blueprint-editor/data/floorPlan.data'
import { npcSettingsData } from '../src/blueprint-editor/data/npcSettings.data'
import { tagManagerData } from '../src/blueprint-editor/data/tagManager.data'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outPath = path.join(root, 'src', 'blueprint-editor', 'data', 'blueprint-data.json')

const raw = {
	$schema: BLUEPRINT_DATA_SCHEMA,
	version: BLUEPRINT_DATA_VERSION,
	tags: tagManagerData,
	originAssets: originAssetsData,
	layout: floorPlanData,
	npcConfig: npcSettingsData,
}

const normalized = normalizeBlueprintDataFile(raw)
if (!normalized) {
	console.error('Blueprint-data seed failed validation — the .data.ts modules do not assemble into a valid BlueprintDataFile.')
	process.exit(1)
}

const serialized = JSON.stringify(normalized, null, 2) + '\n'
fs.writeFileSync(outPath, serialized, { encoding: 'utf-8', mode: 0o600 })
console.log(`Wrote canonical store: ${path.relative(root, outPath)} (${Buffer.byteLength(serialized, 'utf8')} bytes)`)
