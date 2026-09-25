# Research file — Domain AA: Evaluation, benchmarks, and scoring of generated designs (and of the skill itself)

Scope: the comparative and reproducible measurement layer. `validation.md` answers "does this plan satisfy the written oracle?" — per-design verdicts (VA-03), witnesses (VA-08), a versioned declarative suite (VA-11), fixture-tested checkers (VA-12), reproducible records (VA-23). This file answers the question no other file in the corpus asks: **how do you show, with numbers another developer can re-derive, that design X beats design Y, and that the skill produced a better design after a change than before it?** Nothing here restates a VA-* rule; VA-01/03/08/10/11/12/18/20/23 are the substrate measured on top of. Boundary with `uncertainty.md`: UN-03/UN-04 govern *how a number is written* (band, stage, digits); here: which numbers exist and what they may be used to claim. Boundary with `decision-making.md` / `design-alternatives.md`: DM-01/DM-08/DM-09 and DA-03/DA-07 are decision conduct; they are re-derived below as measurement protocol with worked arithmetic. Boundary with `floor-plans.md`: FP-18 names the four metric families, FP-22 the circulation-quality measures, FP-24 the validator taxonomy — this file supplies their formal definitions, the dataset registers behind them, the KPI catalogue, human/LLM evaluation protocols, and skill-level ablation.

Host grid unchanged: `1 tile = 0.5 m`; `4 tiles = 1 m²`; tile states ONLY `walkable | blocked | door`; rooms are 4-connected flood-fills, door cells belong to no room; A* octile; portals with queues; no heights, materials, or time.

Tiers per UN-12: **T1** standards body / dataset owner / code text, **T2** primary paper, **T3** reputable technical documentation, **T4** secondary explanation. Numbers with no opened source are `HEURISTIC`; important claims that could not be confirmed are flagged `NEEDS VERIFICATION` with what to check.

---

## Rules

### EV-01 Separate the three measurement questions; never answer one with another's instrument
- Rule: Three claims exist, each with its own instrument. (1) **Conformance** — plan vs written oracle, the VA layer, output verdicts. (2) **Comparison** — plan vs plan under one fixed metric list, output a metric vector plus a Pareto front. (3) **Skill efficacy** — skill@vN vs skill@vN-1 on fixed prompts, output a per-check pass-rate delta with variance. "Validity 0.94" answers (1) and licenses nothing about (2) or (3).
- Evidence: HELM decouples scenarios from metrics so each can be scrutinised independently — the benchmark's own architecture keeps "what is measured" separate from "against what", which is the same separation demanded here between the three claim classes. VA-02 (verification ≠ validation) is the in-repo precedent. The split is definitional: a conformance figure is computed for one plan against a written oracle and carries no information about a second plan or about a skill version. Instrument-to-output mapping: conformance → verdicts; comparison → metric vector plus Pareto front, which requires ≥2 options through one harness (DA-03); skill-efficacy → per-check pass-rate delta with variance, which requires EV-28's matched runs. Source type: ML evaluation methodology; repo rule substrate.
- Source: HELM — *Holistic Evaluation of Language Models*, https://arxiv.org/abs/2211.09110 — T2 (page opened this pass); VA-02 (verification ≠ validation) in-repo.
- Class: DESIGN PRINCIPLE
- Scope: every numeric claim in every design or skill report
- Confidence: High (the split is definitional)
- Grid translation: tag every numeric claim `claim-class: conformance|comparison|skill-efficacy` in the report header; an untagged numeric line is not emitted, and a `comparison` tag is rejected without ≥2 options through one harness (DA-03), a `skill-efficacy` tag without EV-28's matched runs.
- Exceptions / failure mode: a single-plan run only supports (1); quoting (2) without a second plan is fabrication, quoting (3) without a matched pair is noise. Three instruments cost reporting volume; the shortcut to resist is letting the conformance score stand in for the comparison. Failure symptom: a "validity 0.94" quoted as proof that design A beats design B, or a before/after pair presented as skill improvement on unmatched prompts.

### EV-02 Report the vector, never the scalar alone
- Rule: the headline of any evaluation is the full metric vector with its unknowns count; a composite may appear only beneath it, with its weights and sensitivity result beside it. A scalar without a vector is a suppressed trade-off, not a summary.
- Evidence: HELM states the multi-metric contract directly — "We measure 7 metrics (accuracy, calibration, robustness, fairness, bias, toxicity, and efficiency)" — and gives the reason: multi-metric reporting "ensures metrics beyond accuracy don't fall to the wayside", so that compromises "are clearly exposed". The reporting shape that follows from such a contract: table rows are metrics, columns are options, no blank cells (`unrepresentable` / `n-a (reason)` per DA-07), plus an `unknowns` row, and the composite column last and labelled `composite (weights @w-vector, see sensitivity)`. DM-01 (comparison in a common unit) and DA-07 (never drop a metric) are the in-repo versions of the same prohibition. Source type: ML evaluation methodology; repo conduct rules.
- Source: HELM, https://arxiv.org/abs/2211.09110 — T2 (page opened this pass; quotes from it); DM-01, DA-07 in-repo.
- Class: STANDARD + DESIGN PRINCIPLE
- Scope: universal, all types
- Confidence: High
- Grid translation: the headline block is the vector table — rows = metrics, columns = options, `unknowns` row present, every cell filled; the composite is the final column, printed only beneath the vector and labelled with its weight vector and its sensitivity result (EV-23).
- Exceptions / failure mode: vectors are harder to read and the reader asks for a winner — answer with the objective → option map (DA-08), not a scalar. Verbosity vs auditability; this file chooses auditability. Failure symptom: a headline score that rises while a component metric falls and the fallen metric is missing from the table.

### EV-03 Freeze the metric list, the harness, and the inputs before any option exists
- Rule: metrics, weights, normalisation rules, seeds and input hashes are committed before generation; adding or removing a metric later is a harness version change with both results kept, not an edit.
- Evidence: preference elicitation is required "*prior* to the optimization" — *A tutorial on multiobjective optimization* fixes the scalarisation before the objective values are known, which is exactly the ordering imposed here on metrics and weights. In-repo the same freeze already exists as DA-03 (constant inputs), DA-07 (never drop a metric) and VA-11 (versioned declarative suite). The frozen artefact is machine-readable, not prose: `harness@vN` carrying metric ids, formulas, units, direction, normalisation, weights and the gate list, plus `inputs@hash` over programme, adjacency matrix, site and type card, emitted before the first plan; every score line stores both ids (VA-23). Source type: optimisation methodology; repo rules.
- Source: *A tutorial on multiobjective optimization*, https://pmc.ncbi.nlm.nih.gov/articles/PMC6105305/ — T2 (page opened this pass); DA-03, DA-07, VA-11 in-repo.
- Class: DESIGN PRINCIPLE
- Scope: any comparison or skill-efficacy claim
- Confidence: High
- Grid translation: emit `harness@vN` (metric ids, formulas, units, direction, normalisation, weights, gate list) plus `inputs@hash` before the first plan; every score line carries both ids; a later metric change is a new `harness@vN+1` with both results retained.
- Exceptions / failure mode: a frozen list can be the wrong list; corrections arrive as `harness@vN+1` with a stated reason. Rigidity vs comparability — comparability wins, because a drawn design cannot be un-drawn. Failure symptom: a comparison whose winner changes because a metric was noticed after the vectors were seen.

### EV-04 Use the published geometry metrics with exact definitions — and only against a reference
- Rule: mask agreement between a generated and a reference room is IoU, per label then mean (mIoU); boundary agreement is a tolerance-matched F1. Both are reference-dependent: with no reference they return `n-a (no ground truth)`, never a guess.
- Evidence: ResPlan defines its geometric validation "using geometric overlap measured by 'boundary IoU' or pixel-level agreement via 'mean IoU for each room class'" — the two published definitions adopted here verbatim. Graph2Plan is "trained on RPLAN, a large-scale dataset consisting of 80K annotated floorplans"; its reported average room-box IoU ≈ 0.65 is an evaluation score for one model on one split, already demoted from gate status by FP-18 / audit 04 A6b. Definitions as computed on this grid, in tiles:
  - `IoU(r,label) = |M(r) ∩ M_ref(r)| / |M(r) ∪ M_ref(r)|`
  - `mIoU = mean over labels present in both`
  - `boundary_F1 = 2TP/(2TP+FP+FN)` on boundary tiles, with ±1 tile (±0.5 m) tolerance
  Source type: primary dataset and generation papers.
- Source: ResPlan, https://arxiv.org/html/2508.14006v1 — T2 (page opened this pass); Graph2Plan, https://arxiv.org/abs/2004.13204 — T2 (page opened this pass).
- Class: FACT + HEURISTIC
- Scope: plans with a reference (as-built import, dataset sample, previous version of the same floor) and version-to-version regression
- Confidence: High on definitions; Medium on any acceptance threshold
- Grid translation: compute the three keys above from the room masks and boundary tiles; emit the per-label rows and only then the mean — report per-label, never the mean alone; state the ±1 tile (±0.5 m) tolerance inside the boundary line; with no reference the cell reads `n-a (no ground truth)`.
- Exceptions / failure mode: resolution-dependent — at 0.5 m/tile a one-tile shift is 0.5 m of real wall (FP-17); IoU values across datasets are not comparable; high mIoU coexists with an unusable plan. Cheap and standard, but rewards average-area correctness and hides topological failure (a swapped door leaves IoU ≈ 1.0 — EV-05 catches it). Failure symptom: mIoU 0.8 on a plan whose bathroom opens into a neighbour.

