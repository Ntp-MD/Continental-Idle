<script setup lang="ts">
import { ref, computed, watch, inject, onUnmounted } from "vue";
import { useAssetsStore } from "../blueprintStore";
import { useToast } from "@/composables/useToast";
import { useConfirm } from "@/composables/useConfirm";
import { useAsyncAction } from "../composables/useAsyncAction";
import NpcManagerModal from "./NpcManagerModal.vue";
import FloorModal from "./FloorModal.vue";
import DeployNpcModal from "./DeployNpcModal.vue";
import ModalShell from "./ModalShell.vue";
import ColorInput from "./ColorInput.vue";
import { useNpcSimulation } from "../composables/useNpcSimulation";

const store = useAssetsStore();
const toast = useToast();
const confirm = useConfirm().confirm;
const emit = defineEmits<{ close: [] }>();
const { pending, run } = useAsyncAction();
const npcSimulation = inject("npcSimulation") as ReturnType<typeof useNpcSimulation>;
const { npcs, isPaused, pause, resume, reset, stop, simSpeed } = npcSimulation;
const showNpcManager = ref(false);
const showFloorModal = ref(false);
const showDeployModal = ref(false);
const showSettings = ref(false);

function onNpcManager() {
  showNpcManager.value = true;
}

function onFloorManager() {
  showFloorModal.value = true;
}

function onDeployNpc() {
  const hasRoles = (store.state.layout.npcConfig?.roles?.length ?? 0) > 0;
  if (!hasRoles) {
    toast.info("Configure NPC roles first");
    showNpcManager.value = true;
    return;
  }
  showDeployModal.value = true;
}

function onConfirmDeploy(spawnFloorId?: string) {
  showDeployModal.value = false;
  store.setMode("npc-preview");
  npcSimulation.deploy(store.state.currentFloorId, spawnFloorId || undefined);
}

async function onSyncOrigins() {
  try {
    const refreshedCount = await run(async () => {
      const count = await store.refreshOriginInstances();
      npcSimulation.refresh();
      return count;
    });
    toast.success(`Origins refreshed${refreshedCount ? ` - ${refreshedCount} instances rebuilt` : ""}`);
  } catch {
    toast.error("Failed to refresh origins");
  }
}

const total = computed(() => npcs.value.length);
const currentFloorLabel = computed(() => store.currentFloor.value?.label ?? "-");
const countsByRole = computed(() => {
  const map = new Map<string, number>();
  for (const npc of npcs.value) map.set(npc.type, (map.get(npc.type) ?? 0) + 1);
  return map;
});

function onTogglePause() {
  isPaused.value ? resume() : pause();
}

const NPC_STATUS_ORDER = ["walking", "interacting", "queued", "waiting", "idle"] as const;
type NpcStatusKey = (typeof NPC_STATUS_ORDER)[number];
const NPC_STATUS_LABELS: Record<NpcStatusKey, string> = {
  walking: "Moving",
  interacting: "Interacting",
  queued: "Queued",
  waiting: "Waiting",
  idle: "Idle",
};
const statusCounts = ref<{ key: NpcStatusKey; label: string; count: number }[]>([]);
const statusTimer = window.setInterval(() => {
  if (store.state.mode !== "npc-preview") return;
  const counts = new Map<string, number>();
  for (const npc of npcs.value) counts.set(npc.status, (counts.get(npc.status) ?? 0) + 1);
  const next = NPC_STATUS_ORDER.filter((status) => counts.has(status)).map((status) => ({ key: status, label: NPC_STATUS_LABELS[status], count: counts.get(status)! }));
  const prev = statusCounts.value;
  if (prev.length === next.length && prev.every((p, i) => p.key === next[i].key && p.count === next[i].count)) return;
  statusCounts.value = next;
}, 300);
onUnmounted(() => window.clearInterval(statusTimer));

async function onReset() {
  const confirmed = await confirm({
    title: "Clear Simulation",
    message: "Remove all deployed NPCs and exit preview?",
    confirmLabel: "Clear",
    cancelLabel: "Cancel",
    danger: true,
  });
  if (!confirmed) return;
  reset();
  store.setMode("move");
}
function onExitDeploy() {
  stop();
  store.setMode("move");
}
function onBack() {
  if (store.state.mode === "npc-preview") stop();
  emit("close");
}
function onSwitchMode(mode: "object" | "draw" | "move") {
  if (store.state.mode === "npc-preview") stop();
  store.setMode(mode);
}

