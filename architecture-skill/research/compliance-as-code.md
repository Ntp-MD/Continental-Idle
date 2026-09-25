# Research file — Domain AH: Machine-checkable rules and compliance engines

Scope: the **engineering layer that turns a spatial rule into a deterministic machine check** — the field-by-field
anatomy of a checkable rule, worked encodings a developer can port, which rule classes are decidable on a discrete
grid and which are not, the input contract a check needs before its verdict means anything, the numeric and
identity disciplines that make a verdict reproducible, rule-pack versioning, results governance and checker
testing. It adds *implementation*, not *intent*: BIM-16 already says a rule is a (selection, constraint, severity)
triple, BIM-17 that a model view is a declared subset, BIM-18 that geometry/classification/properties are three
passes, BIM-19 that information need is staged; VA-11 already says the suite is a declarative versioned artefact,
VA-12 that the checker must be fixture-tested, VA-13 that false positives are budgeted and suppression written
down. Nothing above is re-argued here; this file supplies the concrete rule schema, the per-class computability
verdict, the coercion/tolerance/identity policy, the pack manifest, the finding vocabulary and the evaluation loop
that close `coverage-map.md` §5's open "compliance-as-code engineering" gap. Thresholds are never owned here — they
are bound from `building-codes.md` (CODE-nn), `vertical-transport.md` (VT-nn), `multi-scale.md` (MS-nn) and the type
card. `CA-` is a new prefix; `AH` is the next domain letter after the v3 layer `Y–AG`.

Host grid, unchanged: `1 tile = 0.5 m`; `4 tiles = 1 m²`; tile states ONLY `walkable | blocked | door`; wall = one
blocked tile; rooms = flood-fill typed by fixture tags; doors = door-tile runs; movement = octile A*
(`max(dx,dz)+0.41421×min(dx,dz)`, diagonals only when both corner neighbours are open); vertical = lift/stair
portals with queues; NO heights, NO sections, NO structural/MEP objects. Every encoding below is written so this
engine can run it, and every step it cannot is marked as such in the rule (VA-03, UN-05).

---

## Rules

