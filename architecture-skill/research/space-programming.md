# Research file 12 — Space programming and area take-off (Domain K)

Scope: how a programme is turned into *areas* — room types, quantities, sizes, occupancy,
capacity, and the gross→mechanical take-off ladder — for the eight building families this mod
simulates. Adjacency/order/wayfinding theory is file 01; fixture-level interior layout is the
ergonomics file. This is the arithmetic layer: brief → space list → area per space → count →
uplift → gross tile budget.

Host grid this file is written against (verified in code): `1 tile = 0.5 m`, `1 tile = 0.25 m²`,
`4 tiles = 1 m²`; a wall is one blocked tile; rooms are 4-connected flood-fills of walkable tiles
and door cells belong to **no** room, so a `W×H` outer footprint yields `(W-2)(H-2)` usable tiles
and every door tile is circulation. Room typing uses the 15 `detectTags` at
`src/blueprint-editor/domain/schema/rooms.ts:9-25` with a `hall` fallback (`:27`) and
lowest-priority-wins resolution (`:29-38`): `living, hygiene, wellness, pool, cooking, dining,
bar, fitness, lounge, laundry, meeting, retail, back-of-house, storage, front-desk`.
**Area allocation on this host IS tile counting** — there is no other quantity. Clinical,
industrial, workstation and plant uses have no matching tag, so figures for them must be mapped
onto the nearest tag or dropped with a reason (SP-16).

Evidence discipline: this pass retrieved source *identity and URLs* but could not read the numeric
tables of the official PDFs (BB103, BB98, HTM 00, GSA OAS 7005.1B, UNICEF annex — binary PDFs;
FAM 1710 fetch failed). Consequently almost every m² band below is labelled
`UNCITED — heuristic` with **Low** confidence and is listed in *Weak or contested*. Heuristic bands
are planning priors for the agent to sanity-check against, **not** design inputs. Nothing has been
attributed to a document it was not read in.

---

## Rules

### SP-01 Produce the space list before the first area number
- Rule: Derive the programme in three ordered artefacts — (a) brief of *user groups + activities*, (b) space list with one row per activity, (c) area and count per row. Never start from "how big is a hotel room"; start from "who, doing what, how many, how often".
- Evidence: The English school standards model this sequence exactly: BB98 is a *Briefing Framework* (the brief/space-list stage) and BB103 is a separate document giving "simple, non-statutory area guidelines" used to check room sizes afterwards — briefing precedes sizing, and the two are published apart. Architectural programming is likewise defined as the pre-design research/decision phase whose output is the necessary rooms plus their relationships (WBDG, *Architectural Programming*).
- Source: GOV.UK, *Notes on area guidelines for mainstream schools: BB 103* https://www.gov.uk/government/publications/area-guidelines-and-net-capacity/notes-on-area-guidelines-for-mainstream-schools-bb103 — T1; WBDG (NIBS) https://www.wbdg.org/design-disciplines/architectural-programming — T1/T3 (cited by name; page not read this pass); Problem Seeking (Rand/Parker/Zimring), 5th ed., Routledge — T3 (by edition, no URL verified).
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: High (method) / Medium (the BB98→BB103 reading is inferred from document titles + the one retrieved BB103 blurb)
- Grid translation: Emit a table with columns `activity | user group | persons | required net tiles | fixture detectTag | count | adjacency class | service needs | source-tier`. Validate: every row's `detectTag` ∈ the 15 host tags, else it resolves to `hall` and is invisible to the type checker. Hard fail if a row has no tag or no count.
- Exceptions / failure mode: Fast-replicable types (hotel floor, storage bay) where the list is one row × N. Failure symptom: rooms drawn from memory of "what buildings have", so no NPC activity needs them, and a total area with no relationship to demand.

### SP-02 Size every space from occupancy first, activity footprint second
- Rule: Compute area as `max(occupancy-driven, equipment-driven, minimum-driven)` and record which of the three **governs** each row. Occupancy-driven = `persons × area-per-person`; equipment-driven = fixture bounding boxes + clearance; minimum-driven = a stated absolute floor.
- Evidence: BB103's own framing is that its guidelines carry "reduced minimum internal and external areas" — i.e. the state document expresses an explicit minimum per space *in addition to* area-per-place guidance, which is the minimum-driven term. On the host, equipment-driven is the only term derivable exactly, because fixtures are the objects the sim knows about.
- Source: GOV.UK BB103 notes https://www.gov.uk/government/publications/area-guidelines-and-net-capacity/notes-on-area-guidelines-for-mainstream-schools-bb103 — T1 (blurb read); else `UNCITED — heuristic`.
- Class: DESIGN PRINCIPLE
- Scope: universal (the values never are)
- Confidence: High for the BB103 school case (cited); Low for the general method (UNCITED — heuristic)
- Grid translation: `required tiles = ceil(governing m² × 4)`; per-room check `usable tiles ≥ required tiles` where `usable = (W-2)(H-2)`. Record `governs: occupancy | equipment | minimum` per room in the audit trail (SP-23). Rooms tagged `cooking`, `laundry`, `pool`, `hygiene` should default to `governs: equipment`, since their fixtures, not their headcount, set the footprint.
- Exceptions / failure mode: Spaces with no occupants (store, riser, plant) — occupancy term is zero, so equipment/access governs. Corridors and lobbies are movement, not accumulation spaces; area-per-person sizing them is a category error (SP-04).

### SP-03 State the capacity basis of every number you use
- Rule: A "typical area" is meaningless without its basis. Tag each figure `per person`, `per fixture`, `per bed`, `per desk`, `per seat`, `per place`, `per linear metre of shelf/counter` or `per pallet`, plus the building type and the source edition that produced it.
- Evidence: The English school metric is explicitly "area guideline **per place**" with a formula for calculating a school's *net capacity* from those per-place guidelines — i.e. a published capacity basis named in the standard itself ("place"). GSA and UNICEF office documents are similarly allocation-policy documents expressed *per occupant by grade* (documents located; tables not read).
- Source: GOV.UK, *Area guidelines and net capacity* https://www.gov.uk/government/publications/area-guidelines-and-net-capacity — T1; UNICEF, *Office Space Standards and Guidelines* (annex) https://www.unicef.org/nepal/media/20591/file/New_Office_Annex_F_UNICEF_management_premises_guidelines_for_dhangadi.pdf — T1, **located, not retrieved**.
- Class: STANDARD
- Scope: universal
- Confidence: Medium-High; the existence of published per-place and per-person bases is the fact, the obligation to name one beside every figure is the standard
- Grid translation: Store `capacity_basis` as a required field on every programme row; the validator recomputes capacity from tiles using that basis and flags mismatch > ±15 %. Tiles→persons: `floor(usable tiles × 0.25 / area_per_person_m2)`.
- Exceptions / failure mode: The commonest false claim on this host — "a 12-tile room is a bedroom". It is a 3 m² volume; without a basis it validates against nothing.

### SP-04 Separate accumulation, non-accumulation, and support spaces and never mix their area maths
- Rule: Classify every space as accumulation (occupancy counts toward load: guest rooms, classrooms, desks), non-accumulation (occupancy not additive: corridors, stairs, lobbies, plant) or support (sized by ratio to a driver). Ratios apply only within a class.
- Evidence: The distinction is a model-code artefact of occupant-load calculation (accumulation vs non-accumulation spaces) and is why load factors (SP-07) are quoted only for occupiable rooms. The host independently confirms the split: untagged flood-fills resolve to `hall`, so non-accumulation space is *structurally* distinguishable from program space in this codebase.
- Source: Host code `src/blueprint-editor/domain/schema/rooms.ts:27,29-38` — project T1; IBC/IFBC *Means of Egress* occupant-load table — T1 standard, **edition text not retrieved this pass**, so the classification's wording is `UNCITED — heuristic`.
- Class: CODE REQUIREMENT (definitions derive from model codes)
- Scope: universal in intent; boundary cases differ by jurisdiction
- Confidence: Medium-High for the host-code taxonomy (schema/rooms.ts, project T1); Low for the IBC wording (edition text not retrieved — UNCITED)
- Grid translation: Host `hall`-fallback rooms *are* the non-accumulation set, which gives a free honest circulation measure: `circulation tiles = hall tiles + door tiles`. Load-factor arithmetic (SP-07) applies only to tagged accumulation rooms.
- Exceptions / failure mode: Hotel lobby / office reception (`front-desk`) is accumulation for queueing and non-accumulation for movement — classify as *both*, cap the queue tiles separately, and exclude from the load sum or double-count.

