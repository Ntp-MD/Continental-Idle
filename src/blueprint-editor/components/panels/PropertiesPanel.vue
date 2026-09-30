<script setup lang="ts">
import { ref, computed, inject, onUnmounted } from 'vue'
import { useAssetsStore } from '../../blueprintStore'
import { useConfirm } from '@/composables/useConfirm'
import { useNpcSimulation } from '../../composables/useNpcSimulation'
import { NPC_MOOD_LEGEND } from '../../composables/useNpcOverlayDraw'
import { formatTakings, type TakingsSnapshot } from '../../domain/economy/takings'
import { settleDay, STAFF_DAY_WAGE_CENTS } from '../../domain/economy/upkeep'
import { staffHirePriceCents, FIXTURE_COST_DAYS, FIXTURE_HOLDING_COST_DAYS, FIXTURE_SALE_FRACTION } from '../../domain/economy/purchases'
import { useShopPurchases, type FixtureRow } from '../../composables/useShopPurchases'
import { REPUTATION_NEUTRAL, type ReputationReading } from '../../domain/economy/reputation'
import { FACTION_RELATIONS_DEFAULT, type Faction } from '../../domain/economy/standing-world'
import ObjectPropertiesForm from './ObjectPropertiesForm.vue'
import AssetProperties from './AssetProperties.vue'
import { usePanelResize } from '../../composables/usePanelResize'

const store = useAssetsStore()
const confirm = useConfirm().confirm
const { panelStyle, onResizeStart, onResizeKey, resetPanelWidth } = usePanelResize('right')

const object = computed(() => store.selectedObject())
const asset = computed(() => store.selectedAsset.value)
const selectedItems = computed(() => {
  const floor = store.currentFloor.value
  if (!floor) return []
  return store.state.selectionState.items
    .filter((i) => i.type === 'object')
    .map((i) => floor.objects.find((o) => o.id === i.id))
    .filter((o): o is NonNullable<typeof o> => !!o)
})
const hasLinkedGroup = computed(() => selectedItems.value.some((o) => o.linkGroupId))

const flattenName = ref('')

const previewActive = computed(() => store.isNpcPreview.value)
const npcSimulation = inject('npcSimulation') as ReturnType<typeof useNpcSimulation>
const { npcs, isPaused, pause, resume, reset, stop, simSpeed, trafficOn, setTraffic, walletReport } = npcSimulation
const total = computed(() => npcs.value.length)
const currentFloorLabel = computed(() => store.currentFloor.value?.label ?? '-')
const countsByRole = computed(() => {
  const map = new Map<string, number>()
  for (const npc of npcs.value) map.set(npc.type, (map.get(npc.type) ?? 0) + 1)
  return map
})

function onTogglePause() {
  if (isPaused.value) resume()
  else pause()
}

const NPC_STATUS_ORDER = ['walking', 'interacting', 'chatting', 'queued', 'waiting', 'idle'] as const
type NpcStatusKey = (typeof NPC_STATUS_ORDER)[number]
const NPC_STATUS_LABELS: Record<NpcStatusKey, string> = {
  walking: 'Moving',
  interacting: 'Interacting',
  chatting: 'Chatting',
  queued: 'Queued',
  waiting: 'Waiting',
  idle: 'Idle',
}
const statusCounts = ref<{ key: NpcStatusKey; label: string; count: number }[]>([])
const takings = ref<TakingsSnapshot | null>(null)
const traffic = ref({ spawned: 0, departed: 0, inside: 0, entrances: 0 })
/** Who is off shift because the last closed day could not pay them. */
const strike = ref({ onDuty: 0, offDuty: 0, insolvent: false, unpaidCents: 0 })
/** The outflow: a selected fixture or a staff head, bought through the store's own write paths. */
const shop = useShopPurchases({
  store,
  ledger: npcSimulation.takings,
  standing: { get: () => npcSimulation.getStandingScore(), set: score => npcSimulation.setStanding(score) },
  world: { get: () => npcSimulation.getWorldState(), set: next => npcSimulation.applyWorld(next) },
})
const shopBusy = shop.busy
const bankCents = computed(() => takings.value?.bankCents ?? 0)
const canAfford = (cents: number) => bankCents.value >= cents
/**
 * The fixture trade, one row per kind the house bills for. Listed by the shop rather than read off the
 * selection: while the lobby is running nothing can be highlighted on the floor, and a trade the player
 * cannot reach is a trade that does not exist.
 */
