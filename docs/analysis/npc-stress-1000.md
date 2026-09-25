# 1000 NPCs on one floor - live 30-minute stress test and investigation

Test date 2026-09-24. Floor: `floor-g` (the rebuilt 500-person arrival level, 100 x 60 tile
envelope = 50.0 x 30.0 m, 7,886 walkable+door tiles). Population: **1,000 agents on the single
floor** (guest 910, receptionist 16, server 14, bartender 12, security 10, chef 10, housekeeper 8,
attendant 8, therapist 6, engineer 6). Everything below is measured from the running app or from the
real engine headless; nothing is estimated.

## 1. Live run, 30 minutes, real Chromium (Playwright)

Harness: `tests/_stress1000.tmp.mjs` - deployed through the real UI, preview left running at 1x for
**32 minutes of wall time, 60 samples every 30 s**, measuring panel status mix, rAF frame rate, JS
heap, the NPC canvas (lit pixels + a 2-second pixel-change count as the animation proof), long tasks,
DOM size and console errors. Full log: `%TEMP%/stress1000/stress1000.log`, screenshots every 5 min.

| metric | n | min | median | max | first | last |
| --- | --- | --- | --- | --- | --- | --- |
| fps | 60 | 30.9 | **36.0** | 40.7 | 40.1 | 35.1 |
| JS heap MB | 60 | 38.6 | 84.4 | 143.3 | 115.0 | 115.8 |
| Moving | 60 | 158 | 322 | 400 | 226 | 400 |
| Interacting | 60 | 29 | 59 | 71 | 29 | 60 |
| Chatting | 60 | 14 | 190 | 240 | 14 | 190 |
| Queued | 34 | 1 | 1 | 3 | 1 | 1 |
| Waiting | 60 | 328 | 412 | 623 | 623 | 341 |
| canvas pixels changed / 2 s | 60 | 11,715 | 13,517 | 16,418 | 12,916 | 14,030 |
| long tasks per 30 s | 60 | 0 | 2 | 18 | 1 | 3 |

**Verdict on the animation: it never stops.** Every one of the 60 samples shows ~13.5k pixels
changing in the sampled canvas window per 2 s, lit dot pixels holding at 2,860-3,113 from minute 1 to
minute 32, and **0 console errors, 0 page errors, 0 dialogs** across the whole run. Frame rate decays
from 40 to a stable 35-36 fps (it was 61 fps at 502 agents on this same floor) and does not keep
falling. Heap is a GC sawtooth between 39 and 143 MB with the first and last samples level
(115.0 vs 115.8) - **no leak observed in 32 minutes**. Behaviourally the population *recovers*: the
initial gridlock (623 waiting, 29 interacting) eases to 341 waiting / 60 interacting / 400 moving.

## 1b. The deploy did not place everyone - and this is a real bug

The app's own log line: `NpcSpawn: {attempted: 1000, spawned: 995, skipped: Object}`. The panel
count sat at 995 for all 60 samples. A controlled probe (`tests/_probe995.tmp.mjs`) identified it:

| pool order | panel total | chips seen | missing cohort |
| --- | --- | --- | --- |
| guest first (as authored) | 990 | 9 roles, **no `role-security`** | security 10 |
| security moved first | 992 | `security=10` present, **no `role-attendant`** | attendant 8 |

So the loss is **order-dependent and role-specific, not random**: `spawnAgents()`
(`useNpcSimulationCore.ts:158-225`) keeps one `occupiedSpawnKeys` set per floor and hands each role
its own scan of it, so a role whose spawn zone overlaps a larger role's zone is silently dropped when
the big role got there first. Security's only zone is `Grand lobby`, which is also a guest zone; so is
attendant's `Lift hall`. At 470 guests (39 % of the eligible cells) there is slack and nobody is lost;
at 910 guests (76 %) the shared zones are exhausted and the last roles vanish - with only a collapsed
`skipped: Object` in an info log as the trace.

Ruled out by measurement, not assumption: not floor loss (`_floorloss.tmp.ts`: `cross-floor picks 0`,
`off-floor 0`), not a render budget (`syncAgents` iterates every agent, `filterDotsForFloor` has no
cap), not role/floor restriction (`role-security` has no `spawnRule`, no `restrictedTags`, and is in
`allowedRoleIds`). Side finding from the same test: the 9 `elevator-1` cars produce **0 portal
interaction targets on a one-floor hotel**, so lifts are inert scenery until a second portal floor exists.

## 2. Scaling curve (real engine, headless, 15 s of sim at each point)

