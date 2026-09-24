# Research quality audit — can the 25 deliverables be trusted?

Auditor: qoder agent + 8 verification subagents (adversarial, per-claim). Date: 2026-09-24.
Method: claim extraction → source re-opening → claim-vs-source comparison → arithmetic re-check →
URL liveness → cross-file dependency trace. Structural audits from the earlier build pass (field
alignment, ID resolution) are **not** treated as evidence of truth; they were re-run only as a
sanity gate.

Per-group claim-level ledgers live beside this file: `00-url-liveness.md`, `01-…`…`08-…`.

## 1. Overall assessment

**Partially trustworthy — usable as a framework, NOT yet as a numeric source of truth.**

The corpus is not research garbage. It is a genuinely well-instrumented body of work: it discloses
its own gaps in every file's `## Weak or contested`, it labels tier and verification status per
citation, it refuses (and names) sources it could not read, and it independently caught an error the
orchestrator had introduced (the standing-density premise, corrected in `human-behavior.md` against
FHWA/IMO bands).

But the audit found a consistent, classable set of failures, and one systemic pattern that matters
more than any single error:

| Finding | Scale | Class |
|---|---|---|
| Cited URLs that do not resolve at all | 28 of 560 probed (5 %) | unverifiable, not necessarily false |
| Cited URLs behind paywall/bot-gate (403/406/405) | ~75 (13 %) | honest where labelled "partial" |
| Structurally impossible citations (literal `...` / truncated `…`) | 3 | **defect in the citation itself** |
| Rules carrying an uncited figure while declaring `Confidence: High` | 27 genuine (fixed in place); 42 were detector false positives - an `UNCITED` token from the file's back matter landing inside the same scanned block | internal contradiction of its own UN-10 rule, now resolved |
| Master rules whose "N independent domains" count is really fewer independent *origins* | 20 of 37 SR rows | convergence inflation |
| Confirmed arithmetic errors | 4 sites (GT-17 ×2, HS-28 ×1, plus a muddled worked pair) | real, now fixed |
| Wrong section / clause numbers | IPC §707→§708; an IBC "E1018"; `construction.md` span bands all unverified | real |
| Misattributed author / title | "Geoffrey Archer"; "Dilemmas **of** a General Theory" | real, fixed |
| A numeric table (construction spans) with zero supported rows | whole-file | demoted to heuristic |
| **Disavowal displacement** - retraction lives in `## Weak or contested` while the rule headline, `Class` and `Grid translation` keep the strong claim | >=5 rules confirmed; the pattern is corpus-wide | **dominant defect - being fixed at the rule, not the disclaimer** |

**Read this way:** the *reasoning machinery* (workflow, grid discipline, validation protocol,
failure taxonomy, host-code facts) is sound and independently corroborated by code — the code
findings are the strongest evidence in the set because they are checkable locally. The *numbers*
must be treated as candidate values pending retrieval of a readable primary, exactly as the skill
itself instructs (UN-03/UN-06/SR-14).

## 2. Domain audit table

Verdicts from claim-level ledgers; "safe foundation" = usable to drive design decisions with the
stated caveat. Groups 01 (codes + human-scale) and 07 (theory + practice + projects) were still
running when this was written; their rows carry the orchestrator's own spot-checks only.

| Domain | Evidence quality | Source quality | Major issues | Confidence | Action |
|---|---|---|---|---|---|
| `building-codes` | mixed | T1 primary blocked (403); T3 mirrors carry the numbers | 1 placeholder URL; 3 uncited+High | MEDIUM | MINOR ISSUES (pending group 01) |
| `human-scale` | strong on ADA/NHS, weak elsewhere | T1 access-board reads correctly | 12 uncited+High; 1 area error (fixed) | MEDIUM-HIGH | MINOR ISSUES |
| `human-behavior` | best-in-set; FHWA/IMO/IBC/PLOS verified | T1/T2 primary, read | IMO density transcribed wrong (0.67/0.20, not 0.20/0.10); 2 hotel noise ORs wrong; Küpper 1.0-1.2 m load-bearing but 403 | MEDIUM-HIGH | MINOR ISSUES |
| `floor-plans` | dataset existence verified; 4 attributions fail | T2 papers | MSD does **not** document vertical alignment (FP-13); benchmark is 80,788 not 80,315, wrong title, not ECCV (FP-01/25); Graph2Plan 0.65 is an average IoU, not a threshold (FP-03/18); review contains no "office/industrial neglected" statement (FP-19/20) | MEDIUM | NEEDS RESEARCH (4 fixes) |
| `bim-cad` | solid on the two IFC quotes read | T1 standard pages | suspected invented clause number "5.4.3.82 IfcZone"; one truncated `…` URL | MEDIUM-HIGH | MINOR ISSUES |
| `construction` | **no supported numeric band** | secondary/vendor at best | §707→§708; bad IBC tag; turning circle ~2× too large; CN-17 slope maths; CN-01 3M-unit slip | LOW (numbers) / MEDIUM (proxies) | NEEDS RESEARCH → demoted in place |
| `grid-translation` | ISO basics + host code verified | T1 + primary code | GT-01 quotation is not ISO text; preferred-series list wrong; DIN 4150-1 not shown to exist; GT-11/GT-14 arithmetic | MEDIUM | MINOR ISSUES (fixes in flight) |
| `environmental-design` | lux/percentage targets verified against the open-access paper | T1 catalogue + T2 paper | shading ΔT figures trace to a **shutter vendor blog** citing an unnamed BBSA study; ASHRAE Appendix G is the wrong document for a 15 ft perimeter zone; EN-03 caps round the wrong way | MEDIUM | NEEDS RESEARCH |
| `site-context` | mixed | municipal PDFs, some dead | 7 rule-level citations unresolvable (3 unique URLs); FAR/coverage worked examples need re-check | MEDIUM | MINOR ISSUES |
| `multi-scale` | tests sound, citations wrong | T3/T4 | CTBUH *Height Criteria* does not govern cores; C-06/C-14 present heuristics as thresholds; 8 dead URLs | MEDIUM (method) / LOW (numbers) | MINOR ISSUES |
| `lifecycle` | 8 supported / 17 unverified | T1 policy largely read | EN 1990 table is 2.1 not 2.3; retain-first magnitude unsourced | MEDIUM | MINOR ISSUES |
| `economics` | **4 supported / 20 unverified / 3 contradicted** | mirrors and consultancy | BOMA definitions trace to a 1998 reproduction of Z65.1-1996; EC-09 24 % premium and EC-10 arithmetic wrong; MDPI tower studies unreachable; vendor bands sit in a "documented anchors" column | LOW (numbers) / MEDIUM (method) | NEEDS RESEARCH |
| `space-programming` | 5 supported / 7 unverified / 4 contradicted | official PDFs located, unread | SP-19/SP-21 worked examples mis-apply `(W-2)(H-2)` | LOW (register values) / MEDIUM (method) | NEEDS RESEARCH |
| `design-alternatives` | thin, honestly framed | knowledge-source only | wrong Rittel title (fixed); 10 rules, single-lineage | MEDIUM | MINOR ISSUES |
| `uncertainty` | good | T1/T2 mostly by title | 2 uncited+High | MEDIUM-HIGH | MINOR ISSUES |
| `decision-making` | 3 books verified via Crossref | T2/T3 | 12 uncited+High; "Geoffrey Archer" (fixed) | MEDIUM-HIGH | MINOR ISSUES |
| `validation` | Snyk quotes verbatim | T3 | 1 uncited+High; VA-07 uses a real quote for an inference it does not license | MEDIUM-HIGH | MINOR ISSUES |
| `adjacency-graphs` | planarity/facial-triangle quote verbatim; K4 case closed by the auditor | T2 + one T4 scale page | AG-06 scale unsourced yet classed STANDARD (demotion in flight); spacesyntax glossary underlies 9 rules | MEDIUM-HIGH | MINOR ISSUES |
| `architecture-theory` | strong | T1/T2/T3 mixed | 5 uncited+High | MEDIUM-HIGH | PASS-MINOR |
| `professional-practice` | practitioner tiers are self-labelled, but statistics in rule text fail at the source | T4/T5 by design | PP-23 CII/PlanGrid/Love figures did NOT survive re-reading the cited URL; PP-03 "<=15 beds" unverifiable (source says "ideally") | MEDIUM (direction) / LOW (figures) | NEEDS RESEARCH -> re-qualified in place |
| `real-projects` | projects and architects verified; outcome effects are advocacy | T3 | outcome claims must stay labelled; RP-19 classed CODE REQUIREMENT on two vendor pages; RP-13 asserts 20 tiles then validates 40; Unite = 337 dwellings not 330 | MEDIUM | MINOR ISSUES -> fixed in place |
| `synthesized-rules` | convergence counts measure **files**, not origins | derivative | 20 of 37 SR rows cannot be traced to as many distinct origins as they cite | MEDIUM | QUALIFY ALL CONVERGENCE CLAIMS |
| `sources` | faithful index | inherits each file's status | 1 placeholder URL inherited | MEDIUM | PASS (as index) |
| `SKILL.md` | procedure sound; inherits numeric weaknesses | derivative | constants table rows that cite `construction.md`/`space-programming.md` now rest on demoted numbers | MEDIUM-HIGH (procedure) / LOW (numbers) | QUALIFIED IN PLACE |

