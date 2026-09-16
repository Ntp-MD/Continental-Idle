import { vi } from 'vitest'

class ResizeObserverStub {
	observe(): void {}
	unobserve(): void {}
	disconnect(): void {}
}

if (!('ResizeObserver' in globalThis)) {
	globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver
}

if (!window.matchMedia) {
	window.matchMedia = ((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(() => false),
	})) as unknown as typeof window.matchMedia
}