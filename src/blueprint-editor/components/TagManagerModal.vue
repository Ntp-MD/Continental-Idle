<script setup lang="ts">
import { ref, computed } from "vue";
import { useAssetsStore } from "../blueprintStore";
import { useConfirm } from "@/composables/useConfirm";
import { sanitizeTag } from "../../utils/sanitize";
import { state } from "../store/state";
import type { NpcRole } from "../types";
import ModalShell from "./ModalShell.vue";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: "close"): void }>();

const store = useAssetsStore();
const confirm = useConfirm().confirm;
const newTagRaw = ref("");
const newTag = computed({
  get: () => newTagRaw.value,
  set: (v: string) => {
    newTagRaw.value = sanitizeTag(v);
  },
});
const search = ref("");
const selectedTag = ref("");

const tags = computed(() => store.globalTags.value);

const filteredTags = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return tags.value;
  return tags.value.filter((t) => t.toLowerCase().includes(q));
});

const tagUsage = computed(() => {
  const tag = selectedTag.value;
  if (!tag) return null;
  const npc = state.layout.npcConfig;
  const roles: { role: NpcRole; type: "focus" | "restricted" }[] = [];
  if (npc) {
    for (const role of npc.roles) {
      if (role.focusTags.includes(tag)) roles.push({ role, type: "focus" });
      if (role.restrictedTags.includes(tag)) roles.push({ role, type: "restricted" });
    }
  }
  const tasks = (npc?.tasks ?? []).filter((t) => t.tags.includes(tag));
  return { roles, tasks };
});

function tagTriggerRate(tag: string): number {
  return state.layout.npcConfig?.tagTriggerRates?.[tag] ?? 0;
}

function setTagTriggerRate(tag: string, rate: number) {
  const npc = state.layout.npcConfig;
  if (!npc) return;
  if (!npc.tagTriggerRates) npc.tagTriggerRates = {};
  const clamped = Math.max(0, Math.min(100, Math.floor(rate)));
  if (clamped === 0 && tag in npc.tagTriggerRates) {
    delete npc.tagTriggerRates[tag];
  } else if (clamped > 0) {
    npc.tagTriggerRates[tag] = clamped;
  }
  void store.persistNpcConfigToDisk();
}

async function addTag() {
  const t = newTagRaw.value.trim();
  if (!t) return;
  await store.addTag(t);
  newTagRaw.value = "";
}

async function removeTag(tag: string) {
  const ok = await confirm({
    title: "Delete tag",
    message: `Delete "${tag}"? This removes it from all NPC rules and origin assets.`,
    confirmLabel: "Delete",
    danger: true,
  });
  if (!ok) return;
  await store.removeTag(tag);
  if (selectedTag.value === tag) selectedTag.value = "";
}

async function onKeydown(e: KeyboardEvent) {
  if (e.key === "Enter") {
    e.preventDefault();
    await addTag();
  }
}
</script>

