// verify - slot check + verify router for the harness.
// check: validate state/task-context.md headers, secrets, scope.
// route: match the working tree against the project's verify table (AGENTS.md
// verify markers) and print ONLY the matching suites - the harness ships no
// suite names; suites live in the project's table + package.json only.
// run: execute the matched suites, stop at the first failure; pick rows
// (rows with no concrete script) always refuse to auto-run.
// Covers both lanes in HARNESS.md: light loop (single-file fix) and feature
// lane (per-ticket loop) - routing is per changed file either way.
//
// Run with: node harness/scripts/verify.mjs [check|table|route|run|compact]
// Exit code: 0 = ok, 1 = check failure / suite failure / usage error
import fs from 'node:fs'
import path from 'node:path'
import { execSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = process.env.HARNESS_ROOT
  ? path.resolve(process.env.HARNESS_ROOT)
  : path.resolve(fileURLToPath(new URL('../..', import.meta.url)))
const slotPath = path.join(root, 'harness', 'state', 'task-context.md')
const agentsPath = path.join(root, 'AGENTS.md')

const HEADERS = [
  'Mission',
  'Plan',
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

function fail(message) {
  console.error(`verify: ${message}`)
  process.exit(1)
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

function uncheckedBoxes(planBody) {
  return planBody
    .split('\n')
    .map((line, index) => ({ line, index }))
    .filter((entry) => /^\s*-\s\[\s\]/.test(entry.line))
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

function cmdCheck() {
  if (!fs.existsSync(slotPath)) fail('slot file missing (harness/state/task-context.md)')
  const text = fs.readFileSync(slotPath, 'utf8')
  const sections = parseSections(text)
  const names = sections.map((section) => section.header)
  for (let i = 0; i < HEADERS.length; i++) {
    if (names[i] !== HEADERS[i]) fail(`headers broken at position ${i + 1}: want "## ${HEADERS[i]}"`)
  }
  for (const pattern of SECRET_RES) {
    if (pattern.test(text)) fail(`possible secret matches ${pattern}`)
  }
  const plan = sections.find((section) => section.header === 'Plan')
  const left = plan ? uncheckedBoxes(plan.body).length : 0
  const handoff = sections.find((section) => section.header === 'Hand-off Note')
  const handoffText = handoff
    ? handoff.body
        .split('\n')
        .filter((line) => {
          const text = line.trim()
          return text !== '' && !(text.startsWith('<!--') && text.endsWith('-->'))
        })
        .join('\n')
    : ''
  if (left === 0 && !handoffText) {
    fail('all Plan boxes ticked but Hand-off Note is blank - name the exact next action (or clear the slot if done)')
  }
  const tableIssues = tableProblems()
  if (tableIssues.length) fail(`verify table invalid:\n  - ${tableIssues.join('\n  - ')}`)
  const scope = gitScope()
  if (scope !== null && scope.length > 3) {
    console.log(`verify: scope warning - ${scope.length} files changed (stop + ask per instruction file)`)
  }
  console.log(`verify: check pass (4 headers, no secrets, ${left} unchecked box(es), table valid)`)
}

function changedFiles() {
  let out
  try {
    out = execSync('git status --short', { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  } catch {
    fail('git status failed (not a git repo?)')
  }
  return out
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const arrow = line.indexOf('->')
      const file = arrow >= 0 ? line.slice(arrow + 2) : line.slice(2)
      return file
        .trim()
        .replace(/^"(.*)"$/, '$1')
        .trim()
    })
    .filter((file) => !/^tests\/_.*\.tmp\.ts$/.test(file))
}

function testScripts() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
    return Object.keys(pkg.scripts ?? {})
      .filter((name) => name.startsWith('test:'))
      .sort()
  } catch {
    return []
  }
}

function globRegex(glob) {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&')
  // single pass - inserted tokens (e.g. "(?:.*/)?") must never be rescanned
  const body = escaped.replace(/\*\*\/|\*\*|\*|\?/g, (m) =>
    m === '**/' ? '(?:.*/)?' : m === '**' ? '.*' : m === '?' ? '[^/]' : '[^/]*'
  )
  return glob.includes('/') ? new RegExp(`^${body}$`) : new RegExp(`^(?:.*/)?${body}$`)
}

// The verify table in AGENTS.md (between verify markers) is the only routing
// source. Row format: backticked globs in the Changed cell, backticked npm
// scripts in the Run cell; a row with no concrete script is a human-pick row
// (the router lists the project's test: scripts instead of choosing).
function tableRows() {
  let text
  try {
    text = fs.readFileSync(agentsPath, 'utf8')
  } catch {
    return []
  }
  const start = text.indexOf('<!-- verify:start -->')
  const end = text.indexOf('<!-- verify:end -->')
  if (start < 0 || end <= start) return []
  const rows = []
  for (const line of text.slice(start + '<!-- verify:start -->'.length, end).split('\n')) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('|')) continue
    const cells = trimmed
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cell.trim())
    if (cells.length < 2) continue
    if (/^[-\s:]+$/.test(cells[0])) continue
    if (/^changed\b/i.test(cells[0])) continue
    const globs = [...cells[0].matchAll(/`([^`]+)`/g)].map((m) => m[1])
    const scripts = [...cells[1].matchAll(/`([^`]+)`/g)]
      .map((m) => m[1])
      .filter((token) => /^[A-Za-z0-9_:@.-]+$/.test(token) && !token.includes('/') && !token.includes('*'))
    rows.push({ label: cells[0], globs, scripts, pick: scripts.length === 0, runText: cells[1] })
  }
  return rows
}

