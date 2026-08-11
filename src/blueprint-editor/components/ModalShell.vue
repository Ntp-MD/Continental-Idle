<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from "vue";
import { useFocusTrap } from "../../composables/useFocusTrap";

const props = withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    dialogClass?: string;
    maxWidth?: string;
    width?: string;
    height?: string;
    maxHeight?: string;
  }>(),
  {
    dialogClass: "",
    maxWidth: "700px",
    width: "60vw",
    height: "auto",
    maxHeight: "85vh",
  },
);

const emit = defineEmits<{ (e: "close"): void }>();

const containerRef = ref<HTMLElement>();
const isOpen = computed(() => props.open);
useFocusTrap(isOpen, containerRef);

const titleId = computed(() => `modal-shell-title-${Math.random().toString(36).slice(2, 9)}`);

function onClose() {
  emit("close");
}

function onEscape(e: KeyboardEvent) {
  if (e.key === "Escape") {
    e.stopPropagation();
    onClose();
  }
}

watch(isOpen, (open) => {
  if (open) window.addEventListener("keydown", onEscape, true);
  else window.removeEventListener("keydown", onEscape, true);
});

onUnmounted(() => {
  window.removeEventListener("keydown", onEscape, true);
});
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal__overlay" @click.self="onClose">
      <div ref="containerRef" class="modal__dialog" :class="dialogClass" :style="{ maxWidth, width, height, maxHeight }" role="dialog" aria-modal="true" :aria-labelledby="titleId">
        <div class="modal__header">
          <span :id="titleId" class="modal__title">{{ title }}</span>
          <button class="modal__close" @click="onClose" aria-label="Close">✕</button>
        </div>
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal__overlay {
  overflow: hidden;
}
</style>
