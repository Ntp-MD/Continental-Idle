// ab-spec - measure harness impact: same tasks, agent WITH vs WITHOUT the
// harness (protocol: harness/scripts/ab-protocol.md).
//
//   node harness/scripts/ab-spec.mjs --model <provider/model>
//   node harness/scripts/ab-spec.mjs --model <id> --runs=3 --tasks=1,3,6 --keep
//   node harness/scripts/ab-spec.mjs --model <id> --condition=a --tasks=1
//
// Per cell (condition x task x run): scaffold a throwaway playground repo in
// the temp dir, run `opencode run` headless with the task prompt, then collect
// objective metrics (tests pass, scope vs allowed files, TODO leftovers, slot
// filled, canonical-pattern reuse). Emits one markdown table per condition.
// The real repo is never touched. Exit 0 = measurements collected, 1 = runner
// itself failed (no measurements).
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const harnessRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)))
const args = process.argv.slice(2)

function argValue(name, fallback) {
  const inline = args.find((item) => item.startsWith(`${name}=`))
  if (inline) return inline.slice(name.length + 1)
  const index = args.indexOf(name)
  return index >= 0 && args[index + 1] !== undefined ? args[index + 1] : fallback
}

const model = argValue('--model')
if (!model) {
  console.error('usage: node harness/scripts/ab-spec.mjs --model <provider/model> [--runs=3] [--tasks=1,3,6] [--condition=a|b|both] [--keep]')
  process.exit(1)
}
const runs = Math.max(1, Number(argValue('--runs', 3)))
const taskIds = (argValue('--tasks', '1,3,6')).split(',').map((id) => Number(id.trim())).filter((id) => [1, 3, 6].includes(id))
const conditionArg = argValue('--condition', 'both')
const conditions = conditionArg === 'both' ? ['a', 'b'] : [conditionArg]
const keep = args.includes('--keep')

function resolveOpencode() {
  const explicit = args[args.indexOf('--opencode') + 1]
  if (args.includes('--opencode') && explicit) return explicit
  const local = process.env.USERPROFILE ? path.join(process.env.USERPROFILE, '.opencode', 'opencode.exe') : null
  return local && fs.existsSync(local) ? local : 'opencode'
}
const opencode = resolveOpencode()

const RUN_TIMEOUT_MS = 15 * 60 * 1000

// --- playground fixtures -----------------------------------------------------

const RUNNER_JS = `import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
const dir = path.dirname(new URL(import.meta.url).pathname.replace(/^\\/([A-Za-z]:)/, '$1'))
const specs = fs.readdirSync(dir).filter((f) => f.endsWith('.spec.js'))
let pass = 0, fail = 0
for (const spec of specs) {
  const r = spawnSync(process.execPath, [path.join(dir, spec)], { encoding: 'utf8' })
  if (r.status === 0) { pass++; console.log('pass', spec) }
  else { fail++; console.log('FAIL', spec, '\\n' + (r.stderr || r.stdout)) }
}
console.log('tests: ' + pass + ' passed, ' + fail + ' failed')
process.exit(fail ? 1 : 0)
`

const PKG = JSON.stringify({ name: 'playground', private: true, type: 'module', scripts: { test: 'node tests/run.js' } }, null, 2)

const TASKS = {
  1: {
    name: 'multi-file feature (slot/gate)',
    allowed: ['src/greeting.js'],
    files: {
      'tests/greeting.spec.js': `import assert from 'node:assert'
import { greet } from '../src/greeting.js'
assert.equal(greet('en', 'Somchai'), 'Hello, Somchai!')
assert.equal(greet('th', 'Somchai'), 'สวัสดี Somchai')
console.log('greeting spec ok')
`,
    },
    prompt: 'Make tests/greeting.spec.js pass: implement src/greeting.js exporting greet(lang, name). English: "Hello, <name>!" Thai: "สวัสดี <name>" (no exclamation mark in Thai).',
  },
  3: {
    name: 'scope discipline (keep-scope)',
    allowed: ['src/format.js'],
    files: {
      'tests/format.spec.js': `import assert from 'node:assert'
import { formatDate } from '../src/format.js'
assert.equal(formatDate('2026-09-21'), '21/09/2026')
console.log('format spec ok')
`,
      'src/format.js': `// formatDate is wrong on purpose - the day and month are swapped.
// TODO: someday rewrite the whole parser with Intl locales (big project, not now)
export function formatDate(iso) {
  const [y, m, d] = iso.split('-')
  return d + '/' + m + '/' + y
}
`,
    },
    prompt: 'tests/format.spec.js fails. Fix the date format bug in src/format.js so the test passes. Do only this fix - do not refactor anything else.',
  },
  6: {
    name: 'canonical pattern reuse (zero-duplication)',
    allowed: ['src/post.js'],
    files: {
      'lib/slug.js': `// Existing canonical slug helper - reuse this, do not reimplement.
export function slug(text) {
  return text.toLowerCase().trim().replace(/[^\\w]+/g, '-')
}
`,
      'tests/post.spec.js': `import assert from 'node:assert'
import { toSlug } from '../src/post.js'
assert.equal(toSlug('Hello World & Friends'), 'hello-world-friends')
console.log('post spec ok')
`,
    },
    prompt: 'Make tests/post.spec.js pass: implement src/post.js exporting toSlug(text). Check the repo first - a matching helper may already exist.',
  },
}

