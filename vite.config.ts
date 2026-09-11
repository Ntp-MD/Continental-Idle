import { defineConfig, type ViteDevServer } from 'vite'
import { fileURLToPath, pathToFileURL, URL } from 'node:url'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { execFile, execFileSync, spawn, type ChildProcess } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'
import fs from 'node:fs'
import path from 'node:path'
import { BLUEPRINT_DATA_SCHEMA, BLUEPRINT_DATA_VERSION, normalizeBlueprintDataFile } from './src/blueprint-editor/domain/types.js'
import type { BlueprintDataFile } from './src/blueprint-editor/domain/types.js'
import { modCliPlugin } from './mod-cli/src/modCliViteAdapter.js'

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
const CLINE_ID_PATTERN = /^[\w./:@~+-]+$/
const CLINE_SESSION_PATTERN = /^[\w-]+$/
const CLINE_MAX_PROMPT_BYTES = 64 * 1024
const CLINE_MAX_KEY_BYTES = 4096
const CLINE_RUN_TIMEOUT_MS = 30 * 60 * 1000

interface ClineRunBody {
	prompt?: unknown
	model?: unknown
	provider?: unknown
	providerAccount?: unknown
	apiKey?: unknown
	thinking?: unknown
	plan?: unknown
	worktree?: unknown
	autoApprove?: unknown
	configOptions?: unknown
	sessionId?: unknown
	runId?: unknown
	permissionId?: unknown
	optionId?: unknown
}


function asApiKey(value: unknown): string | null {
	if (typeof value !== 'string') return null
	const key = value.trim()
	if (!key || Buffer.byteLength(key, 'utf8') > CLINE_MAX_KEY_BYTES) return null
	if (/[\x00-\x1F\x7F]/.test(key)) return null
	return key
}

interface ClineModelCatalog {
	getGeneratedModelsForProvider?: (providerId: string) => unknown
}

let clineModelsModule: ClineModelCatalog | null = null
let clineModelsFailed = false

function clineLlmsModelsPath(entry: string): string | null {
	const candidate = path.join(path.dirname(path.dirname(entry)), 'node_modules', '@cline', 'llms', 'dist', 'models.js')
	try {
		if (fs.statSync(candidate).isFile()) return candidate
	} catch { /* catalog is unavailable */ }
	return null
}

async function ensureClineModels(entry: string): Promise<ClineModelCatalog | null> {
	if (clineModelsModule || clineModelsFailed) return clineModelsModule
	const catalogPath = clineLlmsModelsPath(entry)
	if (!catalogPath) {
		clineModelsFailed = true
		return null
	}
	try {
		clineModelsModule = (await import(pathToFileURL(catalogPath).href)) as ClineModelCatalog
	} catch {
		clineModelsFailed = true
		return null
	}
	return clineModelsModule
}

interface ModCliAuthProviderOption {
	id: string
	name: string
	currentValue: string
	options: Array<{ value: string; name: string }>
}

function asModelEntry(value: unknown): { id: string; name: string; contextWindow: number | null } | null {
	if (typeof value !== 'object' || value === null) return null
	const raw = value as Record<string, unknown>
	if (typeof raw.id !== 'string' || !raw.id) return null
	const contextWindow = raw.contextWindow
	return {
		id: raw.id,
		name: typeof raw.name === 'string' && raw.name ? raw.name : raw.id,
		contextWindow: typeof contextWindow === 'number' && Number.isFinite(contextWindow) && contextWindow > 0 ? Math.floor(contextWindow) : null,
	}
}

async function getModelContextWindow(entry: string, provider: string, model: string): Promise<number | null> {
	if (!provider || !model) return null
	const catalog = await ensureClineModels(entry)
	const lookup = catalog?.getGeneratedModelsForProvider
	if (typeof lookup !== 'function') return null
	let list: unknown
	try {
		list = lookup.call(catalog, provider)
	} catch {
		return null
	}
	const models = Array.isArray(list) ? list : Object.values((typeof list === 'object' && list !== null ? list : {}) as Record<string, unknown>)
	const want = model.toLowerCase()
	const prefix = `${provider.toLowerCase()}/`
	const match = models.find((item) => {
		const entry = asModelEntry(item)
		if (!entry) return false
		const low = entry.id.toLowerCase()
		return low === want || low === `${prefix}${want}` || low.endsWith(`/${want}`)
	})
	return match ? (asModelEntry(match)?.contextWindow ?? null) : null
}

async function getProviderModelList(entry: string, provider: string): Promise<Array<{ id: string; name: string; contextWindow: number | null }>> {
	const catalog = await ensureClineModels(entry)
	const lookup = catalog?.getGeneratedModelsForProvider
	if (typeof lookup !== 'function') return []
	let list: unknown
	try {
		list = lookup.call(catalog, provider)
	} catch {
		return []
	}
	const models = Array.isArray(list) ? list : Object.values((typeof list === 'object' && list !== null ? list : {}) as Record<string, unknown>)
	const entries: Array<{ id: string; name: string; contextWindow: number | null }> = []
	for (const item of models) {
		const parsed = asModelEntry(item)
		if (parsed) entries.push(parsed)
		if (entries.length >= 300) break
	}
	return entries
}

