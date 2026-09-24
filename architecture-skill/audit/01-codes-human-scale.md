# Audit 01 — adversarial source verification: `research/building-codes.md` + `research/human-scale.md`

Scope: every load-bearing claim (numeric figure, section/clause cite, `verified: yes` stamp) extracted
from the two research files and checked against the cited source itself.
Web fetches used: 14. Fetches that failed are recorded as failures, not smoothed over.

Verdict shorthand: SUPPORTED · PARTIALLY SUPPORTED · INFERRED · UNSUPPORTED · CONTRADICTED · UNVERIFIED.

**Fetch log (what was actually opened):**
1. `lawfilesext.leg.wa.gov/…/WAC 51-54A-1004.htm` — OK (×2, different prompts).
2. `access-board.gov/ada/chapter/ch04/` — OK (×2).
3. `access-board.gov/ada/chapter/ch03/` — OK (×2; first returned only an echo, second good).
4. `up.codes/viewer/new_jersey/ibc-2021/chapter/10/means-of-egress` — OK (partial: §1005.3.1, Table 1006.2.1, §1007.1.1, §1010.1.1/.1.3, §1011.x subsection titles, §1020.1, §1020.3; **Table 1017.2 explicitly absent**).
5. `up.codes/s/egress-based-on-occupant-load-…` — **HTTP 403**.
6. `up.codes/s/limitations` — **HTTP 403**.
7. `usmadesupply.com/…/ibc-chapter-10` — OK but **contains no numeric travel/common-path/dead-end data**.
8. `nipcm.scot.nhs.uk/chapter-4…/print?section=4780` — OK.
9. `nfpa.org/news-blogs-and-articles/blogs/2024-05-22/horizontal-exits-overview` — **HTTP 404 (dead)**.
10. `ncc.abcb.gov.au/editions/ncc-2022/adopted/volume-one/d-access-and-egress/part-d2-provision-escape` — OK.
11. `access-board.gov/ada/chapter/ch02/` — OK but its rendering of Table 224.2 was internally inconsistent.
12. Not attempted (budget): MeltPlan, turnings.co.uk, squote.app, fire-risk-assessment-network, media.nkba.org PDF, NIST tsapps URL, Corada mirrors, local `rooms.ts`.

---

## A. building-codes.md — per-claim verdicts

### BC-01 Occupant-load factors, IBC Table 1004.5 (CODE-01; register row 1, `yes (T1)`)
- SOURCE AS CITED: WA Legislature adopted IBC, WAC 51-54A-1004 — T1.
- WHAT THE SOURCE SAYS: page exists and carries Table 1004.5. Confirmed values: Business **150 gross**; chairs-only **7 net**; tables-and-chairs **15 net**; classroom **20 net**; shops/vocational **50 net**; day care **35 net**; dormitory **50 gross**; kitchen **200 gross**; institutional inpatient **240 gross** / outpatient **100 gross** / sleeping **120 gross**; warehouse **500 gross**; accessory storage **300 gross**. NOT matching the file: **parking garage = 200 gross** (file merges it with accessory storage 300); **mercantile storage/shipping renders as "300/60 gross"** (file lists only 60); **standing space** came back as "5 net" in one read and "15 net" in another → unresolved; **Mall → "see §402.8.2"**, concourse 15 gross (airport) / 100 gross (transit); **residential 200 gross and exhibit hall 30 net were not surfaced**.
- PROBLEM: source-claim mismatch on 2–3 rows (parking/accessory merge, mercantile sub-rows), one value self-contradicting across reads, two values unverifiable.
- STATUS: **PARTIALLY SUPPORTED** · ACTION: **KEEP with corrections** (split parking-garage vs accessory-storage; re-eyeball standing-space factor and residential/exhibit rows against the printed table).
- CLOSES IT: a human read of the WA table (or ICC Ch.10) for the three unmatched rows.

### BC-02 "Table 1004.5 is the one T1-verified IBC table"
- WHAT THE SOURCE SAYS: true — a state government publication of the adopted code text carrying the table; the page states "WAC 51-54A adopts IBC" but the fetch did not surface the literal "2021" edition string.
- PROBLEM: none material; the label should read "WA-adopted IBC (2021-line chapter), amendments unchecked" rather than plain "IBC 2021".
- STATUS: **SUPPORTED** · ACTION: **QUALIFY** (edition/amendment wording).

### BC-03 "assembly of mall concourse uses 100 ft² gross"
- WHAT THE SOURCE SAYS: mall rows point to §402.8.2 (mere concentration of people); **100 gross belongs to the transit concourse row**, 15 gross to airport concourse.
- PROBLEM: source-claim mismatch — figure attributed to the wrong use.
- STATUS: **CONTRADICTED** · ACTION: **REPLACE** ("concourse (transit) 100 gross; mall/mercantile concentration governed by §402.8.2").

### BC-04 Number of exits: 1 ≤49 / 2 = 50–500 / 3 = 501–1000 / 4 >1000 (CODE-02)
- SOURCE AS CITED: up.codes slug (T3) + US Made Supply (T3).
- WHAT THE SOURCE SAYS: the dedicated up.codes page is **403**; US Made Supply Ch.10 has **no numbers**; the NJ Ch.10 viewer surfaced only a fragment of Table 1006.2.1 ("OL ≤ 30 … Without Sprinkler System (feet) 75"), which does not reproduce the 49/500/1000 breakpoints.
- PROBLEM: cannot verify; the one visible fragment suggests a different row structure than the file's tiers.
- STATUS: **UNVERIFIED** · ACTION: **QUALIFY** (must not ship as a validator threshold until a live IBC Ch.10 read).
- CLOSES IT: ICC/adopted-edition Table 1006.2.1 text or a state-adopted mirror (e.g. the WA chapter series for 1006).

### BC-05 Common path of egress 75 ft (CODE-03)
- WHAT THE SOURCE SAYS: Table 1006.2.1 fragment quotes "Without Sprinkler System (feet) **75**" ✓; H-group reduction and sprinkler extension not surfaced.
- PROBLEM: none for the headline number.
- STATUS: **SUPPORTED** · ACTION: **KEEP**.

