# Research file 03 — BIM / CAD / IFC → discrete tile grid

Scope: what ISO/IFC-grade building modelling says about spaces, elements, containment,
connectivity, materials and machine-checkable delivery rules — and which of those concepts
survive a collapse to a 0.5 m tile grid with three tile states. This file is the mapping
layer, not a tutorial: it exists so that a generator or validator on this host can say
"this grid model is a *lossy but well-defined* projection of an IFC model, and here is the
loss list and the substitute checks". Design theory is in `architecture-theory.md`;
generation mechanics are out of scope.

Host grid this file is written against: 1 tile = 0.5 m; a wall = one blocked tile
(= 0.5 m thick); tile states ONLY `walkable | blocked | door`; rooms = 4-connected
flood-fill of walkable tiles, door cells belong to no room; movement is A* octile;
vertical = `portal`-tagged objects with queues; access by role tags; **no heights, no
material layers, no continuous geometry, no rule objects**.

Derived constants used below: 1 tile = 0.25 m²; 4 tiles = 1 m²; 2 tiles = 1.0 m;
a door run of 2 tiles = a 1.0 m leaf opening; `deriveFloorRooms`
(`src/engine/npc/rooms.ts:2,15,33`) is the grid's `IfcSpace` factory.

Retrieval note: `standards.buildingsmart.org` (the canonical IFC 4.3 lexical host) returns
403 to non-browser clients and `ifc43-docs.standards.buildingsmart.org` 301-redirects to it,
so most entity pages here are **URL-verified but body-unread**. Claims resting on unread
pages are labelled `UNCITED — heuristic` with Low confidence, per the brief. Only four
sources were actually read this session: the IFC2x3 lexical mirror page for
`IfcRelConnectsPathElements`, the buildingSMART IFC4.x-development issue #1 on
`IfcZone`/`IfcSpatialZone`, and the two redirect/403 probes that establish the doc host.

---

## Rules

