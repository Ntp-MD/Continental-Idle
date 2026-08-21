<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, inject } from "vue";
import { useAssetsStore, dragState, endAssetDrag } from "../blueprintStore";
import { findAssetCached } from "../assetUtils";
import { svgTransform as svgTransformGeo, roundedRectPath } from "../geometry";
import { useConfirm } from "@/composables/useConfirm";
import type { ObjectData, EntityRef } from "../types";
import { resolveObjectDef, STREET_TILES } from "../types";
import { useCanvasViewport } from "../composables/useCanvasViewport";
import { useCanvasSelection } from "../composables/useCanvasSelection";
import { useCanvasDragDrop } from "../composables/useCanvasDragDrop";
import WalkableGridPanel from "./WalkableGridPanel.vue";
import ColorInput from "./ColorInput.vue";
import ModalShell from "./ModalShell.vue";
import { useNpcSimulation } from "../composables/useNpcSimulation";
import { renderSvgInto as renderSvgContent } from "../svgSanitizer";

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

const store = useAssetsStore();
const confirm = useConfirm().confirm;
const canvas = computed(() => store.state.layout.canvas);
const floor = computed(() => store.currentFloor.value);
const floors = computed(() => store.state.layout.floors);

const floorNavOpen = ref(false);
function toggleFloorNav() {
  floorNavOpen.value = !floorNavOpen.value;
}
function closeFloorNav() {
  floorNavOpen.value = false;
}
function selectFloorNav(id: string) {
  store.selectFloor(id);
  closeFloorNav();
}
function onFloorNavOutside(e: MouseEvent) {
  const el = e.target as HTMLElement;
  if (floorNavOpen.value && !el.closest(".floor__trigger") && !el.closest(".floor__menu")) closeFloorNav();
}
function onFloorNavKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && floorNavOpen.value) closeFloorNav();
}

const npcSimulation = inject("npcSimulation") as ReturnType<typeof useNpcSimulation>;
const { npcs, start: startNpcSimulation, stop: stopNpcSimulation } = npcSimulation;
const currentFloorNpcs = computed(() => {
  const fid = store.state.currentFloorId;
  return npcs.value.every((n) => n.floorId === fid) ? npcs.value : npcs.value.filter((n) => n.floorId === fid);
});

watch(
  () => store.state.mode,
  (mode, previousMode) => {
    if (mode === "npc-preview") {
      startNpcSimulation();
    }
    if (previousMode === "npc-preview" && mode !== "npc-preview") stopNpcSimulation();
  },
);

const VIEW_TOGGLE_KEY = "blueprint-view-toggles";
const savedToggles = (() => {
  try {
    return JSON.parse(sessionStorage.getItem(VIEW_TOGGLE_KEY) ?? "{}");
  } catch {
    return {};
  }
})();
const showWalkableOverlay = ref(savedToggles.showWalkableOverlay ?? false);
const showInteractSpots = ref(savedToggles.showInteractSpots ?? false);
const showWalls = ref(savedToggles.showWalls ?? false);
const showObjectHighlights = ref(savedToggles.showObjectHighlights ?? false);

const isInteracting = computed(() => !!panning.value || !!moving.value || zooming.value);
const renderWalkableOverlay = computed(() => showWalkableOverlay.value && !isInteracting.value);
const renderWalls = computed(() => showWalls.value && !isInteracting.value);
const renderInteractSpots = computed(() => showInteractSpots.value && !isInteracting.value);
const renderObjectHighlights = computed(() => showObjectHighlights.value && !isInteracting.value);

const selectedObjectIds = computed(() => {
  const ids = new Set<string>();
  for (const item of store.state.selectionState.items) {
    if (item.type === "object") ids.add(item.id);
  }
  return ids;
});

const objDefMap = computed(() => {
  const map = new Map<string, ReturnType<typeof resolveObjectDef>>();
  const assetMap = store.assetMap();
  for (const obj of floor.value?.objects ?? []) {
    map.set(obj.id, resolveObjectDef(obj.rotation, findAssetCached(assetMap, obj.type), { w: obj.w, h: obj.h }));
  }
  return map;
});

interface TileRun {
  x: number;
  y: number;
  w: number;
  h: number;
  state: string;
}
const walkableRuns = computed<TileRun[]>(() => {
  const tileStates = floor.value?.walkable?.tileStates;
  if (!tileStates) return [];
  const t = canvas.value.tileSize;
  const runs: TileRun[] = [];
  for (let r = 0; r < tileStates.length; r++) {
    const row = tileStates[r];
    let c = 0;
    while (c < row.length) {
      const state = row[c];
      let endC = c + 1;
      while (endC < row.length && row[endC] === state) endC++;
      runs.push({ x: c * t, y: r * t, w: (endC - c) * t, h: t, state });
      c = endC;
    }
  }
  return runs;
});

