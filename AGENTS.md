# AGENTS

Repo instructions for AI agents. Read the matching section before touching an area. Explicit user instruction > this file > general best practice.

## Operating mode

- Infer intent, not literal. Short prompt = incomplete spec: find the matching repo pattern first, fill gaps with repo convention, never invent a new one.
- Expand terse prompts into scoped, actionable output without asking first; build forward toward a usable implementation, not a literal restatement.
- Land on the relevant code: navigate to the parts actually needed, no generic boilerplate.
- Read before write: check neighbors + existing impl before choosing a library or pattern. Verify the dependency is already used.
- Zero-duplication: never create a second way to do the same thing. No duplicate impls, facades, or wrappers.
- DO directly: in-scope edits, local refactors, obvious wiring. STOP + ask: destructive (rm/migrate/drop), scope >3 files, new dependency/infra, secrets/auth change.
- Rule: confidence >80% and reversible -> do it, state assumption in report. Else ask.
- Ask with options: whenever stopping to ask, present numbered options (2-4) each with pros/cons, then state which option is recommended and why.
- Claim then impact: user-reported bug/request -> verify against code first and state what is actually true; assess impact + pros/cons before implementing.
- Engineering standard: for every choice, pick the efficient / best-practice / higher-performance / cleaner-code option first; when alternatives exist, state briefly in the report why the chosen path won.
- Keep scope: fix the asked task only. User correction persists for the session.

## Autonomous Development Workflow

`inspect -> plan -> implement -> test -> fix -> review -> repeat` per
`.opencode/skills/autonomous-development/SKILL.md`. Live slot (in
`harness/`) must be current (or cleared + logged in history.md) - a task
with a stale slot is not finished.

## Autonomous Execution

Do not stop merely because one step is complete.

After finishing each step, determine the next required step and continue automatically.

Do not ask the user to say "continue" unless:

- required information is genuinely missing,
- an action requires explicit user approval,
- or the task is genuinely blocked.

If a test fails, do not simply report the failure. Investigate and fix it before continuing.

If the original approach is no longer valid, revise the plan and continue from the current state.

## Plan capture

State dir is `harness/` (live slot `current-task.md`, done-log `history.md`, plan files). Format + protocol live in `harness/HARNESS.md`, `harness/INSTALL.md`, and `harness/templates/`. Do not restate them here.

## Skills

Registry is provider-agnostic; skill files stay in place, never copy per provider. Read the skill before matching work.

- `normalize-audit` (`.opencode/skills/normalize-audit/SKILL.md`) - before touching data flow: migration, loaders, persistence, sync, validation, engine adapters, UI saves.
- `autonomous-development` (`.opencode/skills/autonomous-development/SKILL.md`) - how to run the Autonomous Development Workflow: inspect -> plan -> implement -> test -> fix -> review -> repeat.
- `ui-layout` (`.opencode/skills/ui-layout/SKILL.md`) - canonical form/markup/CSS/class patterns; pairs with `autonomous-development` at Implement + Review for every template/markup/CSS/class change.
- `data-schema` (`.opencode/skills/data-schema/SKILL.md`) - persisted store modules, SVG authoring, AssetDef + CanvasConfig field change checklists, engine test conventions.
- `editor-patterns` (`.opencode/skills/editor-patterns/SKILL.md`) - canonical UI patterns for `src/blueprint-editor/`: modals, tabs, confirm, dirty tracking, concurrency, store access, declarative schemas.
- `session-handoff` (`.opencode/skills/session-handoff/SKILL.md`) - lite file-based session handoff (RESUME at task start, CREATE every meaningful step, clear when done).

## Verify

Run ONLY the suite matching the change, never the full matrix.

| Changed                                      | Run                                                          |
| -------------------------------------------- | ------------------------------------------------------------ |
| Template/markup/CSS/class (`*.vue`, `*.css`) | `lint:bem` + `lint:css` (+ `typecheck` if a Vue SFC changed) |
| Engine/domain TS                             | the single matching `test:<name>`                            |
| Schema/persistence/sync                      | the single matching schema suite                             |

Router: `npm run hverify` (route = print, run = execute) derives ONLY the row above from `git status`; engine/domain and schema rows stay human-pick. Story: `harness/HARNESS.md`. Entry point: `harness/README.md`.

Bans: no `verify` / `test` matrix unless asked. Never `test:npc-perf`, `test:npc-scale`, `test:behavior`, `observe:hotel` unless asked. Temp diagnostics go in `tests/_*.tmp.ts`, deleted same session, never committed.

Report: claim verdict (which part of the report was true), what changed, assumption made, impact/trade-offs, how verified. Short, no essay. Report unrelated failures separately, never fix silently.

## Decisions

Direction-level decisions only (Problem / Final solution / Trade-off / Revisit trigger) go in the Decision Timeline. Routine fixes, refactors, cleanups are not recorded.