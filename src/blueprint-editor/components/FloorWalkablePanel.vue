<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useAssetsStore } from "../blueprintStore";
import { STREET_TILES, type FloorData, type TileEdges, type TileState } from "../types";
import ModalShell from "./ModalShell.vue";

type WalkableMode = "walk" | "entrance";
type BorderSide = "top" | "right" | "bottom" | "left";

const props = defineProps<{
	streetTiles?: number,
  open: boolean;
  floor?: FloorData;
}>();
const emit = defineEmits<{ (event: "close"): void }>();

const store = useAssetsStore();
const activeMode = ref<WalkableMode>("walk");
const walkBrush = ref<TileState>("walkable");
const entranceBrush = ref<"door" | "border">("door");
const tileStates = ref<TileState[][]>([]);
const tileEdges = ref<TileEdges[][]>([]);
const dirty = ref(false);

const tileSize = computed(() => Math.max(1, Math.round(store.state.layout.canvas.tileSize)));
const cols = computed(() => Math.max(1, Math.ceil(store.state.layout.canvas.width / tileSize.value)));
const rows = computed(() => Math.max(1, Math.ceil(store.state.layout.canvas.height / tileSize.value)));
const resolvedStreetTiles = computed(() => props.streetTiles ?? STREET_TILES);
const buildingStartRow = computed(() => Math.min(resolvedStreetTiles.value, Math.floor(rows.value / 2)));
const buildingEndRow = computed(() => Math.max(rows.value - resolvedStreetTiles.value, buildingStartRow.value));
const buildingStartCol = computed(() => Math.min(resolvedStreetTiles.value, Math.floor(cols.value / 2)));
const buildingEndCol = computed(() => Math.max(cols.value - resolvedStreetTiles.value, buildingStartCol.value));
const buildingRows = computed(() => buildingEndRow.value - buildingStartRow.value);
const buildingCols = computed(() => buildingEndCol.value - buildingStartCol.value);
const gridStyle = computed(() => ({ "--walk-cols": buildingCols.value }));

function createTileStates(floor?: FloorData): TileState[][] {
  const existing = floor?.walkable?.tileStates;
  if (existing?.length === rows.value && existing.every((row) => row.length === cols.value)) {
    return existing.map((row) => [...row]);
  }
  const existingGrid = floor?.walkable?.walkableGrid;
  if (existingGrid?.length === rows.value && existingGrid.every((row) => row.length === cols.value)) {
    return existingGrid.map((row) => row.map((cell) => (cell ? "walkable" : "blocked")));
  }
  const fallback: TileState = floor?.defaultWalkable === false ? "blocked" : "walkable";
  return Array.from({ length: rows.value }, () => Array.from({ length: cols.value }, () => fallback));
}

function createTileEdges(floor?: FloorData): TileEdges[][] {
  const existing = floor?.walkable?.tileEdges;
  if (existing?.length === rows.value && existing.every((row) => row.length === cols.value)) {
    return existing.map((row) => row.map((edge) => ({ ...edge })));
  }
  return Array.from({ length: rows.value }, () => Array.from({ length: cols.value }, () => ({})));
}

function resetDraft(): void {
  tileStates.value = createTileStates(props.floor);
  tileEdges.value = createTileEdges(props.floor);
  dirty.value = false;
}

watch(
  () => [props.open, props.floor?.id, cols.value, rows.value],
  ([open]) => {
    if (open) resetDraft();
  },
  { immediate: true },
);

function tileState(row: number, col: number): TileState {
  return tileStates.value[row]?.[col] ?? "blocked";
}

function edge(row: number, col: number): TileEdges {
  return tileEdges.value[row]?.[col] ?? {};
}

function detectEdgeSide(event: MouseEvent): BorderSide | null {
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const distances = {
    top: event.clientY - rect.top,
    right: rect.right - event.clientX,
    bottom: rect.bottom - event.clientY,
    left: event.clientX - rect.left,
  };
  const side = (Object.keys(distances) as BorderSide[]).sort((a, b) => distances[a] - distances[b])[0];
  return distances[side] <= Math.max(6, Math.min(rect.width, rect.height) * 0.25) ? side : null;
}

function toggleEdge(row: number, col: number, side: BorderSide): void {
  const current = tileEdges.value[row][col] ?? {};
  tileEdges.value[row][col] = { ...current, [side]: !current[side] };
  dirty.value = true;
}

