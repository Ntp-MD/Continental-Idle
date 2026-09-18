import { EDITOR_CONFIG } from '../editorConfig'
import { createHttpPersistencePort } from './httpPorts'
import { createIndexedDbStorage, createLocalPersistencePort, isIndexedDbAvailable } from './localPort'
import type { PersistencePort } from './ports'

export type PersistenceMode = 'http' | 'local'

export class PersistenceUnavailableError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'PersistenceUnavailableError'
	}
}

/**
 * `VITE_PERSISTENCE` wins when set. Otherwise the dev server owns the store
 * (its `/__blueprint-data` middleware), while a production build is a static
 * app that must store the workspace in the browser.
 */
export function resolvePersistenceMode(): PersistenceMode {
	if (EDITOR_CONFIG.persistenceMode) return EDITOR_CONFIG.persistenceMode
	return import.meta.env.DEV ? 'http' : 'local'
}

export function createPersistencePort(): PersistencePort {
	const mode = resolvePersistenceMode()
	if (mode === 'http') return createHttpPersistencePort()
	if (!isIndexedDbAvailable()) {
		throw new PersistenceUnavailableError(
			'This browser does not support IndexedDB, so the workspace cannot be saved locally. Use a modern browser or set VITE_PERSISTENCE=http.',
		)
	}
	return createLocalPersistencePort(createIndexedDbStorage())
}