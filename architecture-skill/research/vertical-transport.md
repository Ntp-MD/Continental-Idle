# Research file — Domain AB: Elevator (vertical-transport) traffic calculation

Scope: the **arithmetic** layer. MS-10 says dimension lifts by peak-period handling capacity rather
than population ÷ speed, MS-11 says guarantee stop coverage, MS-23 says model each portal as a queue
with an explicit service rate, OM-16 says never size on the average day because queues are nonlinear
— and each was written with its numeric band marked `UNCITED / Confidence Low` because no
traffic-analysis source could be opened (MS-10 names "the authoritative home … CIBSE Guide D §2, not
retrieved"; TH-29 and HB-13 record the same gap). This file supplies the computation: the five traffic
measures, the up-peak trip statistics, the RTT build-up with every term valued, the demand
assumptions (what share of a population moves in the peak five minutes, by type), the published
quality bands, the queueing arithmetic behind OM-16's nonlinearity, escalator throughput, and one
fully worked 250-key hotel. It does **not** restate the design duties — peak-HC sizing stays MS-10,
stop coverage stays MS-11, "model the portal as a queue" stays MS-23/OM-16; what changes is that those
rules can now be *evaluated numerically*, so their `UNCITED` markers are superseded except where a
constant is flagged. Host constraints: 1 tile = 500 mm (tile area 0.25 m²); **no heights, no section**;
vertical links are `portal` objects with queues, default patience 30 s; the flagship case is a
multi-floor hotel whose lobby carries ~500 occupants — so every time term reaches the host as a
**declared seconds-per-cycle parameter** and every dimension as a **tile footprint** (VT-24). Tiers:
T1 standard/regulator, T2 peer-reviewed, T3 specialist consultancy/manufacturer, T4 vendor/trade. An
unreadable constant is written symbolically and marked `NEEDS VERIFICATION:` with the document to
open; numbers computed here are labelled *derived*. Nothing is invented.

## Rules

### VT-01 Compute five measures, not a headcount
- Rule: a design is five numbers — `RTT` (s), `INT = RTT/L` (s; L = cars), `HC5 = 300·P·L/RTT` (persons/5 min), `HC5% = HC5/POP × 100`, `AWT`. A portal count justified by one is unverifiable.
- Evidence: the full up-peak formula set is quoted verbatim at nazarelevator.com (Sources 5) and the HC-5/interval definitions at elevatorescalators.com (Sources 7); together they supply every measure in the rule as an arithmetic identity, with each term defined — `P` = passengers carried per up-peak trip (0.80 × rated, VT-05), `L` = cars in the group, `N` = landings above the origin, `POP` = design population (VT-04), `300` = the seconds in the peak five minutes, `100` = the percentage conversion:
  `Interval = RTT / L`
  `Handling capacity = 300 x P x L / RTT`
  `%POP = handling capacity / building population x 100`
  and `AWT` as the fifth measure — its coefficient is VT-10's, not these sources'. The consequence for the host is the per-portal conversion `service_rate = 3600/RTT_s` trips/h.
- Source: Nazar Elevator, *How to calculate elevator handling capacity and interval* — **T4**, read (Sources 5) · Elevator & Escalators (trade), *Traffic Analysis for Office Towers* — **T4**, read (Sources 7). T4 × 2, mutually consistent restatements of the CIBSE/Barney up-peak method; the primary table (CIBSE Guide D §2) is still unretrieved (Sources 10).
- Class: FACT (formula — the identities are arithmetic; the tier of their restatement is graded in Confidence)
- Scope: any lift-served stack; the arithmetic MS-10 demands and MS-23 consumes.
- Confidence: Medium — corroborated twice and consumed by OM-16's T3 example; primary table still unretrieved.
- Grid translation: emit `{RTT_s, INT_s, HC5_persons, HC5_pct, AWT_s}` per group per period; per-portal `service_rate = 3600/RTT_s` trips/h feeds MS-23 and MS-10's `supply_per_hour`.
- Exceptions / failure mode: valid only per declared pattern; down-peak and two-way need their own `S`, `H`, `P` (VT-02, VT-05). The measures disagree — VT-09 resolves that, never by dropping one. Failure symptom: a portal count justified by a single measure, which then cannot be checked against the other four.

### VT-02 Name the traffic period before computing anything
- Rule: four patterns, four demand vectors — **up-peak** (lobby→floors), **down-peak** (checkout, theatre release), **two-way inter-floor** (office lunch, ward rounds), **mixed/random** (residential evening); `POP`, `D_5` and bands are restated per pattern. Up-peak-only = unchecked, not safe.
- Evidence: the in-corpus period lists at MS-10 and HB-13 supply the four-pattern taxonomy and the duty to declare which pattern binds; per pattern the file restates `POP` (VT-04), the five-minute demand `D_5 = POP × α` (VT-03) and the HC5/INT/AWT bands (VT-09). *Beyond the Up Peak* (liftescalatorlibrary 00000430) was fetched and **returned no readable text, so no figure is taken from it** (Sources 14) — the non-up-peak coefficients are therefore named, not quoted: only the up-peak `α` band has opened sources (VT-03), and nothing opened gives hotel or hospital peak-window shares. The cost of the duty is arithmetic, not design: 4 patterns × N groups = 4N calculations.
- Source: period lists carried in-corpus at MS-10 and HB-13 (in-corpus duty) · *Beyond the Up Peak*, symposium paper indexed at The Lift and Escalator Library — **T2, fetched, no extractable text** (Sources 14; the URL is recorded there and is not repeated here). CIBSE Guide D / Barney per-pattern tables — not retrieved (Sources 10).
- Class: DESIGN PRINCIPLE (the declaration duty; the four-pattern taxonomy is traffic-analysis vocabulary reported from in-corpus rules)
- Scope: universal.
- Confidence: High on the requirement, Low on pattern coefficients — the T2 source covering non-up-peak patterns was fetched and unreadable, so no down-peak or two-way figure in this file is quoted. `NEEDS VERIFICATION:` down-peak/two-way percentages — CIBSE Guide D, Barney.
- Grid translation: tag each record `period ∈ {up, down, two-way, random}` and publish the binding period; every downstream record (HC5, INT, AWT, `rho`) is keyed by that tag.
- Exceptions / failure mode: no opened source gives hotel or hospital peak-window shares (VT-03 flags, not fills). 4 patterns × N groups = 4N calculations; run them, they are arithmetic. Failure symptom: a stack declared "adequate" on an up-peak run alone — the other three patterns are then unpriced, not passed.

### VT-03 Take the five-minute arrival share from the table, with its tier
- Rule: `D_5 = POP × α`. α is building-type data, not a design choice, and drives car count almost linearly (VT-08) — the most consequential number in the file.
- Evidence: two opened T4 sources supply α by building type — nazarelevator (Sources 5): multi-tenant office 11–13 %, single-tenant 15 %; ATIS (Sources 6): office 11–13 %, residential 5–7 %, described there as "empirical, or observed, values". Terms: `POP` = design population (VT-04), `D_5` = persons arriving in the peak five minutes, `α` = the arrival share. The near-linear coupling is the capacity limb `L_capacity = D_5 × RTT/(300 × P)` (VT-08), so α moves cars almost one-for-one: on the reference case α = 10 % gives `D_5 = 480 × 0.10 = 48` persons/5 min and 4 cars, FL-17's α = 25 % gives 120 persons/5 min, `L_capacity = 5.84` and **6 cars at ρ = 0.97** (Worked example, Sensitivity). **No hotel or hospital row exists in any source read here**; the hotel value used, α = 10 % (A3), is interpolated and declared as an assumption.
- Source: Nazar Elevator — **T4**, read (Sources 5) · ATIS, *Optimizing Elevator Systems: The Role of Traffic Analysis* — **T4**, read (Sources 6). T4 × 2, concordant on office 11–13 %. No Tier-1 or Tier-2 per-type table opened: CIBSE Guide D per-type tables (Sources 10) and NHS HTM 08-02 lift provision (Sources 12) were not read.
- Class: BUILDING-TYPE CONVENTION (T4 practice bands; the standards that would upgrade them were not read, so not STANDARD)
- Scope: all types; the row must match the stacking diagram (MS-02).
- Confidence: Medium for office/residential; **none for hotel and hospital** — those α values are this file's declared assumptions (A3) and the gap is declared wherever used. `NEEDS VERIFICATION:` hotel and hospital α — CIBSE Guide D per-type tables, NHS HTM 08-02 lift provision.
- Grid translation: write `alpha_source`/`alpha_tier` beside every `D_5`; publish `D_5` per group per period as the queue's arrival input (VT-14's `λ = D_5/300`).
- Exceptions / failure mode: corroborates FL-17's office half of "≥ 11–13 % for offices/hotels" and leaves its **hotel half unsupported** (Weak or contested). A conservative α buys shafts; a loose one buys a saturated lobby (OM-16). Failure symptom: a hotel lobby dimensioned on an office α, or an α printed without its tier.

### VT-04 Derive design population; never count rooms off the plan
- Rule: `POP = keys × occupancy + staff`, staff from the rota arithmetic, not the drawing; office analogue 1 person per 8–12 m² NIA.
- Evidence: elevatorescalators.com (Sources 7, T4) supplies the office density band "1 person per 8–12 m² NIA". The hotel multipliers are declared assumptions, not quotes — occupancy 1.6/key (A1) and 0.32 staff/key (A2), cross-checked in-corpus against OM-04 and EC-19. Worked on the reference case: 250 keys × 1.6 = 400 guests, 250 × 0.32 = 80 staff, **POP = 480**. Terms: `keys` = room count, `occupancy` = guests per room, `staff` = on-shift headcount from the rota, `NIA` = net internal area.
- Source: Elevator & Escalators (trade), *Traffic Analysis for Office Towers* — **T4**, read (Sources 7) for the density band · the 1.6 and 0.32 multipliers: in-corpus derived, assumptions A1/A2, cross-checked at OM-04 and EC-19. No population-per-key standard was read.
- Class: HEURISTIC (declared working multipliers) — with the office density band reported as a T4 convention
- Scope: universal — POP feeds HC5%, α and the queue.
- Confidence: Medium (density band), Low (multipliers) — A1/A2 are this file's assumptions and are tagged as such in VT-24's constant block.
- Grid translation: emit `POP_design` with both components and multipliers, reconciled against the host's lobby load (~500); a mismatch is a programme error, not rounding.
- Exceptions / failure mode: POP ±20 % is the first sensitivity run (VT-23) and on the reference case it does not move the car count. Full-capacity design trades against design-day booking (a 250-key hotel rarely holds 500). Failure symptom: rooms counted off the plan as if they were population, or a POP that contradicts the lobby load it is supposed to produce.

