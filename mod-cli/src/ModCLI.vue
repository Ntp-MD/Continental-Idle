<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  fetchModCliConfig,
  fetchModCliHistory,
  stopModCliRun,
  streamModCliRun,
  type ModCliSessionSummary,
  type ModCliStreamLine,
  type ModCliThinking,
} from './modCliBridge'

interface ChatItem {
  id: number
  kind: 'user' | 'assistant' | 'thinking' | 'event' | 'error' | 'note'
  text: string
  open: boolean
}

interface StoredSettings {
  provider?: unknown
  model?: unknown
  thinking?: unknown
  planMode?: unknown
  autoApprove?: unknown
  contextLimit?: unknown
  dailyLimit?: unknown
  weeklyLimit?: unknown
  monthlyLimit?: unknown
}

interface UsageRecord {
  ts: number
  cost: number
  inputTokens: number
  outputTokens: number
}

const SETTINGS_KEY = 'cline-chat-settings-v1'
const USAGE_KEY = 'cline-chat-usage-v1'
const USAGE_KEEP_MS = 40 * 24 * 60 * 60 * 1000
const USAGE_KEEP_MAX = 500
const THINKING_OPTIONS: ModCliThinking[] = ['default', 'none', 'low', 'medium', 'high', 'xhigh']

const provider = ref('cline')
const model = ref('')
const thinking = ref<ModCliThinking>('default')
const planMode = ref(false)
const autoApprove = ref(true)
const contextLimit = ref(0)
const contextUsed = ref<number | null>(null)
const contextExceeded = ref(false)
const dailyLimit = ref(0)
const weeklyLimit = ref(0)
const monthlyLimit = ref(0)
const usageRecords = ref<UsageRecord[]>([])
const liveCost = ref(0)
const liveCommitted = ref(false)
const nowMs = ref(Date.now())
const sessionId = ref('')
const items = ref<ChatItem[]>([])
const composer = ref('')
const running = ref(false)
const runId = ref('')
const usageLabel = ref('')
const statusText = ref('')
const configAvailable = ref<boolean | null>(null)
const modCliVersion = ref('')
const drawerOpen = ref(false)
const historyLoading = ref(false)
const sessions = ref<ModCliSessionSummary[]>([])
const logElement = ref<HTMLElement | null>(null)

let itemSeq = 0
let abortController: AbortController | null = null
let activeAssistant: ChatItem | null = null
let activeThinking: ChatItem | null = null
let assistantSeen = false
let usageEventSeen = false
let usageTimer: number | null = null

const pushItem = (kind: ChatItem['kind'], text: string, open = false): ChatItem => {
  const item: ChatItem = { id: itemSeq++, kind, text, open }
  items.value.push(item)
  return item
}

const appendItem = (item: ChatItem | null, kind: ChatItem['kind'], text: string): ChatItem => {
  if (item) {
    item.text = item.text ? `${item.text}\n${text}` : text
    return item
  }
  return pushItem(kind, text)
}

const appendText = (contentType: unknown, text: string): void => {
  if (!text) return
  if (contentType === 'thinking') activeThinking = appendItem(activeThinking, 'thinking', text)
  else {
    activeAssistant = appendItem(activeAssistant, 'assistant', text)
    assistantSeen = true
  }
}

const toNumber = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) ? value : 0)

const formatUsage = (input: unknown, output: unknown, cost: unknown): string => {
  const parts = [`in ${toNumber(input)}`, `out ${toNumber(output)}`]
  const totalCost = toNumber(cost)
  if (totalCost > 0) parts.push(`$${totalCost.toFixed(4)}`)
  return parts.join(' / ')
}

const formatTokens = (value: number): string =>
  value >= 10000 ? `${Math.round(value / 1000)}k` : value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value)

const contextPct = computed(() => {
  const limit = Number(contextLimit.value) || 0
  if (!limit || contextUsed.value === null) return null
  return Math.min(100, Math.round((contextUsed.value / limit) * 100))
})

const ctxClass = computed(() => {
  if (contextExceeded.value || (contextPct.value !== null && contextPct.value >= 90)) return 'mod-cli-chat__gauge--danger'
  if (contextPct.value !== null && contextPct.value >= 70) return 'mod-cli-chat__gauge--warn'
  return ''
})

const ctxTitle = computed(() => {
  const used = contextUsed.value === null ? 0 : contextUsed.value
  const parts = [`Context tokens sent to the model: ${used.toLocaleString()}`]
  if (contextPct.value !== null) parts.push(`${contextPct.value}% of limit`)
  if (contextExceeded.value) parts.push('Context window exceeded on last run')
  return parts.join(' - ')
})

const ctxLimitLabel = computed(() => formatTokens(Number(contextLimit.value) || 0))

