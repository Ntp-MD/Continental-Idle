<script setup lang="ts">
import { ref, watch, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useAssetsStore } from "../blueprintStore";
import { useToast } from "@/composables/useToast";
import { useConfirm } from "@/composables/useConfirm";
import { useWalkableGridPanel } from "../composables/useWalkableGridPanel";
import { renderSvgInto } from "../svgSanitizer";
import { assetSvgVarStyle } from "../assetUtils";
import type { AssetDef, TileState, TileEdges, InteractSpot } from "../types";
import { normalizeInteractConfig, normalizeNpcQueueConfig, resolveInteractForTarget } from "../types";
import ModalShell from "./ModalShell.vue";

type BorderSide = "top" | "right" | "bottom" | "left";

const store = useAssetsStore();
const confirm = useConfirm().confirm;
const { showWalkableGridPanel, closeWalkableGridPanel } = useWalkableGridPanel();

const gridAsset = computed(() => {
  const a = store.selectedAsset.value;
  return a && !a.linkedParts ? a : undefined;
});

const gridTiles = ref<TileState[][]>([]);
const gridEdges = ref<TileEdges[][]>([]);
const walkBrush = ref<TileState>("walkable");
const entranceBrush = ref<"door" | "border">("door");
const isDraggingGrid = ref(false);
const gridDirty = ref(false);
const savedGridKey = ref("");
const savedInteractSpotsKey = ref("");
const savedInteractKey = ref("");
const savedQueueKey = ref("");
const previousGridAssetId = ref<string | null>(null);
const isRestoring = ref(false);

const gridInteractSpots = ref<InteractSpot[]>([]);
const interactCapacity = ref(0);
const interactDurationMin = ref(1);
const interactDurationMax = ref(3);
const queueMaxMembers = ref(3);
const queueAdmissionDepth = ref(4);
const walkthrough = ref(false);
let syncingWalkthrough = false;

const gridCols = computed(() => gridTiles.value[0]?.length ?? 0);

const canvasTileSize = computed(() => store.state.layout.canvas.tileSize);

function gridKey(): string {
  return gridTiles.value.map((row) => row.join(",")).join("|") + "#" + JSON.stringify(gridEdges.value);
}

function interactSpotsKey(): string {
  return JSON.stringify(gridInteractSpots.value);
}

function interactKey(): string {
  return JSON.stringify({ capacity: interactCapacity.value, durationMin: interactDurationMin.value, durationMax: interactDurationMax.value });
}

function queueKey(): string {
  return JSON.stringify({ maxMembers: queueMaxMembers.value, admissionDepth: queueAdmissionDepth.value });
}

function checkGridDirty() {
  gridDirty.value = gridKey() !== savedGridKey.value || interactSpotsKey() !== savedInteractSpotsKey.value || interactKey() !== savedInteractKey.value || queueKey() !== savedQueueKey.value;
  if (gridDirty.value) scheduleAutoSave();
}

let autoSaveTimer: number | null = null;
const AUTO_SAVE_DELAY_MS = 300;

function scheduleAutoSave() {
  if (autoSaveTimer !== null) window.clearTimeout(autoSaveTimer);
  autoSaveTimer = window.setTimeout(() => {
    autoSaveTimer = null;
    void saveGrid();
  }, AUTO_SAVE_DELAY_MS);
}

function flushAutoSave() {
  if (autoSaveTimer !== null) {
    window.clearTimeout(autoSaveTimer);
    autoSaveTimer = null;
  }
}

const GRID_GAP = 1;
const DISPLAY_TILE_SIZE = 30;
const tilePx = computed(() => DISPLAY_TILE_SIZE);
const tilePreviewW = computed(() => gridCols.value * tilePx.value + (gridCols.value - 1) * GRID_GAP);
const tilePreviewH = computed(() => gridTiles.value.length * tilePx.value + (gridTiles.value.length - 1) * GRID_GAP);
const svgPreviewW = computed(() => {
  const a = gridAsset.value;
  if (!a || !a.svgViewBox || a.svgViewBox.w === 0 || a.svgViewBox.h === 0) return tilePreviewW.value;
  const scale = Math.min(tilePreviewW.value / a.svgViewBox.w, tilePreviewH.value / a.svgViewBox.h);
  return Math.round(a.svgViewBox.w * scale);
});
const svgPreviewH = computed(() => {
  const a = gridAsset.value;
  if (!a || !a.svgViewBox || a.svgViewBox.w === 0 || a.svgViewBox.h === 0) return tilePreviewH.value;
  const scale = Math.min(tilePreviewW.value / a.svgViewBox.w, tilePreviewH.value / a.svgViewBox.h);
  return Math.round(a.svgViewBox.h * scale);
});
const svgPreviewViewBox = computed(() => {
  const a = gridAsset.value;
  if (!a || !a.svgViewBox) return "";
  return `0 0 ${a.svgViewBox.w} ${a.svgViewBox.h}`;
});
const previewSvg = computed(() => gridAsset.value?.svg?.replace(/var\(--border-dim\)/g, "var(--text-dim)") ?? "");
const hasSvgPreview = computed(() => !!gridAsset.value?.svg);
const previewVars = computed(() => assetSvgVarStyle(gridAsset.value));

