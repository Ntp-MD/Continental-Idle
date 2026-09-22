# Adopt in a new project

Automated (recommended): `node <source-repo>/harness/scripts/adopt.mjs <targetRoot> [--agents=opencode,cline,copilot,claude,gemini,cursor,windsurf]` - copies the harness folder into the target, resets the carried state (state/ slot -> empty shape, history -> preamble only, history-*.md archives dropped, glossary words wiped with the shape kept), writes the AGENTS.md scaffold (read chain + verify markers) and the agent pointers only for clients named via `--agents=` (canonical text + provider map in `harness/agents/`; `opencode` instead deploys the gate plugin to `.opencode/plugins/`) when missing, then smoke-runs `verify.mjs check` in the target and prints the remaining manual steps. Then:

1. Fill the <TODO> sections of the AGENTS.md scaffold: verify-table rows (backticked globs -> backticked npm scripts) and bans.
2. Write the target's domain skill file (`skill.md` at the repo root).
3. Pick ONE history stamp zone (any `UTC±H[:MM]`) - compact reads it from the stamps.

Manual (equivalent): copy this folder to the target, reset `state/task-context.md` to the empty slot shape and `state/history.md` to its preamble, rewrite the `state/context.md` glossary with the target's vocabulary (shape stays, words go), write the AGENTS.md scaffold, then add a pointer for every agent the target uses by copying `harness/agents/pointer.txt` to that provider's root path (map in `harness/agents/README.md`).

## Gate plugin behavior (opencode)

The plugin's single source is `agents/opencode/harness-gate.js` (rules + thresholds imported from `scripts/rail.mjs`); `--agents=opencode` deploys the `loader.js` shim to `<target>/.opencode/plugins/harness-gate.js` - the only path opencode scans (no config entry, loads at startup; restart opencode/Zed after changing it; verify with `opencode debug info`).

- Pre-call gate: on `edit`/`write` it counts distinct non-meta project files for the session; a second one while the slot Mission is still empty throws - a medium+ task cannot start without `harness/state/task-context.md` filled. Lite (one file) is exempt; meta paths never count, so the agent can always write the slot itself to unblock.
- Scheduled re-anchor: every `ANCHOR_EVERY_CALLS`-th non-meta edit call (see `rail.mjs`) it throws one "Harness anchor (not an error)" message carrying the slot's Mission line + next unchecked Plan box - the agent re-reads the anchor, confirms or fixes the slot, and retries the edit. Closes the drift gap after context compaction.
- Non-opencode agents run no plugin: they stay instruction-only and get the manual fallback (`verify.mjs drift` per HARNESS.md Verify routing).
