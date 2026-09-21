// adopt - copy this harness into a target project and wire the minimum refer set.
//
// Run: node <any-repo>/harness/scripts/adopt.mjs [targetRoot]
//   targetRoot defaults to the current working directory.
//
// What it does (HARNESS.md "Adopt in a new project", automated):
//   1. copies the harness folder to <target>/harness (fails if one already exists)
//   2. resets the carried state: state/task-context.md -> empty slot shape,
//      state/history.md -> preamble only, history-*.md archives dropped,
//      state/context.md glossary words wiped (rules + shape stay)
//   3. writes AGENTS.md scaffold (if missing) with the read chain + verify markers
//   4. writes agent pointers only for --agents=... (map in harness/agents/) if missing
//   5. runs verify.mjs check in the target and prints the remaining manual steps
//
// Options: --agents=cline,copilot,claude,gemini,cursor,windsurf  (default: none)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const fail = (message) => {
  console.error(`adopt: ${message}`)
  process.exit(1)
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const sourceHarness = path.resolve(scriptDir, '..')
const positional = process.argv.slice(2).filter((arg) => !arg.startsWith('--'))
const targetRoot = path.resolve(positional[0] ?? process.cwd())
const destHarness = path.join(targetRoot, 'harness')

if (!fs.existsSync(sourceHarness) || !fs.existsSync(path.join(sourceHarness, 'HARNESS.md'))) {
  fail('cannot locate the harness folder next to this script')
}
if (path.resolve(sourceHarness) === path.resolve(destHarness)) {
  fail('target equals the source harness folder - pass the destination project root as the argument')
}
if (fs.existsSync(destHarness)) {
  fail(`${destHarness} already exists - remove it first or adopt into a different target`)
}
if (!fs.existsSync(targetRoot)) fail(`target root not found: ${targetRoot}`)

// Provider -> root path map. Pointers are path-bound (see harness/agents/README.md):
// only the clients a project uses get a root file. pointer.txt is the single text source.
const AGENT_POINTERS = {
  cline: '.clinerules',
  copilot: path.join('.github', 'copilot-instructions.md'),
  claude: 'CLAUDE.md',
  gemini: 'GEMINI.md',
  cursor: '.cursorrules',
  windsurf: '.windsurfrules',
}

// opencode has no pointer file (it auto-discovers AGENTS.md) - instead adopt
// deploys its pre-call gate plugin: the loader shim goes to the only path
// opencode scans, and it re-exports the plugin source inside the copied
// harness (same relative layout as the source repo).
const OPENCODE_PLUGIN_SOURCE = path.join('agents', 'opencode', 'loader.js')
const OPENCODE_PLUGIN_TARGET = path.join('.opencode', 'plugins', 'harness-gate.js')

const agentsArg = process.argv.find((arg) => arg.startsWith('--agents='))
const requestedAgents = agentsArg
  ? agentsArg
      .slice('--agents='.length)
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean)
  : []
const unknownAgents = requestedAgents.filter((name) => name !== 'opencode' && !AGENT_POINTERS[name])
if (unknownAgents.length) {
  fail(`unknown agent(s): ${unknownAgents.join(', ')} - pick from ${Object.keys(AGENT_POINTERS).join(', ')}, opencode`)
}

const pointerText = fs.readFileSync(path.join(sourceHarness, 'agents', 'pointer.txt'), 'utf8')

const HOOK = `#!/bin/sh
# Harness gate - block commits that break the slot protocol, leak secrets, or
# carry an invalid verify table. Enable once per clone:
#   git config core.hooksPath .githooks
node harness/scripts/verify.mjs check || {
  echo "pre-commit: harness check failed (slot / secrets / verify table) - fix it, then retry (bypass: git commit --no-verify)"
  exit 1
}
`

