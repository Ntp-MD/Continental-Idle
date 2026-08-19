<script setup lang="ts">
import { ref, computed, watch, inject, onUnmounted } from "vue";
import { useAssetsStore } from "../blueprintStore";
import { useToast } from "@/composables/useToast";
import { useConfirm } from "@/composables/useConfirm";
import { useAsyncAction } from "../composables/useAsyncAction";
import NpcManagerModal from "./NpcManagerModal.vue";
import FloorModal from "./FloorModal.vue";
import DeployNpcModal from "./DeployNpcModal.vue";
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
const npcOverlayPosition = ref({ x: 16, y: 72 });
let npcOverlayDrag: { offsetX: number; offsetY: number } | null = null;

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

function onConfirmDeploy() {
  showDeployModal.value = false;
  store.setMode("npc-preview");
  npcSimulation.deploy(store.state.currentFloorId);
}

async function onSyncOrigins() {
  try {
    const refreshedCount = await run(async () => {
      const count = await store.refreshOriginInstances();
      npcSimulation.refresh();
      return count;
    });
    toast.success(`Origins refreshed${refreshedCount ? ` — ${refreshedCount} instances rebuilt` : ""}`);
  } catch {
    toast.error("Failed to refresh origins");
  }
}

const total = computed(() => npcs.value.length);
const currentFloorLabel = computed(() => store.currentFloor.value?.label ?? "—");
const countsByRole = computed(() => {
  const map = new Map<string, number>();
  for (const npc of npcs.value) map.set(npc.type, (map.get(npc.type) ?? 0) + 1);
  return map;
});
function startNpcOverlayDrag(event: PointerEvent) {
  const target = event.currentTarget as HTMLElement;
  const rect = target.parentElement?.getBoundingClientRect();
  if (!rect) return;
  npcOverlayDrag = { offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
  target.setPointerCapture(event.pointerId);
  target.addEventListener("pointermove", moveNpcOverlay);
  target.addEventListener("pointerup", stopNpcOverlayDrag, { once: true });
  target.addEventListener("pointercancel", stopNpcOverlayDrag, { once: true });
}

function moveNpcOverlay(event: PointerEvent) {
  if (!npcOverlayDrag) return;
  const width = 280;
  const height = 160;
  npcOverlayPosition.value = {
    x: Math.max(8, Math.min(window.innerWidth - width - 8, event.clientX - npcOverlayDrag.offsetX)),
    y: Math.max(8, Math.min(window.innerHeight - height - 8, event.clientY - npcOverlayDrag.offsetY)),
  };
}

function stopNpcOverlayDrag(event: PointerEvent) {
  const target = event.currentTarget as HTMLElement | null;
  if (target) target.removeEventListener("pointermove", moveNpcOverlay);
  npcOverlayDrag = null;
}

function onTogglePause() {
  isPaused.value ? resume() : pause();
}
function onReset() {
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

watch(
  () => store.state.layout.canvas,
  (c) => {
    widthInput.value = c.width;
    heightInput.value = c.height;
    tileInput.value = c.tileSize;
    bgColorInput.value = c.bgColor;
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

async function onSave() {
  try {
    const saved = await run(() => store.saveLayout());
    if (saved) toast.success("Layout saved");
    else toast.error("Failed to save layout");
  } catch {
    toast.error("Failed to save layout");
  }
}

function onSyncToGame() {
  if (store.syncToGame()) toast.success("Blueprint synced to game");
}

onUnmounted(() => {
  npcOverlayDrag = null;
});
</script>

<template>
  <div class="editor__toolbar">
    <button class="btn--ghost btn--icon" @click="showSettings = true" title="Canvas Settings & Shortcuts" aria-label="Canvas settings">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path
          d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
        />
      </svg>
    </button>

    <button :class="{ 'btn--warning': store.state.mode === 'object' }" @click="onSwitchMode('object')" aria-label="Switch to object mode">Object</button>
    <button :class="{ 'btn--warning': store.state.mode === 'draw' }" @click="onSwitchMode('draw')" aria-label="Switch to draw mode">Draw Object</button>
    <button :class="{ 'btn--warning': store.state.mode === 'move' }" @click="onSwitchMode('move')" aria-label="Switch to move mode">Move</button>

    <button @click="onNpcManager" title="Configure NPC roles and tags" aria-label="Open NPC manager">NPC Manager</button>
    <button class="btn--warning" :disabled="pending" @click="onSyncOrigins" title="Re-resolve every placed object from its origin asset and rebuild walkable layout" aria-label="Refresh all origin assets">Sync Origins</button>
    <button @click="onFloorManager" title="Manage floors: add, delete, reorder, role restrictions" aria-label="Open floor manager">Floor Manager</button>
    <button :class="{ 'btn--warning': store.state.mode === 'npc-preview' }" @click="onDeployNpc" title="Deploy NPCs on current floor (configure roles first)">Deploy NPCs</button>

    <button class="btn--primary" :disabled="pending" @click="onSave" title="Save layout to assets-store.ts" aria-label="Save layout">Save</button>
    <button class="btn--success" style="margin-left: auto" @click="onSyncToGame" title="Apply blueprint layout to the main game" aria-label="Sync blueprint to game">Sync Game</button>

    <button class="editor__back" @click="onBack" aria-label="Back to start screen">◀ Back</button>

    <Teleport to="body">
      <section v-if="store.state.mode === 'npc-preview'" class="npc" :style="{ left: `${npcOverlayPosition.x}px`, top: `${npcOverlayPosition.y}px` }" aria-label="NPC simulation controls">
        <header class="npc__header" @pointerdown="startNpcOverlayDrag">
          <div class="npc__title">
            <strong>NPC Preview</strong>
            <span>{{ currentFloorLabel }} · {{ total }}</span>
          </div>
          <div class="npc__roles">
            <span v-for="[type, count] in countsByRole" :key="type" class="npc__role">
              <span>{{ type }}</span>
              <b>{{ count }}</b>
            </span>
          </div>
        </header>
        <div class="npc__controls">
          <button type="button" @click="onTogglePause" :aria-label="isPaused ? 'Resume NPC simulation' : 'Pause NPC simulation'">{{ isPaused ? "▶ Resume" : "❚❚ Pause" }}</button>
          <label class="npc__speed">
            <span>Speed</span>
            <select :value="simSpeed" @change="simSpeed = +($event.target as HTMLSelectElement).value" aria-label="Simulation speed">
              <option :value="1">1x</option>
              <option :value="2">2x</option>
              <option :value="4">4x</option>
              <option :value="8">8x</option>
            </select>
          </label>
          <button type="button" class="btn--danger" @click="onReset" aria-label="Clear all NPCs and exit preview">Clear</button>
          <button type="button" class="btn--ghost" @click="onExitDeploy" aria-label="Exit NPC deploy preview">✕ Exit</button>
        </div>
      </section>
    </Teleport>

    <NpcManagerModal :open="showNpcManager" @close="showNpcManager = false" />
    <FloorModal :open="showFloorModal" @close="showFloorModal = false" />
    <DeployNpcModal :open="showDeployModal" @close="showDeployModal = false" @deploy="onConfirmDeploy" />

    <Teleport to="body">
      <div v-if="showSettings" class="modal__overlay settings__overlay" @click.self="showSettings = false">
        <div class="settings__panel">
          <div class="settings__header">
            <span>Canvas Settings</span>
            <button class="btn--ghost btn--icon" @click="showSettings = false" aria-label="Close">✕</button>
          </div>
          <div class="settings__body">
            <div class="settings__section">
              <div class="settings__title">Canvas Size</div>
              <div class="settings__row">
                <label for="canvas__width">Width</label>
                <input id="canvas__width" class="input" type="number" v-model.number="widthInput" min="100" step="25" />
              </div>
              <div class="settings__row">
                <label for="canvas__height">Height</label>
                <input id="canvas__height" class="input" type="number" v-model.number="heightInput" min="100" step="25" />
              </div>
              <div class="settings__row">
                <label for="canvas__tile">Tile Size</label>
                <input id="canvas__tile" class="input" type="number" v-model.number="tileInput" min="5" step="5" />
              </div>
              <button class="btn--primary" :disabled="pending" @click="applyCanvasSize" aria-label="Apply canvas size">Apply</button>
              <div class="settings__hint">Changing canvas size will re-snap all objects to the new grid.</div>
            </div>
            <div class="settings__section">
              <div class="settings__title">Background</div>
              <div class="settings__row">
                <label for="canvas__bgcolor">Color</label>
                <ColorInput v-model="bgColorInput" :allow-transparent="true" placeholder="#RRGGBB or transparent" aria-label="Canvas background color" @commit="applyCanvasBgColor" />
              </div>
              <div class="settings__hint">Hex color or 'transparent'. Leave empty for default.</div>
            </div>
            <div class="settings__section">
              <div class="settings__title">Keyboard Shortcuts</div>
              <div class="settings__shortcuts">
                <div class="settings__shortcut"><kbd>Delete</kbd><span>Delete selected</span></div>
                <div class="settings__shortcut"><kbd>R</kbd><span>Rotate object</span></div>
                <div class="settings__shortcut"><kbd>L</kbd><span>Lock/unlock object</span></div>
                <div class="settings__shortcut"><kbd>Ctrl+C</kbd><span>Copy selected</span></div>
                <div class="settings__shortcut"><kbd>Ctrl+V</kbd><span>Paste objects</span></div>
                <div class="settings__shortcut"><kbd>Ctrl+L</kbd><span>Link selected objects</span></div>
                <div class="settings__shortcut"><kbd>Shift+Click</kbd><span>Add to selection</span></div>
                <div class="settings__shortcut"><kbd>Arrow Keys</kbd><span>Move selected by 1 tile</span></div>
                <div class="settings__shortcut"><kbd>Space+Drag</kbd><span>Pan canvas</span></div>
                <div class="settings__shortcut"><kbd>Ctrl+0</kbd><span>Fit to screen</span></div>
                <div class="settings__shortcut"><kbd>+/-</kbd><span>Zoom in/out</span></div>
                <div class="settings__shortcut"><kbd>Esc</kbd><span>Deselect / cancel drag</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
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

.editor__back {
  padding: var(--gap-xs) var(--gap-sm);
  font-size: var(--font-sm);
}

.npc {
  position: fixed;
  z-index: var(--z-layer-4);
  width: min(280px, calc(100vw - 16px));
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  padding: var(--gap-sm);
  background: color-mix(in srgb, var(--bg-secondary) 94%, transparent);
  border: 1px solid var(--accent-blue);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  color: var(--text-primary);
  backdrop-filter: blur(8px);
}

.npc__header {
  display: flex;
  align-items: flex-start;
  gap: var(--gap-sm);
  cursor: grab;
  user-select: none;
  touch-action: none;
}

.npc__header:active {
  cursor: grabbing;
}

.npc__title {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
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
  max-width: 9em;
}

.npc__role {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px var(--gap-xs);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  font-size: var(--font-xs);
}

.npc__role b {
  color: var(--accent-blue);
}

.npc__controls {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  margin-top: var(--gap-sm);
  padding-top: var(--gap-sm);
  border-top: 1px solid var(--border-dim);
}

.npc__speed {
  display: inline-flex;
  align-items: center;
  gap: var(--gap-xs);
  margin-right: auto;
  color: var(--text-secondary);
  font-size: var(--font-xs);
}

.npc__speed select {
  min-width: 3em;
  font-size: var(--font-xs);
  background: var(--bg-primary);
  cursor: pointer;
}

.settings__overlay {
  z-index: var(--z-layer-4);
}

.settings__panel {
  width: min(380px, calc(100vw - 32px));
  max-height: calc(100vh - 32px);
  background: var(--bg-secondary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: 0 8px 32px color-mix(in srgb, var(--bg-primary) 50%, transparent);
}

.settings__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--gap-sm) var(--gap-md);
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-dim);
  font-weight: 600;
  font-size: var(--font-md);
}

.settings__body {
  padding: var(--gap-md);
  display: flex;
  flex-direction: column;
  gap: var(--gap-md);
  max-height: 70vh;
  overflow-y: auto;
}

.settings__section {
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
}

.settings__title {
  font-size: var(--font-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-primary);
  opacity: 0.7;
}

.settings__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--gap-sm);
  font-size: var(--font-sm);
}

.settings__row label {
  min-width: fit-content;
  color: var(--text-primary);
}

.settings__row input {
  flex: 1;
  min-width: 0;
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  color: var(--text-primary);
  padding: var(--gap-xs) var(--gap-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-sm);
}

.settings__row input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-primary) 15%, transparent);
}

.settings__hint {
  font-size: var(--font-xs);
  color: var(--text-dim);
  line-height: 1.4;
}

.settings__shortcuts {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
}

.settings__shortcut {
  display: flex;
  align-items: center;
  gap: var(--gap-md);
  font-size: var(--font-sm);
}

.settings__shortcut kbd {
  display: inline-block;
  min-width: fit-content;
  padding: 2px var(--gap-sm);
  background: var(--bg-card);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: var(--font-xs);
  color: var(--text-primary);
  text-align: center;
}

.settings__shortcut span {
  color: var(--text-secondary);
}
</style>
