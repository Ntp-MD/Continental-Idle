# Recap - idle loop build, 2026-09-28

What changed in this session, what was measured, and what is still open. Domain rules live in
`docs/skill/economy.md` (routed from `skill.md`); the resumable work queue is in
`harness/state/task-context.md`.

## What was built

Continental Idle had an editor and a crowd sim but **no game loop** - every `idle` in `src/` was an NPC
status. There is now a real economy, read off the simulation rather than authored:

| Piece | File | What it does |
| --- | --- | --- |
| Takings ledger | `src/blueprint-editor/domain/economy/takings.ts` | bills completed visitor interactions off the engine's own `interaction-end` stream; integer cents; tariff per asset **tag**; live rate window; hotel-day book |
| Arrival flow | `.../economy/arrivals.ts` | guests walk in through street doors and leave (`L = lambda x W`); one implementation shared by the app and the arch tool |
| Reputation | `.../economy/reputation.ts` | standing from counted outcomes only (`served` vs `walkOuts`), multiplier `0.5 + score/200` |
| Wallet | `.../economy/wallet.ts` + `store/wallet.ts` | the bank persists (second IndexedDB key, never inside `blueprint-data`) and away time is credited at the **demonstrated** rate, capped |
| Payroll | `.../economy/upkeep.ts` | every closed hotel day charges the staff it deployed; profit + runway |
| Impatience signal | `src/engine/npc/npcEngine.ts`, `useNpcOverlayDraw.ts` | `abandonQueue` now emits `waiting/impatient`; a lost customer renders as a red ring on the canvas |
| HUD | `components/panels/PropertiesPanel.vue` | Takings / rate / per-day / served / walk-outs / standing / net / carried / while-away / staff paid / payroll / profit / runway, plus the Footfall toggle - all on the one existing 300 ms poll |
| Measurement | `scripts/arch/takings.ts` (`npm run arch -- takings`) | drives the real engine + real ledger headless; prints gross, standing, **payroll and profit**; exits 1 when a plan serves nobody |
| Mutation gate | `scripts/mutate.mjs` + `tests/mutation-guards.json` (`npm run test:mutation`) | neutralises one rule at a time and demands a named suite goes red; **53 guards**, gate not report |

## Measured, not assumed

- Footfall vs a standing crowd on the designed lobby `plan-g`: **82%** of the brief's 500 declared
  arrivals/day vs **8%**.
- Congestion has teeth: patience 30 s -> reputation 99, net -0.5%; patience 3 s -> rep 52, net -24%;
  patience 0.5 s -> rep 39, net -30%.
- **The authored lobby is over-staffed for its traffic**: at patience 3 s it earns 633.00/day against
  payroll 1,920.00/day for 32 staff = **profit -1,524.37/day, 0 days of bank left**. That is a shape
  finding (`STAFF_DAY_WAGE_CENTS` is a declared balance) - the answer is fewer staff or more traffic,
  never a tariff increase.

## Defects found and fixed along the way

- `arch build` wrote a payload whose `walkableGrid` disagreed with its `tileStates`, so **the app could
  not load what the tool produced** and silently fell back to an empty workspace. That corruption is
  what had produced the earlier "the designed lobby earns 2.6x less" reading - the sign flipped once
  the writer was fixed. Guarded by `tests/unit/archBuildIngress.test.ts`.
- Asset library had drifted: `plan-g.txt` needs 50 asset types, the store carried 29. Refilled to 65
  defs, each with its own silhouette (`verify:assets` clean).
- Reservation rules were duplicated between `canReserve` and `reserve`; deduplicated, and the last three
  engine guards were closed with behavioural tests.
- `formatTakings` could not print a loss (`-120.-0`).
- The mutation gate itself crashed on a Windows file lock and left a **live mutant in the tree**
  (`const itemFull = false`). Repaired by hand, then every write goes through a bounded retry, and
  "re-check that all 53 find-strings are still present" is the standing post-run check.

## Retracted during the session

Recorded so nobody re-derives them from the shape of the code: "check-in cannot bill" (false - the desk
has guest-side non-`post` spots and they bill) and the 2.6x A/B above (measured on corrupted geometry).

## Verification at close

unit **352 passed / 35 files** · typecheck 0 · lint 0 warnings · BEM + CSS pass ·
`test:mutation` **53/53 killed** with the tree re-verified clean · `clean:check` clean ·
`verify.mjs check` pass.

## Still open

Closed since this list was written (loops 35-44; **every item on the original list is closed**; unit
**41 files / 395 tests**, e2e **21/21**, typecheck 0, lint 0, BEM + CSS pass, `clean:check` clean, and
each of the **40 new guards** verified killed by `--only` runs - the full 93-guard pass was not re-run
this session; the suites that used to flake under parallel load have now run green back to back).

