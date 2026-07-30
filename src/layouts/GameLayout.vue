<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineAsyncComponent, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StartScreen from '@/components/overlays/startScreen.vue'
import GameHeader from '@/components/layout/gameHeader.vue'
import WorldMap from '@/components/layout/worldMap.vue'
import BuildingList from '@/components/layout/buildingList.vue'
import EventPrompt from '@/components/overlays/eventPrompt.vue'
import StaffPanel from '@/components/panels/staffPanel.vue'
import PrestigePanel from '@/components/panels/prestigePanel.vue'
import SkillTreePanel from '@/components/panels/skillTreePanel.vue'
import SettingsPanel from '@/components/panels/settingsPanel.vue'
import TutorialOverlay from '@/components/overlays/tutorialOverlay.vue'
import ToastContainer from '@/components/overlays/toastContainer.vue'
import BuffBar from '@/components/layout/buffBar.vue'
import EventLogPanel from '@/components/panels/eventLogPanel.vue'
import BlueprintPreview from '@/components/panels/blueprintPreview.vue'
import AutoplayPanel from '@/components/overlays/autoplayPanel.vue'
import SupplyRoutePanel from '@/components/panels/supplyRoutePanel.vue'
import PowerBalancePanel from '@/components/panels/powerBalancePanel.vue'
import AchievementsPanel from '@/components/panels/achievementsPanel.vue'
import RoyalPanel from '@/components/panels/royalPanel.vue'
import SovereignPanel from '@/components/panels/sovereignPanel.vue'
import OfflineProgress from '@/components/overlays/offlineProgress.vue'
import ErrorBoundary from '@/components/overlays/errorBoundary.vue'
import { autoplayBot } from '@/engine/autoplay'
import { gameState } from '@/engine/gameState'
import { gameLoop } from '@/engine/gameLoop'
import { tutorialManager } from '@/engine/tutorialManager'
import { eventEngine } from '@/engine/eventEngine'
import { eventBus } from '@/engine/eventBus'
import { useToast } from '@/composables/useToast'
import { formatNumber } from '@/engine/format'
import { getBranchDef } from '@/data/branches'
const HQOfficeView = defineAsyncComponent(() => import('@/components/overlays/hqOfficeView.vue'))
const Wiki = defineAsyncComponent(() => import('@/components/panels/wiki.vue'))
const BlueprintEditor = defineAsyncComponent(() => import('@/blueprint-editor/blueprintEditor.vue'))
import type { BranchId } from '@/types'

const toast = useToast()
const route = useRoute()
const router = useRouter()

const gameStarted = ref(false)
const showStaff = ref(false)
const showPrestige = ref(false)
const showSkills = ref(false)
const showSettings = ref(false)
const showBuildings = ref(true)
const showEventLog = ref(false)
const showSaveMenu = ref(false)
const showWiki = ref(false)
const showBlueprint = ref(false)
const showAutoplay = ref(false)
const showSupplyRoutes = ref(false)
const showPowerBalance = ref(false)
const showAchievements = ref(false)
const showRoyal = ref(false)
const showSovereign = ref(false)
const showEditor = ref(route.name === 'editor')
const mapTab = ref<'world' | 'hq'>('world')
const hasRoyalBranches = ref(false)

function onStart() {
  gameStarted.value = true
  if (!gameLoop.isRunning()) {
    gameLoop.start()
  }
  applySettings()
  eventEngine.initializeCooldowns()
  tutorialManager.start()
}

function onQuickStart() {
  gameStarted.value = true
  if (!gameLoop.isRunning()) {
    gameLoop.start()
  }
  applySettings()
  eventEngine.initializeCooldowns()
  showAutoplay.value = true
  autoplayBot.start()
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

function openWiki() {
  showWiki.value = true
}

function openEditor() {
  showEditor.value = true
  router.push({ name: 'editor' })
}

function closeEditor() {
  showEditor.value = false
  router.push({ name: 'game' })
}

watch(() => route.name, (name) => {
  showEditor.value = name === 'editor'
})

function applySettings() {
  const s = gameState.get().settings
  const root = document.documentElement
  root.style.setProperty('--font-scale', String(s.fontScale))
  root.classList.toggle('high_contrast', s.highContrast)
  root.classList.toggle('reduced_motion', s.reducedMotion)
  root.classList.toggle('one_hand_mode', s.oneHandMode)
  root.classList.remove('cb_deuteranopia', 'cb_protanopia', 'cb_tritanopia')
  const validModes = ['deuteranopia', 'protanopia', 'tritanopia']
  if (s.colorBlindMode !== 'none' && validModes.includes(s.colorBlindMode)) root.classList.add(`cb_${s.colorBlindMode}`)
}

function doSave() {
  if (gameState.save()) {
    toast.success('Game saved')
  } else {
    toast.error('Save failed — storage quota exceeded')
  }
}

function doExport() {
  const json = gameState.exportSave()
  if (!json) {
    toast.error('Export failed — save error')
    showSaveMenu.value = false
    return
  }
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
    if (showWiki.value) { showWiki.value = false; return }
    if (showBlueprint.value) { showBlueprint.value = false; return }
    if (showSupplyRoutes.value) { showSupplyRoutes.value = false; return }
    if (showPowerBalance.value) { showPowerBalance.value = false; return }
    if (showAchievements.value) { showAchievements.value = false; return }
    if (showRoyal.value) { showRoyal.value = false; return }
    if (showSovereign.value) { showSovereign.value = false; return }
    if (showEditor.value) { showEditor.value = false; return }
    if (showAutoplay.value) { showAutoplay.value = false; return }
  }
  if (showSaveMenu.value && !((e.target as HTMLElement)?.closest('.game_map_actions__save_wrap'))) {
    showSaveMenu.value = false
  }
}

