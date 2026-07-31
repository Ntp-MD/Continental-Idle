<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { tutorialManager, TUTORIAL_STEPS } from '@/engine/tutorialManager'
import { eventBus } from '@/engine/eventBus'
import type { TutorialStep } from '@/engine/tutorialManager'

const visible = ref(false)
const step = ref<TutorialStep | null>(null)
const stepIndex = ref(0)
const totalSteps = TUTORIAL_STEPS.length

const progress = computed(() => {
  return Math.round((stepIndex.value / totalSteps) * 100)
})

function update() {
  step.value = tutorialManager.getCurrentStep()
  stepIndex.value = tutorialManager.getCurrentStepIndex()
  visible.value = tutorialManager.isActive() && step.value !== null
}

function next() {
  tutorialManager.next()
}

function prev() {
  tutorialManager.prev()
}

function skip() {
  tutorialManager.skip()
}

onMounted(() => {
  update()
  eventBus.on('tutorial:step', update)
  eventBus.on('tutorial:complete', update)
})

onUnmounted(() => {
  eventBus.off('tutorial:step', update)
  eventBus.off('tutorial:complete', update)
})
</script>

<template>
  <div v-if="visible && step" class="tutorial">
    <div class="tutorial__card">
      <div class="tutorial__header">
        <span class="tutorial__badge">{{ stepIndex + 1 }}/{{ totalSteps }}</span>
        <span class="tutorial__title">{{ step.title }}</span>
        <button class="tutorial__skip" @click="skip">SKIP</button>
      </div>

      <div class="tutorial__progress">
        <div class="tutorial__progressfill" :style="{ width: progress + '%' }"></div>
      </div>

      <p class="tutorial__hint">{{ step.hint }}</p>

      <div class="tutorial__actions">
        <button
          class="tutorial__btn tutorial__btn__prev"
          :disabled="stepIndex === 0"
          @click="prev"
        >◀ Back</button>
        <button
          class="tutorial__btn tutorial__btn__next"
          @click="next"
        >{{ stepIndex === totalSteps - 1 ? 'Finish' : 'Next ▶' }}</button>
      </div>
    </div>
  </div>
</template>