### SP-05 Take gross area from net by an explicit ladder, one rung per line item
- Rule: Never jump from programme area to floor plate. Walk Gross → Net → Program → Circulation → Structure → Services → Mechanical as a visible budget with its own tile subtotal at each rung, each marked *sourced*, *derived by count*, or *assumed* (see `## Area-takeoff method`).
- Evidence: BB103 publishes gross-area implications *separately* from per-place net guidelines and states its 2010-era guidelines produce gross area "on average 15 % lower than that recommended in BB98" — direct proof that a change in programme areas propagates to a *gross* figure through a net-to-gross relationship that the issuing body treats as its own documented quantity, not as an afterthought.
- Source: GOV.UK BB103 notes https://www.gov.uk/government/publications/area-guidelines-and-net-capacity/notes-on-area-guidelines-for-mainstream-schools-bb103 — T1 (this figure read).
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: High
- Grid translation: Each rung is a tile subtotal; reconciliation line is `plate tiles = program + support + circulation + structure + services + mechanical (assumed)`. Print all seven even when a rung is zero.
- Exceptions / failure mode: The universal-percentage habit ("add 25 % circulation") hides the fact that on a 0.5 m grid with one-tile walls the structure tax alone runs 11–60 % depending on room size (SP-14). Fixed uplifts are wrong here by construction.

### SP-06 Publish which measurement convention you are using before quoting any area
- Rule: Areas are convention-dependent. Name the convention — ANSI/BOMA Z65.1 (North America), RICS *Property Measurement* / IPMS 1–3 (UK + adopted jurisdictions), or a national health/education metric — and declare whether internal walls, perimeter wall thickness, columns, corridors, lobbies, toilet cores and balconies count. Convert before comparing two sources.
- Evidence: The two families exist as separate, competing standards bodies with published standards pages, and there is a peer-reviewed literature stream on harmonising them ("Towards harmonizing property measurement standards"), which is itself evidence that the conventions are *not* interchangeable. BOMA's suite distinguishes usable from rentable area (hence "load factor"); RICS distinguishes Gross External, Gross Internal and Net Internal Area and, under IPMS, measures to the internal face of the perimeter wall with a defined treatment of wall cavities. **The precise clause text was not retrieved this pass.**
- Source: BOMA International, *BOMA Standards* https://boma.org/boma-standards/ — T1 (located, not read); RICS, *New IPMS aims to enable consistent measurement* https://ww3.rics.org/uk/en/journals/property-journal/ipms-enables-consistent-measurement.html — T1 (located, not read); Blackacre Surveyors, *RICS Code of Measuring Practice: a guide to GEA, GIA, NIA and IPMS* https://blackacresurveyors.com/blog/why-international-property-measurement-standards-ipms/ — T4; ResearchGate https://www.researchgate.net/publication/329812287_Towards_harmonizing_property_measurement_standards — T2 (abstract only).
- Class: STANDARD
- Scope: jurisdiction- and industry-specific
- Confidence: Medium that the conventions differ materially (High for the fact of divergence); **Low for every clause-level detail** — do not state what BOMA counts without reading Z65.1.
- Grid translation: The host convention is unique and must be declared whenever an area is emitted: **net to inner face of a one-tile wall, no common-area allocation, no envelope, doors excluded from all rooms.** When importing a published area, treat it as usable-net and add the wall ring (SP-19); never treat it as a plate.
- Exceptions / failure mode: A "13 m² guest room" quoted on a gross basis is not the same room as a "13 m² guest room" on a net basis; the 1.5–3 m² gap is roughly one host wall ring on a typical room, so the error is invisible at the tile level and total at the portfolio level.

### SP-07 Derive occupant load from the code factor of the *actual* use, then let it drive openings
- Rule: `occupant load = area / per-person factor for that use`, with the factor from the applicable adopted code; size exits and stairs to the load; then check against the programme's expected peak and take the governing value. Never assign a factor by room *name* — assign by use.
- Evidence: The factors live in the model codes' means-of-egress chapter (US IBC 1004/1005 lineage) as tabulated occupant-load factors per assembly/business/hospital/restitution grouping; `UNCITED — no factor table retrieved this pass`, so no numeric factor is stated here. That the factors are use-specific and non-universal is the retrievable claim.
- Source: ICC, *International Building Code*, Means of Egress chapter — T1 standard, **not retrieved**; cite as "to verify: IBC Table 'Maximum Floor Area Per Occupant'".
- Class: CODE REQUIREMENT
- Scope: US model-code shape; every jurisdiction has its own table
- Confidence: High (method: use the code factor of the actual function, never an invented density) / Low for the IBC 1004-1005 factor-table lineage claim (UNCITED this pass) / **None (numbers)** — do not hard-code a factor until retrieved.
- Grid translation: `load = floor(usable tiles × 0.25 / factor_m2)`. Opening capacity: a 2-tile (1.0 m) door run ≈ one exit unit; check `door runs × per-run capacity ≥ load`. A room whose derived load exceeds its door capacity is a hard plan error, not a warning. Because door tiles are circulation (not room), widening a door steals program tiles — report that cost.
- Exceptions / failure mode: Host has no heights or storey count, so multi-storey evacuation stacking must be assumed, not derived. Also: L-shaped flood-fills can pass an area test while one 1-tile arm cannot carry any load — run the width check per arm.

### SP-08 Set counts from demand curves, not from precedent plans
- Rule: Quantity per space type = `peak concurrent users × area per user / net area per unit`, with peak from the operation's profile (occupancy × turnover for hotels, roster for offices, cohort × teaching groups for schools, patient-day census for hospitals, covers × sittings for F&B). Precedent ratios are a sanity check only.
- Evidence: BB103's net-capacity mechanism is a formula that converts an area guideline and a pupil count into a place number and back — i.e. the state method is *demand → area → capacity*, and it is deliberately non-statutory so schools can trade area against count. That is the same arithmetic as this rule.
- Source: GOV.UK, *Area guidelines and net capacity* https://www.gov.uk/government/publications/area-guidelines-and-net-capacity — T1 (page title/structure read; formula text not retrieved).
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: High
- Grid translation: `count = ceil(peak concurrent / units_per_space)`; emit count + the peak it came from. On a fixed plate the count is what trades against area, so log both (SP-21).
- Exceptions / failure mode: Fixed-inventory types (hotel bedrooms, hospital beds) — the room count *is* the business case; then demand sizes the **support** counts (housekeeping, laundry, BOH) instead. Getting this backwards yields a hotel with 40 rooms and one shared bathroom.

### SP-09 Express support space as a ratio to its driver and name the driver
- Rule: Every support space (storage, cleaning, waste, staff, plant) is a ratio to a named driver — area served, headcount served, bed count, desk count, meal count, tray count. Store numerator *and* denominator, never just the result.
- Evidence: `UNCITED — heuristic` method claim; no published ratio table retrieved this pass. Supporting indirect evidence that such driver-ratio policies exist in institutional standards: GSA's document is literally titled *Internal Space Allocation, Design, and Management Policy* (a per-population allocation instrument) and UNICEF's is *Office Space Standards and Guidelines*.
- Source: GSA OAS 7005.1B, *Internal Space Allocation, Design, and Management Policy* https://www.gsa.gov/directives/files?file=2026-06%2FOAS%207005.1B%2C%20Internal%20Space%20Allocation%2C%20Design%2C%20and%20Management%20Policy.pdf — T1, **located, not retrieved**.
- Class: DESIGN PRINCIPLE
- Scope: building-type specific
- Confidence: Medium (method) / Low (any number); the ratio-to-a-named-driver method carries the class, while every ratio value is an uncited heuristic (no published table retrieved)
- Grid translation: `support tiles = driver units × ratio × 4`, then rounded to a tile-realistic footprint (SP-19). Back-of-house is directly measurable here (`back-of-house` tag), so audit `BOH tiles ÷ guest-room tiles` per floor and publish it as a *counted* ratio, not an uplift.
- Exceptions / failure mode: Double counting — staff toilets booked once in staff welfare and again in the core. Assign every tile to exactly one programme row and verify the partition sums to the plate.

### SP-10 Size storage as a fraction of throughput *and* a floor of minimum volume
- Rule: Storage must pass two independent tests — fractional (% of the space it supports, type-specific) and absolute (largest item + access). Take the larger.
- Evidence: `UNCITED — heuristic`. Only the *existence* of an absolute floor is defensible without a source: BB103 publishes "reduced minimum internal and external areas", i.e. an absolute minimum independent of ratio.
- Source: GOV.UK BB103 notes — T1 (minimum-existence claim only). Neufert *Architects' Data*, 3rd ed. EN / Time-Saver Standards for Building Types, 5th ed. — T3, **not consulted this pass; verify before use**.
- Class: HEURISTIC
- Scope: building-type specific
- Confidence: Low (numbers) / Medium (method)
- Grid translation: Storage = `storage`-tagged rooms. Minimum: ≥ 4 usable tiles (1 m²) to hold anything, realistically ≥ 8 tiles for a shelf run, ≥ 16 for a stackable pallet surrogate. Band check: `storage tiles ÷ program tiles` per type — bands are `UNCITED — heuristic`.
- Exceptions / failure mode: Hotel linen store is par-count driven (linen par × laundry cycle); retail stock is delivery-throughput driven (weekly replenishment ÷ shelf capacity); school equipment store is syllabus driven. Same host tag `storage`, three drivers — never share one ratio.

