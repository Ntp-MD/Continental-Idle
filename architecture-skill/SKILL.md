---
name: architecture-design
description: Operational reasoning framework for designing buildings on a discrete tile grid. Enforce programme → relationships → zoning → circulation → structure → services → environment → geometry → grid → validation → iteration. Use for any task that generates, reviews, repairs or compares architectural layouts (hotel, hospital, office, residential, retail, school, industrial, civic) in the Continental-Idle blueprint editor / engine.
---

# Architecture Design Skill

Version 2.0 — drafted as v1, traced through the §41 self-test (21-floor hotel) and the §42
20-question critique, then rebuilt against the **completed** evidence base: 23 domain files, 540 source
rules, 37 master rules and 11 recorded cross-source tensions in `architecture-skill/research/`. Every
section below names the file that carries its citations, and the closing section maps each section to
the master rules that license it. This file is the reasoning procedure; the research files are the
evidence.
Never restate a research file's content as if it were a fact here; reference it.

## Purpose

Turn a requirements statement into a coherent building on a discrete grid by executing a fixed
reasoning order, converting every dimension into physical tiles, validating the result at seven
scales, detecting failures, generating alternatives where objectives conflict, and iterating until
the design is internally consistent — then reporting what remains unverified.

The grid represents physical architecture. It is not a pixel canvas. A tile is a 0.5 m square of
floor that a person, a cart or a piece of equipment can occupy. If a geometry cannot be built,
operated, maintained or escaped, it is wrong no matter how the plan reads.

## Scope

**In scope:** site-level orientation and access decisions; programme and area allocation; adjacency
and zoning; horizontal and vertical circulation; structural logic expressed as plan geometry;
service/MEP logic expressed as shafts, zones and stacks; environmental logic as façade, depth and
aspect allocation; back-of-house and operations; lifecycle and adaptability; grid quantisation;
multi-level validation; alternatives and trade-off reporting; assumption management.

**Out of scope (state it, do not fake it):** structural calculation, fire-engineering design, code
compliance decisions, cost quantification without a cited source, energy simulation, acoustic
calculation, and anything the host model cannot represent — heights, sections, slab and beam
geometry, material build-ups, construction sequence, occupant behaviour simulation beyond A\*
movement and portal queues. Where such a thing decides the question, emit a
`REQUIRES … VERIFICATION` flag (`research/validation.md`, `research/uncertainty.md`).

**Applies to:** the Continental-Idle blueprint editor and NPC engine. Building types: residential,
hotel, hospital, office, retail, school, industrial, civic/public, mixed-use. Rules are
building-type marked; never transfer a residential finding to a hospital or hotel without evidence
(`research/synthesized-rules.md` type audit).

## Core Principles

1. **Programme before geometry.** No tile is placed before the programme table and the adjacency
   matrix exist (TH-01). A plan derived from a shape-first impulse cannot be validated.
2. **Order is load-bearing.** Reason in the fixed order (`## Design Workflow`). Reversing it is
   allowed only with a stated reason; the usual failure of reversing it is discovering (a typical shape, not a constant) that 40 % of
   the floor is corridor after the rooms are fixed.
3. **Every dimension is physical.** Each requirement resolves to metres, then to whole tiles — **in the
   safe direction**: a minimum rounds UP, a maximum rounds DOWN, and never to nearest. Rounding a
   required width down creates a plan that measures short while claiming to comply; rounding a
   permitted limit up (dead-end length, travel distance, slope) creates a plan that exceeds the limit
   while looking compliant. Both are the same error. The rounded value is the value you report, with
   the original beside it (CODE-27, `research/grid-translation.md`).
4. **Adjacency, access and separation are three different tests** (TH-04). Satisfying one does not
   satisfy the others.
5. **Routes are flow problems, not leftover space.** Size circulation from demand, then budget it
   and never let it overrun (TH-12, TH-15).
6. **The stack is one object.** Cores, shafts, wet cells, structural lines and modules align across
   floors; a floor designed independently is a defect (`research/multi-scale.md`).
7. **Codes are floors, not targets, and not laws.** A code number is a jurisdiction + edition +
   clause + verification requirement, never "compliant" (CODE-28, `research/building-codes.md`).
8. **Classify every claim.** FACT / STANDARD / CODE REQUIREMENT / DESIGN PRINCIPLE / HEURISTIC /
   BUILDING-TYPE CONVENTION / ENGINEERING CONSTRAINT / EXPERIENCE-BASED ADVICE — the eight categories the
   spec defines, exactly one per rule, with source tier and confidence. Never mix classes in one
   sentence, and never let a parenthetical qualifier turn a field into two labels.
9. **The first design is a hypothesis.** Generate → evaluate → find failures → prioritise → modify →
   re-evaluate (`## Iteration`).
10. **Expose trade-offs.** When objectives conflict, produce labelled alternatives rather than a
   silent compromise (`## Design Alternatives`).
11. **Efficiency is not the objective.** Maximising net-to-gross can destroy daylight, capacity,
   wayfinding, operability and resilience; report the metric, do not worship it
   (`research/economics.md`).
12. **Never fabricate precision.** Unknowns stay visible; assumption registers are mandatory output.

## Evidence Rules

- Use the tier hierarchy: **T1** government / official codes / standards bodies / buildingSMART →
  **T2** peer-reviewed, universities, professional institutions → **T3** established architecture
  and engineering publications, architect project documentation → **T4** professional forums →
  **T5** Reddit and anecdote.
- Convert a Tier-4/5 claim into a HEURISTIC with Confidence Low, or do not convert it. Never
  silently launder a weak source into a rule.
- A rule enters this skill only as `Evidence → Principle → Rule → Agent behavior`
  (`research/synthesized-rules.md`). If you cannot name the evidence, mark `UNCITED — heuristic`.
- Conflicting sources: identify the conflict, determine jurisdiction and context, prefer the
  higher tier, preserve the uncertainty. Record both readings.
- For anything code-derived, state jurisdiction + edition/year + clause (or `section: UNKNOWN
  (verify)`) + limitation. Then choose the conservative default and say that you did.
- Important claims get the record format: Principle / Source / Source Type / Evidence Strength /
  Applicability / Limitations / Trade-offs / Agent Action.
- Research is an input, not a licence: if a decision depends on data you do not have, either
  retrieve it or flag it. "Flag for verification" is a legitimate, complete answer; an invented
  number is not.
- **A caveat lives inside the rule it qualifies.** If a figure is unverified, the `Confidence` line and
  the rule text must both say so; relegating the retraction to a later "weak or contested" section
  while the headline asserts the number is the corpus's most common failure mode, because the next
  reader copies the headline and never reaches the disclaimer (`audit/README.md` §1 and §19).
- **Convergence counts measure sources you opened, not files that repeat a claim.** Three rules citing
  one T3 mirror, or five websites copying one study, is one origin. State the origin, then say how many
  origins — not how many citations — support it (UN-10, `audit/README.md` §7 and §17).

## Design Workflow

Execute in order. Each step has an exit product; a step may not start without the previous step's
product. Never jump from requirements to coordinates.

