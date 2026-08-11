# Project Instructions

## Tech Stack

- **Framework:** Vue 3.5 (`<script setup lang="ts">`, Composition API)
- **Language:** TypeScript 6.0 (strict)
- **Build:** Vite 8.1 with `@vitejs/plugin-vue`
- **Router:** vue-router 4.6
- **Data visualization:** d3 7.9, topojson-client 3.1
- **Test runner:** tsx (TypeScript execution for Node tests)
- **CSS:** Hand-written, non-Tailwind. CSS custom properties for theming. BEM naming with `__` (element) and `--` (modifier).
- **NPC engine:** Pure TypeScript, no Vue dependency. Lives in `src/engine/npc/`.

## Code Style

- **Vue SFCs:** Always `<script setup lang="ts">`. Template → script → style order.
- **Scoped styles:** Component-specific CSS goes in `<style scoped>`. Shared roles go in global stylesheets.
- **TypeScript:** Strict mode. No `any` without justification. Use type guards from `types.ts` for runtime validation.
- **No comments or documentation** unless explicitly requested.
- **CSS variables:** Use `var(--name)` from `variables.css`. No hardcoded colors, spacing, or z-index values.
- **Imports:** Always at the top of the file. Use `@/` alias for `src/` paths.

### Naming Conventions

**Files:**

- `camelCase.ts` — TypeScript modules (utilities, stores, types, composables, engine code)
- `PascalCase.vue` — Vue SFC components
- `camelCase.json` — JSON data files
- `kebab-case.css` — CSS stylesheets

**Vue SFC file naming (mandatory):**

- All `.vue` files MUST use PascalCase (e.g. `RoleManagerModal.vue`, NOT `roleManagerModal.vue`).
- All import paths referencing `.vue` files MUST match the actual filename casing exactly (e.g. `import X from "./RoleManagerModal.vue"`, NOT `import X from "./roleManagerModal.vue"`).
- Windows is case-insensitive at the filesystem level, but TypeScript and the Vue toolchain are case-sensitive. A mismatch between import path casing and filename casing causes `tsconfig` "not listed within the file list" errors and duplicate-inclusion errors.
- Before renaming a `.vue` file, update every import that references it in the same commit. Do not leave stale camelCase import paths after a rename.
- After any `.vue` file rename, run `Select-String -Path "src\**\*.vue","src\**\*.ts" -Pattern '\.vue'` to verify no import path uses the old casing.

**Functions:**

- `camelCase` — general functions
- `normalize*` — data-boundary normalization helpers (e.g. `normalizeInteractSpots`, `normalizeInteractConfig`)
- `validate*` — validation helpers (e.g. `validateLayoutData`, `validateLayoutIntegrity`)
- `resolve*` — resolution helpers that convert canonical data to runtime values (e.g. `resolveInteractForTarget`, `resolveObjectDef`)
- `use*` — Vue composables (e.g. `useCanvasViewport`, `useGameNpcSimulation`)
- `is*` — type guard functions (e.g. `isAssetDef`, `isNpcConfig`)
- `rotate*` — grid transformation helpers (e.g. `rotateGrid90`, `rotateTileEdges90`)

**CSS classes (BEM):**

- `block__element` — structural parts of a block (e.g. `card__title`, `modal__header`, `toast__icon`)
- `block--modifier` — states and variants affecting the whole block (e.g. `btn--active`, `btn--danger`, `card--outlined`, `input--error`)
- `block__element--state` — states affecting one structural element (e.g. `npcmanager__role--active`, `tagmanager__tagrow--active`)
- Use `block__element` for structural messages and children; do not use `block--empty`, `block--selected`, or similar when the class is an element rather than a block state
- Do not use a single hyphen as a BEM separator or to simulate a compound modifier, such as `block--element-state`
- No triple `__` (e.g. `block__element__sub` is invalid)
- No `__` for modifier words (active, danger, error, success, etc.) — use `--` after the relevant block or element
- In Vue `:class` bindings, class keys containing `--` must be quoted (e.g. `:class="{ 'btn--active': isActive }"`) to avoid JS decrement operator parsing errors
- See `.windsurf/rules/css-class-reduction.md` for full rules

## Project Structure