### SP-11 Treat mechanical space as an equipment-driven, access-constrained island
- Rule: Plant is sized by equipment footprint + manufacturer clearance + a maintenance route, never by a percentage of floor. The route to a service corridor or exterior is part of the mechanical budget.
- Evidence: `UNCITED — heuristic`, and additionally **not representable on this host**: no mechanical/plant tag exists (SP-16), no heights, no ductwork. NHS guidance treats plant and engineering services as a named facilities discipline within healthcare building guidance (HTM 00 series *Policies and principles of facilities design and construction*, located as a document; content not read).
- Source: NHS England, *Health Technical Memorandum 00: Policies and principles of facilities design and construction* https://www.england.nhs.uk/wp-content/uploads/2021/05/HTM_00.pdf — T1, **located, not retrieved (binary PDF)**.
- Class: ENGINEERING CONSTRAINT
- Scope: universal in principle; drivers are type-specific
- Confidence: Low
- Grid translation: Map onto `storage` or `back-of-house` and *label the substitution* in the audit. Reserve ≥ 2 walkable tiles from the plant footprint to a door tile. Plant tiles are a counted budget line, never folded into structure.
- Exceptions / failure mode: Percentage-based early plant allowances systematically under-reserve for water/duct systems and over-reserve for split systems; on this host the whole rung may legitimately be zero, in which case write `mechanical: 0 tiles — not representable`, not blank.

### SP-12 Give staff space its own programme row, sized per peak shift headcount
- Rule: Staff need rest/break, toilets/shower, changing/locker, uniform/laundry, office and storage — driven by *peak shift headcount*, and located on the staff circulation route, not the guest route.
- Evidence: `UNCITED — heuristic` for all areas. The *separateness* of staff circulation is a hotel/healthcare design convention asserted without a retrieved source here; the host supports it structurally since `back-of-house` is a first-class tag, meaning staff space is expected to exist and be counted.
- Source: Host code `src/blueprint-editor/domain/schema/rooms.ts:22` (`staff-room` from `back-of-house`) — project T1. For real-world figures: Neufert / Time-Saver — T3, not consulted; **verify**.
- Class: DESIGN PRINCIPLE
- Scope: universal; values type-specific
- Confidence: Medium (method) / Low (numbers)
- Grid translation: `staff-room usable tiles ≥ peak shift heads × area-per-person × 4`. Emit `BOH door tiles ÷ guest door tiles` to check the two routes do not merge. Report `staff tiles ÷ program tiles` per type as a counted ratio.
- Exceptions / failure mode: Micro-properties where one room is break + store + office; then the row must state the shared-use compromise rather than vanish. Second failure: staff welfare placed inside a guest-tagged room, which retypes the room (SP-16 priority rule).

### SP-13 Let circulation be solved by the movement model, then measured — not pre-allotted
- Rule: Circulation is the residue of a valid adjacency graph plus width standards. Decide the network, assign widths, count tiles, and only then compare the measured share against a sourced band for the type.
- Evidence: On this host circulation is exactly measurable (`hall` + `door` tiles), which removes the usual excuse for uplift percentages. Width bands below are `UNCITED — heuristic`, informed by the file-01 movement physics: the host A* forbids diagonals in 1-tile-wide corridors, so a 2-tile (1.0 m) route is up to ~1.41× cheaper corner-to-corner than a 1-tile one — width buys *flow*, not just capacity, and that is derivable from the codebase rather than from a book.
- Source: Host code `src/engine/npc/rooms.ts` (door exclusion) + file 01 TH-01/TH-02 octile analysis — project T1. For published corridor widths: NHS HBN 00-01 / BB103 both contain such figures — **not retrieved**.
- Class: DESIGN PRINCIPLE
- Scope: universal method; widths type- and code-specific
- Confidence: High (measurability) / Medium (movement cost) / Low (width numbers)
- Grid translation: Width bands in tiles: 2 = 1.0 m single route; 3 = 1.5 m two-way; 4 = 2.0 m main guest/department artery; 6 = 3.0 m assembly main. `circulation share = (hall + door tiles) ÷ plate tiles`; report per floor. Publish the band it is being judged against and its classification (SP-24).
- Exceptions / failure mode: Enfilade rooms (through one room to reach another) register zero circulation tiles and are a false economy — they inject cross-traffic into an occupied, tagged room. Detect by checking whether any route between two `hall` components passes through a tagged room.

### SP-14 Carry the wall tax and door tax as separate, counted budget lines
- Rule: Structure on this host is not an assumption; it is countable. Compute wall tiles and door tiles per floor exactly and report them; small rooms are disproportionately expensive, so the tax constrains room granularity.
- Evidence: Arithmetic verified against code — a one-tile ring on a `W×H` outer footprint takes `2W+2H−4` tiles; usable = `(W−2)(H−2)`. 6×5 → 18/30 = **60 %**; 12×10 → 40/120 = **33 %**; 20×15 → 66/300 = **22 %**; 40×30 → 136/1200 = **11 %**. Party walls are shared, so floor totals must be real counts, not sums of per-room taxes (file 01, TH-02).
- Source: Verified in `src/blueprint-editor/domain/schema/rooms.ts` and `src/engine/npc/rooms.ts` — project T1; Ching, *Building Construction Illustrated*, 5th ed., Wiley, ch. 5 — T3, for real internal partitions ≈ 0.10–0.20 m (no numeric claim imported).
- Class: ENGINEERING CONSTRAINT (grid artefact)
- Scope: this host only
- Confidence: High
- Grid translation: `structure tiles = blocked tiles`; `door tiles = door-state tiles`; report both as % of plate. Because the tax scales with perimeter ÷ area, the same programme net area needs materially fewer gross tiles when consolidated: cap the number of rooms at the smallest footprint satisfying the use.
- Exceptions / failure mode: Real buildings amortise a 0.10 m partition; this grid charges 0.5 m. An agent that targets real-world room areas literally overshoots the plate by 20–60 %, then "fixes" it by shrinking rooms below their governing minimums (SP-15).

### SP-15 Enforce dimension and aspect minima, not just area minima
- Rule: A row is satisfied only if area **and** minimum dimension **and** proportion pass. Area-correct rooms fail real use when needle-thin or when their flood-fill is a 1-tile arm.
- Evidence: BB103 states it sets "reduced minimum internal **and external** areas" and refers to "graphs and formulae" for checking room sizes — i.e. the issuing body checks dimension/shape by formula, not area alone. (Blurb-level reading; the formulae themselves were not retrieved.)
- Source: GOV.UK BB103 notes — T1 (statement of method); dimension bands below `UNCITED — heuristic`.
- Class: DESIGN PRINCIPLE
- Scope: universal in structure; numeric minima jurisdiction-specific
- Confidence: Medium; it is code-strength only where a jurisdiction sets a minimum room dimension (BB103 checks shape by formula) - the aspect limit and the circumscribing-rectangle test are design principles we impose — was `STANDARD`; demoted to the weaker of the two readings the Confidence already gives: no document read this pass states the aspect limit, and the BB103 source was opened only for the statement of method
- Grid translation: min dimension ≥ 6 tiles (3.0 m) habitable; ≥ 4 tiles (2.0 m) bathroom/service; aspect ≤ 3:1 for occupied rooms; run a circumscribing-rectangle test on the flood-fill (L-rooms and donuts pass area tests at 1-tile arms).
- Exceptions / failure mode: Corridor-shaped `hall` rooms legitimately exceed 3:1 — exclude untagged rooms from the aspect rule or every corridor fails validation.

