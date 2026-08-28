export const NPC_ENGINE_TICKS_PER_SECOND = 60

export const NPC_ENGINE_DEFAULT_AGENT_CLEARANCE = 0.5

export const NPC_ENGINE_DEFAULT_OPTIONS = {
	crossFloorCooldownSeconds: 30,
	progressWatchdogTicks: 120,
	maxRepathAttempts: 4,
	repathCooldownSeconds: 2,
	repathCooldownExponent: 1.5,
	pathBudgetMinPerTick: 2,
	pathBudgetAgentsPerCall: 100,
	chooseTargetMinPerTick: 8,
	chooseTargetAgentsPerSlot: 20,
	wanderMemorySize: 32,
	wanderSmallMapThreshold: 8,
	triggerRatePeriodSeconds: 60,
} as const
