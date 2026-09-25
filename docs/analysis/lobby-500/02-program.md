# 02 — Space programming for a 500-occupant hotel arrival level

Extracted ONLY from: `architecture-skill/SKILL.md` (§Building Programming, §Adjacency & Zoning,
§Circulation, §Grid / Tile Translation, §Building-Type Rules, carried-constants table),
`research/space-programming.md` (SP-xx), `research/floor-plans.md` (FP-xx),
`research/adjacency-graphs.md` (AG-xx), `research/real-projects.md` (RP-xx, CR-xx),
`research/grid-translation.md` (GT-xx).

Labelling: **FACT** = quoted from the KB with rule ID + file:section. **INFERENCE** = my arithmetic on
KB numbers. **NOT IN THE KB** = the KB has no such figure; no number invented.

Headline finding up front: **the KB contains no area-per-person figure for a hotel lobby at all.**
Its single hotel-lobby row is `Lobby / front desk | driver: arrivals/hour | UNCITED — heuristic, Low |
queue positions | — | front-desk` (space-programming.md, Hotel register, line 363). So "enough for 500
people in the lobby" cannot be answered as a hotel rule; the only density bands in the corpus that can
carry it are the standing/circulation bands in SKILL.md's carried-constants table and the seated/cover
bands in the F&B rows. Those are used below, and they say 500 concurrent occupants is a **civic
assembly load**, not a hotel lobby load (SKILL §Building-Type Rules, Civic row: "Assembly loads; …
event-driven queueing").

---

## 0. Grid facts used as the denominator

| Item | Value | Label | Source |
|---|---|---|---|
| 1 tile | 0.5 m; 1 tile² = 0.25 m²; 4 tiles = 1 m² | FACT | SKILL.md:486; grid-translation.md "Anchor facts":318 |
| Wall | 1 blocked tile = 0.5 m (over-thick vs real 0.10–0.20 m) | FACT | SKILL.md:488; SP-14 |
| Room enclosure tax | `W×H` outer → `(W−2)(H−2)` usable; ring = `2W+2H−4` | FACT | SKILL.md:489; SP-14:163 |
| Tax by room size | 6×5 → 60 %; 12×10 → 33 %; 20×15 → 22 %; 40×30 → 11 % | FACT | SP-14:163 |
| Doors | belong to **no** room; `circulation = hall tiles + door tiles` | FACT | SKILL.md:511; SP-04:68 |
| Envelope A (ring 8, current) | 64×34 = 2,176 t = **544 m² gross**; net after perimeter ring 62×32 = 1,984 t = **496 m²** | INFERENCE | on FACT rows above |
| Envelope B (ring 4) | 72×42 = 3,024 t = **756 m² gross**; net 70×40 = 2,800 t = **700 m²** | INFERENCE | idem |
| Envelope C (whole canvas, no ring) | 80×50 = 4,000 t = **1,000 m² gross**; net 78×48 = 3,744 t = **936 m²** | INFERENCE | idem |

## 1. Conventions: gross vs net, circulation share, the area budget chain

- **SP-05** (FACT): walk `Gross → Net → Program → Circulation → Structure → Services → Mechanical` as a
  visible budget, one tile subtotal per rung, each rung marked *sourced / derived by count / assumed*.
  Never jump programme → plate. The one quantitative datum actually read into that file: English school
  gross moved "on average 15 % lower than BB98" (T1, BB103 notes) — used only as proof that official
  ratios move 15 % between editions, **never as an uplift** (SP-05:74, register:415, weak-list:496).
- **SP-06** (FACT): areas are convention-dependent — name BOMA/Z65.1 vs RICS/IPMS vs a national metric.
  **The host convention is unique and must be declared whenever an area is emitted: "net to inner face of
  a one-tile wall, no common-area allocation, no envelope, doors excluded from all rooms."** Imported
  published areas are *usable-net*: add the wall ring (SP-06:88).
- **SP-18** (FACT): report net-to-gross at three levels — room→suite, suite→floor, floor→building. On this
  host (c) ≡ (b) because there is no envelope; say so.
- **SP-13 / FP-09** (FACT): circulation is *solved then measured*, never pre-allotted.
  `circulation share = (hall + door tiles) ÷ plate tiles`. Bands, all `UNCITED — heuristic`, Low
  (FP-09:112): residential 0.08–0.20 · office open plan 0.08–0.15 · **hospitality guest floor
  0.18–0.30** (double-loaded) · healthcare 0.20–0.35 · industrial 0.05–0.15.
  SP-13's own width ladder in tiles: 2 = 1.0 m single route · 3 = 1.5 m two-way · **4 = 2.0 m main
  guest/department artery** · **6 = 3.0 m assembly main** (SP-13:158).
- **RP-06** (FACT, T4-sourced): measured efficiency budgets — guest/residential floor
  `room_tiles/floor_tiles = 0.60–0.72`; flag any floor below 0.50 as "corridor-dominated" and re-cut the
  plate. Hotel double-loaded slabs 65–72 % net-to-gross; single-loaded 10–15 points worse.
- **SP-14 / SKILL.md:594** (FACT): wall tax per room = `2W+2H−4` blocked tiles; report structure and door
  tiles as **separate counted lines**; "the same programme net area needs materially fewer gross tiles
  when consolidated: cap the number of rooms at the smallest footprint satisfying the use."
- **No universal ratio exists** — SKILL §Building Programming 3: "Every percentage you use is classified
  general / building-type specific / project specific / approximate heuristic… No universal ratio exists;
  do not import one."

## 2. Density / area-per-person figures the KB actually carries

| Activity | Figure | Label | Source |
|---|---|---|---|
| Standing, **packed/capacity end** | 1–2 tiles/person = 0.25–0.5 m² | FACT (HCM/FHWA LOS bands, IMO queue density) — "the 1–2 tile figure is the packed end, **not a comfort default**" | SKILL.md carried constants:591 → human-behavior.md HB-01, HB-20 |
| Standing, **comfortable** | ~5 tiles = 1.2 m²/person | FACT (same row) | idem |
| **Walking** | 9–15 tiles = 2.3–3.8 m²/person | FACT (published walkway bands) | idem |
| Seated F&B cover | **1.1–1.6 m² per cover** | `UNCITED — heuristic`, Low, F&B/hotel/civic café only | space-programming.md Hotel register:364; civic:446; type audit:536 |
| Waiting (hospital presentation) | 1.0–1.5 m² per presentation | `UNCITED — heuristic`, Low | space-programming.md Hospital register:378 |
| Board/training seat | 1.8–2.5 m² per seat | `UNCITED`, Low, office only | :391 |
| Staff rest/canteen, welfare | **1.2–1.8 m² per shift head** (industrial 1.2–2.0) | `UNCITED`, Low | :361, :406, :433 |
| Gallery visitor (dwell-dependent) | 0.5–2.0 m² per visitor | `UNCITED`, Low, project specific | :443 |
| **Hotel lobby / front desk** | **driver: arrivals/hour; capacity basis: queue positions — no m²/person at all** | `UNCITED`, Low | :363 |
| Public WC | "ratio to peak capacity" — ratio value **NOT IN THE KB** | `UNCITED`, Low | :445 |
| WC fixture minimum footprint | ≥ 8 tiles = **2.0 m² per WC** | heuristic, FP-05 | floor-plans.md:72 |
| Kitchen : dining | **0.5:1 full-service, 0.3:1 satellite** | T4 | CR-21(a):358 |
| BOH share | **15–25 % of gross** (hotel) — the audit records two competing low-tier figures (15–25 % and "up to 20 %") and says the share is an **operator input, never a value to be looked up** | T4 + SKILL §Operations | RP-07:90; CR-21(a); SKILL.md:447 |
| Lift provision | **one station per 75 guest rooms** | T4, RP-04 | :55, CR-21(a) |
| Corridor clear width | 1.22 m min, "typically 1.5–1.8 m" (hotel) | T4 | CR-21(a) |
| Accessibility floors (T1, the only hard numbers in floor-plans) | 915 mm → **2 tiles** smallest legal corridor; 815 mm → 2 tiles smallest door; 1525 mm → **3 tiles** passing/turning; **forbid single-tile circulation outright**; 3×3 clear patch every 15 tiles | FACT (2010 ADA §403.5.1/§403.5.3/§404.2.3) | FP-21:227-232 |

**SP-02 + SP-04 boundary rule (FACT, load-bearing here):** "Corridors and lobbies are movement, not
accumulation spaces; area-per-person sizing them is a category error" (SP-02:49). And the exception that
targets this exact brief: "Hotel lobby / office reception (`front-desk`) is accumulation for queueing and
non-accumulation for movement — **classify as both, cap the queue tiles separately, and exclude from the
load sum or double-count**" (SP-04:69). Any "500 people in the lobby" number must therefore be split
into *standing/queue accumulation tiles* and *movement tiles* and budgeted twice, not once.

**SP-08 (FACT) is the rule that decides the brief:** quantity per space type = `peak concurrent users ×
area per user / net area per unit`, peak from the operation's profile — "**occupancy × turnover for
hotels**". Precedent ratios are a sanity check only. The hotel business is *fixed inventory*: the room
count is the business case and demand sizes the **support** counts instead (SP-08:109).
SKILL pre-geometry gate 3 adds: the host has **no time dimension**, so the arrival profile and trip rates
are inputs the agent *declares* and then sensitivity-tests (HB-26).

## 3. Space-by-space programme for a 500-occupant arrival level

Occupancy first (INFERENCE from KB rows): 500 occupants ≈ **250 double rooms** at 2 p/room (SP hotel
register "standard twin/double: 2 persons, incl. bath"). Cross-check against the guest-stack numbers:
250 rooms × 16–22 m² = 4,000–5,500 m² of guest rooms; on the current 544 m² plate at RP-06's
0.65–0.72 NTG that is 354–392 m² of rooms/floor → **11–15 floors of hotel**. That is the arithmetic
which proves the arrival level must be sized for a **wave**, not for the census.

| # | Space | Rule used for sizing | Value the KB gives | Area for 500 (INFERENCE) | Area for a declared peak wave of 100 concurrent (INFERENCE) |
|---|---|---|---|---|---|
| 1 | Arrival vestibule / airlock | **NOT IN THE KB for hotels.** Nearest: retail "decompression zone **1.5–3 m** clear inside the entrance" (CR-21(g), T4, vendor material, capped); FP-21 3-tile turning square; GT-09 door 2 tiles | depth 1.5–3 m; ≥2-tile leaf | 2 runs × 8–12 m² = **16–24 m²** | **16–24 m²** |
| 2 | Lobby hall / FOH circulation | SP-13 width ladder (4 t main artery, **6 t = 3.0 m assembly main**); FP-09 hospitality 0.18–0.30; SP-02 movement-not-accumulation | widths in tiles, no m²/p | movement at walking density **2.3–3.8 m²/p → 1,150–1,900 m²** (impossible, see §7) | **120 m²** accumulation @1.2 + arteries |
| 3 | Reception / front-desk bank | SP:363 — driver **arrivals/hour**, basis **queue positions**; `front-desk` tag; **no m² per position in the KB** | queue positions | 500/8 positions = 62 per position; at 1.2 m²/p = **300 m²** of queue + ~2 m² counter envelope/position = **16 m²** → **316 m²** | 100 across 8 positions = 12.5 → 12.5×1.2×8 = **120 m²** queue + **16–24 m²** counter = **~140 m²** |
| 4 | Lounge / seating | `lounge` tag; seated analogue = hospital waiting **1.0–1.5 m²/presentation** (SP:378) | 1.0–1.5 m²/seat | 500 seated = **500–750 m²** | 60 seats × 1.25 = **75 m²** |
| 5 | Bar | `bar` tag; **1.1–1.6 m²/cover** (SP:446) + satellite kitchen 0.3:1 (CR-21a) | 1.1–1.6 m²/cover | 500 = **550–800 m²** + 165–240 m² back = 715–1,040 m² | 20 covers = **22–32 m²** + ~10 m² back = **~40 m²** |
| 6 | Restaurant / café | **1.1–1.6 m²/cover**; kitchen **0.5:1 full-service** (CR-21a); `cooking`+`dining` tags | idem | 500 covers = 550–800 m² + 275–400 m² kitchen = **825–1,200 m²** | 60 covers = 66–96 m² + 33–48 m² kitchen = **99–144 m²** |
| 7 | Restrooms (public) | ratio to peak capacity — **ratio NOT IN THE KB**; only FP-05 **2.0 m²/WC minimum footprint** | 2.0 m²/fixture | 500 → ~25 fixtures × 2.0 = **50 m²** stalls + ~50 % = **~75 m²** (fixture count is my assumption, not the KB's) | ~10 fixtures = **20 m²** + 50 % = **30 m²** |
| 8 | Lift hall / boarding queue | **1 station / 75 rooms** (RP-04); FP-23 car ≥4×4 t (2.0×2.0 m) + **landing clear zone ≥5 t (2.5 m) in front**; AG-16 vertical edges are queues; SKILL host fact 5 `queuePatienceSeconds: 30` | 4 m²/car, 2.5 m landing | 500 rooms→**7 cars** = 28 m² core + 7×2.5 m×2 m landing = **~63 m²** + a 500-person wave at 1.2 = **600 m²** | 250 rooms→**4 cars** = 16 m² core + landing ~20 m² + wave queue (shared with row 2) |
| 9 | Luggage / bell desk | **NOT IN THE KB** — no row, no tag (nearest `storage`/`front-desk`; `living`-tag trap) | none | assume **12–20 m²** (declared assumption) | **12 m²** |
| 10 | BOH: kitchen, stores, staff, service corridor | **15–25 % of gross** (RP-07, T4; audit: two competing figures, operator input); SP-12 staff rows sized per **peak shift headcount** 1.2–1.8 m²; SP-10 storage ≥16 t for a shelf run, ≥4 t absolute floor; kitchen 0.5:1 | % of gross + per-head | 0.15×544 = **82 m²** → 0.25×756 = **189 m²** | same % of the chosen plate |
| 11 | BOH / service corridor as its own network | RP-07: `service_share` **target 0.15–0.25 of gross** on hotel floors; service sub-graph touches every service room and intersects public only at `transfer` nodes | 0.15–0.25 | inside row 10 | inside row 10 |

Hard geometric floors that every row above must clear (FACT): **SP-15** min dimension ≥6 tiles (3.0 m)
habitable, ≥4 tiles (2.0 m) bathroom/service, aspect ≤3:1 · **FP-07** 1–2 doors per room, "**3+ only for
labelled lobbies/halls**" (the lobby is explicitly the exemption) · **FP-21** no single-tile circulation
ever · **GT-11** no sliver rooms, ≥2 tiles short side and 6 interior tiles · **GT-10** nothing below one
tile is expressible · **GT-05** every functional minimum rounds **UP** to whole tiles (a 1.1 m need is
3 tiles = 1.5 m) and both values are reported.

Tag-collision warnings that decide whether these rooms exist (FACT, SKILL host fact 3d, SP-16:188):
`living`(10) and `hygiene`(20) outrank `cooking`/`dining`/`retail`/`meeting`(40) and `front-desk`(50).
Therefore **any `living`-tagged seat in the lobby derives the lobby as a *bedroom***, and **any hand-wash
basin in the bar, kitchen or restaurant derives it as a *bathroom***. Place the discriminating fixture
last and diff *derived* types against programme rows in both directions. An untagged room is not merely
unvalidatable — it is **absorbed into `hall`**, the room stops existing and the circulation share inflates.

## 4. Adjacency matrix rows relevant to a lobby

The KB's matrix notation (FACT): **AG-02** four typed predicates — `REQUIRED_ADJ(i,j)` (shared wall +
permitted door), `PREFERRED_CLOSE(i,j,τ)` with **τ = 8–16 tiles (4–8 m) typical**, `SEPARATE(i,j,δ)`
(min cost ≥ δ, **no direct door**), `PROHIBIT(i,j)` (no shared wall, no door, for any role). **AG-06**
grades `5 4 3 2 1 0 −1`, X/−1 scored as a **hard fail, never traded off** against positives. FP-10's grid
caveat: **a shared wall is not an edge, only a shared door is** — so "lobby next to lift hall" must be
encoded as a door edge or it is never checked.

Must-touch (grade 4–5) rows for an arrival level, all KB-grounded:

| Pair | Grade/predicate | Rule ID + source |
|---|---|---|
| outside → lobby | `REQUIRED_ADJ`, public door run | **FP-11** public labels at `depth ≤ 1`; **RP-02** street floor gets the public programme; **AG-11** sequence `outside → lobby(1) → lift hall(2) → guest corridor(2) → room(3)` |
| lobby → front desk | `REQUIRED_ADJ`; the desk is *in* the lobby accumulation set | SP:363 (queue positions); **SP-04** cap queue tiles separately |
| lobby → lift hall | `REQUIRED_ADJ` + `PREFERRED_CLOSE τ` | **AG-11** sequence above; **RP-04** core capacity from room count; **FP-23** portal rectangle identical every floor |
| lobby → lounge / bar / restaurant | `PREFERRED_CLOSE(τ ≤ 8–16 t)` | **AG-02** grid translation; **AG-10** "the maximum-integration node is a public room or a declared corridor" |
| kitchen → service entry; kitchen → stores | `REQUIRED_ADJ` | **RP-03** three separate entries; **RP-07** clean/dirty separation, incoming vs outgoing goods |
| kitchen–pantry–service–dining (4-clique) | **unsatisfiable directly** | **AG-04**: the frequent real case, quoted verbatim — "the honest solution is a shared hall/servery vertex, i.e. convert three direct contacts into hub contacts (lever 2 of TH-05) and re-score"; SKILL gate 4: "a corridor, lobby or servery node exists precisely to satisfy unsatisfiable adjacency" |
| lobby = hub touching k named rooms | degree is bounded, not free | **AG-05**: `capacity = 2W+2H−4` exposed tiles; "a 4×4 'lobby' asked to touch 8 named rooms is not [trivial] (capacity 12, and each door needs 2 tiles of run width)"; "minimum footprint for a hub touching k rooms: outer perimeter ≥ 2k tiles" — so a 9-room hub needs **≥ 18–36 tiles of frontage**: a lobby of at least ~8×12 outer |

Must-separate / must-not-touch rows:

| Pair | Predicate | Rule ID + source |
|---|---|---|
| public lobby ↔ kitchen / waste / linen / receiving | `PROHIBIT` for role=public, allowed for staff/service | **AG-02** "a prohibited pair that is only prohibited for some roles (public must not enter the kitchen; staff must) — encode the role set"; **RP-01** any door run joining a public room directly to a service room is **rejected** unless a buffer sits between; **RP-07** `guest_intrusion = count(public paths whose shortest route crosses a service room)`, target **zero** |
| public route ↔ service route | separated sub-graphs, touching only at `transfer` nodes | **RP-07**; SKILL §Circulation "the test is measured conflict crossings, not aesthetics"; **FP-11** service "reachable without crossing a public room" |
| soiled ↔ clean (waste/linen/food) | `SEPARATE` | **AG-15** (NHS HBN 00-09 "good separation of clean and dirty activities"); **SKILL §MEP** clean vs dirty each has its own corridor, crossings counted |
| lobby ↔ housekeeping cart staging | `SEPARATE` | **RP-07** failure symptom quoted verbatim: "housekeeping carts queued in the guest lobby" |
| **every** `SEPARATE`/`PROHIBIT` pair | needs a **witnessed buffer** — "A wall alone is not a buffer" | **AG-24**: intermediate tiles must belong to a room with grade ≤1 to both sides, or to circulation/outside; fail if the only separation is a 2-tile wall. Second exception bites this exact brief: "**a buffer that is itself a destination (a lounge between lobby and guest rooms) satisfies the letter of the rule and violates the intent** — check the buffer's own grade to both sides, and also its threshold depth" |
| separation faked by thickening | forbidden | **AG-02** failure mode: "the commonest error is writing a separation as grade 0 and then satisfying it by thickening a wall to two tiles (fake separation, TH-04) — check distance, not wall thickness" |

Circulation-quality rules for the lobby as a hub (FACT): **AG-14** public/guest skeleton
`ringness ρ ≥ 0.25`, service skeleton may be `ρ = 0` · **AG-23** declare `skeleton_type(role)`; hub/spoke
holds iff one node has `deg ≥ 0.6·n_circ`; **decision_points per required route ≤ 3** for guest/public ·
**AG-13** 0 cut vertices between entry and any required exit · **AG-12** min-cut usually "a single door,
not a corridor", and "the doors that most often become the cut are the tagged ones" → compute per role ·
**AG-10** "a room can be globally integrated yet 6 thresholds deep from reception (**a real hotel
complaint pattern**)".

