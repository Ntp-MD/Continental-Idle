# Data flow, domain, and engines

Project domain facts for data boundaries, persistence, definitions/instances, tags, canonical helpers, field-change checklists, and engines. `AGENTS.md` states the rules; `skill.md` routes here.

## Activation

- Use: task touches migration, loaders, persistence, sync, validation, engine adapters, UI saves, definition fields, tags, or `src/blueprint-editor/data/` modules.
- Don't use: pure markup/CSS reflow, hotel floor geometry, or engine-internal algorithm tuning with no boundary crossed.

## Data audit

Read-only audit (propose fixes, do not modify code) before implementing any data-flow feature. Follow the steps in order; skip a step only with a stated reason. Report findings as a table.

### Step 1 - Inventory data boundaries

Search the codebase for every point where the feature reads or writes external/legacy/user/synced data. Check at minimum: migration paths, JSON loaders (incl. override application), persistence endpoints, layout validators, UI form saves, editor engine adapters, runtime adapters + sync DTOs. Record file, line range, what data shape enters/leaves.

### Step 2 - Map to canonical helpers

For each boundary, name the specific normalization helper from the types module. Minimum catalog:

| Helper category | Applies to |
|---|---|
| Interact-spot normalization | interact-spot arrays (stand/edge/post) at any boundary |
| Interact config normalization | interact objects at any boundary |
| Task post reference validation | task.post asset/post refs at any boundary |
| Walkable grid normalization | boolean walkable grids |
| Tile state normalization | tile state grids |
| Engine target resolution | engine adapter target building (NOT at persistence boundary) |
| Spot bounds/walkable validation | spot bounds (incl. edge anchors) and walkable checks |
| Grid consistency reporting | grid consistency checks |

A boundary with no matching helper is **GAP - needs new helper**.

### Step 3 - Detect anti-patterns

Decision rule: reuse the canonical helper when it covers the shape without changing its contract; create a new helper only when no helper covers the shape (mark GAP). Never inline the logic at the call site.

- Inline defaults: reading optional fields with `??` fallbacks outside the engine resolution helper.
- Raw cast at migration: type assertions (`as <DefinitionType>`) bypassing normalization.
- Override patch without re-normalize: merging overrides without re-normalizing.
- Snapshot on placed object: definition field copied onto a placed object without an override model.
- New definition field without helper.

### Step 4 - Inheritance risk check

For a new/modified definition field on an origin type confirm: it lives on the origin (not an editable snapshot on the instance); it is included in persistence/sync if runtime needs it; the layout validator covers it; instance copies (if any) resolve read-only from origin.

### Step 5 - Report

```text
## Normalize Audit Report

### Boundaries touched
| File | Lines | Data shape | Helper used | Status |

### Anti-patterns found
- <file>:<line> - <pattern> - <fix>

### Inheritance risks
- <field> - <risk> - <mitigation>

### Gaps (need new helper)
- <shape> - <proposed helper name>

### Verdict
PASS / FAIL - <summary>
```

If no boundary is touched, report "No data boundaries touched" and exit. Always cite exact file paths and line numbers.

## Data, persistence, and domain

### Definitions and instances

- A reusable definition (identified by id) owns defaults, validation metadata, tags, configuration. An instance references it by id and owns only position/rotation/instance-specific overrides.
- An instance must not carry a second editable copy of definition data.
- Never infer or update a definition from an instance edit.
- When adding/changing a definition field: add to definition + canonical persisted shape, normalize at every ingress boundary, resolve from the definition wherever instances are created/rendered/edited/persisted/synced/simulated, propagate by re-resolving.

### Data boundaries and normalization

- Normalization happens at ingress: accepts unknown input, returns canonical data or rejects; idempotent; context-free.
- Resolution happens before consumption: derives runtime values from canonical data + context; deterministic; the single path.
- Never combine normalization and resolution in one helper.
- Canonical helpers are the single entry point for their shapes.
- No inline defaults where a resolver exists. No raw casts bypassing migration. No untrusted patches without re-normalizing. No persisted fields without a validation path.

### Persistence and CRUD

- Persisted domain data has one source of truth. UI-only state stays out.
- A committed action reports success only after persistence succeeded and was verified/read back. Await saves; no fire-and-forget, no parallel saves for one action.
- High-frequency UI changes may draft in memory but flush once at interaction end.
- User-facing deletes confirm at the UI boundary. Cancelling a draft is not a delete.
- Failed saves revert in-memory state to the last saved snapshot and report failure.
- Destructive entity deletes: confirm -> persist -> verify -> report.

### Sync payload (editor <-> game)

