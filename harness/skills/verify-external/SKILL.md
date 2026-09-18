---
name: verify-external
description: Check external APIs, URLs, and config keys against a real source. Use when citing anything outside the repo.
---

# No Guessing

Outside the repo, check the source; inside the repo, read the code.

## Use when / Don't use

- Use: any URL, library API/signature, CLI flag, config key, or version claim outside the repo.
- Don't use: references already present in the user message or local files (reuse as-is).

## Rules

- APIs/signatures: confirm against the installed dependency (types, bundled docs, `--help`), never from memory of a similar library.
- URLs: cite only if verified reachable and useful; otherwise remove or mark `unverified`.
- Config keys/flags: confirm against the tool's real schema or `--help`.
- Versions: pin what was checked; never write "latest".

## Verify

- Each external reference answers where it was verified (file path, URL + date, or command output). "I recall" -> remove it.
