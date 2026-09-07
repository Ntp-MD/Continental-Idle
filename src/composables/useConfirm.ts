import { ref } from 'vue'

export interface ConfirmOptions {
	message: string

	title?: string

	confirmLabel?: string

	cancelLabel?: string

	danger?: boolean
}

interface PendingDialog {
	id: number
	message: string
	title: string
	confirmLabel: string
	cancelLabel: string
	danger: boolean
	resolve: (value: boolean) => void
}

const pending = ref<PendingDialog | null>(null)
let nextId = 0

function dismissCurrent() {
	if (pending.value) {
		pending.value.resolve(false)
		pending.value = null
	}
}

function confirm(options: ConfirmOptions): Promise<boolean> {
	dismissCurrent()
	return new Promise<boolean>((resolve) => {
		pending.value = {
			id: nextId++,
			message: options.message,
			title: options.title ?? 'Confirm',
			confirmLabel: options.confirmLabel ?? 'Confirm',
			cancelLabel: options.cancelLabel ?? 'Cancel',
			danger: options.danger ?? false,
			resolve,
		}
	})
}

function resolve(value: boolean) {
	const p = pending.value
	if (!p) return
	pending.value = null
	p.resolve(value)
}

export function useConfirm() {
	return {
		pending,
		confirm,

		resolve,
	}
}
