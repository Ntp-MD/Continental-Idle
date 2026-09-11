import type { Connect, Plugin, ViteDevServer } from 'vite'

export const MOD_CLI_ROUTE = '/mod-cli'

export function isModCliRoute(pathname: string): boolean {
  return pathname === MOD_CLI_ROUTE || pathname.startsWith(`${MOD_CLI_ROUTE}/`)
}

export function modCliPlugin(): Plugin {
  return {
    name: 'mod-cli:route',
    configureServer(server: ViteDevServer) {
      const handler: Connect.NextHandleFunction = (req, _res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') return next()
        if (!req.url) return next()
        const pathname = req.url.split(/[?#]/)[0] ?? ''
        if (!isModCliRoute(pathname)) return next()
        req.url = '/index.html'
        next()
      }
      server.middlewares.use(handler)
    },
  }
}