| # | Step | Exit product |
|---|---|---|
| 1 | Understand requirements | Restated brief: building type(s), users, activities, counts, quality goals, hard constraints |
| 2 | Identify missing information | Gap list classified by `Known / Assumed / Estimated / Unknown / Requires …` |
| 3 | Research missing information | Evidence records (tiered) or explicit `UNCITED`/flag entries |
| 4 | Analyse site/context | Factor → consequence map: boundary, access, neighbours, roads, transit, views, noise, climate, orientation, density |
| 5 | Identify building type | Type + hybrid-type register; select that type's rule set and its divergences |
| 6 | Define programme | Programme table: per space type — users, activity, capacity, net area, fixtures, services, environment need, relationships |
| 7 | Estimate capacity | Occupant load per space + per floor, with basis (programme-derived or code-derived-with-source) |
| 8 | Establish adjacency graph | Graded adjacency matrix (A/E/I/O/U or 0-4) + bubble diagram + must-touch/must-not-touch conflict list |
| 9 | Establish zoning | Public / semi-public / private / service bands per floor, + vertical zoning (stacking plan) |
| 10 | Design circulation | Route hierarchy with widths in tiles, capacity check, desire-line test, decision-point count |
| 11 | Design vertical circulation | Core plan: lift/stair portal positions, counts sized to peak demand, queue targets, stop coverage per floor |
| 12 | Establish structural strategy | Bay grid in tiles, which walls are load-bearing proxies, span table, lateral core location |
| 13 | Establish MEP/service strategy | Shaft stack, service band widths, wet-cell stack, plant locations, maintenance access tiles |
| 14 | Establish environmental strategy | Façade allocation per aspect, room depth vs daylight rule, ventilation path, acoustic buffers |
| 15 | Develop floor-plan alternatives | ≥1 option (≥3 when objectives conflict) documented per `## Design Alternatives` |
| 16 | Translate to physical dimensions | Metres per element, with source or class label |
| 17 | Convert to grid/tile geometry | Tile coordinates per floor, rounding report, remainder absorbed into wall/service/tolerance bands |
| 18 | Validate | Per-check records at 7 scales × 11 categories, verdict + severity |
| 19 | Detect failures | Failure list with cause + detection evidence |
| 20 | Compare alternatives | Same-metric comparison table; no universal winner |
| 21 | Iterate | Modification log preserving satisfied constraints, cascade check |
| 22 | Validate the entire building | Cross-floor consistency + whole-building egress/stack/programme totals |
| 23 | Report assumptions and unresolved issues | Assumption register + flag register + limitations statement |

Steps 6-14 are the design; steps 15-23 are the checking of the design. A report that contains 17
and 18 but skipped 8-14 is invalid output, not a shortcut.

**Design algorithm order (do not reverse without a stated reason):**

```
Requirements → Constraints → Program → Relationships → Zoning → Circulation → Core
→ Structure → Services → Environment → Geometry → Grid → Validation
```

**One step, one emitted artifact.** A step may not be merged into, summarised inside, or implied by
another step's output. "Zoning is obvious from the plan" is a skipped step, which makes the plan
unvalidatable.

### Pre-geometry feasibility gate (run before the first tile)

Place nothing until all nine arithmetic answers exist; a failure here is a programme, site or
massing problem, and drawing a floor to hide it is the single most common agent failure.

1. **Envelope fit:** available tiles = `grid_W × grid_H × floors`, minus the BOH/plant/service share
   and the circulation budget. Does the programme's required net area (plus wall tax) fit? Report
   `programme m² / available m²` and the implied share of every category. The point at which this
   ratio means "infeasible" is **type- and project-specific**, taken from `economics.md` /
   `space-programming.md` for the type in play — there is no universal figure, and if the type's
   evidence is missing, state the threshold you used as an assumption with its confidence. If the
   ratio says the programme cannot fit, the site, floor count or programme is wrong; say so before
   drawing rather than discovering it in a plan that over-promises.
2. **Occupant load and egress budget:** per-floor load with basis, required exit count and total
   egress width in tiles, against the planned core. (Sourced values or flags, `CODE-01…CODE-08`.)
3. **Vertical demand:** peak-period movement (arrivals/departures waves, shift change, meal peaks) →
   required portal throughput → lift/stair count and lobby area in tiles. The host has **no time
   dimension**, so the arrival profile and trip rates are inputs the agent declares — name them in the
   report and test the conclusion's sensitivity to them (`human-behavior.md` HB-26). If the core cannot
   move the peak, the floor count or plate size is wrong, not the decoration.
4. **Must-touch embeddability:** the must-touch graph's required node degrees vs what a room can
   physically touch on a 0.5 m grid. This is a mathematical limit, not a preference: the contact graph of
   rectangular rooms sharing non-zero boundary lengths is **planar**, so five mutually-adjacent rooms
   **cannot exist** and a four-clique needs a non-rectangular room or a shared hub. Report the obstruction
   and convert it into hub contacts — a corridor, lobby or servery node exists precisely to satisfy
   unsatisfiable adjacency (`adjacency-graphs.md` AG-03…AG-05). Conflicting must/must-not pairs resolve
   by one of the four levers, cheapest lever recorded (TH-05).
5. **Module register:** every repeated space type fixed to a whole-tile footprint before the plate is
   drawn (TH-23), with the bay multiple it sits on.
6. **Daylight envelope:** maximum plan depth in tiles from a façade vs the room types that need light;
   if the required plate is deeper than the daylight rule allows, the massing (not the room layout)
   is the thing to change.
7. **Service stacks:** wet cells, shaft positions and drain-slope budget exist as a stack plan before
   the room layout does.
8. **Structural plausibility:** the chosen system's bay range and the longest span the plate demands,
   both in whole tiles, plus whether the bearing lines the plan will need can run continuously to the
   ground. A plate that requires, say, a 12 m clear span over an unsupportable core position is a massing
   problem to fix now, not a detail to hide in a section the model cannot draw. Spans beyond the
   system's evidenced range are a flag (`REQUIRES ENGINEERING VERIFICATION`), not an assertion.
9. **Control grid published:** one coordinate set all floors inherit — datum/origin, bay pitch in tiles,
   core rectangle, shaft rectangles, repeated-module rectangle. Every later floor must be checkable
   against it, and a floor that cannot be is a deviation to register (`multi-scale.md` MS-01, SR-15).

### Generation ladder (zoning → tiles)

Do not pack rooms into a blank grid. Derive the plan in this order, each step in whole tiles:

```
1 site envelope + cardinal assignment      → buildable rectangle, façade edges, access points
2 structural bay grid                      → bay multiples across the plate
3 core + vertical portals (fixed coords)   → lifts, stairs, shafts, refuge; same coords every floor
4 circulation spine + branch routes        → route hierarchy widths, decision points, service route
5 block subdivision                        → the slabs/bays between core, spine and façade
6 room packing from the module register    → whole-tile footprints into blocks, party walls shared
7 service bands + plant + BOH catchments   → blocked/walkable tiles with tags, not invisible
8 openings, tags, fixture tags              → door runs, room typing, access-control tags
9 validation + failure scan                → see ## Validation
```

Reordering 4 before 5-6 is legitimate (route-led plans); reordering 6 before 3-5 is not: it is how
unescapable floors, offset stacks and misaligned bays get produced.

## Requirement Analysis

Produce before anything else:

- **Users and activities**, not room names. For each user group (guest, patient, staff, visitor,
  resident, customer, delivery, service) list the activities, the duration of stay per activity, and
  who may see whom.
