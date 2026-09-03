<script setup lang="ts">
import { computed, onMounted, ref, defineAsyncComponent } from 'vue'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { useAssetsStore } from '@/blueprint-editor/blueprintStore'
import ModalShell from '@/blueprint-editor/components/shell/ModalShell.vue'
import ColorInput from '@/blueprint-editor/components/inputs/ColorInput.vue'
import TagChip from '@/blueprint-editor/components/inputs/TagChip.vue'
import TagPicker from '@/blueprint-editor/components/inputs/TagPicker.vue'
import SearchInput from '@/blueprint-editor/components/inputs/SearchInput.vue'
import ToastContainer from '@/blueprint-editor/components/shell/ToastContainer.vue'
import ConfirmDialog from '@/components/overlays/ConfirmDialog.vue'
import ErrorBoundary from '@/components/overlays/ErrorBoundary.vue'

const AssetPickerModal = defineAsyncComponent(() => import('@/blueprint-editor/components/modals/AssetPickerModal.vue'))
const AssetEditModal = defineAsyncComponent(() => import('@/blueprint-editor/components/modals/AssetEditModal.vue'))
const FloorModal = defineAsyncComponent(() => import('@/blueprint-editor/components/modals/FloorModal.vue'))
const NpcManagerModal = defineAsyncComponent(() => import('@/blueprint-editor/components/modals/NpcManagerModal.vue'))
const DeployNpcModal = defineAsyncComponent(() => import('@/blueprint-editor/components/modals/DeployNpcModal.vue'))
const SettingsModal = defineAsyncComponent(() => import('@/blueprint-editor/components/modals/SettingsModal.vue'))
const ImportSvgModal = defineAsyncComponent(() => import('@/blueprint-editor/components/modals/ImportSvgModal.vue'))

const store = useAssetsStore()
const storeReady = ref(false)
const storeError = ref('')

onMounted(async () => {
  try {
    await store.reloadEditorData()
    storeReady.value = true
  } catch (e) {
    storeError.value = e instanceof Error ? e.message : String(e)
  }
})

const firstAsset = computed(() => store.assetMap().values().next().value)

const toast = useToast()
const { confirm } = useConfirm()

const showModal = ref(false)
const showFloating = ref(false)
const showPicker = ref(false)
const showAssetEdit = ref(false)
const showFloor = ref(false)
const showNpcManager = ref(false)
const showDeploy = ref(false)
const showSettings = ref(false)
const showImportSvg = ref(false)
const searchText = ref('')
const colorValue = ref('#3794ff')
const toggles = ref({ grid: true, labels: false })
const selectedCard = ref('a')
const pickerTags = ref<string[]>(['portal'])
const themeTokens = [
  '--bg-primary',
  '--bg-secondary',
  '--bg-tertiary',
  '--text-primary',
  '--text-secondary',
  '--text-dim',
  '--text-bright',
  '--border-dim',
  '--accent-primary',
  '--accent-blue',
  '--accent-green',
  '--accent-gold',
  '--accent-red',
  '--street-sidewalk',
  '--street-road',
  '--street-marking',
]
const boomArmed = ref(false)
const boom = computed(() => {
  if (boomArmed.value) throw new Error('demo render error caught by ErrorBoundary')
  return 'no error'
})

async function onConfirm() {
  const ok = await confirm({
    title: 'Confirm action',
    message: 'This is how the confirm dialog looks.',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
  })
  if (ok) toast.success('Confirmed')
}

function backToEditor() {
  window.location.assign('/')
}
</script>

