# Synthesized rules — the operational rule set the skill executes

Status: **all 23 domain files pooled — 568 source rules, 37 master rules.** Counts per domain:
architecture-theory 29 (TH) · operations-maintenance 28 (OM) · human-scale 28 (HS) ·
failure-patterns 28 (FL) · construction 28 (CN) · building-codes 28 (CODE) · real-projects 27 (RP) ·
human-behavior 26 (HB) · professional-practice 26 (PP) · grid-translation 26 (GT) ·
environmental-design 26 (EN) · floor-plans 25 (FP) · space-programming 24 (SP) · site-context 24 (SC) ·
multi-scale 24 (MS) · lifecycle 24 (LC) · decision-making 24 (DM) · bim-cad 24 (BIM) ·
adjacency-graphs 24 (AG) · validation 23 (VA) · economics 22 (EC) · uncertainty 20 (UN) ·
design-alternatives 10 (DA). The rule ids above are cited as evidence, so an SR is only as strong as the
number of *independent* domains supporting it; DA is deliberately the slimmest file and its rules carry
the least independent weight. Method per the master spec §27: collect → compare → find common patterns →
find disagreements → determine applicability → grade evidence strength → record limitations → promote
only sufficiently supported items into rules.

Not a summary of the research files. This file's unit is the chain
`Evidence → Principle → Rule → Agent behavior`, and its purpose is three things the domain files
cannot do alone: (1) show where independent domains **converge**, which is what licenses a rule;
(2) record where they **disagree**, which is what forbids an agent from silently picking a side;
(3) classify by evidence type, which is what stops a heuristic being used as a code floor.

## Convergence ledger

**How to read the "Converging domains" column (audit qualification, 2026-09-24).** The entries are
*rule ids from distinct files*, so the count measures **file count, not independent-origin count**. A
quality audit traced 20 of the 37 rows to fewer distinct origins than rules cited — e.g. SR-23 lists 10
rules traceable to 2 detectable origins (WBDG, Ching), SR-30 to 1 (HBN), SR-27 and SR-37 likewise.
Where the shared origin is a primary standard or a locally checkable host-code fact, that is normal and
strong. Where it is one consultant page, one glossary, or one T3 mirror of paywalled text, the row's
apparent corroboration is **not** independent, and per UN-10 the rule may warn but must not fail a
design on its own. Rows whose support includes `design-alternatives.md` or `uncertainty.md` are further
weakened because those two files are orchestrator-authored and share lineage with
`decision-making.md`. One structural addition from the independence measurement
(`audit/README.md` §17): **`floor-plans.md` should be counted as one origin, not twenty-five** — 24 of
its 25 sourced rules rest on arXiv preprints, so any row above that gains its apparent strength from
FP ids is weaker than it reads (SR-15, SR-16 especially). Demoted-for-single-origin rows: SR-23,
SR-27, SR-30, SR-37 (and SR-21 partially).