### EV-05 Measure adjacency and connectivity as graph distance, and define "valid" as a conjunction of predicates
- Rule: geometric plausibility is not topological validity. Publish both: an edit distance against the intent graph, and a validity conjunction whose terms are individually reported.
- Evidence: DStruct2Design publishes its topology instrument as "Compatibility: Evaluated using 'graph edit distance (GED) between the input bubble diagram and one extracted from the output floor plan'", and ResPlan uses "graph edit distance comparing the connectivity" — GED against an intent graph is therefore the community's measure, and it is a single scalar. Validity by contrast is a conjunction of separately checkable predicates; the repo already supplies the GED formula (FP-18), the failure taxonomy (FP-24), and the principle that relationship predicates are not one score (AG-02). The conjunction adopted here, term by term:
  - `valid ≡ V_integrity ∧ V_overlap ∧ V_enclosure ∧ V_reach ∧ V_programme ∧ V_tags`
  - `V_integrity` = VA-07 gate; `V_overlap` = zero room-region intersection; `V_enclosure` = every walkable tile in exactly one room or a door run (EV-07); `V_reach` = finite A* from entry to one target tile per room (FP-04); `V_programme` = tag coverage vs oracle; `V_tags` = access-tag permission consistency
  Source type: benchmark paper; repo rules.
- Source: DStruct2Design, https://arxiv.org/html/2407.15723v1 — T2 (page opened this pass); ResPlan, https://arxiv.org/html/2508.14006v1 — T2 (page opened this pass); FP-18 (GED formula), FP-24 (failure taxonomy), AG-02 in-repo.
- Class: FACT + DESIGN PRINCIPLE
- Scope: universal here — rooms and doors are derivable (FP-16)
- Confidence: High
- Grid translation: report the six bits individually plus `GED(intent, derived)`; the GED number ships only beside the per-predicate diff (VA-18), which is its mandatory companion.
- Exceptions / failure mode: GED is sensitive to graph-extraction noise (twin rooms, AG-20); two cost conventions circulate (edge-only vs edge+node) — name the one used. GED is one number that hides *which* relation broke. Failure symptom: GED improves while a must-touch pair breaks and no report line records it.

### EV-06 Adopt the benchmark's self-consistency set verbatim
- Rule: reference-free and taste-free, a generated plan must be internally consistent: stated totals equal computed sums, regions do not overlap, per-room stated area equals derived area, room count equals count. The community already standardised these; copy the definitions rather than inventing local ones.
- Evidence: DStruct2Design states the set verbatim, and it is the closest thing the corpus has to a standard self-consistency battery — Total Area: "percentage difference between stated total area vs. the sum of all rooms' state area"; Overlap: "boolean check for existence of polygon overlap"; Polygon Area: "percentage difference between a room's stated area vs. area calculated from polygon"; Room Count: "boolean check to see if room_count field number is equal to the number of rooms"; prompt consistency: "percentage difference between the sum of room polygon areas vs. requested total area". The paper's own numbers are results for one model, not targets (FS baseline 0.94±0.07 polygon area, 1.00±0.03 total area, 0.16±0.37 overlap; GED 0.15±0.41). Tolerance adopted for the battery as a project choice: `SC-* ≤ 2 %`, `Overlap = false`. Source type: benchmark paper.
- Source: DStruct2Design, https://arxiv.org/html/2407.15723v1 — T2 (page opened this pass; definitions quoted verbatim from it).
- Class: STANDARD
- Scope: every generated or edited plan
- Confidence: High on definitions; the paper's scores (FS baseline 0.94±0.07 polygon area, 1.00±0.03 total area, 0.16±0.37 overlap; GED 0.15±0.41) are model-flavoured results, not targets
- Grid translation: run `SC-TotArea`, `SC-Overlap`, `SC-PolyArea`, `SC-RoomCount`, `PC-TotArea`, `PC-RoomArea`; publish percentages with the accepted tolerance beside each line (e.g. `SC-* ≤ 2 %`, `Overlap = false`).
- Exceptions / failure mode: on this grid areas are derived, so stated-vs-computed collapses into VA-07's tile-class reconciliation; the live terms become overlap and reachability. High pass-rates here coexist with unusable plans (FP-22) — hygiene, not quality. Failure symptom: six green self-consistency lines above a plan whose guest floor cannot be reached.

### EV-07 Add enclosure and watertightness as first-class measured checks
- Rule: a plan is a partition of the plane; test that formally — every walkable tile assigned, wall runs joined, room genus counted, and (for exported vector/3D artefacts) watertight and planar geometry.
- Evidence: ResPlan's validation standards include mesh checks "watertightness, planarity", so the formal-geometry tests are already published practice for generated plans rather than a local invention; VA-07 requires the tile-class reconciliation to close, and FP-17 governs the vector export the mesh tests apply to. Checks as computed here:
  - `enclosure_gaps` = walkable tiles in no room and not a door cell — must be 0
  - `wall_run_joins` = % of runs whose endpoints meet another run
  - `room_holes` = genus-1 count vs type card
  - `watertight_export` = bool, else `n-a`
  Source type: dataset/method paper; repo rule.
- Source: ResPlan, https://arxiv.org/html/2508.14006v1 — T2 (page opened this pass); VA-07 (tile-class reconciliation must close), FP-17 (vector export) in-repo.
- Class: FACT + DESIGN PRINCIPLE
- Scope: universal; watertightness only for an exported artefact
- Confidence: High
- Grid translation: emit `enclosure_gaps`, `wall_run_joins`, `room_holes`, `watertight_export` each run; exclude door runs explicitly from the closure test and count them instead; `watertight_export` is `n-a` unless an artefact was exported.
- Exceptions / failure mode: door cells belong to no room by construction, so a naive closure test fires at every doorway — exclude door runs explicitly and count them instead. Strict enclosure rejects legitimate voids and atriums, which have no z-representation here (UN-05). Failure symptom: a non-zero `enclosure_gaps` reported as a design defect when it is only the doorway set.

### EV-08 Structural regularity and asymmetry: publish the measurement, route the threshold
- Rule: regularity is measurable in plan (orthogonality, wall stacking across floors, module repetition, asymmetry about the core axis); the acceptance thresholds belong to seismic codes the grid cannot evaluate, so report geometry and never a verdict.
- Evidence: seismic codes do define plan irregularity formally (EC8 §4.2.3 / ASCE 7-16 §9.5: torsional irregularity from story-drift ratios, re-entrant recesses, diaphragm discontinuity, out-of-plane offset), but every page carrying the numeric factors returned 403/404 this pass, so no factor is quotable here. Negative result to record: the phrase "real-relative-asymmetry" matched **no** metric definition in the sources searched or opened for this file (Graph2Plan, DStruct2Design, ResPlan, FloorPlanCAD, CubiCasa5K, and every keyword pass run here) — treat it as not-a-standard-term; the established nearest constructs are plan asymmetry / torsional irregularity plus the off-module measures in `construction.md`. Geometric proxies that are computable on this grid:
  - `orthogonality = 1 − non_orthogonal_wall_tiles/total_wall_tiles`
  - `off_module_share` = tiles off the 1 m module (PP-24)
  - `wall_stack_alignment = aligned_boundary_tiles/shared_boundary_tiles` across floors (VA-16)
  - `asymmetry_index = |A_left − A_right|/(A_left + A_right)` about the core axis
  Source type: code concept (unverified) plus a documented negative search.
- Source: EC8 §4.2.3 and ASCE 7-16 §9.5 / §9.5.2.3 — named from the code families, **not read this pass**: every page carrying the numeric factors returned 403/404, so no URL for either is carried by this file; the searched-and-not-found list (Graph2Plan, DStruct2Design, ResPlan, FloorPlanCAD, CubiCasa5K) is cited at EV-04/EV-05/EV-06/EV-30 and §Sources.
- Class: HEURISTIC
- Scope: ≥2-floor plates; any jurisdictional claim routes `closer: engineer` (VA-20)
- Confidence: Low on thresholds; Medium on the existence of formal irregularity classes — **NEEDS VERIFICATION**: open EC8 §4.2.3 or ASCE 7-16 §9.5.2.3 and record the drift factor (commonly quoted 1.2× the average end drift) and the recess percentage before either number is used
- Grid translation: emit the four geometric keys above plus `irregularity_flags` (geometric only); the verdict field is always `needs engineer`, never pass/fail.
- Exceptions / failure mode: no heights, masses or drifts here — drift-based irregularity is `unrepresentable` (UN-05); only geometric proxies exist. Regularity is trivially gameable (a box is maximal-regular and often a worse building), and over-regular plates are rejected on experience grounds by HB-07. Failure symptom: an `irregularity: pass` line derived from a proxy the code never measures.

### EV-09 Roll physical-functional checks up into a validity score, and state the denominator
- Rule: physical validity is a pass-rate over a declared, capability-filtered check set — never an average that silently includes checks the host cannot run. The denominator is the report's most load-bearing number, and hard gates stay gates.
- Evidence: VA-10's capability manifest (`computable|proxy|none`) is what makes the denominator honest, VA-03 supplies counted unknowns, VA-09 fixes gates by consequence. ACC practice reports the binding constraint as data sufficiency, not design failure (`validation.md` via PMC10151318 — T2, in-repo). The score's definition:
  - `validity_score = passes/(passes+fails)` over `capability: computable` only
  Source type: repo rules over ACC/BIM literature.
