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
          class="btn__clear"
          :disabled="stepIndex === 0"
          @click="prev"
        >◀ Back</button>
        <button
          class="btn__clear btn__warning"
          @click="next"
        >{{ stepIndex === totalSteps - 1 ? 'Finish' : 'Next ▶' }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tutorial {
	position: fixed;
	bottom: 16px;
	right: 16px;
	z-index: 9000;
	width: min(380px, calc(100vw - 32px));
	max-width: calc(100vw - 32px);
	animation: tutorial-slide-in 0.3s ease-out;
}

@keyframes tutorial-slide-in {
	from {
		transform: translateX(100%);
		opacity: 0;
	}

	to {
		transform: translateX(0);
		opacity: 1;
	}
}

.tutorial__card {
	display: flex;
	flex-direction: column;
	gap: var(--gap-sm);
	background: var(--bg-secondary);
	border: 1px solid var(--accent-gold);
	padding: var(--gap-sm) var(--gap-md);
	box-shadow: var(--shadow-glow-gold);
}

.tutorial__header {
	display: flex;
	align-items: center;
	gap: var(--gap-sm);
}

.tutorial__badge {
	background: var(--accent-gold);
	color: var(--bg-primary);
	font-size: var(--font-xs);
	font-weight: bold;
	padding: var(--gap-xs) var(--gap-sm);
	letter-spacing: 0.5px;
}

.tutorial__title {
	color: var(--accent-gold);
	font-size: var(--font-md);
	font-weight: bold;
	text-transform: uppercase;
	letter-spacing: 1px;
	flex: 1;
}

.tutorial__skip {
	background: none;
	border: 1px solid var(--text-dim);
	color: var(--text-dim);
	font-size: var(--font-xs);
	padding: var(--gap-xs) var(--gap-sm);
	cursor: pointer;
	font-family: inherit;
}

.tutorial__skip:hover {
	border-color: var(--accent-red);
	color: var(--accent-red);
}

.tutorial__progress {
	height: 2px;
	background: rgba(255, 255, 255, 0.08);
	overflow: hidden;
}

.tutorial__progressfill {
	height: 100%;
	background: var(--accent-gold);
	transition: width var(--duration-normal) var(--ease-out);
}

.tutorial__hint {
	color: var(--text-secondary);
	font-size: var(--font-md);
	line-height: 1.6;
}

.tutorial__actions {
	display: flex;
	justify-content: space-between;
	gap: var(--gap-sm);
}
</style>
