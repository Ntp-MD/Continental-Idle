<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useAssetsStore } from '../../blueprintStore'
import { useToast, reportSaved } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { useAsyncAction } from '../../composables/useAsyncAction'
import { DEFAULT_EDITOR_SETTINGS, EDITOR_FIELD_SPECS, CANVAS_FIELD_SPECS, canvasWithinGridCaps } from '../../domain/types'
import type { EditorSettings } from '../../domain/types'
import { MAX_GRID_COLUMNS, MAX_GRID_ROWS } from '../../limits'
import { useCanvasDefaults } from '../../composables/useCanvasDefaults'
import ModalShell from '../shell/ModalShell.vue'
import ColorInput from '../inputs/ColorInput.vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const store = useAssetsStore()
const toast = useToast()
const confirm = useConfirm().confirm
const { pending, run } = useAsyncAction()
const status = ref('')
const statusTone = ref<'' | 'warn' | 'fail'>('')

watch(
  () => props.open,
  (open) => {
    if (open) {
      status.value = ''
      statusTone.value = ''
    }
  },
)

const widthInput = ref(store.state.layout.canvas.width)
const heightInput = ref(store.state.layout.canvas.height)
const tileInput = ref(store.state.layout.canvas.tileSize)
const bgColorInput = ref(store.state.layout.canvas.bgColor)
const labelColorInput = ref(store.state.layout.canvas.labelColor)
const wallColorInput = ref(store.state.layout.canvas.wallColor)
const gridColorInput = ref(store.state.layout.canvas.gridColor)
const streetSidewalkColorInput = ref(store.state.layout.canvas.streetSidewalkColor)
const streetRoadColorInput = ref(store.state.layout.canvas.streetRoadColor)
const streetMarkingColorInput = ref(store.state.layout.canvas.streetMarkingColor)

const maxCanvasWidth = computed(() => MAX_GRID_COLUMNS * Math.max(1, Math.round(tileInput.value || store.state.layout.canvas.tileSize)))
const maxCanvasHeight = computed(() => MAX_GRID_ROWS * Math.max(1, Math.round(tileInput.value || store.state.layout.canvas.tileSize)))
const contentLocked = computed(() => store.hasContent())

watch(
  () => [props.open, store.state.layout.canvas] as const,
  ([open, c]) => {
    if (open) {
      widthInput.value = c.width
      heightInput.value = c.height
      tileInput.value = c.tileSize
      bgColorInput.value = c.bgColor
      labelColorInput.value = c.labelColor
      wallColorInput.value = c.wallColor
      gridColorInput.value = c.gridColor
      streetSidewalkColorInput.value = c.streetSidewalkColor
      streetRoadColorInput.value = c.streetRoadColor
      streetMarkingColorInput.value = c.streetMarkingColor
    }
  },
  { immediate: true },
)

async function applyCanvasSize() {
  const canvas = store.state.layout.canvas
  const changed =
    widthInput.value !== canvas.width || heightInput.value !== canvas.height || tileInput.value !== canvas.tileSize
  if (changed && store.hasContent()) {
    toast.error('Clear all objects and painted tiles before changing the canvas size')
    return
  }
  const tileSize = tileInput.value > 0 ? tileInput.value : canvas.tileSize
  if (!canvasWithinGridCaps({ width: widthInput.value, height: heightInput.value, tileSize })) {
    toast.error(`Canvas size must fit within ${MAX_GRID_COLUMNS} x ${MAX_GRID_ROWS} tiles`)
    return
  }
  try {
    const saved = await run(() => store.resizeCanvas(widthInput.value, heightInput.value, tileInput.value))
    if (!reportSaved(!!saved, 'Canvas resized', 'Failed to resize canvas')) return
  } catch {
    toast.error('Failed to resize canvas')
  }
}

async function applyCanvasBgColor(value: string | undefined) {
  try {
    await run(() => store.setCanvasBgColor(value))
  } catch {
    toast.error('Failed to set canvas background color')
  }
}

async function applyLabelColor(value: string | undefined) {
  try {
    const saved = await run(() => store.setCanvasLabelColor(value))
    if (!saved) toast.error('Failed to set label color')
  } catch {
    toast.error('Failed to set label color')
  }
}

async function applyWallColor(value: string | undefined) {
  try {
    const saved = await run(() => store.setCanvasWallColor(value))
    if (!saved) toast.error('Failed to set wall color')
  } catch {
    toast.error('Failed to set wall color')
  }
}