### BIM-01 Reproduce the IFC spatial chain as a strict total order of containers
- Rule: `BIM-01` Every modelled thing sits in a chain `Project → Site → Building → Storey → Space`; skip no level, and never attach an element to a level above the one its kind belongs to.
- Evidence: UNCITED — heuristic (the five-class spatial hierarchy is asserted here from general IFC knowledge; the lexical pages were not readable this session, so no sentence is quoted).
- Source: buildingSMART IFC 4.3.2 documentation (host verified, body not retrieved) https://standards.buildingsmart.org/IFC/DEV/IFC4_3/HTML/lexical/IfcZone.html — T1 (unread); ISO 16739-1:2018 *Industry Foundation Classes for data sharing in the construction and facility management industries* — T1 (cited by number, text not retrieved).
- Class: STANDARD
- Scope: universal
- Confidence: Low (no clause quoted this session — the lexical pages were unread) / High (the five-level spatial decomposition is IFC's own stated structure, not an inference made here)
- Grid translation: `building → floor → room tile-set` is the exact 3-level tail of the chain; Project/Site are constants. Validate `every room belongs to exactly one floor, every floor to one building`.
- Exceptions / failure mode: multi-building or campus types need the Site level back; a single-tile-array model cannot hold two buildings.

### BIM-02 Contain physical elements in one spatial parent via an explicit relation object
- Rule: `BIM-02` Containment is a first-class relation record (`IfcRelContainedInSpatialStructure`), not a field on the element; each contained element has exactly one spatial container, and the relation — not the element — carries the ownership.
- Evidence: UNCITED — heuristic. Entity name asserted from general IFC knowledge; attribute list not read this session.
- Source: UNCITED — heuristic (pointer only: IFC 4.3.2 lexical index, host verified, body not retrieved).
- Class: STANDARD
- Scope: universal
- Confidence: Low (relation attributes not read) / High (IFC carries containment as an explicit relationship object with one spatial parent, not as an element field)
- Grid translation: tiles carry no parent pointer; the parent is *computed* by flood-fill. Emit the derived room set as an explicit relation table so validation can diff it after every wall edit.
- Exceptions / failure mode: elements spanning two storeys (stairs, risers, deep beams) break single-parent containment; the grid cannot express it at all, so cross-floor objects must be duplicated per floor with a shared id.

### BIM-03 Treat IfcSpace as the volume of use, and the wall as a different element
- Rule: `BIM-03` Rooms are spaces, not wall rings; the boundary elements are separate objects that reference the spaces they bound, and a space has no material thickness of its own.
- Evidence: UNCITED — heuristic. `IfcZone` (read, see BIM-04) is explicitly "an arbitrary collection of spaces… without its own shape representation" per TLiebich in the buildingSMART development issue, which is the same move: the spatial container is a grouping of used volume, not geometry of a solid.
- Source: buildingSMART IFC4.x-development issue #1, *IfcZone and IfcSpatialZone* https://github.com/buildingSMART/IFC4.x-development/issues/1 — T1 (read); rest UNCITED — heuristic.
- Class: STANDARD
- Scope: universal
- Confidence: Medium (for the "space = grouping without own solid" reading); Low for the IfcSpace attribute detail
- Grid translation: a room = its `walkable` tiles only; the ring is `blocked` and belongs to structure. Net area = tiles × 0.25 m².
- Exceptions / failure mode: shared party walls must be *owned* by one side or they get counted twice in structure and zero times in space, depending on which tally is wrong.

### BIM-04 Zones cut across spaces and storeys; never model a zone as a room
- Rule: `BIM-04` `IfcZone` groups *spaces* for one function and has no shape of its own, so it may span storeys and may collect non-adjacent rooms; `IfcSpatialZone` exists for the cases where the grouping needs its own independent shape (fire compartment, security zone, construction phase, …). Never promote a zone into a room.
- Evidence: Read from buildingSMART IFC4.x-development issue #1 (2020): TLiebich — "IfcZone is an arbitrary collection of spaces that may or may not be adjacent and do not have an own shape representation"; the thread's stated problem is that this limits zones for fire/security use, and the resolution was, per Moult, to "make these minor tweaks to the definition of IfcZone" while keeping both classes. `IfcSpatialZone` is described as having an independent shape where `IfcZone` does not.
- Source: buildingSMART IFC4.x-development issue #1 https://github.com/buildingSMART/IFC4.x-development/issues/1 — T1 (read); 5.4.3.82 IfcZone, IFC 4.3.2 documentation https://standards.buildingsmart.org/IFC/RELEASE/IFC4_3/HTML/lexical/IfcZone.htm — T1 (URL verified via search index, body 403).
- Class: STANDARD
- Scope: universal
- Confidence: Medium-High (source is the official development discussion, not the normative clause text)
- Grid translation: a zone = a tag set over rooms and tiles (`kitchen-zone`, `service-core`, `compartment-A`), many-to-many, allowed to be non-contiguous and cross-floor. Validate `every room has ≥1 zone or is explicitly unzone`, and `every zone member is a real room id`.
- Exceptions / failure mode: a "zone" that is exactly one room's tag is a room-type, not a zone — collapsing the two destroys the only way to express a compartment or a service group. Alexander's semi-lattice argument (BIM-21) is the theoretical statement of why.

### BIM-05 Adjacency is boundary semantics, not a shared blocked tile
- Rule: `BIM-05` `IfcRelSpaceBoundary` is the relation that says "space A touches space B through element E", qualified physical-vs-logical and inner/exterior/gap; adjacency rules must be written against that relation, not against "the two rooms share a wall".
- Evidence: UNCITED — heuristic. Entity name asserted; the attribute list (`RelatingSpace`, `RelatedBuildingElement`, `BoundaryType`, `PhysicalOrLogicalBoundary`, `CorrespondingBoundary`) and the first/second-order boundary distinction are **not verified this session** and must not be quoted downstream.
- Source: UNCITED — heuristic (pointer only: IFC 4.3.2 lexical page for IfcRelSpaceBoundary, host verified, body not retrieved).
- Class: STANDARD
- Scope: universal
- Confidence: Low (attribute list and the first/second-order distinction unverified — see Evidence) / Medium-High (`IfcRelSpaceBoundary` exists and is the space-to-space-through-element relation)
- Grid translation: derive the boundary graph: for each pair of rooms, the tile run between them, classified `party wall | door | exterior | none`. Check `no adjacency claim without a boundary element between the two tile sets`.
- Exceptions / failure mode: diagonal-only touch and point-touch rooms have no boundary tile on a 4-connected flood-fill, so a "adjacent" pair can exist with an empty boundary set — the grid must decide whether that counts, and record the decision.

### BIM-06 A door is a path connector between exactly two containers
- Rule: `BIM-06` `IfcRelConnectsPathElements` binds a path element (door, gate, opening, and by extension a portal) to a *pair* of related elements and carries the connectivity between them; the relation is inherently binary, and connector-priority attributes order which connection wins. A path element with no partner is not a legal connection.
- Evidence: Read from the IFC2x3 lexical mirror of `IfcRelConnectsPathElements`: the definition states it "provides the connectivity information between two elements, which have a path information", and the inherited `IfcRelConnects` attributes listed on that page are `RelatingPriorities`, `RelatedPriorities`, `RelatedConnectionType`, `RelatingConnectionType`, `RelatingLayerCount`, `RelatedLayerCount`. The IFC4/4.3 `ConnectingElement` / `ConnectedElement` + connector-port attribute names were **not** readable this session.
- Source: IFC2x3 final, lexical page for IfcRelConnectsPathElements, LBL mirror https://iaiweb.lbl.gov/Resources/IFC_Releases/R2x3_final/ifcsharedbldgelements/lexical/ifcrelconnectspathelements.htm — T1 content via T3 mirror (read); IFC 4.3.2 page https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcRelConnectsPathElements.htm — T1 (301 → host, body 403).
- Class: FACT
- Scope: universal
- Confidence: High for "binary connectivity between two path elements"; Low for the exact IFC4 attribute names
- Grid translation: every door run must have exactly two distinct room owners (or one room + exterior), and every portal must reference two distinct floors. Reject a door run touching 0 or 1 rooms, and — the real failure — one touching 3+ rooms, which the grid silently allows at a T-junction.
- Exceptions / failure mode: open-plan archways and lobby-to-corridor fronts are legitimately one-room or no-leaf openings; modelling them as `door` tiles without two owners breaks this rule, so they must be a distinct tag, not an overloaded door tile.

### BIM-07 Openings are void elements, and the filler references the void
- Rule: `BIM-07` A hole in a wall is its own entity (`IfcOpeningElement`) linked to the wall by a voiding relation, and the door/window that fills it is linked to the *void*, not to the wall; the wall does not know about its opening except through the void.
- Evidence: UNCITED — heuristic. Entity/relation names asserted from general IFC knowledge; not read this session.
- Source: UNCITED — heuristic
- Class: STANDARD
- Scope: universal
- Confidence: Low (exact relation name not read this session) / High (openings are void entities and the filler references the void — this is IFC's stated mechanism)
- Grid translation: a door tile *replaces* a blocked tile; there is no void object and no void/filler pairing to validate. Rebuild a substitute invariant instead: `every door tile must be adjacent to ≥1 room and lie inside a wall ring`, else it is a floating tile.
- Exceptions / failure mode: full-height open portals have no filler element in IFC either, so the grid and IFC agree here by accident, not by design.

### BIM-08 Vertical circulation is a modelled link with a queue, not a height field
- Rule: `BIM-08` Vertical movement is modelled as elements (`IfcStair` aggregating `IfcStairFlight`, lifts/escalators as transport elements) that are *connected* between storeys; storey-to-storey height and flight geometry are mandatory quantities in any real model.
- Evidence: UNCITED — heuristic for the entity detail. The binary-connectivity mechanism behind it is sourced (BIM-06), which is the transferable part.
- Source: UNCITED — heuristic
- Class: FACT
- Scope: universal
- Confidence: Low (entity attributes) / Medium (that vertical links are connectors, not fields)
- Grid translation: `portal`-tagged objects with queues are a correct discrete analogue of a path-connection relation across storeys; what is destroyed is rise, going, flight count, landing area, and therefore travel time and stair capacity.
- Exceptions / failure mode: escalators and travelators are path elements with no door-like leaf; fire rules need stair width × count capacity, which the grid cannot express at all — do not simulate it, declare it out of scope.

### BIM-09 Structure is grid-placed and its real payload is a load path, not a shape
- Rule: `BIM-09` `IfcColumn`, `IfcBeam`, `IfcSlab` are placed against a structural grid (`IfcGrid` axes); a column is a point support, a beam spans between two supports, a slab is a planar element associated with a storey. The information that matters is the span network, not the solid.
- Evidence: UNCITED — heuristic.
- Source: UNCITED — heuristic
- Class: FACT
- Scope: most building types; absent in load-bearing masonry and timber housing
- Confidence: Low (IFC entity detail unread) / High (point support, span between supports, slab on a storey — structural fact independent of IFC); "the information that matters is the span network" is this file's reading, not IFC's wording
- Grid translation: column = one blocked tile with `structure:column`; beam = a blocked run; slab = the floor itself; the 0.5 m lattice *is* the grid, but has no axis labels or pitches. The lost information is span, so the checkable substitute is a bay-module rule: max unsupported span in tiles per floor type.
- Exceptions / failure mode: long-span halls, atria and industrial halls legitimately violate any default bay rule; the rule must carry an explicit `long-span` exemption tag, not a silent tolerance.

### BIM-10 Windows carry light and view, never circulation
- Rule: `BIM-10` `IfcWindow` participates in space boundaries and in the envelope, and delivers daylight, view and (rated) separation; it must never appear in a path-connection graph as a traversable link.
- Evidence: UNCITED — heuristic, except the negative half, which follows from the sourced binary path-connection semantics: a window that people pass through would be a door.
- Source: UNCITED — heuristic (general IFC reading; no clause retrieved).
- Class: STANDARD
- Scope: universal
- Confidence: Medium (as a design invariant), Low (as an IFC citation)
- Grid translation: a window is a `blocked` tile with `glazing` + exterior-boundary tag; validate `glazing tile ∈ exterior ring of the floor` and `glazing ∩ door set = ∅`. A window that the path graph reads as a door is the classic generator bug on this grid.
- Exceptions / failure mode: interior glazed partitions bound two rooms and are still not traversable — so "touches two spaces" must not be the door predicate.

### BIM-11 MEP is a system tag set over spaces and elements, not geometry
- Rule: `BIM-11` `IfcDistributionSystem` groups the elements serving one distribution purpose (typed by a predefined enumeration covering families such as air, water, electricity, communications, control, heating, cooling, fuel, gas, waste water, fire protection), and a space's services are read from the systems serving it, not from the duct polyline.
- Evidence: UNCITED — heuristic for the exact enumeration members (the IFC4.3 page was not readable); the "system = grouping, not routing" reading follows from the same grouping logic documented for `IfcZone` (read, BIM-04).
- Source: UNCITED — heuristic (pointer: IFC 4.3.2 lexical index, host verified, body not retrieved); analogue source: buildingSMART IFC4.x-development issue #1 — T1 (read).
- Class: FACT
- Scope: universal
- Confidence: Low for the enum list, Medium for the principle
- Grid translation: services = per-room tag list (`supply-air`, `exhaust`, `water`, `waste`, `power`, `data`, `sprinkler`) declared on the programme row. Validate pair completeness: `fixture ⇒ supply + waste`, `kitchen/lab ⇒ exhaust`, `server ⇔ data + power`.
- Exceptions / failure mode: risers and shafts are vertical service routes the tile grid cannot path; a room can be "served" in the tag model with no physically possible route from the core.

### BIM-12 Material layers are destroyed by the grid; only a class tag survives
- Rule: `BIM-12` Real wall buildups are ordered layer sets with per-layer thickness (`IfcMaterialLayerSet` / `IfcMaterialLayerSetUsage`) or constituent sets; thermal, acoustic and fire performance are derived from the stack, not from the element type. A one-tile wall deletes the stack.
- Evidence: UNCITED — heuristic for the entity detail; the fact of the quantisation loss is arithmetic, not theory.
- Source: UNCITED — heuristic
- Class: FACT
- Scope: universal
- Confidence: Low (IFC detail) / High (the loss itself)
- Grid translation: one `wall_class` tag per tile (`external | party | corridor-shaft | partition`). Substitute checks are *qualitative relations between classes* — party wall is not a partition, external is not internal — never a U-value, Rw or REI.
- Exceptions / failure mode: any rule needing thickness (shaft wall, rated enclosure, structural depth) is undecidable on this grid, not approximate. Emit it as `skipped: not representable`, never as `passed`.

### BIM-13 Property sets are the extensibility mechanism; keep them namespaced
- Rule: `BIM-13` Data that the schema does not carry hangs off property-set collections under the `Pset_` naming convention (and quantity sets under `Qto_`), attached to elements by a defines-by-properties relation rather than written into the entity; inventing ad-hoc attributes on entities is the documented failure mode of bad IFC.
- Evidence: UNCITED — heuristic (naming convention asserted from general practice; attribute/relation names not retrieved).
- Source: UNCITED — heuristic
- Class: STANDARD
- Scope: universal
- Confidence: Low (attribute/relation names unread) / High (`Pset_` and `Qto_` prefixes are the schema's extension convention); "the documented failure mode of bad IFC" is practitioner lore here, not a quoted clause
- Grid translation: the tile grid has no pset slot; role/fixture tags are a flattened, untyped property set. Namespaced dotted keys (`fire.rating`, `acoustic.rw`, `hvac.serves`) cost nothing and prevent tag collisions.
- Exceptions / failure mode: un-namespaced flat tags become an undocumented enum that no validator can reject — this is exactly the state the host grid is in today for `role` tags.

### BIM-14 Quantities must be derived, never authored
- Rule: `BIM-14` Quantity sets (`Qto_*`, e.g. for spaces and walls) define net / gross / burden areas as computed from geometry, with the convention for what is included stated per quantity name; a model carrying hand-entered areas is untrustworthy and cannot be reconciled after a change.
- Evidence: UNCITED — heuristic for the specific quantity names (not retrieved). The general principle is the same one that makes `IfcZone`/`IfcSpace` groupings shape-free where shape exists elsewhere (BIM-04, sourced).
- Source: UNCITED — heuristic
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: Low (IFC detail) / High (the principle) — was STANDARD; demoted: the evidence establishes that `Qto_*` quantity sets exist and are geometry-derived, not that a delivered model must never carry authored areas; the derive-only prohibition is this repo's validator policy
- Grid translation: the grid computes plan areas exactly — integer tiles × 0.25 m² — which is the one place the discrete model is *better* than IFC, where areas fight tolerances and tessellation. Any stored area must equal the flood-fill count, or be an error.
- Exceptions / failure mode: door tiles belong to no room on this host, so a naive "sum of room areas + wall areas" under-reports total floor plates; the convention must be stated in the same place as the metric.

### BIM-15 Placement is relative and 3D; the grid keeps only the 2D root
- Rule: `BIM-15` An element's placement is a local placement chained to a parent placement via a 2D/3D axis placement, so an element has no absolute coordinates except through the chain; geometry is always relative to its container.
- Evidence: UNCITED — heuristic (attribute names asserted, not read).
- Source: UNCITED — heuristic
- Class: FACT
- Scope: universal
- Confidence: Low (placement attribute names unread) / High (IFC geometry is carried as placements chained to a parent, not as absolute coordinates)
- Grid translation: `(floor, x, z)` *is* the degenerate relative chain — floor is the parent placement, and the missing elevation + rotation is the entire loss. Validate `every object's coordinates resolve inside its own floor bounds`.
- Exceptions / failure mode: sloped, rotated or curved geometry (ramped corridors, radial lobbies, curtain walls) is unrepresentable; a rotated real building is quantised to the grid axis whether anyone decides that or not.

### BIM-16 Write rules as (selection, constraint, severity), delivery-specification style
- Rule: `BIM-16` A machine-checkable delivery rule has three separable parts: *which* things it applies to, *what* must hold of them, and *how bad* a failure is — and the whole point is that the rule is executable by a validator without a human reading the model, with each violation reporting a stable identity.
- Evidence: UNCITED — heuristic. This is the transferable shape of buildingSMART's Information Delivery Specification and of IFC rule-checking practice; **the IDS document itself was not retrieved this session**, so no facet names, cardinality semantics or JSON fields are asserted here.
- Source: UNCITED — heuristic (IDS / bSDD named but not read; do not cite a clause from this rule).
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: Low (as a citation) / High (as a design principle for this repo's validator) — was STANDARD; demoted: the IDS document was never retrieved, so the (selection, constraint, severity) triple is this file's shape for the host validator, not an IDS facet model
- Grid translation: every grid rule is a record `{ select: predicate over tiles/rooms, assert: predicate, severity: error|warning|info, id: stable-slug }`. Rule files themselves get schema-checked, and failure ids are unique and greppable.
- Exceptions / failure mode: prose rules ("lobby should feel generous") cannot be executed; they belong in the design-brief layer. A validator that mixes severities without ids produces one un-actionable blob.

### BIM-17 A model view is a filter; declare the subset schema before you generate
- Rule: `BIM-17` Because a full IFC schema is far larger than any single exchange needs, delivery practice defines a *view*: the subset of entities, attributes and relationship paths that a given exchange actually uses (ISO 29481 formalised the Information Delivery Manual / Model View Definition pair). Declare the subset before generating, and diff output against it.
- Evidence: UNCITED — heuristic for the standard's internals; only the numbers and titles are named, no clause quoted.
- Source: ISO 29481 (IDM/MVD) — T1, cited by number only, text not retrieved. UNCITED — heuristic otherwise.
- Class: STANDARD
- Scope: universal
- Confidence: Low (ISO 29481 internals unread — number and title only) / High (declaring a subset schema before exchange is real delivery practice); "declare then diff" is this repo's procedure
- Grid translation: the grid's model view is exactly `floor → room → (wall | door | window | portal) + property tags + derived quantities`, everything else filtered out. Publish it as the contract that both generator and validator import.
- Exceptions / failure mode: "add a bit more detail" with no view definition yields two half-models that cannot be diffed, and a validator that checks fields the generator was never told to emit.

### BIM-18 Check geometry, classification and properties as three independent passes
- Rule: `BIM-18` Design/model-rule-checking practice separates rules into geometry (clearance, clash, reachability, accessibility), classification-and-completeness (is it the right element type; are required properties present), and data/quantity rules — a clean result on one axis says nothing about the others, and mixing them in one report is the standard way a serious defect hides.
- Evidence: UNCITED — heuristic as a citation. The three-way split is a reconstruction from what the sourced material implies (boundary/connectivity relations, property sets, quantity sets are separate constructs) plus general commercial model-checking practice, whose documentation was not retrieved.
- Source: UNCITED — heuristic (commercial model checkers and the academic rule-checking literature were not reachable this session).
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: Low (as a citation) / High (as engineering practice for this repo)
- Grid translation: run the validator in three passes and always report which axis failed — geometry: reachability, exit access, clearances in tiles; classification: tags present, legal, non-contradictory; data: derived area == stored area, counts consistent.
- Exceptions / failure mode: a single pass with mixed severities buries one missing-exit error under four hundred missing-tag warnings, which is precisely how a "green" model check fails in review.

### BIM-19 Declare a level of information need per rule, per stage
- Rule: `BIM-19` openBIM/ISO 19650 governs *when* information is needed — a level of information need defined per stage, with model states progressing through a common data environment — not only what is needed; a rule with no stage attached is unenforceable because it will either be vacuous early or destructive late.
- Evidence: UNCITED — heuristic. Only the standard's existence and the "level of information need" concept are named; no clause quoted, and the relationship to the older US "LOD" ladder is not asserted here.
- Source: ISO 19650 series — T1, cited by number only, text not retrieved.
- Class: STANDARD
- Scope: universal
- Confidence: Low (no clause quoted; standard existence and the "level of information need" concept only) / High (staged information need is a genuine openBIM/ISO 19650 concept); "unenforceable without a stage" is this file's inference
- Grid translation: tag each rule with a milestone — `block-plan | layout | detail | release` — so early passes check only topology and area budgets, and only the release pass checks every tag.
- Exceptions / failure mode: applying release-grade checks to a block plan destroys generation diversity and reports 90 % failure on a legitimately coarse model.

### BIM-20 Bridge IFC connectivity to tiles with a space graph (dual / axial)
- Rule: `BIM-20` The right intermediate representation between IFC path semantics and a tile grid is a graph whose nodes are *spaces* and whose edges are *doors/portals* (the dual, or S-space, view), alongside the axial/convex view whose nodes are visible segments; accessibility and depth measures are computed on that graph, not on metric distance.
- Evidence: Space-syntax practice: nodes-as-spaces/edges-as-connections is the standard dual-graph formulation (Hillier & Hanson 1984; Hillier 1996; automated axial-map generation in Penn, Hillier, Banerjee & Xu 1997 — all **cited by title, not retrieved this session**). The IFC-side premise (door as binary path connector) is sourced, see BIM-06.
- Source: B. Hillier & J. Hanson, *The Social Logic of Space*, Cambridge University Press, 1984 — T3 (not retrieved); B. Hillier, *Space is the Machine*, Butterworth-Heinemann, 1996 — T3 (not retrieved); A. Penn, B. Hillier, T. Banerjee, J. Xu, "Space syntax, axial maps and architectural morphology: automating axial map generation and configuration analysis", *Environment and Planning B*, 1997 — T2 (not retrieved).
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: Medium (mechanics), Low (citation depth — page-level detail not verified)
- Grid translation: build `RoomGraph` from `deriveFloorRooms` + door runs + portals. Validate: degree per room, articulation points (a room whose removal disconnects the floor = single-route risk), and minimum door-count from every room to an exit.
- Exceptions / failure mode: metric A* cost and topological depth disagree — a long open hall can be metrically expensive and topologically trivial, and a sequence of six doors can be nine metres. Report both, never one as a proxy for the other.

### BIM-21 A tree cannot express a network; keep containment as a tree and relations as a lattice
- Rule: `BIM-21` Mechanical (tree) order cannot represent the cross-cutting relations of real buildings; a functional order is a semi-lattice where elements belong to more than one parent. IFC concedes the same point structurally by offering aggregation (tree) *and* zone/boundary/path relations (network) — the two are not interchangeable.
- Evidence: Christopher Alexander's argument, *A City is Not a Tree* (1965), cited by title; independently confirmed in the IFC material actually read here: `IfcZone` is defined as an "arbitrary collection of spaces that may or may not be adjacent", i.e. an explicitly non-tree grouping (buildingSMART IFC4.x-development issue #1).
- Source: C. Alexander, "A City is Not a Tree", *Architectural Forum* 122(1/2), 1965 — T3 (not retrieved); buildingSMART IFC4.x-development issue #1 https://github.com/buildingSMART/IFC4.x-development/issues/1 — T1 (read).
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: High
- Grid translation: the containment tree (`floor → room tiles`) stores; the boundary, path and zone graphs derive. Never serialise a derived graph as if it were authoritative, and never re-derive a stored graph without diffing it.
- Exceptions / failure mode: a generator that persists room membership and later edits walls silently desynchronises — the membership table says one thing, the flood-fill another, and whichever is read second looks like a data corruption bug.

### BIM-22 Every continuous-geometry concept must be replaced by a discrete predicate
- Rule: `BIM-22` Solid modelling (boundary representation, extruded/swept solids, parametric constraint solvers), millimetre tolerances and 3D partial-overlap clashes have no grid analogue; the substitute is a set of integer-tile predicates — occupancy, clearance radius in tiles, adjacency, reachability — and rules below the 0.5 m quantum are undecidable, not approximate.
- Evidence: UNCITED — heuristic as a citation; the loss statement is arithmetic about this host, not a claim about CAD theory.
- Source: UNCITED — heuristic
- Class: ENGINEERING CONSTRAINT
- Scope: universal
- Confidence: High (the loss) / Low (the citation)
- Grid translation: clearance rules become tile-count rules (turning space = a 3×3 walkable block = 1.5 m, the grid's nearest legal over-approximation of a turning circle); clash = two solid tags on one tile; tolerance = ±0 since everything is on-lattice.
- Exceptions / failure mode: a validator reporting "clearance OK" for a 1.4 m requirement is passing a check it cannot perform. Emit `not representable` as a third verdict alongside pass and fail — this is the single most important line in this file.

### BIM-23 No rule objects means no recompute; re-derive everything from tiles
- Rule: `BIM-23` Parametric BIM/CAD kernels propagate an edit through stored constraints so dependent geometry updates; this host has no rule objects, so no cached view can be trusted and every consumer must recompute from the tile array after any mutation.
- Evidence: UNCITED — heuristic as a citation (stated kernel behaviour, no source read). The negative fact — no rule objects on this host — is given by the host spec and is certain.
- Source: UNCITED — heuristic
- Class: ENGINEERING CONSTRAINT
- Scope: universal
- Confidence: High for the host fact (no rule objects on this host, given by the host spec); Low for the CAD-theory citation (UNCITED — heuristic as a citation)
- Grid translation: `rooms = floodFill(tiles)` must stay a pure function and be called after every wall edit. Add a determinism test: identical tile array ⇒ identical room set *and* identical room identifiers.
- Exceptions / failure mode: flood-fill/visit order changes room numbering, so any id stored elsewhere (NPC memory, queued target, saved furniture) becomes a dangling reference that looks like a random bug rather than an ordering bug.

### BIM-24 Classify against a dictionary, and validate membership rather than meaning
- Rule: `BIM-24` IFC classification carries an external code plus its source system (national/market classification schemes), and openBIM practice resolves property and enumeration names against a central dictionary (buildingSMART Data Dictionary) so that authoring and checking agree on what a term means.
- Evidence: UNCITED — heuristic as a citation; bSDD was not reachable this session and no registry entry is quoted.
- Source: UNCITED — heuristic (buildingSMART Data Dictionary named but not read).
- Class: STANDARD
- Scope: universal
- Confidence: Low (bSDD unreachable, no registry entry quoted) / High (IFC classification carries a code plus its source system, and dictionary resolution is openBIM practice)
- Grid translation: room-kind, fixture-kind and access tags must be one registry-backed enum, validated as `tag ∈ dictionary` with an error otherwise, and the dictionary version recorded next to the model.
- Exceptions / failure mode: synonym drift (`toilet` / `wc` / `bathroom` / `shower-room`) breaks every downstream rule silently, and free-text tags make the validator's job statistically, not logically, decidable.

---

## IFC→grid mapping table

| IFC entity / concept | Grid concept it survives as | What is lost | Compensating discrete check |
| --- | --- | --- | --- |
| `IfcProject` / `IfcSite` | constants (project id, site tag) | georeferencing, elevation reference, site/topography geometry | n/a — declare exactly one site; error on >1 |
| `IfcBuilding` | `building` record owning floors | footprint solid, address, storey heights | `floors ⊆ building`; `floor.index` dense and unique |
| `IfcBuildingStorey` | per-floor tile array | elevation, height, slab geometry, partial storeys | every object carries exactly one `floor` key |
| `IfcSpace` | a 4-connected room tile-set from `deriveFloorRooms` | volume, height, boundary surfaces, space-type geometry | net area = tiles × 0.25 m², derived never stored |
| `IfcZone` (SOURCED) | many-to-many tag over rooms/tiles, non-contiguous, cross-floor | aggregation of *spaces* without own shape; service grouping | `≥1 zone per room or explicit none`; zone members must be live room ids |
| `IfcSpatialZone` (SOURCED) | `compartment-A`, `security-red`, `phase-2` tags with a tile footprint | the shape-bearing grouping `IfcZone` cannot be | compartment must be tile-contiguous per floor; report cross-floor members |
| `IfcRelAggregates` | building→floor only | space-in-space nesting, partial storeys, site→building trees | reject room-inside-room; error |
| `IfcRelContainedInSpatialStructure` | implicit — membership computed by flood-fill | authored containment, element provenance, single-parent guarantee | emit derived containment table; diff after every wall edit |
| `IfcWall` | one `blocked` tile (= 0.5 m) | thickness, layer stack, wall alignment (axis/inner/outer), material | each tile has exactly one owner: structure, never room |
| `IfcDoor` | a run of `door` tiles | leaf width in mm, swing/hinge, hardware, fire rating | run has exactly two distinct room owners (room+exterior counts) |
| `IfcWindow` | `blocked` tile tagged `glazing`, on the exterior ring | sill/head height, glazing build-up, solar/thermal data | `glazing ⊆ exterior ring`; `glazing ∩ doors = ∅` |
| `IfcOpeningElement` | nothing — a door tile overwrites the wall tile | the void solid and its pairing to the filler | orphan scan: door tile adjacent to <1 room ⇒ error |
| `IfcStair` / `IfcStairFlight` | `portal` object with queue | rise, going, flight count, landings, width, capacity | portal references two distinct floors; queue length ⇒ declared capacity |
| `IfcColumn` / `IfcBeam` / `IfcSlab` | `blocked` tile(s) with `structure:*`; slab = the floor itself | load path, span, section, reinforcement, drop panels | bay rule: structural spacing ≤ max tiles, or explicit `long-span` tag |
| `IfcGrid` | the implied 0.5 m lattice | axis labels, pitches, curved/polyline axes | geometry is on-lattice by construction; error on off-lattice object |
| `IfcDistributionSystem` (+ flow terminals/segments) | per-room service tags | routing, pipe/duct sizing, pressure drop, risers, isolation | fixture ⇒ supply+waste+exhaust tag completeness |
| `IfcMaterial` / `IfcMaterialLayerSet(Usage)` / `ConstituentSet` | one `wall_class` + one `finish` tag | layer order and thickness; U, Rw, REI derived from stack | qualitative class relations only (party ≠ partition, external ≠ internal) |
| `Pset_*` / `IfcPropertySet` / `IfcRelDefinesByProperties` | namespaced dotted tags on tile/room/object | typed values, units, property templates, type-vs-instance split | `tag ∈ dictionary`; typed-value check against the dictionary |
| `Qto_*` / `IfcElementQuantity` | tile counts, exact | net/gross/burden definition per quantity name | assert stored area == derived area; drift is an error |
| `IfcLocalPlacement` / `IfcAxis2Placement2D/3D` | `(floor, x, z)` | elevation, rotation, the placement-parent chain | object coords must resolve inside its own floor bounds |
| `IfcRelConnectsPathElements` (SOURCED) | door runs and portals as the edge list of `RoomGraph` | the connector/port node pair, connection types, route priorities | every room reaches an exit; articulation-point test; no 3-way door |
| `IfcRelSpaceBoundary` | derived "tile run between room A and room B" | physical vs logical and inner/exterior/gap qualification; corresponding-boundary pairing | no adjacency claim without a boundary element between the two tile sets |
| `IfcRelVoidsElement` / `IfcRelFillsElement` | a single tile overwrite | referential integrity of void ↔ filler | floating-tile scan (`door ∉ any ring` ⇒ error) |
| `IfcClassification` (Uniclass / OmniClass etc.) | `room_kind`, `fixture_kind`, `access_role` enums | code system, version, and source linkage of each item | enum membership test; dictionary version stored with the model |
| IDS / delivery specification | validator rule record `{select, assert, severity, id}` | IFC vocabulary, facet names, bSDD resolution of concepts | schema-check the rule file itself; unique greppable failure ids |
| MVD / IDM (ISO 29481) | the published "grid model view" subset contract | process steps, exchange requirements, handover states | generation output diffed against the subset contract |
| Axial / convex / dual (S-space) maps | `RoomGraph`: nodes = rooms, edges = doors + portals | isovists, continuous visibility, angular/metric choice | depth-to-exit in door counts; degree; integration ordering |
| Space-functional graph (programming) | adjacency matrix from the programme table | non-spatial functional links, weighted relations, private/public coding | every matrix row must be satisfiable on the derived boundary graph |
| CAD solids: B-rep, extrude, sweep, boolean | tile occupancy | everything continuous and every sub-tile dimension | integer predicates per BIM-22; `not representable` verdict |
| Parametric constraint solver | none — no rule objects | automatic recompute, design intent, driven dimensions | purity + determinism test on `floodFill` (BIM-23) |
| Point cloud / as-built survey | none | as-built deviation, tolerance fields, existing conditions | n/a — `UNCITED — heuristic` |
| mm tolerances and 3D clash | tile clash (two solid tags, one tile) | sub-tile clash, tolerance thresholds, clearance envelopes | two-solid-tag scan; declare sub-0.5 m clash undecidable |

---

## Sources

**Read this session (evidence quoted above is from these only)**
1. IFC2x3 final, schema lexical page for `IfcRelConnectsPathElements` (Lawrence Berkeley National Laboratory mirror of the buildingSMART schema) — https://iaiweb.lbl.gov/Resources/IFC_Releases/R2x3_final/ifcsharedbldgelements/lexical/ifcrelconnectspathelements.htm — **T1 content, T3 host**. Definition read as: "provides the connectivity information between two elements, which have a path information".
2. buildingSMART `IFC4.x-development` issue #1, *IfcZone and IfcSpatialZone* — https://github.com/buildingSMART/IFC4.x-development/issues/1 — **T1 (official development repository; discussion, not the normative clause)**. Quotes used: TLiebich — "IfcZone is an arbitrary collection of spaces that may or may not be adjacent and do not have an own shape representation"; Moult on resolution — "make these minor tweaks to the definition of IfcZone".
3. URL/availability probes (not content): `https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcRelConnectsPathElements.htm` 301-redirects to `https://standards.buildingsmart.org/IFC/DEV/IFC4_3/HTML/lexical/…`, and both `…/lexical/IfcZone.htm` and `…/IfcRelSpaceBoundary.html` returned 403 to this client. These establish that the canonical IFC 4.3.2 lexical pages exist at that host; **their content was not read and is not quoted anywhere in this file.**

**Named, not retrieved — usable as a pointer, never as a clause citation**
4. ISO 16739-1:2018, *Industry Foundation Classes (IFC) for data sharing in the construction and facility management industries* — T1.
5. ISO 29481 series (Information Delivery Manual / Model View Definition) — T1; part-to-title mapping not verified.
6. ISO 19650 series (openBIM information management; "level of information need") — T1.
7. buildingSMART Information Delivery Specification (IDS) and buildingSMART Data Dictionary (bSDD) — T1; **no IDS construct (facet, cardinality, constraint vocabulary) is asserted in this file.**
8. B. Hillier & J. Hanson, *The Social Logic of Space*, Cambridge University Press, 1984 — T3.
9. B. Hillier, *Space is the Machine*, Butterworth-Heinemann, 1996 — T3.
10. A. Penn, B. Hillier, T. Banerjee, J. Xu, "Space syntax, axial maps and architectural morphology: automating axial map generation and configuration analysis", *Environment and Planning B*, 1997 — T2; volume/pages not verified.
11. C. Alexander, "A City is Not a Tree", *Architectural Forum*, vol. 122, 1965 — T3.
12. Commercial IFC model checkers (Solibri-class tools) and the automated design-rule-checking literature (semantic rule checking, code-as-rules) — **not reachable this session; deliberately left as `UNCITED — heuristic` in BIM-16/BIM-18 rather than paraphrased from memory.**

---

## Weak or contested

- Nearly everything above rests on **two** readable sources. The IFC 4.3 schema is the primary source and this client cannot fetch it; entity attribute lists in BIM-02, BIM-05, BIM-07, BIM-13, BIM-14, BIM-15, BIM-16 are asserted from general knowledge and must be treated as unverified.
- Whether `IfcSpace` is bounded by `IfcWall`, by boundary surfaces, or by a `IfcRelSpaceBoundary` structure is genuinely unsettled across authoring tools; the "space is the used volume, the ring is structure" convention adopted here is one of at least two defensible readings.
- `IfcSpatialZone` was introduced *because* `IfcZone` had been overloaded for uses it could not serve — so the "zone = tag set" analogy here rests on a term the standard itself had to revise. Read BIM-04's grid translation as a proposal, not a mapping.
- The connector/port *state machine* in BIM-06 is the part I could not verify: the two-node `IfcPort` structure and the priority/connection-type enums are asserted. What is verified is only that the relation is between **two** elements.
- "IDS superseded MVD practice" and "MVD/IDM are ISO 29481" are directional claims about industry practice; the part-to-standard mapping was not checked and may be wrong.
- Lifts: whether they are transport elements, path connectors, or shafts with a door at each floor varies across tools; the grid's `portal` erases the distinction, so any capacity claim drawn from either reading is heuristic.
- "A discrete grid is more exact for quantities than IFC" holds for plan areas only; it inverts for anything involving height, and is an artefact-comparison, not a modelling virtue.
- Space-syntax measures are contested inside space syntax (automated axial-map generation, choice vs integration, angular analysis), and neither the books nor the papers were read here — BIM-20's citation set is title-only.
- Whether "level of information need" maps cleanly onto the older US "LOD" ladder is debated; BIM-19's stage-tagged rules are our reading, not a quoted requirement.
- Sub-0.5 m rules are not approximated by this grid, they are **unrepresentable**: a validator that reports `pass` on leaf thickness, door closing width or a rated enclosure is reporting on nothing.

## Type-specificity audit

- **Hotel / serviced apartment (this project's dominant type):** the containment chain (BIM-01/02/03) and door-as-binary-path-element (BIM-06) carry almost all the load, because a hotel floor is a corridor graph of near-identical spaces; zones and MEP reduce to one repeated per-unit tag bundle. Grid-faithful — this file is written for this type first.
- **Office:** `IfcZone`/`IfcSpatialZone` (BIM-04) and the space graph (BIM-20) dominate instead, because open plan has weak room identity — compartments and service zones, not rooms, are the meaningful containers. A flood-fill "room" can be one giant node, which makes room-degree and depth measures nearly useless.
- **Hospital / laboratory:** the material-layer (BIM-12) and distribution-system (BIM-11) rules stop being optional — pressure cascade, clean/dirty separation, shaft routing and compartmentation *are* the design, and all four are destroyed by the grid. Hospital validation in this file is `UNCITED — heuristic` and effectively unavailable.
- **Residential / multi-family:** party-wall ownership (BIM-03, BIM-12) is the dominant correctness issue and the grid's weakest point; acoustic and fire classes can be assigned but never checked.
- **Retail / museum / atrium / station:** long-span structure (BIM-09) and multi-storey public space invert the defaults — missing columns are correct, and one space legitimately spans several storeys, which the one-floor-per-space invariant forbids.
- **Data centre / industrial:** distribution systems (BIM-11) become the primary object and rooms become secondary; the "space first, services as tags" ordering in this file is backwards for that type.
- **Campus / masterplan:** `IfcSite`, multiple `IfcBuilding` instances, and pedestrian-level graphs become load-bearing; a single per-floor tile array is the wrong host, not a coarse one.