interface WallRun {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
const wallRuns = computed<WallRun[]>(() => {
  const tileEdges = floor.value?.walkable?.tileEdges;
  if (!tileEdges) return [];
  const t = canvas.value.tileSize;
  const runs: WallRun[] = [];
  for (let r = 0; r < tileEdges.length; r++) {
    const row = tileEdges[r];
    if (!row) continue;
    for (let c = 0; c < row.length; c++) {
      const edges = row[c];
      if (!edges) continue;
      if (edges.top) runs.push({ x1: c * t, y1: r * t, x2: (c + 1) * t, y2: r * t });
      if (edges.bottom) runs.push({ x1: c * t, y1: (r + 1) * t, x2: (c + 1) * t, y2: (r + 1) * t });
      if (edges.left) runs.push({ x1: c * t, y1: r * t, x2: c * t, y2: (r + 1) * t });
      if (edges.right) runs.push({ x1: (c + 1) * t, y1: r * t, x2: (c + 1) * t, y2: (r + 1) * t });
    }
  }
  return runs;
});

const modeLabel = computed(() => {
  const labels: Record<string, string> = {
    object: "Object",
    draw: "Draw Object",
    move: "Move",
    "npc-preview": "NPC Preview",
  };
  return (labels[store.state.mode] ?? store.state.mode) + " Mode";
});

const modeHint = computed(() => {
  const hints: Record<string, string> = {
    object: "Drag an asset from the palette onto the canvas",
    draw: "Drag a rectangle, then save it as an origin asset",
    move: "Click and drag an object to reposition it",
    "npc-preview": "NPCs are simulating on this floor",
  };
  return hints[store.state.mode] ?? "";
});

const streetBorderPx = computed(() => STREET_TILES * canvas.value.tileSize);
const buildingArea = computed(() => ({
  x: streetBorderPx.value,
  y: streetBorderPx.value,
  w: canvas.value.width - streetBorderPx.value * 2,
  h: canvas.value.height - streetBorderPx.value * 2,
}));
const streetSidewalkWidth = computed(() => 2 * canvas.value.tileSize);
const streetRoadWidth = computed(() => 4 * canvas.value.tileSize);

const vp = useCanvasViewport(
  () => canvas.value.width,
  () => canvas.value.height,
);
const { viewBox, zoomPercent, spaceDown, panning, zooming, svgRef, RULER_SIZE, fitToScreen, centerView, zoomBy, onWheel, startPan, onPanMouseDown, onPanMouseMove, onPanMouseUp, localPoint } = vp;

const draftAssetId = ref<string | null>(null);
const draftObjectId = ref<string | null>(null);
const showSaveOrigin = ref(false);
const originName = ref("");
const originBgColor = ref<string | undefined>(undefined);
const draftObject = computed(() => floor.value?.objects.find((object) => object.id === draftObjectId.value) ?? null);

async function onDrawComplete(rect: { x: number; y: number; w: number; h: number }) {
  const t = canvas.value.tileSize;
  const w = Math.max(1, Math.round(rect.w / t));
  const h = Math.max(1, Math.round(rect.h / t));
  const snappedX = Math.round(rect.x / t) * t;
  const snappedY = Math.round(rect.y / t) * t;
  try {
    const draft = await store.beginDrawnObject("Draft Object", w, h, snappedX, snappedY);
    if (!draft) return;
    draftAssetId.value = draft.asset.id;
    draftObjectId.value = draft.object.id;
    originName.value = "";
    originBgColor.value = undefined;
    showSaveOrigin.value = true;
  } catch {}
}

const sel = useCanvasSelection({
  spaceDown,
  localPoint,
  canvasWidth: () => canvas.value.width,
  canvasHeight: () => canvas.value.height,
  startPan,
  floor,
  store: store,
  getMode: () => store.state.mode,
  onDrawComplete,
});
const { boxSelect, onCanvasMouseDown, onBoxSelectMouseMove, onBoxSelectMouseUp } = sel;

const dd = useCanvasDragDrop({
  svgRef,
  localPoint,
  canvasWidth: () => canvas.value.width,
  canvasHeight: () => canvas.value.height,
  floor,
  store: store,
  tileSize: () => canvas.value.tileSize,
});
const { paletteValid, paletteGhost, paletteGhostParts, paletteGhostRect, onWindowMouseMoveForDrag, onWindowMouseUpForDrag } = dd;

const showGrid = ref(savedToggles.showGrid ?? true);
const showLabels = ref(savedToggles.showLabels ?? true);
const showStreet = ref(savedToggles.showStreet ?? true);
const mouseCoords = ref({ x: 0, y: 0 });
const rulerMouseX = ref(-1);
const rulerMouseY = ref(-1);

const rulerXTicks = computed(() => {
  const w = canvas.value.width;
  const majorStep = 100;
  const minorStep = 20;
  const ticks: { pos: number; label: string; major: boolean }[] = [];
  for (let v = 0; v <= w; v += minorStep) {
    const isMajor = v % majorStep === 0;
    ticks.push({ pos: v, label: isMajor ? String(v) : "", major: isMajor });
  }
  return ticks;
});

const rulerYTicks = computed(() => {
  const h = canvas.value.height;
  const majorStep = 50;
  const minorStep = 10;
  const ticks: { pos: number; label: string; major: boolean }[] = [];
  for (let v = 0; v <= h; v += minorStep) {
    const isMajor = v % majorStep === 0;
    ticks.push({ pos: v, label: isMajor ? String(v) : "", major: isMajor });
  }
  return ticks;
});

const moving = ref<{ type: "object"; id: string; offsetX: number; offsetY: number; startX: number; startY: number } | null>(null);

let _cycleClickPos: { x: number; y: number } | null = null;
let _cycleCandidates: EntityRef[] = [];
let _cycleIndex = 0;
const CYCLE_THRESHOLD = 6;

function hasOuterWall(obj: ObjectData): boolean {
  const def = resolveObjectDef(obj.rotation, findAssetCached(store.assetMap(), obj.type), { w: obj.w, h: obj.h });
  const edges = def.tileEdges;
  if (!edges || edges.length === 0) return false;
  const rows = edges.length;
  const cols = edges[0]?.length ?? 0;
  if (cols === 0) return false;
  for (let c = 0; c < cols; c++) {
    if (edges[0][c]?.top || edges[rows - 1][c]?.bottom) return true;
  }
  for (let r = 0; r < rows; r++) {
    if (edges[r][0]?.left || edges[r][cols - 1]?.right) return true;
  }
  return false;
}

function findEntitiesAtPoint(p: { x: number; y: number }): EntityRef[] {
  const f = floor.value;
  if (!f) return [];
  const results: EntityRef[] = [];
  for (const obj of f.objects) {
    if (p.x >= obj.x && p.x <= obj.x + obj.w && p.y >= obj.y && p.y <= obj.y + obj.h) {
      results.push({ type: "object", id: obj.id });
    }
  }
  return results;
}

function tryCycleSelect(p: { x: number; y: number }): EntityRef | null {
  if (_cycleClickPos && Math.abs(p.x - _cycleClickPos.x) <= CYCLE_THRESHOLD && Math.abs(p.y - _cycleClickPos.y) <= CYCLE_THRESHOLD && _cycleCandidates.length > 1) {
    _cycleIndex = (_cycleIndex + 1) % _cycleCandidates.length;
    return _cycleCandidates[_cycleIndex];
  }
  const candidates = findEntitiesAtPoint(p);
  if (candidates.length <= 1) {
    _cycleClickPos = null;
    _cycleCandidates = [];
    _cycleIndex = 0;
    return null;
  }
  _cycleClickPos = { x: p.x, y: p.y };
  _cycleCandidates = candidates;
  _cycleIndex = 0;
  return candidates[0];
}

function onObjectMouseDown(e: MouseEvent, id: string) {
  if (e.button === 1 || spaceDown.value) return;
  e.stopPropagation();
  if (e.shiftKey || e.ctrlKey || e.metaKey) {
    store.toggleMultiSelect(id);
    return;
  }
  const p = localPoint(e);
  if (!p) return;
  const cycled = tryCycleSelect(p);
  if (cycled) {
    store.select(cycled);
    if (cycled.type !== "object" || cycled.id !== id) return;
  } else {
    store.select({ type: "object", id });
  }
  const obj = floor.value?.objects.find((o) => o.id === id);
  if (obj?.locked) return;
  moving.value = { type: "object", id, offsetX: p.x - (obj?.x ?? 0), offsetY: p.y - (obj?.y ?? 0), startX: p.x, startY: p.y };
  _dragHasMoved = false;
  window.addEventListener("mousemove", onMoveMouseMove);
  window.addEventListener("mouseup", onMoveMouseUp);
}

let _dragHasMoved = false;
let _moveRafId: number | null = null;
let _movePending: { x: number; y: number } | null = null;

function onMoveMouseMove(e: MouseEvent) {
  if (!moving.value) return;
  const p = localPoint(e);
  if (!p) return;
  const threshold = 2;
  if (!_dragHasMoved) {
    if (Math.abs(p.x - moving.value.startX) < threshold && Math.abs(p.y - moving.value.startY) < threshold) return;
    _dragHasMoved = true;
  }
  _movePending = { x: p.x - moving.value.offsetX, y: p.y - moving.value.offsetY };
  if (_moveRafId === null) {
    _moveRafId = requestAnimationFrame(() => {
      _moveRafId = null;
      if (_movePending && moving.value) {
        store.moveSelectedTo(_movePending.x, _movePending.y);
        _movePending = null;
      }
    });
  }
}

async function onMoveMouseUp() {
  window.removeEventListener("mousemove", onMoveMouseMove);
  window.removeEventListener("mouseup", onMoveMouseUp);
  if (_moveRafId !== null) {
    cancelAnimationFrame(_moveRafId);
    _moveRafId = null;
  }
  if (_movePending && moving.value) {
    store.moveSelectedTo(_movePending.x, _movePending.y);
    _movePending = null;
  }
  if (moving.value) {
    if (_dragHasMoved) await store.commitMove();
  }
  _dragHasMoved = false;
  moving.value = null;
}

let _hoverRafId: number | null = null;
let _hoverPending: { x: number; y: number } | null = null;

function onContainerMouseMove(e: MouseEvent) {
  if (dragState.assetId) return;
  const p = localPoint(e);
  if (!p) return;
  _hoverPending = { x: p.x, y: p.y };
  if (_hoverRafId === null) {
    _hoverRafId = requestAnimationFrame(() => {
      _hoverRafId = null;
      if (_hoverPending) {
        mouseCoords.value = { x: Math.round(_hoverPending.x), y: Math.round(_hoverPending.y) };
        rulerMouseX.value = _hoverPending.x;
        rulerMouseY.value = _hoverPending.y;
        _hoverPending = null;
      }
    });
  }
}

function saveViewToggles() {
  try {
    sessionStorage.setItem(
      VIEW_TOGGLE_KEY,
      JSON.stringify({
        showGrid: showGrid.value,
        showLabels: showLabels.value,
        showStreet: showStreet.value,
        showWalkableOverlay: showWalkableOverlay.value,
        showInteractSpots: showInteractSpots.value,
        showWalls: showWalls.value,
        showObjectHighlights: showObjectHighlights.value,
      }),
    );
  } catch {}
}

function toggleGrid() {
  showGrid.value = !showGrid.value;
  saveViewToggles();
}

function toggleLabels() {
  showLabels.value = !showLabels.value;
  saveViewToggles();
}

function toggleStreet() {
  showStreet.value = !showStreet.value;
  saveViewToggles();
}

function toggleWalkableOverlay() {
  showWalkableOverlay.value = !showWalkableOverlay.value;
  saveViewToggles();
}

function toggleInteractSpots() {
  showInteractSpots.value = !showInteractSpots.value;
  saveViewToggles();
}

function toggleWalls() {
  showWalls.value = !showWalls.value;
  saveViewToggles();
}

function toggleObjectHighlights() {
  showObjectHighlights.value = !showObjectHighlights.value;
  saveViewToggles();
}

async function onKeyDown(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement)?.tagName;
  if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
  if (e.code === "Space") {
    e.preventDefault();
    spaceDown.value = true;
    return;
  }
  if (e.key === "Delete" || e.key === "Backspace") {
    if (store.state.selectionState.primary) {
      e.preventDefault();
      const sel = store.state.selectionState.primary;
      const count = store.state.selectionState.items.length || 1;
      const confirmed = await confirm({
        title: "Delete selection",
        message: `Delete ${count} selected ${count === 1 ? sel.type : "object(s)"}? This cannot be undone via UI (only Ctrl+Z).`,
        confirmLabel: "Delete",
        cancelLabel: "Cancel",
        danger: true,
      });
      if (!confirmed) return;
      await store.deleteSelected();
    }
  } else if (e.key === "r" || e.key === "R") {
    if (store.state.selectionState.primary?.type === "object") {
      await store.rotateSelected();
    }
  } else if (e.key === "0" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    fitToScreen();
  } else if (e.key === "+" || e.key === "=") {
    zoomBy(1.25);
  } else if (e.key === "-" || e.key === "_") {
    zoomBy(1 / 1.25);
  } else if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown") {
    if (store.state.selectionState.primary) {
      e.preventDefault();
      const t = canvas.value.tileSize;
      const dx = e.key === "ArrowLeft" ? -t : e.key === "ArrowRight" ? t : 0;
      const dy = e.key === "ArrowUp" ? -t : e.key === "ArrowDown" ? t : 0;
      const sel = store.state.selectionState.primary;
      if (sel?.type === "object") {
        const o = store.selectedObject();
        if (o) {
          store.moveSelectedTo(o.x + dx, o.y + dy);
          await store.commitMove();
        }
      }
    }
  } else if (e.key === "Escape") {
    if (dragState.assetId) endAssetDrag();
    store.state.selectionState = { primary: null, items: [] };
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l") {
    e.preventDefault();
    if (e.shiftKey) {
      const obj = store.selectedObject();
      if (obj) await store.unlinkObject(obj.id);
    } else {
      if (store.state.selectionState.items.length >= 2) {
        await store.linkObjects([...store.state.selectionState.items.filter((i) => i.type === "object").map((i) => i.id)]);
      }
    }
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
    e.preventDefault();
    store.copySelected();
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
    e.preventDefault();
    await store.pasteObjects();
  } else if (e.key === "l" || e.key === "L") {
    if (!e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      const obj = store.selectedObject();
      if (obj) await store.toggleObjectLock(obj.id);
    }
  }
}