const startOfDay = (ms: number): number => {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

const startOfWeek = (ms: number): number => {
  const d = new Date(ms)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

const nextMonthResetMs = (ms: number): number => {
  const d = new Date(ms)
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime()
}

const formatCost = (value: number): string => {
  const text = value >= 1 ? value.toFixed(2) : value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')
  return `$${text || '0'}`
}

const formatRemaining = (ms: number): string => {
  const minutes = Math.floor(ms / 60000)
  if (minutes < 1) return '<1m'
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const mins = minutes % 60
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

const loadUsage = (): void => {
  try {
    const raw = localStorage.getItem(USAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return
    const floor = Date.now() - USAGE_KEEP_MS
    for (const item of parsed) {
      if (typeof item !== 'object' || item === null) continue
      const rec = item as Record<string, unknown>
      if (typeof rec.ts !== 'number' || rec.ts < floor) continue
      usageRecords.value.push({
        ts: rec.ts,
        cost: typeof rec.cost === 'number' ? rec.cost : 0,
        inputTokens: typeof rec.inputTokens === 'number' ? rec.inputTokens : 0,
        outputTokens: typeof rec.outputTokens === 'number' ? rec.outputTokens : 0,
      })
    }
  } catch {
    localStorage.removeItem(USAGE_KEY)
  }
}

const saveUsage = (): void => {
  try {
    localStorage.setItem(USAGE_KEY, JSON.stringify(usageRecords.value.slice(-USAGE_KEEP_MAX)))
  } catch { /* storage full or unavailable */ }
}

const commitUsage = (cost: number, inputTokens = 0, outputTokens = 0): void => {
  if (cost <= 0) return
  usageRecords.value.push({ ts: Date.now(), cost, inputTokens, outputTokens })
  const floor = Date.now() - USAGE_KEEP_MS
  usageRecords.value = usageRecords.value.filter((rec) => rec.ts >= floor).slice(-USAGE_KEEP_MAX)
  saveUsage()
  liveCommitted.value = true
  liveCost.value = 0
}

const liveAdd = computed(() => (running.value && !liveCommitted.value ? liveCost.value : 0))

const costSince = (startMs: number): number => {
  let sum = 0
  for (const rec of usageRecords.value) if (rec.ts >= startMs) sum += rec.cost
  return sum + liveAdd.value
}

const dayUsage = computed(() => costSince(startOfDay(nowMs.value)))
const weekUsage = computed(() => costSince(startOfWeek(nowMs.value)))
const monthUsage = computed(() => {
  const d = new Date(nowMs.value)
  d.setDate(1)
  return costSince(startOfDay(d.getTime()))
})

interface UsageCell {
  key: string
  label: string
  used: number
  limit: number
  pct: number | null
  cls: string
  resetIn: string
}

const usageCells = computed<UsageCell[]>(() => {
  const defs: Array<{ key: string; label: string; used: number; limit: number; resetAt: number }> = [
    { key: 'day', label: 'Day', used: dayUsage.value, limit: Number(dailyLimit.value) || 0, resetAt: startOfDay(nowMs.value) + 86400000 },
    { key: 'week', label: 'Week', used: weekUsage.value, limit: Number(weeklyLimit.value) || 0, resetAt: startOfWeek(nowMs.value) + 7 * 86400000 },
    { key: 'month', label: 'Month', used: monthUsage.value, limit: Number(monthlyLimit.value) || 0, resetAt: nextMonthResetMs(nowMs.value) },
  ]
  return defs.map((def) => {
    const pct = def.limit > 0 ? Math.min(100, Math.round((def.used / def.limit) * 100)) : null
    const cls = pct !== null && pct >= 90 ? 'mod-cli-chat__gauge--danger' : pct !== null && pct >= 70 ? 'mod-cli-chat__gauge--warn' : ''
    return { ...def, pct, cls, resetIn: formatRemaining(def.resetAt - nowMs.value) }
  })
})

const GAUGE_CIRC = 2 * Math.PI * 12

interface UsageGauge {
  key: string
  label: string
  value: string
  pct: number | null
  cls: string
  title: string
  reset: string
}

const usageGauges = computed<UsageGauge[]>(() => {
  const ctxGauge: UsageGauge = {
    key: 'ctx',
    label: 'ctx',
    value:
      contextUsed.value === null
        ? '-'
        : `${formatTokens(contextUsed.value)}${Number(contextLimit.value) > 0 ? ` / ${ctxLimitLabel.value}` : ''}`,
    pct: contextPct.value,
    cls: ctxClass.value,
    title: ctxTitle.value,
    reset: Number(contextLimit.value) > 0 ? '' : 'set a limit',
  }
  const periods = usageCells.value.map((cell) => ({
    key: cell.key,
    label: cell.label,
    value: `${formatCost(cell.used)}${cell.limit > 0 ? ` / ${formatCost(cell.limit)}` : ''}`,
    pct: cell.pct,
    cls: cell.cls,
    title: `${cell.label} spend: ${formatCost(cell.used)}${cell.limit > 0 ? ` of ${formatCost(cell.limit)}` : ''}`,
    reset: `resets in ${cell.resetIn}`,
  }))
  return [ctxGauge, ...periods]
})

const statusLabel = computed(() => {
  if (running.value) return usageLabel.value || 'Running'
  if (configAvailable.value === false) return 'ModCLI bridge unavailable'
  if (statusText.value) return statusText.value
  return modCliVersion.value ? `Idle - v${modCliVersion.value}` : 'Idle'
})

const dotClass = computed(() => {
  if (running.value) return 'mod-cli-chat__dot--run'
  if (configAvailable.value === false) return 'mod-cli-chat__dot--err'
  return ''
})

const canSend = computed(() => !running.value && configAvailable.value !== false && composer.value.trim().length > 0)

const modelOptions = computed(() => {
  const found = new Set<string>()
  if (model.value.trim()) found.add(model.value.trim())
  for (const session of sessions.value) if (session.model) found.add(session.model)
  return [...found]
})

const providerOptions = computed(() => {
  const found = new Set<string>(['cline'])
  if (provider.value.trim()) found.add(provider.value.trim())
  for (const session of sessions.value) if (session.provider) found.add(session.provider)
  return [...found]
})

watch(
  items,
  () => {
    void nextTick(() => {
      const log = logElement.value
      if (log) log.scrollTop = log.scrollHeight
    })
  },
  { deep: true },
)

const saveSettings = (): void => {
  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify({
      provider: provider.value,
      model: model.value,
      thinking: thinking.value,
      planMode: planMode.value,
      autoApprove: autoApprove.value,
      contextLimit: Number(contextLimit.value) || 0,
      dailyLimit: Number(dailyLimit.value) || 0,
      weeklyLimit: Number(weeklyLimit.value) || 0,
      monthlyLimit: Number(monthlyLimit.value) || 0,
    }),
  )
}

const loadSettings = (): void => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as StoredSettings
    if (typeof parsed.provider === 'string' && parsed.provider) provider.value = parsed.provider
    if (typeof parsed.model === 'string') model.value = parsed.model
    if (typeof parsed.thinking === 'string' && THINKING_OPTIONS.includes(parsed.thinking as ModCliThinking)) {
      thinking.value = parsed.thinking as ModCliThinking
    }
    if (typeof parsed.planMode === 'boolean') planMode.value = parsed.planMode
    if (typeof parsed.autoApprove === 'boolean') autoApprove.value = parsed.autoApprove
    if (typeof parsed.contextLimit === 'number' && Number.isFinite(parsed.contextLimit) && parsed.contextLimit >= 0) {
      contextLimit.value = parsed.contextLimit
    }
    for (const [key, target] of [
      ['dailyLimit', dailyLimit],
      ['weeklyLimit', weeklyLimit],
      ['monthlyLimit', monthlyLimit],
    ] as const) {
      const value = parsed[key]
      if (typeof value === 'number' && Number.isFinite(value) && value >= 0) target.value = value
    }
  } catch {
    localStorage.removeItem(SETTINGS_KEY)
  }
}

const applyStreamLine = (line: ModCliStreamLine): void => {
  if (line.type === 'bridge') {
    if (line.event === 'start') runId.value = line.runId ?? ''
    else if (line.event === 'session' && line.sessionId) sessionId.value = line.sessionId
    else if (line.event === 'exit') {
      const code = line.code ?? 0
      if (code !== 0) {
        pushItem('error', `ModCLI exited with code ${code}${line.stderr ? `: ${line.stderr.trim()}` : ''}`)
      }
      if (!liveCommitted.value) commitUsage(liveCost.value)
      statusText.value = code === 0 ? 'Idle' : `Exited (${code})`
      usageLabel.value = ''
    }
    return
  }
  if (line.type === 'run_result') {
    const usage = line.aggregateUsage ?? line.usage
    if (usage) usageLabel.value = formatUsage(usage.inputTokens, usage.outputTokens, usage.totalCost)
    commitUsage(
      toNumber(usage?.totalCost) || liveCost.value,
      toNumber(usage?.inputTokens),
      toNumber(usage?.outputTokens),
    )
    if (!usageEventSeen) {
      const used = toNumber(usage?.inputTokens)
      if (used > 0) contextUsed.value = used
    }
    if (line.finishReason === 'context_window_exceeded') contextExceeded.value = true
    statusText.value = `${line.model?.id ?? 'model'} - ${line.finishReason ?? 'done'} (${line.durationMs ?? 0}ms)`
    return
  }
  const event = line.event
  if (!event || typeof event.type !== 'string') return
  switch (event.type) {
    case 'content_start':
      usageLabel.value = 'Generating...'
      appendText(event.contentType, typeof event.text === 'string' ? event.text : '')
      break
    case 'content_end': {
      const text = typeof event.text === 'string' ? event.text : ''
      if (!text) break
      if (event.contentType === 'thinking') {
        if (activeThinking?.text) activeThinking.text = text
        else activeThinking = appendItem(activeThinking, 'thinking', text)
      } else if (activeAssistant?.text) activeAssistant.text = text
      else {
        activeAssistant = appendItem(activeAssistant, 'assistant', text)
        assistantSeen = true
      }
      break
    }
    case 'usage':
      usageLabel.value = formatUsage(event.inputTokens, event.outputTokens, event.cost)
      usageEventSeen = true
      liveCost.value += toNumber(event.cost)
      {
        const used = toNumber(event.inputTokens) + toNumber(event.cacheReadTokens) + toNumber(event.cacheWriteTokens)
        if (used > 0) contextUsed.value = used
      }
      break
    case 'iteration_start':
    case 'iteration_end':
      activeAssistant = null
      activeThinking = null
      break
    case 'done': {
      const text = typeof event.text === 'string' ? event.text : ''
      if (text && !assistantSeen) pushItem('assistant', text)
      const reason = typeof event.reason === 'string' ? event.reason : 'completed'
      if (reason === 'context_window_exceeded') contextExceeded.value = true
      statusText.value = `Done (${reason})`
      assistantSeen = false
      activeAssistant = null
      activeThinking = null
      break
    }
    default:
      pushItem('event', JSON.stringify(event, null, 2))
  }
}

const send = async (): Promise<void> => {
  const prompt = composer.value.trim()
  if (!prompt || running.value || configAvailable.value === false) return
  composer.value = ''
  pushItem('user', prompt)
  if (sessionId.value) pushItem('note', `Continuing session ${sessionId.value}`)
  running.value = true
  usageLabel.value = ''
  statusText.value = ''
  usageEventSeen = false
  contextExceeded.value = false
  liveCost.value = 0
  liveCommitted.value = false
  assistantSeen = false
  activeAssistant = null
  activeThinking = null
  abortController = new AbortController()
  saveSettings()
  try {
    for await (const line of streamModCliRun(
      {
        prompt,
        model: model.value.trim() || undefined,
        provider: provider.value.trim() || undefined,
        thinking: thinking.value,
        plan: planMode.value,
        autoApprove: autoApprove.value,
        sessionId: sessionId.value || undefined,
      },
      abortController.signal,
    )) {
      applyStreamLine(line)
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') pushItem('note', 'Run stopped.')
    else pushItem('error', error instanceof Error ? error.message : String(error))
  } finally {
    running.value = false
    runId.value = ''
    abortController = null
    void loadHistory()
  }
}

const stopRun = async (): Promise<void> => {
  if (!runId.value) return
  try {
    await stopModCliRun(runId.value)
  } catch {
    abortController?.abort()
    return
  }
  abortController?.abort()
}

const loadHistory = async (): Promise<void> => {
  historyLoading.value = true
  try {
    sessions.value = await fetchModCliHistory()
  } catch {
    sessions.value = []
  } finally {
    historyLoading.value = false
  }
}

const resumeSession = (session: ModCliSessionSummary): void => {
  if (running.value) return
  sessionId.value = session.sessionId
  pushItem('note', `Resumed session ${session.sessionId} - the next message continues it.`)
  if (session.model) model.value = session.model
  if (session.provider) provider.value = session.provider
  drawerOpen.value = false
}

const newChat = (): void => {
  if (running.value) return
  sessionId.value = ''
  items.value = []
  statusText.value = ''
  usageLabel.value = ''
  contextUsed.value = null
  contextExceeded.value = false
}

const formatWhen = (iso: string): string => {
  const time = Date.parse(iso)
  return Number.isNaN(time) ? '' : new Date(time).toLocaleString()
}

const onToggle = (item: ChatItem, event: Event): void => {
  item.open = (event.target as HTMLDetailsElement).open
}

onMounted(() => {
  loadSettings()
  loadUsage()
  usageTimer = window.setInterval(() => {
    nowMs.value = Date.now()
  }, 15000)
  void (async () => {
    try {
      const config = await fetchModCliConfig()
      configAvailable.value = config.available
      modCliVersion.value = config.version ?? ''
    } catch {
      configAvailable.value = false
    }
  })()
  void loadHistory()
})

onUnmounted(() => {
  if (usageTimer !== null) window.clearInterval(usageTimer)
})
</script>

<template>
  <div class="mod-cli-chat">
    <aside v-if="drawerOpen" class="mod-cli-chat__sidebar">
      <div class="mod-cli-chat__sidebar-header">
        <span class="mod-cli-chat__sidebar-title">Sessions</span>
        <button type="button" class="mod-cli-chat__btn mod-cli-chat__btn--fit" @click="drawerOpen = false">Close</button>
      </div>
      <div class="mod-cli-chat__session-list">
        <p v-if="historyLoading" class="mod-cli-chat__empty">Loading sessions...</p>
        <p v-else-if="!sessions.length" class="mod-cli-chat__empty">No sessions yet</p>
        <button
          v-for="session in sessions"
          :key="session.sessionId"
          type="button"
          class="mod-cli-chat__session"
          :class="{ 'mod-cli-chat__session--active': session.sessionId === sessionId }"
          @click="resumeSession(session)"
        >
          <span class="mod-cli-chat__session-title">{{ session.title || session.prompt || session.sessionId }}</span>
          <span class="mod-cli-chat__session-meta">
            {{ session.model || 'default model' }} - {{ formatWhen(session.startedAt) }} - {{ session.status }}
          </span>
        </button>
      </div>
    </aside>
    <div class="mod-cli-chat__main">
      <header class="mod-cli-chat__toolbar">
        <span class="mod-cli-chat__brand">ModCLI</span>
        <span class="mod-cli-chat__dot" :class="dotClass"></span>
        <span class="mod-cli-chat__status">{{ statusLabel }}</span>
        <span class="mod-cli-chat__spacer"></span>
        <div
          v-for="gauge in usageGauges"
          :key="gauge.key"
          class="mod-cli-chat__gauge"
          :class="gauge.cls"
          :title="gauge.title"
        >
          <span class="mod-cli-chat__gauge-dial">
            <svg class="mod-cli-chat__gauge-ring" viewBox="0 0 28 28" aria-hidden="true">
              <circle class="mod-cli-chat__gauge-track" cx="14" cy="14" r="12"></circle>
              <circle
                v-if="gauge.pct !== null"
                class="mod-cli-chat__gauge-arc"
                cx="14"
                cy="14"
                r="12"
                :stroke-dasharray="GAUGE_CIRC"
                :stroke-dashoffset="GAUGE_CIRC * (1 - gauge.pct / 100)"
              ></circle>
            </svg>
            <span class="mod-cli-chat__gauge-pct">{{ gauge.pct !== null ? `${gauge.pct}%` : '-' }}</span>
          </span>
          <span class="mod-cli-chat__gauge-info">
            <span class="mod-cli-chat__gauge-label">{{ gauge.label }}</span>
            <span class="mod-cli-chat__gauge-value">{{ gauge.value }}</span>
            <span v-if="gauge.reset" class="mod-cli-chat__gauge-reset">{{ gauge.reset }}</span>
          </span>
        </div>
        <button type="button" class="mod-cli-chat__btn mod-cli-chat__btn--fit" :class="{ 'mod-cli-chat__btn--active': drawerOpen }" @click="drawerOpen = !drawerOpen">
          Sessions
        </button>
        <button type="button" class="mod-cli-chat__btn mod-cli-chat__btn--fit" :disabled="running" @click="newChat">New chat</button>
      </header>
      <div class="mod-cli-chat__settings">
        <label class="mod-cli-chat__field">
          <span class="mod-cli-chat__field-label">Provider</span>
          <input v-model="provider" list="cline-provider-options" :disabled="running" spellcheck="false" />
          <datalist id="cline-provider-options">
            <option v-for="option in providerOptions" :key="option" :value="option"></option>
          </datalist>
        </label>
        <label class="mod-cli-chat__field mod-cli-chat__field--grow">
          <span class="mod-cli-chat__field-label">Model</span>
          <input
            v-model="model"
            list="cline-model-options"
            placeholder="provider default"
            :disabled="running"
            spellcheck="false"
          />
          <datalist id="cline-model-options">
            <option v-for="option in modelOptions" :key="option" :value="option"></option>
          </datalist>
        </label>
        <label class="mod-cli-chat__field">
          <span class="mod-cli-chat__field-label">Reasoning effort</span>
          <select v-model="thinking" :disabled="running">
            <option v-for="option in THINKING_OPTIONS" :key="option" :value="option">
              {{ option === 'default' ? 'provider default' : option }}
            </option>
          </select>
        </label>
        <label class="mod-cli-chat__field">
          <span class="mod-cli-chat__field-label">Context limit (tokens)</span>
          <input
            v-model.number="contextLimit"
            type="number"
            min="0"
            step="1000"
            placeholder="off"
            :disabled="running"
            spellcheck="false"
          />
        </label>
        <label class="mod-cli-chat__field">
          <span class="mod-cli-chat__field-label">Day limit $</span>
          <input v-model.number="dailyLimit" type="number" min="0" step="0.5" placeholder="off" :disabled="running" spellcheck="false" />
        </label>
        <label class="mod-cli-chat__field">
          <span class="mod-cli-chat__field-label">Week limit $</span>
          <input v-model.number="weeklyLimit" type="number" min="0" step="0.5" placeholder="off" :disabled="running" spellcheck="false" />
        </label>
        <label class="mod-cli-chat__field">
          <span class="mod-cli-chat__field-label">Month limit $</span>
          <input v-model.number="monthlyLimit" type="number" min="0" step="0.5" placeholder="off" :disabled="running" spellcheck="false" />
        </label>
        <div class="mod-cli-chat__field">
          <span class="mod-cli-chat__field-label">Mode</span>
          <div class="mod-cli-chat__mode">
            <button type="button" class="mod-cli-chat__btn" :class="{ 'mod-cli-chat__btn--active': !planMode }" :disabled="running" @click="planMode = false">
              Act
            </button>
            <button type="button" class="mod-cli-chat__btn" :class="{ 'mod-cli-chat__btn--active': planMode }" :disabled="running" @click="planMode = true">
              Plan
            </button>
          </div>
        </div>
        <label class="mod-cli-chat__field mod-cli-chat__field--check">
          <input v-model="autoApprove" type="checkbox" :disabled="running" />
          <span class="mod-cli-chat__field-label">Auto-approve tools</span>
        </label>
      </div>
      <div ref="logElement" class="mod-cli-chat__log">
        <p v-if="!items.length" class="mod-cli-chat__empty">
          Start a task - the ModCLI bridge streams its context window here.
        </p>
        <template v-else v-for="item in items" :key="item.id">
          <p v-if="item.kind === 'user'" class="mod-cli-chat__msg mod-cli-chat__msg--user">{{ item.text }}</p>
          <p v-else-if="item.kind === 'assistant'" class="mod-cli-chat__msg">{{ item.text }}</p>
          <p v-else-if="item.kind === 'error'" class="mod-cli-chat__msg mod-cli-chat__msg--error">{{ item.text }}</p>
          <p v-else-if="item.kind === 'note'" class="mod-cli-chat__msg mod-cli-chat__msg--note">{{ item.text }}</p>
          <details
            v-else
            class="mod-cli-chat__msg"
            :class="item.kind === 'thinking' ? 'mod-cli-chat__msg--thinking' : 'mod-cli-chat__msg--event'"
            :open="item.open"
            @toggle="onToggle(item, $event)"
          >
            <summary class="mod-cli-chat__msg-summary">{{ item.kind === 'thinking' ? 'Thinking' : 'Event' }}</summary>
            <pre class="mod-cli-chat__msg-text">{{ item.text }}</pre>
          </details>
        </template>
      </div>
      <footer class="mod-cli-chat__composer">
        <textarea
          v-model="composer"
          class="mod-cli-chat__composer-input"
          rows="3"
          placeholder="Message ModCLI... (Enter to send, Shift+Enter for a newline)"
          @keydown.enter.exact.prevent="send"
        ></textarea>
        <div class="mod-cli-chat__composer-actions">
          <button v-if="running" type="button" class="mod-cli-chat__btn mod-cli-chat__btn--danger" @click="stopRun">Stop</button>
          <button v-else type="button" class="mod-cli-chat__btn mod-cli-chat__btn--fit" :disabled="!canSend" @click="send">Send</button>
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.mod-cli-chat {
  --mod-cli-bg-primary: #0d1012;
  --mod-cli-bg-secondary: #000;
  --mod-cli-bg-tertiary: #0c0e10;
  --mod-cli-text-primary: #9da1a7;
  --mod-cli-text-secondary: #6e7681;
  --mod-cli-border: #30363d;
  --mod-cli-accent: #1f6feb;
  --mod-cli-blue: #4493f8;
  --mod-cli-green: #0bb421;
  --mod-cli-gold: #d29922;
  --mod-cli-red: #dc2626;
  --mod-cli-radius-xs: 3px;
  --mod-cli-radius-sm: 6px;
  --mod-cli-radius-pill: 999px;
  --mod-cli-font-mono: Consolas, "JetBrains Mono", "Fira Code", "Courier New", Monaco, monospace;
  --mod-cli-font-md: 14px;
  --mod-cli-font-sm: 12px;
  --mod-cli-font-xs: 10px;
  --mod-cli-gap-xxs: 2px;
  --mod-cli-gap-xs: 4px;
  --mod-cli-gap-sm: 8px;
  --mod-cli-gap-md: 16px;
  --mod-cli-ease: cubic-bezier(0.16, 1, 0.3, 1);
  --mod-cli-fast: 0.15s;
  display: flex;
  height: 100%;
  min-height: 0;
  color-scheme: dark;
  background: var(--mod-cli-bg-primary);
  color: var(--mod-cli-text-primary);
  font-family: var(--mod-cli-font-mono);
  font-size: var(--mod-cli-font-sm);
  letter-spacing: 0.3px;
  line-height: 1.5;
}

.mod-cli-chat p,
.mod-cli-chat pre {
  margin: 0;
}

.mod-cli-chat__btn,
.mod-cli-chat button {
  font-family: inherit;
  cursor: pointer;
  border: 1px solid var(--mod-cli-border);
  background: var(--mod-cli-bg-tertiary);
  padding: var(--mod-cli-gap-sm) var(--mod-cli-gap-md);
  letter-spacing: 0.8px;
  font-weight: 500;
  border-radius: var(--mod-cli-radius-sm);
  transition: border-color var(--mod-cli-fast) var(--mod-cli-ease);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--mod-cli-gap-xs);
  line-height: 1;
  color: var(--mod-cli-text-primary);
  font-size: var(--mod-cli-font-xs);
  min-height: 35px;
}

.mod-cli-chat button:hover {
  border-color: var(--mod-cli-accent);
  background: var(--mod-cli-bg-secondary);
}

.mod-cli-chat button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.mod-cli-chat button:focus-visible {
  outline: 2px solid var(--mod-cli-accent);
  outline-offset: 2px;
}

.mod-cli-chat input,
.mod-cli-chat select,
.mod-cli-chat textarea {
  font-family: inherit;
  background: var(--mod-cli-bg-primary);
  border: 1px solid var(--mod-cli-border);
  color: var(--mod-cli-text-primary);
  padding: var(--mod-cli-gap-sm) var(--mod-cli-gap-sm);
  border-radius: var(--mod-cli-radius-sm);
  transition: border-color var(--mod-cli-fast) var(--mod-cli-ease);
}

.mod-cli-chat input {
  field-sizing: content;
  min-width: 5ch;
}

.mod-cli-chat select,
.mod-cli-chat textarea {
  width: 100%;
}

.mod-cli-chat input:focus,
.mod-cli-chat select:focus,
.mod-cli-chat textarea:focus {
  outline: none;
  border-color: var(--mod-cli-accent);
}

.mod-cli-chat input:disabled,
.mod-cli-chat select:disabled,
.mod-cli-chat textarea:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.mod-cli-chat select {
  appearance: none;
  cursor: pointer;
  padding-right: var(--mod-cli-gap-md);
}

.mod-cli-chat input[type="checkbox"] {
  width: auto;
  min-width: 0;
  padding: 0;
  accent-color: var(--mod-cli-accent);
  cursor: pointer;
}

.mod-cli-chat label {
  font-size: var(--mod-cli-font-xs);
  letter-spacing: 0.5px;
  font-weight: 500;
  white-space: nowrap;
}

.mod-cli-chat option,
.mod-cli-chat optgroup {
  font-family: inherit;
  background: var(--mod-cli-bg-secondary);
  color: var(--mod-cli-text-primary);
}

.mod-cli-chat__btn--fit {
  width: fit-content;
}

.mod-cli-chat__btn--active,
.mod-cli-chat__btn--active:hover,
.mod-cli-chat__btn--active:active {
  border-color: var(--mod-cli-blue);
  color: var(--mod-cli-blue);
}

.mod-cli-chat__btn--danger {
  border-color: var(--mod-cli-red);
  color: var(--mod-cli-red);
}

.mod-cli-chat__btn--danger:hover,
.mod-cli-chat__btn--danger:active {
  border-color: var(--mod-cli-red);
  background: var(--mod-cli-red);
  color: #fff;
}

.mod-cli-chat__empty {
  color: var(--mod-cli-text-secondary);
  text-align: center;
}

.mod-cli-chat__session--active,
.mod-cli-chat__session--active:hover,
.mod-cli-chat__session--active:active {
  border-color: var(--mod-cli-blue);
  color: var(--mod-cli-blue);
}

.mod-cli-chat__sidebar {
  display: flex;
  flex-direction: column;
  width: 260px;
  min-height: 0;
  flex-shrink: 0;
  background: var(--mod-cli-bg-secondary);
  border-right: 1px solid var(--mod-cli-border);
}

.mod-cli-chat__sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mod-cli-gap-sm);
  padding: var(--mod-cli-gap-sm) var(--mod-cli-gap-md);
  border-bottom: 1px solid var(--mod-cli-border);
}

