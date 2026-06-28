<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { gameState } from '@/engine/game-state'
import { STAFF_TYPES } from '@/data/staff'
import { BUILDINGS } from '@/data/buildings'
import { hireStaff, assignStaff, confirmLevelUp, getStaffXpToNext, getStaffLevelUpCost, isStaffUnlocked } from '@/engine/staff-manager'
import { getExtraStaffSlots } from '@/engine/skill-manager'
import { hireAssassin, isAssassinUnlocked, assignAssassin, lendAssassin, recallAssassin, sendAssassinToAttack, cancelAssassinAttack, confirmAssassinLevelUp, getAssassinXpToNext, getAssassinLevelUpCost } from '@/engine/assassin-manager'
import { ASSASSIN_TYPES } from '@/data/assassins'
import { getTotalDebt, repayDebt, repayAllDebts } from '@/engine/debt-manager'
import { formatNumber } from '@/engine/format'
import { eventBus } from '@/engine/event-bus'
import { tutorialManager } from '@/engine/tutorial-manager'
import { getBranchDef, BRANCHES } from '@/data/branches'
import { canInitiateTakeover, getTakeoverProgress, getHqHealthPercent } from '@/engine/takeover-manager'
import { UPGRADES, purchaseUpgrade, isUpgradePurchased } from '@/engine/upgrade-manager'

import type { StaffEntry, BranchId } from '@/types'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits(['close'])
const attackTargets = ref<Array<{ id: BranchId; name: string; hpPercent: number; canAttack: boolean }>>([])

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
const hireOptions = ref<Array<{ id: string; name: string; cost: string; affordable: boolean; unlocked: boolean; maxAbility: string; atCap: boolean }>>([])
const debts = ref<Array<{ id: string; amount: string; canRepay: boolean }>>([])
const totalDebt = ref('0')
const canRepayAll = ref(false)
const assassinList = ref<Array<{
  id: string
  typeName: string
  level: number
  maxLevel: number
  xpPercent: number
  pendingLevelUp: boolean
  levelUpCost: string
  loyalty: number
  loyaltyPercent: number
  rawassignedBranch: string | null
  assignedBranch: string
  rawAttackTarget: string | null
  attackTarget: string
  statsDisplay: string
  traitNames: string[]
  synergyCount: number
  awakened: boolean
  lentTo: string
  ability: string
}>>([])
const assassinOptions = ref<Array<{ id: string; name: string; rank: string; cost: string; affordable: boolean; unlocked: boolean; ability: string; atCap: boolean }>>([])
const unlockedBranches = ref<Array<{ id: BranchId; name: string }>>([])
const lendableBranches = ref<Array<{ id: BranchId; name: string }>>([])
const upgradeList = ref<Array<{ id: string; name: string; description: string; cost: string; affordable: boolean; purchased: boolean }>>([])
const unlockedBuildings = computed(() => {
  const state = gameState.get()
  const branch = state.branches[state.activeBranch]
  if (!branch) return []
  return BUILDINGS.filter(b => branch.buildings[b.id]?.unlocked)
})

