# Harness

Single-folder agent ops: one doc, one slot, one log, one script folder. No services, no dependencies beyond node. Copy this folder into any project, write the project's instruction file, and work.

Coding agents fail in predictable ways: they lose track of state mid-task, run the wrong (or every) test suite, and declare victory early.

## Read chain

1. Project instruction file first (this repo: `AGENTS.md`) - rules, verify table, bans.
2. This file - how the loop runs.
3. `state/task-context.md` - live slot, current state. Read it at task start.
4. `state/history.md` - human reference log. The agent never reads it on its own - only when the user explicitly orders an investigation.
5. Project skill file (this repo: `skill.md`) - only when the task touches project domain.
6. `state/context.md` - shared language (glossary). Read when domain terms or wording matter; patch it when a new term locks.

## Persona
This folder is not a checklist - it is a software engineer. Facts are looked up, never asked; decisions are put to the user; the first interface idea is never the last.

Every task walks the loop below - inspect, plan, implement, test, fix, review, done. A routine one-file fix walks the light loop with no extra reads.

## Thinking budget (sweet spot)

| Step | Budget | Stop when |
| ---- | ------ | --------- |
| Inspect | 2 | pattern + files-to-touch identified |
| Plan | 2 | What / Why / How / Why-this-way all four filled |
| Implement | 1 | matches plan, no invented pattern |
| Test / Fix | 1 + rerun | green, or logged as unrelated failure |
| Review | 2 | re-read verdict holds + chain/scope checked |
| Done | 1 | verdict per item + verify quote present |

Stop rules (apply everywhere): evidence complete -> stop. Two passes agree -> stop. Reversible choice -> decide now, log assumption, no third pass. Budget spent and still unsure -> mark UNCERTAIN and escalate, never add a silent third pass. Deterministic work (grep, route, checklist ticks) costs 0 thinking - run once, record result.

## Skills (`skills/`)

Owner-authored guardrails, not itineraries: the floor for a weaker model, which a stronger one may override with judgment. Repository skills also steer other contributors' agents on other models, so keep every description short and every trigger narrow - over-prescription costs as much as omission. Each skill carries standard frontmatter (`name` + `description`) so external agents can discover it. Read a skill ONLY through its door, never wholesale:

- **Task trigger**: `edit-minimal` (editing an existing file), `verify-external` (citing anything outside the repo), `finish-complete` (before reporting any implementation done), `report-gaps` (writing the done report), `wire-paths` (before a move/rename, or any structural change that touches path references).

**Name resolution**: when a skill references another skill by name, it resolves to `skills/<name>/SKILL.md` inside this folder - never an external fetch, never an invented procedure.

## The loop

```
feature lane (once, below) -> per-ticket loop:
inspect -> plan (slot) -> implement -> verify route -> fix -> review -> done
                ^ tick the slot as you go (it is the progress bar) ^
```

Drive each task to completion by yourself. Define completion in the plan and treat the first implementation as a draft: completion means the change is running, inspected, and fixed. Stop and ask only when information is genuinely missing, approval is required, or the task is blocked. If the approach is invalid, revise the plan and continue from the current state.

## Steps

1. Inspect - locate the relevant code, read neighboring files and the existing implementation before choosing a pattern. Never invent a new pattern when a repo pattern exists. Grep `state/lessons.md` with the touched file/surface name first - a hit means the failure happened before, apply the recorded fix. Record current behavior, repo pattern to reuse, files that must change.
2. Plan - files to touch (unrequested growth past 3 files: proceed only if reversible, else stop and ask - a requested change spanning over 3 files is pre-authorized, see AGENTS.md), risks, the single matching verify suite. No coding until four parts are clear: What (scope + non-goals), Why (current vs expected with proof), How (steps in order), Why this way (pattern reused, rejected alternatives, risks + rollback). Pre-proof gate: a captured baseline exists; every edit anchor carries an identity; UI work names who confirms the visual. On feature-lane tickets, reuse the lane outputs (Mission summary, Impact Summary, picked interface) - plan only the ticket slice.
3. Implement - follow file-local conventions and the project's canonical patterns. Never add a second way. ASCII-only source, imports at top, no code comments unless requested. Never commit unless asked.
4. Test - run ONLY the suite matching the change (`verify.mjs route` prints it). Never the full matrix unless asked. When Phase F wrote the failing case first, this run is that same suite - one suite, two moments (red before, green after), never a second suite.
5. Fix - diagnose the root cause from the failing output, fix the smallest in-scope change, re-run. Pre-existing unrelated failures are reported separately, never fixed silently.
6. Review - correctness, regressions, chain (each changed function lists its direct callers + callees with a touched-or-unaffected verdict per edge; one hop mandatory, deeper only when an edge contract changed), correspondence (zero references to removed things; load `wire-paths` only when paths moved), scope (no files beyond the plan), architecture scan (list introduced complexity as candidates, never fix silently - the scope rule applies). Uncertainty gate: re-read each judged verdict (audit calls, boundary mappings) once against its quoted evidence; a verdict that flips between passes is marked UNCERTAIN and escalated, never silently picked. A verdict without a `file:line` evidence quote does not count.
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

