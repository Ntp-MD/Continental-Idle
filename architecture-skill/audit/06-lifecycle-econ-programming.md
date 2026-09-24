# Audit 06 — adversarial source verification: lifecycle / economics / space-programming

Method: claim list extracted verbatim from the three research files; each claim judged against the
source **as cited** (only the page actually opened counts). Budget: 14 retrieval calls.
Status vocabulary: SUPPORTED | PARTIALLY SUPPORTED | INFERRED | UNSUPPORTED | CONTRADICTED | UNVERIFIED.
Action vocabulary: KEEP | QUALIFY | REPLACE | REMOVE.

Files under audit (read-only): `architecture-skill/research/lifecycle.md`, `architecture-skill/research/economics.md`,
`architecture-skill/research/space-programming.md`.

Arithmetic note used throughout: 1 tile = 0.5 m, 1 tile = 0.25 m², 4 tiles = 1 m²; room usable = `(W-2)(H-2)`;
wall ring = `2W+2H-4`.

---

## Part A — internal / arithmetic findings (no web needed; settled at extraction)

| ID | Item | Check | Verdict |
|---|---|---|---|
| A1 | EC-09 "long-span steel is 24 % over the short-span frame rate" | 244/177 = +37.8 %; 281/173 = +62 %; 177 vs 173 = +2 % | **CONTRADICTED** by the file's own printed figures — no pair yields 24 %. ACTION: REPLACE (recompute or delete) |
| A2 | SP-21 worked example "Twelve 10×8 guest rooms (64 usable tiles = 16 m² each)" | 10×8 outer → usable (8)(6) = **48 tiles = 12 m²** | **CONTRADICTED** — mis-applies the file's own `(W-2)(H-2)` rule (footprint 960 tiles is right; area is not). ACTION: REPLACE |
| A3 | SP-21 "Six 14×11 rooms (120 usable ≈ 30 m²)" | 14×11 → usable (12)(9) = **108 tiles = 27 m²** | **CONTRADICTED**. ACTION: REPLACE |
| A4 | SP-19 "a 4 m² bathroom … is 8×6 … i.e. 12 usable tiles for a 16-tile need" | 8×6 outer → usable 6×4 = **24 tiles (6 m²)** | **CONTRADICTED** (number invented, understates by half). ACTION: REPLACE |
| A5 | SP-19 footprint table vs SP-15 min dimension (≥6 tiles habitable, ≥4 service) | 24 t → 10×5 gives usable 8×3 (1.5 m); 32 t → 8×7 gives usable 6×5 (2.5 m); 8×6 gives 24 t not 32 | **PARTIALLY SUPPORTED / internally inconsistent**: several small-room footprints violate the file's own aspect/min-dimension minima. ACTION: QUALIFY (add the usable-dimension column, fix rows) |
| A6 | SP-14 wall-tax table (60 % / 33 % / 22 % / 11 %) | 18/30, 40/120, 66/300, 136/1200 | **SUPPORTED** (arithmetic exact) |
| A7 | EC-03 "0.5 m grid wall is 2.5–5× a real partition" | 0.5/0.20 = 2.5; 0.5/0.10 = 5 | **SUPPORTED** (arithmetic) |
| A8 | EC-08 façade-index examples 0.20 / 0.10 / 0.065 / 0.042; `P²/A` square = 16 | 2(20+20)/400 = 0.20; 2(40+40)/1600 = 0.10; 2(80+50)/4000 = 0.065; 2(120+80)/9600 = 0.042; 80²/400 = 16 | **SUPPORTED** |
| A9 | EC-14 "health care ≈ 2.2× office energy intensity" | 144.5/65.6 = 2.20 | **SUPPORTED** *as arithmetic*; the two inputs still need source confirmation (see EC-14 below) |
| A10 | LC-05 plumbing-radius arithmetic | 1:80 → 6.25 mm/tile; 150 mm → 24 tiles = 12 m; 1:40 → 12 tiles = 6 m | **SUPPORTED** (arithmetic); the fall ratios themselves are T4-quoting-T1 (see LC-05) |
| A11 | LC-04 grid translation (≤14 / ≤28 / ≤27 tiles) vs claimed metres | 7 m / 14 m / 13.5 m | **SUPPORTED** as unit conversion; the *values* are single-sourced practice (see LC-04) |
| A12 | EC-09 "frame ≈ 9 %" of total | 8.9 % / 7.9 % / 9.9 % / 11.0 % across the four cases | **PARTIALLY SUPPORTED** — only one case is 9 %; range 8–11 %. ACTION: QUALIFY |
| A13 | SP-06 "13 m² gross vs net gap is 1.5–3 m² ≈ one host wall ring" | 4×5 m gross → 3.8×4.8 net = 18.2 (gap 1.8 m²) | **SUPPORTED** (plausible arithmetic) |
| A14 | Tier hygiene, economics file: EC-02 classed **CODE REQUIREMENT** while its only evidence is a surveying blog | file's own Weak-or-contested item 5 admits it | **SOURCE–CLAIM MISMATCH / tier inflation** — ACTION: QUALIFY class to STANDARD-with-caveat or downgrade |
| A15 | Register row 6 (economics, circulation "hotel/residential target 10–20 % (design call)") | no source at all; presented in a "Documented ranges / anchors" column | **UNSUPPORTED**; column header "documented" is misleading. ACTION: QUALIFY (rename column value `design call`) |
| A16 | EC-04 asserts MDPI 2024 study "reports an inverse correlation between height and spatial efficiency" as a 35-building comparative study; EC-07/EC-21 cite "35-building" vs "30 buildings" nowhere — check counts | cross-file: EC-04 says "A comparative skyscraper study", EC-06 "35-building", EC-21 says function/structure not significant (that is the *other* study) | **PARTIALLY SUPPORTED** — attribute each finding to the correct one of the two papers. ACTION: QUALIFY |
| A17 | space-programming file's honesty claim "Nothing has been attributed to a document it was not read in" | register rows are labelled `UNCITED — heuristic`; SP-03/09/11/17/20 mark documents "located, not retrieved" | **SUPPORTED** — but SP-05/SP-22/SP-24 rest on one quoted 15 % figure ("read") → must be confirmed against the live BB103 note (see SP-05) |

## Part B — claims pending external verification

### lifecycle.md

LC-01 (a) CLAIM: IgCC/DoD Green Construction Code §1001.3.2.3 makes a Service Life Plan a submission requirement with fields "Building assembly description. Materials or products. Design or estimated service life in years. Maintenance frequency. Maintenance access", structural/envelope/hardscape. SOURCE: up.codes/s/service-life-plan — T1.
STATUS: pending | ACTION: pending | Closes if: the code text on that page lists those fields.
- LC-01 (b) CLAIM: EN 1990 design working life = 10 y temporary / 10–25 y replaceable structural parts / 15–30 y agricultural / 50 y buildings / 100 y monumental; UK NA modifies cats 2, 3, 5. SOURCE: concrete.org.uk fingertips/design-working-life — T3 summary of T1.
STATUS: pending | ACTION: pending

