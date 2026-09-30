import { computed } from 'vue'
import {
	FACTION_GOODWILL_COST_CENTS,
	STANDING_REPAIR_COST_CENTS,
	affordable,
	facilityHoldings,
	fixturePriceCents,
	fixtureSaleCents,
	holdingCountFor,
	staffHirePriceCents,
} from '../domain/economy/purchases'
import { repairStanding } from '../domain/economy/reputation'
import { repairFaction, type Faction, type WorldState } from '../domain/economy/standing-world'
import { formatTakings, visitorRoleIds, type TakingsLedger } from '../domain/economy/takings'
import type { AssetDef, NpcSimulationConfig } from '../domain/types'
import type { BlueprintStore } from '../blueprintStore'
import { useToast } from '@/composables/useToast'
import { editorLog } from '@/blueprint-editor/domain/logger'
import { useAsyncAction } from './useAsyncAction'

/** How many tile steps away from the middle of the plate a purchased fixture may still land. */
const PLACEMENT_SEARCH_RADIUS = 12
/** The scan is O(candidates x objects); this bounds it whatever the radius. */
const PLACEMENT_SEARCH_CANDIDATES = 200

export interface PurchaseVerdict {
	readonly ok: boolean
	readonly priceCents: number
}

/** One tradeable fixture kind: what the next one costs, what one comes back as, and which one. */
export interface FixtureRow {
	readonly asset: AssetDef
	/** How many of the billing kind the house holds - the reason `nextCents` is above a first price. */
	readonly held: number
	readonly nextCents: number
	readonly sellCents: number
	/** The fixture this row's sale would remove, or null when the floor has none to give back. */
	readonly sellableObjectId: string | null
}

/**
 * The outflow half of the economy: money leaves the bank only through a purchase, and a purchase is
 * only complete when the store's own placement gate has accepted the object it paid for. Nothing
 * here places anything by a second route.
 */