| SR | Master rule | Converging domains | Class | Scope |
|---|---|---|---|---|
| SR-01 | Programme and adjacency matrix exist before geometry, and are the oracle | TH-01, PP-23, VA-01 | DESIGN PRINCIPLE | universal |
| SR-02 | Every metre becomes whole tiles, rounded **up**, with the enclosure tax and tile-class reconciliation reported | TH-02, CODE-27, PP-10, VA-17 | ENGINEERING CONSTRAINT | universal |
| SR-03 | Adjacency, access and separation are three tests | TH-03, TH-04, VA-06 | FACT (method) | universal |
| SR-04 | Zone into public / semi-public / private / service bands, and keep the service route off the public route | TH-06, TH-08, PP-01, PP-04 | DESIGN PRINCIPLE | universal; sharpest in hospitality, healthcare, commercial |
| SR-05 | Size routes from flow and from the legal floor, whichever is larger; budget the movement share | TH-11, TH-12, TH-15, CODE-05, PP-11, PP-12 | mixed — see Tension register | universal |
| SR-06 | Egress arithmetic precedes plan shape: load → exits → width → distance → remoteness | CODE-01…CODE-08, VA-04 | CODE REQUIREMENT (jurisdiction-bound) | universal |
| SR-07 | Clearances for the large user, reaches for the small; furniture fit and door reserve are geometry, not detail | TH-21, PP-14, CODE-18, CODE-19, CODE-21 | STANDARD / ENGINEERING CONSTRAINT | universal |
| SR-08 | Fix the stack before the plan: wet cells, shafts and service bands on one line, inside a slope budget | PP-17, PP-18, CODE-14 | ENGINEERING CONSTRAINT | universal in multi-storey |
| SR-09 | Back-of-house is programmed first as a bounded share with catchments, never as the residue | PP-02, PP-03, PP-05, PP-06 | DESIGN PRINCIPLE + BUILDING-TYPE CONVENTION | hospitality, healthcare, commercial, civic |
| SR-10 | Three-valued verdicts, integrity gate first, capability manifest, and closure rights | VA-03, VA-04, VA-07, VA-10, VA-20 | FACT (method property) | universal |
| SR-11 | Re-validate the blast radius after every edit; every failure ships a counterexample; the loop has stop rules | VA-08, VA-14, VA-19, PP-25 | DESIGN PRINCIPLE | universal |
| SR-12 | Validate against the type card of the building actually being designed | VA-21, plus the type audit in every domain file | BUILDING-TYPE CONVENTION | universal |
| SR-13 | Codes are floors, not targets; a pass on compliance arithmetic never implies an operational pass | CODE-28, PP-01, PP-08, VA-04 | CODE REQUIREMENT + DESIGN PRINCIPLE | universal |
| SR-14 | Missing information is flagged in a structured register, never filled with an invented number | CODE (`How to flag instead of fake`), VA-03, PP-25, UN-12…UN-16, DM-21 | STANDARD (conduct rule) | universal |
| SR-15 | One module, cloned: repeated spaces are copies of a tile footprint with zero drift, floor to floor | RP-05, FP-12, MS-14, PP-17, TH-23 | BUILDING-TYPE CONVENTION + ENGINEERING CONSTRAINT | hotel, hospital, residential, office, prison/dorm-type |
| SR-16 | Derive the graph from one geometry source of truth; topology is the first validity signal, precise geometry the second | FP-02, FP-03, FP-15, FP-16, TH-03, TH-04, VA-07 | FACT (method property) | universal |
| SR-17 | Size vertical transport from peak handling capacity and model each portal as a queue | MS-10, MS-23, MS-11, MS-24, TH-29, PP-04 | HEURISTIC + CODE-conditional | multi-storey, all types |
| SR-18 | Capacity basis is stated per figure: occupancy first, activity footprint second, one persons/m² per activity, named measurement convention | SP-02, SP-03, SP-06, SP-07, SP-17, SP-18, CODE-01 | STANDARD | universal |
| SR-19 | Type the room by its fixture set and refuse the `hall` fallback | SP-16, TH-01, host fact (`domain/schema/rooms.ts:9-33`) | ENGINEERING CONSTRAINT (host-derived) | universal on this host |
| SR-20 | Record every deviation from the type's norm with its reason | RP-27, MS-07, VA-21, TH-22 | DESIGN PRINCIPLE | universal |
| SR-21 | Separate generating from evaluating, satisfice against pre-set aspiration levels, and declare tie-breakers before the tie | DM-02, DM-03, DM-04, DM-20, DM-24, DA-07 | DESIGN PRINCIPLE | universal |
| SR-22 | Ask only what would change a decision; decide the rest and record it | UN-19, DM-13, VA-10 | STANDARD (conduct rule) | universal |
| SR-23 | Dual-scale discipline: intent in mm, geometry in tiles, one datum, remainder absorbed in a declared zone | GT-02, GT-04, GT-05, GT-06, GT-07, GT-18, GT-23, SP-14, TH-02, CODE-27 | ENGINEERING CONSTRAINT | universal |
| SR-24 | Every blocked tile carries exactly one kind — structure, shaft, service, furniture, zone | GT-20, GT-21, BIM-12, BIM-22, host facts | ENGINEERING CONSTRAINT | universal on this host |
| SR-25 | Quantities are derived from geometry, never authored beside it | BIM-14, GT-24, EC-01, EC-02, EC-03, VA-18 | STANDARD (method rule) | universal |
| SR-26 | Never trap a short-life element behind a long-life one; service life is a plan property | LC-01, LC-02, LC-13, LC-14, PP-19, OM-08 | DESIGN PRINCIPLE | universal |
| SR-27 | Cap the plate by what the *successor* use can tolerate, and draw the plumbing radius | LC-04, LC-05, LC-06, LC-07, LC-08, PP-17, MS-06, TH-28 | DESIGN PRINCIPLE + ENGINEERING CONSTRAINT | multi-storey, all types |
| SR-28 | Report area the way commerce reads it: three numbers, the measured face, and post-quantisation | EC-01, EC-02, EC-03, EC-05, EC-18, SP-18, SP-06 | BUILDING-TYPE CONVENTION | universal |
| SR-29 | Efficiency is not quality; optimise the type's real headline, not area yield | EC-17, EC-21, EC-22, EC-19, EC-20, TH-15, VA-21 | DESIGN PRINCIPLE | universal, headline is type-specific |
| SR-30 | Operational routes are geometry: route widths, dock as queue plus turning, proven removal paths | OM-01, OM-06, OM-09, OM-10, OM-14, OM-19, OM-23, PP-01, PP-05 | BUILDING-TYPE CONVENTION + ENGINEERING CONSTRAINT | operational types (hotel, hospital, retail, office, civic) |
| SR-31 | Express checks as declarative (selection, constraint, severity) rules over derived data | BIM-16, BIM-17, BIM-18, BIM-19, BIM-23, VA-11, VA-12 | STANDARD | universal |
| SR-32 | Run the environmental chain in order and stop where the first link breaks | EN-01, EN-02, EN-03, EN-08, TH-26, TH-27 | DESIGN PRINCIPLE | universal; binding for long-occupancy types |
| SR-33 | Façade length is a budget allocated before walls | EN-05, EN-06, EN-07, EN-12, EN-14, RP-08, RP-18, EC-08 | DESIGN PRINCIPLE + ENGINEERING CONSTRAINT | universal; perimeter economics dominate office/hotel |
| SR-34 | Sound and privacy are plan geometry, not finishes | EN-10, EN-16, EN-17, PP-15, PP-16, HB-16, HB-17, CODE-25 | DESIGN PRINCIPLE + CODE REQUIREMENT (separation ratings) | universal; healthcare/hospitality/residential dominate |
| SR-35 | Site factors set orientation, entrances and access before the plate is drawn | SC-* (entry/access/setback/massing rules), HB-02 (arrival flow), EN-02 | DESIGN PRINCIPLE | universal |
| SR-36 | Validate with a named scan suite, severity-ranked, after every generation | FL-01…FL-28, VA-05, VA-08, VA-18, PP-25 | STANDARD (method) | universal |
| SR-37 | Structure and services are inferred from plan geometry, and the inference is declared | CN-*, MS-05, MS-06, MS-07, GT-15, GT-21, BIM-09, PP-17 | ENGINEERING CONSTRAINT | universal on a section-less grid |

## The rules

### SR-01 Programme first, and the programme is the oracle
- Principle: a design is testable only against written requirements; a plan drawn first and justified
  afterwards cannot fail, therefore cannot pass either.
