# Research file 03 — Floor plans: what real plan data and generation research prove

Scope: Domain A (floor plans). What the public floor-plan **datasets** (CubiCasa5K, RPLAN,
FloorPlanCAD, Swiss Dwellings, and others) and the **layout-generation literature**
(Graph2Plan, HouseDiffusion, ITP, CADI4RNN, HouseGAN++, Pictor, …) actually establish about real
plans — room size and proportion distributions, opening placement, corridor share, adjacency
frequencies, label taxonomies, repeated modules across floors, and the failure modes generators
report — converted into rules executable on the host grid. Nothing here is a general design
treatise; each rule is a check an agent can run on a tile raster.

Host grid: `1 tile = 0.5 m`; `4 tiles = 1 m²`; `2 tiles = 1.0 m`; one 2D grid per floor; tile
states ONLY `walkable | blocked | door`; a wall is one blocked tile; rooms are 4-connected
flood-fills of walkable tiles (door cells belong to **no** room); movement is A\* octile with
diagonals only when both orthogonal neighbours are open; vertical links are `portal`-tagged
objects with queues; access by tags; no heights, no sections, no structural objects.

Derived constants used below: interior room of `W×H` tiles = `0.25·W·H` m²; `10 m² = 40 interior
tiles`; `1.0 m corridor = 2 tiles`; door opening `2 tiles = 1.0 m`, `3 tiles = 1.5 m`; a 4-tile
(2.0 m) door cell is the practical "door zone".

---

## Rules

