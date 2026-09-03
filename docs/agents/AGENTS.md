# AGENTS

Instructions for AI agents in this repo. Companion docs in `docs/agents/` (read the matching file before touching an area: core / css / data). Decision history in `docs/timeline-decision.md` (direction-level only).

## Verify

Run ONLY the suite matching what you changed, never the full matrix:

| Changed | Run |
|---|---|
| Template/markup/CSS/class (`*.vue`, `*.css`) | `lint:bem` + `lint:css` (+ `typecheck` if a Vue SFC changed) |
| Engine/domain TS | the single matching `test:<name>` |
| Schema/persistence/sync | the single matching schema suite |

Do NOT run `verify` / `test` matrices unless explicitly asked. Never run `test:npc-perf`, `test:npc-scale`, `test:behavior`, or `observe:hotel` unless asked for perf/observation data. Temp diagnostics go in `tests/_*.tmp.ts`, deleted same session, never committed.

| Command | Purpose |
|---|---|
| `npm run verify` | full chain (explicit asks only) |
| `npm test` | engine/schema suites |
| `npm run lint:bem` / `lint:css` | template↔CSS gates (orphan/dead/shared checks live here) |

## Change discipline

- **Correspondence.** Adding/renaming/removing a function, type field, CSS class, store export, or doc claim: grep BOTH names repo-wide (`src/ tests/ scripts/ *.md`), update every consumer — templates, re-exports, whitelists, showcase (`src/dev/UiShowcase.vue`), docs — in the SAME change. Zero references to removed symbols is done.
- **Read before write.** Files rewritten by tooling (codegen, editor save-flow, build) must be re-read immediately before editing. Current disk content beats any earlier snapshot.
- **Scope.** Blueprint editor only (`App.vue` boots `BlueprintEditor.vue`). Do NOT touch `src/engine/` or re-reference anything in `_archive/` unprompted. Never commit unless explicitly asked. No new infrastructure without demonstrated need.
- **Text.** Never round-trip file text through PowerShell (`Get-Content`/`Set-Content` corrupts UTF-8-without-BOM). Use Edit tool or Node scripts. ASCII-only source and copy (plain `-`, `...`, `deg`, `x`; SVG icons, never glyphs). No `box-shadow` / `drop-shadow` — state via borders only.

## Data & schemas

- The FOUR `src/blueprint-editor/data/` modules (`floorPlan`, `originAssets`, `npcSettings`, `tagManager`) are the only persisted store (dev middleware, no JSON snapshot). Never restore them via `git checkout` (guarded by `guard:data-restore`).
- SVG v2 convention: shapes reference `var(--obj-stroke)` / `var(--obj-fill)`; detail lines `--text-secondary`. Full authoring checklist in `docs/agents/data.md` — read it before adding/editing an origin asset.
- **AssetDef field change** (`src/blueprint-editor/domain/types.ts`): in the SAME change — (1) `ASSET_DEF_FIELD_COVERAGE` (`src/blueprint-editor/assets/assetUtils.ts`), (2) `sample` fixture (`tests/test-asset-schema.ts`), (3) `serializeAsset` whitelist, (4) `updateAsset` patch union (`src/blueprint-editor/store/assets.ts`), (5) `components/panels/OriginSettingPanel.vue` / `components/panels/AssetProperties.vue` wiring if user-editable.
- **CanvasConfig field change** (`src/blueprint-editor/domain/types.ts`): (1) `CANVAS_FIELD_SPECS` entry, (2) Canvas Settings row (`src/blueprint-editor/components/shell/Toolbar.vue`) + setter (`src/blueprint-editor/store/mode.ts`) if user-editable, (3) `SyncedCanvas` + `syncedPayload.ts` mirror if the game needs it (never for editor-only fields), (4) round-trip cases in `tests/test-blueprint-schema.ts`.
- Engine tests: seeded RNG in every `NpcEngine` options object, never `Math.random` defaults.
