# 500-person arrival lobby — code / capacity extraction

Source-bounded. Every line below comes ONLY from:
`architecture-skill/SKILL.md` (Human Scale :336-358, Building Programming :256-279,
Grid / Tile Translation :479-612), `research/building-codes.md`, `research/human-scale.md`,
`research/multi-scale.md`, `research/synthesized-rules.md`.

Legend on every line:
- `FACT` — quoted/paraphrased from the KB, with rule ID + cited source + the KB's own confidence marker.
- `INFERENCE` — my arithmetic on a FACT. Not a code figure.
- `not in the KB` — the KB does not state it. No number invented.
- `not representable` — the KB itself rules it unmodellable on this grid.

Grid constants (`FACT` — SKILL.md:485-494 host model):
1 tile = 0.5 m × 0.5 m = 0.25 m²; 4 tiles = 1 m²; 2 tiles = 1.0 m; wall = 1 blocked tile (0.5 m);
door = run of door tiles, "2 tiles ≈ 1.0 m clear"; room W×H outer → (W−2)(H−2) usable;
tile states `walkable | blocked | door` only; no section, no heights, no slab/column/material.
`FACT` — SKILL.md:497-499: the metre scale is a project convention, not engine data; "an agent must
not imply the model enforces it".

Envelope used for all arithmetic below (`INFERENCE` from the task brief, not from the KB):
64 × 34 = 2,176 tiles = 544 m² gross buildable; one-tile perimeter wall → clear interior
62 × 32 = 1,984 tiles = 496 m².

---

## 1. Occupant load factors / density figures

### 1a. The occupant-load duty

- `FACT` `CODE-01` — "For every room/space, divide its occupable floor area by the
  occupancy-specific area-per-person factor to get occupant load; use that headcount (not the number
  of chairs/people you drew) as the input to every other rule here." Source: IBC Table 1004.5 as
  published in the WA-adopted code (T1 page). Class CODE REQUIREMENT, scope universal.
  Confidence: "Medium-High for the factors that matched on re-read; **Low for standing-space,
  exhibit-hall, residential, and for both concourse/mall attributions**." (building-codes.md:109-117)
- `FACT` `CODE-01` grid translation, verbatim: "occupants = walkable_tiles × 0.25 m² ÷ factor(m²/person);
  150 ft² ≈ 13.9 m² ≈ 55.8 tiles/occupant (business, **area** basis); 15 ft² ≈ 1.39 m² ≈ 5.6 tiles
  (seated assembly, **area** basis)."
- `FACT` `CODE-01` failure mode, verbatim: "High-density uses (nightclubs, queues) understate real load."
- `FACT` `SR-06` — "occupant load → required exit count → egress width → travel distance and common
  path → remoteness, per floor and per space, **before the plan is shaped**" (synthesized-rules.md:142-149).
- `FACT` `SR-05` — "Route width = max(flow requirement, legal width)… compute the legal floor for the
  served occupant load, take the larger, round up" (synthesized-rules.md:133-140).
- `FACT` tension register 5 (synthesized-rules.md:425-426) — "Occupant-load factors: net vs gross.
  Mis-tagging the basis changes headcount and every downstream width. Status: report which basis was
  used per space (CODE-01, SP-07)."

### 1b. Factors that ARE in the KB (IBC Table 1004.5, ft²/person)

`FACT` — from CODE-01 evidence (building-codes.md:111) + numbers register row 1
(building-codes.md:442, `verified? = yes (T1)`, IBC 2021, US/WA mirror):

| Use named in the KB | ft²/person | m²/person `INFERENCE` | tiles/person `INFERENCE` | KB status |
|---|---|---|---|---|
| Business (gross) | 150 | 13.94 | 55.8 | Medium-High |
| Assembly — chairs only (net) | 7 | 0.650 | 2.6 | Medium-High |
| Assembly — tables and chairs (net) | 15 | 1.394 | 5.6 | Medium-High |
| Assembly — standing space (net) | **5 or 15 — UNRESOLVED** | 0.465 / 1.394 | 1.9 / 5.6 | **Low**; two re-reads of the same T1 page returned 5 and 15 |
| Commercial kitchen (gross) | 200 | 18.58 | 74.3 | Medium-High |
| Dormitory (gross) | 50 | 4.65 | 18.6 | Medium-High |
| Institutional outpatient (gross) | 100 | 9.29 | 37.2 | Medium-High |
| Sleeping (gross) | 120 | 11.15 | 44.6 | Medium-High |
| Mercantile | "300 / 60 gross" | — | — | the KB flags its own list as wrong here |
| Transit concourse | 100 gross | 9.29 | 37.2 | the KB re-attributes 100 gross to transit, 15 to airport concourse |
| Exhibit hall 30 net / Residential 200 gross | — | — | — | **`not in the KB` as verified**: "not surfaced on the page at all" |
| Mall | — | — | — | points to §402.8.2 (mere concentration of people), "not to a table factor" |

`FACT` — CODE-01 explicitly instructs: "**do not treat these four as verified**" for
standing-space, exhibit-hall, residential, concourse/mall attributions.

### 1c. What the task asked for that the KB does NOT have

- "standing waiting" as a named occupant-load factor → `not in the KB`. Nearest FACT is
  `Assembly — standing space` (5 or 15 ft², unresolved above).
- "lobby / arrival undivided area" as a named factor → `not in the KB`. No row in the KB's Table
  1004.5 transcription is named lobby, arrival, waiting area, or entrance hall. `INFERENCE`: the only
  candidate factors are Business 150 gross (undivided-area logic) or an Assembly standing factor;
  **which occupancy group a hotel lobby falls in is not decided anywhere in the KB** → `REQUIRES CODE
  VERIFICATION`, not an agent choice.
- "seated waiting" as a named factor → `not in the KB` under that label. `INFERENCE`: the KB's
  `Assembly chairs-only 7 ft² net` is the nearest stated seated-assembly factor; a lounge-chair
  lobby is not the same use and the KB does not bridge that gap.