### SP-16 Type the room by fixtures and refuse to accept the `hall` fallback silently
- Rule: Because the host resolves type from 15 `detectTags` with a `hall` fallback, any use outside that vocabulary (clinical, industrial, workstation, plant, refuse, waste, gallery) is invisible to the simulation. Either map it onto the nearest tag with a stated reason, or drop it and log the loss.
- Evidence: Code, read directly: `ROOM_TYPE_SPECS` lists 15 specs (`rooms.ts:9-25`); `HALL_ROOM_TYPE` has `detectTags: []`, `priority: 999` (`:27`); `resolveRoomType` returns the lowest-`priority` matching spec, else `hall` (`:29-38`). Since `bedroom` is priority 10 and `bathroom` 20, a room holding both a bed and a washbasin types as a **bedroom** — a dominant-use rule is already baked in and is silent.
- Source: Host repo `src/blueprint-editor/domain/schema/rooms.ts:9-38` — project T1, verified.
- Class: FACT
- Scope: this host only
- Confidence: High
- Grid translation: Report `untagged-room tiles ÷ total tiles` every run. Substitutions to log: clinical ward kitchen→`cooking`, clinical wash→`hygiene`, boardroom→`meeting`, plant→`storage`, waiting→`lounge`, production bay→**no available tag**, workstation→`meeting` (weak). Note the trap: a desk area tagged `meeting` will be typed as a Conference Room, so "office floor" and "meeting floor" are indistinguishable to the sim. Executed extension: the ladder ranks living 10 and hygiene 20 above cooking/dining/retail/meeting 40 and front-desk 50, so a hand-wash basin derives a restaurant as `bathroom` and a lobby seat derives it as `bedroom` - diff the programme rows against derived types in BOTH directions, not only for the untagged case
- Exceptions / failure mode: Two-use rooms type by the smaller priority *number*, so splitting is required for legibility; and any programme row whose only honest tag is `[]` (hall) must not be counted as program in efficiency ratios (SP-18).

### SP-17 Use one consistent area-per-person per activity and cite it per type
- Rule: Area-per-person is the most-copied, least-checked number in programming. Fix it per activity, cite it per building type, publish it in the audit; never carry one figure across a mixed development.
- Evidence: The US federal and inter-agency documents that would settle this (GSA OAS 7005.1B; FAM 06FAM-1710 *Office Space Assignment and Utilization*) are *per-occupant allocation policies by grade*, confirming the practice of one figure per population — but **no figure was retrieved from either** (GSА PDF binary; FAM fetch failed). All per-person bands in the register are therefore heuristic.
- Source: GSA https://www.gsa.gov/directives/files?file=2026-06%2FOAS%207005.1B%2C%20Internal%20Space%20Allocation%2C%20Design%2C%20and%20Management%20Policy.pdf — T1, not retrieved; US Dept of State FAM 1710 https://fam.state.gov/fam/06fam/06fam1710.html — T1, **fetch failed, not retrieved**; officespacesoftware.com density benchmarks https://www.officespacesoftware.com/blog/recommended-office-space-per-employee/ — T4, not retrieved.
- Class: BUILDING-TYPE CONVENTION
- Scope: building-type specific, partly project specific
- Confidence: Low; the figure is bound to its building type, and it stays a heuristic in force because no source figure was retrieved from GSA or FAM this pass
- Grid translation: Host resolution is 0.25 m²/tile, so any figure < 0.25 m²/person is unrepresentable and must round up; 1.4 m²/desk = 5.6 tiles → 6. Publish the rounding so re-derivation reproduces the numbers exactly.
- Exceptions / failure mode: Density figures that assume shared equipment (hot-desking, shared print, benching) do not transfer to hotel, clinical or classroom uses; storage/mechanical have no per-person figure at all.

### SP-18 Report net-to-gross efficiency at three levels and name the level of every benchmark
- Rule: Report (a) room → suite, (b) suite → floor, (c) floor → building. A single "85 % efficient" claim is unfalsifiable. Every benchmark you cite must declare which level it belongs to.
- Evidence: BOMA's commercial argument is explicitly about the usable-vs-rentable distinction at *floor/building* level (that is the entire function of a "load factor"), while RICS GIA/NIA and BB103's area-guideline-per-place operate at *room/suite* level — so published "efficiency" numbers from the two worlds are not comparable even in direction, let alone magnitude.
- Source: BOMA standards page https://boma.org/boma-standards/ — T1, located not read; RICS IPMS article https://ww3.rics.org/uk/en/journals/property-journal/ipms-enables-consistent-measurement.html — T1, located not read; GOV.UK BB103 — T1, blurb read.
- Class: STANDARD
- Scope: structural claim universal; values project-specific
- Confidence: Medium-High (structure) / Low (all ratios); the room/suite/floor/building definitions carry the class, while every published efficiency ratio quoted against them is a heuristic
- Grid translation: (a) `room usable ÷ (usable + its wall ring + its doors)`; (b) `Σ room tiles ÷ plate tiles`; (c) `Σ floors ÷ site footprint` — host has no envelope, so (c) ≡ (b) unless an outer ring is modelled; say so in the audit.
- Exceptions / failure mode: Multi-tenant schemes where the same corridor is "net" to the tenant and "gross" to the owner — declare whose side of the lease you are computing for before the number means anything.

### SP-19 Convert target m² into a tile-realistic footprint, then re-measure
- Rule: Never accept a plan whose area equals the target on paper. Convert `target tiles → integer W×H outer footprint → recompute usable (W−2)(H−2)` and iterate; the usable count, not the footprint, is the programme number.
- Evidence: Arithmetic on the host grid; ring formula per SP-14. Verified against `rooms.ts` semantics.
- Source: Host code — project T1 (SP-14 source line).
- Class: FACT
- Scope: this host
- Confidence: High
- Grid translation (usable tiles → outer footprint, all round **up**). Re-derived tile-by-tile this pass with `usable = (W−2)(H−2)` and `ring = 2W+2H−4`; each row reads `target → outer footprint (usable tiles = usable metres; tiles lost to its own ring)`:
  - 16 t (4 m²) → **6×6** (usable 4×4 = 16 exactly; 2.0×2.0 m; ring 20 of 36)
  - 24 t (6 m²) → **8×6** (usable 6×4 = 24; 3.0×2.0 m; ring 24 of 48)
  - 32 t (8 m²) → **10×6** (usable 8×4 = 32; 4.0×2.0 m; ring 28 of 60)
  - 40 t (10 m²) → **10×7** (usable 8×5 = 40; 4.0×2.5 m; ring 30 of 70) — service-only; at the SP-15 habitable minimum it is **9×8** (usable 7×6 = 42 = 10.5 m²; 3.5×3.0 m; ring 30 of 72)
  - 48 t (12 m²) → **10×8** (usable 8×6 = 48; 4.0×3.0 m; ring 32 of 80)
  - 56 t (14 m²) → **10×9** (usable 8×7 = 56; 4.0×3.5 m; ring 34 of 90)
  - 64 t (16 m²) → **10×10** (usable 8×8 = 64; 4.0×4.0 m; ring 36 of 100)
  - 80 t (20 m²) → **12×10** (usable 10×8 = 80; 5.0×4.0 m; ring 40 of 120)
  - 100 t (25 m²) → **12×12** (usable 10×10 = 100; 5.0×5.0 m; ring 44 of 144)
  - 128 t (32 m²) → **18×10** (usable 16×8 = 128 exactly; 8.0×4.0 m; ring 52 of 180) or **15×12** (usable 13×10 = 130 = 32.5 m²; 6.5×5.0 m; ring 50 of 180)

  The previous version of this table listed footprints that do **not** yield the stated usable count (8×6 gives 24 usable, not 16; 10×5 gives usable 8×3, a 1.5 m room; 8×7 gives 30, not 32; 8×8 gives 36, not 40; 9×8 gives 42, not 48; 12×9 gives 70, not 80; 12×11 gives 90, not 100; 13×12 gives 110, not 128) — do not reuse them. Then re-run SP-15 aspect and minimum dimension and SP-07 load on the **usable** dimensions above.
- Exceptions / failure mode: The **minimum usable dimension**, not the target area, sets the footprint, and that is what makes small rooms costly. Corrected this pass: a 4 m² (16-tile) bathroom is **not** "12 usable tiles in an 8×6 footprint" — an 8×6 footprint yields usable 6×4 = **24 tiles (6 m²)** on 48 footprint tiles. The smallest footprint that delivers 16 usable tiles at the SP-15 service minimum (4 tiles = 2.0 m) is **6×6** (usable 4×4 = 16 exactly; ring 20 of 36, i.e. 5 m² of plate consumed by its own ring for a 4 m² room). Apply SP-15's habitable minimum (6 tiles = 3.0 m) instead and the same 4 m² target becomes **8×8** (usable 6×6 = 36 tiles = 9 m²; ring 28 of 64) — nearly double the plate of the service-minimum option, and 4× the target area in footprint terms. Merge baths, or accept and declare the waste; never state a usable count the footprint cannot produce.