function handleRaidResult(e: Event) {
  const detail = (e as CustomEvent).detail as { won: boolean; spoilsCurrency?: number; branchId: string }
  if (detail.won) {
    toast.success(`Raid repelled! Spoils: ${formatNumber(detail.spoilsCurrency || 0)}`)
  } else {
    toast.error('Raid failed! Income frozen, assassins lost loyalty')
  }
}

function handleAssassinAwakened(e: Event) {
  const detail = (e as CustomEvent).detail as { branchId: BranchId }
  toast.success(`Assassin awakened in ${getBranchDef(detail.branchId)?.name || detail.branchId}!`)
}

function handleTakeoverStarted(e: Event) {
  const detail = (e as CustomEvent).detail as { branchId: BranchId }
  toast.warning(`Takeover initiated: ${getBranchDef(detail.branchId)?.name || detail.branchId}`)
}

function handleTakeoverComplete(e: Event) {
  const detail = (e as CustomEvent).detail as { branchId: BranchId }
  toast.success(`Takeover complete: ${getBranchDef(detail.branchId)?.name || detail.branchId} conquered!`)
}

function handleBranchUnlock(e: Event) {
  const detail = (e as CustomEvent).detail as { branchId: BranchId }
  toast.success(`New branch unlocked: ${getBranchDef(detail.branchId)?.name || detail.branchId}`)
}

function handleBranchRoyal(e: Event) {
  const detail = (e as CustomEvent).detail as { branchId: BranchId }
  hasRoyalBranches.value = gameState.get().worldMap.royalBranches.length > 0
  toast.success(`${getBranchDef(detail.branchId)?.name || detail.branchId} has achieved Royal status!`)
}

function handleSaveFailed() {
  toast.error('Autosave failed — storage may be full')
}

function handleVisitorArrived(e: Event) {
  const detail = (e as CustomEvent).detail as { count: number; random?: boolean; royalMark?: boolean }
  if (detail.royalMark) {
    toast.success(`Royal Mark scroll used — a special visitor has arrived!`)
  } else if (detail.random) {
    toast.info(`A visitor has arrived at your Continental`)
  } else {
    toast.success(`${detail.count} visitors have arrived — check HQ Office to hire them`)
  }
}

function handleVisitorLeft() {
  toast.warning(`A visitor has left without being hired`)
}

function handleDiplomacyGift(e: Event) {
  const detail = (e as CustomEvent).detail as { ownerName: string; gain: number }
  toast.success(`Gift sent to ${detail.ownerName} — relations improved by ${detail.gain}`)
}

function handleDiplomacyTruce(e: Event) {
  const detail = (e as CustomEvent).detail as { ownerName: string }
  toast.success(`Truce proposed with ${detail.ownerName} — relations improved by 20`)
}

function handleSupplyRouteEstablished(e: Event) {
  const detail = (e as CustomEvent).detail as { from: BranchId; to: BranchId; type: string }
  toast.success(`Supply route established: ${getBranchDef(detail.from)?.name} ? ${getBranchDef(detail.to)?.name}`)
}

function handleSupplyRouteHijacked() {
  toast.success(`Supply route hijacked! Underworld connection seized.`)
}

function handleSupplyRouteCollapsed() {
  toast.warning(`A supply route has collapsed — stability reached zero`)
}

function handleAIAction(e: Event) {
  const detail = (e as CustomEvent).detail as { ownerName: string; eventType: string; branchId: BranchId }
  toast.warning(`${detail.ownerName} is taking action: ${detail.eventType}`)
}

function handleAIDefeated(e: Event) {
  const detail = (e as CustomEvent).detail as { ownerName: string; branchId: BranchId }
  toast.success(`AI Controller ${detail.ownerName} defeated in ${getBranchDef(detail.branchId)?.name}!`)
}

function handleSovereignAchieved() {
  toast.success('You have achieved the Sovereign of the High Table! All buffs doubled.')
  showSovereign.value = true
}