LC-02 CLAIM: IgCC pairs service life with maintenance access; EN 1990 separates replaceable parts from the 50-y frame; "long life, loose fit" (Alex Gordon 1972) defined as flexible grids, generous heights, accessible services, no fixed internal walls. SOURCES: up.codes, concrete.org.uk, lds-uk.com (T3, not budgeted).
STATUS: pending (third source UNVERIFIED — architectural-practice blog, single source for the Gordon attribution/date) | ACTION: pending

LC-03 / LC-08 / LC-09 / LC-19 / LC-23 CLAIM SET: steelconstruction.info office guidance — "floor plate … to around 13.5 m" for natural ventilation, cores centrally located; grids 6×9 m and 7.5×12 m; "all internal walls to be relocated"; flexibility to "maximise the economic life of the building"; occupation density 1 person per 10–15 m². SOURCE: T3 supplier-adjacent.
STATUS: pending | ACTION: pending | Note already flagged in file's Weak-or-contested as vendor-adjacent.

LC-04 / LC-08 / LC-09 / LC-19 CLAIM SET (Chapman Taylor): problems above "a single-aspect floor depth of over 7m, or double-aspect of over 14m"; "free height of at least 2.7m"; residential modules "2-2.5m to … 4-4.5m"; back-of-house "may constitute up to 20%"; slab removal/demolition sometimes necessary. SOURCE: chapmantaylor.com — T3 practitioner.
STATUS: pending | ACTION: pending | Single-sourced: no corroborating measured study; must remain screening values, never thresholds.

LC-04 / LC-07 / LC-08 / LC-17 / LC-21 CLAIM: GPDO 2015 Sch.2 Pt 3 Class MA — change of use to dwellings subject to prior approval on "adequate natural light in all habitable rooms"; two-year qualifying use; not listed; inserted by SI 2021/428. SOURCE: legislation.gov.uk (T1).
STATUS: pending | ACTION: pending | Currency watch: Class MA was later amended (2024-ish changes to prior-approval conditions/conditions) — check the version rendered.

LC-05 CLAIM: AD H drainage falls — 100 mm WC branch min 1:80, recommended 1:40; 150 mm min 1:150; 75 mm "not permitted" for WC. SOURCE: rospower.co.uk (T4 quoting T1) — not budgeted.
STATUS: UNVERIFIED (tier as declared: T4 quoting T1) | ACTION: QUALIFY (cite Approved Document H directly)

LC-06 CLAIM: EN 1991-1-1 imposed loads domestic 1.5 / office 2.0 / assembly 3.5–5.0 / storage 5.0–7.5 / warehouse 15.0 kN/m²; 1.0 kN/m² movable-partition allowance. SOURCE: structville.com (T4 reproduction).
STATUS: UNVERIFIED (file itself flags the office-value discrepancy 2.0 vs 2.5) | ACTION: QUALIFY — the *ordering* is what the rule uses; do not quote values.

LC-07 / LC-10 / LC-11 CLAIM: Shahi et al. 2020 (Sustainable Cities and Society, PMC7326450) — adaptive reuse/conversion distinguished "by a change in a building's function or use"; refurbishment improves the "existing use". SOURCE: T2 PMC.
STATUS: UNVERIFIED this pass | ACTION: pending — low risk (definitional claim from a real journal family; PMC id needs one check)

LC-11 CLAIM: Huuhka, Moisio, Salmio, Köliö & Lahdensivu, *Buildings & Cities* 4 (2023), DOI 10.5334/bc.309 — renovation "is more climate-friendly than a new building"; replacement only clears at payback "circa 10 years"; "decades-long payback times … are not helpful"; frame "neutrally".
STATUS: pending | ACTION: pending | Note DOI/volume/year must match; author list is 5 names, file's in-text short form "Huuhka et al." is fine.

LC-11 / LC-19 CLAIM: LMN Architects (T3) — "structure holds most" embodied carbon; reuse "much lower total carbon"; **86 % of US commercial stock under 25,000 sf**. The magnitude claim the file admits is unsourced.
STATUS: UNVERIFIED (not budgeted) | Verdict on the *rule*: the retain-first direction is fine as a test (LC-11 already forbids percentage claims); the 86 % figure in LC-19 is a consultancy-reporting-a-dataset number presented without year/definition of "commercial stock" → ACTION: QUALIFY or REMOVE from LC-19's evidence; it carries no weight in the grid translation.

LC-11 / LC-12 CLAIM: London Plan 2021 Policy SI 7 — referable applications must submit a Circular Economy Statement incl. material re-use and "disassembly for future use"; 95 % reuse/recycling/recovery and zero biodegradable or recyclable construction waste to landfill by 2026. SOURCE: planningpolicy.co.uk (T1 reproduced).
STATUS: pending | ACTION: pending | Currency: GLA publishes the Greater London Plan 2021 (INEA amendments 2023) — check the reproduction is current text and that the 2026 dates have not lapsed/changed.

LC-12 CLAIM: Vorobjev, Uotila, Joensuu & Saari, *Buildings & Cities* 7(1), 2026, DOI 10.5334/bc.722 — systematic review 51 results → 21 papers; seven instrument families; "A limited empirical basis for many proposed measures…"; "major barriers still limit its uptake, including inadequate legislation, a paucity of financial incentives"; Italian 50 % reusable-component rule; California 70 % C&D recycling statute; DfD cost premia.
STATUS: pending (existence + content) | ACTION: pending | Risk if it does not exist: LC-12, LC-20, LC-23 all cite it.

LC-15 / LC-17 CLAIM: PMC12425850 (LCC review, 47 Scopus papers 2009–2024, "operation stage has highest cost", paybacks > 20 y, salvage omitted) and PMC10001863 (Liao, Ren & Li 2023, 1,402 WoS papers; "risk aversion and litigation culture"; "cannot finance necessary renovations").
STATUS: UNVERIFIED | ACTION: pending — both feed Class "HEURISTIC"/Confidence Medium, so the load is low; if either PMC id is wrong the quotes must go.

LC-15 / LC-16 / LC-20 CLAIM: ISO 15686 (via Wikipedia) and isurv/BSRIA Soft Landings (six phases, POE beyond 12 months, BS 8536); Glocert ISO 55001 "line of sight".
STATUS: UNVERIFIED | ACTION: pending — ISO 15686 Part 8 title claim is checkable but low risk; Glocert is a certification-marketing T4 page used for a *requirement* phrase → tier inflation, ACTION: QUALIFY.

LC-18 CLAIM: Tonn & Blank (T4 contractor blog) — master plan "allows a phased approach", "end goal is fixed in place", prioritise "multi-use spaces".
STATUS: UNVERIFIED | Verdict as read: T4 practitioner, no numbers, Class DESIGN PRINCIPLE — acceptable; ACTION: KEEP (already honest).

LC-22 CLAIM: HES *Managing Change in the Historic Environment: Use and Adaptation of Listed Buildings* (Feb 2020) — guidance exists to "support, promote and enable the continued use, reuse and adaptation". SOURCE: historicenvironment.scot publication page.
STATUS: UNVERIFIED (not budgeted) | ACTION: QUALIFY — the quote is attributed to publication-page wording; a single HES guidance note is being used to class a rule "STANDARD". Verify title/date pairing before relying.

