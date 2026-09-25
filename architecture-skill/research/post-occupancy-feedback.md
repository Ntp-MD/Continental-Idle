# Research file — Domain AP: Post-occupancy evaluation and the feedback of in-use evidence into design rules

Scope: what a building is measured as **once it is occupied**, and how a measured result is converted
back into a design rule that carries its provenance, a scope no wider than its evidence, and an expiry.
Three quarters of this loop are already owned and this file deliberately owns none of them.
`evaluation.md` (`EV-01`…`EV-30`) owns **measuring a design**: the three measurement questions
(EV-01), the metric definitions and their denominators (EV-04…EV-09), the KPI catalogue (EV-10…EV-18),
composite scoring and weight sensitivity (EV-20…EV-23), human-panel and LLM-judge protocols
(EV-25…EV-27), skill ablation and regression (EV-28/EV-29), and the reproduction bundle (EV-30).
Nothing below re-derives an EV metric or protocol; where a design measure has an in-use counterpart the
EV ID is cited and only the measured-in-use layer is added. `professional-practice.md` PP-25 owns the
**obligation** ("trust measurement over intent: close the POE loop") and already carries the finding
that translation of findings into new designs is "notably rare"; PP-16 and PP-26 own the office
complaint-share and hotel-review figures. `lifecycle.md` owns the aftercare phase as a *constraint on
static geometry* (LC-15, LC-24) and cites Soft Landings as a delivery framework; `real-projects.md` and
SR-4 in `synthesized-rules.md` own the rule that a project's documented outcome is advocacy, capped at
Medium-High (RP-08, RP-23). What no file owned before this one: the POE **method** (which instrument,
on which population, at what sample size, against which comparator distribution), the **in-use**
measurement layer (satisfaction indices and their box definitions, monitoring protocols, complaint
spatialisation, metered energy against rated energy), and the **conversion pipeline** that decides
whether a measured finding is allowed to become a rule the skill cites. That pipeline is what makes
this skill a learning system instead of a static checklist — and it is also the easiest place to launder
a weak study into a strong rule (UN-13), which is why more than half of these rules constrain the
conversion rather than the measurement.

Host grid unchanged: `1 tile = 0.5 m`; `4 tiles = 1 m²`; tile states ONLY `walkable | blocked | door`;
rooms are 4-connected flood-fills typed by fixture tags; portals with queues; path length by octile
distance (`src/engine/npc/distance.ts:1-4`); no heights, materials, occupants or time. The absence of
occupants and time is the central difficulty of this domain: POE evidence is *about* people through
time, and the host has neither. Every rule below therefore states what part of an in-use finding the
grid can inherit and what part must be exported as a parameter, a band, or an assumption row (UN-07).

Tiers per UN-12: **T1** standards body / institution / dataset owner / code or guidance text / host
code, **T2** peer-reviewed, **T3** reputable technical documentation and trade press, **T4** secondary
explanation, vendor, practitioner blog. A figure from a page that could not be decoded is
`UNCITED — heuristic`; a claim that matters and could not be confirmed carries `NEEDS VERIFICATION`
with the check named. One `Class` per rule (SKILL.md §Evidence Rules); the caveat lives inside the rule
it qualifies, never only in §Weak or contested (audit/README.md §1).

**Prefix claim:** `PO-` is new and collides with nothing in `coverage-map.md` §7, and is registered
here because this file changed no other file: adding the §7 row, the `SKILL.md` §Quantitative Layer row
and the `sources.md` index entry for Domain AP is an integration pass owed to the orchestrator. The
domain is hospitality-adjacent in application but not hospitality-only in scope;
`hotel-operating-standards.md` (`HO-`) owns the operating ratios, and where an in-use measurement checks
one, the HO ID is cited and the ratio is not restated.

---

## Rules

### PO-01 Grade the evaluation by its rigour before its result is quoted; indicative, investigative and diagnostic evidence license different claims
- Rule: POE is not one act with one evidence weight. Three published levels of rigour exist — **indicative** (quick, cheap, walk-through plus key informants), **investigative** (systematic, against compiled functional goals or industry standards), **diagnostic** (objective physical measures correlated with subjective occupant response, run to generate transferable knowledge). An indicative finding may trigger a design question; only a diagnostic finding may change a rule, because only it has the objective/subjective pairing that lets a cause be attributed.
- Evidence: The National Research Council's state-of-the-practice summary sets out a three-level typology attributed to Wolfgang F. E. Preiser and colleagues, and prices it: an indicative evaluation is done through "selected interviews with knowledgeable informants, as well as a subsequent walk-through"; the investigative type "is applied to thoroughly understand performance causes and effects" and "averages approximately $1.00 per square foot ($15,000–$20,000 project-wide)"; the diagnostic type "correlate[s] physical environmental measures with subjective occupant response measures" and "ranges from 50 cents a square foot for indicative-type POEs to anywhere from $2.50 upward at the diagnostic level". The same report defines the whole practice as "the process of evaluating buildings in a systematic and rigorous manner after they have been built and occupied for some time" — the *after occupation* clause is what makes it a different evidence class from a simulation or a design review. Costs are US 2001 dollars, not inflation-adjusted.
- Source: NRC, *Improving Post-Occupancy Evaluations on Federal Agencies' Building Assets: A State-of-the-Practice Summary* (Transportation Research Board, 2001) §3 — T1, https://www.nationalacademies.org/read/10288/chapter/3 (pages opened this pass: ch. 3, 4 and 6).
- Class: STANDARD
- Scope: every in-use figure entering a design claim, brief, rule or report line
- Confidence: High on the typology and the use-relationship; Medium on the money figures (2001, US federal, per-ft², not adjusted)
- Grid translation: tag every in-use figure `poe-class: indicative|investigative|diagnostic` at first mention; an `indicative` tag may not appear in a `Rule:` line anywhere in the corpus, an `investigative` tag may set a band but not a threshold, and only `diagnostic` may supersede a heuristic — through PO-18.
- Exceptions / failure mode: rigour is not the same as relevance; a diagnostic study of a laboratory answers nothing about a guest floor (PO-11). The inverse failure is more common: a cheap walk-through observation promoted into a design rule because it was vivid. Failure symptom: "the cleaning staff avoided the north stair" becoming a corridor-width rule.

