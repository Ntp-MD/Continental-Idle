---
name: session-handoff
description: Lite file-based session handoff (CREATE/RESUME) so a fresh agent continues mid-task work with zero ambiguity. Invoke when pausing work, hitting a limit, resuming another agent's handoff, or when the user says handoff, resume, take over, save state, or continue where we left off. Pairs with autonomous-development at task start (RESUME) and before stopping (CREATE).
---

# Session Handoff Skill (lite)

File-based, no scripts, no dependencies.

## Storage (this repo)

- Active state: `_archive/current-task.md` (single live slot, sections:
  Agent / Mission / Investigation / Findings / Approach / Plan / Verify /
  Current Thinking / Blockers / Hand-off Note only).
- Done-log: `_archive/history.md` (Entries section only) - taker logs the
  finished entry here and clears the slot when done. Pattern + protocol:
  `_archive/history-template.md`.

## When to use

User-triggered: "save state", "create handoff", "pause", "resume from",
"continue where we left off", "take over".
Agent-triggered: after every meaningful step update the slot (limits
can hit anytime - disk must hold the latest state); before a voluntary
stop, re-check Hand-off Note; at task start, read the slot first.

## CREATE mode (leaving work behind)

1. Open `_archive/current-task.md`, update it AS WORK GOES: after every
   decision, problem hit, subtask done, or direction change - never batch
   it for the end, because the limit can hit at any step without warning.
   Disk must always hold the latest state.
2. Keep each section short (working note, not documentation). Never delete
   the section headers - leave a section blank if not applicable.
   `Current Thinking` holds the latest thought, not a summary.
   Detailed implementation plans live in the slot's `Plan` section as a
   checkbox list - never create a separate plan file for the same topic.
3. A hard limit gives no warning and no final write - the last saved
   snapshot IS the handoff. Keep Hand-off Note executable at all times:
   after every step it must already name the exact next action, so any
   snapshot is resumable on its own.
4. Final pass on voluntary stop only (user pause, session end): re-check
   Mission, Plan checkboxes, and Hand-off Note.
5. Validate manually - do not finalize if: any filled section is vague,
   Hand-off Note is not directly executable, secrets (keys, tokens,
   passwords) are present.
6. When done: clear the slot back to the empty template in place (headers only, no
   old task data) - edit/overwrite the file, never rm/delete/recreate it -
   and log the finished entry in `_archive/history.md`.
7. Confirm: report the slot location + one-line Hand-off Note to the user.

## RESUME mode (taking work over)

1. Read `_archive/current-task.md` fully before any other action,
   then re-read `_archive/history.md` for background.
2. Verify state manually: `git status` vs touched files named in the slot,
   timestamp freshness, assumptions still valid. No git: compare touched
   file modification times against the task start time instead.
3. Start from the first unchecked Plan item / Hand-off Note.
4. As work progresses, keep updating the slot (CREATE step 1).
5. When done: clear the slot and log the finished entry in
   `_archive/history.md` per its Pattern section.

## Compliance gate (mandatory, not advisory)

- A task is NOT done while the slot is stale: every finished sub-step
  must already be in `_archive/current-task.md` before the agent stops
  for any reason.
- A hand-off is REJECTED (taker must not guess forward) if: sections are
  vague, next action not directly executable, Verify missing for claimed
  work, secrets present. Fix the slot first, then continue.
- Report-completion precondition: matching suite green (for code changes)
  AND slot current (or cleared + logged if the work is fully done).

## Red flags - stop and verify before proceeding

- Slot file missing or headers deleted (recreate empty template first).
- Slot describes a task whose files do not exist (codebase moved on).
- New commits landed since the slot was written (stale context).
- Assumptions are invalid or blockers now block you (reassess, escalate).
- Next action is vague (re-explore the code before implementing).

## Attaching to another project (portable)

1. Copy this whole folder to the target project (same relative path,
   or any skills dir the target agent reads), plus
   `_archive/install-intent.md` (the installer lives next to the state
   files, not in this folder - keep exactly one copy).
2. In the target project, read `_archive/install-intent.md` and execute
   it - it is self-contained (all file contents embedded) and wires
   everything itself, then verifies.
3. No runtime, no packages, no services - markdown only (MIT upstream:
   softaworks/agent-toolkit).
