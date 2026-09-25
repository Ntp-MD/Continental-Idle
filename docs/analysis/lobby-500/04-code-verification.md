# Code verification — lobby sized for 500-person occupant load

Scope: primary/authoritative figures only. Anything not fetchable this session is labelled
**NOT VERIFIED - assumption** with the conservative value adopted and the reason. No citation or URL
here is invented: every "URL fetched" is a page that returned content in this session.

Grid convention: 1 tile = 0.5 m x 0.5 m = 0.25 m2. 1.0 m of linear run = 2 tiles.
Project drawing convention is a 1x1 tile toilet stall and a 2x2 tile lift car; both are noted below
where they are physically unrealistic, with the code-plausible tile count alongside.

Fetch failures that shaped this file (recorded so the gaps are auditable):
- `codes.iccsafe.org` IPC2018 ch.4 and IBC2021 ch.10 -> HTTP 403 (blocked).
- `codelibrary.amlegal.com` NYC admin code -> HTTP 403.
- `ilga.gov` plumbing fixture table -> connection failed.
- `adsimulo.com` lift performance criteria -> HTTP 502.
- `liftescalatorlibrary.org` traffic PDFs (2 docs) -> image/compressed streams, no text extractable.
Consequence: **section 3 (lift traffic) is entirely assumption-class.** The architecture skill's
refusal to publish lift-count numbers stays justified.

---

## 1. Plumbing fixture counts

Source fetched: **IPC 2024, Table 403.1 "Minimum Plumbing Fixture Requirements"** as published for
the GSA edition (UpCodes), re-read against the Denver IPC-2018 edition of the same table.
URL: https://up.codes/viewer/general-services-administration/ipc-2024/chapter/4/fixtures-faucets-and-fixture-fittings
URL: https://up.codes/viewer/denver/ipc-2018/chapter/4/fixtures-faucets-and-fixture-fittings

Note on numbering: in IPC 2018/2021 this table is **Table 405.1**; in the 2024 reorganisation (and in
the two adopted editions above) the same table is numbered **403.1**. Values below agree across both
editions, which is why they are treated as verified. The rendered HTML table shifted the last two
column labels on both pages (bathtubs/showers vs drinking fountain vs "other"), so the drinking
fountain values below are marked as high-confidence-but-column-ambiguous.

Verbatim ratios (both sexes are computed from "the total occupant load shall be divided in half",
Sec. 403.1.1 — i.e. 250 male / 250 female at a 500 load):

| Row (classification as printed) | WC male | WC female | Urinals (M) | Lav | Drinking fountain |
| --- | --- | --- | --- | --- | --- |
| Nightclubs, bars, taverns, dance halls | 1 per 40 | 1 per 40 | 1 per 75 (column as rendered: "1 per 75") | — | 1 per 500 |
| Theaters and other buildings for the performing arts and motion pictures | 1 per 125 | 1 per 65 | 1 per 200 | see note | 1 per 500 |
| Auditoriums without permanent seating (the code's nearest row to "assembly rooms, undivided") | 1 per 125 | 1 per 65 | 1 per 200 | see note | 1 per 500 |
| Restaurants, banquet halls and food courts | 1 per 75 | 1 per 75 | 1 per 200 | see note | 1 per 500 |
| Buildings for the transaction of business (offices) | 1 per 25 for the first 50 and 1 per 50 for the remainder exceeding 50 | 1 per 40 for the first 80 and 1 per 80 for the remainder exceeding 80 | — | 1 per 100 | — |
| Retail stores, service stations, shops, salesrooms, markets, shopping centers | 1 per 500 | 1 per 750 | — | — | 1 per 1,000 |
| Hotels, motels, boarding houses (transient) | 1 per dwelling or sleeping unit | 1 per dwelling or sleeping unit | — | 1 per dwelling or sleeping unit | — |
| Stadiums, amusement parks, other all-occupant areas | 1 per 75 for the first 1,500 and 1 per 120 for the remainder | 1 per 40 for the first 1,520 and 1 per 60 for the remainder | 1 per 200 | 1 per 200 (M) / 1 per 150 (F) | 1 per 1,000 |

Footnote, verbatim as rendered: fixtures "shown are based on one [fixture] being the minimum required
for the number of persons indicated or any fraction of the number of persons indicated" — i.e. always
round **up**; and "The number of occupants shall be determined by the International Building Code."
Service sink: 1 per toilet facility (exempt for business/mercantile loads of 15 or fewer).

There is **no hotel-public-area row**: "Hotels, motels (transient)" is scoped to sleeping units
(1 WC + 1 lavatory per unit), so a hotel *arrival lobby* is scoped by the assembly rows, not the
sleeping-unit row. The nearest true "assembly, undivided" row is "Auditoriums without permanent
seating" (1/125 M, 1/65 F). The **governing (most demanding) plausible row for a lobby that also
serves F&B and can be used for standing/dance events is nightclubs/dance halls at 1 per 40 per sex.**

Drinking fountains: Sec. 410.2 "Drinking fountains shall not be required for an occupant load of 15
or fewer"; Sec. 410.3.1 "Not fewer than two drinking fountains shall be provided. One drinking fountain
shall comply with wheelchair [accessible]..." (i.e. where provided, minimum 2: one wheelchair-height,
one accessible). Per-occupant ratio for assembly uses reads as 1 per 500 from the table.

