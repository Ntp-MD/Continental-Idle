# Install Intent - self-wiring installer for lite session-handoff

Agent: reading this file means you are the installer. Execute Steps 1-5
in order to completion. Do not stop after one step. ASCII only, markdown
only, no runtime, no packages, no services.

Target: the project in your current working directory (NOT the repo this
file was copied from). Max 5 new files + 1 instruction edit. If the
target layout forces more, stop and ask with options.

Live slot is `<state>/current-task.md` (single file, Living Context
sections). Done-log lives in the state dir (`<state>/history.md`).

## Step 1 - Locate anchors (read-only)

- Project root = your cwd. Confirm it contains a code dir (e.g. `src/`).
- Instruction file: prefer existing `AGENTS.md`, else `CLAUDE.md`, else
  the harness rules dir (e.g. `.cursor/rules`). Record its path.
- Skills dir: prefer the harness convention (`.opencode/skills/`,
  `.claude/skills/`, `.agent/skills/`). Record it, default to
  `.opencode/skills/` if none exists.
- State dir: prefer existing `_archive/`, else `.claude/handoffs/`
  parent, else create `_archive/`. Record it. In the steps below
  `<state>` means this dir and `<skills>` means the skills dir.

## Step 2 - Write the skill file

Write `<skills>/session-handoff/SKILL.md` with exactly this content:

````markdown
---
name: session-handoff
description: Lite file-based session handoff (CREATE/RESUME) so a fresh agent continues mid-task work with zero ambiguity. Invoke when pausing work, hitting a limit, resuming another agent's handoff, or when the user says handoff, resume, take over, save state, or continue where we left off. Pairs with autonomous-development at task start (RESUME) and before stopping (CREATE).
---

# Session Handoff Skill (lite)

File-based, no scripts, no dependencies.

## Storage (this repo)

- Active state: `<state>/current-task.md` (single live slot, sections:
  Agent / Mission / Investigation / Findings / Approach / Plan / Verify /
  Current Thinking / Blockers / Hand-off Note only).
- Done-log: `<state>/history.md` (Entries section only) - taker logs the
  finished entry here and clears the slot when done. Pattern + protocol:
  `<state>/history-template.md`.

## When to use

User-triggered: "save state", "create handoff", "pause", "resume from",
"continue where we left off", "take over".
Agent-triggered: after every meaningful step update the slot (limits
can hit anytime - disk must hold the latest state); before a voluntary
stop, re-check Hand-off Note; at task start, read the slot first.

## CREATE mode (leaving work behind)

1. Open `<state>/current-task.md`, update it AS WORK GOES: after every
   decision, problem hit, subtask done, or direction change - never batch
   it for the end, because the limit can hit at any step without warning.
   Disk must always hold the latest state.
2. Keep each section short (working note, not documentation). Never delete
   the section headers - leave a section blank if not applicable.
   `Current Thinking` holds the latest thought, not a summary.
3. A hard limit gives no warning and no final write - the last saved
   snapshot IS the handoff. Keep Hand-off Note executable at all times:
   after every step it must already name the exact next action, so any
   snapshot is resumable on its own.
4. Final pass on voluntary stop only (user pause, session end): re-check
   Mission, Plan checkboxes, and Hand-off Note.
5. Validate manually - do not finalize if: any filled section is vague,
   Hand-off Note is not directly executable, secrets (keys, tokens,
   passwords) are present.
6. When done: clear the slot back to the empty template (headers only, no
   old task data) and log the finished entry in `<state>/history.md`.
7. Confirm: report the slot location + one-line Hand-off Note to the user.

## RESUME mode (taking work over)

1. Read `<state>/current-task.md` fully before any other action,
   then re-read `<state>/history.md` for background.
2. Verify state manually: `git status` vs touched files named in the slot,
   timestamp freshness, assumptions still valid. No git: compare touched
   file modification times against the task start time instead.
3. Start from the first unchecked Plan item / Hand-off Note.
4. As work progresses, keep updating the slot (CREATE step 1).
5. When done: clear the slot and log the finished entry in
   `<state>/history.md` per its Pattern section.

## Compliance gate (mandatory, not advisory)

- A task is NOT done while the slot is stale: every finished sub-step
  must already be in `<state>/current-task.md` before the agent stops
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
   `<state>/install-intent.md` (the installer lives next to the state
   files, not in this folder - keep exactly one copy).
2. In the target project, read `<state>/install-intent.md` and execute
   it - it is self-contained (all file contents embedded) and wires
   everything itself, then verifies.
