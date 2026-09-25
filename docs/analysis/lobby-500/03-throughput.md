# 500-live-in-lobby standard: throughput / human behaviour / failure

Scope read (authoritative here): `architecture-skill/SKILL.md` §Design Workflow (108-215),
§Circulation (304-336), §Validation (697-778), §Failure Detection (779-807);
`research/human-behavior.md` (HB-01…HB-26 + proxy table), `research/failure-patterns.md`
(FL-01, FL-02, FL-17, FL-26, FL-27), `research/operations-maintenance.md` (OM-16, …),
`research/validation.md`, `research/environmental-design.md`. No app code read.

Labels: **FACT** = KB rule ID + source. **INF** = my arithmetic on a KB number + host constants.
`not in the KB (read scope)` = searched the six files, absent — do not invent.
Grid: 1 tile = 0.5 m, 1 tile² = 0.25 m², 4 tiles/m². `tiles/person = m²/person × 4`.

Host constants used for INF: `reception-desk` 8×1 tiles, 6 spots, capacity 4, 5-12 s (mean 8.5 s);
`bar-counter` 4×1, 5 spots, capacity 3, 4-10 s (mean 7 s); `elevator-1` 2×2, 4 spots, capacity 4,
1-3 s (mean 2 s) + 30 s cross-floor cooldown; queue `maxMembers` 3 (reception 4),
`admissionDepth` 4 tiles; agent clearance 0.5 tile; 1-tile corridor = strict single file.

**Headline (the standard in one block, all derivations below)** — 500 live people need, from KB numbers:
**2,400-4,000 walkable tiles (600-1,000 m²) of lobby volume** (HB-01 4.8 tiles/p standing minimum,
HB-03 8 tiles/p movement); **2-3 reception desks with ~200 tiles of reserved queue pocket each**
(HB-10 `λWq`, OM-16 ρ ≤ 0.9); **2-3 bar counters, 16 tiles of plan each** (HB-20 frontage);
**3 lift portals minimum** (FL-17 HC 11-13 %/5 min + wait ≤ 60 s; OM-16 ρ ≤ 0.9; FL-08 single portal =
Critical) with **≈ 275 tiles of lift-lobby standing** (HB-11 comfort 2.2 tiles/p, code floor 140 tiles);
**≈ 175 seats = 1,050 tiles** at ≥ 50 % in facing clusters (HB-22 + HB-12 d); **≥ 3 exit groups totalling
10 tiles of egress width** (FL-26 500 mm/100 p) with every door to a >80-capacity space ≥ 4 tiles
(HB-24); **guest WC count = data gap in the read scope**; plus bell desk 32-80 tiles, service lift lobby
24-48 tiles and **300-600 tiles of F&B BOH** that must not cross the lobby (OM-26 Hotels register).
The 3/10 score is consistent with the arithmetic: a lobby that cannot hold 2,400 tiles of standing or 3
portals is a **programme/massing failure (SKILL.md gate 1 + 3), not a furniture shortage**, and the check
that would have caught it is **FL-27's loaded re-run (Tier 4)**, not a visual pass.

---

## 0. The density floor: what "500 people in the lobby" costs in tiles

- FACT HB-01 (FHWA/HCM walkway LOS, T1): A ≥ 12 m²/ped, B 3.7-12, C 2.2-3.7, D 1.4-2.2, E 0.6-1.4,
  F ≤ 0.6 m²/ped; **primary circulation must be ≥ LOS D (≥ 5.6 tiles/person)** at design flow;
  **rooms intended for standing/waiting ≥ 4.8 tiles/person** (queue LOS A = 1.21 m²); no
  continuously-moving region ≤ 1 tile/person.
- FACT HB-03 (MSC.1/Circ.1238, T1): design ceiling **0.5 p/m² = 8 tiles/person** for movement space;
  speed collapses toward zero at 3.2-3.5 p/m². Flag at ≤ 4 tiles/person (1 p/m²) as speed-degraded.
- FACT HB-20 (Küpper & Seyfried 2023 + FHWA Table 21 + MSC): waiting people hold **1.0-1.2 m**
  spacing regardless of density → queue lane **2 tiles abreast per person, 1.5-2 tiles deep in line**;
  **1 tile/person = packed = a failure state, not a design state**; comfortable standing ≈ 5 tiles/person;
  the file explicitly corrects "2-4 tiles/person is comfortable" → that is LOS E/F.
- FACT HB-22 (activity bands, `HEURISTIC` mapping / `FACT` areas): seated-with-desks 12 tiles/p (3 m²),
  **seated lounge 6 tiles/p (1.5 m²)**, **standing reception 3 tiles/p (0.75 m²)**,
  dense queue 2 tiles/p (0.5 m²), circulation-adjacent standing 2 tiles/p.
- INF (500 persons, no fixtures counted):
  | Basis | tiles/person | tiles for 500 | m² |
  |---|---|---|---|
  | packed queue floor (HB-20 failure state) | 1 | 500 | 125 |
  | HB-22 dense queue | 2 | 1,000 | 250 |
  | HB-22 standing reception | 3 | 1,500 | 375 |
  | HB-01 standing/waiting minimum (queue LOS A) | 4.8 | 2,400 | 600 |
  | HB-03 movement ceiling for a *walking* lobby | 8 | 4,000 | 1,000 |
  A 500-person lobby is therefore a **600-1,000 m² (2,400-4,000 tile) programme line before any desk,
  seat or planter deduction** (HB-22 exception: "fixtures and circulation must be deducted from
  usable_walkable_tiles first, or capacity is over-stated"). On a typical hotel plate this is itself the
  first finding: if the authored floor's walkable lobby tiles are < 2,400, the brief is arithmetically
  unsatisfiable and the fix is plate/floor count, not furniture (SKILL.md pre-geometry gate 1, 3).
- FACT HB-10 (c): assert `queue_tiles ≥ arrival_rate × mean_service_time × q` with **q = 4 tiles/person
  design, q = 1 never as a design value**; report `queue_spill_tiles = required − provided = 0`.

---

## 1. Service-queue arithmetic per fixture type

### 1.1 The numbers the KB actually publishes (FACT)
- **Wait ceiling at a portal: `wait > 60 s` at peak = FAIL** — FL-17 detection.
- **`pct_wait_over_90s` and `average_wait` per portal must be inside project targets** — HB-13 (c):
  the target number itself is *declared by the project*, the 90 s reporting threshold is the KB's.
- **Utilisation ceiling: `utilisation = demand/capacity`; refuse `utilisation > 0.9`** — OM-16 (FACT,
  class FACT, source Peters Research lift-simulation paper T3). This is the KB's only explicit ceiling.
- **Queues are a step function, not a curve** — OM-16 worked example: 5-min handling capacity
  **14 % → 20.6 s** mean wait, **15 % → 38.9 s**, **16 % → 85.8 s**, while departure interval barely
  moved (33.3 → 34.3 s). Consequence FACT: designing at the nominal capacity is designing at saturation.
- **Little's law is the mandated method** — HB-10 (c), HB-13 (`L = λW`, W = waiting + riding + boarding +
  walk to portal door).
