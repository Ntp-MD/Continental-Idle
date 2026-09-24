# Research file — Multi-level validation (DOMAIN W): the validation layer for a tile-grid designer

Scope: what the agent must check when it has drawn a building on the host grid, at which of the
seven levels, in which order, with which computed metric and threshold, and — critically — what it
must emit when the check cannot be made because the engine carries no data for it (structure, MEP,
heights, acoustics, jurisdiction). This file is the parent of the skill's Validation section. It
does not restate domain thresholds; it routes them: code numbers come from `building-codes.md`
(CODE-nn), operational numbers from `professional-practice.md` (PP-nn), design numbers from
`architecture-theory.md` (TH-nn). Validation methodology (checkers, verdicts, severities,
escalation) is researched from automated code-compliance checking, buildingSMART IDS, ISO 19650
checking/approval, AHJ plan review, design-review protocols, and formal-verification/SAST analogies.

Host grid this file is written against: `1 tile = 0.5 m`; 4 tiles = 1 m²; tile states ONLY
`walkable | blocked | door`; wall = one blocked tile; rooms = flood-fill of walkable tiles typed by
fixture tags; doors = door-tile runs; A* octile (`max(dx,dz)+0.41421×min(dx,dz)`, diagonals only if
both corner neighbours open); vertical = lift/stair portals with queues; access by tags; NO heights,
NO sections, NO structural or MEP objects.

Derived validation constants used below: a check is a tuple (id, level, category, oracle ref,
input, computation, threshold, verdict, severity); verdict ∈ {pass, fail, unknown}; severity ∈
{critical, major, moderate, minor}; every metric is reported in metres/tiles with the rounding
policy stated (§"Check ordering", VA-17).

---

## Rules

### VA-01 Write the oracle before you design; validate only against written requirements
- Rule: No check may use the agent's memory of the brief as its threshold. Before the first tile is placed, freeze a machine-readable requirements document (programme rows, adjacency grades, capacities, per-space minima, forbidden relations, vertical demand); the validation pass reads ONLY that document plus the plan. Anything not in the document cannot be "failed" later.
- Evidence: buildingSMART's IDS is exactly this artefact for BIM: a "computer interpretable XML based standard from buildingSMART to define IFC based Information Delivery Specifications" — requirements written first, in a structure all tools read the same way (buildingSMART IDS repository). Solibri: "IDS files are a standardized machine-readable format for tools, such as Solibri, to automatically check" a model "by anyone who wants to create requirements to have a model checked against" — i.e. the check target is a written spec, not reviewer memory. Model checking has the same discipline: a property is stated independently of the model it is run against (Clarke/Havelund lineage, via CEGAR summary).
- Source: buildingSMART IDS repository https://github.com/buildingSMART/IDS — T1; Solibri, *Everything you need to know about Information Delivery Specifications* https://www.solibri.com/articles/everything-you-need-to-know-about-information-delivery-specifications — T3.
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: High
- Grid translation: Input: the TH-01 programme table, the TH-03 adjacency matrix, egress/access requirement records (CODE file), vertical demand. Computation: emit them as a `requirements@vN` record with a version tag; the validator signature must take `(plan, requirements@vN)`. Output: a plan validated against no requirements file is rejected as unvalidatable; each requirement row gets a check-id backlink.
- Exceptions / failure mode: Exploratory sketching without an oracle is allowed but must be labelled "unvalidated draft" — its verdicts may not be quoted later. Failure symptom: agent "fails" its own design for a requirement invented mid-review, or passes a room no one asked for.

### VA-02 Separate verification from validation; schedule both, never substitute one for the other
- Rule: Run two distinct passes. Verification asks "did we build the stated requirement correctly?" (geometry, counts, graph properties against the frozen oracle). Validation asks "is the stated requirement the right one for the user?" (does the room support the activity, does the plan serve the operational model). A plan can pass every verification check and still be invalid.
- Evidence: The V-model states the pair exactly: verification = "Are you building it right?", validation = "Are you building the right thing?", with the right-hand test levels (component → integration → system → acceptance) mirroring left-hand specification levels (Wikipedia, *V-model*). In information management the analogue split is checking vs approval: "reviews of information play an important role in ensuring that information complies with the agreed specifications" while "authorisation will confirm that the information has met the requirements and can proceed to the next step" (ISO 19650-2 as explained by CCM) — two different acts, two different owners.
- Source: Wikipedia, V-model https://en.wikipedia.org/wiki/V-model — T3; CCM, *ISO 19650-2 Explained* https://www.uniccm.com/iso-19650-2-explained — T4 (explainer of a T1 standard; standard text itself not retrieved); UCL/Buro Happold project review guidelines, CIBSE Journal https://www.cibsejournal.com/technical/lessons-learned-ucl-and-buro-happolds-award-winning-project-review-guidelines/ — T3.
- Class: STANDARD
- Scope: universal
- Confidence: High
- Grid translation: Verification pass = every deterministic grid check (VA-05 order). Validation pass = (a) replay the programme activities as fixture+clearance checks, (b) replay the operator's day from PP-06 as a route trace, (c) compare room set against type card. Both passes emit records; the sign-off block of the report must contain a validation verdict line distinct from the verification verdict line.
- Exceptions / failure mode: Tiny projects collapse the passes into one review — keep the two record families anyway; merging them is how "no bugs found" becomes mistaken for "right building". Symptom: zero geometric defects, service trolley cannot reach the linen room, untested.

### VA-03 Emit three-valued verdicts — pass / fail / unknown — and report every unknown explicitly
- Rule: Every check result is `pass`, `fail`, or `unknown` (data absent for the check). `unknown` is a first-class, counted, reported outcome; it must never collapse into pass or silence. The end of every validation run states an unknowns register with what data would close each entry.
- Evidence: Formal verification never produces a boolean when the model is too coarse: counterexample-guided abstraction refinement checks an *abstracted* model with three-valued semantics, and "refinement is performed when a counterexample is found to be spurious" — i.e. the tool reports "unknown at this abstraction" rather than guessing (Clarke/Grumberg/Jha/Lu/Vardi, JACM 2003, via Wikipedia CEGAR). ACC practice likewise: a knowledge-graph checker output is "warning, which indicates the need for manual re-checking" rather than a silent verdict (PMC review of BIM-based ACC).
- Source: Wikipedia, Counterexample-guided abstraction refinement https://en.wikipedia.org/wiki/Counterexample-guided_abstraction_refinement — T3; original: Clarke et al., *Counterexample-guided abstraction refinement for symbolic model checking*, JACM 50(5) 2003, https://dl.acm.org/doi/10.1145/876638.876643 — T2; PMC10151318 https://pmc.ncbi.nlm.nih.gov/articles/PMC10151318/ — T2.
- Class: FACT (method property)
- Scope: universal
- Confidence: High
- Grid translation: The validator returns `{checks_run, pass[], fail[], unknown[]}`. For every category in the 11-category matrix, the suite definition pre-marks which checks are data-available on this grid; e.g. all thermal/acoustic/structural checks return `unknown: engine has no height/material data` and are listed, not dropped. Output record per unknown: id, missing datum, escalation owner (VA-20).
- Exceptions / failure mode: False confidence from "0 failures" — always quote failures AND unknowns together ("12 pass / 1 fail / 41 unknown"). Symptom: agent ships a plan whose only checked aspects were the checkable ones.

