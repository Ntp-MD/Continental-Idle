import { TAKINGS_DAY_SECONDS } from './takings'

/**
 * Arrival flow: who walks in the door, and when they leave.
 *
 * The simulation population used to be a standing number with no traffic behind it, so footfall
 * could not be paid for or lost. This makes the brief's two figures meet: arrivals per day and the
 * occupants present are the same fact read at different moments (L = lambda x W), which is the same
 * law the seating model uses.
 */

/**
 * Declared fallback for a canvas that carries no street width. One number, because the running
 * simulation reads `canvas.streetTiles` and the offline tool reads `layout.streetWidthTiles` - two
 * fields that must agree, and a second literal to keep them agreeing is one more thing to forget.
 */
export const STREET_TILES_DEFAULT = 5

/**
 * Street doors only: an arrival that appears inside a room has not entered the building. A door tile
 * counts when it sits on the facade ring the street width defines, which is the same ring the plan
 * builder opens. One implementation, shared by the running simulation and the offline measurement.
 */
export function streetEntrances(
	floors: readonly { id: string; walkable?: { tileStates?: readonly (readonly string[])[] } }[],
	streetTiles: number,
): { floorId: string; x: number; y: number }[] {
	const street = Math.max(1, Math.floor(streetTiles))
	const found: { floorId: string; x: number; y: number }[] = []
	for (const floor of floors) {
		const states = floor.walkable?.tileStates
		if (!states?.length || !states[0]?.length) continue
		const rows = states.length
		const cols = states[0].length
		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < cols; c++) {
				if (states[r][c] !== 'door') continue
				if (r === street || r === rows - 1 - street || c === street || c === cols - 1 - street) {
					found.push({ floorId: floor.id, x: c, y: r })
				}
			}
		}
	}
	return found
}

/**
 * One traffic step, shared by the running simulation and the offline measurement: release the
 * arrivals due at this tick at a street door, and take away the ones whose stay is up.
 * The engine is injected, so this stays testable without a Vue tree.
 */
export interface TrafficEngine {
	addAgent(agent: { id: string; roleId: string; floorId: string; x: number; y: number; targetX: number; targetY: number; speed: number }): unknown
	removeAgent(id: string): boolean
}

export interface TrafficState {
	live: { id: string; bornTick: number }[]
	spawned: number
	departed: number
}

export function createTrafficState(): TrafficState {
	return { live: [], spawned: 0, departed: 0 }
}

export function stepTraffic(input: {
	engine: TrafficEngine
	flow: ArrivalFlow
	entrances: readonly { floorId: string; x: number; y: number }[]
	guestRoleId: string
	speedFor: (floorId: string) => number
	tick: number
	state: TrafficState
	idFor: (index: number) => string
}): void {
	const { engine, flow, entrances, guestRoleId, speedFor, tick, state } = input
	if (!entrances.length || !guestRoleId) return
	const step = flow.step(tick, state.live)
	for (let i = 0; i < step.spawns; i++) {
		const cell = entrances[(state.spawned + i) % entrances.length]
		const id = input.idFor(state.spawned + i)
		const speed = speedFor(cell.floorId)
		engine.addAgent({ id, roleId: guestRoleId, floorId: cell.floorId, x: cell.x, y: cell.y, targetX: cell.x, targetY: cell.y, speed })
		state.live.push({ id, bornTick: tick })
	}
	state.spawned += step.spawns
	for (const id of step.departures) {
		if (engine.removeAgent(id)) state.departed += 1
		const index = state.live.findIndex(entry => entry.id === id)
		if (index >= 0) state.live.splice(index, 1)
	}
}

export interface ArrivalFlowOptions {
	/**
	 * Walk-ins per hotel day, from the declared arrival demand (a minimum, not a point estimate). A
	 * function reads it live, so a house that loses a faction thins its own footfall instead of
	 * finishing the run at the rate it was deployed with.
	 */
	arrivalsPerDay: number | (() => number)
	/** Simulation seconds in one hotel day. */
	daySeconds?: number
	ticksPerSecond: number
	/** How long one arrival stays before it leaves. Defaults to a whole day. */
	staySeconds?: number
}

export interface LiveArrival {
	readonly id: string
	readonly bornTick: number
}

export interface ArrivalFlowStep {
	readonly spawns: number
	readonly departures: readonly string[]
}

export interface ArrivalFlow {
	step(tick: number, live: readonly LiveArrival[]): ArrivalFlowStep
	readonly spawnedSoFar: number
	/** Occupants implied by the flow: arrivals per day scaled by the share of a day each one stays. */
	readonly expectedPresent: number
	readonly staySeconds: number
}

/**
 * Little's law, stated once so the tool and the runner cannot disagree: the number of arrivals you
 * should see in the room at any moment is the rate in times how long each one stays.
 */
export function presentFromFlow(arrivalsPerDay: number, staySeconds: number, daySeconds: number): number {
	if (daySeconds <= 0) return 0
	return Math.round((arrivalsPerDay * staySeconds) / daySeconds)
}

export function createArrivalFlow(options: ArrivalFlowOptions): ArrivalFlow {
	const daySeconds = Math.max(1, Math.floor(options.daySeconds ?? TAKINGS_DAY_SECONDS))
	const staySeconds = Math.max(1, Math.floor(options.staySeconds ?? daySeconds))
	const ticksPerSecond = Math.max(1, Math.floor(options.ticksPerSecond))
	const stayTicks = Math.max(1, Math.round(staySeconds * ticksPerSecond))
	// Read live and clamped at both ends: a negative rate is a house that has closed its door and a
	// non-finite one is a config that never loaded, and neither may open the street.
	const rateOf = (): number => {
		const raw = typeof options.arrivalsPerDay === 'function' ? options.arrivalsPerDay() : options.arrivalsPerDay
		return Number.isFinite(raw) ? Math.max(0, raw) : 0
	}
	// Arrivals are owed against elapsed time, so a rate that falls thins the street rather than
	// recalling a crowd already through the door, and one that rises pays the new rate forward.
	let owed = 0
	let lastTick = 0
	let spawnedSoFar = 0

	return {
		step(tick, live) {
			const elapsed = Math.max(0, tick - lastTick)
			if (elapsed > 0) {
				// Whole arrivals only, and always the difference against the accumulated debt: a floor
				// per tick would silently drop the fraction and a day would never deliver its declared 500.
				owed += (elapsed * rateOf()) / (daySeconds * ticksPerSecond)
				lastTick = tick
			}
			const spawns = Math.max(0, Math.floor(owed))
			owed -= spawns
			spawnedSoFar += spawns
			const departures = live.filter(entry => tick - entry.bornTick >= stayTicks).map(entry => entry.id)
			return { spawns, departures }
		},
		get spawnedSoFar() {
			return spawnedSoFar
		},
		get expectedPresent() {
			return presentFromFlow(rateOf(), staySeconds, daySeconds)
		},
		get staySeconds() {
			return staySeconds
		},
	}
}