- **Queue psychology bounds (HB-12, HEURISTIC, with two named null results)**: occupied waits feel
  shorter; sightline from the waiting pocket to the service point must be unobstructed
  (`progress_visible`); **≥ 1 amenity fixture per 8 waiting tiles** at high-wait points; one feeder line
  serving n counters, never n visible unequal parallel lanes; **`group_seating_share ≥ 0.5` in
  hospitality** (seats in clusters of ≥ 2 facing each other). Explicit non-claims: queue *length* had no
  measured effect on stress (30 participants) and wait-time estimates did not move satisfaction
  (n = 100, p = 0.476) — so do not size anything off "looks short" (HB-26).
- **Flow per width (HB-02, T1)**: `required_width_tiles = ceil(peak_persons_per_min / 39)` level,
  / 33 stair down, / 26 stair up; **min door run 2 tiles wherever flow > 30 p/min**; 1-tile door cannot
  carry the corridor feeding it.
- **Arrivals per hour — what the read scope actually contains**:
  (a) **FACT FL-17**: hotel peak `persons_in = rooms × 0.5` **in the busiest 5 minutes** ≡
  **rooms × 6 per hour** at the peak window (equivalence is my arithmetic, INF); labelled "our heuristic",
  Confidence Medium, traffic arithmetic attributed to CIBSE Guide D.
  (b) **FACT HB-13**: the other hotel profile is `rooms × 2 guests × checkout_departure_share` per peak
  minute — the share is a *declared* input, not a published number.
  (c) **FACT OM-10 / OM-16 (service side)**: dock positions = `peak trucks per hour × turnaround hours
  per truck`, rounded up, + 1 for refuse; the same worked standard shows **daily mean 4 positions vs
  4-hour peak 7** — i.e. the KB's own pattern is "size the resource on the peak window, ~1.75× the mean".
  **There is no guest arrivals-per-hour table for a hotel lobby in the read scope** (guest arrival profiles
  are in `building-codes.md`/`floor-plans.md`/`space-programming.md`, all out of scope), so SKILL.md gate 3
  applies: the agent declares the profile, names it in the report, and tests sensitivity (HB-26).