### BC-06 Egress capacity 0.3 in stair / 0.2 level / 0.15 sprinklered (CODE-04)
- WHAT THE SOURCE SAYS: §1005.3.1 verbatim "…by a means of egress capacity factor of **0.3 inch**…per occupant" ✓. Level-component 0.2 / 0.15 not surfaced.
- PROBLEM: half-verified; §1005.3.2 numbering unconfirmed.
- STATUS: **PARTIALLY SUPPORTED** · ACTION: **KEEP**, confirm 0.2/0.15 against a live table.

### BC-07 "§1005.4: min not less than 32 in at doors / 36 in typical"
- WHAT THE SOURCE SAYS: not retrieved; the only 32 in doorway figure retrieved is §1010.1.1. "36 in typical" appears nowhere.
- PROBLEM: stronger than evidence / invented gloss inside a CODE REQUIREMENT row.
- STATUS: **UNSUPPORTED** · ACTION: **REMOVE** the "36 in typical" clause, re-source the minimum-width clause.

### BC-08 Corridor 44 in / 36 in — cited as "IBC 2021 §1018.2" (CODE-05, register, Sources)
- WHAT THE SOURCE SAYS: values confirmed, **section is not**: the IBC 2021 (NJ-adopted) chapter places corridor width at **§1020.1** — "Corridors shall have a minimum width of 44 inches…or 36 inches for certain occupancies".
- PROBLEM: section-citation error repeated in the rule, the register and the Sources list; the ≥50-occupants phrasing of the 36 in tier is unconfirmed ("certain occupancies").
- STATUS: **PARTIALLY SUPPORTED** · ACTION: **REPLACE cite → §1020.1 (IBC 2021)**, re-check the trigger wording.

### BC-09 Dead ends 20 / 50 / 30 ft — cited as "§1020.5" (CODE-06)
- WHAT THE SOURCE SAYS: "§1020.3: Dead ends…20 feet…50 feet…30 feet…Exception based on corridor length-to-width ratio" — values and the 2.5×-width-style exception **confirmed**, **section number wrong** (§1020.3, not §1020.5).
- PROBLEM: section error; the group list for the 50 ft tier and the "not counted if <2.5× width" phrasing not verbatim.
- STATUS: **PARTIALLY SUPPORTED** · ACTION: **REPLACE cite → §1020.3**, KEEP the 12-tile cap default.

### BC-10 Exit-access travel distance Table 1017.2 (CODE-07; grid 122/183 tiles)
- WHAT THE SOURCE SAYS: the NJ IBC 2021 chapter fetch states explicitly **"Table 1017.2 data not provided in source text"**; the dedicated `up.codes/s/limitations` page is **403**; US Made Supply carries no numbers. The A/E/F1/M/R 200/250, B 200/300, F2/S2/U 300/400, I-1 NP/250, I-2/I-3 NP/200, I-4 150/200 tiers are therefore **entirely unverified this session**, from any source.
- PROBLEM: cannot verify the file's single biggest grid driver; every cited T3 pillar for it is either unreachable or content-free. `partial` is honest but the file presents the tiers as settled numbers.
- STATUS: **UNVERIFIED** · ACTION: **QUALIFY + BLOCK** (must not be encoded as a validator until read from an adopted-edition text).

### BC-11 Exit remoteness ≥½ diagonal, ⅓ sprinklered (CODE-08)
- WHAT THE SOURCE SAYS: §1007.1.1 "…equal to not less than **one-half**…" ✓ (section and value confirmed); the sprinklered one-third was not surfaced.
- STATUS: **PARTIALLY SUPPORTED** · ACTION: **KEEP**, confirm the ⅓ tier.

### BC-12 Stair riser ≤7 in / tread ≥11 in / uniformity ≤3/8 in (CODE-09)
- WHAT THE SOURCE SAYS: chapter structure confirms **§1011.5 = riser/tread** (so §1011.5.2 is a plausible sub-item) but **uniformity is §1011.4**, not the file's §1011.5.4. The 7/11/3-8 values themselves were not surfaced verbatim.
- PROBLEM: one wrong sub-section, values unretrieved.
- STATUS: **PARTIALLY SUPPORTED** · ACTION: **QUALIFY** (fix uniformity cite to §1011.4; re-check values).

### BC-13 Stair width 44 in §1011.2 / headroom 80 in §1011.3 / handrail 34–38 §1012.7 / guard 42 §1015.3
- WHAT THE SOURCE SAYS: IBC 2021 chapter list shows **§1011.2 = Width ✓** and **§1011.3 = Headroom ✓** (the file was right where it hedged), but handrail height is **§1014.8** and guard height **§1015.1** — i.e. in the 2021 edition handrails/guards already sit in 1014/1015, so the file's "moved to 1014/1015 in **2024**" and its "§1012.7 (2021)" / "§1015.3" cites are wrong by an edition and by a subsection.
- PROBLEM: outdated/incorrect section attribution; values (44/36 in, 80 in, 34–38 in, 42 in) unretrieved.
- STATUS: **PARTIALLY SUPPORTED** · ACTION: **REPLACE cites**, fix the Discipline-Box "edition matters" example to "renumbered in 2021".

### BC-14 AD K stair rise/going/pitch/2R+G 550–700 (CODE-09, register)
- SOURCE AS CITED: turnings.co.uk (T3) — not fetched (budget).
- WHAT THE SOURCE SAYS: not opened.
- STATUS: **UNVERIFIED** · ACTION: **KEEP as partial**; do not use for any validator.

### BC-15 Doors: clear 32 in §1010.1.1, opening force 5 lbf §1010.1.3, swing-out ≥50, revolving 10 ft/36 in
- WHAT THE SOURCE SAYS: §1010.1.1 "Minimum clear width of doorways shall be **32 inches**" ✓ and §1010.1.3 "Door opening force…**5 pounds**" ✓ (both section numbers correct). The 15 lbf unlatch / 30 lbf sliding figures, the swing threshold and the revolving-door companion rules were not surfaced.
- PROBLEM: half-verified; CODE-24's "bed-movement 41.5 in (§1010.1.1)" is **not** in what §1010.1.1 returned (only 32 in) — see BC-21.
- STATUS: **PARTIALLY SUPPORTED** · ACTION: **KEEP**, re-source the unverified hardware thresholds.