function applyOuterWall(): void {
  for (let row = buildingStartRow.value; row < buildingEndRow.value; row++) {
    for (let col = buildingStartCol.value; col < buildingEndCol.value; col++) {
      const current = tileEdges.value[row][col] ?? {};
      const entrance = tileStates.value[row]?.[col] === "entrance";
      tileEdges.value[row][col] = {
        ...current,
        ...(row === buildingStartRow.value ? { top: !entrance } : {}),
        ...(col === buildingEndCol.value - 1 ? { right: !entrance } : {}),
        ...(row === buildingEndRow.value - 1 ? { bottom: !entrance } : {}),
        ...(col === buildingStartCol.value ? { left: !entrance } : {}),
      };
    }
  }
  dirty.value = true;
}

function clearAllDoors(): void {
  for (let row = buildingStartRow.value; row < buildingEndRow.value; row++) {
    for (let col = buildingStartCol.value; col < buildingEndCol.value; col++) {
      if (tileStates.value[row][col] === "entrance") tileStates.value[row][col] = "walkable";
    }
  }
  dirty.value = true;
}

function clearAllEdges(): void {
  tileEdges.value = tileEdges.value.map((row) => row.map(() => ({})));
  dirty.value = true;
}

function clearOuterWallsForTile(row: number, col: number): void {
  const current = tileEdges.value[row]?.[col];
  if (!current) return;
  if (row === buildingStartRow.value) current.top = false;
  if (row === buildingEndRow.value - 1) current.bottom = false;
  if (col === buildingStartCol.value) current.left = false;
  if (col === buildingEndCol.value - 1) current.right = false;
}

function updateTile(row: number, col: number, event: MouseEvent): void {
  if (activeMode.value === "entrance") {
    if (entranceBrush.value === "border") {
      const side = detectEdgeSide(event);
      if (side) toggleEdge(row, col, side);
      return;
    }
    tileStates.value[row][col] = "entrance";
    clearOuterWallsForTile(row, col);
  } else {
    tileStates.value[row][col] = walkBrush.value;
  }
  dirty.value = true;
}

function setMode(mode: WalkableMode): void {
  activeMode.value = mode;
}

async function saveWalkable(): Promise<void> {
  if (!props.floor) return;
  const states = tileStates.value.map((row) => [...row]);
  for (let row = 0; row < rows.value; row++) {
    for (let col = 0; col < cols.value; col++) {
      const isStreet = row < buildingStartRow.value || row >= buildingEndRow.value || col < buildingStartCol.value || col >= buildingEndCol.value;
      if (isStreet) states[row][col] = "walkable";
    }
  }
  const walkableGrid = states.map((row) => row.map((state) => state === "walkable" || state === "entrance"));
  await store.updateFloor(props.floor.id, {
    walkable: { walkableGrid, tileStates: states, tileEdges: tileEdges.value.map((row) => row.map((edgeValue) => ({ ...edgeValue }))) },
  });
  dirty.value = false;
}

function resetWalkable(): void {
  const fallback: TileState = props.floor?.defaultWalkable === false ? "blocked" : "walkable";
  tileStates.value = Array.from({ length: rows.value }, (_, row) =>
    Array.from({ length: cols.value }, (_, col) => {
      const isStreet = row < buildingStartRow.value || row >= buildingEndRow.value || col < buildingStartCol.value || col >= buildingEndCol.value;
      return isStreet ? "walkable" : fallback;
    }),
  );
  tileEdges.value = Array.from({ length: rows.value }, () => Array.from({ length: cols.value }, () => ({})));
  dirty.value = true;
}

function close(): void {
  emit("close");
}
</script>

