<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { gameState } from '@/engine/gameState'
import { eventBus } from '@/engine/eventBus'
import { useToast } from '@/composables/useToast'
import { formatNumber } from '@/engine/format'
import { getBranchDef } from '@/data/branches'
import {
  ROYAL_BUILDINGS,
} from '@/data/royalBuildings'
import {
  getRoyalBranchNodes,
} from '@/data/royalSkills'
import {
  purchaseRoyalBuilding, getRoyalBuildingCost, getRoyalAffordableLevels,
  canUpgradeRoyalSkill, upgradeRoyalSkill,
  canRoyalPrestige, getRoyalPrestigeMarks, doRoyalPrestige,
  getRoyalIncomeMult, getRoyalLoyaltyDecayReduction, getRoyalAssassinPowerMult,
  getRoyalFavorMult, getRoyalPrestigeMult, getRoyalBuffDurationMult,
} from '@/engine/royalManager'
import type { BranchId } from '@/types'

const toast = useToast()

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

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits(['close'])

const activeTab = ref<'buildings' | 'skills' | 'prestige'>('buildings')
const royalMarks = ref(0)
const royalPrestige = ref(0)
const isRoyal = ref(false)
const branchName = ref('')
const confirmingRoyal = ref(false)
const skillEffects = ref({ incomeMult: 1, loyaltyDecayReduction: 0, assassinPowerMult: 1, favorMult: 1, prestigeMult: 1, buffDurationMult: 1 })

const royalBranchList = computed(() => {
  const state = gameState.get()
  return state.worldMap.royalBranches.map(id => ({
    id,
    name: getBranchDef(id as BranchId)?.name || id,
  }))
})

function update() {
  if (!props.visible) return
  const state = gameState.get()
  royalMarks.value = state.royalMarks
  royalPrestige.value = state.royalPrestige
  isRoyal.value = state.worldMap.royalBranches.includes(state.activeBranch)
  branchName.value = getBranchDef(state.activeBranch)?.name || state.activeBranch
  skillEffects.value = {
    incomeMult: getRoyalIncomeMult(),
    loyaltyDecayReduction: getRoyalLoyaltyDecayReduction(),
    assassinPowerMult: getRoyalAssassinPowerMult(),
    favorMult: getRoyalFavorMult(),
    prestigeMult: getRoyalPrestigeMult(),
    buffDurationMult: getRoyalBuffDurationMult(),
  }
}

function buyRoyalBuilding(buildingId: string) {
  if (purchaseRoyalBuilding(buildingId)) {
    toast.success('Royal building purchased')
    update()
  } else {
    toast.warning('Cannot afford this royal building')
  }
}

function buyMaxRoyalBuilding(buildingId: string) {
  const state = gameState.get()
  const branch = state.branches[state.activeBranch]
  if (!branch) return
  const affordable = getRoyalAffordableLevels(branch, buildingId)
  if (affordable <= 0) {
    toast.warning('Cannot afford any levels')
    return
  }
  if (purchaseRoyalBuilding(buildingId, affordable)) {
    toast.success(`Purchased ${affordable} royal building levels`)
    update()
  }
}

function tryUpgradeSkill(branch: string) {
  if (upgradeRoyalSkill(branch)) {
    toast.success('Royal skill upgraded')
    update()
  } else {
    toast.warning('Cannot upgrade this skill')
  }
}

function requestRoyalPrestige() {
  if (!canRoyalPrestige()) return
  confirmingRoyal.value = true
}

function confirmRoyalPrestige() {
  const marks = getRoyalPrestigeMarks()
  if (doRoyalPrestige()) {
    confirmingRoyal.value = false
    toast.success(`Royal Ascension! +${marks} Royal Marks`)
    update()
  }
}

function getBuildingLevel(id: string): number {
  const state = gameState.get()
  const branch = state.branches[state.activeBranch]
  return branch?.royalBuildings?.[id]?.level || 0
}

function getBuildingCost(id: string): string {
  const state = gameState.get()
  const branch = state.branches[state.activeBranch]
  if (!branch) return '0'
  return formatNumber(getRoyalBuildingCost(branch, id, 1))
}

function getSkillLevel(branch: string): number {
  const state = gameState.get()
  return state.royalSkillTree[branch as keyof typeof state.royalSkillTree] || 0
}