export function useShopPurchases(deps: {
	store: BlueprintStore
	ledger: TakingsLedger
	/** Standing is the simulation's state; a repair is bought here and applied there. */
	standing: { get(): number; set(score: number): void }
	/** The world outside is the simulation's state too; a message round the room is bought here. */
	world: { get(): WorldState; set(next: WorldState): void }
}) {
	const { store, ledger, standing, world } = deps
	const toast = useToast()
	const { pending, run } = useAsyncAction()
	const busy = pending

	/** Nearest-first tile offsets around the centre, so a bought fixture lands where it is seen. */
	function placementCandidates(): { x: number; y: number }[] {
		const canvas = store.state.layout.canvas
		const tile = canvas.tileSize || 1
		const cells: { x: number; y: number; d: number }[] = []
		for (let dy = -PLACEMENT_SEARCH_RADIUS; dy <= PLACEMENT_SEARCH_RADIUS; dy++) {
			for (let dx = -PLACEMENT_SEARCH_RADIUS; dx <= PLACEMENT_SEARCH_RADIUS; dx++) {
				cells.push({ x: canvas.width / 2 + dx * tile, y: canvas.height / 2 + dy * tile, d: Math.hypot(dx, dy) })
			}
		}
		return cells
			.sort((a, b) => a.d - b.d)
			.slice(0, PLACEMENT_SEARCH_CANDIDATES)
			.map(cell => ({ x: cell.x, y: cell.y }))
	}

	/** What the floor already holds, by the facility that bills it. Counted through `rateForTags` - the
	 * same rule that prices and bills a fixture - so a second bar is dearer because the house owns a
	 * bar, not because it owns a similarly-shaped object.
	 */
	function holdingsOnFloor(): Map<string, number> {
		const tagsByType = new Map(store.state.assetRegistry.map(asset => [asset.id, asset.tags ?? []]))
		const placed = store.state.layout.floors.flatMap(floor => floor.objects.map(object => tagsByType.get(object.type) ?? []))
		return facilityHoldings(placed)
	}

	/** An object on any floor, with the asset definition it was placed from. */
	function findPlacedObject(objectId: string): { objectId: string; asset: AssetDef } | null {
		for (const floor of store.state.layout.floors) {
			const object = floor.objects.find(candidate => candidate.id === objectId)
			if (!object) continue
			const asset = store.state.assetRegistry.find(candidate => candidate.id === object.type)
			return asset ? { objectId, asset } : null
		}
		return null
	}

	function priceOf(asset: AssetDef): number | null {
		return fixturePriceCents(asset.tags, holdingCountFor(holdingsOnFloor(), asset.tags))
	}

	/** How many of the kind the floor already holds - the reason the next one is dearer than the last. */
	function holdingCountOf(asset: AssetDef): number {
		return holdingCountFor(holdingsOnFloor(), asset.tags)
	}

	/**
	 * The fixtures the shop trades, one row per kind the house can bill for. Read from the registry and
	 * the floor rather than from the current selection: a player watching the lobby run has nothing
	 * highlighted, and a trade they cannot reach is a trade that does not exist.
	 */
	function fixtureRows(): FixtureRow[] {
		const floor = store.currentFloor.value
		return store.state.assetRegistry.flatMap((asset): FixtureRow[] => {
			const nextCents = priceOf(asset)
			if (nextCents === null) return []
			const sellable = floor?.objects.find(object => object.type === asset.id && !object.locked)
			return [{
				asset,
				held: holdingCountOf(asset),
				nextCents,
				sellCents: fixtureSaleCents(asset.tags) ?? 0,
				sellableObjectId: sellable?.id ?? null,
			}]
		})
	}

	async function buyFixture(asset: AssetDef): Promise<PurchaseVerdict> {
		const price = priceOf(asset)
		if (price === null) {
			toast.warning(`${asset.name} bills nothing, so there is no service to buy`)
			return { ok: false, priceCents: 0 }
		}
		if (!affordable(ledger.snapshot().bankCents, price)) {
			toast.warning(`The bank cannot cover ${formatTakings(price)}`)
			return { ok: false, priceCents: price }
		}
		const candidates = placementCandidates()
		const spot = candidates.find(cell => store.canPlaceObject(asset.id, cell.x, cell.y))
		if (!spot) {
			toast.warning('No free floor area near the centre - the lobby is full')
			return { ok: false, priceCents: price }
		}
		// Charged only after the store's own write accepted the object: a refusal by the placement
		// gate is a refusal to sell, and the bank must not have moved.
		const placed = await store.addObject(asset.id, spot.x, spot.y)
		if (!placed) return { ok: false, priceCents: price }
		if (!ledger.withdraw(price)) {
			toast.warning(`Placed, but ${formatTakings(price)} could not be taken from the bank`)
			return { ok: false, priceCents: price }
		}
		toast.success(`Bought ${asset.name} for ${formatTakings(price)}`)
		return { ok: true, priceCents: price }
	}

	async function hireStaff(roleId: string, config: NpcSimulationConfig | undefined): Promise<PurchaseVerdict> {
		const price = staffHirePriceCents()
		if (!config) {
			toast.warning('Nothing is deployed yet, so there is no payroll to add a head to')
			return { ok: false, priceCents: price }
		}
		if (!affordable(ledger.snapshot().bankCents, price)) {
			toast.warning(`The bank cannot cover ${formatTakings(price)}`)
			return { ok: false, priceCents: price }
		}
		const pool = (config.pool ?? []).map(entry =>
			entry.roleId === roleId ? { ...entry, count: Math.max(0, Math.floor(entry.count)) + 1 } : entry,
		)
		if (!pool.some(entry => entry.roleId === roleId)) pool.push({ roleId, count: 1 })
		const countIn = (entries: readonly { roleId: string; count: number }[]): number =>
			entries.find(entry => entry.roleId === roleId)?.count ?? 0
		const before = countIn(config.pool ?? [])
		try {
			await store.updateNpcConfig({ ...config, pool })
		} catch (error) {
			editorLog.warn('ShopPurchase', 'the deployment refused the new head', error)
			toast.warning('The deployment refused the new head - nothing was spent')
			return { ok: false, priceCents: price }
		}
		// The write path normalizes and can clamp a pool entry, so the head is confirmed from stored
		// state before any money moves. If it did not land, nothing was bought.
		const after = countIn(store.state.layout.npcConfig?.pool ?? [])
		if (after <= before) {
			toast.warning('The deployment refused the new head - nothing was spent')
			return { ok: false, priceCents: price }
		}
		if (!ledger.withdraw(price)) {
			toast.warning(`Hired, but ${formatTakings(price)} could not be taken from the bank`)
			return { ok: false, priceCents: price }
		}
		toast.success(`Hired staff for ${formatTakings(price)} - the wage lands on every closed day`)
		return { ok: true, priceCents: price }
	}

	/**
	 * Let one head go. The mirror of a hire, and deliberately free: payroll is the only cost the house
	 * carries and a player whose bank cannot meet it needs a lever on that side too, so charging a
	 * severance would tax the one remedy the game has. Nothing is paid out either way - the wage stops,
	 * and the service the head was providing stops with it.
	 */
	async function dismissStaff(roleId: string, config: NpcSimulationConfig | undefined): Promise<PurchaseVerdict> {
		if (!config) {
			toast.warning('Nothing is deployed yet, so there is no payroll to cut')
			return { ok: false, priceCents: 0 }
		}
		const label = config.roles?.find(role => role.id === roleId)?.label || roleId
		const held = (config.pool ?? []).find(entry => entry.roleId === roleId)?.count ?? 0
		if (Math.floor(held) <= 0) {
			toast.warning(`No ${label} is on the payroll`)
			return { ok: false, priceCents: 0 }
		}
		const pool = (config.pool ?? []).map(entry =>
			entry.roleId === roleId ? { ...entry, count: Math.max(0, Math.floor(entry.count) - 1) } : entry,
		)
		try {
			await store.updateNpcConfig({ ...config, pool })
		} catch (error) {
			editorLog.warn('ShopPurchase', 'the deployment refused to release the head', error)
			toast.warning('The deployment refused to release the head - nothing changed')
			return { ok: false, priceCents: 0 }
		}
		// Confirmed from stored state, the same way a hire is: a write path that clamps the pool back up
		// has not released anybody, and the readout must not claim it did.
		const after = store.state.layout.npcConfig?.pool?.find(entry => entry.roleId === roleId)?.count ?? 0
		if (after >= held) {
			toast.warning('The deployment kept the head - nothing changed')
			return { ok: false, priceCents: 0 }
		}
		toast.success(`Let one ${label} go - the wage comes off every closed day`)
		return { ok: true, priceCents: 0 }
	}

	/**
	 * A message round the room to one house the player has wronged. The lift stops at even, so money
	 * buys the end of a grudge and not a faction's loyalty - and a house already at even has nothing
	 * for sale here, which is what keeps the street from being purchased outright.
	 */
	async function buyFactionGoodwill(faction: Faction): Promise<PurchaseVerdict> {
		const price = FACTION_GOODWILL_COST_CENTS
		const result = repairFaction(world.get(), faction)
		if (!result.repaired) {
			toast.warning(`${faction} is already at or above what money can restore`)
			return { ok: false, priceCents: price }
		}
		// Charged before the world moves, exactly as a standing repair is: this purchase has no
		// external write that can refuse it, so the bank is the only gate.
		if (!ledger.withdraw(price)) {
			toast.warning(`The bank cannot cover ${formatTakings(price)}`)
			return { ok: false, priceCents: price }
		}
		world.set(result.state)
		toast.success(`${faction} is at ${result.relations}/100 with you again for ${formatTakings(price)}`)
		return { ok: true, priceCents: price }
	}

	/** Bought goodwill: the repair lifts standing toward neutral and never above it. */
	async function buyStandingRepair(): Promise<PurchaseVerdict> {
		const price = STANDING_REPAIR_COST_CENTS
		const result = repairStanding(standing.get())
		if (!result.repaired) {
			toast.warning('Standing is already at or above what money can restore')
			return { ok: false, priceCents: price }
		}
		// Charged before the state moves: a repair has no external write that can refuse it, so this
		// is the one purchase where the bank is the only gate.
		if (!ledger.withdraw(price)) {
			toast.warning(`The bank cannot cover ${formatTakings(price)}`)
			return { ok: false, priceCents: price }
		}
		standing.set(result.score)
		toast.success(`Standing repaired to ${result.score}/100 for ${formatTakings(price)}`)
		return { ok: true, priceCents: price }
	}

	/**
	 * Trade a placed fixture back in. The removal goes through the store's own delete path - the one
	 * that refuses a locked object and recomputes what stands where - and the money arrives only once
	 * the object is confirmed gone. That is the mirror of a purchase, where the bank moves only after
	 * the placement gate accepted the object: either way the write path decides, not this file.
	 */
	async function sellFixture(objectId: string): Promise<PurchaseVerdict> {
		const placed = findPlacedObject(objectId)
		if (!placed) {
			toast.warning('That fixture is not on the floor any more')
			return { ok: false, priceCents: 0 }
		}
		const price = fixtureSaleCents(placed.asset.tags)
		if (price === null) {
			toast.warning(`${placed.asset.name} bills nothing, so there is nothing to trade in`)
			return { ok: false, priceCents: 0 }
		}
		// One fixture per sale, and the sale names it. The delete path takes the whole selection, so the
		// row's own object is selected before the floor is handed over: a button that says "this one"
		// cannot quietly remove everything the player happened to have highlighted.
		store.select({ type: 'object', id: objectId })
		await store.deleteSelected()
		if (findPlacedObject(objectId)) {
			toast.warning('The floor would not give it back - nothing was paid')
			return { ok: false, priceCents: price }
		}
		ledger.deposit(price)
		toast.success(`Sold ${placed.asset.name} for ${formatTakings(price)}`)
		return { ok: true, priceCents: price }
	}

	/** Roles that work rather than consume: the ones a hire can add a head to. */
	function hireableRoles(config: NpcSimulationConfig | undefined) {
		if (!config) return []
		const visitors = visitorRoleIds(config.roles ?? [])
		const counts = new Map((config.pool ?? []).map(entry => [entry.roleId, Math.max(0, Math.floor(entry.count))]))
		return config.roles
			.filter(role => !visitors.has(role.id))
			.map(role => ({
				roleId: role.id,
				label: role.label || role.id,
				headcount: counts.get(role.id) ?? 0,
				priceCents: staffHirePriceCents(),
				// What this head is for. A head is a cost against a duty, and the row that spends money on
				// one has to say which duty goes unmanned when the last of them is released.
				duties: (config.tasks ?? [])
					.filter(task => (role.taskIds ?? []).includes(task.id))
					.map(task => task.label || task.id),
			}))
	}

	const bankCents = computed(() => Math.max(0, ledger.snapshot().bankCents))

	return {
		busy,
		// One purchase at a time: the affordability check and the charge are separated by an await on
		// the store's own save, so a second click could otherwise place twice and be charged once.
		buyFixture: (asset: AssetDef) => run(() => buyFixture(asset)),
		sellFixture: (objectId: string) => run(() => sellFixture(objectId)),
		fixtureRows,
		hireStaff: (roleId: string, config: NpcSimulationConfig | undefined) => run(() => hireStaff(roleId, config)),
		dismissStaff: (roleId: string, config: NpcSimulationConfig | undefined) => run(() => dismissStaff(roleId, config)),
		buyStandingRepair: () => run(() => buyStandingRepair()),
		buyFactionGoodwill: (faction: Faction) => run(() => buyFactionGoodwill(faction)),
		repairPriceCents: STANDING_REPAIR_COST_CENTS,
		factionRepairPriceCents: FACTION_GOODWILL_COST_CENTS,
		hireableRoles,
		priceOf,
		holdingCountOf,
		bankCents,
	}
}

export type ShopPurchases = ReturnType<typeof useShopPurchases>
