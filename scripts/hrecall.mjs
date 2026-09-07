// hrecall - keyword retrieval over _archive/history.md.
// Pulls the entries relevant to a question so agents stop re-reading the
// whole board. Set HARNESS_ROOT to point at another repo root.
//
// Run with: node scripts/hrecall.mjs <query...> [--limit N] [--json]
// Exit code: 0 = ok (even with zero matches), 1 = usage error
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { harnessPaths, parseArgs, parseHistoryEntries } from './hslot.mjs'

function tokens(text) {
  return text
    .toLowerCase()
    .split(/[\s,;:.!?()"'`|\-[\]{}]+/)
    .filter(Boolean)
}

function scoreEntry(entry, words) {
  const title = entry.title.toLowerCase()
  let score = 0
  for (const word of words) {
    if (title.includes(word)) score += 3
    for (const bullet of entry.bullets) {
      if (bullet.toLowerCase().includes(word)) score += 1
    }
  }
  return score
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const query = args._.join(' ')
  if (!query) {
    console.error('hrecall: usage: node scripts/hrecall.mjs <query...> [--limit N] [--json]')
    process.exit(1)
  }
  const limit = args.limit === undefined ? 5 : Number(args.limit)
  if (!Number.isInteger(limit) || limit < 1) {
    console.error('hrecall: --limit must be a positive integer')
    process.exit(1)
  }
  const { historyPath } = harnessPaths()
  if (!fs.existsSync(historyPath)) {
    console.error('hrecall: history file missing')
    process.exit(1)
  }
  const { entries } = parseHistoryEntries(fs.readFileSync(historyPath, 'utf8'))
  const words = tokens(query)
  const ranked = entries
    .map((entry) => ({ entry, score: scoreEntry(entry, words) }))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score || (b.entry.date ?? 0) - (a.entry.date ?? 0))
    .slice(0, limit)
  if (args.json) {
    console.log(
      JSON.stringify(
        ranked.map((hit) => ({
          title: hit.entry.title,
          stamp: hit.entry.stamp,
          agent: hit.entry.agent,
          model: hit.entry.model,
          score: hit.score,
          details: hit.entry.bullets,
        })),
        null,
        2,
      ),
    )
    return
  }
  if (!ranked.length) {
    console.log(`hrecall: no entries match "${query}"`)
    return
  }
  for (const hit of ranked) {
    const who = hit.entry.model ? `${hit.entry.agent}, ${hit.entry.model}` : hit.entry.agent
    console.log(`### ${hit.entry.title} - ${hit.entry.stamp} (${who})  [score ${hit.score}]`)
    for (const bullet of hit.entry.bullets) console.log(`- ${bullet}`)
    console.log('')
  }
}

const invoked = process.argv[1] ? path.resolve(process.argv[1]) : ''
if (invoked === fileURLToPath(import.meta.url)) main()
