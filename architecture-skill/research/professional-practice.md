# Research: professional practice — what working architects, engineers and operators say they learned the hard way

Deliverable owner: `architecture-skill` (pre-design knowledge for tile-grid building layout).
File scope: real-world professional experience only. Everything here is a report of what
practitioners say or measure, not a law of nature. Peer-reviewed post-occupancy evaluation
(POE) research and code text are used **only** to confirm or undercut the community claims.

## Method and access limits (read this before trusting a citation)

- Evidence tiers: **T1** codes/standards/regulator guidance · **T2** peer-reviewed / university /
  national-lab · **T3** professional publications, consultancy and engineering memos ·
  **T4** practitioner community (firm blogs, trade/tool docs, vendor engineering notes) ·
  **T5** Reddit/forum anecdote.
- **T5 was largely unreachable from this environment and this file is honest about it.**
  Reddit thread bodies (`r/architecture`, `r/HVAC`, `r/floorplan`, `r/hotels`) returned 403 or a
  JS shell; Autodesk Community threads returned 403; MDPI and healthdesign.org returned 403;
  Redlib mirrors sit behind an Anubis proof-of-work challenge; pullpush.io rate-limits agents.
  Reddit thread *titles* surfaced in the search index (e.g. "Air handler access panel blocked",
  "What would be the worst mistakes you've ever done") were therefore used only as a signal that
  a topic is live in the community, never as a claim. Where a claim would have rested on Reddit
  alone it is either absent or listed under **Weak or contested**.
- **There is no "Architecture Stack Exchange".** `architecture.stackexchange.com` redirects to
  `stackexchange.com/site-not-found` and the site is absent from the Stack Exchange API site list.
  Building Q&A actually lives on `diy.stackexchange.com` and `engineering.stackexchange.com`
  (queried through the SE API), and those threads are mostly homeowner-level, so the practitioner
  weight in this file sits on T1/T2/T3 sources written *by* architects, MEP engineers, hotel
  operators and infection-control authors — which is stronger evidence, not weaker.
- Substitutes used for the community voice: WATG (major hospitality architect) practice notes, NHS
  Health Building Notes (design-team guidance written from post-occupancy failures), MEP design
  memoranda, ADA compliance consultancies' documented findings, laundry/housekeeping trade
  literature, CBE/POE datasets.
- Every quantitative claim below was read in the cited document. Nothing is quoted that was not
  retrieved. Numbers from vendor/engineer blogs are labelled as such and marked
  `cross-checked: no` where no stronger source was found.

## Grid dictionary used throughout

Host grid: 1 tile = 0.5 m square; states `walkable | blocked | door`; wall = 1 blocked tile (0.5 m);
octile A*, diagonal only if both corner neighbours are open; lift = portal queue (30 s cooldown);
rooms typed by fixture tags; no wall type, no materials, no heights, no section, no MEP.

| Real dimension | Metric | Tiles |
|---|---|---|
| 32 in pinch (ADA door/pinch max) | 0.81 m | 2 (0.81 < 1.0) |
| 36 in continuous accessible route / aisle | 0.91 m | **2 tiles minimum** |
| 18 in latch-side clearance | 0.46 m | 1 tile |
| 42 in turn approach / island aisle | 1.07 m | 3 tiles |
| 48 in doors-in-series separation / turn width | 1.22 m | 3 tiles |
| 60 in passing space (60 × 60) | 1.52 m | **3 × 3 tiles** |
| 200 ft max spacing of passing space | 61 m | 122 tiles |
| 42 in plant clearance (all sides) | 1.07 m | 3 tiles |
| 6 ft chiller service + tube pull | 1.83 m | 4 tiles |
| 1 000 mm riser-zone wall clearance | 1.0 m | 2 tiles |
| 1 500 mm pump-to-pump | 1.5 m | 3 tiles |
| 1.5–2 m max horizontal soil run | 1.5–2 m | 3–4 tiles |
| 200 mm damper test access | 0.2 m | 1 tile (round up) |
| obstacle passing shadow (measured) | 0.3–0.7 m | 1–2 tiles |
| standing queue density — **capacity end, not comfort** (see `human-behavior.md` HB-01/HB-20: HCM walkway LOS E–F, and IMO declares a queue at ≥3.5 p/m² ≈ 1.14 tiles/person) | 0.25–0.5 m² | 1–2 tiles per person |

**Unmodellable on this grid, always flagged as such:** airborne/impact sound level, speech
privacy, odour, smoke migration, daylight, artificial light levels, ceiling height and soffit
loss, pressure cascades (isolation rooms), materials and cleanability of joints, temperature.
Each of those gets a plan-geometry proxy where one honestly exists, and a `proxy only` flag where
it does not.

---

### PP-01 Count clean/dirty route crossings before you count squares

- Rule: Before evaluating any plan, trace four routes end to end on the tile grid — (a) soiled
  linen/waste, (b) clean linen/supplies, (c) food in → prep → plate out, (d) staff in → changing →
  post. Every tile used by both a soiled route and a clean/guest-facing route is a **crossing**;
  target zero crossings on guest/patient-facing routes, and never let a soiled route pass through
  or sit adjacent to a clean storage or food-prep room.
- Evidence: Practitioners report that "everything revolves around adjacencies and flow" and that
  architects new to hotels overlook "storage requirements, staff facilities, clean and dirty
  routes", and describe a hotel with no dedicated staff route between storage and restaurant, which
  forced staff into the guest corridor (visible as a worn, dirty carpet) (WATG, T3). Trade
  literature states the organising principle of back-of-house as "separation of streams… every
  crossing is a permanent tax" and prescribes exactly this trace-and-count test on the drawings
  (T4). Infection-control guidance requires "a clear demarcation between clean/unused equipment and
  soiled/dirty equipment. Clean and dirty areas should be kept separate and the workflow patterns of
  each area should be clearly defined" (HBN 00-09, T1). Commercial kitchen guidance requires product
  to move one way, "without crossing contaminated and clean pathways" (T3). **cross-checked: yes —
  T1 + 2×T3 independently.** Consensus strength: high (four independent sources, four professions).
- Source: WATG, "Back-of-House Design: How Architecture Shapes Luxury Service" — https://www.watg.com/back-of-house-design-how-architecture-shapes-luxury-service/ (T3); Hotel Desk / Before It Opens, "Back of House: The Half of the Hotel Guests Never See" — https://beforeitopens.com/articles/back-of-house/ (T4); NHS England HBN 00-09 §3.73 — https://www.england.nhs.uk/wp-content/uploads/2021/05/HBN_00-09_infection_control.pdf (T1); Kitchen Management Authority, "Commercial Kitchen Layout and Design Principles" — https://kitchenmanagementauthority.com/commercial-kitchen-layout-and-design/ (T3)
- Class: DESIGN PRINCIPLE
- Scope: universal (sharpest in hospitality, healthcare, food service, industrial)
- Confidence: High
- Grid translation: run a route simulation per flow class and emit a `crossings` count per tile
  pair; assert `guest_route_crossings == 0`; assert no `walkable` tile is simultaneously within the
  path of a `soiled` flow and the door-catchment of a `clean_store`/`food_prep` fixture. Report the
  crossing tiles, not just the total — the fix is usually one pantry or one door relocation.
- Exceptions / failure mode: single-staff posts (small B&B, night-shift ward) legitimately cross
  their own clean and dirty streams; the rule is about *other people's* routes. Observable symptom
  when violated: floor finish wearing in bands along one guest corridor, housekeeping carts parked
  in the lobby, "service" complaints in reviews with no identifiable cause (see PP-25).

### PP-02 Programme back-of-house first and treat it as a fixed share, not a leftover

- Rule: Allocate service area as a share of gross floor area *before* fitting guest/patient rooms,
  and grow it with star rating / acuity, not with what is left over. If value engineering hits BOH,
  log it as a permanent operating cost, not a one-time saving.
- Evidence: Practitioners report that "even the total area needed for back-of-house facilities can
  take designers by surprise at the concept stage. Different brands have different requirements,
  and the higher the star rating, the more space is required" (WATG, T3). Trade literature describes
  the standard failure pattern — "one freight elevator instead of two, housekeeping closets every
  third floor, the staff cafeteria halved, the service corridor behind the ballroom narrowed to
  code minimum… the savings are real, six figures… the operating years repay them with interest",
  and names the consequence as a revenue ceiling set by a corridor (T4). Hotel development guidance
  separately reports that BOH "is frequently misunderstood as secondary architecture" and that
  under-provisioning shows up as payroll strain and NOI erosion (T3). Offsetting evidence, recorded
  honestly: the *same* T3 source says some functions migrate out of the building (laundry, bakery,
  reservations) and "kitchens are generally smaller now", so the share is drifting.
  **cross-checked: yes for the principle (T1+T3+T4); no for any specific percentage** — no source in
  this research gave a defensible BOH/GFA ratio.
- Source: WATG (T3) — https://www.watg.com/back-of-house-design-how-architecture-shapes-luxury-service/; Before It Opens (T4) — https://beforeitopens.com/articles/back-of-house/; Hotel Development Guide, "Architectural Planning" — https://hoteldevelopmentguide.com/architectural-planning/ (T3); NHS HBN 04-01 §4.68 (design teams must agree supplies policies early "as they can have a significant impact on planning and room areas") — https://www.england.nhs.uk/wp-content/uploads/2009/12/HBN_04-01_Final.pdf (T1)
- Class: DESIGN PRINCIPLE
- Scope: hospitality, healthcare, commercial (weakly: residential)
- Confidence: High (principle) / Low (any specific ratio)
- Grid translation: before placing any room with an `occupant` tag, place the service set
  (`housekeeping`, `linen_store`, `soiled_utility`, `waste_store`, `staff_room`, `plant`,
  `dry_store`, `porter`). Emit `boh_tiles / total_tiles` and `boh_tiles / served_rooms`; flag when
  the ratio is below the same-typed reference band **or** when any service room appears only after
  the occupant rooms are laid out (order-of-placement is itself a measurable smell test).
- Exceptions / failure mode: adaptive reuse of existing shells and tight urban sites genuinely
  cannot carry a full BOH — then the compensating decision is outsourcing (off-site laundry, no
  on-site waste holding, contractor-run F&B), which must be *stated*, not assumed. Symptom of the
  silent version: cart parking in corridors, supplies stored in stair landings, staff eating in a
  basement corridor (WATG reports exactly this).

### PP-03 Give housekeeping and linen a bounded catchment, not a shared floor resource

- Rule: Each floor's housekeeping/soiled service point must reach every room it serves without
  leaving the floor or passing through a lift portal, and must be sized for the linen/supply par it
  holds. Plan one soiled utility per roughly 15 beds in healthcare - the cited guidance states this
  as a recommendation ("ideally"), not as a limit; one pantry per floor (hospitality), never one
  per other floor.
- Evidence: Healthcare guidance is quoted as stating "ideally, a dirty utility room should serve no
  more than 15 beds. This reduces travel distances for staff, making better use of nursing time and
  reducing the risk of spillages and cross-contamination", and as assuming **two** dirty utility
  rooms per 24-bed ward (HBN 04-01 §4.69, T1 — passage NOT confirmed at source: the PDF could not be
  opened on re-read, so treat the paragraph number, the ward schedule and the "no more than" reading
  all as unverified; the wording as quoted is aspirational, not a limit). Practitioner reports name
  "housekeeping closets every third floor" and per-floor closets "whose spacing sets the day's geometry for the
  property's largest department" as the classic value-engineered failure (T4), and separately that
  "poorly located cores increase walking distances for staff, inflate housekeeping payroll" (T3).
  Productivity data: housekeeping planning divides guestrooms by **13–14 per attendant shift**, and
  one property cut inspector load from 60 to 50 rooms/day to protect quality (T4). Linen volume is a
  storage requirement, not an abstraction: "we maintain a 5 par standard… 1 on bed, 1 ready to go on
  beds, 1 being cleaned, and 2 extra sets just in case" (laundry planning file, T3).
  **cross-checked: direction only.** The bed figure is single-source and could not be re-read (the
  HBN 04-01 PDF returned corrupted/unreadable binary on two later reads, so the "≤15 beds" sentence is
  unverified at the cited URL, and its own wording is "ideally"); the T3 linen-par and T4 staffing
  figures were read and stand as reported. The three numbers come from different countries and
  professions and point the same way, which is corroboration of the direction, not of the threshold.
- Source: NHS HBN 04-01 (T1) — https://www.england.nhs.uk/wp-content/uploads/2009/12/HBN_04-01_Final.pdf; Before It Opens (T4) — https://beforeitopens.com/articles/back-of-house/; TUMI Hospitality, "How to Staff a Hotel" — https://tumihospitality.com/how-to-staff-a-hotel/ (T4); Loomis Bros. hotel/motel laundry plant planning file — https://www.loomisbros.com/cmss_files/attachmentlibrary/Consulting%20%26%20Design%20PDFs/Hotel%20%26%20Motel%20Laundry%20Plant%20Design.pdf (T3)
- Class: BUILDING-TYPE CONVENTION
- Scope: hospitality, healthcare
- Confidence: **Low for the ≤15-bed catchment** - the T1 source could not be re-read (unreadable PDF
  at the cited URL) and its quoted wording is "ideally", i.e. a recommendation, so no assert may hang
  on it; Medium for the per-floor pantry (T4 practitioner reporting, unquantified); Medium
  (13–14 rooms/shift as a design driver, single T4 staffing site). High only for the shape of the
  rule - bounded catchment on its own floor, never a shared or lift-served one.