- Rule: emit the programme table (space, users, capacity, net area, fixtures, services, environment
  need, relationships) and the graded adjacency matrix before any tile, and validate only against
  them.
- Agent behavior: no tile coordinates in the output before these two artefacts exist; every check in
  the validation report names the programme row or matrix cell it enforces; a check with no written
  requirement behind it is labelled opinion.
- Convergence: TH-01 (programming is the pre-design research/decision phase whose output outlines
  rooms and relationships), PP-23 (freeze the operational programme before geometry; late change
  costs 10-50×), VA-01 (write the oracle before you design).
- Limitation: none known; three independent domains, one of them a code-adjacent practice standard.

### SR-02 Round up, pay the wall tax, reconcile the tile classes
- Principle: on a 0.5 m grid the enclosure is a design cost and quantisation is a systematic bias;
  rounding to nearest hides both.
- Rule: `tiles = ceil(metres / 0.5)` for every minimum; report `real requirement → tiles → resulting
  metres`; report each room's `(W-2)(H-2)` interior and its door cells; close
  `occupied + circulation(walkable-with-no-room ∪ door) + blocked = grid` at floor level, computed
  from actual tile counts, never from summed per-room taxes.
- Agent behavior: publish the rounding report; flag any room whose derived interior is below the
  programme minimum; warn when a room's own wall share exceeds 25 %.
- Convergence: TH-02 (arithmetic on the host grid), CODE-27 (never model a sub-minimum width as
  compliant), PP-10 (width in plan ≠ width in use), VA-17 (thresholds encoded in metres with a stated
  rounding policy).
- Host-verified correction: door cells belong to no room (`src/engine/npc/rooms.ts:2,15,33`), so a
  door cells are excluded from rooms, and a door run spanning a region's width divides it - isolated door tiles do not (verified by executing the flood-fill: 1 door in a 1-tile corridor -> 2 rooms; 1-2 door tiles in an open 9x9 field -> 1 room).

### SR-03 Adjacency, access, separation — three separate tests
- Rule: for every pair state which of the three is required and test it separately: adjacency =
  tile-sets touch; access = a legal, permission-gated path exists through a door; separation = no
  direct door and a minimum path distance with a buffer between.
- Agent behavior: grade the matrix (must-touch / close within N tiles / shared corridor / avoid /
  must-not-touch), then measure `touches` and A\* `steps` per pair on the finished plan and report
  required-vs-measured as a diff.
- Convergence: TH-03, TH-04, VA-06 (test at the level where the defect lives).
- Failure symptom: "must-touch" satisfied by a shared wall with no door — adjacent on paper,
  unreachable in the simulation.

### SR-04 Band the floor and separate the service route
- Rule: allocate public / semi-public / private / service bands per floor before drawing walls; keep
  the service route geometrically off the public route; count clean/dirty and public/service crossing
  points as a first-class metric, before counting squares.
- Agent behavior: publish the band diagram, the crossing count with coordinates of each crossing, and
  the threshold sequence (door count from arrival to deepest room).
- Convergence: TH-06, TH-08, PP-01 (crossings first), PP-04 (service vertical portal separate from the
  guest portal).
- Scope note: the weakest form is a small building with negligible operational traffic — that is a
  justified exception, recorded as a decision, not a silent omission. Host limitation: room `privacy`
  is binary (`open|private`), so gradients ride on role access tags.

### SR-05 Route width = max(flow requirement, legal floor)
- Rule: never size a route from habit. Compute the flow requirement (throughput, passing, queuing,
  trolley or bed envelope), compute the legal floor for the served occupant load, take the **larger**,
  round up, and hold the movement share to its budget.
- Agent behavior: exit-access corridors default to 3 tiles; drop to 2 only where the served load is
  shown below the code threshold and the local minimum permits it; 1 tile is never an access route;
  charge every protrusion and every swinging leaf against clear width.
- Convergence: TH-11/12/15, CODE-05, PP-10/11/12.

### SR-06 Egress arithmetic comes before the shape
- Rule: occupant load → required exit count → egress width → travel distance and common path →
  remoteness, per floor and per space, before the plan is shaped; the outcome is a constraint on core
  position and count, not a check afterwards.
- Agent behavior: run it in the pre-geometry gate; every figure carries jurisdiction, edition, clause
  and verification status; missing jurisdiction ⇒ conservative default + `REQUIRES CODE
  VERIFICATION`.
- Convergence: CODE-01…CODE-08, VA-04.

### SR-07 Human dimensions set the geometry
- Rule: design clearances for the large user and reaches for the small; furniture fit, working
  clearance and approach to each fixture are part of the room's minimum size, and door reserves land on
  both sides of the opening.
- Agent behavior: check each room against the clearance register; assert no two door reservations
  overlap; assert accessible route continuity from site arrival inward; round every clearance up.
- Convergence: TH-21, PP-14, PP-22, CODE-18/19/21.

### SR-08 The stack is decided before the plan
- Rule: wet cells on one wall, in one shaft, inside the gravity-drain slope budget; services band
  reserved along the corridor wall; portal and shaft coordinates identical on every floor.
- Agent behavior: publish the stack plan and re-check coordinate equality across floors; treat a
  shifted stack as a Critical finding.
- Convergence: PP-17, PP-18, CODE-14 (rated vertical openings).

### SR-09 Programme the operational apparatus first
- Rule: housekeeping/linen/waste/storage/plant/staff facilities are a bounded share of the plate with
  catchment limits, fixed before the desirable rooms are laid out.
- Agent behavior: state the share with its source or as an assumption; give each support function a
  catchment radius in tiles and flag overflow; route waste and soiled flow with its own way out.
- Convergence: PP-02, PP-03, PP-05, PP-06. Confidence on specific percentages: Low — see limitations.