const AGENTS_SCAFFOLD = `# AGENTS

Project instructions for AI agents. Full rules (operating mode, loop, report format)
live in \`harness/HARNESS.md\` - this file is the digest + project adapter.
Explicit user instruction > this file > \`harness/HARNESS.md\` > general best practice.

<!-- adopt scaffold: fill every <TODO>, then delete this comment block -->

## Rules digest (full text: \`harness/HARNESS.md\` - Operating mode)

- Read before writing - reuse repo patterns; zero-duplication: never a second way.
- DO directly: in-scope edits + authorized destructive in-repo content. STOP + ask:
  destructive actions outside the repo, unrequested scope growth past 3 files,
  new dependency/infra, secrets/auth change.
- Confidence >80% -> do it and state the assumption; else ask with 2-4 options + recommendation.
- Claim then impact: verify user reports against code first. Keep scope.
- Report in the HARNESS.md Report format (Changed / Decisions / Gaps / Verify).
- Direction decisions -> \`harness/state/history.md\` \`- decision:\` bullets.

## Read chain

Follow \`harness/HARNESS.md\` first for every task in this repo - it is the single source
of full rules (operating mode, loop, report format), then \`harness/state/task-context.md\`
(live slot), \`skill.md\` + \`docs/skill/\` (project patterns), \`harness/state/context.md\`
(glossary), \`harness/skills/\` (gate skills). This file adds only project adapter values.

## Project notes

<!-- TODO: disconnected folders, off-limits folders, standing orders (destructive
edit pre-authorization or its absence) - project-specific, HARNESS.md owns none of these. -->

## Verify

<!-- verify:start -->
<!-- TODO: one row per changed-file pattern. Backticked globs in the Changed cell,
backticked npm scripts in the Run cell (scripts must exist in package.json).
A row with no concrete script is a human-pick row. Example:

| Source TS (\`src/**/*.ts\`) | \`typecheck\` |
| Domain logic (\`**/domain/**\`) | the single matching \`test:<name>\` (human pick) |
-->
<!-- verify:end -->

Router: \`node harness/scripts/verify.mjs\` (route/run/check/drift) parses THIS table -
backticked globs in Changed match \`git status\` (no-slash globs match basenames,
slash globs match paths), backticked npm scripts in Run are the route; a row with
no concrete script is human-pick (the router lists the project's \`test:\` scripts,
never auto-runs). The table is the only routing source.

## Bans

<!-- TODO: no verify/test matrix unless asked; ban specific heavy suites; never
checkout/restore/reset/stash/clean tracked files - revert only by hand-editing. -->
`

const EMPTY_SLOT = `## Mission

(empty)

## Plan

- (none)

## Blockers

- (none)

## Hand-off Note

(empty - next action: await new task)
`

const GLOSSARY_EMPTY = `## Glossary

| Term | Meaning | Not |
| ---- | ------- | --- |
- (empty - terms land here as they lock, one canonical name per concept)

`

const skipped = []
const done = (label, file) => console.log(`adopt: ${label} ${path.relative(targetRoot, file)}`)

console.log(`adopt: source ${sourceHarness}`)
console.log(`adopt: target ${targetRoot}`)

// 1. copy the harness folder
fs.cpSync(sourceHarness, destHarness, { recursive: true })
done('copied', destHarness)

// 2. reset the carried state
const slotPath = path.join(destHarness, 'state', 'task-context.md')
fs.writeFileSync(slotPath, EMPTY_SLOT)
done('reset', slotPath)

const historyPath = path.join(destHarness, 'state', 'history.md')
let history = fs.readFileSync(historyPath, 'utf8')
const firstEntry = history.indexOf('\n### ')
if (firstEntry >= 0) history = history.slice(0, firstEntry)
fs.writeFileSync(historyPath, `${history.trimEnd()}\n`)
done('reset', historyPath)

for (const archive of fs.readdirSync(path.join(destHarness, 'state'))) {
  if (/^history-\d{4}-\d{2}\.md$/.test(archive)) {
    fs.rmSync(path.join(destHarness, 'state', archive))
    done('dropped archive', path.join(destHarness, 'state', archive))
  }
}