### VT-05 Compute the up-peak trip statistics P, S and H
- Rule: with `N` landings above the origin, `P = 0.80 × rated_persons`, `S = N[1 − (1 − 1/N)^P]` (expected intermediate stops), `H = N − Σ_{i=1..N−1}(i/N)^P` (expected highest reversal floor).
- Evidence: all three are quoted verbatim at Sources 5 (nazarelevator, T4): "`P = rated persons x 0.80`", "`S = N x [1 - (1 - 1/N)^P]`", "`H = N - sum from i=1 to N-1 of (i/N)^P`". Terms: `N` = landings above the origin, `P` = passengers carried per up-peak trip, `S` = expected intermediate stops, `H` = expected highest reversal floor, `rated_persons` = the car's rated load. Reproduced on the reference case (N = 21, P = 10) — *derived from the published forms*:
  `S = 21[1 − (20/21)^10] = 21 × 0.3861 = 8.1`
  `H = 21 − Σ_{i=1..20}(i/21)^10 = 21 − 1.45 = 19.5`
  For the two-way pattern the same formula family is replaced by the general form `T_RT = (1 + ε)·P·(h̄/v) + 2(d_o + d_c)·P + n_f·t_0`, whose **block structure** came from liftescalatorlibrary 00000226 (T2, Sources 2); that extraction's symbol gloss is internally inconsistent (`P` called "load factor" where passengers belong), so only the block structure is treated as verified and ε stays symbolic.
- Source: Nazar Elevator — **T4**, read (Sources 5) · proceedings paper *The Round Trip Time Simulation: Monte Carlo Implementation…*, liftescalatorlibrary 00000226 — **T2**, read for block structure only (Sources 2) · the binomial forms are standard CIBSE/Barney statistics but the primary text (CIBSE Guide D, Barney) is **unread** (Sources 10).
- Class: FACT (published formula) — the 0.80 factor is a convention, graded in Confidence
- Scope: up-peak; the two-way general form in Evidence applies once the pattern is declared (VT-02) and is what VT-21 requires for interfloor traffic.
- Confidence: Medium-High on structure (reproducible), Low on the 0.80 factor — convention, not measurement. `NEEDS VERIFICATION:` ε and the 0.80 load factor.
- Grid translation: publish `N, P, S, H` per group; `N = floors − 1` for a single group (A6), so all three statistics are computable from the plan with no heights.
- Exceptions / failure mode: assumes independent uniform destinations — false for a banquet or single-tenant floor, where `S` is lower and clustered. A bigger car raises `P`, which raises `S` and `RTT`; capacity is not free. Failure symptom: a car-size increase booked as a pure gain while `S` and `H` climb behind it, or ε silently given a value.

