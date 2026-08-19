<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useAssetsStore } from "../blueprintStore";
import { useToast } from "@/composables/useToast";
import { useConfirm } from "@/composables/useConfirm";
import { sanitizeString } from "../../utils/sanitize";
import { genId } from "../store/utils";
import type { FloorData, NpcSpawnZone } from "../types";
import ModalShell from "./ModalShell.vue";
import FloorWalkablePanel from "./FloorWalkablePanel.vue";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: "close"): void }>();

const store = useAssetsStore();
const toast = useToast();
const confirm = useConfirm().confirm;

const selectedFloorId = ref<string | null>(null);
const editingName = ref(false);
const editingNameRaw = ref("");
const editingLabel = ref(false);
const editingLabelRaw = ref("");
const floorDragIndex = ref<number | null>(null);
const showWalkable = ref(false);
const spawnZoneDraft = ref({ label: "Road", x: 0, y: 0, w: 400, h: 200, roleIds: [] as string[] });

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
  const saved = await store.renameFloor(selectedFloor.value.id, name);
  if (!saved) return toast.error("Failed to rename floor");
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
  const saved = await store.updateFloor(selectedFloor.value.id, { label });
  if (!saved) return toast.error("Failed to save floor label");
  editingLabel.value = false;
}

async function onAdd() {
  const floor = await store.addFloor();
  if (floor) toast.success("Floor added");
  else toast.error("Failed to add floor");
}

async function onDuplicate(id: string) {
  const duplicated = await store.duplicateFloor(id);
  if (duplicated) toast.success("Floor duplicated");
  else toast.error("Failed to duplicate floor");
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
  const deleted = await store.deleteFloor(id);
  if (!deleted) {
    toast.error("Failed to delete floor");
    return;
  }
  if (selectedFloorId.value === id) selectedFloorId.value = floors.value[0]?.id ?? null;
  toast.success("Floor deleted");
}