const previewSvgEl = ref<SVGSVGElement | null>(null);

function renderPreview() {
  const el = previewSvgEl.value;
  const svg = previewSvg.value;
  if (el && svg) renderSvgInto(el, svg);
}

watch(previewSvg, () => nextTick(renderPreview));
watch([showWalkableGridPanel, () => gridAsset.value?.id], ([visible]) => {
  if (visible) nextTick(renderPreview);
});

watch(showWalkableGridPanel, (visible) => {
  if (!visible) flushAutoSave();
});

watch(walkthrough, async (v) => {
  if (syncingWalkthrough || !gridAsset.value) return;
  try {
    await store.updateAsset(gridAsset.value.id, { walkable: v });
  } catch {
    walkthrough.value = !v;
  }
});

onMounted(renderPreview);

const assetSignature = computed(() => ({
  id: gridAsset.value?.id,
  w: gridAsset.value?.w,
  h: gridAsset.value?.h,
  tileStates: gridAsset.value?.tileStates,
  tileEdges: gridAsset.value?.tileEdges,
  interactSpots: gridAsset.value?.interactSpots,
  interact: gridAsset.value?.interact,
}));

watch(
  assetSignature,
  async (newSig, oldSig) => {
    if (isRestoring.value) {
      isRestoring.value = false;
      return;
    }

    const sameId = newSig.id === oldSig?.id;
    if (!sameId && gridDirty.value && previousGridAssetId.value) {
      flushAutoSave();
      const confirmed = await confirm({
        title: "Discard changes?",
        message: "You have unsaved walkable grid changes. Discard them?",
        confirmLabel: "Discard",
        cancelLabel: "Keep editing",
        danger: true,
      });
      if (!confirmed) {
        isRestoring.value = true;
        store.selectAsset(previousGridAssetId.value);
        return;
      }
    }

    if (gridAsset.value) {
      initGridTiles(gridAsset.value);
      gridInteractSpots.value = gridAsset.value.interactSpots ? gridAsset.value.interactSpots.map((p) => ({ ...p })) : [];
      const resolved = resolveInteractForTarget(gridAsset.value.interact, gridInteractSpots.value.length);
      interactCapacity.value = resolved.capacity;
      interactDurationMin.value = resolved.durationMinSeconds;
      interactDurationMax.value = resolved.durationMaxSeconds;
      queueMaxMembers.value = gridAsset.value.queue?.maxMembers ?? 3;
      queueAdmissionDepth.value = gridAsset.value.queue?.admissionDepth ?? 4;
      syncingWalkthrough = true;
      walkthrough.value = gridAsset.value.walkable ?? false;
      nextTick(() => {
        syncingWalkthrough = false;
      });
      savedGridKey.value = gridKey();
      savedInteractSpotsKey.value = interactSpotsKey();
      savedInteractKey.value = interactKey();
      savedQueueKey.value = queueKey();
      gridDirty.value = false;
      previousGridAssetId.value = gridAsset.value.id;
    } else {
      gridTiles.value = [];
      gridEdges.value = [];
      gridInteractSpots.value = [];
      savedGridKey.value = "";
      savedInteractSpotsKey.value = "";
      savedInteractKey.value = "";
      savedQueueKey.value = "";
      gridDirty.value = false;
      previousGridAssetId.value = null;
    }
  },
  { immediate: true },
);

