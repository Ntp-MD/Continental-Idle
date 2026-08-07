# Architecture Rules

## Origin Assets and Placed Objects

The blueprint editor has two different concepts that must not be conflated:

### Origin asset (`AssetDef`)

- Lives in the asset registry and is identified by the asset id.
- Is the source of truth for every placed instance whose `ObjectData.type` references that id.
- Owns reusable definition data: dimensions, walkability, walkable grid, tile states, tile edges, anchor points, interaction capacity, interaction duration, default appearance, validation rules, tags, and other asset defaults.
- Changes made to an origin asset must be propagated to all of its placed objects through the existing asset update/hydration path.

### Placed object (`ObjectData`)

- Is an instance placed on a floor; `ObjectData.type` points to its origin asset id.
- Its only user-owned instance values are position (`x`, `y`) and rotation.
- `id` and `type` are required identity/reference fields, not editable definition data.
- Any room/link/collapse metadata is system-managed structural state only; it must not become a second definition/configuration source.
- Definition data must be resolved from the origin asset by `type`, not maintained as independently editable fields on the placed object.
- Do not add an instance-only edit path for inherited fields unless an explicit override model is introduced first.
- Never infer or update the origin asset from a placed object edit.

### Inheritance contract

Inheritance is one-way:

```text
AssetDef (origin/source of truth)
        |
        v
ObjectData (x/y/rotation instance reference)
```

This applies especially to:

- `walkable`
- `entranceRequired`
- `walkableGrid`
- `tileStates`
- `tileEdges`
- `anchorPoints`
- `interact.capacity`
- `interact.durationMin`
- `interact.durationMax`
- asset defaults and validation metadata

When adding a new definition field:

1. Add it to the origin type and canonical persistence format.
2. Normalize and validate it at the load/migration boundary.
3. Resolve it from the origin asset whenever a placed object is created, rendered, edited, persisted, or simulated.
4. Propagate origin changes by re-resolving the placed object's definition, not by treating stale object fields as authority.
5. Include the origin definition in persistence/game sync if runtime needs it.
6. Do not silently add a copied editable definition field to `ObjectData`.

### Normalization boundary

All external or legacy data must be converted to the canonical shape before use by the editor or simulation:

```text
persisted/imported/legacy data
        -> migration + normalization + validation
        -> canonical AssetDef / RoomData / ObjectData
        -> editor and simulation
```

For example, legacy anchor tuples must be normalized to canonical anchor objects before consumers use them. Keep normalization in shared data-boundary helpers, not scattered across components.

Canonical normalization helpers live in `src/blueprint-editor/types.ts` and must be used at every data boundary (migration, asset overrides, UI save, validation):

- `normalizeAnchorPoints(value)` — accepts legacy `[x,y]` tuples or `{x,y}` objects; rejects non-finite values and deduplicates.
- `normalizeInteractConfig(value)` — canonicalizes capacity (0/undefined → auto, >0 → integer) and duration (min default 1, max clamped to >= min, default 3).
- `normalizeTileEdges(value)` — validates `TileEdges[][]` structure.
- `normalizeWalkableGrid(value)` — validates `boolean[][]` structure.
- `normalizeTileStates(value)` — validates `TileState[][]` structure.
- `resolveInteractForTarget(interact, anchorCount)` — single canonical resolver for the NPC engine's `capacity` / `durationMinSeconds` / `durationMaxSeconds`. Adapters must call this instead of inlining defaults.
- `validateAnchorsForOwner(anchors, owner, tileStateAt?)` — bounds + walkable checks for an owner's anchors.
- `checkTileGridConsistency(walkableGrid, tileStates)` — reports mismatches between the two grids.

`validateLayoutData()` calls these helpers to reject malformed anchor/interact/tile fields at the schema gate.

### Normalization planning gate (mandatory before implementation)

This gate activates when any of the following are true:

