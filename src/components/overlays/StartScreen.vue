<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import {
  STARTER_BRANCHES, getBranchDef,
  CONTINENT_LABELS, CONTINENT_COLORS,
  getBranchesByContinent, type Continent
} from '@/data/branches'
import { gameState } from '@/engine/game-state'
import type { BranchId } from '@/types'

const emit = defineEmits<{ start: [], quickStart: [] }>()

const selected = ref<BranchId>('bangkok')
const loading = ref(false)
const loadingProgress = ref(0)
const loadingText = ref('Initializing Continental OS...')

const starterOptions = STARTER_BRANCHES.map(id => getBranchDef(id))

const continents: Continent[] = ['north-america', 'south-america', 'europe', 'asia', 'africa', 'oceania']

const selectedDef = computed(() => getBranchDef(selected.value))

function selectBranch(id: BranchId) {
  selected.value = id
}

let loadingInterval: number | null = null
let continueTimeout: number | null = null

function startGame() {
  loading.value = true
  const steps = [
    'Initializing Continental OS...',
    'Loading world map...',
    'Establishing HQ connection...',
    'Recruiting staff...',
    'Ready.'
  ]
  let step = 0
  loadingInterval = window.setInterval(() => {
    step++
    loadingProgress.value = Math.min(100, (step / steps.length) * 100)
    loadingText.value = steps[step] || steps[steps.length - 1]
    if (step >= steps.length) {
      if (loadingInterval) { clearInterval(loadingInterval); loadingInterval = null }
      gameState.reset(selected.value)
      gameState.save()
      emit('start')
    }
  }, 200)
}

function continueGame() {
  loading.value = true
  loadingProgress.value = 100
  loadingText.value = 'Loading save...'
  continueTimeout = window.setTimeout(() => {
    continueTimeout = null
    gameState.init()
    emit('start')
  }, 500)
}

function quickStart() {
  gameState.reset(selected.value)
  gameState.save()
  emit('quickStart')
}

onUnmounted(() => {
  if (loadingInterval) clearInterval(loadingInterval)
  if (continueTimeout) clearTimeout(continueTimeout)
})
</script>

<template>
  <div class="start-screen">
    <!-- Loading overlay -->
    <div v-if="loading" class="start-screen__loading">
      <div class="start-screen__loading-text">CONTINENTAL OS v2.0</div>
      <div class="start-screen__loading-bar">
        <div class="start-screen__loading-bar-fill" :style="{ width: loadingProgress + '%' }"></div>
      </div>
      <div class="start-screen__loading-status">{{ loadingText }}</div>
    </div>

    <div v-else class="start-screen__content">
      <h1 class="start-screen__title">CONTINENTAL IDLE</h1>
      <p class="start-screen__subtitle">Choose Your Headquarters</p>

      <!-- Starter HQ cards -->
      <div class="start-screen__options">
        <div
          v-for="branch in starterOptions"
          :key="branch.id"
          class="start-screen__option"
          :class="{ 'start-screen__option--active': selected === branch.id }"
          :style="{ '--branch-accent': branch.accentColor }"
          @click="selectBranch(branch.id)"
        >
          <div class="start-screen__option-name">{{ branch.name }}</div>
          <div class="start-screen__option-city">{{ branch.city }}</div>
          <div class="start-screen__option-currency">{{ branch.currency }}</div>
          <div v-if="selected === branch.id" class="start-screen__option-check">✓ SELECTED</div>
        </div>
      </div>

      <!-- All locations by continent -->
      <div class="start-screen__world">
        <div class="start-screen__world-title">World Map — 37 Continental Branches</div>
        <div v-for="cont in continents" :key="cont" class="start-screen__continent">
          <div class="start-screen__continent-label" :style="{ color: CONTINENT_COLORS[cont] }">
            {{ CONTINENT_LABELS[cont] }}
          </div>
          <div class="start-screen__continent-nodes">
            <div
              v-for="branch in getBranchesByContinent(cont)"
              :key="branch.id"
              class="start-screen__node"
              :class="{
                'start-screen__node--active': selected === branch.id,
                'start-screen__node--starter': branch.unlockPrestige === 0
              }"
              :style="{ '--branch-accent': branch.accentColor }"
              @click="selectBranch(branch.id)"
            >
              <span class="start-screen__node-dot" :style="{ background: branch.accentColor }"></span>
              <span class="start-screen__node-name">{{ branch.name }}</span>
              <span class="start-screen__node-prestige" v-if="branch.unlockPrestige > 0">P{{ branch.unlockPrestige }}</span>
              <span class="start-screen__node-prestige start-screen__node-prestige--free" v-else>FREE</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Selected HQ info -->
      <div class="start-screen__selected-info" :style="{ '--branch-accent': selectedDef.accentColor }">
        <span class="start-screen__selected-name">{{ selectedDef.name }}</span>
        <span class="start-screen__selected-city">{{ selectedDef.city }}</span>
        <span class="start-screen__selected-currency">Currency: {{ selectedDef.currency }}</span>
      </div>

      <div class="start-screen__info">
        <p>Your HQ generates <strong>1.2x income</strong> and is your starting Continental branch.</p>
        <p>Other locations unlock as you prestige.</p>
      </div>

      <button class="start-screen__btn" @click="startGame">
        START NEW GAME
      </button>

      <button class="start-screen__btn-continue" @click="quickStart">
        QUICK START + AI AUTOPLAY
      </button>

      <button v-if="gameState.hasSave()" class="start-screen__btn-continue" @click="continueGame">
        CONTINUE SAVED GAME
      </button>
    </div>
  </div>
</template>
