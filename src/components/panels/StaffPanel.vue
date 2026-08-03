<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { gameState } from '@/engine/gameState'
import { STAFF_TYPES } from '@/data/staff'
import { BUILDINGS } from '@/data/buildings'
import { hireStaff, assignStaff, confirmLevelUp, getStaffXpToNext, getStaffLevelUpCost, isStaffUnlocked, fireStaff } from '@/engine/staffManager'
import { getExtraStaffSlots } from '@/engine/skillManager'
import { hireAssassin, isAssassinUnlocked, assignAssassin, lendAssassin, recallAssassin, sendAssassinToAttack, cancelAssassinAttack, confirmAssassinLevelUp, getAssassinXpToNext, getAssassinLevelUpCost, fireAssassin } from '@/engine/assassinManager'
import { ASSASSIN_TYPES } from '@/data/assassins'
import { getTotalDebt, repayDebt, repayAllDebts } from '@/engine/debtManager'
import { formatNumber } from '@/engine/format'
import { eventBus } from '@/engine/eventBus'
import { tutorialManager } from '@/engine/tutorialManager'
import { getBranchDef, BRANCHES } from '@/data/branches'
import { getRarityColor } from '@/data/rarity'
import { canInitiateTakeover, getTakeoverProgress, getHqHealthPercent } from '@/engine/takeoverManager'
import { canLayLow, layLow, canHostEvent, hostEvent, canBribeOfficial, bribeOfficial, canGoldenCoinIncomeBoost, goldenCoinIncomeBoost, getLayLowCost, getHostEventCost, getBribeOfficialCost, getGoldenCoinIncomeBoostCost, getGoldenCoinIncomeBoostDuration } from '@/engine/actionsManager'
import { UPGRADES, purchaseUpgrade, isUpgradePurchased } from '@/engine/upgradeManager'

import type { StaffEntry, BranchId, Rarity } from '@/types'

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
  awakeningProgress: string
  lentTo: string
  ability: string
  rarity: Rarity
}>>([])
const assassinOptions = ref<Array<{ id: string; name: string; rank: string; cost: string; affordable: boolean; unlocked: boolean; ability: string; atCap: boolean }>>([])
const unlockedBranches = ref<Array<{ id: BranchId; name: string }>>([])
const lendableBranches = ref<Array<{ id: BranchId; name: string }>>([])
const upgradeList = ref<Array<{ id: string; name: string; description: string; cost: string; affordable: boolean; purchased: boolean }>>([])
const activeBranchRef = ref<BranchId>('bangkok')
const unlockedBuildings = computed(() => {
  const state = gameState.get()
  const branch = state.branches[activeBranchRef.value]
  if (!branch) return []
  return BUILDINGS.filter(b => branch.buildings[b.id]?.unlocked)
})

