// rail-spec - regression tests for the harness rail, run against throwaway
// fixture projects in the OS temp dir. The real repo is never touched.
//
//   node harness/scripts/rail-spec.mjs            run all scenarios
//   node harness/scripts/rail-spec.mjs --keep     keep fixture dirs for debugging
//
// Exit 0 = all pass, 1 = any failure. Each scenario builds a fresh temp dir
// (git init + harness copy + staged files/slot), exercises one rail runner
// (verify.mjs check/drift, the gate plugin hook, adopt.mjs), asserts the
// exit code and message, then removes the dir.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execSync, spawnSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const harnessRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)))
const keep = process.argv.includes('--keep')
let passed = 0
let failed = 0

function makeFixture(name, { git = true, copyHarness = true } = {}) {
  const dir = path.join(os.tmpdir(), `rail-spec-${Date.now()}-${name}`)
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
  if (copyHarness) fs.cpSync(path.join(harnessRoot, 'harness'), path.join(dir, 'harness'), { recursive: true })
  if (git) execSync('git init -q', { cwd: dir, stdio: 'ignore' })
  return dir
}

function write(rel, content) {
  return (dir) => {
    const file = path.join(dir, rel)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, content)
  }
}

// git status collapses untracked directories ("?? src/"), so drift scenarios
// stage everything - staged paths appear per-file ("A  src/a.ts").
function stage(dir) {
  execSync('git add -A', { cwd: dir, stdio: 'ignore' })
}

const SLOT = (mission, plan) =>
  `## Mission\n\n${mission}\n\n## Plan\n\n${plan}\n\n## Blockers\n\n- (none)\n\n## Hand-off Note\n\n(empty - next action: continue)\n`

const FILLED_SLOT = SLOT('Build the widget thing', '- [ ] step one\n- [x] step two')
const UNTRACKED_SLOT = SLOT('Build the widget thing', '- [ ] step one\n- [ ] step two')

function runVerify(dir, mode) {
  const script = path.join(dir, 'harness', 'scripts', 'verify.mjs')
  return spawnSync(process.execPath, [script, mode], {
    cwd: dir,
    env: { ...process.env, HARNESS_ROOT: dir },
    encoding: 'utf8',
  })
}

async function runGate(dir, calls) {
  const plugin = path.join(dir, '.opencode', 'plugins', 'harness-gate.js')
  const mod = await import(pathToFileURL(plugin).href)
  const hook = mod.createHarnessGate({ directory: dir })['tool.execute.before']
  const throws = []
  for (let i = 1; i <= calls; i++) {
    try {
      await hook({ tool: 'edit' }, { args: { filePath: `src/file-${i}.ts` } })
    } catch (error) {
      throws.push(error.message)
    }
  }
  return throws
}

function deployPlugin(dir) {
  const target = path.join(dir, '.opencode', 'plugins')
  fs.mkdirSync(target, { recursive: true })
  fs.copyFileSync(path.join(harnessRoot, 'harness', 'agents', 'opencode', 'loader.js'), path.join(target, 'harness-gate.js'))
}

