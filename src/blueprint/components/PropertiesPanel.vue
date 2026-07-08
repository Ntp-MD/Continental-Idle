<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAssetsStore } from '../assets-store'
import { useToast } from '@/composables/useToast'
import RoomPropertiesForm from './RoomPropertiesForm.vue'
import ObjectPropertiesForm from './ObjectPropertiesForm.vue'
import AssetPropertiesForm from './AssetPropertiesForm.vue'

const store = useAssetsStore()

const room = computed(() => store.selectedRoom())
const object = computed(() => store.selectedObject())
const asset = computed(() => store.selectedAsset.value)

const compositeName = ref('')
const linkedName = ref('')

async function doMerge() {
  if (!store.state.multiSelection || store.state.multiSelection.ids.length < 2) return
  await store.mergeObjects([...store.state.multiSelection.ids])
}

async function doLink() {
  if (!store.state.multiSelection || store.state.multiSelection.ids.length < 2) return
  await store.linkObjects([...store.state.multiSelection.ids])
}

async function doCreateComposite() {
  if (!store.state.multiSelection || store.state.multiSelection.ids.length < 2) return
  const id = await store.createCompositeAssetFromSelection(compositeName.value || undefined)
  if (id) compositeName.value = ''
}

async function doCreateLinked() {
  if (!store.state.multiSelection || store.state.multiSelection.ids.length < 2) return
  const id = await store.createLinkedAssetFromSelection(linkedName.value || undefined)
  if (id) linkedName.value = ''
}

/* ---------- Zone Management ---------- */
const showZoneManager = ref(false)
const newZoneLabel = ref('')
const newZoneColor = ref('#06b6d4')
const newZoneW = ref(200)
const newZoneH = ref(100)

const zones = computed(() => store.currentFloor.value?.zones ?? [])

async function addZone() {
  const floor = store.currentFloor.value
  if (!floor) return
  const t = store.state.layout.canvas.tileSize
  const x = Math.round((floor.rooms[0]?.x ?? 0) / t) * t
  const y = Math.round((floor.rooms[0]?.y ?? 0) / t) * t
  await store.addZone(x, y, newZoneW.value, newZoneH.value, newZoneLabel.value || undefined, newZoneColor.value || undefined)
  useToast().success('Zone added')
  newZoneLabel.value = ''
  newZoneColor.value = '#06b6d4'
}

async function deleteZone(id: string) {
  await store.deleteZone(id)
  useToast().info('Zone deleted')
}

async function updateZoneColor(id: string, color: string) {
  await store.updateZone(id, { color })
}

async function updateZoneLabel(id: string, label: string) {
  await store.updateZone(id, { label })
}

async function updateZoneX(id: string, x: number) {
  await store.updateZone(id, { x })
}

async function updateZoneY(id: string, y: number) {
  await store.updateZone(id, { y })
}

async function updateZoneW(id: string, w: number) {
  await store.updateZone(id, { w })
}

async function updateZoneH(id: string, h: number) {
  await store.updateZone(id, { h })
}
</script>