3. No runtime, no packages, no services - markdown only (MIT upstream:
   softaworks/agent-toolkit).
````

## Step 3 - Write the state files

Write `<state>/current-task.md` with exactly this content (empty slot):

````markdown
## Agent
<!-- Name | Model ID (exact) | Provider -->

## Mission
<!-- Original instruction — translated to English -->
<!-- Received: YYYY-MM-DD HH:MM UTC+7 -->

## Investigation
<!-- Confirm the problem is real before touching anything -->
<!-- What was checked, what was found, verdict: confirmed | not-reproduced | unclear -->

## Findings
<!-- What exists, what's broken, what's unexpected -->
<!-- Facts only — no fixes here -->

## Approach
<!-- Chosen fix and why this over alternatives -->
<!-- Format: chose X over Y — reason -->

## Plan
- [ ] Step 1
- [ ] Step 2
- [ ] Step 3
<!-- Check off each step as done — do not batch at the end -->

## Verify
<!-- Matching suite + result, fixes applied on failure -->
<!-- Review verdict: correctness, regressions, correspondence -->

## Current Thinking
<!-- Latest thought only — where your head is right now -->

## Blockers
<!-- [HARD] blocks everything | [SOFT] blocks only this step -->
<!-- Format: [HARD/SOFT] — what — what's needed to unblock -->

## Hand-off Note
<!-- Next action must be directly executable -->
<!-- Leave blank if not handing off -->
````

Write `<state>/history.md` with exactly this content (fresh log - do NOT
copy entries from any other project):

````markdown
# History - shared cross-agent intent log

Entries only. Protocol + pattern live in `<state>/history-template.md` -
follow them when logging below.

## Entries (Doing - Finished (Agent, Model) + Detail Bullets)

- (empty - first finished task adds the first entry here)
````

Write `<state>/history-template.md` with exactly this content:

````markdown
# History template - protocol + pattern (static, do not log entries here)

Done-log lives in `<state>/history.md` under `## Entries`. Follow the
pattern below, keep this file unchanged.

## Protocol

- mode: file-bridge, no MCP server
- clock: all Started/Finished stamps in UTC+7 (Asia/Bangkok), format `YYYY-MM-DD HH:MM UTC+7`
- Handoff (mid-task takeover): live state lives in `<state>/current-task.md`
  (single slot, Living Context sections - read it at task start alongside
  this board); writer updates it after every meaningful step (limit can hit
  anytime, disk must hold the latest state), taker clears it when done and
  logs here

## Pattern (how to log)

- Shape per finished task:
  `### <doing> - <finished> (<agent>, <exact-model-id>)` followed by `- <detail>` bullets (what changed + how verified, no essays)
- Name states the exact model id/version, never a bare nickname; unrecoverable models use `(<agent>, model unknown)`
- Stamp: `YYYY-MM-DD HH:MM UTC+7` (Asia/Bangkok - convert before writing, never log UTC/Z/other zones)
- Log only when done, never in advance; extend the same block instead of adding a second one
- Installer/template upkeep is not logged here; product work only
- Times must be real (system clock) - never invent or round times for another agent's rows
````

Payloads already use `<state>` / `<skills>` placeholders - substitute the
recorded dirs throughout before writing (the live slot
`<state>/current-task.md` moves with the state dir - no `.context/` dir
needed). If the target team uses
another timezone, swap the UTC+7 clock lines in all state payloads
consistently.

## Step 4 - Register in the instruction file

- If the recorded instruction file has a skills registry section, append
  this line there (paths adjusted to Steps 1-3):
  ``- `session-handoff` (`<skills>/session-handoff/SKILL.md`) - lite file-based session handoff: `<state>/current-task.md` is the live slot (RESUME at task start, CREATE every meaningful step, clear when done); read when pausing mid-task or taking over another agent's work.``
- Add the wiring rule (new section if none fits):
  ``- Session handoff: RESUME (`<state>/current-task.md`) at task start, CREATE (update slot every meaningful step; final pass on voluntary stop only); log finished work in `<state>/history.md`.``
- If no instruction file exists, create a minimal `AGENTS.md` containing
  only a Skills section (line above) and a Session handoff wiring section
  (rule above).

## Step 5 - Verify and report

- Read back all written files. Grep the target repo for stale references
  (old board names, retired slot paths, duplicated templates) - zero must
  remain.
- Report: files created, instruction file touched, assumptions made
  (skills dir, state dir, timezone), how verified. Short, no essay.
