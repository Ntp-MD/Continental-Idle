<script setup lang="ts">
import { ref, watch } from "vue";
import { useAssetsStore } from "../blueprintStore";
import { useToast } from "@/composables/useToast";
import { useConfirm } from "@/composables/useConfirm";
import { useAsyncAction } from "../composables/useAsyncAction";
import { DEFAULT_EDITOR_SETTINGS, EDITOR_FIELD_SPECS } from "../types";
import type { EditorSettings } from "../types";
import { useCanvasDefaults } from "../composables/useCanvasDefaults";
import ModalShell from "./ModalShell.vue";
import ColorInput from "./ColorInput.vue";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: "close"): void }>();

const store = useAssetsStore();
const toast = useToast();
const confirm = useConfirm().confirm;
const { pending, run } = useAsyncAction();

const widthInput = ref(store.state.layout.canvas.width);
const heightInput = ref(store.state.layout.canvas.height);
const tileInput = ref(store.state.layout.canvas.tileSize);
const bgColorInput = ref(store.state.layout.canvas.bgColor);
const labelColorInput = ref(store.state.layout.canvas.labelColor);
const wallColorInput = ref(store.state.layout.canvas.wallColor);
const wallThicknessInput = ref<number | undefined>(store.state.layout.canvas.wallThickness);

