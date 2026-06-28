<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { gameState } from '@/engine/game-state'
import { eventBus } from '@/engine/event-bus'
import { useToast } from '@/composables/useToast'
import { formatNumber } from '@/engine/format'
import { getBranchDef } from '@/data/branches'
import {
  ROYAL_BUILDINGS,
} from '@/data/royal-buildings'
import {
  getRoyalBranchNodes,
} from '@/data/royal-skills'
import {
  purchaseRoyalBuilding, getRoyalBuildingCost, getRoyalAffordableLevels,
  canUpgradeRoyalSkill, upgradeRoyalSkill,
  canRoyalPrestige, getRoyalPrestigeMarks, doRoyalPrestige,
} from '@/engine/royal-manager'
import type { BranchId } from '@/types'

const toast = useToast()

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits(['close'])

const activeTab = ref<'buildings' | 'skills' | 'prestige'>('buildings')
const royalMarks = ref(0)
const royalPrestige = ref(0)
const isRoyal = ref(false)
const branchName = ref('')
const confirmingRoyal = ref(false)

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
  <div v-if="visible" class="game-panel" @click.self="emit('close')">
    <div class="game-panel__content game-panel__content--wide">
      <h2 class="game-panel__title">Royal Continental</h2>

      <div class="royal-header">
        <div class="royal-header__marks">Royal Marks: <span class="royal-header__val">{{ formatNumber(royalMarks) }}</span></div>
        <div class="royal-header__prestige">Royal Prestige: <span class="royal-header__val">{{ royalPrestige }}</span></div>
        <div class="royal-header__branch">Active: <span class="royal-header__val">{{ branchName }}</span></div>
        <div v-if="!isRoyal" class="royal-header__warning">This branch has not reached Royal status yet</div>
      </div>

      <div v-if="royalBranchList.length > 0" class="royal-branches">
        <span class="royal-branches__label">Royal Branches:</span>
        <span v-for="b in royalBranchList" :key="b.id" class="royal-branches__tag">{{ b.name }}</span>
      </div>

      <div class="royal-tabs">
        <button class="royal-tab-btn" :class="{ 'royal-tab-btn--active': activeTab === 'buildings' }" @click="activeTab = 'buildings'">Royal Buildings</button>
        <button class="royal-tab-btn" :class="{ 'royal-tab-btn--active': activeTab === 'skills' }" @click="activeTab = 'skills'">Royal Skill Tree</button>
        <button class="royal-tab-btn" :class="{ 'royal-tab-btn--active': activeTab === 'prestige' }" @click="activeTab = 'prestige'">Royal Prestige</button>
      </div>

      <!-- Royal Buildings -->
      <div v-if="activeTab === 'buildings'" class="royal-section">
        <template v-if="isRoyal">
          <div v-for="b in ROYAL_BUILDINGS" :key="b.id" class="royal-building-card">
            <div class="royal-building-card__info">
              <div class="royal-building-card__name">{{ b.name }} <span class="royal-building-card__lv">Lv.{{ getBuildingLevel(b.id) }}/{{ b.maxLevel }}</span></div>
              <div class="royal-building-card__desc">{{ b.description }}</div>
              <div class="royal-building-card__rate">Income: {{ formatNumber(b.baseRate * Math.pow(1.08, getBuildingLevel(b.id))) }}/s</div>
            </div>
            <div class="royal-building-card__actions">
              <button class="royal-building-card__btn" @click="buyRoyalBuilding(b.id)">Buy ({{ getBuildingCost(b.id) }})</button>
              <button class="royal-building-card__btn royal-building-card__btn--max" @click="buyMaxRoyalBuilding(b.id)">MAX</button>
            </div>
          </div>
        </template>
        <p v-else class="royal-empty">Achieve Royal Continental status on this branch to unlock Royal Buildings.</p>
      </div>

      <!-- Royal Skill Tree -->
      <div v-if="activeTab === 'skills'" class="royal-section">
        <div v-for="branch in ['royalIncome', 'royalLoyalty', 'royalPower', 'royalFavor', 'royalAscension']" :key="branch" class="royal-skill-branch">
          <div class="royal-skill-branch__title">{{ branch.replace('royal', '') }}</div>
          <div class="royal-skill-branch__nodes">
            <div
              v-for="node in getRoyalBranchNodes(branch)"
              :key="node.level"
              class="royal-skill-node"
              :class="{
                'royal-skill-node--unlocked': getSkillLevel(branch) >= node.level,
                'royal-skill-node--available': getSkillLevel(branch) === node.level - 1,
              }"
            >
              <div class="royal-skill-node__level">Lv.{{ node.level }}</div>
              <div class="royal-skill-node__name">{{ node.name }}</div>
              <div class="royal-skill-node__desc">{{ node.description }}</div>
              <div class="royal-skill-node__cost">{{ node.royalMarkCost }} Marks</div>
              <button
                v-if="getSkillLevel(branch) === node.level - 1"
                class="royal-skill-node__btn"
                :disabled="!canUpgradeRoyalSkill(branch)"
                @click="tryUpgradeSkill(branch)"
              >Upgrade</button>
              <span v-else-if="getSkillLevel(branch) >= node.level" class="royal-skill-node__done">&#x2713;</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Royal Prestige -->
      <div v-if="activeTab === 'prestige'" class="royal-section">
        <template v-if="!confirmingRoyal">
          <div class="royal-prestige-info">
            <p class="royal-prestige-info__desc">Reset royal buildings & currency for Royal Marks</p>
            <p class="royal-prestige-info__row">Royal Prestige: <span class="royal-prestige-info__val">{{ royalPrestige }}</span></p>
            <p class="royal-prestige-info__row">Estimated Royal Marks: <span class="royal-prestige-info__val">{{ canRoyalPrestige() ? getRoyalPrestigeMarks() : '—' }}</span></p>
            <p class="royal-prestige-info__note">Requires 1T lifetime earnings on this branch</p>
            <p class="royal-prestige-info__note">Keeps: staff, assassins, upgrades, royal skill tree</p>
            <button
              class="royal-prestige-info__btn"
              :disabled="!canRoyalPrestige()"
              @click="requestRoyalPrestige"
            >ROYAL ASCEND</button>
          </div>
        </template>
        <template v-else>
          <div class="royal-prestige-confirm">
            <div class="royal-prestige-confirm__title">ROYAL ASCENSION?</div>
            <div class="royal-prestige-confirm__section">
              <div class="royal-prestige-confirm__label">You will lose:</div>
              <div class="royal-prestige-confirm__item">- All building levels (standard + royal)</div>
              <div class="royal-prestige-confirm__item">- All currency</div>
              <div class="royal-prestige-confirm__item">- Heat & guest satisfaction reset</div>
            </div>
            <div class="royal-prestige-confirm__section">
              <div class="royal-prestige-confirm__label">You will gain:</div>
              <div class="royal-prestige-confirm__item">+ {{ getRoyalPrestigeMarks() }} Royal Marks</div>
              <div class="royal-prestige-confirm__item">+ Royal Prestige Level {{ royalPrestige + 1 }}</div>
            </div>
            <div class="royal-prestige-confirm__actions">
              <button class="royal-prestige-confirm__btn royal-prestige-confirm__btn--cancel" @click="confirmingRoyal = false">CANCEL</button>
              <button class="royal-prestige-confirm__btn royal-prestige-confirm__btn--ascend" @click="confirmRoyalPrestige">ASCEND</button>
            </div>
          </div>
        </template>
      </div>

      <button class="game-panel__close" @click="emit('close')">Close</button>
    </div>
  </div>
</template>
