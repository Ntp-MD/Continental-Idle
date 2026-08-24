# AGENTS

Operating instructions for AI agents working in this repository.
Structure: **Universal Rules** apply to every web project. **Project Specifics** is the only section you replace per project.

## Universal Rules

1. **Read before you write.** Any file that is generated or rewritten by tools (codegen, save-flows, build steps) must be re-read immediately before editing. Never rely on earlier session snapshots — current file content wins over prior discussion.
2. **Deterministic tests.** Any test touching randomness, timing or ordering must inject a seeded generator (e.g., mulberry32/LCG). Never depend on global Math.random / Date.now defaults — it makes suites flaky.
3. **Stale-tooling first.** If a tool's output contradicts the source on disk, suspect a stale cache or transform before debugging logic. Rerun isolated (e.g., copy the failing script to a new filename).
4. **One verification entry point.** Maintain a single command (conventionally `npm run verify`) chaining typecheck → lint → tests. Run it before reporting completion. Suites-only variant (`npm test`) may exist for quick loops.
5. **Guardrails over memory.** When the same mistake can happen twice, add an automated check (CI job, hook, runtime validator, backup snapshot) instead of relying on reminders.
6. **Sync floor keys contract.** Game floors are keyed `G` + numeric (legacy `F<n>` labels honored); unmapped labels auto-index by floor order via `assignSyncKey`, collisions get `_N` suffixes. Never silently drop a floor that fails mapping — surface the error.
6. **Report honestly.** Unrelated pre-existing failures are listed separately, never hidden or fixed silently inside unrelated changes.
7. **Scope discipline.** Prefer direct implementations; no new infrastructure without demonstrated need; delete dead code in the same change that removes its last reference; never commit unless explicitly asked.
8. **Record the why.** Significant decisions get a short ADR-style note (decision, trade-off, revisit trigger) written while context is fresh.

## Project Specifics

<!-- Replace everything below per project. -->

### Stack & principles

- Use Vue 3 Composition API with strict TypeScript. Keep domain engines pure TypeScript, independent from Vue.
- Keep imports at the top of modules. No comments/docs unless explicitly requested.
- Detailed domain principles live in [`docs/agents/`](docs/agents/): read the matching file before touching an area (core / naming / css / data).

### Data & seed files (rewritten by editor save-flow)

- `src/blueprint-editor/data/floorPlan.data.ts`, `originAssets.data.ts`, `npcSettings.data.ts` are overwritten by the editor save-flow at any time. Re-read them immediately before editing; current content wins.
- Object instance colors follow the **SVG v2 convention**: asset shapes reference `var(--obj-stroke, …)` / `var(--obj-fill, …)`. Every ingress (new import, flatten, load) is auto-themed via `applySvgColorConvention` (types.ts). Per-instance overrides persist through `fillColor` / `strokeColor`.

### Engine test rules

- Every `NpcEngine` options object gets a seeded RNG (mulberry32/LCG helper) — never default Math.random.
- If tsx serves a stale module (output contradicts disk), copy the temp test to a NEW filename and rerun.

### Commands

| Command | Purpose |
|---|---|
| `npm run verify` | typecheck + BEM lint + all engine/schema suites |
| `npm test` | engine/schema suites only |
| `npm run test:npc-scale` | perf smoke (local only, timing-sensitive) |