function initGridTiles(a: AssetDef) {
  const rows = Math.max(1, a.h);
  const cols = Math.max(1, a.w);

  const states = a.tileStates;
  if (states && states.length === rows && states[0]?.length === cols) {
    gridTiles.value = states.map((row) => [...row]);
  } else {
    const grid = a.walkableGrid;
    if (grid && grid.length === rows && grid[0]?.length === cols) {
      gridTiles.value = grid.map((row) => row.map((cell) => (cell ? "walkable" : "blocked")));
    } else {
      const defaultStates: TileState[][] = [];
      for (let r = 0; r < rows; r++) {
        defaultStates[r] = [];
        for (let c = 0; c < cols; c++) defaultStates[r][c] = "walkable";
      }
      gridTiles.value = defaultStates;
    }
  }

  const edges = a.tileEdges;
  if (edges && edges.length === rows && edges[0]?.length === cols) {
    gridEdges.value = edges.map((row) => row.map((e) => (e ? { ...e } : e)));
  } else {
    const defaultEdges: TileEdges[][] = [];
    for (let r = 0; r < rows; r++) {
      defaultEdges[r] = [];
      for (let c = 0; c < cols; c++) defaultEdges[r][c] = {};
    }
    gridEdges.value = defaultEdges;
  }
}

function removeInteractSpotsOnTile(r: number, c: number) {
  const t = canvasTileSize.value;
  gridInteractSpots.value = gridInteractSpots.value.filter((interactSpot) => Math.floor(interactSpot.x / t) !== c || Math.floor(interactSpot.y / t) !== r);
}

function removeInteractSpotsOnBlockedTiles() {
  const t = canvasTileSize.value;
  gridInteractSpots.value = gridInteractSpots.value.filter((interactSpot) => gridTiles.value[Math.floor(interactSpot.y / t)]?.[Math.floor(interactSpot.x / t)] !== "blocked");
}

function paintTile(r: number, c: number, brush: TileState) {
  if (!gridTiles.value[r]) return;
  gridTiles.value[r][c] = brush;
  if (brush === "blocked") removeInteractSpotsOnTile(r, c);
  checkGridDirty();
}

function computeInteractSpotPx(r: number, c: number): [number, number] {
  const t = canvasTileSize.value;
  const x = (c + 0.5) * t;
  const y = (r + 0.5) * t;
  return [Math.round(x), Math.round(y)];
}

function interactSpotIndexAtPx(x: number, y: number): number {
  return gridInteractSpots.value.findIndex((interactSpot) => interactSpot.x === x && interactSpot.y === y);
}

function interactSpotsInTile(r: number, c: number): { x: number; y: number; i: number }[] {
  const t = canvasTileSize.value;
  const scale = tilePx.value / t;
  const rows = gridTiles.value.length;
  const cols = gridCols.value;
  const found: { x: number; y: number; i: number }[] = [];
  for (let i = 0; i < gridInteractSpots.value.length; i++) {
    const { x: ax, y: ay } = gridInteractSpots.value[i];
    let ac = Math.floor(ax / t);
    let ar = Math.floor(ay / t);
    if (ac >= cols) ac = cols - 1;
    if (ar >= rows) ar = rows - 1;
    if (ac === c && ar === r) {
      found.push({ x: (ax - c * t) * scale, y: (ay - r * t) * scale, i });
    }
  }
  return found;
}

function toggleInteractSpotAt(r: number, c: number) {
  if (gridTiles.value[r]?.[c] !== "walkable") {
    useToast().warning("Interactspots can only be placed on walkable tiles");
    return;
  }
  const [x, y] = computeInteractSpotPx(r, c);
  const idx = interactSpotIndexAtPx(x, y);
  if (idx >= 0) gridInteractSpots.value.splice(idx, 1);
  else gridInteractSpots.value.push({ x, y });
  checkGridDirty();
}

function clearAllInteractSpots() {
  gridInteractSpots.value = [];
  checkGridDirty();
}

function fillAllInteractSpots() {
  const spots: InteractSpot[] = [];
  for (let r = 0; r < gridTiles.value.length; r++) {
    for (let c = 0; c < gridTiles.value[r].length; c++) {
      if (gridTiles.value[r][c] === "walkable") {
        const [x, y] = computeInteractSpotPx(r, c);
        if (interactSpotIndexAtPx(x, y) < 0) spots.push({ x, y });
      }
    }
  }
  gridInteractSpots.value = spots;
  checkGridDirty();
}