- Grid translation: for every `housekeeping` / `soiled_utility` fixture, compute the set of rooms
  whose door tile is reachable from it without crossing a lift portal; **flag** (do not fail) when a
  fixture's catchment runs past ~15 beds or ~14 guest rooms - advisory planning bands, not hard
  asserts, per the Confidence line; assert ≥1 such fixture per storey containing rooms; assert the
  fixture's own tile cluster is ≥4 tiles (par storage needs volume, and a 1-tile pantry cannot hold
  5 par).
- Exceptions / failure mode: corridor-hotel typologies with a single central pantry are legal on
  paper and fail in the trolley — symptom is carts parked outside rooms mid-shift. Conversely, a
  pantry on every floor with no service lift means the *replenishment* route crosses guest routes
  (violates PP-01); the two rules must be satisfied together.

### PP-04 Separate the service vertical portal from the guest portal

- Rule: Any building with staff-served floors needs at least two vertical portals with different
  tags (guest / service), and the service portal must connect dock → BOH core → each service room
  without entering the guest lobby tile field. Model them as independent queues.
- Evidence: Trade literature names too few freight elevators as one of the three canonical BOH sins
  and describes the daily consequence: "the single freight elevator becomes the daily negotiation
  between room service, engineering, and the linen run, and the year-eight PIP renovation prices its
  logistics around that same scarce shaft" (T4). Independent practitioner sources: a site should
  allow both a guest route and a separate delivery route and "ideally, the two should never
  overlap"; lift count "should match peak occupancy modeling, not symmetry" (T3 ×2).
  **cross-checked: partially — the separation principle is confirmed at T1/T3 (PP-01); the "two
  freight lifts" threshold is T4 narrative only.** Consensus strength: many independent sources for
  the principle, none quantitative on lift counts.
- Source: Before It Opens (T4) — https://beforeitopens.com/articles/back-of-house/; WATG (T3) — https://www.watg.com/back-of-house-design-how-architecture-shapes-luxury-service/; Hotel Development Guide (T3) — https://hoteldevelopmentguide.com/architectural-planning/; NHS HBN 04-01 (T1, lift/access location among ward planning factors) — https://www.england.nhs.uk/wp-content/uploads/2009/12/HBN_04-01_Final.pdf
- Class: ENGINEERING CONSTRAINT
- Scope: hospitality, healthcare, commercial, residential mid/high-rise
- Confidence: High (principle) / Low (counts)
- Grid translation: require ≥1 portal pair on stacked tiles, `portal_service` and `portal_guest`,
  each with its own approach queue of ≥3 tiles; assert no `soiled` or `goods` route uses
  `portal_guest`; measure queue starvation: if `service_trips × 30 s cooldown` exceeds the demand
  window, add a portal rather than lengthening the corridor.
- Exceptions / failure mode: low-rise and small-footprint buildings can share one lift with time
  windows (real operators do this: deliveries before 07:00). Symptom of a wrong shared-lift
  decision: a garbage run in the guest elevator at 15:00 (the exact scenario named in T4).

### PP-05 Give waste its own room and its own way out — and expect the chute to fail

- Rule: Plan a dedicated waste holding room on a service route with direct external access, sized
  for segregation, before deciding whether a chute exists at all. If a chute is used, it needs a
  cleanable shaft, its own vented route, and a removal path for blockages.
- Evidence: Practitioner/engineering reports: refuse storage demand varies with climate and
  collection frequency — "resorts also need larger refuse storage areas, and in hot climates, these
  should be temperature controlled to reduce odours"; city hotels can store less because collection
  is more frequent; recycling requirements "will also have an impact on the design of refuse areas"
  (WATG, T3). Failure evidence for chutes is institutional, not anecdotal: a London borough "spent
  £75,000 on outside contractors unblocking 225 chutes" in one year; complaints concentrate on the
  odour of decomposing food, blockages from modern sack sizes, fire risk from build-up, and
  anti-social behaviour at chute rooms; several boroughs have decommissioned chutes in favour of
  external, secured bin stores, after which recycling rose 2.5% and waste tonnage fell 7.2%
  (T4 vendor + council data). **cross-checked: yes for "waste needs a dedicated, separately routed
  room" (T1 + T3); the chute-decommission argument is T4 and vendor-interested — treat as direction
  of travel, not a rule.**
- Source: WATG (T3) — https://www.watg.com/back-of-house-design-how-architecture-shapes-luxury-service/; metroSTOR, "Decommissioning Refuse Chutes in High Rise Buildings" (T4, includes Hackney/Hounslow/Tower Hamlets figures) — https://metrostor.uk/decommissioning-refuse-chutes-in-high-rise-buildings/; NHS HBN 00-09 (T1, disposal hold / dirty utility workflow) — https://www.england.nhs.uk/wp-content/uploads/2021/05/HBN_00-09_infection_control.pdf
- Class: BUILDING-TYPE CONVENTION
- Scope: hospitality, residential mid/high-rise, healthcare, commercial
- Confidence: Medium
- Grid translation: require a `waste_store` fixture cluster ≥2 tiles adjacent to a `door` on the
  service perimeter, on a route to the dock that never traverses a guest/patient route (PP-01).
  If a `chute` fixture exists, assert it shares no wall tile with `guest_room`, `bed`, `food_prep`
  or `staff_room`, and that it sits inside a shaft tile column repeated floor to floor.
  Odour/vermin/fire are **unmodellable**; adjacency is the proxy.
- Exceptions / failure mode: cities with daily collection and no recycling mandate genuinely get
  away with small internal holding; the failure appears when a bin-sorting regime is introduced
  after occupancy — the room no longer exists and corridors become the store (see PP-22).

### PP-06 Design the staff day, not just the guest day

- Rule: Lay out the staff arrival-to-post sequence (entry → security → lockers → changing →
  rest/food → post) as an explicit route with real room areas, and keep it out of windowless
  basements if the grid can express an external wall at all.
- Evidence: A hospitality architect reports staff-dining quality as a retention variable: "the
  staff dining area is one of the key spaces in any hotel… And yet I have seen dining tables
  accommodated in a corridor, deep in a basement and away from natural light", and links poor BOH
  to workforce loss in a market with predicted shortfalls (T3). Adjacency heuristic with a concrete
  failure mode: HR should sit near the staff entrance "to accommodate interviews. Otherwise, you
  will find unfamiliar faces wandering into the heart of the hotel every day" (T3). Trade
  literature: staff space is "chronically first against the wall in a space crunch" and is now
  understood as a recruiting line item (T4). Industry turnover above 73% is widely reported
  (T3/T4). **cross-checked: no stronger tier found for the retention causal chain**; the
  *adjacency* claims (HR at staff entry, no staff meals in corridors) are consistent across two
  independent practitioner sources. Consensus strength: 2–3 independent practitioner sources, of
  the same firm type.
- Source: WATG (T3) — https://www.watg.com/back-of-house-design-how-architecture-shapes-luxury-service/; Before It Opens (T4) — https://beforeitopens.com/articles/back-of-house/
- Class: EXPERIENCE-BASED ADVICE
- Scope: hospitality, healthcare, commercial (any staffed building)
- Confidence: Medium
- Grid translation: add a `staff` flow with mandatory fixture tags (`staff_entrance`, `locker`,
  `break_room`) and assert the route exists on walkable tiles from the site edge to each work post
  without using `portal_guest`; flag any `break_room` whose cluster touches no exterior tile
  (daylight proxy).
- Exceptions / failure mode: in historic-shell conversions the only dry, code-compliant space is
  the basement; then the compensating provision is lift access + mechanical daylight/vent, which the
  grid cannot judge. Symptom: staff cutting through guest areas (visible as PP-01 crossings).

### PP-07 Kitchens: unidirectional flow, aisle clearance, servery adjacency — forget the work triangle

- Rule: Block a kitchen as five zones (receiving/storage → prep → cook → plate/serve → warewash) in
  one direction, keep warewash on the return path from the servery, give the cook line ≥42 in clear
  on all sides of an island run, and put prep/staging pantries next to where food is *delivered*,
  not next to where it is cooked.
- Evidence: Kitchen design reference (T3, citing FDA Food Code, NFPA 96, IMC, ADA): product flow
  "moves in one direction… without crossing contaminated and clean pathways"; aisle minimums 36 in
  (ADA) with 36–48 in between opposing equipment banks per many health codes, and 42 in on all sides
  of an island; kitchen-to-dining ratio for full-service restaurants averages ~30–35% of floor area
  (National Restaurant Association guidance as reported); plus a hard constructability warning —
  layouts that maximise throughput often "fail hood coverage or aisle width requirements, requiring
  redesign that reduces capacity by 10–20%" at plan review. Hotel practitioners add the delivery
  side: dedicated pantry/staging areas near the point of service, satellite kitchens in large
  properties, and "minimizing the use of ramps that could cause spills on a trolley".
  **cross-checked: yes — the flow/aisle rules are code-derived (T1, as quoted in T3); the 30–35%
  ratio is T3-as-reported, not verified against the NRA text.** Two popular beliefs are also
  refuted here: the residential work triangle has no application in commercial kitchens, and more
  kitchen square footage does not mean better workflow (both called out as misconceptions, T3).
- Source: Kitchen Management Authority (T3) — https://kitchenmanagementauthority.com/commercial-kitchen-layout-and-design/; WATG (T3) — https://www.watg.com/back-of-house-design-how-architecture-shapes-luxury-service/
- Class: CODE REQUIREMENT
- Scope: hospitality, commercial (F&B), healthcare/education (institutional food service)
- Confidence: High (flow, aisles), Medium (ratios); the aisle and one-way-flow rules are code-derived as quoted, while the 30-35 % kitchen-to-dining ratio and the pantry/staging provisions are a building-type convention
- Grid translation: assert a monotone ordering of the five kitchen zone tags along the
  receiving→servery route (no zone visited twice); assert every cook-line tile has ≥3 free tiles to
  any opposing fixture run; assert a `pantry`/`staging` tag exists within ≤10 tiles of each
  `dining`/`guest_room` service destination; penalise `step`/`ramp` tiles on tray routes.
  Unmodellable: hood airflow, grease duct — flag as proxy only.
- Exceptions / failure mode: counter-service with a short menu legitimately collapses to a linear
  assembly line; the rule then reduces to "one direction, no crossing". Symptom of violation: dirty
  and clean dish routes sharing the pit end, food held in a corridor, capacity cut at plan review.

### PP-08 Size the front-of-house queue from arrivals math, not from lobby grandeur

- Rule: Compute peak arrival demand (expected arrivals in the peak window × transaction minutes) and
  provide desks plus **standing queue tiles** for the residual; assume a narrow peak band after
  standard check-in time and again at checkout, and assume group arrivals land as a block.
- Evidence: Operations planning data: "Sixty arrivals at four minutes each is 240 minutes of
  continuous transaction time", against front-desk efficiency trending to ~0.39 guest-service hours
  per occupied room (T4 industry consultant). Independent trade source: 15:00–17:00 lobbies carry
  3–4× off-peak traffic; a 200-person conference or a 40-seat coach arrival swamps a well-staffed
  desk; mitigation is staggered group windows and separate queues per service (T4 vendor).
  Cornell's 95,000-review study of 99 high-end hotels lists front desk and ease of check-in among
  the drivers it rated, with "front", "desk", "bathroom" and "price" appearing specifically in
  *low*-rated reviews (T2). **cross-checked: yes for "check-in friction shows up in dissatisfaction"
  (T2); no for the vendor percentages** (see *Claims that did NOT survive*, item 6).
- Source: TUMI Hospitality (T4) — https://tumihospitality.com/how-to-staff-a-hotel/; ScanQueue, "Hotel Queue Management" (T4 vendor; used for the peak-window/group-arrival mechanics only) — https://scanqueue.com/blog/hotel-lobby-queue-management; Zhang & Verma, "What Matters Most to Your Guests", Cornell Hospitality Report 17(4) 2017 — https://ecommons.cornell.edu/entities/publication/c780fe11-7b4f-4cdd-ba23-b62abc168329 (T2)
- Class: HEURISTIC
- Scope: hospitality, healthcare (registration), commercial (service counters)
- Confidence: Medium
- Grid translation: `desks = ceil(peak_arrivals × 4 min / peak_window_min)`; residual waiting guests
  occupy queue tiles — 1–2 tiles per standing person — placed off the main through-route so the
  lobby still retains a 3-tile passing lane (a queue needs the third row of tiles); flag any lobby
  whose walkable area is consumed by its own queue. Because access control is tag-based, a key-card
  post must sit inside the desk cluster, not across the lobby.
- Exceptions / failure mode: mobile check-in and digital keys genuinely flatten the peak — but they
  move it onto a luggage/bell node and a support desk, they do not delete standing demand. Symptom:
  a beautiful lobby with guests standing in the doorway line and the accessible route blocked by
  its own queue (see PP-22).

### PP-09 Give multi-purpose rooms a furniture store and a wide turn route or you cap revenue

- Rule: Every banquet/multi-purpose room needs adjacent storage volume for its own furniture and a
  dedicated ≥2-tile (preferably 3) turn route from service corridor to room, so a changeover never
  uses guest space.
- Evidence: Trade narrative describes the causal chain precisely: "banquet turns run long because
  furniture and food share one narrow artery, capping the ballroom's bookable events per weekend: a
  revenue ceiling installed by a corridor" — and the trigger is value-engineering the service
  corridor behind the ballroom to code minimum (T4). Supporting practitioner evidence: staging
  pantry adjacency, trolley-safe routes, and banquet routes crossing the lobby listed as a canonical
  BOH failure (T3, T4). **cross-checked: no — this is practitioner consensus (3 independent T3/T4
  sources) with no measured study located.** Consensus strength: multiple independent practitioner
  sources, one mechanism, no quantitative turnaround-time data.