.mod-cli-chat__sidebar-title {
  font-size: var(--mod-cli-font-sm);
  font-weight: 600;
  letter-spacing: 0.5px;
}

.mod-cli-chat__session-list {
  display: flex;
  flex-direction: column;
  gap: var(--mod-cli-gap-xs);
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--mod-cli-gap-sm);
}

.mod-cli-chat__session {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--mod-cli-gap-xxs);
  width: 100%;
  text-align: left;
}

.mod-cli-chat__session-title {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--mod-cli-font-xs);
}

.mod-cli-chat__session-meta {
  font-size: var(--mod-cli-font-xs);
  color: var(--mod-cli-text-secondary);
}

.mod-cli-chat__main {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  min-height: 0;
}

.mod-cli-chat__toolbar {
  display: flex;
  align-items: center;
  gap: var(--mod-cli-gap-sm);
  padding: var(--mod-cli-gap-sm) var(--mod-cli-gap-md);
  border-bottom: 1px solid var(--mod-cli-border);
}

.mod-cli-chat__brand {
  font-size: var(--mod-cli-font-md);
  font-weight: 600;
  letter-spacing: 1px;
}

.mod-cli-chat__dot {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: var(--mod-cli-radius-pill);
  background: var(--mod-cli-green);
}

.mod-cli-chat__dot--run {
  background: var(--mod-cli-gold);
}

