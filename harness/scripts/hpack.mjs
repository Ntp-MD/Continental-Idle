// hpack - assemble a versioned agent-harness bundle from repo sources.
// Skills live at .opencode/skills/ (runtime home, read by opencode); hpack
// copies them into the bundle as skills/<name>/SKILL.md. The rest of the
// harness tool (scripts, templates, story doc, INSTALL payload, README)
// lives at harness/. Single source of truth stays in the repo.
//
// Run with: node harness/scripts/hpack.mjs [--out dist/agent-harness] [--version NAME] [--zip]
// Exit code: 0 = ok, 1 = usage error or build failure
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const harnessRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const repoRoot = path.resolve(harnessRoot, '..')

// [source, dest] where source is relative to repo root, dest is relative
// to the bundle root. Skill source paths escape harness/ on purpose.
const SOURCES = [
  ['.opencode/skills/session-handoff/SKILL.md', 'skills/session-handoff/SKILL.md'],
  ['.opencode/skills/autonomous-development/SKILL.md', 'skills/autonomous-development/SKILL.md'],
  ['.opencode/skills/normalize-audit/SKILL.md', 'skills/normalize-audit/SKILL.md'],
  ['.opencode/skills/ui-layout/SKILL.md', 'skills/ui-layout/SKILL.md'],
  ['harness/scripts/hslot.mjs', 'scripts/hslot.mjs'],
  ['harness/scripts/hverify.mjs', 'scripts/hverify.mjs'],
  ['harness/scripts/hrecall.mjs', 'scripts/hrecall.mjs'],
  ['harness/scripts/harness-install.mjs', 'install.mjs'],
  ['harness/README.md', 'README.md'],
  ['harness/HARNESS.md', 'HARNESS.md'],
  ['harness/INSTALL.md', 'INSTALL.md'],
  ['harness/templates/current-task.md', 'templates/current-task.md'],
  ['harness/templates/history.md', 'templates/history.md'],
  ['harness/templates/history-template.md', 'templates/history-template.md'],
]

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
  const out = path.resolve(harnessRoot, args.out ?? 'dist/agent-harness')
  const version = args.version ?? `harness-${datestamp()}`
  if (fs.existsSync(out) && fs.readdirSync(out).length > 0 && !args.force) {
    fail(`out dir not empty: ${out} (pass --force to rebuild)`)
  }
  for (const [source] of SOURCES) {
    if (!fs.existsSync(path.join(repoRoot, source))) fail(`source missing: ${source}`)
  }
  fs.rmSync(out, { recursive: true, force: true })
  const files = []
  for (const [source, dest] of SOURCES) {
    const target = path.join(out, dest)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.copyFileSync(path.join(repoRoot, source), target)
    files.push(dest)
  }
  fs.writeFileSync(path.join(out, 'VERSION'), `${version}\n`)
  const manifest = {
    version,
    built: new Date().toISOString(),
    files: [...files, 'VERSION', 'MANIFEST.json'].sort(),
    notes:
      'Full harness bundle: skills + scripts + templates + INSTALL.md. Install with: node install.mjs --root /path/to/target',
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
