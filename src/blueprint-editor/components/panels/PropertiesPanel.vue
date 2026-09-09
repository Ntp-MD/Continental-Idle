<script setup lang="ts">
import { ref, computed, inject, onUnmounted } from 'vue'
import { useAssetsStore } from '../../blueprintStore'
import { useConfirm } from '@/composables/useConfirm'
import { useNpcSimulation } from '../../composables/useNpcSimulation'
import { NPC_MOOD_LEGEND } from '../../composables/useNpcOverlayDraw'
import ObjectPropertiesForm from './ObjectPropertiesForm.vue'
import AssetProperties from './AssetProperties.vue'

const store = useAssetsStore()
const confirm = useConfirm().confirm

const object = computed(() => store.selectedObject())
const asset = computed(() => store.selectedAsset.value)
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

const previewActive = computed(() => store.state.mode === 'npc-preview')
const npcSimulation = inject('npcSimulation') as ReturnType<typeof useNpcSimulation>
const { npcs, isPaused, pause, resume, reset, stop, simSpeed } = npcSimulation
const total = computed(() => npcs.value.length)
const currentFloorLabel = computed(() => store.currentFloor.value?.label ?? '-')
const countsByRole = computed(() => {
  const map = new Map<string, number>()
  for (const npc of npcs.value) map.set(npc.type, (map.get(npc.type) ?? 0) + 1)
  return map
})

function onTogglePause() {
  if (isPaused.value) resume()
  else pause()
}

const NPC_STATUS_ORDER = ['walking', 'interacting', 'chatting', 'queued', 'waiting', 'idle'] as const
type NpcStatusKey = (typeof NPC_STATUS_ORDER)[number]
const NPC_STATUS_LABELS: Record<NpcStatusKey, string> = {
  walking: 'Moving',
  interacting: 'Interacting',
  chatting: 'Chatting',
  queued: 'Queued',
  waiting: 'Waiting',
  idle: 'Idle',
}
const statusCounts = ref<{ key: NpcStatusKey; label: string; count: number }[]>([])
const statusTimer = window.setInterval(() => {
  if (store.state.mode !== 'npc-preview') return
  const counts = new Map<string, number>()
  for (const npc of npcs.value) counts.set(npc.status, (counts.get(npc.status) ?? 0) + 1)
  const next = NPC_STATUS_ORDER.filter((status) => counts.has(status)).map((status) => ({
    key: status,
    label: NPC_STATUS_LABELS[status],
    count: counts.get(status)!,
  }))
  const prev = statusCounts.value
  if (prev.length === next.length && prev.every((p, i) => p.key === next[i].key && p.count === next[i].count)) return
  statusCounts.value = next
}, 300)
onUnmounted(() => window.clearInterval(statusTimer))

async function onReset() {
  const confirmed = await confirm({
    title: 'Clear Simulation',
    message: 'Remove all deployed NPCs and exit preview?',
    confirmLabel: 'Clear',
    cancelLabel: 'Cancel',
    danger: true,
  })
  if (!confirmed) return
  reset()
  store.setMode('move')
}
function onExitDeploy() {
  stop()
  store.setMode('move')
}

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
  if (ids.length < 2) return
  const confirmed = await confirm({
    title: 'Flatten selection',
    message: 'Merge the selected objects into a single SVG asset? This cannot be undone.',
    confirmLabel: 'Flatten',
    cancelLabel: 'Cancel',
    danger: true,
  })
  if (!confirmed) return
  const id = await store.flattenToSvgAsset(flattenName.value || undefined)
  if (id) {
    flattenName.value = ''
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
      <!-- NPC preview controls -->
      <div v-if="previewActive">
        <div class="form__col">
          <h3>NPC Preview</h3>
          <div class="form__row">
            <div class="form__col">
              <strong>{{ currentFloorLabel }}</strong>
              <span>{{ total }} NPC{{ total === 1 ? '' : 's' }}</span>
            </div>
            <span class="badge" :class="isPaused ? 'flag--warning' : 'flag--success'" role="status">{{
              isPaused ? 'Paused' : 'Running'
            }}</span>
            <div class="form__row form--wrap">
              <span v-for="[type, count] in countsByRole" :key="type" class="npc__role">
                <span>{{ type }}</span>
                <b>{{ count }}</b>
              </span>
            </div>
          </div>
          <div v-if="total > 0" class="form__row form--wrap">
            <span v-for="s in statusCounts" :key="s.key" class="form__hint">
              {{ s.label }} <b>{{ s.count }}</b>
            </span>
          </div>
          <div class="form__row form--wrap">
            <span class="form__hint">Moods</span>
            <span v-for="mood in NPC_MOOD_LEGEND" :key="mood.kind" class="form__hint">
              <span class="swatch" :style="{ background: mood.color }" />
              {{ mood.label }}
            </span>
          </div>
          <div class="form__row form--wrap">
            <button
              type="button"
              :aria-label="isPaused ? 'Resume NPC simulation' : 'Pause NPC simulation'"
              @click="onTogglePause"
            >
              {{ isPaused ? 'Resume' : 'Pause' }}
            </button>
            <div class="form__row" role="group" aria-label="Simulation speed">
              <button
                v-for="s in [1, 2, 4, 8]"
                :key="s"
                type="button"
                :class="{ 'flag--active': simSpeed === s }"
                :aria-pressed="simSpeed === s"
                @click="simSpeed = s"
              >
                {{ s }}x
              </button>
            </div>
            <button type="button" class="flag--danger" aria-label="Clear all NPCs and exit preview" @click="onReset">
              Clear
            </button>
            <button type="button" aria-label="Exit NPC preview" @click="onExitDeploy">Exit</button>
          </div>
        </div>
      </div>

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
      <div v-if="store.state.selectionState.items.length >= 2">
        <div class="form__col">
          <h3>
            {{ selectedItems.length }} object{{ selectedItems.length === 1 ? '' : 's' }} selected
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
          <button class="flag--success size--fill" @click="doFlatten">Flatten to SVG Asset</button>
        </div>
      </div>

      <!-- Asset editor -->
      <AssetProperties v-if="asset" :key="asset.id" :asset="asset" />

      <!-- Object editor (single selection only) -->
      <ObjectPropertiesForm
        v-else-if="object && store.state.selectionState.items.length === 1"
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

.npc__role {
  display: inline-flex;
  align-items: center;
  gap: var(--gap-xs);
  padding: var(--gap-xxs) var(--gap-xs);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
}

.npc__role b {
  color: var(--accent-blue);
}
</style>
