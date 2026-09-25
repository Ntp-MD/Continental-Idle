# Research file — Domain AD: Preliminary structural sizing and load take-down

Scope: the **arithmetic layer** under the qualitative structural logic already in this skill.
`construction.md` (CN-01…CN-28) decides where structure may sit and whether a load path exists;
`multi-scale.md` MS-07 decides whether a bay grid may change; `grid-translation.md` GT-15 decides
whether a span is expressible in whole tiles. None of them supplies the numbers that let an agent say
"a 9.0 m hotel bay on a flat slab is plausible at 16 storeys and not at 21", or "this column needs
900 mm at the base". This file supplies the take-down: dead-load buildup by floor type, imposed loads by
occupancy, tributary areas, accumulated axial load, preliminary member proportions with their validity
range, lateral system by height, foundation pressure at plan level. Host grid: 1 tile = 500 mm, no
heights, no sections, no structural objects — so every number here is reachable from a plan, a storey
count and a use label. **Preliminary sizing is not structural design**; the output class is
`plausible / implausible / needs-engineering`, never `compliant`. That is a reporting rule, not a
licence for vagueness: every rule below carries its formula, substitution and result, and every value
that was not read from a named table in a named edition carries `NEEDS VERIFICATION:` plus the document
to obtain. Tiers: T1 standard/official, T2 peer-reviewed, T3 established publication, HEURISTIC = rule
of thumb with its origin named.

## Rules

### ST-01 Run the arithmetic before the aesthetic verdict and publish four numbers
- Rule: no structural comment without (1) floor load kN/m², (2) tributary area m², (3) accumulated axial load at the critical column base kN, (4) the member size that load implies (mm + tiles).
- Evidence: the four numbers come out of documents read this pass, not out of judgement: imposed loads and densities from BS EN 1991-1-1:2002 §6.3 and Annex A, the ULS combination from BS EN 1990:2002+A1:2005 Eq. (6.10), member depth from BS EN 1992-1-1:2004 §7.4.2 + Table 7.4N, and the beamless-slab ceiling from that document's §6.4.4 punching expression. Each rule below prints its own clause, the substitution and the result, so the take-down is arithmetic on read values; the only quantities invented in this file are the concrete capacity index and its steel counterpart (ST-10, ST-11), both flagged in place.
- Source: method (this file) — FACT; BS EN 1991-1-1:2002 §6.3/Annex A — T1 (read); BS EN 1990:2002+A1:2005 Eq. (6.10) — T1 (read); BS EN 1992-1-1:2004 §7.4.2 + Table 7.4N and §6.4.4 — T1 (read). Clause-by-clause detail in `## Sources`.
- Class: DESIGN PRINCIPLE (procedural discipline — the arithmetic precedes the verdict; the four inputs are values read from the standards named in Source)
- Scope: every multi-storey plan
- Confidence: High — FACT
- Grid translation: emit `take_down = {use_mix, G_k, Q_k, N_per_storey, storeys, N_base, A_req, size_mm, tiles, governing_check}` per critical column; no verdict without the block. Every key is reachable from the plan: `use_mix` from room labels, `storeys` from the stack role, `size_mm → tiles` at 2 tiles = 1.0 m.
- Exceptions / failure mode: cannot see continuity, torsion, creep, fire or dynamic response; it bounds a plan. Four numbers cost a minute and kill the "any span on any system" failure. Preliminary sizing is not structural design — the output class is `plausible / implausible / needs-engineering`, never `compliant`, and any size that reaches a drawing needs an engineer's check.

### ST-02 Build dead load layer by layer from read densities, not from a blended allowance
- Rule: `g_slab = t × ρ`. EN 1991-1-1 Annex A Table A.1: normal-weight concrete 24.0 kN/m³ with note (1) "increase by 1 kN/m³ for normal percentage of reinforcing and pre-stressing steel" → 25 kN/m³ used for RC; cement mortar 19.0–23.0 → 21 kN/m³ for screed; structural steel 77.0–78.5 kN/m³.
- Evidence: the density rows in this rule's Rule line are quoted verbatim from the read table, and the multiplication is arithmetic. Floor buildup before partitions at the slab depths this project uses (each column is `t × ρ`, layer on layer):

  | Slab | g = t×25 | +50 mm screed (1.05) | +ceiling/services (0.4, HEUR) | floor G_k before partitions |
  |---|---|---|---|---|
  | 160 | 4.00 | 5.05 | 5.45 | 5.45 |
  | 200 | 5.00 | 6.05 | 6.45 | 6.45 |
  | 250 | 6.25 | 7.30 | 7.70 | 7.70 |
  | 300 | 7.50 | 8.55 | 8.95 | 8.95 |
  | 350 | 8.75 | 9.80 | 10.20 | 10.20 |
  | 400 | 10.00 | 11.05 | 11.45 | 11.45 |
  | 600 | 15.00 | 16.05 | 16.45 | 16.45 |

  The table is the argument: the slab term is the only one that moves by hundreds of millimetres, so it is the layer that grows the column.
- Source: BS EN 1991-1-1:2002 Annex A, Table A.1 (rows quoted above read verbatim) — T1; the multiplication = FACT. Tier: T1 for the densities, HEURISTIC for the services row.
- Class: STANDARD (the densities, read from BS EN 1991-1-1:2002 Annex A Table A.1, edition named) / FACT (the `t × ρ` arithmetic) / HEURISTIC (the ceiling-services allowance)
- Scope: all systems (substitute ρ)
- Confidence: High on the quoted rows, Low on anything the retrieval lost — FACT (densities), HEURISTIC (the 0.4 services row). `NEEDS VERIFICATION:` EN 1991-1-1 Annex A Table A.2 (masonry) or EN 1996-1-1 §3.1.3 Table 3.1 before quoting a masonry or block density.
- Grid translation: never accept a stated dead load; recompute `Σ t_i·ρ_i` per layer and list them. The plan supplies the use label and the storey, so the host figure is the per-m² value above scaled by the tile area; the slab-depth rows are the only layer a plan can be said to control.
- Exceptions / failure mode: the retrieved copy's lightweight-aggregate (LC) rows and the masonry Table A.2 did not extract legibly, so only the rows above are used. A single "8 kN/m² all-in" hides that slab depth, not partitions, is what grows the column. Failure symptom: a base column sized off a blended allowance that turns out to sit under a transfer slab.

### ST-03 Classify the room by use before choosing an imposed load, and name the jurisdiction
- Rule: imposed load follows the occupancy label. EN 1991-1-1 mapping (Table 6.1 read verbatim): guest/residential/hospital bedrooms and hostel rooms = **Category A**; office = B; restaurant, banquet, dining, reception = C1; **hotel corridors and access areas in public/administration buildings, hotels, hospitals = C3**; fixed-seat assembly = C2; museum/exhibition = C3; dance/sport/stage = C4; large-crowd assembly = C5; general retail = D1; department store = D2; storage including "storage of books and other documents" = E1 (Table 6.3); car park = F (≤30 kN gross vehicle weight) / G (30–160 kN) (Table 6.8); roof not accessible except maintenance = H (Table 6.9).
- Evidence: the mapping is the read category text itself — the sleeping-access and hospitality rows of Table 6.1, the storage row of Table 6.3 including its literal "storage of books and other documents", the two car-park categories of Table 6.8 split by gross vehicle weight, and the inaccessible-roof row of Table 6.9. The US side is a different taxonomy: the adopted IBC chapter groups by occupancy, not by category, so the same room can carry two labels.
- Source: BS EN 1991-1-1:2002 §6.3.1.1 Table 6.1, §6.3.2.1 Table 6.3, §6.3.3.1 Table 6.8, §6.3.4.1 Table 6.9 — T1 (read); US mapping from *International Building Code* 2024 as adopted by the DoD Building Code 2024 Ch. 16 — T1.
- Class: STANDARD (BS EN 1991-1-1:2002 §6.3 tables, edition and clause named in Source; the mapping is code text, not judgement)
- Scope: all occupied buildings
- Confidence: High — FACT
- Grid translation: write `qk_source = "<code> <edition> Table <n> cat <X>"` next to every imposed load; an absent label takes the type default and is tagged `ASSUMED`. The lookup key is the room label the plan already carries, so this is a per-tile join, not a section question.
- Exceptions / failure mode: the category list is a European taxonomy; the IBC rows are occupancy-grouped, so a mixed floor needs both, and the reductions in ST-09 are not interchangeable between systems. Trade-off: calling a hotel corridor Cat A (≈2.5) instead of C3 (3.0–7.5) understates that beam by 1/3 to 3×. Failure symptom: a service corridor loaded as a bedroom and used as a queue.

### ST-04 Take the load value from a table row, with the range and its legibility made visible
- Rule: use `## Imposed load table`. Where the code prints a range, show the range and say which end is used for which check (higher for member strength, lower for overturning/uplift).
- Evidence: the values reproduced in that table come from the read rows: Table 6.2 prints ranges rather than single values; Table 6.4 gives E1 qk = 7.5 kN/m² with Qk = 7.0 kN (fully read); Table 6.8 gives Cat F qk 1.5–2.5 kN/m² with Qk 10–20 kN (fully read in Note 1) and Cat G qk 5.0 read; Table 6.10 with §6.3.4.2(1) Note gives Cat H qk = 0.4 kN/m² with Qk = 1.0 kN recommended, acting on 10 m² (fully read). DoD/IBC 2024 Table E-1 prints its own conversion "1 pound per square foot = 0.0479 kN/m²", so the US rows need no hand conversion.
- Source: BS EN 1991-1-1:2002 Table 6.2, Table 6.4, Table 6.8 + Note 1, Table 6.10 + §6.3.4.2(1) Note — T1 (read; clause list in `## Sources`); DoD Building Code 2024 Ch. 16 Table E-1 (*IBC* 2024 as adopted) — T1 (read).
- Class: STANDARD (values taken off the named tables of BS EN 1991-1-1:2002 and of the adopted *IBC* 2024 chapter, editions named in Source)
- Scope: EN and US jurisdictions
- Confidence: Medium overall — FACT where legible, NEEDS VERIFICATION where flagged.
- Grid translation: copy the row's `Legibility` status into the report; never convert `partial` into a fact. Where the row prints a range, the report carries both ends and states which check each end serves.
- Exceptions / failure mode: Table 6.2's underlined NA-selected values did not survive text extraction (Weak 1); Qk is a local check over a 50 mm square (Cat A–D NOTE, read) and never the take-down load. Characteristic values everywhere inflate foundations; reduced values everywhere starve a single-storey beam. Failure symptom: a foundation designed on unreduced characteristic loads for a storage floor that will never be full.