- Source: Before It Opens (T4) — https://beforeitopens.com/articles/back-of-house/; WATG (T3) — https://www.watg.com/back-of-house-design-how-architecture-shapes-luxury-service/
- Class: BUILDING-TYPE CONVENTION
- Scope: hospitality (also education/civic halls)
- Confidence: Medium for the geometry (storage volume beside the room, a wide changeover route);
  **Low for the "you cap revenue" half of the headline** - the revenue ceiling is a two-source T3/T4
  practitioner narrative with no measured turnaround study behind it (see *Weak or contested*), so
  treat it as a stated business risk, not a modelled one.
- Grid translation: for each `banquet`/`event` room, require an adjacent `furniture_store` cluster
  ≥ 0.3 × room tiles and a `door` run of ≥2 tiles onto a `walkable` service corridor ≥2 tiles wide,
  with a continuous turning space of 3×3 tiles inside the room; assert the changeover route contains
  no guest-route tile (PP-01).
- Exceptions / failure mode: fixed-seat rooms need none of this. Symptom: chairs stacked in the
  corridor, double turns per event, one fewer event sold per weekend.

### PP-10 Width in plan is not width in use: charge every protrusion and every open leaf

- Rule: Compute **effective** route width, not drawn width: subtract open door leaves, columns,
  hand dryers, ATMs, fire connections, cabinets, radiators and stored items. A route that measures
  2 tiles with an object in it is a 1-tile route.
- Evidence: Experimental crowd research: when pedestrians pass an obstacle they keep a lateral
  clearance averaging **0.3–0.7 m** depending on flow rate and speed, and average velocity drops
  significantly as obstacle size increases; avoidance behaviour did not differ between walking and
  running (T2). Code: the accessible route may pinch from 36 in to 32 in only "for a maximum distance
  of 24 in", the clear width "cannot be reduced by any elements, including handrails or protruding
  objects", and a 180° turn around an element narrower than 48 in needs 48 in at the turn and 42 in
  approaching (T1). Accessibility consultants' documented findings list "protruding objects… fire
  connections, ATMs, and hand dryers" among the most common barriers (T3).
  **cross-checked: yes — T2 measurement + T1 code + T3 field findings.**
- Source: Alhawsawi et al., "Understanding the Characteristics of Pedestrians when Passing Obstacles of Different Sizes", Collective Dynamics 6:1–23 (T2) — https://collective-dynamics.eu/index.php/cod/article/view/A114; Access Board ADA/ABA Guides, Chapter 4: Accessible Routes (T1) — https://www.access-board.gov/ada/guides/chapter-4-accessible-routes/; Bureau Veritas, "The 8 Top ADA Violations" (T3) — https://www.bvna.com/magazine/8-top-ada-violations-and-how-avoid-them
- Class: ENGINEERING CONSTRAINT
- Scope: universal
- Confidence: High; the class rests on the measured 0.3-0.7 m passing clearance (physical behaviour) - the ADA pinch numbers quoted with it are code-derived facts
- Grid translation: for each `walkable` tile compute `clear_width = min(run width, run width −
  protrusion tiles)`; any tile hosting a protruding fixture removes itself plus a 1-tile lateral
  shadow from the route; a route whose clear width falls below 2 tiles for more than 1 consecutive
  tile fails; a turn around a <3-tile obstruction requires 3 tiles at the turn.
- Exceptions / failure mode: low-flow back corridors genuinely take the pinch; symptom is the
  "please move your chair" moment, a scuffed wall corner, or a wheelchair user unable to pass
  (litigation-relevant, see PP-22).

### PP-11 A one-tile corridor is a strict single file — plan two for passing, three for queuing

- Rule: 1 tile = one person only: no passing, no trolley, no code-compliant route. 2 tiles = first
  passing width. 3 tiles = the first width where a queue or a trolley can stand beside the moving
  line. Never use a 1-tile route as the only access to a room that carries beds, trays, carts or
  wheelchairs.
- Evidence: Code: 36 in (0.91 m) continuous minimum accessible width, with 60 in × 60 in passing
  spaces "required every 200 feet" (T1) — i.e. 2 tiles minimum and a 3×3-tile bay roughly every 122
  tiles. Tooling guidance derived from the same arithmetic: if a hinged door swings into a hallway,
  the hallway must be the door width **plus** 36 in of clear walkway (a 32 in door → 68 in / ~1.7 m,
  i.e. 4 tiles) (T4, cross-checked against the T1 doors-in-series rule in PP-14). Operational
  evidence: carts, beds and trolleys need the passing/standing lane, and healthcare guidance
  repeatedly adds corridor width for bed turning, "touchdown" bases and equipment (T1).
  **cross-checked: yes for the numbers (T1); the "door width + 36 in" formulation is tool
  documentation (T4) consistent with T1 intent.**
- Source: Access Board, Chapter 4: Accessible Routes (T1) — https://www.access-board.gov/ada/guides/chapter-4-accessible-routes/; Access Board, Chapter 4: Entrances, Doors, and Gates (T1) — https://www.access-board.gov/ada/guides/chapter-4-entrances-doors-and-gates/; RoomSketch3D, "Door Clearance" (T4) — https://roomsketch3d.com/help/wall-fixtures/door-clearance; NHS HBN 04-01 figure "The location of the en-suite has a major influence…" (T1) — https://www.england.nhs.uk/wp-content/uploads/2009/12/HBN_04-01_Final.pdf
- Class: CODE REQUIREMENT
- Scope: universal
- Confidence: High for the code numbers themselves (36 in continuous, 60 × 60 in passing space every
  200 ft) and for the 1/2/3-tile semantics derived from them; **Low for the "door width + 36 in of
  clear walkway" formulation and the 4-tile figure it produces** - that is T4 tool documentation
  interpreting the accessible-route and doors-in-series rules, not code text (see *Weak or
  contested*).
- Grid translation: hard check — every room reachable only through a 1-tile run is flagged if the
  room contains a `bed`, `trolley`, `wheelchair`, `cart` or `guest_room` tag; every `walkable`
  corridor run longer than 122 tiles requires a 3×3-tile passing bay; every 1-tile run must be
  justified as dead-end storage access, not circulation.
- Exceptions / failure mode: 1-tile access is fine for a janitor closet, a meter alcove, a terrace.
  Symptom of getting it wrong: the room is unreachable for its own equipment, so it is quietly
  repurposed — the most common post-occupancy "the plan doesn't work" story.

### PP-12 Bends and angles are a throughput tax: prefer 0° and wide openings at turns

- Rule: Every non-collinear bend in a route costs flow; keep main circulation straight, and where a
  turn is unavoidable make the opening wide rather than angled. Do not use angled or pinched
  corridors as the spine of a plan.
- Evidence: Trajectory research on bidirectional flow through angled corridors: the straight
  corridor (0° turn) is the most efficient configuration, flow rate falls at non-zero turning
  angles, "angled egress paths result in a lower flow rate and a longer escape time", speed falls
  approaching the turn, and obstructions "reduce the corridor's effective width and create a
  bottleneck" (T2 thesis, USM eprints). Independent corroboration of the bottleneck half from the
  obstacle-passing study (T2, PP-10) and from the code response to 180° turns (T1, PP-10).
  **cross-checked: yes for direction of effect (3 sources, 3 tiers); no for a precise penalty per
  degree — the thesis numbers were not legible enough to quote as a coefficient.**
- Source: "Analysis of Walking Velocity of Pedestrian Walking Through Angled-Corridor Based on Spatial Trajectories – A Bidirectional Scenario" (T2 thesis) — http://eprints.usm.my/56981/1/Analysis%20Of%20Walking%20Velocity%20Of%20Pedestrian%20Walking%20Through%20Angled-Corridor%20Based%20On%20Spatial%20Trajectories%20%E2%80%93%20A%20Bidirectional%20Scenario.pdf; Access Board (T1) — https://www.access-board.gov/ada/guides/chapter-4-accessible-routes/
- Class: ENGINEERING CONSTRAINT
- Scope: universal (egress-critical in assembly, healthcare, detention)
- Confidence: Medium
- Grid translation: penalise `turn_angle != 0` on the primary spine; require each turn to open into
  at least a 3×3-tile node; forbid a diagonal-only path where both corner neighbours are blocked
  (the grid already enforces this — the design point is not to create routes that *depend* on
  diagonals).
- Exceptions / failure mode: bends are good for privacy, view control and compartmentation, and are
  legitimate in low-flow residential and retail back-of-house. Symptom: the lobby corridor queues at
  a 45° pinch every evening.

### PP-13 Apply the desire-line test: screen detour ratios above a tuneable threshold (the quoted 20–30% is news-sourced, not verified)

- Rule: For each main origin–destination pair, compare routed distance to straight-line distance.
  Screen every pair whose ratio exceeds a project-set factor inside the 1.1–1.3 band; the exact
  number is a tuning knob, not a sourced threshold (the popularly quoted "20 to 30 percent" figure is
  a news-article report and did not reproduce on re-read). Above the chosen factor, expect bypass:
  crossing open floor, propping doors, cutting corners, wearing through the finish, or squatting in an
  unintended room.
- Evidence: Reported research finding (Dirk Helbing, cited in a university news article): "travelers
  will form a desire path if the prescribed route is 20 to 30 percent longer" (figure NOT confirmed at
  source - do not quote: a later re-read of the same article returned a different statement, that
  travellers will take a path 10 percent longer, and the primary Helbing publication was never
  retrieved), and they do so even on stretches as short as ten metres. A campus planner adds the
  geometric version: "whenever you
  have a large, open green space surrounded by public buildings and you put in orthogonal paths…
  you're asking for corners to get clipped or diagonals to form" (T3 reporting a T2 finding).
  Code-level support for the underlying principle that designed routes must match real movement:
  accessible routes "must coincide with, or be located in the same area as, general circulation
  paths" (T1). **cross-checked: direction only — the 20–30% threshold is a single attributed
  researcher statement reaching this file through a news article, and its wording did not reproduce on
  re-read; the "routes follow real movement" principle is confirmed at T1.**
- Source: UW–Madison News, "Desire paths: the unofficial footpaths that frustrate, captivate campus planners" (T3, quoting Helbing) — https://news.wisc.edu/desire-paths-the-unofficial-footpaths-that-frustrate-captivate-campus-planners/; Access Board, Chapter 4: Accessible Routes (T1) — https://www.access-board.gov/ada/guides/chapter-4-accessible-routes/
- Class: HEURISTIC
- Scope: universal
- Confidence: Medium for the direction (under-served routes get bypassed - T1-corroborated); **Low
  for the specific 20–30% figure**, which is news-sourced, unreproducible on re-read of the cited
  article, and whose primary publication was never retrieved. Nothing above 1.0 on this rule's ratio
  is a sourced threshold: it is a screening knob the project sets and records.
- Grid translation: `detour_ratio = A*_tiles / ceil(octile_direct_distance)` per OD pair; flag
  > the project's chosen screening factor (1.25 is the default placeholder inside the unverified
  1.1–1.3 band, never a code-like limit); for each flagged pair either shorten the route, add a door,
  or accept the bypass and harden those tiles into a real finished route.
- Exceptions / failure mode: security, hygiene and infection control *want* forced detours (one-way
  systems, airlocks, gowning). Then the compensating provisions are wayfinding (PP-21) and
  acceptable queue capacity (PP-08). Symptom: a "shortcut" worn into the plan where the model shows
  nobody should walk.

### PP-14 A door reserves floor on both sides: never let two reservations overlap

- Rule: Model each door as its opening plus a swing arc of radius = opening width on the swing side,
  a latch-side standing clearance on the approach side, and a landing beyond. Two doors whose
  reservations intersect, or doors in series without separation, are a defect — not a style choice.
- Evidence: Regulator text: maneuvering clearances "are specified according to direction of
  approach, swing of doors, and in some cases the presence of a closer or latch", must be free of
  protrusions for the full height, and are required on both sides except at one-way doors; at
  hinged doors **in series** "a separation is required that is at least 48 in plus the width of
  doors or gates swinging into the space"; an obstruction within 18 in of the latch side projecting
  more than 8 in from the door face converts a lateral approach into a forward-approach
  requirement; "difficulty opening manual entrance doors is a common access complaint", and
  exterior swing doors routinely exceed the 5 lbf interior maximum because no maximum is specified
  for them (T1). Tool documentation restates the arithmetic usefully: a 32 in door reserves ~6.5 sq
  ft of arc, 18 in latch side minimum (24 in preferred), 60 × 60 in landing both sides (T4).
  Healthcare guidance produces the same conflict clinically: to accommodate bed turning "either the
  corridor or the bedroom doors will need to be wider", and the nurse "touchdown base" is
  "difficult without adding additional width to the corridor" (T1). **cross-checked: yes — T1
  primary, T1 (healthcare) and T4 (tool) agree.**
- Source: Access Board, Chapter 4: Entrances, Doors, and Gates (T1) — https://www.access-board.gov/ada/guides/chapter-4-entrances-doors-and-gates/; RoomSketch3D (T4) — https://roomsketch3d.com/help/wall-fixtures/door-clearance; NHS HBN 04-01 (T1) — https://www.england.nhs.uk/wp-content/uploads/2009/12/HBN_04-01_Final.pdf
- Class: CODE REQUIREMENT
- Scope: universal
- Confidence: High for the regulator-specified clearances, the doors-in-series separation and the
  latch-side rules (T1 text); **Low for the tool-documentation glosses in Evidence - the "~6.5 sq ft
  arc", the "60 × 60 in landing both sides" phrasing and the "door width + 36 in" hallway formulation
  are a T4 interpretation of the code, not code text** (see *Weak or contested*).