B. Model/Language - load `state/context.md` (shared language) plus `skill.md`. For each new term: check glossary conflicts, pick a canonical name, patch `state/context.md`. The glossary lives in `harness/state/context.md` only - never a second glossary file, never `docs/adr/`. For contested terms wait for user confirmation before locking. Skip when no new terms.

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

## Autopilot mode

The agent decides instead of the user. Activation: user says `autopilot` (or `autopilot off` to end it). The mode is conversation state AND slot state - write `Mode: autopilot` as the first line of the slot Mission so RESUME restores it after a context cutoff. Without that marker the agent is NOT in autopilot, no matter what happened earlier.

Behavior while active:

1. Decide, don't ask. Everything that would normally trigger "stop and ask with options" is decided by the agent - including unrequested scope growth past 3 files, new dependencies, and interface picks (Phase D).
2. Decision rule, in order: most reversible option > closest to an existing repo pattern > simplest. State the assumption in the done report.
3. Decision log: every non-trivial decision is logged in `harness/state/history.md` as `- decision: <choice> (over: <rejected alternatives> - because <reason>)`. The done report opens with the decision log so the user can veto any single decision - a veto is a normal follow-up task, not an error.
4. Batch checkpoints: don't pause for approval mid-task. Report at the end (or at a phase boundary for feature-lane work). Slot is written through as usual.
5. Still hard-stopped, even in autopilot: destructive git commands (already banned), deleting/rewriting persisted store content without an explicit user order, secrets/auth changes, and anything irreversible outside the repo. For these, leave a Blockers entry and end the report with the question.

`autopilot off` returns to normal mode - remove the slot marker in the same breath.

## Slot protocol

- `state/task-context.md` is the single live slot - the only state file, never a second one per topic (4 sections: Mission / Plan / Blockers / Hand-off Note). Never delete the headers.
- Update the slot after every meaningful step - disk must always hold the latest state. Write-through triggers (append, then resume the task): user order or context shift, a finding or root cause, decision options or a landed choice. Slot writes are silent - never narrate, quote, or summarize them in chat. Never defer to later - a context cutoff on an unwritten slot defeats the file.
- RESUME at task start: read the slot first, verify against working-tree status. Start from the first unchecked Plan item / Hand-off Note.
- Hand-off Note always names the exact next action, so any snapshot is resumable on its own.
- Finish: tick every Plan box, log the entry in `state/history.md`, clear the slot back to the empty shape. A task is NOT done while the slot is stale. Empty shape: `(empty)` under Mission and Hand-off, `- (none)` under Plan and Blockers (see `adopt.mjs` `EMPTY_SLOT`).

## Verify routing

- The verify table in `AGENTS.md` (between `verify` markers) is the ONLY routing source - the harness ships no suite names. Row format: backticked globs in the Changed cell, backticked npm scripts in the Run cell; a row with no concrete script is a human-pick row.
- `node harness/scripts/verify.mjs route` matches the working tree against the table and prints ONLY the matching suites (`npm run <script>`). No-slash globs (`*.vue`) match basenames anywhere; slash globs (`src/**/*.css`) match paths. Pick rows list the project's `test:` scripts (read from package.json) for the human to choose - the router never chooses.
- `run` executes the matched suites and stops at the first failure; a matched pick row always refuses to auto-run.
- `table` validates the verify table against `package.json` (every concrete npm script in a Run cell exists; every Changed cell has a backticked glob). `check` gates slot headers, secrets, scope, and runs the table validation. Run it before reporting done.
- Harness-owned conventions (not project suites): temp diagnostics go in `tests/_*.tmp.ts`, deleted same session, never committed - the router filters them out.