<template>
  <ModalShell :open="open" title="Tag Manager" max-width="720px" width="min(720px, calc(100vw - 32px))" height="auto" max-height="calc(100dvh - 64px)" @close="emit('close')">
    <div class="tagmanager__body">
      <div class="tagmanager__pane">
        <div class="tagmanager__heading">Tags</div>
        <div class="tagmanager__row">
          <input v-model="newTag" class="tagmanager__input" placeholder="New tag name..." @keydown="onKeydown" />
          <button class="btn--primary" @click="addTag">Add</button>
        </div>
        <div class="tagmanager__row">
          <input v-model="search" class="tagmanager__input" placeholder="Search tags..." />
        </div>
        <div class="tagmanager__scroll">
          <div v-if="filteredTags.length === 0" class="tagmanager__empty">No tags found</div>
          <div v-for="tag in filteredTags" :key="tag" class="tagmanager__tagrow" :class="{ 'tagmanager__tagrow--active': selectedTag === tag }" role="button" tabindex="0" @click="selectedTag = tag" @keydown.enter="selectedTag = tag">
            <span class="tagmanager__tagname">{{ tag }}</span>
            <button type="button" class="btn--danger btn--icon" @click.stop.prevent="removeTag(tag)" aria-label="Delete tag">✕</button>
          </div>
        </div>
      </div>

      <div class="tagmanager__pane">
        <div class="tagmanager__heading">Tag Detail</div>
        <div v-if="selectedTag && tagUsage" class="tagmanager__detail">
          <div class="tagmanager__selected">
            <span class="tag">{{ selectedTag }}</span>
          </div>

          <div class="tagmanager__section">Trigger Rate</div>
          <div class="tagmanager__row">
            <input type="number" min="0" max="100" step="1" class="tagmanager__input" :value="tagTriggerRate(selectedTag)" @input="setTagTriggerRate(selectedTag, +($event.target as HTMLInputElement).value)" />
            <span class="tagmanager__value">%/min</span>
          </div>
          <div class="tagmanager__hint">Chance per minute an idle NPC heads to a target with this tag. 0 = never, 100 = always.</div>

          <div class="tagmanager__section">Used by roles ({{ tagUsage.roles.length }})</div>
          <div class="tagmanager__usagelist">
            <div v-for="usage in tagUsage.roles" :key="usage.role.id + usage.type" class="tagmanager__usagerow">
              <span class="tagmanager__swatch" :style="{ background: usage.role.color }" />
              <span class="tagmanager__usagename">{{ usage.role.label }}</span>
              <span class="tag" :class="usage.type === 'focus' ? 'tag__focus' : 'tag__restricted'">{{ usage.type }}</span>
            </div>
            <div v-if="tagUsage.roles.length === 0" class="tagmanager__empty">Not used by any role</div>
          </div>

          <div class="tagmanager__section">Used by tasks ({{ tagUsage.tasks.length }})</div>
          <div class="tagmanager__usagelist">
            <div v-for="task in tagUsage.tasks" :key="task.id" class="tagmanager__usagerow">
              <span class="tagmanager__usagename">{{ task.label }}</span>
            </div>
            <div v-if="tagUsage.tasks.length === 0" class="tagmanager__empty">Not used by any task</div>
          </div>
        </div>
        <div v-else class="tagmanager__empty">Select a tag to view usage</div>
      </div>
    </div>
  </ModalShell>
</template>

<style scoped>
.tagmanager__body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.tagmanager__pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
  padding: var(--gap-md);
  overflow-y: auto;
}

.tagmanager__pane + .tagmanager__pane {
  border-left: 1px solid var(--border-dim);
}

.tagmanager__heading {
  font-weight: 600;
  font-size: var(--font-sm);
  color: var(--text-primary);
  flex-shrink: 0;
}

.tagmanager__row {
  display: flex;
  gap: var(--gap-xs);
  flex-shrink: 0;
}

.tagmanager__input {
  flex: 1;
  background: var(--bg-primary);
}

.tagmanager__scroll {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
  overflow-y: auto;
  flex: 1;
}

.tagmanager__tagrow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--gap-xs) var(--gap-sm);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.tagmanager__tagrow:hover {
  background: var(--bg-card);
}

.tagmanager__tagrow--active {
  background: var(--bg-card);
}

.tagmanager__tagname {
  font-size: var(--font-sm);
  color: var(--text-primary);
}

.tagmanager__detail {
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
}

.tagmanager__selected {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
}

.tagmanager__section {
  font-weight: 600;
  font-size: var(--font-xs);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tagmanager__value {
  font-size: var(--font-sm);
  color: var(--text-secondary);
}

.tagmanager__hint {
  font-size: var(--font-xs);
  color: var(--text-secondary);
  opacity: 0.7;
}

.tagmanager__usagelist {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
  max-height: 200px;
  overflow-y: auto;
}

.tagmanager__usagerow {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  padding: var(--gap-xs) var(--gap-sm);
  background: var(--bg-primary);
  border-radius: var(--radius-xs);
}

.tagmanager__swatch {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tagmanager__usagename {
  font-size: var(--font-sm);
  color: var(--text-primary);
}

.tagmanager__empty {
  font-size: var(--font-sm);
  color: var(--text-secondary);
  opacity: 0.6;
  padding: var(--gap-sm);
  text-align: center;
}
</style>
