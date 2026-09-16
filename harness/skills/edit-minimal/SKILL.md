---
name: edit-minimal
description: Smallest exact-match edit leaving untouched lines alone. Use when editing any existing file.
---

# Surgical Edits

Purpose: keep diffs reviewable by changing only what the task requires.

## Use when / Don't use

- Use: every edit to an existing file.
- Don't use: creating a new file; reverting by hand across many hunks (still keep intent-scoped).

## Rules

- Read the exact region first; match byte-for-byte (indentation, line endings).
- Smallest boundary wins. Every omitted line in a replacement is a deletion.
- No drive-bys: no reformatting, import reordering, or whitespace cleanup outside the changed region. Note style debt in the report instead.
- One intent per edit; split edits that serve two purposes.

## Workflow

1. Read target region.
2. Draft minimal oldString/newString pair.
3. Re-check draft: every line changed serves the task intent.
4. Apply; re-read edited region to confirm no collateral change.

## Verify

- Diff contains only task intent; each hunk explainable in one sentence. Unjustifiable hunk -> revert by hand-edit.
