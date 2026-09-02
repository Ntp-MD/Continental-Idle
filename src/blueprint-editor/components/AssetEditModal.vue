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
    modal-id="modal-asset-edit"
    :title="`Edit Asset - ${asset?.name ?? ''}`"
    @close="emit('close')"
  >
    <div class="tabs tabs--sidebar assetedit__layout">
      <div class="tabs__bar" role="tablist" aria-label="Asset editor sections">
        <button
          v-for="t in tabs"
          :key="t.key"
          type="button"
          class="tabs__tab"
          :class="{ 'flag--active': activeTab === t.key }"
          role="tab"
          :aria-selected="activeTab === t.key"
          @click="activeTab = t.key"
        >
          {{ t.label }}
        </button>
      </div>
      <div class="assetedit__content">
        <OriginSettingPanel v-if="open && activeTab === 'general' && asset" :key="asset.id" :asset="asset" />
        <WalkableGridEditor
          v-if="open && activeTab !== 'general' && asset"
          :key="asset.id"
          :asset="asset"
          :active="open"
          :active-tab="activeTab"
        />
      </div>
    </div>
  </ModalShell>
</template>

<style scoped>
.assetedit__layout {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: var(--gap-md);
}

.assetedit__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
  overflow-y: auto;
}
</style>

<style>
#modal-asset-edit {
  width: min(94vw, 1000px);
  max-height: calc(100vh - 32px);
}

#modal-asset-edit .modal__body {
  overflow: hidden;
}
</style>
