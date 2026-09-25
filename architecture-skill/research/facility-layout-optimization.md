# Research file — Domain AM: Facility layout optimisation (flow × distance as a solvable problem)

Boundary. This file owns the **optimisation and measurement layer of flow-based layout**: given a
who-goes-to-whom matrix and a distance definition, what is the objective, which named algorithms
actually solve it, what performance numbers an agent can compute and report, and where those numbers
mislead. It does not restate what the corpus already owns:

- `adjacency-graphs.md` AG-01…AG-24 owns the *relationship vocabulary and its graph semantics* — the
  four typed predicates (AG-02), the six-grade scale (AG-06), weighted path cost as an objective
  (AG-09), edge capacity/min-cut (AG-12), infeasibility screens (AG-17), repair (AG-18), graph fidelity
  (AG-19). This file takes the grade matrix as **input data**, converts it into weights and flows, and
  reports what the resulting objective is blind to. It never re-argues that separation is a different
  predicate from distance.
- `spatial-analytics.md` SA-01…SA-30 owns *measuring a layout that exists* — integration, choice,
  isovists, catchments, portal friction (SA-23). This file owns the *objective side*: the W × D product,
  the transport measures, and the solver. Where SA-* asks "where does movement actually concentrate",
  FO-* asks "what would it cost, and what is the cheapest arrangement".