function handleDecreeIssued(e: Event) {
  const detail = (e as CustomEvent).detail as { name: string; description: string }
  toast.success(`Royal Decree: ${detail.name} — ${detail.description}`)
}

function handleSandboxLoop(e: Event) {
  const detail = (e as CustomEvent).detail as { loop: number; marks: number }
  toast.success(`Sandbox+ Loop ${detail.loop} completed! +${detail.marks} Royal Marks`)
}

function handleRoyalSkillUpgraded(e: Event) {
  const detail = (e as CustomEvent).detail as { branch: string; level: number }
  toast.success(`Royal skill upgraded to Lv.${detail.level}`)
}

function handleRoyalPrestige(e: Event) {
  const detail = (e as CustomEvent).detail as { branchId: BranchId; marks: number }
  toast.success(`Royal Prestige! +${detail.marks} Royal Marks`)
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('click', handleOutsideClick)
  hasRoyalBranches.value = gameState.get().worldMap.royalBranches.length > 0
  eventBus.on('raid:result', handleRaidResult)
  eventBus.on('assassin:awakened', handleAssassinAwakened)
  eventBus.on('takeover:started', handleTakeoverStarted)
  eventBus.on('takeover:complete', handleTakeoverComplete)
  eventBus.on('branch:unlock', handleBranchUnlock)
  eventBus.on('branch:royal', handleBranchRoyal)
  eventBus.on('supplyroute:established', handleSupplyRouteEstablished)
  eventBus.on('supplyroute:hijacked', handleSupplyRouteHijacked)
  eventBus.on('supplyroute:collapsed', handleSupplyRouteCollapsed)
  eventBus.on('ai:action', handleAIAction)
  eventBus.on('ai:defeated', handleAIDefeated)
  eventBus.on('sovereign:achieved', handleSovereignAchieved)
  eventBus.on('decree:issued', handleDecreeIssued)
  eventBus.on('sandbox:loop', handleSandboxLoop)
  eventBus.on('royal:skill-upgraded', handleRoyalSkillUpgraded)
  eventBus.on('royal:prestige', handleRoyalPrestige)
  eventBus.on('save:failed', handleSaveFailed)
  eventBus.on('visitor:arrived', handleVisitorArrived)
  eventBus.on('visitor:left', handleVisitorLeft)
  eventBus.on('diplomacy:gift', handleDiplomacyGift)
  eventBus.on('diplomacy:truce', handleDiplomacyTruce)
  eventBus.on('hq:office-view', handleHQOfficeView)
})

function handleHQOfficeView() {
  mapTab.value = 'hq'
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handleOutsideClick(e: MouseEvent) {
  if (showSaveMenu.value && !((e.target as HTMLElement)?.closest('.game_map_actions__save_wrap'))) {
    showSaveMenu.value = false
  }
}

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('click', handleOutsideClick)
  eventBus.off('raid:result', handleRaidResult)
  eventBus.off('assassin:awakened', handleAssassinAwakened)
  eventBus.off('takeover:started', handleTakeoverStarted)
  eventBus.off('takeover:complete', handleTakeoverComplete)
  eventBus.off('branch:unlock', handleBranchUnlock)
  eventBus.off('branch:royal', handleBranchRoyal)
  eventBus.off('supplyroute:established', handleSupplyRouteEstablished)
  eventBus.off('supplyroute:hijacked', handleSupplyRouteHijacked)
  eventBus.off('supplyroute:collapsed', handleSupplyRouteCollapsed)
  eventBus.off('ai:action', handleAIAction)
  eventBus.off('ai:defeated', handleAIDefeated)
  eventBus.off('sovereign:achieved', handleSovereignAchieved)
  eventBus.off('decree:issued', handleDecreeIssued)
  eventBus.off('sandbox:loop', handleSandboxLoop)
  eventBus.off('royal:skill-upgraded', handleRoyalSkillUpgraded)
  eventBus.off('royal:prestige', handleRoyalPrestige)
  eventBus.off('save:failed', handleSaveFailed)
  eventBus.off('visitor:arrived', handleVisitorArrived)
  eventBus.off('visitor:left', handleVisitorLeft)
  eventBus.off('diplomacy:gift', handleDiplomacyGift)
  eventBus.off('diplomacy:truce', handleDiplomacyTruce)
  eventBus.off('hq:office-view', handleHQOfficeView)
})

</script>