```
src/
├── App.vue                      # Root component
├── main.ts                      # Entry point
├── router.ts                    # Vue Router config
├── env.d.ts                     # Type declarations
├── styles/                      # Global CSS (layered)
│   ├── variables.css            # CSS custom properties (colors, spacing, z-index, fonts)
│   ├── base.css                 # Element-level defaults (button, input, body, etc.)
│   ├── components.css           # Shared reusable component classes (btn--, card--, modal__, toast--)
│   ├── layout.css               # Shared layout classes
│   └── accessibility.css        # a11y styles
├── blueprint-editor/            # Hotel blueprint editor subsystem
│   ├── types.ts                 # All types + normalization/validation/resolution helpers
│   ├── BlueprintEditor.vue      # Editor root component
│   ├── editor.css               # Editor subsystem shared styles
│   ├── editorConfig.ts          # Editor constants
│   ├── geometry.ts              # Geometry math utilities
│   ├── collision.ts             # Collision detection
│   ├── assetUtils.ts            # Asset rendering utilities
│   ├── svgSanitizer.ts          # SVG content sanitization
│   ├── tagRegistry.ts           # Tag system registry
│   ├── blueprintStore.ts        # Store entry point
│   ├── store/                   # Pinia-like store modules
│   │   ├── state.ts             # Reactive state
│   │   ├── dataLoader.ts        # Load + normalize JSON data
│   │   ├── migrate.ts           # Layout migration
│   │   ├── migrateNpc.ts        # NPC config migration
│   │   ├── persistence.ts       # Save/load to localStorage
│   │   ├── assets.ts            # Asset registry store
│   │   ├── floors.ts            # Floor management
│   │   ├── rooms.ts             # Room management
│   │   ├── objects.ts           # Object management
│   │   ├── metadata.ts          # Layout metadata
│   │   ├── mode.ts              # Editor mode (wall, object, move, erase, npc-preview)
│   │   ├── selection.ts         # Selection state
│   │   ├── tags.ts              # Tag store
│   │   ├── npcDefault.ts        # NPC default config
│   │   ├── storeUtils.ts        # Shared store utilities
│   │   └── utils.ts             # Store helper utils
│   ├── composables/             # Editor composables
│   │   ├── useNpcSimulation.ts  # Editor NPC adapter (thin wrapper around shared engine)
│   │   ├── useCanvasViewport.ts # Pan/zoom viewport
│   │   ├── useCanvasDragDrop.ts # Drag-and-drop placement
│   │   ├── useCanvasSelection.ts# Selection logic
│   │   ├── useWalkableGridPanel.ts
│   │   ├── useWallPaintTool.ts
│   │   ├── useFieldError.ts
│   │   ├── useAsyncAction.ts
│   │   └── useClipboardCopy.ts
│   ├── components/              # Editor Vue components
│   │   ├── EditorCanvas.vue     # Main SVG canvas (48k — largest component)
│   │   ├── Toolbar.vue          # Mode toolbar
│   │   ├── AssetPalette.vue     # Asset library sidebar
│   │   ├── AssetPropertiesForm.vue
│   │   ├── PropertiesPanel.vue
│   │   ├── ObjectPropertiesForm.vue
│   │   ├── RoomPropertiesForm.vue
│   │   ├── WalkableGridPanel.vue
│   │   ├── RoleManagerModal.vue
│   │   ├── FloorModal.vue
│   │   ├── DeployNpcModal.vue
│   │   ├── ModalShell.vue
│   │   ├── TagManagerModal.vue
│   │   ├── TagPicker.vue
│   │   └── ToastContainer.vue
│   └── data/                    # JSON data files
│       ├── originAssets.json    # Canonical asset definitions
│       ├── blueprintLayout.json # Default hotel layout
│       ├── npcConfig.json       # NPC simulation config
│       ├── origin-assets.v1.json  # Legacy v1 data (for migration)
│       ├── blueprint-layout.v1.json
│       └── npc-config.v1.json
├── engine/npc/                  # Shared NPC engine (pure TypeScript, no Vue)
│   ├── index.ts                 # Public exports
│   ├── npcEngine.ts             # Core engine (target selection, movement, interaction)
│   ├── pathfinding.ts           # A* pathfinding on walkable grid
│   ├── targetScoring.ts         # Target selection scoring
│   ├── wanderMemory.ts          # NPC wander memory
│   ├── config.ts                # Engine constants
│   └── types.ts                 # Engine-specific types
├── components/                  # Game-level Vue components
│   ├── GameLayout.vue           # Main game layout (hotel + world map tabs)
│   ├── HotelCanvas.vue          # Hotel rendering canvas
│   ├── layout/                  # Layout components
│   │   └── WorldMap.vue         # D3 world map
│   └── overlays/                # Overlay components
│       ├── StartScreen.vue
│       ├── ConfirmDialog.vue
│       ├── ErrorBoundary.vue
│       └── ToastContainer.vue
├── composables/                 # Game-level composables
│   ├── useGameNpcSimulation.ts  # Main-game NPC adapter (thin wrapper around shared engine)
│   ├── useConfirm.ts
│   ├── useFocusTrap.ts
│   └── useToast.ts
├── data/
│   └── branches.ts              # Branch location data
└── utils/                       # Shared utilities
tests/                           # tsx-based test files
scripts/                         # Build/lint scripts
    ├── verify-assets.mjs        # Asset validation script
    └── lint-bem.mjs             # BEM naming linter
```

