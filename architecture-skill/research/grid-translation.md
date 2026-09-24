# Research file — Domain V: grid / tile translation (real dimensions → host grid)

Scope: how a physical architectural design is converted into this project's discrete geometry
without lying about it. The host grid is `1 tile = 0.5 m`, one 2D grid per floor, tile states
`walkable | blocked | door` only, walls are one blocked tile, rooms are 4-connected flood-fill
that excludes door cells, movement is octile A*, vertical links are portal objects not tiles,
and metres are a project convention the engine never stores. Everything here is about the
**semantic** side of that conversion: which real dimension survives, which is destroyed, where
the leftover goes, and what must be reported as inexpressible. Historical/stylistic material is
out of scope; codes and egress numbers live in `building-codes.md`, programme/adjacency in
`architecture-theory.md`.

Derived constants used throughout: 1 tile = 500 mm linear; 1 tile² = 0.25 m²; 4 tiles = 1 m²;
2 tiles = 1.0 m; 3 tiles = 1.5 m; 6 tiles = 3.0 m; 12 tiles = 6.0 m. A tile is a **500 mm
tolerance zone**, not a 500 mm object — this single reframing drives most rules below.

## Rules

### GT-01 Treat the tile grid as a dimensional coordination grid, never as a drawing canvas
- Rule: Declare at project start, in the deliverable itself, that the grid is a load-bearing dimensional system with a stated real-world scale (`1 tile = 500 mm`), that every tile edge is a coordination line, and that no dimension may be placed off a tile boundary. The design is then written *in* the grid, not scaled *onto* it.
- Evidence: Modular coordination exists precisely to stop drawings from being freely dimensioned. **Paraphrase of the standard's principle — not ISO text:** construction elements and components have their dimensions coordinated to a common module so that they fit together without cutting on site, the chosen coordinating module serving the major dimensions and smaller modules the minor ones. ISO 2848:1984's *title and subject* ("Building construction — Modular coordination — Principles and rules", built on the 3M system with a 100 mm basic module) are confirmed on the catalogue record read by this project; **no clause text of ISO 2848 has ever been read here, so nothing in this file is a quotation from it.** An earlier draft printed the paraphrase above inside quotation marks as if it were the standard's own wording — that presentation is withdrawn.
- Source: S1 ISO 2848:1984 — T1 (title/subject only; clause body unread, and its current-vs-withdrawn status was not established this pass).
- Class: DESIGN PRINCIPLE
- Scope: universal (all building types, all floors)
- Confidence: High (that modular coordination is a real, title-verified standard whose subject is this principle) / **Low as to any specific wording or clause** (no clause text read) — was `STANDARD`; demoted: the cited ISO 848 clause body was unread and its current-vs-withdrawn status was not established this pass, and no standard says a grid must not be treated as a drawing canvas; that prohibition is this project's discipline, of which dimensional coordination is the named family.
- Grid translation: Write the scale in the plan header: `grid: 1 tile = 0.5 m; datum at tile (0,0)`. Every design intent then carries both forms, e.g. `corridor clear width = 2400 mm = 4.8 tiles → 5 tiles`. If a number cannot be stated in tiles, the design is not yet translatable.
- Exceptions / failure mode: Failure symptom is "pixel art thinking" — shapes chosen because they look right at zoom level, then a metre dimension is asserted afterwards and contradicts the tile count.

### GT-02 Fix one origin (datum) per project and share it across all floors
- Rule: All floors, all grids, all modules are measured from one common tile origin; never re-origin a floor to make its own layout convenient.
- Evidence: Coordination systems require reference lines from which dimensions are taken rather than accumulated part by part; in this project the practical proof is that vertical links are portal objects joined between floors, so a lift or riser whose floor-A footprint is at tiles (30,12) and floor-B at (31,12) is a broken stack. Also `src/engine/npc/rooms.ts` derives rooms per floor independently — nothing in the engine can detect a mis-stack; only the shared origin plus the designer can.
- Source: S1 (T1); host code `src/engine/npc/rooms.ts:2,15,33` — T5/FACT.
- Class: ENGINEERING CONSTRAINT
- Scope: multi-floor designs; single-floor → still required for column-to-partition alignment
- Confidence: High
- Grid translation: Core at tiles x∈[30..33], z∈[10..14] on every floor. If floor 4 needs a wider core, it grows *outward* from the same datum: x∈[30..35] — never x∈[29..34]. Rounding up is applied from the datum, so a growing module keeps its near edge fixed.
- Exceptions / failure mode: Podium/tower transitions and site-boundary-driven shifts are legitimate re-datums, but must be declared as an explicit offset (`floor 0 datum shifted +3 tiles east`), never silently absorbed.

### GT-03 Record the module-family mismatch: 0.5 m is NOT a member of the 3M coordination series
- Rule: State that the host tile (500 mm) is not a multiple of the real basic-module family based on 300 mm, that the smallest dimension exactly expressible in both systems is their LCM 1500 mm = 3 tiles, and that all work therefore happens *off* the standard module unless it lands on 1.5 m multiples.
- Evidence: The coordination family behind this argument is built on a 100 mm basic module with 300 mm as the coordinating module (3M). Per the source read this pass, ISO 2848 is based on multiples of 300 mm and 600 mm, **preference being given to lengths that are multiples of 3, 6, 12, 15, 30 and 60 basic modules** — i.e. 300/600/1200/1500/3000/6000 mm. Tier: **T3** — this is verbatim from the encyclopaedic article on ISO 2848 (see Sources S1w), which agrees with the ISO record the audit opened; the ISO catalogue page returned HTTP 403 and the iteh sample PDF would not parse, so the standard's own preferred-series table was *not* read. Of that series, only 1500/3000/6000 mm are a whole number of 0.5 m tiles. 500/300 = 1.667, so a 600 mm module equals 1.2 tiles and a 300 mm module equals 0.6 tile. **Corrected:** earlier drafts of this line enumerated the series as "60/120/300/600/1200/2400/3000 mm" and a third list appeared under *Weak or contested*; both are replaced. 60 and 120 mm are multiples of neither the 100 mm basic module nor the 300 mm coordinating module, and 2400/3600 mm are legal 3M multiples but are not in the preferred set.
- Source: S1 ISO 2848:1984 — T1 (title/subject); S1b ISO 1006:1983 (the standard that names the basic module) — T1; S1w ISO 2848 summary article — T3 (source of the enumeration above). **S2 (DIN 4150-1 "Modulraster") is withdrawn as unverified and is no longer cited here; S3 is a pointer only and supports no number** — see Sources.
- Class: FACT
- Scope: universal — this is the central limitation of the host grid
- Confidence: High on the arithmetic (LCM(500,300) = 1500 mm = 3 tiles is verifiable without sources, and 1500 mm = 15 basic modules is inside the preferred set, so "smallest dimension exact in both systems" holds). **Medium on the preferred-series enumeration: it is read from a T3 secondary source that matches the ISO record the audit opened; the definitive table inside the standard was not read this pass.**
- Grid translation: Coordination cell = 3 tiles = 1.5 m. Room 3600×7200 mm (a common hotel room plate) = 7.2×14.4 tiles → 8×15 tiles = 4000×7500 mm. Both dimensions are off-module in real terms (4000 mm is not a 3M multiple) and off-tile in grid terms — a double mismatch. The 1500 mm cell version, 3000×7500 mm = 6×15 tiles, is exact in both systems: prefer it.
- Exceptions / failure mode: Industrial/steel-framed and timber buildings coordinate on 300/600 mm and translate cleanly; masonry and drywall systems coordinate on 100/200 mm increments and never do. Failure symptom: a "modular" design that is modular in tiles and non-modular in every purchased component.

### GT-04 Carry a dual-scale table: every dimension stored as intent-in-mm + geometry-in-tiles
- Rule: Never keep only one representation. The record for each designed dimension is `{intent_mm, tiles_exact, tiles_used, error_mm, policy}`, and the tile-only record is considered lossy and insufficient for review.
- Evidence: The engine stores no metres at all — the 0.5 m/tile convention lives only in project documentation, so any metre figure that is not written down alongside the tiles is lost. The conversion is then unrecoverable: 5 tiles is 5 tiles, and only the note says whether it meant 2400 mm rounded up or 2500 mm exact.
- Source: host code survey (metres absent from schema) — T5; S1 (nominal vs. required dimension distinction) — T1.
- Class: CODE REQUIREMENT
- Scope: universal
- Confidence: High
- Grid translation: `{"part":"corr-03","intent_mm":2400,"tiles_exact":4.8,"tiles_used":5,"error_mm":+100,"policy":"ceil-clear"}`. A whole floor is then a list of such rows, machine-checkable and diff-able.
- Exceptions / failure mode: Rapid massing sketches may legitimately be tile-only — then they must not be labelled with millimetre dimensions at all.