### SR-10 Validation protocol
- Rule: three-valued verdicts (`pass | fail | unknown`), model-integrity gate before semantic checks,
  capability manifest of what the host cannot check, and closure rights limiting what the agent may
  close itself.
- Agent behavior: on integrity failure, every semantic verdict is `unknown: model invalid`; green
  reports always print the manifest; jurisdictional, structural, fire, access and capacity findings
  stay open regardless of arithmetic.
- Convergence: VA-03, VA-04, VA-07, VA-10, VA-20.

### SR-11 Edit, then re-validate the blast radius
- Rule: after any modification, re-run the checks the edit can reach (rooms whose membership changed,
  their zone and floor graph, any portal touched), keep a `caused-by` chain, and stop with named rules
  rather than polishing indefinitely.
- Agent behavior: each failure carries tile coordinates as counterexample; ≥2 flipped verdicts in one
  pass is reported as a cascade; unbounded iteration is itself a defect.
- Convergence: VA-08, VA-14, VA-19, PP-25 (trust measurement over intent).

### SR-12 Type card before habit
- Rule: load the building type's divergences before programming and re-load them per floor; a rule
  imported from another type is a defect with a name.
- Agent behavior: the validation report includes which type card was used and which of its divergences
  were checked; where no card exists (e.g. a use the host tag vocabulary cannot type), state it as a
  host limitation, not as a lounge.
- Convergence: VA-21, the type audit section present in every domain file.

### SR-13 Compliance arithmetic is not the target
- Rule: a `code-floor: PASS` never implies `operational: OK`; the two verdicts are reported on separate
  lines and operational risk is escalated as `REVIEW` even when the arithmetic passes.
- Convergence: CODE-28, PP-01, PP-08, VA-04.

### SR-14 Flag, never fake
- Rule: no invented section numbers, no invented dimensions, no unverified figure stated as a
  requirement; emit the structured flag (`ISSUE / CHECK / ATTEMPTED SOURCE / VERIFICATION / REQUIRED
  DATA / CONSERVATIVE DEFAULT / FLAG-LEVEL`).
- Convergence: CODE flag protocol, VA-03, PP-25.

### SR-15 One module, cloned
- Principle: repetition is where cost, quality and constructability are won, and a module that drifts
  one tile per floor is both a construction error and a wayfinding error.
- Rule: fix the repeating space type's tile footprint once, clone it across floors by identical
  coordinates, and treat any size or position change as a deviation with a reason.
- Agent behavior: publish `module = W×H outer tiles`, the repeat count per floor and across the
  building, and the zero-drift check (`MS-14`: same coordinates floor to floor); report repetition loss
  when a floor's rooms deviate.
- Convergence: RP-05 (fix the module first, let structure/façade follow — documented projects), FP-12
  (clone the tile footprint, don't re-derive), MS-14, PP-17 (fix the stack before the plan), TH-23.

### SR-16 Topology first, geometry second, one source of truth
- Rule: derive the plan graph from the geometry (never maintain a second claim about adjacency that the
  tiles do not support), check exclusive tile ownership (no overlapping room masks, no orphan wall
  fragments), and treat connectivity-through-openings as the first validity signal.
- Agent behavior: run the integrity gate (VA-07), then topology checks (reachability through openings,
  dead ends, degree), then geometry checks (area bands, aspect, openings on shared/exterior boundaries
  only).
- Convergence: FP-02, FP-03, FP-14, FP-15, FP-16 (floor-plan generation research places topology ahead
  of precise geometry for perceived validity), TH-03/TH-04, VA-07.
- Limitation: see Tension 6 — the ML finding that topology dominates is a claim about *perceived
  validity*, not about code minima, where geometry is the binding rule.

### SR-17 Vertical transport sized by peak handling capacity, modelled as queues
- Rule: dimension portals by the peak period (arrival/departure waves, shift change, meal peaks,
  patient or guest transfer), not by population; guarantee stop coverage and two independent vertical
  egress paths from every occupied floor; model each portal as a queue with an explicit service rate.
- Agent behavior: report handling capacity % and average queue/wait proxy per period, per floor
  reachable set, and the two-path check; where a real traffic analysis is required, escalate
  (`REQUIRES engineering verification`) rather than asserting a lift count.
- Convergence: MS-10, MS-11, MS-21, MS-23, MS-24, TH-29, PP-04, CODE-17 (high-rise two-stair
  package). Confidence on specific handling-capacity figures: Medium — traffic-handling constants are
  source-dependent.
- Extension (v3): the arithmetic this row only demanded now exists as its own domain — traffic period and
  five-minute arrival share, trip statistics, round-trip-time built term by term, car count from capacity
  *and* interval, and the utilisation ceiling (`vertical-transport.md` VT-01…VT-14, worked 250-key example).
  Where a count is needed, compute it there; this row keeps the stacking and two-path duties (MS-11, MS-21)
  and the queue model (MS-23), and no longer stands alone as the sizing authority.

### SR-18 Capacity basis before area
- Rule: every area figure names its capacity basis (persons per space, per m², activity footprint), one
  consistent persons/m² per activity across the design, and the measurement convention in force before
  any net-to-gross number is quoted.
- Agent behavior: emit the ladder gross→net→programme→circulation→structure→services→mechanical with
  one line per rung, and the three net-to-gross levels reported separately (SP-18).
- Convergence: SP-02, SP-03, SP-06, SP-07, SP-17, SP-18, CODE-01 (load factor from the *actual* use,
  gross-vs-net basis caveat).

### SR-19 Type the room, refuse the fallback
- Rule: a room exists as a design object only when its fixture set resolves to the intended type; the
  host's silent `hall` fallback must be detected and reported as a defect, and programme rows whose
  type the host vocabulary cannot express are escalated as a host limitation.
- Agent behavior: after generation, re-derive every room's type from tiles+tags and diff it against the
  programme row; report `type-mismatch` and `collapsed-to-hall` lists.
- Convergence: SP-16 (independent), TH-01, host fact `src/blueprint-editor/domain/schema/rooms.ts:9-33`.

### SR-20 Deviations are recorded, not absorbed
- Rule: any departure from the type's norm or the module (a one-off room, an offset core, a bay change,
  a non-standard geometry) is entered in a deviation register with its reason and its cost in tiles and
  repetition lost.