.mod-cli-chat__dot--err {
  background: var(--mod-cli-red);
}

.mod-cli-chat__status {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--mod-cli-font-xs);
  color: var(--mod-cli-text-secondary);
}

.mod-cli-chat__gauge {
  display: flex;
  align-items: center;
  gap: var(--mod-cli-gap-xs);
  flex-shrink: 0;
  font-size: var(--mod-cli-font-xs);
  color: var(--mod-cli-text-secondary);
}

.mod-cli-chat__gauge-dial {
  position: relative;
  display: block;
  width: 30px;
  height: 30px;
}

.mod-cli-chat__gauge-ring {
  display: block;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.mod-cli-chat__gauge-track {
  fill: none;
  stroke: var(--mod-cli-border);
  stroke-width: 3;
}

.mod-cli-chat__gauge-arc {
  fill: none;
  stroke: var(--mod-cli-green);
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.4s ease;
}

.mod-cli-chat__gauge-pct {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  line-height: 1;
  color: var(--mod-cli-text-primary);
}

.mod-cli-chat__gauge-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  line-height: 1.2;
}

.mod-cli-chat__gauge-label {
  white-space: nowrap;
}

.mod-cli-chat__gauge-value {
  white-space: nowrap;
  color: var(--mod-cli-text-primary);
}