- Grid translation: mark tiles inside the swing arc (quarter-disc of radius = door-run tiles) as
  `swing_reserved`; assert no `fixture`, no other `swing_reserved`, and no required `walkable` route
  of <2 tiles falls inside it; doors in series on adjacent or opposite walls need ≥3 tiles plus the
  leaf widths; a room whose only door needs a latch-side tile must have that tile inside the room or
  in a ≥3-tile corridor — never in a 2-tile corridor shared with its own arc.
- Exceptions / failure mode: BOH and clinical doors deliberately swing *into* guest corridors
  (push plates, and a practitioner notes leaves take a beating so opening into guest-facing space
  preserves the guest-room wall — T3). That is a considered trade; the error is doing it by accident
  on a 2-tile route. Symptom: a door that can only be opened with a shoulder while carrying a tray.

### PP-15 No direct line of sight into a private door — build a buffer, not a curtain

- Rule: Wherever a `wc`, `shower`, `bed` or `staff_toilet` door exists, require that its door tile
  is not visible from the main social/clinical space; achieve this with an L-bend, vestibule or
  buffer room rather than a longer corridor.
- Evidence: Practitioner argument, in plain terms: "Having a toilet room by the front door is not
  the problem — it's how you access it… at the very least, create some sort of procession or
  privacy to the path accessing this room", with the recommended arrangement described as a coat
  closet volume that "acts as a visual and acoustical buffer to the room beyond", plus a door
  positioned so the counter presents, not the toilet (T4, working architect). Independent, stronger
  confirmation: "En-suite doors should not open directly onto immediate bed areas" (T1), and in the
  en-suite comparison table the option where "entry to the en-suite can be seen from the corridor"
  is explicitly annotated as reducing patient privacy (T1). The acoustic half is separately
  supported by the CBE finding that the dominant noise complaint is *speech* (T2, PP-16).
  **cross-checked: yes — T1 + T4 + T2, three different institutions.**
- Source: Life of an Architect, "Toilets by the Front Door" (T4) — https://www.lifeofanarchitect.com/toilets-by-the-front-door/; NHS HBN 04-01 §§5.11 and Figure 6 (T1) — https://www.england.nhs.uk/wp-content/uploads/2009/12/HBN_04-01_Final.pdf; Buildings & Cities / CBE analysis (T2, PP-16)
- Class: DESIGN PRINCIPLE
- Scope: universal (residential, hospitality, healthcare, workplace)
- Confidence: High
- Grid translation: a `wc`/`shower`/`bed` door tile must not lie on a straight `walkable` ray from
  any `lobby`/`living`/`nurse_station` tile (allow one bend, or an intervening `vestibule` cluster
  of ≥1 tile). Report a `privacy_exposure` count.
- Exceptions / failure mode: infection control sometimes wants the opposite — visibility *through*
  the door for observation (see PP-20), which is why healthcare uses glazed screens. The grid cannot
  have both; decide by room type and record the conflict when both tags apply.

### PP-16 Treat sound as plan geometry: adjacency, buffer row, and one continuous party wall

- Rule: Classify every room tag as noise-source or noise-sensitive; forbid a direct shared wall
  between a source and a sensitive room unless a buffer tile column (another room, a closet, a
  corridor with a turn) sits between them. In addition, any separating wall between two acoustically
  independent spaces must be a single straight unbroken run of blocked tiles from structure line to
  structure line, containing no door/glass run in the same plane and no shaft penetration.
- Evidence: [adjacency] In the CBE Occupant Survey analysed across **617 office buildings / 62,360
  respondents**, acoustics were "the most common source of dissatisfaction" — 54% of respondents
  named at least one acoustic reason, versus temperature 38% and visual privacy 28% — and the
  specific causes were **people talking, speech privacy and phones**, "not equipment noise or
  outdoor sounds"; occupants of open-plan offices with low or no partitions were "almost twice as
  likely to complain" than those in enclosed private offices; visual-privacy complaints came from
  passers-by (55%) and partition height too low (40%); acoustic, space and privacy complaints
  cluster in the same people (T2). A broader POE review finds complaint frequencies of thermal
  comfort 85%, spatial layout/functional performance 82%, ventilation 64%, acoustic noise 62% (T2).
  Hotel-side, "bathroom" is a word that surfaces specifically in low-rated reviews (T2).
  [continuity] field measurement reported by an acoustic consultant — in the same rooms,
  treating only the façade mullion at the party-wall junction raised airborne sound insulation from
  DnT,w 40 (−2;−5) dB to DnT,w 51 (−2;−8) dB (+Ctr metric 35 → 43 dB), i.e. "the perceived loudness
  of the noise is almost halved" from one junction; the same source names misaligned internal
  partitions, slab-to-façade gaps, penetrations and workmanship as the real drivers, and notes lab
  Rw/STC ratings are optimistic against field DnT,w/ASTC (T3). Code encodes the continuity
  requirement as barrier + fire-stopping rules for service penetrations (T1, as quoted by T3).
  **cross-checked: yes for "adjacency and speech privacy dominate" (T2 ×2); partially for the
  continuity numbers — T3 field test + T1 requirements, no T2 replication found.**
- Source: "Common sources of occupant dissatisfaction with workspace environments in 600 office buildings", Buildings & Cities (T2) — https://journal-buildingscities.org/articles/10.5334/bc.274; "Post-Occupancy Evaluation's (POE) Applications for Improving Indoor Environment Quality", IJERPH 2022 (T2) — https://pmc.ncbi.nlm.nih.gov/articles/PMC9607023/; Zhang & Verma, Cornell Hospitality Report (T2) — https://ecommons.cornell.edu/entities/publication/c780fe11-7b4f-4cdd-ba23-b62abc168329; "Flanking sound transmission in residential dwellings through façade" (T3) — https://wfmmedia.com/flanking-sound-transmission-between-adjacent-dwelling-units-through-the-facade/; CCC Engineering, "Coordination of Services in Ceiling Voids" (T3, quoting NCC Spec 13 — T1) — https://cccengineering.com.au/design-memos/services-coordination-ceiling-voids/
- Class: DESIGN PRINCIPLE (proxy for an ENGINEERING CONSTRAINT)
- Scope: universal (residential, hospitality, healthcare, education, workplace)
- Confidence: High (that adjacency/speech and wall continuity drive complaints), Medium (any
  specific buffer distance — **no tile-scale distance is defensible from this evidence**)
- Grid translation: build a source/sensitive tag matrix; assert no source-room boundary tile touches
  a sensitive-room boundary tile; count `bad_adjacency_tiles` and `shared_wall_length` as a proxy
  score; require ≥1 full tile column of buffer between `kitchen`/`plant`/`banquet`/`lift` and
  `bed`/`guest_room`/`ward`/`classroom`. For each independently-tenanted pair: assert the separating
  chain is straight, both ends reach a structural boundary, it contains no shared glazed/`door`
  line, and no `shaft` tile sits inside it. **Flag as proxy: no dB, no flanking, no impact noise.**
- Exceptions / failure mode: dense plans cannot always buffer — then the mitigation is room-role
  swap (closets, storage, stairs take the hit), which the grid *can* check. Hotel plans routinely
  put the guest's own bathroom against the neighbour's sleeping side deliberately (see PP-17).
  Symptom: the "#1 post-occupancy complaint" arriving in a building whose drawings looked perfectly
  zoned.

### PP-17 Fix the stack before the plan: wet cells on one wall, on one shaft, within a slope budget

- Rule: Place all waste-generating fixtures on one wet wall sharing a single shaft column, put the
  WC nearest the stack, keep the shaft in the same plan position floor after floor, and respect the
  drainage-slope budget — beyond ~1.5–2 m of horizontal run, the floor (or the ceiling below) pays.
- Evidence: Practitioner plumbing guidance, stated with mechanism: cluster WC, basin and shower on
  one wet wall over a single shaft — spreading them across three walls "triple[s] the buried
  pipework, the joints, and the chances of a hidden leak"; "the waste pipe is the one that governs
  your layout, because it must fall continuously to drain by gravity"; a 100 mm soil pipe needs
  1:40–1:60 fall, so "every extra metre of horizontal run drops the pipe lower — run it too far and
  it either fouls the slab or surfaces above the finished floor"; aim to reach the stack within
  1.5–2 m; stacked bathrooms "roughly halve" vertical runs and concentrate slab penetrations into
  one waterproofed zone; the named common mistake is the basin placed on the door wall "because that
  is where the mirror looks nice", buying 2–3 m of buried pipe and "a joint under tiles you will
  never reach" (T4, with explicit T1 citations: NBC 2016 Part 9, IS 1172, IS 5329). Independent
  engineering guidance repeats it as a coordination rule: gravity wet systems are planned second in
  the shaft because "plumbing lines depend on gravity and fixed slopes" (T3/T4). Healthcare guidance
  confirms services follow the wet cell — where the en-suite is "nested" the support-services
  options change, and interlocking en-suites "increase overall width and depth of the room" (T1).
  **cross-checked: yes — three independent sources across T1/T3/T4 agree gravity fixes the plan.**
- Source: Studio Matrx, "Plumbing-Efficient Bathroom Layout" (T4, cites NBC/IS — T1) — https://www.studiomatrx.org/guides/plumbing-efficient-bathroom-layout-india; National MEP Engineers, "Optimal Placement of Plant Rooms and Riser Shafts" (T3/T4) — https://www.natlmep.com/optimal-placement-of-plant-rooms-riser-shafts-and-equipment-for-easy-maintenance/; NHS HBN 04-01 Figure 6 (T1) — https://www.england.nhs.uk/wp-content/uploads/2009/12/HBN_04-01_Final.pdf
- Class: ENGINEERING CONSTRAINT
- Scope: universal (any building with water)
- Confidence: High
- Grid translation: define a `shaft` column of blocked tiles repeated on every floor; assert each
  `wc`/`basin`/`shower`/`sink`/`floor_drain` fixture is within 4 tiles (2 m) of the shaft and on the
  same wall line; assert the shaft position does not move between floors (or flag the move as a
  costed decision); count `wet_fixtures_off_stack` as a metric.
- Exceptions / failure mode: heritage/loft conversions and long-span towers genuinely need remote
  fixtures; the real cost is floor build-up or a dropped ceiling in the room below — **unmodellable
  here (no section), so flag it**: "fixture >4 tiles from shaft: requires section resolution".
  Symptom: a low-ceilinged bathroom, a raised shower tray, or a neighbour's ceiling stain.

### PP-18 Reserve a services band along the corridor wall — and do not sell the height it eats

- Rule: Allocate a continuous one-tile service band on the corridor side of rooms (or above the wet
  wall) for ducts, stacks and trays, sized early, in priority order: structure → sprinkler → air →
  gravity wet → electric/data. If the band can't fit, the answer is more floor-to-floor height, not
  a flattened duct.
- Evidence: An MEP design memo works the arithmetic: in a 10-storey office with 3.6 m
  floor-to-floor, 200 mm slab and 2,700 mm finished ceiling, the void is 700 mm; the stack-up
  (sprinkler 75, duct 300, tray 100, pipes 50, grid 50) consumes 575 mm and leaves 125 mm — "tight,
  but buildable", and a 150 mm fire damper additionally "needs 200 mm of clear access on one side…
  if a cable tray runs right next to it, nobody can reach the damper. This is the kind of clash that
  BIM catches early and site coordination catches late." A 500 mm void "will force compromises.
  Ducts get flattened (wider but shorter), pipes reroute, and cable trays stack vertically. Each
  change adds cost. The cheaper fix is to set the right floor-to-floor height at concept design."
  Costed trade-off as stated: +100 mm of void ≈ $50–80/m² of facade and structure versus
  $100–200/m² of rework if too tight; typical office void 600–700 mm, hospitals/labs 800–1,000 mm;
  and the priority order "structure… sprinklers… ductwork… cable trays and pipes… ceiling grid";
  lock it at concept because "late changes to floor-to-floor height affect every level, every facade
  panel, and every stair flight" (T3). Riser ordering is corroborated independently (T3/T4, PP-17).
  Hotel-side warning: cutting capital expenditure by "reducing ceiling heights or eliminating
  service redundancy… permanently destroys future repositioning potential" (T3). **cross-checked:
  the *ordering* is corroborated across two independent sources; the dollar and millimetre figures
  are single-source T3 estimates, and heights are unmodellable on this grid (proxy only).**
- Source: CCC Engineering, "Coordination of Services in Ceiling Voids" (T3) — https://cccengineering.com.au/design-memos/services-coordination-ceiling-voids/; National MEP Engineers (T3/T4) — https://www.natlmep.com/optimal-placement-of-plant-rooms-riser-shafts-and-equipment-for-easy-maintenance/; Hotel Development Guide (T3) — https://hoteldevelopmentguide.com/architectural-planning/
- Class: ENGINEERING CONSTRAINT (proxied in plan)
- Scope: universal (commercial, healthcare, hospitality most acute)
- Confidence: Medium-High for the void arithmetic and the trade-off *direction*; **Low for every
  dollar-per-square-metre and millimetre figure in Evidence** - they are one unaudited engineering
  memo's estimates, usable as direction only, never as a budget input (see *Weak or contested*), and
  heights are unmodellable on this grid regardless.
