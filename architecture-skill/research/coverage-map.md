# Coverage map — what the v3 quantitative domains add, and what they deliberately do not repeat

This file exists because "more research" is worthless if it re-says Domains A–X. It records (1) how
non-duplication was tested, (2) the boundary of each new domain against the nearest existing rules,
(3) every cross-file conflict the new research surfaced, with adjudication status, and (4) the gaps that
remain open after v3.

## 1. The axis of difference

The 23 original domain files are *qualitative rule* documents: each rule says what to consider, why it
matters, when it applies, and how the host grid expresses it. They name quantities only when a code or
standard fixes one (CODE-*, GT-*, CN-*).

The 9 v3 domains add the **magnitude and method layer**: the formula, the table of values with its
jurisdiction and edition, the algorithm, the worked example, and the measurement that turns "the core
looks big" into a number a design can be rejected on. Where an original file already states the rule,
the new file cross-references it by ID and supplies only the arithmetic underneath it — no new domain
restates an old rule.

## 2. How non-duplication was tested

Three checks, run before any of the new files were written:

1. **Whole-corpus rule-title sweep** — every `### <ID> <title>` line in `research/` (~800 headings at the
   time) read against each candidate domain, so a candidate whose decision was already titled was cut.
2. **Keyword coverage measurement** — topic probes across `research/`, `audit/` and `SKILL.md`. Domains
   were selected on zero or mention-only hits:

   | Probe | Hits before v3 | Read as |
   |---|---|---|
   | `shape grammar` | 0 | no coverage |
   | `slicing` | 2, both in `audit/` prose | no coverage |
   | `simulated annealing` | 0 | no coverage |
   | `cellular automata` | 0 | no coverage |
   | `tributary` | 0 | no coverage |
   | `plume` | 0 | no coverage |
   | `Grassmann` / elevator traffic arithmetic | 0 (`traffic analysis` appears only as a phrase) | rule stated, method absent |
   | `keys-to` | 0 | no coverage |
   | `isovist` | 5 files, mention-only | named, never defined as a metric |
   | `space syntax` | 9 files, mention-only | cited as authority, no computable metric |
   | `daylight autonomy` / `sDA` | 2 files, mention-only | metric named, threshold and computation absent |
   | `BOMA` / `rentable` | 9+ files | **already covered — dropped as a candidate domain** |
   | `post-occupancy` | 5 files | partially covered — folded into `evaluation.md` protocols rather than a new file |
3. **Boundary paragraph requirement** — each new file's first paragraph names the existing files it sits
   beside and states what it refuses to restate; and every rule in them carries a host field
   (`Grid translation`) written against the same 1-tile = 0.5 m datum the originals use.

## 3. Domain boundary table