### GT-05 Round UP every functional minimum (clear width, clearance, capacity, accessibility)
- Rule: If a dimension is a floor set by a body, a machine, a wheelchair or a code, the tile count is `ceil(mm / 500)`. Never round a minimum down, never round it to nearest.
- Evidence: Minimum dimensions in building regulation are thresholds, not targets: 915 mm clear opening, 1067/1100 mm aisle widths and similar are pass/fail, so any rounding that lands below the threshold is a violation, and on a 500 mm grid the only safe policy is ceil. Egress figures are catalogued in `building-codes.md`.
- Source: S4 WBDG barrier-free design page — T1/T3; project `building-codes.md` — T3 internal.
- Class: CODE REQUIREMENT
- Scope: all clearance/width/capacity dimensions
- Confidence: High
- Grid translation: Required clear opening 915 mm → 1.83 tiles → 2 tiles = 1000 mm (error +85 mm, safe). Required turning circle 1500 mm → 3.0 tiles → 3 tiles (exact). Two beds plus transfer space 2600 mm → 5.2 → 6 tiles = 3000 mm (+400 mm — the price of the grid; see GT-07 for where that 400 mm is *paid*).
- Exceptions / failure mode: Ceil-on-minutes combined with ceil-on-maximums in the same chain can make a space simultaneously too small and too big (a lift car that satisfies the plan minimum but fails the diagonal rigid-object length). Check both the min and the max constraints before fixing the tile count.

### GT-06 Round to NEAREST for non-functional proportions, and only at the coordination cell
- Rule: For dimensions whose only requirement is proportion or appearance (room shape, façade rhythm, bay depth), use `round()` at the 1500 mm coordination cell where possible, so the result is both grid-exact and module-exact; `ceil` is reserved for thresholds.
- Evidence: Aesthetics degrade from gross error, not from 100 mm — the standard proportion vocabulary (double square, 1:1.5 rectangle, √2) is expressed in ratios, not millimetres, and the nearest tile-ratio to a target ratio is the correct answer on a discrete grid.
- Source: S3 — T3; S5 proportion/composition text (Ching, *Architecture: Form, Space, and Order*, 5th ed., Wiley) — T3, cited by edition, URL not retrieved.
- Class: DESIGN PRINCIPLE
- Scope: proportions, façades, non-regulated room shapes
- Confidence: Medium
- Grid translation: Target 5000×3400 mm living room → 10×6.8 tiles. Ceil gives 10×7 = 5000×3500 (fine); nearest gives the same. Target 4100×2900 → 8.2×5.8 tiles → nearest 8×6 = 4000×3000; but 4000 mm is not on the 3M family, so the *cell-aligned* answer is 9×6 = 4500×3000. Choose nearest-within-cell: pick from {…, 3.0, 4.5, 6.0} m where the function allows.
- Exceptions / failure mode: Applying `round` to a threshold produces an illegal building. Applying `ceil` to everything produces a building 5-10 % larger than the programme (see GT-17, GT-25).

### GT-07 Absorb the remainder in a designated tolerance zone — never inside usable room area
- Rule: Every rounding gap must be booked into a named absorber: (a) the wall/structure zone, (b) a service band, (c) a declared tolerance strip along a party line or façade line, (d) the floor plate edge. Usable area is fixed by programme and is the *last* place a remainder may land.
- Evidence: In real coordination, dimensional tolerance is deliberately assigned to specific joints and to the tolerance zone of the construction — the classic device is the expansion/joint or the screed thickness absorbing ±; components are made smaller than the module so the joint takes the difference. **This is stated as engineering practice, not as a quotation: the ISO clause wording is unread, and the DIN/BS identifiers carried in earlier drafts of this rule were withdrawn (see Sources S2 and S6). No clause number or quoted phrase from this rule may be reproduced downstream.**
- Source: S1 ISO 2848:1984 — T1 (title/subject only; body unread). **Withdrawn as evidence and no longer cited: S2 (DIN 4150-1 "Modulraster") — could not be shown to exist; S6 (BS 5606 *Guide to accuracy in building*) — identifier never verified.** The principle is credited to S1's subject matter plus standing practice, not to a read clause.
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: Medium on the principle; **Low on any standards attribution here**. [classification note: demoted from `STANDARD`: the STANDARD tier rested on the withdrawn S2/S6 identifiers and on clause text that was never read.]
- Grid translation: A 15-tile (7.5 m) corridor run composed of 5 modules of 3 tiles fits exactly — remainder 0. Composed of 3 modules intended at 2.5 m each: 5+5+5 = 15 tiles, still exact because 2.5 m = 5 tiles. Intended at 800 mm module 9 times = 7200 mm = 14.4 tiles: the 0.6 tile (300 mm) remainder goes to the *façade tolerance strip*, i.e. the external wall leaf thickens from 1 tile to 1.6 tiles conceptually, and the corridor stays 14.4→15 tiles. Never shrink a room to pay for it.
- Exceptions / failure mode: The absorber must have spare capacity — a glass curtain wall has none (units are ordered to size), so a remainder there shows up as a site field-cut. When all four absorbers are exhausted, the design is off the grid and must be reported (GT-19, GT-26).

### GT-08 A tile is a 500 mm zone: separate structural line, finish line and dimension line
- Rule: Model each wall tile as a zone containing structure + build-up + finish, and never let the reader assume a wall tile means "0.5 m of masonry". Record which tile boundary is the *axis* and which is the *finished face*.
- Evidence: Real internal partitions are typically ~0.075-0.20 m of build-up and external walls ~0.25-0.45 m with cavity/finish; 0.5 m is thicker than any of them, so the tile over-represents structure. Conversely finish (plasterboard + paint + skirting, screed, tiles) eats 25-75 mm off a real room, which the host grid cannot represent at all. On this grid the *only* honest reading is "0.5 m coordination zone containing wall + its tolerance + its finishes".
- Source: S7 Ching/Ward, *Building Construction Illustrated*, 5th ed., Wiley, ch. 5 (wall build-ups) — T3, edition cited, URL not retrieved; S1 (nominal dimension concept) — T1.
- Class: FACT
- Scope: every blocked tile read as a wall
- Confidence: High
- Grid translation: Real condition: 100 mm stud + 2×13 mm board + 20 mm finish = 146 mm, inside a 4500 mm nominal room → clear 4354 mm. Host: 9 tiles = 4500 mm plate, 1 tile per side of wall → interior 7 tiles = 3500 mm. The host "loses" 854 mm it never had, and gains the 500 mm back as grid thickness. Fix by adopting the *axis* convention: dimension lines run on tile centre-lines, so a room's stated size is axis-to-axis and the wall tax (GT-24) is applied explicitly rather than smuggled in.
- Exceptions / failure mode: Failure symptom — net-to-gross ratios that make the building look 30 % inefficient, or a "0.5 m brick wall" described in a schedule. State the reading convention once, in the header.

### GT-09 Quantise door openings by clear width and record the leaf swing as a zone
- Rule: Convert a door to whole tiles of `door` state sized to the required *clear* opening, rounded up, and separately mark the swing arc as a keep-clear tile set (as tags/annotation), because a door tile carries no swing direction in the host schema.
- Evidence: A leaf never occupies its own opening in plan terms: a 838 mm (2 ft 9 in) leaf in a 915 mm clear opening needs ~1000 mm of wall zone, and the swing needs a clear quarter-circle in front of it. Host: `walkable | blocked | door` has no hinge, no swing, no clear-zone field (`src/blueprint-editor/domain/schema/walkable.ts:4`), so swing geometry must live outside the tile state — otherwise furniture ends up inside the door arc and the engine will happily path a NPC through it.
- Source: S8 door/hardware dimension reference (ANSI/BHMA A156 series sizing practice, or WBDG door-clearance guidance) — T1/T3, to verify; host schema — FACT.
- Class: ENGINEERING CONSTRAINT
- Scope: all openings, all types
- Confidence: Medium (dimensional practice) / High (schema fact)
- Grid translation: Single leaf 915 mm clear → 2 tiles of `door` = 1.0 m; pair 1500 mm clear → 3 tiles = 1.5 m; 2100 mm clear → 5 tiles (2.5 m, since 4.2 tiles rounds up). Then reserve the swing: 2 tiles × 2 tiles of `zone:swing` tagged walkable-but-clear. Failure to do this produces the classic error — a 2-tile door whose swing sweeps a tile the layout already filled with a bed.
- Exceptions / failure mode: Sliding/folding/curtain-access doors have no swing — say so in the tag rather than leaving the arc undefined. Fire-door leaf swing may be regulated (check `building-codes.md`), and a door widened to the next tile can also change its fire rating class, which the grid cannot express.

