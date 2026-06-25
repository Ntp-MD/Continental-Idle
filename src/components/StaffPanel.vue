<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { gameState } from '../engine/game-state'
import { STAFF_TYPES } from '../data/staff'
import { BUILDINGS } from '../data/buildings'
import { hireStaff, assignStaff, confirmLevelUp, getStaffXpToNext, getStaffLevelUpCost, isStaffUnlocked } from '../engine/staff-manager'
import { hireAssassin, isAssassinUnlocked, assignAssassin, lendAssassin, sendAssassinToAttack, cancelAssassinAttack } from '../engine/assassin-manager'
import { ASSASSIN_TYPES } from '../data/assassins'
import { getTotalDebt, repayDebt, repayAllDebts } from '../engine/debt-manager'
import { formatNumber } from '../engine/format'
import { eventBus } from '../engine/event-bus'
import { tutorialManager } from '../engine/tutorial-manager'
import { getThemeDef, THEMES } from '../data/themes'
import { canInitiateTakeover, getTakeoverProgress, getHqHealthPercent } from '../engine/takeover-manager'
import { UPGRADES, purchaseUpgrade, isUpgradePurchased } from '../engine/upgrade-manager'

import type { StaffEntry, ThemeId } from '../types'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits(['close'])
const attackTargets = ref<Array<{ id: ThemeId; name: string; hpPercent: number; canAttack: boolean }>>([])

const staffList = ref<Array<StaffEntry & {
  typeName: string
  xpPercent: number
  levelUpCost: string
  maxLevel: number
  isMaxed: boolean
  maxAbility: string
  traitNames: string[]
  statsDisplay: string
  isVeteran: boolean
  veteranPerk: string | null
  bestMatchNames: string
}>>([])
const hireOptions = ref<Array<{ id: string; name: string; cost: string; affordable: boolean; unlocked: boolean; maxAbility: string }>>([])
const debts = ref<Array<{ createdAt: number; amount: string; canRepay: boolean }>>([])
const totalDebt = ref('0')
const canRepayAll = ref(false)
const assassinList = ref<Array<{
  id: string
  typeName: string
  level: number
  loyalty: number
  loyaltyPercent: number
  rawAssignedTheme: string | null
  assignedTheme: string
  rawAttackTarget: string | null
  attackTarget: string
  statsDisplay: string
  traitNames: string[]
  synergyCount: number
  awakened: boolean
  lentTo: string
  ability: string
}>>([])
const assassinOptions = ref<Array<{ id: string; name: string; rank: string; cost: string; affordable: boolean; unlocked: boolean; ability: string }>>([])
const unlockedThemes = ref<Array<{ id: ThemeId; name: string }>>([])
const upgradeList = ref<Array<{ id: string; name: string; description: string; cost: string; affordable: boolean; purchased: boolean }>>([])

