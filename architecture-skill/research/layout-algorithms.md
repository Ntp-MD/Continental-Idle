# Research file — Domain Y: Computational layout generation algorithms

Scope: how a layout is **solved**, not how it is described. This is the computable layer sitting
under the qualitative domains: given a programme, a relationship matrix and a plate, which
algorithm family can actually turn those into tile geometry, what it needs as input, what
guarantee it gives back, and how it fails. It deliberately does not restate the relationship
vocabulary (AG-02 four predicate types, AG-06 six-grade closeness scale, AG-17 infeasible pattern
classes, AG-18 minimal-conflict repair), the dimensional translation (GT-01 grid as coordination
system, GT-05 ceil-on-minima, GT-07 remainder absorption), the plan-level facts (FP-02 derive the
graph first, FP-03 topology primary, FP-05/FP-06 area and aspect bands, FP-15 exclusive tile
ownership, FP-18 IoU/GED validation), the failure taxonomy (FL-01…FL-28) or the validation loop
(VA-01 oracle first, VA-14 re-validate the blast radius). Where a rule here needs one of those, it
cites the ID and adds only the algorithm underneath it. Everything below is written against the
host datum `1 tile = 0.5 m`, one 2D grid per floor, tile states `walkable | blocked | door`.
Evidence tiering note: this domain's sources are almost entirely T2/T3 (computer-science literature and
library documentation), so "well sourced" here means an algorithm paper or vendor doc demonstrates the
mechanism — never that a professional body requires the outcome, and a generative model's benchmark
numbers are its benchmark numbers, not design constants.

## Rules

