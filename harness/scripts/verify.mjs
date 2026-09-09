// verify - slot check + verify router for the harness.
// check: validate task-context.md headers, secrets, scope.
// route: read the working tree and print ONLY the matching suites plus the
// project's verify table (marked block in the instruction file).
// run: execute the runnable suites, stop at the first failure.
// Covers both lanes in harness.md: light loop (single-file fix) and feature
// lane (per-ticket loop) - routing is per changed file either way.
//
// Run with: node harness/scripts/verify.mjs [check|route|run|compact]
// Exit code: 0 = ok, 1 = check failure / suite failure / usage error
import fs from 'node:fs'
import path from 'node:path'
import { execSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = process.env.HARNESS_ROOT
  ? path.resolve(process.env.HARNESS_ROOT)
  : path.resolve(fileURLToPath(new URL('../..', import.meta.url)))
const slotPath = path.join(root, 'harness', 'task-context.md')
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
  if (!fs.existsSync(slotPath)) fail('slot file missing (harness/task-context.md)')
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
  const scope = gitScope()
  if (scope !== null && scope.length > 3) {
    console.log(`verify: scope warning - ${scope.length} files changed (stop + ask per instruction file)`)
  }
  console.log(`verify: check pass (4 headers, no secrets, ${left} unchecked box(es))`)
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

function route(files) {
  const suites = []
  const push = (cmd) => {
    if (!suites.includes(cmd)) suites.push(cmd)
  }
  let needsEnginePick = false
  let needsSchemaPick = false
  const eslintFiles = []
  for (const file of files) {
    if (file.endsWith('.vue') || (file.endsWith('.css') && file.startsWith('src/'))) {
      push('lint:bem')
      push('lint:css')
      if (file.endsWith('.vue')) push('typecheck')
    } else if (
      file.endsWith('.ts') &&
      (file.startsWith('src/engine/') || file.includes('/domain/') || file.includes('/assets/'))
    ) {
      needsEnginePick = true
    } else if (file.endsWith('.ts') && (/schema|migrat|persist|sync|payload/i.test(file) || file.includes('/data/'))) {
      needsSchemaPick = true
    } else if (
      file.startsWith('harness/scripts/') &&
      file.endsWith('.mjs') &&
      fs.existsSync(path.join(root, file))
    ) {
      eslintFiles.push(file)
    } else if (file.startsWith('tests/') && file.endsWith('.ts')) {
      push(`tsx ${file}`)
    } else if (file.endsWith('.ts') || file.endsWith('.vue')) {
      push('typecheck')
    }
  }
  const available = testScripts()
  return { suites, needsEnginePick, needsSchemaPick, eslintFiles, available }
}

function tableBlock() {
  try {
    const text = fs.readFileSync(agentsPath, 'utf8')
    const start = text.indexOf('<!-- verify:start -->')
    const end = text.indexOf('<!-- verify:end -->')
    if (start < 0 || end <= start) return null
    return text.slice(start + '<!-- verify:start -->'.length, end).trim()
  } catch {
    return null
  }
}

function report(files, plan) {
  if (!files.length) {
    console.log('verify: working tree clean - nothing to verify')
    return
  }
  console.log('verify: changed files:')
  for (const file of files) console.log(`  ${file}`)
  if (!plan.suites.length && !plan.needsEnginePick && !plan.needsSchemaPick && !plan.eslintFiles.length) {
    console.log('verify: no code changed - nothing to run')
  }
  if (plan.suites.length) {
    console.log('verify: run ONLY these, in order:')
    for (const suite of plan.suites) {
      if (suite.startsWith('tsx ')) console.log(`  npx ${suite}`)
      else console.log(`  npm run ${suite}`)
    }
  }
  if (plan.eslintFiles.length) {
    console.log(`  npx eslint ${plan.eslintFiles.join(' ')} --max-warnings 0   (repo lint covers scripts)`)
  }
  if (plan.needsEnginePick) {
    console.log('verify: engine/domain TS changed - pick the SINGLE matching test:<name> (human pick required):')
    for (const name of plan.available) console.log(`  npm run ${name}`)
  }
  if (plan.needsSchemaPick) {
    console.log('verify: schema/persistence/sync changed - pick the SINGLE matching schema suite (human pick required):')
    for (const name of plan.available.filter((suite) => /schema|migrate|sync|payload/.test(suite)))
      console.log(`  npm run ${name}`)
  }
  const table = tableBlock()
  if (table) {
    console.log('--- project verify table (AGENTS.md) ---')
    console.log(table)
  } else {
    console.log('verify: no verify markers in AGENTS.md')
  }
}

function runPlan(plan) {
  const commands = []
  for (const suite of plan.suites) {
    if (suite.startsWith('tsx ')) commands.push({ label: `npx ${suite}`, argv: ['npx', ...suite.split(' ')] })
    else commands.push({ label: `npm run ${suite}`, argv: ['npm', 'run', suite] })
  }
  if (plan.eslintFiles.length) {
    commands.push({
      label: `npx eslint ${plan.eslintFiles.join(' ')}`,
      argv: ['npx', 'eslint', ...plan.eslintFiles, '--max-warnings', '0'],
    })
  }
  if (plan.needsEnginePick || plan.needsSchemaPick) {
    fail('refusing to run - engine/schema change needs a human suite pick (see: verify route)')
  }
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

function parseStampDate(text) {
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/)
  if (!match) return null
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]) - 7, Number(match[5]))
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
      const header = line.match(/^### (.*)\s*-\s*(\d{4}-\d{2}-\d{2} \d{2}:\d{2}) UTC\+7 \((.*)\)\s*$/)
      current = {
        lines: [line],
        title: header ? header[1].trim() : line.slice(4).trim(),
        stamp: header ? `${header[2]} UTC+7` : '',
        date: header ? parseStampDate(header[2]) : null,
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
  const historyPath = path.join(root, 'harness', 'history.md')
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
    const key = monthKey(entry.date)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(entry)
  }
  if (args['dry-run']) {
    console.log(`verify: would move ${move.length} entr${move.length === 1 ? 'y' : 'ies'}, keep ${kept.length}:`)
    for (const [month, group] of [...groups.entries()].sort()) {
      console.log(`  harness/history-${month}.md <- ${group.length} entr${group.length === 1 ? 'y' : 'ies'}`)
    }
    return
  }
  for (const [month, group] of [...groups.entries()].sort()) {
    const archive = path.join(root, 'harness', `history-${month}.md`)
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
  else if (mode === 'compact') {
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
    fail('usage: node harness/scripts/verify.mjs [check|route|run|compact]')
  }
}

main()
