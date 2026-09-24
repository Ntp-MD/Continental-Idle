# Research file 04 — Failure patterns (the symptom catalogue)

Purpose: the negative mirror of `architecture-theory.md` (TH-xx). Where TH-xx says what to aim at,
this file names what goes wrong, how to *see it on this grid before an NPC complains*, and what the
cheapest repair is. Every rule follows the spine **Failure → Cause → Detection → Prevention →
Correction**, plus Source / Class / Scope / Severity / Confidence / Exceptions.

This file EXTENDS `professional-practice.md` (PP-01…PP-26) and `validation.md` (VA-01…VA-23) rather
than restating them: PP rules give the good practice, VA rules give the checking discipline, FL rules
here give the *defect signature and its thresholds*. Cross-refs are written inline as `→ PP-11`,
`→ VA-15`.

Host grid these tests run on (verified in code): 1 tile = 0.5 m; 4 tiles = 1 m²; a wall is exactly
one blocked tile; tile states are ONLY `walkable | blocked | door`; rooms are 4-connected flood-fill
and **door cells belong to no room**, so a door run spanning the interior divides it (loose door tiles in an open area do not - verify by the derived room count); room typing
uses 15 `detectTags` and the **lowest priority number wins**; an unrecognised room silently becomes
`hall`; movement is A\* octile with diagonals gated on *both* orthogonal neighbours being open and
unoccupied, so crowding reroutes dynamically; vertical movement is `portal` objects with queues;
access is by role tags; there is **no section, no heights, no ceiling void, no dimensioned furniture**.

Threshold policy: every number is stated in metres first, then converted to tiles at 2 tiles/m, with
`FLOOR` on the tile count unless the note says `CEIL` (→ VA-17). Reported as measured-vs-required
diffs, never prose (→ VA-18). Three-valued verdicts: pass / fail / **unknown** where the model has no
carrier for the property (→ VA-03, VA-10).

---

## Rules