### VT-06 Build RTT from four explicit blocks and publish every term
- Rule: `RTT = 2·H·tv + (S + 1)·ts + 2·P·tp` — travel, stops, transfer (doors sit inside `ts` and `tp`); on the reference case 82.4 + 38.2 + 25.0 = 145.6 s.
- Evidence: equation form quoted verbatim at Sources 5 (T4): "`RTT = 2 x H x tv + (S + 1) x ts + 2 x P x tp`". Terms: `H` = expected highest reversal floor, `S` = expected intermediate stops, `P` = passengers per up-peak trip (all VT-05); `tv` = time between adjacent stops (VT-07), `ts` = a stop's loss, `tp` = per-passenger transfer time. Timing constants quoted from liftescalatorlibrary 00000226 (T2, Sources 2), attributed there to CIBSE Guide D, Barney, EN 81 and ASME A17.1 — **none of which was read**:
  `d_o = 1.2 s` (door opening) · `d_c = 1.0 s` (door closing) · `t_b = 1.5 s/person` (boarding) · `t_a = 1.0 s/person` (alighting) · `a = 1.5 m/s²` · `j = 0.5 m/s³` · `v_r = 2.5 m/s` · `H_f = 3.5 m` (the source's floor height; this file runs h = 3.2 m, A1)
  derived composites: `ts = d_o + td + d_c = 1.2 + 2.0 + 1.0 = 4.2 s` (`td` = 2.0 s door dwell, assumption A2), `tp = (1.5 + 1.0)/2 = 1.25 s`. Block build-up on the 250-key reference case:
  `RTT = 2(19.5)(2.11) + (8.1+1)(4.2) + 2(10)(1.25) = 82.4 + 38.2 + 25.0 = 145.6 ≈ 146 s`
  i.e. travel 57 %, stops 26 %, transfer 17 %.
- Source: proceedings paper 00000226 — **T2**, read, for the constants (Sources 2) · Nazar Elevator — **T4**, read, for the equation form (Sources 5) · CIBSE Guide D, Barney, EN 81, ASME A17.1 — **named by source 2 as the home of these conventions, none read** (Sources 10, 11).
- Class: FACT (formula + published constants) — the door dwell inside `ts` is a declared assumption, see Confidence
- Scope: universal once the period is declared (VT-02).
- Confidence: Medium-High (two independent sources; constants from a proceedings PDF). `NEEDS VERIFICATION:` door-dwell `td` — 2.0 s here is assumption A2, not a published figure.
- Grid translation: emit `travel_s, stops_s, transfer_s, doors_s` separately so the dominant term is visible; with no heights on this host the whole RTT reaches the build as a **declared seconds-per-cycle parameter** per portal (VT-24).
- Exceptions / failure mode: `ts` excludes per-passenger time (that is `2P·tp`) — double counting is the commonest error; the 00000226 bundle omits levelling. More stops shorten floor walking and lengthen the cycle. Failure symptom: an RTT assembled twice over, or one whose dominant term nobody can name.

### VT-07 Derive tv from geometry, and know when rated speed is never reached
- Rule: `tv = h/v_r + v_r/(2a)` holds only while `h ≥ v_r²/a`; below that the profile is triangular, `tv = 2√(h/a)`. With h = 3.2 m, v_r = 2.5 m/s, a = 1.5 m/s²: `v_r²/a = 4.17 m > h`, so a one-floor hop never reaches rated speed — 2.92 s triangular vs 2.11 s flat. *Derived.*
- Evidence: kinematics computed here on the T2 constants quoted at VT-06 (`v_r = 2.5 m/s`, `a = 1.5 m/s²`) with the declared floor height (assumption A1, `h = 3.2 m`). Terms: `h` = floor height, `v_r` = rated speed, `a` = acceleration, `tv` = travel time between adjacent stops. The branch test and both values are arithmetic: `v_r²/a = 2.5²/1.5 = 4.17 m`; `2√(3.2/1.5) = 2.92 s`; `3.2/2.5 + 2.5/3 = 2.11 s`. On the reference stack the long-run hops use the flat branch, which is why the same test is run as the worked example's validity check and carried as a ~10 % lower-bound warning.
- Source: derived on T2 inputs (Sources 2 constants, quoted at VT-06) · the jerk correction and comfort limits live in EN 81 comfort tables / CIBSE Guide D — **not read** (Sources 10, 11).
- Class: FACT (arithmetic on declared inputs)
- Scope: every RTT; also why fast cars in low buildings are wasted money (VT-13).
- Confidence: High (arithmetic) on declared inputs. `NEEDS VERIFICATION:` jerk correction, EN 81 comfort tables / Guide D.
- Grid translation: compute both branches, state which applies, label `tv_source = triangular | rated`; design-time only — with no heights the build consumes the declared `RTT_s`, not this `tv` (VT-24).
- Exceptions / failure mode: ignores jerk, which adds time per start at high speed. The flat `tv` makes RTT a lower bound by up to ~10 % in low stacks — carry it. Failure symptom: a low stack whose RTT is quietly optimistic and whose rated speed is never reached.

### VT-08 Size the car count from capacity AND interval; take the larger
- Rule: `L_capacity = D_5 × RTT/(300 × P)`, `L_interval = RTT/INT_target`, `L = max(ceil(L_capacity), ceil(L_interval))`. Dense office stacks bind on capacity; low-density hotel and residential stacks bind on **interval**; one limb alone yields a system that is either full or slow.
- Evidence: both limbs are algebra derived from VT-01's `HC5 = 300·P·L/RTT` and `INT = RTT/L`, each set against its own target. Terms: `D_5` = persons in the peak 5 min (VT-03), `RTT` = cycle time (VT-06), `P` = passengers/trip (VT-05), `INT_target` = the declared interval target, `L` = cars. The `INT_target` bands are quoted, not derived — Sources 5 verbatim: "up to about 30 seconds as excellent and 30 to 40 seconds as good; beyond 40 seconds occupants begin to complain"; Sources 6: office 20–30 s, apartment 40–60 s; both T4. Worked on the reference case: capacity limb `48 × 146/(300 × 10) = 2.34` → 3 cars; interval limb `146/40 = 3.65` → **4 cars**; **the interval limb binds**, and the 4th car buys comfort rather than throughput (`HC5 = 300×10×4/146 = 82` persons/5 min = 17.1 % of POP against 10 % demand).
- Source: algebra derived from VT-01 (in-corpus) · Nazar Elevator — **T4**, read (Sources 5) · ATIS — **T4**, read (Sources 6). No opened Tier-1 source sets the interval bands: CIBSE Guide D's HC5/INT/AWT target table was not read (Sources 10).
- Class: FACT (arithmetic of the two limbs) / BUILDING-TYPE CONVENTION (the `INT_target` bands, T4 — the standards that would set them were not read)
- Scope: universal.
- Confidence: High for the algebra, Medium for the bands.
- Grid translation: publish `L_capacity`, `L_interval`, `L` and which bound bites — that line says the design is comfort-limited, and it is what a reviewer challenges. `L` is the portal count handed to VT-11.
- Exceptions / failure mode: `INT_target` is a comfort judgement with no opened Tier-1 source; the hotel value used is interpolated and flagged. Interval-driven sizing buys idling cars; capacity-driven sizing buys complaints. Failure symptom: a car count computed from one limb only.

### VT-09 Compare HC5% to the band, then issue one verdict from all three measures
- Rule: `HC5%` must land inside the band (above = dead capital, below = saturation guarantee, OM-16), and the group passes only if HC5%, INT **and** AWT clear. They are not redundant: capacity, departure regularity, experienced wait — Peters moved INT 33.3→34.3 s while AWT moved 20.6→85.8 s (OM-16).
- Evidence: `HC5%` per VT-01 (`HC5/POP × 100`); bands per VT-03/VT-08 (T4: office 11–13 %, single-tenant/luxury ≥15 %, Grade-A ≥12 %, residential 5–7 %, hotel tower 8–12 % interpolated; INT 20–30 s office / 30–40 s hotel / 40–60 s apartment, "beyond 40 seconds occupants begin to complain"). The three-measure independence is the T3 Peters simulation carried in-corpus at OM-16: handling 14/15/16 % against AWT 20.6/38.9/85.8 s while INT moved only 33.3→34.3 s — two measures flat, one catastrophic, on the same group. Reference-case verdict under all three tests: INT 36.5 s (T4 "good" band), HC5 17.1 % of POP against 10 % demand, AWT 15–22 s under the host's 30 s patience, ρ 0.58 → **pass with margin**.
- Source: T4 bands (Sources 5, 6, 7) + T3 R. D. Peters, *The Application of Simulation to Traffic Design and Dispatcher Testing*, as carried in-corpus at OM-16 (Sources 3). No jurisdictional code was read setting the bands, and ISO 8100-32:2020's service classes could not be opened (Sources 11).
- Class: DESIGN PRINCIPLE (the three-test verdict is this file's procedure; the band values are T4 convention)
- Scope: universal.
- Confidence: Medium-High.
- Grid translation: emit `pass | marginal | fail` per group per period plus the worst-period verdict; "adequate" only when the binding period passes.
- Exceptions / failure mode: bands are UK/US commercial conventions; no code was read setting them (ISO 8100-32 classes: VT-12). A stricter AWT band costs cars faster than a stricter HC band. Failure symptom: a group certified on HC5% and INT while AWT sits at Peters' 85.8 s — or HC5% above the band as dead capital.

### VT-10 Estimate AWT as a multiple of interval, coefficient flagged
- Rule: `AWT ≈ f × INT`, `f ∈ [0.4, 0.6]`; publish the range and cross-check against VT-14.
- Evidence: the two opened values conflict — "Roughly 0.4 x interval" (Sources 5) vs "60% of the interval with static elevator calculations" (Sources 6), both T4, which is why the rule is a range and not a number. Terms: `AWT` = average waiting time at the hall call, `INT = RTT/L` (VT-01), `f` = the waiting-time coefficient. Applied to the reference case: `AWT = 0.4–0.6 × 36.5 = 15–22 s`, under the host's 30 s patience (MS-23). The congested cross-check is VT-14's `W_q` — 2.3 s at ρ = 0.58, 7.4 s at ρ = 0.75, 28.7 s at ρ = 0.90 — and the real collapse is OM-16's 20.6/38.9/85.8 s series, which no linear f reproduces.
- Source: Nazar Elevator — **T4**, read (Sources 5) · ATIS — **T4**, read (Sources 6). T4 × 2, contradictory on the same measure. CIBSE Guide D's up-peak waiting-time coefficient — **not read** (Sources 10).
- Class: HEURISTIC (rule-of-thumb coefficient; the proportionality to interval is the reliable part)
- Scope: uncongested groups (ρ ≲ 0.7).
- Confidence: Low on the coefficient, High on proportionality. `NEEDS VERIFICATION:` the up-peak waiting-time coefficient in CIBSE Guide D.
- Grid translation: report AWT as a range plus the congested estimate; publish `AWT_min_s, AWT_max_s` per group per period next to VT-14's `W_q_s`, and check the range against the portal's 30 s patience.
- Exceptions / failure mode: a linear rule cannot see saturation — near capacity AWT leaves it entirely (OM-16). The optimistic f understates complaint risk exactly where capacity is tight. Failure symptom: a lone AWT figure printed as pass/fail without the range or the queueing cross-check.

### VT-11 Convert cars into portals and hand off the stacking duties
- Rule: one car = one `portal`; a group shares one shaft cluster (MS-05) and `portal_count = L`; coordinates are frozen by MS-01 before floor 1; a car that cannot stop on a floor is a coverage failure (MS-11), not a traffic nuance.
- Evidence: host grid facts recorded in MS-01/MS-03/MS-11/MS-14 (per-floor grids sharing one origin, portals joined between floors); the plan minima come from `floor-plans.md` — car footprint ≥ 4×4 tiles, landing clear zone ≥ 5 tiles — on the host's `1 tile = 500 mm` (tile area 0.25 m²). Reference case: `portal_count = L = 4` guest cars plus 2 service cars in one bank = 6 shafts, one group sharing the cluster.
- Source: in-corpus (MS-01/MS-03/MS-05/MS-11/MS-14, `floor-plans.md`) + host arithmetic. No external source: the shaft-section tables that would validate a section (BS EN 81-20/50, ASME A17.1, the KONE *Elevator Planning Handbook*) were not read (Sources 11, 15).
- Class: ENGINEERING CONSTRAINT (host-grid consequence of the car count)
- Scope: every multi-floor build on this host.
- Confidence: High.
- Grid translation: assert `portals_in_group == L`, identical coordinates on every served floor, and `stop_set(portal) == served_floors`; lay the bank as ≥ 4×4 tiles per car with a ≥ 5-tile landing clear zone.
- Exceptions / failure mode: with no heights, shaft section cannot be validated — only the plan footprint. A wider bank cuts RTT and eats core area (MS-19, EC-07). Failure symptom: a car count met by portals that do not stack, or a floor left out of the stop set.

### VT-12 Select car load from traffic, then test the envelope and the code constants
- Rule: pick `P_rated` from the HC5 arithmetic, verify the car swallows the largest routine object (OM-15) — a traffic-optimal car that fails the envelope is not a design — and verify the kg↔persons conversion against the safety code, because traffic literature does not set it.
- Evidence: the envelopes are OM-15's read evidence — Mitsubishi stretcher 620×1880, bed 720×2040, dolly 550×550, 2,500 mm car depth, 750/1,000 mm doors; BASE4 24"×84", ≥3,500 lb, guest cab 6'-8"×5'-5" at 3,000–4,000 lb (Sources 4). The standards are named, **NOT read**: BS EN 81-20/50 (EU/UK), ASME A17.1 (US/Canada), ISO 8100-32:2020 — its OBP table returned 403 (Sources 11). Consequently this file's conversion `1,000 kg = 13 persons` is assumption A4, not a quoted table row, and the reference car is 13 persons rated / 10 loaded (A5, VT-05). Terms: `P_rated` = rated car load in persons, `car_kg` = rated mass, `door_mm` = door clear width.
- Source: BASE4 — **T3**, read (Sources 4) · Mitsubishi bed-lift literature via OM-15 — **T3/T4 manufacturer**, read — i.e. T3/T4 manufacturer literature as the source type, plus **T1 standard names (not read)**: BS EN 81-20/50, ASME A17.1, ISO 8100-32:2020 (Sources 11).
- Class: CODE REQUIREMENT (the envelope and the rated-load↔car-area conversion are code-set quantities — **none of the governing codes was read here**, see Confidence)
- Scope: universal; binds hardest in hospitals and hotels.
- Confidence: Medium-High on envelopes, Low on load-table conversions. `NEEDS VERIFICATION:` EN 81-20/A17.1 rated-load↔car-area, pit and overhead dimensions.
- Grid translation: record `car_persons, car_kg, door_mm, car_tiles(W×D)` and the object that set them; the car is validated in plan only (≥ 4×4 tiles, VT-11), never in section.
- Exceptions / failure mode: this file used `1,000 kg = 13 persons` as assumption A4 precisely because the table was not opened; ISO 8100-32's service classes likewise cannot be quoted. A code-minimum car is usually traffic-inefficient; a generous car lengthens RTT. Failure symptom: a car chosen by HC5 arithmetic that cannot take the building's own stretcher, bed or dolly.

### VT-13 Treat rated speed as a weak lever in short stacks
- Rule: speed buys back only the `2·H·tv` block. On the 250-key case, `tv` at 1.6 m/s = 2.53 s vs 2.11 s at 2.5 m/s → RTT 162 vs 146 s: an **11 % cycle change for a 56 % speed change**, because the stop and transfer blocks (38.2 + 25.0 = 63 s) never move. *Derived.*
- Evidence: computed here from VT-06/VT-07 (T2 constants, derived `tv` branch). At v_r = 1.6 m/s the flat branch still holds (`v_r²/a = 1.6²/1.5 = 1.71 m < h = 3.2 m`), so `tv = 3.2/1.6 + 1.6/3 = 2.53 s` against 2.11 s at 2.5 m/s; the travel block moves `2·H·tv` 82.4 → 98.7 s while `(S+1)·ts = 38.2 s` and `2·P·tp = 25.0 s` are speed-invariant, so RTT 146 → 162 s. Sensitivity consequence (Worked example, `v_r` row): `L_interval` 3.65 → 4.05 and the group goes to **5 cars** — a 56 % speed change buys or costs a whole shaft.
- Source: derived on T2 inputs (Sources 2 constants via VT-06/VT-07) · no manufacturer cost, machine-room or comfort data read.
- Class: FACT (arithmetic on declared inputs)
- Scope: stacks below ~30 landings; above that travel dominates and speed pays.
- Confidence: High (arithmetic on declared inputs).
- Grid translation: publish the RTT block decomposition and run the speed swap before recommending a faster lift; on this host `v_r` is only an input to the declared `RTT_s` parameter, never a built quantity (VT-24).
- Exceptions / failure mode: ignores machine-room, cost and comfort/jerk limits. In short buildings buy cars or cut door dwell, not kilowatts. Failure symptom: kilowatts bought for an 11 % slice of a cycle that stops and doors dominate.

### VT-14 Compute group utilisation and refuse to design above ~0.85
- Rule: model the group as M/M/c with `μ = P/RTT` persons/s, `λ = D_5/300`: `ρ = λ/(cμ)`, `ρ < 1` required; Erlang-C `C = (a^c/c!)(1/(1−ρ))·π₀`, `a = λ/μ`, `π₀ = [Σ_{k=0..c−1} a^k/k! + (a^c/c!)(1/(1−ρ))]⁻¹`; `W_q = C/(cμ − λ)`; `L_q = λ·W_q`. On the reference case (RTT 146, P 10, λ 0.16, μ 0.0685, a 2.34): c = 4 → ρ = 0.58, C = 0.27, `W_q = 2.3 s`; ρ = 0.75 → 7.4 s; ρ = 0.90 → 28.7 s. *Derived.* Waiting grows ~4× over the last 15 points of ρ (12× from 0.58) while the interval — a supply-side quantity — does not move.
- Evidence: formulas quoted from en.wikipedia.org/wiki/M/M/c_queue ("ρ = λ/(c μ)", "require ρ < 1", "`L_q = λ W_q`") and /wiki/M/M/1_queue ("ρ = λ/μ", "ρ/(1 − ρ)", "1/(μ − λ) − 1/μ = ρ/(μ − λ)") — Sources 9; the numbers are derived here. Terms: `c` = cars in the group (= `L`), `μ` = service rate per car in persons/s (`P/RTT`), `λ` = arrival rate in persons/s (`D_5/300`), `ρ` = group utilisation, `a = λ/μ` = offered load in Erlangs, `C` = Erlang-C probability of waiting, `π₀` = probability of an empty system, `W_q` = mean queueing wait, `L_q` = standing queue in persons. Reference arithmetic: `λ = 48/300 = 0.16`, `μ = 10/146 = 0.0685`, `a = 0.16/0.0685 = 2.34`, c = 4 → `ρ = 0.16/(4×0.0685) = 0.58`, `C = 0.27`, `W_q = 0.27/(4×0.0685 − 0.16) = 2.3 s`, `L_q = 0.16 × 2.3 ≈ 0.4` persons. The Worked example's ρ column runs the same algebra per perturbation: 0.47 (POP −20 %), 0.58 baseline, 0.70 (POP +20 %), 0.57/0.60 (floors ∓1), 0.62 (`ts` +1 s), 0.52 (v_r 1.6 m/s at 5 cars), **0.97 (α = 25 %, 6 cars) → fail**, where capacity merely equals demand. The cross-check is OM-16's Peters simulation (14/15/16 % → 20.6/38.9/85.8 s), which is the saturation this linear family cannot reach — hence "a floor on the estimate, never the verdict".
- Source: Wikipedia, *M/M/c queue* and *M/M/1 queue* — **T3 encyclopaedic**, read for the formulas (Sources 9); the numbers are derived here. The choice to model a lift group as M/M/c is this file's, with no standard behind it.
- Class: FACT (the quoted algebra) / HEURISTIC (the M/M/c model of a lift group, and the 0.85 ceiling)
- Scope: every group and period; it is the arithmetic OM-16 asserts qualitatively.
- Confidence: High for the algebra; Medium for modelling a lift group as M/M/c.
- Grid translation: publish `rho, W_q, L_q` per group per period and fail at `rho > 0.85`, consistent with OM-16's refusal of `utilisation > 0.9` and MS-23's `utilisation ≤ 0.85`; `μ` and `λ` come from the declared `RTT_s` and `D_5`, not from measurement.
- Exceptions / failure mode: **lift service is bulk, not per-passenger exponential** — M/M/c understates clumping at low ρ, and the real collapse is saturation (OM-16's 14/15/16 % → 20.6/38.9/85.8 s). A floor on the estimate, never the verdict. ρ ≤ 0.7 costs cars; ρ = 0.95 costs the building at its first surge. Failure symptom: a group approved at ρ = 0.97 because the formula still returns a finite wait.

### VT-15 Convert the modelled queue into tiles and check the pocket
- Rule: standing population `= λ × (INT/2 + W_q)`; tiles = persons × 1 tile (0.25 m²/person, packed end of the corpus density band); the pocket must not choke the through route.
- Evidence: `L_q = λW_q` (VT-14) extended by the head-on wait of up to half an interval before the next departure. Terms: `λ` = arrivals/s, `INT/2` = the mean wait before a car (VT-01), `W_q` = the queueing excess (VT-14). Reference case: standing population `= 0.16 × (36.5/2 + 2.3) = 0.16 × 20.6 ≈ 3.3 persons` → **4 tiles** at 1 tile/person (0.25 m²/person). The density band is carried in-corpus: HB-01/HB-20 standing density (1–2 tiles packed, ~5 comfortable, HCM/FHWA LOS bands), pocket geometry from HB-10/HB-11 (queue pocket in tiles, off the through-route), overflow fields from FL-17. Checked against `floor-plans.md` (≥ 4×4-tile car, ≥ 5-tile landing clear zone): a 2-tile-deep pocket holds the lift queue, and the 500-occupant lobby load is a check-in/seating problem, not a lift-queue problem (HB-11, PP-08 own it).
- Source: in-corpus T1-derived (HB-01/HB-20 carry the HCM/FHWA LOS bands; HB-10/HB-11; FL-17; `floor-plans.md`) + host arithmetic. No density source was opened in this file.
- Class: ENGINEERING CONSTRAINT (host tile arithmetic with a pocket test) / HEURISTIC (which end of the density band is picked)
- Scope: universal on this host.
- Confidence: High on method, Medium on the density choice.
- Grid translation: report `queue_persons, queue_tiles, pocket_tiles_available`, and whether spill blocks a door; place the pocket off the through route (HB-10/HB-11) and check it against the ≥ 5-tile landing clear zone.
- Exceptions / failure mode: a game queue earns no egress or accessibility credit — separate CODE-domain duties. Lobby tiles are the most expensive comfort purchase and the cheapest complaint preventer (PP-08, EC-04). Failure symptom: a pocket that holds the modelled queue but blocks a door, or a whole-lobby load misfiled onto the lift queue.

### VT-16 Model destination control as a computed stop reduction, not a vendor percentage
- Rule: DC cannot change `tv` or `ts`; it changes **S**. Zoning a 21-floor bank so a car serves a 7-floor band moves `S` from 8.1 (VT-05) to `7[1 − (6/7)^10] = 5.5`, cutting RTT by `2.6 × ts ≈ 11 s` (~7 %) and raising HC5 by the reciprocal at fixed cars. *Derived* — publish your own number.
- Evidence: mechanism derived here from VT-05/VT-06. Terms: `N` = landings served (21 for a full bank, 7 for a zone), `P` = 10 passengers/trip, `S` = expected intermediate stops, `ts` = 4.2 s per stop (VT-06), so `ΔRTT = ΔS × ts = (8.1 − 5.5) × 4.2 = 2.6 × ts ≈ 11 s` of a 146 s cycle (~7 %), and `HC5 = 300·P·L/RTT` rises by the reciprocal at fixed `L`. The opened Otis vendor course (Sources 8, T4) quantifies **only** travel time ("almost 50 percent faster") and energy ("34.7KWh … 47.8KWh … a savings of 27 percent") and gives **no** handling-capacity percentage — so no vendor gain figure is adopted anywhere in this file.
- Source: derived here + Otis vendor CEU course via BNP Media — **T4**, read (Sources 8) · Peters Research, *Understanding the Benefits and Limitations of Destination Dispatch* — **fetched, stream unreadable** (Sources 13) · CIBSE Guide D's DC section — **not retrieved** (Sources 10).
- Class: FACT (arithmetic of the `S` reduction) — the published DC gain percentages are unverified, see Confidence
- Scope: DC-served groups; irrelevant to conventional control.
- Confidence: High on the arithmetic, **Low on published DC gain percentages — none readable**. `NEEDS VERIFICATION:` published DC gains — Peters Research, *Understanding the Benefits and Limitations of Destination Dispatch* (Sources 13) and CIBSE Guide D's DC section.
- Grid translation: publish `S_conventional, S_allocated, RTT_delta, HC5_delta` per bank; zoning is expressible in plan as separate portal groups with their own `served_floors` (VT-11, MS-11), and the lobby consequence is VT-17.
- Exceptions / failure mode: a smaller `N` in the binomial idealises a real allocator, and zoning degrades for clustered demand (one banquet floor). DC buys capacity with lobby infrastructure and rigidity; where interval is already short it can worsen experience. Failure symptom: a vendor "50 %" substituted for a computed `S`, or a banquet floor stranded outside its own zone.

### VT-17 Re-plan the arrival lobby when destination control is chosen
- Rule: DC removes hall-call buttons and moves the queue from landing to arrival hall, so waiting geometry relocates: the landing pocket may shrink only if the arrival hall holds the same `queue_tiles` (VT-15) and entry→device→car stays inside MS-11's lobby-walk bound.
- Evidence: the opened Otis course (Sources 8, T4) describes input-placement flexibility, adjustable walking distances from entry fixtures to cars and integrated access control — **quantifying none**; the layout duty is in-corpus (HB-11/HB-13, MS-11's lobby-walk bound) and the tile arithmetic is VT-15's `queue_persons`/`queue_tiles`. No dimension in this rule comes from an external source.
- Source: Otis vendor CEU course via BNP Media — **T4**, read (Sources 8) · in-corpus HB-11/HB-13/MS-11/VT-15. No standard figure for arrival-hall area was read.
- Class: DESIGN PRINCIPLE (a relocation duty; every quantity is inherited from VT-15 and MS-11)
- Scope: DC installations only.
- Confidence: Medium on mechanism, Low on any dimension. `NEEDS VERIFICATION:` arrival-hall area per person-per-minute.
- Grid translation: when `control = destination`, move the pocket tile-set to the arrival hall and re-run VT-15 there; re-test the entry→device→car path against MS-11's lobby-walk bound in tiles × 0.5 m.
- Exceptions / failure mode: turnstile/security geometry is venue-specific; no standard figure was read. Arrival-hall area is bought against lobby grandeur and core share (MS-19). Failure symptom: a landing pocket deleted with the relocated queue left without tiles.

### VT-18 Hotels: compute guest and service groups separately, then cross-check the key ratio
- Rule: guest cars come from VT-08; the key ratio is a *sanity check*, never the method.
- Evidence: BASE4 (T3, US practice) verbatim: "one elevator bank per 75 keys", "two elevator cabs are sufficient" at 100–150 keys, "a third elevator be added" beyond 200 keys, "plus one service elevator for up to 100 keys", "approximately 100-200 fpm" in three- to five-storey hotels, guest cab "6'-8” x 5'-5”" at "3,000 – 4,000 lbs", walk to the room "should not exceed 150'"; the page cites the IBC for its height trigger (clause not read). Terms: `keys` = room count, `L` = cars from VT-08, `keys_per_car = keys/L`. Applied to the 250-key reference case: computed `L = 4` gives `keys_per_car = 250/4 = 63` against the 75 check, and the service limb `ceil(250/100) = 3` against the 2 adopted (Worked example, service group); the walk check is 150 ft = 300 tiles.
- Source: BASE4, https://www.base-4.com/select-the-right-elevator-2/ — **T3, US practice**, read (also Sources 4) · IBC — named by that page for its height trigger, clause not read.
- Class: BUILDING-TYPE CONVENTION (read T3 practice; its author labels it engineering practice, not a standard)
- Scope: hotels; the same discipline applies to RP-04's "one station per 75 guest rooms", which this rule **corroborates with a named T3 source**.
- Confidence: Medium — its author labels it engineering practice, not standard.
- Grid translation: compute `L` first, report `keys_per_car = keys/L` against 75 and explain divergence; check the room walk against 150 ft = 300 tiles (RP-04).
- Exceptions / failure mode: derived for low-to-mid-rise US hotels; silent on banquet and service pulses (VT-19). The key ratio over-cars a 40-storey tower and under-cars a resort with one huge lobby. Failure symptom: a car count produced by dividing keys by 75 instead of by RTT.

### VT-19 Hotels: size against the binding pulse, model each pulse separately
- Rule: four pulses — morning checkout (tower **down-peak**), arrivals/check-in (up-peak with luggage), banquet release (directional burst; VT-22), BOH shift change (service group) — each with its own `D_5`; the group is sized by the worst.
- Evidence: duty from MS-10 and HB-13. The only quantitative checkout anchor is the in-corpus FL-17 heuristic `persons_in = rooms × 0.5` per busiest 5 min = **≈25 % of POP** (250 × 0.5 = 125 persons against POP 480), roughly double every published band read here; this file adopts α = 10 % (A3) — see Weak or contested, and the Sensitivity row α = 25 %, which returns `L_capacity = 5.84` → 6 cars at ρ = 0.97 → **fail**. Shift-change arithmetic on the service group: 80 staff × 25 % in 5 min = 20 persons, with a larger `ts` on a goods car. Banquet release is directional, so it is VT-22's escalator case before it is a car-count case. Terms: `D_5` per pulse, `ρ` per group per pulse (VT-14).
- Source: in-corpus heuristic (FL-17) + MS-10/HB-13 duty. CIBSE Guide D's hotel per-type tables — **no edition opened**, which is why no published hotel α appears in this file (Sources 10).
- Class: HEURISTIC (the pulse percentages) + DESIGN PRINCIPLE (the duty to size on the binding pulse)
- Scope: hotels and resorts; generalises to any event-pulsed building.
- Confidence: Low on percentages, High on the requirement to split pulses.
- Grid translation: publish a pulse table (checkout / check-in / banquet / shift) with `D_5` and `rho` per group and name the binding pulse; each pulse is a `period` tag on the same portal group (VT-02, VT-11).
- Exceptions / failure mode: staggered checkout relocates the failure rather than removing it (FL-17's correction note). Worst-pulse design is expensive; average-day design breaks (OM-16). Recorded conflict: FL-17's ≈25 % against this file's α = 10 % (A3) — both cannot size one lobby (Weak or contested). Failure symptom: an up-peak-passing hotel that saturates at checkout.

### VT-20 Hospitals: dimensions govern, arithmetic second
- Rule: the bed/staff/visitor/BOH mix is a traffic problem, but the binding constraint is the trolley envelope and reserved operation — a car that cannot take a bed with companions is not fixed by adding cars. Run VT-08 per stream (patients, staff at shift change, visitors at visiting hours), separate groups.
- Evidence: OM-15's read evidence — Mitsubishi bed-lift literature incl. "Reserved Operation for Emergencies" and extended door-open, Oxford University BSDG C1.10/G1.1, BS EN 81-71:2022 via the Secured by Design Commercial Guide 2023 (UK jurisdiction). The envelope figures are OM-15's, carried at VT-12 (stretcher 620×1880, bed 720×2040, dolly 550×550, 2,500 mm car depth, 750/1,000 mm doors). **No opened source gives hospital traffic percentages**: the bed/staff/visitor/BOH population split and each stream's `α` are unavailable, so the streams are named, not quantified, and no hospital provision figure is asserted anywhere in this file — NHS HTM 08-02 and the FGI vertical-transportation chapter returned nothing readable.
- Source: T1/T3 as recorded at OM-15 (Mitsubishi bed-lift literature, Oxford University BSDG C1.10/G1.1, BS EN 81-71:2022 via the Secured by Design Commercial Guide 2023, UK jurisdiction) · NHS HTM 08-02 *Lifts* (2016, England) and the FGI *Guidelines* vertical-transportation chapter — **fetched, no extractable text** (Sources 12).
- Class: DESIGN PRINCIPLE (envelope-first ordering; the arithmetic limb is VT-08 reused per stream)
- Scope: healthcare and any setting with bed movement.
- Confidence: Medium-High on dimensions; **no opened source gives hospital traffic percentages — the inputs are the weak link, not the geometry**. `NEEDS VERIFICATION:` NHS HTM 08-02 *Lifts* (2016; fetched, no extractable text — Sources 12) and the FGI *Guidelines* vertical-transportation chapter.
- Grid translation: compute per stream, tag portals `patient|staff|visitor|service`, assert no stream shares a car during its pulse; each stream is its own portal group with its own coordinates (VT-11, MS-11).
- Exceptions / failure mode: ward-round and visiting-hour pulses need local operational counts. Bed cars are slow (large `ts`, low HC5%) and costly; stream separation multiplies shafts. Failure symptom: cars added to a group whose binding car cannot take a bed with companions.

### VT-21 Offices: check the lunch-time two-way case before believing the up-peak pass
- Rule: up-peak is rarely binding in offices; mid-day inter-floor and down-out traffic can exceed it where amenities are stacked, and interfloor traffic inflates `S` because pick-ups and set-downs both occur above the lobby. Compute two-way with the general form (VT-05) and add the interfloor share to `D_5`.
- Evidence: MS-10's period list supplies the duty; the RTT structure is from liftescalatorlibrary 00000226 (T2, Sources 2) — the two-way form `T_RT = (1 + ε)·P·(h̄/v) + 2(d_o + d_c)·P + n_f·t_0`, in which pick-ups and set-downs both add stops above the lobby, so `S`/`n_f` and the `2(d_o + d_c)·P` transfer block grow together. The band that gets exceeded is the office pair read at VT-03/VT-08 (11–13 % HC5, 20–30 s INT, T4). **No opened source gives the lunchtime interfloor percentage**, so the share is a placeholder here: only the arithmetic form is available.
- Source: proceedings paper 00000226 — **T2**, read for structure (Sources 2) · in-corpus MS-10 period duty · CIBSE Guide D's two-way tables — **not retrieved** (Sources 10).
- Class: DESIGN PRINCIPLE (the check; the arithmetic it invokes is VT-05's)
- Scope: offices, campuses, hospitals with ward-round traffic.
- Confidence: Medium. `NEEDS VERIFICATION:` on the interfloor fraction of POP per 5 min (Guide D two-way tables).
- Grid translation: model interfloor as a fraction of POP per 5 min added to `D_5`, never reuse up-peak `S` for it; publish the two-way record as its own `period` (VT-02) per portal group.
- Exceptions / failure mode: no opened source gives the lunchtime interfloor percentage. Amenity floors cause lunch failures and are a programme decision (MS-02). Failure symptom: an up-peak pass believed as "adequate" while lunch saturates the stacked amenity floors.

### VT-22 Escalators and moving walks: measured throughput, and when they replace lifts
- Rule: throughput is per unit width per speed and dwarfs a lift bank one-way. Measured at 1.0 m width: 0.50 m/s → 1.70–1.80 persons/s; 0.61 → 2.25; 0.65 → 2.47–2.57; 0.72–0.75 → 1.98–2.25. *Derived conversion:* 1.0 m at 0.5 m/s ≈ **6,100–6,500 persons/h** ≈ **6×** the 4-car reference bank's ≈990 persons/h — one direction only, short rise, no accessibility value. Step occupancy `d_step = 0.4 m`; 0.6 m → 1 person/step, 1.0 m → 2; capacity is nonlinear, `C ≈ O₀·v/(d + T·v)`, `T = 0.15–0.30 s`, costing 27 % at 0.5 m/s against the linear theoretical figure. EN 115-1:2017: horizontal flight 0.8 m at ≤0.50 m/s, 1.2 m at ≤0.65, 1.6 m at ≤0.75.
- Evidence: Gnendiger, Chraibi & Tordeux, *Come together: A unified description of the escalator capacity*, PLOS ONE 2023 (Sources 1) is read and supplies every figure in the rule: step depth `d_step = 0.4 m`; step occupancy 0.6 m width → 1 person/step, 1.0 m → 2; measured flow at 1.0 m width 0.50 m/s → 1.70–1.80 p/s, 0.61 → 2.25, 0.65 → 2.47–2.57, 0.72–0.75 → 1.98–2.25 p/s; the nonlinear capacity form `C ≈ O₀·v/(d + T·v)` with headway `T = 0.15–0.30 s` and a 27 % loss at 0.5 m/s against the linear theoretical figure; and the EN 115-1:2017 horizontal-flight values (0.8/1.2/1.6 m) **as quoted there**. Terms: `O₀` = step occupancy density, `d` = step depth, `T` = headway, `v` = speed. The hourly conversion is *derived here*: 1.70–1.80 p/s × 3600 ≈ 6,100–6,500 persons/h, against the reference bank's `HC5 = 82` persons/5 min × 12 = ≈990 persons/h → ≈6×.
- Source: https://pmc.ncbi.nlm.nih.gov/articles/PMC9987794/ — **T2, read** (also Sources 1) · BS EN 115-1:2017 — **T1, read only as quoted in that paper**, not opened (Sources 11).
- Class: FACT (measured throughput, plus standard figures as quoted by a read T2 paper)
- Scope: banquet release, retail level changes, transit pulses; on this host an escalator is a portal with continuous `service_rate` and no interval.
- Confidence: High.
- Grid translation: model `throughput = persons/s × 3600` with the 27 % practical discount, only where the pulse is directional (VT-19); declare the escalator portal's `service_rate` directly (MS-23) with no `RTT_s` and no `INT`.
- Exceptions / failure mode: measured at 1.0 m — do not scale linearly to 0.6 m; no intermediate landings; not an accessible route; one direction only, short rise. Escalators turn a queue into a ride but cost void height and give no night redundancy. Failure symptom: an accessible or bidirectional need answered by a 6× one-way number.

### VT-23 Sensitivity-test the design and name the binding variable
- Rule: minimum runs POP ±20 %, ±1 served floor, `ts` ±1 s, α across the published office bands; report which input flips the car count. A verdict without this is a guess.
- Evidence: method duty from `uncertainty.md`/`validation.md` and MS-10's "every figure that is a rule of thumb must be labelled as such"; the arithmetic is the **Worked example** sensitivity table, which carries `N`/`S`/`H`/RTT/`L_capacity`/`L_interval`/`L`/HC5 %/ρ for baseline, POP −20 % (384) and +20 % (576), floors −1 (20) and +1 (22), `ts` +1 s, `v_r` 1.6 m/s and α = 25 % (FL-17). Reading that table is the finding, not the arithmetic: **±1 floor and ±20 % population do not change the car count** (RTT 142/146/150/155 s, `L` = 4 throughout) because the design is interval-bound — therefore insensitive to demand and sensitive to the `INT_target` adopted, and weakly to door time. Only two perturbations bite: `v_r` down (5 cars) and α at FL-17's checkout heuristic (6 cars at ρ = 0.97, capacity merely equal to demand — saturation by definition, fails VT-14).
- Source: in-corpus method (`uncertainty.md`, `validation.md`, MS-10's rule-of-thumb labelling duty) + arithmetic in **Worked example**; the α perturbation range is the T4 band set (Sources 5, 6, 7).
- Class: DESIGN PRINCIPLE (procedure) — the perturbation results are FACT (arithmetic) once the inputs are fixed
- Scope: every traffic design.
- Confidence: High (arithmetic).
- Grid translation: publish the sensitivity table with `L` and `rho` per perturbation plus one sentence naming the binding variable; an agent who cannot open CIBSE Guide D should publish the α choice as the dominant design decision, not the shaft count.
- Exceptions / failure mode: sensitivity on a wrong α is still wrong — tier first (VT-24). The cheapest robustness is an operational lever (staggered checkout), visible only when the pulse assumption is tested. Failure symptom: a car count presented as a verdict with no input shown to be able to move it.

### VT-24 Compute at design time, validate at build time, publish the tier of every number
- Rule: **design time** (before tiles): `POP`, `α`, `D_5`, `P`, `S`, `H`, `tv`, `RTT`, `L`, `INT`, `HC5%`, `rho`, `L_q`, `queue_tiles`; **build time** (after tiles): portal count == L and coordinate stacking (MS-03/MS-14), stop coverage (MS-11), landing pocket and walk bound (HB-10/HB-11), service separation (OM-15, PP-04), core share (MS-19, EC-07). Every figure carries `tier ∈ {T1,T2,T3,T4,derived,assumption}`, and a verdict may not rest on an assumption where a standard exists — it must state that the standard was not read.
- Evidence: host facts — with no heights and no section, RTT reaches the build as a declared parameter, exactly as MS-10's grid translation already states; tier discipline from MS-10's confidence note and TH-29's "must not claim a specific target without consulting Guide E". The constant block this rule publishes, with the assumption tags the file actually uses:
  `h = 3.2 m (A1)`, `v_r = 2.5 m/s`, `a = 1.5 m/s²`, `j = 0.5 m/s³`, `d_o = 1.2 s`, `d_c = 1.0 s`, `t_b = 1.5 s`, `t_a = 1.0 s`, `td = 2.0 s (A2)`, `ts = 4.2 s`, `tv = 2.11 s`, `P = 0.80 × rated (A5)`, `car 13 p/1000 kg (A4)`, `α_hotel = 10 % (A3)`, `occupancy 1.6 + staff 0.32 per key (A1/A2)`, `single group N = floors−1 (A6)`, `1 tile = 0.5 m`, `1 queue person ≈ 1 tile`, `rho_max = 0.85`, `INT_target_hotel = 40 s`, `patience = 30 s (host default)`.
  The untagged items in that block are the T2 constants quoted at VT-06 (Sources 2); everything tagged A1–A6 is this file's declared assumption, and no Tier-1 table behind A4/A5/`INT_target` was read (Sources 10, 11).
- Source: in-corpus method (MS-03/MS-14/MS-11/MS-19, HB-10/HB-11, OM-15, PP-04, EC-07, TH-29, MS-10's confidence note) + host arithmetic (1 tile = 500 mm, `portal` objects with queues, default patience 30 s). No external source stands behind the tier discipline itself.
- Class: ENGINEERING CONSTRAINT (host contract: what may be computed when) + CODE REQUIREMENT (of this skill: the tier label and the "state that the standard was not read" duty)
- Scope: universal on this host.
- Confidence: High.
- Grid translation: carry and print the constant block above with its assumption tags; run the design-time list before tiles and the build-time asserts after them — portal count == L and coordinate stacking (MS-03/MS-14), stop coverage (MS-11), landing pocket and walk bound (HB-10/HB-11), service separation (OM-15, PP-04), core share (MS-19, EC-07) — and label every published number `tier ∈ {T1,T2,T3,T4,derived,assumption}`.
- Exceptions / failure mode: nothing here validates a shaft section, so a "compliant" portal is a throughput claim only and earns no code credit. Transparency lengthens the report; unlabelled numbers lengthen the building. Failure symptom: a verdict resting on an assumption where a standard exists, printed without the sentence saying the standard was not read.

## Traffic assumption table

| Building type | α (share of POP in peak 5 min) | HC5 target | INT target | Source & tier | Status |
|---|---|---|---|---|---|
| Office, multi-tenant | 11–13 % | 11–13 % | 20–30 s | nazarelevator T4; ATIS T4 (concordant) | usable, label T4 |
| Office, single-tenant / luxury | 15 % | ≥15 % | ≤25 s | nazarelevator T4; elevatorescalators T4 | usable, label T4 |
| Office, Grade-A | 11–13 % | ≥12 % | ≤30 s | elevatorescalators T4 | usable, label T4 |
| Residential / apartment | 5–7 % | 5–7 % | 40–60 s | ATIS T4 | usable, label T4 |
| Hotel tower | **10 % (A3)** | 8–12 % | 30–40 s | **interpolated; no hotel figure read** | `NEEDS VERIFICATION:` Guide D hotel tables |
| Hotel checkout pulse | FL-17 heuristic ⇒ ~25 % | — | — | in-corpus heuristic | **conflicts with every published band** |
| Hospital (patient/staff/visitor) | no figure read | — | — | — | `NEEDS VERIFICATION:` HTM 08-02, FGI VT chapter |
| Interval judgement | — | — | <30 s "excellent", 30–40 s "good", >40 s "occupants begin to complain" | nazarelevator T4 (verbatim) | usable, label T4 |
| AWT coefficient | — | — | `f = 0.4` (S5) vs `f = 0.6` (S6) → range | T4 × 2 | contested (VT-10) |
| Office density for POP | — | — | 1 person / 8–12 m² NIA | elevatorescalators T4 | VT-04 input |
| Car load factor | — | `P = 0.80 × rated persons` | — | nazarelevator T4 | convention (A5) |

## Worked example: 250-key hotel

Inputs (assumptions tagged; untagged constants are T2/T3 quoted):
- 250 keys; occupancy 1.6/key (A1) → 400 guests; staff 0.32/key (A2) → 80; **POP = 480** — reconciles
  with the host's ~500-occupant lobby level (the gap is booking vs capacity, VT-04).
- Lobby + **21 guest floors** → N = 21, one guest group, no zoning (A6); h = 3.2 m; v_r = 2.5 m/s;
  a = 1.5 m/s² (T2). Car 13 persons ≈ 1,000 kg (**A4 — NEEDS VERIFICATION vs EN 81-20/A17.1**);
  `P = 0.80 × 13 = 10.4 → 10` (A5).
- Blocks: `tv = 3.2/2.5 + 2.5/3 = 2.11 s`; `ts = d_o + td + d_c = 1.2 + 2.0 + 1.0 = 4.2 s` (td = A2);
  `tp = (1.5 + 1.0)/2 = 1.25 s`; α = 10 % (A3).
- Statistics (VT-05): `S = 21[1 − (20/21)^10] = 21 × 0.3861 = 8.1`;
  `H = 21 − Σ_{i=1..20}(i/21)^10 = 21 − 1.45 = 19.5`.
- Validity check (VT-07): h = 3.2 m < v_r²/a = 4.17 m, so a single hop is triangular (2.92 s); the flat
  `tv` for the long run makes RTT a lower bound by up to ~10 %.
- Cycle (VT-06): `RTT = 2(19.5)(2.11) + (8.1+1)(4.2) + 2(10)(1.25) = 82.4 + 38.2 + 25.0 = 145.6 ≈ 146 s`
  — travel 57 %, stops 26 %, transfer 17 %; door time, not speed, is the lever (VT-13).
- Demand (VT-03): `D_5 = 480 × 0.10 = 48` persons per 5 min at the binding checkout pulse.
- Cars (VT-08): capacity limb `48 × 146/(300 × 10) = 2.34` → 3; interval limb `146/40 = 3.65` → **4**.
  **The interval limb binds.**
- Result (VT-09/VT-10/VT-14): `INT = 146/4 = 36.5 s` (T4 "good" band);
  `HC5 = 300×10×4/146 = 82` persons/5 min = **17.1 % of POP**, far above the 10 % demand — the 4th car
  buys comfort, not throughput; `AWT = 0.4–0.6 × INT = 15–22 s`, under the host's 30 s patience (MS-23);
  λ = 0.16, μ = 10/146 = 0.0685, a = 2.34, c = 4 → **ρ = 0.58**, C = 0.27, `W_q = 2.3 s`, `L_q = 0.4`
  persons → **pass with margin**.
- Queue geometry (VT-15): standing population `= λ(INT/2 + W_q) = 0.16 × 20.6 ≈ 3.3 persons` → **4
  tiles** (1 tile/person); against the ≥4×4-tile car and ≥5-tile landing zone in `floor-plans.md`, a
  2-tile-deep pocket holds the lift queue — the 500-occupant lobby load is a check-in/seating problem,
  not a lift-queue problem (HB-11, PP-08 own it). Shaft plan size per car is **not** computed:
  `NEEDS VERIFICATION:` EN 81-20/50 and ASME A17.1 shaft envelopes (Sources 11).
- Service group (VT-18/VT-19): BASE4 (T3) "plus one service elevator for up to 100 keys" →
  ceil(250/100) = **3**; shift-change arithmetic (80 staff × 25 % in 5 min = 20 persons, larger `ts` on a
  goods car) needs **1–2**. Adopt **2** (1 goods sized to OM-15's ≥2,500 kg envelope + 1
  staff/bedroom-service) and record the divergence from the T3 ratio as a costed decision, as VT-18 asks.
- Deliverable: **4 guest cars** (13 persons, 2.5 m/s, 1,000 kg per A4) + **2 service cars**, one bank,
  INT 36.5 s, HC5 17 %, AWT 15–22 s, ρ 0.58, 4 queue tiles, 6 shafts, `keys_per_car = 63` vs BASE4's 75.

Sensitivity (VT-23):

| Perturbation | N | S | H | RTT (s) | L_capacity | L_interval | L | HC5 % (demand %) | ρ |
|---|---|---|---|---|---|---|---|---|---|
| Baseline | 21 | 8.1 | 19.5 | 146 | 2.34 | 3.65 | 4 | 17.1 (10) | 0.58 |
| POP −20 % (384) | 21 | 8.1 | 19.5 | 146 | 1.87 | 3.65 | 4 | 17.1 (8) | 0.47 |
| POP +20 % (576) | 21 | 8.1 | 19.5 | 146 | 2.80 | 3.65 | 4 | 17.1 (12) | 0.70 |
| Floors −1 (20) | 20 | 8.0 | 18.6 | 142 | 2.27 | 3.55 | 4 | 17.6 (10) | 0.57 |
| Floors +1 (22) | 22 | 8.2 | 20.5 | 150 | 2.40 | 3.75 | 4 | 16.7 (10) | 0.60 |
| ts +1 s (door spec) | 21 | 8.1 | 19.5 | 155 | 2.48 | 3.88 | 4 | 16.1 (10) | 0.62 |
| v_r 1.6 m/s (VT-13) | 21 | 8.1 | 19.5 | 162 | 2.59 | 4.05 | 5 | 19.3 (10) | 0.52 |
| α = 25 % (FL-17) | 21 | 8.1 | 19.5 | 146 | 5.84 | 3.65 | 6 | 25.7 (25) | 0.97 → **fail** |

\* floors rows recomputed from the same four blocks with the changed `S`/`H`; car rated 13, loaded 10
throughout.

Reading of the table (the finding, not the arithmetic): **±1 floor and ±20 % population do not change
the car count** — the design is interval-bound, therefore insensitive to demand and sensitive to the
`INT_target` adopted, and weakly to door time. Only two perturbations bite: `v_r` down (5 cars) and α at
FL-17's checkout heuristic (6 cars at ρ = 0.97, capacity merely equal to demand — saturation by
definition, fails VT-14). An agent who cannot open CIBSE Guide D should publish the α choice as the
dominant design decision, not the shaft count.

## Calculation ladder

"If you only know X, assume Y" — climb in order and publish the rung:

| Know | Assume / derive | Then compute | Confidence |
|---|---|---|---|
| keys only | occupancy 1.6 + staff 0.32 per key (A1/A2) | POP | Low — declared assumption |
| keys + floors | above, h = 3.2 m, one guest group, N = floors − 1 (A6) | POP, N | Low |
| POP + N | car 13 p (A4), `P = 0.80 × rated` (A5), α = 10 % (A3), v_r = 2.5 m/s, a = 1.5 m/s², ts = 4.2 s, tp = 1.25 s | S, H, tv → RTT | Medium (constants T2, factors A/T4) |
| RTT + N only | `INT_target` from the band table (hotel 40 s) | `L = max(RTT/INT, D_5·RTT/(300P))` | Medium |
| L + RTT | `μ = P/RTT`, `λ = D_5/300` | ρ, C, W_q, L_q | High for the algebra; M/M/c is a floor on reality |
| queue persons | 1 tile/person (packed end of HB-01) | pocket tiles, lobby depth | High (host arithmetic) |
| only a lobby occupant load | treat it as POP_design, α = 10 % | the whole chain from RTT | Low — where the design is genuinely unverifiable |
| a measured host cycle (`RTT_tiles`) | MS-10's `supply_per_hour = car_load × 3600 / RTT_tiles` | per-portal supply, then this file's measures | Medium — a declared parameter, not a measurement |

## Sources

Opened and quoted this pass:

1. Gnendiger, Chraibi & Tordeux, *Come together: A unified description of the escalator capacity*,
   PLOS ONE 2023 — https://pmc.ncbi.nlm.nih.gov/articles/PMC9987794/ — **T2**. Quoted: step depth 0.4 m;
   0.6 m → 1 person/step, 1.0 m → 2; measured flow (1.0 m width) 0.50 m/s → 1.70–1.80 p/s, 0.61 → 2.25,
   0.65 → 2.47–2.57, 0.72–0.75 → 1.98–2.25 p/s; `C ≈ O₀v/(d+Tv)`, T = 0.15–0.30 s, 27 % loss at 0.5 m/s;
   EN 115-1:2017 flights 0.8/1.2/1.6 m. → VT-22.
2. Proceedings paper, *The Round Trip Time Simulation: Monte Carlo Implementation…* —
   https://liftescalatorlibrary.org/paper_indexing/papers/00000226.pdf — **T2**. Quoted: RTT block
   structure `T_RT = (1 + 0.34)×P×(h̄/S) + 2(d_o+d_c)P + n_f t_0` (symbol gloss internally inconsistent —
   VT-05) and `d_o = 1.2 s`, `d_c = 1.0 s`, `t_b = 1.5 s`, `t_a = 1.0 s`, `a = 1.5 m/s²`,
   `j = 0.5 m/s³`, `v_r = 2.5 m/s`, `H_f = 3.5 m`; timings attributed there to CIBSE Guide D, Barney,
   EN 81, ASME A17.1. → VT-06, VT-07, VT-13.
3. R. D. Peters, *The Application of Simulation to Traffic Design and Dispatcher Testing*, 3rd Symp. on
   Lift and Escalator Technologies —
   https://peters-research.com/index.php/papers/the-application-of-simulation-to-traffic-design-and-dispatcher-testing/
   — **T3**; carried in-corpus at OM-16 (14/15/16 % → 20.6/38.9/85.8 s; INT 33.3→34.3 s).
   Cross-referenced, not duplicated. → VT-09, VT-14.
4. BASE4, *Select the right elevator for your next hotel* —
   https://www.base-4.com/select-the-right-elevator-2/ — **T3, US**. Quoted: one bank per 75 keys;
   100–150 keys → 2 cabs; >200 keys → 3rd; +1 service lift per up to 100 keys; 100–200 fpm (3–5
   storeys); guest cab 6'-8"×5'-5", 3,000–4,000 lb; medical transport ≥3,500 lb; ≤150 ft walk. → VT-12,
   VT-18, worked example.
5. Nazar Elevator, *How to calculate elevator handling capacity and interval* —
   https://nazarelevator.com/en/blog/how-to-calculate-elevator-handling-capacity-and-interval — **T4**.
   Quoted verbatim: "`P = rated persons x 0.80`", "`S = N x [1 - (1 - 1/N)^P]`",
   "`H = N - sum from i=1 to N-1 of (i/N)^P`", "`RTT = 2 x H x tv + (S + 1) x ts + 2 x P x tp`",
   "`Interval = RTT / L`", "`Handling capacity = 300 x P x L / RTT`",
   "`%POP = handling capacity / building population x 100`", "Roughly 0.4 x interval", office "15 %" and
   "11 to 13 %", the 30/40 s interval bands; its own worked-example constants (stop cost 9.0 s, transfer
   1.2 s, single-floor travel 2.19 s) are **not adopted** here. → VT-01, VT-03, VT-05–VT-10.
6. ATIS, *Optimizing Elevator Systems: The Role of Traffic Analysis* —
   https://atis.com/posts/optimizing-elevator-systems-the-crucial-role-of-traffic-analysis-in-building-design
   — **T4**. Quoted: office 11–13 %, residential 5–7 %; INT 20–30 s / 40–60 s; "60% of the interval with
   static elevator calculations". → VT-03, VT-08, VT-10.
7. Elevator & Escalators (trade), *Traffic Analysis for Office Towers* —
   https://www.elevatorescalators.com/blogs/traffic-analysis-office-tower — **T4**. Quoted: HC-5 and
   interval definitions, "1 person per 8–12 m² NIA", Grade-A ≥12 % / ≤30 s, luxury ≥15 % / ≤25 s. →
   VT-01, VT-04, VT-09.
8. Otis vendor CEU course via BNP Media, *Destination Dispatch Elevator Systems Benefit …* —
   https://continuingeducation.bnpmedia.com/courses/otis-elevator-company/destination-dispatch-elevator-systems-benefit-passengers-building-owners-and-design-professionals/
   — **T4**. Quoted: "almost 50 percent faster"; "34.7KWh … 47.8KWh … a savings of 27 percent"; no HC
   percentage given. → VT-16, VT-17.
9. Wikipedia, *M/M/c queue*, *M/M/1 queue* — https://en.wikipedia.org/wiki/M/M/c_queue ,
   https://en.wikipedia.org/wiki/M/M/1_queue — **T3 encyclopaedic**. Quoted: `ρ = λ/(c μ)` with "require
   ρ < 1", Erlang C `C(c, λ/μ)`, `L_q = λ W_q`; `ρ = λ/μ`, `ρ/(1−ρ)`, `1/(μ−λ) − 1/μ = ρ/(μ−λ)`. → VT-14.

Named but NOT read this pass — obligations, not citations:

10. **CIBSE Guide D** (UK) — per-type HC5/INT/AWT target table, hotel and hospital α, two-way and
    down-peak tables, DC effects, AWT coefficient. No edition opened, so no Guide D figure appears
    above; the corpus disagrees on its title (Weak or contested).
11. **BS EN 81-20/50** (EU/UK), **ASME A17.1** (US/Canada) — rated-load↔car-area, shaft, pit and overhead
    tables (named by source 2 as the home of the timing/comfort conventions, not read). **ISO
    8100-32:2020** (international, planning and selection of passenger lifts) —
    https://www.iso.org/obp/ui/#iso:std:iso:8100:-32:ed-1:v1:en:tab:1 returned **403**; its
    quality-of-service classes are `NEEDS VERIFICATION`. **BS EN 115-1:2017** — read only as quoted in
    source 1.
12. **NHS HTM 08-02, *Lifts* (2016, England)** —
    https://www.england.nhs.uk/wp-content/uploads/2021/05/Lifts.pdf — fetched, no extractable text;
    likewise the **FGI Guidelines** vertical-transportation chapter
    (https://www.healthfacilityguidelines.com/ViewPDF/ViewIndexPDF/Vertical_Transportation_System). No
    hospital provision figure is asserted anywhere in this file.
13. Peters Research, *Improvements to the Up Peak Round Trip Time Calculation* (301 →
    https://download.peters-research.com/library/Improvements_to_the_Up_Peak_Round_Trip_Time_Calculation.pdf)
    and *Understanding the Benefits and Limitations of Destination Dispatch* — both fetched, both streams
    unreadable. The titles confirm the up-peak formula has documented error modes and DC benefits have
    documented limits; **no figure taken**.
14. *Beyond the Up Peak* (https://liftescalatorlibrary.org/paper_indexing/papers/00000430.pdf) and
    *Expert Systems for Lift Traffic Design* (…/00000171.pdf) — fetched, no extractable text (corpus
    precedent: MS-10 records 00000430 as unreadable).
15. KONE, *Elevator Planning Handbook* and *Planning Guide: Escalators, ramps and autowalks* —
    https://www.kone.com/en/Images/8559_Global_EN_Elevator_Planning_Handbook_tcm17-75237.pdf ,
    https://distributors.kone.com/en/Images/KONE-Escalator-Planning-Guide_tcm90-100695.pdf — fetched,
    streams unreadable; shaft tables therefore `NEEDS VERIFICATION`.
16. AdSimulo University, *Basics of Lift Traffic Analysis* / *Lift Performance Criteria* —
    https://adsimulo.com/support/adsimulo-university/basics-of-lift-traffic-analysis/ ,
    https://adsimulo.com/support/adsimulo-university/lift-performance-criteria/ — bodies render
    client-side (only JS/CSS returned), confirming MS-10's finding; VTPlanner
    https://www.vtplanner.com/rtt-interval-handling-capacity/ renders formulas as images; Elevator World
    *Fundamentals of Traffic Analysis* — **403**.

## Weak or contested

- **Conflict with FL-17 on the hotel checkout.** FL-17's `persons_in = rooms × 0.5` per busiest 5 min is
  ~25 % of a 250-key hotel's population — roughly double every published α band read here (office 11–15
  %, residential 5–7 %). Taken literally it needs 6 cars at ρ = 0.97, i.e. capacity merely equal to
  demand. Both figures cannot size one lobby; this file adopts α = 10 % (A3) and flags the divergence,
  which FL-17's own confidence line already admits ("our heuristic"). Closing it needs Guide D's hotel
  table.
- **FL-17's band wording is half-supported.** "5-minute handling ≥ 11–13 % standard for offices/hotels":
  the office half is corroborated by two independent T4 sources; the **hotel half is unsupported** —
  nothing opened puts hotels at 11–13 %, and nazarelevator treats hotel/residential as structurally
  different and lower. Narrow FL-17 to offices when next touched.
- **AWT coefficient contradicted:** `f = 0.4` (S5) vs `f = 0.6` (S6) for the same measure, so AWT is
  published as a range (VT-10) and never as a lone pass/fail number without the VT-14 cross-check.
- **M/M/c is not a lift group.** Exponential per-person service ignores bulk boarding and cyclic
  departure; it agrees in shape at low ρ and collapses as ρ→1, where Peters' simulation (OM-16) locates
  real saturation. Use both; trust neither alone.
- **Guide D's identity is contested inside this corpus.** `multi-scale.md` calls it *Transportation
  Systems in Buildings* (the 2000 title), FL-17 calls it *Transition in Buildings* (a later edition),
  MS-10 points to "Guide D §2". No edition was opened, so no Guide D figure is cited here and the
  corpus cannot adjudicate — record edition, year and jurisdiction when read.
- **No Tier-1 or Tier-2 traffic target table was reachable.** Every HC5/INT band is T4; the T2/T3 PDFs
  that should carry them (sources 13–14) returned unreadable streams. Treat the assumption table as
  provisional — sound for comparison and sensitivity, not for certification.
- **Hotel and hospital α are gaps, not values**, declared as such wherever used; and the general-traffic
  coefficient ε (VT-05) remains symbolic for the same reason.
- **Derived figures are this file's arithmetic**: hourly escalator conversions, RTT block shares,
  ρ/W_q/L_q values, the DC `S` reduction and the whole sensitivity table were computed here from quoted
  constants and inherit their inputs' tier, not the sources'.
- **Up-peak statistics may be over-optimistic in low stacks.** VT-07 shows the flat `tv` under-reports
  stop-start time whenever `h < v_r²/a`, so this file's RTT is a lower bound there — the same error mode
  the unread *Improvements to the Up Peak Round Trip Time Calculation* is titled around.

## Type-specificity audit

- **Universal:** VT-01–VT-11, VT-14, VT-15, VT-23, VT-24.
- **Hotel (this repo's flagship):** VT-03's missing α, VT-04 (keys × occupancy), VT-18 (key-ratio check,
  75 keys, T3), VT-19 (checkout / check-in / banquet / shift pulses), the worked example. Decisive
  difference from an office tower: the binding hotel period is a **down-peak**, so up-peak-only sizing
  systematically under-provides at checkout.
- **Hospital:** VT-12, VT-20 — envelopes and reserved operation bind before HC arithmetic; hospital
  traffic percentages are this file's weakest data and must be replaced by local operational counts.
- **Office:** VT-21 (lunch two-way, interfloor share), the 11–13 % / 20–30 s bands (the only type with
  two concordant T4 sources), VT-04's density figure.
- **Residential:** VT-08's interval limb is the whole design (5–7 % HC, 40–60 s INT); capacity almost
  never binds, which is why single-car groups persist.
- **Transit / assembly (banquet, theatre, stadium, terminal):** VT-22 — a directional pulse is an
  escalator problem, not a car-count problem (one 1.0 m escalator ≈ 6× a 4-car bank, one way).
- **This host specifically:** heights do not exist, so VT-07's kinematic `tv` is design-time only and
  reaches the build as a declared `RTT_s` per portal, which MS-10's supply formula and MS-23's service
  rate consume unchanged; VT-11, VT-15, VT-17 and VT-24 are the build-time asserts; no rule here earns
  egress or accessibility credit (CODE domain's separate duty).
