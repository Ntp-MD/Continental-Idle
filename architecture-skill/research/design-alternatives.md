# Research: design alternatives — how professionals generate, compare and refuse to choose

Scope: the option-building part of architectural method — when alternatives are owed, what makes two
options *genuinely* different rather than the same plan nudged, which objectives are used as axes, and
how a comparison is presented without declaring a universal winner. The master spec (§18 Domain Q,
§37) forbids hiding trade-offs; this file supplies the procedure and the evidence for why.

Evidence note: sources marked "knowledge source" are cited by title/authority for framing and were not
quoted from a retrievable page this pass; nothing numeric rests on them.

---

## Rules

### DA-01 Declare the axis before drawing the option
- Rule: Every option is generated to win one named objective (efficiency / circulation / user
  experience / structural simplicity / operational efficiency / daylight / adaptability / cost of
  change), and the option's parti sentence names that objective before any geometry exists.
- Evidence: Optioneering and value-management method works from objectives to alternatives rather than
  the reverse; RIBA's plan of work stages treat scheme development as the production and testing of
  options against the brief's priorities, and formal MCDA in construction first fixes criteria and
  weights, then scores options.
- Source: RIBA Plan of Work 2020, Stage 3 (Spatial Coordination) and the optioneering expectation
  within it — https://www.ribaplanofwork.com — T3 (professional institution), knowledge source;
  value-management guidance as published by professional bodies (ICE/NBS-level) — T3; MCDA/AHP
  application in construction decision-making — T2 as a research class.
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: High for the method; Medium for the specific stage naming (verify the edition)
- Grid translation: Option header line `Option B — axis: operational efficiency — parti: service
  circulation never shares a metre with guest circulation`. Reject an option set in which two options
  name the same axis: that is a variant, not an alternative.
- Exceptions / failure mode: Symptom of axis-free generation — four plans that differ only in where the
  stair sits, presented as "options".

### DA-02 Make options differ structurally, not cosmetically
- Rule: Two options must differ in at least one of: the circulation organisation, the core position or
  count, the plate depth, the module size, or the zoning band assignment. Moving a partition is not an
  option.
- Evidence: Morphological and systematic-combination methods in design research generate alternatives
  by varying independent solution *parameters*, which is exactly why option sets built by perturbing
  one parameter look alike; documented design-process studies describe professionals deliberately
  producing mutually exclusive gestalts rather than refinements.
- Source: morphological analysis / systematic-combination tradition — T2/T3 as a class, knowledge
  source; Lawson's empirical studies of designer strategy — T2, knowledge source (no passage quoted).
- Class: HEURISTIC (method rule)
- Scope: universal
- Confidence: Medium
- Grid translation: Compute the option *diff vector*: `(core coords, spine route set, plate depth in
  tiles, module, band assignment)`. Require ≥2 differing components between any pair; emit the diff
  vector with the comparison so the reader can see the options are real.
- Exceptions / failure mode: A single-component difference is legitimate only in a sensitivity test
  ("what if the core moves 4 tiles") — label those tests, they are not alternatives.

### DA-03 Hold the inputs constant, or the comparison is void
- Rule: Same programme table, same adjacency grades, same site grid and cardinal assignment, same
  occupancy, same constraint set, same metric list. Any option that changes an input has changed the
  question and must be reported as a separate scenario.
- Evidence: Standard controlled-comparison logic in experimental and MCDA practice; in professional
  terms, option appraisals that let a variant drop an inconvenient requirement are the classic route to
  a pre-determined "winner".
- Source: MCDA practice in construction appraisal — T2/T3 as a class;
  `architecture-skill/research/validation.md` VA-01 (validate against the written oracle) — internal.
- Class: FACT (method property)
- Scope: universal
- Confidence: High
- Grid translation: All options run through the identical validation script; the report prints the input
  hash (programme totals, matrix grades, grid extent) once above the comparison table. Different
  inputs ⇒ different table.
- Exceptions / failure mode: Programme is *itself* the open question — then options vary programme and
  must be presented as scenarios with different totals, never as comparable options.