### SP-20 Give environmental and servicing needs a locational constraint, not an area
- Rule: Daylight, noise, dirt/water, exhaust, refuse and privacy change *where* a space may sit and *what wall it needs* — which changes area via circulation and stacking. Record them as constraint columns; do not let them silently inflate area.
- Evidence: Healthcare guidance treats clean/dirty separation and engineering-services adjacency as first-class design drivers (HTM 00 / HBN 00-01 series exist precisely to state this), and school briefing frameworks carry a daylight/acoustic requirement per space type. **Neither body's clause text was retrieved**, so this rule is method-only.
- Source: NHS HTM 00 https://www.england.nhs.uk/wp-content/uploads/2021/05/HTM_00.pdf — T1, located not retrieved; NSS Scotland HBN 00-01 summary https://www.nss.nhs.scot/publications/core-guidance-general-design-for-healthcare-buildings-hbn-00-01/ — T1, located not retrieved.
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: Medium (method) / Low (any specific distance)
- Grid translation: No daylight model exists — use `perimeter_depth_tiles` = min tile distance from the room to an exterior boundary as the proxy and record it per room. Wet uses (`hygiene`, `cooking`, `laundry`, `pool`) should stack or lie within N tiles of one another; measure N, don't assume a shaft. Record `quiet-need` rooms' distance from `cooking`/`laundry`/`pool`.
- Exceptions / failure mode: Stack height, duct risers and shaft sizes are **not representable** on a 2D per-floor host — flag as `not representable`; do not fabricate a services area to look rigorous.

### SP-21 Test programme against the plate before detailing anything
- Rule: Run a feasibility test — total required gross tiles vs available plate tiles — at concept and at every change. If infeasible, fix the *count* or the *driver*, never shave areas below their governing minimum.
- Evidence: Method claim; arithmetic follows directly from SP-14 + SP-19. BB103's existence as a *guideline* document with net-capacity formulae reflects the same discipline: check the arithmetic of demand vs space before designing.
- Source: GOV.UK BB103 — T1 (indirect); method otherwise `UNCITED — heuristic`.
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: Low (UNCITED — heuristic; BB103 support is indirect only)
- Grid translation: `feasible ⟺ Σ outer footprints (SP-19) + door tiles + hall tiles + wall tiles ≤ plate tiles`. Careful with the identity: an SP-19 **outer footprint already contains that room's own wall ring**, so `wall tiles` here means only construction lying outside the room footprints (the plate's own outer ring, `2W+2H−4` of the plate) — otherwise the tax is counted twice and the test flatters itself. Print the ladder so the failing rung is visible; a failure at the *structure* rung means too many rooms, and at *circulation* means the network is wrong. Worked concept test (see *Area-takeoff method*, recomputed this pass): twelve 10×8 keys take 960 of a 1200-tile plate as footprints, of which 384 tiles are their own rings, leaving 240 tiles for all doors, circulation and BOH — infeasible; delete keys, do not shave rooms.
- Exceptions / failure mode: Trimming every room 5 % to fit yields a plan that passes arithmetic and fails all governing dimension minima — reject and delete a unit instead. This is the single most likely agent failure on this host.

### SP-22 Benchmarks are bands: cite the band, the type, the edition and the jurisdiction
- Rule: Quote area standards as ranges with edition and jurisdiction; a point value is a misuse. Where only one number is published, label it a typical or an optimum, not a norm. Note that English school area guidance is explicitly "non-statutory" — many "standards" are guidance with no legal force.
- Evidence: Retrieved verbatim: BB103 "sets out simple, non-statutory area guidelines", and its gross areas "average 15 % lower than that recommended in BB98" — i.e. two successive official editions of the *same* national guidance differ by 15 %, which is the clearest possible demonstration that these are bands, not laws.
- Source: GOV.UK BB103 notes https://www.gov.uk/government/publications/area-guidelines-and-net-capacity/notes-on-area-guidelines-for-mainstream-schools-bb103 — T1, **this wording read**; Building Bulletin 98 (2004) https://education-uk.org/documents/pdfs/2004-building-bulletin-98-sec.pdf — T1, located not retrieved; BB104 (SEND) https://www.gov.uk/government/publications/area-guidelines-for-send-and-alternative-provision-bb-104 — T1, located not retrieved.
- Class: STANDARD
- Scope: building-type and edition specific
- Confidence: High for the BB98→BB103 delta; Medium for the band principle
- Grid translation: Store `range_low_tiles`, `range_high_tiles`, `basis`, `source`, `tier`, `edition`, `jurisdiction`. Validation is band membership; only SP-15 minima and SP-07 loads are hard-fail.
- Exceptions / failure mode: Neufert and Time-Saver figures are metric, European, net-based and in places mid-century (telecom rooms, secretary suites, typewriter-scale desks); importing them uncritically into a 2020s mixed-use simulation over-provisions support and under-provisions circulation.

### SP-23 Emit an auditable take-off trail with every design
- Rule: Every generated plan ships with a machine-readable take-off: per-row programme figures, per-rung ladder totals, ratio classifications, the governing term, host-tag substitutions made, and source + tier + confidence for each number. No number without provenance; every assumed value flagged `assumed`.
- Evidence: Programming methodology documents treat the written programme/space brief as the artefact that design is later demonstrated against (WBDG; Foraker pre-development resources) — the trail is the deliverable, not a by-product.
- Source: WBDG (NIBS) https://www.wbdg.org/design-disciplines/architectural-programming — T1/T3, **located, not read this pass**; The Foraker Group, *Architectural Programming* https://www.forakergroup.org/predevelopment/resources/architectural-programming/ — T4, located not read.
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: High
- Grid translation: Minimum per-room record: `{ id, tag, substitution_reason?, footprint WxH, usable_tiles, net_m2, target_m2, capacity_basis, persons, governing_term, wall_tiles, door_tiles, adjacency[], service[], source, tier, class, confidence }` + one file-level ladder record + one `unrepresentable[]` list (clinical, industrial, plant, workstation).
- Exceptions / failure mode: The failure this rule exists to prevent — an *assumed* 1.15 uplift rendered identically to a *sourced* 1.15, so the reviewer cannot tell which numbers carry weight.

### SP-24 Quarantine every inherited percentage as a type-named heuristic
- Rule: Any ratio arriving without a building type attached is quarantined as `approximate heuristic`, given the type it is being used for, and re-tested against a sourced band before reuse. Never let a percentage travel between types. `general` is reserved for identities (net + walls = plate), never for uplifts.
- Evidence: The strongest retrieved demonstration of what happens when it does travel: official English school guidance revised its own gross-area recommendation downward by 15 % between editions for the *same* building type — a ratio that was "known" for a decade was wrong by 15 %, in a single type, within a single issuing body.
- Source: GOV.UK BB103 notes — T1 (figure read).
- Class: HEURISTIC (method: DESIGN PRINCIPLE)
- Scope: universal method
- Confidence: High
- Grid translation: Ratio record `{ numerator, denominator, value, classification, type, source, tier }`. Validation gate: reject any `general` classification on an uplift; require `type` be non-empty; compute each ratio from tiles and compare with the claimed value, flagging > ±10 % drift.
- Exceptions / failure mode: "Core-to-shell 15 %" quoted from office towers and applied to a hospital, whose clinical-support and hygiene ratios are far higher — the classic mis-travel, and silent in a tile count.

---

## Area-takeoff method

Each rung is a **tile budget line**, `tiles` and `m² = tiles × 0.25`, provenance-marked
`S` sourced · `D` derived by count · `A` assumed.

```
Gross Floor Area (plate tiles × floors)                              [D — counted from plan boundary]
├─ Structure: wall tiles, shared party walls counted once            [D — exact, SP-14]
├─ Circulation: door tiles + untagged/hall tiles + portal-queue tiles[D — exact, SP-13]
├─ Services: wet riser proxies, laundry, refuse, cleaning, BOH route [D where tagged / A otherwise]
├─ Mechanical: plant footprint + maintenance route                   [A — no host tag, SP-11]
└─ Net Area (assignable + non-assignable)
   ├─ Program: accumulation spaces, SP-19 footprints                 [S target → D actual]
   └─ Support: non-accumulation occupiable — storage, staff, BOH     [S ratio → D]
```

Read top-down to budget the plate; bottom-up to test demand. Reconcile at Net → Gross.

Procedure per rung:
1. **Program tiles** — `Σ ceil(target_m² × 4)` using SP-19 footprints, then re-measure the real flood-fill and use the measurement. Provenance: `S` target, `D` actual. Report the delta.
2. **Support tiles** — driver × ratio (SP-09/SP-10/SP-12). Ratio must carry a classification; if it has no named source it is `A (heuristic)`, not `S`.
3. **Circulation** — *not* an uplift here. Choose the network (SP-13), then `door tiles + untagged tiles`. Compare to a band; report deviation; never silently add.
4. **Structure** — every blocked tile, exactly counted (SP-14). This is the rung that swallows small-room programmes.
5. **Services** — wet/utility rooms (`hygiene`/`laundry`/`cooking`/`pool`) plus cleaning and refuse footprint. Where a service has no tag, either substitute (labelled, SP-16) or move it to the mechanical rung as `assumed`; do not let one tile appear in both services and support.
6. **Mechanical** — an assumed block, reported explicitly as `assumed, no host representation`.
7. **Gross / efficiency** — plate; report `program ÷ gross` at all three levels (SP-18).