## 5. Real-project evidence: what the KB actually has

The register is honest that **no named hotel in the KB carries a lobby area, a seat count or a
front-desk dimension.** What exists:

| Case | Numbers in the KB | How the KB used it | Label |
|---|---|---|---|
| **CR-09 Fogo Island Inn** — the only fully dimensioned hotel | **4,500 m² gross, 29 guest rooms**, rooms 350–1,100 ft²; two-storey E-W volume = public rooms, four-storey SW-NE volume = remaining public + **all** guest rooms; **level 1 programme: reception, dining room, kitchen, laundry, storage and mechanical installations** | RP-01 (tripartite zoning inside one building), RP-03 (services resolved away from guest arrival), RP-07 ("section zoning of service, public, private") | FACT (T3) |
| **CR-10 Marina Bay Sands** | **~2,600 guest rooms** in three towers; podium holds "casinos, conventions, shops, and museums"; SkyPark 2.5-acre / 151 m pool | RP-01: "a guest never crosses the gambling floor to reach the lift" — the podium-is-public argument | FACT (T3), no areas |
| **CR-01 Unité d'Habitation** | 135×24×56 m, **337 dwellings / 1,600 inhabitants**, interior shopping streets on floors 7–8 | RP-01/RP-02: documented *inversion* — the public street mid-stack | FACT (T3). INFERENCE cross-check: 1,600 people served by a mid-level street inside a 3,240 m² footprint — the KB's only real-world 1,000+-person amenity-floor instance |
| **CR-21(a) hotel planning guidance** (Archgyan, T4) | rooms 28–30 m² midscale / 32–38 upper-upscale / 40+ luxury / suites 55–75; corridors 1.22 m min, typically 1.5–1.8 m; **NTG 65–72 % double-loaded, single-loaded 10–15 points worse**; **BOH 15–25 % of gross**; **kitchen 0.5:1 full-service / 0.3:1 satellite**; **1 lift station per 75 guest rooms**; dead-end 6.1 m sprinklered / 15.2 m | RP-04, RP-06, RP-07 — all written as "measure and publish", never "must equal" | FACT that the guidance says this; **T4** |
| **CR-21(c) Studio Puisto, hotel BOH** (T4) | kitchens/laundries/storage/receiving/trash/housekeeping/front-office support "hidden from the hotel guest rooms"; trucks "without disrupting the guest parking"; "clear separation of incoming and outgoing goods"; linen chute to "every floor in the service elevator landing"; "dedicated break areas" | RP-07 | FACT (T4) |
| **CR-14 Saunalahti School** (T3) | ~10,000 m² for **750 students**; "classrooms group around small lobbies for collaboration" | RP-16/AG cluster logic | used for *cluster lobbies*, not arrival lobbies |
| **CR-19 Oodi**, **CR-06 GCUH**, **CR-18 Maggie's**, **CR-20 Kansai** | 17,100 m² / 3 floors, ground floor "zero-threshold"; 175,000 m² seven-storey atrium; Maggie's rooms "1 m² up to 50 m²", "**the hearth, not the reception desk, organises the plan**"; Kansai 1.7 km, **100,000 passengers/day**, 42 gate wings | RP-01/RP-02/RP-23; RP-24 (queue/threshold); the airport is the KB's **only** mass-arrival precedent | FACT (T3) |
| **RP-16 / FP-cluster lobby minima** (the only *quantified* lobby numbers in the corpus) | "a shared lobby of **≥ 24 tiles (6 m²)** serving both regimes"; "a cluster = 3–6 rooms + one `lobby` room of **≥ 32 tiles (8 m²)**", every cluster room reaches the lobby in ≤ 6 steps, `lobby_share = lobby_tiles/floor_tiles` **target 0.05–0.10** | school/care clusters | FACT (T3-derived heuristics) — **school/care, not hotel; the 6–8 m² figures are cluster lobbies, not arrival halls, and must not be imported as hotel numbers** (SKILL: "when you cannot say which type a rule came from, it is a residential default — check it") |