- Convergence: RP-27, MS-07, VA-21, TH-22, PP-24 (non-standard geometry paid in setting-out).

### SR-21 Generate separately from evaluating
- Rule: pre-set aspiration levels and satisfice (DM-02); produce the full option set before scoring any
  of it (DM-03); keep analysis, generation and evaluation in distinct passes (DM-04); declare the
  tie-breakers before a tie exists (DM-24); guard against fixation on the first promising scheme
  (DM-20); spend deliberation in proportion to decision cost (DM-13).
- Agent behavior: no scoring appears in the same step as a draft; the option record shows the metric
  list fixed in advance; the recommendation names its declared tie-breaker.
- Convergence: DM-02/03/04/13/20/24 with DA-07 (metrics fixed before generation) and the spec's §34
  loop; theoretical ground is bounded rationality / satisficing (cited as a knowledge source in
  `decision-making.md`, not as a retrieved passage).

### SR-22 Ask only what would change a decision
- Rule: an information request is legitimate only when the answer would alter a design decision;
  otherwise choose the conservative default, record it as an assumption, and proceed. Blocking the
  design to obtain a fact that no rule depends on is a process defect.
- Agent behavior: each question in the gap list names the decision it would change; unrecoverable
  information is converted to an assumption row plus a flag, never into silence.
- Convergence: UN-19, DM-13, VA-10, and this project's standing rule that reversible in-repo choices
  are decided and logged rather than asked.

### SR-23 Dual-scale discipline
- Rule: store every dimension twice — intent in millimetres and geometry in tiles — from one declared
  datum shared by all floors; round functional minima **up**, proportions to nearest at the
  coordination cell, and put the remainder in a designated absorber (wall zone → service band →
  declared tolerance strip → plate edge), never in usable area, egress width or an accessible clearance.
- Agent behavior: publish the dual-scale table, the absorber used per floor, and the quantisation-error
  propagation (`GT-17`, `GT-18`: anchor modules absolutely; never accumulate rounded steps).
- Convergence: GT-02/04/05/06/07/18/23 with SP-14 (wall tax and door tax as separate budget lines) and
  CODE-27 (round up). Five independent domains.

### SR-24 One blocked tile, one meaning
- Rule: tag every blocked tile with exactly one kind — structure, shaft, service, furniture or zone —
  because on this host all five are the same tile state, and an untagged block makes every downstream
  check (span, removal path, fire separation, area) ambiguous.
- Agent behavior: run the tile-class reconciliation as part of the integrity gate; report untagged
  blocked clusters; reserve services as whole tiles in a band on the corridor side, never threaded
  through the room-side face.
- Convergence: GT-20, GT-21, BIM-12 (material layers destroyed by the grid; only a class tag
  survives), BIM-22, PP-18.

### SR-25 Quantities are derived, never authored
- Rule: areas, lengths, counts and shares come from measuring the emitted grid; a number that does not
  reconcile to tile counts is a reporting defect, and the measurement face (which side of the wall)
  plus the quantisation correction are stated before any comparison to real-world benchmarks.
- Convergence: BIM-14, GT-24, EC-01, EC-02, EC-03, VA-18, and this skill's "compute, do not narrate".

### SR-26 Service life is a plan property
- Rule: no short-life element behind a long-life one; each replaceable gets an access tile, a removal
  path and a life shorter than the thing enclosing it; spare capacity is reserved in plan, not in
  intention.
- Agent behavior: publish the service-life record per element class and the access/removal test result;
  flag trapped plant, trapped risers and unreachable traps.
- Convergence: LC-01, LC-02, LC-13, LC-14 with PP-19 and OM-08 (independent formulations of the same
  rule from lifecycle and operations research).

### SR-27 Design for the successor use
- Rule: cap plate depth by the depth the *next* use can tolerate, draw the plumbing radius around every
  wet core, provision load and riser reserve, and test the plan against a named second use rather than
  asserting flexibility.
- Agent behavior: run the alternative-use check (which rooms survive retagging; what a conversion would
  have to demolish); report flexibility purchased without a named beneficiary as a cost, not a merit.
- Convergence: LC-04…LC-08, LC-23 with PP-17, MS-06, TH-28, EC-17.

### SR-28 Report area the way commerce reads it
- Rule: three numbers per floor (gross / net / lettable or usable), the measured face named, the
  convention declared (and its jurisdiction), all computed **after** quantisation; circulation and core
  expressed as revenue loss before drawing, not discovered afterwards.
- Convergence: EC-01, EC-02, EC-03, EC-04, EC-05, SP-06, SP-18.

### SR-29 Optimise the type's real headline, not the yield ratio
- Rule: name the metric the type actually lives on (retail space-to-sales, hotel cost-per-key and
  housekeeping distance, healthcare operational performance) and never let a high efficiency ratio
  stand as proof of quality; where efficiency and the headline metric conflict, the headline wins and
  the loss is reported.
- Convergence: EC-18, EC-19, EC-20, EC-21, EC-22 with TH-15 and VA-21; matches the master spec §17
  warning that maximum area efficiency is not always desirable.