function onDragStart(index: number) {
  floorDragIndex.value = index;
}
async function onDrop(index: number) {
  if (floorDragIndex.value === null) return;
  const saved = await store.reorderFloors(floorDragIndex.value, index);
  floorDragIndex.value = null;
  if (saved) toast.info("Floors reordered");
  else toast.error("Failed to reorder floors");
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

function toggleSpawnZoneRole(roleId: string): void {
  const roleIds = new Set(spawnZoneDraft.value.roleIds);
  if (roleIds.has(roleId)) roleIds.delete(roleId);
  else roleIds.add(roleId);
  spawnZoneDraft.value.roleIds = [...roleIds];
}

async function addSpawnZone(): Promise<void> {
  if (!selectedFloor.value) return;
  const draft = spawnZoneDraft.value;
  const zone: NpcSpawnZone = {
    id: genId("spawn-zone"),
    label: sanitizeString(draft.label) || "Spawn Zone",
    x: Math.max(0, Number(draft.x) || 0),
    y: Math.max(0, Number(draft.y) || 0),
    w: Math.max(1, Number(draft.w) || 1),
    h: Math.max(1, Number(draft.h) || 1),
    ...(draft.roleIds.length ? { roleIds: [...draft.roleIds] } : {}),
  };
  const saved = await store.updateFloor(selectedFloor.value.id, { spawnZones: [...(selectedFloor.value.spawnZones ?? []), zone] });
  if (saved) {
    spawnZoneDraft.value = { label: "Road", x: 0, y: 0, w: 400, h: 200, roleIds: [] };
    toast.success("Spawn zone added");
  }
}

async function deleteSpawnZone(zoneId: string): Promise<void> {
  if (!selectedFloor.value) return;
  const zones = (selectedFloor.value.spawnZones ?? []).filter((zone) => zone.id !== zoneId);
  await store.updateFloor(selectedFloor.value.id, { spawnZones: zones });
}

function floorCounts(f: FloorData): string {
  return `${f.objects.length} objects · ${f.spawnZones?.length ?? 0} spawn zones`;
}
</script>

<template>
  <ModalShell :open="open" title="Floor Manager" max-width="800px" width="60vw" height="auto" max-height="calc(100vh - 32px)" @close="onClose">
    <div class="floor__body">
      <!-- Left pane: Floor list -->
      <div class="floor__pane">
        <div class="floor__heading">
          <span>Floors ({{ floors.length }})</span>
          <button class="btn--dashed" @click="onAdd">+ Add</button>
        </div>
        <div class="floor__scroll">
          <div
            v-for="(f, index) in floors"
            :key="f.id"
            class="card--item floor__row"
            :class="{
              'floor__row--active': f.id === selectedFloorId,
              'floor__row--current': f.id === store.state.currentFloorId,
            }"
            draggable="true"
            @dragstart="onDragStart(index)"
            @dragover.prevent
            @drop="onDrop(index)"
            @click="selectFloor(f.id)"
          >
            <span class="floor__label" :style="{ color: f.labelColor || undefined }">{{ f.label }}</span>
            <span class="floor__name">{{ f.name }}</span>
            <span class="floor__count">{{ floorCounts(f) }}</span>
            <span v-if="f.id === store.state.currentFloorId" class="badge badge__blue">ACTIVE</span>
          </div>
        </div>
      </div>

      <!-- Right pane: Detail editor -->
      <div class="floor__pane">
        <div v-if="selectedFloor" class="floor__detail">
          <div class="floor__heading">
            <span>Floor Details</span>
            <button type="button" class="btn--warning" @click="showWalkable = true">Edit Walkable</button>
          </div>

          <div class="floor__field">
            <label>Label</label>
            <input v-if="editingLabel" v-model="editingLabelRaw" class="input" aria-label="Edit floor label" @keydown.enter="commitLabel" @blur="commitLabel" />
            <span v-else class="floor__value" @dblclick="startEditLabel">{{ selectedFloor.label }}</span>
          </div>

          <div class="floor__field">
            <label>Name</label>
            <input v-if="editingName" :value="editingNameRaw" @input="editingNameRaw = sanitizeString(($event.target as HTMLInputElement).value)" class="input" aria-label="Edit floor name" @keydown.enter="commitName" @blur="commitName" />
            <span v-else class="floor__value" @dblclick="startEditName">{{ selectedFloor.name }}</span>
          </div>

          <div class="floor__field">
            <label>Default Walkable</label>
            <label class="floor__check">
              <input type="checkbox" :checked="selectedFloor.defaultWalkable ?? true" @change="toggleWalkable" />
              <span>Empty areas are walkable</span>
            </label>
          </div>

          <div class="floor__field">
            <label>Spawn Zones</label>
            <div class="floor__zones">
              <div v-for="zone in selectedFloor.spawnZones ?? []" :key="zone.id" class="floor__zone">
                <span class="floor__value">{{ zone.label }} ({{ zone.x }}, {{ zone.y }}, {{ zone.w }}×{{ zone.h }})</span>
                <button class="btn--danger btn--icon" type="button" @click="deleteSpawnZone(zone.id)" aria-label="Delete spawn zone">×</button>
              </div>
              <span v-if="!selectedFloor.spawnZones?.length" class="floor__dim">No zones — all walkable cells can spawn NPCs</span>
              <div class="floor__form">
                <input v-model="spawnZoneDraft.label" class="input" type="text" placeholder="Zone label" aria-label="Spawn zone label" />
                <input v-model.number="spawnZoneDraft.x" class="input" type="number" min="0" placeholder="X" aria-label="Spawn zone X" />
                <input v-model.number="spawnZoneDraft.y" class="input" type="number" min="0" placeholder="Y" aria-label="Spawn zone Y" />
                <input v-model.number="spawnZoneDraft.w" class="input" type="number" min="1" placeholder="Width" aria-label="Spawn zone width" />
                <input v-model.number="spawnZoneDraft.h" class="input" type="number" min="1" placeholder="Height" aria-label="Spawn zone height" />
                <button type="button" class="btn--primary" @click="addSpawnZone">Add</button>
              </div>
              <div v-if="availableRoles.length" class="floor__spawnroles">
                <label v-for="role in availableRoles" :key="`spawn-role-${role.id}`" class="chip" :class="{ 'chip--active': spawnZoneDraft.roleIds.includes(role.id) }">
                  <input type="checkbox" :checked="spawnZoneDraft.roleIds.includes(role.id)" @change="toggleSpawnZoneRole(role.id)" />
                  <span class="swatch" :style="{ background: role.color }" />
                  <span>{{ role.label }}</span>
                </label>
                <span class="floor__dim">No selected roles = all roles</span>
              </div>
            </div>
          </div>

          <div class="floor__field">
            <label>Stats</label>
            <span class="floor__value">{{ floorCounts(selectedFloor) }}</span>
          </div>

          <div class="floor__heading">Allowed Roles</div>
          <div class="floor__roles">
            <div class="floor__head">
              <span v-if="!selectedFloor.allowedRoleIds?.length" class="floor__dim">All roles allowed</span>
              <button v-else class="btn--ghost" @click="clearRoles">Clear (allow all)</button>
            </div>
            <div class="floor__tags">
              <label v-for="role in availableRoles" :key="role.id" class="chip" :class="{ 'chip--active': isRoleAllowed(role.id) }">
                <input type="checkbox" :checked="isRoleAllowed(role.id)" @change="toggleRole(role.id)" />
                <span class="swatch" :style="{ background: role.color }" />
                <span>{{ role.label }}</span>
              </label>
              <span v-if="!availableRoles.length" class="floor__dim">No roles configured — open Role Manager to add roles</span>
            </div>
          </div>

          <div class="floor__actions">
            <button class="btn--ghost" @click="onDuplicate(selectedFloor.id)">⧉ Duplicate</button>
            <button class="btn--danger" :disabled="floors.length <= 1" @click="onDelete(selectedFloor.id)">✕ Delete</button>
          </div>
        </div>
        <div v-else class="floor--empty">Select a floor to edit</div>
      </div>
    </div>
  </ModalShell>
  <FloorWalkablePanel :open="showWalkable" :floor="selectedFloor" @close="showWalkable = false" />
