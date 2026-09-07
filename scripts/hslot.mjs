// hslot - live-slot CLI for the file-based session handoff.
// The single live slot is _archive/current-task.md, the done-log is
// _archive/history.md. Set HARNESS_ROOT to point at another repo root
// (used to demo/test without touching real state).
//
// Run with: node scripts/hslot.mjs <command> [options]
// Exit code: 0 = ok, 1 = usage error or check failure
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = process.env.HARNESS_ROOT
  ? path.resolve(process.env.HARNESS_ROOT)
  : path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const slotPath = path.join(root, '_archive', 'current-task.md')
const historyPath = path.join(root, '_archive', 'history.md')

const HEADERS = [
  'Agent',
  'Mission',
  'Investigation',
  'Findings',
  'Approach',
  'Plan',
  'Verify',
  'Current Thinking',
  'Blockers',
  'Hand-off Note',
]

const SECRET_RES = [
  /\bsk-[A-Za-z0-9]{8,}/,
  /\bghp_[A-Za-z0-9]{8,}/,
  /\bAKIA[0-9A-Z]{16}/,
  /\bxox[bpas]-[A-Za-z0-9-]{8,}/,
  /(api[_-]?key|token|passwd|password|secret)\s*[:=]\s*['"]?[^'"\s]{8,}/i,
]

function stamp(when = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .formatToParts(when)
    .reduce((acc, part) => {
      acc[part.type] = part.value
      return acc
    }, {})
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute} UTC+7`
}

function emptySlot() {
  return HEADERS.map((header) => `## ${header}\n`).join('\n') + '\n'
}

function readFile(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null
}

function parseSections(text) {
  const sections = []
  const lines = text.split('\n')
  let header = null
  let body = []
  for (const line of lines) {
    const match = line.match(/^## (.+?)\s*$/)
    if (match) {
      if (header !== null) sections.push({ header, body: body.join('\n') })
      header = match[1]
      body = []
    } else if (header !== null) {
      body.push(line)
    }
  }
  if (header !== null) sections.push({ header, body: body.join('\n') })
  return sections
}

function renderSections(sections) {
  return (
    sections
      .map((section) => `## ${section.header}\n${section.body}`)
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s+$/, '') + '\n'
  )
}

function getSection(sections, name) {
  return sections.find((section) => section.header === name) ?? null
}

function bodyIsBlank(body) {
  return body
    .split('\n')
    .every((line) => line.trim() === '' || (line.trim().startsWith('<!--') && line.trim().endsWith('-->')))
}

export function parseArgs(raw) {
  const args = { _: [] }
  for (let i = 0; i < raw.length; i++) {
    const token = raw[i]
    if (token.startsWith('--')) {
      const key = token.slice(2)
      const next = raw[i + 1]
      if (next === undefined || next.startsWith('--')) {
        args[key] = true
      } else {
        if (Array.isArray(args[key])) args[key].push(next)
        else if (args[key] !== undefined) args[key] = [args[key], next]
        else args[key] = next
        i++
      }
    } else {
      args._.push(token)
    }
  }
  return args
}

function loadSlot() {
  const text = readFile(slotPath)
  if (text === null) return { sections: parseSections(emptySlot()), missing: true }
  return { sections: parseSections(text), missing: false }
}

function saveSlot(sections) {
  fs.mkdirSync(path.dirname(slotPath), { recursive: true })
  fs.writeFileSync(slotPath, renderSections(sections))
}