- The feature touches `migrate.ts`, `dataLoader.ts`, `persistence.ts`, or `validateLayoutData()`.
- The feature adds, modifies, or removes a field on `AssetDef`, `RoomData`, `ObjectData`, `InteractConfig`, `AnchorPoint`, `TileEdges`, `WalkableGrid`, or `TileState`.
- The feature changes how data flows between the editor, persistence, sync DTO, or NPC engine adapters.
- The feature adds a new UI form that saves user-entered data into a persisted structure.
- The feature adds a new consumer of `interact`, `anchorPoints`, `tileEdges`, `walkableGrid`, or `tileStates`.
- The user says "normalize", "data boundary", "migration", "validation", "sync", "override", or "canonical".

Before implementing any feature that touches data flow — migration, loading, persistence, sync, UI save, validation, engine adapter conversion, or adding a new definition field — you MUST complete this planning step before writing any feature code:

1. **Identify data boundaries**: List every point where external, legacy, user-entered, or synced data enters or leaves the system in this feature. Include persistence writes, JSON loads, override patches, UI form saves, and adapter conversions.
2. **Map to canonical helpers**: For each boundary, name the specific `normalize*` / `validate*` / `resolve*` helper from `types.ts` that applies. If no helper exists for a new field shape, plan to create the helper first — before the feature logic.
3. **Plan resolution points**: For each consumer of the data (NPC engine, renderer, simulator, sync DTO), confirm whether it should call a `resolve*` helper instead of inlining defaults. Flag any consumer that currently inlines defaults and should be migrated.
4. **Flag inheritance risks**: If the feature adds or modifies a definition field on `AssetDef` or `RoomData`, state how it will be resolved from the origin asset to placed objects, and whether `ObjectData` will receive a copied snapshot (it should not, unless an explicit override model is introduced).
5. **State the plan**: Include a short "Normalization plan" section in your response listing the boundaries, helpers, and resolution points before starting implementation. If the feature does not touch any data boundary, state "No data boundaries touched" explicitly.

Do not start writing feature code until this step is done. This gate exists because retroactive normalization fixes are more expensive and error-prone than planning normalization upfront. The canonical helpers are cheap to call; the cost of skipping them is malformed data reaching the engine or persisted state.

#### Anti-patterns to reject

- **Inline defaults** in consumers: `interact?.durationMin ?? 1` scattered across adapters. Use `resolveInteractForTarget()`.
- **Raw cast** at migration: `interact: r.interact as InteractConfig`. Use `normalizeInteractConfig()`.
- **`Object.assign` without re-normalize** in override patches. Use the normalized `applyAssetOverrides()`.
- **New field without helper**: adding a definition field but no `normalize*` helper at the boundary.
- **Snapshot on `ObjectData`**: copying a definition field onto placed objects instead of resolving from origin.

### Definition type change gate (mandatory after implementation)

After implementing any change that adds, removes, renames, or changes the shape of a field on `AssetDef`, `RoomData`, `ObjectData`, `InteractConfig`, `AnchorPoint`, `TileEdges`, `WalkableGrid`, `TileState`, or `OriginAssetFile`, you MUST run this verification sequence before marking the task complete:

1. **Invoke the `normalize-audit` skill**: Run the full audit procedure against the changes just made. The audit is read-only and reports gaps/anti-patterns. Fix any FAIL verdict before proceeding.
2. **Run `npm run verify:assets`**: This script loads `originAssets.json` and validates every asset against the current `AssetDef` shape. It catches:
   - Fields present in the data file but no longer on the type (stale data after a field removal).
   - Fields required by the new type but missing from the data file (incomplete migration after a field addition).
   - Shape mismatches (e.g. `anchorPoints` entries that are `[x,y]` tuples instead of `{x,y}` objects).
3. **Run `npm run test:npc-engine`**: The NPC engine tests load `originAssets.json` directly and exercise anchor/interact/walkable resolution. A pass confirms the data file is consumable by the engine after the type change.
4. **Run `npx vite build`**: Confirms the type change compiles and the data file imports cleanly.
5. **Report**: State which gates passed and which failed. Do not declare the feature done until all gates pass.

This gate is mandatory because definition type changes ripple through migration, persistence, UI forms, engine adapters, and the data file. Skipping it leaves stale fields in `originAssets.json` or missing normalization at a boundary, which surfaces as runtime bugs only after a browser refresh or save cycle.

### Anchor and interaction ownership

