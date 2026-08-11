<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useConfirm } from "@/composables/useConfirm";

const { pending, resolve } = useConfirm();

const dialogRef = ref<HTMLElement>();
const inputRef = ref<HTMLInputElement>();
const inputValue = ref("");
const isOpen = computed(() => pending.value !== null);
const isPrompt = computed(() => pending.value?.prompt !== undefined);

watch(isOpen, (open) => {
  if (!open) return;
  const p = pending.value;
  if (!p) return;
  if (p.prompt !== undefined) {
    inputValue.value = p.prompt;
    nextTick(() => {
      inputRef.value?.focus();
      inputRef.value?.select();
    });
  } else {
    nextTick(() => {
      const btn = dialogRef.value?.querySelector<HTMLElement>('[data-autofocus="true"]');
      btn?.focus();
    });
  }
});

function onKeydown(e: KeyboardEvent) {
  if (!pending.value) return;
  if (e.key === "Escape") {
    e.stopPropagation();
    resolve(isPrompt.value ? null : false);
  } else if (e.key === "Enter" && isPrompt.value) {
    e.stopPropagation();
    submitPrompt();
  } else if (e.key === "Enter" && !isPrompt.value) {
    e.stopPropagation();
    resolve(true);
  }
}

function submitPrompt() {
  const value = inputValue.value.trim();
  resolve(value || null);
}
</script>

<template>
  <Teleport to="body">
    <div v-if="pending" class="modal__overlay" @click.self="resolve(isPrompt ? null : false)" @keydown="onKeydown">
      <div ref="dialogRef" class="confirmdialog__dialog" role="alertdialog" aria-modal="true" :aria-labelledby="`confirmdialog__title__${pending.id}`" :aria-describedby="`confirmdialog__msg__${pending.id}`">
        <h2 :id="`confirmdialog__title__${pending.id}`" class="confirmdialog__title">
          {{ pending.title }}
        </h2>
        <p :id="`confirmdialog__msg__${pending.id}`" class="confirmdialog__msg">{{ pending.message }}</p>
        <input v-if="isPrompt" ref="inputRef" v-model="inputValue" class="input confirmdialog__input" :placeholder="pending.promptPlaceholder ?? ''" @keydown.enter.stop.prevent="submitPrompt" @keydown.escape.stop.prevent="resolve(null)" />
        <div class="actions actions--fill confirmdialog__actions">
          <button class="btn--ghost" @click="resolve(isPrompt ? null : false)">{{ pending.cancelLabel }}</button>
          <button :class="pending.danger ? 'btn--danger' : 'btn--primary'" data-autofocus="true" @click="isPrompt ? submitPrompt() : resolve(true)">{{ pending.confirmLabel }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.confirmdialog__dialog {
  max-width: 450px;
  width: 100%;
  background: var(--bg-card);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-md);
  padding: var(--gap-md);
  box-shadow: 0 16px 48px color-mix(in srgb, var(--bg-primary) 60%, transparent);
  display: grid;
  place-content: center;
  gap: var(--gap-md);
  text-align: center;
}

.confirmdialog__title {
  margin: 0;
  font-size: var(--font-md);
  font-weight: 700;
  color: var(--text-primary);
}

.confirmdialog__msg {
  margin: 0;
  font-size: var(--font-sm);
  color: var(--text-secondary);
  white-space: pre-wrap;
  word-break: break-word;
  text-align: center;
}

.confirmdialog__input {
  justify-content: center;
  width: 100%;
}

.confirmdialog__actions {
  justify-content: center;
  width: 100%;
}
</style>
