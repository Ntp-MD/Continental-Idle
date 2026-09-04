<script setup lang="ts">
import { computed, ref, useId, watch, onUnmounted } from 'vue'
import { useFocusTrap } from '../../../composables/useFocusTrap'
import { useDraggable } from '../../composables/useDraggable'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    modalId?: string
    maxWidth?: string
    width?: string
    height?: string
    maxHeight?: string
    floating?: boolean
    topLayer?: boolean
    bodyClass?: string
  }>(),
  {
    modalId: undefined,
    maxWidth: undefined,
    width: undefined,
    height: undefined,
    maxHeight: undefined,
    floating: false,
    topLayer: false,
    bodyClass: undefined,
  },
)

const emit = defineEmits<{ (e: 'close'): void }>()

const containerRef = ref<HTMLElement>()
const isOpen = computed(() => props.open)
useFocusTrap(isOpen, containerRef)

const { pos, isDragging, onDown, reset } = useDraggable(containerRef)

const titleId = useId()

function onClose() {
  emit('close')
}

function onEscape(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.stopPropagation()
    onClose()
  }
}

watch(isOpen, (open) => {
  if (open) {
    reset()
    window.addEventListener('keydown', onEscape, true)
  } else {
    window.removeEventListener('keydown', onEscape, true)
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', onEscape, true)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="modal__overlay"
      :class="{ 'modal__overlay--top': topLayer }"
      @click.self="!floating && onClose()"
    >
      <div
        :id="modalId"
        ref="containerRef"
        class="modal"
        :class="{ 'modal--dragging': isDragging }"
        :style="{ maxWidth, width, height, maxHeight, transform: `translate(${pos.x}px, ${pos.y}px)` }"
        role="dialog"
        :aria-modal="!floating"
        :aria-labelledby="titleId"
      >
        <div class="modal__header" @mousedown="onDown">
          <span :id="titleId">{{ title }}</span>
          <slot name="header" />
          <button class="modal__close" aria-label="Close" @click="onClose">x</button>
        </div>
        <div class="modal__body" :class="bodyClass">
          <slot />
        </div>
        <div v-if="$slots.footer" class="modal__footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal__overlay--top {
  z-index: var(--z-layer-confirm);
}

.modal--dragging,
.modal--dragging .modal__header {
  cursor: grabbing;
}
</style>
