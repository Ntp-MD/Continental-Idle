import { defineConfig, type ViteDevServer } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import fs from 'node:fs'
import path from 'node:path'

function isLocalhostOrigin(value: string | undefined): boolean {
	if (!value) return true
	try {
		const url = new URL(value)
		return url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1' || url.hostname === '::ffff:127.0.0.1' || url.hostname === '0.0.0.0'
	} catch {
		return false
	}
}

function isSafeSaveRequest(req: any, res: any): boolean {
	const origin = req.headers?.origin
	const referer = req.headers?.referer
	if (req.headers?.['x-blueprint-save'] !== '1' || !isLocalhostOrigin(origin) || !isLocalhostOrigin(referer)) {
		res.statusCode = 403
		res.end('Forbidden')
		return false
	}
	return true
}

function saveAssetsPlugin() {
	const filePath = path.resolve(fileURLToPath(new URL('./src/blueprint-editor/data/customAssets.json', import.meta.url)))
	return {
		name: 'save-assets',
		configureServer(server: ViteDevServer) {
			server.middlewares.use('/__save-assets', async (req: any, res: any) => {
				if (req.method !== 'POST') {
					res.statusCode = 405
					res.end('Method Not Allowed')
					return
				}
				if (!isSafeSaveRequest(req, res)) return
				let body = ''
				let size = 0
				const MAX_BODY_SIZE = 10 * 1024 * 1024
				for await (const chunk of req) {
					size += chunk.length
					if (size > MAX_BODY_SIZE) {
						res.statusCode = 413
						res.end('Payload too large')
						return
					}
					body += chunk
				}

				let parsed: { customAssets?: unknown; deletedDefaultIds?: unknown }
				try {
					parsed = JSON.parse(body)
				} catch {
					res.statusCode = 400
					res.end('Invalid JSON body')
					return
				}
				if (!Array.isArray(parsed.customAssets)) {
					res.statusCode = 400
					res.end('Invalid assets data: customAssets must be an array')
					return
				}
				if (parsed.deletedDefaultIds !== undefined && !Array.isArray(parsed.deletedDefaultIds)) {
					res.statusCode = 400
					res.end('Invalid assets data: deletedDefaultIds must be an array')
					return
				}

				const fileContent = JSON.stringify({
					$schema: 'custom-assets.v1.json',
					version: 1,
					customAssets: parsed.customAssets,
					deletedDefaultIds: Array.isArray(parsed.deletedDefaultIds) ? parsed.deletedDefaultIds : [],
				}, null, 2) + '\n'

				try {
					fs.writeFileSync(filePath, fileContent, 'utf-8')
					res.statusCode = 200
					res.setHeader('Content-Type', 'application/json')
					res.end(JSON.stringify({ ok: true }))
				} catch (e) {
					res.statusCode = 500
					res.end(String(e))
				}
			})
		},
	}
}

function saveLayoutPlugin() {
	const filePath = path.resolve(fileURLToPath(new URL('./src/blueprint-editor/data/blueprintLayout.json', import.meta.url)))
	return {
		name: 'save-layout',
		configureServer(server: ViteDevServer) {
			server.middlewares.use('/__save-layout', async (req: any, res: any) => {
				if (req.method !== 'POST') {
					res.statusCode = 405
					res.end('Method Not Allowed')
					return
				}
				if (!isSafeSaveRequest(req, res)) return
				let body = ''
				let size = 0
				const MAX_BODY_SIZE = 10 * 1024 * 1024
				for await (const chunk of req) {
					size += chunk.length
					if (size > MAX_BODY_SIZE) {
						res.statusCode = 413
						res.end('Payload too large')
						return
					}
					body += chunk
				}

				let parsed: { version?: unknown; canvas?: unknown; floors?: unknown; roomTemplates?: unknown; globalTags?: unknown }
				try {
					parsed = JSON.parse(body)
				} catch {
					res.statusCode = 400
					res.end('Invalid layout data: JSON parse failed')
					return
				}
				if (!parsed.canvas || typeof parsed.canvas !== 'object') {
					res.statusCode = 400
					res.end('Invalid layout data: canvas must be an object')
					return
				}
				if (!Array.isArray(parsed.floors)) {
					res.statusCode = 400
					res.end('Invalid layout data: floors must be an array')
					return
				}

				const fileContent = JSON.stringify({
					$schema: 'blueprint-layout.v1.json',
					version: typeof parsed.version === 'number' ? parsed.version : 2,
					canvas: parsed.canvas,
					floors: parsed.floors,
					roomTemplates: Array.isArray(parsed.roomTemplates) ? parsed.roomTemplates : [],
					globalTags: Array.isArray(parsed.globalTags) ? parsed.globalTags : [],
				}, null, 2) + '\n'

				try {
					fs.writeFileSync(filePath, fileContent, 'utf-8')
					res.statusCode = 200
					res.setHeader('Content-Type', 'application/json')
					res.end(JSON.stringify({ ok: true }))
				} catch (e) {
					res.statusCode = 500
					res.end(String(e))
				}
			})
		},
	}
}

function saveNpcConfigPlugin() {
	const filePath = path.resolve(fileURLToPath(new URL('./src/blueprint-editor/data/npcConfig.json', import.meta.url)))
	return {
		name: 'save-npc-config',
		configureServer(server: ViteDevServer) {
			server.middlewares.use('/__save-npc-config', async (req: any, res: any) => {
				if (req.method !== 'POST') {
					res.statusCode = 405
					res.end('Method Not Allowed')
					return
				}
				if (!isSafeSaveRequest(req, res)) return
				let body = ''
				let size = 0
				const MAX_BODY_SIZE = 10 * 1024 * 1024
				for await (const chunk of req) {
					size += chunk.length
					if (size > MAX_BODY_SIZE) {
						res.statusCode = 413
						res.end('Payload too large')
						return
					}
					body += chunk
				}

				let parsed: { speed?: unknown; defaultRoleId?: unknown; roles?: unknown; tasks?: unknown; pool?: unknown }
				try {
					parsed = JSON.parse(body)
				} catch {
					res.statusCode = 400
					res.end('Invalid NPC config: JSON parse failed')
					return
				}
				if (!Array.isArray(parsed.roles) || !Array.isArray(parsed.tasks) || !Array.isArray(parsed.pool)) {
					res.statusCode = 400
					res.end('Invalid NPC config: roles, tasks, and pool must be arrays')
					return
				}

				const fileContent = JSON.stringify({
					$schema: 'npc-config.v1.json',
					version: 1,
					speed: typeof parsed.speed === 'number' ? parsed.speed : 0.2,
					defaultRoleId: typeof parsed.defaultRoleId === 'string' ? parsed.defaultRoleId : '',
					roles: parsed.roles,
					tasks: parsed.tasks,
					pool: parsed.pool,
				}, null, 2) + '\n'

				try {
					fs.writeFileSync(filePath, fileContent, 'utf-8')
					res.statusCode = 200
					res.setHeader('Content-Type', 'application/json')
					res.end(JSON.stringify({ ok: true }))
				} catch (e) {
					res.statusCode = 500
					res.end(String(e))
				}
			})
		},
	}
}

// https://vite.dev/config/
export default defineConfig({
	plugins: [vue(), saveAssetsPlugin(), saveLayoutPlugin(), saveNpcConfigPlugin()],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
	build: {
		rollupOptions: {
			input: {
				main: 'index.html',
			},
		},
	},
})