const fixtureKinds = computed(() => shop.fixtureRows().slice(0, 6))
async function buyFixture(row: FixtureRow) {
  await shop.buyFixture(row.asset)
}
async function sellFixture(row: FixtureRow) {
  if (row.sellableObjectId === null) return
  await shop.sellFixture(row.sellableObjectId)
}
const hirePriceCents = staffHirePriceCents()
const canAffordHire = computed(() => bankCents.value >= hirePriceCents)
const hireOptions = computed(() => shop.hireableRoles(store.state.layout.npcConfig).slice(0, 4))

async function hireAHead(role: { roleId: string }) {
  await shop.hireStaff(role.roleId, store.state.layout.npcConfig)
  // A hire changes the deployment, not the floor, so the commit watcher cannot see it: rebuild the
  // crowd the player just paid for. `refresh` is inert when no preview is running.
  npcSimulation.refresh()
}
async function letAHeadGo(role: { roleId: string }) {
  await shop.dismissStaff(role.roleId, store.state.layout.npcConfig)
  // The same reason as a hire: releasing a head is a deployment write, and the crowd on the floor has
  // to lose them or the readout is lying about who is walking.
  npcSimulation.refresh()
}
function toggleTraffic() {
  setTraffic(!trafficOn.value)
}
const takingsSources = computed(() => (takings.value?.byTag ?? []).slice(0, 4))
/** Standing is a state now, so it is polled from the simulation instead of re-derived from counters. */
const standing = ref<ReputationReading | null>(null)
/** Money leaves to buy goodwill only while standing sits below what money can restore. */
const canRepairStanding = computed(() => (standing.value?.score ?? REPUTATION_NEUTRAL) < REPUTATION_NEUTRAL)
/** The world outside: neutrality, the High Table's pressure, and the factions the house still has. */
const world = ref<ReturnType<typeof npcSimulation.getWorld> | null>(null)
/** What the house was asked to do today, judged on the last day that closed. */
const objectives = ref<ReturnType<typeof npcSimulation.getObjectives>>([])
/** What the last closed night actually paid for that board, read off the close rather than recomputed. */
const objectiveReward = ref<ReturnType<typeof npcSimulation.getObjectiveReward>>({ cents: 0, capped: false })
/** A house nobody trusts still trades, at a discount - so the row is a warning, never a lockout. */
const worldDiscounted = computed(() => (world.value?.continuity.multiplier ?? 1) < 1)
/** Only the groups the house has actually dealt with: four rows of nothing is not a readout. */
const servedFactions = computed(() => (world.value?.world.standings ?? []).filter(faction => faction.served + faction.lost > 0))
/** A house below even has something money can still do for it; one at or above even has nothing to buy. */
const repairableFactions = computed(() => (world.value?.world.standings ?? []).filter(faction => faction.relations < FACTION_RELATIONS_DEFAULT))
const canAffordFactionRepair = computed(() => (takings.value?.bankCents ?? 0) >= shop.factionRepairPriceCents)

async function sendWord(faction: Faction) {
  await shop.buyFactionGoodwill(faction)
}
/**
 * What every ladder together says this house is worth tonight. Read off the settled world rather than
 * recomputed here: the close charges its discount through this same number, and a panel that did its own
 * arithmetic would be free to disagree with the money that actually left.
 */