**NOT VERIFIED - assumption:** the urinal-substitution / water-closet-reduction clause (IPC 2018
Sec. 405.3-ish, "water closets in lieu of urinals") was not present in either fetched edition
(the 2024 renumbering moved the text to Sec. 424.2 for urinals and the reduction clause did not
appear). Conservative rule adopted: **take no credit for urinal substitution — do not reduce the
required water-closet count because urinals are provided.**

## 2. Egress capacity

Source fetched: **IBC 2021 as adopted in Illinois** (ICC text, unamended) Chapter 10, UpCodes:
https://up.codes/viewer/illinois/ibc-2021/chapter/10/means-of-egress
Cross-checked on https://up.codes/s/means-of-egress-sizing (same section text) and
https://up.codes/s/number-of-exits-and-exit-access-doorways (Illinois Building Code 2021 header).

- 1005.1 (sizing): "All portions of the means of egress system shall be sized in accordance with
  this section."
- 1005.2: "minimum width ... shall be not less than that specified for such component, elsewhere in
  this code."
- 1005.3.1 (stairways): "means of egress capacity factor of **0.3 inch (7.6 mm) per occupant**";
  exception for sprinklered buildings (other than H and I-2): "factor of **0.2 inch (5.1 mm) per
  occupant**".
- 1005.3.2 (all other components — doors, corridors, ramps): "**0.2 inch (5.1 mm) per occupant**";
  sprinklered exception: "**0.15 inch (3.8 mm) per occupant**".
- 1006.2.1.1: "Three exits or exit access doorways shall be provided from any space with an occupant
  load of **501 to 1,000**." / "Four exits ... greater than 1,000." Story thresholds "1-500 -> 2 /
  501-1,000 -> 3 / More than 1,000 -> 4".
- 1006.3.1: only the occupant load of each story considered individually when counting exits per story.
- Table 1006.2.1 (as rendered, columns ambiguous — read as occupant-load trigger then distance):
  "A, E, M | 49 | 75 | 75 | 75a" and "B | 49 | 100 | 75 | 100a"; "NP" = not permitted.
- Table 1004.5 occupant load factors (assembly + business): concentrated (chairs only, not fixed)
  **7 ft2 net**; standing space **5 ft2 net**; unconcentrated (tables and chairs) **15 ft2 net**;
  business areas **150 ft2 gross**; accessory storage 300 ft2 gross.

