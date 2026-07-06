import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import fs from 'node:fs'
import path from 'node:path'

function saveLayoutPlugin() {
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
        const filePath = path.resolve(fileURLToPath(new URL('./src/blueprint/saved-layout.ts', import.meta.url)))
        fs.writeFileSync(filePath, body, 'utf-8')
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
