<script setup lang="ts">
import { ref, watch, defineAsyncComponent } from 'vue'
import type { AssetDef } from '../../domain/types'
import ModalShell from '../shell/ModalShell.vue'
import OriginSettingPanel from '../panels/OriginSettingPanel.vue'
import type { GridTab } from '../canvas/WalkableGridEditor.vue'
const WalkableGridEditor = defineAsyncComponent(() => import('../canvas/WalkableGridEditor.vue'))

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
    <div class="tabs--sidebar edit__layout">
      <div class="tabs__bar" role="tablist" aria-label="Asset editor sections">
        <button
          v-for="t in tabs"
          :id="`edit__tab--${t.key}`"
          :key="t.key"
          type="button"
          class="tabs__tab"
          :class="{ 'flag--active': activeTab === t.key }"
          role="tab"
          :aria-selected="activeTab === t.key"
          :aria-controls="`edit__panel--${t.key}`"
          @click="activeTab = t.key"
        >
          {{ t.label }}
        </button>
      </div>
      <div class="edit__content form__col size--stretch">
        <div
          v-if="open && activeTab === 'general' && asset"
          :id="`edit__panel--general`"
          role="tabpanel"
          aria-labelledby="edit__tab--general"
        >
          <OriginSettingPanel :key="asset.id" :asset="asset" />
        </div>
        <div
          v-if="open && activeTab !== 'general' && asset"
          :id="`edit__panel--${activeTab}`"
          role="tabpanel"
          :aria-labelledby="`edit__tab--${activeTab}`"
        >
          <WalkableGridEditor :key="asset.id" :asset="asset" :active="open" :active-tab="activeTab" />
        </div>
      </div>
    </div>
  </ModalShell>
</template>

<style>
.edit__layout {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: var(--gap-md);
}

.edit__content {
  overflow-y: auto;
}

#modal-asset-edit {
  width: min(94vw, 1000px);
  height: min(80vh, 720px);
  max-height: calc(100vh - 32px);
}

#modal-asset-edit .modal__body {
  overflow: hidden;
}
</style>