function update() {
  if (!props.visible) return
  const state = gameState.get()
  const branch = state.branches[state.activeBranch]
  if (!branch) return

  staffList.value = Object.values(branch.staff).map(s => {
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

  const maxStaff = 5 + getExtraStaffSlots()
  const staffCount = Object.keys(branch.staff).length
  const staffAtCap = staffCount >= maxStaff
  hireOptions.value = STAFF_TYPES.map(def => ({
    id: def.id,
    name: def.name,
    cost: formatNumber(def.hireCost),
    affordable: branch.currency >= def.hireCost && isStaffUnlocked(def.id) && !staffAtCap,
    unlocked: isStaffUnlocked(def.id),
    maxAbility: def.maxAbility,
    atCap: staffAtCap,
  }))

  const debtTotal = getTotalDebt()
  totalDebt.value = formatNumber(debtTotal)
  canRepayAll.value = debtTotal > 0 && branch.currency >= debtTotal
  debts.value = branch.markerDebts.map(d => ({
    id: d.id,
    amount: formatNumber(d.amount),
    canRepay: branch.currency >= d.amount,
  }))

  assassinList.value = Object.values(branch.assassins).map(a => {
    const def = ASSASSIN_TYPES.find(d => d.id === a.typeId)
    const lentbranchName = a.lentTo ? (getBranchDef(a.lentTo)?.name || a.lentTo) : ''
    const attackTargetName = a.attackTarget ? (getBranchDef(a.attackTarget)?.name || a.attackTarget) : ''
    const xpNeeded = getAssassinXpToNext(a.level)
    const isMaxed = def ? a.level >= def.maxLevel : false
    return {
      id: a.id,
      typeName: def?.name || a.typeId,
      level: a.level,
      maxLevel: def?.maxLevel || 10,
      xpPercent: isMaxed ? 100 : Math.min(100, (a.xp / xpNeeded) * 100),
      pendingLevelUp: a.pendingLevelUp,
      levelUpCost: formatNumber(getAssassinLevelUpCost(a.typeId, a.level + 1)),
      loyalty: Math.round(a.loyalty),
      loyaltyPercent: Math.min(100, a.loyalty),
      rawassignedBranch: a.assignedBranch,
      assignedBranch: a.assignedBranch ? (getBranchDef(a.assignedBranch)?.name || a.assignedBranch) : '—',
      rawAttackTarget: a.attackTarget,
      attackTarget: attackTargetName,
      statsDisplay: `P:${a.stats.precision} S:${a.stats.speed} C:${a.stats.charisma} L:${a.stats.luck}`,
      traitNames: a.traits,
      synergyCount: a.synergyCount,
      awakened: a.awakened,
      lentTo: lentbranchName,
      ability: def?.ability || '',
    }
  })

  unlockedBranches.value = state.worldMap.unlockedBranches.map(tid => ({
    id: tid,
    name: getBranchDef(tid)?.name || tid,
  }))

  lendableBranches.value = state.worldMap.unlockedBranches
    .filter(tid => tid !== state.activeBranch)
    .map(tid => ({
      id: tid,
      name: getBranchDef(tid)?.name || tid,
    }))

  attackTargets.value = BRANCHES.filter(t => t.id !== state.activeBranch).map(t => {
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
    affordable: branch.currency >= u.cost && !isUpgradePurchased(u.id),
    purchased: isUpgradePurchased(u.id),
  }))

  const assassinCount = Object.keys(branch.assassins).length
  const assassinCap = isUpgradePurchased('armoryExpansion') ? 4 : 3
  const assassinAtCap = assassinCount >= assassinCap
  assassinOptions.value = ASSASSIN_TYPES.map(def => ({
    id: def.id,
    name: def.name,
    rank: def.rank,
    cost: formatNumber(def.hireCost),
    affordable: branch.currency >= def.hireCost && isAssassinUnlocked(def.id) && !assassinAtCap,
    unlocked: isAssassinUnlocked(def.id),
    ability: def.ability,
    atCap: assassinAtCap,
  }))
}

// Debounce utility to prevent rapid-fire clicks
let lastActionTime = 0
const ACTION_DEBOUNCE_MS = 200

function createDebouncedAction<A extends unknown[]>(fn: (...args: A) => void): (...args: A) => void {
  return (...args: A) => {
    const now = Date.now()
    if (now - lastActionTime < ACTION_DEBOUNCE_MS) return
    lastActionTime = now
    fn(...args)
  }
}

function doRepay(debtId: string) {
  repayDebt(debtId)
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

function doAssignAssassin(assassinId: string, branchId: string) {
  assignAssassin(assassinId, branchId === '' ? null : branchId as BranchId)
  update()
}

function doLendAssassin(assassinId: string, toBranchId: string) {
  if (toBranchId === '') return
  lendAssassin(assassinId, toBranchId as BranchId, 300)
  update()
}

function doRecallAssassin(assassinId: string) {
  recallAssassin(assassinId)
  update()
}

function doSendAttack(assassinId: string, targetBranchId: string) {
  if (targetBranchId === '') return
  sendAssassinToAttack(assassinId, targetBranchId as BranchId)
  update()
}

function doCancelAttack(assassinId: string) {
  cancelAssassinAttack(assassinId)
  update()
}

function doAssassinLevelUp(assassinId: string) {
  confirmAssassinLevelUp(assassinId)
  update()
}

function doPurchaseUpgrade(id: string) {
  purchaseUpgrade(id)
  update()
}

// Debounced versions for critical actions
const debouncedDoHire = createDebouncedAction(doHire)
const debouncedDoHireAssassin = createDebouncedAction(doHireAssassin)
const debouncedDoLevelUp = createDebouncedAction(doLevelUp)
const debouncedDoAssassinLevelUp = createDebouncedAction(doAssassinLevelUp)
const debouncedDoPurchaseUpgrade = createDebouncedAction(doPurchaseUpgrade)
const debouncedDoRepay = createDebouncedAction(doRepay)
const debouncedDoRepayAll = createDebouncedAction(doRepayAll)

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

      <div class="section-header">Hire Staff <span v-if="hireOptions[0]?.atCap" class="staff-section-note">(Cap reached)</span></div>
      <div class="staff-hire">
        <button
          v-for="opt in hireOptions" :key="opt.id"
          class="staff-hire__btn"
          :disabled="!opt.affordable"
          @click="debouncedDoHire(opt.id)"
        >{{ opt.name }} ({{ opt.cost }}){{ !opt.unlocked ? ' [LOCKED]' : opt.atCap ? ' [CAP]' : '' }}</button>
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
              @click="debouncedDoPurchaseUpgrade(u.id)"
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
            :aria-label="`Assign ${s.typeName} to building`"
          >
            <option value="">Unassigned</option>
            <option v-for="b in unlockedBuildings" :key="b.id" :value="b.id">{{ b.name }}</option>
          </select>
          <button
            v-if="s.pendingLevelUp"
            @click="debouncedDoLevelUp(s.id)"
            class="staff-assign__levelup"
          >Level Up ({{ s.levelUpCost }})</button>
        </div>
      </div>

      <template v-if="assassinOptions.length > 0">
        <div class="section-header staff-section-gap">Hire Assassins <span class="staff-section-note">(Prestige 3+)</span> <span v-if="assassinOptions[0]?.atCap" class="staff-section-note">(Cap reached)</span></div>
        <div class="staff-hire">
          <button
            v-for="opt in assassinOptions" :key="opt.id"
            class="staff-hire__btn"
            :disabled="!opt.affordable"
            @click="debouncedDoHireAssassin(opt.id)"
          >
            [{{ opt.rank }}] {{ opt.name }} ({{ opt.cost }})
            {{ !opt.unlocked ? ' [LOCKED]' : opt.atCap ? ' [CAP]' : '' }}
          </button>
        </div>
        <div class="assassin-abilities">
          <div v-for="opt in assassinOptions" :key="opt.id" class="assassin-abilities__row">{{ opt.name }}: {{ opt.ability }}</div>
        </div>
        <div v-for="a in assassinList" :key="a.id" class="staff-card assassin-card">
          <div class="assassin-card__header">
            <span class="assassin-card__name">{{ a.typeName }} Lv.{{ a.level }}/{{ a.maxLevel }}</span>
            <span v-if="a.awakened" class="assassin-card__awakened">AWAKENED</span>
            <span v-if="a.synergyCount > 0" class="assassin-card__synergy">Syn:{{ a.synergyCount }}</span>
          </div>
          <div class="assassin-card__ability">{{ a.ability }}</div>
          <div class="staff-card__xp-bar">
            <div class="staff-card__xp-fill" :style="{ width: a.xpPercent + '%' }"></div>
          </div>
          <div class="assassin-card__loyalty-bar">
            <div class="assassin-card__loyalty-fill" :style="{ width: a.loyaltyPercent + '%' }"></div>
          </div>
          <div class="assassin-card__info">
            <span>Loyalty: {{ a.loyalty }}%</span>
            <span>branch: {{ a.assignedBranch }}</span>
            <span v-if="a.lentTo" class="assassin-card__lent">Lent to: {{ a.lentTo }}</span>
            <button v-if="a.lentTo" class="assassin-card__recall" @click="doRecallAssassin(a.id)">Recall</button>
          </div>
          <div class="assassin-card__stats">{{ a.statsDisplay }}</div>
          <div v-if="a.traitNames.length > 0" class="staff-card__traits">
            <span v-for="t in a.traitNames" :key="t" class="staff-card__trait">{{ t }}</span>
          </div>
          <div class="assassin-card__actions">
            <select
              :value="a.rawassignedBranch || ''"
              @change="doAssignAssassin(a.id, ($event.target as HTMLSelectElement).value)"
              class="staff-assign__select"
              :aria-label="`Assign ${a.typeName} to branch`"
            >
              <option value="">Unassigned</option>
              <option v-for="t in unlockedBranches" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
            <select
              :value="''"
              @change="doLendAssassin(a.id, ($event.target as HTMLSelectElement).value)"
              class="staff-assign__select"
              :aria-label="`Lend ${a.typeName} to branch`"
            >
              <option value="">Lend to...</option>
              <option v-for="t in lendableBranches" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
            <button
              v-if="a.pendingLevelUp"
              @click="debouncedDoAssassinLevelUp(a.id)"
              class="staff-assign__levelup"
            >Level Up ({{ a.levelUpCost }})</button>
          </div>
          <div v-if="a.attackTarget" class="assassin-card__attack-status">
            <span class="assassin-card__attack-target">Attacking: {{ a.attackTarget }}</span>
            <button class="assassin-card__cancel-attack" @click="doCancelAttack(a.id)">Cancel</button>
          </div>
          <div v-else-if="attackTargets.length > 0" class="assassin-card__attack-actions">
            <select
              :value="a.rawAttackTarget || ''"
              @change="doSendAttack(a.id, ($event.target as HTMLSelectElement).value)"
              class="staff-assign__select"
              :aria-label="`Send ${a.typeName} to attack target`"
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
        <div v-for="d in debts" :key="d.id" class="staff-card debt-row">
          <span class="debt-row__amount">{{ d.amount }}</span>
          <button
            :disabled="!d.canRepay"
            @click="debouncedDoRepay(d.id)"
            class="debt-row__repay"
          >Repay</button>
        </div>
        <button
          v-if="canRepayAll"
          @click="debouncedDoRepayAll"
          class="debt-row__repay-all"
        >Repay All ({{ totalDebt }})</button>
      </template>

      <button class="game-panel__close" @click="emit('close')">Close</button>
    </div>
  </div>
</template>