const debouncedBuyRoyalBuilding = createDebouncedAction(buyRoyalBuilding)
const debouncedBuyMaxRoyalBuilding = createDebouncedAction(buyMaxRoyalBuilding)
const debouncedTryUpgradeSkill = createDebouncedAction(tryUpgradeSkill)
const debouncedConfirmRoyalPrestige = createDebouncedAction(confirmRoyalPrestige)

onMounted(() => {
  update()
  eventBus.on('income:tick', update)
})

onUnmounted(() => {
  eventBus.off('income:tick', update)
})

watch(() => props.visible, (v) => {
  if (v) {
    confirmingRoyal.value = false
    update()
  }
})
</script>

<template>
  <div v-if="visible" class="panel" @click.self="emit('close')">
    <div class="panel__content panel__content__wide" role="dialog" aria-modal="true" aria-labelledby="panel__title__royal">
      <h2 id="panel__title__royal" class="panel__title">Royal Continental</h2>

      <div class="royal__header">
        <div class="royal__header__marks">Royal Marks: <span class="royal__header__val">{{ formatNumber(royalMarks) }}</span></div>
        <div class="royal__header__prestige">Royal Prestige: <span class="royal__header__val">{{ royalPrestige }}</span></div>
        <div class="royal__header__branch">Active: <span class="royal__header__val">{{ branchName }}</span></div>
        <div v-if="!isRoyal" class="royal__header__warning">This branch has not reached Royal status yet</div>
      </div>

      <div v-if="royalBranchList.length > 0" class="royal__branches">
        <span class="royal__branches__label">Royal Branches:</span>
        <span v-for="b in royalBranchList" :key="b.id" class="royal__branches__tag">{{ b.name }}</span>
      </div>

      <div class="royal__tabs">
        <button class="btn__filter" :class="{ 'btn__filter__active': activeTab === 'buildings' }" @click="activeTab = 'buildings'">Royal Buildings</button>
        <button class="btn__filter" :class="{ 'btn__filter__active': activeTab === 'skills' }" @click="activeTab = 'skills'">Royal Skill Tree</button>
        <button class="btn__filter" :class="{ 'btn__filter__active': activeTab === 'prestige' }" @click="activeTab = 'prestige'">Royal Prestige</button>
      </div>

      <!-- Royal Buildings -->
      <div v-if="activeTab === 'buildings'" class="royal__section">
        <template v-if="isRoyal">
          <div v-for="b in ROYAL_BUILDINGS" :key="b.id" class="royal__building">
            <div class="building__info royal__building__info">
              <div class="royal__building__name">{{ b.name }} <span class="royal__building__lv">Lv.{{ getBuildingLevel(b.id) }}/{{ b.maxLevel }}</span></div>
              <div class="royal__building__desc">{{ b.description }}</div>
              <div class="royal__building__rate">Income: {{ formatNumber(b.baseRate * Math.pow(1.08, getBuildingLevel(b.id))) }}/s</div>
            </div>
            <div class="royal__building__actions">
              <button class="btn btn__ghost btn__sm" @click="debouncedBuyRoyalBuilding(b.id)">Buy ({{ getBuildingCost(b.id) }})</button>
              <button class="btn btn__warning btn__sm" @click="debouncedBuyMaxRoyalBuilding(b.id)">MAX</button>
            </div>
          </div>
        </template>
        <p v-else class="royal__empty">Achieve Royal Continental status on this branch to unlock Royal Buildings.</p>
      </div>

      <!-- Royal Skill Tree -->
      <div v-if="activeTab === 'skills'" class="royal__section">
        <div class="royalskill__summary">
          <div class="royalskill__summary__title">Active Skill Effects</div>
          <div class="royalskill__summary__grid">
            <div class="royalskill__summary__item">
              <span class="royalskill__summary__label">Income Mult</span>
              <span class="royalskill__summary__val">x{{ skillEffects.incomeMult.toFixed(2) }}</span>
            </div>
            <div class="royalskill__summary__item">
              <span class="royalskill__summary__label">Loyalty Decay</span>
              <span class="royalskill__summary__val">-{{ (skillEffects.loyaltyDecayReduction * 100).toFixed(0) }}%</span>
            </div>
            <div class="royalskill__summary__item">
              <span class="royalskill__summary__label">Assassin Power</span>
              <span class="royalskill__summary__val">x{{ skillEffects.assassinPowerMult.toFixed(2) }}</span>
            </div>
            <div class="royalskill__summary__item">
              <span class="royalskill__summary__label">Favor Mult</span>
              <span class="royalskill__summary__val">x{{ skillEffects.favorMult.toFixed(2) }}</span>
            </div>
            <div class="royalskill__summary__item">
              <span class="royalskill__summary__label">Prestige Mult</span>
              <span class="royalskill__summary__val">x{{ skillEffects.prestigeMult.toFixed(2) }}</span>
            </div>
            <div class="royalskill__summary__item">
              <span class="royalskill__summary__label">Buff Duration</span>
              <span class="royalskill__summary__val">x{{ skillEffects.buffDurationMult.toFixed(2) }}</span>
            </div>
          </div>
        </div>
        <div v-for="branch in ['royalIncome', 'royalLoyalty', 'royalPower', 'royalFavor', 'royalAscension']" :key="branch" class="royalskill__branch">
          <div class="royalskill__branch__title">{{ branch.replace('royal', '') }}</div>
          <div class="royalskill__branch__nodes">
            <div
              v-for="node in getRoyalBranchNodes(branch)"
              :key="node.level"
              class="royalskill"
              :class="{
                'royalskill__unlocked': getSkillLevel(branch) >= node.level,
                'royalskill__available': getSkillLevel(branch) === node.level - 1,
              }"
            >
              <div class="royalskill__level">Lv.{{ node.level }}</div>
              <div class="royalskill__name">{{ node.name }}</div>
              <div class="royalskill__desc">{{ node.description }}</div>
              <div class="royalskill__cost">{{ node.royalMarkCost }} Marks</div>
              <button
                v-if="getSkillLevel(branch) === node.level - 1"
                class="btn btn__success btn__block btn__sm"
                :disabled="!canUpgradeRoyalSkill(branch)"
                @click="debouncedTryUpgradeSkill(branch)"
              >Upgrade</button>
              <span v-else-if="getSkillLevel(branch) >= node.level" class="royalskill__done">&#x2713;</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Royal Prestige -->
      <div v-if="activeTab === 'prestige'" class="royal__section">
        <template v-if="!confirmingRoyal">
          <div class="royalpres__info">
            <p class="royalpres__info__desc">Reset royal buildings & currency for Royal Marks</p>
            <p class="royalpres__info__row">Royal Prestige: <span class="royalpres__info__val">{{ royalPrestige }}</span></p>
            <p class="royalpres__info__row">Estimated Royal Marks: <span class="royalpres__info__val">{{ canRoyalPrestige() ? getRoyalPrestigeMarks() : '—' }}</span></p>
            <p class="royalpres__info__hint">Requires 1T lifetime earnings on this branch</p>
            <p class="royalpres__info__hint">Keeps: staff, assassins, upgrades, royal skill tree</p>
            <button
              class="btn__gold royalpres__info__btn"
              :disabled="!canRoyalPrestige()"
              @click="requestRoyalPrestige"
            >ROYAL ASCEND</button>
          </div>
        </template>
        <template v-else>
          <div class="royalpres">
            <div class="royalpres__title">ROYAL ASCENSION?</div>
            <div class="royalpres__section">
              <div class="royalpres__label">You will lose:</div>
              <div class="royalpres__item">- All building levels (standard + royal)</div>
              <div class="royalpres__item">- All currency</div>
              <div class="royalpres__item">- Heat & guest satisfaction reset</div>
            </div>
            <div class="royalpres__section">
              <div class="royalpres__label">You will gain:</div>
              <div class="royalpres__item">+ {{ getRoyalPrestigeMarks() }} Royal Marks</div>
              <div class="royalpres__item">+ Royal Prestige Level {{ royalPrestige + 1 }}</div>
            </div>
            <div class="actions actions__center">
              <button class="btn btn__ghost" @click="confirmingRoyal = false">CANCEL</button>
              <button class="btn btn__gold" @click="debouncedConfirmRoyalPrestige">ASCEND</button>
            </div>
          </div>
        </template>
      </div>

      <button class="panel__close" @click="emit('close')">Close</button>
    </div>
  </div>
</template>
