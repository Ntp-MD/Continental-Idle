<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useConfirm } from '@/composables/useConfirm'
import ModalShell from '../../blueprint-editor/components/ModalShell.vue'

const { pending, resolve } = useConfirm()

const inputRef = ref<HTMLInputElement>()
const confirmRef = ref<HTMLButtonElement>()
const inputValue = ref('')
const isOpen = computed(() => pending.value !== null)
const isPrompt = computed(() => pending.value?.prompt !== undefined)

watch(isOpen, (open) => {
  if (!open) return
  const p = pending.value
  if (!p) return
  if (p.prompt !== undefined) {
    inputValue.value = p.prompt
    nextTick(() => {
      inputRef.value?.focus()
      inputRef.value?.select()
    })
  } else {
    nextTick(() => confirmRef.value?.focus())
  }
})

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
  <ModalShell :open="!!pending" :title="pending?.title ?? ''" max-width="90vw" width="400px" @close="onCancel">
    <div v-if="pending" class="form__col" @keydown.enter.stop.prevent="onConfirm">
      <p class="confirmdialog__msg">{{ pending.message }}</p>
      <input
        v-if="isPrompt"
        ref="inputRef"
        v-model="inputValue"
        :placeholder="pending.promptPlaceholder ?? ''"
        @keydown.enter.stop.prevent="submitPrompt"
        @keydown.escape.stop.prevent="onCancel"
      />
      <div class="modal__actions">
        <button class="flag--ghost" @click="onCancel">{{ pending.cancelLabel }}</button>
        <button
          ref="confirmRef"
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