### DA-04 Every option carries the full seven-field record
- Rule: Strategy / Strengths / Weaknesses / Major assumptions / Trade-offs / Risks / Best-suited
  objective, per option, with strengths and weaknesses expressed in measured quantities wherever the
  host can measure them.
- Evidence: Required by the master spec §37; matches professional option sheets and risk-register
  practice, where an advantage without its cost is treated as advocacy rather than analysis.
- Source: `architecture-skill/goal-task` §18, §37 — task spec; risk-register practice — T3 as a class.
- Class: STANDARD (conduct rule)
- Scope: universal
- Confidence: High
- Grid translation: `Strengths` fields cite computed metrics (circulation share 19 %, 41 % of rooms
  double-aspect, 2 service/public crossings); `Weaknesses` cite the metrics that got worse. An option
  whose Weaknesses field is empty is not finished.
- Exceptions / failure mode: The usual failure is prose strengths ("generous", "elegant") beside
  numeric weaknesses — asymmetry of evidence is the tell of advocacy.

### DA-05 Price every concession in tiles, and name who loses
- Rule: For each option, list what it gave up and to whom: the guest who lost the window, the
  housekeeper who gained 60 extra tiles of route, the operator who lost 9 keys, the structural engineer
  who gained a transfer, the reviewer who gained a fire-engineering question.
- Evidence: Documented trade-off reasoning in architectural practice (the spec's own §18 and §21
  examples are all of this form), and the argument-asymmetry finding that options presented without
  losers get adopted on taste rather than on the trade.
- Source: `architecture-skill/goal-task` §21 (Domain T examples) — task spec;
  `architecture-skill/research/decision-making.md` (conflict catalogue) — internal cross-reference.
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: High
- Grid translation: Concession ledger per option: `<giver> → <receiver>: <tiles or metric delta>`.
  Example: `usable area −168 tiles (42 m²) → circulation capacity +1 tile width on the guest spine`.
- Exceptions / failure mode: Unpriced concessions resurface later as change requests — the trade is paid
  for twice.

### DA-06 Use the five standard axes, then add only evidenced ones
- Rule: Start from efficiency / circulation / user experience / structural simplicity / operational
  efficiency; add environmental performance, adaptability or lifecycle cost only where the brief or the
  site makes them decisive. Each axis needs a concrete geometric move on a 0.5 m grid or it is dropped.
- Evidence: The five are the axes the master spec names; environmental and adaptability axes are
  supported by the wider evidence in this set (`environmental-design.md`, `lifecycle.md`,
  `economics.md`) and by institutional guidance that makes sustainability a scheme-level option
  decision rather than a later system choice (WBDG treats it as a design driver from programming on).
- Source: `architecture-skill/goal-task` §18 — task spec; WBDG — https://www.wbdg.org — T1/T3.
- Class: HEURISTIC (menu of axes)
- Scope: universal; axis weighting is type-specific
- Confidence: High that these axes are the professionally used ones; Low that five are sufficient — the
  set is a starting menu, not a closed taxonomy
- Grid translation: Axis → move → cost, e.g. *efficiency*: shrink circulation to the legal floor, hold
  one 3-tile spine, stack BOH around one service cluster — cost: capacity and passing comfort.
  *Experience*: split the spine into two 2-tile routes, deepen the arrival sequence, give primary rooms
  two aspects — cost: circulation share, key count.
- Exceptions / failure mode: An axis with no move attached ("quality") is a wish, and it will be
  satisfied by whichever option the author already prefers.

### DA-07 Score with the same metric list; never drop a metric after seeing the results
- Rule: Fix the metric list before generating options; report every metric for every option, including
  the ones where the recommended option loses badly; state the weights used and where they came from.
- Evidence: Pre-registration logic in appraisal practice and the well-known bias in weighted-scoring
  exercises where criteria or weights are tuned post hoc — the reason professional guidance insists the
  evaluation frame is agreed before schemes appear.
