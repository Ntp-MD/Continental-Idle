# Research file 13 — Human scale & ergonometrics on a 0.5 m tile grid (Domain M)

Scope: the body-and-furniture layer — anthropometric basis, clearances, reaches, turning, doors,
sanitary, kitchen, workspace, seating/sightlines, beds (by jurisdiction), hospital envelope,
retail, service trolleys, stairs, effective corridor width, route continuity. `architecture-theory.md`
HS-adjacent rule TH-21 states the *principle* (design clearances for the large user, reaches for
the small); this file owns the *register*: the numbers, the population each belongs to, and the
tile rounding. Goal-task Domain M: "Prevent geometrically valid but physically unusable designs."

Host grid (verified in code): 1 tile = 0.5 m; 4 tiles = 1 m²; 2 tiles = 1.0 m; tile states ONLY
`walkable | blocked | door`; wall = one blocked tile; rooms = 4-connected flood-fill of walkable
tiles, door cells belong to no room; furniture is NOT modelled — implied by fixture tags; typing
uses 15 `detectTags` with lowest-priority-wins and a `hall` fallback
(`src/blueprint-editor/domain/schema/rooms.ts:9-33`); A* octile, diagonals only when both
orthogonal neighbours are open and unoccupied; no heights. Every real clearance must be rounded
**UP** to whole tiles and both values reported.

## Rules

### HS-01 Dimension every clearance from the large-percentile body and every reach from the small-percentile body
- Rule: For every space type, publish two numbers per requirement: a *clearance* value sized on a large body (95th percentile male envelope, or the largest wheelchair in service) and a *reach* value sized on a small body (5th percentile female, seated where the design must work for a wheelchair user). Reject any room whose clearance was taken from an "average person" figure.
- Evidence: The asymmetry is the standard rationale behind accessibility dimensioning: reach ranges are set so a small-statured or seated person can operate controls, while clear floor space, door widths and turning spaces are set from the largest mobility device and body envelope (2010 ADA Standards §308 reach ranges vs §304 turning space vs §404 door width). ISO 7250-1 exists specifically to give designers the percentile set for both uses; Pheasant & Haslegrave give the British distribution tables that show male/female and 5/95 spread on the same dimension.
- Source: US Access Board, 2010 ADA Standards for Accessible Design, ch. 3 https://www.access-board.gov/ada/chapter/ch03/ — T1; ISO 7250-1:2017 *Ergonomics — Basic human body measurements for technological design* (T1, cited by standard number); Stephen Pheasant & Christine Haslegrave, *Bodyspace: Anthropometry, Ergonomics and the Design of Work*, 3rd ed., Taylor & Francis, 2006 — T3 (no URL retrieved); HFES, *Human Factors and Ergonomics Society Guidelines: Anthropometric Data* https://www.hfes.org/Portals/0/Publications/Guidelines_AnthropometricData.pdf — T2/T3.
- Class: DESIGN PRINCIPLE (with CODE REQUIREMENT values attached)
- Scope: universal
- Confidence: High
- Grid translation: Clearance values → `ceil(m/0.5)` tiles. Reach values → the tile whose *centre* the control sits in must lie within `ceil(reach/0.5)` tiles of the standable tile. Check: for every room type, the file lists both numbers; a room with only one number fails review.
- Exceptions / failure mode: Equipment-driven rooms (boiler, server, laundry, plant) are sized by the machine plus its maintenance envelope, not by a body. Failure symptom: a "spacious" plan whose single shelf height, lift button or towel rail is 1.9 m up, or a "compact" accessible WC sized on a 1.75 m standing male.

### HS-02 Freeze the anthropometric basis table before drawing anything, and name the population
- Rule: Adopt one declared data set (population, year, percentile convention) for the whole project and record it. Every register value in this file must be traceable to either that data set, a standard, or a published furniture dimension. Never silently mix a US percentile table with a European furniture catalogue in the same room check.
- Evidence: ISO 7250-1 specifies measurement conditions and a minimum set of dimensions to report precisely so designs are not dimensioned off undocumented numbers; HFES/anthropometry guidance is explicit that data must be matched to the *using* population, because a mixed or unknown population makes a percentile claim meaningless. Panero & Zelnik's whole method is a published conversion table from body dimension to furniture and space dimension.
- Source: ISO 7250-1:2017 — T1 (title/number); James Panero & Martin Zelnik, *Human Dimensions & Interior Space*, revised ed., Whitney Library of Design, 1979 — T3 (no URL retrieved); HFES anthropometric guidelines (URL above) — T2/T3.
- Class: ENGINEERING CONSTRAINT
- Scope: universal
- Confidence: High
- Grid translation: Emit `anthropometric_basis = {population, year, percentile_rule}` once per floor set and require every clearance record to reference it. Check: `every clearance in the register resolves to a named source row`.
- Exceptions / failure mode: A project for a known closed population (staff of one plant, a school age band, bariatric care) legitimately replaces the general table; it must say so. Symptom: a design that "meets ADA" on paper while quoting 95th-percentile *Dutch male* stature and *US female* reach.