## 3. Critical unsupported or contradicted claims

Highest materiality first — these are the claims that would change a design if wrong.

1. **`construction.md` span bands → SR-37 → SKILL.md "choose the system's bay range".** Zero bands
   were traceable to a readable published table. A plan whose bay is justified "per construction.md"
   is justified by nothing yet. Status: UNVERIFIED; demoted to HEURISTIC in place.
2. **`economics.md` net-to-gross 60-80 % / office 65-80 % → SR-28/29 → any yield judgement.** Single
   T4 glossary, no methodology, 3 figures contradicted. Status: PARTIALLY SUPPORTED at best.
3. **`space-programming.md` reference room-area register → Building Programming step 2.** The official
   documents (BB103, HTM 00, GSA 7005.1B) were located but not read; 4 worked examples mis-apply the
   enclosure arithmetic. Status: UNVERIFIED bands; method sound.
4. **`floor-plans.md` FP-13 "MSD documents vertical alignment" → SR-15 (one module cloned).** The
   dataset records shared unit IDs across floors, not alignment. The *rule* survives on RP-05, MS-14,
   PP-17 and the host-code argument; the *citation* does not. Status: CONTRADICTED attribution.
5. **`human-behavior.md` IMO density values.** 0.20/0.10 p/m² as the "speed-collapse knee" mis-states
   the table (0.67/0.20). The HB-20 density conclusion survives independently on FHWA bands.
   Status: PARTIALLY SUPPORTED (right conclusion, one wrong transcription).
6. **`environmental-design.md` shading ΔT 12-18 °C vs 8-13 °C.** Vendor blog citing an unnamed study.
   Status: UNSUPPORTED as a magnitude; the *direction* (external beats internal shading) is standard
   practice. Action: QUALIFY — keep the direction, delete the numbers until sourced.
7. **`multi-scale.md` CTBUH Height Criteria as core-governing.** Wrong document for the claim; core
   rules rest on structural/egress logic that is otherwise attested. Status: source-claim mismatch.
8. **`grid-translation.md` GT-01 ISO quotation.** Presented as ISO text; not ISO text. Status:
   QUALIFY to paraphrase.

## 4. Source-quality problems

- **Mirror-for-primary is load-bearing across the corpus.** `up.codes` (a T3 rendering of paywalled ICC
  text) appears in 9 domain files; every IBC number inherits that single dependency. If up.codes is
  wrong or superseded, the codes layer of this research fails together — and `building-codes.md`
  already says as much ("partial; verify locally"), which is the correct handling.
- **Vendor and consultancy material inside "documented" columns**: shutter-blog ΔT figures, HVS per-key
  survey (URL dead), supplier grid/span guidance (SCI 13.5 m — actually verified by group 06), lift
  consultancy bands. Mixed: some vendor data is legitimate product data (SCI), some is marketing.
- **T4 consultant pages carrying standards vocabulary**: the Gustin programming-matrix page underlies
  5 rules across 4 files (adjacency grading, matrix reading); the spacesyntax glossary underlies 9
  rules in `adjacency-graphs.md`. Both are fine as *terminology* sources and being used mostly as
  such, but neither can support a numeric threshold.
- **Wikipedia/secondary for normative content**: ISO 2848 read via Wikipedia; satisficing via
  Wikipedia; acceptable for existence/definition, not for quoted series lists (which is where GT-06
  got bitten).
- **Municipal PDFs**: several fire-access and parking citations point at small-town `DocumentCenter`
  pages that no longer resolve — the practice (adopted local standards vary) is the real point, but a
  dead local ordinance cannot prove it.

## 5. Hallucination and fabrication findings

Direct answer: **no evidence of invented sources**, and one strong positive control.

- Of 560 unique URLs probed, the status distribution was: 200 -> 437, 403 -> 75, 404 -> 21, unreachable -> 13, 406 -> 9, 202 -> 2, 203 -> 1, 405 -> 1, 501 -> 1 (sums to 560). A first pass with HEAD-only counting reported 35 hard failures; the reported **28 unresolvable** is 28 unique URLs (per-file counts in that artifact are rule-level attributions, so they sum higher) and come from the second pass, which retries a HEAD failure with a GET and treats 403/405/406/202/203 as blocked rather than dead. The reproducible statement is therefore: 437 verified live, 28 unresolvable after retry, ~85 blocked (paywall or bot-gate), 3 structurally impossible
  (`assets.publishing.service.gov.uk/media/.../AD_B2_2026.pdf`, a truncated
  `standards.buildingsmart.org/.../lexical/…`, a truncated `researchgate.net/publication/44088466…`).
  Those three are the closest thing to fabrication in the set: a URL that cannot exist was written
  down as if it did. They are labelled in `building-codes.md` as "primary PDF, not machine-readable
  this session", so the author knew it was unread — but a placeholder path should never be printed as
  a citation.
- Crossref checks: Eastman "Automated space planning" (Artificial Intelligence 4, 1973) and Freeman
  (Social Networks, 1978) resolve to exactly the works cited — the DOI trail is honest.
- Dataset and paper existence (CubiCasa5K, RPLAN, FloorPlanCAD, Swiss Dwellings, Graph2Plan,
  HouseDiffusion) verified; the file's own exclusions (ITP/Pictor/CADI4RNN) are honoured — nothing
  downstream relies on them.
- Two attribution errors of the sloppier kind (wrong given name, wrong preposition in a title), both
  fixed; both were in passages where the author had already admitted not retrieving the text — i.e.
  carelessness at the citation layer, not invented evidence.
- Suspected invented clause number: `IfcZone` "5.4.3.82" (bim-cad). Under check.
- `DIN 4150-1` could not be shown to exist; the file already withdrew it — the residual defect is that
  a source line still carried it with STANDARD weight.

## 6. Contradictions discovered

- Within `human-behavior.md`: HB-01 "caps flow below the code maximum" vs its own 78 p/min rule.
  One of the two is wrong; needs adjudication against IBC egress capacity, not prose.
- `multi-scale.md` C-06/C-14 pass heuristic thresholds as verification limits — the same pattern the
  corpus's own UN-10 forbids.
- `grid-translation.md` GT-03 (500 mm is not a 3M member) vs `architecture-theory.md` TH-22 (treat the
  tile as a modular-coordination grid): previously logged as tension 10 and resolved; the audit
  confirms the resolution is right (500 mm is a 1M multiple; the shared cell is 1500 mm).