const houseWorth = computed(() => world.value?.worth ?? 1)

async function repairStandingNow() {
  await shop.buyStandingRepair()
}
/** The day settled against payroll: the crowd is half of the deployment, and it is not free. */
const payroll = computed(() => {
  const tally = takings.value
  if (!tally || !standing.value) return null
  return settleDay({
    bankCents: tally.bankCents,
    incomePerDayCents: Math.round(tally.perDayCents * houseWorth.value),
    staffHeadcount: npcSimulation.getStaffHeadcount(),
  })
})
/**
 * What the day's loss is worth in heads. A negative profit is already true, but the number a player can
 * act on is the one measured in the unit they can change: one head is one day's wage, and the ceiling is
 * the crew they actually have.
 */
const wageGapHeads = computed(() => {
  const settled = payroll.value
  if (!settled || settled.profitCents >= 0 || settled.staffHeadcount <= 0) return 0
  return Math.min(Math.ceil(-settled.profitCents / STAFF_DAY_WAGE_CENTS), settled.staffHeadcount)
})
const statusTimer = window.setInterval(() => {
  if (!previewActive.value) return
  const counts = new Map<string, number>()
  for (const npc of npcs.value) counts.set(npc.status, (counts.get(npc.status) ?? 0) + 1)
  const next = NPC_STATUS_ORDER.filter((status) => counts.has(status)).map((status) => ({
    key: status,
    label: NPC_STATUS_LABELS[status],
    count: counts.get(status)!,
  }))
  const prev = statusCounts.value
  const statusChanged = !(prev.length === next.length && prev.every((p, i) => p.key === next[i].key && p.count === next[i].count))
  if (statusChanged) statusCounts.value = next
  const tally = npcSimulation.takings.snapshot()
  const prevTally = takings.value
  const tallyChanged =
    !prevTally ||
    prevTally.bankCents !== tally.bankCents ||
    prevTally.served !== tally.served ||
    prevTally.walkOuts !== tally.walkOuts ||
    prevTally.queueAbandons !== tally.queueAbandons ||
    prevTally.perMinuteCents !== tally.perMinuteCents ||
    prevTally.perDayCents !== tally.perDayCents ||
    prevTally.daysCompleted !== tally.daysCompleted ||
    prevTally.lastDayUnpaidCents !== tally.lastDayUnpaidCents ||
    prevTally.lastDayDiscountCents !== tally.lastDayDiscountCents
  if (tallyChanged) takings.value = tally
  const summary = npcSimulation.getTrafficSummary()
  const prevTraffic = traffic.value
  const trafficChanged =
    prevTraffic.spawned !== summary.spawned ||
    prevTraffic.departed !== summary.departed ||
    prevTraffic.inside !== summary.inside ||
    prevTraffic.entrances !== summary.entrances
  if (trafficChanged) traffic.value = summary
  const nextStanding = npcSimulation.getStanding()
  const prevStanding = standing.value
  if (!prevStanding || prevStanding.score !== nextStanding.score || prevStanding.unproven !== nextStanding.unproven) {
    standing.value = nextStanding
  }
  const nextStrike = npcSimulation.getStrike()
  const prevStrike = strike.value
  if (
    prevStrike.onDuty !== nextStrike.onDuty ||
    prevStrike.offDuty !== nextStrike.offDuty ||
    prevStrike.unpaidCents !== nextStrike.unpaidCents
  ) {
    strike.value = nextStrike
  }
  // The world outside, on the one existing poll: neutrality, what the High Table holds, and who the
  // house still welcomes. A second timer here would read a half-settled day against a settled one.
  const nextWorld = npcSimulation.getWorld()
  const prevWorld = world.value
  if (
    !prevWorld ||
    prevWorld.continuity.score !== nextWorld.continuity.score ||
    prevWorld.continuity.breaches !== nextWorld.continuity.breaches ||
    prevWorld.continuity.underPressure !== nextWorld.continuity.underPressure ||
    prevWorld.pressure.outstandingCents !== nextWorld.pressure.outstandingCents ||
    prevWorld.pressure.underAudit !== nextWorld.pressure.underAudit ||
    prevWorld.creditCostCents !== nextWorld.creditCostCents ||
    prevWorld.worth !== nextWorld.worth ||
    prevWorld.world.estranged.join() !== nextWorld.world.estranged.join() ||
    prevWorld.incidentsToday !== nextWorld.incidentsToday
  ) {
    world.value = nextWorld
  }
  // The board settles on the same closed day as the world, so it is read off the same poll rather
  // than given a timer of its own - two timers on one simulation is a reading half a day stale.
  const nextBoard = npcSimulation.getObjectives()
  if (nextBoard.some((goal, index) => objectives.value[index]?.verdict !== goal.verdict || objectives.value[index]?.streak !== goal.streak)) {
    objectives.value = nextBoard
  }
  const nextReward = npcSimulation.getObjectiveReward()
  if (objectiveReward.value.cents !== nextReward.cents || objectiveReward.value.capped !== nextReward.capped) {
    objectiveReward.value = nextReward
  }
}, 300)
onUnmounted(() => window.clearInterval(statusTimer))

