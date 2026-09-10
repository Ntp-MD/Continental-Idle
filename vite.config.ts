import { defineConfig, type ViteDevServer } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { execFile, execFileSync, spawn, type ChildProcess } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'
import fs from 'node:fs'
import path from 'node:path'
import { BLUEPRINT_DATA_SCHEMA, BLUEPRINT_DATA_VERSION, normalizeBlueprintDataFile } from './src/blueprint-editor/domain/types.js'
import type { BlueprintDataFile } from './src/blueprint-editor/domain/types.js'

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

export function isTrustedDevOrigin(value: string | undefined): boolean {
	if (!value) return true
	try {
		const url = new URL(value)
		const hostname = url.hostname
		if (['localhost', '127.0.0.1', '::1', '::ffff:127.0.0.1', '0.0.0.0'].includes(hostname)) return true
		return isPrivateLanIpv4(hostname)
	} catch {
		return false
	}
}

const MAX_REQUEST_BYTES = 5 * 1024 * 1024
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

const CLINE_THINKING_LEVELS = new Set(['none', 'low', 'medium', 'high', 'xhigh'])
const CLINE_ID_PATTERN = /^[\w./:@+-]+$/
const CLINE_SESSION_PATTERN = /^[\w-]+$/
const CLINE_MAX_PROMPT_BYTES = 64 * 1024
const CLINE_RUN_TIMEOUT_MS = 30 * 60 * 1000

interface ClineRunBody {
	prompt?: unknown
	model?: unknown
	provider?: unknown
	thinking?: unknown
	plan?: unknown
	autoApprove?: unknown
	sessionId?: unknown
	runId?: unknown
}

function resolveClineEntry(): string | null {
	const candidates: string[] = []
	if (process.env.APPDATA) candidates.push(path.join(process.env.APPDATA, 'npm', 'node_modules', 'cline', 'bin', 'cline'))
	try {
		const globalRoot = execFileSync('npm', ['root', '-g'], { encoding: 'utf-8' }).trim()
		if (globalRoot) candidates.push(path.join(globalRoot, 'cline', 'bin', 'cline'))
	} catch { /* npm is unavailable */ }
	for (const candidate of candidates) {
		try {
			if (fs.statSync(candidate).isFile()) return candidate
		} catch { /* try next candidate */ }
	}
	return null
}

function getClineVersion(entry: string): Promise<string | null> {
	return new Promise((resolve) => {
		execFile(process.execPath, [entry, '--version'], { timeout: 15000, windowsHide: true }, (error, stdout) => {
			resolve(error ? null : stdout.trim() || null)
		})
	})
}

function readClineHistoryRaw(entry: string, limit: number): Promise<unknown> {
	return new Promise((resolve) => {
		execFile(
			process.execPath,
			[entry, 'history', '--json', '--limit', String(limit)],
			{ timeout: 20000, windowsHide: true, maxBuffer: 32 * 1024 * 1024 },
			(error, stdout) => {
				if (error) {
					resolve(null)
					return
				}
				try {
					resolve(JSON.parse(stdout))
				} catch {
					resolve(null)
				}
			},
		)
	})
}

function resolveClineSessionId(entry: string, prompt: string, startedAtMs: number): Promise<string | null> {
	return readClineHistoryRaw(entry, 5).then((raw) => {
		if (!Array.isArray(raw)) return null
		for (const item of raw) {
			if (typeof item !== 'object' || item === null) continue
			const session = item as Record<string, unknown>
			const sessionId = typeof session.sessionId === 'string' ? session.sessionId : ''
			if (!sessionId) continue
			const startedAt = Date.parse(typeof session.startedAt === 'string' ? session.startedAt : '')
			if (!Number.isNaN(startedAt) && startedAt < startedAtMs - 5000) continue
			const sessionPrompt = typeof session.prompt === 'string' ? session.prompt : ''
			if (sessionPrompt.includes(prompt.trim())) return sessionId
		}
		return null
	})
}

