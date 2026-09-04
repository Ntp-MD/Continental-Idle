# AGENTS

Repo instructions for AI agents. Read the matching section before touching an area. Explicit user instruction > this file > general best practice.

## Operating mode

- Infer intent, not literal. Short prompt = incomplete spec: find the matching repo pattern first, fill gaps with repo convention, never invent a new one.
- Expand terse prompts into scoped, actionable output without asking first; build forward toward a usable implementation, not a literal restatement.
- Land on the relevant code: navigate to the parts actually needed, no generic boilerplate.
- Read before write: check neighbors + existing impl before choosing a library or pattern. Verify the dependency is already used.
- Zero-duplication: never create a second way to do the same thing. No duplicate impls, facades, or wrappers.
- DO directly: in-scope edits, local refactors, obvious wiring. STOP + ask: destructive (rm/migrate/drop), scope >3 files, new dependency/infra, secrets/auth change.
- Rule: confidence >80% and reversible -> do it, state assumption in report. Else ask.
- Claim then impact: user-reported bug/request -> verify against code first and state what is actually true; assess impact + pros/cons before implementing.
- Keep scope: fix the asked task only. User correction persists for the session.

## Autonomous Development Workflow

When working on a task, follow this workflow:

1. Inspect
   - Inspect the existing codebase and relevant files.
   - Understand the current architecture before making changes.

2. Plan
   - Create a clear implementation plan.
   - Identify affected files and potential risks.

3. Implement
   - Implement the planned changes.
   - Follow the existing project conventions.

4. Test
   - Run ONLY the suite matching the change per the Verify table below.
   - Never run the full matrix unless asked.

5. Fix failures
   - If anything fails, diagnose the root cause.
   - Fix the issue and run the checks again.

6. Review
   - Review the implementation for correctness, regressions,
     unnecessary complexity, and consistency with the project.

7. Repeat until tests pass
   - Continue the cycle:
     Test -> Fix -> Test -> Review
   - Do not stop after completing only one step.

8. Only then report completion
   - Report completion only when the task is actually finished.
   - Summarize what was changed and what checks passed.

## Autonomous Execution

Do not stop merely because one step is complete.

After finishing each step, determine the next required step and
continue automatically.

Do not ask the user to say "continue" unless:

- required information is genuinely missing,
- an action requires explicit user approval,
- or the task is genuinely blocked.

If a test fails, do not simply report the failure.
Investigate and fix it before continuing.

If the original approach is no longer valid, revise the plan and
continue from the current state.

## Plan capture

When the user asks to make, review, improve, or reorder a plan ("make plan",
"create plan", "plan for ...", "review/improve plan"), store it as a file under
`_archive/` instead of keeping it in chat only:

- New plan: `_archive/<topic-slug>.md` (`.txt` also allowed on request).
- Existing plan: re-read it first, then edit in place; never create a second file for the same topic.
- Plan capture never touches `src/`, `tests/`, or configs - file writes stay inside `_archive/`.
- After writing, report the file path plus a short summary of the order and checkpoints.

## Skills

Registry is provider-agnostic; skill files stay in place, never copy per provider. Read the skill before matching work.

- `normalize-audit` (`.opencode/skills/normalize-audit/SKILL.md`) - before touching data flow: migration, loaders, persistence, sync, validation, engine adapters, UI saves.
- `autonomous-development` (`.opencode/skills/autonomous-development/SKILL.md`) - how to run the Autonomous Development Workflow: inspect -> plan -> implement -> test -> fix -> review -> repeat.

## Verify

Run ONLY the suite matching the change, never the full matrix.

| Changed                                      | Run                                                          |
| -------------------------------------------- | ------------------------------------------------------------ |
| Template/markup/CSS/class (`*.vue`, `*.css`) | `lint:bem` + `lint:css` (+ `typecheck` if a Vue SFC changed) |
| Engine/domain TS                             | the single matching `test:<name>`                            |
| Schema/persistence/sync                      | the single matching schema suite                             |

Bans: no `verify` / `test` matrix unless asked. Never `test:npc-perf`, `test:npc-scale`, `test:behavior`, `observe:hotel` unless asked. Temp diagnostics go in `tests/_*.tmp.ts`, deleted same session, never committed.

Report: claim verdict (which part of the report was true), what changed, assumption made, impact/trade-offs, how verified. Short, no essay. Report unrelated failures separately, never fix silently.

## Change discipline

