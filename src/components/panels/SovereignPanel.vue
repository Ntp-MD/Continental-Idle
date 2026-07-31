<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { gameState } from '@/engine/gameState'
import { sovereignManager } from '@/engine/sovereignManager'
import { eventBus } from '@/engine/eventBus'
import { useToast } from '@/composables/useToast'
import type { RoyalDecreeTemplate } from '@/data/royalDecrees'

const toast = useToast()

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits(['close'])

const isSovereign = ref(false)
const sandboxLoops = ref(0)
const canDecree = ref(false)
const decreeChoices = ref<RoyalDecreeTemplate[]>([])
const activeDecrees = ref<{ name: string; description: string; expiresAt: number | null; timeLeft: string }[]>([])
const timeUntilDecree = ref('')

const conqueredCount = computed(() => gameState.get().worldMap.conqueredBranches.length)
const royalCount = computed(() => gameState.get().worldMap.royalBranches.length)
const aiDefeatedCount = computed(() => Object.entries(gameState.get().aiOwners).filter(([id, o]) => id !== gameState.get().hqBranch && o.defeated).length)

function update() {
  if (!props.visible) return
  const state = gameState.get()
  isSovereign.value = state.sovereign
  sandboxLoops.value = state.sandboxLoops
  canDecree.value = sovereignManager.canIssueDecree()
  activeDecrees.value = sovereignManager.getActiveDecrees().map(d => {
    let timeLeft = ''
    if (d.expiresAt !== null) {
      const remaining = d.expiresAt - Date.now()
      if (remaining > 0) {
        const hours = Math.floor(remaining / (3600 * 1000))
        const mins = Math.floor((remaining % (3600 * 1000)) / (60 * 1000))
        timeLeft = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
      } else {
        timeLeft = 'expiring'
      }
    } else {
      timeLeft = 'permanent'
    }
    return {
      name: d.name,
      description: d.description,
      expiresAt: d.expiresAt,
      timeLeft,
    }
  })

  if (!canDecree.value && state.sovereign) {
    const remaining = (24 * 3600 * 1000) - (Date.now() - state.lastDecreeAt)
    if (remaining > 0) {
      const hours = Math.floor(remaining / (3600 * 1000))
      const mins = Math.floor((remaining % (3600 * 1000)) / (60 * 1000))
      timeUntilDecree.value = `${hours}h ${mins}m`
    } else {
      timeUntilDecree.value = ''
    }
  } else {
    timeUntilDecree.value = ''
  }

  if (canDecree.value && decreeChoices.value.length === 0) {
    decreeChoices.value = sovereignManager.getDecreeChoices()
  }
}

function chooseDecree(template: RoyalDecreeTemplate) {
  if (sovereignManager.issueDecree(template)) {
    toast.success(`Decree issued: ${template.name}`)
    decreeChoices.value = []
    update()
  }
}

function doSandboxLoop() {
  if (sovereignManager.doSandboxLoop()) {
    const state = gameState.get()
    toast.success(`Sandbox+ Loop ${state.sandboxLoops} completed! Rewards granted.`)
    update()
  }
}

function handleSovereignAchieved() {
  toast.success('You have achieved the Sovereign of the High Table!')
  update()
}

onMounted(() => {
  update()
  eventBus.on('sovereign:achieved', handleSovereignAchieved)
  eventBus.on('income:tick', update)
})

onUnmounted(() => {
  eventBus.off('sovereign:achieved', handleSovereignAchieved)
  eventBus.off('income:tick', update)
})

watch(() => props.visible, (v) => {
  if (v) {
    decreeChoices.value = []
    update()
  }
})
</script>

<template>
  <div v-if="visible" class="panel" @click.self="emit('close')">
    <div class="panel__content panel__content__wide" role="dialog" aria-modal="true" aria-labelledby="panel__title__sovereign">
      <h2 id="panel__title__sovereign" class="panel__title">Sovereign of the High Table</h2>

      <template v-if="!isSovereign">
        <div class="sov__locked">
          <p class="sov__locked__title">The High Table Awaits</p>
          <p class="sov__locked__desc">Conquer all 36 rival branches, establish Royal Continental on all, and defeat all AI controllers to claim sovereignty.</p>
          <div class="sov__progress">
            <div class="sov__progress__row">Branches Conquered: <span class="sov__progress__val">{{ conqueredCount }} / 36</span></div>
            <div class="sov__progress__row">Royal Continentals: <span class="sov__progress__val">{{ royalCount }} / 36</span></div>
            <div class="sov__progress__row">AI Controllers Defeated: <span class="sov__progress__val">{{ aiDefeatedCount }} / 36</span></div>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="sov__header">
          <p class="sov__header__title">&#x1F451; The Sovereign of the High Table</p>
          <p class="sov__header__effect">All buffs from all sources doubled. Sandbox+ loops: {{ sandboxLoops }}</p>
        </div>

        <!-- Royal Decrees -->
        <div class="sov__section">
          <h3 class="sov__section__title">Royal Decrees</h3>
          <p class="sov__section__desc">Choose 1 of 3 random global buffs every 24 hours.</p>

          <template v-if="canDecree">
            <div class="sovchoices">
              <div
                v-for="(choice, i) in decreeChoices"
                :key="i"
                class="decree__card"
                @click="chooseDecree(choice)"
              >
                <div class="decree__card__name">{{ choice.name }}</div>
                <div class="decree__card__desc">{{ choice.description }}</div>
              </div>
            </div>
          </template>
          <template v-else>
            <p class="sovcooldown">Next decree available in: {{ timeUntilDecree }}</p>
          </template>

          <div v-if="activeDecrees.length > 0" class="sovdecrees">
            <div class="sovdecrees__label">Active Decrees:</div>
            <div v-for="(d, i) in activeDecrees" :key="i" class="sovdecree">
              <span class="sovdecree__name">{{ d.name }}</span>
              <span class="sovdecree__desc">{{ d.description }}</span>
              <span class="sovdecree__timer" :class="{ 'sovdecree__timer__permanent': d.expiresAt === null }">{{ d.timeLeft }}</span>
            </div>
          </div>
        </div>

        <!-- Sandbox+ -->
        <div class="sov__section">
          <h3 class="sov__section__title">Sandbox+ Mode</h3>
          <p class="sov__section__desc">Reset for increasing rewards. Each loop grants +10% to all rewards.</p>
          <div class="sov__sandbox">
            <div class="sov__sandbox__info">Current Loop: {{ sandboxLoops }}</div>
            <div class="sov__sandbox__mult">Reward Multiplier: {{ (1 + 0.10 * sandboxLoops).toFixed(1) }}x</div>
            <button class="btn__gold sov__sandbox__btn" @click="doSandboxLoop">Execute Loop (+{{ Math.floor(100 * (1 + 0.10 * (sandboxLoops + 1))) }} Marks, +{{ Math.floor(50 * (1 + 0.10 * (sandboxLoops + 1))) }} Favor)</button>
          </div>
        </div>
      </template>

      <button class="panel__close" @click="emit('close')">Close</button>
    </div>
  </div>
</template>
