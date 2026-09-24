# Building codes & life-safety standards — research for the tile-grid design skill

Domain: **building codes / means of egress / life safety / accessibility**. This file is
primary research feeding a `SKILL.md` that an AI agent loads BEFORE it lays out a building
on the host grid. It is written for a design agent, not a code official: the goal is to give
(a) the *principles that recur across every jurisdiction*, (b) a *numbers register* with the
source / section / edition / jurisdiction stamped on each figure, and (c) an honest protocol
for **flagging instead of faking** when a number cannot be verified.

Read the **discipline box** before using any number below.

> ## DISCIPLINE BOX — how to read every figure in this file
> - **Codes set FLOORS, not targets.** Almost every number here is a *minimum permitted* or a
>   *maximum permitted travel distance* — a legal floor/ceiling, not a design goal. Meeting it
>   is the point at which review starts, not ends. See `CODE-27`.
> - **`verified?` is per-number, not per-code.** The ICC free code-text pages
>   (`codes.iccsafe.org`) returned **HTTP 403** to the research fetcher this session, so most
>   IBC figures below were read from **T3 renderings** of the IBC text (up.codes, US Made
>   Supply, MeltPlan, DataDrivenAEC) and are marked `partial` — treat them as *directionally
>   correct, confirm against the adopted local edition before relying on them*. The one IBC
>   table read from a government adopted-code publication is Table 1004.5 (Washington State
>   Legislature, WAC 51-54A-1004) — and on a re-read that page **disagreed with four of this
>   file's sub-rows** (see `CODE-01`), so even that table is not "fully verified". The page
>   states "WAC 51-54A adopts IBC" but never surfaced the literal "2021" string, so the label
>   is *WA-adopted IBC (2021-line chapter), amendments unchecked* — not "IBC 2021".
> - **Linear vs area: never quote an over-provision without naming its basis.** A rounding-up
>   gain on a width is a **linear** ratio; the same gain on a floor area or a clear-floor space
>   is an **area** ratio, and the two differ by the square. Every percentage or multiple in
>   this file now carries its basis label (`linear` / `area` / `count`). Where a figure's basis
>   could not be established, it is marked `basis: UNKNOWN (verify)` rather than asserted.
> - **`UNCITED` = do not present as a code requirement.** Any figure tagged
>   `UNCITED — verify against the applicable code edition` is a recollection, a design
>   convention, or an inference. Confidence Low. It may be *wrong for your jurisdiction*.
> - **Edition matters.** IBC 2018 → 2021 → 2024 renumber sections and change values. **Correction
>   from the audit re-read:** handrails and guards already sit in the **1014 / 1015** range in the
>   IBC 2021 chapter listing that was read — this file's earlier claim that they "moved to
>   1014/1015 in **2024**" (and its §1012.7 / §1015.3 cites) was wrong by an edition *and* by a
>   subsection. Always state the edition. A number from IBC 2024 is not automatically IBC 2018 law.
> - **The grid cannot represent sub-tile widths.** 1 tile = 0.5 m. Most clear-width minimums
>   fall *between* tile counts (44 in = 1.118 m = 2.24 tiles). The rounding policy in the
>   shared spec is mandatory: **round clear widths UP, never below the code minimum.** See
>   `CODE-27`.
> - **The host sim carries no egress traffic on stairs** (stairs are decorative; vertical
>   movement is the lift portal with a 30 s queue). Any rule that depends on people walking
>   *down* stairs to escape (exit stair capacity, stair remoteness, "continuous egress down")
>   is **not simulable** here. Where this bites, it is called out in *Grid translation* as a
>   representation gap, not silently ignored.

---

## Jurisdiction map (what varies)

| Principle | Varies how | Example jurisdictions / systems |
| --- | --- | --- |
| Occupancy classification drives everything | Same *logic*, different labels. IBC uses Groups A–U; NCC uses Classes 1–10 (sub-classes a/b/c); EU states use their own; NFPA 101 uses "occupant loads" per chapter. | IBC/NFPA (US), NCC (AU), national EN-transpositions (EU), BSL (JP), Fire Code (SG) |
| Occupant load factor (area/person) | Values are broadly similar for common uses but not identical; some use gross vs net area differently. | IBC Table 1004.5 vs NCC Table D1.13 vs ADB vs EN |
| Number of exits by occupant load | Thresholds differ (1→2→3→4 break points). IBC **reported as** 1 / 2 (50–500) / 3 (501–1000) / 4 (>1000) — **UNVERIFIED, `CODE-02`; not a validator input.** NCC uses "2 exits unless…" tables. ADB uses "more than one escape route" triggers by occupants & storeys. | IBC, NCC, ADB |
| Common-path-of-travel limit | IBC ~75 ft (reduced for H, extended w/ sprinklers) — number read, **clause is the corridors article, not Table 1006.2.1; `section: UNKNOWN (verify)`**. NFPA 101 ~75 ft (not retrieved). ADB benchmarks single-direction vs multi-direction. | IBC vs NFPA 101 vs ADB vs NCC |
| Egress capacity factor (width/person) | **IBC/NFPA in inches per occupant; NCC/ADB in mm per person.** Stair vs level differ. A code that measures "per occupant" cannot be applied to a room with no occupant load. | IBC (in/occupant) vs NCC (mm/person) |
| Exit access travel distance | Same principle, very different numbers and metric/imperial split; sprinkler extension rules differ. | IBC 200–300 ft vs ADB 12–45 m vs NCC 20–40 m |
| Dead-end / "no escape route" limit | IBC "dead ends" (20/50 ft); NCC "only one direction of travel"; ADB "single direction of escape". Same concept, different wording/values. | all |
| Corridor / route width | IBC 44 in (≥50 occ) / 36 in (<50). NCC ~750–1000 mm. ADB ~750–1000 mm. ADA/AM "clear width 36 in". | all |
| Stair geometry | IBC riser ≤7 in / tread ≥11 in. ADB/K: rise ≤220 / going ≥220 / pitch ≤38°. EN 81 / BSL differ. Convergence is close but not equal. | all |
| Door swing / clear width in egress | IBC clear 32 in min, swing-out above thresholds; ADA 32 in clear (36 in route). NCC/ADB differ on mm. | all |
| Fire-resistance ratings, shafts, compartments | Test standards differ (ASTM E119 / UL vs BS 476 / EN 13501 vs AS 1530.4); hourly ratings roughly align but assemblies are not interchangeable. | all |
| Accessible route / reach / ramps / guest ratio | ADA/2010 Standards (US), Approved Doc M / BS 8300 (UK), EN 301 549 / national (EU), NCC Part D3+AS 1428 (AU). | all |
| Refuge for severe mobility disability | IBC "area of refuge" + NFPA 101 "horizontal exit"/place of refuge; many jurisdictions forbid stairs as accessible egress and rely on elevators/refuges. | IBC/NFPA vs elsewhere |
| High-rise package | IBC §403 (stair pressurisation/smoke-proof, standpipes, fire pump, refuge floors). ADB ≥18 m "high-rise"-like regime (post-Grenfell). Singapore/Japan have own trigger heights. | all |
| Healthcare | US: IBC I-2 + **CMS adopts NFPA 101** as condition of participation; FGI Guidelines for room clearances. Elsewhere: national HTM/health-dept guidance. | US-centric |

> **EU / Singapore (SCDF Fire Code) / Japan (Building Standard Law)**: I could not reach an
> English-language primary text with usable figures this session. They are listed here as
> *known regimes that vary by the above principles*. Any specific number you would attribute
> to them is **UNCITED — verify against the applicable code edition.** Do not present EU/SG/JP
> figures as fact from this file.

---

## Universal life-safety principles
What recurs across IBC / NFPA 101 / ADB / NCC and can be treated as near-design-law:

1. **Egress is continuous and unobstructed from any occupied point to a public way** — "exit
   access → exit → exit discharge", with no reversal back into the hazard.
2. **Two ways out, remote from each other**, once occupancy or path length exceeds a floor —
   so a single fire cannot cut off both. (Number of exits ← occupant load; remoteness ← diagonal.)
3. **Limit how far anyone walks before reaching safety**, and **how many share one path**
   (travel distance + common path + dead-end limits).
4. **Capacity scales with headcount**: width per occupant, with **stairs rated more
   conservatively than level components** (crush risk on descent).
5. **Protect vertical escape routes from the fire they serve**: enclosure ratings, self-closing
   doors, pressurisation/smoke-proof stairs in tall buildings, shaft enclosures.
6. **Compartmentalise**: smoke barriers / horizontal exits / places of refuge let occupants
   move to adjacent safety rather than all the way out — the backbone of defend-in-place care
   (hospitals) and tall buildings.
7. **Bound total size by height × area × stories as a function of construction type**: the more
   combustible the structure, the smaller each fire area and the fewer storeys.
8. **Detect, alert, and (in high-risk occupancies) suppress**; sprinklers *buy distance/area*
   in exchange for active protection — they relax travel distance & capacity, they don't
   remove the need for exits.
9. **Reachability is a life-safety duty**: an accessible route must run continuously to
   entrances, and people with severe mobility disabilities must have a defended refuge, not a
   stair they cannot use.
10. **Codes are floors.** Life-safety compliance is the *minimum acceptable*, not the target.

---

## Rules

### CODE-01 Compute occupant load from area-per-person BEFORE sizing any egress
- Rule: For every room/space, divide its occupable floor area by the occupancy-specific area-per-person factor to get occupant load; use that headcount (not the number of chairs/people you drew) as the input to every other rule here. Corridors take load from the rooms they serve; stack/mezzanine loads add to the floor.
- Evidence: IBC Table 1004.5 as published in the WA-adopted code (T1 page, read this session). Factors (ft²/person): Business 150 gross; Assembly chairs-only 7 net / tables-and-chairs 15 net; Classroom 20 net; Shop/vocational 50 net; Day care 35 net; Dormitory 50 gross; Commercial kitchen 200 gross; Institutional inpatient-treatment 240 gross / outpatient 100 / sleeping 120; Warehouse 500 gross. **Re-read of the same page did NOT match the rest of this file's list — do not treat these four as verified:** Assembly **standing space** (this file said 5 net; two reads of the page returned "5 net" and "15 net" — **unresolved**); **Exhibit hall 30 net** and **Residential 200 gross** (not surfaced on the page at all); **Mercantile** renders on the page as "**300 / 60 gross**" (this file listed only 60); **Parking garage is 200 gross and accessory storage is 300 gross** — this file wrongly merged them into one 300 row. Mall rows point to **§402.8.2** (mere concentration of people), not to a table factor; **100 gross is the TRANSIT concourse**, 15 gross the airport concourse. **Helper for the grid:** occupants = walkable_tiles × 0.25 m² ÷ factor(m²/person); 150 ft² ≈ 13.9 m² ≈ 55.8 tiles/occupant (business, **area** basis); 15 ft² ≈ 1.39 m² ≈ 5.6 tiles (seated assembly, **area** basis).
- Source: WA Legislature adopted IBC — https://lawfilesext.leg.wa.gov/Law/WAC/WAC%20%2051%20%20TITLE/WAC%20%2051%20-%2054A%20CHAPTER/WAC%20%2051%20-%2054A-1004.htm — **T1** — jurisdiction US (model IBC) — edition **WA-adopted IBC, 2021-line chapter; amendments unchecked** (the page says "WAC 51-54A adopts IBC" but never surfaced the literal "2021").
- Class: CODE REQUIREMENT
- Scope: universal
- Confidence: Medium-High for the factors that matched on re-read; **Low for standing-space, exhibit-hall, residential, and for both concourse/mall attributions**. The *gross vs net* nuance Medium.
- Grid translation: Tag each room with a function; look up its factor; emit `occupant_load = ceil(area_tiles × 0.25 / factor_m2)` and write it into the room record. Validation check: any space whose occupant load you inferred from seat count alone is a bug — recompute from area unless the use has fixed seating (then IBC 1004.6).
- Exceptions / failure mode: Fixed-seating assembly uses seat count, not area. High-density uses (nightclubs, queues) understate real load. Symptom of getting it wrong: egress you "sized to the people drawn" that fails a headcount review.