### GT-10 Never express a required clear dimension smaller than one tile; below 0.5 m the design is unbuildable here
- Rule: The grid's resolution floor is 500 mm. Any functional element smaller than that (a 100 mm reveal, a 50 mm threshold, a 150 mm duct, a 90 mm handoff) must be either grouped to ≥ 1 tile, moved to a tag/annotation, or reported as inexpressible — never drawn as a sub-tile and never silently deleted.
- Evidence: Direct consequence of `1 tile = 0.5 m` with only three tile states: there is no half-tile geometry in the schema, and no z/height field to hold thin elements. Construction increments of 100 mm — the basic module of the coordination system — are therefore 0.2 tile and unrepresentable.
- Source: host schema — FACT; S1 (100 mm basic module) — T1.
- Class: ENGINEERING CONSTRAINT
- Scope: universal
- Confidence: High
- Grid translation: A 250 mm deep niche → cannot be drawn. Options ranked: (1) absorb into the wall tile and tag `wall:niche,depth_mm=250`; (2) thicken the wall zone to 2 tiles and tag the outer 1 tile `zone:buildup`; (3) report. Never: leave 0.5 tile of walkable where a niche exists.
- Exceptions / failure mode: This is also why finish trades are invisible here: a "20 mm screed" and a "0 mm screed" produce the identical grid. Any schedule that depends on such increments must be flagged as out-of-grid (GT-26).

### GT-11 Forbid sliver rooms: minimum 2 tiles on the short interior side and 6 interior tiles
- Rule: A room whose interior (post-wall-tax, post-door-split) has any side of 1 tile, or fewer than 6 interior tiles total, is rejected as a defect, not accepted as a small room. The check runs on the *derived* room polygon, not the drawn one.
- Evidence: This is host-specific and hard: rooms come from 4-connected flood-fill and door cells belong to no room (`src/engine/npc/rooms.ts:2,15,33`), so a door run laid across a room's width divides it there and can manufacture exactly such slivers — a 1-tile room that no NPC can use and that no fixture tag can justify. Separately, real "usable space" thresholds sit far above 0.25-0.5 m²: a 1-tile room is 0.25 m², smaller than a person standing.
- Source: host code — FACT; project `architecture-theory.md` TH-02 wall-tax arithmetic — T3 internal.
- Class: CODE REQUIREMENT
- Scope: all derived rooms
- Confidence: High
- Grid translation: Drawn room 6×5 tiles outer → interior 4×3 = 12 tiles = 3.0 m², acceptable (1 tile = 0.5 m linear, so a W×H outer footprint gives (W−2)×(H−2) usable tiles). Now divided by a door run the 4-tile interior side with a door line: flood-fill yields two rooms of 2×3 = 6 and 6 tiles, i.e. **1.0 × 1.5 m each — corrected: this line formerly read "1.5×1.5 m", which is wrong at 0.5 m/tile (2 tiles = 1.0 m); the 6 + 6 = 12 tile count was right.** Both halves pass the 6-tile rule but a 1.0 m wide room is a cupboard; raise the practical bar: `interior_short_side ≥ 2 tiles AND ≥ 6 tiles AND passes fixture-typing`. Validate the derived set with a one-shot assertion; do not eyeball.
- Exceptions / failure mode: Deliberate small cells (closet, WC cubicle, store) are legitimate at 2×2 tiles (1.0×1.0 m) — but must be tagged, and a 2×2 cell with a door tile in it becomes 3-4 tiles after the door is subtracted: check *after* derivation.

### GT-12 Give every space type a named module (room, corridor, core, shaft, bay) and repeat it verbatim
- Rule: Define each repeat type once, as a tile footprint with a fixed anchor offset, then instantiate it. No hand-placed copies; no per-floor improvisation of a repeated element.
- Evidence: Repeated-module design is what makes coordination pay: components are specified once and produced N times, and the saving comes from not cutting. Host corollary: repeated footprints make the room-derivation and the area ledger stable, and let one validation rule cover every instance.
- Source: S1, S3 — T1/T3; S9 prefabrication/repetition practice (Bostian *Prefabs* or similar) — T3, optional.
- Class: DESIGN PRINCIPLE
- Scope: hotels, wards, offices, parking, cellular residential — anything with repetition
- Confidence: High
- Grid translation: `ROOM-HOTEL-A: 8×15 tiles plate (4.0×7.5 m), interior 6×13 = 78 tiles = 19.5 m², door at (2,0)-(3,0) on the corridor side, anchor = west-near corner.` Instantiated 14× per floor at x = 8k, z = 0, with the party tile shared. Validation: all instances produce identical derived room tile counts, or the layout drifted.
- Exceptions / failure mode: Corner, end-of-corridor and accessible variants legitimately differ — enumerate them as named variants (`ROOM-HOTEL-A-CORNER`) rather than free-drawing them; each variant still gets its own footprint definition.

### GT-13 Corridor module: one width in tiles for the whole circulation network, and read width as *effective* width
- Rule: Pick the corridor width once (typically 3 tiles = 1.5 m clear for main circulation, 2 tiles = 1.0 m minimum single-file), apply it identically everywhere, and never treat a 1-tile-wide route as a corridor at all.
- Evidence: Movement on this grid is octile A* with cardinal cost 1 and diagonal √2, and diagonals are only allowed where both orthogonal neighbours are open and unoccupied (`src/engine/npc/pathfinding.ts:190-228`). In a 2-tile corridor the diagonal is usually blocked by the walls, so circulation costs `dx+dz` — up to 1.41× more tile-steps per metre than in an open hall of the same dimension. Corridor width therefore changes *effective* capacity and travel time, not just geometry.
- Source: host code — FACT; `architecture-theory.md` (octile/circulation notes) — T3 internal; S4 (aisle-width minimums) — T1/T3.
- Class: CODE REQUIREMENT
- Scope: all circulation
- Confidence: High
- Grid translation: Intended clear corridor 1400 mm → 2.8 tiles → 3 tiles = 1500 mm. Two 3-tile corridors at right angles plus one 5×5 tile lobby node: 6.75 tiles of straight walking 100 tiles in an open hall vs 100 in the corridor; where an open hall is possible, travel time drops ~29 % for the same distance. Report corridor width and diagonal-permissibility together.
- Exceptions / failure mode: Dead-end corridors, cul-de-sacs and service aisles may be narrower but not below the 2-tile floor, and any pinch (a door leaf projecting, a nib created by rounding) must be checked at the *narrowest* tile row, not the nominal width.

### GT-14 Core module: fix the core as a tile rectangle, then stack-verify it against shafts, lifts and stairs
- Rule: The core is a designed rectangle in tiles with internal allocation (lift hall, WC bank, risers, shafts, stairs) expressed as sub-rectangles; its footprint must be large enough to hold the required *count* of elements at their own tile minimums — computed, not drawn to look plausible.
- Evidence: Host: vertical movement is not on the grid at all — lifts/stairs are `portal`-tagged objects with queues — so the core's plan area is a container for objects whose real dimensions (lift 2100×2100 mm car + 1500 mm pit/overtravel, stair width) are outside the tile model. The core is where the grid's inability to express height, pit or machine footprint becomes visible.
- Source: host model (portals) — FACT; S4/S10 lift and stair dimensional practice — **T3, located but not read; the sub-rectangle sizes below are illustrative placeholders, not quoted manufacturer figures**.
- Class: ENGINEERING CONSTRAINT
- Scope: all multi-floor buildings
- Confidence: Medium on the method (sum the parts, then pack them) / Low on the individual element dimensions.
- Grid translation: **Worked, not eyeballed — and corrected.** The parts: 3 lift machine rooms at 5×5 = 25 tiles → 75; 3 halls at 4×6 = 24 tiles → 72; one stair, 3 tiles wide × 6 = 18; 2 shafts at 1×2 = 4. **Sum of element area = 169 tiles.** An earlier draft of this line asserted "minimum core ≈ 12×15 tiles = 6.0×7.5 m = 45 m²" — that does **not** fit: 12×15 = 180 tiles, leaving 11 tiles of slack for walls, packing loss and circulation across eight separate sub-rectangles, which is not a fit, so the stated minimum was understated. A rectangle that does pack the parts exactly: **15 × 13 tiles** = 7.5 × 6.5 m = **48.75 m²/floor** — band 1: 15×5 = 75 (three 5×5 machine rooms, no waste); band 2: 15×6 = 90 (three 4×6 halls = 72 plus one 3×6 stair = 18, no waste); band 3: 15×2 = 30 (two 1×2 shafts = 4, remainder 26 tiles = lift lobby). 75 + 90 + 30 = 195 = 15×13 ✓, and 75 + 72 + 18 + 4 = 169 of those 195 tiles are element area. Then check the core's near-side alignment against the GT-02 datum: shaft centre-lines at x = 30.5, 32.5 etc. must be identical on all floors.
- Exceptions / failure mode: Split/distributed cores (hotel: back-of-house core separate from guest core) are valid — but each is its own module, and their separation distance is a real fire-separation dimension the grid can hold only in whole tiles. **Open cross-file conflict, unresolved here:** the 1×2-tile shaft used above is contradicted by `construction.md` CN-12, which sets a 3×3-tile minimum for a single riser and declares a 1-tile shaft unbuildable; one of the two files is wrong about the same object and they must be harmonised before either number is used as a validation threshold.

