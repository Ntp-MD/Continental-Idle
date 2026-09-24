# Research file — Domain E: Construction (structure, services, buildability on a 0.5 m tile grid)

Scope: what makes a plan *constructible* — grid and span behaviour, where columns and cores may sit,
transfer, shafts and plant, MEP plan consequences, maintenance access, sequencing economics, and
material logic. It is written against a host grid with **no section**: `1 tile = 0.5 m`, wall = one
blocked tile, tile states `walkable | blocked | door` only, rooms = 4-connected flood-fill with door
cells belonging to no room, A* octile movement (diagonals need both orthogonal neighbours open and
unoccupied), vertical = `portal`-tagged objects with queues, and **no heights, slabs, beams, columns,
materials or section**. Every structural claim below is therefore expressed as a **plan proxy** the
agent can actually check: *span* = clear tile distance between bearing tile lines; *column line* = a
run of blocked tiles continuous across floors; *shaft* = a repeated blocked cluster on the same plan
position across floors; *service band* = a tagged tile row alongside a corridor. Anything the grid
cannot represent is labelled `REQUIRES ENGINEERING VERIFICATION`, never asserted as fact.
Numeric spans are *working* plausible ranges, not design values. `1 m = 2 tiles` throughout.

**Status of the numbers in this file (post-audit label check).** The numeric bands below are
engineering-plausible *working* values; none of them was retrieved from a readable published table in
this pass, so no band is a sourced figure — the citations name where to look, not what was found. The
*tile proxies* (m→tile conversions, the check shapes, the reject logic) are the reliable part of this
file: they are arithmetic and host-code facts, and they were verified. Verify any band against the
named authority's table row before it becomes a design constraint.

## Rules

