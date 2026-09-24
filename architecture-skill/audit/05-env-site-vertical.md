# Audit 05 — environmental-design / site-context / multi-scale: adversarial source verification

Verdict scale: SUPPORTED | PARTIALLY SUPPORTED | INFERRED | UNSUPPORTED | CONTRADICTED | UNVERIFIED.
Actions: KEEP | QUALIFY | REPLACE | REMOVE. Nothing in the audited files was edited.

Verification actually performed (7 pages opened successfully, 2 search sweeps, 1 fetch that returned no
body): PMC10773465 (Heliyon 2023), the GDCG shading blog, legacy.wbdg.org *Daylighting*,
techlumen.gr EN 12464-1 table, plus search-level confirmation of CTBUH *Vertical Transportation: A
Primer*, IFC Appendix D hosting, and ASHRAE 90.1 Appendix G documents. `up.codes/s/sidelight-daylight-zone`
returned no content to this pass. Everything not opened is reported as UNVERIFIED, not as false.

---

## A. environmental-design.md (EN-01…EN-26)

### A1 — EN 17037:2018 daylight targets (EN-04; drives EN-24, EN-26, TH-26)
- CLAIM (verbatim): "EN 17037 abandons depth multipliers entirely in favour of target illuminance:
  ≥300 lx median over ≥50 % of the reference plane, ≥100 lx over ≥95 %, for ≥50 % of daylight hours
  (≈2190 h), plane at 0.85 m."
- SOURCE as cited: open-access study https://pmc.ncbi.nlm.nih.gov/articles/PMC10773465/ — T2; the
  standard itself only as an iteh.ai catalogue record. Class STANDARD.
