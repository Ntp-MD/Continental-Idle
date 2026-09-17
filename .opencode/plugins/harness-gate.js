import { readFileSync } from 'node:fs'
import { isAbsolute, join, relative, sep } from 'node:path'

// Harness gate - layer 3 (CLI/agent) enforcement, opencode only.
//
// Layer 1 (AGENTS.md + HARNESS.md context injection) asks the agent to follow
// the harness. This plugin enforces the one rule that matters at the tool
// boundary: a medium+ task - a second distinct project file - cannot be edited
// until the live slot is filled. A single-file lite task stays free.
//
// Enforcement is mechanical: throwing from tool.execute.before aborts the call
// (opencoce docs, ".env protection"). Meta paths never count, so the agent can
// always write harness/state/task-context.md itself to unblock.

const LITE_MAX_WORK_FILES = 1
const SLOT_REL = 'harness/state/task-context.md'
const EDIT_TOOLS = new Set(['edit', 'write'])
const META_PREFIXES = ['harness/', '_archive/', '.githooks/', '.opencode/', '.github/', 'coverage/', 'dist/']
const META_FILES = [
	'AGENTS.md',
	'opencode.json',
	'.clinerules',
	'CLAUDE.md',
	'GEMINI.md',
	'.cursorrules',
	'.windsurfrules',
]

export function toRepoRel(directory, filePath) {
	if (typeof filePath !== 'string' || !filePath) return null
	const abs = isAbsolute(filePath) ? filePath : join(directory, filePath)
	const rel = relative(directory, abs).split(sep).join('/')
	return rel === '' || rel.startsWith('..') ? null : rel
}

export function isMetaFile(rel) {
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

function readSlot(directory) {
	try {
		return readFileSync(join(directory, SLOT_REL), 'utf8')
	} catch {
		return ''
	}
}

export function createHarnessGate({ directory }) {
	const touched = new Set()
	return {
		'tool.execute.before': async (input, output) => {
			if (!EDIT_TOOLS.has(input.tool)) return
			const rel = toRepoRel(directory, output?.args?.filePath)
			if (!rel || isMetaFile(rel)) return
			if (!touched.has(rel) && touched.size >= LITE_MAX_WORK_FILES && slotIsEmpty(readSlot(directory))) {
				throw new Error(
					`Harness gate: this is a medium+ task (>= ${LITE_MAX_WORK_FILES + 1} project files: ` +
						`${[...touched, rel].join(', ')}). Fill ${SLOT_REL} first - Mission, Plan, and a Hand-off Note ` +
						`(see AGENTS.md Workflow + harness/HARNESS.md), then retry this edit. ` +
						`A single-file lite change stays exempt.`,
				)
			}
			touched.add(rel)
		},
	}
}

export const HarnessGate = async ({ directory }) => createHarnessGate({ directory })