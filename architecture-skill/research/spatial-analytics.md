# Research file — Domain Z: Quantitative spatial analytics (measuring a layout instead of eyeballing it)

Scope: the computable layer only — what each spatial metric *is* as a formula, which algorithm produces it on a tile grid, what band makes the number mean something, and which design failure the band detects. The qualitative rules these numbers serve are owned elsewhere and are not restated here: `architecture-theory.md` TH-11 (fewer/wider routes), TH-14 (desire lines), TH-19 (decision points), TH-20 (integration ranking); `adjacency-graphs.md` AG-09 (weighted path cost), AG-10 (connectivity/depth/mean depth/integration/RRA), AG-11 (threshold depth), AG-12 (edge capacity and min-cut), AG-13 (cut vertices and bridges), AG-14 (circuit rank and ringness), AG-15 (per-role graphs), AG-16 (vertical edges as queues), AG-23 (legible skeleton); `human-behavior.md` HB-01–HB-03 (LOS bands, flow per width, density-speed knee), HB-06 (decision-point cap), HB-08 (sparse public network), HB-09 (destination in view), HB-17/HB-18 (proxemic sightline, supervision), HB-25 (publicness in the route hierarchy); `floor-plans.md` FP-22 (circulation quality), `multi-scale.md` MS-23/MS-24 (portal queues, measured vertical connectivity), `validation.md` VA-03/VA-15/VA-18 (three-valued verdicts, simulated trips, diff table), `site-context.md` (site desire lines, edge intensity). Boundary rule: this file never re-argues *whether* integration should drive placement (TH-20) — it supplies the formula, the normalisation, the rank test and the published error bars, and it is the only file that computes visibility, perceptual and site quantities. Where a claim is contested, the controversy is inside the rule, not in a footnote.

Host grid, unchanged from `adjacency-graphs.md`: `1 tile = 0.5 m`; tile states `walkable | blocked | door`; rooms are 4-connected flood-fills; movement is octile A* (cardinal 1, diagonal √2, diagonal only when both corner neighbours are open); `1 ha = 40 000 m² = 160 000 tiles`; `1 km = 2 000 tiles`; speed conversion `v m/s = 2v tiles/s`.

---

## Rules

### SA-01 Fix the spatial representation before choosing any metric
- Rule: Declare, in the design record, which representation every reported number is computed on: `convex` (maximal mutually-visible polygons = rooms), `axial` (maximal straight sight-lines), `segment` (axial lines cut at every intersection), `dual-tile` (the 0.5 m walkable grid), or `vga` (continuous visibility classes). A metric value with no declared representation is not a result — publish it as `unknown` (VA-03).
- Evidence: Space syntax distinguishes the representations by what they encode: axial spaces are straight sight-lines, convex spaces are polygons in which all interior points are mutually visible, isovists are the visible viewshed of a point, and visibility graphs convert isovist data into a graph used for intervisibility and movement forecasting (opened this pass). The room-graph comparison table already in `bim-cad.md` assigns isovists/continuous visibility/angular choice to the visual layer and door-count depth to the dual-tile layer — same split, different file.
- Source: Wikipedia, *Space syntax* https://en.wikipedia.org/wiki/Space_syntax — T4 (definitions and criticisms; opened). Wikipedia, *Isovist* https://en.wikipedia.org/wiki/Isovist — T4 (opened). This repo: `bim-cad.md` representation table, `adjacency-graphs.md` AG-01.
- Class: STANDARD (record-keeping convention)
- Scope: universal
- Confidence: High
- Grid translation: Emit `representation ∈ {convex, axial, segment, dual-tile, vga}` in every metric record. Default on this host: `convex` for room-level claims (the plan *is* rooms), `dual-tile` for egress/capacity claims, `vga` for sightline claims. Never mix: a number computed on `axial` and compared to a `convex` band is a category error.
- Exceptions / failure mode: Axial maps reward long straight geometry — a documented criticism of the representation itself (T4, opened) — so axial numbers on a hotel floor with one 30 m corridor will overstate that corridor's importance; that is a representation artefact, not a finding.

