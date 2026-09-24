# Research file — Multi-scale reasoning (vertical: City → Human, and Floor 01 → Floor N)

Scope: what must be decided ONCE for the whole building and then inherited by every floor, and
what may legitimately be decided locally. The failure this file prevents is the floor-by-floor
plan that is individually reasonable and collectively impossible — cores that drift, wet cells
over dry rooms, a stair that stops, lifts that cannot handle the peak hour.
Host grid: one independent 2D grid per floor, all sharing origin and tile size; 1 tile = 0.5 m;
tile states `walkable | blocked | door` only; a wall is one blocked tile; rooms are 4-connected
flood-fill with door cells in no room; vertical links are `portal`-tagged OBJECTS at
agent-chosen coordinates with interaction spots and queues (default patience 30 s); access by
role tags; NO heights, sections, slabs or columns. So every claim below is forced into one of two
testable forms: a **coordinate set** on the shared grid, or a **throughput** figure on a portal.

---

## Rules

### MS-01 Fix a vertical control grid before drawing floor 1
- Rule: Before any floor plan exists, freeze one global reference: module origin `(0,0)`, bay pitch in tiles, core footprint polygon, stair footprints, lift/portal coordinates and wet lines. Every floor is then drawn *into* that reference, never alongside it.
- Evidence: On this host the floors are independent grids that merely "share origin and tile size", so the only thing that can carry a decision between floors is a coordinate — that host fact alone is enough to make a control grid a necessity, and MS-01 stands on it. A previous external anchor to the CTBUH *Vertical Transportation: A Primer* was reached through a Scribd **index listing** (https://www.scribd.com/document/505853062/index) with no readable body; the publication exists (audit 05 C1 confirms CTBUH authorship) but no page this pass establishes the "design driver of the section" characterisation, so **that citation is no longer load-bearing and the claim is UNVERIFIED as an external statement**. Keep the rule; drop the citation.
- Source: host grid facts (task-verified — one independent 2D grid per floor, shared origin) is the entire basis of MS-01. The former CTBUH *Primer* citation via Scribd is retained only as a title reference: *UNVERIFIED* (Scribd index has no body; no publisher page read this pass).
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: High
- Grid translation: Emit `control_grid = {origin, bay_pitch_tiles, core_coords:Set<{x,z}>, stair_coords, portal_coords, wetline_coords}` before floor iteration and assert every floor's derived sets against it. Test: floors designed before the control grid exists = 0.
- Exceptions / failure mode: Single-floor or ground-only builds (the reference degenerates to one storey). Failure symptom: floors are each "finished" and no two agree on where the core is.

### MS-02 Publish a stacking diagram before any floor plan
- Rule: Produce one vertical list — every use, plant, parking, lobby and transfer level, in order, with the reason for each adjacency — and get it approved before tiles are placed. A floor plan inherits a level's role from this diagram; it may not invent one.
- Evidence: Programming literature makes the relationship matrix the pre-design artefact (see `architecture-theory.md` TH-01, WBDG https://www.wbdg.org/design-disciplines/architectural-programming, T1/T3); the stacking diagram is that matrix read along the vertical axis. Mixed-use tower documents routinely show the stack before the plates.
- Source: WBDG (NIBS/NIH), *Architectural Programming* — https://www.wbdg.org/design-disciplines/architectural-programming — T1/T3 (already cited in TH-01 of this skill).
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: High
- Grid translation: Require a per-floor label table `floor_roles[n] = {use, occupant_load, plant:boolean, wet:boolean, transit:boolean}` produced before geometry. Test: `every drawn floor has a role row; every role row is realised on a floor`.
- Exceptions / failure mode: Fully monofunctional towers (all floors one role) — the diagram still governs the plant/parking extremes. Failure symptom: a hotel floor appears above a gym because nobody asked where the gym's extract duct goes.

### MS-03 Carry the core footprint out of floor 1 unchanged
- Rule: The core is one coordinate set repeated on every floor it serves. It may change only at a declared transition level, and the change must be stated, not drifted into.
- Evidence: Positional fact, not opinion: on this grid the core's *only* representation is its tiles, so a 1-tile change per floor is 0.5 m per storey — 5 m of drift over 10 floors, which in a real building is a column misalignment and a bent riser at every junction. The rule stands on that host arithmetic plus structural continuity logic (columns carry load vertically; a riser cannot snake). **The external citation this file previously attached — CTBUH *Height Criteria* — has been REMOVED as evidence for this rule: audit 05 C4 confirms the document defines how a building's height and completion status are measured, not core-layout or services-continuity practice; keeping the citation would have been a wrong-document reference.**
- Source: host grid facts (task-verified); structural continuity logic (self-evident given load-carrying). *(No external citation — MS-03 no longer points at CTBUH Height Criteria; see Weak or contested.)*
- Class: FACT
- Scope: any building with a core
- Confidence: High
- Grid translation: `CORE_TEST: for each n>1, core_tiles(n) == core_tiles(n-1)` → pass = 100 % of floors identical; any inequality is a defect and the reported delta is `|symmetric_difference| / 2` tiles = metres of drift.
- Exceptions / failure mode: Legitimate tapering/setback cores at named transition floors (MS-22);podium cores that widen to serve the podium. Failure symptom: "the lift lobby moved" between floors 6 and 7.

### MS-04 One core per tower until the travel/efficiency bound, then split or double
- Rule: Start from a single core. Add a second core (or split the core into two lobes) only when measured: floor-plate depth from core face to façade exceeds the reach bound, or portal queue demand exceeds what one lobby can absorb.
- Evidence: The reason single cores stop working is travel distance to the lifts and the share of plate eaten by the core; the review literature on tall-building elevators frames core count/zone strategy (double-deck, sky lobby) as the response to plate size and population — *Tall Buildings and Elevators: A Review of Recent Technological Advances*, Buildings 5(3):1070, MDPI, https://www.mdpi.com/2075-5309/5/3/1070 (T2; **UNVERIFIED — automated fetch returned 403 in the audit pass and remains unread; no figure is taken from it here, only the strategy taxonomy the file already knew**).
- Source: MDPI Buildings 5(3):1070 — https://www.mdpi.com/2075-5309/5/3/1070 — T2 · **UNVERIFIED (link retrieved, text unread)** · core-count trigger thresholds: `UNCITED — heuristic`.
- Class: ENGINEERING CONSTRAINT
- Scope: towers and deep plates
- Confidence: Medium
- Grid translation: Per floor compute `max_octile_dist(core_face_tiles, façade_tiles)` in metres (tiles × 0.5) and `lobby_throughput = n_portals_adjoining_lobby × trips_per_hour`. Split-core test: flag any floor whose deepest tile exceeds the bound, or whose lobby portals show abandonment above threshold.
- Exceptions / failure mode: Narrow plates (hotel/residential slabs) never need a second core; a slim "bar" building's bound is met by one core at one end. Failure symptom: 60 m of walk to the lift from the far corner, or one lobby absorbing every trip in the building.

### MS-05 Cluster shafts and risers; never scatter them across the plate
- Rule: All vertical services (lifts, stairs, ducts, pipe risers, vent risers) live inside the core coordinate set or in a declared secondary cluster. A service with no cluster position does not exist.
- Evidence: Real consequence, grid-derivable: scattered shafts force long horizontal branch runs, which on a 2D-only grid become invisible; clustered shafts make branch reach a computable distance. On this grid, a door cell belongs to no room (`src/engine/npc/rooms.ts:2,15,33`), so a shaft that is not a blocked tile-set is not representable at all.
- Source: host grid facts (task-verified); shaft-clustering practice: UNCITED — heuristic (no tall-building services text retrieved in this pass).
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: High for the host grid facts (task-verified); Low for the shaft-clustering practice (UNCITED — heuristic) — was `FACT`; demoted: what is factual here is the host grid arithmetic (a door cell belongs to no room, so an untagged shaft is unrepresentable); "never scatter" is this file's design policy, and its real-world rationale was not sourced
- Grid translation: `SHAFT_TEST`: every tag in {lift, stair, wet-riser, vent-riser, duct} must have coordinates inside `core_coords ∪ secondary_clusters`. Pass = 100 %; report count and coordinates of orphans. Branch reach test: octile distance from every fixture-bearing room to its riser coordinate ≤ the branch bound.
- Exceptions / failure mode: Large plates and campus-type low-rise may legitimately use two service cores; a "shaft" that is only a portal object (this host's lifts) is exempt from blocked-tile representation but not from clustering. Failure symptom: a bathroom on floor 9 whose waste has no vertical line to the ground.

### MS-06 Stack wet cells on a single vertical drain line
- Rule: Every room carrying a water supply and waste (kitchen, WC, bathroom, laundry, plant) must sit within the wet-line coordinate column of the floors below down to the lowest drain. New wet cells are placed onto the existing column or the column is extended at a declared level — never relocated floor by floor.
- Evidence: Plumbing drain lines run by gravity and cannot snake through occupied space; a wet stack is by definition a continuous vertical pipe, so its plan position is fixed for the whole stack. The horizontal branch has a slope and therefore a limited reach, which is why kitchens and bathrooms cluster in real plans. No code text retrieved for this pass — the mechanism is stated as positional arithmetic; drain-slope figures: UNCITED — heuristic.
- Source: UNCITED — heuristic (mechanism is standard building-services practice; a plumbing code clause should be attached before this rule is used to grade work).
- Class: ENGINEERING CONSTRAINT
- Scope: any floor with water
- Confidence: High (mechanism) / Low (numbers)
- Grid translation: `WETLINE_TEST`: for each wet-room on floor n, `∃` wet-room on floor n-1 whose coordinate set is within `WET_TOLERANCE` tiles (recommended 2 tiles = 1.0 m) of a shared riser point; propagate down to the drain level. Pass = 0 violations. Report `(floor, room, missing_below)` triples.
- Exceptions / failure mode: Podium levels with a transfer drain (wet cells may be introduced/removed there, at the cost of a declared pump or raised floor); top-floor plant. Failure symptom: a bathroom over a server room, or a stack that must run through a living room.

### MS-07 Keep the structural bay grid continuous; treat every offset as a transfer
- Rule: The bay module — origin and pitch — is inherited unchanged. Where a lower level needs a different grid (parking, retail, lobby), the change happens on one declared transfer level, is drawn as a named feature, and is counted.
- Evidence: Columns carry load downward, so a column that cannot continue must be terminated on a structure that redistributes it — the "transfer" in transfer-structure/podium-tower work. This grid has no columns, so the only honest proxy is the tile module: a pitch change is a coordinate-set discontinuity. Transfer-structure literature: not retrieved in this pass — UNCITED — heuristic.
- Source: UNCITED — heuristic (structural transfer concept is textbook; no URL fetched this pass).
- Class: ENGINEERING CONSTRAINT
- Scope: universal
- Confidence: High (continuity) / Low (transfer detail, unmodellable here)
- Grid translation: `BAY_TEST`: `module_origins(n) == module_origins(n-1)` and `pitch(n) == pitch(n-1)` for all n except `transfer_levels`, which must be an explicit list. Pass = drift ≤ 0 tiles outside transfer levels. Report `Σ|pitch(n)-pitch(1)|` per floor.
- Exceptions / failure mode: Declared transfer levels; site-constrained ramping in parking. Failure symptom: each floor's grid a little different, and no room aligns anywhere — MS-14 fails silently.

### MS-08 Egress stairs run in one unbroken vertical line with a continuous enclosure
- Rule: Stair coordinates are identical on every floor from the topmost occupied level to the discharge level, and the enclosure wall tiles are unbroken. A stair that offsets, stops, or becomes a corridor on some floors is a defect, not a design variation.
- Evidence: Codes require the exit stairway to be continuous to a point of exit and the enclosure to be protected (2018 IBC Chapter 10 *Means of Egress*, https://codes.iccsafe.org/content/IBC2018P4/chapter-10-means-of-egress, **fetch blocked 403 to automation both in the audit pass and this remediation — cited "by chapter" only, UNVERIFIED at clause level**; NIST/Bukowski, *The basis for egress provisions in U.S. building codes*, https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=861281, T1/T2 — search-surfaced, PDF not opened this pass).
- Source: **UNVERIFIED at clause level for both** — ICC IBC Ch. 10 — T1 (dead to automation) · NIST egress-basis paper — https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=861281 — T1/T2 (not opened). Read a human-session ICC page or an equivalent state-adopted edition before quoting a section number downstream.
- Class: CODE REQUIREMENT (clause unverified)
- Scope: multistorey
- Confidence: High
- Grid translation: `STAIR_TEST`: `stair_coords(n)` constant across n; enclosure ring contiguous (no gap tile other than door tiles); every floor has a `walkable` tile adjacent to the stair door; discharge floor reaches the site exit set. Pass = 100 %; report floors where a stair tile-set differs or the ring breaks.
- Exceptions / failure mode: Stairs open to the floor below / extended-discharge stairs where permitted — then the discontinuity is itself the declared design and must be tagged. Failure symptom: floor 12 evacuates into a lobby, not a stair.

### MS-09 Bridge every stair discontinuity with an area of refuge
- Rule: Wherever a stair does not continue, or the number of stairs changes, or a floor is served by lifts only, provide a protected refuge coordinate set on that floor, sized to the floor's occupant load, and reachable without passing through the hazard.
- Evidence: Areas of refuge exist precisely to break the "everyone down one stair" assumption for people who cannot use stairs; the requirement is keyed to stair discontinuity and non-visible discharge. **Two of the URLs supporting this rule were dead / unextractable in the audit pass and remain UNVERIFIED: NFPA's explainer *Unraveling the Area of Refuge Requirements* (https://www.nfpa.org/news-blogs-and-articles/Blogs/2023-03-13/Unraveling-the-Area-of-Refuge-Requirements) returned 404 to a re-fetch this pass and is treated as a dead citation; the UK *Guidance on the emergency use of lifts or escalators for evacuation* PDF is reached through a campaign mirror (https://highrisefire.co.uk/docs/guidanceemergemcylifts.pdf) that is not machine-extractable, and is downgraded from T1 to T3 (mirror, not official text).** The provision itself is uncontroversial in substance, but no clause number, edition, or dimension is confirmed by any page this skill can read.
- Source: **UNVERIFIED (both URLs)** — NFPA 101 (by edition) via 404 blog link — T1 demoted to T2 (dead) · DCLG-linked lift-evacuation guidance via highrisefire.co.uk — T1/T3 demoted to T3 (campaign mirror, not official text). Substitute before scoring: the NFPA 101 §7.5.2 / §1009 text or IBC §1009, read directly.
- Class: CODE REQUIREMENT (clause unverified)
- Scope: accessible egress, any stack
- Confidence: High (existence) / Medium (numbers, unverified) — class kept: the refuge duty at a stair discontinuity is a real NFPA 101 provision, while the admitted gap is the per-person refuge area and reach bound in the Grid translation below (UNCITED), not the requirement the rule states; the NFPA explainer URL 404'd this pass, so the class rests on the provision's existence, not on read clause text
- Grid translation: `REFUGE_TEST`: at every floor where `stair_coords` discontinuity or stair count < 2, require a tagged refuge tile-set of area ≥ `occupant_load(n) × refuge_area_per_person` (per-person figure: UNCITED — heuristic, Low, verify against NFPA 101/IBC), with ≥ 1 walkable path to it of length ≤ the refuge reach bound (in tiles × 0.5 m). Pass = 0 discontinuity floors without a compliant set.
- Exceptions / failure mode: Buildings where every stair is continuous and visible throughout; single-stair low-rise types where code allows. Failure symptom: an evacuation plan that assumes all lift users walk down 20 floors.

### MS-10 Dimension lifts by peak-period handling capacity, not by population ÷ speed
- Rule: State the traffic period to be served (morning up-peak, two-way/lunch, down-peak, hotel checkout), compute demand for the worst period, and size the portal count so that handling capacity and waiting time meet a declared target. Every figure that is a rule of thumb must be labelled as such.
- Evidence: Traffic analysis is a defined discipline with named measures — handling capacity (share of population served in five minutes), average waiting interval, round-trip time — and the literature is explicit that up-peak is not the only case. **All three supporting URLs are unread this pass: *Beyond the Up Peak*, symposium paper at The Lift and Escalator Library (https://liftescalatorlibrary.org/paper_indexing/papers/00000430.pdf, PDF binary not extractable); Stráková, *Elevator Traffic Simulation Procedure* (https://www.researchgate.net/publication/31598080_Elevator_Traffic_Simulation_Procedure, page not opened); AdSimulo vendor exposition (https://adsimulo.com/support/adsimulo-university/basics-of-lift-traffic-analysis/, T4, content not machine-extractable).** The *definition* of HC as the percentage of a building's population transported in the peak five minutes is standard traffic-analysis vocabulary (audit 05 C2 confirms), so the method framing is not at risk; but **no page read establishes any numeric threshold here**, and the CTBUH *Primer* previously invoked as authority for the method was reached only via a Scribd index (see MS-01). Numeric limits are the file's own.
- Source: Lift & Escalator Library (CIBSE-linked proceedings) — **UNVERIFIED (PDF binary)** · Stráková — **UNVERIFIED (page not opened)** · AdSimulo — **UNVERIFIED (T4, not extractable)**. The authoritative home is CIBSE Guide D §2 (or equivalent published HC/interval table), not retrieved.
- Class: DESIGN PRINCIPLE
- Scope: any lift-served stack
- Confidence: Medium (method High, numbers Low) — was `STANDARD`; demoted: the traffic-analysis sources are T2 and were not readable in this pass, so the named measures (handling capacity, average waiting interval, round-trip time) are discipline vocabulary reported here rather than quoted from an opened standard; the "label every rule of thumb" limb is this skill's own rule
- Grid translation: For each portal: `supply_per_hour = car_load × 3600 / RTT_tiles` where `RTT_tiles` is the agent's modelled stop+travel cost (no heights on this grid, so it is a parameter, not a measurement — declare it). Building test: `Σ supply over portals in lobby ≥ peak_period_demand` AND `abandonment_rate(queue, patience 30 s) ≤ target`. Percentage/interval targets: UNCITED — heuristic, Low.
- Exceptions / failure mode: Low-rise with a stair alternative; buildings where lifts are decorative (no occupant load). Failure symptom: 20 agents queue at a 2-portal lobby and half give up each cycle.

### MS-11 Guarantee stop coverage: every floor served, every destination within a walking bound
- Rule: Declare the portal groups (which floors each group stops at, which lobby each group serves) before placing portals, and check that no occupied floor is unserved and no tile is further than the lobby-walk bound from the portal group that serves its floor.
- Evidence: Zoning/sky-lobby and double-deck strategies exist to keep stop count and travel time bounded as stacks grow (MDPI review above, T2, cited for the strategy taxonomy only — figures not taken). On this grid, an un-stopped floor is simply a floor with no portal: unreachable except by other agents.
- Source: MDPI Buildings 5(3):1070 — https://www.mdpi.com/2075-5309/5/3/1070 — T2 (link retrieved, text unread) · strategy detail: UNCITED — heuristic.
- Class: DESIGN PRINCIPLE
- Scope: multi-group or zoned stacks
- Confidence: Medium — was `STANDARD`; demoted: the review is cited for the strategy taxonomy only (figures not taken), and "declare the stop groups before placing portals, then check coverage" is this file's procedure for the host, not a requirement stated by any standard
- Grid translation: `COVERAGE_TEST`: build `served(n) = {portals with floor n in stops}`; fail if `served(n) = ∅` for any occupied n. `WALK_TEST`: for each floor, `min over p in served(n) of octile_dist(tile, p.interaction_spot) × 0.5 ≤ lobby_walk_bound` (bound value: UNCITED — heuristic, Low). Pass = 0 unserved floors, 0 over-bound tiles.
- Exceptions / failure mode: Plant/parking floors intentionally served by a freight/stair-only group. Failure symptom: a resident on floor 18 whose only portal group starts at floor 20.

### MS-12 Do not stack a noise- or vibration-sensitive use under a plant or transit floor
- Rule: Any floor whose tiles lie under a plant room, lift machine/queue cluster, gym, kitchen or car park carries an interference penalty; sensitive uses (sleeping, working, quiet) may not be placed there without a declared isolated transition level.
- Evidence: Structure-borne sound and vibration travel down through slabs, so the constraint is one-directional (source above, victim below) — this asymmetry is why plant sits at the top or on a dedicated level. Also directly relevant to this host: queues are audible, visible failure — an agent waiting at a portal over a "bedroom" tile is the same defect as a real lift motor room over a hotel room. Isolation figures: UNCITED — heuristic.
- Source: UNCITED — heuristic (mechanism standard; no acoustics text retrieved in this pass — attach a source before scoring with this rule).
- Class: FACT
- Scope: universal
- Confidence: High (direction of harm) / Low (limits)
- Grid translation: `STACK_PENALTY_TEST`: `sensitive_tiles(n) ∩ (plant_or_transit_tiles(n+1) dilated by K tiles)` must be empty; K = the interference radius (declare; start 2 tiles = 1.0 m). Pass = 0 overlap, or overlap covered by a tagged isolation level at n+ε.
- Exceptions / failure mode: Declared isolated transition/skeleton floors; single-storey plant in the same room as its victim (riser next to a WC — acceptable, WC next to a riser — acceptable). Failure symptom: half the hotel rooms "unbookable" because a chiller sits above them.

### MS-13 Programme stack order: parking below, podium mid, tower above, plant at the extremes
- Rule: Order the stack by load, services and egress, not by preference: heavy/vehicular and service levels low, public/retail at the access level, quiet long-span uses in the tower, plant at the top or immediately above a transfer level.
- Evidence: This is the standard mixed-use tower section; podium-and-tower is a named typology across tall-building publications. **The external citation this file previously attached — CTBUH *Height Criteria* — has been REMOVED as evidence for stack order: audit 05 C4 confirms the document defines how a building's height and completion status are measured and classifies function only insofar as awards need it, which is not a stack-order or services-continuity authority.** The rule stands on typology convention plus load-based reasoning: parking needs ramps and a short vertical distance; plant needs a discharge path to air.
- Source: order-of-loads rationale + typology convention: `UNCITED — heuristic`. *(No external citation — MS-13 no longer points at CTBUH Height Criteria; see Weak or contested.)*
- Class: BUILDING-TYPE CONVENTION
- Scope: mixed-use towers
- Confidence: Medium (was High with CTBUH Height Criteria citation; that citation was a wrong-document reference and is removed, so the rule now rests on convention only).
- Grid translation: `ORDER_TEST`: assert role ordering `parking ⊂ floors ≤ podium_top < tower_base ⊆ sensitive floors`, and `plant_levels ∈ {top} ∪ {declared transfer levels}`; assert `wetline(n)` continuous through every wet use. Pass = 0 out-of-role levels.
- Exceptions / failure mode: Tower-over-retail with retail above grade only, podium-roof gardens, industrial buildings where everything is at grade. Failure symptom: offices under a car park, or a top-floor restaurant with no drain below it.

### MS-14 Repeat the module with zero drift: identical coordinates floor to floor
- Rule: For repeated-floor types (hotel, residential, cellular office, wards) the module is one prototype tile-set and it is instantiated at the same coordinates on every typical floor. One tile per floor is 0.5 m per storey and 0.5n m cumulative — never "close enough".
- Evidence: Grid arithmetic (exact, host-specific): cumulative offset after n floors of 1-tile drift = `0.5n` m; at 20 floors that is 10 m, more than a structural bay. Real repeated-module construction (formwork, prefab cassettes, stacked bathrooms) requires the offset to be zero or declared. Drift is also what MS-03/MS-06/MS-07 detect.
- Source: host grid facts (task-verified); prefab/formwork practice: UNCITED — heuristic.
- Class: FACT
- Scope: repeated-floor types
- Confidence: High for the host grid facts (task-verified); Low for the prefab/formwork drift rationale (UNCITED — heuristic)
- Grid translation: `DRIFT_TEST`: `prototype_tiles ⊕ offset(n) == tiles(n)` must hold with `offset(n) = (0,0)`; report `offset(n)` per floor and the cumulative `Σ|offset|` in metres. Pass = all offsets zero outside declared transition levels.
- Exceptions / failure mode: Deliberately rotating/stepped plates (screwing towers) — then the rotation is a declared feature and the core, wet line and stairs still obey MS-03/06/08. Failure symptom: every floor "slightly different", no stack alignment anywhere, and all downstream tests fail.

### MS-15 Derive the façade rhythm from the bay module, never the reverse
- Rule: The façade module is a divisor or multiple of the structural bay, so a mullion line never lands on a column face or a core wall. Where the plate steps, the rhythm resets at the step, not mid-bay.
- Evidence: Positional necessity: the perimeter structure is where the façade attaches, and the column line is set by MS-07. On this grid the façade is the outermost ring of tiles of a floor's plate, so "rhythm" is measurable as the spacing of its door/window-tagged tiles and the plate's corner coordinates.
- Source: UNCITED — heuristic (module-coordination principle is textbook; no source fetched in this pass — attach Ching/Hugo or an curtain-wall guide before using this to grade).
- Class: DESIGN PRINCIPLE
- Scope: universal (visible only where a façade is modelled)
- Confidence: Medium
- Grid translation: `RHYTHM_TEST`: `perimeter_tag_spacing(n) mod bay_pitch == 0` on every floor and `perimeter_ring(n) == perimeter_ring(n-1)` outside transitions; report floors where tag spacing is not an integer multiple of pitch.
- Exceptions / failure mode: Curtain walls expressed as a rainscreen independent of the frame (real) — on this grid that distinction does not exist, so keep the test. Failure symptom: the module changes between floors 8 and 9 for no reason.

### MS-16 Make the accessible route continuous across every floor boundary
- Rule: Every portal used on an accessible route must have (a) a step-free, door-width-compliant approach on both floors, (b) an interaction spot that is `walkable` and unobstructed, and (c) access rights that do not exclude the role travelling it. One blocked tile on the approach breaks the whole building's accessible route.
- Evidence: Accessibility codes require an accessible route connecting accessible entrances, elevators and each floor's accessible spaces, and require clear floor space at doors and car entries (IBC Ch. 11 with ICC A117.1; ADA 2010 Standards §206, §403, §407). **Not fetched this pass; the file's §206/§403/§407 guess is UNVERIFIED (audit 05 C3) — plausible but no section number was confirmed, so it must not travel as a citation.** Verify against https://www.access-board.gov/ada/ (T1) before any tile test quotes a section. **One dimension in the grid translation below is stricter than the standard: a 3×3-tile clear space (1.5 m square) is not the code minimum — ADA §407 uses a 60 in (1.525 m) turning *circle*, which a square 1.5 m encloses. Treat the 3×3 as a project-set conservative clearance, not a code value.**
- Source: **UNVERIFIED** — US Access Board, ADA 2010 Standards — https://www.access-board.gov/ada/ — T1 (not fetched in this pass; listed for follow-up). No section number is quotable from the URL as cited.
- Class: CODE REQUIREMENT (clause unverified)
- Scope: universal
- Confidence: High (requirement) / Medium (clause numbers unverified)
- Grid translation: `ACCESS_TEST`: for each accessible-role traversal, path exists in `walkable ∪ door` tiles from accessible entrance → lobby → portal interaction spot (floor n) → portal → spot (floor n+1) → destination room, with door runs ≥ 2 tiles (1.0 m) and a clear 3×3-tile (1.5 m) space at the spot. Pass = 100 % of accessible destination pairs reachable; report the first broken link.
- Exceptions / failure mode: Staff-only plant and service levels; single-storey buildings. Failure symptom: an "accessible" floor 7 whose only door to the lift lobby is 1 tile wide.

### MS-17 Reserve vertical expansion capacity at phase 1
- Rule: Decide phase 1 with the future stack's worst-case numbers: the core, portal count, stair width and wet line must already be sized for the final building, with the unused capacity tagged and empty rather than built over.
- Evidence: Retrofitting a shaft is the expensive move in tall-building work — position is fixed by the structural core and the drain; the same reasoning drives "skeleton and services first" statements in the architecture-theory file (`architecture-theory.md`, change/SD layering; WBDG accessibility/programming pages cited there).
- Source: WBDG (NIBS/NIH) — https://www.wbdg.org/design-disciplines/architectural-programming — T1/T3 (via TH-01) · capacity-reservation practice: UNCITED — heuristic.
- Class: DESIGN PRINCIPLE
- Scope: phased work
- Confidence: High for the programming discipline (WBDG, cited via TH-01); Low for the phase-1 capacity-reservation practice (UNCITED — heuristic)
- Grid translation: At phase 1 compute `required_core_tiles(final_stack)`, `required_portals(final_stack)`, `wetline(final_stack)`; assert the phase-1 core/wet/stair sets are supersets of the reserved coordinate sets (reserved tiles may be `blocked`, never occupied by another use). Pass = reserved set intact.
- Exceptions / failure mode: One-phase builds; renovations where the final state is now. Failure symptom: phase 2 needs a new stair in a floor that is already let.

### MS-18 Run the alignment checks on coordinates, not on intent
- Rule: Vertical alignment claims are only admissible as computed coordinate comparisons. No rule in this file may be satisfied by an assertion in prose or by a comment saying "core is aligned".
- Evidence: Self-evident given MS-01/MS-03/MS-06/MS-07/MS-14: each is a set-equality or a distance test. On this host, `deriveFloorRooms` excludes door cells from every room (`src/engine/npc/rooms.ts:2,15,33`), so even the room inventory must come from the grid, not from naming.
- Source: host code facts (`src/engine/npc/rooms.ts:2,15,33`, verified in `architecture-theory.md` TH-02).
- Class: CODE REQUIREMENT (of this project's tests)
- Scope: this build
- Confidence: High
- Grid translation: Implement the checklist below as one function per row, each returning `{pass:bool, offenders:[{floor,x,z,delta}]}`; wire into the domain validation path so a floor cannot be committed when a check fails.
- Exceptions / failure mode: None for geometry. Throughput checks may be sampled rather than exhaustive when the floor count is large.

### MS-19 Control the core-to-plate ratio; it is the efficiency number
- Rule: Measure `core_area / gross_floor_area` per floor and keep it inside a declared band. If the band is exceeded, change the core strategy (MS-04), not the reporting.
- Evidence: Core efficiency is the accepted metric for lettable area and is the number landlords quote; the trade-off against travel distance is what makes MS-04's trigger real. Band values differ by market, shape and code regime and none was retrieved here — UNCITED — heuristic, Low.
- Source: UNCITED — heuristic (BOMA-style efficiency concepts; attach a BOMA/CTBUH measurement source before grading).
- Class: HEURISTIC
- Scope: towers and any multi-floor plate
- Confidence: Medium (metric) / Low (band) — was `STANDARD`; demoted: core-to-plate is a market metric, not a standard's requirement, and the evidence states no band was retrieved (UNCITED — heuristic); measure the ratio and hold a declared band, but the band number is this project's
- Grid translation: `CORE_RATIO(n) = |core_tiles(n) ∪ lobby_tiles(n)| / |floor_plate_tiles(n)|`, all areas in tiles (× 0.25 m² to report m²). Pass = band test per floor plus `|CORE_RATIO(n) - CORE_RATIO(n-1)| ≤ 0.02` unless n is a transition level (a ratio jump usually reveals a drifting core).
- Exceptions / failure mode: Very shallow plates where the core is unavoidably a high share; industrial. Failure symptom: efficiency reported at 12 % while the counted core is 31 %.

### MS-20 Distribute services as riser + horizontal zone, one riser per service per cluster
- Rule: Each service (supply cold, supply hot, waste, vent, supply air, extract, fire) gets one named riser coordinate per cluster, and floors are fed in declared horizontal zones from those risers. Branch length is a budget, not an accident.
- Evidence: Riser count drives shaft size (hence MS-05 and MS-19), and horizontal run length drives pressure drop and, for drains, the fall required — the reason tall buildings zone their services. Zone-height figures: UNCITED — heuristic.
- Source: UNCITED — heuristic (services zoning mechanism; no services text retrieved this pass).
- Class: ENGINEERING CONSTRAINT
- Scope: universal
- Confidence: High (structure of the rule) / Low (zone numbers)
- Grid translation: `RISER_TABLE`: `{service → {cluster → coordinate}}`, identical for all floors in the cluster's range; test 1: coordinate constant; test 2: for every fixture-tagged room, `octile_dist(room, its service riser) × 0.5 ≤ branch_bound(m)`; test 3: `riser_count × services ≤ shaft_tiles` capacity declared. Pass = 0 unmapped services.
- Exceptions / failure mode: Point-source services (a lone roof plant room); dry floors. Failure symptom: a "vent" that exists on three floors and vanishes on two.

### MS-21 Two independent vertical egress paths from every occupied floor
- Rule: Unless a code exception is invoked in writing, every occupied floor needs two stairs separated so that one cannot disable both, plus a continuous path to discharge. Distance between stair doors is part of the check.
- Evidence: Two exits from each story is a core egress provision, with distance/separation logic to prevent a single hazard blocking both (2018 IBC Ch. 10, https://codes.iccsafe.org/content/IBC2018P4/chapter-10-means-of-egress, **fetch blocked 403 to automation — no clause number, edition, or separation figure is confirmed; UNVERIFIED**; basis discussed in NIST/Bukowski, https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=861281, T1/T2, PDF not opened this pass; single-stair exceptions exist for limited heights/areas and for some residential types).
- Source: ICC IBC Ch. 10 — **UNVERIFIED (dead to automation)** · NIST — https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=861281 — T1/T2 (not opened). Substitute a human-session read before quoting a separation figure downstream.
- Class: CODE REQUIREMENT (clause unverified)
- Scope: multistorey
- Confidence: High for the two-exit requirement (cited); Low for the stair separation bound (UNCITED — heuristic, derive it from the code clause)
- Grid translation: `EXIT_TEST`: per occupied floor, `|stair_sets| ≥ 2` and `min_octile_dist(stairA_door, stairB_door) × 0.5 ≥ separation_bound` (bound: derive from the code clause; UNCITED — heuristic), and both stairs pass MS-08 continuity to the discharge floor. Pass = 0 floors with one stair unless tagged `single_stair_exception` with the clause.
- Exceptions / failure mode: Code-permitted single-exit buildings (low-rise, small area, limited occupant load) — must be declared per floor and justified. Failure symptom: two stair doors side by side in one lobby, which is one exit wearing two hats.

### MS-22 Handle the podium-to-tower transition explicitly
- Rule: The level where the tower leaves the podium is a named feature with a declared reason: it changes the plate, the core, the wet line, the egress count or the structural module — and each change is checked against MS-03/06/07/08. Nothing drifts at the transition because "the shape changed".
- Evidence: Podium-and-tower is the dominant mixed-use tall form; the transition is where transfer structure, setback daylight/wind effects and re-routing of drains and stairs concentrate. **Audit 05 C1 flagged the file's "Council on Tall Buildings and Urban Habitat — verticalurbanism.org" attribution as a third-party journal site, but a re-probe this pass confirms https://www.ctbuh.org/publications redirects to https://verticalurbanism.org/publications, i.e. verticalurbanism.org is CTBUH's current publishing home (2026-09) — the domain attribution is correct, though the article-level text still was not extracted.** No specific numeric claim is taken from the site; documented examples describe the mechanism only.
- Source: CTBUH (via verticalurbanism.org — confirmed by redirect, 2026-09) — https://verticalurbanism.org/ — T3 (site-level; **specific article UNVERIFIED, not extracted this pass**).
- Class: BUILDING-TYPE CONVENTION
- Scope: podium-and-tower
- Confidence: Medium
- Grid translation: Require `transition_levels = [n…]`; for each, emit `delta_core`, `delta_wetline`, `delta_stairs`, `delta_bay` as tile deltas, and require every non-zero delta to have a reason string. Test: floors outside `transition_levels` show zero deltas (else it is drift, not transition).
- Exceptions / failure mode: Towers without a podium (core runs straight down to parking) — then the only transitions are the plant and parking levels. Failure symptom: a "justified" transition used as an excuse for two tiles of drift.

### MS-23 Model each portal as a queue with an explicit service rate
- Rule: Every portal declares `car_load`, `trips_per_hour` (or the RTT parameter that yields it) and `queue_patience`. Undeclared means the defaults, and defaults must be reviewed against the stack's occupant load, not left to the engine.
- Evidence: Host facts (task-verified): portals carry queues with interaction spots and a default patience of 30 s, so an under-supplied stack produces abandonment after 30 s of waiting — the failure is observable, which is what makes it testable. Queueing behaviour with abandonment is standard (Erlang-style loss systems); no formula claimed here.
- Source: host facts (task-verified, `portal` objects and 30 s default patience) · queueing-with-abandonment theory: UNCITED — heuristic.
- Class: ENGINEERING CONSTRAINT
- Scope: this build
- Confidence: High for the host facts (task-verified portal objects and 30 s default patience); Low for the queueing-with-abandonment theory (UNCITED — heuristic)
- Grid translation: Per portal per peak window compute `utilisation = arrivals_per_hour / (car_load × trips_per_hour)`, `abandonment_rate`, `mean_wait`. Pass: `utilisation ≤ 0.85`, `abandonment_rate ≤ 5 %`, `mean_wait ≤ 30 s` (thresholds are this skill's declared defaults, HEURISTIC, Low — tune per project). Fail the stack if any portal is at 100 % abandonment while another is idle (MS-11 miscoverage).
- Exceptions / failure mode: Emergency or staff-only portals with low legitimate traffic. Failure symptom: agents standing in a lobby until they lose patience and reroute.

### MS-24 Measure vertical connectivity, don't assert it
- Rule: Compute a per-floor connectivity/integration value over the portal graph and compare across the stack; a floor that is "well connected" only in adjectives is not connected.
- Evidence: Multi-level space syntax work shows that vertical links dominate perceived and actual connectivity in multi-storey buildings, and that adding a link changes integration on every other level — i.e. the plan consequence of a portal is global (Al-Subbani & Penn, *Challenges in Multilevel Wayfinding: A Case Study with the Space Syntax Technique*, Environment and Planning B, https://journals.sagepub.com/doi/10.1068/b34050t, T2; 3-D extension: *Spatial complexity and wayfinding: extending space syntax to three dimensions*, https://arxiv.org/pdf/2012.14419, T2).
- Source: Al-Subbani & Penn (EPB) — https://journals.sagepub.com/doi/10.1068/b34050t — T2 · arXiv 2012.14419 — T2 (both link-retrieved; figures not extracted).
- Class: DESIGN PRINCIPLE
- Scope: public/mixed stacks, anything with visitors
- Confidence: Medium
- Grid translation: Build graph over nodes `(floor, walkable_tile)` with horizontal edges (octile cost) and portal edges (interaction spot pairs + wait cost). Report per floor: `integration`, `reachable_floors_within_T`, `betweenness_of_portal`. Pass: every occupied floor reachable from the entrance within the declared time budget `T`; no floor reachable only through a role-tag the public lacks.
- Exceptions / failure mode: Segregated-service or secure buildings where low connectivity is the point. Failure symptom: floor 3 reachable only from floor 5, so a public route crosses private space.

---

## Scale ladder

| Scale | Decides (once, here) | Inherits | Must NOT be re-decided below |
| --- | --- | --- | --- |
| City | Plot ratio, height cap, transit-node position, district evacuation capacity | — | anything; these are inputs |
| Site | Footprint, access/servicing point, appliance and drop-off space, setback lines, open space | City caps | footprint shape is not a floor plan |
| Building | Core type and count, bay module, stack order, vertical circulation strategy, façade module, phase limits | Site + caps | plate floors do not move the core |
| Floor | Core/stair/portal/wet coordinates, portal groups and queue parameters | Building grid + core | core, bay grid, wet line, stair line |
| Zone | Adjacency groups, corridor spine, branch reach | Floor's riser and core positions | riser location, structural line |
| Room | Shape, fixtures, capacity, door position in its own wall | Zone adjacency + wet line | whether a wet cell may sit here at all |
| Furniture | Layout and clearances | Room boundary and door | room boundary |
| Human | Body dimensions, reach, wheelchair turning circle, queue patience, walking speed | all of the above | nothing — it is the constant |

**The failure of designing floors independently**: each floor optimised alone gives a core that
drifts 1 tile per storey (= 0.5 m/floor, 0.5n m after n floors), a drain that must bend through
occupied rooms, a stair that terminates at a level, lifts whose lobby is not where the crowd is,
and a room that is legal on floor 4 and illegal on floor 5. Nothing in any local plan is wrong;
the building is. Inheritance is the fix: floor *n* asks floor *n−1* where things are, and only
the declared transition levels are allowed to answer differently.

---

## Vertical stacking model

There is no section on this host, so stacking is coordinate equality plus queue arithmetic. The
three abstractions that replace heights:

- **Alignment = set equality.** A shaft, core, stair or wet cell is a coordinate set per floor:
  `A(n) ⊂ ℤ²`. Aligned ⟺ `A(n) = A(n−1)`. Drift is `|A(n) △ A(n−1)|/2` tiles, i.e. metres × 0.5.
- **Continuity = graph path.** A vertical route exists ⟺ the portal graph over
  `(floor, tile)` pairs has an unbroken path; a floor with no portal is a different building.
  Refuge/egress continuity (MS-08/09/21) is the same test with the stair edges only.
- **Capacity = throughput vs patience.** Demand is persons per peak window; supply is
  `Σ portals × car_load × trips/hour`. With 30 s patience, under-supply surfaces as
  abandonment — the correct, observable place for the failure to appear (MS-10/MS-23).
- **Loads become adjacency penalties.** What a real section expresses as weight, stiffness and
  structural sound becomes a coordinate-overlap test (MS-12) and a declared transfer level
  (MS-07, MS-22). Anything needing a true slab depth, span or fall is out of reach on this grid
  and must be reported as a modelling gap, not faked.

---

## Cross-floor consistency checklist

All tests are stated as coordinate-set or throughput checks (MS-18 makes them mandatory). The `Pass threshold` column mixes two kinds of value: coordinate-set checks (C-01..C-05, C-07..C-13, C-15..C-18) are geometrically exact and need no external authority; throughput and separation rows C-06 and C-14 carry **declared project targets**, not standards — audit 05 C2/C5 flagged the previous phrasing as presenting heuristic numbers as verification thresholds. Those rows are relabelled below with the datum that would set them properly.

| # | Test | Definition | Pass threshold |
| --- | --- | --- | --- |
| C-01 | Core footprint | `core(n) == core(n−1)` per floor | 0 differing tiles on non-transition floors |
| C-02 | Stair line | `stairA(n) == stairA(n−1)`, same for B, ring contiguous | 100 % of floors carry both stairs, ring gaps = 0 (excluding door tiles) |
| C-03 | Egress separation | `dist(stairA_door, stairB_door)` | ≥ declared separation bound on every occupied floor |
| C-04 | Portal stack | same coordinates in `portal_coords(n)` for every served n | 100 %; unserved occupied floors = 0 |
| C-05 | Stop coverage | `served(n) ≠ ∅` for occupied n; lobby walk distance | every floor ≥ 1 portal; max walk ≤ `lobby_walk_bound` |
| C-06 | Portal throughput | `utilisation`, `abandonment_rate`, `mean_wait` per portal | **Declared project target (HEURISTIC, Confidence Low — not a standard):** util ≤ 0.85, abandon ≤ 5 %, wait ≤ 30 s. Set properly from a published handling-capacity / interval table (CIBSE Guide D §2, or equivalent traffic-analysis text carrying the 5-minute definition); until then no scoring weight attaches. |
| C-07 | Wet line | wet-room coordinate ∩ wet column of floor below | 0 orphan wet rooms, tolerance ≤ 2 tiles (1.0 m) |
| C-08 | Risers | one coordinate per service per cluster, all floors | 0 moved risers; branch reach ≤ bound on 100 % of fixture rooms |
| C-09 | Bay module | `pitch(n)`, `origin(n)` | identical; changes only on listed transfer levels |
| C-10 | Module drift | `offset(n)` from the prototype | `offset(n) = (0,0)`; cumulative Σ ≤ 0 tiles |
| C-11 | Façade rhythm | `perimeter_tag_spacing mod pitch` | remainder 0 on every floor |
| C-12 | Accessible route | walkable/door path through portals, door ≥ 2 tiles, clear space 3×3 | 100 % of accessible destination pairs reachable |
| C-13 | Refuge provision | refuge set at every stair discontinuity | discontinuity floors without refuge = 0 |
| C-14 | Sensitive-under-source | `sensitive(n) ∩ dilate(plant/transit(n+1), K)` | **Declared project target (HEURISTIC, Confidence Low — not a compliance test):** empty, or overlap covered by an isolation level declared at n+ε; `K = 2 tiles` is a modelling choice. Set properly from a structure-borne-sound / vibration criterion (dB or particle-velocity limits for the receiving use — none retrieved in Domain C's corpus). |
| C-15 | Core-to-plate | `core_area/plate_area` per floor | inside declared band; floor-to-floor change ≤ 0.02 |
| C-16 | Role order | `floor_roles` vs `ORDER_TEST` | 0 out-of-role levels; plant in top set or declared transfer |
| C-17 | Expansion reserve | reserved coordinate sets intact at phase 1 | reserved set ⊆ built set, overlap with other uses = 0 |
| C-18 | Vertical connectivity | portal-graph reachability within time budget `T` | every occupied floor reachable from entrance within T |

---

## Sources

T1 — official / published guidance (retrieved as links this pass; several blocked automated
reading, marked so, and needing clause-level verification):

1. ICC, *2018 IBC Chapter 10 — Means of Egress* — https://codes.iccsafe.org/content/IBC2018P4/chapter-10-means-of-egress — **UNVERIFIED**: fetch returned 403 in the audit pass and again this remediation; provisions cited by chapter only, no clause number or dimension confirmed. Used for MS-08, MS-09, MS-21 (each now labelled "clause unverified").
2. NIST (Bukowski), *The basis for egress provisions in U.S. building codes* (PDF) — https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=861281 — **UNVERIFIED**: found via search, PDF not opened. Used for MS-08, MS-21.
3. NFPA, *Unraveling the Area of Refuge Requirements* (2023-03-13) — https://www.nfpa.org/news-blogs-and-articles/Blogs/2023-03-13/Unraveling-the-Area-of-Refuge-Requirements — **DEAD (404) — removed as a load-bearing citation**: re-fetched this pass and still 404; audit 05 C3 also demoted the marketing-blog tier. Used only for MS-09 concept, not clause. Substitute before scoring: NFPA 101 §7.5.2 / IBC §1009 read directly.
4. *Guidance on the emergency use of lifts or escalators for evacuation* (DCLG-linked, PDF mirror) — https://highrisefire.co.uk/docs/guidanceemergemcylifts.pdf — **UNVERIFIED (mirror, not official text)**: PDF not machine-extractable, and a campaign-site mirror is not the authoritative path; audit 05 C3 downgrades from T1. Used for MS-09, MS-10, MS-23 concept only.
5. US Access Board, *ADA 2010 Accessibility Standards* — https://www.access-board.gov/ada/ — **UNVERIFIED**: not fetched this pass; MS-16's §206/§403/§407 guess is not confirmed.
6. WBDG (NIBS/NIH), *Architectural Programming* — https://www.wbdg.org/design-disciplines/architectural-programming — carried from `architecture-theory.md` TH-01. Used for MS-02, MS-17.

T2 — peer-reviewed:

7. Al-Subbani, A. & Penn, A., *Challenges in Multilevel Wayfinding: A Case Study with the Space Syntax Technique*, Environment and Planning B — https://journals.sagepub.com/doi/10.1068/b34050t — **link only, article body not read**. Used for MS-24.
8. *Spatial complexity and wayfinding: extending space syntax to three dimensions* — https://arxiv.org/pdf/2012.14419 (preprint) — arXiv URL live; **body not read**. Used for MS-24.
9. Stráková, B. et al., *Elevator Traffic Simulation Procedure* — https://www.researchgate.net/publication/31598080_Elevator_Traffic_Simulation_Procedure — **UNVERIFIED: page not opened (ResearchGate is login-gated)**. Used for MS-10 method framing.
10. *Beyond the Up Peak*, symposium paper indexed at The Lift and Escalator Library — https://liftescalatorlibrary.org/paper_indexing/papers/00000430.pdf — **UNVERIFIED: PDF binary not extractable in either pass**. Used for MS-10.
11. *Tall Buildings and Elevators: A Review of Recent Technological Advances*, Buildings 5(3):1070, MDPI — https://www.mdpi.com/2075-5309/5/3/1070 — **UNVERIFIED: 403 to fetch both passes**. Used for MS-04, MS-11 (strategy taxonomy only, figures not taken).

T3 — established publications / owner standards:

12. CTBUH, *Height Criteria* — https://cloud.ctbuh.org/CTBUH_HeightCriteria.pdf — **previously cited as evidence for MS-03 and MS-13; audit 05 C4 found it is a height-and-completion measurement standard, not a core-layout or stack-order authority. It is no longer the evidence base of either rule and must not be re-attached without a services/structural text.** Retained here only as a title reference.
13. CTBUH, *Vertical Transportation: A Primer* (index copy) — https://www.scribd.com/document/505853062/index — **UNVERIFIED (dead index)**: Scribd index page has no readable body; existence of the primer is confirmed via Elevator World / CTBUH-store listings, but the "design driver of the section" characterisation is not established by any readable page. MS-01 no longer relies on it.
14. Council on Tall Buildings and Urban Habitat — https://verticalurbanism.org/ — **domain attribution confirmed 2026-09** (https://www.ctbuh.org/publications 302-redirects here), so the audit's "third-party journal" flag is out of date; **article-level text still UNVERIFIED** (not extracted). Used for MS-22 site-level only.
15. Network Rail, *Vertical Circulation* (owner standard, PDF) — https://www.networkrail.co.uk/uploads/2022/11/Vertical-Circulation.pdf — **UNVERIFIED: binary not extractable**. Candidate for MS-16, MS-23 (lift lobby and queue clearances).
16. Peters Research, *An Alternate Approach to Traffic Analysis for Residential Buildings* — https://peters-research.com/index.php/papers/an-alternate-approach-to-traffic-analysis-for-residential-buildings/ — **UNVERIFIED: page not opened**. Candidate for MS-10 (residential vs office peak profiles).

T4 — forums / vendor explainers (weak; used only where flagged):

17. AdSimulo University, *Elevator Traffic Analysis Explained* — https://adsimulo.com/support/adsimulo-university/basics-of-lift-traffic-analysis/ — **UNVERIFIED: content not machine-extractable**. MS-10.
18. Bukowski, *Emergency Egress from Buildings — Part II* (course PDF mirror) — https://pdhonline.com/courses/m465/Bukowski%20-%20Emergency%20Egress%20from%20Buildings.pdf — **UNVERIFIED: mirror, not opened**. MS-08, MS-21.

T5 — none used deliberately.

Host facts (task-verified, not external sources): one grid per floor sharing origin and tile size;
1 tile = 0.5 m; states `walkable | blocked | door`; wall = one blocked tile; 4-connected rooms with
door cells in no room (`src/engine/npc/rooms.ts:2,15,33`); portals as objects with interaction spots
and queues, default patience 30 s; role-tag access; no heights/sections/slabs/columns.

---

## Weak or contested

- **Every lift figure in this file is untraced.** Handling-capacity percentages, interval targets
  and utilisation limits (MS-10, MS-23, checklist C-06) are vendor/consultant rules of thumb whose
  authoritative home is **CIBSE Guide D** (Transportation Systems in Buildings) — the previous
  mention of "Barry Crouse" was an unverified author name and has been removed (audit 05 C2 notes
  Crouse's actual title is *The Elevator Problem Solver*, not the HC/interval standard). Class
  HEURISTIC, Confidence Low. Do not grade a design on them until the primary text is fetched, and
  no scoring weight attaches to C-06 until then.
- **Code clause numbers are unverified.** IBC Ch. 10 (403) and the NFPA area-of-refuge blog (404
  re-check this pass, dead) could not be read by automation, so MS-08, MS-09, MS-16 and MS-21
  state the provisions as concepts, not as quotable clauses with section numbers and limits. Each
  is now labelled `Class: CODE REQUIREMENT (clause unverified)` at the rule itself, so the caveat
  travels with the class the checklist inherits.
- **CTBUH citations repaired.** The file previously pointed MS-03 (core continuity) and MS-13
  (stack order) at *CTBUH Height Criteria*; audit 05 C4 confirms that document is a
  height-and-completion measurement standard, not a core-layout or stack-order authority, so both
  rules now stand on host-grid arithmetic + typology convention and the citation is removed.
  Separately, MS-01's former *Vertical Transportation: A Primer* reference was reached via a
  Scribd **index listing** with no readable body; the primer exists, but "design driver of the
  section" is not established by any readable page, so MS-01 no longer relies on it either.
- **Domain attribution — ctbuh.org → verticalurbanism.org (2026-09).** A re-probe this pass
  confirms `https://www.ctbuh.org/publications` 302-redirects to `https://verticalurbanism.org/publications`,
  so verticalurbanism.org *is* CTBUH's current publishing home; audit 05's "third-party journal"
  flag on source 14 is out of date on the domain, though the specific article text is still
  UNVERIFIED. Do not re-flag CTBUH's own site as a third-party mirror.
- **Dead / unreadable URLs are labelled UNVERIFIED, not silently retained.** Every source entry
  in the Sources list carries an explicit **UNVERIFIED / DEAD** tag where the page could not be
  opened in either the audit or this remediation pass: NFPA blog (404 — DEAD), IBC Ch. 10 (403),
  NIST Bukowski PDF (not opened), liftescalatorlibrary PDF (binary not extractable), Stráková
  ResearchGate (login-gated), AdSimulo (T4 not extractable), MDPI 5(3):1070 (403), CTBUH primer
  via Scribd (index only), Network Rail PDF (binary), Peters Research (not opened), Bukowski
  course mirror (not opened). A URL is not evidence; the tag beside it is.
- **Core-to-plate efficiency bands (MS-19) are market-specific** and contested even in professional
  literature; only the metric, not the target, is defensible here.
- **Structural transfer (MS-07) cannot be represented at all** on a section-less per-floor grid —
  only its plan signature (a bay offset) is testable. Any claim about transfer depth, load path or
  cost is out of reach and should be reported as a gap.
- **Vibration/noise stacking (MS-12, checklist C-14) has no decibel or velocity criterion**, only a
  coordinate overlap penalty; K = 2 tiles is a modelling choice, not evidence. C-14 is now
  labelled a declared project target with Confidence Low so no downstream check treats it as a
  compliance test.
- **Wet-stack and riser zoning (MS-06, MS-20) rest on mechanism reasoning** (gravity fall, riser
  count) without a plumbing-code citation in this pass.
- **Multi-level space syntax (MS-24)** has competing formulations (layered graphs vs 3-D axial
  maps vs isovist stacking); using integration values comparatively is safe, using them as an
  absolute score is not.
- **MS-16's 3×3-tile clear space is stricter than ADA §407's 60 in (1.525 m) turning *circle*.**
  The file previously presented the tile square as a code minimum; it is a project-set conservative
  clearance, not a citation.

---

## Type-specificity audit

- **Universal (every multi-floor build):** MS-01, MS-02, MS-03, MS-05, MS-06, MS-07, MS-08,
  MS-14, MS-16, MS-18, MS-20, MS-21, MS-23.
- **Towers / deep plates only:** MS-04 (core count), MS-11 (group zoning, sky lobbies), MS-19
  (core-to-plate band), MS-22 (podium transition).
- **Repeated-floor cellular types (hotel, residential, hospital wards, campus office):** MS-14
  zero drift is the binding rule, and MS-06 wet-line stacking is hardest here because bathrooms are
  repeated dozens of times; MS-12 (sensitive use under source) is severe for hotels.
- **Mixed-use / public-stacked (retail + office + residential):** MS-02, MS-13, MS-24 carry the
  weight (stack order and vertical connectivity), and MS-09 refuge provision becomes unavoidable
  because uses with different occupant behaviours share one core.
- **Low-rise / single-exit-permitted / at-grade campus:** MS-08 and MS-21 relax to code exceptions;
  MS-10 may vanish entirely if no portal exists (then vertical continuity is stair-only and MS-08
  is the whole test).
- **This host specifically:** MS-18, MS-23 and the C-01…C-18 checklist are build rules, not
  architecture rules — they exist because the engine has no section, so alignment and capacity must
  be proven by coordinates and queues or not at all.
