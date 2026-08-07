<script setup lang="ts">
import { ref, computed, watch, inject } from "vue";
import { useAssetsStore } from "../blueprintStore";
import { useToast } from "@/composables/useToast";
import { useConfirm } from "@/composables/useConfirm";
import { useAsyncAction } from "../composables/useAsyncAction";
import NpcBehaviorModal from "./npcBehaviorModal.vue";
import FloorModal from "./floorModal.vue";
import { useNpcSimulation } from "../composables/useNpcSimulation";

const store = useAssetsStore();
const toast = useToast();
const confirm = useConfirm().confirm;
const emit = defineEmits<{ close: [] }>();
const { pending, run } = useAsyncAction();
const npcSimulation = inject("npcSimulation") as ReturnType<typeof useNpcSimulation>;
const { npcs, isPaused, pause, resume, stop, reset, simSpeed } = npcSimulation;
void stop;
const showNpcSettings = ref(false);
const showFloorModal = ref(false);
const showSettings = ref(false);

function onNpcSettings() {
  showNpcSettings.value = true;
}

function onDeployNpc() {
  const hasRoles = (store.state.layout.npcConfig?.roles?.length ?? 0) > 0;
  if (!hasRoles) {
    toast.info("Configure NPC roles first");
    showNpcSettings.value = true;
    return;
  }
  store.setMode("npc-preview");
  npcSimulation.deploy(store.state.currentFloorId);
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
}
function onBack() {
  if (store.state.mode === "npc-preview") stop();
  emit("close");
}

const widthInput = ref(store.state.layout.canvas.width);
const heightInput = ref(store.state.layout.canvas.height);
const tileInput = ref(store.state.layout.canvas.tileSize);

watch(
  () => store.state.layout.canvas,
  (c) => {
    widthInput.value = c.width;
    heightInput.value = c.height;
    tileInput.value = c.tileSize;
  },
);

async function applyCanvasSize() {
  const canvas = store.state.layout.canvas;
  const hasPlacedContent = store.state.layout.floors.some((floor) => floor.rooms.length > 0 || floor.objects.length > 0);
  const changed = widthInput.value !== canvas.width || heightInput.value !== canvas.height || tileInput.value !== canvas.tileSize;

  if (changed && hasPlacedContent) {
    const confirmed = await confirm({
      title: "Resize canvas",
      message: "Changing canvas settings will snap and clamp placed rooms and objects to the new grid and bounds. Continue?",
      confirmLabel: "Continue",
      cancelLabel: "Cancel",
      danger: true,
    });
    if (!confirmed) return;
  }

  try {
    await run(() => store.resizeCanvas(widthInput.value, heightInput.value, tileInput.value));
    toast.info("Canvas resized");
    showSettings.value = false;
  } catch {
    toast.error("Failed to resize canvas");
  }
}

async function onSave() {
  await run(() => store.saveLayout()).catch(() => {});
  toast.success("Layout saved");
}

function onSyncToGame() {
  if (store.syncToGame()) toast.success("Blueprint synced to game");
}
</script>

