<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAssetsStore } from '../../blueprintStore'
import { useConfirm } from '@/composables/useConfirm'
import ObjectPropertiesForm from './ObjectPropertiesForm.vue'
import AssetProperties from './AssetProperties.vue'

const store = useAssetsStore()
const confirm = useConfirm().confirm

const object = computed(() => store.selectedObject())
const asset = computed(() => store.selectedAsset.value)
const wallCount = computed(
  () => store.wallSelection.value.filter((w) => w.floorId === store.currentFloor.value?.id).length,
)
const selectedItems = computed(() => {
  const floor = store.currentFloor.value
  if (!floor) return []
  return store.state.selectionState.items
    .filter((i) => i.type === 'object')
    .map((i) => floor.objects.find((o) => o.id === i.id))
    .filter((o): o is NonNullable<typeof o> => !!o)
})
const hasLinkedGroup = computed(() => selectedItems.value.some((o) => o.linkGroupId))

const flattenName = ref('')

async function doLink() {
  const objIds = store.state.selectionState.items.filter((i) => i.type === 'object').map((i) => i.id)
  if (objIds.length < 2) return
  await store.linkObjects([...objIds])
}

async function doUnlink() {
  const linked = selectedItems.value.find((o) => o.linkGroupId)
  if (!linked) return
  const confirmed = await confirm({
    title: 'Unlink objects',
    message: 'Break the link group? The objects will move independently afterwards.',
    confirmLabel: 'Unlink',
    cancelLabel: 'Cancel',
  })
  if (!confirmed) return
  await store.unlinkObject(linked.id)
}

async function doFlatten() {
  const ids = store.state.selectionState.items.filter((i) => i.type === 'object').map((i) => i.id)
  const walls = store.wallSelection.value.filter((w) => w.floorId === store.currentFloor.value?.id)
  if (ids.length + walls.length < 2) return
  const confirmed = await confirm({
    title: 'Flatten selection',
    message: 'Merge the selected objects and walls into a single SVG asset? This cannot be undone.',
    confirmLabel: 'Flatten',
    cancelLabel: 'Cancel',
    danger: true,
  })
  if (!confirmed) return
  const id = await store.flattenToSvgAsset(flattenName.value || undefined, walls)
  if (id) {
    flattenName.value = ''
    store.clearWallSelection()
  }
}
</script>

<template>
  <div class="sidebar__panel">
    <div class="form__header">
      <span>Properties</span>
      <span>{{ store.currentFloor.value?.label ?? '-' }} - {{ store.currentFloor.value?.name ?? '' }}</span>
    </div>
    <div class="form__col">
      <div v-if="!object && !asset && store.state.selectionState.items.length === 0">
        <div class="form__col">
          <div class="empty">Select an object or asset to edit properties.</div>
          <div>
            Click an asset in the palette to edit its definition. Click an object on the canvas to edit instance
            properties.
          </div>
        </div>
      </div>

      <!-- Multi-selection -->
      <div v-if="store.state.selectionState.items.length >= 2 || wallCount > 0">
        <div class="form__col">
          <h3>
            {{ selectedItems.length }} object{{ selectedItems.length === 1 ? '' : 's' }} selected<template
              v-if="wallCount"
            >
              + {{ wallCount }} wall{{ wallCount === 1 ? '' : 's' }}</template
            >
          </h3>
          <div class="form__row">
            <ul class="multi-select__list">
              <li v-for="obj in selectedItems" :key="obj.id" class="multi-select__item">
                <span class="truncate">{{ obj.id }}</span>
                <span class="multi-select__pos">x:{{ obj.x }} y:{{ obj.y }}</span>
              </li>
            </ul>
          </div>
          <div class="form__row">
            <button @click="doLink">Link Objects</button>
            <button v-if="hasLinkedGroup" @click="doUnlink">Unlink</button>
          </div>
        </div>
        <div class="form__col">
          <h3>Flatten to Single Asset</h3>
          <div class="form__row">
            <label>Name</label>
            <input v-model="flattenName" type="text" placeholder="e.g. Table + Chairs" />
          </div>
          <div v-if="wallCount" class="form__row">
            <span
              >{{ wallCount }} selected wall{{ wallCount === 1 ? '' : 's' }} will be merged into the asset and removed
              from the floor grid</span
            >
          </div>
          <button class="flag--success size--fill" @click="doFlatten">Flatten to SVG Asset</button>
        </div>
      </div>

      <!-- Asset editor -->
      <AssetProperties v-if="asset" :key="asset.id" :asset="asset" />

      <!-- Object editor (single selection only) -->
      <ObjectPropertiesForm
        v-else-if="object && store.state.selectionState.items.length === 1 && wallCount === 0"
        :object="object"
      />
    </div>
  </div>
</template>

<style scoped>
.multi-select__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
  max-height: 200px;
  overflow-y: auto;
}

.multi-select__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--gap-sm);
  padding: var(--gap-xs) var(--gap-sm);
  border: 1px solid var(--border-dim);
}

.multi-select__pos {
  color: var(--text-secondary);
  flex-shrink: 0;
}
</style>
