---
name: wire-paths
description: Keep path references consistent across a move or rename. Use before and after moving/renaming.
---

# Wire Paths

A moved file must not leave dead references in docs, scripts, or gates.

## Use when / Don't use

- Use: before and after any move/rename, or structural change touching path references.
- Don't use: content-only edits with no path change. Dated `harness/state/history*.md` entries are never rewired.

## Rules

- Move tracked files with `git mv` (force only on explicit user order).
- Grep repo-wide for BOTH the old path and the old basename - consumers use either form.
- Update every live consumer in the same change: docs, agent pointers, scripts (constants, messages, comments), templates, skill gates, verify table.
- One move, one verification (check command + routed suite).

## Verify

- Old path and basename return hits only in dated history logs; `node harness/scripts/verify.mjs check` passes.
