// Temporary hybrid test runner (plan T1, option C).
// Target end state: vitest is the single runner. Until every legacy tsx
// suite is migrated, this script sequences vitest + the tsx suites so one
// command gives a deterministic pass/fail with an explicit exit code.
import { spawn } from 'node:child_process'

const VITEST = 'npx vitest run'

const LEGACY_SUITES = [
	'test:npc-engine',
	'test:npc-queue',
	'test:npc-social',
	'test:arrival-latch',
	'test:movement-corridor',
	'test:blueprint-schema',
	'test:asset-schema',
	'test:settings-completeness',
	'test:sync-payload',
	'test:migrate',
	'test:collision',
	'test:tag-matching',
	'test:persistence',
	'test:store-crud',
]

const LEGACY_SCRIPTS = ['verify:assets']

function run(label, command) {
	return new Promise((resolve) => {
		const child = spawn(command, { stdio: 'inherit', shell: true })
		child.on('close', (code) => resolve({ label, ok: code === 0 }))
	})
}

const steps = [
	['vitest', VITEST],
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