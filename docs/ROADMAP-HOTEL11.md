# The Continental - Ambient Diorama Plan

> Vision: a living John-Wick-style hotel you WATCH. Eleven floors of quiet
> luxury - staff gliding through corridors, guests lingering at the bar,
> elevator queues forming naturally. No goals, no currency. Civilization
> as a screensaver.

Success metric: watch 10 minutes and it feels alive, calm and expensive.

Written 2026-08-24 (revised same day after scope reveal: this is an
observation diorama, NOT an idle game - economy was removed accordingly).

---

## Current State Snapshot

- Game boots from persisted blueprint automatically; Hotel tab renders
  floors + walking NPC dots; World Map tab decorative; editor at /editor.
- Engine capabilities that map directly to the fantasy:
  - interaction with min/max dwell time -> guests linger politely
  - queueing -> elevator / reception lines
  - allowedRoleIds per floor -> staff-only back of house
  - spawnZones -> arrivals at the street
  - focusTags / restrictedTags -> purposeful destinations
  - portal objects -> elevator travel between floors
- Theme tokens already lean JW: accent-gold, dark backgrounds.

## Step 1 - Behavior Audit (small scale)

Goal: prove "civilized" reads correctly with 3 floors and a handful of NPCs.

Setup: G = lobby (reception counter + lounge seats), F1 = lounge/bar,
F2 = staff area. Two roles only:

- Staff (concierge): focusTag `front-desk`, restrictedTag `guest-area`,
  allowed on all floors.
- Guest: focusTag empty (wanders), restrictedTag `back-of-house`.

Observe and record:

| Check              | Believable means                                               |
| ------------------ | -------------------------------------------------------------- |
| Staff pathing      | Walks corridor lines, parks at reception spot, dwells, returns |
| Guest roaming      | Visits lounge seats / bar spots, never enters F2               |
| Elevator etiquette | Queues form (no overlap), riders exit before entering          |
| Idle moments       | Some guests simply stand - stillness is part of the fantasy    |

Findings:

```
- Harness: tests/audit-behavior.ts (npm run test:behavior). 3 floors G/F1/F2,
  4 concierges + 8 guests, 360s @ 60tps, seeded mulberry32; reruns are
  byte-identical.
- Staff pathing PASS: parked at reception 9x, dwells 25.8-34.8s inside the
  25-35s config; commutes to the F2 staff desk (3 uses, 1 elevator ride).
- Guest roaming PASS: 46 lounge/bar sits across all 8 guests; zero F2
  presence (guest restrictedTag back-of-house AND F2 allowedRoleIds both hold).
- Elevator etiquette PASS: 7 rides (6 by guests roaming G<->F1), zero overlaps
  (min pair distance 0.77 vs 0.5 clearance), arrivals never land on an
  occupant (min post-ride distance 9.5 cells); queues form under contention
  (max depth 2 at reception).
- Idle moments WEAK: guests stand only 0.3% of ticks on average - they cycle
  seats nonstop. Believable stillness needs Step 5 help: longer dwell ranges,
  a post-interaction pause, or lower guest focusChance.
- Data tricks to remember: front-of-house staff spots carry 'back-of-house'
  so guests cannot reserve them; queue slots were sealed away from the staff
  park spot via floor tileEdges on the counter's north side.
```

## Step 2 - PERF SPIKE (the spectacle lives or dies here)

The whole product IS the crowd, so numbers come early:

```
npm run test:npc-scale      # harness already clones layout to 11 floors
```

Fill the table (adjust perFloor scenarios to [25, 50, 75, 100]):

| Scenario | tick ms avg/max | notes |
| -------- | --------------- | ----- |
| 11 x 25  | 0.422 / 3.275   | 0 spikes > 8ms |
| 11 x 50  | 0.938 / 5.696   | 0 spikes > 8ms |
| 11 x 75  | 1.522 / 10.297  | 1 spike > 8ms (0.06% of ticks) |
| 11 x 100 | 2.278 / 8.170   | p99 5.095ms, 1 spike > 8ms (0.06%) |

Decision rules:

- tick <= 6ms at target -> simulate every floor simultaneously (best show).
- over budget -> viewed-floor full simulation + others idle-shimmer,
  or lower per-floor cap. Decide BEFORE authoring content.

Answer here:

```
Q1 all-floors simultaneous viable? YES
Q2 chosen strategy + knobs: simulate every floor simultaneously at 60tps.
   Worst tier (11x100 = 1100 agents) averages 2.3ms/tick, p99 5.1ms, max 8.2ms
   with a single >8ms outlier in 1800 samples - far inside the 16.7ms frame.
   Existing knobs stay as safety valves: FRAME_SIM_BUDGET_MS=6 +
   MAX_SIMULATION_STEPS=8 throttle per frame in useNpcSimulationCore.ts;
   MAX_ROLE_SPAWN_COUNT=100 caps per-floor population. Wander selection is the
   top selector cost (~65% of selector time) - first place to look if budgets
   tighten after content authoring.
```

## Step 3 - Continental Asset Set (need-driven)


Create each via Draw Object or SVG import; badge must stay non-yellow.

Editor polish happens HERE driven by authoring friction (add notes below):

```
Authored set (24 assets) via scripts/build-hotel.mjs: bar-counter,
potted-plant, wardrobe, massage-table, indoor-pool, elevator(portal) plus
the pre-existing furniture line. All follow the SVG v2 color convention.
Authoring friction notes:
- interactSpots on blocked tiles snap by ring-scan order, not true distance:
  furniture crossing a corridor rib severs it into orphan stubs that steal
  spot bindings. build-hotel.mjs now throws at author time when a placement
  overlaps a rib column.
- Asset tags drive BOTH spawn rules and cross-floor purpose: tag narrowly
  (vending-machine is lounge, not bar; only the treadmill carries gym).
```

## Step 4 - Author 11 Floors (content pass)

DONE via `npm run build:hotel` (idempotent generator = the floor authoring
tool). G lobby/check-in, 1 dining, 2 lounge, 3 gym, 4 spa, 5 pool,
6-9 guest rooms with a corridor walkable system (hall rows 18-19 plus rib
columns 7..52; rooms/baths strictly between ribs), 10 staff laundry
(housekeepers only). Elevator portal mesh: one elevator per floor at
x=1330 so every floor reaches every other floor. One spawn zone per floor
near the shaft / entrance. Regression-guarded by tests/test-hotel-layout.ts
(connectivity BFS over interaction targets, full portal mesh, spawn gates,
seeded live engine smoke).

## Step 5 - Crowd Tuning

Deploy full population per step 2 decision. Tune until it FEELS calm:

| Knob                                | File                    | Feel lever               |
| ----------------------------------- | ----------------------- | ------------------------ |
| ticksPerSecond (60)                 | engine/npc/config.ts    | overall pace of life     |
| config.speed per role               | NPC Manager deploy      | staff brisk, guests slow |
| interact durationMin/Max            | asset interact config   | how long people linger   |
| MAX_SIMULATION_STEPS / FRAME_BUDGET | useNpcSimulationCore.ts | smoothness under load    |

Findings (scripts/observe-hotel.ts, seeded mulberry32, 600s sim, 175 agents):

```
Status mix: walking 46.8% / idle 35.8% / interacting 16.9% / waiting 0.4%.
Cross-floor travels sampled across 12 distinct pairs (G<->1, spa->pool,
gym->G, even guest drift 8->7): elevators carry purpose, not chaos.
Staff confinement verified after tag retune: bartenders only G/2 where bar
counters live, trainers only 3 (treadmill), housekeepers only 10 at spawn,
therapists legitimately follow pools/spa across 4<->5 because the engine
routes focused roles to their tag content on other floors (npcEngine
chooseTarget cross-floor path + allowedRoleIds gate).
No knob changes needed this pass: stillness share (35.8%) already reads as
calm while interaction density keeps rooms occupied.
```

## Step 6 - Presentation Pass (small, high-value)

- Title/footer already says "Continental" - keep.
- Editor entry replaced with quiet gear icon top-right (GameLayout.vue).
- Floor chip added to HotelCanvas: current floor letter + live occupant count.
- Optional later: subtle vignette overlay (CSS radial-gradient), day/night
  tint toggle. Skip unless bored - do not decorate past usefulness.

## Completion Criteria

- [x] Step 1 findings recorded - zero unbelievable behaviors open
- [x] Step 2 table filled, strategy locked
- [x] 11 floors authored, no yellow badges
- [x] Full crowd runs smoothly per step 2 decision
- [ ] 10-minute watch test passes (subjective, but write one sentence why)
- [x] npm run verify green, npm run build green

Watch test draft sentence (pending a human 10-minute viewing): guests drift
between lounge, dining, gym, spa and pool via the elevator while staff hold
their stations and housekeepers work the upper floors, and the status mix
(47% walking, 36% still, 17% interacting, near-zero queue contention) reads
as calm, expensive routine.