Named gaps, stated by the KB itself (FACT): "**No primary lift-traffic standard**, so RP-04's lift-count
logic borrows the T4 'one station per 75 guest rooms'" · "**No verified floor areas for several
high-value plans (Kyoto Station, Acros Fukuoka, **Inada Hotel**, Lloyd's of London, Pixel) — they are
omitted rather than described from memory**" (real-projects.md Weak or contested, item (iv):423) ·
"**The hospitality number library is T4**… agree in direction but not in denominator" (:415) ·
"**Hotel BOH ratios, retail sales-to-stock, and per-cover F&B densities have no retrieved source at
all**… the three weakest families of numbers in it. Treat as placeholders" (space-programming.md
:515).

**Conclusion of §5: the KB cannot substantiate a real-practice area for 500 people in a hotel lobby,
because no source in it states a lobby occupancy or lobby area for any hotel.** Anyone quoting
"m² per person for a hotel lobby" from this corpus is laundering a heuristic.

## 6. Feasibility arithmetic (all INFERENCE on FACT bands; sources named inline)

Step 1 — the demand, from the only density bands the corpus carries (SKILL:591, HB-01/HB-20):

| Basis | m²/p | × 500 | in tiles |
|---|---|---|---|
| standing, packed (explicitly **not a comfort default**) | 0.25 | 125 m² | 500 t |
| standing, packed ceiling | 0.5 | **250 m²** | 1,000 t |
| standing, comfortable | 1.2 | **600 m²** | 2,400 t |
| walking | 2.3–3.8 | **1,150–1,900 m²** | 4,600–7,600 t |