function detectEdgeSide(e: MouseEvent): BorderSide | null {
  const target = e.currentTarget as HTMLElement | null;
  if (!target) return null;
  const rect = target.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const w = rect.width;
  const h = rect.height;
  const distances = [
    { side: "top" as BorderSide, d: y },
    { side: "right" as BorderSide, d: w - x },
    { side: "bottom" as BorderSide, d: h - y },
    { side: "left" as BorderSide, d: x },
  ];
  const nearest = distances.reduce((a, b) => (a.d < b.d ? a : b));
  if (nearest.d <= 7) return nearest.side;
  return null;
}

function toggleEdgeAt(r: number, c: number, side: BorderSide) {
  const e = gridEdges.value[r]?.[c];
  if (!e) return;
  e[side] = !e[side];
  checkGridDirty();
}

function onWalkTileDown(r: number, c: number) {
  isDraggingGrid.value = true;
  paintTile(r, c, walkBrush.value);
}

function onWalkTileEnter(r: number, c: number) {
  if (!isDraggingGrid.value) return;
  paintTile(r, c, walkBrush.value);
}

function onEntranceTileDown(r: number, c: number, e: MouseEvent) {
  const side = detectEdgeSide(e);
  if (entranceBrush.value === "border" && side) {
    toggleEdgeAt(r, c, side);
    return;
  }
  gridTiles.value[r][c] = "entrance";
  clearOuterWallsForTile(r, c);
  checkGridDirty();
}

function onInteractSpotTileDown(r: number, c: number) {
  toggleInteractSpotAt(r, c);
}

function onDragEnd() {
  isDraggingGrid.value = false;
}

function fillAllTiles(state: TileState) {
  for (const row of gridTiles.value) {
    for (let i = 0; i < row.length; i++) row[i] = state;
  }
  if (state === "blocked") removeInteractSpotsOnBlockedTiles();
  checkGridDirty();
}

function fillGridRow(r: number) {
  if (!gridTiles.value[r]) return;
  for (let i = 0; i < gridTiles.value[r].length; i++) gridTiles.value[r][i] = walkBrush.value;
  checkGridDirty();
}

function fillGridCol(c: number) {
  for (let r = 0; r < gridTiles.value.length; r++) {
    if (gridTiles.value[r]) gridTiles.value[r][c] = walkBrush.value;
  }
  checkGridDirty();
}

function clearOuterWallsForTile(r: number, c: number) {
  const e = gridEdges.value[r]?.[c];
  if (!e) return;
  const rows = gridEdges.value.length;
  const cols = gridEdges.value[0]?.length ?? 0;
  if (r === 0) e.top = false;
  if (r === rows - 1) e.bottom = false;
  if (c === 0) e.left = false;
  if (c === cols - 1) e.right = false;
}

function blockOuterSides() {
  if (gridEdges.value.length === 0) return;
  const rows = gridEdges.value.length;
  const cols = gridEdges.value[0]?.length ?? 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const e = gridEdges.value[r][c];
      if (!e) continue;
      const isEntrance = gridTiles.value[r]?.[c] === "entrance";
      if (r === 0) e.top = !isEntrance;
      if (r === rows - 1) e.bottom = !isEntrance;
      if (c === 0) e.left = !isEntrance;
      if (c === cols - 1) e.right = !isEntrance;
    }
  }
  checkGridDirty();
}

function clearAllEdges() {
  for (const row of gridEdges.value) {
    for (const e of row) {
      if (e) {
        e.top = false;
        e.right = false;
        e.bottom = false;
        e.left = false;
      }
    }
  }
  checkGridDirty();
}

function clearAllDoors() {
  for (const row of gridTiles.value) {
    for (let i = 0; i < row.length; i++) {
      if (row[i] === "entrance") row[i] = "walkable";
    }
  }
  checkGridDirty();
}

function walkTileBg(state: TileState): string {
  if (state === "blocked") return "color-mix(in srgb, var(--accent-red) 18%, transparent)";
  return "color-mix(in srgb, var(--accent-green) 14%, transparent)";
}
function walkTileBorder(state: TileState): string {
  if (state === "blocked") return "1px solid var(--accent-red)";
  return "1px solid var(--accent-green)";
}
function walkTileIcon(state: TileState): string {
  return state === "blocked" ? "x" : "";
}

