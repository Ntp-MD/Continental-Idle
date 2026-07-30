<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { gameState } from '@/engine/gameState'
import { getPrestigeFavor, canPrestige, doPrestige } from '@/engine/prestigeManager'
import { formatNumber } from '@/engine/format'
import { eventBus } from '@/engine/eventBus'
import { useToast } from '@/composables/useToast'

const toast = useToast()

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits(['close'])

const currentPrestige = ref(0)
const estimatedFavor = ref(0)
const lifetimeEarnings = ref('')
const canDoPrestige = ref(false)
const confirming = ref(false)
const totalFavor = ref(0)
const totalPrestige = ref(0)
const conqueredCount = ref(0)
const royalCount = ref(0)
const aiDefeatedCount = ref(0)

function update() {
  if (!props.visible) return
  const state = gameState.get()
  const branch = state.branches[state.activeBranch]
  if (!branch) return
  currentPrestige.value = branch.prestige
  estimatedFavor.value = getPrestigeFavor()
  lifetimeEarnings.value = formatNumber(branch.lifetimeEarnings)
  canDoPrestige.value = canPrestige()
  totalFavor.value = state.tableFavor
  totalPrestige.value = state.totalPrestige
  conqueredCount.value = state.worldMap.conqueredBranches.length
  royalCount.value = state.worldMap.royalBranches.length
  aiDefeatedCount.value = Object.values(state.aiOwners).filter(o => o.defeated).length
}

function requestPrestige() {
  if (!canDoPrestige.value) return
  confirming.value = true
}

function cancelPrestige() {
  confirming.value = false
}

function confirmPrestige() {
  if (doPrestige()) {
    confirming.value = false
    toast.success(`Ascended! +${estimatedFavor.value} Table Favor`)
    update()
    emit('close')
  }
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
    confirming.value = false
    update()
  }
})
</script>

<template>
  <div v-if="visible" class="game_panel" @click.self="emit('close')">
    <div class="game_panel__content" role="dialog" aria-modal="true" aria-labelledby="panel_title_prestige">
      <h2 id="panel_title_prestige" class="game_panel__title">High Table Ascension</h2>

      <template v-if="!confirming">
        <div class="prestige_info">
          <p class="prestige_info__desc">Reset buildings & currency for Table Favor</p>
          <p class="prestige_info__row">Current Prestige: <span class="prestige_info__val">{{ currentPrestige }}</span></p>
          <p class="prestige_info__row">Lifetime Earnings: <span class="prestige_info__val">{{ lifetimeEarnings }}</span></p>
          <p class="prestige_info__favor">+{{ estimatedFavor }} Favor</p>
          <p class="prestige_info__note">Staff, assassins, and upgrades are kept</p>
          <button
            class="prestige_info__btn"
            :disabled="!canDoPrestige"
            @click="requestPrestige"
          >ASCEND</button>
        </div>
        <div class="prestige_overview">
          <div class="prestige_overview__title">Global Overview</div>
          <div class="prestige_overview__row">Total Table Favor: <span class="prestige_overview__val">{{ formatNumber(totalFavor) }}</span></div>
          <div class="prestige_overview__row">Total Prestiges: <span class="prestige_overview__val">{{ totalPrestige }}</span></div>
          <div class="prestige_overview__row">Branches Conquered: <span class="prestige_overview__val">{{ conqueredCount }}/36</span></div>
          <div class="prestige_overview__row">Royal Continentals: <span class="prestige_overview__val">{{ royalCount }}/36</span></div>
          <div class="prestige_overview__row">AI Defeated: <span class="prestige_overview__val">{{ aiDefeatedCount }}/36</span></div>
        </div>
      </template>

      <template v-else>
        <div class="prestige_confirm">
          <div class="prestige_confirm__title">RESET THIS CONTINENTAL?</div>
          <div class="prestige_confirm__section">
            <div class="prestige_confirm__label prestige_confirm__label__lose">You will lose:</div>
            <div class="prestige_confirm__item">- All building levels</div>
            <div class="prestige_confirm__item">- All currency</div>
            <div class="prestige_confirm__item">- Heat & reputation (partial)</div>
          </div>
          <div class="prestige_confirm__section">
            <div class="prestige_confirm__label prestige_confirm__label__gain">You will gain:</div>
            <div class="prestige_confirm__item">+ {{ estimatedFavor }} Table Favor</div>
            <div class="prestige_confirm__item">+ Prestige Level {{ currentPrestige + 1 }}</div>
          </div>
          <div class="prestige_confirm__section">
            <div class="prestige_confirm__label prestige_confirm__label__keep">You keep:</div>
            <div class="prestige_confirm__item">- Staff (traits & veteran status kept)</div>
            <div class="prestige_confirm__item">- Assassins (with loyalty)</div>
            <div class="prestige_confirm__item">- Upgrades purchased</div>
          </div>
          <div class="prestige_confirm__actions">
            <button class="prestige_confirm__btn prestige_confirm__btn__cancel" @click="cancelPrestige">CANCEL</button>
            <button class="prestige_confirm__btn prestige_confirm__btn__ascend" @click="confirmPrestige">ASCEND</button>
          </div>
        </div>
      </template>

      <button class="game_panel__close" @click="emit('close')">Close</button>
    </div>
  </div>
</template>
