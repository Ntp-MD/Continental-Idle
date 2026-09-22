# LANE - feature-lane detail (progressive disclosure)

Load this file ONLY when the work is a multi-step feature / PRD / multi-ticket effort.
Routine tasks never need it - HARNESS.md's light loop covers them.

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

## Steps (full form)

1. Inspect - locate the relevant code, read neighboring files and the existing implementation before choosing a pattern. Never invent a new pattern when a repo pattern exists. Record current behavior, repo pattern to reuse, files that must change.
2. Plan - files to touch (a requested change spanning over 3 files is pre-authorized, see AGENTS.md), risks, the single matching verify suite. No coding until four parts are clear: What (scope + non-goals), Why (current vs expected with proof), How (steps in order), Why this way (pattern reused, rejected alternatives, risks + rollback). Pre-proof gate: a captured baseline exists; every edit anchor carries an identity; UI work names who confirms the visual. On feature-lane tickets, reuse the lane outputs (Mission summary, Impact Summary, picked interface) - plan only the ticket slice.
3. Implement - follow file-local conventions and the project's canonical patterns. Never add a second way. ASCII-only source, imports at top, no code comments unless requested. Never commit unless asked.
4. Test - run ONLY the suite matching the change (`verify.mjs route` prints it). Never the full matrix unless asked. When Phase F wrote the failing case first, this run is that same suite - one suite, two moments (red before, green after), never a second suite.
5. Fix - diagnose the root cause from the failing output, fix the smallest in-scope change, re-run. Pre-existing unrelated failures are reported separately, never fixed silently.
6. Review - correctness, regressions, chain (each changed function lists its direct callers + callees with a touched-or-unaffected verdict per edge; one hop mandatory, deeper only when an edge contract changed), correspondence (zero references to removed things; load `wire-paths` only when paths moved), scope (no files beyond the plan), architecture scan (list introduced complexity as candidates, never fix silently - the scope rule applies). Uncertainty gate: re-read each judged verdict (audit calls, boundary mappings) once against its quoted evidence; a verdict that flips between passes is marked UNCERTAIN and escalated, never silently picked. A verdict without a `file:line` evidence quote does not count.
7. Done - report in the Report format section of HARNESS.md.

## Feature lane (idea -> tickets -> per-ticket loop)

For conversational ideas, PRDs, or issues - run once before the loop above. Each ticket then runs Steps on its own slot cycle. Lane outputs are loop inputs - per-ticket Steps reuse them, never re-derive them.

Entry router - detect first, print one status line (e.g. "Starting from: raw idea -> Phase A"):

| What exists                  | Start at      |
| ---------------------------- | ------------- |
| Raw idea / "I want X"        | Phase A       |
| PRD or spec already written  | Phase B       |
| Codebase exists, work clear  | Phase C       |
| Issue / ticket exists        | Phase E       |
| Everything ready, just build | Phase F       |

A. Align - interview before any code: problem, who/when, edge cases, what done looks like, what must NOT change. Output: Alignment Summary (bullet list, <=10 items) into slot Mission. Skip when a PRD/spec/issue already covers it.

B. Model/Language - load `state/context.md` (shared language) plus `skill.md`. For each new term: check glossary conflicts, pick a canonical name, patch `state/context.md`. Contested terms wait for user confirmation before locking. Skip when no new terms.

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

## Calibration loop

- Whenever variance hits (audit verdict flips, fix takes 2+ rounds, scope grows unplanned), append one line to the history entry: which step's budget held or broke.
- Every `compact` run, scan the variance lines: the step with the most UNCERTAIN/broken-budget hits gets a tighter evidence rule next. The harness improves itself; no separate tracking file.
