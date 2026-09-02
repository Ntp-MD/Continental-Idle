// CSS compliance linter for docs/agents/css.md.
// Checks, project-wide across src/, for the rules that are unambiguous to automate:
//   1. No static inline style="..." in <template> (dynamic :style is allowed).
//   2. No !important in any stylesheet.
//   3. No hardcoded z-index (must use the --z-layer-* theme tokens).
//   4. No shared stylesheet class redefined as a top-level block in a component's
//      scoped <style>. Compound/parent-scoped overrides (.parent .shared) are allowed.
// Run with: node scripts/lint-css-compliance.mjs
// Exit code: 0 = pass, 1 = violations found
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const srcDir = path.resolve(root, 'src')
const TARGET_EXT = new Set(['.vue', '.css'])

function walk(dir, out = []) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name)
		if (entry.isDirectory()) walk(full, out)
		else if (TARGET_EXT.has(path.extname(entry.name))) out.push(full)
	}
	return out
}

function toPosix(p) {
	return p.replace(/\\/g, '/')
}

function readAll(files, ext) {
	return files.filter((f) => f.endsWith(ext)).map((f) => ({ rel: toPosix(path.relative(root, f)), content: fs.readFileSync(f, 'utf8') }))
}

// -- rule 1: static inline style in <template> ----------------------------------
function findStaticInlineStyle(items) {
	const issues = []
	const re = /(?<!:)style\s*=\s*"/g
	for (const { rel, content } of items) {
		const tm = content.match(/<template>([\s\S]*?)<\/template>/)
		if (!tm) continue
		for (const [, , ] of tm[1].matchAll(re)) issues.push(`${rel}: static inline style="..."`)
	}
	return issues
}

// -- rule 2 & 3: !important and hardcoded z-index in stylesheets -----------------
const HARDCODED_Z_RE = /z-index\s*:\s*(?!var\()\s*[0-9]/g
const IMPORTANT_RE = /!\s*important/gi

function findCssRuleIssues(items) {
	const issues = []
	const seen = new Set()
	for (const { rel, content } of items) {
		const cssFromVue = content.match(/<style[^>]*>([\s\S]*?)<\/style>/)
		const css = cssFromVue ? cssFromVue[1] : content
		for (const [re, label] of [[IMPORTANT_RE, '!important'], [HARDCODED_Z_RE, 'hardcoded z-index (use --z-layer-*)']]) {
			for (const [, ] of css.matchAll(re)) {
				const key = `${rel}:${label}`
				if (!seen.has(key)) {
					seen.add(key)
					issues.push(`${rel}: ${label}`)
				}
			}
		}
	}
	return issues
}

// -- rule 4: shared classes redefined as top-level blocks in scoped styles ------
const CLASS_TOKEN_RE = /\.([A-Za-z][A-Za-z0-9_-]*)/g
const TOP_LEVEL_SELECTOR_RE = /(?:^|[\n,{])[ \t]*\.([A-Za-z][A-Za-z0-9_-]*)[ \t]*\{/g

function collectDefinedShapes(css, store) {
	for (const [, name] of css.matchAll(CLASS_TOKEN_RE)) store.add(name)
}

function findScopedRedefined(items) {
	const sharedTargets = new Set()
	for (const { rel, content } of items) {
		if (rel.endsWith('styles/components.css')) collectDefinedShapes(content, sharedTargets)
	}
	const issues = []
	for (const { rel, content } of items) {
		const scoped = content.match(/<style[^>]*>([\s\S]*?)<\/style>/)
		if (!scoped) continue
		for (const [, name] of scoped[1].matchAll(TOP_LEVEL_SELECTOR_RE)) {
			if (sharedTargets.has(name)) issues.push(`${rel}: shared class .${name} redefined in scoped style`)
		}
	}
	return issues
}

const files = walk(srcDir)
const vueFiles = readAll(files, '.vue')
const cssFiles = readAll(files, '.css')

const issues = [
	...findStaticInlineStyle(vueFiles),
	...findCssRuleIssues([...vueFiles, ...cssFiles]),
	...findScopedRedefined([...vueFiles, ...cssFiles]),
]

if (issues.length === 0) {
	console.log(`CSS compliance: pass (scanned ${files.length} files, 0 violations)`)
	process.exit(0)
}

console.error(`CSS compliance: FAIL - ${issues.length} violation(s):`)
for (const i of [...new Set(issues)]) console.error(`  ${i}`)
process.exit(1)