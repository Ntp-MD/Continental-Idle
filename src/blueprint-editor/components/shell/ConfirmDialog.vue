<script setup lang="ts">
import { useConfirm } from '@/composables/useConfirm'
import ModalShell from '../../blueprint-editor/components/shell/ModalShell.vue'

const { pending, resolve } = useConfirm()

function onCancel() {
  resolve(false)
}

function onConfirm() {
  resolve(true)
}
</script>

<template>
  <ModalShell :open="!!pending" modal-id="modal-confirm" top-layer :title="pending?.title ?? ''" @close="onCancel">
    <div v-if="pending" class="form__col" @keydown.enter.stop.prevent="onConfirm">
      <p class="confirmdialog__msg">{{ pending.message }}</p>
      <div class="form__row">
        <button class="size--stretch" @click="onCancel">{{ pending.cancelLabel }}</button>
        <button
          class="size--stretch"
          data-autofocus
          :class="pending.danger ? 'flag--danger' : 'flag--active'"
          @click="onConfirm"
        >
          {{ pending.confirmLabel }}
        </button>
      </div>
    </div>
  </ModalShell>
</template>

<style>
#modal-confirm {
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
