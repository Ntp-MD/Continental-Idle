<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { gameState } from '@/engine/gameState'
import { getBranchDef } from '@/data/branches'
import { SUPPLY_ROUTE_TYPES } from '@/data/supplyRoutes'
import {
  getSupplyRoutes, canEstablishRoute, establishRoute, canHijackRoute, hijackRoute,
  stabilizeRoute, dismantleRoute, getStabilizeCost,
  getHijackableRoutes, getHijackSuccessChance
} from '@/engine/supplyRouteManager'
import { formatNumber } from '@/engine/format'
import { eventBus } from '@/engine/eventBus'
import type { SupplyRouteType, BranchId, SupplyRoute } from '@/types'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits(['close'])

const ACTION_DEBOUNCE_MS = 200

function createDebouncedAction<A extends unknown[]>(fn: (...args: A) => void): (...args: A) => void {
  let lastCall = 0
  return (...args: A) => {
    const now = Date.now()
    if (now - lastCall < ACTION_DEBOUNCE_MS) return
    lastCall = now
    fn(...args)
  }
}

const routes = ref<SupplyRoute[]>([])
const selectedType = ref<SupplyRouteType>('contraband')
const selectedFrom = ref<BranchId>('bangkok')
const selectedTo = ref<BranchId>('rome')
const hijackableRoutes = ref<SupplyRoute[]>([])
const message = ref('')
const messageType = ref<'success' | 'error' | 'warning'>('success')

function refresh() {
  if (!props.visible) return
  routes.value = [...getSupplyRoutes()]
  hijackableRoutes.value = [...getHijackableRoutes()]
  const state = gameState.get()
  selectedFrom.value = state.activeBranch
  const otherBranches = state.worldMap.unlockedBranches.filter(b => b !== state.activeBranch)
  if (otherBranches.length > 0 && !otherBranches.includes(selectedTo.value)) {
    selectedTo.value = otherBranches[0]
  }
}

const unlockedBranches = computed(() => {
  const state = gameState.get()
  return state.worldMap.unlockedBranches
})

const availableToBranches = computed(() => {
  return unlockedBranches.value.filter(b => b !== selectedFrom.value)
})

const selectedTypeDef = computed(() => {
  return SUPPLY_ROUTE_TYPES.find(t => t.id === selectedType.value)
})

const canEstablish = computed(() => {
  return canEstablishRoute(selectedFrom.value, selectedTo.value, selectedType.value)
})

const establishCost = computed(() => {
  return selectedTypeDef.value?.establishCost ?? 0
})

const activeBranchCurrency = computed(() => {
  const state = gameState.get()
  return state.branches[state.activeBranch]?.currency ?? 0
})

let messageTimeout: ReturnType<typeof setTimeout> | null = null

function showMessage(msg: string, type: 'success' | 'error' | 'warning') {
  message.value = msg
  messageType.value = type
  if (messageTimeout) clearTimeout(messageTimeout)
  messageTimeout = setTimeout(() => { message.value = '' }, 3000)
}

function doEstablish() {
  const ok = establishRoute(selectedFrom.value, selectedTo.value, selectedType.value)
  if (ok) {
    showMessage(`Route established: ${getBranchDef(selectedFrom.value)?.name} → ${getBranchDef(selectedTo.value)?.name}`, 'success')
    refresh()
  } else {
    showMessage('Cannot establish route — check requirements', 'error')
  }
}

function doHijack(routeId: string) {
  const result = hijackRoute(routeId)
  if (result.success) {
    showMessage('Route hijacked successfully!', 'success')
  } else {
    showMessage(result.reason || 'Hijack failed', 'error')
  }
  refresh()
}

function doStabilize(routeId: string) {
  const ok = stabilizeRoute(routeId)
  if (ok) {
    showMessage('Route stabilized (+20 stability)', 'success')
    refresh()
  } else {
    showMessage('Cannot stabilize — insufficient funds', 'error')
  }
}

function doDismantle(routeId: string) {
  const ok = dismantleRoute(routeId)
  if (ok) {
    showMessage('Route dismantled', 'warning')
    refresh()
  }
}

function getRouteTypeColor(type: SupplyRouteType): string {
  return SUPPLY_ROUTE_TYPES.find(t => t.id === type)?.color ?? '#888'
}