const widthInput = ref(store.state.layout.canvas.width);
const heightInput = ref(store.state.layout.canvas.height);
const tileInput = ref(store.state.layout.canvas.tileSize);
const bgColorInput = ref(store.state.layout.canvas.bgColor);
const labelColorInput = ref(store.state.layout.canvas.labelColor);
const wallColorInput = ref(store.state.layout.canvas.wallColor);
const wallThicknessInput = ref<number | undefined>(store.state.layout.canvas.wallThickness);

watch(
  () => store.state.layout.canvas,
  (c) => {
    widthInput.value = c.width;
    heightInput.value = c.height;
    tileInput.value = c.tileSize;
    bgColorInput.value = c.bgColor;
    labelColorInput.value = c.labelColor;
    wallColorInput.value = c.wallColor;
    wallThicknessInput.value = c.wallThickness;
  },
);

async function applyCanvasSize() {
  const canvas = store.state.layout.canvas;
  const hasPlacedContent = store.state.layout.floors.some((floor) => floor.objects.length > 0);
  const changed = widthInput.value !== canvas.width || heightInput.value !== canvas.height || tileInput.value !== canvas.tileSize;

  if (changed && hasPlacedContent) {
    const confirmed = await confirm({
      title: "Resize canvas",
      message: "Changing canvas settings will snap and clamp placed objects to the new grid and bounds. Continue?",
      confirmLabel: "Continue",
      cancelLabel: "Cancel",
      danger: true,
    });
    if (!confirmed) return;
  }

  try {
    const saved = await run(() => store.resizeCanvas(widthInput.value, heightInput.value, tileInput.value));
    if (!saved) {
      toast.error("Failed to resize canvas");
      return;
    }
    toast.info("Canvas resized");
    showSettings.value = false;
  } catch {
    toast.error("Failed to resize canvas");
  }
}

async function applyCanvasBgColor(value: string | undefined) {
  try {
    await run(() => store.setCanvasBgColor(value));
  } catch {
    toast.error("Failed to set canvas background color");
  }
}

async function applyLabelColor(value: string | undefined) {
  try {
    const saved = await run(() => store.setCanvasLabelColor(value));
    if (!saved) toast.error("Failed to set label color");
  } catch {
    toast.error("Failed to set label color");
  }
}

async function applyWallColor(value: string | undefined) {
  try {
    const saved = await run(() => store.setWallColor(value));
    if (!saved) {
      toast.error("Failed to set wall color");
      return;
    }
    toast.success(value ? `Wall color saved: ${value}` : "Wall color reset to default");
  } catch {
    toast.error("Failed to set wall color");
  }
}

function onWallColorInvalid(value: string) {
  toast.error(`"${value}" is not a valid color - use #RRGGBB`);
}

async function applyWallThickness() {
  const value = typeof wallThicknessInput.value === "number" && wallThicknessInput.value > 0 ? Math.round(wallThicknessInput.value) : null;
  try {
    const saved = await run(() => store.setWallThickness(value));
    if (!saved) toast.error("Wall thickness must be 1-10");
  } catch {
    toast.error("Failed to set wall thickness");
  }
}

async function applyStreetFloor(floorId: string | null) {
  try {
    const saved = await run(() => store.setStreetFloor(floorId));
    if (!saved) toast.error("Failed to update street floor");
  } catch {
    toast.error("Failed to update street floor");
  }
}

function onSyncToGame() {
  if (store.syncToGame()) toast.success("Blueprint synced to game");
}
</script>

