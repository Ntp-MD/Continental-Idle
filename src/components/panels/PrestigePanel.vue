<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { gameState } from '@/engine/game-state'
import { getPrestigeFavor, canPrestige, doPrestige } from '@/engine/prestige-manager'
import { formatNumber } from '@/engine/format'
import { eventBus } from '@/engine/event-bus'
import { useToast } from '@/composables/useToast'

const toast = useToast()

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits(['close'])

const currentPrestige = ref(0)
const estimatedFavor = ref(0)
const lifetimeEarnings = ref('')
const canDoPrestige = ref(false)
const confirming = ref(false)

function update() {
  if (!props.visible) return
  const state = gameState.get()
  const branch = state.branches[state.activeBranch]
  if (!branch) return
  currentPrestige.value = branch.prestige
  estimatedFavor.value = getPrestigeFavor()
  lifetimeEarnings.value = formatNumber(branch.lifetimeEarnings)
  canDoPrestige.value = canPrestige()
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
  <div v-if="visible" class="game-panel" @click.self="emit('close')">
    <div class="game-panel__content">
      <h2 class="game-panel__title">High Table Ascension</h2>

      <template v-if="!confirming">
        <div class="prestige-info">
          <p class="prestige-info__desc">Reset buildings & currency for Table Favor</p>
          <p class="prestige-info__row">Current Prestige: <span class="prestige-info__val">{{ currentPrestige }}</span></p>
          <p class="prestige-info__row">Lifetime Earnings: <span class="prestige-info__val">{{ lifetimeEarnings }}</span></p>
          <p class="prestige-info__favor">+{{ estimatedFavor }} Favor</p>
          <p class="prestige-info__note">Staff, assassins, and upgrades are kept</p>
          <button
            class="prestige-info__btn"
            :disabled="!canDoPrestige"
            @click="requestPrestige"
          >ASCEND</button>
        </div>
      </template>

      <template v-else>
        <div class="prestige-confirm">
          <div class="prestige-confirm__title">RESET THIS CONTINENTAL?</div>
          <div class="prestige-confirm__section">
            <div class="prestige-confirm__label prestige-confirm__label--lose">You will lose:</div>
            <div class="prestige-confirm__item">- All building levels</div>
            <div class="prestige-confirm__item">- All currency</div>
            <div class="prestige-confirm__item">- Heat & reputation (partial)</div>
          </div>
          <div class="prestige-confirm__section">
            <div class="prestige-confirm__label prestige-confirm__label--gain">You will gain:</div>
            <div class="prestige-confirm__item">+ {{ estimatedFavor }} Table Favor</div>
            <div class="prestige-confirm__item">+ Prestige Level {{ currentPrestige + 1 }}</div>
          </div>
          <div class="prestige-confirm__section">
            <div class="prestige-confirm__label prestige-confirm__label--keep">You keep:</div>
            <div class="prestige-confirm__item">- Staff (traits & veteran status kept)</div>
            <div class="prestige-confirm__item">- Assassins (with loyalty)</div>
            <div class="prestige-confirm__item">- Upgrades purchased</div>
          </div>
          <div class="prestige-confirm__actions">
            <button class="prestige-confirm__btn prestige-confirm__btn--cancel" @click="cancelPrestige">CANCEL</button>
            <button class="prestige-confirm__btn prestige-confirm__btn--ascend" @click="confirmPrestige">ASCEND</button>
          </div>
        </div>
      </template>

      <button class="game-panel__close" @click="emit('close')">Close</button>
    </div>
  </div>
</template>