Worked shape (arithmetic illustration only; the room areas inside are heuristic, see register).
Every number below was recomputed this pass with `usable = (W−2)(H−2)`, `ring = 2W+2H−4`,
1 tile = 0.5 m, 1 tile = 0.25 m² (tiles → metres shown for both outer and usable):
a 40×30-tile plate = 1200 tiles = 300 m²; treated as one enclosure it keeps usable 38×28 = **1064 tiles
= 266 m²** and loses **136 tiles = 34 m²** to its own ring. Twelve 10×8 guest rooms (**5.0×4.0 m outer**)
each yield usable 8×6 = **48 tiles = 12 m²** (usable 4.0×3.0 m) — the "64 usable tiles = 16 m²" printed
here before was the *footprint* count, not the usable count. Twelve such footprints consume
12 × 80 = **960 tiles = 240 m²** (of which 12 × 32 = 384 tiles = 96 m² is their own wall ring and
12 × 48 = 576 tiles = 144 m² is usable), leaving **240 tiles = 60 m²** for every door, corridor and BOH
space on a twelve-key floor — infeasible. Six 14×11 rooms (**7.0×5.5 m outer**) yield usable
12×9 = **108 tiles = 27 m²** (usable 6.0×4.5 m), not "120 usable ≈ 30 m²"; six footprints take
6 × 154 = 924 tiles = 231 m², pay 6 × 46 = 276 tiles = 69 m² of ring, and leave **276 tiles = 69 m²**
for everything else. The bigger module pays a lower ring tax per room (46/154 = 30 % of footprint vs
32/80 = 40 %), and 27 m² usable overshoots the register's 16–22 m² standard-twin band. The ladder makes
this trade visible in one printout; percentages hide it.

---

## Reference room-area register

Areas in m² (net), tile equivalents at 4 tiles = 1 m². **Reading this table:** unless the Source
column names a document that was actually read this pass, the band is a planning prior only
(`UNCITED — heuristic`, Confidence Low) and must not be presented as a standard. Where an official
document *exists* for a band but its tables were not opened this pass (BB103, HTM 00, HBN 00-01,
HBN 15-02, GSA OAS 7005.1B, UNICEF annex, FAM 1710 — all LOCATED, not read), the row's confidence
reads exactly: **`Low — band located in an official source that could not be read this pass`**. That
phrasing is a demotion, not a citation: nothing in those rows was taken *from* the document. `Tag` is the host
`detectTag` the room will use; `—` means no tag exists and the row is a substitution (SP-16) or
unrepresentable.

### Residential units
| Space | Typical net band | Source | Capacity basis | Service needs | Tag |
|---|---|---|---|---|---|
| Living room (unit) | 14–25 m² (56–100 t) | UNCITED — heuristic, Low | persons seated | — | `living` |
| Bedroom, double | 12–16 m² (48–64 t) | UNCITED — heuristic, Low | 2 persons | — | `living` |
| Bathroom (full) | 4–6 m² (16–24 t) | UNCITED — heuristic, Low | 1 user | water, waste | `hygiene` |
| Kitchen | 7–12 m² (28–48 t) | UNCITED — heuristic, Low | 1–2 workers | water, exhaust | `cooking` |
| Dining | 8–14 m² (32–56 t) | UNCITED — heuristic, Low | seats | — | `dining` |
| Entry/store (unit) | 2–4 m² (8–16 t) | UNCITED — heuristic, Low | ratio to unit | — | `storage` |

### Hotel — guest rooms and back-of-house
| Space | Typical net band | Source | Capacity basis | Service needs | Tag |
|---|---|---|---|---|---|
| Guest room, budget single | 9–13 m² (36–52 t) | UNCITED — heuristic, Low | 1 bed | ensuite | `living` |
| Guest room, standard twin/double | 16–22 m² (64–88 t) | UNCITED — heuristic, Low | 2 persons, incl. bath | wet core | `living` |
| Suite | 35–60 m² (140–240 t) | UNCITED — heuristic, Low | bed + sitting | wet core | `living` |
| Ensuite bathroom | 3.5–5 m² (14–20 t) | UNCITED — heuristic, Low | 1 user | water, waste | `hygiene` |
| Guest corridor, double-loaded | 1.5–2.0 m clear width | UNCITED — heuristic, Low | door count, not area | movement | — (hall) |
| Housekeeping / linen floor store | 4–8 m² (16–32 t) | UNCITED — heuristic, Low | linen par × room count | — | `storage` |
| Staff rest / canteen | 1.2–1.8 m² per shift head | UNCITED — heuristic, Low | peak shift heads | water | `back-of-house` |
| Laundry (on premises) | driver: kg/day | UNCITED — heuristic, Low | machine footprint + clearance | water, exhaust, waste | `laundry` |
| Lobby / front desk | driver: arrivals/hour | UNCITED — heuristic, Low | queue positions | — | `front-desk` |
| F&B outlet | 1.1–1.6 m² per cover | UNCITED — heuristic, Low | covers (seated) | water, exhaust | `dining` |
> **Hotel-specific warning**: the guest-room band above is *inclusive of the bathroom* in most
> published hotel metrics and *exclusive* in residential metrics. Quoting "16 m²" without saying
> which is the SP-06 failure in its purest form.

### Hospital — clinical and non-clinical
| Space | Typical net band | Source | Capacity basis | Service needs | Tag |
|---|---|---|---|---|---|
| Inpatient single room | 11–16 m² (44–64 t) | UNCITED — heuristic, Low | 1 bed + equipment + 1 carer | gases, disposal | `living` (sub) |
| Exam / treatment room | 9–12 m² (36–48 t) | UNCITED — heuristic, Low | couch + clinician | water | `hygiene` (sub) |
| Nurse station | driver: shift staff | UNCITED — heuristic, Low | staff on duty | data | `back-of-house` (sub) |
| Clinical corridor | 2.4–3.0 m clear | UNCITED — heuristic, Low | bed + 2 staff passing | — | — (hall) |
| Procedural / theatre | driver: team + equipment | UNCITED — heuristic, Low | footprint of kit | HVAC-dominant | — (unrepresentable) |
| Utility / sluice / clean store | 4–8 m² (16–32 t) | UNCITED — heuristic, Low | tray count | water | `storage` (sub) |
| Waiting | 1.0–1.5 m² per presentation | UNCITED — heuristic, Low | presentations/day | — | `lounge` (sub) |
> Official source for every row above *exists* (NHS HTM 00 / HBN 00-01 / HBN 15-02, VA S&DC) and was
> **located but not read this pass** — see Sources. Read every row's Source cell as
> **`Low — band located in an official source that could not be read this pass`**; the
> `UNCITED — heuristic, Low` tag is the same statement, and no number in this table came out of an
> HBN/HTM document. Do not upgrade these bands until the HBN room schedule is actually read.

### Office — workstation, meeting, support
| Space | Typical net band | Source | Capacity basis | Service needs | Tag |
|---|---|---|---|---|---|
| Assigned workstation | 4–7 m² (16–28 t) | **`Low — band located in an official source that could not be read this pass`** — GSA OAS 7005.1B is the instrument that would set it and was not retrieved; the 4–7 m² figure itself is `UNCITED — heuristic` and is not taken from GSA | 1 person | power, data | — (see gap) |
| Open-plan area per person | 6–10 m² gross incl. sharing | UNCITED — heuristic, Low, **different denominator from the row above** | 1 person | — | — |
| Meeting room, 4–6 seats | 8–14 m² (32–56 t) | UNCITED — heuristic, Low | seats | — | `meeting` |
| Boardroom / training | 1.8–2.5 m² per seat | UNCITED — heuristic, Low | seats | AV | `meeting` |
| Focus / call booth | 1.5–2.5 m² (6–10 t) | UNCITED — heuristic, Low | 1 | — | `meeting` (sub) |
| Print / copy / supplies | ratio to desks | UNCITED — heuristic, Low | desk count | — | `storage` |
| Pantry / kitchen | driver: heads | UNCITED — heuristic, Low | staff | water | `cooking` |
| Reception / waiting | driver: arrivals | UNCITED — heuristic, Low | queue | — | `front-desk` |
> **Blocking gap**: the host has **no desk/workstation tag**. Open-plan office types as `hall`, so
> an office floor is invisible to the simulation. Substitute `meeting` and log it, or treat the gap
> as a product decision. Do not silently present an office programme as validated.