function entranceTileBg(state: TileState): string {
  if (state === "entrance") return "color-mix(in srgb, var(--accent-blue) 22%, transparent)";
  if (state === "blocked") return "color-mix(in srgb, var(--bg-primary) 60%, transparent)";
  return "color-mix(in srgb, var(--bg-primary) 80%, transparent)";
}
function entranceTileBorder(state: TileState): string {
  if (state === "entrance") return "1px solid var(--accent-blue)";
  return "1px solid var(--border-dim)";
}
function entranceTileIcon(state: TileState): string {
  return state === "entrance" ? "->" : "";
}

function interactSpotTileBg(state: TileState): string {
  if (state === "blocked") return "color-mix(in srgb, var(--accent-red) 10%, transparent)";
  return "color-mix(in srgb, var(--accent-green) 8%, transparent)";
}
function interactSpotTileBorder(state: TileState): string {
  if (state === "blocked") return "1px solid var(--accent-red)";
  return "1px solid var(--border-dim)";
}
function interactSpotTileIcon(_state: TileState): string {
  return "";
}

type GridOverlay = "none" | "edges" | "interactspots";

interface GridConfig {
  key: string;
  label: string;
  tools: { label: string; active: boolean; onClick: () => void }[];
  tileBg: (s: TileState) => string;
  tileBorder: (s: TileState) => string;
  tileIcon: (s: TileState) => string;
  onTileDown: (r: number, c: number, e: MouseEvent) => void;
  onTileEnter?: (r: number, c: number) => void;
  actions: { label: string; onClick: () => void; disabled?: boolean; active?: boolean }[];
  overlay: GridOverlay;
  showColFill: boolean;
  disabled?: boolean;
}

type GridTab = "walk" | "entrance" | "interactspots";

const gridConfigs = computed<GridConfig[]>(() => [
  {
    key: "walk",
    label: "Walkable",
    tools: [
      { label: "Walk", active: walkBrush.value === "walkable", onClick: () => (walkBrush.value = "walkable") },
      { label: "Block", active: walkBrush.value === "blocked", onClick: () => (walkBrush.value = "blocked") },
    ],
    tileBg: walkTileBg,
    tileBorder: walkTileBorder,
    tileIcon: walkTileIcon,
    onTileDown: (r, c) => onWalkTileDown(r, c),
    onTileEnter: (r, c) => onWalkTileEnter(r, c),
    actions: [
      { label: "All Walk", onClick: () => fillAllTiles("walkable") },
      { label: "All Block", onClick: () => fillAllTiles("blocked") },
    ],
    overlay: "none",
    showColFill: true,
  },
  {
    key: "entrance",
    label: "Doors & Edges",
    disabled: walkthrough.value,
    tools: [
      { label: "Door", active: entranceBrush.value === "door", onClick: () => (entranceBrush.value = "door") },
      { label: "Edge", active: entranceBrush.value === "border", onClick: () => (entranceBrush.value = "border") },
    ],
    tileBg: entranceTileBg,
    tileBorder: entranceTileBorder,
    tileIcon: entranceTileIcon,
    onTileDown: (r, c, e) => onEntranceTileDown(r, c, e),
    actions: [
      { label: "Outer Walls", onClick: blockOuterSides },
      { label: "Clear Doors", onClick: clearAllDoors },
      { label: "Clear Edges", onClick: clearAllEdges },
    ],
    overlay: "edges",
    showColFill: false,
  },
  {
    key: "interactspots",
    label: `Interact Spots - ${gridInteractSpots.value.length}`,
    tools: [],
    tileBg: interactSpotTileBg,
    tileBorder: interactSpotTileBorder,
    tileIcon: interactSpotTileIcon,
    onTileDown: (r, c) => onInteractSpotTileDown(r, c),
    actions: [
      { label: "Fill All Walkable", onClick: fillAllInteractSpots },
      { label: "Clear All", onClick: clearAllInteractSpots, disabled: gridInteractSpots.value.length === 0 },
    ],
    overlay: "interactspots",
    showColFill: false,
  },
]);

const activeGridTab = ref<GridTab>("walk");
const activeGridConfig = computed(() => gridConfigs.value.find((config) => config.key === activeGridTab.value) ?? gridConfigs.value[0]);

