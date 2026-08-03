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

<style scoped>
.ach__progress {
	display: flex;
	align-items: center;
	gap: var(--gap-sm);
	margin-bottom: var(--gap-sm);
}

.ach__progress__bar {
	flex: 1;
	height: 6px;
	background: var(--bg-primary);
	border: none;
	border-radius: var(--radius-sm);
	overflow: hidden;
}

.ach__progress__fill {
	height: 100%;
	background: var(--gradient-gold);
	transition: width var(--duration-normal) var(--ease-out);
	border-radius: var(--radius-sm);
	box-shadow: 0 0 6px rgba(240, 192, 64, 0.3);
}

.ach__progress__text {
	font-size: var(--font-sm);
	color: var(--text-dim);
	white-space: nowrap;
}

.ach__categories {
	display: flex;
	flex-wrap: wrap;
	gap: var(--gap-xs);
	margin-bottom: var(--gap-sm);
}



.ach__list {
	display: flex;
	flex-direction: column;
	gap: var(--gap-xs);
	max-height: 50vh;
	overflow-y: auto;
}

.ach__item {
	display: flex;
	align-items: center;
	gap: var(--gap-sm);
	transition: all var(--duration-fast) var(--ease-out);
}

.ach__item:hover {
	background: var(--bg-card-hover);
}

.ach__item__unlocked {
	border-color: var(--accent-gold);
	background: color-mix(in srgb, var(--accent-gold) 12%, transparent);
}

.ach__item__locked {
	opacity: 0.5;
}

.ach__item__icon {
	font-size: var(--font-xl);
	flex-shrink: 0;
	width: 28px;
	text-align: center;
}

.ach__item__body {
	display: flex;
	flex-direction: column;
	gap: var(--gap-xs);
	flex: 1;
	min-width: 0;
}

.ach__item__name {
	font-size: var(--font-md);
	color: var(--text-primary);
	font-weight: bold;
}

.ach__item__desc {
	font-size: var(--font-xs);
	color: var(--text-dim);
}

.ach__item__reward {
	font-size: var(--font-xs);
	color: var(--accent-green);
}

.ach__item__status {
	flex-shrink: 0;
	font-size: var(--font-lg);
}

.ach__item__check {
	color: var(--accent-gold);
}

.ach__item__lock {
	opacity: 0.5;
}

.ach__recent {
	position: fixed;
	bottom: 20px;
	left: 50%;
	transform: translateX(-50%);
	background: var(--bg-card);
	border: 1px solid var(--accent-gold);
	border-radius: var(--radius-lg);
	padding: var(--gap-sm) var(--gap-lg);
	display: flex;
	align-items: center;
	gap: var(--gap-sm);
	font-size: var(--font-md);
	font-weight: 500;
	color: var(--text-primary);
	z-index: 3000;
	animation: ach-slide-up 0.3s var(--ease-out);
	box-shadow: var(--shadow-glow-gold), var(--shadow-panel);
	backdrop-filter: blur(12px);
	-webkit-backdrop-filter: blur(12px);
}

.ach__recent__icon {
	font-size: var(--font-xl);
}

.ach__recent__text {
	flex: 1;
	font-size: var(--font-sm);
	color: var(--text-primary);
}

@keyframes ach-slide-up {
	from {
		opacity: 0;
		transform: translateX(-50%) translateY(20px);
	}

	to {
		opacity: 1;
		transform: translateX(-50%) translateY(0);
	}
}
</style>
