<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import {
  answerModCliPermission,
  clearModCliSessions,
  deleteModCliSession,
  fetchModCliConfig,
  fetchModCliHistory,
  fetchModCliModelInfo,
  fetchModCliModels,
  stopModCliRun,
  streamModCliRun,
  testModCliConnection,
  type ModCliConfigOption,
  type ModCliModelEntry,
  type ModCliPermissionOption,
  type ModCliSessionSummary,
  type ModCliStreamLine,
  type ModCliThinking,
} from './modCliBridge'
import { isQuestionCard, resolveAgentState, type AgentState, type AgentStateItem } from './agentState'

// UI-only fields extend the shared agent-state item so the chip's decision
// table and the transcript never drift apart on shape.
interface ChatItem extends AgentStateItem {
  id: number
  kind: 'user' | 'assistant' | 'thinking' | 'event' | 'error' | 'note' | 'tool' | 'permission'
  text: string
  open: boolean
  permissionId?: string
  permOptions?: ModCliPermissionOption[]
}

interface StoredSettings {
  provider?: unknown
  apiKey?: unknown
  model?: unknown
  providerAccount?: unknown
  lastTest?: unknown
  thinking?: unknown
  planMode?: unknown
  autoApprove?: unknown
  presets?: unknown
  defaultPreset?: unknown
}

interface TodoItem {
  id: number
  text: string
  done: boolean
}

interface StoredTodos {
  sessionId?: unknown
  items?: unknown
}

interface PresetEntry {
  name: string
  providerAccount: string
  model: string
  thinking: ModCliThinking
}

type ConnState = 'idle' | 'testing' | 'ok' | 'error'

const props = defineProps<{ initialProvider?: string }>()