async function onReset() {
  const confirmed = await confirm({
    title: 'Clear Simulation',
    message: 'Remove all deployed NPCs and exit preview?',
    confirmLabel: 'Clear',
    cancelLabel: 'Cancel',
    danger: true,
  })
  if (!confirmed) return
  reset()
  store.setMode('move')
}
function onExitDeploy() {
  stop()
  store.setMode('move')
}

async function doLink() {
  const objIds = store.state.selectionState.items.filter((i) => i.type === 'object').map((i) => i.id)
  if (objIds.length < 2) return
  await store.linkObjects([...objIds])
}

async function doUnlink() {
  const linked = selectedItems.value.find((o) => o.linkGroupId)
  if (!linked) return
  const confirmed = await confirm({
    title: 'Unlink objects',
    message: 'Break the link group? The objects will move independently afterwards.',
    confirmLabel: 'Unlink',
    cancelLabel: 'Cancel',
  })
  if (!confirmed) return
  await store.unlinkObject(linked.id)
}

async function doFlatten() {
  const ids = store.state.selectionState.items.filter((i) => i.type === 'object').map((i) => i.id)
  if (ids.length < 2) return
  const confirmed = await confirm({
    title: 'Flatten selection',
    message: 'Merge the selected objects into a single SVG asset? This cannot be undone.',
    confirmLabel: 'Flatten',
    cancelLabel: 'Cancel',
    danger: true,
  })
  if (!confirmed) return
  const id = await store.flattenToSvgAsset(flattenName.value || undefined)
  if (id) {
    flattenName.value = ''
  }
}
</script>

