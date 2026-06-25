<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { gameState } from '../engine/game-state'
import { BUILDINGS } from '../data/buildings'
import { getBuildingIncome, getBuildingCost, getAffordableLevels, purchaseBuilding } from '../engine/income-engine'
import { formatNumber, formatIncome } from '../engine/format'
import { eventBus } from '../engine/event-bus'
import { tutorialManager } from '../engine/tutorial-manager'

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

function update() {
  const state = gameState.get()
  const theme = state.themes[state.activeTheme]
  if (!theme) return
  buyMultiplier.value = state.buyMultiplier

  buildings.value = BUILDINGS.map(def => {
    const bState = theme.buildings[def.id]
    const level = bState?.level || 0
    const inc = getBuildingIncome(theme, def.id)

    let buyCount = state.buyMultiplier
    if (buyCount === 0) buyCount = getAffordableLevels(theme, def.id)
    if (buyCount <= 0) buyCount = 1

    // Cap buyCount to max level for cost display
    const maxPurchasable = def.maxLevel - level
    const isFreeBuilding = def.baseCost === 0
    const displayBuyCount = isFreeBuilding ? 1 : Math.min(buyCount, maxPurchasable)
    const cost = isFreeBuilding ? 0 : getBuildingCost(theme, def.id, Math.max(displayBuyCount, 1))
    const affordableCount = getAffordableLevels(theme, def.id)
    const affordable = cost === 0 || (theme.currency >= cost && affordableCount > 0)
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

function setMult(mult: number) {
  gameState.setBuyMultiplier(mult)
  buyMultiplier.value = mult
  update()
}

let interval: number
onMounted(() => {
  update()
  interval = window.setInterval(update, 1000)
  eventBus.on('income:update', update)
  eventBus.on('theme:switch', update)
  eventBus.on('prestige:reset', update)
})

onUnmounted(() => {
  clearInterval(interval)
  eventBus.off('income:update', update)
  eventBus.off('theme:switch', update)
  eventBus.off('prestige:reset', update)
})
</script>

<template>
  <div>
    <div class="section-header">Buildings</div>
    <div class="buy-multiplier">
      <button
        class="buy-multiplier__btn"
        :class="{ 'buy-multiplier__btn--active': buyMultiplier === 1 }"
        @click="setMult(1)"
      >x1</button>
      <button
        class="buy-multiplier__btn"
        :class="{ 'buy-multiplier__btn--active': buyMultiplier === 10 }"
        @click="setMult(10)"
      >x10</button>
      <button
        class="buy-multiplier__btn"
        :class="{ 'buy-multiplier__btn--active': buyMultiplier === 100 }"
        @click="setMult(100)"
      >x100</button>
      <button
        class="buy-multiplier__btn"
        :class="{ 'buy-multiplier__btn--active': buyMultiplier === 0 }"
        @click="setMult(0)"
      >MAX</button>
    </div>
    <div v-for="b in buildings" :key="b.id" class="building-card">
      <div class="building-card__info">
        <span class="building-card__name">{{ b.name }}</span>
        <span class="building-card__level">Lv.{{ b.level }}</span>
        <span class="building-card__rate">{{ b.income }}</span>
      </div>
      <div class="building-card__actions">
        <div class="building-card__cost" :class="{ 'building-card__cost--affordable': b.affordable }">{{ b.cost }}</div>
        <div v-if="b.buyCount > 0 && !b.maxed" class="building-card__buy-count">x{{ b.buyCount }}</div>
        <button
          class="building-card__buy"
          :class="{ 'building-card__buy--disabled': !b.affordable }"
          :disabled="!b.affordable"
          @click="buy(b.id)"
        >BUY</button>
      </div>
    </div>
  </div>
</template>