### FP-01 Adopt a fixed room-label taxonomy and refuse labels outside it
- Rule: Freeze one label vocabulary per building type before generating anything, tag every room with exactly one label from it, and treat an untaggable room as a defect rather than an unnamed space.
- Evidence: Every serious plan dataset ships a *closed, small* room taxonomy next to a *large* object taxonomy. RPLAN is consumed by the generation literature at "80K plans / 13 room types" (Graph2Plan's own wording); the *DStruct2Design* benchmark page reports **80,788** plans (this file previously carried "80,315", a figure not present in any of the three cited sources). CubiCasa5K holds 5,000 floor plans annotated into "over 80 floorplan object categories" — most of those are fixtures/furniture/walls/doors/windows, not room types. FloorPlanCAD has 10,000+ drawings with "line-grained annotations of 30 object categories" (symbols, not spatial semantics). MSD (curated from Swiss Dwellings) reports 5,372 plans / 18.9 K units with room-type labels *plus* four functional zones; the previously cited "165.3 K rooms" figure did not surface in the fetched text and is UNVERIFIED. The pattern: room semantics are few and enumerable, geometry/fixture semantics are many.
- Source: Graph2Plan https://arxiv.org/abs/2004.13204 — T2; *DStruct2Design* benchmark (RPLAN 80,788) https://arxiv.org/html/2407.15723v1 — T2 (arXiv preprint, not an ECCV-track paper); CubiCasa5K https://github.com/CubiCasa/CubiCasa5k — T1/T2; FloorPlanCAD https://arxiv.org/abs/2105.07147 — T2; MSD https://arxiv.org/html/2407.10121v3 — T2
- Class: STANDARD
- Scope: universal (the label *set* is per type; see the audit)
- Confidence: High that closed taxonomies are the norm; Low for any specific non-residential label set (no public dataset supplies one).
- Grid translation: maintain `LABELS: Set<string>`; after flood-fill each walkable component, assert `room.label !== null && LABELS.has(room.label)`; report `unlabelled_components` and `unlabelled_tile_share`; a label may be assigned only from fixture tags (host has no other room-type signal), so each label needs a fixture signature — mirror CubiCasa5K's split of "room class" vs "object class".
- Exceptions / failure mode: Deliberately unnamed space (a void, a terrace, a future shell) is legitimate only as an explicit `blocked`/out-of-programme region, never as an unlabelled walkable component. Failure symptom: a room the agent can walk into but cannot name, so no adjacency rule, no area band, and no daylight rule can be applied to it — it silently escapes every validator.

### FP-02 Derive the plan graph first, then fit geometry to it
- Rule: Generate or validate a plan as an adjacency/containment graph (nodes = rooms + exterior + circulation, edges = shared openings) and only then assign tile geometry; never let geometry drift into creating or destroying an edge.
- Evidence: Graph2Plan's whole formulation is "floorplan generation from layout graphs" — nodes are rooms, edges are adjacencies realised **through doors**, and the network draws the raster from that graph under a building boundary. HouseDiffusion likewise emits room vertices together with door nodes (types: *interior door*, *front door*) and scores plans with a modified graph edit distance, i.e., the published quality signal is graph-side. The benchmark literature separates *self-consistency* (geometry does not contradict itself) from *compatibility* (geometry matches the requested graph), which is exactly the ordering of these two steps.
- Source: Graph2Plan https://arxiv.org/abs/2004.13204 — T2; HouseDiffusion https://arxiv.org/abs/2211.13287 — T2; benchmark https://arxiv.org/html/2407.15723v1 — T2
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: High (three independent published systems use the graph→geometry order).
- Grid translation: build `G(room_i, room_j) = 1` iff a door tile is 4-adjacent to both components; store the intended adjacency set `G*` as the design artefact; validate `G == G*`; every geometry edit is re-tested by rebuilding `G` from tiles.
- Exceptions / failure mode: For an *existing* plan (a save-game floor) the graph must be recovered from geometry, so run the order in reverse and do not "fix" the graph to keep a pretty picture. Failure symptom: an agent's intent graph shows a legal layout while the tiles contain a room entered only through a bedroom.

### FP-03 Make topology the primary validity signal, geometry secondary
- Rule: When a candidate plan must be wrong about one of {which rooms touch, exact wall coordinates}, make it wrong about wall coordinates; we gate on topology because that is what our tile-grid validators can actually check, and the published graph-compatibility metrics are the only external signal aligned with that choice. (**INFERENCE**: this ordering is an engineering decision on this grid, not a measured human-perception fact — no source in the corpus measures which error class humans read as invalid; see Weak or contested.)
- Evidence: Published metrics treat the two asymmetrically: Graph2Plan's hard validity checks (coverage, interior, mutex) are structural, while its geometric quality is reported as an **average room-box IoU ≈ 0.65** — that 0.65 is an evaluation score, *not* an acceptance threshold (audit 04 A6b found the earlier "accepts a room box only at IoU ≥ 0.65" wording to be a misdescription). HouseDiffusion reports FID for diversity and a **modified graph edit distance** for compatibility, and its abstract-page critique of prior generators is that they fail on constraints rather than on millimetres (the exact "duplicate or missing rooms, ignoring the input constraint" wording is from the paper body, which this pass did not read past the abstract — treat as UNVERIFIED). A sub-tile-precise wall buys nothing once a required edge is missing.
- Source: Graph2Plan https://arxiv.org/abs/2004.13204 — T2; HouseDiffusion https://arxiv.org/abs/2211.13287 — T2 (abstract only; body not read this pass)
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: Medium (the ordering is an engineering choice on this grid; the "how much looser" number is project-chosen, not a published threshold).
- Grid translation: score candidates in this order — (1) connectivity/reachability, (2) adjacency-set equality `|G △ G*|`, (3) room-mask IoU, (4) boundary offset in tiles. Reject on 1-2, trade off within 3-4. Set the tile-grid acceptance at `IoU ≥ 0.65` per room as a **project-chosen default**, at the level Graph2Plan reports as its *average* IoU — that 0.65 is a score, not a published threshold. Retune per project once reference masks exist.
- Exceptions / failure mode: Geometry stops being secondary when it gates occupancy: a 1-tile-wide corridor or a door that lands on a corner is geometrically invalid *operationally*, not cosmetically. Those promote to tier 1.

### FP-04 Every room must be reachable through openings, verified by flood-fill
- Rule: No walkable component may exist that is not connected to the building's circulation graph via at least one door tile; disconnected islands and out-of-boundary rooms are the most common fatal generator failures and must be a hard reject.
- Evidence: Graph2Plan's validity suite is literally **coverage** (boundary filled), **interior** (rooms inside the building boundary) and **mutex** (no two rooms overlap) — all three are structural, all three are cheap tile checks. HouseDiffusion's stated failure of baselines (duplicate/missing rooms, ignored constraints) is the same class of error. The benchmark's "self-consistency: overlap, total area" is a third independent implementation of the same gate.
- Source: Graph2Plan https://arxiv.org/abs/2004.13204 — T2; HouseDiffusion https://arxiv.org/abs/2211.13287 — T2; benchmark https://arxiv.org/html/2407.15723v1 — T2
- Class: CODE REQUIREMENT
- Scope: universal
- Confidence: High (published, repeated, and pure arithmetic here).
- Grid translation: BFS over walkable ∪ door tiles from the entrance door; `orphans = components(walkable) − reachable`; assert `orphans == 0`; assert `coverage`: `Σ room_tiles + door_tiles + wall_tiles == floor_hull_tiles` (no unexplained interior); assert `interior`: no walkable tile outside the hull; also flag any room reachable *only* through a second room's interior unless its label is in the en-suite allow-list.
- Exceptions / failure mode: Legitimate sealed spaces must be `blocked`, not walkable-and-unreachable (safe, voids, shafts). Failure symptom: NPC stands outside a room it can never enter, or pathing cost becomes `Infinity` and the sim silently stops dispatching.

### FP-05 Bound room areas per label with min/typical/max bands
- Rule: Store per-label area bands in tiles and reject a room outside them; a room whose area cannot be justified by its label's band is a size error even if the geometry is clean.
- Evidence: Datasets make area the first-class statistic of a room label (RPLAN and Swiss Dwellings are both queried by room type, and MSD publishes per-room geometry alongside its 5,372 plans / 18.9 K units; the previously cited "165.3 K rooms" figure did not surface in the fetched MSD text and is UNVERIFIED), and the benchmark's self-consistency set includes **Total Area**, i.e., area is validated rather than assumed. What is *not* published in a form I could verify is a per-label area percentile table, so the numeric bands below are derived from fixture footprints on this grid, not lifted from a paper.
- Source: benchmark https://arxiv.org/html/2407.15723v1 — T2; MSD https://arxiv.org/html/2407.10121v3 — T2; numeric bands: `UNCITED — heuristic`
- Class: HEURISTIC
- Scope: residential for the suggested bands; the banding *mechanism* is universal
- Confidence: High that banding is required; Low for the specific numbers.
- Grid translation: `interior_tiles = W·H`, `area_m2 = 0.25·interior_tiles`. Derive each label's minimum from its fixture set plus clearance, then assert `band[label].min ≤ area ≤ band[label].max`. Working minima on this grid (heuristic, calibrate): single sleeping space 1.0×2.0 m = `2×4` tiles + 0.75 m approach → bedroom `≥ 12` interior tiles (3.0 m²); two-person bed 1.6×2.0 m → bedroom `≥ 24` tiles (6.0 m²); WC fixture circle → `≥ 8` tiles (2.0 m²); habitable room `≥ 3` tiles on the short side (1.5 m).
- Exceptions / failure mode: Open-plan spaces break the max band by design — label them as their own class (e.g. `living+dining`) instead of inflating the `living` band; otherwise the validator flags every legitimate open plan. Failure symptom: "the plan is valid" while a 25 m² bathroom and a 2 m² kitchen both pass, which no occupant reads as valid.

### FP-06 Clamp room aspect ratio and forbid sliver rooms
- Rule: Keep each room's bounding-box aspect ratio inside a label-specific ceiling and forbid any room with a side under the label's minimum; long-thin rooms and 1-tile slivers are generator artifacts, not plans.
- Evidence: Layout-generation methods model room geometry as boxes and are evaluated with box-level IoU (FID/GED/IoU are the standard metric triple in the layout-generation review), so proportion is an explicit quality dimension; the same review lists proportion/shape among the constraint families a generator must respect. The numeric ceilings below are set from furniture fit, not from a published percentile table — no dataset I could verify publishes an aspect-ratio distribution.
- Source: Computer-Aided Layout Generation for Building Design: A Review https://arxiv.org/html/2504.09694v1 — T2; numeric ceilings: `UNCITED — heuristic`
- Class: HEURISTIC
- Scope: residential strongly; office/retail weaker (deep plan bays and long showrooms are legitimate)
- Confidence: Medium on the mechanism, Low on the constants.
- Grid translation: `AR = max(W,H)/min(W,H)` over interior tiles; assert `AR ≤ 4.0` for habitable rooms (a 4.0×1.0 m box at 8×2 interior is already unusable in practice — prefer `≤ 3.0`), `≤ 2.5` for bedrooms and living rooms, `min(W,H) ≥ 3` tiles (1.5 m) for any room a person occupies; anything with `min(W,H) ≤ 1` tile (0.5 m) is a wall fragment or an accidental corridor, never a room.
- Exceptions / failure mode: Galeries, service counters, double-loaded corridors and clean/dirty transitions are legitimately linear — give them their own label class instead of exempting them from the rule. Failure symptom: a "bedroom" 1.0 m wide that passes area checks while no bed fits.

### FP-07 Put openings only on shared or exterior boundaries and bound doors per room
- Rule: A door tile must separate exactly two spaces (room↔circulation, room↔room, room↔exterior); the door count per room is bounded, and a room must not be enterable only through an unrelated second room.
- Evidence: The datasets that annotate openings treat them as a closed class list, not free geometry: FloorPlanCAD annotates 30 line-grained object categories including walls/doors/windows, CubiCasa5K carries over 80 categories with walls, doors and windows as distinct classes, and HouseDiffusion reduces all openings to two door classes — **interior door** and **front door** — emitted as graph nodes attached to a specific wall segment. Graph2Plan's edges *are* door-mediated adjacencies, so an opening that does not separate exactly two spaces cannot be represented in the graph at all — that is the formal reason it is invalid.
- Source: FloorPlanCAD https://arxiv.org/abs/2105.07147 — T2; CubiCasa5K https://github.com/CubiCasa/CubiCasa5k — T1/T2; HouseDiffusion https://arxiv.org/abs/2211.13287 — T2; Graph2Plan https://arxiv.org/abs/2004.13204 — T2
- Class: BUILDING-TYPE CONVENTION
- Scope: universal (counts and clearances per type)
- Confidence: High that openings are binary-separating; Medium on the counts.
- Grid translation: for each door tile `d`, `distinct walkable components in 4-neighbourhood` must be `== 2` (or `== 1` for an exterior entrance, whose other side is off-grid); assert `1 ≤ doors(room) ≤ 2` for non-circulation rooms (3+ only for labelled lobbies/halls); merge door runs — one opening of `2` tiles (`1.0 m`) counts as one door, not two; flag two doors joining the *same* room pair within `3` tiles of each other.
- Exceptions / failure mode: En-suite bathroom, walk-in closet, kitchen-pantry are deliberate room-through-room edges and belong in an explicit allow-list keyed by label pair (FP-10's `must/never` matrix), not as silent exemptions. Failure symptom: a door placed on a corner tile touching two unrelated rooms, which on this grid yields a 3-component door — an edge the graph cannot name.

### FP-08 Give every occupied room a window-bearing exterior wall of its own
- Rule: Rooms where people stay (bedroom, living, office, ward, classroom) need an exterior wall run of at least 4 tiles (2.0 m); windowless-by-design is permitted only for a fixed service label list.
- Evidence: Window class exists as a first-class annotation in every plan dataset that encodes structure (CubiCasa5K's over-80 categories, FloorPlanCAD's 30 line-grained categories), and windows are annotated on the *building envelope* — the datasets' structure implies the exterior/interior wall distinction is the primary opening attribute, not a decoration. The specific minimum run length is set here from a functional argument (a window must be wide enough to read as daylight, not as a slit) and is not lifted from a paper.
- Source: CubiCasa5K https://github.com/CubiCasa/CubiCasa5k — T1/T2; FloorPlanCAD https://arxiv.org/abs/2105.07147 — T2; run length: `UNCITED — heuristic`
- Class: STANDARD
- Scope: habitable rooms in residential / office / healthcare / hospitality; industrial and commercial front-of-house differ (deep industrial bays rely on artificial light and roof monitors, which this grid cannot express)
- Confidence: Medium (rule direction is well supported; the constant is project-chosen).
- Grid translation: exterior wall tile = blocked tile with a 8-neighbour outside the floor hull; `ext_run(room)` = longest straight run of exterior wall tiles adjacent to that room's mask; assert `ext_run ≥ 4` tiles for `{bedroom, living, office, ward, classroom, guest_room}`, `≥ 2` for `{kitchen, bathroom}`; allow-list `no-daylight = {storage, wc, laundry, plant, server, stair, lift, archive, cold-store, vault}`. Note the host has no heights, so a window is only ever *an opening on the hull* — treat `ext_run` as the proxy and never claim daylight factors.
- Exceptions / failure mode: Landlocked interior rooms in large floor plates (offices, hotels around a core) violate this inevitably; there the correct response is to re-zone the plate (more perimeter, fewer deep rooms) or to relabel the room as interior-rated, not to delete the check. Failure symptom: a 12-room hotel floor where 9 rooms have no perimeter at all and the plan still passes every topology check.

### FP-09 Budget circulation as a share of net floor area and lint the share
- Rule: Compute the tiles consumed by corridors/lobbies/lift halls per floor and keep them inside a type-specific band; too little makes rooms into through-routes, too much is dead area.
- Evidence: The layout-generation literature treats circulation as an explicit constraint family (adjacency + circulation + proportion are the families this file reads off the review — the review's fetched text surfaced "residential boundary" and "bubble diagram" as *named* families; circulation/proportion are this file's reading, not the review's list) rather than a leftover, and MSD publishes functional *zones* per room across 18.9 K units (the room-count figure 165.3 K previously cited did not surface in the fetched text — UNVERIFIED), which is what makes a circulation share computable from real data at all. I could not verify a published circulation-share percentage for any type, so the bands are project placeholders.
- Source: review https://arxiv.org/html/2504.09694v1 — T2; MSD https://arxiv.org/html/2407.10121v3 — T2; bands: `UNCITED — heuristic`
- Class: BUILDING-TYPE CONVENTION
- Scope: type-specific bands; the accounting method is universal
- Confidence: Low on numbers, High on the accounting.
- Grid translation: `circ_share = circulation_tiles / (circulation_tiles + Σ room_tiles)`; start placeholders at residential `0.08-0.20`, office `0.08-0.15` (open plan), hospitality guest floor `0.18-0.30` (double-loaded corridor), healthcare `0.20-0.35`, industrial `0.05-0.15` — then replace with in-repo reference measurements (FP-25). Independent measurable check: a room is being used as a corridor iff `≥ 2` distinct room pairs have all shortest A\* paths through it.
- Exceptions / failure mode: Open-plan living and studio types have no corridor at all, so a low share is correct; conversely a corridor-dominant plan can still be geometrically valid. Failure symptom: an agent's route table shows a bedroom carrying three households' worth of through-traffic.

### FP-10 Encode adjacency priors as a must / should / never matrix
- Rule: Replace "adjacency is nice" with a per-type matrix of hard-must, soft-should and never pairs, and score a plan by edit distance to that matrix.
- Evidence: Adjacency conditioning is the core of the whole research line — Graph2Plan generates raster geometry *from* a room adjacency graph, and the standard compatibility metric across the field is a **modified graph edit distance** over that adjacency (HouseDiffusion; the review lists GED alongside FID and IoU). RPLAN-based models work on 13 room types precisely because the adjacency prior is learnable over a small closed label set. The published work therefore supports the mechanism strongly; the specific must/never pairs below are conventional residential programming, marked as such.
- Source: Graph2Plan https://arxiv.org/abs/2004.13204 — T2; HouseDiffusion https://arxiv.org/abs/2211.13287 — T2; review https://arxiv.org/html/2504.09694v1 — T2; specific pairs: `UNCITED — heuristic` (residential convention)
- Class: DESIGN PRINCIPLE
- Scope: type-specific matrices; residential priors must not be reused for healthcare/industrial
- Confidence: High on mechanism, Low-Medium on residential pairs, None (unsourced) elsewhere.
- Grid translation: adjacency set from FP-02; `score = 3·|missing must| + 3·|violated never| + 1·|missing should|`; gate on `missing must == 0 && violated never == 0`. Critical grid caveat: a *shared wall* is not an edge here, only a shared *door* is — so "bedroom next to bathroom" must be encoded as an en-suite door edge or it will not be checked at all. Never-pairs must also be expressible as "no door edge", which means service-vs-guest pairs (kitchen↔ward, bin-store↔dining) need the `never` cell even though a door would be geometrically legal.
- Exceptions / failure mode: Soft-should pairs conflict with hard-must pairs under tight envelopes; resolve by declared priority order, not by silently dropping checks. Failure symptom: a plan where every room touches every other room through one shared lobby tile — high edge count, zero privacy.

### FP-11 Zone labels into public / private / service and check crossing counts
- Rule: Assign each label a zone, and require that zone transitions happen through labelled circulation or a threshold space, not room-to-room.
- Evidence: MSD adds functional zone semantics on top of room type across 18.9 K units, extracted from Swiss Dwellings — and the zone vocabulary is **four** zones (`zone1` private, `zone2` public, `zone3` service, `zone4` outside), richer than the `{private, public}` binary this file previously claimed; the room count previously stated as "165.3 K rooms" did not surface in the fetched MSD text and is UNVERIFIED. This is direct evidence that zone is a real, machine-readable property of apartments and that a curated dataset had to be built to expose it. The same dataset's existence is also the limit: zones are published for residential multi-unit complexes only.
- Source: MSD https://arxiv.org/html/2407.10121v3 — T2; Swiss Dwellings https://zenodo.org/records/7788422 — T1/T2
- Class: DESIGN PRINCIPLE
- Scope: residential / hospitality / healthcare / office; industrial substitutes dirty-clean and dock/warehouse zones
- Confidence: Medium (zone vocabulary is published for residential; the transition rule is derived).
- Grid translation: `zone(label) ∈ {public, private, service}`; for each door tile assert `zone(A) == zone(B)` **or** one side is circulation; `depth(room)` = BFS hops on the door graph from the entrance — assert public labels at `depth ≤ 1`, private at `depth ≤ 3`, service reachable without crossing a public room.
- Exceptions / failure mode: A single-room studio collapses all zones; a shared entrance through a living room is normal in small dwellings. Failure symptom: guests cross a bedroom to reach the WC, which every topology check happily accepts because the door graph is legal.

### FP-12 Repeat modules across floors by cloning the tile footprint, not by re-drawing
- Rule: For any type with stacked repetitive floors, generate one module once and translate it; per-floor variation is allowed only at the ends and around the core.
- Evidence: Swiss Dwellings is a dataset of *multi-apartment complexes* — over 45,000 apartments (the Zenodo record's own wording; the false precision "45,176" is not on the record) in roughly 3,100 buildings — and MSD keeps the per-floor unit structure of 18.9 K units, with unit IDs shared across floors of multi-storey apartments (paper §8.1). What MSD does **not** publish is a room-position vertical-alignment measurement — the earlier claim that it did (used to justify FP-13) was wrong (audit 04 A4b). Repetition is still a measured property of real dwellings because the same unit recurs on many storeys; the 0.6 repetition threshold is a project placeholder.
- Source: Swiss Dwellings https://zenodo.org/records/7788422 — T1/T2; MSD https://arxiv.org/html/2407.10121v3 — T2
- Class: BUILDING-TYPE CONVENTION
- Scope: hospitality, residential towers, healthcare wards, repetitive office floors; NOT commercial ground floors, NOT industrial
- Confidence: High that repetition is real; Low on the ratio constant.
- Grid translation: module = `Δx`-tile translation vector; assert `tiles(floor_{n+1}) ⊇ translate(module, k·Δx)` for `k = 0..n_units`; measurable `module_repeat = repeated_room_masks / total_room_masks`, start at `≥ 0.6` for guest-room and ward floors, `≥ 0.3` for residential; module width must be a whole number of tiles, so a 3.6 m real bay = 7.2 tiles does not exist on this grid — snap bays to `7` or `8` tiles (3.5/4.0 m) and carry the error in the wall budget.
- Exceptions / failure mode: Corner units, suites and plant rooms break the module legitimately at floor ends. Failure symptom: every floor is generated independently, so identical units land in different places and stacks/shafts drift (breaks FP-13).

### FP-13 Stack wet rooms, shafts and vertical links on a single column grid
- Rule: Bathrooms/kitchens/laundry that sit above one another must share plan position, and every stair/lift portal must occupy the same tile rectangle on every floor it serves.
- Evidence: What MSD actually preserves across floors of multi-storey apartments is the **shared unit ID** (paper §8.1) — the same labelled unit appears on several levels. It does **not** measure or require room-position vertical alignment, so the earlier "MSD explicitly documents vertical alignment of rooms across storeys" attribution was wrong (audit 04 A4b). The rule still stands on independent support: host engineering necessity (soil stacks, lift hoistways, portal rectangles landing on something), FP-12's repetition mechanism, and the host-grid coordinate arithmetic that a portal's tile rectangle cannot drift silently.
- Source: MSD https://arxiv.org/html/2407.10121v3 §8.1 (unit-ID continuity only) — T2; the room-position-alignment claim itself: `UNCITED — heuristic (standard engineering practice, no numeric claim)`
- Class: ENGINEERING CONSTRAINT
- Scope: universal for any multi-floor work
- Confidence: Medium (was High; the external "measured in the data" prop is gone, host engineering + FP-12 carry it)
- Grid translation: for each `wet | shaft | portal` room compare the tile bounding box of `floor_n` vs `floor_n+1`; assert `|Δx| + |Δz| ≤ 1` tile for portals (a portal's rectangle must be *identical*), and mask overlap `≥ 0.6` for wet rooms; a wet room above a habitable room of another unit with no shared stack is a separate warning (`wet_over_dry`).
- Exceptions / failure mode: Podium/tower transitions, double-height atria and setbacks legitimately break the stack — mark those floors as `stack-reset` rather than letting the validator fire forever. Failure symptom: lift queue on floor 4 waiting at a portal position no floor below can reach.

### FP-14 Align walls to a coarse grid and forbid orphan wall fragments
- Rule: Keep wall runs straight and collinear across rooms; a wall that starts or ends in mid-air, or a 1-tile wall stub, is a defect even if every room is walkable.
- Evidence: Wall misalignment is a headline failure in this literature — the layout-review's qualitative failures include rooms overlapping and geometry ignoring the constraint graph, and the vector datasets exist because real drawings encode walls as long straight *line* objects: FloorPlanCAD annotates at **line granularity** across 30 categories, i.e., a wall is one object spanning the run, not a scatter of tiles. Graph-level metrics (GED) then penalise the plans whose wall lines fail to meet.
- Source: FloorPlanCAD https://arxiv.org/abs/2105.07147 — T2; review https://arxiv.org/html/2504.09694v1 — T2; run-length constant: `UNCITED — heuristic`
- Class: HEURISTIC
- Scope: universal
- Confidence: Medium.
- Grid translation: run-length encode blocked tiles per row and per column; assert `wall_run_length ≥ 3` tiles unless the tile is a door jamb or a hull corner; report `junction_ratio = T/L junctions / wall runs` and `floating_runs` (a run whose both ends touch walkable tiles diagonally with no continuing wall); penalise any room whose boundary shares `< 0.6` of its perimeter with another room, the hull, or a party wall.
- Exceptions / failure mode: Diagonal and curved plans are unrepresentable here, and stub walls occur legitimately at door linings and at the ends of non-load-bearing partitions. Failure symptom: a floor that reads as rubble — dozens of 1-tile wall islands between two rooms.

### FP-15 Forbid overlapping room masks and enforce exclusive tile ownership
- Rule: Each walkable tile belongs to exactly one room; overlapping or double-labelled rooms are a hard reject.
- Evidence: Overlap is the named failure across the field: the layout-review reports generators producing "unnecessary overlap between rooms"; Graph2Plan's **mutex** validity check is exactly a no-overlap test; the floorplan benchmark's self-consistency set lists "Overlap" and "Total Area" as its two validity quantities.
- Source: review https://arxiv.org/html/2504.09694v1 — T2; Graph2Plan https://arxiv.org/abs/2004.13204 — T2; benchmark https://arxiv.org/html/2407.15723v1 — T2
- Class: CODE REQUIREMENT
- Scope: universal
- Confidence: High (triple-sourced and, on this grid, pure arithmetic).
- Grid translation: guaranteed by construction when rooms come from 4-connected flood-fill; still validate `Σ area(room_i) == walkable_tiles` and `room_i ∩ room_j = ∅`. Overlap only ever enters when a room mask is stored independently as a parametric rectangle — so re-derive every mask from tiles each pass.
- Exceptions / failure mode: Nested spaces (mezzanine, closet-insight-suite) cannot be expressed as overlap here — they need a `parent_room` tag, since one 2D grid per floor has no room-in-room containment. Failure symptom: two rooms claiming the same tile, or a `Total Area` sum exceeding the floor plate.

### FP-16 Keep one geometry source of truth and derive the graph from it
- Rule: Never store topology and geometry independently; derive topology from geometry each pass and compare it against intent, because the reported "topology/geometry mismatch" failure is exactly what independent storage produces.
- Evidence: The published models that keep both representations have to introduce consistency machinery to hold them together — HouseDiffusion denoises *discrete* room/type/door tokens and *continuous* vertex coordinates in one model precisely because the two must agree, and the benchmark splits its metrics into *self-consistency* (the geometry does not contradict itself) versus *prompt/compatibility* (the geometry matches the requested graph), which are only separate quantities if the failure mode is real.
- Source: HouseDiffusion https://arxiv.org/abs/2211.13287 — T2; benchmark https://arxiv.org/html/2407.15723v1 — T2
- Class: ENGINEERING CONSTRAINT
- Scope: universal
- Confidence: High.
- Grid translation: the host already forces a single source of truth — rooms and doors are *derived* from `walkable|blocked|door` by 4-connected flood-fill (door cells belong to no room), so the only independent artefact allowed is the intent graph. Validator: `derive(tiles) vs intent`; the repair is always to move tiles, never to edit the intent to match a drawn picture.
- Exceptions / failure mode: Serialization must still store tiles, not derived rooms — re-deriving is the point. Failure symptom: a saved floor whose room list says "kitchen touches hall" while the tiles have no door, and every subsequent check reads the stale list instead of the grid.

### FP-17 Represent plans as vectors plus raster, not raster alone
- Rule: Keep the tile raster as simulation truth but export an equivalent vector description (room polygons, opening segments, wall runs) for reasoning, metrics and editing; raster-only plans cannot answer "which wall is wrong".
- Evidence: Vectorisation is the stated purpose of the two biggest annotation efforts: CubiCasa5K exists to support "floorplan image analysis" with polygon/vector ground truth over 5,000 samples and its model jointly predicts segmentation and geometry; FloorPlanCAD is explicitly a *CAD* dataset with line-grained vector annotations over 10,000+ drawings; and the generation models output vectors (Graph2Plan room boxes, HouseDiffusion vertex sequences) so that GED/IoU metrics can be computed at all.
- Source: CubiCasa5K https://github.com/CubiCasa/CubiCasa5k — T1/T2; FloorPlanCAD https://arxiv.org/abs/2105.07147 — T2; Graph2Plan https://arxiv.org/abs/2004.13204 — T2; HouseDiffusion https://arxiv.org/abs/2211.13287 — T2
- Class: ENGINEERING CONSTRAINT
- Scope: universal
- Confidence: High.
- Grid translation: emit `{room: {label, mask_tiles, bbox_tiles, area_m2, ext_run_tiles}, openings: [{tiles, between:[roomA,roomB], kind: interior|front|exterior}], wall_runs: [{axis, offset, from, to, length_tiles}]}`. Never compare a generated plan to a real plan below one tile: at `0.5 m/px` the grid cannot resolve a 100 mm real partition, and an apparent "misalignment" of one tile is `0.5 m` of wall thickness that real construction absorbs.
- Exceptions / failure mode: The vector form is derived, so it must be regenerated after every edit (FP-16). Failure symptom: hand-maintained JSON drifting from tiles, which is the storage pattern FP-16 forbids.

### FP-18 Validate with IoU, boundary F1, graph edit distance and an agent walk
- Rule: Score every generated or edited plan with a fixed four-part metric set — room-mask IoU against a reference where one exists, boundary accuracy, adjacency-graph edit distance, and a live agent walk — and never rely on visual inspection.
- Evidence: These are the published metric families: the layout review names **FID** (diversity), **GED** (graph compatibility) and **IoU** (geometry); HouseDiffusion uses FID plus a *modified graph edit distance*; Graph2Plan reports an **average room-box IoU ≈ 0.65** together with coverage/interior/mutex validity — the 0.65 is a reported evaluation score, not a paper-set acceptance gate (audit 04 A6b); the benchmark adds self-consistency (overlap, total area). The agent walk is the host's own contribution — none of the papers can run a simulated occupant, this project can.
- Source: review https://arxiv.org/html/2504.09694v1 — T2; HouseDiffusion https://arxiv.org/abs/2211.13287 — T2; Graph2Plan https://arxiv.org/abs/2004.13204 — T2; benchmark https://arxiv.org/html/2407.15723v1 — T2
- Class: CODE REQUIREMENT
- Scope: universal
- Confidence: High.
- Grid translation: `IoU_label = |A∩B|/|A∪B|` per label then mean, accept `≥ 0.65` as a **project-chosen default** (Graph2Plan reports 0.65 as its average IoU score, not as a published acceptance threshold); boundary score on wall tiles with `±1` tile tolerance (`boundary_F1`); `GED = |E(G)| + |E(G_ref)| − 2|E(G)∩E(G_ref)| + |V(G) △ V(G_ref)|`; agent check = A\* from the entrance to one target fixture in every room, all pairs finite, with octile cost `max(dx,dz) + 0.41421·min(dx,dz)` and diagonals only where both orthogonal neighbours are open (a 1-tile corridor forces `dx+dz`, so route cost is also a circulation-quality signal).
- Exceptions / failure mode: IoU and boundary metrics need a reference plan; a fresh procedural floor has none, so those two degrade to the self-consistency and agent-walk checks only. Failure symptom: reporting "quality 0.8" from a metric set that silently skipped its only ground-truth-dependent terms.

### FP-19 Treat public plan data as residential single-family and quarantine its statistics
- Rule: Load every dataset-derived number together with its provenance (dataset, country, era, type, sample size) and never apply a residential statistic to a non-residential floor without an explicit source.
- Evidence: The datasets are overwhelmingly residential: CubiCasa5K holds 5,000 floor-plan images from a publisher based in Finland (the README does not state the country or that the plans are *houses* specifically — both are the file's inference from the publisher, not the page's claim); RPLAN, the workhorse of the generation literature, is residential and reduced to 13 room types; Swiss Dwellings / MSD are dwellings — over 45,000 apartments (Zenodo wording), and MSD had to *filter out* 2,305 (16.6 %) non-residential floor plans to build its benchmark; 3D-FRONT and LIFULL, the other names in the field, are interior/apartment-listing data. **INFERENCE (UNSUPPORTED as a citation)**: our own survey of the datasets listed here found no non-residential room taxonomy; the layout review's fetched text carries **no** statement that office and industrial are neglected (audit 04 A9b) — so the bias is this file's negative search result, not a documented literature finding, and must not be quoted as if the review said it.
- Source: CubiCasa5K https://github.com/CubiCasa/CubiCasa5k — T1/T2; MSD https://arxiv.org/html/2407.10121v3 — T2; Swiss Dwellings https://zenodo.org/records/7788422 — T1/T2; review https://arxiv.org/html/2504.09694v1 — T2
- Class: HEURISTIC
- Scope: universal (a meta-rule about every other rule here)
- Confidence: High.
- Grid translation: every prior in config carries `{source, building_type, sample_size, region}`; the generator refuses a prior whose `building_type ≠ target type` unless `scope == universal`. Emit a report line per floor: `priors_used: n_residential / n_type_specific`.
- Exceptions / failure mode: Multi-unit residential (Swiss Dwellings/MSD) is closer to hospitality than to houses on several axes (repetition, stacks, core-proximity), so `residential` is itself too coarse a tag — sub-scope it as `house | apartment-stack`. Failure symptom: a hospital floor whose corridor share and room bands were inherited from a Helsinki apartment dataset.

### FP-20 Author non-residential priors locally when the dataset is silent
- Rule: For office, healthcare, hospitality, industrial and retail, do not wait for a public plan-dataset prior — build the priors from the type's own operational requirements, cite a standard where one exists, and record the rest as project-internal standards with Confidence: Low.
- Evidence: **INFERENCE (UNSUPPORTED as a citation — see FP-19)**: this file's own survey of the datasets listed here found no non-residential room taxonomy, so there is no public prior to copy; the layout review's fetched text carries no explicit "office/industrial are neglected" statement, so we do not attribute the observation to it. Where a hard number does exist it comes from accessibility/operational standards, not plan datasets (see FP-21). Everything below is therefore authored locally and must be labelled as such.
- Source: review https://arxiv.org/html/2504.09694v1 — T2; `UNCITED — heuristic` for all constants in this rule
- Class: DESIGN PRINCIPLE
- Scope: non-residential
- Confidence: Medium on the method, Low on the values.
- Grid translation: per type define and store `{core_position, unit_module_tiles, corridor_width_tiles, lobby_share, service_share, access_tags}`. Working placeholders to calibrate: hospitality guest floor = 2-tile corridor + repeated `7×9`-tile module + core at corridor mid-point; healthcare ward = 4-5 tile (2.0-2.5 m) corridor + nurse station with line-of-sight doors to every bedroom + dirty/clean service ends; office = perimeter window band + core of lifts/WCs + open-plan label instead of many small rooms; industrial = mostly one huge walkable component (`walkable ≥ 90 %`), doors at dock positions, no adjacency matrix at all; commercial = front/back-of-house split with a single staff door.
- Exceptions / failure mode: Mixed floors (retail below hotel) need the matrices merged and a `zone` boundary at the interface; the grid has no storey heights so a "structural grid" cannot be used to tie them. Failure symptom: a ward generated with residential adjacency priors, i.e. a plan where staff must pass through a patient room.

### FP-21 Size circulation and openings from accessibility minima, not from aesthetics
- Rule: Corridor and door widths come from accessibility codes, which translate cleanly onto this grid; use them as hard floors, above anything a dataset suggests.
- Evidence: 2010 ADA Standards (US Access Board): §403.5.1 clear width of walking surfaces **36 in (915 mm) minimum**; §403.5.3 passing spaces **60 in (1525 mm) minimum** each way; §404.2.3 door opening clear width **32 in (815 mm) minimum**. These are T1 code values, so unlike every other number in this file they need no dataset.
- Source: Access Board, ADA Chapter 4 https://www.access-board.gov/ada/chapter/ch04/ — T1
- Class: STANDARD
- Scope: public-occupancy types (office, commercial, healthcare, hospitality public areas); private residential is a weaker recommendation
- Confidence: High.
- Grid translation: 915 mm → `2 tiles` (1.0 m) is the smallest legal corridor; 815 mm → `2 tiles` is the smallest legal door opening; 1525 mm → `3 tiles` clear square for passing/turning. Because a wall here is a whole tile, a `1`-tile corridor = 0.5 m is *half* the code minimum — forbid single-tile circulation outright, and where two 2-tile corridors meet, guarantee at least one 3×3-tile clear patch every `15` tiles (7.5 m) as a passing space.
- Exceptions / failure mode: Existing-building and type-specific exemptions exist in real code, and service cupboards may legitimately have a narrow opening. Failure symptom: an "efficiency" gain from cutting a corridor to one tile that makes the floor unnavigable for the host's own movement model.

### FP-22 Check circulation quality with depth and dead-end measures, not just connectivity
- Rule: Reachability is necessary but not sufficient; measure dead-end length, through-traffic across rooms, and entry-to-space depth, because generators routinely produce topologically valid, circulation-ridiculous plans.
- Evidence: The failure literature's residual category after overlap/disconnection is exactly "the constraint graph is satisfied but the result is wrong" — the benchmark's *prompt-consistency* vs *self-consistency* split only makes sense because satisfying the requested adjacency graph still permits unusable geometry, and HouseDiffusion's critique of prior generators is that they satisfy boxes while ignoring constraints in the layout sense. Depth/dead-end measures are the space-syntax way to make that judgment computable; the thresholds are local.
- Source: benchmark https://arxiv.org/html/2407.15723v1 — T2; HouseDiffusion https://arxiv.org/abs/2211.13287 — T2; thresholds: `UNCITED — heuristic`
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: Medium.
- Grid translation: door-graph BFS from the entrance gives `depth(room)`; dead end = a circulation run whose far end has no door within `2` tiles, assert `dead_end_tiles ≤ 12` (6.0 m) unless terminated by a labelled room; sample `N` A\* trips and compute tile betweenness — any *room* tile appearing in `> 0.3` of paths is an accidental corridor (feeds FP-09).
- Exceptions / failure mode: Short stubs serving one room (a closet spur) are fine; a deep plan with a single long corridor is a design choice, not a defect, if the corridor is labelled circulation. Failure symptom: the only route to the WC crosses the living room, and every check in FP-04..FP-11 passes.

### FP-23 Model stairs and lifts as opening-bearing portal objects with explicit approach
- Rule: Vertical links are not walkable tiles; they are tagged objects anchored to a tile rectangle with a clear landing, and their alignment plus capacity is what makes them valid.
- Evidence: Openings between spaces are represented as explicit graph nodes in the vector models (Graph2Plan's edges are door-mediated or proximity-mediated; HouseDiffusion emits interior/front door nodes — the exact two-class taxonomy is on the paper body, which this pass did not read past the abstract, so it is UNVERIFIED), which on this host generalises to *any* connection that is not a plan movement — hence `portal` objects. The FP-13 cross-floor constraint that anchors a portal's position rests on host engineering necessity (soil stacks, lift hoistways) and FP-12 repetition — **not** on an MSD measurement (see FP-13's repaired citation). Real stair/lift dimensions are from standard practice, not from the datasets.
- Source: Graph2Plan https://arxiv.org/abs/2004.13204 — T2; HouseDiffusion https://arxiv.org/abs/2211.13287 — T2; MSD https://arxiv.org/html/2407.10121v3 — T2; dimensions `UNCITED — heuristic`
- Class: ENGINEERING CONSTRAINT
- Scope: universal on this host (heights unavailable, so the portal *is* the vertical model)
- Confidence: High on the host requirement, Low-Medium on the real dimensions.
- Grid translation: straight stair: real flight ~1.0-1.2 m plus landing → allocate `≥ 2` tiles wide × `≥ 8` tiles long per run (1.0 × 4.0 m), with a `2×2`-tile clear landing at each end; lift: car `≥ 4×4` tiles (2.0 × 2.0 m), landing clear zone `≥ 5` tiles (2.5 m) in front, portal rectangle *identical* on every served floor; assert the approach tiles are `walkable`, not `door`, and that the portal's queue capacity scales with the floors and units it serves.
- Exceptions / failure mode: A single-tile portal cannot be validated against a plan width and will read as a blocked tile in the flood-fill; escalators/ramps and external stairs change the geometry but not the alignment rule. Failure symptom: stairs that land inside a wall on the floor below, which is invisible per-floor and only caught by FP-13.

### FP-24 Keep a failure-mode taxonomy as a named validator suite
- Rule: Implement each reported generator failure as its own named, separately reported validator — overlap, disconnection, out-of-boundary, misaligned walls, invalid openings, missing/duplicate rooms, topology-geometry mismatch, stack misalignment — so regressions are attributable to a cause.
- Evidence: Every source names a different slice of the same taxonomy: Graph2Plan (coverage, interior, mutex), HouseDiffusion (duplicate or missing rooms, ignored constraints), the benchmark (overlap, total area as self-consistency; plus compatibility), and the review (unnecessary overlap between rooms). Taken together they are a ready-made checklist; the point of the rule is that a single "validity score" hides which failure regressed.
- Source: Graph2Plan https://arxiv.org/abs/2004.13204 — T2; HouseDiffusion https://arxiv.org/abs/2211.13287 — T2; benchmark https://arxiv.org/html/2407.15723v1 — T2; review https://arxiv.org/html/2504.09694v1 — T2
- Class: CODE REQUIREMENT
- Scope: universal
- Confidence: High.
- Grid translation: `validators = {noOrphanRooms, noOverlapMasks, coverageComplete, roomsInsideHull, doorsSeparateTwoSpaces, minRoomSide, maxAspectRatio, windowForHabitable, moduleStackAligned, portalAlignedAcrossFloors, circShareInRange, zoneTransitionsLegal, agentWalksAllTargets}`, each returning `{name, failures: [{tiles, roomIds}], severity}`; run all, report all, gate only on the `hard` subset so soft-preference failures never block a save.
- Exceptions / failure mode: Validators that overlap in cause (a missing door creates both a `doorsSeparateTwoSpaces` and an `noOrphanRooms` failure) must deduplicate to a root cause, or the report drowns. Failure symptom: "plan invalid" with no pointer to the tile to fix.

### FP-25 Calibrate priors against a hand-checked local reference floor before trusting a published number
- Rule: Before shipping any prior, generate the smallest plan that satisfies it and compare — by metric and by eye — to a reference floor of the target type; a prior that produces an unreadable plan is wrong even when a paper stated it.
- Evidence: The field itself demonstrates why: published models and datasets disagree on how many plans and which subset they use (RPLAN at **80,788** in the *DStruct2Design* benchmark, "80K / 13 room types" as consumed by Graph2Plan, "60,000 vector floorplans from RPLAN" reported for HouseDiffusion — the last is from the paper body, which this pass did not read past the abstract, so it is UNVERIFIED), and MSD needed to filter 2,305 non-residential plans (16.6 %) before it was usable — same underlying corpus, three different defensible numbers. A local reference floor is the only quantity in this file's loop that is not version-dependent.
- Source: benchmark https://arxiv.org/html/2407.15723v1 — T2; Graph2Plan https://arxiv.org/abs/2004.13204 — T2; HouseDiffusion https://arxiv.org/abs/2211.13287 — T2; MSD https://arxiv.org/html/2407.10121v3 — T2
- Class: HEURISTIC
- Scope: universal
- Confidence: Medium (process rule; its value depends on the discipline of running it).
- Grid translation: keep `3-5` reference floors per supported type in-repo; run the host room derivation and export its distributions (areas, AR, door counts, ext_run, circ_share, depth) as the in-repo prior; report `Δ(prior_paper, prior_reference)` per metric per release and let the reference win on conflict. A prior with no reference floor for its type must ship with `Confidence: Low` visible in the config.
- Exceptions / failure mode: Reference floors over-fit a single building; keep at least one deliberately awkward reference (narrow infill, L-shape) so the priors do not encode only the tidy case. Failure symptom: a generator that produces only rectangular footprints because every reference was rectangular.

---

## Sources

Datasets (all verified to exist; sizes as stated by the cited page):
- **CubiCasa5K** — 5,000 floor plan images, "over 80 floorplan object categories", polygon/vector annotations, multi-task segmentation + geometry model. The README does **not** state a country of origin or that the plans are *houses* — the "Finland / house" tags elsewhere in this file are inferred from the publisher, not quoted from the page. https://github.com/CubiCasa/CubiCasa5k — T1/T2 (dataset + paper).
- **RPLAN** — residential floor plans; **80,788** plans per the *DStruct2Design* benchmark (this file previously carried "80,315", a figure present in none of the three cited sources), **13 room types** and "80K" per Graph2Plan, **60,000 vector floorplans** subset reported for HouseDiffusion (that last figure comes from the paper body, which this pass did not read past the abstract — UNVERIFIED). Cited through its consumers, not a first-party page: https://arxiv.org/abs/2004.13204, https://arxiv.org/abs/2211.13287, https://arxiv.org/html/2407.15723v1 — T2.
- **FloorPlanCAD** — 10,000+ CAD drawings, "line-grained annotations of 30 object categories". https://arxiv.org/abs/2105.07147 — T2.
- **Swiss Dwellings** — apartment models from Archilyse; **over 45,000 apartments** (Zenodo record wording; the false precision "45,176" is not on the record), ~370,000 rooms, ~3,100 buildings; room categories include living, kitchen, bathroom, balcony, loggia, entrance ("bedroom" not surfaced on the categories list — UNVERIFIED). https://zenodo.org/records/7788422 — T1/T2.
- **MSD** — 5,372 plans / 18.9 K units, filtered to residential (2,305 = 16.6 % removed), adds room type + **four functional zones** (`zone1` private / `zone2` public / `zone3` service / `zone4` outside) + shared unit IDs across floors of multi-storey apartments (§8.1; **not** a room-position vertical-alignment measurement — see FP-13). The previously cited "165.3 K rooms" figure did not surface in the fetched text and is UNVERIFIED; the "(Modified Swiss Dwellings)" expansion is the file's gloss, not the paper's title. https://arxiv.org/html/2407.10121v3 — T2.
- **3D-FRONT / LIFULL** — named as other layout-generation corpora (interior/apartment-listing data) only via the review's dataset list; not independently inspected. https://arxiv.org/html/2504.09694v1 — T2 (second-hand).

Generation research:
- **Graph2Plan: Learning Floorplan Generation from Layout Graphs** — room-adjacency graph (nodes = rooms, edges via doors *or proximity*) → raster; validity checks **coverage / interior / mutex** (Eq. 2 losses `L_coverage`, `L_interior`, `L_mutex`); **average room-box IoU reported at ≈ 0.65** — an evaluation score, *not* an acceptance threshold (audit 04 A6b). https://arxiv.org/abs/2004.13204 — T2.
- **HouseDiffusion: Vector Floorplan Generation via a Diffusion Model with Discrete and Continuous Denoising** (arXiv 2211.13287; "CVPR 2023" was the file's claim, not confirmed on the abstract page — UNVERIFIED) — abstract confirms title, exact title, and evaluation on RPLAN; joint discrete+continuous denoising is the paper's own framing. Body-level details (interior/front door taxonomy, FID, modified graph edit distance, the 60,000 count, the "duplicate or missing rooms" critique of baselines) were **not readable on the abstract page** this pass and are UNVERIFIED. https://arxiv.org/abs/2211.13287 — T2 (abstract only).
- **DStruct2Design: Data and Benchmarks for Data Structure Driven Generative Floor Plan Design** (Luo, Lara, Luo, Golemo, Beckham, Pal) — **arXiv preprint, not an ECCV-track paper** (audit 04 A8). RPLAN (80,788) and ProcTHOR-10k (12,000); metric split into **self-consistency** (e.g. overlap and total-area style numbers; the file's earlier naming of those two as *the* two measures did not surface on the fetch), **prompt-consistency**, **compatibility** (GED over the input **bubble diagram**, not a door graph — mildly different from FP-02's framing); benchmarks House-GAN, House-GAN++, HouseDiffusion, ArchiText, AnyHome, Holodeck. https://arxiv.org/html/2407.15723v1 — T2.
- **Computer-Aided Layout Generation for Building Design: A Review** — constraint families confirmed on the fetched page: "residential boundary" and "bubble diagram"; "circulation" and "proportion" as *named* families did not surface (that grouping is this file's reading, not the review's list); metric triple FID/GED/IoU ✔; failure quote "occasional unnecessary overlap between rooms" (the file drops "occasional" — noted); **no "office/industrial are neglected" statement appears in the fetched text** — that claim in FP-19/FP-20 is this file's own negative survey, not the review's (audit 04 A9b). https://arxiv.org/html/2504.09694v1 — T2.

Standards:
- **2010 ADA Standards for Accessible Design, Chapter 4** — §403.5.1 clear width 36 in (915 mm) min; §403.5.3 passing spaces 60 in (1525 mm) min; §404.2.3 door clear width 32 in (815 mm) min. https://www.access-board.gov/ada/chapter/ch04/ — T1.

## Weak or contested

- **RPLAN's size is stated three different ways** (80,788 per the *DStruct2Design* benchmark / "80K with 13 room types" per Graph2Plan / "60,000 vector plans" reported for HouseDiffusion — the last from the paper body, abstract only read, UNVERIFIED). Any prior attributed to "RPLAN" is subset-dependent; treat exact counts as unusable and record which paper's split you mean. The file's earlier "80,315" figure appeared in none of the three sources and has been replaced throughout (audit 04 A1). Same applies to Swiss Dwellings, whose released Zenodo record counts **over 45,000 apartments** rather than a unique floor-plan count (the "45,176" was false precision), and which MSD had to filter (2,305 non-residential plans, 16.6 %) to make residential.
- **MSD does not document room-position vertical alignment.** It preserves *shared unit IDs* across floors of multi-storey apartments (§8.1). FP-13's earlier "MSD explicitly documents vertical alignment of rooms across storeys" attribution was wrong and has been replaced with an engineering-practice rationale + FP-12 repetition; Confidence High → Medium (audit 04 A4b, D1). The rule itself stands.
- **No public dataset in this survey carries non-residential room taxonomies.** Office/healthcare/hospitality/industrial priors in FP-06..FP-11 and FP-20 are operational reasoning, not measurements. Contested by nothing, simply unsourced — hence `Confidence: Low` and the quarantine rule FP-19. The "the review states office/industrial are neglected" attribution is **UNSUPPORTED as a citation**: the fetched review text does not contain that statement (audit 04 A9b). FP-19/FP-20 now present it as INFERENCE, this file's own negative survey result.
- **Whether topology or geometry dominates perceived validity is not directly measured** in any source found. FP-03's ordering is an **engineering** choice on this grid ("we gate on topology because our validators can check it"), not a human-perception claim; the earlier "IoU ≥ 0.65 as a loose published threshold" wording was wrong — 0.65 is Graph2Plan's *average IoU score*, not an acceptance gate (audit 04 A6b). The rule's tile-grid 0.65 constant is now labelled a project-chosen default. A stricter reading is that the two are entangled in every published evaluation.
- **CubiCasa5K's "(Finland)" origin and "*house*" label are inferred** from the publisher, not stated on the README (audit 04 A2). The "(Modified Swiss Dwellings)" expansion of MSD and the "bedroom" category name on Swiss Dwellings' list are likewise unconfirmed.
- **HouseDiffusion body-level specifics were abstract-only this pass** (audit 04 A7): the "60,000 vector floorplans", the two door classes, the FID + modified-GED attribution, and the "duplicate or missing rooms" critique are plausible but **UNVERIFIED** — do not treat any of them as quotable.
- **Corridor/circulation share has no verifiable numeric source** in the datasets; all bands in FP-09 are placeholders. Real circulation ratios also depend on plan depth and core position, which a tile grid cannot express faithfully.
- **Windows as a daylight proxy is a host-enforced approximation.** The datasets annotate window objects; this grid has no heights, no glazing, no orientation in the rules above, so FP-08 checks *perimeter access*, not daylight. Any claim stronger than that is unsupported.
- **Unverified names deliberately excluded:** ITP ("iterative transformer prediction", geometric-graph consistency) and Pictor (Microsoft floorplan synthesis) were searched and returned nothing I could confirm; neither is cited anywhere in this file. House-GAN++ / HouseGAN and ArchiText appear only as second-hand names inside the benchmark and review, so they are not load-bearing for any rule. CADI4RNN could not be verified at all and is excluded.
- **The `0.5 m` wall is not a real partition.** Every wall-derived number here (perimeter runs, wall tax, room clear widths) is inflated versus a 100-200 mm partition, so real-plan statistics must be biased when transferred — this is the single largest systematic error in Domain A's translation onto this grid.

## Type-specificity audit

| Type | What the public data actually covers | Priors transferable to it from this file | What must be authored locally (unsourced) | Confidence |
| --- | --- | --- | --- | --- |
| Residential — house | CubiCasa5K (5,000), RPLAN (80,788 / 13 labels; DStruct2Design benchmark count), generation models trained on it | FP-01..FP-08, FP-10..FP-11, FP-14..FP-18, FP-22, FP-24 — the whole residential prior | Area/AR bands as *numbers* (FP-05/06); corridor share (FP-09) | Medium-High |
| Residential — apartment stack | Swiss Dwellings (over 45,000 apts), MSD (5,372 plans, four functional zones, shared unit IDs across floors — **not** a room-position alignment measurement; see FP-13) | FP-11, FP-12, FP-13 are best supported here; plus everything above | Lift/core sizing, unit-mix repetition ratio | Medium |
| Hospitality | No plan dataset found. MSD's apartment stacks are the closest structural analogue (repeat module + core + stacks) | FP-02, FP-04, FP-12, FP-13, FP-15..FP-18, FP-21, FP-23 (module repetition, stack alignment, portal rules) | Guest-room bands, double-loaded corridor width, back-of-house, service/guest separation, all adjacency priors | Low |
| Healthcare | No plan dataset found | FP-04, FP-13, FP-15..FP-18, FP-21 (ADA widths are code, not residential habit), FP-24 | Ward module, nurse-station sightlines, clean/dirty zoning, bed-bay sizing, corridor share | Low |
| Office | **Our survey** (INFERENCE, not a review statement): no non-residential room taxonomy in the datasets named here; 3D-FRONT/LIFULL are interior/apartment data, not workplaces | FP-02, FP-04, FP-09..FP-11, FP-17..FP-18, FP-21, FP-22, FP-24 | Core position, open-plan labelling (breaks FP-05/06 bands), perimeter depth-to-window ratio | Low |
| Commercial / retail | No plan dataset found | FP-04, FP-17, FP-18, FP-21, FP-24 | Front/back-of-house split, unit subdivision grid, shopfront-vs-service doors, circulation as selling area | Low |
| Industrial | **Our survey** (INFERENCE, not a review statement): no non-residential room taxonomy in the datasets named here; nothing in the datasets approaches industrial | FP-04, FP-15..FP-18, FP-21, FP-23, FP-24 (and mostly as *disabled* checks) | Clear-span single walkable hall, dock doors, turn radii for equipment, hazardous zoning — none expressible with `walkable|blocked|door` | Low |
| General / all types | Structural results replicate across every dataset and paper regardless of type | FP-02, FP-03, FP-04, FP-15, FP-16, FP-17, FP-18, FP-19, FP-24 (topology, exclusivity, single source of truth, metric suite, taxonomy discipline) | Nothing — but each general rule still needs a type-specific constant table | High |