### ST-05 Count partitions once — as a line load on a bearing line or as an area allowance
- Rule: fixed partitions are wall self-weight `w_line = t × h × ρ` (hotel wet-cell wall 0.15 × 2.7 m ≈ 6.5 kN/m of wall, density flagged — see Confidence and ST-02). Spread: with ~0.25 m of wall line per m² of gross floor (dense cell plan, HEURISTIC) → `g_part ≈ 1.6 kN/m²`. Movable partitions are added to the **imposed** load, not the dead load, per EN 1991-1-1 §6.3.1.2(8): qk = 0.5 kN/m² for partitions ≤1.0 kN/m; 0.8 for 1.0–2.0 kN/m; 1.0 for 2.0–3.0 kN/m; heavier than that is designed from location and direction per §6.3.1.2(9).
- Evidence: §6.3.1.2(8) and (9) were read verbatim and print the three movable-partition values quoted above, with the heavier-than-3.0 kN/m case explicitly moved to a designed, located load. The fixed-partition route is arithmetic on ST-02's densities and is the weaker half of this rule: the wall density behind the line load has no read table yet, and the wall-length-per-m² spread is a dense-cell plan observation, not a code row.
- Source: BS EN 1991-1-1:2002 §6.3.1.2(8) and (9) (read verbatim) + arithmetic — T1; fixed-partition wall density — no read table (EN 1991-1-1 Annex A Table A.2 / EN 1996-1-1 §3.1.3 outstanding via ST-02).
- Class: STANDARD (the movable-partition qk values, BS EN 1991-1-1:2002 §6.3.1.2(8), edition named) / HEURISTIC (fixed-partition line weight and the wall-length spread)
- Scope: all floors; the 0.25 m/m² figure is the hotel/residential case
- Confidence: High on the code values, Low on the spread rate — FACT (0.5/0.8/1.0), HEURISTIC (wall density per m²). `NEEDS VERIFICATION:` the wall density behind the line load above — see ST-02's Table A.2 flag.
- Grid translation: declare `partitions_mode = line | area` per floor in the take-down block. On the plan a partition is one blocked tile row, so derive `w_line` from the stated assembly and never from tile counts.
- Exceptions / failure mode: the tile grid shows a wall as 0.5 m; CN-25 already warns that overstates a real 0.15 m assembly. Counting partitions twice (tile wall + area load) inflates the base column ~10% per 20 storeys. Failure symptom: a dense hotel cell plan whose load was booked as both geometry and allowance.

### ST-06 Factor for strength, de-factor for deflection, and print which one produced the number
- Rule: ULS `Ed = 1.35·Gk + 1.50·Qk1 + Σ1.50·ψ0,i·Qk,i` (EN 1990 Eq. 6.10, recommended γG,sup = 1.35, γQ = 1.50; Set B γG,sup = 1.15). SLS uses `Gk + Qk1` (characteristic) or `Gk + ψ1·Qk1 + ψ2·ΣQk,i` (quasi-permanent). Table A1.1 ψ (read): Cat A 0.7/0.5/0.3 · B 0.7/0.5/0.3 · C 0.7/0.7/0.6 · D 0.7/0.7/0.6 · E 1.0/0.9/0.8 · F 0.7/0.7/0.6 · G 0.7/0.5/0.3.
- Evidence: the combination, the recommended partial factors and the ψ triplets above are printed in the read EN 1990 text — Eq. (6.10) with the γG/γQ values of Tables A1.2(A)/(B) (the Set A / Set B pair) and the ψ0/ψ1/ψ2 columns of Table A1.1, quoted verbatim in this rule's Rule line. The SLS expressions are different objects, not softer versions of the ULS one: the quasi-permanent set reads the ψ1/ψ2 columns, the ψ0 column belongs to the ULS combination.
- Source: BS EN 1990:2002+A1:2005, Eq. (6.10), Tables A1.2(A)/(B) recommended values, Table A1.1 — T1 (read). US jurisdictions would use ASCE 7 combinations, which were not read (Scope).
- Class: STANDARD (BS EN 1990:2002+A1:2005 Eq. (6.10) with the recommended γ and ψ values, edition named; which set applies is a National Annex choice)
- Scope: EN jurisdictions (US = ASCE 7 combos, not read)
- Confidence: High — FACT. The outstanding item is not the values but the National Annex selection of γ set and ψ (Weak 3, `## Sources`), which is declared rather than averaged here.
- Grid translation: report `combo = "6.10 (γG 1.35 / γQ 1.50)"` plus `psi_used`; label every SLS figure as SLS. The choice is one declaration per project, not a per-room decision, so it belongs in the deliverable header rather than in the take-down rows.
- Exceptions / failure mode: which expression and which γ set is a National Annex choice; 1.15 instead of 1.35 makes the tower column ~13% lighter, so the choice is declared, not averaged. Sizing on characteristic loads saves concrete and buys a non-compliant frame. Printing a number without its combination is the failure this rule exists to prevent.

### ST-07 Compute the tributary area geometrically and pick the spanning direction by aspect
- Rule: an interior column collects the half-bays around it (45° bisector polygon): 4.5 × 9.0 m grid → `A_tr = 40.5 m²` (edge 20.25, corner 10.1); on the tile grid 1 tile = 0.25 m² so `A_tr = 162 tiles`. Spanning mode: `aspect = L_long/L_short`; `aspect ≥ 2` → one-way (load to the short-direction beams, trapezoidal, equivalent uniform `w = q·L_s·(3 − L_s²/L_l²)/6`); `aspect ≤ 1.5` → two-way; between the two, size for two-way and check the one-way value. Worked for the guest panel 4.5 × 9.0 (aspect 2.0): one-way, so the 4.5 m slab strip delivers `w = 14.62 × 4.5 × (3−0.25)/6 = 30.2 kN/m` onto the 9.0 m beam (≈272 kN on the beam against the 592 kN panel ÷ 2 = 296 kN — the difference is the corner zones).
- Evidence: the polygon, the trapezoidal equivalence and the tile-area conversion are statics and geometry — verifiable without a source, and computable from the plan alone. The two aspect boundaries are teaching: they order the check, they are not clauses read this pass, which is why the 1.5–2.0 band takes the conservative value rather than the cleverer one.
- Source: statics/geometry — FACT (method); the 1.5 and 2.0 boundaries — HEURISTIC (teaching); ACI 318-19 §8.10.1 two-way definition and EN 1992-1-1 §9.3.3 — named, not read this pass (see Confidence).
- Class: FACT (the tributary geometry and the one-way/two-way mechanism) / HEURISTIC (the 1.5 and 2.0 aspect boundaries)
- Scope: all floor systems
- Confidence: MIXED. `NEEDS VERIFICATION:` ACI 318-19 §8.10.1 two-way definition or EN 1992-1-1 §9.3.3 (neither read this pass).
- Grid translation: print `aspect`, `spanning_mode`, and note that CN-06's `aspect ≤ 1.5` is a *claim* limit for two-way design while 2.0 here is the load-sharing limit (both stand; 1.5–2.0 takes the conservative check). `A_tr` is counted in tiles at 0.25 m² each, so a bay whose tile product is fractional was never a real bay on this host (ST-16).
- Exceptions / failure mode: continuity and torsional release shift ±20% of the simple polygon — inside this grid's error. Assuming two-way where the plan is one-way understates the beam up to 2×. Failure symptom: a 9.0 m corridor strip called two-way with bearing lines in one direction only.

### ST-08 Accumulate axial load storey by storey and publish the growth table
- Rule: `N_base = Σ_n Ed_i·A_tr,i + wall/core self-weight`; for a repeated floor `N(n) = n·N_floor`. Worked guest storey (200 mm slab, G_k = 5.00+1.05+0.40+1.60 = **8.05 kN/m²**, Q_k = 2.5): `Ed = 1.35×8.05 + 1.5×2.5 = 14.62 kN/m²` → `N_floor = 14.62 × 40.5 = 592 kN` → 16 guest storeys = **9.47 MN** + roof 369 kN = **9.87 MN** at the tower column base before podium or wall weight (see the worked example for the full stack and ST-09 for the reduction).
- Evidence: every input to the chain above is read — the layers from ST-02/ST-05, the category value from ST-03/ST-04, the combination from ST-06 — so the only thing this rule adds is the sum over storeys, which is arithmetic on the repeated-floor identity. The take-down chain is the file's spine: panel load to per-storey force to accumulated force to required area to member size, and it ends in the 900 mm base column of `## Worked example: 21-floor hotel`.
- Source: arithmetic on BS EN 1991-1-1:2002 / BS EN 1990:2002+A1:2005 values read above — T1 (read; see ST-02…ST-06 and `## Sources`).
- Class: FACT (the accumulation arithmetic) / STANDARD (the load and factor inputs, editions named in Source)
- Scope: every tower
- Confidence: High — FACT (method)
- Grid translation: give the critical column plus two neighbours; report `size_growth = A_base/A_typical`. On the plan the growth is visible as column tiles per level — the worked stack runs from a roof beam to a two-tile base column, so a plan that keeps one column size from top to bottom is the flag this rule reads.
- Exceptions / failure mode: assumes aligned columns; a grid change re-computes at the transfer level (CN-10, MS-07), and accumulated load travels **in the column** — it does not punch the slab (ST-10). Skipping the growth table is how a 600 mm column gets proposed at level 1 and level 20. The forces are preliminary combinations, not a design: an engineer's check precedes any section.

### ST-09 Reduce imposed load for multi-storey columns only where the code says so
- Rule: EN 1991-1-1 gives loaded-area reduction `αA = 5ψ0/A0 + ψ0/A ≤ 1.0` (restriction 0.6 for Categories C and D) and, for columns and walls loaded by several storeys, `αn = (2 + (n−2)·ψ0)/n`. Worked Cat A ψ0 = 0.7: n = 4 → 0.85; n = 10 → 0.76; n = 13 → 0.746; n = 16 → 0.7375. Applying it to ST-08's guest stack (roof kept unreduced, different category): `0.7375×9 472 + 369 = 7.36 MN` (−25%).
- Evidence: both expressions are printed in the read subclauses — the loaded-area reduction with its stated floor on Categories C and D, and the storey-count reduction for columns and walls, with the cross-reference that routes multi-storey vertical elements to the second expression. The ψ0 used in the worked row is the Cat A value read in ST-06, and the roof is deliberately left alone because it belongs to another category, not because it was forgotten.
- Source: BS EN 1991-1-1:2002 §6.3.1.2(10) + Expr. (6.1), §6.3.1.2(11) + Expr. (6.2), §6.3.3(2) cross-ref — T1 (read).
- Class: STANDARD (BS EN 1991-1-1:2002 §6.3.1.2(10)–(11), Expr. (6.1)/(6.2), edition named; the NA may replace the method)
- Scope: EN jurisdictions
- Confidence: High — FACT
- Grid translation: reduce only in the column/wall/foundation row and print both `N_raw` and `N_reduced`. The storey count `n` is the stack role the plan already carries (MS-01/MS-07), so the reduction is computable per level without a section.
- Exceptions / failure mode: not for a single storey, not for deflection, not for the worst-case foundation pattern, and the NA may replace the method; Cat E with ψ0 = 1.0 reduces almost nothing (αn → 1 at large n). Applying αn to the slab, the column and the foundation simultaneously counts the same mercy twice. Failure symptom: an archive floor reduced as if it were offices, because the reduction was read as a building-wide discount rather than a category-specific one.