interface ConnectionTest {
  ok: boolean
  version: string
  at: number
  provider: string
  model: string
  keyTail: string
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
const TODO_KEY = 'cline-chat-todos-v1'
const THINKING_OPTIONS: ModCliThinking[] = ['default', 'none', 'low', 'medium', 'high', 'xhigh']
const SAMPLE_PROMPTS: string[] = [
  'Explain what this project does',
  'List the riskiest code in this project',
  'Summarize the recent changes here',
]

const provider = ref(props.initialProvider?.trim() || 'cline')
const apiKey = ref('')
const model = ref('')
const providerAccount = ref('')
const thinking = ref<ModCliThinking>('default')
const planMode = ref(false)
const autoApprove = ref(true)
const presets = ref<PresetEntry[]>([])
const defaultPreset = ref('')
const selectedPreset = ref('')
const presetName = ref('')
const contextUsed = ref<number | null>(null)
const contextOut = ref<number | null>(null)
const contextWindow = ref<number | null>(null)
const contextExceeded = ref(false)
const usageRecords = ref<UsageRecord[]>([])
const liveCost = ref(0)
const liveCommitted = ref(false)
const sessionId = ref('')
const items = ref<ChatItem[]>([])
const composer = ref('')
const running = ref(false)
const runId = ref('')
const usageLabel = ref('')
const statusText = ref('')
const configAvailable = ref<boolean | null>(null)
const modCliVersion = ref('')
const configProviders = ref<Record<string, { available: boolean; version: string | null }>>({})
const drawerOpen = ref(false)
const settingsOpen = ref(false)
const connState = ref<ConnState>('idle')
const connMessage = ref('')
const lastTest = ref<ConnectionTest | null>(null)
const boundProvider = ref('')
const boundModel = ref('')
const boundProviderAccount = ref('')
const boundThinking = ref<ModCliThinking>('default')
const historyLoading = ref(false)
const clearing = ref(false)
const sessions = ref<ModCliSessionSummary[]>([])
const todos = ref<TodoItem[]>([])
const todoText = ref('')
const todoOpen = ref(false)
const todoSession = ref('')
const cliModels = ref<ModCliModelEntry[]>([])
const cliProviderOption = ref<ModCliConfigOption | null>(null)
const logElement = ref<HTMLElement | null>(null)
const composerInput = ref<HTMLTextAreaElement | null>(null)
const stickToBottom = ref(true)
const showJump = ref(false)

let itemSeq = 0
let todoSeq = 0
let abortController: AbortController | null = null
let activeAssistant: ChatItem | null = null
let activeThinking: ChatItem | null = null
let assistantSeen = false
let usageEventSeen = false
let runResultUsageSeen = false
let sawRunResult = false

const pushItem = (kind: ChatItem['kind'], text: string, open = false): ChatItem => {
  const item: ChatItem = { id: itemSeq++, kind, text, open }
  items.value.push(item)
  return item
}

const appendItem = (item: ChatItem | null, kind: ChatItem['kind'], text: string): ChatItem => {
  if (item) {
    // Streamed chunks are arbitrary splits of one continuous text - joining
    // with a newline turned every fragment into its own short line. Concatenate
    // directly; real newlines arrive inside the chunk text and are kept.
    item.text = `${item.text}${text}`
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

const formatTokens = (value: number): string => {
  if (value >= 1000000) {
    const text = (value / 1000000).toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
    return `${text}M`
  }
  return value >= 10000 ? `${Math.round(value / 1000)}k` : value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value)
}

const ctxWindowPct = computed(() => {
  const window = contextWindow.value ?? 0
  const used = contextUsed.value ?? 0
  if (!window || used <= 0) return null
  return Math.min(100, Math.round((used / window) * 100))
})

const ctxTone = computed(() => {
  if (contextExceeded.value) return 'danger'
  if (ctxWindowPct.value !== null && ctxWindowPct.value >= 90) return 'danger'
  if (ctxWindowPct.value !== null && ctxWindowPct.value >= 70) return 'warn'
  return ''
})

const ctxTitle = computed(() => {
  const used = contextUsed.value === null ? 0 : contextUsed.value
  const out = contextOut.value === null ? 0 : contextOut.value
  const window = contextWindow.value ?? 0
  const parts = [`Session tokens - in ${used.toLocaleString()} / out ${out.toLocaleString()}`]
  if (window > 0) parts.push(`${ctxWindowPct.value ?? 0}% of ${window.toLocaleString()} window`)
  if (contextExceeded.value) parts.push('Context window exceeded on last run')
  return parts.join(' - ')
})

const ctxHasData = computed(() => contextUsed.value !== null)

const ctxInPct = computed(() => {
  const used = contextUsed.value ?? 0
  const out = contextOut.value ?? 0
  const total = used + out
  if (total <= 0) return 0
  return Math.min(100, Math.round((used / total) * 100))
})

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

const saveTodos = (): void => {
  try {
    localStorage.setItem(TODO_KEY, JSON.stringify({ sessionId: todoSession.value, items: todos.value }))
  } catch { /* storage full or unavailable */ }
}

const loadTodos = (): void => {
  try {
    const raw = localStorage.getItem(TODO_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as StoredTodos
    if (typeof parsed.sessionId === 'string') todoSession.value = parsed.sessionId
    if (!Array.isArray(parsed.items)) return
    for (const item of parsed.items) {
      if (typeof item !== 'object' || item === null) continue
      const rec = item as Record<string, unknown>
      const text = typeof rec.text === 'string' ? rec.text.trim() : ''
      if (!text) continue
      const id = typeof rec.id === 'number' && Number.isFinite(rec.id) ? rec.id : todoSeq
      if (id >= todoSeq) todoSeq = id + 1
      todos.value.push({ id, text, done: rec.done === true })
    }
  } catch {
    localStorage.removeItem(TODO_KEY)
  }
}

const addTodo = (): void => {
  const text = todoText.value.trim()
  if (!text) return
  todos.value.push({ id: todoSeq++, text, done: false })
  todoText.value = ''
  saveTodos()
}

const removeTodo = (todo: TodoItem): void => {
  todos.value = todos.value.filter((item) => item.id !== todo.id)
  saveTodos()
}

const clearDoneTodos = (): void => {
  todos.value = todos.value.filter((item) => !item.done)
  saveTodos()
}

const bindTodoSession = (session: string): void => {
  if (!session || todoSession.value === session) return
  todoSession.value = session
  saveTodos()
}

const useTodosAsPrompt = (): void => {
  if (running.value) return
  const open = todos.value.filter((item) => !item.done)
  if (!open.length) return
  composer.value = ['TODO:', ...open.map((item) => `- [ ] ${item.text}`)].join('\n')
  void nextTick(() => composerInput.value?.focus())
}

const openTodoCount = computed(() => todos.value.filter((item) => !item.done).length)

const todoScope = computed(() => (todoSession.value ? `session ${todoSession.value.slice(-8)}` : 'saved in this browser'))

interface UsageGauge {
  key: string
  label: string
  value: string
  tone: string
  title: string
  reset: string
}

const usageGauges = computed<UsageGauge[]>(() => [
  {
    key: 'ctx',
    label: 'ctx',
    value:
      contextUsed.value === null
        ? '-'
        : (contextWindow.value ?? 0) > 0
          ? `${formatTokens(contextUsed.value)} / ${formatTokens(contextWindow.value ?? 0)}`
          : formatTokens(contextUsed.value),
    tone: ctxTone.value,
    title: ctxTitle.value,
    reset: '',
  },
])

const refreshWindow = async (): Promise<void> => {
  const wantedProvider = provider.value.trim()
  const wantedModel = model.value.trim()
  if (!wantedProvider || !wantedModel) {
    contextWindow.value = null
    return
  }
  try {
    const info = await fetchModCliModelInfo(wantedProvider, wantedModel)
    if (provider.value.trim() !== wantedProvider || model.value.trim() !== wantedModel) return
    contextWindow.value = typeof info.contextWindow === 'number' && info.contextWindow > 0 ? info.contextWindow : null
  } catch {
    if (provider.value.trim() === wantedProvider && model.value.trim() === wantedModel) contextWindow.value = null
  }
}

const activeConfig = computed(() => {
  const key = provider.value.trim() || 'cline'
  const mapped = configProviders.value[key]
  if (mapped) return mapped
  return key === 'cline' ? { available: configAvailable.value !== false, version: modCliVersion.value } : { available: false, version: '' }
})

const statusLabel = computed(() => {
  if (running.value) return usageLabel.value || 'Running'
  if (!activeConfig.value.available) return `${provider.value.trim() || 'cline'} CLI unavailable`
  if (statusText.value) return statusText.value
  return activeConfig.value.version ? `Idle - v${activeConfig.value.version}` : 'Idle'
})

const dotState = computed(() => {
  if (running.value) return 'run'
  if (!activeConfig.value.available) return 'err'
  return 'idle'
})

// Live agent state for the toolbar chip, derived only from what the wire
// already reports (permission cards, streamed items, tool kinds, plan mode) -
// no new bridge signal. The decision table lives in agentState.ts as a pure
// function so it can be sim-tested without mounting the component.
const agentState = computed<AgentState>(() => resolveAgentState(running.value, planMode.value, items.value))

const AGENT_STATE_LABELS: Record<AgentState, string> = {
  idle: 'Idle',
  asking: 'Asking',
  questioning: 'Questioning',
  thinking: 'Thinking',
  planning: 'Planning',
  tasking: 'Tasking',
}

const agentStateLabel = computed(() => AGENT_STATE_LABELS[agentState.value])

const agentStateHint = computed(() => {
  switch (agentState.value) {
    case 'asking':
      return 'Waiting for your approval - answer the card in the chat.'
    case 'questioning':
      return 'The agent asked a question - answer it in the chat.'
    case 'thinking':
      return 'Streaming reasoning.'
    case 'planning':
      return 'Plan mode - the agent drafts a plan before touching anything.'
    case 'tasking':
      return 'Executing the task.'
    default:
      return 'Ready for the next prompt.'
  }
})

// A session only exists after the first message, and cline stores no title of
// its own - the label is the short id plus whatever the CLI history named it.
const sessionLabel = computed(() => {
  const id = sessionId.value
  if (!id) return ''
  const title = sessions.value.find((item) => item.sessionId === id)?.title?.trim()
  if (!title) return `session ${id.slice(-8)}`
  const short = title.length > 40 ? `${title.slice(0, 39).trimEnd()}...` : title
  return `session ${id.slice(-8)} - ${short}`
})

const sessionTooltip = computed(() => {
  const id = sessionId.value
  if (!id) return ''
  const title = sessions.value.find((item) => item.sessionId === id)?.title?.trim()
  return title ? `${id} - ${title}` : id
})

const canSend = computed(() => !running.value && activeConfig.value.available && composer.value.trim().length > 0)

// Strictly the selected provider's own list. A model offered from another
// auth/billing provider is exactly what makes the CLI answer with an empty turn,
// so the session history is never merged back in here.
const modelOptions = computed(() => {
  const found = new Set<string>()
  if (model.value.trim()) found.add(model.value.trim())
  for (const entry of cliModels.value) found.add(entry.id)
  return [...found]
})

const providerAccountOptions = computed(() => cliProviderOption.value?.options ?? [])

const refreshModels = async (): Promise<void> => {
  const wanted = provider.value.trim()
  const wantedAccount = providerAccount.value.trim()
  if (!wanted) {
    cliModels.value = []
    cliProviderOption.value = null
    return
  }
  try {
    const result = await fetchModCliModels(wanted, wantedAccount || undefined)
    if (provider.value.trim() !== wanted || providerAccount.value.trim() !== wantedAccount) return
    cliModels.value = result.models
    cliProviderOption.value = result.providerOption
    // A model left over from another auth/billing provider is absent from this
    // list, and the CLI would silently fall back to its own default - so drop it
    // and say why, instead of offering a choice that cannot run.
    const chosen = model.value.trim()
    if (result.models.length && chosen && !result.models.some((entry) => entry.id === chosen)) {
      model.value = ''
      pushItem('note', `${chosen} is not offered by ${wantedAccount || 'the CLI default provider'} - reset to its default model.`)
    }
    if (!model.value.trim() && result.currentModel) model.value = result.currentModel
  } catch {
    if (provider.value.trim() === wanted && providerAccount.value.trim() === wantedAccount) {
      cliModels.value = []
      cliProviderOption.value = null
    }
  }
}

// The auth/billing provider owns its own model list, so a change refetches and
// drops the model with it - the CLI answers with an empty turn otherwise.
watch(providerAccount, () => {
  model.value = ''
  void refreshModels()
  void refreshWindow()
})

const selectedModelEntry = computed(() => cliModels.value.find((entry) => entry.id === model.value.trim()) ?? null)

// Reasoning effort is a per-model capability in the CLI's own catalog. The ACP
// wire has no reasoning config option, so the chosen level travels as a spawn
// flag and only the model's own levels are offered.
const reasoningChoices = computed<string[]>(() => {
  const entry = selectedModelEntry.value
  return entry ? ['default', ...entry.reasoning] : [...THINKING_OPTIONS]
})

const reasoningHint = computed(() => {
  const entry = selectedModelEntry.value
  if (!entry) return ''
  if (!entry.reasoning.length) return 'This model exposes no reasoning effort - the provider default applies.'
  return `Supported here: ${entry.reasoning.join(', ')}.`
})

const isNearBottom = (): boolean => {
  const log = logElement.value
  if (!log) return true
  return log.scrollHeight - log.scrollTop - log.clientHeight <= 96
}

const onLogScroll = (): void => {
  const log = logElement.value
  stickToBottom.value = isNearBottom()
  showJump.value = !!log && log.scrollHeight - log.scrollTop - log.clientHeight > 160
}

const scrollToLatest = (): void => {
  stickToBottom.value = true
  void nextTick(() => {
    const log = logElement.value
    if (log) log.scrollTop = log.scrollHeight
  })
}

watch(
  items,
  () => {
    // A run streams many chunks - only follow the tail while the reader is
    // already near it, so reading back up is never yanked away mid-run.
    if (!stickToBottom.value) return
    void nextTick(() => {
      const log = logElement.value
      if (log) log.scrollTop = log.scrollHeight
    })
  },
  { deep: true },
)

// One turn = a user prompt plus everything the agent streamed back for it.
// Notes pushed before the first prompt have no turn of their own yet and ride
// along as a leaderless turn so nothing is dropped from the transcript.
interface ChatTurn {
  id: number
  prompt: ChatItem | null
  replies: ChatItem[]
}

const chatTurns = computed<ChatTurn[]>(() => {
  const turns: ChatTurn[] = []
  let current: ChatTurn | null = null
  for (const item of items.value) {
    if (item.kind === 'user') {
      current = { id: item.id, prompt: item, replies: [] }
      turns.push(current)
    } else {
      if (!current) {
        current = { id: item.id, prompt: null, replies: [] }
        turns.push(current)
      }
      current.replies.push(item)
    }
  }
  return turns
})

const composerCount = computed(() => composer.value.length)

const growComposer = (): void => {
  const el = composerInput.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 240)}px`
}

watch(composer, () => {
  void nextTick(growComposer)
})

const saveSettings = (): void => {
  try {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        provider: provider.value,
        apiKey: apiKey.value,
        model: model.value,
        providerAccount: providerAccount.value,
        lastTest: lastTest.value,
        thinking: thinking.value,
        planMode: planMode.value,
        autoApprove: autoApprove.value,
        presets: presets.value,
        defaultPreset: defaultPreset.value,
      }),
    )
  } catch { /* storage full or unavailable - settings stay in memory */ }
}

// Persist every settings change immediately - a change followed by a page
// refresh must survive without requiring a run or a connection test first.
watch([provider, apiKey, model, providerAccount, thinking, planMode, autoApprove, presets, defaultPreset], () => {
  saveSettings()
})

// Presets: named provider + model + reasoning bundles saved with the other
// settings. The default preset re-applies on load, so every visit starts with
// the marked run configuration without touching the CLI's own sign-in.
const savePreset = (): void => {
  if (running.value) return
  const name = presetName.value.trim()
  if (!name) return
  const entry: PresetEntry = {
    name,
    providerAccount: providerAccount.value.trim(),
    model: model.value.trim(),
    thinking: thinking.value,
  }
  const existing = presets.value.findIndex((preset) => preset.name === name)
  presets.value = existing >= 0 ? presets.value.map((preset, i) => (i === existing ? entry : preset)) : [...presets.value, entry]
  selectedPreset.value = name
}

// Provider account first (its own watch refetches the model list), then model
// on the next tick so that watch's reset cannot wipe the preset's model.
const applyPreset = (name: string): void => {
  if (running.value) return
  const preset = presets.value.find((item) => item.name === name)
  if (!preset) return
  providerAccount.value = preset.providerAccount
  thinking.value = preset.thinking
  void nextTick(() => {
    model.value = preset.model
  })
}

watch(selectedPreset, (name) => {
  if (name) applyPreset(name)
})

const setDefaultPreset = (): void => {
  if (running.value || !selectedPreset.value) return
  defaultPreset.value = selectedPreset.value
}

const deletePreset = (): void => {
  if (running.value || !selectedPreset.value) return
  presets.value = presets.value.filter((preset) => preset.name !== selectedPreset.value)
  if (defaultPreset.value === selectedPreset.value) defaultPreset.value = ''
  selectedPreset.value = ''
}

const bindSession = (): void => {
  boundProvider.value = provider.value.trim()
  boundModel.value = model.value.trim()
  boundProviderAccount.value = providerAccount.value.trim()
  boundThinking.value = thinking.value
}

const loadSettings = (): void => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as StoredSettings
    if (!props.initialProvider?.trim() && typeof parsed.provider === 'string' && parsed.provider) provider.value = parsed.provider
    if (typeof parsed.apiKey === 'string') apiKey.value = parsed.apiKey
    if (typeof parsed.model === 'string') model.value = parsed.model
    if (typeof parsed.providerAccount === 'string') providerAccount.value = parsed.providerAccount
    if (parsed.lastTest && typeof parsed.lastTest === 'object') {
      const raw = parsed.lastTest as Record<string, unknown>
      if (
        typeof raw.ok === 'boolean' &&
        typeof raw.version === 'string' &&
        typeof raw.at === 'number' &&
        Number.isFinite(raw.at) &&
        typeof raw.provider === 'string' &&
        typeof raw.model === 'string' &&
        typeof raw.keyTail === 'string'
      ) {
        lastTest.value = { ok: raw.ok, version: raw.version, at: raw.at, provider: raw.provider, model: raw.model, keyTail: raw.keyTail }
      }
    }
    if (typeof parsed.thinking === 'string' && THINKING_OPTIONS.includes(parsed.thinking as ModCliThinking)) {
      thinking.value = parsed.thinking as ModCliThinking
    }
    if (typeof parsed.planMode === 'boolean') planMode.value = parsed.planMode
    if (typeof parsed.autoApprove === 'boolean') autoApprove.value = parsed.autoApprove
    if (Array.isArray(parsed.presets)) {
      const loaded: PresetEntry[] = []
      for (const item of parsed.presets) {
        if (typeof item !== 'object' || item === null) continue
        const rec = item as Record<string, unknown>
        const name = typeof rec.name === 'string' ? rec.name.trim() : ''
        if (!name) continue
        loaded.push({
          name,
          providerAccount: typeof rec.providerAccount === 'string' ? rec.providerAccount : '',
          model: typeof rec.model === 'string' ? rec.model : '',
          thinking:
            typeof rec.thinking === 'string' && THINKING_OPTIONS.includes(rec.thinking as ModCliThinking)
              ? (rec.thinking as ModCliThinking)
              : 'default',
        })
      }
      presets.value = loaded
    }
    if (typeof parsed.defaultPreset === 'string' && presets.value.some((preset) => preset.name === parsed.defaultPreset)) {
      defaultPreset.value = parsed.defaultPreset
    }
  } catch {
    localStorage.removeItem(SETTINGS_KEY)
  }
}

const applyStreamLine = (line: ModCliStreamLine): void => {
  if (line.type === 'bridge') {
    if (line.event === 'start') runId.value = line.runId ?? ''
    else if (line.event === 'session' && line.sessionId) {
      sessionId.value = line.sessionId
      bindSession()
      bindTodoSession(line.sessionId)
    }
    else if (line.event === 'permission' && line.permissionId) {
      const item = pushItem('permission', line.title || 'Permission needed', true)
      item.permissionId = line.permissionId
      item.permOptions = line.options ?? []
      item.answered = null
      item.toolCallId = line.toolCallId
    }
    else if (line.event === 'exit') {
      const code = line.code ?? 0
      if (code !== 0) {
        pushItem('error', `ModCLI exited with code ${code}${line.stderr ? `: ${line.stderr.trim()}` : ''}`)
      }
      for (const item of items.value) {
        if (item.kind === 'permission' && item.answered === null) item.answered = 'cancelled'
      }
      if (!liveCommitted.value) commitUsage(liveCost.value)
      statusText.value = code === 0 ? 'Idle' : `Exited (${code})`
      usageLabel.value = ''
    }
    return
  }
  if (line.type === 'run_result') {
    sawRunResult = true
    const usage = line.aggregateUsage ?? line.usage
    const usedTokens = toNumber(usage?.inputTokens) + toNumber(usage?.cacheReadTokens) + toNumber(usage?.cacheWriteTokens)
    // The ACP wire may report all-zero usage (cline's carries none) - only treat
    // run_result as the usage source when it actually carries numbers, so the
    // history fallback still fills the gauge after the run.
    if (usage && (usedTokens > 0 || toNumber(usage?.totalCost) > 0)) {
      runResultUsageSeen = true
      usageLabel.value = formatUsage(usage.inputTokens, usage.outputTokens, usage.totalCost)
    }
    commitUsage(
      toNumber(usage?.totalCost) || liveCost.value,
      toNumber(usage?.inputTokens),
      toNumber(usage?.outputTokens),
    )
    if (!usageEventSeen) {
      const used = toNumber(usage?.inputTokens)
      if (used > 0) contextUsed.value = used
      const out = toNumber(usage?.outputTokens)
      if (out > 0 || used > 0) contextOut.value = out
    }
    if (line.finishReason === 'context_window_exceeded') contextExceeded.value = true
    const appliedModel = typeof line.model?.id === 'string' ? line.model.id : ''
    const appliedProvider = typeof line.model?.provider === 'string' ? line.model.provider : ''
    if (!assistantSeen) {
      // Some agents (cline's ACP wire) stream only thought blocks and never a
      // message chunk - surface the last thinking item instead. A run with no
      // content at all is the CLI's own empty turn (a model that does not belong
      // to the active provider) and must not pass as a silent success.
      const lastThinking = [...items.value].reverse().find((item) => item.kind === 'thinking')
      if (lastThinking) lastThinking.open = true
      else
        pushItem(
          'error',
          `The agent returned no reply for ${appliedModel || 'this model'}${
            appliedProvider ? ` under ${appliedProvider}` : ''
          }. The CLI answers with an empty turn when the model does not belong to the active provider - pick a model from this provider's list.`,
        )
    }
    statusText.value = `${appliedProvider ? `${appliedProvider} / ` : ''}${appliedModel || 'model'} - ${line.finishReason ?? 'done'} (${
      line.durationMs ?? 0
    }ms)`
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
    case 'tool_call': {
      const toolCallId = typeof event.toolCallId === 'string' ? event.toolCallId : ''
      if (!toolCallId) break
      const title = typeof event.title === 'string' ? event.title : ''
      const status = typeof event.status === 'string' ? event.status : ''
      const kind = typeof event.kind === 'string' ? event.kind : ''
      const existing = [...items.value].reverse().find((item) => item.kind === 'tool' && item.toolCallId === toolCallId)
      if (existing) {
        if (title) existing.text = title
        existing.toolStatus = status
      } else {
        const item = pushItem('tool', title)
        item.toolCallId = toolCallId
        item.toolStatus = status
        item.toolKind = kind
      }
      break
    }
    case 'usage':
      usageLabel.value = formatUsage(event.inputTokens, event.outputTokens, toNumber(event.totalCost) || toNumber(event.cost))
      usageEventSeen = true
      liveCost.value = toNumber(event.totalCost) || toNumber(event.cost)
      {
        const used = toNumber(event.inputTokens) + toNumber(event.cacheReadTokens) + toNumber(event.cacheWriteTokens)
        if (used > 0) contextUsed.value = used
        contextOut.value = toNumber(event.outputTokens)
        const windowHint = toNumber(event.contextWindow)
        if (windowHint > 0 && contextWindow.value === null) contextWindow.value = windowHint
      }
      break
    case 'note':
      pushItem('note', typeof event.text === 'string' ? event.text : '')
      break
    case 'error':
      pushItem('error', typeof event.message === 'string' ? event.message : 'The agent failed')
      break
    case 'iteration_start':
    case 'iteration_end':
      activeAssistant = null
      activeThinking = null
      break
    case 'plan':
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

