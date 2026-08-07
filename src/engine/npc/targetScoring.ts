import type { NpcEngineAgent, NpcEngineInteractionTarget, NpcEnginePoint } from './types'

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
}

function targetIdentity(target: NpcEngineInteractionTarget): string {
	return `${target.floorId}:${target.itemId}:${target.anchorId}`
}

function octileDistance(a: NpcEnginePoint, b: NpcEnginePoint): number {
	const dx = Math.abs(a.x - b.x)
	const dy = Math.abs(a.y - b.y)
	return (dx + dy) + (Math.SQRT2 - 2) * Math.min(dx, dy)
}

export function scoreTarget(target: NpcEngineInteractionTarget, ctx: TargetScoringContext): number {
	const maxWeight = ctx.options?.maxDistanceWeight ?? 10
	const noveltyBonus = ctx.options?.noveltyBonus ?? 2
	const ageDecay = ctx.options?.ageDecayPerTick ?? 0.01

	const distance = octileDistance(ctx.agent, target)
	const distanceWeight = maxWeight / (1 + distance)

	const lastTick = ctx.targetLastSelectedTick?.get(targetIdentity(target))
	let ageBonus = 0
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

	for (const target of ctx.targets) {
		const score = scoreTarget(target, ctx)
		const id = targetIdentity(target)
		if (score > bestScore || (score === bestScore && id < bestId)) {
			best = target
			bestScore = score
			bestId = id
		}
	}

	return best
}