- **Not in the KB (read scope)**: minutes-per-guest check-in, drinks-per-customer at a bar, arrivals per
  hour for a hotel guest, acceptable queue length in persons per fixture type. The only hotel arrivals number
  in scope is FL-17's **`persons_in = rooms × 0.5` at checkout peak**, self-labelled "our heuristic"
  (Confidence Medium). Anything else must be declared as an assumption (SKILL.md gate 3: "the host has
  no time dimension, so the arrival profile and trip rates are inputs the agent declares — name them and
  test the conclusion's sensitivity").

### 1.2 The arrival profile I declare (INF input, flagged as assumption)
SKILL.md gate 3 requires the profile be named, not hidden. Declared, for a 500-live lobby:
- Concurrent lobby population N = 500 (the user's brief).
- Lobby dwell split (HB-22 activity bands, my allocation): 40 % checking in/out with luggage (200),
  25 % crossing to lifts (125), 20 % bar/lounge dwell (100), 15 % waiting seated/standing (75).
- Peak arrival rate at the desk: λ_desk = N_arrivals/peak_window. Using FL-17's hotel shape
  (rooms × 0.5 in the busiest 5 min): for a 500-guest hotel 250 arrivals/5 min = **50 p/min**.
  Sensitivity: at λ = 25 p/min and λ = 75 p/min the desk counts below scale linearly.
- Bar: assume 25 % of lobby population orders within 5 min → λ_bar = 125/5 = **25 p/min**.
- Lifts: see §2.

### 1.3 Desk arithmetic (INF on host service times + KB ceilings)
Host `reception-desk`: capacity 4 concurrent, mean duration 8.5 s ⇒ **service rate
μ = 4 / 8.5 s = 28.2 p/min = 1,694 p/h per desk**. With OM-16's ceiling ρ ≤ 0.9:
**λ_max = 25.4 p/min per desk**.
- λ_desk = 50 p/min ⇒ `desks = ceil(50 / 25.4) = 2`. **INF.**
- **Health warning on that number**: it follows from the host's 5-12 s check-in duration, which is ~15×
  faster than real hotel check-in (not in the read scope, so it may not be quoted as a rule). With the
  KB's own *space* arithmetic instead of the host's *time* arithmetic, the binding constraint is the
  queue pocket, not the desk: `queue_persons = λ × W`, and at any W ≥ 60 s (the FL-17 ceiling) λ = 50
  p/min gives **L = 50 waiting persons → 50 × 4 tiles (HB-10 design q) = 200 tiles (50 m²) of contiguous
  queue pocket in front of reception, off the through-route** — **INF**. At HB-20's packed floor of
  2 tiles/person it is still 100 tiles.
- Grid consequence, reception-desk (8×1 tiles, 6 spots, capacity 4):
  - Service depth in front of the counter: **FACT HB-20 (c)** — "for a bank of n abreast service
    positions, aisle-to-counter depth ≥ 3 tiles (1.5 m) so the person being served is not pressed by the
    next in line". So 3 tiles of clear standing immediately along the 8-tile counter face =
    **24 tiles minimum immediately in front**, on the *public* side, never behind.
  - Queue lane width: **2 tiles per person abreast** (HB-20) ⇒ the 6-spot face serves at most 3 lanes
    abreast; 200 tiles of pocket = e.g. **8 tiles wide × 25 tiles deep**, or 2 pockets of 8 × 13.
  - Host `maxMembers = 3` per queue and `admissionDepth = 4 tiles`: 3 persons must stand within 4 tiles
    of the interaction spot ⇒ the *physical* queue holds 3 × (2 tiles abreast) = at least a **2 × 2-tile
    bay in front of each served spot**; the remaining queue persons are unadmitted and become lobby
    standing population, which must still be paid for at §0 rates. **INF from host constants.**
  - HB-10 (a)(b): none of those 200 tiles may lie on a top-decile A* through-route or abut a door run
    such that the standing head blocks it. With the entrance inside 25 tiles of the desk, this pair
    cannot both be satisfied — HB-10's own named symptom: "a beautiful lobby whose only defect is that
    the modeled queue of 12 at the desk runs back through the entrance door and cuts off the amenity
    route".

### 1.4 Bar arithmetic (INF)
Host `bar-counter`: 4×1 tiles, 5 spots, capacity 3, mean 7 s ⇒ μ = 3/7 s = 25.7 p/min, ρ ≤ 0.9 ⇒
λ_max = 23 p/min. λ_bar = 25 p/min ⇒ **ceil(25/23) = 2 bars minimum; 3 at the declared sensitivity top
(λ = 38 p/min)**. Standing wait at the bar: HB-20 governs the *standing fixture* spacing too — 2 tiles
abreast per person along the 4-tile counter face = 2 persons abreast, plus HB-20 (c) ≥ 3 tiles of
aisle-to-counter depth = **12 tiles of clear bar-front standing per counter**, and HB-22's
"standing reception 3 tiles/person" gives 5-6 waiting patrons per bar before it is at capacity.
Grid: a 4×1 bar with 12 tiles of mandatory clear frontage occupies **16 tiles of plan** — one bar per
~100 lobby persons is the geometric statement, independent of the service-time statement. **INF.**

### 1.5 Restroom queueing
See §3 — the read scope has no fixture-per-N ratio for guest WCs; state it as a gap, not a number.

---

## 2. Vertical transport / lift rules (KB numbers)

- **FACT FL-17 (source: CIBSE Guide D *Transition in Buildings*, Elevator World — T1/T2)**: lift traffic
  quality band = **5-minute handling capacity ≥ 11-13 % standard for offices/hotels**.
- **FACT FL-17 detection method**: `persons_in = arrivals in the busiest 5-minute interval`
  (hotel floor: `rooms × 0.5` at checkout, self-declared heuristic);
  **`lobby holding capacity = walkable lobby tiles × 0.2 m²/person standing`** (= 0.8 tiles/person);
  **`portal throughput = portals × 8 persons / cycle`, cycle = 60-90 s**;
  **fail if `queue > lobby capacity` or `wait > 60 s` at peak**; report spill tiles and whether spill
  blocks a door. Severity **Major → Critical when the queue spills onto the egress route**.
- **FACT HB-11 (IBC 2023 §3008.6.4 via UpCodes, T1 — CODE REQUIREMENT)**: the lobby must hold, at
  **3 ft² (0.28 m² = 1.12 tiles) per person, not less than 25 % of the occupant load served**, plus
  **one 760 × 1220 mm (1.5 × 2.4 tile) wheelchair space per 50 persons or portion thereof**.
  Comfort target = **2.2 tiles/person** (Küpper & Seyfried spacing). Grid check: `lobby_waiting_tiles ≥
  ceil(0.25 × floor_occupant_load) × 1.12` (code floor) and × 2.2 (comfort).
  **Boarding zone FACT: "the 1.5-tile-deep band directly in front of each portal door tile is free of any
  other door run, queue pocket or fixture"**; the lobby must not be the sole route to any other room
  (min-cut), so a full lobby does not lock the floor.
  HB-11 exception (directly our case): **"Ground-floor arrival lobbies need far more than the code floor
  because they absorb everyone at once"** — and its named symptom: "each upper-floor lift hall exactly
  4 tiles, and the queue model shows a standing population of 11 at morning peak, with the surplus
  spilling onto the through-route and reducing `effective_width_tiles` mid-simulation".
- **FACT HB-13**: portal = queue, not edge. `peak_arrivals_p_min` from programme (hotel morning:
  `rooms × 2 guests × checkout_departure_share`); `L = λW`, W = waiting + riding + boarding + walk;
  **boarding time = persons_per_car × 1.5 s (HEURISTIC, Confidence Low)**;
  validate **`L ≤ lobby_waiting_tiles / 2.2`**; report `pct_wait_over_90s`, `average_wait`;
  **the vertical trip cost used by A\* must be `walk + wait_equiv + riding_equiv`, never a zero-cost
  portal edge**. Symptom: "an agent stacks 12 floors because the A\* path cost looked flat, and the queue
  diagnostic then shows 40 people in a lobby sized for 9".
- **FACT HB-02**: flow into/out of a portal is capped at the door figure — 39 p/min per tile of door run.
- **FACT OM-16**: **refuse `utilisation > 0.9`**; the 14/15/16 % → 20.6/38.9/85.8 s table.
- **FACT SKILL.md §Circulation**: "size the core against peak demand … treat lift queues as the model of
  vertical congestion (TH-29)"; "never let a floor be reachable by one portal with no alternative"
  (and FL-08 single-portal floor is one of the five always-Critical cases).
- **FACT HB-01**: lift-lobby standing graded on the queue band, ≥ 4.8 tiles/person; HB-03 exception:
  **"a lift lobby that passes the movement test because everyone is counted as 'moving' while standing
  still"** is the named false pass.

**Cars for 500 (INF, host elevator-1 = 4 persons / (2 s mean + 30 s cooldown) = 32 s cycle):**
- Per portal throughput = 4 persons / 32 s = **7.5 p/min = 37.5 persons per 5 min**.
- FL-17's generic figure (8 persons/cycle, 60-90 s) gives 27-40 persons/5 min per portal — same order;
  the host portal is the faster end, so **use 37.5/5 min and check the pessimistic variant**.
- 5-min demand target: 11 % of 500 = 55 persons, 13 % = 65 persons.
- Portals needed = 55 / 37.5 = 1.47 → **2 portals at HC 15 % nominal**; with ρ ≤ 0.9 the usable capacity
  of 2 portals is 67.5 p/5 min = 13.5 % ⇒ **2 portals sit exactly on the 11-13 % band with no reserve;
  3 portals are the recommended answer (HC 22.5 % nominal, ρ-capped 20 %)**.
- **Never 1**: FL-08 (single portal) is always-Critical, and OM-16 says the last 1 % of utilisation costs
  47 s of wait.
- Waiting population at the lift bank: HB-13 with λ = 55 p/5 min = 11 p/min and W at the FL-17 ceiling
  60 s → **L = 11 persons waiting**; at HB-11 comfort 2.2 tiles → **25 tiles of lobby standing**, at the
  4.8-tile LOS-A queue band → **53 tiles**. Code floor for a lobby serving a 500-person floor:
  ceil(0.25 × 500) × 1.12 = **140 tiles**; comfort × 2.2 = **275 tiles**. Because the ground-floor arrival
  lobby "absorbs everyone at once" (HB-11 exception), the design value is the comfort line, not the code
  line: **≈ 275 tiles (69 m²) of lift lobby**, plus **boarding zone 1.5 tiles deep × each portal's door
  run (2 tiles) = 3 tiles per portal = 9 tiles for 3 portals**, plus **3 wheelchair patches of
  1.5 × 2.4 → 2 × 3 = 6 tiles each = 18 tiles** (per 50 persons of the 500 → 10 patches = **60 tiles**;
  this is the code text read literally against a 500-person served load — flag as jurisdiction-dependent,
  never "compliant", VA-04).
- Cross-floor cooldown 30 s (host) is a *portal* resource: 3 portals = 3 independent 32 s cycles; a lift
  queue that exceeds one cycle's intake physically grows by (λ − μ) per 32 s — FL-17's spill check, not a
  rounding issue. **INF.**

---

## 3. Restrooms

- FACT HB-20 scope line: the 1.0-1.2 m spacing rule **"also governs the lateral spacing of standing
  fixtures (counters, bars, urinals, checkouts)"** → 2 tiles abreast per person at a urinal/basin row,
  and HB-20 (c) ≥ 3 tiles aisle-to-fixture depth.
- FACT HB-10: a WC door is a service point that makes people stand → dedicated pocket, off the
  through-route, `queue_tiles ≥ λ × W × 4`.
- FACT HB-24 (confirmed at human-behavior.md:271-277) "never let a door run be the weakest link":
  `door_capacity_p_min = 39 × door_run_tiles`; **`door_run_tiles ≥ 2` at every entrance to a space with
  capacity > 20, and ≥ 4 (two runs plus a 1-tile pier, or one 2 m run) above 80**; the door must not sit
  within **2 tiles of a 90° bend** ("a corner immediately outside a door is where the density peak
  forms"); `min_cut` — **any door run whose removal disconnects > 10 % of occupancy is a single point of
  failure and needs a second run**. Named symptom: "a wide plan with 1-tile doors everywhere, which
  passes the corridor width test and fails HB-02 at every threshold".
- FACT HB-12: waits at a WC entrance are still waits → sightline to the door, ≥ 1 amenity fixture per
  8 waiting tiles, group seating/share for the queue.
- **Not in the KB (read scope)**: any "1 fixture per N people" plumbing ratio, urinal/WC split, and
  average in-stall duration. Those live in `building-codes.md` (e.g. occupant-load/sanitary-factor
  tables), which is **outside the read set given for this task** — the rebuilt floor must therefore take
  the WC fixture count from that file under an explicit instruction, or declare it as an assumption with
  a conservative default (SKILL.md §Requirement Analysis: "Missing information is decided … only when it
  is reversible and local"). Do not let an agent silently invent a ratio (HB-26 gate).
- **FACT OM-22 (NHS HBN 04-01 T1; 29 CFR 1910.141(e) Table J-1 T1)** — the only fixture-per-person
  sanitation ratios inside the read scope, and both are **staff** rules, not guest ones: "**staff WC 1 per
  24 beds (or 1 per 20 lockers)**"; OSHA Table J-1 "**1 water closet for 1-15 persons, 2 for 16-35**".
  KB's own confidence note: "Medium on transferring NHS unit rates to hotels and offices".
- **INF (WC sized as a queue on in-scope mechanics only)**: 500 live x 50 % making one WC trip inside a
  declared 2 h lobby stay = 250 trips, so λ = 2.1 p/min; stalls = λ x T_stall / ρ with OM-16's
  **ρ ≤ 0.9** and **T_stall = 3 min declared as my assumption** = **≈ 7 stalls**; entry pocket =
  λ x W x 4 tiles (HB-10 design q) for the ~5 waiting persons at the ρ = 0.9 ceiling =
  **≥ 20 contiguous tiles off the through-route**; door runs ≥ 2 tiles, ≥ 4 if the anteroom capacity > 80
  (HB-24); 2 tiles abreast + 3 tiles aisle depth at the fixture row (HB-20).
- **INF staff side (OM-22 unit allowances, ~12 staff on shift)**: 1 WC per 20 lockers;
  lockers = 2 x ceil(12 x 1.1) = 26; locker bay 6 tiles/12 lockers = 12 tiles; changing ≥ 5.6
  tiles/locker = ~146 tiles; rest ≥ 7.2 tiles/seat = ~86 tiles — and OM-22's grid check bans that circuit
  from any `public`-tagged tile or `portal_guest`.
- WC queues are charged to §0's standing budget; they are never "spare corridor".

---

## 3b. Doors and exits at a 500-person lobby (FACT HB-24 + HB-02 + FL-26, with INF totals)

- INF on HB-02: a lobby with 500 live people and a 5-min arrival/departure pulse of 50 p/min needs
  `ceil(50 / 39) = 2` tiles of door run **per direction** at the front door — but HB-24's capacity rule
  binds harder: **any entrance to a space with capacity > 80 needs a 4-tile run** (two 2-tile runs plus a
  1-tile pier, or one 2 m leaf line), so the main entrance is **≥ 4 tiles, in practice two 2-tile runs
  with a pier**, and the ≥ 3-tile figure is what FL-02's prevention line calls for on lobby doors.
- INF on FL-26: 500 persons x 500 mm per 100 persons (level egress, the KB's stated assumption) =
  **2,500 mm = 5 m = 10 tiles of continuous egress width** leaving the floor. Ten tiles cannot be one
  10-tile door and stay legal on the `min_cut` test (HB-24 d): **split into ≥ 3 exit groups, each ≥ 3
  tiles, remote from each other**, none of them a queue pocket's only outlet.
- FACT HB-24 (c): no door within 2 tiles of a 90° bend — at 500 people the density peak forms exactly at
  that outside corner (HB-05's bend tax), so the entrance, the lift lobby doors and the WC doors must all
  clear the corner by ≥ 2 tiles of straight run.
- FACT HB-10 (b): no queue pocket may abut a door run such that the standing head blocks the run — which
  is the arithmetic reason the reception pocket (≈ 200 tiles) and the front door's 10 tiles of egress
  cannot share the same 4-tile-wide strip.

---

## 3c. Environmental load of 500 live bodies (FACT EN-18 / EN-19, with INF)

- FACT EN-18 (EN 15251 via REHVA Journal, T1/T3): ventilation rates run **2.5-7 L/s per person**, PMV
  operative bands 20-24 °C winter / 23-26 °C summer; the target table must carry
  `vent_Ls_person` **and occupancy density** per room type *before* rooms are placed — "a room whose
  target is met by the façade it happens to get was not designed, it got lucky".
- **INF**: 500 persons x 2.5-7 L/s = **1,250-3,500 L/s (1.25-3.5 m³/s) of outdoor air** for the lobby
  alone. The KB explicitly does *not* supply ASHRAE 62.1 per-type rates: "ASHRAE 62.1 per-type
  ventilation rates: deliberately absent" (environmental-design.md:395) — so no better figure may be
  quoted. Grid consequence: that air has to be ducted, and EN-21 requires the **service band + riser grid
  reserved before rooms are placed**, "because every environmental gap becomes ductwork". A 500-person
  lobby with no ceiling plausibility for 3.5 m³/s is an undeclared mechanical claim.
- FACT EN-19: if natural or hybrid ventilation is claimed, openable area ≥ **5 % of floor area** (10 %
  where air is borrowed). **INF**: at §0's 600-1,000 m² lobby that is **30-100 m² (120-400 tiles) of
  openable façade** — check it against EN-06's glazed-run budget and EN-12's glazing ratio before the
  lobby's glass line is drawn. If mechanical carries it instead, EN-18 requires that to be *declared*,
  which "then forces the EN-20/EN-21/EN-25 consequences".
- FACT EN-03 / EN-07: cap plate depth at the daylight or ventilation limit, whichever binds first; deep
  interior bands take the programme that does not need light. **INF**: a 2,400-4,000-tile lobby is deeper
  than any single-aspect daylight band (default `d = 6 tiles` long-occupancy, `d = 11 tiles` variant,
  EN-04) — so the interior of a 500-person lobby is an artificial-lit, mechanically-vented volume, and
  that must be said in the programme, not discovered as a dark hall.
- FACT FL-18 / FL-19 (scan list, SKILL.md §Failure Detection): "windowless long-occupancy room",
  "deep plan: single-aspect rooms and borrowed light that never arrives" — both are standing findings for
  a lobby sized this way; not defects in themselves, but declarations the report must carry.

---

## 4. Seating, dwell, standing density, luggage

- FACT HB-22 band table: **seated-with-desks 12 tiles/person (3 m²), seated lounge 6 tiles/person
  (1.5 m²), standing reception 3, dense queue 2, circulation-adjacent standing 2** — these are direct
  conversions of the FHWA/MSC bands (`FACT` in area, `HEURISTIC` in the activity mapping).
- FACT HB-12 (d): `group_seating_share` = fraction of waiting seats in **clusters of ≥ 2 adjacent tiles
  facing each other, target ≥ 0.5 in hospitality**.
- FACT HB-19 (from Nguyen et al. 2020, 274 residents, T2): **46 % of social interactions happen in
  circulation** — the lever is width + fixtures inside the movement zone at junctions, lifts, stair
  landings: `standing_tiles = max(4, ceil(expected_co_present × 2))` off the through-vector, and
  **at least one seating fixture within 3 tiles of each landing** where social interaction is a goal;
  **the margin is additive to the route, never carved out of it** (HB-19 exception: widening a corridor
  to 5 tiles for "interaction" drops `effective_width_tiles` in HB-02).
- FACT HB-12 (b): **≥ 1 amenity fixture per 8 waiting tiles** at high-wait points — the seated/standing
  wait must be *occupied*.
- FACT HB-20 / HB-01: standing comfort 2 tiles abreast minimum, 1 tile/person is a failure state.
- **Luggage** — the KB does *not* give a luggage footprint figure in the read scope. What it does say:
  HB-02 exceptions — "Trolleys, **luggage**, luggage carts, queueing that spills into the route, and
  door swings all reduce the effective figure — this rule sizes the *skeleton*"; HB-04's evidence caps a
  static person envelope at 760 × 1220 mm (1.5 × 2.4 tiles) for one wheelchair user, i.e. **a standing
  person plus a suitcase is larger than the 1-tile grid unit**; and HB-22's exception that a room sized
  by area alone fails once furniture is drawn ("an 80-person function room whose tile count supports 80
  only if no dance floor, bar or serving station is drawn").
  INF: with luggage, HB-22's "standing reception 3 tiles/person" is the *floor*, and the 2-tile lateral
  queue lane must be widened to **3 tiles abreast in the luggage stream** (arrival/departure queues only)
  — declared as inference, and the reason a 1-tile corridor anywhere on the arrival route is fatal
  (HB-04: no passing, and a case cannot pass in 0.5 m).
- INF seating for 500 (per §1.2 dwell split): 175 seated/long-wait persons × 6 tiles/person
  (HB-22 seated lounge) = **1,050 tiles (262 m²) of seating zone**, at HB-12 (d) ≥ 50 % in facing
  clusters of ≥ 2, each cluster inside 3 tiles of a landing (HB-19) and each 8 tiles carrying ≥ 1 amenity
  fixture (HB-12 b) → ≥ 131 amenity fixtures. Remaining 325 standing × 4.8 = **1,560 tiles**. Together
  with §0's crossing/movement allowance this is the honest programme figure: a 500-live lobby is a
  **~3,000-4,000 tile (750-1,000 m²) space**, not a room.
- SKILL.md §Circulation: "Provide turning and standing space where routes change direction (TH-13);
  bends are a throughput tax (PP-12)" — the seating clusters must not sit on a bend, and the queue pocket
  must not abut a turn (HB-10).
- FACT OM-26 / BOH function register, Hotels row (`operations-maintenance.md`:330-341) — the luggage and
  service fixtures a 500-person lobby needs alongside the seats, sizes as published (h = KB's own
  heuristic flag):
  | Function | Size m² / tiles | Route + separation rule (KB wording) |
  |---|---|---|
  | Bell desk / luggage store | 8-20 m² / **32-80 tiles (h)** | "lobby-adjacent but **not through lobby**", "visible from entrance (SBD §45/47 logic), controlled"; must fit "trunks, trolleys, cage" |
  | Service lift lobby | 6-12 m² / **24-48 tiles (h)** | "**trolley queue ≥ 3 cars deep**", "queue tiles must not reduce the corridor", "**never opens into guest lobby** (PP-04)" |
  | F&B stores / pre-pantry (for the bar) | **0.15-0.3 m²/cover (h)** | "dock → store → kitchen, **no lobby crossing**", "within 30 tiles of the servery" |
  | Waste & recycling room | 6-15 m² / 24-60 tiles | "≥ 5-tile goods route to a perimeter door, ≤ 50 tiles to collection", "out of the guest sightline (OM-25)" |
  | Staff entrance / lockers / changing / rest | see §3 staff arithmetic | "dedicated staff circuit", no public tile (OM-22) |
- INF for 500 covers at the bar (F&B 0.15-0.3 m²/cover): 500 x 0.15-0.3 = **75-150 m² = 300-600 tiles of
  back-of-house F&B storage** to feed the lobby's bar, and the register's own constraint says that volume
  may not be routed across the lobby. This is the number that turns "add another bar" into a stacking
  problem: **each extra bar counter bought for the lobby buys ~60-120 tiles of BOH behind it plus a
  service route that must not touch the guest queue** (→ FL-13 clean/dirty crossing, PP-04).
- INF luggage consequence for the grid: a trolley + two trunks exceeds the 1.5 x 2.4-tile static
  envelope (HB-04's evidence), so the arrival route from the door to the bell desk and to the lifts must
  be **≥ 3 tiles wide (FL-02's prevention ladder: 3 = main street, 4+ = lobby/queue) and never a
  single-file link** — HB-04's passing-bay rule (a 3-tile-wide, ≥ 3-tile-long bay every ≤ 12 tiles) is the
  minimum acceptable fallback, and `single_file_share < 0.10` of public movement tiles is the check.

---

## 5. Failure catalogue matched to an under-provisioned lobby

Ranked in the catalogue's scan order, with severity as printed:

| ID | Symptom (KB wording) | Cause (KB) | Fix (KB) | Grid consequence for 500 |
|---|---|---|---|---|
| **FL-01** | "circulation eats 35-60 % of the plate; rooms are starved while the floor reads fine"; fail `corridor/walkable > 0.35`, warn > 0.25 | corridors drawn as the primary act, untagged residue counts as circulation (FL-07), slivers (FL-05) | merge parallel 1-tile links into one 2-3-tile street, gift saved tiles to rooms; fix budget before the first tile | lobby exception FACT: FL-01's own exception list includes "lobby, market hall, concourse … where circulation *is* the product" — so a 500-person lobby legitimately breaks the 0.35 rule, but must say so in the programme (VA-01) or the check is meaningless |
| **FL-02** | "two rooms of flow meet at a 0.5 m throat; NPCs queue, oscillate, reroute" | rooms flush, 1-tile door set, furniture intruding | widen by taking a tile from the lower-severity neighbour | `clear width < 1.0 m (2 tiles) fail on any route > 20 trips/floor-minute`; **1-tile door run on a public route always fails**; **3 tiles (1.5 m) minimum for service/lobby doors** — at 500 live this is the width ladder: 4+ = lobby/queue (FL-02 prevention) |
| **FL-17** | "vertical capacity is planned by hope; queues back into the corridor, blocking doors, A* reroutes around the crowd, blocks the egress path" | too few portal tiles, lobby too small, peaks unmodelled, one portal serving guest + service | size from arrivals math, dedicated queue volume, separate service portals | queue > lobby tiles × 0.8 tiles/person, or wait > 60 s = FAIL; §2's 3 portals + 275 tiles |
| **FL-26** | "too many people for the doors and stairs; the escape route is the congested leisure route" | capacity added room by room without recomputing load | widen door run/route, add portal, **reduce capacity (the honest last resort)** | **Critical.** `capacity = Σ ceil(area × 0.25 / programme_area_per_person)`; required width at 500 mm per 100 persons level egress; travel > 30 m dead-end / > 45 m two-way (jurisdiction flag); `distinct exit groups < 2` above the occupancy line fails. **A 500-load lobby needs ≥ 3 exits of ≥ 4 tiles** (INF: 500 × 5 mm/100 = 2,500 mm = 5 m = 10 tiles of effective egress width — this, not taste, sizes the front door) |
| **FL-27** | "the plan only works when nobody is using it" | capacity planned on the empty grid, only one wide route, no parallel loop | parallel routes with real redundancy, no single-tile links on high-betweenness paths, spread demand across multiple destinations | run trips twice (empty vs peak occupancy on top 20 % betweenness tiles); fail if `p90 trip cost increase > 25 %`, `> 30 % of trips reroute`, or any door becomes unreachable at peak. **This is the check the 3/10 score should have triggered** — 500 agents is exactly the loaded run |
| **HB-04** | head-on blocking in a 0.5 m corridor; "an agent saves 20 tiles by narrowing a corridor to 1 tile and the vertical-portal queues lengthen" | two-way demand in single file | widen to ≥ 3 tiles or passing bay every ≤ 12 tiles | `single_file_share < 0.10` for public routes; conflict penalty 6 s per conflict (HEURISTIC) |
| **HB-10** | "the modeled queue of 12 at the desk runs back through the entrance door and cuts off the amenity route" | no reserved pocket | `queue_tiles ≥ λWq`, contiguous, off top-decile routes, not abutting a door run | `queue_spill_tiles = required − provided` must be **0** |
| **FL-08** | single-portal floor | one way up/down and it is the lift | second portal, alternative route | one of the five always-Critical cases |
| **FL-05 / FL-24** | leftover slivers read as space; furniture cannot fit | area-sized rooms, not layout-sized | tag or absorb the sliver; rect-pack the fixture envelope | every 2-tile-dead sliver in a 500-load lobby is a standing tile you cannot use — it is charged to §0's budget |

SKILL.md §Failure Detection (FACT): run the `failure-patterns.md` 18-scan suite **in that order**, not an
invented list; each failure reports symptom, evidence (which check, which number), cause, cheapest
correction, and what that correction risks. The five always-Critical: egress shortfall (FL-26),
structural discontinuity (FL-20), a room vanishing into `hall` (FL-07), a room divided by a door run
spanning its width (FL-06), a floor served by a single portal (FL-08).

## 5b. Gates the rebuilt floor must pass (SKILL.md §Validation + validation.md)

1. **Write the oracle first** (VA-01, SKILL.md): the 500-pax programme, the density bands (§0), the
   fixture counts (§1-4) and the wait targets must exist *as numbers before the first tile*. "A check
   with no written requirement behind it is opinion."
2. **Model-integrity gate before semantics** (VA-07, SKILL.md): one tile per state, door tiles joining
   two walkable regions, `occupied + circulation(incl. doors) + structure = grid`, portals anchored and
   walkable, no zero-interior rooms, no room split by a spanning door line. On gate failure **every other
   verdict is `unknown: model invalid`, never `pass`**.
3. **Pre-geometry feasibility gate, all nine arithmetic answers** (SKILL.md 153-194): envelope fit
   (`programme m² / available m²`), occupant load + egress budget in tiles, **vertical demand → required
   portal throughput → lift/stair count and lobby area in tiles** (with the declared arrival profile,
   HB-26), must-touch embeddability, module register, daylight envelope, service stacks, structural
   plausibility, control grid published. A failure here "is a programme, site or massing problem, and
   drawing a floor to hide it is the single most common agent failure".
4. **Steps 6-14 products exist**: programme table with per-space *fixtures* and *capacity*; route
   hierarchy with widths in tiles + capacity check + desire-line test + decision-point count (step 10);
   core plan with counts sized to peak demand + queue targets (step 11). "A report that contains 17 and
   18 but skipped 8-14 is invalid output."
5. **Circulation validated by simulated trips over the real A\* network** (VA-15, HB-13, FL-27): OD sets
   per user group per peak — `guest→lift→lobby→exit`, luggage, bar, WC — not by looking at corridors.
6. **Compute, do not narrate** (SKILL.md 752-764): `metric = value vs threshold (source) → verdict`;
   recompute totals from the tiles actually emitted; every reported area/width/capacity must reconcile
   with tile counts or the report is wrong first; unrunnable checks are `UNKNOWN — not representable`,
   never converted to `PASS`; capability manifest published (no real time, so **queue verdicts are
   `proxy` by construction** — validation.md weak/contested line 479).
7. **Closure rights** (VA-20): the agent may close geometry/logic; **operational-capacity, code,
   egress, access findings stay open** for a qualified reviewer. And the word *compliant* is unavailable
   (VA-04).
8. Cheap checks first, all Criticals collected before any Major; stop and fix on the first CRITICAL;
   re-run the downstream set after every edit (VA-05, VA-14, VA-19).
9. **Tier gates (validation.md:360-370)**: T0 tile-local (model integrity, widths, door runs) →
   T1 flood-fill (typing, dead space) → T2 floor graph (connectivity, egress distance, pinch sets) →
   T3 multi-floor (portal stack) → **T4 simulation (full OD trips, service-day replay)**.
   "**T0 failure halts everything** (all else `unknown: model invalid`). **T2 critical failure halts
   T3-T5 for that floor** (do not simulate a floor that strands a wing). Never run Tier k verdicts as
   closure for Tier j < k items." A 500-pax lobby is a **T4** deliverable: the FL-27 loaded run *is* the
   test, so a plan that never ran T4 has no throughput verdict at all.
10. **Borderline honesty (validation.md:373-375)**: every near-threshold pass prints `slack: X tiles`, and
    at slack ≤ 1 tile the `borderline` flag is mandatory — "the word 'pass' is banned for borderline
    without a boundary fixture (VA-12) covering the seam". Relevant here because desk/bar/lift counts land
    within 1 tile of their thresholds (2 portals vs 3, 2 desks vs 3): report slack, don't round it away.
11. **Failed vs impossible (validation.md:383-389)**: a violated stated threshold = `fail` (witness
    required); a missing datum class (**heights, materials, loads, jurisdiction, temporal**) =
    `unknown: missing-datum` + closer route — which is exactly the status of every wait-time verdict here
    ("no clock in the sim → queue results `proxy`", validation.md:284, 479); an un-encoded threshold =
    `oracle-gap` → **the 500-pax lobby's thresholds must be written into the oracle first** or the check
    cannot produce a `fail` that anyone is allowed to act on; a category the suite lacks =
    `not-in-suite: capability` → suite amendment, not a plan pass.
12. **Stopping (VA-19)**: green criticals + majors → ship-with-warnings; "a `pass` state never claims
    completeness — it claims the envelope declared in the capability manifest held".

---

## 6. Fixture counts for 500 live (headline table)

| Fixture | KB-derived rule used | Count for 500 | Tiles the fixture *and its mandatory frontage* need |
|---|---|---|---|
| Reception desk | INF on host μ + OM-16 ρ ≤ 0.9; HB-10; HB-20 | **2 desks min (3 with reserve)** at λ=50 p/min | 8×1 body + **24 tiles clear frontage** (HB-20 c) + **≈ 200 tiles queue pocket** (HB-10 q=4, W=60 s) → ~225 tiles/desk incl. frontage |
| Bar counter | INF on host μ; HB-20; HB-22 | **2-3 bars** at λ=25-38 p/min | 4×1 body + **12 tiles clear bar front** = 16 tiles plan each; + HB-22 standing 3 tiles/p |
| Lift portals | FACT FL-17 (HC 11-13 %/5 min, wait ≤ 60 s) + OM-16 ρ ≤ 0.9 + FL-08 | **3 portals min** (2 = band with zero reserve) | 2×2 each + **9 tiles boarding zone** (1.5 × 2-tile door) + **≈ 275 tiles lobby standing** (HB-11 comfort 2.2, code floor 140) + wheelchair patches (60 tiles at the literal code reading) |
| WC | guest ratio **not in the KB (read scope)** (it is in `building-codes.md`); mechanics from HB-10 / HB-20 / HB-24 / OM-16 | **≈ 7 stalls (INF, T_stall = 3 min assumed)** — source the real ratio or declare it; staff WC 1 per 20 lockers is FACT (OM-22) | **≥ 20-tile entry pocket** off the through-route, 2 tiles abreast at the row + 3 tiles aisle, door run ≥ 2 (≥ 4 if the anteroom holds > 80) |
| Bell desk / luggage store | **FACT OM-26 Hotels register: 8-20 m² / 32-80 tiles (h)** | 1 bell desk + 1 store per 500-guest arrival stream (INF) | "lobby-adjacent but **not through lobby**", "visible from entrance", controlled; trolley cage must fit inside |
| F&B back-of-house for the bar | **FACT register: 0.15-0.3 m²/cover (h)** | **75-150 m² = 300-600 tiles** for 500 covers | "dock → store → kitchen, **no lobby crossing**", within 30 tiles of the servery (→ FL-13) |
| Service lift lobby | **FACT register: 6-12 m² / 24-48 tiles (h), "trolley queue ≥ 3 cars deep"** | 1 service portal separate from the 3 guest portals (FL-17 cause: one portal serving guest + service) | queue tiles must not reduce the corridor; "never opens into guest lobby (PP-04)" |
| Seating | FACT HB-22 (6 tiles/p) + HB-12 (d) ≥ 50 % in clusters + HB-19 seating ≤ 3 tiles of each landing + HB-12 (b) 1 amenity / 8 tiles | **≈ 175 seats** for the declared dwell split | **1,050 tiles (262 m²)** seating zone + ≥ 22 amenity fixtures |
| Lobby volume | FACT HB-01 / HB-03 / HB-20 | — | **2,400-4,000 tiles (600-1,000 m²)** walkable, before fixture deduction |
| Exits | FACT FL-26 (500 mm per 100 persons) | **≥ 3 exit groups** (FL-08/100-occupant lines) | **10 tiles of continuous door run** minimum on the arrival axis, each ≥ 3-4 tiles wide, each draining into §0's standing budget without crossing a queue pocket |

## 7. Assumption register (HB-26 / SKILL.md step 23)
1. `rooms × 0.5` arrivals in the peak 5 min (FL-17) — KB heuristic, Confidence Medium, drives desk count.
2. λ_bar = 25 % of lobby population per 5 min — **my assumption**, not in the KB.
3. Seated/standing dwell split 40/25/20/15 — **my assumption**, drives seat and lobby-area counts.
4. W ≤ 60 s at every service point — **FACT FL-17** for portals; extended by me to desk/bar (flag).
5. q = 4 tiles/person design queue — **FACT HB-10**; the packed floor 1-2 is a failure state (HB-20).
6. Host service durations (5-12 s desk) are unrealistically fast; the KB's *space* arithmetic
   (HB-10/HB-20/HB-22) rather than the host's *time* arithmetic is the safer sizing basis — say so in the
   rebuild's report rather than trusting `capacity`.
7. Guest WC fixture ratio — **data gap in the read scope**; `building-codes.md` holds it. Never invented
   (HB-26 gate), and the ~7-stall figure above is INF on my own T_stall, not a sourced ratio.
8. All lift/WC/desk wait verdicts are `proxy` — no clock on this host (validation.md:284, 479:
   "no clock in the sim → queue results `proxy`", "Queue/capacity verdicts at building level have no
   temporal model"). Any `pass` on a wait time is a **geometry** pass with a proxy time, and must be
   reported as such (VA-03 three-valued verdicts).
9. `T_stall = 3 min` and "50 % of lobby population makes one WC trip per 2 h stay" — **my assumptions**,
   design weight: WC count only; sensitivity: stalls scale linearly with T_stall.
10. ~12 staff on shift supporting a 500-guest lobby — **my assumption**; drives the OM-22 welfare area
    (~146 tiles changing + 86 tiles rest + 12 tiles locker bay), which is BOH, not lobby.
11. Ventilation: 500 persons x 2.5-7 L/s (EN 15251 band, FACT) = 1.25-3.5 m³/s — the band is FACT, the
    application to a lobby is mine; ASHRAE 62.1 per-type rates are **"deliberately absent"** from the KB,
    so no tighter figure may be quoted.
12. FL-17's standing density of **0.2 m²/person (0.8 tiles/person)** inside its `lobby holding capacity`
    formula **contradicts HB-20** (1 tile/person = packed = failure state; design q = 4). Conflict
    resolved here in favour of HB-10/HB-11/HB-20 (4 tiles design, 2.2 comfort, 1.12 as the literal code
    floor only); FL-17's own line admits "the 0.5-person-per-room checkout peak is our heuristic" and its
    0.2 m² figure sits *below* the IMO queue density of 3.5 p/m². Flag this to the user: **using FL-17's
    constant would let a 500-pax lobby be sized at 100 tiles of standing, which HB-20 calls a failure.**
