import { computed } from 'vue'
import { STANDING_REPAIR_COST_CENTS, affordable, fixturePriceCents, staffHirePriceCents } from '../domain/economy/purchases'
import { repairStanding } from '../domain/economy/reputation'
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
}) {
	const { store, ledger, standing } = deps
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

	function priceOf(asset: AssetDef): number | null {
		return fixturePriceCents(asset.tags)
	}

	async function buyFixture(asset: AssetDef): Promise<PurchaseVerdict> {
		const price = fixturePriceCents(asset.tags)
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
			}))
	}

	const bankCents = computed(() => Math.max(0, ledger.snapshot().bankCents))

	return {
		busy,
		// One purchase at a time: the affordability check and the charge are separated by an await on
		// the store's own save, so a second click could otherwise place twice and be charged once.
		buyFixture: (asset: AssetDef) => run(() => buyFixture(asset)),
		hireStaff: (roleId: string, config: NpcSimulationConfig | undefined) => run(() => hireStaff(roleId, config)),
		buyStandingRepair: () => run(() => buyStandingRepair()),
		repairPriceCents: STANDING_REPAIR_COST_CENTS,
		hireableRoles,
		priceOf,
		bankCents,
	}
}

export type ShopPurchases = ReturnType<typeof useShopPurchases>