function update() {
  if (!props.visible) return
  const state = gameState.get()
  activeBranchRef.value = state.activeBranch
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
      maxLevel: def?.maxLevel || 10,
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
      awakeningProgress: a.awakened ? 'AWAKENED' : `Loyalty ${Math.round(a.loyalty)}/100, Synergy ${a.synergyCount}/3`,
      lentTo: lentbranchName,
      ability: def?.ability || '',
      rarity: a.rarity,
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

const ACTION_DEBOUNCE_MS = 200

function createDebouncedAction<A extends unknown[]>(fn: (...args: A) => void): (...args: A) => void {
  let lastCall = 0
  return (...args: A) => {
    const now = Date.now()
    if (now - lastCall < ACTION_DEBOUNCE_MS) return
    lastCall = now
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

function doFireStaff(staffId: string) {
  fireStaff(staffId)
  update()
}

function doFireAssassin(assassinId: string) {
  fireAssassin(assassinId)
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

function doLayLow() {
  if (layLow()) update()
}

function doHostEvent() {
  if (hostEvent()) update()
}

function doBribeOfficial() {
  if (bribeOfficial()) update()
}

function doGoldenCoinIncomeBoost() {
  if (goldenCoinIncomeBoost()) update()
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
  <div v-if="visible" class="panel" @click.self="emit('close')">
    <div class="panel__content" role="dialog" aria-modal="true" aria-labelledby="panel__title__staff">
      <h2 id="panel__title__staff" class="panel__title">Staff & Assassins</h2>

      <div class="section__header">Hire Staff <span v-if="hireOptions[0]?.atCap" class="staff__section__note">(Cap reached)</span></div>
      <div class="staff__hire">
        <button
          v-for="opt in hireOptions" :key="opt.id"
          class="btn__sm"
          :disabled="!opt.affordable"
          @click="debouncedDoHire(opt.id)"
        >{{ opt.name }} ({{ opt.cost }}){{ !opt.unlocked ? ' [LOCKED]' : opt.atCap ? ' [CAP]' : '' }}</button>
      </div>
      <div class="staff__hire__abilities">
        <div v-for="opt in hireOptions" :key="opt.id" v-show="opt.unlocked" class="staff__hire__ability">
          <span class="staff__hire__abilityname">{{ opt.name }}</span>: {{ opt.maxAbility }}
        </div>
      </div>

      <template v-if="upgradeList.length > 0">
        <div class="section__header">Upgrades</div>
        <div class="upgrade__list">
          <div v-for="u in upgradeList" :key="u.id" class="card upgrade__card">
            <div class="card__info__col">
              <span class="card__name__boldgold">{{ u.name }}</span>
              <span class="card__desc__secondary">{{ u.description }}</span>
            </div>
            <button
              v-if="!u.purchased"
              class="btn__warning btn__sm"
              :disabled="!u.affordable"
              @click="debouncedDoPurchaseUpgrade(u.id)"
            >{{ u.cost }}</button>
            <span v-else class="card__purchased">PURCHASED</span>
          </div>
        </div>
      </template>

      <div class="section__header">Active Staff</div>
      <div v-for="s in staffList" :key="s.id" class="card staff__card">
        <div class="card__header">
          <span class="card__name__gold">{{ s.typeName }} Lv.{{ s.level }}/{{ s.maxLevel }}</span>
          <span class="card__rarity" :style="{ color: getRarityColor(s.rarity) }">{{ s.rarity }}</span>
          <span v-if="s.isVeteran" class="badge badge__blue">VETERAN</span>
          <span v-if="s.isMaxed" class="badge badge__gold">MAX</span>
        </div>
        <div class="card__xpbar">
          <div class="card__xpfill" :style="{ width: s.xpPercent + '%' }"></div>
        </div>
        <div class="card__stats">{{ s.statsDisplay }}</div>
        <div v-if="s.traitNames.length > 0" class="card__traits">
          <span v-for="t in s.traitNames" :key="t" class="card__trait">{{ t }}</span>
        </div>
        <div v-if="s.bestMatchNames" class="card__best">Best: {{ s.bestMatchNames }}</div>
        <div v-if="s.isMaxed && s.maxAbility" class="card__max">{{ s.maxAbility }}</div>
        <div v-if="s.veteranPerk" class="card__perk">{{ s.veteranPerk }}</div>
        <div class="staff__assign">
          <select
            :value="s.assignedTo || ''"
            @change="doAssign(s.id, ($event.target as HTMLSelectElement).value)"
            class="staff__assign__select"
            :aria-label="`Assign ${s.typeName} to building`"
          >
            <option value="">Unassigned</option>
            <option v-for="b in unlockedBuildings" :key="b.id" :value="b.id">{{ b.name }}</option>
          </select>
          <button
            v-if="s.pendingLevelUp"
            @click="debouncedDoLevelUp(s.id)"
            class="btn__sm btn__orange"
          >Level Up ({{ s.levelUpCost }})</button>
          <button @click="doFireStaff(s.id)" class="staff__assign__fire">Fire</button>
        </div>
      </div>

      <template v-if="assassinOptions.length > 0">
        <div class="section__header staff__section__gap">Hire Assassins <span class="staff__section__note">(Prestige 3+)</span> <span v-if="assassinOptions[0]?.atCap" class="staff__section__note">(Cap reached)</span></div>
        <div class="staff__hire">
          <button
            v-for="opt in assassinOptions" :key="opt.id"
            class="btn__sm"
            :disabled="!opt.affordable"
            @click="debouncedDoHireAssassin(opt.id)"
          >
            [{{ opt.rank }}] {{ opt.name }} ({{ opt.cost }})
            {{ !opt.unlocked ? ' [LOCKED]' : opt.atCap ? ' [CAP]' : '' }}
          </button>
        </div>
        <div class="assassin__abilities">
          <div v-for="opt in assassinOptions" :key="opt.id" class="assassin__abilities__row">{{ opt.name }}: {{ opt.ability }}</div>
        </div>
        <div v-for="a in assassinList" :key="a.id" class="staff__card assassin__card">
          <div class="card__header">
            <span class="card__name__muted">{{ a.typeName }} Lv.{{ a.level }}/{{ a.maxLevel }}</span>
            <span class="card__rarity" :style="{ color: getRarityColor(a.rarity) }">{{ a.rarity }}</span>
            <span v-if="a.awakened" class="badge badge__red">AWAKENED</span>
            <span v-if="a.synergyCount > 0" class="card__synergy">Syn:{{ a.synergyCount }}</span>
          </div>
          <div class="card__ability">{{ a.ability }}</div>
          <div v-if="!a.awakened" class="card__awakeningprogress">Awakening: {{ a.awakeningProgress }}</div>
          <div class="card__xpbar">
            <div class="card__xpfill" :style="{ width: a.xpPercent + '%' }"></div>
          </div>
          <div class="card__bar">
            <div class="card__fill" :style="{ width: a.loyaltyPercent + '%' }"></div>
          </div>
          <div class="card__info__wrap">
            <span>Loyalty: {{ a.loyalty }}%</span>
            <span>branch: {{ a.assignedBranch }}</span>
            <span v-if="a.lentTo" class="card__lent">Lent to: {{ a.lentTo }}</span>
            <button v-if="a.lentTo" class="btn__warning btn__sm" @click="doRecallAssassin(a.id)">Recall</button>
          </div>
          <div class="card__stats">{{ a.statsDisplay }}</div>
          <div v-if="a.traitNames.length > 0" class="card__traits">
            <span v-for="t in a.traitNames" :key="t" class="card__trait">{{ t }}</span>
          </div>
          <div class="card__actions">
            <select
              :value="a.rawassignedBranch || ''"
              @change="doAssignAssassin(a.id, ($event.target as HTMLSelectElement).value)"
              class="staff__assign__select"
              :aria-label="`Assign ${a.typeName} to branch`"
            >
              <option value="">Unassigned</option>
              <option v-for="t in unlockedBranches" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
            <select
              :value="''"
              @change="doLendAssassin(a.id, ($event.target as HTMLSelectElement).value)"
              class="staff__assign__select"
              :aria-label="`Lend ${a.typeName} to branch`"
            >
              <option value="">Lend to...</option>
              <option v-for="t in lendableBranches" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
            <button
              v-if="a.pendingLevelUp"
              @click="debouncedDoAssassinLevelUp(a.id)"
              class="btn__sm btn__orange"
            >Level Up ({{ a.levelUpCost }})</button>
            <button @click="doFireAssassin(a.id)" class="staff__assign__fire">Fire</button>
          </div>
          <div v-if="a.attackTarget" class="card__attackstatus">
            <span class="card__attacktarget">Attacking: {{ a.attackTarget }}</span>
            <button class="btn__danger btn__sm" @click="doCancelAttack(a.id)">Cancel</button>
          </div>
          <div v-else-if="attackTargets.length > 0" class="actions">
            <select
              :value="a.rawAttackTarget || ''"
              @change="doSendAttack(a.id, ($event.target as HTMLSelectElement).value)"
              class="staff__assign__select"
              :aria-label="`Send ${a.typeName} to attack target`"
            >
              <option value="">Send to attack...</option>
              <option v-for="t in attackTargets" :key="t.id" :value="t.id">{{ t.name }} (HP: {{ t.hpPercent.toFixed(0) }}%)</option>
            </select>
          </div>
        </div>
      </template>

      <template v-if="debts.length > 0 || canLayLow() || canHostEvent() || canBribeOfficial() || canGoldenCoinIncomeBoost()">
        <div class="section__header staff__section__gap">Golden Coin Actions</div>
        <div class="actions actions__wrap">
          <button v-if="canLayLow()" class="btn__warning" @click="doLayLow">Lay Low ({{ getLayLowCost() }} GC, -3 Heat)</button>
          <button v-if="canHostEvent()" class="btn__warning" @click="doHostEvent">Host Event ({{ getHostEventCost() }} GC, +15 Guests)</button>
          <button v-if="canBribeOfficial()" class="btn__warning" @click="doBribeOfficial">Bribe Official ({{ getBribeOfficialCost() }} GC, -5 Heat)</button>
          <button v-if="canGoldenCoinIncomeBoost()" class="btn__warning" @click="doGoldenCoinIncomeBoost">Income Boost ({{ getGoldenCoinIncomeBoostCost() }} GC, 1.5x for {{ getGoldenCoinIncomeBoostDuration() }}s)</button>
        </div>
      </template>

      <template v-if="debts.length > 0">
        <div class="section__header staff__section__gap">Marker Debts</div>
        <div class="debt__info">
          Total: {{ totalDebt }} — Debts auto-collect 5%/10s and accrue 1% interest/min
        </div>
        <div v-for="d in debts" :key="d.id" class="staff__card debt__row">
          <span class="debt__row__amount">{{ d.amount }}</span>
          <button
            :disabled="!d.canRepay"
            @click="debouncedDoRepay(d.id)"
            class="btn__sm btn__orange"
          >Repay</button>
        </div>
        <button
          v-if="canRepayAll"
          @click="debouncedDoRepayAll"
          class="btn__orange debt__row__repaymax"
        >Repay All ({{ totalDebt }})</button>
      </template>

      <button class="panel__close" @click="emit('close')">Close</button>
    </div>
  </div>
</template>

<style scoped>
.staff__card {
	margin-bottom: var(--gap-sm);
	transition: border-color var(--duration-fast), background var(--duration-fast);
}

.staff__card:hover {
	border-color: var(--border-dim);
	background: var(--bg-card-hover);
}

.staff__hire {
	display: flex;
	flex-wrap: wrap;
	gap: var(--gap-xs);
	margin-bottom: var(--gap-md);
}

.staff__hire .btn {
	font-size: var(--font-xs);
	padding: var(--gap-xs) var(--gap-sm);
}

.staff__assign {
	display: flex;
	align-items: center;
	gap: var(--gap-xs);
	margin-top: var(--gap-xs);
}

.staff__assign__select {
	background: var(--bg-secondary);
	border: 1px solid var(--border-dim);
	color: var(--text-secondary);
	font-family: inherit;
	font-size: var(--font-xs);
	padding: var(--gap-xs) var(--gap-xs);
	flex: 1;
	min-width: 0;
}

.staff__assign__fire {
	padding: var(--gap-xs) var(--gap-xs);
	border-color: var(--accent-red);
	color: var(--accent-red);
	background: transparent;
	flex-shrink: 0;
}

.staff__assign__fire:hover {
	background: color-mix(in srgb, var(--accent-red) 10%, transparent);
}

.staff__section__gap {
	margin-top: var(--gap-md);
}

.staff__section__note {
	font-size: var(--font-xs);
	color: var(--text-dim);
}

.staff__hire__abilities {
	margin-bottom: var(--gap-sm);
}

.staff__hire__ability {
	font-size: var(--font-xs);
	color: var(--text-dim);
	line-height: 1.6;
}

.staff__hire__abilityname {
	color: var(--accent-gold);
}

.assassin__card {
	padding: var(--gap-sm);
}

.assassin__abilities {
	font-size: var(--font-xs);
	color: var(--text-dim);
	margin-bottom: var(--gap-sm);
}

.assassin__abilities__row {
	line-height: 1.5;
}

.debt__info {
	font-size: var(--font-xs);
	color: var(--text-secondary);
	margin-bottom: var(--gap-sm);
}

.debt__row {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.debt__row__amount {
	color: var(--accent-gold);
	font-size: var(--font-sm);
}

.debt__row__repaymax {
	margin-top: var(--gap-xs);
}

.upgrade__list {
	display: flex;
	flex-direction: column;
	gap: var(--gap-sm);
	margin-bottom: var(--gap-md);
}

.upgrade__card {
	display: flex;
	align-items: center;
	justify-content: space-between;
	transition: all var(--duration-fast) var(--ease-out);
}

.upgrade__card:hover {
	background: var(--bg-card-hover);
	border-color: var(--accent-gold);
}

.upgrade__card .btn {
	padding: var(--gap-xs) var(--gap-md);
	font-size: var(--font-sm);
}
</style>
