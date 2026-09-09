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
feature lane (once, below) -> per-ticket loop:
inspect -> plan (slot) -> implement -> verify route -> fix -> review -> done
                ^ tick the slot as you go (it is the progress bar) ^
```

Drive each task to completion by yourself. Stop and ask only when information is genuinely missing, approval is required, or the task is blocked. If the approach is invalid, revise the plan and continue from the current state.

## Steps

1. Inspect - locate the relevant code, read neighboring files and the existing implementation before choosing a pattern. Never invent a new pattern when a repo pattern exists. Record current behavior, repo pattern to reuse, files that must change.
2. Plan - files to touch (over 3: stop and ask), risks, the single matching verify suite. No coding until four parts are clear: What (scope + non-goals), Why (current vs expected with proof), How (steps in order), Why this way (pattern reused, rejected alternatives, risks + rollback). Pre-proof gate: a captured baseline exists; every edit anchor carries an identity; UI work names who confirms the visual. On feature-lane tickets, reuse the lane outputs (Mission summary, Impact Summary, picked interface) - plan only the ticket slice.
3. Implement - follow file-local conventions and the project's canonical patterns. Never add a second way. ASCII-only source, imports at top, no code comments unless requested. Never commit unless asked.
4. Test - run ONLY the suite matching the change (`verify.mjs route` prints it). Never the full matrix unless asked. When Phase F wrote the failing case first, this run is that same suite - one suite, two moments (red before, green after), never a second suite.
5. Fix - diagnose the root cause from the failing output, fix the smallest in-scope change, re-run. Pre-existing unrelated failures are reported separately, never fixed silently.
6. Review - correctness, regressions, chain (each changed function lists its direct callers + callees with a touched-or-unaffected verdict per edge; one hop mandatory, deeper only when an edge contract changed), correspondence (zero references to removed things), scope (no files beyond the plan), architecture scan (list introduced complexity as candidates, never fix silently - the scope rule applies).
7. Done - report short: claim verdict (which part of the request was true), what changed, assumption made, impact/trade-offs, how verified.

## Feature lane (idea -> tickets -> per-ticket loop)

For conversational ideas, PRDs, or issues - run once before the loop above. Each ticket then runs Steps 1-7 on its own slot cycle. Lane outputs are loop inputs - per-ticket Steps reuse them, never re-derive them. Single-file routine fixes skip this lane and use the light loop below.

Entry router - detect first, print one status line (e.g. "Starting from: raw idea -> Phase A"):

| What exists                  | Start at      |
| ---------------------------- | ------------- |
| Raw idea / "I want X"        | Phase A       |
| PRD or spec already written  | Phase B       |
| Codebase exists, work clear  | Phase C       |
| Issue / ticket exists        | Phase E       |
| Everything ready, just build | Phase F       |

A. Align - interview before any code: problem, who/when, edge cases, what done looks like, what must NOT change. Output: Alignment Summary (bullet list, <=10 items) into slot Mission. Skip when a PRD/spec/issue already covers it.

B. Model/Language - load `skill.md`. For each new term: check glossary conflicts, pick a canonical name, patch `skill.md`. Glossary lives in `skill.md` only - never create `CONTEXT.md`, never `docs/adr/`. For contested terms wait for user confirmation before locking. Skip when no new terms.

C. Zoom-out - locate touched modules, place the feature in the current architecture, flag risky coupling. Output: Codebase Impact Summary (files/modules, risk level) into slot Plan. If a large refactor must come first, stop and ask before slicing tickets.

D. Interface - propose 2-3 different interface shapes (signatures, types, props) with trade-offs. Wait for the user to pick one (the single allowed wait besides missing/blocked/approval) - one decision at a time, never batch questions.

E. Tickets - vertical slices, each with its own acceptance criterion, blocking edges declared. One ticket per slot cycle (Mission/Plan updated per ticket, ticked before moving on). Never a second state file - no `docs/tickets/`, no tracker dependency.

F. Build - per ticket, in dependency order, hybrid test rule: engine/domain/schema tickets write the failing case first (temp `tests/_*.tmp.ts`, deleted same session, or the matching `test:<name>` suite), then minimum code to pass, then refactor; UI/template tickets implement directly and verify via route. Never advance on red. After all tickets green, run the Step 6 architecture scan once across all touched files.

G. Compress - after Build ends, output stays ultra-compressed (drop filler and pleasantries, keep full technical accuracy) until the user says "normal mode". Tone only - the Step 7 report shape still applies.

Phase output format (ASCII only):

```
Phase <N> - <Name> done
  -> <one-line result>
  -> Starting Phase <N+1>: <Name>
```

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
- Log only when done, never in advance. Log only what changed or what was decided: implemented changes (code/docs/config) and direction decisions taken. Never log questions asked, read-only audits with no change, recommendations not taken, or parked/abandoned ideas - those leave no trace. No essays.
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
