<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { gameState } from '@/engine/gameState'
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

function syncFromState() {
  if (!props.visible) return
  settings.value = { ...gameState.get().settings }
}

function saveSettings() {
  const state = gameState.get()
  state.settings = { ...settings.value }
  applySettingsToDOM()
  if (!gameState.save()) {
    toast.error('Failed to save settings — storage may be full')
  }
}

function applySettingsToDOM() {
  const root = document.documentElement
  const cfg = settings.value

  root.style.setProperty('--font-scale', String(cfg.fontScale))
  root.classList.toggle('high__contrast', cfg.highContrast)
  root.classList.toggle('reduced__motion', cfg.reducedMotion)
  root.classList.toggle('one__hand', cfg.oneHandMode)
  root.classList.remove('cb__deuteranopia', 'cb__protanopia', 'cb__tritanopia')
  const validModes = ['deuteranopia', 'protanopia', 'tritanopia']
  if (cfg.colorBlindMode !== 'none' && validModes.includes(cfg.colorBlindMode)) {
    root.classList.add(`cb__${cfg.colorBlindMode}`)
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
  saveSettings()
}

onMounted(() => {
  syncFromState()
  applySettingsToDOM()
})

watch(() => props.visible, (v) => { if (v) syncFromState() })
</script>

<template>
  <div v-if="visible" class="panel" @click.self="emit('close')">
    <div class="panel__content" role="dialog" aria-modal="true" aria-labelledby="panel__title__settings">
      <h2 id="panel__title__settings" class="panel__title">Settings</h2>

      <div class="section__header">Accessibility</div>

      <div class="settings__row">
        <label class="settings__label" for="setting__colorblind">Color Blind Mode</label>
        <select id="setting__colorblind" v-model="settings.colorBlindMode" @change="saveSettings" class="settings__select">
          <option value="none">None</option>
          <option value="deuteranopia">Deuteranopia</option>
          <option value="protanopia">Protanopia</option>
          <option value="tritanopia">Tritanopia</option>
        </select>
      </div>

      <div class="settings__row">
        <label class="settings__label" for="setting__contrast">High Contrast</label>
        <input id="setting__contrast" type="checkbox" v-model="settings.highContrast" @change="saveSettings" class="settings__checkbox" />
      </div>

      <div class="settings__row">
        <label class="settings__label" for="setting__motion">Reduced Motion</label>
        <input id="setting__motion" type="checkbox" v-model="settings.reducedMotion" @change="saveSettings" class="settings__checkbox" />
      </div>

      <div class="settings__row">
        <label class="settings__label" for="setting__onehand">One-Hand Mode</label>
        <input id="setting__onehand" type="checkbox" v-model="settings.oneHandMode" @change="saveSettings" class="settings__checkbox" />
      </div>

      <div class="settings__row">
        <label class="settings__label" for="setting__fontscale">Font Scale: {{ settings.fontScale.toFixed(1) }}x</label>
        <input
          id="setting__fontscale"
          type="range"
          min="0.8"
          max="1.5"
          step="0.1"
          v-model.number="settings.fontScale"
          @input="saveSettings"
          class="settings__slider"
        />
      </div>

      <div class="actions">
        <button class="btn btn__ghost btn__block" @click="reset">Reset</button>
        <button class="btn btn__ghost btn__block" @click="emit('close')">Close</button>
      </div>
    </div>
  </div>
</template>