const applySessionUsage = (): void => {
  const current = sessions.value.find((session) => session.sessionId === sessionId.value)
  const usage = current?.usage
  if (!sessionId.value || !usage || usageEventSeen || runResultUsageSeen || liveCommitted.value) return
  const used = toNumber(usage.inputTokens) + toNumber(usage.cacheReadTokens) + toNumber(usage.cacheWriteTokens)
  if (used > 0) contextUsed.value = used
  contextOut.value = toNumber(usage.outputTokens)
  usageLabel.value = formatUsage(usage.inputTokens, usage.outputTokens, usage.totalCost)
  commitUsage(toNumber(usage.totalCost), toNumber(usage.inputTokens), toNumber(usage.outputTokens))
  void refreshWindow()
}

const send = async (): Promise<void> => {
  const prompt = composer.value.trim()
  if (!prompt || running.value || !activeConfig.value.available) return
  composer.value = ''
  if (
    sessionId.value &&
    (boundProvider.value !== provider.value.trim() ||
      boundModel.value !== model.value.trim() ||
      boundProviderAccount.value !== providerAccount.value.trim() ||
      boundThinking.value !== thinking.value)
  ) {
    sessionId.value = ''
    pushItem('note', 'Provider, model, or reasoning changed - started a new session.')
  }
  if (thinking.value !== 'default' && !reasoningChoices.value.includes(thinking.value)) {
    pushItem('note', `Reasoning effort "${thinking.value}" is not supported by ${model.value.trim() || 'this model'} - reset to the provider default.`)
    thinking.value = 'default'
  }
  if (!sessionId.value) bindSession()
  pushItem('user', prompt)
  stickToBottom.value = true
  showJump.value = false
  running.value = true
  usageLabel.value = ''
  statusText.value = ''
  usageEventSeen = false
  runResultUsageSeen = false
  sawRunResult = false
  contextExceeded.value = false
  liveCost.value = 0
  liveCommitted.value = false
  assistantSeen = false
  activeAssistant = null
  activeThinking = null
  abortController = new AbortController()
  try {
    saveSettings()
    for await (const line of streamModCliRun(
      {
        prompt,
        model: model.value.trim() || undefined,
        provider: provider.value.trim() || undefined,
        providerAccount: providerAccount.value.trim() || undefined,
        thinking: thinking.value,
        plan: planMode.value,
        autoApprove: autoApprove.value,
        sessionId: sessionId.value || undefined,
      },
      abortController.signal,
    )) {
      applyStreamLine(line)
    }
    // Stream ended without a result line - the bridge never settled the run
    // (dev server restart or CLI death). The running flag resets below, but
    // a silent end reads as "did nothing", so say what likely happened.
    if (!sawRunResult) {
      pushItem('note', 'The stream ended without a result - the dev server or CLI likely stopped. Resume from the sessions drawer.')
    }
  } catch (error) {
    if (!(error instanceof DOMException && error.name === 'AbortError')) {
      pushItem('error', error instanceof Error ? error.message : String(error))
    }
  } finally {
    running.value = false
    runId.value = ''
    abortController = null
    await loadHistory()
    applySessionUsage()
  }
}