Step 2 — net areas available (perimeter wall tax only, `(W−2)(H−2) × 0.25`):

| Option | gross | net | net left after BOH at RP-07's 15 % floor of gross | 500 @0.5 | 500 @1.2 | 500 @2.3 (walking) |
|---|---|---|---|---|---|---|
| A ring 8 — 64×34 | 544 m² | **496 m²** | 496 − 82 = **414 m²** | 250 m² leaves **164 m²** for desk+bar+restaurant+WC+lift+luggage → **FAIL** | 600 m² > 496 m² net by **104 m²** → **FAIL** | 1,150 m² = 2.3× whole canvas → **FAIL** |
| B ring 4 — 72×42 | 756 m² | **700 m²** | 700 − 113 = **587 m²** | 250 m² leaves 337 m² → **possible as a crush queue with a bar + WCs + lift hall, no seated F&B for 500** | 600 m² vs 587 m² left → **FAILS by ~13 m² before a single desk, WC or lift** | 1,150 m² > 700 m² → **FAIL** |
| C whole canvas — 80×50 | 1,000 m² | **936 m²** | 936 − 150 = **786 m²** | **PASSES** | 600 m² leaves **186 m²** for lift hall (63) + WCs (75) + desks (16) + vestibule (24) = 178 m² → **PASSES with ~8 m² of slack, and zero for lounge/restaurant/bar/BOH-corridor beyond the 15 % already taken** | 1,150 m² > 936 m² → **FAIL** |

