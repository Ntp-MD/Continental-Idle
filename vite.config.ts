import { defineConfig, type ViteDevServer } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { randomUUID } from 'node:crypto'
import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'
import fs from 'node:fs'
import path from 'node:path'
import { BLUEPRINT_DATA_SCHEMA, BLUEPRINT_DATA_VERSION, normalizeBlueprintDataFile } from './src/blueprint-editor/domain/types.js'
import type { BlueprintDataFile } from './src/blueprint-editor/domain/types.js'

function isLocalhostOrigin(value: string | undefined): boolean {
	if (!value) return true
	try {
		const url = new URL(value)
		return ['localhost', '127.0.0.1', '::1', '::ffff:127.0.0.1', '0.0.0.0'].includes(url.hostname)
	} catch {
		return false
	}
}

const MAX_REQUEST_BYTES = 1 * 1024 * 1024
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024
const MAX_DATA_MODULE_BYTES = 5 * 1024 * 1024
const ALLOWED_FETCH_SITES = new Set(['same-origin', 'same-site', 'none'])

class PayloadTooLargeError extends Error { }

function getHeader(value: string | string[] | undefined): string | undefined {
	return Array.isArray(value) ? value[0] : value
}

function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
	const serialized = JSON.stringify(payload)
	const body = serialized ?? JSON.stringify({ ok: false, error: 'Invalid response' })
	const tooLarge = Buffer.byteLength(body, 'utf8') > MAX_RESPONSE_BYTES
	const safeBody = tooLarge ? JSON.stringify({ ok: false, error: 'Response too large' }) : body
	res.statusCode = serialized === undefined || tooLarge ? 500 : statusCode
	res.setHeader('Content-Type', 'application/json; charset=utf-8')
	res.setHeader('Cache-Control', 'no-store')
	res.setHeader('X-Content-Type-Options', 'nosniff')
	res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'")
	res.setHeader('Referrer-Policy', 'no-referrer')
	res.end(safeBody)
}

function sendError(res: ServerResponse, statusCode: number, message: string): void {
	sendJson(res, statusCode, { ok: false, error: message })
}

function isJsonContentType(value: string | undefined): boolean {
	return value?.split(';', 1)[0]?.trim().toLowerCase() === 'application/json'
}

function isSafeClientRequest(req: IncomingMessage, res: ServerResponse, requiresSave: boolean): boolean {
	const origin = getHeader(req.headers.origin)
	const referer = getHeader(req.headers.referer)
	const fetchSite = getHeader(req.headers['sec-fetch-site'])
	if (getHeader(req.headers['x-blueprint-client']) !== '1'
		|| (requiresSave && getHeader(req.headers['x-blueprint-save']) !== '1')
		|| !isLocalhostOrigin(origin)
		|| !isLocalhostOrigin(referer)
		|| (fetchSite !== undefined && !ALLOWED_FETCH_SITES.has(fetchSite))) {
		sendError(res, 403, 'Forbidden')
		return false
	}
	return true
}