function resolveClineEntry(projectRoot?: string): string | null {
	const candidates: string[] = []
	if (projectRoot) candidates.push(path.join(projectRoot, 'node_modules', 'cline', 'bin', 'cline'))
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

type ModCliProviderId = 'cline' | 'opencode'
const MOD_CLI_PROVIDER_IDS: ModCliProviderId[] = ['cline', 'opencode']
const ACP_CLIENT_CAPABILITIES = { protocolVersion: 1, clientCapabilities: { fs: { readTextFile: true, writeTextFile: true } } }

function asString(value: unknown): string {
	return typeof value === 'string' ? value : ''
}

function asProviderId(value: unknown): ModCliProviderId | null {
	const id = asString(value).trim().toLowerCase()
	return (MOD_CLI_PROVIDER_IDS as string[]).includes(id) ? (id as ModCliProviderId) : null
}

function getOpencodeVersion(entry: string): Promise<string | null> {
	return new Promise((resolve) => {
		execFile(entry, ['--version'], { timeout: 15000, windowsHide: true }, (error, stdout) => {
			resolve(error ? null : stdout.trim() || null)
		})
	})
}

function resolveOpencodeEntry(): string | null {
	const candidates: string[] = []
	const home = process.env.USERPROFILE ?? process.env.HOME
	if (home) {
		candidates.push(path.join(home, '.opencode', 'opencode.exe'))
		candidates.push(path.join(home, '.opencode', 'bin', 'opencode.exe'))
	}
	try {
		const locator = process.platform === 'win32' ? 'where' : 'which'
		const hits = execFileSync(locator, ['opencode'], { encoding: 'utf-8' })
		for (const hit of hits.split(/\r?\n/)) if (hit.trim()) candidates.push(hit.trim())
	} catch { /* opencode is not on PATH */ }
	for (const candidate of candidates) {
		try {
			if (fs.statSync(candidate).isFile()) return candidate
		} catch { /* try next candidate */ }
	}
	return null
}

interface AgentDescriptor {
	id: ModCliProviderId
	cmd: string
	args: string[]
	version: () => Promise<string | null>
}

function resolveAgent(projectRoot: string, provider: ModCliProviderId): AgentDescriptor | null {
	if (provider === 'cline') {
		const entry = resolveClineEntry(projectRoot)
		if (!entry) return null
		return { id: provider, cmd: process.execPath, args: [entry, '--acp'], version: () => getClineVersion(entry) }
	}
	const entry = resolveOpencodeEntry()
	if (!entry) return null
	return { id: provider, cmd: entry, args: ['acp'], version: () => getOpencodeVersion(entry) }
}

interface AcpRequestWaiter {
	resolve: (value: Record<string, unknown>) => void
	reject: (error: Error) => void
	timer: NodeJS.Timeout | null
}

interface AcpConnection {
	request(method: string, params: Record<string, unknown>, timeoutMs?: number): Promise<Record<string, unknown>>
	reply(id: number, result: Record<string, unknown>): void
	replyError(id: number, code: number, message: string): void
	notify(method: string, params: Record<string, unknown>): void
	sink(handlers: {
		onRequest: (method: string, params: Record<string, unknown>, id: number) => void
		onNotification: (method: string, params: Record<string, unknown>) => void
	}): void
	destroy(): void
}

function connectAcp(child: ChildProcess): AcpConnection {
	const waiters = new Map<number, AcpRequestWaiter>()
	let nextId = 0
	let disposed = false
	let streamBuffer = ''
	let requestSink: ((method: string, params: Record<string, unknown>, id: number) => void) | null = null
	let notificationSink: ((method: string, params: Record<string, unknown>) => void) | null = null
	const write = (payload: Record<string, unknown>): boolean => {
		if (disposed || !child.stdin?.writable) return false
		child.stdin.write(`${JSON.stringify(payload)}\n`)
		return true
	}
	const failAll = (error: Error): void => {
		for (const [, waiter] of waiters) {
			if (waiter.timer) clearTimeout(waiter.timer)
			waiter.reject(error)
		}
		waiters.clear()
	}
	child.on('error', (error: Error) => {
		disposed = true
		failAll(error)
	})
	child.stdout?.setEncoding('utf-8')
	child.stdout?.on('data', (chunk: string) => {
		streamBuffer += chunk
		let index = streamBuffer.indexOf('\n')
		while (index >= 0) {
			const line = streamBuffer.slice(0, index).trim()
			streamBuffer = streamBuffer.slice(index + 1)
			index = streamBuffer.indexOf('\n')
			if (!line) continue
			let message: Record<string, unknown>
			try {
				message = JSON.parse(line) as Record<string, unknown>
			} catch { continue }
			const id = typeof message.id === 'number' ? message.id : null
			if (id !== null && typeof message.method === 'string') {
				requestSink?.(message.method, (message.params ?? {}) as Record<string, unknown>, id)
				continue
			}
			if (id !== null) {
				const waiter = waiters.get(id)
				if (!waiter) continue
				waiters.delete(id)
				if (waiter.timer) clearTimeout(waiter.timer)
				if (message.error && typeof message.error === 'object' && message.error !== null) {
					const raw = message.error as Record<string, unknown>
					waiter.reject(new Error(asString(raw.message) || 'ACP request failed'))
				} else {
					waiter.resolve((message.result && typeof message.result === 'object' ? message.result : {}) as Record<string, unknown>)
				}
				continue
			}
			if (typeof message.method === 'string') notificationSink?.(message.method, (message.params ?? {}) as Record<string, unknown>)
		}
	})
	return {
		request(method, params, timeoutMs = 20000) {
			return new Promise<Record<string, unknown>>((resolve, reject) => {
				const id = ++nextId
				const timer =
					timeoutMs > 0
						? setTimeout(() => {
								waiters.delete(id)
								reject(new Error(`${method} timed out`))
							}, timeoutMs)
						: null
				waiters.set(id, { resolve, reject, timer })
				if (!write({ jsonrpc: '2.0', id, method, params })) {
					waiters.delete(id)
					if (timer) clearTimeout(timer)
					reject(new Error('The agent stdin is closed'))
				}
			})
		},
		reply(id, result) {
			write({ jsonrpc: '2.0', id, result })
		},
		replyError(id, code, message) {
			write({ jsonrpc: '2.0', id, error: { code, message } })
		},
		notify(method, params) {
			write({ jsonrpc: '2.0', method, params })
		},
		sink(handlers) {
			requestSink = handlers.onRequest
			notificationSink = handlers.onNotification
		},
		destroy() {
			disposed = true
			failAll(new Error('ACP connection closed'))
		},
	}
}

function asAcpArray(value: unknown): Record<string, unknown>[] {
	return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null) : []
}

