---
name: verify-external
description: Verify external APIs, URLs, and config keys against a real source before citing. Use when referencing anything outside the repo.
---

# No Guessing

Purpose: outside the repo, check the source; inside the repo, read the code.

## Use when / Don't use

- Use: any URL, library API/signature, CLI flag, config key, or version claim outside the repo appears in code or report.
- Don't use: references already present in user messages or local files (reuse as-is).

## Rules

- APIs/signatures: confirm against installed dependency (types, bundled docs, or `--help`), never from memory of a similar library.
- URLs: cite only if verified reachable and useful. Otherwise remove or mark `unverified`.
- Config keys/flags: confirm against the tool's real schema or `--help`.
- Versions: pin what was checked. Never write "latest".

## Workflow

1. List every external reference the change/report introduces.
2. For each: locate source (node_modules types, official docs fetch, `--help` output).
3. Pin version + check date for version-sensitive claims.

## Verify

- Each external reference answers: where verified (file path, URL + date, or command output). "I recall" -> remove reference.