function onKeyUp(e: KeyboardEvent) {
  if (e.code === "Space") spaceDown.value = false;
}

const ZOOM_STORAGE_KEY = "blueprint-zoom-state";

onMounted(() => {
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  document.addEventListener("click", onFloorNavOutside);
  document.addEventListener("keydown", onFloorNavKeydown);
  if (!sessionStorage.getItem(ZOOM_STORAGE_KEY)) requestAnimationFrame(fitToScreen);
});
onUnmounted(() => {
  stopNpcSimulation();
  window.removeEventListener("keydown", onKeyDown);
  window.removeEventListener("keyup", onKeyUp);
  document.removeEventListener("click", onFloorNavOutside);
  document.removeEventListener("keydown", onFloorNavKeydown);
  window.removeEventListener("mousemove", onBoxSelectMouseMove);
  window.removeEventListener("mouseup", onBoxSelectMouseUp);
  window.removeEventListener("mousemove", onWindowMouseMoveForDrag);
  window.removeEventListener("mouseup", onWindowMouseUpForDrag);
  window.removeEventListener("mousemove", onMoveMouseMove);
  window.removeEventListener("mouseup", onMoveMouseUp);
  window.removeEventListener("mousemove", onPanMouseMove);
  window.removeEventListener("mouseup", onPanMouseUp);
  saveViewToggles();
});