async function saveGrid() {
  const a = gridAsset.value;
  if (!a) return;
  const states = gridTiles.value.map((row) => [...row]);
  const grid = states.map((row) => row.map((t) => t === "walkable" || t === "entrance"));
  const edges = gridEdges.value.map((row) => row.map((e) => (e ? { ...e } : e)));
  const interactSpots = gridInteractSpots.value.map((p) => ({ ...p }));
  const interact = normalizeInteractConfig({
    capacity: interactCapacity.value,
    durationMin: interactDurationMin.value,
    durationMax: interactDurationMax.value,
  });
  const queue = normalizeNpcQueueConfig({
    maxMembers: queueMaxMembers.value,
    admissionDepth: queueAdmissionDepth.value,
  });
  await store.updateAsset(a.id, { walkable: walkthrough.value, walkableGrid: grid, tileStates: states, tileEdges: edges, interactSpots, interact, queue });
  savedGridKey.value = gridKey();
  savedInteractSpotsKey.value = interactSpotsKey();
  savedInteractKey.value = interactKey();
  savedQueueKey.value = queueKey();
  gridDirty.value = false;
  useToast().success("Walkable grid saved");
}

onBeforeUnmount(() => {
  flushAutoSave();
});
</script>

<template>
  <ModalShell :open="!!gridAsset && showWalkableGridPanel" :title="`Walkable Grid - ${gridAsset?.name ?? ''}`" max-width="1000px" width="min(94vw, 1000px)" max-height="calc(100vh - 32px)" @close="closeWalkableGridPanel">
    <div class="modal__body" :style="{ '--tile-size': tilePx + 'px' }" @mouseup="onDragEnd" @mouseleave="onDragEnd" @wheel.stop>
      <div class="form__row form__row--between">
        <span class="form__hint">{{ gridAsset?.name ?? '' }} - {{ gridCols }}x{{ gridTiles.length }} tiles</span>
        <div class="walkablegrid__walkthrough">
          <label>Passable</label>
          <button :class="{ 'flag--success': walkthrough, 'flag--danger': !walkthrough }" @click="walkthrough = !walkthrough" :title="walkthrough ? 'NPCs can walk through this object' : 'NPCs cannot walk through this object (solid wall)'">
            {{ walkthrough ? "ON" : "OFF" }}
          </button>
        </div>
      </div>
      <div class="walkablegrid__layout">
        <!-- Top-Left: Real Visual -->
        <div class="walkablegrid__layer">
          <div class="walkablegrid__label">Real Visual</div>
          <div class="walkablegrid__grid walkablegrid__visual">
            <div class="walkablegrid__preview card card--active" :style="{ width: `${tilePreviewW}px`, height: `${tilePreviewH}px` }">
              <svg v-if="hasSvgPreview" ref="previewSvgEl" :viewBox="svgPreviewViewBox" :width="svgPreviewW" :height="svgPreviewH" preserveAspectRatio="xMidYMid meet" class="walkablegrid__fill" :style="previewVars"></svg>
              <div v-else class="walkablegrid__fill walkablegrid__shape"></div>
            </div>
          </div>
        </div>

        <div class="walkablegrid__editor">
          <div class="walkablegrid__tabs" role="tablist" aria-label="Walkable grid layers">
            <button v-for="g in gridConfigs" :key="g.key" type="button" class="walkablegrid__tab" :class="{ 'walkablegrid__tab--active': activeGridTab === g.key }" role="tab" :aria-selected="activeGridTab === g.key" :disabled="g.disabled" :title="g.disabled ? 'Ignored while Passable is ON - NPCs walk through the whole object' : undefined" @click="activeGridTab = g.key as GridTab">{{ g.label }}</button>
          </div>
          <div v-if="activeGridConfig?.disabled" class="form__hint">
            Doors & Edges are ignored while Passable is ON - turn it OFF to edit walls and doors.
          </div>
          <div class="walkablegrid__legend">
            <span class="walkablegrid__legenditem"><span class="walkablegrid__dot" :style="{ background: 'color-mix(in srgb, var(--accent-green) 30%, transparent)', border: '1px solid var(--accent-green)' }"></span>Walkable</span>
            <span class="walkablegrid__legenditem"><span class="walkablegrid__dot" :style="{ background: 'color-mix(in srgb, var(--accent-red) 30%, transparent)', border: '1px solid var(--accent-red)' }"></span>Blocked</span>
            <span class="walkablegrid__legenditem"><span class="walkablegrid__dot" :style="{ background: 'color-mix(in srgb, var(--accent-blue) 30%, transparent)', border: '1px solid var(--accent-blue)' }"></span>Entrance</span>
            <span class="walkablegrid__legenditem"><span class="walkablegrid__dot walkablegrid__dot--edge"></span>Wall edge</span>
          </div>
          <div v-if="activeGridConfig?.key === 'interactspots'" class="form__row form__row--wrap form__row--border">
            <label class="form__row form__row--tight">Capacity <input v-model.number="interactCapacity" type="number" min="0" :placeholder="String(gridInteractSpots.length)" @input="checkGridDirty" /></label>
            <label class="form__row form__row--tight">Min <input v-model.number="interactDurationMin" type="number" min="0" step="0.1" @input="checkGridDirty" /></label>
            <label class="form__row form__row--tight">Max <input v-model.number="interactDurationMax" type="number" min="0" step="0.1" @input="checkGridDirty" /></label>
            <label class="form__row form__row--tight">Queue <input v-model.number="queueMaxMembers" type="number" min="1" max="100" @input="checkGridDirty" /></label>
            <label class="form__row form__row--tight">Admit <input v-model.number="queueAdmissionDepth" type="number" min="1" max="20" @input="checkGridDirty" /></label>
            <span class="form__hint">Capacity 0 = one NPC per interactspot. Duration is random between Min and Max seconds.</span>
          </div>
          <div v-if="activeGridConfig" class="walkablegrid__layer">
            <div class="walkablegrid__label">
              <span>{{ activeGridConfig.label }}</span>
            </div>
            <div class="walkablegrid__grid" :style="{ '--cols': gridCols }">
              <span v-for="c in gridCols" :key="'col' + c" class="walkablegrid__col" :title="activeGridConfig.showColFill ? 'Fill column ' + c : undefined" @click="activeGridConfig.showColFill && fillGridCol(c - 1)">{{ c }}</span>
              <template v-for="(row, r) in gridTiles" :key="'row' + r">
                <span class="walkablegrid__row" :title="activeGridConfig.showColFill ? 'Fill row ' + (r + 1) : undefined" @click="activeGridConfig.showColFill && fillGridRow(r)">{{ r + 1 }}</span>
                <button
                  v-for="(state, c) in row"
                  :key="'tile' + r + '-' + c"
                  type="button"
                  class="walkablegrid__tile"
                  :style="{ background: activeGridConfig.tileBg(state), border: activeGridConfig.tileBorder(state) }"
                  :aria-label="activeGridConfig.key + ' grid ' + state + ' tile, row ' + (r + 1) + ' column ' + (c + 1)"
                  @mousedown.prevent="activeGridConfig.onTileDown(r, c, $event)"
                  @mouseenter="activeGridConfig.onTileEnter?.(r, c)"
                >
                  {{ activeGridConfig.tileIcon(state) }}<span v-if="activeGridConfig.overlay === 'edges' && gridEdges[r]?.[c]?.top" class="walkablegrid__mark walkablegrid__edge--top"></span><span v-if="activeGridConfig.overlay === 'edges' && gridEdges[r]?.[c]?.right" class="walkablegrid__mark walkablegrid__edge--right"></span
                  ><span v-if="activeGridConfig.overlay === 'edges' && gridEdges[r]?.[c]?.bottom" class="walkablegrid__mark walkablegrid__edge--bottom"></span><span v-if="activeGridConfig.overlay === 'edges' && gridEdges[r]?.[c]?.left" class="walkablegrid__mark walkablegrid__edge--left"></span
                  ><span v-for="a in activeGridConfig.overlay === 'interactspots' ? interactSpotsInTile(r, c) : []" :key="'interactspot_' + a.i" class="walkablegrid__mark walkablegrid__spot" :title="'NPC interactspot IS' + (a.i + 1) + ' (' + gridInteractSpots[a.i].x + ', ' + gridInteractSpots[a.i].y + ')'"></span>
                </button>
              </template>
            </div>
            <div class="walkablegrid__tools">
              <button v-for="t in activeGridConfig.tools" :key="t.label" type="button" :class="{ 'flag--active': t.active }" @click="t.onClick">{{ t.label }}</button>
              <button v-for="a in activeGridConfig.actions" :key="a.label" :disabled="a.disabled" @click="a.onClick">{{ a.label }}</button>
            </div>
          </div>
        </div>
      </div>

      <div class="form__row form__row--between form__row--border">
        <span class="form__hint">{{ gridDirty ? "Unsaved changes - auto-saving..." : "All changes saved" }}</span>
        <span class="form__hint">Edits save automatically</span>
      </div>
    </div>
  </ModalShell>