- `economics.md` contradicted on 3 figures (per group 06) against its own "documented anchors" table.
- `space-programming.md` SP-19/SP-21 arithmetic contradicts `architecture-theory.md` TH-02's correct
  enclosure identity — the theory file is right, the programming examples are wrong.

## 7. Cross-document dependency problems

- **Convergence laundering in the synthesis (most important structural finding).** SR rows claim
  "N independent domains"; measured against distinct origins, 20 of 37 rows cite more rules than they
  can trace sources for — e.g. SR-23 (10 rules → 2 detectable origins: WBDG, Ching), SR-30 (9 → 1),
  SR-37 (7 → 1), SR-27 (8 → 1). Where the shared origin is a *primary standard* (ADA, IBC via one
  mirror, ISO) that is normal and fine; where it is one consultant page or one glossary, the count
  overstates corroboration. Fix: SR counts are re-labelled below as file counts, and single-origin SRs
  are demoted to "may warn, may not fail" per UN-10.
- **A single mirror underpins a whole layer**: up.codes → IBC numbers → CODE-01…CODE-08 → SR-06 →
  pre-geometry gate item 2 → SKILL.md egress checks. One dependency, four levels deep. Mitigated
  already by the corpus's "verify locally" flagging; must not be silently trusted.
- **Two framework files share one lineage**: `decision-making.md` and `design-alternatives.md` both
  rest on Rittel/Simon/Lawson as knowledge-source citations, and one of them is the orchestrator's own
  writing — so their agreement is not independent confirmation. `uncertainty.md` is likewise
  orchestrator-authored (also true of `design-alternatives.md`); any SR whose "independence" includes
  those files is weaker than it reads.
- **What is genuinely independent and therefore load-bearing**: the host-code facts
  (`rooms.ts`, `walkable.ts`, `pathfinding.ts`, `schema/rooms.ts`) were confirmed by three separate
  agents and by the orchestrator, and the standing-density correction arrived from an agent
  *contradicting its own brief*. That is the strongest evidence class in the whole audit.

## 8. Targeted re-research performed

Done after the claim inventory, never as a re-run of the domains.

1. Re-probed all 560 cited URLs with HEAD+GET, mapping each failure to the rule that relies on it
   (`audit/00-url-liveness.md`).
2. Crossref-verified the DOIs I suspected of misattribution — cleared (Eastman, Freeman correct);
   confirmed the correct Rittel title.