### VA-04 Never say "compliant" — say "consistent / inconsistent with <source>, jurisdiction X, verification required"
- Rule: A grid check that touches any code-derived number must phrase its verdict as consistency with a named source and edition, jurisdiction, and an explicit "verification required" flag. Self-checking is a pre-review device; it is not approval, and approval belongs to a different party (VA-20).
- Evidence: The AHJ workflow makes the boundary concrete: the state reviewer "examines construction documents and supporting documentation" (MN DLI), LA plan check issues per-clause correction comments ("update foundation details per LABC Section 1808") which the designer must clear before "once corrections are cleared, the permit is issued" — approval is an act of the reviewer on the submitted documents, never a property the designer's checker can assert. In ISO 19650 the same separation is definitional (checking ≠ authorised approval).
- Source: Minnesota Department of Labor and Industry, *Building plan review* https://www.dli.mn.gov/business/get-licenses-and-permits/building-plan-review — T1; JDJ Consulting, *How to read LADBS correction notices* https://jdj-consulting.com/how-to-read-ladbs-correction-notices-a-homeowners-guide-to-plan-check-comments/ — T4; CCM ISO 19650-2 explainer https://www.uniccm.com/iso-19650-2-explained — T4.
- Class: CODE REQUIREMENT (framing rule, not a clause)
- Scope: universal; jurisdiction field is mandatory for every code-linked check
- Confidence: High
- Grid translation: Every check record carries `threshold_source: "IBC 2021 T1004.5 via WA-adopted mirror (jurisdiction: WA/US, edition 2021)"` and verdict vocabulary restricted to `consistent | inconsistent | unknown`. The word "compliant/compliance" must not appear in any agent output; lint the report template for it.
- Exceptions / failure mode: A pass on a consistency check used in a pitch or commit message as "code-compliant". That is the single most dangerous failure mode of an automated validator; treat any instance as a report-template defect.

### VA-05 Order checks cheapest-first and most-critical-first; complete all criticals before fixing majors
- Rule: Run the suite in cost order (tile-local O(1) checks → flood-fills → all-pairs A* → multi-floor graph → simulated trips), but severity order dominates within a pass: collect ALL critical failures before opening any major, and never spend an iteration on moderate/minor issues while a critical is open. Default severity order: Safety > structural feasibility > basic function > circulation > operations > environmental > efficiency > experience > aesthetics (project may re-weight; type cards override, see Type-specificity audit).
- Evidence: Defect triage defines criticality by consequence, not by discovery cost: "a critical defect could cause an unsafe condition or violate a regulation, no matter how small it looks"; "a major defect is not a safety issue but is likely to make the product fail"; "a minor defect is a cosmetic departure" — and known criticals "automatically stop production" (defect classification guidance). Cost-ordered checking with refinement is also how CEGAR avoids state blow-up — cheap abstraction first, expensive detail only when needed.
- Source: Harmony AI, *Defect Classification: Critical, Major, Minor* https://www.tryharmony.ai/defect-classification-critical-major-minor — T4; Wikipedia CEGAR https://en.wikipedia.org/wiki/Counterexample-guided_abstraction_refinement — T3; priority ladder from the deliverable spec §36.
- Class: HEURISTIC
- Scope: universal; the weight order between circulation/operations/environmental is type-dependent
- Confidence: High for the taxonomy; Medium for the default cross-category order (spec itself calls it "default reasoning order, not immutable")
- Grid translation: Cost tiers: T0 tile-local (area, width, door run length) → T1 per-room flood-fill (room extraction, wall share) → T2 per-floor graph (connectivity, A* distances, pinch counts) → T3 cross-floor (portal stacks, multi-floor A*) → T4 demand simulation (OD-matrix trips, queue pressure). Execution plan: run every T0/T1 critical check; then all remaining critical at next tier; stop and fix when a critical fails; only after all criticals pass, run majors, etc. Output the tier/severity grid in the report header.
- Exceptions / failure mode: Expensive simulation run on a plan with a broken room (unvalidated input makes metrics meaningless) — VA-07 gate prevents this. Opposite failure: fixing cosmetics forever because they are pleasant to fix while the shared egress leg stays over budget.

### VA-06 Test at the level where the defect lives; a check must name its level
- Rule: Every check is tagged to exactly one of the seven levels (human, room, zone, floor, building, site, lifecycle) and uses inputs available at that level. Do not attempt to answer floor-level questions with room-level statistics (averages hide the pinch), and do not re-litigate room minima during a site review.
- Evidence: The V-model pairs each specification level with its own test level ("component test ... integration test ... system test" mirroring architecture/requirements), because defects at one level are invisible at another. Space-syntax practice makes the same point for movement: observed pedestrian counts were compared against *simulated movement over the whole configurational graph*, not against per-room areas ("correlation between simulated agent movement density and observed pedestrian counts was strong enough to confirm" the model) — floor-level phenomena need floor-level representation (CCD review of Penn/Hillier).
- Source: Wikipedia V-model https://en.wikipedia.org/wiki/V-model — T3; theccd.org, *Space Syntax And Spatial Cognition* https://theccd.org/spotlight-research/space-syntax-and-spatial-cognition-or-why-the-axial-line/ — T3 (of T2 research).
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: High
- Grid translation: Levels as data scopes on the host: human = fixture clearance constants (0.75 m = 1.5 tiles → round per VA-17); room = one flood-fill; zone = tagged room groups; floor = one tile grid + its graph; building = floors joined by portal edges; site = grid boundary + external door tiles; lifecycle = plan-as-history (edit log, repetition stats). Check records carry `level:` so reports roll up per level (see Validation hierarchy).
- Exceptions / failure mode: Cross-level leaks are genuinely useful when one-way: a floor-level result may *trigger* a room-level re-check (e.g. a bottleneck tile reveals an under-wide door), but may not *substitute* for it.

### VA-07 Run a model-integrity gate before any semantic check
- Rule: The first phase verifies the *model*, not the design: every tile has exactly one legal state; every door tile is flanked such that it joins two walkable regions (a door into the void is a defect); flood-filled rooms are disjoint and cover every walkable tile except door cells **except door cells, which belong to no room by construction** (`src/engine/npc/rooms.ts:2,15,33`) — so the tile-class reconciliation `occupied + (walkable-with-no-room ∪ door) + blocked = grid` must close exactly; a door run laid across a single intended room's width is a defect because it divides that room into two (isolated door tiles in an open area do not - measure the derived room count); portal endpoints exist and are walkable; no room has zero interior. Semantic checks run only on a model that passes this gate.
- Evidence: Automated code checking research consistently puts model quality first: the knowledge-graph ACC review states the binding constraint is data sufficiency — "existing BIM modeling specifications of various professions cannot meet the review requirements" — and preprocessing/model validation is a named stage of every ACC pipeline. Static analysers similarly parse before they check; "the scan is performed before the code is executable" (Snyk on SAST) — a malformed artefact has no verdicts.
- Source: PMC10151318 https://pmc.ncbi.nlm.nih.gov/articles/PMC10151318/ — T2; Snyk, *Static Application Security Testing (SAST) Scanning* https://snyk.io/articles/application-security/static-application-security-testing/ — T3.
- Class: ENGINEERING CONSTRAINT
- Scope: universal on any derived-data host model
- Confidence: High
- Grid translation: Integrity pass = O(n) tile scan + union-find over walkable regions + door-flanking test + portal-anchor test. Verdict `model-integrity: pass|fail(counters)`. On fail: everything else is reported `unknown: model invalid`, not run. Output the offending tile coordinates as counterexamples (VA-08).
- Exceptions / failure mode: "Harmless" anomalies (a door tile touching only blocked tiles) poison every downstream flood-fill: rooms vanish, egress checks "pass" on phantom geometry. This gate is what distinguishes *check failed* from *check impossible* (VA-10, VA-18).

