import { defineConfig, type ViteDevServer } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { randomUUID } from 'node:crypto'
import vue from '@vitejs/plugin-vue'
import fs from 'node:fs'
import path from 'node:path'
import { readBlueprintDataFile } from './src/blueprint-editor/store/schemaMigration.js'
import { MAX_PAYLOAD_BYTES } from './src/blueprint-editor/limits.js'
import type { BlueprintDataFile } from './src/blueprint-editor/domain/types.js'
const BLUEPRINT_CLIENT_HEADER = 'x-blueprint-client'
const BLUEPRINT_CLIENT_HEADER_VALUE = '1'
const BLUEPRINT_SAVE_HEADER = 'x-blueprint-save'
const BLUEPRINT_SAVE_HEADER_VALUE = '1'

export function isPrivateLanIpv4(hostname: string): boolean {
	const parts = hostname.split('.')
	if (parts.length !== 4 || parts.some((p) => !/^\d+$/.test(p))) return false
	const nums = parts.map(Number)
	if (nums.some((n) => n < 0 || n > 255)) return false
	const [a, b] = nums
	if (a === 10) return true
	if (a === 172 && b >= 16 && b <= 31) return true
	if (a === 192 && b === 168) return true
	return false
}

// A dev server that feeds a browser cannot authenticate that browser - any token
// would ship inside the very page the peer just fetched - so a private-LAN
// origin is trusted only when the operator opts in explicitly by exporting
// MOD_CLI_ALLOW_LAN=1. Loopback stays trusted; anything else is refused.
export function isTrustedDevOrigin(value: string | undefined): boolean {
	if (!value) return true
	try {
		const url = new URL(value)
		const hostname = url.hostname
		if (['localhost', '127.0.0.1', '::1', '::ffff:127.0.0.1', '0.0.0.0'].includes(hostname)) return true
		return isPrivateLanIpv4(hostname) && process.env.MOD_CLI_ALLOW_LAN === '1'
	} catch {
		return false
	}
}

const MAX_REQUEST_BYTES = MAX_PAYLOAD_BYTES
const MAX_RESPONSE_BYTES = MAX_PAYLOAD_BYTES
const MAX_DATA_MODULE_BYTES = MAX_PAYLOAD_BYTES
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
	if (getHeader(req.headers[BLUEPRINT_CLIENT_HEADER]) !== BLUEPRINT_CLIENT_HEADER_VALUE
		|| (requiresSave && getHeader(req.headers[BLUEPRINT_SAVE_HEADER]) !== BLUEPRINT_SAVE_HEADER_VALUE)
		|| !isTrustedDevOrigin(origin)
		|| !isTrustedDevOrigin(referer)
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

export function blueprintDataPlugin() {
	const dataDir = path.resolve(fileURLToPath(new URL('./src/blueprint-editor/data', import.meta.url)))
	const dataFilePath = path.join(dataDir, 'blueprint-data.json')

	const readData = (): BlueprintDataFile => {
		let raw: string
		try {
			const stat = fs.statSync(dataFilePath)
			if (!stat.isFile() || stat.size > MAX_DATA_MODULE_BYTES) throw new Error(`not a regular file under the ${MAX_DATA_MODULE_BYTES} byte cap`)
			raw = fs.readFileSync(dataFilePath, 'utf-8')
		} catch (error) {
			throw new Error(`Blueprint data store is unavailable: ${error instanceof Error ? error.message : 'unknown error'}`, { cause: error })
		}
		return readBlueprintDataFile(JSON.parse(raw))
	}

	const writeData = async (data: BlueprintDataFile): Promise<void> => {
		const tempPath = `${dataFilePath}.${process.pid}.${randomUUID()}.tmp`
		const serialized = JSON.stringify(data, null, 2) + '\n'
		if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath)
		try {
			fs.writeFileSync(tempPath, serialized, { encoding: 'utf-8', mode: 0o600 })
			await renameWithRetry(tempPath, dataFilePath)
		} catch (error) {
			try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath) } catch { /* best effort cleanup */ }
			const reason = error instanceof Error ? `${(error as NodeJS.ErrnoException).code ?? 'ERR'}: ${error.message}` : String(error)
			throw new Error(`Blueprint data write failed: ${reason}`, { cause: error })
		}
	}

	const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

	// Never unlink the live destination while retrying: a locked file is moved
	// aside (recoverable) instead of deleted, and only the final copy fallback
	// can overwrite the old file in place.
	const renameWithRetry = async (tempPath: string, filePath: string): Promise<void> => {
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
				try {
					const backupPath = `${filePath}.${process.pid}.${randomUUID()}.old`
					fs.renameSync(filePath, backupPath)
					try { fs.unlinkSync(backupPath) } catch { /* still locked - leave the backup on disk */ }
				} catch { /* destination already gone or unmovable - just retry the rename */ }
				await sleep(RENAME_DELAY_MS * attempt)
			}
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
					data = readBlueprintDataFile(JSON.parse(body))
				} catch {
					data = undefined
				}
				if (!data) {
					sendError(res, 400, 'Invalid blueprint data')
					return
				}
				try {
					await writeData(data)
					invalidateJsonModule(server, dataFilePath)
					const verified = readData()
					sendJson(res, 200, { ok: true, data: verified })
				} catch (error) {
					console.error('[blueprint-data] persistence failed', error instanceof Error ? error.message : 'unknown error')
					sendError(res, 500, 'Blueprint data could not be saved')
				}
			})
		},
	};
}

export default defineConfig({
	plugins: [
		vue(),
		blueprintDataPlugin(),
	],
	resolve: {
		alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
	},
	server: {
		host: '127.0.0.1',
		port: 5173,
		watch: { ignored: ['**/src/blueprint-editor/data/*.json', '**/src/blueprint-editor/data/*.data.ts'] },
	},
	build: { rollupOptions: { input: { main: 'index.html' } } },
})