## Commands

```bash

```

## Rules

### Origin Assets and Placed Objects

The blueprint editor has two different concepts that must not be conflated:

**Origin asset (`AssetDef`)**

- Lives in the asset registry and is identified by the asset id.
- Is the source of truth for every placed instance whose `ObjectData.type` references that id.
- Owns reusable definition data: dimensions, walkability, walkable grid, tile states, tile edges, anchor points, interaction capacity, interaction duration, default appearance, validation rules, tags, and other asset defaults.
- Changes made to an origin asset must be propagated to all of its placed objects through the existing asset update/hydration path.

**Placed object (`ObjectData`)**

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

This applies especially to: `walkable`, `entranceRequired`, `walkableGrid`, `tileStates`, `tileEdges`, `interactSpots`, `interact.capacity`, `interact.durationMin`, `interact.durationMax`, asset defaults and validation metadata.

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

Canonical normalization helpers live in `src/blueprint-editor/types.ts` and must be used at every data boundary (migration, asset overrides, UI save, validation):

**Normalization helpers:**

- `normalizeInteractSpots(value)` — accepts legacy `[x,y]` tuples or `{x,y}` objects; rejects non-finite values and deduplicates.
- `normalizeInteractConfig(value)` — canonicalizes capacity (0/undefined → auto, >0 → integer) and duration (min default 1, max clamped to >= min, default 3).
- `normalizeTileEdges(value)` — validates `TileEdges[][]` structure.
- `normalizeWalkableGrid(value)` — validates `boolean[][]` structure.
- `normalizeTileState(value)` — validates `TileState[][]` structure.
- `normalizeAllowedRoleIds(value)` — validates and deduplicates a `string[]` of role ids.
- `normalizeTags(value)` — validates and deduplicates a `string[]` of tags.
- `normalizeOriginAsset(value)` — validates a single `AssetDef` from unknown input.
- `normalizeOriginAssetFile(value)` — validates an `OriginAssetFile` containing `originAssets[]`.

**Resolution helpers:**

- `resolveInteractForTarget(interact, interactSpotCount)` — single canonical resolver for the NPC engine's `capacity` / `durationMinSeconds` / `durationMaxSeconds`. Adapters must call this instead of inlining defaults.
- `resolveObjectDef(rotation, asset)` — resolves a `ResolvedObjectDef` (dimensions, walkable, padding, radius) from an origin asset and rotation.

**Validation helpers:**

- `validateLayoutData(data)` — schema-gate validator that calls the normalize helpers to reject malformed anchor/interact/tile fields.
- `validateLayoutIntegrity(layout)` — post-load integrity check reporting duplicate ids, orphaned references, and structural issues.
- `isNpcConfig(value)` — type guard for `NpcSimulationConfig`.
- `isAssetDef(value)` — type guard combining `isSimpleAsset`, `isLinkedAsset`, and `isSvgAsset`.

**Grid rotation helpers:**