</template>

<style scoped>
.walkablegrid__layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--gap-sm);
  align-items: stretch;
}

.walkablegrid__layout > .walkablegrid__layer,
.walkablegrid__editor {
  border: 1px solid var(--border-dim);
  padding: var(--gap-sm);
}

.walkablegrid__editor {
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
  min-width: 0;
}

.walkablegrid__tabs {
  display: flex;
  gap: var(--gap-xs);
  border-bottom: 1px solid var(--border-dim);
  padding-bottom: var(--gap-sm);
}

.walkablegrid__tab {
  flex: 1;
  min-width: 0;
  padding: var(--gap-md) var(--gap-sm);
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-dim);
  font-size: var(--font-xs);
  white-space: nowrap;
}

.walkablegrid__tab:hover {
  color: var(--text-primary);
  background: var(--bg-primary);
}

.watchablegrid__tab--active {
  border-color: var(--accent-green);
  color: var(--accent-green);
  background: color-mix(in srgb, var(--accent-green) 10%, transparent);
}

.walkablegrid__tab:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.walkablegrid__layer {
  display: flex;
  flex-direction: column;
  gap: var(--gap-md);
  user-select: none;
  align-items: stretch;
}

.walkablegrid__label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--gap-sm);
  font-size: var(--font-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: var(--text-dim);
}