### ST-10 Size the concrete column from f_cd, and check slab punching at the panel load
- Rule: `fcd = αcc·fck/γc` (αcc recommended 1.0, permitted 0.8–1.0), so C30/37 with γc = 1.5 → 20.0 MPa, C40/50 → 26.7 MPa. Preliminary area `A_req ≈ N_Ed/(0.75·fcd)` — the 0.75 index covers minimum eccentricity (`eo = h/30`, not less than 20 mm, text read in EN 1992-1-1 §6.1 region; clause label degraded) plus bending and slenderness; **HEURISTIC**, verification flag carried in Confidence. Worked: N = 13.3 MN, C40/50 → `A = 13.3e6/(0.75×26.7) = 664 000 mm²` → 815 mm square → **2 tiles = 1.0 m**. Punching (the beamless-floor ceiling) is checked at the **panel** load, not the accumulated load: `VRd,c = [CRd,c·k·(100ρl fck)^{1/3} + k1·σcp]·u1·d`, CRd,c = 0.18/γc = 0.12, k = 1+√(20/d[mm]) ≤ 2, k1 = 0.15, u1 at 2d from the column face. Worked podium panel 9.0 × 9.0 m at Ed = 21.44 kN/m² → VEd = 1 737 kN, 900 mm column: at h = 420 (d = 375): k = 1.231, u1 = 4(0.9+4·0.375) = 9.6 m, vRd,c = 0.12×1.231×(100×0.005×30)^{1/3} = 0.364 MPa → `VRd,c = 1 310 kN` → **fails, ratio 1.33**; at h = 600 (d = 545): k = 1.19, u1 = 12.32 m, vRd,c = 0.352 → `VRd,c = 2 364 kN` → passes (0.73). A guest panel (40.5 m², 592 kN) at h = 420 gives ratio 0.45 — punching is *not* the binding check there.
- Evidence: the read clause substance behind the two expressions in the Rule line: §3.1.6(1)P Eq. (3.15) with its αcc note (recommended 1.0, permitted 0.8–1.0) gives the design concrete strength; §6.4.4(1) Expr. (6.2.a) gives the punching resistance, and the read text prints the NA note "recommended value for CRd,c is 0,18/γc … k1 is 0,15"; §6.4.4(2) fixes the "control perimeters within 2d" geometry that puts u1 where the Rule line puts it; §6.4.5 (slabs with shear reinforcement) is listed in the code and is **not used** here. The two worked pairs are computed instances at the stated depth, perimeter and reinforcement ratio, not published capacities — the podium pair brackets the section decision (fail at the shallow slab, pass at the deep one) and the guest pair shows that a tower panel is nowhere near the punching limit, which is why ST-08's accumulated force and this rule's panel force must not be confused.
- Source: BS EN 1992-1-1:2004 §3.1.6(1)P Eq. (3.15) + αcc note; §6.4.4(1) Expr. (6.2.a) with the NA note quoted above and §6.4.4(2) "control perimeters within 2d"; §6.4.5 for slabs with shear reinforcement (clause listed, not used) — T1 (read). γc: the base-code Table 2.4N recommendation and the NA values were not legible — named, not read (see Confidence, `## Sources` and Weak 3). The 0.75 index: EN 1992-1-1 §5.8.7/§6.1 interaction or a published column chart — named, not read.
- Class: STANDARD (the fcd and VRd,c expressions, BS EN 1992-1-1:2004 edition named) / HEURISTIC (the 0.75 preliminary index) — the sizes that follow from them need an engineer's check
- Scope: RC and composite frames
- Confidence: FACT (formulas), HEURISTIC (0.75 index), NEEDS VERIFICATION (γc — 1.5 is the value UK practice adopts; the base-code Table 2.4N recommendation was not legible). `NEEDS VERIFICATION:` EN 1992-1-1 §5.8.7/§6.1 interaction or a published column chart for the 0.75 index.
- Grid translation: report `N_Ed/VRd,c` per slab-column connection and `A_req`; if `N_column > ~1 MN` under a beamless slab, demand beams, a drop/column head (invisible here → `needs-section-review`), or more depth. Column area converts to a plan footprint at 2 tiles = 1.0 m for the record; the control perimeter and the effective depth are section quantities the host cannot draw, which is why the ratio is the output and the section is not.
- Exceptions / failure mode: ignores buckling of slender legs, fire, creep, and the unbalanced-moment transfer at interior/edge columns (6.4.2/6.4.3, not applied here — hence treat the capacities above as upper bounds). 0.75 → 0.60 grows the base column 900 → 1000 mm (still 2 tiles) but costs corridor edge area. Preliminary sizing is not structural design: the punch/don't-punch call is an engineer's check, and a drop panel — the usual remedy — is invisible on this grid.

### ST-11 Run the same take-down through steel and check the base, not the beam
- Rule: `A_req ≈ N_Ed/(χ·fy/γM1)`; χ ≈ 0.75 (heavy braced UC at ~3.2 m storey height) to 0.55–0.65 (lighter) — **HEURISTIC**, verification flag carried in Confidence. Worked N = 13.3 MN, S355, γM1 = 1.0, χ = 0.70 → `A = 13.3e6/(0.7×355) = 53 500 mm²`, i.e. a very heavy or encased section: **steel wins the floor and loses the tower base unless the core takes gravity.** Deflection limits are NA-set: EN 1993-1-1 §7.2.1/§7.2.2 defer to EN 1990 Annex A1.4 Figs A1.1/A1.2.
- Evidence: what was read on the steel side is the deflection machinery only — §7.2.1 and §7.2.2, which hand the limits to EN 1990 Annex A1.4 and therefore to the NA — and the steel density in EN 1991-1-1 Annex A Table A.1 (ST-02). The buckling-reduction index χ is a working value for braced heavy sections at this project's storey height, chosen because no interaction table or section catalogue was opened; it is the reason the required area above should be read as an order of magnitude rather than a section.
- Source: BS EN 1993-1-1:2005 §7.2.1, §7.2.2 (read) — T1; steel density BS EN 1991-1-1:2002 Annex A Table A.1 (read) — T1; χ — HEURISTIC (practice value); EN 1993-1-1 §6.3.1–6.3.3 plus a section catalogue — named, not read (see Confidence). Tier: T1 (method) + HEURISTIC (χ).
- Class: STANDARD (the deflection-limit deferral in §7.2.1/§7.2.2, edition named) / HEURISTIC (the χ index) — the section itself is an engineer's check
- Scope: steel/composite frames, podium frames, transfer
- Confidence: MIXED. `NEEDS VERIFICATION:` EN 1993-1-1 §6.3.1–6.3.3 plus a section catalogue (none read).
- Grid translation: for a steel option publish base column force + required area next to the plan; the area converts to a column footprint exactly as in ST-10, and an encased or heavy section still occupies the same tiles, so the plan consequence of the steel choice is visible even though the section is not.
- Exceptions / failure mode: no section properties, lateral-torsional buckling, or fire-protection thickness — all off-grid. Steel cuts construction depth and speeds the repeat cycle (CN-23) but moves the gravity problem down and the fire problem sideways. Failure symptom: a shallow steel floor whose base forces are discovered only when the footprint is fixed.

### ST-12 Set slab depth from the code span/depth table, then add cover to get total depth
- Rule: Add 45–65 mm to d for total depth. Guest-floor work: a 200 mm slab (d ≈ 150) spanning 4.5 m continuously gives `l/d = 4500/150 = 30` — the interior-span value at ρ = 0.5%, so the slab depth is code-consistent, not optimistic. The 9.0 m interior beam needs d = 9000/30 = 300 (h = 360) at ρ = 0.5% or d = 9000/20 = 450 (h = 510) at ρ = 1.5% — hence the 450–600 mm beam band used in ST-13 and ST-17.
- Evidence: EN 1992-1-1 §7.4.2(2) Table 7.4N (K = system factor; C30/37, σs = 310 MPa), read in full:

  | System | K | l/d ρ=1.5% | l/d ρ=0.5% | d for l = 9.0 m (1.5% / 0.5%) |
  |---|---|---|---|---|
  | Simply supported beam; 1-/2-way simply supported slab | 1.0 | 14 | 20 | 643 / 450 mm |
  | End span, continuous over one long side | 1.3 | 18 | 26 | 500 / 346 mm |
  | Interior span of beam or slab | 1.5 | 20 | 30 | 450 / 300 mm |
  | Flat slab (no beams), on the **longer** span | 1.2 | 17 | 24 | 529 / 375 mm |
  | Cantilever (worked at 1.5 m) | 0.4 | 6 | 8 | 250 / 188 mm |

  Note 2 read: 2-way slabs checked on the **shorter** span, flat slabs on the **longer**. Multipliers read in the same clause: flanged sections with bf/bw > 3 → ×0.8; beams and slabs other than flat with span > 7 m carrying partitions liable to damage → ×7/l_eff; flat slabs with the greater span > 8.5 m → ×8.5/l_eff.
- Source: BS EN 1992-1-1:2004 §7.4.2(2), Expr. (7.16a/b), (7.17), Table 7.4N incl. Notes 1–3 (all read) — T1. US equivalent: ACI-318 minimum-thickness table — named, not read (Scope).
- Class: STANDARD (the span/depth limits and their multipliers, read from BS EN 1992-1-1:2004 Table 7.4N, edition named)
- Scope: RC slabs and beams (US ACI-318 minimum-thickness equivalent not read)
- Confidence: High — FACT. The US side has no table here, so an ACI jurisdiction must open its own minimum-thickness article before using these limits.
- Grid translation: show `l/(l/d) = d`, `h = d + 60`, and each multiplier applied or excluded with a reason. The span enters as tiles (`l = tiles × 0.5 m`), the depth leaves as a floor-to-floor deduction in ST-17; the l/d ratio itself is invisible on the plan, which is why the substitution is printed rather than asserted.
- Exceptions / failure mode: the code's own Note 3 says the flat-slab limits correspond to something *less severe* than mid-span deflection = span/250 — so for long spans ST-14, not this table, decides. A 9.0 m flat slab at d = 375–529 (h ≈ 420–600) eats 0.4–0.6 m of floor-to-floor. Depths are preliminary: an engineer's check governs the finished section.