- Asset anchors are local coordinates relative to the origin asset's top-left corner.
- A placed object resolves the same local anchor coordinates from its origin; do not convert them to world coordinates or create an independently editable anchor copy in persisted object data.
- A room owns its own anchors and interaction config; rooms are not asset instances.
- Multiple anchors are valid and represent separate interaction points.
- Interaction capacity limits concurrent users of one item; an anchor can be reserved by at most one NPC.
- Interaction duration values are stored in seconds. Convert to simulation ticks only inside the simulation runtime, and randomize between min/max for each interaction.

### Safe extension rule

If a future feature needs a placed object to differ from its origin, introduce an explicit override model such as:

```ts
overrides?: {
  interact?: InteractConfig
  anchorPoints?: AnchorPoint[]
}
```

Do not overwrite the inherited snapshot or treat ad-hoc fields on `ObjectData` as implicit overrides.

## Shared NPC Engine Architecture

Editor preview and main-game NPC runtime must use one pure TypeScript NPC engine. Do not maintain separate behavior implementations in Vue components or editor composables.

```text
Canonical hotel blueprint/layout + NPC config
                         |
                         v
                 Shared NPC engine
                    /          \
       Editor adapter          Runtime adapter
       (debug/canvas)           (game visuals)
```

The shared engine owns:

- target selection and role/task conditions
- multi-anchor interaction targeting
- walkable/blocked/door obstacle checks
- pathfinding and repathing
- item/anchor reservations and capacity
- waiting state when an item is full
- NPC movement occupancy and overlap prevention
- interaction duration in seconds, converted to simulation ticks internally
- randomized duration between min/max
- engine events such as waiting, interaction start, interaction end, and blocked/repath

Adapters own only integration concerns:

- converting source layout data into the canonical engine layout
- lifecycle/timing (`requestAnimationFrame`, game loop, pause/resume)
- rendering NPCs and debug paths
- mapping engine events to UI/game effects

### NPC identity vs behavior source

The Editor preview and the main game do not have the same NPC population, so they must not share spawn identities:

- **Editor adapter:** creates preview agents from the Editor NPC config/pool. These agents are temporary visualization agents.
- **Main-game adapter:** creates agents from live game entities (staff, assassins, guests, and visitors), preserving their game id, role, color, stats, and lifecycle. These are not copied from the Editor's preview population.
- **Shared behavior:** both adapters pass those agents through the same `NpcEngine`; target selection, movement, obstacles, reservations, waiting, and interaction timing come from the shared engine and canonical synced hotel layout.

Therefore, "map staff/assassin/guest to engine agents" means an adapter translation from game-domain entities into the generic engine state. It does **not** mean duplicating AI behavior in `HQOfficeView.vue`, nor replacing live game entities with Editor preview NPCs.

The Editor and main game must receive equivalent canonical layout semantics, not only visual geometry. Sync must include walkability, tile states, tile edges/doors, tags, anchors, interaction capacity, and interaction duration. Runtime-only transient state (current path, reservations, timers, and waiting state) remains local to the active engine instance.

### NPC implementation phases

Phase 1 is intentionally limited to proving the hotel layout and generic NPC interaction loop:

1. Finish and validate all hotel visual/layout data.
2. Sync the canonical layout semantics into both adapters: walkability, blocked cells, doors/edges, room/object tags, anchors, interaction capacity, and duration.
3. Run NPCs through the hotel to verify ordinary wandering, obstacle-aware movement, multi-anchor selection, reservation, waiting, non-overlap, and random interaction duration.
4. Use the shared engine's generic agents for this test; do not add role capabilities, skills, combat abilities, or role-specific action conditions yet.

Role capability and skill integration is a later phase. It must not block or alter the layout/interact validation phase. Until that phase begins, the main-game adapter may preserve live NPC identity for visuals and lifecycle, but engine targeting remains generic and layout-driven.

The phase gate is: visual/layout sync plus generic NPC walk-and-interact tests pass before role capability/skill behavior is implemented.

Do not import a Vue composable into the main game as the shared engine. Extract pure engine code under `src/engine/npc/`, then keep `useNpcSimulation.ts` and `HQOfficeView.vue` as thin adapters.
