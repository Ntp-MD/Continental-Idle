# Audit 03 — adversarial source verification: `grid-translation.md` (GT) + `construction.md` (CN)

Files read, not edited: `architecture-skill/research/grid-translation.md`, `architecture-skill/research/construction.md`.
Method: each load-bearing claim is listed with SOURCE-as-cited → WHAT THE SOURCE ACTUALLY SAYS → PROBLEM → STATUS → ACTION.
Status legend: SUPPORTED | PARTIALLY SUPPORTED | INFERRED | UNSUPPORTED | CONTRADICTED | UNVERIFIED. Action: KEEP | QUALIFY | REPLACE | REMOVE.
Distinct meanings kept separate: **"uncited but plausible"** (number is normal engineering practice, no source read) vs **"citation does not say this"** (a named source fails to carry the claim) vs **"arithmetic wrong"** (self-contained error, no source can rescue it).

---

## A. grid-translation.md — standards layer

### AG-1 (GT-01) — "the principle of coordinating the dimensions of construction elements and components to a common module so that they fit together without cutting on site"
- CLAIM (verbatim, GT-01 Evidence): presented *in quotation marks* as "the ISO 2848 idea of a 3M series built on a basic module of 100 mm, with the chosen module M used for the major dimensions and smaller modules for minor ones".
- SOURCE: S1 ISO 2848:1984 — T1.
- WHAT THE SOURCE ACTUALLY SAYS: pending
- PROBLEM: pending (quotation marks imply verbatim standard text; the file's own Sources note concedes "PDF body not machine-readable in this session, so no clause text is quoted" — i.e. a quotation is asserted from a document never read).
- STATUS: pending → ACTION: pending

### AG-2 (GT-01/GT-03/Sources/Citation reconciliation) — ISO 2848:1984 title, year, "principles and rules", 3M basis, 100 mm basic module
- SOURCE: S1, ISO OBP id 7846 + iteh sample PDF + Wikipedia summary; asserted **High** confidence in the reconciliation note.
- WHAT THE SOURCE ACTUALLY SAYS: pending
- PROBLEM: pending. Note the reconciliation note claims the ISO 2848 *title* and the *100 mm basic module* are verified at T1 while the same file says the body was never read — the title/abstract can confirm "3M system", the *body* is needed for "basic module 100 mm" (that is ISO 1006's job, per S1b).
- STATUS: pending → ACTION: pending

### AG-3 (S1b) — "ISO 1006:1983, *Modular coordination — Basic module* … is the standard that names the basic module"
- SOURCE: https://www.iso.org/standard/5470.html — T1.
- WHAT THE SOURCE ACTUALLY SAYS: pending (title/year/status of ISO 1006).
- PROBLEM: pending — GT-03, GT-10 and the master table's "1M = 100 mm" rows depend on this being the basic-module standard.
- STATUS: pending → ACTION: pending

### AG-4 (GT-03 + Sources + Weak-or-contested) — "500 mm is not a member of the 3M series; smallest dimension expressible in both systems is LCM 1500 mm = 3 tiles"
- SOURCE: S1/S1b + arithmetic (file claims LCM is self-evident).
- WHAT THE SOURCE ACTUALLY SAYS: pending for the series membership; arithmetic check in section D below.
- PROBLEM: pending — the LCM claim is arithmetic (LCM(500,300)=1500 ✓), but "smallest dimension exactly expressible in **both** systems" is only true if 1500 is itself a *preferred* 3M dimension (multiples of 300 that are whole tiles are 1500/3000/4500/6000…, and 1500/300=5 — must confirm ISO's preferred list admits 5×3M).
- STATUS: pending → ACTION: pending

### AG-5 (GT-03 Evidence) — "multiples used in practice are 60/120/300/600/1200/2400/3000 mm"; reconciliation confidence "Medium"
- SOURCE: S1/S2/S3 — no source read; file self-marks Medium.
- WHAT THE SOURCE ACTUALLY SAYS: pending
- PROBLEM: pending — 60 and 120 are not multiples of the 300 mm coordinating module (nor of the 100 mm basic module), so listing them inside "the 3M family built on a 100 mm basic module" is internally inconsistent regardless of what ISO says; also contradicts the same file's Weak-or-contested line ("the ISO 3M family runs 100/200/300/600/1200/2400/3600…").
- STATUS: pending → ACTION: pending

### AG-6 (S2/withdrawal check) — DIN 4150-1 "Modulraster": declared WITHDRAWN as unverified; confirm nothing still relies on it
- SOURCE: S2 — file says every hit is DIN 4150-3 *vibration*.
- WHAT THE SOURCE ACTUALLY SAYS: pending (is there a DIN modular-coordination standard, and under what number?)
- PROBLEM: pending — residual reliance: GT-03 Source line still reads `S2 DIN 4150-1 (Modulraster) — T1`, GT-07/GT-15/GT-18/GT-21 Source lines still read `S2`, and the Class of GT-07/GT-18/GT-21 is still `STANDARD`. The reconciliation note says "substitute S1", but the rule bodies were not rewritten → tier inflation persists in the file as it stands.
- STATUS: pending → ACTION: pending

### AG-7 (S6/BS 5606) — "BS 5606 *Guide to accuracy in building* lineage", declared NOT VERIFIED
- SOURCE: S6 — file says no record retrieved; principle re-credited to S1.
- WHAT THE SOURCE ACTUALLY SAYS: pending (does BS 5606 exist / what superseded it?)
- PROBLEM: pending — GT-07 keeps Class `STANDARD` and Confidence "High on principle" with an unverified identifier.
- STATUS: pending → ACTION: pending

### AG-8 (S3 govinfo PDF) — "NBS/NIST *International and national standards on dimensional coordination*"
- SOURCE: https://www.govinfo.gov/content/pkg/GOVPUB-C13-dbfc0c2959817b8c5904d1001a935af6/pdf/… — T2/T3, explicitly "a pointer, not evidence for a number"; Confidence in S3 supporting anything specific: "None".
- WHAT THE SOURCE ACTUALLY SAYS: pending (fetch attempt)
- PROBLEM: pending — GT-12 and GT-21's `S3` Source lines still carry it as partial support; the reconciliation note's "Confidence: None" must propagate to those lines.
- STATUS: pending → ACTION: pending

### AG-9 (S5/S7 Ching editions)
- CLAIMS: GT-06/GT-25 rely on S5 = Ching, *Architecture: Form, Space, and Order*, 5th ed. for proportion vocabulary; GT-08/S7 = Ching & Ward, *Building Construction Illustrated*, **5th ed.** for wall build-ups; CN files cite the **6th ed. (2023)**.
- SOURCE: T3, "cited by edition, URL not retrieved".
- WHAT THE SOURCE ACTUALLY SAYS: pending (edition existence/year; Ching & Ward vs Ching & Roundtree authorship; 5th vs 6th).
- PROBLEM: pending — GT-08's numeric build-up figures (75–200 mm partitions, 250–450 mm external, 25–75 mm finish) are attributed to a book not read; the claim is plausible practice but currently *uncited*, not *cited-and-wrong*.
- STATUS: pending → ACTION: pending

### AG-10 (S4/S8/S10/S12 — tier labels on unread sources)
- CLAIM: WBDG (T1/T3) supports ceil-on-minima; ANSI/BHMA A156 (S8) supports door-leaf/clear-opening sizing; lift/stair dimensional practice (S10); BOMA-type net-to-gross (S12, "no number asserted").
- WHAT THE SOURCE ACTUALLY SAYS: pending for S4/S8 (one fetch attempt).
- PROBLEM: pending — S8 names a series "from standing practice, no table quoted", yet GT-09's worked figures (838 mm leaf in 915 mm clear, ~1000 mm wall zone) are used numerically in the master table.
- STATUS: pending → ACTION: pending

### AG-11 (host-code FACTs — GT-02/GT-11/GT-19/GT-22/GT-23/GT-13)
- CLAIM: three tile states only (`walkable.ts:4`); rooms = 4-connected flood-fill excluding door cells (`rooms.ts:2,15,33`); octile A* with diagonals requiring both orthogonal neighbours open **and unoccupied** (`pathfinding.ts:190-228`).
- WHAT THE CODE ACTUALLY SAYS: pending (in-repo grep).
- PROBLEM: pending — these are the highest-confidence claims in the file and are cheaply checkable; if a line reference is wrong the FACT tier is still earned but the pointer misleads.
- STATUS: pending → ACTION: pending

---

## B. construction.md — span bands, code clause addresses, invented numbers

### AC-1 (CN-05 / Span table row: RC flat slab) — "RC flat slab ~6.0–9.0 m (12–18 tiles)"
- SOURCE as cited: The Concrete Centre *Slabs and Flat Slabs* lecture PDF — the row itself states that PDF gives "span/depth ratios, not an economical-span band" and marks the band **UNCITED — heuristic**; CN-05 Evidence says "commonly quoted in the 6–9 m band".
- WHAT THE SOURCE ACTUALLY SAYS: pending (search for a published economical-span band for solid flat slabs).
- PROBLEM: pending — this is the flagship band (drives CN-04/05/06 grid checks and the 12–18 tile rule).
- STATUS: pending → ACTION: pending

### AC-2 (CN-05 / table: load-bearing masonry) — "~3.0–6.0 m (6–12 tiles)"; CN-05 Evidence says "roughly up to 4.5–6 m"; CN-04 failure example: "an 18-tile (9 m) clear span declared as load-bearing masonry is physically absurd"
- SOURCE: TMS 402 named as authority, row states span/depth limits "were not read in this pass"; **UNCITED — heuristic**.
- WHAT THE SOURCE ACTUALLY SAYS: pending (TMS 402 is a *code requirements* document; does it or any published table give an economical floor-span band for bearing masonry?)
- PROBLEM: pending — also an internal inconsistency: the table band (3–6) and the rule text band (4.5–6) differ.
- STATUS: pending → ACTION: pending

### AC-3 (CN-05 / table: CLT one-way floor panel) — "~2.0–5.0 m (4–10 tiles)"; row "CLT with ribs/composite ~5.0–8.0 m"
- SOURCE: AWC/Think Wood *CLT Handbook (US Edition)* PDF, WoodWorks slides, Swedish Wood handbook — all three located, **tables not read**; row self-marks "do not quote a metre figure until the table row is read".
- WHAT THE SOURCE ACTUALLY SAYS: pending (attempt one read of a published CLT floor span value/table).
- PROBLEM: pending — CN-04 uses "6 tiles = 3 m (masonry/CLT one-way ceiling)" as a hard reject threshold; file's own Weak-list item 3 admits CLT numbers are the weakest in the table and that vibration governs (unmodelable here).
- STATUS: pending → ACTION: pending

### AC-4 (CN-05 / table: steel + metal deck; composite long span; trussed; PT; parking; joists)
- CLAIMS: deck 2.5–4.0 m / beams 6.0–9.0 m; composite 9.0–15.0 m "the only band where a 24-tile clear plan is plausible without a transfer"; trussed 15–45 m+; PT 8–12 m; parking frame 7.5–8.5 m; timber joists 2.5–5.0 m.
- SOURCE: SCI "composite design guides — T1/T3 (verify)" (no document read, no URL); PTI + IJAME 2023 + ICCAUA 2021 (located, not read) — PT row self-labelled "the best-evidenced row in this table"; parking row **UNCITED — heuristic**; joists "manufacturer span tables — T3 (verify)".
- WHAT THE SOURCE ACTUALLY SAYS: pending (one search on PT/flat-slab span comparison; SCI row is a bare organisation name).
- PROBLEM: pending — "best-evidenced row" is a *tier claim* about a paper that was not value-read: if a peer-reviewed comparison exists at those spans, SUPPORTED; otherwise tier inflation.
- STATUS: pending → ACTION: pending

### AC-5 (CN-01) — "the modular coordination literature recommends **3 m** as the minimum rational dimension for buildings"
- SOURCE: unnamed "ISO modular coordination background — see Sources"; Weak item 12 repeats it ("cited in standards literature").
- WHAT THE SOURCE ACTUALLY SAYS: pending (the ISO coordinating module is 300 mm = 3M; "3 m" looks like a unit/label slip for "3M").
- PROBLEM: pending — this claim sets the 6-tile (3.0 m) floor axis-spacing rule in CN-01's grid check, so a 10× unit error propagates into a hard validation threshold.
- STATUS: pending → ACTION: pending

### AC-6 (CN-17) — IPC §704 "Slope of horizontal drainage pipe" and §707 "Cleanouts"
- SOURCE: https://codes.iccsafe.org/content/IPC2018/chapter-7-sanitary-drainage — T1, "page retrieval returned HTTP 403, so no numeric value is quoted here; the clause numbers are the address to verify against"; PHCPPros restatement T4.
- WHAT THE SOURCE ACTUALLY SAYS: pending (verify IPC Ch.7 section numbering/titles for slope and cleanouts, and whether the "smaller diameter needs steeper fall" direction is right).
- PROBLEM: pending — the file *does* carry numbers in the same rule (20/40-tile placeholders, marked heuristic) and a directional claim about §704 ("minimum fall is stated per pipe size — smaller diameters need a steeper fall"). If the clause numbers are wrong, the "address to verify against" misroutes every future check.
- STATUS: pending → ACTION: pending

### AC-7 (CN-13) — "ICC *International Building Code* shaft enclosure (**E1018** in recent editions) and fire-resistance-rating (Chapter 7)"
- SOURCE: T1, with the caveat that edition/clause must be re-checked.
- WHAT THE SOURCE ACTUALLY SAYS: pending (locate the IBC shaft-enclosure section number).
- PROBLEM: pending — CN-13 is Class `CODE REQUIREMENT` with Confidence "High (that it exists)" resting on a clause address that may belong to a different code family (E10xx is accessibility numbering).
- STATUS: pending → ACTION: pending

### AC-8 (CN-12) — shaft minimums "4×4 tiles (2.0 × 2.0 m) combined wet riser group, 3×3 tiles (1.5 m) single small riser", +1 tile access face
- SOURCE: file states plainly **UNCITED — heuristic / invented order-of-magnitude** (also Weak item 6).
- WHAT THE SOURCE ACTUALLY SAYS: n/a — self-declared invention; BSRIA/CIBSE named but unread.
- PROBLEM: pending — cross-file conflict: grid-translation GT-14's worked core uses "2 shafts at **1×2 tiles**", which CN-12 declares an error ("refuse-to-enter shafts… must never be generated"; "a 1-tile shaft… cannot be built"). One of the two files is wrong about the same object.
- STATUS: pending (invention is correctly labelled) → ACTION: pending

### AC-9 (CN-07) — accessibility proxies "915/1067 mm clear widths, turning circle ~1500 mm" and "column ∉ wheelchair turning circle (a **6×6-tile** open square)"
- SOURCE: ADA 2010 / ANSI A117.1 — T1 (no provision quoted).
- WHAT THE SOURCE ACTUALLY SAYS: pending (one fetch/search on ADA clear width / turning space dimensions).
- PROBLEM: pending — tile conversion: 6×6 tiles = 3.0 × 3.0 m, whereas a 1500 mm turning circle = 3×3 tiles; GT-05 states the 3-tile version correctly, so CN-07 contradicts GT-05 and over-includes (invalidates columns that are actually legal).
- STATUS: pending → ACTION: pending

### AC-10 (CN-13/CN-26/CN-27 — rated assemblies and acoustic separation as plan geometry)
- CLAIMS: shaft/compartment/rated separation expressible via `rated`/`rated_door` tags validated by flood-fill (CN-13); party wall = 2 blocked tiles with "no back-to-back sockets / no shared valve tile on a party wall" (CN-26); travel distance = octile A* on walkable+door (CN-27).
- SOURCE: IBC Ch.10/Ch.7, NFPA 101, AD E, UL listings, ISO 717-1 — all named, none read; CN-26 marks DnT,w targets "REQUIRES ENGINEERING VERIFICATION, not quoted here"; Weak item 10 concedes the 2-tile party is "a modelling convention of this project, not a standard".
- WHAT THE SOURCE ACTUALLY SAYS: pending
- PROBLEM: pending — the *plan-geometry* proxy argument (CN-27) is sound reasoning and needs no citation; the CODE REQUIREMENT class on CN-13/CN-26 does.
- STATUS: pending → ACTION: pending

### AC-11 (CN-14/CN-15/CN-16/CN-19/CN-20 — services, plant, removal path, cleanouts, service band)
- CLAIMS: removal path clearWidth ≥ 4 tiles and no door narrower than 4 tiles; "the host's octile diagonal rule … mimics swinging a long object into a narrow corner"; valve/board within 20 tiles of first fixture; corridor ≥ 6 tiles carries a ≥1-tile service band; access tile at every drain bend.
- SOURCE: CIBSE Guides A/G/S, ASHRAE Applications, BSRIA AG/BG, NEC (NFPA 70) working space, BS 7671 IET On-Site Guide, IPC/UPC cleanouts, EN 12056-2 — every one named and none read (the file's own "Retrieval state" says so).
- WHAT THE SOURCE ACTUALLY SAYS: pending
- PROBLEM: pending — the diagonal-as-object-swing analogy is presented as a "usable proxy"; a movement rule about NPC occupancy is not a rigid-body turning-envelope check (real proxy is swept-path/turning templates). This is the clearest case of an *inference dressed as engineering*.
- STATUS: pending → ACTION: pending

### AC-12 (CN-17/CN-18/CN-21/CN-23/CN-22/CN-28 — plausibility/load-path statements)
- CLAIMS: gravity load path must be continuous (CN-03/CN-24); transfer is expensive and deep (CN-10); irregular geometry raises formwork/setting-out cost (CN-02/CN-21/CN-22/CN-23); A/V ratio drives envelope cost (CN-22); room depth ≤ 2 × span band as a daylighting proxy (CN-28).
- SOURCE: Ching & Roundtree 6th ed. (unread, T3), CTBUH (unread), DfMA literature ("specific articles to be pinned during verification"), Passivhaus/A-V literature (unnamed).
- WHAT THE SOURCE ACTUALLY SAYS: pending — qualitative direction only.
- PROBLEM: pending — these are correctly-classed *directional* statements; the risk is the numeric thresholds attached to them (`≤ 3 distinct bay widths`, `distinctPartCount ≤ 6`, `constancy ≥ 0.6`, `aspect ≤ 1.5`), all self-marked heuristic and all presented inside rules whose Class is `CODE REQUIREMENT`/`STANDARD` (CN-01, CN-13, CN-17, CN-20, CN-24…).
- STATUS: pending → ACTION: pending

---

## C. Pending web verification queue
1. ISO 2848 record (title/status/3M/basic module).
2. ISO 1006:1983 basic module record.
3. DIN modular-coordination standard number vs DIN 4150 subject; BS 5606 existence.
4. govinfo GOVPUB dimensional-coordination PDF content.
5. IPC Ch.7 section numbering (slope; cleanouts) + the directional claim.
6. IBC shaft-enclosure section number.
7. Flat-slab economical span band; PT comparison paper.
8. CLT floor span tables; masonry bearing span; Ching editions; ADA numbers (as budget allows).

---

## D. Arithmetic self-test (independent of citations)

| Ref | Check | Result |
| --- | --- | --- |
| GT-03/GT-10 | 500/300 = 1.667; LCM(500,300) = 1500 mm = 3 tiles | **correct** |
| Master table | 100→0.2; 200→0.4; 300→0.6; 400→0.8; 600→1.2; 1200→2.4 tiles; ceil errors +200/+100/+400/+300 | **correct** |
| Master table | 915→1.83→2 (1000, +85); 1400→2.8→3 (+100); 2400→4.8→5 (+100); 3600→7.2→8 (+400); 4200→8.4→9 (+300); 8400→16.8→17 (+100) | **correct** |
| GT-08 | 100+2×13+20 = 146 mm; 4500−146 = 4354; 9 tiles plate − 2 wall tiles = 7 tiles = 3500; 4354−3500 = 854 | **correct** |
| GT-11 | interior 4×3 = 12 tiles = 3.0 m² ✓ — but bisected rooms are "each **1.5×1.5 m**": 2×3 tiles = **1.0 × 1.5 m** | **WRONG (dimension label); 6+6=12 tile count is right** |
| GT-13 | Manhattan vs octile worst case = 2n / (n√2) = 1.414×; open-hall saving 1−1/1.414 = 29 % | **correct** |
| GT-14 | 12×15 tiles = 6.0×7.5 m = 45 m² ✓; but 3×(5×5) machine rooms (75) + 3×(4×6) halls (72) + stair + 2 shafts ≥ 187 tiles > 180 available | **SUM DOES NOT FIT — the "minimum core" is understated** |
| GT-17 | 3000×2600 = 7.8 m² → 6×6 = 9.0 m² = +15.4 % ✓; 2400×1200 = 2.88 → 5×3 = 3.75 = +30 % ✓ | **correct** |
| GT-17 | "4800×3600 → 10×8 = **90 tiles = 22.5 m²** vs 17.28 (+30 %)" | **WRONG: 10×8 = 80 tiles = 20.0 m² → +15.6 %. (10×9 would give 90/22.5/+30 %; 3600 mm ceils to 8 tiles, not 9.)** |
| GT-17 | "7500×4000 → 15×8 = **60 tiles = 15.0** vs 30.0 m² = 0 %" | **WRONG: 15×8 = 120 tiles = 30.0 m². The 0 % conclusion is right, the tile count halves.** |
| GT-23 | 14×120 = 1680; 13×15 = 195; 1680−195 = 1485 ✓; 1485×0.25 = 371.25 m² ✓; 14×78 = 1092 = 273.0 m² ✓ (net/gross 73.6 %) | **correct** (but see D-CN25 on the 78 % figure) |
| GT-24 | 6×5 → loses 18/30 = 60 % ✓; 12×10 → loses 40/120 = 33 % ✓; 8×14 = 112, interior 6×12 = 72, ring 40 = 10.0 m² = 36 % ✓ | **correct** |
| GT-25 | √2 at 6 tiles → 8.49 → 8 (1:1.333) or 9 (1:1.5) ✓; golden at 6 → 9.71 → 10 (1:1.67) ✓ | **correct** |
| GT-19 | 5000 mm at 30° = run 4330 / rise 2500; file's stepped approximation "4243 + 2475" | **approximation internally consistent** (a 6-step 45° stair of 500 mm tiles: run 3000+? — see note); the qualitative "wrong in both legs" holds |
| GT-07 | 9 × 800 = 7200 mm = 14.4 tiles, 0.6 tile = 300 mm ✓ | **correct** |
| Type table | hotel 3.6×7.2 m → 7.2×14.4 ✓; parking 2.5×5.0 → 5×10 ✓; 5.4 m radius → 10.8 → 11 ✓ | **correct** |
| Type table | "rack runs 1.2 m = 2.4 tiles … off-grid at ~**1 tile per 5 bays**" | **UNDERSTATED: ceil per bay = +0.6 tile → ~3 tiles per 5 bays** |
| CN table | every m→tiles conversion (3–6→6–12; 2–5→4–10; 5–8→10–16; 4.5–8→9–16; 6–9→12–18; 8–12→16–24; 2.5–4→5–8; 9–15→18–30; 15–45→30–90; 7.5–8.5→15–17; 2.5–5→5–10) | **all correct** |
| CN-17 | "a fall of 1:100 ≈ 1 tile of drop per 50 tiles of run" | **WRONG: 1:100 over 50 tiles (25 m) = 0.25 m = 0.5 tile. 1 tile per 50 tiles = 1:50.** |
| CN-17 | "falls are a few mm per metre" | **1:100 = 10 mm/m; 1:40 (typical small-bore) = 25 mm/m — "a few mm/m" understates by 3–10×** |
| CN-07 | turning circle 1500 mm = 3 tiles, rule says 6×6 tiles | **WRONG (2× linear / 4× area)** |
| CN-22 | 40×30-tile plate: perimeter 140, area 1200, 0.117 tiles⁻¹ | **correct** |
| CN-26 | "a 1.0 m party eats ~4 tiles per 2 m of wall from both demises" | **AMBIGUOUS/likely 2× low: 2 m × 1.0 m = 2 m² = 8 tiles (4 per demise)** |
| CN-01 | axes {6,8,10,12,14,16,18} tiles labelled "3.0–9.0 m" | **correct** |
| Cross-file | GT-14 "shafts at 1×2 tiles" vs CN-12 "min 3×3 tiles, a 1-tile shaft cannot be built" | **CONTRADICTION** |
| Cross-file | GT-08 partitions "~0.075–0.20 m" vs CN-25 "~0.10–0.20 m" / bearing "0.15–0.35" vs CN-25 evidence "0.15–0.25" | **minor drift, same topic, two files** |
| Cross-file | CN-25 "the tile plan's 78 % net-to-gross" vs GT-23 worked 273/371 = 73.6 % | **inconsistent headline efficiency figure across the two files** |

---

# E. VERDICTS (post-verification — this section supersedes every `pending` field above)

Evidence actually opened this pass: ISO 2848 record (title/year/basic module/preferred series) · ISO 1006:1983 catalogue hit (`iso.org/standard/5470.html`) · DIN 4150 search set · IPC 2021 Ch.7 via up.codes (NH adoption) · IBC Ch.10 search set · in-repo `walkable.ts`, `rooms.ts`, `pathfinding.ts`. Not reached: Concrete Centre/CLT/TMS/SCI tables, BS 5606, govinfo PDF, Ching editions, ICC direct pages (403 persists).

## E1. grid-translation.md — per-claim

| Ref | Verdict | Basis / Problem | Action |
| --- | --- | --- | --- |
| AG-1 GT-01 quotation | **CONTRADICTED as a quotation** | The fetched ISO 2848 record gives title, year, 100 mm basic module, preferred series "3, 6, 12, 15, 30 and 60 basic modules". The quoted sentence ("…fit together without cutting on site") appears in none of it, and the file's own Sources note admits no clause text was read. Substance survives, quotation marks do not. | REMOVE quote marks; state as paraphrase; close = read ISO 2848 clause 2 wording |
| AG-2 ISO 2848:1984 identity | **SUPPORTED** | Title "Building construction — Modular coordination — Principles and rules", 1984, basic module 100 mm confirmed on the record opened. Residual gap: current-vs-**withdrawn** status not established → T1 "live standard" claim unproven. | KEEP + add "status (withdrawn?) unverified" |
| AG-3 ISO 1006:1983 = the basic-module standard | **SUPPORTED** | Catalogue result verbatim: "ISO 1006:1983 — Modular coordination — Basic module" at the cited URL. | KEEP; promote to primary cite for the 100 mm claim (GT-03/GT-10/table 1M row) |
| AG-4 500 mm off-series; LCM 1500 mm = 3 tiles | **SUPPORTED** | Arithmetic self-evident, and 1500 mm = 15 basic modules is *in* ISO 2848's preferred series, so "smallest dimension exact in both systems" holds as stated. | KEEP (delete the Medium-confidence hedge) |
| AG-5 series "60/120/300/600/1200/2400/3000" | **CONTRADICTED** | Verified preferred series = 300/600/1200/**1500**/3000/6000 mm. 60 and 120 are not members of any 3M-derived preferred set (not multiples of 300); 2400/3600 are legal 3M multiples but not *preferred*. The file's own Weak bullet gives a third, also wrong, list. | REPLACE the enumeration (GT-03 and Weak-or-contested) with 3/6/12/15/30/60 M |
| AG-6 DIN 4150-1 "Modulraster" | **CONTRADICTED — withdrawal decision correct, residual reliance real** | Every DIN 4150 hit is the vibration series (DIN 4150-1…-3, e.g. -3:2016); no modular-coordination part exists under that number. But GT-03/GT-07/GT-15/GT-18/GT-21 Source lines still print `S2 … — T1`, and GT-07/GT-18/GT-21 still carry Class `STANDARD`. | REMOVE S2 everywhere; downgrade those classes to ENGINEERING/DESIGN |
| AG-7 BS 5606 | **UNVERIFIED** | Not reached this pass; the file's own "identifier NOT verified" stands. GT-07 still Class STANDARD on it. | QUALIFY (Class → DESIGN PRINCIPLE); close = BSI record |
| AG-8 govinfo GOVPUB PDF | **UNVERIFIED (correctly self-demoted)** | PDF not opened this pass; file already states "Confidence: None". Yet S3 still appears as partial support in GT-12/GT-21. | KEEP as pointer-only; strip from rule-level Source lines |
| AG-9 Ching editions (S5/S7) | **UNVERIFIED + cross-file drift** | No edition page reached. GT-08 uses BCI **5th ed.**; construction.md uses **6th ed. (2023)** for the same content. Build-up figures (75–200 / 250–450 / 25–75 mm) are plausible practice, *uncited* — not "citation says otherwise". | QUALIFY: relabel figures "uncited plausible practice"; reconcile editions across the two files |
| AG-10 S4/S8/S10/S12 tiers | **PARTIALLY SUPPORTED** | Schema facts solid (AG-11); A156/lift door figures used numerically off unread sources carrying a T1 label. | REPLACE door figures' authority pointer with `building-codes.md`; relabel S8/S10 T3-unread |
| AG-11 host-code FACTs | **SUPPORTED** | `walkable.ts:4` is literally `export type TileState = 'walkable' \| 'blocked' \| 'door'`. `rooms.ts` (45 lines) lines 1-2 "Door cells are boundaries: they belong to no room", 15 and 33 skip `doorCells` in the BFS — the `:2,15,33` pointer is exact. `pathfinding.ts` (236 lines): `SQRT2` (4), `octileDistance` (162/202/227), diagonal branch `currentG + SQRT2` (206-227), `DIAGONAL_DX/DY` (235-236) — the "190-228" range lands on the right code. Not line-verified: the "both orthogonal neighbours open **and unoccupied**" guard. | KEEP; re-check that guard before GT-13/CN-15's "up to 1.41×" claim is quoted |

## E2. construction.md — per-claim

| Ref | Verdict | Basis / Problem | Action |
| --- | --- | --- | --- |
| AC-1 RC flat slab 6–9 m (12–18 tiles) | **UNVERIFIED** | The cited Concrete Centre lecture is admitted by the row itself to give span/depth limits, not an economical band; no source in this pass states 6–9 m. CN-05's "commonly quoted in the 6–9 m band" is a source claim with no source. Number is plausible practice. | QUALIFY wording ("plan-review band, uncited"); close = a published economical-span table |
| AC-2 masonry 3–6 m | **UNVERIFIED + internally inconsistent** | TMS 402 is a code-requirements document; its span/depth provisions unread. Table says 3–6, CN-05 text says "roughly up to 4.5–6". | REPLACE with one harmonised range labelled heuristic |
| AC-3 CLT 2–5 m / ribbed 5–8 m | **UNVERIFIED** | Three correct authorities located, zero tables read (file says so). But CN-04 *uses* "6 tiles = 3 m (masonry/CLT one-way ceiling)" as a hard reject threshold — rule text outruns the table's own disclaimer. | QUALIFY CN-04's example; close = AWC/Swedish Wood floor span table row |
| AC-4 PT 8–12 m "best-evidenced row" | **UNVERIFIED** | IJAME/ICCAUA papers located, not read; "best-evidenced" is a tier claim off a title. Deck 2.5–4 / beams 6–9 and composite 9–15 rows cite SCI by organisation only (no document) — weakest citation form in the file. | QUALIFY the "best-evidenced" label; close = read the IJAME span comparison |
| AC-5 CN-01 "modular coordination recommends **3 m** minimum" | **CONTRADICTED** | Verified ISO 2848 series begins at 3 basic modules = **300 mm**; nothing retrieved supports a 3 m minimum rational dimension. 3 m = 30M, so the sentence reads as a 3M→3 m unit slip. Load-bearing: CN-01's `{6,8,…,18}`-tile (3.0–9.0 m) axis floor and Weak item 12 inherit it. | REPLACE: drop the standards appeal, or restate as "3.0 m is this project's chosen floor; no standard mandates it" |
| AC-6 IPC §704 slope / §707 cleanouts | **PARTIALLY SUPPORTED; §707 CONTRADICTED** | Opened (IPC 2021 adoption): slope at **§704.1** — ¼ in/ft for ≤2½", ⅛ in/ft for 3–6", 1/16 in/ft for ≥8" ⇒ the file's directional claim ("smaller diameters need a steeper fall") is **correct** and the "no numeric value quoted here" gap can now be closed. Cleanouts are **§708**, not §707, at 100 ft (≈30.5 m) max spacing ⇒ the §707 address is wrong and, because CN-17 designates clause numbers as "the address to verify against", the error is load-bearing. The 20/40-tile placeholders sit inside code limits. | REPLACE §707→§708 (edition-checked); CITE §704.1 values with the adoption caveat |
| AC-7 IBC shaft enclosure "E1018" | **UNSUPPORTED as addressed** (requirement real) | IBC shaft-enclosure material sits in Chapter 10 Means of Egress; `E101.x` numbering is accessibility-guideline territory, not shafts. Chapter 7 fire-resistance ✓ correct. CN-13 is Class `CODE REQUIREMENT`/T1 on a bad pointer. | REPLACE address (IBC 2018/2021 §1022 to confirm); KEEP the requirement |
| AC-8 shaft minimums 4×4 / 3×3 tiles | **INFERRED (honestly self-labelled invention)** | Cross-file **CONTRADICTION**: GT-14 sizes "2 shafts at 1×2 tiles" and GT-20/GT-21 use 1-tile band tiles, which CN-12 declares unbuildable ("a 1-tile shaft… cannot be built"). Real small risers fit well under 1.5 m. | HARMONISE the two files; keep CN-12's invented label |
| AC-9 CN-07 proxies | **CONTRADICTED (arithmetic)** | ADA/ANSI figures unverified this pass, but the conversion is wrong regardless: a 1500 mm turning circle = **3×3 tiles**; CN-07 writes "6×6-tile open square" = 3.0 × 3.0 m (2× linear, 4× area). GT-05 states 3 tiles correctly → the files contradict each other and CN-07 rejects legal column positions. | REPLACE with 3×3 tiles |
| AC-10 rated separation / party walls as geometry | **INFERRED, class-inflated** | The requirement (rated shaft enclosure, party-wall performance) is real; the *proxies* (2-tile party, `rated` tag, "no shared valve tile", "no back-to-back sockets on a party") are project convention — Weak item 10 concedes this while Class says `CODE REQUIREMENT`. AD E / ISO 717-1 / UL unread. | QUALIFY Class to project convention + code dependency; close = read AD E targets |
| AC-11 removal path / diagonal-as-swing analogy | **INFERRED** | The host rule tested is NPC occupancy of orthogonal neighbours; that is not a rigid-body swept-path/turning-envelope check. Calling it "a usable proxy" for swinging a 1.5 m object is the clearest inference-dressed-as-engineering in the file. ≥4-tile widths are uncited choices. | QUALIFY to "heuristic plan proxy — not a swept-path check" |
| AC-12 load-path / repetition / A-V economics | **INFERRED (direction sound, thresholds chosen)** | Qualitative claims are standard teaching but cited to unread Ching/DfMA/CTBUH material. The numeric gates (`≤3 bay widths`, `distinctPartCount ≤6`, `constancy ≥0.6`, `aspect ≤1.5`, `20 tiles`, `6 tiles = 3.0 m`) live inside rules classed STANDARD/CODE REQUIREMENT. | QUALIFY: split rule-level class from threshold-level heuristic label |

## E3. Totals

- **grid-translation.md** (11 standards/FACT claims): SUPPORTED **4** (AG-2, AG-3, AG-4, AG-11) · PARTIALLY SUPPORTED **1** (AG-10) · INFERRED **0** · UNVERIFIED **2** (AG-7, AG-8) · CONTRADICTED **3** (AG-1, AG-5, AG-6) · UNSUPPORTED **0**. Arithmetic units: 4 hard errors + 1 understatement (D-items 1-4, 8).
- **construction.md** (12 claims): SUPPORTED **0** · PARTIALLY SUPPORTED **1** (AC-6) · INFERRED **4** (AC-8, AC-10, AC-11, AC-12) · UNVERIFIED **4** (AC-1…AC-4) · CONTRADICTED **2** (AC-5, AC-9) · UNSUPPORTED **1** (AC-7). Arithmetic units: CN-17 slope, CN-07 turning circle, CN-26 party-wall ambiguity.
- Span→tile conversions in the reference table: **all 12 rows correct** (`m × 2`), independently re-derived. CN-12's self-declared UNCITED ledger is accurate except for the §704/§707 items and CN-01's 3 m claim.

## E4. Five most dangerous claims
1. **CN-01 "3 m minimum rational dimension"** — a 3M→3 m unit slip presented as a standards recommendation, feeding a hard 6-tile validation floor (AC-5).
2. **CN-17's §707 "Cleanouts" address** — wrong section (it is §708), and the file designates clause numbers as the verification address, so the error propagates to every future check (AC-6).
3. **GT-17's worked area-error rows** ("10×8 = 90 tiles = 22.5 m²", "15×8 = 60 tiles = 15.0") — inside a table the file sells as "arithmetic, not opinion"; contaminates net-to-gross/efficiency roll-ups (D-items 1-2).
4. **CN-07's "6×6-tile" wheelchair turning circle** — 2× linear error that rejects compliant column positions and contradicts GT-05 (AC-9).
5. **GT-07/GT-15/GT-18/GT-21 Class `STANDARD` still citing S2 (DIN 4150-1) / S6 (BS 5606)** — identifiers the file itself withdrew; a reader of the rule bodies, not the Sources note, will re-inflate the tier (AG-6, AG-7).
Honourable mention: CN-05's word "**published** band" for four rows whose sources were never read.

## E5. Safe as an implementation foundation?
- **grid-translation.md — YES for the tile/host layer, NO for the standards layer as written.** The arithmetic engine (1 tile = 500 mm, ceil/nearest, wall tax, drift, area-error method) and the code pointers verify clean; adopt them. Fix first: the 60/120/2400/3600 enumeration → 3/6/12/15/30/60 M; delete the GT-01 quotation; strip S2/S6 and their STANDARD classes; repair GT-11, GT-17 (×2), GT-14; confirm ISO 2848's withdrawal status before quoting it as live.
- **construction.md — NOT as a numerical foundation; usable as a plan-review trigger set.** Zero claims reached SUPPORTED, every span band is UNVERIFIED or heuristic, the one standards-derived claim is contradicted, two code addresses are wrong. Its honesty (the UNCITED ledger) keeps it from being a lie, so it survives as validation-shape documentation provided AC-5/AC-6/AC-7/AC-9 fixes land, CN-04/CN-05 stop saying "published", and CN-12 is harmonised with GT-14/GT-21.

## E6. Gaps (what would close the audit)
ISO 2848 status page + clause text (AG-1/AG-2) · the correct German modular-coordination standard number in place of DIN 4150 (AG-6) · BSI catalogue for BS 5606 (AG-7) · govinfo PDF body (AG-8) · Concrete Centre / AWC CLT / TMS 402 / SCI table rows (AC-1…AC-4) · the IBC edition in force for the shaft-enclosure section (AC-7) · ADA 2010 §304.2/§404 for CN-07's clear widths and turning space (AC-9) · `pathfinding.ts` orthogonal-neighbour guard, line-by-line (AG-11).