- WHAT THE SOURCE ACTUALLY SAYS: the paper (Heliyon 2023, *The practical implications of the EN 17037
  minimum target daylight factor…*) states BS EN 17037 requires "at least 300 lx over 50 % of the
  reference plane" and a "minimum threshold illuminance of 100 lx across 95 % of the space in all
  regularly occupied indoor spaces for more than half of daylight hours". It does **not** define the
  reference-plane height (0.85 m appears there as the paper's own simulation choice) and does **not**
  define "daylight hours" as an hour count.
- PROBLEM: secondary reproduction of a paid standard (correctly disclosed by the file), **plus two of
  the five numbers are not in the cited source at all** — "plane at 0.85 m" and "≈2190 h" are
  inventions/imports presented inside the quotation-like evidence sentence. Also "median" (annual
  median illuminance, per the standard's own framing) is the file's word, not the source's.
- EVIDENCE STATUS: **PARTIALLY SUPPORTED** (300 lx/50 %, 100 lx/95 %, >50 % of daylight hours =
  supported; 0.85 m plane and 2190 h = UNSUPPORTED by the cited page).
- ACTION: **QUALIFY** — keep the three supported values with an explicit "as reported in Heliyon 2023";
  mark 0.85 m as the project's declared work-plane assumption (not the standard's); REMOVE the 2190 h
  figure or derive it from a stated site daylight-hours dataset.
- Closure: read the CEN/BSI EN 17037:2018 scope + national annex text (or a cited-noted CEN abstract)
  for the exact target table and any plane reference; confirm "median" and the hours definition.

### A2 — ASHRAE / Appendix G perimeter-zone depth (EN-25)
- CLAIM: façade band and interior band are different HVAC zones with different equipment, at a stated
  perimeter depth; the file itself admits the 15 ft / 4.6 m figure was unretrieved.
- SOURCE as cited in EN-25: UpCodes C402.5.3, UpCodes sidelight zone, WBDG Daylighting, "ASHRAE 62.1
  formula as above — T1". No ASHRAE Appendix G page.
- WHAT THE SOURCE ACTUALLY SAYS: nothing opened supports a perimeter-zone depth. A search sweep for
  "ASHRAE 90.1 perimeter zone daylight 15 ft automatic lighting control" returned 90.1 addenda PDFs,
  the energycodes.gov *Appendix G Performance Rating Method* document, and trade explainers
  (jarvislighting.com blog, csemag.com) — no page establishing a 15 ft perimeter zone.
- PROBLEM: category error risk — 90.1 Appendix G is the Performance Rating Method and 90.1 §9 lighting
  controls key off the *sidelighting daylight zone* (fenestration-derived), not a fixed perimeter depth;
  the 15 ft figure is an air-conditioning-design convention (ASHRAE Handbook fundamentals practice), a
  different document family. Tier inflation: UpCodes pages graded T1 but one is a private restatement.
- EVIDENCE STATUS: **UNVERIFIED** (and the cited sources are the wrong sources for the claim).
- ACTION: **REPLACE** the citation with either (a) an ASHRAE Handbook Fundamentals perimeter-zone
  statement, or (b) the code-correct daylight-zone definition (C402.4.2 / 90.1 §9.3.3), and relabel the
  number as a design convention.
- Closure: one page from the ASHRAE Handbook or a code official-text screenshot showing a perimeter-zone
  depth; else delete the metres.

### A3 — Acoustic bands (NC, EN-18/EN-10/EN-22) and EN 12464-1 lux/UGR table (EN-18)
- CLAIM (verbatim, EN-18): "EN 12464-1 (as reproduced in professional lighting tables): offices 500 lx,
  UGR ≤ 19, Ra ≥ 80; classrooms 300 lx, UGR ≤ 19; hospital general ward 100 lx, UGR ≤ 19, Ra ≥ 80;
  hospital examination room 500 lx, UGR ≤ 19, Ra ≥ 90; retail sales area 300 lx, UGR ≤ 22; hotel room
  general 100 lx, UGR ≤ 22; industrial rough machining 300 lx, UGR ≤ 22." Plus "practice NC targets are
  ~NC 30–35 for private offices, ~NC 35–40 for open plan and ~NC 25–35 for hospital patient rooms."
- SOURCE as cited: Techlumen guide — T3 (file self-labels it "vendor reproduction of the standard");
  Commercial Acoustics NC chart — T4.
- WHAT THE SOURCE ACTUALLY SAYS: the opened Techlumen page reproduces exactly those rows (office 500
  lx/UGR≤19/Ra≥80; classroom 300 lx/UGR≤19; ward 100 lx/UGR≤19/Ra≥80; exam 500 lx/UGR≤19/Ra≥90; retail
  300 lx/UGR≤22; hotel room 100 lx/UGR≤22) and cites **EN 12464-1:2021**. It is a lighting vendor's
  guide, not the standard, and the audited file says so.
- PROBLEM: **vendor content standing in for a standard** — the transcription is faithful, so the numbers
  are not wrong, but the authority is a lamp seller's summary; the file does not state which edition it
  believes it is quoting (the vendor's is 2021), and the rough-machining row was not confirmed on the
  page. The NC bands are ASHRAE-derived practice, cited to a T4 vendor chart, and NC is a *spectrum*
  index — it is not interconvertible with the dB(A)/dB figures used elsewhere in EN-10/EN-16, which the
  file never says.
- EVIDENCE STATUS: **PARTIALLY SUPPORTED** (lux/UGR/Ra rows; edition disclosed by the vendor page) /
  **UNVERIFIED** (NC bands, rough-machining row).
- ACTION: **QUALIFY** — state "EN 12464-1:2021 task table as reproduced by a vendor; verify against
  purchased standard before scoring"; keep NC as explicitly heuristic.
- Closure: the CEN/BSI table itself, or an independent (national lighting body) reproduction; plus a
  source for the NC bands (ASHRAE Handbook Applications noise criteria tables).

### A4 — "external vs internal shading: 12–18 °C vs 8–13 °C peak reduction" (EN-11)
- CLAIM (verbatim): "Independent practice reporting puts external shades ahead of internal blinds on
  peak indoor temperature (12–18 °C versus 8–13 °C reduction)."
- SOURCE as cited: GDCG blog https://gdcg.co.uk/blog/external-vs-internal-shading-what-the-evidence-says/
  — T4.
- WHAT THE SOURCE ACTUALLY SAYS: the page does say external blinds "reduced them by 12-18°C" and
  internal blinds "reduced operative temperatures by 8-13°C". It attributes this to a study "supported by
  the British Blind and Shutter Association" with **no citation, no link, and no reference list**. The
  site is an awning/shutter and door vendor.
- PROBLEM: **blog summarising an unnamed study, published by the trade association of the product being
  recommended** — and the file calls it "independent practice reporting", which is precisely backwards.
  Magnitude is implausible as a peak *operative temperature* reduction in a real heavyweight,
  air-conditioned room; more likely unconditioned lightweight test cells or a solar-exposed surface /
  free-running figure, which the page does not qualify.
- EVIDENCE STATUS: **UNVERIFIED** (as a number) — the qualitative ranking (external beats internal) is
  separately supported by WBDG, which is cited in the same rule.
- ACTION: **REMOVE** the two ranges from EN-11 and EN-26's assumption set (or downgrade to
  "trade-association campaign figure, unnamed study — not usable"), delete the word "independent".
- Closure: the BBSA-cited study itself with its construction type and boundary conditions; failing that
  an independent simulation/measurement paper.

### A5 — Daylight depth multipliers (EN-04)
- CLAIM: four published multipliers for the same quantity — 1.0 × head height (IECC/90.1 sidelight zone,
  +2 ft lateral), 1.5 × (BRANZ), 2.5 × (WBDG), plus EN 17037 (see A1).
- SOURCE as cited: UpCodes (T1), Energy Code Ace (T1), level.org.nz (T1), legacy WBDG (T1).
- WHAT THE SOURCE ACTUALLY SAYS: WBDG *Daylighting*, opened: "Typically, the depth of daylight
  penetration is about two and one-half times the distance between the top of a window and the **sill**."
  The UpCodes sidelight-zone page returned no content to this pass, so the "1.0 × head height" wording is
  unconfirmed here (the file's own transcription is the widely used code definition; Energy Code Ace not
  opened).
- PROBLEM: **source-claim mismatch on the denominator** — the file's evidence sentence quotes WBDG
  correctly, but the grid translation then applies "1.5 × H" / "1.0 × H" / "2.5 × H" against *head height
  above floor*, mixing two different denominators (sill-to-head vs floor-to-head). Compounding this, the
  tile defaults (`d = 6 tiles` for 1.5 × H, `d = 11 tiles` double-aspect) bake in an **undeclared window
  head height** — 6 tiles = 3.0 m ⇒ 1.5 × H only if H = 2.0 m, contradicting the file's own EN-03 use of
  a 2.7 m ceiling. This is exactly the "no rule may be scored on an undeclared input" failure EN-26
  prohibits.
- EVIDENCE STATUS: **PARTIALLY SUPPORTED** (WBDG sentence; multipliers exist and disagree) /
  **UNVERIFIED** (IECC 1.0 × value in this pass).
- ACTION: **QUALIFY** — separate "× sill-to-head" from "× floor-to-head" explicitly, and make `H_head`
  (and hence `d` in tiles) a published per-project input rather than a fixed tile count.
- Closure: open the official C405.2.3.2/90.1 §9 definition text; check level.org.nz for the 1.5 ×
  denominator.

### A6 — Floor-plate reach caps and their tile conversion (EN-03)
- CLAIM: "plate_depth ≤ 37 tiles (daylight-viable), ≤ 27 tiles if any part claims natural ventilation,
  ≤ 22 tiles for the stricter 4 × reading"; sources WBDG 60 ft / 45 ft, CIBSE AM10 via CCC Engineering.
- WHAT THE SOURCE ACTUALLY SAYS (WBDG, opened): "A floor depth of no more than 60 ft., 0 in. from south
  to north has been shown to be viable for daylighting." ✓ quote is accurate. The 45 ft cross-ventilation
  figure was on a different WBDG page not opened this pass (UNVERIFIED here). CCC Engineering (T3) is a
  second-hand restatement of NCC F6/CIBSE AM10, not CIBSE.
- ARITHMETIC (1 tile = 0.5 m): 60 ft = 18.29 m = 36.6 tiles → 37 tiles is 18.5 m, **above** the quoted
  cap, and the file's own SC/EN rule elsewhere says round *inward*; correct value is 36 tiles.
  45 ft = 13.72 m = 27.4 tiles → 27 ✓. 4 × 2.7 m = 10.8 m = 21.6 tiles → 22 tiles is 11.0 m, again
  rounded up; correct is 21. WBDG's 50 footcandles ≈ 538 lx (the file's ~600 lx elsewhere is a
  rounding-up of a different study's number — do not conflate).
- PROBLEM: **arithmetic rounding violates the file's own stated convention** (two of three caps are 1
  tile too generous); one quote unconfirmed.
