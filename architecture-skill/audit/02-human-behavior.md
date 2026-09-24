# Audit 02 — `architecture-skill/research/human-behavior.md` (adversarial source verification)

Method: every quantitative/empirical claim extracted verbatim with its rule id, then checked against the
source actually opened. Verdicts start `pending` and are edited in as verification lands.
File audited: `architecture-skill/research/human-behavior.md` (HB-01…HB-26, 26 rules).
Not edited: nothing in the audited file was changed by this audit.

Legend — EVIDENCE STATUS: SUPPORTED | PARTIALLY SUPPORTED | INFERRED | UNSUPPORTED | CONTRADICTED | UNVERIFIED
PROBLEM types: none / source-claim mismatch / stronger than evidence / figure not in cited table /
tier inflation / single source presented as corroboration / cannot verify / fabricated-lookalike.

---

## A. Derived grid arithmetic (checked by computation, not by source)

| # | Claim | Status | Verdict |
|---|---|---|---|
| A-01 | "1 tile = 0.5 m; 1 tile area = 0.25 m²; 4 tiles = 1 m²; tiles per person = (m² per person) × 4" | pending | pending |
| A-02 | HB-01 tile bands: A ≥ 48, B 15–48, C 9–15, D 5.6–8.8, E 2.4–5.6, F ≤ 2.4 tiles/person (from 12/3.7/2.2/1.4/0.6 m²) | pending | pending |
| A-03 | Queue LOS A 1.21 m² → 4.8 tiles; capacity 0.19 m² → 0.76 tiles; 6 ft² = 0.56 m²; 2 ft² = 0.19 m² | pending | pending |
| A-04 | HB-02: 1.3 p/(m·s) × 0.5 m = 0.65 p/s = 39 p/min per tile; 2-tile door = 78 p/min; 1.1 → 33; 0.88 → 26 | pending | pending |
| A-05 | HB-03: 0.5 p/m² = 8 tiles/person; 1 tile/person = 0.25 m² = 4 p/m²; 3.5 p/m² ≈ 0.29 m² ≈ 1.14 tiles | pending | pending |
| A-06 | HB-11: 3 ft² = 0.28 m² = 1.12 tiles; 760 × 1220 mm = 1.5 × 2.4 tiles | pending | pending |
| A-07 | HB-15: 8 ft bed centres = 4.9 tiles → assert ≥ 5; 12 m = 24 tiles | pending | pending |
| A-08 | Free flow 1.2 m/s = 2.4 tiles/s; 1.07 m/s ≈ 2.1 tiles/s; 20×20 tile square = 28.3 octile steps vs 40 Manhattan (1.41×) | pending | pending |
| A-09 | HB-12/HB-22 activity table: seated 12 tiles = 3 m², lounge 6 = 1.5, standing 3 = 0.75, dense 2 = 0.5 m² | pending | pending |
| A-10 | HB-17 proxemics: 0.46 m ≈ 1 tile, 1.2 m ≈ 2.4 tiles, 3.7 m ≈ 7.4 tiles | pending | pending |
| A-11 | HB-20 "2 tiles wide per person abreast" from 1.0–1.2 m; `lateral_tiles_per_person = ceil(1.0/0.5) = 2`, "2.4 → 3" | pending | pending |
| A-12 | HB-11 `lobby_waiting_tiles ≥ ceil(0.25 × load) × 1.12` | pending | pending |

---

## B. Per-claim register

### HB-01 — LOS bands (most load-bearing figure set in the file)
- **C-01** CLAIM: "current HCM walkway LOS by pedestrian space — A ≥ 12 m²/ped, B 3.7–12, C 2.2–3.7, D 1.4–2.2, E 0.6–1.4, F ≤ 0.6 m²/ped, with walkway capacity defined at 6 ft²/ped ≈ 0.56 m²/ped".
  SOURCE: FHWA *Capacity Analysis of Pedestrian and Bicycle Facilities* (FHWA-PD-98-001) §3 — https://www.fhwa.dot.gov/publications/research/safety/pedbike/98107/section3.cfm — T1.
  WHAT SOURCE SAYS: pending | PROBLEM: pending (check: which table, HCM 3rd/2000 vintage, ft² originals, does the *report* label them "current HCM"?) | STATUS: pending | ACTION: pending
