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
  root.classList.toggle('high_contrast', s.highContrast)
  root.classList.toggle('reduced_motion', s.reducedMotion)
  root.classList.toggle('one_hand_mode', s.oneHandMode)
  root.classList.remove('cb_deuteranopia', 'cb_protanopia', 'cb_tritanopia')
  const validModes = ['deuteranopia', 'protanopia', 'tritanopia']
  if (s.colorBlindMode !== 'none' && validModes.includes(s.colorBlindMode)) {
    root.classList.add(`cb_${s.colorBlindMode}`)
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
  <div v-if="visible" class="game_panel" @click.self="emit('close')">
    <div class="game_panel__content" role="dialog" aria-modal="true" aria-labelledby="panel_title_settings">
      <h2 id="panel_title_settings" class="game_panel__title">Settings</h2>

      <div class="section_header">Accessibility</div>

      <div class="settings_row">
        <label class="settings_label" for="setting-colorblind">Color Blind Mode</label>
        <select id="setting_colorblind" v-model="settings.colorBlindMode" @change="apply" class="settings_select">
          <option value="none">None</option>
          <option value="deuteranopia">Deuteranopia</option>
          <option value="protanopia">Protanopia</option>
          <option value="tritanopia">Tritanopia</option>
        </select>
      </div>

      <div class="settings_row">
        <label class="settings_label" for="setting-contrast">High Contrast</label>
        <input id="setting_contrast" type="checkbox" v-model="settings.highContrast" @change="apply" class="settings_checkbox" />
      </div>

      <div class="settings_row">
        <label class="settings_label" for="setting-motion">Reduced Motion</label>
        <input id="setting_motion" type="checkbox" v-model="settings.reducedMotion" @change="apply" class="settings_checkbox" />
      </div>

      <div class="settings_row">
        <label class="settings_label" for="setting-onehand">One-Hand Mode</label>
        <input id="setting_onehand" type="checkbox" v-model="settings.oneHandMode" @change="apply" class="settings_checkbox" />
      </div>

      <div class="settings_row">
        <label class="settings_label" for="setting-fontscale">Font Scale: {{ settings.fontScale.toFixed(1) }}x</label>
        <input
          id="setting_fontscale"
          type="range"
          min="0.8"
          max="1.5"
          step="0.1"
          v-model.number="settings.fontScale"
          @input="apply"
          class="settings_slider"
        />
      </div>

      <div class="settings_panel__actions">
        <button class="game_panel__close settings_panel__btn" @click="reset">Reset</button>
        <button class="game_panel__close settings_panel__btn" @click="emit('close')">Close</button>
      </div>
    </div>
  </div>
</template>