### HS-03 One person in motion needs 2 tiles of route width, two passing need 3–4
- Rule: Minimum single-file person route = 1.0 m (2 tiles). Comfortable single person = 1.2 m. Two people passing = 1.5 m (3 tiles). Two people passing comfortably or two wheelchair users = 2.0 m (4 tiles). Never credit a 1-tile (0.5 m) route as walkable circulation for a person, let alone furniture.
- Evidence: Body breadth governs: standing shoulder breadth is roughly 0.45–0.50 m for adult males, so a 0.5 m route leaves zero clothing/margin, and elbow swing while walking adds to the dynamic envelope (Pheasant & Haslegrave dynamic-body-space discussion; Panero & Zelnik's circulation widths). Accessibility corridor minimums sit above body breadth on purpose: 900 mm in England's Approved Document M for a route in buildings other than dwellings, 915 mm (36 in) as the US minimum accessible route width.
- Source: Approved Document M 2022 (England), *Access to and use of buildings*, Vol. 2 — T1 (cited by edition, no URL retrieved); 2010 ADA Standards §403.5.1 accessible route width https://www.access-board.gov/ada/chapter/ch04/ — T1; DIN 18040-1:2010-10 (Germany), *Barrierefreies Bauen — Publicly accessible buildings*, corridor 1500 mm / 1200 mm with passing places — T1 (cited by number).
- Class: STANDARD (also argued as: / CODE REQUIREMENT)
- Scope: universal; the exact minimum is jurisdiction-specific
- Confidence: High for the tile band, Medium for the exact code numbers
- Grid translation: 0.9 m → 2 tiles (1.0 m) pass; 1.2 m → 3 tiles (1.5 m) pass; 1.5 m → 3 tiles exact; 2.0 m → 4 tiles exact. Check: `min corridor interior run ≥ 2 tiles`, `≥ 3 tiles where two-way traffic is programmed`.
- Exceptions / failure mode: A 1-tile route is legitimate only for a *dead-end reach* (a niche, an appliance gap). Symptom: an "accessible" plan whose only route to the exit is 0.5 m wide — A* will happily path a single NPC through it, so the grid cannot feel the failure.

### HS-04 Use 4×4 tiles for a wheelchair turning circle, and know why the grid lies about it
- Rule: Provide turning space as a 4×4-tile clear square (2.0 × 2.0 m) wherever a route is long, a room must be entered and left facing forward, or a single accessible WC/bed space exists. Accept a 3×3-tile square (1.5 × 1.5 m) only where the governing standard is metric (1500 mm). Never draw a circle: the grid cannot express one, so a 1525 mm circle becomes a 2.0 m square — 31 % more area than the code requires.
- Evidence: 2010 ADA Standards §304.3 requires a turning space of 60 in (1525 mm) diameter, or a T-shaped space fitting a 60 in square. BS 8300-1:2018 and DIN 18040-1 specify a 1500 mm diameter turning area, which is exactly 3 tiles. Powered/large-wheelchair users need more than 1500 mm in plan, which is why generous practice uses 1800–2300 mm.
- Source: 2010 ADA Standards §304 https://www.access-board.gov/ada/chapter/ch03/ — T1; BS 8300-1:2018 *Design of an accessible and inclusive built environment — Part 1: Commercial buildings* — T1 (by number); DIN 18040-1:2010-10 — T1 (by number).
- Class: CODE REQUIREMENT
- Scope: universal in accessible routes; the 1500 vs 1525 split is jurisdictional
- Confidence: High (60 in / 1500 mm), Medium (power-chair 1800 mm practice)
- Grid translation: 1.525 m → 4 tiles (2.0 m) pass, over-provides by 0.94 m²; 1.5 m → 3 tiles (1.5 m) exact; 1.8 m → 4 tiles (2.0 m); 2.3 m → 5 tiles (2.5 m). Check: `every accessible route has a 4×4-tile (or metric-3×3) clear square at its end and at each change of direction > 90°`.
- Exceptions / failure mode: The T-shaped ADA alternative is *not* expressable on this grid without modelling the arms as clear tiles; do not claim credit for it. Symptom: a 12-tile dead-end corridor with no square at the end — the NPC model still turns (it has no turning constraint), so only the check catches it.

### HS-05 Specify door *clear opening* width, not leaf width, and never put an accessible door on 1 tile
- Rule: Record doors as a tile run plus the resulting clear opening. 1 tile = 0.5 m: acceptable only for a store/closet. 2 tiles = 1.0 m run ≈ 0.85–0.90 m clear after a 40–50 mm leaf — the only accessible option on this grid. 3 tiles = 1.5 m for an aisle-width double door or a trolley door. Every accessible route door must be ≥ 2 tiles.
- Evidence: 2010 ADA Standards §404.2.3 requires 32 in (815 mm) *minimum clear width* measured between the face of the door and the stop at 90°; §404.2.3 exception allows 31 1/2 in at doors other than accessible-route primary. Approved Document M Vol. 2 gives 825 mm minimum clear opening for a single-leaf door in buildings other than dwellings (1025 mm for double-leaf through one leaf), and 775 mm for dwellings; DIN 18040-1 requires 905 mm clear (1000 mm nominal leaf). A nominal 800–900 mm leaf loses 50–90 mm to frame and stop.
- Source: 2010 ADA Standards §404 https://www.access-board.gov/ada/chapter/ch04/ — T1; Approved Document M 2022, Vol. 2, door-opening widths — T1 (by edition); DIN 18040-1:2010-10 — T1 (by number).
- Class: CODE REQUIREMENT
- Scope: universal
- Confidence: High (815 mm / 825 mm / 905 mm family), Medium (exact 2022 AMD values pending verification)
- Grid translation: 0.815 m clear → 2 tiles of run (1.0 m) pass with ~0.15 m of leaf+frame loss absorbed; 0.905 m clear → 2 tiles marginal (verify frame allowance); 1.0 m clear → 2 tiles marginal, 3 tiles (1.5 m) safe. Check: `every door on an accessible route has run_tiles ≥ 2`.
- Exceptions / failure mode: On this grid the wall is 0.5 m thick, so a real door's *reveal* is exaggerated: a 2-tile door is a 1.0 m hole through a 0.5 m-thick wall, which behaves like a short tunnel for a long object (bed, trolley). Symptom: a door that passes width but fails the maneuvering clearance in HS-06.

### HS-06 Reserve approach and swing space on the latch side of every door
- Rule: For each door, publish the approach geometry from the maneuvering-clearance table, not from intuition: a forward (straight) approach to a **pulling** door needs 1525 mm (60 in) perpendicular to the door face plus 455 mm (18 in) beyond the latch/hinge side; a forward approach to a **pushing** door needs 1220 mm (48 in) perpendicular and no latch-side clearance unless a closer or both-side hardware applies (then add ~305 mm / 12 in). Side approaches need 1220 mm perpendicular with 455–610 mm on the latch side. On the grid: 1 extra tile beside the door run, and never a door that opens directly into a 2-tile corridor. Interior door opening force is capped at 5 lbf (22 N), which is what makes a wide leaf on a 2-tile run affordable.
- Evidence: Verified against the 2010 ADA Standards ch. 4 text: §404.2.3 minimum clear width 32 in (815 mm) measured between the face of the door and the stop at 90° open; §404.2.4.1 Table (maneuvering clearances) gives the 60 in × 18 in pull-side and 48 in × 0 in push-side forward approaches quoted above; §404.2.9 interior/hinged door opening force 5 lb max. DIN 18040-1 asks for a larger maneuvering area in front of the door than ADA does (metric practice typically plans a 1500 mm forecourt plus latch-side space, i.e. the "2300 mm" door maneuvering figure) — UNCITED to the DIN text this session.
- Source: 2010 ADA Standards §404 https://www.access-board.gov/ada/chapter/ch04/ — T1, **read this session (values verified)**; DIN 18040-1:2010-10 — T1 (by number, values UNCITED); Neufert, *Architects' Data*, 4th ed., Wiley, 2012, circulation/door tables — T3 (UNCITED numeric).
- Class: CODE REQUIREMENT
- Scope: universal; DIN vs ADA values differ by jurisdiction
- Confidence: High (2010 ADA §404.2.3/§404.2.4.1/§404.2.9 values — read and verified this session; the CODE REQUIREMENT class rests on this limb alone) / Medium (DIN 18040-1 text and the metric "2300 mm" forecourt figure — UNCITED, not a code claim here)
- Grid translation: 0.455 m → 1 tile (0.5 m) pass; 0.61 m → 2 tiles (1.0 m) pass; 1.22 m → 3 tiles (1.5 m); DIN 1.5 m → 3 tiles. Check: `for each door tile-run, count the tiles that are walkable AND door on the latch side within 1 tile of the run end ≥ required tiles`, and `a door swinging into a corridor leaves ≥ 2 tiles of corridor clear while open`.
- Exceptions / failure mode: Sliding and automatic doors remove the swing reserve but need their own clear floor space beside the run. Symptom: a hotel guest room where the door opens across the only 1.0 m lobby tile, so a wheelchair user inside cannot get out — invisible to A* (static tile states).

### HS-07 Give every sanitary fixture a clear floor space and a transfer side, and honour the 1.5-tile side gap
- Rule: Water closets need a 1.5 m minimum clear floor space perpendicular to the rear wall and 0.76 m wide, with 380–430 mm from centreline to the side wall and a clear transfer side. Basins need 0.76 × 1.2 m forward approach. Showers ≤ 1.5 m² need an adjacent 0.76 × 1.2 m clear space. Grab rails: horizontal rail 33–36 in (840–915 mm) AFF and side rail 33–36 in with 12 in clearance in front of the water closet.
- Evidence: 2010 ADA Standards §604 gives the water closet clearances (60 in min in the perpendicular dimension for a floor-centered fixture, 30 in min width, 16–18 in centreline to side wall, 21–24 in to the rear wall); §606 washers/basins 30 × 48 in clear floor space; §608 bathtubs/shower stalls 60 × 60 in stall and 30 × 60 in transfer space; §609 grab-bar height 33–36 in. Clear floor space overall: §305.2 30 × 48 in minimum, §305.3 two clear spaces may overlap.
- Source: 2010 ADA Standards ch. 6 https://www.access-board.gov/ada/chapter/ch06/ — T1; 2010 ADA Standards §305 https://www.access-board.gov/ada/chapter/ch03/ — T1.
- Class: CODE REQUIREMENT
- Scope: all building types with sanitary fixtures
- Confidence: High for the §305/§604 family, Medium for exact side-wall ranges as recalled
- Grid translation: 0.76 × 1.22 m → 2 × 3 tiles (1.0 × 1.5 m) pass; 1.52 × 1.52 m (60 × 60 in shower) → 4 × 4 tiles (2.0 × 2.0 m), over-provides 1.16 m²; 0.38–0.43 m centreline offset → not expressible (half-tile offsets are impossible): place the fixture on tile centres and accept 0.25 or 0.75 m from a side wall, then verify against the 16–18 in band as *failing by grid quantisation* and widen instead. Check: `WC tile-adjacency: ≥ 3 clear tiles in front, ≥ 1 clear tile on the transfer side, no door tile inside the clear space`.
- Exceptions / failure mode: A door run that spans a room's width splits it on this grid (door cells belong to no room; loose door tiles in an open area do not divide it - check the derived room count), so an en-suite WC counted as one room can lose its clear space to a door tile. Symptom: the plan "has a bathroom" but the hygiene-tagged flood-fill is two rooms and neither has 2 × 3 clear tiles.

### HS-08 Size an accessible WC compartment at 3.0–3.5 m² net minimum, in tiles
- Rule: A single-leaf accessible WC compartment needs at least 2250 × 2250 mm (5 × 5 tiles = 2.5 × 2.5 m, 6.25 m² of plate ≈ 2.25 m² net interior after the wall tax is shared, ≥ 3.0 m² where the door is in the side wall); a double-leaf needs 2250 × 2700 mm. In the US, a 60 in (1525 mm) clear circle inside the stall is the test, which on this grid means a 4 × 4-tile interior stall minimum.
- Evidence: Approved Document M Vol. 2, §2.10-2.17 sanitary accommodation, gives minimum WC compartment dimensions of 2200 × 2200 mm for a single-leaf door and 2200 × 1750 mm variants depending on door position (recall-verified, values to check); NHS/HTM and BS 6465 give comparable figures; ADA does not prescribe a stall area but a 60 in turning space plus §604 clearances.
- Source: Approved Document M 2022, Vol. 2, sanitary accommodation clauses — T1 (by edition, values UNCITED pending verification); BS 6465-2 *Sanitary appliances* — T1 (by number, UNCITED); 2010 ADA Standards §304.3 + §604 — T1.
- Class: HEURISTIC
- Scope: universal; the numeric minimum is jurisdiction-specific
- Confidence: Medium for 2200/2250 mm, High for the derived tile areas — was `CODE REQUIREMENT (metric) / DESIGN PRINCIPLE`; demoted: the recalled AD M text gives 2200 × 2200 mm while the rule asserts 2250 × 2250 mm, no clause was opened, and the tile areas are arithmetic on a chosen figure rather than a quoted requirement
- Grid translation: 2.2 m → 5 tiles (2.5 m) outer; interior after one-tile walls 3 × 3 = 2.25 m² usable → *fails* 1.525 m turning circle + clear floor overlap in the tightest reading, so use 4 × 4 interior (6 × 6 outer, 25 tiles of plate). Check: `accessible WC interior tiles ≥ 16` (= 4.0 m²) — generous but grid-safe.
- Exceptions / failure mode: A shared party wall halves the tax, so two back-to-back WCs are much cheaper than a single one — this is the grid's strongest argument for ganged sanitary cores. Symptom: 12 separate single-tile-thick WCs, each eating 40 % of its footprint in wall.

### HS-09 Kitchen: 1.2 m of work aisle where one cook works, 1.5 m where two, and never open a dishwasher into the aisle
- Rule: Aisles between opposing runs: 1.0 m absolute minimum (grid: 2 tiles), 1.2 m comfortable (3 tiles), 1.5 m for two cooks or an island with appliance fronts opposite (3 tiles). Dishwasher/oven/fridge doors need their own standing zone: 0.76 m of clear in front of an open appliance door beyond the aisle, so the *person standing at the open door* must have a walkable tile that is not the appliance front tile.
- Evidence: NKBA *Residential Kitchen Planning Guidelines* set primary work aisle at 42 in minimum and 48 in where more than one cook is present, with no aisle less than 36 in (recall-verified, needs source confirmation); Neufert gives 900/1000/1200 mm kitchen aisle bands with 1200 mm for two people, and 1000 mm in front of appliances; appliance-door swing arcs are the reason the aisle and the standing zone are counted separately.
- Source: National Kitchen & Bath Association, *Planning Bulletin / Residential Kitchen Guidelines* https://www.nkba.org/ — T1/T3 (industry standard, exact current values UNCITED — verify); Neufert, *Architects' Data*, 4th ed., 2012, kitchen section — T3.
- Class: HEURISTIC
- Scope: residential and hospitality back-of-house kitchens; commercial production kitchens differ (see HS-11)
- Confidence: Medium for NKBA figures (pending verification), High for the tile bands — was `STANDARD`; demoted: neither the NKBA guidelines nor the Neufert aisle bands were opened, the two bodies give different numbers, and a preferred aisle width is a planning convention, not a standard's requirement
- Grid translation: 0.91 m → 2 tiles (1.0 m) pass; 1.07 m → 3 tiles (1.5 m); 1.2 m → 3 tiles exact; 1.5 m → 3 tiles exact; appliance standing zone 0.76 m → 2 tiles (1.0 m). Check: `for every cooking/hygiene-tagged room: min aisle between opposing blocked (fixture) tile runs ≥ 3 tiles`, `every appliance front tile has a walkable tile behind it that is not in another appliance's swing`.
- Exceptions / failure mode: The grid cannot show a 600 mm counter depth or a 450 mm appliance, so a "kitchen" is typable with a single `cooking` tag in a 2 × 2-tile room — geometrically valid, physically impossible. Symptom: a galley with opposing fixtures and 1 tile of aisle.

### HS-10 Keep the kitchen work-triangle legs between 4.0 m and 6.0 m total
- Rule: Sum the three legs store→sink→cooking; require 4.0–6.0 m (8–12 tiles of octile distance) and no leg under 1.2 m or over 2.7 m. Beyond 6 m the kitchen is a corridor; below 4 m the workers collide.
- Evidence: The work-triangle rule is a mid-20th-century kitchen layout standard derived from walking/turning effort between the three work centres, still reproduced in NKBA guidance and in Neufert/Panero-type dimension books as a total of about 4–6 m (recall-verified; exact bounds UNCITED).
- Source: NKBA kitchen planning guidelines https://www.nkba.org/ — T1/T3 (UNCITED exact text); Neufert, *Architects' Data* 4th ed. — T3; Panero & Zelnik 1979 — T3.
- Class: DESIGN PRINCIPLE
- Scope: residential/hospitality kitchens with one cook
- Confidence: Low-Medium (principle High, numeric bounds UNCITED)
- Grid translation: use the host's octile cost: `cost = max(dx,dz) + 0.41421·min(dx,dz)` tile-steps × 0.5 m. Check: `8 ≤ Σ legs(tile-steps) ≤ 12`.
- Exceptions / failure mode: Open-plan and island kitchens, and kitchens serving a great room, legitimately break the triangle for social/circulation reasons; a galley in a hotel guest room has no triangle to speak of. Symptom: a 20-tile triangle in a "compact kitchenette".

### HS-11 Commercial servery and production kitchens need 1.5 m aisles and 1.8 m in front of equipment
- Rule: For a kitchen with staff working shifts (hotel F&B, restaurant), use 1.5 m (3 tiles) minimum between opposing equipment lines where one-way trolley traffic exists, 1.8 m (4 tiles) where two staff pass with loads, and 1.2–1.5 m of clear standing space in front of every appliance; keep hot line and dish return separate so a laden tray never crosses a soiled tray route.
- Evidence: Commercial-kitchen spacing is normally specified as 48–60 in (1.2–1.5 m) between work surfaces with more in front of dish machines and ranges, because staff carry hot loads and the working body envelope widens with a tray; hospitality planning texts (Neufert hospitality sections; hotel FOH/BOH standards) treat 1.2 m as the tight figure. UNCITED — heuristic for the 1.8 m two-way figure.
- Class: ENGINEERING CONSTRAINT (also argued as: / DESIGN PRINCIPLE)
- Source: Neufert, *Architects' Data*, 4th ed., 2012, catering sections — T3 (UNCITED numeric); Foodservice Equipment Standards (FEMA/FEAMA) — T1 (by title, UNCITED).
- Scope: F&B production and servery only
- Confidence: Low-Medium — treat as heuristic until checked against a foodservice standard
- Grid translation: 1.2 m → 3 tiles (1.5 m); 1.5 m → 3 tiles exact; 1.8 m → 4 tiles (2.0 m). Check: `every room typed restaurant/kitchen/bar with back-of-house adjacency has aisle ≥ 3 tiles and ≥ 4 tiles on the main servery route`.
- Exceptions / failure mode: The host does not model equipment, so a "kitchen" with no aisle can still score as valid — this rule is only enforceable if the design keeps a documented furniture layer outside the schema. Symptom: a 4 × 4-tile kitchen with 16 tiles of tags and no standable tile left.

### HS-12 Give a desk 0.7 m of depth, 1.4 m of width, and 1.45 m behind the chair
- Rule: Workstation: desk 0.7 m deep × 1.4 m wide as the small/minimum unit, 1.6 × 0.8 m as the standard; seated zone behind the desk front 0.75 m; plus 0.7 m of chair withdrawal, plus 1.0–1.2 m for someone to pass behind a seated worker (1.45 m total behind the desk edge minimum for a single-sided bay; 1.8 m between desk backs).
- Evidence: EN 527-1 desk height 720–760 mm with a work-surface depth of at least 0.8 m for the standard workstation class; office planning practice (Neufert; Ching *Interior Graphic Standard*) uses 1.4–1.6 m as the minimum bench width per person, ~0.6 m for the seated person's own zone and 1.0–1.2 m of rear circulation, and 1.5 m between facing desk backs so two seated people do not touch knees. UNCITED for the composite 1.45 m figure — derived by addition.
- Source: Neufert, *Architects' Data*, 4th ed., 2012, workspaces — T3; Francis D. K. Ching, *Interior Graphic Standard*, 2nd ed., Wiley — T3 (by edition); EN 527 series *Office furniture — Work tables and desks* — T1 (by number).
- Class: HEURISTIC
- Scope: offices, hotel business corner, study rooms; classrooms differ
- Confidence: Medium for the composite figure, High for the sub-parts — was `STANDARD`; demoted: EN 527-1 was not opened and covers desk height/surface depth, not the 1.4 m bench width or the 1.45 m rear zone, which are office-planning conventions (Neufert/Ching) plus one explicitly UNCITED derived figure
- Grid translation: 0.7 m → 2 tiles (1.0 m); 1.4 m → 3 tiles (1.5 m); 1.45 m → 3 tiles (1.5 m); 1.8 m → 4 tiles (2.0 m). Check: `per person in a meeting/office room: ≥ 2 × 3 tiles of desk footprint equivalent + ≥ 3 tiles of clear behind`, and `aisle behind seated row ≥ 3 tiles`.
- Exceptions / failure mode: A "conference" tag in a 3 × 3-tile room passes the host's typer while seating nobody. Symptom: desk footprint credited but no walkable tile to sit on.

### HS-13 Conference and dining tables: 0.75 m of table front per seated person, and 1.0 m of chair zone
- Rule: Allocate 0.6 m (grid: 2 tiles shared) as the absolute minimum eating width per person and 0.75–0.9 m as comfortable; banquet rounds seat 10 at 1.8 m diameter and 12 at 2.4 m. Provide 0.75 m of chair pull-out behind the table edge, and 1.2 m where a server must pass behind a seated diner (restaurant: 1.4 m recommended).
- Evidence: Panero & Zelnik's dining dimensions give elbow-to-elbow minimum ~0.5 m and comfortable 0.61–0.76 m per diner with ~0.75 m of chair space behind the table edge; hospitality banquet practice uses 18 in (455 mm) minimum, 22–24 in (560–610 mm) comfortable per shoulder, and a 60 in round for 8 or a 72 in for 10. UNCITED for the exact banquet table diameters.
- Source: Panero & Zelnik, *Human Dimensions & Interior Space*, rev. ed. 1979 — T3 (by edition); Neufert 4th ed., seating/tables — T3; Ching, *Interior Graphic Standard* 2nd ed. — T3.
- Class: HEURISTIC
- Scope: all occupied seating around a horizontal surface
- Confidence: High (0.6 m band), Medium (server-aisle 1.4 m), Low (banquet diameters) — was `STANDARD`; demoted: Panero & Zelnik and hospitality banquet practice are measured/tabulated planning data, not a standard, and the banquet diameters are marked UNCITED in the evidence
- Grid translation: 0.75 m per diner → 2 tiles per diner along the table run (1.0 m, over-provides 0.25 m each); 1.8 m round → 4 tiles square envelope; chair zone 0.75 m → 2 tiles; service aisle 1.4 m → 3 tiles. Check: `seats = floor(table_run_tiles × 1.0 / 0.75) × 2 sides`, then `required clear tiles = seats × 2` around the table.
- Exceptions / failure mode: The host cannot see the table, so restaurant capacity is a *declared* number, not a derived one. Symptom: 40 covers claimed in a 60-tile dining room that geometrically seats 16 — this is the single most common scale failure in this project's plans.

### HS-14 Row seating: 0.55 m seat width, 0.9 m row pitch, and a 60 mm sightline C-value
- Rule: Fixed seating: 0.45–0.5 m minimum seat width, 0.55 m with arms, 0.6 m accessible; legroom 0.76 m minimum row pitch for restricted-legroom auditoria, 0.9 m comfortable, 1.0–1.2 m for VIP/cinema-recliner rows. Set the eye-to-object geometry so the C-value (the vertical clear sightline offset over the head in front) is ≥ 50 mm for theatres and ≥ 60 mm for stadia, which means the floor must rise between rows.
- Evidence: Ching's *Interior Graphic Standard* and Neufert tabulate seating widths/pitches with 0.55–0.6 m per person and 0.9 m row centres; sightline C-value practice of 50–60 mm comes from UK/European stadium and auditorium sightline work (the C-value convention is described in Neufert's assembly sections and in NBS/BS 8300-related sightline guidance). UNCITED for the precise 50/60 mm split — commonly quoted but not verified this session.
- Source: Ching, *Interior Graphic Standard*, 2nd ed., Wiley — T3; Neufert, *Architects' Data*, 4th ed. — T3; C-value method in Neufert/BS 8300 sightline discussion — T3/T1 (UNCITED numeric).
- Class: HEURISTIC
- Scope: assembly/auditoria/cinemas only
- Confidence: Medium for widths/pitch, Low for the exact C-value bands — was `STANDARD`; demoted: no sightline code or standard was opened, the 50/60 mm split is flagged UNCITED in the evidence, and Ching/Neufert seat tables are tabulated practice data; the C-value method itself (rise the floor to clear the head in front) is the part that stands
- Grid translation: seat 0.55 m → 2 tiles per 2 seats? No: 0.55 m rounds up to 1.0 m per seat (2 tiles) — the grid *cannot* seat a row economically, so use 2 tiles per seat as the capacity rule. Row pitch 0.9 m → 2 tiles. C-value requires section/height, which the host does not model — declare it *unverifiable on this grid*. Check: `seats ≤ floor(row_width_tiles/2)` and `row pitch ≥ 2 tiles`.
- Exceptions / failure mode: No heights ⇒ no sightlines can be validated. Any claim of "good sightlines" in this project is unfalsifiable; report it as a known blind spot rather than a pass.