LC-24 CLAIM: HM Treasury Green Book (2026) requires communicating "sources of this uncertainty", explicit optimism-bias adjustment, sensitivity analysis.
STATUS: pending | ACTION: pending | **Currency/fabrication risk is the point**: if the current edition is 2022 (or a 2025/2026 revision does not exist), the citation year is wrong and the quoted duties need the actual edition.

### economics.md

EC-01 / EC-02 / EC-16 / EC-22 CLAIM: BOMA office measurement via UBC Sauder reproduction of "Answers to 26 Questions": Usable measured to inside finished surface of permanent outer walls; columns not deducted; centre-line of corridor/partition walls; Rentable = usable + pro-rata common; "Gross Building Area is used within the industry primarily to determine construction costs or building value".
STATUS: pending (does the mirror say it?) | ACTION: pending | Structural problem regardless of result: BOMA's own standard (boma.org) exists and was not read; a T3 course-page reproduction carries a "CODE REQUIREMENT" class in EC-02 → tier inflation; also BOMA's current office standard is ANSI/BOMA Z65.1-2017 (the file's "editions 2010→2026" claim needs the catalogue page).

EC-02 CLAIM: IDF = "inside surface that makes up more than 50 % of the lowest 2.75 m"; IPMS 3.2 includes columns/internal structural walls; "typically produces an area 2–5 % larger than NIA"; "lowers the rate per sq ft".
STATUS: UNVERIFIED (blog; file admits primary PDF unreadable) | ACTION: QUALIFY — the 2–5 % must be labelled "practitioner blog, unverified against RICS" wherever used as a correction magnitude.

EC-03 CLAIM: benchmark bands to correct for (60–80 % net-to-gross, 10–18 % load factor, 55–84 % tower efficiency).
STATUS: pending (source of each band: Vantage Space glossary, NAI Keystone, MDPI) — see EC-04.

EC-04 / EC-21 CLAIM: net-to-gross **60–80 %**; office usable-to-gross **65–80 %**; **<60 % = planning problem, >80 % = circulation starvation**; core/load factor **10–18 %**. SOURCES: Vantage Space glossary (T4, two locale variants of the same commercial vendor) and NAI Keystone (T3 appraisal firm blog).
STATUS: pending | Verdict forming: these are **vendor-glossary bands presented in a "Documented ranges / anchors" register column** — the file's own item 3 admits no methodology/sample. ACTION: REPLACE with either (a) a methodology-bearing source or (b) relabel register column "internal screening band".

EC-04 / EC-06 / EC-07 / EC-21 CLAIM: MDPI *Buildings* 13(11):2819 (2023) — 40 tapered super-tall towers, core-to-GFA mean 26 % (11–38 %), space efficiency mean 72 % (55–84 %), "no significant influence" of function or load-bearing system; and *Buildings* 14(11):3345 (2024) — Asia 68 % efficiency / 30 % core vs Middle East & N. America 76 % / 21–25 % core; inverse correlation height↔efficiency. SOURCES: cris.tuni.fi PDF mirrors (not the MDPI landing pages).
STATUS: pending | ACTION: pending | Questions: do both exist as claimed, are they peer-reviewed (MDPI *Buildings* is indexed but is an open-access fast-turn journal — check indexing), and do they contain the core-to-perimeter figures/curve used in EC-06?

EC-05 / EC-11 / EC-12 / EC-14 / EC-17 CLAIM: RICS *Cost analysis and benchmarking* 2nd ed. — element breakdowns, GIA normalisation, "within a whole life cost framework", caution on cross-project comparison. SOURCE: rics.org PDF (T1).
STATUS: UNVERIFIED (not budgeted; the file cites it as if read) | ACTION: pending — this is the *load-bearing T1* for three rules' class labels; if the PDF was never opened, "RICS requires…" is an unverified quotation. Highest-value remaining retrieval.

EC-06 / EC-21 CLAIM: Advanced Buildings Daylighting Pattern Guide — "not placing any workstation more than 8 meters (24′-0″) from a window"; project with 100 % access at 19 ft; Aon floor 92 ft max distance with 39 % within 20 ft. SOURCE: patternguide.advancedbuildings.net (T3).
STATUS: UNVERIFIED | ACTION: pending — a design-guide rule quoted verbatim; low risk but unconfirmed.

EC-06 / EC-17 / EC-21 CLAIM: MIT Real Estate Innovation Lab summary of *The value of daylight in office spaces* — hedonic study of **5,145 Manhattan offices, 5–6 % rent premium**.
STATUS: pending | ACTION: pending | The primary peer-reviewed paper (Cheong, Jang, Giordano? — actually Jang et al. 2016 *J. Regional Science* is the known 5,145-office Manhattan daylight study) is not cited; a lab news summary is doing the work of a T2 paper. Tier inflation risk if labelled T2.

EC-08 / EC-13 CLAIM: GreenSpec heat-loss form factor 0.56 vs 0.72 → "can reduce heat loss by approximately 28 %"; home-form factor compact 1.0 vs form-rich 4.1; UK Passivhaus target ≤ 3; "exponentially thicker insulation".
STATUS: UNVERIFIED | ACTION: pending | Independent check: (0.72−0.56)/0.56 = 28.6 % — wait, that is a 28 % *increase* going from compact to form-rich; the file's phrasing ("compact form can reduce heat loss by approximately 28 %") matches the source's own wording, but the correct reduction relative to form-rich is 22 %. Flag as directional-arithmetic issue → QUALIFY.

EC-09 / EC-10 CLAIM: SCI/Tata cost comparison study — Central London, Q3 2016 prices; business-park 7.5×9 m grid: steel composite £177/m² floor, total £1,982/m²; RC flat slab £173/m², total £2,183/m²; city-centre 7.5×15 m: steel cellular beam £244/m², total £2,461/m²; post-tensioned £281/m², total £2,565/m²; shallower option (4.18 m vs 4.375 m floor-to-floor) "saves approximately 5 % on the envelope cost" and "about 4 % of the total building cost".
STATUS: pending | ACTION: pending | See A1 (the derived 24 % claim fails) + supplier-adjacent (Tata-hosted) framing "two different buildings", already caveated.

EC-11 / EC-12 CLAIM: formwork aluminium 200+ / steel 150+ reuse cycles, $40–200/m² contact rates. SOURCE: bfs-industries.com blog (vendor).
STATUS: pending | Verdict forming: file already classes this T4 vendor and item 4 says "numerically unusable", yet **the metrics register row 14 lists it under "Documented ranges / anchors"** → presentational contradiction. ACTION: REMOVE from register, keep direction in EC-11.

EC-11 / EC-19 CLAIM: hotel standard keys 300–400 sq ft; lobbies 10–15 % of area (studioanyo, T4); HVS US Hotel Development Cost Survey 2025 (2024 costs) medians $167–169k limited-service/midscale extended-stay, $223k select-service, $265k upscale extended-stay, $409k full-service, >$1,057k luxury, all-property median $219k; Terrapin (T4) select-service $215–325k, full-service $385–625k, FF&E $25–48k/key.
STATUS: pending (HVS) / UNVERIFIED (Terrapin, Studio Anyo) | ACTION: pending | Register row 18 quotes "$167k → $1,057k+ by segment" as a documented anchor — consultancy survey, US-only, mixes hard/soft/FF&E scope per the file's own item 13. Keep as a *ladder*, never a price.

EC-14 / EC-20 CLAIM: EIA 2018 CBECS — health care 144.5 MBtu/ft², 4 % of commercial floorspace, inpatient highest space heating (62.6 MBtu/ft²) and ventilation intensities; office 65.6 MBtu/ft², 17 % of floorspace. SOURCES: eia.gov "consumption/commercial/pba" pages (T1).
STATUS: pending (health-care page) / UNVERIFIED (office page not budgeted) | ACTION: pending | Which table/figure is not named in the citation — CBECS 2018 "selected findings" vs the detailed tables; the pba pages need explicit figure numbers if the audit wants reproducibility.

EC-15 CLAIM: value management "should start at project inception where the benefits can be greatest" (Designing Buildings Wiki, T3/T4); GIRI via CQIC — error costs **10–25 % of project cost**.
STATUS: UNVERIFIED | ACTION: pending | "10–25 % of project cost" is a consultancy estimate presented in the register as a documented anchor (row 16); file's item 1 leans on it as "the size of the prize" → QUALIFY.

EC-17 CLAIM: Neumann Monson (T3 architect blog) — "smaller floor plates provide daylighting and views to more occupants"; ~60-ft (≈18 m) plates suit residential reuse; deep cores "hinder daylight". Register row 8 quotes "~18 m (60 ft)".
STATUS: UNVERIFIED | ACTION: pending — single architect blog; contradicts nothing but is a practitioner statement dressed as a benchmark.

EC-18 CLAIM: space-to-sales principle, "productivity must never reclaim" aisle/accessible-route/exit space (STUDIO mtx, a design-course page); SPSF = annual net sales ÷ selling sq ft; category bands apparel $250–500, grocery $500–700, electronics $700–1,200, luxury $1,500–3,000/sq ft/yr (retailopstoolkit, T4).
STATUS: UNVERIFIED | Verdict forming: the *principle* is standard retail-planning doctrine and safe; the *bands* are implausible (grocery $500–700/sq ft/yr against US supermarket productivity of roughly $150–300) and the file already refuses them. ACTION: REMOVE bands permanently; do not let them re-enter the skill.

EC-20 CLAIM: "NHS-style healthcare space guidance … consistently group clinical and wet functions around service zones (see PP-*, CODE-* files)" — internal cross-reference used as evidence.
STATUS: INFERRED | ACTION: QUALIFY — a research-file cross-cite is not a source; label as internal assumption.

EC-21 CLAIM: measured tower data shows "function and structure did not significantly predict efficiency, so a high ratio is not evidence of good design" — a *non-significant result in a 40-tapered-tower supertall sample* is being used to make a general design claim.
STATUS: PARTIALLY SUPPORTED (if the paper says it) | ACTION: QUALIFY — sample-scope leakage; EC-06/EC-07 already admit "Low for transferring supertall core ratios to a 6-storey block" but the register row 4/7 still prints them as anchors.

EC-01 / EC-04 CLAIM: GSA **150 USF per person** design standard; OMB **60 % occupancy minimum** above 50k sq ft (Facilities Dive, T3).
STATUS: UNVERIFIED | ACTION: pending | The GSA directive PDF (also SP-09/SP-17) was reported unreadable in the space-programming file yet is cited as T1 in the economics register row 17 — the two files disagree with each other about whether that document was read. Cross-file inconsistency → QUALIFY.

### space-programming.md

SP-01 / SP-05 / SP-15 / SP-22 / SP-24 CLAIM (the file's only quantitative "read" figure): BB103 notes — guidelines are "simple, non-statutory area guidelines"; "reduced minimum internal and external areas"; 2010-era guidance gives gross area "on average 15 % lower than that recommended in BB98"; area-guideline vs net-capacity published separately. SOURCE: gov.uk BB103 notes page (T1, marked READ).
STATUS: pending | ACTION: pending | This single figure underwrites SP-05's High confidence, SP-22's Class STANDARD and SP-24's "strongest retrieved demonstration". If the wording is "lower than BB98" in a different sense (e.g. area per place, not gross), three rules lose their evidential base.

SP-06 / SP-18 CLAIM: BOMA vs RICS/IPMS diverge materially; "RICS … under IPMS measures to the internal face of the perimeter wall"; file states clause text not retrieved.
STATUS: INFERRED (documented as such) | ACTION: KEEP with the file's own caveats intact; do not let the skill state what BOMA counts.

SP-07 CLAIM: occupant-load factors live in IBC 1004/1005 means-of-egress tables; no factor quoted.
STATUS: INFERRED (explicitly uncited) | ACTION: KEEP (rule is method-only; no figure claimed). Verify IBC chapter numbering (occupant load = IBC Chapter 10, Table 1004.5 "Maximum Floor Area Allowances Per Occupant") — file's cite-by-name is right enough.

SP-09 / SP-11 / SP-20 CLAIM: HTM 00 *Policies and principles of facilities design and construction* (NHS England PDF, marked "located, not retrieved"); NSS HBN 00-01; HBN 15-02; GSA OAS 7005.1B; UNICEF office annex; FAM 06FAM-1710.
STATUS: UNVERIFIED | ACTION: pending — must check (1) each document exists at the cited URL/authority, (2) it is the right authority for the claim, (3) nothing in the file quotes a figure from it. Current reading of the file: no figure is quoted from any of them (register rows all say NOT retrieved / UNCITED), so the residual risk is *document identity*, e.g. HBN 00-03 and HBN 04-01 named in the brief are not even in the file's source table, and the HTM 00 URL is an england.nhs.uk 2021 upload path (successors/HTM→HBN consolidation risk).

SP-10 / SP-12 / SP-17 CLAIM: Neufert / Time-Saver "not consulted this pass; verify before use"; officespacesoftware "not retrieved".
STATUS: INFERRED / correctly disclaimed | ACTION: KEEP (placeholder rows must not enter the skill).

SP-03 CLAIM: BB103's metric is "area guideline **per place**" with a net-capacity formula.
STATUS: pending (same page as SP-05) | ACTION: pending

SP-04 CLAIM: accumulation vs non-accumulation space is a model-code occupant-load artefact; wording `UNCITED — heuristic`.
STATUS: INFERRED (self-declared) | ACTION: KEEP; do not upgrade to CODE REQUIREMENT on the strength of the *class* label alone — the rule's Class says "CODE REQUIREMENT (definitions derive from model codes)" while the source line says the edition text was not retrieved → **tier inflation**, ACTION: QUALIFY.

SP-13 CLAIM: host A* forbids diagonals in 1-tile corridors → 2-tile route "up to ~1.41× cheaper corner-to-corner".
STATUS: INFERRED (host-derived) | ACTION: KEEP; arithmetic direction is right (√2 ratio), value depends on the engine's cost function — verify in `src/engine/npc` before quoting 1.41.

SP-16 / SP-14 / SP-19 CLAIM: 15 `detectTags`, `hall` priority 999, lowest-priority-wins, bedroom 10 beats bathroom 20, door cells belong to no room — "verified in code".
STATUS: pending (repo check, no web budget spent) | ACTION: pending | If code disagrees, SP-04/SP-16/SP-19 typing rules and the "bedroom beats bathroom" note break.

SP-19 CLAIM (register table): usable-tiles → outer footprint conversions "all round up".
STATUS: PARTIALLY SUPPORTED — see A5; several rows fail the file's own (W−2)(H−2) + min-dimension rules. ACTION: REPLACE rows 16/24/32/48 tiles and re-derive.

SP-02 / SP-21 CLAIM: `required tiles = ceil(governing m² × 4)`; `usable = (W-2)(H-2)`.
STATUS: SUPPORTED (arithmetic; 1 m² = 4 tiles) | ACTION: KEEP

SP-22 CLAIM: "English school area guidance is explicitly 'non-statutory' — many 'standards' are guidance with no legal force."
STATUS: pending (depends on BB103 quote) | ACTION: pending

SP-24 CLAIM: "official English school guidance revised its own gross-area recommendation downward by 15 % between editions for the same building type — a ratio that was 'known' for a decade was wrong by 15 %."
STATUS: pending; also note the inference step: a *guideline revision* is not "a ratio that was wrong" — the earlier figure was a policy choice, not an error. ACTION: QUALIFY the framing.

---

## Part C — resolved verdicts after retrieval (14 web calls, all cited pages opened)

### lifecycle.md

| Claim | Source opened | What it actually says | Problem | Status | Action |
|---|---|---|---|---|---|
| LC-01/02/13/14/16/24 IgCC §1001.3.2.3 Service Life Plan with the 5 quoted fields, structural/envelope/hardscape | up.codes/s/service-life-plan | Confirms section 1001.3.2.3 (IgCC 2018, DoD Green Construction Code), assemblies = structural, envelope, hardscape, fields = assembly description, materials, life in years, maintenance frequency, access | none (it is a commercial reproduction of the code text, correctly labelled T1-via-reproduction) | **SUPPORTED** | KEEP |
| LC-01/02/14/16 EN 1990 design working life values, cited as "Table 2.3" | concrete.org.uk/fingertips/design-working-life/ | Confirms category 2 = 10–25 y "replaceable structural parts, e.g. gantry girders, bearings", category 5 = 100 y, UK NA modifications — **but the page cites Table 2.1** | figure–reference mismatch: the file's "Table 2.3" is the wrong table number (design working lives = EN 1990 Table 2.1) | **PARTIALLY SUPPORTED** | QUALIFY: fix the table reference to 2.1; values themselves stand |
| LC-04/07/08/17/21 Class MA prior approval on "adequate natural light in all habitable rooms", 2-year qualifying use, listed excluded, inserted by SI 2021/428 | legislation.gov.uk/uksi/2015/596/schedule/2/part/3 | Confirms Class MA present in Sch. 2 Pt 3, prior-approval ground quoted verbatim, "continuous period of at least 2 years", listed buildings excluded, insertion by SI 2021/428 (21 Apr 2021) | none material; keep the "England only" scope flag the file already carries | **SUPPORTED** | KEEP |
| LC-03/04/08/09/19/23 steelconstruction.info office guidance: plate ≈13.5 m (natural ventilation), grids 6×9 m and 7.5×12 m, relocatable internal walls, density 1 person/10–15 m² | steelconstruction.info/sectors/multi-storey-office-buildings/ | All four confirmed verbatim in substance ("depth … limited to around 13.5m" for natural ventilation; "6m x 9m and 7.5m x 12m"; walls "relocatable"; "1 person per 10 to 15m2") | supplier-industry information service used as the *only* numeric source for flexibility thresholds (file already flags this); the "maximise the economic life of the building" quotation was not reproduced in the retrieved text | **PARTIALLY SUPPORTED** | QUALIFY: keep as screening values, single-source-labelled; treat the unconfirmed quotation as paraphrase |
| LC-04/08/09/19 Chapman Taylor thresholds: 7 m single-aspect, 14 m double-aspect, ≥2.7 m free height, 2–2.5→4–4.5 m modules, BOH "up to 20%", slab removal / demolition | chapmantaylor.com/insights/repurposing-the-department-store (20/01/2021) | Every figure confirmed verbatim, including "removal of floor slabs may be necessary" and demolition where structures do not suit repurposing | single practitioner article, no measured corroboration (file states this) — these are **not transferable standards** | **SUPPORTED as quoted / INFERRED as thresholds** | QUALIFY: keep the "practitioner judgement" tag attached at every reuse site, incl. LC-19 and the grid-translation tile numbers |
| LC-11 Huuhka et al., *Buildings & Cities* 4 (2023), bc.309: renovation more climate-friendly; payback "circa 10 years"; "decades-long payback times … are not helpful"; frame "neutrally" | journal-buildingscities.org/articles/10.5334/bc.309 | Paper exists (Huuhka et al., 2023, vol 4); concludes renovation is greener; the "decades-long payback times … are not helpful" wording is present | the specific "circa 10 years" threshold was **not confirmed** in the retrieved text | **PARTIALLY SUPPORTED** | QUALIFY: drop or soften "circa 10 years" to "the paper's framework admits a payback test can clear"; direction stands |
| LC-11/12 London Plan 2021 SI 7: Circular Economy Statement incl. reuse and disassembly for future use; 95% reuse/recycling/recovery; zero biodegradable/recyclable waste to landfill by 2026 | planningpolicy.co.uk/policy/london-plan/si-7 | Confirms CES must show reuse, disassembly and on-site waste management; zero landfill by 2026; 95% CD&E recovery; **plus 65% recycling by 2030, which the file omits** | mirror used where the primary exists (GLA publishes the London Plan on london.gov.uk); third-party planning-blog reproduction of statutory policy cited as T1 | **PARTIALLY SUPPORTED** | QUALIFY: re-cite against the GLA text; the omitted 2030 target shows the reproduction was read selectively |
| LC-12/20/23 Vorobjev et al., *Buildings & Cities* 7 (2026), bc.722: 51 screened → 21 papers; instrument families; "inadequate legislation, a paucity of financial incentives"; Italian 50% reusable components; California 70% C&D recycling; DfD costs more | journal-buildingscities.org/articles/10.5334/bc.722 | All confirmed: 51 screened, 21 included, barriers wording, Italy 50%, California 70%, DfD cost premium | none — this is the best-evidenced citation in the three files, and the file's grade ("evidence is weak") matches the paper | **SUPPORTED** | KEEP |
| LC-24 Green Book (2026) duties: communicate "sources of this uncertainty", explicit optimism-bias adjustment, sensitivity analysis | gov.uk Green Book 2026 page | Page exists as the **2026 edition**; all three quoted duties confirmed verbatim | none; currency is fine | **SUPPORTED** | KEEP |
| LC-05 drainage falls (100 mm 1:80 min / 1:40 rec.; 150 mm 1:150; 75 mm not permitted) | not retrieved (budget) | — | T4 page quoting T1; arithmetic on the grid is correct independently | **UNVERIFIED** | QUALIFY: cite Approved Document H directly before the ratio is used as a code number |
| LC-06 EN 1991-1-1 load categories | not retrieved | — | T4 reproduction; file already flags the 2.0 vs 2.5 office conflict | **UNVERIFIED** | QUALIFY: rule uses only the ordering; strip the numbers from the skill |
| LC-07/10/11 Shahi et al. PMC7326450; LC-15/17 PMC12425850 + PMC10001863 | not retrieved | — | three PMC ids carry four rules' quotes | **UNVERIFIED** | pending one retrieval each; no action needed to the rule logic (all classed HEURISTIC/DESIGN PRINCIPLE) |
| LC-11/19 LMN "structure holds most embodied carbon"; "86% of US commercial stock under 25,000 sf" | not retrieved | — | the magnitude claim the file itself says is unsourced; the 86% is a firm summarising third-party datasets | **UNVERIFIED** | REMOVE the 86% from LC-19's evidence (it is decorative, the grid translation never uses it); KEEP the qualitative retain-first test |
| LC-02 LDS "long life, loose fit" / Gordon 1972; LC-08 BRE VSC ≥27%; LC-13 hotel guide $/mm figures; LC-18 Tonn & Blank; LC-20/16 Glocert ISO 55001; LC-22 HES quote; LC-23 Wikipedia *How Buildings Learn*; LC-01 ISO 15686 / EN 15978 50-y RSP via docs.realtimelca | not retrieved | — | mixed T3/T4; Glocert (certification-marketing page) is used to state an ISO *requirement*, and HES is used to class a rule STANDARD | **UNVERIFIED** | QUALIFY: ISO 55001 and HES claims need the standard/publication itself; do not upgrade classes on consultancy pages |

### economics.md

| Claim | Source opened | What it actually says | Problem | Status | Action |
|---|---|---|---|---|---|
| EC-01/02/16/22 BOMA definitions via UBC Sauder (usable to inside finished face; centre line of partitions; columns not deducted; rentable = usable + common; "Gross Building Area is used … to determine construction costs or building value") | professional.sauder.ubc.ca … /boma.cfm | Definitions confirmed substantially ("center line of partitions", columns not deducted, rentable includes common areas, GBA for cost/value) | **Currency: the page is a 1998 reproduction of Q&A on ANSI/BOMA Z65.1-1996** — three standards generations out of date (current is Z65.1-2017/2025 family); and BOMA's own text exists but was not read | **PARTIALLY SUPPORTED** | REPLACE: the wording is safe only as historical; every rule that quotes it must name the 1996/1998 edition, or re-source to current BOMA/RICS |
| EC-09 frame and total costs: 7.5×9 m steel composite £177/m² (total £1,982/m²) vs RC flat slab £173 (£2,183); 7.5×15 m steel cellular £244 (£2,461) vs PT concrete £281 (£2,565); Central London Q3 2016 | steelconstruction.info cost-comparison-study | Every figure confirmed exactly, including location and price date | the derived claim "long-span steel is 24 % over the short-span frame rate" matches **no** pair (see A1); supplier-hosted case study used as the project's "economical band" | **SUPPORTED (inputs) / CONTRADICTED (derived 24 %)** | KEEP inputs with the date stamp, REPLACE the 24 % with the correct +38 % (steel-vs-steel across different buildings) and keep the file's own "two different buildings, directional only" caveat |
| EC-08/EC-10 floor-to-floor: steel 4.18 m vs concrete 4.375 m → "approximately 5 %" envelope saving and "4 %" total | same page | Confirms "about a 5% lower building envelope cost" and "4% lower on a whole building basis" | the file's extra "reduces the overall building height by 1.5 m … four storeys' worth" is **internally inconsistent**: 0.195 m × 4 storeys = 0.78 m; 1.5 m implies ~8 storeys | **PARTIALLY SUPPORTED** | QUALIFY: quote the 5 %/4 % only; delete or re-derive the 1.5 m/four-storey arithmetic |
| EC-14/EC-20 CBECS 2018: health care 144.5 MBtu/ft², 4 % of floorspace, inpatient highest heating (62.6) and ventilation intensities | eia.gov/consumption/commercial/pba/health-care.php | Confirms 144.5 MBtu/ft² overall and that inpatient buildings have the highest heating/ventilation intensity; page reports **inpatient 193.3 and outpatient 82.0** | the quoted "62.6 MBtu/ft² heating alone" and the "4 % of floorspace" share are not what this page surfaces — figure appears to come from a different CBECS table than the one cited; the office page (65.6, 17 %) was not retrievable within budget, so the "~2.2×" anchor rests on one confirmed and one unconfirmed input | **PARTIALLY SUPPORTED** | QUALIFY: cite the CBECS table/figure number for each value; do not print 62.6 until the source table is named |
| EC-04 tower efficiency: 40 tapered super-tall towers, core-to-GFA 26 % (11–38 %), efficiency 72 % (55–84 %), function/load-bearing system not significant; 2024 comparative study 68 %/30 % vs 76 %/21–25 % and inverse height↔efficiency | mdpi.com landing page → HTTP 403; cited mirror is a university CRIS repository copy of the PDF | not readable this pass | **mirror (cris.tuni.fi) used where a DOI-resolvable primary exists**; journal is open-access MDPI *Buildings* — peer-reviewed but not a high-barrier venue, and the sample is 200 m+ towers only | **UNVERIFIED** | QUALIFY: keep the ratio direction out of the register until the primary is read at the DOI; EC-06/EC-07/EC-21 already admit non-transferability to low-rise |
| EC-02 IPMS IDF at 2.75 m; IPMS 3.2 "2–5 % larger than NIA" | not retrieved | — | practitioner blog standing behind a rule classed **CODE REQUIREMENT**; file admits primary RICS/IPMS texts unreadable | **UNVERIFIED** | QUALIFY (see A14): the % must be labelled blog-derived |
| EC-03 benchmark bands 60–80 % / 65–80 % / <60 % / >80 %; EC-04 load factor 10–18 % | not retrieved (Vantage Space vendor glossary; NAI Keystone appraisal blog) | — | vendor-glossary bands printed in a column headed "Documented ranges / anchors"; file's own items 3, 6, 12 admit no methodology, single source | **UNSUPPORTED as benchmarks** | REPLACE in the register: relabel as "internal screening band (no published methodology)" or source to a measurement standard with method |
| EC-05/11/12/14/17 RICS *Cost analysis and benchmarking* 2nd ed. (GIA normalisation, "within a whole life cost framework") | not retrieved | — | cited as T1 and as if read; three rules' Class = STANDARD leans on it | **UNVERIFIED** | pending: open the RICS PDF before any "RICS requires" sentence survives into the skill |
| EC-06 daylight rule 8 m / 24 ft; Aon 92 ft case; 5,145 Manhattan offices 5–6 % premium (via MIT lab summary) | not retrieved | — | MIT page is a lab news summary standing in for a peer-reviewed hedonic paper (tier inflation); the pattern guide is a US-funded design guide, not a standard | **UNVERIFIED** | QUALIFY: cite the journal article, keep 8 m as a design-guide rule not a code |
| EC-08/EC-13 form factor 0.56 vs 0.72 → "reduce heat loss by approximately 28 %"; form-rich 4.1 vs compact 1.0, Passivhaus ≤3 | not retrieved | — | arithmetic direction: 0.56 vs 0.72 is a 22 % reduction *from* the form-rich case, or a 28.6 % increase *to* it; the source wording is inherited by the file without checking which direction it supports | **UNVERIFIED** | QUALIFY: state "the form-rich case loses ~29 % more" or "compact saves ~22 %", not "28 %" unqualified |
| EC-11/EC-12 formwork 150+/200+ cycles, $40–200/m² | not retrieved (vendor blog) | — | vendor marketing quoted in the register as a "documented anchor"; file's own item 4 says "numerically unusable" | **UNSUPPORTED as benchmark** | REMOVE from the register; keep only "repetition amortises tooling" as direction |
| EC-19 HVS 2025 survey per-key medians ($167–169k / $223k / $265k / $409k / >$1,057k; all-property $219k); Terrapin ranges; Studio Anyo 300–400 sq ft keys, lobby 10–15 % | not retrieved | — | consultancy survey presented in the register as an anchor; scope mixing of hard/soft/FF&E admitted by the file (item 13); the 300–400 sq ft and 10–15 % rest on one T4 blog | **UNVERIFIED** | QUALIFY: keep as a US segment *ladder* with "HVS survey, 2024 costs, US" stamped; never per-m² |
| EC-15 GIRI/CQIC error = 10–25 % of project cost; DB-Wiki value-management quote | not retrieved | — | consultancy estimate promoted to a "documented anchor" and to "the size of the prize"; file's item 1 correctly kills the 1×/10×/100× curve | **UNVERIFIED** | QUALIFY: label "GIRI estimate, UK, order-of-magnitude"; no multiplier language |
| EC-17 Neumann Monson ~60 ft (18 m) plates suit residential reuse | not retrieved | — | single architect blog, quoted in the register as an anchor for a geometric limit | **UNVERIFIED** | QUALIFY: practitioner statement, not a band |
| EC-18 space-to-sales principle; SPSF formula; category bands ($250–500 apparel … $1,500–3,000 luxury, grocery $500–700) | not retrieved | — | the principle is orthodox; the bands are T4 with no jurisdiction/method and the file already shows grocery is implausible | **UNSUPPORTED (bands)** | REMOVE bands permanently; KEEP principle + formula |
| EC-20/EC-16 "NHS-style guidance" and "host professional-practice research file" used as evidence | internal cross-cite | — | a sister research file is not a source | **INFERRED** | QUALIFY: label internal assumption, cite HBN/HTM when read |
| Register row 17 GSA 150 USF/person; OMB 60 % threshold via trade press | not retrieved | — | the same GSA directive is marked "located, not retrieved" in space-programming but is cited here as T1 — **cross-file contradiction about whether it was read** | **UNVERIFIED** | QUALIFY: harmonise the two files; 150 USF may only appear once the GSA/OMB document is opened |

### space-programming.md

| Claim | Source opened | What it actually says | Problem | Status | Action |
|---|---|---|---|---|---|
| SP-01/02/03/05/15/22/24 BB103 notes: "simple, non-statutory area guidelines"; "reduced minimum internal and external areas"; gross "averages 15 % lower than that recommended in BB98"; area guidelines published apart from net capacity; "per place" basis | gov.uk BB103 notes page | **All four quoted strings confirmed**, including the 15 % sentence; separate net-capacity mechanism confirmed; page dated July 2018 | the file's "2010-era guidelines" is loose (BB103 guidance/edition context should be stated with the 2018 page date); the *numeric per-place tables* remain unread | **SUPPORTED** | KEEP — this is the file's one genuine T1 quotation and it survives adversarial check |
| SP-24 framing "a ratio that was 'known' for a decade was wrong by 15 %" | same | the 15 % change is a policy revision | **INFERRED** — a revised guidance figure is not a previously *wrong* figure; the rhetorical step overstates what the document supports | **INFERRED** | QUALIFY the wording ("changed by 15 % between editions"), the rule's method still holds |
| SP-06 BOMA "distinguishes usable from rentable (load factor)"; RICS GEA/GIA/NIA + IPMS measures to internal face of perimeter wall | BOMA side via the 1996/1998 Sauder mirror; RICS/IPMS not read | BOMA distinction confirmed in the mirror; RICS clause unverified | mirror-not-primary + currency (A14/EC-01 same issue); the file's own confidence ("Low for every clause-level detail") is correct | **PARTIALLY SUPPORTED** | KEEP the file's caveat verbatim; the skill must not state what BOMA counts |
| SP-14/SP-19/SP-02/SP-04/SP-16 host arithmetic and typing rules (15 detectTags, `hall` priority 999, lowest-priority-wins, bedroom 10 beats bathroom 20, `back-of-house` line 22) | repo: `src/blueprint-editor/domain/schema/rooms.ts` | **Confirmed**: 15 specs at lines 10–24, `HALL_ROOM_TYPE` `detectTags: []` priority 999 at :27, `priority <` resolution at :34, bedroom 10 / bathroom 20, staff-room at :22 | none — these are the most reliable claims in the three files | **SUPPORTED** | KEEP |
| SP-19 usable-tile → footprint table and SP-21 worked example | arithmetic | rows contradict `(W-2)(H-2)` and the file's own 3.0 m minimum dimension | see A2–A5 | **CONTRADICTED (worked examples) / PARTIALLY SUPPORTED (table)** | REPLACE the worked example and rows 16/24/32/48 tiles; add a usable-dimension column |
| SP-04 accumulation vs non-accumulation is a code concept (Class: CODE REQUIREMENT, source "edition text not retrieved") | not retrieved | — | class label outruns the evidence the file itself states | **INFERRED** | QUALIFY class to DESIGN PRINCIPLE until IBC/IFBC text is read |
| SP-09/SP-11/SP-20 HTM 00, NSS HBN 00-01, HBN 15-02, GSA OAS 7005.1B, UNICEF annex, FAM 1710 (all marked located / not retrieved / fetch failed) | not retrieved (budget) | — | existence and authority unconfirmed; note HBN 00-03 and HBN 04-01 named in the brief do not appear in the file's source table at all, and the HTM 00 URL is a 2021 england.nhs.uk upload path (HTM→HBN consolidation risk) | **UNVERIFIED** | KEEP AS-IS (no figure is attributed to them) — verified by inspection of the register: **every** m² row says `UNCITED — heuristic` or "NOT retrieved", so nothing is quoted as if sourced. One targeted pass per PDF (or the NSS publication page) would close it |
| SP-07 IBC occupant-load factors; SP-10/12/17 Neufert/Time-Saver/FAM figures | not retrieved | — | correctly empty of numbers | **INFERRED** | KEEP method-only rows |
| SP-13 corridor width bands, SP-09/SP-10/SP-12/SP-17/SP-18 register bands | n/a | file labels them heuristic/Low | none — the labels are honest | **UNSUPPORTED by design** | KEEP as planning priors only; the skill must inherit the `UNCITED` tag |

---

## Verification log

| # | Call | Result used |
|---|---|---|
| 1 | up.codes/s/service-life-plan | IgCC §1001.3.2.3 fields confirmed |
| 2 | legislation.gov.uk GPDO Sch 2 Pt 3 | Class MA wording confirmed |
| 3 | planningpolicy.co.uk/policy/london-plan/si-7 | SI 7 confirmed (65 %/2030 omitted by the file) |
| 4 | concrete.org.uk design-working-life | values confirmed, **Table 2.1 not 2.3** |
| 5 | steelconstruction.info multi-storey office | 13.5 m / 6×9 / 7.5×12 / 10–15 m² confirmed |
| 6 | chapmantaylor.com repurposing-the-department-store | 7 m / 14 m / 2.7 m / 2–4.5 m / 20 % confirmed |
| 7 | journal-buildingscities bc.309 (Huuhka) | exists; "circa 10 years" not confirmed |
| 8 | journal-buildingscities bc.722 (Vorobjev) | exists; all quotes confirmed |
| 9 | gov.uk BB103 notes | non-statutory + 15 % vs BB98 confirmed |
| 10 | eia.gov CBECS health-care page | 144.5 confirmed; 62.6 and 4 % not surfaced |
| 11 | steelconstruction.info cost-comparison-study | all £/m² and 5 %/4 % confirmed; 1.5 m inconsistent |
| 12 | mdpi.com 13(11):2819 | **HTTP 403** — tower studies unverified; cited mirror is a CRIS copy |
| 13 | professional.sauder.ubc.ca BOMA Q&A | content confirmed but **1998 reproduction of Z65.1-1996** |
| 14 | gov.uk Green Book 2026 | 2026 edition real; three duties confirmed verbatim |
| + | repo `rooms.ts` grep | host typing/arithmetic claims confirmed |

Not retrieved within budget (all recorded as UNVERIFIED, none silently promoted): EN 15978 50-y RSP mirror, ISO 15686, Approved Document H via Rospower, EN 1991-1-1 via Structville, Shahi PMC7326450, PMC12425850, PMC10001863, LDS long-life-loose-fit, Anstey Horne BR 209, Glocert, isurv/BSRIA, Tonn & Blank, HES guidance note, CCC Engineering, hotel-development-guide, Wikipedia (ISO 15686 / How Buildings Learn), Ellen & Kazis, LMN, GlobalABC, waste-framework page, RICS cost-analysis PDF, Black Ac Surveyors, Vantage Space ×2, NAI Keystone, GreenSpec, CQIC/GIRI, DB-Wiki, Advanced Buildings pattern guide, MIT REIL, Neumann Monson, STUDIO mtx, retailopstoolkit, HVS, Terrapin, Studio Anyo, BFS formwork, Turner, Facilities Dive, GSA reporting guidelines, BOMA standards catalogue, HTM 00 / HBN 00-01 / HBN 15-02, GSA OAS 7005.1B, UNICEF annex, FAM 1710, ResearchGate harmonising paper, WBDG, Foraker.

---

## Totals by status (per file, headline evidential claims — 39 lifecycle / 34 economics / 21 programming claims adjudicated)

| File | SUPPORTED | PARTIALLY SUPPORTED | INFERRED | UNSUPPORTED (as benchmark) | CONTRADICTED | UNVERIFIED |
|---|---|---|---|---|---|---|
| lifecycle.md (LC-01…LC-24) | 8 | 6 | 3 | 0 | 0 | 17 |
| economics.md (EC-01…EC-22 + register) | 4 | 5 | 2 | 4 | 3 | 20 |
| space-programming.md (SP-01…SP-24 + register) | 5 | 2 | 3 | 0 | 4 | 7 |

Notes: CONTRADICTED in economics = the derived 24 % premium, the 1.5 m / four-storey arithmetic, and the `>80 % is a problem` / band-as-anchor presentation. CONTRADICTED in space-programming = SP-21's two worked examples, SP-19's "12 usable tiles" line, and the SP-19 rows that violate SP-15's own minima.

## 5 most dangerous claims

1. **EC-01/EC-02/EC-16/EC-22 rest on a 1998 reproduction of ANSI/BOMA Z65.1-1996** while the same rule is classed CODE REQUIREMENT and drives the file's `LETTABLE`/`USABLE` tile formulas. A 28-year-old measurement convention is being used to define the income surface.
2. **The economics register's "Documented ranges / anchors" column mixes vendor glossary, vendor marketing and consultancy bands with peer-reviewed and T1 data** (60–80 % NTG, 65–80 % FPE, 10–18 % load factor, formwork 150+/200+ cycles and $40–200/m², retail SPSF bands, hotel per-key, GIRI 10–25 %, tower 55–84 %). Any agent reading that column will quote a vendor number as an industry benchmark.
3. **SP-21/SP-19's worked area examples break the file's own arithmetic rule** (10×8 → 48 usable tiles = 12 m², not "64 tiles = 16 m²"; 14×11 → 108, not 120; "12 usable tiles" for a 6 m² bathroom). These are the numbers an agent copies, and they are the file's headline demonstration of the take-off method.
4. **EC-09's "long-span steel is 24 % over the short-span frame rate"** — no combination of the (correctly cited) SCI figures produces it. A wrong derived premium inside a rule that sets the structural bay.
5. **LC-11's "reuse saves X %" / LMN "structure holds most embodied carbon" + 86 % under 25,000 sf, and the "circa 10 years" payback threshold** — the retain-first rule is the one most likely to be asserted as fact in a generated design narrative, and its quantitative limbs are unverified (the paper confirmed only the qualitative direction).

## Safe-as-foundation judgement

**Usable as a foundation, with four surgical repairs.** The evidential discipline of all three files is well above average: every high-risk threshold checked this pass (IgCC §1001.3.2.3 fields, GPDO Class MA natural-light test, London Plan SI 7 CES + 95 %/2026, EN 1990 category values, SCI 13.5 m / grids / density, Chapman Taylor 7/14/2.7 m, Huuhka and Vorobjev existence and findings, BB103 non-statutory + the 15 % figure, Green Book 2026 duties, all SCI £/m² figures, CBECS 144.5, host `rooms.ts` typing) **held up against the real document**. The failure mode is not false citation; it is (a) one obsolete mirror carrying BOMA definitions, (b) the register column laundering vendor/glossary numbers into "documented anchors", (c) two internally wrong arithmetic worked examples plus the 24 % and 1.5 m slips, and (d) a long tail of UNVERIFIED T3/T4 quotes that must stay marked as such. Verdict: **KEEP as foundation after fixes 1–4; do not promote any economics-register band into the skill without its methodology; do not let any space-programming `UNCITED` band leave the file labelled as anything other than a heuristic.**
