# Harness - file-based agent ops (zero deps, star-worthy boring tech)

Coding agents fail in predictable ways: they lose track of state mid-task,
run the wrong (or every) test suite, and declare victory early. This repo
answers with markdown files plus a handful of small node scripts - no MCP
server, no services, no dependencies beyond node itself.

The whole harness lives under `harness/` (skills, scripts, templates,
story doc, entry-point README). Open the folder and the agent workflow
is right there.

## The loop

```
inspect -> plan (slot) -> implement -> hverify route|run -> fix -> review -> hslot done
              ^ tick the slot as you go (it is the progress bar) ^
```

## Parts

| Piece                            | Role                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_archive/current-task.md`       | Single live slot: Agent / Mission / Investigation / Findings / Approach / Plan / Verify / Current Thinking / Blockers / Hand-off Note. One task at a time, updated as work goes, cleared when done.                                                                                                                                                                        |
| `_archive/history.md`            | Done-log. One entry per finished task: `### doing - finished (agent, model)` plus what-changed + how-verified bullets.                                                                                                                                                                                                                                                     |
| `harness/scripts/hslot.mjs`      | Slot CLI. `new` opens work, `tick` checks Plan boxes, `note`/`block` record thinking and blockers, `show` prints state + scope, `check` gates headers/secrets/scope, `done` validates, logs history with a real UTC+7 stamp, and clears the slot. `compact` rotates old entries to monthly `history-YYYY-MM.md` files (undated entries are kept, nothing is ever deleted). |
| `harness/scripts/hrecall.mjs`    | Keyword retrieval over history. Scores title hits x3 and bullet hits x1, newest wins ties; `--limit N`, `--json` for machines. Pulls what matters instead of re-reading the board.                                                                                                                                                                                         |
| `harness/scripts/hverify.mjs`    | Verify router. Reads `git status`, maps changed files to the AGENTS.md Verify table, prints ONLY the matching commands (`route`), or runs them stopping at the first failure (`run`). Engine/domain and schema changes stay human-pick by design.                                                                                                                          |
| `.opencode/skills/`              | 4 SKILL.md (`autonomous-development`, `normalize-audit`, `session-handoff`, `ui-layout`). Provider-agnostic text; runtime home (opencode reads them here); `hpack` copies them into the bundle.                                                                                                                                                                            |
| `harness/templates/`             | Slot / history / history-template scaffolds the installer copies into a new project.                                                                                                                                                                                                                                                                                       |
| `harness/README.md`              | Entry point: layout, quickstart, agent reading list.                                                                                                                                                                                                                                                                                                                       |
| `harness/INSTALL.md`             | Self-wiring installer payload. Agent reads it and wires the harness into a target project.                                                                                                                                                                                                                                                                                 |

## Quickstart (60 seconds)

```
node harness/scripts/hslot.mjs new --mission "fix door delete" --step "trace" --step "fix" --step "verify"
# ... do the work, ticking as you go ...
node harness/scripts/hslot.mjs tick
node harness/scripts/hrecall.mjs "door delete" --limit 3   # what did we learn before?
node harness/scripts/hverify.mjs route   # prints ONLY what this change needs
node harness/scripts/hverify.mjs run     # or run it
node harness/scripts/hslot.mjs done --title "door delete fix" --detail "dual-side mirror" --detail "suites green"
# months later, when the board gets long:
node harness/scripts/hslot.mjs compact --older-than 30 --dry-run
```

`HARNESS_ROOT=/tmp/demo node harness/scripts/hslot.mjs ...` runs everything
against another root - that is how the demo above is tested without
touching real state.

## Why it works

- Single slot, never a second file per topic: no stale copies, no guessing where state lives.
- Verify routing kills the two classic wastes: running the full matrix "to be safe", and running nothing.
- `done` refuses with unchecked boxes and stamps real clock time, so "finished" means finished.
- Everything is plain text: `git diff` reviews the process, not just the code.

## Portability (hpack bundle)

`node harness/scripts/hpack.mjs [--out dist/agent-harness] [--zip]` assembles
a versioned bundle (the whole `harness/` folder, plus README + HARNESS.md +
INSTALL.md + VERSION + MANIFEST.json) from these repo sources. Ship the
folder or tarball, then in the target project:

```
node install.mjs --root /path/to/project [--state-dir _archive] [--skills-dir .opencode/skills] [--force]
```

The installer copies payloads (skips existing files unless `--force`), never
overwrites a live slot, adds `hslot`/`hverify`/`hrecall`/`hcheck` shortcuts to
package.json, maintains one managed AGENTS.md block via markers (idempotent
re-runs), and lists the target's `test:*` scripts so you can wire its own
Verify table. Adjust the route table in `harness/scripts/hverify.mjs` to
that repo's commands.
