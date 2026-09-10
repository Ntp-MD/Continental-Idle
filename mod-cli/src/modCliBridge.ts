export type ModCliThinking = 'default' | 'none' | 'low' | 'medium' | 'high' | 'xhigh'

export interface ModCliRunRequest {
  prompt: string
  model?: string
  provider?: string
  thinking?: ModCliThinking
  plan?: boolean
  autoApprove?: boolean
  sessionId?: string
}

export interface ModCliAgentEvent {
  type: string
  [key: string]: unknown
}

export interface ModCliMessageLine {
  ts?: string
  type: 'agent_event'
  event?: ModCliAgentEvent
  [key: string]: unknown
}

export interface ModCliRunResultLine {
  type: 'run_result'
  finishReason?: string
  iterations?: number
  durationMs?: number
  text?: string
  model?: { id?: string; provider?: string }
  usage?: { inputTokens?: number; outputTokens?: number; totalCost?: number }
  aggregateUsage?: { inputTokens?: number; outputTokens?: number; totalCost?: number }
  [key: string]: unknown
}

export interface ModCliBridgeLine {
  type: 'bridge'
  event: 'start' | 'exit' | 'session' | 'raw'
  runId?: string
  sessionId?: string
  code?: number
  line?: string
  stderr?: string
}

export type ModCliStreamLine = ModCliMessageLine | ModCliRunResultLine | ModCliBridgeLine

export interface ModCliSessionSummary {
  sessionId: string
  title: string
  prompt: string
  provider: string
  model: string
  status: string
  startedAt: string
  endedAt: string
}

export interface ModCliConfigInfo {
  ok: boolean
  available: boolean
  version: string | null
  cwd: string
}

const CLIENT_HEADERS: Record<string, string> = { 'x-blueprint-client': '1' }

async function bridgeFetch(url: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(url, { ...init, headers: { ...CLIENT_HEADERS, ...(init?.headers ?? {}) } })
  if (!response.ok) throw new Error(`ModCLI bridge request failed (${response.status})`)
  return response
}

function parseStreamLine(line: string): ModCliStreamLine {
  try {
    const parsed = JSON.parse(line) as unknown
    if (parsed && typeof parsed === 'object') return parsed as ModCliStreamLine
  } catch {
    return { type: 'bridge', event: 'raw', line }
  }
  return { type: 'bridge', event: 'raw', line }
}

export async function fetchModCliConfig(): Promise<ModCliConfigInfo> {
  const response = await bridgeFetch('/__cline/config')
  return (await response.json()) as ModCliConfigInfo
}

export async function fetchModCliHistory(): Promise<ModCliSessionSummary[]> {
  const response = await bridgeFetch('/__cline/history')
  const payload = (await response.json()) as { sessions?: unknown }
  if (!Array.isArray(payload.sessions)) return []
  const sessions: ModCliSessionSummary[] = []
  for (const item of payload.sessions) {
    if (typeof item !== 'object' || item === null) continue
    const raw = item as Record<string, unknown>
    const sessionId = typeof raw.sessionId === 'string' ? raw.sessionId : ''
    if (!sessionId) continue
    sessions.push({
      sessionId,
      title: typeof raw.title === 'string' ? raw.title : '',
      prompt: typeof raw.prompt === 'string' ? raw.prompt : '',
      provider: typeof raw.provider === 'string' ? raw.provider : '',
      model: typeof raw.model === 'string' ? raw.model : '',
      status: typeof raw.status === 'string' ? raw.status : '',
      startedAt: typeof raw.startedAt === 'string' ? raw.startedAt : '',
      endedAt: typeof raw.endedAt === 'string' ? raw.endedAt : '',
    })
  }
  return sessions
}

export async function stopModCliRun(runId: string): Promise<void> {
  await bridgeFetch('/__cline/stop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ runId }),
  })
}

export async function* streamModCliRun(request: ModCliRunRequest, signal?: AbortSignal): AsyncGenerator<ModCliStreamLine> {
  const response = await bridgeFetch('/__cline/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal,
  })
  if (!response.body) throw new Error('ModCLI bridge stream is unavailable')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let index = buffer.indexOf('\n')
      while (index >= 0) {
        const line = buffer.slice(0, index).trim()
        buffer = buffer.slice(index + 1)
        if (line) yield parseStreamLine(line)
        index = buffer.indexOf('\n')
      }
    }
    const tail = buffer.trim()
    if (tail) yield parseStreamLine(tail)
  } finally {
    reader.releaseLock()
  }
}
