# Adopt in a new project

Automated (recommended): `node <source-repo>/harness/scripts/adopt.mjs <targetRoot> [--agents=opencode,cline,copilot,claude,gemini,cursor,windsurf]` - copies the harness folder into the target, resets the carried state (state/ slot -> empty shape, history -> preamble only, history-*.md archives dropped, glossary words wiped with the shape kept), writes the AGENTS.md scaffold (read chain + verify markers) and the agent pointers only for clients named via `--agents=` (canonical text + provider map in `harness/agents/`; `opencode` instead deploys the gate plugin to `.opencode/plugins/`) when missing, then smoke-runs `verify.mjs check` in the target and prints the remaining manual steps. Then:

1. Fill the <TODO> sections of the AGENTS.md scaffold: verify-table rows (backticked globs -> backticked npm scripts) and bans.
2. Write the target's domain skill file (`skill.md` at the repo root).
3. Pick ONE history stamp zone (any `UTC±H[:MM]`) - compact reads it from the stamps.

Manual (equivalent): copy this folder to the target, reset `state/task-context.md` to the empty slot shape and `state/history.md` to its preamble, rewrite the `state/context.md` glossary with the target's vocabulary (shape stays, words go), write the AGENTS.md scaffold, then add a pointer for every agent the target uses by copying `harness/agents/pointer.txt` to that provider's root path (map in `harness/agents/README.md`).