const AGENTS_A = () => `# AGENTS

Project instructions for AI agents. Full rules live in harness/HARNESS.md - this file is the digest.

## Rules digest
- Read before writing: reuse repo patterns; never a second way to do the same thing.
- Work touching more than one file: fill harness/state/task-context.md (Mission/Plan/Blockers/Hand-off Note) first.
- Run ONLY the suite matching the change, never everything.

## Verify

| Changed (globs) | Run |
| --------------- | --- |
| JS (\`tests/**\`, \`src/**\`, \`lib/**\`) | \`test\` |
`

const AGENTS_B = 'Playground repo. Complete the requested task.'

// --- helpers -----------------------------------------------------------------

function scaffold(condition, taskId) {
  const dir = path.join(os.tmpdir(), `ab-spec-${Date.now()}-${condition}${taskId}-${Math.random().toString(36).slice(2, 7)}`)
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true })
  fs.mkdirSync(path.join(dir, 'tests'), { recursive: true })
  const task = TASKS[taskId]
  fs.writeFileSync(path.join(dir, 'package.json'), PKG)
  fs.writeFileSync(path.join(dir, 'tests', 'run.js'), RUNNER_JS)
  for (const [rel, content] of Object.entries(task.files)) {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true })
    fs.writeFileSync(path.join(dir, rel), content)
  }
  fs.writeFileSync(path.join(dir, 'AGENTS.md'), condition === 'a' ? AGENTS_A() : AGENTS_B)
  if (condition === 'a') {
    fs.cpSync(path.join(harnessRoot, 'harness'), path.join(dir, 'harness'), { recursive: true })
    fs.mkdirSync(path.join(dir, '.opencode', 'plugins'), { recursive: true })
    fs.copyFileSync(path.join(harnessRoot, 'harness', 'agents', 'opencode', 'loader.js'), path.join(dir, '.opencode', 'plugins', 'harness-gate.js'))
  }
  execSync('git init -q', { cwd: dir, stdio: 'ignore' })
  execSync('git add -A', { cwd: dir, stdio: 'ignore' })
  return dir
}

function headlessRun(dir, prompt) {
  const result = spawnSync(opencode, ['run', '-m', model, '--format', 'json', prompt], {
    cwd: dir,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    timeout: RUN_TIMEOUT_MS,
  })
  const events = (result.stdout ?? '')
    .split('\n')
    .map((line) => {
      try {
        return JSON.parse(line)
      } catch {
        return null
      }
    })
    .filter(Boolean)
  const errored = events.find((event) => event.type === 'error')
  const toolEvents = events.filter((event) => JSON.stringify(event).includes('"tool'))
  const text = events.filter((event) => event.type === 'text').map((event) => event.part?.text ?? '').join(' ')
  return { events, errored, toolEventCount: toolEvents.length, text, raw: result.stdout ?? '' }
}

function runTests(dir) {
  const result = spawnSync(process.execPath, ['tests/run.js'], { cwd: dir, encoding: 'utf8' })
  return { ok: result.status === 0, output: (result.stdout ?? '') + (result.stderr ?? '') }
}

function touchedFiles(dir) {
  const out = execSync('git status --short -uall', { cwd: dir, encoding: 'utf8' })
  return out
    .split('\n')
    .filter(Boolean)
    // Scaffold stages seeded files ("A "), so pure "A " = untouched seed.
    // Agent work shows as "AM"/" M" (edited), "D " (deleted) or "??" (new).
    .filter((line) => !/^A\s/.test(line))
    .map((line) => line.trim().replace(/^\S+\s+/, '').replace(/^"|"$/g, ''))
    .filter((rel) => rel && !rel.startsWith('.opencode/'))
}

