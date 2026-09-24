# Research file — Architectural decision making (Domain T)

Scope: the *procedure* for deciding when architectural requirements conflict, written for the
Continental-Idle tile grid. It covers how constraints, objectives, alternatives, trade-offs,
evaluations, decisions and validations must be produced and recorded; it does not restate the
physics, code or programme content that feeds those steps (that lives in the other research
files). No rule here claims one metric is universally superior; several rules forbid that move.

Host grid this file is written against: `1 tile = 0.5 m`; `4 tiles = 1 m²`; a wall is one blocked
tile; rooms are flood-fill derived and door cells belong to no room; tile states are ONLY
`walkable | blocked | door`; A\* octile with diagonals permitted only when both orthogonal
neighbours are open; vertical movement is `portal` objects with queues; access is by tags; there
are no heights, no sections, no structural objects. Consequence: every trade-off in this file is
expressed as a tile count an agent can measure — corridor tiles vs room tiles, core tiles vs
lettable tiles, span in tiles, façade tiles per room, service-band tiles, module repetition count.

---

## Rules

### DM-01 Decide against a criterion set, never against a single metric
- Rule: Before comparing schemes, fix a named list of criteria (at minimum: safety/egress, structural feasibility, basic function, circulation, operations, environmental performance, efficiency, experience, aesthetics) and score every alternative on all of them. A proposal justified by one number ("net-to-gross improved", "daylight tiles up") is rejected as incomplete, not as wrong.
- Evidence: UNCITED — heuristic. The deliverable spec's own instruction is that "the agent must not assume that one metric is universally superior"; the multicriteria literature is the general shape of the argument, cited at DM-09.
- Source: project spec `goal-task` §21 (Domain T) — T1 for this project's requirements.
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: Low (UNCITED — heuristic)
- Grid translation: Emit a per-criterion vector, not a scalar: `[egress_tiles_ok, function_ok, circ_cost_tiles, op_crossings, daylight_fraction, lettable_tiles, …]`. A candidate is only admissible if it has a value for every criterion or an explicit `n/a + reason`.
- Exceptions / failure mode: During a constraint-repair loop (DM-12) a single hard constraint legitimately drives the edit; that is constraint satisfaction, not the decision itself, and must not be reported as a scheme comparison. Symptom of violation: "we chose plan B because it had 4 % fewer corridor tiles" with no statement of what B costs elsewhere.

