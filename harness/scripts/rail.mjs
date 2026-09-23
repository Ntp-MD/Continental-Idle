// rail - the single source of enforcement rules for every rail runner.
// The rail is enforced at four points: pre-call (harness-gate.js plugin),
// mid-task (verify.mjs drift + the plugin anchor), post-call (verify.mjs
// check), and commit (.githooks/pre-commit). This module owns the RULES;
// the runners only wire them. One rule lives here exactly once - runners
// never redeclare thresholds or meta lists.
import { join } from 'node:path'

// Live slot - every runner reads the same file.
export const SLOT_REL = 'harness/state/task-context.md'

// Meta paths never count as project work: the agent must always be able to
// write harness files (its own slot) and config to unblock itself.
export const META_PREFIXES = ['harness/', '.githooks/', '.opencode/', '.github/', 'coverage/', 'dist/']
export const META_FILES = [
	'AGENTS.md',
	'opencode.json',
	'.clinerules',
	'CLAUDE.md',
	'GEMINI.md',
	'.cursorrules',
	'.windsurfrules',
]

// Pre-call gate: a second distinct project file cannot be edited while the
// slot is empty - a single-file lite task stays free.
export const LITE_MAX_WORK_FILES = 1

// Scheduled re-anchor cadence: every Nth non-meta edit call the plugin throws
// the anchor message (Mission + next unchecked Plan box) back into context.
// 15 = tuned for strong models (fewer interrupts); lower to ~10 when running
// weaker models or high-drift work.
export const ANCHOR_EVERY_CALLS = 15

// Drift gate: N project files changed with an EMPTY slot = lost task.
export const DRIFT_NO_SLOT_FILES = 3

// Drift gate: N project files changed with no Plan box ever ticked =
// untracked progress. Higher than NO_SLOT because a light single-file task
// legitimately runs without ticking anything.
export const DRIFT_UNTRACKED_FILES = 10

// Shell-command gate: hard-enforced hard bans. These slipped through as soft
// context rules (AGENTS.md Bans) - the command lines below are banned at the
// tool boundary by the harness-gate plugin, message repeats the soft rule.
// No agent-side bypass exists. The ONLY unlock is the user explicitly naming
// git in the current prompt (e.g. "commit", "push", "run git X") - the agent
// may not decide on its own, may not claim prior permission, and may not
// work around the ban through scripts, aliases, plugins, or other tools.
export const BANNED_SHELL = [
	{ pattern: /\bgit\b/, why: 'the user runs git manually - the agent may not run any git command unless the user names it in the current prompt; no bypass, no workaround, no self-granted exception' },
]

export function isMetaPath(rel) {
	return META_PREFIXES.some((prefix) => rel.startsWith(prefix)) || META_FILES.includes(rel)
}

export function slotIsEmpty(text) {
	const marker = /^##[ \t]+Mission[ \t]*$/m.exec(text)
	if (!marker) return true
	const rest = text.slice(marker.index + marker[0].length)
	const next = /^##[ \t]+/m.exec(rest)
	const body = (next ? rest.slice(0, next.index) : rest).replace(/<!--[\s\S]*?-->/g, '').trim()
	return body === '' || body.includes('(empty)')
}

export function slotPathFor(root) {
	return join(root, SLOT_REL)
}