<template>
  <div class="properties-panel">
    <div class="properties-panel__header">
      <span>Properties</span>
      <span class="properties-panel__floor-context">{{ store.currentFloor.value?.label ?? '—' }} · {{ store.currentFloor.value?.name ?? '' }}</span>
    </div>

    <div v-if="!room && !object && !asset && !store.state.multiSelection" class="properties-panel__body">
      <div class="properties-panel__empty">Select a room, object, or asset to edit properties.</div>
      <div class="properties-panel__empty-hint">Click an asset in the palette to edit its definition. Click an object on the canvas to edit instance properties.</div>
      <button class="properties-panel__btn" @click="showZoneManager = !showZoneManager">{{ showZoneManager ? 'Close' : 'Manage Zones' }}</button>
      <div v-if="showZoneManager" class="properties-panel__cat-manager">
        <div v-for="zone in zones" :key="zone.id" class="properties-panel__zone-row">
          <div class="properties-panel__cat-row">
            <input type="color" :value="zone.color" @change="updateZoneColor(zone.id, ($event.target as HTMLInputElement).value)" class="properties-panel__cat-color" />
            <input type="text" :value="zone.label" @change="updateZoneLabel(zone.id, ($event.target as HTMLInputElement).value)" class="properties-panel__cat-label" />
            <button class="properties-panel__btn properties-panel__btn--danger properties-panel__btn--sm" @click="deleteZone(zone.id)">×</button>
          </div>
          <div class="properties-panel__zone-pos">
            <label>X</label>
            <input type="number" :value="zone.x" @change="updateZoneX(zone.id, +($event.target as HTMLInputElement).value)" />
            <label>Y</label>
            <input type="number" :value="zone.y" @change="updateZoneY(zone.id, +($event.target as HTMLInputElement).value)" />
          </div>
          <div class="properties-panel__zone-pos">
            <label>W</label>
            <input type="number" :value="zone.w" @change="updateZoneW(zone.id, +($event.target as HTMLInputElement).value)" />
            <label>H</label>
            <input type="number" :value="zone.h" @change="updateZoneH(zone.id, +($event.target as HTMLInputElement).value)" />
          </div>
        </div>
        <div class="properties-panel__cat-add">
          <input type="text" v-model="newZoneLabel" placeholder="Zone label" class="properties-panel__cat-label" />
          <input type="color" v-model="newZoneColor" class="properties-panel__cat-color" />
        </div>
        <div class="properties-panel__row">
          <label>W</label>
          <input type="number" min="25" step="25" v-model.number="newZoneW" />
        </div>
        <div class="properties-panel__row">
          <label>H</label>
          <input type="number" min="25" step="25" v-model.number="newZoneH" />
        </div>
        <button class="properties-panel__btn" @click="addZone">+ Add Zone</button>
      </div>
    </div>

    <!-- Multi-selection -->
    <div v-if="store.state.multiSelection && store.state.multiSelection.ids.length >= 2" class="properties-panel__body">
      <div class="properties-panel__section-title">{{ store.state.multiSelection.ids.length }} objects selected</div>
      <div class="properties-panel__row">
        <label>Tip</label>
        <span class="properties-panel__value">Shift+click to add/remove</span>
      </div>
      <button class="properties-panel__btn" @click="doMerge">Merge Objects</button>
      <button class="properties-panel__btn" @click="doLink">Link Objects</button>
      <div class="properties-panel__section-title">Save as Composite Asset</div>
      <div class="properties-panel__row">
        <label>Name</label>
        <input type="text" v-model="compositeName" placeholder="e.g. U-Shape Sofa" />
      </div>
      <button class="properties-panel__btn" @click="doCreateComposite">Save as Composite Asset</button>
      <div class="properties-panel__section-title">Save as Linked Set</div>
      <div class="properties-panel__row">
        <label>Name</label>
        <input type="text" v-model="linkedName" placeholder="e.g. Table + Chairs" />
      </div>
      <button class="properties-panel__btn" @click="doCreateLinked">Save as Linked Asset</button>
    </div>

    <!-- Asset editor -->
    <AssetPropertiesForm v-if="asset" :asset="asset" />

    <!-- Room editor -->
    <RoomPropertiesForm v-else-if="room" :room="room" />

    <!-- Object editor -->
    <ObjectPropertiesForm v-else-if="object" :object="object" />
  </div>
</template>

