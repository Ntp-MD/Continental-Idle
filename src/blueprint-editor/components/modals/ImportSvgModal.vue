<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAssetsStore } from '../../blueprintStore'
import { useToast } from '@/composables/useToast'
import { useAsyncAction } from '../../composables/useAsyncAction'
import { useCanvasDefaults } from '../../composables/useCanvasDefaults'
import { parseSvgViewBox } from '../../assets/assetUtils'
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

const parseSvgContent = useDebouncedCallback((val: string) => {
  if (!val) return
  const vb = parseSvgViewBox(val)
  if (!vb) return
  svgW.value = Math.max(1, Math.round(vb.w / canvasTileSize.value))
  svgH.value = Math.max(1, Math.round(vb.h / canvasTileSize.value))
}, 200)

watch(svgContent, (val) => parseSvgContent(val))

watch(
  () => props.open,
  (open) => {
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
    toast.warning('Asset name cannot be empty')
    return
  }
  if (!svgContent.value.trim()) {
    toast.warning('SVG content cannot be empty')
    return
  }
  const result = await run(() => store.addSvgAsset(svgName.value.trim(), svgW.value, svgH.value, svgContent.value))
  if (result) {
    toast.success('SVG asset imported')
    emit('close')
  }
}
</script>

<template>
  <ModalShell :open="open" modal-id="modal-import-svg" title="Import SVG Asset" @close="emit('close')">
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
      <button class="flag--active size--fill" :disabled="pending" @click="submit">Import SVG</button>
    </div>
  </ModalShell>
</template>

<style>
#modal-import-svg {
  width: min(94vw, 480px);
  max-height: calc(100vh - 32px);
}
</style>