### SR-30 Operational routes are geometry
- Rule: every recurring task has a route with a width, a sequence and a destination — cleaning loops
  (clean before dirty, physically looped), waste streams with their own shaft and a fallback room when
  the chute fails, dock sized as queue + turning + level-change buffer, receiving scaled to the delivery
  cycle, staff day as a five-point route, service portal separate with its own queue and priority mode,
  and a proven removal path for every large asset on day one.
- Agent behavior: report crossings, catchment overflow, queue lengths and removal paths as measured tile
  facts; verify the operational complaint behind each rule before asserting it.
- Convergence: OM-01, OM-05, OM-06, OM-07, OM-09, OM-10, OM-11, OM-14, OM-19, OM-23 with PP-01, PP-05,
  PP-06. Ten independent formulations — the densest convergence in the set.

### SR-31 Checks are declarative data, not improvisation
- Rule: express each validation rule as `(selection, constraint, severity)` over derived data, declare
  the subset of the model it may see and the level of information it needs, and test the checker against
  known-good and known-bad fixtures before trusting a pass.
- Convergence: BIM-16, BIM-17, BIM-18, BIM-19, BIM-23 with VA-11 and VA-12 — the BIM model-checking
  tradition and this host's validation layer independently arrive at the same requirement.

### SR-32 Walk the environmental chain, stop at the first broken link
- Rule: Climate → orientation → envelope → openings → room placement → circulation → mechanical systems,
  declared in that order; when a link fails (depth beyond daylight, no through-ventilation path), fix
  the plan at the failing link or declare the mechanical consequence — never skip to equipment.
- Agent behavior: publish the climate driver, the azimuth assumption, and which link inverted the chain;
  report deep-plan fraction and single-aspect rooms as the metrics that decide it.
- Convergence: EN-01, EN-02, EN-03, EN-08, EN-19 with TH-26/TH-27 — and the same chain stated from the
  site side by SC-* (orientation) and from the cost side by EC-08 (perimeter-to-area).

### SR-33 Façade is a budget spent before walls
- Rule: allocate glazed/façade frontage by room value (occupancy duration × light need), state the
  glazing-to-façade band per orientation, and account for the two-way consequence: glass buys daylight
  and buys heat, glare and noise.
- Agent behavior: report `façade tiles by band`, per-room façade contact, and the rooms that got none;
  put the programme that does not need light in the band that cannot get it (EN-07).
- Convergence: EN-05, EN-06, EN-07, EN-12, EN-14, RP-08, RP-18, EC-08, SC-*.

### SR-34 Sound and privacy are plan geometry
- Rule: buy acoustic and privacy separation with distance, buffers, room order and wall continuity,
  because on this host thickness, mass and layers do not exist; stagger and turn paths, and do not align
  openings between a quiet room and a source.
- Agent behavior: emit the adjacency-based sound table (source rooms × sensitive rooms × buffer status),
  plus visible-private-door counts along public routes; check the reverse case where supervision requires
  sight.
- Convergence: EN-10, EN-16, EN-17, PP-15, PP-16, HB-16, HB-17, CODE-25 — five domains, two directions.

### SR-35 Site decides before the plate
- Rule: resolve orientation, setbacks, entry positions (public / private / service / fire access), noise
  and overlook edges, and arrival flow before the plate is drawn, and carry them as named grid edges so
  every downstream claim ("south façade", "quiet edge") points at a tile boundary.
- Convergence: SC-* (whole file), HB-02 (arrival flow), EN-02, RP-02, RP-03.

### SR-36 Validation is a named scan suite, severity-ranked
- Rule: run the same ordered scan list after every generation (integrity gate → topology → geometry →
  capacity → egress → operations → environmental → experience → lifecycle), each scan producing a
  counterexample, and never a prose verdict.
- Agent behavior: the report is the scan table; a scan not run is reported as not run.
- Convergence: FL-01…FL-28 with their 18-scan pseudo-code, VA-05, VA-08, VA-18, PP-25.

### SR-37 Infer structure and services from plan geometry, and declare the inference
- Rule: bearing lines are continuous blocked-tile runs, spans are clear distances between them, shafts
  are stacked clusters, and services occupy whole tiles in a declared band; every such inference names
  its proxy and its fidelity, and anything beyond plausibility is escalated rather than asserted.
- Agent behavior: publish bay grid in tiles, max span per floor, stack coordinate sets, band widths, and
  the escalation list; flag any bearing line that dies mid-floor.
- Convergence: CN-* (28 rules), MS-05/06/07, GT-15/GT-21, BIM-09, PP-17/18/19, UN-07.

### SR-38 Compute before deciding, and publish the computation
- Rule: When a decision turns on a magnitude, produce the arithmetic — inputs, formula, result, units in
  both metres and tiles — before the verdict, and treat the result as a *check* on plausibility, never as a
  certificate. A design that cannot show its numbers has not been sized, it has been guessed.
- Agent behavior: Emit the four-part record the sizing domains require (ST-01), the five traffic measures
  rather than a headcount (VT-01) with one verdict taken from all of them together (VT-09), and the egress
  budget as time not width (FQ-01). Where a check fails, flag and escalate to the discipline that owns the
  stamped design; do not downgrade the check to make the plan fit.
- Convergence: ST-01, VT-01, VT-09, FQ-01, MS-10, GT-05. Confidence: High on the protocol; the underlying
  constants are source-dependent and carry their own flags (`coverage-map.md` §5).

### SR-39 Publish the vector, never the scalar alone
- Rule: Report the measured KPI set with its bands and band sources; a composite score may accompany it but
  never replace it. Separation of the three measurement questions (formal validity, functional performance,
  human preference) is part of the rule — one instrument may not answer another's question.
