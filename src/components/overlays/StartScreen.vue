<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  STARTER_BRANCHES, getBranchDef,
  CONTINENT_LABELS, CONTINENT_COLORS,
  getBranchesByContinent, type Continent
} from '@/data/branches'
import { gameState } from '@/engine/gameState'
import { getPrologue, getStoryContext } from '@/data/story'
import type { BranchId } from '@/types'

const emit = defineEmits<{ start: [], quickStart: [] }>()
const router = useRouter()

const selected = ref<BranchId>('bangkok')
const loading = ref(false)
const loadingProgress = ref(0)
const loadingText = ref('Initializing Continental OS...')

const starterOptions = STARTER_BRANCHES.map(id => getBranchDef(id))

const continents: Continent[] = ['north-america', 'south-america', 'europe', 'asia', 'africa', 'oceania']

const selectedDef = computed(() => getBranchDef(selected.value))
const prologue = computed(() => getPrologue(selected.value))
const storyContext = computed(() => getStoryContext(selected.value))

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
  <div class="start_screen">
    <!-- Loading overlay -->
    <div v-if="loading" class="start_screen__loading">
      <div class="start_screen__loading_text">CONTINENTAL OS v2.0</div>
      <div class="start_screen__loading_bar">
        <div class="start_screen__loading_bar_fill" :style="{ width: loadingProgress + '%' }"></div>
      </div>
      <div class="start_screen__loading_status">{{ loadingText }}</div>
    </div>

    <div v-else class="start_screen__content">
      <h1 class="start_screen__title">CONTINENTAL IDLE</h1>
      <p class="start_screen__subtitle">The High Table Awaits</p>

      <!-- Prologue -->
      <div class="start_screen__story">
        <div class="start_screen__story_icon">?</div>
        <div class="start_screen__story_text">
          <p class="start_screen__story_line" v-for="(line, i) in prologue.split('\n\n')" :key="i">{{ line }}</p>
        </div>
      </div>

      <p class="start_screen__subtitle">Choose Your Headquarters</p>

      <!-- Starter HQ cards -->
      <div class="start_screen__options">
        <div
          v-for="branch in starterOptions"
          :key="branch.id"
          class="start_screen__option"
          :class="{ 'start_screen__option__active': selected === branch.id }"
          :style="{ '--branch-accent': branch.accentColor }"
          @click="selectBranch(branch.id)"
          @keydown.enter="selectBranch(branch.id)"
          tabindex="0"
          role="button"
          :aria-label="`Select ${branch.name} as headquarters`"
          :aria-pressed="selected === branch.id"
        >
          <div class="start_screen__option_name">{{ branch.name }}</div>
          <div class="start_screen__option_city">{{ branch.city }}</div>
          <div class="start_screen__option_currency">{{ branch.currency }}</div>
          <div v-if="selected === branch.id" class="start_screen__option_check">? SELECTED</div>
        </div>
      </div>

      <!-- All locations by continent -->
      <div class="start_screen__world">
        <div class="start_screen__world_title">World Map — 37 Continental Branches</div>
        <div v-for="cont in continents" :key="cont" class="start_screen__continent">
          <div class="start_screen__continent_label" :style="{ color: CONTINENT_COLORS[cont] }">
            {{ CONTINENT_LABELS[cont] }}
          </div>
          <div class="start_screen__continent_nodes">
            <div
              v-for="branch in getBranchesByContinent(cont)"
              :key="branch.id"
              class="start_screen__node"
              :class="{
                'start_screen__node__active': selected === branch.id,
                'start_screen__node__starter': branch.unlockPrestige === 0
              }"
              :style="{ '--branch-accent': branch.accentColor }"
              @click="selectBranch(branch.id)"
              @keydown.enter="selectBranch(branch.id)"
              tabindex="0"
              role="button"
              :aria-label="`Select ${branch.name}`"
              :aria-pressed="selected === branch.id"
            >
              <span class="start_screen__node_dot" :style="{ background: branch.accentColor }"></span>
              <span class="start_screen__node_name">{{ branch.name }}</span>
              <span class="start_screen__node_prestige" v-if="branch.unlockPrestige > 0">P{{ branch.unlockPrestige }}</span>
              <span class="start_screen__node_prestige start_screen__node_prestige__free" v-else>FREE</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Selected HQ info -->
      <div class="start_screen__selected_info" :style="{ '--branch-accent': selectedDef.accentColor }">
        <span class="start_screen__selected_name">{{ selectedDef.name }}</span>
        <span class="start_screen__selected_city">{{ selectedDef.city }}</span>
        <span class="start_screen__selected_currency">Currency: {{ selectedDef.currency }}</span>
      </div>

      <div class="start_screen__info">
        <p>As the <strong>{{ storyContext.playerTitle }}</strong>, your HQ generates <strong>1.2x income</strong> and is your starting Continental branch.</p>
        <p>Conquer rival AI controllers, establish supply routes, and claim your seat at the High Table.</p>
      </div>

      <button class="start_screen__btn" @click="startGame">
        START NEW GAME
      </button>

      <button class="start_screen__btn_continue" @click="quickStart">
        QUICK START + AI AUTOPLAY
      </button>

      <button v-if="gameState.hasSave()" class="start_screen__btn_continue" @click="continueGame">
        CONTINUE SAVED GAME
      </button>

    </div>

    <button class="start_screen__editor_btn" @click="router.push({ name: 'editor' })" aria-label="Open Blueprint Editor">
      Blueprint Editor
    </button>
  </div>
</template>
