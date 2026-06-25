<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { tutorialManager, TUTORIAL_STEPS } from '../engine/tutorial-manager'
import { eventBus } from '../engine/event-bus'
import type { TutorialStep } from '../engine/tutorial-manager'

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
  <div v-if="visible && step" class="tutorial-overlay">
    <div class="tutorial-overlay__card">
      <div class="tutorial-overlay__header">
        <span class="tutorial-overlay__badge">{{ stepIndex + 1 }}/{{ totalSteps }}</span>
        <span class="tutorial-overlay__title">{{ step.title }}</span>
        <button class="tutorial-overlay__skip" @click="skip">SKIP</button>
      </div>

      <div class="tutorial-overlay__progress">
        <div class="tutorial-overlay__progress-fill" :style="{ width: progress + '%' }"></div>
      </div>

      <p class="tutorial-overlay__hint">{{ step.hint }}</p>

      <div class="tutorial-overlay__actions">
        <button
          class="tutorial-overlay__btn tutorial-overlay__btn--prev"
          :disabled="stepIndex === 0"
          @click="prev"
        >◀ Back</button>
        <button
          class="tutorial-overlay__btn tutorial-overlay__btn--next"
          @click="next"
        >{{ stepIndex === totalSteps - 1 ? 'Finish' : 'Next ▶' }}</button>
      </div>
    </div>
  </div>
</template>