### Retail — sales, stock, service
| Space | Typical net band | Source | Capacity basis | Service needs | Tag |
|---|---|---|---|---|---|
| Sales floor | load-factor driven | UNCITED — heuristic, Low | occupant load, not area/person | — | `retail` |
| Stockroom | 10–25 % of sales area | UNCITED — heuristic, Low, **retail only** | linear shelving + replenishment cycle | — | `storage` |
| Fitting rooms | 1.5–3.0 m² each | UNCITED — heuristic, Low | units per sales area | — | `hygiene` (sub) |
| Staff welfare | 1.2–1.8 m² per shift head | UNCITED — heuristic, Low | shift heads | water | `back-of-house` |
| Receiving / service corridor | driver: pallet flow | UNCITED — heuristic, Low | bay count | — | — (hall) |
> Sales-to-stock is the row most often quoted as "general". It is retail-format-specific: a
> convenience format and a furniture format differ by an order of magnitude. Do not generalise.

### School — classroom, specialist, shared
| Space | Typical net band | Source | Capacity basis | Service needs | Tag |
|---|---|---|---|---|---|
| General teaching classroom | band exists per age band | **`Low — band located in an official source that could not be read this pass`** — BB103 publishes per-place area guidelines, figures NOT retrieved; "band exists per age band" is a statement about the document, not a sourced number | place (pupil) | — | `meeting` (sub) |
| Whole-school gross effect of the 2010 guidance change | **gross ≈ 15 % lower than BB98 recommended** | GOV.UK BB103 notes (read) — T1 | n/a | — | — |
| Specialist (science / art / D&T) | 1.5–2.2 × general classroom | UNCITED — heuristic, Low, **schools only** | place + station | water, exhaust | `cooking` / `meeting` |
| Assembly / PE hall | driver: pupils + activity spaces | UNCITED — heuristic, Low | peak simultaneous | — | `fitness` |
| Library / resource | 1 seat per N pupils | UNCITED — heuristic, Low | seats | — | `lounge` |
| Canteen / dining | peak roll ÷ sittings | UNCITED — heuristic, Low | sittings | water | `dining` |
| Toilets / changing | ratio to pupils, sex-split | UNCITED — heuristic, Low | pupil ratio | water | `hygiene` |
| Admin / staffroom | 4–6 m² per staff | UNCITED — heuristic, Low | staff | — | `back-of-house` |
> BB103's actual per-place numbers are the single highest-value missing item in this file: it is
> the one T1 document here whose *structure* was confirmed (non-statutory area guidelines +
> minimum internal and external areas + net-capacity formulae) — retrieve the table before use.
> SEND/alternative-provision equivalents: BB104 (located, not retrieved).

### Industrial — production, warehouse, welfare
| Space | Typical net band | Source | Capacity basis | Service needs | Tag |
|---|---|---|---|---|---|
| Production bay | driver: machine + clearance envelope | UNCITED — heuristic, Low | station footprint | power, exhaust | — (unrepresentable) |
| Warehouse / racking | driver: pallet positions | UNCITED — heuristic, Low | pallet × stack height (no 3D here) | — | `storage` |
| Aisle allowance | 3:1-style aisle ratios vary with truck type | UNCITED — heuristic, Low | truck turning radius | — | — (hall) |
| Welfare (WC / canteen / locker) | 1.2–2.0 m² per shift head | UNCITED — heuristic, Low | peak shift heads | water | `back-of-house` |
| Workshop / maintenance | bench count | UNCITED — heuristic, Low | benches | — | `storage` (sub) |
| Loading dock apron | bay count × truck envelope | UNCITED — heuristic, Low | bays | — | — |
> No industrial tag exists. Production space cannot be typed at all; treat the whole family as
> `unrepresentable` in the audit trail rather than mapping it onto `storage`.

### Civic / cultural
| Space | Typical net band | Source | Capacity basis | Service needs | Tag |
|---|---|---|---|---|---|
| Assembly / auditorium seating | row pitch × seat width driven | UNCITED — heuristic, Low | seat | — | `lounge`/`dining` (sub) |
| Gallery exhibition floor | 0.5–2.0 m² per visitor, dwell-dependent | UNCITED — heuristic, Low, **project specific** | persons × dwell | — | — |
| Library reading / stacks | seats + linear shelf m | UNCITED — heuristic, Low | seats / shelf metres | — | `lounge` / `storage` |
| Public WC / locker | ratio to peak capacity | UNCITED — heuristic, Low | peak occupancy ratio | water | `hygiene` |
| Café / bar | 1.1–1.6 m² per cover | UNCITED — heuristic, Low | covers | water, exhaust | `dining` / `bar` |

---

## Sources

Tier key: **T1** official/agency standards · **T2** peer-reviewed · **T3** established
publications (with edition) · **T4** practitioner/professional-service pages · **T5** anecdote.
Status column is part of the citation: `READ` = content retrieved and used; `LOCATED` = document
identified, content not retrieved this pass (so nothing numeric rests on it).

| # | Publisher / document | URL | Tier | Status | Used for |
|---|---|---|---|---|---|
| 1 | DfE/Education and Skills Funding Agency, *Notes on area guidelines for mainstream schools: BB 103* | https://www.gov.uk/government/publications/area-guidelines-and-net-capacity/notes-on-area-guidelines-for-mainstream-schools-bb103 | T1 | **READ** | SP-01/SP-02/SP-05/SP-15/SP-18/SP-22: non-statutory area guidelines; "reduced minimum internal and external areas"; gross "averages 15 % lower than BB98"; separate area-guideline vs net-capacity documents |
| 2 | GOV.UK, *Area guidelines and net capacity* (publication hub) | https://www.gov.uk/government/publications/area-guidelines-and-net-capacity | T1 | LOCATED | SP-03/SP-08: per-place basis + demand→area→capacity formulae |
| 3 | DfES, *Building Bulletin 98: Briefing Framework for Secondary School Projects* (2004), PDF | https://education-uk.org/documents/pdfs/2004-building-bulletin-98-sec.pdf | T1 | LOCATED | SP-01: briefing-before-sizing as an official two-stage process; the pre-2010 gross baseline |
| 4 | DfE, *BB 104 Area guidelines for SEND and alternative provision* | https://www.gov.uk/government/publications/area-guidelines-for-send-and-alternative-provision-bb-104 | T1 | LOCATED | School register (specialist bands) — not read |
| 5 | NHS England, *HTM 00: Policies and principles of facilities design and construction*, PDF | https://www.england.nhs.uk/wp-content/uploads/2021/05/HTM_00.pdf | T1 | LOCATED (binary, not parsed) | SP-11/SP-20: plant + services as named drivers; hospital register — no figure taken |
| 6 | NSS Scotland, *Core guidance — general design for healthcare buildings (HBN 00-01)* | https://www.nss.nhs.scot/publications/core-guidance-general-design-for-healthcare-buildings-hbn-00-01/ | T1 | LOCATED | Hospital corridor/room schedule bands — not read |
| 7 | NHS Wales / NWSSP, *HBN 15-02 Facilities for same day emergency care*, PDF | https://nwssp.nhs.wales/ourservices/specialist-estates-services/specialist-estates-services-documents/whbns-library/hbn-15-02-facilities-for-same-day-emergency-ambulatory-care/ | T1 | LOCATED | Clinical room areas — not read |
| 8 | GSA, OAS 7005.1B *Internal Space Allocation, Design, and Management Policy*, PDF | https://www.gsa.gov/directives/files?file=2026-06%2FOAS%207005.1B%2C%20Internal%20Space%20Allocation%2C%20Design%2C%20and%20Management%20Policy.pdf | T1 | LOCATED (fetch not attempted) | SP-09/SP-17: per-occupant federal allocation policy — no figure taken |
| 9 | US Dept of State, *FAM 06FAM-1710 Office Space Assignment and Utilization, Design and Construction* | https://fam.state.gov/fam/06fam/06fam1710.html | T1 | LOCATED, **fetch failed** | SP-17 office area per person — nothing taken from it |
| 10 | UNICEF, *Office Space Standards and Guidelines* (management-premises annex) | https://www.unicef.org/nepal/media/20591/file/New_Office_Annex_F_UNICEF_management_premises_guidelines_for_dhangadi.pdf | T1 | LOCATED | SP-03/SP-17 institutional per-person allocation — not read |
| 11 | BOMA International, *BOMA Standards* (ANSI/BOMA Z65.1 family) | https://boma.org/boma-standards/ | T1 | LOCATED | SP-06/SP-18: usable vs rentable, load factor; North American jurisdiction |
| 12 | RICS, *New IPMS aims to enable consistent measurement* (Property Journal) | https://ww3.rics.org/uk/en/journals/property-measurement-standards.html (article: https://ww3.rics.org/uk/en/journals/property-journal/ipms-enables-consistent-measurement.html) | T1 | LOCATED | SP-06/SP-18: IPMS 1–3, UK jurisdiction, measurement to internal face of perimeter wall |
| 13 | Blackacre Surveyors, *RICS Code of Measuring Practice: a guide to GEA, GIA, NIA and IPMS* | https://blackacresurveyors.com/blog/why-international-property-measurement-standards-ipms/ | T4 | LOCATED | SP-06: practitioner summary of what each convention counts |
| 14 | *Towards harmonizing property measurement standards* (ResearchGate) | https://www.researchgate.net/publication/329812287_Towards_harmonizing_property_measurement_standards | T2 | LOCATED (abstract stream) | SP-06/SP-18: evidence the conventions are materially non-comparable |
| 15 | WBDG (NIBS), *Architectural Programming* | https://www.wbdg.org/design-disciplines/architectural-programming | T1/T3 | LOCATED | SP-01/SP-23: programming as named pre-design discipline and its documented output |
| 16 | The Foraker Group, *Architectural Programming* | https://www.forakergroup.org/predevelopment/resources/architectural-programming/ | T4 | LOCATED | SP-01/SP-23: programme as the artefact design is demonstrated against |
| 17 | OfficeSpaceSoftware, *Office space per person: standards and density benchmarks* | https://www.officespacesoftware.com/blog/recommended-office-space-per-employee/ | T4 | LOCATED | SP-17: the (unverified) existence of competing commercial density figures — no number taken |
| 18 | F. Neufert / P. Neufert, *Architects' Data*, 3rd ed. (English), Wiley | print — no URL | T3 | **NOT CONSULTED** | Target for the whole register's real bands; every heuristic row should be re-sourced here |
| 19 | *Time-Saver Standards for Building Types*, 5th ed., McGraw-Hill | print — no URL | T3 | **NOT CONSULTED** | Per-space-type net areas and the type-by-type take-off this file's register should eventually match |
| 20 | Ching, *Building Construction Illustrated*, 5th ed., Wiley | print — no URL | T3 | CITED BY EDITION ONLY | SP-14: real internal partitions ≈ 0.10–0.20 m, to contrast the host's 0.5 m wall |
| 21 | Host codebase: `src/blueprint-editor/domain/schema/rooms.ts:9-38`; `src/engine/npc/rooms.ts` | repo-local | project T1 | **READ, verified** | SP-04/SP-13/SP-14/SP-16/SP-19: 15 detectTags, `hall` priority 999, lowest-priority-wins typing, door exclusion from rooms |
| 22 | Companion research file: `architecture-skill/research/architecture-theory.md` (TH-01, TH-02) | repo-local | — | READ | Wall-tax arithmetic, octile-cost/diagonal rule, programme-table format |