- "queue standing" factor → `not in the KB` as an occupant-load factor; the KB only warns that
  queue uses "understate real load" (`CODE-01`). Queue capacity is instead modelled physically —
  see §5.
- "circulation" occupant-load factor → `not in the KB`. `FACT` instead: `CODE-01` — "Corridors take
  load from the rooms they serve" (derived, not factored).

### 1d. Density figures that ARE in the KB (person-based, not factor-based)

`FACT` — SKILL.md:591, carried-constants row "Standing density: capacity / comfortable standing /
walking" = **1-2 / ~5 / 9-15 tiles per person** = **0.25-0.5 / ~1.2 / 2.3-3.8 m² per person**.
Class, verbatim: "**FACT** against published walkway and queue bands (HCM/FHWA LOS bands, IMO queue
density) — **the 1-2 tile figure is the packed end, not a comfort default**". Evidence lives in
`human-behavior.md` HB-01, HB-20 (outside this task's read set, so the band is quoted here with the
KB's own class label and no further precision).

`FACT` — `HS-03` (human-scale.md:40-48), STANDARD + CODE REQUIREMENT, Confidence "High for the tile
band, Medium for the exact code numbers": single-file person route = 1.0 m (2 tiles); comfortable
single = 1.2 m; two passing = 1.5 m (3 tiles); two wheelchair passing = 2.0 m (4 tiles);
"Never credit a 1-tile (0.5 m) route as walkable circulation for a person."

`FACT` — SKILL.md:585 corridor row: single file / passing / queuing = **1 / 2 / 3 tiles** =
0.5 / 1.0 / 1.5 m. Class "HEURISTIC + code floor for widths" (CODE-05/27, PP-10/11).

### 1e. What 500 people means against those figures (`INFERENCE`, arithmetic only)

| Basis (all from 1b/1d) | m² needed for 500 | tiles needed | Fits the 1,984-tile / 496 m² clear interior? |
|---|---|---|---|
| Business 150 gross | 6,968 m² | 27,870 | **No — 14× the entire buildable envelope** |
| Assembly standing @15 ft² | 697 m² | 2,787 | **No** |
| Comfortable standing ~1.2 m² (5 tiles/person) | 600 m² | 2,400 | **No — 8% over the envelope, 21% over the clear interior** |
| Assembly chairs-only 7 ft² net | 325 m² | 1,300 | Yes, as bare seats only — leaves 684 tiles / 171 m² for desks, queues, WCs, lifts, circulation |
| Assembly standing @5 ft² | 232 m² | 930 | Yes — and this is the figure whose value is **unresolved** |
| KB packed capacity band 0.25-0.5 m² | 125-250 m² | 500-1,000 | Yes |

- `INFERENCE`: the reverse reading — 496 m² clear interior ÷ 500 people = **0.99 m²/person =
  3.97 tiles/person**. That sits *below* the KB's comfortable-standing band (~5 tiles) and *above*
  the packed band (1-2 tiles). So 500 people fill the entire clear envelope standing shoulder to
  shoulder with **zero tiles left for any fixture, desk, queue, WC, lift lobby or circulation route**.
- `INFERENCE`: the reverse occupant-load reading of the same envelope — what the grid's own area
  justifies: at Business 150 gross the 496 m² interior yields **≈36 occupants** (544 m² gross ≈ 39).
  At Assembly standing 5 ft² it yields ≈1,068; at 15 ft² ≈356. **The unresolved 5-vs-15 ft² cell is
  the single lever that decides whether "500 in the lobby" is code-derivable at all on this geometry.**
- `FACT` governing verdict — SKILL.md:596-597: "Anything in this table that a project's jurisdiction,
  system or type can override must be re-derived from the named file at use time; the row is a
  starting default, **never a compliance statement**."

---

## 2. Plumbing fixture counts + accessibility

### 2a. Fixture counts per occupant — the headline

- `not in the KB` — **water closets per occupant, by sex**: no fixture-scoping table exists anywhere
  in the four files read. `CODE-21` covers only *clearances* around a WC, never *how many*.
- `not in the KB` — **urinals per occupant / male-female ratio**.
- `not in the KB` — **washbasins per occupant**.
- `not in the KB` — **drinking fountains per occupant** (zero hits for drinking/fountain across all
  four files).
- `FACT` (structural reason, and it is stated): cross-domain finding 3, synthesized-rules.md:474-478 —
  "Every domain independently refused to state an unsourced number. Their `## Weak or contested`
  sections name the same gaps: no readable hotel BOH ratio, no readable lift-traffic constant, no
  readable span tables, no readable HCM flow rates… **the rule set therefore contains no invented
  numbers — and those specific quantities must be retrieved or assumed-in-the-open before use**".
- `FACT` — SKILL.md:268-269 (Building Programming 3): "No universal ratio exists; do not import one."
- Pointer, outside this task's assigned read set (`FACT` that it exists, `not verified` here):
  `operations-maintenance.md:248` cites OSHA 29 CFR 1910.141(e) Table J-1 "1 water closet for 1-15
  persons, 2 for 16-35" and NHS HBN 04-01 "WC: ambulant … 1 for up to 20 lockers". Those are
  **workplace/employee** scopes capped at 35 persons, not public-assembly fixture scoping, and they
  are not in the file set this task was given. Recorded so the gap is not silently re-filled later.
- Consequence `INFERENCE`: any WC/urinal/basin count drawn into a 500-person lobby is an
  **assumed-in-the-open project number**, and per `CODE-28`-style logic must carry
  `REQUIRES CODE VERIFICATION`. It may not be presented as "real architecture standards".

### 2b. Accessibility — what the KB DOES bind

- `FACT` `HS-07` (human-scale.md:80-88), CODE REQUIREMENT, Confidence "High for the §305/§604 family,
  Medium for exact side-wall ranges as recalled". 2010 ADA §604/§606/§608/§305.2.
  Water closet: 1.5 m min clear floor perpendicular to rear wall × 0.76 m wide; 380-430 mm centreline
  to side wall; clear transfer side. Basins: 0.76 × 1.2 m forward approach. Showers ≤1.5 m²: adjacent
  0.76 × 1.2 m clear space. Grab rails 840-915 mm AFF.
  Grid: "0.76 × 1.22 m → 2 × 3 tiles pass; 1.52 × 1.52 m → 4 × 4 tiles, **over-provides 1.16 m²**;
  0.38-0.43 m centreline offset → **not expressible** (half-tile offsets are impossible) … verify
  against the 16-18 in band as *failing by grid quantisation* and widen instead."
  Check: "`WC tile-adjacency: ≥ 3 clear tiles in front, ≥ 1 clear tile on the transfer side, no door
  tile inside the clear space`".
- `FACT` `HS-08` (human-scale.md:90-98), **class demoted to HEURISTIC**, Confidence "Medium for
  2200/2250 mm, High for the derived tile areas". Accessible WC compartment 2250 × 2250 mm single-leaf,
  2250 × 2700 mm double-leaf; US test = 60 in clear circle inside the stall.
  Grid check, verbatim: "`accessible WC interior tiles ≥ 16` (= 4.0 m²) — generous but grid-safe."
  Failure mode, verbatim: "**A shared party wall halves the tax, so two back-to-back WCs are much
  cheaper than a single one — this is the grid's strongest argument for ganged sanitary cores.**
  Symptom: 12 separate single-tile-thick WCs, each eating 40 % of its footprint in wall."
  → `INFERENCE`: one accessible WC = 6 × 6 outer tiles = 36 tiles = 9.0 m² of plate.
- `FACT` `CODE-21` (building-codes.md:316-318), reach band + sanitary clear floor. Reach high ≤48 in
  / low ≥15 in (ADA §308, verbatim-read). Grid: "reach band 15-48 in = 0.38-1.22 m
  (**vertical — not modelled**); sanitary clear floor 60 in = 3.05 tiles → **4 tiles (round UP per
  CODE-27; 3 tiles = 1.5 m is *below* 1525 mm)**". ADA ch.6 fixture clearances = `no (not found at
  the cited source)`; UK AD M "WC needs 900×1500 mm clear floor" = `no`.
- `FACT` `CODE-18` (building-codes.md:279-287), CODE REQUIREMENT, Confidence High for widths /
  Low for changes-in-level. ADA §403.5 route clear width **36 in (915 mm)**, 32 in for ≤24 in pinch
  segments separated by ≥48 in. Grid: "36 in = 1.83 tiles → **2 tiles (1.0 m) route as default**;
  a 1-tile (0.5 m) route is **not** an accessible route. 2 tiles against a 36 in minimum over-provides
  +97 mm linear (+24 % linear / +44 % area — quote the basis you mean)."
  Validation: "an accessible route may not dead-end and may not require backtracking more than turning space."
- `FACT` `HS-04` (human-scale.md:50-58), CODE REQUIREMENT, Confidence High (60 in / 1500 mm),
  Medium (power-chair 1800 mm practice). Turning space = **4 × 4 tiles** (2.0 m) for the US 1525 mm
  circle, or **3 × 3 tiles** only "where the governing standard is metric (1500 mm)".
  "Never draw a circle: the grid cannot express one, so a 1525 mm circle becomes a 2.0 m square —
  **31 % more area than the code requires**." "The T-shaped ADA alternative is *not* expressable on
  this grid… do not claim credit for it."
  Check: "every accessible route has a 4×4-tile (or metric-3×3) clear square at its end and at each
  change of direction > 90°."
- `FACT` `HS-06` / `CODE-19` (human-scale.md:70-78; building-codes.md:289-303). CODE-19 is the T1
  verbatim read of ADA Table 404.2.4.1 and **overrides HS-06's shorthand** (CODE-19's source note:
  "the sibling research file's version of the same table disagrees in its side-approach rows and has
  been reconciled to this reading"). Grid, rounded UP per CODE-27: perpendicular 60 in → **4 tiles**;
  54 in → 3; 48 in → 3; 42 in → 3; parallel 36 in → 2; 24 in → 2; 22 in → 2; 18 in → **1**.
  `FACT` caveat: the with-closer / without-closer row mapping is "not machine-resolved";
  Confidence High on printed values, Low on the closer mapping.
- `FACT` `CODE-22` (building-codes.md:326-333), accessible guest/sleeping rooms. ADA Table 224.2.
  "**Tier ladder NOT verified — do not automate it yet.**" Retained ladder includes
  "401-500 → 13; 501-1000 → **3 % of total**". Basis stated verbatim: "the '3 %' here is a **COUNT
  ratio** (accessible rooms ÷ total rooms) — it is neither a linear nor an area percentage and
  **must never be applied to floor area**." Grid: "accessible rooms disperse across floor levels,
  not stacked on one bad corner."
- `FACT` SKILL.md:356-357 (Human Scale): "Accessibility is a continuous route requirement, and route
  erosion at small fixtures is where it actually fails (PP-22, CODE-18/19/21). **Count it from site
  arrival inward, not from door to door.**"
- `FACT` tension register 4 (synthesized-rules.md:422-424): "Accessibility by arithmetic vs by
  erosion. Width checks pass while routes fail at small fixtures (PP-22). Status: both classes of
  check are mandatory; the width check may not stand in for the route check."

---

## 3. Egress: exits, clear widths, travel distance, door runs

### 3a. Exit count

- `FACT` `CODE-02` (building-codes.md:119-127). The tiers this file carries — "1 exit up to 49;
  **2** for 50-500; **3** for 501-1,000; **4** above 1,000, IBC 2021 Table 1006.2.1 + 1006.2.1.1" —
  are flagged verbatim: "**UNVERIFIED AS TO THRESHOLDS — do not encode as a validator**",
  "**not found at any source reached**", Confidence "**Low for the numeric breakpoints**",
  `verified? = no (not found at the cited source)`.
- `FACT` `CODE-02` **BLOCKER instruction, verbatim**: "until Table 1006.2.1 is read from an
  adopted-edition text, emit '**required exit count: UNKNOWN (verify)**' instead of a tier lookup —
  a wrong breakpoint silently passes or fails whole floors."
- `INFERENCE` risk concentration: 500 occupants is the **last** headcount in the file's "2 exits" tier
  and 501 trips to 3. The unverified ladder therefore has its maximum consequence exactly at this
  project's target number. Per CODE-02 the correct output is UNKNOWN (verify), not "2".
- `FACT` `CODE-02` grid translation: "Count door-runs that reach a *different* safe place… exits must
  be *remote* (`CODE-08`), so two doors on the same wall may still count as effectively one path."
  Failure mode: "one wide doorway credited as two exits."
- `FACT` `CODE-08` remoteness (numbers register building-codes.md:452): "≥1/2 max diagonal;
  1/3 sprinklered", IBC §1007.1.1, `partial (T3)`. Failure mode verbatim (CODE-08:187): "both stairs
  clustered by the lift core 'for efficiency' — operationally one way out."

### 3b. Egress width per occupant

- `FACT` `CODE-04` (building-codes.md:139-147), CODE REQUIREMENT. IBC **§1005.3.1 stairs
  0.3 in/occupant (7.6 mm)** — "**read verbatim**" from the NJ-adopted IBC 2021 Ch.10 viewer (T3),
  Confidence **Medium**. The **0.2 in** sprinklered-stair figure, **§1005.3.2** doors/level
  **0.2 in (5.1 mm)** and **0.15 in (3.8 mm)** were "**not surfaced**" — Confidence **Low**.
  `FACT` deletion, verbatim: "**DELETED FROM THIS ROW, do not restore**: '§1005.4: … 36 in typical' —
  that phrase appears in no source retrieved… write `§1005.4: section: UNKNOWN (verify)` for an
  egress-sizing floor. The only 32-in doorway minimum actually read anywhere is §1010.1.1."
- `FACT` `CODE-04` grid translation: "**width_tiles = ceil(required_width_mm / 500). Never round
  down.** Validation check: sum of the two remote exits' door-runs ≥ computed capacity, AND each ≥
  absolute-min run (a 1-tile/0.5 m door is below any 32-44 in minimum → **not an egress door**)."
- `FACT` `CODE-04` failure mode: "Capacity width and *clear* width and *nominal* run are three
  different numbers — tile runs overstate clear width (leaf, frame, handrail projection). Symptom:
  a 2-tile 'door' credited as 44 in clear when the opening leaves ~32 in."

#### 500 occupants → required door run (`INFERENCE`, applying CODE-04's own formula)

| Factor (CODE-04) | mm/occ | 500 occ | `ceil(/500)` | tiles of door run | across 2 remote exits |
|---|---|---|---|---|---|
| stairs 0.3 in (Medium conf.) | 7.62 | 3,810 mm | 7.62 → **8** | 8 = 4.0 m | 4 tiles each |
| level/door 0.2 in (Low conf.) | 5.08 | 2,540 mm | 5.08 → **6** | 6 = 3.0 m | 3 tiles each |
| sprinklered 0.15 in (Low conf.) | 3.81 | 1,905 mm | 3.81 → **4** | 4 = 2.0 m | 2 tiles each |

Sprinkler caveat `FACT` tension register 3 (synthesized-rules.md:419-421): "Travel-distance and area
relaxations assume coverage that a tile plan does not model… **otherwise use the unsprinklered
figure** (CODE-07, CODE-25)." `INFERENCE`: the same prohibition applies to the 0.15 in width credit —
so the working floor for a 500-person lobby is the **0.2 in tier = 6 tiles (3.0 m) of aggregate
door run, split ≥2 remote exits, ≥3 tiles each**, and that number carries Confidence **Low**.

### 3c. How a 4-tile door run compares

- `FACT` `HS-05` (human-scale.md:60-68), CODE REQUIREMENT, Confidence High (815/825/905 family),
  Medium (2022 AD M values pending): "1 tile = 0.5 m: acceptable only for a store/closet.
  **2 tiles = 1.0 m run ≈ 0.85-0.90 m clear** after a 40-50 mm leaf — the only accessible option on
  this grid. 3 tiles = 1.5 m for an aisle-width double door or a trolley door. Every accessible route
  door must be ≥ 2 tiles." Caveat verbatim: "the wall is 0.5 m thick, so a real door's *reveal* is
  exaggerated: a 2-tile door is a 1.0 m hole through a 0.5 m-thick wall, which behaves like a short
  tunnel for a long object."
- `INFERENCE` applying HS-05's own 0.10-0.15 m run→clear loss to a 4-tile run:
  **4 tiles = 2.0 m nominal run ≈ 1.85-1.90 m clear.**
  - vs 0.2 in tier (2,540 mm): **FAILS** — a single 4-tile door run is short by ~0.55-0.65 m clear,
    i.e. ~1-2 more tiles; two remote 4-tile runs (8 tiles / ~3.7-3.8 m clear) **pass**.
  - vs 0.15 in tier (1,905 mm): **passes on nominal, fails on clear** — this is exactly the
    CODE-04 "three different numbers" trap.
  - vs stair tier (3,810 mm): a 4-tile run alone provides ~half.
  - vs absolute minimum: 32 in clear (§1010.1.1, `CODE-10`/`HS-05`) → satisfied at ≥2 tiles.
- `FACT` `CODE-10` (numbers register building-codes.md:451): "Egress door clear ≥32 in; interior
  opening force ≤5 lbf; **swing-out ≥50 occ A / H**", IBC §1010.1.1/.1.2/.1.3, `partial (T3)`.
  `INFERENCE`: a 500-person lobby is far above the 50-occupant swing-out threshold — lobby exit doors
  must swing in the direction of egress; on this grid door swing itself is `not representable`
  (see §6).
- `FACT` `CODE-05` (building-codes.md:149-157), Confidence Medium-High on widths: corridor **44 in
  (1118 mm) / 36 in (914 mm)**, IBC §1020.1 as read (the file's own §1018.2 cite is superseded).
  Grid verbatim: "44 in = 2.24 tiles → must be **3 tiles (1.5 m)**; 36 in = 1.83 tiles → **2 tiles
  (1.0 m)** is acceptable for the 36 in case but NOT for the 44 in case. Rounding 44 in up to 1.5 m
  over-provides +118 mm linear (+34 % linear, +79 % area — the two are not interchangeable)".
  Rule: "exit-access corridors get 3 tiles by default… **Never a 1-tile 'corridor' as exit access**."
  `INFERENCE`: a 500-occupant lobby is ≥50 occupants, so the 44 in tier governs → **3 tiles minimum**
  for every exit-access leg, matching the 3-tile-per-exit result from the 0.2 in width tier.
- `FACT` `CODE-28` (building-codes.md:386-396): "Codes are floors, not targets — code-minimum ≠
  operational-minimum", citing NIST "provisions encode *headload and flow* assumptions that geometry
  alone can hide" (T2).

### 3d. Distances

- `FACT` `CODE-03` common path **75 ft ≈ 22.9 m ≈ 46 tiles** — "the number is supported, **the clause
  locator is not**"; `section: UNKNOWN (verify)`; Confidence Medium for the order of magnitude, Low
  for the clause. Grid: "A* from each tile to exit A and to exit B; the common path is the shared
  prefix… A 1-tile corridor is strict single-file — it *forces* long common paths; treat single-tile
  spines as a red flag."
  `INFERENCE`: 46 tiles = 23 m against an interior long axis of 62 tiles = 31 m. The cap consumes
  **74 % of the lobby's length**, so exit placement, not lobby size, is the binding egress constraint
  here; two remote 3-tile exits on **opposite** long walls is the only arrangement that keeps a
  500-person floor inside a 23 m common path.
- `FACT` `CODE-07` travel distance — "**THE ENTIRE TABLE BELOW IS UNVERIFIED — it is retained for the
  mechanism, not as data**"; the NJ viewer "states explicitly 'Table 1017.2 data not provided in
  source text'"; Confidence "**Low on every numeric tier**"; "**FLAG-LEVEL: BLOCKER for any distance
  check**"; "Until then emit `required travel-distance cap: UNKNOWN (verify)`."
  `FACT` the grid arithmetic the KB does supply: "if a 200 ft cap were ever confirmed it is
  61 m = 122 tiles; 300 ft = 91 m = 183 tiles."
  `INFERENCE`: the entire buildable envelope is 40 m × 20 m and its longest in-floor path is ~35 m,
  i.e. **70 tiles** — below even the most conservative unverified tier (122 tiles). Travel distance
  therefore **cannot bind a single-floor lobby on this geometry**; the binding distance rule is the
  46-tile common path, not travel distance.
- `FACT` `CODE-06` dead ends (building-codes.md:159-167), Confidence Medium-High on 20/50/30 ft tiers,
  Low on the occupancy list: "20 ft = 6.1 m ≈ 12.2 tiles → cap at **12 tiles** as the safe
  conservative integer." Failure mode named for hospitality: "Dead ends hide in branches of atria
  balconies and in **lift-lobby spurs**."
- `FACT` `CODE-27` (SKILL.md:555-557 restates it): "tiles = ceil(m / 0.5) for a minimum,
  tiles = floor(m / 0.5) for a maximum — and report `real requirement → tiles → resulting metres`."

---

## 4. Vertical transport / lifts

### 4a. The KB's explicit refusal to give a count-vs-occupants rule

- `FACT` `SR-17` (synthesized-rules.md:232-241): "Dimension portals by the peak period
  (arrival/departure waves, shift change, meal peaks, patient or guest transfer), **not by
  population**… where a real traffic analysis is required, escalate
  (`REQUIRES engineering verification`) **rather than asserting a lift count**."
  Convergence: MS-10, MS-11, MS-21, MS-23, MS-24, TH-29, PP-04, CODE-17.
  "Confidence on specific handling-capacity figures: **Medium — traffic-handling constants are
  source-dependent**."
- `FACT` `MS-10` (multi-scale.md:108-116), class DESIGN PRINCIPLE, Confidence "Medium (method High,
  numbers **Low**)": "**All three supporting URLs are unread this pass**… **no page read establishes
  any numeric threshold here**… **Numeric limits are the file's own.** The authoritative home is
  CIBSE Guide D §2 (or equivalent published HC/interval table), **not retrieved**."
  `not in the KB` — any number of lifts per N occupants, any handling-capacity percentage target, any
  acceptable waiting-interval figure. HC is defined ("percentage of a building's population transported
  in the peak five minutes") but that is vocabulary, not a threshold.
- `FACT` tension register 9 (synthesized-rules.md:441-443): "**Vertical demand needs time; the host
  has none.** Handling-capacity constants (MS-10) come from traffic analysis, while the host only
  exposes portal queues. Status: report the queue proxy as a proxy (UN-07), and **escalate the count
  itself for a traffic study**."
- `FACT` cross-domain finding 3 (synthesized-rules.md:474-478) names "**no readable lift-traffic
  constant**" as one of the KB's declared gaps.
- `FACT` SKILL.md:331-334 (Circulation): "Vertical: lifts/elevators and stairs — size the core against
  **peak demand** — arrivals/departures waves, meal peaks, shift changes, patient/guest transfer —
  and treat **lift queues as the model of vertical congestion** (TH-29, `research/multi-scale.md`).
  **Never let a floor be reachable by one portal with no alternative.**"
- `FACT` `MS-21` heading (multi-scale.md:218): "Two independent vertical egress paths from every
  occupied floor", restated inside `SR-17`'s rule text.
- `FACT` SKILL.md:621 hotel type row, verbatim: hotel's "What changes vs the generic rule set" includes
  "**front-of-house queue from arrivals math**" and "service portal separate from guest portal" and
  "accessible guest-room dispersion" — the KB names the arrivals calculation as the driver and never
  supplies its numbers.

### 4b. The portal-supply arithmetic the KB does allow

- `FACT` `MS-10` grid translation, verbatim: "For each portal:
  `supply_per_hour = car_load × 3600 / RTT_tiles` where `RTT_tiles` is the agent's modelled
  stop+travel cost (**no heights on this grid, so it is a parameter, not a measurement — declare
  it**). Building test: `Σ supply over portals in lobby ≥ peak_period_demand` AND
  `abandonment_rate(queue, patience 30 s) ≤ target`. **Percentage/interval targets:
  UNCITED — heuristic, Low.**"
- `FACT` `MS-23` (multi-scale.md:238-245), class ENGINEERING CONSTRAINT, Confidence "High for the
  host facts… **Low for the queueing-with-abandonment theory (UNCITED — heuristic)**".
  Pass thresholds, verbatim: "`utilisation ≤ 0.85`, `abandonment_rate ≤ 5 %`, `mean_wait ≤ 30 s`
  (**thresholds are this skill's declared defaults, HEURISTIC, Low** — tune per project)".
  "Fail the stack if any portal is at 100 % abandonment while another is idle (MS-11 miscoverage)."
  Failure symptom (MS-10): "20 agents queue at a 2-portal lobby and half give up each cycle."
- `FACT` `MS-11` grid translation (multi-scale.md:118-125): `COVERAGE_TEST` — "fail if
  `served(n) = ∅` for any occupied n"; `WALK_TEST` —
  "`min over p in served(n) of octile_dist(tile, p.interaction_spot) × 0.5 ≤ lobby_walk_bound`
  (**bound value: UNCITED — heuristic, Low**)".
  `INFERENCE`: the walk-bound test is structurally available for a 500-person arrival lobby — it is a
  tile distance from every lobby tile to the nearest portal's interaction spot — but with no stated
  bound value it can only be *measured and reported*, never *passed*.
- `FACT` `CODE-23` (building-codes.md:336-344), Confidence Medium (existence/jurisdiction),
  **Low (dimensional specifics)**: "2010 ADA Ch.4 (car space, door time, control height in the
  15-48 in reach band, tactile+braille floor designations §407) — **specific car/control dimensions
  NOT verbatim-fetched → `no (not found at the cited source)`**". "IBC §1009 and ADA 2010 §207.1
  (cite corrected — this file said §207.3) make elevators part of an accessible means of egress.
  **Grid:** lift is a portal with a 30 s queue."
  Critical caveat, verbatim: "**a lift-only-vertical sim cannot demonstrate stair egress capacity and
  cannot model that fire recall may *remove* the lift from occupant use — so this host abstraction can
  make a plan look compliant while being operationally unsafe. Flag it.**"
- `FACT` `CODE-12` grid translation (building-codes.md:226): "Since the sim's only vertical is the
  lift, **the refuge must co-locate with the lift portal**"; refuge = "2× 30×48 in spaces; two-way
  comms" → numbers register (building-codes.md:458) "**2×(2×3) tiles**", `verified? = no`
  ("up.codes returned ADA not 1009").
- `FACT` `CODE-09` grid translation (building-codes.md:196): "**representation gap.** Stairs carry no
  simulated egress here (lift-only vertical), so stair *width/capacity* cannot be verified on the
  grid… do not claim egress credit for a stair."
- `INFERENCE` net effect for this brief: there is **no KB-sourced occupant → lift-count rule**. The
  deliverable is the method plus the host-measured proxies (portal count, capacity spots as car_load,
  30 s queue patience, utilisation, abandonment, mean wait); the lift count itself must be published
  as `REQUIRES ENGINEERING VERIFICATION` — a traffic-study input, not a number taken from this KB.

---

## 5. Tile-grid translation of every figure above

### 5a. Occupants → tiles of door run

`INFERENCE` — `CODE-04`'s own formula `width_tiles = ceil(required_width_mm / 500)` applied to each
capacity factor the KB carries:

| Occupants | @0.3 in stair (7.62 mm/occ, Medium conf.) | @0.2 in level/door (5.08 mm/occ, **Low** conf.) | @0.15 in sprinklered (3.81 mm/occ, **Low** conf.) |
|---|---|---|---|
| 50 | 1 tile | 1 tile | 1 tile — voided: CODE-04 "a 1-tile/0.5 m door is below any 32-44 in minimum → **not an egress door**"; absolute floor 2 tiles (`HS-05`) |
| 100 | 2 tiles | 2 tiles | 1 tile → floored to 2 |
| 200 | 4 tiles | 3 tiles | 2 tiles |
| 350 (≈ max the envelope justifies at Business) | 6 tiles | 4 tiles | 3 tiles |
| **500** | **8 tiles = 4.0 m** | **6 tiles = 3.0 m** | **4 tiles = 2.0 m** |
| 1,000 | 16 tiles | 11 tiles | 8 tiles |

- `FACT` absolute floors that override every row: each egress door ≥ 2 tiles nominal run
  (≈0.85-0.90 m clear, `HS-05`, CODE REQUIREMENT, Confidence High); exit-access corridor ≥ 3 tiles in
  the 44 in tier (`CODE-05`); accessible route ≥ 2 tiles (`CODE-18`).
- `FACT` `CODE-04` + `CODE-02` + `CODE-08`: the run must be split across ≥2 door-runs reaching
  *different* safe places, ≥1/2 max diagonal apart, and "two doors on the same wall may still count as
  effectively one path".
- `INFERENCE` working answer: at the unsprinklered 0.2 in tier, **500 occupants ⇒ ≥2 remote door-runs
  of 3 tiles each (6 tiles / 3.0 m aggregate)**, and CODE-05's 44 in corridor floor independently lands
  on the same 3 tiles. **A single 4-tile door run does not satisfy this** (see §3c).

### 5b. Occupants → tiles of floor

| Rule | Real | Tiles | Source + class |
|---|---|---|---|
| Business factor | 13.9 m²/occ | **55.8 tiles/occ** | `CODE-01` verbatim helper, CODE REQUIREMENT |
| Seated assembly (tables + chairs) | 1.39 m²/occ | **5.6 tiles/occ** | `CODE-01` verbatim helper |
| Assembly chairs-only | 0.65 m²/occ | 2.6 tiles/occ | `INFERENCE` on CODE-01's 7 ft² net |
| Assembly standing, low (5 ft²) reading | 0.465 m²/occ | 1.9 tiles/occ | `INFERENCE`, Confidence **Low / unresolved** |
| Comfortable standing | ~1.2 m²/occ | **~5 tiles/occ** | SKILL.md:591 — FACT vs HCM/FHWA LOS + IMO queue bands |
| Walking / free circulation | 2.3-3.8 m²/occ | **9-15 tiles/occ** | SKILL.md:591 |
| Packed capacity standing | 0.25-0.5 m²/occ | 1-2 tiles/occ | SKILL.md:591 — "**the packed end, not a comfort default**" |
| Row seating | 0.55 m seat, 0.9 m pitch | **2 tiles/seat × 2 tiles pitch ≈ 4 tiles (1.0 m²) per seated person** | `HS-14` grid translation, HEURISTIC, Medium widths / Low C-value |
| 500 seated | — | **1,000 tiles for seats alone** = 50 % of the clear interior before any aisle, desk, queue, WC or lift | `INFERENCE` on HS-14 |
| Assembly cross-aisle | 1.2 m | 3 tiles | `HS-15`, HEURISTIC, Confidence Low for numbers |
| Seat-to-aisle limit | "≈7 seats one-way, 14 accessways per exit door in US practice" | check: `no seat more than 4 tiles from an aisle tile` | `HS-15` — **UNCITED**, tables "not opened" |
| Queue standing | 1-2 tiles/person packed | 3 tiles = the KB's queuing corridor | SKILL.md:585 (single file / passing / queuing = 1/2/3 tiles) + SKILL.md:315 "3+ to queue" |

### 5c. Fixtures and furniture → tiles

- `FACT` office/meeting register (human-scale.md:381), verbatim row: "Reception/front desk |
  2.40×0.90 | **5×2 tiles** | **1.5 m in front for a queue, 1.2 m behind for staff** |
  **Min room 8×6 interior** | `front-desk` → lobby".
  `INFERENCE`: 8×6 interior + one-tile walls = **10×8 outer = 80 tiles = 20 m² of plate per
  arrival-desk unit**, of which the KB's own queue allowance is 3 tiles deep (1.5 m rounded up) and the
  staff rear 3 tiles. `not in the KB` — desks per occupant, or arrivals-per-hour per desk; the register
  sizes **one** unit and never scales it by headcount.
- `FACT` `HS-13` failure mode, verbatim and squarely on this brief (human-scale.md:148): "**The host
  cannot see the table, so restaurant capacity is a *declared* number, not a derived one.
  Symptom: 40 covers claimed in a 60-tile dining room that geometrically seats 16 — this is the single
  most common scale failure in this project's plans.**"
- `FACT` `HS-08` grid check: "`accessible WC interior tiles ≥ 16` (= 4.0 m²)"; register row
  "Accessible WC compartment | 5×5 inner min, prefer 6×6 | turning 3×3/4×4 + clear floor 2×3".
  `INFERENCE`: 6 × 6 outer = **36 tiles = 9.0 m² plate per accessible WC**; ganging back-to-back
  halves the wall tax (HS-08's own exception note — "the grid's strongest argument for ganged sanitary
  cores").
- `FACT` `HS-07` grid check: "`WC tile-adjacency: ≥ 3 clear tiles in front, ≥ 1 clear tile on the
  transfer side, no door tile inside the clear space`"; WC pan 2×2, basin 2×1 with 2×3 approach.
- `FACT` lounge register (human-scale.md:387-395): armchair 2×2 with "1.2 m in front of a row";
  3-seat sofa 5×2 with 0.9 m behind; bar counter 6×2, "0.9 m front (stools), 1.2 m rear (staff)",
  2 tiles/stool at 0.60 centres; **wheelchair space in seating 3×2 with a companion seat beside it**.
- `FACT` `HS-24` / SKILL.md:347-348: "Every real clearance **rounds up** to whole tiles; a 1.1 m
  requirement is 3 tiles (1.5 m), and the report states both. Never present a rounded-down value as
  adequate."
- `FACT` SKILL.md:264-265 (Building Programming 2): "Convert areas to tiles: `tiles = m² × 4`.
  Enclosure tax: a `W×H` outer footprint yields `(W-2)(H-2)` usable tiles… compute wall share from
  actual blocked-tile counts, not per-room (TH-02)."

### 5d. Access → tiles (consolidated from the KB's own grid-translation fields)

| Requirement | Real | Tiles | Rule + class/confidence |
|---|---|---|---|
| Accessible route min | 915 mm | 2 | `CODE-18` CODE REQUIREMENT, High |
| Two-way / queuing route | 1.2-1.5 m | 3-4 | `HS-03` STANDARD + CODE, High for the band |
| Two wheelchair passing | 2.0 m | 4 | `HS-03` |
| Accessible door run | 815-905 mm clear | 2 (1.0 m run) | `HS-05` CODE REQUIREMENT, High |
| Trolley/bed door | 1.0 m clear | 3 | `HS-05`/`HS-19`, "thick-wall reveal" |
| Turning circle (US) | 1525 mm | 4 × 4 | `HS-04`, +31 % area over-provision |
| Turning circle (metric) | 1500 mm | 3 × 3 exact | `HS-04` |
| Clear floor space, any fixture | 760 × 1220 | 2 × 3 | `HS-07` / register (ADA §305) |
| Door maneuvering, front pull | 1525 perp + 455 latch | 4 tiles + 1 tile | `CODE-19` T1 read, High |
| Door maneuvering, front push | 1220 perp | 3 tiles | `CODE-19` |
| Exit-access corridor, 44 in tier | 1118 mm | 3 | `CODE-05`, Medium-High |
| Dead-end cap | 6.1 m | 12 | `CODE-06`, Medium-High |
| Common path cap | 22.9 m | 46 | `CODE-03`, clause `UNKNOWN (verify)` |
| Refuge | 2 × (760×1220) | 2 × (2×3) | `CODE-12`, `verified? = no` |
| Stair, public | 1.2 m | 3 | `HS-20` register — **no egress credit on this grid** (`CODE-09`) |

---

## 6. `not representable` / `not in the KB` (as the KB states it — no approximations invented)

`not representable` — the KB rules these out and forbids passing them off:

1. Heights, section, slab/column/material, storey index — `FACT` SKILL.md:493 + host fact 7
   (:541-545): "**Every 'heights are not representable' verdict in this skill is therefore a verified
   host fact, not an assumption.**" Consequence: lift RTT is a *declared parameter* (`MS-10`).
2. Stair egress capacity / stair width-as-egress — `FACT` `CODE-09`: "**representation gap**… do not
   claim egress credit for a stair."
3. Door leaf swing, and the clear-vs-nominal-run divergence — `FACT` SKILL.md:570 lists "door leaf
   swing" among what the grid cannot express; `CODE-04`: "tile runs overstate clear width".
4. Wheelchair turning **circle** and the ADA **T-shaped** alternative — `FACT` `HS-04`: "Never draw a
   circle… The T-shaped ADA alternative is *not* expressable on this grid without modelling the arms as
   clear tiles; **do not claim credit for it**."
5. WC centreline offset 380-430 mm — `FACT` `HS-07`: "**not expressible** (half-tile offsets are
   impossible)… verify against the 16-18 in band as *failing by grid quantisation* and widen instead."
6. Reach band 380-1220 mm and grab-rail height 840-915 mm AFF — `FACT` `CODE-21`
   "(**vertical — not modelled**)"; register: "height is out-of-grid: tag attribute".
7. Ramp slope / rise / landing geometry — `FACT` numbers register (building-codes.md:461):
   "n/a (**slope off-grid**)"; `CODE-20`: "emit an advisory that slope/run/landing cannot be validated
   on a flat grid and must be checked off-model."
8. Sightlines / C-value — `FACT` `HS-14`: "C-value requires section/height, which the host does not
   model — **declare it *unverifiable* on this grid**… Any claim of 'good sightlines' in this project
   is unfalsifiable; report it as a known blind spot rather than a pass."
9. Sprinkler status and fire/smoke coverage — `FACT` tension register 3: credits "assume coverage that
   a tile plan does not model"; use the unsprinklered figure unless coverage is shown as a design
   obligation (`CODE-07`, `CODE-25`).
10. Furniture as an object class — `FACT` `HS-27` heading: "Keep a declared furniture layer, because
    the schema has none"; `HS-13`: capacity is "a *declared* number, not a derived one".
11. Room privacy gradient — `FACT` host fact 4 (SKILL.md:528-530): privacy is binary `open|private`;
    zoning must ride on role access tags (host fact 6).
12. Required exit count and required travel-distance cap — `FACT` `CODE-02` / `CODE-07`: both emit
    `UNKNOWN (verify)`; `CODE-07` is "**FLAG-LEVEL: BLOCKER for any distance check**".
13. Any required clear dimension below one tile — `FACT` SKILL.md:561-562: "**never express a required
    clear dimension below one tile — under 0.5 m the design is unbuildable here**".
14. Grid quantisation as a module problem — `FACT` tension register 10: 500 mm "is **not** a member of
    the 3M (300 mm) coordinating series… the smallest dimension expressible in both families is
    1500 mm = 3 tiles… **never claim 3M compliance**."

`not in the KB` — searched the assigned set; no figure exists; do not invent one:

- Fixture counts per occupant for any occupancy: **water closets (total and by sex), urinals,
  washbasins, drinking fountains**. (§2a)
- An occupant-load factor named "lobby", "arrival", "entrance hall", "waiting area" or "seated
  waiting"; a circulation occupant-load factor. (§1c)
- Which IBC occupancy group a hotel arrival lobby is charged to. (§1c — the KB's hotel type row names
  "arrivals math" as the driver but never defines the occupancy.)
- Lift count per occupants, HC % target, acceptable waiting interval, `lobby_walk_bound`. (§4a/§4b —
  all four are explicitly labelled UNCITED / heuristic / Low by the KB itself.)
- Check-in desks, bell desk, or luggage store per occupant count.
- Any egress-capacity factor in mm/person: the NCC aggregate rule "1 m + 250 mm per 25 persons over
  100" is carried only as `partial (gov page reached; the specific figures were not on it this pass —
  verify adopted edition)` (building-codes.md:470).
- Hotel BOH share: `FACT` SKILL.md:446-449 — "the audit found no authoritative source for the share
  itself (two competing low-tier figures, 15-25 % and up to 20 %), so it is an operator input to be
  asked for or assumed in the open, **never a value to be looked up here**."

`FACT` closing verdict on the brief's premise — `CODE-28` (building-codes.md:386): "Codes are floors,
not targets — **code-minimum ≠ operational-minimum**", and tension register 11
(synthesized-rules.md:451-455): "**no agent may quote a room area as a standard from this set** —
quote it as a project assumption with a falsifier, or retrieve the primary text."
