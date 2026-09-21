# AGENTS

Project instructions for AI agents. Full rules (operating mode, loop, report format) live in `harness/HARNESS.md` - this file is the digest + project adapter. Explicit user instruction > this file > `harness/HARNESS.md` > general best practice.

## Rules digest (full text: `harness/HARNESS.md` - Operating mode)

- Read before writing: reuse repo patterns, verify the dependency is already used. Zero-duplication - never a second way to do the same thing.
- DO directly: in-scope edits, local refactors, obvious wiring, and destructive edits to in-repo project content when the standing order below authorizes them. STOP + ask: destructive actions outside the repo, unrequested scope growth past 3 files, new dependency/infra, secrets/auth change.
- Confidence >80% -> do it and state the assumption; else ask with numbered options (2-4) + recommendation.
- Claim then impact: verify user-reported issues against code first. Keep scope; user correction persists for the session.
- Report in the HARNESS.md Report format (Changed / Decisions / Gaps / Verify under a verdict headline) - audits and question answers have their own variants there.
- Direction-level decisions -> `harness/state/history.md` `- decision:` bullets. Routine fixes are not recorded.

## Read chain

1. `harness/HARNESS.md` - full rules, loop, report format.
2. `harness/state/task-context.md` - live state, read first (RESUME). `harness/state/history.md` is human reference - read only on explicit user order.
3. `skill.md` (domain router) then the matching `docs/skill/*.md`, only when the task touches that domain.
4. `harness/state/context.md` - shared language (glossary), when domain terms or wording matter.

## Project notes

`mod-cli/` lives outside this repo at `../ITP-WORK/mod-cli/` - it is disconnected from the host (no bridge, no route) and excluded from typecheck/lint/tests. Do not import from it; work touching only files there skips the harness slot and history entirely.

`.zed/` (whole folder) is off-limits - do not read, edit, or reference its contents until the user explicitly says so.

Standing order (this project): pre-release and unfinished - hotel floors/content/NPC/state may be wiped, cleared, or rebuilt at any time and any earlier decision may change. Destructive in-repo edits are pre-authorized: no restore/no-recovery concern, no ask-gate. Still stop for secrets/auth and irreversible actions outside the repo.

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

Router: `node harness/scripts/verify.mjs` (route/run/check/drift) parses THIS table - backticked globs in Changed match `git status` (no-slash globs match basenames, slash globs match paths), backticked npm scripts in Run are the route; a row with no concrete script is human-pick (the router lists the project's `test:` scripts, never auto-runs). The table is the only routing source - the harness ships no suite names.

Bans: no `verify` / `test` matrix unless asked. Never `test:npc-perf`, `test:npc-scale`, `test:behavior`, `observe:hotel` unless asked. Never `git checkout --`, `git restore`, `git reset`, `git stash`, or `git clean` on tracked/staged files - revert only by hand-editing; read-only `git status` / `git log` allowed, never `git diff` (use targeted `read` on the file instead); Temp diagnostics go in `tests/_*.tmp.ts`, deleted same session, never committed.
<!-- verify:end -->
