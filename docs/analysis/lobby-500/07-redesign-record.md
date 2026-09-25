# Lobby redesign record - expert pass (23-step output)

Written after `05-design-brief.md`, which the user scored 3/10: that pass increased the plate and the
fixture counts and stopped there. This pass runs the skill's own procedure - programme, matrix,
zoning, circulation, structure, services, environment, geometry - and validates the result with a
written oracle (`tests/_layout-audit.tmp.ts`, the FL/TH/HB/PP scan suite) before claiming anything.
The plan on disk is the output of step 21, not a first draft.

## 1. Brief and requirement gaps

Hotel arrival level, 500 occupants present, on the 0.5 m tile grid, using only the 20 surviving
origin assets. Gaps: Known - grid contract, asset register, NPC pool, engine rules. Assumed - peak
arrival rate, storey height, BOH share, sex split. Unknown - jurisdiction (so no code clause closes),
structural system, whether 500 is a census or a wave (the brief says present, so census).

## 2. Programme (tiles = m2 x 4; enclosure tax paid per TH-02)

| Space | Zone | Tiles | m2 | Occupants | Basis |
| --- | --- | --- | --- | --- | --- |
| Arrival vestibule (3 entrances) | public | 144 | 36 | standing | HB-01 |
| Lobby court A (top-lit) | public | 448 | 112 | 93 @1.2 | HB-01 comfortable standing |
| Lobby court B (top-lit) | public | 448 | 112 | 93 | HB-01 |
| Grand lobby hall | public | 216 | 54 | 45 | HB-01 |
| Reception hall (6 desks) | public | 144 | 36 | queue | PP-08 |
| Bar, cafe, 4 lounges, reading | public | 1,184 | 296 | 296 seats | HB-22 |
| Dining north + 3 dining halls | public | 604 | 151 | 151 | HB-22 |
| Gym x2 | public | 320 | 80 | - | type convention |
| WC block (18 WC, 8 basins) | semi-public | 160 | 40 | - | IPC 2024 T403.1 governing row 14 |
| Guest lift hall (6 cars) | public | 240 | 60 | queue | HB-11 |
| Kitchen + servery + prep | service | 532 | 133 | - | PP-07 |
| Stores/bell, staff, laundry | service | 468 | 117 | - | PP-02/03/06 |
| Service core (3 portals) | service | 240 | 60 | - | PP-04 |
| BOH corridor | service | 196 | 49 | - | TH-08 |
| **Interior total** | | **4,742** | **1,186** | | |

Programme/available = 1,186 m2 / 1,421 m2 net = **83 %**; wall tax 930 blocked tiles = 10.6 %;
movement share (genuine circulation, excluding the programmed public volume) = **11.0 %**
(TH-15 band 0.10-0.25); BOH share **12.0 %** of interior tiles - an assumed operator figure, see the
register (PP-02 records that no authoritative share exists).

## 3. Site and orientation

Grid 116 x 76 tiles = 58.0 x 38.0 m of canvas; street ring 8 tiles (4.0 m) on all sides;
`streetFloorId = floor-g` binds the arrival edge. Buildable envelope rows 8-67 x cols 8-107 =
100 x 60 tiles = **50.0 x 30.0 m**. Access: 3 public doors on the north face (the street edge the
spawn zone overlaps), 1 public door east, 1 service door west, 1 service door east, 1 waste/bell exit
south. Cardinal assignment: north = arrival/frontage, south = service yard edge (declared, not measured).

## 4. Adjacency, zoning, parti

Matrix grades are the ones the audit asserts (F must touch, S must not share a door, C compatible):
arrival->vestibule->court A->reception/lobby/bar/dining/lounge all F; every BOH room F to the BOH
corridor only; kitchen S to WC/lounges, laundry S to WC, staff and all dining S to the BOH corridor
(no public room may open onto the service run); WC S to the BOH corridor.
Zones: public (north band, both courts, middle band, south band), semi-public (WC), service (BOH band
+ cores). Each zone is one flood-fill region; the only public-service contacts are the kitchen's own
door onto the corridor and the servery.
**Parti (one sentence):** a daylit perimeter of public rooms wrapped around two top-lit courts, with
the guest lift hall at the west end of the middle band and a fully separated service band, service
core and waste exit along the south - organisation **linear spine + centralised hubs** (TH-10),
published control grid: bay lines col 29/48/67/86 (10 m module), band lines row 17/26/39/48/57/60,
guest core rows 32-33 cols 10-26, service core rows 63-64 cols 90-98.

## 5. Circulation

