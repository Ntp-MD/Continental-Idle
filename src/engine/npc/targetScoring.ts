import type { NpcEngineAgent, NpcEngineInteractionTarget } from './types'
import { interactionTargetKey } from './keys'
import { octileDistance } from './distance'

export interface TargetScoringOptions {
	maxDistanceWeight?: number
	noveltyBonus?: number
	ageDecayPerTick?: number
}

export interface TargetScoringContext {
	agent: NpcEngineAgent
	targets: readonly NpcEngineInteractionTarget[]
	targetLastSelectedTick?: ReadonlyMap<string, number>
	currentTick: number
	options?: TargetScoringOptions
	random?: () => number
}

function scoreTarget(target: NpcEngineInteractionTarget, ctx: TargetScoringContext): number {
	const maxWeight = ctx.options?.maxDistanceWeight ?? 10
	const noveltyBonus = ctx.options?.noveltyBonus ?? 2
	const ageDecay = ctx.options?.ageDecayPerTick ?? 0.01

	const distance = octileDistance(ctx.agent.x, ctx.agent.y, target.x, target.y)
	const distanceWeight = maxWeight / (1 + distance)

	const lastTick = ctx.targetLastSelectedTick?.get(interactionTargetKey(target))
	let ageBonus: number
	if (lastTick !== undefined) {
		const age = ctx.currentTick - lastTick
		ageBonus = Math.min(noveltyBonus, age * ageDecay)
	} else {
		ageBonus = noveltyBonus
	}

	return distanceWeight + ageBonus
}

export function selectBestTarget(ctx: TargetScoringContext): NpcEngineInteractionTarget | null {
	if (ctx.targets.length === 0) return null
	if (ctx.targets.length === 1) return ctx.targets[0]

	let best: NpcEngineInteractionTarget | null = null
	let bestScore = -Infinity
	let bestId = ''
	let ties: NpcEngineInteractionTarget[] = []

	for (const target of ctx.targets) {
		const score = scoreTarget(target, ctx)
		const id = interactionTargetKey(target)
		if (score > bestScore) {
			best = target
			bestScore = score
			bestId = id
			ties = [target]
		} else if (score === bestScore) {
			ties.push(target)
			if (id < bestId) {
				best = target
				bestId = id
			}
		}
	}

	if (ties.length > 1 && ctx.random) {
		const random = Math.max(0, Math.min(0.999999, ctx.random()))
		return ties[Math.floor(random * ties.length)] ?? best
	}
	return best
}