- Correspondence: add/rename/remove of function, type field, CSS class, store export, or doc claim -> grep BOTH names repo-wide (`src/ tests/ scripts/ *.md`), update every consumer (templates, re-exports, whitelists, `src/dev/UiShowcase.vue`, docs) in the SAME change. Zero references to removed symbols.
- Read before write: files rewritten by tooling (codegen, editor save-flow, build) must be re-read immediately before editing; disk beats any snapshot.
- Scope: blueprint editor only (`App.vue` boots `BlueprintEditor.vue`). Do NOT touch `src/engine/` or `_archive/` unprompted. Never commit unless asked. No new infra (services, DB, queues, buses, generic repos) or scale optimization without demonstrated need.
- Git history is off-limits: no `checkout` / `restore` / `reset` / `diff` / `log` against HEAD or commits, no stash. Revert by hand-editing the working tree only.
- Text: never round-trip through PowerShell (`Get-Content`/`Set-Content` corrupts UTF-8-without-BOM); use Edit tool or Node. ASCII-only source and copy (`-`, `...`, `deg`, `x`; SVG icons, never glyphs). No `box-shadow` / `drop-shadow`; state via borders only.
- Cleanup: removing a symbol removes all references project-wide in the same change. Zero-delta duplicates are dead code: delete, do not replace. Preserve user data; validate cross-references when domains split or recombine.
- Comments/docs: no code comments unless requested; no `*.md` files unless requested. Imports at top. Never log or commit secrets.

## Data and schemas

- The FOUR `src/blueprint-editor/data/` modules (`floorPlan`, `originAssets`, `npcSettings`, `tagManager`) are the only persisted store (dev middleware, no JSON snapshot). Never restore via `git checkout` (`guard:data-restore`).
- SVG v2: shapes use `var(--obj-stroke)` / `var(--obj-fill)`; detail lines `--text-secondary`. Read the "Origin asset authoring" checklist before adding/editing an origin asset.
- AssetDef field change (`domain/types.ts`): same change updates (1) `ASSET_DEF_FIELD_COVERAGE` (`assets/assetUtils.ts`), (2) `sample` fixture (`tests/test-asset-schema.ts`), (3) `serializeAsset` whitelist, (4) `updateAsset` patch union (`store/assets.ts`), (5) `OriginSettingPanel.vue` / `AssetProperties.vue` wiring if user-editable.
- CanvasConfig field change (`domain/types.ts`): same change updates (1) `CANVAS_FIELD_SPECS`, (2) Canvas Settings row (`components/shell/Toolbar.vue`) + setter (`store/mode.ts`) if user-editable, (3) `SyncedCanvas` + `syncedPayload.ts` mirror if the game needs it (never editor-only fields), (4) round-trip cases in `tests/test-blueprint-schema.ts`.
- Engine tests: seeded RNG in every `NpcEngine` options object, never `Math.random` defaults.

## Editor patterns (canonical)

Reuse these for `src/blueprint-editor/`; do not introduce alternatives.

- Modals: `ModalShell` with `:open` / `@close`; heavy/rare modals via `defineAsyncComponent`.
- Tabs: shared `.tabs__bar` / `.tabs__tab` with `role="tablist"`; bar fixed, only panel scrolls.
- Showcase: every UI primitive/wrapper must appear in `src/dev/UiShowcase.vue` (open `/?showcase=1`); update it in the same change.
- Confirm: injected `confirm()`, never `window.confirm`. Feedback: `useToast` for users, `editorLog` for console. Never `alert` / `console.log` for user-facing state.
- Dirty tracking: `useDirtyBaseline` (one snapshot + `dirty` computed). No hand-rolled flags, no stringified-key comparison.
- Concurrency: `withStateLock` for store mutations, `useAsyncAction` for UI pending. One guard per layer, no duplicate booleans.
- Walkable-grid math (tile states, wall segments <-> edges, door detection) lives in `gridEditing.ts` as pure functions; components compose, never re-implement.
- Store access: import from `blueprintStore` (`useAssetsStore` and friends); never `./store/*` internals or pass-through facades.
- Declarative schemas: canvas/editor settings via `CANVAS_FIELD_SPECS` / `EDITOR_FIELD_SPECS`; never enumerate keys by hand.

## Decisions

Direction-level decisions only (Problem / Final solution / Trade-off / Revisit trigger) go in the Decision Timeline. Routine fixes, refactors, cleanups are not recorded.