function findConfigOption(options: Record<string, unknown>[], id: string): Record<string, unknown> | null {
	return options.find((option) => option.id === id) ?? null
}

function pickModeValue(modeOption: Record<string, unknown> | null, plan: boolean): string | null {
	if (!modeOption) return null
	const values = asAcpArray(modeOption.options).map((option) => asString(option.value)).filter(Boolean)
	if (!values.length) return null
	if (plan) return values.find((value) => /plan/i.test(value)) ?? null
	return values.find((value) => !/plan/i.test(value)) ?? null
}

function pickModelValue(session: Record<string, unknown>, wanted: string): string | null {
	const configOptions = asAcpArray(session.configOptions)
	const modelOption = findConfigOption(configOptions, 'model')
	const candidates = modelOption
		? asAcpArray(modelOption.options).map((option) => asString(option.value))
		: asAcpArray((session.models as Record<string, unknown> | undefined)?.availableModels).map((model) => asString(model.modelId))
	const filtered = candidates.filter(Boolean)
	const want = wanted.toLowerCase()
	return filtered.find((value) => value.toLowerCase() === want) ?? filtered.find((value) => value.toLowerCase().endsWith(`/${want}`)) ?? null
}

function asAcpUsage(update: Record<string, unknown>): {
	inputTokens: number
	outputTokens: number
	cacheReadTokens: number
	cacheWriteTokens: number
	totalCost: number
	contextWindow: number | null
} {
	const num = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) ? value : 0)
	const cost = typeof update.cost === 'object' && update.cost !== null ? (update.cost as Record<string, unknown>) : {}
	const inputTokens = num(update.inputTokens)
	const size = num(update.size)
	return {
		inputTokens: inputTokens || num(update.used),
		outputTokens: num(update.outputTokens),
		cacheReadTokens: num(update.cacheReadTokens),
		cacheWriteTokens: num(update.cacheWriteTokens),
		totalCost: num(update.totalCost) || num(cost.amount),
		contextWindow: size > 0 ? Math.floor(size) : null,
	}
}

interface AcpPermissionOption {
	optionId: string
	name: string
	kind: string
}

function asPermissionOptions(value: unknown): AcpPermissionOption[] {
	const options: AcpPermissionOption[] = []
	for (const item of asAcpArray(value)) {
		const optionId = asString(item.optionId)
		if (!optionId) continue
		options.push({ optionId, name: asString(item.name) || optionId, kind: asString(item.kind) })
	}
	return options
}