### ST-13 Size beams by depth-to-span within an explicit validity range
- Rule: RC beams `h ≈ l/10 … l/15`, `b ≈ h/3 … h/2`, minimum b for aggregate + bar spacing + cover, and on this grid never under 1 tile when the beam must also carry a riser; steel downstand beams `h ≈ l/20 … l/25` (9.0 m → 360–450 mm) with deck spanning 2.5–4.0 m perpendicular; composite beams `h ≈ l/22 … l/30` of a shallower profile. All marked **HEURISTIC**: the l/d derivation is consistent with the read Table 7.4N (l/d 20–30 with d ≈ 0.9h ⇒ h ≈ l/22 … l/16 for RC), but the published steel and composite tabulations were **not read this pass**.
- Evidence: the RC ratios are a rearrangement of the read Table 7.4N band quoted in ST-12, so that row inherits a standard basis; the steel and composite bands are practitioner tabulations this file could not open, and the only check on them here is the same span/depth arithmetic. The 1-tile beam floor is a host constraint, not an engineering one: a beam narrower than a tile cannot also carry a riser.
- Source: derived from ST-12 — BS EN 1992-1-1:2004 Table 7.4N (T1, read) + preliminary-design teaching — T3, unread; SCI P300 *Composite Slabs and Beams Using Steel Decking*, the TABULI blue book, AISC/SCI section tables — named, not read (see Confidence). Tier: T3 + HEURISTIC for the steel and composite rows.
- Class: HEURISTIC (the numeric bands) / FACT (the link to the read Table 7.4N) — every beam size here needs an engineer's check
- Scope: framed systems only (not flat slab, not ribbed one-way)
- Confidence: Medium for the RC ratios (rearranged from a read table), Low for the steel and composite rows (no authority opened) — HEURISTIC (numeric), FACT (link to Table 7.4N). `NEEDS VERIFICATION:` SCI P300 *Composite Slabs and Beams Using Steel Decking*, the TABULI blue book, AISC/SCI section tables.
- Grid translation: flag `h_beam + services_zone > F2F − clear_ceiling_required` as a build-up failure (ST-17). Width is the half the plan can show — `b` in tiles, where a 2-tile beam already eats a corridor edge; depth is the invisible half and is only ever reported numerically.
- Exceptions / failure mode: unequal spans, upstand beams, and duct conflicts break the ratio; at ≥8 m deflection and vibration bind before strength. A 600 mm downstand in a 3.4 m guest floor loses the corridor ceiling build-up; deepening the slab or switching to steel are the only visible alternatives. Failure symptom: a beam depth chosen from the ratio that no longer fits once the duct is drawn.

### ST-14 Name the governing limit — strength, deflection, or vibration — per span band
- Rule: strength governs to ~5 m at typical floor loads; deflection ~5–8 m (the code device is ST-12, and Table 7.4N Note 3 permits flat slabs to exceed span/250); **vibration governs above ~8 m** on long, lightly partitioned hotel and office floors. Hand proxy (SDOF identity): `fn ≈ (1/2π)·√(g/δ)` ⇒ `δ = g/(2π fn)²`:
- Evidence: the deflection each target frequency implies, from the identity above:

  | target fn | 4 Hz | 6 Hz | 8 Hz | 9 Hz |
  |---|---|---|---|---|
  | required δ | 15.5 mm | 6.9 mm | 3.9 mm | 3.1 mm |

  At 9.0 m, 8 Hz needs δ ≤ 3.9 mm = span/2300 — an order of magnitude tighter than span/250, which is why long floors buy depth, composite construction or PT rather than a thinner flat slab. The requirement to consider dynamic action at all is code text and was read: EN 1991-1-1 §6.3.1.1(2)P and §2.2(3)/(5)P. The acceptance values behind the four target frequencies were not read, so the ladder ranks options and does not certify comfort.
- Source: mechanics — FACT; requirement to consider dynamics BS EN 1991-1-1:2002 §6.3.1.1(2)P, §2.2(3)/(5)P (read) — T1; **acceptance values not read**: DFCS *Vibration of Concrete Floors*, SCI P354, AISC Design Guide 11 (wobble/velocity/α0 limits) — named, not read. Tier: T1 (requirement) + HEURISTIC (targets).
- Class: FACT (the SDOF identity and the frequency→deflection ladder) / HEURISTIC (the span bands and the target frequencies — no acceptance criterion was read)
- Scope: all occupied floors, worst for assembly and long hotel corridors
- Confidence: FACT (formula) / NEEDS VERIFICATION. `NEEDS VERIFICATION:` DFCS *Vibration of Concrete Floors*, SCI P354, AISC Design Guide 11 (wobble/velocity/α0 limits).
- Grid translation: for span ≥ 8 m print `governing_limit = vibration (proxy)` and refuse to thin the slab. The proxy is a plan question end to end: span in tiles, panel aspect, and the partition density ST-05 books, with the frequency itself reported numerically because nothing on the grid carries it.
- Exceptions / failure mode: ignores mode shape, damping and occupant loading; it ranks options, it does not certify comfort. Depth costs floor-to-floor (MS-01); PT/composite costs early trade-partner input. Failure symptom: the thinnest legal 9.0 m floor, built and then complained about.

### ST-15 Select the system from the required span and re-derive the band instead of inheriting it
- Rule: CN-04/CN-05 own the ordering and self-declare their metre bands `UNCITED — heuristic`; the RC rows in `## System selection table` are re-derived from read sources (ST-12 span/depth, ST-10 punching), while steel, composite, CLT and masonry rows remain heuristic with the authority named. Where my number and CN-05's differ, both are printed with the reason (loading, fire, deflection).
- Evidence: the span bands themselves live in `## System selection table`, and each row names its basis there: the RC beam-and-slab and solid flat-slab rows carry the ST-12 (Table 7.4N) and ST-10 (Expr. 6.2.a) derivations, the one-way/ribbed row the same depth arithmetic, and the masonry, steel, composite, PT, CLT and long-span rows an authority that was located but never opened. The derivation is what lets a flat-slab row state a punching-governed limit instead of a preference.
- Source: this file ST-10/ST-12 — BS EN 1992-1-1:2004 clauses as cited there (T1, read); `construction.md` CN-05 table — internal T3, self-declared heuristic; AWC/Swedish Wood CLT handbooks, TMS 402 / EN 1996-1-1, PTI, SCI/TABULI — all located, none read. Tier: T1 (RC) / T3 (others, unread).
- Class: STANDARD for the derived RC rows (they inherit the read clause behind them) / HEURISTIC for every other row (authority named, not read)
- Scope: all systems
- Confidence: MIXED, marked per row — Medium-High where the row carries a derivation, Low where it carries only an unopened name.
- Grid translation: state `system`, `span_used`, `band_source`, `derived_from = ST-10/ST-12`. The table prints tiles per row alongside the metres, so a system can be rejected for being inexpressible on the grid (ST-16) before it is rejected on load.
- Exceptions / failure mode: "feasible" and "economical" are different claims; only feasibility is derived here. An 8.4–9.0 m flat slab is formwork-cheap (CN-23) and floor-to-floor-expensive; a 4.5 m beam grid is depth-efficient and puts a line through the plan (CN-07). Failure symptom: a system adopted for its metre band and abandoned when the bay will not close on whole tiles.