- `operations-maintenance.md` OM-27 (frequency → daily tile-flow) and OM-28 (staff walking distance as
  the plan's currency) own the operational *rule*; OM-22 owns the welfare schedule. This file supplies
  the arithmetic that turns OM-27's frequencies into a flow matrix, the minimum against which OM-28's
  distance is judged, and the solver that closes the gap.
- `layout-algorithms.md` LA-10/LA-11 own the **QAP/MILP/CP encodings** and LA-17/LA-18 the weighted
  energy and annealing moves. This file does not repeat an encoding; it states which classical solver
  family a given input contract calls for, how that family behaves (acceptance rule, growth, trap), and
  the published scaling limits that LA-* leaves unnamed.
- `vertical-transport.md` VT-* owns lift traffic arithmetic; `fire-safety-quantification.md` FQ-* and
  `building-codes.md` CODE-* own egress. A flow-optimal plan that fails them is invalid, not good.

Datum, unchanged from the rest of the corpus: `1 tile = 0.5 m`, tile states
`walkable | blocked | door`, rooms are 4-connected flood-fills, movement is octile A* (AG/GT family),
`4 tiles² = 1 m²`.

## Rules

### FO-01 Reduce the layout problem to one flow matrix times one distance matrix
- Rule: State the objective in exactly one form before any algorithm choice: `TC(L) = Σ_{i<j} W_ij · D_ij`, where `W_ij` is the cost-weighted flow between departments `i` and `j` (units of currency per day after FO-10's discipline) and `D_ij` is the chosen distance between their service points under layout `L`. This single scalar is what every solver in this file optimises and every measure in this file compares; if a candidate cannot be scored by it, it is not a flow-layout problem and belongs to `adjacency-graphs.md`.
- Evidence: The QAP form opened this pass is written `minimize Σ_{1≤i,j≤n} a_ij · t_ij` over an assignment `t` of facilities to locations with `a_ij` the flow coefficient, i.e. a weighted sum of flow × location-distance products; the same repo already reduces adjacency placement to weighted path cost (AG-09). The `Σ W·D` product is therefore the shared arithmetic backbone of both, stated here in layout terms.
- Source: Wikipedia, *Quadratic assignment problem* https://en.wikipedia.org/wiki/Quadratic_assignment_problem — T4 (opened; objective and `a_ij`/assignment structure quoted). This repo: `adjacency-graphs.md` AG-09 (weighted path cost) — intra-repo.
- Class: FACT (arithmetic) / STANDARD (the one canonical objective form)
- Scope: any layout with quantifiable interdepartmental movement
- Confidence: High
- Grid translation: Compute `D_ij` from tile centroids of the two rooms' door tiles (GT octile `max(dx,dz)+0.41421·min(dx,dz)` tiles), store `W_ij` as a float, emit `TC` in trip-tiles/day then × 0.5 m/tile for trip-metres/day. Never mix the tile distance with a metre-based `W` without one ×0.5 factor applied exactly once.
- Exceptions / failure mode: The reduction silently assumes flow cost is linear in distance (each extra tile of a trip costs the same). A lift, a ramp or a hygiene checkpoint makes per-unit cost step at that link — FO-11 and the OM/VT portal costs carry that; a linear `Σ W·D` will under-price it.

### FO-02 Fix the distance definition before comparing any two layouts
- Rule: Declare one distance function `D` globally — `rectilinear` (Σ axis deltas), `Euclidean`, `shortest-path on the corridor skeleton`, or `time` (distance ÷ speed, per-floor) — and never score two candidate layouts with two different `D`. The distance definition is part of the objective, not a reporting detail; it changes which layout is optimal.
- Evidence: Under rectilinear distance movement is charged per axis and a diagonal detour costs the full Manhattan sum; under Euclidean it is the straight segment and the diagonal is discounted to `√2·` the axial leg. *Worked and computed in this file's ## Worked BOH flow example*: with one fixed 6-department flow matrix, candidate-1 beats candidate-5 under rectilinear (`25 440` vs `26 960` trip-tiles/day) but loses to it under Euclidean (`22 713.8` vs `21 399.4`) — the same `W`, a different optimum. This is arithmetic, verifiable without an external source (GT-03's standard).
- Source: arithmetic; this repo GT-01 (octile metric) and AG-09 — intra-repo; flip computed in this file's Worked section. `shortest-path` and `time` definitions rest on the octile A* datum (GT-01, SA-12).
- Class: STANDARD (a required declaration) / FACT (the metric arithmetic)
- Scope: universal
- Confidence: High
- Grid translation: Store `D.metric ∈ {rectilinear, euclidean, octile, shortest-path, time}` in the run record and key every stored `TC` by it. `octile` is the grid's own shortest movement and is the default here; `rectilinear` understates nothing but ignores walls, `shortest-path` is the only one that respects the built plan (FO-03).
- Exceptions / failure mode: Choosing `Euclidean` because it "looks nicer" on a walled plan systematically under-prices routes that must bend around a core, so it flatters diagonal-heavy layouts the building cannot actually walk (FO-27).

### FO-03 Measure interdepartmental distance on the circulation skeleton, not wall-to-wall
- Rule: For any layout that is not a single open room, take `D_ij` as the shortest walkable path along the door-and-corridor skeleton, not the straight-line gap between room centroids. Straight-line distance is a plan-abstract that the built route contradicts; optimising it optimises a plan nobody can traverse.
- Evidence: The corpus already routes every movement claim over the walkable graph (SA-12 computes flow/betweenness on the corridor skeleton, not every tile; AG-09 optimises weighted path cost), and `detour_index = L_actual / L_octile ≥ 1` is published as the gap between the two (SA-13). Flow-layout distance inherits that same choice; a centroid-to-centroid `D` ignores exactly the walls SA-13's detour index measures.
- Source: This repo: SA-12, SA-13, AG-09 — intra-repo (their sources carry the evidence). Octile/A* datum from GT-01.
- Class: STANDARD (measurement procedure) / DESIGN PRINCIPLE (why)
- Scope: every plan with interior walls or a non-trivial core
- Confidence: High
- Grid translation: Build the skeleton graph from door tiles + corridor junction tiles (SA-12's reduction), run A*/Dijkstra once per department pair on the role-restricted graph (AG-15), cache the 6×6 (or n×n) distance matrix per candidate. Report `through_room_share` (SA-13) to flag when the "cheapest" path crosses an occupied room.
- Exceptions / failure mode: For pure material-handling of a trolley down one straight corridor the straight-line and skeleton path coincide, so the distinction vanishes and centroid distance is acceptable; it fails the moment the skeleton bends, splits a department, or a door must be passed (GT-22, FO-25).

### FO-04 Report total transport cost and cost per trip-metre, in one currency
- Rule: Publish `TC = Σ W_ij·D_ij` as the headline flow cost, and normalise it by activity as `cost per trip-metre = TC / (total trips/day)` so two plans of different sizes or different demand are comparable. Both numbers carry the currency unit fixed by FO-10; a dimensionless "score" is not a cost.
- Evidence: Per-unit normalisation is the corpus's standing answer to size-dependence (SA-03 normalises depth before comparing across plans; OM-24 splits operational load into separate ratios rather than one blended index). A raw `TC` grows with department count and with trip volume, so it cannot rank a small tight BOH against a large one; dividing by trips makes the number per-trip and portable.
- Source: This repo: OM-24, SA-03 — intra-repo. Arithmetic normalisation; no external source required.
- Class: STANDARD (reporting convention) / FACT (the arithmetic)
- Scope: any layout scored on flow
- Confidence: High
- Grid translation: Emit `{total_transport_cost_trip_metres_per_day, total_trips_per_day, cost_per_trip_tile = TC_tiles/trips, currency_unit}`. `cost_per_trip_tile = 0.5·(cost_per_trip_metres)` — publish the tile number and the metre number, never silently one for the other.
- Exceptions / failure mode: `cost per trip-metre` hides concentration: a plan can have a low mean because a few long trips dominate the `TC` while most trips are trivial. Always publish the per-pair `W_ij·D_ij` breakdown next to the mean so the reader sees which adjacency actually costs money (FO-08).
### FO-05 Report the transport ratio against a stated minimum, and name how the minimum was obtained
- Rule: Publish `transport_ratio = TC(achieved) / TC(minimum)` for the *same* `W`, and print, in the same record, how `TC(minimum)` was produced: (a) exhaustive `n!` enumeration for small `n`; (b) a QAP lower bound (Gilmore–Gomory / LP / spectral) when exact is out of reach; or (c) the best value a named solver actually found. A transport ratio with no named baseline is not a number — `LB ≤ true min ≤ achieved` always holds, so a ratio built on a weak lower bound is inflated **away from 1**, and the plan reads falsely *poor*; only a baseline produced by an actual optimum or a tight bound lets the ratio mean what it says.
- Evidence: The opened QAP case-study states plainly that "as n increases beyond a small number, it becomes impossible to enumerate" the assignments, so for real floor counts the baseline is a bound or a heuristic result, never a guarantee (NEOS Guide, *Quadratic Assignment Problem*). The trivial lower bound `min_d · Σ W` (every pair at the smallest feasible leg) used in this file's Worked example gives `25 440/15 520 = 1.639` for candidate-1 — an optimistic ratio because the bound is not always attainable; that is exactly the trap the rule exists to name.
- Source: NEOS Guide, *Quadratic Assignment Problem* https://neos-guide.org/case-studies/sc/la/qap/ — T3/T4 (opened; enumeration-impossibility quote). This repo: SA-03 (a normalised number only means something across comparable sizes), `layout-algorithms.md` LA-19 (report solver status verbatim: `FEASIBLE` ≠ `OPTIMAL`) — intra-repo.
- Class: STANDARD (the baseline must be named) / FACT (the bound inequality)
- Scope: any flow layout
- Confidence: High
- Grid translation: Emit `{transport_ratio, baseline_method ∈ {enumeration, qap_lower_bound, best_found, trivial_lb}, baseline_value_trip_metres, achieved_value_trip_metres}`. On this grid the `trivial_lb = min_leg_tiles · Σ W · 0.5`. Print the method enum verbatim so a reader can see how close to 1 the ratio is allowed to be.
- Exceptions / failure mode: If `baseline_method = best_found`, the ratio can be < 1 against a *worse* "best", which is meaningless — never compare a plan to a non-optimal baseline and call the result a ratio.

### FO-06 Compute AARC and AVRC from the same grade matrix that produced W
- Rule: `AARC` (adjacency achieved ratio) = (sum of closeness weights of *positive* relationship pairs that are adjacent) ÷ (sum of all positive weights). `AVRC` (adjacency avoided ratio) = (sum of weights of *undesirable/X* pairs that are correctly NOT adjacent) ÷ (sum of all undesirable weights). Build both from the relationship grade matrix in FO-14, and fix whether "adjacent" means sharing a wall/door or within `k` tiles — publish the definition; do not let the grade matrix that built `W` and the grade matrix scored for `AARC` diverge.
- Evidence: The closeness scale with an explicit forbidden grade (X) and integer weights is owned by AG-06 (six-grade scale, `A/E/I/O/U/X`), and the must-not-touch separation predicate by AG-02/AG-11; AARC/AVRC are simply those grades re-scored as achieved adjacency on a placed plan. Whether these exact acronyms and their normalisation come from a single canonical paper could NOT be opened this pass (the Francis/Severitz ratio-measure sources are image-encoded PDFs), so the formulae are stated as this file's definitions and the attribution is flagged.
- Source: This repo: AG-06 (grade scale + integer weights), AG-11 (door-count separation) — intra-repo. NEEDS VERIFICATION: the canonical definition/normalisation of AARC & AVRC and the Francis–White (1974) origin — open a text-extractable copy before quoting them as authored measures rather than this file's arithmetic.
- Class: FACT (arithmetic as defined here) / STANDARD (must reuse the same grade matrix)
- Scope: layouts planned from a graded relationship chart
- Confidence: High on the arithmetic; Medium on attribution
- Grid translation: After placement, test each pair for `adjacent = door-tiles share a common room boundary OR centroid octile ≤ k` (declare `k`, default `k` = one corridor bay ≈ 8 tiles). Emit `{aarc, avrc, adjacency_definition, positive_weight_total, negative_weight_total}`.
- Exceptions / failure mode: Both ratios are blind to *distance magnitude* — a layout that puts every positive pair exactly `k` tiles apart scores the same `AARC` as one that packs them wall-to-wall, so `AARC` alone will never catch a sprawling-but-adjacent plan (FO-05's cost number must stand beside it).

### FO-07 Publish flow similarity, not only the scalar cost
- Rule: Alongside `TC`, report how well the *achieved proximity* reproduces the *desired* one: the rank agreement (Spearman ρ) between the vectorised flow matrix `W` (big = should be close) and the achieved distance matrix `D` (should be strongly negative), and the `weighted_adjacency_coverage = Σ_{pairs among the top-q flows, adjacent} W / Σ W`. A single cost cannot separate "everything moderately far" from "most pairs touching, one catastrophic long haul".
- Evidence: The corpus already forbids ranking a design on one metric and mandates publishing the disagreement vector (SA-28); reporting a distribution/vector instead of a mean is the same discipline applied to flow (FO-04's per-pair breakdown). ρ between `W` and `D` is this file's chosen scalar summary of that vector.
- Source: This repo: SA-28 (never rank on one metric), OM-24 (ratios, not one blended index) — intra-repo. Spearman ρ is standard non-parametric rank correlation (arithmetic; no source required). HEURISTIC for the ρ / coverage bands.
- Class: HEURISTIC (formulation) / FACT (the rank statistic)
- Scope: any layout with a graded `W`
- Confidence: Medium
- Grid translation: Vectorise the `n(n−1)/2` off-diagonal `W` and `D`, compute ρ, and set the top-q flow cut at the trips covering 80 % of `Σ W`. Emit `{flow_similarity_rho (expect ≤ −0.4), weighted_adjacency_coverage, dominant_cost_pair}`.
- Exceptions / failure mode: ρ is rank-only — it ignores the magnitude of `W`, so a plan can have a strong ρ yet a huge cost because the single highest-flow pair sits at the wrong end; always pair ρ with the max `W_ij·D_ij` term.

### FO-08 Defend every ratio measure against adjacency inflation
- Rule: `AARC` is monotonically non-decreasing when you make more pairs adjacent, so "more satisfied adjacencies" is a trivially better score and cannot be used as an improvement test on its own. Gate any `AARC` gain by (a) a non-increase in `transport_ratio`, and (b) a fixed adjacency budget, and report how many adjacencies the comparison paid for.
- Evidence: The inflation trap is structural to coverage ratios: the numerator can only grow as edges are added while the denominator is fixed, mirroring the Goodhart warning the corpus raises for any count-based score (`evaluation.md` anti-Goodhart guards, AG's cap on mutual adjacency by shape class AG-04/AG-05). A plan that adds doors everywhere raises `AARC` while wrecking circulation share (TH-15 movement budget) and privacy (AG-11).
- Source: This repo: AG-04/AG-05 (adjacency caps by shape/degree), TH-15 (movement-share budget), `evaluation.md` anti-Goodhart — intra-repo. Logical monotonicity of the ratio is arithmetic (no source required).
- Class: STANDARD (a required guard) / FACT (the monotonicity)
- Scope: any use of AARC/AVRC/coverage as a "better/worse" verdict
- Confidence: High
- Grid translation: When diffing two plans (VA-18), print `ΔAARC`, `Δtransport_ratio`, and `Δdoor_count` together; a plan whose `ΔAARC>0` is only promotable if `Δtransport_ratio ≤ 0` and `Δdoor_count` is inside the door budget (GT-23 prices doors).
- Exceptions / failure mode: The symmetric error is discarding `AARC` entirely because it inflates — it still catches *missed* adjacencies at a fixed layout; use it as a diagnostic, never as the objective.

### FO-09 Report the per-pair cost breakdown so the headline cannot hide the dominant leg
- Rule: Publish the sorted list of `W_ij·D_ij` terms (largest first) with each pair's name, distance and flow, and the share of `TC` carried by the top term. A low mean transport cost (FO-04) is routinely produced by many trivial short trips masking one expensive high-flow pair; the fix is to see the columns, not to average them.
- Evidence: The corpus names the failure directly and prices it: "roughly 25–36 % of variance" style single-metric readings must ship with the residual/breakdown (SA-10 reports the fit with its error bars; SA-13 publishes a *distribution*, not a mean). `OM-28` makes staff-walking-distance the plan's currency — the dominant `W_ij·D_ij` term is precisely the walk that currency must be spent on.
- Source: This repo: SA-10, SA-13, OM-28 — intra-repo (their sources carry the evidence). Arithmetic decomposition of a sum into terms requires no source.
- Class: STANDARD (reporting obligation)
- Scope: any flow layout
- Confidence: High
- Grid translation: Emit `top_cost_terms: [{dept_pair, w_trips_per_day, d_tiles, d_metres, term_trip_metres_per_day, share_of_TC}]`, sorted desc, until cumulative share ≥ 80 %. Flag any single term with `share_of_TC > 0.25` as the leg to shorten first (it is the CRAFT/annealing move that pays).
- Exceptions / failure mode: Chasing the single top term can starve the *set* of medium terms whose sum is larger; report both the top term and the residual sum below it, never only the max.
### FO-10 Build W from operations counts, never from an adjective
- Rule: Populate every `W_ij` from a measured or estimated *rate* per interdepartmental pair in one of three operational units — trips/day (person or trolley or pallet movements), tonnes/day (bulk material), minutes/day (staff time walking that leg) — and only then convert to a cost weight. An unquantified "these two must be near each other" is a relationship grade (AG/FO-14), not a flow entry; do not put grades into the flow matrix.
- Evidence: The corpus already turns servicing frequency into a load on the plan (OM-27 converts each cleaning/servicing frequency into a daily tile-flow; OM-28 makes staff-walking *distance* the currency), and the hospitality minute/ratio ledgers live in `hotel-operating-standards.md` (labour minutes per room, laundry throughput). FO-10 is the arithmetic that assembles OM-27's per-frequency flows into the `W` matrix; it restates no OM rule.
- Source: This repo: OM-27 (frequency → daily tile-flow), OM-28 (staff-walk currency), `hotel-operating-standards.md` HO-* labour/laundry ledgers — intra-repo.
- Class: STANDARD (construction procedure) / FACT (the summation)
- Scope: any facility with operational data or an operations estimate
- Confidence: High
- Grid translation: For each ordered pair store `{w_trips_per_day, w_tonnes_per_day, w_min_per_day, basis: measured|estimated|schedule}`. When only minutes are known, `W_ij(minutes) = trips × round-trip walk time` on the FO-03 skeleton — closing the circularity by iterating distance↔time (FO-02, FO-27).
- Exceptions / failure mode: Peak demand, not the daily average, is what the layout must serve; a `W` built from a 24-hour mean under-prices the 06:00 linen pulse and the 19:00 banquets. Build `W` per declared traffic period and design on the binding one (OM-16 "never size on the average day", VT-02/VT-19 pulse logic).

### FO-11 Keep unit currencies separate inside W; never sum person-trips with pallet-trips
- Rule: Before any pair is summed across flow types, convert every type to one currency (cost/day, or a normalised demand unit) using an explicit handling rate per type — a person-trip and a pallet-trip are not commensurable and must not be added raw. If no defensible conversion exists, keep them as *separate* objectives and Pareto them (design-alternatives), rather than inventing a factor to force a single scalar.
- Evidence: Mixing incommensurable units into one sum is the same category error the corpus blocks at the contract boundary (CA-12 unit coercion once, before comparison; GT-04 never keep a single lossy representation). OM-24 makes the related point operationally: express servicing load as four separate ratios, not one blended "BOH %". A blended `W` that adds a pallet to a person is an unlabelled coercion.
- Source: This repo: CA-12, GT-04, OM-24 — intra-repo.
- Class: ENGINEERING CONSTRAINT (coercion discipline) / STANDARD
- Scope: any multi-modal flow matrix (people + goods + waste + linen)
- Confidence: High
- Grid translation: Store `W` as a per-type tensor `W[type][i][j]` and only collapse to `W[i][j] = Σ_type rate[type] · W[type][i][j]` after publishing the `rate[type]` vector. `cost_per_trip` by type belongs in the record so the reader can re-collapse with their own rates (FO-15's sensitivity applies to these rates too).
- Exceptions / failure mode: A single "trips" column that silently counts a forklift load and a footfall walk identically will put a heavy-goods pair and a light-staff pair at the same priority; the layout then optimises the wrong movement. This is the number-one data defect in BOH flow studies.

### FO-12 Model one-way and sequence-dependent flows as a directed W
- Rule: When the return leg is empty or forbidden, `W` is asymmetric (`W_ij ≠ W_ji`): dirty→clean routes, soiled-linen out vs clean-linen in, refuse out with no return. Build and optimise on the full directed matrix; do not symmetrise by averaging, which invents a return flow that never happens and hides the one-way hygiene constraint. Where traversal cost differs by direction (loaded downhill, empty uphill, a turnstile), `D` is likewise asymmetric.
- Evidence: The corpus keeps dirty and clean as separate, ordered operations and places their hold at the department entrance serviceable from both sides (OM-08), and treats service separation as plan geometry (CODE-26); the "dead-heading" of a one-way route (an empty return) is a flow the symmetrised matrix erases. FO-12 supplies only the directed-arithmetic conversion; it does not re-argue separation.
- Source: This repo: OM-08 (soiled vs clean hold, both-sided), CODE-26 (service separation as geometry), AG-02 (relationship predicates stay separate) — intra-repo. Asymmetric `Σ W_ij·D_ij` over directed pairs is arithmetic.
- Class: FACT (arithmetic) / STANDARD (do not symmetrise a one-way flow)
- Scope: hospitality BOH, healthcare, any process with a clean/dirty direction
- Confidence: High
- Grid translation: Keep `W` and `D` as full `n×n` (not upper-triangular) matrices; `TC = Σ_{i≠j} W_ij·D_ij`. The QAP `a_ij` (FO-21) is normally symmetric; note that a directed `W` is the asymmetric-QAP variant, which is *not* easier (the special cases that collapse to TSP/assignment assume structure). Flag it in the solver record.
- Exceptions / failure mode: Symmetrising to halve storage silently satisfies "adjacency" for a pair that must actually be one-way-adjacent (a chute that only drops), so the plan looks compliant and the operation is broken. Report the count of `|W_ij − W_ji| > 0` pairs as a data-quality flag.

### FO-13 Name the flow types per building type before choosing what goes in W
- Rule: Declare which flows this building actually has and therefore which `W` entries exist. Hospitality BOH: guest luggage, soiled linen, clean linen, dry goods-in → kitchen → prepared → waste organics, staff entrance → every department, banqueting surge. Healthcare ward: patients, staff, clean supplies, soiled linen, waste, meals, medications, sharps — with a strict clean→dirty direction. Do not run a generic `Σ W·D` over pairs the building type does not have.
- Evidence: The building-type servicing logic and named flows already live in OM's per-type sections (`operations-maintenance.md` Hotels / Hospitals / Offices / Retail / Large public blocks, OM-01…OM-28) and hospitality ratios in HO-*; healthcare I-2 constraints in CODE-24 and separation in CODE-26. FO-13 consumes those named flows as the row/column set of `W`; it adds no operational rule.
- Source: This repo: `operations-maintenance.md` per-type sections, HO-*, CODE-24/CODE-26 — intra-repo. `hotel-operating-standards.md` laundry/BOH indices — intra-repo.
- Class: BUILDING-TYPE CONVENTION
- Scope: the four BOH-bearing types (hotel, hospital, office F&B, large public)
- Confidence: High for the flow inventory, Medium for cross-type transfer
- Grid translation: Instantiate the `W` skeleton from the type's flow list, each tagged with its FO-11 type-currency and FO-12 direction. A pair absent from the type's flow list stays `W_ij = 0` (absent), not `U` (relationship-only) — flow and relationship are different data (FO-14, AG-02).
- Exceptions / failure mode: Omitting the staff-entrance→everywhere rows (because staff movement is "not material handling") drops the largest real flow block in a hotel BOH; FO-10 says include the minute-based staff flows as first-class `W` entries.

### FO-14 Convert Muther's A/E/I/O/U/X grades to weights and prove the layout's sensitivity to the map
- Rule: The qualitative closeness scale `A` (absolutely necessary), `E` (especially important), `I` (important), `O` (ordinary), `U` (unimportant), `X` (undesirable) is *input data* — convert it to numbers only via an explicit, published weight map (this file fixes `A=5, E=4, I=3, O=2, U=1, X=0-or-penalised`), and always re-run the layout under a second scheme. If the placement flips, report the flip as the finding: the choice of numbers, not the solver, decided the plan.
- Evidence: Muther's Systematic Layout Planning names the A/E/I/O/U/X scale and the relationship/from-to charts it feeds (origin named here by title/URL; the numeric table could not be read this pass — the official PDF exceeded fetch limits). The corpus already grades closeness with an explicit forbidden grade and integer weights as AG-06, and warns that relationship *importance* must be ranked by measured consequence, not the client's adjective (AG-22) — FO-14 turns that grade into `W` and FO-15 audits the map.
- Source: Richard Muther & Associates, *Systematic Layout Planning* (SLP) https://richardmuther.com/wp-content/uploads/2016/07/Systematic-Layout-Planning-SLP-4th-edition-soft-copy.pdf — T2/T3 (title/URL from the search result list; numeric table NOT read, size-exceeded). This repo: AG-06 (graded closeness + integer weights), AG-22 — intra-repo. NEEDS VERIFICATION: Muther's exact per-letter numeric weights and the "A/E/I/O/U/X → number" convention he intends — open a page-extractable copy of SLP before quoting Muther's own weighting.
- Class: HEURISTIC (the map is a policy) / FACT (the arithmetic once fixed)
- Scope: plans built from a graded relationship chart
- Confidence: Medium
- Grid translation: Store the grade matrix as integers; emit the chosen `weight_map` in the run record. Re-score `TC` and `AARC` under ≥2 maps and report the rank change of the top-5 pairs (the flip test).
- Exceptions / failure mode: `X` is a *prohibition*, not "low weight 0" — setting `X=0` in the objective makes an undesirable pair free-to-adjacent; it must be a hard constraint (AG-11 threshold separation, CODE-26), never just a small `W`. See FO-27 (a hard rule outranks the objective).
### FO-15 Publish the weight-sensitivity band; the grade→number map is a policy choice, not a fact
- Rule: Three inputs to this problem are decisions dressed as data: the FO-14 grade→weight map, the FO-11 per-type currency rates, and the FO-10 peak-period choice. Re-solve under a small set of defensible variants of each and report the *band* of resulting layouts and cost, then name which variant flips the plan. A recommendation that holds only under one arbitrary weight map is reported as conditional, never as the optimum.
- Evidence: The corpus mandates exactly this for every derived quantity: prefer a decision over a criterion set and treat weights as policy (DM-01 decide against a criterion set), keep analysis/generation/evaluation separate, and it already carries a live open sequencing conflict between staff-walk alarm and minute-ledger (coverage-map §4 item 11, `OM-28` vs `HO-14`, reported-not-adjudicated) that a sensitivity band would surface rather than paper over.
- Source: This repo: DM-01, `coverage-map.md` §4 item 11, AG-22 — intra-repo. Arithmetic re-scoring requires no source.
- Class: STANDARD (reporting obligation) / HEURISTIC (the variant set)
- Scope: any flow layout offered as a recommendation
- Confidence: High
- Grid translation: Run the flow pass (FO-28) over the declared variant set `V` (≥2 weight maps × ≥2 rate collapses × peak vs average); emit `cost_band = [min,max] TC` and `flip_set` = pairs whose adjacency or order changes across `V`. The report line reads "optimal under map M2/peak only" when it is.
- Exceptions / failure mode: Exhausting variants is not analysis — bound `V` (≤ a handful, pre-declared). A "sensitivity study" that tried 40 maps after seeing the result and kept the flattering one is a post-hoc fit; declare `V` before solving (DM-02 set aspiration levels first).
### FO-16 Run CRAFT as adjacent-department pair exchange with a strict-improvement rule
- Rule: CRAFT improves a *given* layout by exchanging the locations of two departments and keeping the exchange only if it strictly reduces `TC = Σ W_ij·D_ij`. Candidate pairs are drawn from departments that are *adjacent* (an exchange of two far-apart rooms cannot help and distorts the plan), and in the classic equal-area formulation only equal-area pairs so the footprint is preserved; iterate until no adjacent pair-exchange lowers `TC`. The acceptance rule is "strictly better, adjacent, area-preserving" — that conjunction, not a generic hill-climb, is what makes it CRAFT.
- Evidence: CRAFT ("Computerized Relative Allocation of Facilities Technique", Buffa and colleagues, mid-1960s) is the canonical improvement-by-pairwise-exchange method and the adjacent-pair / cost-decrease rule is its standard description. This file could NOT open the primary text or a text-extractable account this pass (the reachable course/thesis PDFs returned image-encoded bodies or HTTP 403), so the rule is reconstructed at Medium confidence and flagged; it must not be quoted as a verbatim CRAFT clause.
- Source: NEEDS VERIFICATION — CRAFT's exact candidate-set and acceptance rule and its equal-area assumption: open Buffa, Armour & Elsner (1964), *Near-optimal approach to the design of facilities* (IEEE), and the CRAFT chapter of Tompkins, White, Bozer & Tanchoko, *Facilities Planning* — before presenting any clause as CRAFT's own wording. This repo: `layout-algorithms.md` LA-09 (define neighbourhood operators before the objective) — intra-repo.
- Class: HEURISTIC (method); the acceptance conjunction is FACT once fixed
- Scope: rectangular or near-rectangular departments on a fixed footprint
- Confidence: Medium (rule), Low (verbatim acceptance detail)
- Grid translation: Rooms are flood-fills (GT), so "adjacent" = the two rooms' door-tiles face a common corridor cell or share a boundary. Compute `ΔTC` only over pairs touching the two swapped departments (everything else is unchanged), accept `ΔTC < 0`. Enforce the tile-grid equal-area variant by allowing a swap only when `area_i ≈ area_j` within a declared tolerance, else use the area-preserving ratio exchange.
- Exceptions / failure mode: Unequal-area departments break the classic rule; forcing an unequal swap lets the room shapes change and `D` no longer describes the same plan — re-measure `D` on the new skeleton every accepted move (FO-27), do not hold the original matrix fixed.

### FO-17 Expect CRAFT to inherit its seed; multi-start and report the spread
- Rule: A single CRAFT run is one descent into the first local optimum reachable from one seed, so its result is seed-dependent and no global claim is licensed. Run it from several seeds (random, an ALDEP/CORELAP construction, and an intentionally poor layout), report the best, the median and the spread over runs, and state the number of starts. Do not call a lone CRAFT output "the layout".
- Evidence: Start-dependence and local optima are the textbook-acknowledged weaknesses of pairwise-exchange improvement; the corpus's own position is that annealing exists precisely to escape local optima by *accepting uphill moves* under a schedule (LA-20, LA-21) — the fact that improvement methods need escaping is why LA-* carries simulated annealing. This file states the symptom and the multi-start remedy; the escape mechanics belong to LA-20/LA-21.
- Source: This repo: `layout-algorithms.md` LA-20, LA-21 — intra-repo. NEEDS VERIFICATION: any numeric statement of CRAFT's local-optimum quality (e.g. a published "within x % of optimal" figure) — none is asserted here because none was opened; do not invent one.
- Class: HEURISTIC (multi-start) / STANDARD (report the spread)
- Scope: any improvement search
- Confidence: High
- Grid translation: Seeds = tile-placements; run CRAFT `N` times with distinct seeds (a seeded PRNG, GT-04-style dual record), emit `{best_TC, median_TC, spread, N_starts}`. Feed the top `k` seeds to annealing (LA-20) if a better optimum is needed.
- Exceptions / failure mode: Multi-start that keeps only the best and hides the spread reproduces the single-run fallacy; publish the distribution (SA-13/SA-28 vector-not-mean discipline).

### FO-18 Construct before you improve: ALDEP and CORELAP turn a chart into a seed
- Rule: When you have a graded relationship chart (FO-14) but no good starting layout, construct one. ALDEP places departments greedily to maximise the *closeness* satisfied (it builds from the A/E/I relationship weights and a rectangle-shaped cost, not the exact `Σ W·D`), CORELAP assigns the most-highly-related department first to each site in turn given each department's required area; then hand the constructed plan to CRAFT or annealing. Construction beats a random seed; construction + improvement beats either alone.
- Evidence: ALDEP and CORELAP are the two classical *construction* families (graph-based and correlation/area-based) that seed the improvement methods; their purpose relative to CRAFT is standard. Exact internal cost functions were NOT opened this pass, so this is a reconstructed, flagged description, not a quoted spec.
- Source: NEEDS VERIFICATION — ALDEP's cost function (closeness-based, not distance-based) and CORELAP's site-assignment rule: open the ALDEP/CORELAP descriptions in Tompkins et al. *Facilities Planning* or the original Seebold/Johnson (ALDEP) and Smith (CORELAP) sources before stating their cost terms as fact. This repo: LA-01 (choose generator family by input contract), AG-06/AG-07 — intra-repo.
- Class: HEURISTIC (construction method)
- Scope: chart-driven programmes with little/no flow volume, before any improvement pass
- Confidence: Medium (role), Low (internal cost detail)
- Grid translation: ALDEP/CORELAP consume the integer grade matrix (FO-14) and each department's tile area (TH-02 pays the wall tax); output a contiguous placement checked for zone contiguity (AG-07). Emit the constructed `TC` and `AARC` as the *seed's* score, then CRAFT/anneal.
- Exceptions / failure mode: ALDEP optimises a closeness score that is *not* the flow cost, so its "best" construction can have a worse `Σ W·D` than a distance-seeded layout — always re-measure `TC` on the ALDEP seed before trusting it (never compare ALDEP's own score to CRAFT's `TC`; different objectives).

### FO-19 Non-rectangular footprints need SPACE-family/BUCY or a raster solver, not forced rectangles
- Rule: When the buildable outline is irregular (a courtyard, an L-site, a stepped floor plate), the rectangular equal-area assumption of CRAFT and the box assumptions of ALDEP mis-model the space; use the SPACE family (partition-then-compose the real area) or BUCY (assign blocks to a given floor shape), or model placement directly on the tile raster with CP/SAT — and never pad the plan into a fake bounding rectangle to make the algorithm run.
- Evidence: The SPACE methods and BUCY exist as irregular-shape layout tools in the classical literature; and the corpus already provides the modern substitute — model every room as integer intervals on the actual raster (LA-13), all-different / permitted-pair tables for legal types (LA-16), and let the real outline be the boundary (GT-08 zones, AG-07 contiguity). This file names the classical family and hands the mechanism to LA-*.
- Source: This repo: LA-13, LA-16, AG-07, GT-08 — intra-repo. NEEDS VERIFICATION: the precise SPACE-BOX/SPACE-C and BUCY procedures (their partition/composition and block-assignment rules) — the primary papers were not openable this pass; treat "they handle irregular shapes" as confirmed and every operational detail as unverified until sourced.
- Class: HEURISTIC / BUILDING-TYPE CONVENTION (irregular plans)
- Scope: courtyards, L/U/T plans, multi-level podiums, heritage footprints
- Confidence: Low on the classical algorithms' internals, High that a raster CP/SAT model is the practical stand-in
- Grid translation: the tile raster already *is* the real outline (no bounding-box lie possible under GT); run the flow pass on the raster and let LA-13/LA-15 place rooms; report the `floor-plate utilisation` so a forced rectangle that would leave dead corners is rejected.
- Exceptions / failure mode: Padding to a rectangle inflates the `min_leg` and every `D`, quietly flattering the transport ratio (FO-05) — the bounding-box shortcut corrupts the objective, not just the geometry.

### FO-20 Hand the exact model to layout-algorithms.md; FO-* owns the objective and data, not the solver
- Rule: Once the flow data (`W`), the declared metric (`D`), the areas, and the adjacency/separation predicates exist, encode the layout as CP/SAT/MILP or annealing and let `layout-algorithms.md` supply the generator — the slicing tree, the CP/SAT interval model, the annealing move sets, the acceptance schedule. This file's job is the `Σ W·D` objective, the measures (FO-04…FO-09) and the report; restate no encoding.
- Evidence: The corpus draws this exact line: the v3 Y-domain (`layout-algorithms.md`) owns "the solvers: grammar derivations, slicing trees, CP/MILP encodings, annealing move sets and acceptance, selection-by-input-contract table" (coverage-map §3, row Y); soft relationships are reified to Booleans in the objective there (LA-15), shared resources modelled cumulative (LA-17), infeasibility diagnosed via unsat core (LA-18). FO-* feeds it data and reads back metrics.
- Source: This repo: `coverage-map.md` §3 row Y, LA-01, LA-10, LA-11, LA-13, LA-15, LA-17, LA-18, LA-20, LA-21 — intra-repo (the whole encoding contract lives there).
- Class: STANDARD (division of labour between FO and LA)
- Scope: any automated placement in this corpus
- Confidence: High
- Grid translation: Interface = `{W, D.metric, areas_tiles, hard_predicates(AG-24 buffers), soft_grades}` in; `{placements, TC, measures, violations}` out. Re-measure every returned metric on the as-built skeleton (FO-27), never trust the solver's internal `D`.
- Exceptions / failure mode: A solver that reports its own objective as the transport number while using a different (e.g. Euclidean) internal distance than the declared `D` — recompute `TC` externally from the placement (FO-02, FO-05) and diff against the solver's value; a mismatch is a metric-declaration bug, not noise.
### FO-21 State the QAP plainly: n! assignments, a super-exponential wall, and an honest ceiling
- Rule: The fixed-site flow problem is the Quadratic Assignment Problem — assign `n` facilities to `n` sites minimising `Σ_i Σ_j a_ij·b_π(i)π(j)`, with `a` the flow matrix and `b` the distance matrix. The solution set is `n!` assignments, growing faster than any exponential (Stirling: `n! ≈ (n/e)^n`), so full enumeration dies past a handful of departments. State that; report a *specific* largest-exact-`n` only if a source was read, otherwise give the qualitative wall and mark the number unverified. Never call a heuristic result "the QAP optimum".
- Evidence: The opened QAP formulation is `minimize Σ a_ij·t_ij` over a permutation `t`, attributed to Koopmans and Beckmann (1957), with TSP as a special case (Wikipedia, opened); the opened case study states directly that "as n increases beyond a small number, it becomes impossible to enumerate" the assignments (NEOS, opened). `n!` solutions and super-exponential growth are pure arithmetic (verifiable without a source, GT-03's standard).
- Source: Wikipedia *Quadratic assignment problem* — T4 (opened: objective, Koopmans–Beckmann origin, TSP special case). NEOS Guide *QAP* — T3/T4 (opened: enumeration wall). `n!`/Stirling — arithmetic. NEEDS VERIFICATION: the largest QAP solved to *proven* optimality and a practical exact ceiling (often quoted as n≈20–30 on QAPLIB families) — open Anstreicher's *A survey of the quadratic assignment problem* or the QAPLIB results page before publishing any specific `n`; the QAPLIB PDF was image-encoded this pass.
- Class: FACT (formulation + factorial count) / ENGINEERING CONSTRAINT (the wall)
- Scope: every exact treatment of the flow objective
- Confidence: High on the formulation and growth; Low on any specific exact-size number
- Grid translation: `n` = departments; `a_ij` = `W` (FO-10/FO-11); `b_ij` = `D` on the chosen skeleton metric (FO-02/FO-03). If `n! ≤` an agreed time budget (typically `n ≤ 10`), enumerate to get the exact `TC(minimum)` for FO-05's baseline; else route to FO-22. A directed `W` (FO-12) is the asymmetric QAP.
- Exceptions / failure mode: The apparent "one matrix is trivial" shortcut (rank-1 distance, or all-to-a-centre) collapses QAP to a linear assignment solvable in polynomial time — real floor distance is never rank-1, so do not assume the collapse.

### FO-22 Past the ceiling: construct, improve, and report the bound you could not close
- Rule: When `n` exceeds the exact ceiling, deliver three numbers, not one: the best-found `TC`, a valid *lower bound* on `TC(minimum)`, and the resulting optimality gap `gap = (TC_best − LB)/LB`. Use an FO-18 construction seed and an FO-16 CRAFT or LA-20 annealing improvement, and publish the solver status verbatim (`FEASIBLE` is not `OPTIMAL`). A plan presented without its gap hides how far from optimal it might be.
- Evidence: The corpus's standing rule is to report solver status literally and to treat `INFEASIBLE` as a proof and `FEASIBLE` as a mere candidate (LA-19), and to publish the residual with any fitted number (SA-10 reports the regression with error bars). The lower bound closes the FO-05 baseline the transport ratio needs even when the exact optimum is unreachable.
- Source: This repo: LA-19, SA-10, LA-20, LA-21 — intra-repo. NEEDS VERIFICATION: which QAP lower bound to compute (Gilmore–Gomory vs an LP/spectral bound) and its cost — a bound was not opened this pass; until sourced, the trivial `min_leg·ΣW` bound (FO-05, Worked section) is the only one this file asserts.
- Class: STANDARD (the gap is mandatory) / HEURISTIC (the search combo)
- Scope: any `n` past the enumeration budget
- Confidence: High (reporting) / Medium (that construction+improvement lands near-optimal)
- Grid translation: Emit `{TC_best, LB, optimality_gap_pct, status ∈ {OPTIMAL, FEASIBLE, UNKNOWN}, method}`. Re-measure `TC_best` on the as-built skeleton (FO-27) — the gap must be computed on a distance the building actually offers.
- Exceptions / failure mode: A wide gap reported honestly beats a false "optimal"; but if `LB` comes from a weaker bound than another candidate's, the two ratios are not comparable across studies — always publish the bound method (FO-05) so gaps can be compared.

### FO-23 Multi-floor layout is floor assignment plus intra-floor QAP; the lift enters D as a portal
- Rule: Do not solve a multi-floor facility as one big planar QAP. Split it: assign departments to floors first, then lay out each floor. Vertical movement enters the distance matrix through *portal edges*, not a straight-line `z` gap: `D_ij(cross-floor)` = intra-floor path to the serving portal + a portal traversal cost (queue + ride friction) + intra-floor path on the far floor. For the flagship hotel case that means the BOH (laundry, kitchen, dry stores, housekeeping) is a floor-assignment problem before it is a tile problem.
- Evidence: The corpus already models the building as one multi-floor graph in which vertical edges are queues, not links (AG-16), extends every metric across floors through portal edges with a declared friction cost (SA-23), converts lift cars into portals and hands off stacking (VT-11), sizes cars by traffic not headcount (VT-01…VT-19), caps the housekeeping office walk from the vertical portal (OM-14), and treats a service lift as a goods portal that must swallow the largest object (OM-15); vertical links are portal objects, not tiles (GT datum). FO-23 adds only the `D`-matrix treatment and the assignment split.
- Source: This repo: AG-16, SA-23, VT-11, VT-05, OM-14, OM-15, GT-16 — intra-repo. NEEDS VERIFICATION: any formal "multi-floor QAP" (MFQAP) result or lift-in-distance theorem — no MFQAP paper was opened; do not cite one, use the portal-edge construction above.
- Class: STANDARD / BUILDING-TYPE CONVENTION (multi-floor, hospitality flagship)
- Scope: every multi-floor facility
- Confidence: High on the split and the portal treatment; the exact per-portal friction is VT's output
- Grid translation: The tile grid has no vertical tiles (vertical links are portal objects, GT); build `D` on a graph whose inter-floor edges carry `friction = VT-derived seconds × the FO-02 time metric` or a declared tile-equivalent penalty. Solve floor assignment as an integer program over portal capacity, then run FO-28 per floor.
- Exceptions / failure mode: Stacking two heavily-linked departments on one floor (dry stores over kitchen) can beat *any* lift — the floor assignment, not the intra-floor QAP, is where the vertical win lives; a per-floor-only optimiser will never find it.

### FO-24 Flow importance equals flow volume only as an assumption; test every low-volume, high-consequence pair
- Rule: The classical objective's premise that "how important a link is = how much flows over it" is an assumption. Some links carry tiny volume but outsized consequence — a single contamination or infection-control path, a hazardous-waste route, a rare-but-catastrophic move, an emergency connection. Do not let a small `W_ij` demote such a pair: route it to a hard constraint (FO-27, e.g. hygiene separation CODE-24/26) or to a *declared* consequence-weighted `W`, never to an implicit average.
- Evidence: The corpus refuses the adjective/volume proxy outright — rank relationship importance by measured consequence, not by count (AG-22), and keep separation as a distinct predicate from distance (AG-02). The soiled-vs-clean hold is placed for *hygiene*, not flow rate (OM-08); egress is sized by occupant load regardless of daily flow (CODE-01…CODE-07). FO-24 imports the volume-vs-consequence critique to the flow matrix.
- Source: This repo: AG-22, AG-02, OM-08, CODE-24/CODE-26 — intra-repo. The critique itself is standard FLO commentary; specific published statements of "flow importance = volume is contested" were not opened this pass — flagged.
- Class: HEURISTIC (a warning) / STANDARD (route consequence to constraints)
- Scope: every flow matrix, healthcare and hazardous-heavy
- Confidence: High that volume ≠ consequence; Medium on any universal fix
- Grid translation: For each pair store `{w_volume, w_consequence}`; if `w_volume` is low but `w_consequence` is high, set `W_ij = 0` in `Σ W·D` and add a hard adjacency/separation predicate (AG-24 buffers) instead — the pair must not be optimised, only satisfied or violated.
- Exceptions / failure mode: Folding consequence into `W` (raising the number to "make it matter") smuggles a hard rule into a soft objective the solver can trade away (FO-27). Keep them in separate fields.

### FO-25 A paper's optimum is not a practice recommendation; publish the gap
- Rule: Report any optimised layout as a *decision-support candidate* with its provenance, not "the solution". Three gaps are structural and must be named: (1) `W` in practice is often estimated or missing (FO-10 basis tags), so the "optimum" optimises a fiction; (2) the model is static while operations change (season, refurbishment, demand shift), so the optimum is dated; (3) the distances optimised may not be the distances built (FO-27). Ship each recommendation with the data-quality tier and the change horizon it is valid for.
- Evidence: The corpus treats predictive/optimised claims as labelled: attach the published criticism to every predictive use (SA-11), publish quantisation and approximation bands with the verdict (CA-09), and carry provenance for anything external (CA-21); the evidence-strength accounting in `coverage-map.md` §5 is exactly this — a rule's `Class` and `Confidence`, not its count, carry its weight. FO-25 imports the discipline to flow output.
- Source: This repo: SA-11, CA-09, CA-21, `coverage-map.md` §5, UN-* uncertainty — intra-repo. The FLO→practice gap is a recurring survey finding; no specific survey was openable this pass, so cite the observation as a general limitation, not as a quoted statistic.
- Class: STANDARD (recommendation must be labelled a candidate)
- Scope: every FO-* deliverable
- Confidence: High
- Grid translation: The report block (FO-28) carries `W_provenance ∈ {measured, estimated, borrowed}`, `validity_horizon`, and `as_built_distance_check: pass|fail`; a `fail` on the last downgrades the whole recommendation regardless of `transport_ratio`.
- Exceptions / failure mode: The opposite error — discarding flow optimisation because the data is imperfect — loses cheap, reproducible evidence about the dominant cost leg (FO-09). Use it, with the label.
### FO-26 Forbid cost-only department splitting into islands, and charge dead-heading
- Rule: Reject any layout that lowers `TC` by scattering one department across disconnected pockets each sitting beside a different high-flow partner. A department is exactly one 4-connected region (GT/AG-07); contiguity is a hard constraint, not a preference the objective may trade. And charge empty return legs: a one-way flow (FO-12) still moves a trolley, a lift, or a person back — `TC` must count the dead-heading distance (model a round trip, or a vehicle that returns laden-to-empty), or the route is under-priced and "adjacent" becomes an artefact of ignoring the way back.
- Evidence: Sliver/fragment geometry is already barred (GT-11: minimum 2 tiles short side, 6 interior tiles) and zone contiguity is verified in tiles (AG-07); a split department breaks every per-room measure (SA-12 flow, AG-19 graph fidelity) and the twin-detection precondition (AG-20). Dead-heading follows directly from directed flow (FO-12) and the carry-distance currency (OM-07 cap to the waste store, OM-28).
- Source: This repo: GT-11, AG-07, AG-19, AG-20, FO-12, OM-07/OM-28 — intra-repo.
- Class: ENGINEERING CONSTRAINT (contiguity) / STANDARD (dead-heading cost)
- Scope: any optimiser that can split a room or ignore direction
- Confidence: High
- Grid translation: Assert `rooms(dept) == 1` flood-fill after every accepted move (FO-16/FO-20); for directed pairs add the empty-return to `W` (`W_ij += λ · empty_return_share`) with `λ` published, or set `D` to round-trip length. Report `split_departments` and `dead_head_metres_per_day` as named violations.
- Exceptions / failure mode: A legitimately distributed function (satellite waste holds, OM-08/OM-13 recessed storage on the route) is *not* an island — it is several small departments; only model it as one department if it truly must be contiguous, else split it in the programme first.

### FO-27 A hard rule outranks the objective; optimise only against distances you actually built
- Rule: Two inversions to forbid. (1) Egress, fire separation, hygiene and accessibility minima (CODE-*, FQ-*, AX-*) are *constraints*, never terms in `Σ W·D`; a flow-optimal plan that breaks one is invalid, not good — apply them before and after placement and report `flow_violations` as hard failures alongside, never folded into, the cost. (2) Only optimise against the distances of the as-built plan: recompute `D` from the *resulting* skeleton after placement (FO-03) and reject any candidate whose pre-optimised `D` diverges from built `D` beyond a declared band — a solver that used straight-line `D` across walls a corridor must bend around optimised a fiction.
- Evidence: This file's own boundary states that a flow-optimal plan failing FQ/CODE is invalid, not good. Distance fidelity is measured by `detour_index = L_actual / L_octile ≥ 1` (SA-13) and graph-fidelity check (AG-19); separation and thresholds are hard predicates (AG-02, AG-11, AG-24 buffers), which the objective must not absorb.
- Source: This repo: AG-02/AG-11/AG-24, SA-13, AG-19, CODE-01…CODE-28, FQ-* — intra-repo, plus this file's header boundary. The "objective must not trade a code minimum" is a compliance rule the corpus owns elsewhere (CA-*), not re-argued here.
- Class: CODE REQUIREMENT (constraints precede cost) / ENGINEERING CONSTRAINT (as-built distance)
- Scope: every flow optimisation
- Confidence: High
- Grid translation: Run FO-28 step 5 gated by an AG-24 separation/egress check; emit `flow_violations: [{pair, rule_id, kind ∈ {egress, separation, hygiene, access}, severity}]`. After placement re-run the A*/skeleton `D` and compute `distance_drift = max|D_built − D_optimised|`; if `> band`, mark the plan `NOT_BUILT_TRUTH` and do not publish its `transport_ratio` as achieved.
- Exceptions / failure mode: The commonest failure is a beautiful `transport_ratio` obtained by placing the heavy-flow pair where an egress path or a rated enclosure must be — the ratio hides it because egress has no `W` entry (FO-24); the hard-check-first ordering is the only guard.

### FO-28 Run the six-step flow pass and emit the flow metric keys
- Rule: The reusable procedure for any flow layout, in order: (1) build `W` from operations data, one currency, directed (FO-10…FO-13); (2) pick and freeze the distance metric (FO-02); (3) build the circulation skeleton and vertical portals (FO-03, FO-23); (4) establish the minimum baseline — enumerate if `n ≲ 10`, else a bound (FO-05, FO-21, FO-22); (5) place/optimise with hard rules and contiguity enforced first (FO-16…FO-22, encode via FO-20; FO-26, FO-27); (6) report the measures and the violations. Emit the keys `transport_ratio`, `aarc`, `avrc`, `cost_per_trip_tile`, `flow_violations` (plus `optimality_gap`, `W_provenance`, `distance_drift`) in the plan's report block.
- Evidence: Composes this file's rules; the key discipline mirrors the corpus's standing reporting form — express load as separate named ratios, never one blended index (OM-24), ship an evidence record per verdict (CA-05), and put measures in the diff table against a baseline (VA-18). The `1 tile = 0.5 m` datum and octile distance are the shared grid contract (GT-01).
- Source: This repo: OM-24, CA-05, VA-18, GT-01, and FO-02…FO-27 above — intra-repo.
- Class: STANDARD (the pass and its keys)
- Scope: any facility layout on the host grid
- Confidence: High
- Grid translation: One run produces `{W(metric,directed), D.metric, skeleton_portals, baseline{method,value}, placements, measures{transport_ratio,aarc,avrc,cost_per_trip_tile,flow_similarity_rho}, violations[], gap, provenance}`. `cost_per_trip_tile` is in trip-tiles ÷ trips; × 0.5 for trip-metres. Every number keys to the declared metric so revisions are comparable (FO-02).
- Exceptions / failure mode: Steps 4 and 6 are the ones skipped under time pressure; a flow pass that reports placements but no baseline and no violations is not this pass — publish it as `partial`, with the two missing fields named.
## Objective and measure catalogue

The single objective is `TC = Σ W_ij·D_ij` (FO-01; directed sum over `i≠j` when FO-12 applies). Every reported number is derived from it and each has a blind spot the others cover — the rule is to publish the set, never one of them (SA-28, OM-24).

| Measure | Formula | Unit | Blind to (must not be used alone) | Rule |
|---|---|---|---|---|
| Total transport cost | `Σ_{i<j} W_ij·D_ij` | trip-metres/day (×0.5 from trip-tiles) | absolute scale; grows with `n` and demand | FO-04 |
| Cost per trip | `TC / total_trips_per_day` | currency or metres per trip | concentration — hides the one dominant leg | FO-04, FO-09 |
| Transport ratio | `TC_achieved / TC_minimum` | ratio ≥ 1 | the baseline method; inflated by a weak lower bound | FO-05 |
| AARC (adjacency achieved) | `adjPosWeight / allPosWeight` | 0–1 | distance magnitude; monotone in edges added (inflation) | FO-06, FO-08 |
| AVRC (adjacency avoided) | `avoidedNegWeight / allNegWeight` | 0–1 | only the negatives; ignores positive cost | FO-06 |
| Flow similarity | `spearman(W, D)` (expect ≤ −0.4) | −1..1 | magnitude; the top-cost pair | FO-07 |
| Weighted adjacency coverage | `adjWeight(top-q flows) / top-q weight` | 0–1 | cost of everything below the cut | FO-07 |
| Optimality gap | `(TC_best − LB) / LB` | % | requires a valid bound; not comparable across bound types | FO-22 |
| Flow violations | hard-rule failures, listed | list | not a scalar — reported separately from cost | FO-27 |

## Solver comparison table

Classical families named and *behaviourally* characterised; encodings are owned by `layout-algorithms.md` and cross-referenced, never re-derived (FO-20, coverage-map §3 row Y). "Objective handled" distinguishes distance-cost methods from closeness methods — a critical, often-hidden mismatch (FO-18).

| Solver | Family | Input contract | Objective it optimises | Guarantee | Trap / limitation | Rule / xref |
|---|---|---|---|---|---|---|
| Exact QAP (enumerate) | exact | `n ≲ 10`, `W`, `D` | `Σ W·D` | proven optimum | dies at `n!` | FO-21 |
| CRAFT | improvement | a rectangular seed layout | `Σ W·D` | none (local opt) | seed-dependent; equal-area/rect assumption | FO-16, FO-17 |
| ALDEP | construction | grade chart only | a **closeness** score (not distance) | none | its cost ≠ `Σ W·D`; re-measure | FO-18 |
| CORELAP | construction | grades + areas | correlation/relatedness of adjacencies | none | ignores exact `D` | FO-18 |
| SPACE-C / FLADE | construction | real (irregular) outline + grades | space-filling of the actual area | none | internals unretrieved (NV) | FO-19 |
| BUCY | construction | floor shape + blocks | block-assignment fit | none | internals unretrieved (NV) | FO-19 |
| CP / SAT / MILP | exact model | full contract (predicates, area, buffers) | encodes `Σ W·D` **and** hard rules | OPTIMAL or INFEASIBLE (a proof) | model size / symmetry | FO-20 → LA-10/13/15 |
| Simulated annealing | metaheuristic | objective only | `Σ W·D` | none (certifies nothing) | schedule + seed dependent | FO-20 → LA-20/21 |
| This file's default | hybrid | all of the above | `Σ W·D` | report gap vs bound | must gate hard rules first | FO-22, FO-27, FO-28 |

Position vs modern methods: CRAFT/ALDEP/CORELAP predate and are *subsumed* by CP/SAT and annealing — construct (ALDEP/CORELAP) then improve (CRAFT) is a cheap heuristic for exactly what a CP/SAT model encodes with a proof, and annealing (LA-20/LA-21) exists to escape the local optima CRAFT cannot. FO-* does not re-derive any of those.

## Worked BOH flow example

A hotel back-of-house, six departments — **S** staff entrance, **K** kitchen, **L** laundry, **H** housekeeping, **D** dry stores, **W** waste — on a 2×3 grid of department cells, cell centres on a 16-tile (8 m) pitch: `A1(8,8) A2(24,8) A3(40,8) / B1(8,24) B2(24,24) B3(40,24)`. Coordinates are tiles; `1 tile = 0.5 m`.

Flow matrix `W` (trips/day, symmetric base; the real BOH is directed — see the note at the end; `ΣW = 970`):

| pair | W | pair | W | pair | W | pair | W |
|---|---|---|---|---|---|---|---|
| K–D | 200 | S–H | 90 | H–W | 45 | K–L | 15 |
| L–H | 150 | S–D | 70 | H–D | 30 | L–W | 10 |
| S–K | 120 | S–L | 60 | K–H | 25 | D–W | 5 |
| K–W | 90 | S–W | 20 | L–D | 40 | | |

Two candidate arrangements under two distance metrics (cost in trip-tiles/day; ×0.5 for trip-metres/day):

| arrangement | S | K | L | H | D | W | `TC` rect | `TC` Euclid |
|---|---|---|---|---|---|---|---|---|
| Arr-1 | A1 | A3 | B3 | B1 | A2 | B2 | 25 440 | 22 713.8 |
| Arr-5 | A1 | B2 | B1 | A2 | A3 | B3 | 26 960 | 21 399.4 |
| Arr-2 | A2 | A3 | B1 | B2 | B3 | A1 | **21 440** | **19 321.0** |

**The metric changes the optimum (FO-02).** Between Arr-1 and Arr-5 the winner flips: under **rectilinear** `Arr-1 (25 440) < Arr-5 (26 960)`, but under **Euclidean** `Arr-5 (21 399.4) < Arr-1 (22 713.8)`. Same `W`, opposite verdict — Arr-5 parks the three heaviest flows (K–D 200, L–H 150, S–K 120) on diagonal cells, which rectilinear charges at the full 32-tile Manhattan sum and Euclidean discounts to 22.63 tiles; a metric that ignores the walls flatters it.

**Transport ratio (FO-05, FO-21).** The trivial lower bound `min_leg·ΣW = 16 × 970 = 15 520` trip-tiles (every pair at one bay — an unattainable optimism, which is the point). Ratios: `Arr-1 1.639`, `Arr-5 1.737`, `Arr-2 1.381`. The true minimum over all `6! = 720` assignments is computable here by enumeration (n≤10, FO-21), so these ratios are against a *bound*, not the exact minimum, and are inflated toward 1 accordingly (FO-22).

**AARC / AVRC for Arr-2 (FO-06/FO-14).** Grade map `A=5,E=4,I=3,O=2,U=1,X=0/negative`: A = K–D, L–H; E = S–K, K–W; I = S–H, S–D, L–D, H–W; O = S–L, H–D, K–H; X = D–W (dry food beside waste — forbidden). Arr-2's adjacent pairs are `{S–W, S–K, L–W, S–H, K–D, L–H, H–D}`. Positive-weight total = 36; adjacent positive = K–D5 + L–H5 + S–K4 + S–H3 + H–D2 = 19, so **AARC = 19/36 = 0.53**. The single X pair D–W (A1–B3 = 48 tiles) is not adjacent, so **AVRC = 1.0** (no hygiene adjacency violated). Top-80 %-flow-weight coverage (pairs summing ≥ 776): `weighted_adjacency_coverage = 560/780 ≈ 0.72`.

**What the measures cannot see (FO-07, FO-08, FO-24, FO-25, FO-27).** Arr-2 has the best ratios, yet: (a) the kitchen→waste organics route (K–W = 90/day) sits 32 tiles / 16 m apart — the *cost* counts it, the *odour/hygiene consequence* does not appear in `W` at all (FO-24); (b) the transport ratios all hover "near 1.4" purely because the baseline is a weak trivial bound (FO-05/FO-22); (c) `AARC` rose only to 0.53 and could be pushed higher trivially by adding adjacencies without cutting distance (FO-08 inflation); (d) `W` here is symmetric and invented for the demo — a real BOH has dead-heading on returns (FO-26) and the whole `W` is `basis: estimated`, so this is a candidate, not a recommendation (FO-25); (e) none of the measures penalise placing the heavy K–D pair where a rated service separation (CODE-26) must stand — only the FO-27 hard check catches that.

## Sources

Open this pass and quoted:
- Wikipedia, *Quadratic assignment problem* https://en.wikipedia.org/wiki/Quadratic_assignment_problem — **T4** (objective `minimize Σ a_ij·t_ij`, Koopmans–Beckmann origin, TSP special case).
- NEOS Guide, *Quadratic Assignment Problem* https://neos-guide.org/case-studies/sc/la/qap/ — **T3/T4** ("impossible to enumerate" past a small n; 1957 attribution).

Named in-domain primaries that were **NOT read** (image-encoded PDF, size-exceeded, or 403 — treated as `NEEDS VERIFICATION`, cited for existence only, no numbers taken from them):
- Richard Muther & Associates, *Systematic Layout Planning* (SLP) https://richardmuther.com/wp-content/uploads/2016/07/Systematic-Layout-Planning-SLP-4th-edition-soft-copy.pdf — T2/T3 (name of A/E/I/O/U/X scale; numeric table unread).
- QAPLIB, Burkard et al. http://coral.ie.lehigh.edu/wp-content/uploads/2014/07/qaplib.pdf — T2 (body undecodable binary).
- Buffa, Armour & Elsner (1964) CRAFT; Tompkins, White, Bozer & Tanchoko, *Facilities Planning*; Smith CORELAP; Seebold/Johnson ALDEP; Lee & Moore SPACE-C — T2/T3, reached only through search-result listings, bodies unread.
- Course/thesis PDFs at `ie302.cankaya.edu.tr`, `users.encs.concordia.ca/~andrea/indu421`, `researchrepository.wvu.edu`, `nowpublishers.com`, `googlegroups.com` — all image-encoded or 403 this pass.

Arithmetic asserted without an external source (verifiable on inspection, per GT-03's precedent): `Σ W·D`; rectilinear vs Euclidean vs octile distance; `n!` assignments and Stirling super-exponential growth; ratio monotonicity (FO-08); every figure in the Worked section (hand-computed above).

Intra-repo (this corpus, no external URL — the cited rule carries the evidence): `adjacency-graphs.md` AG-02/04/05/06/07/09/11/16/19/20/22/24; `spatial-analytics.md` SA-03/10/11/12/13/23/28; `operations-maintenance.md` OM-07/08/14/15/16/24/27/28; `layout-algorithms.md` LA-01/09/10/11/13/15/17/18/19/20/21; `vertical-transport.md` VT-01/02/05/11/19; `grid-translation.md` GT-01/04/08/11/16/23; `building-codes.md` CODE-01/24/26; `fire-safety-quantification.md` FQ-*; `accessibility-usability-sequencing.md` AX-*; `decision-making.md` DM-01/02; `compliance-as-code.md` CA-05/09/12/21; `hotel-operating-standards.md` HO-*; `coverage-map.md` §3/§4/§5; this file's header boundary.

## Weak or contested

- **Flow importance = flow volume** is the objective's founding assumption and is false for low-volume/high-consequence links; the honest handling is FO-24 (route to constraints), but no opened source states the critique as a quotable finding — asserted as domain commentary.
- **Transport ratio is baseline-sensitive.** The Worked example's ratios are against the *trivial* lower bound and are therefore inflated toward 1; a reader must not compare a ratio built on a different bound type (FO-05/FO-22). Which QAP lower bound to prefer (Gilmore–Gomory vs LP/spectral) is `NEEDS VERIFICATION`.
- **AARC/AVRC attribution is unverified.** The formulae are defined here (as SA-07 defines its isovist set); the canonical definition/normalisation and a Francis/Severitz origin were not opened. Do not quote them as authored measures until sourced.
- **Classical-solver internals are reconstructions, not quotations.** CRAFT's exact candidate-set/acceptance rule, ALDEP's cost function, CORELAP's site rule, and the SPACE-C/FLADE/BUCY procedures are stated at Low–Medium confidence and flagged; the reachable PDFs were unreadable this pass (same binary-stream blocker SA-07 reports). Verify against Buffa 1964 and Tompkins et al. *Facilities Planning* before elevating any of them.
- **QAP exact ceiling is unquoted.** Only `n!` growth and the "beyond a small n impossible to enumerate" wall are asserted; no specific largest-solved `n` is claimed because none was read (`NEEDS VERIFICATION`).
- **Multi-floor QAP is described, not cited.** The floor-assignment/portal-edge construction is this file's; no MFQAP theorem is quoted (FO-23).
- **The Worked example uses a symmetric, invented `W`** for tractability; a real BOH is directed with dead-heading (FO-12, FO-26), so the arrangement ranking is illustrative of the method, not a recommendation.

## Type-specificity audit

- **Universal (building-type-free):** the objective and its measures — FO-01, FO-02, FO-03, FO-04, FO-05, FO-06, FO-07, FO-08, FO-09, FO-11, FO-15, FO-21, FO-22, FO-26, FO-27, FO-28. These hold for a warehouse, a hospital or a hotel BOH alike.
- **Building-type conventions:** FO-13 (the flow inventory differs hotel BOH vs hospital clean/dirty vs office F&B), FO-12/FO-24 (the clean→dirty direction and hygiene-consequence pairs dominate healthcare and hospitality), FO-23 (multi-floor floor-assignment is the *flagship hotel* shape), FO-19 (irregular footprints concentrate in podium/hospital/museum plans). The Worked section is hotel-BOH-specific in *values* but the arithmetic is type-neutral.
- **Scale- and data-dependent bands:** what counts as a "good" `transport_ratio`, `AARC` or coverage is not fixed here — a 6-department BOH and a 40-department hospital sit in different bands, and the catalogue deliberately publishes the *formulae and blind spots*, leaving interpretation bands to each project's declared baseline (FO-05) and the type's operations data (FO-10, HO-*). No universal threshold is asserted because none was sourced.
- **Corpus dependency:** FO-* is only computable because `layout-algorithms.md` supplies the generator (FO-20) and `vertical-transport.md`/`operations-maintenance.md` supply the portal friction and flow rates (FO-23, FO-10); stripped of those, the measures can still be *reported* on a hand-drawn plan but not *optimised*.
