// Agent-state decision table for the toolbar chip, derived only from what the
// ACP wire already reports (permission cards, streamed items, tool kinds, plan
// mode). Pure so the component computes it reactively and the sim test drives
// the exact same table. Priority: blocked-on-user first, then the live phase.
export type AgentState = 'idle' | 'asking' | 'questioning' | 'thinking' | 'planning' | 'tasking'

export interface AgentStateItem {
	kind: string
	text?: string
	answered?: string | null
	toolCallId?: string
	toolStatus?: string
	toolKind?: string
}

// A card is a question (cline's AskFollowupQuestion arrives as a permission
// request whose options are the suggested answers) when its text or tool
// reference reads as a question. One heuristic for the state chip AND the
// choice-card presentation - never a second copy. Matching is deliberately
// wide on question wording and narrow on everything else: mis-bucketing an
// approval as a question is cosmetic (styling + chip wording) while the
// reverse would style an unanswerable prompt as an approval.
const QUESTION_WORDS = ['question', '?', 'choose', 'pick one', 'select one', 'which'] as const

export const isQuestionCard = (text: string, toolCallId?: string): boolean => {
	const joined = `${text} ${toolCallId ?? ''}`.toLowerCase()
	return QUESTION_WORDS.some((word) => joined.includes(word))
}

export const resolveAgentState = (running: boolean, planMode: boolean, items: readonly AgentStateItem[]): AgentState => {
	if (!running) return 'idle'
	const pending = [...items].reverse().find((item) => item.kind === 'permission' && item.answered === null)
	if (pending) return isQuestionCard(pending.text ?? '', pending.toolCallId) ? 'questioning' : 'asking'
	const last = items[items.length - 1]
	if (last?.kind === 'tool' && last.toolStatus === 'in_progress') {
		if ((last.text ?? '').toLowerCase().includes('question')) return 'questioning'
		if (last.toolKind === 'think') return 'thinking'
	}
	if (last?.kind === 'thinking') return 'thinking'
	if (planMode) return 'planning'
	return 'tasking'
}