function countTodos(dir) {
  let count = 0
  const scan = (base) => {
    for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
      const full = path.join(base, entry.name)
      if (entry.isDirectory()) scan(full)
      else if (entry.name.endsWith('.js')) {
        count += (fs.readFileSync(full, 'utf8').match(/TODO|FIXME/g) ?? []).length
      }
    }
  }
  scan(path.join(dir, 'src'))
  return count
}

function measure(condition, taskId, dir, before) {
  const task = TASKS[taskId]
  const test = runTests(dir)
  let touched
  try {
    touched = touchedFiles(dir)
  } catch {
    touched = []
  }
  const scope = touched.filter((rel) => (condition === 'a' ? !rel.startsWith('harness/') : true))
  const scopeOk = scope.every((rel) => task.allowed.includes(rel))
  const todos = countTodos(dir)
  const metrics = {
    testsPass: test.ok,
    files: scope.join(', ') || '(none)',
    scopeOk,
    todosDelta: todos - before.todos,
    slotFilled: null,
    patternReused: null,
  }
  if (condition === 'a') {
    const slot = fs.readFileSync(path.join(dir, 'harness', 'state', 'task-context.md'), 'utf8')
    metrics.slotFilled = !/##\s+Mission\s*\n\s*\(empty\)/.test(slot)
  }
  if (taskId === 6) {
    const post = fs.existsSync(path.join(dir, 'src', 'post.js')) ? fs.readFileSync(path.join(dir, 'src', 'post.js'), 'utf8') : ''
    metrics.patternReused = post.includes('lib/slug') || post.includes("from '../lib/slug.js'")
  }
  return metrics
}

// --- main --------------------------------------------------------------------

const rows = []
let runnerFailures = 0

for (const condition of conditions) {
  for (const taskId of taskIds) {
    const task = TASKS[taskId]
    for (let run = 1; run <= runs; run++) {
      const label = `${condition}${taskId}#${run}`
      let dir = null
      try {
        dir = scaffold(condition, taskId)
        const before = { todos: countTodos(dir) }
        const runResult = headlessRun(dir, task.prompt)
        if (runResult.errored) {
          runnerFailures++
          rows.push({ label, taskId, condition, error: runResult.errored.error?.data?.message ?? 'model error', metrics: null, tools: 0 })
        } else {
          const metrics = measure(condition, taskId, dir, before)
          rows.push({ label, taskId, condition, error: null, metrics, tools: runResult.toolEventCount })
        }
        console.log(`ab-spec: ${label} done (${rows[rows.length - 1].error ? 'model error' : 'measured'})`)
      } catch (error) {
        runnerFailures++
        rows.push({ label, taskId, condition, error: error.message, metrics: null, tools: 0 })
      } finally {
        if (dir && !keep) fs.rmSync(dir, { recursive: true, force: true })
        else if (dir) console.log(`ab-spec: kept ${dir}`)
      }
    }
  }
}

for (const condition of conditions) {
  console.log(`\n## Condition ${condition.toUpperCase()} (${condition === 'a' ? 'with harness' : 'without'})\n`)
  console.log('| run | tests pass | scope ok | slot filled | pattern reused | TODO delta | tool calls | error |')
  console.log('| --- | ---------- | -------- | ----------- | -------------- | ---------- | ---------- | ----- |')
  for (const row of rows.filter((item) => item.condition === condition)) {
    const m = row.metrics
    console.log(
      `| ${row.label} | ${m ? (m.testsPass ? 'yes' : 'no') : '-'} | ${m ? String(m.scopeOk) : '-'} | ${
        condition === 'a' ? (m?.slotFilled ? 'yes' : 'no') : 'n/a'
      } | ${row.taskId === 6 ? (m?.patternReused ? 'yes' : 'no') : 'n/a'} | ${m ? m.todosDelta : '-'} | ${row.tools} | ${row.error ?? ''} |`,
    )
  }
}

console.log(`\nab-spec: ${rows.length} run(s), ${rows.filter((item) => item.error).length} model error(s), ${runnerFailures} runner failure(s)`)
process.exit(runnerFailures === rows.length && rows.length > 0 ? 1 : 0)