function escapeSvgText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function assetLabel(type: string): string {
  const asset = findAssetCached(store.assetMap(), type);
  return escapeSvgText(asset?.defaultLabel ?? asset?.name ?? type);
}

function objDef(obj: ObjectData) {
  return objDefMap.value.get(obj.id) ?? resolveObjectDef(obj.rotation, findAssetCached(store.assetMap(), obj.type), { w: obj.w, h: obj.h });
}

function objFillColor(obj: ObjectData): string {
  if (obj.fillColor) return obj.fillColor;
  const a = findAssetCached(store.assetMap(), obj.type);
  if (a?.svg) return a.defaultBgColor ?? "transparent";
  return a?.defaultBgColor ?? "var(--text-bright)";
}

function objLabelColor(obj: ObjectData): string {
  const a = findAssetCached(store.assetMap(), obj.type);
  return a?.defaultLabelColor || "var(--text-primary)";
}

function objIsWall(obj: ObjectData): boolean {
  return findAssetCached(store.assetMap(), obj.type)?.isWall ?? false;
}

function assetSvg(type: string): string | undefined {
  const a = findAssetCached(store.assetMap(), type);
  const svg = a?.svg;
  return svg ? svg.replace(/var\(--border-dim\)/g, "var(--border-dim)") : undefined;
}

function svgTransform(obj: ObjectData): string {
  const asset = findAssetCached(store.assetMap(), obj.type);
  return svgTransformGeo(obj, asset);
}

function isObjectSelected(id: string): boolean {
  return selectedObjectIds.value.has(id);
}

async function saveDrawnOrigin() {
  const assetId = draftAssetId.value;
  const name = originName.value.trim();
  if (!assetId || !name) return;
  try {
    await store.updateAsset(assetId, { name, defaultBgColor: originBgColor.value });
    showSaveOrigin.value = false;
    draftAssetId.value = null;
    draftObjectId.value = null;
    store.setMode("object");
  } catch {}
}

async function cancelDrawnOrigin() {
  if (draftObjectId.value) {
    store.select({ type: "object", id: draftObjectId.value });
    await store.deleteSelected();
  }
  if (draftAssetId.value) await store.deleteAsset(draftAssetId.value);
  showSaveOrigin.value = false;
  draftAssetId.value = null;
  draftObjectId.value = null;
  store.setMode("object");
}
</script>

