<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useAssetsStore } from "../blueprintStore";
import { useToast } from "@/composables/useToast";
import { useConfirm } from "@/composables/useConfirm";
import { useFocusTrap } from "../../composables/useFocusTrap";
import { sanitizeString } from "../../utils/sanitize";
import type { FloorData } from "../types";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: "close"): void }>();

const store = useAssetsStore();
const toast = useToast();
const confirm = useConfirm().confirm;

const containerRef = ref<HTMLElement>();
const isOpen = computed(() => props.open);
useFocusTrap(isOpen, containerRef);

const selectedFloorId = ref<string | null>(null);
const editingName = ref(false);
const editingNameRaw = ref("");
const editingLabel = ref(false);
const editingLabelRaw = ref("");
const floorDragIndex = ref<number | null>(null);

const floors = computed(() => store.state.layout.floors);
const availableRoles = computed(() => store.state.layout.npcConfig?.roles ?? []);

const selectedFloor = computed<FloorData | undefined>(() => floors.value.find((f) => f.id === selectedFloorId.value) ?? floors.value[0]);

watch(
  () => props.open,
  (open) => {
    if (open) {
      selectedFloorId.value = store.state.currentFloorId ?? floors.value[0]?.id ?? null;
      editingName.value = false;
      editingLabel.value = false;
    }
  },
);

function onClose() {
  emit("close");
}

function selectFloor(id: string) {
  selectedFloorId.value = id;
  editingName.value = false;
  editingLabel.value = false;
}

function startEditName() {
  if (!selectedFloor.value) return;
  editingName.value = true;
  editingNameRaw.value = selectedFloor.value.name;
}
async function commitName() {
  if (!selectedFloor.value) return;
  const name = editingNameRaw.value.trim() || "Unnamed";
  await store.renameFloor(selectedFloor.value.id, name);
  toast.info("Floor renamed");
  editingName.value = false;
}

function startEditLabel() {
  if (!selectedFloor.value) return;
  editingLabel.value = true;
  editingLabelRaw.value = selectedFloor.value.label;
}
async function commitLabel() {
  if (!selectedFloor.value) return;
  const label = editingLabelRaw.value.trim() || selectedFloor.value.label;
  await store.updateFloor(selectedFloor.value.id, { label });
  editingLabel.value = false;
}

async function onAdd() {
  await store.addFloor();
  toast.success("Floor added");
}

async function onDuplicate(id: string) {
  await store.duplicateFloor(id);
  toast.success("Floor duplicated");
}

async function onDelete(id: string) {
  if (floors.value.length <= 1) return;
  const ok = await confirm({
    title: "Delete floor",
    message: "Delete this floor? This cannot be undone via UI (only Ctrl+Z).",
    confirmLabel: "Delete",
    cancelLabel: "Cancel",
    danger: true,
  });
  if (!ok) return;
  await store.deleteFloor(id);
  if (selectedFloorId.value === id) selectedFloorId.value = floors.value[0]?.id ?? null;
  toast.info("Floor deleted");
}

function onDragStart(index: number) {
  floorDragIndex.value = index;
}
async function onDrop(index: number) {
  if (floorDragIndex.value === null) return;
  await store.reorderFloors(floorDragIndex.value, index);
  floorDragIndex.value = null;
  toast.info("Floors reordered");
}

async function toggleWalkable(e: Event) {
  if (!selectedFloor.value) return;
  const checked = (e.target as HTMLInputElement).checked;
  await store.updateFloor(selectedFloor.value.id, { defaultWalkable: checked });
}

function isRoleAllowed(roleId: string): boolean {
  if (!selectedFloor.value) return true;
  if (!selectedFloor.value.allowedRoleIds?.length) return true;
  return selectedFloor.value.allowedRoleIds.includes(roleId);
}
async function toggleRole(roleId: string) {
  if (!selectedFloor.value) return;
  const current = selectedFloor.value.allowedRoleIds ?? [];
  const next = current.includes(roleId) ? current.filter((id) => id !== roleId) : [...current, roleId];
  await store.updateFloor(selectedFloor.value.id, { allowedRoleIds: next });
}
async function clearRoles() {
  if (!selectedFloor.value) return;
  await store.updateFloor(selectedFloor.value.id, { allowedRoleIds: [] });
}