function clineBridgePlugin() {
	const projectRoot = path.resolve(fileURLToPath(new URL('.', import.meta.url)))
	const runRegistry = new Map<string, ChildProcess>()
	const asString = (value: unknown): string => (typeof value === 'string' ? value : '')

	return {
		name: 'cline-bridge',
		configureServer(server: ViteDevServer) {
			server.middlewares.use('/__cline', async (req: IncomingMessage, res: ServerResponse) => {
				const entry = resolveClineEntry()
				const route = (req.url ?? '').split('?')[0]
				if (route === '/config') {
					if (!isSafeClientRequest(req, res, false)) return
					const version = entry ? await getClineVersion(entry) : null
					sendJson(res, 200, { ok: true, available: Boolean(entry), version, cwd: projectRoot })
					return
				}
				if (route === '/history') {
					if (!isSafeClientRequest(req, res, false)) return
					if (!entry) {
						sendError(res, 503, 'Cline CLI is not available')
						return
					}
					const raw = await readClineHistoryRaw(entry, 30)
					if (!Array.isArray(raw)) {
						sendError(res, 500, 'Cline history is unavailable')
						return
					}
					const sessions = raw.flatMap((item) => {
						if (typeof item !== 'object' || item === null) return []
						const session = item as Record<string, unknown>
						const sessionId = asString(session.sessionId)
						if (!sessionId) return []
						return [{
							sessionId,
							title: asString(session.title),
							prompt: asString(session.prompt).slice(0, 400),
							provider: asString(session.provider),
							model: asString(session.model),
							status: asString(session.status),
							startedAt: asString(session.startedAt),
							endedAt: asString(session.endedAt),
						}]
					})
					sendJson(res, 200, { ok: true, sessions })
					return
				}
				if (route === '/stop') {
					if (!isSafeClientRequest(req, res, false)) return
					if (!isJsonContentType(getHeader(req.headers['content-type']))) {
						sendError(res, 415, 'Content-Type must be application/json')
						return
					}
					let body: ClineRunBody
					try {
						body = JSON.parse(await readRequestBody(req)) as ClineRunBody
					} catch {
						sendError(res, 400, 'Invalid request body')
						return
					}
					const stopRunId = asString(body.runId)
					const child = runRegistry.get(stopRunId)
					if (child && !child.killed) child.kill()
					sendJson(res, 200, { ok: true, stopped: Boolean(child) })
					return
				}
				if (route === '/run') {
					if (!isSafeClientRequest(req, res, false)) return
					if (!entry) {
						sendError(res, 503, 'Cline CLI is not available')
						return
					}
					if (!isJsonContentType(getHeader(req.headers['content-type']))) {
						sendError(res, 415, 'Content-Type must be application/json')
						return
					}
					let body: ClineRunBody
					try {
						body = JSON.parse(await readRequestBody(req)) as ClineRunBody
					} catch (error) {
						if (error instanceof PayloadTooLargeError) {
							sendError(res, 413, 'Payload too large')
							return
						}
						sendError(res, 400, 'Invalid request body')
						return
					}
					const prompt = asString(body.prompt).trim()
					const model = asString(body.model).trim()
					const provider = asString(body.provider).trim()
					const thinking = asString(body.thinking).trim()
					const sessionId = asString(body.sessionId).trim()
					const plan = body.plan === true
					const autoApprove = body.autoApprove !== false
					if (!prompt) {
						sendError(res, 400, 'Prompt is required')
						return
					}
					if (Buffer.byteLength(prompt, 'utf8') > CLINE_MAX_PROMPT_BYTES) {
						sendError(res, 413, 'Prompt too large')
						return
					}
					if (model && !CLINE_ID_PATTERN.test(model)) {
						sendError(res, 400, 'Invalid model id')
						return
					}
					if (provider && !CLINE_ID_PATTERN.test(provider)) {
						sendError(res, 400, 'Invalid provider id')
						return
					}
					if (sessionId && !CLINE_SESSION_PATTERN.test(sessionId)) {
						sendError(res, 400, 'Invalid session id')
						return
					}
					if (thinking && thinking !== 'default' && !CLINE_THINKING_LEVELS.has(thinking)) {
						sendError(res, 400, 'Invalid thinking level')
						return
					}
					const args = ['--json']
					if (sessionId) args.push('--id', sessionId)
					if (provider) args.push('-P', provider)
					if (model) args.push('-m', model)
					if (thinking && thinking !== 'default') args.push('--thinking', thinking)
					if (plan) args.push('-p')
					if (!autoApprove) args.push('--auto-approve', 'false')
					args.push('-c', projectRoot, '--', prompt)
					const child = spawn(process.execPath, [entry, ...args], {
						cwd: projectRoot,
						windowsHide: true,
						stdio: ['ignore', 'pipe', 'pipe'],
					})
					const runId = randomUUID()
					const startedAtMs = Date.now()
					runRegistry.set(runId, child)
					res.writeHead(200, {
						'Content-Type': 'application/x-ndjson; charset=utf-8',
						'Cache-Control': 'no-store',
						'X-Content-Type-Options': 'nosniff',
						'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
						'Referrer-Policy': 'no-referrer',
					})
					const writeLine = (payload: Record<string, unknown>): void => {
						if (!res.writableEnded) res.write(`${JSON.stringify(payload)}\n`)
					}
					const forwardLine = (line: string): void => {
						const trimmed = line.trim()
						if (!trimmed) return
						try {
							const parsed = JSON.parse(trimmed) as unknown
							if (parsed && typeof parsed === 'object') {
								writeLine(parsed as Record<string, unknown>)
								return
							}
						} catch { /* non-JSON CLI output */ }
						writeLine({ type: 'bridge', event: 'raw', line: trimmed })
					}
					writeLine({ type: 'bridge', event: 'start', runId })
					let stdoutBuffer = ''
					let stderrTail = ''
					child.stdout?.setEncoding('utf-8')
					child.stdout?.on('data', (chunk: string) => {
						stdoutBuffer += chunk
						let index = stdoutBuffer.indexOf('\n')
						while (index >= 0) {
							forwardLine(stdoutBuffer.slice(0, index))
							stdoutBuffer = stdoutBuffer.slice(index + 1)
							index = stdoutBuffer.indexOf('\n')
						}
					})
					child.stderr?.setEncoding('utf-8')
					child.stderr?.on('data', (chunk: string) => {
						stderrTail = (stderrTail + chunk).slice(-4000)
					})
					res.on('close', () => {
						if (!child.killed) child.kill()
					})
					const runTimeout = setTimeout(() => {
						if (!child.killed) child.kill()
					}, CLINE_RUN_TIMEOUT_MS)
					child.on('close', (code) => {
						clearTimeout(runTimeout)
						runRegistry.delete(runId)
						if (stdoutBuffer.trim()) forwardLine(stdoutBuffer)
						void resolveClineSessionId(entry, prompt, startedAtMs).then((resolvedSessionId) => {
							if (resolvedSessionId) writeLine({ type: 'bridge', event: 'session', sessionId: resolvedSessionId })
							writeLine({ type: 'bridge', event: 'exit', code: code ?? -1, ...(stderrTail ? { stderr: stderrTail.trim() } : {}) })
							res.end()
						})
					})
					return
				}
				sendError(res, 404, 'Not Found')
			})
		},
	}
}

export default defineConfig({
	plugins: [
		vue(),
		blueprintDataPlugin(),
		clineBridgePlugin(),
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
