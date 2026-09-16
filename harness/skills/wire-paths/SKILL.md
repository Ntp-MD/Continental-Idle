---
name: wire-paths
description: Keep path references consistent across a move, rename, or structural change. Use before and after moving/renaming.
---

# Wire Paths

Purpose: a moved file must not leave dead references in docs, scripts, or gates.

## Use when / Don't use

- Use: before + after any move/rename, or structural change touching path references.
- Don't use: content-only edits with no path change. Dated log entries in `harness/state/history*.md` are never rewired.

## Rules

- Move tracked files with `git mv` (force only on explicit user order).
- Grep repo-wide for BOTH old path AND old basename; consumers use either form.
- Update every live consumer in the same change: docs, agent pointers, scripts (constants, messages, comments), templates, skill gates, verify table.
- One move, one verification (check command + routed suite).

## Workflow

1. Before move: grep old path + basename; list consumers.
2. `git mv` old new.
3. Update all consumers from step 1.
4. Re-grep; confirm zero live hits.

## Verify

- `rg -F "<old-path>"` and `rg -F "<old-basename>"` return hits only in dated history logs.
- `node harness/scripts/verify.mjs check` passes.