<template>
  <ModalShell :open="open" title="Walkable Setting" max-width="1000px" width="min(94vw, 1000px)" height="auto" max-height="calc(100vh - 32px)" @close="close">
    <div class="modal__body">
      <div class="form__row form__row--tight form__row--wrap" role="toolbar" aria-label="Walkable setting tools">
        <button type="button" :class="{ 'flag--warning': activeMode === 'walk' }" @click="setMode('walk')">Wall / Block</button>
        <button type="button" :class="{ 'flag--warning': activeMode === 'entrance' }" @click="setMode('entrance')">Entrance / Wall</button>
        <template v-if="activeMode === 'walk'">
          <button type="button" :class="{ 'flag--warning': walkBrush === 'walkable' }" @click="walkBrush = 'walkable'">✓ Walk</button>
          <button type="button" :class="{ 'flag--warning': walkBrush === 'blocked' }" @click="walkBrush = 'blocked'">✕ Block</button>
        </template>
        <template v-else>
          <button type="button" :class="{ 'flag--warning': entranceBrush === 'door' }" @click="entranceBrush = 'door'">→ Door</button>
          <button type="button" :class="{ 'flag--warning': entranceBrush === 'border' }" @click="entranceBrush = 'border'">▢ Wall</button>
          <button type="button" @click="applyOuterWall">Outer Walls</button>
          <button type="button" @click="clearAllDoors">Clear Doors</button>
          <button type="button" @click="clearAllEdges">Clear Edges</button>
        </template>
        <span class="form__hint">Use the same Wall / Block and Entrance / Wall workflow as Origin Assets.</span>
      </div>

      <div class="form__row form__row--tight form__row--wrap walk__legend" aria-label="Walkable legend">
        <span><i class="swatch walk__swatch--walkable" />Walkable</span>
        <span><i class="swatch walk__swatch--blocked" />Blocked</span>
        <span><i class="swatch walk__swatch--entrance" />Entrance</span>
        <span><i class="swatch walk__swatch--wall" />Outer wall</span>
      </div>

      <div class="walk__grid" :style="gridStyle" role="grid" :aria-label="`${buildingCols} by ${buildingRows} walkable grid`">
        <template v-for="rowIndex in buildingRows" :key="`walk-row-${rowIndex}`">
          <button
            v-for="colIndex in buildingCols"
            :key="`walk-cell-${rowIndex}-${colIndex}`"
            type="button"
            class="walk__cell"
            :class="`walk__cell--${tileState(buildingStartRow + rowIndex - 1, buildingStartCol + colIndex - 1)}`"
            :style="{
              borderTopColor: edge(buildingStartRow + rowIndex - 1, buildingStartCol + colIndex - 1).top ? 'var(--accent-gold)' : undefined,
              borderRightColor: edge(buildingStartRow + rowIndex - 1, buildingStartCol + colIndex - 1).right ? 'var(--accent-gold)' : undefined,
              borderBottomColor: edge(buildingStartRow + rowIndex - 1, buildingStartCol + colIndex - 1).bottom ? 'var(--accent-gold)' : undefined,
              borderLeftColor: edge(buildingStartRow + rowIndex - 1, buildingStartCol + colIndex - 1).left ? 'var(--accent-gold)' : undefined,
            }"
            :aria-label="`Row ${rowIndex}, column ${colIndex}, ${tileState(buildingStartRow + rowIndex - 1, buildingStartCol + colIndex - 1)}`"
            @mousedown.prevent="updateTile(buildingStartRow + rowIndex - 1, buildingStartCol + colIndex - 1, $event)"
          />
        </template>
      </div>

      <div class="form__row form__row--tight form__row--wrap">
        <input class="input--disabled input--grow" :value="dirty ? 'Unsaved walkable changes' : 'Walkable saved'" readonly aria-label="Walkable status" />
        <div class="form__row">
          <button type="button" class="flag--ghost" @click="resetWalkable">Reset to floor default</button>
          <button type="button" class="flag--success" :disabled="!dirty" @click="saveWalkable">Save Walkable</button>
        </div>
      </div>
    </div>
  </ModalShell>
</template>

<style scoped>
.walk__legend {
  color: var(--text-secondary);
  font-size: var(--font-xs);
}

.walk__legend span {
  display: inline-flex;
  align-items: center;
  gap: var(--gap-xs);
}

.walk__swatch--walkable {
  background: color-mix(in srgb, var(--accent-green) 35%, var(--bg-primary));
}

.walk__swatch--blocked {
  background: var(--bg-primary);
}

.walk__swatch--entrance {
  background: color-mix(in srgb, var(--accent-blue) 45%, var(--bg-primary));
}

.walk__swatch--wall {
  border-color: var(--accent-gold);
}

.walk__grid {
  display: grid;
  grid-template-columns: repeat(var(--walk-cols), minmax(0, 1fr));
  width: min(100%, 900px);
  aspect-ratio: var(--walk-cols) / auto;
  border: 1px solid var(--border-dim);
  background: var(--bg-primary);
}

.walk__cell {
  min-width: 0;
  aspect-ratio: 1;
  padding: 0;
  border-width: 1px;
  border-style: solid;
  border-color: var(--border-dim);
  border-radius: 0;
  cursor: crosshair;
}

.walk__cell--walkable {
  background: color-mix(in srgb, var(--accent-green) 35%, var(--bg-primary));
}

.walk__cell--blocked {
  background: var(--bg-primary);
}

.walk__cell--entrance {
  background: color-mix(in srgb, var(--accent-blue) 55%, var(--bg-primary));
}
</style>