- `rotateGrid90(grid, times)` — rotates a `T[][]` grid by 0/90/180/270 degrees.
- `rotateTileEdges90(edges, times)` — rotates a `TileEdges[][]` grid by 0/90/180/270 degrees.

### Normalization planning gate (mandatory before implementation)

This gate activates when any of the following are true:

- The feature touches `migrate.ts`, `dataLoader.ts`, `persistence.ts`, or `validateLayoutData()`.
- The feature adds, modifies, or removes a field on `AssetDef`, `RoomData`, `ObjectData`, `InteractConfig`, `InteractSpot`, `TileEdges`, `WalkableGrid`, or `TileState`.
- The feature changes how data flows between the editor, persistence, sync DTO, or NPC engine adapters.
- The feature adds a new UI form that saves user-entered data into a persisted structure.
- The feature adds a new consumer of `interact`, `interactSpots`, `tileEdges`, `walkableGrid`, or `tileStates`.
- The user says "normalize", "data boundary", "migration", "validation", "sync", "override", or "canonical".

Before implementing any feature that touches data flow, you MUST complete this planning step before writing any feature code:

1. **Identify data boundaries**: List every point where external, legacy, user-entered, or synced data enters or leaves the system.
2. **Map to canonical helpers**: For each boundary, name the specific `normalize*` / `validate*` / `resolve*` helper from `types.ts` that applies. If no helper exists, plan to create it first.
3. **Plan resolution points**: For each consumer, confirm whether it should call a `resolve*` helper instead of inlining defaults.
4. **Flag inheritance risks**: State how new fields will be resolved from origin asset to placed objects.
5. **State the plan**: Include a short "Normalization plan" section. If no data boundary is touched, state "No data boundaries touched" explicitly.

#### Anti-patterns to reject

- **Inline defaults** in consumers: `interact?.durationMin ?? 1` scattered across adapters. Use `resolveInteractForTarget()`.
- **Raw cast** at migration: `interact: r.interact as InteractConfig`. Use `normalizeInteractConfig()`.
- **`Object.assign` without re-normalize** in override patches. Re-normalize after merging.
- **New field without helper**: adding a definition field but no `normalize*` helper at the boundary.
- **Snapshot on `ObjectData`**: copying a definition field onto placed objects instead of resolving from origin.

### Definition type change gate (mandatory after implementation)

After implementing any change that adds, removes, renames, or changes the shape of a field on `AssetDef`, `RoomData`, `ObjectData`, `InteractConfig`, `InteractSpot`, `TileEdges`, `WalkableGrid`, `TileState`, or `OriginAssetFile`, you MUST run this verification sequence before marking the task complete:

1. **Invoke the `normalize-audit` skill**: Run the full audit procedure against the changes just made. Fix any FAIL verdict before proceeding.
2. **Run `npm run verify:assets`**: Validates `originAssets.json` against the current `AssetDef` shape.
3. **Run `npm run test:npc-engine`**: NPC engine tests load `originAssets.json` and exercise anchor/interact/walkable resolution.
4. **Run `npx vite build`**: Confirms the type change compiles and the data file imports cleanly.
5. **Report**: State which gates passed and which failed. Do not declare the feature done until all gates pass.

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
  interactSpots?: InteractSpot[]
}
```

Do not overwrite the inherited snapshot or treat ad-hoc fields on `ObjectData` as implicit overrides.

### One-way data persistence (mandatory for all CRUD)

Every CRUD operation (create, update, delete, duplicate, rename, reorder, move, rotate, link/unlink, toggle, add/remove tag, pool count change, spawn rule change) MUST write to disk before returning. There is no in-memory-only mutation path for persisted data.

**Principle:**

```text
user action
    -> mutate state.layout / state.assetRegistry / state.layout.npcConfig
    -> await saveLayout() / saveAssets() / persistNpcConfigToDisk()
    -> return
