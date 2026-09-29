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

1. Insolvency is a number, not a state - an lobby that cannot pay the day keeps operating.
2. Money has no player-controlled outflow: nothing can be bought with the bank yet.
3. Reputation is read-only: no daily recovery, no purchase that repairs it.
4. `arch eval` still ranks candidates by gross, not profit.
5. Sync / import-export round-trip has no mutation guards (the loop-18 hand-off note).
6. Five design decisions remain parked for the user (street-band repair-vs-reject, Escape reverting a
   partial drag, locked members in a group drag, `usePx`, toolbar badge wording).