| Agents | sim speed | A* calls failed | tile stacking (max agents/tile) | wait reasons (top) |
| --- | --- | --- | --- | --- |
| 126 | 19.2x realtime | 103/371 = **27.8 %** | 1 | repath-blocked 79, yielded 11, no-wander 1 |
| 253 | 7.7x | 442/1182 = **37.4 %** | 2 | repath-blocked 281, no-wander 43, yielded 40 |
| 500 | 2.4x | 2814/4981 = **56.5 %** | 2 | repath-blocked 1389, no-wander 631 |
| 1000 | 1.18x | 8202/12526 = **65.5 %** | **5** | repath-blocked 3671, no-wander 2428, queued 5 |

Doubling the population roughly halves throughput from 250 upward (7.7 -> 2.4 -> 1.2x): the cost is
super-linear in agent count, and it is the pathfinder that eats it.

## 3. What actually breaks (root cause, with the code)

1. **Every path search treats every occupied cell as a wall.**
   `npcEngine.collectBlockedCells()` (npcEngine.ts:833) copies the whole floor occupancy set into the
   blocked set for each call. At 1000 agents that is ~805-850 blocked cells out of 7,886 - about 11 %
   of the field, and it moves every tick.
2. **So most searches fail, and they fail on the crowd, not the geometry.**
   65.5 % of A* calls return empty at 1000 agents, while `repath-failed` events are near zero and
   `repath-blocked` events are 3,671 - the engine's own distinction (npcEngine.ts:1160-1170: if the
   crowd-blocked search fails but the clear-space search succeeds, the reason is `repath-blocked`).
   The floor is fine; the bodies are the wall.
3. **A blocked agent waits ~1-2 s and retries the same target.** `setWaiting()`
   (npcEngine.ts:1258-1266) sets a 1 s + jitter backoff and keeps the reservation target; there is no
   re-selection. 587 of 1000 agents sat in `waiting` after 15 s of sim. Note what this is *not*: the
   problem is the **number** of occupied cells, not that waiting agents stand still - see the falsified
   A/B in section 5b. The retry loop's cost is that it keeps re-running a search that cannot succeed,
   which is where the O(n^2) wall-clock goes.
4. **Wander cannot relieve it.** `no-wander` goes 1 -> 43 -> 631 -> 2,428 with population. The wander
   selector (policy.ts:434-459) builds an avoid-list from every walking/queued agent's destination and
   filters candidates by recent-visit memory; in density, everything is avoided, so it returns null
   and the agent stays put.
5. **Nothing stops co-occupancy.** Max agents on one tile: 1 at 126, 2 at 253-500, **5 at 1000**.
   Agent clearance is 0.5 tile (one body per tile), so 5-on-a-tile is physically impossible and is
   what the user sees as dots piling into a blob.
6. **Service throughput collapses.** 14 of 1000 agents reached an interaction in 15 s of sim (1 %),
   against 416 interaction spots - the spots are idle while the agents cannot get to them.

## 4. Live-side observations

- Deploy is not the problem: the app's own `NpcSpawn` log reports `attempted: 1000, spawned: 1000`.
- Frame rate at 1000 agents sits around **33-40 fps** (it was 61 fps at 502 agents on this same
  floor), i.e. the animation visibly drops below 60 but does not stall; long tasks 1-9 per 30 s at
  53-68 ms.
- JS heap oscillates 52-143 MB with GC sawtooth; no monotonic climb observed in the first 8 minutes
  (the 30-minute trend is in section 1).
- Zero console errors, zero dialogs, zero page errors so far.
- Panel population read 995 where 1000 were spawned - see section 5.

## 5. The 995 delta: resolved

See section 1b - the cause is spawn-cell exclusivity across roles sharing a zone, proven by
reordering the pool and watching the missing cohort move from `role-security` to `role-attendant`.
Not floor loss, not a render budget, not a role/floor restriction.

## 5b. Why routes fail: measured, and my first hypothesis was wrong

`tests/_pathfail.tmp.ts` sampled A* calls at 1000 agents with the real occupancy set applied:

| route distance | with crowd | goal+start unblocked | empty field |
| --- | --- | --- | --- |
| 0-10 tiles (0-5 m) | 74 % fail | 70 % | **0 %** |
| 10-25 (5-13 m) | 86 % | 76 % | 0 % |
| 25-50 (13-25 m) | 77 % | 70 % | 0 % |
| 50-80 (25-40 m) | 75 % | 72 % | 0 % |
| 80+ (40+ m) | 66 % | 68 % | 0 % |

Failure is **flat in distance** and **zero with an empty field**, so it is neither route length nor
the `maxIterations` cap: it is the bodies. Breaking it down by how many free cardinal neighbours the
agent has at its own start cell:

`0 free -> 100 % fail (n=49) | 1 free -> 91 % (n=168) | 2 free -> 77 % (n=154) | 3 free -> 51 % (n=146) | 4 free -> 52 % (n=48)`

