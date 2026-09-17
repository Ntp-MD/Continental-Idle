// probe-agent - check that the active agent actually receives the harness.
//
// Two independent levels:
//   1. wiring  (always, free): `opencode debug config` must list the project
//      instructions (harness/HARNESS.md). Proves the config reaches the agent.
//   2. context (opt-in via --model, costs tokens): send a canary only HARNESS.md
//      can answer and assert the model answers with ZERO tool calls. If it had
//      to read a file first, the instructions were not injected.
//
// Usage:
//   node harness/scripts/probe-agent.mjs
//   node harness/scripts/probe-agent.mjs --model cline-pass/cline-pass/deepseek-v4.1-flash
//   node harness/scripts/probe-agent.mjs --opencode "C:\path\to\opencode.exe" --model <id>
//
// Exit code: 0 = all run checks passed, 1 = a check failed.
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = path.resolve(fileURLToPath(new URL('../..', import.meta.url)))
const args = process.argv.slice(2)

function argValue(name) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : undefined
}

function resolveOpencode() {
  const explicit = argValue('--opencode')
  if (explicit) return explicit
  const local = process.env.USERPROFILE ? path.join(process.env.USERPROFILE, '.opencode', 'opencode.exe') : null
  return local && fs.existsSync(local) ? local : 'opencode'
}

const opencode = resolveOpencode()
const model = argValue('--model')
const CANARY = 'Without reading any files or calling tools, answer in one line: (1) the four required section headers of harness/state/task-context.md in order, (2) the non-meta file-count threshold that makes a task lite.'
const EXPECT = ['Mission', 'Hand-off Note', 'one']

let failed = 0
function check(name, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` - ${detail}` : ''}`)
  if (!ok) failed++
}

function runOpc(args) {
  return spawnSync(opencode, args, { cwd: root, encoding: 'utf8' })
}

console.log(`probe-agent: opencode=${opencode}`)
console.log(`probe-agent: root=${root}`)

// Level 1 - wiring.
{
  const result = runOpc(['debug', 'config'])
  let config = null
  try {
    config = JSON.parse(result.stdout)
  } catch {
    check('wiring: opencode debug config parses', false, result.stderr?.trim() || 'no JSON output')
  }
  if (config) {
    const instructions = Array.isArray(config.instructions) ? config.instructions : []
    check('wiring: instructions loaded', instructions.length > 0, instructions.join(', ') || 'none')
    check('wiring: harness/HARNESS.md is injected', instructions.some((entry) => entry.includes('HARNESS.md')))
  }
}

// Level 2 - context injection (opt-in).
if (!model) {
  console.log('SKIP  context: pass --model <provider/model> to run the canary (calls the model)')
} else {
  const result = runOpc(['run', '-m', model, '--format', 'json', CANARY])
  const lines = (result.stdout ?? '').split('\n').filter(Boolean)
  const events = lines.map((line) => {
    try {
      return JSON.parse(line)
    } catch {
      return null
    }
  }).filter(Boolean)
  const errored = events.find((event) => event.type === 'error')
  if (errored) {
    check('context: model call succeeded', false, errored.error?.data?.message ?? 'error event')
  } else {
    const toolEvents = events.filter((event) => JSON.stringify(event).includes('"tool'))
    const text = events.filter((event) => event.type === 'text').map((event) => event.part?.text ?? '').join(' ')
    check('context: no tool calls (instructions were injected)', toolEvents.length === 0, `${toolEvents.length} tool event(s)`)
    const missing = EXPECT.filter((needle) => !text.toLowerCase().includes(needle.toLowerCase()))
    check('context: canary answered from context', missing.length === 0, missing.length ? `missing: ${missing.join(', ')}` : text.trim().slice(0, 120))
  }
}

console.log(failed === 0 ? 'probe-agent: OK' : `probe-agent: ${failed} check(s) failed`)
process.exit(failed === 0 ? 0 : 1)
