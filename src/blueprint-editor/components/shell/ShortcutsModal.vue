<script setup lang="ts">
import ModalShell from './ModalShell.vue'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const shortcuts: { keys: string; label: string }[] = [
  { keys: 'Del', label: 'Delete selection (confirms)' },
  { keys: 'R', label: 'Rotate selected object' },
  { keys: 'Arrows', label: 'Nudge 1 tile (Shift: 10)' },
  { keys: 'Space', label: 'Pan canvas' },
  { keys: 'Esc', label: 'Cancel draw/drag, deselect, close dialogs' },
  { keys: 'Ctrl+Z', label: 'Undo last change (up to 4)' },
  { keys: 'Ctrl+L', label: 'Link objects / Shift: unlink' },
  { keys: 'Ctrl+C/V', label: 'Copy / paste objects' },
  { keys: 'L', label: 'Toggle object lock' },
  { keys: 'Ctrl+0', label: 'Fit to screen (+/- zoom)' },
]
</script>

<template>
  <ModalShell :open="open" modal-id="modal-shortcuts" title="Keyboard Shortcuts" @close="emit('close')">
    <div class="form__col">
      <div v-for="s in shortcuts" :key="s.keys" class="form__row">
        <span class="badge">{{ s.keys }}</span>
        <span class="form__hint">{{ s.label }}</span>
      </div>
    </div>
    <template #footer>
      <div class="form__row">
        <button type="button" @click="emit('close')">Close</button>
      </div>
    </template>
  </ModalShell>
</template>

<style>
#modal-shortcuts {
  width: min(94vw, 420px);
  max-height: calc(100vh - 32px);
}
</style>