const contextPath = path.join(destHarness, 'state', 'context.md')
let context = fs.readFileSync(contextPath, 'utf8')
// line-ending tolerant - shipped files may be CRLF or LF
context = context.replace(/## Glossary[\s\S]*?## Player vocabulary/, `${GLOSSARY_EMPTY}## Player vocabulary`)
fs.writeFileSync(contextPath, context)
done('reset', contextPath)

// 3. AGENTS.md scaffold + agent pointers (skip anything that already exists)
const agentsPath = path.join(targetRoot, 'AGENTS.md')
if (fs.existsSync(agentsPath)) {
  skipped.push(agentsPath)
  console.log(`adopt: exists (skipped) ${path.relative(targetRoot, agentsPath)}`)
} else {
  fs.writeFileSync(agentsPath, AGENTS_SCAFFOLD)
  done('wrote', agentsPath)
}

const pointers = requestedAgents.filter((name) => AGENT_POINTERS[name]).map((name) => path.join(targetRoot, AGENT_POINTERS[name]))
for (const pointer of pointers) {
  if (fs.existsSync(pointer)) {
    skipped.push(pointer)
    console.log(`adopt: exists (skipped) ${path.relative(targetRoot, pointer)}`)
    continue
  }
  fs.mkdirSync(path.dirname(pointer), { recursive: true })
  fs.writeFileSync(pointer, pointerText)
  done('wrote', pointer)
}

if (requestedAgents.includes('opencode')) {
  const pluginTarget = path.join(targetRoot, OPENCODE_PLUGIN_TARGET)
  if (fs.existsSync(pluginTarget)) {
    skipped.push(pluginTarget)
    console.log(`adopt: exists (skipped) ${path.relative(targetRoot, pluginTarget)}`)
  } else {
    fs.mkdirSync(path.dirname(pluginTarget), { recursive: true })
    fs.copyFileSync(path.join(destHarness, OPENCODE_PLUGIN_SOURCE), pluginTarget)
    done('wrote', pluginTarget)
  }
}

const hookPath = path.join(targetRoot, '.githooks', 'pre-commit')
if (fs.existsSync(hookPath)) {
  skipped.push(hookPath)
  console.log(`adopt: exists (skipped) ${path.relative(targetRoot, hookPath)}`)
} else {
  fs.mkdirSync(path.dirname(hookPath), { recursive: true })
  fs.writeFileSync(hookPath, HOOK)
  fs.chmodSync(hookPath, 0o755)
  done('wrote', hookPath)
}

// 4. smoke: slot check in the target
console.log('adopt: smoke - node harness/scripts/verify.mjs check')
const { spawnSync } = await import('node:child_process')
const smoke = spawnSync(process.execPath, [path.join(destHarness, 'scripts', 'verify.mjs'), 'check'], {
  cwd: targetRoot,
  stdio: 'inherit',
})
if (smoke.status !== 0) fail('smoke check failed - fix the target slot before adopting')

// 5. remaining manual steps
console.log(
  [
    'adopt: done - remaining manual steps (see harness/HARNESS.md "Adopt in a new project"):',
    '  1. fill the <TODO> sections in AGENTS.md: verify-table rows (globs -> npm scripts) + bans',
    '  2. write skill.md (project domain) at the repo root',
    '  3. pick ONE history stamp zone (any UTC+/-H[:MM]) and use it in every entry',
    '  4. enable the commit gate: git config core.hooksPath .githooks',
    '  5. add other agent pointers only if used: copy harness/agents/pointer.txt to the',
    '     provider root path (map: harness/agents/README.md; or rerun with --agents=...)',
    ...(skipped.length
      ? ['adopt: skipped existing files:', ...skipped.map((f) => `  - ${path.relative(targetRoot, f)}`)]
      : []),
    '',
  ].join('\n')
)