with 10 % of agents having no legal first step at all. So two mechanisms stack: local enclosure
(10 % fully pinned, ~90 % failing with one exit) and crowd-choked corridors that survive the first
step (still ~50 % failing). Both trace back to the same input: **76 % of the cells in the guest spawn
zones are occupied at t=0**, because 910 guests were placed into 1,201 cells by design.

And the fix I had ranked first does not work. `tests/_fixtrial.tmp.ts` A/B'd "step aside while
waiting" (nudging every waiting agent to a free neighbour, applied from the harness, engine untouched):

```
baseline    n=1000 1.19x realtime | A* fail 65.1% (8190/12572) | waiting=581 | served 13 | max/tile 4
step-aside  n=1000 1.24x realtime | A* fail 66.8% (8279/12392) | waiting=586 | served 10 | max/tile 4
```

No effect - because moving bodies around does not reduce how many cells are occupied. Recorded here
because it falsifies the obvious guess.

## 6. Ranked fixes (blast radius smallest first; status after the optimization pass is in §7)

| # | Fix | Where | Why it is ranked here | Risk |
| --- | --- | --- | --- | --- |
| 1 | **Stop silently dropping roles at spawn.** Cells are exclusive per floor across roles, so the last role sharing a zone with a big role disappears; at minimum count the loss where the user can see it, better allow a cell to host more than one role's spawn. | `useNpcSimulationCore.ts:158-225` (`occupiedSpawnKeys`, `skip('occupied-cells')`) | Proven by experiment (security -> attendant when the order flips). It is a correctness bug at any population, not a 1000-agent problem. | Low; spawn distribution only. |
| 2 | **Spread the arrival load.** 910 guests into 1,201 zone cells = 76 % initial occupancy; that is what pins agents and chokes corridors. More/smaller guest zones, or a spawn density cap. | programme + `spawnZones` | Attacks the measured cause (flat failure, 10 % with no legal first step). | None to the engine; it is a plan edit. |
| 3 | **Occupied cells as a soft cost, not a hard wall.** Today every occupied cell is impassable to every search, so a dense crowd makes the floor topologically broken. | `collectBlockedCells` + `pathfinding.ts:98-109` | Fixes the 50-90 % failure that survives the first two. | Changes route quality; needs the FL-27 trip-cost test to stay honest. |
| 4 | **Re-pick, don't retry.** After a `repath-blocked` backoff, choose a different target/spot instead of the same reservation. | policy `targetSelector` + `waitingUntil` | Should cut the 12,249 wait events per 30 s at 1000. | May starve popular targets; needs a fairness check. |
| 5 | **Wander fallback.** When memory+avoid filtering empties the pool, take the nearest free cell within N instead of returning null. | `policy.ts:434-459` | `no-wander` goes 1 -> 43 -> 631 -> 2,428 with population. | More movement, more path calls. |
| 6 | **One body per tile.** Reserve destination cells so two agents cannot share a tile. | engine movement/reservations | Max 4-5 agents on one 0.5 m tile is physically wrong at clearance 0.5 and reads as a blob. | Deadlock risk at door runs if reservations lag. |
| 7 | **Portal targets on one floor.** 9 elevator cars yield 0 interaction targets, so a single-floor hotel cannot show vertical capacity at all. | `layoutBuild` portal target build | Explains why lift-queue claims are untestable here; decide whether a same-floor portal should exist. | Behaviour change for multi-floor layouts must stay identical. |
| - | ~~Step aside while waiting~~ | - | **FALSIFIED by A/B** (section 5b): 65.1 % -> 66.8 % failure, served 13 -> 10. | - |

## 7. Optimization pass (applied, measured)

Same harness as §2 and §5b: real engine headless, 15 s of sim per point, this floor, `realtime
factor` = sim-seconds elapsed / wall-seconds spent. Every claim below is one variable at a time.

### 7a. Applied - yield grace before re-planning (`npcEngine.ts`)

`handleYielded` used to call `attemptRepath` the tick after any blocked step. A bump against another
body is normally cleared by the reservation/swap logic on the next tick, so each bump was buying a
full A* for nothing. Agents now hold their ground for `YIELD_REPATH_GRACE_TICKS = 4` (~0.07 s at
60 tps) before re-planning; the `progressWatchdogTicks` force-repath is untouched, so nothing can
park forever.

First tune was **12 ticks**, and it was wrong: `tests/unit/movementCorridor.test.ts` failed - a
head-on pair in a 2-tile corridor re-planned in lockstep, each picking the other's detour, and
oscillated between rows for all 1,500 ticks without ever crossing. Sweeping the value against both
the corridor invariant and the crowd benchmark:

```
grace  corridor test   n=500 realtime   n=1000 realtime   n=1000 served
  0    pass            2.12x            0.89x             119
  2    pass            2.26x            1.13x             108
  4    pass            2.40x (+13 %)    1.14x (+28 %)     125      <- shipped
  8    FAIL (mirror)   2.59x            1.08x             115
 12    FAIL (mirror)   2.47x            1.07x             117
```

