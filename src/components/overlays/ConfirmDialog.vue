<script setup lang="ts">
import { computed, ref } from 'vue'
import { useConfirm } from '@/composables/useConfirm'
import ModalShell from '../../blueprint-editor/components/ModalShell.vue'

const { pending, resolve } = useConfirm()

const inputValue = ref('')
const isPrompt = computed(() => pending.value?.prompt !== undefined)

function submitPrompt() {
  const value = inputValue.value.trim()
  resolve(value || null)
}

function onCancel() {
  resolve(isPrompt.value ? null : false)
}

function onConfirm() {
  if (isPrompt.value) submitPrompt()
  else resolve(true)
}
</script>

<template>
  <ModalShell :open="!!pending" modal-id="modal-confirm" :title="pending?.title ?? ''" @close="onCancel">
    <div v-if="pending" class="form__col" @keydown.enter.stop.prevent="onConfirm">
      <p class="confirmdialog__msg">{{ pending.message }}</p>
      <input
        v-if="isPrompt"
        v-model="inputValue"
        data-autofocus
        :aria-label="pending.title"
        :placeholder="pending.promptPlaceholder ?? ''"
        @keydown.enter.stop.prevent="submitPrompt"
        @keydown.escape.stop.prevent="onCancel"
      />
      <div class="form__row confirmdialog__actions">
        <button class="flag--ghost size--stretch" @click="onCancel">{{ pending.cancelLabel }}</button>
        <button
          class="size--stretch"
          :data-autofocus="isPrompt ? undefined : true"
          :class="pending.danger ? 'flag--danger' : 'flag--active'"
          @click="onConfirm"
        >
          {{ pending.confirmLabel }}
        </button>
      </div>
    </div>
  </ModalShell>
</template>

<style scoped>
:deep(#modal-confirm) {
  width: min(90vw, 400px);
  max-height: calc(100vh - 32px);
}

.confirmdialog__msg {
  color: var(--text-secondary);
  white-space: pre-wrap;
  word-break: break-word;
  text-align: center;
}
</style>