### LA-01 Choose the generator family by the input you can actually produce, not by the output you want
- Rule: Before generating anything, write down the family's **input contract** and check you can honour it: a shape grammar needs an authored rule set; a slicing tree needs a rectangle-only programme and a guillotine-tolerant parti; a CP/MILP solver needs every requirement expressed as an integer constraint; annealing needs a cost function that ranks layouts correctly; a learned generator needs training data of the same building type. If the contract cannot be honoured, the family is wrong and the output will be silently wrong, not loudly wrong.
- Evidence: The opened review of the field states the split directly: conventional pipelines use "optimization techniques or heuristic design guidelines" but they "usually require post-processing and involve human interaction", while contemporary ones shift to data-driven synthesis because "deep generative models have significantly improved the fidelity and diversity" (S11, abstract read; the review's body was **not** retrieved, so this is a T2 abstract, not a read taxonomy). The post-processing clause is the load-bearing part: every family below produces something that needs a human or a validator to finish, and a rule that pretends otherwise describes a tool that does not exist.
- Source: S11 Liu, Xue, Ni, Yu, Zhou, Huang, "Computer-aided layout generation for building design: A review", Computational Visual Media (2025) https://www.sciopen.com/article/10.26599/CVM.2025.9450484 — T2 (abstract only).
- Class: DESIGN PRINCIPLE
- Scope: universal — governs the choice at every point of the generation ladder
- Confidence: Medium (the mechanism is well stated by a T2 review; only its abstract was read, so no clause-level taxonomy is inherited from it)
- Grid translation: Record the contract in the run header: `generator=slicing-tree; input=rect-programme+plate; guarantee=feasible-not-optimal; postprocess=FP-06 aspect lint`. On the host grid the practical discriminator is whether the requirement set is enumerable as tile-integer constraints (→ CP, LA-13…LA-19) or only as a ranking (→ annealing, LA-20…LA-22).
- Exceptions / failure mode: Symptom of a violated contract: a CP model that "keeps going infeasible" because half the programme is soft preference, or a learned residential generator handed a hotel floor (FP-19's quarantine rule is the behavioural guard). Mixed contracts are legitimate — BuildingBlock (S4) is explicitly "a hybrid approach that integrates generative models, procedural content generation (PCG), and large language models (LLMs)" — but each stage must still be able to state its own input.

### LA-02 Publish the derivation trace, not just the result: a generated plan is a sequence of rule applications
- Rule: Any rule-based (grammar) generator must emit the ordered list of rules that fired, with the parameters each fired under, alongside the geometry. A plan whose derivation cannot be replayed is unfixable, because a repair is a change to a rule, not to a pixel.
- Evidence: The procedural-building literature makes the derivation the unit of design: the SIGGRAPH 2006 record read this pass describes **CGA shape, "a novel shape grammar"**, whose purpose is to "specify interactions between the entities of the hierarchical shape descriptions" and which "produces building shells with high visual quality and geometric detail" (S1). The hierarchical shape description *is* the trace: each node exists because a rule split its parent. `NEEDS VERIFICATION:` the canonical formal rule shape (a rule written `L → R` with both sides being shapes, applied where `L` matches a subshape, in a derivation `S₀ ⇒ S₁ ⇒ … ⇒ Sₙ`) could not be read this pass — the MIT Liew & Müller PDF the corpus cited returned only undecoded compressed streams. Obtain the body of Liew & Müller's descriptive-conventions paper, or Stiny's original grammar definition, before this rule is quoted as a definition rather than as a paraphrase.
- Source: S1 Müller, Wonka, Haegler, Ulmer, Van Gool, "Procedural modeling of buildings", ACM SIGGRAPH 2006 — record + abstract https://asu.elsevierpure.com/en/publications/procedural-modeling-of-buildings/ — T2. Liew & Müller https://web.mit.edu/haldane/www/publications/liewh-2002-descriptive_conventions.pdf — **not read this pass** (PDF stream undecoded).
- Class: CODE REQUIREMENT
- Scope: all grammar and scripted-procedural generators; any generator that can be re-run
- Confidence: Medium-High (the grammar basis is a read T2 record; the notation-level detail is a paraphrase pending a read of the primary grammar literature)
- Grid translation: Store the derivation as an append-only log of `(rule_id, parent_tile_bbox, params, resulting_tile_rects)`, keyed in tiles; re-running the log against the same plate must reproduce the identical tile mask (bit-exact, per VA-23's reproducibility fields). This is what lets FL-05 leftover tiles be traced back to a specific cut rule instead of being re-drawn.
- Exceptions / failure mode: Non-deterministic generators (annealing without a seed, ML sampling) break the rule unless the seed/sample index is logged; then the trace is `(seed, iteration)` instead of `(rule, params)`. Symptom without a trace: a fixed bug in one room cannot be confirmed fixed on the next 40 floors.

### LA-03 A grammar's expressive power is its condition language, so enumerate rule arity and guards explicitly
- Rule: When authoring a rule set, state for each rule which of four things it reads — geometry, parameters, context/attributes, and a guard condition — and forbid an unguarded rule from matching more than one declared parent shape class. Unguarded rules are the grammar equivalent of an unbounded loop.
- Evidence: The CGA shape record read here describes exactly this mechanism as the differentiator over earlier systems: hierarchical shape descriptions plus directives that "specify interactions between the entities" — i.e. context-sensitive, conditional rules rather than context-free rewriting (S1). BuildingBlock (S4, opened) reaches the same conclusion from the other direction: its procedural stage encodes "attachment logic and material properties" in "rule-based hierarchical trees", and its documented failure is that "style specification may misalign when requested aesthetics exceed library boundaries, causing fallback to nearest compatible assets" — an unguarded rule matching where it should not.
- Source: S1 — T2; S4 Huang, Wang, Li, Huang, Dai, Xu, "BuildingBlock: A Hybrid Approach for Structured Building Generation", arXiv:2505.04051v1 (2025) https://arxiv.org/html/2505.04051v1 — T2 (preprint, full text read).
- Class: ENGINEERING CONSTRAINT
- Scope: grammar/procedural generators; also applies to any if-this-then-place heuristic ladder
- Confidence: Medium (mechanism corroborated by two opened sources; the "forbid unguarded rules" prohibition is this project's discipline, not a published finding)
- Grid translation: Each rule carries `guard: {parent_class, min_w_tiles, min_h_tiles, floor_band, orientation}` and the engine refuses a rule whose guard is empty on a shared shape class. Because a tile is a 500 mm tolerance zone (GT-01), the guard's min dimensions must be stated in tiles *after* rounding, not in millimetres before it.
- Exceptions / failure mode: Symptom is rule oscillation — two rules repeatedly firing on the same region — or a plan where every room is the same module because the first-guarded rule always wins. Detect by counting firings per rule per floor; a rule that fires >60 % of the time in a mixed programme is under-guarded.

### LA-04 Do not use a grammar to solve adjacency: a grammar encodes style, a constraint solver encodes relationships
- Rule: Use grammars for what repeats and what looks right (module typology, façade rhythm, structural bay discipline, circulation organisation), and use a constraint or search layer for the relationship matrix. Never encode an AG-02 must/should/never set as grammar guards and expect it to be satisfiable.
- Evidence: The opened procedural record positions the grammar at the shape/appearance level — "building shells with high visual quality and geometric detail" and volumetric consistency — and its scalability claim is a *fabrication-cost* claim ("at low cost" scene fabrication), not a feasibility claim (S1). Conversely Bao et al. treat "good building layouts" as those that "conform to regulatory guidelines, while meeting certain quality measures" and attack that with **constrained optimization**, keywords "Computational design, Constrained optimization, Layout exploration, Local variations, Shape space" (S2, abstract read). The division of labour is in the literature: grammar for the shape space, optimisation for the constraint set.
- Source: S1 — T2; S2 Bao, Yan, Mitra, Wonka, "Generating and exploring good building layouts", ACM Transactions on Graphics 32(6) (2013) https://asu.elsevierpure.com/en/publications/generating-and-exploring-good-building-layouts/ — T2 (abstract read; body unread).
- Class: DESIGN PRINCIPLE
- Scope: universal; strongest in multi-floor repetitive types (hotel, school, cell-based prison, ward)
- Confidence: Medium-High (two opened T2 records agree on the split; neither proves it for the host engine)
- Grid translation: Grammar stage emits *candidate module footprints* in tiles (e.g. "guest module 8×15 tiles + 3-tile coordination cell, GT-03"); the constraint stage places those candidates against AG-02/AG-06 relationships. Keep them as two artefacts so a style change never invalidates a feasibility result.
- Exceptions / failure mode: Symptom: a grammatically beautiful plan that fails AG-11 door-count privacy or AG-12 min-cut capacity, and no repair lever exists because the grammar has no notion of cost. See FL-11/FL-13 for the behavioural names of that outcome.

### LA-05 Budget rule authoring as the real cost of a grammar system
- Rule: Estimate and report the authoring cost of a generator before adopting it: a grammar costs person-hours of rule writing per style variant, a CP model costs constraint writing per requirement change, an annealing cost function costs re-tuning per programme, and a learned model costs data it does not have. Choose the family whose recurring cost falls on the thing that changes least in this project.
- Evidence: Explicit in the opened hybrid source: "traditional procedural systems require extensive manual scripting and offer poor stylistic diversity", which is the stated motivation for adding generative and LLM stages (S4). The same source's dataset is a proprietary "Blocks archive containing 1.2k buildings and 42k components" — the authoring cost simply moved from rules to data. The SIGGRAPH record's counter-claim is about run-time economy, not authoring economy: extensive scene fabrication "at low cost" (S1).
- Source: S4 — T2; S1 — T2.
- Class: HEURISTIC / DESIGN PRINCIPLE
- Scope: tooling decisions at project start; re-checked whenever the programme type changes
- Confidence: Medium (both claims are quoted from opened sources; the ranking of one family's cost against another's is not measured anywhere read here)
- Grid translation: Count artefacts, not feelings: `rules=…, constraints=…, cost_terms=…, training_samples=…` per generator revision, and diff them across design rounds. A generator whose constraint count grows every round is absorbing programme drift that should have been settled in the space programme (TH-01, SP-01).
- Exceptions / failure mode: Symptom of the ignored rule: a one-off hotel where an agent hand-authors 60 grammar rules to produce 3 floors, then the client changes the room type and the whole set retunes.

### LA-06 Represent a rectangular dissection as a tree, and treat the tree as the genotype
- Rule: For rectangle-only programmes, encode the dissection as a binary slicing tree whose internal nodes are horizontal or vertical composition operators and whose leaves are rooms; all search, crossover and repair operate on the tree, and geometry is produced only by decoding it. Never mutate tile coordinates directly.
- Evidence: The opened rectilinear-floorplanning source models topology as "spine-based slicing trees" and searches by "performing horizontal and vertical swaps on the spine of a slicing structure", precisely to avoid rebuilding structures during search (S5). The same source's own framing sentence for the problem is the packing statement: rectangular blocks into a fixed-area boundary while optimising a performance metric. The postfix/tree-string encoding the corpus cited from a figure page could **not** be read this pass — `NEEDS VERIFICATION:` the "skewed slicing tree → normalized postfix expression" correspondence (ResearchGate figure `…_fig1_220701789`, HTTP 403) and the IJCA paper that carries it (`research.ijcaonline.org/volume71/number15/pxc3888962.pdf`, returned only undecoded PDF streams). Obtain the IJCA paper's full text, or any standard VLSI floorplanning chapter, before printing a postfix encoding as a worked example.
- Source: S5 arXiv:cs/0611107 (rectilinear floorplanning with spine-based slicing trees; **bibliographic record — authors/title/year — not retrievable from the PDF stream**) https://arxiv.org/pdf/cs/0611107 — T2, record incomplete. Slicing-tree/postfix sources — **unread this pass** (403 and undecoded stream respectively).
- Class: STANDARD (representation convention) / FACT (about the cited sources)
- Scope: rectangle-only layouts; any generator that needs a neighbourhood operator
- Confidence: Medium-High on the tree-as-genotype mechanism (read in S5); **Low on the postfix encoding** (source never opened).
- Grid translation: Decode the tree by recursive splitting of an integer tile rectangle: `split(rect, axis, frac)` with both children's areas whole in tiles² — which forces the cut position onto a tile boundary and therefore onto a 500 mm multiple, and is where GT-05/GT-06 rounding enters the generator rather than the drawing. Room area is then `w_tiles × h_tiles × 0.25 m²` (GT-derived constant: 4 tiles² = 1 m²) and must be re-measured, not inherited from the requested m² (FP-05, SP-19).
- Exceptions / failure mode: Any L-shaped or non-rectangular room, or a plan with a corridor that penetrates a module, breaks the representation — the decoder will emit a sliver or an overlap. Observable symptom after the fact: FL-05 leftover tiles and FP-15 exclusive-ownership violations.

### LA-07 State which side of the slicing-completeness dispute you are on, and name the escape hatch
- Rule: The corpus contains two contradictory published claims about whether slicing trees cover all rectangular layouts. Take a position per project, print it, and if the plan needs a non-sliceable configuration either (a) switch representation or (b) declare the geometric "slight modification" that made it sliceable. Never let a generator do the modification silently.
- Evidence: One opened source states flatly: "Non-sliceable floor plans cannot be represented by slicing trees", and answers the gap by classifying the exceptions as "pseudo-sliceable floor plans that can be converted to sliceable ones by slight modifications" (S5, PDF text read). Another opened record is titled, as a thesis statement, "Slicing Tree Is a Complete Floorplan Representation" — Lai and D. F. Wong, DATE 2001 (S6; the PDF's title/authors are readable, its **body is in compressed streams and the theorem statement was not retrieved**, so the sense in which completeness is claimed — exact topology vs adjacency-preserving equivalence class — is unknown here). The two are not reconcilable from what was read, which is precisely why the rule requires a declared position.
- Source: S5 — T2; S6 Lai & Wong, "Slicing Tree Is a Complete Floorplan Representation", DATE 2001 https://past.date-conference.com/proceedings-archive/2001/DATE01/PDFFILES/04F_1.PDF — T2 (title/venue read, body unread).
- Class: FACT (that the dispute exists, with both texts opened) / DESIGN PRINCIPLE (the disclosure requirement)
- Scope: any slicing-tree generator
- Confidence: High that both claims are published as quoted; **Low on which is correct under which definitions** — the Lai & Wong proof was not read.
- Grid translation: A non-sliceable core (pinwheel/windmill around a central hall) on a 0.5 m grid becomes sliceable only by moving one wall by ≥1 tile = 500 mm. That is a real dimensional change, so the escape hatch must be booked as a GT-04 dual-scale row with `policy` and `error_mm`, and the plan stamped `topology=sliceable-adjusted`.
- Exceptions / failure mode: Symptom of the silent version: the generated plan is 40 mm off a stated room dimension and nobody can say why; or the plan is *visually* the requested pinwheel but the graph no longer matches AG-19's faithful-dual check because one adjacency was bought with a wall shift.

### LA-08 Guillotine generators cannot express a courtyard, and will fake one with slivers
- Rule: Any generator whose splits are recursive full-width cuts (slicing tree, guillotine packing, most naive BSP layout) must be declared as guillotine-bounded, and plans requiring enclosure (courtyard, atrium, light well, core ring) must be routed to a representation that permits cycles in the adjacency graph.
- Evidence: Direct consequence of the S5 statement that non-sliceable plans are not representable at all, read above; the same source's remedy is geometric modification rather than representation change. Nothing read here defines a "guillotine" cut formally, so the term is used in its engineering sense (each cut spans the current rectangle) and marked for confirmation against a textbook definition.
- Source: S5 — T2. Mechanism corroborated by S6's existence claim (a completeness result is only worth publishing if the naive reading is false).
- Class: ENGINEERING CONSTRAINT
- Scope: representation choice; applies to every rectangular dissection generator
- Confidence: Medium-High
- Grid translation: On the host grid the tell is arithmetic: a courtyard floor needs the sum of room tile areas plus the courtyard tile area plus wall tiles to equal the plate, with a hole in the mask. A guillotine decoder cannot emit a hole; it emits either an overlapped rectangle (FP-15 violation) or a ring of slivers (FL-05). Detect by testing whether the plan mask has a bounded component of non-room tiles that is not circulation.
- Exceptions / failure mode: Legitimate exception: a courtyard modelled as a *room* leaf (label it `courtyard`, give it its own area row) is sliceable and honest. Do not do this if the courtyard must be non-rectangular.

### LA-09 Define the neighbourhood operators before the objective function
- Rule: For any local-search generator, publish the move set first (rotate node, swap subtrees, resize leaf, relocate leaf, spine permutation) and only then the cost function; a cost function whose optimum is unreachable by the moves is dead weight, and the same cost function under different moves gives different answers, so neither is interpretable alone.
- Evidence: S5's contribution is exactly this ordering: it introduces a representation whose moves are "directional permutations along the spine" so that successor states are produced "without rebuilding full graph structures", and reports "accelerated convergence and higher-quality layouts compared to conventional representation schemes" with SA as the outer optimiser ("Experimental results using simulated annealing demonstrate the effectiveness of our approach"). The comparison is against another *representation*, not another objective — which is the point.
- Source: S5 — T2.
- Class: CODE REQUIREMENT
- Scope: SA, hill-climbing, GA, and any agent that edits a plan step by step
- Confidence: Medium-High on the mechanism; **the convergence/quality numbers themselves were not retrievable** from the PDF body.
- Grid translation: Every move must be tile-integer and reversible: a resize is `±1 tile` on one axis, never a fractional-metre nudge, so a move sequence is diffable and replayable (LA-02). Declare the move set in the run header as `moves={rotate,swap,resize±1t,relocate}`.
- Exceptions / failure mode: Symptom: cost plateaus at a value the designer knows is beatable and the search never leaves it, because the only improving change requires two simultaneous moves. That is a move-set gap, not a temperature problem — see LA-21's reannealing clause and AG-18's repair levers.

### LA-10 Solve layout as a graph-to-geometry problem and keep both artefacts separate
- Rule: Maintain the room relationship graph as the primary artefact and the geometry as a derived realisation; every generation method is then described by how it maps graph → geometry, and every validation is a check that the realisation still satisfies the graph.
- Evidence: The opened Graph2Plan record describes the input as a designer-supplied constraint set "represented by a layout graph", with the network's job being to translate that plus the building boundary into a plan (S3). The rectilinear-floorplanning source is the same shape from the other side: fixed boundary, modules, a performance metric, and topology as the search variable (S5). This repo already mandates the separation upstream — FP-02 (derive the graph first, then fit geometry) and AG-19 (check that the derived graph is a faithful dual of the plan).
- Source: S3 Hu, Huang, Tang, van Kaick, Zhang, Huang, "Graph2Plan: Learning Floorplan Generation from Layout Graphs", ACM Transactions on Graphics (2020) / arXiv:2004.13204 https://arxiv.org/abs/2004.13204 — T2 (abstract pages read twice; method internals beyond the summary were **not** in the returned text). S5 — T2.
- Class: STANDARD / DESIGN PRINCIPLE
- Scope: universal
- Confidence: High on the repo-side convention (it is the project's own); Medium on the literature claim — `NEEDS VERIFICATION:` whether Graph2Plan's layout graph encodes *adjacency* or *circulation* edges. The abstract does not say and the corpus must not assume, because AG-02 treats those as different predicates with different satisfaction criteria.
- Grid translation: Store `graph.json` (nodes with target area in tiles², edges with AG-06 grade) and `floor.tiles` separately, with a validator that re-derives the graph from the tiles and diffs it against the input graph. That diff is the generator's scorecard, and it is exactly FP-03's "topology primary, geometry secondary" made executable.
- Exceptions / failure mode: Symptom of a merged artefact: an edit to a wall silently creates or destroys an adjacency and no check fires, because there is no independent graph to compare against.

### LA-11 Generate in two stages — coarse topology/raster first, refined boxes second — and validate at the seam
- Rule: Do not ask one generator for final geometry. Emit a coarse realisation first (raster masks or topology ordering), then a refinement stage that produces rectangles, and re-run the graph check between the two, because the seam is where most defects are introduced.
- Evidence: Graph2Plan's pipeline is explicitly ordered this way: it "first generates a corresponding raster floorplan image, and then a refined set of boxes representing the rooms" (S3, verbatim from the opened abstract). The host engine already stores both views and requires their consistency (FP-17 vectors plus raster, not raster alone).
- Source: S3 — T2; project FP-17, FP-16 — T3 internal.
- Class: CODE REQUIREMENT
- Scope: all generators, including hand-authored procedural pipelines
- Confidence: High (two independent grounds: a read T2 pipeline statement and a repo-side convention)
- Grid translation: Coarse stage = room **masks** in tiles (flood-fill-able, 4-connected, door-excluded, per the host room model); refined stage = bounding rectangles per mask. At the seam compute mask-area vs rectangle-area ratio per room and reject below a declared threshold — a 0.25 m²-per-tile² grid makes a mask/box mismatch immediately visible in tiles².
- Exceptions / failure mode: Symptom: a plan that looks right and whose rooms have 1-tile tails (FL-05/FL-06, FP-14 orphan wall fragments) introduced by the refinement stage only.

### LA-12 Accept that one graph has many geometries, and publish which realisation the numbers belong to
- Rule: A relationship graph under-determines the plan: positions, areas and aspect ratios remain free. Therefore every metric reported for a generated plan is meaningless unless stamped with the realisation (and, for stochastic generators, the seed), and every comparison between two plans must state whether the difference is graph-level or geometry-level.
- Evidence: Mechanism is visible in the opened hybrid source's data model: layouts are "unordered bounding-box collections modeled as point clouds `{Ci}=[li,si,ci]` (position, dimensions, category)" — a fixed room set admits a distribution of positions and sizes, so the geometry is a sample, not a consequence (S4). Graph2Plan's framing is the same problem from the generative side: one layout graph, many valid plans (S3). Space-syntax metrics in this corpus are computed on the derived graph but *depend on* geometry via door placement (AG-11's door-count rule is the hinge).
- Source: S4 — T2; S3 — T2.
- Class: FACT (under-determination) / CODE REQUIREMENT (stamping)
- Scope: universal; decisive for evaluation and A/B comparison (DA-03 holds inputs constant)
- Confidence: High
- Grid translation: Stamp every artefact: `graph_hash, seed, realisation_index, plate_hash, tile_grid=0.5m`. Report graph-level and geometry-level diffs separately in the comparison table, e.g. `graph: identical (0 GED, FP-18); geometry: guest module shifted +2 tiles E`.
- Exceptions / failure mode: Symptom: "the new algorithm produces worse integration" when in fact it produced the same topology at a different realisation — an artefact of not stamping, and a direct violation of DA-03.

### LA-13 Model every room as a pair of integer intervals and forbid overlap in both axes at once
- Rule: The default CP formulation for rectangular layout is: per room `i`, integer variables `x_i, y_i` (tile coordinates of the near corner) and `w_i, h_i` (extents in tiles), plus an x-interval and a y-interval; non-overlap of all rooms is one 2D constraint over the paired interval lists, not a pairwise enumeration.
- Evidence: The opened CP-SAT primer gives the exact construction (spellings as printed there): intervals from `start`, `size`, `end` via `new_interval_var(...)` / `new_fixed_size_interval_var(start=..., size=...)`; 1-D exclusion via `add_no_overlap(interval_vars=[...])`, documented as ensuring "that no two present intervals overlap"; and 2-D exclusion as

```python
x_ivars = [model.new_fixed_size_interval_var(start=x_vars[i], size=box.width,
                                             name=f"x_interval_{i}")
           for i, box in enumerate(rectangles)]
y_ivars = [model.new_fixed_size_interval_var(start=y_vars[i], size=box.height,
                                             name=f"y_interval_{i}")
           for i, box in enumerate(rectangles)]
model.add_no_overlap_2d(x_ivars, y_ivars)
```

with the documented semantics that it "ensures that for every `i` and `j` either [the x-intervals do not overlap] or `y_intervals[i]` and `y_intervals[j]` do not overlap" (S8). The vendor page confirms the surrounding object model and the enumeration facility (`CpModel`, `new_int_var`, `CpSolver`, `solve`, `enumerate_all_solutions`, `set_enumerate_all_solutions`) but its returned excerpt does **not** document `NoOverlap` (S7).
- Source: S8 "Advanced Modelling", the CP-SAT primer https://d-krupke.github.io/cpsat-primer/advanced_modelling.html — T3 (practitioner reference documentation, full page read). S7 Google OR-Tools, "The CP-SAT Page" https://developers.google.com/optimization/cp/cp_solver — T3 (vendor doc; page returned **localised**, see LA-19).
- Class: CODE REQUIREMENT
- Scope: any rectangular room set on an integer grid — i.e. the host engine exactly
- Confidence: High on the modelling pattern; **Low on the literal spelling of the API in the installed version.** Both opened pages render method names in `snake_case` (`new_int_var`, `add_no_overlap_2d`) while the widely shipped Python API is `CamelCase` (`NewIntVar`, `AddNoOverlap2D`); the retrieval layer cannot be trusted to have preserved case. Copy the shape of the model, then re-verify every call name against the installed OR-Tools before running.
- Grid translation: `x_i, y_i ∈ ℤ` are tile indices and `w_i, h_i` tile extents, so non-overlap is decided at 500 mm granularity and no room can overlap by a fraction of a tile — the CP model enforces FP-15 (exclusive tile ownership) by construction rather than by post-check. Plate bounds are `0 ≤ x_i`, `x_i + w_i ≤ plate_w_tiles`.
- Exceptions / failure mode: Symptom of getting this wrong in 1-D only: rooms side-by-side on x but overlapping on y, or the constraint written pairwise so a 40-room floor has 780 binary clauses and the solver stalls. L-shaped rooms cannot be one interval pair — decompose them into declared rectangles and treat the parts as a suite (LA-14's wall band decides whether they merge).

### LA-14 Keep the wall band explicit, and do not assume a solver's touching semantics
- Rule: Model structure as its own interval band, so a "wall" is one blocked tile between two room intervals; never infer from a non-overlap constraint that edge-adjacent rooms are allowed or forbidden — check it, because adjacency is the whole point of a plan.
- Evidence: The primer's text on `add_no_overlap` states only that no two present intervals overlap and, as read, **does not address touching** ("Touching semantics are not explicitly addressed beyond mutual exclusion") — so whether `end_i == start_j` is legal is undocumented in the source opened here (S8). The host engine settles the same question by rule rather than by solver: a wall is exactly one blocked tile and rooms are 4-connected flood-fills that exclude door cells (GT file's stated model). Therefore on a 0.5 m grid a shared wall *costs* one tile of dimension and must appear in the area budget (TH-02's wall tax, SP-14).
- Source: S8 — T3; project GT-*/TH-02/SP-14 — T3 internal.
- Class: ENGINEERING CONSTRAINT / CODE REQUIREMENT
- Scope: all CP and packing models intended to drive this engine
- Confidence: High on the host-side consequence; **the solver's touching behaviour is `NEEDS VERIFICATION:`** — obtain it by an executed two-interval experiment (`[0,3]` and `[3,5]`) on the installed version, or from the reference document's NoOverlap entry, and record the answer in the run header.
- Grid translation: For room `i` and its neighbour `j` on +x: `x_j ≥ x_i + w_i + 1` (the `+1` is the one-tile wall). Every adjacency the design wants therefore costs one tile of dimension along the shared frontage, so a floor's total wall tax becomes a solver-visible linear term rather than a surprise at rasterisation.
- Exceptions / failure mode: Symptom: a plan that solves cleanly and then, when rasterised, shows rooms sharing a tile boundary with no wall tile, so the flood-fill merges two rooms into one (FP-15 violation, FL-07's "silently becomes hall" family).

### LA-15 Reify every soft relationship into a Boolean and put the Boolean in the objective
- Rule: Adjacency, orientation and "should" preferences enter a CP model as reified constraints — a presence or adjacency Boolean gated by `only_enforce_if` — never as hard constraints and never as prose. Hard for a must, weighted-soft for a should, absent for a may (AG-02's predicate types map one-to-one onto this).
- Evidence: The primer documents the mechanism literally: "Constraints activate conditionally based on Boolean flags", with the shape `model.add(2 * y >= x + 1).only_enforce_if(segment_active[0])`, and documents the related presence-gated form for intervals (`new_optional_interval_var(..., is_present=is_present_var)`), where overlap rules "apply only to intervals that are present" (S8). CPMpy shows the same reification idiom from the modelling side — `bv[0].implies(iv[0] > iv[1])` — and, crucially, uses assumption literals as "toggles for enabling or disabling constraints", which is exactly the soft-constraint interface (S9).
- Source: S8 — T3; S9 CPMpy, "Unsat core extraction" https://cpmpy.readthedocs.io/en/latest/unsat_core_extraction.html — T3 (library docs, full page read).
- Class: CODE REQUIREMENT
- Scope: all CP layout models; also the correct encoding for AG-06's graded closeness scale
- Confidence: High (two opened documentation sources show the same idiom)
- Grid translation: `adj_ij = 1` iff rooms `i, j` share a wall band (computable as `x_j == x_i + w_i + 1` plus y-overlap, and its three rotations); objective = `maximise Σ grade_weight(i,j) · adj_ij`, weights read off the AG-06 grade table. Emit the achieved/missed list per edge so the report is a diff table, not a score (VA-18).
- Exceptions / failure mode: Symptom: an over-weighted soft term swamps the plate bound and the model becomes infeasible (LA-18's core diagnosis is the response), or every "should" was made hard and the only feasible solutions are degenerate strips.

### LA-16 Use all-different for ordinal uniqueness only, and permitted-pairs tables for legal room types
- Rule: Two distinct CP idioms get conflated constantly: `AllDifferent` forces a set of variables to take pairwise distinct values (use for ranks, storey indices, uniquely-numbered cores — not for "rooms must not touch"), and a permitted-pairs / allowed-assignments table enumerates the legal combinations of a small variable tuple (use for room type × size × orientation menus, and for rotatable rectangles).
- Evidence: The vendor page documents the global `addDifferent` as part of its constraint vocabulary and demonstrates exhaustive enumeration of admissible assignments via `enumerate_all_solutions` with `set_enumerate_all_solutions` (S7). The primer documents the menu idiom exactly:

```python
model.add_allowed_assignments(
    [width_vars[i], height_vars[i], rotated_vars[i]],
    [(box.width, box.height, 0), (box.height, box.width, 1)]
)
```

for rotatable rectangles — a table of legal `(w, h, rotated)` triples (S8).
- Source: S7 — T3; S8 — T3.
- Class: CODE REQUIREMENT
- Scope: any CP model with typed room kits or rotation
- Confidence: High
- Grid translation: The room kit becomes a literal table of `(label, w_tiles_min..max, h_tiles_min..max, allowed_aspect)` derived from FP-05's area bands and FP-06's aspect clamp, so the generator cannot emit an off-taxonomy label (FP-01) and the solver rejects a 1×12-tile "guest room" before geometry exists. For a suite whose parts must not collide, use LA-13's interval machinery, not `AllDifferent`: the latter on positions forbids *equal coordinates*, not overlap, and that misreading produces overlapping rooms with distinct corners.
- Exceptions / failure mode: Symptom of misusing AllDifferent: "feasible" plans whose rooms overlap by construction; symptom of too small a permitted-pairs table: a model that is infeasible for a reason no constraint mentions (LA-18).

### LA-17 Model shared resources with cumulative, not with pairwise exclusion
- Rule: Anything consumed by overlapping spaces — corridor width carrying several rooms' flows, a services band, a shaft catchment, a plant zone — is a capacity problem: an interval list with demands and one capacity variable. Anything that must physically not coexist is a no-overlap problem. Choosing wrong is the commonest encoding error in layout CP.
- Evidence: The primer states the distinction and the API: `add_cumulative(intervals=[...], demands=[...], capacity=...)`, "used to model a resource constraint, where the sum of the demands [must not exceed the capacity of the resource]", set against `add_no_overlap` which "ensures that no two present intervals overlap" (S8).
- Source: S8 — T3.
- Class: CODE REQUIREMENT
- Scope: circulation, service bands, shafts, shared frontage
- Confidence: High on the mechanism; which architectural quantities are legitimately cumulative is this file's engineering judgement, not a cited finding.
- Grid translation: Corridor example on the x-axis: each room's frontage is an x-interval with demand = its AG-12 edge capacity in persons/min; `capacity` is corridor throughput per tile width, so the constraint returns a minimum corridor width in tiles (GT-05 then forces `ceil` of the accessibility minimum, whichever is larger). Services-band example: SV-* duct area demand against the band's cross-section in tiles².
- Exceptions / failure mode: Symptom: a corridor modelled as no-overlap that "solves" with zero-width corridors, or a pure capacity model where rooms physically interpenetrate because nothing forbade it.

### LA-18 When a layout model is infeasible, extract and publish the unsat core before changing anything
- Rule: Treat `INFEASIBLE` as a diagnostic event, not a failure: re-solve with every soft/optional constraint switched by an assumption literal, read the returned core, and report it as the conflict set. Never respond by deleting constraints one at a time by hand, and never respond by loosening a dimensional minimum (GT-05 forbids it).
- Evidence: The opened CPMpy page defines the artefact and the workflow: an unsatisfiable core is "any subset of these assumptions that, when true, makes the model unsatisfiable"; the API is `s.solve(assumptions=bv)` then `s.get_core()`, with `cpmpy.tools.mus()` giving deletion-based Minimal Unsatisfiable Subset extraction over `m.constraints`. Its worked example is the intransitive triple

```python
m = cp.Model(
    bv[0].implies(iv[0] > iv[1]),
    bv[1].implies(iv[1] > iv[2]),
    bv[2].implies(iv[2] > iv[0])
)
s = CPM_ortools(m)
print(s.solve(assumptions=bv))     # False
print("core:", s.get_core())
print(mus(m.constraints))          # a minimal unsat subset
```

i.e. a **cyclic ordering preference**, which is the layout analogue of an adjacency cycle no plan can honour. Two operational caveats come from the same page: core extraction requires an incremental / lazy-clause-generation backend with assumption support ("OR-Tools requires ≥v8.2"), and "the default OR-Tools Python wrapper intentionally remains stateless", so repeated `solve(assumptions=...)` calls discard prior learning and pay preprocessing each time, with `s.solution_hint()` offered as the mitigation (S9).
- Source: S9 — T3 (full page read).
- Class: CODE REQUIREMENT
- Scope: every CP / MILP layout model; the same discipline applies to heuristic repair (AG-18)
- Confidence: High (mechanism, API, example and caveats all read from library documentation)
- Grid translation: Report the core in project vocabulary, not variable names: `UNSAT CORE: {suite→ballroom must-touch, ballroom→kitchen never-adjacent, kitchen→suite must-touch}` → an AG-17 infeasible pattern class, resolved by TH-05's four levers cheapest-first. Print each term with the tiles it demands so the designer sees the dimensional cost of the fix.
- Exceptions / failure mode: A core is *a* conflict, not *the* conflict, and MUS extraction is expensive; the statelessness warning means a naive assumption-loop on a 40-room floor can cost more than re-modelling. Symptom of skipping the step entirely: the model "suddenly" becomes feasible after someone deleted a constraint nobody can name — an unreproducible design, which VA-23 forbids.

### LA-19 Report the solver's status verbatim; `FEASIBLE` is not `OPTIMAL` and `INFEASIBLE` is a proof
- Rule: The run record must carry the solver's own status and its stated meaning: `FEASIBLE` = a solution exists and was found, optimality unknown; `INFEASIBLE` = contradiction proved; `MODEL_INVALID` = the model itself failed validation. Never translate the first into "the layout works" or the third into "no layout exists".
- Evidence: The vendor page's status enum as returned: `FEASIBLE` — "找到了可行的解决方案，但不知道是否最优" (a feasible solution was found, but it is not known whether it is optimal); `INFEASIBLE` — "事实证明，这个问题不可行" (it was proven that the problem is infeasible); `MODEL_INVALID` — the given model "未通过验证步骤" (did not pass the validation step) (S7). A retrieval note that matters downstream: **that page came back localised**, so English wording could not be quoted here; the enum *names* are language-neutral and are what this rule keys on. The same page demonstrates exhaustive enumeration (`enumerate_all_solutions`), the only mode read here that certifies the full solution set.
- Source: S7 — T3.
- Class: STANDARD (reporting convention) / FACT (about the documented enum)
- Scope: all solvers; the analogous distinction for annealing is LA-21
- Confidence: High on the three statuses; **Medium on proof-strength language** — the read excerpt never characterises CP-SAT as a complete solver, so "INFEASIBLE is a proof" is inherited from the enum gloss ("it was proven"), not from a metatheorem read here. `NEEDS VERIFICATION:` the run-control parameters (time limit, worker count, random seed) were **not** in the returned text; obtain the solver-parameters reference page before publishing any run-control recipe.
- Grid translation: Status becomes a field in the deliverable header plus its tile-level consequence: `status=FEASIBLE, placed=28_of_28_candidates, optimality=unknown`; for `INFEASIBLE`, the LA-18 core printed with its tile dimensions; for `MODEL_INVALID`, a route to the model-integrity gate (VA-07) rather than to the design.
- Exceptions / failure mode: Symptom: an agent reporting "the solver proved the programme does not fit the plate" when the status was `MODEL_INVALID`, or "optimal plan" for a time-limited `FEASIBLE`. Both are capability-manifest failures (VA-10).

### LA-20 Use simulated annealing only where the objective cannot be written as constraints, and accept uphill moves by the published rule
- Rule: Keep the escape hatch honest: pick SA when quality is a weighted ranking of soft criteria rather than a satisfiable constraint set. Implement acceptance as published — always take an improving move, otherwise take a worsening move with probability `exp(-(e'-e)/T)` — and never silently replace it with greedy descent while still calling the result annealing.
- Evidence: The opened encyclopaedic source states the criterion as "1 if e' < e, and \exp(-(e'-e)/T) otherwise", notes it mirrors Metropolis–Hastings sampling, and gives the loop test as "If P(E(s), E(s_new), T) ≥ random(0, 1): s ← s_new". On temperature: "The temperature T plays the crucial role in controlling the evolution of the state s with regard to its sensitivity to the variations of system energies" — high T accepts large energy jumps and explores; cooling narrows acceptance toward descent (S10, page read).
- Source: S10 Wikipedia, "Simulated annealing" https://en.wikipedia.org/wiki/Simulated_annealing — T3 (tertiary; the underlying Metropolis paper was not opened).
- Class: STANDARD (a named, published procedure) / FACT (formula)
- Scope: soft-criterion layout ranking; slicing-tree and box placements (LA-09, LA-22)
- Confidence: Medium-High — formula and loop quoted from a T3 article whose body was read
- Grid translation: Energy is a pure function of the tile plan: `E = Σ_i h_i·(area_tiles(i) − target_tiles(i))² + Σ_p w_p·violations(p) + λ·circulation_tiles`, every term in tiles and tiles² so it is exactly recomputable. Because a tile is a 500 mm tolerance zone, `target_tiles(i)` must be the tile-integer target from SP-19's re-measured footprint, not the millimetre wish — otherwise the landscape has an unreachable minimum.
- Exceptions / failure mode: Symptom: a "SA" run at fixed temperature, which is randomised hill-climbing; or an energy containing a term not computable from tiles, which makes the whole ranking untestable (VA-06's level-naming requirement).

### LA-21 Publish the cooling schedule, the restart policy and the seed — and know that annealing certifies nothing
- Rule: An annealing run is reportable only with: initial temperature, schedule form and parameters, iterations per temperature, move set, restart count, random seed and best-so-far trace. Report the result as "best found in N evaluations", never as "the layout", and state that no optimality or feasibility certificate exists.
- Evidence: The opened source is direct about the cost: "the time required to ensure a significant probability of success will usually exceed the time required for a complete search" — annealing buys approximation quality per unit effort, not a proof within a finite budget (S10). On stagnation it prescribes the mitigation this rule demands: "restarting of simulated annealing", reverting to "the highest-quality solution discovered so far" and optionally recalibrating the thermal curve. `NEEDS VERIFICATION:` the returned text contained **no numeric cooling schedule** — no geometric-decrement factor, no α range — so this file prints the schedule generically as `T_{k+1} = α·T_k` and forbids quoting an α as sourced; obtain the constants from the primary SA literature or from a measured tuning run against this corpus's own floors.
- Source: S10 — T3.
- Class: CODE REQUIREMENT / HEURISTIC (tuning guidance)
- Scope: all stochastic generators, including any agent that samples rather than solves
- Confidence: High on the no-certificate and restart points (read verbatim); **Low on schedule numbers — none retrievable this pass.**
- Grid translation: The run record is `seed, T0, schedule, iters_per_T, moves, restarts, best_E, evals, wall_ms`; re-running the same seed must reproduce the same plan, which is what makes VA-14's post-edit re-validation meaningful and VA-23's reproducibility fields satisfiable. At roughly ≤12 rooms prefer exhaustive CP enumeration (`enumerate_all_solutions`, S7) and say so in the record — the read source's own cost statement argues for it.
- Exceptions / failure mode: Two named traps. (1) Local optima: the plan is stable across runs because the move set cannot leave the basin (LA-09), not because it is good. (2) Non-reproducibility: two identical briefs yield visibly different floors and nobody can say whether the brief or the seed moved — the agent then "fixes" a plan and silently re-solves a different problem, voiding the comparison (DA-03).

### LA-22 Match the move set to the representation, and remember that SA here is a VLSI import
- Rule: Annealing is representation-agnostic and move-set-specific: SA over a slicing tree rotates and permutes nodes; SA over boxes translates and resizes; SA over a graph swaps labels. State which is used, and carry the caveat that the evidence base is integrated-circuit placement, not building design.
- Evidence: The opened floorplanning source pairs SA with a slicing structure and searches by "performing horizontal and vertical swaps on the spine", reporting faster convergence and better layouts than other representations, with the explicit statement "Experimental results using simulated annealing demonstrate the effectiveness of our approach" (S5). The SA article's hardware-placement lineage is visible in its reference list as read: "Placement by thermodynamic simulated annealing" (De Vicente, Lanchares & Hermida, 2003) (S10). The whole family's framing is S5's problem statement — "packing rectangular blocks into a fixed-area boundary while optimizing a performance metric" — a die, not a floor.
- Source: S5 — T2; S10 — T3.
- Class: HEURISTIC / DESIGN PRINCIPLE
- Scope: any annealing generator in this corpus
- Confidence: Medium-High on the mechanics; Medium on transferability to buildings, which is the point of the rule.
- Grid translation: What transfers is the machinery, not the objective: chip placement minimises area × wirelength, while a floor's dominant costs are circulation share (FP-09, TH-15), adjacency grades (AG-06), egress (CODE-*/FQ-*) and stack continuity (FP-13) — none of which wirelength proxies. Encode moves as tile-integer deltas and publish the cost-term list beside the AG grades each imitates.
- Exceptions / failure mode: Symptom: an optimiser converging beautifully on a compact, low-perimeter plan with terrible door counts — a wirelength-shaped objective wearing an architecture label. Behaviourally this is FL-01 (circulation runaway) or FL-11/FL-14 (adjacency and acoustic failures).

### LA-23 Know exactly what a learned generator conditions on before calling it a solver
- Rule: A neural layout generator maps a conditioning input to a plausible plan; it does not solve a problem. Name the conditioning input the model actually accepts, and check whether it can carry the information the brief holds — for this corpus, that means asking whether "a layout graph plus a boundary" can express AG-02's four predicate types, AG-12's capacities and VT-*/FQ-*'s quantities.
- Evidence: The opened Graph2Plan record is explicit about its contract: designers' constraints are "represented by a layout graph", the model works from "user-defined layout graphs and building boundaries", and its processing "follows a sequence that first generates a corresponding raster floorplan image, and then a refined set of boxes representing the rooms", using "convolutional processing over both the layout graph, via a graph neural network (GNN)" — trained on "RPLAN, a large-scale dataset consisting of 80K annotated floorplans" (S3, verbatim from the opened abstract pages). A 2025 hybrid states the complementary division: a Transformer-based diffusion backbone forecasts box placements while "an LLM agent interprets prompts to inject stylistic attributes", and the procedural stage does the assembly (S4). A production-scale example of constraint-aware learning is GreenPlanner's GreenFlow, a normalising flow fine-tuned against an evaluator over a "63-dimensional metric vector" with four feasibility constraints including a fire-safety distance of "≤15 m" (S12).
- Source: S3 Hu, Huang, Tang, van Kaick, Zhang, Huang, ACM Transactions on Graphics (2020) / arXiv:2004.13204 — T2; S4 — T2; S12 Zeng et al., "GreenPlanner: Practical Floorplan Layout Generation via an Energy-Aware and Function-Feasible Generative Framework", arXiv:2512.00406v1 (2025) https://arxiv.org/html/2512.00406v1 — T2 (preprint, full text read).
- Class: FACT (about the cited systems) / DESIGN PRINCIPLE
- Scope: every generative model in the pipeline, including LLM-authored plans
- Confidence: Medium-High — the contracts are quoted from opened records; **Graph2Plan's quantitative results (IoU, graph edit distance, user study) were not in the returned text and are not reported here.**
- Grid translation: The conditioning input must be derived from corpus artefacts, not invented: layout graph ← AG-01's three graphs, boundary ← the plate polygon in tiles, area targets ← SP-19's re-measured footprints. Output is raster first, so the pipeline owes a vectorisation step and a re-measurement step before any GT-04 dual-scale row exists; a 64×64 raster as used by S12's evaluator is ~1 tile per 0.5 m at a 32 m plate, i.e. the same resolution as this engine — which makes metric comparison legitimate but also means the model's own quantisation error must be charged before criticising the design (UN-18).
- Exceptions / failure mode: Symptom: a conditioned model that visibly ignores one predicate type (e.g. never honouring "never-adjacent") because its graph has no channel for negation. That is a contract violation, not a bad design; the fix is a constraint stage, not more training.

### LA-24 Do not trust a learned plan with compliance, topology, or a building type it never saw
- Rule: Learned generators may propose, never certify. Three things must be re-established outside the model: code/capacity compliance (CODE-*, FQ-*), topological consistency of the derived graph (AG-19, FP-03), and type fit (FP-19). A model's own benchmark numbers are not evidence about this project's brief.
- Evidence: The strongest constraint-aware result read here is GreenPlanner's: its Practical Design Evaluator reports "over 10^5× speed-up" against EnergyPlus, "7.3 ms" per 100 cases at "R2>0.99", and GreenFlow trained on the filtered GreenPD set reaching FID "13.1", Rationality "61.6 %" and EUI "−10.4 %", with experts reporting an efficiency gain of "87 %" (S12). Read honestly, that is a *surrogate* scored against another surrogate on an RPLAN-derived base ("RPLAN: Base dataset containing 71,125 initial layouts", S12) — 61.6 % rationality means roughly four in ten generated plans are still not rated rational by the framework's own metric. The hybrid source states the same class of limit from its side: performance degrades on "significantly divergent structures that are absent from the training set", and out-of-library style requests cause "fallback to nearest compatible assets" (S4). The field review frames the residue as human work: conventional pipelines "usually require post-processing and involve human interaction" (S11).
- Source: S12 — T2; S4 — T2; S11 — T2 (abstract only).
- Class: DESIGN PRINCIPLE / HEURISTIC
- Scope: all ML-generated plans; extends to any LLM-authored tile plan
- Confidence: High on the existence of the limits (each is stated by its own source); Medium on the numbers, which are single-benchmark results from unread-elsewhere preprints.
- Grid translation: Gate every generated floor through the existing validators before it enters a comparison: FP-15 exclusive ownership, FP-04 flood-fill reachability, FP-05/FP-06 area and aspect bands, AG-19 faithful-dual check, then VA-14's blast-radius re-run after any repair edit. Record the generator's identity (LA-27) so the defect profile is interpretable.
- Exceptions / failure mode: Symptom: a plan with photorealistic plausibility and a 1-tile corridor pinch (FL-02), an untagged room becoming `hall` (FL-07), or a residential-shaped floor with no service route (FL-13). Also flag the citation hygiene: BuildingBlock's exterior comparison figures came back garbled from extraction (mixed-script digits) and are therefore **not** reproduced here; treat that comparison table as unread.

### LA-25 Bridge generation and editing through an explicit local shape space, not through re-solving from scratch
- Rule: Treat a solved plan as the centre of a *neighbourhood* of still-good plans, and give the designer movement inside that neighbourhood: characterise which edits keep the plan admissible, compactly encode that set, and expose transitions between neighbourhoods. Re-running the whole solver per wall nudge is both slower and less controllable.
- Evidence: This is the opened abstract of the paper the corpus had been citing under a wrong name. Its stated problem is that "there exists little support for a user to understand and systematically explore the samples"; its method is, verbatim, "Starting from a discrete set of good layouts, we analytically characterize the local shape space of good layouts around each initial layout, compactly encode these spaces, and link them to support transitions across the different local spaces", with those transitions "represent[ed] in the form of a **portal graph**", so the user can "globally and locally explore the space of good building layouts" (S2, abstract read in full). Keywords as listed on the record: "Computational design, Constrained optimization, Layout exploration, Local variations, Shape space".
- Source: S2 Bao, Yan, Mitra, Wonka, ACM Transactions on Graphics (2013), DOI as indexed 10.1145/2461912.2461977; abstract read at https://asu.elsevierpure.com/en/publications/generating-and-exploring-good-building-layouts/ ; the PDF the corpus cited (http://peterwonka.net/Publications/pdfs/2013.SG.Bao.SmartLayout.pdf, 21.9 MB) **would not open at that URL** — T2. **Naming correction:** the paper at that URL is titled "Generating and exploring good building layouts", not "Smart Layout: data-driven editing of floor plans"; the "Smart Layout" label in earlier drafts appears to be a filename artefact and is withdrawn.
- Class: DESIGN PRINCIPLE / FACT (about the cited method)
- Scope: interactive editing of solver-produced plans; the strongest available bridge between "a solver produced this" and "an architect edits this"
- Confidence: Medium-High — abstract-level only; `NEEDS VERIFICATION:` the operator list, the cost/energy terms, and the weights behind "analytically characterize" all remain unread, because neither the PDF nor a body-bearing page opened. Obtain the ACM TOG 32(6) paper body (or the authors' project page) before this rule is used to justify a specific wall-moving cost function.
- Grid translation: On this engine a local shape space is unusually tractable because geometry is already discrete: the admissible neighbourhood of a plan is the set of tile masks reachable by ±1-tile wall moves that keep every room inside its FP-05 area band, FP-06 aspect band and AG-02 must/never set. Publish it as a per-wall list of `{wall_id, move_dirs, max_tiles_before_violation, first_violating_rule}` — a portal graph in all but the name — so the editor knows which nudges are free.
- Exceptions / failure mode: Symptom of not doing this: every manual edit is followed by a full re-solve that relocates rooms the designer did not touch, which reads as the tool fighting the user; and defect reading becomes impossible because the plan is no longer the plan that was validated (VA-14 exists to forbid exactly that).

### LA-26 Run the pipeline as coarse → refine → validate → repair, with validation re-entered after every edit
- Rule: No single-shot generation. Order the stages as (1) programme and plate as constraints, (2) topology/graph, (3) coarse realisation (raster or slicing decode), (4) refinement to rectangles and openings, (5) full validation, (6) repair by minimal conflict set, then re-run (5) over the repair's blast radius before the plan is shown. Loop until complete on critical checks or until the report says what remains open.
- Evidence: The ordering is the corpus's own settled position — FP-02 (derive the graph first, fit geometry to it), FP-03 (topology primary, geometry secondary), FP-17 (vectors plus raster) — and is independently the structure of the read ML pipelines (raster, then refined boxes, S3) and of the read hybrid (layout generation phase, then building construction phase, S4). The re-entry requirement is VA-14 verbatim, and the cheapest-first ordering of checks is VA-05. The field's own residue is again the reason the loop needs a human: "post-processing and involve human interaction" (S11).
- Source: S3, S4, S11 — T2; project VA-05, VA-14, FP-02, FP-03, FP-17, AG-18, TH-05 — T3 internal.
- Class: CODE REQUIREMENT
- Scope: universal — this is how the family choices are sequenced in the workflow
- Confidence: High (repo-side convention corroborated by three opened external sources)
- Grid translation: Make the stage boundaries physical artefacts: `graph.json` → `coarse.mask` → `rooms.vec` → `validation.json`, each hashed and stamped with the generator identity of LA-27, so a repair at stage 4 can be proven not to have disturbed stage 2. Blast radius on a tile grid is computable: the union of rooms sharing a wall with the edited room, plus every circulation component whose flood-fill touches it (FP-04).
- Exceptions / failure mode: Symptom: a plan that passed validation, was "tidied" once, and was presented without re-validation — the classic route by which FL-25 (overlapping door reservations) and FL-06 (door run dividing a room) survive into a deliverable.

### LA-27 Declare which generator made the plan, because defect reading depends on it
- Rule: Every generated plan carries a generator stamp — family, model or rule-set version, solver and version, conditioning inputs, seed, status — in the deliverable itself. The same visible defect means different things from a grammar, a CP solver, an annealer and a neural model, and the repair lever is chosen from the stamp, not from the picture.
- Evidence: Derived from what was read about each family's characteristic failure surface: a slicing decoder cannot express a non-sliceable topology at all (S5's statement, S6's contradictory title — LA-07/LA-08); a CP model returns `FEASIBLE` with optimality explicitly unknown (S7), so a CP plan's defect is usually a missing or over-weighted soft term (LA-15); annealing "will usually exceed the time required for a complete search" for any guarantee, so an SA plan's defect is a basin the move set could not leave (S10, LA-21); a learned model degrades on structures "absent from the training set" and falls back to the "nearest compatible" asset (S4), so its defect is a distribution artefact rather than a rule violation. The corpus-side requirement for this field is UN-01 (status + source + confidence at first use) and VA-23 (reproducible records).
- Source: S4, S5, S6, S7, S10 — as above; project UN-01, UN-14, VA-23 — T3 internal.
- Class: CODE REQUIREMENT
- Scope: universal; applies to agent-authored tile plans exactly as to solver output
- Confidence: High (the per-family failure surfaces are each read; the composite reporting rule is the project's own)
- Grid translation: `generator: family=cp-sat, model=hotel-floor-7, ortools=VER?, seed=n/a, status=FEASIBLE, inputs={graph_hash, plate_hash}` printed in the plan header. Where a stamp is unavailable the plan is reported as unattributed and cannot enter a comparison (DA-03).
- Exceptions / failure mode: Symptom: an agent "fixing" a distribution artefact by adding constraints — permanently growing a model's constraint set to patch one sample. Also the reverse: treating a `MODEL_INVALID` empty result as a design impossibility and re-briefing the client (LA-19).

### LA-28 Record the algorithm selection as a decision with a rejection reason, not as a default
- Rule: For each design, write one line: family chosen, input contract honoured (yes/how), guarantee obtained, family rejected and why, and the post-processing owed. This is the artefact the selection table below is used to fill in; without it, generator choice is invisible and unauditable.
- Evidence: The requirement follows from the corpus's own decision discipline (DM-* records, UN-07's assumption register) and from the fact that the opened sources disagree about capability at the representation level — the completeness dispute in LA-07 is a case where two published results imply different choices, so the choice must be recorded rather than assumed. The review's statement that all conventional pipelines leave post-processing to a human (S11) makes "what happens after the solver" part of the selection, not an afterthought.
- Source: S11 — T2; project UN-07, DM-*, history `- decision:` convention — T3 internal.
- Class: CODE REQUIREMENT
- Scope: universal
- Confidence: High
- Grid translation: `decision: cp-sat | contract=rect-programme+all-constraints-integerable | guarantee=feasible(+proved-infeasible-cores) | rejected=slicing-tree(guillotine cannot express courtyard ring, LA-08), SA(no certificate, ≤12 rooms makes enumeration cheaper, LA-21) | post=FP-06 lint, opening placement`. One row per floor type; diff it across revisions.
- Exceptions / failure mode: Symptom: a project that "always uses the grammar" and produces a plan whose relationship violations are discovered only at validation, several stages after the choice that caused them.

## Algorithm selection table

Read this table by column 2 first: if the input contract cannot be honoured, the row is unavailable
regardless of how good the output looks. Guarantees are stated in the solver's own vocabulary
(LA-19). "Host fit" is this engine's verdict on a 0.5 m tile grid, one 2D grid per floor.

| Family | Input contract (what you must supply) | Guarantee given | Characteristic failure | Host fit |
|---|---|---|---|---|
| Shape grammar / procedural (LA-02…LA-05) | An authored rule set with guards, plus a start shape | None — derivations are valid by construction, not optimal | Unguarded rules over-fire; style without programme satisfaction | Good for module/rhythm, wrong for AG-02 satisfaction |
| Slicing tree (LA-06…LA-09) | Rectangle-only programme, guillotine-tolerant parti, plate | Realises exactly the tree's dissections; topology certified, metric not | Cannot express non-sliceable/courtyard rings; silently "adjusts" geometry | Good for repetitive guest floors; blocked on courtyards |
| Graph → geometry, learned (LA-10…LA-12, LA-23…LA-24) | Layout graph + boundary, in-distribution training data | Plausibility only; no constraint certificate | Ignores predicates the conditioning cannot carry; distribution artefacts | Proposal generator; must be re-measured and re-vectorised |
| Constraint programming / CP-SAT (LA-13…LA-19) | Every requirement as an integer constraint or a reified soft term | `FEASIBLE` (found, optimality unknown) or `INFEASIBLE` **with a provable core** | Modelling error masquerading as design infeasibility; `MODEL_INVALID` misread | Best fit — tile integers are already the domain |
| MILP / quadratic (LA-01, LA-14) | Linearisable objective and constraints, continuous or integer | Optimal within the model, subject to solver tolerance | Nonlinear real-world terms dropped to stay linear | Usable for area/wallet arithmetic; weak on disjunctions |
| Simulated annealing (LA-20…LA-22) | A cost function that ranks layouts correctly + a move set | Best-found; no feasibility or optimality certificate | Basin dependence; non-reproducible without seeds; VLSI-shaped objectives | Viable above ~12 rooms where CP enumeration is too slow |
| Editing / exploration over solved plans (LA-25) | A seed set of good layouts + a shape-space characterisation | Membership of the local admissible set (as claimed by the source) | Unread operator/cost detail; drift away from the validated plan | The right interface for architect edits; needs the body read |
| Hybrid generative + procedural + LLM (LA-01, LA-23) | Both contracts at once, plus a component library | Weakest of the stages, per stage | Style fallback when the request leaves the library | Realistic end state; audit each stage separately |

## Constraint catalogue

Formulations are tile-native (`1 tile = 0.5 m`, `1 tile² = 0.25 m²`); the CP encoding of each is the
LA-13…LA-17 machinery. "Owner" names the rule that fixes the *value* — this file only fixes how it is
solved, per the coverage-map boundary.

| # | Constraint | Tile-domain form | CP idiom | Value owned by |
|---|---|---|---|---|
| C1 | Room inside plate | `0 ≤ x`, `x + w ≤ plate_w`, same on y | linear bounds | GT-01, FP-* |
| C2 | No room overlap | x- or y-separation of interval pairs | `add_no_overlap_2d` | FP-15 |
| C3 | Wall band between rooms | `x_j ≥ x_i + w_i + 1` per adjacency | linear bound | GT (one-tile wall), TH-02, SP-14 |
| C4 | Area band per label | `min_t ≤ w·h ≤ max_t` in tiles² | product of int vars / table over `(w,h)` — **API spelling unverified, LA-16** | FP-05, TH-24 |
| C5 | Aspect clamp | `w ≤ k·h ∧ h ≤ k·w` | linear (two inequalities) | FP-06, TH-25 |
| C6 | Room type menu | `(label,w,h,rot) ∈ table` | `add_allowed_assignments` | FP-01, SP-16 |
| C7 | Must-touch adjacency | `adj_ij = 1` enforced | reification, `only_enforce_if` | AG-02, TH-03 |
| C8 | Never-adjacent | `¬adj_ij` | reification with negated literal | AG-02, AG-24, FL-11 |
| C9 | Soft closeness grade | maximise `Σ g_ij·adj_ij` | objective over reified Booleans | AG-06 |
| C10 | Door count between zones | `Σ doors(i,j) ≤ cap` | integer sum / counting | AG-11, TH-07 |
| C11 | Corridor capacity | cumulative over frontages | `add_cumulative` | AG-12, TH-12 |
| C12 | Reachability | every room flood-fills from a portal | **not CP-representable directly** — post-check | FP-04, VA-15 |
| C13 | Core stack continuity | same x,y range on every floor | shared vars across per-floor models | FP-13, GT-02, FL-09 |
| C14 | Daylight depth | `depth_tiles ≤ max_single_aspect_depth` | linear bound on y-extent | TH-26, EQ-*, FL-19 |
| C15 | Egress travel | route length in tiles ≤ limit | post-check on the graph, not in the model | CODE-*, FQ-*, AG-09 |
| C16 | Services band width | band tiles² ≥ Σ duct demand | `add_cumulative` | SV-*, FL-22 |
| C17 | Repetition by clone | module `(w,h)` identical across floors | `AllEqual`-style bounds / equality | FP-12, TH-23 |
| C18 | No slivers | `w ≥ 2 ∧ h ≥ 2` tiles unless declared | linear bounds | FL-05, FP-06 |

Two honest gaps. C4 needs a multiplication constraint whose API spelling was not documented in either
page opened here (LA-13's confidence line); on this grid it can always be avoided by enumerating
permitted `(w,h)` pairs via C6, which is the recommended host-side workaround. C12, C15 and the door
count of C10 depend on the *final raster and opening placement*, so they belong to the validate stage
of LA-26's loop, not to the solver — a plan whose reachability was "guaranteed" by a CP model has been
guaranteed by a model that did not see the doors.

## Pseudocode library

**(P1) Slicing decode — tree to tile masks (LA-06).**

```
decode(node, rect_tiles):                            # rect = (x0,y0,w,h), all integers
  if node is leaf: mask[node.room] ← rect; return
  cut ← node.axis                                    # 'H' splits along y, 'V' along x
  pos ← clamp(round(node.frac * extent(rect, cut)), min_leaf(rect), extent(rect,cut) - min_leaf(rect))
  decode(node.left,  subrect(rect, cut, pos))        # integer cut => 500 mm multiple (GT-05/GT-06)
  decode(node.right, subrect(rect, cut, extent(rect,cut) - pos))
```
Invariant: every child rect has integer sides, so the union is exact and no tile is unowned (FP-15).
If `clamp` fires the requested proportion is not expressible on the grid: emit a GT-04 row rather than
a silently resized room.

**(P2) Metropolis annealing over a plan representation (LA-20, LA-21).**

```
s ← move-initialised plan(seed);   s_best ← s;  E_best ← E(s)     # E in tiles and tiles^2 only
for k in 1..K:
  T ← schedule(k, K, T0)                            # generic T_{k+1} = alpha*T_k ; alpha NOT sourced
  s' ← move(s, move_set)                            # tile-integer deltas from the declared set (LA-09)
  d  ← E(s') - E(s)
  if d < 0 or P(d,T) >= random(0,1): s ← s'          # P = 1 if d<0 else exp(-d/T)
  if E(s) < E_best: s_best ← s; E_best ← E(s)
  if stalled(s_best): s ← s_best; restart(thermal_curve)          # reannealing (LA-21)
report(s_best, seed, schedule, evals, "best-found; no certificate")
```

**(P3) CP floor model (LA-13…LA-17).** Spelling per S8; re-verify against the installed version.

```
model = CpModel()
for room r:
  x[r], y[r] = new_int_var(0, plate_w-1), new_int_var(0, plate_h-1)
  w[r], h[r] = new_int_var(min_t, max_t)
  model.add_allowed_assignments([w[r], h[r], rot[r]], KIT[label_of(r)])       # C6
  xv[r] = new_fixed_size_interval_var(start=x[r], size=w[r])
  yv[r] = new_fixed_size_interval_var(start=y[r], size=h[r])
model.add_no_overlap_2d(xv, yv)                                              # C2
for (i,j) in MUST_TOUCH: model.add(adj[i,j] == 1)          # C7/C8 via reification, only_enforce_if
for (i,j) in NEVER:      model.add(adj[i,j] == 0)
model.add_cumulative(frontage_intervals, demands=flow, capacity=corr_w)       # C11
model.maximize(sum(g[i,j] * adj[i,j] for soft edges))                         # C9
st = CpSolver().solve(model)      # branch on st: FEASIBLE / INFEASIBLE / MODEL_INVALID
```

**(P4) Unsat-core diagnosis loop (LA-18).**

```
if status == INFEASIBLE:
  assumptions = [bool per soft/optional constraint]
  s = CPM_ortools(model_with_implications)               # backend must be >= v8.2 (S9)
  if s.solve(assumptions=all_on): report("not unsat under these toggles")
  core = s.get_core();  core_min = mus(constraints_of(core))   # MUS is expensive: cap + cache
  s.solution_hint(partial_known_feasible)                # wrapper is stateless -> hint, not warm start
  report(core_min as rule names + tiles demanded)  -> AG-17 pattern class -> TH-05 levers
```

**(P5) The generation loop the agent actually runs (LA-26, LA-27).**

```
inputs  = programme(SP-*) + plate + relationship matrix(AG-02)
family  = selection_by_input_contract(inputs)                    # fills LA-28's decision row
coarse  = generate(family, inputs)         -> graph.json, coarse.mask
rooms   = refine(coarse)                   -> rooms.vec (boxes + openings)
loop:  verdicts = validate(rooms, scope=full)                    # VA-07 integrity gate, VA-05 ordering
       if complete_on_critical: break
       rooms = apply(minimal_conflict_set(verdicts))              # AG-18, cheapest lever (TH-05)
       verdicts = validate(rooms, scope=blast_radius(repair))     # VA-14
emit(rooms, stamp={family, version, seed, status, hashes}, verdicts, open_items)   # UN-01, VA-23
```

## Sources

This is a rebuild after content loss, so each entry records **what was actually opened on
2026-09-25** and what was not. Tiers per `SKILL.md` Evidence Rules; T2 = peer-reviewed / university,
T3 = established publication or reference documentation. Nothing below is cited from memory.

| ID | Work | URL | Status this pass | Tier |
|---|---|---|---|---|
| S1 | Müller, Wonka, Haegler, Ulmer, Van Gool, "Procedural modeling of buildings", ACM SIGGRAPH 2006 | https://asu.elsevierpure.com/en/publications/procedural-modeling-of-buildings/ | record + abstract read | T2 |
| S2 | Bao, Yan, Mitra, Wonka, "Generating and exploring good building layouts", ACM TOG 2013 | https://asu.elsevierpure.com/en/publications/generating-and-exploring-good-building-layouts/ (also cited by the corpus as http://peterwonka.net/Publications/pdfs/2013.SG.Bao.SmartLayout.pdf) | abstract read in full; **that PDF URL would not open (21.9 MB)** | T2 |
| S3 | Hu, Huang, Tang, van Kaick, Zhang, Huang, "Graph2Plan", ACM TOG 2020 | https://arxiv.org/abs/2004.13204 | abstract pages read twice; results tables absent | T2 |
| S4 | Huang, Wang, Li, Huang, Dai, Xu, "BuildingBlock: A Hybrid Approach for Structured Building Generation", arXiv 2025 | https://arxiv.org/html/2505.04051v1 | full text read (some numerals returned garbled) | T2 (preprint) |
| S5 | arXiv cs/0611107, rectilinear floorplanning with spine-based slicing trees — **authors/title/year not retrievable from the PDF stream** | https://arxiv.org/pdf/cs/0611107 | text read; bibliographic record incomplete | T2 (record deficient) |
| S6 | Lai & Wong, "Slicing Tree Is a Complete Floorplan Representation", DATE 2001 | https://past.date-conference.com/proceedings-archive/2001/DATE01/PDFFILES/04F_1.PDF | title/authors/venue read; body in compressed streams | T2 (partial) |
| S7 | Google OR-Tools, "The CP-SAT Page" | https://developers.google.com/optimization/cp/cp_solver | page read; **returned localised**, no NoOverlap/params documented in the excerpt | T3 |
| S8 | The CP-SAT primer, "Advanced Modelling" | https://d-krupke.github.io/cpsat-primer/advanced_modelling.html | full page read | T3 |
| S9 | CPMpy documentation, "Unsat core extraction" | https://cpmpy.readthedocs.io/en/latest/unsat_core_extraction.html | full page read | T3 |
| S10 | Wikipedia, "Simulated annealing" | https://en.wikipedia.org/wiki/Simulated_annealing | article read; no numeric cooling schedule present in returned text | T3 (tertiary) |
| S11 | Liu, Xue, Ni, Yu, Zhou, Huang, "Computer-aided layout generation for building design: A review", Computational Visual Media 2025 | https://www.sciopen.com/article/10.26599/CVM.2025.9450484 | **abstract only**; taxonomy body not retrieved | T2 (partial) |
| S12 | Zeng et al., "GreenPlanner", arXiv 2025 | https://arxiv.org/html/2512.00406v1 | full text read | T2 (preprint) |

Recovered-URL list from the pre-loss fingerprint: **10 of 17 re-opened** (S1–S10 above, S2 via the
publisher record rather than the PDF). **7 not opened this pass**, retained here as named-but-unread so
the next pass can try them from a network with different access: Liew & Müller, descriptive
conventions (https://web.mit.edu/haldane/www/publications/liewh-2002-descriptive_conventions.pdf — PDF
stream undecoded); the IJCA paper behind the slicing-tree/postfix figure
(https://research.ijcaonline.org/volume71/number15/pxc3888962.pdf — stream undecoded); the figure page
itself (https://www.researchgate.net/figure/…_fig1_220701789 — HTTP 403); UCL Discovery
eprint 10131621 (https://discovery.ucl.ac.uk/id/eprint/10131621/ — HTTP 403, work not identified);
Edinburgh Research Explorer file 155991367 (https://www.research.ed.ac.uk/files/155991367/ — HTTP 403,
work not identified); Springer `s41289-026-00329-3` (HTTP 303; search identifies it as
"Modelling urban elements and patterns as shape grammars", Environment and Planning B, online 2026-05-07 —
**content unread, authors not established**); and *Science* 220(4598):671
(https://www.science.org/doi/10.1126/science.220.4598.671 — HTTP 403, work not identified).

## Weak or contested

Carried forward from the pre-loss file and re-stated, because none of them was resolvable this pass.
Each names the document that would settle it.

- **`NEEDS VERIFICATION:` Action / Space-Layout language (Dorne & Fenves).** Named-but-unread; no page opened here mentions either language. Obtain the Technion ARCR reports, or a secondary account in a design-computing anthology, before any rule cites the programming-language / layout-language split.
- **`NEEDS VERIFICATION:` Duke's 1971 MILP space allocation.** Named-but-unread; no opened source supports the formulation, the objective or the date. Obtain Duke's paper (Environment and Planning lineage) or a dated survey of 1960s–70s space-allocation research — S11's full body is the cheapest candidate and was not retrieved.
- **`NEEDS VERIFICATION:` du Plessis' K-street grammar.** Named-but-unread. The Springer record search associates with the topic (`s41289-026-00329-3`) redirected and the two repository URLs (UCL, Edinburgh) returned 403, so the grammar's existence rests only on the pre-loss file's own note. Obtain the thesis or article text.
- **`NEEDS VERIFICATION:` Stockmeyer 1976.** Named-but-unread, and its claimed content (classification of rectangular dissections / non-sliceable enumeration) is what LA-07's dispute turns on; until it is read, LA-07 rests on the two opened sources only.
- **`NEEDS VERIFICATION:` Wonka "Smart Layout" operators and cost weights.** The document cited at `…/2013.SG.Bao.SmartLayout.pdf` is titled "Generating and exploring good building layouts" (S2) — the *label* is withdrawn — and the operator/cost detail is unread because only the abstract was retrievable. Obtain the ACM TOG 32(6) body before using LA-25 to justify a wall-move cost.
- **Two representation-level unknowns.** Slicing-tree completeness is a live contradiction inside the opened set (S5's "cannot be represented" vs S6's title-level completeness claim): not averaged, not adjudicated, and LA-07 requires a declared position instead. And the postfix / skewed-vs-normalised encoding has **no read source** — LA-06 keeps the tree, but do not implement a postfix genotype until a body has been read.
- **Documentation-level unknowns, all answerable in one session.** (a) Solver API spellings: both opened pages return `snake_case` names while the shipped Python API is generally `CamelCase`, so every sketch here is shape-correct and name-unverified (LA-13); (b) `NoOverlap` touching semantics are unstated in the page read, the load-bearing unknown for adjacency modelling (LA-14); (c) CP-SAT run-control parameters (time limit, workers, seed) were absent from the returned text (LA-19).
- **Evidence standing.** S4 and S12 are arXiv preprints with no read peer status and S11 is an abstract only, so every quantitative claim in LA-23/LA-24 is reported as "this paper's benchmark", never as a design constant. Graph2Plan's graph semantics are unresolved — adjacency vs circulation edges is undetermined by the abstract while AG-02 treats them as different predicates (LA-10), so the ambiguity is load-bearing.

## Type-specificity audit

- **Hotel (flagship):** the fit case, for a narrow reason — a guest floor is a repetitive rectangle kit, which is where slicing trees (LA-06) and CP room menus (C6, C17) are strongest and where FP-12's clone-by-footprint rule makes the module a constraint rather than a wish. Courtyard or podium-plate floors leave that fit immediately (LA-08).
- **Residential / cell-based:** transferable, but public plan data is single-family (FP-19), so learned generators inherit the wrong distribution (LA-24).
- **Hospitals, prisons, schools:** same cell logic, but service/public separation (AG-24, FL-13) and door-count privacy chains (AG-11) dominate — expect CP models with more reified Booleans than intervals, and annealing costs tuned on those terms rather than on compactness (LA-22).
- **Offices / open plan:** weakest fit here, because the rectangular-dissection premise (C2, C6) assumes rooms partition the plate; a column-grid landscape plan is not a dissection. Route those to the grid and structure domains.
- **Universal across types:** LA-02 (trace), LA-10…LA-12 (graph/geometry separation), LA-18/LA-19 (diagnosis and status reporting), LA-26/LA-27 (loop and stamping) — process rules about any generator, not claims about buildings.
- **Nothing here is a code or standards claim.** Sources are algorithm papers and library documentation; where a rule touches a regulated quantity it defers to CODE-*, FQ-* and the validation loop rather than restating them (coverage-map §1).