.walkablegrid__grid {
  display: grid;
  grid-template-columns: 1fr repeat(var(--cols, 1), 1fr);
  place-content: center;
  gap: 0;
  flex: 1;
  flex-shrink: 0;
  width: fit-content;
  margin: auto;
}

.walkablegrid__grid::before {
  content: "";
  width: var(--tile-size, 40px);
  height: var(--tile-size, 40px);
}

.walkablegrid__visual {
  display: flex;
  align-items: center;
  justify-content: center;
}
.walkablegrid__visual::before {
  content: none;
}

.walkablegrid__tools {
  display: flex;
  gap: var(--gap-xs);
  flex-wrap: wrap;
}

.walkablegrid__legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-sm);
  font-size: var(--font-xs);
  color: var(--text-secondary);
}

.walkablegrid__legenditem {
  display: inline-flex;
  align-items: center;
  gap: var(--gap-xxs);
}

.walkablegrid__dot {
  width: 12px;
  height: 12px;
  border-radius: var(--radius-sm);
}

.walkablegrid__dot--edge {
  background: linear-gradient(to top, var(--accent-gold) 0 3px, transparent 3px);
}

.walkablegrid__preview {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  box-sizing: border-box;
}

.walkablegrid__fill {
  position: absolute;
  left: 0;
  top: 0;
}

.walkablegrid__shape {
  border: 1px solid var(--text-dim);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--bg-primary) 50%, transparent);
}

.walkablegrid__walkthrough {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  font-size: var(--font-sm);
}

.walkablegrid__col,
.walkablegrid__row,
.walkablegrid__tile {
  width: var(--tile-size, 40px);
  height: var(--tile-size, 40px);
}

.walkablegrid__col,
.walkablegrid__row {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-xs);
  opacity: 0.7;
  cursor: pointer;
}

.walkablegrid__tile {
  position: relative;
  display: grid;
  place-content: center;
  place-items: center;
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  padding: 0;
  font-size: var(--font-xs);
}

.walkablegrid__tile:hover,
.walkablegrid__tile:active {
  border-color: inherit;
  color: inherit;
  background: inherit;
}

.walkablegrid__mark {
  position: absolute;
  pointer-events: none;
}

.walkablegrid__edge--top,
.walkablegrid__edge--right,
.walkablegrid__edge--bottom,
.walkablegrid__edge--left {
  background: var(--accent-gold);
}

.walkablegrid__edge--top {
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
}

.walkablegrid__edge--right {
  top: 0;
  right: 0;
  bottom: 0;
  width: 2px;
}

.walkablegrid__edge--bottom {
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
}

.walkablegrid__edge--left {
  top: 0;
  left: 0;
  bottom: 0;
  width: 2px;
}

.walkablegrid__spot {
  position: absolute;
  inset: 0;
  margin: auto;
  width: calc(var(--tile-size, 32px) * 0.5);
  height: calc(var(--tile-size, 32px) * 0.5);
  border-radius: 50%;
  background: var(--accent-blue);
  outline: 1px solid var(--text-bright);
  z-index: var(--z-layer-1, 1);
}
@media (max-width: 720px) {
  .walkablegrid__layout {
    grid-template-columns: 1fr;
  }
}
</style>
