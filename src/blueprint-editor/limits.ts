/**
 * Single source of truth for the persistence limits.
 *
 * The server validates the WHOLE file atomically (a save is all-or-nothing),
 * so a single entity built past a limit makes every later save fail. Every
 * ingress normalizer AND every construction path must use these numbers.
 */
export const MAX_GRID_ROWS = 256
export const MAX_GRID_COLUMNS = 256
export const MAX_ASSETS = 1000
export const MAX_FLOORS = 100
export const MAX_OBJECTS_PER_FLOOR = 10_000
export const MAX_NPC_ENTRIES = 1000
export const MAX_ASSET_TILES = 256
export const MAX_PAYLOAD_BYTES = 5 * 1024 * 1024