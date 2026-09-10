# Project skills

This project only. Never ships with the harness. Read the matching section before touching its domain - `AGENTS.md` states the rules, this file states the domain facts.

## Data audit

Run this procedure before implementing a feature that touches any data flow (migration, loaders, persistence, sync, validation, engine adapters, UI saves), and report findings as a table. Do not skip steps. Read-only audit: propose fixes, do not modify code during the audit.

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

## Hotel floor layout methodology

Scale and rules for authoring any hotel floor plan (hand edit or temp generator). Every floor layout follows this - do not re-derive the numbers.

### Scale (see glossary: Tile scale)

- 1 tile = 0.5 m. Plot 107 x 67 tiles = 53.5 x 33.5 m. Street ring 8 tiles (4 m) surrounds the building; building interior tiles x9..97, y9..57 = 45.5 x 25.5 m (~1160 m2).

### Room size standards (hotel reference)

| Room | Target area | Rules |
| ---- | ----------- | ----- |
| Lobby | 100-200 m2 | Biggest public space; must contain the street-door axis; reception desk faces the entrance corridor |
| Restaurant | 1.5-2 m2 per seat | Main dining on ground floor; kitchen adjacent behind it with a service door |
| Kitchen | 25-30% of restaurant | Back-of-house |
| Bar-lounge | 80-170 m2 | |
| Gym | 40-80 m2 | City-hotel gym; scale treadmill count to area |
| Laundry | 30-60 m2 | Back-of-house |
| Public bathroom | 9 m2 (2 x 4.5 m) | Row of single-occupancy rooms; door and fixtures on the room's center column |
| Staff room / Storage | 25-35 / 20-30 m2 | Back-of-house block |
| Corridors | 2 m wide (4 tiles) | 10-15% of floor; EVERY room door opens onto a corridor; no dead-end rooms |

### Placement rules

1. Rooms are floor tile states (`blocked` walls + `door` tiles) - never authored room data; rooms derive automatically (`deriveFloorRooms`).
2. Furniture on grid: same row = same y, same column = same x, uniform pitch, mirrored pairs exact; fixtures keep 1 tile from walls.
3. A room's door tile aligns with its fixture column; furniture never blocks a door tile or the 2-tile path from any door.
4. Spawn zone sits just inside the street entrance on the entry corridor.

### Generator validation checklist (temp `tests/_*.tmp.ts`, deleted same session)

1. Grid dims + furniture inside building interior + furniture never on wall/door tiles + zero object overlap.
2. BFS from spawn: 100% of interior walkable tiles reachable + every door tile + per-room sample tiles.
3. Report room areas in m2 (tiles x 0.25) in the run output.
4. After write: `verify:assets`, `test:blueprint-schema`, `test:migrate`; keep NPC pool consistent with floor count.

### Design process (architect sequence - never draw walls first)

1. **Program first**: derive rooms/areas from occupant load BEFORE any layout. Occupant load = NPC pool count (see `npcSettings` pool). Formulas: guest rooms = ceil(guests / 2); restaurant seats = guests x 0.65; kitchen = 25-30% of restaurant; toilet fixtures = ceil(guests / 25) grouped into 9 m2 rooms; corridor 10-15% of floor. Ground floor = public program; guest rooms live on upper floors.
2. **Bubble diagram -> adjacency**: list required adjacencies before walls - kitchen next to restaurant (service door), laundry near service corridor, bathrooms distributed (never one cluster serving a whole floor), lobby touches every public zone via corridor, staff/storage reachable without crossing guest areas. Guest flow and service flow must not cross.
3. **Zoning**: place zones by entrance/orientation first, then corridors, then walls, then furniture. Walls are the LAST drawing step, not the first.
4. **Egress rules**: every interior tile within ~12 m (24 tiles) of a door leading to an exit path; no dead-end corridor longer than 4 tiles; each floor keeps at least 2 independent exit paths where the floor size allows.
5. **Evaluate, then iterate**: after layout compute metrics - corridor %, largest room vs target table above, walk distance (tiles) from entrance to farthest room door, dead-space %. Re-partition if a metric is off; do not just add furniture to fill space.

### Adjacency quick-reference

| Room | Must touch | Must NOT touch |
| ---- | ---------- | -------------- |
| Kitchen | Restaurant (service door) | Lobby, dining sightlines |
| Laundry/Storage | Service corridor | Lobby, restaurant |
| Bathrooms | Corridor | Kitchen, restaurant dining area |
| Staff room | Back-of-house block or lobby edge | Guest rooms |
| Gym/Spa | Corridor | Kitchen |

## Layout

Canonical form/markup/CSS/class patterns for `src/blueprint-editor/` UI.

### Rules

