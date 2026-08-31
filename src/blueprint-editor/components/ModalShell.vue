<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from "vue";
import { useFocusTrap } from "../../composables/useFocusTrap";
import { useDraggable } from "../composables/useDraggable";

const props = withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    dialogClass?: string;
    maxWidth?: string;
    width?: string;
    height?: string;
    maxHeight?: string;
    floating?: boolean;
  }>(),
  {
    dialogClass: "",
    maxWidth: undefined,
    width: undefined,
    height: undefined,
    maxHeight: undefined,
    floating: false,
  },
);

const emit = defineEmits<{ (e: "close"): void }>();

const containerRef = ref<HTMLElement>();
const isOpen = computed(() => props.open);
useFocusTrap(isOpen, containerRef);

const { pos, isDragging, onDown, reset } = useDraggable(containerRef);

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
  if (open) {
    reset();
    window.addEventListener("keydown", onEscape, true);
  } else {
    window.removeEventListener("keydown", onEscape, true);
  }
});

onUnmounted(() => {
  window.removeEventListener("keydown", onEscape, true);
});
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal__overlay" :class="{ 'modal__overlay--floating': floating }" @click.self="!floating && onClose()">
      <div ref="containerRef" class="modal__dialog" :class="{ 'modal__dialog--dragging': isDragging, [dialogClass]: !!dialogClass }" :style="{ maxWidth, width, height, maxHeight, transform: `translate(${pos.x}px, ${pos.y}px)` }" role="dialog" :aria-modal="!floating" :aria-labelledby="titleId">
        <div class="modal__header" @mousedown="onDown">
          <span :id="titleId" class="modal__title">{{ title }}</span>
          <button class="flag--ghost" aria-label="Close" @click="onClose">x</button>
        </div>
        <slot />
      </div>
    </div>
  </Teleport>
</template>
