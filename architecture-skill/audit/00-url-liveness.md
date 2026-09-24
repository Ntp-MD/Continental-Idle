# Audit 00 — citation liveness (orchestrator-run)

Machine probe of all cited URLs: **560 unique URLs across 24 files**.
Method: HEAD then GET fallback, follow redirects, 9 s timeout, 14 concurrent. Non-200 classes:
403/405/406/202/203 are counted as BLOCKED (paywall or bot-gate) not dead; 404/410/501/5xx/FAIL are counted as
UNRESOLVABLE. A 404 does not by itself prove a fabricated citation - it proves the reader cannot verify it,
which is the same practical problem for a load-bearing claim.

## Unresolvable citations by file (rule that relies on it)

### architecture-theory.md — 4 unresolvable

- [404] http://idea.ap.buffalo.edu/wp-content/uploads/sites/110/2019-08-14.pdf
  - relied on by: TH-19 Rules; TH-29 Sources
- [404] https://patternlanguage.cc/Patterns/Light-on-Two-Sides-of-Every-Room-(159
  - relied on by: TH-27 Rules; TH-29 Sources; EN-08 Rules; EN-26 Sources

### building-codes.md — 3 unresolvable

- [404] https://assets.publishing.service.gov.uk/media/.../AD_B2_2026.pdf
  - relied on by: CODE-28 Sources
- [404] https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=861281
  - relied on by: CODE-28 Rules; CODE-28 Sources; MS-08 Rules; MS-08 Rules; MS-21 Rules; MS-21 Rules; MS-24 Sources

### construction.md — 2 unresolvable

- [404] https://www.gov.uk/government/building-regulations
  - relied on by: CN-28 Sources
- [FAIL] https://standards.cen.eu/
  - relied on by: CN-28 Sources

### decision-making.md — 2 unresolvable

- [404] https://www.cognitect.com/blog/2011-11-15/documenting-architecture-decisions
  - relied on by: DM-24 Sources
- [404] https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions(URL
  - relied on by: DM-18 Rules

### design-alternatives.md — 2 unresolvable

- [FAIL] https://www.ribaplanofwork.com
  - relied on by: DA-01 Rules; DA-10 Sources

### economics.md — 2 unresolvable

- [404] https://www.hvs.com/article/10219-HVS-US-Hotel-Development-Cost-Survey-2025
  - relied on by: EC-19 Rules; EC-22 Sources

### environmental-design.md — 2 unresolvable

- [404] https://patternlanguage.cc/Patterns/Light-on-Two-Sides-of-Every-Room-(159
  - relied on by: TH-27 Rules; TH-29 Sources; EN-08 Rules; EN-26 Sources

### failure-patterns.md — 2 unresolvable

- [404] https://www.gov.uk/government/publications/building-bulletin-93-acoustic-design-of-schools
  - relied on by: FL-28 Sources
- [404] https://www.gov.uk/government/publications/building-a-safer-future-review-of-building-regulations-and-fire-safety
  - relied on by: FL-28 Sources

### human-behavior.md — 2 unresolvable

- [404] https://insights.ehotelier.com/news/2013-09-29/noise-is-most-common-complaint-in-online-hotel-reviews/
  - relied on by: HB-26 Sources
- [404] https://www.cnn.com/2026-09-03/travel/noise-hotels-complaints-solutions
  - relied on by: HB-26 Sources

### human-scale.md — 1 unresolvable

- [FAIL] https://www/access-board.gov/ada/chapter/ch06/
  - relied on by: HS-28 Sources

### multi-scale.md — 8 unresolvable

- [404] https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=861281
  - relied on by: CODE-28 Rules; CODE-28 Sources; MS-08 Rules; MS-08 Rules; MS-21 Rules; MS-21 Rules; MS-24 Sources
- [404] https://www.nfpa.org/news-blogs-and-articles/Blogs/2023-03-13/Unraveling-the-Area-of-Refuge-Requirements
  - relied on by: MS-09 Rules; MS-24 Sources
- [404] https://www.networkrail.co.uk/uploads/2022/11/Vertical-Circulation.pdf
  - relied on by: MS-24 Sources

### operations-maintenance.md — 1 unresolvable

- [501] https://loadingdocksupply.com/loading_dock_design
  - relied on by: OM-28 Sources

### real-projects.md — 6 unresolvable

- [404] https://fgiguidelines.org/wp-content/uploads/2022-03-2010_FGI_Guidelines.pdf
  - relied on by: RP-27 Sources
- [FAIL] https://www.archdaily.com/785967/the-edge-plp-architecture
  - relied on by: RP-27 Case register; RP-27 Sources
- [FAIL] https://www.archdaily.com/406513/saunalahti-school-verstas-architects
  - relied on by: RP-27 Case register; RP-27 Sources
- [FAIL] https://www.archdaily.com/441419/fogo-island-inn-saunders-architecture
  - relied on by: RP-27 Sources

### site-context.md — 7 unresolvable

- [404] https://www.sanfordnc.net/DocumentCenter/View/4980/Appendix-A---Definitions
  - relied on by: SC-03 Rules; SC-04 Rules; SC-24 Sources
- [404] https://www.greatfallsmt.gov/DocumentCenter/View/950/Fire-Apparatus-Access
  - relied on by: SC-09 Rules; SC-24 Sources
- [404] https://www.saratogasprings-ut.gov/DocumentCenter/View/702/1910-Hillside-Development
  - relied on by: SC-17 Rules; SC-24 Sources

### space-programming.md — 3 unresolvable

- [404] https://ww3.rics.org/uk/en/journals/property-measurement-standards.html
  - relied on by: SP-24 Sources
- [FAIL] https://fam.state.gov/fam/06fam/06fam1710.html
  - relied on by: SP-17 Rules; SP-24 Sources

### uncertainty.md — 2 unresolvable

- [404] https://www.ipcc.ch/site/assets/uploads/2017-08/AR5_Uncertainty_Guidance_Note.pdf
  - relied on by: UN-10 Rules; UN-20 Sources

## Notes on method and false positives

- DOI links containing parentheses were re-extracted with a
paren-tolerant pattern; the remaining `)`-terminated entries in the list above are regex artifacts, not defects.
-
Crossref verification was run on the suspicious history: the Eastman (1973) and Freeman (1978) DOIs resolve to
exactly the works cited, so those attributions are sound.
- Three URLs are structurally impossible as written
(they contain a literal placeholder or a truncated ellipsis):
`assets.publishing.service.gov.uk/media/.../AD_B2_2026.pdf`, `standards.buildingsmart.org/.../lexical/…`,
`researchgate.net/publication/44088466…`. These are defects in the citation itself, independent of any paywall.