<template>
  <div class="editor__toolbar">
    <button class="flag--ghost flag--icon" @click="showSettings = true" title="Canvas Settings" aria-label="Canvas settings">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path
          d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
        />
      </svg>
    </button>

    <button :class="{ 'flag--warning': store.state.mode === 'object' && !store.state.wallPaint }" @click="onSwitchMode('object')" aria-label="Switch to object mode">Object</button>
    <button :class="{ 'flag--warning': store.state.mode === 'draw' && !store.state.wallPaint }" @click="onSwitchMode('draw')" aria-label="Switch to draw mode">Draw Object</button>
    <button :class="{ 'flag--warning': store.state.mode === 'move' && !store.state.wallPaint }" @click="onSwitchMode('move')" aria-label="Switch to move mode">Move</button>
    <button :class="{ 'flag--warning': store.state.wallPaint }" :disabled="store.state.mode === 'npc-preview'" @click="store.setWallPaint(!store.state.wallPaint)" title="Draw walls on tile boundaries" aria-label="Toggle draw wall tool">Draw Wall</button>

    <button @click="onNpcManager" title="Configure NPC roles and tags" aria-label="Open NPC manager">NPC Manager</button>
    <button class="flag--warning" :disabled="pending" @click="onSyncOrigins" title="Re-resolve every placed object from its origin asset and rebuild walkable layout" aria-label="Refresh all placed objects from origins">Refresh Objects</button>
    <button @click="onFloorManager" title="Manage floors: add, delete, reorder, role restrictions" aria-label="Open floor manager">Floor Manager</button>
    <button :class="{ 'flag--warning': store.state.mode === 'npc-preview' }" @click="onDeployNpc" title="Deploy NPCs on current floor (configure roles first)">Deploy NPCs</button>

    <button class="flag--success editor__toolbar--spacer" @click="onSyncToGame" title="Apply blueprint layout to the main game" aria-label="Sync blueprint to game">Sync Game</button>

    <button class="flag--danger" @click="onBack" aria-label="Back to start screen">Back</button>

    <ModalShell :open="store.state.mode === 'npc-preview'" title="NPC Preview" max-width="340px" width="min(94vw, 340px)" floating @close="onExitDeploy">
      <div class="modal__body npc__body">
        <div class="form__row form__row--between">
          <div class="npc__title">
            <strong>{{ currentFloorLabel }}</strong>
            <span>{{ total }} NPC{{ total === 1 ? "" : "s" }}</span>
          </div>
          <span class="npc__status" :class="{ 'npc__status--paused': isPaused }" role="status">{{ isPaused ? "Paused" : "Running" }}</span>
          <div class="npc__roles">
            <span v-for="[type, count] in countsByRole" :key="type" class="npc__role">
              <span>{{ type }}</span>
              <b>{{ count }}</b>
            </span>
          </div>
        </div>
        <div v-if="total > 0" class="npc__stats">
          <span v-for="s in statusCounts" :key="s.key" class="npc__stat" :class="s.key === 'idle' ? undefined : `npc__stat--${s.key}`">
            {{ s.label }} <b>{{ s.count }}</b>
          </span>
        </div>
        <div class="form__row form__row--border">
          <button type="button" @click="onTogglePause" :aria-label="isPaused ? 'Resume NPC simulation' : 'Pause NPC simulation'">{{ isPaused ? "Resume" : "Pause" }}</button>
          <div class="npc__speed" role="group" aria-label="Simulation speed">
            <button v-for="s in [1, 2, 4, 8]" :key="s" type="button" class="npc__speed-option" :class="{ 'npc__speed-option--active': simSpeed === s }" :aria-pressed="simSpeed === s" @click="simSpeed = s">{{ s }}x</button>
          </div>
          <button type="button" class="flag--danger" @click="onReset" aria-label="Clear all NPCs and exit preview">Clear</button>
        </div>
      </div>
    </ModalShell>

    <NpcManagerModal :open="showNpcManager" @close="showNpcManager = false" />
    <FloorModal :open="showFloorModal" @close="showFloorModal = false" />
    <DeployNpcModal :open="showDeployModal" @close="showDeployModal = false" @deploy="onConfirmDeploy" />

    <ModalShell :open="showSettings" title="Canvas Settings" max-width="380px" width="min(94vw, 380px)" max-height="calc(100vh - 32px)" @close="showSettings = false">
      <div class="modal__body settings__body">
        <div class="form__group">
          <div class="form__title">Canvas Size</div>
          <div class="form__row form__row--pair">
            <div class="form__row">
              <label for="canvas__width">Width</label>
              <input id="canvas__width" type="number" v-model.number="widthInput" min="100" step="25" />
            </div>
            <div class="form__row">
              <label for="canvas__height">Height</label>
              <input id="canvas__height" type="number" v-model.number="heightInput" min="100" step="25" />
            </div>
            <div class="form__row">
              <label for="canvas__tile">Tile</label>
              <input id="canvas__tile" type="number" v-model.number="tileInput" min="5" step="5" />
            </div>
          </div>
          <button class="flag--active" :disabled="pending" @click="applyCanvasSize" aria-label="Apply canvas size">Apply</button>
          <div class="form__hint">Changing canvas size will re-snap all objects to the new grid.</div>
        </div>
        <div class="form__group">
          <div class="form__title">Background</div>
          <div class="form__row">
            <label for="canvas__bgcolor">Color</label>
            <ColorInput v-model="bgColorInput" :allow-transparent="true" placeholder="#RRGGBB or transparent" aria-label="Canvas background color" @commit="applyCanvasBgColor" />
          </div>
          <div class="form__hint">Hex color or 'transparent'. Leave empty for default.</div>
        </div>
        <div class="form__group">
          <div class="form__title">Labels</div>
          <div class="form__row">
            <label for="canvas__labelcolor">Color</label>
            <ColorInput v-model="labelColorInput" allow-transparent placeholder="#RRGGBB (empty = theme default)" aria-label="Object label color" @commit="applyLabelColor" />
          </div>
          <div class="form__hint">One color for every object label on the canvas.</div>
        </div>
        <div class="form__group">
          <div class="form__title">Walls</div>
          <div class="form__row form__row--pair">
            <div class="form__row">
              <label>Color</label>
              <ColorInput v-model="wallColorInput" placeholder="#RRGGBB (empty = theme green)" aria-label="Wall line color" @commit="applyWallColor" @commit-invalid="onWallColorInvalid" />
            </div>
            <div class="form__row">
              <label for="canvas__wallthickness">Thickness</label>
              <input id="canvas__wallthickness" type="number" v-model.number="wallThicknessInput" min="1" max="10" step="1" :placeholder="'3'" @change="applyWallThickness" />
            </div>
          </div>
          <div class="form__hint">Line style for painted floor walls and the building boundary.</div>
        </div>
        <div class="form__group">
          <div class="form__title">Street</div>
          <div class="form__row form__row--pair">
            <div class="form__row">
              <label for="canvas__streetfloor">On floor</label>
              <select id="canvas__streetfloor" :value="store.state.layout.streetFloorId ?? ''" aria-label="Floor that displays the street ring" @change="applyStreetFloor(($event.target as HTMLSelectElement).value || null)">
                <option value="">None</option>
                <option v-for="f in store.state.layout.floors" :key="f.id" :value="f.id">{{ f.label }} - {{ f.name }}</option>
              </select>
            </div>
            <div class="form__row">
              <label for="canvas__streetwidth">Ring</label>
              <select id="canvas__streetwidth" :value="store.state.layout.streetWidthTiles ?? ''" aria-label="Street ring width in tiles" @change="store.setStreetWidth(Number(($event.target as HTMLSelectElement).value) || null)">
                <option value="">Default (8 tiles)</option>
                <option v-for="w in [5, 6, 7, 8, 9, 10, 11, 12]" :key="w" :value="w">{{ w }} tiles</option>
              </select>
            </div>
          </div>
          <div class="form__hint">Street ring renders on one floor; ring width drives placement boundary, NPC walkable zone and the drawn road.</div>
        </div>
      </div>
    </ModalShell>
  </div>