- Agent behavior: Freeze metric list, harness and inputs before any option exists (EV-03), show the Pareto
  front before ranking (EV-21), offer lexicographic ordering where weights are contested (EV-22), and publish
  the flip points from the sensitivity sweep (EV-23) with the concession ledger (EV-24).
- Convergence: EV-01, EV-02, EV-03, EV-20, EV-21, EV-22, EV-23, EV-24. Confidence: High — this is method, and
  it is the rule that protects every other one from Goodhart.

### SR-40 Declare which generator produced the plan, and report its status verbatim
- Rule: A layout has a provenance: hand-drawn, grammar-derived, sliced, searched, or constraint-solved — and
  each leaves a characteristic defect signature. State it, state the solver's own status (FEASIBLE is not
  OPTIMAL), and publish the unsat core when a model refuses to solve instead of quietly relaxing a constraint.
- Agent behavior: Run coarse → refine → validate → repair with validation re-entered after every repair
  (LA-26); record the generator selection as a decision with the rejected alternatives (LA-28); keep topology
  and geometry as separate artefacts and say which one the numbers describe (LA-10, LA-12).
- Convergence: LA-10, LA-11, LA-12, LA-18, LA-19, LA-26, LA-27, LA-28. Confidence: High within the domain;
  these are properties of the methods, not of any jurisdiction.

### SR-41 Every borrowed number carries its jurisdiction, edition, datum and units — with the arithmetic shown
- Rule: A figure without its provenance and its basis is not usable, and a figure whose *datum* is unstated is
  worse than no figure, because it silently doubles or halves a plan. Where an inherited number fails its own
  arithmetic, quarantine it with the failing decomposition printed rather than deleting the evidence.
- Agent behavior: Take loads from a named table row with the jurisdiction and legibility of the range visible
  (ST-03, ST-04); take headcount from a named density or load factor with its area basis (FQ-02); take the
  five-minute arrival share from the tier-stated table (VT-03); state which integration definition and which
  LOS system is meant (SA-03, FQ-08). The worked negative case is `PO-23`: an area-per-hour labour figure
  circulating as a walking budget, rejected by unit decomposition — 18 m²/h ÷ 30 m/min is a band width, not a
  speed.
- Convergence: ST-03, ST-04, FQ-02, FQ-08, VT-03, SA-03, PO-23, CN-17→SV-26 (the supersession pattern).
  Confidence: High on protocol; per-figure confidence lives in each domain's `Confidence` field.

### SR-42 Normalise before comparing anything across plans, and compare only like with like
- Rule: Raw configurational, traffic and sizing numbers are size-dependent; cross-plan comparison requires the
  normalised form and a stated reference graph, or the ranking measures the room count rather than the design.
- Agent behavior: Publish the normalisation and its anchors, and reject any implementation that fails them
  (SA-03); compute density from flow with Little's law before reading a level-of-service band (SA-14); compare
  handling capacity to the type's band rather than to another building's number (VT-09); adopt a benchmark's
  self-consistency set verbatim instead of inventing a private definition of "valid" (EV-06).
- Convergence: SA-03, SA-14, SA-07, EV-04, EV-05, EV-06, VT-09, FQ-08. Confidence: High on the requirement,
  Medium on any specific published band.

### SR-43 A capacity chain binds at its weakest component, in series
- Rule: Egress, vertical transport, services and staff routes are series systems: the binding capacity is the
  smallest component's, not the widest corridor's, and utilisation near capacity behaves nonlinearly. Sizing
  one link while ignoring the next is the commonest way a plan looks adequate and operates badly.
- Agent behavior: Solve the series and name the binding component (FQ-07); size car count from capacity *and*
  interval and take the larger (VT-08); refuse to design above the published group-utilisation ceiling
  (VT-14); price the stair as a component that can bind (FQ-09); keep the queue's service rate explicit where
  the host models a portal at all (MS-23).
- Convergence: FQ-07, FQ-09, VT-08, VT-14, MS-10, MS-23, OM-16. Confidence: High (arithmetic of series
  systems), Medium (the specific ceilings).

## Tension register (unresolved disagreements — the agent must not silently pick a side)

1. **Passing width vs legal width.** Practitioner geometry says 2 tiles is the first passing width;
   the code floor says 3 tiles where the served load is ≥50 occupants. Resolution used by SR-05: take
   the maximum; the practitioner figure is a floor for *comfort*, never for *compliance*. Status:
   resolved by dominance, both preserved.
2. **Single-aspect daylight depth.** The code-anchored reading gives ~2.1 m ≈ 4 tiles (glazing head
   height); the planner's heuristic gives 4.5 m ≈ 9 tiles (1.5 × floor-to-floor), and the research
   records that the multiplier could **not** be traced to a primary source. The working cap sits between
   them at 8 tiles. Status: **unresolved**; must be reported as an assumption with confidence Low
   whenever a room's daylight verdict depends on it (TH-26, and `## Weak or contested` there).
3. **Sprinkler credits.** Travel-distance and area relaxations assume coverage that a tile plan does
   not model. Status: a credit may only be taken when coverage is explicitly shown as a design
   obligation; otherwise use the unsprinklered figure (CODE-07, CODE-25).
4. **Accessibility by arithmetic vs by erosion.** Width checks pass while routes fail at small
   fixtures (PP-22). Status: both classes of check are mandatory; the width check may not stand in for
   the route check.
5. **Occupant-load factors: net vs gross.** Mis-tagging the basis changes headcount and every
   downstream width. Status: report which basis was used per space (CODE-01, SP-07).
6. **Topology-primary vs geometry-binding.** Floor-plan generation research supports treating graph
   validity as the dominant signal for a *plausible-looking* plan (FP-03), while the life-safety rules
   bind on measured geometry (a 2-tile corridor fails whether or not the graph is sound). Status:
   **unresolved as a priority question** — run topology checks first because they are cheap and they
   localise repair, but never let a topology pass downgrade a geometry failure, and never let a geometry
   pass stand in for a topology check.