<template>
  <div
    :ref="vp.containerRef"
    class="editor__canvas"
    :class="{ 'editor__canvas--panning': spaceDown, 'editor__canvas--dragging': !!panning, 'editor__mode--draw': store.state.mode === 'draw', 'editor__mode--move': store.state.mode === 'move' }"
    @wheel="onWheel"
    @mousedown="onPanMouseDown"
    @mousemove="onContainerMouseMove"
    @mouseleave="
      rulerMouseX = -1;
      rulerMouseY = -1;
    "
  >
    <svg ref="svgRef" class="editor__svg" :viewBox="viewBox" preserveAspectRatio="xMidYMid meet" role="application" aria-label="Blueprint editor canvas — use arrow keys to move selected objects, Delete to remove, R to rotate" tabindex="0" @mousedown="onCanvasMouseDown">
      <defs>
        <pattern id="grid" :width="canvas.tileSize" :height="canvas.tileSize" patternUnits="userSpaceOnUse">
          <path :d="`M ${canvas.tileSize} 0 L 0 0 0 ${canvas.tileSize}`" fill="none" :style="{ stroke: 'var(--border-dim)' }" stroke-width="0.5" />
        </pattern>
      </defs>

      <rect :width="canvas.width" :height="canvas.height" :style="{ fill: canvas.bgColor || 'var(--bg-secondary)' }" />

      <!-- Street border: sidewalk + road + lane markings (8 tiles on all sides) -->
      <g v-if="showStreet" class="editor__svg--noevents">
        <!-- Outer sidewalk (2 tiles, all sides) -->
        <rect :x="0" :y="0" :width="canvas.width" :height="streetSidewalkWidth" fill="var(--street-sidewalk)" />
        <rect :x="0" :y="canvas.height - streetSidewalkWidth" :width="canvas.width" :height="streetSidewalkWidth" fill="var(--street-sidewalk)" />
        <rect :x="0" :y="0" :width="streetSidewalkWidth" :height="canvas.height" fill="var(--street-sidewalk)" />
        <rect :x="canvas.width - streetSidewalkWidth" :y="0" :width="streetSidewalkWidth" :height="canvas.height" fill="var(--street-sidewalk)" />

        <!-- Road (4 tiles, all sides) -->
        <rect :x="streetSidewalkWidth" :y="streetSidewalkWidth" :width="canvas.width - streetSidewalkWidth * 2" :height="streetRoadWidth" fill="var(--street-road)" />
        <rect :x="streetSidewalkWidth" :y="canvas.height - streetSidewalkWidth - streetRoadWidth" :width="canvas.width - streetSidewalkWidth * 2" :height="streetRoadWidth" fill="var(--street-road)" />
        <rect :x="streetSidewalkWidth" :y="streetSidewalkWidth" :width="streetRoadWidth" :height="canvas.height - streetSidewalkWidth * 2" fill="var(--street-road)" />
        <rect :x="canvas.width - streetSidewalkWidth - streetRoadWidth" :y="streetSidewalkWidth" :width="streetRoadWidth" :height="canvas.height - streetSidewalkWidth * 2" fill="var(--street-road)" />

        <!-- Road lane markings (dashed center lines) -->
        <!-- Top road center line -->
        <line :x1="streetSidewalkWidth" :y1="streetSidewalkWidth + streetRoadWidth / 2" :x2="canvas.width - streetSidewalkWidth" :y2="streetSidewalkWidth + streetRoadWidth / 2" stroke="var(--street-marking)" stroke-width="1" stroke-dasharray="12 8" opacity="0.5" />
        <!-- Bottom road center line -->
        <line :x1="streetSidewalkWidth" :y1="canvas.height - streetSidewalkWidth - streetRoadWidth / 2" :x2="canvas.width - streetSidewalkWidth" :y2="canvas.height - streetSidewalkWidth - streetRoadWidth / 2" stroke="var(--street-marking)" stroke-width="1" stroke-dasharray="12 8" opacity="0.5" />
        <!-- Left road center line -->
        <line :x1="streetSidewalkWidth + streetRoadWidth / 2" :y1="streetSidewalkWidth" :x2="streetSidewalkWidth + streetRoadWidth / 2" :y2="canvas.height - streetSidewalkWidth" stroke="var(--street-marking)" stroke-width="1" stroke-dasharray="12 8" opacity="0.5" />
        <!-- Right road center line -->
        <line :x1="canvas.width - streetSidewalkWidth - streetRoadWidth / 2" :y1="streetSidewalkWidth" :x2="canvas.width - streetSidewalkWidth - streetRoadWidth / 2" :y2="canvas.height - streetSidewalkWidth" stroke="var(--street-marking)" stroke-width="1" stroke-dasharray="12 8" opacity="0.5" />

        <!-- Building area outline (subtle border separating street from building) -->
        <rect :x="buildingArea.x" :y="buildingArea.y" :width="buildingArea.w" :height="buildingArea.h" fill="none" stroke="var(--border-dim)" stroke-width="1" stroke-dasharray="4 4" opacity="0.6" />
      </g>

      <!-- Rulers (outside canvas, Photoshop-style) -->
      <g class="editor__ruler--passive editor__svg--noevents">
        <!-- Top ruler background -->
        <rect :x="-RULER_SIZE" :y="-RULER_SIZE" :width="canvas.width + RULER_SIZE" :height="RULER_SIZE" :style="{ fill: 'var(--bg-secondary)', stroke: 'var(--border-dim)' }" stroke-width="0.5" />
        <!-- Left ruler background -->
        <rect :x="-RULER_SIZE" :y="0" :width="RULER_SIZE" :height="canvas.height" :style="{ fill: 'var(--bg-secondary)', stroke: 'var(--border-dim)' }" stroke-width="0.5" />
        <!-- Corner square -->
        <rect :x="-RULER_SIZE" :y="-RULER_SIZE" :width="RULER_SIZE" :height="RULER_SIZE" :style="{ fill: 'var(--bg-primary)', stroke: 'var(--border-dim)' }" stroke-width="0.5" />

        <!-- Top ruler ticks -->
        <g v-for="tick in rulerXTicks" :key="'rx' + tick.pos">
          <line v-if="tick.major" :x1="tick.pos" :y1="-RULER_SIZE" :x2="tick.pos" :y2="-2" :style="{ stroke: 'var(--text-primary)' }" stroke-width="1" />
          <text v-if="tick.major" :x="tick.pos + 3" :y="-5" font-size="12" font-weight="100" letter-spacing="1" fill="var(--text-dim)">{{ tick.label }}</text>
          <line v-else :x1="tick.pos" :y1="-RULER_SIZE" :x2="tick.pos" :y2="-RULER_SIZE + 5" :style="{ stroke: 'var(--text-primary)' }" stroke-width="0.5" />
        </g>

        <!-- Left ruler ticks -->
        <g v-for="tick in rulerYTicks" :key="'ry' + tick.pos">
          <line v-if="tick.major" :x1="-RULER_SIZE" :y1="tick.pos" :x2="-2" :y2="tick.pos" :style="{ stroke: 'var(--text-primary)' }" stroke-width="1" />
          <text v-if="tick.major" :x="-5" :y="tick.pos + 3" font-size="12" font-weight="100" letter-spacing="1" fill="var(--text-dim)" transform="rotate(-90)" :transform-origin="`-5 ${tick.pos}`">{{ tick.label }}</text>
          <line v-else :x1="-RULER_SIZE" :y1="tick.pos" :x2="-RULER_SIZE + 5" :y2="tick.pos" :style="{ stroke: 'var(--text-primary)' }" stroke-width="0.5" />
        </g>

        <!-- Canvas edge guide lines (extend into rulers) -->
        <line :x1="0" :y1="-RULER_SIZE" :x2="0" :y2="0" :style="{ stroke: 'var(--accent-green)' }" stroke-width="1.5" />
        <line :x1="canvas.width" :y1="-RULER_SIZE" :x2="canvas.width" :y2="0" :style="{ stroke: 'var(--accent-green)' }" stroke-width="1.5" />
        <line :x1="-RULER_SIZE" :y1="0" :x2="0" :y2="0" :style="{ stroke: 'var(--accent-green)' }" stroke-width="1.5" />
        <line :x1="-RULER_SIZE" :y1="canvas.height" :x2="0" :y2="canvas.height" :style="{ stroke: 'var(--accent-green)' }" stroke-width="1.5" />

        <!-- Mouse position indicators -->
        <line v-if="rulerMouseX >= 0" :x1="rulerMouseX" :y1="-RULER_SIZE" :x2="rulerMouseX" :y2="0" :style="{ stroke: 'var(--accent-primary)' }" stroke-width="1" />
        <line v-if="rulerMouseY >= 0" :x1="-RULER_SIZE" :y1="rulerMouseY" :x2="0" :y2="rulerMouseY" :style="{ stroke: 'var(--accent-primary)' }" stroke-width="1" />
      </g>

      <g v-if="floor && floor.objects.length === 0">
        <text :x="canvas.width / 2" :y="canvas.height / 2 - 10" text-anchor="middle" font-size="16" class="editor__svg--noevents" :style="{ fill: 'var(--text-primary)' }">Empty floor — drag objects from the palette</text>
      </g>

      <g v-if="renderWalkableOverlay && floor?.walkable?.tileStates" v-memo="[walkableRuns, renderWalkableOverlay]" class="editor__svg--noevents">
        <rect v-for="(run, i) in walkableRuns" :key="`floor-walk-run-${i}`" :x="run.x" :y="run.y" :width="run.w" :height="run.h" :class="`editor__tile editor__tile--${run.state}`" />
      </g>

      <g v-if="renderWalls && floor?.walkable?.tileEdges" v-memo="[wallRuns, renderWalls]" class="editor__walls editor__svg--noevents">
        <line v-for="(run, i) in wallRuns" :key="`floor-wall-run-${i}`" :x1="run.x1" :y1="run.y1" :x2="run.x2" :y2="run.y2" stroke="var(--accent-gold)" stroke-width="2" />
      </g>

      <g v-if="floor">
        <g v-for="obj in floor.objects" :key="obj.id" @mousedown="onObjectMouseDown($event, obj.id)">
          <rect :x="obj.x" :y="obj.y" :width="obj.w" :height="obj.h" fill="transparent" class="editor__svg--passall" />
          <template v-if="assetSvg(obj.type)">
            <rect :x="obj.x + (obj.padding ?? 0)" :y="obj.y + (obj.padding ?? 0)" :width="obj.w - (obj.padding ?? 0) * 2" :height="obj.h - (obj.padding ?? 0) * 2" :fill="objFillColor(obj)" :class="{ 'editor__canvas--collapsed': obj.collapsed }" :style="{ cursor: moving?.id === obj.id ? 'grabbing' : 'move' }" />
            <g v-svg-content="assetSvg(obj.type)" :transform="svgTransform(obj)" :data-obj-id="obj.id" :class="{ 'editor__canvas--collapsed': obj.collapsed, 'editor__canvas--dragitem': moving?.id === obj.id, 'editor__canvas--locked': obj.locked, 'editor__canvas--nowall': !hasOuterWall(obj) }" :style="{ cursor: moving?.id === obj.id ? 'grabbing' : 'move' }" />
          </template>
          <path
            v-else-if="roundedRectPath(obj.x + (obj.padding ?? 0), obj.y + (obj.padding ?? 0), obj.w - (obj.padding ?? 0) * 2, obj.h - (obj.padding ?? 0) * 2, obj.rx)"
            :d="roundedRectPath(obj.x + (obj.padding ?? 0), obj.y + (obj.padding ?? 0), obj.w - (obj.padding ?? 0) * 2, obj.h - (obj.padding ?? 0) * 2, obj.rx)!"
            :fill="objFillColor(obj)"
            :stroke-width="objIsWall(obj) ? 2 : 1"
            :stroke-dasharray="objIsWall(obj) ? '6 3' : undefined"
            :class="{ 'editor__canvas--collapsed': obj.collapsed, 'editor__canvas--dragitem': moving?.id === obj.id, 'editor__canvas--linked': !!obj.linkGroupId, 'editor__canvas--locked': obj.locked }"
            :style="{ stroke: 'var(--text-primary)', cursor: moving?.id === obj.id ? 'grabbing' : 'move' }"
          />
          <rect
            v-else
            :x="obj.x + (obj.padding ?? 0)"
            :y="obj.y + (obj.padding ?? 0)"
            :width="obj.w - (obj.padding ?? 0) * 2"
            :height="obj.h - (obj.padding ?? 0) * 2"
            :fill="objFillColor(obj)"
            stroke-width="1"
            :rx="obj.radius ?? 0"
            :class="{ 'editor__canvas--collapsed': obj.collapsed, 'editor__canvas--dragitem': moving?.id === obj.id, 'editor__canvas--linked': !!obj.linkGroupId, 'editor__canvas--locked': obj.locked }"
            :style="{ stroke: 'var(--text-primary)', cursor: moving?.id === obj.id ? 'grabbing' : 'move' }"
          />
          <rect v-if="renderObjectHighlights" :x="obj.x + 1" :y="obj.y + 1" :width="Math.max(0, obj.w - 2)" :height="Math.max(0, obj.h - 2)" fill="none" :rx="obj.radius ?? 0" class="editor__canvas--highlight editor__svg--noevents" />
          <template v-if="renderWalkableOverlay && objDef(obj).walkableGrid" v-memo="[obj.id, obj.x, obj.y, obj.w, obj.h, renderWalkableOverlay, objDef(obj).walkableGrid]">
            <template v-for="(row, gr) in objDef(obj).walkableGrid" :key="'wg_' + obj.id + '-' + gr">
              <rect v-for="(cell, gc) in row" :key="'wg_' + obj.id + '-' + gr + '-' + gc" :x="obj.x + gc * (obj.w / row.length)" :y="obj.y + gr * (obj.h / objDef(obj).walkableGrid!.length)" :width="obj.w / row.length" :height="obj.h / objDef(obj).walkableGrid!.length" :class="`editor__tile editor__tile--obj-${cell ? 'walkable' : 'blocked'}`" />
            </template>
          </template>
          <rect v-if="isObjectSelected(obj.id)" :x="obj.x + (obj.padding ?? 0)" :y="obj.y + (obj.padding ?? 0)" :width="obj.w - (obj.padding ?? 0) * 2" :height="obj.h - (obj.padding ?? 0) * 2" fill="none" :rx="obj.radius ?? 0" class="editor__canvas--selected editor__svg--noevents" />
          <text v-if="showLabels" :x="obj.x + obj.w / 2" :y="obj.y + obj.h / 2 + (obj.labelPadding ?? 0)" text-anchor="middle" dominant-baseline="middle" font-size="8" class="editor__svg--noevents" :style="{ fill: objLabelColor(obj) }">
            {{ assetLabel(obj.type) }}
          </text>
          <g v-if="obj.linkGroupId" class="editor__svg--noevents">
            <circle :cx="obj.x + obj.w - 4" :cy="obj.y + 4" r="3" fill="var(--accent-blue)" stroke="var(--bg-primary)" stroke-width="0.5" />
            <text :x="obj.x + obj.w - 4" :y="obj.y + 5.5" text-anchor="middle" font-size="4" fill="var(--bg-primary)">L</text>
          </g>
          <template v-if="(isObjectSelected(obj.id) || store.state.mode === 'npc-preview' || renderInteractSpots) && objDef(obj).interactSpots && objDef(obj).interactSpots!.length > 0" v-memo="[obj.id, obj.x, obj.y, isObjectSelected(obj.id), renderInteractSpots, store.state.mode, objDef(obj).interactSpots]">
            <g v-for="(interactSpot, interactSpotIdx) in objDef(obj).interactSpots" :key="`o-interactspot-${obj.id}-${interactSpotIdx}`" class="editor__svg--noevents">
              <circle :cx="obj.x + interactSpot.x" :cy="obj.y + interactSpot.y" r="4" fill="var(--accent-green)" stroke="var(--text-bright)" stroke-width="0.8" />
              <text :x="obj.x + interactSpot.x" :y="obj.y + interactSpot.y - 6" text-anchor="middle" font-size="5" fill="color-mix(in srgb, var(--accent-green) 70%, var(--bg-primary))">IS{{ interactSpotIdx + 1 }}</text>
            </g>
          </template>
        </g>

        <g v-if="renderWalkableOverlay || store.state.mode === 'npc-preview'" v-memo="[floor?.spawnZones, renderWalkableOverlay, store.state.mode]" class="editor__spawn editor__svg--noevents">
          <g v-for="zone in floor?.spawnZones ?? []" :key="`spawn-zone-${zone.id}`">
            <rect :x="zone.x" :y="zone.y" :width="zone.w" :height="zone.h" fill="color-mix(in srgb, var(--accent-green) 12%, transparent)" stroke="var(--accent-green)" stroke-width="1" stroke-dasharray="5 3" />
            <text :x="zone.x + 4" :y="zone.y + 10" font-size="6" fill="var(--accent-green)">{{ zone.label }}</text>
          </g>
        </g>

        <g v-if="store.state.mode === 'npc-preview'" class="editor__npc editor__svg--noevents">
          <g v-for="npc in currentFloorNpcs" :key="npc.id">
            <polyline v-if="npc.path.length > 1" :points="npc.path.map((point) => point.join(',')).join(' ')" fill="none" stroke="var(--accent-blue)" stroke-width="1" stroke-dasharray="3 2" opacity="0.7" />
            <line :x1="npc.targetX - 3" :y1="npc.targetY" :x2="npc.targetX + 3" :y2="npc.targetY" stroke="var(--accent-primary)" stroke-width="1" />
            <line :x1="npc.targetX" :y1="npc.targetY - 3" :x2="npc.targetX" :y2="npc.targetY + 3" stroke="var(--accent-primary)" stroke-width="1" />
            <circle :cx="npc.x" :cy="npc.y" r="6" :fill="npc.color" opacity="0.25" />
            <circle :cx="npc.x" :cy="npc.y" r="4" :fill="npc.color" stroke="var(--text-bright)" stroke-width="1" />
            <text :x="npc.x + 7" :y="npc.y - 7" font-size="4" fill="var(--text-bright)">{{ npc.status }}</text>
          </g>
        </g>
      </g>

      <rect v-if="showGrid" :width="canvas.width" :height="canvas.height" fill="url(#grid)" class="editor__svg--noevents" />

      <rect :width="canvas.width" :height="canvas.height" fill="none" :style="{ stroke: 'var(--border-dim)' }" stroke-width="2" />

      <rect v-if="boxSelect && boxSelect.w > 4" :x="boxSelect.x" :y="boxSelect.y" :width="boxSelect.w" :height="boxSelect.h" class="editor__svg--noevents" :style="{ fill: 'color-mix(in srgb, var(--accent-primary) 15%, transparent)', stroke: 'var(--accent-primary)' }" stroke-width="1.5" stroke-dasharray="4 3" />

      <g v-if="dragState.assetId && paletteGhost && paletteGhostParts">
        <rect v-for="(p, i) in paletteGhostParts" :key="'ghost_part_' + i" :x="p.x" :y="p.y" :width="p.w" :height="p.h" :style="{ fill: 'color-mix(in srgb, var(--accent-blue) 15%, transparent)', stroke: 'var(--accent-blue)' }" stroke-width="1.5" stroke-dasharray="4 3" />
      </g>
      <g v-else-if="dragState.assetId && paletteGhost && paletteGhostRect">
        <rect :x="paletteGhostRect.x" :y="paletteGhostRect.y" :width="paletteGhostRect.w" :height="paletteGhostRect.h" :style="{ fill: paletteValid ? 'color-mix(in srgb, var(--accent-green) 35%, transparent)' : 'color-mix(in srgb, var(--accent-red) 35%, transparent)', stroke: paletteValid ? 'var(--accent-green)' : 'var(--accent-red)' }" stroke-width="1.5" />
      </g>
    </svg>

    <div class="editor__title" v-if="floor">
      <span class="editor__labels" :style="{ color: floor.labelColor || undefined }">{{ floor.label }}</span>
      <span class="editor__name">{{ floor.name }}</span>
    </div>

    <div class="editor__nav" v-if="floor">
      <div class="floor__wrap">
        <button class="floor__trigger" @click.stop="toggleFloorNav" :aria-expanded="floorNavOpen" aria-haspopup="listbox" title="Switch floor" aria-label="Switch floor">
          <span class="floor__tag" :style="{ color: floor.labelColor || undefined }">{{ floor.label }}</span>
          <span class="floor__text">{{ floor.name }}</span>
          <span class="floor__caret" :class="{ 'floor__caret--rotated': floorNavOpen }">▾</span>
        </button>
        <div v-if="floorNavOpen" class="floor__menu" role="listbox" aria-label="Floors">
          <button v-for="f in floors" :key="f.id" class="floor__item" :class="{ 'floor__item--active': f.id === store.state.currentFloorId }" role="option" :aria-selected="f.id === store.state.currentFloorId" @click="selectFloorNav(f.id)">
            <span class="floor__label" :style="{ color: f.labelColor || undefined }">{{ f.label }}</span>
            <span class="floor__name">{{ f.name }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="editor__badge--float" :class="`editor__badge--${store.state.mode.replace('-', '')}`">
      {{ modeLabel }}
    </div>
    <div class="editor__hint" v-if="modeHint">
      {{ modeHint }}
    </div>

    <div class="editor__coords">{{ mouseCoords.x }}, {{ mouseCoords.y }}</div>

    <div class="editor__controls">
      <button class="flag--ghost flag--icon" @click="zoomBy(1 / 1.25)" title="Zoom Out (-)" aria-label="Zoom out">−</button>
      <span class="editor__zoom" aria-label="Zoom level">{{ zoomPercent }}%</span>
      <button class="flag--ghost flag--icon" @click="zoomBy(1.25)" title="Zoom In (+)" aria-label="Zoom in">+</button>
      <button class="flag--ghost" @click="fitToScreen" title="Fit to Screen (Ctrl+0)" aria-label="Fit to screen">Fit</button>
      <button class="flag--ghost" @click="centerView" title="Center View" aria-label="Center view">Center</button>
      <button class="flag--ghost" @click="toggleGrid" title="Toggle Grid" aria-label="Toggle grid">Grid</button>
      <button class="flag--ghost" @click="toggleLabels" title="Toggle Labels" aria-label="Toggle labels">Labels</button>
      <button class="flag--ghost" :class="{ 'flag--active': showStreet }" @click="toggleStreet" title="Toggle Street" aria-label="Toggle street">Street</button>
      <button class="flag--ghost" :class="{ 'flag--active': showWalkableOverlay }" @click="toggleWalkableOverlay" title="Toggle Walkable + Entrance" aria-label="Toggle walkable view">Walk</button>
      <button class="flag--ghost" :class="{ 'flag--active': showWalls }" @click="toggleWalls" title="Toggle Outer Walls" aria-label="Toggle walls">Wall</button>
      <button class="flag--ghost" :class="{ 'flag--active': showInteractSpots }" @click="toggleInteractSpots" title="Toggle Interact Spots" aria-label="Toggle interact spots">Interact</button>
      <button class="flag--ghost" :class="{ 'flag--active': showObjectHighlights }" @click="toggleObjectHighlights" title="Toggle object highlights" aria-label="Toggle object highlights">Highlight</button>
    </div>
    <WalkableGridPanel />

    <ModalShell :open="showSaveOrigin && !!draftObject" title="Save Placed Object as Origin" max-width="360px" width="min(360px, calc(100vw - 32px))" max-height="calc(100vh - 32px)" @close="cancelDrawnOrigin">
      <div class="modal__body">
        <div class="editor__preview" :style="{ width: `${Math.min(draftObject?.w ?? 0, 220)}px`, height: `${Math.min(draftObject?.h ?? 0, 140)}px`, background: originBgColor || 'var(--bg-primary)' }" />
        <input class="input--disabled" :value="`${(draftObject?.w ?? 0) / canvas.tileSize} × ${(draftObject?.h ?? 0) / canvas.tileSize} tiles`" readonly aria-label="Object size" />
        <label class="form__row">
          <span class="label--fixed">Name</span>
          <input v-model="originName" class="input--grow" type="text" placeholder="Object name" autofocus />
        </label>
        <label class="form__row">
          <span class="label--fixed">Background</span>
          <ColorInput v-model="originBgColor" :allow-transparent="true" placeholder="#RRGGBB or transparent" aria-label="Origin background color" />
        </label>
        <div class="form__row">
          <button class="flag--ghost" type="button" @click="cancelDrawnOrigin">Cancel</button>
          <button class="flag--success" type="button" :disabled="!originName.trim()" @click="saveDrawnOrigin">Save as Origin</button>
        </div>
      </div>
    </ModalShell>
  </div>
</template>

<style scoped>
.editor__preview {
  align-self: center;
  max-width: 100%;
  border: 1px solid var(--accent-primary);
  background-image: linear-gradient(45deg, var(--bg-tertiary) 25%, transparent 25%), linear-gradient(-45deg, var(--bg-tertiary) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--bg-tertiary) 75%), linear-gradient(-45deg, transparent 75%, var(--bg-tertiary) 75%);
  background-size: 8px 8px;
  background-position:
    0 0,
    0 4px,
    4px -4px,
    -4px 0;
}

