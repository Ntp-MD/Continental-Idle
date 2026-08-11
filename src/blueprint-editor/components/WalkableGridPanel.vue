<script setup lang="ts">
import { ref, watch, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useAssetsStore } from "../blueprintStore";
import { useToast } from "@/composables/useToast";
import { useConfirm } from "@/composables/useConfirm";
import { useWalkableGridPanel } from "../composables/useWalkableGridPanel";
import { renderSvgInto } from "../svgSanitizer";
import type { AssetDef, TileState, TileEdges, InteractSpot } from "../types";
import { normalizeInteractConfig, resolveInteractForTarget } from "../types";

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
const savedAnchorKey = ref("");
const savedInteractKey = ref("");
const previousGridAssetId = ref<string | null>(null);
const isRestoring = ref(false);

const gridAnchors = ref<InteractSpot[]>([]);
const interactCapacity = ref(0);
const interactDurationMin = ref(1);
const interactDurationMax = ref(3);

const gridCols = computed(() => gridTiles.value[0]?.length ?? 0);

const canvasTileSize = computed(() => store.state.layout.canvas.tileSize);

function gridKey(): string {
  return gridTiles.value.map((row) => row.join(",")).join("|") + "#" + JSON.stringify(gridEdges.value);
}

function anchorKey(): string {
  return JSON.stringify(gridAnchors.value);
}

function interactKey(): string {
  return JSON.stringify({ capacity: interactCapacity.value, durationMin: interactDurationMin.value, durationMax: interactDurationMax.value });
}