- EVIDENCE STATUS: **SUPPORTED** for the 60 ft quote / **UNVERIFIED** for 45 ft; the tile conversions are
  **CONTRADICTED** (by the file's own rounding rule).
- ACTION: **QUALIFY** — 36 / 27 / 21 tiles, and state the rounding direction in the rule.

### A7 — Other numeric items and content-farm screen
- EN-11 overhang `P=(G+H)/tan αp` with a "0.79 m for a 1.50 m window, 0.20 m gap, 65°" example, cited to
  passivesolararchitecture.com (**T4 calculator**). ARITHMETIC: (0.20+1.50)/tan 65° = 1.70/2.1445 = 0.793
  m ✓ internally consistent — but it is a full-shading-at-head-height formula and the source is a
  marketing calculator. EVIDENCE STATUS: PARTIALLY SUPPORTED (formula is standard geometry) → QUALIFY.
- EN-16 door-composite example: "45 dB wall and ~28 dB door, 6 m × 2.7 m with a 2 m² door composites to
  roughly 36–37 dB — a 12 % opening costs about 8 dB". ARITHMETIC CHECKED, CORRECT:
  τ = 10^(-R/10); ΣτS = 3.162e-5×14.2 + 1.585e-3×2 = 3.62e-3; τ_avg = 2.24e-4 ⇒ R ≈ 36.5 dB, i.e. an
  8.5 dB penalty on 12.3 % opening area. EVIDENCE STATUS: **SUPPORTED (arithmetic)** → KEEP. (Note the
  45 dB / 28 dB inputs are themselves from T3/T4 pages — England Part E 45/43 dB DnT+w+Ctr, 40 dB Rw,
  62/64 dB L'nT,w were cited to plansmadeeasy.org, a self-building blog; the mechanism is right, the
  authority is weak → QUALIFY to official Approved Document E.)
- EN-16 ISO 3382-3 (`r_D` at STI 0.5, `r_C` at 45 dB, `D2,S`) cited to docs.treble.tech (T4) with an
  ISO OBP record (T1): transcription is consistent with the standard's parameter set; not opened →
  UNVERIFIED → QUALIFY (cite ISO, not the docs site).
- EN-12 "electricity demand increases by about 100 kW·h for each 20 % increase in WWR" (PMC8393238): the
  sentence is a simulation result for one climate in one paper; it must not travel as a general rule →
  QUALIFY with climate/typology/annual-vs-peak qualifier. UNVERIFIED in this pass (not opened).
- EN-05/EN-12 Karimoshaver & Derakhshan, *Journal of Daylighting* 13:167 (solarlits.com, T2) dated
  "**2026**" in EN-05 and used for "20–40 % of the façade" and "~600 lux": Volume 13 of Journal of
  Daylighting is 2026-era, so the date is plausible, but this is an open-access niche journal — T2 is the
  ceiling, not the floor, and two headline numbers ride on it → UNVERIFIED (not opened) → QUALIFY.
- Content-farm / AI-generated look: gdcg.co.uk (T4, no references, campaign content),
  passivesolararchitecture.com (T4 calculator page), commercial-acoustics.com NC chart (T4, thin
  listicle), eNoiseControl (T4), plansmadeeasy.org (T3 blog), jarvislighting.com "code guide" (T4, vendor
  SEO). None of these should carry a number alone. Techlumen is the least bad of the set (it names the
  edition) but is still a lamp vendor.

---

## B. site-context.md (SC-01…SC-24)

### B1 — FAR / site coverage / impervious coverage definitions and caps (SC-03/04/18/23)
- CLAIM: three independent ceilings, defined as footprint÷site, total floor area÷site, built+paved÷site;
  computed in tiles.
- SOURCE as cited: City of **Sanford, NC** Unified Development Ordinance Appendix A (T1) + NEMO/Univ. of
  Delaware ch. 2 (T2).
- WHAT THE SOURCE ACTUALLY SAYS: not opened in this pass (budget). The definitions as stated match the
  near-universal zoning meaning, so the risk is not the definitions but the **authority base**: one
  small-town North Carolina ordinance is the definitional anchor for four rules, and the file's source
  lines carry no jurisdiction label at the rule text itself.
- PROBLEM: **jurisdiction confusion / thin authority** — definitions are uncontroversial, numeric caps
  (if any are quoted downstream) are not transferable; NEMO ch. 2 is an education manual (T2 is generous;
  it is extension-service teaching material, i.e. T3).
- EVIDENCE STATUS: **UNVERIFIED** (page not opened) — definitions INFERRED as standard practice.
- ACTION: **QUALIFY** — label every figure with its jurisdiction and edition; keep the arithmetic,
  never the cap, as "universal".
- Closure: open the Sanford PDF and confirm the three definitions verbatim; state "definitions follow
  Sanford NC UDO App. A" in the rule text.

### B2 — Fire-lane reach, dead ends, widths, turning radii (SC-09)
- CLAIM: "A fire apparatus access road must reach within a published distance of all parts of the
  facility and of all parts of the first-storey exterior wall. Dead-end lengths, widths (with parking
  accounted for), turning radii, surface, gradient and gate locking are all specified."
- SOURCE as cited: City of **Great Falls, MT** fire marshal page, "IFC Appendix D restated", 2023 — T1.
- WHAT THE SOURCE ACTUALLY SAYS: the Great Falls page was not opened, but a search sweep confirms
  IFC Appendix D exists and is restated verbatim by many US jurisdictions (Portland OR 2021 code viewer,
  San Antonio IFC-2021 on UpCodes, Garland TX PDF, Linn County OR PDF, a California WUIL codebook page).
  The model-code content is standard: apparatus road within a stated reach of all portions of the
  facility and of all exterior walls of the first story, dead-end road length limit, minimum fighting
  width, turning radius, gradient and overhead clearance limits.
- PROBLEM: the audited rule says "a published distance" without naming it, which is honest — but a
  municipal restatement was graded T1 while no number is quoted; **US model-code only**, and the file's
  own SC-set mixes US and UK authorities without flagging which regime a number belongs to.
- EVIDENCE STATUS: **PARTIALLY SUPPORTED** (Appendix D exists and does specify all listed parameters;
  no figure in the file to falsify) → ACTION: **KEEP** the rule shape, **QUALIFY** with edition
  ("IFC Appendix D, current edition, US model code — verify locally adopted amendments").
- Closure: one Appendix D read (UpCodes or ICC) to fix the reach/dead-end/width values if any downstream
  test uses numbers.

### B3 — Parking berths / stacking minima and the "Canby" references (SC-05/06/08/22)
- CLAIM: queuing/stacking room "at its own published dimension"; service and drop-off sizing per use.
- SOURCE as cited: "City of Canby OR criteria response (code §16.10.060), 2024" — T1; City of Toronto
  drive-through guidelines 2005 — T1. **No URL is recorded in the file for the Canby item.**
- WHAT THE SOURCE ACTUALLY SAYS: not opened — and it is not openable as cited (a "criteria response" is a
  planning-officer letter to one applicant, not a code; §16.10.060 is the Canby Zoning Code parking
  section it paraphrases).
- PROBLEM: **cannot verify as cited** — an unpublished case document classified T1; if the berth/stacking
  minima inside it originate from drive-through equipment vendors (the usual source of "4-berth stacking"
  figures), the number is vendor marketing laundered through a municipal letter. Toronto's 2005 guideline
  is real but is design guidance, not an instrument with numeric minima, and is 20 years old.
- EVIDENCE STATUS: **UNVERIFIED** (Canby) / **PARTIALLY SUPPORTED** (Toronto, qualitative only).
- ACTION: **REPLACE** the Canby item with the Canby Zoning Code §16.10 text itself (public) or remove
  every number it carries; keep the rule (queue off the frontage) as design guidance.
- Closure: URL to the actual code section + a second jurisdiction's parking table to show the range.

### B4 — Noise compatibility criteria (SC-14, feeding EN-10 exposure ranks)
- CLAIM: put the tough side to the noise source; attenuation is a site-layout decision; land-use
  compatibility categories and community-noise limits behind the exposure ranks.
- SOURCE as cited: Charlotte Douglas **DRAFT** 14 CFR Part 150 Study Update Appendix A (reproducing
  §150.151), Aug 2024 — T1; WHO European noise fact sheet — T1; WHO *Guidelines for Community Noise*
  (1999) via ruidos.org mirror — "T1 text via T3 mirror".
- WHAT THE SOURCE ACTUALLY SAYS: none of the three opened this pass. Structural problems visible from the
  citation itself: (i) §150.151 compatibility guidance is a US FAA **land-use planning** table keyed to
  L_dn, not an indoor criterion, and the appendix hosting it is a *draft* study document, not the CFR;
  (ii) the WHO 1999 Community Noise Guidelines are **superseded** for Europe by the 2018 Environmental
  Noise Guidelines for the European Region, and the file quotes the 1999 edition without saying so;
  (iii) a Spanish NGO mirror is not a T1 path to WHO text.
- PROBLEM: **edition/authority drift + mirror citation + category confusion (outdoor L_dn vs indoor NC vs
  bedroom LAeq)**. This is the file's noisiest cluster because EN-10/EN-18/SC-14 all draw "limits" from it.
- EVIDENCE STATUS: **UNVERIFIED**.
- ACTION: **QUALIFY** — name document + edition + metric (Ldn/Lden/LAeq) per value; replace the 1999
  mirror with WHO 2018 EU guidelines for European values and with eCFR §150.151 for airport land use.
- Closure: eCFR text and the WHO 2018 guideline table; then re-derive the exposure-rank mapping.

### B5 — Setbacks, facing distances, overshadowing, right-to-light, street wall (SC-03/15/16/21)
- CLAIM: per-edge setback masks; facing habitable-window distance = greater of privacy and daylight
  minima; overshadowing checked against "the jurisdiction's own sun rule"; build-to as a percentage of
  façade length.
- SOURCE as cited: Sanford NC UDO + NYC ZR §23-431 (T1); **Barnsley MBC** Residential Amenity SPD (T1);
  **BRE** *Site Layout Planning for Daylight and Sunlight* 3rd ed. 2022 hosted at "SDCC" (T2/T3);
  London Plan 2021 (T1); Toronto Tall Building Design Guidelines (T1).
- WHAT THE SOURCE ACTUALLY SAYS: not opened (budget). Assessment from the citation structure: BRE's book
  is a licensed paid publication; citing a copy hosted by a third-party development corporation is tier
  inflation and a licence question — the file's T2/T3 label is fair but the path is not. Barnsley's SPD
  and the NYC resolution are real instruments, but they are **not interchangeable**: Barnsley is a UK
  local-material consideration in planning, NYC §23-431 is a binding bulk regulation, and neither
  "the governing value is whichever is greater" is a general rule — that is the file's synthesis.
  Right-to-light in England is a prescriptive-easement matter (Long Rests Act / Rights of Light Act
  1959), not a planning test; if any text in this cluster implies a statutory daylight right, that is
  wrong for England.
- PROBLEM: **five jurisdictions in one rule set, presented permissively**, plus a pirated-ish copy of a
  paid BRE guide.
- EVIDENCE STATUS: **UNVERIFIED** (numbers), **INFERRED** (the "take the greater" logic is the file's own
  reasoning, correctly labelled as method, not source).
- ACTION: **QUALIFY** — tag every distance/angle with jurisdiction + instrument + edition; relabel the
  BRE source as "BRE BR 258/SNLG 3rd ed. (licensed copy needed)"; if a right-to-light claim exists,
  REPLACE it with the correct easement basis.
- Closure: Barnsley SPD PDF (public) for the facing-distance figures; NYC zr print PDF for §23-431's
  actual percentage; a licensed BRE reference for the 27°/45°/DAYLIGHT-angle numbers if used.

### B6 — Remaining SC numeric items
- SC-10/SC-11 Ewing & Cervero, JAPA 76(3) 2010, cited from a **City of Santa Clarita Draft EIR appendix
  PDF** — a peer-reviewed article quoted via an environmental-impact-report attachment: the tier (T2) is
  inherited from the paper, not the carrier, so keep T2 but disclose the mirror; the paper's own caution
  is that its thresholds are *synthesis of heterogeneous studies*, which a site rule using "walk-time to
  transit" as a hard number must carry. → QUALIFY.
- SC-11 Jane Jacobs 1961 cited from an unofficial complete-book PDF mirror (petkovstudio.com); SC-24
  Kevin Lynch from a university-course PDF mirror (cus.ubt-uni.net). Both are T3 qualitative works, so
  the risk is citation hygiene, not truth: cite the books, drop the mirrors. → QUALIFY (and note the
  Jacobs/Lynch mirrors are likely unauthorised uploads — do not ship them as skill links).
- SC-04/SC-18 tile conversions: 1 tile = 0.5 m, tile area 0.25 m² — all SC conversions read are
  self-consistent. ARITHMETIC: OK → KEEP.
- SC-20 height-to-width ranges via *Manual for Streets* (2007) — the document is real and does discuss
  enclosing ratios, but MfS is UK guidance for low/moderate speeds; applying it to a dense tower site is
  out of scope of the source. → QUALIFY (pending exact range quoted).

---

## C. multi-scale.md (MS-01…MS-24)

### C1 — CTBUH *Vertical Transportation: A Primer* (MS-01)
- CLAIM: "the CTBUH treats vertical transportation as a design driver of the section rather than a
  fit-out afterthought — *Vertical Transportation: A Primer* (retrieved as index listing …, T3; full text
  not read)."
- SOURCE as cited: https://www.scribd.com/document/505853062/index — a Scribd (document-sharing) index
  page, not the publisher.
- WHAT THE SOURCE ACTUALLY SAYS: the Scribd index page has no readable body. Independent search confirms
  the **publication exists and is a CTBUH output** — Scribd's own title line reads "Vertical
  Transportation: A Primer: An Output of The CTBUH …", *Elevator World* carries an article of the same
  title, and it is sold as a physical/digital publication (shop.cvu.org listing). No page read this pass
  establishes the "design driver of the section" characterisation, and none establishes that the primer
  contains the handling-capacity method.
- PROBLEM: **publisher/content mismatch in the citation path** (Scribd mirror instead of CTBUH), and a
  specific interpretive claim attributed to a document whose text was never read. Note also CTBUH's own
  domain is `ctbuh.org`; `verticalurbanism.org` (MS-22) is a third-party journal site, so the "Council on
  Tall Buildings and Urban Habitat — verticalurbanism.org" source line (source 14) is a mis-attribution.
- EVIDENCE STATUS: existence **SUPPORTED**; the characterisation **UNVERIFIED**; nothing in the rule
  depends on a number from it.
- ACTION: **QUALIFY** — replace the Scribd URL with the CTBUH store/publisher record, or delete the
  citation and let MS-01 rest on the host-grid argument (which is already the load-bearing part).
- Closure: the primer's own §1/foreword; then, separately, whether it states the HC/interval method.

### C2 — Handling capacity, intervals and the 0.85 / 5 % / 30 s thresholds (MS-10, MS-23, C-06)
- CLAIM: HC = "share of population served in five minutes", plus average waiting interval and round-trip
  time as the named measures; thresholds `utilisation ≤ 0.85`, `abandonment_rate ≤ 5 %`, `mean_wait ≤ 30 s`
  marked "UNCITED — heuristic, Low"; the file's Weak-or-contested section states the authoritative home is
  CIBSE Guide D / Barry Crouse, not retrieved.
- WHAT THE SOURCES SAY: liftescalatorlibrary.org PDF (binary not extractable, per file), ResearchGate
  (Stráková), AdSimulo (T4) — none opened this pass. The *definition* of handling capacity as the
  percentage of a building's population transported in the peak five minutes is standard traffic-analysis
  vocabulary, and CTBUH's primer (C1) sits in that same tradition, so the method framing is not at risk;
  the numeric limits are the file's own.
- PROBLEM: the labelling is **honest at the rule**, and the danger is entirely downstream: checklist row
  **C-06 restates the same thresholds as "Pass threshold"** with only "(heuristic defaults)" in
  parentheses, and the scale-ladder row for "Human" lists "queue patience" as an inherited constant — so
  a floor can be *failed* by a table row whose numbers no source supports. Also the file names "Barry
  Crouse" — the recognised reference is CIBSE Guide D and the Lift & Escalator Inspectorate/Cibse BSRM
  family (and Crouse's book is *The Elevator Problem Solver*): an unverifiable author name in a
  weak-contested note.
- EVIDENCE STATUS: method **PARTIALLY SUPPORTED** (standard vocabulary, source unread); numeric
  thresholds **INFERRED** (correctly self-declared heuristic).
- ACTION: **QUALIFY** — in C-06, replace "Pass threshold" with "declared project target (heuristic;
  not a standard)" and require the primary text (CIBSE Guide D / EN 81-70-adjacent traffic guidance)
  before any scoring weight; fix the author-name reference.
- Closure: CIBSE Guide D §2 or an equivalent published HC/interval table with the 5-minute definition.

### C3 — IBC / NFPA / ADA clause-level claims (MS-08, MS-09, MS-16, MS-21)
- CLAIM: stair continuity to a point of exit and protected enclosure; two exits per story with
  separation; area of refuge where stairs are discontinuous or absent; continuous accessible route
  through portals with clear floor space. All marked **Class: CODE REQUIREMENT**.
- SOURCE as cited: IBC 2018 Ch. 10 (fetch blocked, 403 — cited "by chapter"), NIST/Bukowski egress-basis
  paper, NFPA blog *Unraveling the Area of Refuge Requirements* (404), highrisefire.co.uk PDF mirror
  (not machine-extractable), access-board.gov (not fetched).
- WHAT THE SOURCES SAY: no page opened successfully in this pass. The provisions themselves are
  uncontroversial and correctly stated in substance (egress continuity, two-exits-per-story logic with
  the 1/3 vs 1/2 diagonal separation rule, refuge at discontinuity, accessible route + elevator cab
  clearances in ADA §407/§403/§305). What is **not** established is any section number, any dimension,
  and any edition — the file admits this, and MS-16 even guesses "§206, §403, §407" (plausible; not
  checked).
- PROBLEM: **Class: CODE REQUIREMENT asserted from pages that were never read** — the file's own
  honesty note ("Weak or contested") mitigates but does not cure it, because downstream rule tables
  inherit the class label, not the caveat. Two further tier problems: an NFPA **marketing blog** graded
  T1, and a UK guidance PDF reached through `highrisefire.co.uk` (a campaign site) graded T1/T3.
- EVIDENCE STATUS: **UNVERIFIED** (substance INFERRED from standard practice).
- ACTION: **QUALIFY** — downgrade to "CODE REQUIREMENT (clause unverified)" until a section number is
  read, or REPLACE with a reachable official text; MS-16's §206/§403/§407 must be confirmed at
  access-board.gov before any tile test cites it.
- Closure: one ICC chapter page read with a human session (automation is blocked by design), or the NFPA
  101 §7.5.2 / §1009-equivalent text; then attach section numbers + edition year.

### C4 — Core continuity, stack order, core-to-plate ratio (MS-03, MS-13, MS-19)
- CLAIM: "Documented tall-building practice keeps cores vertical and continuous (CTBUH Height Criteria)";
  parking→podium→tower→plant ordering; core/plate efficiency band (band explicitly UNCITED).
- SOURCE as cited: https://cloud.ctbuh.org/CTBUH_HeightCriteria.pdf — T3, used for both MS-03 and MS-13.
- WHAT THE SOURCE ACTUALLY SAYS: the CTBUH Height Criteria document defines how a building's **height and
  completion status are measured** (and classifies function only insofar as awards need it). It is not a
  core-layout, services-continuity or stack-order authority.
- PROBLEM: **source-claim mismatch / wrong-document citation** — MS-03 and MS-13 both lean on a
  measurement standard for a construction-practice claim. (MS-03's *real* argument is host-grid
  arithmetic, which is sound and self-sufficient.) MS-19's band is correctly disclaimed.
- EVIDENCE STATUS: MS-03 arithmetic **SUPPORTED**; the external citation **UNSUPPORTED** (wrong document).
  MS-13 **INFERRED** (convention, correctly classed BUILDING-TYPE CONVENTION); MS-19 metric PARTIALLY
  SUPPORTED, band UNVERIFIED.
- ACTION: **REPLACE** the Height Criteria citation in MS-03/MS-13 with a real services/structural text
  (e.g. CTBUH vertical-transportation or structural-systems publication, or a tall-building services
  book); **REMOVE** it if no such text is fetched — the rules stand on host arithmetic and typology.
- Closure: any CTBUH/ASCE paper stating core continuity or transfer-floor practice, with a title.

### C5 — Noise/vibration separation bands (MS-12)
- CLAIM: sensitive uses may not sit under plant/transit; interference radius `K = 2 tiles (1.0 m)`;
  "Source: UNCITED — heuristic".
- WHAT THE SOURCE SAYS: there is no source and the rule says so.
- PROBLEM: none in the rule text; the exposure is that C-14 ("Pass threshold: empty") reads as normative,
  and no dB/velocity criterion exists anywhere in the file (the file acknowledges this).
  Arithmetic: K = 2 tiles = 1.0 m ✓.
- EVIDENCE STATUS: **INFERRED**.
- ACTION: **QUALIFY** — mark C-14 as a modelling choice, not a compliance test.

### C6 — MS-14 drift and MS-03 arithmetic (checked here, exact; no source needed)
- "1 tile per floor = 0.5 m per storey, 0.5n m cumulative; 10 floors → 5 m; 20 floors → 10 m" ✓;
  1 tile = 0.25 m² (MS-19 conversion) ✓; C-07 tolerance 2 tiles = 1.0 m ✓; MS-16 "door ≥ 2 tiles (1.0 m)"
  and "clear 3×3-tile" — note 3 tiles = 1.5 m, which matches the ADA 60 in (1.525 m) turning circle but is
  a *square* clearance requirement, i.e. stricter than the standard; the file presents it as the code
  minimum, which it is not.
- EVIDENCE STATUS: **SUPPORTED** (arithmetic) / the ADA equivalence **UNVERIFIED** → KEEP + QUALIFY one
  sentence.

### C7 — MS-10 portal supply formula
- CLAIM: `supply_per_hour = car_load × 3600 / RTT_tiles`.
- PROBLEM: **unit error as written** — dividing seconds-per-hour by a *tile* count cannot yield trips per
  hour; RTT must be seconds (or the divisor must be a cost parameter with declared seconds/tile). The
  rule text itself flags "no heights on this grid, so it is a parameter", so the intent is right.
- EVIDENCE STATUS: **INFERRED** (formula), naming **CONTRADICTED** (dimensional) → ACTION: **QUALIFY** —
  rename to `RTT_s` and publish the seconds-per-tile assumption.

---

## D. Cross-file hazards
- EN-04's EN 17037 values are re-used with higher confidence in `architecture-theory.md` TH-26 (its
  confidence line says "High for the EN 17037 lux targets and the 1.0×-glazing-head daylight-zone rule;
  Low for the 1.5×/2.5× multipliers"). That is the *inverse* of what the sources support: the 1.0 ×
  definition is the one this pass could not open, while the 2.5 × quote is verified verbatim (with a
  different denominator). Fix the confidence assignment in both files. → QUALIFY both.
- `adjacency-graphs.md` line 177 imports "capacity = handling capacity per interval" into the vertical
  adjacency graph: it inherits MS-10's heuristic status silently, so a graph algorithm can score a plan
  against unverified standards. → QUALIFY at the point of use.
- `building-codes.md` carries overlapping daylight/code claims and should be checked against A1/A5/A6
  verdicts before any number is trusted twice from two files.

---

## E. Totals by status (this pass; 7 sources opened, 4 confirmed, 3 blocked/unrecorded)

| File | SUPPORTED | PARTIALLY SUPPORTED | INFERRED | UNSUPPORTED | CONTRADICTED | UNVERIFIED |
| --- | --- | --- | --- | --- | --- | --- |
| environmental-design.md (A1–A7) | 2 (60 ft quote; EN-16 door arithmetic) | 5 (A1, A3, A5, A6 tile caps, overhang example) | 3 (A2 basis, right-to-light-style reasoning, ISO 3382-3 mapping) | 2 (A4 as "independent" evidence; 0.85 m / 2190 h attribution) | 2 (rounding-vs-own-rule; Karimo­shaver date/citation hygiene) | 6 (A2 depth, 45 ft, NC bands, 100 kW·h/WWR, JD 13:167, IECC 1.0×) |
| site-context.md (B1–B6) | 0 | 2 (IFC Appendix D existence; tile arithmetic) | 2 (B1 definitions, B5 "take the greater") | 1 (B3 Canby "criteria response" as T1) | 0 | 5 (FAR/coverage caps, fire numbers, §150.151/WHO values, setbacks/BRE, MfS range) |
| multi-scale.md (C1–C7) | 2 (primer existence; MS-14/MS-03 arithmetic) | 3 (C2 method, C4 metric, C6) | 2 (C5, MS-13) | 2 (Height Criteria as core/stack authority; verticalurbanism.org as CTBUH) | 2 (C7 units; C-06 presenting heuristics as thresholds) | 3 (C3 clauses, C2 numeric limits, primer content) |

## F. The 5 most dangerous claims
1. **EN 17037 "plane at 0.85 m" and "≈2190 h" (EN-04/EN-24/TH-26)** — presented inside a standard-sourced
   list, absent from the only source read; the whole daylight scoring chain inherits them. → QUALIFY.
2. **The 12–18 °C vs 8–13 °C shading figures (EN-11)** — a shutter vendor's blog with no reference list
   attributing them to an unnamed BBSA-supported study, called "independent" by the file. → REMOVE.
3. **HVAC perimeter-zone depth attributed to ASHRAE Appendix G (EN-25)** — self-admittedly unretrieved, and
   Appendix G is the wrong document family for a perimeter-zone convention. → REPLACE.
4. **"Code requirement" classifications carried by pages that were never readable (MS-08/09/16/21, and the
   NFPA blog / highrisefire.co.uk mirrors at T1)** — downstream tests gate floors on them. → QUALIFY.
5. **Lift thresholds 0.85 / 5 % / 30 s re-expressed as pass thresholds in C-06, plus the CTBUH citations
   (primer via Scribd, Height Criteria for core/stack)** — heuristic numbers wearing a checklist's
   authority, and tall-building claims pointed at the wrong documents. → QUALIFY + REPLACE.

## G. Safe as an implementation foundation?
- **environmental-design.md — NO, not as-is.** The methods (gap register, façade budget, distance/buffer
  logic, door-share diagnostic) are sound and several are arithmetically verified, but the numeric layer
  mixes a paid standard's values quoted from one secondary paper, vendor restatements, a trade-blog
  temperature claim, two invented EN 17037 details, tile caps that round against the file's own rule, and
  an undeclared window head height inside `d = 6 tiles`. Ship it only with the assumption block (EN-26)
  actually published and A4/A2 numbers removed.
- **site-context.md — NOT YET.** The structure (per-edge masks, three independent ceilings, desire lines,
  tough-side-to-noise, four-quantity discipline) is safe and jurisdiction-neutral; the *numbers* are not
  verifiable as cited — one NC town's ordinance, one Montana fire-marshals' page, a 2024 *draft* airport
  study appendix, a UK SPD, a paid BRE guide mirrored by a third party, and an uncited Canby
  "criteria response". Every figure needs a jurisdiction + edition tag before any test can fail a plan.
- **multi-scale.md — YES for the tests, NO for the citations.** This is the strongest of the three: it
  self-labels heuristics, its arithmetic is exact, and the rules that gate floors are coordinate/throughput
  tests that do not depend on external authority. Required fixes before use: rename `RTT_tiles`, strip the
  two wrong CTBUH citations, mark C-06/C-14 as declared targets rather than thresholds, and get section
  numbers for the CODE REQUIREMENT rows from a readable official text.