### PO-02 Treat POE as a scheduled programme, not an event; the published cadences disagree because they measure different things
- Rule: One evaluation proves nothing durable. The measured programme is: an early quick-response instrument at ~3 months, a full first evaluation at 6–12 months, a contractual review no sooner than 12 months after handover and repeated annually to month 36, then a recurrence every 2–5 years wherever a repetitive building template is in use. Every figure quoted from an occupied building carries its month-since-occupation stamp, because the first year is not representative.
- Evidence: The NRC summary reports the initial assessment "six to twelve months post-occupancy, with recurring evaluations every two to five years for agencies using repetitive facility templates", and separately recommends quick-response surveys "three months after buildings were occupied" with a questionnaire deployed "about six months after move-in". The UK Soft Landings framework sets a contractual floor in its sixth phase, "Years 1 - 3 extended after care and POE", where formal checks happen "no sooner than 12 months post-handover, repeated at 12 month intervals and culminating in a final project review at month 36", with the review cadence moving "from monthly to quarterly". The two schedules conflict as numbers and agree as intent — see §Conflict register item A1.
- Source: NRC 2001 §3 and §4 — T1, https://www.nationalacademies.org/read/10288/chapter/3 , https://www.nationalacademies.org/read/10288/chapter/4 ; BSRIA, *What stages are involved on a Soft Landings project?* — T1/T3 (institution's own framework page), https://www.bsria.com/uk/consultancy/project-improvement/soft-landings/about-soft-landings/soft-landings-approach/
- Class: STANDARD
- Scope: any claim about a building in use; every aftercare/POE obligation in a brief
- Confidence: High that a repeated schedule is required (two independent institutions); the months are institution-specific, not physical
- Grid translation: emit `measured@month:N` on every in-use line, and `poe-schedule: {t1: 3m, t2: 6-12m, review: [12,24,36], recurrence: 2-5y}` as a project row in the assumption register (UN-07). A design revision may not cite an in-use figure with `measured@month < 6` as a band.
- Exceptions / failure mode: a 12-month gate delays the lesson past the point where it can change the current job — which is exactly why the 3-month instrument exists and why the feed-forward path (PO-16) matters more than the schedule. A repeatable-template assumption (2–5 years) does not hold where the operator changes the use (PP-25's own exception). Failure symptom: a single survey at month 2 presented as "the building performs".

### PO-03 A POE is a coverage matrix; publish which cells were measured and which are empty
- Rule: Four aspect groups recur across every serious POE programme — **functional** (does the plan do its job), **technical** (do systems deliver), **behavioural/social** (what people do and how they feel about it), **process** (how well the delivery machine worked). A "POE was done" claim is meaningless until the matrix is printed; a programme that fills one column and calls the building evaluated is the norm, not the exception.
- Evidence: The instruments listed in the NRC practice summary distribute across the four aspects rather than covering one: occupant questionnaires ("formatted as 5-point scales on which building occupants rate the seven key dimensions"), interviews and focus groups ("individual interviews, focus groups, and a questionnaire survey"), structured site assessment ("a structured team walk-through of the existing facility"), physical measurement ("data collected from instruments measuring indoor air quality"), behaviour capture ("_in-situ_ observations of user behavior"), and visual record ("comprehensive set of photographs, to document existing conditions"). The report's own diagnosis of why the link to engineering fails is a coverage statement: the literature shows "few tools available to collect user feedback on a standardized basis", and comparing subjective to objective data is what makes "baseline scores to be calculated on the seven comfort dimensions across all buildings" possible. Soft Landings adds the process column explicitly, requiring alignment on "energy strategy – and the metering and monitoring strategy – and the approach to commissioning" before handover. The four-aspect framing is this file's organisation of the instrument lists read above, not a taxonomy lifted from a book: Preiser, Ransom & Gill, *Assessing Building Performance Evaluation* (2005) could not be opened this pass — **NEEDS VERIFICATION**: read its stated evaluation aspects and reconcile with this matrix before either is quoted as the standard set.
- Source: NRC 2001 §4 — T1, https://www.nationalacademies.org/read/10288/chapter/4 ; BSRIA Soft Landings phases — T1/T3 (URL at PO-02); Preiser, Ransom & Gill, *Assessing Building Performance Evaluation*, E & FN Spon, 2005 — **located, not opened this pass**; no claim rests on it.
- Class: DESIGN PRINCIPLE
- Scope: universal; every POE programme, brief line and design-claim audit
- Confidence: High that a coverage matrix is the right object (all four aspects are independently documented as instrument classes); Medium on the exact four-way partition (this file's synthesis)
- Grid translation: emit the 4 × (instrument) matrix each time with a per-cell state `measured | proxy | not-attempted (reason)`; a summary claim may only be emitted when ≥3 of 4 aspects are non-empty, and any cell that is empty must name the instrument that would fill it.
- Exceptions / failure mode: full coverage is unaffordable on a small job (PO-01's costs bite); the answer is a declared narrow scope, not a silent one. Over-instrumenting is its own failure — "Often such questionnaires are overly long and detailed" (NRC §4), which suppresses response rates and manufactures the null result. Failure symptom: "POE complete" meaning a thermal survey and nothing else, then a circulation rule justified from it.

### PO-04 Name the respondent population; guest, resident-staff and operator evidence are three instruments with three sampling frames
- Rule: There is no such thing as "occupant satisfaction" in the abstract. Guests are episodic, short-dwell, recall-based respondents; resident occupants (workers, patients, residents) are longitudinal and can attribute causes; operators and maintenance staff see failure modes no occupant sees. Each needs its own instrument, its own sample frame and its own claim ceiling — and a plan may only be criticised on the population that was actually asked.
- Evidence: The NRC summary describes the three families of informant side by side — occupant questionnaires, "individual interviews, focus groups" with stakeholders, and structured walk-throughs with operators — and warns that the occupant channel is structurally skewed, because "much of the information received from POEs is critical in nature". The CBE archive demonstrates the frame problem empirically: its 897-building database is offices (77%), K-12 schools (12%), labs (4%), clinical care (3%), university classrooms/labs (2%) and student housing (1%), with "most surveys performed in Class A office buildings in North America" — a resident-occupant frame with no hospitality category at all. The hotel side uses a different frame entirely: 609 *frequent travellers* drawn from a professional online panel and asked to evaluate 26 hotel characteristics after a stay.
- Source: NRC 2001 §4 — T1 (URL at PO-03); Hischke, Andersen, Cao, et al., "Lessons learned from 20 years of CBE's occupant surveys", *Buildings and Cities* (2021) — T2, https://journal-buildingscities.org/articles/10.5334/bc.76 ; Robbins, Grandner, Knowlden & Severt, "Examining key hotel attributes for guest sleep and overall satisfaction", *Tourism and Hospitality Research* 21(2), 2020, doi:10.1177/1467358420961544 — T2, https://pmc.ncbi.nlm.nih.gov/articles/PMC10130565/
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: High (three independent sources structure the population this way)
- Grid translation: every in-use line carries `population: guest|resident|staff|operator|unoccupied-hours`, `frame: how the sample was drawn`, `n`, `response: %|unknown`. A rule may only be sourced from a population whose function the rule governs: staff evidence for servicing rules, resident evidence for comfort rules, guest evidence for decision-attribute ranking only (PO-14).
- Exceptions / failure mode: staff are the cheapest and most biased informants (they are also the people whose work the design is criticised for); operator claims about occupant experience are hearsay and must be tagged `operator-report`, not `resident`. Multi-population studies are rare, which is why PO-21's pooling rules matter. Failure symptom: a guest-facing design change justified by "what the front desk hears".

### PO-05 Declare the sample's scope and its exclusions before any percentage leaves the building
- Rule: State which floors, zones, shifts and tenures were in scope and which were excluded — the unoccupied trial period, the night shift, the serviced floors, the tenant who declined, the room type with three respondents. A POE percentage quoted without its scope line is unattributable to the design.
- Evidence: The CBE lessons-learned paper documents exclusions made silently by every large archive: rare space typologies are excluded outright on functional grounds, sparse subgroups force comparisons to be treated as "exploratory", and decades of collection produced "partial responses and slight changes in questions" that break cross-section comparability. The participation model is itself an exclusion: the paper reports that the open web deployment is self-selecting and that no non-response adjustment is reported. The hotel panel study reports that its panel operator did not release response metrics, so its own response rate is unknown to its authors.
- Source: CBE lessons-learned paper — T2 (URL at PO-04); Robbins et al. 2020 — T2 (URL at PO-04)
- Class: ENGINEERING CONSTRAINT
- Scope: every in-use measurement entering a report
- Confidence: High (each statement is the source's own disclosure)
- Grid translation: a `sample-scope` block ships with every in-use figure: `floors:[…]`, `zones:[…]`, `excluded:[unoccupied-commissioning|night|boh|declined|n<min]`, `response:%|unknown`, `non-response:adjusted|not-adjusted|impossible`. An in-use figure with `response: unknown` may be cited only as anecdote and can never set a band.
- Exceptions / failure mode: full disclosure looks like hedging and clients read a caveat as a weakness; the alternative is a number that cannot survive a second look (EV-19's honesty requirement applied in use). Failure symptom: "84 % satisfied" from a survey of a single wing in the season of handover.

### PO-06 A satisfaction percentage is a box definition plus a scale direction; publish both or the number is not comparable
- Rule: "Satisfied" is not a datum, it is a decision: which points of the scale count as satisfied, and which end of the scale is satisfied. The same archive reports different percentages depending on the box, and the two published CBE-style conventions run in opposite directions on the same page. Any satisfaction figure entering the corpus must carry `scale`, `direction`, `box`, `n`.
- Evidence: The CBE instrument is documented as "a seven-point Likert scale (1 = very satisfied, 7 = very dissatisfied)", with dissatisfaction aggregated from scores "1–3", satisfaction from "5–7" and the midpoint (4) as neutral — and the authors state the convention is being revised to "(1 = very dissatisfied and 7 = very satisfied)" to align with standard practice, i.e. the same archive changes the *direction* of its scale between releases. **Those two quoted statements are mutually inconsistent as printed**: the box assignment (satisfied = 5–7) matches the *incoming* direction, the described scale the *outgoing* one, so a reader cannot tell from the paper which convention a given published CBE percentage used. Both readings are recorded, neither is averaged (source-internal conflict; §Conflict register item A3 is the convention-change case). The radiant/all-air analysis uses the mirror-image presentation, "a 7-point Likert scale ranging from 'very satisfied' (+3) to 'very dissatisfied' (-3)", and computes satisfaction at three different boxes: −1…+3 (ASHRAE 55-2017 acceptability), 0…+3, and +1…+3 (strict) — three different percentages from one dataset.
- Source: CBE lessons-learned paper — T2 (URL at PO-04); Dawe, Karmann, Schiavon & Bauman, "Field evaluation of thermal and acoustical comfort in eight North-American buildings using embedded radiant systems", *PLoS ONE* 16(10):e0258888, 2021, doi:10.1371/journal.pone.0258888 — T2, https://pmc.ncbi.nlm.nih.gov/articles/PMC8547689/
- Class: FACT
- Scope: every satisfaction or acceptability percentage from any in-use study
- Confidence: High
- Grid translation: no satisfaction percentage may be written into this corpus without the four-part suffix, e.g. `satisfied 61 % (7-pt, 7=VS, box 5-7, n=412)`; a bare percentage is a lint failure. Where a box differs from the local default, the line states both the reported and the recomputed figure, or refuses the comparison.
- Exceptions / failure mode: means of Likert items are widely used and widely misread — CBE itself aggregates to "weighted averages across multiple items" for factor scores, which is a different object from a satisfaction percentage and must not be compared with one. Mean-versus-box drift is invisible when only one figure is published. Failure symptom: a "satisfaction mean 5.2/7" presented next to a "74 % satisfied" benchmark.

### PO-07 Report the interval, not just the point; a small-n building difference is not a finding
- Rule: Every in-use percentage ships with `n` and the approximate interval around it. The rule of thumb for a proportion near 0.5 is ±1.96·√(p(1−p)/n): n = 40 → ±15.5 pp, n = 100 → ±9.8 pp, n = 400 → ±4.9 pp, n = 1000 → ±3.1 pp. A large archive may still decline to publish intervals — but then it must not be used to rank two buildings.
- Evidence: The CBE paper states that its benchmarking reports no confidence intervals and sets no strict per-building response minimum, while the archive is still used to compare buildings — the gap between the statistic and its use is the documented problem. The hotel study could not report response metrics at all. The NRC summary answers with a design of the sample rather than an after-the-fact correction: studies should target a "stratified random sample of the populations", and the value of scale is that "the large number of cases and variety of building settings surveyed enabled baseline scores". The interval arithmetic is this file's computation from the normal approximation, stated as arithmetic, not as a sourced standard.
- Source: CBE lessons-learned paper — T2 (URL at PO-04); NRC 2001 §4 — T1 (URL at PO-03); Robbins et al. 2020 — T2 (URL at PO-04). Interval table: arithmetic, `HEURISTIC` as a decision rule.
- Class: FACT
- Scope: every in-use percentage, in every report and rule citation
- Confidence: High on the requirement; the ±band is an approximation that fails at the tails and for clustered samples
- Grid translation: `value (n=N, ±X pp, design: census|stratified|volunteer)`. Where the interval straddles the comparator, the verdict is `unknown` (VA-03), never "better". Design-time effect: this is EV-19's three uncertainties translated to the measured side, and it is the in-use twin of EV-09's "state the denominator".
- Exceptions / failure mode: volunteers violate the independence the interval assumes, so the printed ±band understates the true error — say so rather than omitting it. Large archives hide small subgroups: an 897-building database can still rest on 12 respondents in the room type being defended. Failure symptom: a two-building comparison at n = 25 per building reported as a performance difference.

### PO-08 Pair every subjective finding with an observational or physical check; a rating with no witness is a hypothesis
- Rule: Occupant ratings locate a problem, they do not diagnose it. Before a rating becomes a design claim, it is checked against an instrument that observes the world: a structured walk-through, an in-situ behaviour observation, a photographic record, a metered quantity, or a maintenance record. Single-instrument POEs are the reason POE findings do not survive into the next project.
- Evidence: The NRC summary lists the observation instruments as first-class and cheap: participatory tours are "quite inexpensive and can be completed with several person-days of effort", they "gave the consultant a large amount of information efficiently; consensus began to build", and the diagnostic type is defined by exactly the pairing demanded here — physical measures correlated with subjective response (PO-01). Its warning about the unpaired subjective channel is blunt: occupant feedback arrives skewed because "much of the information received from POEs is critical in nature". The hotel study shows what a subjective-only design cannot do: it is cross-sectional, single-timepoint, and its authors concede that the design "blocks causal inference" and that retrospective self-assessment is exposed to memory distortion.
- Source: NRC 2001 §3 and §4 — T1 (URLs at PO-01/PO-03); Robbins et al. 2020 — T2 (URL at PO-04)
- Class: STANDARD
- Scope: any in-use finding used to justify a design change
- Confidence: High
- Grid translation: `subjective: <rating/box/n>` + `witness: walkthrough|observation|photo|meters|work-orders|none` and a verdict of `attributed|unattributed`. `witness: none` closes the finding as an open question in the assumption register (UN-07), not as a rule.
- Exceptions / failure mode: some costs are only in the subjective channel (sleep, perceived crowding, speech privacy), so the pairing must not be read as a veto on survey evidence; it is a veto on *causal* claims. Observation without a survey misses the complaint nobody voices in front of a researcher. Failure symptom: "guests dislike the corridor" driving a width change when the measured cause was the ice machine behind the wall (FL-14, PP-16).

### PO-09 Physical measurement is a protocol with a boundary, a baseline and a denominator; a meter reading without them is not evidence
- Rule: Before any measured quantity is trusted, fix four things: the **measurement boundary** (what area or system the denominator covers), the **baseline period** (what it is compared against, and which confounders get adjusted out — weather, occupancy count, hours, use mix), the **logging protocol** (parameter, position, interval, duration, exclusion of the unoccupied/commissioning period), and the **instrument class** (metered utility data, spot instrument, or a rating). A number whose boundary is not stated is a number about an unknown object.
- Evidence: The Irish EPC study — 9,923 dwellings — uses verified utility billing as its measured record and compares it against a certification, i.e. it puts the meter above the model, and its conclusion is that policy should follow the same route: "Future EPCs could be improved by incorporating historical household energy usage". The US federal utilisation case shows the boundary failure at scale: a 2026 report on the GSA USE IT Act dataset states that zero of 9,700 tracked facilities reach the mandated 60 % utilisation rate, that the dispute turns on the measurement boundary — the reported method counts entire square footage rather than functional workspaces — with the agency's own acting commissioner calling it "not necessarily seeing an apples-to-apples comparison", and third-party analysis putting office space at only about 65 % of typical federal floor area, which is enough to make the programme's target unreachable by arithmetic. Soft Landings requires the monitoring design pre-handover rather than after the fact: alignment on "energy strategy – and the metering and monitoring strategy – and the approach to commissioning", with Phase 4's technical verification reported as focused on BMS configuration, data reconciliation and metering accuracy.
- Source: Coyne & Denny, "Mind the Energy Performance Gap: testing the accuracy of building Energy Performance Certificates in Ireland", *Energy Efficiency* 14(6):57, 2021, doi:10.1007/s12053-021-09960-1 — T2, https://pmc.ncbi.nlm.nih.gov/articles/PMC8550629/ ; Federal News Network, "GSA reexamining data that shows no building is meeting minimum occupancy target" (June 2026) — T3/T4, https://federalnewsnetwork.com/facilities-construction/2026/06/gsa-reexamining-data-that-shows-no-building-is-meeting-minimum-occupy-target/ ; BSRIA Soft Landings — T1/T3 (URL at PO-02); NRC 2001 §4 — T1 (URL at PO-03) for the physical-instrument class
- Class: STANDARD
- Scope: all measured quantities — energy, water, occupancy, utilisation, temperature, sound, counts
- Confidence: High on the requirement; Medium on the GSA figures (a news account of an administrative dataset, not a study)
- Grid translation: every measured line carries `boundary: <tiles|net|m² of use|floor area>`, `baseline: <window + adjustments>`, `logging: <parameter, position, interval, duration, excluded-window>`, `instrument: meter|spot|rating`. On this grid the only defensible area boundary is the derived tile count of the use it names (`EV-11`'s one-convention requirement, restated for measured data); a utilisation figure quoted against GROSS and one against NET are different claims, not different results.
- Exceptions / failure mode: the perfect protocol is the enemy of any protocol — metered subtotals often exist where boundary-correct spot measurement does not. Sub-metering gaps are a *design* finding, not merely a data gap (OM-20 owns metering access as geometry; PP-18/PP-24 explain why the meter that should have proved the case was never installed). Failure symptom: "floor utilisation 34 %" computed over circulation, plant and voids.

### PO-10 State statistical significance and practical significance separately; a p-value that changes no decision is not a design finding
- Rule: An in-use difference must be reported with its test *and* its magnitude in the unit the decision consumes. Large archives make almost everything significant: the radiant-versus-all-air temperature difference is significant at p < 0.001 with a Spearman's ρ of 0.14, which its own authors treat as negligible-to-small. The design question is never "is it real" but "would any tile move because of it".
- Evidence: "The difference in mean was statistically significant (p<0.001), and the Spearman's ρ effect size (ρ = 0.14)" — from a comparison pooling 26 radiant buildings (1,645 responses) against 34 all-air buildings (2,247 responses), i.e. 3,892 surveys where almost any difference clears the threshold. The paper's practical reading is stated as a conclusion, not a hedge: "radiant and all-air buildings have comparable temperature and acoustic satisfaction", with acoustic scores consistently lower than thermal ones across the case buildings, and the design instruction is operational rather than typological — slow system response and control ownership matter "for designers and operators to consider in radiant buildings".
- Source: Dawe, Karmann, Schiavon & Bauman 2021 — T2, https://pmc.ncbi.nlm.nih.gov/articles/PMC8547689/ (CC BY, open access)
- Class: FACT
- Scope: every comparative in-use claim, and every pooled database statement
- Confidence: High
- Grid translation: report `Δ (pp or unit), test, p, effect-size, decision-relevant: yes|no` — and `decision-relevant: no` forbids the finding from setting or shifting a band. The design-unit conversion is explicit: state the tile/area/minute consequence, or the row is descriptive only.
- Exceptions / failure mode: the reverse error also kills designs — a genuinely large effect measured on 20 respondents in one building is discarded by the interval discipline of PO-07; the answer is a declared `exploratory (n=20)` label, not silence. Failure symptom: a system-type recommendation built on a 0.14-rank correlation across thousands of office workers.

### PO-11 A measured result is only a benchmark if the comparator's type matches; the largest occupant archive in the world contains no hospitality
- Rule: Never compare a measurement to a benchmark from a different building type or a different dwell-time. Where the type does not match, the comparator is an *assumption row with a falsifier* (UN-07, DM-21), never a band — and the mismatch to watch is not climate or country, it is dwell time and control ownership.
- Evidence: The CBE archive's own composition is the strongest available evidence for the ban: offices 77%, K-12 schools 12%, labs 4%, clinical care 3%, university classrooms/labs 2%, student housing 1%, geographically spread over the US, UK, Canada, Australia, China, India, Italy, Japan, Mexico, Singapore and the UAE, with "most surveys performed in Class A office buildings in North America" and the authors conceding this "widens the equity gap… while limiting our knowledge". There is no hotel category in a 93,662-response, 897-building database. The corpus already carries the same discipline for generated plans: FP-19 quarantines residential datasets and SP-24 quarantines inherited percentages as type-named heuristics — this rule is the in-use version of that, and it is *not* a restatement of either.
- Source: CBE lessons-learned paper — T2 (URL at PO-04); FP-19, SP-24, EV's register discipline in-repo
- Class: STANDARD
- Scope: all in-use comparisons; hotels, wards, classrooms, transport and industrial floors in particular
- Confidence: High
- Grid translation: every in-use comparison line carries `benchmark-source`, `benchmark-type`, `benchmark-n`, `type-match: yes|no`. `no` forces the finding into the assumption register with `falsifier: <the measurement that would settle it>` and blocks it from `EV-10`'s band column.
- Exceptions / failure mode: no hospitality benchmark of comparable size exists, so a hotel POE will always be type-mismatched against the published archives — which is precisely why PO-26 (measuring your own population) is not optional for this project. Failure symptom: an office-derived "61 % satisfied is normal" applied to a guest floor where the respondent slept there for two nights.

### PO-12 Control ownership and response time, not system class, predict thermal satisfaction; put both in the plan
- Rule: When the named causes of dissatisfaction are "lack of thermostat control" and "slow system response", the system-type choice is not the operative variable. Design accordingly: the servable zone, the control interface and the response-time budget are plan decisions, and the plan must be testable for them before plant selection.
- Evidence: "The top two sources of discomfort are 'lack of thermostat control' and 'slow system response'" in the eight-building radiant field study, whose between-type result was that radiant and all-air satisfaction were comparable (PO-10), and whose operational instruction is that these factors "are important for designers and operators to consider in radiant buildings due to slow response time of the systems". Cross-read: this is the same finding PP-16 reaches from the complaint side in offices (other people, speech privacy, control), and it is the reason EN-25's façade/interior zone split and SV-13's velocity-and-zone arithmetic are comfort decisions, not just engineering ones.
- Source: Dawe et al. 2021 — T2 (URL at PO-10); PP-16, EN-25, SV-13, CN-16 in-repo
- Class: DESIGN PRINCIPLE
- Scope: any type with individually-controlled long-occupancy rooms: hotel, office, healthcare, residential
- Confidence: High for the control finding (named causes, 3,892 responses); Medium for transfer to a hotel guest room (different instrument, guest-controlled setpoint, staff-owned reset)
- Grid translation: measure the **servable-zone boundary** in tiles: one room = one control = one independently served zone; emit `control_zone_share = rooms with own control / long-occupancy rooms` and `slow_response_exposed = bedrooms adjacent to a plant or vertical-service boundary` (flagged via SV-*/CN-14). A plan may not claim "individually controlled" unless each room's service zone is expressible as tiles.
- Exceptions / failure mode: guest-setpoint control in hotels is reset by staff between stays, which converts a personal-control gain into an operational burden (HO-09/HO-14 own the minutes) — measure the two effects separately. Central-plant response time is not fixable in plan; only the zoning that hides it is. Failure symptom: a fan-coil hotel claiming personal control while housekeeping resets every room to a building default each morning.

### PO-13 Acoustic satisfaction sits below thermal in the same buildings, and the residue is speech privacy — measure them as two quantities
- Rule: Sound *level* satisfaction and *speech-privacy* satisfaction are distinct measures with distinct design levers, and the acoustic column reads worse than the thermal column in the same occupied buildings. A POE that asks "how is the noise?" cannot tell a designer whether to add mass, distance, layout separation, or a door.
- Evidence: The eight-building study reports acoustic satisfaction below thermal satisfaction in every case building, with per-building temperature satisfaction ranging up to 96 % and acoustic satisfaction topping out lower — the two reading passes taken from the tables during this research disagreed on the low ends (thermal 32–96 % in one pass, 64–96 % in the other; acoustic 17–85 % vs 64–85 %), and both readings are recorded rather than averaged (§Weak or contested item 3). The named residual is spatial, not mechanical: "Sound privacy in open-plan offices remains a challenge." The corpus's own complaint-side evidence is PP-16 (acoustics the most common named dissatisfaction in 617 office buildings, with the cause being people talking and phones) and EQ-27 (buying the buffer in dB and in tiles) — cited, not restated.
- Source: Dawe et al. 2021 — T2 (URL at PO-10); PP-16 and EQ-26/EQ-27 in-repo
- Class: DESIGN PRINCIPLE
- Scope: cellular types (hotel, hospital, residential, school) and open-plan office alike
- Confidence: High that the two columns diverge and that privacy is spatial; Medium on magnitude, because the range transcription conflicted across passes — **NEEDS VERIFICATION**: re-read Tables 3–4 of the PLoS ONE paper and record the exact per-building values with the figure numbers before quoting a range
- Grid translation: split the acoustic line into `sound_level_ok` and `speech_privacy_ok` per room pair; on the grid the second is a *path* property (CN-26 party-wall chain continuity, PP-16/PP-17 buffer geometry, EN-17 turns and staggered openings), so emit `shared_speech_path = min(threshold_count, has_buffer_tile, wall_chain_straight)` per pair. Do not print a dB claim (UN-05, EQ-26's own boundary).
- Exceptions / failure mode: hotels invert the office finding partly by design — the guest's own bathroom is often placed against the neighbouring sleeping side deliberately (PP-17's note); a rule imported from offices would flag thousands of compliant rooms. Failure symptom: a plan that passes every dB proxy and is unsellable because guests hear the corridor.

### PO-14 Guest evidence is a decision-attribute ranking, not a satisfaction level; it can prioritise a brief and cannot verify a plan
- Rule: The guest population yields *what matters*, in odds ratios between attribute states and outcomes, from a single recall-based report after the stay. It does not yield a building's performance level, a trend, or an attribution to geometry. Use it to weight the brief (DM-17, EV-10's weights) and never as the in-use check on a design.
- Evidence: The strongest open-access hotel instrument read this pass surveyed 609 frequent travellers through a professional online panel across 26 hotel characteristics on a 5-point scale, adjusting for age, sex and relationship status. Its results are attribute-level odds, not levels: uncomfortable bedding predicted poor sleep at OR = 2.63, unsupportive pillows at OR = 2.49, and poor individual sleep predicted a worse overall stay rating at OR = 3.48; the largest single attribute effect reported was inadequate bathroom supplies at OR = 5.04. Noise enters the model as two named sources — HVAC machinery sound and exterior disturbance — not as a wall-assembly measure. Its authors' limitations are decisive for this rule: the panel withheld response metrics, the cross-sectional design "blocks causal inference", dichotomising the grading continuum reduced precision, and retrospective self-assessment is vulnerable to memory distortion.
- Source: Robbins, Grandner, Knowlden & Severt 2020, *Tourism and Hospitality Research* 21(2) — T2, https://pmc.ncbi.nlm.nih.gov/articles/PMC10130565/ ; the corpus's own review-mining evidence is PP-26 (>95,000 reviews across 99 hotels: service and rooms dominate, amenities do not) — cited, not restated
- Class: FACT
- Scope: hospitality; and any episodic-user type (transit, retail, visitor attractions)
- Confidence: High on the instrument's shape and limits; Medium on every individual OR (single study, n = 609, self-reported panel)
- Grid translation: guest evidence enters as the **weights** on the type card (which attribute rows get area and minutes) and as a **check on DM-17's default priority order**; it may not enter as a threshold. Every guest-sourced weight prints `source-type: guest-odds (n=609, cross-sectional)` and `claim-class: comparison` never (EV-01).
- Exceptions / failure mode: ORs are not effect sizes on the design variable — "bedding comfort" is a procurement decision with zero tiles; a naive reading produces "invest in mattresses, ignore the plan", which PP-26's review analysis argues against in the opposite direction (rooms and service consistency). The two studies answer different questions and must not be pooled. Failure symptom: a design recommendation sourced from guest odds with no geometric quantity anywhere in the chain.

### PO-15 Where a design decision is defensible only by operator records, measure the task; do not re-assert the standard
- Rule: A labour or throughput standard is a prediction. The in-use instrument is a time-and-motion study of the task decomposition, and its design lesson is *which tasks* and *which room states* consume the minutes — the staff member measured is not the variable. Re-asserting the standard instead of measuring the task is how a plan keeps shipping the same invisible cost.
- Evidence: A stopwatch time study of hotel room cleaning in a 4-star hotel (JIEM 14(3), 2021) found that "only the task-related variables have a statistically significant influence on total cleaning time" while staff characteristics showed no measurable effect, and that "five tasks represent over 2/3 of the total cleaning time" — i.e. the minutes concentrate in a short task list, which is exactly the structure a plan can serve or obstruct. The corpus's own minute ledger is HO-09/HO-10/HO-14 (the bathroom is where the minutes go; the shift's minutes converted into a walking budget) and OM-28 (staff walking distance is the currency the plan spends) — measured task data is how those assumptions get falsified, and none of those IDs is restated here. The published minutes-per-room and per-task figures were not legible on the page opened (the article PDF did not decode) — **NEEDS VERIFICATION**: retrieve the task table and record the observed standard time against the hotel's allowed time before any minute figure is quoted from this study.
- Source: "Hotel room cleaning: Time study and analysis of influential variables in a Spanish hotel", *Journal of Industrial Engineering and Management* 14(3), 2021 — T2, https://www.jiem.org/index.php/jiem/article/view/3441 (abstract read; PDF undecodable this pass)
- Class: STANDARD
- Scope: operationally complex types: hotel BOH, hospital ward, kitchen, retail back-of-house, cleanrooms
- Confidence: Medium on the method (one study read at abstract level); High on the principle (it is PP-25's obligation, made concrete for staff work)
- Grid translation: replace assumed task times with a measured row `task → minutes → variance → room-state-dependency`, then re-derive the HO-14 walking budget and re-run OM-28/EV-17 against it. Each task carries a spatial dependency tag (`distance`, `door-count`, `fixture-count`, `cart-parking`), which is the only part the grid can act on (AG-11 counts thresholds; OM-01/OM-13 own cart bays).
- Exceptions / failure mode: a time study measures the observed method, not the best method, and the observer changes what is observed; it also measures one hotel's standards, so transfer is bounded by segment (HO-01). Failure symptom: a housekeeping standard re-published unchanged for a plan whose floors are 40 % longer than the study's.

---

## The conversion pipeline: measurement → rule

The rules below own the back half of the loop — the part the corpus has never specified. They are the
reason this file exists.

### PO-16 Feed-forward is a designed channel, not a virtue; the documented barrier is availability, not ignorance
- Rule: Evidence reaches the next design only through a named channel with an owner, a format and a trigger. The documented failure of POE practice is not that data are absent but that they do not reach a decision-maker in a form a decision can consume — so the channel is a deliverable of the POE programme, with the same status as the survey.
- Evidence: The NRC report states the mechanism plainly: "the simplest barrier to using POE for organizational learning is when POE results are not available to decision-makers", and "most organizations do not reward exposing shortcomings". It also documents the channel working: agencies "created design guides that are widely distributed", and POEs "are used directly by the Judicial Conference to test and update the U.S. Courts Design Guide" — a measured finding entering a binding design standard through a named institution, which is the strongest real-world precedent in this file. The professional side corroborates the intent: RIBA's POE guidance says evaluations "help designers to close the performance gap" between design intent and operation, and that "the better their next buildings are likely to meet the complex needs of the clients and occupants". The scheduling warning is the NRC's, not RIBA's: delayed reviews "find no place in the phases of a conventional building project" (NRC §4). Preiser's own framing, carried in the NRC report, is the phrase the whole domain exists for: results must "feedforward into the next building cycle".
- Source: NRC 2001 §3, §4 and §6 — T1, https://www.nationalacademies.org/read/10288/chapter/3 , https://www.nationalacademies.org/read/10288/chapter/4 , https://www.nationalacademies.org/read/10288/chapter/6 ; RIBA, *Post Occupancy Evaluation Guidance* — T2, https://www.riba.org/work/business-tools/post-occupancy-evaluation-guidance/
- Class: DESIGN PRINCIPLE
- Scope: every POE programme, and every skill/rule update sourced from an occupied building
- Confidence: High (institutional practice documented on both the failure and the success side)
- Grid translation: emit a `feed-forward channel` block per POE: `owner`, `artifact` (rule diff / type-card update / assumption row / guide clause), `destination` (which file, which ID), `trigger` (measurement that opens it, PO-19's expiry), `accepted-by`. A finding with no channel is recorded in the report and marked `dead-end` — publishing dead-ends is what makes the count visible.
- Exceptions / failure mode: the channel can be used to entrench a bad finding — hence PO-19's provenance stamp and PO-20's supersession discipline. Institutional design guides also lag: the NRC's own case is a guide updated by POE, but a guide is only as current as its last update trigger. Failure symptom: a lessons-learned register nobody reads and a design guide frozen at its 2011 edition.

### PO-17 A prediction register with a measurement recipe is mandatory output; PP-25's obligation, made concrete
- Rule: Every numeric design claim that survives to construction is written down before handover as a prediction row with the instrument that will falsify it, the population it applies to, the month it will be measured, and the boundary convention. No recipe, no claim: an assertion that cannot be tested in use is a preference, and preferences belong in the parti, not in the KPI block.
- Evidence: PP-25 already states the obligation and the diff (recompute the prediction set on re-load of a built plan, and treat a degraded metric as a design bug unless the diff shows the route was repurposed) and EV-19 already requires that every comparative number carry band, stage and harness error. What is added here is the *measurement* half of the register: the Irish EPC study (PO-09) is the cautionary case that predictions are checked against billing rather than against models, and the radiant study's control finding (PO-12) shows which predictions matter — "lack of thermostat control" is a claim a plan can either honour or break. The NRC's diagnosis of why this fails organisationally is availability, not knowledge (PO-16).
- Source: PP-25, EV-19 in-repo; Coyne & Denny 2021 — T2 (URL at PO-09); Dawe et al. 2021 — T2 (URL at PO-10); NRC 2001 §6 — T1 (URL at PO-16)
- Class: ENGINEERING CONSTRAINT
- Scope: every delivered design; every element of the prediction set PP-25 names
- Confidence: High
- Grid translation: prediction row = `{id, predicted: <value+unit>, basis: <EV/VT/HO/SV code>, boundary: <tiles|net|use-m²> (PO-09), instrument: <survey-box|meter|count|observation|work-order>, population: <guest|resident|staff|operator>, measured@month, recipe: <how>, falsifier: <value at which the design is wrong>}`. The register ships with the design (VA-23's reproducibility requirement extended across the handover boundary), and `recipe: none` forces the claim out of the register and into the assumption log (UN-07).
- Exceptions / failure mode: writing predictions exposes the designer to being wrong in writing, which is the point and the reason it is skipped. Over-prediction bloats the register; keep the rows that a POE instrument can actually reach. Failure symptom: a handover pack full of performance promises with no measurement attached to any of them.

### PO-18 Convert through four named steps; a measurement that skips the transfer test is not a rule
- Rule: `measurement → finding → transfer test → rule`. (1) The measurement is a number with its PO-06/PO-07 apparatus. (2) The finding is the number interpreted against a comparator of the same type (PO-11). (3) The transfer test asks whether the target building shares the conditions the finding depends on: population, dwell time, climate, ownership/control, operating model, measurement boundary. (4) Only then does a rule exist, and its `Scope` is written no wider than the conditions that survived the test.
- Evidence: This is the corpus's own entry condition for evidence, made operational for in-use data: SKILL.md's Evidence Rules require `Evidence → Principle → Rule → Agent behavior` with the evidence named or the claim marked `UNCITED — heuristic`, UN-13 forbids laundering a low tier into a rule, UN-10 requires confidence stated as a rung plus its basis, and DM-21 requires evidence where evidence exists and a statement where it does not. The failure modes this pipeline catches are all documented above: the CBE archive's own type skew (PO-11), the hotel panel's missing response metrics (PO-05), the radiant study's significant-but-tiny effect (PO-10), and SR-4's advocacy cap on project-reported outcomes. The transfer test is the step the corpus has never spelled out for POE data, and it is the step at which an office satisfaction band would otherwise become a hotel target.
- Source: SKILL.md §Evidence Rules; UN-10, UN-13, DM-21, SR-4 in-repo; CBE lessons-learned and Dawe et al. as above — T2
- Class: DESIGN PRINCIPLE
- Scope: every rule, band, threshold or coefficient in this corpus that is sourced from an occupied building
- Confidence: High
- Grid translation: the `Scope` line of a POE-sourced rule is constrained by the test: `Scope: <type> in <climate> with <control regime>, sourced from <n> respondents in <benchmark-type>`. If any condition differs from the target, the rule may not be widened — it becomes an assumption row with a falsifier (UN-07). Every POE-sourced rule carries `transfer-tested: yes|declared-narrow|no (assumption)`.
- Exceptions / failure mode: the test can be used to reject all evidence ("every building is different"), which is why a `no` must route to a named cheaper alternative: measure your own population (PO-26) or state the default as a heuristic with an expiry. Failure symptom: a "hotel comfort band" whose only evidence is 617 office buildings.

### PO-19 Every POE-derived rule carries a provenance stamp, an owner and an expiry; a rule without them is prose
- Rule: A rule sourced from in-use evidence publishes its dataset fingerprint — building type, count of buildings, count of respondents, instrument and box definition, jurisdiction/climate, year of collection, tier — plus a named owner and a re-check trigger. This is UN-12's citation tiering and UN-08's assumption attributes applied to the *measured* side, where drift is faster than on the code side.
- Evidence: The CBE paper shows why expiry is structural rather than tidy: twenty years of collection left "partial responses and slight changes in questions", and the scale *direction* itself is being reversed (PO-06) — a rule anchored to that archive without a vintage stamp silently changes meaning when the archive changes. The Irish EPC and radiant studies are both 2021 and both pre-date the current HVAC and remote-work mix. NRC's own institutional mechanism (POE feeding a named design guide, PO-16) works because the guide records which study changed which clause. In-repo: UN-08 gives every assumption an owner and a revisit trigger; UN-12 stamps every citation with its tier and, for code, jurisdiction + edition + anchor.
- Source: CBE lessons-learned — T2 (URL at PO-04); Coyne & Denny — T2 (URL at PO-09); Dawe et al. — T2 (URL at PO-10); NRC 2001 §6 — T1 (URL at PO-16); UN-08, UN-12 in-repo
- Class: ENGINEERING CONSTRAINT
- Scope: all POE-sourced rules, bands, coefficients and design-guide lines
- Confidence: High
- Grid translation: `provenance: {buildings:n, respondents:n, type, climate, instrument, box, collection-window:[from,to], tier, source-url, opened:YYYY-MM-DD}`, `owner`, `expiry` or `recheck-trigger` (e.g. "on the first POE of a hospitality building", "when the benchmark archive releases a hotel category"). A rule whose stamp is older than ~10 years prints a `vintage` flag; the year of *collection* is not the year of *publication*.
- Exceptions / failure mode: provenance fields make rules verbose and tempt a file to drop them; the corpus's own audit found the shortcut already taken (uncited figures under `Confidence: High`, audit/README.md §1). Failure symptom: a "thermal satisfaction target ≥ 80 %" with no idea which archive, decade or population it came from.

### PO-20 Supersede explicitly; a measured value never silently replaces a heuristic, and the old number stays in the record
- Rule: When in-use measurement contradicts a corpus heuristic, the change is recorded as a supersession: the new value, the evidence, the ID and line it replaces, the arithmetic that produced it, and the old value kept as the record of the prior assumption. This is how the corpus already resolved its own quantitative-layer conflicts (coverage-map §4 item 1, where a computed drain budget superseded a placeholder and the older figure survived only as a documented prior), and it is the POE-side version of it.
- Evidence: `coverage-map.md` §4 item 1 records exactly this pattern adjudicated in favour of arithmetic with a supersession note left in the superseded rule; UN-13 forbids laundering a weak tier into a rule, which is the same prohibition pointed at the input side; EV-03 requires that changing a metric be a harness version change with both results kept, never an edit. The measured cases here are live candidates: PO-12's control finding against any heuristic that assumed system class drives comfort; PO-13's acoustic-below-thermal ordering against the "noise is complaint #1" folklore PP-16 already had to qualify.
- Source: `coverage-map.md` §4 (conflict register), UN-13, EV-03 in-repo; Dawe et al. 2021 — T2 (URL at PO-10)
- Class: DESIGN PRINCIPLE
- Scope: every edit to an existing rule, band or coefficient sourced from in-use data
- Confidence: High
- Grid translation: a supersession writes three lines at the site of change: `supersedes: <ID@value>`, `by: <measured value + provenance stamp (PO-19)>`, `prior-basis: <why the old number existed>`, and a row in that file's conflict register with `ADJUDICATED | OPEN`. An `OPEN` conflict keeps both readings and forbids either from being averaged (the corpus's standing rule against averaging conflicts).
- Exceptions / failure mode: silent replacement destroys the audit trail and lets the same argument recur a year later; over-eager supersession replaces one unfounded number with another when the new measurement is single-case — PO-18's transfer test gates the change before PO-20 records it. Failure symptom: two files quoting different comfort thresholds where neither can say which measurement moved the value.

### PO-21 Pool only across comparable conventions, weight by sample, and cap single-case evidence
- Rule: Cross-case synthesis has three prohibitions: never average percentages computed under different box definitions or boundaries; never treat a count of citations as a count of origins; never let a single building set a band. Pool as a weighted mean over `n` within one convention, publish the between-building spread beside the mean, and label anything from one case `n=1 building`.
- Evidence: The CBE archive is the cautionary example for pooling across years and instruments: "partial responses and slight changes in questions" across two decades, factor scores built as "weighted averages across multiple items" (a different object from a satisfaction percentage), and rare typologies excluded outright. The corpus already owns the origin-count discipline: SKILL.md's Evidence Rules require that convergence count "sources you opened, not files that repeat a claim", and audit/README.md §1 quantified how badly that was being got wrong (20 of 37 SR rows were convergence-inflated). The per-building spread that pooling hides is documented in PO-13's ranges: within-type variation across the case buildings (thermal satisfaction in the 60s–96 %) is larger than the between-type difference the same study tested (PO-10's ρ = 0.14).
- Source: CBE lessons-learned — T2 (URL at PO-04); Dawe et al. — T2 (URL at PO-10); SKILL.md §Evidence Rules, `audit/README.md` §1 and §7, UN-10 in-repo
- Class: FACT
- Scope: every multi-source figure in this corpus
- Confidence: High
- Grid translation: a pooled line reads `mean X % (weighted over n respondents; K buildings; range a–b %; convention: box 5-7; sources opened: K)`; a single-case line reads `n=1 building (<type>, <year>)` with `Confidence` capped at Medium and the rule's `Class` barred from `STANDARD`. Count origins, not citations, in the `Evidence` line.
- Exceptions / failure mode: sometimes the single case is the only evidence for the type — then the honest move is a heuristic with a falsifier (PO-18's exception) rather than a demotion to silence; there is no hospitality benchmark of any size (PO-11). Failure symptom: "studies show 61 % thermal satisfaction is typical", where the studies are one paper's one building, cited by four files.

### PO-22 Predicted-versus-measured is a distribution with a sign that flips by segment; a flat correction factor is malpractice
- Rule: The performance gap is not one percentage. Report it as a distribution: median and mean, the tails, and — the part everyone drops — the *direction* per segment. Where measured exceeds predicted for the best-performing cohort and falls short for the worst, a single calibration multiplier makes both worse while the headline improves.
- Evidence: The Irish study of 9,923 dwellings compared whole-home measured consumption (natural gas plus electricity, from verified utility billing) against the theoretical EPC rating: "average deficit in annual consumption is 2279 kWh" (−17 %) and "median deficit of 1235 kWh/year (10.83 %)" — so measured ran *below* the certificate on average — yet the sign flips across the stock: the "least energy efficient dwellings feature an average difference ranging from −15 to −56 %" while "energy efficient houses display higher-than-theoretical energy use, with average surpluses ranging from 39 to 54 %". The study also reports that measured demand barely separated the efficiency bands: "only a difference of 457 kWh/year between the lowest and highest average", and concludes as a warning: "Results sound a note of caution for policymakers that rely on a theoretical EPC to deliver real energy savings." The corpus's own persistence evidence points the same way — benefits drift after measurement stops (PP-25's cited 81 % persistence, with one campus retaining "89 % of the electric savings and 0 % of the natural gas savings") — cited, not restated.
- Source: Coyne & Denny 2021 — T2, https://pmc.ncbi.nlm.nih.gov/articles/PMC8550629/ ; PP-25 in-repo for the persistence figures
- Class: FACT
- Scope: every energy, water, throughput or labour prediction; every SV-*/EQ-*/HO-* figure claimed as a saving
- Confidence: High on the shape of the finding (n = 9,923, metered); Medium on transfer to non-residential and to a hotel — residential EPC gaps are not a hotel operating gap, and the transfer test (PO-18) must be run before this is quoted at a design decision
- Grid translation: publish `predicted | measured | delta | delta-distribution | sign-by-segment` per prediction row (PO-17), never `predicted | measured | correction`. Where a correction is applied, it is applied per segment or not at all, and the file records that the residual is now unverified for the segments left out. A calibration change triggers EV-29's drift detector if the harness produced the prediction.
- Exceptions / failure mode: weather, occupancy and use-mix confound every cross-sectional gap (PO-09's baseline rule), and billing data answers for occupant behaviour as though it were design. In this project the equivalent trap is attributing a sim's measured load to the plan when it is the agent policy. Failure symptom: an "energy performance gap of 17 %" quoted at a client with no sign, no spread and no segment split.

### PO-23 Re-derive every inherited in-use constant, and reconcile it against the corpus's own measured speeds before it drives geometry
- Rule: A rule of thumb that expresses a rate (area per hour, m² per person-min, trips per shift) embeds a walking speed, a work content and a utilisation assumption. Before such a constant sizes anything, decompose it into its factors, check each against a measured source, and reconcile the result against the speeds and quotas this corpus already carries. A constant is quarantined — not quietly adopted, not quietly deleted — when it is out of family with the measured band **or** when its units cannot mean what the rule that uses it claims.
- Evidence: Worked decomposition, using the figure circulating in this project as the test case: a hospitality planning heuristic of about **18 m²/h of cleaned floor per attendant**, quoted as a *walking* budget. Read that way it fails four arithmetic checks. (a) Band width implied: at a travel-only budget, 18 m²/h divided by any plausible walking distance per hour is nonsense — 18 m²/h over a 1.6 m circulation band is 11.25 m/h = **3.1 mm/s**, and the pairing usually offered with it ("30 m/min") is 1,800 m/h, which implies a **10 mm** band. (b) Rooms per hour: a ~20 m² room plus a ~12 m² corridor share is ~32 m² of floor per room, so 18 m²/h is **0.56 rooms/h of travel alone = ~107 min/room**, against HO-10's whole-task allowance of 12–18 rooms per attendant per shift (**≈27–40 min/room** for everything). (c) Speed: 30 m/min = **0.5 m/s**, i.e. *half* the measured 1.07 m/s HB-03 reports in 1.5 m corridors and below the IMO free-flow ceiling of 1.2 m/s — conservative as a pace, but a pace is not an area rate. (d) Therefore the figure cannot be a travel budget at all: it is an all-in labour productivity number (cleaning minutes plus travel inside one quota), and using it to size corridors is a category error, not a calibration problem. Neither arithmetic error found in the version of this premise this file was commissioned with is repeated here: the division 18 m²/h ÷ 30 m/min yields a **band width (0.01 m)**, not a walking speed, and 30 m/min is **0.5 m/s**, not 1.35 m/s. Second finding from the same check: **the file this constant was attributed to does not exist** — `src/engine/` contains only `npc/` (`config.ts, distance.ts, index.ts, keys.ts, layoutBuild.ts, npcEngine.ts, pathfinding.ts, policy.ts, queueBuild.ts, rooms.ts`) and no `hotelSim.ts` appears anywhere in the tree, so there is no host-code basis in the current build. Both readings are recorded; neither is averaged.
- Source: HB-03, HO-09/HO-10/HO-14, OM-28 in-repo; host tree inspected this pass (`ls src/engine`) — T1 code-derived for the absence claim; the 18 m²/h heuristic itself — **NEEDS VERIFICATION**: no reachable primary (the standard's task-time table could not be opened), and the repository source cited for it is absent
- Class: DESIGN PRINCIPLE
- Scope: every inherited rate that converts into corridor width, keys per floor, catchment radius or cart bay
- Confidence: High on the procedure and on the negative result; the constant under test stays `HEURISTIC` and is recorded as rejected-for-this-use, never as a validated value
- Grid translation: rate constants are stored decomposed, never as one number: `{m2_per_room_cleaned, corridor_band_width_m, rooms_per_hour, implied_speed_m/s, implied_band_width_m, speed_source}`; the row is flagged `out-of-family` when `implied_speed_m/s` exceeds HB-03's free-flow band, and `unit-error` when `implied_band_width_m` or `rooms_per_hour` contradicts HO-10's whole-task allowance; either flag bars the constant from sizing geometry until reconciled. Re-check trigger: the first measured housekeeping time study on a project floor (PO-15).
- Exceptions / failure mode: an out-of-family constant may still be *directionally* right because its m² base is not the m² assumed here — which is why the fix is decomposition, not deletion. Quarantining without replacement leaves the plan with no budget at all, so the replacement is an explicit assumption row (UN-07) with the falsifier named. Failure symptom: a corridor widened to satisfy a walking heuristic that implies a faster walk than any measured crowd.

### PO-24 Run the in-use route audit as the field twin of the simulated trip, and diff them by route class
- Rule: Simulated circulation (VA-15) predicts a path; only observation establishes the one taken. The instrument is a route audit — counts at defined links over matched windows, door-direction and shortcut observation, and wear or access-control evidence — diffed against the simulated optimum **per route class** (arrival, egress, service, guest, staff), with the grid's own distance proxy corrected for before any deviation is claimed.
- Evidence: VA-15 already defines simulated trips, the detour ratio and the pinch heat over a declared OD set, and PP-13 sets the desire-line screen at a *tuneable* factor "inside the 1.1–1.3 band", explicitly disowning the widely quoted 20–30 % figure as news-sourced; the deviation ratio is therefore an open parameter that only field counts can settle. The measurement side has a real bias to correct first: on this grid, path length is octile distance (`src/engine/npc/distance.ts:1-4`) and GT-14 records that in a 2-tile corridor diagonals are usually blocked, so a route costs `dx+dz` — up to 1.41× more tile-steps per metre than the same dimension of open hall. A deviation computed from uncorrected tile-steps will report a detour that is a proxy artefact. The observation instrument itself is cheap and documented: in-situ behaviour observation and structured walk-throughs (NRC §4, PO-08).
- Source: VA-15, PP-13, GT-14, AG-09 in-repo; NRC 2001 §4 — T1 (URL at PO-03); host code `src/engine/npc/distance.ts:1-4` — T1 code-derived
- Class: STANDARD
- Scope: every type with repeated routes: hotel, hospital, retail, school, transit, industrial
- Confidence: High on the method; Medium on any threshold derived from it (no measured detour distribution was retrievable this pass) — **NEEDS VERIFICATION**: PP-13's 20–30 % claim is still unanchored, and this file does not replace it with another unanchored number
- Grid translation: `route-class → simulated_steps → measured_steps → ratio`, with `measured_steps` from counts on identified door/link tiles over matched time windows and `simulated_steps` corrected by GT-14's width-dependent factor. Report the distribution, not the mean (EV-02's shape applied in use); flag any link where `measured >> simulated` as repurposed circulation (PP-25's diagnostic), and any where `measured << simulated` as an oracle defect before criticising the plan.
- Exceptions / failure mode: access control, cleaning rosters and reception routines override geometry, so a deviation may be an operating decision rather than a design failure — record `control-adjusted: yes|no` (PO-09's confounder rule). Observers also change behaviour; two independent counts on different days are the minimum. Failure symptom: a corridor "rejected by users" that was in fact closed by a fire door hold-open the sim never modelled.

### PO-25 Spatialise every complaint and work order; an unlocatable complaint cannot be attributed to a plan
- Rule: Convert the complaint channel into a mapped signal: category, location (room/zone, and on this grid a plan coordinate), timestamp, resolution, and whether it recurred at the same location. Recurrence by location is the design signal; volume is the operating signal. A POE that reports counts without locations can never distinguish a plan defect from a shift defect.
- Evidence: This is the corpus's own diagnostic asymmetry, made measurable: PP-25 quotes the operator-side statement that when back-of-house is squeezed "no guest ever complains about any of it directly. They just experience a hotel that always seems slightly behind… and the reviews say 'service' while the cause sits in the floor plan" — attribution failure is the norm precisely because the complaint channel carries no spatial field. The CBE instrument does capture a reason field per dissatisfied respondent (open-ended reasons branching from the dissatisfaction box, as in the radiant study's named thermal causes, PO-12), which is the reason-side half of the datum; the location-side half is what most programmes omit. NRC §4's instrument list (walk-throughs, photographs, in-situ observation) supplies the cheap way to localize what the survey cannot.
- Source: PP-25, FL-01…FL-28 (the failure taxonomy a located complaint maps onto) in-repo; CBE lessons-learned and Dawe et al. — T2 (URLs at PO-04/PO-10); NRC 2001 §4 — T1 (URL at PO-03)
- Class: DESIGN PRINCIPLE
- Scope: all facility types with a complaint or work-order channel; hospitality and healthcare especially
- Confidence: High on the requirement; Medium on any volume figure (no complaint-rate dataset was retrievable — PP-16 notes the best candidate dataset returned 403 and was never read)
- Grid translation: map each complaint to `floor + room-tag` or, where the complaint has no room (corridor, lift lobby, car park), to a **16-tile (8 m × 8 m = 16 m²) reporting cell** — chosen so it is coarse enough to protect an individual respondent and fine enough to separate two corridors. Emit `complaint_hotspot = cell × category × n≥3 occurrences`, then raise the matching FL-* pattern as a hypothesis with its witness (VA-08). Single occurrences are noise and print as counts only.
- Exceptions / failure mode: spatial tagging of complaints is a privacy act as well as an analysis act (PO-27), and a location field invites the reader to blame the occupant of that zone. A hotspot may equally reveal a maintenance failure at one unit — so the row records the resolution class (`design | commissioning | maintenance | behaviour | unresolved`) before any design inference (PP-25's own exception). Failure symptom: "17 noise complaints" with no floor, no cell, no cause, and a plan change ordered anyway.

### PO-26 Publish what the grid cannot inherit, and route it to the host that can measure it
- Rule: In-use evidence arrives as time series, occupant identities and environmental states; the grid holds none of the three. Every POE finding is therefore split at intake: quantities that become plan parameters or tile-countable predicates are adopted; the rest is exported with a named destination (the operational sim host, the FM record, the assumption register) and a stated reason. The corpus's capability-manifest discipline (VA-10) and its unrepresentability rule (UN-05) govern; this rule supplies the in-use split list.
- Evidence: UN-05 already distinguishes "unknown" from "not-representable" and demands the difference be stated; VA-10 makes "cannot check" a property of the suite rather than of the plan; GT-26 ships a limitations register with every translated design; and EV-14's daylight rule is the precedent for the mechanism (a published performance metric that the grid can only carry as a declared geometric proxy). HB-03 supplies the concrete case for the temporal half: above ≈0.5 persons/m² walking speed stops being a property of the person and becomes a property of the crowd, which is exactly why a measured crowd time series cannot be diffed against a static tile map — the host has no time. This project's own engine has the NPCs and the clock, not the grid validator, so that diff belongs to the sim host.
- Source: UN-05, VA-10, GT-26, EV-14, HB-03 in-repo; host tree inspected this pass — T1 code-derived for what exists
- Class: ENGINEERING CONSTRAINT
- Scope: every POE-derived claim entering a design artefact on this host
- Confidence: High
- Grid translation: inheritable — zone boundaries and control ownership (PO-12), threshold counts and path geometry (AG-11, PP-13, PO-24), catchment radii and carry distances (OM-07, OM-02), reporting cells for complaints (PO-25), service-band and plant adjacency facts (CN-11…CN-20), keys-per-floor and task minutes converted to distance budgets (HO-14, PO-15, PO-23's decomposition). Not inheritable, and must be exported with a destination named — measured time series, per-person trajectories and identities, illuminance and dB values, live flow rates, seasonal variation, and any queue length measured in minutes rather than tiles (VT-01…VT-10's arithmetic stays a design-time instrument; the measured comparison routes to the sim host and is reported as a host-code result, never as a grid verdict).
- Exceptions / failure mode: the temptation is to fake inheritance by averaging a time series into a scalar; EV-14's label ("proxy: geometric, no model") is the required form for anything the grid carries. A second failure is the mirror image: exporting everything so that nothing ever changes the plan. Failure symptom: a "measured crowd density 0.8 p/m²" line pasted into a validation report as though the grid had evaluated it.

### PO-27 Manage the feedback channel's own side effects: expectations, defensiveness, anonymity and the availability of results
- Rule: Asking occupants what they think changes what they expect and what the organisation will admit. A POE programme publishes its data handling (consent basis, minimum cell size for reporting, retention, who may see individual responses), its remediation commitment (what will be fixed versus what is a design finding for the next project), and its decision-maker delivery — and it states plainly what it cannot promise to change.
- Evidence: NRC §6 names both side effects as adoption barriers: "most organizations do not reward exposing shortcomings", and the reason results never reach a decision is availability, not ignorance (PO-16). §4 records the practitioner fear that structured feedback will "raise users' expectations and cause them to expect wide-ranging corrective measures", and the instrument-design failure that follows when the survey is not built to a standard: "Often such questionnaires are overly long and detailed". On the design-side, PP-25 already warns that a satisfied survey from a property whose cart route quietly moved into the guest corridor is a misleading POE — the survey records the accommodation, not the design. RIBA's guidance adds a practical governance note for practitioners taking on this work professionally: firms should "inform the RIBA Insurance Agency of their intention to do so" — an indicator duty, not a design rule, and recorded as such.
- Source: NRC 2001 §4 and §6 — T1 (URLs at PO-03/PO-16); PP-25 in-repo; RIBA POE guidance — T2 (URL at PO-16)
- Class: DESIGN PRINCIPLE
- Scope: every POE programme; every deployment of a survey into an occupied building
- Confidence: High on the documented barriers; Medium on the insurance note (jurisdiction- and institution-specific, UK professional body)
- Grid translation: report a `governance` block per POE: `consent-basis`, `min-report-cell (≥ n respondents, ≥ PO-25's 16-tile cell)`, `retention`, `individual-access`, `commitments: {remediation[], design-findings[]}`, `delivered-to: <roles>`. Complaint hotspots (PO-25) are never reported below the minimum cell size. A design finding is labelled `design` only where the witness in PO-08 supports attribution.
- Exceptions / failure mode: anonymity and specificity pull against each other — a plan-localised complaint about a named floor's night shift is an identification risk (PO-05's scope line and PO-25's cell size are the mitigation). Committing to remediation without capacity is worse than not surveying, because the next response rate collapses. Failure symptom: a POE run once, reported to no one, whose only lasting effect is that staff stopped answering.

### PO-28 An in-use measurement may set a band; it may never be reported as compliance, and null results are reported too
- Rule: Nothing measured in an occupied building proves the design compliant or good. POE output is expressed as a band with its provenance and its unknowns, and the register includes the measurements that returned nothing, the metrics that failed to collect, and the claims this building cannot answer. Where the corpus already has VA-04's wording discipline for code, this rule extends it to in-use performance.
- Evidence: VA-04 forbids "compliant" in favour of "consistent / inconsistent with <source>, jurisdiction X, verification required"; UN-15 extends the same logic to claims generally; UN-20 prefers abstention to emitting a Low-confidence number; DM-21 requires saying where no evidence exists; and EV-30 requires annotating every metric that was optimised, which is the Goodhart exposure of any measure a design is tuned against. The measured evidence above shows why the discipline is needed rather than ceremonial: a rating archive with no per-building minimum (PO-07), a scale whose direction changed between releases (PO-06), a significant effect too small to matter (PO-10), and a predicted-versus-measured gap whose sign flips by segment (PO-22) are all one careless sentence away from being reported as proof.
- Source: VA-04, UN-15, UN-20, DM-21, EV-30 in-repo; CBE lessons-learned, Dawe et al., Coyne & Denny — T2 (URLs at PO-04/PO-10/PO-09)
- Class: DESIGN PRINCIPLE
- Scope: every report section that carries in-use data
- Confidence: High
- Grid translation: in-use verdicts are `band-set | band-shifted | no-change | inconclusive (reason) | not-measured (instrument that would)`; the words "compliant", "proven" and "verified in use" are lint failures against a POE-sourced line. The report's `unknowns` row (EV-02) counts POE-derived unknowns alongside design-derived ones, and the null list ships as a named block.
- Exceptions / failure mode: a band is weaker than a verdict and reads as hedging to a client; the honest counter is PO-16's channel — the band changes a decision, the verdict only closes a conversation. Failure symptom: "the POE confirms the design works", where the POE was a thermal survey of one wing at month three.

---

## Instrument × population × question

What may be asked of which instrument, and the claim ceiling that follows. `—` means the pairing does
not support the claim, not that it was considered.

| Instrument | Population | Answers | Rigour class (PO-01) | May set | May NOT set |
|---|---|---|---|---|---|
| Occupant questionnaire (7-pt, boxed) | resident | level of satisfaction per aspect | investigative | comfort band, priority weight | causal attribution |
| Guest panel survey (post-stay) | guest | decision-attribute ranking | investigative | brief weights (PO-14) | performance level, plan verification |
| Structured walk-through / participatory tour | operator + designer | observed defects, workarounds | indicative→investigative | hypothesis, FL-* trigger | any numeric threshold |
| In-situ behaviour observation / route audit | all | taken path vs designed path | investigative | desire-line factor (PO-24) | satisfaction |
| Meters / utility billing / BMS trend | unoccupied + occupied | consumption, uptime, control mode | diagnostic when paired | gap distribution (PO-22) | occupant experience |
| Spot instruments (IAQ, temp, sound) | occupied hours | state at position/time | diagnostic when paired | proxy validation (EV-14) | dB/dBA compliance here (UN-05) |
| Complaint + work-order log (spatialised) | resident + operator | recurrence by location | investigative | hotspot → FL-* hypothesis | design cause without witness (PO-08) |
| Time-and-motion study | staff | task minutes and their drivers | investigative | labour budget inputs (PO-15) | best method, quality |
| Maintenance records / defect register | operator | what fails and how often | investigative | LC-15 regime check | occupant comfort |
| Simulation run (this project's sim host) | synthetic occupants | predicted-vs-observed behaviour | — (not POE) | internal benchmark (PO-26) | in-use evidence (EV-01's classes) |

---

## The conversion record (schema)

Two artefacts make the loop auditable. Both ship as data, not prose (EV-20's "ships as code" principle
applied to the feedback side).

```json
// prediction row (PO-17) — written at handover, closed at measured@month
{
  "id": "pred-014",
  "claim": "service route does not cross the guest arrival path",
  "predicted": { "value": 0, "unit": "crossings/floor-shift", "basis": "PP-01/EV-17" },
  "boundary": "net serviced tiles, per floor",
  "instrument": "observation|work-order|access-control-log",
  "population": "staff",
  "measured_at_month": 6,
  "recipe": "count crossings at 4 defined link tiles, 3 matched windows, 2 days",
  "falsifier": ">=1 crossing on >=2 of 3 windows",
  "status": "open|met|breached|not-measurable (destination: <host>)"
}
```

```json
// evidence-to-rule row (PO-16/PO-18/PO-19) — written when a measurement enters the corpus
{
  "finding": "top thermal dissatisfaction causes are control absence and slow response",
  "provenance": {
    "buildings": 26, "respondents": 1645, "comparator_buildings": 34,
    "comparator_respondents": 2247, "type": "office (Class A, North America)",
    "climate": "not stated in the pooled comparison",
    "instrument": "7-pt (-3..+3), box -1..+3", "collection_window": ["2010","2020"],
    "tier": "T2", "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC8547689/",
    "opened": "2026-09-25"
  },
  "rigour_class": "diagnostic",
  "test": { "p": "<0.001", "effect": "rho 0.14", "decision_relevant": false },
  "transfer_test": {
    "conditions_required": ["individual control ownership", "long dwell", "openable privacy"],
    "target_matches": ["long dwell", "individual control (fan coil, guest setpoint)"],
    "target_differs": ["setpoint reset by housekeeping", "guest population"],
    "result": "declared-narrow"
  },
  "rule_change": { "action": "adds", "id": "PO-12", "supersedes": null },
  "owner": "Domain AP curator",
  "expiry_or_trigger": "first hospitality POE of this type, or archive adds a hotel category",
  "channel": { "destination": "type card: comfort weights + control_zone_share KPI", "accepted_by": "design lead" }
}
```

Harness hooks: a POE-sourced band enters `EV-10`'s catalogue with its `band_source` set to the
provenance object (never `[H]`); a POE-sourced change to a metric is a `harness@vN+1` event under
EV-03; and because the measurement was taken against a design the skill generated, EV-28's ablation and
EV-29's golden suite are what detect whether the feedback improved anything.

---

## Conflict register (new items raised by this file)

| # | Conflict | Status | Disposition |
|---|---|---|---|
| A1 | POE cadence: NRC's quick-response survey at 3 months and full evaluation at 6–12 months (T1) vs BSRIA Soft Landings' contractual review "no sooner than 12 months post-handover … final project review at month 36" (T1/T3) | OPEN (resolved as non-contradiction) | Different objects: a survey instrument versus a contractual project review. Both schedules ship (PO-02); a 3-month figure may never be quoted as an *annual* performance value, and a 12-month review may not be quoted as early feedback |
| A2 | Whether staff/person attributes or task attributes drive cleaning time: JIEM's measured time study reports only task variables significant (T2) vs the industry practice of setting standards per attendant and grading by experience (T3/T4 hospitality guidance) | REPORTED | The measured result outranks the practice for *time standards*; it does not outrank it for training or staffing decisions. `EV-17`/HO-14 minutes may be re-based on task measurement, with the study's single-hotel scope stamped (PO-19) |
| A3 | CBE's reporting conventions in one archive: satisfaction published as boxed percentages (dissatisfied 1–3, neutral 4, satisfied 5–7) and as "weighted averages across multiple items"; and the quoted scale direction (1 = very satisfied) contradicts the quoted box assignment (satisfied = 5–7), with the direction itself slated for reversal (T2) | OPEN (source-internal) | PO-06 requires the scale, direction, box and `n` to travel with every percentage, so a mismatched convention is visible rather than silently compared; PO-20 records a scale-convention change as a supersession event rather than a silent restatement. Where a source's own two statements conflict, both are printed and neither is averaged |
| A4 | This file's walking-budget test case: an inherited 18 m²/h cleaning-area heuristic used as a travel budget, against HB-03's measured 1.07 m/s and the IMO 1.2 m/s free-flow ceiling (T1 standard-derived) and HO-10's whole-task allowance | ADJUDICATED (rejected for this use) | PO-23's decomposition shows the figure is an all-in labour productivity rate, not a travel rate, so it cannot size corridors; it is quarantined rather than deleted, and the reconciliation is recorded. Two related attributions failed: the host file named as its source (`src/engine/hotel/hotelSim.ts`) does not exist in this repository, and the premise's own arithmetic was mislabelled (18 m²/h ÷ 30 m/min is a band width, and 30 m/min is 0.5 m/s) |

---

## Sources

Opened this pass (tiered per UN-12). Nothing here is cited that was not read.

- NRC / Transportation Research Board, *Improving Post-Occupancy Evaluations on Federal Agencies'
  Building Assets: A State-of-the-Practice Summary* (2001) — **T1**: §3 typology, costs and timing
  https://www.nationalacademies.org/read/10288/chapter/3 ; §4 instruments, sampling, biases
  https://www.nationalacademies.org/read/10288/chapter/4 ; §6 barriers, ownership, feed-forward and
  the U.S. Courts Design Guide mechanism https://www.nationalacademies.org/read/10288/chapter/6
- Hischke, Andersen, Cao, Brown, et al., "Lessons learned from 20 years of CBE's occupant surveys",
  *Buildings and Cities* (2021) — **T2**: 93,662 responses / 897 buildings, scale and box conventions,
  database composition, self-selection, exclusions, priming, 39 % temperature dissatisfaction and
  35 % self-reported productivity interference, and the admitted shortfall in converting outputs into
  upgrades, https://journal-buildingscities.org/articles/10.5334/bc.76
- Dawe, Karmann, Schiavon & Bauman, "Field evaluation of thermal and acoustical comfort in eight
  North-American buildings using embedded radiant systems", *PLoS ONE* 16(10):e0258888 (2021),
  doi:10.1371/journal.pone.0258888 — **T2** (CC BY): 7-pt −3…+3 scale and box thresholds, 8 embedded
  buildings / 500+ surveys, 26 radiant (1,645) vs 34 all-air (2,247) pooled comparison,
  p < 0.001 with ρ = 0.14, top thermal causes, sound-privacy conclusion
  https://pmc.ncbi.nlm.nih.gov/articles/PMC8547689/
- Coyne & Denny, "Mind the Energy Performance Gap: testing the accuracy of building Energy Performance
  Certificates in Ireland", *Energy Efficiency* 14(6):57 (2021), doi:10.1007/s12053-021-09960-1 — **T2**:
  n = 9,923 dwellings, measured utility billing versus certificate, mean −2,279 kWh (−17 %), median
  −1,235 kWh (−10.83 %), −15…−56 % for the worst band and +39…+54 % for the best, 457 kWh/yr between
  tier averages, https://pmc.ncbi.nlm.nih.gov/articles/PMC8550629/
- Robbins, Grandner, Knowlden & Severt, "Examining key hotel attributes for guest sleep and overall
  satisfaction", *Tourism and Hospitality Research* 21(2) (2020), doi:10.1177/1467358420961544 — **T2**:
  609 frequent travellers, 26 attributes, 5-point scale, ORs 2.63 / 2.49 / 3.48 / 5.04, HVAC and
  exterior noise in the sleep model, stated limitations
  https://pmc.ncbi.nlm.nih.gov/articles/PMC10130565/
- "Hotel room cleaning: Time study and analysis of influential variables in a Spanish hotel", *Journal
  of Industrial Engineering and Management* 14(3) (2021) — **T2** (abstract read; PDF did not decode):
  stopwatch time study, task variables only significant, five tasks > 2/3 of total cleaning time,
  https://www.jiem.org/index.php/jiem/article/view/3441
- BSRIA, *What stages are involved on a Soft Landings project?* (six-phase framework, Phase 6 "Years 1 -
  3 extended after care and POE", month 12 / 24 / 36 review schedule, metering-and-monitoring strategy
  requirement) — **T1/T3**,
  https://www.bsria.com/uk/consultancy/project-improvement/soft-landings/about-soft-landings/soft-landings-approach/
- RIBA, *Post Occupancy Evaluation Guidance* (POE closes the performance gap; iteration into the next
  building; insurance-notification note) — **T2**, https://www.riba.org/work/business-tools/post-occupancy-evaluation-guidance/
- Federal News Network, "GSA reexamining data that shows no building is meeting minimum occupancy
  target" (June 2026) — **T3/T4**: 0 of 9,700 tracked facilities at the mandated 60 % utilisation,
  boundary-denominator dispute, third-party ~65 % office-space share,
  https://federalnewsnetwork.com/facilities-construction/2026/06/gsa-reexamining-data-that-shows-no-building-is-meeting-minimum-occupy-target/
- In-repo substrates referenced, not restated: EV-01…EV-30 (all measurement-of-design), VA-03/04/08/10/
  15/23, UN-05/07/08/10/12/13/15/20, PP-01/06/13/16/18/24/25/26, FL-01…FL-28 (failure taxonomy),
  LC-15/LC-24, HO-01/09/10/14, OM-02/07/20/28, CN-11…CN-20/26, EN-25, EQ-13/14/26/27, VT-01…VT-10,
  AG-11, GT-14/26, SP-06/24, RP-08/23, SR-4, FP-19, DM-17/21, HB-03, `coverage-map.md` §4 and §6,
  `audit/README.md` §1 and §7, host code `src/engine/npc/distance.ts:1-4` and the `src/engine/` tree
  listing.
- Located but **not opened** this pass, so no number rests on them: Preiser, Ransom & Gill, *Assessing
  Building Performance Evaluation* (E & FN Spon, 2005) — the intended primary for PO-03's aspect
  taxonomy; Preiser & Vischer, *Assessing Building Performance* (POE method underpinning
  `failure-patterns.md`'s source list); PNNL-19369, *Post Occupancy Evaluation of 22 GSA Buildings*
  (2.7 MB PDF exceeded the fetch limit — the richest single POE-method report found); IPMVP
  *Generally Accepted M&V Principles* and ASHRAE Guideline 14 (PDF returned undecodable — the intended
  primary for PO-09's baseline/adjustment discipline); NHS Scotland Soft Landings guidance (PDF
  streams undecodable); the "noise is the top guest complaint" trade coverage and one
  ResearchGate-hosted guestroom-noise study (not retrieved).

---

## Weak or contested

- **No hospitality benchmark exists anywhere in the opened literature.** The largest archive read
  (897 buildings, 93,662 responses) has categories for offices, schools, labs, clinical care,
  university rooms and student housing, and none for hotels. Every comfort band in this file is
  therefore office-derived, and PO-11/PO-18/PO-21 are load-bearing rather than decorative. This is the
  in-use mirror of `evaluation.md`'s "there is no hospitality benchmark" finding, and it means a
  hotel POE on this project starts a benchmark from zero (PO-26).
- **Per-building satisfaction ranges conflicted between two reading passes of the same tables**
  (thermal 32–96 % vs 64–96 %; acoustic 17–85 % vs 64–85 %). Both readings are recorded; neither is
  averaged; PO-13's Confidence is capped until the tables are re-read with figure numbers. Do not quote
  a range from this file until that is done.
- **The radiant/all-air comparison is a pooled survey analysis, not a controlled trial.** 26 versus 34
  buildings differ in age, tenure, climate, occupancy density and management; the paper's own effect
  size (ρ = 0.14) is what this file relies on, not its causal language.
- **Guest-side evidence is a ranking, and the ranking is one study's.** Robbins et al. (n = 609) is the
  only open-access hospitality instrument read this pass; its ORs are not reproduced anywhere here and
  its authors flag the design's causal limits. PP-26's review analysis (>95,000 reviews) is the only
  independent hotel-side source in the corpus, and it addresses a different question.
- **POE costs are 2001 US federal dollars, per square foot, uninflated and jurisdiction-bound.** Use
  them for relative rigour ordering (indicative ≪ investigative ≪ diagnostic), never as a budget line
  for this project; treat as HEURISTIC (PO-01).
- **The GSA utilisation figures come from a news report of an administrative dataset**, and the
  "≈65 % office space" share is a third-party estimate quoted in it. PO-09 uses them to illustrate a
  denominator failure, which survives even if every number in the piece is wrong; nothing else leans on
  them.
- **IPMVP and ASHRAE Guideline 14 could not be decoded**, so PO-09's baseline/adjustment discipline is
  reconstructed from the metered-versus-certified comparison, the Soft Landings metering requirement
  and NRC's instrument list rather than from a measurement standard. **NEEDS VERIFICATION**: open
  IPMVP Volume 1's option definitions and Guideline 14's sampling intervals before quoting either as
  protocol.
- **No measured complaint-rate or desire-line distribution was retrievable**, so PP-13's 20–30 %
  detour figure stays unanchored and PO-24 supplies a method without a threshold. Refusing to invent a
  replacement number is deliberate (UN-20).
- **The 18 m²/h walking budget used as PO-23's test case has no reachable primary and no host-code
  basis** — the file it is attributed to does not exist in this repository (`src/engine/` contains
  `npc/` only), and the two arithmetic statements supplied with it do not hold (their division yields a
  band width, not a speed; 30 m/min is 0.5 m/s, not 1.35 m/s). What survives is the negative result:
  the figure is an all-in labour rate and cannot size circulation. The reconciliation procedure, not the
  number, is the deliverable (PO-23).
- **Quotation fidelity**: every quote here is from a page opened this pass, but the reading pass that
  captured them renders some source text as indirect speech. Two statements therefore sit in the
  paraphrase class and are deliberately left un-quoted — the CBE self-selection/non-response statement
  (PO-05) and the GSA boundary description (PO-09). The NRC report's Preiser quotations are second-hand
  for the 2005 book itself, which was not opened (PO-03). Re-read any of these verbatim before quoting
  them outside this file.
- **SR-4 and RP-08/RP-23 cap project-reported outcomes; this file does not lift those caps** by citing
  the same figures with a fancier name. Nothing in the rules above rests on a promotional project
  number, and PO-19's stamp exists to make that checkable.

---

## Type-specificity audit

Type-independent (the method, the statistics, the conversion discipline): PO-01, PO-02, PO-03, PO-05,
PO-06, PO-07, PO-08, PO-09, PO-10, PO-16, PO-17, PO-18, PO-19, PO-20, PO-21, PO-22 (method half),
PO-23 (procedure half), PO-24, PO-25, PO-27, PO-28. These read the same for a hotel, a ward or a
school; the instrument is the same object.

Type-parameterised (same rule, different values — bind through the type card, VA-21): dwell time and
therefore the feasible instrument (PO-04: 8-hour office dwell versus a 2-night guest stay); the
acceptable `min-report-cell` (PO-25's 16-tile cell is a starting value, and a 300-key hotel floor has
far fewer respondents per cell than a 4,000-person office); the control-ownership predicate (PO-12:
guest room versus open-plan desk); the route classes in the audit (PO-24: guest/staff/service/care);
task decomposition in the time study (PO-15); measurement cadence versus renovation cycle (PO-02).

Type-created claims: guest decision-attribute ranking (PO-14 — hospitality only, no office analogue);
staff-side task measurement in a live 24-hour operation (PO-15); the "reviews say service, the cause
sits in the floor plan" attribution problem (PO-25, PP-25) which is sharpest in hospitality; the
housekeeping setpoint-reset countermand of PO-12's control gain; healthcare's care-adjacency complaints
and education's classroom-occupancy complaints, both of which need the same instruments but with a
different population frame (PO-04) and, in healthcare, a consent regime this file does not model
(PO-27 routes it out).

Never-transfer claims: office satisfaction bands → hotel or ward targets (PO-11/PO-18);
office-derived complaint shares (PP-16) → guest complaints (different respondent, different dwell,
different instrument); residential predicted-versus-measured gap magnitudes → non-residential
(PO-22's own transfer test); the 897-building archive's thermal-dissatisfaction level → any cellular
building type; the 2001 federal POE cost bands → any current project budget.
