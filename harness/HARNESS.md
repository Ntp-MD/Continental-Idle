# Harness

Single-folder agent ops: one doc, one slot, one log, one script. No services, no dependencies beyond node. Copy this folder into any project, write the project's instruction file, and work.

Coding agents fail in predictable ways: they lose track of state mid-task, run the wrong (or every) test suite, and declare victory early.

## Read chain

1. Project instruction file first (this repo: `AGENTS.md`) - rules, verify table, bans.
2. This file - how the loop runs.
3. `task-context.md` - live slot, current state. Read it at task start.
4. `history.md` - human reference log. The agent never reads it on its own - only when the user explicitly orders an investigation.
5. Project skill file (this repo: `skill.md`) - only when the task touches project domain.

## The loop

```
inspect -> plan (slot) -> implement -> verify route -> fix -> review -> done
               ^ tick the slot as you go (it is the progress bar) ^
```

Drive each task to completion by yourself. Stop and ask only when information is genuinely missing, approval is required, or the task is blocked. If the approach is invalid, revise the plan and continue from the current state.

## Steps

1. Inspect - locate the relevant code, read neighboring files and the existing implementation before choosing a pattern. Never invent a new pattern when a repo pattern exists. Record current behavior, repo pattern to reuse, files that must change.
2. Plan - files to touch (over 3: stop and ask), risks, the single matching verify suite. No coding until four parts are clear: What (scope + non-goals), Why (current vs expected with proof), How (steps in order), Why this way (pattern reused, rejected alternatives, risks + rollback). Pre-proof gate: a captured baseline exists; every edit anchor carries an identity; UI work names who confirms the visual.
3. Implement - follow file-local conventions and the project's canonical patterns. Never add a second way. ASCII-only source, imports at top, no code comments unless requested. Never commit unless asked.
4. Test - run ONLY the suite matching the change (`verify.mjs route` prints it). Never the full matrix unless asked.
5. Fix - diagnose the root cause from the failing output, fix the smallest in-scope change, re-run. Pre-existing unrelated failures are reported separately, never fixed silently.
6. Review - correctness, regressions, correspondence (zero references to removed things), scope (no files beyond the plan).
7. Done - report short: claim verdict (which part of the request was true), what changed, assumption made, impact/trade-offs, how verified.

## Light loop (small tasks, weak models)

Single-file routine fix: inspect -> implement -> verify. Only Mission, Plan, and Hand-off Note must be filled; report stays short. Full loop resumes the moment scope grows past one file or a failure needs diagnosis.

## Slot protocol

- `task-context.md` is the single live slot - the only state file, never a second one per topic (4 sections: Mission / Plan / Blockers / Hand-off Note). Never delete the headers.
- Update the slot after every meaningful step - disk must always hold the latest state.
- RESUME at task start: read the slot first, verify against working-tree status. Start from the first unchecked Plan item / Hand-off Note.
- Hand-off Note always names the exact next action, so any snapshot is resumable on its own.
- Finish: tick every Plan box, log the entry in `history.md`, clear the slot back to the empty shape. A task is NOT done while the slot is stale.

## Verify routing

- `node harness/scripts/verify.mjs route` prints ONLY the matching suites for the current working tree. `run` executes them and stops at the first failure. Engine/domain and schema rows stay human-pick by design.
- `node harness/scripts/verify.mjs check` gates slot headers, secrets, and scope. Run it before reporting done.
- Temp diagnostics go in `tests/_*.tmp.ts`, deleted same session, never committed.

## History pattern

- Entry shape: `### <doing> - <finished> (<agent>, <exact-model-id>)` followed by `- <detail>` bullets (what changed + how verified, no essays).
- Stamp: `YYYY-MM-DD HH:MM UTC+7` (adjust the zone per project, consistently everywhere).
- Log only when done, never in advance. Product work only, no essays.
- Over 20 entries: run `node harness/scripts/verify.mjs compact` (keeps the latest 20, archives older into monthly `history-YYYY-MM.md` files).
- Example: `### door delete fix - 2026-09-07 17:38 UTC+7 (muse-spark, opencode/...)` + `- dual-side mirror` + `- suites green`.

## Safety

- Never `checkout`, `restore`, `reset`, `stash`, or `clean` tracked files - revert only by hand-editing.
- Move or rename with `git mv`, then grep the old path AND the old basename repo-wide and update every consumer in the same change.
- Stop and ask with options when: destructive action, scope over 3 files, new dependency/infra, secrets/auth change.

## Adopt in a new project

1. Copy this folder to the target.
2. Write the target's instruction file (rules, verify table between `verify` markers, bans) and its domain skill file.
3. Empty `task-context.md`, start `history.md` fresh.
