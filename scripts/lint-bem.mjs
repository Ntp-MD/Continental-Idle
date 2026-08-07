// BEM naming convention linter.
// Scans .vue and .css files under src/ for class names with 3 or more `__`
// separators and fails when found. Per global_rules.md / css-class-reduction.md,
// a single class name may contain at most 2 `__` separators.
//
// Run with: node scripts/lint-bem.mjs
// Exit code: 0 = pass, 1 = violations found
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const srcDir = path.resolve(root, 'src')

const TARGET_EXT = new Set(['.vue', '.css'])
const MAX_SEPARATORS = 2

// Match class attribute values in Vue templates and CSS selector lists.
// We extract candidate tokens then filter to BEM-style names (contain `__`).
const CLASS_TOKEN_RE = /(?:class\s*=\s*"([^"]+)"|class\s*=\s*'([^']+)'|:class\s*=\s*"([^"]+)"|:class\s*=\s*'([^']+)'|\.([a-zA-Z][a-zA-Z0-9_-]*))/g
const BEM_TOKEN_RE = /^[a-zA-Z][a-zA-Z0-9]*(?:__[a-zA-Z0-9_-]+)+$/

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

const files = walk(srcDir)
const violations = []

for (const file of files) {
	const content = fs.readFileSync(file, 'utf8')
	const names = extractClassNames(content)
	for (const name of names) {
		const sepCount = countSeparators(name)
		if (sepCount > MAX_SEPARATORS) {
			const rel = path.relative(root, file).replace(/\\/g, '/')
			violations.push({ file: rel, name, sepCount })
		}
	}
}

if (violations.length === 0) {
	console.log(`BEM lint: pass (scanned ${files.length} files, 0 violations)`)
	process.exit(0)
}

console.error(`BEM lint: FAIL — ${violations.length} class name(s) with more than ${MAX_SEPARATORS} \`__\` separators:\n`)
for (const v of violations) {
	console.error(`  ${v.file}: .${v.name}  (${v.sepCount} separators)`)
}
console.error(`\nFix: rename or split each violating class. Max allowed is ${MAX_SEPARATORS} \`__\` separators per class name.`)
process.exit(1)