.editor__canvas {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: var(--bg-primary);
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--gap-md);
  user-select: none;
}

.editor__canvas--panning,
.editor__canvas--panning .editor__svg {
  cursor: grab;
}

.editor__canvas--dragging,
.editor__canvas--dragging .editor__svg {
  cursor: grabbing;
}

.editor__mode--draw .editor__svg {
  cursor: crosshair;
}

.editor__mode--move .editor__svg {
  cursor: grab;
}

.editor__mode--move.editor__canvas--dragging .editor__svg {
  cursor: grabbing;
}

.editor__svg {
  display: block;
  background: var(--bg-primary);
  box-shadow: 0 8px 32px color-mix(in srgb, var(--bg-primary) 50%, transparent);
}

.editor__svg--noevents,
.editor__svg--noevents * {
  pointer-events: none;
}

.editor__svg--passall {
  pointer-events: all;
}

.editor__svg:focus {
  outline: 2px solid var(--accent-primary);
}

.editor__canvas--selected {
  stroke: var(--accent-primary);
  stroke-width: 2px;
  fill: none;
  pointer-events: none;
}

.editor__canvas--highlight {
  stroke: var(--accent-primary);
  stroke-width: 1.5px;
  stroke-dasharray: 5 3;
  opacity: 0.9;
  fill: none;
  pointer-events: none;
}

