# Harness

Single-folder agent ops: one doc, one slot, one log, one script folder. No services, no dependencies beyond node. Copy this folder into any project, write the project's instruction file, and work.

Coding agents fail in predictable ways: they lose track of state mid-task, run the wrong (or every) test suite, and declare victory early.

## Read chain

1. Project instruction file first (this repo: `AGENTS.md`) - digest, project adapter values (standing orders, verify table, bans).
2. This file - the full rules: operating mode, loop, report format.
3. `state/task-context.md` - live slot, current state. Read it at task start.
4. `state/history.md` - human reference log. The agent never reads it on its own - only when the user explicitly orders an investigation.
5. Project skill file (this repo: `skill.md`) - only when the task touches project domain.
6. `state/context.md` - shared language (glossary). Read when domain terms or wording matter; patch it when a new term locks.
7. `LANE.md` - ONLY for multi-step feature/PRD/multi-ticket work. Routine tasks never load it.

Canonical patterns live in the project's `skill.md` (router) + `docs/skill/*.md` - reuse them, never a second way. The glossary lives in `state/context.md` only - never a second glossary file. Skills (task-triggered guardrails) live in `skills/` - read only through their trigger, never wholesale.

## Operating mode

This folder is not a checklist - it is a software engineer. Facts are looked up, never asked; decisions are put to the user; the first interface idea is never the last.

- Infer intent, not literal. Short prompt = incomplete spec: find the matching repo pattern first, fill gaps with repo convention, never invent a new one.
- Expand terse prompts into scoped, actionable output without asking first; build forward toward a usable implementation, not a literal restatement.
- Land on the relevant code and read before writing: navigate to the parts actually needed, check neighbors + existing impl before choosing a library or pattern. Verify the dependency is already used.
- Zero-duplication: never create a second way to do the same thing. No duplicate impls, facades, or wrappers.
- Decide, don't stall: a reversible in-repo choice is decided NOW and logged as a veto-able decision - including unrequested scope growth past 3 files, new dependencies/infra, and interface picks. Veto is a normal follow-up, not an error. STOP + ask ONLY for: secrets/auth change, irreversible actions outside the repo, genuinely missing information, and anything the project's standing order excludes. Asking is the last resort, never the default.
- Safe iteration is pre-authorized: run the routed verify suite, fix failures caused by the requested change, and rerun without asking for approval at each step.
- Claim then impact: user-reported bug/request -> verify against code first and state what is actually true; assess impact + pros/cons before implementing.
- Engineering standard: for every choice, pick the efficient / best-practice / higher-performance / cleaner-code option first; state why the chosen path won when alternatives exist.
- Keep scope: fix the asked task only. User correction persists for the session.
- Per-project standing orders (e.g. pre-release wipe policy, off-limits folders) live in the project's AGENTS.md - not here.

Every task walks the loop below - inspect, plan, implement, test, fix, review, done. A routine one-file fix walks the light loop: inspect -> implement -> verify, slot needs only Mission + Plan + Hand-off.

## Slot protocol

- `state/task-context.md` is the single live slot - never a second one per topic (4 sections: Mission / Plan / Blockers / Hand-off Note). Never delete the headers.
- Update the slot after every meaningful step. Write-through triggers: user order or context shift, a finding or root cause, a landed choice. Slot writes are silent.
- RESUME at task start: read the slot first, verify against working-tree status. Start from the first unchecked Plan item / Hand-off Note.
- Finish: tick every Plan box, log the entry in `state/history.md`, clear the slot back to the empty shape (`(empty)` / `- (none)`, see `adopt.mjs` `EMPTY_SLOT`). A task is NOT done while the slot is stale.

## Verify routing

