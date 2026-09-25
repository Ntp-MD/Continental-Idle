# Lobby rebuild - 500-person design case

Design load: **500 occupants present** on the arrival level (user order 2026-09-24: "facility and
furniture need enough for 500 ppl in lobby from real live"; current provision scored 3/10).
Evidence: `architecture-skill/` (SKILL.md + research/) read first, `docs/research/grid-architecture-kb.md`
for the host contract. FACT = from the KB, INF = arithmetic on a FACT, ASSUMED = not in the KB.

## Pre-geometry feasibility gate (SKILL.md "Pre-geometry feasibility gate", 9 answers)

1. **Envelope fit - the old plate fails.** 500 @ the KB's comfortable standing 1.2 m2/p (HB-01/HB-20,
   FACT) = 600 m2 of standing alone. The authored envelope is 32.0 x 17.0 m = 544 m2 gross / 496 m2
   net, i.e. **0.99 m2/person with zero tiles left for fixtures** -> the programme does not fit, so
   the plate (not the decoration) is what changes. New plate: **50.0 x 30.0 m = 1,500 m2 gross /
   1,421 m2 net** (canvas 116 x 76 tiles at 0.5 m, street ring 8). Programme/available = 1,314 m2 of
   rooms / 1,421 m2 net = 92 %. Ring 4 (756 m2) was tested and rejected: still under the standing
   figure once fixtures and BOH are added (`02-program.md`).
2. **Occupant load and egress budget.** Load 500. Required width 0.2 in/occ, 0.15 sprinklered
   (IBC 2021 1005.3.2, verified in `04-code-verification.md`) = 100 in = 2.54 m = **6 tiles of door
   run minimum**; exit count 3 once the load passes 500 (IBC 1006.2.1.1, verified). Provided: north
   4+6+4 = 14 tiles, east 4, west service 2, south BOH 4 = **24 tiles (12.0 m)** in 6 groups on 3
   faces. Standing floor itself is also code-governed: IBC Table 1004.5 assembly standing 5 ft2/p ->
   927 tiles (232 m2) for 500, against 4,666 free public tiles provided.
3. **Vertical demand.** The KB refuses a cars-per-occupant number (MS-10/SR-17, FACT). Declared
   profile (INF): 500 present, 250-room hotel above (02-program: 500 occ ~ 250 keys), peak wave =
   10 % of population boarding in 5 min = 50 people. 6 cars x capacity 4 = 24/trip, 1-3 s interaction,
   30 s cross-floor cooldown -> the binding quantity is the **boarding queue floor**, not the cars:
   HB-11 ~275 tiles of lift-hall standing (FACT) against 480 tiles provided.
4. **Must-touch embeddability.** Hub = the grand lobby hall. Arrival->Lobby->(Lounge, Bar, Dining,
   Lift hall, WC) is a star, so no five-clique obstruction. Kitchen is deliberately NOT adjacent to
   the lounge (BOH/FOH separated by the col-23 spine + a servery to dining only).
5. **Module register.** 6 m structural bay = 12 tiles; bands are 9 / 18 / 15 / 13 tiles deep; every
   room footprint is whole tiles; wall lines are 1 tile (grid contract, `01-code-capacity.md`).
6. **Daylight envelope.** Max plan depth 18 tiles (9.0 m) for the public band, so every public space
   touches a facade line; the interior rooms (WC, laundry, staff, kitchen) are the ones with no
   daylight, which is the correct order.
7. **Service stacks.** Wet cells (12 WC + 10 basins + kitchen sinks) sit in one contiguous south-east
   block (rows 54-66, cols 40-74 + kitchen cols 9-22) so a single drain stack serves them; the KB
   notes shafts are not expressible in a single floor (2.5) - recorded as a deviation, not drawn.
8. **Structural plausibility.** 50 m x 30 m plate with two continuous 1-tile spine lines (col 23,
   col 92) gives bearing lines; longest clear span demanded = 68 tiles (34 m) across the grand hall
   -> `REQUIRES ENGINEERING VERIFICATION` flag, not an assertion (SKILL gate 8).
9. **Control grid published.** Datum = tile 0,0; perimeter rows 8/67, cols 8/107; spine lines col 23
   and col 92; band lines row 18, row 37, row 53; lift core rows 47-48 cols 62-81; bay pitch 12 tiles.
   Any later floor must inherit these or register a deviation (MS-01/SR-15).

## Fixture schedule for 500 (what the rebuild must contain)

| Need | Basis | Provided |
| --- | --- | --- |
| standing volume | HB-01 4.8 tiles/p, HB-03 8 tiles/p (FACT) -> 2,400-4,000 tiles | ~4,005 tiles of public room |
| seats | ~175 (03-throughput, INF from HB-22/HB-12d) | ~190 interaction spots in lounge/dining/bar/cafe |
| reception | 2-3 desks (03) + 24 tiles clear frontage each (HB-20c) | 4 desks, 32 tiles of counter, 24 guest spots |
| WCs | IPC 2024 T403.1 (= IPC 2018 T405.1), verified in `04`: theater basis 6 WC, governing row (dance hall) 14 WC, design pick 8 WC + 2 urinals + 6 lav + 2 accessible; queueing cross-check rho<=0.85 -> >=5 stalls | 16 WC + 14 basins |
| lift hall | HB-11 ~275 tiles standing + boarding (FACT) | 480 tiles + 6 cars |
| bar | 2-3 counters (03) | 2 counters (10 spots) + 12 bench spots |
| egress | >=6 tiles, >=2 remote (CODE-04/05) | 24 tiles, 4 remote exits |
| BOH | kitchen/staff/laundry share, service door | 210 + 182 + 195 tiles, west service door |

## Deviations and unknowns (carried into the report)

- `01-code-capacity.md`: the KB has **no** plumbing-fixture scoping table and no lobby area-per-person
  row; the numbers used are queueing arithmetic + an external code check (`04-code-verification.md`).
- The grid cannot express: wall thickness variety, heights, shafts, door leaf swing (2.5/2.2, FACT).
- 500 people in a 544 m2 lobby is not a decoration problem; it is a plate-size problem. This rebuild
  changes `layout.canvas`, which is a layout-level field shared by all floors - any future floor
  inherits the 116 x 76 frame.