const answerPermission = async (item: ChatItem, option: ModCliPermissionOption): Promise<void> => {
  if (item.answered !== null || !item.permissionId) return
  item.answered = option.optionId
  try {
    await answerModCliPermission(runId.value, item.permissionId, option.optionId)
  } catch (error) {
    // The optimistic lock is reverted - the wire never answered, so the agent
    // is still waiting and the choice stays re-clickable (a locked card would
    // hang the run forever).
    if (item.answered === option.optionId) item.answered = null
    pushItem('error', error instanceof Error ? error.message : String(error))
  }
}

const permissionAnswerLabel = (item: ChatItem): string => {
  if (item.answered === 'cancelled') return 'Cancelled - the run ended before an answer.'
  const chosen = item.permOptions?.find((option) => option.optionId === item.answered)
  return chosen ? `Answered: ${chosen.name}` : 'Answered.'
}

const toolGlyph = (status?: string): string => {
  if (status === 'completed') return '✓'
  if (status === 'failed') return '✗'
  if (status === 'in_progress') return '▸'
  return '·'
}

// The same heuristic the state chip uses decides which card presentation a
// permission gets - a question renders as a choice card, an approval stays
// inline.
// The agent's suggestions arrive in its own preference order - the first
// entry is the pick it would answer itself. Only question cards carry
// suggestions; approval kinds (allow/reject) are semantics, not preference,
// and a lone suggestion needs no marking.
const suggestedOptionIndex = (item: ChatItem): number =>
  item.kind === 'permission' && cardIsQuestion(item) && (item.permOptions?.length ?? 0) > 1 ? 0 : -1

