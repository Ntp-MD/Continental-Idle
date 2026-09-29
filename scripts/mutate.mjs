// mutate - prove a guard has a test, by removing the guard and demanding a failure.
//
// A rule nobody tests is a rule that can be "refactored" away in silence. Each entry in
// tests/mutation-guards.json neutralises one rule and names the suite that must go red for it.
// Three outcomes are reported: KILLED (a test broke - the guard is protected), SURVIVED (nothing
// noticed - the guard is untested), and INCONCLUSIVE (the mutant never produced a test failure at
// all, usually because the edit does not compile). Files are restored from memory on every path,
// including a thrown run, and the restore is verified byte for byte.
//
// Usage:
//   npm run test:mutation                 every guard
//   node scripts/mutate.mjs --only takings  subset by id substring
//   node scripts/mutate.mjs --list          show the manifest without touching any file
//
// Exit code: 0 only when every selected guard was killed.
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync, statSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..')
const MANIFEST = path.join(ROOT, 'tests/mutation-guards.json')
const args = process.argv.slice(2)

function flagValue(name) {
	const index = args.indexOf(name)
	return index >= 0 ? args[index + 1] : undefined
}

if (args.includes('--help') || args.includes('-h')) {
	console.log('usage: node scripts/mutate.mjs [--only <id-substring>] [--list]')
	process.exit(0)
}

if (!existsSync(MANIFEST)) {
	console.error(`mutate: manifest missing at ${path.relative(ROOT, MANIFEST)}`)
	process.exit(1)
}

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'))
const only = flagValue('--only')
const guards = manifest.guards.filter(guard => !only || guard.id.includes(only))

if (!guards.length) {
	console.error(`mutate: no guard matches ${only ? `--only ${only}` : 'the manifest'}`)
	process.exit(1)
}

if (args.includes('--list')) {
	for (const guard of guards) console.log(`${guard.id}\t${guard.file}\t${guard.test}\t${guard.why}`)
	process.exit(0)
}

/**
 * A verdict is read from vitest's JSON report, never from its prose: the summary line carries
 * escape sequences that silently break a text match, and a broken match reads as "this guard has
 * no test" for every single guard at once.
 */
function runSuite(testFile) {
	// Vitest is launched through node directly: on Windows `npx` is a .cmd and spawnSync without a
	// shell raises ENOENT, which would read as "the guard is untested" when nothing ever ran.
	const cli = path.join(ROOT, 'node_modules', 'vitest', 'vitest.mjs')
	if (!existsSync(cli)) return { verdict: 'inconclusive', detail: 'vitest is not installed at node_modules/vitest/vitest.mjs' }
	const reportDir = path.join(ROOT, 'test-results')
	const startedAt = Date.now() - 5_000
	const reportFile = path.join(reportDir, `mutate-${process.pid}-${Date.now()}.json`)
	mkdirSync(reportDir, { recursive: true })
	let result
	try {
		result = spawnSync(process.execPath, [cli, 'run', testFile, '--reporter=json', `--outputFile=${reportFile}`], {
			cwd: ROOT,
			encoding: 'utf8',
			timeout: 300_000,
		})
		const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
		if (result.error) return { verdict: 'inconclusive', detail: String(result.error.message).split('\n')[0] }
		const candidates = [reportFile, ...[...output.matchAll(/JSON report written to (\S+)/g)].map(match => match[1])]
		let failed = 0
		let total = 0
		let parsed = false
		// The child resolves its own output path, so the parent's string may not be statable. Retry,
		// then fall back to any report this process wrote during this call. A report nobody can read
		// is never a verdict about the guard.
		for (let attempt = 0; attempt < 5 && !parsed; attempt++) {
			if (attempt > 0) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200)
			if (attempt >= 2 && existsSync(reportDir)) {
				for (const name of readdirSync(reportDir)) {
					if (!name.startsWith('mutate-')) continue
					const full = path.join(reportDir, name)
					if (statSync(full).mtimeMs < startedAt) continue
					candidates.push(full)
				}
			}
			for (const candidate of candidates) {
				if (!existsSync(candidate)) continue
				let report
				try {
					report = JSON.parse(readFileSync(candidate, 'utf8'))
				} catch {
					continue
				}
				for (const file of report.testResults ?? []) {
					for (const assertion of file.assertionResults ?? []) {
						total += 1
						if (assertion.status === 'failed') failed += 1
					}
				}
				// A passing run reports zero failed assertions. That is a verdict, not a missing
				// report - mixing the two once turned every surviving mutant into "inconclusive".
				if ((report.testResults?.length ?? 0) > 0) parsed = true
				break
			}
		}
		if (!parsed) return { verdict: 'inconclusive', detail: `no readable report from ${testFile} (exit ${result.status ?? '?'}) - not evidence about this guard` }
		if (failed > 0) return { verdict: 'killed', detail: `${failed}/${total} test(s) failed` }
		if (total === 0) return { verdict: 'inconclusive', detail: `the named suite ran no tests (${testFile})` }
		if (result.status !== 0) return { verdict: 'inconclusive', detail: `suite errored without a test failure (exit ${result.status})` }
		return { verdict: 'survived', detail: `all ${total} test(s) passed with the guard removed` }
	} finally {
		rmSync(reportFile, { force: true })
	}
}