function checkGridDirty() {
  gridDirty.value = gridKey() !== savedGridKey.value || anchorKey() !== savedAnchorKey.value || interactKey() !== savedInteractKey.value;
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
const DISPLAY_TILE_SIZE = 40;
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
      gridAnchors.value = gridAsset.value.interactSpots ? gridAsset.value.interactSpots.map((p) => ({ ...p })) : [];
      const resolved = resolveInteractForTarget(gridAsset.value.interact, gridAnchors.value.length);
      interactCapacity.value = resolved.capacity;
      interactDurationMin.value = resolved.durationMinSeconds;
      interactDurationMax.value = resolved.durationMaxSeconds;
      savedGridKey.value = gridKey();
      savedAnchorKey.value = anchorKey();
      savedInteractKey.value = interactKey();
      gridDirty.value = false;
      previousGridAssetId.value = gridAsset.value.id;
    } else {
      gridTiles.value = [];
      gridEdges.value = [];
      gridAnchors.value = [];
      savedGridKey.value = "";
      savedAnchorKey.value = "";
      savedInteractKey.value = "";
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

function removeAnchorsOnTile(r: number, c: number) {
  const t = canvasTileSize.value;
  gridAnchors.value = gridAnchors.value.filter((anchor) => Math.floor(anchor.x / t) !== c || Math.floor(anchor.y / t) !== r);
}

function removeAnchorsOnBlockedTiles() {
  const t = canvasTileSize.value;
  gridAnchors.value = gridAnchors.value.filter((anchor) => gridTiles.value[Math.floor(anchor.y / t)]?.[Math.floor(anchor.x / t)] !== "blocked");
}

function paintTile(r: number, c: number, brush: TileState) {
  if (!gridTiles.value[r]) return;
  gridTiles.value[r][c] = brush;
  if (brush === "blocked") removeAnchorsOnTile(r, c);
  checkGridDirty();
}

function computeAnchorPx(r: number, c: number): [number, number] {
  const t = canvasTileSize.value;
  const x = (c + 0.5) * t;
  const y = (r + 0.5) * t;
  return [Math.round(x), Math.round(y)];
}

function anchorIndexAtPx(x: number, y: number): number {
  return gridAnchors.value.findIndex((anchor) => anchor.x === x && anchor.y === y);
}

function anchorsInTile(r: number, c: number): { x: number; y: number; i: number }[] {
  const t = canvasTileSize.value;
  const scale = tilePx.value / t;
  const rows = gridTiles.value.length;
  const cols = gridCols.value;
  const found: { x: number; y: number; i: number }[] = [];
  for (let i = 0; i < gridAnchors.value.length; i++) {
    const { x: ax, y: ay } = gridAnchors.value[i];
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

function toggleAnchorAt(r: number, c: number) {
  if (gridTiles.value[r]?.[c] !== "walkable") {
    useToast().warning("Anchors can only be placed on walkable tiles");
    return;
  }
  const [x, y] = computeAnchorPx(r, c);
  const idx = anchorIndexAtPx(x, y);
  if (idx >= 0) gridAnchors.value.splice(idx, 1);
  else gridAnchors.value.push({ x, y });
  checkGridDirty();
}

function clearAllAnchors() {
  gridAnchors.value = [];
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

function onAnchorTileDown(r: number, c: number) {
  toggleAnchorAt(r, c);
}

function onDragEnd() {
  isDraggingGrid.value = false;
}

function fillAllTiles(state: TileState) {
  for (const row of gridTiles.value) {
    for (let i = 0; i < row.length; i++) row[i] = state;
  }
  if (state === "blocked") removeAnchorsOnBlockedTiles();
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
  return state === "blocked" ? "✕" : "✓";
}

function entranceTileBg(state: TileState): string {
  if (state === "entrance") return "color-mix(in srgb, var(--accent-gold) 22%, transparent)";
  if (state === "blocked") return "color-mix(in srgb, var(--bg-card) 60%, transparent)";
  return "color-mix(in srgb, var(--bg-card) 80%, transparent)";
}
function entranceTileBorder(state: TileState): string {
  if (state === "entrance") return "1px solid var(--accent-gold)";
  return "1px solid var(--border-dim)";
}
function entranceTileIcon(state: TileState): string {
  return state === "entrance" ? "→" : "";
}

function anchorTileBg(state: TileState): string {
  if (state === "blocked") return "color-mix(in srgb, var(--accent-red) 10%, transparent)";
  return "color-mix(in srgb, var(--accent-green) 8%, transparent)";
}
function anchorTileBorder(state: TileState): string {
  if (state === "blocked") return "1px solid var(--accent-red)";
  return "1px solid var(--border-dim)";
}
function anchorTileIcon(_state: TileState): string {
  return "";
}

type GridOverlay = "none" | "edges" | "anchors";

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
}

const gridConfigs = computed<GridConfig[]>(() => [
  {
    key: "walk",
    label: "Walk / Block",
    tools: [
      { label: "✓ Walk", active: walkBrush.value === "walkable", onClick: () => (walkBrush.value = "walkable") },
      { label: "✕ Block", active: walkBrush.value === "blocked", onClick: () => (walkBrush.value = "blocked") },
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
    label: "Entrance / Wall",
    tools: [
      { label: "→ Door", active: entranceBrush.value === "door", onClick: () => (entranceBrush.value = "door") },
      { label: "▢ Wall", active: entranceBrush.value === "border", onClick: () => (entranceBrush.value = "border") },
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
    key: "anchor",
    label: `Anchor · ${gridAnchors.value.length} anchor(s)`,
    tools: [],
    tileBg: anchorTileBg,
    tileBorder: anchorTileBorder,
    tileIcon: anchorTileIcon,
    onTileDown: (r, c) => onAnchorTileDown(r, c),
    actions: [{ label: "Clear", onClick: clearAllAnchors, disabled: gridAnchors.value.length === 0 }],
    overlay: "anchors",
    showColFill: false,
  },
]);

async function saveGrid() {
  const a = gridAsset.value;
  if (!a) return;
  const states = gridTiles.value.map((row) => [...row]);
  const grid = states.map((row) => row.map((t) => t === "walkable" || t === "entrance"));
  const edges = gridEdges.value.map((row) => row.map((e) => (e ? { ...e } : e)));
  const interactSpots = gridAnchors.value.map((p) => ({ ...p }));
  const interact = normalizeInteractConfig({
    capacity: interactCapacity.value,
    durationMin: interactDurationMin.value,
    durationMax: interactDurationMax.value,
  });
  await store.updateAsset(a.id, { walkableGrid: grid, tileStates: states, tileEdges: edges, interactSpots, interact });
  savedGridKey.value = gridKey();
  savedAnchorKey.value = anchorKey();
  savedInteractKey.value = interactKey();
  gridDirty.value = false;
  useToast().success("Walkable grid saved");
}

const pos = ref({ x: 120, y: 120 });
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0, panelX: 0, panelY: 0 });

function onHeaderMouseDown(e: MouseEvent) {
  if ((e.target as HTMLElement).closest(".walkablegrid__button")) return;
  isDragging.value = true;
  dragStart.value = { x: e.clientX, y: e.clientY, panelX: pos.value.x, panelY: pos.value.y };
  window.addEventListener("mousemove", onWindowMouseMove);
  window.addEventListener("mouseup", onWindowMouseUp);
}

function onWindowMouseMove(e: MouseEvent) {
  if (!isDragging.value) return;
  const maxX = window.innerWidth - 100;
  const maxY = window.innerHeight - 40;
  pos.value = {
    x: Math.max(0, Math.min(dragStart.value.panelX + e.clientX - dragStart.value.x, maxX)),
    y: Math.max(0, Math.min(dragStart.value.panelY + e.clientY - dragStart.value.y, maxY)),
  };
}

function onWindowMouseUp() {
  isDragging.value = false;
  window.removeEventListener("mousemove", onWindowMouseMove);
  window.removeEventListener("mouseup", onWindowMouseUp);
}

onBeforeUnmount(() => {
  flushAutoSave();
  window.removeEventListener("mousemove", onWindowMouseMove);
  window.removeEventListener("mouseup", onWindowMouseUp);
});
</script>

<template>
  <div v-if="gridAsset && showWalkableGridPanel" class="walkablegrid__panel" :style="{ left: `${pos.x}px`, top: `${pos.y}px` }" @mousedown.stop @wheel.stop>
    <div class="walkablegrid__header-button" @mousedown="onHeaderMouseDown">
      <span>Walkable Grid — {{ gridAsset.name }}</span>
      <span class="walkablegrid__dim-label">{{ gridCols }}×{{ gridTiles.length }}</span>
      <div class="walkablegrid__interact" @mousedown.stop>
        <label>Cap <input v-model.number="interactCapacity" type="number" min="0" :placeholder="String(gridAnchors.length)" @input="checkGridDirty" /></label>
        <label>Min <input v-model.number="interactDurationMin" type="number" min="0" step="0.1" @input="checkGridDirty" /></label>
        <label>Max <input v-model.number="interactDurationMax" type="number" min="0" step="0.1" @input="checkGridDirty" /></label>
      </div>
      <button class="walkablegrid__button" @click.stop="closeWalkableGridPanel" title="Close" aria-label="Close walkable grid editor">×</button>
    </div>

    <div class="walkablegrid__body-vstack" :style="{ '--tile-size': tilePx + 'px' }" @mouseup="onDragEnd" @mouseleave="onDragEnd">
      <div class="walkablegrid__grid2x2">
        <!-- Top-Left: Real Visual -->
        <div class="walkablegrid__layer">
          <div class="walkablegrid__layer-label">Real Visual</div>
          <div class="walkablegrid__layer-grid walkablegrid__layer-visual">
            <div class="walkablegrid__preview-centered card card--primary" :style="{ width: `${tilePreviewW}px`, height: `${tilePreviewH}px` }">
              <svg v-if="hasSvgPreview" ref="previewSvgEl" :viewBox="svgPreviewViewBox" :width="svgPreviewW" :height="svgPreviewH" preserveAspectRatio="xMidYMid meet" class="walkablegrid__float"></svg>
              <div v-else class="walkablegrid__float walkablegrid__preview-shape"></div>
            </div>
          </div>
        </div>

        <!-- 3 Grid Layers: Walk, Entrance, Anchor -->
        <div v-for="g in gridConfigs" :key="g.key" class="walkablegrid__layer">
          <div class="walkablegrid__layer-label">
            <span>{{ g.label }}</span>
            <div v-if="g.tools.length" class="walkablegrid__layer-tools">
              <button v-for="t in g.tools" :key="t.label" type="button" :class="{ 'btn--active': t.active }" @click="t.onClick">{{ t.label }}</button>
            </div>
          </div>
          <div class="walkablegrid__layer-grid" :style="{ '--cols': gridCols }">
            <span v-for="c in gridCols" :key="'col' + c" class="walkablegrid__col-centered" :title="g.showColFill ? 'Fill column ' + c : undefined" @click="g.showColFill && fillGridCol(c - 1)">{{ c }}</span>
            <template v-for="(row, r) in gridTiles" :key="'row' + r">
              <span class="walkablegrid__row-centered" :title="g.showColFill ? 'Fill row ' + (r + 1) : undefined" @click="g.showColFill && fillGridRow(r)">{{ r + 1 }}</span>
              <button v-for="(state, c) in row" :key="'tile' + r + '-' + c" type="button" class="walkablegrid__tile" :style="{ background: g.tileBg(state), border: g.tileBorder(state) }" :aria-label="g.key + ' grid ' + state + ' tile, row ' + (r + 1) + ' column ' + (c + 1)" @mousedown.prevent="g.onTileDown(r, c, $event)" @mouseenter="g.onTileEnter?.(r, c)">
                {{ g.tileIcon(state) }}<span v-if="g.overlay === 'edges' && gridEdges[r]?.[c]?.top" class="walkablegrid__tile-overlay walkablegrid__edge--top"></span><span v-if="g.overlay === 'edges' && gridEdges[r]?.[c]?.right" class="walkablegrid__tile-overlay walkablegrid__edge--right"></span
                ><span v-if="g.overlay === 'edges' && gridEdges[r]?.[c]?.bottom" class="walkablegrid__tile-overlay walkablegrid__edge--bottom"></span><span v-if="g.overlay === 'edges' && gridEdges[r]?.[c]?.left" class="walkablegrid__tile-overlay walkablegrid__edge--left"></span
                ><span v-for="a in g.overlay === 'anchors' ? anchorsInTile(r, c) : []" :key="'anchor_' + a.i" class="walkablegrid__tile-overlay walkablegrid__anchor" :title="'NPC anchor A' + (a.i + 1) + ' (' + gridAnchors[a.i].x + ', ' + gridAnchors[a.i].y + ')'">◉</span>
              </button>
            </template>
          </div>
          <div class="walkablegrid__layer-actions">
            <button v-for="a in g.actions" :key="a.label" :disabled="a.disabled" @click="a.onClick">{{ a.label }}</button>
          </div>
        </div>
      </div>

      <div class="walkablegrid__actions">
        <span class="walkablegrid__dim-label">0 capacity = number of anchors · duration is random in seconds</span>
        <button class="btn--success" :class="{ 'btn--dirty': gridDirty }" @click="saveGrid" aria-label="Save grid">Save Grid{{ gridDirty ? " *" : "" }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.walkablegrid__panel {
  position: absolute;
  z-index: var(--z-editor-panel);
  width: max-content;
  min-width: 360px;
  max-width: calc(100vw - 32px);
  background: var(--bg-secondary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-md);
  box-shadow: 0 12px 32px color-mix(in srgb, var(--bg-primary) 50%, transparent);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  user-select: none;
}

.walkablegrid__header-button {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: var(--gap-sm);
  padding: var(--gap-sm) var(--gap-md);
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-dim);
  cursor: grab;
  font-size: var(--font-sm);
  font-weight: 700;
  color: var(--accent-gold);
  user-select: none;
  flex-wrap: wrap;
}

.walkablegrid__header-button .walkablegrid__interact {
  font-weight: 400;
  color: var(--text-primary);
  cursor: default;
}

.walkablegrid__button {
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: var(--font-md);
  line-height: 1;
  padding: 0 var(--gap-xs);
  cursor: pointer;
  transition: color var(--duration-fast) ease-out;
  margin-left: auto;
}

.walkablegrid__button:hover {
  color: var(--accent-red);
}

.walkablegrid__dim-label {
  font-size: var(--font-xs);
  opacity: 0.7;
  text-align: center;
  min-height: calc(var(--font-xs) * 2.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

.walkablegrid__interact {
  display: flex;
  align-items: center;
  gap: var(--gap-sm);
  flex-wrap: wrap;
}

.walkablegrid__interact label {
  display: inline-flex;
  align-items: center;
  gap: var(--gap-xs);
}

.walkablegrid__interact input {
  width: 72px;
}

.walkablegrid__body-vstack {
  flex: 1;
  overflow: auto;
  padding: var(--gap-md);
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
}

.walkablegrid__grid2x2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
}

.walkablegrid__grid2x2 .walkablegrid__layer {
  border: 1px solid var(--border-dim);
  padding: var(--gap-sm);
  margin: -1px 0 0 -1px;
}

.walkablegrid__layer {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
  user-select: none;
  align-items: stretch;
  min-height: 250px;
}

.walkablegrid__layer-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--gap-sm);
  font-size: var(--font-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-dim);
  min-height: 28px;
}

.walkablegrid__layer-tools {
  display: flex;
  gap: var(--gap-xs);
}

.walkablegrid__layer-grid {
  display: grid;
  grid-template-columns: var(--tile-size, 40px) repeat(var(--cols, 1), var(--tile-size, 40px));
  place-content: center;
  gap: 0;
  flex: 1;
  flex-shrink: 0;
}

.walkablegrid__layer-grid::before {
  content: "";
  width: var(--tile-size, 40px);
  height: var(--tile-size, 40px);
}

.walkablegrid__layer-visual {
  display: flex;
  align-items: center;
  justify-content: center;
}
.walkablegrid__layer-visual::before {
  content: none;
}

.walkablegrid__layer-actions {
  display: flex;
  gap: var(--gap-xs);
  flex-wrap: wrap;
}

.walkablegrid__preview-centered {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  box-sizing: border-box;
}

.walkablegrid__float {
  position: absolute;
  left: 0;
  top: 0;
}

.walkablegrid__preview-shape {
  border: 1px solid var(--text-dim);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--bg-card) 50%, transparent);
}

.walkablegrid__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--gap-sm);
  padding-top: var(--gap-sm);
  border-top: 1px solid var(--border-dim);
}

.walkablegrid__col-centered,
.walkablegrid__row-centered,
.walkablegrid__tile {
  width: var(--tile-size, 40px);
  height: var(--tile-size, 40px);
}

.walkablegrid__col-centered,
.walkablegrid__row-centered {
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

.walkablegrid__tile::after,
.walkablegrid__tile:hover,
.walkablegrid__tile:active {
  content: none;
  border-color: inherit;
  color: inherit;
  background: inherit;
  box-shadow: none;
  transform: none;
}

.walkablegrid__tile-overlay {
  position: absolute;
  pointer-events: none;
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

.walkablegrid__anchor {
  position: absolute;
  display: grid;
  place-content: center;
  margin: auto;
  inset: 0;
  color: var(--accent-blue);
  font-size: calc(var(--tile-size, 32px) * 0.5);
  line-height: 1;
  text-shadow: 0 0 4px color-mix(in srgb, var(--accent-blue) 60%, transparent);
  z-index: var(--z-canvas-base);
  pointer-events: none;
}
</style>