async function applyGridColor(value: string | undefined) {
  try {
    const saved = await run(() => store.setCanvasGridColor(value))
    if (!saved) toast.error('Failed to set grid color')
  } catch {
    toast.error('Failed to set grid color')
  }
}

async function applyStreetSidewalkColor(value: string | undefined) {
  try {
    const saved = await run(() => store.setCanvasStreetSidewalkColor(value))
    if (!saved) toast.error('Failed to set sidewalk color')
  } catch {
    toast.error('Failed to set sidewalk color')
  }
}

async function applyStreetRoadColor(value: string | undefined) {
  try {
    const saved = await run(() => store.setCanvasStreetRoadColor(value))
    if (!saved) toast.error('Failed to set road color')
  } catch {
    toast.error('Failed to set road color')
  }
}

async function applyStreetMarkingColor(value: string | undefined) {
  try {
    const saved = await run(() => store.setCanvasStreetMarkingColor(value))
    if (!saved) toast.error('Failed to set lane marking color')
  } catch {
    toast.error('Failed to set lane marking color')
  }
}

async function applyStreetFloor(floorId: string | null) {
  try {
    const saved = await run(() => store.setStreetFloor(floorId))
    if (!saved) toast.error('Failed to update street floor')
  } catch {
    toast.error('Failed to update street floor')
  }
}

const { editorSettings: currentEditor } = useCanvasDefaults()
const draft = ref<EditorSettings>({ ...DEFAULT_EDITOR_SETTINGS })

watch(
  () => [props.open, currentEditor.value] as const,
  ([open]) => {
    if (open) draft.value = { ...currentEditor.value }
  },
  { immediate: true },
)

type FieldKey = keyof EditorSettings
interface FieldDef {
  key: FieldKey
  label: string
  step: number
  preview?: 'radius'
}
interface EditorGroup {
  title: string
  hint: string
  fields: FieldDef[]
}

type SettingsTab = 'canvas' | 'interaction' | 'display' | 'grid'
const activeTab = ref<SettingsTab>('canvas')
const settingsTabs: { key: SettingsTab; label: string }[] = [
  { key: 'canvas', label: 'Canvas' },
  { key: 'interaction', label: 'Interaction' },
  { key: 'display', label: 'Display' },
  { key: 'grid', label: 'Grid Editor' },
]
const editorTabs = settingsTabs.filter((t) => t.key !== 'canvas') as {
  key: Exclude<SettingsTab, 'canvas'>
  label: string
}[]

const editorGroupsByTab: Record<Exclude<SettingsTab, 'canvas'>, EditorGroup[]> = {
  interaction: [
    {
      title: 'Hit Testing',
      hint: 'Tolerances for hit, drag, cycle and box select.',
      fields: [
        { key: 'dragThresholdPx', label: 'Drag threshold px', step: 0.5 },
        { key: 'cycleThresholdPx', label: 'Cycle threshold px', step: 0.5 },
        { key: 'boxSelectThresholdPx', label: 'Box select px', step: 0.5 },
      ],
    },
  ],
  display: [
    {
      title: 'Overlay Sizes',
      hint: 'Radius in screen px of spot dots, lock indicators and NPC dots.',
      fields: [
        { key: 'interactSpotRadiusPx', label: 'Interact spot radius px', step: 0.5, preview: 'radius' },
        { key: 'lockIndicatorRadiusPx', label: 'Lock indicator radius px', step: 0.5, preview: 'radius' },
        { key: 'npcDotSize', label: 'NPC dot radius px', step: 0.5, preview: 'radius' },
      ],
    },
    {
      title: 'Font Sizes',
      hint: 'Text sizes in px, scaled by 1/zoom.',
      fields: [
        { key: 'labelFontSizePx', label: 'Object label', step: 0.5 },
        { key: 'lockLabelFontSizePx', label: 'Lock label', step: 0.5 },
        { key: 'interactSpotFontSizePx', label: 'Interact spot label', step: 0.5 },
        { key: 'zoneLabelFontSizePx', label: 'Zone label', step: 0.5 },
        { key: 'emptyStateFontSizePx', label: 'Empty state', step: 1 },
        { key: 'rulerTickFontSizePx', label: 'Ruler tick', step: 0.5 },
      ],
    },
    {
      title: 'Ruler',
      hint: 'Bar size clamps relative to zoom (sqrt scaling).',
      fields: [
        { key: 'rulerMinPx', label: 'Min px', step: 1 },
        { key: 'rulerMaxPx', label: 'Max px', step: 1 },
        { key: 'rulerBasePx', label: 'Base px', step: 1 },
      ],
    },
  ],
  grid: [
    {
      title: 'Walkable Grid Editor',
      hint: 'Tile size constraints for the grid modal.',
      fields: [
        { key: 'walkableGridMinTilePx', label: 'Min tile px', step: 1 },
        { key: 'walkableGridMaxTilePx', label: 'Max tile px', step: 1 },
        { key: 'walkableGridMaxWidthPx', label: 'Max width px', step: 10 },
        { key: 'walkableGridMaxHeightPx', label: 'Max height px', step: 10 },
      ],
    },
  ],
}