</template>

<style scoped>
.floor__body {
  padding: var(--gap-md);
  display: grid;
  grid-template-columns: minmax(170px, 0.75fr) minmax(0, 1.25fr);
  gap: var(--gap-md);
  overflow: visible;
}

.floor__pane {
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
  min-width: 0;
  overflow: visible;
}

.floor__heading {
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

.floor__scroll {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
  flex: 1;
  overflow-y: auto;
}

.floor__row {
  cursor: pointer;
}
.floor__row:hover {
  background: var(--bg-card);
}
.floor__row--active {
  border-color: var(--accent-blue);
  background: var(--bg-card);
}

.floor__row--current {
  border-left: 3px solid var(--accent-blue);
}

.floor__label {
  font-weight: 700;
  font-size: var(--font-xs);
  min-width: fit-content;
}

.floor__name {
  flex: 1;
  font-size: var(--font-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.floor__count {
  font-size: var(--font-xs);
  color: var(--text-dim);
  white-space: nowrap;
}

.floor__detail {
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
  overflow: visible;
}

.floor__field {
  display: flex;
  align-items: flex-start;
  gap: var(--gap-sm);
  min-width: 0;
}

.floor__field > label {
  font-size: var(--font-xs);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
  min-width: fit-content;
  flex-shrink: 0;
}

.floor__value {
  font-size: var(--font-sm);
  cursor: pointer;
}

.floor__check {
  display: inline-flex;
  align-items: center;
  gap: var(--gap-xs);
  cursor: pointer;
}

.floor__zones {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: var(--gap-xs);
}

.floor__zone {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  padding: var(--gap-xs);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
}

.floor__zone .floor__value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.floor__form {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) repeat(4, minmax(0, 0.7fr)) auto;
  gap: var(--gap-xs);
  min-width: 0;
}

.floor__form .input {
  min-width: 0;
  width: 100%;
}

.floor__spawnroles {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--gap-xs);
}

.floor__roles {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
}

.floor__head {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
}

.floor__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-xs);
}

.floor__actions {
  display: flex;
  gap: var(--gap-sm);
  padding-top: var(--gap-md);
  border-top: 1px solid var(--border-dim);
}

.floor__dim {
  font-size: var(--font-xs);
  color: var(--text-dim);
}

.floor--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-dim);
  font-size: var(--font-sm);
}

@media (max-width: 720px) {
  .floor__body {
    grid-template-columns: 1fr;
  }

  .floor__form {
    grid-template-columns: 1fr 1fr;
  }

  .floor__form .input:first-child,
  .floor__form button {
    grid-column: 1 / -1;
  }
}
</style>