```

**Rules:**

1. **No fire-and-forget saves.** Never use `void store.saveLayout()` or `void store.persistNpcConfigToDisk()`. Always `await` the save before returning from the CRUD function. Fire-and-forget causes race conditions in `withStateLock` and data loss on refresh.
2. **No in-memory-only state for persisted data.** Do not maintain a separate in-memory copy (e.g. `_customTags`, `draft`, `cache`) that shadows persisted data without syncing back to disk. If an in-memory cache exists, every mutation must trigger a disk write.
3. **One file per data domain.** Layout data writes to `blueprintLayout.json` via `saveLayout()`. NPC config writes to `npcConfig.json` via `persistNpcConfigToDisk()`. Asset registry writes to `originAssets.json` via `saveAssets()`. A CRUD function that touches multiple domains must await all relevant saves sequentially.
4. **Save inside the store function, not the component.** The store function that mutates state is responsible for calling the save. Components should not need to call save separately. If a component calls a store CRUD function, the save is already done.
5. **Debounce is allowed for high-frequency updates** (e.g. drag, real-time slider) but the final value MUST be flushed to disk on interaction end (mouseup, modal close, blur, deploy).
6. **UI-only state is exempt.** Selection state, mode, drag state, zoom level, and panel position are not persisted data and do not need disk writes.

**Anti-patterns to reject:**

- `void store.saveLayout()` — fire-and-forget, may not complete before refresh.
- `_customTags.add(tag)` without `await saveLayout()` — in-memory mutation without disk write.
- `draft.value.pool.push(...)` without `schedulePersist()` or `await persistNpcConfigToDisk()` — mutation without persistence.
- Component calling `store.removeTag()` then separately calling `store.saveLayout()` — save should be inside `removeTag`.
- Two saves fired in parallel (`void saveLayout(); void persistNpcConfigToDisk()`) — race condition in `withStateLock`. Await sequentially.

### Shared NPC Engine Architecture

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

The shared engine owns: target selection and role/task conditions, multi-anchor interaction targeting, walkable/blocked/door obstacle checks, pathfinding and repathing, item/anchor reservations and capacity, waiting state when an item is full, NPC movement occupancy and overlap prevention, interaction duration in seconds (converted to ticks internally), randomized duration between min/max, and engine events (waiting, interaction start/end, blocked/repath).

Adapters own only: converting source layout data into the canonical engine layout, lifecycle/timing (`requestAnimationFrame`, game loop, pause/resume), rendering NPCs and debug paths, and mapping engine events to UI/game effects.

**NPC identity vs behavior source:** The Editor preview and the main game do not share spawn identities. The Editor adapter creates temporary preview agents from NPC config. The main-game adapter creates agents from live game entities (staff, assassins, guests, visitors), preserving game id, role, color, stats, and lifecycle. Both pass agents through the same `NpcEngine`.

Do not import a Vue composable into the main game as the shared engine. Extract pure engine code under `src/engine/npc/`, then keep `useNpcSimulation.ts` and `useGameNpcSimulation.ts` as thin adapters.

### CSS rules

CSS rules are defined in `.windsurf/rules/css-class-reduction.md`. Key points:

- **BEM naming:** `block__element` for structural parts, `block--modifier` for states/variants. No triple `__`.
- **CSS layering:** Tier 1 (base.css) → Tier 2 (components.css) → Tier 3 (subsystem css) → Tier 4 (Vue SFC scoped).
- **No hardcoded values:** Use `var(--*)` from `variables.css`.
- **Vue `:class` bindings:** Quote class keys containing `--` to avoid JS parse errors.

## Before Finishing

After completing any task, verify:

1. **Build passes:** `npx vite build` — no errors.
2. **NPC engine tests:** `npm run test:npc-engine` — passes (if engine or data touched).
3. **Asset validation:** `npm run verify:assets` — passes (if `AssetDef` or `originAssets.json` touched).
4. **No BEM violations:** Use `block__element`, `block--modifier`, or `block__element--state` according to ownership. Do not use `block--element-state`, structural `block--empty`/`block--selected`, a single hyphen as a BEM separator, or triple `__`.
5. **No unquoted `--` in `:class` bindings:** All `--` class keys in Vue `:class` object syntax must be quoted.
6. **No dead CSS:** Removed classes have no remaining template/script/dynamic usage.
7. **No redundant base duplications:** Variant/state classes don't re-declare properties the base element selector already provides.
8. **Definition type change gate:** If `AssetDef`, `ObjectData`, or related types changed, run the full gate (normalize-audit + verify:assets + test:npc-engine + build).
