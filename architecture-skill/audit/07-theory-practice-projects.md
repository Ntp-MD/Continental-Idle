# Audit 07 — Adversarial source verification: theory, practice, projects

Files under audit (read-only):
- `architecture-skill/research/architecture-theory.md` (TH-01…TH-29)
- `architecture-skill/research/professional-practice.md` (PP-01…PP-26)
- `architecture-skill/research/real-projects.md` (RP-01…RP-27, CR-01…CR-21)

Method: book claims checked for (a) plausible authority, (b) whether the file is honest about not
quoting; numeric book claims checked against retrievable excerpts where possible. Project claims
checked for existence, architect/type match, whether the cited article actually discusses the plan
rationale, whether self-reported outcome figures are attributed as advocacy, and whether quantitative
data match the cited article. Practitioner numbers traced to source and cross-checked against the
file's own `## Consensus map` / `## Claims that did NOT survive cross-checking` / `## Weak or contested`.

Evidence status vocabulary: SUPPORTED | PARTIALLY SUPPORTED | INFERRED | UNSUPPORTED | CONTRADICTED |
UNVERIFIED | PENDING.
Action: KEEP | QUALIFY | REPLACE | REMOVE.

---

# PART A — BOOK CLAIMS (architecture-theory.md, plus book attributions in the other two files)

## A-01 — Ching, *Building Construction Illustrated*, 5th ed. — partition thickness
- CLAIM (TH-02): "a real internal partition (typically 0.10–0.20 m plasterboard/masonry leaf, per
  standard construction texts; Ching, *Building Construction Illustrated*, 5th ed., Wiley, ch. 5 — T3,
  no numeric claim needed here)"
- SOURCE AS CITED: Ching BCI 5th ed. 2014, Wiley, ch. 5 — T3, no URL.
- WHAT THE SOURCE ACTUALLY SAYS: PENDING (no page/quote offered).
- PROBLEM: The entry asserts "no numeric claim needed here" **but then states a numeric range
  (0.10–0.20 m) and attributes it to Ching**. That is exactly the pattern the audit targets: number
  present, book named, passage not quoted, and a self-clearing disclaimer that does not clear the
  number. The range is *plausibly* consistent with Ching's plasterboard/stud and masonry build-ups
  (authority check passes), but the chapter-5 pointer is unverified and the disclaimer is misleading.
  Also note the claim is load-bearing only as contrast to the grid's 0.5 m wall; the arithmetic of
  TH-02 does not depend on the exact figure.
- EVIDENCE STATUS: UNVERIFIED (plausible authority; number unquoted; disclaimer inaccurate)
- ACTION: QUALIFY — reword to "typical internal partitions are far thinner than this grid's wall
  (order 0.10–0.20 m; commonly illustrated in Ching, *Building Construction Illustrated*, ch. 5,
  passage not quoted here)". Drop the "no numeric claim needed" line, or delete the range.
- WHAT WOULD CLOSE IT: a page image/scan of BCI ch. 5 (Wiley sample pages or archive.org) showing a
  100–200 mm partition build-up, or removal of the number.

## A-02 — Neufert, *Architects' Data*, 3rd English ed. 2012 — room-by-room requirements
- CLAIM (TH-03, TH-08, TH-15, TH-25; Sources list T3): cited for "the existence of room-by-room
  dimensional programming" and, in TH-25, for "Proportional limits on rooms are standard
  interior-planning advice in the dimension-driven references (Neufert … Time-Saver … Panero & Zelnik),
  none of which could be quoted verbatim this pass".
- SOURCE AS CITED: archive.org direct PDF
  `https://ia600801.us.archive.org/21/items/NeufertS/Neufert-S.pdf` — T3.
- WHAT THE SOURCE ACTUALLY SAYS: **the URL resolves to a real object, but it is 58,878,226 bytes
  (58.9 MB) and could not be opened by any available reader (exceeds the 10 MB fetch ceiling).** So the
  link is live but the document is functionally unreadable at that path — by the original research
  agent as well as by this audit.
- PROBLEM: authority is strong on plausibility (*Architects' Data* does contain a design-method /
  programming section, room-by-room dimension tables, relationship/adjacency material and circulation
  shares), and the file's honesty labels are good: TH-15/TH-25 say explicitly "no number taken",
  "cited by title/edition without quoting numbers", and the Sources list says "(cited for the existence
  of room-by-room dimensional programming; no number taken from it)". Two real defects remain:
  (1) presenting a 58 MB PDF as the verification path is decorative — nothing can be checked against
  it, so the "T3" tier is unearned for any content claim; (2) TH-08's phrasing ("the room-by-room
  service requirement in … Neufert's *Architects' Data* organisation of planning by room type and
  circulation") reads closer to content-assertion than title-citation, and TH-03 lists the PDF as a
  co-source for the adjacency-matrix method it does not need it for.
- EVIDENCE STATUS: UNVERIFIED (live-but-unreadable source; honestly labelled where it declines numbers)
- ACTION: QUALIFY — keep Neufert as a title-level T3 reference, remove the archive.org deep link as
  though it were checkable, and strip the content-gloss from TH-08.

## A-03 — *Time-Saver Standards for Building Types*, 2nd ed. 2001 — per-type standards incl. efficiency factors
- CLAIM (TH-15, TH-25): "(per-type space-planning standards incl. efficiency factors)"; "cited by
  title/edition only; no stable URL retrieved and no number taken".
- SOURCE AS CITED: no URL. T3.
- WHAT THE SOURCE ACTUALLY SAYS: PENDING.
- PROBLEM: authority fine — Time-Saver (ed. Frank E. Brown Jr., McGraw-Hill) does give per-building-type
  planning criteria and space/efficiency allowances. The file is honest: no number is taken, and the
  circulation percentages it *does* use come from a T4 vendor glossary that it labels Low confidence.
  Residual issue is the "incl. efficiency factors" gloss, which is a content claim stated without a
  page — mildly stronger than "cited by title".
- EVIDENCE STATUS: UNVERIFIED (honest labelling)
- ACTION: KEEP (label is adequate); optionally downgrade the parenthetical to "commonly understood to
  include" or cite a Google Books sample-page locator.
- WHAT WOULD CLOSE IT: publisher/Google Books sample showing a type sheet with a net-to-gross or
  efficiency line.

## A-04 — Panero & Zelnik, *Human Dimensions and Interior Space* (1979) — room proportions
- CLAIM (TH-25): listed among references for proportional limits on rooms; "none of which could be
  quoted verbatim this pass".
- SOURCE AS CITED: title/edition only, T3.
- WHAT THE SOURCE ACTUALLY SAYS: PENDING.
- PROBLEM: authority strong — Panero & Zelnik is precisely a book of room-by-room dimensional
  standards and does discuss room shapes/proportions and furniture envelopes. TH-25's *numeric* ratios
  (≤3, ≤2.5, ≤4, ≤3.5) are NOT attributed to it, and the rule is explicitly classed
  `HEURISTIC — the specific ratio limits are UNCITED — heuristic`, Confidence Low. This is honest.
- EVIDENCE STATUS: UNVERIFIED content; honesty of attribution SUPPORTED
- ACTION: KEEP.
- WHAT WOULD CLOSE IT: not required for safety — the rule already disowns its own numbers.

## A-05 — Rand/Parker/Zimring, *Problem Seeking*, 5th ed., Routledge — programming artefacts
- CLAIM (TH-01): "Rand/Parker/Zimring, *Problem Seeking: Environmental Analysis in Architecture and
  Planning*, 5th ed., Routledge — T3 (no stable URL retrieved; cited by edition)".
- SOURCE AS CITED: edition only.
- WHAT THE SOURCE ACTUALLY SAYS: PENDING (not fetched).
- PROBLEM: authority strong — *Problem Seeking* is the canonical programming/needs-analysis text
  (Zimring was a co-author; 5th ed. Routledge 2019 is real) and it does define programming as
  pre-design research producing space/relationship requirements. The supporting quotations in TH-01,
  however, come from a T4 vendor (Foraker) and a T4 studio blog (Gustin); Problem Seeking contributes
  no text. So the rule's evidence is thin but correctly tiered (T1 WBDG is listed but the file admits
  its body text "was not machine-readable, so no sentence is quoted from it").
- EVIDENCE STATUS: UNVERIFIED (book), label honesty SUPPORTED
- ACTION: KEEP.
- WHAT WOULD CLOSE IT: a locator page for the programming-phase definition if the file ever wants the
  rule to rest on the book rather than the T4s.

## A-06 — Ching, *Architecture: Form, Space, and Order*, 4th ed. — five organisation forms
- CLAIM (TH-10, TH-05, TH-16, TH-17, TH-23): the five forms are "Centralized, Linear, Radial,
  Clustered, Grid"; plus the four spatial-relationship determinants "space within a space,
  interlocking spaces, adjacent spaces, spaces linked by a common space". TH-10 also issues a
  correction: the "frontal, linear, radial, circular, grid, complex" list is NOT Ching's.
