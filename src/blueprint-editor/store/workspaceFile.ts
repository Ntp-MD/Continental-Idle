import type { BlueprintDataFile } from '../domain/types'
import { readBlueprintDataFile } from './schemaMigration'

export function serializeWorkspace(file: BlueprintDataFile): string {
	return JSON.stringify(file, null, 2) + '\n'
}

export function parseWorkspace(text: string): BlueprintDataFile {
	let parsed: unknown
	try {
		parsed = JSON.parse(text)
	} catch (error) {
		throw new Error('Workspace file is not valid JSON', { cause: error })
	}
	return readBlueprintDataFile(parsed)
}