- Source: MCDA/published weighting-critique literature — T2 as a class, knowledge source;
  `architecture-skill/research/validation.md` VA-18 (measured-vs-required diff table) — internal.
- Class: STANDARD (conduct rule)
- Scope: universal
- Confidence: High for the rule; the specific bias mechanism is cited as a class of finding
- Grid translation: Emit the matrix options × metrics with no blank cells; a metric that cannot be
  computed on an option is written `unrepresentable` or `n-a (reason)`, never omitted.
- Exceptions / failure mode: Dropping a metric is also how an option quietly becomes the recommendation.

### DA-08 Refuse a single winner; state who each option is for
- Rule: The conclusion is a mapping from objective to option, plus the evidence that would change the
  mapping. Only when the brief's priorities are explicit and compatible may a recommendation be made,
  and it must cite the priority that produced it.
- Evidence: The spec's §18 instruction ("do not declare one universal winner"); Rittel's
  indeterminacy argument — design questions have no true/false answers, only better/worse relative to a
  commitment — is the standard theoretical ground for presenting options rather than solutions.
- Source: `architecture-skill/goal-task` §18 — task spec; Rittel & Webber, "Dilemmas in a General
  Theory of Planning", *Policy Sciences* 4(2), 1973 — T2, knowledge source, text not retrieved this pass.
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: High
- Grid translation: Closing form: `If the operator's priority is key count → Option A (168 keys,
  circulation 17 %). If it is service separation → Option C (0 public/service crossings, 152 keys).
  Deciding datum: the brand standard's BOH share, currently UNVERIFIED (A-05).`
- Exceptions / failure mode: An "all-round best" option is usually the one whose axis the author chose,
  and the roundness claim hides the weighting.

### DA-09 Options are cheap; pick late, but not too late
- Rule: Generate options at the point where the decision is still reversible (before the stack, core
  and module are fixed), collapse to one at the latest when irreversible geometry must be drawn, and
  record the decision point as a dated event with what it forecloses.
- Evidence: Late-change cost escalation documented in professional practice (PP-23 in this set reports
  the 10-50× order for post-freeze change as practitioner consensus rather than a measured constant);
  real-options reasoning says value lies in deferring commitment while keeping it possible.
- Source: `architecture-skill/research/professional-practice.md` PP-23 — internal, T4/T5-grade evidence
  explicitly flagged there; real-options framing in design — T2 as a class, knowledge source.
- Class: HEURISTIC
- Scope: universal
- Confidence: Medium (direction certain, magnitude not)
- Grid translation: Tag each option-set with the tile-decisions it still leaves open (core coordinates,
  module, band edges) and with the decision that closes them; do not carry three options past the point
  where they share a core stack — after that they are one design with cosmetic variants.
- Exceptions / failure mode: Deferral forever: three options carried to the end is a decision avoided,
  and the client pays for all three.

### DA-10 Say when no option is needed, and why
- Rule: A single option is legitimate when every gate passes with the declared margin and the brief's
  objectives are compatible; that condition is then reported, along with the two or three axes a
  reviewer should test if they disagree.
- Evidence: The spec's own condition (§37 "when the problem has significant uncertainty or conflicting
  objectives"); the codes file in this set demonstrates the case where a single conservative default is
  the correct output instead of an option set.
- Source: `architecture-skill/goal-task` §37 — task spec;
  `architecture-skill/research/building-codes.md` conservative-default rule — internal.
- Class: STANDARD (conduct rule)
- Scope: universal
- Confidence: High
- Grid translation: Output `Options: 1. Justification: no objective conflict; gates pass with margins —
  <list>. Axes a reviewer should challenge: circulation share, portal capacity.`
- Exceptions / failure mode: Zero options plus an unexplained conflict in the brief is the fingerprint of
  a design generated straight from the requirements to coordinates.

---

## Option record template (fill all fields; empty = unfinished)