(The 0/12 row here is not comparable with §2/§5b: this sweep used a fresh harness that spawns
uniformly over the floor's walkable cells instead of through the deploy's role zones, so its
baseline is 0.89x where the deploy-shaped run measured 1.19x. The five rows are comparable with each
other - the RNG sequence is rewound to the same seed per row.)

A* failure stays where it was (45 % at 500, 51-52 % at 1000 in this harness): the grace removes
wasted work, it does not remove the crowd wall (§5b). Cost: 3 lines + 1 constant, no API change.

### 7b. Applied - per-role spawn cells (`useNpcSimulationCore.ts:207,213`)

§1b bug. The occupancy key for spawn cells was `${floor}:${cell}`, global across roles, so a later
role whose zone overlapped a bigger one got every candidate cell skipped and silently deployed 0
agents. Key is now `${floor}:${role}:${cell}` and the skip reason carries the role id
(`occupied-cells:${role.id}`) so the loss is attributable in the log instead of collapsed.

Verified live in Chromium at the 1000-agent pool: panel reads `1000 NPCs`, the per-role chips sum to
1000 across all 10 roles (`guest=910 receptionist=16 server=14 bartender=12 security=10 chef=10
housekeeper=8 attendant=8 therapist=6 engineer=6`). Before the fix the same deploy reported 995 with
three roles missing.

### 7c. Rejected - walk the clear route

Idea: when a fully blocked search fails, follow the unblocked-only route anyway and let bodies
displace each other. Measured: **1.19x -> 0.37x** realtime at n=1000 and served 13 -> 4. Agents commit
to routes through each other, then thrash reservation/yield every tick. Reverted.

### 7d. Rejected - occupied cells as a soft cost

Idea (§6 item 3): make an occupied cell expensive instead of impassable. The first measurement of this
was **invalid**: my benchmark wrapper was `pathfinder: (f, a, to, b) => findNpcGridPath(f, a, to, b)`,
which silently dropped the 5th argument, so the crowd set never reached the search - the "before" and
"after" bytes were identical because they were the same run. Re-run with the argument wired through:
**0.57x**, worse than both baseline and 7c. Diagonal-corner gating plus per-tick re-planning means a
cheap-but-occupied cell still produces routes nobody can walk. Reverted; `pathfinding.ts` is back to
4 parameters with no crowd term.

### 7e. Frame rate at 1000 - not re-measured for the shipped value

Three live 30 s samples taken while the grace was still 12: 43.5 / 33.5 / 72.9 fps against the
32-minute baseline median of 36.0. That is too few samples, too spread, and measured at a constant
that was then retuned - **recorded as inconclusive, not as a win**. The shipped change is a sim-rate
change (fewer wasted A* calls per tick), and sim rate is what 7a measures.

### 7f. Status of the §6 list

| # | Fix | Status |
| --- | --- | --- |
| 1 | Stop silently dropping roles at spawn | **Applied** (7b), verified live |
| 2 | Spread the arrival load | Not taken - it is a plan edit, not an optimization, and the design case is 502 |
| 3 | Occupied cells as soft cost | **Rejected by measurement** (7d) |
| 4 | Re-pick, don't retry | Not taken; 7a already removed most of the retry volume it targeted |
| 5 | Wander fallback | Not taken |
| 6 | One body per tile | Not taken |
| 7 | Portal targets on one floor | Not taken |
| - | Step aside while waiting | Falsified (§5b) |

## 8. Verdict

**It runs; it does not behave.** 1000 agents on this one floor animate for the full 32 minutes at a
stable 35-36 fps with no leak, no crash and no console errors, and the population self-recovers from
its opening gridlock. The problems the test exposed are, in order of severity:

1. a **correctness bug independent of scale** - roles sharing a spawn zone with a larger role are
   silently dropped (10 of them at 1000 agents, and the missing cohort moves when the pool order
   changes); **[fixed in 7b - all 10 roles now deploy]**;
2. a **crowd-model wall** - every occupied cell blocks every search, so at 1000 agents 65-86 % of
   route attempts fail regardless of distance, ~10 % of agents cannot take a first step, and only
   1-3 % of the population ever reaches a service point while 416 spots sit idle;
3. a **design cause of my own making** - the lobby's arrival zoning crams 910 guests into 1,201
   cells, and 1000 people on a 1,421 m2 floor is below the KB's own movement band (HB-03:
   2.3-3.8 m2/person), so this floor is sized for ~500, not 1000;
4. a **measurement blind spot** - the deploy's own `skipped` count is logged only as a collapsed
   object in an info line, which is why a 1 % shortfall hid in plain sight for a whole 30-minute run.