Step 3 — the two rows that settle it:
- **Restaurant for 500: 500 × (1.1–1.6) + 0.5:1 kitchen = 825–1,200 m²** (SP:364 + CR-21(a)). The
  current envelope is 544 m² gross. **A 500-cover restaurant alone is 1.5–2.2× the entire buildable
  area**, and at ring 4 it is 1.1–1.6× that. 500 seated covers is therefore arithmetically out on every
  option, including the whole canvas once anything else is present.
- **Lifts for the stack that houses 500: 250 rooms → 4 stations; 500 rooms (if all single) → 7 stations**
  (RP-04). Cars 4×4 t = 4 m² each + 2.5 m deep landing (FP-23). Core 16–28 m² + landing 20–35 m². This is
  the only 500-adjacent number the KB lets you size *from a real ratio*.

Step 4 — what the KB's own method instead demands (**SP-08**): size the arrival level from
`peak concurrent = occupancy × turnover`, not from 500. Turnover is **not in the KB**, and SKILL gate 3
says the arrival profile is an input the agent declares and then sensitivity-tests. Declaring
**20 % concurrent = 100 people** (assumption, Confidence Low, owner = brief):

| Row | Basis | m² |
|---|---|---|
| vestibule / airlock (2 runs) | retail decompression 1.5–3 m depth (CR-21g) + FP-21 3-tile turn | 20 |
| FOH lobby hall as accumulation + circulation | 100 × 1.2 (HB-01) + 6-tile assembly main (SP-13) | 120 |
| front-desk bank, 8 positions | queue 100 @1.2 + counter envelope (**no KB m²/position**) | 140 |
| lounge, 60 seats | hospital waiting 1.0–1.5 m² (SP:378) | 75 |
| bar, 20 covers | 1.1–1.6 m²/cover (SP:446) + satellite 0.3:1 | 40 |
| restaurant, 60 covers | 1.1–1.6 + kitchen 0.5:1 (CR-21a) | 120 |
| public WCs, 10 fixtures | **2.0 m²/fixture (FP-05)** + ~50 % circulation (fixture ratio NOT IN KB) | 30 |
| lift hall, 4 cars | 1/75 rooms (RP-04) + 4 m² car + 2.5 m landing (FP-23) | 40 |
| luggage / bell | assumption, no KB row | 12 |
| **programme subtotal** | | **597 m²** |
| BOH @15 % of gross (RP-07) | | 82 |
| internal partition tax (SP-14, ~12 rooms at 33 % of their own footprint) | | ~60 |
| **TOTAL REQUIRED** | | **≈ 739 m² net → needs ~800 m² gross** |