function getRouteTypeIcon(type: SupplyRouteType): string {
  return SUPPLY_ROUTE_TYPES.find(t => t.id === type)?.icon ?? '?'
}

function getRouteTypeName(type: SupplyRouteType): string {
  return SUPPLY_ROUTE_TYPES.find(t => t.id === type)?.name ?? type
}

function getStabilityColor(stability: number): string {
  if (stability > 60) return '#4caf50'
  if (stability > 30) return '#ff9800'
  return '#f44336'
}

function getHijackChance(routeId: string): number {
  return Math.round(getHijackSuccessChance(routeId) * 100)
}

function canHijack(routeId: string): boolean {
  return canHijackRoute(routeId)
}

function getRouteIncome(route: SupplyRoute): number {
  return route.incomePerTick * (route.stability / 100)
}

const totalRouteIncome = computed(() => {
  return routes.value
    .filter(r => !r.aiOwned)
    .reduce((sum, r) => sum + getRouteIncome(r), 0)
})

const aiRouteCount = computed(() => routes.value.filter(r => r.aiOwned).length)

const debouncedDoEstablish = createDebouncedAction(doEstablish)
const debouncedDoHijack = createDebouncedAction(doHijack)
const debouncedDoStabilize = createDebouncedAction(doStabilize)
const debouncedDoDismantle = createDebouncedAction(doDismantle)

onMounted(() => {
  refresh()
  eventBus.on('supplyroute:established', refresh)
  eventBus.on('supplyroute:hijacked', refresh)
  eventBus.on('supplyroute:hijack-failed', refresh)
  eventBus.on('supplyroute:collapsed', refresh)
  eventBus.on('supplyroute:stabilized', refresh)
  eventBus.on('supplyroute:dismantled', refresh)
  eventBus.on('income:tick', refresh)
})

onUnmounted(() => {
  if (messageTimeout) clearTimeout(messageTimeout)
  eventBus.off('supplyroute:established', refresh)
  eventBus.off('supplyroute:hijacked', refresh)
  eventBus.off('supplyroute:hijack-failed', refresh)
  eventBus.off('supplyroute:collapsed', refresh)
  eventBus.off('supplyroute:stabilized', refresh)
  eventBus.off('supplyroute:dismantled', refresh)
  eventBus.off('income:tick', refresh)
})
</script>