</template>

<style scoped>
.editor__toolbar {
  display: flex;
  align-items: center;
  gap: var(--gap-sm);
  padding: var(--gap-sm) var(--gap-md);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-dim);
  color: var(--text-primary);
  flex-wrap: wrap;
  overflow: visible;
  flex-shrink: 0;
  position: relative;
}

.editor__toolbar--spacer {
  margin-left: auto;
}

.npc__body {
  gap: var(--gap-sm);
}

.npc__title {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xxs);
}

.npc__title span {
  color: var(--text-secondary);
  font-size: var(--font-xs);
}

.npc__roles {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--gap-xs);
  max-width: 180px;
}

.npc__status {
  padding: var(--gap-xxs) var(--gap-xs);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--accent-green) 18%, transparent);
  color: var(--accent-green);
  font-size: var(--font-xs);
  font-weight: 600;
}

.npc__status--paused {
  background: color-mix(in srgb, var(--accent-gold) 18%, transparent);
  color: var(--accent-gold);
}

.npc__stats {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-xs);
  font-size: var(--font-xs);
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.npc__stat b {
  color: var(--text-primary);
}

.npc__stat::before {
  content: "";
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 4px;
  vertical-align: middle;
  background: var(--dot-color, var(--text-secondary));
}

.npc__stat--walking {
  --dot-color: var(--accent-blue);
}

.npc__stat--interacting {
  --dot-color: var(--accent-green);
}

.npc__stat--queued,
.npc__stat--waiting {
  --dot-color: var(--accent-gold);
}

.npc__role {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: var(--gap-xxs) var(--gap-xs);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  font-size: var(--font-xs);
}

.npc__role b {
  color: var(--accent-blue);
}

.npc__speed {
  display: inline-flex;
  gap: var(--gap-xxs);
  margin-right: auto;
}

.npc__speed-option {
  padding: var(--gap-xxs) var(--gap-sm);
  font-size: var(--font-xs);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-primary);
}

.npc__speed-option--active {
  background: color-mix(in srgb, var(--accent-blue) 25%, var(--bg-primary));
  border-color: var(--accent-blue);
  color: var(--text-bright);
}

.settings__body {
  gap: var(--gap-md);
  max-height: 70vh;
}

.settings__body .form__row {
  font-size: var(--font-sm);
}

.settings__body .form__row label {
  min-width: fit-content;
  color: var(--text-primary);
}
</style>
