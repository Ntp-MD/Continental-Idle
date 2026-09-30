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
| `domain/economy/takings.ts` | the ledger: `TAKING_RATES_CENTS` per asset **tag**, billing on `interaction-end`, the live rate window, the hotel-day book, the night's book **per faction** (`byFaction`), and the close's three money-outs: payroll, the High Table's fine, the price of the credit |
| `domain/economy/arrivals.ts` | the arrival flow (Little's law, `L = lambda x W`), street-door entrances, one shared traffic step for the app and the arch tool |
| `domain/economy/reputation.ts` | standing: the counted evidence (`readReputation`), the state that lags it (`advanceStanding`, `clampStanding`), bought goodwill (`repairStanding`), `netOf` |
| `domain/economy/continuity.ts` | neutrality: the house's own score, what a breach costs, the recovery that has to be played for, and `priceOfCreditCents` - the share of a night the credit does not keep |
| `domain/economy/standing-world.ts` | who walks in: faction relations, the bounded roster that remembers regulars, `creditService`, `advanceFactions` (the grudge that fades), `repairFaction`, `settleWorldNight` (the one seam both surfaces settle on), and the `latestReleased` face an arriving agent carries |
| `domain/economy/highTable.ts` | what the High Table does about it: the daily fine, the outstanding balance, the audit, and the demand penalty |
| `domain/economy/incidents.ts` | what counts as a scene: `settleDayIncidents` over the ledger's own blocked/presence counters |
| `domain/economy/wallet.ts` | away time: `accrueOffline` projects the last measured rate, `parseWalletRecord` validates stored money |
| `domain/economy/upkeep.ts` | payroll: `staffHeadcount` (the visitor rule read the other way), `settleDay` -> profit + runway + what went unpaid |
| `domain/economy/insolvency.ts` | the crew after an unpaid day: `staffOnDuty`, `settleStrike`, `strikeFromClose`, `STAFF_MIN_CREW` |
| `domain/economy/purchases.ts` | the outflow prices: `fixturePriceCents` (days of what the fixture bills, plus a day for each of the kind the floor holds), `fixtureSaleCents` (the trade-in), `staffHirePriceCents`, `affordable`, `facilityHoldings`, and the payout side: `objectiveRewardCents` |
| `domain/economy/objectives.ts` | the board: the five goals read off the day book, `settleObjectives` (judge -> fold -> price, in that order), `objectiveInputFor` (the one way a surface builds the reading) |
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
3. **Factions** (`standing-world.ts`) - every arrival is released as someone's, the agent that walks in
   carries that face, and a faction below `FACTION_HOSTILE_BELOW` is named as estranged; above
   `FACTION_LOYAL_ABOVE` it counts as loyal. `readWorld` turns those shares into `expectedWalkIns`,
   which the arrival flow reads live - so a lost faction thins the street the house is paid on, and a
   faction that never had a client is never charged for one it did not stand in. Losing a client costs
   twice what winning one gains, so a bad room is hard to leave - and a grudge fades on the nights the
   street is *not* reminded of it (`advanceFactions`), which is the way back for a house it has already
   written off. A message round the room buys the same road faster; it stops at even.
4. **Memory** (`standing-world.ts`) - the roster holds `WORLD_MEMORY_CAPACITY` named regulars. Old
   names are forgotten, the arrival count is not, so a full roster can never quietly reduce a
   player's traffic. A house nobody trusts still gets strangers through the door: the world goes
   cold, never closed. |

## Invariants (breaking any of these is a defect, not a refactor)

- **Whole cents, everywhere.** Money is integers. `Math.floor` on any derived amount; a fractional cent
  in storage is a tampered record, not rounding.
- **One owner of the bank.** The ledger holds it. The ladders' multipliers are never applied inside
  `pay()`: the day book, the rate window and `byTag` stay what the counter actually took, so an away
  projection cannot compound off a discount. What the house is worth is charged **at the close**, beside
  payroll and the fine (see "What the house is worth is charged"), which is why the HUD's "net" figures
  and the bank now agree instead of describing two different nights.
- **`deposit()` is not a service.** It moves `bankCents` + `carriedCents` only. If it ever touched the
  rate window, away earnings would compound off the rate they themselves produced.
- **`reset()` returns the bank to `carriedCents`.** Re-deploying a crowd re-measures the lobby; it does
  not un-earn money. Any future withdrawal must clamp `carriedCents` down or a reset would mint it.
- **A closed hotel day charges payroll.** `createTakingsLedger({ dailyChargeCents })` is called by the
  day book itself (`advanceTo`), so both surfaces pay the crowd on the same boundary. The bank floors at
  zero - unpaid payroll is written off, because the game carries no debt - but the shortfall is
  recorded (`lastDayUnpaidCents`), because it is the only evidence the strike has.
- **Payroll has a lever on both sides, and the cheap side is free.** `hireStaff` adds a head and charges
  `STAFF_HIRE_COST_DAYS` of the wage up front; `dismissStaff` removes one and moves **no money at all**.
  That asymmetry is the rule, not an omission: a house that cannot pay its crew needs a remedy it can
  actually take, and a severance would tax the only way out. Both go through `store.updateNpcConfig` and
  both confirm the change from stored state before the readout claims it - a release the deployment
  clamped back is reported as refused. `dismissStaff` can take a role to zero; the `STAFF_MIN_CREW` floor
  belongs to the strike (who shows up after an unpaid day), never to the player's own pool. Both rows
  name the **post** the head fills - `hireableRoles` returns `duties` from the same task list the engine
  deploys from - and releasing the last head of a role says so in the button's own warning, so the cost
  side reads as a service lost, not only as money saved.
- **A day that cannot be paid takes staff off the floor.** `domain/economy/insolvency.ts` decides the
  crew: whole heads the wages actually covered (`payroll - unpaid`), capped at the deployment and floored
  at `STAFF_MIN_CREW`. A day that paid its bill in full therefore returns every head, even though the
  bank is now thinner than the payroll was - reading the leftover balance instead is the bug this
  wording exists to prevent. The floor is load-bearing, not softening - with nobody on shift there is no
  service, no takings, and the next day cannot be paid either. Money stays the ledger's; the simulation
  owns the agents.
- **A sale is the purchase rule pointed the other way.** The fixture leaves through
  `store.deleteSelected` - the one path that refuses a locked object - and the money arrives only after
  it is confirmed gone from the stored floors. The sale *selects* the one fixture it names before it
  hands the floor over: the store deletes the whole selection, so a refund priced on one fixture and
  applied to five would be a lie. A fixture trades in at `FIXTURE_SALE_FRACTION` of **what a first one
  of its kind costs** - the holding premium bought crowding, and crowding is not refundable.
- **A shop trade cannot depend on a selection the screen makes impossible.** `fixtureRows` lists the
  tradeable kinds from the registry and the current floor, and it is the only way the panel buys or sells.
  During `npc-preview` a canvas mousedown is ignored, so nothing on the floor can be highlighted, and a
  palette mousedown calls `setMode('object')`, which *leaves* preview - so an asset-driven shop row was
  unreachable in the browser while every jsdom test stayed green, because those call the shop directly.
  A row offers `sellableObjectId` only for an unlocked fixture that is actually on this floor, since
  `deleteSelected` works on the current floor and refuses locked objects.
- **A purchase is only complete when the write path accepted it.** `withdraw` refuses a price the bank
  cannot cover, clamps carried money down with the bank (the same `clampCarriedToBank` rule payroll
  uses), and moves nothing else. The fixture goes in through `store.addObject` - the placement gate is
  the one that decides - and the money leaves *after* it lands; a hire is confirmed from the stored
  pool count, not the requested one.
- **A fixture's price knows how many of its kind the floor holds.** `facilityHoldings` counts placed objects through
  `rateForTags`, so a table that bills as `contract-closed` is never confused with a free lounge seat, and
  `fixturePriceCents` adds `FIXTURE_HOLDING_COST_DAYS` per holding up to `FIXTURE_MAX_COST_DAYS`. Counting is never a
  second tag rule.
- **A goal bonus is a share of the night that earned it, never a flat sum.** `objectiveRewardCents` pays
  `OBJECTIVE_REWARD_FRACTION` of the closed day's own takings per met goal, scaled by the streak up to
  `OBJECTIVE_REWARD_STREAK_CAP`, and the whole board is capped at `OBJECTIVE_REWARD_DAY_CAP_FRACTION` of that day. A
  lobby that served nothing has nothing to share out: the reward can multiply the drip, it cannot become the income.
- **The bonus is `deposit`ed, not billed.** It moves the bank and `carriedCents` and touches neither the rate window
  nor the day book nor `served` - the same rule as an away-earning credit, because a reward is money no interaction
  produced. It lands *after* that day's payroll and the House's fine, so a good night never rescues the wage bill it
  arrived to reward.
- **A faction heals only on a night it was not reminded of.** `advanceFactions` skips every faction in
  that close's `byFaction`, then closes `FACTION_RECOVERY_FRACTION` of the gap back to even, rounding
  the final point up so a house cannot strand a point short of even. This is a balance fact, not
  politeness: a bad night costs two points, and a fifth of the gap from 48 is also worth two - healing
  on the judged night made ostracism impossible (measured: 44 through twenty lost clients).
- **A message round the room ends a grudge and cannot buy loyalty.** `repairFaction` lifts toward
  `FACTION_RELATIONS_DEFAULT` and never above it, and refuses outright at or above even - the same line
  `repairStanding` holds for the room's own name. Charged before the world moves, because this purchase
  has no external write that can refuse it.
- **A faction's `served` / `lost` count nights, not clients.** `creditService` runs once per close, so a
  house that served two hundred people in a night records one. Both readouts say "nights judged" /
  "good nights, bad nights" for that reason - the client count is the ledger's `byFaction` book, and
  printing one under the other's name is how this was mislabelled once already.
- **One night settle, both surfaces.** `settleWorldNight(world, byFaction)` is the only place the world
  is credited and faded, and the app and `arch takings` call the same function on the same close. The
  order (judge, then fade the houses that were not judged) is the rule; a second copy is how a tool
  ends up ranking a plan on a street the player never had.
- **A settled day is judged, folded and priced in that order, once.** `settleObjectives` is the only seam: price on the
  pre-fold streaks and the first good night pays nothing; fold from a board a polling timer can re-read and the same
  close is banked thirty times. The day is judged at the ledger's own `closedDay` stamp, never at
  `snapshot().daysCompleted`, which has not rolled during the close.
- **A role with empty `taskIds` is a customer; every other role is staff.** One rule
  (`visitorRoleIds`), read two ways: billing and payroll.
- **A `post:` tag never bills**, whoever stands there - a duty station is not a facility.
- **What the house is worth is charged, at the close.** `priceOfCreditCents(dayCents, worth)` is
  subtracted from the night's takings by the ledger's own `dailyDiscountCents`, beside payroll and the
  High Table's fine. The counter still bills face value (`TAKING_RATES_CENTS`, whole cents, the rate
  window untouched), so the discount cannot compound into a projection - and `houseWorthOf` is one call
  in the core feeding the panel, the objectives board and the close, so no surface can display a
  discount the bank did not take. It is clamped to the bank: a house that cannot pay its crew has
  nothing left to pay for its name, and the game still carries no debt.
