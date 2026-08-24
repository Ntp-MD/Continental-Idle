# Core Principles

## Conventions

- Follow the language/framework idioms already used in the file you edit. Check neighboring files before choosing patterns, libraries, or structure.
- Never assume a library is available because it is well known; verify the project already uses it.
- Keep imports at the top of modules.
- Follow security best practices. Never log or commit secrets and keys.

## Comments and documentation

- Do not add code comments unless explicitly requested.
- Do not create `*.md` documentation files unless explicitly requested.

## Simplicity and scope

- Prefer direct, understandable implementations. Do not introduce services, databases, queues, event buses, generic repositories, facades that only forward calls, or other infrastructure without a demonstrated need.
- Do not optimize for scale the product does not have (multi-user sync, remote deployment, caching layers) unless scope changes.
- Preserve user data. Validate cross-references whenever data domains are split or recombined.
- Compatibility wrappers may exist during migration, but never two independent implementations of the same operation.

## Dead code and cleanup

- When removing a class, function, modifier, or pattern, remove every reference project-wide in the same change: call sites, templates, styles, string literals.
- Zero-delta duplicates (code identical to what it extends or wraps) are dead code; remove them instead of keeping both.
- Do not introduce a replacement unless the product requires it. If something is simply unused, delete it and stop.

## Verification

- After implementation, verify with commands appropriate to the touched boundaries: typecheck, tests, lint, production build.
- Choose verification by boundary: persistence/migration changes need read-back checks; engine changes need engine tests; template/style changes need markup lint if one exists.
- Report unrelated pre-existing failures separately; do not hide them or change unrelated systems just to make a legacy test pass.

## Decisions (ADR)

- 2026-08-24 — No undo/redo in the blueprint editor (owner decision). Destructive actions rely on confirm dialogs that must state the truth ("cannot be undone"); never reference Ctrl+Z. Safety net is per-mutation autosave via `saveBlueprintData` plus explicit confirms for delete/street-assign. Revisit trigger: user requests history after losing work.
- 2026-08-24 — Placed objects are rotation-only editable; every other detail renders read-only and inherits live from its origin asset. Asset color model = `defaultFillColor` + `defaultStrokeColor` (outline auto-derived from fill when unset; theme fallback `--asset-outline`). `defaultBgColor` removed along with instance-level fill/stroke overrides and `updateObjectProps`/`addAsset` dead paths. Revisit trigger: user asks for per-instance recoloring again.
- 2026-08-24 — Removed the unused CRUD facade layer (crud/npcSettings.ts deleted; list/get/create/update/delete wrappers across originAssets/floorPlan/tagManager trimmed to survivors actually called by UI: `getFloor`, object/floor mutations, tag `ensureTag`). UI talks to store modules directly; reintroduce wrappers only when a second consumer appears. Trade-off: less API surface vs. slightly longer import paths. Revisit trigger: a non-Vue consumer needs framework-free data access.
- 2026-08-24 — Walkable contract: `asset.walkable` is the MASTER "passable" switch. When true, engine ignores walkableGrid/tileEdges entirely (objectBlocksTile returns early) and the panel disables Doors & Edges. When false, per-tile grid governs. Flattened assets always reset to fully-blocked so authors paint passages deliberately (deny-by-default). Rotation rotates grid/states/edges/spots CW consistently (verified by harness). Revisit trigger: sub-tile collision precision is ever needed.
- 2026-08-24 — Economy v1 was prototyped (engine/economy.ts + HUD + localStorage) then removed the same day - too early for the product. Design is preserved in git history (search "Economy v1" in earlier commits): income = rate x active interacting guests, flat tip per visit, offline earnings at reduced rate with hard cap, strict save parser that discards malformed blobs. Revisit trigger unchanged: player asks what cash/goals are for, or a spending sink gets designed first.
