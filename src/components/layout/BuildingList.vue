<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { gameState } from '@/engine/gameState'
import { BUILDINGS } from '@/data/buildings'
import { getBuildingIncome, getBuildingCost, getAffordableLevels, purchaseBuilding } from '@/engine/incomeEngine'
import { formatNumber, formatIncome } from '@/engine/format'
import { eventBus } from '@/engine/eventBus'
import { tutorialManager } from '@/engine/tutorialManager'

const buildings = ref<Array<{
  id: string
  name: string
  level: number
  income: string
  cost: string
  affordable: boolean
  maxed: boolean
  buyCount: number
}>>([])

const buyMultiplier = ref(1)

let lastTickUpdateTime = 0

function update() {
  const state = gameState.get()
  const branch = state.branches[state.activeBranch]
  if (!branch) return
  buyMultiplier.value = state.buyMultiplier

  buildings.value = BUILDINGS.map(def => {
    const bState = branch.buildings[def.id]
    const level = bState?.level || 0
    const inc = getBuildingIncome(branch, def.id)

    let buyCount = state.buyMultiplier
    if (buyCount === 0) buyCount = getAffordableLevels(branch, def.id)
    if (buyCount <= 0) buyCount = 1


    const maxPurchasable = def.maxLevel - level
    const isFreeBuilding = def.baseCost === 0
    const displayBuyCount = isFreeBuilding ? 1 : Math.min(buyCount, maxPurchasable)
    const cost = isFreeBuilding ? 0 : getBuildingCost(branch, def.id, Math.max(displayBuyCount, 1))
    const affordableCount = getAffordableLevels(branch, def.id)
    const affordable = cost === 0 || (branch.currency >= cost && affordableCount > 0)
    const maxed = level >= def.maxLevel

    return {
      id: def.id,
      name: def.name,
      level,
      income: level > 0 ? formatIncome(inc) : '—',
      cost: maxed ? 'MAX' : (cost === 0 ? 'FREE' : formatNumber(cost)),
      affordable: affordable && !maxed,
      maxed,
      buyCount: maxed ? 0 : (isFreeBuilding ? 1 : displayBuyCount),
    }
  })
}

function buy(buildingId: string) {
  const state = gameState.get()
  let count: number | undefined = state.buyMultiplier === 0 ? 0 : state.buyMultiplier
  const success = purchaseBuilding(buildingId, count === 0 ? undefined : count)
  if (success) {
    tutorialManager.checkAction('purchase:' + buildingId)
  }
  update()
}


let lastBuyTime = 0
const BUY_DEBOUNCE_MS = 200

function debouncedBuy(buildingId: string) {
  const now = Date.now()
  if (now - lastBuyTime < BUY_DEBOUNCE_MS) return
  lastBuyTime = now
  buy(buildingId)
}

function setMult(mult: number) {
  gameState.setBuyMultiplier(mult)
  buyMultiplier.value = mult
  update()
}

function updateOnTick() {
  const now = Date.now()
  if (now - lastTickUpdateTime < 2000) return
  lastTickUpdateTime = now
  update()
}

onMounted(() => {
  update()
  eventBus.on('income:tick', updateOnTick)
  eventBus.on('income:update', update)
  eventBus.on('branch:switch', update)
  eventBus.on('prestige:reset', update)
})

onUnmounted(() => {
  eventBus.off('income:tick', updateOnTick)
  eventBus.off('income:update', update)
  eventBus.off('branch:switch', update)
  eventBus.off('prestige:reset', update)
})
</script>

<template>
  <div class="buildinglist">
    <div class="section__header">Buildings</div>
    <div class="buy">
      <button
        class="btn__fill btn__sm btn__muted"
        :class="{ 'btn__active': buyMultiplier === 1 }"
        aria-label="Buy multiplier: 1"
        @click="setMult(1)"
      >x1</button>
      <button
        class="btn__fill btn__sm btn__muted"
        :class="{ 'btn__active': buyMultiplier === 10 }"
        aria-label="Buy multiplier: 10"
        @click="setMult(10)"
      >x10</button>
      <button
        class="btn__fill btn__sm btn__muted"
        :class="{ 'btn__active': buyMultiplier === 100 }"
        aria-label="Buy multiplier: 100"
        @click="setMult(100)"
      >x100</button>
      <button
        class="btn__fill btn__sm btn__muted"
        :class="{ 'btn__active': buyMultiplier === 0 }"
        aria-label="Buy multiplier: max affordable"
        @click="setMult(0)"
      >MAX</button>
    </div>
    <div class="buildinglist__items">
      <div v-for="b in buildings" :key="b.id" class="card building">
        <div class="building__info">
          <span class="building__name">{{ b.name }}</span>
          <span class="building__level">Lv.{{ b.level }}</span>
          <span class="building__rate">{{ b.income }}</span>
        </div>
        <div class="building__actions">
          <div class="building__cost" :class="{ 'building__cost__affordable': b.affordable }">{{ b.cost }}</div>
          <div v-if="b.buyCount > 0 && !b.maxed" class="building__buycount">x{{ b.buyCount }}</div>
          <button
            class="btn__success btn__sm"
            :disabled="!b.affordable"
            :aria-label="`Buy ${b.name}, level ${b.level}, cost ${b.cost}`"
            @click="debouncedBuy(b.id)"
          >BUY</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.buildinglist {
	display: flex;
	flex-direction: column;
	gap: var(--gap-sm);
}

.buildinglist > .section__header,
.buildinglist > .buy {
	margin-bottom: 0;
}

.buy {
	display: flex;
	gap: var(--gap-xs);
}

.buildinglist__items {
	display: flex;
	flex-direction: column;
	gap: var(--gap-sm);
}

.building {
	display: flex;
	justify-content: space-between;
	align-items: center;
	transition: all var(--duration-fast) var(--ease-out);
	box-shadow: var(--shadow-card);
}

.building:hover {
	border-color: var(--accent-gold);
	background: var(--bg-card-hover);
	box-shadow: var(--shadow-card-hover);
	transform: translateY(-1px);
}

.building__name {
	font-size: var(--font-sm);
	font-weight: 600;
	color: var(--text-primary);
}

.building__level {
	font-size: var(--font-xs);
	color: var(--text-dim);
	font-variant-numeric: tabular-nums;
}

.building__rate {
	font-size: var(--font-sm);
	color: var(--accent-green);
	font-weight: 600;
	font-variant-numeric: tabular-nums;
}

.building__cost {
	font-size: var(--font-xs);
	color: var(--text-dim);
	font-variant-numeric: tabular-nums;
}

.building__cost__affordable {
	color: var(--accent-green);
}

.building__buycount {
	font-size: var(--font-xs);
	color: var(--accent-gold);
	margin-top: 2px;
}

.building__actions {
	text-align: right;
}
</style>
