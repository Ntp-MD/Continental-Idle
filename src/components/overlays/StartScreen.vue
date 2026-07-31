<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { gameState } from '@/engine/gameState'
import { getPrologue, getStoryContext } from '@/data/story'

const emit = defineEmits<{ start: [], quickStart: [] }>()
const router = useRouter()

const loading = ref(false)
const loadingProgress = ref(0)
const loadingText = ref('Initializing Continental OS...')

const prologue = getPrologue()
const storyContext = getStoryContext()

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
      gameState.reset('bangkok')
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
  gameState.reset('bangkok')
  gameState.save()
  emit('quickStart')
}

onUnmounted(() => {
  if (loadingInterval) clearInterval(loadingInterval)
  if (continueTimeout) clearTimeout(continueTimeout)
})
</script>

<template>
  <div class="start">
    <!-- Loading overlay -->
    <div v-if="loading" class="start__loading">
      <div class="start__loadingtext">CONTINENTAL OS v2.0</div>
      <div class="start__loadingbar">
        <div class="start__loading__fill" :style="{ width: loadingProgress + '%' }"></div>
      </div>
      <div class="start__loadingstatus">{{ loadingText }}</div>
    </div>

    <div v-else class="start__content">
      <h1 class="start__title">CONTINENTAL IDLE</h1>
      <p class="start__subtitle">The High Table Awaits</p>

      <!-- Prologue -->
      <div class="start__story">
        <div class="start__storyicon">?</div>
        <div class="start__storytext">
          <p class="start__storyline" v-for="(line, i) in prologue.split('\n\n')" :key="i">{{ line }}</p>
        </div>
      </div>

      <div class="start__info">
        <p>As the <strong>{{ storyContext.playerTitle }}</strong>, your HQ generates <strong>1.2x income</strong> and is your starting Continental branch.</p>
        <p>Conquer rival AI controllers, establish supply routes, and claim your seat at the High Table.</p>
      </div>

      <button class="btn btn__warning btn__block" @click="startGame">
        START NEW GAME
      </button>

      <button class="btn btn__success btn__block" @click="quickStart">
        QUICK START + AI AUTOPLAY
      </button>

      <button v-if="gameState.hasSave()" class="btn btn__success btn__block" @click="continueGame">
        CONTINUE SAVED GAME
      </button>

    </div>

    <button class="start__editorbtn" @click="router.push({ name: 'editor' })" aria-label="Open Blueprint Editor">
      Blueprint Editor
    </button>
  </div>
</template>
