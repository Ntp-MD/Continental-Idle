---
name: finish-complete
description: Forbid TODOs, stubs, and fake implementations in delivered work. Apply before reporting any implementation task done.
---

# No Placeholders

Delivered work must be real all the way through. A weaker agent's favorite trick is leaving something that *looks* done: a `TODO` comment, a stub function returning canned data, a mock standing in for the real dependency, a button wired to nothing.

## Rules

- **No `TODO` / `FIXME` / `XXX` in delivered code.** If it is not done, the task is not done - say so instead of commenting it.
- **No stubs.** Every new function, handler, and branch must execute its real logic. `return null // implement later` is a failure, not progress.
- **No mock-for-real swaps.** Test doubles stay in tests. Production paths call production dependencies.
- **No dead UI.** Every control the user can see must do its job. Hidden, disabled-without-reason, or unwired controls are placeholders too.

## The one exception

A load-bearing reason to stop short (blocked, out of scope, needs a human decision) is legitimate - but it goes in the done report as an explicit unfinished item (see `report-gaps`), never hidden inside the code.

## Done-check

Before reporting done, search the touched files for `TODO|FIXME|XXX|stub|mock|placeholder|not implemented|implement later` (case-insensitive). Every hit must either be removed or promoted to a reported unfinished item. Zero silent hits.