- **C-02** CLAIM: "a recommended revision gives A ≥ 5.6, B 3.7–5.6, C 2.2–3.7, D 1.4–2.2, E 0.75–1.4, F ≤ 0.75 m²/ped".
  SOURCE: same FHWA §3 — T1. | WHAT: pending | PROBLEM: pending (is this the report's own recommendation table, and is "recommended" attributed correctly?) | STATUS: pending | ACTION: pending
- **C-03** CLAIM: "Separate bands for terminals (A+ ≥ 2.3 m²/ped, F ≤ 0.7)".
  SOURCE: same — T1. | WHAT: pending | PROBLEM: pending | STATUS: pending | ACTION: pending
- **C-04** CLAIM: "queuing (LOS A ≥ 1.21 m²/ped, F < 0.19 m²/ped, capacity 2 ft²/ped ≈ 0.19 m²/ped)"; HB-10/HB-20 cite "Table 21".
  SOURCE: FHWA §3 (Table 21 named in HB-10) — T1. | WHAT: pending | PROBLEM: pending (table number) | STATUS: pending | ACTION: pending

### HB-02 — flow per unit width
- **C-05** CLAIM: "MSC.1/Circ.1238, Annex 1 Table 1.2, give maximum mass-flow rates per unit width: corridors and doors 1.3 persons/(m·s), stairs down 1.1, stairs up 0.88".
  SOURCE: IMO MSC.1/Circ.1238 as published at https://puc.overheid.nl/doc/PUC_1952_14/ — T1.
  WHAT: pending | PROBLEM: pending (does the guideline apply these to *ship* corridors/decks/stairs — and does the file's extension to building doors/lobbies get stated?) | STATUS: pending | ACTION: pending
- **C-06** CLAIM: "platoon flow reaches 59 ped/min/m at LOS F and terminals are held to ≤ 37 ped/min/m at LOS A+; crossflow cases are tabulated at 75 ped/min/m at LOS E" (FHWA Tables 6, 8, 10).
  SOURCE: FHWA §3 — T1. | WHAT: pending | PROBLEM: pending (figure-in-cited-table check; LOS-column alignment) | STATUS: pending | ACTION: pending
- **C-07** CLAIM: "The agreement of an IMO evacuation figure (78/min/m) with the upper empirical pedestrian observations (59–75/min/m) is why this rule caps design flow below the code maximum."
  SOURCE: same two — T1+T1. | WHAT: pending | PROBLEM: pending (the rule uses 39 p/min/tile = 78 p/min/m, i.e. it does *not* cap below the code maximum; internal contradiction) | STATUS: pending | ACTION: pending

### HB-03 — density knee
- **C-08** CLAIM: "MSC.1/Circ.1238 Annex 1 Table 1.1 makes speed a function of density: free speed ≈ 1.2 m/s up to about 0.5 p/m², degrading monotonically and approaching zero around 3.2–3.5 p/m² (extracted: 1.2 m/s at D = 0 and 0.5, 0.20 m/s at D = 3.2, 0.10 m/s at D = 3.5)".
  SOURCE: puc.overheid.nl MSC.1/Circ.1238 — T1. | WHAT: pending | PROBLEM: pending | STATUS: pending | ACTION: pending
- **C-09** CLAIM: "A separate pedestrian-dynamics study fixes the practical ceiling … at ≤ 0.16 p/m² (≈ 6 m²/ped)".
  SOURCE: "Estimating density limits for walking pedestrians keeping a safe distance", Sci Rep — PMC7810874 — T2. | WHAT: pending | PROBLEM: pending | STATUS: pending | ACTION: pending
- **C-10** CLAIM: "Empirical crowd work reports stress markers rising with speed and with density, and measured mean walking speed in 1.5 m corridors at 1.07 m/s with local densities reaching 3 p/m² at bends".
  SOURCE: PMC10442413 — T2; PLOS ONE bend study — T2. | WHAT: pending | PROBLEM: pending (the 1.07 m/s figure: is it the bend study's own measured mean, or another experiment?) | STATUS: pending | ACTION: pending

### HB-04 — single file
- **C-11** CLAIM: "space per pedestrian below ~0.6 m² marks the loss of free flow (FHWA Section 3)".
  SOURCE: FHWA §3 — T1. | WHAT: pending | PROBLEM: pending | STATUS: pending | ACTION: pending
- **C-12** CLAIM: "a single wheelchair user needs 30 × 48 in (760 × 1220 mm) of clear floor".
  SOURCE: 2010 ADA Standards §305.3 — https://www.access-board.gov/ada/chapter/ch03/ — T1. | WHAT: pending | PROBLEM: pending (ADA figure is a *wheelchair* clear-floor minimum, used as a general static-body envelope; also 1220 mm is the 48 in side — orientation of the tile mapping 1.5 × 2.5) | STATUS: pending | ACTION: pending
- **C-13** CLAIM: passing bay every ≤ 12 tiles (6 m); `expected_conflict_delay = conflicts × 6 s`.
  SOURCE: labelled HEURISTIC / ENGINEERING by the file itself. | WHAT: n/a | PROBLEM: none if labels hold | STATUS: pending | ACTION: pending

### HB-05 — bends
- **C-14** CLAIM: "speeds are significantly different across the space within the bend for every angle except 0°"; "average walking speeds significantly lower near the inner corner than the outer corner"; "densities higher in the vicinity of the bend than at the corridor start and end (peaking near 3 p/m²)"; "shockwaves and stop-and-go 'turbulent' conditions appear near inner corners"; quote "instead of one sharp (or larger) turning angle a series of smaller angles could be placed when designing corners"; "no significant speed difference between 135° and 180°".
  SOURCE: PLOS ONE 17(3):e0264635, 2022 — https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0264635 / PMC8893709 — T2.
  WHAT: pending | PROBLEM: pending (esp. "except 0°", the 135/180 null, and whether the recommendation quote is verbatim) | STATUS: pending | ACTION: pending

### HB-06 / HB-07 — wayfinding
- **C-15** CLAIM: "higher interconnection density (ICD) correlates with wayfinding problems" (Werner & Schindler 2004, reported in HERD review).
  SOURCE: PMC4287692 — T2 (second-hand). | WHAT: pending | PROBLEM: pending | STATUS: pending | ACTION: pending
- **C-16** CLAIM: "over 40% chose exit doors over signs when available" (Tang et al. 2009, same review) — reused in HB-09, HB-21, HB-26 as a surviving claim.
  SOURCE: PMC4287692 — T2. | WHAT: pending | PROBLEM: pending (year mismatch: sources list writes "Tang et al. 2004/2009"; second-hand quotation) | STATUS: pending | ACTION: pending
- **C-17** CLAIM: wayfinding is "a problem-solving process of determining and navigating a route to a destination"; decision points are "nodes" at which "two or more alternatives exist" (Jamshidi 2020, reporting O'Neill 1991a).
  SOURCE: PMC7677306 — T2, "read directly". | WHAT: pending | PROBLEM: pending | STATUS: pending | ACTION: pending
- **C-18** CLAIM: **"63.2% of participants in the regular, symmetrical building felt 'completely lost' during a tour, in contrast to only 6.5% of those in the regular, asymmetrical setting"** (Baskaya et al. 2004, "quoted verbatim" in HERD review).
  SOURCE: PMC4287692 — T2. | WHAT: pending | PROBLEM: pending (does the review give 63.2/6.5? are the buildings "regular symmetrical" vs "regular asymmetrical"? sample size n=?; "verbatim" is a strong word) | STATUS: pending | ACTION: pending

### HB-08 / HB-25 — space syntax
- **C-19** CLAIM: two verbatim quotes — "an accessible segment is more easily reached than a segregated one because it can be arrived at by simpler routes from other segments" and "a more accessible segment should be more likely to be selected as part of a route between other pairs of segments".
  SOURCE: spacesyntax.com/the-space-syntax-approach/ — T3. | WHAT: pending (already verified in TH per file; re-spot-check only) | PROBLEM: pending (T3 marketing page carrying a mechanism claim) | STATUS: pending | ACTION: pending

### HB-09 — visibility
- **C-20** CLAIM: "a study of 153 retail stores measured visibility with object-based isovists and found rent rises with visible area (≈ IDR 40.74 per m² per month per m²·person of visibility) with layout variation explaining 38.4% of the price difference".
  SOURCE: "Impact of visibility on indoor retail store rent", J Property Investment & Finance — https://ideas.repec.org/a/eme/jpifpp/jpif-01-2022-0004.html — T2.
  WHAT: pending | PROBLEM: pending (abstract-level check; IDR magnitude; file already flags non-transferability) | STATUS: pending | ACTION: pending

### HB-10 / HB-20 — standing density (this is what refuted the brief's premise)
- **C-21** CLAIM: "The IMO evacuation guideline treats a queue as a distinct flow state — density ≥ 3.5 p/m² … or a flow differential > 1.5 p/s".
  SOURCE: MSC.1/Circ.1238 — T1. | WHAT: pending | PROBLEM: pending (is 3.5 the *queue/traffic-density* threshold, or the density at which movement stalls? threshold direction matters for HB-01's "no region ≤ 1 tile/person" test) | STATUS: pending | ACTION: pending
- **C-22** CLAIM: "preferred interpersonal distance of 1.0–1.2 m regardless of surrounding density (Küpper & Seyfried 2023)" — used in HB-10, HB-11, HB-17, HB-20, and as the direct rebuttal of the brief's 2–4 tiles/person.
  SOURCE: PMC10498346 — T2. | WHAT: pending | PROBLEM: pending (is the value per-person distance or per-bunch? does "irrespective of density" hold in the paper, or only up to a limit?) | STATUS: pending | ACTION: pending
- **C-23** CLAIM (HB-20 + Weak section): "the brief's working assumption of 2–4 tiles per person is comfortable sits in the LOS E/F range … comfortable standing begins near 5 tiles/person".
  SOURCE: derived from FHWA bands (C-01, C-04). | WHAT: pending | PROBLEM: pending (arithmetically right if bands are right; the premise-refutation therefore stands or falls on C-01/C-04) | STATUS: pending | ACTION: pending

### HB-11 — IBC lobby
- **C-24** CLAIM: the lobby "shall accommodate, at 3 square feet (0.28 m²) per person, not less than 25 percent of the occupant load of the floor area served by the lobby", plus "one wheelchair space of 30 inches by 48 inches for each 50 persons, or portion thereof".
  SOURCE: IBC 2023 FBC Ch. 30 §3008.6.4 via UpCodes — T1, "the requirement quoted is for occupant-evacuation lobbies".
  WHAT: pending | PROBLEM: pending (section number; whether §3008.6.4 is *Entrance doors* / size of lobby vs something else; whether 25% is of occupant load served; whether the wheelchair-space clause sits in the same subsection) | STATUS: pending | ACTION: pending

### HB-12 — waiting psychology
- **C-25** CLAIM: Maister's eight principles, quoted as titles (1)–(8), incl. "(8) Solo Waits Feel Longer than Group Waits".
  SOURCE: davidmaister.com/blog/201/ — T3, author's own publication.
  WHAT: pending | PROBLEM: pending (are there eight? exact wording/numbering? Maister's list is usually 7 or 8 depending on version) | STATUS: pending | ACTION: pending
- **C-26** CLAIM: ED RCT (n = 100): estimate did not significantly change satisfaction (5.92 vs 5.45, p = 0.476), most preferred having one; sources list adds actual wait 70.54 min.
  SOURCE: PMC7502966 — T2. | WHAT: pending | PROBLEM: pending | STATUS: pending | ACTION: pending
- **C-27** CLAIM: "a laboratory queue study (30 participants, 1,416 waiting trials) found stress rising significantly with perceived wait but no effect of observed queue length".
  SOURCE: PMC12369606 — T2. | WHAT: pending | PROBLEM: pending | STATUS: pending | ACTION: pending
- **C-28** CLAIM: the file's own note "several individual mechanisms are weakly or not replicated" + "two mechanisms unsupported".
  SOURCE: internal honesty marker. | WHAT: pending | PROBLEM: pending (does the pair of nulls actually bear on the specific principles cited — (4) uncertain waits and (6) fairness/queue length — or on different ones?) | STATUS: pending | ACTION: pending

### HB-13 / HB-21 — vertical queue and pre-movement
- **C-29** CLAIM: NIST TN 1664 (Kuligowski & Hoskins 2010): pre-evacuation times depended on the actions taken and the floor.
  SOURCE: nist.gov/publications/occupant-behavior-high-rise-office-building-fire — T1. | WHAT: pending | PROBLEM: pending | STATUS: pending | ACTION: pending
- **C-30** CLAIM: "video analyses of evacuation report delayed response in 35% of cases, with slow response defined as ≥ 30 s and mean pre-movement times of 0.68 min with voice messages versus 1.68 min with alarms alone".
  SOURCE: PMC10620751 — T2 (file's source list concedes these are cited *there* from Lovreglio). | WHAT: pending | PROBLEM: pending (third-hand numbers; "0.68 with voice vs 1.68 with alarm" — direction is counter-intuitive and needs checking; also whether "35%" is "delayed response" or "slow response" prevalence) | STATUS: pending | ACTION: pending
- **C-31** CLAIM: same review "names 'taking the familiar exit' as a documented risk".
  SOURCE: PMC10620751 — T2. | WHAT: pending | PROBLEM: pending | STATUS: pending | ACTION: pending
- **C-32** CLAIM: HB-21 grid constants `pre_move = 30 s` minimum, `100 s where alarms are the only cue`, `egress_detour_index ≤ 1.3`.
  SOURCE: derived/heuristic. | WHAT: pending | PROBLEM: pending (100 s ≈ 1.68 min: derived from a fire study; must stay labelled) | STATUS: pending | ACTION: pending

### HB-14 / HB-15 — staff flow
- **C-33** CLAIM: "clean must never cross dirty, and service must never cross guest" + failures "rooms not ready", "food arrives cold", guests seeing "the machinery".
  SOURCE: Studio Matrx Academy — T4. | WHAT: pending | PROBLEM: pending (T4 carrying a rule stated as STANDARD-adjacent; file labels it DESIGN PRINCIPLE / BUILDING-TYPE CONVENTION) | STATUS: pending | ACTION: pending
- **C-34** CLAIM: infection-control design specifies separate staircases and lifts for waste; **one hand-wash basin per six beds**, **bed centres ≥ 8 ft (≈ 2.44 m)**, **24–32 bed** nursing unit.
  SOURCE: PMC4923482 (*Mil Med J AFMI*) — T2. | WHAT: pending | PROBLEM: pending (these are prescriptive numbers from a single experience/opinion-type paper; file class as STANDARD in healthcare — tier check) | STATUS: pending | ACTION: pending
- **C-35** CLAIM: nurse walking "mean distance per shift 4.17 km on day shifts (883 records), 6.18 km on long-day shifts (991), 4.76 km on night shifts (1,050)", emergency ward longest, call volume a significant predictor.
  SOURCE: PMC12411061, J Nurs Manage 2025 — T2. | WHAT: pending | PROBLEM: pending (which value pairs with which shift type; record counts) | STATUS: pending | ACTION: pending
- **C-36** CLAIM: "mean walked distance 2.28 km in the unit reported as private-room, vs 2.87 km and 2.96 km in the two reported as open-ward, with station centrality named as a driver — the same role covering 26–30 % more ground purely from layout".
  SOURCE: PMC8850728 (Heliyon 8(2022) e08929) — T2, "abstract read twice".
  WHAT: pending | PROBLEM: pending (percentage check: 2.87/2.28 = 1.259, 2.96/2.28 = 1.298 → 26–30% is right *arithmetic*; but "purely from layout" over-reads a 3-unit comparison with confounders; also which ICUs were open vs private) | STATUS: pending | ACTION: pending

### HB-16 — noise
- **C-37** CLAIM: survey of **609 hotel guests**; hallway noise **OR 2.01**, adjacent-room noise **OR 2.07**, outside noise **OR 2.23**, AC/heater **OR 1.57** raising odds of poor sleep; sources list adds pillows 2.49/3.29.
  SOURCE: PMC10130565 — T2. | WHAT: pending | PROBLEM: pending (file itself concedes a second extraction gave 2.37 → replication-of-extraction failure; also: are these ORs for "poor sleep" or for "overall satisfaction"?) | STATUS: pending | ACTION: pending
- **C-38** CLAIM: systematic review of **33 studies**, daytime ward noise **Leq 37–88.6 dB(A)**, night-time **38.7–68.8 dB(A)**, against WHO **≤ 35 dB(A) day / ≤ 30 dB(A) night**; sources named = staff conversation, alarms, doors, trolleys.
  SOURCE: PMC7935697 — T2 ("WHO targets as reported there"). | WHAT: pending | PROBLEM: pending (33 studies count; ranges; WHO figure provenance — WHO community-noise guideline for hospital bedrooms is 35 dB(A) day / 30 dB(A) night *inside*, widely misquoted) | STATUS: pending | ACTION: pending
- **C-39** CLAIM: "dissatisfaction with privacy is highest in conventional open-plan layouts (469 participants, 26 organisations, 7 office categories)".
  SOURCE: acoustics.org press-room item (Danielsson & Rogström) — T2. | WHAT: pending | PROBLEM: pending (is a JASA meeting abstract a T2 "peer-reviewed" source? tier-inflation risk; also the better-known 469/26/7 figure belongs to Priego et al. 2018 "Workspace satisfaction" — attribution check) | STATUS: pending | ACTION: pending

### HB-17 / HB-18 — room location and supervision
- **C-40** CLAIM: proxemic bands intimate 0–0.46 m, personal 0.46–1.22 m, social 1.2–3.7 m, public > 3.7 m — explicitly second-hand (EBSCO/Wikipedia).
  SOURCE: T3/T4, primary not retrieved; file states this. | WHAT: pending | PROBLEM: pending (only a problem if a *rule dimension* depends on it — HB-17 (c) uses it) | STATUS: pending | ACTION: pending
- **C-41** CLAIM: cohort of **83,635 inpatients**; farther from ward entrance → **critical illness OR 1.15 (1.08–1.23)**, **mortality OR 1.16 (1.02–1.33)**, **+13 h length of stay**; and "location of a patient at admission in relation to the nurse's station did not impact their outcome".
  SOURCE: PMC6520200 — T2. | WHAT: pending | PROBLEM: pending (n, ORs, CIs, LOS delta, exact null wording; HB-17 uses it as "the payoff" for a privacy rule while HB-18 uses it as a null — double-reading check) | STATUS: pending | ACTION: pending
- **C-42** CLAIM: "Visibility-focused inpatient design remains common practice" (Karki dissertation; healthdesign.org item, 403 on retrieval).
  SOURCE: T2/T3, one unreachable. | WHAT: pending | PROBLEM: cannot-verify-by-design (file concedes) | STATUS: pending | ACTION: pending

### HB-19 — social interaction
- **C-43** CLAIM: "In a diary study of 274 residents of four high-rise buildings (19–36 floors), 46% of reported social interactions took place in circulation areas, against 16.2% in open/green space and 15.9% in the home".
  SOURCE: PMC7369851, IJERPH 2020 — T2. | WHAT: pending | PROBLEM: pending (does "46%" include lobbies or only corridors? file's rule text says "(corridors, lobbies, halls)") | STATUS: pending | ACTION: pending

### HB-22 / HB-24 — occupancy and doors
- **C-44** CLAIM: "the IMO model puts standing crowds at 3.5 p/m² and treats anything denser as stalled"; "assembly-type occupant-load factors… (TH-12's business factor of 150 ft² gross/occupant ≈ 14 m²/person)".
  SOURCE: MSC.1/Circ.1238 — T1; IBC §1005 via up.codes/s/means-of-egress-sizing — T1. | WHAT: pending | PROBLEM: pending (150 ft² business factor is a *net* floor-area factor in the IBC occupant-load table, not gross, and not in §1005.3.1's egress widths — possible unit/scope error) | STATUS: pending | ACTION: pending
- **C-45** CLAIM: "a 1.0 m (2-tile) run therefore caps at ≈ 78 persons/min"; "FHWA/HCM marks walkway LOS F at ≤ 0.6 m²/ped and the platoon table reaches 59 ped/min/m"; "a NIST-hosted study is titled, precisely, 'Questioning the linear relationship between doorway width and pedestrian evacuation flow rate'" (pub_id=861412).
  SOURCE: MSC/Circ.1238 — T1; FHWA §3 — T1; tsapps.nist.gov PDF — T1 (title/URL verified, body unread). | WHAT: pending | PROBLEM: pending (fabricated-lookalike risk on the NIST title; PDF "not machine-readable" is the file's own hedge — must confirm the publication exists and says what the title implies) | STATUS: pending | ACTION: pending

### HB-26 — contested retail folklore
- **C-46** CLAIM: two named papers exist: "Clockwise versus counterclockwise turning bias", J Retailing & Consumer Services 2022; "Decompression zone deconstructed: Products located at the store entrance do have an impact on sales", 2018.
  SOURCE: sciencedirect article-abs pii/S0969698922000583 — T2; researchgate 328756004 — T2 (403). | WHAT: pending | PROBLEM: pending (existence only; both cited as "title verified, body not read") | STATUS: pending | ACTION: pending
- **C-47** CLAIM: "Contrast the claims that did survive: bend-speed effects (HB-05), symmetry and disorientation (HB-07), door-affordance over signage (HB-09), flow per metre width (HB-02)."
  SOURCE: internal summary. | WHAT: pending | PROBLEM: pending (this is the file's strongest rhetorical move — it depends on C-14, C-18, C-16, C-05 all holding; note if any one collapses the "survived" list must shrink) | STATUS: pending | ACTION: pending

### HB-06/07/09/12/16/17/19/25 — single-source-presented-as-corroboration watch-list
- **C-48** Multiple rules cite the *same* PMC4287692 review for three independent-sounding facts (Baskaya, Tang >40%, Werner & Schindler) and then use them in HB-26 as "surviving" claims. Independent corroboration: pending. | PROBLEM: pending | STATUS: pending | ACTION: pending
- **C-49** HB-16/HB-17/HB-23 all lean on the same open-office dataset (469/26/7) and the same hospital-noise review. Independent corroboration: pending. | STATUS: pending | ACTION: pending
- **C-50** MSC.1/Circ.1238 is cited as T1 corroboration *and* as the source of both the flow rates and the density/speed model used to justify the standing-density rebuttal in HB-20; Küpper & Seyfried is the only direct human measurement behind that rebuttal. Independent corroboration: pending. | STATUS: pending | ACTION: pending

### Cross-context transfer (ships/airports/hospitals → hotel tile grid)
- **C-51** IMO ship-evacuation flow/density values used for building corridors, doors, lift lobbies and standing queues. File qualifies partially (HB-02 "caps design flow below the code maximum"), but not in HB-10/HB-11/HB-20 where the queue threshold becomes a design floor. | PROBLEM: pending | STATUS: pending | ACTION: pending
- **C-52** FHWA street/curb/pedestrian-facility LOS bands applied to interior floor plates; file's Confidence line does qualify this ("Medium for transferring street-facility bands unchanged"). | STATUS: pending | ACTION: pending
- **C-53** Hospital nurse/ward data (HB-15, HB-17, HB-18) used to justify hotel back-of-house and guest-room placement. | STATUS: pending | ACTION: pending
- **C-54** Fire-evacuation pre-movement times used in HB-13/HB-21 queue and RSET proxies; file explicitly warns against this in `## Weak or contested` (good) but HB-13's grid text still carries `boarding = persons × 1.5 s`. | STATUS: pending | ACTION: pending

### Existence / fabricated-lookalike sweep (file's own URLs)
- **C-55** http://davidmaister.com/blog/201/ — does the URL resolve and carry the eight principles? | pending
- **C-56** https://puc.overheid.nl/doc/PUC_1952_14/ — is this actually MSC.1/Circ.1238? | pending
- **C-57** https://collective-dynamics.eu/index.php/cod/article/view/A17 and /A47 — exist? | pending
- **C-58** mdpi Sustainability 13(6):3394 "Bill Hillier's Legacy" and 16(4):1391 — exist? | pending
- **C-59** tsapps.nist.gov pub_id=861412 — exists? | pending
- **C-60** The Collective-Dynamics bend paper vs the PLOS ONE paper: HB-05 lists PLOS ONE only; HB-03 attributes the 1.07 m/s corridor mean to it — check the PLOS ONE sample design (was it 1.5 m corridors? walking *and* jogging? how many participants?). | pending

---

## C. Verification log — SUPERSEDES every inline `pending` marker above (§A and §B)

Sources opened and what they said (13 retrieval attempts, 11 successful):

1. **FHWA §3 (fhwa.dot.gov …/98107/section3.cfm) — reachable, tables read.** Walkway LOS (Table 2): A ≥ 130 ft², B 40–130, C 24–40, D 15–24, E ~6–15, F ≤ 6 ft²/ped; capacity 6 ft²/ped. Recommended revision (Table 4): A ≥ 60, B 40–60, C 24–40, D 15–24, E ~8–15, F ≤ 8 ft²/ped. Terminal (Table 7/8): A+ ≥ 2.3 m² … F ≤ 0.7 m². Queuing (Table 21): A ≥ 13 ft², B 10–13, C 7–10, D 3–7, E 2–3, F ≤ 2 ft²/ped, capacity 2 ft²/ped. Flow: platoon (Table 6) LOS F = 59 ped/min/m; terminal (Table 7) A+ ≤ 37; crossflow (Table 10) E = 75.
2. **MSC.1/Circ.1238 (puc.overheid.nl PUC_1952_14) — reachable, and it IS that document.** Annex 1: max flow "Corridors 1.3; Doorways 1.3; Stairs (down) 1.1; Stairs (up) 0.88 p/(m·s)". Speed-density Table 1.1 (as parsed): D 0 → 1.2 m/s; D 0.5 → 1.2; D 1.9 → ~1.3; D 3.2 → 0.67; D 3.5 → 0.20. Queue criteria: "initial density equal to, or greater than, 3.5 persons/m²" and "more than 1.5 persons per second between ingress and exit from a point".
3. **IBC (FBC 2023) §3008.6.4 (UpCodes) — reachable.** Heading "Occupant Evacuation Elevator Lobby"; 3 ft²/person, not less than 25 % of the occupant load served; one 30 × 48 in wheelchair space per 50 persons or portion thereof.
4. **PLOS ONE 17(3):e0264635 / PMC8893709 — reachable.** 1.5 m corridor, angles 0/45/90/135/180, 55 participants, walking and jogging; inner-lane speeds significantly lower than outer; 0° showed no significant difference; peak density 3 ped/m²; 135° vs 180° not significant; recommends "a series of smaller angles … instead of one sharp"; mean walking speed 1.07 m/s reported.
5. **HERD wayfinding review PMC4287692 — reachable.** Verbatim: "63.2% of the participants in the regular, symmetrical building felt 'completely lost' … contrast to only 6.5% of those in the regular, asymmetrical setting" [Baskaya et al., 2004]; "Generally, higher ICD is correlated with more problems in wayfinding" [Werner and Schindler, 2004]; "over 40% of the participants chose an exit door rather than following the direction posted on the emergency sign" [Tang, Wu and Lin, 2009]. All three are second-hand in this one review; Baskaya's sample size is not given.
6. **PMC6520200 room-location cohort — reachable.** n = 83,635; critical illness OR 1.15 (1.08–1.23); mortality OR 1.16 (1.02–1.33); 13-hour LOS increase; retrospective cohort, USA, HERD. Direction of the nurse's-station null is consistent; the exact quoted sentence was not returned by the extraction.
7. **PMC8850728 Heliyon — reachable.** ICU1 (private rooms) 2.28 km; ICU2/ICU3 (open wards) 2.87 / 2.96 km per shift; station centrality reduces distance; n = 36 nurses.
8. **PMC10130565 hotel sleep — reachable, and it disagrees with the audited file.** n = 609, cross-sectional US, outcome = poor sleep satisfaction. Extracted ORs: hallway 2.01 [1.47–2.74]; adjacent room 2.07 [1.52–2.81]; **outside 2.37** [1.74–3.23]; **AC/heater 2.03** [1.50–2.74]; pillows 2.92 [2.13–4.00].
9. **PMC7935697 hospital noise review — reachable.** 33 studies; day Leq 37–88.6 dB(A); night 38.7–68.8 dB(A); WHO 35 dB day / 30 dB night attributed to *Guidelines for Community Noise* (1999); named sources per extraction: traffic, conversations, medical equipment.
10. **PMC7677306 Jamshidi — reachable.** "a problem-solving process of determining and navigating a route to a destination"; nodes are where "two or more alternatives **are available**" (O'Neill, 1991); no numeric effect sizes or decision-point counts.
11. **davidmaister.com/blog/201 — reachable.** Eight principles confirmed, including "Occupied Time Feels Shorter Than Unoccupied Time" and "Solo Waits Feel Longer than Group Waits".
12. **FAILED: PMC10498346 (Küpper & Seyfried 2023) — 403, not retrievable this audit.** The 1.0–1.2 m waiting-distance figure therefore stands UNVERIFIED here, despite being the file's only direct human measurement for standing comfort (HB-10, HB-11, HB-17, HB-20).
13. **FAILED: PMC10620751 — 403.** The 35 % / ≥ 30 s / 0.68 vs 1.68 min figures (HB-13, HB-21) remain UNVERIFIED here; the file's own source list already concedes they are third-hand (cited there from Lovreglio).

### Per-claim verdicts

| # | Verdict | PROBLEM | STATUS | ACTION |
|---|---|---|---|---|
| C-01 walkway bands A≥12…F≤0.6, capacity 0.56 | ft² originals 130/40–130/24–40/15–24/6–15/6 convert exactly to the quoted m² | **worse than the source allows: "current HCM" is stale** — these are the 1998 FHWA / HCM-3rd-ed reproduction, not HCM 6th ed. (2022) values | SUPPORTED (values) | QUALIFY — replace "current HCM" with "FHWA 1998 reproduction of HCM 3rd ed."; evidence to close: HCM 2022 walkway LOS table |
| C-02 recommended revision bands | Table 4 confirmed (60/40–60/24–40/15–24/8–15 ft²) → 5.6/3.7/2.2/1.4/0.75 m² | none | SUPPORTED | KEEP |
| C-03 terminal A+ ≥ 2.3, F ≤ 0.7 | confirmed verbatim in m² | none | SUPPORTED | KEEP |
| C-04 queue A ≥ 1.21, F < 0.19, capacity 2 ft², "Table 21" | Table 21 confirmed: 13 ft² / 2 ft² / capacity 2 ft² | none (table number correct) | SUPPORTED | KEEP |
| C-05 IMO 1.3 corridors+doors / 1.1 down / 0.88 up | exact match, incl. "Doorways 1.3" | cross-domain import: these are **ship** evacuation values used as building defaults; file qualifies only in HB-02 | SUPPORTED (as a value) | QUALIFY — one sentence per rule stating the transfer |
| C-06 59 platoon F / ≤37 terminal A+ / 75 crossflow E | all three confirmed | table cited as "6, 8, 10"; terminal flow is Table 7 | SUPPORTED (values), minor cite error | QUALIFY — fix table number |
| C-07 "agreement … is why this rule caps design flow below the code maximum" | rule's own check is `flow ≤ 39 × tiles` = 78 p/min/m = **the code maximum itself**; nothing is capped below it; 78 also exceeds the FHWA empirical ceiling (59–75) | **internal contradiction / claim stronger than the rule implements** | CONTRADICTED (internally) | REPLACE the sentence, or apply a stated derate (e.g. 0.7–0.8 × 1.3) |
| C-08 IMO speed-density quoted values | source parses as 1.2 at D 0 and 0.5, **0.67 at 3.2, 0.20 at 3.5**; file claims "0.20 at D = 3.2 and 0.10 at D = 3.5" | **figure not in cited table (transcription shifted one row; the 0.10 value does not appear)**; and the table still gives ≥ 1.07 m/s at 1.9 p/m², so 0.5 p/m² is **not** the empirical knee | PARTIALLY SUPPORTED | REPLACE the parenthetical; re-label 0.5 p/m² as a conservative design ceiling, not a measured knee |
| C-09 0.16 p/m² ≈ 6 m²/ped for 1 m separation | PMC7810874 not fetched | cannot verify (single source, correctly flagged T2) | UNVERIFIED | QUALIFY or fetch |
| C-10 1.07 m/s in 1.5 m corridors; 3 p/m² at bends | both confirmed in the PLOS ONE paper | none | SUPPORTED | KEEP |
| C-11 <0.6 m² = loss of free flow | matches FHWA F band | none | SUPPORTED | KEEP |
| C-12 ADA 30 × 48 in | value is standard; cited §305.3 — the 30×48 minimum is §305.1 (not checked) | subsection number suspect; and a wheelchair minimum used as a proxy for an able-bodied standing envelope | PARTIALLY SUPPORTED | QUALIFY — verify subsection, or cite it as an accessibility minimum, not a body envelope |
| C-13 passing-bay spacing / 6 s conflict penalty | file's own HEURISTIC label | none (correctly disclaimed) | INFERRED | KEEP |
| C-14 all six bend claims + the recommendation quote | all confirmed; 55 participants, walking+jogging | quote rendered as near-verbatim, not exact; single experiment | SUPPORTED | KEEP (note n = 55 in Confidence) |
| C-15 Werner & Schindler ICD | confirmed as "Generally, higher ICD is correlated with more problems" | review softens it ("generally") vs the file's harder phrasing; second-hand | PARTIALLY SUPPORTED | QUALIFY |
| C-16 Tang >40% door over sign | confirmed verbatim; year is **Tang, Wu and Lin 2009** (file's source list writes "2004/2009") | second-hand; used in HB-26 as a "survived" claim while resting on the same review as C-15/C-18 | SUPPORTED (quote) / single-source | QUALIFY — normalise the year, mark the shared-source dependency |
| C-17 Jamshidi definitions | first quote exact; source says "two or more alternatives **are available**", the file quotes "**exist**" | quotation marks around a non-verbatim string | PARTIALLY SUPPORTED | QUALIFY — fix the quoted words |
| C-18 Baskaya 63.2% vs 6.5% | verbatim match, including "regular, symmetrical" / "regular, asymmetrical" and "completely lost" | n not reported anywhere in the review → the file's "controlled comparison" and FACT class outrun what can be shown; single study, one review | SUPPORTED (quote) / PARTIALLY SUPPORTED (as a fact) | QUALIFY — record "n unknown", downgrade class to SUPPORTED-BY-REVIEW |
| C-19 Space Syntax quotes | not re-fetched (file says verified in TH-11/TH-20); T3 vendor/practice page | tier: a practice-firm page carrying a causal claim | UNVERIFIED (this pass) | KEEP with T3 label as-is |
| C-20 153 stores / IDR 40.74 / 38.4% | not fetched | file already flags single-city, non-transferable; IDR magnitude unusable | UNVERIFIED | QUALIFY — keep direction only |
| C-21 IMO queue ≥ 3.5 p/m², Δflow > 1.5 p/s | both confirmed verbatim in intent | none; note the IMO figure is an **assumption for evacuation modelling**, not a measurement of comfort | SUPPORTED | KEEP |
| C-22 Küpper & Seyfried 1.0–1.2 m irrespective of density | **source unreachable in this audit (403)** | the linchpin of the standing-density refutation is a figure this audit could not open; it is load-bearing in HB-10, HB-11, HB-17, HB-20 and in the 5-tiles/person comfort target | UNVERIFIED | QUALIFY — the comfort target must not be presented as measured until the paper is opened |
| C-23 brief's "2–4 tiles/person" is LOS E/F; comfort ≈ 5 tiles/person | walkway bands (verified) put 0.5–1.0 m²/ped at LOS E/F ✓; queue LOS A = 1.21 m² = 4.8 tiles ✓ | **the premise-refutation survives on the FHWA bands alone**; only the "comfortable standing" half depends on the unverified C-22 | SUPPORTED (first half) / PARTIALLY SUPPORTED (second) | KEEP the rebuttal, re-cite it on bands not on Küpper |
| C-24 IBC §3008.6.4 3 ft² / 25% + wheelchair space | all three confirmed, heading "Occupant Evacuation Elevator Lobby" | none; the file's own scope caveat is accurate. Note 3 ft² is a *shelter-in-place assembly* figure, not a service-queue comfort figure | SUPPORTED | KEEP |
| C-25 Maister's eight principles | eight confirmed, spot-checked titles exact | T3 author's own site (correctly labelled) | SUPPORTED | KEEP |
| C-26 Alrajhi n=100, 5.92 vs 5.45, p=0.476 | not fetched | cannot verify; internally consistent with the file's use (a null) | UNVERIFIED | QUALIFY |
| C-27 30 participants, 1,416 trials, no queue-length effect | not fetched | cannot verify | UNVERIFIED | QUALIFY |
| C-28 "two mechanisms unsupported" note | the two nulls map to principles (4) uncertain waits and loosely to (6) fairness | the ED null targets *information*, not principle (4) as such; the queue-length null is about stress, not fairness — the mapping is looser than the text implies | PARTIALLY SUPPORTED | QUALIFY — name which principle each null bears on |
| C-29 NIST TN 1664 | not fetched (file says abstract only) | cannot verify; claim is qualitative | UNVERIFIED | KEEP with existing hedge |
| C-30 35% delayed / ≥30 s / 0.68 vs 1.68 min | **source unreachable (403)**; the file's own list concedes third-hand (Lovreglio) | note the direction (voice 0.68 < alarm 1.68) is plausible but was not checkable; used as a design constant (30 s / 100 s) in HB-21 | UNVERIFIED | QUALIFY — hold 100 s as an assumption, not a figure |
| C-31 familiar-exit risk | same unreachable source | cannot verify | UNVERIFIED | QUALIFY |
| C-32 30 s / 100 s / detour ≤ 1.3 | file labels heuristic except the 100 s derivation | 100 s inherits C-30's unverified provenance | INFERRED | QUALIFY |
| C-33 Studio Matrx separation quote | not fetched; T4, no number taken | tier acceptable for a convention | UNVERIFIED | KEEP |
| C-34 basin per 6 beds / 8 ft centres / 24–32 beds | not fetched (PMC4923482) | **tier risk**: a single "an Experience" paper supplying STANDARD-class prescriptive ratios for HB-15's checks | UNVERIFIED | QUALIFY — needs a guideline-grade source (FGI/WHO) before it drives dimensions |
| C-35 nurse 4.17 / 6.18 / 4.76 km (883/991/1,050) | not fetched | cannot verify; used to set the 4–6 km target band | UNVERIFIED | QUALIFY |
| C-36 2.28 vs 2.87 / 2.96 km, station centrality | confirmed exactly; n = 36 nurses, three ICUs | "purely from layout" over-reads a 3-unit comparison (different hospitals, case mix uncontrolled); layout descriptors carried at one remove, as the file says | PARTIALLY SUPPORTED | QUALIFY — "in three units, layout one candidate explanation" |
| C-37 hotel ORs 2.01 / 2.07 / 2.23 / 1.57 | 2.01 ✓, 2.07 ✓, **outside = 2.37 not 2.23**, **AC/heater = 2.03 not 1.57**; pillows 2.92 (list says 2.49/3.29) | **source-claim mismatch on 2 of 4 quoted ORs + the list's pillows pair**; outcome variable is poor *sleep satisfaction* ✓. The file noticed the 2.23/2.37 wobble but never the 1.57/2.03 one — evidence of unstable table extraction, not a solved problem | PARTIALLY SUPPORTED / two values CONTRADICTED | REPLACE the two wrong ORs; re-read the table by hand before any OR is quoted |
| C-38 33 studies / 37–88.6 / 38.7–68.8 / WHO 35 / 30 | all four confirmed; WHO attributed to *Guidelines for Community Noise* 1999 ✓ | source list "doors and trolleys" not in the extracted list (traffic, conversations, medical equipment) | SUPPORTED (numbers) / minor | QUALIFY the source list only |
| C-39 469 participants / 26 orgs / 7 categories, open-plan worst | not fetched (acoustics.org press room) | **tier inflation**: a JASA meeting abstract listed as T2 peer-reviewed; the same 469/26/7 dataset is the signature of Priego et al. 2018, which the file lists separately as unread — possible mis-attribution | UNVERIFIED | REPLACE tier or attribution; needs the published paper |
| C-40 Hall proxemic bands, second-hand | file discloses this fully | none (disclosed) | INFERRED | KEEP |
| C-41 83,635 / OR 1.15 (1.08–1.23) / 1.16 (1.02–1.33) / +13 h | all confirmed exactly | none on the numbers; HB-17 quotes the positive arm, HB-18 the null arm of the same single study — two rules, one cohort | SUPPORTED / single-source | QUALIFY — "one US retrospective cohort" must appear in both rules |
| C-42 nurse's-station null verbatim | direction confirmed, exact sentence not returned | minor | PARTIALLY SUPPORTED | KEEP |
| C-43 274 residents / 46% / 16.2% / 15.9% | not fetched (PMC7369851) | cannot verify; the "corridors, lobbies, halls" grouping is the file's expansion | UNVERIFIED | QUALIFY |
| C-44 IMO 3.5 standing / IBC 150 ft² **gross** | IMO ✓ confirmed. The 150 ft² business occupant factor is a **net** floor-area factor in the IBC occupant-load table, not gross, and not an egress-width value | **unit/scope error** (gross vs net) in a number carried from TH-12 | PARTIALLY SUPPORTED / IMO half SUPPORTED | REPLACE "gross" with "net" and cite the occupant-load table |
| C-45 78 p/min door / 59 platoon F / NIST door-width paper title | 78 and 59 both confirmed from verified sources; the NIST title/URL not fetched | fabricated-lookalike risk on the NIST item is **open** (title plausible, body admittedly unread) | SUPPORTED (numbers) / UNVERIFIED (NIST) | QUALIFY — confirm the NIST record resolves before the title is reused in a rationale |
| C-46 turning-bias + decompression-zone titles | not fetched (paywalled/403 by the file's own account) | cited by title only, and for *negative* design weight — the lowest-risk use in the file | UNVERIFIED | KEEP |
| C-47 "claims that did survive" list | bends ✓, bands/flow ✓, Baskaya ✓ (single review), Tang ✓ (same review) | the list implies four independent survivors; two of them (C-16, C-18) come from **one** review article | PARTIALLY SUPPORTED | QUALIFY — mark the shared-source pair |
| C-48/C-49/C-50 shared-source audit | confirmed: PMC4287692 carries three load-bearing wayfinding facts; PMC6520200 carries two rules; MSC.1/Circ.1238 carries HB-02, HB-03, HB-10, HB-11, HB-20, HB-22, HB-24; FHWA carries HB-01, HB-04, HB-10, HB-20, HB-22, HB-24 | the file presents these as separate sources per rule; the true independent-source count is ~8 for 26 rules | SUPPORTED (as an audit finding) | QUALIFY — add a "source concentration" line |
| C-51…C-54 cross-domain transfer | ship evacuation → building corridors/doors/lobbies/queues (real, only partly disclosed); street-facility LOS → interior plates (disclosed ✓); hospital staff/ward data → hotel back-of-house (undisclosed in HB-14/15); fire pre-movement → routine queues (disclosed ✓) | PARTIALLY SUPPORTED | QUALIFY |

### §A arithmetic — all conversions checked, none wrong
A-01…A-12 re-computed independently: ×4 tiles/m² ✓; bands 12→48, 3.7→14.8, 2.2→8.8, 1.4→5.6, 0.6→2.4 ✓; 1.21→4.84, 0.19→0.76, 6 ft²→0.56, 2 ft²→0.19 ✓; 1.3 p/m/s → 39 p/min per tile, 78 per 1.0 m, 1.1→33, 0.88→26 ✓; 0.5 p/m²→8 tiles, 1 tile→4 p/m², 3.5 p/m²→1.14 tiles ✓; 3 ft²→0.279 m²→1.12 tiles ✓; 8 ft→4.9→≥5 tiles ✓; 1.2 m/s→2.4 tiles/s, 20×20 square 28.3 vs 40 steps = 1.41× ✓; 12/6/3/2 tiles = 3/1.5/0.75/0.5 m² ✓; 0.46/1.2/3.7 m → 0.9/2.4/7.4 tiles ✓ (file's "≈1 tile" is a rounding-up, harmless). **Arithmetic verdict: SUPPORTED — no rounding or unit-shift error found in the conversions.** Two internal inconsistencies survive the arithmetic though: (i) HB-20's grid figure "2 tiles abreast × 1.5–2 deep" yields 3–4 tiles/person, which contradicts the same rule's headline "comfortable standing begins near 5 tiles/person" and HB-10's `q = 4`; (ii) HB-03's `speed_factor = 1 − 0.28 (D − 0.5)` is labelled "per MSC band interpolation" but at D = 3.2 it gives 0.24 of free speed where MSC gives 0.67/1.2 ≈ 0.56 — the fit is steeper than the table it cites.

---

## D. Totals and verdict

**Status totals (claims C-01…C-54 + A-block):** SUPPORTED 17 · PARTIALLY SUPPORTED 12 · INFERRED 2 · UNVERIFIED 17 · CONTRADICTED (internal) 1 · fabricated-lookalike confirmed 0 (2 open: NIST pub_id 861412, the two paywalled retail titles).

**Actions:** KEEP 9 · QUALIFY 26 · REPLACE 4 (C-07 sentence, C-08 parenthetical values, C-37 two ORs, C-39 tier/attribution; plus C-44 gross→net).

**The 5 most dangerous claims (wrong or unprotected, and load-bearing):**
1. **C-08 — the IMO speed-density values are mis-transcribed** ("0.20 at 3.2, 0.10 at 3.5"; source says 0.67 and 0.20), and the 0.5 p/m² "knee" is not what the table shows. HB-01/HB-03/HB-20's density asserts all sit on this.
2. **C-37 — two of four hotel noise odds ratios do not match the source** (outside 2.37 not 2.23; AC/heater 2.03 not 1.57). The file documented one discrepancy and missed the larger one — the extraction pipeline itself is the risk.
3. **C-22 — the standing-comfort figure (1.0–1.2 m) could not be opened** (403) and it is the sole direct measurement behind the standing-density rebuttal and the 2.2-tiles/person comfort target in HB-11.
4. **C-07 — "caps design flow below the code maximum" is false as implemented**: the rule uses the IMO maximum (78 p/min/m) directly, above the empirical 59–75 range, and applies ship figures to building doors.
5. **C-18/C-16/C-15 — the wayfinding trio is one review article**, sample size unknown, yet HB-07 is classed FACT and HB-26 lists two of them as independently "survived" claims.

**Is the file safe as an implementation foundation?** Mostly yes, with a repair pass first. Its architecture is honest: tiers, confidence, HEURISTIC labels and the `## Weak or contested` section are used properly, and every conversion and every headline number I could open (FHWA bands incl. Table 21, IMO flow rates and the 3.5 p/m² queue threshold, IBC 3 ft²/25 %, the bend study's results, the 83,635 cohort's ORs and LOS delta, the Heliyon 2.28/2.87/2.96 km, the hospital-noise ranges, Maister's eight) matched. The standing-density premise refutation stands: 2–4 tiles/person really is LOS E/F on verified bands. Not safe as-is for: density-knee constants (C-08), the four noise ORs (C-37), door-flow headroom (C-07), anything sourced to Küpper or PMC10620751 until those two links are opened by hand, and the healthcare fixture ratios (C-34) which are T2-single-paper numbers driving hard grid checks. Cross-domain imports from ship evacuation need an explicit transfer sentence per rule, and the file needs a source-concentration line: ~8 independent sources underwrite 26 rules.