### CA-01 A checkable rule is six separable fields, and the last three are what makes it auditable
- Rule: Machine-checking a design rule needs `selector` (which objects), `predicate` (what must hold), `scope` (which milestone, building type and jurisdiction it applies to at all), `severity` (how bad), `edition stamp` (which code edition and jurisdiction the number came from) and `evidence pointer` (which objects and which measured value produced this verdict). BIM-16's triple is the executable core; the three extra fields are what let a verdict be replayed, diffed across revisions and handed to a reviewer. A rule missing one is not a check — it is an opinion with a boolean.
- Evidence: IDS splits a specification into the first two and publishes the split: "Specifications consist of two parts: applicability - describing what elements are subject to this specification, and requirements - listing what those applicable elements should or shouldn't have", "Applicability: Identifies the subset of the model that we are intending to specify". Scope arrives as data, not prose: `purpose` ("quantity take off", "accessibility analysis", "clash detection", "coordination", "cost estimation") and `milestone` ("Schematic Design", "Construction", "Commissioning", "RIBA Stage 3", "As-built", "350", "400"), plus a per-specification `ifcVersion`. The evidence pointer is SHACL's mandatory result set: "The properties sh:focusNode, sh:resultSeverity and sh:sourceConstraintComponent are the only properties that are mandatory for all validation results", extended by `sh:resultPath` and `sh:value`. SARIF carries the same six as `reportingDescriptor` (`id`, `fullDescription`, `defaultConfiguration`, `helpUri`) plus a result carrying `ruleId`, `locations` and `provenance` — "Information about how and when the result was detected."
- Source: buildingSMART, *IDS User Manual — specifications.md* https://raw.githubusercontent.com/buildingSMART/IDS/development/Documentation/UserManual/specifications.md — T1 (read); *ids-metadata.md* https://raw.githubusercontent.com/buildingSMART/IDS/development/Documentation/UserManual/ids-metadata.md — T1 (read); W3C, *SHACL 1.0* §3.6.2 https://www.w3.org/TR/shacl/ — T1 (read); OASIS, *SARIF 2.1.0 JSON schema* https://raw.githubusercontent.com/oasis-tcs/sarif-spec/refs/heads/main/sarif-2.1/schema/sarif-schema-2.1.0.json — T1 (read). Cross-ref: BIM-16, VA-11.
- Class: FACT (of the three specifications) + DESIGN PRINCIPLE (bundling six into one record is this file's)
- Scope: universal
- Confidence: High — every field name quoted was read from the primary artefact; the claim that the last three are *the auditable part* is this file's framing
- Grid translation: `{id, select, assert, scope:{milestone, type_card, jurisdiction, edition}, severity, evidence:[keys]}`. `select`/`assert` are pure functions of the payload; the other four are data, so a pack diffs cleanly and a verdict replays without reading code. Metric keys: `rules_total`, `rules_missing_field[by field]`.
- Exceptions / failure mode: scope hard-coded inside the predicate (`if type == "hotel"` in the geometry function) cannot be re-versioned or re-jurisdictioned; observable symptom is two packs whose manifests look identical but disagree on one verdict.

### CA-02 Selectors are typed queries over a declared vocabulary, never hard-coded id lists
- Rule: The selector names classes, attributes, tags and relations and is evaluated against the model; it never enumerates instances. Instance lists rot on the first edit, whereas a typed selector fails loudly when the vocabulary changes — which is the behaviour you want before a run, not during one.
- Evidence: IDS restricts selection to six typed facets — Entity (IFC Class + Predefined Type), Attribute (Name + Value), Classification (System + Value), Property (Property Set + Name + Value), Material (Value), Parts (Entity + Relationship) — and forbids free naming: "A valid IFC class from the IFC schema. The IFC Class must match exactly. Expressed in UPPERCASE." Relation targeting is a closed enumeration in the schema itself (`IFCRELAGGREGATES`, `IFCRELASSIGNSTOGROUP`, `IFCRELCONTAINEDINSPATIALSTRUCTURE`, `IFCRELNESTS`, `IFCRELVOIDSELEMENT`/`IFCRELFILLSELEMENT`). IfcOpenShell's operational query language is the same discipline with syntax: `IfcDoor, Name=/D[0-9]{2}/`, `IfcElement, /Pset_.*Common/.FireRating != NULL`, `IfcPump, location="Level 3"`, with `,` chaining, `+` union, `!` subtraction and `.` path nesting. SHACL formalises targeting as `sh:targetNode`, `sh:targetClass`, `sh:targetSubjectsOf`, `sh:targetObjectsOf`.
- Source: buildingSMART, *entity-facet.md* https://raw.githubusercontent.com/buildingSMART/IDS/development/Documentation/UserManual/entity-facet.md — T1 (read); *ids.xsd* https://raw.githubusercontent.com/buildingSMART/IDS/development/Schema/ids.xsd — T1 (read); IfcOpenShell, *Selector syntax* https://docs.ifcopenshell.org/ifcopenshell-python/selector_syntax.html — T1 (read); W3C SHACL §2.1.3 — T1 (read).
- Class: FACT (of the three tools) + STANDARD (closed vocabularies)
- Scope: universal
- Confidence: High
- Grid translation: `select = {kind: room|door|tile|portal|floor, type: registered-tag, where: predicate}`. Legal `type` values come from ONE tag register (GT-20's "exactly one kind per blocked tile" is the same law); a selector naming an unregistered tag is a pack-load error, not a zero-match run. Metric keys: `selector_vocabulary_unknown_count` (must be 0 pre-run).
- Exceptions / failure mode: name-pattern selection is a convention dependency and silently selects nothing after a rename. Prefer tag/type selection; keep name patterns only where the naming convention *is* the rule.

### CA-03 Presence, value and prohibition are three predicates, each with its own zero-match meaning
- Rule: Encode cardinality explicitly as `required | optional | prohibited` and state what an empty match set means for each. `required` with zero matches is a **fail**; `optional` with zero matches is a **pass**; `prohibited` with a match is a **fail**. Leaving this implicit is how a checker reports green against an empty model.
- Evidence: IDS defines the triad with its empty-set semantics verbatim: `minOccurs=1 maxOccurs=unbounded` = "required — At least one wall with the IsExternal property _must_ be found in the IFC model, each such wall must have the fire rating property"; `0..unbounded` = "optional — ... if any such wall is present, they must all have fire rating property"; `0..0` = "prohibited — No wall with IsExternal property should be found in the model, requirements are ignored in the verification of models". Requirement-level wording is equally specific: REQUIRED = "Applicable objects must have the attribute Description populated (i.e. not null)"; OPTIONAL = "If the attribute Description exists on applicable objects, it needs to have the value Answer"; PROHIBITED = "must not exist on applicable objects, even if empty ... Null is also an allowed value in this case". The zero-match question was settled in the standard's own tracker: "if required and count selection = 0 return fail". The trap from the opposite side is in SHACL: "The value of sh:conforms is true if and only if the validation did not produce any validation results, and false otherwise" — a run over a model with no target nodes conforms.
- Source: buildingSMART, *attribute-facet.md* — T1 (read); *specifications.md* — T1 (read); IDS issue #203 *Interpretation of cardinality on specification* https://github.com/buildingSMART/IDS/issues/203 — T1 (read); W3C SHACL §3.6.1.1 — T1 (read).
- Class: STANDARD
- Scope: universal
- Confidence: High on the triad and per-state wording; Medium on zero-match⇒fail — read from a maintainer thread, not from the normative XSD
- Grid translation: `assert.cardinality` with `on_empty` *derived*, not typed (required⇒fail, optional⇒pass, prohibited⇒fail). The engine prints `matched = n` on every report line (CA-05) so a vacuous pass is visible at a glance. Metric keys: `vacuous_pass_count = verdict=pass ∧ matched=0 ∧ cardinality=optional`.
- Exceptions / failure mode: a `prohibited` rule whose requirement is ignored (IDS says so explicitly) must still print `matched`, or a reader infers the prohibition held when nothing was evaluated at all.

### CA-04 Severity belongs to the rule, verdict state to the run; never merge them into one column
- Rule: Two orthogonal axes per finding: *evaluation state* (pass / fail / not-applicable / could-not-run / needs-review) and *severity* (critical / major / moderate / minor). Merging them produces the classic failure where 400 missing-tag warnings bury one missing-exit error — and its twin, where "not run" is averaged into a pass rate.
- Evidence: SHACL puts severity on the shape with a declared default — "Shapes can specify one value for the property sh:severity", "sh:Info: A non-critical constraint violation indicating an informative message ... sh:Violation: A constraint violation", "It defaults to sh:Violation if no sh:severity has been specified for the shape" — while conformance is a separate boolean (`sh:conforms`). SARIF separates them outright: `result.kind ∈ {notApplicable, pass, fail, review, open, informational}` (default `fail`) is evaluation state, `result.level ∈ {none, note, warning, error}` (default `warning`) is severity, and the rule's default lives in `defaultConfiguration`. IDS states the same law as an instruction to checker builders: "If the requirement is optional but would fail if it were required instead, the checker tool must not log an error, but may offer auxiliary warnings or recommendations."
- Source: W3C SHACL §2.1.4, §3.6.1.1 — T1 (read); OASIS SARIF schema — T1 (read); buildingSMART, *IDS developer guide* https://raw.githubusercontent.com/buildingSMART/IDS/development/Documentation/ImplementersDocumentation/developer-guide.md — T1 (read). Cross-ref: VA-03, VA-09, BIM-18.
- Class: STANDARD
- Scope: universal
- Confidence: High
- Grid translation: record = `{state, severity}`; rollups print a matrix, never a scalar. `state="review"` is the advisory channel (CA-07). Metric keys: `state_counts{pass,fail,not_applicable,could_not_run,review}`, `severity_counts`.
- Exceptions / failure mode: a check that re-grades severity per instance (worse shortfall ⇒ higher severity) destroys drift detection; severity is set at authoring (VA-11) and the shortfall goes in the measured column.

### CA-05 Every verdict emits an evidence record; a bare boolean is unauditable
- Rule: Each record carries rule id + pack version, the selector's match count and matched object ids, measured value, required value with unit and rounding policy, payload hash, and — for a fail — a counterexample small enough to look at.
- Evidence: SHACL's result class is built out of pointers: `sh:focusNode`, `sh:resultPath`, `sh:value`, `sh:sourceShape`, `sh:sourceConstraintComponent`, `sh:resultMessage`, `sh:detail`. SARIF generalises to `locations` + `relatedLocations` + `codeFlows` + `attachments`, plus `run.versionControlProvenance` ("Specifies the revision in version control of the artifacts that were scanned") and `invocations` (`commandLine`, `startTimeUtc`, `executionSuccessful`). IfcTester's reporters (`Json`, `Ods`, `Html`, `Bcf`) exist precisely so evidence leaves the tool in a form a third party can re-open; BCF's stated purpose is a protocol that "allows different BIM applications to communicate model-based issues", used for "Documenting quality assurance / quality checking (QA/QC) items".
- Source: W3C SHACL §3.6.2 — T1 (read); OASIS SARIF schema — T1 (read); IfcOpenShell, *IfcTester* https://docs.ifcopenshell.org/ifctester.html — T1 (read); buildingSMART, *BIM Collaboration Format (BCF)* https://raw.githubusercontent.com/buildingSMART/technical.buildingsmart.org/main/BIM-Collaboration-Format-(BCF).md — T1 (read). Cross-ref: VA-08, VA-23.
- Class: STANDARD
- Scope: universal
- Confidence: High
- Grid translation: JSON-lines sorted by rule id (CA-17). Witness for a tile rule = `{floor, bbox, tile_ids}` so the report re-renders on the canvas; for a path rule the witness is the path. Metric keys: `records_emitted`, `records_missing_evidence` (must be 0).
- Exceptions / failure mode: over-logging — 400 identical "ok" records is noise. One record per evaluation unit; passes aggregate by rule with a count, distinct failures never do.

### CA-06 Classify every rule by computability class before writing its predicate
- Rule: Five classes, not interchangeable: **G** geometric-metric (distance, width, area, clearance), **T** topological/graph (reachability, cut vertices, adjacency, stacking), **A** aggregating/counting (loads, ratios over a set, uniqueness), **S** sequence/temporal (construction order, event-triggered behaviour, schedules), **N** semantic/negotiated (qualities, intent, "adequate", alternative solutions). The class fixes whether the rule can return pass/fail, must return a band, or must refuse.
- Evidence: the standard's own limitation list is effectively a computability matrix. IDS scopes itself to "specifying and checking simple information requirements" and states that "geometry checks, checks that rely on calculated or dynamic values, checks that reference data outside the IFC model, or use domain specific IFC relationships are not possible", then names the cases: beam/pipe clashes; "All walls need to be 3m away from the site boundary" (G with an external datum); "The total area of all office spaces must be more than 300m2" (A); "The names of all door types must be unique" (A over a set); "All air handling units must have sensors assigned with trigger events" and "Saturday and sunday must be a holiday in all work schedules" (S); "The model must match the as-built state of construction" (N/external truth). Solibri's IDS explainer agrees on the geometry boundary: "NB. IDS currently does not have the capabilities to define intrinsic details of geometry." The literature reports the same wall from the authoring side: the main ARC challenge "lies in translating regulatory text into a format suitable for computer processing", and "Building regulations are usually published as human readable texts and their content is often ambiguous or incomplete".
- Source: buildingSMART, *specifications.md §Limitations* — T1 (read); Solibri IDS article https://www.solibri.com/articles/everything-you-need-to-know-about-information-delivery-specifications — T3 (read); arXiv:2501.14735 *ARCEAK* — T2 (abstract read via export API); arXiv:1910.00334 (Bus, Roxin, Picinbono & Fahad 2019) — T2 (abstract read via export API).
- Class: FACT (of the sources) + DESIGN PRINCIPLE (the five-class authoring gate is this file's partition)
- Scope: universal
- Confidence: High on the boundary statements; Medium on the five-way split being exhaustive
- Grid translation: `class ∈ {G,T,A,S,N}` is a required field; `S`/`N` refuse pass/fail at load; `G` is quantised (CA-09); `T`/`A` this host decides exactly on integer data. Metric keys: `rules_by_class`, `decidable_share = (G*+T+A)/rules_total` where G* counts only thresholds that are whole multiples of the 0.5 m quantum.
- Exceptions / failure mode: an `N` rule smuggled in as `G` ("is the lobby generous?" coded as `area > 40 m²`) yields a deterministic verdict on a question the number does not answer — the most damaging failure mode in this file, because it reads as evidence.

### CA-07 The negotiated class gets advisory status, never a gate
- Rule: Where the predicate contains a judgement a person must make, the only legitimate machine output is a `review` finding: measured proxy, the clause it was read from, and the question a human answers. A green pack must be unable to say "compliant", and must be visibly unable to say it *because those rules were advisory*.
- Evidence: this is the position of the rules-as-code literature, one domain earlier and clearer: turning law into logic meets the point where "this human discretion element cannot be automated", "fundamentally a matter of legal interpretation" precedes any coding, and full automation "risks excluding the Judiciary from performing its constitutional role" because "computers will interpret and execute code the same way each time". Building-domain evidence is observed refusal: legacy checkers "struggle with addressing qualitative aspects of building codes, such as aesthetics and spatial functionality", and a deployed national regime scopes automation to "verify straightforward regulatory requirements, such as those related to geometric and spatial aspects" while "enabling self-checking by consultants prior to submission" — self-check, by a professional, before an authority decides.
- Source: *Legislation as Code* (Barraclough, Fraser & Barnes, March 2021; Te Manatū ā Ture / NZ Law Foundation), documented at DocRef https://docref.org/syncopate/legislation-as-code/1/en/ — T1 (read); arXiv:2506.20551 (Madireddy et al. 2025) — T2 (read); Gov of Singapore, *Overview of CORENET X* https://info.corenet.gov.sg/overview/about-corenet-x/overview-of-corenet-x — T1 (read). Cross-ref: VA-04, VA-20, UN-15.
- Class: STANDARD (the position) + ENGINEERING CONSTRAINT (the tool boundary)
- Scope: universal
- Confidence: High on the boundary; Medium on the quotations' surrounding argument (DocRef is a document record, not the layout-formatted original)
- Grid translation: `class=N` compiles to `{state:"review", question, proxy_metric, proxy_value}` and is counted out of the pass-rate denominator; headline prints `advisory: 11 (not gated)`. Metric keys: `review_open`, `advisory_share`.
- Exceptions / failure mode: advisories are ignored because they never block. Fix by splitting, not by severity inflation: the measurable half becomes a G/T gate, the judgement half stays advisory, the report prints both against the same clause.

### CA-08 Declarative rule languages lose procedural predicates; keep a named imperative escape hatch
- Rule: Selection, presence and value predicates can live in data. Distance-along-a-path under a clearance constraint, exit-disjointness, catchment reachability are *procedures*; every declarative encoding that swallows them either cannot express them or quietly changes their meaning. Ship them as versioned, named, fixture-tested functions that the rule record references by name.
- Evidence: the cleanest proof is ifcOWL, the semantic rendering of IFC: "The IfcOWL ontologies are generated directly from the IFC EXPRESS schemas", and it explicitly excludes part of that schema — "RULE and FUNCTION declarations, because procedural algorithms cannot be converted into OWL2DL class expressions". EXPRESS *does* carry `WHERE` clauses (schema-level procedural constraints); the ontology translation drops them. IDS stays declarative and hands the rest elsewhere: "Case-specific validation is where the mandate of the bSI Validation Service ends - and where other solutions like IDS can help." SHACL concedes the same incompleteness by naming its extension mechanism (`sh:SPARQLConstraint` components alongside the Core vocabulary).
- Source: buildingSMART, *ifcOWL* https://raw.githubusercontent.com/buildingSMART/technical.buildingsmart.org/main/ifcOWL.md — T1 (read); buildingSMART, *validation-service.md* https://raw.githubusercontent.com/buildingSMART/technical.buildingsmart.org/main/validation-service.md — T1 (read); W3C SHACL §3–4 — T1 (read).
- Class: FACT
- Scope: universal
- Confidence: High
- Grid translation: `predicates@vN = {travel_distance_to_exit, clear_width_along_path, dead_end_length, exit_disjointness, stop_coverage, shaft_touches_wet_cell, area_of_room, count_matching}`; rules bind a predicate by name *and version* and carry the threshold as data. A new procedure means a new predicate + fixtures (CA-23), never inlined arithmetic. Metric keys: `rules_reusing_existing_predicate`, `new_predicates_this_pack`.
- Exceptions / failure mode: predicate reuse hides per-rule divergence (one travel rule measures door-centre, another far-corner). Each predicate declares its measurement convention in its own record and the rule prints it in the evidence.

### CA-09 Approximation is priced, never hidden: publish the quantisation band with the verdict
- Rule: Where the grid cannot represent a quantity exactly, the verdict carries an interval and a rounding direction chosen conservatively against the requirement; a marginal case reads `review`, never `pass`. Sub-quantum requirements are refused, not approximated.
- Evidence: the host's own law (GT-05, GT-10, GT-17, CODE-27, VA-17) restated in engine terms — "cited numbers are clause minima, so 1.09 m does not pass 1.10 m". The formal analogue is IDS's numeric discipline: bounds restrictions carry declared inclusive/exclusive semantics ("whether the minimum or maximum is inclusive (e.g. `>=` and `<=`) or exclusive (e.g. `>` and `<`)"), and strict numeric checking is an explicitly named capability with its own conformance test (`pass-strict_numeric_checking_may_be_done_with_a_bounds_restriction`) while default numeric checking is type-casting (`fail-numeric_values_are_checked_using_type_casting_4_4`). IDS also concedes a unit-expressibility limit that transfers directly: "you cannot use IDS to request that the length is measured with a particular unit (e.g. meters, inches, or millimetres)".
- Source: buildingSMART, *restrictions.md* https://raw.githubusercontent.com/buildingSMART/IDS/development/Documentation/UserManual/restrictions.md — T1 (read); *property-facet.md* — T1 (read); IDS TestCases listing https://github.com/buildingSMART/IDS/tree/development/Documentation/ImplementersDocumentation/TestCases — T1 (read, file names); this repo GT-05/GT-10/GT-17, VA-17.
- Class: ENGINEERING CONSTRAINT (host) + STANDARD (bounds semantics)
- Scope: universal on this grid
- Confidence: High
- Grid translation: required stored as integer mm + integer tiles; measured as integer tiles with `band = [m, m+0.5)` for lengths, `[m, m+0.25)` m² for areas; `pass` iff the whole band satisfies the bound, overlap ⇒ `state=review`. Path metrics stay as `(cardinal_steps, diagonal_steps)` pairs; metres are a print-time derivation. Metric keys: `review_from_band_overlap`, `subquantum_refusals`.
- Exceptions / failure mode: double rounding inflating every room; state the policy once per check (VA-17) and print `nearest_legal_tiles` beside the verdict so the slack is visible.

### CA-10 A check's input contract is a declared model subset, validated before any predicate runs
- Rule: Before evaluation the engine declares (a) which payload vocabulary and version it can read, (b) which subset the rule needs, and (c) that the payload itself is structurally sound. If (a) does not cover (b), or (c) fails, the result is *not a verdict*. Checking an undeclared subset is the mechanism by which checkers fail silently: the rule runs, finds nothing to disagree with, reports green. Give the tile grid its own contract artefact — the MVD/IDS equivalent — carrying entity kinds, the tag register, relationship kinds, derived-quantity definitions and the datum.
- Evidence: the IDS implementer documentation makes both halves mandatory. On version: every specification carries `ifcVersion` from a closed list (`IFC2X3`, `IFC4`, `IFC4X3_ADD2`) and "If the software is not capable of parsing the specified IFC version nominated by the IDS specification, then the user should be made aware of the limitation." On model validity: "IDS assumes that the provided IFC model only contains valid data. If the model has syntax errors or IFC schema validation errors, then the model may not be able to be verified. It is the responsibility of the IFC authoring software to ensure that the produced IFCs are valid." SHACL's counterpart is `sh:shapesGraphWellFormed` plus the warning that with ill-formed shapes "the result of the validation process is undefined". The empirical case is a permit study that started from real submissions and abandoned strict semantic parsing: "One storey also includes elements belonging to different storeys", "semantics could be differently assigned by users or software" (slabs labelled as walls), parking provision left "currently deemed very difficult" to automate, and pilots that "often leave a gap with respect to the models as actually provided by architects, having varying quality and content". BIM-17 owns the subset idea; this is its enforcement point.
- Source: buildingSMART, *developer-guide.md* — T1 (read); *ids.xsd* (`ifcVersion` enumeration) — T1 (read); W3C SHACL §3.4.2, §3.6.1.3 — T1 (read); arXiv:2011.03117 (Noardo, Wu, Arroyo Ohori, Krijnen & Stoter) — T2 (read). Cross-ref: BIM-17, VA-07, GT-04, GT-20.
- Class: STANDARD
- Scope: universal
- Confidence: High
- Grid translation: `grid_view@vK = {entities:[floor,room,door_run,portal,tile_band], tile_states:[walkable,blocked,door], tag_register:[…], relations:[aggregates,contained_in,connects_to,voids], derived:{area_m2:"count×0.25", clear_width_m:"min_run×0.5", travel_m:"octile×0.5"}, datum:"project origin, floor-local (x,z)"}`; rules declare `requires:{view, fields, min_stage}` and the loader enforces it. Metric keys: `contract_unmet_rules`, `undeclared_field_hits`, `payload_gate_pass`.
- Exceptions / failure mode: contract drift from the generator — a new tile kind is emitted and every rule enumerating blocked-tile kinds under-counts silently. Diff generator output against `grid_view@vK` and fail the build on a new field, which is exactly what an IDS audit tool exists to do before a model is ever checked.

### CA-11 Unit coercion and datum resolution happen once, at the contract boundary, before any comparison
- Rule: One function converts every incoming magnitude to canonical units and one frame is named for every measurement. Predicates see canonical integers only. Thresholds are authored in the code's unit, converted with a stated direction, and the conversion is printed in the evidence record. Never convert inside a predicate, never trust a unit implied by a field name, and never compare two quantities measured from different frames.
- Evidence: IDS is explicit at both ends. Canonical SI: "Numerical measure values are represented in IDS files using SI units. When IFC models are verified, their values need to be converted to the default unit before comparison." Author-side burden, in the schema itself: "Depending on the IFC type of the attribute, values are expressed in the default unit documented at .../units.md, and unit conversion might be required." The unit lives in the *type*, not the value — `IFCLENGTHMEASURE` is "A floating point number used to measure the physical length of something" — and the tooling rule is to hide the pain from humans but not from the check: "project values will have to be converted to the SI unit before comparison. User Interfaces are permitted to display any unit that the developers or the users prefer." On frames: IDS's containment semantics fix a single primary location — "Every object must have a single primary location container in IFC, even though they may be referenced in multiple locations (such as a multi-storey column). This relationship only targets the primary location container" — and the permit study had to make its reference line an input rather than derive it: "Directional baselines for measurements were manually set, while distance computations ran automatically."
- Source: buildingSMART, *units.md* https://raw.githubusercontent.com/buildingSMART/IDS/development/Documentation/UserManual/units.md — T1 (read); *property-facet.md* — T1 (read); *ids.xsd* — T1 (read); *partof-facet.md* https://raw.githubusercontent.com/buildingSMART/IDS/development/Documentation/UserManual/partof-facet.md — T1 (read); arXiv:2011.03117 — T2 (read). Cross-ref: VA-17, GT-02, GT-04, CODE-27, BIM-15.
- Class: FACT (of the standard) + STANDARD (the choke-point discipline)
- Scope: universal
- Confidence: High
- Grid translation: canonical units mm / mm² / integer tile-steps / seconds, all integers; `tiles_from_mm(mm,mode) = ceil(mm/500)` if mode=="min" else floor(mm/500), called at load only. Predicates take an explicit `frame ∈ {floor_local, project, building_graph}`, default `floor_local`; site-boundary-style rules are refused at load (`could_not_run: no site datum`). Metric keys: `coerced_fields`, `unknown_unit_fields` (must be 0), `cross_frame_comparisons` (must be 0).
- Exceptions / failure mode: a plan imported once as tiles and once as millimetres — everything passes width checks and fails area checks by a factor of four. Recording `input_unit` per field makes the diff immediate. A floor re-anchored between revisions changes every coordinate-derived id with zero design change (see CA-14).

### CA-12 Geometric predicates carry an explicit tolerance; range comparisons carry none
- Rule: Equality on floating-point measurements is never tested directly — a fixed relative+absolute epsilon, declared in the pack manifest and diffed like a threshold, is applied. Bounds are compared exactly, because a tolerance on a bound silently rewrites the clause.
- Evidence: IDS states the policy and the number: "Because of rounding errors, a tolerance value must always be considered for the equality of floating-point numbers", "with a tolerance value being: `ϵ = 1.0e⁻⁶`", formalised as "`x == v ⇒ (v - abs(v) × ϵ - ϵ) < x < (v + abs(v) × ϵ + ϵ)`", with the exception stated twice — "Tolerance does not apply to ranges." and "The values used in ranges (minExclusive/minInclusive/maxExclusive/maxInclusive) should therfore be compared explicitly." — and the value deliberately untunable: "the tolerance value is not configurable, as it is specific only for rounding errors". The developer guide restates it as a scaling compromise: "A float value is considered to be equivalent to a number `x`, if it lies between (exclusive) the range of `x * (1. - 1.e-6) - 1.e-6` and `x * (1. + 1.e-6) + 1.e-6`... This is a compromise and simplification that allows precision to scale from small to large units." Why it is physically necessary: "Unfortunately, most decimal fractions cannot be represented exactly as binary fractions", and `0.1 + 0.1 + 0.1 == 0.3` evaluates `False`, with `math.isclose` offered as the comparison remedy.
- Source: buildingSMART, *tolerance.md* https://raw.githubusercontent.com/buildingSMART/IDS/development/Documentation/ImplementersDocumentation/tolerance.md — T1 (read); *developer-guide.md §Precision* — T1 (read); Python 3, *Floating Point Arithmetic: Issues and Limitations* https://docs.python.org/3/tutorial/floatingpoint.html — T1 (read).
- Class: FACT + STANDARD
- Scope: universal
- Confidence: High
- Grid translation: two tiers. Tier 1 (default here): tile-domain comparisons are integer, so tolerance is never reached — the grid's structural advantage over BRep checking. Tier 2 (imported floats, centroids, octile metres): `isclose(a,b,rel_tol=1e-6,abs_tol=1e-6)`; bounds use exact `<=`/`>=`. Metric keys: `float_comparisons` (lower is better), `tolerance_policy_version`.
- Exceptions / failure mode: an author adds tolerance "to be lenient" and thereby edits the clause — 0.05 m slack on a 1.10 m clear width is a code change, not a rounding fix. Making the epsilon a manifest constant forces it through version control.

### CA-13 Compare on the integer grid; keep floats for reporting only
- Rule: Where an integer representation exists, decisions run on it. Floats enter at exactly two points — ingesting an external metric and rendering a report line — and no verdict is taken from a float comparison. This is what makes a verdict identical across machines and languages.
- Evidence: the quantised host already supplies integer-native predicates (occupancy, adjacency, run length, flood-fill membership, reachability) and its own law is that sub-tile requirements are undecidable rather than approximate (BIM-22, GT-10). The float side is documented behaviour, not folklore: representation error is intrinsic, and the tutorial's guidance for practical use is to "round the display of your final results to the number of decimal digits you expect". IDS's conformance suite encodes the same preference as testable law: `invalid-integers_cannot_be_expressed_as_floating_point_numbers_2_2`, `invalid-specifying_a_float_when_the_value_is_an_integer_is_invalid`, `pass-integers_follow_the_same_rules_as_numbers`.
- Source: Python 3 floating-point tutorial — T1 (read); IDS TestCases listing — T1 (read, file names); this repo GT-10, BIM-22, UN-03.
- Class: ENGINEERING CONSTRAINT
- Scope: universal on this grid
- Confidence: High on the integer preference; Medium on the exact assertions behind the named test cases (file names read from the listing, bodies not opened individually)
- Grid translation: path metrics are `(cardinal_steps, diagonal_steps)` pairs ordered lexicographically; metres derived at print with the factor stated; areas are tile counts until the report line. Metric keys: `float_verdicts` (must be 0), `decisions_on_integers_share`.
- Exceptions / failure mode: a "cleaner" predicate API returning metres and comparing to a float threshold — two platforms disagree at a boundary tile and the same plan passes on one, fails on the other; symptom is a last-decimal diff between runs (CA-17 catches it).

### CA-14 Object identity must survive revisions, or suppression, dedup and trend analysis all break
- Rule: Every checkable object carries a stable identifier not derived from array position, draw order or name, and every finding carries the same identifier so the *same* violation is recognisable across plan revisions. Identity churn turns a fixed problem into a new one and a suppressed problem into an unsuppressed one.
- Evidence: IFC's mechanism is specified: GlobalId is a "unique identifier for object instances that follows the universal unique identifier standard UUID", "compressed for exchange purpose following a published compression function", "a base 64 character encoding" giving "a fixed 22 character length string". IDS treats it as opaque text and forbids interpretation (`pass-globalids_are_treated_as_strings_and_not_expanded`) and separately concedes the limit (`fail-ids_does_not_handle_string_truncation_such_as_for_identifiers`). SARIF solves the finding side explicitly: `result.guid` is "A stable, unique identifier for the result", `partialFingerprints` are "A set of strings that contribute to the stable, unique identity of the result", `correlationGuid` identifies "the equivalence class of logically identical results", and `baselineState ∈ {new, unchanged, updated, absent}` is computed against `run.baselineGuid` — a previous run's identity space.
- Source: buildingSMART, *IFC GUID* https://raw.githubusercontent.com/buildingSMART/technical.buildingsmart.org/main/IFC-GUID.md — T1 (read); OASIS SARIF schema — T1 (read); IDS TestCases listing — T1 (read, names). Cross-ref: VA-13, VA-23, GT-02.
- Class: STANDARD
- Scope: universal
- Confidence: High on the formats; Medium on the transfer — this host has no UUID layer, so tile identity is coordinate-derived and its stability is inherited from the datum (CA-11) and module repetition (MS-14)
- Grid translation: `tile_id = "{floor}:{x}:{z}"`; `room_id = "{floor}:R{hash(sorted(tags), sorted(door_tile_ids))}"` — survives renumbering, changes when the room is genuinely reconfigured, which is the intended semantics. Findings key on `(rule_id, object_id)`. Metric keys: `identity_churn = |Δids| / total_ids`.
- Exceptions / failure mode: whole-plan regeneration renumbers everything, every finding reads `new`, suppressions evaporate and the trend line is noise. Re-run against the previous payload, publish the baseline diff, and treat churn above threshold as a payload defect rather than a design result.

### CA-15 Same payload plus same pack must produce byte-identical output
- Rule: Determinism is a testable property, not a hope: total ordering over every iteration (rule list, selector matches, graph neighbours, tie-breaks), no wall-clock, hash-order or set-iteration leakage into verdicts, one explicit seed recorded for anything stochastic, and a self-check that re-runs the suite and diffs the bytes.
- Evidence: the standards write it into their output formats. IDS: "The order of xml entities within any `xs:sequence` of the schema should be respected. The use of this xml feature is intended to simplify the comparison of contents across files", and conformance is defined as cross-implementation agreement — "All valid IDS implementations must demonstrate identical behaviour against the expected values of the provided test cases." SHACL states processor idempotence explicitly: repeated processing "MAY change existing graphs in an RDF store, but not any of the graphs that were used to construct the shapes graph or the data graph. SHACL processing is thus idempotent." SARIF makes cross-run comparison a field (`baselineGuid`, `baselineState`). Where stochasticity is unavoidable, the corpus's own rule applies (VA-23 version/hash/inputs; EV-28 replication).
- Source: buildingSMART, *developer-guide.md* — T1 (read); *TestCases/scripts.md* https://raw.githubusercontent.com/buildingSMART/IDS/development/Documentation/ImplementersDocumentation/TestCases/scripts.md — T1 (read); W3C SHACL §3.4 — T1 (read); OASIS SARIF schema — T1 (read).
- Class: FACT (of the specifications) + STANDARD (requirement on this engine)
- Scope: universal
- Confidence: High
- Grid translation: neighbour order fixed `[N,E,S,W]` then `[NE,SE,SW,NW]`; A* tie-break `(f, h, floor, x, z)`; matches and rules sorted by id; keys in declaration order; `seed` recorded even when unused. Self-test: run twice, byte-diff, mismatch ⇒ engine bug ⇒ all verdicts void. Metric keys: `rerun_byte_identical ∈ {true,false}`, `nondeterministic_sites_found`.
- Exceptions / failure mode: a stochastic generator running in the same process whose RNG state carries over. Checking a *stored* payload is still deterministic, so snapshot generator output before checking; never check a live generator.

### CA-16 "Failed" and "could not run" are different engine states, with different rollups and owners
- Rule: The engine returns `pass | fail | not_applicable | could_not_run | review`, and `could_not_run` always names its cause. `not_applicable` (selector matched nothing / out of scope) is distinct from `could_not_run` (applicable but undecidable here). Only the first two are verdicts about the design.
- Evidence: SHACL is candid that its Core report cannot express this: "Validation and conformance checking can result in a failure. For example, a particular SHACL processor might allow recursive shapes but report a failure if it detects a loop within the data. Failures can also be reported due to resource exhaustion. Failures are signalled through implementation-specific channels." SARIF puts the whole vocabulary in the schema: `result.kind` includes `notApplicable`, `review`, `open`, `informational` beside `pass`/`fail`; a separate `notification` object — "Describes a condition relevant to the tool itself, as opposed to being relevant to a target being analyzed by the tool" — carries `exception {kind, message, stack}`; `invocations.executionSuccessful` records whether the run happened at all. IDS encodes per-construct refusal: `invalid-derived_attributes_cannot_be_checked_and_always_fail`, `invalid-inverse_attributes_cannot_be_checked_and_always_fail`, and its `invalid-` group means a file "could not be satisfied, regardless of IFC contents".
- Source: W3C SHACL §3.4.1–3.4.3 — T1 (read); OASIS SARIF schema (`notification`, `exception`, `invocations`) — T1 (read); IDS TestCases `scripts.md` + listing — T1 (read). Cross-ref: VA-03, VA-10, UN-05.
- Class: STANDARD
- Scope: universal
- Confidence: High
- Grid translation: `could_not_run.cause ∈ {contract_unmet, field_missing, predicate_refused, resource_exhausted, out_of_host_capability}`. Headline prints `verdicts (pass/fail)`, `not run (not_applicable + could_not_run)` with a cause breakdown, `advisory (review)`. Metric keys: `could_not_run_by_cause`, `decidability = (pass+fail)/(pass+fail+could_not_run)`.
- Exceptions / failure mode: an exception swallowed by a `try/except` that returns `pass` — the single most dangerous line in any checker. Predicates are pure; the runner catches at the boundary and maps a throw to `could_not_run`, never to a verdict.

### CA-17 Version the rule pack against the code edition it came from; a major bump means verdicts may flip
- Rule: Packs carry a semantic version whose *meaning* is verdict-affecting, plus milestone scope and a per-rule `jurisdiction + edition + clause anchor` stamp. Editions are part of the rule's identity, not a comment, because two editions disagree.
- Evidence: IDS states the version semantics exactly: "Semantic versioning is recommended where versioning follows the naming scheme of X.Y, where Y represents a minor change, such as changes in metadata, description, or spelling errors, and X represents a major change, where models that used to pass or fail in a previous version may yield a different result." Delivery intent is data too (`purpose`, `milestone` quoted at CA-01), the same staging law as BIM-19 with named fields. Jurisdiction scope is real at deployment level: a national regime is organised by regulated domain and restricts automation to "straightforward" geometric/spatial requirements ahead of consultant submission, while an ACC case study states its own limit — "the case study is specific in location, regulations and input models".
- Source: buildingSMART, *ids-metadata.md* — T1 (read); CORENET X overview — T1 (read); arXiv:2011.03117 — T2 (read); UN-12 (repo). Cross-ref: BIM-19, VA-11.
- Class: STANDARD
- Scope: universal
- Confidence: High on version semantics and metadata (verbatim); Medium that jurisdiction+edition alone suffice for multi-jurisdiction products — no opened source models pack-level crosswalks
- Grid translation: `pack@1.3.0 { jurisdiction:"WA", code_edition:"IBC 2021 mirror", milestone_band:["layout","detail"], rules:[…] }`; rule ids embed the edition (`CODE07-WA-2021.travel_max`) so two editions coexist as separate rules and a verdict diff across them is meaningful. Metric keys: `rules_by_edition`, `verdict_flips_on_edition_change`.
- Exceptions / failure mode: a threshold edited in place because a design was failing — VA-11's drift prohibition given teeth here: a threshold change *is* a major bump, and a major bump obliges publishing the flip report.

### CA-18 Rule ids are namespaced, and a retired rule is deprecated — never deleted
- Rule: Identifiers must stay addressable after a rule changes or dies, and must be unique under pack composition, because findings, suppressions and trend data reference them. Deleting an id silently orphans every decision made against it.
- Evidence: IDS warns about composition in its own schema annotation: the per-specification `identifier` "is intended to be a machine readable identifier. Beware: because of the possibility to combine different 'specification' elements from several ids files this cannot be enforced/assumed as (global) unique." SARIF handles retirement structurally: `reportingDescriptor` carries `deprecatedIds`, `deprecatedGuids`, `deprecatedNames` — "An array of stable, opaque identifiers by which this report was known in some previous version of the analysis tool" — beside the live `id` and `guid`, so old findings keep resolving.
- Source: buildingSMART, *ids.xsd* (`identifier` annotation) — T1 (read); OASIS SARIF schema (`reportingDescriptor`) — T1 (read). Cross-ref: VA-23.
- Class: STANDARD
- Scope: universal
- Confidence: High
- Grid translation: `rule_id = "<pack>@<major>.<jurisdiction>.<edition>.<slug>"`; removal sets `{status:"deprecated", superseded_by:<id>}` and retains the record for as long as any suppression cites it (CA-25 dependency). Metric keys: `orphan_finding_references` (must be 0), `deprecated_rules_active`.
- Exceptions / failure mode: a renamed rule with no alias — the next report reads "40 new violations, 40 resolved", which looks like a design change and is nothing of the kind.

### CA-19 Ship per-rule provenance, and mark anything external as external
- Rule: Each rule carries the source it was read from (document, edition, clause anchor, tier, retrieval date, author) and a pointer to the human text; anything a pack adds beyond the published specification is labelled an extension rather than folded in silently. A rule whose provenance is "as far as I know" must be classifiable as such by a reader.
- Evidence: IDS requires the human-facing rationale inside the machine artefact — `description` so "The person reading the description should understand why the information provides value", and `instructions` for "who is responsible to provide the information ... or what to do in edge-cases" — and polices extension: "No proprietary extensions are allowed. If auxiliary systems (e.g. additional loaded metadata) are used to augment IDS or the correlating IFC model, they should be made clear to the user that it is external to IDS." It even marks the fields a checker ignores: on both the classification and material facets, `uri` "is an optional attribute that is not subject to IDS checking". SARIF gives the same slots (`helpUri`, `help`, `properties` on the descriptor). In-repo, UN-12/UN-13/UN-14 already bind tier, jurisdiction/edition/anchor, and "cite only what you opened".
- Source: buildingSMART, *ids-metadata.md*, *classification-facet.md*, *property-facet.md*, *developer-guide.md* — T1 (read); OASIS SARIF schema — T1 (read); UN-12/13/14 (repo).
- Class: STANDARD
- Scope: universal
- Confidence: High
- Grid translation: `provenance: {source:"building-codes.md CODE-07", mirror:"IBC 1020.2 (as transcribed)", tier:"T1 mirror, clause text not read", retrieved, author, extension:false}`. Metric keys: `rules_with_no_provenance`, `rules_tier_T3_or_lower`.
- Exceptions / failure mode: a heuristic threshold that acquired a rule number and now reads like a clause — the corpus's own "never launder a low tier into a rule" (UN-13); the provenance field is the only thing that makes that auditable later.

### CA-20 Publish a rule-pack manifest others can extend without editing the core
- Rule: A reusable pack is a directory with a manifest (name, version, jurisdiction, edition, view contract, predicate-library version, rule list, exclusions), a schema both halves validate against, and an explicit statement of what the pack does *not* cover. Extension is additive — a derived pack references the base and overrides by id — never a fork.
- Evidence: the real ecosystem is built this way. IDS ships an XSD and states "An IDS file is simply an XML file, with its schema defined in XSD", then warns that schema-validity is insufficient: "a valid IDS file requires more than bare XML schema compliance; buildingSMART provides an IDS auditing tool to help ensure that the IDS files that you produce or receive are fully valid" — a checker *of the rules*, published with its implemented checks as a checklist (`[x] XSD Schema check`, `[x] IFC Schema check (individual facets)`, `[x] Cardinality for facets (in requirements)`) and its open items visible (`[ ] No misplacement of properties (ON HOLD)`). Checkers ship as CLIs and libraries with declared outputs: `python -m ifctester example.ids example.ifc -r Html -o report.html`, reporters `Json / Ods / Html / Bcf`, and a ".NET library that can be embedded in other applications".
- Source: buildingSMART, *developer-guide.md* — T1 (read); *IDS-Audit-tool README* https://github.com/buildingSMART/IDS-Audit-tool — T1 (read); IfcOpenShell *IfcTester* — T1 (read); xBim, *Xbim.IDS.Validator* https://github.com/xBimTeam/Xbim.IDS.Validator — T1 (repo description read: "Library to validate IFC and COBie models using IDS1.0"). Cross-ref: VA-11, BIM-17.
- Class: DESIGN PRINCIPLE grounded in FACT
- Scope: universal
- Confidence: High for the artefacts read; Medium that additive extension is sufficient in practice — no opened source publishes a worked jurisdiction-overlay mechanism
- Grid translation: `rulepack@1.0/{manifest.json, view.json, predicates/, rules/*.json, fixtures/, LIMITATIONS.md}`; a derived pack is `{extends:"base@1.0", overrides:{rule_id:patch}, adds:[…]}` and the loader rejects a redefinition without `overrides`. Metric keys: `pack_extends_depth`, `override_count`.
- Exceptions / failure mode: an extension that changes a base predicate's semantics but not its name — every downstream verdict inherits it silently. Predicates are versioned and named (`travel_distance@v2`) and rules bind by version.

### CA-21 Test the checker against a normative fixture suite with three outcomes, not two
- Rule: Every pack ships a machine-readable conformance suite: per rule a *known-good* fixture, a *minimal-violation* fixture (exactly one tile off), and an *unrunnable* fixture proving the rule reports `could_not_run` rather than a verdict. Disagreement with the expected outcome is non-conformance; the suite runs in CI on every predicate change.
- Evidence: IDS makes this mandatory and defines the three groups: "Any software implementing IDS checking **must** comply with the test suite of IFC/IDS pairs available in the `Documentation/ImplementersDocumentation/TestCases` folder"; "Test cases are arranged in folders by theme (e.g. attribute, entity, etc) and organised in 3 groups (i.e. pass, fail, and invalid)"; `pass-` = "all requirements are satisfied", `fail-` = "at least one requirement fails", `invalid-` = "invalid files do not comply with the Audit tool, they could not be satisfied, regardless of IFC contents"; and the purpose is cross-implementation agreement — "All valid IDS implementations must demonstrate identical behaviour against the expected values of the provided test cases." Fixtures are paired `*.ids` + `*.ifc` files whose *names state the assertion*, and the repository runs them in CI (`.github/workflows/check-test-cases.yml`). VA-12 already mandates good/bad fixtures; the third group is the part almost nobody implements.
- Source: buildingSMART, *TestCases/scripts.md* — T1 (read); IDS repository tree (test-case folder listing, CI workflow) — T1 (read). Cross-ref: VA-12.
- Class: STANDARD
- Scope: universal
- Confidence: High
- Grid translation: `fixtures/<rule_id>/{good,bad,unable}.grid.json + expected.json`; assertions `verdict(good)=pass`, `verdict(bad)=fail`, `verdict(unable).state=could_not_run`, plus `bad` fixtures at every rounding seam where the threshold is not a whole number of tiles. Metric keys: `rules_with_fixtures/rules_total`, `fixture_failures` (non-zero ⇒ run void).
- Exceptions / failure mode: a fixture that "passes" because the engine never reached the predicate — hence the suite must also assert `matched > 0` on the `bad` case, or it proves nothing (same root as CA-24).

### CA-22 Mutation-test the checker: break a plan deliberately and require the check to fire
- Rule: Passing fixtures prove the checker does not over-fire; only deliberately broken plans prove it can catch anything. Generate mutations of a good plan (one targeted violation per rule, of the smallest expressible size), demand `fail`, and treat any surviving rule as untested.
- Evidence: the method and its vocabulary are fixed: "Mutation testing is used to design new software tests and evaluate the quality of existing software tests"; "Each changed version is called a _mutant_"; "Mutant creation is done using well-defined _mutation operators_ that either mimic typical programming errors"; successful detection is "Rejection is called _killing_ the mutant"; a survivor means the test suite is incomplete. The metrics are computed, not felt — Stryker's states are `Killed` ("When at least one test failed while this mutant was active"), `Survived` ("When all tests passed while this mutant was active"), `No coverage` ("The mutant isn't covered by one of your tests and survived as a result"), with `detected = killed + timeout`, `valid = detected + undetected`, `Mutation score = detected / valid * 100` and a covered-code variant `detected / covered * 100`. The ceiling is honest and must be carried: "Equivalent mutants detection is one of the biggest obstacles to practical usage of mutation testing."
- Source: Wikipedia, *Mutation testing* https://en.wikipedia.org/wiki/Mutation_testing — T3 (read); Stryker Mutator, *Mutant states and metrics* https://stryker-mutator.io/docs/mutation-testing-elements/mutant-states-and-metrics/ — T1 for the tool's own definitions (read). Cross-ref: VA-12, CA-26.
- Class: FACT (of the method) + HEURISTIC (that it transfers to spatial checkers — no opened source applies it to a tile grid)
- Scope: universal
- Confidence: High on method and formulas; Medium on transfer — the equivalence problem is worse in geometry, since a one-tile move may be a genuinely behaviour-preserving mutation
- Grid translation: operators at the smallest expressible change — `move_wall(1 tile)`, `delete_door_run`, `narrow_corridor(1 tile)`, `retype_tag`, `blank_field`, `unstack_portal(1 floor)`, `extend_dead_end(1 tile)`; each mutation record names the rule expected to fire. Metric keys: `mutation_score`, `survived_by_rule` (every survivor is a pack defect), `equivalent_mutants_declared` (with reason).
- Exceptions / failure mode: the mutation is caught by a *different* rule (a width change that disconnects the room first). Record `killed_by` explicitly and dedup by root cause, or the score lies in both directions.

### CA-23 Guard the silent-oracle class: empty fields, vacuous selectors, unexercised vocabulary
- Rule: Three ways a checker lies without erroring, and all three are named defects with their own metric. (a) A predicate passes on an absent field; (b) a selector matches nothing and the rule reads green; (c) the pack's vocabulary coverage over the payload is never reported, so "we checked the model" silently means "we checked this much of it". Emit coverage per (pack, payload) pair in the headline: fields read, object kinds with no rule, rules that matched zero on this plan.
- Evidence: on (a), IDS's suite separates the empty states deliberately and decides them by cardinality, not by value: `fail-attributes_with_null_values_always_fail`, `fail-attributes_with_empty_strings_always_fail`, `fail-attributes_with_an_empty_list_always_fail`, `fail-attributes_with_an_empty_set_always_fail`, `fail-attributes_with_a_logical_unknown_always_fail` against `pass-an_optional_attribute_passes_if_null` and `fail-an_optional_attribute_fails_if_empty`; REQUIRED is "populated (i.e. not null)" and a property match needs a "non null value". On (b), SHACL: `sh:conforms` "is true if and only if the validation did not produce any validation results". On (c), the IDS-Audit-tool publishes its own boundary as a checklist with unfinished items (`[ ] Discuss the scope of the list, currently only measures...`), and SHACL's `sh:deactivated` is the runtime version of the same hazard — "A shape that has the value true for the property sh:deactivated is called deactivated. All RDF terms conform to a deactivated shape", with documented uses "shape reuse and debugging", i.e. a state that must never reach a report as a pass. Empirically, model deficiency is the dominant blocker, not logic: "deficiencies in BIM models, such as missing or incorrect data, can significantly hinder the automated checking process".
- Source: IDS TestCases listing — T1 (read, names); IDS *attribute-facet.md*, *property-facet.md* — T1 (read); W3C SHACL §2.1.6, §3.6.1.1 — T1 (read); buildingSMART IDS-Audit-tool README — T1 (read); arXiv:2506.20551 — T2 (read). Cross-ref: VA-12, VA-10.
- Class: FACT
- Scope: universal
- Confidence: High
- Grid translation: the loader normalises absent/unset/empty into one sentinel (`__absent__`) so predicates cannot mistake `""` for a value; every predicate declares its empty policy; derived quantities are recomputed from tiles rather than read from stored fields, which removes the "stored area was blank" class entirely. Coverage block: `{fields_read/fields_in_view, kinds_with_rules/kinds_in_view, zero_match_rules:[…], deactivated_rules:n}`. Metric keys: `checks_voided_by_missing_field`, `field_coverage`, `kind_coverage`, `zero_match_rules`.
- Exceptions / failure mode: coverage measured against the *view* rather than the host schema makes a pack look complete over a subset nobody argued about — print both; the view-over-host gap is what this grid cannot express at all (GT-26's limitations register).

### CA-24 Budget false positives per rule, and treat the false negative as the asymmetric error
- Rule: Each rule carries a declared error budget on both sides — a maximum tolerated false-positive share before demotion to advisory, and an explicit statement of what it can miss. Safety-critical rules bias to over-report and to `review`; hygiene rules bias to silence. Budgets are measured by the fixture and mutation runs, not asserted.
- Evidence: noise control is a designed feature in adjacent tooling, not an embarrassment — pipelines default to "high-confidence findings to reduce noise" and let humans re-grade ("if you disagree with the severity assigned to the finding, you can change it"), while legacy scanners "could have a 50 to 80% false positive rate" (quoted in VA-13 and not re-litigated). The mutation machinery supplies the missing half of the ledger, because `Survived` and `No coverage` mutants *are* a checker's false negatives, counted: `undetected = survived + no coverage`. Deployed regimes state a conservative scope instead of pretending completeness (CA-07's CORENET evidence).
- Source: this repo VA-13 (Snyk/Mend, T3); Stryker metrics — T1 (read); CORENET X — T1 (read). Cross-ref: VA-13, UN-04.
- Class: HEURISTIC — the mechanism is grounded, the specific budget numbers are this file's engineering choices
- Scope: universal
- Confidence: Medium
- Grid translation: `budget:{max_fp_share:0.0 on critical G/T egress rules, 0.05 on A rules, 0.2 on classification hygiene; min_mutation_score:{critical:0.9, moderate:0.6}}`. Breach consequences are pre-declared: fp-breach ⇒ advisory demotion with a written note (never deletion); mutation-score breach ⇒ rule marked `untested` and barred from closing issues (VA-12's teeth). Metric keys: `fp_rate_measured`, `fn_rate = survived/valid`, `rules_out_of_budget`.
- Exceptions / failure mode: a rule tuned by suppressing findings until the report looks clean — Goodhart with a paperwork trail; CA-25's expiry plus the re-sweep duty is what stops it becoming permanent.

### CA-25 Suppression is data: justification, owner, scope, expiry, review status
- Rule: Every suppression records who, why, against which rule id and which design context, stays visible as `accepted-risk` in every subsequent report, and reopens when the oracle or payload changes. It binds a rule class in a context, never one drawing secretly.
- Evidence: SARIF's `suppression` object is exactly this shape and hangs off the result rather than replacing it: `kind ∈ {inSource, external}` — "A string that indicates where the suppression is persisted", i.e. the difference between a code-level disable and a reviewer decision; `status ∈ {accepted, underReview, rejected}` — "A string that indicates the review status of the suppression", which is what makes a suppression expiring rather than permanent; `justification` — "A string representing the justification for the suppression"; plus `location` and its own `guid`. `result.suppressions` coexists with `result.kind`, so the suppressed finding remains in the data. SHACL's `deactivated` is the negative example: it leaves no trace at all (CA-23). In-repo, VA-13 already requires the written reason and the periodic re-sweep.
- Source: OASIS SARIF schema (`suppression`) — T1 (read); W3C SHACL §2.1.6 — T1 (read); VA-13 (repo).
- Class: STANDARD
- Scope: universal
- Confidence: High
- Grid translation: `suppression:{rule_id, pack_version, scope:{floor|room|type}, reason, granted_by, evidence_ref, expires_on:{payload_change:"requirements@vN+1", date}, status}`; the loader voids any suppression whose rule id or scope object no longer exists (CA-14/CA-18 dependency). Metric keys: `suppressions_active`, `suppressions_expired_unreviewed`, `suppressed_criticals` (must be 0 at release).
- Exceptions / failure mode: blanket suppression of a rule "because it misfires on this generator" is a checker defect (CA-24's fp budget), and the record must say which it is, or the pack ships a hole nobody owns.

### CA-26 Re-run by blast radius, report the delta against a baseline, and never re-trust the untouched part
- Rule: After an edit, the affected set is the edit's blast radius, not the edit: re-run every rule whose inputs intersect it, re-derive the graph, and publish the verdict *diff* against the previous run (`new | unchanged | updated | absent`) with caused-by chains. A rule that did not re-run did not pass.
- Evidence: SARIF models the comparison in the schema: `run.baselineGuid` is "The 'guid' property of a previous SARIF 'run' that comprises the baseline that was used to compute result 'baselineState' properties for the run", `result.baselineState ∈ {new, unchanged, updated, absent}`, and `occurrenceCount` is "the number of times this logically unique result was observed in this run" with `correlationGuid` identifying "the equivalence class of logically identical results" — so one cause collapses into one line with a count instead of forty lines. The re-run-not-re-trust law is already in this repo as VA-14 (CEGAR and plan-review justifications read there); the identity dependency is CA-14.
- Source: OASIS SARIF schema — T1 (read); VA-14 (repo).
- Class: STANDARD + DESIGN PRINCIPLE
- Scope: universal
- Confidence: High
- Grid translation: per-operation radii as VA-14 (room-local / floor circulation graph / whole building graph on a portal edit); headline is the delta: `+3 fail, −1 fail, 2 still-open, 4 voided-newly-not-run`. Metric keys: `delta_new_fails`, `delta_absent_fails_needing_explanation`, `stale_verdicts` (must be 0).
- Exceptions / failure mode: an `absent` failure that is really a renamed room id (CA-14 churn) — reported as fixed, defect shipped. Every `absent` must resolve to `fixed` or `identity-changed` before the run is signed.

### CA-27 Reporting must refuse the aggregate that turns a pass rate into compliance
- Rule: Report shape is fixed and generated: pack version, jurisdiction and editions read, pass/fail counts by severity, not-run counts by cause, advisory count, coverage, payload hash, plan hash, timestamp. The safety class prints no composite score and no percentage headline, because a single number invites exactly the reading the method cannot support.
- Evidence: the vocabulary already forbids the collapse: SARIF keeps `kind` (evaluation state) and `level` (severity) separate and adds `provenance` on the result plus `versionControlProvenance` on the run; SHACL keeps `sh:conforms` boolean *and* the result set, and warns that conformance true means only "did not produce any validation results". The regulatory position is explicit — an automated regime self-checks "straightforward regulatory requirements" and hands the rest to a professional "prior to submission"; the rules-as-code literature settles interpretation with a human: "The final decision on the accuracy of the interpretation will be settled by a judge". In-repo VA-18 and VA-04 already bind the diff-table-with-no-prose-headline and the wording itself.
- Source: OASIS SARIF schema — T1 (read); W3C SHACL §3.6.1.1 — T1 (read); CORENET X — T1 (read); *Legislation as Code* (DocRef) — T1 (read); VA-04, VA-18 (repo).
- Class: STANDARD
- Scope: universal
- Confidence: High
- Grid translation: first line is machine-generated and not editable: `pack@X · jurisdiction Y · editions {…} · pass 41 / fail 3 · not-run 9 (cause breakdown) · advisory 11 · coverage fields 0.62 kinds 0.55 · payload sha …`. Metric keys: `headline_template_used ∈ {true,false}`.
- Exceptions / failure mode: a UI that renders "98 % compliant". The permitted rendering is "98 % of runnable checks passed, 9 not run, 38 % of the payload vocabulary unchecked" — the same bytes, the opposite claim.

### CA-28 A green rule pack licenses one sentence, and it is not the sentence people want
- Rule: The pack's output is "the model is consistent with pack@version (jurisdiction, editions read) on the fields this host can express, with N checks not run and M advisory items open". It cannot and must not output "compliant", "code-compliant", "approved" or "safe": automated checking is a self-check instrument feeding a human decision, and that boundary is a property of the method, not a caution label stapled on at the end.
- Evidence: three independent layers agree. Rules-as-code: "this human discretion element cannot be automated", and automation of the interpretive step "risks excluding the Judiciary from performing its constitutional role". Standards: IDS self-describes as being "for specifying and checking simple information requirements", and its validation service marks its own terminus — "Case-specific validation is where the mandate of the bSI Validation Service ends - and where other solutions like IDS can help". Evidence quality: an LLM-based ACC system's evaluation was "tested only on two case studies and evaluated only by 12 rules", and the real-submission literature shows the input, not the logic, is the binding constraint. In-repo VA-04 and UN-15 already bind the wording.
- Source: *Legislation as Code* (DocRef) — T1 (read); buildingSMART *validation-service.md* and *README.md* (IDS scope sentence) — T1 (read); arXiv:2506.20551 — T2 (read); VA-04, UN-15 (repo).
- Class: STANDARD
- Scope: universal
- Confidence: High
- Grid translation: the pack ships a `LIMITATIONS.md` generated from `not_covered` in the manifest plus the live `could_not_run` cause histogram, so the boundary is re-derived every run rather than hand-written once (GT-26). Metric keys: `limitations_block_present ∈ {true,false}`.
- Exceptions / failure mode: a downstream consumer caches "green" as a status on the design and stops re-running after edits (CA-26). Verdicts are always about a payload hash; a green flag with no hash is not a verdict.

---

## Rule anatomy and worked encodings

Rule record (one file per rule, validated against `view.json` at load):

```json
{ "id": "CA-EG-01", "pack": "wa-ibc2021-mirror@1.0.0",
  "jurisdiction": "WA", "edition": "IBC 2021 (repo mirror)", "clause_anchor": "CODE-07",
  "source_tier": "T1 mirror, clause text not read",
  "class": "G",
  "scope": { "milestone": ["detail","release"], "type_card": ["hotel","assembly"] },
  "select": { "kind": "room", "where": { "occupancy_gt": 0 }, "frame": "floor_local" },
  "assert": { "predicate": "travel_distance_to_exit@v2", "op": "<=", "threshold_mm": 67000,
              "unit": "mm", "rounding": "ceil_to_tile", "tolerance": "none:integer-domain",
              "empty_input": "could_not_run" },
  "cardinality": "required", "severity": "critical", "closer": "agent",
  "budget": { "max_fp_share": 0.0, "min_mutation_score": 0.9 },
  "evidence": ["matched_ids","measured","required","witness_tiles","path_steps"],
  "fixtures": ["CA-EG-01/good","CA-EG-01/bad","CA-EG-01/unable"] }
```

Eight worked encodings, as the predicate library would run them here. Thresholds are never hard-coded — they are
bound from the routed rule at load (CODE-nn / VT-nn / type card).

**E1 — Exit-access travel distance to discharge (`G`, exact up to the quantum).**
```
EXITS = { t | t.tag ∈ {exterior_discharge, exit_door} ∧ on_exit_route(t) }        # CODE-11
for f in floors:
  D = multi_source_dijkstra(sinks = EXITS ∩ f, cost = (cardinal 1, diagonal √2),
        blocked = tiles[state==blocked], neighbour_order = [N,E,S,W,NE,SE,SW,NW])  # CA-15
  for r in rooms(f) where r.occupancy > 0:
    worst   = max(D[t] for t in r.tiles)                  # farthest point of the room
    req_t   = ceil(threshold_mm / 500)                    # CA-09/CA-11
    verdict = pass if worst <= req_t else review if (worst,req_t) in band else fail
    emit(rule, r.id, measured=worst, required=req_t, witness=path_from(D, argmax))
```
Refuses at load if `EXITS ∩ f = ∅` ⇒ `could_not_run: no discharge reachable — check portal stack` (CA-16).

**E2 — Minimum clear width along a route (`G`, quantised).** Width is not a segment between two walls; it is the
largest square that rolls along the run.
```
for c in corridors:
  for t in c.tiles: w[t] = max k such that the k×k square centred at t ⊆ walkable ∪ door
  min_tiles = min(w[t] for t in mandatory_path(c))
  verdict   = pass if min_tiles * 500 >= required_mm else fail
```
`w[]` is an erosion by increasing square size — O(tiles × max_width), integer, deterministic. Requirements below
one tile are refused, not approximated (GT-10, BIM-22).

**E3 — Dead-end length (`T` + `G`).** A dead end is the tail beyond the last point with two independent routes, so
the safe set is computed first and distance measured *into* it.
```
safe = { t in circulation | exit_disjoint_routes(t) >= 2 }                     # AG-13 / Menger on the tile graph
dead[t] = min steps from t to safe over circulation tiles                      # multi-source BFS
violation = any t with occupancy_allowed(t) ∧ dead[t]*500 > limit_mm
```
Catches what E1 cannot: correct travel distances and a long single-route blind corridor (CODE-06).

**E4 — Room-to-corridor connectivity (`T`, decided exactly).** Dual graph per AG-01's separation, joined across
floors per VA-16.
```
Gd = (rooms, edge(r1,r2) per door run between them)
assert every room r is in the same component as a corridor-typed room
assert no articulation point whose removal strands r with occupancy > 0            # AG-13
assert no door_run spans r's full width                                            # GT-22 flood-fill divides there
assert role_tag_permission(r, role) for every role the programme assigns           # AG-15
```

**E5 — Shaft adjacency to a wet cell (`G` + `T`).** Two distinct predicates — touch on the floor, stack across
floors; do not merge them.
```
touch: ∃ t_w ∈ tiles(wet_cell), t_s ∈ tiles(shaft_band) : chebyshev(t_w, t_s) <= 1
stack: footprint(wet_cell, f) ⊆ footprint(shaft_band, f') for every f' the cell drains through   # MS-06, MS-14
refuse: drain-gradient / pipe-pitch claims ⇒ could_not_run: no height datum                     # SV-nn owns these
```

**E6 — Lift-stop coverage (`T`, cross-floor).**
```
served = { f | ∃ portal p on f : p.kind == lift ∧ p.stops }
assert every occupied floor ∈ served                                                   # MS-11
assert walk_tiles(lift_lobby(p), farthest_room_on(f)) <= catchment_tiles               # band from VT-nn/HO-nn
assert p.(x,z) identical on consecutive served floors, else flag misstack              # MS-14, VA-16
emit not_applicable for HC5/INT/queue verdicts  # assumption arithmetic, not model data — VT-nn owns it
```

**E7 — Aggregating rules (`A`, exact, but whole-scope).**
```
occupant_load(room) = ceil(area_m2 / load_factor)        # CODE-01; area = tile_count × 0.25
exits_required(f)   = exits_for(sum(occupant_load(r) for r in rooms(f)))                  # CODE-02
wet_cell_alignment_share = aligned_floors / total_floors
net_to_gross(f) = walkable_interior_tiles / plate_tiles
```
Engine consequence: `A` rules cannot be evaluated per element, so they run last and their blast radius is the
parent aggregate (CA-26).

**E8 — Uniqueness and equality over a set (`A`).** IDS lists "The names of all door types must be unique" among what
its declarative subset cannot express; on a grid it is `count(distinct key) == count(items)`. The general lesson:
a rule class is not uncomputable in principle, only unsupported by *this* language — classify by predicate, then
check whether this engine's vocabulary reaches it (CA-08).

## Computability matrix

| Class | Example | Decidable here? | Mechanism | Engine output if not |
|---|---|---|---|---|
| G | travel distance, clear width, area | Yes, up to the 0.5 m quantum | integer tile transforms, BFS/Dijkstra | band overlap ⇒ `review`; sub-quantum ⇒ `could_not_run` |
| G | sightlines over beds, headroom, daylight aperture | **No** — no heights/sections | — | `not_applicable: no height datum` (VA-10) |
| T | reachability, articulation, role connectivity, portal stacking | **Yes, exactly** | dual graph on integer tiles (AG-01, VA-16) | — |
| T | wayfinding legibility, "clear figure-ground" | Ranking only, not pass/fail | depth/betweenness (SA-nn) | `review` + the metric attached |
| A | occupant load, exit count, area shares, name uniqueness | **Yes, exactly** | sums/counts over declared sets | `could_not_run` if any member input is absent |
| S | construction order, event-triggered systems, schedules | **No** — no time axis | IDS itself scopes schedule/event checks out | `not_applicable: no temporal model` |
| N | "appropriate scale", alternative-method arguments | **No**, and not temporarily | human discretion (CA-07) | `review` + the question + the proxy |
| any | rule whose threshold is itself contested | Only with the dispute printed | source tier on the threshold | `review`, never gated (UN-10/UN-13) |

Honest consequence: the refusing classes are not a gap this file expects to close. `decidability` (CA-16) is the
number to raise — by adding payload fields, never by guessing verdicts.

## Deterministic execution ladder

| Layer | Representation | Comparison | Never |
|---|---|---|---|
| Truth | tile state + tag + `(floor,x,z)` | equality | — |
| Length | tiles (int) ↔ mm (int), one coercion | exact integer | float metres as a decision key |
| Area | tile count × 0.25 m² | exact integer tiles | re-reading a stored area field |
| Path | `(cardinal_steps, diagonal_steps)` | lexicographic exact | pre-summed float distance |
| Imported float | canonical SI | `isclose(rel=abs=1e-6)` | bare `==` |
| Bounds | required min/max | exact `<=` / `>=` | any tolerance |
| Verdict | 5-state enum + severity | — | a boolean |

## Rule-pack layout

```
rulepack@1.0/
  manifest.json    # name, version(major ⇒ verdicts may flip), jurisdiction, code_editions,
                   # extends, view, predicates, scope_defaults, not_covered[], conformance{}
  view.json        # the input contract the pack reads: entities, tag register, relations,
                   # derived-quantity definitions, datum, canonical units   (CA-10, CA-11)
  predicates/      # versioned imperative library referenced by name@version (CA-08)
  rules/*.json     # one record per rule, shape above
  fixtures/        # per rule: good | bad | unable, + expected verdict      (CA-21, CA-22)
  LIMITATIONS.md   # generated from not_covered + observed could_not_run causes (CA-28)
```
Derived packs: `{extends:"base@1.0", overrides:{rule_id:patch}, adds:[…]}`; redefining a base rule id without
`overrides` is a load error (CA-18, CA-20).

## Evaluation loop

```python
def run(payload, pack):
    gate = validate_payload(payload, pack.view)                    # integrity before semantics (VA-07, CA-10)
    if gate.bad: return report_voided(gate)                        # not a verdict about the design
    ctx  = coerce_and_anchor(gate.normalised, pack.view)           # single pass: units + frame (CA-11)
    gs   = build_graphs(ctx)                                       # three separate graphs (AG-01, BIM-18)
    out  = []
    for rule in sorted(pack.rules_for(ctx.type_card, ctx.milestone), key=id):
        if not rule.contract_met(ctx):                             # CA-10
            out.append(rec(rule, state="could_not_run", cause="contract_unmet")); continue
        matched = select(ctx, gs, rule.select)                     # CA-02
        if not matched:                                            # CA-03 — no vacuous pass
            out.append(rec(rule, state="fail" if rule.cardinality=="required" else "not_applicable", matched=0))
            continue
        for obj in sorted(matched, key=id):                        # total order (CA-15)
            try:  m = predicates[rule.assert.predicate](ctx, gs, obj, rule.assert)         # CA-08
            except Refused as e:
                out.append(rec(rule, obj, state="could_not_run", cause=e.kind)); continue   # CA-16
            out.append(rec(rule, obj, verdict(rule, m),            # the ONLY place rounding lives (CA-09)
                           measured=m, required=rule.assert.threshold,
                           evidence=proof(rule, obj, m)))          # CA-05
    return dedupe_by_cause(report(out), baseline=previous_run(payload.hash))                  # CA-26
```
Finding lifecycle:
```
could_not_run ─(field added)→ evaluated →┬ pass
                                         ├ fail →(edited)→ re-run by blast radius
                                         ├ not_applicable (scope/stage)
                                         └ review (class N, or band overlap)
fail → suppressed{reason, owner, scope, status:underReview} → re-sweep → fail        # CA-25
delta vs baseline: new | unchanged | updated | absent        # "absent" must resolve to fixed OR identity-changed
```

## Sources

Every URL named in a rule's `Source:` line was opened in this pass; nothing here is cited from memory.
**T1:** buildingSMART IDS repo (`development`) — User Manual `README`, `specifications`, `ids-metadata`,
`restrictions`, `entity-facet`, `attribute-facet`, `property-facet`, `classification-facet`, `material-facet`,
`partof-facet`, `units`; Implementer docs `developer-guide`, `tolerance`, `DataTypes`, `TestCases/scripts.md`;
`Schema/ids.xsd`; `Documentation/Examples/*.ids`; issue #203; repository tree (test-case listing,
`check-test-cases.yml`). buildingSMART `technical.buildingsmart.org` repo — `validation-service`, `ifcOWL`,
`IFC-GUID`, `IFC-Formats`, `MVD-Database`, `BIM-Collaboration-Format-(BCF)`. buildingSMART `IDS-Audit-tool`
README; `xBimTeam/Xbim.IDS.Validator` (repo description). IfcOpenShell docs — `ifctester`, `selector_syntax`.
W3C *SHACL 1.0* (full recommendation retrieved and searched locally). OASIS *SARIF 2.1.0* JSON schema.
Python 3 *Floating Point Arithmetic* tutorial. Stryker Mutator *Mutant states and metrics*. *Legislation as
Code* (Barraclough, Fraser & Barnes, March 2021; Te Manatū ā Ture / NZ Law Foundation) via DocRef. Gov of
Singapore *Overview of CORENET X*. **T2:** arXiv:1910.00334 (abstract); arXiv:2011.03117 (HTML);
arXiv:2501.14735 (abstract); arXiv:2506.20551 (HTML); arXiv:2509.17283 (abstract); arXiv:2605.13236 (HTML, for
related-work attributions to Avgoren, Isikdag et al., Solihin et al.). Crossref-verified: Solihin, Eastman, Lee
& Yang, *Automation in Construction* Dec 2017, DOI 10.1016/j.autcon.2017.10.002; Solihin, Dimyadi, Lee,
Eastman & Amor, *Automation in Construction* Sep 2020, DOI 10.1016/j.autcon.2020.103248 — titles and venues
verified, **full text not opened**. **T3:** Solibri IDS article; Wikipedia *Mutation testing*.
**Located, not opened (403/404/unreadable):** `technical.buildingsmart.org/standards/ids/` and
`/standards/ifc/mvd/`; `help.solibri.com` rule articles; `solibri.com/products/solibri-office-checker`; MDPI ACC
papers incl. the means-of-egress compliance-checking study; ScienceDirect ACC reviews (*High-level implementable
methods…*, *Extending Information Delivery Specifications…*); TUM Preidel & Borzmeyer
*Pre-Processing IFC Building Models for Code Compliance Checking*; ITcon 2025/2026 ACC PDFs (streams
unreadable); `bonsaibim.org/docs-python/ifctester.html` (BlenderBIM docs redirect, then 404);
`ifc43-docs.standards.buildingsmart.org` lexical pages (bot challenge).

## Weak or contested

- **IDS concrete syntax is unsettled by what was opened.** The implementer docs read here state "An IDS file is
  simply an XML file, with its schema defined in XSD", ship `Schema/ids.xsd`, and every example file is XML; the
  repository describes IDS as a "Computer interpretable (XML) standard". Community summaries render IDS as JSON
  with `cardinality: "1..*"` fields. Whether published IDS 1.0 is XML or JSON is **not verified**; no JSON field
  name in this file is attributed to IDS, and the `minOccurs/maxOccurs` + `required|optional|prohibited` wording is
  what was read.
- **`ϵ = 1.0e⁻⁶` is an IDS float-equality tolerance, not a spatial tolerance.** Applying it to a 0.5 m grid would
  be a category error; CA-12 exists to say so. **NEEDS VERIFICATION:** any accepted plan-geometry tolerance for
  automated spatial checking — no opened source supplies one.
- **Zero-match ⇒ fail is asserted in a maintainer thread, not in the XSD.** The XSD only encodes
  `minOccurs/maxOccurs`; the "if required and count selection = 0 return fail" formulation is from issue #203.
- **Solibri's internal rule model could not be retrieved** (help-site 403s). No Solibri rule-type name or
  rule-composition claim appears in this file; BIM-18's three-pass split remains the in-repo statement of that
  idea and is flagged there as an unretrieved reconstruction.
- **"SimpleIFC" and "if-validate" were not found as primary sources.** What exists and is cited instead is the
  simplified-relational-schema line (Solihin et al., metadata only) plus the real open checkers: IfcOpenShell
  `IfcTester`, `Xbim.IDS.Validator`, buildingSMART `IDS-Audit-tool`. **NEEDS VERIFICATION:** that a tool named
  SimpleIFC or if-validate exists at all; do not cite either — or any API named after them — from this file.
- **"Augmentative vs deterministic code" and "code as data / Legion" could not be traced.** Repeated searches
  returned no credible match. The substance is carried by *Legislation as Code* (discretion cannot be automated)
  and by ifcOWL's RULE/FUNCTION exclusion; **the labels are not used as sources anywhere in this file.**
- **The five-class computability taxonomy is this file's partition**, informed by IDS's own out-of-scope list,
  ifcOWL's exclusion note and the rules-as-code boundary. It is an authoring decision instrument, not a sourced
  standard, and is unlikely to be exhaustive for `S` and `N`.
- **No opened source gives a false-positive rate for a *spatial* rule checker.** The 50–80 % figures in VA-13 are
  SAST numbers; CA-24's budgets are engineering choices. Mutation score is offered as a *measurable* proxy for the
  false-negative side, not as an external band.
- **Mutation testing has no published application to tile-grid checkers** (CA-22 transfers it). Its equivalence
  problem is plausibly worse in geometry, which is why `equivalent_mutants_declared` is part of the metric set.
- **CORENET X is cited for scope discipline only.** The opened page names no rule language, no accuracy figure,
  no clause list; nothing finer was read from it.
- **Jurisdiction-as-package-dimension and overlay packs with stricter-wins (CA-17, CA-20) have no opened
  precedent.** Nearest read evidence is IDS's per-specification `ifcVersion` list and the XSD's non-unique-identifier
  warning. Treat the overlay design as HEURISTIC.
- **`IfcOpenShell` selector syntax and IfcTester were read as documentation pages, not as code.** Exact runtime
  behaviour (e.g. how unevaluable elements are reported by IfcTester) is not stated on the page read and is not
  claimed here.
- **The IFC4.3 lexical pages could not be opened** (bot-protected), so no `WHERE` clause or attribute definition is
  quoted from the IFC standard itself; IFC-side structural claims rest on the buildingSMART technical-repo pages
  that were read.

## Type-specificity audit

**Type-neutral (closer = agent; identical for every use).** The rule record and its six fields; typed selectors;
cardinality semantics; the verdict-state vocabulary; evidence records; unit coercion and frame anchoring;
tolerance and integer comparison; identity stability; determinism and byte-diffing; pack manifest, versioning,
namespacing and deprecation; the conformance suite and mutation harness; silent-oracle guards; suppression
mechanics; baseline-delta reporting. None references a building use.

**Type-parameterised (same predicate, different binding — resolved through the type card, VA-21).** Every threshold
bound into E1–E7 (travel distance, dead-end limit, clear width, load factor, lift catchment, shaft band size) comes
from CODE-nn / VT-nn / HO-nn per card, never from the pack body; the error budget per class (an assembly floor
tolerates no egress false negative, a BOH store room tolerates many); which classes gate and which are advisory
(acoustics: moderate for a hotel, near-irrelevant for a car park); the milestone band that switches rules on
(CA-17, BIM-19); and the `A`-class denominators — `wet_cell_alignment_share` is meaningful for a hotel and vacuous
for a single-storey shed.

**Type-created checks.** Mixed-type plates require two packs on shared elements with the stricter governing the
stair and the lobby (VA-21's own exception); multi-floor hospitality creates the portal-stack and stop-coverage
predicates (E6) no single-storey type exercises; healthcare creates sightline/supervision rules this host must
refuse outright and report as `not_applicable` rather than proxy; industrial open floors make most adjacency
uniqueness rules vacuous.

**Never-transfer claims.** A pack validated on hospitality egress is not a legal instrument in its own jurisdiction,
let alone another (CA-28). The IDS/SHACL/SARIF field sets come from AEC-interoperability and static-analysis
practice; their *shape* transfers, their authority does not. And no number in the worked encodings is a threshold —
each is a binding. Reading a `threshold_mm` placeholder as a code requirement is precisely the laundering UN-13
forbids.
