# AB protocol - measuring harness impact (future runner: ab-spec.mjs)

Status: protocol only - runner not built yet. Build the runner from this doc when picked up.

## Question

Does an agent WITH the harness (AGENTS.md + HARNESS.md + gate plugin) produce measurably
better/different work than the same agent WITHOUT it?

## Fairness controls

- Same model, same opencode, same task prompts for both conditions.
- Condition A = full harness. Condition B = instruction files stripped + gate plugin absent.
- >= 3 runs per task per condition (LLM variance); compare means, never single runs.
- Playground repo, not this one: copy project structure + tasks that were never done here
  (no contamination). Fresh clone per run.

## Task set - each task targets one harness guarantee

1. Multi-file feature (5 files) -> slot/gate forces plan-before-edit
2. Single-file fix -> lite loop (no ritual overhead)
3. Task with scope-creep temptation -> keep-scope rule
4. Interrupted mid-task (simulated cutoff) -> RESUME from slot
5. Change files of several types -> verify routing picks the right suites
6. Feature whose canonical pattern already exists -> zero-duplication

## Metrics (objective only)

Process (the harness's own promises, parsed from transcript + git log order):
- slot written before 2nd project file edit (y/n)
- files touched vs allowed list (scope-creep count)
- suites run == suites the route table names
- report matches the HARNESS.md Report format (y/n)

Outcome (run the full suite after every finished task, both conditions):
- tests pass/fail
- lint:bem / lint:css violations introduced
- TODO|FIXME|stub leftovers
- steps + tokens consumed (cost)

Judged (blind rubric, 0-2 per criterion, grader does not know which run had the harness):
- pattern reuse, edge-case handling, report honesty

## Run math

Start small: 1 playground repo, 3 tasks, 3 runs x 2 conditions = 18 runs. Expand only if
the delta is promising.

## Runner sketch (ab-spec.mjs)

- scaffold playground per condition (A keeps AGENTS/HARNESS/plugin; B removes them)
- headless per run: `opencode run "<task>"` with cwd = playground (same mechanism as
  probe-agent.mjs canary), capture transcript
- parse metrics; run full suite + lints post-task; emit one markdown table per condition
- temp dirs only; `--keep` for debugging; never touch the real repo

## Known limits

- Measures script-visible behavior + outcome quality, not long-horizon drift recovery
  (that needs an interactive session, cannot headless-run).
- Grader rubric stays subjective - keep criteria count low and defined above.