const cardIsQuestion = (item: ChatItem): boolean => isQuestionCard(item.text, item.toolCallId)

const stopRun = async (): Promise<void> => {
  if (!running.value) return
  try {
    if (runId.value) await stopModCliRun(runId.value)
  } catch {
    abortController?.abort()
    return
  }
  abortController?.abort()
  pushItem('note', 'Run cancelled.')
}

const loadHistory = async (): Promise<void> => {
  historyLoading.value = true
  try {
    sessions.value = await fetchModCliHistory(provider.value.trim() || undefined)
  } catch {
    sessions.value = []
  } finally {
    historyLoading.value = false
  }
}

const deleteSession = async (session: ModCliSessionSummary): Promise<void> => {
  if (running.value || clearing.value) return
  const label = session.title || session.prompt || session.sessionId
  if (!window.confirm(`Delete this session? "${label}"`)) return
  try {
    await deleteModCliSession(provider.value.trim() || 'cline', session.sessionId)
  } catch (error) {
    pushItem('error', error instanceof Error ? error.message : String(error))
    return
  }
  if (sessionId.value === session.sessionId) {
    sessionId.value = ''
    pushItem('note', `Deleted session ${session.sessionId} - this chat is no longer bound to it.`)
  }
  void loadHistory()
}

// The CLI deletes one session per invocation, so this is slow and deliberate:
// confirm, run, then report what actually happened and start a clean chat.
const clearAllSessions = async (): Promise<void> => {
  if (running.value || clearing.value || !sessions.value.length) return
  const listed = sessions.value.length
  const ok = window.confirm(
    `Delete every session of this project?\n\nThe CLI deletes one session at a time (about a second each, ~${listed}s) and this cannot be undone.`,
  )
  if (!ok) return
  clearing.value = true
  try {
    const result = await clearModCliSessions(provider.value.trim() || 'cline')
    newChat()
    if (result.failed) pushItem('error', `Cleared ${result.deleted} of ${result.total} sessions - ${result.failed} could not be deleted.`)
    else pushItem('note', `Cleared ${result.deleted} session${result.deleted === 1 ? '' : 's'} - this project has no CLI history left.`)
  } catch (error) {
    pushItem('error', error instanceof Error ? error.message : String(error))
  } finally {
    clearing.value = false
    void loadHistory()
  }
}