## History pattern

- Entry shape: `### <doing> - <finished> (<agent>, <exact-model-id>)` followed by `- <detail>` bullets (what changed + how verified, no essays).
- Stamp: `YYYY-MM-DD HH:MM UTC+7` (adjust the zone per project - any `UTC±H[:MM]` works; compact reads the offset from each stamp itself, never hardcodes one - pick one zone per project and keep every stamp consistent).
- Log only when done, never in advance. Log only what changed or what was decided: implemented changes (code/docs/config) and direction decisions taken. Never log questions asked, read-only audits with no change, recommendations not taken, or parked/abandoned ideas - those leave no trace. No essays.
- Direction decisions (Problem / Final solution / Trade-off / Revisit trigger) are logged as a `- decision:` bullet inside that entry - the history log IS the Decision Timeline; there is no separate decisions file.
- Over 20 entries: run `node harness/scripts/verify.mjs compact` (keeps the latest 20, archives older into monthly `state/history-YYYY-MM.md` files).
- Example: `### door delete fix - 2026-09-07 17:38 UTC+7 (muse-spark, opencode/...)` + `- dual-side mirror` + `- suites green`.

## Calibration loop

- Whenever variance hits (audit verdict flips, fix takes 2+ rounds, scope grows unplanned), append one line to the history entry: which step's budget held or broke. A repeat of an already-logged variance gets promoted to `state/lessons.md` as one line (symptom | cause | fix | evidence).
- Every `compact` run, scan the variance lines: the step with the most UNCERTAIN/broken-budget hits gets a tighter evidence rule next. The harness improves itself; no separate tracking file.

## Safety

Single source is `AGENTS.md` (scope, git bans, destructive gates) - this section adds nothing new, only the harness-specific reminder: move/rename with `git mv`, then grep old path AND old basename repo-wide per `wire-paths`. Autopilot converts stop-and-ask into decide-and-log, except secrets/auth and irreversible outside-repo actions, which still stop.

## Enforcement

The loop is instruction-based except for one hard gate: `.githooks/pre-commit` runs `verify.mjs check` on every commit (slot headers, secrets, unchecked Plan boxes, verify-table validity). Enable it once per clone - it is not auto-enabled:

```
git config core.hooksPath .githooks
```

Run the same check by hand anytime with `node harness/scripts/verify.mjs check`. `git commit --no-verify` bypasses the hook for an emergency commit.

### Gate before the edit (layer 3, opencode only)

Context injection (layer 1) asks; the git hook (layer 4) catches it later. `.opencode/plugins/harness-gate.js` sits between them: on `edit`/`write` it counts distinct non-meta project files for the session, and when a second one appears while the slot Mission is still empty it throws, so the medium+ task cannot start without `harness/state/task-context.md` filled (lite = one file stays exempt; meta paths never count, so the agent can always write the slot itself). opencode discovers it automatically - no config entry - but it loads at startup, so restart opencode/Zed after changing it. `opencode debug info` lists the loaded plugin. Other agents (Cline ACP) do not run opencode plugins and stay instruction-only.

### Probing the agent (does the harness actually reach it?)

Enforcement assumes the agent receives `AGENTS.md` + `HARNESS.md`. Check it, do not assume it: `node harness/scripts/probe-agent.mjs` proves the wiring for free (`opencode debug config` lists the instructions); add `--model <provider/model>` to send a canary only `HARNESS.md` can answer and assert the model replies with zero tool calls (it had no need to read a file, so the text was in context). A provider agent that has to open a file before answering was never given the instructions - fix the pointer, not the prompt.

## Adopt in a new project

Full procedure lives in `harness/scripts/adopt.md` (read once per project, never per task). Summary: `node <source-repo>/harness/scripts/adopt.mjs <targetRoot>` copies the harness, resets state, writes the AGENTS.md scaffold + agent pointers, smoke-runs `verify.mjs check`. Then fill the scaffold TODOs (verify rows, bans), write the target `skill.md`, pick one history stamp zone.
