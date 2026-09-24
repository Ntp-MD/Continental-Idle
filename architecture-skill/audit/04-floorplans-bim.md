# Audit 04 — Floor plans + BIM/CAD: adversarial source verification

Scope: claim-by-claim verification of `architecture-skill/research/floor-plans.md` (FP-01..FP-25)
and `architecture-skill/research/bim-cad.md` (BIM-01..BIM-24). Skeptical read, no rewrite of the
audited files. Existence AND content checked.

Legend (STATUS): SUPPORTED | PARTIALLY SUPPORTED | INFERRED | UNSUPPORTED | CONTRADICTED | UNVERIFIED
ACTION: KEEP | QUALIFY | REPLACE | REMOVE

Retrieval note: all web probes happened today (2026-09). Reachable and read: zenodo.org/records/7788422,
arxiv.org/html/2407.10121v3, github.com/CubiCasa/CubiCasa5k, arxiv.org/abs/2105.07147,
arxiv.org/html/2407.15723v1, arxiv.org/abs/2211.13287, ar5iv full text of 2004.13204,
arxiv.org/html/2504.09694v1, access-board.gov/ada/chapter/ch04/, the LBL IFC2x3 mirror page, and
github.com/buildingSMART/IFC4.x-development/issues/1. NOT attempted this session (budget): the
`standards.buildingsmart.org` 403 claim — so `bim-cad.md`'s central availability excuse is still
UNVERIFIED here, though it is consistent with the one mirror page that did load.
`WebSearch` failed twice (tool error), so the ITP / Pictor / CADI4RNN existence question is
unresolved — see A12.

CONVENTION: "CONTRADICTED" below always means *the source as cited does not say what the file says
it says* — i.e. a misdescription of real literature, not a fake paper. No fully fabricated entity was
found in either file: every dataset, paper, code clause and IFC entity named is real. The failures are
of three kinds — wrong numbers, wrong titles/venues, and clause/attribute precision asserted from pages
that were never read.

---

## Part A — floor-plans.md

### A1. "RPLAN is 80,315 plans with 13 room types" (FP-01, FP-25, Sources, type-specificity table)
- CLAIM (verbatim): "RPLAN is used across the generation literature as 80,315 plans with **13 room types**; Graph2Plan and HouseDiffusion both train on it." Sources section repeats it as "**80,315** plans per the ECCV-track benchmark".
- SOURCE: benchmark https://arxiv.org/html/2407.15723v1; Graph2Plan; HouseDiffusion.
- WHAT THE SOURCE ACTUALLY SAYS: the benchmark page reports RPLAN as **80,788 plans**, with label types inferred from pixels — it does *not* report 80,315. Graph2Plan reports "**80K** annotated floorplans" and "Nt = **13**" room types. HouseDiffusion's abstract page confirms RPLAN usage but gives no count.
- PROBLEM: entity exists, statistic does not. The number 80,315 appears in none of the three sources cited for it; the cited benchmark states a different figure. "13 room types" is Graph2Plan's, correctly.
- STATUS: **CONTRADICTED** (number) / SUPPORTED (13 types, via Graph2Plan).
- ACTION: **REPLACE** "80,315" with "80K / 13 room types (Graph2Plan; the DStruct2Design benchmark reports 80,788)". Fix in all four places.
- CLOSES WITH: an actual first-party RPLAN page (never cited by the file) if the 80,315 figure is to survive at all.

### A2. CubiCasa5K (FP-01, FP-07, FP-08, FP-17, FP-19)
- CLAIM: "5,000 floor plans annotated into 'over 80 floorplan object categories'"; "polygon/vector ground truth"; "5,000 real-world *house* plans (Finland)".
- SOURCE: https://github.com/CubiCasa/CubiCasa5k — T1/T2.
- WHAT THE SOURCE ACTUALLY SAYS: verbatim "CubiCasa5K is a large-scale floorplan image dataset containing 5000 samples annotated into over 80 floorplan object categories"; polygon annotations confirmed; paper title "CubiCasa5K: A Dataset and an Improved Multi-Task Model for Floorplan Image Analysis". The README does not state the country of origin, nor "houses" as opposed to floor plans generally.
- PROBLEM: load-bearing parts exact; "(Finland)" and "*house* plans" are the author's inference, presented as dataset properties. FP-19's whole provenance-quarantine argument uses "Finland" as a provenance field.
- STATUS: **PARTIALLY SUPPORTED**.
- ACTION: **QUALIFY** — mark origin/type-of-building as inferred-from-publisher, not stated by the page.

### A3. FloorPlanCAD (FP-01, FP-07, FP-08, FP-14, FP-17)
- CLAIM: "10,000+ drawings with 'line-grained annotations of 30 object categories' (symbols, not spatial semantics)".
- SOURCE: https://arxiv.org/abs/2105.07147.
- WHAT THE SOURCE ACTUALLY SAYS: "FloorPlanCAD: A Large-Scale CAD Drawing Dataset for Panoptic Symbol Spotting", arXiv 2021; over 10,000 drawings, 30 object categories, line-grained annotations, symbols including walls/doors/windows.
- PROBLEM: none. The "(symbols, not spatial semantics)" gloss is exactly what panoptic symbol spotting is.
- STATUS: **SUPPORTED**. ACTION: **KEEP**.

