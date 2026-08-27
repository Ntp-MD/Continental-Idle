---
name: normalize-audit
description: Pre-flight audit for data boundary normalization. Invoke before implementing a feature that touches data flow (migration, loading, persistence, sync, UI save, validation, engine adapter) to verify the normalization plan is complete and no boundary is missed. Also triggers on "normalize audit", "data boundary check", "normalization plan", "canonical check".
---

# Normalize Audit Skill

Use this skill to audit a feature plan (or existing code) against the canonical normalization boundary rules in the project's agent rules and normalization boundary rule files.

## When to invoke

- Before implementing a feature that touches any data flow: migration paths, JSON loaders, persistence endpoints, layout validators, sync DTOs, NPC engine adapters, or UI forms that save persisted data.
- When the user asks "normalize audit", "check normalization", "data boundary check", "normalization plan", or "canonical check".
- When adding or modifying a field on any definition type (asset, room, object, interact config, anchor, wall segment, walkable grid, tile state).
- **Mandatory after implementing any change to a definition type or origin asset file** — see the "Definition type change gate" in the project agent rules. After the audit, also run the asset verification command to validate the data file against the new type shape.

## Audit procedure

Run this procedure and report findings as a table. Do not skip steps.

### Step 1 — Inventory data boundaries

Search the codebase for every point where the feature reads or writes external/legacy/user/synced data. Check at minimum these boundary categories:

- Migration paths — where legacy shapes are converted to canonical shapes
- JSON loaders — where external data enters the system, including override application
- Persistence endpoints — save/load boundaries
- Layout validators — strict shape validation entry points
- UI form saves — components that write persisted data
- Editor engine adapters — composables that adapt editor data to the engine
- Runtime adapters + sync DTOs — components and layout modules that build the synced payload

For each boundary found, record: file, line range, what data shape enters/leaves.

### Step 2 — Map to canonical helpers

For each boundary, name the specific normalization helper from the types module that must be used. At minimum these helper categories must exist and be applied:

| Helper category | Applies to |
|---|---|
| Anchor normalization | anchor arrays at any boundary |
| Interact config normalization | interact objects at any boundary |
| Wall segment normalization | wall segment arrays at any boundary |
| Walkable grid normalization | boolean walkable grids |
| Tile state normalization | tile state grids |
| Engine target resolution | engine adapter target building (NOT at persistence boundary) |
| Anchor bounds/walkable validation | anchor bounds and walkable checks |
| Grid consistency reporting | grid consistency checks |

If a boundary handles a shape with no matching helper, flag it as **GAP — needs new helper**.

### Step 3 — Detect anti-patterns

Search the touched files for these anti-patterns and report each occurrence:

- **Inline defaults**: reading optional fields with `??` fallbacks outside the dedicated engine resolution helper. These must be replaced with the engine target resolution helper.
- **Raw cast at migration**: type assertions (`as <DefinitionType>`) in migration paths. These must pass through the corresponding normalization helper instead.
- **Override patch without re-normalize**: merging overrides via `Object.assign` (or similar) without re-normalizing the result.
- **Snapshot on placed object**: a definition field copied onto a placed object without an explicit override model.
- **New definition field without helper**: a field added to a definition type that has no normalization helper at the boundary.

### Step 4 — Inheritance risk check

If the feature adds or modifies a definition field on an origin type:

1. Confirm the field is on the origin type, not copied onto the placed object type as an editable snapshot.
2. Confirm the field is included in persistence/sync if runtime needs it.
3. Confirm the layout validator validates the new field shape.
4. If the placed object carries the field, confirm it is resolved from origin (read-only snapshot for engine use) and not independently editable — unless an explicit overrides model exists.

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
- Do not invent helpers that do not exist in the types module. Flag missing helpers as GAPs.
