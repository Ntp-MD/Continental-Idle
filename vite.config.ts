import { defineConfig, type ViteDevServer } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import fs from 'node:fs'
import path from 'node:path'
import { validateLayoutData, normalizeNpcConfig, normalizeOriginAssetFile } from './src/blueprint-editor/types'

function isLocalhostOrigin(value: string | undefined): boolean {
	if (!value) return true
	try {
		const url = new URL(value)
		return ['localhost', '127.0.0.1', '::1', '::ffff:127.0.0.1', '0.0.0.0'].includes(url.hostname)
	} catch {
		return false
	}
}

function isSafeSaveRequest(req: any, res: any): boolean {
	if (req.headers?.['x-blueprint-save'] !== '1' || !isLocalhostOrigin(req.headers?.origin) || !isLocalhostOrigin(req.headers?.referer)) {
		res.statusCode = 403
		res.end('Forbidden')
		return false
	}
	return true
}

function invalidateJsonModule(server: ViteDevServer, filePath: string): void {
	const normalized = path.resolve(filePath)
	for (const mod of server.moduleGraph.idToModuleMap.values()) {
		if (mod.file && path.resolve(mod.file) === normalized) server.moduleGraph.invalidateModule(mod)
	}
}

function blueprintDataPlugin() {
	const dataDir = path.resolve(fileURLToPath(new URL('./src/blueprint-editor/data', import.meta.url)))
	const moduleFiles = {
		tags: { path: path.join(dataDir, 'tagManager.data.ts'), exportName: 'tagManagerData' },
		originAssets: { path: path.join(dataDir, 'originAssets.data.ts'), exportName: 'originAssetsData' },
		layout: { path: path.join(dataDir, 'floorPlan.data.ts'), exportName: 'floorPlanData' },
		npcConfig: { path: path.join(dataDir, 'npcSettings.data.ts'), exportName: 'npcSettingsData' },
	} as const

	const readDataModule = (filePath: string, exportName: string): unknown => {
		const source = fs.readFileSync(filePath, 'utf-8')
		const prefix = `export const ${exportName} =`
		if (!source.trimStart().startsWith(prefix)) throw new Error(`${path.basename(filePath)} has an invalid export`)
		const value = source.trimStart().slice(prefix.length).trim().replace(/;\s*$/, '')
		return JSON.parse(value)
	}

	const readData = () => {
		const parsed = {
			tags: readDataModule(moduleFiles.tags.path, moduleFiles.tags.exportName),
			originAssets: readDataModule(moduleFiles.originAssets.path, moduleFiles.originAssets.exportName),
			layout: readDataModule(moduleFiles.layout.path, moduleFiles.layout.exportName),
			npcConfig: readDataModule(moduleFiles.npcConfig.path, moduleFiles.npcConfig.exportName),
		}
		if (Array.isArray(parsed.tags) && Array.isArray(parsed.originAssets) && parsed.layout && parsed.npcConfig) return parsed
		throw new Error('Blueprint data modules are missing or invalid')
	}

	const writeDataModule = (filePath: string, exportName: string, value: unknown): string => {
		const tempPath = `${filePath}.tmp`
		fs.writeFileSync(tempPath, `export const ${exportName} = ${JSON.stringify(value, null, 2)}\n`, 'utf-8')
		return tempPath
	}

	const writeData = (data: ReturnType<typeof readData>): void => {
		const entries = [
			[moduleFiles.tags, data.tags],
			[moduleFiles.originAssets, data.originAssets],
			[moduleFiles.layout, data.layout],
			[moduleFiles.npcConfig, data.npcConfig],
		] as const
		const tempPaths = entries.map(([entry, value]) => [entry.path, writeDataModule(entry.path, entry.exportName, value)] as const)
		try {
			for (const [filePath, tempPath] of tempPaths) fs.renameSync(tempPath, filePath)
		} catch (error) {
			for (const [, tempPath] of tempPaths) if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath)
			throw error
		}
	}
	return {
		name: 'blueprint-data',
		configureServer(server: ViteDevServer) {
			server.middlewares.use('/__blueprint-data', async (req: any, res: any) => {
				if (req.method === 'GET') {
					res.setHeader('Content-Type', 'application/json')
					res.end(JSON.stringify(readData()))
					return
				}
				if (req.method !== 'POST') {
					res.statusCode = 405
					res.end('Method Not Allowed')
					return
				}
				if (!isSafeSaveRequest(req, res)) return
				let body = ''
				let size = 0
				for await (const chunk of req) {
					size += chunk.length
					if (size > 20 * 1024 * 1024) {
						res.statusCode = 413
						res.end('Payload too large')
						return
					}
					body += chunk
				}
				try {
					const parsed = JSON.parse(body)
					if (!Array.isArray(parsed.tags) || !Array.isArray(parsed.originAssets) || !parsed.layout || !parsed.npcConfig) throw new Error('Invalid blueprint data shape')
					const validatedLayout = validateLayoutData(parsed.layout)
					if (!validatedLayout) throw new Error('Layout failed strict validation - refusing to write invalid data')
					const validatedNpc = normalizeNpcConfig(parsed.npcConfig)
					if (!validatedNpc) throw new Error('NPC config failed validation - refusing to write invalid data')
					const validatedAssets = normalizeOriginAssetFile({ $schema: 'origin-assets.v2.json', version: 2, originAssets: parsed.originAssets })
					if (!validatedAssets) throw new Error('Origin assets failed validation - refusing to write invalid data')
					writeData({ tags: parsed.tags, originAssets: validatedAssets.originAssets, layout: validatedLayout, npcConfig: validatedNpc })
					for (const entry of Object.values(moduleFiles)) invalidateJsonModule(server, entry.path)
					const verified = readData()
					res.statusCode = 200
					res.setHeader('Content-Type', 'application/json')
					res.end(JSON.stringify({ ok: true, data: verified }))
				} catch (error) {
					res.statusCode = 400
					res.end(String(error))
				}
			})
		},
	}
}

export default defineConfig({
	plugins: [vue(), blueprintDataPlugin()],
	resolve: {
		alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
	},
	server: {
		watch: { ignored: ['**/src/blueprint-editor/data/*.json', '**/src/blueprint-editor/data/*.data.ts'] },
	},
	build: { rollupOptions: { input: { main: 'index.html' } } },
})