### HS-15 Assembly aisles: 1.2 m two-way, 1.1 m stepped aisle minimum, and no aisle shorter than the row it serves
- Rule: Cross-aisles ≥ 1.2 m (3 tiles); lateral aisles in seating blocks 0.9 m minimum, 1.2 m where traffic is two-way; aisle seats: no more than a limited number of seats between a seat and an aisle (≈ 7 seats one-way, 14 accessways per exit door in US practice); vomitory/stair aisle width from occupant load at 0.2 in per person scaled up.
- Evidence: IBC/NFPA 101 assembly seating aisle and accessway tables govern (aisle widths typically 48 in / 1200 mm with stair aisles and 42 in in some configurations; seat/aisle accessway limits in Table 1029/1028 series). UNCITED — I do not have the exact current table values verified this session.
- Source: International Building Code ch. 10 *Means of Egress* (ICC) — T1 (by code edition/number, values UNCITED); Life Safety Code NFPA 101 §14/§15/16 — T1 (by number, values UNCITED); Neufert 4th ed. — T3.
- Class: HEURISTIC
- Scope: assembly only; jurisdictional
- Confidence: Low for numbers, High for the tile bands already given — was `CODE REQUIREMENT (US) / STANDARD (EU)`; demoted: the IBC/NFPA 101 aisle and accessway tables were not opened and the evidence says so outright, so the millimetre/inch values are recalled planning numbers; the underlying code duty (sized cross-aisles, capped seats per accessway, aisle width from occupant load) is real and is what the tile bands proxy
- Grid translation: 1.1 m → 3 tiles; 1.2 m → 3 tiles exact; 1.5 m → 3 tiles. Check: `every seating block bounded by an aisle ≥ 3 tiles`, `no seat more than 4 tiles from an aisle tile`.
- Exceptions / failure mode: Hotel "cinema/lounge" rooms in this project are typed by a `lounge` tag; a 4 × 4-tile lounge cannot carry an assembly aisle, so treat assembly *capacity* as a separate programme row (TH-01).

