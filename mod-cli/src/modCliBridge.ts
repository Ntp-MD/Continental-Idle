export type ModCliThinking = 'default' | 'none' | 'low' | 'medium' | 'high' | 'xhigh'

export interface ModCliRunRequest {
  prompt: string
  model?: string
  provider?: string
  providerAccount?: string
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
  usage?: Partial<ModCliUsage>
  aggregateUsage?: Partial<ModCliUsage>
  [key: string]: unknown
}

export interface ModCliPermissionOption {
  optionId: string
  name: string
  kind: string
}

export interface ModCliBridgeLine {
  type: 'bridge'
  event: 'start' | 'exit' | 'session' | 'raw' | 'permission'
  runId?: string
  sessionId?: string
  code?: number
  line?: string
  stderr?: string
  permissionId?: string
  options?: ModCliPermissionOption[]
  title?: string
  toolCallId?: string
}

export type ModCliStreamLine = ModCliMessageLine | ModCliRunResultLine | ModCliBridgeLine

export interface ModCliUsage {
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
  totalCost: number
}

export interface ModCliSessionSummary {
  sessionId: string
  title: string
  prompt: string
  provider: string
  model: string
  status: string
  startedAt: string
  endedAt: string
  usage?: ModCliUsage
}

export interface ModCliConfigInfo {
  ok: boolean
  available: boolean
  version: string | null
  cwd: string
  providers?: Record<string, { available: boolean; version: string | null }>
}

export interface ModCliConnectionTest {
  provider?: string
  apiKey?: string
  model?: string
}

export interface ModCliConnectionResult {
  ok: boolean
  available: boolean
  version: string | null
  keyPresent: boolean
  provider: string
  error?: string
}

export interface ModCliModelInfo {
  ok: boolean
  provider: string
  model: string
  contextWindow: number | null
}

export interface ModCliModelEntry {
  id: string
  name: string
  contextWindow: number | null
}

export interface ModCliConfigOptionChoice {
  value: string
  name: string
}

export interface ModCliConfigOption {
  id: string
  name: string
  currentValue: string
  options: ModCliConfigOptionChoice[]
}

export interface ModCliModelsResult {
  ok: boolean
  provider: string
  models: ModCliModelEntry[]
  currentModel?: string
  providerOption: ModCliConfigOption | null
}

const CLIENT_HEADERS: Record<string, string> = { 'x-blueprint-client': '1' }

async function bridgeFetch(url: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(url, { ...init, headers: { ...CLIENT_HEADERS, ...(init?.headers ?? {}) } })
  if (!response.ok) {
    let detail = ''
    try {
      const data = (await response.json()) as { error?: unknown }
      if (typeof data.error === 'string' && data.error) detail = `: ${data.error}`
    } catch {
      detail = ''
    }
    throw new Error(`ModCLI bridge request failed (${response.status})${detail}`)
  }
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

export async function answerModCliPermission(runId: string, permissionId: string, optionId: string): Promise<void> {
  await bridgeFetch('/__cline/permission', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ runId, permissionId, optionId }),
  })
}

export async function deleteModCliSession(provider: string, sessionId: string): Promise<void> {
  await bridgeFetch('/__cline/delete-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, sessionId }),
  })
}

export async function testModCliConnection(test: ModCliConnectionTest): Promise<ModCliConnectionResult> {
  const response = await bridgeFetch('/__cline/test-connection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(test),
  })
  return (await response.json()) as ModCliConnectionResult
}

export async function fetchModCliModelInfo(provider?: string, model?: string): Promise<ModCliModelInfo> {
  const response = await bridgeFetch('/__cline/model-info', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, model }),
  })
  return (await response.json()) as ModCliModelInfo
}

function parseModCliConfigOption(value: unknown): ModCliConfigOption | null {
  if (typeof value !== 'object' || value === null) return null
  const raw = value as Record<string, unknown>
  const id = typeof raw.id === 'string' ? raw.id : ''
  if (!id) return null
  const options: ModCliConfigOptionChoice[] = []
  if (Array.isArray(raw.options)) {
    for (const item of raw.options) {
      if (typeof item !== 'object' || item === null) continue
      const choice = item as Record<string, unknown>
      const choiceValue = typeof choice.value === 'string' ? choice.value : ''
      if (!choiceValue) continue
      options.push({ value: choiceValue, name: typeof choice.name === 'string' && choice.name ? choice.name : choiceValue })
    }
  }
  if (!options.length) return null
  return {
    id,
    name: typeof raw.name === 'string' && raw.name ? raw.name : id,
    currentValue: typeof raw.currentValue === 'string' ? raw.currentValue : '',
    options,
  }
}

export async function fetchModCliModels(provider: string): Promise<ModCliModelsResult> {
  const response = await bridgeFetch('/__cline/models', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider }),
  })
  const payload = (await response.json()) as { provider?: unknown; models?: unknown; currentModel?: unknown; providerOption?: unknown }
  const models: ModCliModelEntry[] = []
  if (Array.isArray(payload.models)) {
    for (const item of payload.models) {
      if (typeof item !== 'object' || item === null) continue
      const raw = item as Record<string, unknown>
      if (typeof raw.id !== 'string' || !raw.id) continue
      const contextWindow = raw.contextWindow
      models.push({
        id: raw.id,
        name: typeof raw.name === 'string' && raw.name ? raw.name : raw.id,
        contextWindow: typeof contextWindow === 'number' && Number.isFinite(contextWindow) && contextWindow > 0 ? contextWindow : null,
      })
    }
  }
  return {
    ok: true,
    provider: typeof payload.provider === 'string' ? payload.provider : provider,
    currentModel: typeof payload.currentModel === 'string' ? payload.currentModel : '',
    models,
    providerOption: parseModCliConfigOption(payload.providerOption),
  }
}

function parseModCliUsage(value: unknown): ModCliUsage | null {
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

export async function fetchModCliHistory(provider?: string): Promise<ModCliSessionSummary[]> {
  const suffix = provider ? `?provider=${encodeURIComponent(provider)}` : ''
  const response = await bridgeFetch(`/__cline/history${suffix}`)
  const payload = (await response.json()) as { sessions?: unknown }
  if (!Array.isArray(payload.sessions)) return []
  const sessions: ModCliSessionSummary[] = []
  for (const item of payload.sessions) {
    if (typeof item !== 'object' || item === null) continue
    const raw = item as Record<string, unknown>
    const sessionId = typeof raw.sessionId === 'string' ? raw.sessionId : ''
    if (!sessionId) continue
    const usage = parseModCliUsage(raw.usage)
    sessions.push({
      sessionId,
      title: typeof raw.title === 'string' ? raw.title : '',
      prompt: typeof raw.prompt === 'string' ? raw.prompt : '',
      provider: typeof raw.provider === 'string' ? raw.provider : '',
      model: typeof raw.model === 'string' ? raw.model : '',
      status: typeof raw.status === 'string' ? raw.status : '',
      startedAt: typeof raw.startedAt === 'string' ? raw.startedAt : '',
      endedAt: typeof raw.endedAt === 'string' ? raw.endedAt : '',
      ...(usage ? { usage } : {}),
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
