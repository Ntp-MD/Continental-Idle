## Mission

Mode: autopilot through the free-token window (until 2026-09-30). Grow Continental Idle into an idle
game: a takings economy read off the live simulation, then content and progression on top of it.
Carried: placement/collision hardening (loops 1-18) is complete and uncommitted.

## Plan

### Loop 19 - takings ledger (the first economy layer)

- [x] `src/blueprint-editor/domain/economy/takings.ts` - pure ledger over the engine's own event stream:
  integer cents, `TAKING_RATES_CENTS` per tag (declared, no corpus source), one payment per completed
  visitor interaction at the best-qualifying tag, 30-sim-second ring bucket for the live income rate.
- [x] `createTakingsResolver(index)` - the one event -> `{roleId, tags}` lookup, shared by the app and
  the tests; the app supplies it from `engine.getAgent` and the built target index keyed by
  `interactionTargetKey` (the engine keeps the key format).
- [x] Visitor rule: a role with no `taskIds` consumes, every other role works - staff never bill.
- [x] Wired in `useNpcSimulationCore`: `frame()` feeds the drained batch to the ledger, `deploy`/`reset`
  clear it, `targetTagsByKey` built in `buildEngine`, resolver memoised per simulation.
- [x] HUD block in `PropertiesPanel.vue` under the NPC preview stats (one poll timer, not two).
- [x] Tests: `takingsLedger.test.ts` (13 rule cases), `takingsFromEngine.test.ts` (3 - real
  `buildNpcEngineLayout` + real engine run, recurring income proven: 1 guest served a bar 9x in 40
  sim-seconds), `takingsSimulationWiring.test.ts` (1 - the rAF frame loop pays the ledger with no
  caller wiring).
- [x] Falsified: inverting the visitor guard fails 9 tests including both engine-integration
  directions; the rate-window test caught a real off-by-one in the ring (it evicted the oldest second
  the moment it was written).
- [x] Measured on the authored `floor-g` (502 agents, 10 roles, 6000 ticks = 100 sim-seconds, headless):
  **0 interactions, bank 0.00** - `builtTargets: 6`, every one of them `front-desk` +
  `post:reception-station`, and 24,222 `no-wander` waits. The 264 placed fixtures carry almost no
  `interactSpots`, so guests have nowhere to be served. Not a ledger defect: the first honest readout
  of the plan as an earning room.
- [x] Gap from loop 19 **CLOSED as a misdiagnosis in loop 22** - "the ledger cannot bill check-in" is
  false: `reception-desk` carries 3 guest-side spots with no `post` tag and they do bill. What is real is
  coverage (8% of declared arrivals), which is a game-feel question, recorded below.
- [ ] Gap found, NOT fixed - an agent that gives up after `queuePatienceSeconds` (`abandonQueue`) emits
  nothing, so impatience is invisible and `walkOuts` only counts `queue-left` (targets went away).
  Needs a new `NpcEngineWaitReason`, which the overlay switch and the type union both enumerate.

### Loop 20 - the economy is measurable: `arch takings`

- [x] `visitorRoleIds(roles)` extracted to `domain/economy/takings.ts` - the customer/staff rule now
  lives once, read by both the running simulation (`useNpcSimulationCore`) and the offline measurement
  (`scripts/arch/takings.ts`). Test: "a role that holds a duty post is staff".
- [x] New command `npm run arch -- takings [--in payload] [--ticks n] [--agents n] [--plan path]`:
  drives the real `NpcEngine` + `createNpcEnginePolicy` + the ledger, prints bank, per-minute, served,
  walk-outs, earned-by-facility, **completed-but-unbilled**, staff completions, started-vs-completed
  (jam signal) and wait reasons. `--plan` builds into `out/takings-probe.json`, never into the authored
  store. Exit 1 when nothing is served, so a plan that cannot earn fails.
- [x] `scripts/arch/lobby/services-probe.txt` - the income fixture (66 fixtures, 75 targets, ~42 seats).
  The engine pocket guard refused it until it had a `%%facade-doors` entry: an interior with no street
  door is one sealed region. Documented in the file.
- [x] Library drift measured, not assumed: `plan-g.txt` needs **50 distinct asset types / 315
  placements**, the store carried 29 - **36 types missing (~230 instances)**, which is why the designed
  lobby could not be built at all (`arch build` throws on the first unknown id).
- [x] Authored the top 12 of those (armchair-1, dining-chair-1, side-table-1, bar-stool-1,
  theatre-seat-1, dining-table-4, high-table-1, potted-plant-1, painting-2, sculpture-2, hedge-3,
  rug-4 = 206 of the 230 instances), each with its own silhouette; `verify:assets` 41 assets / 0 errors /
  0 warnings. Remaining 24 types are 1-2 instances each (signage, safety, back-of-house).
- [x] Measured: 502 agents, 66 fixtures, 30 000 ticks (500 sim-s = 8.3 min) -
  **bank 711.10, 155.20/min, 78 served** (dining 55 = 467.50, front-desk 11 = 198.00, bar 12 = 45.60);
  unbilled `lounge+seating` 21 and `lounge` 11 (free seating earns nothing, by design);
  120 started / 110 completed (10 jammed); 51 862 `repath-blocked` waits.
- [x] Root cause of the first 0.00 readings, measured not guessed: at `speed 0.2` an agent crosses one
  tile per second, so a 35 m plate costs ~110 s per trip. Income needs a long horizon (or a faster
  clock), not a tariff change. Reproduced at 5 agents: 1 completion per 2000 ticks.
- [ ] Gap - 24 asset types still missing, so `plan-g.txt` remains unbuildable. Bulk work, gated by
  `arch build` + `verify:assets`.
- [ ] Gap - no game-time scale: 500 sim-seconds is 8 real minutes at 1x. An idle game needs an authored
  day, and `scripts/arch/spec.json` has no clock field to put it in.
- [ ] Carried from loop 19 - check-in bills only when a guest itself completes a non-post spot;
  `abandonQueue` still emits nothing, so `walkOuts` read 0 across all of loop 20.

### Loop 21 - library refilled, and the build path was writing an unloadable file

