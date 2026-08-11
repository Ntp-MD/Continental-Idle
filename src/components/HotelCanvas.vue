<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from "vue";
import type { SyncedLayoutPayload, SyncedFloor, SyncedObject, ObjectData } from "@/blueprint-editor/types";
import { buildAssetMap } from "@/blueprint-editor/assetUtils";
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
  return obj.fillColor ?? assetMap.get(obj.type)?.defaultBgColor ?? "var(--bg-card)";
}

function objPadding(obj: SyncedObject): number {
  return assetMap.get(obj.type)?.defaultPadding ?? 0;
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
  <div class="hotel-canvas">
    <svg class="hotel-canvas__svg" :viewBox="`0 0 ${canvas.width} ${canvas.height}`" preserveAspectRatio="xMidYMid meet" role="application" aria-label="Hotel simulation view">
      <rect :width="canvas.width" :height="canvas.height" fill="var(--bg-secondary)" />

      <template v-if="currentFloor">
        <g v-for="obj in currentFloor.objects" :key="obj.id">
          <rect :x="obj.x" :y="obj.y" :width="obj.w" :height="obj.h" fill="transparent" style="pointer-events: all" />
          <template v-if="assetSvg(obj.type)">
            <rect :x="obj.x + objPadding(obj)" :y="obj.y + objPadding(obj)" :width="obj.w - objPadding(obj) * 2" :height="obj.h - objPadding(obj) * 2" :fill="objFillColor(obj)" />
            <g v-svg-content="assetSvg(obj.type)" :transform="svgTransform(obj)" />
          </template>
          <path v-else-if="roundedRectPath(obj.x, obj.y, obj.w, obj.h, objRx(obj))" :d="roundedRectPath(obj.x, obj.y, obj.w, obj.h, objRx(obj))!" :fill="objFillColor(obj)" stroke="var(--text-primary)" stroke-width="1" />
          <rect v-else :x="obj.x" :y="obj.y" :width="obj.w" :height="obj.h" :fill="objFillColor(obj)" stroke="var(--text-primary)" stroke-width="1" :rx="objRadius(obj)" />
          <text v-if="obj.label" :x="obj.x + obj.w / 2" :y="obj.y + obj.h / 2" text-anchor="middle" dominant-baseline="middle" font-size="8" fill="var(--text-dim)" style="pointer-events: none">
            {{ obj.label }}
          </text>
        </g>

        <g class="hotel-canvas__npcs" style="pointer-events: none">
          <g v-for="npc in currentFloorNpcs" :key="npc.id">
            <circle :cx="npc.x" :cy="npc.y" r="6" :fill="npc.color" opacity="0.25" />
            <circle :cx="npc.x" :cy="npc.y" r="4" :fill="npc.color" stroke="var(--text-bright)" stroke-width="1" />
          </g>
        </g>
      </template>
    </svg>

    <div class="hotel-canvas__floorbar" v-if="floorIds.length > 0">
      <button v-for="id in floorIds" :key="id" class="hotel-canvas__floorbtn" :class="{ 'hotel-canvas__floorbtn--active': id === currentFloorId }" @click="selectFloor(id)">
        {{ id === "G" ? "B" : id }}
      </button>
    </div>

    <div class="hotel-canvas__empty" v-if="!props.payload">
      <p>No hotel data loaded. Open the Blueprint Editor and sync to see the hotel.</p>
    </div>
  </div>
</template>

<style scoped>
.hotel-canvas {
  width: 100%;
  height: 100%;
  position: relative;
  background: var(--bg-primary);
  overflow: hidden;
}

.hotel-canvas__svg {
  width: 100%;
  height: 100%;
  display: block;
}

.hotel-canvas__floorbar {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 4px;
  padding: 6px 10px;
  background: var(--bg-card);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-md);
  z-index: 10;
}

.hotel-canvas__floorbtn {
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

.hotel-canvas__floorbtn:hover {
  background: var(--bg-card);
  color: var(--text-bright);
}

.hotel-canvas__floorbtn--active {
  background: var(--accent-gold);
  color: var(--bg-primary);
  border-color: var(--accent-gold);
}

.hotel-canvas__empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-dim);
  font-size: 14px;
}
</style>
