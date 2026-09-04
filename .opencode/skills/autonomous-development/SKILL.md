---
name: autonomous-development
description: How to run the Autonomous Development Workflow to completion. Invoke when implementing a feature, fixing a bug, or refactoring, or when the user says autonomous, self-driving, keep going, or do not stop. Pairs with the workflow and execution rules in AGENTS.md.
---

# Autonomous Development Skill

How to execute the workflow defined in `AGENTS.md`. That file states WHAT is required; this file states HOW to do each step in this repo.

## Step 1 - Inspect

- Locate the relevant code by searching `src/`, `tests/`, and `scripts/` for the symbols named in the request.
- Read neighboring files and the existing implementation before choosing a pattern.
- If the task touches data flow (migration, loaders, persistence, sync, validation, engine adapters, UI saves), read `.opencode/skills/normalize-audit/SKILL.md` first.
- Record: current behavior, repo pattern to reuse, files that must change.

## Step 2 - Plan

- Write a short plan: files to touch (keep to 3 or fewer or stop and ask), risks, and the single matching Verify suite from `AGENTS.md`.
- Identify cross-references: if you add/rename/remove a function, type field, CSS class, store export, or doc claim, grep BOTH names repo-wide and plan every consumer update in the same change.
- If the plan needs a destructive action, a new dependency, new infra, or a secrets/auth change, stop and ask.

## Step 3 - Implement

- Follow the file-local conventions and the canonical editor patterns in `AGENTS.md`.
- Reuse `blueprintStore` imports, `ModalShell`, shared tabs classes, `useDirtyBaseline`, `withStateLock` / `useAsyncAction`, `gridEditing.ts` helpers, and declarative field specs. Do not introduce alternatives.
- Keep ASCII-only source, imports at top, no code comments unless requested.
- Never touch `src/engine/` or `_archive/` unprompted. Never commit unless asked.

## Step 4 - Test

- Run ONLY the suite matching the change per the Verify table in `AGENTS.md`.
- Template/markup/CSS/class change: `lint:bem` + `lint:css` (+ `typecheck` if a Vue SFC changed).
- Engine/domain TS change: the single matching `test:<name>`.
- Schema/persistence/sync change: the single matching schema suite.
- Never run `verify` / full `test` matrix, `test:npc-perf`, `test:npc-scale`, `test:behavior`, or `observe:hotel` unless asked.
- Temp diagnostics go in `tests/_*.tmp.ts` and are deleted in the same session, never committed.

## Step 5 - Fix failures

- Diagnose the root cause from the failing suite output, not from guesses.
- Fix the smallest in-scope change, then re-run the same matching suite.
- If the failure is pre-existing and unrelated, leave it, report it separately, and do not fix it silently.

## Step 6 - Review

- Check: correctness, regressions, unnecessary complexity, consistency with repo patterns.
- Check correspondence: zero references to removed symbols, showcase updated if a UI primitive changed, whitelists/serializers/patch unions updated if a field changed.
- Check text rules: no PowerShell round-trip of files, no `box-shadow` / `drop-shadow`, state via borders only.

## Step 7 - Repeat until tests pass

- Loop Test -> Fix -> Test -> Review. Do not stop after one pass and do not ask for "continue".
- If the approach is invalid, revise the plan from the current state and continue.
- Stop and ask only when information is missing, approval is required, or the task is blocked.

## Step 8 - Report completion

- Report only when the matching suite passes. Keep it short, no essay.
- Include: claim verdict (which part of the request was true), what changed, assumption made, impact/trade-offs, how verified.