const resumeSession = (session: ModCliSessionSummary): void => {
  if (running.value) return
  sessionId.value = session.sessionId
  pushItem('note', `Resumed session ${session.sessionId} - the next message continues it.`)
  if (session.model) model.value = session.model
  if (session.provider) provider.value = session.provider
  bindSession()
  bindTodoSession(session.sessionId)
  void refreshWindow()
  // The resumed model must be checked against the provider's own list, or the
  // next message silently runs a different model.
  void refreshModels()
  void loadHistory()
  if (session.usage) {
    const used = toNumber(session.usage.inputTokens) + toNumber(session.usage.cacheReadTokens) + toNumber(session.usage.cacheWriteTokens)
    if (used > 0) contextUsed.value = used
    contextOut.value = toNumber(session.usage.outputTokens)
  }
  drawerOpen.value = false
}

const newChat = (): void => {
  if (running.value) return
  sessionId.value = ''
  boundProvider.value = ''
  boundModel.value = ''
  boundProviderAccount.value = ''
  boundThinking.value = thinking.value
  items.value = []
  statusText.value = ''
  usageLabel.value = ''
  contextUsed.value = null
  contextOut.value = null
  contextExceeded.value = false
  todos.value = []
  todoSession.value = ''
  saveTodos()
}

const maskKeyTail = (key: string): string => (key.trim() ? `••••${key.trim().slice(-4)}` : 'not set')

const settingsChanged = computed(() => {
  const tested = lastTest.value
  if (!tested) return false
  // The connection test only proves CLI reachability + key shape - it never
  // validates the model, so a model change alone does not make it stale.
  return (
    tested.provider !== provider.value.trim() ||
    tested.keyTail !== apiKey.value.trim().slice(-4)
  )
})

const connectSummary = computed(() => {
  if (connState.value === 'testing') return 'Testing connection...'
  if (connMessage.value) return connMessage.value
  const tested = lastTest.value
  if (tested) {
    const when = new Date(tested.at).toLocaleString()
    // Model can drift from the tested record without invalidating it, so the
    // summary always reports what the next run will actually use.
    const keyTail = apiKey.value.trim() ? apiKey.value.trim().slice(-4) : tested.keyTail
    const what = `${provider.value.trim() || 'cline'} · ${model.value.trim() || 'provider default'} · key ${
      keyTail ? `••••${keyTail}` : 'not set'
    }`
    const stale = settingsChanged.value ? ' Settings changed since the test - press Test Connection again.' : ''
    if (tested.ok) return `Connected - ${what} (tested ${when}${tested.version ? `, cline ${tested.version}` : ''}).${stale}`
    return `Last test failed - ${what}.${stale}`
  }
  const name = provider.value.trim() || 'cline'
  const keyNote = apiKey.value.trim()
    ? `Key ${maskKeyTail(apiKey.value)} is stored in this browser - the ACP wire ignores keys, so runs use the CLI's own sign-in.`
    : "No API key needed - runs use the CLI's own sign-in."
  if (configAvailable.value === null) return 'Checking the CLI...'
  if (!activeConfig.value.available) return `${name} CLI is not available - install it or check its path.`
  const version = activeConfig.value.version ? ` ${activeConfig.value.version}` : ''
  return `${name} CLI${version} is reachable. ${keyNote} Press Test Connection to record a check.`
})

const connectTone = computed(() => {
  if (connState.value === 'ok') return 'ok'
  if (connState.value === 'error') return 'error'
  if (!connMessage.value && lastTest.value) {
    return lastTest.value.ok ? 'ok' : 'error'
  }
  if (configAvailable.value === false) return 'error'
  return ''
})

type ProviderState = 'ok' | 'warn' | 'err' | 'idle'

// The connection dot reports the CLI's real reachability, never whether a key
// happens to be stored - a stored key has no bearing on a run.
const providerState = computed<ProviderState>(() => {
  if (connState.value === 'testing') return 'warn'
  if (connState.value === 'error') return 'err'
  const tested = lastTest.value
  if (tested) {
    if (!tested.ok) return 'err'
    return settingsChanged.value ? 'warn' : 'ok'
  }
  if (configAvailable.value === null) return 'idle'
  return activeConfig.value.available ? 'ok' : 'err'
})

const providerConn = computed(() => providerState.value)

const providerStatusText = computed(() => {
  const name = provider.value.trim() || 'cline'
  const modelName = model.value.trim()
  const suffix = modelName ? ` · ${modelName}` : ''
  switch (providerState.value) {
    case 'ok':
      return lastTest.value?.ok ? `${name}${suffix} · connected` : `${name}${suffix} · ready`
    case 'warn':
      return connState.value === 'testing' ? 'Testing connection...' : `${name} · check settings`
    case 'err':
      return lastTest.value && !lastTest.value.ok ? `${name} · connection failed` : `${name} · CLI unavailable`
    default:
      return `${name} · checking`
  }
})

const testConnection = async (): Promise<void> => {
  if (running.value || connState.value === 'testing') return
  connState.value = 'testing'
  connMessage.value = 'Testing connection...'
  const testedProvider = provider.value.trim()
  const testedModel = model.value.trim()
  const testedTail = apiKey.value.trim().slice(-4)
  try {
    const result = await testModCliConnection({
      provider: testedProvider || undefined,
      apiKey: apiKey.value.trim() || undefined,
      model: testedModel || undefined,
    })
    if (result.ok) {
      connState.value = 'ok'
      lastTest.value = { ok: true, version: result.version ?? '', at: Date.now(), provider: testedProvider, model: testedModel, keyTail: testedTail }
      connMessage.value = ''
      saveSettings()
      void refreshWindow()
      void refreshModels()
    } else {
      connState.value = 'error'
      lastTest.value = { ok: false, version: '', at: Date.now(), provider: testedProvider, model: testedModel, keyTail: testedTail }
      connMessage.value = result.error || 'Connection test failed.'
      saveSettings()
    }
  } catch (error) {
    connState.value = 'error'
    lastTest.value = { ok: false, version: '', at: Date.now(), provider: testedProvider, model: testedModel, keyTail: testedTail }
    connMessage.value = error instanceof Error ? error.message : String(error)
    saveSettings()
  }
}