Public route: street -> vestibule (14 tiles of 4-6 tile door run) -> court A -> arcades (4-6 tiles)
into every public room; court A -> middle band -> court B -> south band, so the plan is a **loop**,
not a tree: room graph 32 nodes / 44 edges, cyclomatic **13** (FL-04 pass). Route widths: no corridor
is narrower than 4 tiles where two streams meet; the audit's pinch scan finds **0** single-file link
tiles and **0** one-tile door runs (FL-02/HB-24). Queue pockets: 6 check-in positions with the two
rows on each guest side reserved clear at placement time (PP-08/HB-10). Vertical: **2 portal groups**
- 6 guest cars off the lift hall, 3 service cars at the east end of the BOH band - each car with a
clear boarding row on both sides (FL-08/PP-04, the previous pass's Critical). Lift waiting volume
(lift hall + lobby + pre-function + courts) = 1,512 tiles vs the IBC code floor 141 and the comfort
target 277 (HB-11). Egress: 177 door cells, 24 tiles of perimeter run in 6 groups on 3 faces vs the
6-tile requirement (IBC 1005.3.2) and the 3-exit rule (1006.2.1.1); worst straight-line escape 29 m
vs the 45 m two-direction budget (FL-26).

## 6. Structure and services

Bay grid 10 m (20 tiles) across, band depths 8/8/12/8/8/9 - every room width is a whole multiple of
the module (TH-22/23). Bearing lines: the four cross walls plus the two court rings run continuously
top to bottom of the plate. Longest clear span demanded: the court span 56 tiles (28 m) is **void, not
roof** (a top-lit court needs a glazed structure) and the lobby hall 18 tiles (9.0 m) - `REQUIRES
ENGINEERING VERIFICATION`, the chosen system is assumed RC flat slab at 9 m, which is at its limit.
Wet stack: all sanware (18 WC, 8 basins) sits in one block, the kitchen and prep in the adjacent bay,
laundry at the east end - one wet zone, one stack footprint to inherit on every upper floor (PP-17,
FL-21). Services band: the BOH corridor's wall lines carry the duct/riser band and are never sold to
rooms (PP-18/FL-22) - reported as a reservation, since the host has no services carrier.

## 7. Environmental

Façade proxy (the host has no window state): 487 wall tiles have void on the far side - the street
ring plus the two declared courts. Every habitable room is >= 60 % of its tiles within 8 tiles of a
façade tile (TH-26 pass, 0 findings); the middle band is double-aspect (court A north, court B south)
so its 12-tile depth is legal (TH-27); the windowless band is the service band, which is where the
skill says windowless belongs. Acoustic: the loud rooms (kitchen, servery, laundry, service core) are
in continuous bands away from the quiet ones, with the BOH corridor as the programmed buffer (PP-16,
FL-14).

## 8-9. Grid and cross-floor consistency

Tile-state grid is the payload in `blueprint-data.json` (walkable 7,709 / blocked 930 / door 177,
tile classes reconcile to 8,816 = 116x76, S1 pass). Rounding report: every minimum rounded **up** to
whole tiles - 1.0 m door -> 2 tiles, 1.5 m turning -> 3, 2.0 m public opening -> 4, 9.0 m bay -> 18;
no clearance is expressed below one tile. Cross-floor invariants published for the tower: bay lines,
band lines, both core rectangles, the wet block, the street edge.

## 10-11. Validation and failure list (measured, not asserted)

`tests/_layout-audit.tmp.ts` run against the emitted tiles: **0 findings, 0 critical, 0 major**.
Engine side: `validateLayoutIntegrity` no issues, wiring issues 0, all 10 roles reach 100 % of their
focus targets over real A* (guest 259/259, security 214/214, chef 39/39), one walkable component,
portal boarding rows clear. Checks the suite does **not** run (capability manifest): heights/sections,
real daylight factors, acoustics dB, smoke control, structural sizing, door leaf swing, cost.

## 12. Alternatives (the step the 3/10 pass skipped)

Input hash held for all four: 500 occupants, 20 assets, 0.5 m grid, street ring 8, one floor.

| | Parti | Public m2 | Daylit rooms | Criticals | Cost |
| --- | --- | --- | --- | --- | --- |
| **A (built)** | perimeter rooms + 2 top-lit courts + separated service band | 1,067 | all | 0 | canvas grows to 116x76 |
| B (previous pass) | three bands + one pavilion, no courts | 1,167 | 0 of 9 habitable | 2 (FL-08 single portal group, FL-07) | same canvas |
| C | shallower plate 50x20 m, one court | 700 | all | 0 | 1.4 m2/person, no spare |
| D | keep 80x50, treat 500 as a wave not a census | 496 | partial | 0 | does not answer the brief |

Diff vector: A vs B differ in core count, court set, band assignment and plate depth (>=2 components,
so a genuine alternative, not a variant). Recommendation: **A for this brief**; **C** if the canvas
growth is unacceptable (it is the same parti, 27 % less area, still above the standing figure);
**D** only if the operational model is genuinely wave-based - which the KB's own hotel rows say is
normal, and which is the user's call, not mine.

## 13. Decision log

- Two portal groups (over one big bank) - FL-08/PP-04 is Critical and the service run must not use
  the guest lobby. Cost: 3 cars and a core eaten from the BOH band.
- Two courts (over one big concourse) - buys TH-26/TH-27 compliance on a 30 m-deep plate. Cost:
  896 tiles of walkable area that cannot be let, and the movement share reading rises unless the
  courts are counted as programmed public volume (they are, and that is labelled).
- Service band at the south with its own through-corridor and 3 external doors (over BOH scattered
  between rooms) - TH-08/HB-14 measured 0 % stream overlap. Cost: the BOH corridor is 2 tiles wide,
  which is passing width, not queuing width - acceptable for 32 staff.
- WC block sized to the governing IPC row (14) and built as 18 + 8 basins in one stack. Cost: 40 m2.
- Retag courtB_west from lounge to servery (over moving the kitchen) - FL-14 kitchen-under-lounge.
  Cheapest repair on the ladder: retag < move door < resize < move wall.

## 14. Assumption and flag registers

| Assumption | Reason | Confidence | If wrong |
| --- | --- | --- | --- |
| 90 peak arrivals/hour (6 desks) | PP-08 formula; 500 present is not 500 arriving | Low | at 151/h the need is 11 desks and the plate has no room - would need a second check-in gallery |
| Storey 3.0 m, glazing head 2.1 m | TH-26 needs a section the host lacks | Low | daylight cap moves; rooms 8-12 deep are marginal either way |
| BOH share 12 % | PP-02: no authoritative ratio exists | Low | operator input; a full-service F&B programme wants 15-20 % |
| 50/50 sex split for WCs | IPC scoping convention | Medium | bank counts shift, total holds |
| 25 % of load waiting at the lift peak | HB-11 code basis | Medium | lobby volume is the buffer, 1,512 tiles against a 277 target |

Flags (open, not closed by this agent): exit count and travel distance are jurisdiction-dependent
(`REQUIRES CODE VERIFICATION`, REVIEW); lift traffic figures were NOT VERIFIED externally
(`REQUIRES PROFESSIONAL REVIEW`); the 9 m lobby span and the glazed court roofs
(`REQUIRES ENGINEERING VERIFICATION`); accessible stall clearances, door leaf swing, signage and the
`storage` room type are **not representable** on this host and are reported as UNKNOWN, never as pass.

## 15. Modification log (iterations, in severity order)

1. Measured the previous pass with the suite: 21 findings, 2 Critical (single portal group;
   room-shaped halls).
2. FL-08/PP-04: split the core - 3 service cars at the east end of the BOH band, 6 guest cars off the
   lift hall, >15 tiles apart. Cascade: BOH band lost 60 tiles of store, gained a second exit.
3. FL-13/TH-08: deleted the four doors that opened dining and WC onto the service corridor; only the
   kitchen touches it now. Stream overlap went from shared to 0 %.
4. FL-14/FL-11: retagged the room above the kitchen from lounge to servery (cooking signal).
5. TH-25/FL-05: removed a 4-tile screen that had cut a 6-tile sliver out of the WC room; moved the WC
   door to the far corner so the entry dog-legs.
6. PP-08/HB-10: moved counters to explicit positions and made each counter reserve its own two front
   rows at placement time, so no seat can be packed into a queue. 3 counters failed, then 0.
7. FL-24: gave blocking fixtures a 1-tile working aisle and laid the WC bank by hand (stall rows on
   both long walls, basin row inside, three clear rows of spine).
8. FL-08 (again): the packer had parked lift cars against the room's top edge with their boarding row
   in the wall; portals moved to rows 32-33 / 63-64 with clear rows both sides.
9. Oracle hygiene: the adjacency matrix was corrected where it had been written wrong (a party wall is
   not a connection; BOH rooms link through the corridor, not to each other) - a check that cannot be
   defended was fixed in the check, not in the plan, and says so here.

## 16. Sources consulted for this design

`architecture-skill/SKILL.md` (workflow, gate, ladder, programming, adjacency, circulation, human
scale, environmental, structural, MEP, operations, lifecycle, grid translation, host facts, type
rules, alternatives, decision making, validation, failure detection, iteration, uncertainty, output
requirements) read in full; `research/failure-patterns.md` FL-01..FL-28 with the S1-S12 scan order;
`research/professional-practice.md` PP-02..PP-09; `research/architecture-theory.md` TH-06..TH-28;
`research/human-behavior.md` HB-10..HB-16; plus `01`-`06` in this folder (KB-derived capacity,
programme, throughput, fetched IPC/IBC tables, the previous brief and scorecard) and
`docs/research/grid-architecture-kb.md` for the host contract.