<template>
  <div class="showcase">
    <header class="showcase__header">
      <h1>UI Showcase</h1>
      <p>Every primitive and wrapper used in this project - real classes, real components.</p>
      <button @click="backToEditor">Back to editor</button>
    </header>

    <section class="showcase__section">
      <h2>Buttons</h2>
      <div class="showcase__row">
        <button>Default</button>
        <button class="flag--active">flag--active</button>
        <button class="flag--success">flag--success</button>
        <button class="flag--danger">flag--danger</button>
        <button class="flag--warning">flag--warning</button>
        <button class="flag--dashed">flag--dashed</button>
        <button disabled>Disabled</button>
      </div>
      <div class="showcase__row">
        <button class="size--fit">size--fit</button>
        <button class="size--fill">size--fill</button>
      </div>
    </section>

    <section class="showcase__section">
      <h2>Inputs</h2>
      <div class="form__col">
        <div class="form__field">
          <label>Text</label>
          <input v-model="searchText" type="text" placeholder="field-sizing: content" />
        </div>
        <div class="form__field">
          <label>Number</label>
          <input type="number" min="0" max="100" :value="42" />
        </div>
        <div class="form__field">
          <label>Select</label>
          <select>
            <option>Option A</option>
            <option>Option B</option>
          </select>
        </div>
        <div class="form__field">
          <label>Textarea</label>
          <textarea rows="3" placeholder="textarea"></textarea>
        </div>
        <div class="form__row">
          <label class="form__group"><input type="checkbox" checked /> Checkbox on</label>
          <label class="form__group"><input type="checkbox" /> Checkbox off</label>
          <label class="form__group"><input type="radio" name="r" checked /> Radio on</label>
          <label class="form__group"><input type="radio" name="r" /> Radio off</label>
          <label class="form__group"><input type="range" /> Range</label>
        </div>
        <div class="form__field">
          <label>ColorInput</label>
          <ColorInput v-model="colorValue" allow-transparent />
        </div>
        <div class="form__field">
          <label>form__enter (input + button)</label>
          <div class="form__enter">
            <input v-model="searchText" class="size--fill" type="text" placeholder="search" />
            <button>Clear</button>
          </div>
        </div>
        <div class="form__field">
          <label>SearchInput (debounce consumer, clear + slot button)</label>
          <SearchInput v-model="searchText" placeholder="Search assets..." label="Search">
            <button>Go</button>
          </SearchInput>
        </div>
      </div>
    </section>

    <section class="showcase__section">
      <h2>Form structure</h2>
      <div class="form__col">
        <div class="form__header">form__header</div>
        <div class="form__title">form__title</div>
        <div class="form__grid">
          <div class="form__field"><label>form__grid cell A</label><input type="text" /></div>
          <div class="form__field"><label>form__grid cell B</label><input type="text" /></div>
        </div>
        <div class="form__group">
          <label>form__group label</label>
          <input type="text" value="group content" />
        </div>
        <div class="form__group form__enter">
          <input type="text" value="copyable-id" disabled title="Copy ID" />
          <button>Copy</button>
        </div>
        <div class="form__row">
          <span class="form__hint">form__hint inside form__row</span>
        </div>
        <div class="form__row form__row--wrap">
          <span class="card__item">wrap A</span>
          <span class="card__item">wrap B</span>
          <span class="card__item">wrap C</span>
          <span class="form__hint">form__row--wrap</span>
        </div>
        <div class="form__row">
          <span class="form__name truncate">form__name - flexible truncated label</span><span class="badge">3</span>
        </div>
        <div class="form__split">
          <div class="card size--stretch">form__split A</div>
          <div class="card size--stretch">form__split B</div>
        </div>
        <div class="form__row--border">
          <span class="form__hint">form__row--border</span>
        </div>
        <div class="empty">.empty - empty state text</div>
      </div>
    </section>

    <section class="showcase__section">
      <h2>Theme tokens</h2>
      <div class="form__row form__row--wrap">
        <span v-for="t in themeTokens" :key="t" class="form__field">
          <span class="swatch" :style="{ background: `var(${t})` }" />
          <span class="form__hint">{{ t }}</span>
        </span>
      </div>
    </section>

    <section class="showcase__section">
      <h2>Keyboard shortcuts</h2>
      <div class="form__col">
        <div class="form__field"><span class="badge">Del</span><span class="form__hint">Delete selection (confirms)</span></div>
        <div class="form__field"><span class="badge">R</span><span class="form__hint">Rotate selected object</span></div>
        <div class="form__field"><span class="badge">Arrows</span><span class="form__hint">Nudge 1 tile (Shift: 10)</span></div>
        <div class="form__field"><span class="badge">Space</span><span class="form__hint">Pan canvas</span></div>
        <div class="form__field"><span class="badge">Esc</span><span class="form__hint">Cancel draw/drag, deselect</span></div>
        <div class="form__field"><span class="badge">Ctrl+L</span><span class="form__hint">Link objects / Shift: unlink</span></div>
        <div class="form__field"><span class="badge">Ctrl+C/V</span><span class="form__hint">Copy / paste objects</span></div>
        <div class="form__field"><span class="badge">L</span><span class="form__hint">Toggle object lock</span></div>
        <div class="form__field"><span class="badge">Ctrl+0</span><span class="form__hint">Fit to screen (+/- zoom)</span></div>
      </div>
    </section>

    <section class="showcase__section">
      <h2>Cards / Badge / Swatch</h2>
      <div class="form__row">
        <span class="card__item"
          >card__item <button class="card__item--remove" aria-label="Remove">x</button></span
        >
        <span class="card__item flag--active">card__item flag--active</span>
        <span class="badge">badge</span>
        <span class="badge flag--success">badge flag--success</span>
        <span class="swatch" />
        <span class="truncate showcase__truncate">truncate - long text gets ellipsis</span>
      </div>
      <div class="form__col">
        <div class="card">card - container</div>
        <div class="card__item">
          <span class="truncate">card__item - list entry A</span><span class="badge">2</span>
        </div>
        <div class="card__item">
          <span class="truncate">card__item - list entry B</span><span class="badge">0</span>
        </div>
      </div>
      <div class="form__row">
        <span
          class="card__item"
          :class="{ 'flag--active': selectedCard === 'a' }"
          role="button"
          @click="selectedCard = 'a'"
        >
          selectable A
        </span>
        <span
          class="card__item"
          :class="{ 'flag--active': selectedCard === 'b' }"
          role="button"
          @click="selectedCard = 'b'"
        >
          selectable B
        </span>
      </div>
    </section>

    <section class="showcase__section">
      <h2>Tabs bar</h2>
      <div class="tabs__bar" role="tablist">
        <button
          type="button"
          role="tab"
          class="tabs__tab"
          :class="{ 'flag--active': toggles.grid }"
          @click="toggles.grid = !toggles.grid"
        >
          Tab A
        </button>
        <button
          type="button"
          role="tab"
          class="tabs__tab"
          :class="{ 'flag--active': toggles.labels }"
          @click="toggles.labels = !toggles.labels"
        >
          Tab B
        </button>
        <button type="button" role="tab" class="tabs__tab">Tab C</button>
      </div>
    </section>

    <section class="showcase__section">
      <h2>Tag components</h2>
      <div class="form__row">
        <TagChip label="portal" />
        <TagChip label="seat" variant="focus" />
        <TagChip label="locked" variant="restricted" removable />
      </div>
      <div class="form__field">
        <label>TagPicker</label>
        <TagPicker v-model="pickerTags" />
      </div>
    </section>

    <section class="showcase__section">
      <h2>Modal mockups (real components, live editor data)</h2>
      <p class="form__hint">
        Same components the editor uses, mounted standalone with reloadEditorData(). Changes made here write to the real
        blueprint data files - use for visual inspection, not editing.
      </p>
      <div v-if="storeError" class="showcase__row">
        <span class="badge flag--danger">store load failed: {{ storeError }}</span>
      </div>
      <div class="showcase__row">
        <button :disabled="!storeReady" @click="showPicker = true">AssetPickerModal</button>
        <button :disabled="!storeReady || !firstAsset" @click="showAssetEdit = true">AssetEditModal</button>
        <button :disabled="!storeReady" @click="showFloor = true">FloorModal</button>
        <button :disabled="!storeReady" @click="showNpcManager = true">NpcManagerModal</button>
        <button :disabled="!storeReady" @click="showDeploy = true">DeployNpcModal</button>
        <button :disabled="!storeReady" @click="showSettings = true">SettingsModal</button>
        <button :disabled="!storeReady" @click="showImportSvg = true">ImportSvgModal</button>
      </div>
    </section>

    <section class="showcase__section">
      <h2>ErrorBoundary</h2>
      <div class="form__row">
        <button class="flag--danger" @click="boomArmed = !boomArmed">
          {{ boomArmed ? 'Disarm render error' : 'Trigger render error' }}
        </button>
        <ErrorBoundary>
          <span>{{ boom }}</span>
        </ErrorBoundary>
      </div>
    </section>

    <section class="showcase__section">
      <h2>Overlays (live)</h2>
      <div class="showcase__row">
        <button @click="showModal = true">Open Modal</button>
        <button @click="showFloating = true">Open Floating</button>
        <button @click="onConfirm">Open Confirm</button>
        <button @click="toast.success('Success toast')">Toast success</button>
        <button @click="toast.error('Error toast')">Toast error</button>
        <button @click="toast.info('Info toast')">Toast info</button>
      </div>
    </section>

    <ModalShell :open="showModal" modal-id="showcase-modal" title="ModalShell sample" @close="showModal = false">
      <div class="form__col">
        <div class="form__hint">modal__header / modal__body / modal__footer from ModalShell</div>
        <div class="form__field">
          <label>Inside body</label>
          <input type="text" value="input inside modal" />
        </div>
      </div>
      <template #footer>
        <button @click="showModal = false">Cancel</button>
        <button class="flag--active" @click="showModal = false">Apply</button>
      </template>
    </ModalShell>

    <ModalShell
      :open="showFloating"
      modal-id="showcase-floating"
      title="Floating"
      floating
      @close="showFloating = false"
    >
      <div class="form__hint">floating modal - overlay is click-through</div>
    </ModalShell>

    <ToastContainer />
    <ConfirmDialog />

    <ErrorBoundary>
      <AssetPickerModal :open="showPicker" @close="showPicker = false" />
      <AssetEditModal :open="showAssetEdit" :asset="firstAsset" @close="showAssetEdit = false" />
      <FloorModal :open="showFloor" @close="showFloor = false" />
      <NpcManagerModal :open="showNpcManager" @close="showNpcManager = false" />
      <DeployNpcModal :open="showDeploy" @close="showDeploy = false" />
      <SettingsModal :open="showSettings" @close="showSettings = false" />
      <ImportSvgModal :open="showImportSvg" @close="showImportSvg = false" />
    </ErrorBoundary>
  </div>
</template>

<style scoped>
.showcase {
  height: 100vh;
  padding: var(--gap-xl);
  display: flex;
  flex-direction: column;
  gap: var(--gap-md);
  background: var(--bg-primary);
  overflow-y: scroll;
}

.showcase__header h1 {
  font-size: var(--font-xl);
}

.showcase__header p {
  color: var(--text-secondary);
}

.showcase__section {
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-md);
  padding: var(--gap-md);
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
}

.showcase__section h2 {
  font-size: var(--font-md);
  color: var(--text-secondary);
}

.showcase__row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--gap-sm);
}

.showcase__truncate {
  width: 120px;
}
</style>