async function readRequestBody(req: IncomingMessage): Promise<string> {
	const rawContentLength = req.headers['content-length']
	if (Array.isArray(rawContentLength) && rawContentLength.length !== 1) throw new Error('Invalid content length')
	const contentLength = getHeader(rawContentLength)
	if (contentLength !== undefined) {
		if (!/^\d+$/.test(contentLength)) throw new Error('Invalid content length')
		if (Number(contentLength) > MAX_REQUEST_BYTES) throw new PayloadTooLargeError()
	}
	const chunks: Buffer[] = []
	let size = 0
	for await (const chunk of req) {
		const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
		size += buffer.byteLength
		if (size > MAX_REQUEST_BYTES) throw new PayloadTooLargeError()
		chunks.push(buffer)
	}
	try {
		return new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks))
	} catch {
		throw new Error('Invalid request encoding')
	}
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
		const stat = fs.statSync(filePath)
		if (!stat.isFile() || stat.size > MAX_DATA_MODULE_BYTES) throw new Error('Blueprint data module is unavailable')
		const source = fs.readFileSync(filePath, 'utf-8')
		const prefix = `export const ${exportName} =`
		if (!source.trimStart().startsWith(prefix)) throw new Error('Blueprint data module has an invalid export')
		const value = source.trimStart().slice(prefix.length).trim().replace(/;\s*$/, '')
		return JSON.parse(value)
	}

	const readData = (): BlueprintDataFile => {
		const normalized = normalizeBlueprintDataFile({
			$schema: BLUEPRINT_DATA_SCHEMA,
			version: BLUEPRINT_DATA_VERSION,
			tags: readDataModule(moduleFiles.tags.path, moduleFiles.tags.exportName),
			originAssets: readDataModule(moduleFiles.originAssets.path, moduleFiles.originAssets.exportName),
			layout: readDataModule(moduleFiles.layout.path, moduleFiles.layout.exportName),
			npcConfig: readDataModule(moduleFiles.npcConfig.path, moduleFiles.npcConfig.exportName),
		})
		if (!normalized) throw new Error('Blueprint data modules are invalid')
		return normalized
	}

	const writeDataModule = (filePath: string, exportName: string, value: unknown): string => {
		const tempPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`
		if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath)
		fs.writeFileSync(tempPath, `export const ${exportName} = ${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf-8', mode: 0o600 })
		return tempPath
	}

	const renameWithRetry = (tempPath: string, filePath: string): void => {
		const MAX_RENAME_RETRIES = 5
		const RENAME_DELAY_MS = 150
		for (let attempt = 1; attempt <= MAX_RENAME_RETRIES; attempt++) {
			try {
				fs.renameSync(tempPath, filePath)
				return
			} catch (error) {
				const code = (error as NodeJS.ErrnoException).code
				if (code !== 'EPERM' && code !== 'EACCES') throw error
				if (attempt === MAX_RENAME_RETRIES) {
					try { fs.copyFileSync(tempPath, filePath); fs.unlinkSync(tempPath); return } catch (e) { throw error ?? e }
				}
				try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath) } catch { /* best effort cleanup */ }
				const delay = RENAME_DELAY_MS * attempt
				const end = Date.now() + delay
				while (Date.now() < end) { /* spin wait for rename retry */ }
			}
		}
	}

	const writeData = (data: BlueprintDataFile): void => {
		const entries = [
			[moduleFiles.tags, data.tags],
			[moduleFiles.originAssets, data.originAssets],
			[moduleFiles.layout, data.layout],
			[moduleFiles.npcConfig, data.npcConfig],
		] as const
		const tempPaths: Array<readonly [string, string]> = []
		try {
			for (const [entry, value] of entries) tempPaths.push([entry.path, writeDataModule(entry.path, entry.exportName, value)])
			for (const [filePath, tempPath] of tempPaths) renameWithRetry(tempPath, filePath)
		} catch (error) {
			for (const [, tempPath] of tempPaths) {
				try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath) } catch { /* best effort cleanup */ }
			}
			const reason = error instanceof Error ? `${(error as NodeJS.ErrnoException).code ?? 'ERR'}: ${error.message}` : String(error)
			throw new Error(`Blueprint data write failed: ${reason}`, { cause: error })
		}
	}
	return {
		name: 'blueprint-data',
		configureServer(server: ViteDevServer) {
			server.middlewares.use('/__blueprint-data', async (req: IncomingMessage, res: ServerResponse) => {
				if (req.method === 'GET') {
					if (!isSafeClientRequest(req, res, false)) return
					try {
						sendJson(res, 200, readData())
					} catch {
						sendError(res, 500, 'Blueprint data is unavailable')
					}
					return
				}
				if (req.method !== 'POST') {
					res.setHeader('Allow', 'GET, POST')
					sendError(res, 405, 'Method Not Allowed')
					return
				}
				if (!isSafeClientRequest(req, res, true)) return
				if (!isJsonContentType(getHeader(req.headers['content-type']))) {
					sendError(res, 415, 'Content-Type must be application/json')
					return
				}
				let body: string
				try {
					body = await readRequestBody(req)
				} catch (error) {
					if (error instanceof PayloadTooLargeError) {
						sendError(res, 413, 'Payload too large')
						return
					}
					sendError(res, 400, 'Invalid request body')
					return
				}
				let data: BlueprintDataFile | undefined
				try {
					data = normalizeBlueprintDataFile(JSON.parse(body))
				} catch {
					data = undefined
				}
				if (!data) {
					sendError(res, 400, 'Invalid blueprint data')
					return
				}
				try {
					writeData(data)
					for (const entry of Object.values(moduleFiles)) invalidateJsonModule(server, entry.path)
					const verified = readData()
					sendJson(res, 200, { ok: true, data: verified })
				} catch (error) {
					console.error('[blueprint-data] persistence failed', error instanceof Error ? error.message : 'unknown error')
					sendError(res, 500, 'Blueprint data could not be saved')
				}
			})
		},
	}
}

export default defineConfig({
	plugins: [
		vue(),
		blueprintDataPlugin(),
		...(process.env.BUNDLE_REPORT ? [visualizer({ filename: 'dist/bundle-report.html', gzipSize: true, brotliSize: true, template: 'treemap' })] : []),
	],
	resolve: {
		alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
	},
	server: {
		watch: { ignored: ['**/src/blueprint-editor/data/*.json', '**/src/blueprint-editor/data/*.data.ts'] },
	},
	build: { rollupOptions: { input: { main: 'index.html' } } },
})