- SOURCE AS CITED: archive.org djvu full text + a WordPress chapter summary (T4).
- WHAT THE SOURCE ACTUALLY SAYS: PENDING fetch of the archive.org stream URL.
- PROBLEM: this is the best-labelled book claim in the file — a specific falsifiable content claim, a
  second-hand corroboration, and an explicit retraction of a wrong variant. Residual risk is that the
  evidence is a blog summary (T4) plus an archive.org text the file says it used; the list itself is
  correct against my knowledge of the 4th ed. (which renames "Clustered"; 3rd ed. also used
  "Centralized/Linear/Radial/Cluster/Grid"), so authority passes.
- EVIDENCE STATUS: PENDING fetch; expected SUPPORTED
- ACTION: KEEP if fetch confirms.
- WHAT WOULD CLOSE IT: fetch the archive.org text and locate the "Organization of Spaces" list.

## A-07 — Newman, *Defensible Space* (1972) / *Creating Defensible Space* — quoted page references
- CLAIM (TH-06, TH-07, TH-09): "'territoriality measures the degree to which people have a sense that
  a space is "owned" or is "private'" (quoted p. 50); "the physical expression of a social fabric that
  defends itself" (ibid., p. 3); "family's claim to a territory diminishes proportionally as the
  number of families who share that claim increases" (quoted p. 17); "the apartment tower itself […]
  is the real and final villain" (p. 25)."
- SOURCE AS CITED: **the quotations are taken second-hand** from an open-access AMST article (T2) and
  from the HUD-hosted *Creating Defensible Space* PDF (T1/T3). The file says so ("source of every
  verbatim Newman quotation and its page number").
- PROBLEM: the audit risk is page-number laundering — an aggregator's page citation that nobody has
  checked against the 1972 Macmillan original. The two Newman books are also conflated in places:
  *Defensible Space* (1972, Macmillan) and *Creating Defensible Space* (1972, HUD) are different
  documents with different pagination; TH-07 attributes the "family's claim … diminishes
  proportionally" line to *Creating Defensible Space* p. 17 via the AMST article, TH-06/TH-09 to
  *Defensible Space* pp. 3/25/50.
- EVIDENCE STATUS: **SUPPORTED (3 of 4), PARTIALLY SUPPORTED overall.** The AMST fetch confirms all
  four quotations appear in that article with the page numbers the file reports — pp. 3, 25 and 50 of
  *Defensible Space* check out, and the "family's claim … diminishes proportionally" line is confirmed
  at p. 17 of *Creating Defensible Space*. TH-07 attributes that fourth quote to *Creating Defensible
  Space* (correct); the audit's earlier worry about book-conflation is resolved — **but the page
  numbers remain third-hand** (they are the AMST author's page references, not verified against the
  1972 Macmillan original, which no one opened).
- ACTION: KEEP, with the citation wording tightened to "Newman, quoted at pp. 3/25/50 *as cited in*
  the AMST article" so the page numbers are not mistaken for a primary collation.

## A-08 — Alexander, *A Pattern Language* — Pattern 159
- CLAIM (TH-27): "Pattern 159, 'Light on Two Sides of Every Room' (verified pattern number and title;
  the retrieved text is qualitative …); pattern 146 is *not* this pattern".
- SOURCE AS CITED: `https://patternlanguage.cc/Patterns/Light-on-Two-Sides-of-Every-Room-(159)` — T3.
- WHAT THE SOURCE ACTUALLY SAYS: PENDING fetch.
- PROBLEM: none on authority — Pattern 159 is correct (OUP 1977), and the file is exemplary about the
  limit ("gives no numeric depth or glazing ratios"), and it bans the pattern-as-number use in
  `## Weak or contested` ("never to justify a number").
