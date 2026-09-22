<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAssetsStore, serializeWorkspace, parseWorkspace } from '../../blueprintStore'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { useAsyncAction } from '../../composables/useAsyncAction'
import ModalShell from '../shell/ModalShell.vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const store = useAssetsStore()
const toast = useToast()
const confirm = useConfirm().confirm
const { pending, run } = useAsyncAction()

const status = ref('')
const statusTone = ref<'' | 'success' | 'warn' | 'fail'>('')
const fileInput = ref<HTMLInputElement | null>(null)
const fileName = ref('')

watch(
  () => props.open,
  (open) => {
    if (open) {
      status.value = ''
      statusTone.value = ''
    }
  },
)

function onExport() {
  try {
    const text = serializeWorkspace(store.exportWorkspace())
    const blob = new Blob([text], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `blueprint-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    status.value = 'Workspace exported'
    statusTone.value = 'success'
  } catch (error) {
    status.value = error instanceof Error ? error.message : 'Export failed'
    statusTone.value = 'fail'
  }
}

async function onImportFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  fileName.value = file.name
  const ok = await confirm({
    title: 'Import workspace',
    message: `Replace the current workspace with "${file.name}"? This cannot be undone.`,
    confirmLabel: 'Import',
    cancelLabel: 'Cancel',
    danger: true,
  })
  if (!ok) return
  try {
    const parsed = parseWorkspace(await file.text())
    const saved = await run(() => store.importWorkspace(parsed))
    if (!saved) {
      status.value = 'Failed to save the imported workspace'
      statusTone.value = 'fail'
      return
    }
    status.value = 'Workspace imported'
    statusTone.value = 'success'
    toast.success('Workspace imported')
  } catch (error) {
    status.value = error instanceof Error ? error.message : 'Import failed'
    statusTone.value = 'fail'
  }
}
</script>

<template>
  <ModalShell
    :open="open"
    modal-id="modal-workspace"
    title="Workspace (Export / Import)"
    :status="status"
    :status-tone="statusTone"
    @close="emit('close')"
  >
    <div class="form__header">
      <span class="size--stretch form__hint">One JSON file holds the whole workspace.</span>
      <span v-if="fileName" class="badge truncate" :title="fileName">{{ fileName }}</span>
    </div>
    <div class="form__col">
      <div class="card form__col">
        <div>Import</div>
        <div class="form__hint">Replace the current workspace with a previously exported file.</div>
        <input
          ref="fileInput"
          class="workspace__file"
          type="file"
          accept="application/json,.json"
          aria-label="Workspace file"
          @change="onImportFile"
        />
        <button
          class="flag--warning size--fill"
          type="button"
          aria-label="Import workspace"
          :disabled="pending"
          @click="fileInput?.click()"
        >
          Import
        </button>
      </div>
      <div class="card form__col">
        <div>Export</div>
        <div class="form__hint">Download the current workspace as a single JSON file.</div>
        <button class="flag--active size--fill" type="button" aria-label="Export workspace" @click="onExport">
          Export
        </button>
      </div>
    </div>
    <template #footer>
      <div class="form__row">
        <button type="button" @click="emit('close')">Close</button>
      </div>
    </template>
  </ModalShell>
</template>

<style scoped>
.workspace__file {
  display: none;
}
</style>

<style>
#modal-workspace {
  width: min(94vw, 560px);
  max-height: calc(100vh - 32px);
}
</style>
