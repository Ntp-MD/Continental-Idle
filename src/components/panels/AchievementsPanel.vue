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
  <div v-if="visible" class="game_panel" @click.self="emit('close')">
    <div class="game_panel__content game_panel__content__wide" role="dialog" aria-modal="true" aria-labelledby="panel_title_achievements">
      <h2 id="panel_title_achievements" class="game_panel__title">Achievements</h2>

      <div class="ach_progress">
        <div class="ach_progress__bar">
          <div class="ach_progress__fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <span class="ach_progress__text">{{ unlockedCount }} / {{ totalCount }} ({{ progressPercent }}%)</span>
      </div>

      <div class="ach_categories">
        <button
          class="ach_cat_btn"
          :class="{ 'ach_cat_btn__active': selectedCategory === 'all' }"
          @click="selectedCategory = 'all'"
        >All</button>
        <button
          v-for="cat in ACHIEVEMENT_CATEGORIES"
          :key="cat.id"
          class="ach_cat_btn"
          :class="{ 'ach_cat_btn__active': selectedCategory === cat.id }"
          @click="selectedCategory = cat.id"
        >{{ cat.icon }} {{ cat.name }}</button>
      </div>

      <div class="ach_list">
        <div
          v-for="ach in filteredAchievements"
          :key="ach.id"
          class="ach_item"
          :class="{ 'ach_item__unlocked': unlockedSet.has(ach.id), 'ach_item__locked': !unlockedSet.has(ach.id) }"
        >
          <div class="ach_item__icon">{{ ach.icon }}</div>
          <div class="ach_item__body">
            <div class="ach_item__name">{{ ach.name }}</div>
            <div class="ach_item__desc">{{ ach.description }}</div>
            <div class="ach_item__reward">
              <span v-if="ach.reward.type === 'tableFavor'">Reward: +{{ ach.reward.value }} Table Favor</span>
              <span v-else>Reward: +{{ (ach.reward.value * 100).toFixed(0) }}% Permanent Income</span>
            </div>
          </div>
          <div class="ach_item__status">
            <span v-if="unlockedSet.has(ach.id)" class="ach_item__check">&#x2713;</span>
            <span v-else class="ach_item__lock">&#x1F512;</span>
          </div>
        </div>
      </div>

      <div v-if="recentUnlock" class="ach_recent">
        <span class="ach_recent__icon">{{ recentUnlock.icon }}</span>
        <span class="ach_recent__text">{{ recentUnlock.name }} — {{ recentUnlock.description }}</span>
      </div>

      <button class="game_panel__close" @click="emit('close')">Close</button>
    </div>
  </div>
</template>
