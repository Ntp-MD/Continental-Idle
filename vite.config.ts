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
	const filePath = path.resolve(fileURLToPath(new URL('./src/blueprint-editor/assetRegistry.ts', import.meta.url)))
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

				let parsed: { assetRegistry?: unknown; assetCategories?: unknown }
				try {
					parsed = JSON.parse(body)
				} catch {
					res.statusCode = 400
					res.end('Invalid JSON body')
					return
				}
				if (!Array.isArray(parsed.assetRegistry)) {
					res.statusCode = 400
					res.end('Invalid assets data: assetRegistry must be an array')
					return
				}

				const content =
					'import type { AssetDef } from \'./types\'\n\n' +
					'export const ASSET_REGISTRY: AssetDef[] = ' + JSON.stringify(parsed.assetRegistry, null, 2) + '\n'

				try {
					fs.writeFileSync(filePath, content, 'utf-8')
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
	let cachedStartIdx = -1
	let cachedEndIdx = -1
	let cachedMtime = 0
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

				const startMarker = 'const SAVED_LAYOUT: FloorLayoutData = '
				const startIdx = body.indexOf(startMarker)
				if (startIdx === -1) {
					res.statusCode = 400
					res.end('Invalid layout data: no SAVED_LAYOUT found')
					return
				}
				const objStart = body.indexOf('{', startIdx + startMarker.length)
				if (objStart === -1) {
					res.statusCode = 400
					res.end('Invalid layout data: no opening brace')
					return
				}
				let depth = 0
				let inString = false
				let escape = false
				let endIdx = -1
				for (let i = objStart; i < body.length; i++) {
					const ch = body[i]
					if (escape) { escape = false; continue }
					if (ch === '\\') { escape = true; continue }
					if (ch === '"') { inString = !inString; continue }
					if (inString) continue
					if (ch === '{') depth++
					else if (ch === '}') {
						depth--
						if (depth === 0) { endIdx = i; break }
					}
				}
				if (endIdx === -1) {
					res.statusCode = 400
					res.end('Invalid layout data: unmatched braces')
					return
				}
				const savedLayoutObj = body.substring(objStart, endIdx + 1)
				try { JSON.parse(savedLayoutObj) } catch {
					res.statusCode = 400
					res.end('Invalid layout data: JSON parse failed')
					return
				}

				const filePath = path.resolve(fileURLToPath(new URL('./src/blueprint-editor/store/floorLayout.ts', import.meta.url)))
				const stat = fs.statSync(filePath)
				const mtime = stat.mtimeMs

				if (mtime !== cachedMtime) {
					cachedMtime = mtime
					const fileContent = fs.readFileSync(filePath, 'utf-8')
					const fileStartMarker = 'const SAVED_LAYOUT: FloorLayoutData = '
					const fileStartIdx = fileContent.indexOf(fileStartMarker)
					if (fileStartIdx === -1) {
						res.statusCode = 500
						res.end('Cannot find SAVED_LAYOUT in store/floorLayout.ts')
						return
					}
					const fileObjStart = fileContent.indexOf('{', fileStartIdx + fileStartMarker.length)
					if (fileObjStart === -1) {
						res.statusCode = 500
						res.end('Cannot find opening brace in store/floorLayout.ts')
						return
					}
					let fileDepth = 0
					let fileInString = false
					let fileEscape = false
					for (let i = fileObjStart; i < fileContent.length; i++) {
						const ch = fileContent[i]
						if (fileEscape) { fileEscape = false; continue }
						if (ch === '\\') { fileEscape = true; continue }
						if (ch === '"') { fileInString = !fileInString; continue }
						if (fileInString) continue
						if (ch === '{') fileDepth++
						else if (ch === '}') {
							fileDepth--
							if (fileDepth === 0) {
								cachedStartIdx = fileStartIdx
								cachedEndIdx = i
								break
							}
						}
					}
					if (cachedEndIdx === -1) {
						res.statusCode = 500
						res.end('Cannot find closing brace in store/floorLayout.ts')
						return
					}
				}

				const fileContent = fs.readFileSync(filePath, 'utf-8')
				const newContent =
					fileContent.substring(0, cachedStartIdx) +
					'const SAVED_LAYOUT: FloorLayoutData = ' + savedLayoutObj + '\n' +
					fileContent.substring(cachedEndIdx + 1)

				const newEnd = cachedStartIdx + 'const SAVED_LAYOUT: FloorLayoutData = '.length + savedLayoutObj.length
				cachedEndIdx = newEnd
				cachedMtime = Date.now()

				fs.writeFileSync(filePath, newContent, 'utf-8')
				res.statusCode = 200
				res.setHeader('Content-Type', 'application/json')
				res.end(JSON.stringify({ ok: true }))
			})
		},
	}
}

// https://vite.dev/config/
export default defineConfig({
	plugins: [vue(), saveAssetsPlugin(), saveLayoutPlugin()],
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