Accessed: this session, single pass. Anything marked LOCATED needs a second, targeted retrieval.

---

## Weak or contested

1. **Host tag gaps dominate everything else.** No tag exists for workstation/desk, clinical use,
   industrial/production, plant, refuse or waste. Those entire programme families are invisible to
   the simulation, so a plan containing them cannot be validated (SP-16 is containment, not a fix).
2. **Almost every area band in the register is `UNCITED — heuristic`, Confidence Low.** This pass
   retrieved source *identity* but not source *numbers*: BB103, BB98, BB104, HTM 00, HBN 00-01,
   HBN 15-02, GSA 7005.1B, UNICEF annex and FAM 1710 all resisted retrieval (binary PDFs / failed
   fetch). The only quantitative datum actually read in this file set is item 1 below.
3. **Only one sourced figure is used anywhere in this file**: the English schools gross-area change,
   "on average 15 % lower than that recommended in BB98" (BB103 notes, T1, read). It is used for
   SP-05, SP-22 and SP-24 as evidence that official ratios move by 15 % between editions — not as a
   design input for any project.
4. **Net-to-gross uplift percentages are structurally wrong on this host.** Published efficiency
   benchmarks assume 0.10–0.20 m partitions; this grid charges 0.5 m and adds a door-tile tax. Every
   imported percentage must be re-derived from tile counts before use.
5. **No 3D, no heights, no daylight, no stack, no occupancy durations.** Mechanical (SP-11),
   environmental drivers (SP-20), and multi-storey evacuation (SP-07) can be *budgeted as assumed*
   but never *derived*. Reporting them as zero is honest; reporting them as computed is not.
6. **Occupant-load factor basis is US-model-code-shaped** (IBC lineage) and was not retrieved; other
   jurisdictions differ numerically. Non-US users must re-source. Contested even within the US
   between adopted code editions.
7. **BOMA vs RICS clause-level detail is asserted from titles, not from text.** The claim that they
   diverge is safe; the claim about *what exactly each counts* (columns, wall cavities, common areas)
   is Low confidence until Z65.1 and the IPMS standard are read.
8. **Register rows cross-contaminate across the host's typing.** A hotel suite with an ensuite
   contains `living` + `hygiene` fixtures, and the code types it `bedroom` (priority 10 beats 20) —
   so the register's "guest room 16–22 m² incl. bath" and "ensuite 3.5–5 m²" cannot both be validated
   on the same flood-fill. Area bands and the typing model are not in agreement; unresolved.
9. **Hotel BOH ratios, retail sales-to-stock, and per-cover F&B densities have no retrieved source
   at all** in this file and are the three weakest families of numbers in it. Treat as placeholders.
10. **Support-ratio denominators are inconsistent across sources** (some divide by net program, some
    by gross floor, some by headcount). Every ratio row in the audit trail must therefore carry its
    denominator explicitly; a ratio without a denominator is unusable.

---

## Type-specificity audit

Every ratio in this file, classified. `general` is reserved for identities (SP-24) — never an uplift.

| Ratio / number | Classification | Building type it came from | Travels to other types? | Confidence |
|---|---|---|---|---|
| `1 tile = 0.25 m²`; `usable = (W-2)(H-2)`; ring = `2W+2H-4` | general (arithmetic identity) | host grid | Yes — definitionally | High |
| Wall tax 11–60 % by room size | general *on this grid* only (geometric identity, not an architectural truth) | host grid | **No** — not a real-world figure | High (here) / n/a elsewhere |
| 4 tiles per m² resolution floor on area-per-person | general (grid artefact) | host grid | Yes | High |
| Corridor width bands 1.0 / 1.5 / 2.0 / 3.0 m | approximate heuristic, informed by egress minima | mixed, US-code flavoured | Partially — re-check jurisdiction | Low |
| Circulation share of plate | building-type specific | each type has its own | **No** | Low |
| BOH ÷ guest-room tiles | building-type specific | hotel | **No** | Low |
| Sales-to-stock (10–25 % of sales area) | building-type specific, and format-specific within retail | retail | **No** — worst offender if generalised | Low |
| Area per cover (1.1–1.6 m²) | building-type specific | F&B / hotel / civic café | Only within seated-dining uses | Low |
| Area per shift head for welfare (1.2–2.0 m²) | approximate heuristic, repeated across hotel/retail/industrial | institutional workplaces | Weakly — same activity (break + WC), verify per type | Low |
| Area per person desk (4–7 m² net vs 6–10 m² gross) | building-type specific **and** denominator-specific | office | **No** — the two rows above are not comparable | `Low — band located in an official source (GSA OAS 7005.1B) that could not be read this pass`; the m² values are this file's heuristics, not GSA's |
| Area per place (pupil) | building-type specific; an official T1 band *exists* (BB103) but was not read | schools | No | `Low — band located in an official source that could not be read this pass` (**Medium** only that a band exists; **not read** — the value was never taken from BB103) |
| Gross ≈ 15 % lower (BB98 → BB103) | project-independent *historical fact* within one type + one issuing body + one jurisdiction | English secondary schools | **No** — never used as an uplift | High (as read) |
| Specialist classroom = 1.5–2.2 × general classroom | approximate heuristic | schools | No | Low |
| Mechanical % of floor | approximate heuristic — **should be replaced by an equipment count** (SP-11) | unattributed; that is the point | No | Low |
| Core-to-shell / net-to-gross efficiency (e.g. "85 %") | project specific, and lease-side specific | multi-tenant office towers | **No** — the canonical mis-travel (SP-24) | Low |
| Room minimum dimensions 3.0 m habitable / 2.0 m service; aspect ≤ 3:1 | approximate heuristic, derived from habitability conventions + BB103's "minimum internal areas" statement | residential/education, UK-flavoured | Partially; hard minima are jurisdictional | Medium (structure) / Low (values) |
| Dominant-use typing when fixtures conflict (bed beats bath) | general (host code fact) | host grid | Yes | High |
