// ============================================================================
// types.ts - barrel for the blueprint editor domain schema
//
// The implementation lives in ./schema/*.ts, split by dependency order:
//   helpers -> primitives -> walkable -> interact -> objects -> assets
//   -> npc -> rooms -> layout -> payload -> dataFile
// Import from this barrel (or the specific module); never re-implement here.
// ============================================================================

export * from './schema/helpers'
export * from './schema/primitives'
export * from './schema/walkable'
export * from './schema/interact'
export * from './schema/objects'
export * from './schema/assets'
export * from './schema/npc'
export * from './schema/rooms'
export * from './schema/layout'
export * from './schema/payload'
export * from './schema/dataFile'