### VA-08 Every fail ships a counterexample, not just a boolean
- Rule: A failing check must emit the specific witness: the tile(s), room(s), path, or pair that violates the rule, plus the measured value. A failure without a witness is a defect in the checker, not in the design.
- Evidence: This is model checking's defining gift over testing: "if a desired property for a program is not satisfied in the abstract model, a counterexample is generated" — the witness is as important as the verdict, both for repair and for judging whether the abstraction is lying (CEGAR: some counterexamples are spurious and that judgement needs the concrete witness).
- Source: Wikipedia CEGAR https://en.wikipedia.org/wiki/Counterexample-guided_abstraction_refinement — T3; Clarke et al. JACM 2003 https://dl.acm.org/doi/10.1145/876638.876643 — T2.
- Class: FACT (method property)
- Scope: universal
- Confidence: High
- Grid translation: Output record fields `witness:` (e.g. "tiles (r42,c17)-(r42,c19); measured 3 tiles = 1.5 m", "shortest path entry→exit = 61 tiles, through corridor pinch at (r30,c88)") and `measured:` numeric. Every check computation in this file returns `(value, witness)` on threshold breach.
- Exceptions / failure mode: Aggregate checks (net-to-gross ratio) have no single witness — witness = the top-3 worst-contributing rooms so repair stays local.

### VA-09 Grade severity by consequence; small things can be critical
- Rule: Severity is assigned from consequence class (unsafe condition or requirement violation = critical; function loss = major; efficiency/comfort erosion = moderate; cosmetic = minor) — never from the size of the geometry involved, and never from how embarrassing it is to find.
- Evidence: QA defect grading: "a critical defect could cause an unsafe condition or violate a regulation, no matter how small it looks" (one 1-tile violation of a 1.1 m door minimum is critical; a whole wasted 20 m² lounge is at most major). Plan-check comments behave identically: a single cited-clause item blocks permit issuance regardless of everything else that is right.
- Source: Harmony AI defect classification https://www.tryharmony.ai/defect-classification-critical-major-minor — T4; JDJ/LADBS correction-notice guide https://jdj-consulting.com/how-to-read-ladbs-correction-notices-a-homeowners-guide-to-plan-check-comments/ — T4.
- Class: STANDARD
- Scope: universal
- Confidence: High
- Grid translation: Mapping baked into the suite: safety-critical geometry (egress widths, shared-path maxima, door minima) = critical; programme/function (room below required area, must-touch unmet) = major; circulation/operations (detour > 20 %, pinch density) = moderate-major by PP thresholds; experience/lifecycle = minor-moderate. Verdict roll-up = max severity among fails, unknowns listed beside it.
- Exceptions / failure mode: Type cards re-map severities (a chapel's "dead-end" tolerance ≠ a hospital's; see Type-specificity audit). Never let the mapping be implicit per-plan.

### VA-10 Maintain a capability manifest: "cannot check" is reported as a suite property, not a plan property
- Rule: The suite definition must pre-declare, per category, which checks are computable on this grid, which are proxy-only, and which are impossible — before any specific plan is validated. An unknown verdict then means "this plan cannot supply the datum", while "not in suite" means "we have no capability at all"; both go into the report as separate lists.
- Evidence: ACC reviews attribute most non-automation to missing data and rule-encoding gaps rather than design failure — code text complexity and "insufficient model detail" are the named barriers; the honest output is a re-check/manual-review channel, not silence. IDS practice institutionalises this: requirements are declared up front with applicability, and "if any are found, the specification fails" only for what was actually specified — un-specified properties are simply outside the check (BIMcollab IDS how-to).
- Source: BIMcollab, *Creating an IDS* https://helpcenter.bimcollab.com/en/articles/327351-creating-an-ids-information-delivery-specification — T3; PMC10151318 — T2.
- Class: DESIGN PRINCIPLE
- Scope: universal for this host
- Confidence: High
- Grid translation: Suite file marks each check `capability: computable|proxy|none`. The fixed `none` list on this grid: structural load paths, fire-rated assembly continuity, smoke control, daylight factors, thermal/acoustic performance, sprinkler coverage, shaft sizing, construction sequencing, sightlines, ceiling heights. Report template has a standing "capability manifest" block so the reader sees the envelope of the checks before reading verdicts.
- Exceptions / failure mode: Silent category loss — the reader infers "environmental: passed" from absence. The standing block is the only acceptable mitigation.

### VA-11 The check suite is a declarative, versioned artefact — never improvise per plan
- Rule: Encode each check as data (id, oracle ref, level, category, metric, threshold, severity, capability), versioned alongside the requirements document; a design pass runs the suite; only suite edits (with reasons) change what is checked. Ad-hoc "while I'm here" checks are recorded as suite proposals, not used as verdicts.
- Evidence: IDS is precisely a declarative requirement document (description/applicability/requirements sections, facets for entity/property/attribute, cardinality bounds on matches) so that different tools check the same thing the same way — the point of "standardized machine-readable format for tools" (Solibri; BIMcollab). The alternative — per-reviewer improvisation — is what automated checking exists to remove.
- Source: Solibri IDS article https://www.solibri.com/articles/everything-you-need-to-know-about-information-delivery-specifications — T3; BIMcollab https://helpcenter.bimcollab.com/en/articles/327351-creating-an-ids-information-delivery-specification — T3; buildingSMART IDS repo https://github.com/buildingSMART/IDS — T1.
- Class: STANDARD
- Scope: universal
- Confidence: High
- Grid translation: `suite@vN` JSON: `[{id:"VA-EG-02", level:"floor", category:"safety", metric:"max common-path tiles", threshold:13, unit:"tiles", oracle:"CODE-03@IBC2021-WA-mirror", severity:"critical", capability:"computable"}, ...]`. Both `requirements@vN` and `suite@vN` ids appear in every report record (reproducibility).
- Exceptions / failure mode: Suite drift — thresholds edited to make a design pass. Prohibit: threshold changes require an oracle-change entry citing the new/edition source; the report shows threshold provenance so drift is visible.

### VA-12 Test the checker before trusting the check: known-good and known-bad fixtures
- Rule: Every check must ship with at least one fixture that must pass (canonical good geometry) and one that must fail (a minimal violation of exactly 1 tile). A check without fixtures is `capability: untested` and its verdicts may not close issues. Re-run fixtures whenever the metric code changes.
- Evidence: Static analysers are demonstrably unreliable without measurement: "legacy SAST tools could have a 50 to 80% false positive rate" (Snyk) — a scanner nobody tests silently redefines what "safe" means; commercial pipelines answer this by defaulting to "high-confidence findings to reduce noise" and letting humans re-grade (Mend triage docs). Model checkers are themselves validated against benchmark suites, and ACC research calls the trust problem "model validation" for the checking system, distinct from checking the building (literature title below in Weak section).
- Source: Snyk SAST article https://snyk.io/articles/application-security/static-application-security-testing/ — T3; Mend.io, *Triage your code security findings* https://docs.mend.io/platform/latest/triage-your-code-security-findings — T3.
- Class: FACT (tooling property)
- Scope: universal
- Confidence: High
- Grid translation: Fixture = tiny embedded grids (e.g. 9×9 with one 25-tile corridor: must flag shared-path fail; same with 12-tile variant: must pass). The validation run reports `suite-self-test: 24/24 checks exercised, 0 fixture failures`. Self-test failure blocks the whole run — the plan cannot be blamed for the checker's bug.
- Exceptions / failure mode: Flaky threshold due to rounding (VA-17) caught only by 1-tile-boundary fixtures — mandate boundary cases at every rounding seam.

