// CSS compliance linter for docs/agents/css.md.
// Checks, project-wide across src/, for the rules that are unambiguous to automate:
//   1. No static inline style="..." in <template> (dynamic :style is allowed).
//   2. No !important in any stylesheet.
//   3. No hardcoded z-index (must use the --z-layer-* theme tokens).
//   4. No shared stylesheet class redefined as a top-level block in a component's
//      scoped <style>. Compound/parent-scoped overrides (.parent .shared) are allowed.
//   5. No orphan classes: every BEM token named in a template class/:class
//      attribute must be defined in some stylesheet under src/.
//   6. No dead selectors: every defined BEM selector must be referenced in a
//      template, binding, or script/TS source under src/. CSS-to-CSS references
//      do not count (rule 4 owns scoped overrides); docs do not count.
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
const tsFiles = files.filter((f) => f.endsWith('.ts')).map((f) => ({ rel: toPosix(path.relative(root, f)), content: fs.readFileSync(f, 'utf8') }))

// -- rules 5 & 6: shared shape inventory ---------------------------------------
// Tokens containing __ or -- are project classes and must resolve. Bare words
// (a, selectedCard) also appear as JS identifiers, so they are out of scope.
const CLASSY_TOKEN_RE = /^[A-Za-z][A-Za-z0-9-]*(?:__[A-Za-z0-9_-]+|--[A-Za-z0-9-]+)+$/
const BOUND = '(?![A-Za-z0-9_-])'

function noStyle(content) {
	return content.replace(/<style[^>]*>[\s\S]*?<\/style>/g, '\n')
}

function collectDefinedShapesMulti(items, store) {
	for (const { rel, content } of items) {
		const blocks = rel.endsWith('.vue')
			? [...content.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1])
			: [content]
		for (const css of blocks) {
			for (const [, name] of css.matchAll(CLASS_TOKEN_RE)) {
				if (!CLASSY_TOKEN_RE.test(name)) continue
				if (!store.has(name)) store.set(name, new Set())
				store.get(name).add(rel)
			}
		}
	}
}

function templateTokens(content) {
	const names = new Set()
	const attr = /(?::)?class\s*=\s*("([^"]*)"|'([^']*)')/g
	let m
	const body = noStyle(content)
	while ((m = attr.exec(body)) !== null) {
		for (const tok of (m[2] ?? m[3]).split(/[\s{}'"`:,]+/)) {
			if (CLASSY_TOKEN_RE.test(tok)) names.add(tok)
		}
	}
	return names
}

// -- rule 5: orphan classes -----------------------------------------------------
function findOrphanClasses(vueItems, defined) {
	const issues = []
	for (const { rel, content } of vueItems) {
		for (const name of templateTokens(content)) {
			if (!defined.has(name)) issues.push(`${rel}: orphan class .${name} (no definition under src/)`)
		}
	}
	return issues
}

// -- rule 6: dead selectors -----------------------------------------------------
const RUNTIME_SVG_CLASSES = new Set(['svg-role__wall'])

function interpolationPrefixes(items) {
	const out = new Set()
	for (const { content } of items) {
		for (const [, pre] of noStyle(content).matchAll(/([A-Za-z][A-Za-z0-9_-]*?)\$\{/g)) out.add(pre)
	}
	return out
}

function findDeadSelectors(vueItems, tsItems, defined) {
	const prefixes = interpolationPrefixes([...vueItems, ...tsItems])
	const haystacks = [
		...vueItems.map(({ content }) => noStyle(content)),
		...tsItems.map((i) => i.content),
	]
	const issues = []
	for (const [name, owners] of defined) {
		if (RUNTIME_SVG_CLASSES.has(name)) continue
		if ([...prefixes].some((pre) => name.startsWith(pre))) continue
		const re = new RegExp(name + BOUND)
		if (!haystacks.some((h) => re.test(h))) {
			issues.push(`${[...owners].join(',')}: dead selector .${name} (no template/binding/script reference)`)
		}
	}
	return issues
}

const definedShapes = new Map()
collectDefinedShapesMulti([...vueFiles, ...cssFiles], definedShapes)

const issues = [
	...findStaticInlineStyle(vueFiles),
	...findCssRuleIssues([...vueFiles, ...cssFiles]),
	...findScopedRedefined([...vueFiles, ...cssFiles]),
	...findOrphanClasses(vueFiles, definedShapes),
	...findDeadSelectors(vueFiles, tsFiles, definedShapes),
]

if (issues.length === 0) {
	console.log(`CSS compliance: pass (scanned ${files.length} files, 0 violations)`)
	process.exit(0)
}

console.error(`CSS compliance: FAIL - ${issues.length} violation(s):`)
for (const i of [...new Set(issues)]) console.error(`  ${i}`)
process.exit(1)