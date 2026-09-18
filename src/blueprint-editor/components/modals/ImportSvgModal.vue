<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useAssetsStore } from '../../blueprintStore'
import { useToast } from '@/composables/useToast'
import { useAsyncAction } from '../../composables/useAsyncAction'
import { useCanvasDefaults } from '../../composables/useCanvasDefaults'
import { parseSvgViewBox } from '../../assets/assetUtils'
import { MAX_ASSET_TILES } from '../../limits'
import { useDebouncedCallback } from '@/composables/useDebounceFn'
import ModalShell from '../shell/ModalShell.vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (event: 'close'): void }>()

const store = useAssetsStore()
const toast = useToast()
const { pending, run } = useAsyncAction()
const { canvasTileSize } = useCanvasDefaults()

const svgName = ref('')
const svgW = ref(1)
const svgH = ref(1)
const svgContent = ref('')
const status = ref('')
const statusTone = ref<'' | 'warn' | 'fail'>('')

const oversized = computed(() => svgW.value > MAX_ASSET_TILES || svgH.value > MAX_ASSET_TILES)

const parseSvgContent = useDebouncedCallback((val: string) => {
  if (!val) return
  const vb = parseSvgViewBox(val)
  if (!vb) return
  svgW.value = Math.max(1, Math.round(vb.w / canvasTileSize.value))
  svgH.value = Math.max(1, Math.round(vb.h / canvasTileSize.value))
  if (oversized.value) {
    status.value = `SVG is too large - each side is capped at ${MAX_ASSET_TILES} tiles`
    statusTone.value = 'warn'
  } else if (statusTone.value === 'warn') {
    status.value = ''
    statusTone.value = ''
  }
}, 200)

watch(svgContent, (val) => parseSvgContent(val))

watch(
  () => props.open,
  (open) => {
    status.value = ''
    statusTone.value = ''
    if (!open) {
      svgName.value = ''
      svgContent.value = ''
      svgW.value = 1
      svgH.value = 1
    }
  },
)

async function submit() {
  if (!svgName.value.trim()) {
    status.value = 'Asset name cannot be empty'
    statusTone.value = 'warn'
    return
  }
  if (!svgContent.value.trim()) {
    status.value = 'SVG content cannot be empty'
    statusTone.value = 'warn'
    return
  }
  if (oversized.value) {
    status.value = `SVG is too large - each side is capped at ${MAX_ASSET_TILES} tiles`
    statusTone.value = 'warn'
    return
  }
  status.value = ''
  statusTone.value = ''
  const result = await run(() => store.addSvgAsset(svgName.value.trim(), svgW.value, svgH.value, svgContent.value))
  if (result) {
    toast.success('SVG asset imported')
    emit('close')
  } else {
    status.value = 'Failed to import SVG'
    statusTone.value = 'fail'
  }
}
</script>

<template>
  <ModalShell
    :open="open"
    modal-id="modal-import-svg"
    title="Import SVG Asset"
    :status="status"
    :status-tone="statusTone"
    @close="emit('close')"
  >
    <div class="form__col">
      <div class="form__row">
        <label for="importsvg__name">Asset name</label>
        <input
          id="importsvg__name"
          v-model="svgName"
          class="size--fill"
          placeholder="Asset name"
          aria-label="SVG asset name"
        />
      </div>
      <div class="form__row">
        <input
          class="size--fit"
          type="number"
          min="1"
          :max="MAX_ASSET_TILES"
          :value="svgW"
          disabled
          placeholder="W (auto)"
          aria-label="SVG width (auto)"
        />
        <span aria-hidden="true">x</span>
        <input
          class="size--fit"
          type="number"
          min="1"
          :max="MAX_ASSET_TILES"
          :value="svgH"
          disabled
          placeholder="H (auto)"
          aria-label="SVG height (auto)"
        />
      </div>
      <textarea
        v-model="svgContent"
        placeholder="Paste SVG here (must include viewBox)..."
        rows="6"
        aria-label="SVG content"
      ></textarea>
    </div>
    <template #footer>
      <button type="button" @click="emit('close')">Cancel</button>
      <button class="flag--active" type="button" :disabled="pending || oversized" @click="submit">Import SVG</button>
    </template>
  </ModalShell>
</template>

<style>
#modal-import-svg {
  width: min(94vw, 480px);
  max-height: calc(100vh - 32px);
}
</style>
