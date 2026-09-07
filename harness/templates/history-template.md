# History template - protocol + pattern (static, do not log entries here)

Done-log lives in `<state>/history.md` under `## Entries`. Follow the
pattern below, keep this file unchanged.

## Protocol

- mode: file-bridge, no MCP server
- clock: all Started/Finished stamps in UTC+7 (Asia/Bangkok), format `YYYY-MM-DD HH:MM UTC+7`
- Handoff (mid-task takeover): live state lives in `<state>/current-task.md`
  (single slot, Living Context sections - read it at task start alongside
  this board); writer updates it after every meaningful step (limit can hit
  anytime, disk must hold the latest state), taker clears it when done and
  logs here

## Pattern (how to log)

- Shape per finished task:
  `### <doing> - <finished> (<agent>, <exact-model-id>)` followed by `- <detail>` bullets (what changed + how verified, no essays)
- Name states the exact model id/version, never a bare nickname; unrecoverable models use `(<agent>, model unknown)`
- Stamp: `YYYY-MM-DD HH:MM UTC+7` (Asia/Bangkok - convert before writing, never log UTC/Z/other zones)
- Log only when done, never in advance; extend the same block instead of adding a second one
- Installer/template upkeep is not logged here; product work only
- Times must be real (system clock) - never invent or round times for another agent rows
- Migrated rows (pre-clock-rule, exact times unrecoverable - bridge logs were reset): day bound `23:59`, not exact clock time
- Example:
  `### example task - 2026-09-05 06:40 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)`
  `- changed X in file Y`
  `- verified with Z (all green)`