### CODE-02 Derive the number of exits from occupant load, not convenience
- Rule: Any space/story whose occupant load (or common path / travel distance, `CODE-03/07`) exceeds the table value must have one more exit/exit-access doorway. Do not let a floor have fewer independently-usable exits than its load demands.
- Evidence: **UNVERIFIED AS TO THRESHOLDS — do not encode as a validator.** This file's tiers (1 exit up to 49; **2** for 50–500; **3** for 501–1,000; **4** above 1,000, IBC 2021 Table 1006.2.1 + 1006.2.1.1) were **not found at any source reached**: the dedicated up.codes page returned **HTTP 403**, the US Made Supply Ch.10 page contains **no numbers at all**, and the only fragment the NJ-adopted IBC 2021 Ch.10 viewer showed of Table 1006.2.1 reads "**OL ≤ 30 … Without Sprinkler System (feet) 75**" — a differently-structured table that does not reproduce a 49 / 500 / 1,000 breakpoint ladder. §1006.3 single-exit exceptions likewise unverified. NCC 2022 Part D2 "at least one exit from each storey; not less than 2 exits" for many Class 2–8 conditions — the D2 page was reached and supports the *two-exits* logic, not the count tiers. ADB: "more than one escape route" triggered by occupants/storeys (uncited).
- Source: up.codes IBC mirror — https://up.codes/s/egress-based-on-occupant-load-and-common-path-of-egress-travel-distance (**T3 — HTTP 403 to the re-read pass, content not obtained**) + US Made Supply Ch.10 — https://usmadesupply.com/resources/building-codes-standards/emergency-life-safety/ibc-chapter-10 (**T3 — reachable but carries no numeric data**) + NCC abcab.gov.au D2 (T1 gov). Jurisdictions US / AU. **CLOSES IT:** ICC or a state-adopted Table 1006.2.1 text (e.g. the WA chapter series for Ch.10).
- Class: CODE REQUIREMENT
- Scope: universal
- Confidence: **Low for the numeric breakpoints** (mechanism solid, numbers unverified). `verified? = no (not found at the cited source)`.
- Grid translation: Count door-runs that reach a *different* safe place; if that count < required exits for the floor's occupant load, raise a **compliance issue** naming the count and the load. Remember: exits must be *remote* (`CODE-08`), so two doors on the same wall may still count as effectively one path. **BLOCKER flag:** until Table 1006.2.1 is read from an adopted-edition text, emit "required exit count: UNKNOWN (verify)" instead of a tier lookup — a wrong breakpoint silently passes or fails whole floors.
- Exceptions / failure mode: A single-exit building exists (§1006.3.4) but is conditional (area, occupancy, sprinklers, below-grade). Symptom of error: one wide doorway credited as two exits.