const scenarios = [
  {
    name: 'lite task - single file, empty slot, gate stays silent',
    build: [write('src/only.ts', 'export {}\n')],
    async run(dir) {
      deployPlugin(dir)
      const throws = await runGate(dir, 1)
      return throws.length === 0 ? null : `expected no throw, got: ${throws[0]}`
    },
  },
  {
    name: 'medium task - second file while slot empty, gate blocks',
    build: [],
    async run(dir) {
      deployPlugin(dir)
      const throws = await runGate(dir, 2)
      return throws.length === 1 && throws[0].includes('medium+ task')
        ? null
        : `expected 1 gate throw, got ${throws.length}: ${throws[0] ?? 'none'}`
    },
  },
  {
    name: 'drift - empty slot with 3 changed files fails as lost task',
    build: [write('src/a.ts', ''), write('src/b.ts', ''), write('src/c.ts', ''), stage],
    run(dir) {
      const result = runVerify(dir, 'drift')
      return result.status === 1 && result.stderr.includes('EMPTY slot')
        ? null
        : `expected exit 1 + EMPTY slot, got exit ${result.status}: ${result.stderr.trim()}`
    },
  },
  {
    name: 'drift - filled slot, 10 files, no ticks fails as untracked',
    build: [
      write('harness/state/task-context.md', UNTRACKED_SLOT),
      ...Array.from({ length: 10 }, (_, i) => write(`src/f${i}.ts`, '')),
      stage,
    ],
    run(dir) {
      const result = runVerify(dir, 'drift')
      return result.status === 1 && result.stderr.includes('untracked')
        ? null
        : `expected exit 1 + untracked, got exit ${result.status}: ${result.stderr.trim()}`
    },
  },
  {
    name: 'drift - healthy task passes and prints the anchor line',
    build: [
      write('harness/state/task-context.md', FILLED_SLOT),
      write('src/a.ts', ''),
      write('src/b.ts', ''),
    ],
    run(dir) {
      const result = runVerify(dir, 'drift')
      return result.status === 0 && result.stdout.includes('Build the widget thing') && result.stdout.includes('step one')
        ? null
        : `expected exit 0 + anchor, got exit ${result.status}: ${result.stdout} ${result.stderr}`
    },
  },
  {
    name: 'anchor - fires exactly on the 10th edit when slot is filled',
    build: [write('harness/state/task-context.md', FILLED_SLOT)],
    async run(dir) {
      deployPlugin(dir)
      const throws = await runGate(dir, 12)
      return throws.length === 1 && throws[0].includes('Harness anchor')
        ? null
        : `expected 1 anchor throw at call 10, got ${throws.length}: ${throws[0] ?? 'none'}`
    },
  },
  {
    name: 'check - broken headers fail',
    build: [write('harness/state/task-context.md', '## Mission\n\nx\n\n## Plan\n\n## Bogus\n\n- (none)\n\n## Hand-off Note\n\n(empty)\n')],
    run(dir) {
      const result = runVerify(dir, 'check')
      return result.status === 1 && result.stderr.includes('headers broken')
        ? null
        : `expected exit 1 + headers broken, got exit ${result.status}: ${result.stderr.trim()}`
    },
  },
  {
    name: 'check - secret in slot fails',
    build: [write('harness/state/task-context.md', SLOT('key is sk-ABCDEFGHIJKLMNOP', '- [x] done'))],
    run(dir) {
      const result = runVerify(dir, 'check')
      return result.status === 1 && result.stderr.toLowerCase().includes('secret')
        ? null
        : `expected exit 1 + secret, got exit ${result.status}: ${result.stderr.trim()}`
    },
  },
  {
    name: 'check - all ticked but empty hand-off fails',
    build: [
      write('harness/state/task-context.md', '## Mission\n\nMission text\n\n## Plan\n\n- [x] done\n\n## Blockers\n\n- (none)\n\n## Hand-off Note\n\n\n'),
    ],
    run(dir) {
      const result = runVerify(dir, 'check')
      return result.status === 1 && result.stderr.includes('Hand-off Note is blank')
        ? null
        : `expected exit 1 + blank hand-off, got exit ${result.status}: ${result.stderr.trim()}`
    },
  },
  {
    name: 'adopt - full run deploys harness, scaffold, plugin and passes smoke',
    build: [],
    copyHarness: false,
    run(dir) {
      const result = spawnSync(process.execPath, [path.join(harnessRoot, 'harness', 'scripts', 'adopt.mjs'), dir, '--agents=opencode'], {
        encoding: 'utf8',
      })
      const scaffold = fs.existsSync(path.join(dir, 'AGENTS.md'))
      const plugin = fs.existsSync(path.join(dir, '.opencode', 'plugins', 'harness-gate.js'))
      const slot = fs.existsSync(path.join(dir, 'harness', 'state', 'task-context.md'))
      return result.status === 0 && scaffold && plugin && slot
        ? null
        : `expected exit 0 + scaffold + plugin + slot, got exit ${result.status} (scaffold=${scaffold} plugin=${plugin} slot=${slot}): ${result.stderr.trim()}`
    },
  },
]

for (const scenario of scenarios) {
  let dir = null
  try {
    dir = makeFixture(scenario.name.replace(/[^a-z0-9]+/gi, '-'), { copyHarness: scenario.copyHarness !== false })
    for (const step of scenario.build) step(dir)
    const problem = await scenario.run(dir)
    if (problem) {
      failed++
      console.log(`FAIL  ${scenario.name}\n      ${problem}`)
    } else {
      passed++
      console.log(`pass  ${scenario.name}`)
    }
  } catch (error) {
    failed++
    console.log(`FAIL  ${scenario.name}\n      threw: ${error.message}`)
  } finally {
    if (dir && !keep) fs.rmSync(dir, { recursive: true, force: true })
    else if (dir) console.log(`      kept: ${dir}`)
  }
}

console.log(`\nrail-spec: ${passed} passed, ${failed} failed${keep ? ' (fixtures kept)' : ''}`)
process.exit(failed ? 1 : 0)