const originals = new Map()
let failed = 0
const rows = []

try {
	for (const guard of guards) {
		const file = path.join(ROOT, guard.file)
		if (!existsSync(file)) {
			rows.push([guard.id, 'inconclusive', `source missing: ${guard.file}`])
			failed++
			continue
		}
		const content = readFileSync(file, 'utf8')
		const hits = content.split(guard.find).length - 1
		if (hits === 0) {
			rows.push([guard.id, 'inconclusive', `anchor not found in ${guard.file} - the rule moved or was renamed`])
			failed++
			continue
		}
		// First writer wins: the pristine copy must never be replaced by a copy that already
		// carries an earlier guard's mutation, or the run restores the damaged file and every
		// later anchor in the same file disappears.
		if (!originals.has(file)) originals.set(file, content)
		let outcome
		try {
			writeWithRetry(file, content.replaceAll(guard.find, guard.replace))
			outcome = runSuite(guard.test)
		} finally {
			// Restore before the next guard, or mutations stack and each result describes
			// several rules at once instead of the one being tested.
			writeWithRetry(file, originals.get(file))
		}
		if (outcome.verdict !== 'killed') failed++
		rows.push([guard.id, outcome.verdict, `${outcome.detail} (${hits} site${hits === 1 ? '' : 's'} neutralised)`])
	}
} finally {
	// Defence in depth: no touched file may differ from the copy taken before its first mutation.
	// Comparing content rather than scanning for mutant text matters, because some replacement
	// strings are legitimate code elsewhere in the same file.
	for (const [file, pristine] of originals) {
		if (!existsSync(file)) continue
		if (readFileSync(file, 'utf8') === pristine) continue
		writeWithRetry(file, pristine)
		console.error(`mutate: ${path.relative(ROOT, file)} still carried a mutant - restored from the pristine copy`)
	}
	let restoreProblems = 0
	for (const [file, content] of originals) {
		writeWithRetry(file, content)
		if (readFileSync(file, 'utf8') !== content) {
			console.error(`mutate: FAILED TO RESTORE ${path.relative(ROOT, file)} - restore it manually`)
			restoreProblems++
		}
	}
	if (restoreProblems === 0 && originals.size > 0) console.log(`mutate: ${originals.size} file(s) restored and verified`)
	// The JSON scratch reports are this tool's own output; leaving them behind would dirty the tree.
	rmSync(path.join(ROOT, 'test-results'), { recursive: true, force: true })
	if (restoreProblems > 0) process.exit(2)
}

const width = Math.max(...rows.map(row => row[0].length))
for (const [id, verdict, detail] of rows) console.log(`${id.padEnd(width)}  ${verdict.padEnd(12)}  ${detail}`)

const killed = rows.filter(row => row[1] === 'killed').length
console.log(`\nmutate: ${killed}/${rows.length} guard(s) protected by a failing test`)
if (failed > 0) {
	console.log(`mutate: ${failed} guard(s) are NOT protected - add the missing test, or delete the rule`)
	process.exit(1)
}
console.log('mutate: every selected guard has a test that breaks without it')

/**
 * Windows fails an overwrite with `UNKNOWN` (errno -4094) when something else holds the file for one
 * instant - an indexer or scanner. A retry is the only honest answer, because a write that dies here
 * leaves a mutant in the working tree and the run aborts before the residual check can fix it.
 */
function writeWithRetry(file, content, attempts = 5) {
	for (let attempt = 1; ; attempt++) {
		try {
			writeFileSync(file, content)
			return
		} catch (error) {
			if (attempt >= attempts) throw error
			Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, attempt * 100)
		}
	}
}
