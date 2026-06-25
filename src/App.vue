<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import StartScreen from './components/StartScreen.vue'
import GameHeader from './components/GameHeader.vue'
import WorldMap from './components/WorldMap.vue'
import BuildingList from './components/BuildingList.vue'
import EventPrompt from './components/EventPrompt.vue'
import StaffPanel from './components/StaffPanel.vue'
import PrestigePanel from './components/PrestigePanel.vue'
import SkillTreePanel from './components/SkillTreePanel.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import TutorialOverlay from './components/TutorialOverlay.vue'
import ToastContainer from './components/ToastContainer.vue'
import BuffBar from './components/BuffBar.vue'
import OfflineProgress from './components/OfflineProgress.vue'
import EventLogPanel from './components/EventLogPanel.vue'
import { gameState } from './engine/game-state'
import { gameLoop } from './engine/game-loop'
import { tutorialManager } from './engine/tutorial-manager'
import { eventEngine } from './engine/event-engine'
import { eventBus } from './engine/event-bus'
import { useToast } from './composables/useToast'
import { formatNumber } from './engine/format'
import { getThemeDef } from './data/themes'
import type { ThemeId } from './types'

const toast = useToast()

const gameStarted = ref(false)
const showStaff = ref(false)
const showPrestige = ref(false)
const showSkills = ref(false)
const showSettings = ref(false)
const showBuildings = ref(true)
const showEventLog = ref(false)
const showSaveMenu = ref(false)

function onStart() {
  gameStarted.value = true
  if (!gameLoop.isRunning()) {
    gameLoop.start()
  }
  applySettings()
  eventEngine.initializeCooldowns()
  tutorialManager.start()
}

function openStaff() {
  showStaff.value = true
  tutorialManager.checkAction('open:staff')
}

function openPrestige() {
  showPrestige.value = true
  tutorialManager.checkAction('open:prestige')
}

function openSkills() {
  showSkills.value = true
}

function openSettings() {
  showSettings.value = true
}

function applySettings() {
  const s = gameState.get().settings
  const root = document.documentElement
  root.style.setProperty('--font-scale', String(s.fontScale))
  root.classList.toggle('high-contrast', s.highContrast)
  root.classList.toggle('reduced-motion', s.reducedMotion)
  root.classList.toggle('one-hand-mode', s.oneHandMode)
  root.classList.remove('cb-deuteranopia', 'cb-protanopia', 'cb-tritanopia')
  if (s.colorBlindMode !== 'none') root.classList.add(`cb-${s.colorBlindMode}`)
}

function doSave() {
  gameState.save()
  toast.success('Game saved')
}

function doExport() {
  const json = gameState.exportSave()
  navigator.clipboard?.writeText(json).then(() => {
    toast.success('Save copied to clipboard')
  }).catch(() => {
    toast.warning('Export failed — clipboard unavailable')
  })
  showSaveMenu.value = false
}

function doImport() {
  navigator.clipboard?.readText().then(text => {
    const ok = gameState.importSave(text)
    if (ok) {
      toast.success('Save imported successfully')
      if (!gameLoop.isRunning()) gameLoop.start()
      eventEngine.initializeCooldowns()
    } else {
      toast.error('Invalid save data')
    }
  }).catch(() => {
    toast.warning('Import failed — clipboard unavailable')
  })
  showSaveMenu.value = false
}

function doDeleteSave() {
  gameState.deleteSave()
  toast.warning('Save deleted')
  showSaveMenu.value = false
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (showStaff.value) { showStaff.value = false; return }
    if (showPrestige.value) { showPrestige.value = false; return }
    if (showSkills.value) { showSkills.value = false; return }
    if (showSettings.value) { showSettings.value = false; return }
    if (showEventLog.value) { showEventLog.value = false; return }
    if (showSaveMenu.value) { showSaveMenu.value = false; return }
  }
}

function handleRaidResult(e: Event) {
  const detail = (e as CustomEvent).detail as { won: boolean; spoilsCurrency?: number; themeId: string }
  if (detail.won) {
    toast.success(`Raid repelled! Spoils: ${formatNumber(detail.spoilsCurrency || 0)}`)
  } else {
    toast.error('Raid failed! Income frozen, assassins lost loyalty')
  }
}