1. Reuse first, approval to add. Grep `src/styles/components.css` plus neighboring components for a class covering the role; extend with a modifier carrying only the delta. A new class, component, token, or UI label needs explicit user approval first.
2. Two-section rows use `.form__row.form--start > div { flex: 1; }`: one row, plain `div` groups, never a `form__row` nested inside a `form__row`. Nesting is only for horizontal controls whose children are not `div`s. Groups stack as `form__col`; sections separate with `form__col form--section`.
3. Tabs use shared `.tabs__bar` / `.tabs__tab` with `role="tablist"`; the bar stays fixed while only the panel scrolls. Never per-component tab classes. Selection uses `flag--active` like every other UI control.
4. Showcase gate: a new UI primitive or wrapper must appear in `src/dev/UiShowcase.vue` in the same change. CRUD gate: a new/changed/removed store CRUD function must update `docs/crud-reference.md` in the same change. Static SVG samples need no CSS and no extra entry. Feature panels reachable through an already-showcased modal need no extra entry.
5. Labels use player vocabulary, never schema names ("Shape Radius" not "Label Radius"). Test: read the label to someone who never saw the code - if they cannot guess, rename it.
6. No static inline `style="..."`; dynamic `:style` only for runtime values. No `!important`. No `box-shadow` / `drop-shadow`; state via borders only. Spacing uses `--gap-*` tokens.
7. A class is shared/global only when: 3+ real call sites, same role/interaction/accessibility/responsive/scope, no existing class covers it, name describes a role not an appearance, and no token can replace it.

### Naming (BEM)

- `block__element` for structure, `block--modifier` for block states, `block__element--state` for element states. No triple `__`, no hyphen-simulated compounds.
- State vocabulary for UI controls is `flag--*` ONLY (selection = `flag--active`). Block-specific `--state` classes are allowed only for domain rendering internals (canvas drawing, grid tile states).
- Different block prefixes are not a reason to keep duplicates: same semantic role across files merges into one shared class. Coincidental declaration matches with differing roles stay separate.

### Scope and cascade

- Shared semantic class -> shared/global stylesheet. Subsystem-shared -> subsystem stylesheet. Single-component -> scoped style. Never cross these lines.
- A base class owns its full declaration set; an extending class declares only the delta. Zero-delta classes are dead code.
- Layers, base first: `reset.css` -> `components.css` -> `layout.css` -> scoped styles. Never re-declare a property + value the lower layer already provides without explicit user approval in the same change.
- Inputs size to their value by default (`field-sizing: content`, `min-width: 5ch` floor); never cap with `max-width`. `select` and `textarea` fill their row. Sizing is explicit per element (`size--fit` / `size--fill` / `size--stretch`).
- Buttons follow the `reset.css` padding; custom padding needs approval (except structural controls: grid-cell buttons, icon-only close/remove, hidden overlay inputs).

### Grid editor parity

`WalkableGridEditor.vue` (asset) and `FloorWalkablePanel.vue` (floor) are deliberately separate - do NOT merge them. Touching brushes, modes, hints, legends, or tile visuals in one requires checking the other in the same change. Shared math stays in the domain types module (pure normalize helpers).

### Component patterns

- Store: components import from the shared blueprint store (`useAssetsStore` and friends). Do not import store internals directly, and do not create pass-through facade files.
- Modals: wrap in `ModalShell` with `:open` / `@close`. Load heavy or rarely opened modals with `defineAsyncComponent`.
- Unsaved-changes tracking: `useDirtyBaseline` - one baseline snapshot plus a `dirty` computed. Do not hand-roll dirty flags, and do not stringify state for comparison.
- Concurrency: store-level mutations use `withStateLock`; UI pending state uses `useAsyncAction`. One guard per layer, no extra boolean flags duplicating the guard.
- Walkable-grid domain logic (tile states incl. door tiles) normalizes in the domain types module as pure functions. Components compose it, never re-implement the math inline.
- Declarative schemas: canvas/editor settings are parsed via `CANVAS_FIELD_SPECS` / `EDITOR_FIELD_SPECS`. Never enumerate their keys by hand elsewhere.
- Confirmation: `useConfirm().confirm` from `@/composables/useConfirm`, never `window.confirm`. User feedback: `useToast` for visible messages, `editorLog` for console diagnostics. Never `alert` / `console.log` for user-facing state.

### Compliance check before completion

After touching markup, styles, or classes, verify project-wide: no dead selectors, no orphan classes, no shared class redefined in scoped styles, every class in its scope's file, no stale references, every shared class has 3+ call sites, no zero-delta classes, no unmerged same-role pairs, no merged differing-role pairs, no redundant inherited declarations, no layer duplicates without approval, zero new classes without an approval reference.
