<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from "vue";
import type { SyncedLayoutPayload, SyncedFloor, SyncedObject, ObjectData } from "@/blueprint-editor/types";
import { buildAssetMap, svgColorVarStyle } from "@/blueprint-editor/assetUtils";
import { originAssets } from "@/blueprint-editor/store/dataLoader";
import { useGameNpcSimulation } from "@/composables/useGameNpcSimulation";
import { svgTransform as svgTransformGeo, roundedRectPath } from "@/blueprint-editor/geometry";
import { renderSvgInto as renderSvgContent } from "@/blueprint-editor/svgSanitizer";

const props = defineProps<{
  payload: SyncedLayoutPayload | null;
}>();

const vSvgContent = {
  mounted(el: Element, binding: { value: string }) {
    if (binding.value) renderSvgContent(el as SVGGElement, binding.value);
  },
  updated(el: Element, binding: { value: string; oldValue?: string }) {
    if (binding.value !== binding.oldValue && binding.value) {
      renderSvgContent(el as SVGGElement, binding.value);
    }
  },
};

const assetMap = buildAssetMap(originAssets);

const payloadRef = computed(() => props.payload);
const sim = useGameNpcSimulation(payloadRef);

const canvas = computed(() => {
  if (!props.payload) return { width: 1600, height: 1200, tileSize: 1 };
  return props.payload.canvas;
});

const floorIds = computed(() => {
  if (!props.payload) return [];
  return Object.keys(props.payload.floors).sort((a, b) => {
    if (a === "G") return -1;
    if (b === "G") return 1;
    return Number(a) - Number(b);
  });
});

const currentFloorId = computed(() => sim.currentFloorId.value ?? floorIds.value[0] ?? null);

const currentFloor = computed<SyncedFloor | null>(() => {
  if (!props.payload || !currentFloorId.value) return null;
  return props.payload.floors[currentFloorId.value] ?? null;
});

const currentFloorNpcs = computed(() => sim.npcs.value.filter((n) => n.floorId === currentFloorId.value));

function selectFloor(id: string) {
  sim.setFloor(id);
}

function assetSvg(type: string): string | undefined {
  return assetMap.get(type)?.svg;
}

function objFillColor(obj: SyncedObject): string {
      return obj.fillColor ?? assetMap.get(obj.type)?.defaultFillColor ?? "var(--bg-primary)";
}

function objRx(obj: SyncedObject): { tl: number; tr: number; br: number; bl: number } | undefined {
  return assetMap.get(obj.type)?.defaultRx;
}

function objRadius(obj: SyncedObject): number {
  return assetMap.get(obj.type)?.defaultRadius ?? 0;
}

function svgTransform(obj: SyncedObject): string {
  const fakeObj = { ...obj } as ObjectData;
  return svgTransformGeo(fakeObj, assetMap.get(obj.type));
}

function svgVars(obj: SyncedObject): string {
  const a = assetMap.get(obj.type);
  return svgColorVarStyle(obj.fillColor ?? a?.defaultFillColor, obj.strokeColor ?? a?.defaultStrokeColor);
}

onMounted(() => {
  if (props.payload) {
    sim.deploy();
  }
});

onUnmounted(() => {
  sim.stop();
});

watch(
  () => props.payload,
  (val) => {
    if (val && !sim.currentFloorId.value) {
      sim.deploy();
    }
  },
  { deep: false },
);
</script>