function handleAssassinAwakened(e: Event) {
  const detail = (e as CustomEvent).detail as { themeId: ThemeId }
  toast.success(`Assassin awakened in ${getThemeDef(detail.themeId)?.name || detail.themeId}!`)
}

function handleTakeoverStarted(e: Event) {
  const detail = (e as CustomEvent).detail as { themeId: ThemeId }
  toast.warning(`Takeover initiated: ${getThemeDef(detail.themeId)?.name || detail.themeId}`)
}

function handleTakeoverComplete(e: Event) {
  const detail = (e as CustomEvent).detail as { themeId: ThemeId }
  toast.success(`Takeover complete: ${getThemeDef(detail.themeId)?.name || detail.themeId} conquered!`)
}

function handleThemeUnlock(e: Event) {
  const detail = (e as CustomEvent).detail as { themeId: ThemeId }
  toast.success(`New theme unlocked: ${getThemeDef(detail.themeId)?.name || detail.themeId}`)
}

function handleThemeRoyal(e: Event) {
  const detail = (e as CustomEvent).detail as { themeId: ThemeId }
  toast.success(`${getThemeDef(detail.themeId)?.name || detail.themeId} has achieved Royal status!`)
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  eventBus.on('raid:result', handleRaidResult)
  eventBus.on('assassin:awakened', handleAssassinAwakened)
  eventBus.on('takeover:started', handleTakeoverStarted)
  eventBus.on('takeover:complete', handleTakeoverComplete)
  eventBus.on('theme:unlock', handleThemeUnlock)
  eventBus.on('theme:royal', handleThemeRoyal)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  eventBus.off('raid:result', handleRaidResult)
  eventBus.off('assassin:awakened', handleAssassinAwakened)
  eventBus.off('takeover:started', handleTakeoverStarted)
  eventBus.off('takeover:complete', handleTakeoverComplete)
  eventBus.off('theme:unlock', handleThemeUnlock)
  eventBus.off('theme:royal', handleThemeRoyal)
})

</script>

<template>
  <StartScreen v-if="!gameStarted" @start="onStart" />
  <div v-else class="game-layout">
    <GameHeader />
    <BuffBar />
    <EventPrompt />
    <div class="game-main">
      <aside class="game-sidebar" :class="{ 'game-sidebar--collapsed': !showBuildings }">
        <BuildingList />
      </aside>
      <main class="game-map-area">
        <WorldMap />
        <div class="game-map-actions">
          <button class="game-map-actions__btn" @click="showBuildings = !showBuildings">
            {{ showBuildings ? '\u25C0 Hide' : '\u25B6 Buildings' }}
          </button>
          <button class="game-map-actions__btn" id="btn-staff" @click="openStaff">Staff</button>
          <button class="game-map-actions__btn" id="btn-prestige" @click="openPrestige">Prestige</button>
          <button class="game-map-actions__btn" @click="openSkills">Skills</button>
          <button class="game-map-actions__btn" @click="openSettings">Settings</button>
          <button class="game-map-actions__btn" @click="showEventLog = true">History</button>
          <div class="game-map-actions__save-wrap">
            <button class="game-map-actions__btn" @click="showSaveMenu = !showSaveMenu">Save ▾</button>
            <div v-if="showSaveMenu" class="game-map-actions__save-menu">
              <button class="game-map-actions__save-item" @click="doSave(); showSaveMenu = false">Save</button>
              <button class="game-map-actions__save-item" @click="doExport">Export</button>
              <button class="game-map-actions__save-item" @click="doImport">Import</button>
              <button class="game-map-actions__save-item game-map-actions__save-item--danger" @click="doDeleteSave">Delete</button>
            </div>
          </div>
        </div>
      </main>
    </div>
    <footer class="game-status">
      <span>Continental Idle v1.0</span>
      <span>Autosave: 30s</span>
    </footer>
    <StaffPanel :visible="showStaff" @close="showStaff = false" />
    <PrestigePanel :visible="showPrestige" @close="showPrestige = false" />
    <SkillTreePanel :visible="showSkills" @close="showSkills = false" />
    <SettingsPanel :visible="showSettings" @close="showSettings = false" />
    <EventLogPanel :visible="showEventLog" @close="showEventLog = false" />
    <OfflineProgress />
    <TutorialOverlay />
    <ToastContainer />
  </div>
</template>
