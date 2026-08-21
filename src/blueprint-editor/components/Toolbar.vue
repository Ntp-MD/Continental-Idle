<script setup lang="ts">
import { ref, computed, watch, inject } from "vue";
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
</script>

<template>
  <div class="editor__toolbar">
    <button class="flag--ghost flag--icon" @click="showSettings = true" title="Canvas Settings & Shortcuts" aria-label="Canvas settings">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path
          d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
        />
      </svg>
    </button>

    <button :class="{ 'flag--warning': store.state.mode === 'object' }" @click="onSwitchMode('object')" aria-label="Switch to object mode">Object</button>
    <button :class="{ 'flag--warning': store.state.mode === 'draw' }" @click="onSwitchMode('draw')" aria-label="Switch to draw mode">Draw Object</button>
    <button :class="{ 'flag--warning': store.state.mode === 'move' }" @click="onSwitchMode('move')" aria-label="Switch to move mode">Move</button>

    <button @click="onNpcManager" title="Configure NPC roles and tags" aria-label="Open NPC manager">NPC Manager</button>
    <button class="flag--warning" :disabled="pending" @click="onSyncOrigins" title="Re-resolve every placed object from its origin asset and rebuild walkable layout" aria-label="Refresh all origin assets">Sync Origins</button>
    <button @click="onFloorManager" title="Manage floors: add, delete, reorder, role restrictions" aria-label="Open floor manager">Floor Manager</button>
    <button :class="{ 'flag--warning': store.state.mode === 'npc-preview' }" @click="onDeployNpc" title="Deploy NPCs on current floor (configure roles first)">Deploy NPCs</button>

    <button class="flag--success" :disabled="pending" @click="onSave" title="Save layout to assets-store.ts" aria-label="Save layout">Save</button>
    <button class="flag--success editor__toolbar--spacer" @click="onSyncToGame" title="Apply blueprint layout to the main game" aria-label="Sync blueprint to game">Sync Game</button>

    <button class="flag--danger" @click="onBack" aria-label="Back to start screen">◀ Back</button>

    <ModalShell :open="store.state.mode === 'npc-preview'" title="NPC Preview" max-width="340px" width="min(94vw, 340px)" floating @close="onExitDeploy">
      <div class="modal__body npc__body">
        <div class="form__row form__row--between">
          <div class="npc__title">
            <strong>{{ currentFloorLabel }}</strong>
            <span>{{ total }} NPCs</span>
          </div>
          <div class="npc__roles">
            <span v-for="[type, count] in countsByRole" :key="type" class="npc__role">
              <span>{{ type }}</span>
              <b>{{ count }}</b>
            </span>
          </div>
        </div>
        <div class="form__row form__row--border">
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
          <div class="form__row">
            <label for="canvas__width">Width</label>
            <input id="canvas__width" class="input--grow" type="number" v-model.number="widthInput" min="100" step="25" />
          </div>
          <div class="form__row">
            <label for="canvas__height">Height</label>
            <input id="canvas__height" class="input--grow" type="number" v-model.number="heightInput" min="100" step="25" />
          </div>
          <div class="form__row">
            <label for="canvas__tile">Tile Size</label>
            <input id="canvas__tile" class="input--grow" type="number" v-model.number="tileInput" min="5" step="5" />
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
          <div class="form__title">Keyboard Shortcuts</div>
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
  align-items: center;
  gap: var(--gap-xs);
  margin-right: auto;
  color: var(--text-secondary);
  font-size: var(--font-xs);
}

.npc__speed select {
  min-width: 30px;
  font-size: var(--font-xs);
  background: var(--bg-primary);
  cursor: pointer;
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
  padding: var(--gap-xxs) var(--gap-sm);
  background: var(--bg-primary);
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