```
Option <id> — axis: <single objective> — parti: <one sentence, no geometry words>
Inputs held constant: <programme totals / matrix grades / grid extent / occupancy> [hash]
Diff vector:  core=<coords>  spine=<route set>  plate_depth=<tiles>  module=<WxH>  bands=<assignment>
Strengths (measured):   <metric=value vs base, ...>
Weaknesses (measured):  <metric=value vs base, ...>
Major assumptions:      <A-nn refs with confidence>
Trade-offs priced:      <giver → receiver: Δtiles / Δmetric>
Risks:                  <what breaks it, and the falsifier that would show it>
Best suited objective:  <the one clause under which this option wins>
Uncomputable here:      <checks the host cannot run → proxy or escalation>
```

## Sources
- `architecture-skill/goal-task` §18 (Domain Q), §21 (Domain T examples), §37 (multi-option design) —
  the task specification defining the required record fields and the no-winner rule.
- RIBA Plan of Work 2020, Stage 3 — https://www.ribaplanofwork.com — T3, knowledge source; the
  institutional expectation that options are produced and tested against brief priorities.
- WBDG (NIBS/NIH) — https://www.wbdg.org — T1/T3; sustainability and programming as scheme-level design
  drivers rather than late additions.
- `architecture-skill/research/validation.md` — VA-01 (oracle first), VA-10 (capability manifest),
  VA-18 (diff table) — internal corollaries used by DA-03, DA-07.
- `architecture-skill/research/professional-practice.md` — PP-23 (freeze-then-change cost) — internal,
  itself flagged as practitioner consensus rather than measurement.
- `architecture-skill/research/building-codes.md` — conservative default and flag protocol — internal.
- MCDA / AHP application in construction appraisal; morphological analysis; Lawson's designer-strategy
  studies; Rittel & Webber (1973) — T2, cited as research classes; no passage quoted, no number taken.

## Weak or contested
- **Weighted scoring is treated here as a reporting device, not a decision device.** Published critiques
  of AHP-style weighting note that weights are easily tuned to a preferred outcome; DA-07's
  fix-the-metrics-first rule is a mitigation, not a cure. Do not present a total score as if it decided
  anything.
- **The five axes are the spec's, not an evidence-derived taxonomy.** Whether they are exhaustive is a
  judgement; DA-06 therefore permits adding axes only where the brief or site makes them decisive.
- **The 10-50× late-change figure (DA-09) is practitioner consensus** carried from PP-23 with its own low
  confidence; the direction of the argument is safe, the magnitude is not.
- **"Pick late" is contested by delivery method.** In design-build or fast-track work the stack and
  module close far earlier, which shrinks the option window to almost nothing; the rule then becomes
  "generate options before the freeze date is accepted".
- No project-database evidence was retrieved for this file (unlike `real-projects.md`), so the claims are
  method claims. Where a claim would need measured outcome data, it is labelled HEURISTIC or cited as a
  research class rather than as a finding.

## Type-specificity audit
- **Type-independent:** DA-01, DA-02, DA-03, DA-04, DA-07, DA-08, DA-10 — the arithmetic of comparison
  does not care about the programme.
- **Axis weighting is type-dependent:** in **hotels** the live conflict is keys per plate vs service
  separation vs module repetition, and BOH share is the contested number; in **hospitals** the
  dominant axes are infection control vs observation vs future clinical change, and the option that
  wins on efficiency routinely loses on adjacency flexibility; in **offices** the plate-depth /
  core-to-perimeter / daylight trio dominates and lettable-area measures carry the argument; in
  **residential** the axes collapse toward aspect, privacy and unit mix, and options are usually
  *massing* options rather than plan options; in **industrial/logistics** structure and dock count are
  the only axes with real leverage, so options that differ only in office-side layout are noise; in
  **civic/education** supervision, capacity peaks and symbolic legibility enter as axes with no
  counterpart elsewhere.
- **What differs about the record itself:** operational types (hotel, hospital, retail) require the
  `Trade-offs priced` field to be measured on simulated staff and service routes, not just areas;
  non-operational types can satisfy it with area and daylight metrics. Types whose host room-tags do not
  exist (clinical, industrial) additionally must disclose that the metric vocabulary itself is a
  proxy — see `uncertainty.md` UN-07, UN-08.
