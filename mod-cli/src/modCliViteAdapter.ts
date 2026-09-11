import type { Connect, Plugin, ViteDevServer } from 'vite'

export const MOD_CLI_ROUTE = '/mod-cli'
export const MOD_CLI_DEFAULT_PROVIDER = 'cline'

const MOD_CLI_PROVIDERS = new Set(['cline', 'opencode'])

export function isModCliRoute(pathname: string): boolean {
  return pathname === MOD_CLI_ROUTE || pathname.startsWith(`${MOD_CLI_ROUTE}/`)
}

export function getModCliProvider(pathname: string): string | null {
  if (!isModCliRoute(pathname)) return null
  const segment = pathname.slice(MOD_CLI_ROUTE.length).split('/').filter(Boolean)[0]
  if (!segment) return MOD_CLI_DEFAULT_PROVIDER
  return MOD_CLI_PROVIDERS.has(segment) ? segment : MOD_CLI_DEFAULT_PROVIDER
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
        const accept = req.headers.accept
        if (typeof accept === 'string' && !accept.includes('text/html')) return next()
        req.url = '/index.html'
        next()
      }
      server.middlewares.use(handler)
    },
  }
}