<template>
  <div class="sidebar__panel" :style="panelStyle">
    <div
      class="sidebar__resizer sidebar__resizer--right"
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize properties panel"
      title="Drag to resize (double-click to reset)"
      tabindex="0"
      @mousedown="onResizeStart"
      @keydown="onResizeKey"
      @dblclick="resetPanelWidth"
    />
    <div class="form__header">
      <span>Properties</span>
      <span>{{ store.currentFloor.value?.label ?? '-' }} - {{ store.currentFloor.value?.name ?? '' }}</span>
    </div>
    <div class="form__col">
      <!-- NPC preview controls -->
      <div v-if="previewActive" class="form__col form--section">
        <div class="form__col">
          <h3>NPC Preview</h3>
          <div class="form__row">
            <div class="form__col">
              <strong>{{ currentFloorLabel }}</strong>
              <span>{{ total }} NPC{{ total === 1 ? '' : 's' }}</span>
            </div>
            <span class="badge" :class="isPaused ? 'flag--warning' : 'flag--success'" role="status">{{
              isPaused ? 'Paused' : 'Running'
            }}</span>
            <div class="form__row form--wrap">
              <span v-for="[type, count] in countsByRole" :key="type" class="npc__role">
                <span>{{ type }}</span>
                <b>{{ count }}</b>
              </span>
            </div>
          </div>
          <div v-if="total > 0" class="form__row form--wrap">
            <span v-for="s in statusCounts" :key="s.key" class="form__hint">
              {{ s.label }} <b>{{ s.count }}</b>
            </span>
          </div>
          <div v-if="takings" class="takings">
            <div class="form__row form--wrap">
              <span class="form__hint">Takings <b>{{ formatTakings(takings.bankCents) }}</b></span>
              <span v-if="takings.carriedCents > 0" class="form__hint">Carried in <b>{{ formatTakings(takings.carriedCents) }}</b></span>
              <span v-if="walletReport && walletReport.earnedCents > 0" class="form__hint">
                While away <b>+{{ formatTakings(walletReport.earnedCents) }}</b> for {{ Math.round(walletReport.creditedMinutes) }} min{{ walletReport.capped ? ' (capped)' : '' }}
              </span>
              <span class="form__hint">Per minute <b>{{ formatTakings(takings.perMinuteCents) }}</b></span>
              <span class="form__hint">Per day est. <b>{{ formatTakings(takings.perDayCents) }}</b></span>
              <span class="form__hint">Services/day est. <b>{{ takings.servicesPerDay }}</b></span>
              <span class="form__hint">Served <b>{{ takings.served }}</b></span>
              <span class="form__hint">Walk-outs <b>{{ takings.walkOuts }}</b></span>
              <span class="form__hint">Abandoned lines <b>{{ takings.queueAbandons }}</b></span>
            </div>
            <div v-if="standing" class="form__row form--wrap">
              <span class="form__hint">
                Reputation <b>{{ standing.score }}/100</b>
                <template v-if="standing.unproven"> (no evidence yet)</template>
              </span>
              <button
                v-if="canRepairStanding"
                type="button"
                :disabled="shopBusy"
                title="Bought goodwill lifts standing toward neutral; it cannot buy a better reputation than the crowd gives"
                @click="repairStandingNow"
              >
                Repair standing for {{ formatTakings(shop.repairPriceCents) }}
              </button>
              <span v-if="payroll" class="form__hint">Staff paid <b>{{ payroll.staffHeadcount }}</b></span>
              <span v-if="payroll" class="form__hint">Payroll per day <b>{{ formatTakings(payroll.payrollCents) }}</b></span>
              <span v-if="payroll" class="form__hint">Profit per day <b>{{ formatTakings(payroll.profitCents) }}</b></span>
              <span
                v-if="wageGapHeads > 0"
                class="form__hint flag--warning"
                :title="`A day's wage is ${formatTakings(STAFF_DAY_WAGE_CENTS)}, so the night is short by the pay of ${wageGapHeads} of the ${payroll?.staffHeadcount ?? 0} heads on the payroll - let one go below, or grow what the floor earns`"
              >
                The wage bill is <b>{{ wageGapHeads }} head{{ wageGapHeads === 1 ? '' : 's' }}</b> bigger than the night
              </span>
              <span
                v-if="houseWorth < 1"
                class="form__hint flag--warning"
                title="Standing with the crowd, how safe the house is and what the High Table holds, priced together - the close takes this off what the night earned"
              >
                The house is worth <b>{{ Math.round(houseWorth * 100) }}%</b> of face value
              </span>
              <span
                v-if="(world?.creditCostCents ?? 0) > 0"
                class="form__hint flag--warning"
                title="What the last closed night's credit cost the bank"
              >
                Kept back last night <b>{{ formatTakings(world?.creditCostCents ?? 0) }}</b>
              </span>
              <span v-if="payroll && !payroll.selfFunding" class="form__hint">
                Days of bank left <b>{{ payroll.runwayDays === null ? 0 : payroll.runwayDays }}</b>
              </span>
              <span v-if="payroll && payroll.insolvent" class="form__hint">
                Wages unpaid <b>{{ formatTakings(payroll.unpaidWagesCents) }}</b>
              </span>
              <span v-if="strike.offDuty > 0" class="form__hint">
                Staff off duty <b>{{ strike.offDuty }}</b>
              </span>
              <span v-if="strike.offDuty > 0" class="form__hint">
                {{ strike.onDuty }} still on shift - the bank could not pay the rest of the crowd
              </span>
            </div>
            <div v-if="world" class="form__row form--wrap">
              <span class="form__hint" title="How safe the house is. A scene inside costs this, and the street takes days to forget.">
                Neutrality <b>{{ world.continuity.score }}/100</b>
              </span>
              <span v-if="world.incidentsToday > 0" class="form__hint flag--warning">
                Scenes today <b>{{ world.incidentsToday }}</b>
              </span>
              <span v-if="worldDiscounted" class="form__hint flag--warning">
                Clients pay {{ Math.round(world.continuity.multiplier * 100) }}% while the house is unsafe
              </span>
              <span v-if="world.continuity.underPressure" class="form__hint flag--warning">
                The High Table has taken notice
              </span>
              <span v-if="world.pressure.outstandingCents > 0" class="form__hint">
                Outstanding with the House <b>{{ formatTakings(world.pressure.outstandingCents) }}</b>
              </span>
              <span v-if="world.pressure.underAudit" class="form__hint flag--warning">
                An auditor has been sent
              </span>
              <span v-if="world.world.estranged.length > 0" class="form__hint flag--warning">
                No longer welcome: {{ world.world.estranged.join(', ') }}
              </span>
              <span
                v-for="faction in servedFactions"
                :key="faction.id"
                class="form__hint"
                :class="{ 'flag--warning': faction.lost > 0 }"
                :title="`Nights this house judged well or ill - one close counts once, whatever the crowd did in it`"
              >
                {{ faction.id }}
                <b>{{ faction.relations }}/100</b>
                <span>{{ faction.served }} good nights, {{ faction.lost }} bad</span>
              </span>
            </div>
            <div v-if="objectives.length > 0" class="form__row form--wrap">
              <span
                v-for="goal in objectives"
                :key="goal.id"
                class="form__hint"
                :class="{ 'flag--warning': goal.verdict === 'unmet' }"
                :title="goal.detail"
              >
                {{ goal.label }}
                <b>{{ goal.verdict === 'unknown' ? 'not yet' : goal.verdict === 'met' ? `${goal.streak} day${goal.streak === 1 ? '' : 's'}` : 'missed' }}</b>
              </span>
              <span
                class="form__hint"
                :class="{ 'flag--success': objectiveReward.cents > 0 }"
                title="A share of what the night itself took, paid on top of the takings"
              >
                Goals paid <b>{{ formatTakings(objectiveReward.cents) }}</b>
                <template v-if="objectiveReward.capped">(capped)</template>
              </span>
            </div>
            <div v-if="repairableFactions.length" class="form__row form--wrap">
              <button
                v-for="faction in repairableFactions"
                :key="faction.id"
                type="button"
                :disabled="shopBusy || !canAffordFactionRepair"
                :title="`Sends word to the ${faction.id} - lifts standing with them toward even, and no further`"
                @click="sendWord(faction.id)"
              >
                Send word to {{ faction.id }} for {{ formatTakings(shop.factionRepairPriceCents) }}
              </button>
              <span v-if="!canAffordFactionRepair" class="form__hint flag--warning">
                A message costs {{ formatTakings(shop.factionRepairPriceCents) }}
              </span>
            </div>
            <div v-for="row in fixtureKinds" :key="row.asset.id" class="form__row form--wrap">
              <span class="form__hint">
                {{ row.asset.name }}
                <b v-if="row.held > 0">{{ row.held }} held</b>
              </span>
              <button
                type="button"
                :disabled="shopBusy || !canAfford(row.nextCents)"
                :title="`Costs ${formatTakings(row.nextCents)} - ${FIXTURE_COST_DAYS} days of what it bills, plus ${FIXTURE_HOLDING_COST_DAYS} for each of the ${row.held} the house already holds`"
                @click="buyFixture(row)"
              >
                Buy one for {{ formatTakings(row.nextCents) }}
              </button>
              <button
                v-if="row.sellableObjectId !== null"
                type="button"
                :disabled="shopBusy"
                :title="`Takes one ${row.asset.name} off this floor and back ${Math.round(FIXTURE_SALE_FRACTION * 100)}% of what a first one cost - the premium for holding several is not refunded`"
                @click="sellFixture(row)"
              >
                Sell one for {{ formatTakings(row.sellCents) }}
              </button>
              <span v-if="!canAfford(row.nextCents)" class="form__hint flag--warning">
                The bank holds {{ formatTakings(bankCents) }}
              </span>
            </div>
            <div v-for="role in hireOptions" :key="role.roleId" class="form__row form--wrap">
              <button
                type="button"
                :disabled="shopBusy || !canAffordHire"
                :title="`Adds one ${role.label} to the ${role.headcount} already deployed${role.duties.length ? ` - they take a ${role.duties.join(' and ')} post` : ''}; the wage lands on every closed day`"
                @click="hireAHead(role)"
              >
                Hire {{ role.label }} ({{ role.headcount }} deployed<template v-if="role.duties.length"> · {{ role.duties.join(', ') }}</template>) for {{ formatTakings(role.priceCents) }}
              </button>
              <button
                v-if="role.headcount > 0"
                type="button"
                :disabled="shopBusy"
                :class="{ 'flag--warning': role.headcount === 1 }"
                :title="role.headcount === 1
                  ? `The last ${role.label} on the floor${role.duties.length ? ` - the ${role.duties.join(' and ')} post goes unmanned` : ''}. The wage stops landing on closed days, and so does the service`
                  : 'Takes one off the payroll - the wage stops landing on closed days, and so does the service they provided'"
                @click="letAHeadGo(role)"
              >
                Let one go
              </button>
              <span v-if="!canAffordHire" class="form__hint flag--warning">
                A head costs {{ formatTakings(hirePriceCents) }}
              </span>
            </div>
            <ul v-if="takingsSources.length" class="takings__sources">
              <li v-for="source in takingsSources" :key="source.tag" class="takings__source">
                <span>{{ source.tag }}</span>
                <b>{{ formatTakings(source.cents) }}</b>
                <span>{{ source.count }}x</span>
              </li>
            </ul>
          </div>
          <div class="form__row form--wrap">
            <button
              type="button"
              :class="{ 'flag--active': trafficOn }"
              :aria-pressed="trafficOn"
              title="Replace the standing guests with arrivals that walk in through the street doors and leave again"
              @click="toggleTraffic"
            >
              {{ trafficOn ? 'Footfall on' : 'Footfall off' }}
            </button>
            <template v-if="trafficOn">
              <span class="form__hint">Walked in <b>{{ traffic.spawned }}</b></span>
              <span class="form__hint">In the room <b>{{ traffic.inside }}</b></span>
              <span class="form__hint">Left again <b>{{ traffic.departed }}</b></span>
            </template>
            <!-- Outside the `trafficOn` block on purpose: footfall stays off when it has nowhere to
                 deliver, and the reason has to be readable in the state the player is actually in. -->
            <span v-if="traffic.entrances === 0" class="form__hint flag--warning">
              No street door - nobody can enter, so the crowd stands where it was deployed
            </span>
          </div>
          <div class="form__row form--wrap">
            <span class="form__hint">Moods</span>
            <span v-for="mood in NPC_MOOD_LEGEND" :key="mood.kind" class="form__hint">
              <span class="swatch" :style="{ background: mood.color }" />
              {{ mood.label }}
            </span>
          </div>
          <div class="form__row form--wrap">
            <button
              type="button"
              :aria-label="isPaused ? 'Resume NPC simulation' : 'Pause NPC simulation'"
              @click="onTogglePause"
            >
              {{ isPaused ? 'Resume' : 'Pause' }}
            </button>
            <div class="form__row" role="group" aria-label="Simulation speed">
              <button
                v-for="s in [1, 2, 4, 8]"
                :key="s"
                type="button"
                :class="{ 'flag--active': simSpeed === s }"
                :aria-pressed="simSpeed === s"
                @click="simSpeed = s"
              >
                {{ s }}x
              </button>
            </div>
            <button type="button" class="flag--danger" aria-label="Clear all NPCs and exit preview" @click="onReset">
              Clear
            </button>
            <button type="button" aria-label="Exit NPC preview" @click="onExitDeploy">Exit</button>
          </div>
        </div>
      </div>

      <div v-if="!object && !asset && store.state.selectionState.items.length === 0" class="form__col form--section">
        <div class="form__col">
          <div class="empty">Select an object or asset to edit properties.</div>
          <div>
            Click an asset in the palette to edit its definition. Click an object on the canvas to edit instance
            properties.
          </div>
        </div>
      </div>

      <!-- Multi-selection -->
      <div v-if="store.state.selectionState.items.length >= 2" class="form__col form--section">
        <div class="form__col">
          <h3>{{ selectedItems.length }} object{{ selectedItems.length === 1 ? '' : 's' }} selected</h3>
          <div class="form__row">
            <ul class="multi-select__list">
              <li v-for="obj in selectedItems" :key="obj.id" class="multi-select__item">
                <span class="truncate">{{ obj.id }}</span>
                <span class="multi-select__pos">x:{{ obj.x }} y:{{ obj.y }}</span>
              </li>
            </ul>
          </div>
          <div class="form__row">
            <button @click="doLink">Link Objects</button>
            <button v-if="hasLinkedGroup" @click="doUnlink">Unlink</button>
          </div>
        </div>
        <div class="form__col">
          <h3>Flatten to Single Asset</h3>
          <div class="form__row">
            <label>Name</label>
            <input v-model="flattenName" type="text" placeholder="e.g. Table + Chairs" />
          </div>
          <button class="flag--success size--fill" @click="doFlatten">Flatten to SVG Asset</button>
        </div>
      </div>

      <!-- Asset / object editor -->
      <div v-if="asset || (object && store.state.selectionState.items.length === 1)" class="form__col form--section">
        <AssetProperties v-if="asset" :key="asset.id" :asset="asset" />
        <ObjectPropertiesForm v-else-if="object && store.state.selectionState.items.length === 1" :object="object" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.multi-select__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
  max-height: 200px;
  overflow-y: auto;
}

.multi-select__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--gap-sm);
  padding: var(--gap-xs) var(--gap-sm);
  border: 1px solid var(--border-dim);
}

.multi-select__pos {
  color: var(--text-secondary);
  flex-shrink: 0;
}

.npc__role {
  display: inline-flex;
  align-items: center;
  gap: var(--gap-xs);
  padding: var(--gap-xxs) var(--gap-xs);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
}

.npc__role b {
  color: var(--accent-blue);
}

.takings {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
}

.takings__sources {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-xs);
  margin: 0;
  padding: 0;
  list-style: none;
}

.takings__source {
  display: inline-flex;
  align-items: center;
  gap: var(--gap-xs);
  padding: var(--gap-xxs) var(--gap-xs);
  color: var(--text-secondary);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
}

.takings__source b {
  color: var(--accent-gold);
}
</style>