- **Counts**: units/beds/desks/checkout lanes/seats/class sizes — the number that drives everything.
- **Quality objectives** in ranked order, stated as testable claims ("every patient room has
  façade access" is testable; "feels calm" is not).
- **Hard constraints**: site grid extent, floor count, budget/area ceilings, programme mandates,
  jurisdiction for code questions.
- **Non-negotiables vs preferences** — these decide the priority model later.
- **Gap list**: everything absent from the brief, classified. Missing information is decided
  (documented as an assumption with a conservative default) only when it is reversible and local;
  it is escalated when it touches life safety, structural feasibility, jurisdiction, or the client's
  revenue model.
- Building-type identification: type determines the operational model, so resolve it early; for
  hybrids, list the types and where each dominates (`research/space-programming.md`,
  `research/operations-maintenance.md`).

## Site & Context

Reason from site to plan, never the reverse. See `research/site-context.md`.

Factors: boundary and build envelope, setbacks, neighbouring buildings and privacy distances, roads
and noise sources, pedestrian and vehicle access, transit proximity, topography, views, climate and
orientation, surrounding density, existing structures to retain.

Consequences to decide explicitly: building orientation (which façade gets which programme),
massing/footprint versus height, entrance positions (public, private, service, emergency),
circulation entry points, zoning bands (noisy-edge → buffer, quiet-edge → private), open-space
allocation, and floor-plan organisation (single vs double aspect, slab vs tower, podium vs
crank).

On this grid, the site is the floor-grid extent and the cardinal assignment. Record: grid dimensions
in tiles, metres, north direction, which edges are façade, which edge faces the access road, which
edge faces the noise source, and the setback budget in tiles. Every orientation claim downstream
("daylit south façade") must name the grid edge it refers to; an unassigned cardinal direction
invalidates every environmental rule.

## Building Programming

See `research/space-programming.md`, `research/human-scale.md`, `research/economics.md`.

1. One row per space type: users, activity, capacity, required net area, fixture list, service
   needs (water/waste/exhaust/electrical), environmental need (daylight/quiet/dark/clean/dirty),
   required relationships.
2. Convert areas to tiles: `tiles = m² × 4`. Enclosure tax: a `W×H` outer footprint yields
   `(W-2)(H-2)` usable tiles; at floor level compute wall share from actual blocked-tile counts, not
   per-room (TH-02).
3. Build the area budget top-down: gross floor area → net → programme → circulation → structure →
   services → mechanical. Every percentage you use is classified general / building-type specific /
   project specific / approximate heuristic, with the type it came from. No universal ratio exists;
   do not import one.
4. Support space is programme, not leftover: housekeeping pantries, linen, waste, storage, staff
   toilets/lockers/canteen, plant, electrical/riser space. Programme BOH first as a bounded share
   with a catchment (PP-02, PP-03).
5. Every programme row must end up as rooms on a floor, or be explicitly dropped with a reason.
   Every room tile-set must carry a fixture tag from the host vocabulary — an untagged room is typed
   as hallway, so it silently stops existing as a room and starts counting as circulation (see
   `## Grid / Tile Translation`, host fact 2).
6. Report totals: programme m², drawn m², ratio, and per-category breakdown, plus net-to-gross and
   circulation share with the measurement convention named (BOMA/RICS/IPMS-style differences;
   jurisdiction stated).

## Adjacency & Zoning

See `research/adjacency-graphs.md`.

- Grade every relationship (must-touch / should-be-close within N tiles / may-share-corridor /
  avoid / must-not-touch) and satisfy the top grade before anything else (TH-03).
- Zone each floor into public / semi-public / private / service bands, and place rooms by band before
  drawing walls (TH-06). Keep the service route off the public route (TH-08).
- Build the graph from the plan at validation time: nodes = rooms/corridors/outside/floors, edges =
  door connections, weight = traversal cost, plus a separate edge class for vertical portals.
  Check: degree, reachability, cut vertices (single-point-of-failure rooms), bridges, cycles vs
  tree, integration ranking, depth from entry, and door count between arrival and the deepest room
  (the threshold sequence, TH-07).
- Conflicts between must-touch and must-not-touch pairs are inputs, not errors. Resolve with the
  four levers, cheapest first: relocate, re-order the sequence, insert a buffer, or split across
  floors/zones — then record which lever you paid for (TH-05).
- Detect infeasible matrices early: a must-touch graph whose required node degree exceeds what the
  grid can embed (a room touching more distinct rooms than its perimeter allows), or a
  non-planar room-adjacency demand, is a signal to relax a relationship or add a circulation node —
  report it, do not silently break a requirement.
- Vertical relationships are adjacency too: what sits above/below what (noise, wet cells, smell,
  load, privacy) is decided on the stacking plan, not per floor.

## Circulation

See `research/human-behavior.md`, `research/professional-practice.md`, `research/building-codes.md`.

Four circulation systems must each be answerable: **pedestrian** (who, how many, when), **service**
(clean/soiled, staff, deliveries, waste), **emergency/egress** (two ways, remote from each other,
within distance limits), **vertical** (portals, counts, queues).

Rules that bind on this grid:

- Size routes from flow, not habit; a 1-tile corridor is strict single file — plan 2 tiles to pass,
  3+ to queue (PP-11, CODE-05, CODE-27). Effective width loses to every protrusion and every open
  door leaf (PP-10, PP-14).
- Fewer, wider routes beat many narrow ones; open halls are up to ~1.41× cheaper corner-to-corner
  than single-file corridors under octile A\* (TH-11, TH-02 derivation).
- Budget movement share per floor and never let it overrun (TH-15). Excess circulation is a failure,
  as is a route that doubles back (desire-line test: detour > ~20-30 % and people leave the path,
  PP-13).
- Provide turning and standing space where routes change direction (TH-13); bends are a throughput
  tax (PP-12).
- Wayfinding is a decision-point count, not a signage budget (PP-21). Design decision points to be
  legible; integrate the public rooms to the most reachable end (TH-19, TH-20).
- Dead ends: bounded, with the limit sourced (CODE-06). Exit remoteness, common path, and travel
  distance are checked against sourced values per jurisdiction, or flagged.
- Separate public and service movement when operational traffic is significant; the test is measured
  conflict crossings, not aesthetics (PP-01, TH-08). Count clean/dirty crossings before counting
  squares.
- Vertical: lifts/elevators and stairs — size the core against peak demand — arrivals/departures waves,
  meal peaks, shift changes, patient/guest transfer — and treat lift queues as the model of vertical
  congestion (TH-29, `research/multi-scale.md`). Never let a floor be reachable by one portal with no
  alternative.

## Human Scale

See `research/human-scale.md` (furniture/clearance register is authoritative there).

Chain: Human → Furniture → Room → Corridor → Building. The design is checked against the body, not
against the drawing.

- Design clearances for the large user, reaches for the small user (TH-21). Percentile basis must be
  named when a figure is percentile-dependent.
- Minimum dimensions per room type are published; respect them, then bound proportions so a room is
  usable rather than merely large enough (TH-24, TH-25).
- Every real clearance **rounds up** to whole tiles; a 1.1 m requirement is 3 tiles (1.5 m), and the
  report states both. Never present a rounded-down value as adequate.
- Furniture fit is not optional: a tagged room must fit its fixture footprints plus working
  clearances plus circulation to each fixture. Beds need bedside circulation; desks need chair
  recoil and rear pass; sanware needs approach; kitchen and lab aisles need two-person passing;
  hospital rooms need equipment and gurney envelopes; service corridors need trolley widths;
  wheelchair turning needs its circle in tiles.
- Door reserve space lands on both sides of every opening; two reservations must never overlap
  (PP-14).
- Accessibility is a continuous route requirement, and route erosion at small fixtures is where it
  actually fails (PP-22, CODE-18/19/21). Count it from site arrival inward, not from door to door.

## Environmental Design

See `research/environmental-design.md`. Treat as spatial planning, not decoration.

Chain: Climate → Orientation → Envelope → Openings → Room placement → Circulation → Mechanical
systems.

- Cap single-aspect depth by the daylight rule and measure depth in tiles from the façade (TH-26);
  give long-occupancy rooms light from two sides where the plan can afford it (TH-27). Windowless
  occupied rooms are a finding, not a detail.
- Façade allocation is a budget: which aspect gets which programme (living/clinical/work vs
  circulation/service/storage/buffer), where glazing ratio costs heat gain and façade budget, where
  self-shading and overhangs follow from the section you cannot draw — so state the assumption.
- Ventilation needs a path: opposite-façade openings across a plan depth you have bounded, stacks
  served, and the circulation that carries the air. Mechanical rooms follow from the failure of the
  passive route, in that order.
- Acoustics is plan geometry: source-receiver distance, buffer rooms, one continuous party wall, and
  mass (PP-16). Quiet-neighbour and service-noise adjacency are decided in the matrix, not in
  finishes.
- Report the environmental verdict as: which rooms meet daylight/ventilation/quiet criteria, which
  cannot on this geometry, and what that implies for the mechanical system you are now obliged to
  size.
- Two explicit prohibitions from the evidence, because they are the easy temptations on a 2D grid:
  **never justify a plan move with thermal mass** (the model has no section and cannot carry the claim —
  `environmental-design.md` EN-15), and **no environmental rule may be scored on an undeclared input**
  (climate, azimuth, glazing head, occupancy hours — EN-26). Size openable area from room floor area and
  check it as a whole-floor budget (EN-19); treat the perimeter band and the interior band as different
  HVAC zones with different equipment (EN-25).

## Structural Reasoning

See `research/construction.md`. The model has no columns, beams or slabs, so structure is inferred
and must be made plausible rather than ignored.

- One structural grid, defined once, in whole tiles: bay sizes chosen from published span ranges for
  a named system (RC flat slab / ribbed / post-tensioned / steel frame / composite / CLT /
  load-bearing masonry). Room widths become multiples of the module; the report shows bay → tile
  table.
- Load-bearing lines must be continuous down the building. A blocked-tile wall run that carries
  anything must land on the same line on every floor below; transferring a load requires a stated
  transfer strategy and an engineering flag.
- Spans: distance between bearing lines is a span. Report max span in tiles and metres per floor and
  flag spans beyond the chosen system's plausible range; long spans buy flexibility and cost depth,
  which the model cannot show — say so.
- Cores carry lateral stability: position the core once (with egress and vertical circulation) and
  keep it; do not move a stair or lift core between floors (see `## Grid / Tile Translation` and
  `research/multi-scale.md`).
- Structure constrains programme: no room is cut by a column line that its layout cannot absorb;
  corridors and service bands are where structure is cheapest to hide; façade module rhythm follows
  the bay.
- Repetition is a design value: standard bays, repeated formwork, kit-of-parts room types (TH-23).
  Non-standard geometry is paid for in setting-out and perimeter, not in the drawings (PP-24).
- Anything beyond plausibility (member sizes, deflection, seismic, foundations) is `REQUIRES
  ENGINEERING VERIFICATION` — never asserted.

## MEP / Services

See `research/construction.md`, `research/professional-practice.md`.

- One service spine strategy: wet stack, risers, duct/wire routes, all stacked. Fix the stack before
  the plan: wet cells on one wall, within one shaft, inside a slope budget for gravity drains
  (PP-17).
- Reserve a services band along the corridor wall and do not sell the width or the height it eats
  (PP-18). On the grid this is blocked/walkable tiles with a tag, not invisible.
- Plant rooms need: location (noise and vibration away from sensitive rooms), access width for
  removal, ventilation, drainage, and maintenance clearance. Every large thing must be replaceable
  and verifiable — removal path, access tile, test point (PP-19).
- Clean vs dirty routing (waste, linen, food, sterile, laundry) is a programme decision with its own
  corridor; crossings are counted (PP-01).
- Fire/egress services interact with the plan: shaft enclosure and pressurisation strategy,
  sprinkler coverage assumptions (a sprinkler credit that you have not shown coverage for is invalid
  — CODE-07/CODE-25), standpipe and hydrant reach, smoke-control zoning as compartments in plan
  (CODE-15).
- Where duct sizes, pipe diameters, or flows would decide the question, flag it
  (`REQUIRES ENGINEERING VERIFICATION`) and design to a conservative spatial default.

## Operations & Maintenance

See `research/operations-maintenance.md`. Architecture must support how the building actually runs.

Test the day in the building: guest/patient/customer/staff/visitor/delivery/waste routes; cleaning frequencies and cart routes; soiled vs clean separation; deliveries and loading with queuing;
housekeeping catchment (a bounded pantry serving N rooms, not a shared floor resource, PP-03); waste
streams with their own room and own way out (PP-05); staff day — arrival, lockers, canteen, toilets,
breaks, and where staff mix with the public (PP-06); equipment replacement and filter/valve/cleanout
access; security sightlines and controlled-access zones; service lift priority and out-of-hours
mode; storage per floor and per function.

BOH share is a bounded programme percentage with a source or a flag, never the residue after the
nice rooms (PP-02) — and the audit found no authoritative source for the share itself (two competing low-tier figures, 15-25 % and up to 20 %),
so it is an operator input to be asked for or assumed in the open, never a value to be looked up here. Freeze the operational programme before the geometry, because late operational
change is the expensive kind (PP-23).

Then run the maintenance checklist: what must be reachable, removable, isolatable, testable, and
drained — each mapped to a grid proxy (access tile, door width in tiles, route width, removal path
through a portal).

## Building Lifecycle

See `research/lifecycle.md`.

- Separate what changes often from what must not (TH-28). Decide and record which decisions are
  reversible on a tile grid: tag and fixture change (cheap), room-boundary change (medium, if
  services allow), core/shaft/façade/grid change (expensive or impossible).
- Design for function change: room geometries that survive retagging need minimum widths, service
  proximity, and façade access for alternative uses. Report the conversion risk (e.g. office→residential
  blocked by plan depth, plumbing distance, window-to-floor ratio, absence of private balconies and
  BOH).
- Provide expansion/phasing capacity: spare tiles, a repeatable module, a core that can absorb extra
  floors, a route that extends without re-cutting the plan.
- Durability and maintainability are cost arguments: finishes and wear are off-model, but access
  geometry, replacement paths and cleanability of the route network are on-model.
- Renovation, adaptation and reuse arguments must state their evidence: policy or study with tier, or
  clearly marked heuristic. Never claim a lifecycle carbon benefit without a source.
- Each lifecycle claim goes in the assumption register with confidence and consequence.
- Publish the **service-life record**: element class → expected life → replacement access → removal
  path, and the one hard geometric rule that follows from it: never trap a short-life element behind a
  long-life one (`lifecycle.md` LC-01, LC-02, LC-14; `operations-maintenance.md` OM-08, OM-14). Buy
  flexibility only where it compounds — the vertical line, the plate depth, the façade band — and refuse
  flexibility whose cost is certain and whose benefit is speculative (LC-09, LC-23).

## Grid / Tile Translation

The grid is physical. See `research/grid-translation.md` (conversion table and rounding policy are
authoritative there).

Host model:
```
1 tile = 0.5 m × 0.5 m   (0.25 m²; 4 tiles = 1 m²; 2 tiles = 1.0 m; 6 tiles = 3.0 m)
Tile states: walkable | blocked | door          (nothing else)
Wall = one blocked tile (0.5 m thick — over-thick vs real partitions; the tax is real)
Room = flood-fill of walkable tiles, typed by fixture tags; W×H outer → (W-2)(H-2) usable
Door = run of door tiles (2 tiles ≈ 1.0 m clear)
Movement = A* octile; diagonals only when both corner neighbours are open
Vertical = lift/stair portal tiles with queues; access gated by tags (public/guest/staff/service)
No section, no heights, no slab/column/material objects
```

Verified against the host schema: `TileState = 'walkable' | 'blocked' | 'door'`, and door tiles are
walkable (`src/blueprint-editor/domain/schema/walkable.ts:4,43`). The **metre** scale is a project
convention, not engine data: the engine stores tiles and pixels, never metres. Any `m` figure in a
report is the skill's conversion, and the agent must not imply the model enforces it.

### Host facts verified in code (they override any assumption in this file)

1. **Rooms are flood-fill, and door cells belong to no room**
   (`src/engine/npc/rooms.ts:2,15,33`). Two consequences, and the second is narrower than it first
   looks. (a) **A door line splits a region only when it forms a cut set across that region's width.**
   Executed against the real algorithm: one door tile in a 1-tile corridor yields 2 rooms; a column of
   door tiles across an open field yields 2 rooms; but 1 or 2 isolated door tiles in the middle of a
   9×9 open field still yield **1** room, because you walk around them. So the rule is *test the derived
   room count*, never *assume a door divides*. (b) Door tiles are neither structure nor occupancy in any
   case: count them as circulation (`occupied = derived-room tiles, circulation = walkable-with-no-room
   ∪ door tiles, structure = blocked tiles`, and the three must sum to the grid). Lumping doors with
   walls overstates structure; lumping them with rooms overstates occupancy.
2. **Type comes from the fixture-tag set, lowest `priority` wins, and an unrecognised room silently
   becomes a hallway** (`src/blueprint-editor/domain/schema/rooms.ts:9-33`, `resolveRoomType`). An
   untagged room is therefore not merely "unvalidatable", it is *absorbed into corridor* — the plan
   loses the room and the circulation share inflates, which is why the two errors are reported
   together.
3. **The vocabulary is 15 tags + hall**, hospitality/office weighted: `living, hygiene, wellness,
   pool, cooking, dining, bar, fitness, lounge, laundry, meeting, retail, back-of-house, storage,
   front-desk`. Consequences: (a) the discriminating tag decides the room — a lounge with a
   `living`-tagged sofa types as *Guest Bedroom*, and a spa that also carries `hygiene` types as
   *Bathroom*; place tags deliberately, one signal per room where possible; (b) clinical,
   industrial, civic and education programmes have **no matching tag** and will collapse to hall or
   lounge — that is a host limitation to report (or a schema-extension decision to escalate), never
   something to hide by tagging a ward `lounge`; (c) because the lowest priority wins, a nested room is
   invisible to type checking — an en-suite (`hygiene`) inside a bedroom (`living`) types as the
   bedroom — so verify subdivided spaces by fixture area, never by room type alone. (verified by executing `resolveRoomType`); (d) **the priority ladder itself is the trap** - executed results: bed+en-suite -> `bedroom`, spa+sink -> `bathroom`, dining+hygiene -> `bathroom`, front-desk+living -> `bedroom`. Because `living`(10) and `hygiene`(20) outrank cooking/dining/retail/meeting (40) and front-desk (50), **any hygiene-tagged fixture (a hand-wash sink) silently retypes a kitchen, bar or restaurant as a bathroom, and any `living`-tagged seat retypes a lobby or lounge as a bedroom.** Place the discriminating fixture last and check the derived type per room, never the intended one
4. **Room privacy is binary** (`open | private`, same file) — there is no semi-public band in the
   schema, so privacy gradients and zoning must be carried by access tags on roles, not by room
   privacy.
5. **Movement is octile A\* (`pathfinding.ts:190-228`): cardinal cost 1, diagonal `√2`, and a
   diagonal step needs both orthogonal neighbours walkable *and* not occupied by another agent.**
   Congestion is therefore dynamic: agents re-path around bodies, so a 2-tile corridor in a
   high-flow zone does not merely feel tight, it produces measurable detours and blocked
   diagonals. Vertical movement is a **`portal`-tagged object with interaction spots and a queue**
   (`layoutBuild.ts:9,290-310`, `queueBuild.ts`, default `queuePatienceSeconds: 30` in
   `config.ts:15`) — portals are objects, not tile states, and lift waiting is the model's only
   expression of vertical capacity.
6. **Walkability is resolved per NPC role from tags** (`useNpcSimulationCore.ts:186`,
   `buildRoleWalkableMap`), so "staff-only corridor" is real only if the tags say so.
7. **The floor list has no vertical dimension at all**: `FloorData` carries `id, name, label, objects,
   defaultWalkable, walkable, spawnZones, allowedRoleIds` and nothing else, and `FloorLayoutData` is a
   flat `floors[]` array — no elevation, height, storey index or section anywhere in the domain schema
   (`src/blueprint-editor/domain/schema/layout.ts`). Every "heights are not representable" verdict in
   this skill is therefore a verified host fact, not an assumption.
8. **The layout does model the street**: `streetWidthTiles` and `streetFloorId` exist on
   `FloorLayoutData`. Frontage, setback-to-edge and arrival-from-street decisions should be expressed
   through those fields rather than invented, so a site record that names a "street edge" must bind it
   to `streetFloorId` (`site-context.md`).

Procedure:
1. Choose the module. 0.5 m is a modular-coordination module; design to it, not around it. Structural
   bays, room widths, corridor widths and core sizes become whole-tile multiples.
2. Convert metres → tiles **in the safe direction** — `tiles = ceil(m / 0.5)` for a minimum,
   `tiles = floor(m / 0.5)` for a maximum — and report `real requirement → tiles → resulting metres`.
   Accumulated rounding is absorbed into walls, service bands, tolerance zones or the non-room band —
   never into a room's usable area, and never left as a 1-tile sliver room. The absorber order is fixed
   (wall/structure zone → service band → declared tolerance strip on one datum-adjacent line per floor →
   plate/façade edge, and the last one must be reported because it moves net-to-gross); anchor every
   module absolutely rather than accumulating rounded steps, and never express a required clear
   dimension below one tile — under 0.5 m the design is unbuildable here (`grid-translation.md` GT-07,
   GT-10, GT-18).
3. Check quantisation error: per-room area error, per-dimension error, and cumulative error across
   N repeated modules; state where the design is no longer physically expressible.
4. Keep the grid honest across floors: same origin, same bay lines, same portal coordinates, same
   façade module. A module that shifts by one tile per floor is a construction and wayfinding error.
5. Disambiguate `blocked`: it stands for exterior wall, party wall, structure, shaft, service zone or
   furniture block-out. Use tags in the report; never let a blocked tile be silently interpreted as
   "wall" in one check and "shaft" in another.
6. Anything the grid cannot express (heights, thickness variety, tolerances, door leaf swing,
   finishes, slopes, risers, real daylight angles) is listed as a limitation and, where it decides
   safety or feasibility, as a flag.

### Carried constants (so the skill is executable without opening a research file)

Values below are the working defaults on this grid. Each is a floor or a heuristic, **not** a
compliance claim; the derivation, jurisdiction and confidence live in the named research file, and
where a value is jurisdiction-dependent the check is `REQUIRES CODE VERIFICATION` even if the default
was used.

| What | Tiles | Metres | Class | Where the evidence lives |
|---|---|---|---|---|
| Minimum room interior (else it is all wall) | 1×1 usable → 3×3 outer | 0.5 m → 1.5 m | arithmetic | `architecture-theory.md` TH-02 |
| Room proportion ceiling (interior ratio) | ≤3 sleeping / ≤2.5 living / ≤3.5 office-classroom / ≤4 circulation | — | DESIGN PRINCIPLE (working bands partly heuristic) | TH-25 |
| Corridor: single file / passing / queuing | 1 / 2 / 3 | 0.5 / 1.0 / 1.5 | HEURISTIC + code floor for widths | `building-codes.md` CODE-05/27, `professional-practice.md` PP-10/11 |
| Clear door opening (2 tiles) | 2 | 1.0 | CODE-conditional | `building-codes.md` CODE-10/19 |
| Accessible route | 2 (3 where crowds/protrusions) | 1.0 (1.5) | CODE-conditional | `building-codes.md` CODE-18, `human-scale.md` |
| Sidelit depth, single aspect (code-anchored) | ≤ ~4 from the glass line per 2.1 m head height | ~1.0 × head of fenestration | STANDARD (EN 17037 lux targets; ASHRAE-style daylight zone) | TH-26 — note: the popular 1.5×/2.5× floor-height multipliers are `UNCITED — heuristic`, Confidence Low |
| Guest/ward/classroom module | derive from the type's fixture envelope + clearance register; **no global code minimum exists** | — | BUILDING-TYPE CONVENTION | `space-programming.md`, `human-scale.md`, TH-24 |
| Structural bay | resolve the range for the chosen system in `construction.md` (CN span table) before use; bays are whole-tile multiples | typically multiples of 0.5 m | ENGINEERING CONSTRAINT (range is system- and jurisdiction-specific; CN's own span bands are flagged `UNCITED — heuristic`) | `construction.md`, `grid-translation.md` GT-15 |
| Standing density: capacity / comfortable standing / walking | 1-2 / ~5 / 9-15 tiles per person | 0.25-0.5 / ~1.2 / 2.3-3.8 m² | FACT against published walkway and queue bands (HCM/FHWA LOS bands, IMO queue density) — **the 1-2 tile figure is the packed end, not a comfort default** | `human-behavior.md` HB-01, HB-20 |
| Coordination cell where two module families must agree | 3 tiles | 1.5 m = LCM of the 100 mm basic module and the 300 mm coordinating module | FACT | `grid-translation.md` GT-03 (ISO 1006 / ISO 2848) |
| Service band along a corridor wall | 1-2 | 0.5-1.0 | ENGINEERING CONSTRAINT | `professional-practice.md` PP-18, `construction.md` |
| Wall tax per room (W×H outer) | `2W+2H-4` blocked | — | arithmetic | TH-02 |

Anything in this table that a project's jurisdiction, system or type can override must be re-derived
from the named file at use time; the row is a starting default, never a compliance statement.

### Prototype floor and deviation register (multi-floor discipline)

On a tower, design **one** typical floor completely, then derive the stack from it: a repeated module
plus an explicit list of exception floors (arrival/lobby, podium, amenity, plant, top floor, BOH
floors, egress-discharge floors). Publish:
```
typical-floor id | module repeat count | floors using it | every deviation (what changed, why,
which consistency check it breaks, how stacks/portals/bays are re-joined)
```
A floor that is not the prototype and not in the deviation register does not exist — that is how
stack drift and orphan shafts appear. Deviation cost is reported in tiles and in construction
repetition lost (`economics.md`, PP-24).

## Building-Type Rules

Never one universal model. Type-specific registers live in each research file's type audit;
`research/synthesized-rules.md` collects the divergences. Load the type's set before programming,
and re-load it on every floor.

| Type | Dominant logic | What changes vs the generic rule set |
|---|---|---|
| Residential | Unit as module; privacy gradient; aspect for living rooms | Repetition of the unit type; shared vs private thresholds; storage; balcony/aspect demands; service at building scale |
| Hotel | Key-room stack + BOH catchment; two circulation systems | Housekeeping/linen/waste per floor; service portal separate from guest portal; front-of-house queue from arrivals math; accessible guest-room dispersion; sprinkler/detection assumptions; 24 h operational noise separation |
| Hospital | Department clusters; infection control vs observation | Defend-in-place logic (compartments, horizontal movement); bed/gurney envelopes; clean/soiled separation; nurse-unit ↔ lift adjacency; corridor width ≥ 3 tiles for beds; plant redundancy |
| Office | Core-to-perimeter efficiency; floor-plate economics | Deep-plan daylight failure; circulation as loop; BOH per floor; tenant-separation and multiple-occupancy routes; queue and lift traffic at peak |
| Retail | Sales floor vs stock vs service; flow line | Aisle widths with trolleys; back-of-house replenishment; loading; sightline/security; service/public conflict at high traffic |
| School | Classroom street; supervision; break capacity | Assembly and outdoor play; sound separation; drop-off/pick-up circulation; secure zones; specialised rooms' service needs |
| Industrial / logistics | Flow line; clear spans; dock count | Structural span and bay dominate; personnel vs vehicle separation; welfare block; heavy-duty routes; hazard separation |
| Civic / public | Legibility; capacity peaks; surveillance | Assembly loads; multi-level public routes; refuge; event-driven queueing; accessibility from arrival |
| Mixed-use | Type boundaries as design objects | Shared cores and conflicts (noise, waste, security hours); independent egress per use; stacked incompatible neighbours need buffers |

Rule: when you cannot say which type a rule came from, it is a residential default — check it.

## Design Alternatives

See `research/design-alternatives.md`. Generate alternatives when objectives conflict or information
is weak. Do not declare one universal winner.

**Triggers — at least one alternative beyond the base case is mandatory when:**
- the pre-geometry gate passes but only narrowly — within the margin you declared for that check
  (state the margin and its basis; a tight margin on egress or portal capacity matters far more than
  one on area efficiency);
- two brief goals pull in opposite directions and the brief does not rank them;
- a Critical or Major failure has two repairs of comparable cost (e.g. cut a floor vs shrink rooms);
- an assumption that drives geometry is Low confidence (unknown jurisdiction, unknown operational
  model, unknown occupancy target);
- the massing/plate shape itself is the open question (tower vs podium-tower, slab vs courtyard);
- the client asked for "options", or the design is irreversible (a stack, a core, a façade budget).

State the trigger used. Zero alternatives is correct only when every objective is compatible and the
gates pass with slack — and that must itself be reported.

Axes to draw from: efficiency (net-to-gross, façade length, repetition), circulation (route length,
decision points, capacity), user experience (aspect, daylight, hierarchy, threshold sequence,
legibility), structural simplicity (bay regularity, span restraint, core continuity), operational
efficiency (BOH catchment, crossing count, service proximity, queue capacity). Each axis is a parti
statement plus the specific tile moves that express it and the cost of those moves.

Per-option record (mandatory fields):
```
Option | Parti (one sentence) | Strategy | Strengths (measured) | Weaknesses (measured)
| Major assumptions | Trade-offs | Risks | Best-suited objective
```

Fair comparison: identical programme, identical site grid, identical constraint set, identical metric
list, no metric dropped because it looked bad. Publish the **input hash** (programme totals, matrix
grades, grid extent, occupancy) once above the table so a reader can see the inputs were held, and each
option's **diff vector** `(core coords, spine route set, plate depth in tiles, module, band
assignment)` with ≥2 differing components between any pair — a partition nudge is a variant, not an
alternative (DA-02, DA-03). Present the recommendation as "who this option is
for", with the evidence that would overturn it. A single hidden compromise is a reporting failure.

## Decision Making

See `research/decision-making.md`. Chain: Constraints → Objectives → Alternatives → Trade-offs →
Evaluation → Decision → Validation.

- Hard constraints never trade. Life safety, accessibility, structural feasibility and programme
  mandates are gates, not criteria to be outweighed.
- No metric is universally superior. Weights come from the brief's ranked quality objectives, and the
  weights are reported with the decision.
- Prefer the reversible choice; when a choice is irreversible (core position, grid, façade
  allocation, stack alignment), decide it late enough to be informed and early enough to be free,
  and record why at that moment.
- Every concession appears in the record: what you gave up, its measured cost, and who loses.
- Default priority order when nothing in the brief overrides it:
  `Safety > Structural feasibility > Basic functionality > Circulation > Operations > Environmental
  performance > Efficiency > Experience > Aesthetic refinement`. This is a reasoning default, not a
  law; a project may reweight it (a museum may rank experience above efficiency) — the reweighting is
  itself a recorded decision.
- Decision record: Decision / alternatives considered / criteria + weights + evidence / chosen /
  reason / cost / risk / assumption / how to reverse / what validation would overturn.
- Set **aspiration levels before generating** (what each metric must reach for the option to be
  acceptable) and satisfice against them rather than maximising one number; generate the whole option
  set before evaluating any of it; keep analysis, generation and evaluation in separate passes; and
  **declare the tie-breakers before a tie occurs** (DM-02, DM-03, DM-04, DM-24). Deliberation cost
  should match decision cost — a reversible tile choice does not deserve an option study (DM-13).

## Validation

See `research/validation.md` (hierarchy, matrix, report schema are authoritative there). Validate at
every level; validate before reporting success, and validate the whole building, not one floor.

Seven scales: Human → Room → Zone → Floor → Building → Site → Lifecycle.
Eleven categories, each with its checks:

| Category | Checks (grid-executable) |
|---|---|
| Functional | every programme row exists as tagged rooms; totals ≥ required; relationships satisfied |
| Circulation | flow capacity per route, service flow separation, egress paths/widths/distances, vertical portals and queues, bottleneck and cut-vertex scan |
| Spatial | proportions, usable area after wall tax, tile-class reconciliation (occupied + circulation incl. doors + structure = grid), door-formed room division (a door line spanning a region width; isolated door tiles do not divide - test the derived room count), dead-space detection, furniture fit, human scale, room-type resolution (does each room type to its intended tag, and does any room collapse to hallway?) |
| Structural | grid regularity in tiles, bearing-line continuity, span ranges, vertical alignment, load-path plausibility |
| MEP | shaft stacking, service band widths, wet-cell alignment, drain-slope budget, plant access, maintenance tiles |
| Safety | egress count and remoteness, dead ends, travel distance, fire separation as adjacency, accessibility route continuity |
| Construction | constructability, module repetition count, non-standard geometry share, material logic |
| Operations | cleaning/waste/delivery/staff routes and crossings, catchment bounds, BOH area, storage |
| Environmental | daylight depth per room vs façade, aspect allocation, ventilation path, acoustic buffer presence |
| Experience | wayfinding decision points, hierarchy and legibility, threshold sequence, privacy gradients, comfort |
| Lifecycle | change-friendliness of tag/room boundaries, spare capacity, expansion and conversion risk |

Verdicts are three-valued: `PASS`, `FAIL`, `UNKNOWN — not representable / data missing`. An
`UNKNOWN` is never converted to a `PASS`. Codes report "consistent / inconsistent with <source>,
jurisdiction X, verification required" — the word *compliant* is not available to this skill.

Four standing conditions frame every matrix run above (VA-01, VA-07, VA-10, VA-20):

- **Write the oracle first.** Validation is against the written programme, matrix and thresholds from
  steps 6-14 — not against how the plan looks. A check with no written requirement behind it is
  opinion, and must be labelled as such.
- **Model-integrity gate before semantics.** One tile per state, door tiles joining two walkable
  regions, tile-class reconciliation closing, portals anchored and walkable, no zero-interior rooms,
  no room divided in two by a door line spanning its width. On a gate failure every other verdict is `unknown: model invalid`,
  never `pass` — phantom geometry is how unsafe plans score well.
- **Capability manifest.** Publish which checks this host *cannot* run (heights, structure sizing,
  smoke control, daylight factors, real time, acoustics) as a property of the suite, so a green
  report is never read as an all-clear.
- **Closure rights.** The agent may close geometry and logic findings itself; code-jurisdiction,
  structural, fire, access and operational-capacity findings stay open for a qualified reviewer
  regardless of what the arithmetic shows.

Then:
- Run cheap checks first and critical checks before aesthetic ones; collect **all** criticals before
  opening any major; stop and fix on the first `CRITICAL`; re-run every downstream check after a
  modification (cascade detection).
- Each failure ships a counterexample — tile coordinates, not an adjective — and the report is a
  measured-vs-required diff table with prose beneath it (VA-08, VA-18).
- Each check is written as a declarative triple — `(selection, constraint, severity)` over **derived**
  data — with its level named, so the suite is a versioned artefact that can be re-run and tested
  against known-good and known-bad fixtures rather than improvised per plan (BIM-16…BIM-19, VA-11,
  VA-12, SR-31).
- Circulation is validated with simulated trips over the real A\* network (origin-destination sets
  per user group, per peak), not by looking at corridors (VA-15).

**Compute, do not narrate.** A check is only evidence if its number was derived from the tiles the
agent actually emitted, and the arithmetic is shown. Rules:
- Recompute totals from the grid (blocked/walkable/door counts, per-room interiors, route lengths,
  crossing counts, portal coordinates), never reuse the numbers you assumed while drawing.
- Report `metric = value vs threshold (source) → verdict`. "Circulation is generous and the plan
  flows well" is not a check; `circulation share = 3,412/12,800 tiles = 26.7 % vs budget 18 % → FAIL
  (Major)` is.
- Every reported area, width and capacity must reconcile with the tile counts; if the reconciliation
  fails, the failure is in the report and must be corrected before anything else.
- Checks that cannot be executed on this grid are reported `UNKNOWN — not representable`, with the
  professional or data requirement that would close them.
- The agent validates its own output before presenting it, and never presents an unvalidated first
  draft as a design.

### Design quality and its limit (Domain X)
Quality here means the properties a reader of the plan can verify, not adjectives: hierarchy (is the
important space larger, better placed and more connected — TH-17), legibility (can the route be read at a
junction — TH-19, HB-06, HB-09), proportion (ratio bands, TH-25), rhythm and repetition (module count,
GT-12, EC-11), spatial sequence (threshold count arrival → deepest room, TH-07), figure-ground
(solid/void reading, TH-18), daylight and view on the long-stay rooms (EN-04, EN-08, HB-16), privacy
gradient (HB-17), and the legible skeleton preferred over maximal connectivity (AG-23).

Report quality claims as measured or as judgement — never as fact, and never traded upward against
safety, structural feasibility, function, circulation or operations (the priority order is
`## Decision Making`). Where quality genuinely requires giving something up, it is an option, priced
(SR-29, DA-05).

## Failure Detection

See `research/failure-patterns.md` (the catalogue with Failure → Cause → Detection → Prevention →
Correction).

Scan for at least: circulation bottlenecks, dead ends, excessive or doubling-back circulation,
unusable leftover tiles/slivers, bad adjacency, privacy exposure (line-of-sight into private doors),
service/public conflict, missing or unreachable storage, maintenance paths that do not exist,
windowless long-occupancy rooms, acoustic adjacency failures, structural discontinuity (floating
bearing lines, spans beyond range, core offset), MEP conflicts (stack breaks, wet cells off-shaft),
accessibility erosion (route width loss, door maneuvering overlaps, missing refuge), furniture
layouts that cannot fit, operational inefficiency (crossing counts, catchment overflow), single
portal floors, stack drift, quantisation slivers.

Severity classes: **Critical** (life safety, structural infeasibility, a floor unreachable or
unescapable, accessibility route broken) → **Major** (a room or function unusable, programme unmet,
service conflict at scale) → **Moderate** (efficiency, comfort, wayfinding strain) → **Minor**
(refinement). Critical issues are resolved before any aesthetic optimisation, and a Critical finding
blocks a "done" claim.

Each failure reports: symptom, evidence (which check, which number), cause, the cheapest correction,
and what that correction risks elsewhere.

The catalogue is `research/failure-patterns.md` (FL-01…FL-28) with its 18-scan pseudo-code suite and
severity ladder — run that suite, in that order, rather than inventing a scan list per design. Its
five always-Critical cases are the ones this host makes easiest to miss: egress shortfall (FL-26),
structural discontinuity (FL-20), a room vanishing into `hall` because its tags resolve to nothing
(FL-07), a room divided into two by a door run spanning its width (FL-06), and a floor served by a single portal (FL-08).

## Iteration

Never assume the first design is correct.

```
Generate → Evaluate → Find failures → Prioritise failures → Modify → Re-evaluate → Repeat
```

Loop discipline:
- Fix in severity order; one failure class per pass, so the effect is attributable.
- Preserve validated constraints: modifications must not silently reopen a passing check. Re-run the
  full check set after each pass and diff against the previous record.
- Modify minimally: choose the repair by blast radius — retag < move a door < resize a boundary < move a
  wall line < move a core — and prefer the lowest option that clears the finding (`adjacency-graphs.md`
  AG-18). Do not redraw a floor to fix a door.
- Explain every major change: what was wrong, what changed, what it cost, what it risks.
- Detect cascades: a widened corridor takes tiles from rooms; a moved core breaks stacks; a retagged
  room breaks its fixture clearance; a longer span breaks the bearing line.
- Terminate on: no Critical or Major findings, all remaining findings Minor and accepted, or a
  documented structural conflict that needs a decision above the agent's remit. Do not iterate into
  false precision.
- If two iterations re-introduce each other, that is a design conflict, not a loop: stop iterating
  and produce alternatives.

## Uncertainty & Assumptions

Classify every statement:

```
Known | Assumed | Estimated | Unknown | Requires research | Requires engineering verification
| Requires code verification | Requires professional review | Not representable in host model
```

Never fabricate precision: no decimals beyond the source's own, no percentile or clause you have not
seen, no "typical" without a class label.

Assumption register (mandatory whenever requirements are incomplete — one row per assumption):
```
Assumption | Reason | Confidence (High/Med/Low + basis) | Impact if wrong | Verification needed
```
Add owner, revisit trigger and reversibility where they matter. An assumption that affects life
safety or structural feasibility must be conservative and flagged, not merely recorded.

**Register lifecycle.** The register is a living document, not a closing paragraph: it is created at
step 2, appended whenever a decision needs a missing input, re-read before every geometry change, and
emitted last with (a) the rows added since the previous iteration, (b) rows whose geometry changed
their impact, (c) rows closed by evidence and what closed them. A design whose final report contains
fewer assumptions than an earlier draft has either verified something (say what) or hidden something.

Confidence propagates: a number derived from a Low-confidence input is Low, no matter how clean the
arithmetic looks. Chains of estimates are reported as ranges, not as single values.

**Abstain rather than emulate.** Where no answer is supportable, say "no answer available on this data"
or narrow the question — an output that merely looks like a decision is worse than an open one
(`uncertainty.md` UN-20). And **charge the model's own resolution error before criticising the design**:
a 0.5 m grid disagrees with a 50 mm reality in ways that belong to the tool, not to the plan; report
which of the two you are looking at (UN-18, GT-17).

Flag register, when a compliance or feasibility question cannot be resolved:
```
ISSUE | CHECK | ATTEMPTED SOURCE | VERIFICATION (verified / partial / UNVERIFIED)
| REQUIRED DATA | CONSERVATIVE DEFAULT | FLAG-LEVEL (BLOCKER / REVIEW / ADVISORY)
```

## Output Requirements

Every design response contains, in this order:

1. **Brief restatement** and requirement gaps.
2. **Programme table** (with tile and m² totals) + area budget chain.
3. **Site/orientation record**: grid extent in tiles and metres, north assignment, façade edges,
   access points.
4. **Adjacency matrix** (graded) + zoning bands + parti statement in one sentence.
5. **Circulation model**: route hierarchy with widths in tiles and capacity checks; vertical core
   with portal counts and queue reasoning.
6. **Structure and services strategy**: bay grid in tiles, span table, stack and band strategy.
7. **Environmental strategy**: façade allocation, depth rules, buffers.
8. **Per-floor grids**: tile coordinates per floor (or the editor's payload), with rounding report.
   Map every design object onto host vocabulary rather than inventing a parallel one: a floor carries a
   tile-state grid (`walkable | blocked | door`) plus rooms typed by fixture tags, objects/assets,
   and role-gated access — the engine resolves walkability per NPC role from those tags, so a
   "service-only" route must be expressed as tags the simulation can actually honour, not as prose in
   the report (`research/bim-cad.md` on what the host can and cannot represent).
9. **Cross-floor consistency report**: cores, shafts, wet cells, bay lines, modules, portal
   coordinates.
10. **Validation report**: per-check records (level, category, metric, threshold + source, verdict,
    severity).
11. **Failure list**, prioritised, with corrections and cascade risks.
12. **Alternatives comparison** (when objectives conflicted), same metrics, no hidden winner.
13. **Decision log** with trade-offs and who loses.
14. **Assumption register + flag register + limitations** (what the model cannot represent).
15. **Iterated, not first-pass**: show the modification log.
16. **Sources** actually consulted for this design, with tiers.

Language: player/user vocabulary in UI-facing text; schema names stay internal. Numbers always
paired with units and tile counts. Claims carry class labels. "Should be fine" is not an output.

## Research References

Evidence base complete: 23 domain files, 568 source rules, pooled into 37 master rules (SR-01…SR-37) in
`research/synthesized-rules.md`, which also holds the tension register (11 unresolved cross-source
disagreements) and the cross-domain findings. Every domain file carries its own `## Sources` with tier
labels, a `## Weak or contested` section naming what could not be retrieved, and a
`## Type-specificity audit`. `research/sources.md` is the consolidated index (500 URL-bearing entries).

Section → evidence map (jump from procedure to the rule that licenses it):

| This skill's section | Master rules | Domain files to read for detail |
|---|---|---|
| Core Principles / Evidence Rules | SR-01, SR-13, SR-14, SR-22 | `uncertainty.md`, `decision-making.md` |
| Design Workflow, gate, ladder | SR-01, SR-16, SR-18, SR-23 | `architecture-theory.md`, `grid-translation.md`, `space-programming.md` |
| Requirement Analysis | SR-18, SR-22 | `space-programming.md`, `uncertainty.md` |
| Site & Context | SR-35 | `site-context.md` |
| Building Programming | SR-01, SR-18, SR-19, SR-25 | `space-programming.md`, `economics.md` |
| Adjacency & Zoning | SR-03, SR-04, SR-16, SR-31 | `adjacency-graphs.md`, `architecture-theory.md` |
| Circulation | SR-05, SR-06, SR-17 | `human-behavior.md`, `building-codes.md`, `multi-scale.md` |
| Human Scale | SR-07, SR-23 | `human-scale.md` |
| Environmental Design | SR-32, SR-33, SR-34 | `environmental-design.md` |
| Structural Reasoning | SR-37 | `construction.md`, `multi-scale.md` |
| MEP / Services | SR-08, SR-24, SR-37 | `construction.md`, `professional-practice.md` |
| Operations & Maintenance | SR-09, SR-26, SR-30 | `operations-maintenance.md` |
| Building Lifecycle | SR-26, SR-27 | `lifecycle.md` |
| Grid / Tile Translation | SR-02, SR-15, SR-23, SR-24, SR-25 | `grid-translation.md`, `floor-plans.md` |
| Building-Type Rules | SR-12, SR-29 | each file's type audit + `real-projects.md` |
| Design Alternatives | SR-21, SR-28 | `design-alternatives.md`, `economics.md` |
| Decision Making | SR-21, SR-22, SR-29 | `decision-making.md` |
| Validation | SR-10, SR-25, SR-31, SR-36 | `validation.md`, `bim-cad.md` |
| Failure Detection | SR-36 | `failure-patterns.md` |
| Iteration | SR-11, SR-21 | `validation.md`, `adjacency-graphs.md` (AG-18 repair ladder) |
| Uncertainty & Assumptions | SR-14, SR-22 | `uncertainty.md` |
| Output Requirements | SR-20, SR-25, SR-28 | `synthesized-rules.md` |

Read order for a design task: `synthesized-rules.md` → the type's entries in the domain files →
`grid-translation.md` → `validation.md` → `failure-patterns.md` → the domain files the task touches.

**Reading budget: never read a domain file whole** (23 files, 568 rules, ~2 MB). Enter through the SR
ledger, then pull only the rules whose ids the SR names for the building type in play, plus that file's
`## Type-specificity audit` and `## Weak or contested`. An agent that reads everything has, by
definition, stopped reasoning and started memorising.