<template>
  <div class="editor__toolbar">
    <button class="btn__ghost btn__icon" @click="showSettings = true" title="Canvas Settings & Shortcuts" aria-label="Canvas settings">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path
          d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
        />
      </svg>
    </button>

    <button :class="{ btn__warning: store.state.mode === 'wall' }" @click="store.setMode('wall')" aria-label="Switch to wall mode">Wall</button>
    <button :class="{ btn__warning: store.state.mode === 'object' }" @click="store.setMode('object')" aria-label="Switch to object mode">Object</button>
    <button :class="{ btn__warning: store.state.mode === 'move' }" @click="store.setMode('move')" aria-label="Switch to move mode">Move</button>
    <button :class="{ btn__warning: store.state.mode === 'erase' }" @click="store.setMode('erase')" title="Erase wall tiles (click room edges to trim)" aria-label="Switch to erase mode">Erase</button>

    <button @click="onNpcSettings" title="Configure NPC roles, tasks, and behavior" aria-label="Open NPC behavior settings">NPC Behavior</button>
    <button @click="showFloorModal = true" title="Manage floors: add, delete, reorder, role restrictions" aria-label="Open floor manager">Floor Manager</button>
    <button :class="{ btn__warning: store.state.mode === 'npc-preview' }" @click="onDeployNpc" title="Deploy NPCs on current floor (configure roles first)">Deploy NPCs</button>

    <template v-if="store.state.mode === 'npc-preview'">
      <div class="card card__primary card__compact" :title="`NPCs on ${currentFloorLabel}`">{{ currentFloorLabel }}: {{ total }}</div>
      <div class="layout__wrap">
        <div v-for="[type, count] in countsByRole" :key="type" class="editor__toolbar__npchstack">
          <span class="editor__toolbar__rolebold">{{ type }}</span>
          <span class="card card__primary card__compact">{{ count }}</span>
        </div>
      </div>
      <div class="actions">
        <button @click="onTogglePause" :aria-label="isPaused ? 'Resume NPC simulation' : 'Pause NPC simulation'">{{ isPaused ? "▶ Resume" : "❚❚ Pause" }}</button>
        <label class="editor__toolbar__speed">
          <select :value="simSpeed" @change="simSpeed = +($event.target as HTMLSelectElement).value" aria-label="Simulation speed">
            <option :value="1">1x</option>
            <option :value="2">2x</option>
            <option :value="4">4x</option>
            <option :value="8">8x</option>
          </select>
        </label>
        <button class="btn__danger" @click="onReset" aria-label="Clear all NPCs and exit preview">Clear</button>
      </div>
    </template>

    <button class="btn__primary" :disabled="pending" @click="onSave" title="Save layout to assets-store.ts" aria-label="Save layout">Save</button>
    <button class="btn__success" @click="onSyncToGame" title="Apply blueprint layout to the main game" aria-label="Sync blueprint to game">Sync Game</button>

    <button class="editor__toolbar__backbtn" @click="onBack" aria-label="Back to start screen">◀ Back</button>

    <NpcBehaviorModal :open="showNpcSettings" @close="showNpcSettings = false" />
    <FloorModal :open="showFloorModal" @close="showFloorModal = false" />

    <Teleport to="body">
      <div v-if="showSettings" class="modal__overlay editorsettings__overlay" @click.self="showSettings = false">
        <div class="editorsettings__panel">
          <div class="editorsettings__header">
            <span>Canvas Settings</span>
            <button class="btn__ghost btn__icon" @click="showSettings = false" aria-label="Close">✕</button>
          </div>
          <div class="editorsettings__body">
            <div class="editorsettings__section">
              <div class="editorsettings__title">Canvas Size</div>
              <div class="editorsettings__row">
                <label for="canvas__width">Width</label>
                <input id="canvas__width" class="input" type="number" v-model.number="widthInput" min="100" step="25" />
              </div>
              <div class="editorsettings__row">
                <label for="canvas__height">Height</label>
                <input id="canvas__height" class="input" type="number" v-model.number="heightInput" min="100" step="25" />
              </div>
              <div class="editorsettings__row">
                <label for="canvas__tile">Tile Size</label>
                <input id="canvas__tile" class="input" type="number" v-model.number="tileInput" min="5" step="5" />
              </div>
              <button class="btn__primary" :disabled="pending" @click="applyCanvasSize" aria-label="Apply canvas size">Apply</button>
              <div class="editorsettings__hint">Changing canvas size will re-snap all rooms/objects to the new grid.</div>
            </div>
            <div class="editorsettings__section">
              <div class="editorsettings__title">Keyboard Shortcuts</div>
              <div class="editorsettings__shortcuts">
                <div class="editorsettings__shortcutrow"><kbd>Delete</kbd><span>Delete selected</span></div>
                <div class="editorsettings__shortcutrow"><kbd>R</kbd><span>Rotate object</span></div>
                <div class="editorsettings__shortcutrow"><kbd>L</kbd><span>Lock/unlock object</span></div>
                <div class="editorsettings__shortcutrow"><kbd>Ctrl+C</kbd><span>Copy selected</span></div>
                <div class="editorsettings__shortcutrow"><kbd>Ctrl+V</kbd><span>Paste objects</span></div>
                <div class="editorsettings__shortcutrow"><kbd>Ctrl+L</kbd><span>Link selected objects</span></div>
                <div class="editorsettings__shortcutrow"><kbd>Shift+Click</kbd><span>Add to selection</span></div>
                <div class="editorsettings__shortcutrow"><kbd>Arrow Keys</kbd><span>Move selected by 1 tile</span></div>
                <div class="editorsettings__shortcutrow"><kbd>Space+Drag</kbd><span>Pan canvas</span></div>
                <div class="editorsettings__shortcutrow"><kbd>Ctrl+0</kbd><span>Fit to screen</span></div>
                <div class="editorsettings__shortcutrow"><kbd>+/-</kbd><span>Zoom in/out</span></div>
                <div class="editorsettings__shortcutrow"><kbd>Esc</kbd><span>Deselect / cancel drag</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.layout__wrap {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  flex-wrap: wrap;
}

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
  min-height: 48px;
}