### GT-15 Structural bay module: express the column/beam grid in whole tiles and keep spans on the coordination cell
- Rule: Bays are whole tiles (and ideally whole 3-tile cells); structure is placed on the same datum as partitions, and any wall tile that is a column, a load-bearing wall or a non-load-bearing partition is distinguished by tag, never by inference.
- Evidence: On this grid there are no structural objects — every thick element is one blocked tile — so a 400 mm square column, a 300 mm RC wall and a 100 mm stud are all "1 tile". Real coordination puts the structural grid on the major module (600/1200/3000 mm and up) and the partitions on a subordinate module; here both collapse to the same 500 mm grid, so alignment must be enforced by convention.
- Source: S1 ISO 2848:1984 — T1 (title/subject only). **S2 (DIN 4150-1) withdrawn as unverified — no longer cited here.** S7 (structural grid vs. partition grid) — T3, edition cited, not read.
- Class: FACT
- Scope: all types with structure; for the simulation the effect is on pathing and room derivation
- Confidence: High
- Grid translation: 6000 mm bay = 12 tiles — exact and on-module. 7500 mm = 15 tiles — exact and on-module (15×0.5 = 4×1.875? no: 7.5 m = 5 × 1.5 m cells — exact in both systems). 8400 mm (a common office/retail bay) = 16.8 tiles → 17 tiles = 8.5 m, which is off both the 3M family and the 1.5 m cell: a repeated 10-bay façade drifts +1.0 m against the structural grid. Prefer 9.0 m = 18 tiles, or accept the drift explicitly at the expansion joint.
- Exceptions / failure mode: Long-span andTransfer-plate structures genuinely break the grid above grade (hotel over podium parking). Then the grid changes floor-by-floor — GT-02's declared re-datum, and GT-16's stack rule, must record it.

### GT-16 Stack-align every repeated module across floors on identical tile coordinates
- Rule: For every repeated element (room module, core, shaft, bay line, façade line, unit boundary), require that its tile rectangle on floor N equals its tile rectangle on floor N+1 unless a declared transition exists at that level.
- Evidence: Nothing in the host validates this: rooms are derived per floor, portals are hand-joined, so a "same" hotel floor drawn twice will drift. In reality drift shows as misaligned risers and cut pipes — the same physical cost the coordination standard exists to avoid.
- Source: S1 ISO 2848:1984 — T1 (title/subject only; **S2 withdrawn as unverified, see Sources**); host per-floor derivation — FACT.
- Class: CODE REQUIREMENT
- Scope: multi-floor
- Confidence: High
- Grid translation: Emit a per-floor module table `{module_id, tile_rect}` and diff consecutive floors; the diff must be empty except for declared rows. Worked: guest room module at (x=8k, z=0, 8×15) for k=0..13 on floors 2-12 → 11 identical tables. Floor 1 (lobby) legitimately differs — record `floor 1: module ROOM-HOTEL-A replaced by SPACE-LOBBY, bay lines retained at x=8k`.
- Exceptions / failure mode: Setback towers, double-height spaces and column-free conference floors are legitimate breaks. What is not legitimate is a 1-tile drift caused by re-rounding the same 2400 mm corridor as 5 tiles on one floor and "eyeballing 4.8" on the next.

### GT-17 Compute quantisation error per dimension and propagate it into area
- Rule: For every quantised rectangle report `error_w`, `error_d` and area error, using `ΔA/A ≈ Δw/w + Δd/d` (exact as `((w+Δw)(d+Δd))/(wd) - 1`), and bound the systematic bias: `ceil` on both dimensions guarantees positive area error, so a whole-programme area total must be corrected, not trusted.
- Evidence: Arithmetic, not opinion: a 3000×2600 mm room is 7.8 m²; ceil-tiled it is 6×6 tiles = 3.0×3.0 = 9.0 m², i.e. +15.4 %. Because the grid can only add, an N-room programme always comes out heavier than planned — the classic symptom of a design that "meets the areas" on a tile grid and is over budget on real floor plate.
- Source: derived (verifiable arithmetic) — FACT; S1 (nominal/usable area distinction) — T1.
- Class: FACT
- Scope: every area claim, every efficiency metric
- Confidence: High
- Grid translation: Report three distinct numbers and never use them interchangeably: `net_programme_tiles` (what the programme asked for, area_m² × 4), `net_to_shell_tiles` (walkable tiles actually belonging to derived rooms), `gross_plate_tiles` (every tile on the floor); the ordering is always `gross_plate ≥ net_to_shell ≥ net_programme`, and the two gaps are the circulation+structure+service shares. Worked error table for a ceil-on-both-sides grid: 2400×1200 mm (2.88 m²) → 5×3 tiles = 15 tiles = 3.75 m² (+30 %); 4800×3600 mm (17.28 m²) → 10×8 = 80 tiles = 20.0 m² (+16 %); 7500×4000 mm (30.0 m²) → 15×8 = 120 tiles = 30.0 m² (0 %, both dimensions already on the module). Small rooms carry the largest percentage error: relative error ≤ (w+500)(d+500)/(w·d) − 1.
- Exceptions / failure mode: Do not "fix" this by using `floor()` — a room under the programme area fails the brief. Fix it by choosing dimensions that are exact (multiples of 500 mm, ideally of 1500 mm) in the first place.

### GT-18 Cap cumulative error: anchor every module absolutely, never accumulate rounded steps
- Rule: Position each module from the datum by an absolute tile coordinate; never lay out by "module + module + module" in either representation, because per-module rounding errors add linearly while the real joints do not.
- Evidence: Standard coordination practice: tolerance is allocated to designated joints and dimensions are taken from reference lines so errors do not accumulate. Here the arithmetic is stark: 20 bays of a 6000 mm bay drawn as 12 tiles is exact (0 drift); the same façade with 8400 mm bays at 17 tiles each gives 20×17 = 340 tiles = 170 m against a real 168 m — +2.0 m of accumulated lie, and the last bay is 2 tiles wider than the first.
- Source: S1 ISO 2848:1984 — T1 (title/subject only: tolerance allocation and reference-line dimensioning are within its subject, but **no clause text was read, and S2 — the identifier earlier drafts of this line cited — is withdrawn as unverified**); arithmetic — FACT.
- Class: ENGINEERING CONSTRAINT
- Scope: all repeated linear arrangements: bays, rooms along a corridor, parking rows, ward bed runs, shelving runs
- Confidence: High on the arithmetic (20 × 17 tiles = 340 tiles = 170 m vs a real 168 m); Medium on the standards attribution. [classification note: demoted from `STANDARD`: the STANDARD tier rested on the withdrawn S2 identifier and on unread clause body; the arithmetic stand alone.]
- Grid translation: Write the layout as `x_k = 17k` (anchored) plus a declared joint `j = (168000 mm − 20×8400) → distribute as ±` — or, better, choose 8500 mm = 17 tiles for all bays and accept +100 mm per bay, taken up by the façade tolerance strip. Rule of thumb: after N modules, allowed drift ≤ 1 tile; if `N × error_mm > 500`, break the chain with a real joint or change the module.
- Exceptions / failure mode: Expansion joints and construction joints are the legitimate places where accumulation is *released* — model them as a widened blocked zone with tag `joint:expansion`, and count their width in tiles.