<template>
  <div v-if="visible" class="panel" @click.self="emit('close')">
    <div class="panel__content supplyroute__panel" role="dialog" aria-modal="true" aria-labelledby="supplyroute__title">
      <h2 id="supplyroute__title" class="panel__title">Underworld Supply Routes</h2>

      <div v-if="message" class="supplyroute__message" :class="`supplyroute__message__${messageType}`">
        {{ message }}
      </div>

      <!-- Active Routes -->
      <section class="supplyroute__section">
        <h3 class="supplyroute__heading">Active Routes ({{ routes.length }})</h3>
        <div v-if="routes.length > 0" class="supplyroute__summary">
          <span class="supplyroute__summary">Total Income: {{ formatNumber(totalRouteIncome) }}/tick</span>
          <span class="supplyroute__summary">Player Routes: {{ routes.filter(r => !r.aiOwned).length }}</span>
          <span v-if="aiRouteCount > 0" class="supplyroute__summary">AI Routes: {{ aiRouteCount }} (hijackable)</span>
        </div>
        <div v-if="routes.length === 0" class="supplyroute__empty">
          No supply routes established yet.
        </div>
        <div v-else class="supplyroute__list">
          <div v-for="route in routes" :key="route.id" class="card card__panel">
            <div class="supplyroute__head">
              <span class="supplyroute__icon" :style="{ color: getRouteTypeColor(route.type) }">{{ getRouteTypeIcon(route.type) }}</span>
              <span class="supplyroute__type">{{ getRouteTypeName(route.type) }}</span>
              <span v-if="route.hijacked" class="supplyroute__hijackedbadge">HIJACKED</span>
            </div>
            <div class="supplyroute__info">
              {{ getBranchDef(route.from)?.name || route.from }} → {{ getBranchDef(route.to)?.name || route.to }}
            </div>
            <div class="supplyroute__stats">
              <span class="supplyroute__stat">
                Stability: <span :style="{ color: getStabilityColor(route.stability) }">{{ route.stability.toFixed(0) }}%</span>
              </span>
              <span class="supplyroute__stat">
                Income: {{ formatNumber(getRouteIncome(route)) }}/tick
              </span>
            </div>
            <div class="supplyroute__bar">
              <div class="supplyroute__fill" :style="{ width: route.stability + '%', background: getStabilityColor(route.stability) }"></div>
            </div>
            <div class="actions">
              <button class="btn__success" @click="debouncedDoStabilize(route.id)">
                Stabilize ({{ formatNumber(getStabilizeCost(route.id)) }})
              </button>
              <button class="btn__danger" @click="debouncedDoDismantle(route.id)">
                Dismantle
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Establish New Route -->
      <section class="supplyroute__section">
        <h3 class="supplyroute__heading">Establish New Route</h3>
        <div class="supplyroute__form">
          <label class="supplyroute__label">
            Type
            <select v-model="selectedType" class="supplyroute__select">
              <option v-for="t in SUPPLY_ROUTE_TYPES" :key="t.id" :value="t.id">
                {{ t.icon }} {{ t.name }} ({{ formatNumber(t.establishCost) }})
              </option>
            </select>
          </label>
          <label class="supplyroute__label">
            From
            <select v-model="selectedFrom" class="supplyroute__select">
              <option v-for="b in unlockedBranches" :key="b" :value="b">{{ getBranchDef(b)?.name || b }}</option>
            </select>
          </label>
          <label class="supplyroute__label">
            To
            <select v-model="selectedTo" class="supplyroute__select">
              <option v-for="b in availableToBranches" :key="b" :value="b">{{ getBranchDef(b)?.name || b }}</option>
            </select>
          </label>
        </div>
        <p v-if="selectedTypeDef" class="supplyroute__desc">{{ selectedTypeDef.description }}</p>
        <p class="supplyroute__cost">Cost: {{ formatNumber(establishCost) }} | Funds: {{ formatNumber(activeBranchCurrency) }}</p>
        <button class="btn__gold" :disabled="!canEstablish" @click="debouncedDoEstablish">
          Establish Route
        </button>
      </section>

      <!-- Hijack Routes -->
      <section v-if="hijackableRoutes.length > 0" class="supplyroute__section">
        <h3 class="supplyroute__heading">Hijackable Routes</h3>
        <p class="supplyroute__hint">Send an assassin to steal a route from another branch. Requires an idle assassin with loyalty ≥ 20.</p>
        <div class="supplyroute__list">
          <div v-for="route in hijackableRoutes" :key="route.id" class="card card__panel card__danger">
            <div class="supplyroute__head">
              <span class="supplyroute__icon" :style="{ color: getRouteTypeColor(route.type) }">{{ getRouteTypeIcon(route.type) }}</span>
              <span class="supplyroute__type">{{ getRouteTypeName(route.type) }}</span>
            </div>
            <div class="supplyroute__info">
              {{ getBranchDef(route.from)?.name || route.from }} → {{ getBranchDef(route.to)?.name || route.to }}
            </div>
            <div class="supplyroute__stats">
              <span class="supplyroute__stat">Stability: {{ route.stability.toFixed(0) }}%</span>
              <span class="supplyroute__stat">Success: {{ canHijack(route.id) ? getHijackChance(route.id) + '%' : 'N/A' }}</span>
            </div>
            <button
              class="btn__danger"
              :disabled="!canHijack(route.id)"
              @click="debouncedDoHijack(route.id)"
            >
              Hijack ({{ formatNumber(SUPPLY_ROUTE_TYPES.find(t => t.id === route.type)?.hijackCost ?? 0) }})
            </button>
          </div>
        </div>
      </section>

      <button class="panel__close" @click="emit('close')" aria-label="Close supply routes panel">✕</button>
    </div>
  </div>
</template>

<style scoped>
.supplyroute__panel {
	width: 92vw;
	max-width: 92vw;
	max-height: 80vh;
	overflow-y: auto;
}

.supplyroute__message {
	padding: var(--gap-sm) var(--gap-sm);
	border-radius: var(--radius-sm);
	margin-bottom: var(--gap-sm);
	font-size: var(--font-md);
	font-weight: 600;
}

.supplyroute__message__success {
	background: rgba(76, 175, 80, 0.15);
	color: var(--accent-green);
	border: 1px solid var(--accent-green);
}