- ~~1. Insolvency is a number, not a state.~~ **Closed** - `domain/economy/insolvency.ts`: a day the
  bank cannot pay sends the surplus staff home (whole heads covered by the wages actually paid, floored
  at a 2-head minimum crew so the lobby can still recover), the ledger records `lastDayUnpaidCents`,
  and the HUD says who is off shift. On the measured designed lobby: **10 on shift, 22 sent home**.
  Gap left: the frame-loop wiring has no test yet (rule + evidence + panel are covered and guarded).
- ~~4. `arch eval` ranks candidates by gross, not profit.~~ **Closed** - `arch compare --economy` runs
  the same crowd config over every option and ranks on **profit/day after payroll**; gross is published
  but never ranked, and the report names it when the two orders disagree.

Still open:

- ~~2. Money has no player-controlled outflow.~~ **Closed** - `domain/economy/purchases.ts` prices a
  fixture at three days of what it itself bills and a hire at five days of the wage it will draw, so
  there is no second price list; `ledger.withdraw` refuses what the bank cannot cover and clamps
  carried money through the same single rule payroll uses. A fixture is bought through
  `store.addObject` (the placement gate decides) and charged only *after* it lands; a hire is confirmed
  from the stored pool count. Free seating cannot be bought at all.
- ~~1. Reputation is read-only.~~ **Closed** - standing is a state now: `advanceStanding` closes 40% of
  the gap to the counted record on every day the ledger closes (`onDayClose` - the same boundary in the
  app and in `arch takings`, so a measured plan and a played lobby cannot drift), and `repairStanding`
  lets money lift it back toward neutral but never above it: goodwill can be repaired, not purchased.
  It persists with the bank and is validated like money - a non-integer or out-of-band score rejects
  the record.
- ~~1. Sync / import-export round-trip has no mutation guards.~~ **Closed** - 10 new guards over
  `persistence.ts`, `workspaceFile.ts` and `syncedPayload.ts`, plus `tests/unit/workspaceRoundTrip.test.ts`
  (11 tests) that drives export -> file -> parse -> import and the payload -> loader boundary. The
  hand-off note's open question is answered by measurement: the import's "imported with losses"
  accounting **cannot fire**, because the schema gate refuses every file that would have been shortened
  (11 of 13 hostile inputs probed; the 2 that load reduce nothing). The refusals are now pinned as a
  test, so an ingress loosening shows up as a flip rather than as a quietly shorter workspace.
1. ~~Five design decisions remain parked.~~ **All five settled** (history.md): street band = reject, no
   repair; locked member = refuse the whole group; `usePx` = stay import-only; **Escape rolls the whole
   gesture back** (implemented in `store/objects.ts`, browser-proven with a group-rollback e2e); and the
   badge now says **"clash"** with a tooltip naming both causes, backed by a single `collapsedCause()`
   so the flag and the wording are one decision rather than two readings.
- ~~The two new states are guarded as rules but not asserted inside a simulation run.~~ **Closed** -
  `tests/unit/payrollStrikeSimulation.test.ts` runs real frames: an unpaid close takes the engine from 8
  staff down to the minimum crew and folds standing 70 -> 42 on the same boundary, a paid close brings
  all 8 back, and a re-deploy clears the day book instead of inheriting half a crew. `archBuildIngress`
  proves the offline runner ages standing on the same `onDayClose` too. **Writing it found a real bug**:
  `strikeFromClose` funded the crew from the *leftover balance* on a day that paid in full, so paying
  48,000 out of 60,000 left 12,000 and kept 6 of 8 staff off the floor permanently. The funded amount is
  `payroll - unpaid`, always, and `bankCents` is no longer an input to the rule.
- ~~2. Three time-sensitive suites pass alone and fail under parallel load.~~ **Closed** - the fixed
  sleeps became conditions (`tests/unit/frameWaits.ts`: poll the state across real animation frames,
  fail with the reason at the deadline). An idle run now finishes faster than the old sleep, and **4
  consecutive full runs came back green** (41 files / 392 tests). Conversion found one genuine test
  defect: the footfall assertion read the 250 ms throttled view list as if it were the engine truth.
  The other "flake" was simply a default 5 s timeout on the arch evaluator run (now 60 s).
- ~~3. Two round-trip survivors are schema-legal and unhandled.~~ **Decided and implemented** (loop 44):
  duplicate deployment rows merge at normalization (counts add, ceiling caps, unscoped wins, scoped
  union); a spawn zone listing only undeployed roles is dropped at load and dead references are pruned
  from the rest, while an unfiltered zone is never judged. **My premise was wrong in one part**: the
  schema refuses both shapes at import, so they were never import cases - the rules cover the paths where
  they do occur (`updateNpcConfig`, deleted roles, the sync ingress). Two loss-report lines I had added
  for the import were removed as unreachable; one real fix stayed - `importWorkspace` no longer writes
  the raw config back over the migrated one.
4. The strike's once-per-close stamp has no guard: neutralising it keeps every test green, because the
   strike is idempotent once the crew matches the funding. Harmless today; worth knowing before a third
   state hangs off the same boundary.
5. Also fixed on the way: `npm run typecheck` was already red at HEAD - `scripts/arch/metrics.ts` used
   two `FloorMetrics` fields it never declared.
