<script setup lang="ts">
import { ref, watch, defineAsyncComponent } from 'vue'
import type { AssetDef } from '../../domain/types'
import ModalShell from '../shell/ModalShell.vue'
import OriginSettingPanel from '../panels/OriginSettingPanel.vue'
import { useAssetPreview } from '../../composables/useAssetPreview'
import type { GridTab } from '../canvas/WalkableGridEditor.vue'
const WalkableGridEditor = defineAsyncComponent(() => import('../canvas/WalkableGridEditor.vue'))

const props = defineProps<{ open: boolean; asset?: AssetDef }>()
const emit = defineEmits<{ (e: 'close'): void }>()

type EditorTab = 'general' | GridTab
const activeTab = ref<EditorTab>('general')

const tabs: { key: EditorTab; label: string }[] = [
  { key: 'general', label: 'General' },
  { key: 'walk', label: 'Walkable' },
  { key: 'interactspots', label: 'Interact Spots' },
  { key: 'assign', label: 'Assign NPC' },
]

watch(
  () => props.open,
  (open) => {
    if (open) activeTab.value = 'general'
  },
)

const { viewBox: previewViewBox, vars: previewVars, setEl: setPreviewEl } = useAssetPreview({
  asset: () => props.asset,
  isActive: () => props.open,
})
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
      <div v-if="open && asset" class="edit__preview">
        <span class="edit__preview-label">Real Visual</span>
        <div class="edit__preview-box">
          <svg
            :ref="setPreviewEl"
            :viewBox="previewViewBox"
            preserveAspectRatio="xMidYMid meet"
            class="edit__preview-svg"
            :style="previewVars"
          ></svg>
        </div>
        <span class="form__hint">{{ asset.name }} - {{ asset.w }}x{{ asset.h }} tiles</span>
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

.edit__preview {
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
  border: 1px solid var(--border-dim);
  padding: var(--gap-sm);
  width: 248px;
  flex-shrink: 0;
  align-self: flex-start;
}

.edit__preview-label {
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: var(--text-secondary);
}

.edit__preview-box {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  padding: var(--gap-sm);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.edit__preview-svg {
  width: 100%;
  height: 100%;
}

#modal-asset-edit {
  width: min(96vw, 1200px);
  height: min(88vh, 800px);
  max-height: calc(100vh - 32px);
}

#modal-asset-edit .modal__body {
  overflow: hidden;
}
</style>