const clearApiKey = (): void => {
  if (running.value || connState.value === 'testing') return
  apiKey.value = ''
  connState.value = 'idle'
  lastTest.value = null
  connMessage.value = 'Key cleared from this browser.'
  saveSettings()
}

const formatWhen = (iso: string): string => {
  const time = Date.parse(iso)
  return Number.isNaN(time) ? '' : new Date(time).toLocaleString()
}

const applySample = (text: string): void => {
  if (running.value) return
  composer.value = text
  void nextTick(() => composerInput.value?.focus())
}

const onToggle = (item: ChatItem, event: Event): void => {
  item.open = (event.target as HTMLDetailsElement).open
}

onMounted(() => {
  loadSettings()
  if (defaultPreset.value) selectedPreset.value = defaultPreset.value
  if (!apiKey.value.trim()) settingsOpen.value = true
  loadUsage()
  loadTodos()
  void nextTick(growComposer)
  void (async () => {
    try {
      const config = await fetchModCliConfig()
      configAvailable.value = config.available
      modCliVersion.value = config.version ?? ''
      configProviders.value = config.providers ?? {}
    } catch {
      configAvailable.value = false
    }
  })()
  void loadHistory()
  void refreshModels()
})
</script>

<template>
  <div class="mod-cli-chat">
    <aside v-if="drawerOpen" class="mod-cli-chat__sidebar">
      <div>
        <h2>Sessions</h2>
        <button
          type="button"
          data-tone="danger"
          :disabled="running || clearing || !sessions.length"
          @click="clearAllSessions"
        >
          {{ clearing ? 'Clearing...' : 'Clear all' }}
        </button>
        <button type="button" @click="drawerOpen = false">Close</button>
      </div>
      <div class="mod-cli-chat__session-list">
        <p v-if="historyLoading">Loading sessions...</p>
        <p v-else-if="!sessions.length">No sessions yet</p>
        <div
          v-for="session in sessions"
          :key="session.sessionId"
          class="mod-cli-chat__session-row"
          :data-active="session.sessionId === sessionId"
        >
          <button type="button" @click="resumeSession(session)">
            <span>{{ session.title || session.prompt || session.sessionId }}</span>
            <span>
              {{ session.model || 'default model' }} - {{ formatWhen(session.startedAt) }} - {{ session.status }}
            </span>
          </button>
          <button type="button" title="Delete session" aria-label="Delete session" :disabled="running || clearing" @click="deleteSession(session)">x</button>
        </div>
      </div>
    </aside>
    <div class="mod-cli-chat__main">
      <header class="mod-cli-chat__toolbar">
        <div data-side="main">
          <strong>ModCLI</strong>
          <span :data-dot="dotState"></span>
          <output :data-state="agentState" :title="agentStateHint">{{ agentStateLabel }}</output>
          <output>{{ statusLabel }}</output>
          <output v-if="sessionLabel" data-session :title="sessionTooltip">{{ sessionLabel }}</output>
        </div>
        <div data-side="actions">
          <div
            v-for="gauge in usageGauges"
            :key="gauge.key"
            class="mod-cli-chat__gauge"
            :data-tone="gauge.tone || undefined"
            :title="gauge.title"
          >
            <div>
              <span>{{ gauge.label }}</span>
              <span>{{ gauge.value }}</span>
              <span v-if="gauge.key === 'ctx' && ctxHasData" class="mod-cli-chat__tube">
                <span v-if="ctxWindowPct !== null" :style="{ width: `${ctxWindowPct}%` }"></span>
                <template v-else>
                  <span :style="{ width: `${ctxInPct}%` }"></span>
                  <span :style="{ width: `${100 - ctxInPct}%` }"></span>
                </template>
              </span>
              <span v-if="gauge.reset">{{ gauge.reset }}</span>
            </div>
          </div>
          <button type="button" :data-active="settingsOpen" @click="settingsOpen = !settingsOpen">
            Settings
          </button>
          <button type="button" :data-active="drawerOpen" @click="drawerOpen = !drawerOpen">
            Sessions
          </button>
          <button type="button" :data-active="todoOpen" @click="todoOpen = !todoOpen">
            TODO<span v-if="openTodoCount"> {{ openTodoCount }}</span>
          </button>
          <button type="button" :disabled="running" @click="newChat">New chat</button>
        </div>
      </header>
      <div class="mod-cli-chat__content">
        <div class="mod-cli-chat__center">
        <div data-logwrap>
      <div ref="logElement" class="mod-cli-chat__log" role="log" aria-live="polite" aria-label="Conversation log" @scroll.passive="onLogScroll">
        <div v-if="!items.length">
          <p>Start a task - pick a sample or type below (2+ words).</p>
          <div>
            <button
              v-for="sample in SAMPLE_PROMPTS"
              :key="sample"
              type="button"
              :disabled="running"
              @click="applySample(sample)"
            >
              {{ sample }}
            </button>
          </div>
        </div>
        <template v-for="turn in chatTurns" v-else :key="turn.id">
          <p v-if="turn.prompt" data-kind="user">{{ turn.prompt.text }}</p>
          <template v-for="item in turn.replies" :key="item.id">
          <p v-if="item.kind === 'assistant'" data-kind="assistant">{{ item.text }}</p>
          <p v-else-if="item.kind === 'error'" data-kind="error">{{ item.text }}</p>
          <p v-else-if="item.kind === 'note'" data-kind="note">{{ item.text }}</p>
          <p v-else-if="item.kind === 'tool'" data-kind="tool" :data-status="item.toolStatus || undefined" :data-tool-kind="item.toolKind || undefined">
            <span>{{ toolGlyph(item.toolStatus) }}</span>
            <span>{{ item.text || item.toolCallId }}</span>
          </p>
          <details
            v-else-if="item.kind === 'permission'"
            data-kind="permission"
            :data-question="cardIsQuestion(item) || undefined"
            :open="item.open"
            @toggle="onToggle(item, $event)"
          >
            <summary>{{ item.text }}{{ !cardIsQuestion(item) && item.toolCallId ? ' - tool call' : '' }}</summary>
            <div>
              <div>
                <button
                  v-for="(option, index) in item.permOptions"
                  :key="option.optionId"
                  type="button"
                  :data-option-kind="option.kind || undefined"
                  :disabled="item.answered !== null"
                  @click="answerPermission(item, option)"
                >
                  {{ option.name }}
                  <span
                    v-if="index === suggestedOptionIndex(item)"
                    data-role="suggested"
                    title="The agent lists its primary pick first"
                  >Suggested</span>
                </button>
              </div>
              <p
                v-if="cardIsQuestion(item) && !(item.permOptions?.length ?? 0)"
                data-role="no-choices"
              >The question arrived without choices - answer in the CLI itself or restart the run.</p>
              <p
                v-if="suggestedOptionIndex(item) >= 0"
                data-role="suggest-hint"
              >Suggestions come in the agent's preference order - its pick is first; the reasoning, when the agent wrote one, is in the question text.</p>
              <p v-if="item.answered !== null">{{ permissionAnswerLabel(item) }}</p>
            </div>
          </details>
          <details
            v-else
            :data-kind="item.kind"
            :open="item.open"
            @toggle="onToggle(item, $event)"
          >
            <summary>{{ item.kind === 'thinking' ? 'Thinking' : 'Event' }}</summary>
            <pre>{{ item.text }}</pre>
          </details>
          </template>
        </template>
      </div>
        <button v-if="showJump" type="button" data-jump aria-label="Jump to latest" @click="scrollToLatest">
          ↓ latest
        </button>
        </div>
      <footer class="mod-cli-chat__composer">
        <textarea
          ref="composerInput"
          v-model="composer"
          rows="3"
          aria-label="Message"
          placeholder="Message ModCLI... (Enter to send, Shift+Enter for a newline)"
          @keydown.enter.exact.prevent="send"
        ></textarea>
        <div>
          <span v-if="composerCount" data-count>{{ composerCount }}</span>
          <button v-if="running" type="button" data-tone="danger" @click="stopRun">Stop</button>
          <button v-else type="button" :disabled="!canSend" @click="send">Send</button>
        </div>
      </footer>
        </div>
      <div v-if="settingsOpen" class="mod-cli-chat__settings">
        <h2>Settings</h2>
        <div class="mod-cli-chat__section">
          <div>
            <label>
              <span>API key (stored in this browser only)</span>
              <input
                v-model="apiKey"
                type="password"
                placeholder="Paste provider API key"
                autocomplete="off"
                :disabled="running || connState === 'testing'"
                spellcheck="false"
              />
            </label>
            <button type="button" :disabled="running || connState === 'testing'" @click="testConnection">Test Connection</button>
            <button type="button" :disabled="running || connState === 'testing' || !apiKey" @click="clearApiKey">Clear key</button>
          </div>
          <p :data-tone="connectTone || undefined">
            {{ connectSummary }}
          </p>
        </div>
        <div>
          <span>Connection</span>
          <span>
            <span :data-conn="providerConn"></span>
            <span>{{ providerStatusText }}</span>
          </span>
        </div>
        <label v-if="providerAccountOptions.length">
          <span>{{ cliProviderOption?.name || 'Provider' }}</span>
          <select v-model="providerAccount" :disabled="running">
            <option value="">CLI default</option>
            <option v-for="option in providerAccountOptions" :key="option.value" :value="option.value">
              {{ option.name }}
            </option>
          </select>
        </label>
        <label>
          <span>Model</span>
          <select v-model="model" :disabled="running">
            <option value="">provider default</option>
            <option v-for="option in modelOptions" :key="option" :value="option">
              {{ option }}
            </option>
          </select>
        </label>
        <label>
          <span>Reasoning effort</span>
          <select v-model="thinking" :disabled="running">
            <option v-for="option in reasoningChoices" :key="option" :value="option">
              {{ option === 'default' ? 'provider default' : option }}
            </option>
          </select>
        </label>
        <p v-if="reasoningHint">{{ reasoningHint }}</p>
        <div class="mod-cli-chat__section">
          <div>
            <label>
              <span>Save current as preset</span>
              <input v-model="presetName" placeholder="Preset name" spellcheck="false" :disabled="running" />
            </label>
            <button type="button" :disabled="running || !presetName.trim()" @click="savePreset">Save</button>
          </div>
          <div>
            <label>
              <span>Presets</span>
              <select v-model="selectedPreset" :disabled="running || !presets.length">
                <option value="">(none)</option>
                <option v-for="preset in presets" :key="preset.name" :value="preset.name">
                  {{ preset.name }}{{ preset.name === defaultPreset ? ' - default' : '' }}
                </option>
              </select>
            </label>
            <button type="button" :disabled="running || !selectedPreset" @click="setDefaultPreset">Set default</button>
            <button type="button" :disabled="running || !selectedPreset" @click="deletePreset">Delete</button>
          </div>
        </div>
        <div>
          <span>Mode</span>
          <div>
            <button type="button" :data-active="!planMode" :disabled="running" @click="planMode = false">
              Act
            </button>
            <button type="button" :data-active="planMode" :disabled="running" @click="planMode = true">
              Plan
            </button>
          </div>
        </div>
        <label>
          <input v-model="autoApprove" type="checkbox" :disabled="running" />
          <span>Auto-approve tools</span>
        </label>
      </div>
      </div>
    </div>
    <aside v-if="todoOpen" class="mod-cli-chat__todos">
      <div>
        <h2>TODO</h2>
        <button type="button" :disabled="running" @click="clearDoneTodos">Clear done</button>
        <button type="button" @click="todoOpen = false">Close</button>
      </div>
      <div>
        <input
          v-model="todoText"
          placeholder="Add a step (Enter)"
          spellcheck="false"
          @keydown.enter.prevent="addTodo"
        />
        <button type="button" :disabled="!todoText.trim()" @click="addTodo">Add</button>
      </div>
      <ul>
        <li v-for="todo in todos" :key="todo.id" :data-done="todo.done">
          <input v-model="todo.done" type="checkbox" @change="saveTodos" />
          <span>{{ todo.text }}</span>
          <button type="button" title="Delete step" @click="removeTodo(todo)">x</button>
        </li>
      </ul>
      <p v-if="!todos.length">No steps yet - jot the plan, tick each one as the run lands.</p>
      <footer>
        <button type="button" :disabled="running || !openTodoCount" @click="useTodosAsPrompt">Use as prompt</button>
        <span>{{ openTodoCount }} open</span>
        <span>{{ todoScope }}</span>
      </footer>
    </aside>
  </div>
</template>

<style scoped src="../style/ModCLI.css"></style>
