<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { achievementManager } from '@/engine/achievementManager'
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES } from '@/data/achievements'
import type { AchievementCategory } from '@/data/achievements'
import { eventBus } from '@/engine/eventBus'
import { useToast } from '@/composables/useToast'

const toast = useToast()

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits(['close'])

const unlockedSet = ref<Set<string>>(new Set())
const selectedCategory = ref<AchievementCategory | 'all'>('all')
const recentUnlock = ref<{ name: string; icon: string; description: string } | null>(null)

const unlockedCount = computed(() => unlockedSet.value.size)
const totalCount = computed(() => ACHIEVEMENTS.length)
const progressPercent = computed(() => totalCount.value > 0 ? Math.round((unlockedCount.value / totalCount.value) * 100) : 0)

const filteredAchievements = computed(() => {
  if (selectedCategory.value === 'all') return ACHIEVEMENTS
  return ACHIEVEMENTS.filter(a => a.category === selectedCategory.value)
})

function update() {
  unlockedSet.value = new Set(achievementManager.getUnlocked())
}

function handleUnlock(e: CustomEvent) {
  const detail = e.detail as { id: string; name: string; description: string; icon: string }
  recentUnlock.value = { name: detail.name, icon: detail.icon, description: detail.description }
  toast.success(`Achievement unlocked: ${detail.name}`)
  update()
  setTimeout(() => { recentUnlock.value = null }, 4000)
}

onMounted(() => {
  update()
  eventBus.on('achievement:unlocked', handleUnlock)
})

onUnmounted(() => {
  eventBus.off('achievement:unlocked', handleUnlock)
})

watch(() => props.visible, (v) => {
  if (v) update()
})
</script>

<template>
  <div v-if="visible" class="panel" @click.self="emit('close')">
    <div class="panel__content panel__content__wide" role="dialog" aria-modal="true" aria-labelledby="panel__title__achievements">
      <h2 id="panel__title__achievements" class="panel__title">Achievements</h2>

      <div class="ach__progress">
        <div class="ach__progress__bar">
          <div class="ach__progress__fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <span class="ach__progress__text">{{ unlockedCount }} / {{ totalCount }} ({{ progressPercent }}%)</span>
      </div>

      <div class="ach__categories">
        <button
          class="btn__filter"
          :class="{ 'btn__filter__active': selectedCategory === 'all' }"
          @click="selectedCategory = 'all'"
        >All</button>
        <button
          v-for="cat in ACHIEVEMENT_CATEGORIES"
          :key="cat.id"
          class="btn__filter"
          :class="{ 'btn__filter__active': selectedCategory === cat.id }"
          @click="selectedCategory = cat.id"
        >{{ cat.icon }} {{ cat.name }}</button>
      </div>

      <div class="ach__list">
        <div
          v-for="ach in filteredAchievements"
          :key="ach.id"
          class="card ach__item"
          :class="{ 'ach__item__unlocked': unlockedSet.has(ach.id), 'ach__item__locked': !unlockedSet.has(ach.id) }"
        >
          <div class="ach__item__icon">{{ ach.icon }}</div>
          <div class="ach__item__body">
            <div class="ach__item__name">{{ ach.name }}</div>
            <div class="ach__item__desc">{{ ach.description }}</div>
            <div class="ach__item__reward">
              <span v-if="ach.reward.type === 'tableFavor'">Reward: +{{ ach.reward.value }} Table Favor</span>
              <span v-else>Reward: +{{ (ach.reward.value * 100).toFixed(0) }}% Permanent Income</span>
            </div>
          </div>
          <div class="ach__item__status">
            <span v-if="unlockedSet.has(ach.id)" class="ach__item__check">&#x2713;</span>
            <span v-else class="ach__item__lock">&#x1F512;</span>
          </div>
        </div>
      </div>

      <div v-if="recentUnlock" class="ach__recent">
        <span class="ach__recent__icon">{{ recentUnlock.icon }}</span>
        <span class="ach__recent__text">{{ recentUnlock.name }} — {{ recentUnlock.description }}</span>
      </div>

      <button class="panel__close" @click="emit('close')">Close</button>
    </div>
  </div>
</template>