function tableScripts() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
    return new Set(Object.keys(pkg.scripts ?? {}))
  } catch {
    return null
  }
}

// Validate the verify table against package.json: every backticked token in a Run
// cell that looks like a concrete npm script must exist, and a Changed cell with
// no backticked glob can never route. Catches stale/typo rows before they fail
// silently. No package.json -> script existence is not checked.
function tableProblems() {
  const problems = []
  const scripts = tableScripts()
  for (const row of tableRows()) {
    if (!row.globs.length) {
      problems.push(`no backticked glob in Changed cell: ${row.label}`)
      continue
    }
    for (const token of [...row.runText.matchAll(/`([^`]+)`/g)].map((m) => m[1])) {
      const looksLikeScript = /^[A-Za-z0-9_:@.-]+$/.test(token) && !token.includes('/') && !token.includes('*')
      if (scripts && looksLikeScript && !scripts.has(token)) {
        problems.push(`unknown npm script "${token}" in Run cell: ${row.label}`)
      }
    }
  }
  return problems
}

function route(files) {
  const suites = []
  const picks = []
  for (const row of tableRows()) {
    if (!row.globs.length) continue
    const regexes = row.globs.map(globRegex)
    const matched = files.some((file) => regexes.some((regex) => regex.test(file.replace(/\\/g, '/'))))
    if (!matched) continue
    if (row.pick) {
      if (!picks.some((existing) => existing.label === row.label)) picks.push(row)
    } else {
      for (const script of row.scripts) {
        if (!suites.includes(script)) suites.push(script)
      }
    }
  }
  return { suites, picks, available: testScripts() }
}

function report(files, plan) {
  if (!files.length) {
    console.log('verify: working tree clean - nothing to verify')
    return
  }
  console.log('verify: changed files:')
  for (const file of files) console.log(`  ${file}`)
  if (!plan.suites.length && !plan.picks.length) {
    console.log('verify: no verify-table row matched - nothing to run')
  }
  if (plan.suites.length) {
    console.log('verify: run ONLY these, in order (AGENTS.md verify table):')
    for (const suite of plan.suites) console.log(`  npm run ${suite}`)
  }
  if (plan.picks.length) {
    console.log('verify: pick-required rows matched - choose the SINGLE matching suite (human pick required):')
    for (const row of plan.picks) console.log(`  row: ${row.label} -> ${row.runText}`)
    for (const name of plan.available) console.log(`  npm run ${name}`)
  }
}

function runPlan(plan) {
  if (plan.picks.length) {
    fail('refusing to run - a pick-required row matched (see: verify route)')
  }
  const commands = plan.suites.map((suite) => ({ label: `npm run ${suite}`, argv: ['npm', 'run', suite] }))
  if (!commands.length) {
    console.log('verify: nothing runnable')
    return
  }
  for (const command of commands) {
    console.log(`verify: $ ${command.label}`)
    const result = spawnSync(command.argv[0], command.argv.slice(1), { cwd: root, stdio: 'inherit', shell: true })
    if (result.status !== 0) {
      console.error(`verify: FAILED ${command.label}`)
      process.exit(result.status ?? 1)
    }
  }
  console.log('verify: all green')
}

function parseStampDate(text, zone) {
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/)
  if (!match) return null
  return (
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5])) - zone
  )
}

// The UTC offset is read from each stamp itself (e.g. "UTC+7", "UTC-05:30", "UTC") -
// no per-project hardcode; a project picks one zone and keeps every stamp consistent.
function parseZone(text) {
  const match = text.match(/^UTC([+-])(\d{1,2})(?::(\d{2}))?$/)
  if (!match) return 0
  const minutes = Number(match[2]) * 60 + Number(match[3] ?? 0)
  return (match[1] === '-' ? -minutes : minutes) * 60000
}

function monthKey(epoch, zone) {
  const shifted = new Date(epoch + zone)
  return `${String(shifted.getUTCFullYear()).padStart(4, '0')}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}`
}

function parseHistoryEntries(text) {
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
      const header = line.match(
        /^### (.*)\s*-\s*(\d{4}-\d{2}-\d{2} \d{2}:\d{2}) (UTC(?:[+-]\d{1,2}(?::\d{2})?)?) \((.*)\)\s*$/
      )
      const zone = header ? parseZone(header[3]) : 0
      current = {
        lines: [line],
        title: header ? header[1].trim() : line.slice(4).trim(),
        stamp: header ? `${header[2]} ${header[3]}` : '',
        zone,
        date: header ? parseStampDate(header[2], zone) : null,
      }
    } else if (current) {
      current.lines.push(line)
    }
  }
  push()
  return { preamble, entries }
}

function cmdCompact(args) {
  const keep = args.keep === undefined ? 20 : Number(args.keep)
  if (!Number.isInteger(keep) || keep < 1) fail('usage: verify.mjs compact [--keep N] [--dry-run]')
  const historyPath = path.join(root, 'harness', 'state', 'history.md')
  const text = fs.existsSync(historyPath) ? fs.readFileSync(historyPath, 'utf8') : null
  if (text === null) fail('history file missing')
  const { preamble, entries } = parseHistoryEntries(text)
  const dated = []
  const undated = []
  for (const entry of entries) {
    if (entry.date === null) {
      console.error(`verify: keeping undated entry "${entry.title}"`)
      undated.push(entry)
    } else {
      dated.push(entry)
    }
  }
  dated.sort((a, b) => a.date - b.date)
  const keepDated = dated.slice(-keep)
  const move = dated.slice(0, Math.max(0, dated.length - keep))
  const kept = [...undated, ...keepDated]
  if (!move.length) {
    console.log(`verify: ${dated.length} dated entr${dated.length === 1 ? 'y' : 'ies'} - within keep=${keep}, nothing to move`)
    return
  }
  const groups = new Map()
  for (const entry of move) {
    const key = monthKey(entry.date, entry.zone)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(entry)
  }
  if (args['dry-run']) {
    console.log(`verify: would move ${move.length} entr${move.length === 1 ? 'y' : 'ies'}, keep ${kept.length}:`)
    for (const [month, group] of [...groups.entries()].sort()) {
      console.log(`  harness/state/history-${month}.md <- ${group.length} entr${group.length === 1 ? 'y' : 'ies'}`)
    }
    return
  }
  for (const [month, group] of [...groups.entries()].sort()) {
    const archive = path.join(root, 'harness', 'state', `history-${month}.md`)
    let out = fs.existsSync(archive) ? fs.readFileSync(archive, 'utf8') : `# History archive - ${month}\n`
    if (!out.endsWith('\n')) out += '\n'
    out += group.map((entry) => `\n${entry.lines.join('\n').replace(/\s+$/, '')}\n`).join('')
    fs.writeFileSync(archive, out)
  }
  const keptText =
    preamble.replace(/\s+$/, '') +
    '\n' +
    kept.map((entry) => `\n${entry.lines.join('\n').replace(/\s+$/, '')}\n`).join('')
  fs.writeFileSync(historyPath, keptText)
  console.log(`verify: moved ${move.length} to monthly archive(s), kept ${kept.length}`)
}

function main() {
  const mode = process.argv[2] ?? 'route'
  if (mode === 'check') cmdCheck()
  else if (mode === 'table') {
    const issues = tableProblems()
    if (issues.length) fail(`verify table invalid:\n  - ${issues.join('\n  - ')}`)
    console.log(`verify: table ok (${tableRows().length} rows)`)
  } else if (mode === 'compact') {
    const args = {}
    const rest = process.argv.slice(3)
    for (let i = 0; i < rest.length; i++) {
      if (rest[i].startsWith('--')) {
        const key = rest[i].slice(2)
        const next = rest[i + 1]
        if (next === undefined || next.startsWith('--')) args[key] = true
        else {
          args[key] = next
          i++
        }
      }
    }
    cmdCompact(args)
  } else if (mode === 'route' || mode === 'run') {
    const files = changedFiles()
    const plan = route(files)
    report(files, plan)
    if (mode === 'run') runPlan(plan)
  } else {
    fail('usage: node harness/scripts/verify.mjs [check|table|route|run|compact]')
  }
}

main()
