// harness-install - install the agent-harness bundle into a target project.
// Runs from inside the bundle root (shipped as install.mjs by hpack).
// Idempotent: re-runs never duplicate wiring and never touch a live slot.
//
// Run with: node install.mjs --root /path/to/project [--state-dir _archive] [--skills-dir .opencode/skills] [--force]
// Exit code: 0 = ok, 1 = usage error or install failure
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const bundleRoot = path.dirname(fileURLToPath(import.meta.url))

const SKILLS = ['session-handoff', 'autonomous-development', 'normalize-audit']
const SCRIPTS = ['hslot.mjs', 'hverify.mjs', 'hrecall.mjs']
const SHORTCUTS = {
  hslot: 'node scripts/hslot.mjs',
  hverify: 'node scripts/hverify.mjs',
  hrecall: 'node scripts/hrecall.mjs',
  hcheck: 'node scripts/hslot.mjs check',
}

function fail(message) {
  console.error(`install: ${message}`)
  process.exit(1)
}

function parseArgs(raw) {
  const args = { _: [] }
  for (let i = 0; i < raw.length; i++) {
    const token = raw[i]
    if (token.startsWith('--')) {
      const key = token.slice(2)
      const next = raw[i + 1]
      if (next === undefined || next.startsWith('--')) args[key] = true
      else {
        args[key] = next
        i++
      }
    } else {
      args._.push(token)
    }
  }
  return args
}

function managedBlock(stateDir, skillsDir) {
  return (
    `<!-- harness:start (managed by agent-harness installer - keep markers, edit around them) -->\n` +
    `## Agent Harness (managed)\n\n` +
    `- Skills live under \`${skillsDir}/\`: \`session-handoff\` (live slot + done-log), \`autonomous-development\` (workflow + plan template), \`normalize-audit\` (data-flow preflight). Read the matching skill before work.\n` +
    `- Live slot \`${stateDir}/current-task.md\`: update after every meaningful step, clear when done. Done-log \`${stateDir}/history.md\`.\n` +
    `- Verify router: \`npm run hverify\` (route = print, run = execute) runs ONLY the matching suite for current changes.\n` +
    `- Story: \`HARNESS.md\`.\n` +
    `<!-- harness:end -->\n`
  )
}