### VA-13 Budget false positives; suppress only in writing, and re-sweep suppressions periodically
- Rule: Assume some consistency checks will fire on legitimate designs. Give each check a measured or estimated false-positive tendency; triage every finding once with a written reason; a suppressed finding stays visible as `accepted-risk(reason)`, and suppression applies to the rule-class, not to one drawing secretly. Checks that misfire repeatedly are fixed or demoted to advisory.
- Evidence: Triage discipline in security scanning: findings are potential issues, not confirmed bugs; the workflow is "when a false-positive/acceptable risk is reported, ... suppress it" — an explicit recorded act; "if you disagree with the severity assigned to the finding, you can change it" (Mend). Noise management is an accepted feature ("default to high-confidence findings to reduce noise"), not an embarrassment. Design review does the architectural version: UCL's guidelines institutionalise findings follow-through so review output reduces "defects and uncompleted work at handover" rather than becoming unread paper.
- Source: Mend.io triage docs https://docs.mend.io/platform/latest/triage-your-code-security-findings — T3; CIBSE Journal, UCL/Buro Happold project review https://www.cibsejournal.com/technical/lessons-learned-ucl-and-buro-happolds-award-winning-project-review-guidelines/ — T3.
- Class: HEURISTIC
- Scope: universal
- Confidence: Medium-high (rates quoted by vendors; behaviour generalises, numbers don't)
- Grid translation: Report class `accepted-risk: [{check, design-context, reason, granted-by, review-version}]`. Example: shared-path exceedance accepted because the space is storage with 0 occupant load per oracle — the acceptance cites the oracle row, not a vibe. Re-sweep: if `requirements@vN+1` changes occupant loads, prior acceptances are voided automatically.
- Exceptions / failure mode: Suppression rot (findings hidden under a stale justification) and its twin, alert fatigue → blanket ignore. Both are caught only because VA-03 forces unknown/accepted lists into the headline numbers.

### VA-14 After any edit, re-run validation over the edit's blast radius, not just over the edit
- Rule: A tile change can break floor-level and building-level checks far from it (a relocated wall changes every path through it, collapses a room, unstacks a shaft proxy). Define per-operation blast radii (local: room; corridor move: whole floor's circulation graph; portal move: whole building graph) and re-run every check whose input set intersects the radius. Detect cascades: if fixing X opens a new fail Y, Y is reported as caused-by-X.
- Evidence: CEGAR is a loop precisely because each refinement re-subjects the model to the full prior property set — you never re-trust only the fixed part. Regression practice in software is the same law (tests are re-run after change; V-model right arm repeats at each integration level). Plan check institutionalises the re-look: corrections trigger re-review of the resubmitted package, not just of the corrected page ("once corrections are cleared, the permit is issued" — clearance is of the whole, again).
- Source: Wikipedia CEGAR — T3; JDJ/LADBS guide — T4; V-model — T3.
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: High
- Grid translation: Input: edit log entry `(op, tiles)`. Computation: recompute affected flood-fills; if any room membership changed, rerun that room's checks + zone/floor graph checks; if portal changed, rerun building tier. Output: `caused-by` chain field in each new failure record; "cascade detected" headline when ≥2 dependent checks flip verdict in one iteration.
- Exceptions / failure mode: Full-suite rerun every edit is the safe lazy fallback given this grid's small sizes; optimise only if profiling says so. Never under-run: stale green checks are worse than red ones.

### VA-15 Validate circulation with simulated trips; eyeballing corridors proves nothing
- Rule: Floor and building circulation verdicts come from running A* over an origin-destination set derived from the programme (each user group × typical tasks), not from how the plan looks. Metrics: path length vs ideal, detour ratio, shared-leg load, per-tile trip overlap (bottleneck heat), queue pressure at portals.
- Evidence: The configurational-movement hypothesis is validated exactly this way: agent/occupancy simulation over the graph is correlated against observed pedestrian counts, and the correlation "was strong enough to confirm" predicted vs observed movement patterns; further, "visibility integration has been found to predict informal interaction rates more reliably than proximity alone" (space-syntax literature, via CCD synopsis). Desire-line behaviour (PP-13) is the failure data this simulation predicts.
- Source: theccd.org space syntax & spatial cognition https://theccd.org/spotlight-research/space-syntax-and-spatial-cognition-or-why-the-axial-line/ — T3 (of T2 studies: Hillier & Penn; Penn, Desolier & Space Syntax Laboratory).
- Class: HEURISTIC
- Scope: circulation for all types; OD set is type-specific
- Confidence: Medium-high for relative comparison between options; lower for absolute pass/fail thresholds
- Grid translation: OD set from programme rows ("guest→lift→lobby→exit", "room service trolley→floor 6 corridor", "waste cart→service lift→bin store"). For each trip record octile length, tiles with clearance < 2, wait points (portal queue), tag-permission consistency. Thresholds: detour > 1.3× shortest legal path = desire-line risk (PP-13); any pinch tile carrying ≥ 3 scheduled trips/hour-unit = bottleneck warning. Emit a per-trip table plus heat list of worst 5 tiles.
- Exceptions / failure mode: Simulation over-crowds one shared stair in a plan that would be metered in reality (no temporal model on the grid) → mark queue verdicts `proxy`. Unknown: real flow rates — escalate to operations, VA-20.

### VA-16 Building-level checks use the multi-floor graph; vertical alignment is a first-class invariant
- Rule: Any check that crosses floors (egress continuity, staff round-trips, service delivery, portal stacking) must run on the joined graph where lift/stair portals are edges between floor grids. Per-floor checks are not evidence about the building; a plan where every floor passes individually can still strand floor 4.
- Evidence: This is the integration-test level of the V-model (integration testing verifies the assembled system against the architectural specification), and the exact gap that ACC pipelines complain about when single-trade models "cannot meet the review requirements" alone — cross-system checks need the joined model. Vertical portal queuing in this host is directly modelled (lift/stair portals with queues), so cross-floor verdicts are computable here, unlike structure.
- Source: Wikipedia V-model — T3; PMC10151318 — T2; host grid spec (portal semantics).
- Class: ENGINEERING CONSTRAINT (host-specific consequence of standard practice)
- Scope: multi-floor buildings
- Confidence: High
- Grid translation: Build graph: nodes = tiles + portal instances; portal edges connect same-id portals across floors at cost = queue estimate. Checks: (a) every floor reachable from entry for every tag set the programme demands; (b) egress from every tile reaches a discharge tile with ≤ 1 portal dependency where oracle demands independence; (c) portal columns: every portal at (x,y,f) has a partner at (x,y,f±1) — misstacking = critical. Output per-floor reach matrix + stack diff.
- Exceptions / failure mode: Stairs/lifts modelled as portals at slightly different tiles on adjacent floors (stair offsets are real): the stack check must allow the oracle's declared offset pattern, else it fires on every legitimately dog-legged stair — fixture the rule (VA-12) with an offset-good case.

### VA-17 Encode thresholds in metres and convert to tiles with an explicit rounding policy stated in the record
- Rule: Oracles are metric; the grid is 0.5 m. Every check states whether the conversion is round-up-only (clearances, widths, distances-to-maxima), round-down (areas-to-minima), or exact, and prints both metric and tile values with the conversion. Never validate a sub-tile margin, and never let the agent exploit the rounding the other way.
- Evidence: This is CODE-27's discipline moved into the validation layer, and it has a formal shape: the grid is an abstraction of metric space, and verdicts at the abstraction seam are precisely the "spurious counterexample" zone CEGAR is built around — boundary cases must be re-tested at finer resolution (there is none here, so round conservatively and say so). Plan check does the same in prose: cited numbers are clause minima, so 1.09 m does not pass 1.10 m.
- Source: this project's `building-codes.md` CODE-27 (deriving IBC/ADA minima, T1 mirrors); Wikipedia CEGAR — T3.
- Class: FACT (arithmetic of the host)
- Scope: universal on this grid
- Confidence: High
- Grid translation: `tiles_required = ceil(metres / 0.5)` for every minimum width/clearance; `≤` maxima (travel distance, shared path) also ceil to tiles but flag `nearest-legal = X tiles (0.5 m slack)`. Record prints: `required 1.1 m → 3 tiles (1.5 m) — actual 3 tiles: consistent`. Boundary policy fixture per threshold: test 2 tiles (1.0 m) must read `inconsistent`.
- Exceptions / failure mode: Double rounding (round up twice) inflates every room; state the policy once per check, never in two places. Octile path lengths are tile-step metrics — convert to metres for travel-distance checks (`× 0.5 m`, diagonals `× 0.70711` on diagonal steps) and say which norm you used.

### VA-18 Report measured-vs-required as a diff table; prose verdicts are secondary
- Rule: The primary artefact of a validation run is a table whose rows are oracle items and whose columns are `required | measured | delta | verdict`. Reviewers (human or agent) must be able to audit one line without reading any narrative. Narrative goes below as interpretation.
- Evidence: IDS output semantics are exactly a per-requirement match/occurrence report (applicability → required matches with cardinality bounds → "if any are found, the specification fails"); plan-check comments are per-clause lines ("update foundation details per LABC Section 1808") the designer answers one-for-one: "number your replies to match the correction numbers" — the reply loop only works when findings are tabular and addressable.
- Source: BIMcollab IDS how-to — T3; JDJ/LADBS guide — T4; buildingSMART IDS repo — T1.
- Class: STANDARD
- Scope: universal
- Confidence: High
- Grid translation: For programme: rows per room = required net m² vs actual (tiles×0.25). For adjacency: TH-03 matrix diff (grade required vs measured touches/steps per pair). For safety: each CODE-nn item as row with jurisdiction tag. For every row the verdict uses VA-03 vocabulary; fails get witness (VA-08) and lever (schema §).
- Exceptions / failure mode: Checks without an oracle row cannot appear in the table (else VA-01 violated); if a check surfaced something the oracle forgot, it becomes `oracle-gap` — a proposed new row, not a verdict.

### VA-19 Validation is a named loop with stop rules; unbounded polish is a defect of process
- Rule: A validation cycle = full suite run → triage (severity sort) → fix blast-radius → re-run. Stop conditions, in order: (1) all criticals pass AND majors pass → ship-ready-with-warnings; (2) no improvement (fail-count weighted by severity) across 2 consecutive cycles → freeze, escalate open items as `unresolved-by-agent`, do not loop; (3) iteration budget hit → same as (2). Ship state is never "clean" while unknowns exist — it is "pass with N unknowns registered".
- Evidence: AHJ review is a bounded correction loop: comment → reply → re-review, until cleared; the process is defined to terminate in issuance or escalation, not in endless rework. Defect-triage practice likewise gates release on severity classes, and CEGAR terminates either at verdict or at refinement resource exhaustion, reporting inconclusive honestly.
- Source: JDJ/LADBS guide — T4; Harmony defect classification — T4; Wikipedia CEGAR — T3; spec §36 failure prioritisation.
- Class: HEURISTIC
- Scope: universal
- Confidence: High
- Grid translation: Maintain `{cycle: n, fails: {c,m,M,minor}, delta}`. Terminate on conditions above; the residual-risk block (schema §) lists each open item with owner (VA-20) so "stopped" ≠ "resolved". Output final headline: `verdict: pass-with-warnings | pass-with-unknowns | fail-open-criticals (BLOCKED)`.
- Exceptions / failure mode: Oscillation (fix A breaks B breaks A) is detected by caused-by chains (VA-14) hitting the same pair twice — that is a design conflict, escalate it as a decision card, not as another cycle.

### VA-20 Route closure rights: who can clear which category — agent may close geometry/logic only
- Rule: Every check record names its closer: `agent` (pure geometry/graph/consistency on available data), `engineer` (structure/MEP/fire-protection judgement), `code-check` (jurisdictional reading of a cited clause, incl. any alternative-method argument), `AHJ` (approval acts: permits, variants, occupancy acceptance). The agent may close only agent-closable items; everything else ships as an open question with the exact evidence needed.
- Evidence: The permission workflow makes the asymmetry explicit: the reviewer's correction authority cannot be self-granted by the designer (LADBS loop); ISO 19650-2 separates "reviews of information" (checking) from "authorisation" (approval) as different roles; ACC research's honest output is the manual re-check channel for anything requiring interpretation ("warning, which indicates the need for manual re-checking").
- Source: JDJ/LADBS guide — T4; CCM ISO 19650-2 explainer — T4; PMC10151318 — T2.
- Class: STANDARD
- Scope: universal
- Confidence: High
- Grid translation: `closer:` is a suite-field (set at VA-11 authoring). Report rollup shows per-closer open counts: `agent: 2 · engineer: 5 · code-check: 3 · AHJ: 1`. The agent's Done claim may reference only its own closed set; anything routed elsewhere must appear in the final message, never dropped.
- Exceptions / failure mode: The temptation to "answer" an engineer-closable question with a plausible number ("the slab can span 7 m probably"). Rule: the agent may *compute proxies* (VA-10 list) and must label them `proxy, needs engineer` — plausible prose without a proxy record is a violation of this rule itself.

### VA-21 Validate against the type card, not the habit of the last building
- Rule: Before floor-level checks run, bind the plan to a building-type card that re-weights severities and swaps type-parameterised thresholds (occupant load factors, exit counts, guest-toilet ratios, service shares, quiet-zone definitions). A hospitality-tuned suite run on a clinic silently validates nothing.
- Evidence: Code checking is occupancy-parameterised throughout (the CODE file's own numbers: occupant loads, exit minima, accessible-guest-room ratios are per occupancy/type), and ACC literature flags exactly this encoding burden — rules do not travel between occupancies unchanged. Design review guidance is also explicitly project/finance/risk-scaled ("smaller projects adapt formats based on finance and risk") — the review instrument follows the project type, not the reviewer's routine.
- Source: CIBSE project review guidelines — T3; MN DLI (state review applies to *specific* building programmes) https://www.dli.mn.gov/business/get-licenses-and-permits/building-plan-review — T1; `building-codes.md` CODE-24 (I-2) / CODE-22 (hospitality) as in-repo consolidation of T1 mirrors.
- Class: BUILDING-TYPE CONVENTION
- Scope: every check with a type-parameterised threshold
- Confidence: High
- Grid translation: `type@card` object lists: occupant-factor overrides, severity re-weights (e.g. acoustics: hotel = moderate, school = major), required-check additions (ward sightlines: proxy only — grid cannot see over beds, emit unknown), forbidden defaults (assembly exits ≠ residential). Suite loads `type@card` before run; report header names it.
- Exceptions / failure mode: Mixed-type plans (hotel over restaurant) require *both* cards applied to their zones; the intersection of thresholds (stricter) governs shared elements (the stair, the lobby). Missing this is the classic tower failure.

### VA-22 Lifecycle checks are change-cost checks: repetition, removal, access, and edit distance
- Rule: Validate the plan as something that must be built, cleaned, replaced and remodelled: compute repetition rate (unique room types vs instances), non-standard geometry count, removal-path feasibility for every large fixture (walkable envelope along façade or corridor ≥ 2 tiles), and service access tiles left unblocked. Emit cost-direction verdicts, not perfection verdicts.
- Evidence: DfMA's quantified heuristic — part-count reduction as the master metric ("if none of the three apply, the part is a candidate for elimination", Boothroyd Dewhurst; typical "20–50% fewer parts") — is exactly a repetition/uniqueness metric computable on the grid. PP-24 (non-standard geometry paid in setting-out) and PP-19 (removal path) give the building-domain instances; the UCL performance-gap work (review "to ensure UCL's buildings perform as intended") is why in-use maintainability gets checked at design time, not after handover.
- Source: DFMA resources, https://www.dfma.com/resources/what-is-dfma.asp — T3; `professional-practice.md` PP-19/PP-24 (repo consolidation); CIBSE journal — T3.
- Class: DESIGN PRINCIPLE
- Scope: universal; weights type-dependent (hotels: high repetition expected; museums: low)
- Confidence: High for metrics, Medium for thresholds (calibrate per type)
- Grid translation: `uniqueness = 1 − repeated_room_count/rooms` (room identity = footprint + fixture-tag set); `odd_geometry_tiles` = tiles off the 2-tile (1 m) module for structural-grid proxies; removal path = BFS from door keeping 2-tile-wide corridor to service lift; maintenance access = 1 free walkable tile in front of every tagged service fixture. Thresholds from type card. Output: lifecycle block of the report with the four numbers + witnesses.
- Exceptions / failure mode: Optimising repetition to the point of monotony is an experience-category trade (lower priority per §36), not a lifecycle failure — record the tension in the multi-option sheet instead of "fixing" it.

### VA-23 Keep validation records reproducible: version, hash, inputs, timestamp — or the pass never happened
- Rule: Every check record binds verdict to artefact versions: plan version/hash, `requirements@vN`, `suite@vM`, `type@card`, metric value, threshold+source, verdict, severity, closer, timestamp. A verdict that cannot be re-derived from the stored inputs is void. This is what makes the difference between "we checked it" and "we can prove we checked it" to the reader.
- Evidence: CDE/ISO 19650 practice exists to make information states attributable (single source, reviewed and approved states); IDS files are versioned so that model↔spec pairs are auditable across the project; SAST findings without scan provenance cannot be suppressed or re-opened correctly (the entire suppression workflow depends on matching finding↔build↔rule).
- Source: CCM ISO 19650-2 explainer — T4; Solibri IDS article — T3; Mend.io triage docs — T3.
- Class: STANDARD
- Scope: universal
- Confidence: High
- Grid translation: Report file = JSON-lines of the schema below; store in project tree next to plan versions; diffing two reports of the same versions must yield identical bytes (deterministic ordering by check id). CI-style gate at Done: `verify.mjs` analogue refuses Done without a current-generation report for the plan hash.
- Exceptions / failure mode: Manual "just fix the report" edits after the fact — forbid by recompute-only generation; humans comment alongside records, never inside them.

---

## Validation hierarchy

Seven levels (spec §24). For each: the questions, what is computable on this grid today, what can
only be assumed/proxied, and what must be escalated.

**1. Human (body scale).** Q: can a body do the acts intended — pass, turn, reach, sit, wheel?
Computable: clear widths (tiles), door-runs, turning-circle proxies (3×3-tile free = 1.5 m turning
space), reach ranges as tag adjacency, fixture clearances. Assumptions: heights (headroom, grab-rail
mounting), grip, vision, strength, crowd pressure — no z-axis. Escalate: anything ADA/clause-specific
beyond plan geometry (`closer: code-check`), and every comfort judgement the grid can't see.

**2. Room.** Q: does this room support its activity at its capacity? Computable: net area, aspect
ratio, wall share (TH-02), fixture-tag profile vs programme, door count/width, min-dimension checks,
dead-end pockets within a room. Assumptions: ceiling height, light levels, acoustics, finishes,
equipment depths beyond tags. Escalate: room-specific compliance (I-2 sightlines, kitchen hygiene
separation) → engineer/code-check.

**3. Zone.** Q: are related spaces organised as working sets? Computable: adjacency-matrix diff
(grade-4 touches, grade-3 step budgets, grade-0 separation with buffer), clean/dirty crossing count
(PP-01 as graph edit), zone area balance. Assumptions: departmental politics, revenue logic.
Escalate: programme re-weighting when zone conflicts persist after 2 cycles (VA-19) → human.

**4. Floor.** Q: does circulation work today, on this plate? Computable: connectivity, shared egress
legs, travel distances, pinch/bottleneck heat from simulated trips (VA-15), corridor minima, portal
service, queue entry points. Assumptions: temporal flow shape (no clock in the sim → queue results
`proxy`), real occupancy pulse. Escalate: crowd/egress capacity modelling → engineer.

**5. Building.** Q: do floors, cores, and (absent) structure/services compose? Computable: multi-floor
graph reachability per tag, portal stacks (VA-16), stack alignment proxies (wet-cell columns, core
footprint continuity), section-free vertical load-path *plausibility* (aligned walls over walls).
Assumptions: structure, shafts, pressurisation — proxies only, verdicts always `needs engineer`.
Escalate: all of it eventually — building level is where the grid's silence hurts most and must be
loudest in the unknowns register.

**6. Site.** Q: does the building answer its context? Computable: entry points vs boundary tiles,
service approach geometry (loading tile reach), footprint coverage ratios, setbacks as tile margins —
only if a site grid is given. Assumptions: sun path, wind, noise, views, jurisdiction — none exist
on host. Escalate: orientation/daylight/thermal → environmental engineer + AHJ for planning rules.

**7. Lifecycle.** Q: can it be built, operated, maintained, changed, re-fit? Computable: repetition
rate, non-module geometry count, removal paths, maintenance access tiles, edit-distance between
options (change impact), fixture replaceability (VA-22). Assumptions: real construction sequence,
cost of specific systems. Escalate: buildability sign-off → contractor/PM; adaptability claims →
owner decision card, not a check verdict.

Rule of use: a check record names its level (VA-06); a Done claim requires green criticals at
levels 1-6 and a registered-unknowns block where 5-7 exceed the grid's vision.

---

## Validation matrix (11 categories)

Metric expressions use: `A(r)`=usable tiles ×0.25 m²; `d*(p,q)`=A* octile tiles; `W(t)`=local
clearance at tile; `G_f` = floor graph; `G_B` = multi-floor graph. Threshold provenance shorthand:
CODE-nn (jurisdiction-tagged per that file's record), TH-nn, PP-nn, TYPE=type card, GRID=host
arithmetic.

| Category | Check | Grid metric | Threshold source | Severity if fail | Closer |
|---|---|---|---|---|---|
| Functional | Required spaces exist | room-tag coverage vs oracle rows | CODE/TH/TYPE; GRID | major | agent |
| Functional | Relationships satisfied | adjacency diff (touches, d*) | TH-03 | major | agent |
| Functional | Zoning correct (public/semi/private/service) | zone label per room vs card | TYPE | major→critical | agent |
| Functional | Capacity per room | ceil(A(r)/area-per-person) | CODE (occupancy) | major | code-check |
| Circulation | Pedestrian flow | simulated-trip detour ratio, pinch heat | PP-13 | moderate | agent |
| Circulation | Service flow | dirty-route length & crossings vs guest graph | PP-01/04 | major | agent |
| Circulation | Emergency flow | egress paths under tag-ignoring rules | CODE-01..11 | critical | code-check |
| Circulation | Vertical circulation | portal capacity proxy, queue entry, stack | TYPE, GRID | major | agent (design) |
| Circulation | Bottlenecks | tiles with W=1 on ≥k trips | PP-11 | moderate | agent |
| Spatial | Proportions / human scale | aspect ratio, min dimension per use | TH/TYPE | minor–major | agent |
| Spatial | Usable area / dead space | A(r), wall_share, L<1.0 m pockets | TH-02; GRID | major / moderate | agent |
| Spatial | Furniture fit | fixture tag + clearance envelope (rect pack) | PP (aisle mins) | major | agent |
| Structural | Grid/span plausibility | room span = max(W×0.5 m) under span cap | TYPE/engineer | warn only | engineer |
| Structural | Column alignment | wall-stack alignment across floors | assumption | unknown (no col data) | engineer |
| Structural | Load-path plausibility | aligned-wall continuity flag (proxy) | proxy | unknown→escalate | engineer |
| MEP | Wet-cell stacking | tagged wet rooms share a service-band edge | PP-17 | major (cost) | engineer |
| MEP | Shafts | reserved tile block adjacent to services | proxy (no shaft objects) | unknown | engineer |
| MEP | Maintenance access | free tile before service fixtures; removal path | VA-22 | major | agent |
| Safety | Egress width / exits | door-run tiles; exit count per floor | CODE-02/04/10 | critical | code-check |
| Safety | Travel & shared path | d* to exit tiles; corridor shared leg | CODE-03/07 | critical | code-check |
| Safety | Fire separation | rated-boundary proxies via adjacency tags | CODE-14/15 | unknown | engineer |
| Safety | Accessibility route | tag-permitted continuous path, widths, door clearance | CODE-18/19, ADA | critical | code-check |
| Construction | Constructability | off-module tile count, wall jog count, span cap | PP-24, TYPE | moderate | engineer |
| Construction | Repetition / modularity | uniqueness ratio | VA-22/DFMA | minor-moderate | agent |
| Operations | Cleaning/waste/delivery | service trip feasibility per PP rules | PP-03/05/08 | major | agent |
| Operations | Staff circulation | staff OD set in G_B with tag permissions | PP-06 | major | agent |
| Environmental | Daylight / orientation | façade-adjacency of daylit-required rooms (no sun model) | TYPE | unknown (proxy warn) | engineer |
| Environmental | Ventilation / thermal / acoustic | adjacency buffers, no openings/heights data | PP-16 | unknown | engineer |
| Experience | Wayfinding | decision-point count on trips; dead-end tiles | PP-21 | minor–moderate | agent |
| Experience | Privacy / hierarchy / sequence | sightline proxies (open-door adjacency), buffer rooms | PP-15 | minor–moderate | agent |
| Lifecycle | Flexibility / adaptation | room re-tag edit distance; partition removable count | TYPE | minor–moderate | owner |
| Lifecycle | Maintenance / renovation | access+removal coverage; material unknowns | VA-22 | moderate | agent/engineer |

Standing unknown categories on this host (data absent, always reported): fire assembly continuity,
smoke control, sprinklers, heights/headroom, structural sizing, daylight factor, thermal/acoustic
performance, construction sequencing, real queue dynamics.

---

## Check ordering and stopping rules

**Cost order (cheap → expensive), all criticals-first within each tier (VA-05):**
Tier 0 tile-local: model integrity (VA-07), tile legality, areas, widths, door runs — O(n).
Tier 1 flood-fill: room extraction/typing, wall share, pocket/dead-space scan — O(n).
Tier 2 floor graph: connectivity, egress distances, shared legs, pinch sets — O(n log n) per OD pair.
Tier 3 multi-floor graph: portal stacks, cross-floor reachability, egress continuity — O(n·floors).
Tier 4 simulation: full OD-set trips, service day replay, lifecycle ratios — O(OD × path).
Tier 5 judgment packaging: type-card binding, cross-option comparison (not re-run per edit).

**Gate rules:** T0 failure halts everything (all else `unknown: model invalid`). T2 critical failure
halts T3-T5 for that floor (do not simulate a floor that strands a wing). Never run Tier k verdicts
as closure for Tier j < k items.

**Avoiding false confidence (four named sources):**
1. *Abstraction lies at boundaries* — every near-threshold pass prints `slack: X tiles` and, when
   slack ≤ 1 tile, `borderline` flag; the word "pass" is banned for borderline without a boundary
   fixture (VA-12) covering the seam.
2. *Coverage illusion* — headline always `pass/fail/unknown` triple (VA-03); a suite that passes 12
   and cannot see 41 must say so in the first line.
3. *Checker rot* — suite self-test result embedded in every run (VA-12); suppressed findings listed
   with reasons (VA-13).
4. *Language drift* — "consistent with" is the only vocabulary near code (VA-04); template lint
   forbids "compliant", "to code", "meets regulation".

**Distinguishing failed vs impossible — decision tree:** Did the check compute a value that
violates a stated oracle threshold? → `fail` (witness required). Could it not compute because
required datum class (heights/materials/loads/jurisdiction/temporal) is absent from host? →
`unknown: missing-datum` + closer route. Did it compute but threshold is un-encoded for this type?
→ `oracle-gap`. Did the suite not include the category? → `not-in-suite: capability` (a suite bug;
file suite proposal). Only the first can block Done; the second forces the residual-risk register;
the third forces an oracle amendment; the fourth forces a suite amendment.

**Stopping (VA-19):** green-criticals+majors → ship-with-warnings; no weighted improvement ×2
cycles → freeze + escalate; iteration budget → same. A `pass` state never claims completeness — it
claims the envelope declared in the capability manifest held.

---

## Validation report schema

Per-record (JSON-lines; deterministic order by check id):

```json
{
  "id": "VA-EG-02",                    // suite-defined (VA-11)
  "suite": "suite@v7",
  "requirements": "req@v12",
  "type_card": "hotel-service@v3",
  "plan_version": "f3:2026-09-24T14:02",
  "plan_hash": "a1b2c3",
  "level": "floor",                    // human|room|zone|floor|building|site|lifecycle
  "category": "safety",                // one of 11
  "input": {"floor": 3, "tiles_ref": "occupant tiles → exit door runs"},
  "computed": {"value": 27, "unit": "tiles", "metric_m": 13.5},
  "threshold": {"limit": 13, "direction": "<=", "policy": "ceil-m→tiles",
                 "oracle": "CODE-03", "source": "IBC 2021 via WA mirror",
                 "jurisdiction": "US-WA", "edition": "2021"},
  "verdict": "fail",                   // pass|fail|unknown|not-in-suite|oracle-gap
  "consistency": "inconsistent",       // for code-linked checks only (VA-04)
  "severity": "critical",              // critical|major|moderate|minor
  "witness": {"tiles": [[30,88],[31,95]], "path": "r30c88 → stair portal P2",
               "slack_tiles": null},
  "evidence_to_close": "shorten shared leg by adding door D7 as second exit path",
  "remediation_lever": "wall-move|door-add|portal-move|room-retag|zone-swap|module-shift",
  "closer": "code-check",              // agent|engineer|code-check|AHJ|owner
  "caused_by": "edit#142 (wall 30-33 moved)",
  "self_test": "ok",
  "timestamp": "2026-09-24T14:03:11Z"
}
```

Run rollup block (first lines of every report):

```
headline:      fails critical 1 · major 2 · moderate 5 · minor 3
unknowns:      41 (structural 9, MEP 8, environmental 12, safety-heights 6, ops-temporal 6)
accepted-risk: 2 (see reasons)      self-test: 24/24 ok
consistency:   "consistent/inconsistent with cited sources & jurisdictions; NOT approval"
verdict:       FAIL-OPEN-CRITICALS (blocked) | PASS-WITH-WARNINGS | PASS-WITH-UNKNOWNS
```

`unknown` records use `computed: null` + `"missing_datum": "ceiling height"` — that field is what
the escalation note names as "evidence needed to close". Done-claims cite the rollup, never
individual greens.

---

## Sources

Opened this session (verdicts above trace to these; sibling files carry the underlying code mirrors):
- buildingSMART — IDS repository ("computer interpretable XML based standard... to define IFC based Information Delivery Specifications") https://github.com/buildingSMART/IDS — **T1**.
- Solibri — *Everything you need to know about IDS* ("standardized machine-readable format for tools, such as Solibri, to automatically check"; requirements writable by "anyone") https://www.solibri.com/articles/everything-you-need-to-know-about-information-delivery-specifications — **T3**.
- BIMcollab help — *Creating an IDS* (structure: description/applicability/requirements; cardinality; "If any are found, the specification fails") https://helpcenter.bimcollab.com/en/articles/327351-creating-an-ids-information-delivery-specification — **T3**.
- PMC — systematic/review article, BIM knowledge-graph automated code compliance (barriers: "existing BIM modeling specifications of various professions cannot meet the review requirements"; output class "warning, which indicates the need for manual re-checking"; reported >96% accuracy single study) https://pmc.ncbi.nlm.nih.gov/articles/PMC10151318/ — **T2**.
- Wikipedia — *Counterexample-guided abstraction refinement* (three-valued verdicts, spurious counterexamples, refinement loop; original: Clarke, Grumberg, Jha, Lu, Vardi, JACM 50(5), 2003, https://dl.acm.org/doi/10.1145/876638.876643 — **T2** cited by name/DOI) — **T3**.
- Wikipedia — *V-model* (verification vs validation questions; test-level correspondence) https://en.wikipedia.org/wiki/V-model — **T3**.
- The Center for Children & Design — *Space Syntax And Spatial Cognition: Or Why the Axial Line?* (simulated movement density vs observed pedestrian counts "strong enough to confirm"; integration vs interaction quote) https://theccd.org/spotlight-research/space-syntax-and-spatial-cognition-or-why-the-axial-line/ — **T3** (synopsis of **T2** studies: Penn, Hillier, Desolier).
- CIBSE Journal — *Lessons learned: UCL & Buro Happold project review guidelines* (reviews to "reduce the 'performance gap'"; functional/technical/process criteria; RIBA 0-7; defect reduction at handover) https://www.cibsejournal.com/technical/lessons-learned-ucl-and-buro-happolds-award-winning-project-review-guidelines/ — **T3**.
- CCM — *ISO 19650-2 Explained* (checking "ensuring that information complies with the agreed specifications" vs "authorisation will confirm... can proceed") https://www.uniccm.com/iso-19650-2-explained — **T4** (explainer; ISO 19650 text paywalled, not retrieved).
- Minnesota Dept. of Labor & Industry — *Building plan review* ("We examine construction documents and supporting documentation for buildings funded by the state...") https://www.dli.mn.gov/business/get-licenses-and-permits/building-plan-review — **T1**.
- DC Dept. of Buildings — *Overview of Permitting Process* (multi-step, multi-agency approvals) https://dob.dc.gov/page/overview-permitting-process-0 — **T1** (thin content retrieved).
- JDJ Consulting — *How to read LADBS correction notices* (per-clause comments, e.g. "Update foundation details per LABC Section 1808"; numbered replies; "once corrections are cleared, the permit is issued") https://jdj-consulting.com/how-to-read-ladbs-correction-notices-a-homeowners-guide-to-plan-check-comments/ — **T4**.
- Snyk — *Static Application Security Testing (SAST) Scanning* ("The scan is performed before the code is executable"; "Legacy SAST tools could have a 50 to 80% false positive rate") https://snyk.io/articles/application-security/static-application-security-testing/ — **T3**.
- Mend.io — *Triage your Code Security Findings* ("high-confidence findings to reduce noise"; "If you disagree with the severity assigned... you can change it"; "When a false-positive/acceptable risk is reported, the workflow is to suppress it") https://docs.mend.io/platform/latest/triage-your-code-security-findings — **T3**.
- Harmony AI — *Defect Classification: Critical, Major, Minor* ("could cause an unsafe condition or violate a regulation, no matter how small it looks"; major = function loss; minor = cosmetic) https://www.tryharmony.ai/defect-classification-critical-major-minor — **T4**.
- DFMA Resources (Boothroyd Dewhurst) — *What is DFMA?* (part-count elimination heuristic; 20-50% fewer parts) https://www.dfma.com/resources/what-is-dfma.asp — **T3**.
- Enginero — *BIM Clash Detection: Hard, Soft & Workflow Clashes* (hard = "physically intersect"; soft = lacking "proper clearance"; workflow = operation/maintenance inconsistency) https://www.enginero.com/blogs/bim-clash-detection-hard-soft-workflow-clashes/ — **T4**.
- In-repo consolidation files used as routed threshold sources: `building-codes.md` (CODE-01..28; incl. WA-adopted IBC tables T1, ADA Ch.4 T1, up.codes mirrors T3, NCC T1, AD B/K/M T1/mirrors), `professional-practice.md` (PP-01..26), `architecture-theory.md` (TH-01..).

---

## Weak or contested

- **IDS format drift.** The official repo text retrieved describes an XML-based standard; some vendors/blog material around it mentions newer JSON tooling. The validation principle (declarative machine-readable requirement doc) is robust; the schema claim is not — cite version, don't cite format.
- **buildingSMART "Validation View" not retrievable.** Multiple searches and 403s (buildingsmart.org standards pages, MDPI, ScienceDirect, LADBS main site) blocked a primary text on the Validation View / reference MVD. Referenced in this file only via IDS + BIM Handbook lineage; treat the specific term as **UNCITED** this pass.
- **"Model validation" of the checker itself.** A directly relevant paper ("Model Validation for Automated Building Code Compliance Checking", NSF par record) was found but its PDF content could not be opened this session; the checker-testing rule (VA-12) is therefore supported by CEGAR/SAST/defect-triage analogy rather than by that ACC-specific text.
- **False-positive and accuracy numbers are vendor/study-flavoured.** "50–80% FP" (Snyk, vendor blog) and ">96% accuracy" (single PMC study, their own Revit/Neo4j pipeline) do not transfer to this host — use the *behaviour* (triage, suppression records, self-tests), not the numbers.
- **Space-syntax validation.** Confirmed correlations are for street/footprint networks and large buildings; transfer to a 0.5 m indoor tile grid is an assumption. VA-15 is therefore Medium confidence and relative-comparison oriented; axial-map drawing subjectivity is a known critique in that literature.
- **Defect-classification source is T4.** The critical/major/minor wording chosen is corroborated across several T4 QA blogs but no T1/T2 standard of grading was opened; the spec's own 4-tier ladder (§36) is what this file actually binds to.
- **ISO 19650 checked/approved split** is via a T4 explainer; the standard text is paywalled. The direction of the distinction (review ≠ authorisation) is uncontested, wording is paraphrase.
- **Queue/capacity verdicts at building level** have no temporal model — every T4-tier result is `proxy` by construction; a real dynamic simulation would change values, so they must never gate Done without the proxy flag visible.
- **A/E/I/O/U adjacency grading letters** (inherited from TH-03) remain Low confidence; the diff-table check (VA-18) does not depend on the letters, only on grades existing.

---

## Type-specificity audit

Universal (type-independent — geometry/logic/consistency, closer = agent): model integrity (VA-07),
room existence/coverage vs oracle, adjacency diff structure, portal-stack identity, multi-floor
graph reachability mechanics, rounding-policy enforcement, diff-table shape, report schema,
repetition/uniqueness *metric computation* (thresholds not), removal-path *geometry* existence.

Type-parameterised (same check, different oracle — bind via type card, VA-21): occupant load → exit
count/width, shared-path and travel limits, accessible-unit ratios, service-share of floor, quiet-zone
adjacencies, required room inventories, OD sets for simulation, capacity per room (area/person),
daylighting requirements, waste/linen catchments.

Type-created checks (only exist for some types): sightlines (care/education — proxy→unknown, no
heights), sound-suite separation (hospitality/education), loading bay geometry (retail/hospital),
atrium/void edge safety (assembly — no z-data → unknown), radiation/isolation logic (I-2 → engineer),
conversion flexibility premium (residential) vs fit-out churn (hotel).

Type-reweighted (severity flips): acoustics minor in workshop, major in school; dead-ends tolerated
in storage wing, critical in care homes; experience/hierarchy low weight in utilitarian types, high in
civic/retail; lifecycle-adaptability moderate for hotels, dominant for mixed-use bases.

Default §36 order (safety > structure > function > circulation > operations > environmental >
efficiency > experience > aesthetics) is applied as the suite's base weight vector; each type card
publishes its deltas, and every deviation is visible in the report header — the audit trail for
"why did this school validate like a hotel" must be answerable from the record alone.