.supplyroute__message__error {
	background: rgba(231, 76, 60, 0.15);
	color: var(--accent-red);
	border: 1px solid var(--accent-red);
}

.supplyroute__message__warning {
	background: rgba(243, 156, 18, 0.15);
	color: var(--accent-gold);
	border: 1px solid var(--accent-gold);
}

.supplyroute__section {
	margin-bottom: var(--gap-md);
}

.supplyroute__summary {
	display: flex;
	flex-wrap: wrap;
	gap: var(--gap-sm);
	padding: var(--gap-xs) 0;
	margin-bottom: var(--gap-xs);
	border-bottom: 1px solid var(--border-dim);
	font-size: var(--font-sm);
	color: var(--accent-gold);
	font-weight: bold;
}

.supplyroute__heading {
	font-size: var(--font-md);
	color: var(--text-primary);
	margin-bottom: var(--gap-sm);
	text-transform: uppercase;
	letter-spacing: 1px;
}

.supplyroute__empty {
	font-size: var(--font-md);
	color: var(--text-secondary);
	padding: var(--gap-sm);
	text-align: center;
	border: 1px dashed var(--border-dim);
	border-radius: var(--radius-sm);
}

.supplyroute__list {
	display: flex;
	flex-direction: column;
	gap: var(--gap-sm);
}

.supplyroute__head {
	display: flex;
	align-items: center;
	gap: var(--gap-xs);
	margin-bottom: var(--gap-xs);
}

.supplyroute__icon {
	font-size: var(--font-lg);
}

.supplyroute__type {
	font-size: var(--font-md);
	font-weight: 600;
	color: var(--text-primary);
}

.supplyroute__hijackedbadge {
	font-size: var(--font-xs);
	padding: var(--gap-xs) var(--gap-xs);
	border-radius: 3px;
	background: rgba(255, 87, 34, 0.20);
	color: var(--accent-red);
	border: 1px solid var(--accent-red);
	margin-left: auto;
}

.supplyroute__info {
	font-size: var(--font-sm);
	color: var(--text-secondary);
	margin-bottom: var(--gap-xs);
}

.supplyroute__stats {
	display: flex;
	gap: var(--gap-md);
	font-size: var(--font-sm);
	color: var(--text-secondary);
	margin-bottom: var(--gap-xs);
}

.supplyroute__stat {
	white-space: nowrap;
}

.supplyroute__bar {
	height: 4px;
	background: var(--bg-primary);
	border-radius: 3px;
	overflow: hidden;
	margin-bottom: var(--gap-sm);
}

.supplyroute__fill {
	height: 100%;
	transition: width var(--duration-normal) var(--ease-out);
	border-radius: 3px;
}

.supplyroute__panel .actions {
	margin-top: var(--gap-xs);
}

.supplyroute__panel .actions .btn {
	font-size: var(--font-sm);
	padding: var(--gap-xs) var(--gap-sm);
}

.supplyroute__section > .btn {
	margin-top: var(--gap-sm);
	padding: var(--gap-sm) var(--gap-md);
	font-size: var(--font-md);
}

.supplyroute__form {
	display: flex;
	gap: var(--gap-sm);
	flex-wrap: wrap;
	margin-bottom: var(--gap-sm);
}

.supplyroute__label {
	display: flex;
	flex-direction: column;
	font-size: var(--font-sm);
	color: var(--text-secondary);
	gap: var(--gap-xs);
	flex: 1;
	min-width: 140px;
}

.supplyroute__select {
	background: var(--bg-tertiary);
	border: 1px solid var(--border-dim);
	border-radius: var(--radius-sm);
	padding: var(--gap-xs) var(--gap-sm);
	color: var(--text-primary);
	font-size: var(--font-md);
	font-family: inherit;
	min-width: 0;
}

.supplyroute__desc {
	font-size: var(--font-sm);
	color: var(--text-secondary);
	margin-bottom: var(--gap-xs);
	line-height: 1.4;
}

.supplyroute__cost {
	font-size: var(--font-sm);
	color: var(--text-primary);
	margin-bottom: var(--gap-xs);
}

.supplyroute__hint {
	font-size: var(--font-sm);
	color: var(--text-secondary);
	margin-bottom: var(--gap-sm);
	line-height: 1.4;
}
</style>