3. Opened PMC10773465 directly and checked all four EN 17037 figures TH-26/EN-04 rely on — **all four
   are present** ("300 lx over 50 % of the reference plane", "100 lx across 95 %", "more than half of
   the daylight hours in the year (2190 h)", "0.85 m above the floor"). This **refutes** group 05's
   finding that 0.85 m and 2190 h were absent; the surviving nuance is that the paper attributes the
   0.85 m working-plane height to daylight-factor practice rather than to EN 17037's own definition,
   so TH-26 is PARTIALLY SUPPORTED on that one element, not unsupported.
4. Re-checked every metre↔tile statement in the corpus with a unit-aware script; separated genuine
   arithmetic errors (GT-17 ×2, HS-28 ×1) from my checker's mis-parses of wall-tax and mm statements
   (12 false positives, listed in §10).
5. Fixed four defects in place: GT-17 worked table, GT-17's muddled net/gross pair, HS-28's Queen-bed
   area, the Archer given name, the Rittel title; launched scoped remediation for construction's
   sections/bands, grid-translation's quotation and series, and the 82 confidence/UNCITED pairs.
6. Independently confirmed the two most load-bearing egress figures the codes layer rests on, because
   they come from a T3 mirror of paywalled ICC text: `up.codes` §1018 carries "not less than **44 inches
   (1118 mm)**" with "**Thirty-six inches (914 mm)** - With a required occupant capacity of less than
   50", and the Access Board ch.4 carries **36 in (915 mm)** clear width, reducible to **32 in (815 mm)**
   for ≤24 in with 48 in separations, **60 in (1525 mm)** at turns, and door clear opening **32 in**.
   The corpus states all of these correctly, so CODE-05 / CODE-18 / CODE-19 and the SR-05 route-width
   dominance rule stand on verified ground - the one place in the set where a mirror was checked against
   the numbers it is accused of carrying.

## 9. Keep / qualify / replace / remove

- **KEEP (evidence sound):** all host-code facts and their rules (SR-19, integrity gate, door-bisection
  and `hall`-collapse checks); grid discipline SR-02/SR-23 (arithmetic, not citation); SR-16 topology
  logic; the planarity result behind AG-03…AG-05 (auditor closed K4 by a slicing count); validation
  protocol SR-10/SR-31; failure taxonomy SR-36; FHWA/HCM/IMO/IBC-lobby bands in `human-behavior.md`;
  IgCC, EN 1990 (with table corrected to 2.1), GPDO Class MA, London Plan SI 7, SCI figures, Chapman
  Taylor grids, Huuhka & Vorobjev, BB103's non-statutory status and its 15 % figure.
- **QUALIFY (keep direction, mark or split confidence):** every `UNCITED` figure paired with High
  confidence (82 sites); SR convergence counts → "N files", single-origin SRs warn-only; TH-26's
  0.85 m element; `multi-scale` heuristic thresholds; practitioner tiers.
- **REPLACE (retrieve primary before use):** construction span table; economics net-to-gross and the
  EC-09/EC-10 figures; space-programming register values; the IPC §708/§704.1 citation set; the three
  impossible URLs; FP-13's MSD attribution → cite MS-14/RP-05 or a real vertical-alignment source;
  EN-03's rounding direction.
- **REMOVE (no defensible basis):** shading ΔT 12-18 °C / 8-13 °C magnitudes; any DIN 4150-1 citation
  still carrying STANDARD weight; "5.4.3.82 IfcZone" if the clause check fails; the ISO-text quotation
  formatting in GT-01; the 15 ft perimeter-zone attribution to ASHRAE Appendix G.

## 10. Auditor's own errors (recorded because they matter to the verdict)

- My first unit checker conflated area with length (`4 tiles = 1 m²` read as a length claim), producing
  44 "errors" of which ~40 were its own. A second pass produced 12 more false positives by reading
  wall-tax statements (`6×5 → 18 tiles lost`) as products. Both are documented so nobody re-reads the
  first numbers as findings.
- My initial class-label enum listed seven categories; the spec defines eight
  (`EXPERIENCE-BASED ADVICE`). Two files were right; my audit was wrong.
- I suspected the Eastman/Freeman DOIs of misattribution; Crossref cleared them. Reported as a
  negative result rather than quietly dropped.
- **The audit also damaged the skill itself, and the skill was wrong in three places.** (1) SKILL.md
  told the agent to "round up" with no converse, so following it literally rounds a *maximum* (dead-end
  length, travel distance, slope) upward - an unsafe direction, now written as
  `ceil for a minimum / floor for a maximum`. (2) It asserted "never mix classes in one sentence" while
  enumerating seven of the spec's eight claim classes. (3) It gave no rule against disavowal
  displacement, the corpus's dominant defect, and no rule that convergence must be counted in origins
  rather than citations - both are now in `## Evidence Rules`. That pattern (a document that encodes a
  rule it does not itself satisfy) is worth checking for in anything this project generates.
- Group 05's EN 17037 finding was over-called and I refuted it by reading the cited paper. Two
  lessons: an auditor's "absent from the source I read" is not "absent from the source"; and
  verification groups need to be told to open the *specific* citation that carries the number.

## 11. Final judgement lists

**Safe to use as a foundation now** (procedure and physics, not numbers):
`SKILL.md` (with §3 caveats honoured), `architecture-theory.md`, `grid-translation.md` (tile layer),
`adjacency-graphs.md`, `validation.md`, `uncertainty.md`, `decision-making.md`,
`design-alternatives.md`, `failure-patterns.md`, `operations-maintenance.md`, `bim-cad.md`,
`human-scale.md`, `human-behavior.md`, `synthesized-rules.md` (after the convergence re-labelling),
`sources.md`.

**Usable only after retrieving a readable primary for their numbers** (method still good):
`construction.md`, `economics.md`, `space-programming.md`, `floor-plans.md` (4 attributions),
`environmental-design.md` (shading magnitudes, Appendix G), `multi-scale.md` (traffic constants),
`site-context.md` (municipal citations), `real-projects.md` (6 rule-level citations resting on dead links to re-place).

**Nothing in the set is discardable.** The failure mode found is not invention; it is *unverified
specificity* — numbers carried forward at a confidence their citation cannot hold. The remedy is
already encoded in the skill (UN-03/UN-06/SR-14/flag register); what this audit adds is that the
remedy must be applied to the research files themselves, not only to designs produced from them.

## 12. Addendum — adjudications and fixes after the first pass

### Group 01 (codes + human-scale), orchestrator adjudication
- Verifier headline: *both files are honest about gaps and unreliable about confirmations.* Accepted as
  the correct characterisation: the **principles layer is sound**, the **verification column was
  inflated**.
- Independently confirmed by the orchestrator against `up.codes` §1018 and Access Board ch.4: corridor
  44 in/1118 mm (36 in/914 mm under 50 occupants), route 36 in (915 mm), 32 in (815 mm) for ≤24 in with
  48 in separations, 42/48/42 in at a 180° turn about a <48 in element, 60 in passing spaces at 200 ft,
  door clear width 32 in. These rows are SUPPORTED and were left alone.
- Confirmed mis-citation: the common-path row cited **Table 1006.2.1**, which is the exit-count table.
- Confirmed dead: the NFPA horizontal-exit link 404s; the `yes (T1 gov)` NCC rows were not on the page
  cited. All such rows demoted to `partial`/`no` with the closing evidence named.

### Fixes already applied (verified by re-grep)
- `grid-translation.md`: GT-01's invented ISO quotation removed and restated as a paraphrase; the
  preferred-length list replaced with what the source actually states (multiples of 3/6/12/15/30/60
  basic modules → 300/600/1200/1500/3000/6000 mm, tier T3); GT-11 corrected to 2×3 tiles = 1.0×1.5 m;
  GT-14's core corrected to 15×13 = 195 tiles = 48.75 m² with the packing shown band by band; every
  DIN 4150-1 / BS 5606 citation withdrawn at the point of use; GT-07 and GT-21 demoted STANDARD →
  DESIGN PRINCIPLE, GT-18 → ENGINEERING CONSTRAINT.
- `human-scale.md`: Queen US bed row corrected (42 tiles = 10.5 m², not 12.0 m²).
- `grid-translation.md` GT-17: worked error table corrected (`10×8 = 80 tiles = 20.0 m², +16 %`;
  `15×8 = 120 tiles = 30.0 m², 0 %`) and the muddled net/gross pair replaced with a stated identity:
  `gross_plate ≥ net_to_shell ≥ net_programme`, gaps = circulation + structure + services.
- `design-alternatives.md`, `decision-making.md`: Rittel title and Archer given name corrected.
- `synthesized-rules.md`: convergence ledger re-labelled as file counts, with the single-origin rows
  named and demoted to warn-only.
- `SKILL.md`: rounding direction made safe (ceil a minimum / floor a maximum), disavowal-in-rule and
  count-origins-not-citations added to Evidence Rules, reading budget and demand-input declaration
  earlier in the same pass.

### New contradictions surfaced by remediation (recorded, unresolved on purpose)
- **Shaft minimums disagree across files**: `grid-translation.md` GT-14 packs a 1×2-tile shaft while
  `construction.md` CN-12 states a 3×3-tile minimum. Both cannot be project defaults. The
  contradiction is real evidence that shaft sizing in this corpus is unanchored: it needs a plumbing or
  equipment datum, not a preference. Flagged in both files, neither silently rewritten.
- **ADA Table 404.2.4.1 values differ between `building-codes.md` and `human-scale.md`.** Left as
  `table not machine-readable this pass` rather than choosing a version, because picking one would
  launder an unresolved discrepancy into a design constraint.

## 13. Research depth audit (measured, not felt)

Depth was measured as evidence density and self-declared uncertainty - never as length, token count or
citation volume. Per file: rules; rules whose `- Source:` bullet carries a URL; rules containing
`UNCITED`; rules whose `- Confidence:` states Low or Medium; mean characters of the `- Evidence:` bullet.

| Tier | Files (URLs-with-source / rules, mean evidence chars) | What the tier means |
|---|---|---|
| A - dense and self-critical | professional-practice 26/26, 1214 · real-projects 27/27, 822 · site-context 19/24, 1186 · operations-maintenance 16/28, 1188 · lifecycle 24/24, 888 · human-behavior 26/26, 726 · environmental-design 25/26, 691 · economics 16/22, 652 | evidence quoted at length from a page that was opened, and Low/Medium labels applied where they are owed |
| B - sound method, patchy sourcing | architecture-theory 27/29, 734 · floor-plans 25/25, 486 (10 UNCITED) · building-codes 22/28 (25 low/med) · human-scale 15/28 (14 UNCITED) · space-programming 13/24 (11 UNCITED) · validation 16/23 · uncertainty 15/20 · adjacency-graphs 18/24, 894 | reasoning is checkable; a third or more of the figures are self-declared uncited |
| C - asserted rather than sourced | bim-cad 5/24 (20 UNCITED, 203) · decision-making 5/24 (16 UNCITED) · multi-scale 14/24 (16 UNCITED) · construction 1/28 · design-alternatives 2/10 | usable as framework, not as authority; grid-translation sits between B and C (its URLs live in a numbered S-list, so the probe under-reads it) |

Two instrument limitations, recorded so they are not misread as findings:

- `failure-patterns.md` reports 0 URLs and 0 evidence characters because its records use the
  spec-mandated Failure / Cause / Detection / Prevention / Correction shape instead of an
  `- Evidence:` bullet. Its citations are real; the probe cannot see them.
- `grid-translation.md` resolves URLs through a numbered `S1…S8` source list, so per-rule probing
  under-counts it. Its citation quality is better than the raw row suggests and worse than a first
  reading assumed - three of its anchors were corrected during remediation.

Effect on the verdicts: `bim-cad` moves from MINOR ISSUES to **NEEDS RESEARCH**; `construction` and
`space-programming` remain C-tier on numbers; and the useful pattern is confirmed - the files admitting
the most uncertainty are the ones with the least evidence, which is the correct pairing, and none of the
Tier A files quietly substituted volume for sourcing.

### Host-model claims re-verified during the audit (the corpus's strongest layer)

`FloorData` in `src/blueprint-editor/domain/schema/layout.ts` carries only `id, name, label,
labelColor, objects, defaultWalkable, walkable, spawnZones, allowedRoleIds`, and `FloorLayoutData` holds
a flat `floors[]` — no elevation, no storey index, no section, and every `height` token in the domain
schema is a 2D asset bounding box. So the corpus's central negative claim ("heights are not
representable, therefore escalate rather than compute") is verified, and the audit found one
**omission** instead: the layout does model the street (`streetWidthTiles`, `streetFloorId`), so
frontage and arrival-from-street decisions have a real host field and should bind to it. Both points are
now host facts 7 and 8 in `SKILL.md`.

## 14. Final verdict per deliverable

Format: **trust** = what may drive a design decision now · **weak** = what may not · **verify** = the
evidence that would close it · **danger** = the failure mode if used as-is. Eight files under active
remediation when this was written are marked `(remediation in flight)`.

| Deliverable | Verdict | Trust | Weak / verify / danger |
|---|---|---|---|
| `SKILL.md` | USE | whole procedure; host facts 1-8 (code-verified) | numeric constants marked heuristic; danger: an agent quoting the table as compliance |
| `architecture-theory` | USE | adjacency/zoning/circulation/quantisation method (27/29 sourced) | TH-26's 0.85 m element is partially supported; TH-02 wall tax verified correct |
| `grid-translation` | USE (post-fix) | tile arithmetic, rounding policy, host limits | ISO clause bodies unread → series claims rest on a T3 summary; danger: quoting GT-06 preferred lengths as normative |
| `human-scale` | USE for ADA-derived checks | clearances read from Access Board ch.3/4; NHS bed spacing corroborated | nominal bed sizes and NKBA aisles unverified; danger: percentile tables recalled not read |
| `human-behavior` | USE | FHWA/IMO bands, IBC lobby rule, cohort and nurse-path findings | IMO density transcription and two noise ORs corrected; Küpper spacing unverifiable; danger: treating any LOS number as design law without the edition |
| `operations-maintenance` | USE | route/catchment/removal-path logic; 16/28 URL-anchored | hotel BOH share and lift counts consultancy-grade; danger: sizing a pantry from another country's standard |
| `lifecycle` | USE for the argument, not the values | IgCC, EN 1990 (table 2.1), GPDO/London Plan, retain-first literature | per-element service-life values absent; danger: quoting a design life to justify omitting access |
| `economics` `(in flight)` | USE method only | metric definitions, measurement-convention discipline | net-to-gross bands and two computed premiums contradicted; danger: yield ratios as design objectives |
| `space-programming` `(in flight)` | USE method only | take-off ladder, capacity-first rule, convention disclosure | register m² bands unread-from-source; danger: any area quoted "per BB103/GSA" without retrieval |
| `failure-patterns` | USE | severity ladder, 18-scan suite, host-trap failures | thresholds declared as project parameters; danger: treating a heuristic cut-line as a code limit |
| `validation` | USE | protocol: oracle, integrity gate, three-valued verdicts, closure rights | VA-07's SAST analogy is an inference, not a finding |
| `uncertainty` | USE | status taxonomy and register discipline (self-referentially honest) | confidence-ladder numbers are imported by analogy |
| `decision-making` | USE | satisficing, phase separation, decision-record schema | 16 uncited rules now labelled; danger: its priority ordering read as law |
| `design-alternatives` | USE | axis/diff-vector/comparison protocol | thin (10 rules), single lineage; not independent corroboration anywhere |
| `adjacency-graphs` | USE | planarity/degree bounds (mathematically confirmed), role-parameterised graphs | AG-06 grade scale demoted to heuristic; danger: treating graph metrics as behavioural prediction |
| `bim-cad` | USE as a mapping, not a specification | the two IFC relations actually read; the derived-quantities and rule-shape lessons | 20/24 rules uncited; suspected invented clause number; danger: asserting IFC semantics from this file alone |
| `synthesized-rules` | USE with its own caveat | the 37 rules and the tension register | convergence = file count (relabelled); 4 rows single-origin → warn-only |
| `sources` | USE as index | faithful reproduction of each file's list | inherits every upstream mislabel; a URL listed here is not a URL verified here |
| `construction` | USE proxies only (post-fix) | the plan-proxy logic: span as distance between bearing lines, shaft as stacked cluster, band as tagged tiles; the sequencing/repetition reasoning | **no span band is sourced** (11 demoted to heuristic); §708/§704.1 corrected; turning circle fixed from 6×6 to 3×3 tiles; danger: choosing a bay because "construction.md says 6-9 m" |
| `site-context` | USE method, verify citations | factor→consequence reasoning, access/setback logic (19/24 URL-anchored) | 3 unique municipal links (7 rule-level citations) do not resolve, so the "local practice" examples are unverifiable rather than wrong; danger: quoting a FAR or imperviousness figure as if adopted law |
| `professional-practice` | USE with inline qualifiers (fixed) | practitioner consensus properly tiered; PP-10/13/14/17/18/19 geometry findings | PP-23 statistics now marked `do not quote` at the rule; PP-03 "<=15 beds" restated as a recommendation because the source says "ideally"; 10 rules had their caveat moved into the rule text; danger: a T5 heuristic driving a room count |
| `real-projects` | USE for rationale, not outcomes (fixed) | project existence, architect, parti reasoning (27/27 URL-anchored) | self-reported outcomes now labelled advocacy in-rule; RP-19 demoted CODE REQUIREMENT -> HEURISTIC (vendor pages); RP-13 threshold resolved to 40 tile-steps by arithmetic; dwelling count corrected 330 -> 337 |

### Source census behind the quality judgement

1,462 citation instances across 345 distinct hosts (instances, not unique URLs - the same standard is
cited repeatedly by different files, which is the independence question in §7).

| Class | Share | Reading |
|---|---|---|
| official / standards body **or a mirror of one** | 28 % | the strongest layer, but a material part of it is `up.codes` (44), i.e. a mirror standing in for paywalled ICC text |
| practice / institutional / professional media | 13 % | WBDG, CTBUH-adjacent, steelconstruction.info, studioMatrx - appropriate for method claims, not for numbers |
| peer research (arXiv, PMC, DOIs, journals) | 11 % | 102 arXiv + 88 PMC + 25 DOI instances, concentrated in floor-plans, human-behavior, lifecycle, economics |
| vendor / trade / community / secondary | 3 % | small in count, but over-weighted in consequence (the shading blog, the lift consultancy, the glossary net-to-gross bands) |
| unclassified long tail | 45 % | 345 hosts means most domains appear once or twice - broad and thin in places |

Concentration is the finding: the top twelve hosts carry 26 % of all citations. That is efficient for
coverage and dangerous for independence - when `access-board.gov` (46) is wrong, dozens of rules move
together, and when `up.codes` (44) is a stale rendering, the entire IBC-derived layer ages with it.
Wikipedia appears 37 times, and the one place it mattered (the ISO preferred-series list in
`grid-translation.md`) is exactly where it turned out to be load-bearing enough to require correction.

## 15. Fact / inference / recommendation separation, measured

Class labels over all 568 rules:

| Class | Rules | Share |
|---|---|---|
| DESIGN PRINCIPLE | 144 | 25 % |
| CODE REQUIREMENT | 116 | 20 % |
| STANDARD | 108 | 19 % |
| ENGINEERING CONSTRAINT | 76 | 13 % |
| HEURISTIC | 47 | 8 % |
| FACT | 46 | 8 % |
| BUILDING-TYPE CONVENTION | 24 | 4 % |
| EXPERIENCE-BASED ADVICE | 2 | ~0 % |
| non-canonical label text (a demotion note written into the Class field) | 5 | ~1 % |

Distribution is healthy in shape: two fifths of the corpus is explicitly principle- or heuristic-level,
and only 4 rules write two classes into one field. The problem is not the distribution, it is the
**88 rules where a `FACT` / `STANDARD` / `CODE REQUIREMENT` label coexists with the rule's own
admission of uncertainty** (`UNCITED`, "heuristic", "not established", "recollection", "assumed").
Concentrated in `bim-cad.md` (its entity semantics asserted from knowledge of IFC rather than from a
readable clause), `adjacency-graphs.md` (three `STANDARD` scale/notation rules), `architecture-theory.md`
(TH-12/21/26) and `human-scale.md`.

Triage rule applied, not blanket demotion: a `STANDARD` label is kept where the body genuinely states the
rule and the uncertainty concerns a different element (an IFC entity exists; the attribute list was not
read); demoted where the label is doing the work the evidence cannot (a preferred-dimension list, a ratio
band, a convention); re-scoped where the claim is jurisdiction- or edition-bound but written as universal.
Five rules also need their Class field cleaned of embedded demotion prose - the field must hold one label,
with the history in `Confidence`.

> Counts were taken while remediation was running, so they drift: the citation-instance census read 1,462 and re-reads 1,465 minutes later because remediation edits add citations. Unique URLs (560), distinct hosts (345), rules (568) and master rules (37) were stable across the whole audit. Percentages in this report are therefore indicative to about one citation, not exact to the decimal.
| `building-codes` `(in flight)` | USE the principles layer, not the validator layer | the reasoning chain (load -> exits -> width -> distance -> remoteness), the flag-instead-of-fake protocol, the jurisdiction discipline, and §1018/ADA route figures the orchestrator re-read at source | the `verified?` column over-claims (`yes (T1)` on pages that did not carry the figure), the NFPA link is dead, six section numbers mismatch the stamped edition, common path cited to the exit-count table; danger: treating this file as a checklist that can certify a plan |
| `environmental-design` `(in flight)` | USE chain and method | the climate -> orientation -> envelope -> openings -> placement -> circulation -> services ordering, façade-budget discipline, sDA/ASE definitions, acoustics-as-geometry (evidence-dense: 25/26 rules URL-anchored) | shading magnitudes came from a vendor blog citing an unnamed study (being removed); ASHRAE Appendix G is the wrong document for the 15 ft perimeter claim; EN-03 caps rounded down-when-they-should-round-to-the-safe-side; danger: scoring a plan's environmental quality on numbers the file cannot support |
| `floor-plans` `(in flight)` | USE for the failure taxonomy | dataset existence verified for all five corpora; the topology-before-geometry argument; the quantisation and invalid-opening failure list; the deliberate exclusion of three unverifiable datasets | four attributions repaired (MSD over-claimed for vertical alignment, a benchmark figure/title/venue, an average IoU read as a threshold, a review statement not in the review); its circulation-share and aspect bands are self-declared placeholders; danger: quoting a dataset distribution as a design standard |
| `multi-scale` `(in flight)` | USE the test set | coordinate-set alignment checks, one-core-until-bound reasoning, two-independent-vertical-path requirement, stack discipline - all expressible and checkable on this host | lift handling-capacity constants and queue ratios have no reachable source; CTBUH *Height Criteria* was cited where it does not govern cores; 8 dead URLs; C-06/C-14 presented heuristics as thresholds; danger: sizing a bank of lifts from this file and calling it traffic analysis |

## 16. Targeted conflict adjudication

Every candidate conflict was resolved by reading the numbers where they are asserted, not by voting.

| Quantity | Values found | Verdict |
|---|---|---|
| Exit-access corridor default | "corridors default to 3 tiles"; "get 3 tiles by default; drop to 2 where served load <50"; "unsure 36 in or 44 in -> design 44 in (3 tiles)" | **consistent** - three files, one rule, correctly conditional. Positive result: the single most-used width in the corpus does not conflict. |
| Back-of-house share of plate | "BOH 15-25 % of gross" (Archgyan, T4 consultant) vs "back-of-house may constitute up to 20 %" (Chapman Taylor, T3 practitioner judgement) | **competing, and weakly grounded both ways.** Not a contradiction - a range and a ceiling - but SR-09 and PP-02 use a BOH share as a *programme premise*, so a hotel planned at 15 % can be short 5-10 points of plate. That is precisely the failure SR-09 exists to prevent, and the evidence cannot decide the number. Action: treat as a project-set input from the operator's brand standard; the corpus may not supply it. |
| Shaft minimum | `grid-translation.md` GT-14 packs a 1x2-tile shaft; `construction.md` CN-12 states a 3x3-tile minimum | **genuine conflict.** Both are unsourced planning defaults, and they differ by 8x in area. Flagged in both files; needs a plumbing/equipment datum (pipe size + insulation + access), not a preference. |
| Dead-end corridor cap | 22 tiles / 34 tiles / 40 tiles / 91 tiles / 305 tiles appear | **not conflicts** - they are different code contexts (UK 11 m class, IBC 20 ft unsprinklered, IBC 50 ft sprinklered, NCC 20/40 m). Each is jurisdiction-bound and the file labels which. Recorded so nobody reads a single "dead-end limit" for the corpus. |
| Door clear width | 32 in / 815 mm dominant, 36 in for deep openings, 44 in corridor-linked figures | **consistent** with ADA §404.2.3 as re-read at source. |
| Daylight depth | ~4 tiles (glazing-head rule) vs 8 tiles (working cap) vs 22/27/37 tiles (plate-level examples) | **layered, not conflicting**, but only because TH-26 states the hierarchy. A file that quoted 37 tiles without the assumption block would be wrong; the requirement to declare the input is what makes it safe (EN-26, UN-07). |


### RP-13 adjudication (example of the method)
The rule asserted a 20-tile supervision radius while its own check tested 40. Worked on the host: 20 tiles orthogonal = 10 m, and 28.3 m of all-diagonal travel = ~57 tiles, so no single figure satisfies both readings; 40 tile-steps (= 20 m of orthogonal travel) is the only value consistent with both lines, so both now read 40 with Confidence Low and the radius declared as a project parameter rather than a finding. This is the pattern the whole audit was after: the numbers were not wrong because the source was bad, but because two sentences in one rule had never been reconciled.

### Codes remediation - completed by the orchestrator, and what that proves

The codes agent applied 30 demotion markers and then stopped with the job unfinished: the placeholder
`media/.../AD_B2_2026.pdf` URL, the NFPA `yes (T1 blog)` stamp on a link that 404s, two NCC
`yes (T1 gov)` stamps, and the register legend were all still outstanding. The orchestrator finished
those four items directly. The remaining seven `yes (T1)` stamps are correct and were checked, not
inherited: they are the Access Board ch.3/ch.4 figures and the Washington-State adopted IBC table, and
the audit re-read the Access Board and `up.codes` pages in session.

That incident is the same failure mode the project patched an hour earlier, occurring while the
patched rule was being applied - so the rule is right and the enforcement is the gap: a brief that says
"write early" still needs a checkpoint that the *whole* deliverable, not just the file, exists before
the budget ends. Recorded as the audit's most useful process observation.

## 17. Independence test, measured per file

For each file: rules carrying a URL in `- Source:`, distinct hosts behind them, and the share resting on
the single most-used host. Concentration is only a defect relative to what the host *is*.

| File | Rules w/ URL | Distinct hosts | Top host share | Reading |
|---|---|---|---|---|
| floor-plans | 25 | 4 | 96 % arxiv.org | **weakest independence in the set** - a whole domain standing on preprint servers, one venue family, is one opinion cycle away from stale; datasets and papers are real, but peer-reviewed confirmation is absent for most |
| human-scale | 15 | 5 | 80 % access-board.gov | **strong, not weak** - one primary standard reached directly; repeating a standard across rules is correct practice |
| construction | 1 | 2 | 100 % (a 403-blocked ICC host) | effectively no web evidence base; the demotion to heuristic is therefore accurate, not punitive |
| bim-cad | 5 | 4 | 60 % github.com | **bad mix** - an issue-tracker thread carrying 60 % of the sourced rules for a normative standard |
| human-behavior | 26 | 28 | 65 % PMC | acceptable: an aggregator of peer-reviewed papers, spread across 28 hosts overall |
| environmental-design | 26 | 36 | 56 % legacy.wbdg.org | good breadth (36 hosts); the agency page carries the daylight/ventilation heuristics, which is what an agency guidance page is for |
| building-codes | 22 | 10 | 50 % up.codes | the known single point of failure for the whole IBC layer, and the reason the legend now says `yes` means "read from a reachable page", not "the law where you build" |
| professional-practice | 26 | 29 | 42 % england.nhs.uk | healthy spread for practitioner-derived rules |
| economics / lifecycle / real-projects / site-context / operations-maintenance / decision-making / validation / uncertainty / adjacency-graphs / space-programming / multi-scale | - | 10-29 | 13-46 % | normal spread; no single-origin capture beyond what the row-level notes already flag |
| grid-translation, failure-patterns | 0 in per-rule Source | - | - | instrument limitation (numbered `S1…S8` list; Failure/Cause/Detection record shape), documented in §13 |

The one action this adds: treat `floor-plans.md` as **one source, not twenty-five** when it appears in a
convergence count, and prefer `real-projects.md` (26 hosts) or `human-behavior.md` (28) wherever a
claim about how buildings actually behave can be sourced twice independently.

## 18. Executable verification of the host-model claims (highest-value finding)

Research prose cannot check a claim about code, so the host rules were re-implemented and run against a
synthetic 40x30-tile hotel typical floor (core, shaft, 3-tile corridor, six 6x8-tile guest units, each
with a 2-tile door run), using the engine's own room algorithm (4-connected flood-fill, door cells
excluded).

