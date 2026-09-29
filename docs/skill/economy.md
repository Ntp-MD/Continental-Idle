# Economy (the idle loop)

Money in this project is **read off the simulation**, never authored per-object. If a plan cannot
circulate guests, it earns less - there is no separate rules model to keep honest, and no number to
negotiate with.

The house is a **Continental**: neutral ground that trades in contracts. The tariff is priced off
that world, not off a hotel rate card - a room here is a place to disappear in, a contract is the
product, and the bar is the only trade that never touches the High Table.

## Modules

| File | Owns |
| --- | --- |
| `domain/economy/takings.ts` | the ledger: `TAKING_RATES_CENTS` per asset **tag**, billing on `interaction-end`, the live rate window, the hotel-day book |
| `domain/economy/arrivals.ts` | the arrival flow (Little's law, `L = lambda x W`), street-door entrances, one shared traffic step for the app and the arch tool |
| `domain/economy/reputation.ts` | standing: the counted evidence (`readReputation`), the state that lags it (`advanceStanding`, `clampStanding`), bought goodwill (`repairStanding`), `netOf` |
| `domain/economy/continuity.ts` | neutrality: the house's own score, what a breach costs, and the recovery that has to be played for |
| `domain/economy/standing-world.ts` | who walks in: faction relations, the bounded roster that remembers regulars, `creditService` |
| `domain/economy/highTable.ts` | what the High Table does about it: the daily fine, the outstanding balance, the audit, and the demand penalty |
| `domain/economy/incidents.ts` | what counts as a scene: `settleDayIncidents` over the ledger's own blocked/presence counters |
| `domain/economy/wallet.ts` | away time: `accrueOffline` projects the last measured rate, `parseWalletRecord` validates stored money |
| `domain/economy/upkeep.ts` | payroll: `staffHeadcount` (the visitor rule read the other way), `settleDay` -> profit + runway + what went unpaid |
| `domain/economy/insolvency.ts` | the crew after an unpaid day: `staffOnDuty`, `settleStrike`, `strikeFromClose`, `STAFF_MIN_CREW` |
| `domain/economy/purchases.ts` | the outflow prices: `fixturePriceCents` (days of what the fixture bills), `staffHirePriceCents` (days of the wage it draws), `affordable` |
| `store/wallet.ts` | the persisted balance and standing, as a second IndexedDB key beside the workspace |

## The four world rules

Each is a separate ladder, read at a different moment. They are never summed into one score: a bad
queue, a breach of neutrality, and a lost client are three different diagnoses, and a player who
fixes one has not fixed the others.

1. **Neutrality** (`continuity.ts`) - a breach costs standing immediately and starts a recovery
   clock. Recovery is unconditional; the countdown is a readout, not a gate. Gating the climb on it
   would strand the house partway with no way back - found by the test, which caught a house stuck
   at 99 forever.
2. **The High Table** (`highTable.ts`) - a house under notice is fined daily, and the fine buys back
   less than it costs, so standing still loses ground. Returning to good standing clears the whole
   balance. The audit threshold is `3 * PRESSURE_DAILY_COST_CENTS`, derived rather than declared
   separately, because two independent numbers could not be made to agree.
3. **Factions** (`standing-world.ts`) - every arrival is released as someone's, and a faction below
   `FACTION_HOSTILE_BELOW` is named as estranged; above `FACTION_LOYAL_ABOVE` it counts as loyal.
   `readWorld` turns those shares into `expectedWalkIns`, which is what the ladder is *worth* in
   traffic - the deployed crowd stays the authored pool, so a lost faction is reported and remembered,
   not billed. Losing a client costs twice what winning one gains, so a bad room is hard to leave.
4. **Memory** (`standing-world.ts`) - the roster holds `WORLD_MEMORY_CAPACITY` named regulars. Old
   names are forgotten, the arrival count is not, so a full roster can never quietly reduce a
   player's traffic. A house nobody trusts still gets strangers through the door: the world goes
   cold, never closed. |

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
  zero - unpaid payroll is written off, because the game carries no debt - but the shortfall is
  recorded (`lastDayUnpaidCents`), because it is the only evidence the strike has.
- **A day that cannot be paid takes staff off the floor.** `domain/economy/insolvency.ts` decides the
  crew: whole heads the wages actually covered (`payroll - unpaid`), capped at the deployment and floored
  at `STAFF_MIN_CREW`. A day that paid its bill in full therefore returns every head, even though the
  bank is now thinner than the payroll was - reading the leftover balance instead is the bug this
  wording exists to prevent. The floor is load-bearing, not softening - with nobody on shift there is no
  service, no takings, and the next day cannot be paid either. Money stays the ledger's; the simulation
  owns the agents.
- **A purchase is only complete when the write path accepted it.** `withdraw` refuses a price the bank
  cannot cover, clamps carried money down with the bank (the same `clampCarriedToBank` rule payroll
  uses), and moves nothing else. The fixture goes in through `store.addObject` - the placement gate is
  the one that decides - and the money leaves *after* it lands; a hire is confirmed from the stored
  pool count, not the requested one.
- **A role with empty `taskIds` is a customer; every other role is staff.** One rule
  (`visitorRoleIds`), read two ways: billing and payroll.
- **A `post:` tag never bills**, whoever stands there - a duty station is not a facility.
- **Away time is projected, never re-simulated.** Nobody was there to queue, so an absence can produce
  no walk-outs and cannot be re-run honestly. Cap it (`WALLET_OFFLINE_CAP_MINUTES`).
- **Away time is credited at the demonstrated rate**, a high-water mark persisted with the wallet - not
  the rate of whatever session happened to be last. A quiet session must not look like a lobby that
  cannot earn.
- **Standing is a state that lags the record.** `advanceStanding` closes `REPUTATION_RECOVERY_FRACTION`
  of the gap per closed day, and a repair lifts toward `REPUTATION_NEUTRAL` and never above it - money
  undoes damage, it does not buy goodwill the crowd did not give. The day boundary is the ledger's
  (`onDayClose`), so the app and the arch tool recover the same room the same way.
- **The design payload never carries the bank.** `blueprint-data` is shareable design work; money is
  device state.

## Declared balances (the tuning surface)

`TAKING_RATES_CENTS` (`contract-closed` 4800 > `contract-board` 2400 > `chamberlain` 1800 >
`back-room` 1200 > `bar` 850 > `infirmary` 700 > `kitchen` 450 > `chambers` 300),
`TAKINGS_RATE_WINDOW_SECONDS` (30 sim-s), `TAKINGS_DAY_SECONDS` (300 sim-s = one
authored hotel day), `WALLET_OFFLINE_CAP_MINUTES` (480), `WALLET_AUTOSAVE_MS` (60 000 wall),
`STAFF_DAY_WAGE_CENTS`, `STAFF_MIN_CREW` (2), `FIXTURE_COST_DAYS` (3), `STAFF_HIRE_COST_DAYS` (5),
`STANDING_REPAIR_COST_CENTS` (450.00) with `STANDING_REPAIR_POINTS` (10), `REPUTATION_NEUTRAL` (70),
`REPUTATION_RECOVERY_FRACTION` (0.4) and `incomeMultiplier = 0.5 + score/200`.

The world layer adds: `NEUTRALITY_BREACH_COST` (25), `NEUTRALITY_RECOVERY_DAYS` (3),
`HIGH_TABLE_ATTENTION_STANDING` (40), `continuityMultiplier = 0.5 + score/200`,
`PRESSURE_DAILY_COST_CENTS` (1 200), `PRESSURE_RELEASE_DAY` (900),
`HIGH_TABLE_AUDIT_ABOVE` (`3 * PRESSURE_DAILY_COST_CENTS`), `FACTION_RELATIONS_DEFAULT` (50),
`FACTION_HOSTILE_BELOW` (20), `FACTION_LOYAL_ABOVE` (70), `WORLD_MEMORY_CAPACITY` (24).

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

The world layer **is wired and running**: `useNpcSimulationCore` owns `continuity` / `pressure` /
`world`, the ledger's `onDayClose` settles all three on the same boundary the payroll and standing
use, `getWorld()` is one settled read for the panel, and the HUD shows neutrality, the day's scenes,
the High Table's outstanding balance, an audit, and any faction the house has lost. `reset()` and
`deploy` share one `clearWorld`, so a re-deployed plan is not punished for yesterday.

What is still missing:

- **The world does not reach the money.** `continuity.multiplier` and `pressure.demandPenalty` are
  read by the HUD and by nobody that moves cents. A breached house still bills face value; the two
  multipliers are the intended price of a bad night and they are currently only a readout.
- **Factions are not yet attached to guests.** `releasePerson` runs on every arrival, so the roster
  fills, but no agent's faction reaches the ledger - a served client is credited to *every* faction
  on the day, because there is no way to tell which one walked in.
- The `scripts/arch` fixtures are still a hotel's worth of `dining`/`bar` tags, which now bill
  nothing, so the offline tool has no Continental plan to measure until one is authored.
- No purchase can be *sold again* and no price reacts to how much of a thing the house already holds.

## Retracted claims (do not re-derive them from the code's shape)

- "Check-in cannot bill" - false: `reception-desk` carries 3 guest-side spots with no `post` tag and they bill.
- "The designed lobby earns 2.6x less than the open probe" - measured while `arch build` wrote a
  payload whose `walkableGrid` disagreed with its `tileStates`; on the fixed writer the sign flips.
  Always confirm both grid fields agree before trusting a takings number.