- The verify table lives in `AGENTS.md` (between `verify` markers) - it is the ONLY routing source; the harness ships no suite names. Row format, glob semantics, and bans are documented next to that table, stated there once - never restated here.
- `node harness/scripts/verify.mjs route` prints ONLY the suites matching the working tree; `run` executes them and stops at the first failure. A row with no concrete script is a human-pick row - the router never chooses.
- `drift` is the mid-task re-anchor: run it every ~8 non-meta file edits and after ANY context cutoff/compaction. It prints the anchor line (Mission + next unchecked Plan item) to re-confirm intent; exit 1 = drift - fix the slot before any further edit.
- `audit` validates every `file:line` evidence quote in the slot + latest history entry against the working tree; exit 1 = a quote points nowhere - fix the quote. `--all` scans every archived entry too (old quoted line numbers drift as code moves - expect noise).
- `table` validates the verify table against `package.json`; `check` gates slot headers, secrets, scope, and the table. Run `check` before reporting done.
- Harness-owned convention: temp diagnostics go in `tests/_*.tmp.ts`, deleted same session, never committed - the router filters them out.

## Report format

Full template + rules live in `skills/report-gaps/SKILL.md` (read at Done time). Shape: verdict headline `<task> - DONE|PARTIAL|BLOCKED (<n>/<total>)`, then fixed headings Changed / Decisions (veto-able) / Gaps (mandatory, `(none)` when empty) / Verify (exact commands + result). No tables; <2-file tasks collapse to Changed + Verify; opinion/question answers use Evidence + Options instead; audits are read-only (Findings replaces Changed, verdict says "read-only").

## History pattern

- Entry shape: `### <doing> - <finished> (<agent>, <exact-model-id>)` followed by `- <detail>` bullets (what changed + how verified, no essays).
- Stamp: `YYYY-MM-DD HH:MM UTC+7` (adjust the zone per project; compact reads the offset from each stamp itself - pick one zone per project and keep every stamp consistent).
- Log only when done, never in advance. Log what changed or was decided. Never log questions asked, read-only audits with no change, recommendations not taken, or parked ideas. Routine fixes, refactors, cleanups are not recorded.
- Direction decisions are `- decision:` bullets inside that entry - the history log IS the Decision Timeline; there is no separate decisions file.
- Over 20 entries: run `node harness/scripts/verify.mjs compact`.

## Autopilot mode

The agent decides instead of the user. Activation: user says `autopilot` (or `autopilot off` to end it). Write `Mode: autopilot` as the first line of the slot Mission so RESUME restores it.

1. Decide, don't ask - the Operating-mode decide rule already covers scope/dependencies/interface; in autopilot it also covers Phase D picks.
2. Decision rule, in order: most reversible option > closest to an existing repo pattern > simplest. State the assumption in the done report.
3. Every non-trivial decision logged as `- decision:` in `state/history.md`; the done report opens with the decision log.
4. Batch checkpoints: report at the end (or a phase boundary), never mid-task.
5. Still hard-stopped: the STOP list, plus deleting/rewriting persisted store content without an explicit user order - leave a Blockers entry and end with the question.

`autopilot off` returns to normal mode - remove the slot marker in the same breath.

## Safety

Single sources: `AGENTS.md` owns project adapter values (standing orders, verify table, bans); this file owns the full rules. Harness-specific reminder: move/rename with `git mv`, then grep old path AND old basename repo-wide per `wire-paths`.

## Enforcement

The rail is mechanical - rules and thresholds live in `scripts/rail.mjs` (single source). Commit gate: `.githooks/pre-commit` runs `verify.mjs check` on every commit; enable with `git config core.hooksPath .githooks` (bypass emergencies with `--no-verify`). Pre-call gate + scheduled re-anchor run via the opencode plugin (loader at `.opencode/plugins/harness-gate.js`, single source in `agents/opencode/`) - install detail and plugin behavior live in `scripts/adopt.md`. Prove agent wiring with `node harness/scripts/probe-agent.mjs`.

## Adopt in a new project

Full procedure lives in `harness/scripts/adopt.md` (read once per project, never per task): `node <source-repo>/harness/scripts/adopt.mjs <targetRoot> [--agents=...]` copies the harness, resets state, writes the AGENTS.md scaffold + agent pointers, smoke-runs `verify.mjs check`.
