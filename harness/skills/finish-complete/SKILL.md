---
name: finish-complete
description: Deliver real logic - no TODOs, stubs, or dead controls. Use before reporting implementation done.
---

# No Placeholders

## Use when / Don't use

- Use: before every done report that includes implementation.
- Don't use: read-only audits or plans with no code change.

## Rules

- No `TODO`/`FIXME`/`XXX` in delivered code. Not done -> report it as unfinished (see `report-gaps`), never comment it.
- No stubs: every new function, handler, and branch executes real logic.
- Test doubles stay in tests; production paths call production dependencies.
- No dead UI: every visible control works. Hidden, disabled-without-reason, or unwired controls are placeholders.
- A stop-short (blocked, out of scope, needs a human decision) is legitimate only as an explicitly reported unfinished item.

## Verify

- Search touched files (case-insensitive): `TODO|FIXME|XXX|stub|mock|placeholder|not implemented|implement later`.
- Zero silent hits; every remaining hit is listed in the done report. Walk every touched UI control path.