7. **Dataset generalisability vs the spec's instruction to learn from plan datasets.** The public
   datasets are overwhelmingly residential single-family, so their priors are not evidence for
   hospitals, hotels or industrial floors (FP-19, FP-20), and inherited percentages must be reclassified
   as type-named heuristics (SP-24). Status: resolved by labelling — a dataset-derived rule may enter the
   set only with its type named in `Scope`, and any cross-type use is an explicit assumption.
8. **Documented outcomes are advocacy.** Project write-ups report effects ("patient transfers −70 %")
   without study design (RP-08, RP-23). Status: such figures may justify *why* a decision was made, never
   that its consequence will occur; carry them as T3 narrative with Confidence Low.
9. **Vertical demand needs time; the host has none.** Handling-capacity constants (MS-10) come from
   traffic analysis, while the host only exposes portal queues. Status: report the queue proxy as a
   proxy (UN-07), and escalate the count itself for a traffic study.
10. **Is 0.5 m a coordination module?** TH-22 treats the tile as a modular-coordination grid; GT-03
    establishes that 500 mm is **not** a member of the 3M (300 mm) coordinating series — it is a
    multiple of the 100 mm basic module, and the smallest dimension expressible in both families is
    1500 mm = 3 tiles. Status: **resolved, and it changes the rule** — design to 3-tile (1.5 m)
    multiples wherever a coordination dimension matters, treat a 1- or 2-tile dimension as a basic-module
    dimension rather than a coordinating one, and never claim 3M compliance. GT-03 also withdrew
    DIN 4150-1 and BS 5606 as unverified, so the series claim rests on ISO 1006 / ISO 2848 (T1).
11. **Area bands in the programming register are largely unsourced.** `space-programming.md` locates the
    official documents (BB103, HTM 00, GSA 7005.1B) but could not read most of them, so most m² bands
    are `UNCITED — heuristic` with its own honesty note; `floor-plans.md` likewise withholds its
    circulation-share and aspect figures. Status: **no agent may quote a room area as a standard from
    this set** — quote it as a project assumption with a falsifier, or retrieve the primary text.
12. **The quantitative layer (Domains Y–AG) opened twelve further disagreements, and they are registered
    once, in `coverage-map.md` §4** — drain-run placeholders vs the computed slope budget (adjudicated in
    favour of `SV-26`, with `CN-17` superseded in place), service-band width vs the ducts that actually
    have to fit, the lift-arrival heuristic in `FL-17` vs published up-peak bands, the space-syntax
    normalisation that failed a tree sanity test, C/VM2's self-contradictory smoke-yield factor, the four
    tenability limits no opened source supports, and the rest. Status: read that table before quoting a
    contested magnitude; **do not average two conflicting figures, and do not silently pick one** — the
    register says which side won and why.
13. **Item 2 advanced by the v3 daylight domain.** `envelope-daylight-quantification.md` found that the
    depth multipliers in play are measured against **different datums** — `EN-04`'s own 2.5 × figure is
    quoted from a source that means 2.5 × *window height*, not head height, which is roughly half the
    depth the rule applies it to. Status: item 2 stays unresolved as a choice, but is no longer a
    disagreement about numbers only — **name the datum with the multiplier, or the same plan scores two
    different daylight shares.**

## Ledger (regenerable)

43 domain files and 1008 source rules counted at this pass (per-domain counts regenerate with the command
below); **43 master rules, SR-01…SR-37 for Domains A–X and SR-38…SR-43 added for the quantitative layer
(Domains Y–AP)**. Convergence is counted per SR in the ledger table; where an SR rests on one domain
only it is single-source and may warn but not fail a design (UN-10). The six new rows cite only rule ids
whose titles were read at the pass that wrote them. Regenerate with:
`grep -c '^### [A-Z]\{2,4\}-' research/*.md`.

## Cross-domain findings that only the pooling made visible

1. **Three host-model traps were each discovered independently by separate domains** — rooms collapsing
   into `hall` when untagged (SP-16, FL-07, AG-19, and the code fact), door runs dividing a region into two rooms
   (GT-22, FL-06, AG-19, VA-07), and role tags being the only real expression of access (AG-15, OM-11,
   OM-13, HB-14/15). When four domains that never saw each other converge on a host limitation, it is
   the strongest evidence in the set that the agent must check it mechanically rather than remember it.
2. **The most densely supported rule family in the whole set is operational routing** — SR-30 gathers
   ten independent formulations (OM-01/05/06/07/09/10/11/14/19/23 + PP-01/05/06). Hotels and hospitals
   are decided by routes, not by plans.
3. **Every domain independently refused to state an unsourced number.** Their `## Weak or contested`
   sections name the same gaps: no readable hotel BOH ratio, no readable lift-traffic constant, no
   readable span tables, no readable HCM flow rates, no per-element service-life table. The rule set
   therefore contains no invented numbers — and those specific quantities must be retrieved or
   assumed-in-the-open before use (SR-18, UN-03, UN-06).
4. **Efficiency is treated as a reported metric, never as an objective,** by economics (EC-21),
   lifecycle (LC-23), design-alternatives (DA-08), decision-making (DM-01) and validation (VA-21) —
   five domains, one conclusion (SR-29).
5. **The type card is the unit of transfer, not the rule.** Domains that cross-checked each other found
   the same rule inverting by occupancy: dead ends acceptable in hotels and severe in hospitals;
   detours intentional in retail; sightlines wanted in nurseries and forbidden in bedrooms; a plate
   depth fine for offices and fatal for wards. No rule in this file may be applied without its `Scope`
   (AG-07, SR-12, SR-29, and the type audits).