### GT-19 Declare inexpressibility thresholds and stop designing at them
- Rule: Publish the list of things the grid cannot express, and when a design requires one of them, report "not physically expressible on this grid" and either change the design or move the item to a documented non-grid field — never approximate silently.
- Evidence: Hard consequences of the schema: `walkable | blocked | door` only (`src/blueprint-editor/domain/schema/walkable.ts:4`); no height, no slope, no section; wall = exactly one tile; doors belong to no room; no structural/material/finish objects; vertical = portal objects; metres unstored. Each is a wall, not a curve.
- Source: host code — FACT.
- Class: ENGINEERING CONSTRAINT
- Scope: universal
- Confidence: High
- Grid translation: Threshold list with tile-math: sub-500 mm increments (100 mm basic module = 0.2 tile) — unexpressible; angles other than 0/45/90 — only approximable (a 30° wall becomes a staircase of tiles, and its length inflates: a 5000 mm 30° wall ≈ 6 tiles of 45° steps = 4243 mm of run plus 2475 mm of rise, wrong in both legs); any dimension whose required tolerance is tighter than ±250 mm — unmeasurable; floor-to-floor heights, ceilings, sloped floors, ramps-in-section, mezzanines — no field; the 50 mm threshold strip between two floor finishes — invisible.
- Exceptions / failure mode: The failure to guard against is confidence: a tile grid can render *anything* as blocks, which makes inexpressible designs look expressed. When the required tolerance band around a dimension is narrower than one tile, the design is at the resolution limit and further optimisation is noise.

