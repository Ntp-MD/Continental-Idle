---
name: edit-minimal
description: Make the smallest exact-match edit, leaving unrelated lines untouched. Use when editing an existing file.
---

# Surgical Edits

Keep diffs reviewable: change only what the task requires.

## Use when / Don't use

- Use: every edit to an existing file.
- Don't use: creating a new file.

## Rules

- Read the exact region first; match byte-for-byte (indentation, line endings).
- Smallest boundary wins. Every omitted line in a replacement is a deletion.
- No drive-bys: no reformatting, import reordering, or whitespace cleanup outside the changed region. Note style debt in the report instead.
- One intent per edit; split edits that serve two purposes.
- Re-read the edited region after applying.

## Verify

- Each hunk is explainable in one sentence; an unjustifiable hunk is reverted by hand-edit.