function gitScope() {
  try {
    const out = execSync('git status --short', { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    return out
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  } catch {
    return null
  }
}

function fail(message) {
  console.error(`hslot: ${message}`)
  process.exit(1)
}

function cmdNew(args) {
  const mission = args.mission ?? args._.join(' ')
  if (!mission) fail('usage: hslot new --mission "..." [--agent NAME] [--model ID] [--force]')
  const { sections } = loadSlot()
  const missionSection = getSection(sections, 'Mission')
  if (missionSection && !bodyIsBlank(missionSection.body) && !args.force) {
    fail('slot already has a mission (pass --force to overwrite)')
  }
  const agent = args.agent ?? process.env.HARNESS_AGENT ?? 'muse-spark'
  const model = args.model ?? process.env.HARNESS_MODEL ?? 'opencode/muse-spark-1.3-contributor-free'
  const fresh = parseSections(emptySlot())
  getSection(fresh, 'Agent').body = `${agent} | ${model} | opencode\n`
  getSection(fresh, 'Mission').body = `${mission}\n<!-- Received: ${stamp()} -->\n`
  const steps = args.step === undefined ? [] : Array.isArray(args.step) ? args.step : [args.step]
  if (steps.length) {
    getSection(fresh, 'Plan').body = steps.map((step) => `- [ ] ${step}`).join('\n') + '\n'
  }
  getSection(fresh, 'Hand-off Note').body = 'Next: inspect, then fill Investigation before planning\n'
  saveSlot(fresh)
  console.log(`hslot: slot opened in ${slotPath}`)
}

function uncheckedBoxes(planBody) {
  return planBody
    .split('\n')
    .map((line, index) => ({ line, index }))
    .filter((entry) => /^\s*-\s\[\s\]/.test(entry.line))
}

function cmdTick(args) {
  const { sections } = loadSlot()
  const plan = getSection(sections, 'Plan')
  if (!plan) fail('slot has no Plan section')
  const boxes = uncheckedBoxes(plan.body)
  if (!boxes.length) {
    console.log('hslot: no unchecked boxes left')
    return
  }
  let target = boxes[0]
  if (args.text) {
    const found = boxes.find((entry) => entry.line.includes(String(args.text)))
    if (!found) fail(`no unchecked box matches "${args.text}"`)
    target = found
  } else if (args._[0] !== undefined) {
    const n = Number(args._[0])
    if (!Number.isInteger(n) || n < 1 || n > boxes.length)
      fail(`pick 1-${boxes.length} (there are ${boxes.length} unchecked)`)
    target = boxes[n - 1]
  }
  const lines = plan.body.split('\n')
  lines[target.index] = lines[target.index].replace(/-\s\[\s\]/, '- [x]')
  plan.body = lines.join('\n')
  saveSlot(sections)
  console.log(`hslot: ticked "${target.line.trim()}" (${boxes.length - 1} left)`)
}

function cmdNote(args) {
  const { sections } = loadSlot()
  if (args.thinking !== undefined) {
    const section = getSection(sections, 'Current Thinking')
    if (!section) fail('slot has no Current Thinking section')
    section.body = `${String(args.thinking)}\n`
  }
  if (args.next !== undefined) {
    const section = getSection(sections, 'Hand-off Note')
    if (!section) fail('slot has no Hand-off Note section')
    section.body = `${String(args.next)}\n`
  }
  if (args.thinking === undefined && args.next === undefined) {
    fail('usage: hslot note --thinking "..." [--next "..."]')
  }
  saveSlot(sections)
  console.log('hslot: note saved')
}

function cmdBlock(args) {
  const { sections } = loadSlot()
  const blockers = getSection(sections, 'Blockers')
  if (!blockers) fail('slot has no Blockers section')
  if (args.clear) {
    blockers.body = '<!-- none -->\n'
  } else {
    const text = args._.join(' ')
    if (!text) fail('usage: hslot block "[HARD] what - needed"  (or --clear)')
    const lines = blockers.body.split('\n').filter((line) => line.trim() !== '' && !line.trim().startsWith('<!--'))
    lines.push(`- ${text}`)
    blockers.body = lines.join('\n') + '\n'
  }
  saveSlot(sections)
  console.log('hslot: blockers updated')
}

function cmdShow() {
  const text = readFile(slotPath)
  console.log(text ?? '(slot file missing - run: hslot new --mission "...")')
  const scope = gitScope()
  if (scope === null) console.log('---\nscope: git unavailable')
  else console.log(`---\nscope: ${scope.length} changed file(s)`)
  for (const line of scope ?? []) console.log(`  ${line}`)
}

function cmdCheck() {
  const text = readFile(slotPath)
  if (text === null) fail('slot file missing (run: hslot new --mission "...")')
  const sections = parseSections(text)
  const problems = []
  const names = sections.map((section) => section.header)
  for (let i = 0; i < HEADERS.length; i++) {
    if (names[i] !== HEADERS[i]) {
      problems.push(`headers broken at position ${i + 1}: want "## ${HEADERS[i]}"`)
      break
    }
  }
  for (const pattern of SECRET_RES) {
    if (pattern.test(text)) {
      problems.push(`possible secret matches ${pattern}`)
      break
    }
  }
  const plan = getSection(sections, 'Plan')
  const left = plan ? uncheckedBoxes(plan.body).length : 0
  const scope = gitScope()
  if (scope !== null && scope.length > 3) {
    console.log(`hslot: scope warning - ${scope.length} files changed (STOP + ask per AGENTS.md)`)
  }
  if (problems.length) {
    for (const problem of problems) console.error(`hslot: FAIL ${problem}`)
    process.exit(1)
  }
  console.log(`hslot: pass (10 headers, no secrets, ${left} unchecked box(es))`)
}

function cmdDone(args) {
  const title = args.title ?? args._.join(' ')
  if (!title || /[\r\n]/.test(title)) fail('usage: hslot done --title "..." --detail "..." (repeat --detail)')
  const { sections } = loadSlot()
  const plan = getSection(sections, 'Plan')
  const left = plan ? uncheckedBoxes(plan.body).length : 0
  if (left > 0 && !args.force) fail(`${left} unchecked box(es) left (tick them or pass --force)`)
  const agent = args.agent ?? process.env.HARNESS_AGENT ?? 'muse-spark'
  const model = args.model ?? process.env.HARNESS_MODEL ?? 'opencode/muse-spark-1.3-contributor-free'
  const details = args.detail === undefined ? [] : Array.isArray(args.detail) ? args.detail : [args.detail]
  const entry =
    `\n### ${title} - ${stamp()} (${agent}, ${model})\n` +
    (details.length ? details.map((detail) => `- ${detail}\n`).join('') : '- done\n')
  let history = readFile(historyPath)
  if (history === null) fail('history file missing')
  if (!history.endsWith('\n')) history += '\n'
  fs.writeFileSync(historyPath, history + entry)
  saveSlot(parseSections(emptySlot()))
  console.log(`hslot: logged "${title}" and cleared the slot`)
}

function monthKey(epoch) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit' })
    .formatToParts(new Date(epoch))
    .reduce((acc, part) => {
      acc[part.type] = part.value
      return acc
    }, {})
  return `${parts.year}-${parts.month}`
}

function cmdCompact(args) {
  const days = args['older-than'] === undefined ? 30 : Number(args['older-than'])
  if (!Number.isInteger(days) || days < 1) fail('usage: hslot compact [--older-than DAYS] [--dry-run]')
  const text = readFile(historyPath)
  if (text === null) fail('history file missing')
  const cutoff = Date.now() - days * 86400000
  const { preamble, entries } = parseHistoryEntries(text)
  const keep = []
  const move = []
  for (const entry of entries) {
    if (entry.date === null) {
      console.error(`hslot: keeping undated entry "${entry.title}"`)
      keep.push(entry)
    } else if (entry.date < cutoff) {
      move.push(entry)
    } else {
      keep.push(entry)
    }
  }
  if (!move.length) {
    console.log(`hslot: nothing older than ${days} day(s) - board stays as is`)
    return
  }
  const groups = new Map()
  for (const entry of move) {
    const key = monthKey(entry.date)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(entry)
  }
  if (args['dry-run']) {
    console.log(`hslot: would move ${move.length} entr${move.length === 1 ? 'y' : 'ies'}:`)
    for (const [month, group] of [...groups.entries()].sort()) {
      console.log(`  _archive/history-${month}.md <- ${group.length} entr${group.length === 1 ? 'y' : 'ies'}`)
      for (const entry of group) console.log(`    - ${entry.title}`)
    }
    return
  }
  for (const [month, group] of [...groups.entries()].sort()) {
    const archive = path.join(root, '_archive', `history-${month}.md`)
    let out = readFile(archive)
    if (out === null) out = `# History archive - ${month}\n`
    if (!out.endsWith('\n')) out += '\n'
    out += group.map((entry) => `\n${entry.lines.join('\n').replace(/\s+$/, '')}\n`).join('')
    fs.writeFileSync(archive, out)
  }
  const kept =
    preamble.replace(/\s+$/, '') +
    '\n' +
    keep.map((entry) => `\n${entry.lines.join('\n').replace(/\s+$/, '')}\n`).join('')
  fs.writeFileSync(historyPath, kept)
  console.log(
    `hslot: moved ${move.length} entr${move.length === 1 ? 'y' : 'ies'} to monthly archive(s), ${keep.length} kept`,
  )
}

function cmdHelp() {
  console.log(`hslot - live-slot CLI (root: ${root})
  new --mission "..." [--step "..."] [--agent N] [--model M] [--force]  open the slot
  tick [N | --text frag]                                 check a Plan box (default: first unchecked)
  note --thinking "..." [--next "..."]                   update thinking / hand-off note
  block "[HARD] what - needed" | --clear                 add or clear blockers
  show                                                   print slot + changed-file scope
  check                                                  validate headers, secrets, scope (exit 1 on fail)
  done --title "..." --detail "..." [...]                log history, clear slot
  compact [--older-than DAYS] [--dry-run]              archive old entries to history-YYYY-MM.md
  help                                                   this text`)
}

export function harnessPaths() {
  return { root, slotPath, historyPath }
}

export function parseStampDate(text) {
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/)
  if (!match) return null
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]) - 7, Number(match[5]))
}

