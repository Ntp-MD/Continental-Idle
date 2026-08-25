<script setup lang="ts">
import { ref, watch } from "vue";
import type { AssetDef } from "../types";
import ModalShell from "./ModalShell.vue";
import OriginSettingPanel from "./OriginSettingPanel.vue";
import WalkableGridEditor from "./WalkableGridEditor.vue";

const props = defineProps<{ open: boolean; asset?: AssetDef }>();
const emit = defineEmits<{ (e: "close"): void }>();

type EditorTab = "general" | "walkable";
const activeTab = ref<EditorTab>("general");

watch(
  () => props.open,
  (open) => {
    if (open) activeTab.value = "general";
  },
);
</script>

<template>
  <ModalShell :open="open && !!asset" :title="`Edit Asset - ${asset?.name ?? ''}`" max-width="1000px" width="min(94vw, 1000px)" max-height="calc(100vh - 32px)" @close="emit('close')">
    <div class="modal__body assetedit__body">
      <div class="assetedit__tabs" role="tablist" aria-label="Asset editor sections">
        <button type="button" class="assetedit__tab" :class="{ 'assetedit__tab--active': activeTab === 'general' }" role="tab" :aria-selected="activeTab === 'general'" @click="activeTab = 'general'">General</button>
        <button type="button" class="assetedit__tab" :class="{ 'assetedit__tab--active': activeTab === 'walkable' }" role="tab" :aria-selected="activeTab === 'walkable'" @click="activeTab = 'walkable'">Walkable & Interact</button>
      </div>
      <OriginSettingPanel v-if="open && activeTab === 'general' && asset" :key="asset.id" :asset="asset" />
      <WalkableGridEditor v-if="open && activeTab === 'walkable' && asset" :key="asset.id" :asset="asset" :active="open && activeTab === 'walkable'" />
    </div>
  </ModalShell>
</template>

<style scoped>
.assetedit__body {
  min-height: 320px;
}

.assetedit__tabs {
  display: flex;
  gap: var(--gap-xs);
  border-bottom: 1px solid var(--border-dim);
  padding-bottom: var(--gap-sm);
}

.assetedit__tab {
  flex: 1;
  min-width: 0;
  padding: var(--gap-md) var(--gap-sm);
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-dim);
  font-size: var(--font-xs);
  white-space: nowrap;
}

.assetedit__tab:hover {
  color: var(--text-primary);
  background: var(--bg-primary);
}

.assetedit__tab--active {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
  background: color-mix(in srgb, var(--accent-primary) 10%, transparent);
}
</style>
