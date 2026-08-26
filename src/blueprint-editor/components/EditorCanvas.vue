<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, inject } from "vue";
import { useAssetsStore, dragState, endAssetDrag } from "../blueprintStore";
import { findAssetCached, svgColorVarStyle } from "../assetUtils";
import { svgTransform as svgTransformGeo, roundedRectPath, buildingArea } from "../geometry";
import { resolveStreetTiles } from "../types";
import { useConfirm } from "@/composables/useConfirm";
import { useToast } from "@/composables/useToast";
import type { ObjectData, EntityRef } from "../types";
import { resolveObjectDef } from "../types";
import { useCanvasViewport } from "../composables/useCanvasViewport";
import { useCanvasSelection } from "../composables/useCanvasSelection";
import { useCanvasDragDrop } from "../composables/useCanvasDragDrop";
import ColorInput from "./ColorInput.vue";
import ModalShell from "./ModalShell.vue";
import { useNpcSimulation } from "../composables/useNpcSimulation";
import { useWallPaint, type WallSegment } from "../composables/useWallPaint";
import { wallRunsFromEdges } from "../roomConvert";
import { assetSizeFor } from "../geometry";
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
const toast = useToast();
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
const { start: startNpcSimulation, stop: stopNpcSimulation } = npcSimulation;

const npcCanvasRef = ref<HTMLCanvasElement | null>(null);
let npcDrawRaf: number | null = null;

function drawNpcFrame() {
  npcDrawRaf = requestAnimationFrame(drawNpcFrame);
  const canvas = npcCanvasRef.value;
  const svg = vp.svgRef.value;
  if (!canvas || !svg) return;
  const sRect = svg.getBoundingClientRect();
  const host = canvas.parentElement;
  if (!host) return;
  const hRect = host.getBoundingClientRect();
  canvas.style.left = `${sRect.left - hRect.left}px`;
  canvas.style.top = `${sRect.top - hRect.top}px`;
  canvas.style.width = `${sRect.width}px`;
  canvas.style.height = `${sRect.height}px`;
  const dpr = window.devicePixelRatio || 1;
  const targetW = Math.round(sRect.width * dpr);
  const targetH = Math.round(sRect.height * dpr);
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, sRect.width, sRect.height);
  const ctm = svg.getScreenCTM();
  if (!ctm) return;
  const style = getComputedStyle(document.documentElement);
  const colAccent = style.getPropertyValue("--accent-primary").trim() || "#4cc9f0";
  const colGuide = style.getPropertyValue("--accent-blue").trim() || "#3a86ff";
  const colGreen = style.getPropertyValue("--accent-green").trim() || "#2ec4b6";
  const colRing = "rgba(255,255,255,0.8)";
  const fid = store.state.currentFloorId;
  for (const dot of npcSimulation.frameDots.values()) {
    if (dot.floorId !== fid) continue;
    const p = new DOMPoint(dot.x, dot.y).matrixTransform(ctm);
    const sx = p.x - sRect.left;
    const sy = p.y - sRect.top;
    if (sx < -8 || sy < -8 || sx > sRect.width + 8 || sy > sRect.height + 8) continue;
    if (showNpcGuides.value && dot.status === "walking") {
      if (dot.path.length > 1) {
        ctx.beginPath();
        ctx.setLineDash([4, 3]);
        ctx.moveTo(sx, sy);
        for (let i = dot.pathIdx; i < dot.path.length; i++) {
          const pt = new DOMPoint(dot.path[i][0], dot.path[i][1]).matrixTransform(ctm);
          ctx.lineTo(pt.x - sRect.left, pt.y - sRect.top);
        }
        ctx.strokeStyle = colGuide;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.7;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }
      const tp = new DOMPoint(dot.targetX, dot.targetY).matrixTransform(ctm);
      const tx = tp.x - sRect.left;
      const ty = tp.y - sRect.top;
      ctx.strokeStyle = colAccent;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tx - 3, ty);
      ctx.lineTo(tx + 3, ty);
      ctx.moveTo(tx, ty - 3);
      ctx.lineTo(tx, ty + 3);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(sx, sy, 4, 0, Math.PI * 2);
    ctx.fillStyle = dot.color;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = dot.status === "interacting" ? colGreen : colRing;
    ctx.stroke();
  }
}

function startNpcDraw() {
  if (npcDrawRaf === null) npcDrawRaf = requestAnimationFrame(drawNpcFrame);
}