**NOT VERIFIED - assumption (both are load-bearing, so flagged loudly):**
1. *Minimum clear width* — IBC 1005.1 / 1010.1.1 set 32 in (813 mm) clear for egress components/doors
   and 44 in (1,120 mm) for main exit doorways in Group A with 50+ occupants. The fetched excerpt did
   not contain those figures ("Specific 32-inch or 44-inch dimensions are not stated in the provided
   excerpt"). Adopted value: **44 in (1.12 m) clear per assembly exit doorway**, reason: it is the
   larger of the two and the lobby is Group A-scoped at 500 occupants; a design that meets 44 in also
   meets 32 in.
2. *Table 1017.2 travel distance* and the exact 1018.2 common-path number were beyond the fetched
   text (page truncated at 1008.3.3). Adopted: **200 ft (61 m) unsprinklered assembly travel
   distance**, reason: it is below the commonly published 250 ft figure, so the layout stays legal
   even if the real allowance is the smaller number or if sprinklers are not credited. Common path:
   **75 ft (22.9 m)** for A, **100 ft (30.5 m)** for B, per the Table 1006.2.1 rows above — treat as
   "verified text, ambiguous column mapping".

## 3. Elevator traffic design — NOT VERIFIED

No primary page stating these numbers could be fetched this session (see fetch-failure list). Every
line in this section is an **assumption**; use them as planning envelopes only, never as code
compliance. Do not attribute them to CIBSE E/C, CIBSE Guide D, ASME A17.1 or Elevator World — they
were not read.

Working assumptions, chosen conservative (i.e. more cars, longer queuing):
- 5-minute handling capacity for a hotel with an arrival/check-out peak: **plan 12-15% of the
  served population in 5 min** (lower bands were rejected because a 500-person lobby load implies a
  concentrated arrival event, not a steady trickle).
- Target interval: **<= 30 s** premium, **35-45 s** acceptable, **> 50 s** unacceptable for a
  front-of-house lift lobby.
- Average waiting time: **<= 30 s** design target, with >= 80% of passengers served within 30 s.
- Cars per room rule of thumb: **1 car per 70-100 guest rooms** for mid-range, **1 per 50-60** for
  luxury/arrival-dominant, plus 1 service car. Conservative planning: **1 per 60 rooms**.
- Peak arrival share assumed: **40% of the 500 occupants (200 persons) transiting in the peak 5 min.**
- Hoistway footprint (manufacturer planning dimension, also unverified): 2.1 m x 2.4 m per car
  (5.04 m2). On the 0.5 m grid that is 4.2 x 4.8 tiles -> **5 x 5 tiles = 25 tiles per hoistway**
  once you round up to a buildable envelope. The project's 2x2 tile (1 m2) lift car is ~4x too small
  physically; keep it only as a schematic glyph, not as the traffic model.
- Derived from the assumptions: 200 persons / 5 min. At 12 persons/car with 80% peak-load utilisation
  that is ~21 car trips per 5 min; at a 30 s interval one car yields 10 trips per 5 min, so
  **>= 3 cars** serve the assumed arrival peak, and **4 cars x 5 x 5 tiles = 100 tiles (25 m2)** of
  hoistway + a 2-tile-deep (1 m) landing across the car frontage.

## 4. Densities

- Standing / waiting in the lobby: **5 ft2 net per person = 0.465 m2 = 1.86 tiles** — VERIFIED from
  IBC 2021 Table 1004.5 "Standing space / 5 net" (the same factor the code uses to derive occupant
  load, so it is self-consistent for a lobby counted as standing assembly space).
- Rounded planning density on this grid: **2 tiles per person (0.5 m2/person)** for queuing and
  standing.
- Seated lounge / F&B: **15 ft2 net = 1.39 m2 = 5.6 tiles -> 6 tiles per seated occupant** (Table
  1004.5 "unconcentrated (tables and chairs)"), or **7 ft2 = 0.65 m2 -> 3 tiles** if chairs only,
  tightly packed. No hotel-specific "seats per occupant" rule was found; NOT VERIFIED - assumption:
  **provide seating for 25% of the lobby load** (125 seats = 704 tiles at 6 tiles/seat) because no
  source verified a share, and 25% is the smallest share that still reads as a hotel lobby rather
  than a queue.
- Toilet-room circulation: **NOT VERIFIED - assumption**: a real WC stall needs ~1.0 m x 1.5 m clear
  (>= 6 tiles), an ambulatory-accessible single-user toilet ~1.5 m x 1.5 m turning space plus door
  swing (>= 9-12 tiles). The 1x1 tile stall convention cannot hold a code-compliant fixture.

## 5. 500-occupant translation

Occupant split assumed per IPC 403.1.1: 250 male / 250 female. All fixture counts rounded up.

| Requirement | Source (ref) | Rule applied | Derived for 500 | On the 0.5 m grid | Class |
| --- | --- | --- | --- | --- | --- |
| Water closets — assembly/theater basis | IPC 2024 T403.1 (IPC2018 T405.1) | M 1/125, F 1/65 | M 2, F 4 -> **6 WC** | 6 stalls: 6 tiles schematic / **36-48 tiles** real (6 tiles each) | VERIFIED |
| Water closets — governing (dance hall) basis | same, nightclubs/dance halls | 1/40 each sex | 250/40 = 6.25 -> **7 M + 7 F = 14 WC** | 14 tiles schematic / **84 tiles** real | VERIFIED rule, ASSUMED applicability |
| Water closets — design choice used | same, restaurant 1/75 | 250/75 = 3.33 | **4 M + 4 F = 8 WC** | 8 tiles schematic / **48 tiles** real | DERIVED |
| Urinals | same, 1/200 (M) | 250/200 = 1.25 | **2 urinals** | 1 tile each = 2 tiles (schematic) | VERIFIED (column label ambiguous) |
| Lavatories | business row 1/100 applied to assembly (conservative) | 250/100 = 2.5 | **3 per sex = 6** | 6 tiles | ASSUMED (assembly lav column unreadable) |
| Ambulatory-accessible toilet | IPC 410.3.1 / 404 | 1 per facility per sex | **2** | 2 x 12 tiles = **24 tiles** | ASSUMED footprint |
| Drinking fountains | IPC 410.2, 410.3.1 + table 1/500 | max(500/500, 2) | **2** (1 wheelchair-height, 1 accessible) | 2 tiles (0.5 m x 0.5 m each) + clearance | VERIFIED |
| Total egress width, sprinklered | IBC2021 1005.3.2 Ex.1: 0.15 in/occ | 500 x 0.15 = 75 in | 75 in = 1,905 mm | **3.81 tiles -> 4 tiles** of clear door run | VERIFIED |
| Total egress width, unsprinklered | IBC2021 1005.3.2: 0.2 in/occ | 500 x 0.2 = 100 in | 100 in = 2,540 mm | **5.08 tiles -> 6 tiles** of clear door run | VERIFIED |
| Stair/egress-in width (if stairs serve lobby) | IBC2021 1005.3.1 (0.3 / 0.2 sprinklered) | 150 in / 100 in | 3,810 / 2,540 mm | **8 tiles / 6 tiles** of stair run | VERIFIED |
| Number of exits from the lobby space | IBC2021 1006.2.1.1 | 500 <= 500 -> 2; 501+ -> 3 | **3 exits (design above 500)** | at 44 in (1.12 m) = 2.24 tiles each -> 3 x 3 tiles = **9 tiles** of doorway frontage | VERIFIED rule / ASSUMED 44 in leaf |
| Common path of egress travel | IBC2021 T1006.2.1 (A 75 ft / B 100 ft) | 22.9 m / 30.5 m | <= 22.9 m from any lobby point to a 2-way exit | **46 tiles (A)** / 61 tiles (B) | VERIFIED text, ambiguous columns |
| Exit travel distance | not fetched | assume 200 ft = 61 m | 61 m from farthest lobby point | **122 tiles** | ASSUMPTION |
| Standing/queue area for all 500 | IBC2021 T1004.5 5 ft2 net | 500 x 0.465 m2 = 232 m2 | 232 m2 | **927 tiles (2 tiles/person rounded: 1,000 tiles)** | VERIFIED |
| Lobby at realistic waiting density | assumed 0.65 m2/person | 200 in lobby at once | 130 m2 | **520 tiles** | ASSUMPTION |
| Seated lounge (25% of load) | T1004.5 tables-and-chairs 15 ft2 | 125 x 1.39 m2 | 174 m2 | **704 tiles** | DERIVED from verified factor |
| Lift cars serving assumed arrival peak | section 3 assumptions | 200 p/5 min at 12% HC | **4 cars** (3 minimum) | 4 x 25 tiles = **100 tiles** of hoistway + 2-tile-deep landing strip | **NOT VERIFIED** |
| Lift lobby glyph, project convention | — | 2 x 2 tiles per car | 4 cars | 16 tiles | schematic only, physically wrong |

Binding constraint summary for the rebuild: 500 people standing at the code's own density is **~930
tiles (232 m2)** of lobby clear of fixed elements; egress needs **>= 6 tiles of aggregate clear door
run** (unsprinklered) across **>= 3 exits** once the design load crosses 500; the toilet core is
**8 WC + 2 urinals + 6 lav + 2 accessible + 2 drinking fountains** on the restaurant basis (14 WC on
the dance-hall basis) = **~92-110 tiles** once real stall sizes are used; lift core at the assumed
traffic band is **~100 tiles** of hoistway plus a 1 m deep landing band.

## 6. Verified vs assumed register

| Figure | Value | Standard + edition + ref | URL actually fetched | Class |
| --- | --- | --- | --- | --- |
| WC M/F, theater & auditorium-without-seating | 1/125, 1/65 | IPC 2024 T403.1 (= IPC 2018/2021 T405.1) | up.codes/viewer/general-services-administration/ipc-2024/chapter/4/fixtures-faucets-and-fixture-fittings | VERIFIED |
| WC M/F, nightclubs/dance halls | 1/40, 1/40 | same | same + up.codes/viewer/denver/ipc-2018/chapter/4/fixtures-faucets-and-fixture-fittings | VERIFIED |
| WC M/F, restaurants/banquets | 1/75, 1/75 | same | same | VERIFIED |
| WC business offices | 1/25 first 50 then 1/50 (M); 1/40 first 80 then 1/80 (F); lav 1/100 | same | same | VERIFIED |
| Hotel sleeping units | 1 WC + 1 lav per unit | same | same | VERIFIED |
| Male/female load split | divide total load in half (403.1.1) | IPC 2024 | same | VERIFIED |
| Round-up rule | one fixture minimum for the number indicated or any fraction | IPC 2024 T403.1 fn.1 | same | VERIFIED |
| Drinking fountains | none below load 15; min 2 where provided (410.2, 410.3.1); 1/500 assembly | IPC 2024 | same | VERIFIED |
| Urinal substitution reduction | not obtained | IPC 2024 Sec. 424.2 area | — | NOT VERIFIED - no reduction credit taken |
| Egress capacity factor stairs | 0.3 in/occ; 0.2 sprinklered | IBC 2021 (IL adoption) 1005.3.1 | up.codes/viewer/illinois/ibc-2021/chapter/10/means-of-egress | VERIFIED |
| Egress capacity factor doors/corridors/ramps | 0.2 in/occ; 0.15 sprinklered | IBC 2021 1005.3.2 | same + up.codes/s/means-of-egress-sizing | VERIFIED |
| Exits by occupant load | <=500: 2; 501-1,000: 3; >1,000: 4 | IBC 2021 1006.2.1.1 | same + up.codes/s/number-of-exits-and-exit-access-doorways | VERIFIED |
| Common path A / B | 75 ft / 100 ft | IBC 2021 T1006.2.1 | same (columns rendered ambiguously) | VERIFIED TEXT, MAPPING UNCLEAR |
| Occupant load factors | standing 5 net; chairs-only 7 net; tables+chairs 15 net; business 150 gross | IBC 2021 T1004.5 | up.codes/viewer/illinois/ibc-2021/chapter/10/means-of-egress | VERIFIED |
| Min clear width 32 in / 44 in | assumed | IBC 2021 1005.1 / 1010.1.1 | not present in fetched text | NOT VERIFIED - 44 in adopted (conservative) |
| Travel distance A 200 ft | assumed | IBC 2021 T1017.2 | page truncated before 1017 | NOT VERIFIED - 200 ft adopted (below the commonly cited 250 ft) |
| Hotel 5-min HC 12-15% | assumed | intended CIBSE Guide D / E/C | all candidate sources 403/502/image-only | NOT VERIFIED |
| Target interval <=30 s / AWT <=30 s | assumed | intended CIBSE / Elevator World | as above | NOT VERIFIED |
| 1 lift per 60-100 rooms | assumed | intended manufacturer guide | as above | NOT VERIFIED |
| Hoistway 2.1 x 2.4 m = 25 tiles | assumed | intended manufacturer planning data | as above | NOT VERIFIED |
| Standing 2 tiles/person | 0.465 m2 rounded | IBC 2021 T1004.5 | fetched | VERIFIED + rounding |
| 0.65 m2/person waiting, 25% seated | assumed | no source fetched | — | NOT VERIFIED |