## 7. Verdict

1. **500 people is not a hotel-lobby number in this corpus.** No KB source states a lobby occupancy,
   lobby area, or m²/person for any hotel (space-programming.md:363 gives only "driver: arrivals/hour,
   queue positions"; real-projects.md:423 records that no hotel floor areas could be verified). 500
   simultaneous occupants is a **civic assembly** load (SKILL §Building-Type Rules, Civic row), and the
   KB's own hospitality rules (SP-08) size a hotel arrival level from `occupancy × turnover`, i.e. a
   wave.
2. **Ring 8 (544 m² / 496 m² net): impossible.** 500 people at the *comfortable* standing band need
   600 m² of floor — 104 m² more than the whole net envelope, before one desk, WC, lift or wall. Even at
   the *packed* band (0.5 m²/p, 250 m²) only 164 m² remains after BOH for reception + lounge + F&B + WCs
   + lift hall + luggage, and a single 500-cover restaurant needs 825–1,200 m². At the walking band
   (2.3–3.8 m²/p) the requirement is 2.1–3.8× the entire net envelope.
3. **Ring 4 (756 m² / 700 m² net): still impossible for 500 standing comfortably** — 600 m² of standing
   plus 113 m² of BOH is 713 m² against 700 m² of net, so it fails before any furniture, and fails again
   under the wall/door tax (SP-14). It holds 500 only as a **crush queue** at 0.5 m²/person, which the KB
   flags as the packed end and not a comfort default.
4. **Whole canvas (1,000 m² / 936 m² net): marginal, and only as an assembly hall.** 600 m² standing +
   150 m² BOH + ~178 m² of desk/WC/lift/vestibule = 928 m² against 936 m² net — passes with ~8 m² of
   slack, i.e. **no slack at all**: no restaurant, no lounge, no internal wall tax, and the street ring is
   gone. This is a ticket-gate concourse, not a hotel lobby.
5. **The credible rebuild is a peak-wave programme.** At a declared 100 concurrent (20 % of 500) the
   minimum room-by-room program above is **≈ 597 m² of net programme + 82 m² BOH + ~60 m² partition tax
   ≈ 739 m² net → ~800 m² gross**, which **does not fit 544 m², does not fit 756 m², and needs the ring
   reduced below 4 or the arrival level split across two floors**. Trimming to a lean FOH (no
   restaurant, 20 bar covers, 40 lounge seats, 8 WC fixtures) reaches **≈ 424 m² net and fits the current
   544 m² envelope with ~72 m² to spare**. That is the only configuration in which the present footprint
   is defensible.
6. **What "enough facilities from real practice" can honestly mean here, per the KB:** more *positions*
   and *fixtures* sized off declared peaks — 8+ front-desk positions (queue positions, SP:363), 4 lift
   stations per 250 rooms (RP-04), 1.1–1.6 m²/cover of real F&B seating, 2.0 m²/WC minimum footprints
   (FP-05), 3-tile passing and 6-tile assembly arteries (SP-13, FP-21) — not 500 standing bodies. Any
   claim of "500 capacity" must state which band of HB-01 it uses, because the 0.25 m²/p figure that
   makes it fit is the one the KB explicitly labels "the packed end, not a comfort default".
7. **Flag register (unclosed by this extraction):** occupant-load factor per use — **not retrieved**,
   IBC 1004/1005 table absent (SP-07, `REQUIRES CODE VERIFICATION`) · public-WC fixture ratio to peak
   capacity — **NOT IN THE KB** · luggage/bell desk — **NOT IN THE KB** · arrival wave / turnover —
   **NOT IN THE KB**, agent-declared input (SKILL gate 3, HB-26) · specific flow rate for AG-12 min-cut —
   **NOT IN THE KB** · every hotel area band above is `UNCITED — heuristic, Low` and the file's own rule
   is that "heuristic bands are planning priors for the agent to sanity-check against, **not** design
   inputs" (space-programming.md:23-25).
