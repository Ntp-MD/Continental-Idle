<script setup lang="ts">
import { ref, watch, defineAsyncComponent } from 'vue'
import type { AssetDef } from '../types'
import ModalShell from './ModalShell.vue'
import OriginSettingPanel from './OriginSettingPanel.vue'
import type { GridTab } from './WalkableGridEditor.vue'
const WalkableGridEditor = defineAsyncComponent(() => import('./WalkableGridEditor.vue'))

const props = defineProps<{ open: boolean; asset?: AssetDef }>()
const emit = defineEmits<{ (e: 'close'): void }>()

type EditorTab = 'general' | GridTab
const activeTab = ref<EditorTab>('general')

const tabs: { key: EditorTab; label: string }[] = [
  { key: 'general', label: 'General' },
  { key: 'walk', label: 'Walkable' },
  { key: 'door', label: 'Doors & Edges' },
  { key: 'interactspots', label: 'Interact Spots' },
]

watch(
  () => props.open,
  (open) => {
    if (open) activeTab.value = 'general'
  },
)
</script>

<template>
  <ModalShell
    :open="open && !!asset"
    :title="`Edit Asset - ${asset?.name ?? ''}`"
    width="min(94vw, 1000px)"
    max-width="1000px"
    max-height="calc(100vh - 32px)"
    @close="emit('close')"
  >
    <div class="form__row" role="tablist" aria-label="Asset editor sections">
      <button
        v-for="t in tabs"
        :key="t.key"
        type="button"
        class="form__tab"
        :class="{ 'form__tab--active': activeTab === t.key }"
        role="tab"
        :aria-selected="activeTab === t.key"
        @click="activeTab = t.key"
      >
        {{ t.label }}
      </button>
    </div>
    <OriginSettingPanel v-if="open && activeTab === 'general' && asset" :key="asset.id" :asset="asset" />
    <WalkableGridEditor
      v-if="open && activeTab !== 'general' && asset"
      :key="asset.id"
      :asset="asset"
      :active="open"
      :active-tab="activeTab"
    />
  </ModalShell>
</template>