function fieldRange(key: FieldKey) {
  const spec = EDITOR_FIELD_SPECS[key]
  return { min: spec.min, max: spec.max }
}

function radiusPreview(key: FieldKey): number {
  const value = Number(draft.value[key])
  if (!Number.isFinite(value) || value <= 0) return 2
  return Math.min(48, Math.max(2, value * 2))
}

const isEditorDirty = computed(() => {
  const c = currentEditor.value
  return (Object.keys(c) as FieldKey[]).some((k) => draft.value[k] !== c[k])
})

async function applyEditorField(key: FieldKey) {
  const range = fieldRange(key)
  const v = draft.value[key]
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    status.value = 'Enter a valid number'
    statusTone.value = 'warn'
    draft.value[key] = currentEditor.value[key]
    return
  }
  if (range.min !== undefined && v < range.min) {
    status.value = `Value must be >= ${range.min}`
    statusTone.value = 'warn'
    draft.value[key] = currentEditor.value[key]
    return
  }
  if (range.max !== undefined && v > range.max) {
    status.value = `Value must be <= ${range.max}`
    statusTone.value = 'warn'
    draft.value[key] = currentEditor.value[key]
    return
  }
  status.value = ''
  statusTone.value = ''
  try {
    const saved = await run(() => store.setEditorSettings({ [key]: v }))
    if (!saved) {
      status.value = 'Failed to save setting'
      statusTone.value = 'fail'
    }
  } catch {
    status.value = 'Failed to save setting'
    statusTone.value = 'fail'
  }
}

async function applyEditorAll() {
  const c = currentEditor.value
  const patch: Partial<EditorSettings> = {}
  for (const key of Object.keys(c) as FieldKey[]) {
    if (draft.value[key] !== c[key]) patch[key] = draft.value[key]
  }
  if (Object.keys(patch).length === 0) return
  try {
    const saved = await run(() => store.setEditorSettings(patch))
    if (!saved) {
      status.value = 'Some values out of range'
      statusTone.value = 'warn'
      return
    }
    status.value = ''
    statusTone.value = ''
    toast.success('Editor settings saved')
  } catch {
    status.value = 'Failed to save editor settings'
    statusTone.value = 'fail'
  }
}

async function resetEditorAll() {
  const ok = await confirm({
    title: 'Reset editor settings',
    message: 'Reset all editor settings to defaults? This cannot be undone.',
    confirmLabel: 'Reset',
    cancelLabel: 'Cancel',
    danger: true,
  })
  if (!ok) return
  try {
    const saved = await run(() => store.resetEditorSettings())
    if (!saved) {
      toast.error('Failed to reset')
      return
    }
    draft.value = { ...DEFAULT_EDITOR_SETTINGS }
    toast.info('Editor settings reset to defaults')
  } catch {
    toast.error('Failed to reset')
  }
}
</script>