| v3 domain | File / prefix | Nearest existing rules it borders | What those rules already own (not repeated here) | What only the new file supplies |
|---|---|---|---|---|
| Y Computational layout generation | `layout-algorithms.md` `LA-` | `adjacency-graphs.md` AG-02…AG-19, `grid-translation.md` GT-01…GT-25, `architecture-theory.md` TH-01 | The relationship vocabulary (graded adjacency, separation, must-touch) and the dimensional translation | The solvers: grammar derivations, slicing trees, CP/MILP encodings, annealing move sets and acceptance, selection-by-input-contract table, coarse→refine→validate pipeline, unsat diagnosis |
| Z Quantitative spatial analytics | `spatial-analytics.md` `SA-` | `human-behavior.md` HB-01…HB-26, `multi-scale.md` MS-16/MS-23/MS-24, `bim-cad.md` BIM-20 | Behavioural findings and the instruction to *measure* connectivity rather than assert it | Metric definitions with their exact normalisations, raster recipes on a 0.5 m grid, interpretation bands, published prediction correlations *and their criticisms* |
| AA Evaluation & benchmarks | `evaluation.md` `EV-` | `validation.md` VA-01…VA-23, `uncertainty.md` UN-*, `design-alternatives.md` DA-* | The per-design validation loop: oracle-first, three-valued verdicts, severity, counterexamples, report schema | Comparative measurement: correctness/validity metrics from the floor-plan literature, KPI catalogue with band sources, weight-sensitivity and Pareto reporting, human-eval and LLM-judge protocols, skill ablation and regression, anti-Goodhart guards |
| AB Vertical transport | `vertical-transport.md` `VT-` | `multi-scale.md` MS-10/MS-11/MS-23, `operations-maintenance.md` OM-16, `human-behavior.md` HB-* | The rule that lifts are sized by peak-period handling capacity and that queues are nonlinear | Round-trip-time and interval arithmetic with every term defined, traffic-pattern arrival percentages, HC5/INT/QoS bands, queue blow-up numbers, escalator throughput, worked 250-key hotel |
| AC Fire & egress quantification | `fire-safety-quantification.md` `FQ-` | `building-codes.md` CODE-01…CODE-28, `human-behavior.md` HB-01/HB-02/HB-10, `multi-scale.md` MS-08/MS-21/MS-23 | The prescriptive limits: occupant load factors, exit counts, travel distance, dead ends, refuge, stair enclosure | The performance arithmetic: flow and specific-flow models, level-of-service bands as flow, pre-travel time distributions, ASET/RSET method, tenability criteria *as actually sourced*, plus explicit exclusion of the limits no opened source supports |
| AD Preliminary structural sizing | `structural-sizing.md` `ST-` | `construction.md` CN-01…CN-28, `multi-scale.md` MS-01/MS-03/MS-07/MS-13/MS-19/MS-22, `grid-translation.md` GT-15 | Grid discipline, load-path logic, transfer flagging, core continuity, "pick the system from the span" | Load tables with clause addresses, tributary-area take-down worked floor by floor, span/depth limits, punching and drift checks, system-by-span and lateral-by-height bands, pad sizing, the plausibility checklist |
| AE Services sizing | `mep-sizing.md` `SV-` | `construction.md` CN-11…CN-20, `operations-maintenance.md` OM-17…OM-21, `multi-scale.md` MS-05/MS-20 | Where shafts, risers and plant go, and how they are reached and removed | How much each space demands and therefore how large the shaft/plant/louvre must be: ventilation rates, load densities, hydronic and electrical arithmetic, fixture units → stack size, sprinkler demand, riser schedule for a 21-floor hotel |
| AF Envelope, daylight & solar geometry | `envelope-daylight-quantification.md` `EQ-` | `environmental-design.md` EN-01…EN-26, `construction.md` CN-25/CN-26/CN-28, `multi-scale.md` MS-15 | The strategy chain (climate → orientation → envelope → openings → room placement) and façade-rhythm discipline | Sun altitude/azimuth tables and shadow geometry, daylight metric thresholds with their credit lineage, depth-of-daylight relations with their datum named, solar heat gain arithmetic, mass-law numbers, envelope build-up expressed as plan geometry |
| AG Hospitality operating standards | `hotel-operating-standards.md` `HO-` | `operations-maintenance.md` OM-01…OM-28, `space-programming.md` SP-*, `economics.md` EC-* | The spatial servicing logic (trolley bays, catchments, waste, loading, service lifts, replacement paths) and area-chain arithmetic | The industry ratios those spatial rules descend from: labour minutes per room, keys per staff, covers and seats per key, laundry throughput, banquet and meeting indices, BOH share — each stamped with source, year and geography, and translated into tiles |

## 3b. Wave 2–4 boundaries (Domains AH, AJ–AP)

Same test as §2, same rule: cross-reference by ID, supply the missing layer, restate nothing.