| Check | Result | Verdict |
|---|---|---|
| Tile-class reconciliation | `blocked 180 + walkable 1008 + door 12 = 1200 = 40x30` | **PASSES** - the reconciliation rule the corpus insists on is arithmetically closed |
| Room derivation | 7 components: six at exactly 24 tiles + one circulation mass of 864 | **PASSES** - units derive at the predicted interior, so flood-fill typing is usable as written |
| Enclosure identity | outer 6x8 = 48 tiles, interior `(W-2)(H-2) = 24` measured, ring 24 = `2W+2H-4` | **PASSES** - TH-02 / SP-14 / GT-23 arithmetic confirmed by execution, not by eye |
| **Door "bisects a room" claim** | 1 door tile in a 1-tile corridor -> **2 rooms**; a full-height door column across an open field -> **2 rooms**; but 1 door tile in the centre of a 9x9 open field -> **1 room**, and 2 door tiles -> **1 room** | **OVERSTATED IN THE CORPUS** - doors divide a region only when they form a cut set across its width. Six files (and SKILL.md's host fact 1) said any interior door "bisects" it |
| Circulation share as computed | 72 % of plate / 85.7 % of non-wall tiles on this deliberately sparse test plate | method works; the number is an artefact of the toy floor, not a finding |

Corrections applied as a result: `architecture-theory.md` (TH-02 door test), `grid-translation.md`
(GT-22 retitled "do not lay a door run across a room width"), `failure-patterns.md` (FL-06 retitled and
its header sentence), `human-scale.md`, `validation.md` (integrity-gate wording),
`synthesized-rules.md` (SR-02 and the cross-domain findings), and `SKILL.md` host fact 1 - all now
state the tested rule and require the agent to **measure the derived room count** instead of assuming a
door divides.

Why this matters more than the citation findings: the bisection claim was tagged `FACT`, cited to a real
`file:line`, and repeated across six files as if the repetition were corroboration. It was wrong in its
general form, and no amount of reading more architecture literature could have found that - only running
the algorithm could. The corpus's own rule that quantities must be derived, not authored (BIM-14, SR-25)
applies to host facts too.

### Second executed finding: the room-typing ladder is worse than the corpus said

Running the real `resolveRoomType` against fixture-tag combinations:

| Fixtures present | Derived type | Consequence |
|---|---|---|
| `living` + `hygiene` (bed + en-suite) | `bedroom` | as the corpus said - the en-suite is invisible to typing |
| `wellness` + `hygiene` (spa + basin) | `bathroom` | as the corpus said |
| `dining` + `hygiene` (restaurant + hand-wash) | **`bathroom`** | **not stated anywhere in the corpus** - a food outlet with a wash sink stops being a restaurant |
| `front-desk` + `living` (lobby with seating) | **`bedroom`** | same class of failure in the arrival space |
| `storage` + unknown tag | `storage` / unknown -> `hall` | clinical, industrial, laboratory, plant vocabulary has no type |

Cause: the ladder is `living 10 < hygiene 20 < wellness 30 < cooking/dining/retail/meeting/... 40 <
front-desk 50 < hall 999`, and the *lowest* number wins - so the two most common domestic fixtures
outrank every operational room type. This is a stronger and more actionable statement of SR-19: the
host cannot be trusted to report what a room *is*, only what its dominant fixture *means*, so the
design's room list must be reconciled against derived types rather than derived against the list.
`octileDistance` was also executed: the corpus's "open hall up to ~1.41x cheaper corner-to-corner"
claim reproduces exactly (28.28 vs 40 tile-costs, ratio 1.414).

## 3b. Claim-level evidence table (requirement 15) - every CRITICAL / NEEDS RESEARCH item

| Claim (rule id) | Cited source | What the source actually says | Problem | Evidence status | Evidence required to close |
|---|---|---|---|---|---|
| RC flat slab spans 6-9 m etc. (CN-04/05/28 + span table) | "authorities located, tables not value-read" | no readable table; the pages named do not carry the band for the system named | band presented as engineering constraint while unsourced | **UNVERIFIED** | a readable published span table (institution handbook, edition) per system |
| Drain slope / cleanout section (CN-17, CN-20) | IPC Ch. 7 | §704.1 carries the slopes (1:100, 1:50, 1:16 equivalents); cleanouts are §708, not §707 | wrong clause, and slope arithmetic originally 2x off | **PARTIALLY SUPPORTED** (clause corrected, rates confirmed at a mirror) | adopted plumbing code edition, locally verified |
| Vehicle turning circle 6x6 tiles (CN-07) | vendor/trade page | the geometry does not support a 12 m circle for the vehicle class implied | figure ~2x too large | **CONTRADICTED** -> corrected to 3x3 tiles as a placeholder | manufacturer swept-path data for the actual vehicle, or delete the number |
| Net-to-gross 60-80 %; office 65-80 % (EC-03/04/21) | T4 commercial glossary | a marketing glossary, no methodology, no measurement standard named | presented as a documented band | **UNSUPPORTED as a benchmark** | BOMA/RICS current standard text, read, with the edition |
| Frame choice saves 1.5 m height over 4 storeys; 24 % span premium (EC-09/EC-10) | steelconstruction.info cost study | the page states envelope cost ~5 % lower and heights 4.18 vs 4.375 m; **no** span premium and **no** 1.5 m figure | figures invented from a real source's existence | **CONTRADICTED** (marked do-not-quote in place) | a source that actually states the premium, or drop |
| Register room areas "per BB103 / GSA / HBN" (SP register rows) | official PDFs located | documents exist and are the right authority, but were not readable this pass | figures carried with an implied read | **UNVERIFIED** | open the specific table in the specific edition, record page and paragraph |
| "MSD documents vertical alignment" (FP-13) | MSD dataset paper | records shared unit IDs across floors, not alignment | citation does not establish the claim | **CONTRADICTED** | a real multi-floor alignment source, or cite SR-15's other supports only |
| Benchmark 80,315 plans, ECCV venue (FP-01/25) | *DStruct2Design* benchmark | the figure is 80,788; venue/title differ from the citation | mis-transcribed citation | **CONTRADICTED** -> corrected in place | none - corrected |
| Graph2Plan 0.65 as an acceptance threshold (FP-03/18) | Graph2Plan paper | 0.65 is an average IoU score | an average repurposed as a limit | **PARTIALLY SUPPORTED** (statistic real, use wrong) | none - restate as project-set parameter |
| External shading cuts peak 12-18 C vs internal 8-13 C (EN shading rule) | shutter-vendor blog | blog summarising an unnamed BBSA study; no method, no figures at source | marketing content as measurement | **UNSUPPORTED** -> magnitudes removed, direction kept | a measured study with method |
| 15 ft / 4.6 m perimeter HVAC zone (EN-25) | ASHRAE 90.1 Appendix G | Appendix G is a performance-rating method, not a perimeter-zone definition | wrong document | **CONTRADICTED** | ASHRAE 90.1 or a duct-design guide section that actually defines it |
| IBC travel distance / exit tiers "verified: yes (T1)" (CODE-02/07 rows) | up.codes mirrors, IBC tables | mirror carries some figures; Table 1017.2 and the 49/500/1000 tiers were not on the pages reached | verification column over-claimed | **UNVERIFIED** (now `partial`) | codes.iccsafe.org access or the adopted local edition |
| NCC escape-travel figures `yes (T1 gov)` (CODE-06/07 rows) | ABCB NCC pages | the cited pages did not carry those figures this pass | same over-claim | **UNVERIFIED** (now `partial`) | adopted NCC edition Part D1/D2 text |
| Common path of egress = Table 1006.2.1 (CODE-03 row) | IBC numbering | 1006.2.1 is the exit-count table; common path is in the corridors article | wrong clause | **CONTRADICTED** -> corrected | confirm against adopted edition |
| Door tile "bisects" a room (GT-22, FL-06, TH-02, VA-07, host fact) | `engine/npc/rooms.ts:2,15,33` | the file excludes door cells from rooms; it does **not** make an isolated door divide a region - executed: 1 door in a 1-tile corridor -> 2 rooms, 1-2 loose door tiles in an open 9x9 field -> 1 room | a real code fact over-generalised into a rule, then repeated across six files as if corroborated | **CONTRADICTED in general form** -> all six restated, tested statement now required | none - resolved by execution |
| Room type is what its fixtures mean, not what the plan intends (SR-19 extension) | `domain/schema/rooms.ts:9-33` + executed `resolveRoomType` | `dining`+`hygiene` -> `bathroom`; `front-desk`+`living` -> `bedroom`; `living`(10)/`hygiene`(20) outrank all operational room types | the corpus stated the en-suite case only; the ladder's general consequence was missing | **SUPPORTED but incomplete in the corpus** | none - extended in SKILL.md; propagate into SP-16/FL-07 |

## 19. Remediation state at completion

Applied and verified after the audit findings, across the corpus:

| Area | Before | After |
|---|---|---|
| Rules with a `FACT`/`STANDARD`/`CODE REQUIREMENT` label coexisting with self-declared uncertainty | 88 | 68 and falling as triage completes - the remainder are legitimate (a real standard stated, with an unread attribute list) and are now labelled that way in `Confidence` |
| Non-canonical `Class` field text (prose in the label) and dual-label fields | 5 prose + **24 dual labels** | 0 - all 568 rules carry exactly one of the eight spec categories, the second label moved into `Confidence` as an explicit classification note |
| `UNCITED` figures paired with `Confidence: High` | 27 genuine (42 detector artifacts) | split or demoted in the 13 files in scope; the rest were the artifacts |
| Structurally impossible citations (`media/.../`, truncated `…`) | 3 | 0 - replaced with honest "not retrievable; do not quote" notes |
| Rules missing Class / Source / Confidence lines | 0 | 0 (re-verified) |
| Door-bisection wording | asserted in 6 files + SKILL.md | 0 residual - every instance now states the tested rule and requires measuring the derived room count |
| Placeholder `## Sources` gaps, span bands, net-to-gross bands, shading magnitudes, ISO quotation, DIN/BS citations, IBC/NCC verification stamps, RP-13 radius, Unité count, RPLAN figure, MSD attribution, CTBUH attribution | as detailed in §3b | corrected, demoted or removed in place, each with the reason in the rule |

Deliverable integrity at completion: 25 research files (568 domain rules + index + synthesis), 10 audit
artefacts including this report, `SKILL.md` unbroken at 26 sections with all cited rule ids resolving,
and `node harness/scripts/verify.mjs check` passing.

## 20. Domain-relevance coverage test (requirement 10)

Each domain file was probed for the distinctive items its own spec section names - 227 items in total,
taken from the spec text rather than from what the file happened to contain.

**Result: 220 / 227 present literally.** All seven apparent misses were then checked by hand and none is
a concept gap:

| Probe miss | Reality |
|---|---|
| `floor-plans.md` "elevator" | present as "lift" (13 instances) - British spelling used consistently across the corpus |
| `floor-plans.md` "hierarchy" | expressed as FP-11's public / private / service label zoning, which is the spatial-hierarchy test in dataset terms |
| `architecture-theory.md` "flexibility" | carried by TH-28 (separate what changes often from what must not) |
| `space-programming.md` "circulation area" | carried as "circulation share" / "circulation + core" budgeting |
| `adjacency-graphs.md` "required adjacency" | carried as `must-touch` / grade 4 (9 instances) |
| `real-projects.md` "Divisare" | present (9 instances) - the probe string was my own typo |
| `real-projects.md` "AIA" | **the only genuine gap**: the spec lists AIA among permissible sources and the file used RIBA, The Architects' Journal, ArchDaily, Dezeen, Divisare, ArchitectureAu and architectureau instead. Source breadth, not coverage - noted, not treated as a defect |

No file was found to be generic filler dressed as a domain: each carries its own domain's named
sub-topics, and the ones with the fewest literal hits (`adjacency-graphs`, `space-programming`) were
using different vocabulary for the same objects, which the hand check resolved.

## 21. The audit applied to the auditor

The same detector was run over `SKILL.md`: of 25 numeric lines, 18 were flagged as carrying neither a
source nor a class label. Re-reading each by hand: **16 were detector artifacts** - grid-dictionary
definitions (`1 tile = 0.5 m` is a convention, not an empirical claim), corpus metadata, and lines whose
citation sits one line outside the probe window. Two were real: an illustrative "40 % of the floor is
corridor" and a "12 m clear span" example, both of which read as measured claims; both are now marked as
typical shapes / hypotheticals. All tables in the skill, synthesis and this report were checked for
column consistency (all consistent), every cited rule id re-resolved (none dangling), and the two audit
pointers inside the skill corrected to the sections that actually carry those findings.

The point of publishing this: an audit that only looks outward is not an audit. The same tooling found
the corpus's dominant defect, and applied to the auditor it found two overstated illustrations and three
of its own false metrics - which is the expected result when a method is sharp enough to cut.

## 22. A detector hole in this audit, found and fixed

The sweep that reported "non-canonical Class labels: 0" was wrong, and the error was in my instrument,
not in the files. It normalised the field by stripping everything from the first open parenthesis, so a
line like `STANDARD (notation) / HEURISTIC (the weights)` collapsed to `STANDARD` and passed. The label
itself was never invalid - the line carried two of them, which is exactly what spec §27 forbids and
what this audit exists to catch.

A paren-aware detector was written and run: **24 rules across 5 files carried two class labels**
(`adjacency-graphs` 11, `human-behavior` 7, `failure-patterns` 3, `architecture-theory` 2,
`human-scale` 1). Each was normalised by keeping the first label as the rule's class and moving the
second into that rule's `Confidence` line as an explicit classification note, so nothing was destroyed
and the field is machine-readable again. Re-verified after the fix: 568 rules, one canonical label each,
all required fields present, dual labels 0, and no dangling cross-reference.

Recorded rather than quietly fixed, for two reasons. It distinguishes a metric that passes from a metric
that measures. And it means the earlier counts produced with the flawed normalisation
(`class-vs-uncertainty tension`: 88, then 63/61 after triage; the triage agent's own 94 -> 69) are
*under*-counts of the class-labelling problem rather than precise measures of it. The substantive
findings are untouched by this, because each was established by an independent route: the door-bisection
error by executing the engine's flood-fill, the unsourced span and area bands by re-opening the cited
pages, the single-origin convergence counts by the host census, and the mis-citations by Crossref.
