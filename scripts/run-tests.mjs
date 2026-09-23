// Temporary hybrid test runner (plan T1, option C).
// Target end state: vitest is the single runner. Until every legacy tsx
// suite is migrated, this script sequences the tsx suites so one command
// gives a deterministic pass/fail with an explicit exit code.
// NOTE: vitest is intentionally NOT run here - `npm run verify` already runs
// `test:unit` before invoking this script; running it here executed the full
// vitest pass twice in CI.
import { spawn } from 'node:child_process'

const LEGACY_SUITES = [
	'test:npc-engine',
	'test:npc-queue',
	'test:settings-completeness',
	'test:store-crud',
	'test:tower-integration',
]

const LEGACY_SCRIPTS = ['verify:assets']

function run(label, command) {
	return new Promise((resolve) => {
		const child = spawn(command, { stdio: 'inherit', shell: true })
		child.on('close', (code) => resolve({ label, ok: code === 0 }))
	})
}

const steps = [
	...LEGACY_SUITES.map((suite) => [suite, `npm run ${suite}`]),
	...LEGACY_SCRIPTS.map((script) => [script, `npm run ${script}`]),
]

const failures = []
for (const [label, command] of steps) {
	const result = await run(label, command)
	if (!result.ok) failures.push(label)
}

const passed = steps.length - failures.length
console.log(`\n${passed}/${steps.length} test steps passed`)
if (failures.length > 0) {
	console.log('Failed steps:')
	for (const label of failures) console.log(`  - ${label}`)
	process.exitCode = 1
}