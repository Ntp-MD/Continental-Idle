<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, inject } from "vue";
import { useAssetsStore, dragState, endAssetDrag, endRoomTemplateDrag } from "../blueprintStore";
import { findAssetCached, validateRoomAnchors } from "../assetUtils";
import { svgTransform as svgTransformGeo, roundedRectPath } from "../geometry";
import { useToast } from "@/composables/useToast";
import { useConfirm } from "@/composables/useConfirm";
import type { ObjectData, RoomData, EntityRef, AnchorPoint } from "../types";
import { resolveObjectDef } from "../types";
import { useCanvasViewport } from "../composables/useCanvasViewport";
import { useCanvasSelection } from "../composables/useCanvasSelection";
import { useCanvasDragDrop } from "../composables/useCanvasDragDrop";
import { useWallPaintTool } from "../composables/useWallPaintTool";
import WalkableGridPanel from "./WalkableGridPanel.vue";
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
  if (floorNavOpen.value && !el.closest(".floor__trigger") && !el.closest(".floor__navmenu")) closeFloorNav();
}
function onFloorNavKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && floorNavOpen.value) closeFloorNav();
}

const npcSimulation = inject("npcSimulation") as ReturnType<typeof useNpcSimulation>;
const { npcs, start: startNpcSimulation, stop: stopNpcSimulation } = npcSimulation;
const currentFloorNpcs = computed(() => npcs.value.filter((n) => n.floorId === store.state.currentFloorId));

watch(
  () => store.state.mode,
  (mode, previousMode) => {
    if (mode === "npc-preview") {
      startNpcSimulation();
    }
    if (previousMode === "npc-preview" && mode !== "npc-preview") stopNpcSimulation();
  },
);

const invalidAnchorKeys = computed(() => {
  const currentFloor = floor.value;
  if (!currentFloor) return new Set<string>();

  const keys = new Set<string>();
  const objects = currentFloor.objects;
  for (const room of currentFloor.rooms) {
    for (const { x, y } of validateRoomAnchors(room, objects, store.assetMap()).invalid) {
      keys.add(`${room.id}:${x}:${y}`);
    }
  }
  return keys;
});

function isInvalidAnchor(room: RoomData, anchor: AnchorPoint): boolean {
  return invalidAnchorKeys.value.has(`${room.id}:${anchor.x}:${anchor.y}`);
}

const ROOM_DEFAULT_FILL = "#e8e4dc";
const VIEW_TOGGLE_KEY = "blueprint-view-toggles";
const savedToggles = (() => {
  try {
    return JSON.parse(sessionStorage.getItem(VIEW_TOGGLE_KEY) ?? "{}");
  } catch {
    return {};
  }
})();
const showWalkableOverlay = ref(savedToggles.showWalkableOverlay ?? false);

const modeLabel = computed(() => {
  const labels: Record<string, string> = {
    wall: "Wall",
    object: "Object",
    move: "Move",
    erase: "Erase",
    "npc-preview": "NPC Preview",
  };
  return (labels[store.state.mode] ?? store.state.mode) + " Mode";
});

const modeHint = computed(() => {
  const hints: Record<string, string> = {
    wall: "Click and drag to draw a room",
    object: "Drag an asset from the palette onto the canvas",
    move: "Click and drag an object to reposition it",
    erase: "Click room wall tiles to erase them",
    "npc-preview": "NPCs are simulating on this floor",
  };
  return hints[store.state.mode] ?? "";
});

const STREET_TILES = 8;
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
const { viewBox, zoomPercent, spaceDown, panning, svgRef, RULER_SIZE, fitToScreen, centerView, zoomBy, onWheel, startPan, onPanMouseDown, onPanMouseMove, onPanMouseUp, localPoint } = vp;

const wall = useWallPaintTool({
  localPoint,
  canPlaceRoom: store.canPlaceRoom,
  addWallObject: store.addWallObject,
  getMode: () => store.state.mode,
});
const { wallDrag, onWallMouseMove, onWallMouseUp } = wall;