### GT-20 Tag every blocked tile with exactly one kind — structure, shaft, service, furniture, or zone
- Rule: Since all four read identically as `blocked`, the plan must carry a mandatory single-valued `kind:*` tag on every blocked tile, from a closed vocabulary, with a defined default and a lint that fails on untagged blocked tiles.
- Evidence: Host has no structural/material/furniture object types; the only differentiators available are object/area tags (the same mechanism the engine uses for access-by-role and for room typing by fixture tags). Uncorrected, this produces a plan where a demolition-ready core wall and a loose wardrobe are indistinguishable, and a validation that "counts walls" is wrong by the whole furniture budget.
- Source: host code (`walkable.ts:4`, tag-driven access/typing) — FACT; `architecture-theory.md` (fixture-tag room typing) — T3 internal.
- Class: CODE REQUIREMENT
- Scope: universal
- Confidence: High
- Grid translation: Vocabulary: `kind:wall-ext`, `kind:wall-party`, `kind:wall-int`, `kind:col`, `kind:beam`, `kind:shaft-dry`, `kind:shaft-wet`, `kind:service-band`, `kind:equip-fixed`, `kind:furn-loose`, `kind:zone-tolerance`, `kind:joint-expansion`. Worked: real condition "400 mm RC core wall + 100 mm service chase + 60 mm duct" = 560 mm total, 1.12 tiles → 2 tiles: tag tile A `kind:wall-core`, tile B `kind:service-band` (rounding up *assigns* the extra 440 mm to the service band, which is exactly GT-07's absorber choice).
- Exceptions / failure mode: Multi-valued tiles (a column inside a wall) need a documented precedence rule — e.g. `kind` takes the *strongest* element and the weaker is a secondary tag; without precedence, counts and lints disagree floor by floor.

### GT-21 Reserve services as whole tiles in a band; never thread them through the room-side face
- Rule: All vertical risers, duct runs and service zones occupy whole tiles inside the wall/service band or the core, laid out as a continuous band, and the usable face of every room is the inner boundary of that band.
- Evidence: Real coordination reserves a service zone (the "service band" / ceiling void / duct trunk route) as part of the module, and the ISO-style logic of subordinate modules exists precisely to keep component sizes compatible with it. On the host grid services have no geometry at all, so the only expression available is "these blocked tiles are the service band" — plus tags.
- Source: S1 ISO 2848:1984 — T1 (title/subject only; the subordinate-module / service-zone *concept* sits inside its subject, but **its wording was never read, so none is quoted here. S2 — cited by earlier drafts of this line — is withdrawn as unverified, and S3 is a pointer that supports no number**); S11 services-coordination text (MIL-Handbook/service coordination lineage) — T3, optional, not read.
- Class: DESIGN PRINCIPLE
- Scope: all inhabited floors
- Confidence: Medium [classification note: demoted from `STANDARD`: the STANDARD tier rested on the withdrawn S2 identifier; the service-band reservation is project judgement on top of an unread standard.]
- Grid translation: Guest-room block: corridor 3 tiles, then `kind:service-band` 1 tile (0.5 m, holds risers + duct), then the party wall tile, then room interior. Worked: a 140 mm soil stack + 100 mm vent + 440 mm insulation/access = 680 mm → 2 tiles of band. Keep the band continuous along the corridor so no riser is stranded behind a habitable room — and note that this band *is* a rounding absorber (GT-07), so prefer to send remainders there rather than into rooms.
- Exceptions / failure mode: Wet areas far from the band force long, falls-dependent pipe runs that the grid cannot express (no section). Then either move the wet area to the band, or report the design as "expressed in plan only, service routing unverifiable".

### GT-22 Do not lay a door run across a room width - the flood-fill divides the room there
- Rule: Door tiles sit only in wall tiles, on the boundary between two spaces, never on a tile that would split one room into two; every door placement is re-validated by running room derivation and confirming the expected room count and areas.
- Evidence: Host behaviour, not interpretation: rooms are 4-connected flood-fill and door cells belong to no room (`src/engine/npc/rooms.ts:2,15,33`), so a door inside a room's floor area cuts that room in two, and a door that touches two wall faces at a corner can detach a whole quadrant. A plan that looks correct can silently contain 2 rooms where 1 was designed, with 2 fixture tags now typing one room.
- Source: host code — FACT.
- Class: CODE REQUIREMENT
- Scope: universal
- Confidence: High
- Grid translation: A 9-tile-wide room wall needs a 2-tile door: replace exactly 2 of the 9 boundary `blocked` tiles with `door` tiles → still one room. Placing the 2 door tiles anywhere in the interior 7×N floor area makes two rooms; the derived check is `rooms_expected == rooms_derived` per floor, and `sum(derived room tiles) + door tiles + blocked tiles == floor tiles` — an identity worth asserting (see GT-24).
- Exceptions / failure mode: Deliberate division — a suite split into bed-sitting + alcove by a door line spanning the throat (this is how to split a room on purpose; a couple of loose door tiles will not do it) — a suite a doorway — is legitimate, but then both halves are rooms and both need typing. Sliding-door and open-plan "no door" zones should use `walkable` with an area tag instead of `door`.

### GT-23 Pay the wall tax once: shared party tiles, and ledger doors separately from walls
- Rule: Adjacent rooms share one party tile; area accounting reports `plate = walkable + door + blocked` and never double-counts a party wall; the door tile count is a third, separately named ledger line.
- Evidence: Direct arithmetic of the host model — a wall is one blocked tile (0.5 m), so a party wall between two rooms costs 0.5 m of plate total, not 0.5 m each; and door tiles are neither wall nor room in the derivation (`rooms.ts` excludes them), so lumping doors with either line corrupts net-to-gross.
- Source: host code — FACT; `architecture-theory.md` TH-02 — T3 internal.
- Class: FACT
- Scope: every area statement in the project
- Confidence: High
- Grid translation: 14-room guest floor, each module 8×15 tiles, side by side along a 3-tile corridor: naive sum = 14×120 = 1680 tiles; shared party tiles = 13 × 15 = 195 tiles saved → plate = 1485 tiles + corridor + core. Report: net 14×78 = 1092 tiles = 273.0 m², doors 28 tiles, walls 365 tiles, band/core X tiles. Never publish "273 m² of floor" for a plate of 1485+ tiles = 371+ m².
- Exceptions / failure mode: Where the party tile is also a structural wall it must be tagged `kind:wall-party,struct=true`; where two rooms are separated by a service band instead, the ledger gains 2 tiles between them — say so rather than assuming a 1-tile party everywhere.

### GT-24 Report net-to-gross after quantisation, with the loss table, not before
- Rule: Efficiency metrics must be computed from derived tile sets (post wall tax, post door subtraction, post rounding), and every design ships with a loss table showing where the plate went: structure, envelope, circulation, services, tolerance, unusable slivers.
- Evidence: On this grid the loss is unusually large: a 6×5 tile room loses 18 of 30 tiles (60 %) to its own ring, and a 12×10 tile room loses 40 of 120 (33 %) — the wall tax is severe at small sizes, so an efficiency figure computed from intended metres rather than derived tiles is not merely optimistic but wrong by tens of percent.
- Source: `architecture-theory.md` TH-02 (wall-tax arithmetic) — T3 internal; host code — FACT; S12 net-to-gross/efficiency practice (BOMA-style measurement conventions) — T3, verify before quoting a specific standard.
- Class: ENGINEERING CONSTRAINT
- Scope: all types; dominant risk in cellular types (hotel, wards, offices)
- Confidence: High on the arithmetic, Medium on citing a specific measurement standard.
- Grid translation: Worked: intended 18.0 m² room = 72 net tiles. Drawn as 8×14 tiles plate = 112 tiles with interior 6×12 = 72 tiles ✓. Envelope loss: ring 40 tiles = 10.0 m² = 36 % of that module's plate. Whole-floor roll-up in tiles → m² at 0.25 factor, per row: net / doors / walls / band / core / circulation / tolerance / slivers. Sum must equal plate exactly (identity check).
- Exceptions / failure mode: A "100 % efficient" figure means walls were not counted. A figure below ~55 % for a cellular type means rooms are too small on a 0.5 m grid (GT-11) and the type should be reconsolidated, not reported as bad design.

### GT-25 Keep proportions inside the rational set the grid can hold
- Rule: Room and opening proportions must be ratios of tile counts; anything requiring an irrational ratio (√2, golden section) or a ratio whose terms exceed the available tile dimensions is approximated to the nearest tile-ratio and the approximation is recorded.
- Evidence: A 500 mm square grid can only express rectangles `a×b` with `a,b ∈ ℕ` tiles; the achievable ratio set is dense but finite at any size, and the classical proportional systems (which assume continuous drawing) are not among them. `architecture-theory.md` covers the human-dimensional side (proportion of space to body); this rule bounds what the geometry can carry.
- Source: derived arithmetic — FACT; S5 — T3 (edition cited).
- Class: HEURISTIC
- Scope: design-quality dimensions of rooms, openings, façades
- Confidence: Medium
- Grid translation: Target 1:1.5 for a 4.0×6.0 m room: 8×12 tiles — exact ✓. Target √2 (1:1.414) for a 3.0 m wide room: 6 tiles wide → 8.49 tiles → 8 tiles = 1:1.333 or 9 = 1:1.5; the grid cannot give √2 and the closest small-integer ratio at that size is 1:1.5. Golden 1:1.618 at 6 tiles wide → 9.7 tiles → 10 → 1:1.67. Report "intended 1:1.41, expressed 1:1.50 (+6 %)".
- Exceptions / failure mode: Repeated small rooms systematically biased to 1:1.5 look uniform but feel same-y; deliberate ratio variety across a floor is a legitimate reason to accept several off-module sizes — GT-06's nearest rule plus GT-17's error report covers it.

### GT-26 Ship a limitations register with every translated design
- Rule: End each design deliverable with a machine-readable register: elements reported out-of-grid, dimensions below resolution, unexpressible properties (height, slope, section, angle, material, tolerance), the absorbers used and how much remainder each took, and the maximum drift anywhere in the plan.
- Evidence: This is the only honest closure of the translation: because the grid always renders *something*, silent loss is the default outcome, and the project's own validation layers need the register to distinguish "correct small building" from "unexpressible building".
- Source: derived — HEURISTIC; host schema — FACT; `validation.md` multi-level checks — T3 internal.
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: High
- Grid translation: Register skeleton, per floor: `{out_of_grid:[{item, wanted_mm, reason}], sub_resolution:[...], unexpressible_props:[{prop, where}], absorbers:[{kind, took_mm}], max_drift_tiles, tolerance_band_mm:±250}`. Worked single line: `{"item":"wc-04 partition setout","wanted_mm":1300,"expressed":"2 tiles = 1000 mm / 3 tiles = 1500 mm","absorber":"service-band +200 mm","note":"basin depth 550 mm unchanged; clearance still ≥ 600 mm at 3 tiles"}`.
- Exceptions / failure mode: A register that is always empty is a broken register. Force at least one entry per floor for any cellular type — the 0.5 m wall alone guarantees dimensional conflict.

---

## Master conversion table

Real dimension → exact tiles → drawn tiles (ceil for thresholds / nearest for proportions) → error.
`E` marks values exact on both the 0.5 m grid and the 1500 mm coordination cell.

| Real dimension | mm | exact tiles | drawn tiles (ceil) | drawn size | error | note |
| --- | --- | --- | --- | --- | --- | --- |
| Basic module 1M | 100 | 0.2 | — | — | — | unexpressible (GT-10) |
| 2M | 200 | 0.4 | — | — | — | unexpressible |
| 3M coordinating module | 300 | 0.6 | 1 tile | 500 | +200 | off-grid family |
| 4M | 400 | 0.8 | 1 | 500 | +100 | |
| 6M | 600 | 1.2 | 2 | 1000 | +400 | worst-case small jump |
| 12M | 1200 | 2.4 | 3 | 1500 | +300 | **E** |
| 900 mm door leaf | 900 | 1.8 | 2 | 1000 | +100 | GT-09 |
| 915 mm clear opening (access.) | 915 | 1.83 | 2 | 1000 | +85 | ceil required |
| 1050 mm door | 1050 | 2.1 | 3 | 1500 | +450 | consider 2 tiles + wider frame |
| 1200 mm double-egress | 1200 | 2.4 | 3 | 1500 | +300 | **E** |
| 1500 mm turning space / lift width | 1500 | 3.0 | 3 | 1500 | 0 | **E** — the safe module |
| 1400 mm corridor | 1400 | 2.8 | 3 | 1500 | +100 | |
| 2000 mm door height | — | n/a | n/a | n/a | — | no height field (GT-19) |
| 2400 mm clear corridor | 2400 | 4.8 | 5 | 2500 | +100 | off 3M family |
| 2500 mm | 2500 | 5.0 | 5 | 2500 | 0 | grid-exact, off-module |
| 3000 mm room / lift lobby | 3000 | 6.0 | 6 | 3000 | 0 | **E** |
| 3600 mm room plate | 3600 | 7.2 | 8 | 4000 | +400 | off both systems |
| 4000 mm | 4000 | 8.0 | 8 | 4000 | 0 | grid-exact, off-module |
| 4200 mm | 4200 | 8.4 | 9 | 4500 | +300 | **E** at 4500 |
| 4500 mm | 4500 | 9.0 | 9 | 4500 | 0 | **E** |
| 6000 mm structural bay | 6000 | 12.0 | 12 | 6000 | 0 | **E** — best bay |
| 7500 mm bay | 7500 | 15.0 | 15 | 7500 | 0 | **E** |
| 8400 mm retail/office bay | 8400 | 16.8 | 17 | 8500 | +100 | drifts 2 tiles over 10 bays |
| 9000 mm clear-span bay | 9000 | 18.0 | 18 | 9000 | 0 | **E** |
| 5000×3000 mm room | — | 10×6 | 10×6 | exact | 0 | **E** |
| 1 parking bay 2500×5000 | — | 5×10 | 5×10 | exact | 0 | **E** — translates perfectly |
| 1 parking bay 2400×4800 | — | 4.8×9.6 | 5×10 | 2500×5000 | +100 mm | fine (minima) |
| 2400×1200 mm desk module | — | 4.8×2.4 | 5×3 | 2500×1500 | +100/+300 | office furniture off-grid |
| 1200 mm kitchen unit run | 1200 | 2.4 | 3 | 1500 | +300 | 600 mm units = 1.2 tiles |

Anchor facts: `1 tile = 500 mm`; `1 tile² = 0.25 m²`; `4 tiles² = 1 m²`; `3 tiles = 1500 mm = LCM(3M, grid)`;
`6 tiles = 3 m`; `12 tiles = 6 m`; wall thickness = 1 tile = 500 mm (over-thick, see GT-08).

## Rounding & remainder policy

Three policies, chosen by dimension class — never globally, never randomly.

| Policy | Applies to | Rule | Where the remainder goes |
| --- | --- | --- | --- |
| **Ceil (round up)** | functional minima: clear widths, egress, accessible clearances, machine/bed/person envelopes, structural clearances, service band | `tiles = ceil(mm/500)` | into the room/clearance — a bigger clearance is legal, a smaller one is not |
| **Nearest** | proportions, non-regulated room shapes, façade rhythm, furniture layouts | `tiles = round(mm/500)` | split as ±250 mm tolerance band, absorbed by wall zone or finish |
| **Absorb at joint** | long chains: N bays, N cells along a corridor | anchored absolute positions | an expansion/building joint every `floor(500/max_error)` modules, minimum 1 tile wide |

Precedence when policies conflict: **safety/accessibility minimum (ceil) > programme usable area (never reduced) > coordination module (prefer 1500 mm multiples) > proportion (nearest) > appearance (free).**

Remainder absorbers, in the order to use them:
1. **Wall/structure zone** — free capacity 250-400 mm per tile face; invisible to occupants; use first for ±small remainders.
2. **Service band** — designed slack (GT-21); absorbs up to whole tiles; use for the big remainders (300-500 mm), and it doubles as rounding slack for future changes.
3. **Declared tolerance strip** — a tagged zone along one datum-adjacent line per floor (`kind:zone-tolerance`), so all error of a floor lands at *one* known joint, not smeared across every room.
4. **Façade/plate edge** — the last legal absorber: change the external wall thickness or the plate dimension, and report it, because it changes net-to-gross and cost.
5. **Never**: usable area of an occupied room, egress route width, or an accessible clearance. Taking remainder there converts a rounding decision into a design change and hides it.

Rule of thumb on magnitude: a ceil error per dimension is 0 ≤ e < 500 mm with 250 mm expected; for a target of size `d`, worst-case relative error is `500/d` — so 500 mm targets can be 100 % wrong, 1500 mm targets ≤ 33 %, 6000 mm targets ≤ 8 %. **Small dimensions are the danger zone, not long ones** — prefer to express small parts as whole tiles ≥ 1 and to shift the uncertainty to a neighbouring larger element.

## Quantisation failure modes

| # | Failure | Symptom on this grid | Guard |
| --- | --- | --- | --- |
| 1 | Sub-tile element deleted | a real 100 mm reveal vanishes; adjacent room 500 mm wider than intent | GT-10 register entry |
| 2 | Double ceil | both room dimensions rounded up → area +15-30 %, plate over budget | GT-17 |
| 3 | Accumulated chain drift | last bay 2-4 tiles off; risers miss their holes | GT-18, joints |
| 4 | Sliver room from door-in-room | flood-fill yields two unusable rooms, one fixture tag | GT-22, GT-11 |
| 5 | Wall tax double-count | party wall counted once per room; efficiency collapses | GT-23 |
| 6 | Door ledger confusion | doors counted as wall or as room; net/gross mismatch | GT-23 identity check |
| 7 | Off-module "modularity" | tile-modular, factory-immodular: every component cut | GT-03 |
| 8 | Phantom precision | schedules quote 2400 mm for a 5-tile (2500 mm) dimension | GT-04 |
| 9 | 0.5 m wall read as structure | "500 mm masonry partition" in the schedule | GT-08 axis convention |
| 10 | Swing-less door | furniture placed inside an unmodelled leaf arc | GT-09 |
| 11 | Corridor pinch | nominal 3 tiles, effective 2 at a nib/door frame | GT-13 narrowest-row check |
| 12 | Diagonal-starved circulation | travel times +41 % vs an open hall of equal size | GT-13 |
| 13 | Mis-stacked floors | portal joins that no longer line up, risers offset | GT-16 diff |
| 14 | Untagged blocked tile | furniture reads as demolition-ready core wall in validation | GT-20 |
| 15 | Stranded riser | shaft tile inside a habitable room, no band continuity | GT-21 |
| 16 | Irrational proportion forced | √2 room becomes 1:1.5 and nobody says so | GT-25 |
| 17 | Angle that cannot exist | 30° wall stair-stepped; both legs' lengths wrong | GT-19 |
| 18 | Vertical smuggled into plan | stair/lift "expressed" as tiles; heights and pits invisible | GT-14, GT-19 |
| 19 | Silent absorber exhausted | remainder pushed into usable area after all four absorbers are full | GT-07, GT-26 |
| 20 | Empty limitations register | register says "none" on a cellular floor — the register itself is broken | GT-26 |

## Sources

Verified this session (T1 = official standard record, T3 = secondary/encyclopaedic or gov. report):

- S1 — **ISO 2848:1984, *Building construction — Modular coordination — Principles and rules*.** Title and year confirmed; the standard's subject is the principles and rules of modular coordination on the 3M system with a 100 mm basic module. ISO catalogue/OBP: https://www.iso.org/obp/ui/#!iso:std:7846:en (standard id 7846); sample record https://cdn.standards.iteh.ai/samples/7846/a86382c91b96433da03b947608e0c2d0/ISO-2848-1984.pdf — **T1 for identity only.** The PDF body has never been machine-readable to this project (the sample re-fetch this pass returned a corrupted stream, and https://www.iso.org/standard/7846.html returned HTTP 403), **so no clause text is or may be quoted from S1 anywhere in this file, and its live-vs-withdrawn status is still not established.**
- S1w — ***https://en.wikipedia.org/wiki/ISO_2848*** — **T3** (encyclopaedic). Read verbatim this pass: *"ISO 2848 is based on multiples of 300 mm and 600 mm. Preference given to lengths which are multiples of 3, 6, 12, 15, 30 and 60 basic modules."* This is the source of the preferred-series enumeration used in GT-03; it agrees with the ISO record the audit opened, but it is a secondary source and the standard's own table has not been read.
- S1b — **ISO 1006:1983, *Modular coordination — Basic module*.** This, not ISO 2848, is the standard that names the basic module — https://www.iso.org/standard/5470.html — **T1**. Relevant because the 100 mm basic module claim (GT-03, GT-10) belongs to ISO 1006.
- S2 — **WITHDRAWN AS EVIDENCE. NOT A VERIFIED STANDARD.** Earlier drafts cited "DIN 4150-1 *Modulraster*" as a modular-coordination standard. It could not be shown to exist: every search result for `DIN 4150` returned the DIN 4150-1…-3 *building vibration* series (e.g. DIN 4150-3:2016, see https://www.movesolutions.it/post/what-is-din-4150-and-why-is-it-the-global-standard). **S2 is therefore struck from every rule-level Source line in this file (GT-03, GT-07, GT-15, GT-16, GT-18, GT-21) and the `STANDARD` classes that rested on it have been demoted.** The correct German modular-coordination standard number is unknown to this project and must not be guessed; do not cite DIN 4150-1 in derived documents until a Beuth record is read — **unusable**.
- S3 — **NBS/NIST government report, *International and national standards on dimensional coordination*** (compiles ISO + national modular-coordination standards incl. DIN, NF, BS) — https://www.govinfo.gov/content/pkg/GOVPUB-C13-dbfc0c2959817b8c5904d1001a935af6/pdf/GOVPUB-C13-dbfc0c2959817b8c5904d1001a935af6.pdf — **T2/T3**. URL confirmed to exist via search; the PDF stream was not machine-readable in this session (re-attempted, still unread), so it is a **pointer only and supports no number**: where a rule still lists S3 it contributes nothing beyond the address, and it is never a `STANDARD`-tier warrant.
- S3b — *Modular coordination* overview (redirect/summary page; the 3M system and national adoptions are **not** on it) — https://en.wikipedia.org/wiki/Modular_coordination — **T3, weak**: consulted and found to carry none of the figures used here. Kept as a negative result so nobody re-cites it.
- S4 — WBDG (NIBS/NIH) design-discipline pages incl. barrier-free dimensioning — https://www.wbdg.org/design-objectives/able-bodied — **T1/T3**.
- S5 — F. D. K. Ching, *Architecture: Form, Space, and Order*, 5th ed., Wiley — **T3**, cited by edition; no URL retrieved (used only for proportion vocabulary, no numeric claim).
- S6 — **WITHDRAWN AS EVIDENCE. IDENTIFIER NOT VERIFIED.** "BS 5606 *Guide to accuracy in building*" — no BSI record retrieved in any pass, so the number may be wrong. **It has been struck from GT-07's Source line and GT-07's class demoted from `STANDARD` to `DESIGN PRINCIPLE`**; the tolerance *principle* used there is credited to S1's subject matter plus standing practice, not to this identifier. Do not reproduce "BS 5606" downstream as a citation until a BSI record is read.
- S7 — Ching & Ward, *Building Construction Illustrated*, 5th ed., Wiley, ch. 5-6 (wall build-ups, structural grid) — **T3**, by edition; used only for the qualitative claim that a real partition is far thinner than 0.5 m.
- S8 — door clear-opening practice (ANSI/BHMA A156 series sizing; manufacturer clear-opening tables) — **T1/T3**, series named from standing practice, no table quoted; all door figures here are illustrative inputs already catalogued in `building-codes.md`.
- S10 — lift machine-room / stair dimensional practice (manufacturer type tables) — **T3**, not quoted numerically; the GT-14 sub-rectangles are illustrative placeholders.
- S12 — net-to-gross measurement conventions (BOMA-type practice) — **T3**; **no specific standard number asserted**.

Host-code evidence (all **FACT**, T5-equivalent as in-repo verification):
`src/blueprint-editor/domain/schema/walkable.ts:4` (three tile states only);
`src/engine/npc/rooms.ts:2,15,33` (4-connected flood-fill, doors excluded from rooms);
`src/engine/npc/pathfinding.ts:190-228` (octile costs, diagonal requires both orthogonal neighbours open **and** unoccupied).

## Weak or contested

- **Is 0.5 m "a real coordination module"?** No, and this is worth stating plainly rather than negotiating: the preferred ISO 2848 series is multiples of **3, 6, 12, 15, 30 and 60 basic modules** = 300/600/1200/1500/3000/6000 mm (T3, see Sources S1w), and 500 mm is in none of those. What *is* true is that the host grid is a **planning grid** of the type offices use (open-plan fit-out coordinates on 1500 mm and often 750 mm sub-grids), and 500 mm is a fine enough planning grid for that purpose while being far too coarse for component coordination. Confidence: High that 500 mm is not a 3M module; Medium on the office-grid analogy being the right framing.
- **Contested**: whether `ceil` should be the default policy at all. Pro-ceil: nothing functional is ever lost. Anti-ceil: it systematically inflates area (GT-17) and biases the design bigger than the brief. Resolution here is by dimension class, not by global default (see the policy table). Confidence in the split: High; confidence that this ordering matches any published convention: **UNCITED — heuristic**, Low.
- **Contested / demoted**: the wording for "tolerance zone" and "subordinate module" behind GT-07 and GT-21. The *principle* (allocate error to designated joints, keep components smaller than the module) is standard coordination practice and safe to rely on; **the ISO clause text has never been read and the German (S2) and British (S6) identifiers once cited for it were withdrawn as unverified, so both rules now carry a demoted class and no quoted or clause-level wording may be reproduced from them.** Confidence in the principle: Medium; in its standards attribution: Low.
- **UNCITED — heuristic**: the preference order of absorbers (wall → service band → tolerance strip → plate edge). This is engineering judgement, not a cited rule. Confidence: Low-Medium.
- **Replaced this pass**: the module-family enumeration. GT-03 and this section previously printed two different and mutually inconsistent preferred-series lists ("60/120/300/600/1200/2400/3000 mm" and "100/200/300/600/1200/2400/3600"); both were wrong and both now read 3/6/12/15/30/60 M. The LCM arithmetic (500 vs 300 → 1500 mm) never depended on either list and remains safe. Confidence: Medium — **the enumeration is from a T3 secondary source that agrees with the ISO record the audit opened; the standard's own table was not read, so if a future pass reaches the ISO body text and it differs, this line is the one to correct.**
- **UNCITED — heuristic**: the room-minimum thresholds in GT-11 (2-tile short side, 6 interior tiles) and the corridor module in GT-13. These are chosen so that derived rooms stay usable *on this grid*, given the flood-fill and wall-tax behaviour; they are not from a standard. Confidence: Low-Medium. GT-11's worked divided by a door run-room sizes were corrected this pass (2×3 tiles = 1.0 × 1.5 m, not 1.5 × 1.5 m); the thresholds themselves are unchanged.
- **UNCITED — placeholder**: the GT-14 core elements (5×5 machine room, 4×6 hall, 3×6 stair, 1×2 shaft) are illustrative, not manufacturer figures, and the 15 × 13-tile minimum is derived arithmetically from those placeholders (169 tiles of element area packed into 195). Swap the placeholders for real type-table data and the rectangle must be re-summed. The 1×2 shaft additionally contradicts `construction.md` CN-12's 3×3-tile minimum — unresolved cross-file conflict, see GT-14.
- **Deliberately avoided**: any code-derived number (egress widths, door clear widths, lift car minima) is quoted only as an illustrative input with the pointer to `building-codes.md`, so this file does not create a second, possibly wrong, authority for the same figure. Heights, slopes, sections, materials, structural capacities and fire ratings are out of scope: the grid cannot carry them (GT-19) and the skill must not pretend otherwise.

### Citation reconciliation (post-verification, authoritative for this file)

- **Closed**: the "to be verified" phrasing in GT-01 and GT-03 is resolved by S1/S1b/S1w. **ISO 2848:1984 is titled *Building construction — Modular coordination — Principles and rules*; the basic module M is 100 mm (the standard that names it is ISO 1006:1983); the preferred series is multiples of 3, 6, 12, 15, 30 and 60 basic modules.** Every rule that argues "500 mm is not a coordination module" rests on this plus plain arithmetic (500/300 = 1.667; LCM(500,300) = 1500 mm = 3 tiles) and not on any further standard text. **GT-01's evidence is now an explicit paraphrase: this project has never read ISO 2848's clause body, so no sentence in this file may be presented in quotation marks as the standard's wording, and ISO 2848's live-vs-withdrawn status is still unconfirmed.**
- **Withdrawn as evidence, and now stripped from the rule bodies**: S2 (DIN 4150-1 *Modulraster*) could not be shown to exist — every DIN 4150 hit is the building-*vibration* series — and S6 (BS 5606 *Guide to accuracy in building*) has no retrieved record. Where earlier drafts printed `S2`/`S6` on a Source line, the line now reads S1 only and says the identifier is withdrawn (GT-03, GT-07, GT-15, GT-16, GT-18, GT-21). **Classes were demoted accordingly, not just the prose: GT-07 and GT-21 `STANDARD` → `DESIGN PRINCIPLE`, GT-18 `STANDARD` → `ENGINEERING CONSTRAINT`, each marked as demoted in place.** S3 (NBS/NIST report) remains a pointer with **no** evidential weight at rule level. Confidence in the ISO 2848 title, year and 100 mm basic module: **High** (T1 record). Confidence in the preferred-series enumeration 3/6/12/15/30/60 M: **Medium** — T3 source, matching the ISO record the audit opened; the standard's own table was not read. Confidence that S3 supports anything specific: **None**.
- **Net effect on the file**: the arithmetic engine and the host-code facts stand unchanged; two `Class:` tiers dropped and one enumeration plus three worked figures were corrected (GT-03's series, GT-11's divided by a door run-room dimensions, GT-14's core rectangle). The standards layer supplies *framing* — "a grid is a coordination system, and error must be assigned to joints" — which is confirmed by S1's subject matter only, never by clause text.

## Type-specificity audit

How much of the translation survives, by building type. `Module` = the repeating unit the design
wants to express; `fit` = how well that module lands on the 0.5 m / 1.5 m systems.

| Type | Native real module | Tiles | Fit | Consequence on this grid |
| --- | --- | --- | --- | --- |
| Hotel | room plate 3.6×7.2 m; corridor 1.4-1.5 m clear | 7.2×14.4; 2.8-3.0 | **poor / good** | Room depth is the classic off-grid value: 7.2 tiles → 8 tiles (+400 mm) per room, ×2 per floor for the corridor. Adopt 3.0×7.5 m (6×15) and the whole floor becomes exact. Core 3.0 m stacks align. |
| Office (open plan) | 1.5 m planning grid, 7.5-9.0 m bays | 3; 15-18 | **excellent** | Best-translating type; the grid is effectively the industry's own planning grid. Deep floor + repeated bay lines all exact. |
| Hospital ward | bed module 3.0-3.6 m, clear corridor 2.4 m | 6-7.2; 4.8 | **mixed** | 3.0 m bed bay exact, 3.6 m off; corridor 2.4→5 tiles. Service band is unavoidable (GT-21) and gives the absorber room it needs. |
| Residential | 600 mm kitchen units, 900/1000 mm doors, 1.8 m bed | 1.2; 1.8-2.0; 3.6 | **poor** | Component-driven type: kitchens, wardrobes and bathroom pods all coordinate on 3M and never land on the tile. Expect a large `out_of_grid` register per flat. |
| School | classroom 6-7 m, corridor 2.1-2.4 m | 12-14; 4.2-4.8 | **fair** | Bay-sizable rooms translate well; corridor pinch (4.2→5) is the recurring cost. Assembly/sports halls want long spans — only whole-tile approximations exist. |
| Retail | 8.4-9.0 m bays, 3.0 m aisles | 16.8-18; 6 | **fair** | Aisle 3.0 m exact; the 8.4 m bay is the standard offender — specify 9.0 m or book 2 tiles of drift per 10 bays (GT-18). |
| Parking | 2.5×5.0 m bay, 6.0 m aisle, 5.4 m turning radius | 5×10; 12; 10.8 | **excellent** | Rounds up beautifully (2.5/5.0/6.0 are all multiples of 0.5); the 5.4 m radius → 11 tiles is the only adjustment. Ramp gradients cannot be expressed at all (no section). |
| Industrial / warehouse | 1.2×1.0 m pallet, 6-9 m grid, dock level 1.2 m | 2.4; 12-18 | **mixed** | Rack runs are 1.2 m = 2.4 tiles: the whole racking layout is off-grid at ~1 tile per 5 bays. Structural grid itself is exact. |
| Data centre / lab | 600/800 mm rack widths, tight clearances | 1.2/1.6 | **worst** | Sub-500 mm tolerances and 100 mm increments are the design language; here the grid cannot express the building (GT-10, GT-19) — report, do not draw. |

Read across: types whose *module* is 1500 mm or a multiple of it (office, parking, hotel-with-corrected-plate) translate without loss; types whose module is 100/200/300/600/800/1200 mm (residential, industrial fit-out, data centres, laboratories) are systematically off-grid, and for them the honest deliverable is the limitation register, not a plan that looks fine.
