import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import fs from 'node:fs'
import path from 'node:path'

function saveLayoutPlugin() {
  let cachedStartIdx = -1
  let cachedEndIdx = -1
  let cachedMtime = 0
  return {
    name: 'save-layout',
    configureServer(server) {
      server.middlewares.use('/__save-layout', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method Not Allowed')
          return
        }
        let body = ''
        for await (const chunk of req) body += chunk

        const startMarker = 'const SAVED_LAYOUT: LayoutData = '
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

        const filePath = path.resolve(fileURLToPath(new URL('./src/blueprint/store/state.ts', import.meta.url)))
        const stat = fs.statSync(filePath)
        const mtime = stat.mtimeMs

        if (mtime !== cachedMtime) {
          cachedMtime = mtime
          const fileContent = fs.readFileSync(filePath, 'utf-8')
          const fileStartMarker = 'const SAVED_LAYOUT: LayoutData = '
          const fileStartIdx = fileContent.indexOf(fileStartMarker)
          if (fileStartIdx === -1) {
            res.statusCode = 500
            res.end('Cannot find SAVED_LAYOUT in store/state.ts')
            return
          }
          const fileObjStart = fileContent.indexOf('{', fileStartIdx + fileStartMarker.length)
          if (fileObjStart === -1) {
            res.statusCode = 500
            res.end('Cannot find opening brace in store/state.ts')
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
            res.end('Cannot find closing brace in store/state.ts')
            return
          }
        }

        const fileContent = fs.readFileSync(filePath, 'utf-8')
        const newContent =
          fileContent.substring(0, cachedStartIdx) +
          'const SAVED_LAYOUT: LayoutData = ' + savedLayoutObj + '\n' +
          fileContent.substring(cachedEndIdx + 1)

        const newEnd = cachedStartIdx + 'const SAVED_LAYOUT: LayoutData = '.length + savedLayoutObj.length
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
  plugins: [vue(), saveLayoutPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        editor: fileURLToPath(new URL('./src/blueprint/editor.html', import.meta.url)),
      },
    },
  },
})