### BC-16 IBC §1009 area of refuge, two 30×48 in spaces
- WHAT THE SOURCE SAYS: not fetched; the file itself reports the up.codes area-of-refuge page returned ADA text and stamps the row `no`.
- PROBLEM: none — the file's honesty here is accurate.
- STATUS: **UNVERIFIED** · ACTION: **KEEP flagged**.

### BC-17 NFPA 101 horizontal exit: 3 ft²/person, stamped `yes (T1 blog)` (CODE-12, CODE-15)
- WHAT THE SOURCE SAYS: **the cited NFPA URL returns HTTP 404.** No content retrievable; the figure cannot be attributed to anything that exists at that locator.
- PROBLEM: **fabrication-grade signal** — a dead URL carrying a `yes (T1)` stamp and "Confidence: NFPA High"; two rules consume the figure (refuge area at horizontal exits, compartment sizing). Also: an explanatory blog would not be a T1 code text even if it resolved.
- STATUS: **UNVERIFIED** · ACTION: **REMOVE the T1 stamp**; re-cite a live NFPA locator (or downgrade to UNVERIFIED/`no`).

### BC-18 IBC 2024 height/area, Group B (CODE-13)
- SOURCE AS CITED: MeltPlan (T3) — not fetched within budget.
- WHAT THE SOURCE SAYS: not opened. The row's internal arithmetic is sound (9,000 ft² = 836 m² = 3,344 tiles ✓).
- STATUS: **UNVERIFIED** (file already says `partial`) · ACTION: **KEEP as partial**.

### BC-19 Shaft enclosure 2 hr / 4+ stories, 1 hr ≤3 tiers (CODE-14)
- Not fetched; file self-marks the 1-hr tier `no`. STATUS: **UNVERIFIED** · ACTION: **KEEP flagged**.

### BC-20 I-2 smoke compartment 22,500 sf via IBC §407.5.1 (CODE-15/24)
- Not fetched. The figure is NFPA 101 heritage; attributing it to an IBC clause without text is a jurisdiction-of-origin risk. STATUS: **UNVERIFIED** · ACTION: **QUALIFY** (name the instrument you actually read).

### BC-21 Bed-movement door clear width 41.5 in "(§1010.1.1)" (CODE-24)
- WHAT THE SOURCE SAYS: the §1010.1.1 text retrieved contains **only** the 32 in minimum; no 41.5 in provision appeared.
- PROBLEM: figure attributed to a table/cline that, as fetched, does not contain it.
- STATUS: **UNVERIFIED (possible mismatch)** · ACTION: **QUALIFY** — re-source (likely NFPA 101 / FGI / IBC §1010.1.1 exception).

### BC-22 ADA §403.5 route width 36 in / 32 in ≤24 in; "§403.5.1 60 in passing space"; "turning space §305"; "§403.4/§303 changes in level" (CODE-18)
- WHAT THE SOURCE SAYS: §403.5 Clear Width ✓ "…reduced to **32 inches**…for length of **24 inches maximum**…separated by segments **48 inches** long" ✓. Passing spaces are **§403.5.3** (at ≤200 ft intervals), not §403.5.1. Turning space is **§304** (ch.3), not §305. Ch.4 §403 runs 403.1–403.6; §303 "Changes in Level" ✓ carries the ¼ in / ½ in bevel family (values confirmed in ch.3 §303 title, sub-values not surfaced).
- PROBLEM: two sub-section errors + one chapter error inside a row stamped `yes (T1)`/Confidence High (values themselves are right).
- STATUS: **PARTIALLY SUPPORTED** · ACTION: **REPLACE cites** (§403.5/§403.5.1 for width, §403.5.3 passing, §304 turning).