- Grid translation: mark a 1-tile band adjacent to the wet wall and along the corridor wall as
  `service_band`; assert it is continuous between a `shaft` and every fixture needing service and is
  never consumed by rooms, closets or structure; where the band crosses a route, the crossing sits
  under a `blocked` line (a sleeve), never through a fixture. **Explicit flag: floor-to-floor
  height, soffit loss and duct depth cannot be represented; the grid can only prove the band exists
  and is coherent.**
- Exceptions / failure mode: in a 2-tile-deep corridor the band *is* the corridor and the plan
  cannot hide it — that is the moment the design needs a section, and the model can't help. Symptom
  reported by engineers: the architect signs off a low floor-to-floor and the services take it out
  of the corridor later.

### PP-19 Every large thing must be replaceable and verifiable: removal path, access tile, test point

- Rule: For each fixture that will be replaced or serviced within the building's life (chiller, AHU,
  pump, boiler, lift, damper, filter, cassette WC, floor drain), prove three things in plan: a clear
  removal path from the outside world at least as wide as the object, maintenance clearance around
  it (≥42 in / 1.07 m; 6 ft plus tube pull for chillers), and an access point reachable from a
  walkable tile without demolishing another trade's work. Then assume a third of operational
  problems were designed in, and design for re-verification.
- Evidence: [access geometry] MEP guidance lists the numbers — 42 in clearance on all sides of
  mechanical equipment "for inspection, bearing work, and filter replacement"; chillers "need
  six-foot service clearances, along with tube pull space"; equipment in riser zones keeps 1,000 mm
  from walls; pump-to-pump ≥1,500 mm "to provide maintenance access without removing any adjacent
  equipment"; plant rooms 2,000–2,400 mm headroom; "plant room layouts ought to allow effortless
  equipment removal, enhancements, and maintenance access from the very first day"; and "equipment
  replacement routes should be defined early" because otherwise "future replacement will cost
  thousands in structural modifications" (T3/T4). Independent confirmation from the commissioning
  side: "as much as one-third of major commissioning problems can be traced back to the design
  phase… and these problems often plague building operators throughout the life of the building",
  and what design review must catch — **test port location, equipment accessibility**, load
  calculations, control sequences and point lists (T2, Mills et al. 2004 as summarised in NIST TN
  1727). Independent confirmation of the omission's cost: access panels cost $50–100 each, "not
  having them costs $500–1,000 per damper in ceiling removal and reinstatement during maintenance"
  (T3). Evidence (drift): new-construction commissioning cost $0.06–2.57/ft²; existing-building
  commissioning simple payback 0.9–45.7 years, **median 3.7 years**, 9 of 19 above four years; of 48
  implemented measures **81% had persisted** at follow-up, while campus cases show "89% of the
  electric savings and 0% of the natural gas savings" persisting (T2). Community-level signal (title
  only, thread not retrievable): "Air handler access panel blocked" (r/hvacadvice).
  **cross-checked: yes — T2 + T3 + T3/T4, three professions arriving at the same requirement.**
- Source: National MEP Engineers (T3/T4) — https://www.natlmep.com/optimal-placement-of-plant-rooms-riser-shafts-and-equipment-for-easy-maintenance/; NIST Technical Note 1727, "Commissioning Cost-Benefit and Persistence of Savings" incl. Mills et al. 2004, LBNL (T2) — https://nvlpubs.nist.gov/nistpubs/TechnicalNotes/NIST.TN.1727.pdf; CCC Engineering (T3) — https://cccengineering.com.au/design-memos/services-coordination-ceiling-voids/; Reddit thread title via search index (T5, not read) — https://www.reddit.com/r/hvacadvice/comments/1joqjcq/air_handler_access_panel_blocked/
- Class: ENGINEERING CONSTRAINT
- Scope: universal
- Confidence: High (geometry check, design-phase origin), Medium (persistence percentages); the access
  and replacement geometry is the constraint. The cost figures quoted in Evidence ($50–100 per access
  panel, $500–1,000 per damper, the $/m² trade-offs) are **not measured facts** - they are unaudited
  estimates from one engineering memo (T3), usable as direction only and never as a budget input (see
  *Weak or contested*)
- Grid translation: add `replaceable: true`, `removal_width_tiles` and `serviced_from: public|private`
  to equipment tags; assert a straight `walkable` path from a perimeter `door` to the fixture with
  clear width ≥ `removal_width_tiles` and no turn narrower than 3×3 tiles; assert ≥2 free tiles
  around the fixture (3 if `removal_width_tiles ≥ 2`); assert ≥1 adjacent `access_panel` tile that is
  reachable without crossing a locked/restricted tile or entering a private room. Emit a
  `verify_after_occupancy` list from these same tiles.
- Exceptions / failure mode: some equipment is designed never to be replaced (embedded manifolds,
  sealed-for-life units) — legitimate **only if recorded**; the failure is discovering it in year 12.
  Buildings with no commissioning agent or no re-commissioning drift silently, and grid checks then
  become the only QA available. Symptom: a wall opened to get a new plant in, a ceiling torn out for
  one damper, "the system works, the bill doubled".

### PP-20 Healthcare: observation and infection control pull the plan opposite ways — decide per room

- Rule: For inpatient wards provide (a) a defined observation relationship between staff post and bed
  tiles, (b) a soiled utility inside the ward's own loop at a recommended catchment of roughly 15
  beds (recommendation, not a limit — see PP-03), (c) isolation rooms with a
  vestibule and their own soiled route, and (d) an explicit ruling on whether each door line is for
  seeing or for privacy — never both.
- Evidence: Official guidance states the trade-off rather than being heroic about it: "Some
  clinicians may feel that single-bed rooms make observation more difficult, whereas others find
  that engagement with patients improves in a single-room environment"; the mitigation is geometric —
  "glazed walls or very large windows between rooms and corridors will enable staff to observe
  patients and, equally importantly, patients to see staff", with the counter-requirement that
  "patients should have the means to obscure windows" (HBN 04-01 §4.43–4.44, T1). Isolation: "an
  isolation suite — which includes an entrance lobby, bedroom and en-suite sanitary facilities —
  will be required", and the suite "works on the principle of supplying air from the lobby at high
  level to the bedroom and removing it at low level", with a warning that a ceiling hoist track
  between isolation room and shower "should not compromise the airflow pattern" (T1 — **airflow is
  unmodellable; the vestibule is the plan proxy**). Soiled-utility catchment of ~15 beds (T1 title
  only — the paragraph could not be re-read and its wording is "ideally", see PP-03).
  Infection-control guidance requires clean/dirty demarcation plus a slop hopper and a *separate*
  decontamination sink in the dirty utility (T1). Environmental reality behind the acoustic half:
  measured ICU sound levels LAeq 52–59 dBA for over 50% of the time against a WHO target of 35 dBA,
  peaks >85 dBA up to 16 times an hour overnight, with clear handover-driven spikes; the authors
  conclude the WHO level "is so low it is not achievable in an ICU" (T2).
  **cross-checked: yes (T1 ×2, T2) on every provision; the performance claims built on ward *type*
  are not supported** (see *Claims that did NOT survive*, item 2).
- Source: NHS HBN 04-01 §§4.36–4.44, 4.62–4.69, 5.11–5.17 (T1) — https://www.england.nhs.uk/wp-content/uploads/2009/12/HBN_04-01_Final.pdf; NHS HBN 00-09 (T1) — https://www.england.nhs.uk/wp-content/uploads/2021/05/HBN_00-09_infection_control.pdf; Darbyshire & Young, "An investigation of sound levels on intensive care units with reference to the WHO guidelines", Critical Care 18(5) R187 (T2) — https://pmc.ncbi.nlm.nih.gov/articles/PMC4056361/
- Class: CODE REQUIREMENT
- Scope: healthcare
- Confidence: High (observation, vestibule and clean/dirty separation as provisions), Low (any claim
  about which ward type "performs"), Low (the ~15-bed catchment quoted into (b) - unverified at
  source and aspirational in wording, see PP-03); the classification is code-derived only where the
  jurisdiction adopts the NHS guidance as a requirement - the per-door ruling on seeing versus
  privacy stays a design principle we must decide
- Grid translation: for each ward loop assert ≥1 `soiled_utility` and ≥1 `clean_utility` inside the
  loop; assert the two are not adjacent and their approach tiles differ; assert every
  `isolation_bed` room has ≥1 `vestibule` tile between it and the corridor and its own route to
  `soiled_utility` that crosses no `clean_utility` door; compute an observation proxy — the fraction
  of `bed` tiles with a straight unobstructed tile-ray to a `nurse_station` tile — and **report it,
  do not mandate a threshold**; the guidance itself sets none.
- Exceptions / failure mode: 100% single-room wards collapse the observation proxy toward zero and
  shift the burden to glazing/technology the grid cannot represent; multi-bed rooms harm isolation
  and privacy. Symptom: staff standing in the corridor to know what is happening; soiled linen
  crossing the clean utility threshold.

### PP-21 Wayfinding is a decision-point count, not a signage budget

- Rule: Minimise decision points on main routes, make the hardest-to-find destinations legible from
  the spine (visible destinations, distinct loops, no look-alike dead ends), and test that a
  first-time user can tell two adjacent routes apart without reading text.
- Evidence: Hospital quality-improvement study (960-bed tertiary hospital, ~100,000 outpatient
  visits/month, ~5,000 signs installed): "the most difficult areas to find were ICUs (35.6%), OT
  (31.1%), and laboratories (31.1%). Additionally, 98% of the participants could reach their desired
  destination but had to double-check with the staff" — the failure mode is not being lost, it is
  *staff interruption as the navigation system*; before the intervention, complaints "resulted in a
  waste of valuable time for the healthcare workers… and therefore delayed the process of patient
  care" (T2). Corroborating mechanism: busy internal spaces visible from circulation are treated as
  orientation cues, "views into busy internal spaces such as circulation areas can provide a
  distraction for patients and are just as important as views of the outside world" (T1). Code
  support for the related "routes follow real movement" principle (T1, PP-13).
  **cross-checked: partially — one T2 dataset for the percentages; consistent direction from T1.**
  Consensus: 2–3 independent sources, one dominant dataset.
- Source: "Implementation of Wayfinding Signage in Public Hospitals and Its Evaluation Towards Quality Improvement", PMC11345034 (T2) — https://pmc.ncbi.nlm.nih.gov/articles/PMC11345034/; NHS HBN 04-01 §4.44 (T1) — https://www.england.nhs.uk/wp-content/uploads/2009/12/HBN_04-01_Final.pdf; Access Board (T1) — https://www.access-board.gov/ada/guides/chapter-4-accessible-routes/
- Class: DESIGN PRINCIPLE
- Scope: universal (stakes highest in healthcare, civic, education, large hospitality)
- Confidence: Medium-High
- Grid translation: from each entrance tile to each major destination count `decision_tiles`
  (walkable tiles with ≥3 open neighbours) and `turns`; flag when turns > 3 or when the destination
  tile is not visible (tile-ray) from any tile on the route; penalise repeating identical branch
  patterns (look-alike detection) and dead-end corridors carrying doors on one side only.
- Exceptions / failure mode: security and infection control justify deliberate illegibility for
  outsiders (BOH, isolation, pharmacy) — then the requirement flips to tag-based access plus clear
  staff routes. Symptom: staff acting as human signage (invisible to most post-occupancy metrics).

### PP-22 Accessibility risk is mostly route erosion and small fixtures, not the width you argued about

- Rule: Verify the accessible route as a *system* — entrance to every public room, ≥2-tile
  continuous width, 3×3 passing bays, no pinch longer than one tile, door clearances and opening
  force, and a clear approach tile at every counter — and protect it from post-occupancy objects.
  Non-standard geometry multiplies risk because it eats clearance in corners.
- Evidence: Code (T1): 36 in continuous, reducible to 32 in only for max 24 in; passing space
  60 in × 60 in every 200 ft; 48 in at 180° turns around sub-48 in elements; maneuvering clearance
  sized by swing and approach; accessible routes "must coincide with, or be located in the same area
  as, general circulation paths"; thresholds limited to 1/2 in. Field findings from an
  accessibility consultancy's documented "top 8": accessible parking with pavement slopes over 2% is
  "the number one exterior barrier nationally"; missing van-accessible spaces; non-compliant parking
  signage as "a red flag indicating that the building has interior elements which are not
  compliant"; door maneuvering clearances that are not level (max 2.08%); 5 lbf interior door force;
  accessible routes below minimum width/height **with protruding objects**, where "additional items
  along an accessible route are often added after the Certificate of Occupancy has been issued,
  without considering the impact to accessibility"; restrooms/dressing rooms high-risk because of
  element density; and the trivial-looking one — "a trash receptacle or planter placed in front of a
  narrow service counter may impede the required 30 in wide clear space" (T3). Regulator text
  independently records that hard manual doors are "a common complaint" (T1). Litigation context:
  physical-barrier Title III federal filings are roughly stable (~8,700 in 2025, having peaked at
  11,452 in 2021) while digital-accessibility claims are ~36% of federal Title III cases (T3
  aggregating Seyfarth/UsableNet data). **cross-checked: yes for the barrier inventory (T1 + T3);
  the litigation mix comes from law-firm/vendor data, not peer-reviewed sources.**