.mod-cli-chat__gauge-reset {
  white-space: nowrap;
  font-size: 9px;
}

.mod-cli-chat__gauge--warn {
  color: var(--mod-cli-gold);
}

.mod-cli-chat__gauge--warn .mod-cli-chat__gauge-arc {
  stroke: var(--mod-cli-gold);
}

.mod-cli-chat__gauge--danger {
  color: var(--mod-cli-red);
}

.mod-cli-chat__gauge--danger .mod-cli-chat__gauge-arc {
  stroke: var(--mod-cli-red);
}

.mod-cli-chat__spacer {
  flex: 1;
}

.mod-cli-chat__settings {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--mod-cli-gap-sm);
  padding: var(--mod-cli-gap-sm) var(--mod-cli-gap-md);
  border-bottom: 1px solid var(--mod-cli-border);
}

.mod-cli-chat__field {
  display: flex;
  flex-direction: column;
  gap: var(--mod-cli-gap-xxs);
}

.mod-cli-chat__field--grow {
  flex: 1;
  min-width: 160px;
}

.mod-cli-chat__field--check {
  flex-direction: row;
  align-items: center;
  gap: var(--mod-cli-gap-xs);
  padding-bottom: var(--mod-cli-gap-xs);
}

.mod-cli-chat__field-label {
  font-size: var(--mod-cli-font-xs);
  color: var(--mod-cli-text-secondary);
}