### HS-16 Beds: use the jurisdiction's own size table, and give 0.9 m at the side and 1.2 m at the foot
- Rule: Never place a bed from a remembered dimension — look up the jurisdiction table below, round the footprint UP to tiles, and check circulation. Bedside: 0.7 m minimum where the bed is against a wall and only one side is used, 0.9 m for making the bed and a nightstand, 1.2 m at the foot for walking past, 1.5 m where a trolley must pass.
- Evidence: Standard bed sizes are market conventions, not standards: UK single 90 × 190, small double 120 × 190, double 135 × 190, king 150 × 200, super-king 180 × 200 cm; EU/DE single 90 × 200, double 180 × 200 (Germany's classic double is 180 wide, while France/Low Countries use 140 × 190/200); US twin 38 × 75 in (965 × 1905), full 54 × 75 in (1372 × 1905), queen 60 × 80 in (1524 × 2032), king 76 × 80 in (1930 × 2032), California king 72 × 84 in. Circulation bands come from Neufert's bedroom tables (≈ 0.6–1.2 m around a bed, 0.9–1.2 m in front of a bed with a nightstand) and hospitality standards.
- Source: market size tables (UK/EU/US) — T3/T5 (widely published, UNCITED to a single authority; verify against a supplier catalogue before use); Neufert, *Architects' Data*, 4th ed., 2012, residential/hotel bedroom dimension tables — T3.
- Class: BUILDING-TYPE CONVENTION (sizes)
- Scope: residential, hospitality, some healthcare; **jurisdictional** for sizes
- Confidence: Medium for the US/UK/EU nominal bed sizes (widely published but UNCITED to a single authority — verify against a supplier catalogue before use); Medium for exact cm conversions; Medium for the clearance bands [classification: the rule also carries STANDARD for its part of the claim - the field holds one label per spec §27]
- Grid translation: bed footprints → tiles (round up): UK double 1.35 × 1.90 → 3 × 4 tiles (1.5 × 2.0 m); EU double 1.80 × 2.00 → 4 × 4 tiles (2.0 × 2.0 m); US queen 1.52 × 2.03 → 4 × 5 tiles (2.0 × 2.5 m, over-provides 1.0 m²); US king 1.93 × 2.03 → 4 × 5 tiles. Circulation: 0.7 m → 2 tiles; 0.9 m → 2 tiles; 1.2 m → 3 tiles. Min guest room (1 double + side + foot + door reserve): 7 × 8 outer tiles = 5 × 6 interior = 7.5 m² net. Check: `for every living-tagged room: bed envelope tiles + ≥ 2 clear tiles on one long side + ≥ 3 clear tiles at the foot`.
- Exceptions / failure mode: A US king (4 × 5 tiles = 10 tiles) plus 0.9 m sides in a 6 × 6-tile room leaves no walkable tile at the head — a classic "valid but unusable" plan. Also: the grid cannot place a bed off-grid, so a 2.0 m bed against a wall is exactly 4 tiles and cannot be centred on a 5-tile wall; headboard/nightstand asymmetry is not expressible.

### HS-17 Hospital bed: 2.4 × 1.1 m fixture, 1.0–1.2 m clear on three sides, 4.5 m² of movement zone
- Rule: Ward bed unit: bed 2.0–2.4 m long × 1.0–1.1 m wide (mattress), plus ≥ 1.0 m clear at the head, ≥ 1.0 m on the treatment side, ≥ 0.5 m (or as required) on the non-treatment side, ≥ 1.2 m at the foot for a crash trolley/pump, and 1.5 m of space when the bed is sited to allow a full 180° transfer or two staff to work. Single isolation rooms must additionally hold a chair, a stand, and a staff PPE donning zone.
- Evidence: Verified against NHS England *Health Building Note 00-03* as summarised in the UK National Infection Prevention and Control Manual, ch. 4 (built environment), "Bed spacing": adult in-patient facilities built after 2010 require **3.6 m between bed centre-lines**, and day-treatment bays **2.45 m centre-to-centre**. With a 1.0 m-wide bed, 3.6 m c-c leaves ~2.6 m of clear space between adjacent beds — which is where the equipment envelope (pump, stand, monitoring trolley, over-bed table) is actually paid for, and it is far more generous than the ~1 m "clearance around the bed" figure commonly paraphrased from HBN guidance. US practice (FGI Guidelines) is quoted at 32 in (815 mm) between beds minimum — i.e. the two jurisdictions differ by a factor of three, because one measures centre-to-centre and the other measures clear gap. UNCITED: the FGI number is recall.
- Source: NHS England, *Health Building Note 00-03: Inpatient Accommodation Spaces* (bed spacing) https://www.england.nhs.uk/wp-content/uploads/2021/05/HBN_00-03_Final.pdf — T1 (PDF body text not machine-readable this session); quoted via National Infection Prevention and Control Manual, *Chapter 4: Infection control in the built environment and decontamination — Bed spacing* https://www.nipcm.scot.nhs.uk/chapter-4-infection-control-in-the-built-environment-and-decontamination/print?section=4780 — T1, **read this session**; FGI Guidelines for Design and Construction of Hospitals — T1 (by title, UNCITED); Neufert 4th ed. healthcare tables — T3.
- Class: STANDARD (jurisdictional: NHS health-purpose guidance, not statute)
- Scope: healthcare only
- Confidence: Medium-High for the NHS 3.6 m / 2.45 m centre-to-centre figures (read this session via NIPCM ch. 4), Low for FGI and for the "1 m around the bed" paraphrase — was `CODE REQUIREMENT`; demoted one tier: HBN 00-03 is purpose guidance rather than a legal code, and the rule's "1.0–1.2 m clear on three sides" is the paraphrase the evidence says is *less* generous than the verified centre-line figure [classification: the rule also carries HEURISTIC for its part of the claim - the field holds one label per spec §27]
- Grid translation: bed 1.1 × 2.4 m → 3 × 5 tiles (1.5 × 2.5 m). **NHS bay spacing:** 3.6 m centre-to-centre cannot be built on a 0.5 m grid with 2-tile beds without rounding up: 2 tiles (bed) + 4 tiles (gap) = 4.0 m c-c (over-provides 0.4 m per bed); 2 + 3 = 3.5 m c-c **fails** 3.6 m — so a compliant bay needs 5 tiles between bed edges for a 2-tile bed. Day bay 2.45 m c-c → 5 tiles (2.5 m) c-c pass. Clear sides 1.0 m → 2 tiles; foot 1.2 m → 3 tiles. Minimum ward bed bay per bed: 5 tiles wide × 8 tiles deep = 40 tiles = 10 m² of walkable area per bed, plus walls. Check: `every healthcare bed unit: bed envelope + ≥ 2 clear tiles on 3 sides`, and `bay pitch ≥ 5 tiles between bed centre columns`.
- Exceptions / failure mode: Equipment (IV stand, monitoring trolley, over-bed table) is not modelled and is exactly what consumes the clearance; bariatric beds (1.5 m wide) break the grid (3 tiles = 1.5 m exactly, no margin). The host has **no healthcare room type at all** in `ROOM_TYPE_SPECS`, so this rule cannot currently be applied by the in-app typer — it is a paper rule until a type exists. Symptom: a "spacious" 4-bed bay where no bed can be approached from the treatment side.

### HS-18 Retail: 1.5 m main aisle, 1.2 m secondary, 0.9 m at the fixture face
- Rule: Shopping aisles must carry *two* laden shoppers or one shopper plus one trolley. Main (circulation) aisle 2.4–3.0 m (5–6 tiles) in a supermarket/high-traffic store, 1.5 m minimum in small retail; secondary/gondola aisle 1.2–1.5 m (3 tiles); fixture-face browsing zone 0.9 m (2 tiles); queue/checkout lane 1.5 m plus a 1.8–2.4 m exit zone; trolley parking 1.1 × 0.6 m per trolley (2 × 2 tiles).
- Evidence: Store-planning practice (Neufert retail section; retail-design literature) uses 0.9 m minimum for a single browsing customer, 1.2–1.5 m for two-way, and 2.4–3.0 m for the main "decompression" and gondola-end run because a trolley is ~0.55–0.6 m wide, ~0.9–1.1 m long, and shoppers decelerate on entry. Accessibility: a 900 mm route is the floor for any store route a wheelchair user must use (ADA §403.5).
- Source: Neufert, *Architects' Data*, 4th ed., retail section — T3; 2010 ADA Standards §403.5 https://www.access-board.gov/ada/chapter/ch04/ — T1; UK Design Guidance for shopping environments/DfT pedestrian design — T1 (UNCITED exact figures).
- Class: HEURISTIC
- Scope: retail, hotel shop, museum shop
- Confidence: Medium (bands), High (trolley nominal width) — was `STANDARD`; demoted: retail aisle widths are store-planning convention from Neufert and retail-design literature (none opened); the only code limb here is the 900 mm minimum accessible route, which is a floor under the bands and not the bands themselves
- Grid translation: 0.9 m → 2 tiles; 1.2 m → 3 tiles; 1.5 m → 3 tiles exact; 2.4 m → 5 tiles; 3.0 m → 6 tiles. Trolley 0.55 × 1.0 m → 2 × 2 tiles. Check: `retail-tagged rooms: main route tiles form a connected subgraph of width ≥ 3 tiles, with a ≥ 5-tile-wide spine at the entrance`.
- Exceptions / failure mode: Fixtures are not modelled, so an "aisle" in this project is only as real as the furniture layer outside the schema; the host will happily type a 4 × 4-tile room as `shop`. Symptom: a plan that reads as a shop but has no aisle at all once racks are drawn.

### HS-19 Service trolleys and luggage set the width of hotel back-of-house routes
- Rule: Every route a housekeeping, room-service, linen or maintenance trolley uses must be ≥ 1.2 m (3 tiles) clear with a 1.8 m (4-tile) turning/passing bay at least every 12 m, and every door on that route ≥ 2 tiles with the swing reserve of HS-06. Guest luggage: a large cabin case is ~0.56 × 0.23 m, a checked case ~0.75 × 0.30 m, so a lift car must take a case laid flat plus occupants — minimum 1.5 × 1.5 m interior, prefer 1.6 × 2.1 m.
- Evidence: Housekeeping/room-service cart widths are conventionally ~0.5–0.7 m wide and ~1.0–1.3 m long, which is why hospitality BOH corridors are wider than guest corridors; the 36 × 48 in (0.9 × 1.2 m) clear-floor-space unit from ADA §305 is the base for the "person plus trolley" allowance; standard luggage sizes are manufacturer conventions. UNCITED for cart dimensions.
- Source: ADA §305 https://www.access-board.gov/ada/chapter/ch03/ — T1; Neufert 4th ed. hotel/service sections — T3; airline/hotel luggage dimension tables (IATA 55 × 40 × 20 cm cabin max) — T3/T5 for the cabin case figure.
- Class: ENGINEERING CONSTRAINT (also argued as: / BUILDING-TYPE CONVENTION)
- Scope: hospitality, healthcare, institutional BOH
- Confidence: Medium (IATA cabin case), Low (trolley dims), High (tile bands)
- Grid translation: trolley 0.7 × 1.3 m → 2 × 3 tiles (1.0 × 1.5 m) footprint; route 1.2 m → 3 tiles; bay 1.8 m → 4 tiles; lift car 1.5 × 1.5 m interior → 4 × 4 interior tiles = 6 × 6 outer tiles (15 tiles of wall tax on a 36-tile plate — note this). Check: `no service route with < 3 tiles of width`, `every lift interior ≥ 4 × 4 tiles`, `a 2 × 3-tile rectangle fits in every service door and lift`.
- Exceptions / failure mode: Service cores shared with guests (a single 2-tile corridor doing both) look efficient and fail at the first trolley. On this grid the lift is a portal, not a room, so its size is a *declared* parameter — HS-27 forces it into the register.

### HS-20 Stairs: satisfy 2h + g = 0.60–0.65 m, keep headroom ≥ 2.0 m, and never model a stair as 1 tile wide
- Rule: Domestic stair: rise 155–220 mm, going 220–300 mm, effective 2×rise + going ≈ 600–650 mm, clear width ≥ 0.8 m (metric, one person) or 0.9 m. Public stair: rise ≤ 150–180 mm, going ≥ 280–300 mm, width ≥ 1.2 m for two-way, landings ≥ the stair width and ≥ 1.2 m long, no more than a limited number of risers between landings. Where a stair is on an accessible route it is not the accessible route — provide a ramp or lift.
- Evidence: England's Approved Document K gives private rise 220 max/155 min, going 220–300 max/min; public rise 150 max (with 44 mm tolerance), going 300 min; headroom 2.0 m minimum. IBC/ADA give riser 7 in (178 mm) max, tread 11 in (279 mm) min, width 44 in (1120 mm) for an accessible means of egress, headroom 80 in (2030 mm). Blondel's rule 2h + g ≈ 630 mm is the classical ergonomic check and matches the modern bands closely.
- Source: Approved Document K 2013 (+2022 amendments), England, *Protection from falling, collision and impact* — T1 (by edition); IBC ch. 10 stairway provisions — T1 (by code, values recall-verified); 2010 ADA Standards §210/§405 https://www.access-board.gov/ada/chapter/ch04/ — T1.
- Class: CODE REQUIREMENT
- Scope: universal; exact bands jurisdictional
- Confidence: High (Blondel, headroom, 0.8/1.2 m widths), Medium (AD K/IBC exact maxima)
- Grid translation: a stair is a *vertical link* — the host has no heights, so model it as a portal plus a declared `stair_geometry` record: width ≥ 2 tiles (1.0 m) private, ≥ 3 tiles (1.5 m) public; run length = number of risers × going (unverifiable, record it). Ramp for accessible route: 1:12 max → 0.5 m rise needs 6.0 m run = 12 tiles of run; state both. Check: `every stair width_tiles ≥ 2`, `every accessible vertical link paired with a lift portal`.
- Exceptions / failure mode: Ship/ladder/steep secondary stairs legitimately break 2h+g, but must be labelled non-accessible and excluded from the route graph. Symptom: a "stair" drawn as a 1-tile-wide blocked-to-walkable seam, i.e. nobody can carry anything down it.

### HS-21 Corridor width is the *effective* width; subtract protrusions before you pass a route
- Rule: Report each route's width after deducting everything that sticks into it: handrails, door frames and open leaves, radiators, fire extinguishers, signage, bollards, bag-drop, structural columns, recessed niches, and the tile-grid wall itself. A route is `clear width between the most adverse protrusions`, measured between faces, not axis-to-axis.
- Evidence: ADA §403.2 caps protruding objects with a leading edge between 27 in and 80 in AFF at 4 in (100 mm) protrusion, and §403.5.1 requires 36 in minimum clear width with a 32 in reduction allowed only for a short segment; IBC/NFPA likewise forbid reducing the required egress width by encroaching objects except for permitted handrail/door encroachments (handrails allowed within the width up to 4 1/2 in / 115 mm on each side). This is why a nominal 1.5 m corridor with 100 mm of pipe-box and a 250 mm radiator on each side is a 1.0 m corridor.
- Source: 2010 ADA Standards §403.2 (protruding objects) and §403.5 https://www.access-board.gov/ada/chapter/ch04/ — T1; Approved Document M 2022, unobstructed route/door approach clauses — T1 (by edition); IBC §1005/§1014 egress obstructions — T1 (by code).
- Class: CODE REQUIREMENT
- Scope: universal
- Confidence: High (4 in / 4 1/2 in family), Medium (exact IBC encroachment wording)
- Grid translation: On this grid a wall is already 0.5 m thick, so a protrusion must occupy a whole tile to exist: any blocked tile inside a route line reduces the width by 0.5 m. Therefore a 3-tile corridor with one protruding tile becomes 2 tiles (1.0 m) effective and *fails* 1050 mm/1.2 m requirements. Check: `for each route tile-run, effective_width = min clear tiles across the run`, and `effective_width ≥ required tiles`, not `nominal`.
- Exceptions / failure mode: The most common plan lie in this project: a 3-tile corridor drawn between fixture tiles that is actually 2 tiles once the fixtures exist. Symptom: capacity claims computed from nominal widths.

### HS-22 The accessible route must be continuous, level, and inside the room graph
- Rule: There must be an unbroken walkable/door tile path from the building entrance (and from each vertical link) to every room a user or staff member needs, with no step, no route narrower than HS-03/HS-21 minimums, no door narrower than HS-05, no dead-end that requires a turn the space cannot make, and no route that passes *through* a private room. Where a level change exists, it must be a ramp at ≤ 1:12 (grid: 12 tiles of run per 0.5 m rise) or a lift.
- Evidence: ADA ch. 2 §206 requires accessible routes connecting accessible elements, spaces and floors, with at least one route in the accessible path from site/approach to each space; §403 gives running slope (1:20 max for a route that is not a ramp), cross slope 1:48, width, and changes in level rules; Approved Document M requires a "level access" entrance and an accessible route to each storey and space (with the lift exemptions in §3.4-3.6). BS 8300-1 requires continuity of the accessible route including maneuvering space at changes of direction.
- Source: 2010 ADA Standards §206 and ch. 4 https://www.access-board.gov/ada/chapter/ch04/ — T1; Approved Document M 2022 Vol. 2 §§2-3 — T1 (by edition); BS 8300-1:2018 — T1 (by number).
- Class: CODE REQUIREMENT
- Scope: universal
- Confidence: High
- Grid translation: Build the room graph (nodes = flood-fill rooms, edges = door runs) and run BFS from the entrance node: `every usable room reachable using only tiles with width ≥ 2 and doors with run ≥ 2`. Because door cells belong to *no* room, treat a door run as an edge, not as part of either room, and require each edge's adjoining clear tiles to exist on both sides. Check also `slope_tiles`: any 1-tile level change drawn without a 12-tile ramp or a lift portal fails.
- Exceptions / failure mode: Rooms with no door tile are unreachable by definition; rooms whose only door is inside another room's private zone break the "no route through private" rule while remaining technically connected. Symptom: a plan that passes every per-room test and fails the whole-building route — this is the Human→Furniture→Room→Corridor→Building chain the goal-task demands.

### HS-23 Reach: 1.2 m high for anything a seated or small person must use, 0.45–0.6 m of forward reach
- Rule: Controls, handles, dispensers, shelves in guest rooms, and every operable part on an accessible route must sit between 380 mm and 1200 mm AFF (grid: within reach band of a standable tile), with a forward reach of 0.6 m comfortable / 0.76 m maximum from a seated position, and 0.45–1.0 m of lateral reach. Overhead storage above 1.5 m is "high storage" and must be duplicated below 1.2 m.
- Evidence: ADA §308 sets reach ranges: forward reach 48 in (1220 mm) max with unobstructed approach and 15 in (380 mm) min; high forward reach over an obstruction 48 in max with 20 in (510 mm) max depth of obstruction; side reach unobstructed 48 in max / 15 in min; seated side reach max 48 in. Anthropometrically the seated 5th-percentile female forward reach is about 0.5–0.6 m and standing shoulder height for a small person is ~1.45–1.5 m, which is why 1.2 m is the practical control band.
- Source: 2010 ADA Standards §308 https://www.access-board.gov/ada/chapter/ch03/ — T1; Pheasant & Haslegrave 3rd ed. 2006, reach tables — T3; HFES anthropometric guidelines — T2/T3; DIN 18040-1 reach band 400–1200 mm (T1, by number).
- Class: CODE REQUIREMENT
- Scope: universal for public/staff-operable equipment
- Confidence: High (48 in / 15 in; DIN 400–1200 mm), Medium (seated reach values)
- Grid translation: height is not modelled → record `aff_mm` in the furniture layer and validate as a tag attribute, not as tiles. Horizontal reach: `ceil(0.6/0.5) = 2 tiles` from a standable tile. Check: `every fixture whose function requires operating has a walkable tile within 2 tiles (0.5 m reach) or 3 tiles (0.76 m)`, `no room's only standable tiles are behind its reach-limited fixtures`.
- Exceptions / failure mode: Deliberately high storage, fire equipment cabinets and staff-only plant sit above 1.5 m and must be labelled so. Symptom: a "hygiene"-tagged bathroom with the towel/soap fixture reachable only from a blocked tile.

### HS-24 Round every fixture UP to whole tiles and report both numbers
- Rule: For each fixture: real dimensions (m), rounded tile footprint, over-provision in m², and the resulting room minimum. Never credit a fixture with a sub-tile position or a half-tile footprint. Never state a clearance in metres and then place it on a tile grid without restating it in tiles.
- Evidence: This is arithmetic forced by the host: a tile is 0.5 m, so any real dimension that is not a multiple of 0.5 m must be rounded up, which systematically inflates area (a 1.524 × 2.032 m US queen becomes 2.0 × 2.5 m = 1.22× area). Panero & Zelnik and Ching both present furniture as dimensioned envelopes precisely so a designer can add the clearance rather than eyeball it.
- Source: derived from the host grid — FACT; Panero & Zelnik, rev. ed. 1979 — T3; Ching, *Interior Graphic Standard* — T3.
- Class: ENGINEERING CONSTRAINT
- Scope: universal
- Confidence: High
- Grid translation: `tiles = ceil(d/0.5)` per axis; over-provision `= tiles_area×0.25 − real_area`. Report as `1.35×1.90 m → 3×4 tiles = 1.5×2.0 m (3.0 m² vs 2.57 m², +0.43 m²)`. Check: sum over a floor of `over_provision_tiles ≤ declared grid penalty budget`.
- Exceptions / failure mode: Rotating a fixture 90° does not help (0.5 m grid is symmetric), but grouping does: put two 3-tile beds against one shared party wall rather than two separate 3-tile envelopes with a 4-tile gap. Symptom: area budgets that balance only if fixtures were sub-tile.

### HS-25 Prove a room's function from its clearances, not from its fixture tag
- Rule: A room passes only if the tiles it contains can physically support the declared function: bed envelope + side/foot circulation; desk envelope + seated zone + rear aisle; WC clear floor + transfer; trolley route width. The host's typer is a *hint generator*, never a validator: `living` in a 3 × 3-tile room is a bug report, not a bedroom.
- Evidence: Host behaviour verified in code: `resolveRoomType` picks the lowest-priority matching spec from `ROOM_TYPE_SPECS` (`src/blueprint-editor/domain/schema/rooms.ts:29-38`), falls back to `hall` for a room with no fixture tags (`rooms.ts:27`), and `deriveFloorRooms` excludes door cells from every room, so a room's type carries no geometric information at all — a single fixture tag in any room size yields "bedroom".
- Source: `C:\Users\ITOP\Desktop\MOD@ITOPPLUS\Mod-Space\Continental-Idle\src\blueprint-editor\domain\schema\rooms.ts:9-33` — verified in code, T1-equivalent (project source); architecture-theory.md TH-01 evidence line (d) — T3 cross-reference.
- Class: ENGINEERING CONSTRAINT
- Scope: this host, all 15 room types
- Confidence: High
- Grid translation: For each room type, define `min_interior_tiles` and `required_clear_subpatterns` (HS-07, HS-09, HS-12, HS-13, HS-16, HS-18) and validate the flood-filled tile set against them, independently of the tag. Check: `room.tiles ⊇ pattern(bed+2+3)`, `else reject or downgrade to hall`.
- Exceptions / failure mode: `hall` fallback is legitimate for a service void; a `storage` room may be tiny. Symptom: a floor that types 100 % of rooms correctly and seats nobody.

### HS-26 Run the clearance check on walkable tiles, never on a room's bounding box
- Rule: Every clearance in this file must be evaluated as "are there N contiguous *walkable* tiles, in this arrangement, excluding door tiles and excluding furniture-implied blocked tiles". A room's bounding box is a licence to cheat.
- Evidence: Host: rooms are 4-connected flood-fills of walkable tiles and doors are excluded, so a 10-tile room can be L-shaped or split, and its bounding box can be 4 × 5 tiles of which half is unusable; A* octile movement only permits diagonals when both orthogonal neighbours are open, so a staggered "wide" route is functionally single-file and the octile shortcut disappears (cf. architecture-theory.md TH-11).
- Class: ENGINEERING CONSTRAINT
- Source: project source (`deriveFloorRooms`, `src/engine/npc/rooms.ts` and `src/blueprint-editor/domain/schema/rooms.ts`) — verified in code; TH-11 derivation in `architecture-theory.md` — T3 cross-reference.
- Scope: this host
- Confidence: High
- Grid translation: implement `maxClearRect(room.tiles)` and `clearGraph(room.tiles)`; report `clear_tiles`, `max_clear_rect_w×h`, `effective_route_width`. Check: `maxClearRect ≥ required turning square`, `Σ walkable ≥ room programme minimum`.
- Exceptions / failure mode: A room whose only wide spot is behind the door swing passes the bounding-box test and fails reality. Symptom: reported "usable area" ≫ walkable area.

### HS-27 Keep a declared furniture layer, because the schema has none
- Rule: Since the host does not model furniture, maintain a side-car furniture register (item, x, y, w_tiles, h_tiles, real dims, source, clearance demand) per floor, and treat it as the only input to the HS rules above. Any human-scale claim about a plan must cite the register row; a plan with no register has no evidence.
- Evidence: Verified in code: `RoomTypeSpec.detectTags` are semantic tags only (`living`, `hygiene`, `cooking`, `dining`, `bar`, `wellness`, `pool`, `fitness`, `lounge`, `laundry`, `meeting`, `retail`, `back-of-house`, `storage`, `front-desk`) — nothing carries a footprint, so all furniture geometry in this project is currently *implicit* and therefore unauditable.
- Source: `src/blueprint-editor/domain/schema/rooms.ts:9-33` — verified in code; goal-task Domain M, "Prevent geometrically valid but physically unusable designs" (lines 544-573).
- Class: ENGINEERING CONSTRAINT
- Scope: this host, every type
- Confidence: High
- Grid translation: `furniture_record = {tag, x, z, w_tiles, h_tiles, real_m, clearance_tiles, hs_refs[]}`. Check: `every non-hall room with a detectTag match has ≥ 1 furniture record`.
- Exceptions / failure mode: A `hall`/`storage` room may be empty legitimately. Symptom: an agent reports "bedroom" from a tag and then computes occupancy from area — a fabricated clearance chain.

### HS-28 Report metric and imperial originals side by side and label jurisdiction
- Rule: Where a country's number drives a requirement, print `value (unit) → tiles → [jurisdiction/standard]`. Never silently convert EU 1050 mm to US 3 ft 5 in, and never assume a US bed size in a European hotel plan.
- Evidence: The three governing families genuinely disagree: metric standards round to 300 mm modules (ADM/DIN/BS), ADA rounds to whole inches (32 / 36 / 48 / 60 in), and bed furniture conventions differ again (UK double 135 cm vs DE 180 cm vs US queen 152 cm). A single-number plan cannot be reviewed against all three.
- Class: DESIGN PRINCIPLE (also argued as: / FACT (arithmetic))
- Source: as HS-05, HS-16, HS-03 above — T1/T3.
- Scope: universal
- Confidence: High
- Grid translation: `mm → tiles = ceil(mm/500)`; `in → mm = in × 25.4 → tiles`. Check: `no register row without a jurisdiction label`.
- Exceptions / failure mode: Rounding twice (in → m → ft) loses 25–50 mm and can silently break a 815 mm clear-width rule. Symptom: a door that is 0.8 m "nominal" and 0.75 m clear.

## Anthropometric basis

Adopted population: general adult population, mixed-sex public occupancy, wheelchair users included.
Clearance values from the large envelope (95th percentile male, or largest device); reach values
from the small/seated envelope (5th percentile female / seated). All values below are *body*
dimensions, not furniture; furniture is in the register. `UNCITED` marks a recalled figure not
verified against the source text in this session.

| Dimension | 5th F | 50th M | 95th M | Design use | Status |
| --- | --- | --- | --- | --- | --- |
| Stature (standing) | 1535 mm | 1750 mm | 1880 mm | headroom, shelf height, reach | ISO 7250-1 family, UNCITED exact |
| Shoulder breadth | 390 mm | 450 mm | 510 mm | min route width, seat width | Pheasant, UNCITED exact |
| Hip breadth (seated) | 340 mm | 400 mm | 470 mm | seat width, table front per person | Pheasant, UNCITED |
| Elbow-to-elbow (seated) | — | 550 mm | 610 mm | dining width min/comfort | Panero & Zelnik, UNCITED |
| Knee height (seated) | 420 mm | 460 mm | 550 mm | seat height, under-desk clearance | UNCITED |
| Popliteal-to-toe (seated depth) | 560 mm | 630 mm | 700 mm | row pitch, chair zone | UNCITED |
| Forward reach (standing, small) | 600 mm | — | — | control placement | UNCITED |
| Forward reach (seated max) | 550 mm | 650 mm | — | shelf depth from standable tile | UNCITED |
| Vertical reach, max (small F) | 1450 mm | — | — | high storage cut-off | UNCITED |
| Manual wheelchair overall | 700 W × 1250 L | — | — | route width, door, turning | UNCITED (supplier range) |
| Power wheelchair overall | 750 W × 1300 L | — | 800 W × 1500 L | the 2300 mm maneuvering area | DIN 18040, UNCITED |
| Walking speed, level | 1.0 m/s (older users) | 1.2–1.4 m/s | — | travel-time model, egress | UNCITED |
| Body envelope while walking | dynamic +100–150 mm on breadth | — | — | why 0.5 m routes fail | Pheasant dynamic-space, UNCITED |

Register-level derived values: single-file route 0.5 m body + margin → 1.0 m grid minimum; two-way
→ 1.5 m; passing a wheelchair in a corridor with a protruding fixture → 2.0 m.

## Furniture & clearance register

`Item` = furniture/function envelope (rounded up to tiles) · `Real` = true dimension ·
`Working clearance` = required free space · `Min room` = smallest grid-safe room (interior tiles,
walls excluded) · `Notes` = jurisdiction/quantisation warning. Min room figures assume one shared
party wall where a corridor exists; add the wall tax per TH-02 for a stand-alone plate.

### Bedroom / guest room (`living`)
| Item | Real | Tiles | Working clearance | Min room (interior) | Notes |
| --- | --- | --- | --- | --- | --- |
| Single bed EU 90×200 | 0.90×2.00 | 2×4 (1.0×2.0) | 0.7 m one side, 1.2 m foot | 5×6 = 7.5 m² | EU/DE 200 cm length common |
| Single bed UK 90×190 | 0.90×1.90 | 2×4 | 0.7 m side, 1.2 m foot | 5×6 | UK 190 cm length |
| Double UK 135×190 | 1.35×1.90 | 3×4 (1.5×2.0) | 0.9 m both sides | 6×6 = 9.0 m² | jurisdiction: UK |
| Double EU 180×200 | 1.80×2.00 | 4×4 (2.0×2.0) | 0.9 m both sides | 6×6 | DE "Doppelbett" |
| Queen US 152×203 | 1.52×2.03 | 4×5 (2.0×2.5) | 0.9 m both sides | 6×7 = 10.5 m² | 3.0×3.5 m envelope; 42 tiles |
| King US 193×203 | 1.93×2.03 | 4×5 | 1.0 m both sides | 6×7 | jurisdiction: US |
| Twin ×2 (hotel) | 2×(0.90×2.00) | 2×(2×4) | 0.9 m between + 1.2 m foot | 6×7 | 2 beds + luggage zone |
| Wardrobe 60 deep | 0.60×2.00 | 2×4 blocked | 1.2 m in front of sliding; 1.6 m of swing for hinged | — | hinged door needs 0.5 m |
| Luggage/valise | 0.75×0.30 | 2×1 | 1.0 m standable | — | checked-case size, UNCITED |
| Desk (hotel business corner) | 1.40×0.60 | 3×2 | 0.75 m seated + 1.0 m pass | — | see office block |

### Bathroom / WC (`hygiene`)
| Item | Real | Tiles | Working clearance | Min room (interior) | Notes |
| --- | --- | --- | --- | --- | --- |
| WC pan + cistern | 0.70×0.60 | 2×2 | 0.76×1.22 front, 0.38–0.43 cl to wall, 1 transfer side | — | 0.5 m grid cannot hit 16–18 in exactly |
| Basin | 0.55×0.45 | 2×1 | 0.76×1.22 forward | — | knee clearance 0.68 m AFF |
| Shower 0.9×0.9 | 0.90×0.90 | 2×2 | 0.76×1.22 outside | — | ADA 60×60 in → 4×4 |
| Accessible shower stall | 1.50×1.50 | 3×3 | 3×3 transfer + 2×3 clear | 6×6 total | metric |
| Shower stall ADA | 1.525×1.525 | 4×4 (2.0×2.0) | + 2×3 transfer | 6×6 | +1.2 m² loss |
| Bathtub 1.7×0.75 | 1.70×0.75 | 4×2 | 1.5×0.76 transfer alongside | 5×7 | ADA §607 30×60 in transfer |
| Accessible WC compartment | — | 5×5 inner min, prefer 6×6 | turning 3×3/4×4 + clear floor 2×3 | 5×5–6×6 | 2.20–2.25 m metric (ADM) vs 60 in circle (ADA) |
| Grab rail | — | — | 840–915 mm AFF | — | height is out-of-grid: tag attribute |

### Kitchen / servery (`cooking`)
| Item | Real | Tiles | Working clearance | Min room (interior) | Notes |
| --- | --- | --- | --- | --- | --- |
| Base run 0.60 deep | 0.60 | 2 wide (blocked) | 1.0 m min / 1.2 m comfort aisle | — | aisle governs, not depth |
| Opposing runs (galley) | 2×0.60 + aisle | 4 + aisle | 1.2 m → 3 tiles | 5×6 | NKBA 42 in → 3 tiles |
| Island + run | — | 2 + aisle + 2 | 1.2 m both sides; 1.5 m where appliances face each other | 7×6 | two-cook case |
| Dishwasher front | 0.60 | 1 (blocked) | 0.76 m standing zone beyond open door | — | door is a swing hazard |
| Fridge (tall) | 0.70×0.75 | 2×2 | 1.0 m in front with door at 90° | — | door swing into aisle |
| Hob + extract | 0.60 | 1–2 | 0.9 m side clearance to a wall | — | fire rule, jurisdictional |
| Sink unit | 0.86×0.60 | 2×2 | 1.2 m aisle | — | primary work centre |
| Commercial range + hood | 0.90×0.90 | 2×2 | 1.5 m in front; 0.9 m side | — | F&B, see HS-11 |
| Kitchen work triangle | — | — | Σ legs 4.0–6.0 m (8–12 octile tiles) | — | HS-10 |

### Office / meeting (`meeting`, `back-of-house`)
| Item | Real | Tiles | Working clearance | Min room (interior) | Notes |
| --- | --- | --- | --- | --- | --- |
| Desk 1.4×0.7 | 1.40×0.70 | 3×2 | 0.75 m seated + 1.0 m behind (1.5 m total) | 5×6 for 1 person | EN 527 |
| Bench bay, 2 facing | 1.4×1.4 each | 2×(3×2) | 1.8 m between backs | 6×6 | 1.5 m if no through traffic |
| Task chair zone | 0.70×0.70 | 2×2 | — | — | swivel envelope |
| Meeting table 6-person | 1.80×0.90 | 4×2 | 2 tiles per seat + 1.2 m around | 7×6 | 0.75 m front/person |
| Boardroom 12-person | 3.60×1.20 | 8×3 | 3 tiles around | 11×7 | egress both ends |
| Reception/front desk | 2.40×0.90 | 5×2 | 1.5 m in front for a queue, 1.2 m behind for staff | 8×6 | `front-desk` → lobby |
| Storage cabinet 0.4 deep | 0.40 | 1 | 0.9 m in front | — | low unit; 0.5 m round-up |

### Assembly / lounge / restaurant (`dining`, `lounge`, `bar`, `wellness`)
| Item | Real | Tiles | Working clearance | Min room (interior) | Notes |
| --- | --- | --- | --- | --- | --- |
| Lounge armchair | 0.80×0.85 | 2×2 | 0.45 m side gap, 1.2 m in front of a row | — | Ching lounge grouping |
| Sofa 3-seat | 2.10×0.90 | 5×2 | 0.9 m behind for passage | — | |
| Coffee table | 1.20×0.60 | 3×2 | 0.40–0.45 m to seat | — | |
| Dining chair + table | 0.50 seat | 2 tiles/seat | 0.75 m chair zone | — | 0.6 m absolute min width |
| Restaurant table 0.76² | 0.76×0.76 | 2×2 | 1.4 m aisle behind seated diner | — | 1.2 m tight min |
| Bar counter | 3.00×0.60 | 6×2 | 0.9 m front (stools), 1.2 m rear (staff) | 8×6 | 0.3 m knee recess is sub-tile |
| Bar stool spacing | 0.60 centres | 2 tiles/stool | 0.76 m behind | — | |
| Cinema seat | 0.55 wide | 1 tile/seat (0.5 m, *under* seat width — use 2 tiles) | 0.76 m row pitch (2 tiles) | — | grid cannot do 0.55; over-provision or accept loss |
| Wheelchair space in seating | 1.30×0.80 | 3×2 | 1.2 m adjacent route | — | companion seat beside it |
| Gym machine | 1.20×0.90 | 3×2 | 0.9 m around + 1.2 m behind a moving load | 8×8 | `fitness` |

### Healthcare (`hygiene` + `living` in care mode)
| Item | Real | Tiles | Working clearance | Min room (interior) | Notes |
| --- | --- | --- | --- | --- | --- |
| Hospital bed | 2.20×1.00 | 5×2 | 1.0 m head + 1.0 m one side + 1.2 m foot | 7×7 | HBN-style, UNCITED |
| Bariatric bed | 2.40×1.50 | 5×3 | 1.2 m all sides | 8×8 | 3 tiles exact = no margin |
| Over-bed table | 0.90×0.50 | 2×1 | folds away | — | consumes the side clearance |
| IV/pump stand | 0.60² | 1×1 | 0.5 m access | — | sub-tile → 1 tile |
| Crash trolley | 1.10×0.60 | 3×2 | 1.2 m route | — | BOH route rule HS-19 |
| Nurse station counter | 3.00×0.70 | 6×2 | 1.5 m front, 1.2 m rear | 9×6 | |
| Isolation room + en-suite | — | — | PPE donning 1.5×1.5 m vestiaire | 9×8 | UNCITED |

### Retail / service (`retail`, `storage`, `laundry`, `pool`)
| Item | Real | Tiles | Working clearance | Min room (interior) | Notes |
| --- | --- | --- | --- | --- | --- |
| Gondola run 1.2 long | 1.20×0.60 | 3×2 | 1.2 m aisle, 0.9 m browse | — | HS-18 |
| Shopping trolley | 0.90×0.55 | 2×2 | 1.5 m two-way aisle | — | HS-18 |
| Checkout lane | 2.40×0.90 | 5×2 | 1.5 m wide lane + 2.4 m exit | — | |
| Fitting booth | 1.20×1.20 | 3×3 | 0.9 m approach | — | |
| Linen/housekeeping trolley | 1.20×0.65 | 3×2 | 1.2 m route, 1.8 m bay | — | HS-19 |
| Housekeeping closet | 2.50×2.00 store | 5×4 | trolley + 2 staff + linen shelves | 6×5 | `back-of-house` |
| Washer/dryer pair | 0.85×0.75 each | 2×2 each | 0.9 m front for loading + door swing | 6×6 | `laundry` |
| Luggage store (bell desk) | — | — | 2 m deep racking + 1.5 m trolley aisle | 7×6 | |
| Pool deck loungers | 2.00×0.70 | 4×2 | 1.2 m between loungers | — | `pool` |

### Circulation register
| Element | Real requirement | Tiles | Governing rule | Notes |
| --- | --- | --- | --- | --- |
| Single-person route, min | 0.90 m | 2 (1.0 m) | HS-03 | ADM/ADA floor |
| Single-person route, comfort | 1.20 m | 3 | HS-03 | DIN 1500 with passing |
| Two-way route | 1.50 m | 3 | HS-03 | |
| Two wheelchair passing | 2.00 m | 4 | HS-03/HS-04 | |
| Accessible door (clear) | 0.815–0.905 m | 2 | HS-05 | ADA 815 / ADM 825 / DIN 905 |
| Trolley door | 1.0 m clear | 3 | HS-19 | thick-wall reveal |
| Turning space metric | 1.50 m | 3 | HS-04 | BS 8300/DIN |
| Turning space US | 1.525 m | 4 | HS-04 | 31 % area over-provision |
| Ramp run for 0.5 m rise | 6.0 m | 12 | HS-20/HS-22 | 1:12 |
| Stair width private | 0.8–1.0 m | 2 | HS-20 | |
| Stair width public | 1.2 m | 3 | HS-20 | |
| Effective width after protrusions | −0.5 m per protruding tile | −1 | HS-21 | grid protrusion is a whole tile |
| Clear floor space (any fixture) | 0.76×1.22 m | 2×3 | HS-07/HS-19 | ADA §305 |

## Sources

T1 — official standards and accessibility guidance
- US Access Board, *2010 ADA Standards for Accessible Design*, ch. 2 (scoping), ch. 3 (§304 turning space, §305 clear floor space, §308 reach ranges), ch. 4 (§403 routes and protruding objects, §404 doors), ch. 6 (§604 water closets, §606 lavatories, §607-608 tubs/showers). **ch. 3 + ch. 4 read back this session (values verified):** §304.3 turning space 60 in / 1525 mm circle or T-shape · §305.2 clear floor space 30 × 48 in / 760 × 1220 mm · §308 reach high 48 in / low 15 in (1220 / 380 mm) · §403.5.1 route clear width 36 in / 915 mm, 32 in / 815 mm allowed only for segments ≤ 24 in / 610 mm separated by ≥ 48 in segments · §404.2.3 door clear width 32 in / 815 mm measured face-of-door to stop at 90° open · §404.2.4.1 maneuvering clearance forward-pull 60 in perpendicular + 18 in beyond the latch/hinge side, forward-push 48 in + 0 in (add 12 in with a closer) · §404.2.9 interior door opening force 5 lb / 22 N max · §405.2 ramp running slope 1:12. On this basis HS-01, HS-04, HS-05, HS-06, HS-21, HS-22 and HS-23 are High confidence; **ch. 6 fixture clearances were not re-read this session and stay Medium** (HS-07, HS-08). https://www.access-board.gov/ada/chapter/ch03/ · https://www.access-board.gov/ada/chapter/ch04/ · https://www/access-board.gov/ada/chapter/ch06/
- ISO 7250-1:2017, *Ergonomics — Basic human body measurements for technological design — Part 1: Body measurement concepts and terminology*. T1, cited by standard number.
- BSI, *BS 8300-1:2018 Design of an accessible and inclusive built environment — Part 1: Commercial buildings*. T1, cited by number (no text retrieved).
- DIN 18040-1:2010-10, *Barrierefreies Bauen — Planungsgrundlagen — Teil 1: Öffentlich zugängliche Gebäude*. T1, cited by number (no text retrieved).
- CEN, *EN 527 series — Office furniture — Work tables and desks* (height 720–760 mm class values). T1, cited by number.
- UK, *Approved Document M 2022, Access to and use of buildings, Vol. 2 (buildings other than dwellings)* and *Approved Document K 2013 (+2022)*, *Protection from falling, collision and impact*. T1, cited by edition; specific clause values marked UNCITED this session.
- ICC, *International Building Code*, ch. 10 *Means of Egress* (corridor/stair/aisle widths, egress capacity 0.2 in/occupant) and NFPA 101 *Life Safety Code* ch. 7/14. T1, cited by code; values UNCITED.
- National Kitchen & Bath Association, *Residential Kitchen Planning Guidelines* https://www.nkba.org/ — T1/T3 industry standard; aisle figures UNCITED.

T2 — ergonomics research
- Human Factors and Ergonomics Society, *HFES Guidelines: Anthropometric Data* (PDF) https://www.hfes.org/Portals/0/Publications/Guidelines_AnthropometricData.pdf

T3 — established publications (by edition; no full-text retrieved this session unless noted)
- Stephen Pheasant & Christine Haslegrave, *Bodyspace: Anthropometry, Ergonomics and the Design of Work*, 3rd ed., Taylor & Francis, 2012 reprint of 2006.
- James Panero & Martin Zelnik, *Human Dimensions & Interior Space: A Source Book of Design Reference Metrics*, revised ed., Whitney Library of Design, 1979.
- Ernst & Peter Neufert, *Architects' Data*, 4th ed., Wiley, 2012 (English translation of *Bauentwurfslehre*).
- Francis D. K. Ching, *Interior Graphic Standard: A Guide to Architectural Graphics Criteria*, 2nd ed., Wiley (dimension tables for furniture, clearances, circulation).
- John Pile & James G. Tretheway, *Design Interior*, current ed., Wiley — furniture/clearance tables (cited only as corroboration).
- Linda N. Gustin et al., *Problem Seeking / Architectural Programming* lineage — cross-reference to architecture-theory.md TH-01.

T4 — secondary/practitioner
- Retail and hospitality planning summaries published by store-planning consultancies (aisle and BOH width claims) — used only as corroboration, marked UNCITED where quoted.

## Weak or contested

1. **Percentile values in the anthropometric table are recalled, not retrieved.** The 5th/50th/95th figures above are plausible ISO 7250 / Pheasant-family magnitudes, but no measurement table was opened in this session. Every one is marked `UNCITED` there; treat the *bands*, not the numbers, as usable. High-impact if used for a strict check.
2. **UK Approved Document M / K numeric values are jurisdiction-recall.** Door clear opening (775/825/1025 mm), corridor widths (900/1050 mm) and WC compartment sizes (2200 × 2200 mm) are the widely reproduced figures but have not been read from the current 2022 edition text; AD M has been amended multiple times and the dwelling/volume split is easy to misquote.
3. **ADA vs metric turning space (60 in vs 1500 mm) is a real disagreement, not an error.** 1525 mm and 1500 mm look identical in practice but the tile rounding differs (4 vs 3 tiles), i.e. a 0.75 m² area difference per turning space per floor. Which governs is a jurisdiction decision, and on this grid it is a *material* cost decision.
4. **Hospital bed spacing: the *unit of measure* disagrees, not just the number.** NHS/HBN is written bed centre-to-centre (3.6 m for post-2010 adult in-patient space, 2.45 m for day treatment — read this session via NIPCM ch. 4; the HBN 00-03 PDF itself would not parse), US FGI practice is quoted as a *clear* distance between beds (~32 in), and paraphrases online speak of "1 m around the bed". These are not reconcilable by conversion, which is why HS-17 states the unit explicitly. Still unverified against the HBN body text, and no healthcare room type exists in the host schema, so the rule is unenforceable in-app.
4b. **NKBA kitchen aisle numbers remain unverified.** The 42 in / 48 in work-aisle figures in HS-09 are the widely reproduced NKBA guideline values; NKBA publishes them only as PDFs (`https://media.nkba.org/uploads/2022/05/Kitchen-Planning-Guidelines.pdf`), and both PDF fetches attempted this session returned undecodable binary, so HS-09 stays Medium confidence. The same binary-PDF problem applies to Approved Document M and K (item 2 above).
5. **Retail aisle widths are trade convention, not standard.** The 0.9/1.2/1.5/2.4–3.0 m ladder is store-format dependent (convenience vs supermarket vs fashion vs flagship); no code prescribes it, and the accessibility floor (900 mm) is far below what merchandising practice demands. Sourcing to Neufert only.
6. **The work-triangle bounds (4.0–6.0 m total) are folklore by now.** NKBA's own guidance on triangles has softened/changed across editions, and open-plan kitchens invalidate the metric. Keep it as a heuristic with an explicit Low-Medium flag.
7. **Sightline C-values cannot be checked on this grid at all**, because there is no section. Any 50/60 mm value quoted here is for a human designer's benefit, not an engine check. Same for headroom (2.0 m), grab-rail AFF and every "AFF" value — the host has no Z axis, so these become *declared attributes*, and the honest statement is that they are unverifiable in-app.
8. **Corridor encroachment rules differ between ADA §403.2, IBC §1005/§1014 and BS 8300**, in what they permit to stick into a required width and by how much (4 in vs 4 1/2 in handrails vs "no reduction"). HS-21 gives the direction (measure effective width) confidently and the exact allowances as Medium confidence.
9. **Bed size tables are market conventions.** No ISO standard fixes "double" — DE 180 cm, UK 135 cm, FR 140 cm, US 152 cm are all "a double bed", and hotel chains brand "king" as anything from 160 to 200 cm. Any automated room typist must take the jurisdiction as an input.
10. **The 0.5 m grid systematically penalises dense furniture layouts** (a 0.55 m cinema seat costs 1.0 m), so this file's "minimum room in tiles" numbers are honest but pessimistic. A 0.25 m sub-grid would remove most of the quantisation error — this is a host limitation, not a human-scale finding.

## Type-specificity audit

| Rule block | Universal | Residential | Hospitality | Office | Healthcare | Retail | Assembly | Notes on the host's 15 types |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| HS-01..HS-05 (percentiles, basis, body width, turning, door width) | yes | yes | yes | yes | yes | yes | yes | Applies to all; door run ≥ 2 tiles should be a global validator |
| HS-06..HS-08 (door maneuvering, sanitary clearances, WC compartment) | yes for doors; sanitary on any `hygiene` room | yes | yes | yes | yes (en suites, ward bays) | staff WCs | yes | `bathroom`/`spa` types both carry hygiene demands |
| HS-09..HS-11 (kitchen aisles, triangle, commercial servery) | no | yes | yes | break-out kitchen | no | no | no | Triangle is meaningless in a production kitchen |
| HS-12..HS-13 (desk, table fronts) | no | study corner | F&B, business corner | yes | no | no | yes | `conference`, `restaurant`, `bar`, `lounge` |
| HS-14..HS-15 (seating rows, sightlines, assembly aisles) | no | no | cinema/lounge | town hall | no | no | yes | Sightlines unverifiable (no Z) |
| HS-16 (beds, jurisdictional sizes) | no | yes | yes | no | recovery rooms | no | no | `bedroom` type only; sizes are jurisdiction inputs |
| HS-17 (hospital envelope) | no | no | no | no | yes | no | no | Host has *no* healthcare room type — HS-17 is currently unenforceable in-app |
| HS-18 (retail aisles) | no | no | shop/market | no | no | yes | no | `shop` |
| HS-19 (trolleys, luggage, lift size) | no | no | yes | courier/mail | yes | returns desk | no | `laundry`, `storage`, `staff-room`, `back-of-house` |
| HS-20..HS-22 (stairs, effective width, route continuity) | yes | yes | yes | yes | yes | yes | yes | Route continuity is the only whole-building-level check available |
| HS-23 (reach) | yes | yes | yes | yes | yes | yes | yes | Requires an `aff` attribute the schema lacks |
| HS-24..HS-28 (quantisation, tag-vs-clearance, walkable-tile checks, furniture layer, jurisdiction labels) | yes — host-wide | | | | | | | These are the *enforcement* rules; they are what makes the rest testable |

Coverage gaps against goal-task Domain M: "reach" is covered only for horizontal reach (HS-23)
because vertical is unmodelled; "circulation" per se is treated here only as a clearance/width
question, with movement cost and capacity in `architecture-theory.md` TH-11/TH-20 and egress
arithmetic in `building-codes.md`. No tile-grid claim in this file was validated against running
code beyond `src/blueprint-editor/domain/schema/rooms.ts:9-33` and the flood-fill/door behaviour
already documented in `architecture-theory.md`.
