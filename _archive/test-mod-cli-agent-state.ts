import assert from 'node:assert/strict'
import { isQuestionCard, resolveAgentState, type AgentStateItem } from './mod-cli/src/agentState'

// Chip: not running is idle, no matter what is on the transcript.
{
	assert.equal(resolveAgentState(false, false, []), 'idle')
	assert.equal(
		resolveAgentState(false, false, [{ kind: 'permission', text: 'Which db?', answered: null }]),
		'idle',
	)
	assert.equal(resolveAgentState(false, true, []), 'idle')
	console.log('agent state not-running idle passed')
}

// Chip: live phases from the last streamed item.
{
	assert.equal(resolveAgentState(true, false, []), 'tasking')
	assert.equal(resolveAgentState(true, false, [{ kind: 'tool', toolStatus: 'in_progress', text: 'Edit file' }]), 'tasking')
	assert.equal(resolveAgentState(true, false, [{ kind: 'tool', toolStatus: 'in_progress', toolKind: 'think', text: 'Reasoning' }]), 'thinking')
	assert.equal(resolveAgentState(true, false, [{ kind: 'thinking' }]), 'thinking')
	assert.equal(resolveAgentState(true, true, []), 'planning')
	assert.equal(resolveAgentState(true, true, [{ kind: 'thinking' }]), 'thinking')
	console.log('agent state live phases passed')
}

// Chip: a pending permission card outranks everything (blocked on user first).
{
	const pending: AgentStateItem = { kind: 'permission', text: 'Write file', answered: null }
	assert.equal(resolveAgentState(true, false, [pending]), 'asking')
	assert.equal(resolveAgentState(true, true, [pending]), 'asking')
	const answered: AgentStateItem = { kind: 'permission', text: 'Write file', answered: 'o1' }
	assert.equal(resolveAgentState(true, false, [answered]), 'tasking')
	// The newest pending card wins when several exist.
	const laterQuestion: AgentStateItem = { kind: 'permission', text: 'Which db?', answered: null }
	assert.equal(resolveAgentState(true, false, [pending, answered, laterQuestion]), 'questioning')
	console.log('agent state pending permission passed')
}

// Heuristic: question wording matches, approvals never do.
{
	assert.equal(isQuestionCard('Which database should this target?'), true)
	assert.equal(isQuestionCard('question from the agent'), true)
	assert.equal(isQuestionCard('Pick one: postgres or sqlite'), true)
	assert.equal(isQuestionCard('Choose a preset'), true)
	assert.equal(isQuestionCard('Select one option'), true)
	assert.equal(isQuestionCard('Decide which file to edit', 'tool-1'), true)
	assert.equal(isQuestionCard('Write file', 'tool-1'), false)
	assert.equal(isQuestionCard('Allow write'), false)
	assert.equal(isQuestionCard(''), false)
	assert.equal(isQuestionCard('', 'q-123'), false)
	assert.equal(isQuestionCard('Pick one', 'q-123'), true)
	console.log('agent state question heuristic passed')
}

console.log('mod-cli agent state checks passed')