function stopNpcDraw() {
  if (npcDrawRaf !== null) {
    cancelAnimationFrame(npcDrawRaf);
    npcDrawRaf = null;
  }
  const canvas = npcCanvasRef.value;
  const ctx = canvas?.getContext("2d");
  if (canvas && ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

watch(
  () => store.state.mode,
  (mode, previousMode) => {
    if (mode === "npc-preview") {
      startNpcSimulation();
      startNpcDraw();
    }
    if (previousMode === "npc-preview" && mode !== "npc-preview") {
      stopNpcSimulation();
      stopNpcDraw();
    }
  },
);

const VIEW_TOGGLE_KEY = "blueprint-view-toggles";
const savedToggles = (() => {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(VIEW_TOGGLE_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? (parsed as Record<string, boolean>) : {};
  } catch {
    return {};
  }
})();
const showWalkableOverlay = ref(savedToggles.showWalkableOverlay ?? false);
const showInteractSpots = ref(savedToggles.showInteractSpots ?? false);
const showWalls = ref(savedToggles.showWalls ?? false);
const showObjectHighlights = ref(savedToggles.showObjectHighlights ?? false);
const showBuildingBounds = ref(savedToggles.showBuildingBounds ?? true);
const showNpcGuides = ref(savedToggles.showNpcGuides ?? true);

const isInteracting = computed(() => !!panning.value || !!moving.value || zooming.value);
const renderWalkableOverlay = computed(() => showWalkableOverlay.value && !isInteracting.value);
const renderWalls = computed(() => (showWalls.value || store.state.wallPaint) && !isInteracting.value);
const renderInteractSpots = computed(() => showInteractSpots.value && !isInteracting.value);
const renderObjectHighlights = computed(() => showObjectHighlights.value && !isInteracting.value);
const renderBuildingBounds = computed(() => showBuildingBounds.value);

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

interface WallRun extends WallSegment {}
const wallRuns = computed<WallRun[]>(() => {
  const tileEdges = floor.value?.walkable?.tileEdges;
  if (!tileEdges) return [];
  return wallRunsFromEdges(tileEdges, canvas.value.tileSize);
});

interface ObjWallLine extends WallSegment { id: string }
const objWallLines = computed<ObjWallLine[]>(() => {
  const fl = floor.value;
  if (!fl) return [];
  const t = canvas.value.tileSize;
  const assets = store.assetMap();
  const lines: ObjWallLine[] = [];
  for (const o of fl.objects) {
    const asset = assets.get(o.type);
    if (!asset?.tileEdges?.length) continue;
    const resolved = resolveObjectDef(o.rotation, asset, { w: o.w, h: o.h });
    const edges = resolved.tileEdges;
    if (!edges?.length) continue;
    const size = assetSizeFor(o.type, o.rotation, t, assets) ?? { w: Math.max(o.w, t), h: Math.max(o.h, t) };
    const cellH = size.h / edges.length;
    const cols = edges[0]?.length ?? 0;
    if (!cols) continue;
    const cellW = size.w / cols;
    for (let r = 0; r < edges.length; r++) {
      const row = edges[r];
      if (!row) continue;
      for (let c = 0; c < row.length; c++) {
        const cell = row[c];
        if (!cell) continue;
        const x0 = o.x + c * cellW;
        const y0 = o.y + r * cellH;
        if (cell.top) lines.push({ id: o.id, x1: x0, y1: y0, x2: x0 + cellW, y2: y0 });
        if (cell.bottom) lines.push({ id: o.id, x1: x0, y1: y0 + cellH, x2: x0 + cellW, y2: y0 + cellH });
        if (cell.left) lines.push({ id: o.id, x1: x0, y1: y0, x2: x0, y2: y0 + cellH });
        if (cell.right) lines.push({ id: o.id, x1: x0 + cellW, y1: y0, x2: x0 + cellW, y2: y0 + cellH });
      }
    }
  }
  return lines;
});

async function convertSelectedWalls() {
  const selected = wallPaint.selected.value;
  if (selected.length === 0 || !floor.value) return;
  await store.convertWallsToRoom(floor.value.id, selected.map((s) => s.segment));
  wallPaint.clearSelection();
}

function wallDistance(point: { x: number; y: number }, wall: WallSegment): number {
  const dx = wall.x2 - wall.x1;
  const dy = wall.y2 - wall.y1;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(point.x - wall.x1, point.y - wall.y1);
  const position = Math.max(0, Math.min(1, ((point.x - wall.x1) * dx + (point.y - wall.y1) * dy) / lengthSquared));
  return Math.hypot(point.x - (wall.x1 + position * dx), point.y - (wall.y1 + position * dy));
}

function wallAtPoint(point: { x: number; y: number }): WallSegment | null {
  const tolerance = Math.max(6, canvas.value.tileSize * 0.2);
  let closest: WallSegment | null = null;
  let closestDistance = tolerance;
  for (const wall of wallRuns.value) {
    const distance = wallDistance(point, wall);
    if (distance <= closestDistance) {
      closest = wall;
      closestDistance = distance;
    }
  }
  return closest;
}

function wallsInRect(rect: { x: number; y: number; w: number; h: number }): WallSegment[] {
  const maxX = rect.x + rect.w;
  const maxY = rect.y + rect.h;
  return wallRuns.value.filter((wall) => {
    const minWallX = Math.min(wall.x1, wall.x2);
    const maxWallX = Math.max(wall.x1, wall.x2);
    const minWallY = Math.min(wall.y1, wall.y2);
    const maxWallY = Math.max(wall.y1, wall.y2);
    return maxWallX >= rect.x && minWallX <= maxX && maxWallY >= rect.y && minWallY <= maxY;
  });
}

const modeLabel = computed(() => {
  if (wallPaintActive.value) return "Draw Wall Mode";
  const labels: Record<string, string> = {
    object: "Object",
    draw: "Draw Object",
    move: "Move",
    "npc-preview": "NPC Preview",
  };
  return (labels[store.state.mode] ?? store.state.mode) + " Mode";
});

const modeHint = computed(() => {
  if (wallPaintActive.value) return "Draw Wall: click or drag boundaries - Object tool drag empty space selects walls - Delete removes selection - Escape exits";
  const hints: Record<string, string> = {
    object: "Drag an asset from the palette onto the canvas - drag empty space to select objects and walls",
    draw: "Drag a rectangle, then save it as an origin asset",
    move: "Click and drag an object to reposition it - Delete removes the selection",
    "npc-preview": "NPCs are simulating on this floor",
  };
  return hints[store.state.mode] ?? "";
});

const buildingAreaRect = computed(() => buildingArea(canvas.value.width, canvas.value.height, canvas.value.tileSize, streetTotalTiles.value));
const streetSidewalkWidth = computed(() => 2 * canvas.value.tileSize);
const streetTotalTiles = computed(() => resolveStreetTiles(store.state.layout));
const streetRoadWidth = computed(() => Math.max(1, streetTotalTiles.value - 4) * canvas.value.tileSize);

const vp = useCanvasViewport(
  () => canvas.value.width,
  () => canvas.value.height,
);
const { viewBox, zoomPercent, spaceDown, panning, zooming, svgRef, RULER_SIZE, fitToScreen, centerView, zoomBy, onWheel, startPan, onPanMouseDown, onPanMouseMove, onPanMouseUp, localPoint } = vp;

const wallPaint = useWallPaint({
  disabled: () => store.state.mode === "npc-preview",
  localPoint,
  tileSize: () => canvas.value.tileSize,
  canvasWidth: () => canvas.value.width,
  canvasHeight: () => canvas.value.height,
  floor,
  wallAtPoint,
  wallsInRect,
  commit: async (floorId, walkable) => {
    try {
      const saved = await store.updateFloor(floorId, { walkable });
      if (saved) toast.success("Wall saved");
      else toast.error("Failed to save walls - floor not found");
    } catch {
      toast.error("Failed to save walls");
    }
  },
});
const wallPaintActive = computed(() => store.state.wallPaint);
const DEFAULT_WALL_COLOR = "var(--accent-green)";
const DEFAULT_WALL_THICKNESS = 3;
const wallColor = computed(() => canvas.value.wallColor || DEFAULT_WALL_COLOR);
const wallThickness = computed(() => canvas.value.wallThickness ?? DEFAULT_WALL_THICKNESS);
const wallPreview = wallPaint.preview;
const selectedWall = wallPaint.selected;
watch(
  () => store.state.wallPaint,
  (on) => {
    wallPaint.active.value = on;
    if (!on) {
      wallPaint.cancel();
      wallPaint.clearSelection();
    } else {
      store.select(null);
      store.selectAsset(null);
      wallPaint.clearSelection();
      if (!showWalls.value) {
        showWalls.value = true;
        saveViewToggles();
      }
    }
  },
  { immediate: true },
);
function onCanvasMouseDownWithWalls(e: MouseEvent) {
  if (wallPaint.onMouseDown(e)) return;
  onCanvasMouseDown(e);
}
function onCanvasContextMenu(e: MouseEvent) {
  if (wallPaintActive.value) e.preventDefault();
}

const draftAssetId = ref<string | null>(null);
const draftObjectId = ref<string | null>(null);
const showSaveOrigin = ref(false);
const originName = ref("");
const originFillColor = ref<string | undefined>(undefined);
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
    originFillColor.value = undefined;
    showSaveOrigin.value = true;
  } catch {
    toast.error("Failed to start drawing");
  }
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
  onBoxSelectStart: () => wallPaint.clearSelection(),
  onBoxSelectComplete: (rect) => wallPaint.selectInRect(rect),
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
const selectedRotation = computed<number | null>(() => {
  if (store.state.selectionState.primary?.type !== "object") return null;
  return store.selectedObject()?.rotation ?? null;
});
const showStreet = computed(() => !!store.state.layout.streetFloorId && store.state.layout.streetFloorId === store.state.currentFloorId);

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
  if (wallPaintActive.value) return;
  wallPaint.clearSelection();
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
    localStorage.setItem(
      VIEW_TOGGLE_KEY,
      JSON.stringify({
        showGrid: showGrid.value,
        showLabels: showLabels.value,
        showWalkableOverlay: showWalkableOverlay.value,
        showInteractSpots: showInteractSpots.value,
        showWalls: showWalls.value,
        showObjectHighlights: showObjectHighlights.value,
        showBuildingBounds: showBuildingBounds.value,
        showNpcGuides: showNpcGuides.value,
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

function toggleBuildingBounds() {
  showBuildingBounds.value = !showBuildingBounds.value;
  saveViewToggles();
}

function toggleNpcGuides() {
  showNpcGuides.value = !showNpcGuides.value;
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
  if ((e.key === "Delete" || e.key === "Backspace") && !e.repeat) {
    const wallCount = wallPaint.selected.value.length;
    const primary = store.state.selectionState.primary;
    const objCount = primary ? store.state.selectionState.items.length || 1 : 0;
    if (wallCount === 0 && objCount === 0) return;
    e.preventDefault();
    const parts: string[] = [];
    if (wallCount > 0) parts.push(`${wallCount} selected wall${wallCount === 1 ? "" : "s"}`);
    if (objCount > 0) parts.push(`${objCount} selected ${primary!.type === "object" ? (objCount === 1 ? "object" : "objects") : primary!.type}`);
    const confirmed = await confirm({
      title: "Delete selection",
      message: `Delete ${parts.join(" and ")}? This action cannot be undone.`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      danger: true,
    });
    if (!confirmed) return;
    if (wallCount > 0) await wallPaint.deleteSelected();
    if (objCount > 0) await store.deleteSelected();
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
      const step = e.shiftKey ? 10 : 1;
      const dx = e.key === "ArrowLeft" ? -t * step : e.key === "ArrowRight" ? t * step : 0;
      const dy = e.key === "ArrowUp" ? -t * step : e.key === "ArrowDown" ? t * step : 0;
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
    if (wallPaintActive.value) {
      wallPaint.cancel();
      wallPaint.clearSelection();
      store.setWallPaint(false);
      return;
    }
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

function onWindowBlur() {
  spaceDown.value = false;
}

onMounted(() => {
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onWindowBlur);
  document.addEventListener("click", onFloorNavOutside);
  document.addEventListener("keydown", onFloorNavKeydown);
  requestAnimationFrame(fitToScreen);
});
onUnmounted(() => {
  stopNpcSimulation();
  stopNpcDraw();
  wallPaint.cancel();
  wallPaint.clearSelection();
  window.removeEventListener("keydown", onKeyDown);
  window.removeEventListener("keyup", onKeyUp);
  window.removeEventListener("blur", onWindowBlur);
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
  if (a?.svg) return a.defaultFillColor ?? "transparent";
  return a?.defaultFillColor ?? "var(--text-bright)";
}

function objLabelColor(): string {
  return canvas.value.labelColor || "var(--text-primary)";
}

function objIsWall(obj: ObjectData): boolean {
  return findAssetCached(store.assetMap(), obj.type)?.isWall ?? false;
}

function assetSvg(type: string): string | undefined {
  return findAssetCached(store.assetMap(), type)?.svg;
}

function svgTransform(obj: ObjectData): string {
  const asset = findAssetCached(store.assetMap(), obj.type);
  return svgTransformGeo(obj, asset);
}

function svgColorVars(obj: ObjectData): string {
  const a = findAssetCached(store.assetMap(), obj.type);
  return svgColorVarStyle(obj.fillColor ?? a?.defaultFillColor, obj.strokeColor ?? a?.defaultStrokeColor);
}

function isObjectSelected(id: string): boolean {
  return selectedObjectIds.value.has(id);
}

function wallKey(wall: WallSegment): string {
  return `${wall.x1},${wall.y1},${wall.x2},${wall.y2}`;
}

const wallSelectionKeys = computed(() => new Set(selectedWall.value.map((selection) => wallKey(selection.segment))));

function isWallSelected(wall: WallSegment): boolean {
  return wallSelectionKeys.value.has(wallKey(wall));
}

async function saveDrawnOrigin() {
  const assetId = draftAssetId.value;
  const name = originName.value.trim();
  if (!assetId || !name) return;
  try {
    await store.updateAsset(assetId, { name, defaultFillColor: originFillColor.value });
    showSaveOrigin.value = false;
    draftAssetId.value = null;
    draftObjectId.value = null;
    store.setMode("object");
  } catch {
    toast.error("Failed to save origin asset");
  }
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
    :class="{ 'editor__canvas--panning': spaceDown, 'editor__canvas--dragging': !!panning, 'editor__canvas--draw': store.state.mode === 'draw', 'editor__canvas--move': store.state.mode === 'move', 'editor__canvas--wallpaint': wallPaintActive }"
    @wheel="onWheel"
    @mousedown="onPanMouseDown"
    @mousemove="onContainerMouseMove"
    @mouseleave="
      rulerMouseX = -1;
      rulerMouseY = -1;
    "
  >
    <svg ref="svgRef" class="editor__svg" :viewBox="viewBox" preserveAspectRatio="xMidYMid meet" role="application" aria-label="Blueprint editor canvas - use arrow keys to move selected objects, Delete to remove, R to rotate" tabindex="0" @mousedown="onCanvasMouseDownWithWalls" @contextmenu="onCanvasContextMenu">
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
        <rect :x="buildingAreaRect.x" :y="buildingAreaRect.y" :width="buildingAreaRect.w" :height="buildingAreaRect.h" fill="none" stroke="var(--border-dim)" stroke-width="1" stroke-dasharray="4 4" opacity="0.6" />
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
        <text :x="canvas.width / 2" :y="canvas.height / 2 - 10" text-anchor="middle" font-size="16" class="editor__svg--noevents" :style="{ fill: 'var(--text-primary)' }">Empty floor - drag objects from the palette</text>
      </g>

      <g v-if="renderWalkableOverlay && floor?.walkable?.tileStates" v-memo="[walkableRuns, renderWalkableOverlay]" class="editor__svg--noevents">
        <rect v-for="(run, i) in walkableRuns" :key="`floor-walk-run-${i}`" :x="run.x" :y="run.y" :width="run.w" :height="run.h" :class="`editor__tile editor__tile--${run.state}`" />
      </g>

      <g v-if="renderWalls" v-memo="[wallRuns, objWallLines, renderWalls, wallColor, wallThickness, selectedWall]" class="editor__svg--noevents">
        <line v-for="(run, i) in wallRuns" :key="`floor-wall-run-${i}`" :x1="run.x1" :y1="run.y1" :x2="run.x2" :y2="run.y2" :class="{ 'editor__wall--selected': isWallSelected(run) }" :stroke="isWallSelected(run) ? 'var(--accent-primary)' : wallColor" :stroke-width="isWallSelected(run) ? wallThickness + 3 : wallThickness" :stroke-dasharray="isWallSelected(run) ? '10 5' : undefined" />
        <line v-for="(line, i) in objWallLines" :key="`obj-wall-${line.id}-${i}`" :x1="line.x1" :y1="line.y1" :x2="line.x2" :y2="line.y2" :stroke="wallColor" :stroke-width="wallThickness" />
      </g>

      <line v-if="wallPreview && !isInteracting" :x1="wallPreview.x1" :y1="wallPreview.y1" :x2="wallPreview.x2" :y2="wallPreview.y2" :stroke="wallColor" :stroke-width="Math.max(2, wallThickness)" stroke-dasharray="6 4" opacity="0.9" class="editor__svg--noevents" />

      <g v-if="renderBuildingBounds" v-memo="[buildingAreaRect, renderBuildingBounds]" class="editor__svg--noevents">
        <rect :x="buildingAreaRect.x" :y="buildingAreaRect.y" :width="buildingAreaRect.w" :height="buildingAreaRect.h" fill="none" stroke="var(--accent-green)" stroke-width="6" opacity="0.9" />
      </g>

      <rect v-if="showGrid" :width="canvas.width" :height="canvas.height" fill="url(#grid)" class="editor__svg--noevents" />

      <g v-if="floor">
        <g v-for="obj in floor.objects" :key="obj.id" @mousedown="onObjectMouseDown($event, obj.id)">
          <rect :x="obj.x" :y="obj.y" :width="obj.w" :height="obj.h" fill="transparent" class="editor__svg--passall" />
          <template v-if="assetSvg(obj.type)">
            <g v-svg-content="assetSvg(obj.type)" :transform="svgTransform(obj)" :data-obj-id="obj.id" :class="{ 'editor__object--collapsed': obj.collapsed, 'editor__object--dragging': moving?.id === obj.id, 'editor__object--locked': obj.locked, 'editor__object--nowall': !hasOuterWall(obj) }" :style="`cursor:${moving?.id === obj.id ? 'grabbing' : 'move'};${svgColorVars(obj)}`" />
          </template>
          <path
            v-else-if="roundedRectPath(obj.x + (obj.padding ?? 0), obj.y + (obj.padding ?? 0), obj.w - (obj.padding ?? 0) * 2, obj.h - (obj.padding ?? 0) * 2, obj.rx)"
            :d="roundedRectPath(obj.x + (obj.padding ?? 0), obj.y + (obj.padding ?? 0), obj.w - (obj.padding ?? 0) * 2, obj.h - (obj.padding ?? 0) * 2, obj.rx)!"
            :fill="objFillColor(obj)"
            :stroke-width="objIsWall(obj) ? 2 : 1"
            :stroke-dasharray="objIsWall(obj) ? '6 3' : undefined"
            :class="{ 'editor__object--collapsed': obj.collapsed, 'editor__object--dragging': moving?.id === obj.id, 'editor__object--linked': !!obj.linkGroupId, 'editor__object--locked': obj.locked }"
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
            :class="{ 'editor__object--collapsed': obj.collapsed, 'editor__object--dragging': moving?.id === obj.id, 'editor__object--linked': !!obj.linkGroupId, 'editor__object--locked': obj.locked }"
            :style="{ stroke: 'var(--text-primary)', cursor: moving?.id === obj.id ? 'grabbing' : 'move' }"
          />
          <rect v-if="renderObjectHighlights" :x="obj.x + 1" :y="obj.y + 1" :width="Math.max(0, obj.w - 2)" :height="Math.max(0, obj.h - 2)" fill="none" :rx="obj.radius ?? 0" class="editor__overlay--highlight editor__svg--noevents" />
          <template v-if="renderWalkableOverlay && objDef(obj).walkableGrid" v-memo="[obj.id, obj.x, obj.y, obj.w, obj.h, renderWalkableOverlay, objDef(obj).walkableGrid]">
            <template v-for="(row, gr) in objDef(obj).walkableGrid" :key="'wg_' + obj.id + '-' + gr">
              <rect v-for="(cell, gc) in row" :key="'wg_' + obj.id + '-' + gr + '-' + gc" :x="obj.x + gc * (obj.w / row.length)" :y="obj.y + gr * (obj.h / objDef(obj).walkableGrid!.length)" :width="obj.w / row.length" :height="obj.h / objDef(obj).walkableGrid!.length" :class="`editor__tile editor__tile--obj-${cell ? 'walkable' : 'blocked'}`" />
            </template>
          </template>
          <rect v-if="isObjectSelected(obj.id)" :x="obj.x + (obj.padding ?? 0)" :y="obj.y + (obj.padding ?? 0)" :width="obj.w - (obj.padding ?? 0) * 2" :height="obj.h - (obj.padding ?? 0) * 2" fill="none" :rx="obj.radius ?? 0" class="editor__overlay--selected editor__svg--noevents" />
          <text v-if="showLabels" :x="obj.x + obj.w / 2" :y="Math.max(obj.y - (obj.labelPadding ?? 0) - 3, 7)" text-anchor="middle" font-size="8" class="editor__svg--noevents" :style="{ fill: objLabelColor() }">
            {{ assetLabel(obj.type) }}
          </text>
          <g v-if="obj.linkGroupId" class="editor__svg--noevents">
            <circle :cx="obj.x + obj.w - 4" :cy="obj.y + 4" r="3" fill="var(--accent-blue)" stroke="var(--bg-primary)" stroke-width="0.5" />
            <text :x="obj.x + obj.w - 4" :y="obj.y + 5.5" text-anchor="middle" font-size="4" fill="var(--bg-primary)">L</text>
          </g>
          <template v-if="renderInteractSpots && objDef(obj).interactSpots && objDef(obj).interactSpots!.length > 0" v-memo="[obj.id, obj.x, obj.y, renderInteractSpots, objDef(obj).interactSpots]">
            <g v-for="(interactSpot, interactSpotIdx) in objDef(obj).interactSpots" :key="`o-interactspot-${obj.id}-${interactSpotIdx}`" class="editor__svg--noevents">
              <circle :cx="obj.x + interactSpot.x" :cy="obj.y + interactSpot.y" r="4" fill="var(--accent-green)" stroke="var(--text-bright)" stroke-width="0.8" />
              <text :x="obj.x + interactSpot.x" :y="obj.y + interactSpot.y - 6" text-anchor="middle" font-size="5" fill="color-mix(in srgb, var(--accent-green) 70%, var(--bg-primary))">IS{{ interactSpotIdx + 1 }}</text>
            </g>
          </template>
        </g>

        <g v-if="renderWalkableOverlay" v-memo="[floor?.spawnZones, renderWalkableOverlay]" class="editor__svg--noevents">
          <g v-for="zone in floor?.spawnZones ?? []" :key="`spawn-zone-${zone.id}`">
            <rect :x="zone.x" :y="zone.y" :width="zone.w" :height="zone.h" fill="color-mix(in srgb, var(--accent-green) 12%, transparent)" stroke="var(--accent-green)" stroke-width="1" stroke-dasharray="5 3" />
            <text :x="zone.x + 4" :y="zone.y + 10" font-size="6" fill="var(--accent-green)">{{ zone.label }}</text>
          </g>
        </g>
      </g>

      <rect :width="canvas.width" :height="canvas.height" fill="none" :style="{ stroke: 'var(--border-dim)' }" stroke-width="2" />

      <rect v-if="boxSelect && boxSelect.w > 4" :x="boxSelect.x" :y="boxSelect.y" :width="boxSelect.w" :height="boxSelect.h" class="editor__svg--noevents" :style="{ fill: 'color-mix(in srgb, var(--accent-primary) 15%, transparent)', stroke: 'var(--accent-primary)' }" stroke-width="1.5" stroke-dasharray="4 3" />

      <g v-if="dragState.assetId && paletteGhost && paletteGhostParts">
        <rect v-for="(p, i) in paletteGhostParts" :key="'ghost_part_' + i" :x="p.x" :y="p.y" :width="p.w" :height="p.h" :style="{ fill: 'color-mix(in srgb, var(--accent-blue) 15%, transparent)', stroke: 'var(--accent-blue)' }" stroke-width="1.5" stroke-dasharray="4 3" />
      </g>
      <g v-else-if="dragState.assetId && paletteGhost && paletteGhostRect">
        <rect :x="paletteGhostRect.x" :y="paletteGhostRect.y" :width="paletteGhostRect.w" :height="paletteGhostRect.h" :style="{ fill: paletteValid ? 'color-mix(in srgb, var(--accent-green) 35%, transparent)' : 'color-mix(in srgb, var(--accent-red) 35%, transparent)', stroke: paletteValid ? 'var(--accent-green)' : 'var(--accent-red)' }" stroke-width="1.5" />
      </g>
    </svg>
    <canvas ref="npcCanvasRef" class="editor__npccanvas"></canvas>

    <div class="editor__title" v-if="floor">
      <span class="editor__labels" :style="{ color: floor.labelColor || undefined }">{{ floor.label }}</span>
      <span class="editor__name">{{ floor.name }}</span>
    </div>

    <div class="editor__nav" v-if="floor">
      <div class="floor__wrap">
        <button class="floor__trigger" @click.stop="toggleFloorNav" :aria-expanded="floorNavOpen" aria-haspopup="listbox" title="Switch floor" aria-label="Switch floor">
          <span class="floor__tag" :style="{ color: floor.labelColor || undefined }">{{ floor.label }}</span>
          <span class="floor__text">{{ floor.name }}</span>
          <span class="floor__caret" :class="{ 'floor__caret--rotated': floorNavOpen }"
            ><svg viewBox="0 0 10 6" width="8" height="5" aria-hidden="true"><path d="M0 0l5 6 5-6z" fill="currentColor" /></svg
          ></span>
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

    <div class="editor__coords">
      {{ mouseCoords.x }}, {{ mouseCoords.y }}<template v-if="selectedRotation !== null"> - {{ selectedRotation }}deg</template>
    </div>

    <div class="editor__controls">
      <button class="flag--ghost flag--icon" @click="zoomBy(1 / 1.25)" title="Zoom Out (-)" aria-label="Zoom out">-</button>
      <span class="editor__zoom" aria-label="Zoom level">{{ zoomPercent }}%</span>
      <button class="flag--ghost flag--icon" @click="zoomBy(1.25)" title="Zoom In (+)" aria-label="Zoom in">+</button>
      <button class="flag--ghost" @click="fitToScreen" title="Fit to Screen (Ctrl+0)" aria-label="Fit to screen">Fit</button>
      <button class="flag--ghost" @click="centerView" title="Center View" aria-label="Center view">Center</button>
      <button class="flag--ghost" :class="{ 'flag--active': showGrid }" @click="toggleGrid" title="Toggle Grid" aria-label="Toggle grid">Grid</button>
      <button class="flag--ghost" :class="{ 'flag--active': showLabels }" @click="toggleLabels" title="Toggle Labels" aria-label="Toggle labels">Labels</button>
      <button class="flag--ghost" :class="{ 'flag--active': showWalkableOverlay }" @click="toggleWalkableOverlay" title="Toggle Walkable + Entrance" aria-label="Toggle walkable view">Walk</button>
      <button class="flag--ghost" :class="{ 'flag--active': showWalls }" @click="toggleWalls" title="Toggle Outer Walls" aria-label="Toggle walls">Wall</button>
      <button v-if="wallPaintActive" class="flag--warning" :disabled="wallPaint.selected.value.length === 0" @click="convertSelectedWalls" title="Convert selected walls into a Room object (edit tags/queue in Origin settings)" aria-label="Convert selected walls to room object">To Room</button>
      <button class="flag--ghost" :class="{ 'flag--active': showInteractSpots }" @click="toggleInteractSpots" title="Toggle Interact Spots" aria-label="Toggle interact spots">Interact</button>
      <button class="flag--ghost" :class="{ 'flag--active': showObjectHighlights }" @click="toggleObjectHighlights" title="Toggle object highlights" aria-label="Toggle object highlights">Highlight</button>
      <button class="flag--ghost" :class="{ 'flag--active': showBuildingBounds }" @click="toggleBuildingBounds" title="Toggle building area boundary (placement limit against the street)" aria-label="Toggle building bounds">Bounds</button>
      <button class="flag--ghost" :class="{ 'flag--active': showNpcGuides }" @click="toggleNpcGuides" title="Toggle NPC path guides (only in NPC Preview)" aria-label="Toggle NPC path guides">Guides</button>
    </div>

    <ModalShell :open="showSaveOrigin && !!draftObject" title="Save Placed Object as Origin" max-width="360px" width="min(360px, calc(100vw - 32px))" max-height="calc(100vh - 32px)" @close="cancelDrawnOrigin">
      <div class="modal__body">
        <div class="editor__preview" :style="{ width: `${Math.min(draftObject?.w ?? 0, 220)}px`, height: `${Math.min(draftObject?.h ?? 0, 140)}px`, background: originFillColor || 'var(--bg-primary)' }" />
        <input class="input--disabled" :value="`${(draftObject?.w ?? 0) / canvas.tileSize} x ${(draftObject?.h ?? 0) / canvas.tileSize} tiles`" readonly aria-label="Object size" />
        <label class="form__row">
          <span class="label--fixed">Name</span>
          <input v-model="originName" type="text" placeholder="Object name" autofocus />
        </label>
        <label class="form__row">
          <span class="label--fixed">Fill Color</span>
          <ColorInput v-model="originFillColor" :allow-transparent="true" placeholder="#RRGGBB or transparent" aria-label="Origin fill color" />
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

.editor__canvas--draw .editor__svg {
  cursor: crosshair;
}

.editor__canvas--move .editor__svg {
  cursor: grab;
}

.editor__canvas--wallpaint .editor__svg {
  cursor: crosshair;
}

.editor__wall--selected {
  stroke-linecap: round;
}

.editor__canvas--move.editor__canvas--dragging .editor__svg {
  cursor: grabbing;
}

.editor__svg {
  display: block;
  background: var(--bg-primary);
}

.editor__npccanvas {
  position: absolute;
  pointer-events: none;
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

.editor__overlay--selected {
  stroke: var(--accent-primary);
  stroke-width: 2px;
  fill: none;
  pointer-events: none;
}

.editor__overlay--highlight {
  stroke: var(--accent-primary);
  stroke-width: 1.5px;
  stroke-dasharray: 5 3;
  opacity: 0.9;
  fill: none;
  pointer-events: none;
}

:deep(.editor__object--nowall .svg_role__wall) {
  display: none;
}

.editor__object--linked {
  stroke: var(--accent-blue);
  stroke-width: 1.5px;
}

.editor__object--locked {
  opacity: 0.6;
}

.editor__object--collapsed {
  opacity: 0.4;
}

.editor__object--dragging {
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