- Egress is `buildSyncedPayload` and ingress is `loadSyncedPayload`, both in `src/blueprint-editor/syncedPayload.ts` (pure - no store/DOM imports, so it runs headless). The runtime boot loader uses the ingress loader and any future sync caller uses the egress builder from this one module; never re-inline the payload conversion at a caller (the old `scripts/observe-hotel.ts` inline was the anti-pattern). Note: the toolbar Sync Game button was removed, so `buildSyncedPayload` currently has no UI trigger.
- Floor sync keys are a stable function of each floor's identity (`assignSyncKeys`): a canonical `label` (`G`/`F<n>` -> `G`/`<n>`) wins, otherwise the floor `id` order decides the ordinal and the `_N` collision suffix. Never derive a key from array position - reordering floors must not change any key.
- `loadSyncedPayload` normalizes at ingress (`normalizeFloorWalkable`, `normalizeNpcSpawnZones`, `normalizeAllowedRoleIds`) and orders floors `G` first then numeric (`compareFloorKeys`). Asset definitions stay a caller concern - the runtime passes its asset map into the engine, the loader returns only `FloorData[]` + canvas.

### Tags

- Tag definitions are separate from tag references on entities.
- Deleting a definition must not silently destroy references unless cascade is explicitly chosen.
- Undefined/orphan tags must not silently control matching.
- Comparison and persistence use the canonical tag normalization helper.

### Origin asset authoring

- The canonical persisted store is ONE `src/blueprint-editor/data/blueprint-data.json` (in the `BlueprintDataFile` shape), read/written by the dev middleware at `/__blueprint-data` (GET load / POST save) with atomic temp+rename writes. It is the single source: the `*.data.ts` seed modules and the `seed:blueprint-data` script are retired. `store/seed.ts` (`defaultSeed()`) reads the JSON through `readBlueprintDataFile` for tests; it is NOT part of the app bundle - the app boots from `emptySeed()` and fills from the persistence port via `reloadEditorData()`. Never restore the JSON via `git checkout` (the persisted store lives at runtime; git is not the write path).
- Re-read the file immediately before editing - the editor save-flow rewrites it at any moment.
- Creation defaults apply at creation time only; never migrate existing assets by hand.
- SVG v2: body shapes use `var(--obj-fill,...)` / `var(--obj-stroke,...)`; detail lines use `--text-secondary`; hollow detail shapes keep a literal `fill="none"`. Never hardcode decorative colors inside asset art. Every surface rendering asset SVG sets the theme variables first. The SVG is the whole visual - no backing plate.
- Colors accept hex or `transparent`; validate with the transparent-capable validator. Outline auto-derives from hex fills only.
- Persistence limits live in ONE module (`src/blueprint-editor/limits.ts`): `MAX_GRID_ROWS/COLUMNS` 256, `MAX_FLOORS` 100, `MAX_OBJECTS_PER_FLOOR` 10 000, `MAX_ASSETS` 1 000, `MAX_ASSET_TILES` 256, `MAX_PAYLOAD_BYTES` 5 MB. Because a save is whole-file and atomic, EVERY ingress normalizer AND every construction path must use these same numbers - one entity past a limit otherwise makes every later save fail. `parseCanvasConfig` rejects a canvas whose `ceil(size/tileSize)` exceeds the grid cap; `resizeCanvas`/`addSvgAsset`/`addFloor`/`addObject`/`pasteObjects`/`flattenToSvgAsset`/`duplicateAsset` reject at the same caps; `buildWalkableGrid` returns `undefined` past the grid cap.
- Before reporting done: asset verification passes with ZERO warnings; ids unique; sizes are tile counts unless the pixel-size flag is set.

### AssetDef field change checklist (`domain/types.ts`)

Same change must update all of the following:

1. `ASSET_DEF_FIELD_COVERAGE` (`assets/assetUtils.ts`)
2. `sample` fixture (`tests/test-asset-schema.ts`)
3. `serializeAsset` whitelist
4. `updateAsset` patch union (`store/assets.ts`)
5. `OriginSettingPanel.vue` / `AssetProperties.vue` wiring if user-editable

### CanvasConfig field change checklist (`domain/types.ts`)

Same change must update all of the following:

1. `CANVAS_FIELD_SPECS`
2. Canvas Settings row (`components/modals/SettingsModal.vue`) + setter (`store/mode.ts`) if user-editable
3. `SyncedCanvas` + `syncedPayload.ts` mirror if the game needs it (never editor-only fields)
4. Round-trip cases in `tests/test-blueprint-schema.ts`

## Domain engines

- Editor preview and runtime share one pure engine implementation, independent of UI frameworks. Adapters own lifecycle/rendering only.
- Convert persisted units to engine units only inside the runtime adapter.
- Never duplicate engine behavior in UI components or adapters.
- Tests pass explicit `random` (seeded or constant) in every engine options object; never rely on the `Math.random` fallback.

## Verify

- Route via `node harness/scripts/verify.mjs route`; run the single matching suite (schema/persistence/sync changes: the matching `test:<name>`; engine changes: the matching `test:<name>`; never the full matrix).
- Field-checklist changes: all 5 AssetDef (or 4 CanvasConfig) items updated in the same change, plus the routed suite green.