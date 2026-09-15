---
name: edit-minimal
description: Minimal exact-match file edits that leave untouched lines alone. Apply when editing any existing file.
---

# Surgical Edits

Change only what the task requires. A weaker agent rewrites whole files: untouched lines shift, formatting drifts, working code gets "improved" as a side effect - and the review can no longer tell what actually changed.

## Rules

- **Derive from current content.** Read the exact region first; match it byte-for-byte, including indentation and line endings.
- **Smallest boundary wins.** Prefer the few-line replacement over the block rewrite. Every omitted line in a replacement is a deletion - re-check the draft before applying.
- **Never reformat untouched lines.** No style drive-bys, no import reordering, no whitespace cleanup outside the changed region. If the file's style offends you, note it in the report instead.
- **One intent per edit.** If an edit starts serving two purposes, split it.

## Done-check

Before reporting done, confirm for every touched file: the diff contains only the task's intent, and you can explain each changed hunk in one sentence. A hunk you cannot justify is a hunk to revert.
