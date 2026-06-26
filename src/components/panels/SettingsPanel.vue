<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { gameState } from '@/engine/game-state'
import { useToast } from '@/composables/useToast'
import type { GameSettings } from '@/types'

const toast = useToast()

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits(['close'])

const settings = ref<GameSettings>({
  colorBlindMode: 'none',
  highContrast: false,
  reducedMotion: false,
  fontScale: 1,
  oneHandMode: false,
})

function update() {
  if (!props.visible) return
  settings.value = { ...gameState.get().settings }
}

function apply() {
  const state = gameState.get()
  state.settings = { ...settings.value }
  applySettingsToDOM()
  if (!gameState.save()) {
    toast.error('Failed to save settings — storage may be full')
  }
}

function applySettingsToDOM() {
  const root = document.documentElement
  const s = settings.value

  root.style.setProperty('--font-scale', String(s.fontScale))
  root.classList.toggle('high-contrast', s.highContrast)
  root.classList.toggle('reduced-motion', s.reducedMotion)
  root.classList.toggle('one-hand-mode', s.oneHandMode)
  root.classList.remove('cb-deuteranopia', 'cb-protanopia', 'cb-tritanopia')
  if (s.colorBlindMode !== 'none') {
    root.classList.add(`cb-${s.colorBlindMode}`)
  }
}

function reset() {
  settings.value = {
    colorBlindMode: 'none',
    highContrast: false,
    reducedMotion: false,
    fontScale: 1,
    oneHandMode: false,
  }
  apply()
}

onMounted(() => {
  update()
  applySettingsToDOM()
})

watch(() => props.visible, (v) => { if (v) update() })
</script>

<template>
  <div v-if="visible" class="game-panel" @click.self="emit('close')">
    <div class="game-panel__content">
      <h2 class="game-panel__title">Settings</h2>

      <div class="section-header">Accessibility</div>

      <div class="settings-row">
        <label class="settings-label">Color Blind Mode</label>
        <select v-model="settings.colorBlindMode" @change="apply" class="settings-select">
          <option value="none">None</option>
          <option value="deuteranopia">Deuteranopia</option>
          <option value="protanopia">Protanopia</option>
          <option value="tritanopia">Tritanopia</option>
        </select>
      </div>

      <div class="settings-row">
        <label class="settings-label">High Contrast</label>
        <input type="checkbox" v-model="settings.highContrast" @change="apply" class="settings-checkbox" />
      </div>

      <div class="settings-row">
        <label class="settings-label">Reduced Motion</label>
        <input type="checkbox" v-model="settings.reducedMotion" @change="apply" class="settings-checkbox" />
      </div>

      <div class="settings-row">
        <label class="settings-label">One-Hand Mode</label>
        <input type="checkbox" v-model="settings.oneHandMode" @change="apply" class="settings-checkbox" />
      </div>

      <div class="settings-row">
        <label class="settings-label">Font Scale: {{ settings.fontScale.toFixed(1) }}x</label>
        <input
          type="range"
          min="0.8"
          max="1.5"
          step="0.1"
          v-model.number="settings.fontScale"
          @input="apply"
          class="settings-slider"
        />
      </div>

      <div class="settings-panel__actions">
        <button class="game-panel__close settings-panel__btn" @click="reset">Reset</button>
        <button class="game-panel__close settings-panel__btn" @click="emit('close')">Close</button>
      </div>
    </div>
  </div>
</template>
