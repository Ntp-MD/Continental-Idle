// hverify - verify router for the AGENTS.md Verify table.
// Reads the working tree (git status) and prints ONLY the matching suite,
// then optionally runs it. Never the full matrix.
//
// Run with: node scripts/hverify.mjs [route|run]
// Exit code: 0 = pass (or route printed), 1 = a suite failed / usage error
import fs from 'node:fs'
import path from 'node:path'
import { execSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = process.env.HARNESS_ROOT
  ? path.resolve(process.env.HARNESS_ROOT)
  : path.resolve(fileURLToPath(new URL('..', import.meta.url)))

const BANS =
  'Bans: no verify/test matrix unless asked. Never test:npc-perf, test:npc-scale, test:behavior, observe:hotel unless asked.'

function changedFiles() {
  let out
  try {
    out = execSync('git status --short', { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  } catch {
    console.error('hverify: git status failed (not a git repo?)')
    process.exit(1)
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
    } else if (file.startsWith('scripts/') && file.endsWith('.mjs')) {
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

function report(files, plan) {
  if (!files.length) {
    console.log('hverify: working tree clean - nothing to verify')
    return
  }
  console.log('hverify: changed files:')
  for (const file of files) console.log(`  ${file}`)
  if (!plan.suites.length && !plan.needsEnginePick && !plan.needsSchemaPick && !plan.eslintFiles.length) {
    console.log('hverify: no code changed - nothing to run')
  }
  if (plan.suites.length) {
    console.log('hverify: run ONLY these, in order:')
    for (const suite of plan.suites) {
      if (suite.startsWith('tsx ')) console.log(`  npx ${suite}`)
      else console.log(`  npm run ${suite}`)
    }
  }
  if (plan.eslintFiles.length) {
    console.log(`  npx eslint ${plan.eslintFiles.join(' ')} --max-warnings 0   (repo lint covers scripts)`)
  }
  if (plan.needsEnginePick) {
    console.log('hverify: engine/domain TS changed - pick the SINGLE matching test:<name> (human pick required):')
    for (const name of plan.available) console.log(`  npm run ${name}`)
  }
  if (plan.needsSchemaPick) {
    console.log(
      'hverify: schema/persistence/sync changed - pick the SINGLE matching schema suite (human pick required):',
    )
    for (const name of plan.available.filter((suite) => /schema|migrate|sync|payload/.test(suite)))
      console.log(`  npm run ${name}`)
  }
  console.log(BANS)
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
    console.error('hverify: refusing to run - engine/schema change needs a human suite pick (see: hverify route)')
    process.exit(1)
  }
  if (!commands.length) {
    console.log('hverify: nothing runnable')
    return
  }
  for (const command of commands) {
    console.log(`hverify: $ ${command.label}`)
    const result = spawnSync(command.argv[0], command.argv.slice(1), { cwd: root, stdio: 'inherit', shell: true })
    if (result.status !== 0) {
      console.error(`hverify: FAILED ${command.label}`)
      process.exit(result.status ?? 1)
    }
  }
  console.log('hverify: all green')
}

const mode = process.argv[2] ?? 'route'
if (mode !== 'route' && mode !== 'run') {
  console.error('hverify: usage: node scripts/hverify.mjs [route|run]')
  process.exit(1)
}
const files = changedFiles()
const plan = route(files)
report(files, plan)
if (mode === 'run') runPlan(plan)