### A4a. MSD counts, zones, residential filtering (FP-01, FP-05, FP-09, FP-11, FP-19)
- CLAIM: "5,372 plans / 18.9 K units / 165.3 K rooms with room-type labels plus functional zones", "including private / public classification", "MSD had to filter out non-residential content".
- SOURCE: https://arxiv.org/html/2407.10121v3.
- WHAT THE SOURCE ACTUALLY SAYS: "5,372 annotated floor plan images… over 18.9K distinct apartments"; zones are `zone1` private, `zone2` public, `zone3` service, `zone4` outside; "Residential-only filtering… removal of 2,305 (16.6%) floor plans". The `165.3 K rooms` figure did not appear in the fetched text. Paper title is "MSD: A Benchmark Dataset for Floor Plan Generation of Building Complexes" — the file expands MSD as "Modified Swiss Dwellings", unconfirmed.
- PROBLEM: counts and zones confirmed (the zone vocabulary is *richer* than claimed, and FP-11's `{public, private, service}` mapping happens to match zone1–3 exactly); room count and the MSD expansion unverified.
- STATUS: **PARTIALLY SUPPORTED**.
- ACTION: **KEEP** FP-11 (upgrade note: four zones, not two); **QUALIFY** "165.3 K rooms" and the "(Modified Swiss Dwellings)" expansion.

### A4b. "MSD explicitly documents vertical alignment of rooms across storeys" (FP-12, FP-13, FP-23)
- CLAIM (verbatim, FP-13): "MSD explicitly documents **vertical alignment** of rooms across storeys in multi-floor apartments as a property preserved (and required) by the benchmark, i.e., a plan model that ignores floor-to-floor alignment is measurable wrong against real data." FP-13 carries **Confidence: High**; FP-12 restates it ("the published vertical-alignment observation in MSD is precisely that repeated apartment stacks recur across storeys"); FP-23 depends on it transitively.
- SOURCE: https://arxiv.org/html/2407.10121v3.
- WHAT THE SOURCE ACTUALLY SAYS: no vertical-alignment statement found. What the paper preserves is that **apartment/unit IDs are shared across floors for multi-storey units** (supplementary §8.1) — i.e. the same labelled unit appears on several levels, not that rooms sit in a vertical stack or that alignment is measured or required.
- PROBLEM: the source does not contain the claim. Unit-ID continuity is a bookkeeping property; "vertical alignment of room positions" is the author's own engineering conviction (the file's second sentence openly appeals to soil stacks and lift hoistways, i.e. `UNCITED` practice). Real property, wrong attribution, and the only High-confidence cross-floor validator in the file rests on it.
- STATUS: **CONTRADICTED** (as an MSD attribution).
- ACTION: **REPLACE** the citation with `UNCITED — heuristic (engineering practice)` and drop the Confidence to Medium; keep the rule.
- CLOSES WITH: an actual source that measures room-position alignment across storeys (none found in Domain A's corpus).

### A5. Swiss Dwellings "45,176 apartments in roughly 3,100 buildings, ~370,000 rooms" (FP-12, FP-19, Sources)
- SOURCE: https://zenodo.org/records/7788422.
- WHAT THE SOURCE ACTUALLY SAYS: "over 45,000 apartments (370,000 rooms) in ~3,100 buildings", source Archilyse AG, CC-BY-4.0; room categories include living room, bathroom, kitchen, balcony, loggia, entrance.
- PROBLEM: magnitude and the ~3,100 buildings and ~370,000 rooms all match; the false precision "45,176" is not the record's number (record says "over 45,000"). "bedroom" not surfaced in the categories list. Note: the audit brief's competing "~3,769 buildings" figure is *not* the record's either — the file's 3,100 is the one that matches.
- STATUS: **PARTIALLY SUPPORTED**.
- ACTION: **QUALIFY** to "over 45,000 apartments / ~3,100 buildings (Zenodo record wording)".

### A6a. Graph2Plan validity suite = coverage / interior / mutex (FP-02, FP-04, FP-15, FP-18, FP-24)
- SOURCE: ar5iv full text of https://arxiv.org/abs/2004.13204.
- WHAT THE SOURCE ACTUALLY SAYS: the paper's Eq. 2 losses are `L_coverage`, `L_interior`, `L_mutex` — three structural validity terms, exactly as the file states.
- STATUS: **SUPPORTED**. ACTION: **KEEP**.

### A6b. "Graph2Plan accepts a room box only at IoU ≥ 0.65" (FP-03, FP-18)
- CLAIM (verbatim, FP-03): "Graph2Plan accepts a room box only at IoU ≥ 0.65 — a deliberately **loose** geometric tolerance"; grid translation: "Set the tile-grid acceptance at `IoU ≥ 0.65` per room, **matching the published threshold**". FP-18 repeats "accept `≥ 0.65`".
- WHAT THE SOURCE ACTUALLY SAYS: 0.65 is an **average IoU evaluation score** in the paper's results, not an acceptance gate or a validity threshold. No "room box accepted iff IoU ≥ 0.65" rule was found.
- PROBLEM: a reported score is recast as a threshold, then hard-wired into two executable rules, then used as the *premise* of FP-03's topology-over-geometry argument. Tier inflation plus misdescription.
- STATUS: **CONTRADICTED**.
- ACTION: **REPLACE** "matching the published threshold" with "project-chosen, at the level Graph2Plan reports as its average IoU".
- CLOSES WITH: nothing needed — the fix is a wording change; the constant may stay as a local choice.

### A6c. "nodes = rooms, edges = adjacencies realised through doors" (FP-02, FP-07)
- WHAT THE SOURCE ACTUALLY SAYS: nodes are rooms; edges connect adjacent rooms **via doors or proximity**. FP-07's stronger inference — "an opening that does not separate exactly two spaces cannot be represented in the graph at all — that is the formal reason it is invalid" — is not the paper's formalism, because proximity edges need no opening.
- STATUS: **PARTIALLY SUPPORTED**. ACTION: **QUALIFY** (the rule's binary-door predicate stands on its own engineering merits).

### A7. HouseDiffusion (FP-02, FP-03, FP-07, FP-10, FP-15, FP-16, FP-18, FP-22, FP-23, FP-24, FP-25)
- CLAIMS: joint discrete+continuous denoising; "**interior door** and **front door**" as the only two door classes; **FID** for diversity and a "**modified graph edit distance**" for compatibility; baselines "produce **duplicate or missing rooms**, ignoring the input constraint"; "**60,000 vector floorplans** from RPLAN"; "**(CVPR 2023)**".
- SOURCE: https://arxiv.org/abs/2211.13287.
- WHAT THE SOURCE ACTUALLY SAYS: the abstract page confirms the exact title and "evaluated our approach on RPLAN dataset", and claims improvements "in all the metrics" without naming any. It gives no plan count, no FID/GED, no door taxonomy, no CVPR statement, no critique-of-baselines sentence.
- PROBLEM: not disproof — the abstract is simply not the carrier for these details. But the file cites only that URL, and the bolded "duplicate or missing rooms, ignoring the input constraint" reads as a quotation from a page that contains no such sentence.
- STATUS: **UNVERIFIED** (paper real; specifics plausible, unconfirmed today).
- ACTION: **QUALIFY** — mark "body not read; abstract only" on the 60,000 count, the two door classes, the modified-GED attribution and especially the quoted critique.

### A8. "Data and Benchmarks for Data Structure Driven Generative Floor Plan Synthesis" = "the ECCV-track benchmark" (Sources, FP-25)
- WHAT THE SOURCE ACTUALLY SAYS: the page at 2407.15723v1 is titled "**DStruct2Design: Data and Benchmarks for Data Structure Driven Generative Floor Plan Design**" (Luo, Lara, Luo, Golemo, Beckham, Pal), arXiv only — **no ECCV statement anywhere on the page**. Its metric taxonomy is confirmed: "Self Consistency metrics measures how numbers agree with each other in the generated floor plan"; "Prompt Consistency metrics evaluate how consistent the generation is to the constraints used in the prompt"; "Compatibility… graph edit distance between the input bubble diagram and one extracted from the output floor plan". ProcTHOR = 12,000 houses ✔. Benchmarked systems: House-GAN, House-GAN++, HouseDiffusion, ArchiText, AnyHome, Holodeck.
- PROBLEM: two defects — the title is misquoted ("Synthesis" vs "Design") and the venue/tier label "ECCV-track" is unsupported (tier inflation). The specific quantity names "Overlap" and "Total Area" as *the two* self-consistency measures were not surfaced by the fetch; treat as unconfirmed. Note the compatibility metric is over a **bubble diagram**, not a door graph — mildly different from FP-02's framing.
- STATUS: **CONTRADICTED** (title + venue) / PARTIALLY SUPPORTED (metric taxonomy).
- ACTION: **REPLACE** the title, **REMOVE** "ECCV-track" (say "arXiv preprint"), **QUALIFY** "Overlap/Total Area" to "e.g. overlap and total-area style self-consistency numbers".

### A9a. The layout review: metric triple, overlap failure, dataset list (FP-06, FP-10, FP-14, FP-15, FP-18)
- WHAT THE SOURCE ACTUALLY SAYS: title verbatim "Computer-Aided Layout Generation for Building Design: A Review"; metrics "Fréchet Inception Distance", "Graph Edit Distance", "Intersection over Union (IoU)" ✔; failure quote "occasional unnecessary overlap between rooms" ✔ (the file's version drops "occasional"); datasets listed: RPLAN, LIFULL, Structured3D, Zillow, CubiCasa5k, ProcTHOR-10k, 3D-FRONT, SG-FRONT ✔ — so FP-19's second-hand 3D-FRONT/LIFULL mention is fine. Constraint families: "residential boundary" and "bubble diagram" confirmed; "circulation" and "proportion" as named families were not surfaced.
- STATUS: **PARTIALLY SUPPORTED**. ACTION: **KEEP**, with FP-06's "proportion is an explicit quality dimension" softened (that is the author's reading of box-based modelling, not a quoted family).

### A9b. "The review states the focus is residential house layouts and that office/industrial are neglected" (FP-19, FP-20, type-specificity table ×2)
- WHAT THE SOURCE ACTUALLY SAYS: no such neglect statement found in the fetched review text (it does cover "scene layout synthesis" and "other building layouts").
- PROBLEM: this is FP-20's *licence* for authoring non-residential priors, and the audit table's justification in the Office and Industrial rows ("Review states it is neglected") — three rule bodies and two table cells cite a sentence the source does not carry. The underlying judgement (no public non-residential plan prior was found) is probably true, but it is this file's own negative search result, not the review's claim.
- STATUS: **UNSUPPORTED** (possible retrieval miss on a long survey; not reachable as refuted).
- ACTION: **REPLACE** attribution with "our own survey of the datasets listed here found no non-residential room taxonomy" — keep the conclusion.

### A10. FP-21 ADA clause numbers and values
- CLAIM: "§403.5.1 clear width of walking surfaces **36 in (915 mm) minimum**; §403.5.3 passing spaces **60 in (1525 mm)**; §404.2.3 door opening clear width **32 in (815 mm) minimum**".
- WHAT THE SOURCE ACTUALLY SAYS: 403.5.1 — "the clear width of walking surfaces shall be 36 inches (915 mm) minimum."; 403.5.3 — "space 60 inches (1525 mm) minimum by 60 inches (1525 mm) minimum"; 404.2.3 — "Door openings shall provide a clear width of 32 inches (815 mm) minimum."
- PROBLEM: none. All three section numbers and all four values exact. This is the best-sourced rule in either file, and the only one where the file's "needs no dataset" claim is earned.
- STATUS: **SUPPORTED**. ACTION: **KEEP**.

### A11. FP-03 "topology beats geometry for perceived validity" — is the flagging honest?
- CLAIM (rule): "When a candidate plan must be wrong about one of {which rooms touch, exact wall coordinates}, make it wrong about wall coordinates; adjacency/topology errors are what **humans** and metrics read as invalid." Class: DESIGN PRINCIPLE, Confidence: Medium.
- WHAT THE SOURCE ACTUALLY SAYS: no human-perception study exists in the corpus; the file's Weak section states this outright ("Whether topology or geometry dominates perceived validity is not directly measured in any source found… A stricter reading is that the two are entangled in every published evaluation"). That disclosure is accurate.
- PROBLEM: honesty is **partial** — the caveat lives only in back matter, while the rule body asserts a human-perception fact with Medium confidence and the grid translation hard-gates on tiers 1–2. Worse, the inference's main prop (loose IoU 0.65 tolerance) is now CONTRADICTED (A6b), so what remains is the existence of GED as a metric.
- STATUS: **INFERRED**.
- ACTION: **QUALIFY** — carry the inference marker into the rule, drop the human clause or restate as an engineering ordering ("we gate on topology because our validators can check it"), and delete "what humans… read as invalid".

### A12. "ITP / Pictor / CADI4RNN could not be verified and were excluded" — confirm, and check nothing relies on them
- CLAIM: "**Unverified names deliberately excluded:** ITP ('iterative transformer prediction', geometric-graph consistency) and Pictor (Microsoft floorplan synthesis) were searched and returned nothing I could confirm; neither is cited anywhere in this file… CADI4RNN could not be verified at all and is excluded."
- LOCAL CHECK (grep, whole file): the tokens `ITP`, `Pictor`, `CADI`, `HouseGAN`, `ArchiText` occur at exactly three lines — 5 (scope paragraph), 290 (Sources: "benchmarks House-GAN, HouseDiffusion, ArchiText"), 303 (the exclusion bullet itself). **No FP rule cites any of them; nothing is load-bearing.** The exclusion is honoured.
- EXTERNAL CHECK: `WebSearch` failed twice this session (tool error), so I could not confirm or deny the existence of these works. Judging only on evidence: Pictor is a known MS Research floorplan-to-3D system line and "CADI4RNN" is a non-standard rendering of the CADI floor-plan corpus family — so the likely error is **over-exclusion (completeness gap), not fabrication (soundness gap)**.
- PROBLEM (internal): line 5 promises that the file converts "Graph2Plan, HouseDiffusion, **ITP, CADI4RNN**, HouseGAN++, Pictor, …" into rules, contradicting line 303's statement that they were excluded. A reader of the scope paragraph reasonably infers coverage the file does not have.
- STATUS: **PARTIALLY SUPPORTED** (exclusion honoured; existence UNVERIFIED; scope paragraph contradicts caveats).
- ACTION: **QUALIFY** line 5 (drop the unverified names from the coverage list, or mark them "(searched, excluded)"). Re-run the existence search before deleting the line — if ITP/Pictor exist, that is a coverage gap to fix by adding them, never by silently dropping the note.

### A13. FP-12's 0.6 repetition ratio, FP-05/06 numeric bands, FP-09 circulation bands
- Self-labelled `UNCITED — heuristic` in the rule text and repeated in the Weak section. Accurate labelling; no source is being smuggled in. **STATUS: INFERRED (disclosed) / ACTION: KEEP.**

---

## Part B — bim-cad.md

### B1a. `IfcRelConnectsPathElements` — the definition sentence and attribute list
- CLAIM: "provides the connectivity information between two elements, which have a path information", and "the inherited `IfcRelConnects` attributes listed on that page are `RelatingPriorities`, `RelatedPriorities`, `RelatedConnectionType`, `RelatingConnectionType`, `RelatingLayerCount`, `RelatedLayerCount`".
- WHAT THE SOURCE ACTUALLY SAYS: the LBL IFC2x3 mirror page loads and states verbatim: "The _IfcRelConnectsPathElements_ relationship provides the connectivity information between two elements, which have a path information." Attributes listed: RelatingPriorities, RelatedPriorities, RelatedConnectionType, RelatingConnectionType, RelatedLayerCount, RelatingLayerCount, ConnectionGeometry, RelatingElement, RelatedElement.
- PROBLEM: none on existence or wording — this is the single best-verified normative-looking claim in the file. Minor: the six are the relation's **own** attributes, not inherited `IfcRelConnects` ones (inherited are Name/Description/RelatingObject/ConnectedObjects); and the page also carries `ConnectionGeometry`, `RelatingElement`, `RelatedElement`, which the file omits while asserting the IFC4 names `ConnectingElement`/`ConnectedElement` are unread.
- STATUS: **SUPPORTED**. ACTION: **KEEP**, fix the "inherited" label.

### B1b. "the relation is inherently binary, and connector-priority attributes order which connection wins" (BIM-06 rule text)
- WHAT THE SOURCE ACTUALLY SAYS: binary — yes ("between two elements"). The priority attributes describe ordering along the connected elements for path routing, not a precedence rule deciding which of several competing connections "wins".
- PROBLEM: the standard says something narrower than the rule's sentence; "which connection wins" is an authoring-policy reading, and it is currently inside a rule labelled Class: FACT, Confidence: High.
- STATUS: **PARTIALLY SUPPORTED**. ACTION: **QUALIFY** ("priorities order the connection along each element's path; using them to arbitrate competing connections is our reading").

### B1c. The two-port / connectivity state machine; IFC4 `ConnectingElement` / `ConnectedElement` + connector ports
- The file states these were **not** readable and lists them in Weak-or-contested ("The connector/port *state machine* in BIM-06 is the part I could not verify"). The IFC2x3 page read here contains **no** port concept at all, which is consistent with the file's admission.
- STATUS: **UNVERIFIED** (honestly flagged). ACTION: **KEEP** the flag; do not let downstream text upgrade it.

### B2a. `IfcZone` / `IfcSpatialZone` quotes from buildingSMART IFC4.x-development issue #1 (BIM-04, BIM-03, BIM-11, BIM-14, BIM-21)
- CLAIM: TLiebich — "IfcZone is an arbitrary collection of spaces that may or may not be adjacent and do not have an own shape representation"; resolution "per Moult, to 'make these minor tweaks to the definition of IfcZone'"; `IfcSpatialZone` "has an independent shape where IfcZone does not".
- WHAT THE SOURCE ACTUALLY SAYS: verbatim, all three. Issue opened by I-Sokolov ("Why do we have both IfcZone and IfcSpatialZone. It sounds confusing."). TLiebich: "* IfcZone is an arbitrary collection of spaces that may or may not be adjacent and do not have an own shape representation." and "* IfcSpatialZone is a spatial element that has an own shape representation and is part of a spatial structure…". Moult: "Marking this issue as 'decided' - the decision is to make these minor tweaks to the definition of IfcZone."
- PROBLEM: the substance is exact, including the asymmetry the file relies on (own shape vs none). Attribution is right down to participant handles.
- STATUS: **SUPPORTED**. ACTION: **KEEP**.

### B2b. "an issue tracker as evidence for normative content" + the fire/security/phase enumeration
- CLAIM (BIM-04): "`IfcSpatialZone` exists for the cases where the grouping needs its own independent shape (**fire compartment, security zone, construction phase**, …)"; and "the thread's stated problem is that this limits zones for **fire/security** use". Tier assigned: **T1**.
- WHAT THE SOURCE ACTUALLY SAYS: the thread explains the shape difference and the decision; the use-case enumeration (fire compartment / security zone / construction phase) was **not** present in the thread content read here. The stated problem in the thread is naming confusion, not a fire/security limitation.
- PROBLEM: real risk correctly identified by the task — an issue thread is **editorial intent, not normative text**, and T1 overstates it. The file's own Sources entry does say "official development repository; discussion, not the normative clause", so this is a tier label contradicting an accurate caveat, not a hidden error. The parenthetical use cases are unsourced specificity.
- STATUS: **UNSUPPORTED** (enumeration) / tier inflation (T1 → should be T2-equivalent for normative use).
- ACTION: **QUALIFY** — re-tier as "first-party editorial intent, non-normative"; move the fire/security/phase list to `UNCITED — heuristic`.

### B3. "`5.4.3.82` IfcZone, IFC 4.3.2 documentation" + two contradictory pointer URLs
- CLAIM: BIM-04's second source line: "5.4.3.82 IfcZone, IFC 4.3.2 documentation https://standards.buildingsmart.org/IFC/RELEASE/IFC4_3/HTML/lexical/IfcZone.htm — T1 (URL verified via search index, body 403)". BIM-01's pointer for a *different* claim uses "…/IFC/**DEV**/IFC4_3/HTML/lexical/IfcZone.**html**".
- WHAT THE SOURCE ACTUALLY SAYS: not readable by this client today either; the section coordinate "5.4.3.82" therefore cannot be confirmed, and DEV-vs-RELEASE plus `.htm`-vs-`.html` means at least one of the two URLs in the file is not the page it claims.
- PROBLEM: a precise documentation clause number is asserted for a page the file states was never opened, under a tier label of T1 — the classic shape of an invented coordinate. **Flagged as possible fabrication** (unprovable either way today). It is also load-bearing-shaped: BIM-01 points at *IfcZone* while asserting the Project→Site→Building→Storey→Space chain, an entity mismatch.
- STATUS: **UNVERIFIED** (suspect precision).
- ACTION: **REMOVE** the clause number (or mark `UNCITED — heuristic`); give BIM-01 a pointer that addresses the spatial-structure chain.

### B4. BIM-01 spatial chain `Project → Site → Building → Storey → Space`
- The file states plainly: "Evidence: UNCITED — heuristic (the five-class spatial hierarchy is asserted here from general IFC knowledge; the lexical pages were not readable this session, so no sentence is quoted)" + Confidence Low + ISO 16739-1:2018 "cited by number, text not retrieved".
- PROBLEM: none of honesty; the chain matches well-known IFC structure and no contradiction surfaced. Unverifiable, correctly labelled.
- STATUS: **UNVERIFIED (disclosed)**. ACTION: **KEEP**.

### B5. BIM-02 `IfcRelContainedInSpatialStructure` as a first-class relation with one container
- Entity name real (also used in the mapping table). The exactly-one-container constraint is not sourced. Self-labelled `UNCITED — heuristic`, Low.
- STATUS: **UNVERIFIED (disclosed)**. ACTION: **KEEP**.

### B6. BIM-05 `IfcRelSpaceBoundary` attribute list
- CLAIM: attributes `RelatingSpace`, `RelatedBuildingElement`, `BoundaryType`, `PhysicalOrLogicalBoundary`, `CorrespondingBoundary`, plus the first/second-order distinction.
- WHAT THE SOURCE ACTUALLY SAYS: page not retrieved (403 claim by the file). The file flags this list as "not verified this session and must not be quoted downstream", and the Weak section repeats it.
- PROBLEM: two of the five names look wrong to this auditor (`RelatingSpace` — the relating side is a spatial structure, not `RelatingSpace`; `PhysicalOrLogicalBoundary` — IFC's qualifier is a physical/or Logical distinction expressed differently) — but with no page readable this is **wrong-suspicion, not proof**. The real defect is *placement*: the caveat is in BIM-05, while the same family of names reappears in the IFC→grid mapping table (row `IfcRelSpaceBoundary`) where no caveat travels with it, which is precisely how an unverified list gets copied.
- STATUS: **UNVERIFIED**, likely at least one non-existent attribute name.
- ACTION: **QUALIFY** — cut the attribute list to the names that matter for the grid, or repeat the `UNCITED` marker inside the mapping-table row.

### B7. BIM-07 `IfcOpeningElement`: void linked to the wall, filler linked to the void
- Consistent with `IfcRelVoidsElement` (wall → opening) and `IfcRelFillsElement` (opening → filler), both named in the mapping table; names real; direction correct. Not read this session; Confidence Low, disclosed. Aside in the rule ("full-height open portals have no filler element in IFC either") is an unfetched extra claim, harmless.
- STATUS: **UNVERIFIED (disclosed, plausible, internally consistent)**. ACTION: **KEEP**.

### B8. BIM-11 `IfcDistributionSystem` naming and enumeration families
- Entity name real. The listed families are hedged as "covering families such as…" and Confidence Low for the enum, disclosed. The "system = grouping, not routing" reading is explicitly derived from the `IfcZone` thread (B2a verified) as an **analogy**, not as an IFC statement — that is honest reasoning, correctly marked.
- STATUS: **UNVERIFIED (disclosed) / PARTIALLY SUPPORTED (analogy)**. ACTION: **KEEP**.

### B9. BIM-14 "Quantities must be derived, never authored"
- CLAIM (rule, Class: STANDARD): "Quantity sets (`Qto_*`, e.g. for spaces and walls) define net / gross / burden areas as computed from geometry… a model carrying hand-entered areas is untrustworthy".
- WHAT THE SOURCE ACTUALLY SAYS: nothing retrieved; the file marks the quantity names `UNCITED — heuristic`, and grounds the "derived" principle on "the same one that makes `IfcZone`/`IfcSpace` groupings shape-free… (BIM-04, sourced)".
- PROBLEM: the `Pset_`/`Qto_` prefixes and the net/gross/burden qualifier vocabulary are real IFC conventions; but "must be derived, **never** authored" is a delivery-practice recommendation the standard does not phrase as a prohibition, and the borrowed `IfcZone` "shape-free" argument does not imply it (a shape-free grouping says nothing about how quantities are computed). Rule is Class: STANDARD, Confidence Low — the mismatch is class, not confidence.
- STATUS: **PARTIALLY SUPPORTED**. ACTION: **QUALIFY** — "IFC quantity sets are defined as geometry-derived values; 'never authored' is this repo's validator policy".
- Note: the rule's grid half ("the grid computes plan areas exactly, integer tiles × 0.25 m²") is arithmetic and is the file's own verified contribution.

### B10. BIM-16 IDS / BIM-17 "ISO 29481 formalised the IDM/MVD pair"
- CLAIM: "the subset of entities, attributes and relationship paths that a given exchange actually uses (ISO 29481 formalised the Information Delivery Manual / Model View Definition pair)". Cited as "ISO 29481 (IDM/MVD) — T1, cited by number only, text not retrieved".
- PROBLEM: honestly marked, and the Weak section even retracts it ("'MVD/IDM are ISO 29481' are directional claims… the part-to-standard mapping was not checked and may be wrong"). But BIM-17's rule text still asserts the mapping in the indicative, so rule and caveat disagree; IDS (the modern mechanism) is correctly *not* given any construct names.
- STATUS: **PARTIALLY SUPPORTED** (ISO 29481 is a real BIM-information-delivery series; the IDM/MVD framing is imprecise, MVD formalisation is more properly bSI MVD certification + ISO 16739 annexes).
- ACTION: **QUALIFY** to "ISO 29481 covers information delivery manuals; treat the MVD pairing as unverified".

### B11. BIM-19 ISO 19650 "level of information need" / BIM-24 bSDD + Uniclass/OmniClass
- Cited by number/name only, text not retrieved, Confidence Low, and explicitly "no IDS construct is asserted". "Level of information need" is a genuine ISO 19650 concept and bSDD/Uniclass/OmniClass are genuine artefacts; no clause or registry entry is quoted, so nothing is at risk of being wrong-but-cited.
- STATUS: **UNVERIFIED (disclosed)**. ACTION: **KEEP**.

### B12. BIM-20 / BIM-21 space-syntax and Alexander references
- All four title-only (Hillier & Hanson 1984; Hillier 1996; Penn/Hillier/Banerjee/Xu, *Environment and Planning B* 1997; Alexander, *Architectural Forum* 122(1/2), 1965), each labelled "not retrieved" with volume/pages unverified, and the Weak section states BIM-20's citation set is title-only and that space syntax is internally contested.
- PROBLEM: none beyond depth; the file's *use* of them is as naming attribution for a design principle, and its load-bearing claim (tree vs non-tree grouping) was verified through B2a.
- STATUS: **UNVERIFIED (disclosed)**. ACTION: **KEEP**.

### B13. BIM-22 / BIM-23 grid-loss and re-derive claims, and the repo code pointer
- CLAIM: `deriveFloorRooms` at `src/engine/npc/rooms.ts:2,15,33` is the grid's `IfcSpace` factory; door cells belong to no room; 4-connected flood-fill.
- WHAT THE CODE ACTUALLY SAYS: line 2 is the comment "boundaries: they belong to no room, so occupancy never gates a doorway"; line 15 skips seeds that are already assigned, are door cells, or are not walkable; line 33 applies the same exclusion to neighbours, over a 4-direction loop (`for d = 0..3`). The pointer is accurate and the derivation is pure and deterministic per call.
- PROBLEM: none. These are claims about this repo and they hold. BIM-23's failure mode (flood-fill ordering assigning room ids, `room-${roomIndex}` incremented in scan order) is real: ids are scan-order-dependent, so stored ids do break across edits — exactly as the rule warns.
- STATUS: **SUPPORTED (repo-verified)**. ACTION: **KEEP**. The `not representable` third verdict in BIM-22 stays the file's best single line.

### B14. Mapping-table entity-name hygiene
- Names checked against the two pages actually read: `IfcRelConnectsPathElements` ✔ exact, `IfcZone`/`IfcSpatialZone` ✔ exact, `IfcRelContainedInSpatialStructure`, `IfcRelAggregates`, `IfcRelVoidsElement`, `IfcRelFillsElement`, `IfcRelDefinesByProperties`, `IfcElementQuantity`, `IfcLocalPlacement`, `IfcAxis2Placement2D/3D`, `IfcBuildingStorey`, `IfcMaterialLayerSetUsage`, `IfcGrid`, `IfcStair`/`IfcStairFlight`, `Pset_*`/`Qto_*` — all real IFC names to this auditor's knowledge; **none appears to be invented**.
- PROBLEM candidates: (a) "ConstituentSet" in BIM-12 / the table row `IfcMaterial` / `IfcMaterialLayerSet(Usage)` / `ConstituentSet` — the actual entity is `IfcMaterialConstituentSet`; the shorthand is a naming error, not a phantom entity. (b) `IfcRelSpaceBoundary`'s attributes inside the table row carry no caveat (B6). (c) the table labels rows "(SOURCED)" for `IfcZone`, `IfcSpatialZone`, `IfcRelConnectsPathElements` — verified correct, and notably *no other* row is marked SOURCED, which is honest.
- STATUS: **PARTIALLY SUPPORTED**. ACTION: **QUALIFY** (expand `IfcMaterialConstituentSet`; add the `UNCITED` marker to the `IfcRelSpaceBoundary` row).

---

## Part C — totals

**floor-plans.md** (16 assessed items):

| Status | n | Items |
| --- | --- | --- |
| SUPPORTED | 3 | A3 FloorPlanCAD, A6a Graph2Plan validity suite, A10 ADA clause numbers+values |
| PARTIALLY SUPPORTED | 6 | A2 CubiCasa5K, A4a MSD counts/zones/filter, A5 Swiss Dwellings, A6c Graph2Plan edges, A9a review, A12 exclusion honesty |
| INFERRED | 2 | A11 FP-03 topology>geometry, A13 heuristic bands/shares |
| UNSUPPORTED | 1 | A9b "review says office/industrial are neglected" |
| CONTRADICTED | 3 | A1 RPLAN 80,315, A4b MSD vertical alignment, A6b IoU 0.65 as threshold, plus A8 title/venue (= 4 incl. A8) |
| UNVERIFIED | 1 | A7 HouseDiffusion specifics (abstract-only page) |

(Contra-count: CONTRADICTED n = 4 with A8; total 3+6+2+1+4+1 = 17 line items, since A4 and A6 and A9 were split.)
- **No fabricated dataset, paper or code clause found.** All named sources exist; two title/venue errors (A8: wrong title word + invented "ECCV-track"), three wrong/misattributed statistics (A1, A4b, A6b), one unsourced attribution (A9b), one suspect clause coordinate (B3).
- FP rule soundness: FP-21 is the only rule with a fully verified T1 numeric source. FP-13, FP-12, FP-23, FP-03, FP-18, FP-19, FP-20, FP-25, FP-01 all touch a contradicted or unsupported attribution.

**bim-cad.md** (17 assessed items):

| Status | n | Items |
| --- | --- | --- |
| SUPPORTED | 3 | B1a path-elements definition, B2a zone quotes, B13 grid-loss/re-derive + code pointer |
| PARTIALLY SUPPORTED | 4 | B1b "which connection wins", B9 quantities, B10 ISO 29481, B14 table-name hygiene |
| UNSUPPORTED | 1 | B2b fire/security/phase enumeration (+ T1 tier inflation) |
| CONTRADICTED | 0 | — |
| INFERRED | 0 | — |
| UNVERIFIED | 9 | B1c ports state machine, B3 clause 5.4.3.82, B4 spatial chain, B5 containment, B6 space-boundary attributes, B7 opening/void, B8 distribution enum, B11 ISO 19650 + bSDD, B12 space-syntax/Alexander titles |

- **One suspected fabrication**: the documentation clause number "5.4.3.82 IfcZone" (B3), asserted for a page the file says was never read, alongside two mutually inconsistent URL forms. Everything else suspect is *self-labelled* unverified.
- **No IFC entity name found to be invented**; the only naming defect is `ConstituentSet` for `IfcMaterialConstituentSet`, plus a possibly-nonexistent `PhysicalOrLogicalBoundary` / `RelatingSpace` attribute pair that could not be refuted today.

## Part D — the 5 most dangerous claims

1. **FP-13 / FP-12 / FP-23 — "MSD explicitly documents vertical alignment of rooms across storeys" (Confidence: High).** The cited paper says only that unit IDs recur across floors of multi-storey apartments. A cross-floor hard validator (portal identity, wet-room mask overlap ≥ 0.6) is currently justified by a property the benchmark does not measure. *Fix: re-attribute to engineering practice, Confidence → Medium.*
2. **FP-01 / FP-25 / Sources / audit table — "RPLAN 80,315 per the ECCV-track benchmark".** That page says 80,788, is titled *DStruct2Design … Floor Plan Design*, and claims no ECCV. A wrong number plus an invented venue, propagated to four places. *Fix: replace number, remove venue.*
3. **FP-03 / FP-18 — "Graph2Plan accepts a room box only at IoU ≥ 0.65 … matching the published threshold".** 0.65 is Graph2Plan's average reported IoU, not an acceptance gate; it is simultaneously the hard constant in two rules and the sole empirical prop for the file's topology-over-geometry thesis. *Fix: relabel as project-chosen; restate FP-03 without the human-perception claim.*
4. **FP-19 / FP-20 + audit table ×2 — "the review states office and industrial are neglected".** Used as the licence to author every non-residential prior in Domain A. The fetched review text carries no such statement — the negative result is the file's own, which is a perfectly good reason but not a citation. *Fix: change attribution, keep conclusion.*
5. **bim-cad B3 + B6 — precise IFC identifiers asserted from unread pages** ("5.4.3.82 IfcZone", the DEV/RELEASE + .htm/.html mismatch, and the five `IfcRelSpaceBoundary` attribute names, one list of which reappears uncaveated in the mapping table). Lower-consequence than 1–4 because the file's tiering is honest, but these are the strings a downstream agent will copy as fact. *Fix: remove the clause number, caveat the table row.*
   - Honorable mention: B2b's T1 tier on an issue-tracker thread (content verified; source class overstated for normative use).

## Part E — safe-as-foundation judgement

**bim-cad.md: safe as a foundation — and it is the more trustworthy of the two.** Its two readable sources quote out exactly (`IfcRelConnectsPathElements` definition + attribute set; the `IfcZone`/``IfcSpatialZone` decision), its grid-loss and re-derivation claims are verified against `src/engine/npc/rooms.ts`, and 9 of 17 items are *deliberately* unverified with the admission attached rather than hidden. Ship it with four surgical fixes: remove the "5.4.3.82" clause number, re-tier issue #1 as first-party editorial intent, drop the fire/security/phase enumeration or mark it heuristic, and carry the `UNCITED` marker into the mapping-table rows (`IfcRelSpaceBoundary`, `IfcMaterialConstituentSet`). Do not let BIM-06's "which connection wins" or BIM-14's "never authored" keep their STANDARD/FACT framing as citations.

**floor-plans.md: safe only after four numeric attributions are corrected.** The structural and meta rules (FP-04, FP-15, FP-16, FP-17, FP-18's metric set minus the 0.65 wording, FP-19's quarantine mechanism, FP-24) need no literature and survive intact; the dataset core is real and largely accurate (CubiCasa 5,000 / 80+ categories verbatim, FloorPlanCAD 10,000+ / 30 line-grained categories verbatim, MSD 5,372 / 18.9 K units / four zones / 16.6 % residential filtering, Swiss Dwellings over-45,000 apartments in ~3,100 buildings, ADA 403.5.1 / 403.5.3 / 404.2.3 exact). What must not ship as written: the 80,315 figure, the MSD vertical-alignment attribution, IoU-0.65-as-threshold, the review's alleged neglect statement, and the "ECCV-track" label. Its exclusions are honoured — grep confirms no rule depends on ITP, Pictor, CADI4RNN, House-GAN++ or ArchiText — but the scope paragraph (line 5) advertises coverage of names that line 303 says were dropped; fix that internal contradiction, and re-run the existence check for ITP/Pictor/CADI4RNN, which today's search tooling could not complete.