### CODE-03 Bound the common path of egress (the shared leg before everyone splits)
- Rule: Limit how far occupants can travel *before* they have two directions to choose from. Common path is measured from the most remote point to where the path splits.
- Evidence: **75 ft (≈22.9 m ≈ 46 tiles)** as a common-path-of-egress-travel limit — the number is supported, **the clause locator is not**. This file cited "IBC 2021 Table 1006.2.1" for it, which is **wrong**: Table 1006.2.1 is the **exit-count / egress-capacity** table (it does surface a "Without Sprinkler System (feet) **75**" cell, which is where this file's 75 came from, but that is not the common-path article). In the IBC 2021 edition actually read, **common path of egress travel is governed by the corridors article — `section: UNKNOWN (verify)`, §1020.2/§1020.3 family** (the same article that carries corridor width and dead ends). The H-group reduction and the sprinklered extension were **not surfaced** on any page reached. NFPA 101's "75 ft common-path trigger" was **not retrieved** (NFPA 101 is paywalled).
- Source: up.codes (T3, IBC 2021 mirror) — https://up.codes/s/egress-based-on-occupant-load-and-common-path-of-egress-travel-distance — **HTTP 403 to the re-read pass**; the 75 ft cell came from the NJ-adopted IBC 2021 Ch.10 viewer — https://up.codes/viewer/new_jersey/ibc-2021/chapter/10/means-of-egress (T3 rendering of the paywalled ICC primary). US — 2021-line edition. `partial (T3 mirror; primary not readable this pass)`.
- Class: CODE REQUIREMENT
- Scope: universal
- Confidence: Medium for the 75 ft order of magnitude; **Low for the clause cite, the H-group reduction and the sprinklered extension**.
- Grid translation: A* from each tile to exit A and to exit B; the common path is the shared prefix. If its length (in tiles × 0.5 m) > limit, issue. A 1-tile corridor is strict single-file — it *forces* long common paths; treat single-tile spines as a red flag.
- Exceptions / failure mode: Dead-end vs common path are different tests (`CODE-06`) — a layout can pass one and fail the other. Symptom: a pretty tree corridor that is one long shared leg to a single stair.

### CODE-04 Size egress width per occupant; stairs are stricter than level
- Rule: Required width = occupant load × capacity factor (width per occupant), summed per component; **stair components use a larger factor than level components/doors** because descent crowds. Enforce both the *computed* width and an absolute *minimum* width.
- Evidence: IBC **§1005.3.1 stairs 0.3 in/occupant** (7.6 mm) — **read verbatim** from the NJ-adopted IBC 2021 Ch.10 viewer (T3 rendering). Everything else in this row is **not found at the cited source**: the **0.2 in** sprinklered-stair figure, **§1005.3.2** doors/level **0.2 in** (5.1 mm) and **0.15 in** (3.8 mm) were **not surfaced**, and the §1005.3.2 numbering itself is unconfirmed. **DELETED FROM THIS ROW, do not restore:** "§1005.4: … **36 in typical**" — that phrase appears in no source retrieved, and §1005.4's minimum-width text was not retrieved at all. The only 32-in doorway minimum actually read anywhere is **§1010.1.1** ("Minimum clear width of doorways shall be 32 inches"), so cite that for the absolute minimum and write `§1005.4: section: UNKNOWN (verify)` for an egress-sizing floor. NFPA 101's "same 0.2 level / 0.3 stair logic" — not retrieved (paywalled). NCC uses mm/person on the level vs stairs (**UNCITED** exact mm — verify the adopted NCC capacity table, formerly numbered D1.13). **Grid:** 0.2 in × 100 occupants = 20 in → but absolute min 32 in door; on the grid a door "run" of 2 tiles = 1.0 m nominal, 3 tiles = 1.5 m.
- Source: up.codes §1005 (T3, IBC 2021 mirror) — https://up.codes/s/means-of-egress-sizing (**dedicated slug not reached; the 0.3 in line came from the NJ Ch.10 viewer**) — US — 2021-line. `partial (T3 mirror; primary not readable this pass)`.
- Class: CODE REQUIREMENT
- Scope: the duty (width = occupant load × per-occupant factor, stairs stricter than level) recurs across regimes; the factors are jurisdictional — 0.3 in/occupant is IBC 2021 §1005.3.1 as read from a T3 rendering of a US adoption, not a universal constant
- Confidence: Medium (0.3 in/occupant stair factor); **Low** (0.2 / 0.15 tiers, §1005.3.2 and §1005.4 numbering).
- Grid translation: width_tiles = ceil(required_width_mm / 500). Never round down. Validation check: sum of the two remote exits' door-runs ≥ computed capacity, AND each ≥ absolute-min run (a 1-tile/0.5 m door is below any 32–44 in minimum → not an egress door).
- Exceptions / failure mode: Capacity width and *clear* width and *nominal* run are three different numbers — tile runs overstate clear width (leaf, frame, handrail projection). Symptom: a 2-tile "door" credited as 44 in clear when the opening leaves ~32 in.

### CODE-05 Respect corridor width minimums
- Rule: Corridors that are exit access have an absolute width floor regardless of computed capacity.
- Evidence: corridor minimum width **44 in (1118 mm)** / **36 in (914 mm)** — **values confirmed**, **clause number in this file was not**: the IBC 2021 (NJ-adopted) chapter places corridor width at **§1020.1** — "Corridors shall have a minimum width of 44 inches…or 36 inches for certain occupancies". This file's **§1018.2 cite does not match the edition it stamped** and is replaced. The **trigger wording is still unverified**: the page says "certain occupancies", not the "≥50 occupants / <50 occupants" phrasing this file uses (keep the 50-occupant reading as the *conservative design assumption*, label it as such). **Grid (linear basis):** 44 in = 2.24 tiles → must be **3 tiles (1.5 m)**; 36 in = 1.83 tiles → **2 tiles (1.0 m)** is acceptable for the 36 in case (≥914 mm) but NOT for the 44 in case. Rounding 44 in up to 1.5 m over-provides **+118 mm linear** (+34% linear, **+79% area** — the two are not interchangeable; quote the one you mean).
- Source: **superseded cite:** up.codes §1018.2 (T3) — https://up.codes/s/corridor-width — **not reached on the re-read pass**. **Actual read:** up.codes NJ-adopted IBC 2021 Ch.10 viewer §1020.1 (T3 rendering of a paywalled ICC primary) — US — 2021-line. `partial (T3 mirror; primary not readable this pass)`.
- Class: CODE REQUIREMENT
- Scope: universal
- Confidence: Medium-High on the two widths, **Low on the clause number's edition-stability and on the served-load trigger**.
- Grid translation: exit-access corridors get 3 tiles by default; drop to 2 tiles only where you can show served load <50 AND the local minimum is the 36 in tier. Never a 1-tile "corridor" as exit access (single file).
- Exceptions / failure mode: Sprinklers don't relax corridor *width*; obstructions (handrails, doors swinging into the corridor) reduce *clear* width — measure clear, not wall-to-wall. Symptom: 2-tile corridor serving a 120-person floor.

### CODE-06 Cap dead-end corridors
- Rule: A corridor that offers only one way out has its own tighter limit than travel distance — bound how deep that "no second way out" leg can go.
- Evidence: IBC 2021 **§1020.3** (this file cited **§1020.5**, which is wrong against the edition stamped) — dead-end limits read from the NJ-adopted Ch.10 viewer: "**Dead ends…20 feet…50 feet…30 feet**" with an exception keyed to a corridor length-to-width ratio. The **occupancy list attached to the 50 ft tier** (B/E/F/I-1/M/R-1/R-2/S/U) and the exact "**not counted if corridor length <2.5× its width**" phrasing were **not verbatim** — treat both as `partial`. **Grid (linear basis):** 20 ft = 6.1 m ≈ 12.2 tiles → cap at **12 tiles** as the safe conservative integer.
- Source: up.codes §1020.3, NJ-adopted IBC 2021 Ch.10 viewer (T3) — https://up.codes/viewer/new_jersey/ibc-2021/chapter/10/means-of-egress ; **superseded cite** https://up.codes/s/dead-ends — US — 2021-line. `partial (T3 mirror; primary not readable this pass)`.
- Class: CODE REQUIREMENT
- Scope: universal
- Confidence: Medium-High (20/50/30 ft tiers read); Low (occupancy list, 2.5×-width exception wording).
- Grid translation: BFS from every tile; if a tile's route to a *second independent* exit must backtrack past a junction, that backtrack is the dead end. Flag tiles whose dead-end length > 12 (unsprinklered default). ADB/other jurisdictions measure "single direction of escape" — same idea, different number.
- Exceptions / failure mode: Dead ends hide in branches of atria balconies and in lift-lobby spurs. Symptom: an appealing cul-de-sac wing with no second stair.

### CODE-07 Bound exit-access travel distance; sprinklers extend it
- Rule: Cap the total walk from any occupied point to an exit. Sprinklers let you *extend* the cap (they don't remove it). Height, occupancy, and whether the point is below grade change the number.
- Evidence: **THE ENTIRE TABLE BELOW IS UNVERIFIED — it is retained for the mechanism, not as data.** This file's IBC 2021 Table 1017.2 tiers (**A, E, F-1, M, R, S-1 = 200 / 250**; **B = 200 / 300**; **F-2, S-2, U = 300 / 400**; **I-1 = NP / 250**; **I-2, I-3 = NP / 200**; **I-4 = 150 / 200**; H by hazard) could **not be substantiated at any source reached**: the NJ-adopted Ch.10 viewer states explicitly "**Table 1017.2 data not provided in source text**", the dedicated up.codes slug https://up.codes/s/limitations returned **HTTP 403**, and the US Made Supply Ch.10 page carries **no numeric travel data**. §1017.2.1 (exterior-balcony +100 ft) and §1017.2.2 (F-1/S-1 to 400 ft) likewise unretrieved. **Do not present these as settled numbers, and do not build a validator on them.** The *rule shape* (occupancy × sprinkler status × below-grade → one distance cap, sprinklers extend but never remove) is the transferable part. **Grid (linear basis, along the actual walking path):** if a 200 ft cap were ever confirmed it is 61 m = 122 tiles; 300 ft = 91 m = 183 tiles. Until then emit `required travel-distance cap: UNKNOWN (verify)`.
- Source: up.codes §1017.2 (T3) — https://up.codes/s/limitations (**HTTP 403**) + NJ Ch.10 viewer (table absent) — US — 2021-line. `no (not found at the cited source)`.
- Class: CODE REQUIREMENT
- Scope: universal
- Confidence: **Low on every numeric tier** (mechanism Medium). FLAG-LEVEL: BLOCKER for any distance check.
- Grid translation: A* travel distance to nearest exit; flag > tier for the occupancy; mark sprinklered-vs-not explicitly because it changes the number.
- Exceptions / failure mode: Below-grade increases strictness. Measuring straight-line instead of actual path understates it (real walls are longer). Symptom: "diagonal fits, walking distance doesn't."

### CODE-08 Place exits remote from each other (diagonal rule)
- Rule: Required exits must diverge — the direction of travel to one must differ from the other so one fire can't block both.
- Evidence: IBC 2021 **§1007.1.1** — read verbatim from the NJ-adopted Ch.10 viewer: exits remote, separation "equal to not less than **one-half**" of the maximum overall diagonal. **Basis, stated explicitly: 1/2 and 1/3 here are LINEAR fractions of a diagonal LENGTH — not area fractions and not percentages of plan coverage.** The **sprinklered one-third** tier was **not surfaced** on any page reached (this file states it as if read — mark `partial`). NFPA 101's "direction of travel significantly different" logic not retrieved (paywalled).
- Source: up.codes / NJ-adopted IBC 2021 Ch.10 viewer (T3 rendering of the paywalled ICC primary) — https://up.codes/viewer/new_jersey/ibc-2021/chapter/10/means-of-egress — US — 2021-line. `partial (T3 mirror; ≥1/2 read there, 1/3 not found)`.
- Class: CODE REQUIREMENT
- Scope: universal
- Confidence: Medium-High (≥1/2, linear); Low (1/3 sprinklered tier).
- Grid translation: compute floor diagonal **in tiles as a linear measure**, require exits separated along the perimeter by ≥ 0.5× (or 0.33× sprinklered — unverified) of that diagonal; never compare areas. Validation: two exits on the same short edge often violate this.
- Exceptions / failure mode: Diagonal rule can be waived when one exit serves a different story portion or via ramp/grade. Symptom: both stairs clustered by the lift core "for efficiency" — operationally one way out.

### CODE-09 Stair geometry: risers/treads, width, headroom, handrails, landings
- Rule: If you model a stair (even decoratively), keep its geometry legal, and remember egress stairs are continuous to the exit and landings must fit a full door swing.
- Evidence: **what the re-read actually supports:** the IBC 2021 chapter listing confirms **§1011.2 = Width** ✓, **§1011.3 = Headroom** ✓, and **§1011.5 = riser/tread** ✓ — i.e. the *structure* is right. **What it does not support: any of the values.** Riser **≤ 7 in (178 mm)**, tread **≥ 11 in (279 mm)**, uniformity **≤ 3/8 in**, width **44 in / 36 in**, headroom **80 in (2032 mm)**, handrail **34–38 in**, guard **42 in** were **never surfaced verbatim** — `partial (T3 mirror; primary not readable this pass)` for all of them. **Section corrections (against the 2021 edition this row stamps):** stair *uniformity* is **§1011.4**, not this file's §1011.5.4; the §1011.5.2 sub-item is plausible but unconfirmed → write `§1011.5 (sub-item: UNKNOWN (verify))`. **Handrail height is §1014.8 and guard height §1015.1** in the 2021 chapter listing — this file's "§1012.7 (2021)" and "§1015.3" are wrong, and its "moved to 1014/1015 in 2024" story is wrong by an edition. Landings §1011.6 unconfirmed. UK AD K rise/going/pitch/2R+G 550–700 mm: source page **not opened** → `no (not found at the cited source)`; do not use for any validator.
- Source: up.codes §1011.5 (T3) — https://up.codes/s/stair-treads-and-risers (**not reached; the §1011.2/.3/.5 numbering came from the NJ Ch.10 viewer**) + DataDrivenAEC handrail/guard (T3) — https://datadrivenaec.com/insights/ibc-guardrail-handrail-requirements + turnings.co.uk AD K (T3) — http://www.turnings.co.uk/stair-regulations.html (**never opened in any pass**) — US / UK.
- Class: CODE REQUIREMENT
- Scope: universal
- Confidence: Low-Medium. The chapter *numbering* is T3-confirmed for §1011.2/.3/.5 and for handrails/guards living in 1014/1015; **every dimension in this row is unverified**.
- Grid translation: **representation gap.** Stairs carry no simulated egress here (lift-only vertical), so stair *width/capacity* cannot be verified on the grid. Use the geometry numbers only to keep drawn stairs plausible; do not claim egress credit for a stair. Symptom of the trap: a plan with two code-stairs that the sim can't actually use for escape.
- Exceptions / failure mode: Handrails/guards were **already numbered in the 1014/1015 range in IBC 2021** (per the chapter listing read) — the "2024 moved them there" story in earlier drafts of this file is corrected; still confirm against your adopted edition. Spiral/aisle/monument stairs have their own rules.

### CODE-10 Doors in egress: clear width, swing, hardware, sliding/folding, locking
- Rule: Egress doors must be usable in panic — wide enough, opening the right way, releasing with one motion, no key/tool from the egress side, and (with exceptions) swinging with travel.
- Evidence: **read verbatim from the NJ-adopted IBC 2021 Ch.10 viewer, with the clause numbers correct: §1010.1.1** "Minimum clear width of doorways shall be **32 inches**" ✓ and **§1010.1.3** door opening force **5 pounds** ✓. **Not found at the cited source (all of the following, keep as `partial`):** the unlatch **≤ 15 lbf** and **≤ 30 lbf** sliding/folding figures; the **§1010.1.2 swing-in-direction-of-egress** thresholds (Group A >50 / H / E) — nothing about swing was surfaced; the §1010.1.4.3 special-purpose-sliding and §1010.1.4.1/1010.1.9 single-releasing-operation text; and the revolving-door **10 ft / aggregate 36 in** companion rules. **`verified?` = partial (T3 mirror; the two clauses named above read there, the rest not found).**
- Source: up.codes §1010 (T3) — https://up.codes/s/doors-gates-and-turnstiles (**not reached; §1010.1.1 and §1010.1.3 came from the NJ Ch.10 viewer**) — US — 2021-line.
- Class: CODE REQUIREMENT
- Scope: universal
- Confidence: Medium-High (32 in, 5 lbf — both read); Low (swing thresholds, 15/30 lbf, revolving, locking specifics).
- Grid translation: door-tile runs = 0.5 m/leaf-step (1 tile=0.5 m clear-ish, 2=1.0, 4=2.0). 32 in (813 mm) needs a **2-tile** run at least; a 44 in egress door needs **3 tiles**. Lock tags must have an always-free egress release. **Never** model a "sliding door" as the only egress from an assembly/H space.
- Exceptions / failure mode: Controlled-egress / locked-exit / delayed-egress exist under NFPA 101 §7.2.1.10 and IBC 1010.2.x with alarms and delayed release — allowed for security but *not* in most high-hazard or fully open-egress-required places. Symptom: a stylish magnetic main door as the sole exit.

### CODE-11 Continuous egress to a public way (exit discharge)
- Rule: The path must reach a safe dispersal area / public way, not just "outside a door into a dead court." Exits stay enclosed and unobstructed to discharge.
- Evidence: Universal principle (IBC §1028 exit discharge; NFPA 101 discharge to "grade plane or other safe area"). Requires that the discharge is visible, appurtenance-free, and leads to a street/alley/yard/public way.
- Source: concept stated across codes; specific clause text NOT directly fetched — the *numbers* (e.g. 50 ft from the exit to the public way, IBC 1028.3) are **UNCITED — verify against the applicable code edition.**
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: Medium (principle), Low (the 50 ft figure).
- Grid translation: every exit door must connect to a tile path that reaches a boundary "public way" state; a door to an interior walled void is a fail. Validation: exit at grade → outdoor tile reachable; upper floors → stair/lift portal to a discharging lobby.
- Exceptions / failure mode: Discharge to an alley shared with another building's fire lane. Symptom: exit "to outside" that dumps into a service yard with no way out.

### CODE-12 Provide areas of refuge for people with severe mobility disabilities
- Rule: Where the accessible route to an exit is via stairs or where the floor isn't open to below, provide defended refuge — a protected space with two-way communication — so wheelchair users need not descend stairs. Elevators are part of an accessible means of egress; stairs are not.
- Evidence: IBC 2021 §1009 — area of refuge at each exit stairway, **two 30 in × 48 in (760×1220 mm) wheelchair spaces**, two-way communication (§1009.6), directional signage: **NOT VERIFIED** — the up.codes area-of-refuge page returned the *ADA* text, not IBC 1009, and no page reached carries these dimensions. **NFPA 101 horizontal-exit "3 ft² (0.28 m²) clear floor per person": RETRACTED AS A SOURCE — the cited NFPA blog URL returns HTTP 404**, so the figure is currently attributable to nothing that resolves, and §7.2.4 (2024) was not read; an explanatory blog would not be a T1 code text even if it did resolve. **Basis note if the figure is ever re-established: 3 ft²/person is an AREA ratio — do not convert it to a linear "per person width".** ADA 2010 accessible-means-of-egress scoping references the IBC at **§207.1**, not §207.3 (cite corrected). **Grid:** 30×48 in = 2×3 tiles per space; two spaces ≈ a 2×6 tile notch (unverified figures — advisory only).
- Source: NFPA 101 horizontal exits blog — https://www.nfpa.org/news-blogs-and-articles/blogs/2024/05/22/horizontal-exits-overview — **HTTP 404, DEAD this pass; the figure it carried is `no (URL dead this pass)` and needs the paywalled NFPA 101 standard.** IBC §1009: up.codes area-of-refuge page returned ADA text — **`no (not found at the cited source)`**. ADA §207.1: Access Board ch.2 — **T1, read** (`partial` overall: the ch.2 render was lossy).
- Class: CODE REQUIREMENT
- Scope: universal (mandatory where multistory accessible egress applies)
- Confidence: **Low for every dimension in this row** (mechanism High: refuge + two-way comms + no-stair-descent requirement is cross-jurisdictional and not in doubt).
- Grid translation: on each floor not open to below, reserve a tagged refuge (2× wheelchair spaces + comms) beside a protected stair *or* treat the lift lobby as the accessible egress node. Since the sim's only vertical is the lift, the refuge must co-locate with the lift portal. Symptom to catch: a "code-compliant" upper floor whose only escape for a wheelchair user is a stair the sim can't use.
- Exceptions / failure mode: Two-way comms and signage are routinely drawn and then "value-engineered" out. Single-story-at-grade escapes generally don't need refuge.

### CODE-13 Bound height × area × stories by occupancy × construction type
- Rule: A floor plate and a building height aren't free choices — allowable height and area per floor are a matrix of occupancy group × type of construction; sprinklers multiply area and add a story/height.
- Evidence: IBC 2024 Tables 504.3 (height/stories) & 506.2 (area). Business (B) per floor, unsprinklered base / single-story max / multi-story max: **II-A 65 ft/4 st, 23,000 sf**; **II-B 55 ft/4 st, 19,000 sf**; **III-A 65/4, 18,000 sf**; **III-B 55/2, 12,000 sf**; **IV-HT 65/5, 18,000 sf**; **V-A 50/3, 14,000 sf**; **V-B 40/2, 9,000 sf**; I-A/I-B essentially unlimited. **Source page NOT opened in the verification pass → `partial (T3 mirror; primary not readable this pass)`**; the arithmetic below is internal and stands on its own. Sprinklers allow roughly **3× the AREA (multi-story)** — **basis: area, not linear; a 3× area is only ≈1.73× per side**, and never read a height allowance (ft/stories, linear/count) off the same multiplier. **Grid (area basis, 1 tile = 0.25 m²):** 20,000 sf ≈ 1,858 m² ≈ 7,430 tiles — a 256×256 floor (65,536 tiles) is ~16,384 m², i.e. one 256-floor vastly exceeds V-B limits → height/type check is real.
- Source: MeltPlan (T3, IBC 2024) — https://www.meltplan.com/buildingcodes/ibc/building-height-area-limits — **not opened on the re-read pass** — US — 2024. `partial (T3 mirror; primary not readable this pass)`.
- Class: CODE REQUIREMENT
- Scope: universal
- Confidence: Medium (T3 summarizer, not re-read; numbers are standard but confirm per occupancy).
- Grid translation: before designing, compute fire-area (m²) and story count; if the plan's footprint exceeds the allowable-area-for-type/occupancy, either add a rated fire barrier/subdivision, add sprinklers (note the credit), or reduce footprint. Emit as a *sizing check*, not a hard block.
- Exceptions / failure mode: Frontage increase, underground, special-provision occupancies (markets, Group U). Symptom: a single enormous open "Type V-B" warehouse floor that only Type I + sprinklers could permit.

### CODE-14 Fire-rate the vertical openings: shafts and exit stairs
- Rule: Any opening that can carry fire/smoke between floors (stairs, elevator hoistways, garbage/linen chutes, service shafts) needs a rated enclosure; taller service = higher rating.
- Evidence: IBC 2021 §713.4 shaft enclosures **not less than 2 hr where connecting four or more stories** (T3 verbatim); 1 hr where connecting 3 or fewer stories (**partial — only the 2-hr/4+ figure was directly retrieved; the 1-hr/≤3 tier is recollection — verify**). Exit stair enclosures: fire barriers §707, typically **1 or 2 hr**; corridor fire-partition walls §708 typically **1 hr**; fire walls §706 **2–4 hr** and structurally independent.
- Source: up.codes §713.4 (T3) — https://up.codes/s/fire-resistance-rating + MeltPlan fire-resistant construction (T3) — https://www.meltplan.com/buildingcodes/ibc/fire-resistant-construction — US — 2021. partial.
- Class: CODE REQUIREMENT
- Scope: the duty (vertical openings need a rated enclosure) recurs across regimes; the tiers are jurisdictional — 2 hr for 4+ storeys and 1 hr for ≤3 are IBC 2021 §713.4 (US model code); EN/BS fire-resistance regimes grade shaft enclosures differently
- Confidence: Medium (2 hr/4+), Low (1 hr/≤3 tier, not verified verbatim).
- Grid translation: every tile column that is a lift shaft / stair void / chute across floors must be tagged as inside a rated enclosure; doors into it are rated self-closing (`CODE-25`). Garbage/linen chutes get their own shaft enclosure. Symptom: an open lift lobby shared with a stair on the same "wall" as a kitchen.
- Exceptions / failure mode: Atria and open stairs are *engineered exceptions* (see `CODE-16`) and need compensation; open parking garages largely exempt. Section numbers shifted between 2018/2021/2024 — verify.

### CODE-15 Compartmentalise: smoke barriers, smoke compartments, horizontal exits
- Rule: Split large floors into compartments that hold smoke, and let occupants reach safety by moving *horizontally* into another compartment rather than all the way out (defend-in-place).
- Evidence: IBC 2021 §710 (smoke barriers) — not retrieved. **§407.5.1: new Group I-2 hospitals — smoke compartment max area 22,500 sf (2,090 m², AREA basis)** — the clause was **NOT fetched**; the only thing reached was a **T3 trade article** (US Made Supply I-2 page, which the re-read pass did not open), so the instrument actually standing behind this figure is a secondary summary, not IBC §407.5.1. The 22,500 sf number is **NFPA 101 heritage** and attributing it to an IBC clause without text is a jurisdiction-of-origin risk — name the instrument you read. **NFPA 101 §7.2.4 horizontal exit "≥ half the required exits/capacity" and "3 ft²/person refuge area" — RETRACTED: the cited NFPA blog URL is 404**, so neither figure has a live locator; and note "half" there is a **capacity (linear width) ratio, not an area ratio** — the two are different tests. **Grid:** partition to a max compartment **area** and give each a horizontal-exit door to a neighbour compartment of adequate refuge area. **22,500 sf ≈ 2,090 m² ≈ 8,360 tiles (area)** per smoke compartment. Symptom: one 15,000 m² hospital floor with no rated cross-corridor doors.
- Source: US Made Supply I-2 healthcare egress (T3) — https://usmadesupply.com/resources/building-codes-standards/emergency-life-safety/ibc-i2-healthcare-egress (not opened on the re-read pass) + NFPA (blog URL **dead, 404**). US — 2021-line. IBC leg `partial (T3 mirror; primary not readable this pass)`; **NFPA leg `no (URL dead this pass)`**.
- Class: CODE REQUIREMENT
- Scope: healthcare / detention / high-rise / large-assembly
- Confidence: Medium (compartment *mechanism* High, mandatory in I-2 / large floors / high-rise); **Low on the 22,500 sf until read from an adopted I-2 article, and Low on the NFPA figures until the standard is read**.
- Grid translation: on hospital/tall floors, partition to a max compartment **area** and give each a horizontal-exit door to a neighbour compartment of adequate refuge area (compartment cap: `22,500 sf ≈ 2,090 m² ≈ 8,360 tiles`, **area basis, UNVERIFIED until §407.5.1 is read**). Symptom: one 15,000 m² hospital floor with no rated cross-corridor doors.
- Exceptions / failure mode: Some occupancies waive smoke compartments at small area / 1 story. "Defend-in-place" needs *staff* (see `CODE-24`) — the compartment only works if people are moved by staff, which the sim must not treat as automatic.

### CODE-16 Control atria and open vertical connections
- Rule: Openness between floors (atria, open escalator/lift-lobby voids, open stairs) is a permitted *exception* to enclosure, bought with extra protection — otherwise fire/smoke spread freely up the void.
- Evidence: IBC §404 — atria connect ≥2 stories with a floor/ceiling opening; requires separation of the atrium from non-adjacent spaces, smoke control, sprinklers, and limits on which occupancies may open into it and how far (e.g. no Group H; R-1 guest rooms generally restricted; number of stories open limited). Exact clause numbers/values NOT verbatim-fetched → **UNCITED — verify against the applicable code edition.**
- Source: ICC IBC §404 primary page (not retrieved; 403). Concept cross-ref: FCIA/Blackspectacles overviews (T4) — not relied on for numbers.
- Class: ENGINEERING CONSTRAINT
- Scope: commercial / hospitality / civic / transit
- Confidence: Low (mechanism High, numbers Low).
- Grid translation: multiple walkable floors open to each other (an atrium) is a design move that must be *flagged as needing engineered compensation* (smoke control, sprinklers, rated balconies), not silently drawn. Symptom: a beautiful 6-floor open atrium credited as ordinary floor plates.
- Exceptions / failure mode: The single most-common "looks fine in plan, fails on review" case. Also smoke-fill physics: an atrium can be code-compliant yet trap occupants on lower balconies.

### CODE-17 High-rise package (tall buildings change the whole system)
- Rule: Past a height trigger, a bundle of extra provisions switches on: more/protected stairs, smoke-proof or pressurised enclosures, standpipes, fire pump, emergency communications, and often refuge floors; occupied floors need ≥2 remote exits.
- Evidence: IBC §403 (high-rise) generally: **≥2 exit stairways** remote from each other, one roof access; **smoke-proof tower or pressurised** stair enclosures (§909 stair pressurisation referenced); **standpipes** (§905); **fire pump** (§913); two-way communication elevators (emergency recall). High-rise trigger ≈ **>75 ft (≈23 m) above the lowest fire-service access** for many occupancies (**partial/verify — the 75 ft definition and 2018/2021/2024 nuances shift**).
- Source: concept cross-ref up.codes NJ Ch.10 (T3, partial) + general IBC §403/909/905/913 (primary not fetched). **UNCITED for the exact trigger height & clause list — verify.**
- Class: CODE REQUIREMENT
- Scope: commercial / hospitality / healthcare / residential (tall)
- Confidence: Medium (package existence), Low (numbers). Class kept: the rule states only that a height trigger switches on a bundle of extra provisions and that occupied tall floors need two remote exits, which is §403's structure; the unverified elements are the clause numbers and the numeric thresholds carried in the row's details, not the duty
- Grid translation: when floor count × ~4 m ≈ height passes the trigger, add a checklist tag (2 remote stairs, pressurisation, standpipe, fire pump, refuge floors, recall elevators). Note the sim's lift-as-only-vertical model is *especially* suspect in high-rise, because recall/fire-service elevator use is part of the code logic and isn't simulated. Symptom: a 40-floor hotel modelled like a low-rise (decorative stairs, ordinary lift).
- Exceptions / failure mode: "High-rise" is defined from fire-department access, not total height, so podium/slope changes it. Pressurised vs smoke-proof vs "controlled/protected" are different remedies.

### CODE-18 Accessible route: continuity and clear width
- Rule: An accessible route must run continuously (no steps) from the arrival point to each entrance/accessible unit, with a minimum clear width that survives turns and doors.
- Evidence: 2010 ADA Standards (**T1**, Access Board ch.4) — §403.5 Clear Width of accessible route **36 in (915 mm) min**, reduced to **32 in (815 mm) for a length of 24 in maximum, separated by segments ≥48 in** — **read verbatim, confirmed.** Door clear width **32 in** per **§404.2.3**. **THREE CITE CORRECTIONS in this row (values were right, the numbers under the `yes (T1)` stamp were not):** passing spaces where the route is under 60 in wide are **§403.5.3** (at intervals ≤200 ft), *not* §403.5.1 as this file had it; turning space is **§304 in ch.3** (60 in circle / T-shape), *not* §305 — §305 is *clear floor space*, a different provision; and "changes in level §403.4" is **not confirmed** — ch.4 §403 runs 403.1–403.6 and the changes-in-level provision carrying the ¼ in vertical / ½ in bevel family is **§303 in ch.3**, whose sub-values were not surfaced on the page read (`§403.4: section: UNKNOWN (verify)`). **Grid (linear basis):** 36 in = 1.83 tiles → **2 tiles (1.0 m)** route as default; 32 in pinch fits within a 2-tile; a 1-tile (0.5 m) route is **not** an accessible route (single file, below min). 2 tiles against a 36 in minimum over-provides **+97 mm linear** (**+24% linear / +44% area** — quote the basis you mean).
- Source: Access Board ADA ch.4 accessible routes (**T1**) — https://www.access-board.gov/ada/chapter/ch04/ — and ch.3 (**T1**) — https://www.access-board.gov/ada/chapter/ch03/ — US — 2010. `yes (T1)` for §403.5/§403.5.3/§404.2.3/§304 as read; **`partial (T1 page read; the §403.4 attribution and the §303 sub-level values not found there)`** for changes-in-level.
- Class: CODE REQUIREMENT
- Scope: universal (public/commercial/residential-multi accessible design)
- Confidence: High for the widths; Low for the changes-in-level thresholds.
- Grid translation: primary circulation and routes to accessible rooms ≥2 tiles; no step tiles on the route (level or ramp/lift). Validation: an accessible route may not dead-end and may not require backtracking more than turning space.
- Exceptions / failure mode: Clear width ≠ wall width — handrails/door hardware/turns eat it. Symptom: "2-tile corridor" that drops to a 1-tile pinch at a door or column.

### CODE-19 Door maneuvering clearance (accessible doors)
- Rule: Accessible doors need flat-floor space on both sides to approach/open, sized by push/pull and hinge/latch side.
- Evidence: **2010 ADA Table 404.2.4.1 "Maneuvering Clearances at Manual Swinging Doors and Gates" — READ DIRECTLY from access-board.gov ch.4 this pass and transcribed as the table states it** (columns: Approach Direction / Door-or-gate side / Perpendicular to doorway / Parallel to doorway, beyond latch side unless noted):
  - **From front — Pull:** 60 in (1525 mm) perpendicular, **18 in (455 mm)** parallel beyond latch.
  - **From front — Push:** 48 in (1220 mm) perpendicular, **0 in (0 mm)** parallel — *footnote: add 12 in (305 mm) if closer and latch are provided*.
  - **From hinge side — Pull:** printed as **two** rows: **60 in (1525 mm)** perpendicular with **36 in (915 mm)** parallel, and **54 in (1370 mm)** perpendicular with **42 in (1065 mm)** parallel. *The text render does not show what distinguishes the two rows — see the caveat below.*
  - **From hinge side — Push:** 42 in (1065 mm) perpendicular, **22 in (560 mm)** parallel **beyond the hinge side** — *footnote: add 6 in (150 mm) if closer and latch are provided*.
  - **From latch side — Pull:** 48 in (1220 mm) perpendicular, **24 in (610 mm)** parallel — *footnote: add 6 in (150 mm) if a closer is provided*.
  - **From latch side — Push:** 42 in (1065 mm) perpendicular, **24 in (610 mm)** parallel — *footnote: add 6 in (150 mm) if a closer is provided*.
  - **Caveat, do not paper over:** the standard's printed table splits these rows by **Door With Closer / Door Without Closer**, and the page's text render did **not** preserve that column split — the closer allowance arrives only through the footnotes. So the **values above are read**, but the **with-closer/without-closer mapping is not machine-resolved** and the discriminator between the two hinge-side pull rows is unresolved. Resolve against the printed table/figure (or the ADA guide's rendering) before encoding a door-clearance check. **This corrects this file's earlier shorthand** "pull 60/48/54/42" and "hinge-side pull 60 (or **54 with closer**)": 54 in is a *separate printed row*, not a closer variant, and the closer deltas are **+12 in** (front push, with latch) / **+6 in** (other rows) — not "+12 pull / +6 push". Clear width through the doorway **≥32 in** (§404.2.3, read) on a **36 in** route (§403.5, read). **Grid (linear → tiles, rounded UP per `CODE-27`):** perpendicular 60 in = 3.05 → **4 tiles**; 54 in = 2.74 → **3**; 48 in = 2.44 → **3**; 42 in = 2.13 → **3**; parallel 36 in = 1.83 → **2**; 24 in = 1.22 → **2**; 22 in = 1.12 → **2**; 18 in = 0.91 → **1**. Note the earlier "60 in ≈ 3 tiles" in this rule was a **round-DOWN** and contradicted `CODE-27`.
- Source: **US Access Board, 2010 ADA Standards ch.4 — T1 — https://www.access-board.gov/ada/chapter/ch04/ — US — 2010 — table read this pass.** The Corada mirror (**T3**) — https://www.corada.com/documents/2010ADAStandards/404 — is no longer needed for this row and is retained only as a cross-check; the sibling research file's version of the same table disagrees in its side-approach rows and has been reconciled to this reading.
- Class: CODE REQUIREMENT
- Scope: universal
- Confidence: **High on the printed values (T1, read)**; **Low on the with-/without-closer row mapping and on the hinge-side pull discriminator**, which the text render could not resolve.
- Grid translation: don't place an accessible door flush into a tight corner; leave the maneuvering tiles. Symptom: a compliant 2-tile door that can't be opened from a wheelchair because the wall is right at the latch.
- Exceptions / failure mode: Closer/latch hardware changes clearance; sliding doors need different (latch-side + pull) space. Manual doors only for this table; power-assist differs.

### CODE-20 Ramps: slope and run limits
- Rule: Where the accessible route rises without a lift, the ramp slope, rise per run, and landings are capped; steep ramps are not accessible.
- Evidence: 2010 ADA (**T1**, ch.4 read) — §405.2 running slope **not steeper than 1:12** ✓; §405.6 rise of any **ramp run ≤30 in (760 mm)** ✓ (≈3.75 m run at 1:12); §405.7 landings **≥60 in** long at changes of direction / top / bottom ✓. **Cross slope ≤1:48 ✓ but its clause is §405.3, NOT a "existing-building exception" clause** — see the correction below. Edge protection and "handrails where rise >6 in" were **not surfaced** on the page read → `partial (T1 page read; sub-clause not confirmed)`. **Grid (slope is linear rise:run — not expressible as an area):** flat walkable tiles cannot carry a gradient → **representation gap**; a ramp is either modelled as level route (loses the slope test) or flagged.
- Source: Access Board ch.4 (**T1**) — https://www.access-board.gov/ada/chapter/ch04/ — US — 2010. `yes (T1)` for §405.2/§405.3/§405.6/§405.7 as read. UK AD M: ramp **1:15 preferred / 1:12 max short** with level landings (T3 squote) — https://squote.app/knowledge/compliance/part-m-access (**page not opened on the re-read pass → `no (not found at the cited source)`**).
- Class: CODE REQUIREMENT
- Scope: universal
- Confidence: High (the four ADA clauses read); Low (edge protection, handrail trigger, AD M).
- Grid translation: prefer lift portals over ramps for vertical in this sim; where a ramp is drawn, emit an advisory that slope/run/landing cannot be validated on a flat grid and must be checked off-model.
- Exceptions / failure mode: **REMOVED FROM THIS FILE, do not restore:** "existing-building short ramps may use steeper **1:8 / 1:10 for ≤3 in rise (ADA 405.3)**". Two errors: the clause number points at **cross slope**, and **no such steeper-ramp allowance appears anywhere in the 2010 ADA ch.4 text read** — that allowance belongs to pedestrian-access-route / legacy guidance, a different instrument. If a jurisdiction does permit it, re-site it with the instrument actually read and `section: UNKNOWN (verify)` until then. Symptom: a long "accessible" route that is really a 1:6 slope no wheelchair can climb.

### CODE-21 Reach ranges and accessible sanitary clearances
- Rule: Operable parts (switches, dispensers, controls) sit in a reachable band; accessible toilets/water closets need clear floor space and grab bars.
- Evidence: 2010 ADA §308 — **read verbatim from Access Board ch.3 (T1), tier upgraded accordingly**: unobstructed **forward reach** high **≤48 in (1220 mm)**, low **≥15 in (380 mm)** ✓; obstructed forward reach — depth **20 in max at 48 in max**, and **where the obstruction is deeper than 20 in the high reach drops to 44 in (1120 mm)** ✓; **side reach** high **≤48 in**, low **≥15 in** ✓ (§308.2/§308.3). *Caution kept:* the page does not state these as **seated**-specific figures — "seated side reach" is a gloss, not a code string. Water closet clear floor space **60 in** turning / transfer spaces (ADA §604): **ch.6 was not fetched → `no (not found at the cited source)`**. UK AD M: WC needs **900×1500 mm** clear floor (T3 squote, **page not opened**) → `no`. **Grid:** reach band 15–48 in = 0.38–1.22 m (vertical — not modelled); sanitary clear floor 60 in = 3.05 tiles → **4 tiles (round UP per `CODE-27`; 3 tiles = 1.5 m is *below* 1525 mm)**.
- Source: **US Access Board — 2010 ADA Standards ch.3 — T1 — https://www.access-board.gov/ada/chapter/ch03/ — US — 2010 — §308 read this pass.** Corada §308 mirror (**T3**) — https://www.corada.com/documents/2010ADAStandards/308 — retained as a cross-check only. WC clearances: **no primary retrieved**.
- Class: CODE REQUIREMENT
- Scope: universal
- Confidence: **High (reach ranges, T1 read)**; Low (fixture clearances, AD M).
- Grid translation: keep ≥4-tile clear rectangles where a **60 in (1525 mm)** turning/clear space is the driver (3 tiles = 1.5 m is *below* it — see `CODE-27`), and never let the room be reachable-but-unusable. Vertical reach ranges are off-grid: emit as advisory metadata on the room, not a tile check.
- Exceptions / failure mode: Grab-bar location and transfer height drive usability but are invisible in plan. Symptom: a "wheelchair WC" with the required area but the door swinging into it.

### CODE-22 Accessible guest/sleeping rooms ratio (hospitality)
- Rule: In hotels/ lodging, a minimum percentage of sleeping rooms must have mobility features, dispersed by type, plus a count with communication features.
- Evidence: 2010 ADA **Table 224.2** (rooms with mobility features). **Tier ladder NOT verified — do not automate it yet.** The Access Board **ch.2 (T1)** page *was* reached but its render of Table 224.2 came back **internally inconsistent** ("51–100: 3 rooms; 101+: 3 + 1 per 100"), which does **not** reproduce the ladder below; the Corada mirror (**T3**) was not re-read. The ladder is retained **as a recollection of the DOJ-published table, unstamped**: 1–25→1; 26–50→2; 51–75→4; 76–100→5; 101–150→7; 151–200→8; 201–300→10; 301–400→12; 401–500→13; 501–1000→**3 % of total**; >1000→**30 + 2 per each 100 (or fraction) over 1000**. **Basis, stated: the "3 %" here is a COUNT ratio (accessible rooms ÷ total rooms) — it is neither a linear nor an area percentage and must never be applied to floor area.** Separate tables govern communication features and dispersion (not retrieved). **Grid:** accessible rooms disperse across floor levels, not stacked on one bad corner.
- Source: Corada 224 mirror of 2010 ADA (**T3**, unopened this pass) — https://www.corada.com/documents/2010ADAStandards/224 ; Access Board ch.2 — https://www.access-board.gov/ada/chapter/ch02/ — **T1 reached but the table render was inconsistent**. US — 2010. `no (not found at the cited source in a machine-consistent form)`.
- Class: CODE REQUIREMENT
- Scope: hospitality
- Confidence: **Low on the specific breakpoints** (the *duty* — a minimum count plus dispersion — is High and is not in question). **CLOSES IT:** a human read of printed Table 224.2 before any accessible-room validator ships.
- Grid translation: compute required accessible-room count from total room count; place them on an accessible route with maneuvering space; check dispersion. Symptom: 300 rooms, 0–2 accessible, or all accessible rooms next to the service lift.
- Exceptions / failure mode: Safe-haven and resort/multi-family rules differ; the *%* applies to rooms in a cluster. DOJ Title III "readily achievable barrier removal" governs retrofits, not new construction.

### CODE-23 Lift/car as accessible route & accessible means of egress
- Rule: Elevators/lifts must be reachable, have accessible controls/car, signage, and audible signals, and (in this sim) are the only vertical egress — so they must be credited as the accessible means of egress and co-located with refuge.
- Evidence: 2010 ADA Ch.4 (car space, door time, control height in the 15–48 in reach band, tactile+braille floor designations §407) — **specific car/control dimensions NOT verbatim-fetched → `no (not found at the cited source)`**; the ch.4 page read carried routes/doors/ramps, not §407 elevator dimensions. **IBC §1009 and ADA 2010 §207.1 (cite corrected — this file said §207.3) make elevators part of an accessible means of egress**; high-rise adds recall/fire-service use (`CODE-17`, itself unverified). **Grid:** lift is a portal with a 30 s queue.
- Source: Access Board ADA Ch.4 (**T1**) — https://www.access-board.gov/ada/chapter/ch04/ (route context only) + ch.2 (**T1**) for the §207.1 IBC reference — US — 2010. `partial (T1 page read for the *duty*; no dimensional value on it was retrieved)`.
- Class: CODE REQUIREMENT
- Scope: universal (multistory)
- Confidence: Medium (existence/jurisdiction), Low (dimensional specifics); the lift-only-vertical-egress caveat is an engineering constraint of this host model, not a code provision
- Grid translation: model each lift as reachable by an accessible route; because stairs carry no traffic, a multistory building's *only* accessible egress is the lift — so at least one lift must serve every floor and connect to a refuge at each. **Critical caveat to surface:** a lift-only-vertical sim cannot demonstrate stair egress capacity and cannot model that fire recall may *remove* the lift from occupant use — so this host abstraction can make a plan look compliant while being operationally unsafe. Flag it.
- Exceptions / failure mode: Evacuation-lift / area-of-refuge assistance; lifts may be unavailable in fire, which the sim's 30 s portal hides. Symptom: a "fully accessible" tower whose escape collapses if the lift is on recall.

### CODE-24 Healthcare (Group I-2): what changes vs a normal building
- Rule: In hospitals/nursing homes, expect *defend-in-place*: patient rooms open into protected corridors, smoke compartments, wider bed-movement doors, controlled-egress locks, and staffing-based evacuation rather than self-evacuation.
- Evidence: IBC 2021-line — **every number in this row failed the re-read.** I-2 travel distance **200 ft sprinklered / NP unsprinklered (Table 1017.2)** — the table is **absent from the Ch.10 page reached** (`no`). Smoke compartment max **22,500 sf (§407.5.1)** — clause **not fetched**; instrument is a T3 trade article (`partial` at best). **Common path 75 ft — this file attributed it to "1006.2.1", which is the exit-count/capacity table; the common-path rule sits in the corridors article, `section: UNKNOWN (verify)`.** **"Bed-movement-path doors clear width 41.5 in (§1010.1.1)" is a source-claim mismatch — the §1010.1.1 text retrieved contains ONLY the 32 in minimum and no 41.5 in provision** → re-source (candidates: an §1010.1.1 *exception*, NFPA 101, or the FGI Guidelines; until read, write `41.5 in — source: UNKNOWN (verify)` and do not print §1010.1.1 beside it). Controlled-egress/locked doors (§1010.2.x) and CMS's adoption of NFPA 101 as a Medicare condition of participation — mechanism sound, **clause text not retrieved**; NFPA 101 Ch.18/19 specifics paywalled. Nursing-home I-2 vs I-1 distinction (>5 non-self-preserving residents + 24-hr care) — **UNCITED**.
- Source: US Made Supply I-2 (T3, not opened on the re-read pass) — https://usmadesupply.com/resources/building-codes-standards/emergency-life-safety/ibc-i2-healthcare-egress + up.codes §1017.2 (T3, **HTTP 403**) + NJ IBC 2021 Ch.10 viewer (**§1010.1.1 = 32 in only**). `no (not found at the cited source)` for 41.5 in, Table 1017.2 and the 22,500 sf clause reference.
- Class: BUILDING-TYPE CONVENTION
- Scope: healthcare
- Confidence: Low on all four figures (each needs an adopted-edition read); the defend-in-place, staffing-evacuation and corridor-width character is a healthcare building-type convention, and the clean/soiled specifics are FGI planning guidance rather than life-safety code (see CODE-26) — was `CODE REQUIREMENT`; demoted: every number in the row failed the re-read and the Confidence already assigns the qualitative character to type convention and FGI guidance, so no read clause carries this rule as written
- Grid translation: **treat the bed-movement width as an open question, not a check:** `41.5 in = 1054 mm = 2.11 tiles → 3 tiles` is the *arithmetic if the figure is ever confirmed* (linear → tiles, rounded UP per `CODE-27`). Until re-sourced: hospital corridors default ≥3 tiles as a **conservative design choice, not a cited minimum**; smoke compartment ≤8,360 tiles is likewise a planning envelope pending the §407.5.1 read. Night-staff and "patients don't self-evacuate" is operational — a hospital floor that relies on occupants walking out is a design error even if widths pass. Symptom: 300-bed floor, 1 exit stair, no smoke compartment, no refuge.
- Exceptions / failure mode: Outpatient / clinics are often Group B, not I-2, if <5 non-self-preserving at a time. Soiled/clean separation, nurse-unit adjacency to lifts, patient-room circulation (~36 in around bed) are **infection-control/FGI planning guidance, NOT life-safety code** — see `CODE-26` and Weak-or-Contested.

### CODE-25 Hospitality fire protection: guest sprinklers, room detection, self-closing doors
- Rule: In hotels (R-1)/sleeping occupancies, expect mandatory sprinkler coverage, smoke detection in and outside sleeping rooms, and self-closing/positive-latching rated corridor/exit doors — plus that guest-room doors are *not* normally required to be fire-rated/closers unless they open into an enclosed exit corridor.
- Evidence: IBC — **Group R-1 (hotels/motels) required sprinklered throughout (NFPA 13/13R)**, and R generally sprinklered **throughout when 4+ stories** (per §903.3.1.1/§903.3.1.2); **smoke detection in Group I-1, I-2, R-1, R-2 sleeping areas, within and adjacent to sleeping rooms** (§907); corridor/exit doors that are part of a rated enclosure must be self-closing/positive-latching (fire door assemblies §716). **None of the above was retrieved: the Ch.9 mirror was unreachable and the MeltPlan fire-protection page was not opened on the re-read pass**, so the §903.3.1.x sub-clause numbers and the §907 scope are **unverified against the edition stamped** — `no (not found at the cited source)`. **The DUTY is not in doubt** (sleeping occupancies are sprinklered and detected in every regime reviewed in this file's sources); only the clause numbering and the exact trigger (all R-1 regardless of size vs 4+ stories) are. **Verify against the local adopted code before citing any of it.**
- Source: MeltPlan fire-protection systems (T3, IBC 2024) — https://www.meltplan.com/buildingcodes/ibc/fire-protection-systems + NY IBC 2024 Ch.9 viewer (T3) — https://up.codes/viewer/new_york/ibc-2024/chapter/9/fire-protection-and-life-safety-systems — **neither page reached on the re-read pass** — US — 2024. `no (not found at the cited source — mirror unreachable)`.
- Class: CODE REQUIREMENT
- Scope: hospitality
- Confidence: Low (numbers and clause numbers); Medium (the duty).
- Grid translation: mark hotel floors "sprinkler-required"; the sprinkler credit relaxes travel distance (`CODE-07`) *only if* you actually model coverage. Door closers matter for the *rated* doors onto the corridor; the grid's door tiles should carry a "self-closing?" flag on enclosure doors. Symptom: a hotel relying on sprinklered travel-distance extension that isn't shown as sprinklered.
- Exceptions / failure mode: Communicating doors between adjoining guest rooms are restricted (egress/privacy); historic/wetless conditions and small lodging differ. Self-closing is a *maintainability* trap — wedged-open closers fail in use despite the plan looking compliant.

### CODE-26 Service separation: kitchens, refuse, loading, and rated enclosures
- Rule: Keep dirty/service circulation (waste, laundry, food service, goods-in, plant) off the public/accessible and clean routes, and enclose greasy/waste shafts and stair lobbies in rated construction.
- Evidence: The *principle* is universal (separate clean/dirty and public/service; don't route refuse through dining/entry). The specific *code numbers* here are mostly NOT life-safety-code items: **kitchen grease-duct cleaning, refuse-store separation, and patient clean/soiled routing are Fire Code / health-dept / infection-control / FGI-guidance domain**, not IBC egress. IBC does require rated enclosures for the *shafts* they live in (§713, `CODE-14`) and separation of some high-hazard uses. Treat the concrete figures as **UNCITED — verify against the applicable code/health edition.**
- Source: no primary T1 retrieved for specific clearances — flagged intentionally. (IBC §713 for shaft enclosures via up.codes, T3.)
- Class: BUILDING-TYPE CONVENTION
- Scope: hospitality / healthcare / commercial
- Confidence: Low; the separation principle is a type convention, while every concrete clearance recorded here is an uncited heuristic pending the applicable fire/health code edition
- Grid translation: give service/back-of-house its own door runs and routes that don't cross the accessible route or the exit-discharge lobby; put a rated enclosure tag on any waste/linen/food lift shaft. Symptom: bin store opening straight into the restaurant entrance corridor, or a "lift" shared by guests, laundry trolleys and food waste.
- Exceptions / failure mode: In space-limited retrofits some sharing is accepted with management (schedule/containment) — that's a fire/health risk decision, not an egress width one; never claim it as "code" from this file.

### CODE-27 Round UP to the tile; never model a sub-minimum width as compliant
- Rule: Because the grid is 0.5 m, most clear-width minimums fall between tile counts; the only defensible policy is to round clear widths **up** to the next whole tile and never represent a required width with a run that is actually below the minimum.
- Evidence: 1 tile = 0.5 m = 19.7 in. **All ratios below are LINEAR (width ÷ width). Rounding a width up to the next whole tile over-provides an area that is the SQUARE of the linear ratio — quoting one as the other is the error class this line exists to stop.** Conversion table (clear width → tiles), with both bases stated: **32 in (813 mm)** = 1.63 → **2** tiles = 1000 mm → **+23% linear / +51% area**; **36 in (914 mm)** = 1.83 → **2** = 1000 mm → **+9% / +20%**; **41.5 in (1054 mm)** = 2.11 → **3** = 1500 mm → **+42% / +103%** (*and the 41.5 in figure itself is unverified — `CODE-24`*); **44 in (1118 mm)** = 2.24 → **3** = 1500 mm → **+34% / +79%**; **48 in (1219 mm)** = 2.44 → **3** = 1500 mm → **+23% / +51%**; **60 in (1525 mm)** = 3.05 → **4** = 2000 mm → **+31% / +72%**. Note 44 in cannot be *exactly* represented: 2 tiles = 1.0 m is *below* 1118 mm → non-compliant; you must use 3 tiles (1.5 m). Same for ADA 60 in turning = 1525 mm; 3 tiles = 1.5 m is *below* → 4 tiles. Where a rule compares a *clear floor area* to a code *area*, the basis is area and must be labelled `(area)` — a per-person ft²/person factor is never a linear number.
- Source: derived arithmetic from the shared host-grid spec + the T1/T3 minimums above. Class-appropriate; no new external figure.
- Class: ENGINEERING CONSTRAINT
- Scope: universal
- Confidence: High.
- Grid translation: `tiles_required = ceil(min_mm / 500)`; a door "run" nominally equals clear *less* the leaf/frame — add margin. Validation: reject any egress/accessible component whose tile run × 0.5 m is below the cited minimum. Symptom of the trap: 2-tile "corridor" booked as satisfying the 44 in (3-tile) requirement.
- Exceptions / failure mode: This is conservative — it can force you *over* code and eat rentable area; that's the point. Round-down is never safe. Travel distances (long measures) can go either way but be conservative on the *limit* side.

### CODE-28 Codes are floors, not targets — code-minimum ≠ operational-minimum
- Rule: Treat every cited figure as the *least* acceptable; separately judge whether the layout actually *works*, because a plan can satisfy code on paper and fail in service. Report both: "code floor met" and "operationally adequate? yes/no."
- Evidence: Well-documented failure modes where geometry passes code but operation fails: an exit that's compliant width but around a blind corner; a lift-only vertical escape that dies on fire recall (`CODE-23`); a 75 ft common path that's legal but is a single-file 1-tile spine; a "code" refuge with no staff to use it (hospital defend-in-place, `CODE-24`); a 1:12 "accessible" route that's actually steeper (`CODE-20`). NIST's "basis for egress provisions" documents that provisions encode *headload and flow* assumptions that geometry alone can hide — **T2** (peer/gov research) — https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=861281 (not verbatim-quoted here).
- Source: analysis + NIST (T2, listed, not relied on for a number).
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: High.
- Grid translation: for each egress/access decision, output a two-line verdict: `code-floor: PASS/FAIL @ <section/edition/jurisdiction>` and `operational: OK/AT-RISK — <reason>`. Never let a `code-floor: PASS` imply `operational: OK`.
- Exceptions / failure mode: The inverse trap also exists: designers "gold-plate" beyond code and get blocked for other reasons (area/height `CODE-13`). Symptom to name: 2-tile corridors everywhere "because code allows 1.0 m" for a 120-person floor.

---

## How to flag instead of fake
When a compliance claim cannot be verified, do **not** invent a section number or a value. Emit a
structured flag. Minimum fields:

```
ISSUE: <one-line description of the compliance question>
CHECK: <which rule this touches, e.g. CODE-05 corridor width>
ATTEMPTED SOURCE: <doc + section + edition + jurisdiction you tried>
VERIFICATION: verified(T1/T2) | partial(T3 mirror of paywalled primary) | UNVERIFIED
REQUIRED DATA: <what you'd need to actually decide it, e.g. "adopted local IBC edition", "occupant load of served space", "sprinkler status">
CONSERVATIVE DEFAULT: <the safe assumption to design to until verified>
FLAG-LEVEL: BLOCKER | REVIEW | ADVISORY
```

Rules of conduct:
- **Never state an unverified number as a code requirement.** If you can't cite doc+section+edition+jurisdiction, it is `UNCITED — verify against the applicable code edition`, confidence Low, and phrased as a *question*, not a fact.
- **Never invent a section number.** If you remember the rule but not the number, write `section: UNKNOWN (verify)` — an invented cite is worse than an admitted gap because reviewers trust citations.
- **Name the edition and jurisdiction, or say you can't.** A bare "IBC says 44 in" is unverifiable; "IBC 2021 §1020.1 (model, verify local adoption)" is auditable. Note that even a correct-looking cite can be wrong: six section numbers in this file were found to disagree with the very edition they were stamped with, so re-read the clause before quoting it.
- **Choose a conservative default and say you did.** Example: unsure whether a corridor must be 36 in or 44 in → design 44 in (3 tiles) and note the cost of being wrong; never default to the laxer number.
- **Escalate the "satisfies-code-but-fails-operations" cases** (`CODE-28`, `CODE-23`, `CODE-24`) as `REVIEW` even when the arithmetic passes — geometry compliance ≠ operational safety.
- **Prefer a `BLOCKER` over a guess** for anything that removes a way out (exits, refuge, distance-to-safety in the sim's lift-only model), since those can't be retro-fixed by decoration.

---

## Numbers register

> **What the `verified?` column means.** `yes` = the figure was read from a page reachable in the audit session named in the
> row - it does **not** mean verified against the law as adopted in your jurisdiction, and it is not a
> compliance statement. `partial` = a secondary rendering of a primary that could not be opened.
> `no` = not established this pass; do not quote the number as a code requirement.


**What `yes` does and does not mean here: a `yes` in this table means "read from the reachable
page in that session", NOT "verified against adopted law".** It is a statement about fetch
success on a specific URL on a specific day, not a legal finding. Section numbers carry the same
caveat — several were re-checked against the edition they were stamped with and did not match.

Legend for **verified?**: `yes` = read directly from a T1 primary/government page this session;
`partial` = T3 rendering of a paywalled/403 primary (ICC codes.iccsafe.org returned 403), figures
are standard-but-confirm; `no` = recollection/convention, **UNCITED**, or a figure the stamped
page does **not** carry.

| Value | Unit | Tiles-equiv | Source doc | Section | Edition | Jurisdiction | verified? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Business 150 / assembly-standing 5 / chairs 7 / tables 15 / classroom 20 / residential 200 / commercial-kitchen 200 / institutional inpatient-treatment 240 / outpatient 100 / sleeping 120 / dorm 50 / day-care 35 / merc-storage 60 / warehouse 500 (ft² per occupant) | ft²/person | e.g. business ≈55.8 tiles; seated-assembly ≈5.6 tiles | IBC Table 1004.5 | 1004.5 | 2021 | US (WA govt mirror) | **yes (T1)** |
| Stair capacity 0.3; level/door 0.2 (sprinklered 0.2 / 0.15) | in/occupant | n/a (per occupant) | IBC | 1005.3.1 / 1005.3.2 | 2021 | US | partial (T3) |
| Exits: 1≤49 / 2=50–500 / 3=501–1000 / 4>1000 | occupants | n/a | IBC | 1006.2.1 / 1006.2.1.1 | 2021 | US | partial (T3) |
| Common path 75 ft (H reduced; sprinklered varies) | ft | ≈46 tiles | IBC | Table 1006.2.1 | 2021 | US | partial (T3) |
| Travel dist A/E/F1/M/R/S1 200/250; B 200/300; F2/S2/U 300/400; I-2/I-3 NP/200 (unspr/sprink) | ft | 200ft≈122 tiles | IBC | Table 1017.2 | 2021 | US | partial (T3) |
| Dead ends 20 ft gen / 50 ft sprink / 30 ft I-2 non-patient | ft | 20ft≈12 tiles | IBC | 1020.5 | 2021 | US | partial (T3) |
| Corridor 44 in (≥50 occ) / 36 in (<50) | in | 3 tiles / 2 tiles | IBC | 1018.2 | 2021 | US | partial (T3) |
| Stair riser ≤7 / tread ≥11 / uniformity ≤3/8 | in | n/a (decorative) | IBC | 1011.5.2/.5.4 | 2021 | US | partial (T3) |
| Stair width ≥44 in (36 in <50); headroom 80 in; handrail 34–38; guard 42 | in | 3 tiles / 2 / — | IBC | 1011.2/1011.3/1012.7/1015.3 | 2021–2024 | US | partial (2024 renumber; Low on headroom/sections) |
| Egress door clear ≥32 in; interior opening force ≤5 lbf; swing-out ≥50 occ A / H | in / lbf | 2-tile door | IBC | 1010.1.1/.1.2/.1.3 | 2021 | US | partial (T3) |
| Exit remoteness ≥1/2 max diagonal; 1/3 sprinklered | ratio | n/a | IBC | 1007.1.1 | 2021 | US | partial (T3) |
| I-2 smoke compartment ≤22,500 sf; bed-path door clear 41.5 in; travel 200 ft sprink | sf / in / ft | ≈8,360 tiles / 3 tiles / 122 tiles | IBC | 407.5.1 / 1010.1.1 / 1017.2 | 2021 | US | partial (T3) |
| Shaft enclosure ≥2 hr where 4+ stories (1 hr ≤3 tier NOT verified) | hr | n/a | IBC | 713.4 | 2021 | US | partial (2-hr yes; 1-hr **no**) |
| B area/floor: II-A 23k / II-B 19k / III-A 18k / III-B 12k / IV 18k / V-A 14k / V-B 9k sf; heights 40–65 ft, 2–4 st | sf / ft | V-B 9k sf = 836 m² = **3,344 tiles** (1 tile = 0.25 m²; ×4); V-A 14k sf = 1,301 m² = 5,203 tiles | IBC | Table 504.3 / 506.2 | 2024 | US | partial (T3) |
| R-1 / R(4+ story) sprinklered; sleeping-area smoke detection | — | n/a | IBC | 903.3.1 / 907 | 2024 | US | partial (T3) |
| High-rise 2 stairs / pressurisation / standpipe / fire pump / refuge floors | — | — | IBC | 403 / 909 / 905 / 913 | 2021 | US | **no** (verify trigger & list) |
| Area of refuge: 2× 30×48 in spaces; two-way comms | in | 2×(2×3) tiles | IBC | 1009 | 2021 | US | **no** (up.codes returned ADA not 1009) |
| Horizontal-exit floor area 3 ft²/person; ≥half exits via other types | ft² | n/a | NFPA 101 | 7.2.4 | 2024 | US | **no (NFPA link 404s this pass; NFPA 101 full text paywalled — figure is standard recollection, not read)** |
| Accessible route 36 in min / 32 in × ≤24 in | in | 2 tiles | 2010 ADA | 403.5 | 2010 | US | **yes (T1)** |
| Ramp slope ≤1:12; run rise ≤30 in; landings ≥60 in | — | n/a (slope off-grid) | 2010 ADA | 405.2/405.6/405.7 | 2010 | US | **yes (T1)** |
| Change in level: bevel ≤1/2 in, vertical ≤1/4 in | in | n/a | 2010 ADA | 303/403.4 | 2010 | US | **yes (T1)** |
| Reach: high ≤48 in / low ≥15 in; 44 in over >20 in depth | in | n/a (vertical) | 2010 ADA | 308.2/308.3 | 2010 | US | partial (T3 corada, verbatim) |
| Door maneuvering pull 60/48/54/42 in | in | 3–4 tiles beside | 2010 ADA | Table 404.2.4.1 | 2010 | US | partial (T3 corada) |
| Guest rooms w/ mobility features (Table 224.2 tiers) | %/count | n/a | 2010 ADA | 224.2 | 2010 | US | partial (T3 corada) |
| Escape travel: single vs multi-direction benchmarks 12/18/25 m; 25/45/60 m | m | 24–120 tiles | Approved Doc B | §2/§3 tables | 2019 | England | partial (T3; **verify para + edition**) |
| Stair rise ≤220 / going ≥220 mm; pitch ≤38°; 2R+G 550–700 mm | mm | n/a (decorative) | Approved Doc K / B | K1/B | 1992/2013/2019 | UK | partial (T3 trade; headroom ~2 m **no**) |
| Accessible entrance door ≥775 mm clear (leaf ≥800); threshold ≤15 mm; route 900/1200; WC 900×1500 | mm | 2 tiles / n/a | Approved Doc M | Vol1 §2.9+ | 2015 | England | partial (T3 squote; **verify edition**) |
| Travel to exit Class 2/3 room ≤20 m; Class 5–9 floor ≤20 m to an exit / ≤40 m to the furthest; ground 5/6 single exit 30 m; doorway ≥750 mm | m / mm | 20m=40 tiles, 40m=80 tiles | NCC Vol One | D2D5 / D1.6 | 2022 | Australia | **partial (gov page reached; the specific figures were not on it this pass — verify adopted edition)** |
| NCC exit width aggregate "1 m + 250 mm per 25 persons over 100"; ≥2 exits for many Class 2–8 | m / count | — | NCC Vol One | D1.6(c) / D2D3 | 2019-A1 / 2022 | Australia | **partial (gov page reached; the specific figures were not on it this pass — verify adopted edition)** |
| EU member-state / Singapore SCDF Fire Code / Japan Building Standard Law | — | — | national regs | UNKNOWN | UNKNOWN | EU / SG / JP | **no — UNCITED, verify** |
| Kitchen/grease/refuse/laundry clearances; patient-room circulation; nurse-unit↔lift adjacency | — | — | Fire/health/FGI guidance (not IBC egress) | n/a | varies | US/UK | **no — UNCITED convention** |

---

## Sources
- **Washington State Legislature — adopted IBC Table 1004.5** — https://lawfilesext.leg.wa.gov/Law/WAC/WAC%20%2051%20%20TITLE/WAC%20%2051%20-%2054A%20CHAPTER/WAC%20%2051%20-%2054A-1004.htm — **T1** — US — IBC 2021 as adopted. *(occupant load)*
- **US Access Board — 2010 ADA Standards Ch.4 Accessible Routes** — https://www.access-board.gov/ada/chapter/ch04/ — **T1** — US — 2010. *(route width, ramp slope/rise/landings, change of level)*
- **US Access Board — ADA guide Ch.4** — https://www.access-board.gov/ada/guides/chapter-4-accessible-routes/ — **T1** — US. *(corroboration)*
- **Corada — mirror of 2010 ADA Standards** §224 / §308 / §404 — https://www.corada.com/documents/2010ADAStandards/224 , /308 , /404 — **T3** (verbatim rendering of T1 primary; confirm at ada.gov). *(reach, guest rooms, door maneuvering)*
- **up.codes (ICC renderings, IBC 2021/2024)** — https://up.codes/s/means-of-egress-sizing , /s/egress-based-on-occupant-load-and-common-path-of-egress-travel-distance , /s/limitations , /s/corridor-width , /s/dead-ends , /s/stair-treads-and-risers , /s/doors-gates-and-turnstiles , /s/fire-resistance-rating , /viewer/new_jersey/ibc-2021/chapter/10/means-of-egress — **T3** — US. *(egress sizing, travel, corridor, dead ends, stairs, doors, shafts, remoteness)*
- **ICC Digital Codes — IBC Ch.10 / Ch.5 / Ch.7 / §404** — https://codes.iccsafe.org/s/IBC2021P1/... — **T1 primary, could NOT be fetched (HTTP 403 to automated fetch this session)** — cited as the authoritative text the T3 mirrors reproduce.
- **US Made Supply — IBC Ch.10 & I-2 healthcare egress** — https://usmadesupply.com/resources/building-codes-standards/emergency-life-safety/ibc-chapter-10 , /ibc-i2-healthcare-egress — **T3** — US.
- **MeltPlan — IBC height/area, fire-resistant construction, fire-protection systems** — https://www.meltplan.com/buildingcodes/ibc/building-height-area-limits , /fire-resistant-construction , /fire-protection-systems — **T3** — US — IBC 2024.
- **DataDrivenAEC — IBC handrail/guard, egress width** — https://datadrivenaec.com/insights/ibc-guardrail-handrail-requirements , /insights/how-to-calculate-egress-width — **T3** — US — 2024.
- **NFPA — Life Safety Code (NFPA 101) horizontal exits blog** — https://www.nfpa.org/news-blogs-and-articles/blogs/2024/05/22/horizontal-exits-overview — **T1 (standards body, explanatory)** — US — 2024. *(full NFPA 101 text is paywalled; only the free explanatory page was reachable)*
- **NIST — "The basis for egress provisions in US building codes"** — https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=861281 — **T2** — US. *(principles/history; not quoted for a number)*
- **GOV.UK — Approved Document B (fire safety) Vols 1 & 2** — https://www.gov.uk/government/publications/fire-safety-approved-document-b + [no direct PDF path available — the publications landing page above is the only reachable locator; an earlier draft printed a placeholder path here, which must not be treated as a retrieved document] — **T1 (primary PDF, not machine-readable this session)** — England.
- **fire-risk-assessment-network — UK travel distance** — https://fire-risk-assessment-network.com/blog/travel-distance-fire-risk-assessments/ — **T3** — England. *(12/18/25, 25/45/60 m benchmarks)*
- **squote.app — Approved Document M (Part M) door widths/thresholds/ramps** — https://squote.app/knowledge/compliance/part-m-access — **T3** — England — AD M 2015 Vol1.
- **turnings.co.uk — Approved Document K stairs** — http://www.turnings.co.uk/stair-regulations.html — **T3** — UK — AD K (1992 lineage).
- **NCC — National Construction Code (ABCB) Vol One Part D2 & D1** — https://ncc.abcb.gov.au/editions/ncc-2022/adopted/volume-one/d-access-and-egress/part-d2-provision-escape , .../ncc-2019-a1/.../part-d1-provision — **T1 (gov)** — Australia — NCC 2022 / 2019-A1.
- **2010 ADA Standards (DOJ full text)** — https://www.ada.gov/law-and-regs/design-standards/2010-stds/ — **T1** — US — 2010 (fetch returned scoping, not tables).
- *(Deliberately empty / uncited: EU transpositions, Singapore SCDF Fire Code, Japan Building Standard Law — no reachable English primary this session.)*

---

## Weak or contested
- **ICC primary numbers (most of Ch.10/7/5/9):** codes.iccsafe.org returned **HTTP 403** to the fetcher, so IBC figures come from **T3 renderings** (up.codes/US Made Supply/MeltPlan). Directionally reliable, but the *exact adopted value depends on your jurisdiction and edition* — treat every IBC number as `partial` until checked locally.
- **2018 vs 2021 vs 2024 IBC renumbering:** handrail/guard moved (≈1012/1015 → 1014/1015 family); travel-distance and door sections shift; several values changed. A number quoted as "2021" may not be the law where you build.
- **IBC 713.4 (1-hr for shafts ≤3 stories) — NOT verified;** only the "2 hr where connecting 4+ stories" was retrieved. Flagged `no`.
- **IBC §1009 area-of-refuge dimensions** — up.codes slug returned the *ADA* text, not IBC 1009; the 30×48 in / two-spaces figures are standard recollection, marked **no (verify)**.
- **High-rise trigger (75 ft) and the §403 clause list** — recollection, not verbatim; marked **no**.
- **NFPA 101 (health care) chapter specifics** (Ch.18/19 bed release, exact travel distances, night-staff) — the full standard is **paywalled**; only the free horizontal-exit blog was reachable. Bed-release/smoke-compartment *mechanism* is sound; *numbers* not retrieved → do not cite NFPA 101 clause values from this file.
- **Approved Document B** — the 2026 gov.uk PDF isn't machine-readable here; travel-distance benchmarks (12/18/25/45/60 m) came from a **T3 blog** and the edition/paragraph refs are **unconfirmed**. ADB changed materially post-Grenfell (2020–2026) — do not treat the blog figures as current law.
- **Approved Document K headroom (2 m) and max-risers-in-flight** — not retrieved verbatim; **no**.
- **Approved Document M figures** — from T3 squote, edition 2015 Vol1; AD M has 2016/2022/2024 updates — **partial/verify**.
- **NCC capacity factors (mm/person on level vs stair)** — the D1 page gave the 750 mm door and the "1 m + 250 mm/25 over 100" aggregate but not the per-person mm table; do not state a specific mm/person NCC figure — **verify D1.13**.
- **Kitchen / refuse / laundry clean-vs-dirty separation, patient-room circulation (~36 in around bed), nurse-unit↔lift adjacency** — these are **infection-control / FGI-guidelines / health-department practice**, NOT life-safety/egress code. Any number you'd attach here is **UNCITED** — never present as a code requirement.
- **EU / Singapore / Japan** — included as *known-varying regimes*; zero verified figures. Do not quote a number for them from this file.
- **Gross vs net floor area** in the occupant-load table shifts which factor applies per use — mis-tagging gross/net changes headcount and therefore every downstream width/exits/compartment number.

---

## Type-specificity audit
Which of these rules are genuinely universal vs only true for a building type, and where the "hotel"/"hospital" cases actually *diverge* from the generic rule:

- **Truly universal (every occupancy):** CODE-01 (compute load), CODE-02 (exits by load), CODE-03 (common path), CODE-04 (capacity, stair≠level), CODE-06 (dead ends), CODE-07 (travel distance), CODE-08 (remoteness), CODE-10 (egress doors), CODE-11 (discharge to safe), CODE-13 (height/area/type), CODE-14 (rated vertical openings), CODE-18/19/20/21 (accessibility), CODE-27 (round up), CODE-28 (floors not targets).
- **Occupancy-conditional numbers:** CODE-05 (44 vs 36 in by served load), CODE-15 (smoke compartments are mandatory mainly for I-2/I-3, large floors, high-rise), CODE-12 (refuge on multistory non-open floors), CODE-17 (only past the high-rise trigger).
- **Hospitality (R-1) divergences:** CODE-25 (mandatory sprinklers + sleeping-area smoke detection; corridor/exit doors self-closing when part of rated enclosure; communicating guest-room doors restricted); CODE-22 (guest-room accessible ratio, dispersion); CODE-13 tighter area for unsprinklered R; atrium guest-room-openings limits (`CODE-16`). *What changes vs generic:* sprinklers are assumed, so travel distance/capacity credits become available — but only if you actually show coverage; and refuge/egress must serve non-resident, disoriented, sometimes-locked occupants.
- **Healthcare (I-2) divergences — the biggest shift:** defend-in-place (CODE-15 smoke compartments ≤22,500 sf, horizontal movement, staff-operated), bed-movement door width 41.5 in (CODE-24), wider corridors ≥3 tiles, controlled-egress locks allowed on some doors (CODE-10 exception), sprinklers mandatory (NP unsprinklered, CODE-07), night-staff requirement (operational, not width). *What changes:* the occupant **may not be expected to self-evacuate down stairs** — so CODE-12 refuge, CODE-15 compartments, and staffing, not exit stair capacity, carry the life-safety case. Clean/soiled separation and nurse-unit↔lift adjacency are *planning/infection* concerns (CODE-26), not egress code.
- **Commercial / retail (M/B):** CODE-13 area/height dominates; occupancy load factors low headcount so egress rarely governs. *Corrected:* this file previously asserted "assembly of mall concourse uses 100 ft² gross" — the WA-adopted page read puts **100 gross on the TRANSIT concourse** and **15 gross on the airport concourse**, and sends **mall / mercantile concentration of people to §402.8.2** instead, so that attribution was wrong (`CODE-01`).
- **Education (E):** CODE-01 classroom 20 net + corridor from served rooms; CODE-10 swing-out for E thresholds; CODE-07 travel. Lockable classrooms are a security/egress tension (CODE-10).
- **Detention (I-3/I-4):** locked-egress is inverted (controlled egress standard), CODE-10 locks, CODE-15 smoke compartments, CODE-07 sprinkler-extended travel.
- **Civic / transit / assembly (A/E):** fixed-seating counts override area factors (CODE-01), CODE-10 swing thresholds low (50/assembly), CODE-16 atria/voids common.
- **Industrial (F/S):** high-area, CODE-13 type-of-construction limits bite hardest, H-areas tighten common path / travel (CODE-03/07), large floor exceeds grid travel-distance tiers (CODE-07 grid note).

**Net for the design agent:** the *logic* (load → exits → path → capacity → protection of the route → accessibility → refuge) is design law across IBC/NFPA 101/ADB/NCC; the *numbers and the mandatory add-ons* are jurisdiction- and building-type-specific, so run each rule with an explicit `(occupancy, building type, sprinkler status, local edition/jurisdiction)` context, and `flag-instead-of-fake` wherever that context isn't pinned down.