- Source: Access Board, Chapter 4: Accessible Routes (T1) — https://www.access-board.gov/ada/guides/chapter-4-accessible-routes/; Access Board, Chapter 4: Entrances, Doors, and Gates (T1) — https://www.access-board.gov/ada/guides/chapter-4-entrances-doors-and-gates/; Bureau Veritas, "The 8 Top ADA Violations and How to Avoid Them" (T3) — https://www.bvna.com/magazine/8-top-ada-violations-and-how-avoid-them; Be Accessible, "ADA Lawsuit Statistics" citing Seyfarth Shaw / UsableNet (T3) — https://beaccessible.com/post/americans-with-disabilities-act-statistics/
- Class: CODE REQUIREMENT
- Scope: universal, jurisdiction-specific (US standards cited; EU/UK/AU equivalents differ)
- Confidence: High (requirements), Medium (that any specific barrier dominates litigation)
- Grid translation: run connectivity from every public `door` tile to every publicly tagged room:
  continuous clear width ≥2 tiles; ≤1 tile of pinch; 3×3 bay every ≤122 tiles; every counter or
  service fixture keeps 1 free approach tile; and no `walkable` route tile may ever be assignable to
  a storage/display fixture later. Output a `route_erosion_risk` list of tiles adjacent to counters,
  bins, signage and fire equipment.
- Exceptions / failure mode: single-file 1-tile routes inside dwelling units, cells and detention
  suites are legal in many jurisdictions — do not import a public-route rule into private suites.
  Symptom: a compliant drawing, then a noticeboard, a fire extinguisher and a floor lamp in it — the
  three objects that make a route non-compliant after handover.

### PP-23 Freeze the operational programme before the geometry — late change is the dominant cost lever (the widely quoted 10–50× multiple is an uncited engineering-memo assertion)

- Rule: Get the operator/clinical/F&B programme and the equipment policy onto the drawing before
  walls are load-bearing; log every post-freeze change with the coordination documents it touches;
  price change by *route length and crossings re-solved*, not by rooms repainted. Late change is far
  more expensive than early change - that direction is the rule; **no multiplier on it is confirmed
  at source here**, so the rule carries a cost *ranking*, not a cost *rate*.
- Evidence: Rework magnitude: CII puts direct field rework at ~5% of total project cost, range
  2–20% by project type; PlanGrid/FMI (2018, ~600 professionals) tied >$31B/yr of US rework to poor
  communication and missing project information — miscommunication driving 26% and bad
  documentation/inaccurate drawings a further 14–22%, i.e. "48% of rework in construction ties
  directly to information failures"; Love (2002) found rework contributed to an average 52% of total
  cost growth (T3 reporting industry-research bodies). **All figures in this sentence except the ~5%:
  figure NOT confirmed at source - do not quote.** A later re-read of the same OpenSpace page
  returned different values for the CII range, the dollar total, both percentages, the derived "48%"
  and the Love number, and none of the primaries (CII, PlanGrid/FMI, Love 2002) is in this file's
  source list. Only the order of magnitude "rework is a few percent of project cost" survived.
  Detection-window effect: "coordination clashes found on site cost 10 to 50 times more than clashes
  found in design" (T3 — verbatim in the CCC Engineering memo, but the memo cites no source for the
  multiple; it is the author's assertion, not measured data). Long-run origin of operational faults:
  ~one-third from design phase (T2, PP-19). Practitioner side, hotel: bringing
  operators in too late "trigger[s] costly structural conflicts once geometry is locked" (T3), and
  supplies/storage policy must be agreed early precisely because it changes room areas (T1).
  Practice-side churn: "Once an architect agrees to one small revision outside the original scope,
  further revisions often follow… reworking drawings, specifications and coordination documents"
  (T4). **cross-checked: direction only — the direction is confirmed by T2 (NIST/LBNL) and multiple
  T3s; the statistics are not. The 2–20% range, $31B, 26%, 14–22%, "48%" and "52%" did not survive a
  second read of the cited page, and the 10–50× multiple is an uncited memo assertion. Never carry
  any of them downstream as project numbers or as quotable figures.**
- Source: OpenSpace, "How much does rework cost in construction? Data & framework" (T3, citing CII, PlanGrid/FMI 2018, Love 2002) — https://www.openspace.ai/blog/cost-of-rework-in-construction/; CCC Engineering (T3) — https://cccengineering.com.au/design-memos/services-coordination-ceiling-voids/; NIST TN 1727 (T2) — https://nvlpubs.nist.gov/nistpubs/TechnicalNotes/NIST.TN.1727.pdf; Hotel Development Guide (T3) — https://hoteldevelopmentguide.com/architectural-planning/; NHS HBN 04-01 §4.68 (T1); Fresh Projects, "An Architect's Guide to Managing Scope Creep" (T4) — https://www.gofreshprojects.com/blog/architects-guide-managing-scope-creep
- Class: HEURISTIC
- Scope: universal
- Confidence: High (direction: late change is the dominant cost lever, T2 + several T3/T4), Low (any
  single multiplier), **Low for every rework statistic listed here — the CII range, the dollar total,
  the two percentages, the derived "48%" and Love's 52% did not survive re-reading the cited page, and
  the 10–50× is an uncited memo assertion.** Compile the rule as a cost *ordering* (freeze early, log
  post-freeze route changes), never as a figure; see *Weak or contested*.
- Grid translation: keep two diffs per plan revision — `geometry_diff` (tiles changed) and
  `route_diff` (crossings, removal paths, wet-stack ties, service bands that had to be re-solved). A
  change that alters only tile paint is cheap; a change that moves a `shaft`, a `portal` stack, or
  any route a `replaceable` fixture depends on is post-freeze-expensive and must be logged as a
  veto-able decision.
- Exceptions / failure mode: refusing all change is not the rule — the failure is *silent* change
  that leaves the as-built route model and the O&M model inconsistent. Symptom: fit-out RFIs asking
  "where does the duct go", and an as-built with none of the access routes the plan claims.

### PP-24 Non-standard geometry is paid for in setting-out and perimeter, not in the drawings

- Rule: Cost plan shape explicitly: minimise perimeter-to-area, minimise the number of unique
  repeated units, and treat any non-orthogonal or non-repeating element as a premium line, not a
  free style choice.
- Evidence: Building-economics literature quantifies the penalty for the *same* floor area drawn
  irregularly instead of rectangularly: ~6% more external walling, **setting-out costs increased "by
  as much as 50%"**, excavations +6–20%, drainage +~25% "due to the extra manholes and extra length
  of piping", plus "additional costs… from other elements such as the walling and roofing due to the
  work being complicated by the shape"; and separately, regular shapes "become more expensive the
  longer and narrower they are planned" — worked example: 400 m² as a square needs 80 m of walling,
  the same area as a long bar needs 208 m (~2.6× the envelope cost per m²) (T3 cost guidance;
  perimeter cost stated as ~20–30% of total cost, 22–32% for blocks of flats). Honest
  counter-evidence in the same document: shape is legitimately dictated by function, site and
  economics — "schools and hospitals rely on natural lighting and therefore tend to be
  rectangular… hotels are orientated towards the best view" — so the rule is to *price* the
  deviation, not ban it. **cross-checked: the perimeter/area relationship is arithmetic (fact); the
  percentage premiums are single-source T3 rules of thumb, not corroborated by a peer-reviewed study
  in this pass.**
- Source: "The Influence of Design on Building Cost" (ASAQS free resource, T3) — https://cdn.ymaws.com/www.asaqs.co.za/resource/resmgr/4_resources/free_resources/influence_of_design_on_building_cost/the_influence_of_design_on_b.pdf
- Class: HEURISTIC (FACT for the perimeter/area relation)
- Scope: universal (strongest on envelope and structure; weaker for internal partitions)
- Confidence: Medium-High
- Grid translation: report `perimeter_tiles / area_tiles` per floor and per zone; report
  `unique_unit_types / total_units` (repetition index) and `non_orthogonal_doors` /
  `non_orthogonal_walls` counts; flag any floor whose perimeter ratio rises while its programme does
  not. Angle-driven costs (setting out, formwork, cut units, non-standard joinery and furniture) map
  to the non-orthogonal counters.
- Exceptions / failure mode: site constraints, daylight strategy, view optimisation and heritage
  shells justify the premium — the failure is paying it three times (design, tender, change order)
  because nobody priced it once. Symptom: a "simple" curved wall generating shop-drawing RFIs and
  wedge rooms that no standard furniture fits.

### PP-25 Trust measurement over intent: close the POE loop, because almost nobody does

- Rule: Before designing the next floor, re-measure the last one against the predictions you wrote
  down (route crossings, detour ratios, queue minutes, cart travel, effective widths, adjacency
  violations, removal paths). If you cannot measure it, you cannot claim the design worked.
- Evidence: The systemic finding is that data collection exists but the loop does not: a
  peer-reviewed review of POE practice finds online questionnaires (48%), interviews (14%) and paper
  (3%) used to capture occupant views, physical tracking concentrated on thermal/ventilation/acoustic
  /layout complaints, maintenance-focused applications marginal (~2%), and translation of findings
  into new designs "notably rare" — the authors call for structured processes enabling "feed-forward
  of the positive and negative lessons learned into the next building cycle" (T2).
  Practitioner-side statement of the attribution problem: when BOH is squeezed, "no guest ever
  complains about any of it directly. They just experience a hotel that always seems slightly
  behind… and the reviews say 'service' while the cause sits in the floor plan" (T4). Cornell's
  review analysis independently shows satisfaction dominated by service consistency and the room, so
  design causes hide behind operational language (T2). And because benefits drift, measurement must
  repeat: 81% persistence of implemented measures, with one campus retaining "89% of the electric
  savings and 0% of the natural gas savings" (T2, PP-19). **cross-checked: yes — T2 (loop rarely
  closed), T2 (persistence), T2+T4 (attribution problem).**
- Source: IJERPH 2022 POE review (T2) — https://pmc.ncbi.nlm.nih.gov/articles/PMC9607023/; NIST TN 1727 (T2) — https://nvlpubs.nist.gov/nistpubs/TechnicalNotes/NIST.TN.1727.pdf; Before It Opens (T4) — https://beforeitopens.com/articles/back-of-house/; Zhang & Verma, Cornell Hospitality Report (T2) — https://ecommons.cornell.edu/entities/publication/c780fe11-7b4f-4cdd-ba23-b62abc168329
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: High
- Grid translation: every validation check above stores a prediction record
  (`crossings`, `detour_ratio_max`, `effective_width_min`, `queue_tiles_deficit`,
  `removal_path_ok`, `bad_adjacency_tiles`, `party_wall_continuity`); on re-load of a built plan,
  recompute and diff. A degraded metric is a design bug, not an occupant behaviour bug — unless the
  diff shows the route was repurposed, which is itself the PP-13 desire-line signal.
- Exceptions / failure mode: buildings with few respondents, or where the operator changed the use,
  produce misleading POEs. Symptom: a "satisfied" survey from a property whose housekeeping cart
  route quietly moved into the guest corridor.

### PP-26 Don't let the amenity or the gesture carry the plan: the room and the service carry it

- Rule: When a trade-off appears between a feature (lobby gesture, amenity, façade event) and an
  operational basic (room quality, service route, storage, queue capacity), the operational basic
  wins by default and the feature must be justified in writing.
- Evidence: Largest relevant hospitality dataset: analysis of >95,000 reviews across 99 independent
  high-end hotels and resorts found "service and rooms were overwhelmingly the most important
  aspects… while facilities, location, and amenities moved the meter far less"; words appearing
  *only* in low-rated reviews included "bathroom", "front", "desk" and "price"; and the report
  concludes that "despite amenities creep, architectural fads, and numerous brand permutations, the
  core of the hotel business remains creating a positive and memorable stay" by delivering the
  fundamentals — with operational *consistency* (not the occasional "wow") predicting higher overall
  scores (T2). Corroborating practitioner statements: prioritising "aesthetic ambition over
  feasibility and commercial strategy" is listed as a top planning mistake (T3); WATG reports the
  overlooked basics are storage, staff facilities and clean/dirty routes (T3). **cross-checked:
  yes — T2 + two independent T3.**
- Source: Zhang & Verma, "What Matters Most to Your Guests: An Exploratory Study of Online Reviews", Cornell Hospitality Report 17(4) (T2) — https://ecommons.cornell.edu/entities/publication/c780fe11-7b4f-4cdd-ba23-b62abc168329; Hotel Development Guide (T3) — https://hoteldevelopmentguide.com/architectural-planning/; WATG (T3) — https://www.watg.com/back-of-house-design-how-architecture-shapes-luxury-service/
- Class: DESIGN PRINCIPLE
- Scope: hospitality, commercial, civic (weaker in healthcare, where the "gesture" can itself be a
  therapeutic programme requirement)
- Confidence: High for hospitality, Medium elsewhere
- Grid translation: rank candidate tiles by guest-visible score only after every hard check
  (PP-01…PP-22) passes; if a feature is created by deleting a service room, a passing bay or a
  removal path, emit a `feature_over_operation` decision that must be explicitly accepted.
- Exceptions / failure mode: in destination/flagship properties the gesture *is* the business model
  and operators knowingly fund a worse back-of-house — then state the operating penalty (payroll,
  turnaround time) instead of pretending the plan is equally good.

---

## Consensus map

Topic → number of independent sources actually read for this file → strongest supporting tier
present.

