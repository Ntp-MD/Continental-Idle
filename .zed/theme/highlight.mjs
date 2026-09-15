// Server-side tree-sitter highlighting for the theme map.
// highlight(lang, code) -> HTML spans painted with the live settings.json theme.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Parser from 'web-tree-sitter'

const dir = path.dirname(fileURLToPath(import.meta.url))
const wasmDir = path.join(dir, 'node_modules', 'tree-sitter-wasms', 'out')
const queryDir = path.join(dir, 'queries')
const settingsPath = path.join(dir, 'settings.json')

await Parser.init()

const { Language } = Parser

const GRAMMAR = { javascript: 'javascript', typescript: 'typescript', tsx: 'tsx', html: 'html', css: 'css', json: 'json' }
const QUERY_FILES = {
  javascript: ['ecma.scm', 'jsx.scm', 'javascript.scm'],
  typescript: ['ecma.scm', 'typescript.scm'],
  tsx: ['ecma.scm', 'jsx.scm', 'typescript.scm'],
  html: ['html.scm', 'html_tags.scm'],
  css: ['css.scm'],
  json: ['json.scm'],
}

const langs = new Map()
const queries = new Map()

async function getLang(lang) {
  if (!langs.has(lang)) {
    langs.set(lang, await Language.load(path.join(wasmDir, `tree-sitter-${GRAMMAR[lang]}.wasm`)))
  }
  return langs.get(lang)
}

function getQuery(lang) {
  if (!queries.has(lang)) {
    const scm = QUERY_FILES[lang]
      .map((f) => fs.readFileSync(path.join(queryDir, f), 'utf8'))
      .join('\n')
      .split('\n')
      .filter((line) => !/^\s*;\s*inherits:/.test(line))
      .map((line) => line.replace(/\(#set![^()]*\)/g, ''))
      .join('\n')
    queries.set(lang, { scm, compiled: new Map() })
  }
  return queries.get(lang)
}

function theme() {
  const raw = fs.readFileSync(settingsPath, 'utf8')
  const clean = raw
    .split('\n')
    .filter((line) => !/^\s*\/\//.test(line))
    .join('\n')
  return JSON.parse(clean)['experimental.theme_overrides']?.syntax ?? {}
}

function esc(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const SKIP = new Set(['spell', 'nospell', 'conceal', 'none'])

// Resolve a capture to a theme key: full name, then strip trailing
// segments (tag.delimiter -> tag) so navigation always lands on a card.
function resolveKey(syn, name) {
  let key = name
  while (key) {
    if (syn[key]) return key
    const dot = key.lastIndexOf('.')
    if (dot < 0) break
    key = key.slice(0, dot)
  }
  return ''
}

export async function highlight(lang, code) {
  if (!GRAMMAR[lang]) throw new Error(`no grammar for ${lang}`)
  if (code.length > 20000) throw new Error('code too long')
  const language = await getLang(lang)
  const parser = new Parser()
  parser.setLanguage(language)
  const tree = parser.parse(code)
  const { scm, compiled } = getQuery(lang)
  if (!compiled.has(language)) compiled.set(language, language.query(scm))
  const query = compiled.get(language)
  const buf = Buffer.from(code, 'utf8')
  const syn = theme()
  const fg = '#6e7681'

  const caps = []
  for (const cap of query.captures(tree.rootNode)) {
    const name = cap.name.split('.').filter((part) => !SKIP.has(part)).join('.')
    if (!name) continue
    caps.push({ name, start: cap.node.startIndex, end: cap.node.endIndex })
  }
  caps.sort((a, b) => a.start - b.start || a.end - b.end - (a.end - a.start))

  // inner-first wins: claim ranges, outer captures fill only unclaimed gaps
  const claimed = []
  const spans = []
  const covered = (s, e) => claimed.some(([a, b]) => s >= a && e <= b)
  for (const cap of caps) {
    if (cap.end <= cap.start || covered(cap.start, cap.end)) continue
    // carve around already-claimed subranges
    let cursor = cap.start
    const holes = claimed
      .filter(([a, b]) => a < cap.end && b > cap.start)
      .sort((x, y) => x[0] - y[0])
    const parts = []
    for (const [a, b] of holes) {
      if (a > cursor) parts.push([cursor, Math.min(a, cap.end)])
      cursor = Math.max(cursor, b)
    }
    if (cursor < cap.end) parts.push([cursor, cap.end])
    for (const [s, e] of parts) {
      spans.push({ ...cap, start: s, end: e })
      claimed.push([s, e])
    }
  }
  spans.sort((a, b) => a.start - b.start)

  const styleFor = (name) => {
    const key = resolveKey(syn, name)
    const hit = key ? syn[key] : null
    return { key, color: hit?.color ?? fg, style: hit?.font_weight === 700 ? 'bold' : hit?.font_style === 'italic' ? 'italic' : '' }
  }

  let out = ''
  let cursor = 0
  for (const sp of spans) {
    if (sp.start > cursor) out += esc(buf.slice(cursor, sp.start).toString('utf8'))
    const st = styleFor(sp.name)
    const css = `color:${st.color}${st.style === 'bold' ? ';font-weight:bold' : ''}${st.style === 'italic' ? ';font-style:italic' : ''}`
    const nav = st.key ? ` class="hot" data-goto="syntax.${st.key}" onclick="goto(this)"` : ''
    out += `<span${nav} style="${css}">${esc(buf.slice(sp.start, sp.end).toString('utf8'))}</span>`
    cursor = sp.end
  }
  out += esc(buf.slice(cursor).toString('utf8'))
  return out
}
