<script setup lang="ts">
import { computed, ref } from "vue";
import { buildFloors } from "@/cad/floors";
import { renderFloorSvg } from "@/cad/render";

const floors = buildFloors();
const active = ref(floors[0]!.id);
const current = computed(() => floors.find((f) => f.id === active.value) ?? floors[0]!);
const svg = computed(() => renderFloorSvg(current.value));
</script>

<template>
  <div class="cad">
    <div class="cad__bar">
      <button
        v-for="f in floors"
        :key="f.id"
        class="cad__btn"
        :class="{ 'cad__btn--active': f.id === active }"
        @click="active = f.id"
      >
        {{ f.level }}
      </button>
      <span class="cad__title">{{ current.name }} - {{ current.drawingNo }}</span>
      <span class="cad__meta">KEYS {{ current.stats.keys }} / GFA {{ current.stats.gfa.toFixed(0) }} SQM</span>
    </div>
    <div class="cad__stage">
      <div class="cad__sheet" v-html="svg"></div>
    </div>
  </div>
</template>

<style scoped>
.cad {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.cad__bar {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  padding: var(--gap-xs) var(--gap-sm);
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-dim);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.cad__btn {
  padding: 3px 11px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
  color: var(--text-dim);
  cursor: pointer;
}

.cad__btn:hover {
  color: var(--text-bright);
  border-color: var(--border-color);
}

.cad__btn--active {
  background: var(--accent-primary);
  color: var(--bg-primary);
  border-color: var(--accent-primary);
}

.cad__title {
  margin-left: var(--gap-sm);
  font-size: 12px;
  color: var(--text-bright);
}

.cad__meta {
  margin-left: auto;
  font-size: 11px;
  color: var(--text-dim);
}

.cad__stage {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: var(--gap-sm);
}

.cad__sheet {
  height: 100%;
  max-width: 100%;
  aspect-ratio: 1402 / 918;
}

.cad__sheet :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