function update() {
  if (!props.visible) return
  const state = gameState.get()
  const theme = state.themes[state.activeTheme]
  if (!theme) return

  staffList.value = Object.values(theme.staff).map(s => {
    const def = STAFF_TYPES.find(d => d.id === s.typeId)
    const xpNeeded = getStaffXpToNext(s.level)
    const isMaxed = def ? s.level >= def.maxLevel : false
    const traitNames = s.traits
    const matchNames = def ? def.bestMatch.map(bId => {
      const b = BUILDINGS.find(bd => bd.id === bId)
      return b?.name || bId
    }).join(', ') : ''
    return {
      ...s,
      typeName: def?.name || s.typeId,
      xpPercent: Math.min(100, (s.xp / xpNeeded) * 100),
      levelUpCost: formatNumber(getStaffLevelUpCost(s.typeId, s.level + 1)),
      maxLevel: def?.maxLevel || 20,
      isMaxed,
      maxAbility: def?.maxAbility || '',
      traitNames,
      statsDisplay: `P:${s.stats.precision} S:${s.stats.speed} C:${s.stats.charisma} L:${s.stats.luck}`,
      isVeteran: s.veteran,
      veteranPerk: s.veteranPerk,
      bestMatchNames: matchNames,
    }
  })

  hireOptions.value = STAFF_TYPES.map(def => ({
    id: def.id,
    name: def.name,
    cost: formatNumber(def.hireCost),
    affordable: theme.currency >= def.hireCost && isStaffUnlocked(def.id),
    unlocked: isStaffUnlocked(def.id),
    maxAbility: def.maxAbility,
  }))

  const debtTotal = getTotalDebt()
  totalDebt.value = formatNumber(debtTotal)
  canRepayAll.value = debtTotal > 0 && theme.currency >= debtTotal
  debts.value = theme.markerDebts.map(d => ({
    createdAt: d.createdAt,
    amount: formatNumber(d.amount),
    canRepay: theme.currency >= d.amount,
  }))

  assassinList.value = Object.values(theme.assassins).map(a => {
    const def = ASSASSIN_TYPES.find(d => d.id === a.typeId)
    const lentThemeName = a.lentTo ? (getThemeDef(a.lentTo)?.name || a.lentTo) : ''
    const attackTargetName = a.attackTarget ? (getThemeDef(a.attackTarget)?.name || a.attackTarget) : ''
    return {
      id: a.id,
      typeName: def?.name || a.typeId,
      level: a.level,
      loyalty: Math.round(a.loyalty),
      loyaltyPercent: Math.min(100, a.loyalty),
      rawAssignedTheme: a.assignedTheme,
      assignedTheme: a.assignedTheme ? (getThemeDef(a.assignedTheme)?.name || a.assignedTheme) : '—',
      rawAttackTarget: a.attackTarget,
      attackTarget: attackTargetName,
      statsDisplay: `P:${a.stats.precision} S:${a.stats.speed} C:${a.stats.charisma} L:${a.stats.luck}`,
      traitNames: a.traits,
      synergyCount: a.synergyCount,
      awakened: a.awakened,
      lentTo: lentThemeName,
      ability: def?.ability || '',
    }
  })

  unlockedThemes.value = state.worldMap.unlockedNodes.map(tid => ({
    id: tid,
    name: getThemeDef(tid)?.name || tid,
  }))

  attackTargets.value = THEMES.filter(t => t.id !== state.activeTheme).map(t => {
    const progress = getTakeoverProgress(t.id)
    const canAttack = canInitiateTakeover(t.id) || progress > 0
    return {
      id: t.id,
      name: t.name,
      hpPercent: getHqHealthPercent(t.id),
      canAttack,
    }
  }).filter(t => t.canAttack)

  upgradeList.value = UPGRADES.map(u => ({
    id: u.id,
    name: u.name,
    description: u.description,
    cost: formatNumber(u.cost),
    affordable: theme.currency >= u.cost && !isUpgradePurchased(u.id),
    purchased: isUpgradePurchased(u.id),
  }))

  assassinOptions.value = ASSASSIN_TYPES.map(def => ({
    id: def.id,
    name: def.name,
    rank: def.rank,
    cost: formatNumber(def.hireCost),
    affordable: theme.currency >= def.hireCost && isAssassinUnlocked(def.id),
    unlocked: isAssassinUnlocked(def.id),
    ability: def.ability,
  }))
}

function doRepay(createdAt: number) {
  repayDebt(createdAt)
  update()
}

function doRepayAll() {
  repayAllDebts()
  update()
}

function doHireAssassin(typeId: string) {
  hireAssassin(typeId)
  update()
}

function doHire(typeId: string) {
  hireStaff(typeId)
  update()
}

function doAssign(staffId: string, buildingId: string) {
  assignStaff(staffId, buildingId === '' ? null : buildingId)
  tutorialManager.checkAction('assign:staff')
  update()
}

function doLevelUp(staffId: string) {
  confirmLevelUp(staffId)
  update()
}

function doAssignAssassin(assassinId: string, themeId: string) {
  assignAssassin(assassinId, themeId === '' ? null : themeId as ThemeId)
  update()
}

function doLendAssassin(assassinId: string, toThemeId: string) {
  if (toThemeId === '') return
  lendAssassin(assassinId, toThemeId as ThemeId, 300)
  update()
}

