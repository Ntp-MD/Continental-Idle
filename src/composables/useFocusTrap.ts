import { ref, watch, nextTick, type Ref } from 'vue'

export function useFocusTrap(isOpen: Ref<boolean>, containerRef?: Ref<HTMLElement | undefined>) {
	const internalRef = containerRef ?? ref<HTMLElement>()
	let previousActive: HTMLElement | null = null

	watch(isOpen, (open) => {
		if (open) {
			previousActive = document.activeElement as HTMLElement
			nextTick(() => {
				const preferred = internalRef.value?.querySelector<HTMLElement>('[data-autofocus]')
				if (preferred) {
					preferred.focus()
					return
				}
				const focusable = internalRef.value?.querySelector<HTMLElement>(
					'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
				)
				focusable?.focus()
			})
		} else {
			previousActive?.focus()
		}
	})

	return { containerRef: internalRef }
}