| Topic | Independent sources | Strongest tier | Verdict |
|---|---|---|---|
| Clean vs dirty / service stream separation | 5 (HBN 00-09, HBN 04-01, WATG, Before It Opens, kitchen reference) | T1 | Settled; crossing-count test corroborated by four professions |
| Back-of-house under-programmed | 4 (WATG, Before It Opens, Hotel Dev Guide, HBN 04-01) | T1 | Settled as a pattern; no reliable % ratio exists in this evidence |
| Housekeeping / linen logistics | 4 (HBN 04-01, Before It Opens, TUMI, Loomis laundry file) | T1 *title only — text not verified* | Single-source and unverifiable at the stated threshold: "≤15 beds" is the guidance's own "ideally" wording, not a limit (see PP-03 Confidence); the per-floor pantry, 5-par linen and 13–14 rooms/shift are T3/T4 practice and stand as direction |
| Service vs guest vertical circulation | 4 (T3 ×2, T4, T1) | T1 (principle) | Principle settled; lift counts not evidenced |
| Waste routes / chute failure | 3 (WATG, metroSTOR + council data, HBN 00-09) | T1 | Medium-High; the chute-decommission trend is T4-only |
| Staff routes & welfare | 3 (WATG, Before It Opens, AH&LA via vendor) | T3 | Medium — geometry claims converge, retention causality unproven |
| Kitchen / food flow adjacency | 3 (kitchen reference, WATG, HBN) | T1 (via codes quoted in T3) | Strong on flow/aisles; medium on area ratios |
| FOH queues / group check-in | 4 (TUMI, ScanQueue, Cornell CHR, Hotel Dev Guide) | T2 | Real that check-in friction costs satisfaction; vendor percentages unusable |
| Banquet turnaround | 2 (Before It Opens, WATG) | T3 | Weakest hospitality entry: mechanism, no measurement |
| Circulation that works on paper | 3 (Helbing via UW News, Access Board, angled-corridor thesis) | T1 (routes must match real movement); **T3-only for the 20–30% number, and it did not reproduce on re-read** | Strong direction; the threshold is a tuneable screening band, not a number to assert (PP-13) |
| Doors, swings, clearances fighting | 4 (Access Board ×2, HBN 04-01, RoomSketch3D) | T1 | Settled — the arithmetic is code text |
| Corridor-width illusion / passing | 4 (Access Board, Alhawsawi T2, angled-corridor T2, CBE T2) | T1 + T2 | Settled, with numbers |
| Acoustic complaints (#1 post-occupancy?) | 4 (CBE/Buildings&Cities, POE review, Cornell CHR, flanking T3) | T2 | Survives only for workplaces, and only for *speech*, not services |
| Party-wall continuity / flanking | 2 (flanking T3 field test, NCC-derived requirements quoted in T3) | T1 (as quoted) + T3 | Medium-High; single field dataset |
| Privacy (visual + acoustic) | 4 (HBN 04-01, Life of an Architect, CBE, ADA recess rules) | T1 | Strong and convergent |
| MEP clashes / late coordination | 5 (CCC, natlmep, OpenSpace/CII/PlanGrid, NIST, Hotel Dev Guide) | T2 | Strong direction; individual multipliers single-sourced |
| Risers / chases / wet stacks | 4 (natlmep, CCC, Studio Matrx + NBC/IS, HBN 04-01) | T1 (standards) + T3/T4 | Settled |
| Ceiling-height / service-zone loss | 2 (CCC, Hotel Dev Guide) | T3 | Medium; height is unmodellable — plan proxy only |
| Maintenance access / removal paths | 3 (natlmep, CCC, Mills-via-NIST) + 1 T5 title | T2 | Strong; three professions converge |
| Commissioning failures / persistence | 2 (NIST TN 1727 incl. Mills; POE review) | T2 | Strong |
| Wayfinding | 3 (PMC wayfinding QI, HBN, Access Board) | T2 | Medium-Strong; one dominant dataset |
| ADA / litigation triggers | 4 (Access Board ×2, Bureau Veritas, Seyfarth-via-aggregator) | T1 | Strong barrier inventory; litigation mix is T3 data |
| Kitchen/laundry adjacency | 3 (kitchen reference, WATG, Loomis) | T1/T3 | Medium-Strong |
| Hospital sightlines / isolation | 2 (HBN 04-01, HBN 00-09 + ICU T2) | T1 | Provisions settled; performance claims are not |
| Late change / revision churn | 6 (OpenSpace/CII, CCC, NIST/LBNL, HBN, Fresh Projects, Hotel Dev Guide) | T2 for the direction only | Strong direction; **the statistics behind it are figure NOT confirmed at source - do not quote** (PP-23 re-read returned different values; the 10–50× is an uncited memo assertion). The source count is a count of pages read, not of confirmations |
| Non-standard geometry cost | 2 (ASAQS cost guide + perimeter arithmetic) | T3 | Medium; percentages not peer-reviewed |
| POE feedback loop | 3 (POE review, Cornell CHR, NIST persistence) | T2 | Strong: the loop is rarely closed |
| Amenity/gesture vs fundamentals | 3 (Cornell CHR, Hotel Dev Guide, WATG) | T2 | Strong for hospitality |
| Hotel turndown, bell desk, key-card workflow | thin — see Weak or contested | T4 | Not evidenced in this pass |

## Claims that did NOT survive cross-checking

1. **"Noise is the number-one post-occupancy complaint."** Half-true and badly framed. In the
   largest dataset that can support it — CBE occupant surveys, 62,360 respondents in 617 office
   buildings — acoustics is the most common *named source of dissatisfaction* (54%), ahead of
   temperature (38%) and visual privacy (28%) (T2). But a separate T2 POE review across
   multi-building databases ranks spatial layout/functional performance (82%) and thermal comfort
   (85%) above acoustic noise (62%). And the office data identify the cause as **other people
   talking, speech privacy and phones**, not plant noise or outdoor sound — the opposite of the
   design response the popular claim implies (specify a better ceiling).
2. **"Single patient rooms / decentralised nurse stations improve observation and outcomes."**
   Official guidance refuses the heroic version: HBN 04-01 records that "some clinicians may feel
   that single-bed rooms make observation more difficult, whereas others find that engagement with
   patients improves", and treats observation as something geometry, glazing and technology must
   restore — not something a ward type delivers (T1). No T2 source in this pass demonstrated an
   outcome benefit from station layout; the widely cited CADRE "centralised vs decentralised"
   evidence list could not be retrieved (403). So: **unsupported, not disproven** — which still kills
   it as a design rule.
3. **"BIM clash detection removes coordination risk."** The tool-side claim found here ("BIM
   coordination costs $2–5/m²… saves 5–10% of construction cost") is an uncited engineering-memo
   assertion (T3), and the industry data cut against it as a *sufficiency* claim: roughly half of
   rework is attributed to information and communication failures rather than geometric clashes, with
   rework running to a few percent of project cost and no improving trend (T3 citing CII,
   PlanGrid/FMI). **This item's own figures are now disowned too:** the specific "48%", the "2–20%"
   range and the dollar totals are figure NOT confirmed at source - do not quote (a re-read of the
   same page returned different values; see PP-23). Defensible version: clash detection pays because
   of the **detection window** — late detection costs far more than early detection, with the memo's
   10–50× multiple an uncited assertion rather than measured data (T3) — not because a model makes a
   plan correct.
4. **"Design to the WHO hospital noise limits."** Measured reality: five UK ICUs averaged LAeq above
   45 dBA at all times and 52–59 dBA for more than half of the time, with peaks above 85 dBA up to 16
   times per hour overnight, against a WHO recommendation of 35 dBA LAeq / 40 dBA LAmax. The study's
   own conclusion: the recommended level "is so low it is not achievable in an ICU" — 34.1 dBA was
   reached only in an empty side room with every machine switched off (T2). A brief that adopts WHO
   numbers as an acceptance criterion is designed to fail its own measurement day.
5. **"Field sound insulation will match the lab rating (STC/Rw), so specifying the assembly is
   enough."** Undercut by T3 field work: laboratory ratings are measured "without typical flanking
   paths present", and treating one junction (the façade mullion at the party wall) moved measured
   DnT,w from 40 to 51 in the same rooms. Specification does not survive unaligned partitions,
   slab-to-façade gaps, and service/outlet penetrations. This is why PP-16 includes a continuity
   check rather than a materials note.
6. **"70% of guests say check-in wait is the biggest factor" / "a 5-minute wait costs 15% of the
   score."** These circulate from a queue-software vendor blog attributing them to "a Cornell
   Hospitality Research study", "J.D. Power's 2025 North America Hotel Guest Satisfaction Study" and
   "ReviewPro 2024, 10 million reviews" (T4). The actual Cornell study was retrieved: it states no
   such wait-time percentage — it lists "front desk, ease of check-in, concierge bell desk" among
   many rated drivers, and its traceable findings are about service/room dominance and the words
   appearing in low-rated reviews. Keep the qualitative point, discard the numbers.
7. **"The work triangle organises kitchen layout" and "a bigger kitchen works better."** Both named
   as misconceptions by a design reference with standards citations: no standards body (NSF, NFPA,
   FDA Food Code) references the work triangle for commercial kitchens, and oversized kitchens
   "increase walk distances, reduce communication efficiency between stations, and raise energy
   costs", with guidance tying area to meal counts rather than maximising it (T3). The residential
   work triangle is a *residential* heuristic — do not let it into a generic rule.
8. **"ADA exposure comes mostly from narrow corridors and tight clearances."** The documented
   barrier inventory places accessible **pavement slope** first among exterior barriers, then missing
   van spaces, signage, non-level maneuvering clearances, door force, protruding objects and
   post-CO items added into routes; restrooms are high-risk because of element density, not width
   (T3, consistent with T1). And federal Title III casework is now ~36% digital (T3 aggregation), so
   a geometry-first model of ADA risk is out of date.
9. **"A strong amenity package or an architectural statement drives guest satisfaction."** Undercut
   by the largest hospitality dataset here (T2): facilities, location and amenities "moved the meter
   far less" than service and the room, and *consistency* predicted overall rating better than the
   occasional "wow". Design implication: features are not a hedge against a bad plan.
10. **"Refuse chutes are a service upgrade."** Institutional evidence points the other way in
    refurbishment: blockages (one borough: £75,000 to unblock 225 chutes in a year), odour, fire
    loading from build-up, anti-social behaviour at chute rooms, and incompatibility with recycling;
    several London boroughs decommissioned chutes for external secured bin stores and reported
    recycling up 2.5% and waste tonnage down 7.2% (T4 vendor reporting council data; direction
    consistent with WATG's "size refuse to the collection regime", T3). A chute is a lifetime
    commitment, not a feature.

## Sources

Consolidated list of everything actually retrieved and read for this file, by tier. (Inline
`Source:` lines above show which entry used which.)

**T1 — codes, standards, regulator and official design guidance**

- US Access Board, *ADA/ABA Accessibility Guides*, Chapter 4:
  Entrances, Doors, and Gates — https://www.access-board.gov/ada/guides/chapter-4-entrances-doors-and-gates/
- Access Board, *ADA/ABA Accessibility Guides*, Chapter 4: Accessible Routes —
  https://www.access-board.gov/ada/guides/chapter-4-accessible-routes/
- NHS England, *Health Building Note 04-01: Adult in-patient facilities* —
  https://www.england.nhs.uk/wp-content/uploads/2009/12/HBN_04-01_Final.pdf
- NHS England, *Health Building Note 00-09: Infection control in the built environment* —
  https://www.england.nhs.uk/wp-content/uploads/2021/05/HBN_00-09_infection_control.pdf

**T2 — peer-reviewed, university, national-laboratory**

- Graham et al., "Common sources of occupant dissatisfaction with workspace environments in 600
  office buildings", *Buildings & Cities* (CBE Occupant Survey dataset: 62,360 respondents / 617
  buildings) — https://journal-buildingscities.org/articles/10.5334/bc.274
- "Post-Occupancy Evaluation's (POE) Applications for Improving Indoor Environment Quality",
  *Int. J. Environ. Res. Public Health* 2022 (PMC9607023) —
  https://pmc.ncbi.nlm.nih.gov/articles/PMC9607023/
- Darbyshire & Young, "An investigation of sound levels on intensive care units with reference to
  the WHO guidelines", *Critical Care* 18(5) R187 (PMC4056361) —
  https://pmc.ncbi.nlm.nih.gov/articles/PMC4056361/ (also https://doi.org/10.1186/cc12870)
- "Implementation of Wayfinding Signage in Public Hospitals and Its Evaluation Towards Quality
  Improvement" (PMC11345034) — https://pmc.ncbi.nlm.nih.gov/articles/PMC11345034/
- Zhang & Verma, "What Matters Most to Your Guests: An Exploratory Study of Online Reviews",
  *Cornell Hospitality Report* 17(4), Center for Hospitality Research, 2017 —
  https://ecommons.cornell.edu/entities/publication/c780fe11-7b4f-4cdd-ba23-b62abc168329
- NIST Technical Note 1727 (IEA Annex 47 Subtask C), "Commissioning Cost-Benefit and Persistence of
  Savings" — https://nvlpubs.nist.gov/nistpubs/TechnicalNotes/NIST.TN.1727.pdf (contains the
  summary of Mills et al. 2004, LBNL: one-third of major commissioning problems originating in
  design)
- Alhawsawi, Sarvi, Felemban, Rajabifard & Wang, "Understanding the Characteristics of Pedestrians
  when Passing Obstacles of Different Sizes: An Experimental Study", *Collective Dynamics* 6:1–23 —
  https://collective-dynamics.eu/index.php/cod/article/view/A114
- "Analysis of Walking Velocity of Pedestrian Walking Through Angled-Corridor Based on Spatial
  Trajectories – A Bidirectional Scenario" (postgraduate thesis, Universiti Sains Malaysia
  eprints) — http://eprints.usm.my/56981/

**T3 — professional publications, consultancy, engineering memoranda**

- WATG (Nicole Hammond), "Back-of-House Design: How Architecture Shapes Luxury Service" —
  https://www.watg.com/back-of-house-design-how-architecture-shapes-luxury-service/
