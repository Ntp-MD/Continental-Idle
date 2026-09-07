# Install Intent - self-wiring installer for the agent harness

Agent: reading this file means you are the installer. Execute Steps 1-5
in order to completion. Do not stop after one step. ASCII only, markdown
only, no runtime, no packages, no services.

Target: the project in your current working directory (NOT the repo this
file was copied from). Max 5 new files + 1 instruction edit. If the
target layout forces more, stop and ask with options.

The harness itself lives at `<bundle>/` (this folder: `INSTALL.md`,
`HARNESS.md`, `README.md`, plus `skills/`, `scripts/`, and `templates/`
that `hpack` populates from the source repo). The live slot is
`<state>/current-task.md` (single file, Living Context sections). The
done-log lives in the state dir (`<state>/history.md`).

## Step 1 - Locate anchors (read-only)

- Project root = your cwd. Confirm it contains a code dir (e.g. `src/`).
- Bundle root: the folder this file lives in (`<bundle>`). The
  installer reads `skills/`, `scripts/`, `templates/`, `HARNESS.md`,
  `README.md`, and `INSTALL.md` from here. The `install.mjs` payload
  in this folder is what gets copied into a target project on demand.
- Instruction file: prefer existing `AGENTS.md`, else `CLAUDE.md`, else
  the harness rules dir (e.g. `.cursor/rules`). Record its path.
- Skills dir: prefer the existing convention in the target
  (`.opencode/skills/`, `.claude/skills/`, `.agent/skills/`). Default
  to `.opencode/skills/` - the harness ships its own skills folder
  that the agent reads directly.
- State dir: prefer existing `_archive/`, else `.claude/handoffs/`
  parent, else create `_archive/`. Record it. In the steps below
  `<state>` means this dir and `<skills>` means the skills dir.
- Agent config (if present): if the target uses `opencode.json` or
  similar with a `skills.paths` array, append the absolute path of
  `<bundle>/skills` to that array. Do not rewrite the file.

## Step 2 - Write the skill files

For each folder in `<bundle>/skills/`, copy its `SKILL.md` into
`<skills>/<folder>/SKILL.md` in the target. If the target has a
different convention (e.g. `.claude/skills/`), copy there instead.

If the target lacks a `session-handoff` skill, copy
`<bundle>/skills/session-handoff/SKILL.md` (its content is below) so
the wire-up has a target. Otherwise skip this step.

`<bundle>/skills/session-handoff/SKILL.md` payload:

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

1. Copy the whole `<harness>/` folder to the target project (any path
   the target agent can read for skills), plus
   `<harness>/INSTALL.md` (the installer lives next to the harness,
   not in the state dir - keep exactly one copy).
2. In the target project, read `<harness>/INSTALL.md` and execute
   it - it is self-contained (all file contents embedded) and wires
   everything itself, then verifies.
3. No runtime, no packages, no services - markdown only (MIT upstream:
   softaworks/agent-toolkit).
````

## Step 3 - Write the state files

Copy `<harness>/templates/current-task.md` to `<state>/current-task.md`
(empty slot).

Copy `<harness>/templates/history.md` to `<state>/history.md` (fresh log
- do NOT copy entries from any other project).

Copy `<harness>/templates/history-template.md` to
`<state>/history-template.md` (static pattern doc).

The `<harness>/templates/` scaffolds already use `<state>` and `<skills>`
placeholders in the same shape the installer used to use inline - the
installer now copies verbatim, no substitution. If the target team uses
another timezone, swap the UTC+7 clock lines in all three templates
consistently.

## Step 4 - Register in the instruction file

- If the recorded instruction file has a skills registry section, append
  one line per skill under `<skills>/` (paths adjusted to Steps 1-3):
  ``- `<name>` (`<skills>/<name>/SKILL.md`) - <description from frontmatter>.``
- Add the wiring rule (new section if none fits):
  ``- Session handoff: RESUME (`<state>/current-task.md`) at task start, CREATE (update slot every meaningful step; final pass on voluntary stop only); log finished work in `<state>/history.md`.``
- If no instruction file exists, create a minimal `AGENTS.md` containing
  the skills section and the Session handoff wiring section above.

## Step 5 - Verify and report

- Read back all written files. Grep the target repo for stale references
  (old board names, retired slot paths, duplicated templates, references
  to `.opencode/skills/...` skills not in this bundle) - zero must remain.
- Report: files created, instruction file touched, assumptions made
  (skills dir, state dir, timezone), how verified. Short, no essay.
