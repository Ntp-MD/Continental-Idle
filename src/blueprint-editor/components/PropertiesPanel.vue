<script setup lang="ts">
import { ref, computed } from "vue";
import { useAssetsStore } from "../blueprintStore";
import { useToast } from "@/composables/useToast";
import RoomPropertiesForm from "./roomPropertiesForm.vue";
import ObjectPropertiesForm from "./objectPropertiesForm.vue";
import AssetPropertiesForm from "./assetPropertiesForm.vue";
import TagPicker from "./tagPicker.vue";
import TagManagerModal from "./tagManagerModal.vue";
import { isHexColor } from "../store/state";

const store = useAssetsStore();

const room = computed(() => store.selectedRoom());
const object = computed(() => store.selectedObject());
const asset = computed(() => store.selectedAsset.value);

const linkedName = ref("");
const flattenName = ref("");

async function doLink() {
  const items = store.state.selectionState.items;
  const roomItem = items.find((i) => i.type === "room");
  const objIds = items.filter((i) => i.type === "object").map((i) => i.id);
  if (roomItem) {
    await store.linkObjectsToRoom(objIds, roomItem.id);
    return;
  }
  if (objIds.length < 2) return;
  await store.linkObjects([...objIds]);
}

async function doLinkAllInRoom() {
  const roomItem = store.state.selectionState.items.find((i) => i.type === "room");
  if (!roomItem) return;
  await store.linkAllObjectsInRoom(roomItem.id);
}

async function doCreateLinked() {
  const ids = store.state.selectionState.items.filter((i) => i.type === "object").map((i) => i.id);
  if (ids.length < 2) return;
  const id = await store.createLinkedAssetFromSelection(linkedName.value || undefined);
  if (id) linkedName.value = "";
}

async function doFlatten() {
  const ids = store.state.selectionState.items.filter((i) => i.type === "object").map((i) => i.id);
  if (ids.length < 2) return;
  const id = await store.flattenToSvgAsset(flattenName.value || undefined);
  if (id) flattenName.value = "";
}

const showTagManager = ref(false);
</script>

<template>
  <div class="properties">
    <div class="properties__header">
      <span>Properties</span>
      <span class="properties__floor">{{ store.currentFloor.value?.label ?? "—" }} · {{ store.currentFloor.value?.name ?? "" }}</span>
    </div>
    <div v-if="!room && !object && !asset && store.state.selectionState.items.length === 0" class="properties__content">
      <div class="properties__section">
        <div class="properties__title">Properties</div>
        <div class="properties__empty">Select a room, object, or asset to edit properties.</div>
        <div class="properties__hint">Click an asset in the palette to edit its definition. Click an object on the canvas to edit instance properties.</div>
        <button class="btn__sm" @click="showTagManager = true">Manage Tags</button>
      </div>
    </div>

    <!-- Multi-selection -->
    <div v-if="store.state.selectionState.items.length >= 2" class="properties__content">
      <div class="properties__section">
        <div class="properties__title">
          {{ store.state.selectionState.items.some((i) => i.type === "room") ? `${store.state.selectionState.items.filter((i) => i.type === "object").length} object(s) + room` : `${store.state.selectionState.items.length} objects selected` }}
        </div>
        <div class="properties__row">
          <label>Tip</label>
          <span class="properties__value">Shift+click to add/remove</span>
        </div>
        <div class="properties__btngroup">
          <button v-if="store.state.selectionState.items.some((i) => i.type === 'room')" @click="doLink">Link to Room</button>
          <button v-if="store.state.selectionState.items.some((i) => i.type === 'room')" @click="doLinkAllInRoom">Link All in Room</button>
          <button v-else @click="doLink">Link Objects</button>
        </div>
      </div>
      <div class="properties__section">
        <div class="properties__title">Save as Linked Set</div>
        <div class="properties__row">
          <label>Name</label>
          <input class="input" type="text" v-model="linkedName" placeholder="e.g. Table + Chairs" />
        </div>
        <button @click="doCreateLinked">Save as Linked Asset</button>
      </div>
      <div class="properties__section">
        <div class="properties__title">Flatten to Single Asset</div>
        <div class="properties__row">
          <label>Name</label>
          <input class="input" type="text" v-model="flattenName" placeholder="e.g. Table + Chairs" />
        </div>
        <button class="btn__success" @click="doFlatten">Flatten to SVG Asset</button>
      </div>
    </div>

    <!-- Asset editor -->
    <AssetPropertiesForm v-if="asset" :asset="asset" />

    <!-- Room editor -->
    <RoomPropertiesForm v-else-if="room" :room="room" />

    <!-- Object editor -->
    <ObjectPropertiesForm v-else-if="object" :object="object" />

    <TagManagerModal :open="showTagManager" @close="showTagManager = false" />
  </div>
</template>

<style scoped>
.properties {
  width: 100%;
  max-width: 350px;
  min-width: 0;
  background: var(--bg-secondary);
  border-left: 1px solid var(--border-dim);
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: -4px 0 24px color-mix(in srgb, var(--bg-primary) 20%, transparent);
}

.properties__header {
  padding: var(--gap-md);
  font-weight: 700;
  font-size: var(--font-md);
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--border-dim);
  background: var(--bg-card);
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: var(--gap-sm);
  flex-shrink: 0;
}

.properties__floor {
  font-size: var(--font-xs);
  font-weight: 400;
  letter-spacing: 0;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.properties__empty {
  padding: var(--gap-md);
  font-size: var(--font-md);
  color: var(--text-primary);
  text-align: center;
  line-height: 1.5;
  flex-shrink: 0;
}

.properties__hint {
  font-size: var(--font-sm);
  color: var(--text-primary);
  line-height: 1.6;
  padding: 0 0 var(--gap-md);
  border-bottom: 1px solid var(--border-dim);
  text-align: center;
}

.properties__idrow {
  display: flex;
  gap: var(--gap-sm);
}

.properties__cats {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
  padding: var(--gap-sm);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
}

.properties__catrow {
  display: flex;
  gap: var(--gap-xs);
  align-items: center;
}

.properties__catadd {
  display: flex;
  gap: var(--gap-xs);
  align-items: center;
  padding-top: var(--gap-xs);
  border-top: 1px solid var(--border-dim);
}
</style>