<template>
  <StartScreen v-if="!gameStarted && route.name !== 'editor'" @start="onStart" @quick-start="onQuickStart" />
  <BlueprintEditor v-else-if="route.name === 'editor'" @close="closeEditor" />
  <ErrorBoundary v-else>
    <div class="game_layout">
    <GameHeader />
    <BuffBar />
    <EventPrompt />
    <div class="game_main">
      <aside class="game_sidebar" :class="{ 'game_sidebar__collapsed': !showBuildings }">
        <BuildingList />
      </aside>
      <main class="game_map_area">
        <div class="game_map_tabs">
          <button class="game_map_tabs__btn" :class="{ 'game_map_tabs__btn__active': mapTab === 'world' }" @click="mapTab = 'world'">World Map</button>
          <button class="game_map_tabs__btn" :class="{ 'game_map_tabs__btn__active': mapTab === 'hq' }" @click="mapTab = 'hq'">HQ Office</button>
        </div>
        <WorldMap v-show="mapTab === 'world'" />
        <HQOfficeView v-if="mapTab === 'hq'" inline />
        <div class="game_map_actions">
          <button class="game_map_actions__btn" @click="showBuildings = !showBuildings" :aria-label="showBuildings ? 'Hide buildings panel' : 'Show buildings panel'">
            {{ showBuildings ? '\u25C0 Hide' : '\u25B6 Buildings' }}
          </button>
          <button class="game_map_actions__btn" id="btn_staff" @click="openStaff" aria-label="Open staff panel">Staff</button>
          <button class="game_map_actions__btn" id="btn_prestige" @click="openPrestige" aria-label="Open prestige panel">Prestige</button>
          <button class="game_map_actions__btn" @click="openSkills" aria-label="Open skill tree panel">Skills</button>
          <button class="game_map_actions__btn" @click="openSettings" aria-label="Open settings panel">Settings</button>
          <button class="game_map_actions__btn" @click="openWiki" aria-label="Open wiki">Wiki</button>
          <button class="game_map_actions__btn" @click="showBlueprint = true" aria-label="Open architectural blueprint preview">Blueprint</button>
          <button class="game_map_actions__btn" @click="showSupplyRoutes = true" aria-label="Open supply routes panel">Routes</button>
          <button class="game_map_actions__btn" @click="showPowerBalance = true" aria-label="Open power balance panel">Power</button>
          <button class="game_map_actions__btn" @click="showAutoplay = !showAutoplay" :aria-label="showAutoplay ? 'Close autoplay panel' : 'Open autoplay panel'">AI Play</button>
          <button class="game_map_actions__btn" @click="showEventLog = true" aria-label="Open event history panel">History</button>
          <button class="game_map_actions__btn" @click="showAchievements = true" aria-label="Open achievements panel">Awards</button>
          <button class="game_map_actions__btn" @click="showRoyal = true" aria-label="Open royal continental panel" :disabled="!hasRoyalBranches">Royal</button>
          <button class="game_map_actions__btn" @click="showSovereign = true" aria-label="Open sovereign panel">Throne</button>
          <button class="game_map_actions__btn" @click="openEditor" aria-label="Open blueprint editor">Editor</button>
          <div class="game_map_actions__save_wrap">
            <button class="game_map_actions__btn" @click="showSaveMenu = !showSaveMenu">Save ?</button>
            <div v-if="showSaveMenu" class="game_map_actions__save_menu">
              <button class="game_map_actions__save_item" @click="doSave(); showSaveMenu = false">Save</button>
              <button class="game_map_actions__save_item" @click="doExport">Export</button>
              <button class="game_map_actions__save_item" @click="doImport">Import</button>
              <button class="game_map_actions__save_item game_map_actions__save_item__danger" @click="doDeleteSave">Delete</button>
            </div>
          </div>
        </div>
      </main>
    </div>
    <footer class="game_status">
      <span>Continental Idle v1.0</span>
      <span>Autosave: 30s</span>
    </footer>
    <StaffPanel :visible="showStaff" @close="showStaff = false" />
    <PrestigePanel :visible="showPrestige" @close="showPrestige = false" />
    <SkillTreePanel :visible="showSkills" @close="showSkills = false" />
    <SettingsPanel :visible="showSettings" @close="showSettings = false" />
    <EventLogPanel :visible="showEventLog" @close="showEventLog = false" />
    <Wiki v-if="showWiki" @close="showWiki = false" />
    <BlueprintPreview v-if="showBlueprint" @close="showBlueprint = false" />
    <TutorialOverlay />
    <ToastContainer />
    <AutoplayPanel v-if="showAutoplay" />
    <SupplyRoutePanel :visible="showSupplyRoutes" @close="showSupplyRoutes = false" />
    <PowerBalancePanel :visible="showPowerBalance" @close="showPowerBalance = false" />
    <AchievementsPanel :visible="showAchievements" @close="showAchievements = false" />
    <RoyalPanel :visible="showRoyal" @close="showRoyal = false" />
    <SovereignPanel :visible="showSovereign" @close="showSovereign = false" />
    <BlueprintEditor v-if="showEditor" @close="closeEditor" />
    <OfflineProgress />
    </div>
  </ErrorBoundary>
</template>