<template>
  <div class="hotel">
    <svg class="hotel__svg" :viewBox="`0 0 ${canvas.width} ${canvas.height}`" preserveAspectRatio="xMidYMid meet" role="application" aria-label="Hotel simulation view">
      <rect :width="canvas.width" :height="canvas.height" :fill="canvas.bgColor || 'var(--bg-secondary)'" />

      <template v-if="currentFloor">
        <g v-for="obj in currentFloor.objects" :key="obj.id">
          <rect :x="obj.x" :y="obj.y" :width="obj.w" :height="obj.h" fill="transparent" class="hotel__hit" />
          <template v-if="assetSvg(obj.type)">
            <g v-svg-content="assetSvg(obj.type)" :transform="svgTransform(obj)" :style="svgVars(obj)" />
          </template>
          <path v-else-if="roundedRectPath(obj.x, obj.y, obj.w, obj.h, objRx(obj))" :d="roundedRectPath(obj.x, obj.y, obj.w, obj.h, objRx(obj))!" :fill="objFillColor(obj)" stroke="var(--text-primary)" stroke-width="1" />
          <rect v-else :x="obj.x" :y="obj.y" :width="obj.w" :height="obj.h" :fill="objFillColor(obj)" stroke="var(--text-primary)" stroke-width="1" :rx="objRadius(obj)" />
          <text v-if="obj.label" :x="obj.x + obj.w / 2" :y="obj.y + obj.h / 2" text-anchor="middle" dominant-baseline="middle" font-size="8" fill="var(--text-dim)" class="hotel__nolabel">
            {{ obj.label }}
          </text>
        </g>

        <g class="hotel__npcs hotel__nolabel">
          <g v-for="npc in currentFloorNpcs" :key="npc.id">
            <circle :cx="npc.x" :cy="npc.y" r="6" :fill="npc.color" opacity="0.25" />
            <circle :cx="npc.x" :cy="npc.y" r="4" :fill="npc.color" stroke="var(--text-bright)" stroke-width="1" />
          </g>
        </g>
      </template>
    </svg>

    <div class="hotel__floorbar" v-if="floorIds.length > 0">
      <button v-for="id in floorIds" :key="id" class="hotel__floorbtn" :class="{ 'hotel__floorbtn--active': id === currentFloorId }" @click="selectFloor(id)">
        {{ id === "G" ? "B" : id }}
      </button>
    </div>

    <div class="hotel__chip" v-if="currentFloor" aria-live="polite">
      <span class="hotel__chip-floor">{{ currentFloorId === "G" ? "B" : currentFloorId }}</span>
      <span class="hotel__chip-count">{{ currentFloorNpcs.length }}</span>
    </div>

    <div class="empty hotel__empty" v-if="!props.payload">
      <p>No hotel layout found yet.</p>
      <p>Open the Blueprint Editor, place some objects and press Sync Game.</p>
    </div>
  </div>
</template>

<style scoped>
.hotel {
  width: 100%;
  height: 100%;
  position: relative;
  background: var(--bg-primary);
  overflow: hidden;
}

.hotel__svg {
  width: 100%;
  height: 100%;
  display: block;
}

.hotel__chip {
  position: absolute;
  top: var(--gap-sm);
  right: var(--gap-sm);
  display: flex;
  align-items: baseline;
  gap: var(--gap-xs);
  padding: 4px 10px;
  background: color-mix(in srgb, var(--bg-primary) 78%, transparent);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-md);
  z-index: var(--z-layer-2);
  pointer-events: none;
}

.hotel__chip-floor {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-bright);
}

.hotel__chip-count {
  font-size: 11px;
  color: var(--text-dim);
}

.hotel__hit {
  pointer-events: all;
}

.hotel__nolabel {
  pointer-events: none;
}

.hotel__floorbar {
  position: absolute;
  bottom: var(--gap-md);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: var(--gap-xs);
  padding: var(--gap-xs) var(--gap-sm);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-md);
  z-index: var(--z-layer-2);
}

.hotel__floorbtn {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
  color: var(--text-dim);
  cursor: pointer;
  transition: all 0.15s ease;
}

.hotel__floorbtn:hover {
  background: var(--bg-primary);
  color: var(--text-bright);
}

.hotel__floorbtn--active {
  background: var(--accent-primary);
  color: var(--bg-primary);
  border-color: var(--accent-primary);
}

.hotel__empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-sm);
}
</style>