### ST-16 Convert the structural module to whole tiles before trusting the span number
- Rule: GT-15 owns the rule; the numbers are here. Guest bay 3.6 m → 7.2 tiles → must become 3.5 m (7 tiles) or 4.0 m (8 tiles); 3.75 m (7.5 tiles) is legal on tiles but off the 1.5 m coordination cell (GT-03). Preferred **4.5 m = 9 tiles = 3 cells**, doubling to 9.0 m = 18 tiles = 6 cells. Office/retail 8.4 m → 16.8 tiles → **9.0 m = 18 tiles** (GT-15's own advice) or 8.5 m = 17 tiles with +1.0 m drift per ten bays. Load consequence: 3.6→3.5 m cuts the column's tributary area 2.8% (one direction only, `A_tr ∝ L_short`), 8.4→8.5 m adds 1.2% in that direction, 8.4→9.0 m with both axes moving adds **14.3% on the column and 6.7% on the required slab depth**.
- Evidence: the conversions are arithmetic on the host facts `1 tile = 500 mm`, `1 tile² = 0.25 m²` and the 3-tile coordination cell of `grid-translation.md` GT-03, with GT-15's own preference for the doubled bay; the load consequence follows from ST-07's tributary geometry and ST-12's fixed span/depth, so rounding a bay is a structural decision with a price printed here rather than a drafting convenience.
- Source: `grid-translation.md` GT-03/GT-15 + verified arithmetic (1 tile = 500 mm, 1 tile² = 0.25 m²) — FACT; no external document supplies these numbers.
- Class: FACT (the tile conversion and the derived percentage changes); the rounding *policy* belongs to GT-05/GT-06, not to this rule
- Scope: every bay statement
- Confidence: High — FACT
- Grid translation: publish `bay_intent_mm | tiles | bay_result_mm | ΔN%` per bay family. Cell test: `tiles mod 3 = 0` puts a bay on the 1.5 m coordination cell, which is why 4.5 m = 9 tiles = 3 cells and 9.0 m = 18 tiles = 6 cells are the preferred family and 8.4 m is not.
- Exceptions / failure mode: the grid cannot express a 7.2-tile bay, so "3.6 m module" in a rationale is false on this host. Rounding up buys structural margin and pays net-to-gross (GT-24). Failure symptom: a rationale quoting a metric module that nobody can build on the grid.

### ST-17 Spend the floor-to-floor height explicitly, in millimetres
- Rule: `F2F = slab/beam + services zone + ceiling build-up + finish + required clear ceiling`. Guest floor, beam-and-slab: 200 slab + 500 beam + 300 duct zone + 100 finish/ceiling = **1.10 m** build-up → clear 2.30 m at 3.40 m F2F (too tight over a corridor; the beam zone needs the extra 0.2 m or the duct must pass through the beam — a penetration decision, CN-20). Flat-slab guest floor: 420 + 250 + 100 = **0.77 m** → clear 2.63 m. Podium at h = 600: 600 + 350 + 100 = 1.05 m → clear 3.15 m at 4.2 m F2F.
- Evidence: the build-up has a sourced half and an unsourced half. The structural terms come from ST-10/ST-12, i.e. from the read span/depth table and the read punching expression; the services, ceiling and finish terms are practice values whose authorities were named in `construction.md` and never opened. The rule is therefore a subtraction chain, and only the chain is reported — the flat-slab variant buys back the depth the beam version spends, which is the whole ST-15 trade in millimetres.
- Source: depths from ST-10/ST-12 — BS EN 1992-1-1:2004 clauses as cited there (T1, read); the services/ceiling terms are **HEURISTIC** — BSRIA AG/BG service-zone guides or CIBSE Guide A, named in `construction.md`, unread (see Confidence). Tier: T1 (depths) + T4 (zones).
- Class: DESIGN PRINCIPLE (the subtraction recipe) / HEURISTIC (the zone terms); the depth terms are STANDARD through ST-10/ST-12
- Scope: multi-storey; MS-01 consumes the result as the vertical control grid
- Confidence: MIXED — High on the structural terms, Low on the zone terms. `NEEDS VERIFICATION:` BSRIA AG/BG service-zone guides or CIBSE Guide A (named in `construction.md`, unread).
- Grid translation: output the subtraction chain with the residual clear ceiling, and flag any deficit. The host stores no heights at all, so F2F is a declared number in the deliverable, never a measured one; its only plan-visible consequence is the ST-13 duct-conflict flag and the corridor tiles the build-up consumes.
- Exceptions / failure mode: the host has no heights at all (SKILL.md host fact 7), so the build-up is asserted numerically. Buying F2F is the cheapest structural fix and the most expensive architectural one (façade datum, storey count, core cost per floor). Failure symptom: a corridor that "achieves" its clear ceiling until the duct is drawn.

### ST-18 Choose the lateral system by height and say what stops the previous one
- Rule: braced/moment frame (low- to mid-rise) → RC core / shear-wall system (mid-rise, this hotel) → core + outrigger/belt truss or tube (tall) → megaframe (super-tall). Practical reading: below ~10 storeys stiffness is not the constraint and the core is an egress object; 10–25 storeys is ordinary RC core-wall territory; outriggers only become arithmetic beyond ~40 storeys.
- Evidence: read evidence for the upper range: *Advances in Steel Construction* 12(2) models composite core buildings at **28, 42 and 57 storeys (98 m, 147 m, 199.5 m)** and summarises Nanduri's 30-storey RC study (outrigger optimum at mid-height), 40-storey wind / 60-storey seismic models, and reported **65% (belt truss) and 18% (outrigger) lateral deflection reduction**. The paper supplies the top of the ladder and the size of the prize; the low end of the ladder is ordinary practice, and the storey bands in the Rule line are the reading of both.
- Source: ascjournal.com, *Advances in Steel Construction* 12(2), "Optimum position of steel outrigger system for high rise composite buildings under lateral wind loadings" (PDF retrieved, text read) — T2.
- Class: STANDARD (the system-by-height ordering) / FACT (the paper's own models and quoted percentages, T2); the height bands are reading, not a code limit
- Scope: towers and podium-towers
- Confidence: Medium — FACT (paper's own models and quoted percentages), STANDARD (ordering). One peer-reviewed paper under cyclonic wind supports the upper band; nothing here is a code threshold.
- Grid translation: state `height_m`, `storeys`, `lateral_system`, `why_not_the_one_below`. The plan shows the consequence: how many perimeter tiles the lateral elements occupy (ST-19/ST-20) and, past an outrigger decision, the mechanical storey removed from the stack (CN-12/CN-14).
- Exceptions / failure mode: the paper is steel/composite under cyclonic wind; its storey range is its modelling scope, not a code limit, and it says nothing about a specific wind map. Outriggers buy drift and cost a mechanical storey no plan can use (CN-12/CN-14). CODE-13's height × area × storey caps stop the ladder before the structure does, and drift numbers here are indices, not a serviceability verdict — an engineer's check governs.

### ST-19 Size the core wall, then hand-check overturning and uplift
- Rule: preliminary wall thickness ≥150 mm and ~storey-height/20 to /25 (**HEURISTIC**; verification flag carried in Confidence). Overturning for uniform pressure w on height H: `M_ot = w·H²/2` per metre of face; restoring `M_R = W·B/2`; require `M_R ≥ 1.5·M_ot` (EQU/GEOSTATIC factor per EN 1990 §6.5 — factor value not read, use 1.5 HEURISTIC). Base pressure with moment: `q_max/min = N/A ± M/Z`, `Z = L·B²/6`. Worked 21-storey tower, plan 20 × 30 m, N = 250 MN, H = 68 m, w = 0.6 kN/m² on the 20 m face: `M_ot = 0.6×68²/2 = 1 387 kN·m/m ×20 = 27.7 MN·m`; `Z = 20×30²/6 = 3 000 m³` → Δq = 9.2 kPa against `N/A = 250 000/600 = 417 kPa` → no uplift; index `Δq/q_avg = 0.022` → overturning is nowhere near governing for a stocky hotel (a slender tower's index is 20–50× this, which is where the check starts to matter).
- Evidence: statics = FACT — the overturning, section-modulus and base-pressure relations above are section-free and computable from the plan's shape plus the storey count. Of the three numbers feeding them, two are not read values: `w = 0.6 kN/m²` is a placeholder, **not** a wind code value, and the EQU/GEOSTATIC factor is taken at 1.5 as practice because the read text defers it to the NA. The index is still worth printing, because it says which check the building is *not* failing.
- Source: statics — FACT; the wind pressure in the Rule line is a placeholder, **not** a wind code value — EN 1991-1-4 §4.2/4.5 or ASCE 7-16 Ch. 26–30 named, not read (see Confidence); EN 1990 §6.5 — clause named, factor value not read; wall proportions — HEURISTIC, EN 1992-1-1 §9.8 named, not read. Tier: FACT (mechanics) + HEURISTIC (numbers).
- Class: FACT (the statics) / HEURISTIC (the wall proportions, the 1.5 factor and the placeholder wind pressure) — an overturning or uplift conclusion is an engineer's check
- Scope: any claimed lateral element
- Confidence: MIXED. `NEEDS VERIFICATION:` EN 1992-1-1 §9.8 minimum dimensions and wall height ratios, not read. `NEEDS VERIFICATION:` EN 1991-1-4 §4.2/4.5 or ASCE 7-16 Ch. 26–30 for the site velocity and pressure.
- Grid translation: print `Δq/q_avg` and the uplift test `q_min ≥ 0` per load case. Both are plan quantities: `A` and `Z` come from the plate dimensions in tiles and `N` from ST-08/ST-09, so the index is computable before any section exists.
- Exceptions / failure mode: ignores torsion, mode shape/dynamic amplification, and soil-structure interaction; the plan does give shape, area and mass, which is exactly what this index needs. Pushing walls to the perimeter is the cheapest stiffness and the dearest lettable depth. Failure symptom: a slender tower judged safe on a stocky building's index.

### ST-20 Run a gross-stiffness and drift index before believing a tall plan stands up
- Rule: `EI ≈ E·Σ(A_i·x_i² + I_i)` about the lateral group centroid — computable from the plan alone; `δ_top ≈ w·H⁴/(8EI)` (cantilever, uniform load).
- Evidence: Worked, H = 68 m, w = 12 kN/m (0.6 kN/m² × 20 m face), E = 30 GPa (C30/37; modulus flag carried in Confidence):
  * two 7.0 × 0.30 m cores separated 32 m: A = 4.2 m², ΣA·x² = 1 075 m⁴, ΣI = 17 m⁴ → Σ ≈ 1 092 m⁴ → `EI = 3.28e13 N·m²` → `δ = 12e3×2.138e7/(8×3.28e13) = 0.98 mm` → **δ/H = 1/70 000** (over-stiff);
  * one 7.0 × 0.30 m core at the centre: ΣI ≈ 20 m⁴ → `EI = 6.0e11` → `δ = 53 mm` → **δ/H = 1/1 270**, borderline against the 1/500–1/1000 planning band (**HEURISTIC**, drift-criterion flag carried in Confidence).
  Read: **separation of walls, not wall area, buys stiffness** — a 50× index change from moving the same concrete 16 m out. That is a plan decision, and it is the reason CN-08's "cores, symmetric, continuous" is testable. Cracking (EI × 0.3–0.5) and shear deformation are ignored, so both indices are optimistic in the same direction and only their ratio is load-bearing.
- Source: mechanics — FACT (method); the two worked indices above — arithmetic on the formulas. EN 1992-1-1 Table 3.1 (Ecm) and the binding drift criterion (EN 1990 Annex A2.2 or a tall-building guide) — named, not read (see Confidence). Tier: FACT (method) + HEURISTIC (indices).
- Class: FACT (the stiffness and cantilever-deflection relations) / HEURISTIC (the drift band and the uncracked section) — a drift verdict is an engineer's check
- Scope: core/wall/braced systems
- Confidence: MIXED. `NEEDS VERIFICATION:` EN 1992-1-1 Table 3.1 Ecm not read this pass. `NEEDS VERIFICATION:` the binding drift criterion is an NA/client value — EN 1990 Annex A2.2 or a tall-building guide.
- Grid translation: print `ΣA·x²`, `EI`, `δ/H`; require separated lateral elements above ~15 storeys. Every input is a plan measurement — the lateral element footprints in tiles and the separation in tiles between their groups — which makes this the most plan-native stiffness test in the file.
- Exceptions / failure mode: ignores slab-frame interaction and coupling-beam flexibility. Perimeter walls buy stiffness quadratically and cost plan depth (ST-19's pressure case is the same trade in reverse). Failure symptom: one central core in a tall plan, where no amount of added wall area fixes what separation would.

### ST-21 Price transfer in force, depth and tiles, and publish the count
- Rule: a transfer carries the accumulated force of everything above the grid change as a **point load**. Worked: the 9.87 MN tower column (ST-08) landing at mid-span of a 9.0 m podium beam → `M = P·L/4 = 9 865×9/4 = 22.2 MN·m`, far outside a 600 mm podium beam. Options: (a) align the tower column with a podium column (cost zero — the right answer 90% of the time), (b) a two-storey-depth transfer (2 × 18 tiles of lost room depth and a whole floor's lettable area), (c) steel haunch. Spatial cost on the grid follows CN-10's convention: the transferring element is a 2-tile (1.0 m) blocked band, so `tiles_lost = 2 × length_in_tiles` on that level plus the rooms it cuts.
- Evidence: the force comes from ST-08's accumulation and the mid-span moment coefficient is statics, so the number is firm; what is not firm is the price list. The depth and storey costs behind the three options are practitioner consensus, and the CTBUH case studies named in CN-10 were **not read**, which is why the rule's conclusion is the free option (alignment) rather than a ranking of remedies.
- Source: statics — FACT (number); depth/storey costs — HEURISTIC, the CTBUH transfer case studies named in `construction.md` CN-10 were **not read**. Tier: FACT (number) + T3/unread (remedy costs).
- Class: FACT (the point-load arithmetic) / HEURISTIC (the remedy costs) — every transfer is an engineer's check
- Scope: podium-tower, parking-under-tower, plant-over-retail
- Confidence: MIXED — High on the force and the moment, Low on what each remedy costs.
- Grid translation: emit `transfer_count`, `P_transfer`, `M_transfer`, `tiles_lost` per level, matching MS-07's `transfer_levels` list exactly. On the plan a transfer reads as a blocked band two tiles deep along the receiving line plus the rooms it cuts, which is the only cost this host can actually show.
- Exceptions / failure mode: hooping, strutting and pile-raft responses are invisible here → `needs-section-review`. Re-aligning the tower grid to the podium grid typically costs a few rooms and cancels the entire transfer budget. Failure symptom: an "improved" podium bay that silently invents a transfer nobody priced (ST-16).

### ST-22 Test plan regularity with numbers the plan can answer
- Rule: five measurable red flags (qualitative logic in CN-08/CN-09):
  1. **Soft storey** — `K_f/K_avg(3 above) < 0.7`, `K_f/K_adjacent < 0.8`; grid proxy: bearing-tile count (wall + column tiles) dropping >30% against the typical storey, or open-frontage ratio >0.5.
  2. **Mass discontinuity** — `Δm/m > 0.25` between adjacent storeys (setback, plant, pool, archive floor).
  3. **Torsional asymmetry** — `e = |x_cr − x_cm|` from `x_cr = ΣA_i·x_i/ΣA_i` over lateral tile areas; flag `e/B_min > 0.10`.
  4. **Re-entrant corner** — wing projection >0.15·B in both axes, or both wings narrower than 0.3 of the overall dimension.
  5. **Diaphragm continuity** — opening area/gross plate >0.15, or two regions joined by a neck < 0.15·B: no collector can form.
- Evidence: the *categories* are EN 1998-1 §4.2.2/§4.2.3 concepts — torsional and re-entrant-corner irregularity, diaphragm irregularity, vertical irregularity and the soft-storey stiffness comparison — but **EN 1998-1 was not retrieved** (host returned an HTML error page), so every threshold above is `HEURISTIC`. Each threshold was chosen so the test is answerable from the plan alone: bearing-tile counts per storey, lateral tile areas and their centroid against the mass centroid, wing projections, and opening area over gross plate.
- Source: EN 1998-1:2004 §4.2.2 Table 4.2, §4.2.3.1(1)–(2), §4.2.3.2(1)a — T1 target, **not retrieved this pass** (host returned an HTML error page); as used here — HEURISTIC. Tier: T1 (target) / HEURISTIC (as used).
- Class: HEURISTIC (every threshold is a review trigger; the concept list is code in origin but unread here)
- Scope: seismic and non-seismic — these are stiffness-continuity tests
- Confidence: Low — HEURISTIC. `NEEDS VERIFICATION:` EN 1998-1:2004 §4.2.2 Table 4.2 (torsional, re-entrant-corner, diaphragm irregularity), §4.2.3.1(1)–(2) and §4.2.3.2(1)a (vertical irregularity and soft-storey stiffness ratio).
- Grid translation: emit `regularity = {soft_storey, mass_step, e/B, reentrant, opening_ratio}` with margins. All five are tile arithmetic — counts per storey, areas, centroids and neck widths measured in tiles — so a plan can be ranked before any stiffness is computed.
- Exceptions / failure mode: tile-count proxies are not stiffness; they rank plans, they do not classify irregularity. Over-flagging forbids every interesting podium; under-flagging yields a plan with no continuous diaphragm. Failure symptom: a tower over a double-height podium whose bearing tiles simply stop.

### ST-23 Size pads from the service-level force and a named allowable pressure
- Rule: `A_pad = N_service/(q_all − γ·z_replace)`, `B = √A`. Worked tower base N_service ≈ 11 MN (characteristic counterpart of ST-10's 13.3 MN design force) on "firm cohesive earths" q_all = 479 kPa (5 tsf) at 4 m depth replacing 4 × 18 = 72 kPa: `A = 11e6/(479−72)e3 = 27.1 m²` → `B = 5.2 m = 10.4 → 11 tiles` square. On "average cohesive earths" (192 kPa = 2 tsf) the net figure is 120 kPa: `A = 91.7 m²` → 9.6 m square, one whole structural bay → **pads cannot work: combined pads, raft or piles** (ST-24).
- Evidence: the pressures are read rows of a published presumptive table, whose printed range runs from rock at 60 tsf = 5 746 kPa down to moderate fine-grained material at 1.5 tsf = 144 kPa; the page itself states that the values assume lateral confinement and level strata, permit depth and settlement adjustments, and require documented geotechnical validation. The depth correction is the soil self-weight displaced by the footing, and the two worked soils differ by a factor that decides the foundation type, not the pad size.
- Source: New York City Building Code 2008 §1804 / Table 1804.1, presumptive allowable foundation pressures — T1 (code table read; jurisdiction = NYC). FHWA GEC-6 §5.2.7 — T1 (read), cited in Exceptions as the counter-authority.
- Class: STANDARD (the row values and the formula, NYC BC 2008 Table 1804.1, edition and jurisdiction named) / FACT (the pad arithmetic)
- Scope: spread footings on natural soils, order-of-magnitude only
- Confidence: FACT (row values), STANDARD (formula). Low as a design basis: one municipality's presumptive table, which the federal guidance cited in Source explicitly deprecates for design; a non-NYC project must re-read EN 1997-1 + NA / BS 8004 or a site report.
- Grid translation: print `q_all_source = <code, table, soil class>` and label the soil row `ASSUMED`. Pad size leaves the arithmetic in tiles: `B = √A` then two tiles per metre, and a pad that reaches a whole structural bay is the point where the column grid stops being free.
- Exceptions / failure mode: FHWA GEC-6 §5.2.7 explicitly deprecates presumptive values for design ("The use of presumptive bearing capacities for footings bearing in soils is not recommended"); settlement usually rules before pressure, and mixing factored forces with allowable pressures is a jurisdictional habit, not a law — hence N_service here. Pad grids want column lines kept straight (CN-03); a raft forgives irregularity at cost. No pad here is a design value: a geotechnical report and an engineer's check precede it.

### ST-24 Compute the base-pressure index before choosing a foundation type
- Rule: `q_avg = N_total,service / plan_area` classifies the foundation in one number. Worked 21-storey hotel on a 600 m² footprint: guest 16 × (8.05+2.5) = 169 kPa, podium 4 × (10.55+4.8) = 61 kPa, roof 6.7 kPa, core/wall and basement self-weight + services ≈ +60 kPa → **q_avg ≈ 300 kPa**; with overturning Δq = 9 kPa (ST-19) → 291–309 kPa. Thresholds used: `<150 kPa` isolated pads · `150–350 kPa` pads on good ground or combined pads · `>350 kPa` raft or piles · mat economical when footings would cover more than half the plan area (FHWA GEC-6's observation-method framing, quoted as a planning guide). Against NYC Table 1804.1 this sits above "average cohesive earths" (192) and inside "firm cohesive earths" (479) → raft or piled raft, i.e. **the basement is a structure, not a parking deck**, and its grid must inherit the tower grid: 9.0 m ≈ one and a half 5.5–6.0 m parking bays plus an aisle, so an offset basement grid that differs by less than one pad width is unbuildable.
- Evidence: the read GEC-6 rows behind the thresholds run from recommended values in massive crystalline rock at 7.7 MPa down to compacted structural fills at 290/190/170 kPa with anticipated settlement held under 40/32 mm (the WSDOT/NDOT/MDOT columns), and the same document frames the mat-versus-pads choice by the observation that a mat becomes economical once isolated footings would cover more than about half the plan area. The soil names in the Rule line are the NYC table's own classes, so the comparison is between a computed demand and a published capacity, not between two heuristics.
- Source: FHWA *Geotechnical Engineering Circular No. 6 — Shallow Foundations* (DOT report 01-0943, 2001) §5.2.7, §5.3, Tables 5-6/5-7/5-9/5-10 — T1 (read); soil classes New York City Building Code 2008 Table 1804.1 — T1 (read). Tier: T1.
- Class: STANDARD (the read FHWA and NYC rows, documents and editions named) / DESIGN PRINCIPLE (the thresholds as planning values)
- Scope: everything below grade
- Confidence: FACT (read rows) / STANDARD (thresholds as planning values). Medium overall: the type ranking is sound, the cut-offs are planning values rather than a site assessment.
- Grid translation: output `q_avg_kPa`, `soil_class = ASSUMED(...)`, `foundation_type`, and the basement-vs-tower grid offset in tiles. The offset test is plan-visible: an underground line that shifts by less than one pad width cannot be built, and a piled solution inherits the tower's grid exactly (MS-07).
- Exceptions / failure mode: no SPT/cu data read; no settlement calculation attempted; this ranks foundation *types*. A raft tolerates an offset tower grid; piles punish a shifted column more than anything else, so piled solutions force MS-07's grid discipline all the way down. Nothing here is a bearing value for design — a site report and an engineer's check govern.

### ST-25 Show the span sensitivity in the order things actually break
- Rule: `slab depth ∝ span` (fixed l/d) · `tributary area ∝ span²` · `punching capacity ∝ u1·d ≈ d²` against a fixed column · `steel weight ∝ span²–span³`. Ladder, same 16-storey tower, beamed floor, slab depth taken from ST-12 at the panel's own load (`N/storey = Ed × A_panel`; Ed rises with the slab):
- Evidence: the ladder, run through the read span/depth table and the read loads:

  | bay (m) | tiles | A_panel (m²) | slab needed (flat, l/d 24) | N per storey (kN) | N at 16 storeys (MN) | verdict |
  |---|---|---|---|---|---|---|
  | 4.5 × 9.0 | 9 × 18 | 40.5 | 375 | 592 | 9.5 | beam-and-slab, 200 mm slab — the chosen answer |
  | 5.0 × 10.0 | 10 × 20 | 50.0 | 417 | 816 | 13.1 | 250 mm slab + 500 beams; flat slab needs h ≈ 480 |
  | 5.5 × 11.0 | 11 × 22 | 60.5 | 458 | 1 047 | 16.8 | PT or waffle; ~+0.4 m F2F per floor |
  | 6.0 × 12.0 | 12 × 24 | 72.0 | 500 | 1 346 | 21.5 | steel/composite; above the derived RC band (CN-05 top) |

  Read alongside ST-10: the binding pair at every step is **depth (ST-12) and column force (ST-08)**; punching only bites where a beamless slab carries a heavy panel (the podium's 81 m² retail panel failed at h = 420 and passed at h = 600).
- Source: derived from BS EN 1992-1-1:2004 Table 7.4N + §6.4.4 (read) with BS EN 1991-1-1:2002 loads (read) — T1 + verified arithmetic. Tier: T1.
- Class: FACT (the scaling relations and every rung computed from the read tables cited in ST-08/ST-10/ST-12)
- Scope: framed and flat-slab systems
- Confidence: High — FACT, with the caveat that each rung assumes the same use mix as the tower it is measured against.
- Grid translation: run the ladder for the chosen bay and one bay wider; publish both verdicts. Every rung is tile-exact, so a bay decision reads on the plan as a bay family rather than as a section, and the column's tile count follows from ST-10.
- Exceptions / failure mode: assumes similar loading; archive/storage at 7.5 kN/m² (Table 6.4) shifts every row one step left. At 11.0 m the same F2F budget loses roughly one floor in 21 — the plan argument, in one number. Failure symptom: a bay widened for a view, paid for in storeys nobody counted.

### ST-26 Follow the eight-step procedure and label every fallback
- Rule: fixed order (the size conclusions depend on it): grid → use labels → floor build-up → span/depth → tributary + take-down → capacity (column, punching) → lateral (system, overturning, drift, regularity) → foundations + section honesty. Required inputs: use labels per room, bay grid in metres and tiles, storey count and stack role, plate dimensions, founding depth, jurisdiction. Fallbacks, each printed as `ASSUMED(<basis>)`: no jurisdiction → EN 1991-1-1 + EN 1990 recommended factors, "NA values not applied"; no use label → type default from the imposed-load table; no storey count → programme areas ÷ typical plate; no soil data → "firm cohesive earths, 479 kPa, NYC BC Table 1804.1, order-of-magnitude only"; no wind data → 0.6 kN/m² placeholder flagged as not site-specific; no F2F → 3.4 m guest / 4.2 m podium.
- Evidence: the order is not housekeeping — capacity consumes the take-down, lateral consumes capacity, and foundations consume all three, so a reordered run produces different numbers from the same plan. Each fallback above is the value actually used in `## Worked example: 21-floor hotel`, and `## Plausibility checklist` is this procedure with its pass test attached to each step.
- Source: this file's method — FACT; the labelling discipline is `SKILL.md` §Evidence Rules — internal; the fallback values inherit the citations of ST-04, ST-19, ST-23, ST-24 and ST-17.
- Class: DESIGN PRINCIPLE (procedure order and labelling discipline; the fallback values carry the classes of the rules they come from)
- Scope: all plans
- Confidence: High — FACT
- Grid translation: never reorder; never publish a step-8 result without steps 1–7 visible. The host executes the same sequence — plan, labels, loads, depths, forces, capacities, lateral, foundations — so the deliverable is auditable step by step.
- Exceptions / failure mode: the procedure cannot invent a missing load path (CN-01…CN-03 own that). An unlabelled fallback becomes a "finding"; a labelled one stays reviewable. Preliminary sizing is not structural design: the output of step 8 is `plausible / implausible / needs-engineering`, and every size leaving this procedure needs an engineer's check.

## Imposed load table

Characteristic values. `Legibility` is the honest state of the retrieved copy: full / partial (range
endpoints degraded by text extraction) / n/r (not read).

| Use | EN cat. | qk (kN/m²) | Qk | Source (jurisdiction, doc, edition, table) | Legibility |
|---|---|---|---|---|---|
| Guest room, residential bedroom, hostel, hospital ward | A | printed range starts 1.5; **2.5 used as the conservative planning value — NA-selected figure NEEDS VERIFICATION** | 2.0–3.0 (range) | BS EN 1991-1-1:2002 Table 6.1 + Table 6.2 | partial |
| Residential/hotel stair | A | 2.0 … | 2.0–3.0 | same | partial |
| Balcony | A | 2.0 … | 1.5–4.5 | same; IBC: balconies = 1.5× the served area (not required to exceed 100 psf) | partial |
| Office | B | 3.0 (range "3,0 to 4,0") | 3.0–4.0 | EN 1991-1-1 Table 6.2; IBC 2.4 kPa | good |
| Restaurant / banquet / reception | C1 | ≥3.0; NA value NEEDS VERIFICATION | — | Table 6.1 (C1 lists cafes, restaurants, dining halls) + 6.2 | partial |
| Hotel corridor, museum, exhibition, access areas | C3 | 3.0 … 7.5 (upper end read) | — | Table 6.1 (C3) + 6.2 | partial |
| Fixed-seat assembly (cinema, lecture) | C2 | 4.5 … | — | Table 6.1/6.2 | partial |
| Retail — shop / department store | D1 / D2 | NA-selected; column shows "…to 7,0" | 3.5–7.0 (col. garbled) | Table 6.1/6.2; IBC 4.8 kPa ground, 3.6 kPa upper | partial |
| Archive, library stack, storage | E1 | **7.5** | **7.0** | Table 6.3 + Table 6.4 (read fully); IBC stacks 7.2 kPa, heavy storage 12.0 | full |
| Car park, vehicles ≤ 30 kN gross | F | 1.5–2.5 (range read; NA selects — commonly 2.0, NEEDS VERIFICATION) | 10–20 kN axle on 100 mm squares | Table 6.8 + Note 1 (read) | full (range) |
| Car park, 30 < gross ≤ 160 kN | G | 5.0 | 40 … (upper end garbled) | Table 6.8 + Note 2 | partial |
| Non-accessible roof / plant roof | H | **0.4** | **1.0 on 10 m²** | Table 6.9/6.10 + §6.3.4.2(1) Note (read) | full |
| Accessible roof / terrace | I | takes the category it serves | — | Table 6.9 (read); IBC rooftop garden 4.8 kPa | full |
| US: corridors (non-mercantile, above 1st floor) | — | 3.8 kPa (80 psf) | 4.45 kN | IBC 2024 as adopted, DoD Building Code 2024 Ch. 16 Table E-1 | full |
| US: public rooms / assembly / lobby | — | 4.8 kPa (100 psf) | — | same | full |
| US: storage light / heavy | — | 6.0 / 12.0 kPa | — | same | full |
| US: library reading rooms | — | 2.9 kPa (60 psf) | 4.45 kN | same | full |
| US: roof, unoccupied | — | 1.0 kPa (20 psf) | 1.33 kN (maintenance) | same | full |
| US: dwelling units, hotel guest rooms, parking garage vehicle loads | — | `NEEDS VERIFICATION:` the fetched excerpt left the residential row blank and referred garages to §1607.8 — read IBC Table 1607.1 rows 1–4 and §1607.8 | — | — | n/r |

US→SI conversion as printed in the same source: 1 psf = 0.0479 kN/m². EN reduction machinery: ST-09.

## System selection table

Feasibility is derived where marked; economics stays heuristic until the unread guides are opened.
Span bands cross-check `construction.md` CN-05 (self-declared heuristic) rather than overriding it.

| System | Span used/derived (m) | tiles | Floor-to-floor impact | Fire strategy | Typical grid | Basis |
|---|---|---|---|---|---|---|
| Load-bearing masonry / bearing wall | ≤ ~4.5 with precast floors (HEUR; `NEEDS VERIF:` TMS 402 ch.1 / EN 1996-1-1 §6.1.2) | ≤ 9 | no beams, but every line bears and must stack (CN-03) | masonry leaf gives R; thickness ≥100 mm | ≤ 6.0 m, 2–4 lines/unit | CN-05 band + unread code |
| One-way precast / ribbed floor | 4.5–7.5 | 9–15 | 200 deck + 400–500 secondary | thin decks need a suspended rated ceiling | 1.2–1.5 m rib pitch | derived, ST-12 (read) |
| RC beam-and-slab (this hotel) | slab 4.5, beam 9.0 | 9 × 18 | 200 slab + 450–600 beam → 1.10 m build-up | 2 h with cover; no spray | 4.5 m bay × 9.0 m corridor span | ST-12/ST-13 (read) |
| RC flat slab, solid | ≤ ~9.0; **punching-governed** (81 m² retail panel fails at h=420, passes at h=600) | 18 | 420–600 slab, drops invisible → `needs-section-review` | cover + depth check for 2 h; penetrations hurt | 7.5–9.0 m square | ST-10 arithmetic (read) |
| RC flat slab, waffle/hollowed | 9–12 (HEUR) | 18–24 | 450–600 total | voids limit penetrations | 9–12 m | CN-05 (heuristic) |
| Post-tensioned flat slab | 9–13 (HEUR); camber recovers F2F | 18–26 | 300–400 at 9–11 m | tendon cover/protection is the issue | 9.0 m | CN-05 + unread PTI/IJAME |
| Steel + metal deck | deck 2.5–4.0; beam 6–12 (`h ≈ l/20`, HEUR — **SCI P300/TABULI not read**) | 5–8 deck / 12–24 beam | shallowest build-up → best F2F economy | spray or board; deck needs a rated design | 3.0 m deck pitch × 9.0 m | rule of thumb + named-unread T1 |
| Composite steel + concrete | 9–12 (HEUR pending SCI) | 18–24 | 130–160 deck on 350–450 beam | stud/deck fire design | 3.0 × 9.0 | same |
| CLT floor/roof panel | ≤ ~5.0 one-way (HEUR; `NEEDS VERIF:` AWC/Swedish Wood CLT Handbook span tables — located, unread) | ≤ 10 | panel + screed; acoustic mass, not strength, is the problem | char layer / exposed-timber strategy | 1.2–2.4 m panel width | CN-05 + unread tabulation |
| Long span: truss / space frame / arch | 15–45+ (HEUR); truss depth ≈ span/10–1/16 | 30–90+ | depth is the cost; needs the volume | exposed steel needs protection at height | follows truss spacing | CN-05 + Ching (unread) |

## Worked example: 21-floor hotel

Stack as taken: levels 1–5 podium (9.0 × 9.0 m = 18 × 18 tile grid: lobby, F&B/retail, amenity, BOH),
levels 6–21 = 16 guest floors on 4.5 × 9.0 m (9 × 18 tiles), roof at level 21. The brief's 18-guest-floor
variant is the +2 storey sensitivity below the table, not a different building.

Loads (ST-02/05/06): guest floor `G_k = 5.00 + 1.05 + 0.40 + 1.60 = 8.05`, `Q_k = 2.5` → Ed = 14.62 kN/m².
Roof `G_k ≈ 6.3` (waterproofing 0.6, insulation 0.3) → Ed = 9.1 kN/m². Podium (retail):
`G_k = 8.00(320 slab) + 1.05 + 0.50 + 1.00 = 10.55`, `Q_k = 4.8` → Ed = 21.44 kN/m². The 320 mm podium
flat slab carries **1.2 m square drops at every column** — ST-10 shows the same 81 m² panel failing
undropped at h = 420, so the drop (invisible on the grid → `needs-section-review`) is what makes the
section work, and the drop zone is tiles the plan cannot use.

Take-down, critical tower column (A_tr 40.5 m² guest / 81 m² podium where aligned), with ST-09's αn:

| Level | above it | N_raw (kN) | αn applied | N_design (kN) | A_req = N/20.0 MPa | size (mm / tiles) |
|---|---|---|---|---|---|---|
| 21 | roof | 369 | — | 369 | 18 450 mm² → 136 | n/a (roof beam) |
| 18 | 4 guest + roof | 2 737 | 0.85 (guest part) | 2 382 | 119 100 → 345 | 400 × 400 (0.8 t) |
| 12 | 10 guest + roof | 6 289 | 0.76 | 4 868 | 243 000 → 493 | 500 × 500 (1.0 t) |
| 9 | 13 guest + roof | 8 065 | 0.746 | 6 111 | 305 550 → 553 | 600 × 600 (1.2 t) |
| 6 | 16 guest + roof | 9 865 | 0.7375 | 7 355 | 367 200 → 606 | 650 × 650 (1.3 → 1.5 t) |
| 5 | + 4 podium storeys on the aligned line (1 737 each) | 16 813 | 0.7375 / 0.85 | 13 260 | 662 000 → 814 | **900 × 900 (2 t)** |
| 1 | + core/wall self-weight ~ +15% | — | — | ≈ 15 300 | 765 000 → 875 | 900 × 900 kept; pad/raft below |

Check list on this answer: punching at the tower panels `592/1 310 = 0.45` (OK at h = 420); punching at
the podium retail panel `1 737/1 310 = 1.33` → **fails at h = 420 → h = 600 chosen** (`1 737/2 364 =
0.73`); drift and overturning indices from ST-19/ST-20 show a twin-core separated layout far inside the
limits; base pressure ≈ 300 kPa → raft or piled raft (ST-24). Transfer: none, because the 9.0 m podium
module is exactly two 4.5 m tower bays — the alignment is the structural decision, and ST-21 prices what
happens if someone "improves" the podium grid to 8.4 m.
Sensitivity: +2 guest floors → N_base +1 184 kN (raw) / +873 kN (reduced) ≈ +7%, storey height ×21 →
façade +7.4 m and one more core penetration set; bay 4.5 → 5.0 m → N/storey +38% (592 → 816) and the
200 mm slab becomes 250 mm with 500 mm beams, i.e. ~0.15 m of lost clear ceiling per floor.

## Plausibility checklist

Eight steps (ST-26's order), each with its pass test:
1. **Grid** — bays in whole tiles, on the 1.5 m cell where module families meet (GT-15, ST-16). Pass: no
   fractional-tile span quoted in the rationale.
2. **Use → load** — every space carries a category and a source row (ST-03/04). Pass: no `n/r` row used
   without `NEEDS VERIFICATION`.
3. **Build-up** — `G_k` layer by layer from read densities (ST-02/05). Pass: partitions counted once.
4. **Depth** — slab and beam from Table 7.4N + ST-13 (ST-12/13). Pass: `d`, `h` and each multiplier shown.
5. **Tributary + take-down** — spanning mode, then the cumulative table (ST-07/08/09). Pass: N_base
   published reduced and unreduced.
6. **Capacity** — column area + `N_Ed/VRd,c` per connection (ST-10/11). Pass: ratio ≤ 0.8 or depth/drop/beams changed.
7. **Lateral** — system by height, core size, `Δq/q_avg`, `δ/H`, and the five regularity tests
   (ST-18/19/20/22). Pass: all five ratios printed with their source or their HEURISTIC label.
8. **Foundations + section honesty** — `q_avg`, pad/raft decision, basement grid inheritance, F2F
   subtraction chain (ST-17/23/24). Pass: everything the grid cannot show is flagged `needs-section-review`.
Fallback labels: `ASSUMED(jurisdiction=EN, NA values not applied)`, `ASSUMED(use=type default)`,
`ASSUMED(soil=firm cohesive 479 kPa, order-of-magnitude only)`, `ASSUMED(wind=0.6 kN/m² placeholder)`,
`ASSUMED(F2F=3.4 m guest / 4.2 m podium)`.

## Sources

T1 — codes and official guidance. Only documents whose text was retrieved **and read** are cited for a value.
- **Read:** BS EN 1991-1-1:2002 *Eurocode 1 — Densities, self-weight, imposed loads for buildings*
  (English version, corr. March 2009): §6.3.1.1 Table 6.1; §6.3.1.2 Table 6.2 + Expr. (6.1)/(6.2) +
  subclauses (2)–(11); §6.3.2.1 Table 6.3; §6.3.2.2 Table 6.4; §6.3.3.2 Table 6.8 + Notes; §6.3.4.1
  Table 6.9; §6.3.4.2 Table 6.10; Annex A Table A.1.
- **Read:** BS EN 1990:2002+A1:2005 *Eurocode 0*: Eq. (6.10) with recommended γ (1.35 / Set B 1.15 /
  γQ 1.50) and Table A1.1 ψ factors.
- **Read:** BS EN 1992-1-1:2004 *Eurocode 2*: §3.1.6(1)P Eq. (3.15) + αcc note; §6.4.4(1)–(3) Expr.
  (6.2.a), CRd,c = 0.18/γc, k1 = 0.15, perimeters "within 2d"; §6.4.5 (listed); §6.1 minimum
  eccentricity text; §7.4.2(2) Expr. (7.16a/b), (7.17), Table 7.4N + Notes 1–3.
- **Read:** BS EN 1993-1-1:2005 *Eurocode 3*: §7.2.1, §7.2.2 (deflection limits → EN 1990 Annex A1.4).
- **Read:** New York City Building Code 2008 §1804 / Table 1804.1 — presumptive allowable foundation
  pressures by soil/rock class.
- **Read:** *International Building Code* 2024 as adopted by the DoD Building Code 2024, Ch. 16
  (Table E-1 live loads, psf↔kPa conversion). The ICC origin pages returned 403.
- **Read:** FHWA *Geotechnical Engineering Circular No. 6 — Shallow Foundations* (01-0943, 2001)
  §5.2.7, §5.3, Tables 5-6, 5-7, 5-8, 5-9, 5-10.
- **Attempted, not readable:** The Concrete Centre *Slabs and Flat Slabs* lecture PDF (compressed stream);
  EN 1998-1:2004 (host returned an HTML error page). No value in this file comes from either.
- **Named as the authority to obtain, not read:** EN 1992-1-1 Table 2.4N / national annexes for γc;
  EN 1990 Annex A2.2 and EN 1991-1-4 for wind; EN 1996-1-1 §3.1.3/§6.1.2 and TMS 402 for masonry;
  EN 1995-1-1 §7.2/§7.3 and AWC/Swedish Wood CLT handbooks for timber spans.

T2 — peer-reviewed:
- *Advances in Steel Construction* 12(2), "Optimum position of steel outrigger system for high rise
  composite buildings under lateral wind loadings" — **read**: 28/42/57-storey (98/147/199.5 m) composite
  core models; summary of prior studies (30-storey RC, mid-height outrigger optimum; 40-storey wind and
  60-storey seismic models; 65% belt-truss and 18% outrigger deflection reduction).

T3 — established publications, **named but not read in this pass** (no value taken from them):
SCI P300 *Composite Slabs and Beams Using Steel Decking*; TABULI blue book; AISC *Design Guide 11*;
DFCS *Vibration of Concrete Floors*; SCI P354; AWC/Think Wood *CLT Handbook (US Edition)*; Swedish Wood
*CLT Handbook*; PTI publications and the IJAME 2023 PT comparison already listed in `construction.md`;
Ching & Roundtree *Building Construction Illustrated* 6th ed.; Schumacher & Lange *Structural Details for
Architecture and Design*; Park & Paulay *Reinforced Concrete Design*.

T4/T5 — none. No value in this file comes from forum or anecdotal material.

## Weak or contested

1. **EN 1991-1-1 Table 6.2's underlined NA-selected values are the weakest link here.** The category
   mapping and the range endpoints are read; the *selected* value survived extraction only for Cat E1
   (7.5/7.0), F (range) and H (0.4/1.0). The guest-floor 2.5 kN/m² is therefore "top of the printed Cat A
   range, conservative", not a code value. Fix: read BS EN 1991-1-1 + UK NA Tables NA.2.1–NA.2.5 and
   substitute; until then every hotel figure carries that caveat.
2. **The two jurisdictions reduce loads by different machinery.** EN uses αA (area) and αn (storey count)
   with ψ0; IBC/ASCE use KLL member factors with floors-specific minimums, and parking is its own article.
   They are not interchangeable; this file reduces only with Expr. (6.2) and says so.
3. **γc was not legible in the retrieved EN 1992-1-1 copy.** All capacity arithmetic uses γc = 1.5 (UK
   practice) while the code defers the number to the NA (§2.4.2.4). Using the base-code recommendation
   instead shrinks every column by ~1.5× in demand terms — which is exactly why it must be read, not
   assumed. Same for αcc (0.8–1.0 permitted, 1.0 recommended — read).
4. **The 0.75 concrete capacity index and χ = 0.55–0.75 for steel are invented here.** Labelled
   HEURISTIC, but they set the column sizes in the worked example; replace with a published interaction
   chart or a real check before quoting a size to anyone.
5. **Punching figures are computed instances, not published limits.** They reproduce from EN 1992-1-1
   §6.4.4 at the stated d, u1, ρl = 0.5% and C30/37; the code's unbalanced-moment reduction (§6.4.2,
   not read) lowers the usable capacity by roughly a third, so the ratios printed here (0.45 guest, 1.33
   podium at h=420) should be read as "comfortable / clearly failing", not as pass certificates.
6. **No read source exists yet for floor-to-floor or services-zone build-ups, vibration acceptance
   values, or the drift band.** ST-14's frequency→deflection ladder is algebra, not a comfort criterion;
   ST-17's 300 mm duct zone and ST-20's 1/500–1/1000 band are practice numbers with names attached
   (BSRIA/CIBSE, SCI P354, DFCS, AISC DG11) that must still be opened.
7. **Seismic irregularity thresholds are placeholders.** ST-22's 0.7 / 0.8 / 0.25 / 0.10 / 0.15 cut-offs
   are review triggers until EN 1998-1 §4.2.2 Table 4.2 and §4.2.3.1/4.2.3.2 are read.
8. **Foundation pressures come from one municipality's presumptive table** (NYC BC 2008 Table 1804.1),
   and FHWA GEC-6 §5.2.7 explicitly deprecates presumptive values for design. The tension is reported,
   not smoothed; a non-NYC project must re-read EN 1997-1 + NA / BS 8004 or a site report.
9. **Wind action is a placeholder.** 0.6 kN/m² and the derived 12 kN/m line load are not site values; the
   overturning and drift indices are structurally valid but numerically provisional.
10. **Conflict check with existing constants: no numeric conflict; two clarifications.** SKILL.md's
    "Structural bay" carried constant defers the range to CN-05 and labels it heuristic — unchanged here,
    except that the RC rows now have a derivation (ST-10/ST-12) rather than only a band. GT-15's advice to
    prefer 9.0 m = 18 tiles over 8.4 m = 16.8 tiles is used verbatim, and the coordination-cell constant
    (3 tiles = 1.5 m) is consistent with the 4.5/9.0 m modules. The clarification: CN-06's `aspect ≤ 1.5`
    is a two-way *claim* limit, while this file uses `≥ 2` for one-way *load sharing* — different
    questions, both retained, with 1.5–2.0 requiring the conservative check (ST-07).
11. **Type coverage outside hotel/office/podium is thin.** Hospital and school assembly categories
    (C4/C5), industrial machinery loads (EN 1991-1-1 §6.3.2.3, EN 1991-3) and rack loading are named in
    the tables but not worked; a hospital or logistics deliverable must extend this file, not reuse the
    hotel numbers.

## Type-specificity audit

| Type | What changes in this file | Rules that bend |
|---|---|---|
| Hotel (flagship) | Cat A rooms + C3 corridors in one pour; heavy fixed partitions and wet pods; 4.5 m repeat bay; corridor strip is the vibration problem | ST-05, ST-08, ST-12, ST-14 |
| Residential | Same Cat A loads, lighter partitions; balconies are a separate category and a cantilever depth case | ST-12 (cantilever row), ST-05 |
| Office | Cat B 3.0; 9–12 m spans to keep the plate lettable → vibration and punching bind before bending; raised floors rewrite the build-up | ST-14, ST-10, ST-17 |
| Retail / mixed-use podium | Cat D and E loads on one slab; transfer above the sales floor; car-park Cat F/G below; base-pressure index jumps | ST-21, ST-24, ST-04 |
| Car park | Axle model, not UDL (Table 6.8 + Figure 6.2: two 100/200 mm patches + 1.5–2.5 kN/m²); thicker slabs, shorter spans, more columns, ramps | ST-04, ST-12 |
| Hospital / assembly | Cat C4/C5 (5.0–7.5 visible in Table 6.2) plus fixed equipment; an archive/records wing is E1 7.5 kN/m² in a 3.0 kN/m² building — a mass and stiffness discontinuity | ST-08, ST-22 |
| Industrial / logistics | Long-span steel/truss; rack and crane point loads under EN 1991-3 — outside every RC band derived here | ST-15 (rows marked unread) |
| Timber / low-rise | Spans bounded by stiffness and acoustic mass, not strength; none of the RC numbers transfer | ST-15 (CLT row NEEDS VERIFICATION) |

Cross-references used: CN-01…CN-08, CN-10, CN-12, CN-14, CN-23…CN-25, CN-28 (grid discipline, spans,
cores, transfer, plant, sequencing, wall-zone honesty, façade/frame coordination); MS-01, MS-03, MS-07,
MS-13, MS-14, MS-19, MS-22; GT-03, GT-05, GT-07, GT-10, GT-15, GT-24, GT-25; FP-05, FP-12; CODE-13
(height × area × storey caps, which stop the ST-18 ladder before the structure does); TH-23, PP-24;
`economics.md` (net-to-gross cost of column growth). Division of labour: **CN owns the load-path
judgement, GT owns the tile conversion, MS owns the vertical inheritance, ST owns the arithmetic.**
