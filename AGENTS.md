# AGENTS

Operating instructions for AI agents working in this repository.
Structure: **Universal Rules** apply to every web project. **Project Specifics** is the only section you replace per project.

## Universal Rules

1. **Read before you write.** Any file that is generated or rewritten by tools (codegen, save-flows, build steps) must be re-read immediately before editing. Never rely on earlier session snapshots — current file content wins over prior discussion.
2. **Deterministic tests.** Any test touching randomness, timing or ordering must inject a seeded generator (e.g., mulberry32/LCG). Never depend on global Math.random / Date.now defaults — it makes suites flaky.
3. **Stale-tooling first.** If a tool's output contradicts the source on disk, suspect a stale cache or transform before debugging logic. Rerun isolated (e.g., copy the failing script to a new filename).
4. **One verification entry point.** Maintain a single command (conventionally `npm run verify`) chaining typecheck → lint → tests. Run it before reporting completion. Suites-only variant (`npm test`) may exist for quick loops.
5. **Guardrails over memory.** When the same mistake can happen twice, add an automated check (CI job, hook, runtime validator, backup snapshot) instead of relying on reminders.
6. **Correspondence discipline.** Every symbol travels with its consumers. Before reporting completion of ANY change that adds/renames/removes a function, type field, CSS class, store export, or doc claim: (a) grep BOTH directions repo-wide — `src/ tests/ scripts/ *.md` — for the old and new names; (b) update every re-export list, facade return object, whitelist, and doc mention in the SAME change; (c) run `npm run verify` — it chains typecheck, BEM lint (template↔CSS), engine/schema suites incl. the AssetDef coverage gate (`ASSET_DEF_FIELD_COVERAGE`), and `verify:assets` (originAssets.data.ts ↔ AssetDef). Zero references to removed symbols is the definition of done.
7. **Sync floor keys contract.** Game floors are keyed `G` + numeric (legacy `F<n>` labels honored); unmapped labels auto-index by floor order via `assignSyncKey`, collisions get `_N` suffixes. Never silently drop a floor that fails mapping — surface the error.
8. **Report honestly.** Unrelated pre-existing failures are listed separately, never hidden or fixed silently inside unrelated changes.
9. **Scope discipline.** Prefer direct implementations; no new infrastructure without demonstrated need; delete dead code in the same change that removes its last reference; never commit unless explicitly asked.
10. **Record the why.** Significant decisions get a short ADR-style note (decision, trade-off, revisit trigger) written while context is fresh.

## Project Specifics

<!-- Replace everything below per project. -->

### Stack & principles

- Use Vue 3 Composition API with strict TypeScript. Keep domain engines pure TypeScript, independent from Vue.
- Keep imports at the top of modules. No comments/docs unless explicitly requested.
- **Never round-trip file text through PowerShell** (`Get-Content`/`Set-Content`) — PS 5.1 misreads UTF-8-without-BOM as ANSI and silently corrupts non-ASCII characters. Use the Edit tool or Node scripts for any scripted text transformation.
- **ASCII-only source and copy.** Do not use decorative Unicode characters (em/en dashes, ellipses, degree signs, math/arrows/dingbat symbols: `— – … ° × ÷ ± ⊘ ↻ ▾ ▶ ◀` etc.) anywhere in code identifiers, comments, or user-facing strings. Write plain ASCII equivalents (`-`, `...`, `deg`, `x`). Prefer words or real SVG icons over symbol glyphs in buttons.
- **No box-shadow.** Never add `box-shadow` / `filter: drop-shadow` — no focus rings, elevation, or glows. Depth and state come from borders and background contrast only (`border-color` on `:focus`/`:hover`, danger states via border color).
- Detailed domain principles live in [`docs/agents/`](docs/agents/): read the matching file before touching an area (core / naming / css / data).

### Data & seed files (rewritten by editor save-flow)

- The FOUR modules in `src/blueprint-editor/data/` - `floorPlan.data.ts`, `originAssets.data.ts`, `npcSettings.data.ts`, `tagManager.data.ts` - are the ONLY persisted blueprint store. The dev server serves/saves them via the `/__blueprint-data` middleware (vite.config.ts); there is no JSON snapshot. All are overwritten by the editor save-flow at any time. Re-read them immediately before editing; current content wins. Never treat another file as the asset/floor source of truth.
- Object colors follow the **SVG v2 convention**: asset shapes reference `var(--obj-stroke, …)` / `var(--obj-fill, …)`. Every ingress (new import, flatten, load) is auto-themed via `applySvgColorConvention` (types.ts). Asset defaults are `defaultFillColor` / `defaultStrokeColor` (outline derives from fill when unset; fallback token `--asset-outline`). Placed objects do NOT carry editable color copies — they resolve colors live from their origin asset.
- Adding or editing an origin asset? Follow the **Origin asset authoring** checklist in [`docs/agents/data.md`](docs/agents/data.md) (creation defaults, SVG art rules, color validation, verify gate).

### AssetDef schema changes (guardrail)

When adding / renaming / removing any field on `AssetBase` or `AssetDef` (`types.ts`), ALL of the following must change in the same commit — typecheck and `test:asset-schema` will fail otherwise:

1. Add the key to `ASSET_DEF_FIELD_COVERAGE` (`assetUtils.ts`) — this Record<keyof AssetDef, true> is compile-enforced.
2. Populate the field in the `sample` fixture of `tests/test-asset-schema.ts`.
3. Extend the whitelist in `serializeAsset` (`assetUtils.ts`) — persistence drops unlisted fields silently.
4. Extend the patch union in `updateAsset` (`store/assets.ts`) if instances/origin settings may edit it — unlisted patches are ignored silently.
5. If user-editable, wire it in `OriginSettingModal.vue` / `AssetProperties.vue`.

### Engine test rules

- Every `NpcEngine` options object gets a seeded RNG (mulberry32/LCG helper) — never default Math.random.
- If tsx serves a stale module (output contradicts disk), copy the temp test to a NEW filename and rerun.

### Commands

| Command | Purpose |
|---|---|
| `npm run verify` | typecheck + BEM lint + engine/schema suites + `verify:assets` (originAssets.data.ts ↔ AssetDef) |
| `npm test` | engine/schema suites only (quick loop) |
| `npm run test:npc-scale` | perf smoke (local only, timing-sensitive) |