function copyTree(fromDir, toDir, force, log) {
  let copied = 0
  let skipped = 0
  for (const entry of fs.readdirSync(fromDir, { withFileTypes: true })) {
    const from = path.join(fromDir, entry.name)
    const to = path.join(toDir, entry.name)
    if (entry.isDirectory()) {
      const child = copyTree(from, to, force, log)
      copied += child.copied
      skipped += child.skipped
    } else {
      fs.mkdirSync(path.dirname(to), { recursive: true })
      if (fs.existsSync(to) && !force) {
        skipped++
        log.push(`skip (exists): ${path.relative(process.cwd(), to)}`)
      } else {
        fs.copyFileSync(from, to)
        copied++
      }
    }
  }
  return { copied, skipped }
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const target = path.resolve(args.root ?? process.cwd())
  const stateDir = args['state-dir'] ?? '_archive'
  const skillsDir = args['skills-dir'] ?? '.opencode/skills'
  const force = Boolean(args.force)
  const log = []
  if (!fs.existsSync(target)) fail(`target root missing: ${target}`)

  for (const name of SKILLS) {
    const from = path.join(bundleRoot, 'skills', name)
    if (!fs.existsSync(from)) fail(`bundle payload missing: skills/${name}`)
    const result = copyTree(from, path.join(target, skillsDir, name), force, log)
    log.push(`skills/${name}: ${result.copied} copied, ${result.skipped} skipped`)
  }
  const scriptResult = { copied: 0, skipped: 0 }
  for (const name of SCRIPTS) {
    const from = path.join(bundleRoot, 'scripts', name)
    if (!fs.existsSync(from)) fail(`bundle payload missing: scripts/${name}`)
    const to = path.join(target, 'scripts', name)
    fs.mkdirSync(path.dirname(to), { recursive: true })
    if (fs.existsSync(to) && !force) {
      scriptResult.skipped++
      log.push(`skip (exists): scripts/${name}`)
    } else {
      fs.copyFileSync(from, to)
      scriptResult.copied++
    }
  }
  log.push(`scripts: ${scriptResult.copied} copied, ${scriptResult.skipped} skipped`)

  fs.mkdirSync(path.join(target, stateDir), { recursive: true })
  const slot = path.join(target, stateDir, 'current-task.md')
  if (fs.existsSync(slot)) {
    log.push('slot: kept existing current-task.md (never overwritten)')
  } else {
    fs.copyFileSync(path.join(bundleRoot, 'archive', 'current-task.md'), slot)
    log.push('slot: wrote empty current-task.md')
  }
  for (const name of ['history.md', 'history-template.md']) {
    const to = path.join(target, stateDir, name)
    if (fs.existsSync(to) && !force) {
      log.push(`skip (exists): ${stateDir}/${name}`)
    } else {
      fs.copyFileSync(
        path.join(bundleRoot, 'archive', name === 'history.md' ? 'history.md' : 'history-template.md'),
        to,
      )
      log.push(`wrote: ${stateDir}/${name}`)
    }
  }
  const doc = path.join(target, 'HARNESS.md')
  if (fs.existsSync(doc) && !force) {
    log.push('skip (exists): HARNESS.md')
  } else {
    fs.copyFileSync(path.join(bundleRoot, 'HARNESS.md'), doc)
    log.push('wrote: HARNESS.md')
  }

  const pkgFile = path.join(target, 'package.json')
  if (!fs.existsSync(pkgFile)) {
    log.push('skip: no package.json (add hslot/hverify/hrecall/hcheck shortcuts manually)')
  } else {
    const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'))
    pkg.scripts = pkg.scripts ?? {}
    const added = []
    for (const [name, cmd] of Object.entries(SHORTCUTS)) {
      if (pkg.scripts[name] === undefined) {
        pkg.scripts[name] = cmd
        added.push(name)
      }
    }
    if (added.length) {
      fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 2) + '\n')
      log.push(`package.json: added ${added.join(', ')}`)
    } else {
      log.push('package.json: shortcuts already present')
    }
    const tests = Object.keys(pkg.scripts).filter((name) => name.startsWith('test:'))
    if (tests.length) {
      log.push(`target test scripts (wire these into the AGENTS.md Verify table): ${tests.join(', ')}`)
    } else {
      log.push('target has no test:* scripts yet - define them, then wire the Verify table')
    }
  }

  const agentsFile = path.join(target, 'AGENTS.md')
  const block = managedBlock(stateDir, skillsDir)
  if (!fs.existsSync(agentsFile)) {
    fs.writeFileSync(
      agentsFile,
      '# AGENTS\n\nRepo instructions for AI agents. Explicit user instruction > this file > general best practice.\n\n' +
        block,
    )
    log.push('wrote: minimal AGENTS.md with managed harness block')
  } else {
    const text = fs.readFileSync(agentsFile, 'utf8')
    const start = text.indexOf('<!-- harness:start')
    const end = text.indexOf('<!-- harness:end -->')
    if (start >= 0 && end > start) {
      const next = text.slice(0, start) + block + text.slice(end + '<!-- harness:end -->'.length)
      fs.writeFileSync(agentsFile, next)
      log.push('AGENTS.md: refreshed managed harness block')
    } else {
      const sep = text.endsWith('\n') ? '\n' : '\n\n'
      fs.writeFileSync(agentsFile, text + sep + block)
      log.push('AGENTS.md: appended managed harness block')
    }
  }

  console.log(`install: target ${target}`)
  for (const line of log) console.log(`  ${line}`)
  console.log('install: next: restart opencode, then run `npm run hcheck` (or: node scripts/hslot.mjs check)')
}

main()