const sel = useCanvasSelection({
  spaceDown,
  localPoint,
  canvasWidth: () => canvas.value.width,
  canvasHeight: () => canvas.value.height,
  startPan,
  floor,
  store: store,
  wallDrag,
  onWallMouseMove,
  onWallMouseUp,
  getMode: () => store.state.mode,
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
const { paletteValid, paletteGhost, paletteGhostParts, paletteGhostRect, roomTemplateGhostRect, roomTemplateValid, onWindowMouseMoveForDrag, onWindowMouseUpForDrag, onRoomTemplateMouseMove, onRoomTemplateMouseUp } = dd;

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

const moving = ref<{ type: "room" | "object"; id: string; offsetX: number; offsetY: number; startX: number; startY: number } | null>(null);

let _cycleClickPos: { x: number; y: number } | null = null;
let _cycleCandidates: EntityRef[] = [];
let _cycleIndex = 0;
const CYCLE_THRESHOLD = 6;

function hasOuterWall(obj: ObjectData): boolean {
  const def = resolveObjectDef(obj.rotation, findAssetCached(store.assetMap(), obj.type));
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
  for (const room of f.rooms) {
    if (p.x >= room.x && p.x <= room.x + room.w && p.y >= room.y && p.y <= room.y + room.h) {
      results.push({ type: "room", id: room.id });
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

function onRoomMouseDown(e: MouseEvent, id: string) {
  if (e.button === 1 || spaceDown.value) return;
  if (store.state.mode === "npc-preview") return;
  e.stopPropagation();
  if (e.shiftKey || e.ctrlKey || e.metaKey) {
    store.toggleMultiSelect(id, true);
    return;
  }
  const p = localPoint(e);
  if (!p) return;
  const cycled = tryCycleSelect(p);
  if (cycled) {
    store.select(cycled);
    if (cycled.type !== "room" || cycled.id !== id) return;
  } else {
    store.select({ type: "room", id });
  }
  const targetRoom = floor.value?.rooms.find((r) => r.id === id);
  if (targetRoom?.locked) return;
  moving.value = { type: "room", id, offsetX: p.x - (targetRoom?.x ?? 0), offsetY: p.y - (targetRoom?.y ?? 0), startX: p.x, startY: p.y };
  _dragHasMoved = false;
  window.addEventListener("mousemove", onMoveMouseMove);
  window.addEventListener("mouseup", onMoveMouseUp);
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

function onMoveMouseMove(e: MouseEvent) {
  if (!moving.value) return;
  const p = localPoint(e);
  if (!p) return;
  const threshold = moving.value.type === "room" ? 6 : 2;
  if (!_dragHasMoved) {
    if (Math.abs(p.x - moving.value.startX) < threshold && Math.abs(p.y - moving.value.startY) < threshold) return;
    _dragHasMoved = true;
  }
  const newX = p.x - moving.value.offsetX;
  const newY = p.y - moving.value.offsetY;
  store.moveSelectedTo(newX, newY);
}

async function onMoveMouseUp() {
  window.removeEventListener("mousemove", onMoveMouseMove);
  window.removeEventListener("mouseup", onMoveMouseUp);
  if (moving.value) {
    if (_dragHasMoved) await store.commitMove();
  }
  _dragHasMoved = false;
  moving.value = null;
}

function onContainerMouseMove(e: MouseEvent) {
  if (dragState.assetId) return;
  if (dragState.roomTemplateId) return;
  const p = localPoint(e);
  if (!p) return;
  mouseCoords.value = { x: Math.round(p.x), y: Math.round(p.y) };
  rulerMouseX.value = p.x;
  rulerMouseY.value = p.y;
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
        message: `Delete ${count} selected ${count === 1 ? sel.type : "item(s)"}? This cannot be undone via UI (only Ctrl+Z).`,
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
    } else if (store.state.selectionState.primary?.type === "room") {
      useToast().info("Rotate only works on objects, not rooms");
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
      if (sel?.type === "room") {
        const r = store.selectedRoom();
        if (r) {
          store.moveSelectedTo(r.x + dx, r.y + dy);
          await store.commitMove();
        }
      } else if (sel?.type === "object") {
        const o = store.selectedObject();
        if (o) {
          store.moveSelectedTo(o.x + dx, o.y + dy);
          await store.commitMove();
        }
      }
    }
  } else if (e.key === "Escape") {
    if (dragState.assetId) endAssetDrag();
    if (dragState.roomTemplateId) endRoomTemplateDrag();
    if (wallDrag.value) {
      window.removeEventListener("mousemove", onWallMouseMove);
      window.removeEventListener("mouseup", onWallMouseUp);
      wallDrag.value = null;
    }
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
  window.removeEventListener("mousemove", onWallMouseMove);
  window.removeEventListener("mouseup", onWallMouseUp);
  window.removeEventListener("mousemove", onBoxSelectMouseMove);
  window.removeEventListener("mouseup", onBoxSelectMouseUp);
  window.removeEventListener("mousemove", onWindowMouseMoveForDrag);
  window.removeEventListener("mouseup", onWindowMouseUpForDrag);
  window.removeEventListener("mousemove", onMoveMouseMove);
  window.removeEventListener("mouseup", onMoveMouseUp);
  window.removeEventListener("mousemove", onPanMouseMove);
  window.removeEventListener("mouseup", onPanMouseUp);
  window.removeEventListener("mousemove", onRoomTemplateMouseMove);
  window.removeEventListener("mouseup", onRoomTemplateMouseUp);
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
  return resolveObjectDef(obj.rotation, findAssetCached(store.assetMap(), obj.type));
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

function roomFillColor(room: RoomData): string {
  if (room.fillColor) return room.fillColor;
  switch (room.roomType) {
    case "wall":
      return "#c8c4bc";
    case "hallway":
      return "#e8e4dc";
    case "elevator":
      return "#d0e8d4";
    case "entrance":
      return "#f0e4c8";
    default:
      return ROOM_DEFAULT_FILL;
  }
}

function roomStrokeStyle(room: RoomData): string {
  switch (room.roomType) {
    case "wall":
      return "var(--text-primary)";
    case "entrance":
      return "var(--accent-gold)";
    case "elevator":
      return "var(--accent-blue)";
    default:
      return "var(--text-primary)";
  }
}

function roomStrokeWidth(room: RoomData): number {
  return room.roomType === "wall" ? 2 : 1.5;
}

function roomDashArray(room: RoomData): string | undefined {
  return room.roomType === "wall" ? "6 3" : undefined;
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
  return store.state.selectionState.items.some((item) => item.type === "object" && item.id === id);
}

function isRoomSelected(id: string): boolean {
  return store.state.selectionState.items.some((item) => item.type === "room" && item.id === id);
}
</script>

<template>
  <div
    :ref="vp.containerRef"
    class="editor__canvas"
    :class="{ editor__canvas__panning: spaceDown, editor__canvas__dragging: !!panning, 'editor__canvas-mode__wall': store.state.mode === 'wall', 'editor__canvas-mode__move': store.state.mode === 'move', 'editor__canvas-mode__erase': store.state.mode === 'erase' }"
    @wheel="onWheel"
    @mousedown="onPanMouseDown"
    @mousemove="onContainerMouseMove"
    @mouseleave="
      rulerMouseX = -1;
      rulerMouseY = -1;
    "
  >
    <svg ref="svgRef" class="editor__canvas__svg" :viewBox="viewBox" preserveAspectRatio="xMidYMid meet" role="application" aria-label="Blueprint editor canvas — use arrow keys to move selected objects, Delete to remove, R to rotate" tabindex="0" @mousedown="onCanvasMouseDown">
      <defs>
        <pattern id="grid" :width="canvas.tileSize" :height="canvas.tileSize" patternUnits="userSpaceOnUse">
          <path :d="`M ${canvas.tileSize} 0 L 0 0 0 ${canvas.tileSize}`" fill="none" :style="{ stroke: 'var(--border-dim)' }" stroke-width="0.5" />
        </pattern>
      </defs>

      <rect :width="canvas.width" :height="canvas.height" :style="{ fill: 'var(--bg-secondary)' }" />

      <!-- Street border: sidewalk + road + lane markings (8 tiles on all sides) -->
      <g v-if="showStreet" class="editor__street" style="pointer-events: none">
        <!-- Outer sidewalk (2 tiles, all sides) -->
        <rect :x="0" :y="0" :width="canvas.width" :height="streetSidewalkWidth" fill="#3a3a3a" />
        <rect :x="0" :y="canvas.height - streetSidewalkWidth" :width="canvas.width" :height="streetSidewalkWidth" fill="#3a3a3a" />
        <rect :x="0" :y="0" :width="streetSidewalkWidth" :height="canvas.height" fill="#3a3a3a" />
        <rect :x="canvas.width - streetSidewalkWidth" :y="0" :width="streetSidewalkWidth" :height="canvas.height" fill="#3a3a3a" />

        <!-- Road (4 tiles, all sides) -->
        <rect :x="streetSidewalkWidth" :y="streetSidewalkWidth" :width="canvas.width - streetSidewalkWidth * 2" :height="streetRoadWidth" fill="#2a2a2a" />
        <rect :x="streetSidewalkWidth" :y="canvas.height - streetSidewalkWidth - streetRoadWidth" :width="canvas.width - streetSidewalkWidth * 2" :height="streetRoadWidth" fill="#2a2a2a" />
        <rect :x="streetSidewalkWidth" :y="streetSidewalkWidth" :width="streetRoadWidth" :height="canvas.height - streetSidewalkWidth * 2" fill="#2a2a2a" />
        <rect :x="canvas.width - streetSidewalkWidth - streetRoadWidth" :y="streetSidewalkWidth" :width="streetRoadWidth" :height="canvas.height - streetSidewalkWidth * 2" fill="#2a2a2a" />

        <!-- Road lane markings (dashed center lines) -->
        <!-- Top road center line -->
        <line :x1="streetSidewalkWidth" :y1="streetSidewalkWidth + streetRoadWidth / 2" :x2="canvas.width - streetSidewalkWidth" :y2="streetSidewalkWidth + streetRoadWidth / 2" stroke="#8a8a8a" stroke-width="1" stroke-dasharray="12 8" opacity="0.5" />
        <!-- Bottom road center line -->
        <line :x1="streetSidewalkWidth" :y1="canvas.height - streetSidewalkWidth - streetRoadWidth / 2" :x2="canvas.width - streetSidewalkWidth" :y2="canvas.height - streetSidewalkWidth - streetRoadWidth / 2" stroke="#8a8a8a" stroke-width="1" stroke-dasharray="12 8" opacity="0.5" />
        <!-- Left road center line -->
        <line :x1="streetSidewalkWidth + streetRoadWidth / 2" :y1="streetSidewalkWidth" :x2="streetSidewalkWidth + streetRoadWidth / 2" :y2="canvas.height - streetSidewalkWidth" stroke="#8a8a8a" stroke-width="1" stroke-dasharray="12 8" opacity="0.5" />
        <!-- Right road center line -->
        <line :x1="canvas.width - streetSidewalkWidth - streetRoadWidth / 2" :y1="streetSidewalkWidth" :x2="canvas.width - streetSidewalkWidth - streetRoadWidth / 2" :y2="canvas.height - streetSidewalkWidth" stroke="#8a8a8a" stroke-width="1" stroke-dasharray="12 8" opacity="0.5" />

        <!-- Building area outline (subtle border separating street from building) -->
        <rect :x="buildingArea.x" :y="buildingArea.y" :width="buildingArea.w" :height="buildingArea.h" fill="none" stroke="var(--border-dim)" stroke-width="1" stroke-dasharray="4 4" opacity="0.6" />
      </g>

      <!-- Rulers (outside canvas, Photoshop-style) -->
      <g class="editor__ruler__grouppassive" style="pointer-events: none">
        <!-- Top ruler background -->
        <rect :x="-RULER_SIZE" :y="-RULER_SIZE" :width="canvas.width + RULER_SIZE" :height="RULER_SIZE" :style="{ fill: 'var(--bg-secondary)', stroke: 'var(--border-dim)' }" stroke-width="0.5" />
        <!-- Left ruler background -->
        <rect :x="-RULER_SIZE" :y="0" :width="RULER_SIZE" :height="canvas.height" :style="{ fill: 'var(--bg-secondary)', stroke: 'var(--border-dim)' }" stroke-width="0.5" />
        <!-- Corner square -->
        <rect :x="-RULER_SIZE" :y="-RULER_SIZE" :width="RULER_SIZE" :height="RULER_SIZE" :style="{ fill: 'var(--bg-card)', stroke: 'var(--border-dim)' }" stroke-width="0.5" />

        <!-- Top ruler ticks -->
        <g v-for="tick in rulerXTicks" :key="'rx' + tick.pos">
          <line v-if="tick.major" :x1="tick.pos" :y1="-RULER_SIZE" :x2="tick.pos" :y2="-2" :style="{ stroke: 'var(--text-primary)' }" stroke-width="1" />
          <text v-if="tick.major" :x="tick.pos + 3" :y="-5" font-size="12" font-weight="100" letter-spacing="1" fill="var(--accent-gold)">{{ tick.label }}</text>
          <line v-else :x1="tick.pos" :y1="-RULER_SIZE" :x2="tick.pos" :y2="-RULER_SIZE + 5" :style="{ stroke: 'var(--text-primary)' }" stroke-width="0.5" />
        </g>

        <!-- Left ruler ticks -->
        <g v-for="tick in rulerYTicks" :key="'ry' + tick.pos">
          <line v-if="tick.major" :x1="-RULER_SIZE" :y1="tick.pos" :x2="-2" :y2="tick.pos" :style="{ stroke: 'var(--text-primary)' }" stroke-width="1" />
          <text v-if="tick.major" :x="-5" :y="tick.pos + 3" font-size="12" font-weight="100" letter-spacing="1" fill="var(--accent-gold)" transform="rotate(-90)" :transform-origin="`-5 ${tick.pos}`">{{ tick.label }}</text>
          <line v-else :x1="-RULER_SIZE" :y1="tick.pos" :x2="-RULER_SIZE + 5" :y2="tick.pos" :style="{ stroke: 'var(--text-primary)' }" stroke-width="0.5" />
        </g>

        <!-- Canvas edge guide lines (extend into rulers) -->
        <line :x1="0" :y1="-RULER_SIZE" :x2="0" :y2="0" :style="{ stroke: 'var(--accent-green)' }" stroke-width="1.5" />
        <line :x1="canvas.width" :y1="-RULER_SIZE" :x2="canvas.width" :y2="0" :style="{ stroke: 'var(--accent-green)' }" stroke-width="1.5" />
        <line :x1="-RULER_SIZE" :y1="0" :x2="0" :y2="0" :style="{ stroke: 'var(--accent-green)' }" stroke-width="1.5" />
        <line :x1="-RULER_SIZE" :y1="canvas.height" :x2="0" :y2="canvas.height" :style="{ stroke: 'var(--accent-green)' }" stroke-width="1.5" />

        <!-- Mouse position indicators -->
        <line v-if="rulerMouseX >= 0" :x1="rulerMouseX" :y1="-RULER_SIZE" :x2="rulerMouseX" :y2="0" :style="{ stroke: 'var(--accent-gold)' }" stroke-width="1" />
        <line v-if="rulerMouseY >= 0" :x1="-RULER_SIZE" :y1="rulerMouseY" :x2="0" :y2="rulerMouseY" :style="{ stroke: 'var(--accent-gold)' }" stroke-width="1" />
      </g>

      <g v-if="floor && floor.rooms.length === 0 && floor.objects.length === 0">
        <text :x="canvas.width / 2" :y="canvas.height / 2 - 10" text-anchor="middle" font-size="16" :style="{ fill: 'var(--text-primary)', pointerEvents: 'none' }">Empty floor — start drawing walls or drag objects from the palette</text>
      </g>

      <g v-if="floor">
        <g v-for="room in floor.rooms" :key="room.id" @mousedown="onRoomMouseDown($event, room.id)">
          <path
            v-if="roundedRectPath(room.x + (room.padding ?? 0), room.y + (room.padding ?? 0), room.w - (room.padding ?? 0) * 2, room.h - (room.padding ?? 0) * 2, room.rx)"
            :d="roundedRectPath(room.x + (room.padding ?? 0), room.y + (room.padding ?? 0), room.w - (room.padding ?? 0) * 2, room.h - (room.padding ?? 0) * 2, room.rx)!"
            :fill="roomFillColor(room)"
            :style="{ stroke: roomStrokeStyle(room), cursor: moving?.id === room.id ? 'grabbing' : 'move' }"
            :stroke-width="roomStrokeWidth(room)"
            :stroke-dasharray="roomDashArray(room)"
            :class="{ editor__canvas__dragitem: moving?.id === room.id, editor__canvas__locked: room.locked }"
          />
          <rect
            v-else
            :x="room.x + (room.padding ?? 0)"
            :y="room.y + (room.padding ?? 0)"
            :width="room.w - (room.padding ?? 0) * 2"
            :height="room.h - (room.padding ?? 0) * 2"
            :fill="roomFillColor(room)"
            :style="{ stroke: roomStrokeStyle(room), cursor: moving?.id === room.id ? 'grabbing' : 'move' }"
            :stroke-width="roomStrokeWidth(room)"
            :stroke-dasharray="roomDashArray(room)"
            :rx="room.radius ?? 0"
            :class="{ editor__canvas__dragitem: moving?.id === room.id, editor__canvas__locked: room.locked }"
          />
          <path
            v-if="isRoomSelected(room.id) && roundedRectPath(room.x + (room.padding ?? 0), room.y + (room.padding ?? 0), room.w - (room.padding ?? 0) * 2, room.h - (room.padding ?? 0) * 2, room.rx)"
            :d="roundedRectPath(room.x + (room.padding ?? 0), room.y + (room.padding ?? 0), room.w - (room.padding ?? 0) * 2, room.h - (room.padding ?? 0) * 2, room.rx)!"
            fill="none"
            class="editor__canvas__selected"
            style="pointer-events: none"
          />
          <rect v-else-if="isRoomSelected(room.id)" :x="room.x + (room.padding ?? 0)" :y="room.y + (room.padding ?? 0)" :width="room.w - (room.padding ?? 0) * 2" :height="room.h - (room.padding ?? 0) * 2" fill="none" :rx="room.radius ?? 0" class="editor__canvas__selected" style="pointer-events: none" />
          <template v-if="isRoomSelected(room.id) || store.state.mode === 'npc-preview' || showWalkableOverlay">
            <g v-for="(anchor, index) in room.anchorPoints ?? [{ x: room.w / 2, y: room.h / 2 }]" :key="`anchor-${room.id}-${index}`" style="pointer-events: none">
              <circle :cx="room.x + anchor.x" :cy="room.y + anchor.y" r="5" :fill="isInvalidAnchor(room, anchor) ? 'var(--accent-red)' : 'var(--accent-green)'" stroke="var(--text-bright)" stroke-width="1" />
              <text :x="room.x + anchor.x" :y="room.y + anchor.y - 8" text-anchor="middle" font-size="7" :fill="isInvalidAnchor(room, anchor) ? 'color-mix(in srgb, var(--accent-red) 70%, var(--bg-primary))' : 'color-mix(in srgb, var(--accent-green) 70%, var(--bg-primary))'">A{{ index + 1 }}</text>
            </g>
            <template v-for="(entrance, index) in room.entrances ?? []" :key="`entrance-${room.id}-${index}`">
              <rect v-if="entrance.side === 'top' || entrance.side === 'bottom'" :x="room.x + entrance.offset" :y="room.y + (entrance.side === 'top' ? 0 : room.h - 3)" :width="entrance.width" height="6" fill="var(--accent-gold)" style="pointer-events: none" />
              <rect v-else :x="room.x + (entrance.side === 'left' ? 0 : room.w - 3)" :y="room.y + entrance.offset" width="6" :height="entrance.width" fill="var(--accent-gold)" style="pointer-events: none" />
            </template>
          </template>
          <text v-if="showLabels" :x="room.x + room.w / 2" :y="room.y + room.h / 2" text-anchor="middle" dominant-baseline="middle" font-size="11" :style="{ fill: 'var(--text-primary)', textTransform: 'uppercase', pointerEvents: 'none' }">
            {{ escapeSvgText(room.label) }}
          </text>
        </g>

        <g v-for="obj in floor.objects" :key="obj.id" @mousedown="onObjectMouseDown($event, obj.id)">
          <rect :x="obj.x" :y="obj.y" :width="obj.w" :height="obj.h" fill="transparent" style="pointer-events: all" />
          <template v-if="assetSvg(obj.type)">
            <rect :x="obj.x + (obj.padding ?? 0)" :y="obj.y + (obj.padding ?? 0)" :width="obj.w - (obj.padding ?? 0) * 2" :height="obj.h - (obj.padding ?? 0) * 2" :fill="objFillColor(obj)" :class="{ editor__canvas__collapsed: obj.collapsed }" :style="{ cursor: moving?.id === obj.id ? 'grabbing' : 'move' }" />
            <g v-svg-content="assetSvg(obj.type)" :transform="svgTransform(obj)" :data-obj-id="obj.id" :class="{ editor__canvas__collapsed: obj.collapsed, editor__canvas__dragitem: moving?.id === obj.id, editor__canvas__locked: obj.locked, editor__canvas__nowall: !hasOuterWall(obj) }" :style="{ cursor: moving?.id === obj.id ? 'grabbing' : 'move' }" />
          </template>
          <path
            v-else-if="roundedRectPath(obj.x + (obj.padding ?? 0), obj.y + (obj.padding ?? 0), obj.w - (obj.padding ?? 0) * 2, obj.h - (obj.padding ?? 0) * 2, obj.rx)"
            :d="roundedRectPath(obj.x + (obj.padding ?? 0), obj.y + (obj.padding ?? 0), obj.w - (obj.padding ?? 0) * 2, obj.h - (obj.padding ?? 0) * 2, obj.rx)!"
            :fill="objFillColor(obj)"
            :stroke-width="objIsWall(obj) ? 2 : 1"
            :stroke-dasharray="objIsWall(obj) ? '6 3' : undefined"
            :class="{ editor__canvas__collapsed: obj.collapsed, editor__canvas__dragitem: moving?.id === obj.id, editor__canvas__linked: !!obj.linkGroupId, editor__canvas__locked: obj.locked }"
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
            :class="{ editor__canvas__collapsed: obj.collapsed, editor__canvas__dragitem: moving?.id === obj.id, editor__canvas__linked: !!obj.linkGroupId, editor__canvas__locked: obj.locked }"
            :style="{ stroke: 'var(--text-primary)', cursor: moving?.id === obj.id ? 'grabbing' : 'move' }"
          />
          <template v-if="showWalkableOverlay && objDef(obj).walkableGrid">
            <template v-for="(row, gr) in objDef(obj).walkableGrid" :key="'wg_' + obj.id + '-' + gr">
              <rect
                v-for="(cell, gc) in row"
                :key="'wg_' + obj.id + '-' + gr + '-' + gc"
                :x="obj.x + gc * (obj.w / row.length)"
                :y="obj.y + gr * (obj.h / objDef(obj).walkableGrid!.length)"
                :width="obj.w / row.length"
                :height="obj.h / objDef(obj).walkableGrid!.length"
                :fill="cell ? 'color-mix(in srgb, var(--accent-green) 20%, transparent)' : 'color-mix(in srgb, var(--accent-red) 20%, transparent)'"
                stroke="color-mix(in srgb, var(--accent-gold) 15%, transparent)"
                :stroke-width="0.5"
                style="pointer-events: none"
              />
            </template>
          </template>
          <rect v-if="isObjectSelected(obj.id)" :x="obj.x + (obj.padding ?? 0)" :y="obj.y + (obj.padding ?? 0)" :width="obj.w - (obj.padding ?? 0) * 2" :height="obj.h - (obj.padding ?? 0) * 2" fill="none" :rx="obj.radius ?? 0" class="editor__canvas__selected" style="pointer-events: none" />
          <text v-if="showLabels" :x="obj.x + obj.w / 2" :y="obj.y + obj.h / 2 + (obj.labelPadding ?? 0)" text-anchor="middle" dominant-baseline="middle" font-size="8" :style="{ fill: objLabelColor(obj), pointerEvents: 'none' }">
            {{ assetLabel(obj.type) }}
          </text>
          <g v-if="obj.linkGroupId" style="pointer-events: none">
            <circle :cx="obj.x + obj.w - 4" :cy="obj.y + 4" r="3" fill="var(--accent-blue)" stroke="var(--bg-primary)" stroke-width="0.5" />
            <text :x="obj.x + obj.w - 4" :y="obj.y + 5.5" text-anchor="middle" font-size="4" fill="var(--bg-primary)">L</text>
          </g>
          <template v-if="(isObjectSelected(obj.id) || store.state.mode === 'npc-preview' || showWalkableOverlay) && objDef(obj).anchorPoints && objDef(obj).anchorPoints!.length > 0">
            <g v-for="(anchor, aIdx) in objDef(obj).anchorPoints" :key="`o-anchor-${obj.id}-${aIdx}`" style="pointer-events: none">
              <circle :cx="obj.x + anchor.x" :cy="obj.y + anchor.y" r="4" fill="var(--accent-green)" stroke="var(--text-bright)" stroke-width="0.8" />
              <text :x="obj.x + anchor.x" :y="obj.y + anchor.y - 6" text-anchor="middle" font-size="5" fill="color-mix(in srgb, var(--accent-green) 70%, var(--bg-primary))">A{{ aIdx + 1 }}</text>
            </g>
          </template>
        </g>

        <g v-if="store.state.mode === 'npc-preview'" class="editor__npc__layeroverlay" style="pointer-events: none">
          <g v-for="npc in currentFloorNpcs" :key="npc.id">
            <circle :cx="npc.x" :cy="npc.y" r="6" :fill="npc.color" opacity="0.25" />
            <circle :cx="npc.x" :cy="npc.y" r="4" :fill="npc.color" stroke="var(--text-bright)" stroke-width="1" />
          </g>
        </g>
      </g>

      <rect v-if="showGrid" :width="canvas.width" :height="canvas.height" fill="url(#grid)" style="pointer-events: none" />

      <rect :width="canvas.width" :height="canvas.height" fill="none" :style="{ stroke: 'var(--border-dim)' }" stroke-width="2" />

      <rect
        v-if="wallDrag"
        :x="wallDrag.x"
        :y="wallDrag.y"
        :width="wallDrag.w"
        :height="wallDrag.h"
        :style="{
          fill: wallDrag.valid ? 'color-mix(in srgb, var(--accent-green) 15%, transparent)' : 'color-mix(in srgb, var(--accent-red) 15%, transparent)',
          stroke: wallDrag.valid ? 'var(--accent-green)' : 'var(--accent-red)',
        }"
        stroke-width="1.5"
        stroke-dasharray="4 3"
      />

      <rect v-if="boxSelect && boxSelect.w > 4" :x="boxSelect.x" :y="boxSelect.y" :width="boxSelect.w" :height="boxSelect.h" :style="{ fill: 'color-mix(in srgb, var(--accent-gold) 15%, transparent)', stroke: 'var(--accent-gold)', pointerEvents: 'none' }" stroke-width="1.5" stroke-dasharray="4 3" />

      <g v-if="dragState.assetId && paletteGhost && paletteGhostParts">
        <rect v-for="(p, i) in paletteGhostParts" :key="'ghost_part_' + i" :x="p.x" :y="p.y" :width="p.w" :height="p.h" :style="{ fill: 'color-mix(in srgb, var(--accent-blue) 15%, transparent)', stroke: 'var(--accent-blue)' }" stroke-width="1.5" stroke-dasharray="4 3" />
      </g>
      <g v-else-if="dragState.assetId && paletteGhost && paletteGhostRect">
        <rect :x="paletteGhostRect.x" :y="paletteGhostRect.y" :width="paletteGhostRect.w" :height="paletteGhostRect.h" :style="{ fill: paletteValid ? 'color-mix(in srgb, var(--accent-green) 35%, transparent)' : 'color-mix(in srgb, var(--accent-red) 35%, transparent)', stroke: paletteValid ? 'var(--accent-green)' : 'var(--accent-red)' }" stroke-width="1.5" />
      </g>

      <g v-if="dragState.roomTemplateId && roomTemplateGhostRect">
        <rect
          :x="roomTemplateGhostRect.x"
          :y="roomTemplateGhostRect.y"
          :width="roomTemplateGhostRect.w"
          :height="roomTemplateGhostRect.h"
          :style="{ fill: roomTemplateValid ? 'color-mix(in srgb, var(--accent-green) 35%, transparent)' : 'color-mix(in srgb, var(--accent-red) 35%, transparent)', stroke: roomTemplateValid ? 'var(--accent-green)' : 'var(--accent-red)' }"
          stroke-width="1.5"
          stroke-dasharray="4 3"
        />
      </g>
    </svg>

    <div class="editor__floor__titlefloat" v-if="floor">
      <span class="editor__floor__labelhstack" :style="{ color: floor.labelColor || undefined }">{{ floor.label }}</span>
      <span class="editor__floor__namebold">{{ floor.name }}</span>
    </div>

    <div class="editor__floor__navhstack" v-if="floor">
      <div class="floor__triggerwrap">
        <button class="floor__trigger" @click.stop="toggleFloorNav" :aria-expanded="floorNavOpen" aria-haspopup="listbox" title="Switch floor" aria-label="Switch floor">
          <span class="floor__trigger__label" :style="{ color: floor.labelColor || undefined }">{{ floor.label }}</span>
          <span class="floor__trigger__name">{{ floor.name }}</span>
          <span class="floor__trigger__caret" :class="{ floor__trigger__caretrotated: floorNavOpen }">▾</span>
        </button>
        <div v-if="floorNavOpen" class="floor__navmenu" role="listbox" aria-label="Floors">
          <button v-for="f in floors" :key="f.id" class="floor__navmenu__item" :class="{ floor__navmenu__itemactive: f.id === store.state.currentFloorId }" role="option" :aria-selected="f.id === store.state.currentFloorId" @click="selectFloorNav(f.id)">
            <span class="floor__navmenu__label" :style="{ color: f.labelColor || undefined }">{{ f.label }}</span>
            <span class="floor__navmenu__name">{{ f.name }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="editor__modebadge__float" :class="`editor__modebadge__${store.state.mode.replace('-', '')}`">
      {{ modeLabel }}
    </div>
    <div class="editor__mode__hintfloat" v-if="modeHint">
      {{ modeHint }}
    </div>

    <div class="editor__canvas__coords">{{ mouseCoords.x }}, {{ mouseCoords.y }}</div>

    <div class="editor__zoom__controlshstack">
      <button class="editor__zoombtn__icon" @click="zoomBy(1 / 1.25)" title="Zoom Out (-)" aria-label="Zoom out">−</button>
      <span class="editor__zoom__displaylabel" aria-label="Zoom level">{{ zoomPercent }}%</span>
      <button class="editor__zoombtn__icon" @click="zoomBy(1.25)" title="Zoom In (+)" aria-label="Zoom in">+</button>
      <button class="editor__zoombtn__icon editor__zoom__control" @click="fitToScreen" title="Fit to Screen (Ctrl+0)" aria-label="Fit to screen">Fit</button>
      <button class="editor__zoombtn__icon editor__zoom__control" @click="centerView" title="Center View" aria-label="Center view">Center</button>
      <button class="editor__zoombtn__icon editor__zoom__control" @click="toggleGrid" title="Toggle Grid" aria-label="Toggle grid">Grid</button>
      <button class="editor__zoombtn__icon editor__zoom__control" @click="toggleLabels" title="Toggle Labels" aria-label="Toggle labels">Labels</button>
      <button class="editor__zoombtn__icon editor__zoom__control" :class="{ editor__zoombtn__active: showStreet }" @click="toggleStreet" title="Toggle Street" aria-label="Toggle street">Street</button>
      <button class="editor__zoombtn__icon editor__zoom__control" :class="{ editor__zoombtn__active: showWalkableOverlay }" @click="toggleWalkableOverlay" title="Toggle Navigation View (walkable + anchors + entrances)" aria-label="Toggle navigation view">Nav</button>
    </div>
    <WalkableGridPanel />
  </div>
</template>

<style scoped>
.editor__canvas {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: var(--bg-primary);
  min-width: 0;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--gap-md);
  user-select: none;
}

.editor__canvas__panning {
  cursor: grab !important;
}

.editor__canvas__dragging {
  cursor: grabbing !important;
}

.editor__canvas-mode__wall .editor__canvas__svg,
.editor__canvas-mode__erase .editor__canvas__svg {
  cursor: crosshair;
}

.editor__canvas-mode__move .editor__canvas__svg {
  cursor: grab;
}

.editor__canvas-mode__move.editor__canvas__dragging .editor__canvas__svg {
  cursor: grabbing;
}

.editor__canvas__svg {
  display: block;
  background: var(--bg-primary);
  box-shadow: 0 8px 32px color-mix(in srgb, var(--bg-primary) 50%, transparent);
}

.editor__canvas__svg:focus {
  outline: 2px solid var(--accent-gold);
}

.editor__canvas__selected {
  stroke: var(--accent-gold);
  stroke-width: 2px;
  fill: none;
  pointer-events: none;
}

:deep(.editor__canvas__nowall .svg_role__wall) {
  display: none;
}

.editor__canvas__linked {
  stroke: var(--accent-blue);
  stroke-width: 1.5px;
}

.editor__canvas__locked {
  opacity: 0.6;
}

.editor__canvas__collapsed {
  opacity: 0.4;
}

.editor__canvas__dragitem {
  opacity: 0.7;
}

.editor__zoom__control {
  min-width: 48px;
  text-align: center;
}

.editor__ruler__grouppassive {
  pointer-events: none;
}

.editor__modebadge__float {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  padding: var(--gap-xs) var(--gap-sm);
  background: var(--bg-card);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  font-size: var(--font-xs);
  text-transform: capitalize;
  z-index: 50;
}

.editor__modebadge__wall {
  border-color: var(--accent-gold);
  color: var(--accent-gold);
}

.editor__modebadge__object {
  border-color: var(--accent-blue);
  color: var(--accent-blue);
}

.editor__modebadge__move {
  border-color: var(--accent-green);
  color: var(--accent-green);
}

.editor__modebadge__erase {
  border-color: var(--accent-red);
  color: var(--accent-red);
}

.editor__modebadge__npcpreview {
  border-color: var(--accent-blue);
  color: var(--accent-blue);
}

.editor__mode__hintfloat {
  position: absolute;
  top: 44px;
  left: 50%;
  transform: translateX(-50%);
  font-size: var(--font-xs);
  color: var(--text-dim);
  background: var(--bg-card);
  padding: var(--gap-xs) var(--gap-sm);
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-dim);
  white-space: nowrap;
  pointer-events: none;
  z-index: 50;
}

.editor__floor__titlefloat {
  position: absolute;
  bottom: 16px;
  left: 16px;
  padding: var(--gap-xs) var(--gap-sm);
  background: var(--bg-card);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  font-size: var(--font-xs);
  z-index: 50;
  height: fit-content;
}

.editor__floor__labelhstack {
  display: inline-flex;
  align-items: center;
  gap: var(--gap-xs);
}

.editor__floor__namebold {
  font-weight: 600;
}

.editor__floor__navhstack {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  padding: var(--gap-xs) var(--gap-sm);
  background: var(--bg-card);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  z-index: 50;
}

.editor__canvas__coords {
  position: absolute;
  bottom: 44px;
  left: 16px;
  padding: var(--gap-xs) var(--gap-sm);
  background: var(--bg-card);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  font-size: var(--font-xs);
  z-index: 49;
  height: fit-content;
  color: var(--text-dim);
  font-variant-numeric: tabular-nums;
}

.editor__zoom__controlshstack {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  padding: var(--gap-xs);
  background: var(--bg-card);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  z-index: 50;
}

.editor__zoombtn__icon {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.editor__zoombtn__active {
  background: color-mix(in srgb, var(--accent-gold) 12%, transparent);
  border-color: var(--accent-gold);
  color: var(--accent-gold);
}

.editor__zoom__displaylabel {
  min-width: 48px;
  text-align: center;
  font-size: var(--font-xs);
}

.editor__npc__layeroverlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.floor__triggerwrap {
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
  color: var(--accent-gold);
}

.floor__trigger__label {
  font-size: var(--font-xs);
  opacity: 0.7;
  font-weight: 700;
  color: var(--accent-gold);
}

.floor__trigger__name {
  font-weight: 600;
  font-size: var(--font-sm);
}

.floor__trigger__caret {
  font-size: var(--font-xs);
  opacity: 0.7;
  color: var(--text-primary);
  transition: transform var(--duration-fast) ease-out;
}

.floor__trigger__caretrotated {
  transform: rotate(180deg);
}

.floor__navmenu {
  position: absolute;
  top: calc(100% + var(--gap-xs));
  right: 0;
  min-width: 200px;
  max-height: 320px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--bg-primary) 50%, transparent);
  z-index: 60;
  padding: var(--gap-xs);
}

.floor__navmenu__item {
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

.floor__navmenu__item:hover {
  background: var(--bg-secondary);
}

.floor__navmenu__itemactive {
  background: color-mix(in srgb, var(--accent-gold) 12%, transparent);
}

.floor__navmenu__label {
  font-size: var(--font-xs);
  font-weight: 700;
  opacity: 0.8;
  flex-shrink: 0;
}

.floor__navmenu__name {
  font-weight: 600;
  font-size: var(--font-sm);
}
</style>
