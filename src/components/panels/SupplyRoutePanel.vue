<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { gameState } from '@/engine/game-state'
import { getBranchDef } from '@/data/branches'
import { SUPPLY_ROUTE_TYPES } from '@/data/supply-routes'
import {
  getSupplyRoutes, canEstablishRoute, establishRoute, canHijackRoute, hijackRoute,
  stabilizeRoute, dismantleRoute, getStabilizeCost,
  getHijackableRoutes, getHijackSuccessChance
} from '@/engine/supply-route-manager'
import { formatNumber } from '@/engine/format'
import { eventBus } from '@/engine/event-bus'
import type { SupplyRouteType, BranchId, SupplyRoute } from '@/types'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits(['close'])

const routes = ref<SupplyRoute[]>([])
const selectedType = ref<SupplyRouteType>('contraband')
const selectedFrom = ref<BranchId>('bangkok')
const selectedTo = ref<BranchId>('rome')
const hijackableRoutes = ref<SupplyRoute[]>([])
const message = ref('')
const messageType = ref<'success' | 'error' | 'warning'>('success')

function refresh() {
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
  <div v-if="visible" class="game-panel" @click.self="emit('close')">
    <div class="game-panel__content supply-route-panel" role="dialog" aria-modal="true" aria-labelledby="supply-route-title">
      <h2 id="supply-route-title" class="game-panel__title">Underworld Supply Routes</h2>

      <div v-if="message" class="supply-route__message" :class="`supply-route__message--${messageType}`">
        {{ message }}
      </div>

      <!-- Active Routes -->
      <section class="supply-route__section">
        <h3 class="supply-route__heading">Active Routes ({{ routes.length }})</h3>
        <div v-if="routes.length > 0" class="supply-route__summary">
          <span class="supply-route__summary-item">Total Income: {{ formatNumber(totalRouteIncome) }}/tick</span>
          <span class="supply-route__summary-item">Player Routes: {{ routes.filter(r => !r.aiOwned).length }}</span>
          <span v-if="aiRouteCount > 0" class="supply-route__summary-item">AI Routes: {{ aiRouteCount }} (hijackable)</span>
        </div>
        <div v-if="routes.length === 0" class="supply-route__empty">
          No supply routes established yet.
        </div>
        <div v-else class="supply-route__list">
          <div v-for="route in routes" :key="route.id" class="supply-route__card">
            <div class="supply-route__card-header">
              <span class="supply-route__icon" :style="{ color: getRouteTypeColor(route.type) }">{{ getRouteTypeIcon(route.type) }}</span>
              <span class="supply-route__type-name">{{ getRouteTypeName(route.type) }}</span>
              <span v-if="route.hijacked" class="supply-route__hijacked-badge">HIJACKED</span>
            </div>
            <div class="supply-route__route-info">
              {{ getBranchDef(route.from)?.name || route.from }} → {{ getBranchDef(route.to)?.name || route.to }}
            </div>
            <div class="supply-route__stats">
              <span class="supply-route__stat">
                Stability: <span :style="{ color: getStabilityColor(route.stability) }">{{ route.stability.toFixed(0) }}%</span>
              </span>
              <span class="supply-route__stat">
                Income: {{ formatNumber(getRouteIncome(route)) }}/tick
              </span>
            </div>
            <div class="supply-route__stability-bar">
              <div class="supply-route__stability-fill" :style="{ width: route.stability + '%', background: getStabilityColor(route.stability) }"></div>
            </div>
            <div class="supply-route__actions">
              <button class="supply-route__btn supply-route__btn--stabilize" @click="doStabilize(route.id)">
                Stabilize ({{ formatNumber(getStabilizeCost(route.id)) }})
              </button>
              <button class="supply-route__btn supply-route__btn--dismantle" @click="doDismantle(route.id)">
                Dismantle
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Establish New Route -->
      <section class="supply-route__section">
        <h3 class="supply-route__heading">Establish New Route</h3>
        <div class="supply-route__form">
          <label class="supply-route__label">
            Type
            <select v-model="selectedType" class="supply-route__select">
              <option v-for="t in SUPPLY_ROUTE_TYPES" :key="t.id" :value="t.id">
                {{ t.icon }} {{ t.name }} ({{ formatNumber(t.establishCost) }})
              </option>
            </select>
          </label>
          <label class="supply-route__label">
            From
            <select v-model="selectedFrom" class="supply-route__select">
              <option v-for="b in unlockedBranches" :key="b" :value="b">{{ getBranchDef(b)?.name || b }}</option>
            </select>
          </label>
          <label class="supply-route__label">
            To
            <select v-model="selectedTo" class="supply-route__select">
              <option v-for="b in availableToBranches" :key="b" :value="b">{{ getBranchDef(b)?.name || b }}</option>
            </select>
          </label>
        </div>
        <p v-if="selectedTypeDef" class="supply-route__desc">{{ selectedTypeDef.description }}</p>
        <p class="supply-route__cost">Cost: {{ formatNumber(establishCost) }} | Funds: {{ formatNumber(activeBranchCurrency) }}</p>
        <button class="supply-route__btn supply-route__btn--establish" :disabled="!canEstablish" @click="doEstablish">
          Establish Route
        </button>
      </section>

      <!-- Hijack Routes -->
      <section v-if="hijackableRoutes.length > 0" class="supply-route__section">
        <h3 class="supply-route__heading">Hijackable Routes</h3>
        <p class="supply-route__hint">Send an assassin to steal a route from another branch. Requires an idle assassin with loyalty ≥ 20.</p>
        <div class="supply-route__list">
          <div v-for="route in hijackableRoutes" :key="route.id" class="supply-route__card supply-route__card--hijack">
            <div class="supply-route__card-header">
              <span class="supply-route__icon" :style="{ color: getRouteTypeColor(route.type) }">{{ getRouteTypeIcon(route.type) }}</span>
              <span class="supply-route__type-name">{{ getRouteTypeName(route.type) }}</span>
            </div>
            <div class="supply-route__route-info">
              {{ getBranchDef(route.from)?.name || route.from }} → {{ getBranchDef(route.to)?.name || route.to }}
            </div>
            <div class="supply-route__stats">
              <span class="supply-route__stat">Stability: {{ route.stability.toFixed(0) }}%</span>
              <span class="supply-route__stat">Success: {{ canHijack(route.id) ? getHijackChance(route.id) + '%' : 'N/A' }}</span>
            </div>
            <button
              class="supply-route__btn supply-route__btn--hijack"
              :disabled="!canHijack(route.id)"
              @click="doHijack(route.id)"
            >
              Hijack ({{ formatNumber(SUPPLY_ROUTE_TYPES.find(t => t.id === route.type)?.hijackCost ?? 0) }})
            </button>
          </div>
        </div>
      </section>

      <button class="game-panel__close" @click="emit('close')" aria-label="Close supply routes panel">✕</button>
    </div>
  </div>
</template>
