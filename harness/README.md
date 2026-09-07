# Agent Harness

The harness tool: scripts, templates, story doc, install payload, and
entry-point README. Open this folder and you see everything the agent
needs to work, route, and ship.

Skills live at `.opencode/skills/` (the runtime home opencode reads
from); `hpack` copies them into the bundle when shipping. Live slot
and history stay in `_archive/` per project convention.

The story behind the design lives in [`HARNESS.md`](./HARNESS.md). The
self-installing payload (for shipping this into another project) lives
in [`INSTALL.md`](./INSTALL.md).

## Layout

```
harness/
  README.md                   <- you are here (entry point)
  HARNESS.md                  <- story doc (why, when, how)
  INSTALL.md                  <- payload for shipping into another repo
  scripts/                    <- 5 node CLIs (zero deps beyond node)
    hslot.mjs                 <- live-slot + history CLI
    hrecall.mjs               <- keyword search over history
    hverify.mjs               <- verify router (AGENTS.md Verify table)
    hpack.mjs                 <- build a versioned bundle
    harness-install.mjs       <- install the bundle into a target repo
  templates/                  <- scaffolds the installer copies
    current-task.md           <- empty slot
    history.md                <- empty done-log
    history-template.md       <- pattern for log entries
```

Runtime skills (not in `harness/`):

```
.opencode/skills/
  autonomous-development/   <- workflow + plan template
  normalize-audit/          <- data-flow preflight
  session-handoff/          <- file-based handoff protocol
  ui-layout/                <- blueprint editor BEM/CSS guide
```

## For the agent

1. Read [`HARNESS.md`](./HARNESS.md) first - it explains the loop and why
   the pieces work the way they do.
2. Read [`.opencode/skills/session-handoff/SKILL.md`](../.opencode/skills/session-handoff/SKILL.md)
   at task start (RESUME the live slot) and after every meaningful step
   (CREATE - keep the slot current).
3. Read [`.opencode/skills/autonomous-development/SKILL.md`](../.opencode/skills/autonomous-development/SKILL.md)
   when implementing - it expands the plan template.
4. Read [`.opencode/skills/normalize-audit/SKILL.md`](../.opencode/skills/normalize-audit/SKILL.md)
   before touching any data flow (migration, load, save, sync, validate).
5. Read [`.opencode/skills/ui-layout/SKILL.md`](../.opencode/skills/ui-layout/SKILL.md)
   before touching any template, markup, CSS, or class.

## Quickstart

```sh
# Open work
node harness/scripts/hslot.mjs new --mission "fix door delete" --step "trace" --step "fix" --step "verify"

# Tick the plan as you go
node harness/scripts/hslot.mjs tick

# Search history for what we already learned
node harness/scripts/hrecall.mjs "door delete" --limit 3

# Print or run ONLY the suites matching the current change
node harness/scripts/hverify.mjs route
node harness/scripts/hverify.mjs run

# Close work
node harness/scripts/hslot.mjs done --title "door delete fix" --detail "dual-side mirror" --detail "suites green"
```

Or use the npm shortcuts in the repo root:

```sh
npm run hslot -- new --mission "fix door delete" --step "trace" --step "fix" --step "verify"
npm run hverify route
npm run hcheck
```

`HARNESS_ROOT=/tmp/demo node harness/scripts/hslot.mjs ...` runs the
whole CLI against another root - that is how demos and self-tests run
without touching real state.

## For the human

- Want to add a skill? Drop a new folder under `.opencode/skills/<name>/`
  with a `SKILL.md` that starts with the frontmatter (`name`, `description`).
  `hpack` picks it up automatically.
- Want to ship this to another repo? Run `node harness/scripts/hpack.mjs`
  to build a versioned bundle (with skills copied in), then
  `node install.mjs --root <target>` in the unpacked bundle.
- Want to see the long version? [`HARNESS.md`](./HARNESS.md).
