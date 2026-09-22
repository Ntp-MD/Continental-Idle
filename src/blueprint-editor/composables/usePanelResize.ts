import { computed, ref, type ComputedRef, type CSSProperties } from 'vue'

const MIN_PANEL_WIDTH = 200
const MAX_PANEL_WIDTH = 480
const KEYBOARD_STEP = 8

function clampWidth(value: number): number {
	return Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, Math.round(value)))
}

export interface PanelResize {
	panelStyle: ComputedRef<CSSProperties | undefined>
	onResizeStart: (e: MouseEvent) => void
	onResizeKey: (e: KeyboardEvent) => void
	resetPanelWidth: () => void
}

// IDE-like sidebar resize shared by the left/right editor panels: drag the
// edge, arrow keys when focused, double-click resets to the CSS default.
// Widths persist in localStorage (UI chrome only, never domain data).
export function usePanelResize(side: 'left' | 'right'): PanelResize {
	const storageKey = `blueprint-panel-width-${side}`

	function loadWidth(): number | null {
		try {
			const raw = localStorage.getItem(storageKey)
			if (raw === null) return null
			const value = Number(raw)
			return Number.isFinite(value) ? clampWidth(value) : null
		} catch {
			return null
		}
	}

	function persist(value: number | null): void {
		try {
			if (value === null) localStorage.removeItem(storageKey)
			else localStorage.setItem(storageKey, String(value))
		} catch {
			// Private mode or locked storage: keep the session-only width.
		}
	}

	const width = ref<number | null>(loadWidth())

	const panelStyle = computed<CSSProperties | undefined>(() =>
		width.value === null ? undefined : { flex: 'none', maxWidth: 'none', width: `${width.value}px` },
	)

	function onResizeStart(e: MouseEvent): void {
		if (e.button !== 0) return
		e.preventDefault()
		const handle = e.currentTarget as HTMLElement | null
		const startWidth = handle?.parentElement?.getBoundingClientRect().width ?? 300
		const startX = e.clientX
		document.body.style.cursor = 'col-resize'
		document.body.style.userSelect = 'none'
		const onMove = (ev: MouseEvent): void => {
			const delta = side === 'left' ? ev.clientX - startX : startX - ev.clientX
			width.value = clampWidth(startWidth + delta)
		}
		const onUp = (): void => {
			window.removeEventListener('mousemove', onMove)
			document.body.style.cursor = ''
			document.body.style.userSelect = ''
			persist(width.value)
		}
		window.addEventListener('mousemove', onMove)
		window.addEventListener('mouseup', onUp, { once: true })
	}

	function onResizeKey(e: KeyboardEvent): void {
		const base = width.value ?? 300
		if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
			e.preventDefault()
			const away = e.key === 'ArrowLeft' ? -1 : 1
			width.value = clampWidth(base + (side === 'left' ? away : -away) * KEYBOARD_STEP)
			persist(width.value)
		} else if (e.key === 'Home') {
			e.preventDefault()
			resetPanelWidth()
		}
	}

	function resetPanelWidth(): void {
		width.value = null
		persist(null)
	}

	return { panelStyle, onResizeStart, onResizeKey, resetPanelWidth }
}