<template>
  <ModalShell :open="open" modal-id="modal-settings" title="Settings" @close="emit('close')">
    <div class="tabs__bar" role="tablist" aria-label="Settings categories">
      <button
        v-for="t in settingsTabs"
        :id="`settings__tab--${t.key}`"
        :key="t.key"
        type="button"
        role="tab"
        class="tabs__tab"
        :class="{ 'flag--active': activeTab === t.key }"
        :aria-selected="activeTab === t.key"
        :aria-controls="`settings__panel--${t.key}`"
        @click="activeTab = t.key"
      >
        {{ t.label }}
      </button>
    </div>

    <div
      v-show="activeTab === 'canvas'"
      id="settings__panel--canvas"
      class="settings__panel form__col"
      role="tabpanel"
      aria-labelledby="settings__tab--canvas"
    >
      <div class="form__col form--section">
        <div>Canvas Size</div>
        <div class="form__row form--start form--wrap">
          <div class="form__col">
            <label for="canvas__width">Width</label>
            <input id="canvas__width" v-model.number="widthInput" type="number" min="100" step="25" :max="maxCanvasWidth" :disabled="contentLocked" />
          </div>
          <div class="form__col">
            <label for="canvas__height">Height</label>
            <input id="canvas__height" v-model.number="heightInput" type="number" min="100" step="25" :max="maxCanvasHeight" :disabled="contentLocked" />
          </div>
          <div class="form__col">
            <label for="canvas__tile">Tile</label>
            <input id="canvas__tile" v-model.number="tileInput" type="number" min="5" step="5" :max="CANVAS_FIELD_SPECS.tileSize.max" :disabled="contentLocked" />
          </div>
          <button
            class="flag--active size--fit settings__apply--bottom"
            :disabled="pending || contentLocked"
            aria-label="Apply canvas size"
            @click="applyCanvasSize"
          >
            Apply
          </button>
        </div>
        <div v-if="contentLocked" class="form__hint">Locked while content exists - remove all objects, NPC spawn zones and painted wall/door tiles first.</div>
        <div v-else class="form__hint">Re-snaps all objects to the new grid. Max {{ MAX_GRID_COLUMNS }} x {{ MAX_GRID_ROWS }} tiles.</div>
      </div>

      <div class="form__col form--section">
        <div>Background</div>
        <div class="form__row">
          <label for="canvas__bgcolor">Color</label>
          <ColorInput
            v-model="bgColorInput"
            :allow-transparent="true"
            placeholder="#RRGGBB or transparent"
            aria-label="Canvas background color"
            @commit="applyCanvasBgColor"
          />
        </div>
        <div class="form__hint">Hex or 'transparent'.</div>
      </div>

      <div class="form__col form--section">
        <div>Labels</div>
        <div class="form__row">
          <label for="canvas__labelcolor">Color</label>
          <ColorInput
            v-model="labelColorInput"
            allow-transparent
            placeholder="#RRGGBB (empty = theme default)"
            aria-label="Object label color"
            @commit="applyLabelColor"
          />
        </div>
        <div class="form__hint">Color for all object labels.</div>
      </div>

      <div class="form__col form--section">
        <div>Walls</div>
        <div class="form__row">
          <label for="canvas__wallcolor">Color</label>
          <ColorInput
            v-model="wallColorInput"
            allow-transparent
            placeholder="#RRGGBB (empty = theme default)"
            aria-label="Wall tile color"
            @commit="applyWallColor"
          />
        </div>
        <div class="form__hint">Color for wall tiles.</div>
      </div>

      <div class="form__col form--section">
        <div>Grid</div>
        <div class="form__row">
          <label for="canvas__gridcolor">Line color</label>
          <ColorInput
            v-model="gridColorInput"
            allow-transparent
            placeholder="#RRGGBB (empty = theme default)"
            aria-label="Grid line color"
            @commit="applyGridColor"
          />
        </div>
        <div class="form__hint">Color for the canvas tile grid lines.</div>
      </div>

      <div class="form__col form--section">
        <div>Street</div>
        <div class="form__row">
          <label for="canvas__streetfloor">On floor</label>
          <select
            id="canvas__streetfloor"
            :value="store.state.layout.streetFloorId ?? ''"
            aria-label="Floor that displays the street ring"
            @change="applyStreetFloor(($event.target as HTMLSelectElement).value || null)"
          >
            <option value="">None</option>
            <option v-for="f in store.state.layout.floors" :key="f.id" :value="f.id">
              {{ f.label }} - {{ f.name }}
            </option>
          </select>
        </div>
        <div class="form__row">
          <label for="canvas__streetwidth">Ring</label>
          <select
            id="canvas__streetwidth"
            :value="store.state.layout.streetWidthTiles ?? ''"
            aria-label="Street ring width in tiles"
            @change="store.setStreetWidth(Number(($event.target as HTMLSelectElement).value) || null)"
          >
            <option value="">Default (8 tiles)</option>
            <option v-for="w in [5, 6, 7, 8, 9, 10, 11, 12]" :key="w" :value="w">{{ w }} tiles</option>
          </select>
        </div>
        <div class="form__row">
          <label for="canvas__streetsidewalkcolor">Sidewalk color</label>
          <ColorInput
            v-model="streetSidewalkColorInput"
            allow-transparent
            placeholder="#RRGGBB (empty = theme default)"
            aria-label="Street sidewalk color"
            @commit="applyStreetSidewalkColor"
          />
        </div>
        <div class="form__row">
          <label for="canvas__streetroadcolor">Road color</label>
          <ColorInput
            v-model="streetRoadColorInput"
            allow-transparent
            placeholder="#RRGGBB (empty = theme default)"
            aria-label="Street road color"
            @commit="applyStreetRoadColor"
          />
        </div>
        <div class="form__row">
          <label for="canvas__streetmarkingcolor">Lane marking color</label>
          <ColorInput
            v-model="streetMarkingColorInput"
            allow-transparent
            placeholder="#RRGGBB (empty = theme default)"
            aria-label="Street lane marking color"
            @commit="applyStreetMarkingColor"
          />
        </div>
        <div class="form__row">
          <label for="es__streetDashRatio">Dash ratio</label>
          <input
            id="es__streetDashRatio"
            v-model.number="draft.streetDashRatio"
            type="number"
            :min="fieldRange('streetDashRatio').min"
            :max="fieldRange('streetDashRatio').max"
            :step="0.01"
            @change="applyEditorField('streetDashRatio')"
          />
        </div>
        <div class="form__row">
          <label for="es__streetGapRatio">Gap ratio</label>
          <input
            id="es__streetGapRatio"
            v-model.number="draft.streetGapRatio"
            type="number"
            :min="fieldRange('streetGapRatio').min"
            :max="fieldRange('streetGapRatio').max"
            :step="0.01"
            @change="applyEditorField('streetGapRatio')"
          />
        </div>
        <div class="form__row">
          <label for="es__sidewalkTileRatio">Sidewalk tile ratio</label>
          <input
            id="es__sidewalkTileRatio"
            v-model.number="draft.sidewalkTileRatio"
            type="number"
            :min="fieldRange('sidewalkTileRatio').min"
            :max="fieldRange('sidewalkTileRatio').max"
            :step="0.01"
            @change="applyEditorField('sidewalkTileRatio')"
          />
        </div>
        <div class="form__hint">
          Ring width drives placement boundary and NPC walkable zone; ratios style dash/gap/sidewalk.
        </div>
      </div>
    </div>

    <div
      v-for="t in editorTabs"
      v-show="activeTab === t.key"
      :id="`settings__panel--${t.key}`"
      :key="t.key"
      class="settings__panel form__col"
      role="tabpanel"
      :aria-labelledby="`settings__tab--${t.key}`"
    >
      <template v-for="group in editorGroupsByTab[t.key]" :key="group.title">
        <div class="form__col form--section">
          <div>{{ group.title }}</div>
          <div v-for="field in group.fields" :key="field.key" class="form__row">
            <label :for="`es__${field.key}`">{{ field.label }}</label>
            <input
              :id="`es__${field.key}`"
              v-model.number="draft[field.key]"
              type="number"
              :min="fieldRange(field.key).min"
              :max="fieldRange(field.key).max"
              :step="field.step"
              @change="applyEditorField(field.key)"
            />
            <span
              v-if="field.preview === 'radius'"
              class="settings__dot"
              :style="{ width: radiusPreview(field.key) + 'px', height: radiusPreview(field.key) + 'px' }"
              aria-hidden="true"
            />
          </div>
          <div class="form__hint">{{ group.hint }}</div>
        </div>
      </template>
    </div>
    <template v-if="activeTab !== 'canvas'" #footer>
      <button
        class="flag--danger"
        :disabled="pending"
        aria-label="Reset all editor settings to defaults"
        @click="resetEditorAll"
      >
        Reset
      </button>
      <button
        class="flag--active"
        :disabled="pending || !isEditorDirty"
        aria-label="Apply all editor settings"
        @click="applyEditorAll"
      >
        Apply All
      </button>
    </template>
  </ModalShell>
</template>

<style scoped>
.settings__apply--bottom {
  margin-top: auto;
}

.settings__dot {
  flex-shrink: 0;
  border: 1px solid var(--border-dim);
  border-radius: 50%;
  background: var(--accent-primary);
}
</style>

<style>
.settings__panel {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
</style>

<style>
#modal-settings {
  width: min(94vw, 720px);
  max-height: calc(100vh - 32px);
}

#modal-settings .modal__body {
  overflow: hidden;
}
</style>