function floorCounts(f: FloorData) {
  return `${f.rooms.length} rooms · ${f.objects.length} objects`;
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal__overlay floormodal" @click.self="onClose">
      <div ref="containerRef" class="floormodal__dialog" role="dialog" aria-modal="true" aria-labelledby="floormodal__title">
        <div class="floormodal__header">
          <span id="floormodal__title" class="floormodal__title">Floor Manager</span>
          <button class="floormodal__close" @click="onClose" aria-label="Close">✕</button>
        </div>

        <div class="floormodal__body">
          <!-- Left pane: Floor list -->
          <div class="floormodal__pane">
            <div class="floormodal__heading">
              <span>Floors ({{ floors.length }})</span>
              <button class="btn__dashed btn__sm" @click="onAdd">+ Add</button>
            </div>
            <div class="floormodal__scroll">
              <div
                v-for="(f, index) in floors"
                :key="f.id"
                class="floormodal__row"
                :class="{
                  floormodal__rowactive: f.id === selectedFloorId,
                  floormodal__rowcurrent: f.id === store.state.currentFloorId,
                }"
                draggable="true"
                @dragstart="onDragStart(index)"
                @dragover.prevent
                @drop="onDrop(index)"
                @click="selectFloor(f.id)"
              >
                <span class="floormodal__rowlabel" :style="{ color: f.labelColor || undefined }">{{ f.label }}</span>
                <span class="floormodal__rowname">{{ f.name }}</span>
                <span class="floormodal__rowcount">{{ floorCounts(f) }}</span>
                <span v-if="f.id === store.state.currentFloorId" class="badge badge__blue">ACTIVE</span>
              </div>
            </div>
          </div>

          <!-- Right pane: Detail editor -->
          <div class="floormodal__pane">
            <div v-if="selectedFloor" class="floormodal__detail">
              <div class="floormodal__heading">Floor Details</div>

              <div class="floormodal__field">
                <label>Label</label>
                <input v-if="editingLabel" v-model="editingLabelRaw" class="input" aria-label="Edit floor label" @keydown.enter="commitLabel" @blur="commitLabel" />
                <span v-else class="floormodal__value" @dblclick="startEditLabel">{{ selectedFloor.label }}</span>
              </div>

              <div class="floormodal__field">
                <label>Name</label>
                <input v-if="editingName" :value="editingNameRaw" @input="editingNameRaw = sanitizeString(($event.target as HTMLInputElement).value)" class="input" aria-label="Edit floor name" @keydown.enter="commitName" @blur="commitName" />
                <span v-else class="floormodal__value" @dblclick="startEditName">{{ selectedFloor.name }}</span>
              </div>

              <div class="floormodal__field">
                <label>Default Walkable</label>
                <label class="floormodal__check">
                  <input type="checkbox" :checked="selectedFloor.defaultWalkable ?? true" @change="toggleWalkable" />
                  <span>Empty areas are walkable</span>
                </label>
              </div>

              <div class="floormodal__field">
                <label>Stats</label>
                <span class="floormodal__value">{{ floorCounts(selectedFloor) }}</span>
              </div>

              <div class="floormodal__heading">Allowed Roles</div>
              <div class="floormodal__roles">
                <div class="floormodal__roleheader">
                  <span v-if="!selectedFloor.allowedRoleIds?.length" class="floormodal__dim">All roles allowed</span>
                  <button v-else class="btn__ghost btn__sm" @click="clearRoles">Clear (allow all)</button>
                </div>
                <div class="floormodal__taglist">
                  <label v-for="role in availableRoles" :key="role.id" class="floormodal__rolechip" :class="{ 'floormodal__rolechip--active': isRoleAllowed(role.id) }">
                    <input type="checkbox" :checked="isRoleAllowed(role.id)" @change="toggleRole(role.id)" />
                    <span class="floormodal__roleswatch" :style="{ background: role.color }" />
                    <span>{{ role.label }}</span>
                  </label>
                  <span v-if="!availableRoles.length" class="floormodal__dim">No roles configured — open NPC Behavior to add roles</span>
                </div>
              </div>

              <div class="floormodal__actions">
                <button class="btn__ghost btn__sm" @click="onDuplicate(selectedFloor.id)">⧉ Duplicate</button>
                <button class="btn__danger btn__sm" :disabled="floors.length <= 1" @click="onDelete(selectedFloor.id)">✕ Delete</button>
              </div>
            </div>
            <div v-else class="floormodal__empty">Select a floor to edit</div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.floormodal {
  z-index: 1002;
  top: 60px;
  overflow: hidden;
  align-items: stretch;
}