.mod-cli-chat__mode {
  display: flex;
  gap: var(--mod-cli-gap-xxs);
}

.mod-cli-chat__log {
  display: flex;
  flex-direction: column;
  gap: var(--mod-cli-gap-sm);
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--mod-cli-gap-md);
}

.mod-cli-chat__msg {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: var(--mod-cli-font-sm);
  line-height: 1.5;
}

.mod-cli-chat__msg--user {
  padding-left: var(--mod-cli-gap-sm);
  border-left: 2px solid var(--mod-cli-blue);
}

.mod-cli-chat__msg--error {
  color: var(--mod-cli-red);
}

.mod-cli-chat__msg--note {
  font-size: var(--mod-cli-font-xs);
  color: var(--mod-cli-text-secondary);
}

.mod-cli-chat__msg--thinking,
.mod-cli-chat__msg--event {
  color: var(--mod-cli-text-secondary);
}

.mod-cli-chat__msg-summary {
  cursor: pointer;
  user-select: none;
  font-size: var(--mod-cli-font-xs);
  color: var(--mod-cli-text-secondary);
}

.mod-cli-chat__msg-text {
  margin-top: var(--mod-cli-gap-xxs);
  font-family: inherit;
  font-size: var(--mod-cli-font-xs);
  white-space: pre-wrap;
  word-break: break-word;
}

.mod-cli-chat__composer {
  display: flex;
  align-items: flex-end;
  gap: var(--mod-cli-gap-sm);
  padding: var(--mod-cli-gap-sm) var(--mod-cli-gap-md);
  border-top: 1px solid var(--mod-cli-border);
}

.mod-cli-chat__composer-input {
  flex: 1;
  min-width: 0;
  min-height: 60px;
  resize: none;
}

.mod-cli-chat__composer-actions {
  display: flex;
  gap: var(--mod-cli-gap-xs);
}
</style>
