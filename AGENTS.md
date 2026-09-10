# AGENTS

Repo instructions for AI agents. Read the matching section before touching an area. Explicit user instruction > this file > general best practice.

Universal harness companion - ships with `harness/`. Everything here applies everywhere EXCEPT the PROJECT ADAPTER zones (verify rows, banned suite names, patterns pointer), which each project fills with its own values.

## Operating mode

- Infer intent, not literal. Short prompt = incomplete spec: find the matching repo pattern first, fill gaps with repo convention, never invent a new one.
- Expand terse prompts into scoped, actionable output without asking first; build forward toward a usable implementation, not a literal restatement.
- Land on the relevant code and read before writing: navigate to the parts actually needed, check neighbors + existing impl before choosing a library or pattern. Verify the dependency is already used.
- Zero-duplication: never create a second way to do the same thing. No duplicate impls, facades, or wrappers.
- DO directly: in-scope edits, local refactors, obvious wiring. STOP + ask: destructive (rm/migrate/drop), scope >3 files, new dependency/infra, secrets/auth change.
- Rule: confidence >80% and reversible -> do it, state assumption in report. Else ask.
- Ask with options: whenever stopping to ask, present numbered options (2-4) each with pros/cons, then state which option is recommended and why.
- Claim then impact: user-reported bug/request -> verify against code first and state what is actually true; assess impact + pros/cons before implementing.
- Engineering standard: for every choice, pick the efficient / best-practice / higher-performance / cleaner-code option first; when alternatives exist, state briefly in the report why the chosen path won.
- Keep scope: fix the asked task only. User correction persists for the session.

## Read chain

1. `harness/harness.md` - how the loop runs.
2. `harness/task-context.md` - live state, read first (RESUME). `harness/history.md` is human reference - the agent reads it only on explicit user order, never routinely.
3. `skill.md` - project domain knowledge, only when the task touches it.
4. `harness/context.md` - shared language (glossary), when domain terms or wording matter.

## Workflow

`inspect -> plan -> implement -> test -> fix -> review -> done` per `harness/harness.md` (feature lane for ideas/PRDs/issues, light loop for single-file routine fixes). The live slot must be current (or cleared + logged in `history.md`) - a task with a stale slot is not finished.

## Canonical patterns

Settled project patterns live in `skill.md` (Layout: Component patterns + Domain). Reuse them; do not introduce a second way. Glossary lives in `harness/context.md` only - never a second glossary file.

## Verify

Run ONLY the suite matching the change, never the full matrix.

PROJECT ADAPTER - the rows and banned names below are this project's values. A new project keeps the table shape and markers, fills its own rows.
<!-- verify:start -->
| Changed                                      | Run                                                          |
| -------------------------------------------- | ------------------------------------------------------------ |
| Template/markup/CSS/class (`*.vue`, `*.css`) | `lint:bem` + `lint:css` (+ `typecheck` if a Vue SFC changed) |
| Engine/domain TS                             | the single matching `test:<name>`                            |
| Schema/persistence/sync                      | the single matching schema suite                             |

Router: `node harness/scripts/verify.mjs` (route/run/check) maps `git status` to the row above; engine/schema rows stay human-pick.

Bans: no `verify` / `test` matrix unless asked. Never `test:npc-perf`, `test:npc-scale`, `test:behavior`, `observe:hotel` unless asked. Never `git checkout --`, `git restore`, `git reset`, `git stash`, or `git clean` on tracked/staged files - revert only by hand-editing; read-only `git status` / `git diff` / `git log` allowed. Temp diagnostics go in `tests/_*.tmp.ts`, deleted same session, never committed.
<!-- verify:end -->

Report: claim verdict (which part of the report was true), what changed, assumption made, impact/trade-offs, how verified (quote the exact verify command run - an unrelated suite run must be visible here, never hidden). Short, no essay. Report unrelated failures separately, never fix silently.

## Decisions

Direction-level decisions only (Problem / Final solution / Trade-off / Revisit trigger) go in the Decision Timeline. Routine fixes, refactors, cleanups are not recorded.