### DM-02 Satisfice: set aspiration levels before generating schemes
- Rule: For each criterion set a "good enough" threshold and a "would be nice" target before evaluating. Take the first alternative that clears every threshold and beats the incumbent on at least one criterion; do not search for an optimum that cannot be verified. Record the thresholds with the decision.
- Evidence: Herbert Simon's bounded rationality: satisficing replaces optimisation because "the time and information needed to make perfectly rational decisions are not available" — the decision maker searches alternatives only until one is found that is satisfactory against an acceptance level, rather than proving a best. Simon's own formulation of the doctrine: an alternative is chosen because it "exceeds (or falls short of) some predetermined aspiration level" (*Designing Organizations for an Information-Rich World*, 1971); the origin of the term is his "A Behavioral Model of Rational Choice" (1955) introducing "the concept of bounded rationality" and of "satisficing" behaviour.
- Source: Wikipedia, "Satisficing" (T3, article on the concept, citing Simon) https://en.wikipedia.org/wiki/Satisficing — supports DM-02. Primary: Simon 1955, *QJE* 69(1); Simon, *The Sciences of the Artificial*, 3rd ed., MIT Press 1996, https://monoskop.org/images/9/9c/Simon_Herbert_A_The_Sciences_of_the_Artificial_3rd_ed.pdf — full text retrieved but not machine-readable in this session, so only the concept is claimed, not a page-level quotation.
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: High
- Grid translation: Thresholds are tile counts or booleans, e.g. `lettable_tiles ≥ programme_tiles × 0.62`, `max_egress_travel_tiles ≤ limit`, `core_tiles/floor ≤ 0.14`. Store them in the decision record and re-check them at validation so the acceptance test is not invented after the scheme is seen.
- Exceptions / failure mode: Satisficing is not laziness — with only two generated alternatives it becomes a rubber stamp. Failure symptom: thresholds set post-hoc to fit the favoured plan (this is DM-14's falsifier violation).

### DM-03 Generate alternatives before evaluating any of them
- Rule: Produce at least three qualitatively different schemes for a contested layout decision, where "qualitatively different" means different in organizing idea (core position, circulation pattern, module, party-wall strategy), not jittered dimensions. Evaluation of a single scheme is forbidden except as a constraint check.
- Evidence: UNCITED — heuristic; the systematic-design-method literature separates analysis, generation (synthesis) and evaluation as distinct phases precisely because evaluating too early kills options — see DM-04.
- Source: UNCITED.
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: Low (UNCITED — heuristic)
- Grid translation: Each alternative must be a full floor assignment (tile-class map), and the difference between two alternatives must be expressible as a changed organizing parameter: core tiles location, corridor pattern (single-loaded / double-loaded / stack / open hall), module width in tiles, service band position. Report the deltas as tile counts.
- Exceptions / failure mode: Pure replication problems (hotel floor n+1 is identical to floor n) have one alternative by design; record it as `alternatives: N/A — repeating module DM-19` rather than manufacturing dummies. Failure symptom: three variants that are the same scheme with a wall moved two tiles.

### DM-04 Keep analysis, generation and evaluation as separate phases
- Rule: Follow a systematic method: (1) analyse the problem into criteria and constraints, (2) generate options, (3) evaluate options against the phase-1 criteria, (4) decide, (5) feed back. Do not let evaluation criteria change mid-evaluation, and do not design-while-evaluating.
- Evidence: Bruce Archer's *Systematic Method for Designers* (CIBA Foundation, 1964) is the classic statement of design as a phased, systematic activity — analysis, generation, evaluation, decision, feedback — and his later doctoral work formalised design process as an operational model of ordered phases; the secondary literature (Boyd Davis & Gristwood, "A dialogue between the real-world and the operational model — The realities of design in Bruce Archer's 1968 doctoral thesis", *Design Studies*, 2017; and the Design Research Society conference paper of the same project) documents the model and its idealised/real gap. Rittel's analysis of design as a sequence of operations and the later protocol studies use the same decomposition.
- Source: Bruce Archer, "Systematic Method for Designers", 1964; reprinted in G. A. Archer, *Systematic Design for Form and Variety*, Prestel, 2000 (no quotable passage retrieved — cited by edition). Secondary, located by search: *Design Studies* 2017 paper https://researchonline.rca.ac.uk/3116/ and DRS conference paper https://dl.designresearchsociety.org/cgi/viewcontent.cgi?article=1346&context=drs-conference-papers — T2, PDFs not machine-readable in this session, so the phased model is claimed as Archer's contribution, not quoted.
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: Medium-High (the phasing is a model, not an empirical law; real designers iterate — see DM-05)
- Grid translation: Three separate artefacts per decision: `constraints.yaml`, `alternatives/*.tiles`, `evaluation.md`. The evaluation sheet may not introduce a criterion absent from `constraints.yaml`; a new criterion forces a return to phase 1 and a re-run, logged as a feedback event.
- Exceptions / failure mode: Iterative back-and-forth is normal in practice (Goldschmidt's "linking beats"); the rule is about not silently shifting goalposts, not about literal waterfalls. Symptom of violation: scheme A wins on 5 criteria, then a sixth criterion appears that only B satisfies.

### DM-05 Classify the decision as tame or wicked before choosing a method
- Rule: Tame decisions (compute an answer; correctness is checkable) get an optimisation or a calculation. Wicked decisions (no stopping rule, no true-or-false, every solution is "just a good or bad solution", problems are only ever formulated jointly with solutions) get satisficing, stakeholder judgement and a recorded position — never a claim of having computed the right answer.
- Evidence: Rittel and Webber's ten properties of wicked problems, as summarised from *Dilemmas in a General Theory of Planning*: (1) no definite problem formulation — "The information needed to understand the problem depends upon one's idea for solving it"; (2) no stopping rules — there are no criteria telling when a solution has been found; (3) solutions are "not true-or-false, but good-and-bad" — judged "better or worse" against stakeholder interests and values; (4) no immediate or ultimate test — "Any solution … will generate waves of consequences over an extended — virtually an unbounded — period of time".
- Source: Swedish Morphological Society, "Wicked Problems" (structured summary of Rittel & Webber 1973, with quotations) https://www.swemorph.com/wp.html — T3; primary: Horst Rittel & Melvin Webber, "Dilemmas in a General Theory of Planning", *Policy Sciences* 4(2), 1973, PDF https://urbanpolicy.net/wp-content/uploads/2015/06/Rittel-Webber_1973_DilemmasInAGeneralTheoryOfPlanning.pdf (retrieved as a scan; quotations taken from the T3 summary, not transcribed from the PDF).
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: High
- Grid translation: Tame examples on this grid: egress travel check, wall-tax arithmetic, door-width tile count, lift-queue capacity. Wicked examples: "is this a good hotel floor?" — net-to-gross vs experience vs operations. Tag each decision `tame|wicked` in the record; a wicked decision's evaluation output is a ranking plus a rationale, never a single computed optimum.
- Exceptions / failure mode: The common error is dressing a wicked decision in one tame metric (efficiency), or refusing to compute the tame parts because the whole is wicked. Both appear in the Sources-of-error column of the decision record.

### DM-06 Separate hard constraints from weighted objectives, and never trade the first
- Rule: Write the constraint list first with a `hard | soft` flag. Hard = egress width and travel, minimum room dimensions, accessibility clear widths, structure-span limits, fire separation, programme minimum areas. Soft = everything else. An objective may be traded; a hard constraint may only be satisfied, relocated or escalated to a human.
- Evidence: The deliverable spec's priority ordering (§36) plus standard practice in code-compliant design where life-safety provisions are non-discretionary; multicriteria decision frameworks distinguish constraints from objectives (Saaty-style weighting applies to objectives only).
- Source: project spec `goal-task` §36 — T1 for this project. See DM-09 for MCDM citation.
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: High
- Grid translation: Constraints compile to boolean validators over the tile map (`egress_ok`, `min_room_tiles_ok`, `door_width_ok`, `span_tiles ≤ max`); objectives compile to real-valued tile metrics. A scheme that fails a boolean is infeasible and is excluded from ranking — it may not "win" on objectives.
- Exceptions / failure mode: Constraint conflicts (two hard constraints unsatisfiable at once) are not a trade-off — they are a defect. The correct output is "infeasible + which pair conflicts", escalated, never a compromise plan that breaks both a little. Symptom: a plan that is 1 tile short of egress width and 3 % over the core budget, justified as "balanced".

### DM-07 Every concession goes in the decision record — no silent trade-offs
- Rule: A decision may not be applied unless the record names what was given up, by how much in grid quantities, and who bears it. "Trade-off" without a magnitude and a bearer is not acceptable language.
- Evidence: UNCITED — heuristic. Mirrors the project's own harness convention (veto-able decisions logged) and the architecture-decision-record pattern (DM-18); it is also the operational form of the spec's instruction not to let one metric silently dominate.
- Source: UNCITED.
- Class: HEURISTIC (project convention for how the agent reports)
- Scope: universal
- Confidence: Low (UNCITED — heuristic; class demoted from CODE REQUIREMENT for the same reason)
- Grid translation: Mandatory fields `gave_up: {metric, before, after, delta_tiles, borne_by}`. Example: `gave_up: {metric: lettable_tiles, before: 412, after: 396, delta: -16, borne_by: revenue}`.
- Exceptions / failure mode: The recurring silent ones on this grid are: door tiles that vanish from area tallies, the wall tax of extra partitions, service-band tiles booked as "circulation", and queue growth at portals when a stair is removed.

### DM-08 Measure both sides of a trade-off in the same unit before comparing
- Rule: Convert competing goods into a common measurable denominator (tile count where possible, or a stated proxy) so the comparison is between numbers of the same kind. Where a good has no tile proxy, declare it unquantified rather than implying it was counted.
- Evidence: UNCITED — heuristic; value/metric normalisation is the standard move in cost-value analysis (DM-11) where costs and benefits are forced onto a function-weighted scale.
- Source: UNCITED.
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: Low (UNCITED — heuristic)
- Grid translation: Canonical denominators: `tiles` (area), `tile-steps` (travel cost, octile), `tiles/linear tile` (façade per room), `queue-wait ticks` (portal capacity), `count of crossings` (op routes through guest routes), `repetitions` (module economy). Any claim of the form "better" must name one of these or declare itself qualitative.
- Exceptions / failure mode: False precision — converting experience into tiles and treating the result as objective. Symptom: "amenity value = 12 tiles" driving a decision against 60 lettable tiles with no stakeholder weighting behind either number.

### DM-09 Weight criteria explicitly and sensitivity-test the ranking
- Rule: If a weighted sum is used, the weights are written down, sourced to a brief or a stakeholder, and the ranking is re-run with perturbed weights (and with each metric varied by one measurement step). A ranking that flips under plausible perturbation is reported as inconclusive and decided by a differentiator (reversibility, cost, or escalation), not by the original scores.
- Evidence: Analytic Hierarchy Process (Saaty, *The Analytic Hierarchy Process*, McGraw-Hill 1980) formalises pairwise-derived weights and a consistency ratio for multicriteria choice; construction-project MCDM applications are surveyed in the peer-reviewed literature, which also notes rank reversal and weight subjectivity as the method's main criticisms.
- Source: UNCITED — need URL for a peer-reviewed review of MCDM in construction (e.g. Eur. J. Operational Research or Autom. in Construction survey of multi-criteria decision making in construction management).
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: Medium-High for the AHP method named in Evidence (weights are subjective; the sensitivity test is what makes the method defensible); Low for the construction-MCDM survey authority (Source UNCITED — URL pending)
- Grid translation: `weights: {safety: hard, function: 0.25, circulation: 0.20, operations: 0.15, environment: 0.15, efficiency: 0.15, experience: 0.10}` — then `sensitivity: {flip_at: "efficiency weight +0.06"}`. Report rank order, not only the winner.
- Exceptions / failure mode: AHP's rank reversal (adding a dummy alternative can change the order of the others) is documented; with fewer than 3 criteria or more than ~9, prefer a simple lexicographic rule over a weighted sum. Symptom: a 0.5 % score gap presented as decisive.

### DM-10 Compare options on whole-life consequences, not first-tile cost
- Rule: Where an option saves area but costs operational time, or costs area but saves failures, both must be carried to the comparison. Add the recurring terms: queue growth, service crossings, maintenance access, reconfiguration cost when the module changes.
- Evidence: UNCITED — heuristic pending a citation for whole-life costing in construction (RICS *Life Cycle Costing* guidance / ASTM E917 standard guide for measuring whole-life costs) — see Sources.
- Source: UNCITED — need URL for RICS life cycle cost analysis guidance or ASTM E917.
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: Medium — was `STANDARD`; demoted: neither RICS life-cycle costing guidance nor ASTM E917 was opened (Source is a bare "need URL"), so the standard's name is a pointer, not support; comparing options on whole-life consequences is this file's decision principle
- Grid translation: Recurring costs on this grid are measurable: `portal queue ticks per hour`, `service route tile-length`, `back-of-house/guest crossing count`, `tiles unreachable for maintenance (blocked-adjacent)`. Report first-cost delta (tiles) and recurring delta (ticks/crossings) as two separate columns; never sum them into one number without a stated conversion.
- Exceptions / failure mode: Deep-plan floors are the canonical trap: lettable tiles rise, but travel tiles, egress risk and daylight deficit rise with them, and those are recurring.

### DM-11 Run value analysis on repeated or expensive elements before committing them
- Rule: For any element that repeats at scale (a guest module, a bathroom stack, a corridor type), ask the function/cost question before it is cast: what function does this tile serve, could the same function be delivered with fewer tiles, and what does removing it cost downstream. Apply the analysis to the module, not to one instance.
- Evidence: Value analysis / value engineering is an established, codified construction method — a function-based, organised effort to achieve necessary function at whole-life cost (SAVE International / Society of American Value Engineers code of conduct, 1961 ff.; US construction-industry practice via the Construction Industry Institute value management guidance).
- Source: UNCITED — need URL for SAVE International and/or CII value management.
- Class: STANDARD
- Scope: universal
- Confidence: Medium-High for the codified value-analysis practice named in Evidence; Low for the SAVE/CII authority (Source UNCITED — URL pending) — class kept: value analysis / value engineering is a named professional practice with a stable function-analysis procedure, and the admitted gap is the missing URL for that body, not the procedure the rule prescribes
- Grid translation: `module_repetition_count × delta_tiles` is the leverage number: a 2-tile saving per guest module × 40 repetitions = 80 tiles per floor; a 2-tile saving that removes a door swing clearance × 40 = 40 blocked tiles plus an egress risk. Evaluate at the repetition level always.
- Exceptions / failure mode: Value analysis on one-off or non-repeating elements (the lobby, the core) yields noise and can justify cutting the very features that carry the type's identity.

### DM-12 Gate decisions to stage boundaries and to what they foreclose
- Rule: Each decision carries the set of later options it closes. Decisions that close expensive options get made at a formal stage gate with review; decisions that close nothing may be made opportunistically. Never make a foreclosure-bearing decision as a side effect of a cosmetic edit.
- Evidence: UNCITED — need URL for RIBA Plan of Work 2020 stage descriptions (Stage 0 Strategic Definition, Stage 1 Preparation and Briefing, Stage 2 Concept Design, Stage 3 Spatial Coordination, Stage 4 Technical Design, Stage 5 Construction, Stage 6 Handover) and the notion of stage gates / option synchronisation.
- Source: RIBA Plan of Work 2020 — official overview PDF https://www.riba.org/media/syneeeto/2020ribaplanofworkoverviewpdf.pdf and the RIBA Plan of Work landing page https://www.riba.org/work/insights-and-resources/riba-plan-of-work/ (T3, professional body). URLs located by search in this session; the PDF was not machine-read here, so the stage names are given as the published scheme, not quoted.
- Class: STANDARD
- Scope: universal
- Confidence: Medium for the stage-gate mechanism (RIBA URLs located, PDF not machine-read); Low for the Evidence stage list (UNCITED — pending verification)
- Grid translation: Foreclosure classes on this grid: reversible = room typing, fixture tags, door placement within an existing wall line, finishes-like flags; semi-reversible = party-wall line, corridor line, service band position; irreversible-at-this-granularity = floorplate envelope, core position, structural grid span, module width. Log `forecloses: [...]`.
- Exceptions / failure mode: The standing project order (floors/content may be wiped at any time) makes most in-repo edits cheap, so the agent's intuition about reversibility is wrong by design here; the grid-level cost of a rebuild is cheap but the *informational* cost of an unlogged flip-flop is not.

### DM-13 Match deliberation cost to decision cost
- Rule: Budget analysis effort by the product of impact and irreversibility. A high-impact, irreversible decision (core position) earns enumeration, measurement and review; a low-impact reversible one (a 1-tile door nudge) is decided immediately, logged in one line, and moved on.
- Evidence: UNCITED — heuristic; the reversible/irreversible asymmetry is a general decision-hygiene argument, and is the project's own rule for in-repo choices (AGENTS.md: reversible in-repo choices are decided + logged, stop only for secrets/irreversible actions).
- Source: `AGENTS.md` rules digest — T1 for this project.
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: High for the project own reversibility rule (Source: AGENTS.md, T1 for this project); Low for the general deliberation-cost heuristic (UNCITED — heuristic)
- Grid translation: `impact = |delta_tiles| × repetition_count × stakeholder_weight`; `irreversibility = foreclosure class (DM-12)`. Product below a threshold: decide + one-line log. Above: full record with alternatives.
- Exceptions / failure mode: Analysis paralysis on a 2 % efficiency difference; the opposite failure is deciding a core position in the same casual register as a door nudge.

### DM-14 Name the falsifier before deciding
- Rule: Record what measurement or event would make this decision be reopened, and its threshold. No falsifier means the decision is a preference, not a judgement, and must be labelled as such.
- Evidence: UNCITED — heuristic; the pre-mortem / red-team convention (Gary Klein's "Performing a Project Premortem", Harvard Business Review 2007) is the procedural version — assume failure and generate reasons — see Sources.
- Source: UNCITED — need URL (HBR 2007 pre-mortem or a university summary).
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: Low (UNCITED — heuristic)
- Grid translation: `revisit_if: "queue ticks at north portal > 6/day-average" or "lettable tiles/floor < 0.58"`. These become automated validation checks in the next build so the falsifier is actually executed, not archived.
- Exceptions / failure mode: Post-decision rationalisation of a bad result (sunk-cost lock-in, DM-15) — the falsifier is the defence and only works if written first.

### DM-15 Reopen decisions only on changed inputs, and record the reopening
- Rule: A decided item is reopened when a constraint, a programme figure, or a measurement changes — not because a scheme looks unattractive after fatigue. The reopening is itself a decision record entry referencing the superseded one.
- Evidence: UNCITED — heuristic; the general form is "decision hygiene": revisit a decision only when the information it was based on changes (a standard formulation in applied decision-analysis texts; no quotable source retrieved).
- Source: UNCITED.
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: Medium
- Grid translation: Records carry `supersedes: DM-ID` / `superseded_by: DM-ID`, plus the changed input as a measurable: `inputs_changed: {programme_tiles: 512→548}`. A floor rebuilt from scratch after a decision flip-flop without a supersede chain is the failure signal.
- Exceptions / failure mode: In a pre-release, wipe-at-any-time project the legitimate reason to reopen is often "the user changed direction"; record it as `changed_input: brief` and do not pretend it was data.

### DM-16 Triage failures by severity before improving anything
- Rule: When multiple problems exist, classify each Critical / Major / Moderate / Minor and resolve Critical before touching aesthetics. Severity is judged by consequence (unreachable, unsafe, non-functional, unlettable), not by how visible it is.
- Evidence: The spec's failure-prioritisation section names the four classes and states "Critical issues should be resolved before aesthetic optimization", with the default order Safety > structural feasibility > basic functionality > circulation > operations > environmental performance > efficiency > experience > aesthetic refinement, explicitly "a default reasoning order, not an immutable rule".
- Source: project spec `goal-task` §36 — T1 for this project.
- Class: STANDARD
- Scope: universal
- Confidence: High
- Grid translation: Severity ladder by measurable: Critical = unreachable room (no A\* path from a portal), egress path broken, room with zero walkable tiles, door not on a walkable boundary; Major = circulation dead-end, capacity shortfall, service route crossing guest route; Moderate = daylight deficit, oversized core; Minor = awkward proportion, module break.
- Exceptions / failure mode: Visible-but-minor problems (a tile misalignment) attract attention and displace invisible-but-critical ones (a flood-fill that types a suite wrongly). Symptom: a report full of Minor fixes with a Critical still open.

### DM-17 Use the default priority order, and publish the reweighting
- Rule: Absent a brief saying otherwise, resolve conflicts with the default order (§36). Any deviation must be written as an explicit reweighting with its reason and its author, in the decision record, before it changes an outcome.
- Evidence: `goal-task` §36 gives the order and its non-absolute status: "Project-specific requirements may change priorities."
- Source: project spec `goal-task` §36 — T1 for this project.
- Class: STANDARD
- Scope: universal
- Confidence: High
- Grid translation: Conflicts are resolved by which levers move in which direction; the priority model section below gives the reweighting procedure and the never-trade list.
- Exceptions / failure mode: Retail-led or experience-led briefs legitimately push efficiency above operations or environment — but "the plan looked nicer" is not a brief.

### DM-18 Write a decision record per contested decision
- Rule: A short, immutable text record: title, context, status, the constraint set, alternatives considered, decision, measurable consequences (gained / given up), who bears them, falsifier, supersession links. Decisions not written down do not exist for the next agent or the next iteration.
- Evidence: The architecture-decision-record pattern — a minimal, deliberately immutable record of context / decision / status, kept because architecture management is largely a communications problem (Michael Nygard, *Documenting Architecture Decisions*, 2011). The pattern has since been adopted as a public-sector standard (UK Government Digital Service) and has community templates, which is the evidence that it is practice, not one blog's opinion.
- Source: T3/T4, URL: https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions(URL located by search this session; the post was not re-fetched, so the pattern is described, not quoted.) Adopted as a public-sector standard: UK GDS, The GDS Way, "Documenting architecture decisions" https://gds-way.digital.cabinet-office.gov.uk/standards/architecture-decisions.html — T1; community templates https://adr.github.io/
- Class: CODE REQUIREMENT (project convention)
- Scope: universal
- Confidence: High
- Grid translation: Schema in this file's `## Decision record schema`. Records are cheap and their absence is the single biggest cause of repeated re-litigation in the project's own history file.
- Exceptions / failure mode: Recording every trivial choice destroys the signal — see DM-13's threshold. Symptom: 200 records, none naming a trade-off.

### DM-19 Reduce decision count with modules and typologies
- Rule: Where a function repeats, decide it once as a module (fixed tile width, fixed fixture set, fixed door position) and thereafter only place instances. Each standardised module converts N decisions into 1, and makes the trade-off visible at the level where it matters.
- Evidence: UNCITED — heuristic; component/typology standardisation is long-standing in mass-housing and system-built practice (industrialised building systems literature), and repeats in hotel design practice; no single authoritative passage retrieved.
- Source: UNCITED.
- Class: BUILDING-TYPE CONVENTION
- Scope: repeatable types (hotel, cells, clinics, dorms, retail chains); weak in one-off civic space
- Confidence: Low (UNCITED — heuristic)
- Grid translation: `module: {width_tiles: 14, depth_tiles: 20, wall_tiles: 2, door_tiles: 2, lettable_tiles: 216}`; `repetitions: 40`; the trade-off line becomes `module_width ± 2 tiles → lettable ±80 tiles/floor, façade tiles/room ±4, bathroom stack unchanged`.
- Exceptions / failure mode: The module hides its own cost: a repetition that is 1 tile too wide is 40 tiles too wide, and a module that breaks at the floor edge produces the awkward terminal room that gets blamed on taste.

### DM-20 Guard against fixation on the first promising scheme
- Rule: Actively attempt to discard the current favourite at the generation stage: take the best scheme so far and ask for a fundamentally different one that satisfies the same constraints. Designer studies show the successful strategy is problem-focused and alternates between problem and solution, while unsuccessful work fixes early on a solution and then only elaborates it.
- Evidence: Bryan Lawson's empirical studies of designers vs scientists (*How Designers Think*, 1980; Architectural Research Group, Sheffield); reported contrast: experienced architects tended to adopt a "problem-focused strategy" (exploring constraints and context, generating schemes later), students/"unsuccessful" subjects a "solution-focused strategy" fixating on an early idea. Comparative protocol work by Gabriel & Austin and others discusses and partly complicates this contrast — mark as contested at Weak-or-contested.
- Source: UNCITED — need URL for a Lawson summary (edition/year: *How Designers Think*, Butterworth 1980; 3rd ed. Architectural Press 2004).
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: Medium (the empirical contrast is directionally supported but complicated by later protocol studies)
- Grid translation: Implement as a hard procedure: after any scheme wins, generate one adversarial alternative with the opposite organizing parameter (core moved, corridor pattern flipped, module rotated) and score it. If the adversary wins, the original was fixation; if it loses, the record now shows why.
- Exceptions / failure mode: Cost of doing this for trivial decisions (DM-13 threshold governs).

### DM-21 Bring evidence where evidence exists, and say so where it does not
- Rule: Before inventing a rationale for an environmental, experiential or operational claim, check whether measured research exists (post-occupancy studies, evidence-based design reviews); cite it. When nothing is retrievable, state "no evidence available at this granularity" in the record instead of dressing a guess as research.
- Evidence: "Evidence-based design" (EBD) as a named practice originates in healthcare-environment research — Roger Ulrich's work on the effects of interior design on wellness and the centre he founded, which defines the approach as design decisions informed by credible research rather than authority or taste. UNCITED beyond this: the specific founding paper was not retrieved in this session, so no finding is imported from it here.
- Source: UNCITED — pending (Ulrich 1991, *Yale J. Biol. Med.*; The Momentum Center). Cited by name and edition only; treated as unverified in `evidence_gaps`.
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: High for the disclose-or-label duty (cited at UN-01/UN-14); Low for the EBD provenance claim (UNCITED — Ulrich 1991 named but unverified)
- Grid translation: Claims needing external evidence: daylight benefit, wayfinding load, queue tolerance, acoustic separation, crowding density. On a 0.5 m tile grid, most external evidence is at metre scale — record the resolution mismatch as a limitation rather than assuming transfer.
- Exceptions / failure mode: The inverse error — importing a real finding from a real building type into a game grid where the operative variables (movement ticks, lettable tiles) do not exist. Mark transfer validity per claim.

### DM-22 Identify who wins and who loses in every conflict
- Rule: Layout conflicts are stakeholder conflicts. For each contested decision, name the bearers (guest/user, operator/staff, brand, maintenance, revenue, adjacent-room occupant, emergency egress) and state which gains and which pays. A decision whose benefit-bearer and cost-bearer are the same person is easier; most interesting ones are not.
- Evidence: UNCITED — heuristic; the stakeholder/undistributed-benefit framing is standard planning theory (a benefit to one party with a cost to another is the reason trade-offs need justification), no single quotable source retrieved.
- Source: UNCITED.
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: Low (UNCITED — heuristic)
- Grid translation: `bearers: {gained: [operations], paid: [revenue, adjacent_occupant]}`. Operationally on this grid: staff path length in tiles, guest travel in tile-steps, revenue in lettable tiles, maintenance in reachable blocked tiles, privacy in wall tiles between rooms.
- Exceptions / failure mode: "The user" as a catch-all bearer, which hides the conflict between the paying guest and the passing staff on the same corridor.

### DM-23 Decide with reversibility-tiered escalation, and stop only for genuine gaps
- Rule: In-repo, reversible choices are made and logged as veto-able; the agent stops and asks only for missing information that cannot be assumed, secrets/authorisations, or irreversible actions outside the repo. Missing-information stops are the last resort, not the default, and the assumption made in lieu of an answer is recorded as an assumption with its risk.
- Evidence: This is the project's own operating rule (`AGENTS.md` digest: "Decide, don't stall: reversible in-repo choices … are decided + logged as veto-able decisions. STOP + ask ONLY for: secrets/auth, irreversible actions outside the repo, missing information. Asking is the last resort").
- Source: `AGENTS.md` (project root) — T1 for this project.
- Class: CODE REQUIREMENT (of this skill's harness, not of a building code)
- Scope: universal in this project
- Confidence: High — class kept: the `assumed` token is the rule's own subject (information that cannot be assumed is the stop condition), and the code tier here is the harness rule this skill imposes on itself, not a building regulation
- Grid translation: Assumption fields: `assumed: {storey_height: none — grid is 2D, module width: 14 tiles}` and `ask_if: "programme capacity undefined"`.
- Exceptions / failure mode: Confidently deciding a genuinely missing brief item (target net-to-gross, which type the floor is) — that is the one stop case; log the question and the default used.

### DM-24 Declare tie-breakers before the tie occurs
- Rule: When two schemes are within measurement noise on all criteria, resolve with a declared order: (1) fewer hard-constraint compromises, (2) more reversible, (3) fewer distinct tile classes / simpler plan, (4) higher module repetition, (5) fewer unique elements. Never resolve a tie by preference in the moment; that is how fixation becomes policy.
- Evidence: UNCITED — heuristic; decision-analysis practice recommends pre-declared tie-breaking rules to keep choices reproducible; no authority retrieved.
- Source: UNCITED.
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: Medium
- Grid translation: `tie_breaks: ["hard-constraint count", "reversibility", "distinct tile-class count", "max(repetitions)"]`. Simplest-plan is measurable as fewer blocked-tile runs and fewer door tiles for the same function set.
- Exceptions / failure mode: Tie-breakers used to avoid a decision that needed escalation (e.g. an actual brief conflict between brand and revenue) — if the gap between criteria is the finding, report the finding.

---

## The reasoning chain

Constraints → Objectives → Alternatives → Trade-offs → Evaluation → Decision → Validation.
Each stage has a required output artefact, its format, and its characteristic failure. A stage
with no artefact has not been performed.

| Stage | Must produce | Format on this grid | Common error |
| --- | --- | --- | --- |
| **Constraints** | The non-optional boundary: code/egress minima, programme areas, site/floorplate envelope, portal capacity, module rule, adjacency mandates — each flagged `hard`/`soft`, and the feasibility verdict | `constraints.yaml`: `id, kind: hard|soft, measurable (tiles / tile-steps / count), limit, source` | Mixing preferences in with constraints (soft items written as hard to win an argument); assuming the constraint set is complete and discovering egress at validation; treating an infeasible pair of hard constraints as a trade-off to be split |
| **Objectives** | The criterion list with weights and aspiration levels, ordered by the priority model or a published reweighting | `objectives: {criterion, weight, threshold, target, bearer}` — bearer = who benefits | Writing objectives that are really the preferred answer ("maximise open-plan flexibility"); one criterion dominating silently; no threshold, so "better" is unfalsifiable |
| **Alternatives** | ≥3 qualitatively distinct organizing schemes, each a complete admissible plan (infeasible ones listed with the constraint they break) | per-alternative tile map + one-line organizing idea + the parameter that differs (core position / corridor pattern / module / service band) | Variants of one idea; only the favoured scheme developed to full resolution; an alternative generated *after* the evaluation to fill the column |
| **Trade-offs** | The paired consequence of every lever moved, in matched units, with gainers and losers | `lever → gains X tiles → costs Y tiles (bearer Z)` rows; both directions shown | Stating the benefit and hiding the cost; expressing benefit in tiles and cost in adjectives; forgetting the recurring terms (queue ticks, crossings) that DM-10 requires |
| **Evaluation** | Per-alternative criterion vector, feasibility verdict, ranking, and the sensitivity result | scores table + `rank: [B,A,C]` + `sensitivity: flips at …` + explicit n/a-with-reason | Scoring an infeasible plan; a 0.5 % gap reported as decisive; comparing plans measured by different functions; changing a criterion mid-evaluation |
| **Decision** | The chosen scheme, its rejected alternatives with reasons, the concession record, the falsifier, and the status | `decision.md` / record row (schema below): status, chose, rejected[why], gave_up[delta, bearer], revisit_if | A decision phrased as "we went with"; no rejection reasons (so the same alternatives are re-proposed next week); silent reweighting of the priority model |
| **Validation** | Re-measurement of the decided plan against the *stage-1* artefacts, and the answer to "did the falsifier fire?" | automated checks: `sum(lettable_tiles) ≥ threshold`, `egress path exists`, `all rooms reachable from a portal`, `room areas vs programme`, `door tiles adjacency legal`, plus `falsifier: fired|not-fired` | Validating the plan against the reasons invented in the decision stage; checking the metrics that were argued and not the ones that were traded away; declaring success because it rendered |

Chain-level failures: (a) skipping Alternatives, which collapses the chain into justification;
(b) iterating the chain but restarting it from Evaluation, so constraints silently mutate;
(c) running the chain once for the whole building instead of per contested decision.

---

## Conflict catalogue

Form: lever A vs lever B — grid quantities that move — who wins / who loses — the question that
actually decides it. The first five are the spec's examples (§21), worked in grid terms; the rest
are the ones this project hits in practice.

1. **More corridor vs usable area.** Corridor tiles ↑, lettable tiles ↓ 1:1; travel tile-steps ↓
   when width permits diagonals, door-access cost ↓. Wins: circulation, egress redundancy,
   perceived spaciousness. Loses: revenue, room size. *Deciding question: does the extra corridor
   buy access to rooms that otherwise could not be reached or exited, or does it buy comfort?* If
   access: constraint, not trade-off. If comfort: an experience spend priced in lettable tiles —
   needs a brief-level approval (DM-17).
2. **Larger core vs floor efficiency.** Core tiles ↑, lettable tiles ↓; portal count/queue ticks ↓,
   vertical travel ↓, service separation easier. Wins: users waiting, operations. Loses: revenue
   per floor, and every floor plan's edge condition. *Deciding question: peak demand ÷ portal
   capacity — is the core oversized for the queue, or is the queue accepted as the cheaper cost?*
3. **Longer structural span vs complexity.** On this grid span is a tile distance with no structural
   object, so the *only* representable consequences are flexibility (fewer blocked tiles inside the
   plate) and the loss of the party-wall and service-riser opportunities that columns would have
   carried. Wins: tenant flexibility, open plans. Loses: structural cost (external to the grid) and
   deep-plan daylight/egress reach. *Deciding question: what actually consumes the free span —
   leasable depth that can be served, or just area that cannot be lit or exited?*
4. **More glazing vs heat gain / façade cost.** Façade tiles per room ↑ (better daylight reach,
   better view, worse privacy and worse thermal behaviour), wall tax unchanged, envelope cost ↑.
   Wins: occupants of the daylit band. Loses: operator (energy), adjacent occupants, envelope
   budget. *Deciding question: how many tiles deep does the grid let daylight reach at all — and
   who pays for the rooms behind the daylit band?*
5. **Separate service circulation vs area/cost.** Second circulation network tiles ↑, guest-experience
   tiles protected, crossings ↓, door count ↑, wall tiles ↑. Wins: staff throughput, guest privacy,
   hygiene/dirty-clean separation. Loses: lettable tiles, cost, wayfinding simplicity. *Deciding
   question: count the actual guest/service crossings the shared route produces — is the conflict
   measurable or assumed?*
6. **Many small rooms vs few large (wall tax).** Partition tiles ↑ steeply per room as rooms shrink
   (a 6×5-tile footprint loses 60 % of its plate to the one-tile ring; a 12×10 loses ~33 %),
   lettable tiles ↓. Wins: unit count, privacy, leasable granularity. Loses: gross efficiency.
   *Deciding question: does the type price the wall (per-room rent) or the floor (per-m²)?*
7. **Shared party wall vs acoustic/fire separation.** Shared tiles halve partition cost; a shared
   wall cannot carry two different wall states (one blocked tile, one material) on this grid.
   Wins: efficiency, space. Loses: adjacent occupants, compliance expressiveness. *Deciding
   question: does the grid need a partition-type attribute to make this trade representable —
   if not, the trade is being decided by silence.*
8. **Deep plan vs shallow plan.** Deep: lettable tiles/floor ↑, daylight tiles/floor ↓, egress travel
   ↑, internal-circulation reliance ↑. Shallow: the reverse, at the cost of more façade length and
   more envelope. *Deciding question: which limit binds first here — egress reach, daylight reach,
   or the envelope budget?*
9. **One lift bank vs distributed small banks.** Queue ticks concentrate or spread; core tiles
   roughly constant, travel in plan changes. Wins: whichever pattern matches the demand mix.
   Loses: the other. *Deciding question: is the demand peak simultaneous (check-out) or spread —
   and can a single bank absorb the peak?*
10. **Door count: many doors vs few.** Many doors: access quality ↑, wayfinding ambiguity ↑, wall
    integrity ↓, each door is 2+ non-room tiles owned by no room (flood-fill excludes doors), so
    area accounting distorts. *Deciding question: are the doors needed for circulation choice or
    for privacy — and is the room tally counting door tiles correctly?*
11. **Open hall vs single-file corridor movement.** A 1-tile corridor forces `dx+dz`; an open hall
    allows diagonals at up to ~1.41× cheaper tile-steps corner-to-corner. Open hall: travel cost ↓,
    wayfinding ↓, privacy/noise zones lost, room edges lose wall. *Deciding question: is NPC
    congestion the actual problem, or is it path length?*
12. **Service band vs distributed risers.** Band tiles are a dedicated cost per floor and shorten
    runs; distributed services save band tiles and put plant inside rooms (reducing lettable tiles
    and blocking adjacency). *Deciding question: is there a service object in the model at all —
    if not, the band trades real area for an unmodelled benefit, and must be labelled as such.*
13. **Module repetition vs site-responsive variation.** Repetition: decisions ↓ (DM-19), cost ↓,
    monotony risk, terminal-condition waste at plate edges. Variation: experience ↑, decision count
    ↑, no economy of repetition. *Deciding question: how many repetitions before the variation's
    benefit exceeds the module's saving?*
14. **Back-of-house through the guest route vs around it.** Around: extra tiles, extra façade
    openings. Through: zero extra area, permanent crossing conflict. *Deciding question: how many
    staff trips per guest-hour — and which bearer absorbs the disruption?*
15. **Egress redundancy vs leasable depth.** More exits: wall doors ↑, room tiles ↓, safety ↑.
    *Deciding question: not a trade-off — reach/time limits bind; everything else follows.*
16. **Amenity/outlet area vs lettable area.** Amenity tiles are income-adjacent but not lettable.
    *Deciding question: does the amenity's revenue model depend on the guest being there (F&B) or
    on the guest perceiving it (lobby grandeur)?*
17. **Floorplate size vs core travel reach.** Larger plate: more lettable tiles, worse travel times
    and worse reach-to-exit for the plate's interior. *Deciding question: which reach limit binds
    the plate — so plate size is derived, not chosen.*

---

## Priority model

Default order (from `goal-task` §36, verbatim): Safety > structural feasibility > basic
functionality > circulation > operations > environmental performance > efficiency > experience >
aesthetic refinement.

Why a default and not a law: the order is a *conflict-resolution heuristic for an unspecified
brief*. It encodes "no one is harmed before anyone is pleased", which is defensible whenever
consequences fall on people; it is wrong where the brief makes a lower-ranked criterion the
project's purpose, and where an apparently lower criterion is a precondition for a higher one
(e.g. efficiency funding the safety works). A ranking that cannot be overturned by a brief is a
calculation mistake waiting to be defended.

How a brief reweights it, procedurally:
1. State the type, the client's explicit aim, and the failure they fear most.
2. Move at most two criteria above their default position, and name the demoted criteria (a
   reweighting that demotes nothing is a preference claim, not a reweighting).
3. Record `priority_override: {moved: experience > efficiency, demoted: efficiency, because:
   "brand is the revenue driver", authorised_by: brief|user, valid_for: this project}`.
4. Never move the never-trade set (below) — those exits are constraints, not objectives.
5. Re-run the ranking of any already-evaluated alternatives under the new weights and report the
   rank changes (DM-09's sensitivity step applies to the weight change too).

Never-trade set (these are constraints, and a decision that "trades" one is infeasible, not
balanced): life-safety egress (path exists, reach/time within limit, width within limit);
structural feasibility (span achievable, load paths expressible); accessibility minima; the
occupancy limit a room can be certified for; data integrity (a room that no path reaches is not a
"compromise", it is a defect). On this grid, note that "structural feasibility" and "acoustic
separation" have no representing tile state — so the model's second rank is *unimplementable
here*: the honest output is "the grid cannot express this constraint; the decision is deferred",
not a silent pass.

Failure-severity mapping (from §36's four classes): Critical = a never-trade violation or an
unreachable/nonfunctional space; Major = circulation or operations failure that degrades the type
(e.g. every service trip crosses the lobby); Moderate = environmental or efficiency shortfall
(deep plan with no daylight); Minor = experiential or aesthetic. Resolve in that order (§ DM-16).

---

## Decision record schema

One record per contested decision, appended, immutable after acceptance; corrections are new
records with `supersedes`.

```yaml
id: DM-<scope>-<nn>              # e.g. DM-FLOOR7-03
title: <imperative, names the lever>            # "Keep single-loaded north corridor on floor 7"
date: <iso>
author: agent | user | brief
status: proposed | accepted | vetoed | superseded-by:DM-…
type_of_problem: tame | wicked   # DM-05
priority_basis: default | override(…)          # DM-17
constraints:                     # stage 1 artefact, hard first  # DM-06
  - {id: c1, kind: hard, measurable: max_egress_travel_tiles, limit: 60, source: …}
  - {id: c2, kind: soft, measurable: lettable_ratio, target: 0.62, bearer: revenue}
objectives:                      # weight + aspiration      # DM-02, DM-09
  - {criterion: circulation, weight: 0.20, threshold: …}
alternatives:                    # ≥3 unless repeating module # DM-03
  - {a: "double-loaded", organizing: "central corridor", feasible: yes}
  - {b: "single-loaded north", organizing: "edge corridor + open hall", feasible: yes}
  - {c: "stack / open-plan floor", organizing: "no corridor, diagonal movement", feasible: no, broke: c1}
trade_offs:                      # paired, matched units, bearers  # DM-07, DM-22
  - {lever: corridor_tiles, gains: {metric: travel_tile_steps, delta: -180, bearer: guest},
     pays: {metric: lettable_tiles, delta: -46, bearer: revenue}, recurring: {metric: op_crossings, delta: +12/h, bearer: guest}}
evaluation:
  feasible: [a, b]
  scores: {a: 0.71, b: 0.74}
  sensitivity: "b wins until efficiency weight > 0.24, then a"
  rank: [b, a]
decision: b
reason: "<one paragraph; names what made the difference>"
gave_up: {lettable_tiles: -46, op_crossings: +12/h}
forecloses: ["north-edge glazing beyond 8 tiles", "future double-loading"]   # DM-12
revisit_if: ["queue ticks at north portal > 6 daily average", "lettable_ratio < 0.58"]  # DM-14
validation:
  measured: {lettable_tiles: 366, egress_ok: true, unreachable_rooms: 0, door_tiles: 58}
  thresholds_met: true
  falsifier_fired: no
assumptions:                     # DM-23
  - {text: "no section/height modelled; daylight reach approximated by facade-band tiles", risk: medium}
evidence_gaps:                   # DM-21
  - "no measured transfer of real-hotel corridor-width findings to a 0.5 m tick grid"
```

Reporting rule: a decision presented without its `gave_up` block is incomplete and must be
refused by the reviewer, whatever its merit.

---

## Sources

Format: name — what it establishes — tier. Retrieval status is stated per entry: entries marked
*located by search, not read* were surfaced by this session's searches (so the URL and title are
real) but their text was not machine-readable, so no sentence is quoted from them; entries marked
*no URL* are edition/year citations and are used only for the concept they carry. Nothing in this
file quotes a passage that was not retrieved; the rules whose evidence is `UNCITED — heuristic`
(DM-01, DM-07, DM-08, DM-15, DM-22, DM-24, and the standardisation claim in DM-19) are project
conventions, presented as such and not as findings about architecture.

- Herbert A. Simon, *Designing Organizations for an Information-Rich World* (1971) and *The Sciences of the Artificial*, 3rd ed., MIT Press, 1996 — bounded rationality and satisficing against aspiration levels; the case against optimising behaviour in information-rich problems. T3.
- Horst Rittel & Melvin Webber, "Dilemmas in a General Theory of Planning", *Policy Sciences* 4(2), 1973 — the ten properties of wicked problems; why some design decisions admit no computed optimum. T2/T3.
- Bruce Archibald (Geoffrey) Archer, *Systematic Method for Designers*, 1964 (reprinted in *Systematic Design for Form and Variety*, Prestel, 2000) — design as phased analysis/synthesis/evaluation activity. T3.
- Bryan Lawson, *How Designers Think*, Butterworth, 1980 (3rd ed., Architectural Press, 2004) — empirical comparison of designer strategies; problem- vs solution-focused behaviour and early fixation. T2/T3; contested in part (see Weak or contested).
- Thomas L. Saaty, *The Analytic Hierarchy Process*, McGraw-Hill, 1980 — weighted multicriteria comparison, pairwise weights, consistency ratio; also the target of the rank-reversal criticism. T3.
- Value engineering / value analysis: SAVE International code of conduct and function-analysis method (origin US, 1961 ff.); US federal VA/FNMA value engineering guidance — organised, function-based effort to achieve necessary function at whole-life cost. T1/T3.
- RIBA Plan of Work 2020 — staged gates from Strategic Definition to Handover; the mechanism for making and closing design choices at stage boundaries. T3 (professional body). https://www.riba.org/work/insights-and-resources/riba-plan-of-work/ and overview PDF https://www.riba.org/media/syneeeto/2020ribaplanofworkoverviewpdf.pdf — located by search, not read.
- Patrick MacLeamy / HOK, the "MacLeamy curve" (ARCHITECT, 2004, "Curve: The Next Curve in Design-Build Services") — claim that resource leverage and change cost move in opposite directions over a project's timeline. T3; contested (see Weak or contested).
- Roger Ulrich, "Effects of interior design on wellness: theory and new international research", *Yale Journal of Biology and Medicine*, 1991, and The Momentum Center for Evidence-Based Design — evidence-based design as the explicit alternative to authority-based rationale. T2/T3.
- Michael Nygard, "Documenting Architecture Decisions", Cognitect blog, 15 Nov 2011 — the ADR pattern: context/decision/status, immutable records, why options were rejected. T3/T4. https://www.cognitect.com/blog/2011-11-15/documenting-architecture-decisions ; standardised in UK GDS guidance https://gds-way.digital.cabinet-office.gov.uk/standards/architecture-decisions.html (T1) and adr.github.io — located by search, GDS page not read.
- Rittel & Webber (1973) as summarised with quotations by the Swedish Morphological Society, "Wicked Problems" https://www.swemorph.com/wp.html — T3; **read in this session**, supplied the four quoted properties used at DM-05. Wikipedia, "Satisficing" https://en.wikipedia.org/wiki/satisficing — T3; **read in this session**, supplied Simon's satisficing/bounded-rationality framing and the Simon 1955 *QJE* 69(1) pointer used at DM-02.
- Gary Klein, "Performing a Project Premortem", *Harvard Business Review*, September 2007 — assumption of failure and generation of reasons before committing. T3.
- RICS guidance on life cycle cost analysis; ASTM E917 standard practice for measuring whole-life costs — whole-life rather than initial-cost comparison. T1/T3.
- Measurement standards for net-to-gross language (BOMA methods of measuring floor area; RICS code of measuring practice) — efficiency is defined by the measurement rule chosen, so an efficiency argument is only as good as its definition. T1/T3.
- Project spec `goal-task` §21 (Domain T) and §36 (failure prioritisation) — T1 for this project's requirements and the default priority order.
- `AGENTS.md` (project root) — decide-don't-stall, veto-able decision logging, verification cadence. T1 for this project.

## Weak or contested

- **Lawson's problem-focused/solution-focused contrast** is widely repeated but rests on small student-vs-architect samples; later protocol work (Goldschmidt; Gabriel & Austin) shows both strategies in both groups and problematises the clean split. Use DM-20 as a procedure (generate an adversary scheme), not as a claim about how good designers think.
- **The MacLeamy curve** is extremely influential and, on inspection, lacks published underlying data; the shape is plausible and the mechanism (cheap change early, expensive late) is a general project-management truth, but no numeric use should be made of it, and on this host the "cost of change" side is near-flat because floors can be wiped (project standing order).
- **AHP / weighted-sum scoring** in construction has a substantial critique: weights are elicited, not measured; rank reversal is documented; consistency ratios do not guarantee validity. Retained only with DM-09's sensitivity test and honest reporting of rank changes.
- **Net-to-gross ratios as a quality proxy** — the ratio depends entirely on which measurement standard is adopted (BOMA vs RICS definitions differ), so it cannot be the primary criterion; treat it as a budget line, not a verdict.
- **Evidence-based design transfer to a tile grid** — most measured daylight, acoustic, crowding and wayfinding findings are at metric/occupant scale with real physics; the grid has no section, no heights, one tile per wall, and tick-based movement. Any rule whose justification rests on such a finding must be labelled "transfer unverified".
- **Priority ordering itself** — the §36 order ranks "structural feasibility" second, which this host cannot represent at all; ranking an unimplementable constraint is not the same as satisfying it. Flagged in the Priority model.
- **Whether more alternatives is always better** — generation has cost, and for highly constrained or replicated problems three options may be manufactured rather than found; DM-03's N/A escape is deliberately provided and should be used rather than padded.
- **Premortem/falsifier discipline** — originating literature is applied-decision psychology with mixed effect sizes; adopted here because the *record* is auditable even where the psychology is not.
- **Single-source risk in this file**: several rules (DM-01, DM-07, DM-08, DM-15, DM-22, DM-24) are marked `UNCITED — heuristic` where no retrievable source was found; they remain project conventions rather than claims about architecture.

## Type-specificity audit

Universal (any type, any grid):
- DM-01 to DM-10, DM-12 to DM-18, DM-20 to DM-24 — the procedure, the record, the triage and the
  priority model do not depend on building type. DM-05's tame/wicked split and DM-06's hard/soft
  split are the load-bearing distinctions for every type.
Type-conditioned (mechanism exists, magnitudes differ):
- DM-11 (value analysis at repetition scale) — the leverage number is repetition count, so it is
  strong in hotel/cell/dorm/clinic/chain-retail and weak in civic and one-off cultural work.
- DM-19 (module standardisation) — near-free in hotels and prisons, actively wrong in museums,
  flagship retail and custom housing, where the type's value is variation.
- Conflict #6 (wall tax vs unit granularity) — decisive where revenue is per unit (hotel, prison
  cell, student housing, hospital side-room), weak where revenue is per m² (open-plan office,
  retail floor plates).
- Conflict #2/#9 (core size vs queue) — strong in stacked types with peak synchrony (hotel
  check-out, hospital shift change, stadium egress); negligible in low-rise or horizontally
  circulated types where the portal does not exist.
- Conflict #4/#8 (glazing, deep plan) — dominated by depth-to-width limits in offices and hotels;
  inverted in retail (interior merchandising depth is the product) and in hospitals where
  daylit-patient-room policy can outrank efficiency.
Type-specific decisions this file deliberately does NOT settle:
- Whether experience may outrank efficiency (retail flagship, luxury hotel, museum: often yes;
  social housing, prison, general hospital ward: rarely defensible).
- Whether operations or guest experience owns the corridor (hotel back-of-house vs office
  collision-space culture).
- Whether service bandwidth is real (data-centre, hospital, lab: yes, and the grid cannot express
  it; office/hotel: only partially).
Host limitation, type-independent: the grid's single tile-state vocabulary (`walkable | blocked |
door`) makes several ranked criteria (structure, acoustics, fire rating, services) unrepresentable.
A decision between them cannot be measured here, so the correct output is the escalation "not
representable on this host", not a tie-break by aesthetics.