| v3 domain | File / prefix | Nearest existing rules it borders | Already owned (not repeated) | What only this file supplies |
|---|---|---|---|---|
| AH Compliance-as-code | `compliance-as-code.md` `CA-` (30) | `bim-cad.md` BIM-16…BIM-19, `validation.md` VA-01…VA-23 | The intent: write rules as (selection, constraint, severity), declare the model view, check geometry/classification/properties separately, keep the suite declarative and versioned, test the checker | The implementation: worked rule encodings, a computability matrix (decidable / approximate / refuse), unit and datum coercion, id stability across revisions, rule-pack versioning by code edition, false-positive budgets and suppression expiry, and the evaluation-loop pseudocode for a tile engine |
| AJ Construction programme | `construction-programme.md` `CP-` (24) | `construction.md` CN-21/CN-22/CN-23, `lifecycle.md`, `economics.md` | Kit-of-parts logic, "price non-standard geometry in setting-out", "sequence so crews repeat floor after floor", cost consequence structure | Cycle-time tables by formwork system, crew registers per 100 m², takt feasibility measured off plate repetition, learning-curve slopes and their misuse, offsite/DfMA demands, geometry→duration penalties, a worked 21-floor programme with float and the binding trade |
| AK Massing & site metrics | `massing-and-site-metrics.md` `MU-` (26) | `site-context.md` SC-*, `multi-scale.md` MS-03/04/19/22, `spatial-analytics.md` SA-13/14/20/21 | The qualitative factor→consequence map, stacking discipline, street-network and permeability metrics | Site-yield arithmetic with each jurisdiction's GFA/FAR inclusion and exclusion rules, coverage/setback/height envelopes as geometry, bulk controls (height-to-street, step-backs, separation, sky-exposure planes) as computable tests, massing-typology metrics, two worked site budgets that show *which* control binds |
| AL Cost mathematics | `cost-mathematics.md` `CM-` (28) | `economics.md` EC-*, `lifecycle.md` LC-*, `hotel-operating-standards.md` HO-04, `construction-programme.md` CP-* | Trade-off structure, net-to-gross as a reported metric, rentable-area conventions, the cost-per-key ladder, duration arithmetic | Rate literacy (inclusions and the area each rate divides by), elemental split ranges by type/region/year, the computed price of geometry, cost-of-height thresholds, estimate-class tolerance bands, NPV/service-life arithmetic — with money cells left as parameters rather than invented |
| AM Facility layout | `facility-layout-optimization.md` `FO-` (28) | `adjacency-graphs.md` AG-*, `spatial-analytics.md` SA-*, `operations-maintenance.md` OM-28, `layout-algorithms.md` LA-* | Relationship vocabulary and embeddability limits, configurational metrics, staff-walking distance as the plan's currency, plan-generation solvers | The flow×distance objective, transport ratio and AARC/AVRC with their inflation traps, W-matrix construction and unit-currency discipline, CRAFT/ALDEP/CORELAP executed, QAP hardness and the exact-solve ceiling, multi-floor distance through portals, and a worked hotel BOH case |
| AN Inclusive-use sequencing | `accessibility-usability-sequencing.md` `AX-` (28) | `human-scale.md` HS-*, `building-codes.md` CODE-12/18…23, `spatial-analytics.md` SA-06/09/16/25, `fire-safety-quantification.md` FQ-19/21 | Every dimensional minimum, clear width, turning circle, scoping percentage, refuge arithmetic | The task chain as a per-floor checklist (street→bed, 15 links, `first_broken_link`), real device envelopes and the "largest routine device" pinch test, passing/reversal spacing, sensory and cognitive accessibility measurable on a plan, evacuation-with-assistance sequencing |

> Checked, then corrected: this row originally claimed `AX-*` restates **no** dimension owned by `HS-*` or
> `CODE-*`. Measured: 10 of its 39 mm/cm figures also appear in those two files. Reading each in context,
> they are first-hand quotations of the primary text with clause addresses (ADA §802.1, §705.2, §503.2,
> §502.3.1), and where the corpus's own unit is involved `AX-` defers explicitly — the §305 clear-floor unit
> is named as "transcribed in HS-07 … with its tile translation given there". So no *rule* is re-owned, which
> was the intent; but the same physical value reached from the same standard does appear twice, and by this
> corpus's own doctrine (UN-10) that is **one origin, not corroboration**. The honest claim is the weaker one.
| AO Indoor environment outcomes | `indoor-environment-outcomes.md` `IE-` (24) | `mep-sizing.md` SV-01/02/05/06, `environmental-design.md` EN-*, `envelope-daylight-quantification.md` EQ-11/12/13/15/26/27, `human-behavior.md` HB-16/24 | Air rates, loads, duct and pipe arithmetic, sun geometry, daylight metrics, acoustic physics | The outcome thresholds those quantities aim at (WHO 2021 pollutant values, comfort bands with accepted-deviation percentages, melanopic light, STI/RT/NC by room function), the effect-size evidence *and its limits*, and the priority order when the budget forces cuts. Its headline negative finding: **CO₂ ≤ 1000 ppm has no health-limit basis in the sources opened** |
| AP Post-occupancy feedback | `post-occupancy-feedback.md` `PO-` (28) | `evaluation.md` EV-*, `professional-practice.md` PP-16/25/26, `lifecycle.md`, `real-projects.md` RP-08/23 | How to score a *design*, and the warning that documented project outcomes are advocacy | How a *building in use* is measured and how that evidence re-enters the corpus: POE typology with costs and cadence, instrument and sampling discipline, the conversion record (measurement → finding → transfer test → rule), the pooled-survey composition limits, and the documented corruption modes |