- Source: in-repo VA-10, VA-03, VA-09; ACC/BIM literature reached through `validation.md`'s PMC10151318 citation — T2, cited in-repo, page not opened from this file.
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: High on method
- Grid translation: print the score with its denominator as `0.87 (26/30; 41 unknown of 71-suite)`; criticals print as `gate: pass|fail` and never fold into the ratio; thresholds come from the type card and CODE-nn, never invented at report time.
- Exceptions / failure mode: pass-rates over different denominators are not comparable; a plan with fewer checked aspects can out-score a better one — hence the score is always printed with `n_checked/n_suite`. Adding checks breaks cross-version comparability; EV-28's per-check deltas are the answer. Failure symptom: two options scored 0.91 and 0.87 where the first ran 12 checks and the second 41.

### EV-10 Publish a KPI catalogue with formula, unit, band, and band source
- Rule: every design report carries a fixed KPI block; each KPI has a formula, a unit, a normal band, the band's source, and a verdict against that band. A measurement without a band is not an indicator.
- Evidence: real-estate normalisation gives the shape and one opened band — load factor is "dividing the total rentable area by the total usable area" and "generally yields a multiplier of about 1.10 to 1.15" — quoted at T4 from a BOMA-derived write-up, so the band is a secondary statement, not the standard's text. In-repo the block's shape is already fixed: SP-18 (net-to-gross at three levels, name the level), RP-06 (publish a circulation-and-core budget per floor, measure the result), EC-02/EC-03 (face convention, wall tax). Every KPI row therefore carries formula / unit / direction / band / band source, catalogued in §"KPI catalogue with normal ranges". Source type: industry measurement standard via secondary quote; repo rules.
- Source: *BOMA standard* area definitions and load factor as reproduced at https://realestatelawyernh.com/boma_standard.htm — T4 (page opened this pass; BOMA's own text and edition not opened); SP-18, RP-06, EC-02/EC-03 in-repo.
- Class: STANDARD + HEURISTIC
- Scope: all non-residential types; residential bands differ
- Confidence: High on formula shape; Medium on the 1.10–1.15 band (T4); Low on circulation/core/service bands (`HEURISTIC`) — **NEEDS VERIFICATION**: BOMA's own text and edition were not opened
- Grid translation: emit every key of the KPI catalogue each run, `n-a (reason)` when uncomputable, never an omission; each row prints its band and the band's source label.
- Exceptions / failure mode: every area ratio is convention-dependent (BOMA vs ANSI vs RICS count common area differently) — the convention name is part of the KPI (SP-06). KPIs game easily; deep plans raise lettable share while degrading daylight, egress slack and staff walk (DM-10's named trap). Failure symptom: a bare "efficiency 74 %" with no formula, no convention and no band to fail against.

### EV-11 Compute area ratios on one face convention, one measurement convention, one derived source of truth
- Rule: net-to-gross, efficient-area, core and service ratios must come from the same derived tile tables in the same face convention, or they cannot be compared across options or against any benchmark.
- Evidence: EC-02 ("say which face of the wall you measured to") and EC-03 (correct the tile-grid wall tax before comparing to real-world benchmarks) fix the two conventions, SP-06 and SP-18 the naming of levels; the usable/rentable split behind the load-factor analogue is quoted at EV-10 — T4. The ratios, all from one derived table:
  - `NET = Σ room interior tiles`; `GROSS = plate tiles`
  - `net_to_gross = NET/GROSS`
  - `efficient_area_ratio = lettable NET/GROSS` (circulation and core excluded from lettable)
  - `core_ratio = core/GROSS`; `service_ratio = BOH/GROSS`
  - `wall_tax = blocked/GROSS`
  - `load_factor_equivalent = GROSS/NET`
  Source type: repo rules; industry practice.
- Source: EC-02, EC-03, SP-06, SP-18 in-repo; the usable/rentable split is carried by the T4 quotation recorded at EV-10.
- Class: FACT + STANDARD
- Scope: universal
- Confidence: High
- Grid translation: derive every key above from the same tile tables in the same face convention in one pass; print `wall_tax` on every area KPI; show `load_factor_equivalent` beside BOMA's 1.10–1.15 with a "inflated by wall thickness" note.
- Exceptions / failure mode: a wall here is a whole 0.5 m tile, so gross is systematically inflated against a 100 mm real partition; the bias must be printed, not hidden. Exact-internal (comparable inside the project, biased against literature) vs corrected (comparable outside, drifts inside) — use exact-internal plus a stated correction for external quotes. Failure symptom: two options compared on ratios taken from different wall faces.

### EV-12 Circulation, core, and service shares are measured after the fact, never pre-allotted
- Rule: these ratios are outputs. A design that reserved "20 % corridor" up front and then reports 20 % has measured nothing.
- Evidence: SP-13 states the method — "Let circulation be solved by the movement model, then measured — not pre-allotted" — with SP-18 and RP-06 (publish a circulation-and-core budget per floor, then measure the result) supplying the budget-versus-measurement pair. The numeric bands are `HEURISTIC` working placeholders pending calibration on this project's own generated population: on a hospitality plate circulation ≈ 0.12–0.25, core ≈ 0.06–0.14; a state-adopted allowance in the located-but-unopened space standard would upgrade them. Source type: repo rules; located-but-unopened primary standard.
- Source: SP-13, SP-18, RP-06 in-repo; iHFG Part C space standards — located by search, **page not opened**, so it supports no number here (URL carried in Confidence with the verification item).
- Class: DESIGN PRINCIPLE + HEURISTIC
- Scope: universal; the acceptable band is type-specific (VA-21)
- Confidence: High on method; Low on numbers — **NEEDS VERIFICATION**: iHFG Part C space standards located at http://healthfacilityguidelines.com/ViewPDF/ViewIndexPDF/iHFG_part_c_space_standards_dimensions (search result, page not opened); a state-adopted circulation allowance there would upgrade these bands
- Grid translation: print `circulation_ratio`, `core_ratio`, `service_ratio` each as `measured | target | delta | band_source: HEURISTIC-calibrated@vN`; the working placeholders are usable only until calibrated.
- Exceptions / failure mode: one wall move shifts the share by about a percentage point on a typical plate (UN-03) — integers of tiles, one decimal of percent. A low circulation share is simultaneously the top efficiency KPI and the leading indicator of the desire-line failure PP-13 predicts — never report it without the detour ratio. Failure symptom: a reserved allowance re-presented as a measurement.

### EV-13 Adjacency satisfaction is a weighted per-predicate rate with the residual published
- Rule: report how many required relationships are met at the required grade, split by predicate class, plus the cost of the misses; an unweighted "85 % adjacency" hides that the 15 % are the must-touch pairs.
- Evidence: AG-02 fixes four predicate types rather than one score, AG-06 six grades with integer weights, AG-09 weighted path cost rather than straight-line, AG-08 the bubble-to-grid residual — the weighting scheme is already in the repo. The benchmark analogue is DStruct2Design's prompt consistency, which "evaluate[s] how consistent the generation is to the constraints used in the prompt", i.e. constraint satisfaction is scored as a rate. Measures:
  - `adj_hard = met(grade ≥ required must-touch)/required`
  - `adj_soft = Σachieved weight/Σrequired weight`
  - `adj_violation_cost = Σ(w_pair × excess_steps)`
  Source type: repo rules; benchmark paper.
- Source: DStruct2Design, https://arxiv.org/html/2407.15723v1 — T2 (page opened this pass); AG-02, AG-06, AG-08, AG-09 in-repo.
- Class: FACT + DESIGN PRINCIPLE
- Scope: types with a relationship matrix; industrial/open-plan types legitimately return `n-a` — say so rather than reporting 100 %
- Confidence: High
- Grid translation: emit `adj_hard`, `adj_soft`, `adj_violation_cost` split by predicate class, plus the top-3 worst unmet pairs as witnesses (VA-08).
- Exceptions / failure mode: soft preferences outnumber and dilute hard requirements; always split them. Four lines instead of one; the one line is the one that gets quoted. Failure symptom: an "adjacency 85 %" in which the misses are exactly the must-touch pairs.

### EV-14 Daylight coverage: use the published daylight definitions and mark the tile proxy as a proxy
- Rule: the measured quantities of record are spatial daylight autonomy (sDA) and area daylight exposure (ASE); neither is computable on this grid (no glazing, no heights, no sun), so the agent reports a declared geometric proxy for daylight *potential*, never a performance number.
- Evidence: LEED v4 Daylight as documented by its simulation vendor defines both quantities of record — sDA is "meeting target illuminance levels (300 lux) using daylight alone for at least 50% of occupied hours"; ASE concerns "receiving direct sunlight (>1000 lux directly from the solar disc) for more than 250 occupied hours"; and "Points are based on the total spatial daylight autonomy (sDA) of all qualifying areas". USGBC's own credit page returned only the credit name and point values "1"–"3", so the thresholds come from the T3 documentation, not from the credit text itself. Proxy definition (method in EN-04 and TH-26):
  - `daylit_share_proxy = tiles within the type's daylight depth of a façade tile / NET`
  with `single_aspect_share`, `deep_unlit_tiles`, `facade_tiles_per_room` beside it
  Source type: rating-system criteria via technical documentation.
- Source: Climate Studio docs, *LEED v4 Daylight* — T3 (opened this pass), https://climatestudiodocs.com/docs/daylightLEEDOpt1.html; USGBC credit page — T1 but thin (credit name and point values "1"–"3" only), https://www.usgbc.org/credits/new-construction-schools-new-construction-retail-new-construction-data-centers-new-9
- Class: STANDARD + DESIGN PRINCIPLE
- Scope: habitable types; `n-a` for windowless uses
- Confidence: High on definition shape; Medium on importing 50 %/250 h as design targets (they are credit-eligibility values, not minima)
- Grid translation: emit `daylit_share_proxy`, `single_aspect_share`, `deep_unlit_tiles`, `facade_tiles_per_room`; each line printed `proxy: geometric, no illuminance model; external credit analogue: sDA 300 lux ≥ 50 % of occupied hours over ≥ 50 % of area`.
- Exceptions / failure mode: the proxy ignores glazing ratio, obstruction and season — the fidelity claim is geometric only. Publishing a proxy risks it being read as performance (UN-05, VA-10); the label is the mitigation. Failure symptom: a "daylight performance 62 %" quoted as if it were an sDA result.

### EV-15 Egress conformance is a count of compliant sources, and it is a gate not a score
- Rule: express egress as measurable quantities (compliant-source share, share of tiles inside the travel limit, worst exceedance with its witness), then refuse to let the share behave like a score — one non-conformant source is a fail.
- Evidence: VA-09 derives severity from consequence ("no matter how small"), which is what makes a partially-compliant egress set a fail rather than a 0.98; VA-04 fixes the consistency wording; CODE-02/03/04/07/10 carry the exit counts, travel and shared-path limits, jurisdiction-tagged. Measures:
  - `egress_conformance % = compliant sources/total occupant sources`
  - `travel_overage_tiles = Σ max(0, d*(tile, nearest permitted exit) − limit)`
  - `shared_path_max_tiles`
  - `independent_exit_floors = floors with ≥2 independent discharges/floors`
  Source type: repo rules over T1 code mirrors.
- Source: in-repo routing only — VA-09, VA-04 and the jurisdiction-tagged CODE-02/03/04/07/10 mirrors in `building-codes.md`; no code page opened from this file.
- Class: CODE REQUIREMENT
- Scope: all public-occupancy types
- Confidence: High
- Grid translation: emit the four keys with the worst exceedance witness attached (VA-08) and print `gate_egress: pass|fail` above any composite; the share never folds into the composite.
- Exceptions / failure mode: occupant loads are assumed from CODE-nn, so the percentage inherits that assumption band (UN-04). Efficiency gains consume egress slack first (DM-10) — that is why it is a gate. Failure symptom: "egress conformance 98 %" presented as near-pass while one exit is over-travel.

### EV-16 Vertical alignment drift is a first-class measured number for multi-floor designs
- Rule: the stack is the expensive part of a multi-floor building; publish how far the plan departs from a stack floor-to-floor in tiles rather than asserting alignment.
- Evidence: VA-16 states the portal-stack identity and makes a mis-stack critical, MS-24 demands "Measure vertical connectivity, don't assert it", FP-13 carries the stack constraints and GT-14 the core-module stack-verify. The cost consequence of a drift (shaft rerouting, wet-cell splits) is `HEURISTIC` — no opened source prices it. Measures:
  - `portal_stack_drift_tiles` = summed Manhattan offset of each portal from its group anchor
  - `wet_cell_alignment_share`
  - `shaft_band_continuity = floors whose service band overlaps the floor below / floors`
  - `core_footprint_jitter_tiles`
  Source type: repo rules.
- Source: VA-16, MS-24, FP-13, GT-14 in-repo; no external page opened for this rule.
- Class: FACT + HEURISTIC
- Scope: ≥2 floors
- Confidence: High on metric; cost consequence `HEURISTIC`
- Grid translation: emit the four keys as a per-floor series, not one mean; a non-zero drift raises VA-16's critical rather than a score line.
- Exceptions / failure mode: legitimate dog-leg stairs must be declared in the oracle or the check fires on every real design (VA-16's own exception; fixture it per VA-12). Perfect alignment serves constructability and shaft cost, and can push the core into the worst daylight position (HB-07, DA-06). Failure symptom: a single mean drift of 0.5 tiles hiding a floor-by-floor sawtooth.

### EV-17 Staff walk distance is a mean over a published OD set, in tile-steps
- Rule: operational travel is the measured mean (and 95th percentile) over a declared origin-destination set per role; an "efficient to operate" claim without its trip set is unfalsifiable.
- Evidence: VA-15 already defines simulated trips, the detour ratio and pinch heat with the OD set taken from the programme; PP-06 supplies the operator's day as the trip inventory; PP-13 supplies the desire-line detour threshold, whose 20–30 % figure is already flagged news-sourced there. Measures:
  - `staff_walk_mean_tiles`, `staff_walk_p95_tiles` — mean and 95th percentile over the declared OD set, per role
  - `service_crossings` — dirty route through the guest graph (PP-01)
  - `detour_ratio = measured/shortest_legal`
  - `bottleneck_tiles` — clearance ≤ 2 on ≥ k trips
  Source type: repo rules.
- Source: VA-15, PP-06, PP-13, PP-01 in-repo; no external page opened for this rule.
- Class: FACT + HEURISTIC
- Scope: operationally complex types (hotel, hospital, retail, industrial)
- Confidence: Medium-high for relative comparison, Low absolute (PP-13 caveat)
- Grid translation: emit the five keys per role and ship the OD set as an appendix, so the mean can be re-derived from its trip list.
- Exceptions / failure mode: no time model — tile-steps are a distance proxy, not minutes; queue verdicts are `proxy` by construction (VA-10). Minimising staff walk concentrates service rooms and lengthens guest detours; report both means. Failure symptom: an "efficient to operate" claim with no trip set behind it.

### EV-18 Cost proxy per m² names its unit basis, its rate source, and its wall tax
- Rule: a per-m² proxy is a relative device under one stated rate set, void as an absolute money claim; first-cost and recurring deltas are reported as separate columns and never summed without a stated conversion.
- Evidence: EC-02/EC-03 fix the face convention and the tile-grid wall tax that must be removed before any external comparison; DM-10 requires first-tile cost and whole-life consequences as two columns rather than one number. Measure:
  - `cost_proxy_per_m2 = Σ(rate_class × tiles_by_class)/NET_m²` with `rate_class ∈ {partition, façade, wet, corridor, core}`
  plus `first_cost_delta_tiles`, `recurring_delta {ticks, crossings}`, `wall_tax_adjustment` (EC-03). No rate table was opened this pass, so the proxy carries values only as relative weights under a named rate set. Source type: repo rules; absent rate source flagged.
- Source: EC-02, EC-03, DM-10, PP-24, VA-22 in-repo; no external cost-rate source opened — the harness carries the `rate_source` field instead (see Confidence).
- Class: HEURISTIC + ENGINEERING CONSTRAINT
- Scope: comparisons within one project
- Confidence: Low on values by design; High on the discipline — Rate tables: **NEEDS VERIFICATION** — no cost-rate source was opened this pass; the harness must carry a `rate_source` field and refuse to emit currency when it is empty
- Grid translation: emit `cost_proxy_per_m2` with `first_cost_delta_tiles` and `recurring_delta {ticks, crossings}` as separate columns plus `wall_tax_adjustment`; currency output is refused while `rate_source` is empty.
- Exceptions / failure mode: envelope complexity, off-module geometry (PP-24) and repetition (VA-22) dominate real cost and are only partly visible in a per-m² proxy. The proxy invites optimising the proxy (EV-30). Failure symptom: a per-m² figure quoted as an absolute money amount, or first-cost and recurring deltas summed into one number.

### EV-19 Every evaluation number carries band, stage, and the harness's own error
- Rule: comparative numbers inherit three uncertainties — the input assumption band, the model's resolution error, and the checker's own error. Report all three or the comparison is decorative.
- Evidence: UN-03 forbids a digit the weakest input does not support, UN-04 fixes the `value ± band (stage)` form, UN-18 requires charging the model's resolution error before criticising the design; VA-12 requires fixture-tested checkers and the corpus's SAST evidence shows untested checkers are unreliable — that is the third term. The three inherited uncertainties are therefore: input assumption band, model resolution error, checker error. Source type: repo uncertainty rules.
- Source: UN-03, UN-04, UN-18, VA-12 in-repo; no external page opened for this rule.
- Class: ENGINEERING CONSTRAINT
- Scope: universal
- Confidence: High
- Grid translation: every metric line as `value ± band (stage) | res_error: ±X tiles | harness@vN, self-test OK`; a comparison claim is emitted only when `Δ > max(band_a, band_b, res_error)`.
- Exceptions / failure mode: at 0.5 m/tile, differences of one tile or ~1 percentage point are not findings. Honest bands delete most 0.5-point "wins", which is the purpose. Failure symptom: a two-decimal composite gap declared a preference with no band and no self-test line.

### EV-20 Composite scoring has a defined procedure and ships as code, not prose
- Rule: if a composite is produced, produce it by direction-corrected min-max normalisation onto [0,1] with a declared, sourced weight vector, computed by a re-runnable script; the option set used for normalisation is published because min-max is set-dependent.
- Evidence: *A tutorial on multiobjective optimization* gives linear scalarization and its limits, and HELM's exposure requirement is why the weights must be visible rather than folded away; DM-08 (common unit) and DM-09 (explicit weights plus sensitivity) are the in-repo pair. Procedure:
  - `z(o,i) = (x_oi − min_o x_i)/(max_o x_i − min_o x_i)`, inverted for cost-direction criteria
  - `S(o) = Σ w_i z(o,i)`, with `Σ w_i = 1`
  - weights sourced to the brief or a named stakeholder; the script and its input vector ship with the report (VA-23)
  Source type: optimisation and ML evaluation methodology.
- Source: *A tutorial on multiobjective optimization*, https://pmc.ncbi.nlm.nih.gov/articles/PMC6105305/ — T2 (page opened this pass); HELM, https://arxiv.org/abs/2211.09110 — T2 (page opened this pass); DM-08, DM-09, VA-23 in-repo.
- Class: FACT + DESIGN PRINCIPLE
- Scope: comparisons only, never a single plan
- Confidence: High
- Grid translation: emit `normalisation: "min-max over option set [ids]"` naming the set, the weight vector with its source, the composite per option, and the scoring script plus input vector in the reproduction bundle.
- Exceptions / failure mode: cannot reach points on concave fronts (EV-21); inherits any gaming of a component metric (EV-30). Legible but gameable; the honest use is tie-breaking *inside* the Pareto front, never as the finding. Failure symptom: a composite difference that disappears when the normalisation set changes.

### EV-21 Show the Pareto front before any ranking
- Rule: compute dominance first; options beaten on every reported metric are the only ones you may delete, and the survivors are the answer — the scalar merely orders them for a named objective.
- Evidence: *A tutorial on multiobjective optimization* states the structure — "The subset of all non-dominated objective vectors in Y is called the *Pareto front*" — and the limit of the alternative: "in the case of concave Pareto fronts, the LSP will tend to give only extremal solutions", so a scalar cannot even reach the middle of a concave front. DA-08 (refuse a single winner) and DM-06 (hard constraints never traded) are the in-repo counterparts. Source type: optimisation methodology.
- Source: *A tutorial on multiobjective optimization*, https://pmc.ncbi.nlm.nih.gov/articles/PMC6105305/ — T2 (page opened this pass; quotes from it); DA-08, DM-06 in-repo.
- Class: FACT
- Scope: all comparisons; with fewer than ~3 metrics the front is usually everything and the exercise degenerate — say so
- Confidence: High (mathematical)
- Grid translation: emit `dominates: {…}`, `pareto_front: [ids]`, `dominated: [ids]` before any composite, then "for objective O the front point is P; the recommendation changes to Q when <criterion> weight exceeds <number>".
- Exceptions / failure mode: large fronts are unhelpful; cluster by axis (DA-06) rather than ranking twenty plans. Front-reporting protects the trade-off but refuses the reader's decision — supply a conditional recommendation. Failure symptom: a dominated option still in the shortlist, or a winner asserted with the dominated set never computed.

### EV-22 Offer lexicographic ordering as the honest alternative to weighting, and name when it is right
- Rule: where a stakeholder has genuinely committed to a priority order, satisfy the top criterion's aspiration band and optimise within it, instead of implying the order is a set of weights.
- Evidence: the corpus already carries a committed priority ladder — safety > structure > function > circulation > operations > environmental > efficiency > experience > aesthetics — recorded in `validation.md` (VA-05 ordering, Type-specificity audit); DM-17 requires publishing any reweighting, and DM-02 supplies satisficing aspiration levels as the mechanism. The method itself (constrained lexicographic ordering) is uncontested; what is project-specific is the ladder and the bands. Keys: `lex_order: [c1..cn]` and `aspiration: {c_i: band}`. Source type: repo conduct rules.
- Source: `validation.md` VA-05 and its Type-specificity audit, DM-17, DM-02 in-repo; no external page opened for this rule.
- Class: DESIGN PRINCIPLE + HEURISTIC
- Scope: safety- and code-adjacent comparisons; type cards reorder
- Confidence: Medium-high — the method is uncontested; the ladder is a project commitment, not a finding
- Grid translation: emit `lex_order` + `aspiration` and report per-level survivors ("after c1: {A,B}; after c2: {A}"); never blend lexicographic and weighted into one number.
- Exceptions / failure mode: information below the cut is discarded and ties proliferate; aspiration bands can be tuned to bless a favourite — publish them. Order transparency vs sensitivity to band placement. Failure symptom: a "safety first" claim implemented as a 15 % weight on a code gate.

### EV-23 Sensitivity-test the ranking and publish the flip points
- Rule: a ranking is a function of weights; publish where it changes. "Robust" is not a finding — a flip threshold is.
- Evidence: DM-09 requires the weights written down and the ranking re-run under perturbation, naming AHP rank reversal as the documented weakness; the theoretical counterpart is EV-21's extremal-solution limit from the multiobjective tutorial, so a scalar can also flip because the front is concave, not only because weights moved. Worked example — 3 options, 4 criteria, min-max normalised (higher better after direction flip):

  | id | validity (gate-adj., ↑) | lettable share (↑) | staff walk (↓, inverted) | daylit proxy (↑) |
  |---|---|---|---|---|
  | A | 0.571 (92 %) | 0.593 (71.0 %) | 0.600 (4 200 t) | 0.636 (58 %) |
  | B | 0.000 (88 %) | 1.000 (76.5 %) | 0.000 (5 100 t) | 0.000 (44 %) |
  | C | 1.000 (95 %) | 0.000 (63.0 %) | 1.000 (3 600 t) | 1.000 (66 %) |

  Base weights `w = (validity 0.35, lettable 0.25, walk 0.20, daylight 0.20)` → A 0.595, B 0.000, C 0.750. All three are non-dominated, so the front is {A,B,C} and the scalar is choosing among equals. Weight sweep holding the other three at their base proportions (`w_validity = 0.4667r`, `w_walk = w_daylight = 0.2667r`, `r = 1 − w_lettable`):

  | w_lettable | A | B | C | rank |
  |---|---|---|---|---|
  | 0.25 | 0.595 | 0.250 | 0.750 | C > A > B |
  | 0.40 | 0.595 | 0.400 | 0.600 | C > A > B |
  | **0.405** | 0.595 | 0.405 | 0.595 | **A = C (flip)** |
  | 0.45 | 0.595 | 0.450 | 0.550 | A > C > B |
  | 0.50 | 0.595 | 0.500 | 0.500 | A > C = B |
  | 0.55 | 0.595 | 0.550 | 0.450 | A > B > C |
  | **0.594** | 0.594 | 0.594 | 0.406 | **A = B (flip)** |
  | 0.80 | 0.594 | 0.800 | 0.200 | B > A > C |

  Reading: the compromise option A is weight-invariant (0.594–0.596 across the whole sweep); C leads until the lettable-area weight passes 0.405; B — the least valid option — never leads below 0.594. Source type: repo rule; optimisation methodology.
- Source: *A tutorial on multiobjective optimization*, https://pmc.ncbi.nlm.nih.gov/articles/PMC6105305/ — T2 (page opened this pass); DM-09 in-repo.
- Class: DESIGN PRINCIPLE + FACT
- Scope: every comparison with ≥3 metrics
- Confidence: High on requirement; the example's option data is constructed for teaching
- Grid translation: run the sweep and emit the flip thresholds as numbers; the deliverable is the reading sentence — "A leads for w_lettable in 0.405–0.594, C below, B above" — not the ranking.
- Exceptions / failure mode: one-at-a-time sweeps miss interactions — include at least one all-weight-on-one-criterion corner. A sweep is 10–20 table rows; it is the difference between a decision and an opinion. Failure symptom: a recommendation called "robust" with no threshold at which it changes.

### EV-24 Expose the trade-off structurally: vector, dominance, sensitivity, concession ledger
- Rule: presentation is part of measurement — fix the block order so a trade-off cannot be hidden by layout.
- Evidence: DA-04 (seven-field record), DA-05 (price every concession, name who loses), DA-07 (never drop a metric) and VA-18 (the diff table is the primary artefact) already fix the in-repo record shapes; HELM's requirement that compromises be "clearly exposed" is the external warrant for treating layout as part of the measurement. Source type: repo conduct rules; evaluation methodology.
- Source: HELM, https://arxiv.org/abs/2211.09110 — T2 (page opened this pass); DA-04, DA-05, DA-07, VA-18 in-repo.
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: High
- Grid translation: fixed block order — `metrics × options` (no blanks) → `dominance/front` → `composite + weights + flip points` → `concession ledger (<giver> → <receiver>: metric delta)` → `unknowns + capability manifest` → `reproduction bundle`.
- Exceptions / failure mode: wide tables are hard to read; the fix is the two-block layout, not fewer columns. Full exposure reads as indecision — answer with EV-21's conditional recommendation. Failure symptom: a report whose composite sits at the top and whose dominance block is missing.

### EV-25 Human evaluation: paired comparison for preference, anchored rubrics for quality, stated panel
- Rule: match instrument to question — forced choice reliably orders two plans; "is this a good plan" needs behaviourally anchored scales, because unanchored Likert ratings are dominated by rater scale-use habits. Report panel composition and never blend expert and lay means.
- Evidence: pairwise at scale is the accepted route for preference — MT-bench plus "Chatbot Arena, a crowdsourced battle platform", with "3K expert votes, and 30K conversations with human preferences" published. Design-preference research uses "the Likert scale rating" alongside paired comparisons and sorting, and flags "determination of the sample size" as an unresolved methodological demand — i.e. the instrument pair is standard and the sizing question is openly unsolved. Protocol card, six items:
  - question → instrument (pairwise ↔ order; anchored 7-point ↔ rubric clause)
  - `n_raters` + roles (architect / operator / lay)
  - stimuli held constant (same render, same crop, no author identity)
  - order randomised and mirrored
  - anchors written per level (VA-18 rows double as anchor text)
  - sample size chosen from the precision required of EV-26's coefficient
  Source type: preference-evaluation papers; design-psychology review.
- Source: *Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena*, https://arxiv.org/abs/2306.05685 — T2 (page opened this pass); architecture-preference methods review, https://pmc.ncbi.nlm.nih.gov/articles/PMC12248176/ — T2 (page opened this pass); "Differences between young architects' and non-architects' aesthetic evaluation of buildings", https://www.sciencedirect.com/science/article/pii/S2095263519300251 — located, returned 403 and **not read**, so it supports no number here.
- Class: STANDARD + DESIGN PRINCIPLE
- Scope: any claim of the form "people prefer this layout"
- Confidence: High on instrument choice; Low on effect sizes (source unopened) — **NEEDS VERIFICATION**: open it and record n, scale, and direction of the difference before citing
- Grid translation: emit the protocol card as a report block; expert and lay means printed separately, never pooled; sample size printed with the target agreement precision.
- Exceptions / failure mode: pairwise yields order without magnitude; a single Likert mean collapses distinct failures into one number. Experts need fewer raters and anchor better; lay panels represent the future user — report both separately. Failure symptom: one "usability 4.1/5" line from a mixed expert/lay panel with no anchors.

### EV-26 Report inter-rater agreement as a coefficient against its published band
- Rule: a human study without agreement is an anecdote; disagreement localises a rubric defect, not a rater defect.
- Evidence: Cohen's κ is defined as "κ = (po − pe) / (1 − pe)" and published bands are available — Landis & Koch: "`< 0` no agreement; `0–0.20` slight; `0.21–0.40` fair; `0.41–0.60` moderate; `0.61–0.80` substantial; `0.81–1` almost perfect" (the 1977 original itself not opened, so the bands come from the T3 reference). Krippendorff's α, built from observed over expected disagreement, carries its own decision thresholds from the coefficient's author: "Alpha ≥ 0.80 … satisfactory … indicating a reliable rating", "Alpha [0.67 - 0.79] … the lower bound for tentative conclusions", "Alpha < 0.67 … poor". Source type: methodology reference.
- Source: Cohen's kappa reference, https://en.wikipedia.org/wiki/Cohen%27s_kappa — T3 (page opened this pass; the 1977 original not opened); Krippendorff's α methodological notes (coefficient author's site), https://www.k-alpha.org/methodological-notes — T1 (page opened this pass).
- Class: FACT + STANDARD
- Scope: human studies, and any two-agent consistency test
- Confidence: High
- Grid translation: report `κ` or `α` with `n_raters`, `n_items`, category distribution and `interpretation: reliable(≥0.80) | tentative(0.67–0.79) | reject(<0.67)`; below 0.67, revise the anchors and re-run — never average and proceed.
- Exceptions / failure mode: κ misbehaves under skewed marginals (the kappa paradox); α ≥ 0.80 is a convention, not a law; bands differ between communities. More raters vs more designs — agreement tells you which purchase bought information. Failure symptom: a mean preference score whose raters disagree past the reject band.

### EV-27 LLM-as-judge is for triage and rubric scoring, never as ground truth
- Rule: a model judge may rank plans cheaply and flag rule breaches mechanically, but it must be calibrated against a human panel in *this* domain before its numbers are quoted, and its documented biases must be structurally neutralised rather than merely acknowledged.
- Evidence: the bias taxonomy is published — "examining the usage and limitations of LLM-as-a-judge, including position, verbosity, and self-enhancement biases, as well as limited reasoning ability" — with strong judges "achieving over 80% agreement, the same level of agreement between humans", which sets the human–human ceiling. Order instability is published too: "the quality ranking of candidate responses can be easily hacked by simply altering their order", countered by generating multiple evaluation evidences, aggregating across permuted orders and routing high-entropy cases to humans. The mechanism of self-preference: "a linear correlation between self-recognition capability and the strength of self-preference bias". Countermeasure protocol implied by those three findings: permute and mirror order, rubric-anchored scoring rather than holistic, seed replication, and a human calibration sample. Source type: LLM evaluation literature.
- Source: *Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena*, https://arxiv.org/abs/2306.05685 — T2 (page opened this pass); *Large Language Models are not Fair Evaluators*, https://arxiv.org/abs/2305.17926 — T2 (page opened; its specific flip-rate percentage could not be confirmed from the retrieved text — see Confidence); *LLM Evaluators Recognize and Favor Their Own Generations*, https://arxiv.org/abs/2404.13076 — T2 (page opened this pass).
- Class: FACT + DESIGN PRINCIPLE
- Scope: triage, rubric-anchored scoring at scale, first-pass ranking before human review
- Confidence: High on biases and the human–human ceiling; Medium on transfer to spatial design (cited tasks are chat, not plans) — the paper's specific flip-rate percentage could not be confirmed from the retrieved text — **NEEDS VERIFICATION**
- Grid translation: randomise and mirror candidate order, average both runs; score against written rubric anchors (VA-18 rows), never holistically; measure judge–judge disagreement across seeds; publish `judge_human_agreement %` next to every judge score with the human–human baseline (≥ 80 %) as the credibility ceiling; flag any run where generator and judge are the same model.
- Exceptions / failure mode: ≥80 % is agreement with chat preference under a specific judge model, not a warrant for code or spatial judgement; a judge that generated the plan is self-interested. Cost and scale vs credibility — disclosure plus a calibration sample, never silence. Failure symptom: an LLM-judge score of 8.6 quoted as design quality with no human comparison in the report.

### EV-28 Measure the skill, not just the design: matched with/without ablation and per-check deltas
- Rule: a rule added to the skill is a hypothesis. Test it with the same prompts, same controllable seeds, same harness version, run with and without the rule, and compare per-check pass-rates and metric vectors. A global-score delta is not evidence.
- Evidence: reproducibility discipline — single-run results leave "results that are non-reproducible and misinterpreted", which is why the with/without pair must be replicated; HELM's multi-metric design is why the comparison is a vector delta and not a global score; VA-12 (test the checker) and VA-23 (verdicts re-derivable) are the in-repo substrate. Acceptance protocol: the rule is accepted only if its target check improves and no critical check regresses; otherwise it is logged in the skill's weak-claims list rather than shipped. Source type: ML reproducibility methodology; repo rules.
- Source: *Deep Reinforcement Learning that Matters*, https://arxiv.org/abs/1709.06560 — T2 (page opened; the specific run-count recommendation sits in the body and was not opened); HELM, https://arxiv.org/abs/2211.09110 — T2 (page opened this pass); VA-12, VA-23 in-repo.
- Class: STANDARD + DESIGN PRINCIPLE
- Scope: every skill, rule, or threshold change
- Confidence: High on method; Medium on the replication convention — the specific run-count recommendation is in the body of 1709.06560 and was not opened — **NEEDS VERIFICATION** before quoting a number of runs
- Grid translation: record `{rule_id, harness@v, prompts@hash, seeds, n_runs, condition: with|without, per_check_delta: {check: {pass_with, pass_without, Δ}}, regressions: [], cost_delta}`; a rule without that record cannot be reported as an improvement.
- Exceptions / failure mode: output stochasticity means a single with/without pair proves nothing; prompt selection biases the conclusion — include the prompts that stress the rule and the ones that should be unaffected. N prompts × K seeds × 2 conditions is expensive; spend it on ~10 discriminating prompts, not 200 easy ones. Failure symptom: "the skill improved" off one global score change between two unmatched runs.

### EV-29 Keep a golden-design regression suite and a drift detector
- Rule: freeze designs and their expected metric vectors and verdict sets, re-run on every harness or skill change, and distinguish the two failures it catches: the design regressed, or the *measurement* drifted (same version, different numbers) — the second blocks release.
- Evidence: VA-12 already requires known-good/known-bad fixtures re-run whenever metric code changes, with the self-test result embedded in every run, and VA-23 requires that the same versions produce a byte-identical report — together they are exactly the drift detector. Benchmark practice supplies the pattern of fixed public splits with published scores (DStruct2Design pins its splits and reports per-condition numbers). Source type: repo rules; benchmark practice.
- Source: DStruct2Design, https://arxiv.org/html/2407.15723v1 — T2 (page opened this pass); VA-12, VA-23, FP-17 in-repo.
- Class: ENGINEERING CONSTRAINT
- Scope: any project that intends to make cross-version claims
- Confidence: High
- Grid translation: `golden/` holds `{plan tiles, derived vector (FP-17), requirements@vN, harness@vM, expected metric vector, expected verdicts}`; byte-compare on identical versions, else emit `HARNESS DRIFT — release blocked`; new bugs are added as `golden+1` with forward-only expectations.
- Exceptions / failure mode: golden sets ossify and bias work toward the cases they contain (EV-30); grow them by promoting new failures, never by editing old expectations to match output. Maintenance cost against the ability to say "this got better" at all. Failure symptom: an expectation rewritten to match a new checker output, which erases the regression it was there to catch.

### EV-30 Publish the reproduction bundle, and annotate every metric you optimised
- Rule: a publishable evaluation names dataset, harness, weights, versions, seeds, judge, and the command that re-derives every number; and because a metric that was selected for behaves differently from one that was merely measured, the selection target is disclosed.
- Evidence: Manheim & Garrabrant on Goodhart's law — "This class of failure is often poorly understood, partly because terminology for discussing them is ambiguous" — over-optimisation of a proxy for a goal producing systemic breakdown (their abstract cites earlier work identifying "at least four different mechanisms"; the individual variant names are body content and were not opened). ResPlan is the release-practice model: a documented, openly licensed dataset with its validation standards stated in the same text. VA-03/VA-10 supply the coverage illusion and UN-13 the rule against laundering a weak tier. Source type: metric-design / alignment literature; dataset release practice.
- Source: *Categorizing Variants of Goodhart's Law*, https://arxiv.org/abs/1803.04585 — T2 (page opened; variant names in the body not read); ResPlan, https://arxiv.org/html/2508.14006v1 — T2 (page opened this pass); VA-03, VA-10, UN-13 in-repo.
- Class: STANDARD + HEURISTIC
- Scope: universal, and specifically anything published from this skill
- Confidence: High on the direction of the law; Medium on the mechanism labels (unverified) — the individual Goodhart variant names are body content and were not opened — **NEEDS VERIFICATION**
- Grid translation: bundle = `{plan artefacts (tiles + derived vector), requirements@vN, suite@vM, harness@vK, weights, seeds, judge model@version, human panel card with κ/α, golden-run output, metric vectors, ablation record}`; annotate metrics that drove selection `target: yes (Goodhart exposure)`; print the vector above the composite (EV-02).
- Exceptions / failure mode: designs are not seed-reproducible even when scores are, so the artefact itself must ship, not just the numbers. Openness costs curation; gaming is reduced, not removed — a validity score optimised hard enough yields EV-08's box-on-a-grid, and a repetition score optimised hard enough yields HB-07's rejected plate. Failure symptom: a table of scores with no harness version and no annotation of which metric the search was targeting.

---

## Benchmark & dataset register

Verified by opening the primary page or paper this pass. "Scored with" = the metric the community actually uses, not the dataset's contents.

| Dataset / benchmark | Size as stated | License as stated | Taxonomy | Scored with | Tier |
|---|---|---|---|---|---|
| RPLAN (as used by the generation literature) | "80K annotated floorplans" (Graph2Plan abstract); "80,788" real-world plans, "80,315 converted" (DStruct2Design) | not stated in either opened page — **NEEDS VERIFICATION** before any redistribution claim | 13 room types (Graph2Plan's wording, carried by FP-01) | room-box/mask IoU, validity (overlap, interior, mutex), GED, FID | T2 |
| CubiCasa5K | "containing 5000 samples" (repo README and paper abstract) | repo ships a LICENSE that GitHub's detector reports as "Other" — exact terms **NEEDS VERIFICATION** | "over 80 floorplan object categories", mostly fixtures/walls/openings | vectorisation/segmentation/detection quality; the retrieved README page names no metric values | T1 repo, T2 paper (arXiv:1904.01920) |
| FloorPlanCAD | "over 10,000 floor plans" (paper abstract) vs "over 15,000 floor plans", "15,663 CAD drawings" (current homepage) — **paper/homepage disagreement** | "Creative Commons Attribution-NonCommercial 4.0 License"; "The users of the dataset accept full responsibility for the use of the dataset" (homepage) | "line-grained annotations of 30 object categories"; task "panoptic symbol spotting" | symbol-spotting / detection classification metrics, not layout validity | T1 homepage, T2 paper |
| Swiss Dwellings (Zenodo 7788422) | 45,176 residential units in ~3,100 structures | "Creative Commons Attribution 4.0 International" | dwelling typologies; tags incl. RESIDENTIAL/COMMERCIAL/PUBLIC/JANITOR | as-built geometry accuracy; record states manual Q/A "validated with a median deviation of 1.2%" | T1 |
| MSD (ECCV 2024, from Modified Swiss Dwellings) | "over 5.3K floor plans … covering over 18.9K distinct apartments" (repo) | not stated on the retrieved page — **NEEDS VERIFICATION** | room types plus four functional zones; 2,305 (16.6 %) non-residential plans filtered out (FP-19) | curation/label quality | T2 (repo for a paper) |
| ResPlan (arXiv:2508.14006v1) | 17,000 residential floor plans, vector-graph form | "CC BY 4.0" | "standardized taxonomy of room types and structural components" (count not in text retrieved) | boundary IoU, per-class mIoU, GED on connectivity, watertightness, planarity, precision/recall/F1, FID | T2 |
| DStruct2Design benchmark (arXiv:2407.15723v1) | uses RPLAN and "ProcTHOR-10k (12,000 procedurally generated layouts)" | not stated — **NEEDS VERIFICATION** | data-structure-driven (bubble diagram in, plan out) | self-consistency + prompt consistency + GED compatibility (EV-06) | T2 |
| MT-bench / Chatbot Arena (arXiv:2306.05685) | "3K expert votes, and 30K conversations with human preferences" published | stated public availability | n/a (chat preference) | pairwise battles; judge–human agreement (≥ 80 %) | T2 |

Register discipline: quote a dataset number only with its page, type, region, era and sample size (FP-19); none of the above is hospitality, so their *statistics* never transfer to a hotel floor — only their *metric definitions* do.

## KPI catalogue with normal ranges

Band sources: **[B]** opened external source above, **[H]** HEURISTIC (calibrate from this project's own generated population before treating as knowledge), **[R]** routed threshold (the number lives in another research file, cited there).

| Key | Formula (numerator / denominator) | Unit | Direction | Normal range / note | Src |
|---|---|---|---|---|---|
| `mIoU`, `boundary_iou`, `boundary_F1` | `|A∩B|/|A∪B|` per label then mean; boundary via ±1-tile match | ratio | ↑ | only against a reference; Graph2Plan's ≈0.65 is a reported score, not a gate | [R] FP-18, [B] |
| `GED` | `|E|+|E_ref|−2|E∩E_ref| + |V△V_ref|` | count | ↓ | 0 = exact topology match | [B] defn, [R] FP-18 |
| `validity_score` | `passes/(passes+fails)` over computable checks | ratio + `n/N` | ↑ | always printed with its denominator; no external band | [H] |
| `SC-*`, `PC-*` | stated-vs-derived percentage differences; overlap boolean | %, bool | ↓ | aim `≤ 2 %`, `Overlap = false` (project tolerance) | [B] defn, [H] tol |
| `net_to_gross` | `NET interior tiles / GROSS plate tiles` | ratio | ↑ | print `load_factor_equivalent = GROSS/NET`; BOMA-derived load factor "about 1.10 to 1.15" (rentable/usable) is the external analogue | [B] T4, [R] SP-18/EC-03 |
| `efficient_area_ratio` | `lettable NET / GROSS` | % | ↑ | calibrate; hospitality plates read higher than healthcare | [H] |
| `circulation_ratio` | `circulation-labelled tiles / GROSS` | % | band | placeholder 0.12–0.25 (hospitality); always paired with `detour_ratio` (PP-13) | [H] |
| `core_ratio` | `core tiles (lift/stair/WC/service) / GROSS` | % | band | placeholder 0.06–0.14 | [H] |
| `service_ratio` | `BOH tiles / GROSS` | % | band | budget published per floor, measured result reported (RP-06); type-card value | [R] |
| `wall_tax` | `blocked tiles / GROSS` | % | diagnostic | grid artefact; printed before any external comparison | [R] EC-03 |
| `adj_hard`, `adj_soft`, `adj_violation_cost` | met required-grade pairs/required; Σachieved/Σrequired weight; Σ(w × excess steps) | ratio, ratio, w·tiles | ↑,↑,↓ | per predicate class, no external band | [R] AG-02/06/09 |
| `daylit_share_proxy` | `tiles within daylight depth of a façade tile / NET` | % | ↑ | proxy; credit-scale analogue sDA 300 lux ≥50 % of occupied hours, ASE >1000 lux >250 h | [B] T3, [R] EN-04/TH-26 |
| `egress_conformance`, `travel_overage_tiles` | compliant sources/total; Σ max(0, d*−limit) | %, tiles | ↑,↓ | gate: 100 % or fail; limits jurisdictional | [R] CODE-02/03/04/07, VA-04 |
| `orthogonality`, `off_module_share`, `wall_stack_alignment`, `asymmetry_index` | see EV-08 | ratio | mixed | code thresholds unverified this pass | [H], NEEDS VERIFICATION |
| `portal_stack_drift_tiles`, `wet_cell_alignment_share`, `shaft_band_continuity` | see EV-16 | tiles, % | ↓,↑,↑ | 0 drift optimal; deviations priced via PP-17 | [R] VA-16/GT-14/MS-24 |
| `staff_walk_mean_tiles`, `staff_walk_p95_tiles`, `service_crossings`, `detour_ratio` | mean / 95th of simulated staff trips; service×guest crossings | tile-steps, count | ↓ | no external band; compare across options only | [R] VA-15/PP-06/PP-13 |
| `cost_proxy_per_m2` | `Σ(rate_class × tiles_by_class) / NET_m²` | proxy currency/m² | ↓ | relative only; `rate_source` must be non-empty | [R] EC-02/03, DM-10 |
| `uniqueness_ratio`, `removal_path_ok`, `maintenance_access` | lifecycle repetition, replaceability, access | ratio, bool | ↓, bool | type card; DFMA part-count logic | [R] VA-22 |
| `unknowns` | `suite_size − computable` | count | reported, never reduced by dropping checks | — | [R] VA-10 |

## Scoring harness schema

`harness@vK.json` — declarative and versioned before generation (EV-03), re-derivable (VA-23). Per metric:

```json
{
  "id": "circulation_ratio",
  "formula": "circ_tiles / gross_tiles",
  "unit": "ratio",
  "direction": "band",                      // up | down | band | bool | gate
  "band": [0.12, 0.25],
  "band_source": "HEURISTIC-calibrated@v3", // or {type:"opened", url, tier, quote}
  "capability": "computable",               // computable | proxy | none  (VA-10)
  "gate": false,                            // gates never fold into a composite (EV-09)
  "rounding": "1 decimal of %; integers of tiles"   // VA-17, UN-03
}
```

Harness-level fields: `harness_version`, `inputs_hash` (programme, adjacency matrix, site, type card), `suite_hash`, `weights` + `weights_source`, `normalisation: "min-max over option set [ids]"`, `seeds`, `n_runs`, `judge` (`model@version`, `order: randomised+mirrored`, `human_calibration: {n, agreement %}`), `golden_suite_result`, `ablation_ref`.

Report block order (EV-24):

```
headline:   options 3 · front {A,B,C} · dominated {} · gates: integrity pass, egress pass
metrics × options        no blanks; unknowns row last              (EV-02, VA-18)
composite + weights + flip points                                 (EV-20..EV-23)
concession ledger                                                 (DA-05)
unknowns + capability manifest                                    (VA-03, VA-10)
reproduction bundle list                                          (EV-30)
```

## Sources

Opened this pass (tiered per UN-12): DStruct2Design benchmark — self/prompt consistency + GED, RPLAN "80,788"/"80,315 converted", ProcTHOR-10k 12,000, https://arxiv.org/html/2407.15723v1 — **T2**; ResPlan — 17,000 plans, CC BY 4.0, boundary IoU / per-class mIoU / GED / watertightness / planarity / FID, https://arxiv.org/html/2508.14006v1 — **T2**; Graph2Plan — "trained on RPLAN, a large-scale dataset consisting of 80K annotated floorplans", https://arxiv.org/abs/2004.13204 — **T2**; CubiCasa5K repo — "containing 5000 samples", "over 80 floorplan object categories", license detected "Other", https://github.com/CubiCasa/CubiCasa5k — **T1**, and paper https://arxiv.org/abs/1904.01920 — **T2**; FloorPlanCAD paper — "over 10,000 floor plans", "30 object categories", https://arxiv.org/abs/2105.07147 — **T2**, and official homepage — "over 15,000 floor plans", "15,663 CAD drawings", CC BY-NC 4.0, "panoptic symbol spotting", https://floorplancad.github.io/ — **T1**; Zenodo record for Swiss Dwellings — 45,176 units / ~3,100 structures, CC BY 4.0, manual Q/A "validated with a median deviation of 1.2%", https://zenodo.org/records/7788422 — **T1**; MSD repo — "over 5.3K floor plans … over 18.9K distinct apartments", https://github.com/caspervanengelenburg/msd — **T2**; *A tutorial on multiobjective optimization* — Pareto front definition, "in the case of concave Pareto fronts, the LSP will tend to give only extremal solutions", ε-constraint form, weights stated "*prior* to the optimization", https://pmc.ncbi.nlm.nih.gov/articles/PMC6105305/ — **T2**; HELM — "We measure 7 metrics (accuracy, calibration, robustness, fairness, bias, toxicity, and efficiency)", trade-offs "clearly exposed", https://arxiv.org/abs/2211.09110 — **T2**; *Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena* — position/verbosity/self-enhancement biases, ">80% agreement, the same level of agreement between humans", "3K expert votes, and 30K conversations", https://arxiv.org/abs/2306.05685 — **T2**; *Large Language Models are not Fair Evaluators* — "the quality ranking of candidate responses can be easily hacked by simply altering their order", https://arxiv.org/abs/2305.17926 — **T2**; *LLM Evaluators Recognize and Favor Their Own Generations* — "a linear correlation between self-recognition capability and the strength of self-preference bias", https://arxiv.org/abs/2404.13076 — **T2**; Krippendorff's α methodological notes — α ≥ 0.80 reliable, 0.67–0.79 tentative, < 0.67 poor, Do/De construction, https://www.k-alpha.org/methodological-notes — **T1**; Cohen's kappa — "κ = (po − pe) / (1 − pe)" and Landis & Koch bands, https://en.wikipedia.org/wiki/Cohen%27s_kappa — **T3**; *Deep Reinforcement Learning that Matters* — "results that are non-reproducible and misinterpreted", https://arxiv.org/abs/1709.06560 — **T2**; Manheim & Garrabrant, *Categorizing Variants of Goodhart's Law* — terminology-ambiguity quote, "at least four different mechanisms", https://arxiv.org/abs/1803.04585 — **T2**; LEED v4 Daylight documented by its simulation vendor — sDA "300 lux … at least 50% of occupied hours", ASE ">1000 lux directly from the solar disc … more than 250 occupied hours", https://climatestudiodocs.com/docs/daylightLEEDOpt1.html — **T3**, with USGBC's own page (credit name and points "1"–"3" only) https://www.usgbc.org/credits/new-construction-schools-new-construction-retail-new-construction-data-centers-new-9 — **T1** (thin); BOMA-derived area definitions and load factor "about 1.10 to 1.15", https://realestatelawyernh.com/boma_standard.htm — **T4**; architecture-preference methods review — Likert plus paired comparison and sorting, "determination of the sample size" flagged, https://pmc.ncbi.nlm.nih.gov/articles/PMC12248176/ — **T2**; located but not opened: iHFG Part C space standards (http://healthfacilityguidelines.com/ViewPDF/ViewIndexPDF/iHFG_part_c_space_standards_dimensions), the architects-vs-non-architects study (https://www.sciencedirect.com/science/article/pii/S2095263519300251, 403). In-repo substrates referenced, not restated: VA-01..23, UN-01..20, DM-01..24, DA-01..10, FP-01/04/13/16/17/18/19/20/22/24, AG-02/06/08/09/20, SP-06/13/18, EC-02/03, EN-04/EN-26, TH-26, RP-06, PP-01/06/13/17/24, MS-24, GT-14, CODE-nn, HB-07, LC-08.

## Weak or contested

- **No license opened for RPLAN, CubiCasa5K's exact terms, MSD, or the DStruct2Design split** — every downstream size claim is a literature claim about data, not a right to redistribute it.
- **FloorPlanCAD disagrees with itself** (10,000+ in the abstract vs 15,663 on the current homepage). Quote page and date; the homepage number grows.
- **There is no hospitality benchmark.** All datasets above are residential or symbol-spotting CAD; no band derived from them may be used as a target for a hotel floor (FP-19/FP-20). Definitions transfer, magnitudes do not.
- **Dataset-reported scores are not acceptance gates.** ≈0.65 IoU, 0.94/1.00/0.16 self-consistency, GED 0.15 are one model's results on one split; this file's tolerances are project choices labelled `HEURISTIC`.
- **Composite scoring is contested by construction** — misses concave-front points, is set-dependent under min-max, and is the exact Goodhart mechanism EV-30 guards. Position taken: front first, scalar last, sensitivity always.
- **LLM-judge evidence does not transfer to space.** ≥ 80 % agreement is chat preference with a specific judge; nothing opened measures an LLM judging floor plans. EV-27's applicability to design is inference and requires the calibration sample before any judge number is quoted.
- **Position-bias magnitude unconfirmed** (arXiv:2305.17926's flip percentage); the qualitative claim already mandates randomised + mirrored order.
- **Goodhart variant names unconfirmed**; the popular one-line formulation is a later paraphrase and was not traced to Goodhart's 1975 text — do not quote it as primary.
- **Structural irregularity thresholds unverifiable** (EC8/ASCE pages blocked); EV-08 publishes geometry and routes the verdict to `engineer` (VA-20).
- **The 1.10–1.15 load factor is a T4 quotation** of a BOMA-derived rule, and it is rentable/usable, not net/gross — the two conventions are routinely conflated, which is why EV-11 keeps them apart.
- **Circulation/core/service bands have no opened authority** (iHFG located, unopened); until calibrated they are placeholders and must print `[H]`.
- **Ablation replication count unverified** (1709.06560 body unopened); EV-28 mandates replication without naming N.
- **Expert-vs-lay effect size unverified** (single study page 403'd).
- **Search tooling was unavailable for two queries** (WebSearch errors) — the RPLAN licence and the "real-relative-asymmetry" term are therefore recorded as negative/unverified results rather than as absences of fact.

## Type-specificity audit

Measurement-type, universal (closer = agent): reference metrics (mIoU, boundary IoU/F1, GED), self-consistency and enclosure checks, validity denominators and capability manifests, normalisation and composite procedures, weight-sensitivity sweeps, Pareto computation, harness/golden/ablation protocol, judge-bias countermeasures, publication bundles. None of these references a building use.

Type-parameterised (same key, different band — bind via the type card, VA-21): `circulation_ratio`, `core_ratio`, `service_ratio`, `efficient_area_ratio`, adjacency grade requirements and weights, `daylit_share_proxy` target, the OD sets feeding `staff_walk_*`, `uniqueness_ratio` tolerance (hotels reward repetition, museums punish it — VA-22's own exception), `room_holes`/void allowances, KPI weight vectors, and which keys are gates versus diagnostics.

Type-created checks: `egress_conformance` detail (exit counts and travel limits are occupancy-parameterised, CODE-nn), `portal_stack_drift` significance (`n-a` for single-storey), service-crossing metrics (absent in residential), dock geometry shares (retail/industrial), care-type sightline measures (proxy → `unknown` here), industrial open-floor share (`walkable ≥ 90 %`, FP-20) which makes most adjacency KPIs vacuous.

Never-transfer claims: every dataset band above is residential or single-family, and the daylight credit values are office/school rating-system criteria. Applying them to a ward or a guest floor without a source is the FP-19 failure; quoting a band without its `[H]`/`[B]`/`[R]` label violates EV-10 and EV-30 at once.