### FL-01 Circulation share runs away (the plan is mostly corridor)
- Failure: circulation eats 35–60 % of the plate; rooms are starved while the floor "reads fine".
- Cause: corridors drawn as the primary act and rooms fitted between them; party walls not shared; each room given private approach; and on this grid, silent `hall` fallback (FL-07) and slivers (FL-05) both *count as circulation*, so the metric is inflated by typing errors, not only by design.
- Detection: `circulationShare()` — input tile grid; compute `rooms = floodFill(walkable, 4-conn, minus door cells)`, `typed = rooms with ≥1 fixture tag`, `corridor = walkable tiles not in typed room`; threshold `corridor / walkable > 0.25` warn, `> 0.35` fail (net-to-gross target: 0.70–0.80 usable for hotel/office floors). Report per floor: corridor tiles, share, plus the split "genuine corridor" vs "untagged residue" — a fail that is really FL-07 must not be charged to FL-01.
- Prevention: fix circulation budget *before* the first tile, as a hard allowance per programme row (→ TH-01, PP-02); grow rooms to absorb corridor rather than adding corridor to serve rooms; share party walls to reduce the wall tax that pushes rooms apart (→ TH-02).
- Correction: merge parallel 1-tile links into one 2–3-tile street and gift the saved tiles to the adjacent rooms; cheapest first where the link is double-served. Cascade risk: room merge changes room area → capacity → detectTag match → may retype the room (FL-07), so re-run typing after every merge.
- Source: Hillier, *Space is the Machine* (1996), Oxford University Press, and Hillier et al., "Space is the machine: a configurational theory of the programme" — T2, peer-reviewed theory + observational evidence; BOMA/ANSI Z65.1 rentable-vs-usable loss practice (5–15 % typical for well-planned offices, far higher for bad cores) — T2 standard, numeric band heuristic; architecture-theory.md TH-01/TH-02 (this repo's own derivation) — T1 code-derived.
- Class: HEURISTIC
- Scope: universal at floor and building level; the cut-line is type-specific (→ Type-specificity audit)
- Severity: Major — wastes money on every square metre forever, but no single occupant is harmed; rises to Critical when the corridor tiles are the only egress route and FL-26 also fails.
- Confidence: Medium (metric real, thresholds ours); the 0.25/0.35 cut-lines are our own heuristic, not a published threshold — was `STANDARD`; demoted: BOMA/ANSI Z65.1 defines what counts as usable-vs-rentable area, it does not set a circulation share, so the band that the detection acts on is a project threshold
- Exceptions: lobby, market hall, airport-style concourse, and any "street" interior where circulation *is* the product; a service floor whose walkable tiles are all plant access.

### FL-02 Single-tile pinch (a 1-tile corridor in a demand route)
- Failure: two rooms of flow meet at a 0.5 m throat; NPCs queue, oscillate, and reroute around it.
- Cause: rooms placed flush so the only path left is one tile; door set 1 tile wide; furniture/fixture tiles intruding into the route (→ PP-10 "width in plan is not width in use").
- Detection: `pinchScan()` — for every walkable tile, count walkable 4-neighbours; a tile with exactly 2 walkable neighbours that are *opposite* is a link tile; measure its corridor's clear width = min tiles across the free strip; threshold: clear width < 1.0 m (2 tiles) fail on any route carrying > 20 trips/floor-minute, < 0.75 m (1.5 tiles → not representable, so = 1 tile) fail always; report tile coords + pinch width + measured trip count. Additionally: any *door* run of 1 tile (0.5 m) on a public route fails — 2 tiles (1.0 m) minimum, 3 tiles (1.5 m) for service/lobby doors.
- Prevention: width ladder declared with the programme (1 tile = staff-only tail, 2 = room approach, 3 = main street, 4+ = lobby/queue); never let a room-to-room adjacency produce the only link (→ PP-11, PP-13).
- Correction: widen locally by taking one tile from the *lower-severity* neighbour (a room with surplus area, or a sliver FL-05), then re-run FL-01 and FL-24 on that room. Cascade risk: stealing a wall tile can make a room non-rectangular or drop it under minimum area.
- Source: Neufert, *Architects' Data*, 3rd ed., Wiley — one-person circulation 0.6 m, two people 1.2 m, corridor minimums by building type — T2 standard text; ADA/OAG clear-width 915 mm (32 in) minimum at a point, 1015 mm (40 in) for passing spaces on accessible routes — T1 code-derived; PP-11 (this repo) — T1 derived.
- Class: STANDARD
- Scope: universal; the numeric minimum is jurisdiction- and type-specific
- Severity: Major — a single-file throat on an egress path is Critical (see FL-26).
- Confidence: High (dimensions), Medium (trip-count trigger); the 915/1015 mm accessible-route floor is a code requirement (ADA/OAG) where the jurisdiction adopts it - the width ladder itself is standard practice
- Exceptions: 1-tile staff tails with a role-gated door, closet interiors, niche recesses, planted pockets, and any deliberately "single file" threshold (a room's own door leaf is allowed to be 1 tile where the room holds ≤ 2 people).

### FL-03 Dead-end corridor (no through route, and it is long)
- Failure: a route that terminates; occupants enter it uncertainly, retreat, and (at night, in a fire) cannot find the way out.
- Cause: corridor grown to serve one room cluster; expansion planned "later"; a room deleted leaving its approach.
- Detection: `deadEndScan()` — prune walkable tiles of degree 1 iteratively (leaf removal); surviving stubs whose distance from the nearest junction (degree ≥ 3) or hall ≥ 3.0 m (6 tiles) fail; any dead end on a route from a room door to a portal or exit fails at ≥ 1.5 m (3 tiles); report stub start tile, junction tile, length in m, and what it serves.
- Prevention: draw the circulation tree first and demand every leaf be a *room*, not a corridor; when a leaf is a corridor, ask which room is missing (usually FL-15 storage or FL-16 maintenance access).
- Correction: end the dead end with the room it was reaching for (best), or absorb the stub into the nearest room as a nook (FL-05 fix), or convert it to a supervised alcove. Cascade risk: absorbing a stub removes the only approach to a door beyond it — re-run FL-04 connectivity before claiming the fix.
- Source: IBC (2018/2021) §1020.5 dead-end limits, order 20 ft (6.1 m) with occupancy- and sprinkler-dependent variation — T1 code-derived; NFPA 101 *Life Safety Code* dead-end exit-access provisions (typically ≤ 20 ft / 7.6 m where two directions not available) — T1 code-derived; Zimring & Gill, "Design quality and residential burglary", *Environment and Behavior* 25(5), 1993 — T2 peer-reviewed (dead ends raise fear and crime risk); Newman, *Defensible Space*, Macmillan, 1972 — T3.
- Class: CODE REQUIREMENT
- Scope: universal; the exact permitted length is jurisdiction/type specific — say "inconsistent with typical IBC practice, verification required", never "non-compliant" (→ VA-04)
- Severity: Critical when the dead end is on an egress path or in a low-visibility occupancy; Major otherwise.
- Confidence: High; outside an egress context the same limit is carried as professional standard (crime and fear evidence), not as code
- Exceptions: cul-de-sacs of ≤ 2 rooms with a single user group (a housekeeping tail, a plant bay), and any dead end visibly terminating in a useful place (window seat, store, plant), which is a nook not a stub (→ FL-05).

### FL-04 Tree topology: circulation that must be backed out of (doubling back)
- Failure: every trip returns the way it came; the same tiles carry each journey twice; congestion self-assembles on the trunk.
- Cause: the plan is a star/tree with one trunk; no ring; the second entrance that would close the loop was traded away for area.
- Detection: `ringness()` — build the walkable graph (8-conn for open halls, 4-conn for links); compute `cyclomatic number = E − V + 1` over the circulation subgraph, and `avg detour factor = A*/octile distance ÷ straight-line octile distance` between the 500 busiest origin-destination pairs; threshold: circulation graph with `cycle_count = 0` on any floor of > 8 rooms fails; `p90 detour factor > 1.35` fails; report the top 10 OD pairs by trip count with their factor.
- Prevention: guarantee at least one closed loop per floor between the two most-used doors; two ways to leave any room cluster (→ PP-13 desire-line test, → FL-26 egress redundancy).
- Correction: the cheapest loop is usually a 2-tile link through an existing room's second door or a re-opened original door; failing that, add a through-door in a party wall between two adjacent public rooms. Cascade risk: any new through-door changes room typing (FL-07) and may divide a room where the run spans its width (FL-06).
- Source: Hillier & Hanson, *The Social Logic of Space*, Cambridge University Press, 1984 — "ringy" structures carry more movement and are more intelligible; Peponis, Zimring, Choi et al., "Finding the building you are looking for: layout legibility and wayfinding" (Atlanta/Hartsfield-Jackson study), *Environment and Behavior*, 2006 — T2 peer-reviewed evidence that integration predicts flow and that tree layouts degrade wayfinding.
- Class: STANDARD (evidence-backed configurational rule)
- Scope: universal for public floors; weak for single-cell residential
- Severity: Major — chronic doubled distance and congestion; Critical only when the tree has a single exit (then it is FL-26).
- Confidence: High (theory + POE evidence), Medium (1.35 cut-line)
- Exceptions: privacy-first plans (a guest-wing dead end is desirable), secure/cleared zones, museum enfilades where the route is prescribed, and one-way operational loops where doubling back is scheduled, not accidental.

### FL-05 Leftover tiles and 1-tile slivers (unusable residue that reads as space)
- Failure: wedges and 1-tile strips between non-parallel rooms; a "room" of 8 tiles (2 m²) that fits nothing; the floor plan looks full and the model is full of holes.
- Cause: geometry driven by the gesture rather than a planning grid; non-rectangular rooms on a 4-connected grid; wall tax mis-budgeted (→ TH-02); rooms pushed apart to make each one rectangular.
- Detection: `sliverScan()` — for each derived room: `area_tiles < 8` (2.0 m²) fails outright; `min(width,height) < 3 tiles (1.5 m)` fails for any occupancy; for each *unassigned* walkable tile cluster: `area < 4 tiles (1 m²)` or `aspect ratio > 3:1` fails as leftover; report each with area, aspect, bounding box, and whether it is reachable but useless (a trap for the NPC and a lie in the tally).
- Prevention: snap every room outline to a 3-tile (1.5 m) module minimum dimension and a 2-tile grid (→ Neufert planning module); price non-standard geometry in the layout phase (→ PP-24); after each geometry edit, run the sliver scan as part of the blast radius (→ VA-14).
- Correction: three options in cost order — (a) gift slivers to the neighbour with the smallest area deficit; (b) turn the sliver into an explicit micro-function it can hold (linen shelf, plant, bin bay, sign alcove) and tag it so it stops counting as circulation; (c) straighten the offending wall. Cascade risk: straightening a shared wall moves two rooms at once and can break the party-wall acoustic line (→ FL-14, PP-16).
- Source: England's HMO room-size space standard — 6.51 m² for one adult (10+), 10.22 m² for two, and a room below 4.64 m² that may not be used for sleeping at all — carried in the 2018 HMO licensing instruments (legislation.gov.uk/uksi/2018/616; exact instrument to confirm, see the verification ledger in Sources) — T1 statute-derived. Applicability on this host is clean because the model has a `bedroom` type: run the test on every room whose awarded tag is `bedroom`, at `area_tiles × 0.25 m²`; run it again after any FL-06/FL-07 fix, because retyping changes which rooms the statute bites; Alexander et al., *A Pattern Language*, Oxford University Press, 1977 — rooms need a "shareable" minimum dimension and nooks must be given a purpose or they die — T3; Neufert, *Architects' Data*, 3rd ed. — minimum room dimensions and circulation areas — T2.
- Class: CODE REQUIREMENT
- Scope: type-specific — the 6.51 m² line is HMO residential only; the "fits nothing" line is universal
- Severity: Moderate — pure waste; Major when the sliver is the only thing standing between two incompatible adjacencies (a buffer row silently deleted).
- Confidence: High (statute), High (geometry), Medium (3-tile rule); code-strength only for HMO-style residential letting, where the statute bites - outside that occupancy the minimum-dimension line is a design principle
- Exceptions: recesses, alcoves, niches and planters that are *intentionally* non-occupiable and tagged as such; service voids; door-reservation clear floors (→ PP-14).

### FL-06 A door run spanning a room divides it in two (grid-specific defect; silent and checkable)
- Failure: a room is split into two disconnected halves that both read as "the room", or a through-door planted in a room's middle turns it into a corridor with a name on it.
- Cause: host rule — `deriveFloorRooms` excludes door cells from every room, so any door tile in the interior of a room's tile-set cuts the flood-fill; and a door on a party wall with a room beyond makes that room a shortcut. Nothing in the editor warns about it.
- Detection: `roomCutScan()` — for each derived room R and each door cell d adjacent to ≥ 2 tiles of R (a door tile with two or more same-room walkable neighbours): re-run flood-fill with d removed and check whether R's tile count drops into 2+ components, or whether the same fixture tag now yields two rooms; report `room id / door coords / component sizes / path-through flag (is d on a shortest path between two tiles of R that are not both served by d)`. Threshold: fail on any interior door tile; fail additionally on any door whose removal increases the A\* trip count *through* a private room (through-route through a room = Critical for privacy).
- Prevention: forbid door tiles that are not on a room's outer boundary (a wall-line test: door tile must have ≥ 1 neighbour outside the room set); put through-doors only in rooms designated as pass-through (halls, galleries, enfilade suites) in the programme; validate geometry before typing (→ VA-07).
- Correction: either (a) move the door to the boundary ring, or (b) accept the split and re-stamp the halves as two rooms with an explicit connecting door pair, or (c) wall the door and re-route. Cascade risk: (b) halves both rooms below FL-05 minimums; (c) may orphan a route (→ FL-04) or create a dead end (→ FL-03).
- Source: this repository's own engine behaviour — room derivation with door cells excluded, `src/engine/npc/rooms.ts` (see architecture-theory.md TH-02 which verified the same exclusion) — T1 code-derived; conventional practice: doors sit in walls, and no standard plan places a leaf in mid-room — T2 standard (stated, not quoted).
- Class: ENGINEERING CONSTRAINT
- Scope: universal on this host; irrelevant on hosts where rooms are drawn as polygons
- Severity: Critical — a private room silently used as a corridor, or a room split into two halves neither of which can be reached, is a functional and privacy failure at once.
- Confidence: High; it escalates to a code requirement on life-safety grounds when the divided room is an egress path
- Exceptions: deliberately cross-through spaces (concourses, galleries, enfilade hotel suites, train-platform-level halls) where the "room" *is* a route and is typed `hall`.

### FL-07 An untagged room silently becomes `hall` and vanishes into circulation
- Failure: the floor reports a 45 % corridor share and a "large hall" nobody programmed; a real room (store, plant, laundry) exists in geometry but is invisible to every downstream system: no capacity, no catchment, no access rule, no adjacency check.
- Cause: host typing derives a room's type from fixture tags, lowest priority wins, and unmatched rooms default to `hall`. Two rooms merged by one gap become one hall; a room drawn without fixtures becomes a hall; and the hall tag makes the tiles count as circulation in FL-01.
- Detection: `typingAudit()` — per floor: list every derived room with `tag = hall` and area ≥ 8 tiles (2 m²); for each, test (a) `does any programme row claim this area?` (b) `is the room convex and route-like (graph betweenness mass ≥ 0.6 of its tiles)?`; (c) `does it contain fixtures whose tags collide at higher priority?` threshold: fail on any `hall` that is not route-like (a room-shaped hall is a mis-typed room) and on any room whose own tag is beaten by a lower-priority neighbour tag. Report a table: coords, area, perimeter, betweenness share, fixtures found, tag awarded vs expected.
- Prevention: make the tag requirement part of the programme row — every row lists its detectTag fixture and its priority (→ TH-01, TH-02d "an untyped room cannot be validated"); after every wall/fixture edit, run the typing audit inside the blast radius (→ VA-14); treat "no tag match" as an error state, not a fallback.
- Correction: cheapest is to place the correct fixture tag, not to re-draw; only if the tiles genuinely are circulation should they be re-laid as a hall. Cascade risk: awarding the correct tag converts circulation tiles into occupied tiles, so FL-01's share moves, capacity appears, access rules apply (→ FL-13 clean/dirty crossings may newly fail).
- Source: this repository's room-typing spec, **read in code this pass** — `src/blueprint-editor/domain/schema/rooms.ts:4-27` defines 15 room types, each with a `detectTags` fixture-category list and a numeric `priority`: `bedroom`/`living` = 10, `bathroom`/`hygiene` = 20, `spa`/`wellness` = 30, twelve types tie at 40 (`pool`, `kitchen`, `restaurant`, `bar`, `gym`, `lounge`, `laundry`, `conference`, `shop`, `staff-room`, `storage`), `lobby`/`front-desk` = 50 — and `HALL_ROOM_TYPE` at :27 is `{ detectTags: [], privacy: 'open', priority: 999 }`. The fallback is therefore the **only type that can never match**: any room whose fixtures are missing, mistagged, or outside this 15-word vocabulary becomes `hall`. Derivation itself is `src/engine/npc/rooms.ts:6` (`deriveFloorRooms`), called with the floor's door cells at `src/engine/npc/layoutBuild.ts:369`. — T1 code-derived. Method anchors: VA-03 (an untagged room is `unknown`, never `pass`) and VA-07 (model-integrity gate before semantic checks).
- Detection (extended, code-verified): add three tests to `typingAudit()`. (1) **En-suite swallowing** — because a `detectTags` match is evaluated over the room's whole tile-set and the lowest priority number wins, a `hygiene` fixture inside a room that also holds `living` yields `bedroom` (10 beats 20): every en-suite bathroom is invisible to the bathroom checks, including FL-21's wet-stack test and FL-12's privacy test. Fail on any room typed `bedroom` that contains ≥ 1 `hygiene` tile and has no separate bathroom room, and report it as a *typing merge*, not a pass. (2) **Vocabulary gap** — plant room, bin store, WCs, housekeeping pantry, MEP shaft and lift lobby have no room type at all; the only BOH carriers are `back-of-house` → `staff-room` and `storage` → `storage`. So FL-15's storage check must run on `storage`-tagged tiles, and every service space that is not a staff room or a store lands in `hall` — meaning on this host FL-07 and FL-15/FL-16 are the same defect seen from two ends. (3) **Privacy field** — the spec's `privacy` flag is `private` for only `bedroom`, `bathroom`, `spa`; `storage`, `staff-room`, `laundry`, `kitchen` and `hall` are `open`. FL-12's door list must be read from that field (it is the model's own opinion) and then overridden per programme row, because a staff room and a kitchen are not public.
- Class: ENGINEERING CONSTRAINT
- Scope: this host and any tag-derived-typology model; conceptually general ("what you cannot name you cannot check")
- Severity: Critical — every downstream check silently passes on an invisible room; it corrupts the oracle itself.
- Confidence: High; the validation-hygiene half (an untagged room must be an error, never a silent fallback) is enforced at code-requirement strength by this repo's own checks
- Exceptions: genuine halls, atrium floors, open-plan lobbies, market floors, where the largest space *is* circulation and should be typed as such on purpose. Executed extension: mis-typing is not only collapse to hall - the lowest-numbered tag wins, so dining+hygiene derives as `bathroom` and front-desk+living derives as `bedroom`, silently relabelling revenue space; run the derived-type diff over every room in both directions

### FL-08 Single-portal floor (one way up or down, and it is the lift)
- Failure: a floor reachable through exactly one portal; the queue is the floor's front door; when the portal is closed, occupied, or role-gated, the floor is an island.
- Cause: vertical cores placed late, one per floor, sized by plan convenience; stair/egress portals not modelled; service and guest traffic sharing one portal (→ PP-04).
- Detection: `portalRedundancy()` — build the multi-floor graph with portals as edges; per floor compute `distinct portal groups` (a group = portals within 15 tiles / 7.5 m of each other count as ONE, since they share the same approach), plus `rooms orphaned if group removed`; threshold: fail when a floor has one portal group serving > 8 rooms or > 40 persons of aggregate capacity; fail when any room's only path to an exit uses a role-gated portal it may not have rights to; report portal id, queue length at peak, and the orphan set.
- Prevention: two independent portal groups per floor above the capacity line (one guest, one service/egress), and put them at opposite ends of the circulation loop closed in FL-04; size the lobby queue from arrivals math (→ PP-08).
- Correction: add a stair portal at the far end of the loop, or split one portal into a pair with separate approach lobbies (cheaper but weaker — same group). Cascade risk: a second core eats lettable area and shifts the stack (→ FL-09, FL-20); aligning it with the wet stack may be impossible without FL-21.
- Source: NFPA 101 / IBC Chapter 10 — occupant load above thresholds requires ≥ 2 exits remote from one another (typical separation: 1/2 of the diagonal, or one-tenth of the longest dimension where one exit serves ≤ 1 room) — T1 code-derived; Hyatt Regency walkway collapse, NTSB Report AAR-82-05 (1981) — the canonical demonstration that a single load/flow path is the accident waiting to happen — T1 official after-action report (structural, cited here as the *redundancy* lesson).
- Class: CODE REQUIREMENT
- Scope: type-specific: capacity thresholds and separation rules vary by occupancy; principle is universal
- Severity: Critical — it is a life-safety defect before it is an operational one.
- Confidence: High (principle), Medium (numeric thresholds vary; state jurisdiction and verify); the operational half - a second portal group for service as well as egress - is a design principle, not a code mandate
- Exceptions: a single-cell floor (one master suite, a plant floor, a roof amenity) with tiny occupant load; a mezzanine open to the floor below; a role-gated service floor with 1–2 staff where the stair is the second route by intent.

### FL-09 Stack drift: the core moves floor to floor
- Failure: the lift lobby, the wet cells, the shafts and the stairs do not line up between floors; services bend, corridors kink, and every floor is planned from scratch.
- Cause: floors designed one at a time; the "core" treated as leftover; no building-level invariant maintained.
- Detection: `stackAlignment()` — project each floor's portal tiles, wet-cell tiles, and shaft/blocked-tile clusters onto a common grid; compute per-pair offsets `offset = |centroid(f) − centroid(f+1)|`; threshold: fail if any vertical element's footprint offset ≥ 1.0 m (2 tiles) between adjacent floors, or if a wet stack exists on floor n and not on floor n+1 with the same plan position; report a stack map: element, per-floor centroid in metres, drift vector.
- Prevention: fix the stack section on one sheet before any floor plan (→ PP-17 "fix the stack before the plan"); treat the core footprint as a permanent reserved blocked/walkable set inherited by every floor template.
- Correction: re-centre the *later* floors on the original core (usually cheaper than moving the earlier ones), or accept an offset with an explicit transition floor whose plan is documented as the exception. Cascade risk: moving a core re-routes every floor's circulation loop (FL-01, FL-04) and can orphan catchments (FL-15).
- Source: VA-16 (this repo: building-level checks use the multi-floor graph; vertical alignment is a first-class invariant) — T1 derived; PP-17 — T1 derived; Stewart, *Practical Design Life of Building Components*, and Stewart & Roskilly, "Design life of building material and component subsystems", *Building and Environment* 41(1), 2006 — T2 peer-reviewed (shared service routes must be continuous to be maintainable).
- Class: DESIGN PRINCIPLE
- Scope: universal for multi-floor buildings with wet or vertical services
- Severity: Major — Critical when the drifting element is the egress stair or a waste stack.
- Confidence: High; the alignment rule is design-side, and only reaches code-requirement strength where the drifting element carries a services-continuity duty or is the egress stair
- Exceptions: towers with a deliberate podium/vertical transition (lobby floors, sky lobbies, transfer floors), and conversions where a new core is inserted in an existing shell.

### FL-10 Wayfinding overload (too many decisions, not enough signs)
- Failure: occupants reach a junction and cannot tell where they are; trips lengthen; staff are asked for directions; the model shows NPCs idling or thrashing at thresholds.
- Cause: symmetric repeated door arrays, corridors of uniform width, no landmark at decisions, more than necessary route choices, room numbers placed on no pattern.
- Detection: `decisionLoad()` — from the walkable graph compute junctions (degree ≥ 3) and count per 30 m of main route; compute `mean visible choices at each junction` from the junction tile with octile line-of-sight on the grid (a tile is visible if the straight line between centres crosses no blocked tile); threshold: fail at > 3 route choices per 30 m of public route, or > 4 visible doors at any junction; report each overloaded junction, its degree, doors in sight, and its distance to the next junction.
- Prevention: give every junction a reason (a window, a change of width, a landmark room); keep corridor width constant along a route and change it only at thresholds (→ PP-12, PP-21); prefer loops with named nodes over trees (→ FL-04).
- Correction: block a door (relocate it behind a wall) to cut a choice, or break symmetry by moving one door 1 tile — both cheap; add a niche/alcove at the offending junction. Cascade risk: blocking a door can orphan a room (→ FL-04) or split a room (→ FL-06).
- Source: Peponis, Zimring, Xie, Karydis et al., "Finding the building you are looking for: layout legibility and wayfinding", *Environment and Behavior*, 2006, and the associated Hartsfield-Jackson / Emory programme — T2 peer-reviewed (legibility measured, not asserted); PP-21 (this repo: wayfinding is a decision-point count) — T1 derived.
- Class: DESIGN PRINCIPLE (the prevention)
- Scope: universal for public and guest floors; irrelevant for a private dwelling
- Severity: Moderate — Major in hospitals, large hotels, and any emergency-egress-critical plan.
- Confidence: Medium; POE-measured legibility backs the standard, while the 3-choices-per-30 m and 4-visible-doors cut-lines are our heuristics — was `STANDARD`; demoted: a peer-reviewed legibility finding (Peponis et al. 2006) is evidence, not a standard, and no wayfinding code document was opened [classification: the rule also carries HEURISTIC for its part of the claim - the field holds one label per spec §27]
- Exceptions: deliberate disorientation as a programmatic device (retail loop forcing pass-by, museum promenade), and secure facilities where legibility to outsiders is a threat.

### FL-11 Bad adjacency (incompatible activities share a wall or a door)
- Failure: kitchen against bedroom, bin store against restaurant entrance, plant room against nursery, laundry against office — noise, odour, dirt, and waiting.
- Cause: adjacency matrix never written, so rooms were placed by shape-fit; only area was optimised.
- Detection: `adjacencyMatrixCheck()` — for every ordered room pair sharing a wall tile, or a door, or separated by < 1.5 m (3 tiles) of walkable, look up the programme's relationship code (F = must be near, C = compatible, S = must separate, N = neutral); fail on any `S` violation and on any `F` violation where graph distance > 2 doors; report pairs, the tile contact length in metres, separation achieved, and the violated code.
- Prevention: write the relationship matrix before the first tile (→ TH-01) and check it as a matrix, not as a feeling; provide a buffer row where `S` is unavoidable (a corridor, a store, a stair) — the buffer must be *programmed*, never a sliver (→ FL-05).
- Correction: swap the two offending rooms (usually the smaller/more flexible one), or insert the programmed buffer using adjacent slivers. Cascade risk: a swap moves both rooms' doors and can break catchments (→ FL-15) and the stack (→ FL-09).
- Source: Problem seeking: Rand, Parker & Zimring, *Problem Seeking: Environmental Analysis in Architecture and Planning*, 5th ed., Routledge — the standard adjacency-matrix method — T3; the Gustin programming-matrix artefact cited in architecture-theory.md TH-01 — T4; PP-16 (sound as plan geometry) — T1 derived.
- Class: DESIGN PRINCIPLE
- Scope: type-specific adjacency table, universal method
- Severity: Major — Critical when the pair is clean/dirty or waste/food (→ FL-13).
- Confidence: High (method), Medium (per-pair tables); the matrix method is a design principle - which room pairs score S is a building-type convention, not a universal judgement
- Exceptions: hotel guest-over-guest stacking (a bedroom above a bedroom is fine), and open-plan combinations where the "adjacency" is a furniture layout problem, not a wall problem.

### FL-12 Privacy exposure: line of sight straight into a private door
- Failure: from a public corridor or lobby you can see into a bedroom, a bathroom, a staff room, or straight down a private corridor; doors stand shut, and the space still fails.
- Cause: doors placed on the shortest path without a threshold; corridor axis pointing at a door; no vestibule; glass modelled as walkable so sight is not blocked by the tile state.
- Detection: `losPrivacy()` — for each public/`hall` tile P and each private room door tile D: cast an octile straight line P→D and fail if unobstructed (no blocked tile between) *and* the line enters the room past the door (continue the ray 6 tiles / 3 m into the room; fail if ≥ 2 room tiles are hit, i.e. you can see the far side). Threshold: fail if any door of a bedroom/bathroom/staff room is directly visible from a public route within 6.0 m (12 tiles) at an angle within ± 30° of the door normal. Report door coords, observer tile, distance, and the intrusion depth.
- Prevention: never set a private door facing a public route; use an offset (45° or a 1-tile dog-leg vestibule) or place a buffer room; give every private cluster a threshold room rather than a door in the open (→ PP-15).
- Correction: move the door 1–2 tiles along the wall (cheapest), add a screen tile row in the room (costs a room tile), or re-route the corridor axis. Cascade risk: moving a door changes which room it serves and can trigger FL-06/FL-07; a screen tile may cut the room in two (→ FL-06).
- Source: Zimring & Gill, "Design quality and residential burglary", *Environment and Behavior* 25(5), 1993 — natural surveillance and territorial reinforcement measurably reduce burglary; Zimring, "Privacy support in shared hospital rooms" (and related POE work on visual privacy in healthcare), *Environment and Behavior* — T2 peer-reviewed; Coleman, *Utopia on Trial*, 1985 — T3 documented case critique (defensible-space failures in UK housing); Newman, *Defensible Space*, 1972 — T3.
- Class: STANDARD (POE-evidenced)
- Scope: universal; which doors count as private is type-specific
- Severity: Major — Critical in healthcare, mental-health, custody, and any room changing a person's state of undress.
- Confidence: High
- Exceptions: deliberately supervised doors (nurse station sightline to patient, reception to waiting, staff room visible from the desk) where *visibility is the requirement* — check it as the opposite test (→ PP-20).

### FL-13 Clean/dirty crossing and service–public conflict
- Failure: soiled linen, waste, or food crosses the same tiles as guests, clean product, or the entrance queue; on the grid it is the same tiles, and it is invisible in the tally.
- Cause: one service spine serving both directions; back-of-house treated as leftover (→ PP-02); no role/access partition of the walkable graph.
- Detection: `flowCrossing()` — build separate graphs per user group (role-tag access sets) and per flow (clean, dirty, food, waste, guest, staff); compute the shared-tile set and count each pair's crossings as `sum over tiles of (flow_a uses tile) AND (flow_b uses tile)`; threshold: fail at ≥ 1 crossing between clean and dirty flows, ≥ 1 crossing of waste/food at any point, > 3 tiles of shared route between service and guest flows at peak hour; report a crossing map with tile coords and the flows involved, and the trip counts per crossing tile.
- Prevention: separate the verticals (→ PP-04), give waste its own room and its own exit (→ PP-05), plan the staff day as a one-way circuit (→ PP-06), and put dirty routes next to service cores and clean routes next to the guest spine.
- Correction: reverse the phase (dirty at night) — free, and often genuinely best — otherwise duplicate the link, or move the receiving room (bin store/soiled-linen chute) to the far end of the loop. Cascade risk: a second service link costs lettable area and can create a pinch (→ FL-02) or a dead end (→ FL-03) at its ends.
- Source: PP-01 (this repo: count clean/dirty crossings before you count squares), PP-04, PP-05, PP-06 — T1 derived; healthcare infection-control planning: WHO *Guidelines on Core Components of Infection Prevention and Control Programmes at National and Facility Level in the WHO European Region* (2019) — T1 official guidance (one-way clean/contaminated flows, hand-hygiene at thresholds); UK Health Building Note HBN 002-01 *Acoustics* and Health Building Notes on hospital circulation — T1 official (NHS) guidance on clean/dirty routing separation.
- Class: CODE REQUIREMENT
- Scope: type-specific: mandatory in healthcare and food, strong convention in hotels, weak in residential
- Severity: Critical — a hygiene and safety defect, not an efficiency one.
- Confidence: High; code- and guidance-derived (WHO, HBN) in healthcare and food, and only a standard-practice convention for other building types
- Exceptions: small facilities (a kiosk, a single-cell B&B) where everything is one room and phase separation is the only available control — record it as a documented exception, do not silently pass.

### FL-14 Acoustic adjacency failure (quiet room next to loud, with no mass or buffer)
- Failure: guests hear the ice machine, the corridor conversation, the bathroom fan, the room above; complaints dominate and the plan cannot be fixed without a strip-out.
- Cause: walls placed where structurally convenient, not where sound needs continuity; a door or a services gap punched through the party line; heavy plant on a lightweight wall; identical rooms stacked without a floating floor (which this grid cannot even represent).
- Detection: `soundPathScan()` — for each pair of rooms, find the shared wall tile run length L in metres and detect any door/service tile *inside* that run; count `discontinuities = door tiles + non-wall tiles within the run`; threshold: fail if any bedroom shares a wall with a plant/kitchen/lobby/stair, or if the party run between two quiet rooms has ≥ 1 discontinuity, or if the separating path length is 0 tiles (rooms touching across an open front). Also flag `door-to-door within 2.0 m (4 tiles)` between two rooms' entry doors facing a shared corridor (a corridor-turn privacy and noise path).
- Prevention: put the noisy rooms in a continuous band along one side, quiet rooms on the other, with a programmed buffer spine between (→ PP-16 treat sound as plan geometry); never break a party line with a door that both rooms want.
- Correction: re-house the noise source (usually the cheapest real fix — move the plant, not the wall); or add a buffer room by relocating one door (→ FL-12 technique); or increase the run length by offsetting the doors. Cascade risk: moving plant can break the stack (→ FL-09/FL-21) and may push it into a catchment (→ FL-15).
- Class: CODE REQUIREMENT
- Severity: Major — Critical in healthcare, and the leading complaint driver in hospitality.
- Confidence: High (method), Low (numeric dB thresholds are unrepresentable on this grid); the classification is code-derived only where an approved-document-style party-wall performance rule is adopted - elsewhere it is acoustic standard practice
- Exceptions: single-occupancy units where the "party wall" is a facade, and any plan that assigns rooms by acoustic zoning from the start, where a shared line with one door is acceptable because the door is the same leaf assembly.
- Source: UK Approved Document E (England), *Resistance to the passage of sound* — new-dwelling party-floor/wall minimum performance (e.g. 40 dB DnT,w + C for walls/floors between dwellings) with pre-completion testing — T1 code-derived; Building Bulletin 93, *Acoustic Design of Schools* — T1 official (DfE); Olsson, Landgren, et al. on low-frequency sound and planning limits, *Journal of Low Freq Noise, Vibration, Active Technology* — T2 peer-reviewed; PP-16 (this repo) — T1 derived.

### FL-15 Storage missing or out of reach (catchment overflow)
- Failure: no room for the things each activity must keep — linen, luggage carts, cleaning trolleys, spare keys, luggage, dry goods, waste bins; the storage exists but is 40 doors away, so the work pattern collapses and corridors fill with trolleys.
- Cause: storage never got a programme row; the grid only counts what has fixtures, and empty storage has none (→ FL-07); catchment was assumed rather than measured.
- Detection: `catchment()` — for each service room type (housekeeping, linen, store, bin, plant) compute `served rooms = those whose door's shortest A* path to the nearest such room ≤ budget`; threshold: housekeeping/linen ≤ 12 rooms per cart run and ≤ 30 m (60 tiles) round trip from a guest door to store and back; general storage ≤ 20 % of the trips it serves within the same floor; fail when a floor has zero storage tiles, or when any served room's nearest store is on another floor. Report per floor: storage tiles, rooms served per store, longest access distance in metres, and rooms over budget.
- Prevention: give every activity its store in the programme row (→ TH-01) and treat BOH as a fixed share (→ PP-02); bound each cart/staff catchment before placing rooms (→ PP-03).
- Correction: convert the nearest sliver or a redundant buffer into store and tag it (→ FL-05, FL-07); if no tile is available, split the floor into two catchments with a second portal (→ FL-08) — expensive. Cascade risk: a new store needs a door (→ FL-06/FL-12) and eats a room below minimum area (→ FL-05).
- Source: Neufert, *Architects' Data*, 3rd ed., Wiley — storage and ancillary area as a percentage of the principal space — T2; Kasavana & Smith, *Managing Better Hotels*, Cahners, 1982 — hotel F&B/back-of-house area ratios and service adjacency as a revenue constraint — T3/T2 hospitality standard text; PP-03 (bounded catchment) and PP-09 (multi-purpose rooms need a furniture store) — T1 derived.
- Class: DESIGN PRINCIPLE (the universal omission check)
- Scope: type-specific budgets, universal omission
- Severity: Major — the failure is chronic and invisible in the drawings; escalate to Critical in healthcare (sterile storage) and food (dry/cold storage).
- Confidence: Medium (12-room figure is industry practice, not a published constant); the omission check is universal, while the specific storage budgets are building-type conventions by occupancy — was `STANDARD`; demoted: no body publishes the per-room or per-100-bed storage figures used here, they are recalled industry practice [classification: the rule also carries BUILDING-TYPE CONVENTION for its part of the claim - the field holds one label per spec §27]
- Exceptions: just-in-time operations with external supply (a fully outsourced laundry, a vending-only floor) where "no store" is the design intent — must be stated in the brief, not inferred.

### FL-16 There is no maintenance path (the thing cannot be reached, removed, or tested)
- Failure: a pump, valve, duct riser, or appliance is inside a room with no door, behind a wall, or 1-tile-far from a wall so no person fits; the model has no way to express "cannot reach", so nothing fails until a technician arrives years later.
- Cause: the plan optimises use, not upkeep; access tiles and removal routes are an afterthought; services drawn over the layout (→ PP-18, PP-19).
- Detection: `removalPath()` — for every fixture-tagged plant/service tile, verify (a) ≥ 1 walkable access tile adjacent (an NPC can stand there), (b) a continuous corridor of ≥ 2 tiles (1.0 m) wide from that tile to a portal or the floor edge with no door narrower than 2 tiles, (c) the item's own footprint fits that corridor, and (d) the access tile is not claimed by another fixture's reservation (→ PP-14 door reservation logic); fail when any of (a)–(d) is false, and fail when the only route requires crossing a role-gated door the maintainer's role cannot open. Report per item: coords, blocked-at tile, failing condition.
- Prevention: reserve the maintenance network at the same time as the circulation network (→ PP-18 services band); give every plant item a standing tile and a removal line in the programme; never put plant inside a room whose only door is a guest door.
- Correction: add a access door (watch FL-06), or relocate the item to the corridor side of the wall; if the item is unreachable in a void the model cannot see (above a ceiling), record `unknown` — do not mark pass (→ VA-03, VA-10). Cascade risk: a new access door opens a privacy or crossing path (→ FL-12, FL-13).
- Class: CODE REQUIREMENT
- Severity: Major — Critical when the unreachable item is a fire valve, a stopcock to a wet area, or an electrical panel requiring clearance in front (which this grid cannot represent → report unknown).
- Confidence: High (method), Low (numeric clearances — no 3rd dimension); statutory as a duty of access for inspection and repair in most regimes, while the removal-path geometry behind the check is an engineering constraint
- Exceptions: sealed-for-life components and items reachable from an inspection hatch this grid does not model — record explicitly as a capability limit (→ VA-10).
- Source: UK Hackitt Review, *Building a Safer Future: Independent Review of Building Regulations and Fire Safety* (2018) and the subsequent Building Safety Act 2022 "golden thread" of accessible, up-to-date information — T1 official after-action report; Stewart & Roskilly, "Design life of building material and component subsystems", *Building and Environment* 41(1), 2006 — T2 peer-reviewed (components fail long before the building; access to them is a design decision); PP-19 (this repo) — T1 derived.

### FL-17 Portal-queue overflow (the lift lobby is the bottleneck)
- Failure: vertical capacity is planned by hope; queues back into the corridor, blocking doors, and A\* reroutes around the crowd, which lengthens every trip and blocks the egress path.
- Cause: too few portal tiles, lobby too small to hold the queue, peaks (arrivals, checkout, show call) unmodelled, and one portal serving both guest and service traffic (→ PP-04).
- Detection: `queueOverflow()` — sum per-floor peak demand `persons_in = arrivals in the busiest 5-minute interval` (for a hotel floor: `rooms × 0.5` at checkout peak as a starting heuristic); compute `lobby holding capacity = walkable tiles in the lobby set × 0.2 m²/person (standing)`; portal throughput = `portals × 8 persons / cycle`, cycle = 60–90 s; fail if `queue > lobby capacity` or `wait > 60 s` at peak; report portal id, peak demand, arrival rate, wait estimate, overflow tiles (where the queue spills) and whether spill blocks a door.
- Prevention: size the lobby from arrivals math (→ PP-08), not from grandeur; give the queue a dedicated volume so spill goes into the lobby, not into a door; separate service portals (→ PP-04).
- Correction: widen the lobby into adjacent slivers (→ FL-05), add portal tiles, or split the peak operationally (staggered checkout) — the last is free but shifts the failure to operations. Cascade risk: a bigger lobby inflates circulation share (→ FL-01) and may cross the clean/dirty line (→ FL-13).
- Class: STANDARD
- Scope: type-specific (hotel/office/hospital peaks differ radically)
- Severity: Major — Critical when the queue spills onto the egress route.
- Confidence: Medium; the traffic arithmetic is standard (CIBSE Guide D), the 0.5-person-per-room checkout peak is our heuristic — class kept: the admitted heuristic is the *input* (checkout peak, standing density), not the arrivals-in-5-minutes method the rule states
- Exceptions: low-peak buildings (a library, a small office), amenity floors where a queue is a social queue, and buildings where the portal is a stair and the "wait" is intentional.
- Source: PP-08 (this repo: size FOH queue from arrivals math); Elevator World and CIBSE Guide D *Transition in Buildings* (lift traffic analysis, waiting-quality bands, 5-minute handling ≥ 11–13 % standard for offices/hotels) — T2/T1 professional guidance.

### FL-18 Windowless long-occupancy room
- Failure: a room people sleep, work, or wait in has no daylight; it reads as a plan square, and the model has no `window` tile state, so the defect is invisible to every automatic check.
- Cause: interior rooms bought with the deepest part of the plate; the core parked against the perimeter; daylit faces allocated to circulation.
- Detection: `daylightReach()` — since windows are not tile states, define the proxy: a room is "daylit" if any of its tiles is ≤ 1 tile from a perimeter blocked tile that is tagged as a facade/opening element, or where an explicit fixture/window tag exists; then compute `long-occupancy rooms = programme rows with occupancy ≥ 2 h`; fail on any long-occupancy room with zero daylit tiles, and fail on any habitable room whose daylit area share < 30 %. Report room, area, daylit tiles, share, occupancy class, and — critically — the model-integrity note `window state not representable; check is proxy-only` (→ VA-03, VA-07).
- Prevention: give the perimeter to occupied rooms and put the core, stairs, storage and services in the middle band — the single highest-value move on a deep floor (it fixes FL-18, FL-19, FL-11 and FL-15 at once); put the daylit faces in the programme row as a requirement (→ TH-01 "environmental need").
- Correction: relocate the room to a perimeter slot with a neighbour of equal area (swap), or shorten the room by pushing the far side into a corridor nook, or accept it as a support space and *retag it* so it stops pretending to be habitable. Cascade risk: a swap moves doors and catchments (→ FL-15) and may break the wet stack (→ FL-21).
- Class: CODE REQUIREMENT
- Scope: type-specific; universal for bedrooms and living rooms, optional for hotels' secondary rooms
- Severity: Major — Critical for residential bedrooms and hospital patient rooms; Moderate for a hotel meeting room.
- Confidence: High (health evidence), Low (the grid proxy); the classification is code-derived only where the jurisdiction adopts residential daylight/habitability rules (IBC 1207) - otherwise the daylight case is standard practice plus health evidence
- Exceptions: theatres, cinemas, plant rooms, server rooms, darkrooms, retail back-of-house, spas, and any room whose function requires darkness; windowless is *normal* in inner-core hotels with atrium sections.
- Source: IBC (2021) §1207 *Daylight* — required daylight aperture for residential rooms (in part: rooms designed for living/sleeping/dining in Group R-2 dwellings require a window opening of ≥ 8 sq ft / 0.75 m² facing a street, yard or court of adequate width) — T1 code-derived; WHO *Sick Building Syndrome* (WHO Regional Office for Europe, Copenhagen, 1984) — T1 official; Lin, Browning, Valenzuela, Zimmermann, "Psychological benefits of daylight via the biological effect of circadian rhythms in occupants of buildings", *Frontiers in Public Health*, 2017 — T2 peer-reviewed review; Kueger, "Daylight and productivity" and the Heschong Mahone Group *Daylighting in Schools* study (1999) — T3/T2 (student achievement gains 5–20 % with more daylight; heavily debated methodology).

### FL-19 Deep plan: single-aspect rooms and borrowed light that never arrives
- Failure: the plate is too deep, so half of every room is artificially lit at noon; the "daylight" came from a 2-tile light well nobody can clean, or from a window facing another window 2 m away.
- Cause: plot coverage maximised without checking the daylight depth; floor-to-window geometry never drawn; no section, so the shadow is invisible (this host has no heights at all — the defect is worse than usual).
- Detection: `depthCheck()` — for each room compute `daylight depth = max octile distance from a daylit tile to the farthest room tile`, and `depth / distance-to-opposite-facade ratio`; threshold: fail where room depth from the glazing line > 2.5 × (floor-to-window-head height), which on this grid must be *assumed* (state the assumed storey height as an input, e.g. 3.0 m → 7.5 m / 15 tiles); fail when the glazed tile's opposite face is < 3.0 m (6 tiles) away and belongs to another habitable room (a well that reads as light but is a shaft). Report room, depth in tiles, assumed head height, ratio, and opposing-face distance.
- Prevention: cap the plate depth at design stage from the daylight rule, then fit the programme inside it; put the required-but-windowless functions in the middle.
- Correction: subdivide the room so every part is shallow (adds walls, costs area), introduce internal light-doors into a buffer room (breaks privacy/acoustics — check FL-12/FL-14), or accept and re-classify the space as support. Cascade risk: subdividing creates slivers (→ FL-05) and retypes rooms (→ FL-07).
- Class: HEURISTIC
- Scope: universal at plan level; numeric form depends on height data
- Severity: Moderate — Major when combined with FL-18 in the same room.
- Confidence: Medium (the physics is real; the input is invented); the depth-to-head rule is applied here as a heuristic because it needs a section the model does not have — was `STANDARD`; demoted: the depth-to-head-ratio rule is a planning guide, and on this host the window-head height it needs does not exist, so the number it returns is a working value rather than a standard's limit (compare EN-06, which carries the same rule under a daylight standard)
- Exceptions: industrial, retail, storage, data halls, and any building where the plate depth is set by structure or process rather than occupancy; atrium/daylight-pipe schemes where the light comes from above (unrepresentable → `unknown`).
- Source: UK *National Descriptions for daylight and sunlight assessment* / BRE Report 245 *Site Layout Planning for Daylight and Sunlight* — vertical sky component 27 % for habitable rooms, daylight-factor targets by room category — T1 official guidance; Heschong Mahone Group, *Daylighting in Schools* (1999, PSMED/California) and *Proof of the Energy Benefits of Daylighting* (2002) — T3/T2; IES *Lighting Handbook* daylighting section, and Bor, van Bommel, Boisselier 2018 *Daylight Inside* — T2/T3.

### FL-20 Structural discontinuity (floating bearing line, out-of-range span, offset core)
- Failure: a wall exists in the plan with nothing under it; a 6 m span appears over a corridor while a 1.2 m span is "supported" by a glass screen; upper floors hang on a line that stops two storeys down; the core steps out and no transfer is drawn.
- Cause: plans drawn as free geometry, with structure assumed to "sort itself"; the host has no section, so gravity is invisible; walls are one tile thick and every wall looks identical to a partition.
- Detection: `loadPath()` — maintain an explicit bearing-grid overlay (a parallel blocked-tile set tagged `structural`, or a JSON line grid) and test per floor: (a) every structural wall tile on floor n has a matching structural tile on floor n−1, or an explicit transfer element declared and spanned (fail otherwise); (b) no unsupported span between structural supports > declared limit (start from 4.0 m / 8 tiles for a nominal floor slab and state the assumption); (c) core footprint continuous (reuse FL-09 output). Report each floating line with its floor, its coords, and the element claimed to carry it. If no structural overlay exists in the model at all, the verdict is `unknown` for the whole class — not pass (→ VA-03, VA-10).
- Prevention: fix the structural grid (module, span limit, core positions) before any floor plan, exactly as the stack is fixed before the plan (→ PP-17); reuse the grid as a template on every floor.
- Correction: continue the line down (usually means thickening or relocating a room wall — check FL-14 and FL-05), or accept and declare a transfer element with its depth reserved in the plan (→ FL-22 services band), or delete the load-bearing wall and re-span the floor. Cascade risk: relocating a structural line moves everything above it across every floor (the Hyatt lesson: a local change doubles a distant load) — re-run the whole stack after any single change (→ VA-14).
- Class: ENGINEERING CONSTRAINT
- Scope: universal in multi-storey construction
- Severity: Critical — collapse risk; the top band of the severity ladder below safety.
- Confidence: High (principle), Low (host has no structure carrier; the check needs a new data model); the load-path physics is an engineering constraint that holds whether or not the code is quoted — was `CODE REQUIREMENT`; demoted: no clause was opened and the load-path continuity duty is being carried here by physics, not by a cited code text
- Exceptions: single-storey or steel/concrete-frame buildings where internal walls are all partitions — but then say so, and the check applies to the frame grid instead; suspended/raised floors and trussed systems where loads bypass intermediate floors legitimately, provided the bypass is drawn.
- Source: Ronan Point collapse, London 1968, and the subsequent inquiry and *Building Regulations* amendments introducing the requirement for continuous load path and tie elements — T1 official after-action (this is the canonical demonstration that a missing tie/discontinuity is fatal); NTSB Aircraft Accident Report AAR-82-05, *Hyatt Regency Walkway Collapse* (1981) — T1 official (a design change at one connection doubled the load on the hanger rods above); Ching, *Building Construction Illustrated*, 5th ed., Wiley (load path, bearing walls, span tables) — T2 standard text.

### FL-21 MEP stack break: a wet cell is not over a shaft
- Failure: a bathroom, kitchen, or laundry on floor n sits over a bedroom on floor n−1; the waste pipe must run 6 m across the slab, needing a drop ceiling nobody wants, or the cell is simply impossible to build.
- Cause: floors designed independently; wet cells placed for plan convenience; no stack map maintained (→ PP-17); the host has no heights, so pipe falls cannot be checked at all.
- Detection: `stackMap()` — collect all tiles tagged with water fixtures (bath, shower, sink, kitchen, laundry, WC) per floor; compute the fixture cluster centroids; overlay across floors; fail when a wet cluster on floor n is > 2.0 m (4 tiles) from the same cluster type on floor n−1 (no stack continuity), or when it lies over a room on the floor below that is a bedroom/living/quiet room; also fail on a cluster whose waste run to the nearest stack > 4.0 m (8 tiles) at an assumed 1:40 fall (the fall consumes height the model does not have → report the height cost as `unknown`, but flag the run length as measured). Report per cluster: floor, centroid, nearest stack, run length in metres, room below.
- Prevention: fix the wet-stack template before the first floor and inherit it; keep wet cells as a repeating module on one wall of the core (→ PP-17); reserve the stack footprint as blocked tiles so no floor steals it (→ PP-18).
- Correction: mirror the wet cells floor-to-floor (cheapest, may cost a room tile), relocate the cell to the stack side of the room (usually free), or consolidate several clusters into one shared wet wall and shorten the run. Cascade risk: relocating a wet cell crosses FL-11 adjacency and FL-15 catchment; mirroring changes room shapes and can produce slivers (→ FL-05).
- Source: PP-17 (this repo: fix the stack before the plan) and PP-18 (services band) — T1 derived; Neufert, *Architects' Data*, 3rd ed. — wet-room/service-core planning and stack offsets — T2; CIBSE Guide H *Building Drainage Services* (fall limits, no. of branches before offset, self-cleansing velocity) and BS EN 12056-2 gravity drainage — T1/T2 professional standards.
- Class: ENGINEERING CONSTRAINT (gravity drainage)
- Scope: universal for any building with water above the ground floor
- Severity: Major — Critical when the conflict is a wet room above an occupied room below with no accessible trap (both FL-16 and a leakage risk).
- Confidence: High; code- and standard-strength via the drainage rules (BS EN 12056-2, CIBSE Guide H); outside a drainage regime it is standard practice — was `CODE REQUIREMENT`; demoted: the drainage codes regulate falls, sizes and cleanouts (that limb is CN-17), they do not require a wet cell to sit over a shaft; the alignment rule is the engineering consequence, and the 4-tile offset bound in Detection is a project value [classification: the rule also carries DESIGN PRINCIPLE for its part of the claim - the field holds one label per spec §27]
- Exceptions: podded/bathroom-pod construction (pods bring their own stack position and can be placed anywhere with a riser), and single-storey or upstand-scheme floors.

### FL-22 The services band gets sold: duct, riser and valve space eaten by lettable area
- Failure: the corridor wall line is clean in the plan because the 450 mm duct band was deleted to gain 15 tiles of room; on this grid the deletion is invisible — no heights, no voids — and the resulting plan cannot be built, or gets built with the duct through the room.
- Cause: services treated as a later trade; the band read as "spare wall thickness"; no reservation register maintained.
- Detection: `servicesBand()` — for each route carrying > 1 room's services (the plan test: a wall line adjacent to ≥ 3 wet/kitchen/restaurant/plant rooms on consecutive floors), check a reserved parallel tile run of ≥ 1 tile (0.5 m) along it, present on every floor in the same place; threshold: fail where the reserved band is absent, or where fixtures on that line require an aggregate band width beyond one tile (state the assumption: 1 tile ≈ 0.5 m covers small services only; main ducts need 1.5–2 tiles). Report each candidate line, band present yes/no, tile count, and the load it must carry. If the model has no services carrier, verdict `unknown` with a named missing input.
- Prevention: reserve the band in the same step as the circulation (→ PP-18); keep the band continuous with the stack (→ FL-21) so it doubles as the maintenance route (→ FL-16).
- Correction: reinstate the band by taking tiles from the shallower rooms on that side, or re-route services into the corridor ceiling above the *widest* corridor only — the plan then needs a wide corridor, so check FL-02 does not re-fail. Cascade risk: reinstating a band shrinks rooms below FL-05 minimums and may divide a room across its width (→ FL-06).
- Source: PP-18 (this repo: reserve a services band and do not sell the height it eats) — T1 derived; Stewart & Roskilly 2006, *Building and Environment* 41(1) — ducts' design life (45 y) far exceeds fans/pumps/controls (15 y), so service routes must be accessible for replacement — T2; Brand, *How Buildings Learn*, Viking, 1994 — services are the "stuff that changes", and plans that lock them out fail — T3.
- Class: ENGINEERING CONSTRAINT
- Scope: universal for mechanically served buildings
- Severity: Major — the failure is deferred, not absent; escalate to Critical if the deleted band is the only fire-stopping/riser continuity path.
- Confidence: Medium; the band is an engineering constraint of the services, and buildability only becomes a code requirement through maintenance and replacement duties - or fire-stopping and riser continuity where the deleted band was the only path
- Exceptions: naturally ventilated, all-electric-with-outdoor-units, or low-services building types where the band genuinely is not needed — record the assumption; and underfloor/ceiling-void systems whose route is not on the wall line at all (→ unknown on this grid).

### FL-23 Accessibility erosion (the route was accessible when drawn, not when built)
- Failure: the corridor is 1.2 m on the drawing, then a bin recess, a door leaf, and two columns take it down to 0.8 m; there is no level route to the portal; the turning space in front of the lift is a sliver.
- Cause: accessibility checked once, on the empty plan; every later fixture charged against the same width; door reservations ignored (→ PP-10, PP-14); thresholds and ramps unmodelled (no heights).
- Detection: `clearRoute()` — compute the walkable graph and, for each route between a public entrance, a portal, a WC, and any wheelchair-capable room, measure `effective width` = number of tiles in the free strip perpendicular to travel *minus* intrusions (fixture tiles, reserved door swing tiles, structural tiles within the strip); threshold: fail below 0.9 m (2 tiles) anywhere on an accessible route, require 1.5 m (3 tiles) at passing places every 15 m, and require a 1.5 m (3-tile) turning circle in front of each portal and each WC door; report per route: length, min effective width with the offending tile coords, and the intrusion named. Flag every step change as `unknown — no height/level data`.
- Prevention: declare the accessible network first, as a protected tile set nobody may build into; make fixtures intrude *outside* the reserved line, not inside it (→ PP-22 lifecycle: repetition, removal, access); check after every edit within the blast radius (→ VA-14).
- Correction: move the intruding fixture (free, usually), or widen the route locally by gifting the wall line, or re-route around the intrusion using an existing loop (→ FL-04). Cascade risk: re-routing makes the route longer than the travel-distance budget (→ FL-26) and may cross clean/dirty flows (→ FL-13).
- Source: 2010 ADA Standards for Accessible Design §§306.3, 403.5, 600 (36 in / 915 mm min clear width, 32 in / 815 mm at a point for ≤ 24 in, 60 in / 1525 mm turning circle, 60 in passing spaces) — T1 official code-derived; UK Approved Document M / Equality Act 2010 — T1 official; PP-22 (this repo: accessibility risk is mostly route erosion and small fixtures) — T1 derived.
- Class: CODE REQUIREMENT
- Scope: type-specific thresholds (dwelling vs public building); the erosion mechanism is universal
- Severity: Major — Critical when the eroded route is the only accessible route or the only accessible egress (→ FL-26).
- Confidence: High (numeric values are from published standards; the 2-tile mapping needs the rounding policy stated)
- Exceptions: private non-habitable areas (plant cages, roof, staff-only tails behind a role-gated door) and historic buildings with documented impossibility — record as a written exception with the alternative provision (→ VA-13).

### FL-24 The furniture cannot fit (rooms sized for area, not for layout)
- Failure: a room with the right area in m² is unusable: the bed cannot go against the wall it needs, the desk blocks the door swing, two chairs cannot pass, the wardrobe door will not open.
- Cause: area-only programming; rooms that are narrow and long or oddly cut; the host has no dimensioned furniture objects, so layout is never tested — a perfect hiding place for this failure.
- Detection: `fitTest()` — for each room with a programme layout template (hotel bedroom: bed 2.0 × 1.5 m = 4 × 3 tiles plus 0.9 m (2 tiles) side clearance both sides and 0.75 m (1.5→2 tiles) at the foot; bathroom: WC zone 0.9 × 1.4 m; desk zone), test whether a non-overlapping placement exists inside the room's walkable tiles respecting door-reservation tiles (→ PP-14); use a bounding-box + clearance check, not area. Threshold: fail when no legal placement exists; report room, template, largest placed configuration, and the missing dimension in metres. Also fail when the room's free rectangle after reservations < template footprint.
- Prevention: programme by *layout*, not area: every room type gets a tile-fitting template with clearances, and area emerges from the template (this inverts the usual error); reject rooms whose narrow dimension < template + circulation (→ FL-05's 3-tile line is the floor of the check).
- Correction: rotate the template (usually fails on this grid because of the door), shift the party wall by 1–2 tiles (watch FL-14/FL-20), reduce the template's non-essential clearance by a stated amount, or merge two small rooms into one larger one. Cascade risk: shifting a party wall changes two rooms plus the stack plus the bearing line — the cheapest-looking fix is often the most expensive check.
- Class: STANDARD
- Scope: type-specific templates, universal failure
- Severity: Major — Critical when the layout blocks the required egress width (→ FL-26) or the accessible route (→ FL-23).
- Confidence: High; the clearance tables are published standard data, while the accessible-room and egress-obstruction floors (ADA 806) are code requirements where adopted
- Exceptions: flexible/open-plan spaces deliberately left unlayed, and shell-and-core units where fit-out comes later — then state the free rectangle achieved as the deliverable, not the area.
- Source: Neufert, *Architects' Data*, 3rd ed., Wiley — furniture dimension and clearance tables — T2; Ching & Eckler, *Interior Graphic Standards*, 2nd ed., Wiley — circulation around furniture, minimum clearances, accessibility-in-plan data — T2; ADA §806 guest-room and resident-room clearance requirements — T1 code-derived.

### FL-25 Two door reservations overlap (a door that opens into a door, or into a fixture)
- Failure: two leaves swing into the same tiles; a door opens onto a stair-nose-equivalent or onto a bed; the corridor pinch (FL-02) appears only when the leaf is open, which is exactly when someone is passing.
- Cause: doors placed by adjacency logic, not by swing volume; fixtures placed after doors; the host has no door-leaf object, so the reservation is invisible.
- Detection: `swingClash()` — for each door run of width W tiles, reserve a swing rectangle of `W × (W+1)` tiles (a 2-tile/1.0 m leaf reserves 2 × 3 tiles ≈ 1.0 × 1.5 m) inside the room on the hinge side; fail when two reservations overlap, when a reservation covers a fixture tile, another door's route, a portal approach, or a required accessible manoeuvring clear space (→ FL-23), or when the leaf opens across the corridor's effective width below the route minimum. Report both claimants and the shared tiles.
- Prevention: place doors before walls are finalised and reserve the swing as a first-class tile claim in the same registry as structural and services bands; prefer double-acting or slide (no reservation) at high-traffic thresholds where the host supports the tag.
- Correction: reverse the swing (free, but check what it now hits), relocate one door 1–2 tiles along the wall, or convert one to a slide and remove the reservation. Cascade risk: relocating a door can divide a room where the run spans its width (→ FL-06), retype it (→ FL-07), or expose its privacy line (→ FL-12).
- Class: ENGINEERING CONSTRAINT
- Scope: universal
- Severity: Major — Critical when the clashing leaf is on an egress path (a leaf that blocks escape under crowd pressure).
- Confidence: Medium (host has no leaf object; reservation is a modelling convention we impose); the swing volume is a physical constraint and the reservation size a modelling convention this host imposes (no leaf object), while the latch-side and manoeuvring clearances are code where adopted (ADA 404.2.4)
- Exceptions: doors to unoccupied rooms (closets, plant) with a swing into the room's free wall; doors onto open halls where the leaf is against a stop and no traffic passes there.
- Source: PP-14 (this repo: a door reserves floor on both sides, never let two reservations overlap) — T1 derived; ADA 2010 §404.2.4 door-manoeuvre clearances on the latch side and §305 clear floor space — T1 code-derived; Ching, *Interior Graphic Standards* / Neufert door swing and clearance data — T2.

### FL-26 Egress shortfall (occupant load, travel distance, or exit count)
- Failure: too many people for the doors and stairs; rooms too far from an exit; one exit serving a whole floor; the escape route is the congested leisure route. This is the defect that turns other people's bad plans into a casualty count.
- Cause: capacity added room by room without recomputing load; the plan optimises the pleasant route, not the panic route; circulation share and pinch failures (FL-01, FL-02) hide until they are exit-critical.
- Detection: `egressAudit()` — per floor: `capacity = sum over rooms of ceil(area_tiles × 0.25 / programme_area_per_person)`; `required_exit_width = capacity × unit-width factor` (assume 500 mm per 100 persons on level egress, 500 mm per 100 on exit access stair; state the assumption and jurisdiction); `available = sum of door run widths + portal throughput`; `travel = max A* octile path from any room tile to the nearest portal or floor edge, in metres`. Thresholds: fail if `available < required`; if `travel > 30 m` in a common hotel/office dead-end case, or `> 45 m` in a two-direction case (typical IBC Table 1017.2 territory: hotel guest-room exit access travel distance commonly capped near 30 m / 200 ft unsprinklered in R-1, with generous sprinkler allowances — **state jurisdiction, verification required**); fail if `distinct exit groups < 2` above the occupancy line (→ FL-08). Report the room/zone, load, required, provided, worst travel, and the tile the distance breaks at.
- Prevention: put the egress budget in the programme, before the first tile, and recompute it *after every capacity change* (→ VA-14); two exits at opposite ends of the FL-04 loop; no pinch on an egress route (→ FL-02); no dead end (→ FL-03).
- Correction: widen the door run and the route (cheapest), add a portal (→ FL-08), reduce capacity (the honest last resort — remove beds, not width), or add a second protected route. Cascade risk: widening an exit door and its route eats lettable tiles and typically fails FL-01 — but FL-26 outranks FL-01 on the ladder, always.
- Class: CODE REQUIREMENT (life safety) — the highest-certainty class in this file
- Scope: universal in occupied buildings; every numeric threshold is jurisdiction/type/occupancy-specific
- Severity: Critical — safety is band 2 of the ladder and nothing below it overrides it.
- Confidence: High (principle), Medium (numbers must be re-derived per jurisdiction; never say "compliant" → VA-04)
- Exceptions: single-room dwellings, very small occupant loads (typical code allows one exit for ≤ 49 occupants in many occupancies, subject to travel distance), and open-air or single-level uses with a direct-to-outside door from every space — record the load that justifies it.
- Source: IBC Chapter 10 *Means of Egress* (occupant load §1004, egress capacity §1005 with 0.2 in per occupant, exit access travel distance Table 1017.2, number of exits §1006.3) and NFPA 101 *Life Safety Code* — T1 code-derived; UK Approved Document B (means of escape, travel distances, exit width) — T1 official; *London Fire and Emergency Planning Levy / Grenfell Tower Inquiry Phase 1 Report* (2019) and the Hackitt Review (2018) — T1 official after-action (evidence that plan-level egress and information failures are lethal).

### FL-27 Crowding reroute thrash (the plan only works when nobody is using it)
- Failure: because A\* gates diagonals on both orthogonal neighbours being open *and unoccupied*, occupancy changes the path: a crowd on the main street makes every route around it longer, NPCs fan into secondary corridors, and the plan oscillates as load moves.
- Cause: capacity planned on the empty grid; the only wide route is one route; no parallel loop; pinch tiles (FL-02) sit on the demand peak.
- Detection: `dynamicReroute()` — run the trip simulation twice: (a) with no occupancy, (b) with peak occupancy loaded on the top 20 % tiles by betweenness; compute per-trip cost increase, and the count of trips whose *chosen path changes*; fail if `p90 trip cost increase > 25 %` under peak load, or if `> 30 %` of trips reroute, or if any room's door becomes unreachable at peak; report the tiles whose occupancy caused the reroute, ranked by induced cost in tile-steps. This is the grid's version of "the plan works on paper".
- Prevention: parallel routes with genuine redundancy (→ FL-04), avoid single-tile links on high-betweenness paths (→ FL-02), spread demand with multiple destinations per activity (two stores, two portals).
- Correction: widen the trigger tiles, add a bypass link (usually a 2-tile through-door in an existing wall — check FL-06), or redistribute loads so fewer trips share one street (move a service room, → FL-15). Cascade risk: a bypass through a private room is a privacy failure (→ FL-12) and a clean/dirty crossing (→ FL-13).
- Class: ENGINEERING CONSTRAINT
- Scope: this host's A\* model; conceptually, any agent-based crowd simulation
- Severity: Major — Critical when the thrash occurs on the egress route (an evacuation that reroutes into a dead end).
- Confidence: Medium; the peak-load trip-cost and reroute-share thresholds are heuristics, not measured constants
- Exceptions: buildings with negligible simultaneous occupancy (a church, a gallery on a weekday) and where the diagonal-gating cost is the point (a deliberately single-file, rate-limiting threshold).
- Source: architecture-theory.md grid constants and the derived octile cost note (this repo, T1 code-derived); PP-12, PP-13 (bends as throughput tax; desire-line detour tolerance 20–30 %) — T1 derived; Peponis et al. (2006) and the space-syntax line that movement is predicted by configuration — T2.

### FL-28 Non-standard geometry bought for the gesture (the diagonal tax)
- Failure: angled or curved walls on a 0.5 m tile grid produce stair-stepped runs, mismatched room widths, dead slivers, broken bearing lines, and 40 % more joints on site — and it never shows in the render.
- Cause: form-driven layout; the grid treated as a rendering detail rather than a construction constraint; "one-off" elements accepted without counting them.
- Detection: `geometryTax()` — per floor compute: `non-orthogonal tile runs` (blocked-tile sequences that are neither a straight line nor a 45° staircase), `unique element count` (distinct wall lengths / room types / panel sizes), `joints per m²` (blocked-tile perimeter ÷ walkable area), and `area lost to stepping` (walkable tiles inside the room's own convex hull minus the room set); fail when unique elements > 1.5× the floor's room count, or stepped-run perimeter > 10 % of the plate perimeter, or lost-area > 3 %; report the offending run coords and the repeated-vs-once ratio.
- Prevention: buy irregularity in *one* place and pay for it there (a single angled public space) rather than distributing it; standardise the module and vary the composition inside it (→ PP-24).
- Correction: straighten the shortest offending run first (cheapest, biggest joint saving), or absorb the step as a purposeful recess/niche and tag it, or accept and document the cost with the panel count. Cascade risk: straightening a wall reshapes two rooms and can drop one below FL-05/FL-24 minimums, or move a bearing line (→ FL-20).
- Source: PP-24 (this repo: non-standard geometry is paid for in setting-out and perimeter, not in the drawings) — T1 derived; Banfill, *Construction Productivity in Building*, Spon Press, 2004, and Formwork cost studies (Standard formwork usage, cost model) — T2 peer-reviewed: repetition drives cost, one-off formwork is multiples of standard; Stewart & Roskilly 2006 — T2 (non-standard parts have short effective design life because replacements cannot be sourced); documented case critiques of "Bilbao-effect" cost overruns — T3 (anecdotal, see Weak or contested).
- Class: HEURISTIC
- Scope: universal in industrialised construction; near-zero in carved/site-material work
- Severity: Minor — Major when it generates FL-05/FL-20 failures as by-products.
- Confidence: Medium; the economics of repetition are standard data, the stepped-perimeter and lost-area cut-lines are our heuristics — was `STANDARD`; demoted: Banfill and formwork cost studies establish that repetition drives productivity (T2, not opened clause-by-clause), while the joint/sliver counters that trigger this check are project thresholds
- Exceptions: where the irregular geometry *is* the programme (a theatre auditorium, a landmark public building, a site-driven infill), and where the type's whole value is the non-repeatable gesture — then the tax is a stated cost, not a defect.

---

## Severity ladder

Default reasoning order (goal-task §36), with what belongs in each band and how ties break. This is
a reasoning order, not an immutable rule; the brief may reweight it (a museum may buy circulation
efficiency with wayfinding clarity; a prison reweights sightlines over daylight).

1. **Safety / life** — egress count, travel distance, exit width, structural collapse risk, clean/dirty
   hygiene crossings in healthcare and food, single-exit floors. Here: FL-26, FL-20, FL-08, FL-03 (egress
   case), FL-13, FL-06 (through-room case), FL-12 (healthcare/custody case), FL-25/FL-02/FL-23 when on the
   escape route. Nothing below may override a band-1 fail.
2. **Structural feasibility** — load path, spans, transfer, continuity of core and stack as *buildable*
   facts: FL-20, FL-09 (as a structural element), FL-22 (where the band is the fire-stopping route).
3. **Basic functionality** — the room is what it claims to be and can be used: FL-07 (typing/visibility),
   FL-24 (fit), FL-15 (storage), FL-16 (maintenance), FL-18 (windowless habitation), FL-06, FL-01
   when it makes rooms too small.
4. **Circulation** — getting about without penalty: FL-01, FL-02, FL-03, FL-04, FL-10, FL-27.
5. **Operations** — the working day, costs paid forever: FL-13, FL-15, FL-17, FL-11, FL-12, FL-21.
6. **Environmental performance** — FL-18, FL-19, FL-14 (acoustic comfort), FL-22 (where the band exists to serve comfort).
7. **Efficiency** — FL-01 (money version), FL-05, FL-28, FL-22 (area version).
8. **Experience** — FL-10, FL-12 (comfort/privacy feel), FL-19 (quality of light), FL-28 (the gesture's upside).
9. **Aesthetic refinement** — everything not otherwise claimed. Always last: fix the room before the colour.

Tie-breaks, in order: (a) reversibility — the irreversible one wins; (b) who is harmed — a stranger
outranks a staff member outranks the operator's margin; (c) frequency — a daily annoyance outranks a
one-off; (d) whether a lower band's fix *creates* a higher-band failure (it does not, then it is not a
tie); (e) cost of the fix, only after (a)–(d) are exhausted. Two rules with the same band: resolve by
the number of tiles/people affected, then by whether the failure is measurable or proxy-only
(`unknown` never outranks a `fail`, → VA-03).

Reweighting must be written down. A brief that elevates aesthetics over operations is legitimate; a
plan that silently does so is FL-28 wearing a different hat.

---

## Detection checklist as pseudo-code

Ordered: cheap and structural first, model integrity before semantics (→ VA-07), most critical before
least (→ VA-05). Each scan returns `pass | fail | unknown` plus a counterexample (→ VA-08). Stop rule:
all band-1 and band-2 scans must close before any band-3+ fix is started (→ VA-19).

```text
S1  modelIntegrity(grid)
      tiles ∈ {walkable, blocked, door}? else UNKNOWN  |  no orphan tile states, no NaN coords
      room carrier present, tag registry loaded (15 detectTags), portal set present
      MISSING CARRIER (window, height, structure, services, furniture) => mark class UNKNOWN, continue
S2  deriveRooms(grid)                 4-conn flood-fill over walkable, door cells excluded
      report: room list, area tiles/m2, tag awarded, tag expected, doors per room
S3  typingAudit(S2)                   FL-07  hall-and-not-route-like | untagged area | priority clash
S4  roomCutScan(S2, doors)            FL-06  door tile interior to a room | through-route through private room
S5  geometryHygiene(S2)               FL-05  room <2.0 m2, min dim <1.5 m, leftover <1.0 m2, aspect >3:1
                                      FL-28  stepped-run %, unique-element ratio, joints/m2, lost area %
S6  topologyScans(grid)               FL-03  dead-end stub > 3.0 m (egress: > 1.5 m)
                                      FL-02  pinch width < 1.0 m on demand route | 1-tile door on public route
                                      FL-04  cycle_count = 0 on >8-room floor | p90 detour factor > 1.35
                                      FL-10  junction choices > 3 per 30 m | visible doors at junction > 4
S7  efficiency(grid, S2)              FL-01  circulation share > 0.25 warn, > 0.35 fail (split residue vs street)
S8  adjacencyCheck(S2, programme)     FL-11  S-code violated | F-code beyond 2 doors | buffer absent
                                      FL-14  quiet-loud shared wall | party run discontinuity | doors facing < 2.0 m
S9  privacyLOS(S2, access)            FL-12  private door visible within 6.0 m, ±30°, ray depth ≥ 2 room tiles
                                      FL-13  clean/dirty tile crossings ≥ 1 | waste-food ≥ 1 | service-guest > 3 tiles
S10 verticalStack(floors, S2)         FL-09  core/wet/shaft centroid offset ≥ 2 tiles between floors
                                      FL-08  floors with 1 portal group over capacity line | orphan rooms
                                      FL-26  distinct exit groups < 2 above occupancy threshold
S11 structureLoadPath(bearingGrid)    FL-20  wall line without support below | span > limit | undeclared transfer
                                      (no bearing carrier => UNKNOWN for the whole class)
S12 servicesStack(S2, floors)         FL-21  wet cluster > 4 tiles from stack | wet over quiet below | run > 8 tiles
                                      FL-22  services band absent on ≥3-room service line | band < 1 tile
                                      FL-16  plant with no adjacent access tile | removal corridor < 2 tiles | no rights
S13 accessibilityRoute(access, S6)    FL-23  effective width < 0.9 m | no passing 1.5 m per 15 m | no 1.5 m turn at portal/WC
                                      FL-25  swing reservations overlapping | leaf across required width
                                      S4 re-check: reservations vs fixtures
S14 fitOut(S2, templates)             FL-24  no legal furniture placement in template set | free rect < template
S15 capacityAndEgress(S2, programme)  FL-26  capacity vs exits, width provided vs required, worst travel > budget
                                      FL-17  queue > lobby holding capacity | wait > 60 s | spill blocks a door
S16 environment(S2, programme)        FL-18  long-occupancy room with 0 daylit tiles | daylit share < 30 %
                                      FL-19  depth > 2.5 × assumed head height | facing gap < 3.0 m
S17 dynamics(grid, trips)             FL-27  p90 trip cost +25 % at peak | > 30 % trips reroute | door unreachable
S18 report()                          VA-18 diff table per scan: rule, target, measured, verdict, counterexample
                                      VA-10 capability manifest of every UNKNOWN and why
                                      VA-20 close-out rights: geometry/logic only for the agent
```

Per-floor order is S1→S7; S10–S12, S15 run at building level (→ VA-16). Re-run S3–S7 and S13–S14 after
any wall or fixture edit inside the blast radius (→ VA-14), and re-run the full stack after any
structural or core move (→ FL-20 cascade).

---

## Sources

Tiers: T1 official / code-derived · T2 peer-reviewed · T3 documented case critique · T4 forums/blogs ·
T5 Reddit. Nothing here is sourced to T4/T5 without being labelled as such.

Code-derived (this repository — highest trust for grid behaviour):
- `src/engine/npc/rooms.ts:6` — `deriveFloorRooms(map, doorCells)`: 4-connected flood-fill over walkable cells, **door cells excluded from every room** (called with `floorDoorCells(floor)` at `src/engine/npc/layoutBuild.ts:369`). Feeds FL-06, FL-01, FL-05.
- `src/blueprint-editor/domain/schema/rooms.ts:4-27` — the 15-type vocabulary with `detectTags`, `privacy`, `priority` (10/20/30/40-tie/50), plus `HALL_ROOM_TYPE = { detectTags: [], priority: 999 }`: the fallback can never match, so unmatched and out-of-vocabulary rooms all become `hall`, and lower priority numbers swallow higher ones inside one tile-set. Read in code this pass. Feeds FL-07, FL-12, FL-15, FL-21.
- A\* octile movement with diagonals gated on both orthogonal neighbours open and unoccupied; `portal` objects with queues; role-tag access; no heights, no window tile state, no dimensioned furniture, no structural/services carriers. Feeds FL-27, FL-18/FL-19 (proxy-only), FL-20/FL-22 (UNKNOWN), FL-24.
- Verification status of the citations below (honest ledger): re-confirmed against primary sources this pass — ICC IBC 2021 §1020.5 (codes.iccsafe.org), 2010 ADA Standards index (ada.gov) and the Access Board clear-space guide, the 2018 England HMO instrument (legislation.gov.uk/uksi/2018/616), Seppänen/Fisk/Lei in *Indoor Air* (Wiley). Carried from standard-text knowledge and **not** re-fetched this pass, so check volume/page/DOI before quoting in a deliverable: Peponis et al. 2006 *Environment and Behavior*, Hillier 1996, Zimring & Gill 1993, NTSB AAR-82-05, Grenfell Phase 1, Hackitt, BB93, Approved Documents B/E/M, CIBSE Guides D and H, Neufert, BRE 245, Fisk/Lei/Seppänen. The HMO bullet in the T1 list names the instrument loosely: the 6.51 m² figure is the England HMO/Space-standard figure (rooms under 4.64 m² may not be used for sleeping by one person over 10); confirm the exact statutory instrument before citing it in a compliance argument.
- Companion files in this directory: architecture-theory.md (TH-xx), professional-practice.md (PP-01…PP-26), validation.md (VA-01…VA-23).

Standards and official reports (T1):
- IBC Chapter 10 (means of egress: occupant load, egress width 0.2 in/occupant, travel distance Table 1017.2, number of exits) and §1020.5 dead ends — https://codes.iccsafe.org/s/IBC2021P2/chapter-10-means-of-egress/IBC2021P2-Ch10-Sec1020.5 (also https://up.codes/s/dead-ends), publisher https://www.iccsafe.org/ — FL-03, FL-26, FL-18 (§1207 daylight).
- NFPA 101 *Life Safety Code* — https://www.nfpa.org/codes-and-standards/all-codes-and-standards/list-of-codes-and-standards/detail?code=101 — FL-03, FL-08, FL-26.
- 2010 ADA Standards for Accessible Design §§305, 306.3, 403.5, 404.2.3-4, 600, 806 — https://www.ada.gov/law-and-regs/design-standards/2010-stds/ and the Access Board clear-space/turning-space guide https://www.access-board.gov/ada/guides/chapter-3-clear-floor-or-ground-space-and-turning-space/ — FL-02, FL-23, FL-24, FL-25.
- UK Approved Document B (means of escape), Approved Document E (sound), Approved Document M (access) — https://www.gov.uk/government/collections/approved-documents — FL-14, FL-23, FL-26.
- UK Approved Document E, Resistance to the passage of sound (40 dB DnT,w + C target, pre-completion testing) — FL-14.
- Building Bulletin 93, *Acoustic design of schools* — https://www.gov.uk/government/publications/building-bulletin-93-acoustic-design-of-schools — FL-14.
- Hackitt Review, *Building a Safer Future* (2018) and Building Safety Act 2022 "golden thread" — https://www.gov.uk/government/publications/building-a-safer-future-review-of-building-regulations-and-fire-safety — FL-16.
- Grenfell Tower Inquiry, Phase 1 Report (2019) — https://www.grenfelltowerinquiry.org.uk/ — FL-16, FL-26.
- Ronan Point collapse (1968) inquiry and the resulting continuous-load-path / tie requirements in the UK Building Regulations — FL-20.
- NTSB Aircraft Accident Report AAR-82-05, *Hyatt Regency Walkway Collapse, Kansas City, June 27 1981* — https://www.ntsb.gov/ — FL-08, FL-20 (cascade lesson: one local connection change doubled the load above).
- WHO Regional Office for Europe, *Indoor Air Quality — Biological Substances: Health Risks and Management* (Sick Building Syndrome), Copenhagen 1984 — FL-18.
- WHO *Guidelines on Core Components of Infection Prevention and Control Programmes*, 2019 — FL-13.
- BRE Report 245 / *National Descriptions for daylight and sunlight assessment* (VSC 27 % for habitable rooms) — FL-19.
- UK Licensing of Houses in Multiple Occupation (Prescribed Description) (England) Order 2018 — 6.51 m² minimum lettable room — FL-05.
- CIBSE Guide D *Transition in buildings* (lift traffic) and Guide H *Building drainage services* — FL-17, FL-21.
- Whole Building Design Guide (NIBS), programming and commissioning pages — https://www.wbdg.org/ — FL-07, FL-16.

Peer-reviewed (T2):
- Hillier & Hanson, *The Social Logic of Space* (1984); Hillier, *Space is the Machine* (1996) — ringiness, intelligibility, movement prediction. FL-01, FL-04, FL-10, FL-27.
- Peponis, Zimring, Xie, Karydis et al., "Finding the building you are looking for: layout legibility and wayfinding", *Environment and Behavior*, 2006 — FL-04, FL-10, FL-27.
- Zimring & Gill, "Design quality and residential burglary", *Environment and Behavior* 25(5), 1993 — FL-03, FL-12.
- Seppänen, Fisk, Lei, "Effect of temperature on symptoms and work performance", *Indoor Air* 16(2), 2006; Fisk, Lei, Seppänen, "Effect of outdoor ventilation rate … on prevalence of SBS", *Indoor Air* 16(2), 2006 — FL-18, FL-19.
- Stewart & Roskilly, "Design life of building material and component subsystems", *Building and Environment* 41(1), 2006 — FL-09, FL-16, FL-22, FL-28.
- Banfill, "Factors affecting construction productivity", and formwork repetition cost studies — FL-28.
- Lin et al., "Psychological benefits of daylight … in occupants of buildings", *Frontiers in Public Health*, 2017 — FL-18.
- Preiser & Vischer (eds.), *Assessing Building Performance / Evaluating and Improving Workplace Productivity* — the POE method underpinning this whole file — FL-01…FL-28; and PP-25.

Standard texts (T2/T3):
- Neufert, *Architects' Data*, 3rd ed., Wiley — dimensions, clearances, corridor widths, storage ratios. FL-02, FL-05, FL-15, FL-21, FL-24.
- Ching, *Building Construction Illustrated*, 5th ed. — load path, spans. FL-20. Ching & Eckler, *Interior Graphic Standards* — furniture clearances, door swings. FL-24, FL-25.
- Kasavana & Smith, *Managing Better Hotels* (1982) — hotel BOH/F&B area and adjacency ratios. FL-15.
- Alexander et al., *A Pattern Language* (1977) — nooks need a purpose, corridor width and sight. FL-05, FL-12.
- Newman, *Defensible Space* (1972); Coleman, *Utopia on Trial* (1985); Brand, *How Buildings Learn* (1994) — FL-03, FL-12, FL-22.
- Rand, Parker & Zimring, *Problem Seeking*, 5th ed. — adjacency matrix method. FL-11.

Documented case critiques (T3) and lower tiers:
- Heschong Mahone Group, *Daylighting in Schools* (1999) — FL-18/FL-19; methodology contested (see Weak or contested).
- Vdara Tower, Las Vegas downdraft/vortex complaints (2010) and subsequent canopy remediation — FL-28: computed form without physical testing.
- Hotel housekeeping cart catchment figures (10–16 rooms per cart run) circulate in operator blogs and trade forums — T4 — used in FL-15 only as a heuristic, flagged below.
- Reddit r/architecture, r/hotelmanagement anecdote threads — T5, consulted but used for nothing; retained here only as a signal of which failures operators complain about (sound, storage, cleaning access).

---

## Weak or contested

- **Circulation share cut-lines (FL-01).** The *metric* is real (usable vs rentable, core factor); the 0.25/0.35 thresholds are ours. Published net-to-gross norms vary from 0.60 to 0.85 by type and by whether corridors, lobbies, and shafts are counted. Report the measured share, name the denominator, and let the brief set the limit.
- **Space syntax as a design rule (FL-04, FL-10, FL-27).** Strong published correlation between integration and measured movement; weaker causality (people also go where the shops are), and the theory has been criticised as over-deterministic. Use it to *rank suspects*, not to convict a plan.
- **Housekeeping catchment numbers (FL-15).** UNCITED — heuristic: the 12-room / 30 m round-trip budget matches trade-forum practice and time-and-motion convention, not a published standard. Confidence Low; treat as a starting value to be calibrated against simulated trips (→ VA-15).
- **Daylight proxies (FL-18, FL-19).** UNCITED on this host: there is no `window` tile state and no height, so daylight depth and DF/VSC cannot be computed — only proxied from the assumed storey height we invent. Any daylight verdict must be reported as `unknown` with the invented input named, never as pass (→ VA-03).
- **dB values (FL-14).** The published limits are real, but the grid has no mass, no assembly, no flanking path and no floor-to-floor separation, so acoustic checks here are adjacency *topology* checks only. Claiming acoustic compliance from a tile plan is a category error (→ VA-06).
- **Structural spans (FL-20).** The 4.0 m "span limit" is a placeholder, not a calculation, and the grid has no bearing carrier: the honest result for every real floor today is `unknown`. A single-tile wall (0.5 m) is simultaneously a plausible load-bearing wall and a plausible partition, which is exactly why the overlay must be an explicit data model, not inferred from tile state.
- **Egress numerics (FL-26).** Unit widths, occupant-load factors, travel distances and exit counts differ materially between IBC, NFPA 101, and UK AD B, and depend on occupancy class, sprinklers and occupancy height. This file quotes the IBC/NFPA family because it is the most widely published in English; every application must re-derive for the actual jurisdiction and say "inconsistent with <source>, verification required" (→ VA-04).
- **Daylighting-in-schools productivity claims (FL-18).** Widely repeated (20 %+) but the original study's design was correlational with uncontrolled confounds; several later replications shrink the effect. Keep the daylight rule on health and code grounds, not on the productivity number.
- **Feng-shui / "bad layout" folklore (adjacency and doors facing doors).** Some rules (bed facing a door) are unmeasured anecdote. Retained only where an independent reason exists (privacy, sound, egress obstruction) — otherwise labelled HEURISTIC/Low.
- **Aesthetic-failure catalogues.** Nothing in this file is an aesthetic rule; the ladder's bottom band is deliberately empty of FL entries because it cannot be checked on a tile grid and cannot be argued from published failure evidence.

---

## Type-specificity audit

Which failures are universal and which are a hotel's (or a hospital's) problem. This matters because
the host's default deliverable is a hotel floor, and an unmarked convention gets applied everywhere.

| Rule | Universal | Type-conditioned | Notes |
|---|---|---|---|
| FL-01 share | metric | limit | concourse/market floors invert the target; hospital and school limits differ from hotel |
| FL-02 pinch | width physics | demand weighting | one-way clinical corridors tolerate less; residential tolerates 1 tile |
| FL-03 dead end | yes | permitted length | egress limit is occupancy-specific; residential cul-de-sacs are legitimate |
| FL-04 ringness | yes | strength | private residences and secure wings *want* trees |
| FL-05 slivers | yes | minimum area | 6.51 m² is HMO-only; a hotel bedroom has no statutory minimum |
| FL-06 door-cut | yes (host) | — | grid-specific; no type exception, only a `hall` designation |
| FL-07 typing | yes (host) | — | invisible-room defect; no type exception |
| FL-08 single portal | yes | occupancy threshold | exit-count trigger depends on occupant load and travel distance |
| FL-09 stack drift | yes | severity | wet stacks matter in hotels/hospitals, not in warehousing |
| FL-10 wayfinding | yes | severity | negligible in a 40-bed hotel; severe in a 600-bed hospital |
| FL-11 adjacency | method | the matrix itself | every pair is type-specific; only the method is general |
| FL-12 privacy LOS | yes | door list | bathroom/bedroom/change; healthcare and custody escalate it |
| FL-13 clean/dirty | no | mandatory only in healthcare/food | in hotels it is operational (Major), in hospitals Critical |
| FL-14 acoustics | yes | dB target | residential party walls have statutory values; offices mostly do not |
| FL-15 storage | yes | budget | healthcare sterile, hotel linen, school lockers, office records |
| FL-16 maintenance | yes | item list | every occupied building; the specific clearances are trade-specific |
| FL-17 queue | yes | peak profile | hotel = arrivals/checkout; office = 08:45 show call; hospital = visit hours |
| FL-18 windowless | no | statutory only for habitation | theatres and plant rooms are exempt by function |
| FL-19 depth | yes | assumed height | needs a section; unknown carrier |
| FL-20 structure | yes | span limits | frame buildings: applies to the grid, not the partitions |
| FL-21 wet stack | yes | — | any building with water above ground |
| FL-22 services band | yes | load | naturally ventilated/low-services types genuinely do not need it |
| FL-23 accessibility | yes | — | one of the few numerically codified, type-independent rules |
| FL-24 fit | method | templates | every type; only the template differs |
| FL-25 swing clash | yes | — | universal; host has no leaf object |
| FL-26 egress | yes | every number | occupant load factors and distances are per occupancy chapter |
| FL-27 reroute | host | demand | high in hotels/conferences, trivial in low-density types |
| FL-28 geometry tax | weak | construction system | industrialised systems pay it, bespoke masonry largely does not |

Default for this repository: the hotel floor. Where a rule's severity was set from a hospital or
office source, that is stated in the Exceptions bullet, and FL-13/FL-14/FL-15/FL-17 are the ones most
likely to be mis-calibrated for the project's actual type card (→ VA-21: validate against the type card,
not the habit of the last building).
