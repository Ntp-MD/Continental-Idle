import { ref } from 'vue'

export interface ConfirmOptions {
	message: string

	title?: string

	confirmLabel?: string

	cancelLabel?: string

	danger?: boolean
}

export interface PromptOptions extends ConfirmOptions {

	prompt: string

	promptPlaceholder?: string
}

interface PendingDialog {
	id: number
	message: string
	title: string
	confirmLabel: string
	cancelLabel: string
	danger: boolean
	prompt: string | undefined
	promptPlaceholder: string | undefined
	resolve: (value: boolean | string | null) => void
}

const pending = ref<PendingDialog | null>(null)
let nextId = 0

function dismissCurrent(withPrompt: boolean) {
	if (pending.value) {
		pending.value.resolve(withPrompt ? null : false)
		pending.value = null
	}
}

function confirm(options: ConfirmOptions): Promise<boolean> {
	dismissCurrent(false)
	return new Promise<boolean>((resolve) => {
		pending.value = {
			id: nextId++,
			message: options.message,
			title: options.title ?? 'Confirm',
			confirmLabel: options.confirmLabel ?? 'Confirm',
			cancelLabel: options.cancelLabel ?? 'Cancel',
			danger: options.danger ?? false,
			prompt: undefined,
			promptPlaceholder: undefined,
			resolve: (v) => resolve(v === true),
		}
	})
}

function prompt(options: PromptOptions): Promise<string | null> {
	dismissCurrent(true)
	return new Promise<string | null>((resolve) => {
		pending.value = {
			id: nextId++,
			message: options.message,
			title: options.title ?? 'Confirm',
			confirmLabel: options.confirmLabel ?? 'Confirm',
			cancelLabel: options.cancelLabel ?? 'Cancel',
			danger: options.danger ?? false,
			prompt: options.prompt,
			promptPlaceholder: options.promptPlaceholder,
			resolve: (v) => resolve(typeof v === 'string' ? v : null),
		}
	})
}

function resolve(value: boolean | string | null) {
	const p = pending.value
	if (!p) return
	pending.value = null
	p.resolve(value)
}

export function useConfirm() {
	return {
		pending,
		confirm,
		prompt,

		resolve,
	}
}
