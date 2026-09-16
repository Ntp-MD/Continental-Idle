// Theme map server: serves zed-theme-map.html + saves picks to settings.json.
// Run: node theme-server.mjs  ->  http://127.0.0.1:18751/
// Localhost only. No dependencies beyond node.
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { resolveSettingsPath } from './resolve-settings.mjs'

let highlightFn = null
async function getHighlight() {
  if (!highlightFn) highlightFn = (await import('./highlight.mjs')).highlight
  return highlightFn
}

const dir = path.dirname(fileURLToPath(import.meta.url))
const settingsPath = resolveSettingsPath(dir)
const PORT = 18751
const clients = new Set()

function regenerate() {
  execFile(process.execPath, [path.join(dir, 'sync-theme-map.mjs')], (error) => {
    if (error) {
      console.error('regenerate failed:', error.message)
      return
    }
    for (const res of clients) res.write('data: reload\n\n')
  })
}

let timer = null
console.log('watching ' + settingsPath)
try {
  fs.watch(path.dirname(settingsPath), (event, filename) => {
    if (filename && filename !== path.basename(settingsPath)) return
    clearTimeout(timer)
    timer = setTimeout(regenerate, 300)
  })
} catch (error) {
  console.error('watch failed:', error.message)
}

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8' }

// Replace only the experimental.theme_overrides block, byte-preserving the rest.
function applyOverrides(text, overrides) {  const key = '"experimental.theme_overrides"'
  const at = text.indexOf(key)
  if (at < 0) throw new Error('theme_overrides block not found')
  const open = text.indexOf('{', at + key.length)
  let depth = 0
  let end = -1
  for (let i = open; i < text.length; i++) {
    if (text[i] === '{') depth++
    else if (text[i] === '}') {
      depth--
      if (depth === 0) {
        end = i + 1
        break
      }
    }
  }
  if (end < 0) throw new Error('unbalanced braces in theme_overrides')
  const indent = '  '
  const body = JSON.stringify(overrides, null, 2)
    .split('\n')
    .map((line) => indent + line)
    .join('\n')
  return `${text.slice(0, open)}${body}${text.slice(end)}`
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1')
  if (req.method === 'POST' && url.pathname === '/api/save') {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => {
      try {
        const { experimental } = JSON.parse(body)
        if (!experimental || typeof experimental !== 'object') throw new Error('bad payload')
        const current = fs.readFileSync(settingsPath, 'utf8')
        // merge into the existing block so keys without map cards (terminal, …) survive
        const open = current.indexOf('{', current.indexOf('"experimental.theme_overrides"'))
        let depth = 0
        let end = -1
        for (let i = open; i < current.length; i++) {
          if (current[i] === '{') depth++
          else if (current[i] === '}') {
            depth--
            if (depth === 0) {
              end = i + 1
              break
            }
          }
        }
        const kept = JSON.parse(current.slice(open, end))
        const merged = { ...kept, ...experimental, syntax: { ...(kept.syntax ?? {}), ...(experimental.syntax ?? {}) } }
        fs.writeFileSync(settingsPath, applyOverrides(current, merged))
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true }))
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: false, error: String(error.message ?? error) }))
      }
    })
    return
  }
  if (req.method === 'GET' && url.pathname === '/api/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' })
    clients.add(res)
    req.on('close', () => clients.delete(res))
    return
  }
  if (req.method === 'POST' && url.pathname === '/api/highlight') {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', async () => {
      try {
        const { lang, code } = JSON.parse(body)
        const highlight = await getHighlight()
        const html = await highlight(lang, String(code ?? '').slice(0, 20000))
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true, html }))
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: false, error: String(error.message ?? error) }))
      }
    })
    return
  }
  const file = url.pathname === '/' ? 'zed-theme-map.html' : url.pathname.slice(1)
  const full = path.join(dir, path.normalize(file).replace(/^(\.\.[\\/])+/, ''))
  if (!full.startsWith(dir) || !fs.existsSync(full) || !fs.statSync(full).isFile()) {
    res.writeHead(404)
    res.end('not found')
    return
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(full)] ?? 'application/octet-stream' })
  fs.createReadStream(full).pipe(res)
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`theme map: http://127.0.0.1:${PORT}/`)
})