.editor__toolbar__backbtn {
  margin-left: auto;
  padding: var(--gap-xs) var(--gap-sm);
  background: var(--bg-card);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: var(--font-sm);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.editor__toolbar__backbtn:hover {
  border-color: var(--accent-gold);
  color: var(--accent-gold);
}

.editor__toolbar__npchstack {
  display: inline-flex;
  align-items: center;
  gap: var(--gap-xs);
  padding: var(--gap-xs) var(--gap-sm);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  font-size: var(--font-xs);
}

.editor__toolbar__rolebold {
  font-weight: 500;
}

.editor__toolbar__speed {
  display: inline-flex;
  align-items: center;
}

.editor__toolbar__speed select {
  font-size: var(--font-xs);
  background: var(--bg-primary);
  cursor: pointer;
}

.editorsettings__overlay {
  z-index: 1001;
}

.editorsettings__panel {
  width: min(380px, calc(100vw - 32px));
  background: var(--bg-secondary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: 0 8px 32px color-mix(in srgb, var(--bg-primary) 50%, transparent);
}

.editorsettings__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--gap-sm) var(--gap-md);
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-dim);
  font-weight: 600;
  font-size: var(--font-md);
}

.editorsettings__body {
  padding: var(--gap-md);
  display: flex;
  flex-direction: column;
  gap: var(--gap-md);
  max-height: 70vh;
  overflow-y: auto;
}

.editorsettings__section {
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
}

.editorsettings__title {
  font-size: var(--font-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-primary);
  opacity: 0.7;
}

.editorsettings__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--gap-sm);
  font-size: var(--font-sm);
}

.editorsettings__row label {
  min-width: 70px;
  color: var(--text-primary);
}

.editorsettings__row input {
  flex: 1;
  min-width: 0;
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  color: var(--text-primary);
  padding: var(--gap-xs) var(--gap-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-sm);
}

.editorsettings__row input:focus {
  outline: none;
  border-color: var(--accent-gold);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-gold) 15%, transparent);
}

.editorsettings__hint {
  font-size: var(--font-xs);
  color: var(--text-dim);
  line-height: 1.4;
}

.editorsettings__shortcuts {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
}

.editorsettings__shortcutrow {
  display: flex;
  align-items: center;
  gap: var(--gap-md);
  font-size: var(--font-sm);
}

.editorsettings__shortcutrow kbd {
  display: inline-block;
  min-width: 100px;
  padding: 2px var(--gap-sm);
  background: var(--bg-card);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: var(--font-xs);
  color: var(--accent-gold);
  text-align: center;
}

.editorsettings__shortcutrow span {
  color: var(--text-secondary);
}
</style>