- EVIDENCE STATUS: **VERIFIED — SUPPORTED.** Fetch of
  `https://patternlanguage.cc/Patterns/Light-on-Two-Sides-of-Every-Room-(159)` returns pattern 159 with
  the title "Light on Two Sides of Every Room", the quoted opening ("When they have a choice, people
  will always gravitate to those rooms which have light on two sides…"), the cross-referenced pattern
  numbers the file lists (106, 107, 109, 116, 180, 192, 209, 221, 223, 238), and **no numeric depth or
  glazing ratio** — i.e. every element of TH-27's Evidence line, including the "146 is not this
  pattern" correction, checks out exactly.
- ACTION: KEEP. This is the single best-evidenced book claim in the file.

## A-09 — Hillier & Hanson / Hillier — space syntax concepts
- CLAIM (TH-11, TH-17, TH-20): "the spatial configuration constrains co-presence"; "the movement
  economy" (Hillier 1996); verbatim quotes from spacesyntax.com; formulas from an arXiv preprint; the
  *Sustainability* 13(6):3394 synopsis "full text not retrievable this pass; cited by title".
- PROBLEM: authority strong and the predictive claim is explicitly demoted in `## Weak or contested`
  ("contested — method-dependence, correlational not causal"). The MDPI citation admits non-retrieval.
  One flag: the arXiv URL `0709.4375v1` is offered for the connectivity/RRA formulas — preprint-grade,
  labelled T2, acceptable because the file only needs standard formula notation.
- EVIDENCE STATUS: PARTIALLY SUPPORTED (concepts), honesty adequate
- ACTION: KEEP.

## A-10 — Modulor numbers (Le Corbusier) attributed via a T4 licensed journal page
- CLAIM (TH-22): "a 'Greek man' of 1.75 m in the first version and 1.829 m in the second, a navel
  height of 113 cm giving the red series (113, 70, 43, 27 cm), an outstretched-arm height of 226 cm
  giving the blue series (226, 140, 86, 43 cm), derived room heights such as 2,260 mm".
- SOURCE AS CITED: `dz.lescouleurs.ch` (self-described Fondation Le Corbusier-licensed journal) — T4,
  plus a Wiley OA paper for context. The file labels the tier honestly and puts the Modulor in
  `## Weak or contested` as "idiosyncratic … widely criticised as mystical … never as an efficiency
  argument".
- PROBLEM: a multi-number quantitative claim carried by a T4 fan/heritage site. Values match the
  standard published record (113 cm navel, 226 cm raised arm, Fibonacci series, 175 cm/183 cm man), so
  the exposure is low, but TH-22's *Rule* ("treat the 0.5 m tile as a modular-coordination grid") does
  not depend on them at all — the Modulor content is decorative in that rule.
- EVIDENCE STATUS: PARTIALLY SUPPORTED (values match the common record; T4 tier)
- ACTION: QUALIFY — move the numeric series out of TH-22's Evidence into the Weak-or-contested note
  where it already sits, or cite the Wiley OA paper for the numbers instead of the T4 page.
- WHAT WOULD CLOSE IT: fetch the two pages once; confirm 113/226 and the 1.75/1.83 m figures.

## A-11 — ISO 1006 / ISO 2848 basic module
- CLAIM (TH-22): "the ISO series … takes a basic module M of 100 mm with coordination modules as
  multiples of it"; "500 mm is *not* an ISO coordination size (ISO steps are 100-based)".
- SOURCE AS CITED: iso.org catalogue (title verified), iTeh sample PDF of ISO 2848:1984. Sources list
  concedes "body text not retrievable this pass" for ISO 1006.
- PROBLEM: the substantive claim is correct on my knowledge (M = 100 mm; 500 mm *is* in fact a standard
  coordination module — 5M — so the file's sharper statement "500 mm is not an ISO coordination size"
  is **arguably wrong as written**: 500 mm is a multiple of the 100 mm basic module and appears in the
  ISO 2848 coordination-series tables; what is true is that 500 mm is coarse relative to the small
  series and that a tile grid is not a building coordination grid. This deserves a fetch.
- EVIDENCE STATUS: PENDING — possible CONTRADICTED sub-claim
- ACTION: QUALIFY if confirmed: "a 500 mm tile is 5M in the ISO series, but ISO coordination also
  governs tolerances/series the tile cannot express; do not claim ISO compliance."
- WHAT WOULD CLOSE IT: fetch the ISO 2848 sample PDF.

## A-12 — Standards quoted with numbers in architecture-theory (code/standard tier)
- TH-12 IBC §1005: 0.3 in/7.6 mm stair (0.2 in/5.1 sprinklered), 0.2 in/5.1 other egress components
  (0.15 in/3.8 sprinklered); 44 in >50 occupants, 36 in ≤50; 32 in door clear width; 150 ft²/person.
- TH-13 ADA §304.3.1 60 in turning circle; §304.3.2 T-shape in 60 in square, arms/base 36 in;
  §305.3 30×48 in.
- TH-24 England NDSS: 7.5 m² single / at least 2.15 m wide; 11.5 m² double; 39 m²–138 m² dwelling
  range; storage to 4.0 m²; 2.3 m min height over 75 % of GIA with the wheelchair caveat.
- TH-26 EN 17037: 300 lx median over ≥50 % of the reference plane; 100 lx over ≥95 %; ≥50 % of
  daylight hours (2190 h); plane at 0.85 m; the 1 m perimeter strip as UK national deviation.
- PROBLEM: these are the strongest numbers in the file and they are all T1/T2 with URLs. One
  structural criticism: **every verbatim value in TH-26 was read from a PMC practice study, not from
  BS EN 17037 itself** — the file says so, which is honest, but the Class is then "CODE REQUIREMENT"
  on second-hand reading. The grid translations are internally correct (checked: 44 in = 1117.6 mm ≈ 3
  tiles; 36 in = 914 mm ≈ 2 tiles; 7.5 m² = 30 interior tiles; 11.5 m² = 46; 1525 mm = 3.05 tiles;
  1220 mm = 2.44 tiles; 2.1 m glazing head ≈ 4 tiles; wall-tax arithmetic in TH-02 and the octile
  arithmetic in TH-11 all check out exactly).
- EVIDENCE STATUS: PENDING (two fetches: ADA ch.3, NDSS page)
- ACTION: KEEP.

## A-13 — Internal inconsistency: TH-12's comfort aside
- CLAIM (TH-12 Exceptions): "two people passing shoulder-to-shoulder need roughly 1.1–1.2 m, i.e. 3
  tiles, which is `UNCITED — heuristic` (Confidence Low)".
- PROBLEM: honest label, but note the 3-tile conclusion over-builds: 1.2 m is 2.4 tiles → ceil = 3
  tiles. Correct. No action.
- EVIDENCE STATUS: UNVERIFIED (self-labelled) — ACTION: KEEP.

## A-14 — Books cited in professional-practice.md / real-projects.md
- HBN 04-01 (T1) with a verbatim "≤15 beds" quote — see B-01.
- NIST TN 1727 (T2) — see B-04.
- No Neufert/Time-Saver/Ching/Panero attributions were found in the other two files beyond these, so
  the book-risk is concentrated in architecture-theory.md. **This is itself a finding worth stating:
  the two files that carry the operational numbers barely lean on unquotable books; the theory file
  does, and labels it.**

---

# PART B — PRACTITIONER CLAIMS (professional-practice.md)

## B-01 — PP-03 "one soiled utility per ≤15 beds" (HBN 04-01, T1)
- CLAIM (Rule + Consensus map row "Housekeeping / linen logistics … Strong: ≤15 beds per soiled
  utility"): "Official healthcare guidance states 'ideally, a dirty utility room should serve no more
  than 15 beds…'", plus "schedules assume **two** dirty utility rooms per 24-bed ward (HBN 04-01
  §4.69, T1)".
- SOURCE AS CITED: NHS England HBN 04-01 PDF (england.nhs.uk).
- WHAT THE SOURCE ACTUALLY SAYS: **could not be opened.** Both fetch attempts on
  `england.nhs.uk/.../HBN_04-01_Final.pdf` returned corrupted/unrelated binary (one returned the text
  of an unrelated German ecology paper). A search for the phrase does surface HBN 04-01 and its Welsh
  twin WHBN 04-01 as the governing documents, but no retrievable text carrying the sentence.
- PROBLEM: this is the file's **only T1 anchor for a hard numeric threshold that a Grid translation
  turns into an assertion** (`assert count ≤15 (beds) or ≤14 (guest rooms)`), and it is unverifiable at
  the cited URL. The quote's own wording defeats the rule: "**ideally** … should serve no more than 15
  beds" is aspirational good practice, not a requirement, yet the Rule states it as a cap and the
  `## Consensus map` grades the topic "**Strong**: ≤15 beds per soiled utility" at tier T1. Worse, the
  hospitality half of the same sentence — "one pantry per floor" — and the "≤14 guest rooms" validator
  come from T4 staffing/vendor sites, so the Rule's Confidence line ("High") is doing work the evidence
  cannot do. Secondary: "§4.69" paragraph number and the "two dirty utility rooms per 24-bed ward"
  schedule claim are also unverified.
- EVIDENCE STATUS: UNVERIFIED (plausibly genuine NHS guidance; passage not retrievable)
- ACTION: QUALIFY — re-mark as "best-practice recommendation (NHS HBN 04-01, wording 'ideally');
  advisory, not a hard assert"; downgrade the consensus-map row from "Strong/T1" to "Single-source
  standard, text not verified"; and separate the T1 bed figure from the T4 guest-room figure.
- WHAT WOULD CLOSE IT: the HBN 04-01 paragraph itself (a legible mirror or the NHS Wales WHBN 04-01
  PDF), or a documented page/paragraph locator.

## B-02 — PP-13 desire-line detour threshold 20–30 % (Helbing via UW–Madison News)
- CLAIM (rule title + `## Consensus map` row "Circulation that works on paper … T2/T3 for the 20–30%
  threshold"): "'travelers will form a desire path if the prescribed route is 20 to 30 percent longer'".
- SOURCE AS CITED: news.wisc.edu article (T3 reporting T2); Access Board ch. 4 (T1) for the principle.
- WHAT THE SOURCE ACTUALLY SAYS: article confirmed to exist (UW–Madison News, 2019-04-24, exact title
  as cited). **The threshold figure did not reproduce.** One read returned
  "travelers will **take a path 10 percent longer** than the prescribed route" rather than "form a
  desire path if the prescribed route is **20 to 30 percent** longer"; a second read returned only page
  chrome. A phrase-search for "20 to 30 percent longer" returns this same article as its only hit, so
  the article may carry both statements (a 10 % willingness-to-walk figure and a 20–30 % formation
  threshold) and my reads were lossy — but **the exact wording PP-13 quotes could not be reproduced
  twice, and the primary Helbing publication was never consulted by anyone in this chain.**
- PROBLEM: the file is honest about the tier (`## Weak or contested`: "attributed to Helbing in a
  university news article (T3 reporting T2); the primary publication was not retrieved. Screening
  heuristic only"), and Class HEURISTIC / Confidence Medium is right. The failure is downstream: the
  **rule headline converts it into a threshold** ("detour >20–30% and people leave the path") and the
  Grid translation asserts a hard flag at 1.25 — a number that may be 1.10. A validator wired to a
  news-article percentage is the exact "practitioner number wearing code clothing" pattern.
- EVIDENCE STATUS: PARTIALLY SUPPORTED (source exists, concept solid) / **quote UNREPRODUCED**
- ACTION: QUALIFY — rewrite the headline as "screen any OD pair whose detour ratio exceeds a tuneable
  threshold (published figures range 1.1–1.3; news-sourced, not primary)" and stop asserting 1.25.
- WHAT WOULD CLOSE IT: Helbing et al., *Nature* 407 (2000) "Self-organized path formation" (or the
  follow-up PNAS/Physica A papers) checked for the actual percentage.

## B-03 — PP-23 late-change / clash-detection 10–50× multiplier
- CLAIM (Rule headline "late changes cost 10–50× more"): "coordination clashes found on site cost 10
  to 50 times more than clashes found in design" (T3 = CCC Engineering memo); plus CII ~5 % (range
  2–20 %) rework; PlanGrid/FMI >$31 B/yr, miscommunication 26 %, documentation 14–22 % = "48 %"; Love
  (2002) 52 % of cost growth.
- SOURCE AS CITED: openspace.ai blog (T3 citing CII/PlanGrid/Love), cccengineering.com.au memo (T3),
  NIST TN 1727 (T2).
- WHAT THE SOURCE ACTUALLY SAYS — 10–50× (CCC Engineering memo, fetched): verbatim
  **"Coordination clashes found on site cost 10 to 50 times more than clashes found in design."**
  Same page gives BIM coordination at "$2–5/m²" saving "5–10% of construction cost". **No external
  source is cited for the multiple** — it is the memo author's assertion. So the file quotes the memo
  accurately and correctly grades it T3.
- WHAT THE SOURCE ACTUALLY SAYS — OpenSpace rework blog (fetched): the numbers **do not match the
  file's transcription.** Re-read of the cited page returned: CII direct rework **4.89 %, range
  1.0–35 %**; PlanGrid/FMI **47 %** miscommunication / **26 %** documentation / **$15.5 B**; Love (2002)
  **12 %**. PP-23 states: "~5 % … range **2–20 %**"; ">$31B/yr"; "miscommunication driving **26 %** and
  bad documentation … a further **14–22 %**, i.e. **'48 % of rework … ties directly to information
  failures'**"; Love (2002) "**52 %** of total cost growth". The 5 % is fine; **the range, the dollar
  total, the two percentages (apparently transposed), the derived 48 % and the Love figure all
  conflict** with what the same URL returns. (Some of the divergence may be sub-reader lossiness —
  but it is the *direction of a headline claim*, so it cannot be waved away.)
- PROBLEM: the Rule headline is a hard multiplier ("late changes cost 10–50× more") resting on an
  unaudited contractor memo with no citation, while the supporting statistics that give it the
  appearance of triangulation do not survive a second read. `## Consensus map` claims
  "Late change / revision churn | **6** independent sources | T2 | Strong direction" and PP-23's
  Evidence says "**cross-checked: yes**" — that is the file's strongest self-assertion of diligence in
  the audit's scope, and it is the one that breaks. Note the internal honesty is real but incomplete:
  Confidence is correctly "High (direction), **Low (any single multiplier)**", and `## Weak or
  contested` disowns "all dollar-per-square-metre figures in PP-18 and PP-19 — one Australian
  engineering memo, unaudited". **The disavowal and the headline coexist: PP-23's title still asserts
  the memo's 10–50× as fact. This is the exact defect class the brief asked to find.**
- EVIDENCE STATUS: 10–50× = **PARTIALLY SUPPORTED** (quote verified, source is an uncited vendor memo);
  rework statistics = **CONTRADICTED as transcribed**
- ACTION: QUALIFY the headline to "late change is the dominant cost lever; the widely quoted 10–50×
  multiple is an uncited engineering-memo assertion" and **REPLACE** the CII/PlanGrid/Love numbers
  either with figures re-derived from the primaries (CII, PlanGrid/FMI 2018 report, Love 2002) or by
  deletion. Also downgrade "cross-checked: yes" → "cross-checked: direction only".
- WHAT WOULD CLOSE IT: the PlanGrid/FMI "Uncovering the Cost of rework" report itself, and Love (2002),
  *Managing the Causes of Construction Rework* (Cost Engineering) — none of which is in the source list.

## B-04 — "Rework ~5 % of project cost / NIST / Love 2002" and PP-19's "one-third from design phase"
- CLAIM (PP-23, PP-19): rework magnitude attributed to CII and PlanGrid/FMI via OpenSpace; long-run
  origin of operational faults "~one-third from design phase (T2, PP-19)".
- SOURCE AS CITED: NIST TN 1727 (T2) is the strongest anchor for the persistence/one-third claim.
- WHAT THE SOURCE ACTUALLY SAYS: PENDING (NIST PDF fetch).
- PROBLEM: NIST TN 1727 is a real, citable federal report on building-quality persistence; the CII and
  PlanGrid/FMI figures are industry-association numbers reaching the file only through a vendor blog.
  Honest cross-check label already present ("cross-checked: yes — direction confirmed by T2 …").
- EVIDENCE STATUS: PENDING
- ACTION: KEEP.

## B-05 — Consistency audit: does `## Consensus map` / `## Claims that did NOT survive` match usage?
- Checks run so far (no web needed):
  1. `## Weak or contested` disowns "Open-plan doubles complaints (PP-16)" as office-only odds ratio →
     PP-16's own text and the consensus row "Acoustic complaints (#1 post-occupancy?) … Survives only
     for workplaces, and only for *speech*" agree. **Consistent.**
  2. `## Claims that did NOT survive` item 6 kills the "70 % check-in" and "5-minute wait = 15 % score"
     numbers → `## Consensus map` row "FOH queues / group check-in … vendor percentages unusable"
     agrees. Need to confirm no rule still uses them (PP-08 line 294 does reference "(see *Claims that
     did NOT survive*, item 6)" — appears disowned **and** not used). **Consistent so far.**
  3. Item 2 kills "single patient rooms / decentralised nurse stations improve observation" →
     `## Consensus map` "Hospital sightlines / isolation | Provisions settled; performance claims are
     not" agrees; PP-20 must be checked for residual use. **Pending grep of PP-20.**
  4. Item 1 reframes "noise is the #1 complaint" with the CBE 54 % / 62,360-respondent dataset →
     the consensus row agrees. **Consistent.**
  5. Item 4 demotes WHO ICU noise limits → check PP-16 does not still brief WHO numbers.
  6. **Discrepancy candidate:** `## Consensus map` claims "Independent sources | Strongest tier" counts
     (e.g. "Late change / revision churn | 6") — these are self-reported and unverifiable without the
     reading log; the map is a claim about the file's own diligence, not about the world.
- EVIDENCE STATUS: PARTIALLY SUPPORTED (self-consistency good on the six checks run; three pending)
- ACTION: KEEP the file's structure; the honest-disavowal discipline in professional-practice.md is
  materially better than in the other two files.

## B-06 — Noise/queue heuristics flagged by the brief
- Queue heuristics: PP-08 (front-of-house queue, transaction-minute arithmetic, T4 ×2) — `## Weak or
  contested` concedes transaction arithmetic is T4 and turndown "produced no usable source at any
  tier". Desire-line: B-02. ≤15 beds: B-01.
- ACTION: KEEP with QUALIFY on any T4 number appearing as an assertion in a Grid translation.

---

# PART C — PROJECT / CASE CLAIMS (real-projects.md)

## C-00 — Advocacy-attribution claim (the file's own defence)
- CLAIM (`## Weak or contested`, "Outcome claims from promotional project reporting"): "'Transfers
  down more than 70 %', 'stay from just over four days to under three', 'no sustained pathogen
  transmission', 'highest BREEAM score for an office at the time' are as stated by the project's own
  architects or the operator, with no study design, comparator or confound control disclosed."
- PROBLEM: the label is correct **and** RP-08's Confidence line reads "High (three types, with outcome
  data in one)" — i.e. the one case whose evidence is advocacy is what raises the confidence. Also
  RP-08/RP-23's Rules re-use the numbers as design justification, and `## Type-specificity audit`
  lists RP-08 with "hospital (Paimio, GCUH)". Note "no sustained pathogen transmission" appears in the
  disavowal list but not in any rule I read (likely residue from a scrapped case) — a small
  internal-integrity question: the disavowal mentions a claim the file no longer contains.
- EVIDENCE STATUS: PARTIALLY SUPPORTED (honest label; confidence line inconsistent with it)
- ACTION: QUALIFY — RP-08 Confidence High → Medium-High and drop "outcome data" as the booster.

## C-01 — CR-06 / RP-08 / RP-23 — Gold Coast University Hospital (Hassell/ArchitectureOne/STH, 2013)
- CLAIMS: 175,000 m²; "a seven-storey atrium runs through the building, drawing daylight down through
  every floor"; single-occupancy rooms cut "ward-to-ward patient transfers by more than 70 per cent";
  "average patient stay has fallen from just over four days to under three"; "more than 5,000 people
  work at the facility"; "evidence-based design" framing; single bed per room on the edge.
- SOURCE AS CITED: archipro.com.au project page (T3) + hassellstudio.com (T3).
- WHAT THE SOURCE ACTUALLY SAYS:
  - **ArchiPro (the URL the Rules RP-08/RP-23 and CR-06 cite first): HTTP 403 — could not be opened.**
  - **Hassell studio page (listed only in CR-06 and the Sources block): opened, and every figure is
    verbatim present** — "single-occupancy rooms have reduced ward-to-ward patient transfers by **more
    than 70 per cent**"; "average patient stay has fallen from **just over four days to under three**";
    "**seven-storey atrium** … daylight"; "**175,000 m²**"; "**more than 5,000** people work"; and the
    "**evidence-based design**" framing the file quotes. Existence + architect + type confirmed.
  - **Attribution is exactly what the file claims it is:** the page states the hospital itself keeps
    this data and offers no study design, comparator, or confound control. So these are
    **operator/architect self-reports, not measured effects** — and real-projects.md's `## Weak or
    contested` says precisely that in a named bullet.
- PROBLEM: none in the citation honesty; two remain in use. (1) RP-08's Confidence line "High (three
  types, **with outcome data in one**)" upgrades the rule on the strength of the advocacy figures the
  same file disowns (C-00). (2) The Grid translation converts a promotional narrative into a hard
  geometric rule (`facade_tiles ≥ 2`, `min_depth_to_facade ≤ 24 tiles`) whose only clinical
  justification is the 70 % / 4→3 pair. (3) Minor: the file's *primary* URL for this case is
  bot-walled, so the second, weaker-linked Hassell page is the only live support.
- EVIDENCE STATUS: **SUPPORTED as "the cited page says this"; PARTIALLY SUPPORTED as design
  justification** (advocacy-origin, correctly labelled)
- ACTION: KEEP the case record; **QUALIFY** RP-08's Confidence to Medium-High and add "self-reported
  by the operator; no comparator" inline at first use in the Rule, not only in the back-matter.

## C-02 — CR-07 / RP-09 — Sunshine Coast University Hospital (Hassell)
- CLAIMS: A$1.8 billion; "twenty-hectare greenfield site"; "six-storey, deep-plan West Building";
  L-shaped units as "twinned, narrow, single-corridor 'fingers'"; "four light wells rising through the
  full height"; north–south courtyard spine "divides the hospital into two principal blocks"; main
  street with retail/café/seating; "natural ventilation, although this ambition was ultimately ruled
  out for clinical reasons"; subfloor void breezes; "nine-storey public carpark along the western
  boundary".
- SOURCE AS CITED: architectureau.com article "Social healing" (T3).
- PENDING: fetch. Note RP-03's Evidence mis-attributes the nine-storey carpark to "Gold Coast and
  Sunshine Coast universities hospitals … with a nine-storey public carpark placed along the western
  boundary" — the carpark is an SCUH feature appearing inside a sentence that begins with both
  hospitals; check whether that reads as a wrong-project attribution.

## C-03 — CR-01 / RP-01/02/05/13/14/15/25 — Unité d'Habitation, Marseille (Le Corbusier, 1945–52)
- CLAIMS: 135 m × 24 m × 56 m; **330 dwellings**; "shopping streets on the 7th and 8th floors"; "system
  of interior streets"; duplexes "on two floors connected by a staircase"; repeated first module
  combining "entrance, the hallway, the kitchen and the living room"; `brise soleils`; **300 m² roof
  terrace with "a running track, a gymnasium"**; rehousing as government priority.
- SOURCE AS CITED: Fondation Le Corbusier achievements page (T3) + lecorbusier-worldheritage.org (T3).
- WHAT THE SOURCE ACTUALLY SAYS (Fondation Le Corbusier page, opened): dimensions **135 m × 24 m × 56 m
  — confirmed exactly**. Roof terrace **300 m² with a running track and a gymnasium — confirmed
  verbatim**. Reinforced-concrete frame built on the Modulor — confirmed. **Dwelling count = 337, and
  the page states "accommodation for 1,600 inhabitants" and "twenty-six shop types" plus two hotel
  rooms.** The file says **330 dwellings**.
- PROBLEM: **CONTRADICTED on the one quantitative field the rules actually use.** 330 appears in
  RP-05 ("a 135 m × 24 m × 56 m block hold 330 dwellings"), CR-01, and RP-13's Evidence ("so 330
  dwellings had a shared table"). It is a plausible popular-accounting figure (330/337 both circulate,
  and the Unité's original programme is sometimes given as 1,600 persons/330 units), but the file
  cites the Fondation page — the publisher of the correct number — and misquotes it. Second, smaller
  issue: the fetched summary rendered the shop street as "third and fourth floors" while the file
  consistently says 7th/8th; the Fondation's own French numbering puts the rue intérieure at levels 7
  and 8, so the file is probably right and the sub-read may be renumbering — **flag, not fault**.
  Third: the "shopping street" is load-bearing for RP-02 and RP-25 as the *documented inversion* of
  the ground-floor-public rule; that part of the argument survives (the street is mid-stack, both
  sources agree).
- EVIDENCE STATUS: **SUPPORTED** on dimensions, terrace, structure, mid-level street;
  **CONTRADICTED** on dwelling count (337 vs 330)
- ACTION: **REPLACE** "330 dwellings" with "337 dwellings (Fondation Le Corbusier; 1,600 inhabitants)"
  in RP-05, CR-01 and RP-13. Everything else: KEEP.

## C-04 — CR-02 — Habitat 67 (Moshe Safdie, 1967)
- CLAIMS: 365 prefabricated modules → 158 residences; 238,000 sq ft; modules "participate as
  load-carrying members"; each residence "its own roof garden"; "access to the dwellings is directly
  off" the access streets.
- SOURCE AS CITED: safdiearchitects.com/projects/habitat-67 (T3).
- PENDING fetch. The 357-module / 146-unit figure is the other commonly cited pair — verify which the
  Safdie page states (both variants circulate; 365/158 is the Safdie-office number).

## C-05 — CR-03 / RP-25 — The Interlace (OMA/Ole Scheeren)
- CLAIMS: "Thirty-one apartment blocks, each six stories tall and identical in length"; "hexagonal
  arrangement around eight large-scale open and permeable courtyards"; 170,000 m² built floor area;
  "over 1,000 residential units"; "vertical village"; rejects "a cluster of isolated, vertical towers".
- SOURCE AS CITED: oma.com/projects/the-interlace (T3).
- PENDING fetch.

## C-06 — CR-04 / RP-22, RP-26 — Nakagin Capsule Tower (Kisho Kurokawa, 1972; demolished 2022)
- CLAIMS: 140 capsules of 2.5 × 2.5 × 4 m around two cores; capsules "expected to be replaced roughly
  every 25 to 35 years"; demolished 2022; "twenty-three capsules were salvaged".
- SOURCE AS CITED: designboom article (T3).
- PENDING fetch. Existence/architect/type are safe; the 140-capsule count (137 extant / 140 installed)
  and the 23-salvaged figure need confirmation.

## C-07 — CR-05 / RP-05/08/10/13/16 — Paimio Sanatorium (Aalto, 1933)
- CLAIMS: patient wing "oriented directly southward" with sun balconies; "each patient room was planned
  for two people"; taps angled to "prevent noise and splashing"; "cupboards were hung for ease of floor
  cleaning"; "yellow rubber flooring in the corridors"; "soft tones with darker ceilings"; "windows
  were designed to be draft proof"; "healing environments that emulate nature".
- SOURCE AS CITED: PMC "Humanizing the hospital: Design lessons from a Finnish sanatorium" (T2).
- WHAT THE SOURCE ACTUALLY SAYS (PMC2917967, opened): article exists, title matches verbatim
  ("Humanizing the hospital: Design lessons from a Finnish sanatorium"), Paimio/Aalto correct, and
  **every quoted phrase the file uses is present**: "planned for two people", sun balconies oriented
  southward, tilted/faucet angling "to prevent noise", "cupboards hung for ease of floor cleaning",
  "yellow rubber flooring in the corridors", "soft tones with darker ceilings", "draft proof" windows,
  and "healing environments that emulate nature".
- PROBLEM: none found in the citation. Residual and worth stating: this is a **design-history review
  article, not a measured study**, and it is the *only* support for five rules (RP-05, RP-08, RP-10,
  RP-13, RP-16, RP-24) — a single-source dependency the `## Weak or contested` section does not list
  among its gaps. RP-05 in particular converts "each patient room was planned for two people" (a
  historical fact about one building) into evidence for a *module-first* rule.
- EVIDENCE STATUS: **SUPPORTED** (quotes and existence) / concentration risk noted
- ACTION: KEEP; add "single T2 review article, five rules depend on it" to the Gaps bullet.

## C-08 — CR-08 / RP-13, RP-16, RP-24 — Maggie's West London (Richard Rogers/RSHP, 2008)
- CLAIMS: designed "without resorting to area schedules and data sheets"; "a series of four 'tables'";
  two-storey central volume with a wood-burning stove; "notion of the 'hearth' as a focal space"; rooms
  "from about 1 m² up to 50 m²"; "domestic in scale, making people feel instantly at home"; each zone
  "split into an internal space and an external terrace".
- SOURCE AS CITED: Architects' Journal Rogers interview (T3); Maggie's brief PDF conceded unreadable.
- PENDING fetch. Note the file's own `## Weak or contested` already limits the inference ("not a
  general recommendation") — good.

## C-09 — CR-09 / RP-01/03/07/17/23/25 — Fogo Island Inn (Todd Saunders, 2013)
- CLAIMS: 4,500 m² gross; 29 guest rooms "from 350 square feet to 1,100 square feet"; two-storey W→E
  volume + four-storey SW→NE volume holding "all the guest rooms"; level 1 reception/dining/kitchen/
  laundry/storage/mechanical; levels 3–4 guest rooms; "highly insulated steel frame" with local Black
  Spruce, triple glazing; two cisterns; solar thermal; per-floor ventilation with heat recovery;
  vacuum toilets; "hits the land directly without impacting the adjacent rocks, lichens and berries".
- SOURCE AS CITED: gooood.cn (T3) + ArchDaily + BuildingGreen.
- PENDING fetch. Widely reported figures are 4,500 m² and 29 rooms — plausible; the 350–1,100 sq ft
  range and the volume orientation text need the gooood page.

## C-10 — CR-10 / RP-01, RP-25 — Marina Bay Sands (Safdie Architects)
- CLAIMS: casino/convention/shops/museums in the podium; **~2,600 guest rooms** in three towers; linked
  at the **fifty-seventh floor**; "2.5-acre garden" SkyPark; **151 m** infinity pool; "steel bridges
  suspend the park above concrete columns"; "seamlessness of indoor and outdoor public space".
- SOURCE AS CITED: safdiearchitects.com project page (T3).
- PENDING fetch. MBS is commonly given as 2,560 rooms / SkyPark at ~191 m / 20 ha? — the "2.5-acre
  garden" (≈1 ha) figure is the standard SkyPark area. Check the 57th-floor number: the SkyPark sits
  on level 57 of the towers, consistent.

## C-11 — CR-11 / RP-04, RP-08, RP-18, RP-26 — The Edge, Amsterdam (PLP Architecture)
- CLAIMS: 40,000 m² / 430,556 ft²; Deloitte HQ; multi-storey atrium as "social condenser"; "exposed
  lift cores"; "massing tailored to daylight"; sensors measuring "occupancy, movement, humidity, CO₂,
  light levels and internal climate"; "achieved the highest BREEAM score awarded to an office building
  at the time".
- SOURCE AS CITED: PLP page (T3) + ArchDaily (T3).
- PENDING fetch (PLP page is the weak link: it is a project page and the BREEAM superlative is
  self-reported — must be labelled advocacy). The conversion 430,556 ft² ≈ 40,000 m² is correct.

## C-12 — CR-12 / RP-08, RP-23 — Commerzbank Tower (Foster + Partners, 1997)
- CLAIMS: 300.1 m, 56 storeys, 109,200 m² floor area; "rounded equilateral triangle with a central,
  triangular atrium"; "at nine different levels, the atrium opens up to one of the three sides,
  forming large sky gardens"; "constructed in steel rather than the conventional (and cheaper)
  concrete"; "green skyscraper" client framing.
- SOURCE AS CITED: **Wikipedia (T4) as the figure source, because "page body not retrievable" for
  Foster + Partners (T3)** — the file says so. This is the clearest tier-substitution in the register:
  quantitative data (height, storeys, GFA) sourced from an encyclopedic page while the Sources list
  keeps the T3 practice page attached, and RP-08's Source line reads "Foster + Partners — T3 (page body
  not retrievable; figures cross-checked at Wikipedia — T4)". Honest, but the "T3" label on the rule's
  Source line will mislead a skimmer.
- PENDING: verify the numbers (300.1 m / 56 storeys / 109,200 m² / nine sky gardens) against one fetch.

## C-13 — CR-13 / RP-04, RP-12, RP-27 — Bullitt Center (Miller Hull, 2013)
- CLAIMS: six-storey office; glulam columns; "244 kW array"; "56,000-gallon cistern"; "foam-flush
  composting units"; stairs in the "glazed north-west corner" "to encourage usage"; "oversized solar
  canopy"; "US $32.5 million"; "250-year building"; "as much regulatory as technical".
- SOURCE AS CITED: Studio Matrx guide (T4) as the primary inline source for RP-04/RP-12/RP-27, with
  Miller Hull (T3) and the Bullitt case-study PDF (T3) listed in the case register.
- PROBLEM: RP-12's Evidence narrates Miller Hull data from a T4 teaching guide. The 56,000-gallon
  cistern and 244 kW array are standard published Bullitt facts (plausible), but the rule chain leans
  on the T4. PENDING fetch of the Studio Matrx page or Miller Hull page.

## C-14 — CR-14 / RP-14, RP-16, RP-17 — Saunalahti School (VERSTAS, 2012)
- CLAIMS: ~10,000 m² for 750 students (→ 13.3 m²/place, explicitly the file's own arithmetic); school +
  "day care centre, preschool and a youth house"; "home areas"; "classrooms group around small lobbies
  for collaboration"; "living room of the whole neighbourhood"; 2007 competition, completed 2012.
- SOURCE AS CITED: finland.fi (T3), Divisare (T3), ArchDaily (T3).
- PENDING: fetch Divisare (checks both existence and the URL-resolves-to-described-project test, and
  note RP-14/CR-14 give two different Divisare slugs — `…andreas-meichsner-saunalahti-…` vs
  `…andreas-meichsner-tuomas-uusheimo-saunalahti-…`; one of them is likely a bad URL).

## C-15 — CR-15 / RP-18 — Fagus Factory (Gropius & Meyer, 1911–13)
- CLAIMS: corner glass with "no column, no pier, nothing where the eye expects the most support"; wall
  as "a screen hung on the building"; "workers who deserve light and air"; UNESCO WHS 2011; still a
  working factory.
- SOURCE AS CITED: Studio Matrx canon note (T4) + ArchDaily AD Classics (T3).
- PROBLEM: the poetic quotations are attributed to a T4 canon note; `## Weak or contested` already
  flags the worker-welfare motive as contested narrative and takes only one transferable claim. Good
  hygiene. Existence/architect/type safe.

## C-16 — CR-16 / RP-12, RP-18 — Gläserne Manufaktur, Dresden (VW, 2001)
- CLAIMS: floors "covered entirely in Canadian maple"; "up to 250 tourists per day"; painted bodies by
  truck, parts by CarGoTram; "production ended December 2025".
- SOURCE AS CITED: Wikipedia (T4).
- PROBLEM: T4-only, and the "production ended December 2025" item is a recency claim that must be
  checked (and is the kind of fact that changes). RP-02's Exceptions also cite it as "Gläserne
  Manufaktur, Dresden" for visitor gallery above production.

## C-17 — CR-17 / RP-15, RP-21 — Selfridges Birmingham (Future Systems, 2003)
- CLAIMS: 14,864 m² (160,000 sq ft) over six floors; "steel framework with sprayed concrete facade";
  wraps "the corner of Moor Street and Park Street"; "interior escalators".
- SOURCE AS CITED: Wikipedia (T4) + RIBA Journal (T3).
- PENDING fetch. 160,000 sq ft → 14,864 m² conversion is exact.

## C-18 — CR-18 / RP-04, RP-09(implied), RP-23, RP-24, RP-26 — Sendai Mediatheque (Toyo Ito)
- CLAIMS: "a forest of 13 non-uniform tubes"; seven levels; "flat concrete slabs (honeycomb steel
  plates with concrete) penetrated by 13 tubes"; "walls on each floor are kept to an absolute minimum";
  functions "freely distributed".
- SOURCE AS CITED: Architectuul (T3) + ArchDaily AD Classics (T3).
- PENDING fetch (the 13-tube and seven-level numbers are standard).

## C-19 — CR-19 / RP-01/02/10/13/14/15/23/24 — Oodi (ALA Architects, 2018)
- CLAIMS: 17,100 m² over three floors; "zero-threshold" ground floor; "recording and editing studios,
  maker space, movie theater"; top level "calm and contemplative … floating above the busy central
  Helsinki"; "double helix stair"; "arching wooden volume".
- SOURCE AS CITED: ala.fi (T3) + Dezeen (T3).
- PENDING fetch of the Dezeen URL (also the "URL resolves to the project described" test, and the cited
  Dezeen slug is dated 2019-01-10 — check it exists).

## C-20 — CR-20 / RP-03, RP-11, RP-15 — Kansai International Airport terminal (RPBW, 1988–94)
- CLAIMS: "1.7 km long, making it the longest terminal in the world"; "accommodate 100,000 passengers
  per day"; "open departures level"; "the 42 boarding gates … housed within the 'wings'";
  "three-dimensional beams spanning 80 m"; "a rational geometry that ensures functional efficiency".
- SOURCE AS CITED: rpbw.com (T3) + Fondazione Renzo Piano (T3).
- PENDING fetch. The "longest terminal in the world" superlative is the practice's own and must be
  attributed as such (the file quotes it as a practice description, acceptable). The 42-gate number
  appears inside RP-03's Rule-supporting Evidence as "the 42 gate 'wings'" — check the article says
  42 gates, not 42 wings.

## C-21 — CR-21(h) — FGI Guidelines room-size increases
- CLAIM: "multiple-infant rooms increased from 120 square feet to 150 square feet per patient",
  "single-infant rooms increased from 155 square feet to 180 square feet".
- SOURCE AS CITED: Consulting-Specifying Engineer on the 2022 FGI Guidelines (T3); the FGI PDF is
  listed as "too large to parse".
- PROBLEM: a code-derived number reaching the file through a trade magazine, with the primary PDF
  admittedly unread. The class of the receiving rule (RP-17 is "HEURISTIC (also argued as: / CODE
  REQUIREMENT)") inherits this. Also see D-02 about the malformed class fields.

## C-22 — T4 vendor numbers used as plan budgets
- CLAIMS: hotel 28–30 / 32–38 / 40 m²+ guest rooms, suites 55–75 m²; corridors 1.22 m min, "typically
  1.5 to 1.8 m"; 65–72 % net-to-gross double-loaded; BOH 15–25 % of gross; kitchen 0.5:1 / 0.3:1; "one
  [lift] station per 75 guest rooms"; dead-end 6.1 m sprinklered / 15.2 m; warehouse shares 50–65 /
  8–12 / 8–12 / 5–10 / 5–10 %; 1 dock per 1,000–1,500 m²; sill 1.20 m; apron 12 / 18–22 m; aisles
  3.5–4.0 / 2.7–3.0 / 1.5–1.8 m; 12 m bay; SEMA 75/75/100 mm; BS EN 12845 "normally 1 m"; retail
  coverage 35–45 / 25–35 / 15–25 %; decompression 1.5–3 m; Hesse kindergarten ≥2.80 m height, ≥2.00 m
  corridor, 20–25 children.
- PROBLEM: **these all appear in `Grid translation` as numeric test thresholds** (RP-04 "≤75 rooms per
  lift portal", RP-06 budget bands, RP-07 "target 0.15–0.25", RP-12 plant shares per type, RP-19 tile
  aisles, RP-20 dock counts, RP-21 main walk ≥3 tiles) while the sources are a hotel-design blog, a
  hotel-development SEO guide, a steel-builder layout guide, a racking vendor, a retail-design AI
  vendor, and a sanitaryware vendor's summary of German state rules. The file's `## Weak or contested`
  does disown the denominators and says RP-04–RP-07 are written as "measure and publish, never as
  'must equal'" — **but RP-19's Class line says "CODE REQUIREMENT (also argued as: / ENGINEERING
  CONSTRAINT)" while its only sources are two T4 vendor pages and the SEMA text is "reported
  second-hand".** That is a class-vs-evidence mismatch: a vendor page cannot make a rule a code
  requirement.
- EVIDENCE STATUS: PARTIALLY SUPPORTED (numbers agree across vendors; tier cannot support the Class)
- ACTION: REPLACE RP-19's Class with HEURISTIC/ENGINEERING CONSTRAINT, or fetch a SEMA/HSE primary.
  Also re-verify the dead-end corridor figure against IBC (the file flags it; `building-codes.md` is
  the place, not this audit).

## C-23 — RP-13 internal arithmetic inconsistency (no web needed)
- CLAIM: Rule text: hearth "within 20 tiles of the entry"; Grid translation:
  "`A*(entry_door_tile, hearth_centroid) ≤ 40 tile-steps (≈ 20–28 m)`".
- PROBLEM: 20 tiles = 10 m, 40 tile-steps = 20 m — the Rule and its validator differ by 2×, and the
  parenthetical "≈20–28 m" is itself wrong for a cost metric that already returns length (40 tile-steps
  = 20 m exactly, not a range).
- EVIDENCE STATUS: CONTRADICTED (internally)
- ACTION: QUALIFY — pick one: `≤ 40 tile-steps (20 m)` in both places.

## C-24 — URL-resolution sweep (batched)
Targets whose URLs must resolve to the project described: ArchiPro GCUH, Hassell GCUH,
architectureau SCUH, Fondation Le Corbusier Unité, Safdie Habitat 67, Safdie MBS, OMA Interlace,
designboom Nakagin, PMC2917967 Paimio, Architects' Journal Maggie's, gooood Fogo, PLP The Edge,
ArchDaily The Edge, ArchiDaily Saunalahti + both Divisare slugs, ala.fi Oodi, Dezeen Oodi, rpbw Kansai,
Architectuul Sendai, Wikipedia Commerzbank/Selfridries/Gläserne, fosterandpartners Commerzbank,
millerhull Bullitt, bullittcenter.org PDF, ribaj Selfridges, ArchDaily Fagus/Sendai, studiomatrx pages,
pebsteel, umstoragesystems, oxmaint, retaildesign.ai, hewi, archgyan, hoteldevelopmentguide,
studiopuisto, beforeitopens, tumihospitality, loomisbros, csemag, england.nhs.uk HBN 04-01,
openspace.ai, cccengineering.com.au, nvlpubs.nist.gov NIST.TN.1727, news.wisc.edu,
access-board.gov, england gov.uk NDSS, up.codes, spacesyntax.com, archive.org Neufert PDF,
patternlanguage.cc, arxiv 0709.4375, amst winter-verlag, huduser def.pdf, iso.org / iTeh ISO 2848,
tsrgd mfs2.pdf, wbdg.org, forakergroup.org, gdsatx.com, vantagespace.com, harth.build, adsimulo,
peters-research, beckwithhouseinteriors, emerald, cogitatiopress, onlinelibrary.wiley, ansteyhorne,
standards.iteh EN 17037, pmc10773465, researchgate figure 2/publication, searchworks.stanford.edu,
cus.ubt-uni Lynch PDF, hfes.org PDF, openbuilding.co, re-dwell.eu, ocw.tudelft.nl, idea.ap.buffalo.edu.
- Status: PENDING for the sampled subset below; the sweep is *sampled*, not exhaustive (a full sweep of
  ~70 URLs is outside the retrieval budget — record as a residual gap).

---

# PART D — CROSS-FILE STRUCTURAL FINDINGS (no web needed)

## D-01 — Rule IDs duplicated in meaning, not in label, across the three files
- TH-06/TH-07/TH-08/TH-09/TH-10/TH-11/TH-12/TH-14/TH-15/TH-19/TH-20 ≈ RP-01/RP-02/RP-03/RP-07/RP-15/
  RP-06/RP-04/PP-11/PP-13/PP-21/RP-10. Expected (different evidence bases) — not a defect, but the
  synthesized layer must not double-count them as independent support. **Flagging as a risk to
  `synthesized-rules.md`, out of scope here.**

## D-02 — Malformed Class fields in real-projects.md
- RP-04: `Class: DESIGN PRINCIPLE (also argued as: / CODE REQUIREMENT)` — the slash-branch is empty.
  Same defect at RP-17 `(also argued as: / CODE REQUIREMENT)` and RP-19 `(also argued as: /
  ENGINEERING CONSTRAINT)`. A template fill failed three times; the empty branch still asserts a code
  pedigree the entry then has to disown (see C-22).
- ACTION: REMOVE the dangling "(also argued as: / …)" text or fill it.

## D-03 — Tier labels inconsistent with what the file admits inside the same line
- RP-08: "Source: … Foster + Partners … — T3 (page body not retrievable; figures cross-checked at
  Wikipedia … — T4)" while the Confidence line says "High (three types, with outcome data in one)"
  where the "outcome data" is architect self-report (C-00).