function doSendAttack(assassinId: string, targetThemeId: string) {
  if (targetThemeId === '') return
  sendAssassinToAttack(assassinId, targetThemeId as ThemeId)
  update()
}

function doCancelAttack(assassinId: string) {
  cancelAssassinAttack(assassinId)
  update()
}

function doPurchaseUpgrade(id: string) {
  purchaseUpgrade(id)
  update()
}

onMounted(() => {
  update()
  eventBus.on('income:tick', update)
})

onUnmounted(() => {
  eventBus.off('income:tick', update)
})

watch(() => props.visible, (v) => {
  if (v) update()
})
</script>

<template>
  <div v-if="visible" class="game-panel" @click.self="emit('close')">
    <div class="game-panel__content">
      <h2 class="game-panel__title">Staff & Assassins</h2>

      <div class="section-header">Hire Staff</div>
      <div class="staff-hire">
        <button
          v-for="opt in hireOptions" :key="opt.id"
          class="staff-hire__btn"
          :disabled="!opt.affordable"
          @click="doHire(opt.id)"
        >{{ opt.name }} ({{ opt.cost }}){{ !opt.unlocked ? ' [LOCKED]' : '' }}</button>
      </div>
      <div class="staff-hire__abilities">
        <div v-for="opt in hireOptions" :key="opt.id" v-show="opt.unlocked" class="staff-hire__ability">
          <span class="staff-hire__ability-name">{{ opt.name }}</span>: {{ opt.maxAbility }}
        </div>
      </div>

      <template v-if="upgradeList.length > 0">
        <div class="section-header">Upgrades</div>
        <div class="upgrade-list">
          <div v-for="u in upgradeList" :key="u.id" class="upgrade-card">
            <div class="upgrade-card__info">
              <span class="upgrade-card__name">{{ u.name }}</span>
              <span class="upgrade-card__desc">{{ u.description }}</span>
            </div>
            <button
              v-if="!u.purchased"
              class="upgrade-card__btn"
              :disabled="!u.affordable"
              @click="doPurchaseUpgrade(u.id)"
            >{{ u.cost }}</button>
            <span v-else class="upgrade-card__purchased">PURCHASED</span>
          </div>
        </div>
      </template>

      <div class="section-header">Active Staff</div>
      <div v-for="s in staffList" :key="s.id" class="staff-card">
        <div class="staff-card__header">
          <span class="staff-card__name">{{ s.typeName }} Lv.{{ s.level }}/{{ s.maxLevel }}</span>
          <span v-if="s.isVeteran" class="staff-card__veteran">VETERAN</span>
          <span v-if="s.isMaxed" class="staff-card__maxed">MAX</span>
        </div>
        <div class="staff-card__xp-bar">
          <div class="staff-card__xp-fill" :style="{ width: s.xpPercent + '%' }"></div>
        </div>
        <div class="staff-card__stats">{{ s.statsDisplay }}</div>
        <div v-if="s.traitNames.length > 0" class="staff-card__traits">
          <span v-for="t in s.traitNames" :key="t" class="staff-card__trait">{{ t }}</span>
        </div>
        <div v-if="s.bestMatchNames" class="staff-card__bestmatch">Best: {{ s.bestMatchNames }}</div>
        <div v-if="s.isMaxed && s.maxAbility" class="staff-card__maxability">{{ s.maxAbility }}</div>
        <div v-if="s.veteranPerk" class="staff-card__veteranperk">{{ s.veteranPerk }}</div>
        <div class="staff-assign">
          <select
            :value="s.assignedTo || ''"
            @change="doAssign(s.id, ($event.target as HTMLSelectElement).value)"
            class="staff-assign__select"
          >
            <option value="">Unassigned</option>
            <option v-for="b in BUILDINGS" :key="b.id" :value="b.id">{{ b.name }}</option>
          </select>
          <button
            v-if="s.pendingLevelUp"
            @click="doLevelUp(s.id)"
            class="staff-assign__levelup"
          >Level Up ({{ s.levelUpCost }})</button>
        </div>
      </div>

      <template v-if="assassinOptions.length > 0">
        <div class="section-header staff-section-gap">Hire Assassins <span class="staff-section-note">(Prestige 3+)</span></div>
        <div class="staff-hire">
          <button
            v-for="opt in assassinOptions" :key="opt.id"
            class="staff-hire__btn"
            :disabled="!opt.affordable"
            @click="doHireAssassin(opt.id)"
          >
            [{{ opt.rank }}] {{ opt.name }} ({{ opt.cost }})
            {{ !opt.unlocked ? ' [LOCKED]' : '' }}
          </button>
        </div>
        <div class="assassin-abilities">
          <div v-for="opt in assassinOptions" :key="opt.id" class="assassin-abilities__row">{{ opt.name }}: {{ opt.ability }}</div>
        </div>
        <div v-for="a in assassinList" :key="a.id" class="staff-card assassin-card">
          <div class="assassin-card__header">
            <span class="assassin-card__name">{{ a.typeName }} Lv.{{ a.level }}</span>
            <span v-if="a.awakened" class="assassin-card__awakened">AWAKENED</span>
            <span v-if="a.synergyCount > 0" class="assassin-card__synergy">Syn:{{ a.synergyCount }}</span>
          </div>
          <div class="assassin-card__ability">{{ a.ability }}</div>
          <div class="assassin-card__loyalty-bar">
            <div class="assassin-card__loyalty-fill" :style="{ width: a.loyaltyPercent + '%' }"></div>
          </div>
          <div class="assassin-card__info">
            <span>Loyalty: {{ a.loyalty }}%</span>
            <span>Theme: {{ a.assignedTheme }}</span>
            <span v-if="a.lentTo" class="assassin-card__lent">Lent to: {{ a.lentTo }}</span>
          </div>
          <div class="assassin-card__stats">{{ a.statsDisplay }}</div>
          <div v-if="a.traitNames.length > 0" class="staff-card__traits">
            <span v-for="t in a.traitNames" :key="t" class="staff-card__trait">{{ t }}</span>
          </div>
          <div class="assassin-card__actions">
            <select
              :value="a.rawAssignedTheme || ''"
              @change="doAssignAssassin(a.id, ($event.target as HTMLSelectElement).value)"
              class="staff-assign__select"
            >
              <option value="">Unassigned</option>
              <option v-for="t in unlockedThemes" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
            <select
              value=""
              @change="doLendAssassin(a.id, ($event.target as HTMLSelectElement).value)"
              class="staff-assign__select"
            >
              <option value="">Lend to...</option>
              <option v-for="t in unlockedThemes" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
          </div>
          <div v-if="a.attackTarget" class="assassin-card__attack-status">
            <span class="assassin-card__attack-target">Attacking: {{ a.attackTarget }}</span>
            <button class="assassin-card__cancel-attack" @click="doCancelAttack(a.id)">Cancel</button>
          </div>
          <div v-else-if="attackTargets.length > 0" class="assassin-card__attack-actions">
            <select
              value=""
              @change="doSendAttack(a.id, ($event.target as HTMLSelectElement).value)"
              class="staff-assign__select"
            >
              <option value="">Send to attack...</option>
              <option v-for="t in attackTargets" :key="t.id" :value="t.id">{{ t.name }} (HP: {{ t.hpPercent.toFixed(0) }}%)</option>
            </select>
          </div>
        </div>
      </template>

      <template v-if="debts.length > 0">
        <div class="section-header staff-section-gap">Marker Debts</div>
        <div class="debt-info">
          Total: {{ totalDebt }} — Debts auto-collect 5%/10s and accrue 1% interest/min
        </div>
        <div v-for="d in debts" :key="d.createdAt" class="staff-card debt-row">
          <span class="debt-row__amount">{{ d.amount }}</span>
          <button
            :disabled="!d.canRepay"
            @click="doRepay(d.createdAt)"
            class="debt-row__repay"
          >Repay</button>
        </div>
        <button
          v-if="canRepayAll"
          @click="doRepayAll"
          class="debt-row__repay-all"
        >Repay All ({{ totalDebt }})</button>
      </template>

      <button class="game-panel__close" @click="emit('close')">Close</button>
    </div>
  </div>
</template>