- **A served client is money that arrived.** `pay()` raises `carriedCents` with `bankCents`, because
  `reset()` restores the bank *from* carried: while it did not, two clicks in the panel (clear, deploy
  again) discarded the session's takings, and the next autosave wrote the smaller bank to storage. The
  discount, payroll and every purchase clamp carried down with the bank, so none of them can be minted
  back by a re-deploy.
- **A faction is charged only for its own client.** `byFaction` is the night counted per house, and
  `creditService` runs over the factions present in that book - never over the roster. An arrival
  carries the face the world released it with (`factionOfAgent`, bound at the traffic step, pruned when
  the agent leaves), and a client nobody can place is a **neutral** one, because a standing guest still
  has to be someone's. A line whose facility went away (`queueAbandons`) is the house's own failure and
  sours nobody's family.
- **Away time is projected, never re-simulated.** Nobody was there to queue, so an absence can produce
  no walk-outs and cannot be re-run honestly. Cap it (`WALLET_OFFLINE_CAP_MINUTES`).
- **Away time is credited at the demonstrated rate**, a high-water mark persisted with the wallet - not
  the rate of whatever session happened to be last. A quiet session must not look like a lobby that
  cannot earn.
- **The rate an absence is credited at is written by the facade, and net of the house's name.**
  `commitWallet` stores `floor(perMinuteCents * getHouseWorth())`, so a room the street distrusts earns
  *less while nobody is watching*, not face value - the same discount the close charges, or away time
  would become the one period a bad name costs nothing. `tests/unit/simulationWalletCommit.test.ts` is the
  witness: it drives `useNpcSimulation` with a fake `WalletStore`, because everything left of that
  multiplication was only ever tested against a rate somebody handed it.
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
`REPUTATION_RECOVERY_FRACTION` (0.4) and `incomeMultiplier = 0.5 + score/200`, the shop's second state
`FIXTURE_HOLDING_COST_DAYS` (1 day per holding) with `FIXTURE_MAX_COST_DAYS` (12) and the trade-in
`FIXTURE_SALE_FRACTION` (0.5 of a first one's price), and the payout
`OBJECTIVE_REWARD_FRACTION` (2% of the night per met goal) with `OBJECTIVE_REWARD_STREAK_CAP` (5) and
`OBJECTIVE_REWARD_DAY_CAP_FRACTION` (25% of the night, whatever the board asks for).

The world layer adds: `NEUTRALITY_BREACH_COST` (25), `NEUTRALITY_RECOVERY_DAYS` (3),
`HIGH_TABLE_ATTENTION_STANDING` (40), `continuityMultiplier = 0.5 + score/200`,
`PRESSURE_DAILY_COST_CENTS` (1 200), `PRESSURE_RELEASE_DAY` (900),
`HIGH_TABLE_AUDIT_ABOVE` (`3 * PRESSURE_DAILY_COST_CENTS`), `FACTION_RELATIONS_DEFAULT` (50),
   `FACTION_HOSTILE_BELOW` (20), `FACTION_LOYAL_ABOVE` (70), `WORLD_MEMORY_CAPACITY` (24), the fade
   `FACTION_RECOVERY_FRACTION` (a fifth of the gap back to even on a night the faction was not reminded
   of) with `FACTION_GOODWILL_POINTS` (5) at `FACTION_GOODWILL_COST_CENTS` (240.00), and the board's
   `OBJECTIVE_TARGETS` (`full-room` 40 served, `no-one-walks` 2 turned away, `pay-the-bill` any profit at all,
   `keep-the-peace` neutrality 90 and nothing owed, `earn-the-day` 1,200.00 taken).

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
- **A goal bonus is a rounding error on a plan that cannot pay its crew** - which is the point of pricing
  it on the night. Measured on `services-probe.txt` (60 agents, 40 000 ticks, two days closed): the last
  day took 93.50 and paid **3.74** of bonus (one goal met, a streak of two = 4% of the night), against the
  same 1,920.00/day payroll. The declared ceiling is 25% of a night, so the bonus can multiply the drip
  and cannot become it.
- **A fresh house already pays 15% of every night, and that is the designed curve.** Standing opens at
  `REPUTATION_NEUTRAL` 70 and `incomeMultiplier(70)` is 0.85, so the close keeps 85% from the first
  minute; a lobby that loses nobody converges its standing toward its record and the cost falls to
  nothing. Measured in the simulation: the same fifty served clients keep the whole night at standing
  100, and lose a quarter of it at standing 50.
- **On a plan that cannot pay its crew the credit costs nothing.** Measured on `services-probe.txt`
  (25 agents, footfall): the wage bill floors the bank at 0 every close, so `lastDayDiscountCents`
  reads 0.00 - the clamp, not the tariff, is what keeps an over-staffed lobby from going under.
- **A house cannot be shunned by a faction that never came.** Walking one line out for sixteen nights
  used to estrange all four houses at once (the spray); charged honestly it estranged only the faction
  whose client stood there, and the crowd the street owes fell below the declared one (a quarter of it,
  with one house of four lost). Offline the tool
  reads `clients by faction: neutral 23 served/0 walked out` - every client anonymous, because
  `arch takings` releases no people.

## Not built yet (the honest edge of the loop)

The world layer **is wired and running**: `useNpcSimulationCore` owns `continuity` / `pressure` /
`world`, the ledger's `onDayClose` settles all three on the same boundary the payroll and standing
use, `getWorld()` is one settled read for the panel, and the HUD shows neutrality, the day's scenes,
the High Table's outstanding balance, an audit, and any faction the house has lost. `reset()` and
`deploy` share one `clearWorld`, so a re-deployed plan is not punished for yesterday.

What is still missing:

- **The street is ranked; what is left is what it is worth over a short run.** `arch compare` scores each
  option on `street owed/day` - the arrivals the factions still owe the house after the verdict, read off
  `report.street.expectedWalkIns` - weighted `experience 3 / safety 2 / operations 1 / efficiency 0`, so a
  room board pays for the crowd people return to and a balance-sheet board does not. The streak bonus
  stays out of the score and still says why on the line. Open: the street column is measured over the
  run's horizon like profit, so a plan that wins the street slowly reports less of it than one that loses
  it fast.
- The `scripts/arch` fixtures are still a hotel's worth of `dining`/`lounge`/`front-desk` tags, which carry
  no rate, so the offline tool has no Continental plan to measure until one is authored.
- **Two purchases have never been clicked, and a player can never see them either.** The fixture trade,
  the hire and the release are all proven on a screen (`shopTrade.spec.ts`, `shopHire.spec.ts`, which sell
  three fixtures at 12.75, buy one back at 25.50, fund a 300.00 hire out of twenty-four trade-ins and read
  the payroll up by a day's wage and back down). A standing repair and a message round the room are not:
  a fresh house starts at standing 70 with every faction at even, so neither row ever renders. That is a
  design question - how does a player *meet* a remedy - not a test gap. A locked fixture is hidden from
  the row rather than refused on click, so the refusal toast is jsdom-only.

## Retracted claims (do not re-derive them from the code's shape)

- "Check-in cannot bill" - false: `reception-desk` carries 3 guest-side spots with no `post` tag and they bill.
- "The designed lobby earns 2.6x less than the open probe" - measured while `arch build` wrote a
  payload whose `walkableGrid` disagreed with its `tileStates`; on the fixed writer the sign flips.
  Always confirm both grid fields agree before trusting a takings number.