### SA-02 Derive convex spaces and axial lines with named algorithms and publish the residual
- Rule: Generate convex spaces as maximal rectangles of free tiles (rectilinear plans), merged until no two neighbours union to a larger rectangle. Generate axial lines greedily: enumerate maximal sight-lines, repeatedly take the line crossing the most yet-uncovered lines, stop when every line is touched; publish `lines_used`, `uncovered_lines` and `maximal_line_count` so the reader can see how arbitrary the cover is.
- Evidence: Automated axial-map generation is a recognised problem with published attempts (Penn, Hillier, Banerjee & Xu, cited in this repo's `bim-cad.md` as "automating axial map generation", volume/pages unverified); the "maximum line" cover is order-dependent, and the axial approach carries published internal criticism (T4, opened).
- Source: `bim-cad.md` BIM-20 citation set (title-only) — T3/T4; Wikipedia *Space syntax* — T4 (opened). NEEDS VERIFICATION: the exact Penn et al. 1997 venue/pages, and any published maximum-line-cover optimality claim — check the paper itself before quoting "automated axial maps are reproducible".
- Class: HEURISTIC (procedure is FACT; the cover's order-dependence is the acknowledged weakness)
- Scope: rectilinear plans (all of this host's plans)
- Confidence: High for the rectangle decomposition; Low for axial reproducibility
- Grid translation: Maximal rectangles: for each free tile run the standard histogram/height-array scan (O(W·H) amortised over the floor) and keep only non-dominated rectangles; axial lines: cast rays along the 4 cardinal and 4 diagonal supercover directions plus every occluder-vertex pair, merge collinear overlaps, then greedy-cover. Report `n_convex`, `n_axial`, `residual_lines`.
- Exceptions / failure mode: Non-rectilinear or furniture-blocked plans blow up the maximal-rectangle count; if `n_convex > 3 × rooms`, the metric is describing furniture, not space — re-declare the obstacle layer.

### SA-03 State which of the three "integration" numbers is meant, and normalise only across sizes
- Rule: Publish the raw chain explicitly: `deg(v)`, `D(v) = Σ_u d(v,u)`, `ℓ(v) = D(v)/(N−1)`, then either `integration_raw = 1/ℓ` (within-plan ranking) or the size-normalised form `RRA(v) = 2(ℓ_v − 1)/(D_N(N − 2))` with `D_N = 2[N(log₂((N+2)/3) − 1) + 1]/((N−1)(N−2))` (cross-plan comparison). Never present `1/RRA` next to someone else's `1/ℓ` without saying so.
- Evidence: Formulas taken verbatim from an opened peer-reviewed source reproducing the space-syntax set: connectivity `deg(i) = Σ_j (A_𝔊)_ij` (Eq. 4), `𝔇_i = Σ_j d_ij` (Eq. 2), `ℓ_i = 𝔇_i/(N−1)` (Eq. 3), `RRA(i) = 2(ℓ_i − 1)/(D_N(N − 2))` (Eq. 5) with the `D_N` above (Eq. 6); depth quoted as "the least number of syntactic steps needed to reach one node from the other", attributed there to Klarqvist, "A Space Syntax Glossary", *Nordisk Arkitekturforskning* 2 (1993). The same source does **not** define integration as the reciprocal of RRA, so `1/RRA` is a convention, not a citation.
- Source: Volchenkov & Blanchard, "Scaling and Universality in City Space Syntax", arXiv:0709.4375v1 https://arxiv.org/html/0709.4375v1 — T2 (opened; Eqs 2–6 quoted). Klarqvist 1993 — T2/T3, reached only through that reference list, not read. This repo: AG-10 uses the identical Eqs 5–6.
- Class: FACT (arithmetic) / STANDARD (reporting convention)
- Scope: any connected graph, `N ≥ 3`
- Confidence: High
- Grid translation: BFS from every node → distance matrix (O(N³) naive, fine at N ≤ 200; use the corridor skeleton, not tiles). Computed normalisation constants (arithmetic from Eq. 6): `D_N = 0.3396 (N=7), 0.2755 (N=13), 0.2002 (N=25), 0.1776 (N=31)`; the RRA multiplier `2/(D_N(N−2)) = 1.178 (N=7), 0.660 (N=13), 0.434 (N=25), 0.293 (N=31)`. Sanity anchors (computed): a 7-node star gives RRA 0 at the centre and 0.98 at a leaf; a 7-node line gives 1.18 at the middle and 2.94 at the end. Any implementation that does not reproduce these four numbers is wrong.
- Exceptions / failure mode: Within one graph, normalisation rescales but never reorders — so the "we must use RRA" argument is only valid across plans of different room counts (AG-10 says the same). Small-N floors make ℓ jumpy: report the rank change from removing each candidate door (AG-10's sensitivity rule) instead of a decimal-precision value.

### SA-04 Compute choice as shortest-path flow, and always declare the radius
- Rule: `Choice(i) = (# shortest paths passing through i) / (# shortest paths considered)`, computed with Brandes' accumulation in O(VE). Declare the scope: `global` (all OD pairs) or `local(r)` (only destinations within r steps), and declare whether OD pairs with `i` as an endpoint are counted. On a tree the exact count is available without Brandes: deleting `i` leaves components of size `s_a`, and the number of endpoint-excluded paths through `i` is `Σ_{a<b} s_a s_b = ½[(N−1)² − Σ_a s_a²]`, normalised by `(N−1)(N−2)/2`.
- Evidence: `Choice(i) = {#shortest paths through i}/{#all shortest paths}` quoted from the opened arXiv source (Eq. 8, attributed there to Hillier, Burdett, Peponis, Penn 1987); the space-syntax gloss reading is that choice is a link's route-selection probability (T2, opened). Brandes' algorithm and Freeman's betweenness are already in this repo's citation set (AG table, AG-12/14).
- Source: arXiv:0709.4375v1 — T2 (opened). Nag, Sen & Goswami 2022 (see SA-10) — T2 (opened). Freeman, "A Set of Measures of Centrality Based on Betweenness", *Sociometry* 40 (1977) and Brandes 2001 — T2, both carried by `adjacency-graphs.md`'s source list, not re-opened here.
- Class: FACT (formula) / STANDARD (radius must be declared)
- Scope: universal on any weighted or unweighted graph
- Confidence: High
- Grid translation: Run choice twice — once on the room graph (which space does traffic cross) and once on the corridor skeleton at tile level for `r = 20, 40, 80` tiles (10/20/40 m). Report the endpoint-inclusive variant as "traffic" only if that is what the tool computed.
- Exceptions / failure mode: Choice is the metric that *separates* from integration: a dead-end entrance hall can be well integrated and carry zero through-flow (worked in SA-27). Reporting only integration hides the space nobody walks past; reporting only choice hides the destination.

### SA-05 Compute control as the access-dependency measure; leave "ringfugle" out until verified
- Rule: `Control(i) = Σ_{j adjacent to i} 1/deg(j)` (equivalently `(A D⁻¹)_{ii·}`). Read it as: how much of a neighbour's accessibility this space owns. High control + low integration is the signature of a guard room, a checkpoint, a single stair lobby: it is not central, it is indispensable. Do not compute or quote "ringfugle" until a primary definition is opened.
- Evidence: `CV(i) = Σ_{i∼j} 1/deg(j) = Σ_j (A_𝔊 D⁻¹)_ij` quoted verbatim from the opened source (Eq. 7, attributed there to Jiang 1998). The ring/string half of the same vocabulary is already handled in this repo as circuit rank and ringness (AG-14), with "stringiness … the extension of space in one dimension" quoted from Hillier & Hanson p.91.
- Source: arXiv:0709.4375v1 — T2 (opened, Eqs 7–8). `adjacency-graphs.md` AG-14 — intra-repo. NEEDS VERIFICATION: "ringfugle" as a named space-syntax measure — check Klarqvist 1993 and the Space Syntax glossary term list (the online glossary served only a navigation shell this pass, no definitions). Until then the term is unusable in a report.
- Class: FACT (formula); the *reading* is DESIGN PRINCIPLE
- Scope: universal
- Confidence: High for the number, Medium for the interpretation
- Grid translation: One matrix pass after the degree array; O(E). Emit `control` beside `integration` and flag any node with `control` in the top quartile and `integration` in the bottom half as a `dependency_point` — those are the rooms to staff, to keep unlocked, and to never let a repair remove (AG-13's cut vertices usually coincide).
- Exceptions / failure mode: Control is degenerate on trees where most leaves have `deg = 1`, so it mostly re-reads the corridor skeleton; publish it only when the plan has nodes of mixed degree, and never on graphs below ~8 nodes.

### SA-06 Build the isovist per tile with a supercover ray sweep and publish the polygon
- Rule: For each sample point, cast K rays and terminate each at the first blocked tile; the isovist is the resulting polygon. Measure area with the shoelace formula on the ray endpoints (`A = ½|Σ (x_i y_{i+1} − x_{i+1} y_i)|`), perimeter by summing edge lengths, and keep the polygon in the record — a scalar isovist with no polygon is unauditable. Angular resolution K must be a declared parameter; the ray interval should be ≤ 1 tile-width at the far radius so a 0.5 m door is never missed.
- Evidence: An isovist is "the volume of space visible from a given point in space", coined by Clifford Tandy 1967 and developed by Michael Benedikt; generated by tracing sightlines from a fixed point until intercepted (T4, opened). The visible-tile predicate used here is the same supercover line test this repo already specifies in HB-09's grid translation ("a tile sees another if the segment between centres crosses no blocked tile; door tiles transmit, walls do not").
- Source: Wikipedia, *Isovist* https://en.wikipedia.org/wiki/Isovist — T4 (opened; concept and genealogy only, not elevated to a method authority). This repo: HB-09 — intra-repo. NEEDS VERIFICATION: Benedikt, "To take hold of the world: isovists' sources and uses", *Leonardo* 12 (1979) — cited as the standard origin by the T4 page, not read.
- Class: STANDARD (measurement procedure)
- Scope: universal on the tile grid; per floor (SA-23)
- Confidence: High for the procedure; Medium for K guidance (self-set)
- Grid translation: Cost is `O(cells × K)` brute force; for a full floor use one of (a) recursive shadowcasting over the tile grid, or (b) sample at every 4th tile (2 m) and interpolate. Choose the sight-line bound `r_max` explicitly (hotel: 40 tiles = 20 m; hospital ward: 24 tiles) — an unbounded isovist on a small floor just measures the walls.
- Exceptions / failure mode: A ray that grazes a wall corner flips the polygon between two very different isovists — snap endpoints to the occluder edge and publish `r_max` and K, or the same plan will produce different numbers on two runs. Furniture tiles must be declared as occluders or explicitly excluded, never left ambiguous (FP-15's exclusive tile ownership helps).

### SA-07 Report the isovist measure set with this file's definitions, not borrowed authorship
- Rule: Use the following computable set, and label each with its status. Unambiguously arithmetic: `area`, `perimeter`, `r_max`, `r_min`, radial mean `μ_r` and radial σ_r over the K directions. Shape indices defined here: `openness = A/(π r_max²)`, `enclosure = 1 − openness`, `isoperimetric_quotient = 4πA/P² ∈ (0,1]`, `elongation = r_max/r_min ≥ 1`, `circularity_proxy = 1 − σ_r/μ_r ∈ [0,1]`, `occlusion_breaks = ` count of maximal runs of rays that terminate early (i.e. number of distinct shadow wedges). Do not print the words "compactness", "squareness", "skewness", "occlusivity" as if citing the isovist literature without the formula attached from this table.
- Evidence: The isovist literature is described as quantifying isovist shape with "numerical measures", but no formula table could be opened this pass: the practitioner manual pages returned only scripts/CSS and the PDF manuals returned undecodable binary streams (see the Sources section, blocked list). The formulas above are therefore this file's own definitions — reproducible, testable, and explicitly not attributed.
- Source: Wikipedia, *Isovist* — T4 (opened; confirms measures exist, gives none). NEEDS VERIFICATION: Turnbee's isovist-measure set (compactness, squareness, occlusivity formulas) and the Isovist_App manual definitions — re-open from a text-extractable copy before replacing any definition above.
- Class: HEURISTIC (definitions fixed here) / FACT (their arithmetic)
- Scope: universal
- Confidence: High that the set is computable; none for equivalence to the named literature measures
- Grid translation: Emit all eight numbers per sampled point, then the floor-level summary (median, p10, p90) and the route profile (values along the SA-13 route). Bands are in the Interpretation bands section; the useful contrasts are order-of-magnitude, not decimals.
- Exceptions / failure mode: `isoperimetric_quotient` punishes any narrow slot, so a 1-tile corridor scores ~0.03 regardless of how legible it is — never read it as "quality". `occlusion_breaks` is resolution-dependent: report it together with K.

### SA-08 Build the visibility graph by merging contiguous equal-visibility cells
- Rule: Compute the visible-cell set for each sampled point; merge contiguous cells whose visible-set is identical into one VGA node; connect two nodes when they are adjacent and their visible-sets differ by a boundary crossing. Report `vga_nodes / sampled_cells` (the compression ratio) and `covisibility_density = 2E_v/(V(V-1))`. Publish the graph, not just a heatmap.
- Evidence: The method family is "From Isovists to Visibility Graphs: A Methodology for the Analysis of Architectural Space" — Turner, Alasdair & Doxa, Maria & O'Sullivan, David & Penn, Alan, *Environment and Planning B: Planning and Design* 28(1):103–121, 2001, DOI 10.1068/b2684 (metadata verified via Crossref this pass; body not read). This resolves the alternative title offered in the commissioning brief: the rasterised-VGA methodology paper to cite is Turner, Doxa, O'Sullivan & Penn 2001, and no record titled "Color Merging and Topological Information in Visual Graphs" appeared in the Crossref search performed.
- Source: Crossref API title query — T2 metadata for the paper above; body: NEEDS VERIFICATION — open the DOI and confirm the exact merge criterion (same visible set vs same occluder set) and the sampling rule before implementing the merge as anything other than this file's definition.
- Class: STANDARD (procedure), with the merge criterion currently HEURISTIC
- Scope: per floor; continuous geometry or tile grid
- Confidence: Medium for the method's shape, High for its usefulness
- Grid translation: Bucket cells by a hash of their sorted visible-cell list (visible-set equality on the sampled subset); a union-find pass over 4-neighbours with equal hashes gives the merged nodes. On a 40×25 floor sampled every 2 m this is a few hundred nodes — cheap enough to run per plan revision, which is the point.
- Exceptions / failure mode: Visible-set equality is brittle: one extra occluder tile splits two nodes and doubles V. Use set-similarity ≥ threshold (e.g. Jaccard ≥ 0.9) for merging and publish the threshold with the graph, or VGA numbers will not be comparable across revisions.

### SA-09 Publish the covisibility matrix and the minimum-view tests
- Rule: Compute `covis(a,b) = |V(a) ∩ V(b)| / |V(a) ∪ V(b)|` (Jaccard over visible cells) between every pair of functional positions that must see each other, and the one-sided tests: `visible_dest_share` (fraction of destination-tagged tiles visible from the arrival point), `rooms_visible_from_point`, and `supervised_share` for staffed positions. These are the numbers behind HB-09 and HB-18 — those rules own the decision, this rule owns the computation.
- Evidence: HB-09's grid translation already specifies the per-floor visibility graph and `visible_share_of_destinations`; HB-18 already forbids scoring supervision from `isovist_area` alone and specifies `visible_room_share`. The Jaccard covisibility index is this file's own definition of "viewshed overlap".
- Source: This repo: HB-09, HB-18 — intra-repo (their sources carry the evidence). Wikipedia *Isovist* — T4 (opened; visibility graphs used to calculate intervisibility). HEURISTIC for the Jaccard formulation.
- Class: HEURISTIC (formulation) / STANDARD (must be published where HB-09/HB-18 apply)
- Scope: universal; strongest in lobby, reception, nurse station, retail till, lift hall
- Confidence: High for the computation; Medium for the behavioural reading (HB-09's evidence)
- Grid translation: Vectors of visible-cell sets as bitsets, so intersection/union are popcounts and the full N x N covisibility matrix on 400 sampled points is trivial. Emit the matrix as a heat grid plus the failing-pairs list (required pair with `covis < 0.05`).
- Exceptions / failure mode: Covisibility across a door run is a *slot*, not a room view — combine with SA-22's aperture angle or the test passes on a keyhole. Two points that see each other's centre tile but not each other's fixture tiles are not in supervision range.

### SA-10 Report the movement equation as a regression with its published error bars
- Rule: The operational form is: predicted pedestrian flow for a link/space = configurational accessibility × functional attraction, estimated as a regression (`log F = a + b*log(Integration) + c*Attraction`, or an OLS/path model), never as a bare multiplication of an index by a room count. Publish: unit of analysis, radius, `n`, `r` or `R^2`, and residual. Report the published yardstick: in an opened study of pedestrian street networks, 30-minute foot-traffic counts correlated with normalised integration at `r = 0.60`, with normalised angular integration at `r = 0.57`, and with choice at `r = 0.51` (Pearson, segment graph cut at intersections, angular routing distances).
- Evidence: Nag, Dipanjan & Sen, Joy & Goswami, Arkopal Kishore, "Measuring Connectivity of Pedestrian Street Networks in the Built Environment for Walking: A Space-Syntax Approach", *Transportation in Developing Economies* 8(2), 2022, DOI 10.1007/s40890-022-00170-7 (full text opened via the PMC mirror): definitions integration = "a link's destination potential", choice = "its route selection probability", connectivity = "cumulative turning angles toward neighboring segments"; methods Douglas-Peucker simplification, Pearson + OLS stepwise + path modelling by MLE, QGIS/ArcGIS with syntactic plugins; the r values above exactly as reported there.
- Source: https://pmc.ncbi.nlm.nih.gov/articles/PMC9299754/ — T2 (opened); Crossref metadata verified. Hillier et al. 1993's own boundary, carried in AG-10/TH-20: "natural movement is the proportion of urban pedestrian movement determined by the grid configuration itself". NEEDS VERIFICATION: the classic London/Rio/Barcelona footfall correlations and their r² — the synopsis article (https://www.mdpi.com/2071-1050/13/6/3394) returned 403 and the UCL PDF was undecodable, so no first-hand figure for those cases exists in this file; do not quote them.
- Class: HEURISTIC (predictive strength) / FACT (the r values are as published)
- Scope: urban segment networks well evidenced; interiors weakly so
- Confidence: Medium for the ranking use; Low-Medium for an interior footfall forecast — matching TH-20's stated confidence, not exceeding it
- Grid translation: For an interior floor, build OD demand from the programme (rooms × expected trips) rather than assuming configuration drives trips: in a hotel the destination *function* dominates (guest rooms, restaurant, lift hall), so report the forecast as `attraction_weight x shortest_path_share` and label it HEURISTIC. Only claim space-syntax movement where the radius is comparable to the plan and `n` is large enough to correlate.
- Exceptions / failure mode: `r = 0.5-0.6` means roughly 25-36 % of variance explained: the metric is one input, not a verdict. Designing a plan to maximise integration alone produces a shopping centre with no quiet rooms — the constraint set in TH-20/HB-25 stays in force.

### SA-11 Attach the published criticism to every predictive use
- Rule: Any rule of this file used to *forecast* behaviour must ship with the criticism in the same record: (1) no agreed benchmark values exist — the opened study states that "researchers have failed to define benchmark values for good connectivity"; (2) metric-only models omit the physical qualities of the walkway and therefore under-explain variance; (3) network topology is quasi-static, so the metric cannot track short-horizon change; (4) axial representations carry a documented bias toward long straight lines and contested mathematical properties.
- Evidence: Points 1-3 are the opened paper's own stated limitations (Nag et al. 2022, T2); point 4 is from the opened encyclopaedic account of the method's criticisms (T4). This repo independently caps the claim in AG-10, AG-24, TH-20, HB-25 and the architecture-theory Weak-or-contested section.

- Source: PMC9299754 — T2 (opened, quotes verified). Wikipedia *Space syntax* — T4 (opened). `adjacency-graphs.md` ## Weak or contested — intra-repo.
- Class: STANDARD (reporting obligation)
- Scope: universal
- Confidence: High
- Grid translation: In the diff table (VA-18), every analytic row carries `value | band | baseline | effect_size | known_limitation`. A row with an empty `known_limitation` field fails the report gate.
- Exceptions / failure mode: The symmetric error — discarding the metrics because they are contested — loses cheap, objective, reproducible evidence about bottlenecks and depth, which is not contested (SA-12, SA-03). Use the structural metrics freely and the predictive ones with the label.

### SA-12 Compute flow, betweenness and bottleneck on the circulation skeleton, not on every tile
- Rule: For agent-cheap crowd metrics, reduce first: nodes = corridor junction tiles + room door tiles + portal nodes; then accumulate shortest-path counts over the OD demand matrix, tile betweenness (Brandes), and `strain(tile) = flow(tile) / capacity(tile)` with capacity from AG-12. Report the top decile of strain as the bottleneck list, and the min-cut (AG-12) as the structural worst case — the two usually, but not always, name the same door.
- Evidence: Capacity-per-door-edge and min-cut are already specified in AG-12 (with Gwynne et al. 2009 on doorway width/flow, T2); demand-weighted A* path cost is AG-09; simulated trips as the validation act are VA-15. Reducing the grid to a skeleton before analysis is the same centreline-extraction move architecture-theory uses for the movement graph (TH-11's grid translation).
- Source: This repo: AG-09, AG-12, VA-15, TH-11 — intra-repo. Brandes 2001 (via AG's source list) — T2, not re-opened. HEURISTIC for the skeleton-reduction thresholds.
- Class: STANDARD (procedure); HEURISTIC for strain bands
- Scope: universal; interiors where OD demand is programmeable
- Confidence: High (arithmetic on declared demand)
- Grid translation: OD matrix from the programme (beds, seats, staff posts) → weighted pairs; A* per pair on the role-restricted graph (AG-15); accumulate into a tile heat array. Cost is O(#pairs × V log V) — bound it by aggregating same-type rooms (AG-20's twin classes give exactly the right aggregation unit: one representative per twin class × class count).
- Exceptions / failure mode: Betweenness on a small room graph is unstable — one added door re-shuffles it (this repo's own AG caveat). Publish the leave-one-door-out delta alongside any betweenness ranking on graphs under ~25 nodes, and do not present the top-1 space as "the" bottleneck without the min-cut cross-check.

### SA-13 Compute trip-length and desire-line deviation as distributions
- Rule: For every OD pair above a demand threshold, record `L_octile = max(dx,dz) + 0.41421·min(dx,dz)` (the grid's own optimum), `L_actual = A* steps`, and `detour_index = L_actual / L_octile ≥ 1`. Publish p50/p90/max trip length in metres and the `detour_index` distribution, plus `through_room_share` = fraction of routed trips whose shortest path crosses a room rather than the circulation skeleton.
- Evidence: The octile cost constant and desire-line-as-straight-line reasoning are established in this repo (architecture-theory TH-14's grid translation computes the Bresenham/octile straight line per OD pair; `site-context.md` does the same at site scale). The detour/directness framing is the third of the three measures named in an opened-metadata study of superblock pedestrian connectivity.
- Source: This repo: TH-14, AG-09, `site-context.md` — intra-repo. Scoppa & Anabtawi, "Connectivity in Superblock Street Networks: Measuring Distance, Directness, and the Diversity of Pedestrian Paths", *Sustainability* 13(24):13862, DOI 10.3390/su132413862 — T2 (metadata verified via Crossref; body not read, so no numbers quoted from it).
- Class: FACT (arithmetic); HEURISTIC for the bands
- Scope: universal
- Confidence: High
- Grid translation: Reuse the SA-12 A* runs — the same paths give trip length, detour index and `through_room_share` in one pass. Flag any pair with `detour_index > 1.3` and demand above the median as a routing defect, not a metric curiosity.
- Exceptions / failure mode: `L_octile` is unreachable in a walled plan by construction, so a detour index near 1 is suspicious (the route is probably crossing a wall) — re-run the wall integrity check (FP-04, AG-19) before believing a too-good ratio.

### SA-14 Derive density from flow with Little's law, then read the LOS band
- Rule: `N = Q × T` (occupancy = arrival rate × dwell time, steady state) is how a tile gets its population without a simulation; then `density = N / (tiles × 0.25 m²)` and the LOS band comes from HB-01's table. Report the LOS-failure tile set as `argmax(N/area)` per route and the tick count over capacity. The same law sizes the queue pockets HB-10 and the portal lobbies MS-23.
- Evidence: Little's law is standard queueing arithmetic (FACT); the LOS bands themselves are owned by HB-01 (with Fruin-derived areas per person) and the door-flow evidence by HB-02/AG-12 — this rule adds only the conversion from demand to occupancy, which neither file performs.
- Source: This repo: HB-01, HB-02, HB-10, HB-13, MS-23, AG-12 — intra-repo (their citations carry the evidence). Little's law: standard queueing identity, derived here.
- Class: FACT (the identity) applied to HEURISTIC dwell inputs
- Scope: any space with a stated dwell time; strongest in lobbies, WCs, lifts, queues
- Confidence: High for the identity; Low for any assumed dwell time unless the programme states it
- Grid translation: Dwell inputs per room type from the type card (seated 45 min restaurant, 3 min WC, etc. — project-settable, never invented); `Q` from the SA-12 demand matrix per tick; publish `peak_N`, `peak_density`, `band`, and the exceedance ticks over the plan's lifetime.
- Exceptions / failure mode: `N = Q × T` breaks down under platoons (a lift discharge is not a Poisson arrival) — for portal-driven spikes use the batch arrival in MS-23 and treat the Little's-law value as the steady-state floor, not the peak.

### SA-15 Weight decision points by asymmetry and distinctiveness, not by count alone
- Rule: Extract decision nodes as junction points on the circulation skeleton (≥ 3 open branch directions), merge within one tile, then score each: `asymmetry = 1 − (angular spread of the two least-similar branches)/180°` and `distinctiveness = number of different room/fixture tags visible down each branch` (from the SA-09 covisibility sets). Publish per route `Σ (1 − asymmetry_i)` as `wayfinding_load` alongside the raw count HB-06 caps.
- Evidence: TH-19 owns the taxonomy of decision points and the rule that the plan should replace signage; HB-06 owns the cap on decision points per trip and the asymmetric-junction requirement; AG-23 owns legible-skeleton declaration. The asymmetry/distinctiveness weighting is this file's arithmetic addition.
- Source: This repo: TH-19, HB-06, HB-09, AG-23 — intra-repo. HEURISTIC (the weighting is a formulation, not a published index).
- Class: HEURISTIC
- Scope: universal; critical in hospitals and multi-floor hotels
- Confidence: Medium
- Grid translation: Branch direction from the skeleton adjacency; tags from the visible-cell sets (SA-06 polygons) so distinctiveness is measured from the junction's actual view, not from the plan top-down. Flag any public route with `wayfinding_load` above the plan median × 1.5, or any node with `asymmetry ≈ 0` (a symmetric T) on a guest/public route.
- Exceptions / failure mode: Distinctiveness computed from an empty shell floor is zero everywhere — the metric requires the fixture layer; if fixtures are absent, publish the count only (HB-06) and mark the weighted score `unknown`.

### SA-16 Compute enclosure two ways and never confuse them
- Rule: Visual enclosure: `enclosure(t) = 1 − A_isovist(t)/(π r_max²)` (SA-07). Physical enclosure: `wall_share(r) = perimeter_contact_tiles(r)/room_tiles(r)` — the share of a room's tiles that own a boundary wall, already computable from the wall-ring arithmetic in `adjacency-graphs.md`. A "feels enclosed" claim must name which of the two it rests on; they disagree exactly where the design intent lives (a glazed corner room is physically enclosed, visually open).
- Evidence: The isovist term is a shape measure of the visible polygon (SA-06/07 definitions); the wall-ring arithmetic is derived in this repo (TH-02's wall tax; AG's derived constants, "wall ring of a rectangular room = 2W + 2H − 4 tiles").
- Source: This repo: TH-02, `adjacency-graphs.md` header constants, HB-17 — intra-repo. HEURISTIC for the pairing.
- Class: FACT (arithmetic) / STANDARD (the naming obligation)
- Scope: universal
- Confidence: High
- Grid translation: `enclosure` per sampled point → floor map; `wall_share` per room → programme table. Bands in ## Interpretation bands. Route-level summary: mean enclosure along the SA-13 route, which is what tells you whether a corridor reads as a cave or a hall.
- Exceptions / failure mode: Open-plan floors give `wall_share ≈ 0` for every space and make the physical measure useless — use the visual one there, and declare which one drove the decision.

### SA-17 Measure visual complexity by box-counting, with a fit-quality gate
- Rule: Rasterise the elevation/plan edge layer (walls, openings, mouldings as a binary image), count the occupied boxes `N(r)` at box sizes `r = 1,2,4,8,…` tiles, fit `log N(r) = a − D·log r` by least squares, and publish `D` with `R²_fit` and the scale range used. Gate: reject `D` when fewer than 5 scales are available or `R²_fit < 0.95` — a façade with one level of detail is a straight line in log-log, not a fractal.
- Evidence: Box-counting façade analysis is an active published family — e.g. "Fractal Dimensional Analysis of Building Facades: The Case of Office Buildings in Erbil City" (*Fractal and Fractional* 8(12):746, 2024, from the search result listing) and "Fractal Analysis of Façades of Historical Public Buildings with Box Count Method: The Case of Afyonkarahisar" (IntechOpen chapter, title confirmed on the landing page). Neither body could be opened this pass, so no typical D range and no preference correlation is quoted here.
- Source: https://www.mdpi.com/2504-3110/8/12/746 — T2 (found via search; 403 on fetch, title only). https://www.intechopen.com/chapters/1137308 — T3 (title confirmed, body absent). NEEDS VERIFICATION: any numeric D band and any preference/complexity correlation — the circulating "preferred façade D ≈ 1.3–1.7" figure was NOT verified and must not be used until a full text is read. Arithmetic FACT available now: for a planar edge set `D ∈ [1,2]`, `D → 1` for a plain box outline, `D → 2` for a space-filling screen.
- Class: STANDARD (procedure) / NEEDS VERIFICATION (interpretation bands)
- Scope: façades, screens, ceiling/soffit patterns, retail frontage; not usable on a bare tile wall
- Confidence: High for the computation; none for preference claims at this time
- Grid translation: The 0.5 m tile *is* the finest scale, so a 40-tile elevation gives at most scales {1,2,4,8,16,32} — exactly 6, i.e. barely enough. Consequence: this metric can grade complexity differences between plans, and cannot resolve sub-tile ornament; state that limit in the record rather than quoting a smooth D to two decimals.
- Exceptions / failure mode: `D` is sensitive to the binarisation threshold — publish the threshold, and re-run at ±1 step; if D moves more than 0.1, the reading is an artefact of the edge extraction.

### SA-18 Quantify prospect-refuge as a two-term pair measured at the occupied position
- Rule: Compute at each *station or seat* tile, not the room centre: `prospect = openness × r_max` and `refuge = enclosure × back_protected`, where `back_protected = 1` if a blocked tile is adjacent behind the seat orientation and `0` otherwise, and `side_shielded` (analogous, either side) may be added. Publish the pair; a design that maximises one at zero of the other is a defect, per HB-18/HB-12's decision rules.
- Evidence: The framing (open, unobstructed view combined with protection behind) is the standard prospect-refuge idea; the numeric pairing here is an operationalisation, not a published index. This repo's HB-12 (design the wait), HB-18 (supervision via sightlines) and HB-19 (circulation margin) are the rules the pair serves.
- Source: HEURISTIC (formulation defined in this file). NEEDS VERIFICATION: Appelon et al. 2008, "Landscape aesthetics: quantifying the scenery…" (*Landscape and Urban Planning*) — the standard citable quantification of openness/enclosure/depth-of-field/complexity — not opened this pass; check it before replacing either term.
- Class: HEURISTIC
- Scope: hospitality, healthcare waiting, retail queuing, education
- Confidence: Low-Medium
- Grid translation: One isovist per station tile (cheap: a handful per floor, reusing SA-06 polygons). Flag: any public seat with `prospect < 0.3 × floor_median`, any seat with `refuge = 0`, and any station where both are simultaneously below the floor median.
- Exceptions / failure mode: Orientation is an input the tile model does not carry (chairs are not typed) — either declare `seat_orientation` in the fixture layer or the `refuge` term is meaningless; publishing it without the orientation assumption documented is the failure mode.

### SA-19 Use legibility proxies that are actually computable
- Rule: Replace "legible" with three numbers: (a) `landmark_gap(d)` = octile distance from decision node d to the nearest visually distinctive target, where distinctive = a tag change inside the node's isovist (SA-06/09); (b) `route_straightness` = 1/detour_index for the intended route (SA-13); (c) `intelligibility` = Spearman rank correlation between `deg` and `integration` on the room graph — how well local cues predict global position. Publish all three with the route.
- Evidence: Intelligibility as a local/global correspondence claim is space-syntax orthodoxy (AG-10 and AG-14's source set, incl. "Axial intelligibility" in the glossary source list); landmark distance and route straightness are this file's computable proxies for the same intuition, in the service of AG-23 (legible skeleton) and TH-19 (plan replaces signage).
- Source: This repo: AG-23, TH-19, HB-06, `adjacency-graphs.md` source list (Space Syntax glossary "Axial intelligibility") — intra-repo. Scoppa & Anabtawi 2021 (title-verified: distance, directness, diversity of pedestrian paths) — T2. HEURISTIC for (a) and (b) as defined.
- Class: HEURISTIC
- Scope: universal; the dominant quality metric in hotels and hospitals
- Confidence: Medium
- Grid translation: (a) is a BFS from each decision node over visible tiles — one per node; (b) reuses SA-13's path stats; (c) is one rank correlation over ≤ 60 nodes. Report `landmark_gap > 20 tiles (10 m)` at any public decision node as a signage requirement, tying directly to HB-09's "put the destination in view" test.
- Exceptions / failure mode: A plan can be perfectly intelligible (high c) and still unreadable because it is monotonous — (c) rewards a uniform grid, so always report it with AG-20's twin-class count; many twins + high intelligibility = maze you can navigate but cannot describe.

### SA-20 Compute catchments as isochrones on a declared walking-speed graph
- Rule: Dijkstra from each site origin (stop, entrance, car park) over the street/pavement graph with `cost = length / v_eff`, where `v_eff` is a declared walking speed reduced for crossings and gradient; the isochrone set at 5/10/15/20 min is the catchment. Report catchment area in ha and the programme inside it (beds, seats, staff) — not just a polygon.
- Evidence: Standard distance-decay accessibility method; the numeric speed and the crossing penalties are guidance values, not derived here.
- Source: NEEDS VERIFICATION: a first-class transport guidance source for walking speed and isochrone bands — the NSW Government Movement & Place indicator page returned 403 and the practitioner manual PDFs were undecodable this pass. Check `Manual for Streets 2` (already in this repo's source list at https://tsrgd.co.uk/pdf/mfs/mfs2.pdf, T1/T3) and a national transport guidance page for the bands before quoting a figure. HEURISTIC: the recipe shape is uncontroversial; no number is claimed as standard.
- Class: STANDARD (procedure) / NEEDS VERIFICATION (thresholds)
- Scope: site and masterplan only — do not run this inside the building
- Confidence: High for the method; Low for defaults
- Grid translation: Aggregate the 0.5 m grid to 10 m cells (20×20 tiles) before site analysis, then `1 ha = 10 000 m² = 40 000 tiles`; store isochrones as boolean layers per band so they diff cleanly across design alternatives.
- Exceptions / failure mode: A site isochrone computed through the *building* (walk-through arcade, station link) is only valid if the public role can legally traverse it — reuse the per-role graphs of AG-15 rather than the raw geometry, or the catchment is fiction.

### SA-21 Compute permeability as the standard index set and reuse AG-14's ringness
- Rule: On the site graph publish: node density (junctions/ha), link density (km/km²), intersection density (intersections/ha or /sq mi), `β = e/n`, `γ = e/(3(n−2))` (planar maximum reference), and `α = (e − n + p)/(2n − 5)`. Note the algebraic identity: this α is exactly AG-14's ringness ρ — the same number at two scales, so report one and label it both ways rather than publishing two.
- Evidence: The circuit-rank denominator `2n − 5` and ringness definition are established in this repo (AG-14, from Hillier & Hanson p.102 via the Space Syntax glossary); the classical network indices α/β/γ are standard graph-network arithmetic (FACT as definitions — the canonical published attribution could not be opened this pass, so they are stated as definitions).
- Source: This repo: AG-14, `adjacency-graphs.md` derived constants (Euler bound, `e ≤ 3n − 6`, `μ_max = 2n − 5`) — intra-repo. NEEDS VERIFICATION: published permeability *targets* (e.g. the government indicator pages blocked this pass: movementandplace.nsw.gov.au, 403) — do not invent numbers.
- Class: FACT (definitions/identity) / NEEDS VERIFICATION (bands)
- Scope: site scale; permissive blocks vs superblocks
- Confidence: High for the arithmetic
- Grid translation: Derive the site graph from the walkable/pavement tiles (junction detection is SA-15's skeleton extractor applied to the site layer), then the indices are one BFS each. Conversion reminders: `10 intersections/ha = 4 intersections per 4 000 tiles`.
- Exceptions / failure mode: α is scale-fragile: it measures the block pattern, and adding alley gates (culs-de-sac) raises n without e, *lowering* α while appearing more "permeable" on the drawing — always publish γ and the dead-end count (FP-22, CODE-06) beside α.

### SA-22 Doors are aperture-constrained edges: model the slot, not the hole
- Rule: A door run of `w` tiles at distance `d` metres subtends `θ = 2·atan((0.5·w)/(2·d))` radians of visual aperture. Any visibility metric that credits a room through a door must report θ with it, and any flow metric must use AG-12's capacity for the same run, not the tile count. Worked arithmetic: a 1-tile (0.5 m) opening at 10 m gives `θ ≈ 2.9°` — a keyhole, not a view; a 4-tile (2 m) opening at 5 m gives `θ ≈ 22.6°`.
- Evidence: The repo already forbids scoring supervision from isovist area alone and requires the visible-share measure (HB-18), and requires door capacity to be sized on reduced *clear* width after leaf swing (AG-12, citing Gwynne et al. 2009 on doorway width vs flow, T2). The aperture formula is plane trigonometry (FACT).
- Source: This repo: HB-17, HB-18, AG-12 — intra-repo; arithmetic derived here.
- Class: FACT (formula) / STANDARD (reporting)
- Scope: every visibility, supervision and wayfinding metric at every scale
- Confidence: High
- Grid translation: In SA-06's ray sweep, mark the ray class (open, through-door, through-glazed) so every downstream metric can be split by aperture type; publish `visible_share_through_doors_only` separately from `visible_share_open`. Flag: any supervision or "destination in view" claim that survives only in the doors-only column.
- Exceptions / failure mode: Open doors are one state, not a permanent truth — run the metric on the closed/locked variant too (fire-normal vs secured, per AG-15's per-role graphs); a plan whose legibility depends on a propped fire door fails validation regardless of the number.

### SA-23 Extend every metric to N floors through portal edges with a declared friction cost
- Rule: Build the 3D graph = per-floor graphs ∪ portal edges `room ↔ P(f) ↔ floor node` (AG-16's shape), with `cost(P) = queue_ticks(λ, μ) + travel_ticks` (MS-23's queue). Then run integration, choice and threshold depth on both the 3D graph and each floor alone, and publish the rank divergence `Δ = |rank_3D(v) − rank_floor(v)|`. Visibility is never extended: there is no sightline through a stair — the only cross-floor visual quantity is the arrival viewshed at the portal.
- Evidence: The node/edge model and the "vertical edges are queues, not links" rule are AG-16; portal-as-queue with a service rate is MS-23; measuring rather than asserting vertical connectivity is MS-24; multi-storey space-syntax modelling with stair and lift links is represented in this repo by the SSS13 evacuation paper carried in AG-15's sources (T4).
- Source: This repo: AG-15, AG-16, MS-23, MS-24 — intra-repo.
- Class: STANDARD (procedure)
- Scope: any stacked building; the flagship multi-floor hotel case
- Confidence: High for the procedure; Medium for `queue_ticks` inputs (they are project inputs)
- Grid translation: Friction in the same units as tile steps: a lift whose peak queue is 12 ticks at 30 s/tick is a 6-minute edge, i.e. 720 tiles of walking distance — the ratio is what makes a mezzanine dead. Flag `Δ > 10` places: a space that is central on its floor and peripheral in the building is the classic revenue-space failure.
- Exceptions / failure mode: A stair-only upper floor has *low* friction but *high* physical cost; publish the accessible-route variant of every 3D metric separately (MS-16 owns the requirement), because the two rank the building differently.

### SA-24 Publish interpretation bands with the normalisation, never a raw value
- Rule: Every analytic number in a report ships as `metric | representation | radius | unit_of_analysis | n | normalisation | value | band | baseline | limitation`. Bands are the table in ## Interpretation bands; baselines are the computed reference graphs of this file (star, line, grid at the same n) — the only legitimate reference for a small plan, because no external benchmark is agreed (SA-11).
- Evidence: The "no benchmark values" finding is published (Nag et al. 2022, T2, opened); the reporting discipline matches VA-18's diff table and VA-03's three-valued verdicts, and `synthesized-rules.md`'s existing demand that measured values name their source of comparison.
- Source: This repo: VA-03, VA-18, SA-11 — intra-repo; PMC9299754 — T2.
- Class: STANDARD (report contract)
- Scope: universal
- Confidence: High
- Grid translation: Compute the baselines once per n and cache them: for the same node count emit `integration_raw` of the star centre and leaf, of a line of n, and of the nearest rectangular room-grid. A value that does not beat its own n-baseline carries no information.
- Exceptions / failure mode: The commonest false reading is comparing two plans where one is 12 rooms and the other 40 without normalising (SA-03) or without re-declaring the representation (SA-01).

### SA-25 Threshold-flag the design problems the metrics can actually detect
- Rule: Run the flag set (all thresholds project-settable, `HEURISTIC` unless marked): `publicness_inverted` (Spearman(publicness, integration) < 0.6 — AG-10's test), `no_through_flow` (a public circulation node with choice ≤ 0.3 × skeleton max), `dead_end_encounter` (choice 0 at a node that is on the intended route), `cave_route` (mean enclosure along a public route > 0.9), `no_arrival_view` (arrival point sees < 2 destination tags, HB-09), `keyhole_supervision` (supervision claim true only through doors, SA-22), `long_detour` (p90 detour_index > 1.3, SA-13), `decision_storm` (> HB-06's cap) or `symmetric_T` (asymmetry ≈ 0 on a public route), `landmark_void` (landmark_gap > 20 tiles), `queue_overload` (SA-14 exceedance > 0), `mincut_strain` (strain > 1 at the AG-12 cut), `floor_3d_split` (SA-23 Δ > 10), `no_circuit` (ringness ρ = 0 on the public skeleton, AG-14), `maze_uniform` (intelligibility high AND twin classes < 20 % of rooms, SA-19).
- Evidence: Each flag is the numeric form of an existing qualitative rule, cited in the flag list to the rule that owns the judgement; the numeric cut-points are set here and are labelled HEURISTIC precisely so they can be tuned rather than trusted.
- Source: This repo: AG-10, AG-12, AG-14, HB-06, HB-09, HB-18, TH-20, FP-22, VA-15 — intra-repo.
- Class: HEURISTIC (bands) / STANDARD (the flag set must run)
- Scope: bands are type-specific (see ## Type-specificity audit)
- Confidence: Medium
- Grid translation: One pass over the already-computed metric store; emit flags as findings with the counterexample geometry (VA-08) and the band that was crossed (VA-18). Never emit a bare flag name: always `flag | measured | band_threshold | baseline | rule_id`.
- Exceptions / failure mode: Flags are diagnostics, not verdicts — `no_circuit` on a detention control skeleton is correct design (AG-14's declared exception), so every flag needs the type card loaded before it can fail a plan.

### SA-26 Worked example: integration by hand on a corridor-and-rooms floor
- Rule: Reproduce this table on any new plan to check your implementation; it is also the smallest case showing why integration and placement disagree. Layout (7 nodes, 6 door edges, a tree): `L` (arrival hall) – `C1` – `C2`; rooms `R1, R2` off `C1`; rooms `R3, R4` off `C2`.
- Evidence: Arithmetic derived here on the definitions of AG-10/SA-03 (Eqs. 2, 3, 5, 6 of the opened source).
- Source: arXiv:0709.4375v1 Eqs 2–6 — T2 (opened); this repo AG-10 — intra-repo.
- Class: FACT (arithmetic on a declared graph)
- Scope: any floor of this shape; the point is the method, not the numbers
- Confidence: High
- Grid translation: BFS from all 7 nodes. Degrees `L 1, C1 4, C2 3, R1–R4 1` (degree sum 12 = 2e, as required). Total depth `D`: `L 13, C1 8, R1 13, R2 13, C2 9, R3 14, R4 14` (Σ 84; hand-check `C1`: 1+1+1+1+2+2). Mean depth `ℓ = D/6`: `C1 1.333, C2 1.500, L/R1/R2 2.167, R3/R4 2.333`. Raw integration `1/ℓ`: `C1 0.750, C2 0.667, L 0.462, R1/R2 0.462, R3/R4 0.429`. Normalised (N=7, `D_N = 0.3396`, multiplier 1.178): RRA `C1 0.393, C2 0.589, L/R1/R2 1.374, R3/R4 1.571`. Reading: the circulation spine is the integrated end; the far rooms are 40 % deeper than the near ones purely because of the corridor's direction, so the plan's revenue space is at the segregated end — the exact TH-20 failure, computed rather than felt.
- Exceptions / failure mode: Circuit rank `μ = e − n + p = 6 − 7 + 1 = 0`, so ringness is zero (AG-14): every corridor tile-block is a bridge (AG-13) and the far rooms have no alternative route. A single-metric report would have shown only "integration slightly low".

### SA-27 Worked example: choice by hand on the same floor, and what disagreement buys
- Rule: Continue SA-26 with the endpoint-excluded component formula of SA-04, `through(v) = ½[(N−1)² − Σ_a s_a²]` over the components left after deleting `v`, normalised by `(N−1)(N−2)/2 = 15`.
- Evidence: Derived arithmetic on Eq. 8's definition (opened source).
- Source: arXiv:0709.4375v1 Eq. 8 — T2 (opened). This repo: AG-09, AG-12, SA-04 — intra-repo.
- Class: FACT (arithmetic on a declared graph)
- Scope: universal; tree plans especially
- Confidence: High
- Grid translation: Delete `C1` → components `{L}{R1}{R2}{C2,R3,R4}` sizes 1,1,1,3 → `through = ½(36 − 12) = 12` → choice `12/15 = 0.80`. Delete `C2` → sizes 1,1,4 → `½(36 − 18) = 9` → `0.60`. Delete `L` or any room → single component of 6 → `0` → choice `0`. So: `C1 0.80, C2 0.60, L 0, R1–R4 0`. Cross-check with the endpoint-inclusive convention gives `C1 0.857, C2 0.714`, every leaf `0.286` — i.e. the convention changes the answer's decimals and the *ranking of the entrance against the rooms*, which is exactly why SA-04 demands it be declared. Reading: `L` has integration 0.462 (mid-table) but choice 0 — it is reached easily and crossed by nobody. Place the café by the `C1`/`C2` flow, put the check-in desk where the flow terminates, and do not put anything you want discovered at a leaf, however integrated the number looks.
- Exceptions / failure mode: Because the plan is a tree, every shortest path is unique, so choice here is an upper bound on concentration — adding the second stair/lift core the building needs (AG-16) splits these paths and drops corridor choice; publish both variants when a vertical core is added.

### SA-28 Never rank a design on one metric; publish the vector and its disagreement
- Rule: Every design comparison uses the vector `(integration, choice, control, threshold_depth, min_cut_strain, ringness, enclosure_profile, covisibility_tests, detour_p90, wayfinding_load)` per role graph, ranked by a declared weighting, and reports `disagreement = number of metrics whose ranks differ by > 3 positions` for each pair of alternatives. Two plans that agree on one metric and disagree on three are not comparable.
- Evidence: SA-26/SA-27 show integration and choice inverting the placement conclusion for the same node; AG-10's caveat, AG-24's per-role graphs and the betweenness-instability caveat in `adjacency-graphs.md` ## Weak or contested all point the same way. Trade-off ledgers are owned by `decision-making.md` and `design-alternatives.md` (priced trade-offs) — this rule supplies the metric vector those files consume.
- Source: This repo: AG-10, AG-15, AG-24, `design-alternatives.md` trade-off fields, `decision-alternatives`/`decision-making.md` trade-off ledger, SA-26/27 (derived here).
- Class: STANDARD (comparison contract)
- Scope: universal
- Confidence: High
- Grid translation: Store the vector per (plan, role, floor-scope) and diff vectors, not scalars. When a metric must be promoted to a single score, publish the weights and re-run with each weight zeroed; if the winner changes, the ranking is weight-driven, not design-driven — say so.
- Exceptions / failure mode: More metrics is not better evidence: several correlated metrics (integration, mean depth, 1/RRA) are one measurement three times. Cluster the vector and report one representative per cluster.

### SA-29 Compute the angular variants where the plan is walked, not hopped
- Rule: Where turns cost more than doors, publish the angle-weighted versions: replace the hop count `d(i,j)` with the accumulated turning penalty `Σ|Δθ|/180°` along the path, then recompute mean depth, integration and choice. Report the topological and angular pair as `integration_topo` and `integration_angular` and treat a large gap between them as evidence about the geometry, not as two competing numbers.
- Evidence: An opened peer-reviewed study computed its segment measures with "angular routing distances" on a graph whose links are cut at intersections, and reported normalised angular integration alongside normalised (topological) integration against 30-minute foot counts — `r = 0.57` angular vs `r = 0.60` topological, with choice at `r = 0.51`. That the two coexist and are separately reported is the point; which is better varies by case, so both are published.
- Source: Nag, Sen & Goswami 2022, *Transportation in Developing Economies* 8(2), DOI 10.1007/s40890-022-00170-7 — T2 (opened, figures as reported: https://pmc.ncbi.nlm.nih.gov/articles/PMC9299754/). NEEDS VERIFICATION: the canonical angular-weight formula and its exponent (the literature's `1 + angle/π` style weighting was not opened this pass) — implement the turning penalty with a declared coefficient and label it HEURISTIC until the primary source is read.
- Class: STANDARD (procedure) / NEEDS VERIFICATION (weighting constant)
- Scope: universal; matters most where corridors bend (hotels, hospitals, retail)
- Confidence: Medium
- Grid translation: Turning penalty is free on the tile grid — the octile mover already knows each step's direction, so accumulate direction changes per path in the same A* pass used by SA-12/SA-13. On a 1-tile-wide corridor the topological and angular answers must be reported together, because a 3-bend route and a straight route of equal hops are not the same building to a guest carrying luggage (TH-11 owns the wider-route consequence).
- Exceptions / failure mode: Angular measures inherit the axial bias they were meant to fix — a long straight corridor wins on both angular and axial grounds, so a "good" angular score on a bar-shaped floor plate is a geometry artefact (SA-01's caveat), and 45° diagonals on this grid are a modelling choice, not a walking behaviour.

### SA-30 Stability-test every metric before it is used to prefer a plan
- Rule: For each metric that decides anything, run the perturbation set: remove each candidate door, remove each junction tile, shift the sample stride, and re-run with a different `r_max`/radius; publish `rank_flip_count` (positions moved > 3), `band_flip_count`, and the metric's sign-consistency across perturbations. A metric whose verdict flips under a perturbation the design could plausibly contain is demoted to descriptive.
- Evidence: The instability of small-graph centrality measures is already recorded in this repo: AG-10's exception ("small graphs flip ranking on one door — recompute with each candidate door removed and note rank changes ≥ 2"), AG's Weak-or-contested note that betweenness is "spiky, unstable" on small-n room graphs, and the published absence of agreed benchmark values (SA-11) which makes band tests meaningless without a stability check. VA-14 requires re-validation over the edit's blast radius; this rule makes the metrics themselves the thing under test.
- Source: This repo: AG-10, AG-12, VA-14, VA-18, `architecture-theory.md` ## Weak or contested — intra-repo. PMC9299754 — T2 (opened; no-benchmark finding).
- Class: STANDARD (validation of the instrument)
- Scope: universal; mandatory before a metric enters a design-alternative comparison
- Confidence: High
- Grid translation: Cost is one extra metric pass per perturbation: doors ≤ 60 and junction tiles ≤ 200 per floor, so a full leave-one-out sweep on the skeleton is cheap while the tile-level isovist sweep is not — restrict the isovist perturbation to stride and `r_max` only. Emit the stability table into the same diff table as the plan comparison (VA-18), and publish the metric vector delta (SA-28) alongside it so a reviewer can see whether the winner won on design or on sampling.
- Exceptions / failure mode: Over-stabilising destroys the signal: a metric that never moves under any perturbation is usually measuring the outer envelope, not the design (e.g. total isovist area on a fixed façade). Report the perturbation that *should* matter for the decision at hand, chosen from the type card.

---

## Metric catalogue

| # | Metric | Representation | Formula / procedure | Unit | Cost | First use |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | connectivity | convex / axial / dual | `deg(i) = Σ_j (A)_ij` | count | O(V+E) | AG-10, SA-03 |
| 2 | depth, mean depth | same | `D(i)=Σ_j d_ij`, `ℓ = D/(N−1)` | steps | O(VE) | AG-10, SA-03 |
| 3 | integration (raw / normalised) | same | `1/ℓ`; `RRA = 2(ℓ−1)/(D_N(N−2))` | 1/steps; dimensionless | O(VE) | SA-03 |
| 4 | choice / traffic | segment or dual | `½[(N−1)² − Σ s_a²]` on trees; Brandes generally | share | O(VE) | SA-04, SA-27 |
| 5 | control | convex / dual | `Σ_{i∼j} 1/deg(j)` | dimensionless | O(E) | SA-05 |
| 6 | ringness / α | any | `(e−n+p)/(2n−5)` | 0–1 | O(V+E) | AG-14, SA-21 |
| 7 | isovist area / openness | vga / point | shoelace on ray endpoints; `A/(π r_max²)` | tiles², m²; 0–1 | O(cells·K) | SA-06, SA-07 |
| 8 | enclosure (visual) | point | `1 − openness` | 0–1 | free from 7 | SA-16 |
| 9 | isoperimetric quotient | point | `4πA/P²` | 0–1 | free from 7 | SA-07 |
| 10 | elongation, circularity proxy | point | `r_max/r_min`; `1 − σ_r/μ_r` | 0–1, ≥1 | free from 7 | SA-07 |
| 11 | covisibility | vga | Jaccard of visible-cell sets | 0–1 | bitset popcount | SA-09 |
| 12 | VGA nodes | vga | merge contiguous equal-visible-set cells | count + ratio | O(cells·α) | SA-08 |
| 13 | movement estimate | segment + attraction | regression on integration × attraction | persons/time | O(n) | SA-10 |
| 14 | tile flow / strain | dual skeleton | path accumulation ÷ AG-12 capacity | dimensionless | O(OD·V log V) | SA-12 |
| 15 | bottleneck | dual | min-cut (AG-12) + strain top decile | persons/time | O(V E²) | SA-12 |
| 16 | trip length, detour index | dual | `L_actual/L_octile` | 1, m | from 14 | SA-13 |
| 17 | density, occupancy | dual | `N = Q×T`, then HB-01 band | persons, p/tile² | O(1) | SA-14 |
| 18 | wayfinding load | dual + tags | `Σ(1 − asymmetry)` per route | count | O(#nodes) | SA-15 |
| 19 | prospect / refuge | point + fixtures | `openness×r_max`; `enclosure×back` | dimensionless | O(#seats·K) | SA-18 |
| 20 | intelligibility | convex | Spearman(`deg`, `integration`) | ρ | O(N log N) | SA-19 |
| 21 | landmark gap | dual + vga | BFS to nearest tag change in view | tiles, m | O(#nodes) | SA-19 |
| 22 | façade complexity | raster elevation | box-count `D`, with `R²_fit` gate | dimension | O(scales·cells²) | SA-17 |
| 23 | catchment isochrone | site graph | Dijkstra at `length/v_eff` | min, ha | O(E log V) | SA-20 |
| 24 | permeability indices | site graph | `α, β, γ`, node/link/intersection density | per ha, km/km² | O(V+E) | SA-21 |
| 25 | aperture angle | any | `2·atan(0.5w / 2d)` | rad, ° | O(#doors) | SA-22 |
| 26 | 3D rank divergence | multi-floor | `|rank_3D − rank_floor|` | positions | 2 runs of 3/4 | SA-23 |
| 27 | angular integration / choice | segment or dual, angle-weighted | mean depth on `Σ` turning penalty, then SA-03/SA-04 | 1/steps; share | O(VE) | SA-29 |
| 28 | stability | any | leave-one-out perturbation sweep; `rank_flip_count`, `band_flip_count` | count | O(perturbations) | SA-30 |

## Interpretation bands

Behavioural readings are `HEURISTIC`; the reference-graph values are computed arithmetic (`FACT`) and are the only defensible baseline (SA-11, SA-24). Star/line values are `RRA` from Eq. 5–6.

| Metric | Reference / band | Value at | Read as |
| --- | --- | --- | --- |
| RRA (N=7) | star centre / star leaf / line middle / line end | 0 / 0.98 / 1.18 / 2.94 | the floor and ceiling of "central" for a 7-space plan |
| RRA (N=13) | `D_N = 0.2755`, multiplier 0.660 | — | same plan at 13 rooms reads ~44 % lower: never compare unnormalised |
| integration_raw, worked floor (SA-26) | spine 0.750 / 0.667 vs far rooms 0.429 | C1 vs R3/R4 | revenue space at the segregated end |
| choice | 0.80 / 0.60 on the two spine nodes, 0 at every leaf (SA-27) | C1, C2, L | flow concentrates on the spine; entrance has none |
| openness / enclosure | 0.85+ hall; 0.4–0.6 corridor; <0.1 cave | per point | `cave_route` at mean enclosure > 0.9 (SA-25) |
| isoperimetric quotient | 1 disc; ~0.03 one-tile corridor | analytic | shape index only; not a quality score |
| covisibility (Jaccard) | 0.6 same room; 0.05–0.2 through a door slot | derived | below 0.05 = no functional supervision (HB-18) |
| aperture angle | 2.9° (1 tile at 10 m) vs 22.6° (4 tiles at 5 m) | trig | a 2-tile door below ~10 m is not a view |
| detour index p90 | 1.0 ideal; >1.3 routing defect; >2 suspect | derived | too-good values mean wall leakage |
| ringness ρ / α | 0 tree; ≥0.25 public skeleton (AG-14) | computed | `no_circuit` flag on public routes |
| Spearman(publicness, integration) | ≥0.6 pass (AG-10/TH-20) | plan-level | below = zoning and configuration disagree |
| movement r (published) | integration 0.60; angular integration 0.57; choice 0.51 | Nag et al. 2022, street segments, 30-min counts | ~25–36 % of variance: one input, not a verdict |
| intelligibility ρ | >0.6 legible-local-cue plan, with twin-class check | derived | high + few twins = navigable monotony |
| façade box-count D | bounded [1,2] by definition; typical architectural range unverified | gate `R²_fit ≥ 0.95`, ≥5 scales | report D only with the fit and scale span |

## Grid computation recipes

R1 — per-floor metric store (one pass, in order): `flood-fill rooms → tag; extract skeleton (corridor centreline, junctions); build G_acc(role) (AG-15); degrees; BFS all-pairs → D, ℓ, integration, RRA (SA-03); Brandes → choice, control (SA-04/05); Tarjan → cut vertices, bridges, block–cut (AG-13); μ, ρ (AG-14); min-cut with AG-12 capacities (SA-12).`

R2 — isovist field (SA-06/07):
```
for each sample tile s (stride 2 or 4 tiles), for k in 0..K-1:
    θ = 2πk/K; march supercover ray from s until blocked or r_max; r[k] = distance
A = shoelace(ray endpoints); P = Σ|edge|; openness = A/(π·r_max²); enclosure = 1 − openness
Q_r = sorted(r); elongation = Q_r[K-1]/Q_r[0]; circularity_proxy = 1 − std(r)/mean(r)
occlusion_breaks = runs of rays with r[k] < 0.5·r_max
```
Declare `K`, `r_max`, stride, and the occluder layer (walls only vs walls+furniture) in the record.

R3 — VGA (SA-08/09): visible-cell bitset per sample; hash; union-find merge of 4-neighbours with equal hash (or Jaccard ≥ 0.9); graph = merges + shared boundaries; covisibility = popcount AND / OR.

R4 — flow and crowd (SA-12/13/14): OD demand from the programme, aggregated by AG-20 twin classes; A* per pair on the role graph; accumulate into `flow[tile]`; `strain = flow/capacity`; `detour = A* cost / octile optimum`; occupancy by `N = Q×T` → HB-01 band.

R5 — perceptual (SA-15/16/17/18/19): decision nodes from the skeleton; isovists at stations and decision nodes; box-count on the elevation raster (scales 1,2,4,8,16,32 tiles, `R²_fit` gate); intelligibility = Spearman(`deg`, `integration`) with the twin-class count attached.

R6 — site (SA-20/21): aggregate 20×20 tiles → 10 m cells; derive site graph; isochrones at declared `v_eff`; then α/β/γ and node/link/intersection densities, cross-checked against the building's per-role traverse rights (AG-15).

R7 — multi-floor (SA-23): stack per-floor graphs with portal edges costing `queue_ticks + travel_ticks`; re-run R1 on the 3D graph; emit per-floor vs 3D rank divergence; visibility is not stacked (SA-22/SA-23).

## Sources

T2 — peer-reviewed, full text opened (source of every formula and figure quoted in the rules):

1. Volchenkov & Blanchard, "Scaling and Universality in City Space Syntax" — https://arxiv.org/html/0709.4375v1 — **T2, opened**. Eqs. 2–8 quoted verbatim in SA-03/04/05: `deg(i) = Σ_j (A_G)_ij`, `D_i = Σ_j d_ij`, `l_i = D_i/(N−1)`, `RRA(i) = 2(l_i − 1)/(D_N(N − 2))`, `D_N = 2[N(log2((N+2)/3) − 1) + 1]/((N−1)(N−2))`, `CV(i) = Σ_{i~j} 1/deg(j)`, `Choice(i) = {#shortest paths through i}/{#all shortest paths}`; the depth definition's attribution to Klarqvist 1993 (ref. [12]); and the confirmed *absence* of any "integration = 1/RRA" statement.
2. Nag, D., Sen, J. & Goswami, A.K., "Measuring Connectivity of Pedestrian Street Networks in the Built Environment for Walking: A Space-Syntax Approach", *Transportation in Developing Economies* 8(2), 2022 — https://pmc.ncbi.nlm.nih.gov/articles/PMC9299754/ (DOI 10.1007/s40890-022-00170-7, metadata verified via Crossref) — **T2, opened**. Source of: integration = "a link's destination potential", choice = "its route selection probability", connectivity = "cumulative turning angles toward neighboring segments"; the movement correlations `r = 0.60` (normalised integration), `r = 0.57` (normalised angular integration), `r = 0.51` (choice) against 30-minute foot counts; methods (Douglas-Peucker simplification, Pearson, stepwise OLS, path modelling by MLE); and the limitations quoted in SA-11, incl. "researchers have failed to define benchmark values for 'good' connectivity".

T2 — metadata verified through Crossref, body NOT read (cited as existence + bibliography only):

3. Turner, A., Doxa, M., O'Sullivan, D. & Penn, A., "From Isovists to Visibility Graphs: A Methodology for the Analysis of Architectural Space", *Environment and Planning B: Planning and Design* 28(1):103–121, 2001, DOI 10.1068/b2684 — **T2, title/volume/pages verified; no content extracted**.
4. Scoppa, M. & Anabtawi, R., "Connectivity in Superblock Street Networks: Measuring Distance, Directness, and the Diversity of Pedestrian Paths", *Sustainability* 13(24):13862, 2021, DOI 10.3390/su132413862 — **T2, metadata verified; no content extracted**.

T4 — encyclopaedic, opened, not elevated (used for definitional framing and for the method's own listed criticisms):

5. Wikipedia, *Space syntax* — https://en.wikipedia.org/wiki/Space_syntax — **T4, opened**. Axial = straight sight-lines, convex = polygon of mutually visible interior points, integration = "the amount of street-to-street transitions needed from a street segment, to reach all other street segments", choice models proportional flow division; criticisms recorded there: contested mathematical properties of axial mapping, bias toward long straight corridors, and calls to merge the method with transport engineering/GIS.
6. Wikipedia, *Isovist* — https://en.wikipedia.org/wiki/Isovist — **T4, opened**. "The volume of space visible from a given point in space"; coined by Clifford Tandy 1967, developed by Michael Benedikt; visibility graphs used for intervisibility and movement forecasting; states that numerical isovist measures exist but gives no formulas.

T3/T4 — located by search, content NOT obtained (title-level evidence only, per SA-17):

7. "Fractal Dimensional Analysis of Building Facades: The Case of Office Buildings in Erbil City", *Fractal and Fractional* 8(12):746, 2024 — https://www.mdpi.com/2504-3110/8/12/746 — **T3, title only (fetch 403)**.
8. "Fractal Analysis of Façades of Historical Public Buildings with Box Count Method: The Case of Afyonkarahisar", IntechOpen chapter — https://www.intechopen.com/chapters/1137308 — **T4, title only (page returned scripts)**.

Intra-repo — this skill's own audited evidence, cross-referenced by rule ID rather than re-opened or restated:

9. `adjacency-graphs.md` AG-09, AG-10, AG-11, AG-12, AG-13, AG-14, AG-15, AG-16, AG-20, AG-23, AG-24, its graph specification, derived constants and Weak-or-contested section; `architecture-theory.md` TH-02, TH-11, TH-14, TH-19, TH-20 and its Weak-or-contested section; `human-behavior.md` HB-01, HB-02, HB-06, HB-08, HB-09, HB-10, HB-12, HB-13, HB-17, HB-18, HB-19, HB-25; `multi-scale.md` MS-16, MS-23, MS-24; `floor-plans.md` FP-04, FP-15, FP-22; `validation.md` VA-03, VA-08, VA-14, VA-15, VA-18; `bim-cad.md` BIM-20 citation set and representation table; `site-context.md` desire-line and edge-intensity recipes; `design-alternatives.md` / `decision-making.md` trade-off ledgers. Space-syntax primary works (Hillier & Hanson 1984; Hillier 1996; Hillier et al. 1993; Klarqvist 1993; Freeman 1977; Brandes 2001; Turner 2004; Penn et al. 1997) reach this file only through those audited entries and are not independently verified here.

Blocked this pass — no content obtained, nothing in this file rests on them:

10. https://www.mdpi.com/2071-1050/13/6/3394 ("Bill Hillier's Legacy: Space Syntax — A Synopsis of Basic Concepts, Measures and Empirical Application") — HTTP 403 on both the root and `/htm`.
11. https://www.spacesyntax.online/glossary/ — served a navigation shell with no definitions.
12. https://isovists.org/user-guide/4-2-3-compactness/ — served CSS/JS only.
13. https://discovery.ucl.ac.uk/3261/1/3261.pdf ("The theory of natural movement and its application to the simulation…") — PDF streams undecodable.
14. https://research.uca.ac.uk/6585/1/Isovist_UserGuide_1-7.pdf (Isovist_App manual) — PDF streams undecodable.
15. https://www.gdmc.nl/publications/2017/Evaluate_visibility_indoor_path_point_cloud_representation.pdf — PDF streams undecodable.
16. https://www.movementandplace.nsw.gov.au/place-and-network/built-environment-indicators/permeability — HTTP 403 (the one candidate Tier-1 numeric source for SA-21).
17. Semantic Scholar API — HTTP 429; bibliographic verification was done through Crossref instead.
## Weak or contested

- **The exact integration normalisation.** Verified and used: Eq. 5–6 of the opened arXiv source (`RRA = 2(ℓ−1)/(D_N(N−2))`, `D_N = 2[N(log₂((N+2)/3)−1)+1]/((N−1)(N−2))`), consistent with this repo's AG-10. NEEDS VERIFICATION: the form quoted in the commissioning brief, `RRA = 3(M−1)(k−2)/((n−2)(n−1))` — no primary source reproducing it was opened, and as transcribed it fails a basic sanity test (evaluated on a 7-node star centre with `M = 6` it returns 2.5, where an asymmetry measure must be at its *minimum*; on the same star's leaf it returns a value below the centre's). Check the Hillier & Hanson pp.111–113 original (the page reference this repo carries) for the exact numerator constant and for which quantity `M` and `k` denote (total depth and sub-system size respectively, apparently), and re-check whether the published measure divides by `D_N` at all. Until then this file uses Eq. 5–6 only.
- **Which paper is "the VGA methodology".** Resolved by Crossref metadata: Turner, Doxa, O'Sullivan & Penn 2001, E&P B 28(1):103–121. The brief's alternative title, "Color Merging and Topological Information in Visual Graphs", returned no matching record in the Crossref query performed — NEEDS VERIFICATION (it may be a chapter/section title, or a differently-worded paper by Turner). Do not cite it as the source of the merge algorithm. The merge criterion used in SA-08 is this file's definition, not the paper's.
- **Isovist measure names and their formulas.** Unverified as a set: compactness, squareness, skewness, occlusivity, circularity. Every formula in SA-07 is defined *here* and labelled as such; none may be attributed to Benedikt, Routhledge, Turnbee or the Isovist_App manual until a text source is opened. This is the file's largest known-unknown.
- **Natural movement beyond the published r values.** Only one opened empirical study with figures is cited (street segments, 30-minute counts, `r ≤ 0.60`). NEEDS VERIFICATION: the interior/building scale evidence, and the classic London/Rio/Barcelona case figures — the two candidate sources both resisted retrieval. Space-syntax prediction inside buildings is already rated Low-Medium in this repo (TH-20, AG-10, `architecture-theory.md` ## Weak or contested); this file does not upgrade it.
- **Ringfugle.** Not defined here at all — no opened definition found (the online glossary served no definitions). Either verify via Klarqvist 1993 / H&H 1984 and add it, or drop the word.
- **All perceptual bands.** Prospect/refuge pairing (SA-18), wayfinding load (SA-15), enclosure bands (SA-16/25), the fractal preference literature (SA-17) are formulations or unopened evidence: `HEURISTIC`, project-settable, and must be reported as such. The commonly repeated claim that preferred façades sit near `D ≈ 1.3–1.7` is explicitly *not* asserted here.
- **Site thresholds.** Intersection/link/node density targets and permeability benchmarks: no Tier-1 numeric source opened this pass (NSW 403, PDFs undecodable). NEEDS VERIFICATION against a national guidance document before any site flag is treated as a standard.
- **Cost on large grids.** SA-12/SA-13 explicitly recommend skeleton reduction because tile-level all-pairs analysis is O(V²) and a 20-floor tower at 40×25 tiles per floor is ~20 000 nodes: the numbers in this file are only honest if the reader knows whether they came from the skeleton or the full grid.

## Type-specificity audit

- **Multi-floor hotel (flagship).** The whole metric vector applies; the decisive ones are SA-23 (3D rank divergence — the mezzanine problem), SA-04/SA-27 (choice concentrates on the spine; leaf rooms get zero), SA-15/SA-19 (wayfinding load and landmark gap for guests, who have no mental map), SA-14 (lift-discharge occupancy via MS-23's batch arrival), SA-09/SA-22 (arrival viewshed of the desk and the restaurant; door-slot caveats). Type-specific bands: guest-facing enclosure should stay in the hall/lobby band and only the back-of-house may run >0.9; `publicness_inverted` is the single most expensive error here because it costs revenue square metres.
- **Office floor.** Choice/betweenness readings shift: circulation is intentionally thin, so the `no_through_flow` flag fires on atria and meeting clusters rather than corridors; prospect-refuge and enclosure (SA-16/SA-18) matter for workspace, and `intelligibility` (SA-19) is the primary wayfinding metric because layouts repeat floor to floor (AG-20's twin classes inflate the monotony check — report it).
- **Hospital.** Threshold depth (AG-11) and per-role graphs (AG-15) outrank integration; control (SA-05) becomes the safety metric (single-corridor dependency); covisibility (SA-09) is the supervision/nurse-station standard, and the HB-17/HB-18 sightline/proxemic rules govern before any isovist number. Infection-control separations are code-side (CODE-*) and no metric here may be used to trade them away.
- **Retail / public concession.** The only place this file's *predictive* half (SA-10) earns its keep, and even there only at segment scale with the published `r` reported; unit-rent claims from integration alone are out of evidence here (HB-25's contested note).
- **School / civic.** Decision-point asymmetry (SA-15) and landmark gap (SA-19) dominate; corridor enclosure bands differ (open-sided galleries are good and will trip the `cave_route` threshold as written for hotels — recalibrate).
- **Industrial / plant.** Integration is nearly meaningless on a flow line (AG's type note); use min-cut strain (SA-12), threshold depth for contamination (AG-11), and skip the perceptual set entirely — the vector of SA-28 must be reweighted, not reused.
- **Site/masterplan.** Only SA-20/SA-21 are native, plus SA-13's trip statistics; everything per-floor must be aggregated to a coarse cell, and every isochrone must respect per-role traverse rights or it is measuring a shortcut the public cannot use.

