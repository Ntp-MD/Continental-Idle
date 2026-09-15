# Data flow, domain, and engines

Project domain facts for data boundaries, persistence, definitions/instances, tags, canonical helpers, field-change checklists, and engines. `AGENTS.md` states the rules; `skill.md` routes here.

## Data audit

Run this procedure before implementing a feature that touches any data flow (migration, loaders, persistence, sync, validation, engine adapters, UI saves), and report findings as a table. Follow the steps in order - a step may be skipped only with a stated reason (e.g. no boundary of that kind touched). Read-only audit: propose fixes, do not modify code during the audit.

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

### Tags

- Tag definitions are separate from tag references on entities.
- Deleting a definition must not silently destroy references unless cascade is explicitly chosen.
- Undefined/orphan tags must not silently control matching.
- Comparison and persistence use the canonical tag normalization helper.

### Origin asset authoring

- The FOUR `src/blueprint-editor/data/` modules (`floorPlan`, `originAssets`, `npcSettings`, `tagManager`) are the ONLY persisted store (dev middleware, no JSON snapshot). Never restore via `git checkout` (`guard:data-restore`).
- Re-read the file immediately before editing - the editor save-flow rewrites it at any moment.
- Creation defaults apply at creation time only; never migrate existing assets by hand.
- SVG v2: body shapes use `var(--obj-fill,...)` / `var(--obj-stroke,...)`; detail lines use `--text-secondary`. Never hardcode decorative colors inside asset art. Every surface rendering asset SVG sets the theme variables first. The SVG is the whole visual - no backing plate.
- Colors accept hex or `transparent`; validate with the transparent-capable validator. Outline auto-derives from hex fills only.
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