### BC-23 ADA Table 404.2.4.1 maneuvering clearances (CODE-19)
- WHAT THE SOURCE SAYS (T1 ch.4): forward **pull** 60 in perpendicular + **18 in** beyond latch; forward **push** 48 in perpendicular + **0 in**; **hinge-side pull 60 in** + beyond-hinge; **side pull 48 in + 24 in**; **side push 42 in + 24 in**; closer additions appear per-row (+12 pull / +6 push per the fetch's parentheticals).
- The file claims instead: "from front pull **60**; latch-side pull **48**; hinge-side pull **60** (or **54 with closer**); push **42 latch side**" and a register row "pull 60/48/54/42".
- PROBLEM: **row mis-assignment** — the 48 in belongs to forward push, not "latch-side pull"; 42 in is side *push*, not latch-side push; "54 with closer" is not the T1 structure. It also **contradicts human-scale.md HS-06**, which states the same table correctly.
- STATUS: **CONTRADICTED** · ACTION: **REPLACE** with the T1 rows (use HS-06's wording).

### BC-24 ADA ramp §405.2 1:12 / §405.6 30 in / §405.7 60 in / cross 1:48 + "existing 1:8/1:10 (ADA 405.3)" (CODE-20)
- WHAT THE SOURCE SAYS: §405.2 slope ≤1:12 ✓, §405.6 rise ≤30 in ✓, §405.7 landings ≥60 in ✓, cross slope ≤1:48 ✓ — **but cross slope is §405.3**, so the "existing-building 1:8/1:10 for ≤3 in rise (ADA 405.3)" citation points at the cross-slope clause, and no such steeper-ramp exception was found in the 2010 Standards text fetched.
- PROBLEM: mis-attributed exception (that allowance belongs to pedestrian-access-route/legacy guidance, not ADA ch.4).
- STATUS: **PARTIALLY SUPPORTED** · ACTION: **REMOVE** the 1:8/1:10 exception or re-site it with a correct instrument.

### BC-25 ADA reach §308 48/15 in, 44 in over >20 in obstruction (CODE-21)
- WHAT THE SOURCE SAYS: ✓ verbatim — unobstructed forward 48 max / 15 min; obstructed high reach: depth 20 in max at 48 in max, deeper than 20 in → **44 in max**; side reach 48/15.
- PROBLEM: none (the Corada T3 label understates: this is T1-confirmable, and now confirmed).
- STATUS: **SUPPORTED** · ACTION: **KEEP** (tier may be upgraded for the reach values).

### BC-26 ADA Table 224.2 guest-room tiers (CODE-22)
- WHAT THE SOURCE SAYS: the Access Board ch.2 fetch returned an inconsistent condensed version ("51–100: 3 rooms; 101+: 3 + 1 per 100") that does **not** reproduce the file's tier ladder; the file's ladder matches the DOJ-published table as generally reproduced, but it was not confirmed cleanly from T1 in this audit.
- PROBLEM: cannot verify (lossy fetch of a long table) — and this is the figure a hotel mod would automate.
- STATUS: **UNVERIFIED** · ACTION: **QUALIFY** (human read of Table 224.2 before any count validator).

### BC-27 "ADA 2010 §207.3 references IBC" (CODE-12/23)
- WHAT THE SOURCE SAYS: ch.2 shows the IBC reference at **§207.1**, not §207.3.
- PROBLEM: minor cite slip in a CODE REQUIREMENT evidence line.
- STATUS: **PARTIALLY SUPPORTED** · ACTION: **REPLACE cite → §207.1**.

### BC-28 R-1/R sprinkler triggers §903.3.1.x, smoke detection §907 (CODE-25)
- Not fetched (Ch.9 mirror unreachable in budget). STATUS: **UNVERIFIED** · ACTION: **KEEP as partial**.

### BC-29 NCC travel distances + "doorway ≥750 mm", stamped `yes (T1 gov)`
- WHAT THE SOURCE SAYS: the cited NCC 2022 page exists and holds **D2D1–D2D8**; Class 5–9 rooms **20 m** with a **40 m** furthest-travel structure ✓, Class 5/6 ground-floor single exit **30 m** ✓, Class 2/3 expressed as **6 m to exit / 20 m** (the file's "Class 2/3 room ≤20 m" is a paraphrase of a differently-shaped rule) ✓/±; **minimum doorway width surfaced as a ~1000/1980 mm-family figure, not 750 mm**, and no "D2D5" clause number was visible (clause series is D2Dx).
- PROBLEM: partial support + a `yes (T1 gov)` stamp on a 750 mm figure the page does not show; mixed 2019-A1 (D1.6) and 2022 (D2D5) clause numbering inside one row.
- STATUS: **PARTIALLY SUPPORTED** · ACTION: **QUALIFY** — downgrade the 750 mm row to UNVERIFIED, split editions into separate rows.

### BC-30 NCC exit-width aggregate "1 m + 250 mm per 25 over 100", `yes (T1 gov)`
- WHAT THE SOURCE SAYS: not present on the fetched page; the 2019-A1 D1 URL was not fetched.
- PROBLEM: `yes (T1 gov)` unsupported by what was (and wasn't) retrieved; the file's own Weak-or-contested admits the per-person table was never read.
- STATUS: **UNVERIFIED** · ACTION: **REMOVE the `yes` stamp**.

### BC-31 ADB escape travel 12/18/25 · 25/45/60 m (register `partial`)
- Not fetched (fire-risk-assessment-network page); GOV.UK PDF self-admittedly unread.
- STATUS: **UNVERIFIED** · ACTION: **KEEP as partial** (file's own hedge is accurate).

### BC-32 AD M 775/825/threshold 15 mm/route 900-1200/WC 900×1500 (register `partial`)
- Not fetched. Cross-file inconsistency: this file says **AD M 2015 Vol 1**, human-scale says **AD M 2022 Vol 2** for the same family → edition/volume confusion.
- STATUS: **UNVERIFIED** · ACTION: **QUALIFY** and reconcile with human-scale HS-05/HS-12.

### BC-33 NIST "basis for egress provisions" T2 URL
- Not fetched (budget). Used only as a principle citation, no number taken.
- STATUS: **UNVERIFIED** · ACTION: **KEEP** (no numeric dependency).

### BC-34 Independence laundering — the IBC evidence chain
- FINDING: of the 35 rows above, **18 IBC rows rest solely on the up.codes / US Made Supply / MeltPlan / DataDrivenAec T3 family**, all of which are renderings of one paywalled primary. Retrying two of the exact up.codes slugs the file names returned **403**; the US Made Supply Ch.10 page, offered as an independent second source for Ch.10 numbers, **contains none of them**. So the file's apparent multi-source corroboration for Ch.10 is effectively **one rendering plus one content-free page**. Only three primaries are genuinely independent and reachable: the WA adopted-code page (Table 1004.5 + §402.8.2 cross-refs), the Access Board ch.3/ch.4 pages, and the NJ-adopted IBC 2021 Ch.10 viewer (partial). NCC and NIPCM are separate primaries.
- STATUS: **SUPPORTED as a finding** · ACTION: **QUALIFY** the Sources list to state which pages are re-checkable and which 403.

### BC-35 Honesty of the file's own `verified?` column
- FINDING: the `partial` / `no` labels are, with two exceptions, **accurate** (dead-ends, travel table, §1009, high-rise, AD M/B all correctly hedged). The failures are concentrated in the affirmative stamps and in section numbers:
  1. `yes (T1 blog)` NFPA → **dead URL** (BC-17).
  2. Two `yes (T1 gov)` NCC rows → partially unsupported (BC-29/30).
  3. `yes (T1)` ADA rows → values right, **four section/chapter cites wrong** (BC-22/23/27 + CODE-19 vs HS-06 contradiction).
  4. IBC §1018.2 / §1020.5 / §1012.7 / §1015.3 / §1011.5.4 / §405.3-as-existing-ramp → all wrong against the 2021 edition the rows stamp (BC-08/09/12/13/24).
- STATUS: **CONTRADICTED** (as a meta-claim) · ACTION: **QUALIFY** every `yes`, fix the six section numbers.

---

## B. human-scale.md — per-claim verdicts

### HSn-01 §304.3 turning space 60 in circle / T-in-60-square (HS-04, Sources "values verified")
- WHAT THE SOURCE SAYS: ✓ verbatim "60 inches diameter minimum…T-shaped…60 inch square, arms and base 36 inches wide" — the cite (§304.3) and both shapes are right.
- PROBLEM: the *derived* grid arithmetic is wrong: 4×4 tiles = 4.0 m² against a 1.525 m circle (1.83 m²) is **+118 %**, not "31 % more area"; 31 % is the **linear** ratio 2.0/1.525. "over-provides by 0.94 m²" contradicts the file's own HS-24 formula (which yields 2.17 m²).
- STATUS: **PARTIALLY SUPPORTED** (code value SUPPORTED / derived numbers CONTRADICTED) · ACTION: **KEEP value, REPLACE arithmetic**.

### HSn-02 §305.2 clear floor space 30 × 48 in (760 × 1220), §305.3 overlap
- WHAT THE SOURCE SAYS: ✓ "30 inches by 48 inches minimum"; the overlap provision was not surfaced.
- PROBLEM: sub-claim unverified; note the same file's HS-19 states the unit as "**36** × 48 in from ADA §305" (see HSn-25).
- STATUS: **SUPPORTED** (headline) · ACTION: **KEEP**.

### HSn-03 §308 reach ranges incl. 44 in over deeper obstruction (HS-23)
- WHAT THE SOURCE SAYS: ✓ 48 max / 15 min unobstructed forward; obstructed ≤20 in depth → 48 max; deeper → 44 max; side reach 48/15.
- PROBLEM: "seated side reach max 48 in" is not stated as a seated-specific figure on the page → gloss.
- STATUS: **SUPPORTED** · ACTION: **QUALIFY** the seated-side sub-claim.

### HSn-04 §403.5.1 route 36 in, 32 in only ≤24 in separated by ≥48 in (HS-03/HS-21)
- WHAT THE SOURCE SAYS: ✓ verbatim, and the sub-section attribution is correct here (unlike CODE-18's).
- STATUS: **SUPPORTED** · ACTION: **KEEP**.

### HSn-05 §404.2.3 door clear width 32 in measured face-to-stop; 31½ in exception
- WHAT THE SOURCE SAYS: §404.2.3 = "Clear Width" ✓ (chapter subsection list confirms the numbering the file uses). The face-of-door-to-stop measurement at 90° and the 31½ in exception were not surfaced.
- STATUS: **PARTIALLY SUPPORTED** · ACTION: **KEEP**, re-check the exception.

### HSn-06 Table 404.2.4.1 maneuvering clearances — "read this session (values verified)"
- WHAT THE SOURCE SAYS: forward pull **60 in + 18 in** latch ✓; forward push **48 in + 0 in** ✓; hinge-side pull **60 in** + beyond-hinge (file says "24 in" nowhere; the fetch's render gives 36 in for a beyond-hinge column — figure-derived, unreliable); side approach **48 in + 24 in pull / 42 in + 24 in push** — the file's "side approaches need 1220 mm perpendicular with 455–610 mm on the latch side" mixes rows; "add ~305 mm (12 in) with a closer" matches the pull row but not the push row (+6 in per the fetch).
- PROBLEM: core rows verified, peripheral rows conflated; the values are presented in **figures**, which a text fetch cannot resolve reliably. Also **directly contradicts building-codes CODE-19** on the same table.
- STATUS: **PARTIALLY SUPPORTED** · ACTION: **QUALIFY** (keep the two forward rows as verified; restate side rows from the figure; reconcile with CODE-19).

### HSn-07 §404.2.9 interior door opening force 5 lbf / 22 N
- WHAT THE SOURCE SAYS: ✓ verbatim "5 pounds (22.2 N) maximum" at §404.2.9.
- STATUS: **SUPPORTED** · ACTION: **KEEP**.

### HSn-08 §405.2 ramp 1:12 + grid arithmetic (0.5 m rise → 6.0 m = 12 tiles)
- WHAT THE SOURCE SAYS: ✓ 1:12, and the arithmetic checks out.
- STATUS: **SUPPORTED** · ACTION: **KEEP**.

### HSn-09 "ADA §403.2 caps protruding objects at 4 in between 27 and 80 in AFF" (HS-21 + Sources, stamped verified)
- WHAT THE SOURCE SAYS: the ch.4 page has **no protruding-objects provision** in §403 (403.1–403.6 = general/continuous access/slope/cross slope/clear width/…). The quoted rule is **§307 Protruding Objects in ch.3**: "27 inches…not more than 80 inches", "protrude **4 inches** maximum" ✓ values.
- PROBLEM: **wrong chapter and section under a "values verified" stamp**; HS-21's whole IBC/ADA encroachment comparison inherits the bad cite.
- STATUS: **CONTRADICTED** (as cited) / values SUPPORTED elsewhere · ACTION: **REPLACE cite → §307.2 (ch.3), KEEP the 4 in / 27–80 in values**.

### HSn-10 ch.6 sanitary clearances (§604 60 in / 30 in / 16–18 in / 21–24 in, §606, §608, §609)
- Not fetched (budget); the file explicitly states ch.6 "was not re-read this session and stays Medium".
- STATUS: **UNVERIFIED** · ACTION: **KEEP as flagged** (honest).

### HSn-11 accessible WC compartment 2250 × 2250 / ADM "2200 × 2200, 2200 × 1750"
- SOURCE AS CITED: "ADM 2022 Vol 2 sanitary clauses — T1 (by edition, values UNCITED)". No URL, nothing retrieved.
- PROBLEM: the rule states **2250**, the evidence line states **2200** — the file disagrees with itself; and a `T1` label with no locator is tier inflation.
- STATUS: **UNVERIFIED** · ACTION: **QUALIFY** (pick one figure, label the tier "unretrieved primary = UNVERIFIED").

### HSn-12 door clear openings ADM 825/1025/775 mm, DIN 905 mm
- SOURCE AS CITED: ADM "T1 (by edition)", DIN "T1 (by number, no text retrieved)".
- WHAT THE SOURCE SAYS: nothing retrievable — both primaries are paywalled/URL-less here.
- PROBLEM: **tier inflation** (4 of the file's most-used validation numbers carry a T1 label with zero retrieved text).
- STATUS: **UNVERIFIED** · ACTION: **QUALIFY** (downgrade tier, add locators or a T3 mirror).

### HSn-13 ADM 900 mm route / DIN 1500 with 1200 passing / ADA 915 mm (HS-03)
- WHAT THE SOURCE SAYS: the ADA leg is ✓ supported (HSn-04). ADM/DIN legs unretrieved as cited.
- STATUS: **PARTIALLY SUPPORTED** · ACTION: **QUALIFY**.

### HSn-14 NHS/HBN bed spacing 3.6 m centre-to-centre (post-2010 adult in-patient) and 2.45 m day bays (HS-17)
- WHAT THE SOURCE SAYS: the cited NIPCM ch.4 page ✓ states post-2010 adult in-patient facilities require **3.6 m bed centre-to-centre**, attributed to **SHPN 04-01 / HBN 00-03 / SHFN 30**, and day bays **2.45 m** (since 2014, HBN 00-03 Fig. 45). Both numbers in the file are right.
- PROBLEM: the T1 design authority is the **English HBN**, which the file could not read; what was read is **Scottish** IPC guidance *quoting* it, on an undated print page → the design number is one step from its source. The rule's grid arithmetic also contradicts itself: it derives bay pitch from a "**2-tile** bed" while the same rule sets the bed envelope at **3 × 5 tiles** (1.1 m → 1.5 m); with a 3-tile bed, 3.6 m c-c needs a 5-tile gap, not 4, so the "5 tiles between bed edges" conclusion is reached by the wrong arithmetic.
- STATUS: **SUPPORTED (numbers)** / **PARTIALLY SUPPORTED (attribution + derivation)** · ACTION: **KEEP numbers, QUALIFY attribution ("via NIPCM quoting HBN 00-03; HBN body unread"), FIX the bay arithmetic**.

### HSn-15 FGI "32 in (815 mm) between beds"; "jurisdictions differ by a factor of three"
- Not fetched (FGI is paywalled); the file admits recall and still classes the rule CODE REQUIREMENT.
- STATUS: **UNVERIFIED** · ACTION: **QUALIFY** (the "factor of three" also compares a centre-to-centre value to a clear gap; keep the unit warning, drop the ratio).

### HSn-16 NKBA work aisle 42 in / 48 in two cooks / ≥36 in (HS-09)
- Not fetched within budget; the file records two failed binary-PDF attempts at `media.nkba.org/uploads/2022/05/Kitchen-Planning-Guidelines.pdf` and self-flags it (item 4b).
- STATUS: **UNVERIFIED** · ACTION: **KEEP as flagged** (do not use as a validator).

### HSn-17 work-triangle total 4.0–6.0 m, legs 1.2–2.7 m (HS-10)
- Same un-sourced NKBA/Neufert basis; the file itself calls it "folklore" — accurate.
- STATUS: **UNVERIFIED** · ACTION: **KEEP as heuristic only**.

### HSn-18 bed size tables UK/EU/US (HS-16)
- WHAT THE SOURCE SAYS: self-labelled T3/T5 market convention, UNCITED — matches reality; inch→mm conversions in the row check out (38 in = 965, 60 in = 1524, 76 in = 1930 ✓).
- STATUS: **INFERRED (convention, correctly labelled)** · ACTION: **KEEP**.

### HSn-19 stair bands: AD K 155–220 / 220–300 / public ≤150 / ≥300 / 2.0 m headroom; "IBC/ADA give riser 7 in, tread 11 in, width 44 in, headroom 80 in" (HS-20)
- WHAT THE SOURCE SAYS: AD K not fetched. The IBC half is structurally corroborated (Ch.10 viewer shows §1011.5 riser/tread, §1011.2 width, §1011.3 headroom) though the numbers were not surfaced. **ADA §210 does not carry stair geometry** — §210 in ch.2 is scoping (assembly wheelchairs); ADA ch.4 §405 is ramps. Attributing riser/tread/width to "2010 ADA Standards §210/§405" is a wrong-instrument cite. The "AD K 2013 (+2022 amendments)" edition string is also unconfirmed.
- PROBLEM: wrong instrument for the ADA part; edition string asserted without text.
- STATUS: **PARTIALLY SUPPORTED** · ACTION: **REPLACE the ADA cite (drop §210; use IBC §1011 for geometry), QUALIFY AD K edition**.

### HSn-20 anthropometric percentile table (stature 1535/1750/1880, shoulder 390/450/510, etc.)
- WHAT THE SOURCE SAYS: the file states plainly "no measurement table was opened in this session" and marks every row UNCITED. Nothing was retrieved here either.
- PROBLEM: honest labelling, but four *rules* (HS-01/03/13/23) build validators on these bands.
- STATUS: **UNVERIFIED** · ACTION: **QUALIFY** (bands may inform judgement; they must not be hard checks).

### HSn-21 seat widths 0.45–0.6 m, pitch 0.76–1.2 m, C-value ≥50/≥60 mm (HS-14)
- Not retrievable (Ching/Neufert books; "BS 8300-related sightline guidance" is a mis-attribution signal — BS 8300 is access guidance).
- STATUS: **UNVERIFIED** · ACTION: **QUALIFY** + fix the BS 8300 attribution (sightlines belong to Green Guide/BSA-type sources).

### HSn-22 assembly aisles 48 in / 42 in, "Table 1029/1028 series", 0.2 in/person vomitories (HS-15)
- Not fetched; the file marks the values UNCITED yet stamps the source "IBC ch.10 — **T1**".
- PROBLEM: tier inflation (T1 label, zero retrieval, and a self-admitted "I do not have the exact current table values").
- STATUS: **UNVERIFIED** · ACTION: **QUALIFY tier**; the "no seat more than 4 tiles from an aisle" check should not ship.

### HSn-23 EN 527-1 desk 720–760 mm height / ≥0.8 m depth (HS-12)
- Paywalled CEN standard, "T1 by number", no text.
- STATUS: **UNVERIFIED** · ACTION: **REPLACE** with a public source (national workplace regs) or drop the standard number.

### HSn-24 retail aisle ladder 0.9 / 1.2–1.5 / 2.4–3.0 m + 900 mm accessibility floor (HS-18)
- WHAT THE SOURCE SAYS: the ADA floor (36 in/915 mm route) is ✓ supported; the merchandising ladder is Neufert-only, and the file says so (item 5). The "DfT guidance — T1 (UNCITED)" tag is decorative.
- STATUS: **PARTIALLY SUPPORTED** · ACTION: **KEEP as convention**, drop the empty T1 tag.

### HSn-25 trolley/luggage/lift car: "36 × 48 in clear-floor unit from ADA §305", lift car "minimum 1.5 × 1.5 m", IATA 55×40×20 cm
- WHAT THE SOURCE SAYS: §305.2 is **30 × 48 in** ✓ — so the "36 × 48 in (0.9 × 1.2 m)" unit in HS-19 is **wrong against the same chapter the file cites as verified**. No ADA clause was retrieved for the 1.5 × 1.5 m lift car (CODE-23 in the other file admits ADA car dimensions were never fetched); IATA cabin size not fetched.
- PROBLEM: internal contradiction of a "values verified" primary + an uncited dimensional floor.
- STATUS: **CONTRADICTED** (the 36 × 48 figure) · ACTION: **REPLACE with 30 × 48 in / 760 × 1220 mm**; re-source the lift-car minimum.

### HSn-26 host-grid and code-behaviour claims ("verified in code")
- Not re-checked within this audit's budget (would need `src/blueprint-editor/domain/schema/rooms.ts` + the A*/flood-fill code).
- Internally consistent where checkable: 1 tile = 0.5 m, 4 tiles = 1 m², and the two files' area arithmetic agree (22,500 sf → 8,360 tiles; 9,000 sf → 3,344 tiles ✓). Line-number cites (`rooms.ts:9-33`, `:27`, `:29-38`) are the drift risk.
- STATUS: **UNVERIFIED (this pass)** · ACTION: **KEEP**, verify locally against the cited lines before implementing HS-25/26/27.

### HSn-27 percentile-rationale framing + ISO 7250-1 / HFES sources (HS-01/HS-02)
- WHAT THE SOURCE SAYS: the ADA text retrieved contains **no percentile basis statement** — the asymmetry rationale is design reasoning, not a code provision. ISO 7250-1 and the HFES PDF were not opened.
- PROBLEM: inference sitting next to code values; a rule class "DESIGN PRINCIPLE (with CODE REQUIREMENT values attached)" is doing real work.
- STATUS: **INFERRED** · ACTION: **KEEP** (correctly classed) but stop implying the standard prescribes the rationale.

---

## C. Cross-cutting tallies

**Single-source dependency (independence laundering)**
- building-codes: **18 of 35 audited IBC rows** rest only on the ICC-derivative T3 family (up.codes / US Made Supply / MeltPlan / DataDrivenAec). Two of the nine `up.codes/s/` slugs retried here **403**; the US Made Supply Ch.10 page carries **no numeric data**, so a claimed two-source corroboration is one rendering + one empty page.
- Truly independent reachable primaries: **3** (WA adopted-code page, Access Board ch.2/3/4, NCC/ABCB page) + **1 quasi-primary** (NJ IBC 2021 Ch.10 viewer, still an ICC-derived rendering).
- human-scale: **1 page carries the entire healthcare bed-spacing rule** (2 numbers, NIPCM quoting unread HBN 00-03). ADA ch.3/4 primaries do the heavy lifting for ~9 rows and are genuinely reachable.

**Cross-file contradictions (same fact, two answers)**
1. **ADA Table 404.2.4.1** — CODE-19 (pull 48 / hinge 54 with closer / push 42) vs HS-06 (forward pull 60+18, forward push 48+0). T1 supports HS-06.
2. **ADA clear floor space** — HS-07/HS-02 say 30 × 48 in (correct), HS-19 says 36 × 48 in.
3. **Turning space section** — CODE-18 "§305" vs HS-04 "§304.3" (correct).
4. **Passing-space section** — CODE-18 "§403.5.1" vs T1 "§403.5.3".
5. **Approved Document M edition/volume** — AD M 2015 Vol 1 (building-codes) vs AD M 2022 Vol 2 (human-scale), used interchangeably for 775/825/900/1500/2200 mm figures.
6. **Door clear width measurement claim** — human-scale quotes §404.2.3 face-of-door-to-stop; building-codes quotes IBC §1010.1.1 32 in — fine as different codes, but CODE-10's "36 in typical" and HS-05's "31½ in exception" are both unretrieved glosses on the same 32 in rule.
7. **Guest-room and refuge figures flow into the same hotel validators** while both rest on partially-failed T1 stamps.

**Fabrication signals found**
- 1 dead URL carrying a `yes (T1)` stamp (NFPA horizontal-exit blog → 404) used by 2 rules.
- 0 invented section numbers detected *outright*, but **6 wrong section/sub-section attributions against the very edition stamped** (IBC §1018.2→§1020.1; §1020.5→§1020.3; §1011.5.4→§1011.4; §1012.7/§1015.3→§1014.8/§1015.1; ADA §403.2→§307.2; ADA §207.3→§207.1) and **1 wrong instrument** (ADA §210 for stair geometry).
- 0 figures attributed to a table that provably lacks them **except**: 41.5 in to §1010.1.1 and 750 mm to the NCC D2 page (both not present as retrieved).
- Tier inflation: **URL-less "T1 by number/edition" labels** for ADM, AD K, DIN 18040, BS 8300, ISO 7250-1, EN 527, FGI, NKBA, IBC ch.10, NFPA 101 — i.e. 10 named "T1" sources with nothing retrieved (human-scale Sources list) plus NCC 2019-A1 aggregate (building-codes).

**Arithmetic verified in this pass (no source needed)**
- ✓ correct: 44 in = 2.24 tiles; 36 in = 1.83; 60 in = 3.05; 20 ft = 6.1 m = 12.2 tiles; 75 ft = 22.9 m = 46 tiles; 200 ft = 61 m = 122 tiles; 22,500 sf = 2,090 m² = 8,360 tiles; 150 ft² ≈ 13.9 m² ≈ 55.8 tiles; 30 in rise at 1:12 = 3.75 m; 0.5 m at 1:12 = 6.0 m = 12 tiles; bed/aisle tile roundings in HS-16/HS-09; HS-24's own worked example (+0.43 m²).
- ✗ wrong: HS-04 "31 % more area" (true figure ≈ +118 % vs the 60 in circle; 31 % is the *linear* ratio) and "over-provides 0.94 m²"; HS-07 "60 × 60 in shower → over-provides 1.16 m²" (own formula gives 1.67); HS-16 register "US queen +1.0 m² quantisation loss" (formula gives +1.91 m²); HS-17 bay pitch derived from a 2-tile bed while the rule sets a 3-tile bed.

---

## D. Totals

**building-codes.md (35 audited claims)**
| Status | n |
| --- | --- |
| SUPPORTED | 4 |
| PARTIALLY SUPPORTED | 12 |
| INFERRED | 0 |
| UNSUPPORTED | 1 |
| CONTRADICTED | 3 |
| UNVERIFIED | 15 |

**human-scale.md (27 audited claims)**
| Status | n |
| --- | --- |
| SUPPORTED | 6 |
| PARTIALLY SUPPORTED | 6 |
| INFERRED | 2 |
| UNSUPPORTED | 0 |
| CONTRADICTED | 2 |
| UNVERIFIED | 11 |

---

## E. The 5 claims most dangerous to trust

1. **NFPA 101 horizontal exit 3 ft²/person, `yes (T1 blog)`** — cited URL is **404**; CODE-12 (refuge area) and CODE-15 (compartment sizing) both consume it and the register asserts "Confidence: NFPA High".
2. **IBC Table 1017.2 travel-distance tiers (200/250, 200/300, 300/400, NP/200)** — the largest grid driver (122/183 tiles); no reachable source confirmed any row (up.codes 403, US Made Supply has no numbers, Ch.10 viewer omits the table).
3. **IBC exit-count breakpoints 49 / 500 / 1,000 (Table 1006.2.1)** — unverified, and the fragment retrieved is structured differently ("OL ≤ 30 … 75"); a validator built on it could pass/fail floors wrongly.
4. **ADA maneuvering clearances** — the two research files state **different values for the same ADA table**; CODE-19's assignment contradicts the T1 text (HS-06's does not). A door-clearance check inherits whichever the implementer reads first.
5. **NCC `yes (T1 gov)` rows (travel tiers + 750 mm doorway + 1 m + 250 mm/25 aggregate)** — the cited page confirms the 20 m / 40 m / 30 m tiers but not the 750 mm doorway and not the aggregate formula, while the row mixes NCC 2022 and 2019-A1 clause numbering; AU-flavoured output from this file would be presenting unread numbers as government-verified.

Runner-up risks: ADA §403.2-vs-§307 protruding-objects cite (HS-21), the 36 × 48 in clear-floor error (HS-19), the four wrong IBC 2021 section numbers used in evidence lines, and the quantisation percentages (HS-04/07/16) that contradict the file's own HS-24 formula.

---

## F. Is each file safe as a foundation for implementation decisions?

**building-codes.md — NO, not as currently stamped; YES as a principles layer.**
The 10 universal *mechanisms* (load → exits → path → capacity → protect the route → accessibility → refuge → compartmentalise → floors-not-targets → round-up) hold up and the file's conservative defaults (design to 44 in, round up, flag-instead-of-fake) are sound engineering. What is not safe: (a) its affirmative `yes (T1)` stamps — one is a dead URL and three rest on pages that do not contain the figures; (b) its **section numbers**, which are wrong in six places against the very edition stamped, so any "cite-on-error" message the skill emits would mislead a reviewer; (c) Tables 1006.2.1 and 1017.2, which are unverified and must not become validators. Required before use as a validator spec: correct the six cites; re-read Table 1004.5 (parking/mercantile/standing-space rows) and Table 224.2 in print; find a live NFPA locator or drop the figure; read an adopted-edition Ch.10 (ICC or a state PDF) for §1005.3.2, §1006.2.1, §1010.1.2/.1.4, §1017.2, §1009; split the NCC rows by edition.

**human-scale.md — YES for the ADA-derived checks, NO for the metric/paywalled tier and the derived percentages.**
Everything anchored on Access Board ch.3/ch.4 — route width, turning space, clear floor space, reach ranges, door clear width, opening force, ramp slope/rise/landings, the two forward maneuvering rows — survived a re-read and is safe to encode (with the §307 vs §403.2 cite fix and the 30 × 48 vs 36 × 48 correction). The **NHS 3.6 m / 2.45 m bed figures also survived**, but one step from their source (NIPCM quoting unread HBN 00-03) and reached by inconsistent grid arithmetic. What is not safe: the URL-less "T1" labels on ADM / AD K / DIN / BS 8300 / ISO / EN 527 / FGI / NKBA / IBC / NFPA (10 sources, nothing retrieved), the recalled percentile table, the C-value bands, the assembly-aisle numbers, and every over-provision percentage, which are area claims computed as linear ratios. Practical rule for the skill: encode checks only from the ADA set + the file's own arithmetic; treat every ADM/DIN/EN/NKBA/FGI figure as advisory metadata with an explicit "primary not retrieved" string.

**Common defect worth naming:** both files are honest about what they could *not* verify and unreliable about what they claim they *did*. `partial`/`no`/`UNCITED` labels matched reality in ~30 of 35 building-codes rows and ~11 of 27 human-scale rows; the failures cluster entirely in affirmative `yes`/`T1` stamps and in section numbers — the two things a downstream reviewer trusts most.