.floormodal__dialog {
  max-width: 800px;
  height: 100vh;
  max-height: 90vh;
  width: 60vw;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-md);
  box-shadow: 0 12px 32px color-mix(in srgb, var(--bg-primary) 50%, transparent);
  color: var(--text-primary);
  overflow: hidden;
}

.floormodal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--gap-sm) var(--gap-md);
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-dim);
  flex-shrink: 0;
}

.floormodal__title {
  font-weight: 600;
  font-size: var(--font-md);
}

.floormodal__close {
  background: transparent;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  font-size: var(--font-md);
  line-height: 1;
}

.floormodal__body {
  flex: 1;
  min-height: 0;
  padding: var(--gap-md);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--gap-md);
  overflow: hidden;
}

.floormodal__pane {
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.floormodal__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  font-size: var(--font-sm);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.floormodal__scroll {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.floormodal__row {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  padding: var(--gap-xs) var(--gap-sm);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  cursor: pointer;
  text-align: left;
  flex-shrink: 0;
}

.floormodal__row:hover {
  background: var(--bg-card);
}

.floormodal__rowactive {
  border-color: var(--accent-blue);
  background: var(--bg-card);
}

.floormodal__rowcurrent {
  border-left: 3px solid var(--accent-blue);
}

.floormodal__rowlabel {
  font-weight: 700;
  font-size: var(--font-xs);
  min-width: 32px;
}

.floormodal__rowname {
  flex: 1;
  font-size: var(--font-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.floormodal__rowcount {
  font-size: var(--font-xs);
  color: var(--text-dim);
  white-space: nowrap;
}

.floormodal__detail {
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
  min-height: 0;
  overflow-y: auto;
}

.floormodal__field {
  display: flex;
  align-items: center;
  gap: var(--gap-sm);
}

.floormodal__field > label {
  font-size: var(--font-xs);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
  min-width: 120px;
  flex-shrink: 0;
}

.floormodal__value {
  font-size: var(--font-sm);
  cursor: pointer;
}

.floormodal__check {
  display: inline-flex;
  align-items: center;
  gap: var(--gap-xs);
  cursor: pointer;
}

.floormodal__roles {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
}

.floormodal__roleheader {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
}

.floormodal__taglist {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-xs);
}

.floormodal__rolechip {
  display: inline-flex;
  align-items: center;
  gap: var(--gap-xs);
  padding: var(--gap-xs) var(--gap-sm);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--font-xs);
}

.floormodal__rolechip--active {
  border-color: var(--accent-blue);
  background: color-mix(in srgb, var(--accent-blue) 10%, var(--bg-primary));
}

.floormodal__roleswatch {
  width: 12px;
  height: 12px;
  border-radius: var(--radius-xs);
  flex-shrink: 0;
}

.floormodal__actions {
  display: flex;
  gap: var(--gap-sm);
  padding-top: var(--gap-md);
  border-top: 1px solid var(--border-dim);
}

.floormodal__dim {
  font-size: var(--font-xs);
  color: var(--text-dim);
}

.floormodal__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-dim);
  font-size: var(--font-sm);
}
</style>
