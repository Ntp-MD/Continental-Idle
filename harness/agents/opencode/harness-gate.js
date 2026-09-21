import { readFileSync } from 'node:fs'
import { isAbsolute, join, relative, sep } from 'node:path'
import { ANCHOR_EVERY_CALLS, LITE_MAX_WORK_FILES, SLOT_REL, isMetaPath, slotIsEmpty } from '../../scripts/rail.mjs'

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
// Rules + thresholds live in harness/scripts/rail.mjs - this file only wires.

const EDIT_TOOLS = new Set(['edit', 'write'])

function toRepoRel(directory, filePath) {
	if (typeof filePath !== 'string' || !filePath) return null
	const abs = isAbsolute(filePath) ? filePath : join(directory, filePath)
	const rel = relative(directory, abs).split(sep).join('/')
	return rel === '' || rel.startsWith('..') ? null : rel
}

function anchorLine(text) {
	const marker = /^##[ \t]+Mission[ \t]*$/m.exec(text)
	if (!marker) return null
	const rest = text.slice(marker.index + marker[0].length)
	const next = /^##[ \t]+/m.exec(rest)
	const body = (next ? rest.slice(0, next.index) : rest).replace(/<!--[\s\S]*?-->/g, '')
	const line = body
		.split('\n')
		.map((item) => item.trim())
		.find((item) => item && !/^Mode:\s*autopilot$/i.test(item))
	const planMarker = /^##[ \t]+Plan[ \t]*$/m.exec(text)
	let nextBox = ''
	if (planMarker) {
		const planRest = text.slice(planMarker.index + planMarker[0].length)
		const planEnd = /^##[ \t]+/m.exec(planRest)
		const planBody = planEnd ? planRest.slice(0, planEnd.index) : planRest
		const box = planBody.split('\n').find((item) => /^\s*-\s\[\s\]/.test(item))
		if (box) nextBox = ` | next unchecked: ${box.replace(/^\s*-\s\[\s\]\s*/, '').trim()}`
	}
	return line ? `${line}${nextBox}` : null
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
	let calls = 0
	return {
		'tool.execute.before': async (input, output) => {
			if (!EDIT_TOOLS.has(input.tool)) return
			const rel = toRepoRel(directory, output?.args?.filePath)
			if (!rel || isMetaPath(rel)) return
			if (!touched.has(rel) && touched.size >= LITE_MAX_WORK_FILES && slotIsEmpty(readSlot(directory))) {
				throw new Error(
					`Harness gate: this is a medium+ task (>= ${LITE_MAX_WORK_FILES + 1} project files: ` +
						`${[...touched, rel].join(', ')}). Fill ${SLOT_REL} first - Mission, Plan, and a Hand-off Note ` +
						`(see harness/HARNESS.md Operating mode), then retry this edit. ` +
						`A single-file lite change stays exempt.`,
				)
			}
			touched.add(rel)
			calls++
			if (calls % ANCHOR_EVERY_CALLS === 0) {
				const anchor = anchorLine(readSlot(directory))
				if (anchor) {
					throw new Error(
						`Harness anchor (scheduled every ${ANCHOR_EVERY_CALLS} edits - not an error): ` +
							`re-confirm you are still on intent "${anchor}". ` +
							`If yes, tick/update ${SLOT_REL} as needed and retry this exact edit unchanged.`,
					)
				}
			}
		},
	}
}

export const HarnessGate = async ({ directory }) => createHarnessGate({ directory })