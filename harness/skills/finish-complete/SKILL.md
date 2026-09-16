---
name: finish-complete
description: No TODOs, stubs, or fake implementations in delivered work. Use before reporting implementation done.
---

# No Placeholders

Purpose: delivered code is real all the way through.

## Use when / Don't use

- Use: before every done report that includes implementation.
- Don't use: read-only audits or plans with no code change.

## Rules

- No `TODO`/`FIXME`/`XXX` in delivered code. Not done -> report as unfinished (see `report-gaps`), never comment it.
- No stubs: every new function, handler, and branch executes real logic.
- Test doubles stay in tests; production paths call production dependencies.
- No dead UI: every visible control works. Hidden/disabled-without-reason/unwired controls are placeholders.
- Exception: a load-bearing stop-short (blocked, out of scope, needs human decision) is legitimate only as an explicit reported unfinished item.

## Workflow

1. Search touched files (case-insensitive): `TODO|FIXME|XXX|stub|mock|placeholder|not implemented|implement later`.
2. For each hit: remove (finish the work) or promote to a `report-gaps` unfinished item.
3. Click/walk every touched UI control path; confirm wired.

## Verify

- Zero silent hits from the search above. Every remaining hit is listed in the done report as unfinished.