watch(
  () => [props.open, store.state.layout.canvas] as const,
  ([open, c]) => {
    if (open) {
      widthInput.value = c.width;
      heightInput.value = c.height;
      tileInput.value = c.tileSize;
      bgColorInput.value = c.bgColor;
      labelColorInput.value = c.labelColor;
      wallColorInput.value = c.wallColor;
      wallThicknessInput.value = c.wallThickness;
    }
  },
  { immediate: true },
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

async function applyLabelColor(value: string | undefined) {
  try {
    const saved = await run(() => store.setCanvasLabelColor(value));
    if (!saved) toast.error("Failed to set label color");
  } catch {
    toast.error("Failed to set label color");
  }
}

async function applyWallColor(value: string | undefined) {
  try {
    const saved = await run(() => store.setWallColor(value));
    if (!saved) {
      toast.error("Failed to set wall color");
      return;
    }
    toast.success(value ? `Wall color saved: ${value}` : "Wall color reset to default");
  } catch {
    toast.error("Failed to set wall color");
  }
}

function onWallColorInvalid(value: string) {
  toast.error(`"${value}" is not a valid color - use #RRGGBB`);
}

async function applyWallThickness() {
  const value = typeof wallThicknessInput.value === "number" && wallThicknessInput.value > 0 ? Math.round(wallThicknessInput.value) : null;
  try {
    const saved = await run(() => store.setWallThickness(value));
    if (!saved) toast.error("Wall thickness must be 1-10");
  } catch {
    toast.error("Failed to set wall thickness");
  }
}

async function applyStreetFloor(floorId: string | null) {
  try {
    const saved = await run(() => store.setStreetFloor(floorId));
    if (!saved) toast.error("Failed to update street floor");
  } catch {
    toast.error("Failed to update street floor");
  }
}

const { editorSettings: currentEditor } = useCanvasDefaults();
const draft = ref<EditorSettings>({ ...DEFAULT_EDITOR_SETTINGS });

watch(
  () => [props.open, currentEditor.value] as const,
  ([open]) => {
    if (open) draft.value = { ...currentEditor.value };
  },
  { immediate: true },
);

type FieldKey = keyof EditorSettings;
interface FieldDef {
  key: FieldKey;
  label: string;
  step: number;
}

const editorGroups: { title: string; hint: string; fields: FieldDef[] }[] = [
  {
    title: "Hit Testing",
    hint: "Tolerances for clicking walls, dragging objects, cycling overlapping items, and box selection.",
    fields: [
      { key: "wallHitTolerancePx", label: "Wall hit px", step: 1 },
      { key: "wallHitToleranceTileRatio", label: "Wall hit tile ratio", step: 0.01 },
      { key: "dragThresholdPx", label: "Drag threshold px", step: 0.5 },
      { key: "cycleThresholdPx", label: "Cycle threshold px", step: 0.5 },
      { key: "boxSelectThresholdPx", label: "Box select px", step: 0.5 },
    ],
  },
  {
    title: "Overlay Sizes",
    hint: "Radius of interact spot dots and lock indicator circles.",
    fields: [
      { key: "interactSpotRadiusPx", label: "Interact spot radius", step: 0.5 },
      { key: "lockIndicatorRadiusPx", label: "Lock indicator radius", step: 0.5 },
    ],
  },
  {
    title: "Font Sizes",
    hint: "Text sizes for labels, indicators, zone labels, empty state, and ruler ticks. Scaled by 1/zoom at render time.",
    fields: [
      { key: "labelFontSizePx", label: "Object label", step: 0.5 },
      { key: "lockLabelFontSizePx", label: "Lock label", step: 0.5 },
      { key: "interactSpotFontSizePx", label: "Interact spot label", step: 0.5 },
      { key: "zoneLabelFontSizePx", label: "Zone label", step: 0.5 },
      { key: "emptyStateFontSizePx", label: "Empty state", step: 1 },
      { key: "rulerTickFontSizePx", label: "Ruler tick", step: 0.5 },
    ],
  },
  {
    title: "Street",
    hint: "Dash/gap ratios relative to tileSize, and sidewalk width as a fraction of street ring tiles.",
    fields: [
      { key: "streetDashRatio", label: "Dash ratio", step: 0.01 },
      { key: "streetGapRatio", label: "Gap ratio", step: 0.01 },
      { key: "sidewalkTileRatio", label: "Sidewalk tile ratio", step: 0.01 },
    ],
  },
  {
    title: "Ruler",
    hint: "Ruler bar size clamps relative to zoom (sqrt scaling).",
    fields: [
      { key: "rulerMinPx", label: "Min px", step: 1 },
      { key: "rulerMaxPx", label: "Max px", step: 1 },
      { key: "rulerBasePx", label: "Base px", step: 1 },
    ],
  },
  {
    title: "Wall",
    hint: "Wall thickness as a fraction of tileSize (used when canvas.wallThickness is not set).",
    fields: [{ key: "wallThicknessRatio", label: "Thickness ratio", step: 0.01 }],
  },
  {
    title: "Walkable Grid Editor",
    hint: "Tile size constraints for the WalkableGridEditor modal display.",
    fields: [
      { key: "walkableGridMinTilePx", label: "Min tile px", step: 1 },
      { key: "walkableGridMaxTilePx", label: "Max tile px", step: 1 },
      { key: "walkableGridMaxWidthPx", label: "Max width px", step: 10 },
      { key: "walkableGridMaxHeightPx", label: "Max height px", step: 10 },
    ],
  },
];

function fieldRange(key: FieldKey) {
  const spec = EDITOR_FIELD_SPECS[key];
  return { min: spec.min, max: spec.max };
}

function isEditorDirty(): boolean {
  const c = currentEditor.value;
  return (Object.keys(c) as FieldKey[]).some((k) => draft.value[k] !== c[k]);
}

async function applyEditorField(key: FieldKey) {
  const range = fieldRange(key);
  const v = draft.value[key];
  if (typeof v !== "number" || !Number.isFinite(v)) {
    toast.error("Invalid value");
    draft.value[key] = currentEditor.value[key];
    return;
  }
  if (range.min !== undefined && v < range.min) {
    toast.error(`Value must be >= ${range.min}`);
    draft.value[key] = currentEditor.value[key];
    return;
  }
  if (range.max !== undefined && v > range.max) {
    toast.error(`Value must be <= ${range.max}`);
    draft.value[key] = currentEditor.value[key];
    return;
  }
  try {
    const saved = await run(() => store.setEditorSettings({ [key]: v }));
    if (!saved) toast.error("Failed to save setting");
  } catch {
    toast.error("Failed to save setting");
  }
}

async function applyEditorAll() {
  const c = currentEditor.value;
  const patch: Partial<EditorSettings> = {};
  for (const key of Object.keys(c) as FieldKey[]) {
    if (draft.value[key] !== c[key]) patch[key] = draft.value[key];
  }
  if (Object.keys(patch).length === 0) return;
  try {
    const saved = await run(() => store.setEditorSettings(patch));
    if (!saved) {
      toast.error("Some values out of range");
      return;
    }
    toast.success("Editor settings saved");
  } catch {
    toast.error("Failed to save editor settings");
  }
}

async function resetEditorAll() {
  const ok = await confirm({
    title: "Reset editor settings",
    message: "Reset all editor settings to defaults? This cannot be undone.",
    confirmLabel: "Reset",
    cancelLabel: "Cancel",
    danger: true,
  });
  if (!ok) return;
  try {
    const saved = await run(() => store.resetEditorSettings());
    if (!saved) {
      toast.error("Failed to reset");
      return;
    }
    draft.value = { ...DEFAULT_EDITOR_SETTINGS };
    toast.info("Editor settings reset to defaults");
  } catch {
    toast.error("Failed to reset");
  }
}
</script>

<template>
  <ModalShell :open="open" title="Settings" dialog-class="settings__dialog" @close="emit('close')">
    <div class="modal__body settings__body">
      <div class="settings__columns">
        <div class="settings__column">
          <div class="settings__heading">Canvas</div>
          <div class="form__group">
            <div class="form__title">Canvas Size</div>
            <div class="form__row form__row--pair">
              <div class="form__row">
                <label for="canvas__width">Width</label>
                <input id="canvas__width" v-model.number="widthInput" type="number" min="100" step="25" />
              </div>
              <div class="form__row">
                <label for="canvas__height">Height</label>
                <input id="canvas__height" v-model.number="heightInput" type="number" min="100" step="25" />
              </div>
              <div class="form__row">
                <label for="canvas__tile">Tile</label>
                <input id="canvas__tile" v-model.number="tileInput" type="number" min="5" step="5" />
              </div>
            </div>
            <button class="flag--active" :disabled="pending" aria-label="Apply canvas size" @click="applyCanvasSize">Apply</button>
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
            <div class="form__title">Labels</div>
            <div class="form__row">
              <label for="canvas__labelcolor">Color</label>
              <ColorInput v-model="labelColorInput" allow-transparent placeholder="#RRGGBB (empty = theme default)" aria-label="Object label color" @commit="applyLabelColor" />
            </div>
            <div class="form__hint">One color for every object label on the canvas.</div>
          </div>
          <div class="form__group">
            <div class="form__title">Walls</div>
            <div class="form__row form__row--pair">
              <div class="form__row">
                <label>Color</label>
                <ColorInput v-model="wallColorInput" placeholder="#RRGGBB (empty = theme green)" aria-label="Wall line color" @commit="applyWallColor" @commit-invalid="onWallColorInvalid" />
              </div>
              <div class="form__row">
                <label for="canvas__wallthickness">Thickness</label>
                <input id="canvas__wallthickness" v-model.number="wallThicknessInput" type="number" min="1" max="10" step="1" :placeholder="'3'" @change="applyWallThickness" />
              </div>
            </div>
            <div class="form__hint">Line style for painted floor walls and the building boundary. Thickness overrides the Editor ratio.</div>
          </div>
          <div class="form__group">
            <div class="form__title">Street</div>
            <div class="form__row form__row--pair">
              <div class="form__row">
                <label for="canvas__streetfloor">On floor</label>
                <select id="canvas__streetfloor" :value="store.state.layout.streetFloorId ?? ''" aria-label="Floor that displays the street ring" @change="applyStreetFloor(($event.target as HTMLSelectElement).value || null)">
                  <option value="">None</option>
                  <option v-for="f in store.state.layout.floors" :key="f.id" :value="f.id">{{ f.label }} - {{ f.name }}</option>
                </select>
              </div>
              <div class="form__row">
                <label for="canvas__streetwidth">Ring</label>
                <select id="canvas__streetwidth" :value="store.state.layout.streetWidthTiles ?? ''" aria-label="Street ring width in tiles" @change="store.setStreetWidth(Number(($event.target as HTMLSelectElement).value) || null)">
                  <option value="">Default (8 tiles)</option>
                  <option v-for="w in [5, 6, 7, 8, 9, 10, 11, 12]" :key="w" :value="w">{{ w }} tiles</option>
                </select>
              </div>
            </div>
            <div class="form__hint">Street ring renders on one floor; ring width drives placement boundary, NPC walkable zone and the drawn road.</div>
          </div>
        </div>

        <div class="settings__column">
          <div class="settings__heading">Editor</div>
          <div v-for="group in editorGroups" :key="group.title" class="form__group">
            <div class="form__title">{{ group.title }}</div>
            <div class="form__row form__row--pair">
              <div v-for="field in group.fields" :key="field.key" class="form__row">
                <label :for="`es__${field.key}`">{{ field.label }}</label>
                <input :id="`es__${field.key}`" v-model.number="draft[field.key]" type="number" :min="fieldRange(field.key).min" :max="fieldRange(field.key).max" :step="field.step" @change="applyEditorField(field.key)" />
              </div>
            </div>
            <div class="form__hint">{{ group.hint }}</div>
          </div>
          <div class="form__row form__row--border">
            <button class="flag--danger" :disabled="pending" aria-label="Reset all editor settings to defaults" @click="resetEditorAll">Reset</button>
            <button class="flag--active" :disabled="pending || !isEditorDirty()" aria-label="Apply all editor settings" @click="applyEditorAll">Apply All</button>
          </div>
        </div>
      </div>
    </div>
  </ModalShell>
</template>

<style scoped>
:deep(.settings__dialog) {
  width: min(94vw, 1000px);
  max-width: 1000px;
  max-height: calc(100vh - 100px);
}
.settings__body {
  padding: var(--gap-md);
  overflow-y: auto;
}
.settings__columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--gap-lg);
  align-items: start;
}
.settings__column {
  display: flex;
  flex-direction: column;
  gap: var(--gap-md);
  min-width: 0;
}
.settings__heading {
  font-size: var(--font-md);
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-dim);
  padding-bottom: var(--gap-xs);
}
@media (max-width: 640px) {
  .settings__columns {
    grid-template-columns: 1fr;
  }
}
</style>
