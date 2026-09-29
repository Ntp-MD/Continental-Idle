# Economy (the idle loop)

Money in this project is **read off the simulation**, never authored per-object. If a plan cannot
circulate guests, it earns less - there is no separate rules model to keep honest, and no number to
negotiate with.

## Modules

| File | Owns |
| --- | --- |
| `domain/economy/takings.ts` | the ledger: `TAKING_RATES_CENTS` per asset **tag**, billing on `interaction-end`, the live rate window, the hotel-day book |
| `domain/economy/arrivals.ts` | the arrival flow (Little's law, `L = lambda x W`), street-door entrances, one shared traffic step for the app and the arch tool |
| `domain/economy/reputation.ts` | standing derived from counted outcomes only (`served` vs `walkOuts`), `incomeMultiplier`, `netOf` |
| `domain/economy/wallet.ts` | away time: `accrueOffline` projects the last measured rate, `parseWalletRecord` validates stored money |
| `domain/economy/upkeep.ts` | payroll: `staffHeadcount` (the visitor rule read the other way), `settleDay` -> profit + runway |
| `store/wallet.ts` | the persisted balance, as a second IndexedDB key beside the workspace |

## Invariants (breaking any of these is a defect, not a refactor)

- **Whole cents, everywhere.** Money is integers. `Math.floor` on any derived amount; a fractional cent
  in storage is a tampered record, not rounding.
- **One owner of the bank.** The ledger holds it. Reputation multiplies at the *readers* (HUD, arch
  report), never inside the ledger; payroll is settled at the *readers* too.
- **`deposit()` is not a service.** It moves `bankCents` + `carriedCents` only. If it ever touched the
  rate window, away earnings would compound off the rate they themselves produced.
- **`reset()` returns the bank to `carriedCents`.** Re-deploying a crowd re-measures the lobby; it does
  not un-earn money. Any future withdrawal must clamp `carriedCents` down or a reset would mint it.
- **A closed hotel day charges payroll.** `createTakingsLedger({ dailyChargeCents })` is called by the
  day book itself (`advanceTo`), so both surfaces pay the crowd on the same boundary. The bank floors at
  zero - unpaid payroll is written off, because insolvency is not yet a state the game has.
- **A role with empty `taskIds` is a customer; every other role is staff.** One rule
  (`visitorRoleIds`), read two ways: billing and payroll.
- **A `post:` tag never bills**, whoever stands there - a duty station is not a facility.
- **Away time is projected, never re-simulated.** Nobody was there to queue, so an absence can produce
  no walk-outs and cannot be re-run honestly. Cap it (`WALLET_OFFLINE_CAP_MINUTES`).
- **Away time is credited at the demonstrated rate**, a high-water mark persisted with the wallet - not
  the rate of whatever session happened to be last. A quiet session must not look like a lobby that
  cannot earn.
- **The design payload never carries the bank.** `blueprint-data` is shareable design work; money is
  device state.

## Declared balances (the tuning surface)

`TAKING_RATES_CENTS`, `TAKINGS_RATE_WINDOW_SECONDS` (30 sim-s), `TAKINGS_DAY_SECONDS` (300 sim-s = one
authored hotel day), `WALLET_OFFLINE_CAP_MINUTES` (480), `WALLET_AUTOSAVE_MS` (60 000 wall),
`STAFF_DAY_WAGE_CENTS`, `REPUTATION_NEUTRAL` (70) with `incomeMultiplier = 0.5 + score/200`.
All are declared here, none is derived from a corpus source - change them by feel, verify by measurement.

## Two measurement surfaces, one implementation

- **In-app**: `useNpcSimulationCore` ingests every drained event batch, runs the traffic step, and the
  HUD (`PropertiesPanel`) reads the ledger snapshot on its existing 300 ms poll. Never add a second timer.
- **Offline**: `npm run arch -- takings [--plan path] [--canvas WxH@T] [--ticks n] [--arrivals n]
  [--stay sec] [--patience sec]` drives the real engine + the real ledger and exits 1 when nothing is
  served, so a plan that cannot earn fails. `--plan` builds into `scripts/arch/out/`, never the store.

## Facts that were measured, so they are not re-guessed

- `NPC_ENGINE_TICKS_PER_SECOND` is **60**, so an authored day is 18 000 ticks. The policy owns the
  `pathfinder` - passing one before `...policy` is dead code.
- At `npcConfig.speed 0.2` an agent crosses one tile per second: a 35 m plate costs ~110 s per trip.
  Slow income is a horizon/density problem, **never** fixed by raising tariffs.
- Footfall vs standing crowd on the designed lobby: **82%** of the brief's 500 declared arrivals/day
  vs 8%. Free `lounge` seating stays unbilled by design.
- Congestion has teeth: patience 30 s -> rep 99, net -0.5%; patience 0.5 s -> rep 39, net -30%.
- **The authored lobby is over-staffed for its traffic**: plan-g at patience 3 s earns 633.00/day
  against payroll 1,920.00/day for 32 staff = **-1,524.37/day, runway 0**. Read that as a shape
  (`STAFF_DAY_WAGE_CENTS` is declared, so the absolute is negotiable and the ratio is the finding): the
  fix is fewer staff or more traffic, **never** a tariff increase.

## Not built yet (the honest edge of the loop)

Money has no **outflow** the player controls: payroll is charged but nothing is bought, an insolvent
lobby keeps operating, and standing cannot be repaired with money. Next in order: insolvency as a
state -> buy a fixture or a role through the existing store writes -> reputation as a resource ->
rank `arch eval` candidates by profit.

## Retracted claims (do not re-derive them from the code's shape)

- "Check-in cannot bill" - false: `reception-desk` carries 3 guest-side spots with no `post` tag and they bill.
- "The designed lobby earns 2.6x less than the open probe" - measured while `arch build` wrote a
  payload whose `walkableGrid` disagreed with its `tileStates`; on the fixed writer the sign flips.
  Always confirm both grid fields agree before trusting a takings number.