:deep(.editor__canvas--nowall .svg_role__wall) {
  display: none;
}

.editor__canvas--linked {
  stroke: var(--accent-blue);
  stroke-width: 1.5px;
}

.editor__canvas--locked {
  opacity: 0.6;
}

.editor__canvas--collapsed {
  opacity: 0.4;
}

.editor__canvas--dragitem {
  opacity: 0.7;
}

.editor__tile {
  stroke-width: 0.5;
}

.editor__tile--walkable {
  fill: color-mix(in srgb, var(--accent-green) 12%, transparent);
  stroke: color-mix(in srgb, var(--accent-green) 20%, transparent);
}

.editor__tile--entrance {
  fill: color-mix(in srgb, var(--accent-blue) 30%, transparent);
  stroke: color-mix(in srgb, var(--accent-green) 20%, transparent);
}

.editor__tile--blocked {
  fill: color-mix(in srgb, var(--accent-red) 12%, transparent);
  stroke: color-mix(in srgb, var(--accent-green) 20%, transparent);
}

.editor__tile--obj-walkable {
  fill: color-mix(in srgb, var(--accent-green) 20%, transparent);
  stroke: color-mix(in srgb, var(--accent-gold) 15%, transparent);
  stroke-width: 0.5;
}

.editor__tile--obj-blocked {
  fill: color-mix(in srgb, var(--accent-red) 20%, transparent);
  stroke: color-mix(in srgb, var(--accent-gold) 15%, transparent);
  stroke-width: 0.5;
}

