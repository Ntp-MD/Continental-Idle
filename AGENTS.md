# AGENTS

Repo instructions for AI agents. Read the matching section before touching an area. Explicit user instruction > this file > general best practice.

Universal harness companion - ships with `harness/`. Everything here applies everywhere EXCEPT the PROJECT ADAPTER zones (verify rows, banned suite names, patterns pointer), which each project fills with its own values.

## Operating mode
- Infer intent, not literal. Short prompt = incomplete spec: find the matching repo pattern first, fill gaps with repo convention, never invent a new one.
- Expand terse prompts into scoped, actionable output without asking first; build forward toward a usable implementation, not a literal restatement.
- Land on the relevant code and read before writing: navigate to the parts actually needed, check neighbors + existing impl before choosing a library or pattern. Verify the dependency is already used.
- Zero-duplication: never create a second way to do the same thing. No duplicate impls, facades, or wrappers.
- DO directly: in-scope edits, local refactors, obvious wiring, and any destructive edit to in-repo project content (see standing order below). STOP + ask: destructive actions outside the repo, scope growth past 3 files beyond what was asked, new dependency/infra, secrets/auth change. A requested change that itself spans over 3 files is pre-authorized - the gate covers unrequested scope creep, not the asked work.
- Standing order (this project): pre-release and unfinished - hotel floors/content/NPC/state may be wiped, cleared, or rebuilt at any time and any earlier decision may change. Destructive in-repo edits are pre-authorized: no restore/no-recovery concern, no ask-gate. Still stop for secrets/auth and irreversible actions outside the repo.
- Rule: confidence >80% -> do it, state assumption in report. Else ask. Reversibility is not a gate for in-repo project content.
- Safe iteration is pre-authorized: run the routed verify suite, fix failures caused by the requested change, and rerun without asking for approval at each step.
- Ask with options: whenever stopping to ask, present numbered options (2-4) each with pros/cons, then state which option is recommended and why.
- Claim then impact: user-reported bug/request -> verify against code first and state what is actually true; assess impact + pros/cons before implementing.
- Engineering standard: for every choice, pick the efficient / best-practice / higher-performance / cleaner-code option first; when alternatives exist, state briefly in the report why the chosen path won.
- Keep scope: fix the asked task only. User correction persists for the session.

## Read chain

1. `harness/HARNESS.md` - how the loop runs.
2. `harness/state/task-context.md` - live state, read first (RESUME). `harness/state/history.md` is human reference - the agent reads it only on explicit user order, never routinely.
3. `skill.md` (domain router) then the matching `docs/skill/*.md`, only when the task touches that domain.
4. `harness/state/context.md` - shared language (glossary), when domain terms or wording matter.

## Workflow

`inspect -> plan -> implement -> test -> fix -> review -> done` per `harness/HARNESS.md` (feature lane for ideas/PRDs/issues, light loop for single-file routine fixes). The live slot must be current (or cleared + logged in `harness/state/history.md`) - a task with a stale slot is not finished.

`mod-cli/` is archived at `_archive/mod-cli/` - it is disconnected from the host (no bridge, no route) and excluded from typecheck/lint/tests. Do not import from it; work touching only files there skips the harness slot and history entirely.

`_archive/` (whole folder) is off-limits - do not read, edit, or reference its contents until the user explicitly says so.
`.zed/` (whole folder) is off-limits - same rule as `_archive/`.

## Canonical patterns

Settled project patterns live in `skill.md` (router) + `docs/skill/*.md` (Component patterns + Domain). Reuse them; do not introduce a second way. Glossary lives in `harness/state/context.md` only - never a second glossary file.

## Verify

Run ONLY the suite matching the change, never the full matrix.

PROJECT ADAPTER - the rows and banned names below are this project's values. A new project keeps the table shape and markers, fills its own rows.
<!-- verify:start -->

| Changed (globs)                                                                                                                     | Run                                                                      |
| ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Template/markup (`*.vue`)                                                                                                           | `lint:bem` + `lint:css` + `typecheck`                                    |
| CSS (`src/**/*.css`)                                                                                                                | `lint:bem` + `lint:css`                                                  |
| Harness scripts (`harness/scripts/*.mjs`)                                                                                           | `lint`                                                                   |
| Config TS (`vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`)                                                            | `typecheck`                                                              |
| Unit + component tests (`tests/**/*.test.ts`)                                                                                       | `test:unit`                                                              |
| E2E tests (`tests/e2e/**`)                                                                                                          | `test:e2e`                                                               |
| Store (`src/blueprint-editor/store/**`)                                                                                             | the single matching `test:<name>` (human pick)                          |
| Project scripts (`scripts/*.mjs`)                                                                                                   | `lint`                                                                   |
| Repo tests (`tests/*.ts`)                                                                                                           | the single matching `test:<name>` or `npx tsx tests/<file>` (human pick) |
| Engine/domain TS (`src/engine/**`, `**/domain/**`, `**/assets/**`)                                                                  | the single matching `test:<name>` (human pick)                           |
| Schema/persistence/sync (`**/*schema*`, `**/*migrat*`, `**/*persist*`, `**/*sync*`, `**/*payload*`, `**/*Payload*`, `src/blueprint-editor/data/**`) | the single matching schema suite (human pick)                            |

Router: `node harness/scripts/verify.mjs` (route/run/check) parses THIS table - backticked globs in Changed match `git status` (no-slash globs match basenames, slash globs match paths), backticked npm scripts in Run are the route; a row with no concrete script is human-pick (the router lists the project's `test:` scripts, never auto-runs). The table is the only routing source - the harness ships no suite names.

Bans: no `verify` / `test` matrix unless asked. Never `test:npc-perf`, `test:npc-scale`, `test:behavior`, `observe:hotel` unless asked. Never `git checkout --`, `git restore`, `git reset`, `git stash`, or `git clean` on tracked/staged files - revert only by hand-editing; read-only `git status` / `git log` allowed, never `git diff` (use targeted `read` on the file instead); Temp diagnostics go in `tests/_*.tmp.ts`, deleted same session, never committed.
<!-- verify:end -->

Report: claim verdict (which part of the report was true), what changed, assumption made, impact/trade-offs, how verified (quote the exact verify command run - an unrelated suite run must be visible here, never hidden). Short, no essay. Report unrelated failures separately, never fix silently.

## Decisions

Direction-level decisions only (Problem / Final solution / Trade-off / Revisit trigger) go in `harness/state/history.md` as a `- decision:` bullet - the history log IS the Decision Timeline, there is no separate decisions file. Routine fixes, refactors, cleanups are not recorded.
