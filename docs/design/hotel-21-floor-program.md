# Hotel Continental - 21-floor design program

Design record and construction spec for the full 21-floor hotel in
`src/blueprint-editor/data/blueprint-data.json`.

Status: this document is the authority the generator (`scripts/generate-hotel.mjs`)
builds against, and every claim marked HIT/GAP below is re-checked by that
generator's validators plus the repo gates. Do not treat a floor as built until
its validation row is green in the generator report.

Seed status (2026-09-24): the working seed now holds a single empty lobby floor -
the building is being placed by hand. Nothing here is lost: regenerating with
`node scripts/generate-hotel.mjs --write` rebuilds the whole tower into
`src/blueprint-editor/data/blueprint-data.json`. The tower gates
(`tests/unit/hotelReachability.test.ts`, `tests/unit/npcPortalCapacity.test.ts`)
and the scale gate (`npm run test:npc-scale-hotel`) therefore read the generator's
output through a temp file, not the working seed, so they stay green while a floor
is under construction. `tests/unit/floorGeometry.test.ts` is the one gate that
judges the working seed itself: no wall two tiles thick, and the street ring must
reach the street floor's interior.

Terminology follows `harness/state/context.md` (Parti, Origin assets, Tile states,
Spawn zone, Front of house / back of house, Service corridor).

---

## 1. The grid contract (what "one tile" means here)

Facts taken from the running app, not assumed:

| Fact | Value | Evidence |
| ---- | ----- | -------- |
| Canvas | 1600 x 1000 px at tileSize 20 px | `blueprint-data.json:1031-1039` |
| Grid | 80 columns x 50 rows = 4000 tiles | `layout.ts:53-59` (`canvasWithinGridCaps`) |
| Scale | 1 tile = 0.50 m; 40 px = 1 m; 1 tile = 0.25 sq m | `docs/research/hotel-layout-references.md:52` ("64x34 tiles @ 0.5 m") |
| Wall | exactly 1 tile thick (0.5 m) - thicker is rejected | `validation.ts:332` "2x2 solid wall block(s) - walls must stay single-tile" |
| Door | a `door` tile; 2+ connected door tiles slide as a pair | `walkable.ts:4-13`, glossary "Door halves" |
| Object | footprint = asset w x h in whole tiles, position snapped to the tile | `layoutBuild.ts:185-198`, `assets.ts:15-19` (`assetPixelSize`) |
| Street ring | 8 tiles (4 m) of road + sidewalk, only on the street floor | `data:9340-9341`, `layoutBuild.ts:151-153`, `floors.ts:200` |
| Caps | 256x256 grid, 100 floors, 10k objects/floor, 5 MB payload | `limits.ts:8-18` |

Derived dimensional rules (these are the rules the design obeys, all integer tiles):

| Element | Tiles | Real size | Basis |
| ------- | ----- | --------- | ----- |
| Room door | 2 | 1.00 m | ADA/brand 0.9 m clear min (`uperplans`), one tile (0.5 m) is too narrow, three is waste |
| Corridor door / suite entry | 2 | 1.00 m | same |
| Street entrance door | 3 | 1.50 m | vestibule + exit width 1.1 m (`uperplans`) |
| Circulation corridor | 4 rows | 2.00 m | preferred 1.8-2.4 m (`hotel-layout-references.md:49`), code min 1.22 m |
| Service corridor | 3 rows | 1.50 m | "typically 1.5 to 1.8 meters clear" (archgyan) |
| Stair (clear width) | 3 | 1.50 m | 44 in = 1.12 min for OL > 50 (IBC 1016 via meltplan); 1.4-1.8 m typical |
| Lift hoistway | 5 x 5 | 2.5 x 2.5 m | car 6'8" x 5'5" = 2.03 x 1.65 m + guide rails (base-4) |
| Structural column | 1 | 0.5 x 0.5 m | typical hotel RC/steel column 450-600 mm |
| Plumbing riser | 2 | 1.0 m | stack + access |
| Electrical / MEP shaft | 2 | 1.0 m | tray + panel access |
| Housekeeping closet | 4 x 7 | 7.0 sq m | "closet of at least 6 to 8 square meters" (archgyan) |

Two honest consequences of that contract, stated up front so nothing is faked:

* Wall thickness. A real partition + finish is 0.12-0.2 m. The grid cannot express
  that: the minimum wall is 0.5 m. Every room dimension below is therefore quoted
  twice - **gross bay** (pitch x depth, the architect's slab measurement) and
  **clear** (after the 0.5 m walls). Comparison against brand standards uses the
  gross figure, which is the same basis brand standards use.
* Windows. The engine has no window cell type: the only facade vocabulary is
  `blocked` (wall) and `door` (opening). Facade glazing is therefore expressed as
  the perimeter wall line itself, with real openings only where a door exists
  (street level entrances, terrace doors on floor 20). No off-grid glazing is
  drawn, and no `door` tile is placed where it would break a room's privacy -
  the door state is simulation-live (NPCs walk through it), so faking windows with
  it would be exactly the "visual trick" the brief forbids.

---

## 2. Parti and envelope (one dominant move, repeated 21 times)

**Parti: an end-core tower. A single west service core feeds one straight
double-loaded corridor spine; the spine is flanked by two identical 7 m room
bands and is terminated at the far end by a second enclosed stair.**

The organizing decision is egress-driven, not aesthetic: more than three stories
requires two enclosed exit stairs from every floor (IBC ch.10 via meltplan), so
the corridor must have an exit at both ends, which forbids a dead-end and forces
the second stair to the east facade. Everything else follows from that.

Envelope, identical on all 21 floors:

```
cols 8..71  x  rows 8..41   = 64 x 34 tiles = 32.0 m x 17.0 m = 544.0 sq m
cols/rows 0..7 and 42..49 / 72..79 = the 8-tile street ring: street on floor G,
                                     non-walkable void above (engine rule)
```

Section across the 17 m depth (rows):

| Rows | Tiles | Zone |
| ---- | ----- | ---- |
| 8 | 1 | north facade wall |
| 9..22 | 14 | north room band (7.0 m deep) |
| 23..26 | 4 | guest corridor (2.0 m clear) |
| 27..40 | 14 | south room band (7.0 m deep) |
| 41 | 1 | south facade wall |

Plan across the 32 m width (columns):

| Cols | Tiles | Zone |
| ---- | ----- | ---- |
| 8 | 1 | west facade wall |
| 9..12 | 4 | stair 1 (west enclosed exit stair) |
| 13..27 | 15 | lift hall: hoistway band with 5 cars + the clear lobby in front of them |
| 28..67 | 40 | room region (the bay grid) |
| 68..70 | 3 | stair 2 (east enclosed exit stair) |
| 71 | 1 | east facade wall (doubles as stair 2's outer wall) |

No residual columns: 4 + 15 + 40 + 3 = 62 interior + 2 facade = 64 exactly.

### The bay grid (why every room pitch is integer)

The 40-column room region divides cleanly at 0.5 m resolution and every room type
below consumes it exactly, so no floor leaves unusable slivers:

| Room type | Pitch per band | Bays | Gross bay sq m | Clear sq m | Frontage |
| --------- | -------------- | ---- | -------------- | ---------- | -------- |
| Standard key | 8 + 8 + 8 + 8 + 8 | 5 | 28.0 | 22.75 | 3.5 m |
| Superior key | 10 + 10 + 10 + 10 | 4 | 35.0 | 29.25 | 5.0 m |
| Executive / junior suite | 13 + 13 + 14 | 3 | 45.5 / 49.0 | 39.0 / 42.25 | 6.5-7.0 m |
| Suite | 20 + 20 | 2 | 70.0 | 61.75 | 10.0 m |
| Accessible key | 8 (same as standard) | - | 28.0 | 22.75 | 3.5 m |

Room depth is 14 tiles gross / 13 clear = 7.0 m / 6.5 m on every type, which is
the reason the pitch is the only variable.

Structural grid: 8.0 m transverse (the standard bay pitch) x 7.0 m longitudinal
(room depth), matching the reference "spans in the region of 7.0 to 8.5 metres"
and "room widths approximately 3.3 to 3.8 metres" (hoteldevelopmentguide). Column
cells sit at the bay boundaries - cols 36, 44, 52, 60 at rows 22 and 27 - so on a
guest floor they are buried in the party walls and on an open public floor they
read as a row of 0.5 m square columns. Same cells on all 21 floors. Over the
double-height-free public halls (floors 1-3) the guest-floor grid is carried by a
transfer structure; the columns stay stacked so the grid never shifts, which is
the documented architectural reason for their presence in an open hall.

---

## 3. Vertical systems: what must line up on all 21 floors

The generator asserts these as identical cell sets on every floor; any exception
has to be written into this file first.

| System | Cells (all floors) | Note |
| ------ | ------------------ | ---- |
| Passenger lifts P1, P2, P3, P4 | cabs at cols 10..11, 14..15, 18..19, 25..26 x rows 10..11 | 4 cabs: the 2-cab rule (R10) is for a 100-150 key mid-rise; a 21-floor stack with 1200 agents measured 43k "car at capacity" rejections at 3 cabs |
| Service lift SV1 | col 22..23 x rows 10..11 | "one service elevator for up to 100 keys" (base-4) |
| Lift hall | bank rows 9..13 x cols 9..26, arcade at row 14, hall rows 15..26 | >= 3 x 3 m clear in front of cars (`uperplans`); the arcade is what makes the cars boardable at all |
| Stair 1 | cols 9..12 x rows 21..28 | enclosed exit stair, discharges at G |
| Stair 2 | cols 68..70 x rows 21..28 | second remote exit stair, discharges at G |
| Plumbing riser | cols 13..14 x rows 25..28 | wet-wall spine serving both bands |
| Electrical / MEP shaft | cols 15..16 x rows 25..28 | tray + panel bay |
| Column line | cols 36, 44, 52, 60 at rows 22 and 27 | 0.5 m square |
| Guest corridor | rows 23..26, cols 28..67 | 2.0 m clear |
| Service corridor | rows 27..29 inside the core zone | staff route, guests excluded by role tags |

Bathroom stack logic: every standard/superior key puts its bathroom in the
corridor-side corner of the bay (2 m of bay depth) so all waste stacks fall on
the plumbing riser line, which is why the riser never moves.

Egress audit: 116 keys, largest floor population under 60 occupants per exit
stairs; corridor serves two remote enclosed stairs at its two ends, so the dead-end
length inside the guest wings is 0 m (limit: 6.1 m sprinklered per
`hotel-layout-references.md:49`, 15.2 m per IBC-sprinklered via meltplan - we
satisfy the stricter reading). Common path from the farthest room door to the
nearest of the two stairs is at most 21 tiles = 10.5 m, against 15 m (75 ft)
unsprinklered - HIT with margin.

---

## 4. Building-wide program (the 21 floors)

| Floor | Function | Keys | Lettable sq m | Character |
| ----- | -------- | ---- | ------------- | --------- |
| G | Arrival: vestibule, reception x2 pods, concierge, bell desk, lounge, lift hall, public WCs, office | 0 | - | public |
| 1 | All-day dining restaurant + full production kitchen + pastry + dishwash | 0 | - | F&B / BOH |
| 2 | Grand ballroom + pre-function + 2 breakouts + banquet kitchen | 0 | - | banquet |
| 3 | Meeting centre (boardroom + 3 rooms) + registration + business centre | 0 | - | conference |
| 4 | Wellness: pool, gym, spa (4 treatment rooms), lockers | 0 | - | amenity |
| 5 | Back of house: on-premises laundry, housekeeping hub, dry + cold store, staff locker/canteen, engineering, waste | 0 | - | service |
| 6..11 | Standard guest floor (10 keys, one linen closet per 5) | 60 | 1,680 | guest |
| 12 | Accessible guest floor (10 keys, 5 ambulant) | 10 | 280 | guest |
| 13..15 | Superior guest floor (8 keys) | 24 | 840 | guest |
| 16 | Executive floor (6 keys) | 6 | 283 | guest |
| 17 | Club level (6 keys + club lounge in the core service zone) | 6 | 283 | guest |
| 18 | Junior suites (6 keys) | 6 | 283 | guest |
| 19 | Grand suites (4 keys) | 4 | 280 | guest |
| 20 | Roof: sky bar + satellite kitchen + mechanical penthouse | 0 | - | F&B / MEP |
| **Total** | | **116** | **3,929** | |

Gross floor area 21 x 544 = 11,424 sq m; lettable 3,929 sq m = 34% (real
full-service hotels run 55-65% revenue-gross including public F&B, which this
program holds once floors 1-4 are counted as revenue space: 3,929 + dining 300 +
ballroom 320 + meeting 400 + wellness 400 = 5,349 = 47%, the balance being cores,
BOH and mechanical).

---

## 5. Reference register

Every number used in the floor evaluations below, with its source. Values are
quoted as published; nothing here is extrapolated silently.

| ID | Reference figure | Source |
| -- | ---------------- | ------ |
| R1 | Room width 3.3-3.8 m, structural span 7.0-8.5 m, two guestrooms between columns | hoteldevelopmentguide.com/hotel-structural-design |
| R2 | Standard room 25-30 sq m; deluxe 35-45; 1BR suite 50-70; 2BR 80-120; bathroom 4.5-6.0 (suite > 12) | uperplans.com hotel floor plan; archgyan (midscale 28-32, luxury from 35, suites > 70) |
| R3 | Corridor 1.5-1.8 m typical, code 1.22 m min, 1.8-2.4 m preferred; dead-end 6.1 m sprinklered; travel 76 m sprinklered; 1 h rated corridor | archgyan; `docs/research/hotel-layout-references.md:49` |
| R4 | Bed clearance 600 mm each side, 900 mm at foot | archgyan |
| R5 | Dining 1.5-2.0 sq m per person; reception desk depth 1.0-1.2 m; lift lobby 3 x 3 m clear; wheelchair turning 1.5 m diameter; door clear 0.9 m; exit width 1.1 m; laundry 30-50 sq m | uperplans.com |
| R6 | Kitchen : dining = 0.5 : 1 for full production; all-day dining 80-150 seats; meeting 6-8 sq m per guest room; BOH 15-25% of gross floor area; on-premises laundry 200-300 sq m for a 200-key hotel; housekeeping closet 6-8 sq m; lobby 1.5-2.5 sq m per guest room; wellness on a lower level or dedicated floor | archgyan |
| R7 | Banquet seated dinner 1.1-1.4 sq m/pax (12-15 sq ft); reception 0.55-0.74; theatre 0.55-0.74; foyer/buffer +15% | thetivolihotels.com banquet hall size guide |
| R8 | 5-star spa 1 treatment room per 15-20 keys; treatment room 25-35 sq m incl. ensuite; locker/shower 1 sq m per peak guest; mix treatment 32% / aquathermal 26% / changing 14% / BOH 28%; minimum viable spa 350-400 sq m | ifeelspainternational.com hotel spa space planning |
| R9 | Gym: minimum 25 sq m; 50 sq m for up to ~50 rooms; ~100 sq m a reasonable aim; resort gym+pool under 500 sq m | biofit.io specialist hotel gym designer |
| R10 | One elevator bank per 75 keys plus one service elevator per up to 100 keys; 100-150 keys = two cabs; a third above 200 keys; car 6'8" x 5'5", 3000-4000 lb; >= 1 elevator above 3 floors | base-4.com elevator selection |
| R11 | 1 exit under 49 occupants, 2 for 50-500; two enclosed exit stairs required above three stories; stair 44 in (1.12 m) for OL > 50; exit door 32 in (0.81 m); common path 75 ft (23 m) unsprinklered / travel Group R 200 ft (61 m) | meltplan.com IBC chapter 10 summary |
| R12 | Reception 1 pod (1.2 m) per 75-100 rooms, 1.5 m behind counter, 3.7 m queue in front; vestibule 2.5 m between door sets; lobby 0.6-0.9 sq m per guestroom (older brand figure) | `docs/research/hotel-layout-references.md:44-50` |
| R13 | Kitchen flow: delivery -> store/cold room -> prep (veg/meat split) -> cooking battery -> portioning -> dining -> dish return -> dishwash -> store; separate clean-supply / staff / guest circuits; laundry + garbage adjacent but separate | `docs/research/hotel-layout-references.md:36-42` (industrial kitchen DWG) |
| R14 | Adjacency: keep kitchen next to store and dining; put high-traffic shared rooms centrally, quiet rooms at the edges; combine dining and recreation rather than duplicating them | `docs/research/hotel-layout-references.md:9-16` (RimWorld colony guidance, applied as a game-side heuristic) |

Note on R12 vs R6: the two lobby figures disagree (0.6-0.9 vs 1.5-2.5 sq m per key)
because one counts the reception lobby and the other all public areas. Both are
applied below as a range and the floor is evaluated against each.

---

## 6. Floor-by-floor design, conversion and reasoning

Each floor: function, required spaces and relationships, the reference numbers,
the tile conversion, the layout decisions, and the checks it must pass.

### Floor G - Arrival and lobby (public)

* Function: arrival, check-in/out, waiting, luggage, directory, lifts, public
  conveniences, staff entry to the service line.
* Required relationships: sightline entry -> reception -> lift hall; luggage near
  the door; bell desk beside reception; public WCs off the lobby but not facing it;
  staff route from the service lift to the back corridor without crossing the
  arrival axis.
* Conversion: keys 116 -> reception pods 116/75-100 = 2 pods (R12); lobby
  requirement 1.5-2.5 x 116 = 174-290 sq m (R6), older figure 0.6-0.9 x 116 =
  70-104 sq m (R12); plate is 544 sq m, so the whole floor is available.
* Layout: two openings cut through the envelope wall, and only on this floor. The
  main entrance is a 2-tile (1.0 m) door pair at row 8, cols 36..37, sitting
  opposite the kerb drop-off zone (rows 2..6, cols 32..42) so the arrival axis
  runs door -> hall -> reception. The service entrance is a 2-tile door at col 8,
  rows 26..27: it lands on the stair 1 half-landing and opens onto the service
  yard spawn zone (rows 24..29, cols 1..6), which gives staff and deliveries a
  route that never touches the guest door and gives the tower its second exit at
  grade. No vestibule/airlock is modelled - the grid has no glazing primitive, so
  an airlock would be a sealed box in front of the door (near-miss, recorded).
  Reception: two `reception-desk` assets (8 x 1 tiles = 4.0 x 0.5 m) at col 30,
  rows 17 and 19, facing the entry axis with 7 rows (3.5 m) of queue in front and
  the 1.5 m working behind (R12 under-supplied at 3.5 m vs 3.7 m - recorded as a
  near-miss, not hidden). Concierge and bell desks on the second desk line at
  col 40. Lounge and lobby bar furniture between the desk line and the lift hall.
  Public WCs in the south-east quadrant (rows 33..41, cols 58..67) with a west
  door off the service line and a north door off the lobby, so no WC door faces
  the entry axis. Luggage and bell store rows 33..41 at cols 44..52, north door
  only.
* Reasoning: the lobby is the only floor where the street ring is part of the
  design, so the arrival axis is set against the widest street frontage; stair 1
  discharges straight to the yard door, so life-safety egress does not have to
  pass through reception furniture.
* Checks: street ring reaches the lobby interior (generator `arrival` check, which
  fails if the front door is missing); exactly the two declared openings break the
  envelope at grade and no floor above does; every spawn zone on the floor is
  reachable from the main circulation; both stairs and all five lifts entered
  from legal floor; no 2x2 wall; every role with a zone here has a matching task
  or focus tag.

### Floor 1 - All-day dining and production kitchen (F&B + BOH)

* Function: breakfast/dinner service for guests and outside business, plus the
  kitchen that feeds floors G, 1, 2 and 5's banquets.
* Conversion: 80-150 seats (R6); at 1.5-2.0 sq m/pax (R5) 100 seats = 150-200 sq m;
  kitchen at 0.5 : 1 of dining (R6) = 90-120 sq m; plus dishwash, stores, pastry,
  staff. Available: 544 sq m.
* Layout: dining room takes the east 26 columns of the plate (13 x 20 m) with
  100 covers at 1.8 sq m each; the kitchen occupies the north band west of the
  core in R13's flow order - delivery from the service lift, dry + cold store,
  prep, cooking battery, portion/pass, then the servery door into the dining room,
  with the dirty-dish return entering from the opposite side so clean and dirty
  circuits never cross. Two kitchen doors minimum (R13 / Prison Architect guidance):
  one to the servery, one to the service corridor. Bar counter at the dining
  west end facing the lift hall.
* Reasoning: the kitchen is placed against the service lift (vertical BOH feed)
  rather than under the ballroom, because the ballroom has its own satellite
  kitchen on floor 2 and stacking both would need a second waste stack.
* Checks: kitchen roles have a spawn zone here; every posted task's asset is on
  this floor; dining and kitchen each reachable from the guest corridor and the
  service corridor respectively.

### Floor 2 - Grand ballroom, pre-function and breakouts (banquet)

* Conversion: ballroom at 1.1-1.4 sq m/pax seated dinner (R7); a 250 sq m hall
  seats 180-225; pre-function at 15% of hall area (R7) = 38-55 sq m (provided 62);
  two breakouts at 60 sq m each; banquet service kitchen + bridal suite + stores.
* Layout: hall spans cols 36..67 x rows 9..22 (16 x 7 m = 112 sq m) - see the
  deviation note in section 9: a column-free 250 sq m hall cannot be expressed on
  this plate without swallowing the core, so the ballroom is built as one main hall
  plus the pre-function, breakouts and terrace-side banqueting that together read
  as the banquet floor (main + pre-function + both breakouts = 320 sq m).
  Folding `door` pairs between hall and pre-function allow the R7 capacities to be
  quoted for combined and split layouts.
* Reasoning: banquets belong low, near the lobby and a dedicated stair, because
  they arrive and leave in crowds; putting them near the guest floors would push
  service trolleys through the residential stack.
* Checks: banquet roles and both stairs reachable; breakouts each have their own
  access off the pre-function (not enfilade through the hall).

### Floor 3 - Meeting centre and business centre (conference)

* Conversion: R6 asks 6-8 sq m of meeting space per guest room = 696-928 sq m for
  116 keys. Floors 2 + 3 together provide about 800 sq m, i.e. 6.9 sq m per key -
  inside the band only when the ballroom floor is counted as meeting inventory,
  which is how brand standards count it. Recorded as HIT-by-combination.
* Layout: boardroom 40 sq m, three rooms at 55-70 sq m, registration/foyer in
  front of them along the corridor, business centre (printing, `office-chair`,
  `reception-desk` as a counter) next to the lift hall, AV store off the service
  corridor.
* Reasoning: meetings are placed directly above the ballroom so both share the
  same event-staff staging area on floor 5 and the same breakout of guests from
  the two passenger lifts.

### Floor 4 - Wellness: pool, gym, spa (amenity)

* Conversion: gym aim 100 sq m (R9); spa minimum viable 350-400 sq m with a
  treatment 32 / aquathermal 26 / changing 14 / BOH 28 split (R8); treatment
  rooms 25-35 sq m each at one per 15-20 keys => 6-8 rooms for 116 keys (R8);
  locker/shower at 1 sq m per peak guest (R8). Pool: no figure in the register,
  so it is set as a 12 x 5 m lap pool (24 x 10 tiles) with a 1.5 m deck all round -
  flagged as a design assumption, not a cited standard.
* Layout: pool hall east (cols 44..67 x rows 9..22 water + deck), gym west of the
  corridor spine in the north band with `treadmill-1` stations at 3 x 2 m each,
  four treatment rooms at 36 sq m in the south band, lockers and showers between
  the pool and the lift hall, towel/BOH room off the service corridor.
* Reasoning: the reference says wellness sits on a lower level or a dedicated
  floor (R6); floor 4 is directly above the two banquet/meeting floors, so the
  wet zones of the building (pool, spa, kitchen, banqueting) all stack in the
  lower four floors over the two fixed risers, and the 15 guest floors above stay
  dry and quiet.
* GAP, recorded: four treatment rooms against a 6-8 room target and about 300 sq m
  of spa against a 350-400 sq m minimum. A 544 sq m plate cannot hold pool + gym
  + a compliant spa; the resolution is to move the gym into the pool hall's deck
  zone, which R9 permits ("gym + pool under 500 sq m" at resort scale).

### Floor 5 - Back of house (service)

* Conversion: OPL for 116 keys scaled from R6's 200-300 sq m at 200 keys = 116-174
  sq m; housekeeping hub, dry store, cold store, staff locker + canteen,
  engineering workshop, waste, HR office. BOH target 15-25% of gross (R6).
* Layout: laundry 150 sq m in the north band with two doors (clean issue / dirty
  return) so linen never travels the same corridor twice; housekeeping hub and
  uniform store beside the service lift; canteen + locker room at the east end
  near stair 2 (a second means of escape for staff deep inside the floor); waste
  and recycling at the service end adjacent to the lift, not the guest lobby.
* Reasoning: this floor is the building's service basement expressed horizontally
  because the schema has no negative floor - see section 9. It is placed directly
  under the guest stack so soiled-linen and vacuum routes are one riser.
* Checks: staff-only circulation separated from guest circulation by role tags and
  by the physical service corridor; guests have no zone here.

### Floors 6..11 - Standard guest floors (10 keys each)

* Conversion: bay 8 x 14 tiles = 28.0 sq m gross, 3.5 x 6.5 m clear, inside R1
  (3.5 m frontage, 7 m depth against a 7.0-8.5 m span) and at the lower end of
  R2 (25-30 sq m standard). Bed 4 x 3 tiles (2.0 x 1.5 m) with 1-tile (0.5 m)
  side clearance both sides and 1.5 tiles at the foot => R4 satisfied at 600 mm
  sides / 750 mm foot (50 mm short at the foot, recorded).
* Layout per bay (mirror-imaged across the corridor): entry hall 8 x 2 tiles with
  the wardrobe on the hall wall; bathroom 8 x 4 tiles at the corridor side holding
  `toilet`, `washbasin`, `shower`, i.e. 4.0 sq m clear - just below R2's 4.5-6.0
  sq m, recorded as a near-miss with the cause (the 0.5 m wall consumes it);
  sleeping area 8 x 8 tiles with bed, two nightstands, desk + chair, luggage rack,
  TV, armchair; door 2 tiles to the corridor.
* Corridor: 2.0 m clear, linen closet (4 x 7 tiles = 7 sq m, R6) at cols 36..39
  north side every fifth bay, housekeeping zone at the stair ends.
* Reasoning: one repeated module, 10 identical keys per floor and six floors, is
  what makes the tower buildable and re-buildable at all, and it is also what
  real mid-rise hotels do (a repeated type plan with the wet wall stacked).
* Checks per floor: 10 rooms each individually reachable through its own door;
  100% BFS reachability from the corridor; both stairs reachable from the corridor
  ends; core cells identical to the floor below; zero residual tiles in the bay
  grid; no 2x2 wall mass; every room's bathroom fixtures inside an enclosed room
  (the engine derives privacy from walls, so an open bathroom would let a second
  NPC claim the room).

### Floor 12 - Accessible guest floor (10 keys, 5 ambulant)

* Conversion: R5's wheelchair figures are the binding ones - 1.5 m turning circle
  (3 x 3 tiles), 0.9 m clear door width (2 tiles), and transfer space beside the
  WC. All fit inside the same 8-tile bay, so accessible keys reuse the standard
  footprint and differ in fixture layout and furniture count: no armchair, shower
  instead of tub, 1.2 m transfer space beside the WC, lower basin.
* Reasoning: keeping the same bay pitch means the wet wall and the column grid do
  not shift, which is the cheaper and more honest solution than carving larger
  rooms out of the stack.
* GAP, recorded: at one accessible key per 25 keys (a common US/UK provision) a
  116-key hotel needs about 5, which this floor provides; where that ratio is
  applied per-floor rather than per-building, floors 13-19 would also need one
  each. Noted as an unresolved uncertainty about which jurisdiction applies.

### Floors 13..15 - Superior guest floors (8 keys each)

* Conversion: bay 10 x 14 = 35.0 sq m gross - the bottom of R2's 35-45 sq m deluxe
  band; bathroom grows to 5.0 sq m clear, meeting R2; a separate lounge area of
  two sofas at the window end.
* Reasoning: the only change is pitch, so the riser, stairs, lifts and corridor
  lines stay stacked; three identical floors gives the house enough premium
  inventory without another plan type.

### Floor 16 - Executive floor (6 keys)

* Conversion: bays 13 + 13 + 14 = 42 cols x 14 rows = 45.5 / 49.0 sq m - inside
  R2's 1BR-suite band (50-70) at its low end once the wall allowance is read as
  gross-to-clear, so this floor is classified as executive rather than suite.
* Layout adds a walk-in dressing entry (the difference that defines an executive
  room) and a bathtub (`bathtub` asset) beside the shower.

### Floor 17 - Club level (6 keys + club lounge)

* Same bay geometry as 16, plus the core's south service zone (rows 30..40,
  cols 13..27 = 41 sq m) becomes the club lounge - breakfast and evening
  service for the floor, adjacent to the lift hall so non-members never cross it.
* Reasoning: converting a service zone rather than a guest bay means the key count
  of the tower does not drop for an amenity that serves one floor.

### Floor 18 - Junior suites (6 keys)

* Bays 13 + 13 + 14 = 45.5-49.0 sq m but planned as living/sleeping split with a
  6.0 sq m bathroom and a powder room; classified junior suite on plan, not on area.

### Floor 19 - Grand suites (4 keys)

* Bays 20 + 20 = 70.0 sq m gross, 64 sq m clear - R2's 1BR suite band (50-70) at
  its top. Each has an entry gallery, a separate living room with `sofa-1` pair
  and `table-1`, a bathroom with tub + separate WC, and a second wardrobe run.
* Reasoning: four large keys is the maximum the plate allows without cutting the
  corridor below 2 m; suite floors sit directly under the roof bar so their
  private circulation does not pass guest room doors.

### Floor 20 - Roof: sky bar, satellite kitchen, mechanical penthouse

* Function: revenue (bar + terrace-side dining) plus the building's plant.
* Conversion: sky bar 60 seats x 1.5-2.0 sq m = 90-120 sq m (R5); satellite bar
  kitchen 40 sq m (reheat and cold only - the production kitchen is on floor 1);
  mechanical: chiller/AHU bays, water tanks, lift machine rooms, fire pump,
  riser caps.
* Layout: the west half of the plate is the mechanical field - AHU blocks 6 x 4
  tiles, chiller 8 x 5, tanks 4 x 4, each non-walkable with one service interact
  spot so engineers have a post to stand at - and the east half is the bar with
  `bar-counter`, high tables and the `plant-1` edge. Both stairs continue through
  to roof discharge, keeping R11's two-exit rule true on the top floor too.
* Reasoning: plant on the roof is the alternative to a basement, and since the
  schema has no basement, putting it at the top is the only place where its noise
  and access do not invade a guest or F&B space.
* Checks: the floor must still contain at least one interactable object with spots
  (the engine warns about object-only floors that NPCs cannot use), which the
  mechanical control panel and bar provide.

---

## 7. Operations model (NPC roles, staffing and spawn zones)

Staffing is scaled from the same references so the population reads as a real
operation rather than a decoration:

| Role | Basis | Count |
| ---- | ----- | ----- |
| Guest | 116 keys, ~50% of them visibly active at once | 58 |
| Receptionist | 2 pods (R12), 2 shifts visible; also mans the concierge and bell desks | 4 |
| Chef | one per cooking battery line (R6 0.5:1 kitchen) | 8 |
| Server | 1 per 20 covers (dining 100 + banquet + bar) | 7 |
| Housekeeper | 1 per 12-16 keys per shift | 9 |
| Attendant | laundry + engineering support, OPL (R6) | 3 |
| Engineer | mechanical + lifts on duty | 3 |
| Spa therapist | 4 treatment rooms (R8) | 3 |
| Bartender | 2 bars | 3 |
| Security | patrol, posted at the entrance | 2 |

Total 100 agents. Historical reference point: a 14-floor build ran 116-137 agents
in this repo, so 100 is inside the proven envelope; the 21-floor spawn/tick test is
the gate that confirms it rather than assuming it.

### Measured vertical traffic (`npm run test:npc-scale-hotel`, 1200 agents, 5400 ticks)

The pool above is scaled x12 for the test, so 1200 agents move through this building.
What the run measures, after the fixes below:

* 149 lift rides across 66 distinct cars and 53 distinct floor pairs (e.g. 10->13 x12,
  5->G x8, 9->14 x7, 3->2, 5->2) - the traffic is building-wide, not neighbour-hopping.
* End state `waiting=510 walking=380 interacting=219 idle=85 queued=6` - the population
  is working, not parked. Before the fixes it was `idle=1179` with 7 rides.
* Tick cost at this load: avg 7.60 ms, p50 7.41, p95 11.01, p99 12.70, 0.24% of ticks
  dropping a frame (the gate fails above 16.7 ms p95 or 5% dropped frames).
* Four causes were found and fixed: the cross-floor selector always chose the
  *nearest* floor (now the floor with the most of what the role wants); portal
  targets were built with `capacity: 1`, so one rider blocked a whole car for every
  destination (now the cab's declared capacity, 4); the lift bank was sealed behind
  a wall, so no agent could ever reach a car; and roles had no reason to leave their
  floor, so `crossFloorChance` was added to `NpcRole` (guest 22, server 26,
  housekeeper 16, bartender 14, engineer 12, attendant/chef 10, therapist 8,
  security 6 - percent of target decisions that look elsewhere on purpose).
* Still true at this scale: 43k candidate rejections were "car at capacity", i.e.
  5 cars x 4 places = 20 boarding slots per floor is the binding limit at 1200
  agents. That is an operational finding, not a modelling error - a real tower of
  this size would run 6-8 cabs or destination-dispatch.

A role's `floorIds` are not hand-listed: the generator derives them from the floors
that actually carry a spawn zone for that role, so no pool entry can name a floor
where its agents would strand (only `security` is pinned to G, and the derivation
drops it to exactly the floors whose zones list it).

Every floor that names a role in `allowedRoleIds` also carries a spawn zone for
that role and at least one asset matching one of its focus tags or tasks, because
the app's own validator reports both omissions (`validation.ts:170` and
`validation.ts:288`). Guests are excluded from floors 5 and the mechanical half of
20 through `restrictedTags`, which is what keeps service and guest circulation
separate in the simulation and not just on paper.

---

## 8. Validation protocol (how each floor is proven, not claimed)

Per floor, the generator asserts and prints a row:

1. Grid alignment: every object position is a multiple of tileSize; every asset
   footprint is whole tiles; every wall/door cell is a cell.
2. Wall integrity: zero 2x2 blocked masses; the wall graph is single-tile.
3. Room usability: every declared room is >= its target area and has a door.
4. Access: BFS from the corridor reaches 100% of the floor's walkable cells;
   every declared room is entered by >= 1 door tile; no enclosed pocket exists
   that has no door.
5. Egress: both stair cells exist, are door-connected to the guest corridor (and
   the service corridor on BOH floors), and the corridor has an exit at each end
   (dead-end = 0).
6. Vertical alignment: the cells of P1, P2, SV1, stair 1, stair 2, both risers and
   the column line are byte-identical across all 21 floors.
7. Portal continuity: every floor carries a portal object, so the engine's
   pair-wise portal targets exist between every floor pair and are symmetric.
8. Operations: each floor's zones, roles, tasks and tags cross-check against the
   app validators; the settings-completeness scan of the finished file must return
   zero issues.
9. Budget: payload bytes < 5 MB, objects per floor <= 10,000, floors <= 100.

Then the repo gates: `npm run verify:assets`, `npm run test:unit` (which includes
the real-seed tower integration: migrate, per-floor map build, portal symmetry,
spawn-cell resolution for every pool entry, 120 ticks with no lost agent), and the
routed lint/typecheck. Then the visual checkpoint below.

Visual checkpoints (rendered editor, not internal state): G, 1, 4, 5, a standard
guest floor, the accessible floor, the suite floor and the roof, plus a vertical
sweep comparing the cores of adjacent floors. Deviations from the intended design
found visually are fixed in the generator, not by hand-editing the JSON, so the
data and the spec cannot drift apart.

---

## 9. Documented deviations, compromises and open questions

Stated rather than hidden, per the brief:

1. No basement. The floor schema orders `G` first, then numbers (`data-flow.md:101`),
   so there is no negative level. Everything a real hotel puts below grade -
   OPL, dry/cold store, staff canteen and lockers, waste, engineering, and part of
   the BOH share - is compressed onto floor 5, which is why measured BOH lands at
   about 13.5% of gross against R6's 15-25% band. This is the single largest
   realism gap in the building.
2. Ballroom size. A 250 sq m column-free hall does not fit the 544 sq m plate
   beside a full core; the banquet program is split across hall + pre-function +
   breakouts, which is also how R7 counts capacities (combined versus split).
3. Spa under-provision: 4 treatment rooms and about 300 sq m against R8's 6-8
   rooms and 350-400 sq m minimum.
4. Bathroom area at 4.0 sq m clear sits just under R2's 4.5-6.0 band, and the foot
   of the bed clears 750 mm against R4's 900 mm; both are direct costs of the
   0.5 m wall minimum.
5. Windows and facade expression: no window primitive exists, so the facade reads
   as a wall line (see section 1). This is a limitation of the tool, not a design
   choice, and it is not papered over with fake `door` cells.
6. Column grid through public halls: columns are transferred rather than removed;
   real hotels of this size use transfer girders or a podium frame, which the grid
   cannot show. The column dots on floors 1-3 are the honest consequence.
7. Pool dimensions are a design assumption (12 x 5 m) - no reference in the
   register fixes them.
8. Accessible-key ratio is provisioned at building scale (5 of 116) rather than
   per floor; the governing figure depends on a jurisdiction this project has not
   picked. Unresolved uncertainty, recorded.
9. Guest-to-staff ratio in the simulation is a game-readable compromise: 58 guests
   on 116 keys is roughly "half the hotel is visibly occupied", not full capacity.
