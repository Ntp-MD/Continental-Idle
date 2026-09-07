// hpack - assemble a versioned agent-harness bundle from repo sources.
// The bundle is build output (never checked in): skills, scripts, archive
// templates, HARNESS.md, plus install.mjs. Single source of truth stays here.
//
// Run with: node scripts/hpack.mjs [--out dist/agent-harness] [--version NAME] [--zip]
// Exit code: 0 = ok, 1 = usage error or build failure
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)))

const SOURCES = [
  ['.opencode/skills/session-handoff/SKILL.md', 'skills/session-handoff/SKILL.md'],
  ['.opencode/skills/autonomous-development/SKILL.md', 'skills/autonomous-development/SKILL.md'],
  ['.opencode/skills/normalize-audit/SKILL.md', 'skills/normalize-audit/SKILL.md'],
  ['scripts/hslot.mjs', 'scripts/hslot.mjs'],
  ['scripts/hverify.mjs', 'scripts/hverify.mjs'],
  ['scripts/hrecall.mjs', 'scripts/hrecall.mjs'],
  ['scripts/harness-install.mjs', 'install.mjs'],
  ['HARNESS.md', 'HARNESS.md'],
  ['_archive/history-template.md', 'archive/history-template.md'],
]

const SLOT_HEADERS = [
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

function emptySlot() {
  return SLOT_HEADERS.map((header) => `## ${header}\n`).join('\n') + '\n'
}

function freshHistory() {
  return '# History - shared cross-agent intent log\n\nEntries only. Protocol + pattern live in `history-template.md` - follow them when logging below.\n\n## Entries (Doing - Finished (Agent, Model) + Detail Bullets)\n\n- (empty - first finished task adds the first entry here)\n'
}

function fail(message) {
  console.error(`hpack: ${message}`)
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

function datestamp() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .formatToParts(new Date())
    .reduce((acc, part) => {
      acc[part.type] = part.value
      return acc
    }, {})
  return `${parts.year}.${parts.month}.${parts.day}`
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const out = path.resolve(root, args.out ?? 'dist/agent-harness')
  const version = args.version ?? `harness-${datestamp()}`
  if (fs.existsSync(out) && fs.readdirSync(out).length > 0 && !args.force) {
    fail(`out dir not empty: ${out} (pass --force to rebuild)`)
  }
  for (const [source] of SOURCES) {
    if (!fs.existsSync(path.join(root, source))) fail(`source missing: ${source}`)
  }
  fs.rmSync(out, { recursive: true, force: true })
  const files = []
  for (const [source, dest] of SOURCES) {
    const target = path.join(out, dest)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.copyFileSync(path.join(root, source), target)
    files.push(dest)
  }
  fs.mkdirSync(path.join(out, 'archive'), { recursive: true })
  fs.writeFileSync(path.join(out, 'archive', 'current-task.md'), emptySlot())
  fs.writeFileSync(path.join(out, 'archive', 'history.md'), freshHistory())
  files.push('archive/current-task.md', 'archive/history.md')
  fs.writeFileSync(path.join(out, 'VERSION'), `${version}\n`)
  const manifest = {
    version,
    built: new Date().toISOString(),
    files: [...files, 'VERSION', 'MANIFEST.json'].sort(),
    notes:
      'ui-layout skill is blueprint-editor-specific and intentionally excluded; copy it manually if the target needs it.',
  }
  fs.writeFileSync(path.join(out, 'MANIFEST.json'), JSON.stringify(manifest, null, 2) + '\n')
  console.log(`hpack: ${files.length} payload files + VERSION + MANIFEST.json -> ${out} (${version})`)
  if (args.zip) {
    try {
      const archive = `${out}.tar.gz`
      execSync(`tar -czf "${archive}" -C "${path.dirname(out)}" "${path.basename(out)}"`, { stdio: 'ignore' })
      console.log(`hpack: ${archive}`)
    } catch {
      fail('system tar unavailable - zip the bundle dir manually')
    }
  }
}

main()