- [x] **Defect found and fixed at the cause**: `buildLobby`'s `apply()` set
  `floor.walkable.tileStates` and left the previous `walkableGrid` in place.
  `normalizeFloorWalkable` rejects a floor whose two grid fields disagree, so **every `arch build`
  wrote a payload the app itself could not load** (`InvalidBlueprintDataError`), and the editor falls
  back to an empty workspace when ingress throws - which is very likely why floor-g read as one object.
  Fix mirrors the store's own paint write (`src/blueprint-editor/store/floors.ts:222`): `{ tileStates, walkableGrid:
  tileStatesToWalkableGrid(grid) }`. No second helper - the canonical one is reused.
- [x] Regression tests `tests/unit/archBuildIngress.test.ts` (2): build a probe copy of the real store
  at the plan's own 116x76@25 canvas through `buildLobby`, then require that `readBlueprintDataFile`
  accepts it and that both grid fields agree cell for cell; second test is the library-drift guard
  (`buildLobby` throws on the first unknown asset id, so a green build proves `plan-g.txt` is covered).
  **Falsified**: restoring the old two-line writer flips test 1 to
  `InvalidBlueprintDataError: failed validation against blueprint-data.v2.json`, and back to green.
- [x] `--canvas cols x rows @ tileSize` on `arch takings`: a plan is measured on its own grid, in the
  probe copy only, never by resizing the authored workspace.
- [x] Library refilled to the plan's needs: 24 more defs (`urinal-1`, `baby-change-1`, `display-case-3`,
  `shop-shelf-3`, `kiosk-2`, `concierge-desk-4`, `safe-deposit-2`, `printer-1`, `bell-stand-1`,
  `grand-piano-3`, `water-feature-3`, `hedge`-family extras, signage/accessibility/safety/BOH items),
  each with its own silhouette and only repo-managed tags. `verify:assets` 65 assets / 0 errors /
  0 warnings. Combined with loop 20 the plan's 50 types are now all present.
- [x] First A/B on the designed lobby vs the open probe, 502 agents, 20 000 ticks (333 sim-s):
  **`plan-g.txt` builds - 315 fixtures, 56 door tiles, ~191 seats, 322 targets, 844 queues - and earns
  58.60/min (27 served: dining 12, bar 15, bank 159.00) against `services-probe.txt`'s 155.20/min
  (78 served) with a quarter of the fixtures.** The designed plan is denser and slower: 32 592
  `repath-blocked`, 20 474 `no-wander`, 13 services started but never released.
- [x] `front-desk` earning 0 on `plan-g` was read by me as proof of the loop-19 rule gap. Both halves
  were wrong: the rule is fine and the desk's guest spots are reachable (walkable, queued, and they bill
  3x on the probe). See loop 22.
- [ ] Gap - the designed lobby now needs an income verdict from you: `arch takings --plan plan-g.txt
  --canvas 116x76@25` vs the probe is a measured 2.6x gap, and `arch eval` is the other half.
- [ ] Gap - no walk-out signal yet, so the density cost above shows up only as slow service, never as
  lost money.

### Loop 22 - authored day clock, and a retracted A/B

- [x] `TAKINGS_DAY_SECONDS = 300` (declared game tempo, one source in `domain/economy/takings.ts`,
  imported by the arch tool - **not** put in `spec.json`, whose own note says the game never reads it,
  so a second copy there would be two sources for one number). The ledger now keeps a day book:
  `daysCompleted`, `lastDayCents`, `todayCents`, and rate projections `perDayCents` / `servicesPerDay`
  off the same live 30 s window. Days close on the clock, so an idle day reads 0 rather than missing.
- [x] HUD gains "Per day est." and "Services/day est."; `arch takings` prints per-day figures, the last
  closed day's actual total, and the yardstick line: brief arrivals/day (read through the canonical
  `readOccupancy` -> `spec.json`) vs services/day this plan turns over, as a percentage.
- [x] 4 new ledger tests (open day projection, day closes on the clock, idle day closes at zero,
  reset clears the day book) - 17 in that file, 296 unit total green, typecheck/lint/bem/css clean.
- [x] **RETRACTED my own loop 21 conclusion.** "The designed lobby earns 2.6x LESS than the open probe"
  was measured while `arch build` still wrote mismatched grid fields, so the crowd ran on the store's
  stale `walkableGrid` instead of the plan's `tileStates`. On the fixed writer the sign flips:
  **`plan-g` 58.60/min (27 served, est. 293/day, 40 services/day) vs `services-probe` 34.00/min
  (14 served)**. The designed plan is the better earner of the two.
- [x] Check-in re-checked and **cleared as a rule problem**: `reception-desk` already carries 3
  guest-side spots (`y=31`, no `post`) and 3 staff post spots (`y=-6`); on the probe plan `front-desk`
  billed 3x. Loops 19/20 gaps claiming "arrivals cannot bill" were wrong and are deleted. What is
  actually true, measured: `plan-g` covers only ~8% of the declared 500 arrivals/day.
- [ ] Gap - whether income should follow simulated completions (honest, 8% coverage) or bill arrivals
  at the door (abstraction, full coverage) is game feel, not tuning. Needs the user's call.
- [ ] Gap - `abandonQueue` still emits nothing, so `walkOuts` remains 0 across every measurement.

### Loop 23 - a slow line now costs money: the impatience signal

- [x] `NPC_ENGINE_WAIT_REASONS` (runtime tuple in `src/engine/npc/types.ts`) now **is** the source of
  `NpcEngineWaitReason`, and a new reason `'impatient'` is emitted by `abandonQueue` as
  `waiting/impatient`. The reason list used to be a hand-written union nothing could iterate, which is
  exactly why a walk-out had no signal at all.
- [x] Coverage guard added to `tests/unit/npcMood.test.ts`: it iterates the real tuple and fails if any
  reason has no row in the mood table - a future reason can no longer fall silently into `'unknown'`.
- [x] `impatient` renders as a new mood `'frustrated'` (red ring, legend "Left a line"), so a designer
  sees the abandoned customer on the canvas, not only in a number. `PropertiesPanel` legend is
  generated from `NPC_MOOD_LEGEND`, so it picked the new entry up with no markup change.
- [x] Ledger splits the two causes it previously conflated: `walkOuts` = gave up waiting, and the new
  `queueAbandons` = the line's facility became unavailable; both visitor-only. HUD, `arch takings` and the
  change-detection predicate all carry the new field.
- [x] New engine test `tests/unit/npcImpatience.test.ts`: two agents contest one capacity-1 counter, the
  loser queues, patience 0.5 s, asserts `waiting:impatient` fires and the agent actually leaves the line.
  The reservation is earned through the engine, because hand-setting `reservationItemId` never registers
  it in the engine's own maps (found while writing it). **Falsified**: with the emit removed the test
  fails, and its event log reads `waiting:queued, waiting:no-wander...` - direct proof that the whole
  walk-out was previously invisible to every consumer.
- [x] Re-measured `plan-g` (502 agents, 20 000 ticks): **walk-outs 3** (was 0), everything else
  unchanged - bank 159.00, 58.60/min, 27 served, est. 293/day, 40 services/day vs the brief's
  500 arrivals/day. No regression in service throughput from the new emit.
- [x] Gates: 298 unit / 29 files, typecheck 0, lint 0 warnings, BEM/CSS pass, `clean:check` clean.
- [ ] Gap - walk-outs are counted but still cost nothing: no tariff is lost and no reputation falls, so
  the number has no teeth in the economy yet. That needs the arrival-flow slice, not a penalty constant.
- [ ] Gap - arrivals themselves are still not simulated (population is resident, nobody enters or exits
  through the street doors), which is why coverage sits at 8% of the declared 500/day.

### Loop 24 - footfall: the lobby now earns against the brief

- [x] `src/blueprint-editor/domain/economy/arrivals.ts` - pure arrival flow: `createArrivalFlow(...)`
  releases whole arrivals from a cumulative floor (a per-tick fraction would silently never deliver the
  declared 500), and `presentFromFlow` states Little's law once (L = lambda x W) so the runner and the
  tool cannot disagree. 5 tests, including exact accounting stepping one tick at a time for a whole day.
- [x] `arch takings --arrivals [--stay <sec>]` - arrivals walk in through **street door** cells only
  (`entranceCells`: a `door` tile on the street ring), leave when their stay is up, and the standing
  visitor pool entry is replaced (`replaced-by-arrivals`) while staff still deploy. Report gains the
  footfall line: per day, walked in, left, inside now, doors found, and the implied present.
- [x] Measured on the designed lobby (502 present target, 20 000 ticks = 333 sim-s, 12 street doors):
  **bank 2,640.40 · 840.40/min · served 250 · est. 4,202/day · 410 services/day = 82% of the brief's
  500 arrivals** - against **8%** for the same plan with a standing crowd and no traffic. Top earner is
  **front-desk (78 check-ins, 1,404.00)**, then dining 124 and bar 48; free `lounge` seating stays
  unbilled (107 + 91 completions) exactly as designed. Flow says 500 present, measured 532 including
  32 staff, and the run had not yet reached steady state at 555 in / 55 out.
- [x] Guard `footfall mode runs the declared arrival count through the street doors`
  (`tests/unit/archBuildIngress.test.ts`) asserts the arithmetic through the real runner, not a sample.
- [x] Two things I had wrong and fixed while building this: `NPC_ENGINE_TICKS_PER_SECOND` is **60**, not
  10 (a day is 18 000 ticks, so every "per second" claim needed re-deriving), and the **policy owns the
  pathfinder** - passing `pathfinder` before `...policy` was dead code that typecheck flagged.
- [x] `arrivalsPerDay` is injectable on `measureTakings`, because `readOccupancy` resolves `spec.json` by
  module URL and that does not survive a bundled runner: the CLI reads the spec, a test passes the number.
- [ ] Gap - the app itself still runs a standing population: only the arch runner has footfall. Wiring it
  into `useNpcSimulationCore` (spawn at the street door, despawn on stay) is the next feature slice.
- [ ] Gap - walk-outs cost nothing yet: an arrival that gives up loses only its own potential spend, so
  the tariff has no congestion penalty.

### Loop 25 - footfall runs in the app, not only in the measurement tool

- [x] `streetEntrances(floors, streetTiles)` and `stepTraffic(...)` moved into
  `domain/economy/arrivals.ts` as the single implementation; `scripts/arch/takings.ts` dropped its
  private copy and now calls the same code the app calls. Post-refactor the CLI reproduces the earlier
  numbers exactly (6000 ticks -> bank 166.50, served 19), so the move is behaviour-preserving.
- [x] `useNpcSimulationCore`: new traffic state (`trafficOn`, flow, entrances armed inside `buildEngine`,
  so a deploy *and* a layout refresh both re-arm - an edit must not silently restore the crowd it had
  replaced), `setTraffic(on)`, `getTrafficSummary()`, cleared on `reset()`.
- [x] `[decided]` Where the app's arrival rate comes from, with no schema change: **the deployed visitor
  pool becomes the traffic** (600 guests present -> 600 arrivals/day, stay one day), which is Little's
  law read the other way. A user-editable rate would need `npcConfig` + normalizer + NPC Manager field,
  and the project's own lesson is that an unauthorable persisted field (`usePx`) is worse than none.
- [x] HUD: "Footfall on/off" toggle (aria-pressed) with Walked in / In the room / Left again, and an
  explicit warning row when the plan has **no street door** - the failure mode the plan builder already
  refuses to write, now visible in the editor.
- [x] App-level proof `footfall turns the deployed crowd into arrivals that come in the street door and
  leave`: fixtures a 20x20 floor with two ring door tiles and a bar, deploys, switches traffic on,
  asserts the visitors are gone from the engine, then that arrivals spawn and stay, then that switching
  off leaves nobody behind. Found while writing it: `state.npcs` refreshes on a 250 ms throttle, so the
  immediate truth is `frameDots`, not the view list.
- [x] Gates: 305 unit / 30 files, typecheck 0, lint 0 warnings, BEM/CSS pass, `arch:selftest` PASSED
  (14 fixtures), `clean:check` clean.
- [ ] Gap - the panel's new markup is typechecked and linted but not exercised in a browser: the in-app
  browser surface is 0x0, where rAF never fires, so a live NPC preview run there cannot advance. The same
  behaviour is proven at the composable level.

### Loop 26 - bad service now costs money: reputation

- [x] `src/blueprint-editor/domain/economy/reputation.ts` - standing derived from **counted outcomes
  only** (`served` against `walkOuts`, both already in the ledger snapshot), so there is no hidden state
  to drift and no per-event valuation to invent (a `walk-out` event carries no target, so it cannot be
  priced facility by facility). Declared band: `REPUTATION_NEUTRAL = 70` when nothing has happened yet,
  multiplier `0.5 + score/200`, closed at both ends - a congested room shrinks income, it never flatlines.
- [x] Wired into both readers, never into the ledger itself: `arch takings` prints
  `reputation x/100 · xMultiplier · net of gross`, and the HUD shows Reputation + "Net after standing".
  Money accounting stays the ledger's alone (`[decided]`), which is why the multiplier lives at the edges.
- [x] `--patience <s>` on `arch takings` - the design lever that was missing. Without it the mechanic
  looked dead: `plan-g` at 12 000 ticks produced **1 walk-out, reputation 99, net 872.02 of 876.40**.
  Measured sweep on the same plan, same footfall:
  - patience 30 s -> walk-outs 1, rep 99, net 872.02 / 876.40
  - patience 3 s  -> walk-outs 70, rep 52, net 613.40 / 807.10  (-24%)
  - patience 0.5 s -> walk-outs 114, rep 39, net 482.05 / 693.60 (-30%)
  Both penalties land together, which is the point: fewer completions **and** a worse multiplier.
- [x] 5 tests `tests/unit/reputationReading.test.ts`: unproven reads neutral, all-served is 1.0, all-lost
  is the floor, half-lost is the middle, monotonicity swept over 21 cases, and the band is closed so a
  score cannot pay more than face value. `[decided]` Also corrected my own draft here: `NpcSimulationConfig`
  carries no `queuePatienceSeconds`, so the override reads from the flag or the engine default only.
- [x] Gates: 310 unit / 30 files, typecheck 0, lint 0 warnings, BEM/CSS pass, `verify:assets` 65/0/0,
  `arch:selftest` PASSED (14 fixtures), `clean:check` clean, slot check pass.
- [ ] Gap - reputation is read-only: nothing spends it or recovers it over time, so it is a scoreboard
  today, not a resource. A recovery curve (per-day drift toward the evidence) is the next design step.
- [ ] Gap - the HUD markup is still not browser-exercised (0x0 surface); behaviour proven at composable
  and domain level.

### Loop 27 - `npm run test:mutation`: guards must have tests that break without them

- [x] `scripts/mutate.mjs` + `tests/mutation-guards.json` + npm script `test:mutation`. Each manifest
  entry neutralises ONE rule in the source (`find` → `replace`), names the suite that must go red, and
  restores the file per guard. Three verdicts: `killed` (protected), `survived` (rule has no test),
  `inconclusive` (the tool could not judge - never reported as safety). Exit 1 unless everything was
  killed, so it is a gate, not a report. `--only <id>` to subset, `--list` to read the manifest.
- [x] Result: **12/12 killed** across the economy (`post:` never bills, best-rate-only, visitor-only,
  day rollover), arrival flow (cumulative release, stay bound), reputation (band closed, neutral when
  unproven), engine (`impatient` emits, patience bound) and collision (painted geometry, structural
  assets both sides).
- [x] **The gate found a real hole in a test I wrote this session**: "bills at the best qualifying rate"
  used tags `['dining','bar','lounge']` - already in descending price, so a mutant that takes the FIRST
  rated tag still passed. Rewritten with the expensive tag last plus two more orderings, and the mutant
  now fails it. A test that agrees with a broken rule by luck is exactly what this tool is for.
- [x] Three tool bugs found and fixed while building it, all of which could have produced a confident
  wrong answer: (a) verdicts parsed from vitest's *prose* summary silently missed the failure line under
  escape codes, so every guard read "survived" - now the JSON reporter decides, with the exit code as
  the documented fallback; (b) `originals.set` overwrote the pristine copy with an already-mutated one
  and the final restore wrote mutants back into the tree - now first writer wins and each guard
  restores before the next; (c) `spawnSync('npx')` is ENOENT on Windows, which looked like an untested
  rule - vitest is now launched through `process.execPath`.
- [x] `[rejected]` Damage the first buggy run left behind was found and repaired, not assumed fixed:
  six live mutations were grep-found in `takings.ts`, `arrivals.ts`, `reputation.ts`, `npcEngine.ts`
  (`reason:'impatient'` reverted to `'queued'`) and `collision.ts`, each restored to its real source,
  then the whole suite re-run green (310/31) before any verdict was trusted. A residual-difference check
  now runs at the end of every mutation pass as defence in depth.
- [x] Gates: 310 unit / 31 files, typecheck 0, lint 0 warnings, BEM pass, `clean:check` clean,
  `verify.mjs check` pass.
- [ ] Next use of the window: grow `tests/mutation-guards.json` over the store and schema guards (the
  82 quotes in `harness/state/verify.mjs audit` territory) - each entry is a small, machine-checked
  task, which is what free tokens are good at.

### Loop 28 - the gate extended to the store, and it found 5 untested rules

- [x] Manifest grown 12 → **27 guards** across `store/objects.ts`, `store/metadata.ts`, `store/mode.ts`,
  `store/floors.ts`, `store/assets.ts`, `store/migrate.ts`, `domain/schema/layout.ts`,
  `assets/validation.ts`. First honest run: **22 killed, 5 survived** - and every survivor was a real
  hole, not noise.
- [x] Tests added for all five (70 → 71 in `storeCrud.test.ts`, +5 cases):
  - `beginDrawnObject` never gated its placement (the covered gate belongs to `addObject`; the drawn
    path had none) - now refused and asserted to leave no orphan asset behind.
  - `MAX_FLOORS` was unenforced by any test on both `addFloor` and `duplicateFloor`.
  - `deleteAsset`'s floor skip: a floor that never held the origin keeps `collapsed` unset.
  - `canvasLeavesBuildingArea` had no direct test of its own (both store guards were covered
    individually, the predicate behind them was not).
  - Locked-member refusal: my first attempt targeted `(900,900)`, which a *different* guard refuses,
    so the mutant survived a passing test. Retargeted to a legal rect, then split in two.
- [x] **The last survivor was a duplicated guard, and the fix is knowledge not code**:
  `moveSelectedTo` pre-checks locks on the multi-selection path (`objects.ts:258`), so `moveMembersTo`'s
  own check is only reachable from the *single-selection link-group* path (`:268`) - grabbing an
  unlocked object whose linked partner is locked. That test is what kills it: **27/27 now**.
- [x] Two tool bugs found in the gate itself while reading its results: a passing run reports zero
  failed assertions, which my code conflated with "no report at all" (every survivor was mislabelled
  inconclusive until that was separated); and a verdict parsed from vitest's coloured summary is not a
  verdict. Both fixed with a comment each, so the tool cannot lie the same way twice.
- [x] Gates: `npm run test:mutation` **27/27 killed**, 316 unit / 31 files, typecheck 0, lint 0
  warnings, BEM/CSS pass, `clean:check` clean, `verify.mjs check` pass.

### Loop 29 - gate extended into the engine and the ingress layer

- [x] Manifest 27 → **36 guards**: engine reservation rules (`canReserve`/`reserve` capacity, one
  reservation per agent), the policy's duty-post filter, `queueLineCapacity`, `deriveFloorRooms`
  doorway seam, `placementRect` clamp, and the street-width bound on **both** ingresses
  (`dataFile` and `migrate`). First run: 29 killed, **8 survived**.
- [x] New suite `tests/unit/engineInvariants.test.ts` (4 tests) + one in `migrate.test.ts` + one in
  `blueprintSchema.test.ts` → 6 of the 8 holes closed: capacity-of-line, doorway seam, both street-width
  ingresses, plus the drawn-asset and drawn-rect cases from earlier. **34/36 now killed.**
- [x] Two lessons from writing the tests, both recorded in code comments: my first rooms assertion
  checked a split that holds *either way* (the traversal never crosses a door cell), so the mutant
  survived a passing test - the observable consequence is that a door cell belongs to no room; and a
  guard that cannot be observed at all is not a rule - `tileSize <= 0` in `rectHitsStructure` degrades
  safely through `NaN` bounds without it, so that manifest entry was **removed** rather than given a
  test that could never fail.
- [ ] 2 guards still survive - `engine-reserve-capacity` / `engine-one-reservation-per-agent` (both
  private to `NpcEngine`, needing a behavioural scenario where the double-book is observable) and the
  policy duty-post filter (my selector-level test returns null either way, probably on
  `isReachableByRole`; the behavioural route - guest, one post target, no `interaction-start` - is the
  version to write). Next turn.
- [x] Gates: **34/36 killed**, 322 unit / 32 files, typecheck 0, lint 0 warnings, `clean:check` clean,
  `verify.mjs check` pass.

### Loop 30 - the 3 surviving engine guards, and one of them turned out to be unreachable

- [x] **Duplicated rule removed at the cause**: `canReserve` and `reserve` each re-derived capacity /
  spot-occupied / agent-already-holding, which is why one of them had no observable test - the two
  copies could disagree and nothing noticed. Both now call `reservationBlocked(target, agentId)`
  (`src/engine/npc/npcEngine.ts:1377`) and each of its three lines is separately guardable:
  `engine-reservation-item-full`, `engine-reservation-spot-taken`.
- [x] `policy-open-targets-filter` killed by the **behavioural** version, as loop 29 predicted: one
  guest, a desk whose only interact spot is `post:reception-station`, real policy + real engine, 600
  ticks, assert **zero** `interaction-start`. My earlier selector-level test returned null either way
  (an upstream reachability check refused the target first), so the filter was never the thing under
  test.
- [x] `engine-reservation-item-full` killed only after the fixture was fixed: the first version had 3
  guests at `speed 0.2`, so at most 2 ever arrived and the run passed with the capacity rule deleted -
  the exact failure mode this gate exists to catch. Now `speed 40`, 1 500 ticks, and an explicit
  `assert.equal(holdersAtOnce, 2)` that the two-place bar is genuinely contested by three guests.
- [x] `[rejected]` `engine-one-reservation-per-agent` **removed from the manifest instead of being
  tested**: with the dedupe in place no caller can reach it - `chooseTarget` asks `canReserve` and
  reserves in the same step, so no agent is ever in `reserve` while already holding one. It stays in
  the code as the commit-side check (a future caller could otherwise leak its existing reservation)
  and the reason is in a comment at the line, not in a test that could never fail. Loop 29's lesson
  applied: an unobservable guard is not a rule.
- [x] Re-learned a loop-24 lesson the hard way, via typecheck: `TS2783 'pathfinder' is specified more
  than once` in both new engine tests - the **policy owns the pathfinder**, so passing it before
  `...policy` is dead code. Removed; 5/5 still green, which is the proof the override was inert.
- [ ] Gap - `reservationBlocked`'s third line (`agentHolding`) is now covered by no gate at all. Honest
  status: unreachable, documented, and therefore unverified by construction.
- [x] Gates: **35/35 guards killed** (`npm run test:mutation`, 17 files restored and verified), 323 unit /
  32 files, typecheck 0, lint 0 warnings, BEM + CSS pass.

### Loop 31 - the bank survives closing the tab: a wallet, and the lobby earns while you are away

- [x] `src/blueprint-editor/domain/economy/wallet.ts` - away time is *projected*, not re-simulated:
  `accrueOffline({savedAtMs, nowMs, perMinuteCents})` credits the last measured rate against elapsed
  minutes, `Math.floor` to whole cents, capped at `WALLET_OFFLINE_CAP_MINUTES = 480` (declared balance,
  same discipline as the tariff table). Three refusals, each with a reason: no rate measured yet earns
  nothing (same principle as an unproven reputation reading), a negative elapsed span earns nothing
  rather than creating a debt (device clocks move backwards), and a re-simulated absence could produce
  no walk-outs, so it can only ever be a projection.
- [x] `parseWalletRecord` is boundary validation, not paranoia: storage is external input, and the
  record shape is only accepted when `bankCents` is a **whole non-negative integer** - a fractional
  cent is a rewritten record, not a rounding artefact, and would mint money.
- [x] `TakingsLedger.deposit(cents)` - the single-ownership call. Chose deposit over a second balance:
  two banks means two sources for "how much do I have", and the ledger already owns the day book.
  A deposit moves `bankCents` and `carriedCents` **only** - never `windowCents`, `dayCents` or `served`.
  That is not tidiness: the away credit is computed *from* `perMinuteCents`, so a deposit that raised
  the rate would compound itself across sessions. Pinned by a guard (`ledger-deposit-is-not-a-service`).
- [x] `reset()` now restores `bankCents = carriedCents` instead of 0: re-deploying the crowd
  re-measures the lobby, it does not un-earn money that already arrived.
- [x] `src/blueprint-editor/store/wallet.ts` + `createDeviceWallet()` - the bank is a **second key in the
  same IndexedDB store**, deliberately not inside `blueprint-data`: that file is design work a user
  exports, imports and hands to someone else, while the bank is what this design earned on this device.
  Reuses `BlueprintStorage` (no second storage layer) by giving `createIndexedDbStorage` a key
  parameter, defaulting to the workspace key so every existing call site is untouched.
  `[decided]` Degrades to memory instead of throwing when IndexedDB is absent - the workspace port has
  nothing to fall back to and must fail loudly; a wallet is allowed to be forgettable.
- [x] Wired at the Vue lifecycle edge, never in the frame loop: `useNpcSimulation` settles the wallet
  once at boot (guarded by `walletSettled`, so a re-deploy cannot pay the same absence twice) and
  commits on unmount, on `visibilitychange -> hidden`, and every `WALLET_AUTOSAVE_MS` (60 s of wall
  time, so a killed tab loses at most that much of the session).
- [x] HUD: `Carried in` when a balance arrived from an earlier session, and `While away +X for Y min
  (capped)` when the closed lobby earned. `Takings` now reads the total, not the session.
- [x] 14 new tests: 7 in `tests/unit/walletOffline.test.ts` (rate projection, no-evidence, backwards
  clock, cap boundary + overrun free, whole cents over a month, record round-trip, tampered records)
  and 5 in `tests/unit/walletStore.test.ts` (commit -> restore through the real memory port, first run,
  four junk encodings, cap-flagged long absence, `clear()` really forgets), plus the two ledger
  deposit/reset cases. Manifest 35 -> **43 guards**.
- [ ] Gap - nothing can be *spent* yet: the bank grows and persists but buys no staff, no facility and
  no reputation repair, so the loop is still earn-only. Next.
- [ ] Gap - `commit` writes the *live* rate, so a session that never served anyone saves 0 and the next
  absence pays nothing. Honest today; wrong once a player expects the lobby to keep trading. Needs a
  persisted "best rate this lobby has demonstrated" instead of the instantaneous one.
- [x] Gates: 337 unit / 34 files, typecheck 0, lint 0 warnings, BEM + CSS pass, `verify.mjs check` pass,
  mutation **42/43**. The one survivor was my own test again: it asserted
  `earnedCents === Math.floor(155.2 * cap)`, i.e. it re-ran the very rule the mutant removed, so it
  agreed with the broken rule by luck - the same class that fooled the gate in loop 27. `clean:check`
  also caught one artifact (`scripts/arch/out` from the probe builds), removed with `npm run clean`.

### Loop 32 - payroll: the deployed crowd finally has a cost

- [x] `src/blueprint-editor/domain/economy/upkeep.ts` - one declared balance (`STAFF_DAY_WAGE_CENTS`,
  same standing as the tariff table), `staffHeadcount(pool, isVisitor)` reading the **existing**
  visitor rule the other way round (a role with no `taskIds` consumes; every other role is on the
  payroll), and `settleDay({bankCents, incomePerDayCents, staffHeadcount})` -> payroll, profit,
  `selfFunding`, `runwayDays`.
- [x] Two deliberate asymmetries, both reasoned: runway is **floored** (two of three wages is not a
  day of runway, it is bankrupt tomorrow) and a break-even day reports `selfFunding` - `>= 0`, not
  `> 0`, because the alternative divides the bank by zero and calls a solvent lobby insolvent.
- [x] `incomePerDayCents` is fed **net of standing**: bad service shrinking income is reputation's job,
  so charging the same failure a second time inside payroll would double-punish one walk-out. Stated
  in the code, not left to the reader.
- [x] `formatTakings` could not print a loss: `Math.floor(-12050) % 100` is `-50`, so the fraction
  carried a second sign (`-120.-0`). Now sign once, absolute digits - needed the moment profit can be
  negative, not a cosmetic fix.
- [x] Wired where the money already is: `useNpcSimulationCore.getStaffHeadcount()` (state's own
  `visitorRoleIds` set, no second visitor rule), passed through `useNpcSimulation`, and the panel
  settles the day in a computed alongside `standing`. HUD rows: Staff paid / Payroll per day / Profit
  per day / Days of bank left (only when the lobby is losing).
- [x] 10 tests `tests/unit/upkeepPayroll.test.ts` incl. the consequence that matters for design: the
  **same** measured income is self-funding at 8 staff and insolvent at 32 - "the surplus was only ever
  the unpaid half of the crowd". Manifest 43 -> **48 guards** (5 new: visitor-not-payroll, floored
  runway, break-even bound, clamped headcount, negative formatting).
- [x] Loop 31's survivor closed: the whole-cents test now asserts the literal `74_496` plus a half-cent
  case, so the mutant has nowhere to hide behind a re-evaluated expectation.
- [ ] Gap - payroll is displayed, never **charged**: nothing deducts it from the bank on a day
  boundary, so profit is still a readout rather than a consequence. Needs the day-close hook to
  settle (the ledger already knows `daysCompleted`).
- [ ] Gap - the arch tool does not price the crowd yet (`scripts/arch/takings.ts` prints gross only),
  so plan A/B still ranks lobbies by income, not by profit.

### Loop 33 - payroll is charged, and the gate itself failed in a way that mattered

- [x] `createTakingsLedger({ dailyChargeCents })` - the charge lives **inside the day book** (`advanceTo`),
  not at a call site: the boundary where a hotel day closes is one place, and both surfaces (app + `arch
  takings`) pay the crowd on it automatically. `payrollCents(headcount)` is the single wage rule, used by
  the ledger's charge and by `settleDay`, so a projection can never disagree with what was actually billed.
- [x] Two consequences pinned by tests: the bank **floors at zero** (unpaid payroll is written off -
  insolvency is not yet a state the game has, and inventing debt at a call site would be), and a charge
  clamps `carriedCents` down with the bank, because `reset()` restores the bank to `carriedCents` - so a
  withdrawal that left carried above bank would **mint money back** on the next re-deploy.
- [x] `[decided]` Deliberately did NOT add a public `withdraw()` to the ledger: nothing needed it, and a
  second money-moving method invites the very clamp bug above to be forgotten by its next caller.
- [x] **Gate failure, and the damage it left**: `npm run test:mutation` crashed with
  `Error: UNKNOWN: unknown error, open ...npcEngine.ts` (Windows file lock, errno -4094) on a *restore*
  write - leaving `const itemFull = false` live in the tree with the runner gone. Found in 20 seconds, not
  by re-running the suite: a script that walks `tests/mutation-guards.json` and checks every `find` string
  is still present in its file (`every guard find-string is present in the tree`), which is now the
  standing integrity check after any gate run. The failing engine test confirmed the same file.
- [x] `docs/skill/economy.md` written and routed from `skill.md`: the six economy modules, the eight
  invariants (one owner of the bank, whole cents, deposit-is-not-a-service, carried-survives-reset,
  projection-not-resimulation, day charges payroll), the declared-balance list, and **the three
  retracted claims** from loops 19-22 so nobody re-derives them from the code's shape.
- [x] Manifest 48 -> **51 guards** (day-close charge, carried clamp, entry-level headcount clamp).
  Full pass **51/51 killed**, 20 files restored and verified; 350 unit / 35 files, typecheck 0.
- [x] `arch takings` prices the crowd (`settleDay` at the report edge, income net of standing), so a plan
  A/B ranks by **profit**, not gross. Measured on the designed lobby (20 000 ticks, arrivals 500/day,
  patience 3 s): income 633.00/day gross, **payroll 1,920.00/day for 32 staff**, **profit -1,524.37/day,
  0 days of bank left**, reputation 25/100 on 77 walk-outs. The first number in this project that says
  the authored lobby is over-staffed for the traffic it can serve - a shape claim (the wage is a declared
  balance), not a price tag.
- [x] Gate hardened for the failure it caused: all four writes go through `writeWithRetry` (bounded
  backoff on Windows `UNKNOWN`/errno -4094), so a momentary lock cannot abort a run with a mutant live.
- [x] `docs/skill/economy.md` routed from `skill.md`; the post-run integrity check is in project memory.

### Loop 34 - the wallet keeps the rate the lobby *proved*, not the one it last showed

- [x] Closed loop 31's gap: `WalletRecord.demonstratedPerMinuteCents` is a **high-water mark** written on
  every commit (`Math.max(previous, current)`), and away time is credited off `creditableRate(record)`.
  Before this, a session that served nobody saved a 0 rate and the next reopening paid nothing - the
  lobby's earning power reset every time the player looked away, which is not an idle game.
- [x] Backward compatible by shape, not by migration: the field is optional and `parseWalletRecord` only
  rejects it when present and invalid, so a record written minutes ago still accrues off
  `perMinuteCents`. Pinned by a test that stores hand-written legacy JSON.
- [x] `readRecord()` extracted inside `createWalletStore` and used by both `restore` and `commit` - the
  storage boundary is read one way, and the junk-tolerance is not a second copy of the parse logic.
- [x] Manifest 51 -> **53 guards**: the repointed `wallet-corrupt-record-refused` (its old anchor
  disappeared in the refactor - caught by the find-string check, not by a passing verdict) plus
  `wallet-demonstrated-rate-mark` and `wallet-legacy-rate-fallback`. **53/53 killed**, tree re-verified
  clean after the run, typecheck 0, lint 0 warnings, `clean:check` clean.
- [x] Also in this window (loops 30-33, all verified): engine reservation dedupe and the last 3 engine
  guards closed; the persisted wallet + `deposit`/carried semantics; payroll charged inside the day book;
  `arch takings` printing **profit** (measured: 633.00/day income vs 1,920.00/day payroll for 32 staff =
  **-1,524.37/day, runway 0**); `docs/skill/economy.md` routed from `skill.md`.
- [ ] Open next, in order: (1) insolvency as a state - staff stop working when the day cannot be paid,
  which is the only honest consequence of the number above; (2) spend the bank on a fixture or a role
  through the existing store writes; (3) reputation as a resource (recover per closed day, buy back);
  (4) rank `arch eval` candidates by profit; (5) sync/import-export round-trip guards.
- [ ] Parked for your call, unchanged since loop 18: repair-or-reject a file whose street band exceeds
  its canvas; whether Escape reverts a partial drag; whether a locked member halts a group or is moved
  around; `usePx` - wire it or retire it (retiring changes a persisted field real workspaces can hold);
  toolbar badge wording now that `collapsed` means two things. Nothing committed - 43 files dirty, git is yours.
- [ ] Gap - the gate has no crash protection of its own: a locked write during restore leaves a mutant
  in the tree and the run aborts before the residual check. Needs `try/finally` around the per-guard
  restore plus a retry on `UNKNOWN`. Hardening queued, not yet done.
- [ ] Gap - payroll still has no *consequence beyond money*: an insolvent lobby keeps operating. The
  honest next step is a state (staff walk off when the bank cannot pay), not a bigger wage number.




### Placement/collision pass - carried, complete and uncommitted

- [x] Asset-browser delete: per-row `Del` stuck `disabled` after one delete (`pending` read inside the `v-memo` row) - guard moved to JS, repro test in `tests/component/assetPickerDelete.test.ts`
- [x] Same `v-memo` freeze in the sidebar asset list (move-button guards, size label, incomplete badge) - memo deps now cover every value the row reads; `tests/component/assetToolbarRows.test.ts`
- [x] One placement gate in the store: `placementBlocked(rect, type, excludeIds)` (`src/blueprint-editor/store/objects.ts:51`) = object bodies + `rectHitsStructure` (`src/blueprint-editor/domain/collision.ts:76`, blocked/door cells); wired into drop, click-place, draw-rect, drag, rotate, paste, flatten
- [x] Wall/door role assets (`data-role`) count as geometry: `assetIsStructural` (`src/blueprint-editor/assets/assetUtils.ts:77`) + `placementCollides`, and `recalcCollapsed` flags the clash both ways
- [x] Escape hatch so a buried object is never trapped; paint-over stays allowed but reports how many objects it buries
- [x] Dead params removed from `scripts/arch/build-lobby.ts` (`seatsOf` height, `renderAscii` height) so the routed `npm run lint` passes; `arch:selftest` still green

### Audit 2026-09-28 - 8 findings, 7 fixed, 1 rejected as a misdiagnosis

- [x] **F1 the gate validated a rect that was not the rect that landed** - `addObject` gated `clamp({w: snap(assetPixelSize)})` and then `normalizeObject` overwrote `w`/`h` with the raw asset footprint. Proven before the fix: a 5-tile asset at the right edge of a 128px building gated as `w:128` (fits) and landed as `w:160` (32px overhang, wall cells never inspected); a `usePx` 100x40 asset gated 96x32 and landed 100x40. Now one helper `placementRect(type, x, y, assets?)` (`src/blueprint-editor/store/objects.ts:62`) normalizes first and clamps second, and `addObject` (`:99`), `canPlaceObject` (`:120`) and `beginDrawnObject` (`:70`) all gate that rect and then write it back over the normalized object, so gate == landing. Exposed on the store contract at `src/blueprint-editor/store/state.ts:105`. Tests: `tests/unit/storeCrud.test.ts` "an object lands on exactly the rect the placement gate validated" + "a placement near the building edge does not overhang it".
- [x] **F2 REJECTED - the asymmetry is the intended policy, not a bug** - I first read `placementCollides` (`src/blueprint-editor/domain/collision.ts:25`) as inconsistent because art-onto-furniture is refused while furniture-onto-art is allowed, and made it symmetric. Two existing tests failed: `tests/unit/storeCrud.test.ts:203` "art still cannot be dropped onto furniture" and `:393` flatten refusing a merged footprint that covers another object. The rule is coherent: the exemption belongs to the side already on the floor, and because `recalcCollapsed` never collapses art (`src/blueprint-editor/domain/collision.ts:67`), allowing art to land on a body would create an overlap that can never be flagged. Reverted; the comment now states why, and `tests/unit/collision.test.ts` "the art exemption belongs to the side already on the floor" pins it.
- [x] **F3 painted geometry now sets `collapsed`** - `recalcCollapsed` takes `tileSize` and treats painted wall/door cells under an object as a clash (`src/blueprint-editor/domain/collision.ts:50`, `:61`), so the canvas's only persistent red state (`.editor__object--collapsed`) now covers both halves of the rule; `paintFloorTiles` recalcs after painting (`src/blueprint-editor/store/floors.ts:222`) and load-time recalc passes the tile size (`src/blueprint-editor/store/migrate.ts:81`). Buried art is flagged too - the art exemption is about bodies, not about being inside a wall. All 9 call sites updated. Test: "painting a wall over an object keeps it flagged until it moves out".
- [x] **F4 paste now gates copies against each other** - each accepted copy is pushed onto the floor before the next one is gated (`src/blueprint-editor/store/metadata.ts:81-85`), so the `clamp` that pulls out-of-building copies back onto the same boundary can no longer stack them silently. The object limit moved into the loop (`src/blueprint-editor/store/metadata.ts:59`) and now fills until full instead of rejecting the whole paste. Test: "paste gates each copy against the copies already accepted".
- [x] **F5 second `collapsed` implementation removed** - the inline `aabbOverlap` recalculation in `moveSelectedTo` is gone, along with the now-dead `aabbOverlap` import in `src/blueprint-editor/store/objects.ts:5`; `commitMove`'s `recalcCollapsed` is the only writer. Cost: no live red during the drag itself, only on release - the old live flag was wrong for exempt art and never ran for multi-selection anyway.
- [x] **F6 silent rejections fixed** - `commitMove` now says why it reverted (`src/blueprint-editor/store/objects.ts:284`), and the redundant `canPlaceObject` pre-check in the drop handler was removed so `addObject`'s own refusal toast is reachable (`src/blueprint-editor/composables/useCanvasDragDrop.ts:67`).
- [x] **F7 duplicate geometry removed** - the drag ghost resolves through `store.placementRect` instead of an inline clamp that never shrank oversized assets (`src/blueprint-editor/composables/useCanvasDragDrop.ts:40-43`), so preview == landing; flatten reuses `unionRects` (`src/blueprint-editor/store/flatten.ts:52`). Left alone: `src/blueprint-editor/components/canvas/EditorCanvas.vue:324-325` inline snap - `beginDrawnObject` re-normalizes it, so it cannot diverge.
- [x] **F8 dead exports unexported** - `assetFallbackShapeSvg` (`src/blueprint-editor/assets/assetUtils.ts:41`), `ASSET_ORIGIN_LABELS` (`:65`), `assetSettingsIssues` (`:258`). `resolvePlacedObject` stays exported (`tests/unit/blueprintSchema.test.ts:5` uses it) and `placementCollides` stays exported with new direct coverage.
- [x] Verified NOT bugs (no change): `src/blueprint-editor/store/assets.ts:147-151` is inert because dimension keys are rejected at `:108-112`; `src/blueprint-editor/store/mode.ts:43-47` only runs on empty layouts; `duplicateFloor` and undo-restore copy ungated by design; `src/blueprint-editor/store/flatten.ts` warn-only art path is the intended escape hatch.
- [x] **F9 found by the browser run - creating the first floor left no floor current** - `addFloor` (`src/blueprint-editor/store/floors.ts:21`) pushes the floor but never touched `currentFloorId`, while the boot, undo and reload paths all repair a stale id (`src/blueprint-editor/store/createStore.ts:77`, `src/blueprint-editor/store/createStore.ts:178`, `src/blueprint-editor/store/createStore.ts:205`). `currentFloor` (`src/blueprint-editor/store/createStore.ts:60`) stayed undefined on a cold workspace, so `addObject` returned null at its `!floor` guard with no toast and paint produced nothing - a fresh install could place or paint nothing, silently. Fixed by applying the same stale-id repair inside `addFloor`. The unit suites could never see it: `tests/unit/storeCrud.test.ts` assigns `state.currentFloorId = floor.id` by hand in its harness.
- [x] E2E gap closed - `tests/e2e/overlap.spec.ts`, 3 tests against the production build driving a real palette drag (mousedown on the asset row, window mousemove, mouseup over the canvas). Asserts the ghost rectangle equals the landed object's transform (F1: `placementRect` == landing), that a drag onto painted wall geometry is refused and adds nothing, and that painting a wall over a placed object gives it `editor__object--collapsed` (F3). Ran 3x in parallel 9/9 green; full e2e 6/6.
- decision: `collapsed` carries painted-geometry burial as well as body overlap, rather than adding a second flag and a second canvas style - most reversible option, reuses the only existing red state. Veto-able: it widens the meaning of a persisted field, and objects already buried in the current workspace (260 blocked + 8 door cells) will now render red on load.
- decision: paste fills until the object limit instead of refusing the whole batch, matching per-item `addObject` behavior. Veto-able.




### Loop 2 - gap sweep after F9

- [x] F9 regression test added to `tests/unit/storeCrud.test.ts` - "addFloor() makes the new floor current, so a cold workspace is authorable" clears `currentFloorId` to `''` and empties `floors` instead of hand-assigning it, then asserts the first placement succeeds. Fails on the pre-fix `addFloor`. Also pins the other half of the decision: adding a *later* floor leaves you where you were.
- [x] Verified every UI floor-creating path goes through the one fixed function - `src/blueprint-editor/components/shell/Toolbar.vue:93` ("Create the first floor") and `src/blueprint-editor/components/modals/FloorModal.vue:112`; `addFloor` is the only writer besides `src/blueprint-editor/domain/schema/dataFile.ts:120` at load. No second path to patch.
- [x] Impact check on F1, correcting my own earlier claim: the shipped `src/blueprint-editor/data/blueprint-data.json` has exactly one `usePx: true` asset (`table-1`, `w:2 h:1`) and it carries **no `pxW`/`pxH`**, so `assetPixelSize` falls back to `w * tileSize` and the px branch resolves identically to tiles. The `usePx` divergence I proved arithmetically is therefore latent, not currently exercised by real data - the reachable in-app half of F1 is the clamp/shrink overhang, which the unit test covers.
- [ ] Gap found, NOT fixed - needs a product decision, not a guess: the whole pixel-size mode is unauthorable from the UI. `src/blueprint-editor/components/panels/OriginSettingPanel.vue:220-221` renders the Tiles/Pixels buttons hardcoded `disabled`, every dimension input is `disabled readonly`, and `updateAsset` rejects all size keys as immutable. So `usePx`/`pxW`/`pxH` can only arrive via imported JSON, while `assetSizeLabel`, the `v-else` px branch, `serializeAsset` and the schema validator all carry it. Deleting it would change a persisted schema field that existing workspaces can contain - that is user data, so it stops here rather than getting quietly removed.

### Loop 3 - two parallel gap sweeps (silent refusals + stale v-memo), 5 fixed, 3 agent claims rejected

- [x] **G10 stale `v-memo` on interact spots (found by me, same class as the two already fixed)** - `src/blueprint-editor/components/canvas/EditorCanvas.vue:1602` memoized on `[obj.id, obj.x, obj.y, renderInteractSpots, objDef(obj).interactSpots]` while the block also reads `showLabels`, `interactSpotRadius` and `interactSpotFontSize`. All three are reactive (`:98` ref, `:696`/`:700` computeds on `overlayScale`), and `objDef` returns from a cached id-keyed map (`src/blueprint-editor/composables/useCanvasRuns.ts:21`) so the memo genuinely hits: toggling Labels did not add/remove spot text, and zooming left the circles at the old radius. Deps completed; the sibling grid memo at `:1536` already lists every value it reads, which is the convention this one broke.
- [x] **G11 arrow-key nudge refused with zero feedback** - `moveMembersTo` returns false *before* mutating (`src/blueprint-editor/store/objects.ts:230`), so `commitMove` re-checks an unchanged rect and the revert toast I added last loop cannot fire on this path. `moveSelectedTo` now returns a `MoveAttempt` (`'moved' | 'blocked' | 'locked' | 'none'`, `src/blueprint-editor/store/state.ts:59`) and the keypress handler reports it with the existing canonical wording (`src/blueprint-editor/components/canvas/EditorCanvas.vue:916`). The two pointer-drag callers at `:810`/`:825` run per mousemove and stay silent on purpose - a toast there would spam.
- [x] **G12 copy/paste were silent in exactly the case their sibling warns** - `pasteObjects` returned on an empty clipboard with no message while `copySelected` already says `Nothing to copy`; both now pair up (`Nothing to paste`, `src/blueprint-editor/store/metadata.ts:52`) and the no-selection copy branch reports too (`:43`).
- [x] **G13 floor cap silent while the button stays enabled** - `addFloor`/`duplicateFloor` returned null/false at `MAX_FLOORS` with nothing said, and `src/blueprint-editor/components/modals/FloorModal.vue:198` only disables on `pending`, so the user got a generic "Failed to add floor". Now warns with the limit, matching the asset/object limit toasts.
- [x] **`ensureTag` contract lied** - declared `void` at `src/blueprint-editor/store/state.ts:160` while the implementation is async; corrected to `Promise<void>`.
- [x] Regression test added: `tests/unit/storeCrud.test.ts` "moveSelectedTo() reports why a nudge was refused instead of swallowing it". 264/264 unit, 6/6 e2e, typecheck/lint/bem/css clean.
- [ ] Gap left open deliberately - a multi-selection containing a locked object still drags silently (`src/blueprint-editor/store/objects.ts:245`, reachable because `toggleMultiSelect` at `src/blueprint-editor/store/selection.ts:49` does not filter locked members). Fixing it means either a per-gesture warn-once mechanism or filtering locked members out of the drag - a behavior change I am not making unasked.
- [ ] Test-masking found, not yet addressed - repo-wide **zero** tests set `state.tileBrush` or `state.mode`, and `selectObjects()` in `tests/unit/storeCrud.test.ts:78-83` hand-writes `state.selectionState` instead of going through `store.select`/`setSelection`. That is the same pre-seeding shape that hid F9, so the paint/tool precondition paths have no real coverage.

### Rejected after checking the code (do not re-report as bugs)
- Spawn-zones and Floor Manager dropdowns selecting a floor the canvas is not showing: both modals render and edit from their own `selectedFloor` (`src/blueprint-editor/components/modals/SpawnZonesModal.vue:31`, `:169`), so the user does see the result; only `armZoneDraw` needs the canvas to follow, and it calls `selectFloor` because drawing happens on the canvas. Deliberate, not an inconsistency.
- `ensureTag` not creating the tag: two-step authoring is the design - NPC Manager owns definitions, `src/blueprint-editor/components/panels/AssetProperties.vue:145` already offers "Recreate the tag definition". Only the type was wrong.

### Loop 4 - closed the two masking gaps named in loop 3, plus a missing schema guarantee

- [x] Test harness now exercises the production selection writer - `selectObjects()` in `tests/unit/storeCrud.test.ts:78` hand-built `state.selectionState`; it now calls `store.setSelection`. `setSelection` (`src/blueprint-editor/store/selection.ts:23`) owns that shape and is the single place `primary` is kept consistent with `items`, so 30+ tests that previously never touched it now do. No bug surfaced, which is the point - the invariant is now covered rather than assumed.
- [x] Tool/brush precondition coverage added where the repo had **zero** - new `tests/unit/storeCrud.test.ts` "setMode() and setTileBrush() keep the paint brush and the object tools exclusive" drives the real writers and pins that `setMode` clears the brush (`src/blueprint-editor/store/mode.ts:18`) and that `setTileBrush` clears selection (`:24`). A brush surviving a tool switch would make an object click paint instead of select, because the canvas branches on `state.tileBrush`.
- [x] **Missing schema guarantee found and fixed** - assets had the compile-time exhaustive manifest `ASSET_DEF_FIELD_COVERAGE`; objects had nothing, so a new `ObjectData` field could be added and silently never persisted. Added `OBJECT_DATA_FIELD_COVERAGE` (`src/blueprint-editor/assets/assetUtils.ts:183`) classifying all 17 fields as `persisted` or `derived`, plus a test asserting `serializeObject` writes exactly the persisted set and no derived one. Guarantee verified empirically, not assumed: injecting an unclassified `labelX?: number` into `ObjectData` produced `TS2741` at `src/blueprint-editor/assets/assetUtils.ts:183`, and reverting restored a clean typecheck.
- [x] Notable design fact now documented in code: `w`/`h` are deliberately absent from `ObjectPlacement` and from the payload - they come back through `normalizeObject` on load. That is why a missing `normalizeObject` pass on load would leave objects unsized and make every `aabbOverlap` comparison silently false rather than noisy.

### Loop 5 - cleared a hypothesis, fixed a regression I introduced myself

- [x] Hypothesis CHECKED AND DISCARDED - undo/redo desynchronizing `collapsed`, and the related "undo pushes a snapshot of the state it just restored, so it can be pressed forever" theory. Both wrong: `pushHistory` compares the live state against the stored top first and returns without pushing when they deep-equal (`src/blueprint-editor/store/createStore.ts:93-101`), so after an undo the push is a no-op and the next undo hits `history.length < 2` and refuses. The existing test "undo() depth caps at 4 steps" already proves this. Snapshots are also taken *after* each mutation (`:157`), so stored `collapsed` always agrees with stored geometry. Recorded so this axis is not re-theorised.
- [x] **Fixed an O(n²) regression I introduced in loop 2** - teaching `recalcCollapsed` about painted geometry meant `paintFloorTiles` recomputed every object against every other object on each stroke, with no `changedRect`. `MAX_OBJECTS_PER_FLOOR` is 10,000, so a dense floor would freeze the canvas on brush release. Now scoped to the painted rect (`src/blueprint-editor/store/floors.ts:220-232`): structure state can only change for objects touching the stroke, so the scope is exact, not a heuristic - `O(n + k²)` instead of `O(n²)`.
- [x] Verified the call frequency before assuming it: `useCanvasTilePaint.ts` `onMouseMove` only updates a local ref; the store call fires once per stroke (`src/blueprint-editor/components/canvas/EditorCanvas.vue:569`). So this was a per-stroke hitch, not a per-pixel one.
- [x] Correctness pinned, not just speed: new test "paintFloorTiles() recomputes the collapsed flag only for objects the stroke touches" - burying A leaves B unflagged, a far stroke flags B without losing A's flag, and erasing the wall over A clears it while B stays buried.
- [x] Behaviour documented by that test: `collapsed` is `undefined` on a freshly created object (`addObject` never writes it) and a scoped recompute leaves objects outside the stroke untouched, so unflagged is falsy rather than strictly `false`. Rendering treats both identically; assertions must use `assert.ok(!x.collapsed)`.

### Loop 6 - same perf defect one call site over, in `updateAsset`

- [x] **`updateAsset` recomputed every floor on every origin edit, including floors holding none of that asset** (`src/blueprint-editor/store/assets.ts:160` fired `recalcCollapsed(floor, assets, t)` with no `changedRect`, inside a loop over all floors). O(objects²) per floor per edit, so changing one label or colour on a dense multi-floor workspace freezes the canvas - the same class as the paint-stroke bug fixed in loop 5, found by checking the sibling call sites rather than hunting new ground. Now: floors with no instance of the edited origin are skipped, and floors with instances are scoped to `unionRects(instances)`.
- [x] Chose scoping over deletion, with reason recorded in code: `AssetPatch` (`src/blueprint-editor/store/state.ts:35-53`) exposes no size keys and no `svg`, and `updateAsset` rejects dimension patches outright - so today the recompute provably cannot change any flag. Deleting it would remove the safety net for the day dimensions become editable; scoping keeps the guarantee and removes the cost.
- [x] Test added: "updateAsset() refreshes overlap flags on every floor that holds an instance" - three floors: an overlapping pair flags on the edited floor, a lone instance on another floor is recomputed *to* `false`, and a floor with no instance of the edited origin keeps `undefined`. Asserting `undefined` vs `false` is what distinguishes the skip from a recompute, so the scoping itself is under test, not just the outcome.
- [x] Swept every remaining call site rather than stopping at the one I found: `grep` over `recalcCollapsed(` shows only two still unscoped - `src/blueprint-editor/store/assets.ts:225` (`removeAssetInstances`) which I then scoped to `unionRects(removed)` matching what `deleteSelected` already does at `src/blueprint-editor/store/objects.ts:154`, and `src/blueprint-editor/store/migrate.ts:81`, which is load-time and **correctly** full. All six object-mutation sites already pass a changed rect.
- [x] Two of my own errors caught and corrected during this loop: my first version of that test placed the pair two tiles apart, which merely *touches* once `updateAsset` rewrites `w`/`h` from the origin (`aabbOverlap` is strict), and a verification command chained `grep -c` before `npm run lint` with `&&`, so zero matches short-circuited lint and reported a phantom `lint=1`. Re-ran lint standalone: exit 0.

### Loop 7 - wiring-issue recompute measured, not guessed; one quadratic pass removed

- [x] Hypothesis DISPROVED by measurement: I predicted dragging an object re-ran `collectWiringIssues` per mousemove because the computed depends on the whole layout (`src/blueprint-editor/store/createStore.ts:237`). It does not - Vue tracks per property, and the wiring pass only reads `object.type`, so mutating `object.x` costs 0.001 ms (a cached read) instead of re-running. Recorded so nobody re-litigates this from the dependency list alone.
- [x] Real cost found and attributed by controlled experiment (5000 placed objects + spawn zones on an 1800x1200 canvas): full `collectWiringIssues` was ~50 ms, re-triggered by the paths that *do* dirty it - `floor.allowedRoleIds` and `asset.tags` edits, i.e. a ~60 ms hitch on each role toggle and each tag typed. Isolating inputs showed the object pass, not the zones, dominated (+37 ms over a 6.7 ms baseline; 8 zones only +6 ms).
- [x] Root cause was an accidentally quadratic pass, not the object walk itself: `validateSettingsCompleteness` filtered floors by rescanning every object for every asset (`src/blueprint-editor/assets/validation.ts:248`). Short-circuiting on the first hit meant an *absent* origin scanned the whole array, so cost was O(absent_origins x objects). Replaced with a single indexed pass building `floorsByPlacedType`, then a map lookup. 43.7 -> 25.0 ms (5000 objects), 51.3 -> 32.7 ms (5000 + 8 zones). Semantics preserved: `placedFloors` is also read for role reachability at `:278`, and the index returns the same floor list.
- [x] Second, smaller dedupe in `collectFloorAssetTags` (`:29`): tags come off the origin, so every instance of one type contributes identically - now counted once per type. Correct but minor on its own (43.7 -> 39.9 ms).
- [x] **Coverage gap found while verifying my own change**: no test anywhere asserted the "is not placed on any floor" branch I had just rewritten, so the existing suite could not have caught an index bug. Added "a posting task fires only for an origin that is genuinely unplaced" - two instances of one placed origin plus one unplaced origin, asserting exactly one issue fires and names the right asset, which pins both the duplicate and the absence case.
- [x] Stopped where the remaining cost is legitimate: the other object passes (`:306`, `:383`, `:397`, `:424`) each read per-object data once, so ~19 ms over 5000 objects is O(n) with a reason, not a repeated scan. Further optimization would need memoization across recomputes, which is a bigger change than the jank justifies.

### Loop 8 - zone street-ring scan bounded; equivalence fuzzed, not argued

- [x] `zoneOverlapsStreetRing` (`src/blueprint-editor/assets/validation.ts:62`) walked **every cell of the canvas** for each spawn zone to ask whether any street cell center falls inside the zone. Bounded the scan to the cells whose own rect touches the zone - a cell holding a center inside the zone necessarily touches it, so the searched set is a strict superset of the answers and the result is unchanged. Cost per zone goes from O(rows x cols) to O(zone cells).
- [x] Equivalence **proven by differential fuzz**, not by the argument: the old and new bodies ran side by side over 120,441 cases - 7 canvases incl. zero-size and tileSize 0, 7 band widths incl. band > canvas, structured edge zones (degenerate 0-size, straddling boundaries, negative origins, 0.002px widths, 24.999 half-open edges) plus 120k randomized fractional cases. **0 mismatches**, 59,734 positives, so the early-exit path was well exercised in both.
- [x] Measured effect: the zone term is now flat. Spawn zones used to add +5.5 ms at 8 and pushed the 5000-object case to 54 ms at 32 zones; now 0 / 8 / 32 / 64 zones all read 5.6-6.8 ms - indistinguishable from having no zones - and 5000 objects + 32 zones went 54.0 -> 31.3 ms. Remaining cost is the legitimate O(objects) passes.
- [x] Guard added where the fuzz had proved equivalence but the repo had no test: "a street-band zone holding no cell center cannot spawn a guest, so the hint still fires" - a 10px zone at 20,20 spans 20..30 between the 12.5 and 37.5 centers, so it must NOT satisfy the convention, and widening it to 20..40 must. This is the exact semantics a careless scan-narrowing would break.
- [x] Next leads, deliberately left for the following loop rather than started half-hearted: the remaining ~19 ms is four separate O(objects) passes in `validateSettingsCompleteness` that could collapse into one traversal; `toggleMultiSelect` still lets a locked object into a selection whose drag then fails silently; `usePx` and the toolbar-badge wording are still waiting on a product call.

### Loop 9 - multi-select drag was broken; found by reading the drag path, proven in a browser

- [x] **Group dragging moved only the object you grabbed.** `onObjectMouseDown` called `store.select({ type: 'object', id })` unconditionally, so the mousedown that starts a drag threw away the multi-selection the user had just built with shift-click. Browser evidence before the fix: selection 2 after shift-click, **1 while dragging**, and only the grabbed object moved (675 to 1175) while its sibling stayed put (900 to 900). Group drag has never worked on this path, and `multiSelectionMembers` plus the group building-area clamping in `src/blueprint-editor/store/objects.ts` were unreachable dead weight because of it.
- [x] Fixed in `src/blueprint-editor/components/canvas/EditorCanvas.vue:759-769`: grabbing an already-selected member now keeps the rest of the selection and **re-orders it so the grabbed object is primary**. The second half is not cosmetic - `moveSelectedTo` measures its delta from `state.selectionState.primary`, and `setSelection` makes `items[0]` the primary, so after shift-click the primary was the first-picked object. Preserving the selection alone would have displaced the whole group by the distance between the two objects instead of following the cursor.
- [x] After the fix: selection stays 2 throughout the drag and both objects move by an identical delta (+450/+450 grabbing the first member, and the second spec grabs the NOT-first member to pin the primary rule).
- [x] Permanent coverage: new `tests/e2e/groupDrag.spec.ts`, 2 tests against the production build, 6/6 green across 3 parallel repeats. Both directions are asserted because the two defects were independent.
- [x] Re-used a lesson from loop 3 rather than re-learning it: this spec's `beforeEach` initially skipped the app-mounted gate and so raced floor creation on 1 of 4 runs; added the `Switch to draw mode` visibility gate. Also re-hit the `expect.poll(thunk)` arity rule and `expect()` on a bare Promise - Playwright wants `toHaveCount` on a locator.

### Loop 10 - locked-member group drag was a silent dead interaction; warn-once mechanism built

- [x] **CLOSES the `[not-fixed]` item carried since loop 3.** Browser evidence first: lock one object with the documented `L` shortcut, shift-click a second so the selection holds both, drag the *unlocked* one - both deltas came back `0` and the toast list gained nothing. The store refuses the whole group because one member is locked (`objects.ts` `moveMembersTo` bails on any locked member), and until loop 9 fixed group drag this path was unreachable, so the silence was latent rather than absent.
- [x] Fix is feedback, not a behavior change: `applyDragTarget` (`src/blueprint-editor/components/canvas/EditorCanvas.vue:791`) reads the `MoveAttempt` and warns **once per gesture** via `dragWarned`, reset on drag start, drag end and `cancelObjectDrag`. This is the warn-once mechanism loop 3 said was a precondition for warning on the pointer path - the pointer path fires per animation frame, so an unguarded toast would spam. One helper serves both the rAF and the mouseup call sites rather than duplicating the logic.
- [x] Same mechanism also closes the *other* silent path on the pointer: dragging into painted geometry now reports `Cannot move there - ...` once. Verified it was silent before.
- [x] Chose not to change which objects move. Moving the unlocked members and leaving the locked one behind is what most editors do, but a selection here can also be a **link group** (`objectMoveMembers`), and letting half a linked pair move on its own is a product decision, not a bug fix. Recorded as an open design question below instead of guessed.
- [x] Two of my own test bugs found while writing the coverage, both worth recording because they look like product failures: (a) the wall-drag test dragged nothing - `onObjectMouseDown` returns early while a tile brush is armed (`src/blueprint-editor/components/canvas/EditorCanvas.vue:748`), so a test that paints and then immediately drags silently tests nothing; (b) asserting the refused object returned to its exact start position is wrong, because a refused drag legitimately stops dead *short* of the geometry, partway along the gesture.
- [x] `tests/e2e/groupDrag.spec.ts` now 4 tests. Full e2e: 10 tests, 20 passed across 2 serial repeats; unit 270, typecheck 0, lint/bem/css clean.

### Loop 11 - escape hatch proven in a browser; e2e helpers deduplicated

- [x] **The buried-object escape hatch works on the real canvas.** New `tests/e2e/burial.spec.ts`: place, paint a wall over it, confirm `editor__object--collapsed`, then drag it out - it moves and the flag clears. This pairs the two things I changed in loops 2 and 3 (F3 gave painted burial a persistent red flag; the hatch keeps a buried object movable) and neither was ever proven together in a browser. Had the hatch failed, users would get a red object that refuses to leave the wall - a trap by construction.
- [x] Second test pins the boundary of that hatch: dragging from inside wall A toward wall B lets the object leave A but never land in B. It also documents a consequence I had not stated anywhere: once the object escapes A mid-gesture it is no longer buried, so the ordinary geometry guard resumes and the drag stops short - the resting spot is between the walls, not back in A. My first assertion ("still collapsed afterwards") was therefore wrong about correct behaviour, not just brittle; the test now asserts the real invariant, that it does not come to rest at the refused target.
- [x] **Removed the triplicated canvas helpers** by extracting `tests/e2e/canvasFixtures.ts` and migrating `groupDrag.spec.ts` and `overlap.spec.ts` onto it. This was not cosmetic: the duplication had already produced a real defect. `paintWall` clicked the brush button, which is a **toggle**, so a second call in one test disarms it and paints nothing - the failure looked exactly like "the refusal did not fire". The shared version checks `flag--active` before clicking, so the trap is gone for every spec, and a grep confirms no spec defines `userToPage`/`paintWall`/`bootWithOneFloor`/`importAsset` locally any more.
- [x] Two test-authoring traps caught on the way, both of which masquerade as product bugs: a drag attempted while a tile brush is armed silently does nothing (documented in the fixture's `dropBrush`), and `expect()` on a bare `locator.count()` Promise instead of `toHaveCount` on the locator.
- [x] e2e grew 3 -> 12 tests; 24/24 across 2 parallel repeats. Unit 270, typecheck 0, lint/bem/css clean, tree clean.

### Loop 12 - marquee and cycle seams; one stale-cache defect fixed

- [x] **Marquee selection verified in the browser** (new `tests/e2e/marquee.spec.ts`): rubber-banding over two objects selects both, and the loop-9 anchor rule holds for this affordance too - it selects by *floor-object order*, not click order, so grabbing the second-listed member still moves the pair by one delta. An empty marquee clears the selection, as `onCanvasMouseDown` calls `select(null)` before the box starts (`src/blueprint-editor/composables/useCanvasSelection.ts:50`). No defect.
- [x] **Alt-cycle verified**: stacked objects are reachable without disabling the placement gate (decorative art is exempt as the placed side), so two clicks on one spot cycle to the other object. The test proves it by nudging and checking which object moved, not by reading internals.
- [x] **Defect found and fixed - the cycle cache outlived its floor.** `_cycleClickPos` / `_cycleCandidates` / `_cycleIndex` (`src/blueprint-editor/components/canvas/EditorCanvas.vue:691-693`) hold object refs for whichever floor was active when they were built, and only `tryCycleSelect` ever cleared them. After a floor switch, a click landing within the cycle threshold of the old point with more than one candidate there returns a stale id from `_cycleCandidates` - selecting an object that is not on the visible floor. Now reset by a watcher on `store.state.currentFloorId`, matching the existing watcher at `:597`.
- [x] Fixture flaw fixed while writing these: `dropBrush` switched to **move** mode to disarm the brush, but in move mode a canvas drag pans instead of marquee-selecting (`src/blueprint-editor/composables/useCanvasSelection.ts:46`), so any future marquee test built on it would silently test the wrong thing. It now toggles the brush button off and leaves the tool as the user had it.
- [x] e2e 12 -> 15 tests; 30/30 across 2 parallel repeats. Unit 270, typecheck 0, lint/bem/css clean, tree clean.
- [x] Verification honesty note from loop 12, since resolved: the marquee and cycle behaviors were browser-proven, but the floor-switch cycle fix was at that point **reasoned, not reproduced**, with no test pinning it. Loop 13 built the repro and confirmed the test fails without the fix - see that section.

### Loop 13 - the loop-12 cycle bug is now reproduced, and the test is proved to have teeth

- [x] **Upgraded my own loop-12 caveat.** I had flagged the floor-switch cycle defect as "reasoned, not reproduced" because a repro needed two floors each holding a stacked cluster at the same user-space point. Built it anyway: new `tests/e2e/cycleFloor.spec.ts` stacks two art objects on floor 1, clicks the stack to populate the cycle cache, adds F2 through the Floor Manager, switches with the canvas floor nav, stacks the same pair at the same point and clicks it. It **does** reproduce - stale cache yields a floor-1 id, so nothing on the visible floor is selected.
- [x] **Verified the test actually fails without the fix**, the same way I checked the `ObjectData` manifest: backed up `EditorCanvas.vue`, deleted the reset watcher at `:697-704`, re-ran - `Expected: 1, Received: 0`, one test failed - then restored the file and confirmed the whole suite green again. Without this step a passing test proves nothing about the fix.
- [x] Two fixture selector traps found building it, both of which read like product failures: several `role="dialog"` nodes exist at once so a dialog must be addressed by its own id (`#modal-floor-manager`), and inside the Floor Manager the accessible name `Close` is ambiguous between the modal's `aria-label="Close"` header button and a content button literally labelled "Close", so the header control is now targeted by class.
- [x] e2e 15 -> 16 tests; 32/32 across 2 parallel repeats. Unit 270, typecheck 0, lint/bem/css clean, tree clean, `EditorCanvas.vue` restored intact after the falsification run.

### Loop 14 - rotate and flatten exercised; no product defect, three test bugs of mine

- [x] New `tests/e2e/rotateFlatten.spec.ts`, 3 tests, covering the last two unexercised canvas gestures: a full 360 degree rotate cycle (box swaps 50x25 to 25x50 and returns exactly), a rotation that would land on painted geometry (refused with a reason, box and collapse state untouched), and flatten merging a pair into one placed object plus one new origin asset.
- [x] No product defect found here. Three of my own test bugs, each of which would have read as one, and all worth recording so they are not re-committed: (a) I first tried to prove the rotate refusal with two art objects - art is exempt as the placed side by design, so no refusal is possible; the guard that is never exempt is painted geometry, which is what the test now uses. (b) `expect(promise).resolves.toMatch(...)` is a one-shot await with no retry, which made the intermediate rotation checks flake between renders; only `expect.poll` retries. (c) Reading a rendered attribute immediately after a keypress catches the pre-render frame.
- [x] Fixture work to make a non-square asset available, because rotation is invisible on a square one: `importAsset` now takes the markup and the expected derived tile size, and `dragPaletteTo` can name which palette row to grab.
- [x] e2e 16 -> 19 tests; 38/38 over 2 parallel repeats. Unit 270, typecheck 0, lint clean, tree clean.

### Loop 15 - Escape did not cancel an in-flight object drag

- [x] **Stale drag state on Escape.** `cancelObjectDrag` is the only teardown for the object-drag window listeners, the queued rAF and the `moving` ref, and it had exactly one caller - the npc-preview exit at `src/blueprint-editor/components/canvas/EditorCanvas.vue:78`. The Escape branch ended a *palette* drag (`endAssetDrag`) but never an *object* one, so pressing Escape mid-drag left `moving` set, the listeners attached and the object stuck showing `editor__object--dragging` - it looked grabbed and tracked nothing until the next mouseup. Escape now calls it when a drag is in flight (`:966-972`).
- [x] Test added and falsified: `tests/e2e/groupDrag.spec.ts` "Escape during a drag releases the object instead of leaving it grabbed" asserts the dragging class is present mid-gesture, gone after Escape, selection cleared, and a later release is inert. Removing the one-line fix makes it fail with `Received string: "editor__object--dragging"`, so the assertion is attached to the defect and not to a tautology.
- [x] e2e 19 -> 20 tests; 40/40 over 2 parallel repeats. Unit 270, typecheck 0, lint/bem/css clean, tree clean.
- [ ] Open design question, deliberately NOT decided: Escape currently aborts the drag but does not roll back the portion already applied, because `moveMembersTo` mutates live object positions on every mousemove. A true cancel needs the pre-gesture positions snapshotted at mousedown and restored on abort. That changes what Escape means to a user who is mid-drag today, so it needs a call rather than a guess.

### Loop 16 - an orphaned clipboard could resurrect an object with no origin

- [x] **Pasting re-created objects whose origin asset no longer existed.** `pasteObjects` checked only the placement gate, which never asks whether the origin is registered, so a copy whose asset had been deleted went straight back onto `floor.objects`. It renders with no asset and - the actual data-loss part - `src/blueprint-editor/store/migrate.ts:72` filters out objects with unknown types on the next load, so the pasted object silently vanishes after a save and reload. Reproduced with a failing test before fixing: copy, `deleteAsset`, paste, assert the floor stays empty - it did not.
- [x] Guarded at the single choke point (`src/blueprint-editor/store/metadata.ts:71-79`) rather than clearing the clipboard per cause, because three separate routes strand a copy - deleting the origin, undoing its creation, importing another workspace - and only an existence check at paste covers all of them.
- [x] Swept the rest of the class instead of stopping at the one instance: every object-creating write in the store is either a removal (`src/blueprint-editor/store/assets.ts:223`, `src/blueprint-editor/store/objects.ts:151`, `src/blueprint-editor/store/objects.ts:169`, `src/blueprint-editor/store/floors.ts:56`), a load-time filter (`src/blueprint-editor/store/migrate.ts:72`), or creates the origin before the object (`src/blueprint-editor/store/flatten.ts:178`, `src/blueprint-editor/store/objects.ts:93`, `src/blueprint-editor/store/objects.ts:113` via `placementRect` returning null for an unregistered type). Paste was the only hole.
- [x] Test "pasteObjects() refuses to re-create an object whose origin no longer exists" plus the sweep are now the invariant: no placed object can reference a missing origin.

### Loop 17 - a canvas too small for the street band left no building area at all

- [x] **Two hypotheses checked and cleared, one defect found.** Cleared: (a) F9's stale-`currentFloorId` invariant does hold on *every* layout-replacing path - boot `src/blueprint-editor/store/createStore.ts:78`, undo `:179`, reload `:206` and workspace import `src/blueprint-editor/store/persistence.ts:36` all repair it, so import is not a second F9. (b) The asset/grid caps align exactly (`MAX_ASSET_TILES`, `MAX_GRID_ROWS`, `MAX_GRID_COLUMNS` all 256), so `buildWalkableGrid` can never bail on a legal asset.
- [x] Found: `resolveBuildingArea` floors width/height at 0 (`src/blueprint-editor/domain/geometry.ts:158`), so when the street band is inset on both edges of both axes and the canvas is no wider than twice it, the building area becomes 0x0. Neither ingress checked that: `resizeCanvas` validated only the grid caps (`src/blueprint-editor/store/mode.ts:32`) and `setStreetWidth` only the 5-20 range (`:128`). On an empty layout - the only state resize is allowed in - you could shrink the canvas until placements were clamped to a **zero-size box**: `placementRect` returns w=0, the gate passes because a 0-area rect overlaps nothing and hits no cells, and the object lands invisible.
- [x] Guarded from both directions with one shared predicate `canvasLeavesBuildingArea` (`src/blueprint-editor/domain/schema/layout.ts:55-63`), reusing the existing `canvasWithinGridCaps` placement and style, and deliberately mirroring the engine's own 'no street cells exist when the ring covers the whole canvas' condition in `zoneOverlapsStreetRing` so the authoring guard and the spawn rule can never disagree.
- [x] Test written first and **falsified**: 'a canvas too small for the street band is refused from both directions' fails with `AssertionError: a canvas the band swallows is refused` when the two guard lines are deleted, passes with them.
- [x] Note on interaction with loop 1: before the `placementRect` fix, `normalizeObject` overwrote the clamped size, so this configuration produced an overhanging object instead of a zero-size one. Same root cause, different symptom - the F1 fix is what made the degenerate area visible as invisible objects, which is why it is worth guarding now.

### Loop 18 - the degenerate canvas was still reachable through a loaded file

- [x] Loop 17's guard covered the two interactive ingresses only. The **load** paths were still open: `src/blueprint-editor/store/migrate.ts:64` and `src/blueprint-editor/domain/schema/dataFile.ts:125` validate `streetWidthTiles` against its 5-20 range and never against the canvas, so a file pairing a small canvas with a wide band loads into a 0-sized building area - which `limits.ts` explicitly says must not happen ("every ingress normalizer AND every construction path must use these numbers").
- [x] Chose to stop the harm rather than rewrite loaded data: `addObject` and `canPlaceObject` now refuse a clamped rect of non-positive size (`src/blueprint-editor/store/objects.ts:101-110`), so a corrupt layout reports `the street band leaves no floor area at this canvas size` instead of producing an **invisible zero-size object** that passes the gate because it overlaps nothing and covers no cells. Clamping `streetWidthTiles` up or silently enlarging the canvas on load would have mutated user data to fit a bad combination; that stays a decision for the same open list as `usePx`.
- [x] Test written, run green, then **falsified** against the unguarded store: removing the guard flips it to `1 failed`, restoring flips it back. "a degenerate building area refuses placement instead of creating a zero-size object".
- [x] Unit 273, e2e 20, typecheck 0, lint 0, tree clean.

### Loop 35 - `arch compare` ranks candidates by profit, not by gross takings

- [x] `scripts/arch/compare.ts`: `OptionEconomy` (income net of standing, payroll, profit, runway) +
  `economyKpis()` + `economyFromReport()`; `measureOption(name, path, economy?)`; `profitPerDay` added
  to `RANKED_KEYS` and to all four `WEIGHT_PROFILES` (efficiency 4, operations 3, experience 1, safety 1).
  Money enters as KPI rows so the existing per-metric normalisation is the only ranking machinery.
- [x] Gross stays published, never ranked, and the report says so: the Economy section prints the gross
  order and the profit order and calls out when they disagree ("the busier room is paying more staff
  than it feeds"). Pareto only gains the profit objective when **every** option was priced.
- [x] `rankOptions` now skips any metric a candidate does not report. Without that, an option nobody
  ran a crowd over scored a real 0 and could **win** on an absent measurement - falsified: replacing
  the filter with `.filter(() => true)` flips `an option nobody priced is never scored as if it earned
  nothing` red.
- [x] `scripts/arch/takings.ts` gained `netPerDayCents` (the same number `settleDay` is fed), so the
  comparison reads the ledger's own output instead of re-deriving a multiplier at the edge.
- [x] CLI: `arch compare --economy` runs the identical crowd config over every positional payload
  (`--ticks/--agents/--stay/--patience/--footfall`, or `--standing` for a resident population);
  `--in` resolves once per option so no plan can be measured on a different canvas.
- [x] New `tests/unit/archCompareProfit.test.ts` (3): same geometry on both sides so only money can
  move the order; the absent-measurement guard; and the mapping read off a real `measureTakings` run
  with gross and net separated on the same report object. **Falsified**: zeroing the `profitPerDay`
  weights flips test 1, removing the presence filter flips test 2.
- [x] Manifest 53 -> **56 guards**: `arch-rank-on-profit-not-gross`, `arch-income-read-from-net`,
  `arch-unpriced-option-not-scored` - each verified killed by `mutate --only arch-` (a full pass over
  all 56 was not re-run this session).
- [x] Pre-existing breakage found while verifying: `scripts/arch/metrics.ts` used
  `programmeRoomSamples` and `corridorWidthSamples` without declaring them on `FloorMetrics`, so
  `npm run typecheck` was already red at HEAD (5 errors) before anything in this loop was written.
  Both fields declared; typecheck 0 again.

### Loop 36 - insolvency is a state: a day the bank cannot pay takes staff off the floor

- [x] `src/blueprint-editor/domain/economy/insolvency.ts` - the crew rule, in one place:
  `staffOnDuty(bank, heads, wage)` = whole heads the bank covers, **capped at the deployment** and
  **floored at `STAFF_MIN_CREW = 2`**. The floor is not softening: without it an unpaid day is
  unrecoverable, because no staff means no service, no service means no takings, and the next day
  cannot be paid either.
- [x] `strikeFromClose(...)` reads the crew off the **closed day**, not off what is left: a shortfall
  means the bank went entirely into wages, so the funded count is `payroll - unpaid`. On the measured
  designed lobby (633.00/day against 1,920.00/day for 32 staff) that is **10 on shift, 22 sent home**.
- [x] The ledger records the evidence it used to throw away: `lastDayPayrollCents` and
  `lastDayUnpaidCents` in the snapshot, cleared by `reset()`. The money itself still floors at zero -
  the game has no debt to carry - but the shortfall is now observable by anyone.
- [x] `useNpcSimulationCore`: `applyPayrollStrike(state)` runs once per closed day from the frame loop,
  removes the surplus staff agents (`removeAgent`, saving id/role/floor/x/y/speed) and re-adds them
  when a later day pays in full. `clearStrike` on deploy and reset, so a fresh deployment inherits
  nobody's arrears; `getStrike()` exposed through `useNpcSimulation` and read on the existing 300 ms
  panel poll (one timer, plus `lastDayUnpaidCents` in the change-detection predicate).
- [x] HUD: "Wages unpaid X" when the day fell short and "Staff off duty N / M still on shift - the
  bank could not pay the rest of the crowd". Also fixed a real readout bug found next to it: the
  runway row was gated on `!payroll.selfFunding`, which is truthy for a **solvent** lobby, so
  "Days of bank left 0" printed on every working plan.
- [x] `settleDay` gained `unpaidWagesCents` + `insolvent` - the projection and the strike now read one
  wage rule instead of two.
- [x] New `tests/unit/insolvencyStrike.test.ts` (6): minimum crew at an empty bank, cap at the
  deployment, exact break-even, whole heads not fractions, the closed-day shortfall path, the ledger's
  unpaid/paid/reset behaviour, and `settleDay` reporting unpaid wages rather than hiding them.
- [x] Manifest 56 -> **61 guards** (5 new: min-crew floor, crew cap, shortfall read, ledger record,
  upkeep report), each verified killed by `mutate --only insolvency` / `--only unpaid`. The gate caught
  two of my own defects while running: the `strikeFromClose` shortfall branch was not on disk at all
  (guard reported `anchor not found`, and the test then failed for real), and my cap assertion passed
  with the cap deleted - both fixed.
- [x] Gates: unit 37 files / 361 tests, typecheck 0, lint 0, BEM + CSS pass, `clean:check` clean,
  `verify.mjs check` pass.
- [ ] Gap - the **five time-sensitive suites** (`takingsSimulationWiring`, `archCompareProfit`'s real
  run, plus the three that intermittently fail to collect) pass in isolation and fail under full-suite
  parallel load (`snapshot.bankCents === served * rate` off by one frame's worth). Pre-existing shape,
  not caused here; needs a serial or budgeted run before it can be called stable.
- [ ] Gap - the frame-loop strike wiring itself has no test: the domain rule, the ledger evidence and
  the panel wiring are covered, but no test advances a day close inside the simulation and asserts a
  staff agent left the engine. Needs a fake-timer harness - a real-clock one takes ~40 s per day.
- [ ] Gap - `--economy` is not exercised by `arch selftest` (14 fixtures, spatial stages only), and no
  e2e drives the panel's money rows (in-browser surface is 0x0, rAF never fires).

### Loop 37 - the bank can be spent: fixtures and heads, through the writes that already exist

- [x] `src/blueprint-editor/domain/economy/purchases.ts` - the outflow is priced off the two declared
  balances the loop already has, so no second price list exists: `fixturePriceCents = FIXTURE_COST_DAYS
  (3) x rateForTags(tags)` - the *same* best-rate rule that bills the thing - and
  `staffHirePriceCents = STAFF_HIRE_COST_DAYS (5) x STAFF_DAY_WAGE_CENTS`, a head priced against the
  wage it will draw on every closed day. An asset the tariff table does not price (`lounge` seating)
  returns null: **what earns nothing cannot be bought**.
- [x] `TakingsLedger.withdraw(cents)` - the mirror of `deposit`, and the reason loop 33's "no public
  withdraw" decision is now revisited: something finally needed it. Refuses a price the bank cannot
  cover (no part-payment, no debt), moves the bank only - never the window, the day book or `served` -
  and clamps carried down through a new single `clampCarriedToBank()`, which the payroll charge used to
  inline. One clamp rule, two callers, so a future withdrawal cannot forget it.
- [x] `composables/useShopPurchases.ts` - money follows the write, never precedes it. A fixture goes in
  through `store.addObject` at the nearest candidate the store's own `canPlaceObject` accepts (bounded
  scan, 200 candidates), and the bank is charged only after it lands; a hire writes through
  `store.updateNpcConfig` and the charge is confirmed against the **stored** pool count, not the
  requested one. One purchase at a time via `useAsyncAction`, because the affordability check and the
  charge are separated by an await on the save.
- [x] HUD: "Buy {asset} for {price}" for the selected origin (disabled when the bank cannot cover it,
  with the bank printed next to it) and "Hire {role} for {price}" for each staff role in the deployment
  - `hireableRoles` filters through `visitorRoleIds`, so a guest can never be hired. A hire calls
  `refresh()`: the preview watcher keys on the **floor** signature, and a pool edit changes no floor,
  so without it the player would pay for a head that never appeared.
- [x] 9 tests `tests/unit/purchasesShop.test.ts`: prices and the free-seating refusal, the affordability
  boundary, `withdraw` refusing/moving-only-the-bank/clamping carried past a `reset()`, and the app-level
  orderings against the **real store**: an unaffordable fixture writes nothing, an asset that bills
  nothing writes nothing, a floor that cannot take the object leaves the bank untouched, a hire lands in
  the stored deployment and charges, a hire the normalizer rejects (pool entry past 1000) charges nothing.
- [x] Manifest 61 -> **67 guards**, the 6 new ones killed: withdraw-refuses-short, free-seating-not-buyable,
  price-is-days-of-earnings, hire-price-is-days-of-wage, hire-charged-only-on-stored-count,
  purchase-charges-only-after-placement. All 67 anchors verified present after the runs.
- [x] Gates: unit **38 files / 370 tests** green (the two load-flaky files passed this run), typecheck 0,
  lint 0, BEM + CSS pass, `clean:check` clean.
- [ ] Gap - the HUD rows are typechecked and linted, not browser-exercised (0x0 surface, rAF never fires);
  the composable is tested against the real store instead.
- [ ] Gap - no sell-back and no price decay: money leaves, but a purchase is irreversible and the price
  never reacts to how many of a thing the lobby already holds.

### Loop 38 - standing is a resource: it lags the record, recovers a day at a time, and can be bought back

- [x] `domain/economy/reputation.ts` kept its evidence function (`readReputation`) and gained the state
  half: `advanceStanding(score, evidence)` closes `REPUTATION_RECOVERY_FRACTION` (0.4) of the gap per
  closed day, `repairStanding(score)` lifts `STANDING_REPAIR_POINTS` (10) **toward neutral and never
  above it**, `standingReading()` gives readers the same `ReputationReading` shape they already
  multiplied money by, and one `clampStanding` is the only band clamp.
- [x] The recovery boundary is the **ledger's**, not each surface's: `createTakingsLedger({ onDayClose })`
  fires once per closed day (a three-day jump closes three days, so an idle stretch cannot skip
  recovery). The app folds standing there, `scripts/arch/takings.ts` folds it there, so a measured plan
  and a played lobby cannot drift apart - the project's two-surfaces-one-implementation rule again.
- [x] Standing persists with the bank: `WalletRecord.standingScore` is optional (an older record still
  reads, it just starts neutral), `parseWalletRecord` rejects a non-integer or out-of-band score as the
  tampered record it is, and `commit` carries the saved standing over when the caller has no reading -
  a commit says nothing about reputation, so it must not delete one.
- [x] Shop: `buyStandingRepair` prices at `STANDING_REPAIR_COST_CENTS` (450.00, `purchases.ts` owns
  prices, `reputation.ts` owns the rule), refuses at or above neutral *before* touching money, and
  charges before applying the lift because a repair has no external write that can refuse it.
- [x] HUD: Reputation now reads the state (polled on the same 300 ms tick, no second timer) and
  "Repair standing for 450.00" appears only while it can help.
- [x] 5 tests `tests/unit/reputationRecovery.test.ts`: the fraction step and its convergence (settles at
  the record, whole points, never past it), band clamps, unproven drift toward neutral, repair cap and
  refusal, the ledger folding every jumped-over day, and the wallet round-trip with tampering.
  Two of my own wrong assumptions were caught by running them: rounding settles one point above the
  record (not on it), and `commit` without a reading dropped the saved standing.
- [x] Repair purchases also covered in `purchasesShop.test.ts` (bought while below neutral, refused at
  neutral, money untouched on refusal).
- [x] Manifest 67 -> **73 guards**, the 6 new ones killed: recovers-by-fraction, repair-capped-at-neutral,
  repair-refused-at-neutral, day-close folds standing, wallet carries standing, wallet validates the band.
  All 73 find-strings verified present after the runs.
- [x] Gates: unit **39 files / 376 tests**, typecheck 0, lint 0 warnings, BEM + CSS pass, `clean:check` clean.
- [ ] Gap - the arch tool's fold is proven by construction (same `onDayClose`, same function) but no test
  asserts it, so a future edit could drop the arch `onDayClose` and stay green.
- [ ] Gap - standing is device state per workspace: two floors on one device share one reputation. That
  is a design decision I have not written down as intentional; if the game later holds multiple live
  hotels, the key has to carry it.

### Loop 39 - the import/export round trip is now a behavioural surface with guards, and its dead audit is measured

- [x] New `tests/unit/workspaceRoundTrip.test.ts` (11): export -> `serializeWorkspace` ->
  `parseWorkspace` -> `importWorkspace` -> export again keeps placements; imported state comes back
  **sized** (the file carries no `w`/`h` by design, `normalizeObject` re-derives them on load - loop 4's
  note, now tested rather than remembered); an import whose file does not contain the current floor
  repairs it and stays authorable (the F9 class, on the import path); a stale selection and a selected
  asset are cleared; junk (`not json`, `{}`, `[]`) is refused by `parseWorkspace`; a failed save throws
  rather than being reported as a clean import; and the synced boundary is exercised end to end -
  `buildSyncedPayload` -> `loadSyncedPayload` keeps size and floor count, refuses a foreign `version`,
  drops a degenerate placement without losing its floor, and will not carry a `streetFloorId` that
  names no floor.
- [x] **Measured, not assumed: the import "losses" audit cannot fire.** Thirteen hostile files were
  probed through `readBlueprintDataFile` -> `migrate`; eleven are refused at the schema (orphan object,
  unknown type, non-numeric placement, pool entry naming no role, count past the ceiling, role field
  missing/out-of-range/over-long, empty task label), and the two that pass reduce nothing. So
  `droppedObjects/roles/tasks/pool` in `persistence.ts:20-29` is unreachable today. `[decided]` keep the
  branches as the ingress-loosening safety net (loop 6's reasoning) and pin the **refusals** instead of
  guarding dead code (loop 29/30's "an unobservable guard is not a rule"):
  `ingress refuses every workspace the import would otherwise have to shorten` flips the moment any of
  those inputs starts loading. Two survivors of that probe are now written down: a duplicate pool entry
  for one role loads and double-counts, and a spawn zone naming another floor loads unchanged.
- [x] Manifest 73 -> **83 guards**, all 10 new ones killed: import stale-floor repair, import clears
  selection, import clears selected asset, `parseWorkspace` validates, sync version gate, sync street
  floor must exist, sync object size from the placement, sync filters degenerate objects, sync keys
  ordered by id, sync `F0` is the ground floor.
- [x] The gate caught three of my own weak tests on the first run: my reorder test could not see
  position (labelled floors take their key from the label, so only an **unlabelled** pair exposes it),
  nothing covered `F0 -> G`, and a mutant written as `const size = false` survived because the ternary
  still fell through to `assetSizeFor` - the guard was rewritten to strike the branch that actually
  differs (`? { w: o.w, h: o.h }`).
- [x] `docs/skill/data-flow.md`: the measured ingress ordering, the "assert sizes against state, not
  against the exported file" rule, and the fact that a failed save inside an import throws.
- [x] Gates: unit **40 files / 387 tests**, typecheck 0, lint 0 warnings, BEM + CSS pass,
  `clean:check` clean, `verify.mjs check` pass, all 83 guard anchors present in the tree.
- [ ] Gap - `serializeWorkspace`'s own shape (indent, trailing newline) is not asserted anywhere; only
  its parseability is.
- [ ] Gap - the sync egress has no UI trigger (the Sync Game button was removed), so the boundary is
  proven as a pure function, not as a user-reachable action.

### Loop 40 - the two new states are proven inside a running simulation, and a real rule bug fell out of it

- [x] **Defect found by designing the test, then fixed**: `strikeFromClose` read the crew's funding off
  the *leftover balance* when a day paid in full. Paying 48,000 from a 60,000 bank leaves 12,000, which
  covers 2 heads - so a solvent day kept 6 of 8 staff off the floor for good. The funded amount is
  `payroll - unpaid` in every case: a paid day funds the whole deployment and brings everyone back.
  `bankCents` is no longer an input to the rule at all.
- [x] New `tests/unit/payrollStrikeSimulation.test.ts` (2, real frames through `useNpcSimulationCore`):
  8 staff deploy → an unpaid close takes the engine down to `STAFF_MIN_CREW` with
  `getStrike().offDuty === 6` and folds standing from 70 to the recorded 42 on the same boundary →
  a paid close returns all 8; and a re-deploy restores the full crowd and clears the day book, so
  re-deploying is not a way to keep half a crew and forget the arrears. The log line the strike writes
  ("6 of 8 staff unpaid") appears in the run, which is the engine-side evidence the loop-36 gap asked for.
- [x] New public readout `countStaffOnDuty()` (core + `useNpcSimulation`): staff-role agents actually in
  the engine, as opposed to `getStaffHeadcount()` which is the deployment. The test asserts against the
  engine, not the config.
- [x] New `archBuildIngress` test: `measureTakings` over one authored day of footfall at 0.2 s patience
  closes ≥ 1 day, produces walk-outs, and reports a standing strictly between its record and neutral -
  proving the offline runner ages standing on the same `onDayClose` boundary as the app (18.5 s).
- [x] Manifest 83 -> **87 guards**: strike removes staff from the engine, strike restores the crew on a
  paid day, standing folds on the app's close, the arch runner folds standing; the repointed
  `insolvency-shortfall-read-from-payroll` now strikes `payroll - unpaid` (its old anchor had vanished
  with the fix - caught by the find-string integrity check). All 4 killed, all 87 anchors present.
- [x] Gates: unit **41 files / 390 tests** (this run: no flakes), typecheck 0, lint 0 warnings,
  BEM + CSS pass, `clean:check` clean, `verify.mjs check` pass.
- [ ] Gap - the strike's once-per-close stamp is not guarded: neutralising the comparison still leaves
  every test green, because the strike is idempotent once the crew matches the funding. Harmless today,
  worth knowing before a third state is hung off the same boundary.
- [ ] Gap - the sim tests spend 0.9 s of real animation frames each and the arch-fold test 18.5 s; that
  is what the load-flaky tail of the suite is made of.

### Loop 41 - the parked canvas decisions were answered, and the one that changes behaviour is implemented

- [x] Asked and settled (recorded in `harness/state/history.md`): street-band-wider-than-canvas =
  **reject, no repair** (today's behaviour, confirmed); locked member in a group = **refuse the whole
  group** (confirmed, not changed); `usePx` = **stay import-only** (confirmed, not changed);
  Escape mid-drag = **roll the whole gesture back** (the only one that needed code).
- [x] Escape rollback implemented at the store, not in the pointer handler: `beginMoveGesture()`
  snapshots the member positions at mousedown, `cancelMoveGesture()` restores every member (not just
  the grabbed one) on Escape, `endMoveGesture()` clears the snapshot on release. It has to be a
  snapshot because `moveMembersTo` mutates live positions per animation frame and commits nothing until
  the release, so there is no undo entry to roll back to and nothing was ever written to disk.
  `dragMembers()` is now the single definition of "who is in this drag", shared by the gesture, the
  release and `commitMove` (which had its own copy of the ternary).
- [x] `tests/e2e/groupDrag.spec.ts`: the loop-15 Escape test rewritten to assert the stronger contract
  (the object returns to where the gesture started, and a later release stays inert), plus a new group
  test that shift-selects two, drags, presses Escape mid-move and asserts **both** return to their
  recorded positions. 21/21 e2e green - the mousedown/mouseup path every drag uses did not regress.
- [x] `tests/unit/storeCrud.test.ts` +72: the gesture restores the whole group, a second cancel is a
  no-op, and a release clears the snapshot so the next Escape cannot reach back into a committed drag.
- [x] Manifest 87 -> **89 guards**, both new ones killed: `gesture-cancel-restores-every-member`,
  `gesture-snapshot-cleared-on-release`. All 89 anchors present.
- [x] Gates: unit **41 files / 391 tests**, e2e 21/21, typecheck 0, lint 0, BEM + CSS pass,
  `clean:check` clean.
- [ ] Gap - the badge wording for `collapsed` is the last parked decision (it now means two things:
  overlaps another object, and is inside a wall). Asked, unanswered so far.
- [ ] Gap - `beginMoveGesture` is called on every object mousedown even when the gesture turns out to
  be a click; the snapshot is one array of `{id,x,y}` per member, so the cost is a small allocation per
  click rather than per frame. Deliberate, not measured.

### Loop 42 - the last parked decision (badge wording) landed, and the two halves of `collapsed` got one decider

- [x] `domain/collision.ts` gained `collapsedCause()` returning
  `'wall' | 'body' | 'none'` - structure first, then the standing art exemption, then body overlap - and
  `recalcCollapsed()` now only asks it and sets the flag. The flag and the wording are therefore one
  decision; previously the second half of the rule was readable only by re-implementing the order.
- [x] Wording, per the user's call: `AssetProperties` reads "N object(s) clash - shown in red on
  canvas" with a tooltip breaking the causes (`2 inside a wall, 1 overlapping another object`), and
  `store/assets.ts` no longer says "collapsed due to overlap" for a wall burial. One flag, one red
  style, as loop 2 decided - only the language changed.
- [x] `tests/unit/collision.test.ts` +1 test (8): names the cause in all four shapes (body, wall,
  both-at-once -> wall so the badge cannot double-count, art-on-body exempt, art-in-wall still flagged)
  and then asserts `recalcCollapsed` agrees on each, which is the refactor's whole contract.
- [x] Manifest 89 -> **91 guards**, both killed (`clash-cause-structure-first`,
  `clash-cause-art-exemption`); all 91 anchors present.
- [x] Gates: unit **41 files / 392 tests**, e2e **21/21**, typecheck 0, lint 0, BEM + CSS pass,
  `clean:check` clean, `verify.mjs check` pass.
- [ ] Note - `npm run test:unit` recreates `scripts/arch/out` (the probe builds), so `clean` has to run
  after the suite, as loop 33 already recorded.

### Loop 43 - the load-flaky suites are gone: waits became conditions

- [x] `tests/unit/frameWaits.ts` - `framesUntil(check, { deadlineMs })` polls a condition across real
  animation frames and returns how long it took (-1 when the deadline passes), plus `frameDeadline(label,
  waited)` which fails with the *reason* rather than a bare boolean. The reason a fixed sleep was wrong
  here: the engine only advances inside `requestAnimationFrame`, so `framesRunning(3000)` measured how
  busy the machine was, not what the code does - and a fully loaded `test:unit` run starves those frames.
- [x] Converted all five fixed waits: `takingsSimulationWiring` (both tests), `payrollStrikeSimulation`
  (all three phases: crew present, unpaid day furloughs, paid day restores). An idle run now finishes in
  well under its old fixed sleep instead of paying for it.
- [x] One real finding from the conversion, not a flake: the footfall test's "every guest is an arrival"
  assertion read `core.npcs.value`, the **250 ms throttled view list**, so as soon as the poll returned
  early it could still hold the pre-toggle crowd. It now waits for the view refresh it is asserting on -
  the loop-25 note about `frameDots` being the immediate truth, applied to the list that was not.
- [x] `tests/unit/archCompareProfit.test.ts` (the other file that "flaked") was a plain **timeout**: the
  evaluator and one real engine run need more than the default under contention. 60 000 ms on each test;
  the arch-fold test in `archBuildIngress` took 29.7 s in a loaded run against 18.5 s alone, which is the
  same effect measured rather than guessed.
- [x] Evidence, not vibes: **4 consecutive full `npm run test:unit` runs green** (41 files / 392 tests).
  Before this loop, 2 of the last runs failed the same two files.
- [x] Gates: typecheck 0, lint 0 warnings, `clean:check` clean.
- [ ] Note - the queue's "stabilise the time-sensitive suites" item is closed; nothing here changed
  production code, so the guard manifest is untouched (91).

### Loop 44 - the two round-trip survivors got their decisions, and one claim of mine turned out wrong

- [x] `normalizeNpcConfig` merges duplicate deployment rows per role (`mergeDeploymentPool`): counts add,
  the 1000 pool ceiling still caps the total, an unscoped row wins over a scoped duplicate (it already
  means "everywhere"), two scoped rows union their floors. One entry per role is now the stored shape at
  every ingress, authoring included.
- [x] `migrate()` drops a spawn zone whose `roleIds` name no deployed role, and prunes the dead references
  out of a zone that keeps living ones. A zone with **no** role filter is never judged, because "admits
  whoever is deployed" is still true after every current role is deleted.
- [x] **Retracted my own loop-39 finding**: I wrote that both shapes "are schema-legal and load
  unchanged". Probed again against `readBlueprintDataFile`, the schema **refuses** a file with duplicate
  pool rows or a zone role reference it cannot resolve - so neither ever reached `migrate` through
  import. The rules are still the right ones, for the paths where the shape does occur: a role deleted
  in the NPC Manager (zones keep the stale id until the next load), the sync-payload ingress, and any
  config written through `updateNpcConfig`. What I had measured was only that `migrate` reduced nothing.
- [x] Because ingress refuses them, the import "losses" lines I first added for merges and dropped zones
  were **removed again** in the same loop - an unreachable report is the same defect class as an
  unobservable guard. Kept one fix from that region: `importWorkspace` no longer overwrites
  `state.layout.npcConfig` with the raw incoming config, which had been restoring exactly what the lines
  above it reported as dropped, so state and report disagreed about what the workspace now holds.
- [x] 4 tests in `tests/unit/migrate.test.ts` (18 in file): mixed/dead/open zones, no-roles workspace
  keeping an unfiltered zone, and the pool merge across count, ceiling, unscoped-wins and scoped-union.
- [x] Manifest 91 -> **93 guards**, both killed (`zone-roles-must-be-deployed`,
  `deployment-pool-merges-by-role`); all 93 anchors present.
- [x] Gates: unit **41 files / 395 tests**, typecheck 0, lint 0 warnings, `clean:check` clean.
- [ ] Gap - the merge and the zone rule are unit-tested at `migrate`/`normalizeNpcConfig`; no test walks
  the "delete a role in the modal, reload, zone is gone" path end to end, which is the case that
  motivated them.

### Loop 45 - the world the project was actually for

- [x] **The project had drifted off its own purpose, and the drift was measurable**: the repo name is
  Continental-Idle and nothing in it - code, docs, or data - mentioned the world it was named after.
  The tariff was a hotel rate card (`living` 2400, `front-desk` 1800, `dining` 850, `bar` 380), the
  chat lines were *"Table six needs water"*, and the world had exactly two kinds of person: a
  customer and an employee. The economy was complete and the thing it was an economy *of* was absent.
- [x] `[decided]` Replace the tariff rather than add a second one. The four world rules the user
  picked all move the same numbers the hotel ones did, so keeping both would mean two price lists
  read by one HUD - the duplication the project already forbids. `TAKING_RATES_CENTS` is now
  `contract-closed` 4800 > `contract-board` 2400 > `chamberlain` 1800 > `back-room` 1200 > `bar` 850 >
  `infirmary` 700 > `kitchen` 450 > `chambers` 300. The mutation guards needed no rewrite: they are
  anchored on the *rules* (`rateForTags`, `visitorRoleIds`, the day rollover), never on tag names -
  which is why the swap was a 3-line change rather than a 93-guard edit.
- [x] `domain/economy/continuity.ts` - neutrality as a ladder of its own, deliberately NOT folded into
  `reputation.ts`: a bad queue, a breach of peace and a lost client are three diagnoses, and a player
  who fixes one has not fixed the others. A breach costs standing at once and compounds logarithmically
  within a day (five scenes are one bad night counted five times, not five times the damage).
- [x] **A real defect the test caught, in the first draft**: recovery was gated on the countdown
  running out, so a house that had recovered its *score* stopped climbing and stranded at 92 with no
  way back - one incident permanently cost a slice of income no careful play could repair. Recovery is
  now unconditional and the countdown is a readout. Falsified: restoring the gate fails the test at 92.
- [x] `domain/economy/standing-world.ts` - the reason the world had no factions or memory is
  mechanical, not conceptual: `idFor` hands out `t0, t1, t2...`, so every arrival was the same
  interchangeable agent and there was no identity for a rule to act on. A bounded roster
  (`WORLD_MEMORY_CAPACITY` 24) now holds named regulars with a faction; `creditService` moves a
  faction one step for a good night and two for a bad one, so a bad room is hard to leave.
- [x] `domain/economy/highTable.ts` - the institution that connects the two. A house under notice is
  fined daily and the fine buys back less than it costs, so standing still loses ground; returning to
  good standing clears the balance entirely. Two bugs the tests caught, both the same class as loop 18:
  `pressurePenalty` returned **1.05** for a negative balance (a penalty that paid a bonus), and
  `HIGH_TABLE_AUDIT_ABOVE` was a free-standing 5 000 that a 1 200/day fine could not reach in 12 days -
  two declared numbers that could not be made to agree. The threshold is now derived, not declared.
- [x] Two of the four rules are unreachable in play and that is recorded rather than papered over:
  **nothing creates the state** (`useNpcSimulationCore` has no continuity/pressure/world fields, no
  day close calls them, the HUD does not read them) and **nothing produces an incident**
  (`recordBreach(state, count)` takes a count; the engine's `blocked` event is a crowd failing to
  pass, and counting it would read a busy lobby as a massacre). Both are queued as tasks #6 and #7.
- [x] `[rejected]` The four tool tasks queued last loop (fan-out, `--economy` in selftest, sell-back,
  the deleted-role e2e) are **not** what the project needs next, and I am recording that rather than
  quietly re-ranking them: all four are worth doing, and all four make the *harness* better while the
  *game* still has no world in it. Task #2 is kept - it is a real coverage gap and cheap.
- [x] Gates: 421 unit / 44 files (up from 395/41), typecheck 0, lint 0 warnings, `clean:check` clean
  after `npm run clean` removed `scripts/arch/out` (the probe build, as loop 42 recorded).
- [ ] Gap - the `scripts/arch` fixtures are still a hotel's worth of `dining`/`bar` tags, which now
  bill nothing. `arch takings` on those plans will report a lobby that earns zero, and that is the
  correct reading of a plan built for a different world - but it means the offline tool has no
  Continental plan to measure until one is authored.

### Loop 46 - the world stops being a module and starts being a game

- [x] Both loop-45 gaps are closed. `useNpcSimulationCore` owns `continuity` / `pressure` / `world`,
  the frame loop feeds it, `getWorld()` is one settled read, and the HUD shows Neutrality, Scenes
  today, the High Table's outstanding balance, an audit, and any faction the house has lost - on the
  **existing** 300 ms poll, with no second timer.
- [x] `domain/economy/incidents.ts` gives neutrality a source it can honestly measure. The engine does
  not simulate violence and inventing an event for it would be a rule nothing enforces, so a scene is
  a **rate**: blocked agents over agent-ticks, above `INCIDENT_RATE_THRESHOLD`. A busy lobby is
  punished for its size no more than a small one - the rate is per person, and a test pins that two
  rooms of very different size at the same behaviour are charged identically.
- [x] **The incident evidence is collected by the ledger, not a second reader of the event stream.**
  My first version kept its own tally in the core; the test could not reach it (the frame loop is the
  only caller), which is a signal the design was wrong rather than the test. `ingest` now takes
  `present` and counts `blocked` itself, and hands the result over on `onDayClose` - one reader, one
  day boundary, and `arch takings` gets the same number the app does.
- [x] **Two ordering defects, both found by probe rather than by a failing assertion** - the class this
  project keeps hitting. (1) `advanceTo` ran *before* the batch was counted, so every jam that ended
  a day was filed into the next morning's tally. (2) The world read `daysCompleted` back from the
  snapshot *during* the close, where the day book has not rolled yet, so `worldDay` matched the stamp
  and **the world silently skipped a whole day** - the day still closed, it simply settled nothing,
  and no assertion caught it. Fixed by counting before the clock moves and by passing the closed
  day's own stamp in the payload (`onDayClose({ day, served, walkOuts, incidents })`).
- [x] A third defect the probe caught: `deploy()` reset the ledger but not the world, so a re-deployed
  plan inherited yesterday's neutrality. `clearWorld` is now shared by `deploy` and `reset` - one
  function, not two copies that can drift.
- [x] A fourth, in `incidents.ts`: a quiet second close returned `0` instead of the charge already
  made, which erased the night's scenes the moment anything settled them twice. It returns the charge.
- [x] `tests/unit/worldWiringSimulation.test.ts` (6, real frames through the core): a fresh house is
  neutral and welcome everywhere; an orderly night closes a day and changes nothing; a night of
  scenes costs neutrality and the House answers; a run of bad nights stacks fines; a re-deploy clears
  the world; and a closed day settles **once**, not on every frame after it. Measured on the way:
  one jammed night takes neutrality 100 -> 25 and puts the house under notice.
- [x] Two of my own test bugs, both the loop-27 class: a `pressurePenalty(-500) === 1` assertion that
  would have pinned a bonus, and a "one bad night is not yet fined" expectation that was simply wrong -
  ten scenes is 250 points, which is under the house by design, so the House *does* answer.
- [x] Gates: **435 unit / 46 files** (up from 421/44), typecheck 0, lint 0 warnings, BEM + CSS pass,
  `clean:check` clean after `npm run clean`.
- [ ] Gap - **the world does not reach the money.** `continuity.multiplier` and
  `pressure.demandPenalty` are read by the HUD and by nothing that moves cents: a breached house
  still bills face value. The price of a bad night is designed and displayed but not charged.
- [ ] Gap - **factions are not attached to guests.** `releasePerson` runs per arrival so the roster
  fills, but no agent's faction reaches the ledger, so a served client is credited to *every* faction
  on the day. Per-agent identity is the next slice, and it needs the roster id to travel with the
  agent rather than beside it.
- [ ] Gap - the `scripts/arch` fixtures are still a hotel's worth of `dining`/`bar` tags, which now
  bill nothing. `arch takings` on those plans correctly reports a house that cannot earn, but that
  means the offline tool has no Continental plan to measure until one is authored.

### Loop 47 - the world stops being a readout and starts turning the street

- [x] **`readWorld().expectedWalkIns` finally reaches money.** It was written to be the world in
  walk-ins and had no consumer outside its own tests, so a house could lose every faction and still
  be sent its full authored crowd. `createArrivalFlow` now takes `arrivalsPerDay` as a **function**,
  reads it live, and clamps it (negative closes the door, non-finite means a config that never
  loaded). `useNpcSimulationCore` hands it `() => worldTrafficPerDay(state)`.
- [x] **The owed fraction survives a rate that moves.** Arrivals are banked against elapsed time
  rather than recomputed from a rate captured at deploy, so a faction lost mid-run thins the street
  instead of finishing the night at the old rate - and a recovered faction pays the new rate forward.
  The fraction is never recalled: nobody who walked in is sent back out.
- [x] **A day that divides 300 seconds is still exact.** Measured across 2000 declared rates: 250/day
  and 1000/day land on the number they promised. A 500/day house delivers **499** in a whole day -
  the thousandth-of-an-arrival fraction never quite carries to the next whole one. **Decided, not
  accidental**: the same ledger cannot deliver 500 exactly *and* re-read its rate 60 times a second,
  and the user chose the live rate over the exact day. `arrivalFlow.test.ts` states it and pins both
  halves.
- [x] `tests/unit/takingsSimulationWiring.test.ts` gains **a house the world turns against thins its
  own footfall** - sixteen bad nights (twenty walk-outs each) drop every faction below
  `FACTION_HOSTILE_BELOW`, and the assertion is on `getTrafficSummary().spawned`, not on the reading
  the panel shows. **Falsified**: with `arrivalsPerDay` reverted to a captured number the test fails
  on `a house with no walk-ins owed still opened its door`, and passes again when restored.
- [x] **A real defect fell out of the probe, in the ledger itself.** `advanceTo()` ran *before* the
  batch counted `impatient` / `queue-left`, so the last day's walk-outs were filed into the next
  morning's tally every single day - loop 46 fixed this for `blocked` and missed the other two.
  `advanceTo` now runs after the whole batch is counted. 41 tests across the six ledger-dependent
  files stayed green.
- [x] `getWorld()` measured `expectedWalkIns` against `trafficState.spawned` - the number that has
  *already walked in* - so the HUD reported one walk-in on the morning the first guest arrived. It
  reads `visitorTrafficPerDay` now, the same number the flow acts on.
- [x] Gates: **456 unit / 47 files** (up from 445/46), typecheck 0, lint 0 warnings, BEM + CSS pass,
  93 mutation guards all anchored.
- [x] Gap - the abandonment signal loop 19 named is **already closed**: `abandonQueue` emits
  `waiting/impatient` (`npcEngine.ts:1013`), the ledger counts it as a walk-out, and
  `npcImpatience.test.ts` proves the emit is load-bearing. The task-context gap that said otherwise
  was stale; do not re-chase it.
- [x] Gap - **closed by loop 48's e2e.** The board and the HUD are proven on a screen; the import
  path that gets a production build to a running preview is now a test, not a manual step.

### Loop 48 - a reason to come back: objectives on the counters the house already keeps

- [x] Verified first: **there was no progression anywhere.** No level, unlock, milestone or goal in
  `domain/schema/` or `domain/economy/` - the game had a scoreboard and nothing to do with it.
- [x] `domain/economy/objectives.ts` - five goals read off counters that already exist (`served`,
  `walkOuts`, `lastDayCents`, `DailySettlement`, neutrality, pressure). **No new state**: an objective
  is a question asked of the day book, not a second machine that has to be kept in step with it.
- [x] **The verdict is three-valued**, the way the rest of the project decides: `met` / `unmet` /
  `unknown`. A run that has not closed a day cannot be judged on what a night looked like, so an
  idle lobby reads unproven rather than failed. `arch takeings`' own three-valued verdicts are the
  precedent.
- [x] **Streaks fold once per closed day**, in `settleWorldDay`, not by whatever polls the board: a
  streak a 250 ms timer could advance thirty times is not a streak. The panel reads it on the poll
  it already had.
- [x] `useNpcSimulationCore.getObjectives()` reads the board off the *same* settlement the world
  uses, so a goal and a profit verdict cannot disagree about whether the day was good.
- [x] 7 unit tests (`objectives.test.ts`) and one in the running simulation. **Falsified twice**:
  `unmet` forced to `met` fails 4, and unbinding the streak fold fails the simulation test on
  `two closed days, one of them met, is a streak of one`.
- [x] HUD: a `form__row` of the five goals at `PropertiesPanel.vue:373`, inside `previewActive`,
  with the same `form__hint` / `flag--warning` vocabulary as the world block above it.
- [x] **CLOSED - the board is on a screen.** `tests/e2e/objectivesBoard.spec.ts` (2) gets a running
  house the way a player does: Workspace -> Import the authored `blueprint-data.json`, then Deploy.
  That is the only way in, because `App.vue:25` boots `emptySeed()` and a production build keeps the
  workspace in IndexedDB. Two things it now proves that 456 jsdom tests could not: the five chips
  render, and they are **stable across 4 seconds of polls** while no day has closed - a board a
  250 ms timer could advance thirty times is not a board. **Falsified**: `v-if="false"` on the row
  fails both. **Falsified** the harness too - the first four attempts failed on the confirm layer
  being a top-layer `#modal-confirm` shell, not on the objectives.
- [x] Gates: **e2e 23 / 23** (21 -> 23), typecheck 0, lint 0, BEM + CSS pass, **456 unit / 47 files**,
  93 mutation guards all anchored.
- [ ] Gap - **a goal is worth nothing yet.** `purchases.ts` takes money for fixtures, heads and
  standing; nothing pays for a streak, so the board is a readout with no economy behind it. The
  outflow needs a second state before objectives are a reason to return (the queue's item 3).


### Next in the free-token window (queue, ordered by value per machine-hour)

Every item below is machine-gated (a suite, a guard, or a measured command), because unattended tokens
are only worth spending where a script can say "wrong" afterwards.

1. **Lobby candidate fan-out** - generate N plans, score each with `arch compare --economy` (profit,
   after payroll) and render the top few for the user's eye. Bulk, parallel, zero judgement required.
2. **Exercise `--economy` in `arch selftest`** - the money stage is not part of the 14-fixture run.
3. **Make a streak worth money** - loops 47-48 gave the house goals and none of them pay. The outflow
   has one buy per fixture/head/standing repair at a fixed price, so the queue's "sell-back or price
   decay" and loop 48's gap are the same slice: a second state on the money that leaves.
4. **Guard the strike's once-per-close stamp only if it stops being idempotent** - today no test can
   observe it, so the manifest correctly does not claim it (loops 29/30's rule).
5. **Walk the deleted-role path end to end** - delete a role in the NPC Manager, reload, and assert the
   zone that named it is gone (loop 44's unit-only rule). `objectivesBoard.spec.ts` has just written
   the import + deploy steps this needs, so it is cheaper than it was.

Closed since this list was written: **profit as the plan score** (loop 35), **insolvency as a state**
(loop 36), **spend the bank** (loop 37), **reputation as a resource** (loop 38), **sync / import-export
round-trip guards** (loop 39), **the strike and standing wiring proven in the simulation + the arch
fold** (loop 40), **the parked canvas decisions, Escape rollback included** (loop 41), **`collapsedCause`
and the "clash" wording** (loop 42), **the load-flaky suites** (loop 43), **the pool-duplicate and
unreachable-zone decisions, implemented** (loop 44), **persist the demonstrated rate** (loop 34),
**faction relations thinning real footfall, and the ledger's day-close ordering** (loop 47),
**objectives as a day-book reading with a three-valued verdict** (loop 48).

## Blockers

- (none)

## Hand-off Note

Eighteen loops closed and every gate green (unit 273, e2e 20, typecheck 0, lint 0, tree clean, `verify.mjs audit` 82 quotes). 27 files changed, **nothing committed** - git is yours.
**Checked and cleared at close (do not re-chase):** `domain/schema/payload.ts` applies no `MAX_*`/`MIN_*` bounds while `dataFile.ts` applies six and `migrate.ts` two - which looked like the loop-18 asymmetry class again. It is not: that module exports **only interfaces** (`SyncedCanvas`, `SyncedObject`, `SyncedFloor`, `SyncedLayoutPayload`), so it performs no runtime validation to be missing bounds against. Inbound validation genuinely does live in `dataFile.ts` and `migrate.ts`. The import/export and sync round-trip is still unexamined as a **behavioural** surface (fields that survive save but not import), just not for this reason.


**Do not resume by hunting again at random.** The canvas/pointer layer is now well covered and the hit rate fell to about one defect per two loops. Two concrete next steps, in order of expected value:

1. **Largest unexamined surface: workspace import/export and the sync payload.** `exportWorkspace` / `importWorkspace` / `syncPayload` have unit coverage only, never a round-trip through the production build. Look specifically for fields that survive save but not import, and for the same class found in loop 18 - a bound checked on one ingress and not another (`migrate.ts`, `dataFile.ts`, `payload.ts` each validate a subset).
2. **Five decisions are parked, not skipped - they need your call, not mine.** Each is written up with its tradeoff above: (a) repair-or-reject a file whose street band exceeds its canvas; (b) should Escape revert the partial drag it aborts; (c) should a locked member halt a group or be moved around; (d) `usePx` - wire it up or retire it, where retiring changes a persisted schema field existing workspaces can contain; (e) toolbar badge wording, since `collapsed` now means both "overlaps another object" and "is inside a wall".

**Method that kept finding things, for whoever continues:** fix a class defect, then immediately ask whether the fix covered *every* ingress of that class - loops 17 to 18 found exactly that (interactive guard added, load path still open). And every regression test here was falsified before being trusted: written failing, fixed, then reverted to confirm it fails again. Browser proof outranked static reading throughout - three of the most severe defects (group drag never working, silent locked refusal, cross-floor stale selection) were invisible to 270 jsdom tests.