.editor__ruler--passive {
  pointer-events: none;
}

.editor__badge--float {
  position: absolute;
  top: var(--gap-md);
  left: 50%;
  transform: translateX(-50%);
  padding: var(--gap-xs) var(--gap-sm);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  font-size: var(--font-xs);
  text-transform: capitalize;
  z-index: var(--z-layer-2);
}

.editor__badge--draw {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.editor__badge--object {
  border-color: var(--accent-blue);
  color: var(--accent-blue);
}

.editor__badge--move {
  border-color: var(--accent-green);
  color: var(--accent-green);
}

.editor__badge--npcpreview {
  border-color: var(--accent-blue);
  color: var(--accent-blue);
}

.editor__hint {
  position: absolute;
  top: 44px;
  left: 50%;
  transform: translateX(-50%);
  font-size: var(--font-xs);
  color: var(--text-dim);
  background: var(--bg-primary);
  padding: var(--gap-xs) var(--gap-sm);
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-dim);
  white-space: nowrap;
  pointer-events: none;
  z-index: var(--z-layer-2);
}

.editor__title {
  position: absolute;
  bottom: var(--gap-md);
  left: var(--gap-md);
  padding: var(--gap-xs) var(--gap-sm);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  font-size: var(--font-xs);
  z-index: var(--z-layer-2);
  height: fit-content;
}

.editor__labels {
  display: inline-flex;
  align-items: center;
  gap: var(--gap-xs);
}

.editor__name {
  font-weight: 600;
}

.editor__nav {
  position: absolute;
  top: var(--gap-md);
  right: var(--gap-md);
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  padding: var(--gap-xs) var(--gap-sm);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  z-index: var(--z-layer-2);
}

.editor__coords {
  position: absolute;
  bottom: 44px;
  left: var(--gap-md);
  padding: var(--gap-xs) var(--gap-sm);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  font-size: var(--font-xs);
  z-index: var(--z-layer-1);
  height: fit-content;
  color: var(--text-dim);
  font-variant-numeric: tabular-nums;
}

.editor__controls {
  position: absolute;
  bottom: var(--gap-md);
  right: var(--gap-md);
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  padding: var(--gap-xs);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  z-index: var(--z-layer-2);
}

.editor__zoom {
  min-width: 30px;
  text-align: center;
  font-size: var(--font-xs);
  font-variant-numeric: tabular-nums;
}

.floor__wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.floor__trigger {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  padding: 0 var(--gap-xs);
  background: transparent;
  border: none;
  border-radius: var(--radius-xs);
  cursor: pointer;
  flex-shrink: 0;
}

.floor__trigger:hover {
  color: var(--accent-primary);
}

.floor__tag {
  font-size: var(--font-xs);
  opacity: 0.7;
  font-weight: 700;
  color: var(--accent-primary);
}

.floor__text {
  font-weight: 600;
  font-size: var(--font-sm);
}

.floor__caret {
  font-size: var(--font-xs);
  opacity: 0.7;
  color: var(--text-primary);
  transition: transform var(--duration-fast) ease-out;
}

.floor__caret--rotated {
  transform: rotate(180deg);
}

.floor__menu {
  position: absolute;
  top: calc(100% + var(--gap-xs));
  right: 0;
  min-width: 144px;
  max-height: 40vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--bg-primary) 50%, transparent);
  z-index: var(--z-layer-2);
  padding: var(--gap-xs);
}

.floor__item {
  display: flex;
  align-items: center;
  gap: var(--gap-sm);
  padding: var(--gap-xs) var(--gap-sm);
  background: transparent;
  border: none;
  border-radius: var(--radius-xs);
  cursor: pointer;
  text-align: left;
  width: 100%;
}

.floor__item:hover {
  background: var(--bg-secondary);
}

.floor__item--active {
  background: color-mix(in srgb, var(--accent-primary) 12%, transparent);
}

.floor__label {
  font-size: var(--font-xs);
  font-weight: 700;
  opacity: 0.8;
  flex-shrink: 0;
}

.floor__name {
  font-weight: 600;
  font-size: var(--font-sm);
}
</style>