export function parseHistoryEntries(text) {
  const lines = text.split('\n')
  const firstEntry = lines.findIndex((line) => line.startsWith('### '))
  const preamble = firstEntry < 0 ? text : lines.slice(0, firstEntry).join('\n')
  const entries = []
  let current = null
  const push = () => {
    if (current) entries.push(current)
  }
  for (const line of lines.slice(firstEntry < 0 ? lines.length : firstEntry)) {
    if (line.startsWith('### ')) {
      push()
      const header = line.match(/^### (.*)\s*-\s*(\d{4}-\d{2}-\d{2} \d{2}:\d{2}) UTC\+7 \((.*)\)\s*$/)
      const who = header ? header[3].split(',') : []
      current = {
        lines: [line],
        title: header ? header[1].trim() : line.slice(4).trim(),
        stamp: header ? `${header[2]} UTC+7` : '',
        agent: who.length ? who[0].trim() : '',
        model: who.length > 1 ? who.slice(1).join(',').trim() : '',
        date: header ? parseStampDate(header[2]) : null,
        bullets: [],
      }
    } else if (current) {
      current.lines.push(line)
      const bullet = line.match(/^- (.*)$/)
      if (bullet) current.bullets.push(bullet[1])
    }
  }
  push()
  return { preamble, entries }
}

function main() {
  const [command, ...rest] = process.argv.slice(2)
  const args = parseArgs(rest)
  if (command === 'new') cmdNew(args)
  else if (command === 'tick') cmdTick(args)
  else if (command === 'note') cmdNote(args)
  else if (command === 'block') cmdBlock(args)
  else if (command === 'show') cmdShow()
  else if (command === 'check') cmdCheck()
  else if (command === 'done') cmdDone(args)
  else if (command === 'compact') cmdCompact(args)
  else if (command === 'help' || command === undefined) cmdHelp()
  else fail(`unknown command "${command}" (try: hslot help)`)
}

const invoked = process.argv[1] ? path.resolve(process.argv[1]) : ''
if (invoked === fileURLToPath(import.meta.url)) main()
