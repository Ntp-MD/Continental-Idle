---
name: normalize-audit
description: Pre-flight audit for data boundary normalization. Invoke before implementing a feature that touches data flow (migration, loading, persistence, sync, UI save, validation, engine adapter) to verify the normalization plan is complete and no boundary is missed. Also triggers on "normalize audit", "data boundary check", "normalization plan", "canonical check".
---

# Normalize Audit Skill

Use this skill to audit a feature plan (or existing code) against the canonical normalization boundary rules in `AGENTS.md` and `.windsurf/rules/normalize-boundary.md`.

## When to invoke

- Before implementing a feature that touches any data flow: `migrate.ts`, `dataLoader.ts`, `persistence.ts`, `validateLayoutData()`, sync DTOs, NPC engine adapters, or UI forms that save persisted data.
- When the user asks "normalize audit", "check normalization", "data boundary check", "normalization plan", or "canonical check".
- When adding or modifying a field on `AssetDef`, `RoomData`, `ObjectData`, `InteractConfig`, `AnchorPoint`, `TileEdges`, `WalkableGrid`, or `TileState`.
- **Mandatory after implementing any change to `AssetDef`, `RoomData`, `ObjectData`, `InteractConfig`, `AnchorPoint`, `TileEdges`, `WalkableGrid`, `TileState`, or `OriginAssetFile`** — see "Definition type change gate" in `AGENTS.md`. After the audit, also run `npm run verify:assets` to validate the data file against the new type shape.

## Audit procedure

Run this procedure and report findings as a table. Do not skip steps.

### Step 1 — Inventory data boundaries

Search the codebase for every point where the feature reads or writes external/legacy/user/synced data. Check at minimum:

- `src/blueprint-editor/store/migrate.ts` — migration paths
- `src/blueprint-editor/store/dataLoader.ts` — JSON load + `applyAssetOverrides`
- `src/blueprint-editor/store/persistence.ts` — save/load endpoints
- `src/blueprint-editor/types.ts` — `validateLayoutData()`
- `src/blueprint-editor/components/*.vue` — UI form saves
- `src/blueprint-editor/composables/useNpcSimulation.ts` — editor adapter
- `src/components/overlays/HQOfficeView.vue` + `hqLayout.ts` — runtime adapter + sync DTO

For each boundary found, record: file, line range, what data shape enters/leaves.

### Step 2 — Map to canonical helpers

For each boundary, name the specific helper from `types.ts` that must be used:

| Helper | Applies to |
|---|---|
| `normalizeAnchorPoints` | anchor arrays at any boundary |
| `normalizeInteractConfig` | interact objects at any boundary |
| `normalizeTileEdges` | tile edge grids |
| `normalizeWalkableGrid` | boolean walkable grids |
| `normalizeTileStates` | tile state grids |
| `resolveInteractForTarget` | engine adapter target building (NOT at persistence boundary) |
| `validateAnchorsForOwner` | anchor bounds/walkable checks |
| `checkTileGridConsistency` | grid consistency reporting |

If a boundary handles a shape with no matching helper, flag it as **GAP — needs new helper**.

### Step 3 — Detect anti-patterns

Search the touched files for these anti-patterns and report each occurrence:

- **Inline defaults**: `interact?.durationMin ?? 1`, `interact?.durationMax ?? 3`, `interact?.capacity ?? anchors.length` outside `resolveInteractForTarget`. These must be replaced with `resolveInteractForTarget()`.
- **Raw cast at migration**: `as InteractConfig`, `as AnchorPoint[]`, `as TileEdges[][]`, `as boolean[][]`, `as TileState[][]` in `migrate.ts`. These must pass through the corresponding `normalize*` helper.
- **`Object.assign` without re-normalize** in `applyAssetOverrides` or similar override patches.
- **Snapshot on `ObjectData`**: a definition field copied onto a placed object without an explicit override model.
- **New definition field without helper**: a field added to `AssetDef`/`RoomData`/`ObjectData` that has no `normalize*` helper at the boundary.

### Step 4 — Inheritance risk check

If the feature adds or modifies a definition field on `AssetDef` or `RoomData`:

1. Confirm the field is on the origin type (`AssetDef`/`RoomData`), not copied onto `ObjectData` as an editable snapshot.
2. Confirm the field is included in persistence/sync if runtime needs it.
3. Confirm `validateLayoutData()` validates the new field shape.
4. If `ObjectData` carries the field, confirm it is resolved from origin (read-only snapshot for engine use) and not independently editable — unless an explicit `overrides` model exists.

### Step 5 — Report

Produce this report:

```text
## Normalize Audit Report

### Boundaries touched
| File | Lines | Data shape | Helper used | Status |
|---|---|---|---|---|
| ... | ... | ... | ... | OK / GAP / ANTI-PATTERN |

### Anti-patterns found
- <file>:<line> — <pattern> — <fix>

### Inheritance risks
- <field> — <risk> — <mitigation>

### Gaps (need new helper)
- <shape> — <proposed helper name>

### Verdict
PASS / FAIL — <summary>
```

## Constraints

- This skill is read-only audit. Do not modify code during the audit; propose fixes only.
- If the feature touches no data boundary, report "No data boundaries touched" and exit.
- Always cite exact file paths and line numbers as proof.
- Do not invent helpers that do not exist in `types.ts`. Flag missing helpers as GAPs.
