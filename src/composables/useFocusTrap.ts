import { ref, watch, nextTick, onScopeDispose, type Ref } from 'vue'

const FOCUSABLE =
	'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useFocusTrap(isOpen: Ref<boolean>, containerRef?: Ref<HTMLElement | undefined>) {
	const internalRef = containerRef ?? ref<HTMLElement>()
	let previousActive: HTMLElement | null = null

	function focusables(): HTMLElement[] {
		const container = internalRef.value
		if (!container) return []
		// Only rendered controls: a hidden tab panel keeps its inputs in the DOM, and
		// treating one of them as the boundary stops the wrap from ever firing.
		return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.getClientRects().length > 0)
	}

	// Listens on document, not the container: once focus has already escaped, the
	// container never sees the keydown that would need to pull it back.
	function onKeydown(event: KeyboardEvent) {
		if (event.key !== 'Tab') return
		const container = internalRef.value
		if (!container) return
		const focusable = focusables()
		if (!focusable.length) {
			event.preventDefault()
			return
		}
		const first = focusable[0]!
		const last = focusable[focusable.length - 1]!
		const active = document.activeElement
		if (!container.contains(active)) {
			event.preventDefault()
			first.focus()
			return
		}
		if (event.shiftKey && active === first) {
			event.preventDefault()
			last.focus()
		} else if (!event.shiftKey && active === last) {
			event.preventDefault()
			first.focus()
		}
	}

	function release() {
		document.removeEventListener('keydown', onKeydown)
		previousActive?.focus?.()
		previousActive = null
	}

	watch(isOpen, (open) => {
		if (open) {
			previousActive = document.activeElement as HTMLElement | null
			document.addEventListener('keydown', onKeydown)
			nextTick(() => {
				;(internalRef.value?.querySelector<HTMLElement>('[data-autofocus]') ?? focusables()[0])?.focus()
			})
		} else {
			release()
		}
	})

	// A modal unmounted while still open would otherwise leave the listener + focus steal live.
	onScopeDispose(() => {
		if (isOpen.value) release()
	})
}
