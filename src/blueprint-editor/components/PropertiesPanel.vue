<script setup lang="ts">
import { ref, computed } from "vue";
import { useAssetsStore } from "../blueprintStore";
import ObjectPropertiesForm from "./ObjectPropertiesForm.vue";
import AssetProperties from "./AssetProperties.vue";

const store = useAssetsStore();

const object = computed(() => store.selectedObject());
const asset = computed(() => store.selectedAsset.value);
const wallCount = computed(
  () => store.wallSelection.value.filter((w) => w.floorId === store.currentFloor.value?.id).length,
);

const linkedName = ref("");
const flattenName = ref("");

async function doLink() {
  const objIds = store.state.selectionState.items.filter((i) => i.type === "object").map((i) => i.id);
  if (objIds.length < 2) return;
  await store.linkObjects([...objIds]);
}

async function doCreateLinked() {
  const ids = store.state.selectionState.items.filter((i) => i.type === "object").map((i) => i.id);
  if (ids.length < 2) return;
  const id = await store.createLinkedAssetFromSelection(linkedName.value || undefined);
  if (id) linkedName.value = "";
}

async function doFlatten() {
  const ids = store.state.selectionState.items.filter((i) => i.type === "object").map((i) => i.id);
  const walls = store.wallSelection.value.filter((w) => w.floorId === store.currentFloor.value?.id).map((w) => w.segment);
  if (ids.length + walls.length < 2) return;
  const id = await store.flattenToSvgAsset(flattenName.value || undefined, walls);
  if (id) {
    flattenName.value = "";
    store.clearWallSelection();
  }
}
</script>

<template>
  <div class="form__panel">
    <div class="form__header">
      <span>Properties</span>
      <span>{{ store.currentFloor.value?.label ?? "-" }} - {{ store.currentFloor.value?.name ?? "" }}</span>
    </div>
    <div class="form__group">
      <div v-if="!object && !asset && store.state.selectionState.items.length === 0">
        <div class="form__group">
          <div class="empty">Select an object or asset to edit properties.</div>
          <div>Click an asset in the palette to edit its definition. Click an object on the canvas to edit instance properties.</div>
        </div>
      </div>

      <!-- Multi-selection -->
      <div v-if="store.state.selectionState.items.length >= 2 || wallCount > 0">
        <div class="form__group">
          <h3>
            {{ store.state.selectionState.items.length }} object{{ store.state.selectionState.items.length === 1 ? "" : "s" }} selected<template v-if="wallCount"> + {{ wallCount }} wall{{ wallCount === 1 ? "" : "s" }}</template>
          </h3>
          <div class="form__row">
            <label>Tip</label>
            <span>Shift+click to add/remove - box-select picks up walls too</span>
          </div>
          <div class="form__row">
            <button @click="doLink">Link Objects</button>
          </div>
        </div>
        <div class="form__group">
          <h3>Save as Linked Set</h3>
          <div class="form__row">
            <label>Name</label>
            <input type="text" v-model="linkedName" placeholder="e.g. Table + Chairs" />
          </div>
          <button @click="doCreateLinked">Save as Linked Asset</button>
        </div>
        <div class="form__group">
          <h3>Flatten to Single Asset</h3>
          <div class="form__row">
            <label>Name</label>
            <input type="text" v-model="flattenName" placeholder="e.g. Table + Chairs" />
          </div>
          <div v-if="wallCount" class="form__row">
            <span>{{ wallCount }} selected wall{{ wallCount === 1 ? "" : "s" }} will be merged into the asset and removed from the floor grid</span>
          </div>
          <button class="flag--success" @click="doFlatten">Flatten to SVG Asset</button>
        </div>
      </div>

      <!-- Asset editor -->
      <AssetProperties v-if="asset" :key="asset.id" :asset="asset" />

      <!-- Object editor -->
      <ObjectPropertiesForm v-else-if="object" :object="object" />
    </div>
  </div>
</template>