<style scoped>
.properties-panel {
  width: 320px;
  min-width: 280px;
  max-width: 400px;
  background: var(--bg-card, #161820);
  border-left: 1px solid var(--border-dim, #252530);
  color: var(--text-primary, #e8e8ec);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.properties-panel__header {
  padding: 16px 18px;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--border-dim, #252530);
  background: linear-gradient(180deg, var(--bg-card, #161820) 0%, var(--bg-secondary, #0c0d10) 100%);
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
}

.properties-panel__floor-context {
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0;
  color: var(--text-dim, #6a6a74);
}

.properties-panel__empty {
  padding: 24px 18px 16px;
  font-size: 13px;
  color: var(--text-secondary, #a0a0a8);
  text-align: center;
  line-height: 1.5;
  flex-shrink: 0;
}

.properties-panel__empty-hint {
  font-size: 12px;
  color: var(--text-dim, #6a6a74);
  line-height: 1.6;
  padding: 0 0 16px;
  border-bottom: 1px solid var(--border-dim, #252530);
  margin-bottom: 16px;
  text-align: center;
}

.properties-panel__section-title {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--accent-gold, #f0c040);
  padding: 16px 18px 8px;
  border-bottom: 1px solid var(--border-dim, #252530);
  margin-bottom: 12px;
  font-weight: 600;
}

.properties-panel__content {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.properties-panel__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
}

.properties-panel__row input,
.properties-panel__row select {
  flex: 1;
  min-width: 0;
  background: var(--bg-tertiary, #101216);
  border: 1px solid var(--border-dim, #252530);
  color: var(--text-primary, #e8e8ec);
  padding: 5px 6px;
  border-radius: 4px;
}

.properties-panel__input--error {
  border-color: var(--accent-red, #ef4444) !important;
  box-shadow: 0 0 0 1px var(--accent-red, #ef4444);
}

.properties-panel__value {
  color: var(--text-secondary, #a0a0a8);
}

.properties-panel__btn {
  background: var(--bg-tertiary, #101216);
  border: 1px solid var(--border-dim, #252530);
  color: var(--text-primary, #e8e8ec);
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.properties-panel__btn:hover:not(:disabled):not(.properties-panel__btn--danger) {
  border-color: var(--accent-gold, #f0c040);
}

.properties-panel__btn--danger {
  color: var(--accent-red, #ef4444);
  border-color: var(--accent-red, #ef4444);
}

.properties-panel__btn--danger:hover:not(:disabled) {
  opacity: 0.85;
}

.properties-panel__btn--save {
  color: #08090c;
  background: var(--accent-green, #3dd68c);
  border-color: var(--accent-green, #3dd68c);
  font-weight: bold;
}

.properties-panel__btn--save:hover:not(:disabled) {
  opacity: 0.85;
}

.properties-panel__inuse-alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 12px;
  color: var(--accent-gold, #f0c040);
  background: rgba(240, 192, 64, 0.1);
  border: 1px solid rgba(240, 192, 64, 0.35);
  border-radius: 8px;
  padding: 12px 14px;
  line-height: 1.5;
}

.properties-panel__inuse-info {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 12px;
  color: var(--text-dim, #6a6a74);
  background: rgba(100, 100, 120, 0.1);
  border: 1px solid rgba(100, 100, 120, 0.25);
  border-radius: 8px;
  padding: 12px 14px;
  line-height: 1.5;
}

.properties-panel__collapsed-alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 12px;
  color: var(--accent-red, #ef4444);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.35);
  border-radius: 8px;
  padding: 12px 14px;
  line-height: 1.5;
}

.properties-panel__collapsed-icon {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: bold;
}

.properties-panel__cat-manager {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  background: var(--bg-tertiary, #101216);
  border-radius: 8px;
  margin: 8px 0;
  border: 1px solid var(--border-dim, #252530);
}

.properties-panel__cat-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.properties-panel__cat-color {
  width: 28px;
  height: 24px;
  border: 1px solid var(--border-dim, #252530);
  border-radius: 4px;
  background: none;
  cursor: pointer;
  flex-shrink: 0;
}

.properties-panel__cat-label {
  flex: 1;
  background: var(--bg-secondary, #0c0d10);
  border: 1px solid var(--border-dim, #252530);
  color: var(--text-primary, #e8e8ec);
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 12px;
  min-width: 0;
}

.properties-panel__textarea {
  flex: 1;
  background: var(--bg-secondary, #0c0d10);
  border: 1px solid var(--border-dim, #252530);
  color: var(--text-primary, #e8e8ec);
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 12px;
  resize: vertical;
  min-height: 40px;
  font-family: inherit;
}

.properties-panel__textarea:focus {
  outline: none;
  border-color: var(--accent-blue, #3b82f6);
}

.properties-panel__cat-add {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}

.properties-panel__btn--sm {
  padding: 4px 8px;
  font-size: 14px;
  min-width: 28px;
}

.properties-panel__color-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.properties-panel__zone-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 0;
  border-bottom: 1px solid var(--border-dim, #252530);
}

.properties-panel__zone-pos {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
}

.properties-panel__zone-pos label {
  color: var(--text-dim, #6a6a74);
  min-width: 12px;
}

.properties-panel__zone-pos input {
  width: 60px;
  background: var(--bg-tertiary, #101216);
  border: 1px solid var(--border-dim, #252530);
  color: var(--text-primary, #e8e8ec);
  padding: 3px 4px;
  border-radius: 3px;
  font-size: 11px;
}

.properties-panel__rx-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  width: 100%;
}

.properties-panel__rx-corner {
  display: flex;
  align-items: center;
  gap: 4px;
}

.properties-panel__rx-label {
  font-size: 10px;
  color: var(--text-dim, #6a6a74);
  min-width: 28px;
  flex-shrink: 0;
}

.properties-panel__rx-sync {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-dim, #6a6a74);
}

.properties-panel__rx-sync input {
  width: auto;
}

.properties-panel__rx-input {
  width: 100%;
  min-width: 0;
  background: var(--bg-tertiary, #101216);
  border: 1px solid var(--border-dim, #252530);
  color: var(--text-primary, #e8e8ec);
  padding: 3px 4px;
  border-radius: 3px;
  font-size: 11px;
  text-align: center;
}

.properties-panel__composite-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--accent-gold, #f0c040);
  background: rgba(240, 192, 64, 0.08);
  border: 1px solid rgba(240, 192, 64, 0.3);
  border-radius: 6px;
  padding: 8px 10px;
  line-height: 1.4;
  margin-bottom: 4px;
}

.properties-panel__linked-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #06b6d4;
  background: rgba(6, 182, 212, 0.08);
  border: 1px solid rgba(6, 182, 212, 0.3);
  border-radius: 6px;
  padding: 8px 10px;
  line-height: 1.4;
  margin-bottom: 4px;
}

.properties-panel__btn-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-top: 4px;
}

.properties-panel__btn-group .properties-panel__btn {
  flex: 1;
  min-width: 70px;
}

.properties-panel__delete-section {
  display: flex;
  gap: 8px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 2px solid var(--border-dim, #252530);
}

.properties-panel__delete-section .properties-panel__btn {
  flex: 1;
}

.properties-panel__unit-toggle {
  display: flex;
  gap: 0;
  flex: 1;
}

.properties-panel__unit-btn {
  flex: 1;
  background: var(--bg-tertiary, #101216);
  border: 1px solid var(--border-dim, #252530);
  color: var(--text-secondary, #a0a0a8);
  padding: 5px 8px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
}

.properties-panel__unit-btn:first-child {
  border-radius: 4px 0 0 4px;
}

.properties-panel__unit-btn:last-child {
  border-radius: 0 4px 4px 0;
  border-left: none;
}

.properties-panel__unit-btn--active {
  background: var(--accent-gold, #f0c040);
  color: #08090c;
  border-color: var(--accent-gold, #f0c040);
  font-weight: bold;
}
</style>

<style>
.properties-panel__content {
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.properties-panel__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
}

.properties-panel__row input,
.properties-panel__row select {
  flex: 1;
  min-width: 0;
  background: var(--bg-tertiary, #101216);
  border: 1px solid var(--border-dim, #252530);
  color: var(--text-primary, #e8e8ec);
  padding: 6px 8px;
  border-radius: 5px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.properties-panel__row input:focus,
.properties-panel__row select:focus {
  outline: none;
  border-color: var(--accent-gold, #f0c040);
  box-shadow: 0 0 0 2px rgba(240, 192, 64, 0.15);
}

.properties-panel__row label {
  color: var(--text-secondary, #a0a0a8);
  min-width: 60px;
}

.properties-panel__cat-color {
  width: 28px;
  height: 24px;
  border: 1px solid var(--border-dim, #252530);
  border-radius: 4px;
  background: none;
  cursor: pointer;
  flex-shrink: 0;
}

.properties-panel__input--error {
  border-color: var(--accent-red, #ef4444) !important;
  box-shadow: 0 0 0 1px var(--accent-red, #ef4444);
}

.properties-panel__input--readonly {
  background: var(--bg-secondary, #0c0d10);
  color: var(--text-dim, #6a6a74);
  cursor: not-allowed;
  opacity: 0.7;
}

.properties-panel__value {
  color: var(--text-secondary, #a0a0a8);
}

.properties-panel__btn {
  background: var(--bg-tertiary, #101216);
  border: 1px solid var(--border-dim, #252530);
  color: var(--text-primary, #e8e8ec);
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.15s ease;
}

.properties-panel__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.properties-panel__btn:hover:not(:disabled):not(.properties-panel__btn--danger) {
  border-color: var(--accent-gold, #f0c040);
  transform: translateY(-1px);
}

.properties-panel__btn:active:not(:disabled) {
  transform: translateY(0);
}

.properties-panel__btn--danger {
  color: var(--accent-red, #ef4444);
  border-color: var(--accent-red, #ef4444);
}

.properties-panel__btn--danger:hover:not(:disabled) {
  opacity: 0.85;
}

.properties-panel__btn--save {
  color: #08090c;
  background: var(--accent-green, #3dd68c);
  border-color: var(--accent-green, #3dd68c);
  font-weight: bold;
}

.properties-panel__btn--save:hover:not(:disabled) {
  opacity: 0.85;
}

.properties-panel__btn--sm {
  padding: 4px 8px;
  font-size: 14px;
  min-width: 28px;
}

.properties-panel__btn-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-top: 4px;
}

.properties-panel__btn-group .properties-panel__btn {
  flex: 1;
  min-width: 70px;
}

.properties-panel__delete-section {
  display: flex;
  gap: 8px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 2px solid var(--border-dim, #252530);
}

.properties-panel__delete-section .properties-panel__btn {
  flex: 1;
}

.properties-panel__section-title {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--accent-gold, #f0c040);
  padding: 16px 18px 8px;
  border-bottom: 1px solid var(--border-dim, #252530);
  margin-bottom: 12px;
  font-weight: 600;
}

.properties-panel__inuse-alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 12px;
  color: var(--accent-gold, #f0c040);
  background: rgba(240, 192, 64, 0.1);
  border: 1px solid rgba(240, 192, 64, 0.35);
  border-radius: 8px;
  padding: 12px 14px;
  line-height: 1.5;
}

.properties-panel__inuse-info {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 12px;
  color: var(--text-dim, #6a6a74);
  background: rgba(100, 100, 120, 0.1);
  border: 1px solid rgba(100, 100, 120, 0.25);
  border-radius: 8px;
  padding: 12px 14px;
  line-height: 1.5;
}

.properties-panel__collapsed-alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 12px;
  color: var(--accent-red, #ef4444);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.35);
  border-radius: 8px;
  padding: 12px 14px;
  line-height: 1.5;
}

.properties-panel__collapsed-icon {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: bold;
}

.properties-panel__composite-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--accent-gold, #f0c040);
  background: rgba(240, 192, 64, 0.08);
  border: 1px solid rgba(240, 192, 64, 0.3);
  border-radius: 6px;
  padding: 8px 10px;
  line-height: 1.4;
  margin-bottom: 4px;
}

.properties-panel__linked-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #06b6d4;
  background: rgba(6, 182, 212, 0.08);
  border: 1px solid rgba(6, 182, 212, 0.3);
  border-radius: 6px;
  padding: 8px 10px;
  line-height: 1.4;
  margin-bottom: 4px;
}

.properties-panel__color-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.properties-panel__rx-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  width: 100%;
}

.properties-panel__rx-corner {
  display: flex;
  align-items: center;
  gap: 4px;
}

.properties-panel__rx-label {
  font-size: 10px;
  color: var(--text-dim, #6a6a74);
  min-width: 28px;
  flex-shrink: 0;
}

.properties-panel__rx-sync {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-dim, #6a6a74);
}

.properties-panel__rx-sync input {
  width: auto;
}

.properties-panel__rx-input {
  width: 100%;
  min-width: 0;
  background: var(--bg-tertiary, #101216);
  border: 1px solid var(--border-dim, #252530);
  color: var(--text-primary, #e8e8ec);
  padding: 3px 4px;
  border-radius: 3px;
  font-size: 11px;
  text-align: center;
}

.properties-panel__textarea {
  flex: 1;
  background: var(--bg-secondary, #0c0d10);
  border: 1px solid var(--border-dim, #252530);
  color: var(--text-primary, #e8e8ec);
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 12px;
  resize: vertical;
  min-height: 40px;
  font-family: inherit;
}

.properties-panel__textarea:focus {
  outline: none;
  border-color: var(--accent-blue, #3b82f6);
}

.properties-panel__unit-toggle {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}

.properties-panel__unit-btn {
  flex: 1;
  background: var(--bg-tertiary, #101216);
  border: 1px solid var(--border-dim, #252530);
  color: var(--text-secondary, #a0a0a8);
  padding: 4px 8px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
}

.properties-panel__unit-btn:hover:not(.properties-panel__unit-btn--active) {
  border-color: var(--accent-gold, #f0c040);
  color: var(--text-primary, #e8e8ec);
}

.properties-panel__unit-btn--active {
  background: var(--accent-gold, #f0c040);
  color: #08090c;
  border-color: var(--accent-gold, #f0c040);
  font-weight: bold;
}

.properties-panel__cat-manager {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  background: var(--bg-tertiary, #101216);
  border-radius: 8px;
  margin: 8px 0;
  border: 1px solid var(--border-dim, #252530);
}

.properties-panel__cat-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.properties-panel__cat-add {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
}

.properties-panel__zone-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px 0;
  border-bottom: 1px solid var(--border-dim, #252530);
}

.properties-panel__zone-pos {
  display: flex;
  align-items: center;
  gap: 4px;
}

.properties-panel__zone-pos label {
  font-size: 10px;
  color: var(--text-dim, #6a6a74);
  min-width: 20px;
}

.properties-panel__zone-pos input {
  flex: 1;
  min-width: 0;
  background: var(--bg-tertiary, #101216);
  border: 1px solid var(--border-dim, #252530);
  color: var(--text-primary, #e8e8ec);
  padding: 3px 4px;
  border-radius: 3px;
  font-size: 11px;
}
</style>
