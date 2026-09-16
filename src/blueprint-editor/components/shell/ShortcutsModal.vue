<script setup lang="ts">
import ModalShell from './ModalShell.vue'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const shortcuts: { keys: string; label: string }[] = [
  { keys: 'Del', label: 'Delete selection (confirms)' },
  { keys: 'R', label: 'Rotate selected object' },
  { keys: 'Arrows', label: 'Nudge 1 tile (Shift: 10)' },
  { keys: 'Space', label: 'Pan canvas' },
  { keys: 'Esc', label: 'Cancel draw/drag, deselect' },
  { keys: 'Ctrl+L', label: 'Link objects / Shift: unlink' },
  { keys: 'Ctrl+C/V', label: 'Copy / paste objects' },
  { keys: 'L', label: 'Toggle object lock' },
  { keys: 'Ctrl+0', label: 'Fit to screen (+/- zoom)' },
]
</script>

<template>
  <ModalShell :open="open" title="Keyboard Shortcuts" @close="emit('close')">
    <div class="form__col">
      <div v-for="s in shortcuts" :key="s.keys" class="form__row">
        <span class="badge">{{ s.keys }}</span>
        <span class="form__hint">{{ s.label }}</span>
      </div>
    </div>
  </ModalShell>
</template>