One correction this wave produced, on the host side rather than the research side: `PO-23` found that a
walking-speed figure used as a basis in an earlier planning constant does not decompose as claimed
(30 m/min is 0.5 m/s, not 1.35 m/s, and an area-per-hour figure divided by a speed yields a band width, not
a speed), so that ratio cannot size corridors; and it reports that the source file the constant was said to
come from does not exist in the tree. Both are recorded there as findings and in §4 below.

## 4. Conflict register

Every cross-file disagreement the v3 research surfaced. `ADJUDICATED` = a decision is recorded and the
weaker number superseded in place; `OPEN` = unresolved, both readings stand; `REPORTED` = named by the
researching agent but not re-verified by the orchestrator.

| # | Conflict | Status | Disposition |
|---|---|---|---|
| 1 | `CN-17` gravity-drain placeholders (20 / 40 tiles) vs `SV-26` computed budget (14 / 28 tiles at the §704.1 gradients on a declared 0.15 m build-up) | ADJUDICATED | SV-26 wins on arithmetic; CN-17's grid-translation line now carries a supersession note and keeps the old figure only as the record of the prior assumption |
| 2 | `SKILL.md` service band of 1–2 tiles cannot carry kitchen extraction, stair pressurisation or all-air ducts (`SV-12`/`SV-13`: a 7.0 m³/s all-air floor needs ≈1.17 m² ≈ 5 tiles of duct) | OPEN | The band is a *distribution* band; large ducts are shaft items. Needs a wording fix in the MEP section so the two statements stop reading as one |
| 3 | `EN-04` prints `d = 11 tiles` for the 2.5 × multiplier while the WBDG sentence it quotes measures 2.5 × **window height**, not head height (≈6 tiles) | OPEN (real), and it **advances** tension-register item 2 in `synthesized-rules.md` rather than being a new quarrel | Both multipliers are legitimate but have different datums. `EQ-*` names the datum per multiplier; `EN-04` needs the same edit before its `daylit_share` metric is compared across revisions — the same plan scores two different shares depending on which datum the reader assumes |
| 4 | `FL-17` portal-queue detection heuristic — `persons_in = rooms × 0.5` for the busiest 5-minute interval (≈50 % of a floor's keys inside 5 min) — vs the 5–15 % up-peak arrival bands `vertical-transport.md` reached from published sources | ADJUDICATED (as an order-of-magnitude conflict) | Re-read in source: `failure-patterns.md` FL-17 does state `rooms × 0.5` for the busiest 5-min interval. Even reading it as per hour, that is 12.5 % in 5 min on the arrival side and it is applied *per floor* without a building-wide peak factor, so the check over-promises demand by roughly 3–4× against `VT-*`'s cited bands and can strand a design in a false lift-count requirement. FL-17 remains a *detection trigger* (overflow of the lobby holding capacity), which is legitimate; `VT-*` is the sizing method and wins wherever the two disagree. FL-17's own text labels its figure "a starting heuristic", so no retraction is needed — only the ordering above |
| 5 | Average-waiting-time factor `f = 0.4` vs `f = 0.6` in the traffic literature | REPORTED / OPEN | Keep both, carry the sensitivity, never present one as the formula |
| 6 | CIBSE Guide D title / edition could not be confirmed from any reachable page | OPEN | `VT-*` cites the method generically; every Guide-D-derived number stays flagged until the edition is verified |
| 7 | NZ C/VM2 Amendment 3 contradicts itself on the smoke-yield factor: χ_r = 0.35 (Table 2.1) vs 0.45 (Eq 3.8) | OPEN (source-internal) | Recorded, deliberately **not** averaged; both printed with their clause addresses |
| 8 | Tenability limits commonly quoted (CO ≈ 4000 ppm, 60 °C, O₂ < 15 %, HCl) had no basis in any document `FQ-*` could open | ADJUDICATED (exclusion) | Printed as excluded rows with the dose basis that *was* read (27 000 ppm·min). A future pass that opens a primary source may reinstate them |
| 9 | FloorPlanCAD corpus size reported as both 10 000 and 15 663 drawings | OPEN | `EV-*` records both with their pages; a dataset's size must be cited from its own release note |
| 10 | Real-relative-asymmetry normalisation: the transcription `3(M−1)(k−2)/((n−2)(n−1))` fails a tree sanity test; `SA-*` publishes the corrected chain with computed baselines | ADJUDICATED | Use `SA-*`; any other formula must pass the same star/line/leaf anchor test before entering the corpus |
| 11 | `OM-28` (staff-walk-distance alarm) vs `HO-14` (minute ledger) sequencing: which bounds the other | REPORTED | `HO-*` records the tension in its own contested section; decide when the hotel BOH ladder is next edited |
| 12 | Prefix collision risk: `EN-` was already owned by `environmental-design.md`, so the new envelope file publishes as `EQ-` | ADJUDICATED | Prefix registry in §7 is now the single source of truth |

## 5. Evidence strength, measured

Counted from the files themselves, not from the researchers' summaries. `urls` = distinct resolvable
locators in the file; `T1…T4` = occurrences of the tier markers as written (a marker count, not a count of
independent origins — `audit/README.md` §17 and UN-10 make that distinction, and it bites hardest on
`fire-safety-quantification.md`, whose 84 T1 markers rest largely on one read standard);
`NV` = lines carrying a `NEEDS VERIFICATION` obligation.

| File | Rules | URLs | T1 | T2 | T3 | T4 | NV | What the numbers say |
|---|---|---|---|---|---|---|---|---|
| `layout-algorithms.md` (Y) | 28 | 17 | 0 | 63 | 9 | 0 | 5 | Pure research literature, as an algorithms domain should be: no code governs how a solver works, so strength here is "how many independent papers say so", not tier height. |
| `spatial-analytics.md` (Z) | 30 | 14 | 1 | 29 | 6 | 19 | 19 | Definitions are well-sourced; the *predictive* claims are the thin part, and each carries its published error bar and its criticism. |
| `evaluation.md` (AA) | 30 | 26 | 12 | 49 | 8 | 9 | 14 | Best locator spread in the layer; T2-heavy by design. |
| `vertical-transport.md` (AB) | 24 | 20 | 7 | 24 | 23 | 62 | 18 | No Tier-1 traffic standard could be opened at all. The formulas are usable; the coefficients are the flagged part. |
| `fire-safety-quantification.md` (AC) | 24 | 8 | 84 | 34 | 4 | 0 | 20 | Strongest sourcing, most concentrated: one read standard carries many rules. Re-open a second jurisdiction before treating any single figure as general. |
| `structural-sizing.md` (AD) | 26 | **0** | 37 | 4 | 7 | 2 | 21 | Cited by standard + clause with no resolvable locator: the numbers may be right and nobody can check them from the file. Highest-priority fix (§6). |
| `mep-sizing.md` (AE) | 28 | 31 | 16 | 2 | 11 | 29 | 11 | Most locators in the layer, but a T4 tail: rates from practitioner pages, so the `Class` label matters more than the count. |
| `envelope-daylight-quantification.md` (AF) | 28 | 10 | 49 | 5 | 56 | 14 | 17 | Code-and-guide territory read properly (WELL, Approved Document F), with the sun geometry recomputed rather than copied; the 17 flags are mostly unretrieved metric coefficients. |
| `hotel-operating-standards.md` (AG) | 27 | 13 | 22 | 12 | 47 | 50 | 18 | Industry-survey territory: vintage and geography on every figure; treat ratios as dated observations, not constants. |

| `cost-mathematics.md` (AL) | 28 | 8 | 34 | 6 | 3 | 19 | 18 | Deliberately **rate-free**: money cells in its worked build-up are marked `USER_SUPPLIED` / `METHOD_REQUIRED` / `INDEX_ABSENT` and only the derived quantities are computed (17 500 m² ÷ 250 keys = 70 m²/key = 280 tiles ✓). Its strongest anchor is a reproduced NPV result from a read LCC document; its honest weakness is that type-labelled cost splits stayed unopened. |
| `facility-layout-optimization.md` (AM) | 28 | **4** | 0 | 4 | 2 | 2 | 12 | **The least-sourced file in the layer by locator count**, and it should be read that way: the objective `Σ W·D`, transport ratio, AARC/AVRC and the QAP hardness statement are textbook material, but the classical-algorithm attributions the first pass aimed at were image-encoded PDFs, so the file publishes its own definitions and flags the provenance instead of borrowing authority it did not read. Correct one thing it got wrong on first pass: a ratio taken against a weak lower bound is inflated **away** from 1 (reads falsely poor), not toward it — fixed in FO-05. |
| `compliance-as-code.md` (AH) | 28 | 28 | 81 | 9 | 5 | 0 | **2** | 28 rules, 9 sections, ids CA-01…CA-28 with no gap — complete, though its author hit its turn cap and never reported. The outlier is the flag count: **2 verification obligations where a rule-engineering file citing standards by name would be expected to carry many.** Read as "author confident", that is the weakest signal in this census; read honestly, it is one more reason the adversarial pass in §6 should start here. |
| `post-occupancy-feedback.md` (AP) | 28 | 11 | 25 | 40 | 9 | 4 | 7 | The best-evidenced new method file: national POE guidance (T1) plus three opened datasets with real sample sizes (93,662 / 2,892 / 9,923 responses). Few locators, heavy reading. |
| `massing-and-site-metrics.md` (AK) | 26 | 28 | 63 | 6 | 3 | 11 | 23 | Zoning is jurisdiction-specific by nature, so the flag count is high by construction: every number is right somewhere and wrong elsewhere. |
| `accessibility-usability-sequencing.md` (AN) | 28 | 27 | 43 | 28 | 9 | 9 | 10 | Standards-plus-research mix; the device-envelope register is the strongest single artifact in the wave. |
| `indoor-environment-outcomes.md` (AO) | 24 | 18 | 38 | 14 | 13 | 19 | 11 | WHO values read properly, effect sizes reported *with* their heterogeneity, and a widely-believed number (CO₂ ≤ 1000 ppm as a health limit) retired as unsubstantiated. |
| `construction-programme.md` (AJ) | 24 | 15 | 8 | 15 | 35 | 60 | 9 | The most T3/T4-weighted file here: productivity rates live in contractor and consultant pages, not in standards. Read the vintage on every rate. |

Census measured after every domain file was final; the two files whose authorship ended without a report
(`compliance-as-code.md`, killed by a tool-turn cap mid-cleanup; `facility-layout-optimization.md`) were
verified by structure, completeness and reference integrity instead.

Three consequences for anyone reusing this corpus: a domain's `Class` and `Confidence` fields, not its
rule count, carry its weight; the `NV` column counts lines still carrying a verification obligation, so a
low number is not automatically good news — it can mean a narrow, well-read source base; and the two rows
that look the most like engineering (`structural-sizing.md`, `vertical-transport.md`) are the two a reader
must lean on least, which is exactly the failure mode the evidence rules exist to prevent.

## 6. Gaps still open

Closed by this wave and removed from the list: machine-checkable compliance (→ AH), construction programme
arithmetic (→ AJ), quantified massing and site yield (→ AK), cost and life-cycle mathematics (→ AL),
facility-flow optimisation (→ AM), accessibility beyond the code minima (→ AN), indoor-environment outcomes
(→ AO), post-occupancy feedback (→ AP).

Still open, so the next pass starts from a list and not a hunch:

- **Passive and structural fire engineering.** `FQ-*` quantifies egress and tenability arithmetic and
  deliberately excluded the limits it could not source; compartmentation design, fire-structure duration and
  sprinkler/standpipe hydraulics as *engineering* (rather than as a code table lookup) are unowned.
- **Civil/site works quantification.** Stormwater and attenuation, services easements, retaining and
  cut/fill balance, crane and hoard siting on a constrained site. `MU-*` touches slope and coverage; nobody
  owns the rest.
- **Retrofit and adaptive reuse.** Existing-building capacity, renovation code paths, and the spatial cost of
  designing around a structure that is already there — this corpus designs new buildings almost exclusively.
- **Programme depth for the non-hospitality types at `HO-*` resolution.** Healthcare (HBN-grade schedules),
  education (BB-grade areas), industrial and civic programmes exist as rules and partial registers, not as the
  numeric operating standard hospitality now has.
- **Security and force protection as arithmetic.** `OM-23` owns security zoning as a sightline test;
  checkpoint throughput, standoffs and vehicle mitigation as numbers are unowned.
- **Certification arithmetic.** Turning a geometry into LEED/BREEAM/WELL point outcomes is still a flag, not a
  computation; `EQ-*`/`IE-*` supply the underlying metrics, the credit logic does not exist.
- **An adversarial audit of the new domains.** `audit/` interrogated the original 23 files — URL liveness,
  claim-level evidence tables, independence tests, hallucination findings. The seventeen new files have had
  structural and numeric verification plus targeted recomputation (`audit/README.md` §23). That is not the
  same interrogation, and until it happens this corpus is *checked*, not *validated*.
- **Tier-1 thinness carried forward.** `structural-sizing.md` still publishes standards by clause with no
  resolvable locator (26 rules, 0 URLs) and `vertical-transport.md` still opened no Tier-1 traffic standard.
  Named in §5; unfixed, because the fix is retrieval rather than rewriting.
- **`synthesized-rules.md` still has no master rule for the quantitative layer.** `sources.md` has been
  regenerated and now indexes all domain files (691 URL-bearing entries, reconciled 691/691 against the
  files themselves), and the tension register carries the new conflicts by pointer (§4 here, items 12–13
  there). What is missing is the pooling step: SR-01…SR-37 summarise Domains A–X only, so an agent that
  enters through the SR ledger as the reading budget instructs will not meet the arithmetic unless it
  also reads `SKILL.md` § Quantitative Layer. Pooling pass owed.
- **Thin Tier-1 coverage on two new files.** `structural-sizing.md` publishes named standards with clause
  addresses but no URLs; `vertical-transport.md` could not open a single Tier-1 document. Their numbers
  are usable as preliminary checks, and their weakest claims are the ones already flagged.

## 7. Prefix registry

Rule prefixes are unique corpus-wide; a new domain must claim its letters here before writing.

| Prefix | File | Prefix | File |
|---|---|---|---|
| AG | adjacency-graphs.md | HO | hotel-operating-standards.md |
| BIM | bim-cad.md | LA | layout-algorithms.md |
| CN | construction.md | LC | lifecycle.md |
| CODE | building-codes.md | MS | multi-scale.md |
| DA | design-alternatives.md | OM | operations-maintenance.md |
| DM | decision-making.md | PP | professional-practice.md |
| EC | economics.md | RP | real-projects.md |
| EN | environmental-design.md | SA | spatial-analytics.md |
| EQ | envelope-daylight-quantification.md | SA | spatial-analytics.md |
| EV | evaluation.md | SC | site-context.md |
| FQ | fire-safety-quantification.md | SP | space-programming.md |
| FL | failure-patterns.md | SR | synthesized-rules.md |
| FP | floor-plans.md | ST | structural-sizing.md |
| GT | grid-translation.md | SV | mep-sizing.md |
| HB | human-behavior.md | TH | architecture-theory.md |
| HS | human-scale.md | UN | uncertainty.md |
| VA | validation.md | VT | vertical-transport.md |
| AX | accessibility-usability-sequencing.md | CA | compliance-as-code.md |
| CM | cost-mathematics.md | CP | construction-programme.md |
| FO | facility-layout-optimization.md | IE | indoor-environment-outcomes.md |
| MU | massing-and-site-metrics.md | PO | post-occupancy-feedback.md |

Checked mechanically, not by eye: **no prefix is used by two files** (43 files, 1070 rule records at the
last sweep). An unassigned letter — `AI` today — means no domain has been written for that slot, not that one
was lost; claim a letter here *before* writing the file, which is the step that would have prevented the
`EN`/`EQ` rename in §4 row 12.
