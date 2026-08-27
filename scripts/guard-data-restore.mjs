import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataPath = path.join(root, 'src', 'blueprint-editor', 'data', 'originAssets.data.ts')

function readIds(source) {
  try {
    const m = source.match(/"id"\s*:\s*"([^"]+)"/g) || []
    return m.map(s => s.match(/"id"\s*:\s*"([^"]+)"/)[1])
  } catch { return [] }
}

function readCurrent() {
  const src = fs.readFileSync(dataPath, 'utf8')
  return new Set(readIds(src))
}

function readAtRef(ref) {
  try {
    const src = execSync(`git show ${ref}:src/blueprint-editor/data/originAssets.data.ts`, { encoding: 'utf8', stdio: ['ignore','pipe','ignore'] })
    return new Set(readIds(src))
  } catch { return null }
}

const current = readCurrent()
const head = readAtRef('HEAD')
const headPrev = readAtRef('HEAD~1')

if (!head || !headPrev) {
  console.log('guard-data-restore: no history to compare, pass')
  process.exit(0)
}

const deletedInHead = [...headPrev].filter(id => !head.has(id))
if (deletedInHead.length === 0) {
  console.log('guard-data-restore: no deletions in last commit, pass')
  process.exit(0)
}

const restored = deletedInHead.filter(id => current.has(id))
if (restored.length > 0) {
  console.error(`guard-data-restore FAIL: restored previously deleted origin assets: ${restored.join(', ')}`)
  console.error('This usually means `git checkout HEAD -- src/blueprint-editor/data/*` was run. Delete intentionally? Remove ids from git history or set ALLOW_DATA_RESTORE=1 to bypass.')
  if (process.env.ALLOW_DATA_RESTORE === '1') {
    console.warn('ALLOW_DATA_RESTORE=1 — bypassing guard')
    process.exit(0)
  }
  process.exit(1)
}

console.log('guard-data-restore: pass')
