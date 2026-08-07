# Data Boundary Normalization Rule

This rule activates during planning and implementation of any feature that touches data flow. It is a focused companion to the "Normalization planning gate" in `AGENTS.md` — read both before starting.

## Trigger conditions

This rule applies when any of the following are true:

- The feature touches `migrate.ts`, `dataLoader.ts`, `persistence.ts`, or `validateLayoutData()`.
- The feature adds, modifies, or removes a field on `AssetDef`, `RoomData`, `ObjectData`, `InteractConfig`, `AnchorPoint`, `TileEdges`, `WalkableGrid`, or `TileState`.
- The feature changes how data flows between the editor, persistence, sync DTO, or NPC engine adapters.
- The feature adds a new UI form that saves user-entered data into a persisted structure.
- The feature adds a new consumer of `interact`, `anchorPoints`, `tileEdges`, `walkableGrid`, or `tileStates`.
- The user says "normalize", "data boundary", "migration", "validation", "sync", "override", or "canonical".

## Mandatory planning step

Before writing feature code, produce a "Normalization plan" with:

1. **Boundaries**: list every data entry/exit point the feature touches.
2. **Helpers**: name the `normalize*` / `validate*` / `resolve*` helper for each boundary.
3. **Resolution**: confirm each consumer calls a `resolve*` helper, not inlined defaults.
4. **Gaps**: if no helper exists for a new shape, create it first.

If no data boundary is touched, state "No data boundaries touched" and proceed.

## Canonical helper inventory

All helpers live in `src/blueprint-editor/types.ts`:

| Helper | Purpose |
|---|---|
| `normalizeAnchorPoints(value)` | Legacy `[x,y]` or `{x,y}` → canonical `AnchorPoint[]`; rejects non-finite, deduplicates. |
| `normalizeInteractConfig(value)` | Capacity (0/undefined → auto, >0 → int), duration (min default 1, max >= min, default 3). |
| `normalizeTileEdges(value)` | Validates `TileEdges[][]` structure. |
| `normalizeWalkableGrid(value)` | Validates `boolean[][]` structure. |
| `normalizeTileStates(value)` | Validates `TileState[][]` structure. |
| `resolveInteractForTarget(interact, anchorCount)` | Single canonical resolver for engine `capacity` / `durationMinSeconds` / `durationMaxSeconds`. |
| `validateAnchorsForOwner(anchors, owner, tileStateAt?)` | Bounds + walkable checks for anchors. |
| `checkTileGridConsistency(walkableGrid, tileStates)` | Reports mismatches between the two grids. |

## Anti-patterns to reject

- **Inline defaults** in consumers: `interact?.durationMin ?? 1` scattered across adapters. Use `resolveInteractForTarget()`.
- **Raw cast** at migration: `interact: r.interact as InteractConfig`. Use `normalizeInteractConfig()`.
- **`Object.assign` without re-normalize** in override patches. Use the normalized `applyAssetOverrides()`.
- **New field without helper**: adding a definition field but no `normalize*` helper at the boundary.
- **Snapshot on `ObjectData`**: copying a definition field onto placed objects instead of resolving from origin.

## Verification after implementation

After writing code, confirm:

1. Every data boundary identified in the plan uses a canonical helper.
2. No consumer inlines `interact` defaults — all use `resolveInteractForTarget()`.
3. `validateLayoutData()` covers any new field shape.
4. `vue-tsc` and `test:npc-engine` pass.