### CN-01 Fix the structural grid before placing any room
- Rule: Choose a single orthogonal grid (bay dimensions + grid labels) for the whole building first, then draw rooms on it; every load-bearing line must land on a grid line, and no wall may be placed at a random offset from the grid.
- Evidence: Grid discipline is the organising device of building construction: dimensioning and coordination are taken from a grid of column/wall lines (modular coordination reduces component variety and cost). Ching & Roundtree present structural grids/column spacing as the frame of the plan before enclosure and partition layout. **Audit correction:** this rule previously asserted that "the modular coordination literature recommends 3 m as the minimum rational dimension for buildings" — that was a unit/label slip for ISO 2848's *3M* coordinating module (3 × 100 mm = **300 mm**), not a 3 m floor; the standards appeal is withdrawn. value NOT ESTABLISHED — retrieve ISO 2848 clause text (basic module, preferred series, any stated minimum building dimension) before use. The 6-tile (3.0 m) axis floor below is this project's chosen working value, not a standard.
- Source: Francis D. K. Ching & Mark M. Roundtree, *Building Construction Illustrated*, 6th ed., Wiley (2023), "Structural" / dimensioning chapters — T3 (edition not value-read); Ching, *Architectural Graphics*, "Dimensioning" (grid lines) — T3; ~~ISO modular coordination "3 m minimum"~~ **WITHDRAWN: 3M = 300 mm, see Evidence**; UNCITED — heuristic on the "before rooms" ordering as a hard rule and on the 3.0–9.0 m axis band.
- Class: DESIGN PRINCIPLE (grid discipline; the `{6,8,10,12,14,16,18}`-tile axis band is a project-chosen working range, not a standard's requirement)
- Scope: universal for multi-storey framed buildings; weaker for vernacular/one-off domestic
- Confidence: Low (numeric band unverified) for the 3.0 m floor and the 9.0 m top; High for grid discipline as an ordering
- Grid translation: Check `every blocked-tile run of length ≥ 4 lies on one of ≤ N declared grid axes (x or z)` and `clear distance between adjacent parallel axes ∈ {6,8,10,12,14,16,18} tiles (3.0–9.0 m)` — the set is a **working band (heuristic)**, not a code range. Reject a plan whose bearing lines are at non-grid offsets — on this grid that is a tile row that appears on one floor and not the next.
- Exceptions / failure mode: Cantilevered and free-form zones are allowed *off* grid only if they carry no bearing line. Failure symptom: a "wall" tile row that exists on floor 3 but not floor 4 with a room underneath — on this grid the agent cannot see the error, so the check must be cross-floor.

### CN-02 Prefer a regular grid; make every irregular bay pay for itself
- Rule: Default to equal spans in both directions. An irregular bay is permitted only when it buys an explicit programmatic benefit (long-span public space, site boundary, future demolition line), and the cost is written into the design rationale.
- Evidence: Repetition and standardisation lower formwork, falsework and rework cost; irregular geometry produces unique formwork, more cutting waste and slower setting-out — the recurring argument in construction-economics and industrialised-construction literature (prefabrication/"kit of parts" economics). Design for Manufacture and Assembly (DfMA) treats geometric variety as a direct cost driver.
- Source: Ching & Roundtree, *Building Construction Illustrated*, 6th ed. — T3; DfMA / standardisation literature — T2/T3 (see Sources); specific cost deltas: **UNCITED — heuristic**, do not quantify without a source.
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: Medium
- Grid translation: `count(distinct bay widths) ≤ 3` and `count(distinct bay depths) ≤ 3` per building; each additional distinct value is an exception needing a reason string. Irregularity in tile terms = a bearing line whose spacing to its neighbour differs from the modal spacing by ≥ 2 tiles (1 m).
- Exceptions / failure mode: Site-boundary-driven podium plans, structured parking with a ramp spiral. Failure symptom on this grid: irregular bays are invisible structurally but they destroy room reuse — the same plan typed as a repeatable hotel floor fails the module test and every room becomes a one-off.

### CN-03 Run column lines straight through the building, floor to floor
- Rule: A bearing line must be continuous in plan position from the lowest to the highest floor it supports. No column line may start or stop mid-height, and no line may shift laterally between floors, without a declared transfer.
- Evidence: Vertical load-path continuity is the first requirement of structural framing; gravity loads must reach the foundation along an unbroken line of columns, walls and footings (standard structural-construction teaching). Ching & Roundtree and the structural chapter of *Architecture: Form, Space, and Order* both present load path as a straight descending chain.
- Source: Ching & Roundtree, *Building Construction Illustrated*, 6th ed., structural chapters — T3; Ching, *Architecture: Form, Space, and Order*, 5th ed., Wiley — T3; exact capacity design rules: **REQUIRES ENGINEERING VERIFICATION**.
- Class: ENGINEERING CONSTRAINT
- Scope: universal (framed and bearing-wall construction)
- Confidence: High
- Grid translation: Build `columnLine(floor, axis)` = the set of blocked tiles on that axis. Enforce `columnLine(f) ⊆ columnLine(f-1)` for all f above the base — a line present above must exist below on the *same tile row/column*, not offset by even one tile (0.5 m).
- Exceptions / failure mode: Podium towers, transfer at a plant level, stepped towers. Failure symptom: the agent "sees" a valid plan on each floor; the violation only exists in the cross-floor diff, which is why CN-03 must be a checked rule, not a taste.

### CN-04 Pick the floor system from the required span, not from the plan you already drew
- Rule: Determine the required clear span from the program, then select the floor system; never reverse the order to rescue a favourite plan depth.
- Evidence: Standard construction texts present floor-system choice (beam-and-slab, flat slab, waffle, ribbed, steel+deck, composite, CLT, load-bearing masonry) as span- and load-driven, with each system having a range in which it is economical. Structural handbooks do publish economical-span tables — but **none was readable in this pass**, so the numbers in the table below are this file's *working heuristic bands*, not reproduced values; "see the source named in the row" means "go read it", not "we read it".
- Source: Ching & Roundtree, *Building Construction Illustrated*, 6th ed. — T3; *Structural Details for Architecture and Design* (Schumacher/Lange, Birkhäuser) — T3; Concrete Centre / Eurocode-based span tables and AWC *CLT Handbook: US Edition* span tables (see Sources) — T1/T3; **no table row was read in this pass; every specific metre figure is a working heuristic to verify before use.**
- Class: DESIGN PRINCIPLE (the ordering is sound; the span numbers it consults are HEURISTIC — see CN-05)
- Scope: universal
- Confidence: High (method), Low (numeric band unverified — every table value is a working heuristic)
- Grid translation: `requiredSpan_tiles = max(clear distance between bearing lines over the largest unobstructed space on the floor)`; look the value up in the Span & grid reference table; flag the system if `requiredSpan > bandUpper` (the band top is a heuristic working value, so exceeding it raises `needs-section-review` rather than proving incapacity; only the CN-04/CN-24 *bearing-line* logic is a hard reject). On this grid: 6 tiles = 3 m sits at the top of the masonry / one-way CLT *working* band (heuristic, unverified), 12 tiles = 6 m, 16 tiles = 8 m, 24 tiles = 12 m (PT/steel territory, likewise heuristic).
- Exceptions / failure mode: Basements, roofs over atria, and grand spaces deliberately exceed the band and then need steel/truss — an explicit `REQUIRES ENGINEERING VERIFICATION` escalation. Failure symptom: an 18-tile (9 m) clear span declared as "load-bearing masonry" — about 3× the 3.0 m working ceiling in the table, which is what makes it a reject; the metre figure is heuristic, the *ratio* is the argument.

### CN-05 Keep spans inside the working band for the chosen system
- Rule: Enforce a maximum span per floor system and per building type; a plan whose clear distance between bearing tile lines exceeds the band is flagged for section review, and on this grid treated as invalid, however good it looks.
- Evidence: That each system has an economical range is standard teaching; the *values* are this file's working bands. **No retrieved source states any band below** (see Weak item 13) — the flat-slab 6–9 m figure, the PT 8–12 m figure, the masonry ceiling and the CLT range are engineering-plausible planning numbers, and the previous wording ("commonly quoted", "published") overstated their standing. Masonry is limited to short spans and CLT floor panels to spans well below 6 m *as a working assumption*; the two earlier masonry figures in this file (table 3–6 m, text 4.5–6 m) are harmonised to the table's 3.0–6.0 m. Exact upper values depend on loading, fire and deflection, none of which the grid models.
- Source: The Table — each row names where the band *should* come from; Concrete Centre / Eurocode 2 span guidance, AWC *CLT Handbook: US Edition* (span tables), SCI composite design guides, BSRIA/industry guides (see Sources) — T1/T3, **located and not value-read**; **every numeric row is UNCITED — heuristic, Low confidence.**
- Class: HEURISTIC (span bands are working planning values — no published table row was read in this pass; do not present them as engineering constraints or code)
- Scope: universal
- Confidence: Low-Medium (numeric bands unverified — every band is a plausible working value, no source opened), Medium-High (that bands exist per system and must be enforced as plan-review triggers)
- Grid translation: Compute per-floor `span = clear tiles between adjacent bearing lines × 0.5 m`, exclude core and shaft tiles. Fail if `span > bandUpper` or if `span < bandLower` on a framed system (a grid finer than the system's economic minimum is also an error — over-framing).
- Exceptions / failure mode: Cantilevers, one-way slabs onto beams, and flat-slab-with-drop-panels shift the band; no drop panel exists on this grid, so treat the table values as the whole truth. Failure symptom: a "steel frame" plan on a 4-tile (2 m) grid — structurally possible, economically absurd.

### CN-06 Give every slab two bearing directions or make it explicitly one-way
- Rule: A column grid must be closed in both plan directions where two-way action is claimed; if the frame only has bearing lines in one direction, the plan must be treated as a long-span one-way system with the associated tighter span limits.
- Evidence: Two-way slab behaviour requires support on (at least) opposite edges; one-way spanning requires closer beam spacing, and ribbed/waffle systems are chosen precisely to span between beams in one direction while the ribs act compositely. Standard structural teaching, and the reason bay proportions are expressed as a ratio to a limit.
- Source: Ching & Roundtree, *Building Construction Illustrated*, 6th ed. — T3; Reinforced Concrete Design / Concrete Centre one-way vs two-way span guidance (see Sources) — T1/T3; the specific `1.5:1` proportion limit below is **UNCITED — heuristic**.
- Class: ENGINEERING CONSTRAINT (two-way support is real behaviour; the `1.5` aspect number is a chosen heuristic, not a sourced limit)
- Scope: framed and bearing-wall construction
- Confidence: Medium (behaviour), Low (numeric band unverified for the 1.5 limit)
- Grid translation: `for each slab panel: bearing lines exist on ≥ 2 opposite tile edges`; and `panelAspect = maxSpanTiles/minSpanTiles ≤ 1.5` for a panel claimed as two-way, else reclassify as one-way and apply the one-way span limit. Tile arithmetic: a 16×24-tile panel has aspect 1.5 (8 m × 12 m).
- Exceptions / failure mode: Corridors, galleries and balconies are legitimately one-way strips. Failure symptom: an agent puts columns on two grid lines only and calls the 12-tile-wide strip "two-way flat slab".

### CN-07 Put columns where they do not fight the plan
- Rule: Land columns on grid lines that pass through structure or furniture zones (party walls, corridor edges, core boundaries), never inside a room's clear area, never in front of a door tile, and never inside a required clear width or turning space.
- Evidence: Columns are the recurring plan obstacle in every building type; the standard instruction is to align them within walls or in the service zone, and to keep them out of circulation clearances and parking/manoeuvring paths. Accessibility guidance fixes minimum clear widths and a turning space that a stray column can violate — **the millimetre figures below are working proxies, not retrieved from ADA 2010 / ANSI A117.1 in this pass**: value NOT ESTABLISHED — retrieve ADA 2010 §304.2 (turning space) and §404.2 (clear width), or ANSI A117.1 equivalents, before any of these numbers is used as a constraint. Keep the working values (915/1067 mm clear, ~1500 mm turning circle) as tiles = 2 tiles / 2 tiles / 3 tiles, remembering that 1500 mm = **3×3 tiles**, not 6×6 (the earlier "6×6-tile open square" was a 2× linear / 4× area conversion slip: 6 tiles = 3.0 m; it over-rejected legal column positions and contradicted grid-translation GT-05).
- Source: Ching & Roundtree, *Building Construction Illustrated*, 6th ed. — T3; ADA 2010 Standards / ANSI A117.1 clear-width and turning-space provisions (see Sources) — **T3 target, not read this pass: the §304.2/§404.2 clause text is outstanding**; "align columns in walls" as a universal rule: **UNCITED — heuristic**.
- Class: DESIGN PRINCIPLE (the clearance-protection intent is code-adjacent; the millimetre proxies here are unverified working values)
- Scope: universal; sharper in hotels, hospitals, parking, retail
- Confidence: High (that columns must miss required clearances), Low (numeric band unverified — widths and turning circle not read from the standard)
- Grid translation: A column is a blocked tile (0.5 m square, i.e. 0.25 m² of plate) — model it as an isolated blocked tile on a grid intersection. Enforce: `column tiles ∉ room interior tile sets`, `column tile not adjacent to a door tile within 2 tiles (1.0 m) of its swing line`, `no column inside any corridor tile run narrower than 4 tiles (2.0 m)`, `column ∉ wheelchair turning circle (a **3×3-tile** open square, i.e. 1500 mm across — corrected from the earlier 6×6, which was 3.0 × 3.0 m)`. The 2-tile door-swing and 4-tile corridor margins are chosen thresholds, not standard values.
- Exceptions / failure mode: Perimeter columns in facades and parking are intentional and must be coordinated with bay spacing and sightlines. Failure symptom: a lobby with a column grid that reads as valid plan tiles but strands every path between door tiles.

### CN-08 Use cores for lateral stability and make them straight, tall and unbroken
- Rule: Every building above low-rise needs a lateral-load path; place it as one or more shear cores whose walls run continuously from the roof to the foundation, positioned to resist torsion symmetrically, and sized by the lift/stair shaft they enclose.
- Evidence: Shear walls/cores are the standard lateral system for mid- and high-rise; they must be continuous, aligned and detailed for overturning and torsion, and cores are typically clustered around vertical transport. Lateral-system literature (CTBUH, structural handbooks) consistently ties core count and position to building height and plan asymmetry.
- Source: Ching & Roundtree, *Building Construction Illustrated*, 6th ed. — T3; CTBUH height/lateral-system guidance (see Sources) — T1/T3; *Reinforced Concrete Design* (Park & Paulay) — T3; the specific "one core per 700 m² plate" style ratios: **REQUIRES ENGINEERING VERIFICATION**, do not use.
- Class: ENGINEERING CONSTRAINT
- Scope: mid/high-rise and any framed building; n/a to load-bearing masonry below ~4 storeys
- Confidence: High (behaviour), Low (numeric thresholds)
- Grid translation: A core = a rectangular ring of blocked tiles containing door-free `portal` tiles, present at the *same tile rectangle* on every floor from top to base, with `min(clear internal dimension) ≥ 6 tiles` per lift group. Enforce `core centroid ≈ plate centroid` within a few tiles (torsion proxy) and `core walls form ≥ 2 orthogonal directions`.
- Exceptions / failure mode: Outrigger/steel-frame buildings move lateral resistance to the perimeter; a podium may interrupt a tower core (see CN-10). Failure symptom: a plan that shifts the core 3 tiles on the upper floors — free on this grid, fatal in reality.

### CN-09 Do not puncture a lateral core wall
- Rule: Core and shear walls are no-punch zones: no door tiles, no shaft penetrations, no room subdividing them, and no service runs through them without a declared penetration with its fire rating.
- Evidence: Openings destroy shear-wall action and require boundary elements and coupling beams; codes and details regulate penetrations in rated walls, and firestopping applies at every service penetration of a fire barrier. This is why corridor doors and shaft doors are relocated off the shear face in real plans.
- Source: Ching & Roundtree, *Building Construction Illustrated*, 6th ed. — T3; ICC Evaluation Service / UL firestop listings and IBC shaft-enclosure provisions (see Sources) — T1; specific pier-width limits: **REQUIRES ENGINEERING VERIFICATION**.
- Class: CODE REQUIREMENT
- Scope: universal where cores carry lateral load
- Confidence: High
- Grid translation: `coreWallTiles = the blocked-tile ring of the core cluster`; assert `no door tile ∈ coreWallTiles` and `no tagged-shaft tile adjacent to coreWallTiles without a rated-penalty flag`. Because the host's only tile states are walkable/blocked/door, the *only* legal representation of a core penetration is a door tile — so banning door tiles from the core ring bans ad-hoc penetrations by construction.
- Exceptions / failure mode: A stair needs a door into the stair; place it on a non-shear wall face (coupled by a pier ≥ several tiles) and log it. Failure symptom: an agent "helpfully" puts four doors into one core to shorten travel distance.

### CN-10 Treat any change of load path between floors as a transfer and flag it
- Rule: Wherever a bearing line above does not continue below (column removed, wall stopped, grid shifted), record a `transfer` object naming the transferring floor, the load direction, and the element that carries it; unlabelled discontinuity is invalid.
- Evidence: Transfer slabs/girders are the standard device for changing column grids between levels (podium-to-tower, plant over retail); they are expensive, deep, heavily reinforced and require additional props/formwork, so they are minimised. Published transfer examples (long-span transfer girders and slabs) note the depth and cost penalty relative to a normal floor.
- Source: CTBUH transfer-structure articles and case studies (see Sources) — T1/T3; Ching & Roundtree, *Building Construction Illustrated*, 6th ed. — T3; transfer slab depths quoted in case studies: verify per project — **REQUIRES ENGINEERING VERIFICATION**.
- Class: ENGINEERING CONSTRAINT
- Scope: framed construction, podium/tower, retrofit
- Confidence: High
- Grid translation: `if columnLine(f) ≠ columnLine(f-1) on axis a → require transfer(f, a)`; represent the transferring floor's carrying element as a blocked-tile line (thicker: 2 tiles = 1.0 m) at the level *below* the discontinuity so the agent has a visible marker. Also flag `portal` (lift) shafts whose tile footprint changes size between floors — shafts cannot change section silently.
- Exceptions / failure mode: Deliberable exceptions: the base floor (no floors below), and a terrace level where the frame stops by design. Failure symptom: a "tower over podium" plan that is 100 % legal on a per-floor grid with no section.

### CN-11 Stack every riser in one vertical zone per quadrant
- Rule: Vertical service routes (soil, waste, cold/hot water, fuel, electrical, comms, extract) must run in a coordinated shaft cluster whose plan footprint is identical on every floor, positioned near the core and within reach of the wet cells they serve.
- Evidence: Coordinated riser zones shorten horizontal distribution, reduce duplicated shafts, and are the basis of the "back-to-back" planning device; service coordination literature and standard planning texts treat riser proximity as the determinant of wet-zone location. Shaft sizing guides (BSRIA, CIBSE) insist on access and insulation clearances rather than pipe calibre.
- Source: CIBSE Guide G (Public health plumbing engineering) and BSRIA knowledge-base shaft/riser guidance (see Sources) — T1/T3; Ching & Roundtree, *Building Construction Illustrated*, 6th ed. — T3; horizontal-run limits: see CN-17.
- Class: STANDARD
- Scope: universal above 2 storeys with plumbing
- Confidence: High
- Grid translation: `shaftSet(f) = blocked-tile clusters tagged as service`; assert `shaftSet(f) == shaftSet(f+1)` for all floors and `max horizontal tile distance from any fixture tile to its nearest stack ≤ N tiles`, where N is set by CN-17's slope/run limit. A shaft that "moves" 2 tiles between floors is invisible on this grid and impossible in a building.
- Exceptions / failure mode: Separated clusters for conflicting services (drinking water away from soil, electrical away from wet) — allowed, but each cluster is still vertically constant. Failure symptom: a bathroom column that jitters tile-by-tile across floors.

### CN-12 Size a shaft by the biggest thing that must fit and be worked on
- Rule: A shaft's plan area is set by the largest component plus insulation plus installation and maintenance clearance plus access panel, never by the pipe or duct calibre alone; provide an access door to every shaft valve and a working face at every cleanout.
- Evidence: Duct and pipe sizing literature requires space for insulation, flanges and a wrench hand; BSRIA/CIBSE guidance on shaft design stresses maintenance access, fire-stopping and the space penalty of insulation; vertical-shaft duct sizing must respect air velocity limits, not just geometry.
- Source: BSRIA (shafts/riser guidance) and CIBSE Guides A (air distribution) / G (public health) — T1/T3; Ching, *Time-Saver Standards* / *Architectural Graphic Standards* shaft and riser details (Wiley) — T3; numeric clearance allowances: **UNCITED — heuristic** unless the retrieved source states a value.
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: Medium
- Grid translation: Minimum legible shaft on this grid: `4×4 tiles (2.0 × 2.0 m) for a combined wet riser group, 3×3 tiles (1.5 m) for a single small riser` — flagged **UNCITED — heuristic**, treated as an order-of-magnitude floor not a rule of thumb to defend. Add `1 tile (0.5 m)` on the access face for an open door leaf. Enforce `every shaft has ≥ 1 door tile on a walkable-adjacent face` (an inaccessible shaft is a defect).
- Exceptions / failure mode: Lift shafts are not service shafts (see CN-08/CN-14 for machine-room rules); refuse-to-enter shafts exist in reality but must never be generated. Failure symptom: a 1-tile "shaft" — a blocked tile that means nothing and cannot be built.

### CN-13 Every shaft and compartment boundary is a fire-rated assembly in plan
- Rule: Shaft enclosures, compartment walls, and corridor walls forming part of an exit route must be represented as rated construction in the plan: continuous blocked-tile enclosure, self-closing rated door tiles, no gaps, and penetration firestopping at every service crossing.
- Evidence: Building codes require shaft enclosures to be fire-separated (commonly rated to match or exceed the connected floor assemblies, with self-closing/protected openings), and compartmentation limits fire spread; firestop systems are tested listings applied at each penetration. IBC/NFPA-type provisions are the usual citations; exact ratings vary by occupancy and height.
- Source: ICC *International Building Code* shaft-enclosure provisions **corrected address: shaft enclosures sit in Chapter 10 *Means of Egress*, conventionally cited as §1022 (IBC 2018/2021) — the previously printed "E1018" is wrong: the E101.x numbering belongs to the accessibility guidelines, not shafts. value NOT ESTABLISHED — retrieve the IBC edition in force and confirm the shaft-enclosure section number before quoting it** ; fire-resistance-rating provisions are Chapter 7 (**confirmed**); NFPA生命安全 provisions; UL fire-tested assembly listings (see Sources) — T1 for the requirement, T3-unread for the clause text. Clause numbers must be re-checked against the edition in force: **REQUIRES ENGINEERING VERIFICATION**.
- Class: CODE REQUIREMENT (the rated-enclosure requirement; the `rated` / `rated_door` tag proxies and the flood-fill check are project convention, not code)
- Scope: universal in multi-storey public buildings; varies by occupancy
- Confidence: High (that shaft enclosure and rated separation are required), Low (numeric band unverified — the clause address and the rating hours)
- Grid translation: Because the grid has only blocked/walkable/door, rated construction is *invisible*: therefore add a tag convention — `rated` on any blocked-tile run forming a shaft or compartment boundary, and `rated_door` on door tiles inside it. Validate `no untagged gap in a rated ring` (4-connectivity makes this checkable by flood-fill) and `rated enclosure contains every shaft tile`.
- Exceptions / failure mode: Sprinklered buildings relax some requirements; atrium/void cases replace them with other provisions. Failure symptom: a corridor that is "protected" in the design narrative but has 3 untagged door tiles and one missing tile corner.

### CN-14 Put plant where it can be reached, breathed into, and unloaded
- Rule: Central plant (heating/cooling, pumps, switchgear, riser aggregation, laundry/kitchen extract, back-of-house mechanical) sits on a floor with a vehicle-capable route from outside, structural loading adequate for the equipment, and an air supply/exhaust route to the exterior; small distributed plant may sit in a roof or void zone but never inside an occupied room.
- Evidence: Plant-room planning in service-design literature is dominated by access (equipment removal path), ventilation (combustion/heat rejection), structural loading, noise/vibration isolation and drainage. Boiler/chiller plant guidance requires make-up air and heat-rejection paths and clear access for maintenance; CIBSE/ASHRAE handbooks devote chapters to plant room design.
- Source: CIBSE Guide S (Health & safety in building services) and ASHRAE *Handbook: HVAC Applications* (plant rooms chapter) — T1/T3; BSRIA AG/BG guides on plant rooms (see Sources) — T1/T3; Ching & Roundtree, *Building Construction Illustrated*, 6th ed. — T3.
- Class: STANDARD
- Scope: universal for buildings with central services
- Confidence: High
- Grid translation: Require a `plant` room whose door tiles connect to a route of width ≥ 4 tiles (2.0 m) reaching a building entrance or a goods portal; `no plant tile adjacent to an occupied room without a 2-tile (1.0 m) buffer or a rated + acoustic separation`; and `plant room has ≥ 1 exterior-facing wall of ≥ 4 tiles` for air. Roof plant: on this grid it is a `blocked` tile cluster on the top floor tagged `plant` — check the access portal exists (a plant room reachable only through a stair is a defect).
- Exceptions / failure mode: In-use replacement of a chiller via a crane at the facade is legitimate and needs a removable facade panel, invisible here — flag it. Failure symptom: a basement boiler placed inside a 3×3-tile room with a 2-tile door that is a bathroom door.

### CN-15 Give every piece of equipment a removal path, not just a person door
- Rule: Any replaceable component (chiller, boiler, pump set, transformer, lift machine, kitchen hood, AHU) needs an unobstructed path from the loading point to its final position with clear width and height ≥ the item's envelope, and the path must remain usable after the building is fitted out.
- Evidence: Maintenance access is a design-for-maintenance requirement: services must be accessible for inspection, isolation, repair and replacement without dismantling new work; codes and guidance require working clearances in front of equipment (electrical working clearances and access to controls are typical examples).
- Source: NFPA 70 (NEC) working-space provisions for electrical equipment, and CIBSE Guide S / DfM literature on maintainability (see Sources) — **named, none read this pass**; specific clearance distances: **REQUIRES ENGINEERING VERIFICATION** against the edition and apparatus. value NOT ESTABLISHED — retrieve the NEC working-space section and the CIBSE Guide S plant-room access pages before quoting a clearance.
- Class: HEURISTIC (a plan proxy for a real code requirement; the 4-tile widths are chosen values, and the diagonal test below is not a swept-path check)
- Scope: universal
- Confidence: High (that a removal path is required), Low (numeric band unverified — every width figure here is a chosen threshold)
- Grid translation: Path check on tiles: `clearWidth ≥ 4 tiles (2.0 m)`, `no door tile narrower than 4 tiles on a removal path`, `turns allowed only where the corner square is ≥ 4×4 tiles clear` (a 90° turn of a 1.5 m object in a 1-tile corridor fails the corner check — **heuristic plan proxy only, not a swept-path check**: the host's octile diagonal rule tests NPC *occupancy* of the two orthogonal neighbours, which is not a rigid-body turning-envelope test; the real proxy is a swept-path/turning template, which this grid does not have).
- Exceptions / failure mode: Items delivered in sections (site-assembled plant, sectional boilers) and top-down-crane lifts through a removable roof panel. Failure symptom: a valid circulation graph for people, unusable for equipment.

### CN-16 Provide isolation and read-access at every service boundary
- Rule: Each branch, zone and tenant/feed needs an accessible isolation valve or switch, and each consumption point needs a readable meter, both located on a walkable face and grouped in labelled locations on the plan.
- Evidence: Isolation for maintenance and for firefighting, plus metering for tenancy, are basic service-design requirements; guides to plumbing and electrical services require accessible stop valves and distribution boards, and space planning texts list riser/switchgear rooms as mandatory back-of-house area.
- Source: CIBSE Guide G / Institution of Engineering and Technology *On-Site Guide* (BS 7671 wiring regulations companion) for distribution-board and isolation practice (see Sources) — T1/T3; Ching & Roundtree — T3.
- Class: STANDARD
- Scope: universal
- Confidence: Medium
- Grid translation: Tag `valve`/`board` on tiles inside the service band; enforce `every isolated branch has ≥ 1 valve tag within 20 tiles (10 m) of its first fixture`, `every valve/board tile has an adjacent walkable tile that is not inside a room` (i.e. reachable from circulation without entering a private space).
- Exceptions / failure mode: Metering inside a tenant demise is normal in some markets; isolation inside a shaft behind a door is acceptable if the door is accessible. Failure symptom: a "shower with no tap" — here, a fixture with no upstream isolation reachable from a corridor.

### CN-17 Respect gravity drainage: slope costs horizontal distance
- Rule: Waste, soil and rainwater drains fall away from the fixture to a stack; the plan must keep drain runs short and straight, hold a minimum fall per metre, respect the maximum unventated/uninspected run, and never route a gravity drain under a room that cannot tolerate a leak.
- Evidence: Plumbing codes and design guides set minimum design falls and maximum horizontal runs between access points/stacks. The consequence for plan layout — short, straight, stacked runs — is universal. **Arithmetic corrected:** falls are *not* "a few mm per metre" — the retrieved IPC rates work out at roughly 5–21 mm per metre (1/16 in/ft ≈ 5 mm/m, ⅛ in/ft ≈ 10 mm/m, ¼ in/ft ≈ 21 mm/m), and the earlier tile translation was wrong: a 1:100 fall over 50 tiles (25 m) of run drops 0.25 m = **half a tile**, while one whole tile of drop over 50 tiles is 1:50 — which is close to, and steeper than, the smallest code fall.
- Source: BS EN 12056 (gravity drainage systems) design falls/run limits and CIBSE Guide G — **named, not read**; **IPC Chapter 7 *Sanitary Drainage*: slope of horizontal drainage pipe is §704.1, values retrieved from an IPC 2021 adoption mirror (up.codes; New Hampshire adoption) — ¼ in/ft for 2½ in and smaller pipe, ⅛ in/ft for 3–6 in, 1/16 in/ft for 8 in and larger, i.e. the smaller the diameter the steeper the required fall, which confirms the direction previously asserted. Cleanouts are §708 (required locations, maximum spacing about 100 ft ≈ 30.5 m), NOT §707 — the §707 address printed in earlier revisions of this rule was wrong, and because this rule designates clause numbers as "the address to verify against" the error was load-bearing. ICC Digital Codes https://codes.iccsafe.org/content/IPC2018/chapter-7-sanitary-drainage still returns HTTP 403 to retrieval, so the §704.1/§708 figures carry an **adoption-edition caveat**: re-verify against the edition in force.** Practitioner restatement of the cleanout provisions: PHCPPros, *Code requirements for drainage system cleanouts* https://www.phcppros.com/articles/1902-code-requirements-for-drainage-system-cleanouts — T4. **EN 12056 values: value NOT ESTABLISHED — retrieve BS EN 12056-2 (design falls and inspection intervals) before use.**
- Class: CODE REQUIREMENT (the §704.1 falls and §708 cleanout spacing are code text; the 20/40-tile run placeholders below are project heuristics chosen inside those limits)
- Scope: universal where waterborne drainage exists
- Confidence: Medium (the §704.1 falls, retrieved from an adoption mirror not the ICC page), Low (numeric band unverified for EN 12056 and for the 20/40-tile placeholders, which are chosen)
- Grid translation: A fall cannot be seen on this grid, so translate to plan limits: `drainRunTiles(fixtures → nearest stack) ≤ 20 tiles (10 m)` for small-bore waste and `≤ 40 tiles (20 m)` for large soil runs — **UNCITED — heuristic** placeholders, and note that both sit inside §708's ~100 ft (30.5 m) cleanout-spacing ceiling while the 40-tile run's own fall (≈21 mm/m on small bore) would consume 0.84 m over 20 m, i.e. more than a floor build-up; `path must be rectilinear with ≤ 1 bend (no bends through tiles that are neither drain-tagged nor shaft)`, and `no drain-tagged tile beneath a bedroom/kitchen tile` unless the room below is accessible ceiling.
- Exceptions / failure mode: Vacuum/macerated and submersible pumped drainage bypasses slope entirely (common in retrofits); roof drains feed internal downpipes and follow the same stacking rule. Failure symptom: a hotel where bathrooms are scattered so widely the pipe runs cross bedrooms below.

### CN-18 Stack wet cells floor over floor
- Rule: Bathrooms, showers, kitchens and laundry cells must align vertically across floors so that stacks, waste runs and water risers are short and shared; where alignment is impossible, accept and record the cost (concrete containment trays, pumped drainage, sound insulation).
- Evidence: Wet-stack/back-to-back planning is the standard device in repeated-cell buildings (hotels, hospitals, dormitories, apartments) precisely to minimise drainage runs and riser count; the same geometry is used for acoustic grouping ("wet zones buffer noise between rooms") and fire compartmentation.
- Source: Ching & Roundtree, *Building Construction Illustrated*, 6th ed. (bathroom planning and stacks) — T3; hotel/hospital planning literature and case studies (see Sources); *Time-Saver Standards for Building Types* (McGraw-Hill) — T3; specific "wet-over-wet" code prohibition: does not exist as a universal code clause — **do not claim one**; the driver is cost/noise, so Class is DESIGN PRINCIPLE.
- Class: DESIGN PRINCIPLE
- Scope: any repeated-cell building; weaker in offices (single core sanitary) and retail
- Confidence: High
- Grid translation: `for every wet tile on floor f, ∃ a wet tile within the same 2×2-tile footprint on floor f+1 (≥ 80 % overlap)`; compute `wetOverlap(f)` and fail below threshold; also enforce `fixture tile → nearest shaft tile ≤ CN-17 limit` on *every* floor, which is the same test restated.
- Exceptions / failure mode: Ground-floor lobbies/restaurant below first-floor bathrooms is the classic unavoidable case and is solved with a suspended slab/containment tray, not by ignoring the rule. Failure symptom: a "nice" hotel floor whose bathrooms zigzag, producing 30 m drain runs in the section nobody can see.

### CN-19 Reserve a corridor service zone and pay the width penalty
- Rule: Main distribution routes for ducts, pipes, cable tray and fire dampers run above or beside corridors and back-of-house routes; the corridor's structural and clear-height zone must be reserved on the plan, and corridor widths widened to carry the service band when it cannot go above the ceiling.
- Evidence: Coordinated service zones above ceilings are a standard coordination device (the "service zone" band in structural/services drawings); corridor widths are driven by occupancy and movement, and the built width must absorb the ceiling zone depth without dropping below the minimum. Guidance on ceiling-zone coordination is a large part of BSRIA/CIBSE application practice.
- Source: BSRIA BG application guides on service coordination and ceiling zones (see Sources) — T1/T3; CIBSE Guide A for service-space expectations; Ching & Roundtree — T3; minimum corridor widths are occupancy-dependent — use the building-codes research file, not this one, for those numbers.
- Class: STANDARD
- Scope: universal for serviced commercial buildings
- Confidence: Medium
- Grid translation: Represent as a `service band` tag on a row of tiles immediately alongside a corridor (this is representable, and it is the *only* way the host can see MEP): enforce `every corridor ≥ 6 tiles (3.0 m) wide carries a service band of ≥ 1 tile (0.5 m) on one side`, and `no service band crosses a room interior`. Note the effect on movement: a 1-tile band consumed from a 4-tile corridor turns a 2.0 m corridor into a 1.5 m one — which is legal, but the tile check should report the change, not the narrative.
- Exceptions / failure mode: Perimeter/floor-duct and underfloor distribution (common in offices) remove the corridor zone at the cost of slab build-up — invisible here. Failure symptom: a beautiful 2.5 m corridor that cannot be built because nothing was reserved for the 600 mm duct.

### CN-20 Provide access panels and cleanouts exactly where they are needed
- Rule: Every buried drain change of direction, every junction, and every valve/regulator needs an accessible cleaning or isolation point; every fire damper, fan and control device in a duct needs an access door at the device, within reach of the nearest floor level.
- Evidence: Drainage codes require inspection/cleanout access at directional changes and at intervals; HVAC commissioning and maintenance practice requires access to dampers and filters, and damper access is a recognised failure mode in real buildings. CIBSE/BSRIA maintenance-access guidance and NFPA duct requirements cover this.
- Source: IPC/UPC cleanout provisions **corrected address: IPC 2021 §708 "Cleanouts" (max spacing about 100 ft ≈ 30.5 m) — not §707; slopes are §704.1** and BS EN 12056-2 inspection requirements (see Sources) — **EN 12056-2 named, not read**; NFPA 90/ASHRAE damper-access practice — **named, not read**; spacing figures beyond the IPC §708 value: **REQUIRES ENGINEERING VERIFICATION**; value NOT ESTABLISHED — retrieve BS EN 12056-2 and the NFPA/ASHRAE damper-access clauses before quoting an interval.
- Class: CODE REQUIREMENT (the access-at-changes-of-direction rule is code; "an access tile beside every drain bend" is this project's tile proxy for it)
- Scope: universal
- Confidence: Medium (IPC §708 retrieved from an adoption mirror), Low (numeric band unverified for EN 12056-2 and damper intervals — none of those documents was read)
- Grid translation: `each drain-tagged bend tile → require an adjacent access tile (door tile into the void, or walkable tile)`; `each fire damper tile = a door tile where a duct crosses a rated line (CN-13)` → require that tile to be walkable-reachable from circulation. The tile grid can express this genuinely well, because an access hatch *is* a door tile.
- Exceptions / failure mode: Buried-in-slab drains are legal where the space below is a toilet of the same stack (still an access-avoidance cost, see CN-18); some systems are self-cleansing. Failure symptom: an agent hides all services in the void and generates no door tiles at all.

### CN-21 Design a kit of parts and repeat it, then count the repeats
- Rule: Reduce the plan to a small set of reusable dimensional parts (bay, module, cell, riser cluster, door type) and require the same parts to recur across floors; every new part is an exception with a reason.
- Evidence: Repetition lowers cost via formwork reuse and trade learning curves and enables component re-use (the DfMA/prefabrication argument, where room/cell "pods" are the ultimate kit of parts). Standardisation of bathroom pods and facade cassettes is documented in industrialised-construction literature.
- Source: DfMA and industrialised-construction literature (see Sources) — T2/T3; Ching & Roundtree, *Building Construction Illustrated*, 6th ed. (standard components) — T3; learning-curve percentages: **UNCITED — heuristic**, do not quantify.
- Class: DESIGN PRINCIPLE
- Scope: universal; strongest in hotel, apartment, hospital ward, student housing, parking
- Confidence: High
- Grid translation: `parts = distinct (room footprint shape, fixture layout, bay width) triples`; report `distinctPartCount` and `maxPartReuse = tiles in biggest part family / total tiles`. Enforce `distinctPartCount ≤ 6` per building for repeated-cell types, and `every repeated part is translated, not resized` (rotation of the tile footprint is legal; scaling is not, because scaling breaks formwork and pod reuse).
- Exceptions / failure mode: One-off civic/cultural buildings legitimately have many parts — then the *cost* consequence must be recorded, not hidden. Failure symptom: 40 bathroom variants across 20 floors, all "plausible".

### CN-22 Price non-standard geometry in setting-out, not in aesthetics
- Rule: Every non-orthogonal line, every curved facade and every unique angle must be justified by daylight, view, site, or program; if it is not, straighten it, because its real cost is setting-out complexity, wasted perimeter, and unique junctions.
- Evidence: Setting out a building is done from grid lines with orthogonal offsets; angled/curved geometry increases accuracy demands, formwork fabrication and junction detailing, and perimeter-to-area ratio drives envelope cost and heat loss. Envelope-cost literature consistently penalises high surface-to-volume forms.
- Source: Ching & Roundtree, *Building Construction Illustrated*, 6th ed. (setting out / dimensioning) — T3; Passivhaus and building-envelope literature on A/V ratio as a cost and energy driver (see Sources) — T1/T3; cost-per-angle figures: **UNCITED — heuristic**.
- Class: HEURISTIC (economic reasoning; the band is unsourced — see Weak or contested)
- Scope: universal
- Confidence: Medium
- Grid translation: On a square tile grid a "curve" is a staircase of tiles, so measure it directly: `perimeterTiles/areaTiles (compactness)` — for a rectangular 40×30-tile plate this is 140/1200 = 0.117 tiles⁻¹; a stepped/irregular outline of the same area always scores higher, and the agent can compute the delta. Also count `nonGridAngleWalls` = blocked-tile runs not lying on the declared axes.
- Exceptions / failure mode: Site boundaries and views force diagonals; the right answer is to absorb them at the perimeter (infill panels) rather than in the frame. Failure symptom: an agent rotating a floor plate 12° "for interest", generating 100 % unique rooms and unplaceable tile walls.

### CN-23 Sequence the plan so formwork and crews repeat floor after floor
- Rule: Build in a repeating cycle: the fastest-repeating element (typical floor) defines the cycle; keep the bay geometry, core and shaft positions identical through the repeat, put all one-off complexity (transfer, lobby, plant, top floor) at the ends of the cycle, and give the structure enough floors to amortise the first-floor learning cost.
- Evidence: Repetitive floor cycles and slip-form/core-jumpform practice depend on geometric constancy; changes mid-cycle stop the flow and add formwork fabrication. Construction-management literature treats repetition as the dominant cost lever in structural frames, and modular coordination as its enabler.
- Source: Construction-management / cycle-time literature (see Sources) — T2/T3; ISO modular coordination principles — T1; Ching & Roundtree, *Building Construction Illustrated*, 6th ed. — T3; specific cycle-day figures: **UNCITED — heuristic**.
- Class: DESIGN PRINCIPLE
- Scope: mid/high-rise framed construction; also applies to hotel fit-out cycles
- Confidence: Medium-High
- Grid translation: Compute `constancy = identical floors / total floors` from the cross-floor diff used in CN-03/CN-11 (column lines + shafts + core). Enforce `constancy ≥ 0.6` for any building > 6 floors, and `all differing floors are floor 0, 1, or the top two`. This is the *buildability score* the agent can actually compute without a section.
- Exceptions / failure mode: Tiered/stepped massing and mixed-type towers (office floors over hotel floors) break the cycle by intent. Failure symptom: a 14-floor plan with 11 unique floor plates — each individually fine, collectively unbuildable.

### CN-24 Distinguish load-bearing walls from partitions and never convert one to the other silently
- Rule: Mark each wall line as bearing or non-bearing at design time; only bearing lines may carry slab edges and only non-bearing lines may be freely moved, opened or removed later; any change to a bearing line is a structural change, not a space-planning change.
- Evidence: Load-bearing (wall-bearing) construction transfers floor loads through walls, so their position, thickness and continuity are structural; partitions carry only their own weight and can be relocated — the fundamental distinction taught in every construction text and the basis of open-plan flexibility. Frame construction allows all internal walls to be non-bearing, which is the structural reason for the modern open plan.
- Source: Ching & Roundtree, *Building Construction Illustrated*, 6th ed., walls/partitions and structural chapters — T3; *Building Construction Handbook* (Ching & Issa/Owen, Wiley) — T3.
- Class: FACT
- Scope: universal
- Confidence: High
- Grid translation: Tag blocked-tile runs `bearing` / `partition`. Enforce: `bearing runs lie on grid axes (CN-01)`, `bearing runs are vertically continuous (CN-03)`, and `bearing runs are never interrupted by a door tile wider than 2 tiles without a lintel flag`. Because tile states cannot encode this, a plan without the tags is *not verifiable* — so require the tags as an output of the design step.
- Exceptions / failure mode: A frame makes almost every internal wall a partition — but the facade and core remain load-bearing laterally (CN-08). Failure symptom: an agent "opens up" a wall between two rooms to make a suite and unknowingly removes a bearing line.

### CN-25 Stop pretending a 0.5 m tile wall is a real wall
- Rule: State the real assembly thickness behind every tile wall and treat the tile wall as a *zone* rather than a leaf: real partitions are ~0.10–0.20 m and real bearing walls ~0.15–0.35 m, so a one-tile wall (0.5 m) overstates structure and a plan must not be optimised to avoid a thickness that does not exist.
- Evidence: Standard internal partitions (metal-stud plasterboard, masonry leaf) are in the ~0.10–0.20 m range, and internal bearing masonry/concrete walls commonly ~0.15–0.25 m, with external cavity/sandwich walls thicker still; the 0.5 m host wall is a modelling artefact of `1 tile = 0.5 m`.
- Source: Ching & Roundtree, *Building Construction Illustrated*, 6th ed., partition/wall assemblies — T3; *Building Construction Handbook*, 12th ed. (approx.), Wiley — T3; precise catalogue figures vary by manufacturer: verify — **REQUIRES ENGINEERING VERIFICATION** for any numeric used in a report.
- Class: FACT
- Scope: this host grid specifically
- Confidence: High
- Grid translation: Two consequences the agent must apply: (a) the "wall tax" (one blocked tile = 0.5 m all round) *over-penalises* many small rooms relative to reality, so use it for tile bookkeeping, not for justifying real-world area efficiency; (b) where real thickness matters (acoustic build-up, rated assemblies, fire-resistance), express it as a *tag* or as a 2-tile (1.0 m) double wall, and say so in the rationale, because 1.0 m is also overstated but is the only visible proxy for "double assembly".
- Exceptions / failure mode: Massive concrete cores and thick party walls do reach 0.30–0.50 m, so a single tile is occasionally honest. Failure symptom: reporting the tile plan's 78 % net-to-gross as a construction claim.

### CN-26 Build party walls as acoustic assemblies, not as lines
- Rule: Between acoustically separate tenancies (hotel rooms, flats, ward bays, offices let to different occupants) the shared wall must be a doubled assembly with a stated sound-insulation strategy — separate studs/leaves, flanking control, no back-to-back sockets, no continuous penetrations.
- Evidence: Airborne sound insulation between dwellings/rooms relies on mass, decoupled leaves and airtightness; party-wall provisions in building regulations set minimum performance, and back-to-back services are the classic flanking path.
- Source: Approved Document E (UK, sound separation between dwellings) and ISO 717-1 rating practice; acoustic design guides (Institute of Acoustics / HOH) (see Sources) — **named, none read**; typical DnT,w target values: verify against the edition — **REQUIRES ENGINEERING VERIFICATION**, not quoted here; value NOT ESTABLISHED — retrieve AD E (Part E, Approved Document) and ISO 717-1 before using any target.
- Class: DESIGN PRINCIPLE (project convention — the 2-tile party, the `party` tag, "no shared valve tile", "no back-to-back sockets" are this file's modelling proxies; the *performance* requirement they stand for is code, and that dependency is what makes it non-optional in a real scheme)
- Scope: residential, hotel, healthcare, education, multi-tenant office
- Confidence: High (that party-wall performance is a regulated requirement), Low (numeric band unverified — no DnT,w target quoted, and the geometry is convention)
- Grid translation: Party wall = 2 adjacent blocked tiles (1.0 m) between two acoustically separated rooms, tagged `party`; enforce `no door tile ∈ party`, `no shared valve/box tile on a party wall`, and `no two fixtures from adjacent rooms on the same stack-side of a party wall` (a proxy for back-to-back services). Report the tile cost: a 1.0 m party over 2 m of wall is 2 m² = **8 tiles from both demises (≈4 per demise)** — an earlier revision said "~4 tiles from both demises", which halved the figure.
- Exceptions / failure mode: Corridor-side hotel party strategy differs (door + cavity); concrete single-leaf walls achieve ratings without decoupling. Failure symptom: an agent minimising tile count by giving every room a shared 1-tile wall.

### CN-27 Treat fire-rated separation and egress as plan geometry
- Rule: Compartment boundaries, protected corridors, exit locations and travel distances are *plan* constraints and must be satisfied by tile geometry, not asserted in prose: compartments must be closed tile rings, exits distributed, travel distance measured on the walkable graph.
- Evidence: Egress provisions (travel distance, corridor discharge, door direction, compartment area limits, sprinkler relaxation) are inherently geometric, which is why they survive translation to a tile grid: the shortest walkable path to a safe exit is exactly an A* query on the host's own graph.
- Source: ICC *International Building Code* means-of-egress and fire-resistance chapters; NFPA 101 *Life Safety Code*; Approved Document B compartmentation (see Sources) — T1; the applicable thresholds are occupancy- and height-dependent and are the property of the building-codes research file, so **no number is quoted here**.
- Class: CODE REQUIREMENT
- Scope: universal
- Confidence: High
- Grid translation: `travelDistance = octile cost on walkable+door tiles from the farthest room tile to the nearest building-exit door tile`, using the host's own A* (1-tile corridor forces dx+dz, so a protected dead-end reads longer than an open hall — a genuine and useful proxy); `compartment = maximal walkable region bounded by rated blocked ring; door tiles in the ring must be rated_door`. Validate closure by flood-fill: an unclosed ring means the compartment leaks.
- Exceptions / failure mode: Atrium/void floors and shared circulation break 2-D compartment logic (there is no section here to model smoke). Failure symptom: a plan with correct-looking corridors whose compartments have a missing corner tile — 4-connectivity makes that a real hole.

### CN-28 Coordinate the facade with the frame before the plan is frozen
- Rule: Decide where the facade sits relative to the perimeter column/wall line and repeat that relationship on every floor: perimeter columns inside the line, slab edges and cantilevers declared, and a consistent floor-to-floor datum so that the facade module, the bay module and the room depth are the same three numbers.
- Evidence: Facade cost and buildability follow from the column-to-facade relationship: perimeter columns create thermal bridges, obstruct views and complicate the cassette zone, while set-back columns need larger spans or transfer; envelope texts and facade-engineering literature consistently treat the column line and slab edge as the primary coordination items.
- Source: Ching & Roundtree, *Building Construction Illustrated*, 6th ed., curtain-wall/facade chapters — T3, **not value-read**; facade-engineering and envelope literature (CTBUH, envelope design guides) (see Sources) — **named, not read**; cantilever slab-edge limits: **REQUIRES ENGINEERING VERIFICATION**.
- Class: HEURISTIC (the depth/span ratio inherits the table's unverified span bands, so it is a working rule of thumb, not a sourced constraint)
- Scope: multi-storey enclosed buildings
- Confidence: Low-Medium (numeric band unverified — `≤ 2 × span` is as good as the band it multiplies, and every band is heuristic), Medium (the coordination direction)
- Grid translation: `perimeter = outermost blocked ring`; enforce `every perimeter column tile sits either inside the ring (offset ≥ 1 tile from the outer face) or coincident with it, never outside`, `facade line identical on all floors (diff test from CN-23 constancy)`, and `room depth from facade to core ≤ 2 × the floor-system span band` (**heuristic, inherits the unverified band**) as a daylighting proxy: a 24-tile (12 m) deep plan needs artificial lighting in its middle.
- Exceptions / failure mode: Exposed concrete frames, brise-soleil and double skins deliberately put structure in the facade zone. Failure symptom: a plan with a column 1 tile outside the wall on three floors and 1 tile inside on the others.

## Span & grid reference table

Ranges are *economical/plausible working bands*, read as "system works here", not design values.
**No published span table was opened while writing this file**: the metre figures are engineering-
plausible heuristics, and the source named in each row is where the value must still be verified, not
evidence that it was. `tiles = m × 2` (these conversions *are* verified arithmetic). Anything not backed
by a retrieved source is marked **UNCITED — heuristic** and must not be quoted in a design rationale
without verification. `REQUIRES ENGINEERING VERIFICATION` = the band depends on loading, fire, deflection
and code regime.

| System | Working span range (m) — heuristic, not retrieved | Tiles (clear) | Grid translation notes | Source |
| --- | --- | --- | --- | --- |
| Load-bearing masonry | ~3.0–6.0 (short-span floors/roofs) | 6–12 | every wall tile line must be bearing + vertically continuous; no open plan | The Masonry Society, TMS 402 *Building Code Requirements for Masonry Structures* https://www.masonrysociety.org/ and Ching & Roundtree 6th ed. (bearing-wall logic) — T1/T3. **Numeric band = UNCITED — heuristic; span/depth limits in TMS 402/Eurocode 6 were not read in this pass.** |
| CLT floor/roof panel, one-way simple support | ~2.0–5.0 (tabulated by span tables) | 4–10 | panel spans between two bearing lines only; aspect ≥ 2:1 typical for one-way use | AWC/Think Wood *CLT Handbook: cross-laminated timber (US Edition)*, floor span tables https://www.smartlam.com/wp-content/uploads/2020/10/CLT_USA-Complete-document-Think_Wood.pdf — T1/T3; WoodWorks, *Structural Analysis and Design of CLT* (Breneman, 2023 slides) https://www.woodworks.org/wp-content/uploads/presentation_slides_Breneman_Structural_Analysis_Design_CLT_12.2023.pdf — T3; Swedish Wood *CLT Handbook* https://www.swedishwood.com/siteassets/5-publikationer/pdfer/clt-handbook-2019-eng-m-svensk-standard-2019.pdf — T3. **Band = UNCITED — heuristic: the three documents above were located as the correct authorities but their tables were not read in this pass — do not quote a metre figure until the table row is read.** |
| CLT with ribs / CLT+glulam composite, two-way | ~5.0–8.0 | 10–16 | needs column lines both ways (CN-06) | Same CLT Handbook set as the row above (ribbed/composite design chapters) — T3; **UNCITED — heuristic** |
| RC one-way ribbed / beam-and-slab | ~4.5–8.0 | 9–16 | beams = blocked-tile lines at ≤ rib spacing; slab spans the short way | The Concrete Centre, *Slabs and Flat Slabs* (lecture PDF) https://www.concretecentre.com/TCC/media/TCCMediaLibrary/PDF%20attachments/Lecture-5-Slabs-and-Flat-Slabs-PHG-N-Rev16-19Oct-17-Print.pdf — T1/T3 (span/depth ratios, not an economical-span band); **band UNCITED — heuristic** |
| RC flat slab (solid) | ~6.0–9.0 | 12–18 | no beam lines in plan at all; column tiles on a closed grid, ≤ 3 distinct spacings | The Concrete Centre, *Slabs and Flat Slabs* (URL above) — T1/T3: gives flat-slab design assumptions and span/depth limits, **not** an economical band; the 6–9 m figure stays **UNCITED — heuristic** |
| RC flat slab, waffle/hollowed | ~8.0–12.0 | 16–24 | plan shows a grid of voids — invisible here, so flag `two-way flat slab` and require ≤ 1.5 aspect | The Concrete Centre (URL above) + *How to Design Concrete Structures using Eurocode 2* https://icci.vn/storage/documents/November2023/How%20to%20design%20concrete%20structures%20using%20Eurocode%202.pdf — T1/T3; **band UNCITED — heuristic** |
| Post-tensioned slab | ~8.0–12.0 (occasionally beyond) | 16–24+ | lets one fewer column line exist; check CN-07 gains in room area | Post-Tensioning Institute https://www.post-tensioning.org/ — T1; peer-reviewed comparison of PT vs solid/hollow-block/flat slabs across span lengths: *IJAME* (Poland) 2023, https://www.ijame-poland.com/pdf-168936-91806?filename=91806.pdf — T2; ICCAUA 2021 *Cost Evaluation of Post-tensioned Slabs in Multi-storey Buildings* https://iccaua.com/PDFs/2021Conference%20full%20bool%20proceedings/6_Civil%20Engineering/ICCAUA2021280_OSAMA_KHALID.pdf — T2/T3. **Band = UNCITED — heuristic. These papers are the least-bad pointers in the table (located, correct subject) but no span figure was read from them, so "best-evidenced row" was withdrawn as a tier claim.** |
| Steel frame + metal deck, one-way | deck ~2.5–4.0, beams ~6.0–9.0 | deck 5–8, beams 12–18 | beam lines = blocked tile lines; deck span = perpendicular ≤ 8 tiles | Steel Construction Institute (SCI) composite design guides — **organisation named, no document and no URL retrieved; band UNCITED — heuristic, Low confidence** |
| Composite steel + concrete deck, long span | ~9.0–15.0 (typical) | 18–30 | a 24-tile clear plan is *plausibly* inside this working band without a transfer (heuristic, not a sourced claim) | SCI; Ching & Roundtree 6th ed. long-span section — **neither read; band UNCITED — heuristic, Low confidence** |
| Steel/trussed long span ( halls, retail, airports) | 15.0–45.0+ | 30–90+ | trusses need depth = invisible here; require `REQUIRES ENGINEERING VERIFICATION` escalation | Ching & Roundtree 6th ed., long-span structures — T3, **not read; band UNCITED — heuristic** |
| Structural parking frame (RC) | ~7.5–8.5 typical top bay | 15–17 | bay width must clear facade columns; see CN-07/CN-28 | parking design guides / industry practice — **UNCITED — heuristic** |
| Timber stud floor joists (low-rise) | ~2.5–5.0 | 5–10 | joist lines are service-punchable; blocking limits riser positions | Wood Frame Construction Manual / manufacturer span tables — T3, **not read; band UNCITED — heuristic** |

Floor-to-floor height, slab thickness, beam depth, deflection and fire-resistance data are **not
representable on this grid**; whenever the table's band is approached, output an explicit
`needs-section-review` flag rather than resolving it.

## Sources

T1 — official standards bodies and public interest design resources:
- Whole Building Design Guide (WBDG/NIBS), *Design Disciplines* and service/plant content — https://www.wbdg.org/
- American Wood Council, *CLT Handbook: US Edition* (span tables, connections) — https://www.awc.org/
- The Concrete Centre, UK concrete design guidance (slab systems, span/depth) — https://www.concretecentre.com/
- Steel Construction Services / SCI, composite action and long-span guidance — https://www.steelconstruction.info/
- Post-Tensioning Institute — https://www.post-tensioning.org/
- Masonry: The Masonry Society (TMS 402) — https://www.masonrysociety.org/ ; Eurocode 6 / CEN
- ICC *International Building Code* (egress, shaft enclosures, fire-resistance) — https://www.iccsafe.org/ ; NFPA 101 *Life Safety Code* — https://www.nfpa.org/
- CEN, BS EN 12056-2 (gravity drainage design) — https://standards.cen.eu/ ; BSI/Approved Document E (sound insulation) — https://www.gov.uk/government/building-regulations
- CIBSE Guides A, G, S — https://www.cibse.org/ ; ASHRAE *Handbook: HVAC Applications* — https://www.ashrae.org/
- BSRIA knowledge hub / application guides (shafts, service coordination, ceiling zones) — https://www.bsria.com/
- MHCLG / IHBC and UK fire stop and compartmentation guidance; UL Fire Resistance Directory — https://www.ul.com/
- ISO modular coordination series (building module) — https://www.iso.org/
- CTBUH (tall-building structural/transfer and lateral-system material) — https://www.ctbuh.org/

T2 — peer-reviewed / academic:
- DfMA and industrialised-construction literature (building design management journals; construction-management repetition/learning-curve papers) — see Sources note below; **specific articles to be pinned during verification.**

T3 — established construction/engineering publications:
- Francis D. K. Ching & Mark M. Roundtree, *Building Construction Illustrated*, 6th ed., Wiley (2023) — primary construction reference for this file.
- Frank Ching (with various co-authors), *Building Construction Handbook*, Wiley — 12th ed. approximate; verify edition.
- Edward Allen & Joseph Iano, *Fundamentals of Building Construction: Materials and Methods*, 7th ed., Wiley.
- Ernst Neufert / Pete Silver, *Neufert Architects' Data*, 4th ed., Wiley/Birkhäuser.
- *Time-Saver Standards for Building Types* and *Architectural Graphic Standards*, Wiley.
- Schumacher & Lange, *Structural Details for Architecture and Design*, Birkhäuser.
- Ching, *Architecture: Form, Space, and Order*, 5th ed., Wiley (load path framing only).
- Park & Paulay, *Reinforced Concrete Design*, Wiley (shear-wall/continuity behaviour).

T4 — professional/practitioner commentary and forums:
- BSRIA/CIBSE practice articles, engineering firm technical blogs (structural and facade), architect-led buildability articles — used only for qualitative corroboration, never for numbers.

T5 — anecdote: deliberately unused.

**Retrieval state of this pass (honest log).** Located and URL-verified but *not* value-read: The
Concrete Centre *Slabs and Flat Slabs* lecture PDF; *How to Design Concrete Structures using Eurocode 2*;
AWC/Think Wood *CLT Handbook (US Edition)*; WoodWorks CLT design slides; Swedish Wood *CLT Handbook*;
IPC Chapter 7 via the ICC page (HTTP 403 to retrieval); IJAME 2023 PT-vs-solid-slab span/economy
comparison; ICCAUA 2021 PT cost paper; PHCPPros cleanout article. **Now read (audit pass, from an
adoption mirror not ICC): IPC 2021 §704.1 slope values and §708 cleanouts, incl. the ~100 ft spacing
ceiling — the earlier "§704/§707 stand, values do not" line is superseded; §707 was the wrong section.**
Not retrieved at all in this pass (named as the authority to go to, not as evidence read): IBC/ICC
chapter text (incl. the corrected shaft-enclosure address), BS EN 12056, CIBSE Guides A/G/S, BSRIA
application guides, NFPA 70/101, TMS 402, SCI composite tables, ADA 2010 / ANSI A117.1 clause text,
Approved Document E, DfMA journal articles, CTBUH transfer case studies.

UNCITED — heuristic ledger (items in this file without a retrieved numeric source): **every span band in
the reference table** — masonry 3–6 m, CLT one-way 2–5 m and ribbed/composite 5–8 m, RC ribbed/beam-and-
slab 4.5–8 m, flat slab 6–9 m, waffle 8–12 m, post-tensioned 8–12 m, steel + deck 2.5–4 / beams 6–9 m,
composite long span 9–15 m, trussed 15–45 m, parking 7.5–8.5 m, timber joists 2.5–5 m; the flat-slab
6–9 m "commonly quoted" wording; the accessibility proxies (915 / 1067 mm clear widths, 1500 mm turning
circle — the *tile* conversion 1500 mm = 3×3 tiles is verified arithmetic, the millimetre values are not
retrieved); the shaft minimum sizes (4×4 / 3×3 tiles); the drain-run placeholders (20 / 40 tiles); the
valve-within-20-tiles rule; the 4-tile removal-path and 6-tile service-band widths; the ISO "3 m minimum"
(withdrawn: that was the 3M = 300 mm module, see CN-01); all learning-curve and cost-delta implications;
the `aspect ≤ 1.5` two-way limit; the `≤ 3 distinct bay widths`, `distinctPartCount ≤ 6` and
`constancy ≥ 0.6` thresholds. These are *planning heuristics for the tile grid*, not construction claims.

## Weak or contested

1. **Span bands are contested by loading.** Every band shifts with imposed load, fire duration,
   deflection class and whether the slab is laterally restrained. The 6–9 m flat-slab figure is a
   practitioner commonplace rather than a code value; two authorities disagree at the top of the range,
   and long-span flat slabs with drop columns are documented beyond it. Resolution used here: treat the
   band as a *plan-review* trigger, never as a capacity check.
2. **Post-tensioning "longer spans" claims are marketing-adjacent.** PTI-type material and contractor
   literature present spans materially above RC equivalents; independent peer-reviewed comparisons are
   scarcer. Kept as a wider band with `verify`.
3. **CLT spans are the weakest numbers in the table.** Published tabulated spans depend on species grade,
   lay-up, number of layers, support condition and vibration criteria, and short-span CLT floor tables
   are much more restrictive than promotional "timber high-rise" writing implies. Vibration serviceability
   often governs before strength — and vibration cannot be checked on a tile grid at all.
4. **"No soil pipe over a habitable space" is folklore, not a universal code clause.** Many codes allow it
   with protections; the real driver is risk/cost/noise. CN-18 is therefore classed DESIGN PRINCIPLE,
   not CODE REQUIREMENT.
5. **Gravity-drain slope limits are code-family-specific** (EN 12056 vs IPC/UPC vs national annexes), and
   the mm-per-metre figures differ; the *plan consequence* (short, straight, stacked) is the robust part.
6. **Shaft sizing has no single authority.** CIBSE, BSRIA, ASHRAE and national plumbing codes give differing
   clearance philosophies; the 4×4-tile minimum here is an invented order-of-magnitude, not a citation.
7. **Transfer-structure cost is asserted qualitatively.** Practitioner consensus that transfers are expensive
   and deep is strong; quantified published premiums are project-specific and non-transferable.
8. **Core count/position guidance is empirical.** "One core per plate area" rules of thumb circulate in
   developer/practice briefs; they are planning heuristics, not engineering, and they conflict for
   floorplates above roughly 1500–2000 m² (evidence: corridor-length/daylight logic from Research file 01).
9. **The tile grid cannot express the section, so all of CN-14/CN-15's height-based clearances and CN-17's
   slopes are proxies** whose failure mode is over-confidence: a plan passing every check here is
   *buildable-looking*, not buildable.
10. **Acoustic and fire ratings expressed as plan geometry** (2-tile party walls, `rated` tags) are a
    modelling convention of this project, not a standard; another practice would use single-leaf mass.
11. **Formwork-reuse economics are directional.** Repetition is cheaper in every source, but the magnitude
    and the crossover point (where a unique floor stops costing extra) are not published consistently;
    CN-21/CN-23 thresholds are chosen, not derived.
12. **The "3 m minimum rational dimension" appeal is withdrawn.** ISO 2848's coordinating module is *3M* =
    3 × 100 mm = **300 mm**; nothing retrieved supports a 3 m minimum for buildings, so the earlier sentence
    was a unit/label slip. The 6-tile (3.0 m) axis floor in CN-01 is now stated as this project's chosen
    working floor — "don't go below this without a reason" — not a standards recommendation. value NOT
    ESTABLISHED — retrieve ISO 2848 clause text before reinstating any standards-based minimum.
13. **Demoted span-band families (all heuristic after the audit; zero claims reached SUPPORTED).** Flat slab
    (solid 6–9 m and waffle/hollowed 8–12 m), RC one-way ribbed / beam-and-slab 4.5–8 m, post-tensioned
    8–12 m, steel + metal deck (deck 2.5–4 m / beams 6–9 m), composite long span 9–15 m, steel/trussed
    15–45 m, CLT one-way panel 2–5 m and ribbed/composite 5–8 m, load-bearing masonry 3–6 m, structural
    parking 7.5–8.5 m, timber joists 2.5–5 m. Each band is kept as a *plan-review working value*; none was
    read from a table this pass, so CN-05 is classed HEURISTIC and CN-04/CN-28 flag rather than reject on a
    band exceedance. The m→tile conversions in the table are verified and unaffected.
14. **Other labels corrected the same way.** CN-07's accessibility proxies (clear widths, turning circle)
    are working values pending ADA 2010 §304.2/§404.2 — the 6×6-tile turning square was a conversion error,
    now 3×3. CN-15's removal-path widths and its diagonal-as-object-swing analogy are a heuristic plan
    proxy, **not** a swept-path/turning-envelope check. CN-26's party-wall geometry (2 tiles, no shared
    valve tile, no back-to-back sockets) is project convention standing in for a code performance
    requirement. CN-13's shaft-enclosure clause address was wrong ("E1018"); Chapter 7 fire-resistance is
    correct, the Chapter 10 shaft section still needs edition confirmation. **Unresolved cross-file
    conflict:** CN-12's 3×3/4×4-tile shaft minimums declare unbuildable the 1×2-tile shafts used in
    grid-translation GT-14, and that file's 1-tile service bands; the two files must be harmonised before
    either number is implemented.

## Type-specificity audit

The rules above are claimed *universal*, but several are load-bearing only for particular types. Flagged
per rule, with the type where the rule actually bites and where it is inert or wrong:

- CN-01/CN-02/CN-03 (grid discipline, regularity, straight column lines): real driver for hotel, apartment,
  office floorplates and structured parking; **inert for single-storey and for load-bearing masonry low-rise**,
  where the "grid" is the wall schedule, and misleading for sculptural civic work.
- CN-04/CN-05/CN-06 (system selection, span bands, two-way closure): most constraining for offices and
  retail (long spans, deep plans); for **residential/hotel the span is set by the room, not the frame**, so
  these rules constrain the *choice* of system rather than the plan; for timber low-rise the two-way test
  is largely irrelevant (joists are one-way by construction).
- CN-07 (column placement): severe in **hotel/parking/retail** and in any room-type where the tile cost of a
  stray column is a lost bed-space or bay; soft in open-plan office.
- CN-08/CN-09 (cores, no punching): essentially a **mid/high-rise (>4–6 storeys) rule**. Below that, a braced
  frame or bearing walls make both inert, and an agent applying them to a 2-storey villa will generate a
  pointless core.
- CN-10 (transfer): concentrated at **podium-tower, plant-over-retail, retrofit** schemes; for a uniform tower
  it is a no-op, so it should not consume design effort there.
- CN-11/CN-12/CN-13/CN-20 (shafts, sizing, rating, cleanouts): dominant in **healthcare, hotel, multi-tenant
  office, residential towers**; for a single-cell or small commercial building one small void suffices and
  the clustering rules over-constrain.
- CN-14/CN-15 (plant, removal paths): the binding constraint for **hotels with central laundry/kitchen, hospitals,
  and any building with a central chiller plant**; a heat-pump-per-unit building has distributed tiny plant and
  the rules relax to "keep the outdoor unit off a neighbour's window".
- CN-16/CN-17/CN-18/CN-19 (isolation/metering, gravity drains, wet stacking, corridor service zone): the single
  biggest plan-shaper for **repeated-cell types (hotel, student housing, apartment, ward)**. Weakest for
  **offices and retail**, where sanitary is core-located anyway and underfloor distribution removes CN-19.
  For **vacuum-drained or waterless (composting) schemes** CN-17/CN-18 mostly fall away — a genuine
  alternative worth modelling rather than a violation.
- CN-21/CN-22/CN-23 (kit of parts, geometry pricing, cycle constancy): strongest in hotel/apartment/parking;
  **anti-correlated with gallery/museum, school-of-art and bespoke civic programmes**, where the constancy
  metric should be switched off and the cost acknowledged (CN-22).
- CN-24/CN-25/CN-26/CN-27 (bearing vs partition, real thickness, party walls, egress geometry): CN-24/CN-25
  matter most for **masonry/timber bearing types** (the wall *is* the frame) and least for steel/RC frames;
  CN-26 is **acoustically critical for hotel, apartment, healthcare wards, education**, near-irrelevant for
  parking and warehouse; CN-27 scales with **occupant load and height** — it is the binding rule for
  assembly, residential towers and hospitals, and almost vacuous for low-density single-exit buildings.
- CN-28 (facade/frame coordination): binds where there *is* a continuous facade — **all conditioned multi-storey
  types**; inert for warehouses, parking decks and open structures, and reinterpreted for double-skin or
  brise-soleil envelopes.

Cross-cutting caveat: this file's rules were written against the *hotel/multi-storey-building* case that the
host grid models. Anything single-storey, external, industrial, or transient (markets, grandstands,
site huts, bridges) sits outside the rule set, and CN-08, CN-17, CN-19 and CN-23 in particular should be
disabled rather than bent for those types.