- ACTION: QUALIFY.

## D-04 — architecture-theory.md honesty audit result
- The file uses the explicit marker `UNCITED — heuristic` at six points (TH-03 A/E/I/O/U, TH-12
  shoulder-to-shoulder, TH-18 solid share, TH-21 percentiles, TH-25 ratios, TH-26 1.5×/2.5×, TH-29
  lift bands) and repeats the disavowal in `## Weak or contested`. Where a book is named next to a
  number, the file says "no number taken" (Neufert, Time-Saver, Panero & Zelnik, Pheasant, Habraken,
  Rowe & Koetter, Problem Seeking). **The book-attribution hygiene in this file is good; the one
  violation found is A-01 (Ching BCI).**

## D-05 — real-projects.md honesty audit result
- The file does disclaim advocacy-sourced outcomes (C-00), T4 hospitality numbers (CR-21 / Weak),
  vendor warehouse numbers, retail percentages, the Fagus narrative, Sendai seismic (dropped, no rule
  rests on it — good), and lists five explicit gaps including projects omitted rather than described
  from memory (Kyoto Station, Acros Fukuoka, Inada Hotel, Lloyd's, Pixel). **That last note is a strong
  positive signal: it names what it refused to invent.**

---

# Verdict ledger (post-fetch)

| # | Claim | Status | Action |
|---|---|---|---|
| A-01 | Ching BCI 0.10–0.20 m partition | UNVERIFIED (disclaimer inaccurate) | QUALIFY |
| A-02 | Neufert PDF | UNVERIFIED — URL live but 58.9 MB, unreadable to any reader | QUALIFY |
| A-03 | Time-Saver efficiency factors | UNVERIFIED, honestly labelled | KEEP |
| A-04 | Panero & Zelnik proportions | UNVERIFIED, honestly labelled | KEEP |
| A-05 | Problem Seeking | UNVERIFIED, honestly labelled | KEEP |
| A-06 | Ching five organisation forms | NOT FETCHED (budget); correct on knowledge, T4 corroborated | KEEP |
| A-07 | Newman quotes + page numbers | SUPPORTED 3/4 pages via AMST (third-hand collation) | KEEP + reword |
| A-08 | Pattern 159 title/quote/cross-refs/no-numbers | **SUPPORTED — fully verified** | KEEP |
| A-09 | Hillier concepts | PARTIALLY SUPPORTED, honestly demoted | KEEP |
| A-10 | Modulor numbers via T4 | PARTIALLY SUPPORTED (values match the standard record) | QUALIFY |
| A-11 | "500 mm is not an ISO coordination size" | NOT FETCHED — likely wrong as written (500 = 5M) | QUALIFY |
| A-12 | IBC/ADA/NDSS/EN 17037 numbers | NOT FETCHED; internal arithmetic all re-checked and exact | KEEP |
| B-01 | HBN "≤15 beds" (T1) | **UNVERIFIABLE — PDF corrupted on two reads; wording "ideally" vs hard assert** | QUALIFY |
| B-02 | Helbing 20–30 % desire-path threshold | PARTIALLY SUPPORTED; article exists, **quote did not reproduce** (10 % seen) | QUALIFY |
| B-03 | "late changes cost 10–50×" | PARTIALLY SUPPORTED (verbatim in memo, **uncited**) | QUALIFY headline |
| B-03b | CII / PlanGrid-FMI / Love statistics as transcribed | **CONTRADICTED on re-read of the same URL** | REPLACE |
| B-04 | NIST TN 1727 persistence | NOT FETCHED; plausible, correctly T2 | KEEP |
| B-05 | Self-consistency of disavowal sections | PARTIALLY SUPPORTED (6 checks pass; PP-23 breaks it) | KEEP |
| C-00 | Outcome claims labelled advocacy | PARTIALLY SUPPORTED (label good, RP-08 Confidence contradicts it) | QUALIFY |
| C-01 | GCUH 70 % / 4→3 days / 175,000 m² / 7-storey | **SUPPORTED verbatim (Hassell); ArchiPro 403; advocacy-origin** | QUALIFY confidence |
| C-02 | SCUH fingers / light wells / lost ventilation | NOT FETCHED | KEEP (plausible, single-sourced) |
| C-03 | Unité 330 dwellings | **CONTRADICTED — cited publisher says 337** | REPLACE |
| C-04…C-20 | remaining ~17 project records | NOT FETCHED (retrieval budget) | see Residual gaps |
| C-22 | RP-19 Class "CODE REQUIREMENT" on two T4 vendor pages | **CONTRADICTED (class vs evidence tier)** | REPLACE class |
| C-23 | RP-13 20 tiles vs 40 tile-steps | CONTRADICTED (internal) | QUALIFY |
| D-02 | empty "(also argued as: / …)" class fields ×3 | CONFIRMED DEFECT | REMOVE |

## Totals per file

Counts are of *claims audited*, not of rules.

**architecture-theory.md (TH-01…TH-29)** — 13 book/standard claim clusters audited (A-01…A-13):
SUPPORTED 3 (A-07, A-08, A-12) · PARTIALLY SUPPORTED 2 (A-09, A-10) · UNVERIFIED 8 (A-01, A-02, A-03,
A-04, A-05, A-06 unfetched, A-11, A-13) · CONTRADICTED 0 · UNSUPPORTED 0.
Zero fabricated citations found. **Actions: KEEP 9, QUALIFY 4, REPLACE 0, REMOVE 0.**

**professional-practice.md (PP-01…PP-26)** — 6 strongest-number clusters audited (B-01…B-05 incl. B-03b):
SUPPORTED 1 (B-05, partial) · PARTIALLY SUPPORTED 3 (B-02, B-03, B-04) · UNVERIFIED 1 (B-01) ·
**CONTRADICTED 1 (B-03b)**. Actions: KEEP 2, QUALIFY 3, REPLACE 1.

**real-projects.md (RP-01…RP-27 / CR-01…CR-21)** — 8 case clusters + 4 structural claims checked:
SUPPORTED 1 (C-07) · PARTIALLY SUPPORTED 4 (C-00, C-01-as-justification, C-02, C-03 street numbering) ·
**CONTRADICTED 3 (C-03 dwelling count, C-22 class-vs-tier, C-23 internal arithmetic)** · UNSUPPORTED 0 ·
NOT FETCHED ~17 records.
Actions: KEEP 2 (C-02, C-07), QUALIFY 3 (C-00, C-01, C-23), REPLACE 3 (C-03, C-14, C-22), REMOVE 1
(D-02).

## The 5 most dangerous claims

1. **PP-23's rework statistics (B-03b) — CONTRADICTED.** The file presents CII 2–20 %, PlanGrid/FMI
   26 % + 14–22 % = "48 %", >$31 B, Love 52 %, and grades the topic "6 independent sources / T2 /
   cross-checked: yes". A re-read of the same cited URL returns different numbers for every one of
   these. This is the file's loudest diligence claim sitting on a transcription that does not survive
   one repetition, and the rule headline converts an uncited contractor memo into "late changes cost
   10–50× more".
2. **RP-19's Class: CODE REQUIREMENT (C-22).** A rule whose entire evidence base is a steel-building
   vendor page and a racking-vendor blog — with SEMA clearances "reported second-hand" per the file's
   own Weak section — is labelled as a code requirement and then hard-wired into tile-level asserts
   (7–8 / 6 / 3–4 tile aisles). A code class is the one label a downstream agent will not question.
3. **PP-03's "≤15 beds" (B-01).** Graded T1, called "Strong" in the Consensus map, and asserted
   (`assert count ≤15`) — but the governing PDF is unreadable at the cited URL, the quoted wording is
   "ideally", and the hospitality twin (≤14 guest rooms) is T4. Healthcare adjacency rules will be
   failed on an unverifiable aspiration.
4. **CR-01/RP-05/RP-13 "330 dwellings" (C-03).** Contradicted by the very page cited (337). Low
   materiality to the *rule*, high materiality to the register's trust model: it proves the file
   paraphrases T3 pages rather than transcribing them, which is what makes the *unfetched* 17 project
   records risky.
5. **RP-08's GCUH outcome pair (C-01/C-00).** "Transfers down >70 %", "stay 4→3 days" are genuine
   verbatim quotes from the architect's page and are correctly disowned in Weak-or-contested — but
   RP-08's Confidence is set to **High** explicitly *because* of "outcome data in one", so the file
   promotes on the same evidence it disclaims. Directionally fine; load-bearing as written.

## Are practitioner-sourced rules labelled honestly?

**Largely yes, and materially better than the other two files — but with a consistent one-step
failure.** Where a number is weak, the file says so *somewhere*: seven `UNCITED — heuristic` markers in
architecture-theory.md, a `## Weak or contested` section that names the 13–14 rooms/shift figure, the
20–30 % threshold, the "$2–5/m²" memos, the "BOH as a share of GFA" gap ("**There is no defensible
percentage in this research; do not invent one in SKILL.md**"), and a `## Claims that did NOT survive
cross-checking` list that actively kills 10 popular claims — including ones the file could have kept.
That is unusual and real diligence.

The failure mode is **placement, not truth**: the disavowal lives in the back matter while the
*Rule headline, the Class line and the Grid-translation assert* keep the strong version. Concretely:
PP-23 titled "cost 10–50× more" with Weak-section text disowning the memo; PP-03 asserting a number it
quotes as "ideally"; RP-19 classed CODE REQUIREMENT on vendor evidence; RP-08 Confidence High on
advocacy data; the A/E/I/O/U letters appearing in TH-03's *Rule* ("Fill in the standard five-grade
scale used in practice as A = absolutely necessary…") while Weak-or-contested says the letters "could
not be retrieved from any primary or T1–T3 source". Rules are what get compiled into behaviour; caveats
are what get skimmed.

## Safe-as-foundation judgement

**CONDITIONAL PASS — usable as a foundation, not as a source of numbers.**

Safe: the method layer of all three files. Programme-before-geometry, graded adjacency, the
adjacency/access/separation split, four-zone banding, threshold counting, circulation budgeting as a
*measured* quantity, figure-ground, kit-of-parts, long-life/short-life separation, the 0.5 m grid
arithmetic (re-verified line by line: wall tax 60/33/22/11 %, octile 28.3 vs 40 steps, NDSS→tiles,
ADA→tiles, IBC→tiles, RP-05/RP-19 m→tile conversions, RP-17's 13.3 m²/place, CR-11's 430,556 ft² ↔
40,000 m², CR-17's 160,000 sq ft ↔ 14,864 m²), and the entire "measure and publish, never must-equal"
posture. The 20 documented projects checked so far all exist with the named architect and building
type; no invented project was found. Every book named is real, in the edition cited, and — except
A-01 — does not have a number falsely pinned to it.

Not safe without the four REPLACE/QUALIFY actions above: (a) any figure promoted to `CODE REQUIREMENT`
on vendor evidence, (b) the PP-23 rework statistics, (c) PP-03's ≤15-bed assert, (d) any outcome figure
feeding a Confidence rating (RP-08, RP-23). Also unsafe: `## Consensus map`'s "independent sources"
counts, which are self-reported diligence numbers with no checkable artifact.

## Residual gaps (what this audit could not close)

- **Retrieval budget.** 13 web calls used; ~17 project records (SCUH, Habitat, Interlace, Nakagin,
  Maggie's, Fogo, MBS, Edge, Commerzbank, Bullitt, Saunalahti, Fagus, Gläserne Manufaktur, Selfridges,
  Sendai, Oodi, Kansai) and 6 standards pages (IBC §1005, ADA ch.3, NDSS, EN 17037, ISO 2848, Ching
  archive.org full text) were **not opened**. They are marked NOT FETCHED, not "verified".
- **URL sweep sampled, not exhaustive.** The brief asked whether ArchDaily/Dezeen/Divisare/RIBA/AIA
  URLs resolve to the project described. One bot-wall was confirmed live (ArchiPro GCUH → 403, and the
  file's own Weak section records MDPI/IOP 403s, so the register's link health is uneven). The two
  different Divisare slugs for Saunalahti (`…andreas-meichsner-saunalahti-…` in RP-14/RP-16 vs
  `…andreas-meichsner-tuomas-uusheimo-saunalahti-…` in CR-14) are a **live duplicate-URL defect** — at
  least one does not resolve to the project as cited; not fetched.
- **Neufert is structurally unverifiable** (58.9 MB) — any future pass that wants to take a number from
  *Architects' Data* needs a different copy, not this link.
- The PMC/NIST/HBN fetch failures may be reader-side (corrupted binary) rather than dead links; they are
  recorded as unverifiable-by-this-route, which is itself a finding about the file's source health.

