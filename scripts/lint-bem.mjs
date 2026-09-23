// BEM naming convention linter.
// Two rules over every class token found in .vue templates and .css selectors:
//   1. At most 2 `__` separators per class name (global_rules.md / css-class-reduction.md).
//   2. UI state vocabulary is `flag--*` only - a state word as a modifier on any
//      other block is a second way to say "this one is the current one".
//      Domain rendering internals (`editor__tile--blocked`) and status tones are
//      not state words and stay out of rule 2.
//
// Run with: node scripts/lint-bem.mjs
// Exit code: 0 = pass, 1 = violations found
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const scanDirs = [path.resolve(root, 'src')]

const TARGET_EXT = new Set(['.vue', '.css'])
const MAX_SEPARATORS = 2

// Match class attribute values in Vue templates and CSS selector lists.
// We extract candidate tokens then filter to BEM-style names (contain `__` or `--`).
const CLASS_TOKEN_RE = /(?:class\s*=\s*"([^"]+)"|class\s*=\s*'([^']+)'|:class\s*=\s*"([^"]+)"|:class\s*=\s*'([^']+)'|\.([a-zA-Z][a-zA-Z0-9_-]*))/g
const BEM_TOKEN_RE = /^[a-zA-Z][a-zA-Z0-9]*(?:__[a-zA-Z0-9_-]+|--[a-zA-Z0-9-]+)+$/

const STATE_MODIFIERS = new Set(['active', 'selected', 'checked', 'open', 'closed', 'disabled', 'pending', 'focused'])

// `flag--active` is the sanctioned form; `card--active` is not.
function isForeignStateModifier(name) {
	const at = name.lastIndexOf('--')
	if (at < 0) return false
	if (!STATE_MODIFIERS.has(name.slice(at + 2))) return false
	return name.slice(0, at) !== 'flag'
}

function walk(dir, out = []) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name)
		if (entry.isDirectory()) walk(full, out)
		else if (TARGET_EXT.has(path.extname(entry.name))) out.push(full)
	}
	return out
}

function extractClassNames(content) {
	const names = new Set()
	let match
	CLASS_TOKEN_RE.lastIndex = 0
	while ((match = CLASS_TOKEN_RE.exec(content)) !== null) {
		// match[1..4] are quoted class attribute payloads, match[5] is a CSS `.class`
		const payload = match[1] ?? match[2] ?? match[3] ?? match[4]
		if (payload !== undefined) {
			// Split on whitespace and braces (dynamic :class bindings may contain
			// object/array syntax). Keep only bare identifiers.
			for (const tok of payload.split(/[\s{}'"`:,]+/)) {
				if (BEM_TOKEN_RE.test(tok)) names.add(tok)
			}
		} else if (match[5] !== undefined) {
			if (BEM_TOKEN_RE.test(match[5])) names.add(match[5])
		}
	}
	return names
}

function countSeparators(name) {
	return (name.match(/__/g) ?? []).length
}

const files = scanDirs.filter((dir) => fs.existsSync(dir)).flatMap((dir) => walk(dir, []))
const violations = []

for (const file of files) {
	const content = fs.readFileSync(file, 'utf8')
	const names = extractClassNames(content)
	const rel = path.relative(root, file).replace(/\\/g, '/')
	for (const name of names) {
		const sepCount = countSeparators(name)
		if (sepCount > MAX_SEPARATORS) violations.push({ file: rel, name, why: `${sepCount} \`__\` separators` })
		else if (isForeignStateModifier(name)) violations.push({ file: rel, name, why: 'UI state modifier must use the flag--* vocabulary' })
	}
}

if (violations.length === 0) {
	console.log(`BEM lint: pass (scanned ${files.length} files, 0 violations)`)
	process.exit(0)
}

console.error(`BEM lint: FAIL - ${violations.length} violating class name(s):\n`)
for (const v of violations) {
	console.error(`  ${v.file}: .${v.name}  (${v.why})`)
}
console.error(`\nFix: max ${MAX_SEPARATORS} \`__\` separators per class name; UI state is \`flag--<state>\` only.`)
process.exit(1)