- CCC Engineering, "Coordination of Services in Ceiling Voids" (design memo; cites AS/NZS 3000,
  AS/NZS 2785, AS 1851, NCC Spec 13) —
  https://cccengineering.com.au/design-memos/services-coordination-ceiling-voids/
- Bureau Veritas North America, "The 8 Top ADA Violations and How to Avoid Them" —
  https://www.bvna.com/magazine/8-top-ada-violations-and-how-avoid-them
- Kitchen Management Authority, "Commercial Kitchen Layout and Design Principles" (cites IBC, IMC,
  NFPA 96, FDA Food Code, NSF/ANSI 2, ADA, FGI Guidelines) —
  https://kitchenmanagementauthority.com/commercial-kitchen-layout-and-design/
- Hotel Development Guide, "Architectural Planning" —
  https://hoteldevelopmentguide.com/architectural-planning/
- "The Influence of Design on Building Cost" (ASAQS free resource) —
  https://cdn.ymaws.com/www.asaqs.co.za/resource/resmgr/4_resources/free_resources/influence_of_design_on_building_cost/the_influence_of_design_on_b.pdf
- OpenSpace, "How much does rework cost in construction? Data & framework" (reports CII Field
  Rework Index, PlanGrid/FMI 2018, Love 2002) —
  https://www.openspace.ai/blog/cost-of-rework-in-construction/
- Loomis Bros. (Pellerin Milnor), "Hotel/Motel Laundry Plant Design" consulting file —
  https://www.loomisbros.com/cmss_files/attachmentlibrary/Consulting%20%26%20Design%20PDFs/Hotel%20%26%20Motel%20Laundry%20Plant%20Design.pdf
- "Flanking sound transmission in residential dwellings through façade" (acoustic consultant
  article with field test data) —
  https://wfmmedia.com/flanking-sound-transmission-between-adjacent-dwelling-units-through-the-facade/
- UW–Madison News, "Desire paths: the unofficial footpaths that frustrate, captivate campus
  planners" (reports a Helbing detour-threshold finding; the 20–30% wording did not reproduce on
  re-read - see PP-13 and *Weak or contested*) —
  https://news.wisc.edu/desire-paths-the-unofficial-footpaths-that-frustrate-captivate-campus-planners/
- Be Accessible, "ADA Lawsuit Statistics by Year, Industry, and State" (aggregates Seyfarth Shaw
  and UsableNet data) — https://beaccessible.com/post/americans-with-disabilities-act-statistics/

**T4 — practitioner community, tool and vendor documentation (weight of a well-informed anecdote)**

- Hotel Desk / Before It Opens, "Back of House: The Half of the Hotel Guests Never See" —
  https://beforeitopens.com/articles/back-of-house/
- TUMI Hospitality, "How to Staff a Hotel: A Department-by-Department Guide" —
  https://tumihospitality.com/how-to-staff-a-hotel/
- National MEP Engineers, "Optimal Placement of Plant Rooms, Riser Shafts, and Equipment for Easy
  Maintenance" —
  https://www.natlmep.com/optimal-placement-of-plant-rooms-riser-shafts-and-equipment-for-easy-maintenance/
- Studio Matrx, "Plumbing-Efficient Bathroom Layout: Single Wet Wall, Back-to-Back & Stacked
  Bathrooms" (cites NBC 2016 Part 9, IS 1172, IS 5329) —
  https://www.studiomatrx.org/guides/plumbing-efficient-bathroom-layout-india
- metroSTOR, "Decommissioning Refuse Chutes in High-rise Buildings" (reports London Borough
  of Hackney/Hounslow/Tower Hamlets outcomes; vendor-interested) —
  https://metrostor.uk/decommissioning-refuse-chutes-in-high-rise-buildings/
- Life of an Architect (working-architect blog), "Toilets by the Front Door" —
  https://www.lifeofanarchitect.com/toilets-by-the-front-door/
- RoomSketch3D help, "Door Clearance: How Much Space a Door Really Needs" —
  https://roomsketch3d.com/help/wall-fixtures/door-clearance
- Fresh Projects, "An Architect's Guide to Managing Scope Creep" —
  https://www.gofreshprojects.com/blog/architects-guide-managing-scope-creep
- ScanQueue, "Hotel Queue Management: How to Reduce Lobby Wait Times" (used for peak-window and
  queue-type mechanics only; its cited statistics failed verification) —
  https://scanqueue.com/blog/hotel-lobby-queue-management

**T5 — forum/Reddit (existence of topic only; content not retrievable — see Method)**

- r/architecture, "What would be the worst mistakes you've ever done while working…" —
  https://www.reddit.com/r/architecture/comments/1755sho/ (not read)
- r/hvacadvice, "Air handler access panel blocked" —
  https://www.reddit.com/r/hvacadvice/comments/1joqjcq/ (not read)

## Weak or contested

- **Banquet turnaround and the event-room revenue ceiling (PP-09)** — narrative mechanism only, two
  practitioner sources, no measured turnaround study located. Medium confidence at best.
- **Housekeeping 13–14 rooms per attendant shift (PP-03)** — one industry-staffing site; consistent
  with operator practice, no standard cited. Used as a design driver, not a rule; brand standards
  vary (12–18 seen in general literature, unverified here).
- **The "≤15 beds" soiled-utility catchment (PP-03, PP-20)** — the HBN 04-01 PDF could not be opened
  on re-read, so the paragraph (and the "two dirty utilities per 24-bed ward" schedule attributed to
  §4.69) is unverified at the cited URL; the wording as quoted is "ideally", i.e. a recommendation.
  PP-03 and PP-20 now carry this in their own Confidence lines and the grid check is a flag, not an
  assert. Do not restore the assert on the strength of the "T1" label alone.
- **"Open-plan doubles complaints" (PP-16)** — a real T2 finding, but it is an odds ratio for
  workspace dissatisfaction in **offices** (CBE database is 83% US offices). It does not transfer
  cleanly to hospitals, schools or housing; do not use it as a universal acoustics claim.
- **All dollar-per-square-metre figures in PP-18 and PP-19** — one Australian engineering memo,
  unaudited; direction only, never a budget input.
- **The PP-23 rework statistics and the 10–50× multiple** — the CII range, the PlanGrid/FMI dollar
  total and percentages, the derived "48%" and Love's 52% are figure NOT confirmed at source - do not
  quote: a second read of the cited page returned different values for each, and no primary (CII,
  PlanGrid/FMI 2018, Love 2002) was retrieved. The "coordination clashes found on site cost 10 to 50
  times more" line is verbatim in the CCC Engineering memo but the memo gives no source for it. PP-23
  now states the qualitative direction only and grades its own Confidence Low on every multiplier.
- **The "door width + 36 in hallway" formulation (PP-11, PP-14)** — tool documentation (T4), an
  interpretation of the accessible-route and doors-in-series rules, not code text.
- **Desire-path 20–30% detour threshold (PP-13)** — attributed to Helbing in a university news
  article (T3 reporting T2); the primary publication was not retrieved, and the quoted sentence did
  not reproduce on a later read of the same article (which stated a 10 percent figure instead).
  Screening heuristic only: PP-13's headline, Rule and Grid translation now say the ratio is a
  tuneable knob, not a sourced threshold, and its Confidence is Low on the number.
- **"Lift count from peak-occupancy modelling, not symmetry" (PP-04, PP-08)** — correct in principle,
  but no traffic-analysis source was retrieved; a real vertical-transport study sits above what this
  file evidences.
- **BOH as a share of GFA** — asserted as "surprising" repeatedly and never quantified by any source
  I could read. **There is no defensible percentage in this research; do not invent one in
  SKILL.md.**
- **Hotel turndown, bell desk, key-card/FOH workflow, group check-in mechanics** — thin. What
  survived: front desk and ease of check-in are rated drivers and appear in low-score reviews (T2);
  transaction-minute arithmetic and the 3–5 pm peak window (T4 ×2); door-swing/push-plate and
  service-route practice (T3). Turndown produced no usable source at any tier (results were
  hospitality-student material and vendor pages; the academia.edu "Common mistakes in hotel
  planning, development and operation" item and Scribd hotel-programming documents were not
  retrievable). Do not let "turndown" into the rule set on this evidence.
- **Sources I could not read (recorded so they are not re-cited as if they were evidence):** MDPI
  Buildings 2021, "Organisational Justice Analysis of Facility Managers' Responses to User's
  Post-Occupancy Feedback" (403 — would have been the best complaint-category dataset); Health
  Design, "Costs and effects of ineffective wayfinding in US hospitals" (403); CADRE evidence list
  on nursing stations (403); Teesside, "Cost-benefit analysis of BIM-enabled design clash
  detection" (403); gofoodservice commercial kitchen guide (403); all Reddit thread bodies and
  Autodesk Community threads (403 / anti-bot); Houzz discussions (403); scispace-hosted "Effect of
  Changes in Layout Shape on Unit Construction Cost" (empty response).
- **Do not cite "Architecture Stack Exchange"** — it does not exist in the Stack Exchange network
  (`architecture.stackexchange.com` → site-not-found; absent from the API site list). Community Q&A
  here means `diy.stackexchange.com` / `engineering.stackexchange.com`, which are homeowner /
  one-off-build oriented and therefore weak for commercial practice.

## Type-specificity audit

Which rules genuinely generalise across building types on this grid, and which are hospitality or
healthcare conventions wearing a universal costume.

| Entry | Really universal? | Notes on transfer |
|---|---|---|
| PP-01 clean/dirty crossings | Yes | Independently present in hospital (T1), kitchen (T1/T3) and hotel (T3) literature; also school meals, industrial change rooms |
| PP-02 BOH first | Type-dependent | Strongest in staff-served types (hotel, hospital, serviced office); weak in pure residential and small retail |
| PP-03 housekeeping catchment | Hospitality + healthcare | In residential it becomes "storage and laundry per unit"; the ~15-bed recommended catchment does not transfer (and is a recommendation, not a cap) |
| PP-04 separate vertical portal | Scales with height and staffing | In low-rise, one portal plus time windows is fine; do not demand two lifts for a 4-storey walk-up |
| PP-05 waste route | Yes (any building producing refuse) | Chute specifics only matter above ~4 storeys; the dedicated waste room rule transfers everywhere |
| PP-06 staff day | Staffed types only | Retail, school, hospital, hotel. Irrelevant to a single-dwelling plan |
| PP-07 kitchen flow | Yes wherever food is served | Domestic kitchens want the *opposite* heuristic (work triangle) — different rule, do not cross-contaminate |
| PP-08 queue sizing | Yes (any service counter) | Healthcare registration, civic counters, retail checkouts transfer; transaction minutes must be re-derived per use |
| PP-09 banquet turnaround | Hospitality (and assembly) | Transfers to school halls and gym changeovers; nothing to do with ward or office planning |
| PP-10 effective width | Yes | Code + measurement + field findings are all universal |
| PP-11 1/2/3-tile semantics | Yes | But passing-bay spacing (200 ft) is a US accessible-route number; EU/UK equivalents differ |
| PP-12 bends cost flow | Yes, egress-weighted | Critical in assembly/healthcare/detention; mostly cosmetic in a 6-unit residential floor |
| PP-13 desire-line test | Yes | Stronger outdoors/site planning; inside a dwelling the "penalty" may be privacy, which wins |
| PP-14 door reservations | Yes | Universal geometry + code; only the "wider doors for bed turning" clause is ward-specific |
| PP-15 no sightline into private doors | Yes | Motive differs (dignity in hospitals, hospitality at home, discretion in offices); the check is identical |
| PP-16 sound as adjacency + continuity | Yes | Evidence base is offices + multifamily + hospitals; the *mechanism* generalises, dB does not (unmodellable) |
| PP-17 stack alignment | Yes | Absolute in any water-using building; the 1.5–2 m slope budget is a warm-climate/PVC figure, and ventilated/cast-iron systems differ |
| PP-18 service band / height | Yes, magnitude varies | Offices/labs/hospitals need 600–1,000 mm; a domestic bathroom needs a fraction — "the band must exist" transfers, its size does not |
| PP-19 removal path + verification | Yes | Universally under-specified; equipment scale changes the numbers, not the check |
| PP-20 observation vs isolation | Healthcare-specific | Do not apply the ward observation proxy to hotel corridors or open-plan offices |
| PP-21 wayfinding | Yes, stakes vary | Life-critical in hospitals, commercial in malls, negligible in a 12-unit block |
| PP-22 accessibility erosion | Yes (jurisdiction-specific numbers) | Ship the *check*, never the inch values, outside a US context |
| PP-23 late-change discipline | Yes (process, not geometry) | Universal; the multipliers are not |
| PP-24 geometry premium | Yes for envelope, weaker for partitions | Internal non-orthogonality costs joinery and furniture fit, not excavation — different mechanism, same warning |
| PP-25 POE loop | Yes | Type-independent; the instruments differ per type |
| PP-26 basics beat gesture | Hospitality-strongest | In civic/museum/education work the gesture is often an explicit programme requirement; the rule becomes "price the operational cost of the gesture", not "no gesture" |

**Two host-project cautions for the SKILL.md author.** (1) The host grid has no section, no
materials and no heights, so PP-16, PP-17 and PP-18 are *adjacency heuristics only* — they must ship
with the proxy flag or the agent will believe it has solved acoustics, drainage and services.
(2) `door` tiles carry no swing, leaf or clearance semantics, so PP-11 and PP-14 cannot be enforced
as written unless the validator adds a per-door swing reservation; otherwise the grid silently
permits the single most commonly reported complaint in this research — a door opening into the space
something else needs.