function withinDirectory(root: string, candidate: string): boolean {
	const relative = path.relative(root, candidate)
	return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

function clineBridgePlugin() {
	const projectRoot = path.resolve(fileURLToPath(new URL('.', import.meta.url)))
	const runRegistry = new Map<string, ChildProcess>()
	const acpRuns = new Map<
		string,
		{
			connection: AcpConnection
			child: ChildProcess
			pendingPermissions: Map<string, number>
			sessionId: string
			promptSettled: boolean
			cancelled: boolean
		}
	>()
	const modelsCache = new Map<ModCliProviderId, { at: number; models: Array<{ id: string; name: string; contextWindow: number | null }>; currentModel: string; providerOption: ModCliAuthProviderOption | null }>()
	const modelsCacheTtlMs = 5 * 60 * 1000
	let opencodeHistory: { at: number; sessions: unknown[] } | null = null
	const asUsage = (value: unknown): { inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheWriteTokens: number; totalCost: number } | null => {
		if (typeof value !== 'object' || value === null) return null
		const raw = value as Record<string, unknown>
		const num = (key: string): number => (typeof raw[key] === 'number' && Number.isFinite(raw[key]) ? (raw[key] as number) : 0)
		return {
			inputTokens: num('inputTokens'),
			outputTokens: num('outputTokens'),
			cacheReadTokens: num('cacheReadTokens'),
			cacheWriteTokens: num('cacheWriteTokens'),
			totalCost: num('totalCost'),
		}
	}

	const openAcpAgent = async (agent: AgentDescriptor): Promise<{ child: ChildProcess; connection: AcpConnection; dispose: () => void }> => {
		const child = spawn(agent.cmd, agent.args, { cwd: projectRoot, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] })
		const connection = connectAcp(child)
		const dispose = (): void => {
			connection.destroy()
			if (!child.killed) child.kill()
		}
		try {
			await connection.request('initialize', ACP_CLIENT_CAPABILITIES, 30000)
			return { child, connection, dispose }
		} catch (error) {
			dispose()
			throw error
		}
	}

	const harvestModels = async (provider: ModCliProviderId): Promise<{ models: Array<{ id: string; name: string; contextWindow: number | null }>; currentModel: string; providerOption: ModCliAuthProviderOption | null }> => {
		const cached = modelsCache.get(provider)
		if (cached && Date.now() - cached.at < modelsCacheTtlMs) return { models: cached.models, currentModel: cached.currentModel, providerOption: cached.providerOption }
		const agent = resolveAgent(projectRoot, provider)
		if (!agent) throw new Error(`${provider === 'cline' ? 'Cline' : 'OpenCode'} CLI is not available`)
		const handle = await openAcpAgent(agent)
		try {
			const session = await handle.connection.request('session/new', { cwd: projectRoot, mcpServers: [] }, 30000)
			const harvestSessionId = asString(session.sessionId)
			let configOptions = asAcpArray(session.configOptions)
			const collected = new Map<string, { id: string; name: string }>()
			const collectFrom = (options: Record<string, unknown>[]): void => {
				const modelOption = findConfigOption(options, 'model')
				const rawModels = modelOption
					? asAcpArray(modelOption.options)
					: asAcpArray((session.models as Record<string, unknown> | undefined)?.availableModels)
				for (const item of rawModels) {
					const id = asString(item.value) || asString(item.modelId)
					if (!id || collected.has(id)) continue
					collected.set(id, { id, name: asString(item.name) || id })
				}
			}
			collectFrom(configOptions)
			// cline scopes its model list to the selected auth provider - sweep every
			// provider option so the dropdown shows all models the CLI can actually run.
			const providerOption = findConfigOption(configOptions, 'provider')
			const authProviderOptions = asAcpArray(providerOption?.options)
				.map((item) => ({ value: asString(item.value), name: asString(item.name) || asString(item.value) }))
				.filter((item) => item.value)
			const providerValues = authProviderOptions.map((item) => item.value).slice(0, 5)
			for (const value of providerValues) {
				if (value === asString(providerOption?.currentValue)) continue
				try {
					const switched = await handle.connection.request('session/set_config_option', { sessionId: harvestSessionId, configId: 'provider', value }, 15000)
					configOptions = asAcpArray(switched.configOptions)
					collectFrom(configOptions)
				} catch { /* provider not switchable on this agent - skip its list */ }
			}
			const authProvider: ModCliAuthProviderOption | null = providerOption
				? {
					id: asString(providerOption.id),
					name: asString(providerOption.name),
					currentValue: asString(providerOption.currentValue),
					options: authProviderOptions,
				}
				: null
			const models: Array<{ id: string; name: string; contextWindow: number | null }> = [...collected.values()].map((entry) => ({ ...entry, contextWindow: null }))
			const modelOption = findConfigOption(asAcpArray(session.configOptions), 'model')
			const currentModel = asString(modelOption?.currentValue)
			if (provider === 'cline') {
				const entry = resolveClineEntry(projectRoot)
				if (entry) {
					const catalog = await getProviderModelList(entry, 'cline')
					const byId = new Map(catalog.map((item) => [item.id.toLowerCase(), item.contextWindow] as const))
					for (const model of models) {
						const direct = byId.get(model.id.toLowerCase())
						if (direct !== undefined) {
							model.contextWindow = direct
							continue
						}
						for (const [id, window] of byId) {
							if (id.endsWith(`/${model.id.toLowerCase()}`)) {
								model.contextWindow = window
								break
							}
						}
					}
					if (harvestSessionId) {
						execFile(process.execPath, [entry, 'history', 'delete', '--session-id', harvestSessionId], { timeout: 20000, windowsHide: true }, () => {})
					}
				}
			} else if (harvestSessionId) {
				await handle.connection.request('session/close', { sessionId: harvestSessionId }, 10000).catch(() => {})
			}
			modelsCache.set(provider, { at: Date.now(), models, currentModel, providerOption: authProvider })
			return { models, currentModel, providerOption: authProvider }
		} finally {
			handle.dispose()
		}
	}

	const listOpencodeSessions = async (): Promise<unknown[]> => {
		if (opencodeHistory && Date.now() - opencodeHistory.at < 15000) return opencodeHistory.sessions
		const agent = resolveAgent(projectRoot, 'opencode')
		if (!agent) throw new Error('OpenCode CLI is not available')
		const handle = await openAcpAgent(agent)
		try {
			const result = await handle.connection.request('session/list', { cwd: projectRoot }, 30000)
			const sessions = Array.isArray(result.sessions) ? result.sessions : []
			opencodeHistory = { at: Date.now(), sessions }
			return sessions
		} finally {
			handle.dispose()
		}
	}

	const deleteOpencodeSession = async (sessionId: string): Promise<void> => {
		const agent = resolveAgent(projectRoot, 'opencode')
		if (!agent) throw new Error('OpenCode CLI is not available')
		const handle = await openAcpAgent(agent)
		try {
			await handle.connection.request('session/close', { sessionId }, 15000)
			opencodeHistory = null
		} finally {
			handle.dispose()
		}
	}

	const deleteClineSession = (entry: string, sessionId: string): Promise<string | null> =>
		new Promise((resolve) => {
			execFile(process.execPath, [entry, 'history', 'delete', '--session-id', sessionId], { timeout: 20000, windowsHide: true }, (error, stdout, stderr) => {
				if (!error) {
					resolve(null)
					return
				}
				const output = `${stdout}\n${stderr}`
				if (/Session .* not found/.test(output)) {
					resolve(null)
					return
				}
				resolve(output.trim() || 'cline exited nonzero')
			})
		})

	const startAcpRun = (
		agent: AgentDescriptor,
		body: ClineRunBody,
		runId: string,
		prompt: string,
		res: ServerResponse,
		writeLine: (payload: Record<string, unknown>) => void,
	): void => {
		const child = spawn(agent.cmd, agent.args, { cwd: projectRoot, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] })
		runRegistry.set(runId, child)
		const connection = connectAcp(child)
		const pendingPermissions = new Map<string, number>()
		const record = { connection, child, pendingPermissions, sessionId: '', promptSettled: false, promptFailed: false, cancelled: false }
		acpRuns.set(runId, record)
		const emitEvent = (event: Record<string, unknown>): void => writeLine({ type: 'agent_event', event })
		const startedAt = Date.now()
		const usage = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, totalCost: 0 }
		let contextWindow: number | null = null
		let stderrTail = ''
		child.stderr?.setEncoding('utf-8')
		child.stderr?.on('data', (chunk: string) => {
			stderrTail = (stderrTail + chunk).slice(-4000)
		})
		child.on('close', (code) => {
			clearTimeout(runTimeout)
			runRegistry.delete(runId)
			acpRuns.delete(runId)
			connection.destroy()
			for (const [, rpcId] of pendingPermissions) connection.reply(rpcId, { outcome: { outcome: 'cancelled' } })
			pendingPermissions.clear()
			writeLine({
				type: 'bridge',
				event: 'exit',
				code: record.promptSettled || record.promptFailed || record.cancelled ? 0 : code ?? -1,
				...(stderrTail.trim() ? { stderr: stderrTail.trim() } : {}),
			})
			res.end()
		})
		connection.sink({
			onRequest: (method, params, rpcId) => {
				if (method === 'session/request_permission') {
					const permissionId = randomUUID()
					pendingPermissions.set(permissionId, rpcId)
					const toolCall = typeof params.toolCall === 'object' && params.toolCall !== null ? (params.toolCall as Record<string, unknown>) : {}
					writeLine({
						type: 'bridge',
						event: 'permission',
						permissionId,
						options: asPermissionOptions(params.options),
						...(asString(toolCall.toolCallId) ? { toolCallId: asString(toolCall.toolCallId) } : {}),
						...(asString(toolCall.title) ? { title: asString(toolCall.title) } : {}),
					})
					return
				}
				if (method === 'fs/read_text_file' || method === 'fs/write_text_file') {
					const requestedPath = asString(params.path)
					const target = path.resolve(projectRoot, requestedPath)
					if (!requestedPath || !withinDirectory(projectRoot, target)) {
						connection.replyError(rpcId, -32602, 'Path is outside the project root')
						return
					}
					if (method === 'fs/read_text_file') {
						fs.promises.readFile(target, 'utf-8').then(
							(content) => connection.reply(rpcId, { content }),
							(error: NodeJS.ErrnoException) => connection.replyError(rpcId, -32602, error.message || 'Read failed'),
						)
					} else {
						fs.promises.writeFile(target, asString(params.content), 'utf-8').then(
							() => connection.reply(rpcId, {}),
							(error: NodeJS.ErrnoException) => connection.replyError(rpcId, -32602, error.message || 'Write failed'),
						)
					}
					return
				}
				connection.replyError(rpcId, -32601, `Unsupported request: ${method}`)
			},
			onNotification: (method, params) => {
				if (method !== 'session/update') return
				const update = typeof params.update === 'object' && params.update !== null ? (params.update as Record<string, unknown>) : {}
				const updateKind = asString(update.sessionUpdate)
				if (updateKind === 'agent_message_chunk' || updateKind === 'agent_thought_chunk') {
					// ACP content may be a single block or an array of blocks.
					const parts = Array.isArray(update.content) ? update.content : [update.content]
					const content = asAcpArray(parts)
						.map((part) => asString(part.text))
						.join('')
					if (content) emitEvent({ type: 'content_start', contentType: updateKind === 'agent_thought_chunk' ? 'thinking' : 'text', text: content })
					return
				}
				if (updateKind === 'tool_call' || updateKind === 'tool_call_update') {
					const toolCallId = asString(update.toolCallId)
					if (!toolCallId) return
					emitEvent({
						type: 'tool_call',
						toolCallId,
						title: asString(update.title),
						kind: asString(update.kind),
						status: asString(update.status),
						...(update.rawInput !== undefined ? { rawInput: update.rawInput } : {}),
						...(update.rawOutput !== undefined ? { rawOutput: update.rawOutput } : {}),
					})
					return
				}
				if (updateKind === 'usage_update') {
					const normalized = asAcpUsage(update)
					usage.inputTokens = normalized.inputTokens
					usage.outputTokens = normalized.outputTokens
					usage.cacheReadTokens = normalized.cacheReadTokens
					usage.cacheWriteTokens = normalized.cacheWriteTokens
					usage.totalCost = normalized.totalCost
					if (normalized.contextWindow && contextWindow === null) contextWindow = normalized.contextWindow
					emitEvent({
						type: 'usage',
						inputTokens: normalized.inputTokens,
						outputTokens: normalized.outputTokens,
						cacheReadTokens: normalized.cacheReadTokens,
						cacheWriteTokens: normalized.cacheWriteTokens,
						totalCost: normalized.totalCost,
						...(normalized.contextWindow ? { contextWindow: normalized.contextWindow } : {}),
					})
					return
				}
				if (updateKind === 'plan') emitEvent({ type: 'plan', entries: Array.isArray(update.entries) ? update.entries : [] })
			},
		})
		writeLine({ type: 'bridge', event: 'start', runId })
		const runTimeout = setTimeout(() => {
			if (!child.killed) child.kill()
		}, CLINE_RUN_TIMEOUT_MS)
		void (async () => {
			try {
				await connection.request('initialize', ACP_CLIENT_CAPABILITIES, 30000)
				let session: Record<string, unknown> | null = null
				const wantedSessionId = asString(body.sessionId).trim()
				if (wantedSessionId && CLINE_SESSION_PATTERN.test(wantedSessionId)) {
					try {
						session = await connection.request('session/load', { sessionId: wantedSessionId, cwd: projectRoot, mcpServers: [] }, 30000)
					} catch {
						emitEvent({ type: 'note', text: 'Could not resume that session - starting a new one.' })
					}
				}
				if (!session) session = await connection.request('session/new', { cwd: projectRoot, mcpServers: [] }, 30000)
				const sessionId = asString(session.sessionId) || wantedSessionId
				if (!sessionId) throw new Error('The agent did not return a session id')
				record.sessionId = sessionId
				writeLine({ type: 'bridge', event: 'session', sessionId })
				const applyRunConfig = async (runSessionId: string, runSession: Record<string, unknown>): Promise<string> => {
					let configOptions = asAcpArray(runSession.configOptions)
					const trySetConfig = async (configId: string, value: string): Promise<boolean> => {
						if (!findConfigOption(configOptions, configId)) return false
						try {
							const updated = await connection.request('session/set_config_option', { sessionId: runSessionId, configId, value }, 15000)
							configOptions = asAcpArray(updated.configOptions)
							return true
						} catch {
							return false
						}
					}
					const modeValue = pickModeValue(findConfigOption(configOptions, 'mode'), body.plan === true)
					if (modeValue) await trySetConfig('mode', modeValue)
					// An explicit auth provider (cline usage-billing / cline-pass / openai-codex)
					// is authoritative: switch it before the model so the model applies under it.
					const providerAccount = asString(body.providerAccount).trim()
					const providerOption = findConfigOption(configOptions, 'provider')
					const providerValues = asAcpArray(providerOption?.options).map((item) => asString(item.value)).filter(Boolean)
					const providerAccountSet = Boolean(providerAccount) && providerValues.includes(providerAccount)
					if (providerAccountSet) await trySetConfig('provider', providerAccount)
					const modelWanted = asString(body.model).trim()
					let appliedModel = ''
					if (modelWanted) {
						if (providerAccountSet) {
							const modelValue = pickModelValue({ configOptions }, modelWanted)
							if (modelValue) {
								await trySetConfig('model', modelValue)
								appliedModel = modelValue
							}
						} else {
							// cline model ids carry their auth provider as prefix - when the prefix
							// names a provider config option, switch provider before the model.
							const slash = modelWanted.indexOf('/')
							const wantedProvider = slash > 0 ? modelWanted.slice(0, slash) : ''
							if (wantedProvider && providerValues.includes(wantedProvider)) {
								await trySetConfig('provider', wantedProvider)
								appliedModel = modelWanted
								await trySetConfig('model', modelWanted)
							} else {
								const modelValue = pickModelValue(runSession, modelWanted)
								if (modelValue) {
									await trySetConfig('model', modelValue)
									appliedModel = modelValue
								}
							}
						}
					}
					if (findConfigOption(configOptions, 'auto_approve')) await trySetConfig('auto_approve', String(body.autoApprove !== false))
					const modelOption = findConfigOption(configOptions, 'model')
					return appliedModel || (modelOption ? asString(modelOption.currentValue) : '')
				}
				let currentModelId = await applyRunConfig(sessionId, session)
				let promptResult: Record<string, unknown>
				try {
					promptResult = await connection.request('session/prompt', { sessionId, prompt: [{ type: 'text', text: prompt }] }, 0)
				} catch (promptError) {
					const promptMessage = promptError instanceof Error ? promptError.message : String(promptError)
					// A resumed session the agent no longer knows cannot be persisted
					// into - heal once by continuing in a fresh session instead of
					// failing every message while the stale id stays bound.
					if (!wantedSessionId || !/unknown session/i.test(promptMessage)) throw promptError
					const fresh = await connection.request('session/new', { cwd: projectRoot, mcpServers: [] }, 30000)
					const freshId = asString(fresh.sessionId)
					if (!freshId) throw promptError
					record.sessionId = freshId
					writeLine({ type: 'bridge', event: 'session', sessionId: freshId })
					emitEvent({ type: 'note', text: `Session ${wantedSessionId} is no longer known - continued in a fresh session.` })
					currentModelId = await applyRunConfig(freshId, fresh)
					promptResult = await connection.request('session/prompt', { sessionId: freshId, prompt: [{ type: 'text', text: prompt }] }, 0)
				}
				record.promptSettled = true
				writeLine({
					type: 'run_result',
					finishReason: asString(promptResult.stopReason) || 'end_turn',
					durationMs: Date.now() - startedAt,
					...(currentModelId ? { model: { id: currentModelId } } : {}),
					usage: { ...usage },
					aggregateUsage: { ...usage },
				})
			} catch (error) {
				if (!record.promptSettled) {
					record.promptFailed = true
					emitEvent({ type: 'error', message: error instanceof Error ? error.message : String(error) })
				}
			} finally {
				if (!child.killed) child.kill()
			}
		})()
	}

	return {
		name: 'cline-bridge',
		configureServer(server: ViteDevServer) {
			server.middlewares.use('/__cline', async (req: IncomingMessage, res: ServerResponse) => {
				const route = (req.url ?? '').split('?')[0]
				if (route === '/config') {
					if (!isSafeClientRequest(req, res, false)) return
					const agents = MOD_CLI_PROVIDER_IDS.map((id) => ({ id, agent: resolveAgent(projectRoot, id) }))
					const probed = await Promise.all(agents.map(async ({ id, agent }) => ({ id, present: Boolean(agent), version: agent ? await agent.version() : null })))
					const providers: Record<string, { available: boolean; version: string | null }> = {}
					for (const { id, present, version } of probed) providers[id] = { available: present, version }
					sendJson(res, 200, {
						ok: true,
						available: providers.cline?.available === true,
						version: providers.cline?.version ?? null,
						cwd: projectRoot,
						providers,
					})
					return
				}
				if (route === '/history') {
					if (!isSafeClientRequest(req, res, false)) return
					const query = new URL(req.url ?? '/__cline/history', 'http://localhost').searchParams
					const provider = asProviderId(query.get('provider')) ?? 'cline'
					const agent = resolveAgent(projectRoot, provider)
					if (!agent) {
						sendError(res, 503, `${provider === 'cline' ? 'Cline' : 'OpenCode'} CLI is not available`)
						return
					}
					if (provider === 'opencode') {
						try {
							const raw = await listOpencodeSessions()
							const sessions = raw.flatMap((item) => {
								if (typeof item !== 'object' || item === null) return []
								const session = item as Record<string, unknown>
								const sessionId = asString(session.sessionId)
								if (!sessionId) return []
								return [
									{
										sessionId,
										title: asString(session.title),
										prompt: '',
										provider: 'opencode',
										model: '',
										status: '',
										startedAt: asString(session.updatedAt),
										endedAt: '',
									},
								]
							})
							sendJson(res, 200, { ok: true, sessions })
						} catch {
							sendError(res, 500, 'OpenCode sessions are unavailable')
						}
						return
					}
					const raw = await readClineHistoryRaw(agent.args[0] ?? '', 30)
					if (!Array.isArray(raw)) {
						sendError(res, 500, 'Cline history is unavailable')
						return
					}
					const sessions = raw.flatMap((item) => {
						if (typeof item !== 'object' || item === null) return []
						const session = item as Record<string, unknown>
						const sessionId = asString(session.sessionId)
						if (!sessionId) return []
						const meta = (typeof session.metadata === 'object' && session.metadata !== null
							? session.metadata
							: {}) as Record<string, unknown>
						const usage = asUsage(session.usage) ?? asUsage(session.aggregateUsage) ?? asUsage(meta.usage) ?? asUsage(meta.aggregateUsage)
						return [{
							sessionId,
							title: asString(session.title),
							prompt: asString(session.prompt).slice(0, 400),
							provider: asString(session.provider),
							model: asString(session.model),
							status: asString(session.status),
							startedAt: asString(session.startedAt),
							endedAt: asString(session.endedAt),
							...(usage ? { usage } : {}),
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
					const record = acpRuns.get(stopRunId)
					if (!child) {
						sendJson(res, 200, { ok: true, stopped: false })
						return
					}
					if (record) {
						record.cancelled = true
						record.connection.notify('session/cancel', { sessionId: record.sessionId })
					}
					setTimeout(() => {
						if (!child.killed) child.kill()
					}, 3000)
					sendJson(res, 200, { ok: true, stopped: true })
					return
				}
				if (route === '/test-connection') {
					if (!isSafeClientRequest(req, res, false)) return
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
					const testProvider = asProviderId(body.provider) ?? 'cline'
					const testModel = asString(body.model).trim()
					if (body.provider !== undefined && body.provider !== '' && asProviderId(body.provider) === null) {
						sendError(res, 400, 'Invalid provider id')
						return
					}
					if (testModel && !CLINE_ID_PATTERN.test(testModel)) {
						sendError(res, 400, 'Invalid model id')
						return
					}
					const testKey = body.apiKey === undefined ? undefined : asApiKey(body.apiKey)
					if (testKey === null) {
						sendError(res, 400, 'Invalid API key')
						return
					}
					const agent = resolveAgent(projectRoot, testProvider)
					if (!agent) {
						sendError(res, 503, `${testProvider === 'cline' ? 'Cline' : 'OpenCode'} CLI is not available`)
						return
					}
					const probeVersion = await agent.version()
					if (!probeVersion) {
						sendError(res, 500, `${testProvider === 'cline' ? 'Cline' : 'OpenCode'} CLI probe failed`)
						return
					}
					if (testProvider === 'cline') {
						const entry = resolveClineEntry(projectRoot)
						const probeHistory = entry ? await readClineHistoryRaw(entry, 1) : null
						if (probeHistory === null || !Array.isArray(probeHistory)) {
							sendError(res, 500, 'Cline CLI probe failed')
							return
						}
					}
					sendJson(res, 200, {
						ok: true,
						available: true,
						version: probeVersion,
						keyPresent: testKey !== undefined,
						provider: testProvider,
					})
					return
				}
				if (route === '/model-info') {
					if (!isSafeClientRequest(req, res, false)) return
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
					const infoProvider = asString(body.provider).trim()
					const infoModel = asString(body.model).trim()
					if (infoProvider && !CLINE_ID_PATTERN.test(infoProvider)) {
						sendError(res, 400, 'Invalid provider id')
						return
					}
					if (infoModel && !CLINE_ID_PATTERN.test(infoModel)) {
						sendError(res, 400, 'Invalid model id')
						return
					}
					const entry = resolveClineEntry(projectRoot)
					if (!entry) {
						sendError(res, 503, 'Cline CLI is not available')
						return
					}
					const contextWindow = await getModelContextWindow(entry, infoProvider, infoModel)
					sendJson(res, 200, { ok: true, provider: infoProvider, model: infoModel, contextWindow })
					return
				}
				if (route === '/models') {
					if (!isSafeClientRequest(req, res, false)) return
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
					const listProvider = asProviderId(body.provider)
					if (!listProvider) {
						sendError(res, 400, 'Provider is required (cline or opencode)')
						return
					}
					try {
						const harvested = await harvestModels(listProvider)
						sendJson(res, 200, { ok: true, provider: listProvider, models: harvested.models, currentModel: harvested.currentModel, providerOption: harvested.providerOption })
					} catch {
						sendJson(res, 200, { ok: true, provider: listProvider, models: [], currentModel: '' })
					}
					return
				}
				if (route === '/run') {
					if (!isSafeClientRequest(req, res, false)) return
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
					const provider = asProviderId(body.provider) ?? 'cline'
					const providerAccount = asString(body.providerAccount).trim()
					const thinking = asString(body.thinking).trim()
					const sessionId = asString(body.sessionId).trim()
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
					if (providerAccount && !CLINE_ID_PATTERN.test(providerAccount)) {
						sendError(res, 400, 'Invalid provider account')
						return
					}
					if (thinking && thinking !== 'default' && !CLINE_THINKING_LEVELS.has(thinking)) {
						sendError(res, 400, 'Invalid thinking level')
						return
					}
					if (sessionId && !CLINE_SESSION_PATTERN.test(sessionId)) {
						sendError(res, 400, 'Invalid session id')
						return
					}
					if (body.worktree === true) {
						sendError(res, 400, 'Worktree is not supported by the ACP wire')
						return
					}
					const agent = resolveAgent(projectRoot, provider)
					if (!agent) {
						sendError(res, 503, `${provider === 'cline' ? 'Cline' : 'OpenCode'} CLI is not available`)
						return
					}
					const runId = randomUUID()
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
					startAcpRun(agent, body, runId, prompt, res, writeLine)
					res.on('close', () => {
						const child = runRegistry.get(runId)
						if (child && !child.killed) child.kill()
					})
					return
				}
				if (route === '/permission') {
					if (!isSafeClientRequest(req, res, false)) return
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
					const runId = asString(body.runId)
					const permissionId = asString(body.permissionId)
					const optionId = asString(body.optionId)
					if (!runId || !permissionId || !optionId) {
						sendError(res, 400, 'runId, permissionId and optionId are required')
						return
					}
					const record = acpRuns.get(runId)
					const rpcId = record?.pendingPermissions.get(permissionId)
					if (!record || rpcId === undefined) {
						sendError(res, 404, 'That permission is no longer pending')
						return
					}
					record.pendingPermissions.delete(permissionId)
					record.connection.reply(rpcId, { outcome: { outcome: 'selected', optionId } })
					sendJson(res, 200, { ok: true })
					return
				}
				if (route === '/delete-session') {
					if (!isSafeClientRequest(req, res, false)) return
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
					const provider = asProviderId(body.provider) ?? 'cline'
					const sessionId = asString(body.sessionId).trim()
					if (!sessionId) {
						sendError(res, 400, 'sessionId is required')
						return
					}
					if (!CLINE_SESSION_PATTERN.test(sessionId)) {
						sendError(res, 400, 'Invalid session id')
						return
					}
					if (provider === 'cline') {
						const entry = resolveClineEntry(projectRoot)
						if (!entry) {
							sendError(res, 503, 'Cline CLI is not available')
							return
						}
						const deleteError = await deleteClineSession(entry, sessionId)
						if (deleteError) {
							sendError(res, 500, `Cline could not delete that session - ${deleteError}`)
							return
						}
						sendJson(res, 200, { ok: true, deleted: true })
						return
					}
					try {
						await deleteOpencodeSession(sessionId)
						sendJson(res, 200, { ok: true, deleted: true })
					} catch {
						sendError(res, 500, 'OpenCode could not delete that session')
					}
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
		modCliPlugin(),
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
