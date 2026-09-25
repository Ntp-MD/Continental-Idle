# Research file — Domain AE: Building services sizing (the load behind every shaft, duct and plant room)

Scope: the **quantity layer**. The corpus already says *where* services go — `construction.md` CN-11…CN-20 (stack risers in one vertical zone, size a shaft by the biggest thing that must fit, plant that can be reached / breathed into / unloaded, gravity fall costs horizontal distance, wet-cell stacking, corridor service band) and `operations-maintenance.md` OM-17…OM-21 (plant-room entry geometry, replacement path, riser cupboards, metering and isolation) — and `multi-scale.md` MS-05 / MS-20 (cluster the shafts; one named riser per service per cluster). None of them says **how much** a space needs: airflow, water flow, electrical load, sprinkler demand, pipe and duct calibre — and therefore what the shaft and the plant room actually cost in tiles. This file supplies that arithmetic and nothing else: where a number here implies a placement decision, the placement rule is cited by ID (CN-11, OM-17, MS-20) and not restated.

Boundary, so nobody doubles up:

| Question | Owner |
|---|---|
| Does the shaft exist, is it stacked, is it reachable, is it rated | CN-11, CN-13, CN-19, MS-05, MS-20, OM-19 |
| What size the shaft / duct / pipe / plant room must be, and which load produced that size | **this file** |
| Where plant sits relative to sensitive rooms; removal-path geometry | CN-14, CN-15, OM-17, OM-18 |
| What the plant consumes (air, water, power, heat rejection) and the area that implies | **this file** |
| Drain-slope rule and cleanout spacing | CN-17, CN-20 — this file only adds the numbers for stack calibre and the distance each fall buys |
| Compartment boundaries, smoke zoning, the sprinkler *credit* | CODE-07, CODE-15, CODE-25, CN-13 — this file only the hydraulic and airflow demand behind them |
| BOH share of programme | PP-02, PP-03 — this file supplies the loads that silently eat it |

Host grid: `1 tile = 0.5 m × 0.5 m`, `4 tiles = 1 m²`, `2 tiles = 1.0 m`; tile states `walkable | blocked | door` only. **There is no section, no height, no diameter, no slope.** Every quantity below is therefore converted to a plan area in tiles or a horizontal distance in tiles; anything that cannot survive that conversion is flagged, not hidden.

Inherited declarations (from `environmental-design.md`, restated because rules here depend on them): floor-to-floor 3.0 m, clear height 2.7 m. New declarations owned by this file: service zone above a corridor ceiling 0.6 m (SV-13); pipe/duct insulation envelope 50 mm over the calibre (heuristic, flagged in SV-14); design water velocities and duct velocities as stated per rule.

Unit discipline: 1 cfm = 0.472 L/s; 1 cfm/ft² = 5.08 L/(s·m²); 1 ft² = 0.0929 m²; 1 VA/ft² = 10.76 VA/m²; 1 gpm = 0.0631 L/s; 1 BTU/h = 0.293 W; 1 ton refrigeration = 12,000 BTU/h = 3.517 kW; 1 in. water gauge = 249 Pa; water ρcp = 4.19 kJ/(L·K); air ρcp = 1.2 kg/m³ × 1.005 kJ/(kg·K) = 1.206 kJ/(m³·K) → 0.335 W·h/(m³·K). Conversions are arithmetic; the *rates* are cited.

---

## Rules

### SV-01 Compute outdoor air as two terms — people and floor — and name the table you read them off
- Rule: Ventilation demand for a space is `Vbz = (Rp × people) + (Ra × zone floor area)`, with people from the programme's density assumption, not from a tile count. Every rate carried into a plan must name its standard, edition and table, and must be stated in both metric and imperial. Where the design has no named standard, declare the jurisdiction's adopted mechanical code instead of inventing a number.
- Evidence: The two-term Rate Procedure structure is ASHRAE 62.1 (people term + area term, divided by zone air-distribution effectiveness); the per-space numbers themselves were not machine-readable in any ASHRAE file retrieved this pass, so this file quotes the adopted-code reproduction of that table in the New York City Mechanical Code 2022, Table 403.3.1.1, which prints columns `Density (#/1,000 ft²) | Rp (cfm/person) | Ra (cfm/ft²) | Exhaust (cfm/ft²)`. Retrieved hotel-relevant rows: guest room 10 / 5 / 0.06; office 5 / 5 / 0.06; corridor — / — / 0.06; lobby 30 / 7.5 / 0.06; dining 70 / 7.5 / 0.18; kitchen (cooking) — / 7.5 / 0.12 + 0.7 exhaust; retail sales 15 / 7.5 / 0.12; gymnasium (weight) 10 / 20 / 0.06; swimming pool — / — / 0.48; warehouse — / — / 0.06. In SI those are: guest room Rp 2.4 L/s·person, Ra 0.30 L/(s·m²); dining Rp 3.5, Ra 0.91; kitchen Ra 0.61, exhaust 3.6 L/(s·m²).
- Source: NYC Mechanical Code 2022, Ch. 4, Table 403.3.1.1 — https://up.codes/viewer/new_york_city/nyc-mechanical-code-2022/chapter/4/ventilation (T1, adopted code; **the adoption is not the ASHRAE text and the ASHRAE edition it mirrors was not confirmed**). Structure and the "62.1 numbers were not retrievable" caveat: ASHRAE 62.1-2016 addendum S PDF — https://www.ashrae.org/file%20library/technical%20resources/standards%20and%20guidelines/standards%20addenda/62.1-2016/62_1_2016_s_20190726.pdf (named, not readable this pass). Cross-ref `environmental-design.md` EN-21/EN-25, which deliberately left these cells empty.
- Class: STANDARD
- Scope: any mechanically ventilated space; values are jurisdiction-specific
- Confidence: High (structure), Medium (the row values, which come from one adoption, not from the standard)
- Grid translation: `OA(room) = Rp × occ(room) + Ra × (tiles/4)` in L/s. `occ(room)` comes from the density column of the same table, not from furniture tiles: guest room 10/1,000 ft² = 1 person per 9.3 m² (37 tiles); office 5/1,000 ft² = 1 per 18.6 m². Publish a per-floor OA total in L/s beside the shaft schedule (SV-28).
- Exceptions / failure mode: Density-driven spaces (lobbies, gyms, restaurants) sized on area alone; area-driven spaces sized on people alone. Symptom: a 448-key tower whose fresh-air shaft was sized as a bathroom extract.

### SV-02 Air-change rates are an *extract* instrument; do not use them as the ventilation rate
- Rule: Air-change rates appear in codes only where the pollutant is generated by the room (cooking, vehicles, damp, dryers) — they are an extract instrument, never a substitute for SV-01's ventilation rate.
- Evidence: Retrieved code rows — kitchen (cooking) exhaust 0.7 cfm/ft² = 3.6 L/(s·m²); private toilet/bath 25 cfm continuous or 50 cfm intermittent; public toilet 70 cfm continuous or 50 cfm intermittent; retail dressing rooms and sports locker rooms 0.25 cfm/ft²; uninhabited spaces 0.02 cfm/ft² where RH > 60 %; parking garage 0.75 cfm/ft² with a reduced-flow floor of 0.05 cfm/ft². Where only an air-change standard exists, use it with its scope: the UK domestic practice quotes 0.5 ACH for kitchens, bathrooms/shower rooms and store rooms.
- Source: NYC MC 2022 Table 403.3.1.1 and §406.1 (T1, as SV-01); MCS Heat Load Calculator reference page citing CIBSE Domestic Heating Design Guide (2026) Table 2-18 for the 0.5 ACH figures — https://heatloadcalculator.mcscertified.com/docs/reference-sources/ventilation-rates (T3 for the calculator, T1/T3 for the guide).
- Class: CODE REQUIREMENT (US rows) / STANDARD (UK rows)
- Scope: extract design; not a substitute for SV-01
- Confidence: High (values are code text as retrieved), Medium (the 25/50 and 50/70 pairs must be re-read against the edition in force — continuous-vs-intermittent labelling was not fully legible in the retrieval)
- Grid translation: per wet cell, add `extract = max(code row)` and convert: 50 cfm = 24 L/s. A bathroom needing 24 L/s of extract needs a duct, not a pipe — the smallest practical extract duct is ~100 mm dia = 0.008 m², i.e. **0.03 tile of section but a 0.5 m ceiling zone**; record it against SV-13, not against the shaft table.
- Exceptions / failure mode: Rooms that are both density-driven and pollutant-driven (a hotel bathroom opening onto a corridor): the two rates add in practice, and only one is usually drawn. Symptom: corridor odour complaints diagnosed as an operations problem.

### SV-03 Extract every wet cell, and count the duct as a riser
- Rule: Each bathroom that cannot open to outside air carries a permanent extract, and each extract path is a vertical service that must be stacked (CN-11), sized (this rule) and reached (OM-19). Duct count = wet-cell groups per cluster, not wet cells per floor.
- Evidence: Private bath/toilet exhaust is mandated in the retrieved code table (SV-02) and recirculation is prohibited for it (§403.2.1(3)/(4) note b/g).
- Source: NYC MC 2022 Ch. 4 (T1) as SV-01; stacking and cupboard geometry by ID: CN-11, CN-12, OM-19.
- Class: CODE REQUIREMENT
- Scope: repeated-cell buildings
- Confidence: High
- Grid translation: `extract duct area = Σ cell flows ÷ velocity`, velocity declared at 5 m/s for a small vertical duct (engineering practice, not a retrieved limit — flagged SV-14). A guest floor of 28 cells at 24 L/s = 672 L/s → 0.134 m² → e.g. 0.45 × 0.30 m = **0.9 tile of shaft**. Two clusters → 1 tile each. Cheap: the *cost* is the 0.6 m ceiling zone it consumes on the way out (SV-13).
- Exceptions / failure mode: Transfer air through the undercut door instead of a duct — legal in some systems, but it makes the corridor the duct and defeats SV-01's per-floor total. Symptom: a "ventilated" bathroom whose air leaves through the bedroom.

### SV-04 Stair pressurisation: the pressure is code, the flow is engineering, and the duct is yours
- Rule: A pressurised stair is a fan + a vertical duct + a power supply + a shaft. Size the shaft for the duct before the stair is drawn on the plan; treat the flow figure as an engineer's output with a spatial placeholder, never as a number the agent asserts.
- Evidence: The code sets pressure bands, not flows: NFPA 92 "Table 4.4.2.1.1 specifies a minimum pressure difference of 0.05 in. of water gage", and "a numerical maximum pressure difference is not specified in NFPA 92" — the ceiling comes from the door-push-force limit (30 lbf / 133 N) in NFPA 101. For US smoke-control practice under IBC §909 the retrieved pair is 0.10 in. w.g. minimum and 0.35 in. w.g. maximum (25–87 Pa). Preliminary sizing in practice uses a per-floor heuristic of "300 to 550 cfm per floor", explicitly warned as valid only for structurally uniform projects; NFPA 92 itself does not prescribe fan sizing.
- Source: CSE Magazine, "NFPA 92 defines design, testing of smoke control systems" — https://www.csemag.com/nfpa-92-defines-design-testing-of-smoke-control-systems/ (T3); CSE Magazine, "Using a hybrid design approach to stairwell pressurization" — https://www.csemag.com/using-a-hybrid-design-approach-to-stairwell-pressurization/ (T3, source of the 0.10/0.35 pair and the 30 lbf limit); Structra Advisors, "Stairwell Pressurization Design — Looking Past the Rule of Thumb, Part 1" — https://structradvisors.com/insights/stairwell-pressurization-design-looking-past-the-rule-of-thumb-part-1/ (T4, source of 300–550 cfm/floor).
- Class: CODE REQUIREMENT (pressure bands) / HEURISTIC (flow)
- Scope: buildings where natural smoke-ventilation of the stair is not viable
- Confidence: Medium (bands), Low (flow) — `NEEDS VERIFICATION:` obtain NFPA 92 (current edition) §5 airflow/leakage-area method, or the equivalent EN 12101-6 / ISO 16959 calculation, plus the project's leakage measurement; without it no fan flow may be quoted.
- Grid translation: placeholder duct = `Q_floor × floors ÷ 9 m/s`; for 21 storeys at 300–550 cfm/floor (141–260 L/s/floor) the total is 3.0–5.4 m³/s → 0.33–0.60 m² → 0.8 × 0.5 m ≈ **5 tiles** of shaft, with a fan + louvre + power at the top or at intervals. `pressurised_stair` tag on the stair tile-set; assert the duct route is contiguous from fan to every landing injection tile.
- Exceptions / failure mode: One fan serving 21 floors exceeds a practical pressure/temperature-rise limit, so real towers split the stack into 2–4 fan zones, each needing its own duct or its own injection row — invisible until it is a second shaft. Symptom: a stair detailed with a "small duct void" that does not exist on the plan.

### SV-05 Car-park ventilation taxes the basement plate, and its failure is a width failure
- Rule: A closed garage is an exhaust machine: 0.75 cfm/ft² (3.8 L/(s·m²)) intermittent, with a continuously-on floor of 0.05 cfm/ft² (0.25 L/(s·m²)) and CO/NO₂ activation at 25 ppm / 500 ppb. That air has to enter and leave *across a ramped plate*, so supply/exject ducts compete with the manoeuvring envelope and the ceiling height the ramp needs.
- Evidence: NYC MC 2022 §404.1/§404.2 (T1, as SV-01) for the rates and trigger values; §406.1 for the 0.02 cfm/ft² uninhabited floor.
- Source: NYC Mechanical Code 2022, Ch. 4 §404 *Garages* and §406.1 — https://up.codes/viewer/new_york_city/nyc-mechanical-code-2022/chapter/4/ventilation (T1, one adoption; re-verify the edition in force).
- Class: CODE REQUIREMENT
- Scope: enclosed vehicle parking
- Confidence: High (rates as retrieved), Medium (trigger values, one adoption)
- Grid translation: per basement level, `Q = 3.81 L/(s·m²) × floor m²` (= 0.75 cfm/ft² × 5.08). A 1,500 m² level → 5,715 L/s = 5.7 m³/s → at 9 m/s, 0.63 m² of duct per path; with supply + two extract runs, expect **4–6 tiles of shaft per basement level** plus a fan deck and the car-park lighting figure of SV-17 (0.5 VA/ft²) on the same intake. Then check the *ramp section proxy*: the duct must fit under the headroom the ramp requires — unmodellable → `REQUIRES ENGINEERING VERIFICATION`.
- Exceptions / failure mode: Open-sided/mixed-mode parks waive mechanical ventilation entirely — declare the openness ratio. EV charging does not change the CO rule but changes the power (SV-21). Symptom: a "naturally ventilated" basement drawn as if it were open, then fitted with fans and no shaft.

### SV-06 A commercial kitchen is an airflow device first and a room second
- Rule: Extract is set by hood length, not by kitchen area: cfm per linear foot of hood by hood type and appliance duty. Make-up air must equal the exhaust, and it arrives at the room's own heat load.
- Evidence: IMC/Pennsylvania Mechanical Code 2021 §507.5 capacity of hoods, minimum net cfm per linear ft — very heavy duty: single island 700, centre island 550/side, wall-mounted 550; heavy duty: 600 / 400 / 400 (backshelf 400); moderate: 500 / 300 / 300; light: 400 / 250 / 250 (wall 200). Illinois Mechanical Code 2024 §508.1: make-up air "shall be supplied during the operation of commercial kitchen exhaust systems", §508.1.1 requires the supply-to-room temperature difference "not greater than 10 °F (6 °C)", §508.1.3 requires the full ventilation balance to be shown on the drawings.
- Source: https://up.codes/s/capacity-of-hoods (T1, PA Mechanical Code 2021 adoption of IMC Table 507.5); https://up.codes/s/commercial-kitchen-makeup-air (T1, IL Mechanical Code 2024).
- Class: CODE REQUIREMENT
- Scope: any kitchen with Type I hoods; scales to hotel banquet/service kitchens
- Confidence: High (as retrieved from two adoptions; the two texts differ in clause numbering — 507.5 vs the IMC numbering the corpus may expect, so re-verify the edition)
- Grid translation: worked — a 6.0 m (20 ft) wall canopy over heavy-duty equipment = 400 cfm/ft × 20 ft = **8,000 cfm = 3.78 m³/s**. Duct at 9 m/s → 0.42 m² → 1.2 × 0.35 m ≈ 3 tiles; make-up equals it → **6 tiles of shaft through every floor the kitchen stack passes**. Summer heat: 3.78 m³/s from 33 °C to 24 °C = `1.206 × 3.78 × 9` = **41 kW of coil**; winter from −5 °C to 18 °C = 104 kW. Add this to the plant area guide, not to the kitchen's programme area.
- Exceptions / failure mode: Recirculating extraction with captive filters removes the duct and adds the whole heat load indoors. Symptom: a kitchen "with no make-up air" that runs at negative pressure and will not let the dining-room doors open (CN-19's band never carried 3.8 m³/s).

### SV-07 Preliminary thermal load = area × density, with the density's provenance and expiry stated
- Rule: At concept, quote a load as `W/m²` or `kW/room` only with (a) the source, (b) the climate band it was measured for, (c) the vintage/fabric assumption inside it, and (d) the sensitivity: "double this for a hot-humid low-rise with full glazing, halve it for a well-oriented 2020s fabric" is a statement the plan can carry. If none of (a)–(d) is available, use the classification bands and call it a band.
- Evidence: Screening bands in practice: "below 30 W/m² is light, 30–60 moderate, 60–90 heavy, above 90 very heavy"; per-room hotel practice puts a standard guest room at 6,000–15,000 BTU/h = 1.8–4.4 kW; fan-coil / split terminals of 9,000–15,000 BTU/h are the usual response. Chilled-water practice: "the most common delta T is 10 °F, which results in 2.4 GPM/Ton".
- Source: calcengineer, *Hotel Guest Room HVAC Sizing* — https://calcengineer.com/hvac/hotel-guest-room-hvac-sizing/ (T4); Engineering Pro Guides, *HVAC Rule of Thumb Calculator* — https://www.engproguides.com/hvac-rule-of-thumb-calculator.html (T4, incl. the explicit caveat that magnitudes rise in "hotter/more humid climates" and that the 0.4 % design DB/WB values override defaults).
- Class: HEURISTIC
- Scope: concept/feasibility only; never a capacity claim
- Confidence: Medium (bands, because they are published and mutually consistent), Low (any single W/m² value presented without climate)
- Grid translation: `floor load kW = Σ (tiles/4) × W/m² /1000`, with the W/m² declared above the table. Report `kW per floor`, `kW per cluster` and `kW total after SV-09 diversity`. Where the load drives a duct, hand off to SV-13; where it drives a pipe, SV-12.
- Exceptions / failure mode: Façade gain on a fully glazed south/west elevation swamps the internal band; the band then belongs to the envelope, not the plan (`environmental-design.md` EN-12/EN-13 by ID). Symptom: a load density from a temperate office handbook used for a tropical hotel banquet floor.

### SV-08 Cross-check the room load against the room's air — the two numbers must be compatible
- Rule: Before trusting a per-room load, test it against the ventilation the same room requires. A guest room at 1.8–4.4 kW with ~20 m² of floor needs ~8–9 L/s of outdoor air (SV-01) — 4–5 % of the supply air of a fan-coil, which is why the OA duct, not the coil, is the awkward one.
- Evidence: 5 cfm/person + 0.06 cfm/ft² × 215 ft² (20 m²) = 17.9 cfm = 8.4 L/s (from SV-01's retrieved rows); practice puts hotel fresh air at "10–30 CFM (5–14 L/s) per room" (T4) — the two agree, which is the point of the check.
- Source: NYC MC 2022 Table 403.3.1.1 (T1, SV-01); calcengineer (T4, SV-07).
- Class: DESIGN PRINCIPLE
- Scope: repeated-cell buildings with per-room terminals
- Confidence: High (the compatibility test), Medium (both magnitudes)
- Grid translation: per room, emit `{OA L/s, load kW, supply L/s}`. Where `supply L/s` would exceed 2.5 m³/s the terminal stops being a ceiling item and becomes a shaft item → escalate to SV-13.
- Exceptions / failure mode: Rooms with high latent load and low sensible load (pool halls, spas): the *air quantity* is set by dehumidification, not by the W/m² band. `REQUIRES ENGINEERING VERIFICATION`. Symptom: a pool hall sized on a heat band and then handed back with a 2 m² duct.

### SV-09 Diversity is a real area saving, and it never applies to ventilation
- Rule: Apply a coincidence factor to *energy* loads (plant, generators, pumps), never to *air quantity* or to drainage fixture units. Publish both the connected and the diversified figure, and the factor's source.
- Evidence: "peak load coincidence across all rooms is typically 60–80 %" for hotel floors (T4). Contrast: the ventilation terms of SV-01 are per-zone minima with no diversity clause, and the drainage tables (SV-25) already embed a fixture-unit probability — applying a second diversity to either is double-counting.
- Source: calcengineer (T4, SV-07).
- Class: HEURISTIC
- Scope: any repeated-cell load; the band is hotel-specific
- Confidence: Medium (band), High (the "never on ventilation" rule, which follows from SV-01's structure)
- Grid translation: `plant kW = Σ room kW × 0.7` for a guest tower, stated next to the undiversified sum so the reader can re-weight. Duct and pipe sizes stay at 100 %.
- Exceptions / failure mode: A hotel with a large ballroom, gym and laundry on the same transformer — those coincide with each other and with the guest peak. Symptom: a diversified electrical intake that trips on the fourth floor's breakfast service.

### SV-10 Heating = fabric + air; in a hotel the heating load that binds is domestic hot water
- Rule: Estimate heating room by room as transmission `Σ U·A·(Ti − To)` plus ventilation `0.335 × ACH × V_room × ΔT` (W, with V in m³), then compare against the DHW and cooling loads before deciding what the plant room is for. Do not present a national fabric figure as a universal one.
- Evidence: EN 12831-1:2017 is the standard method for design heat loss (component-based; the retrieved guidance names transmission and ventilation/infiltration and defers the numbers to CIBSE and MCS calculators — the exact clause values were **not readable this pass**). Worked physics for a guest room 4.0 × 5.0 × 2.7 m = 54 m³ at 1 ACH and ΔT 20 K: ventilation `0.335 × 1 × 54 × 20` = 362 W. Fabric at 25 m² of envelope and U = 0.35 W/m²K, ΔT 20 K = 175 W. Total ≈ 0.54 kW per room vs 1.8–4.4 kW cooling (SV-07): in a mixed climate a hotel is cooling-led, and the boiler's real job is hot water.
- Source: Energy Saving Trust, *Heat loss calculations — detailed guidance* — https://greenheattoolkit.energysavingtrust.org.uk/t/heat-pump-installers-toolkit/heat-pump-system-design/heat-loss-calculations-detailed-guidance/ (T1 body; **method names only — no numbers were retrievable from the page**); CEN catalogue record prEN 12831-1 — https://standards.iteh.ai/catalog/standards/cen/2273ec20-0c6b-4ddd-bc42-20277952361f/pren-12831-1 (named, not read). The 0.335 W·h/(m³·K) constant is the conversion of air's ρcp (arithmetic).
- Class: STANDARD (method) / arithmetic (the worked number)
- Scope: temperate and mixed climates; inverts in cold climates and in heating-dominated residential
- Confidence: High (arithmetic), Low (U-values — declared, not sourced) — `NEEDS VERIFICATION:` hotel DHW draw per bed-night and the CIBSE Service Water / ASPE Vitor diversity tables — obtain one of them; until then no hot-water plant capacity may be claimed.
- Grid translation: per room emit `{fabric W (declared U), ventilation W (from tiles × 2.7 m), DHW L/night (input)}`; sum to `plant heating kW`. Where the ventilation term exceeds the fabric term, the answer is heat recovery, not a bigger boiler — tag the recovery unit's air path (SV-06's make-up pattern).
- Exceptions / failure mode: Deep-plan rooms with no fabric loss but full ventilation load — heating and cooling run simultaneously; this is a plant-arrangement problem (four-pipe / heat-recovery), not a capacity problem. Symptom: a "heating not required" note on a plan with 448 rooms that all need 45 °C water.

### SV-11 The "one machine per floor" check: run it before you draw the roof plant room
- Rule: For every floor, ask whether its load can be served by a machine that fits *that floor's* shaft and riser, and compare the summed distributed plant area against one central room plus its risers. Central plant is not automatically smaller; it is smaller in *area* and bigger in *risk* (removal path, redundancy, pump head).
- Evidence: floor-level worked example: 28 rooms × 2.5 kW + 15 kW common = **85 kW/floor**; a single 100 kW machine (catalogue dimension, unverified) covers a floor with margin, needing only its own air, drain and power at that floor. 16 guest floors → 1,360 kW connected, ~950 kW after SV-09 diversity → 2–4 large machines centrally. CN-14 (plant must be reachable, breathed into, unloadable) and OM-17 (ground-level room, no ladders, 900 mm ring) are what make distributed plant attractive where the removal path is bad.
- Source: loads derived from SV-07/SV-08; placement constraints cited by ID to CN-14, CN-15, OM-17, OM-18; machine capacities **NEEDS VERIFICATION (catalogue data)**.
- Class: DESIGN PRINCIPLE
- Scope: multi-floor towers with a repeated load
- Confidence: High (the method), Low (any machine size, which is catalogue-dependent)
- Grid translation: emit per option — distributed: `1 machine × 24 tiles (4.0 × 3.0 m) per floor + no vertical CHW riser`; central: `roof/basement room in tiles + 2 × DN150–200 risers (SV-12/SV-16) + removal path (OM-18)`. Choose on tiles and on the removal path, and record the choice as a veto-able decision.
- Exceptions / failure mode: Distributed plant on every floor without a condensate/vent path is a leak risk above occupied space (CN-18's rule is the guard). Symptom: 21 fan-coil access hatches with no riser to serve them.

### SV-12 Water flow comes from Q = ṁ·cp·ΔT; run the numbers and let the ΔT be the decision
- Rule: Chilled- and hot-water flows are `ṁ = Q / (cp · ΔT)`; in litres per second for water, `L/s ≈ kW / (4.19 × ΔT_K)`. Every degree of ΔT you refuse to run costs pipe area, pump head and riser space. Show the imperial check figure too.
- Evidence: Worked: 100 kW at ΔT 6 K → 3.97 kg/s ≈ 4.0 L/s. The paired US convention: "the most common delta T is 10 °F, which results in 2.4 GPM/Ton" — check: 2.4 gpm = 0.151 L/s per 3.517 kW → ΔT = 3.517 / (0.151 × 4.19) = 5.56 K = 10 °F ✓, i.e. the two methods are the same arithmetic. A guest floor of 85 kW at ΔT 6 K = 3.4 L/s; a diversified tower of 950 kW = 37.9 kg/s ≈ 38 L/s.
- Source: Engineering Pro Guides (T4, the 10 °F / 2.4 gpm-ton pair); the identity and the 4.19 value are physics (arithmetic).
- Class: FACT (the arithmetic) / HEURISTIC (which ΔT a project picks)
- Scope: sealed hydronic circuits
- Confidence: High
- Grid translation: `riser area = Q / v`; at v = 1.5 m/s (declared, see SV-14) 38 L/s → 0.0253 m² → **180 mm dia**, i.e. DN200 supply + DN200 return ≈ 2 tiles each with insulation, ~5 tiles for the pair plus working gap. At ΔT 9 K the same duty is 25 L/s → 146 mm — one calibre smaller and two fewer tiles of riser. Report both.
- Exceptions / failure mode: 2-pipe changeover systems halve the pipe count but force simultaneous heating and cooling onto the same machine. Symptom: a "small" DN65 riser chosen for velocity while the emitters were sized for a ΔT nobody will achieve.

### SV-13 Every size is an area: `section = flow ÷ velocity`, and the velocity you pick is a noise decision
- Rule: Convert flow to section with the continuity equation `V̇ = A·v` (and `D = √(4Q/πv)` for round), then convert section to tiles and to the ceiling zone it consumes. State the velocity band and the reason for it; do not size by "matching the previous job".
- Evidence: air-side practice for commercial low-pressure networks: "roughly 900–2,000 fpm (4.5–10 m/s) for trunks and 600–1,200 fpm (3–6 m/s) for branches", with terminal velocities scaled down for acoustic comfort; equal-friction design keeps pressure drop per unit length constant; "0.08–0.10 in. w.g. per 100 ft" is a residential baseline only. Worked example from the same source: 1,000 cfm at 1,200 fpm → 0.833 ft² → 12.4 in → a 12 in round duct.
- Source: Bhandari, *HVAC Duct Design and Sizing: From CFM to Duct Size* — https://bhandariramesh.com/cfm-to-duct-size-velocity-and-pressure-loss/ (T4). Water velocity band 1.0–2.0 m/s: **declared assumption, `NEEDS VERIFICATION`** against CIBSE Guide B or the pipe-size tables of a manufacturer data book; nothing retrieved this pass.
- Class: FACT (continuity) / HEURISTIC (bands)
- Scope: any distribution
- Confidence: High (relation), Medium (air bands), Low (water band)
- Grid translation: emit `A (m²)`, `section in tiles`, and `ceiling zone in mm`. Air-side worked, all-air floor: 85 kW with a 10 K supply ΔT → 85/(1.206 × 10) = 7.0 m³/s → at 6 m/s, 1.17 m² of duct ≈ **5 tiles of shaft per floor**, versus the 3.4 L/s chilled-water pipe of SV-12 that fits in a fraction of one tile. That contrast is the single biggest plan-level services choice in this file.
- Exceptions / failure mode: Concrete-core activation and underfloor air remove the duct at the cost of slab depth or floor build-up — invisible here, so declare which system the plan assumes. Symptom: a beautiful all-air ceiling that cannot be built at 2.7 m clear.

### SV-14 Ducts and pipes are not the same size object: add insulation, flanges and a working face
- Rule: A service's plan footprint = calibre + insulation + flange/fittings + the clearance a hand needs; CN-12 states the principle, this rule states the number used here. Insulation envelope is taken as calibre + 50 mm all round (heuristic); OM-19's `750 × 750 mm` working area per operable item is the real driver of cupboard size.
- Evidence: CN-12 already declares its shaft numbers `UNCITED — heuristic`; this file inherits the "biggest thing that must fit" logic and checks it arithmetically in SV-16/SV-28. Working clearance: OM-19 (750 × 750 mm per item, risers accessible from corridor, mechanical and electrical risers separate); OM-17 (900 mm around plant, 2 m headroom on routes).
- Source: CN-12, OM-17, OM-19 by ID (their own evidence stands); insulation allowance **UNCITED — heuristic**.
- Class: DESIGN PRINCIPLE
- Scope: universal
- Confidence: Medium
- Grid translation: `tiles_occupied = Σ ceil((d_i + 0.05)/0.5) × row_spacing(0.1 m)`; then assert `cupboard working area ≥ 750 × 750 mm × operable items` (OM-19), which is a *corridor* cost, not a shaft cost — do not charge it twice.
- Exceptions / failure mode: Prefabricated insulated ring-main systems change the envelope; so do ducts that are also the fire damper carrier (CN-20). Symptom: a riser diagram with 11 lines and a 2-tile shaft.

### SV-15 Pump power is a heat gain, and it belongs in the plant calculation
- Rule: `P_hydraulic = ρ·g·Q·h / 3.6×10⁶` (kW, with Q in m³/h) and `P_shaft = P_hydraulic / η`. Almost all of that shaft power arrives in the water, so it adds to the chiller load and to the plant room's own ventilation demand.
- Evidence: formulas and the efficiency range "60–85 %" for centrifugal pumps (T4 technical reference). Worked: 38 L/s = 137 m³/h at 30 m head → 1000 × 9.81 × 137 × 30 / 3.6e6 = 11.2 kW hydraulic → at η = 0.70, **16 kW shaft** → +16 kW on a 950 kW loop (1.7 %) and 16 kW of heat the plant room must shed.
- Source: Neutrium, *Pump Power Calculation* — https://neutrium.net/articles/equipment/pump-power-calculation/ (T4).
- Class: FACT (identity) / HEURISTIC (efficiency band)
- Scope: any pumped circuit
- Confidence: High (formula), Medium (η band; `REQUIRES ENGINEERING VERIFICATION` against the pump curve)
- Grid translation: emit `pump kW` beside `chiller kW` and add it to the plant-room air balance via SV-20's method. Riser height is the head driver: taller tower → bigger pump → more heat in the same small room.
- Exceptions / failure mode: Secondary/variable-flow pumping saves fan energy and adds heat and floor area. Symptom: a plant room whose only ventilation is the door.

### SV-16 More stacks means smaller stacks means more shaft: optimise count against calibre, don't default
- Rule: For any service whose capacity is capped per interval and per column (drainage, SV-25), there are two or three feasible (count, calibre) pairs, and their shaft areas differ by a factor of two. Enumerate them on the plan; do not inherit a house habit.
- Evidence: with 16 guest floors × 84 soil DFU/floor = 1,344 DFU plus ~150 DFU of podium (SV-25 tables): 2 stacks → 672 DFU each > the 500 DFU ceiling of a 100 mm stack → 2 × 125 mm; 4 stacks → 336 each, ≤ 500 → 4 × 100 mm. The 4-stack option uses 4 × (110 mm + 50) ≈ 0.64 m of pipe line vs 2 × 0.16 = 0.32 m — and both fit a 4-tile shaft, so *calibre is not the constraint; the constraint is the number of cupboard doors and the number of wet-cell groups they can serve*.
- Source: derived arithmetically from IPC Table 710.1(2) (T1, SV-25); clustering obligation by ID: CN-11, MS-05, MS-20.
- Class: ENGINEERING CONSTRAINT
- Scope: repeated-cell buildings over ~4 storeys
- Confidence: High
- Grid translation: emit the (count × calibre × branch reach) options as a table row per service, then assert `every wet tile within CN-17's run budget of its stack` for each option — which is usually what decides it, not the DFU figures.
- Exceptions / failure mode: Stubbing/plumbed-off floors and vacuum drainage break the trade entirely (pumped, small bore) — declare it explicitly, because CN-17's slope budget then does not apply. Symptom: four stacks drawn where two would do, and two cupboard doors lost from each corridor.

### SV-17 Electrical load density: quote the lighting table, then say what it is not
- Rule: VA/m² figures are starting points for intake sizing, not for cable or generator sizing, and the widely quoted set is a *general lighting* table that was superseded. State edition, and state that the HVAC loads are additional.
- Evidence: legacy NEC Table 220.12 general lighting loads (pre-2020): offices/banks 3.5 VA/ft², stores 3.0, schools 3.0, restaurants/hospitals/hotels 2.0, churches 1.0, commercial garages 0.5, warehouses 0.25 VA/ft² — in SI **37.7 / 32.3 / 32.3 / 21.5 / 10.8 / 5.4 / 2.7 VA/m²**. The same source states that "NEC 2020 replaced that table", shifting to lower energy-code-aligned values, and gives dwelling units at 3 VA/ft² = 32 VA/m².
- Source: TradesQuote, *Commercial Electrical Load Calculation: NEC 220 Part III* — https://www.tradesquote.ai/blog/commercial-electrical-load-calculation/ (T4, legacy values with the supersession note); Kopperfield, *How to complete lighting load calculations* — https://www.kopperfield.com/blog/lighting-load-calculations (T4, dwelling 3 VA/ft²); NEC 220.12 section page — https://up.codes/s/lighting-load-for-specified-occupancies (**landed without the table body — do not quote clause values from it**).
- Class: HEURISTIC
- Scope: US-derived practice; do not port to EN 60364-7-710/UK practice without a local source
- Confidence: Medium (values), High (the "lighting only, superseded" caveat)
- Grid translation: `intake VA = Σ(tiles/4 × VA/m²)`; report `VA/m²` per use next to the W/m² thermal figure so the two can be compared — a guest floor at 21.5 VA/m² lighting is dominated by its HVAC and DHW loads, which this table does not include.
- Exceptions / failure mode: Kitchens, laundries, data and EV bays carry load densities one to two orders above the table and must be added as connected equipment, never as a density. Symptom: an intake sized from a hotel VA/m² figure with 60 EV chargers added later.

### SV-18 Apply the demand-factor rules you can cite, and treat EV chargers as continuous load
- Rule: Diversity in electrical terms is a *code rule* with named tables, not an opinion. Receptacle loads reduce; EV charging does not reduce without a management system; show-panel and track loads do not reduce at all.
- Evidence: Table 220.44 — "first 10,000 VA at 100 %, the remainder at 50 %" for receptacle loads; Table 220.42 applies tiered reductions to general lighting (percentages not retrieved). EVSE is a continuous load: "must size the equipment for 125 % of the continuous load" per NEC Art. 625 and 210.20(A), with "Demand (Load) management … in accordance with NEC 750" as the route back to a smaller intake.
- Source: TradesQuote (T4, 220.44 pair); CSE Magazine, *Your questions answered: Energy, power demands for EV charging* — https://www.csemag.com/your-questions-answered-energy-power-demands-for-ev-charging/ (T3, 125 % continuous rule, Arts. 625/626/220/230/750).
- Class: CODE REQUIREMENT (reductions as named) / STANDARD (125 % rule)
- Scope: US practice; EN-market equivalent is a demand-factor schedule — source it locally
- Confidence: Medium (the 220.42 tier percentages are missing), High (the 125 % EV rule)
- Grid translation: `connected VA` → `demand VA` → `intake kVA` as three published columns, plus one row per EV zone: bays × kW/bay × 1.25 with the management option shown as the alternative. `kW/bay` is an operator input — **not** a number this file supplies.
- Exceptions / failure mode: A "diversified" EV intake with no NEC 750 management system installed is an over-substation that the authority having jurisdiction will reject at commissioning. Symptom: the intake that was fine until everyone charged at 18:00.

### SV-19 Switchrooms and substations are programme, drawn from clearances
- Rule: The electrical room's area is its clearances plus its doors plus its exclusions, not a percentage of floor area. OM-20 already fixes the geometry (1,500 mm front, 1,000 mm rear, no unrelated pipework, door to outside or general circulation); this rule turns it into an area and shows the sensitivity.
- Evidence: OM-20 (Oxford BSDG A1.4/E2.3, T1/T3) fixes `1500 mm front and rear clearance`, the no-pipework rule and the access rule; OM-17 adds the 900 mm ring and 2 m headroom around plant.
- Source: OM-20, OM-17 by ID; CN-15 (removal path) by ID.
- Class: CODE REQUIREMENT (as an estate standard) + arithmetic
- Scope: any building with a switchboard
- Confidence: High
- Grid translation: a board 2.4 m wide × 0.6 m deep with a 3-tile front band and 2-tile rear band = `3.0 m × (0.6 + 1.5 + 1.0)` ≈ 9.3 m² = **37 tiles** for one board; add a 5-tile (2.5 m) aisle per OM-17 to reach the door. Two boards side by side share the bands → the marginal cost drops sharply. Report `switchroom_tiles` per floor and per block.
- Exceptions / failure mode: A transformer in the same room brings heat (SV-20's air balance) and a bigger removal path; a generator room is not an electrical room. Symptom: a 3-tile "electrical riser" on the plan that is a drawing convention, not a room.

### SV-20 The generator room's air is bigger than its floor area — this is the classic architectural failure
- Rule: Size the engine room by its louvres, not by its footprint. Combustion air and the room's own rejected heat set an airflow that usually exceeds what the façade can give, and the fix (remote radiator, water-cooled rejection, or moving the set to the perimeter) is a plan decision made early or not at all.
- Evidence: heat split for a diesel set at ~40 % electrical efficiency: total rejected energy divides as exhaust gas 50 %, jacket water 25 %, aftercooler 10 %, engine-to-room 10 %, generator-to-room 3.33 %, exhaust surfaces 1.67 %; combustion air "0.1 m³ of air/min/brake kW (2.5 ft³ of air/min/bhp)"; permissible room temperature rise 5 K against a 38 °C baseline, electronics failing above 55 °C; `Q = H ÷ (ρ_air × cp × ΔT)` with ρ = 1.099 kg/m³ and cp = 0.017 kW·min/(kg·K) (= 1.02 kJ/kg·K); routing multipliers 1.0 / 1.5 / 2.5; **"water-cooled setups bypass room-air calculations entirely"**; intake gross area must be ≥ total make-up demand at the chosen louvre face velocity.
- Source: Practical HVAC, *Generator Room Ventilation Calculator* — https://www.practicalhvac.com/blog/generator-room-ventilations (T4 tool documentation).
- Class: HEURISTIC (the tool's method) / arithmetic (the worked figure)
- Scope: on-site generation of any size
- Confidence: Medium (splits are typical, not measured) — `NEEDS VERIFICATION:` the OEM heat-rejection and combustion-air data for the selected set, plus the louvre free-area ratio from the manufacturer's table.
- Grid translation: worked for a 1,000 kW set: input energy = 1000/0.40 = 2,500 kW, rejected 1,500 kW, room gain = 15 % × 1,500 = **225 kW** → `Q = 225 / (1.099 × 0.017 × 5)` = 2,410 m³/min = **40 m³/s**; at 2.5 m/s louvre face velocity → 16 m² free area → ÷ 0.55 open ratio ≈ **29 m² gross louvre** ≈ a 3 m high × 9.5 m wide band of ground-floor façade (19 tiles × 6). Put that against the room's ~60 tiles of floor. Then assert CN-14's exterior-facing wall ≥ 4 tiles is violated by an order of magnitude → move the set to the perimeter or reject heat remotely.
- Exceptions / failure mode: Water-cooled sets with a remote dry cooler move the airflow to the roof and the pump duty to the basement (SV-15). Symptom: a basement generator room drawn on an interior site line with a "louvre" onto a light well.

### SV-21 Lifts and EV bays: two loads that arrive late and resize the core
- Rule: Lift electrical load and machine-room space, and EV charging per bay, enter the riser schedule as declared inputs with a source, because both are routinely omitted from the services register and both change shafts.
- Evidence: a machine-room-less 1,000 kg passenger lift is specified at "RATED SPEED (m/s) <1.0", "STARTS PER HOUR 240", "PIT (mm) 1200" (vendor sheet, no kW stated). Physics bound: rope power = m·g·v = 1,000 × 9.81 × 1.0 ≈ 9.8 kW for a laden lift at rated speed; the connected electrical load is higher once drive and losses are included — **the multiplier is not retrieved**, so quote 9.8 kW as the mechanical floor and flag the rest. EVSE must be sized at 125 % as a continuous load (SV-18) and its bay area is a parking-area decision as much as an electrical one.
- Source: iKonic Lifts, *IKONIC JUPITER MRL 1000 kg* — https://www.ikoniclifts.co.uk/product/ikonic-jupiter-gearless-traction-passenger-lift/ (T4 vendor); CSE Magazine (T3) for the EV continuous-load rule.
- Class: HEURISTIC + arithmetic
- Scope: lifts above ~4 storeys; EV provision wherever parking is provided
- Confidence: Medium (vendor data), Low (electrical multiplier — `NEEDS VERIFICATION:` the lift manufacturer's load schedule and the local EV provision rule)
- Grid translation: per lift, add `hoistway tiles + a 2-tile machine-room/overrun void where required + 9.8 kW mechanical floor figure to the intake estimate`; per EV zone, `bays × declared kW × 1.25` as its own row in the intake table (never folded into the 0.5 VA/ft² garage lighting figure of SV-17).
- Exceptions / failure mode: MRL lifts still need a reachable control and a removal path (OM-18, CN-15) at the top of the hoistway. Symptom: a lift bank whose load is discovered after the intake position is fixed.

### SV-22 Sprinkler demand is `density × area of operation`; classify by room, then add the duration
- Rule: The hazard class of each space sets the water the system must deliver and the tank that must hold it. Classify early: the classification is what changes the riser, the pump and the fire-service connection, and it is set by what is stored, not by what the room is called.
- Evidence: retrieved design values — Light Hazard 0.10 gpm/ft² over 1,500 ft² (4.1 L/(min·m²) over 139 m²) → 150 gpm ≈ 9.5 L/s, with 30 min of supply for hose streams; Ordinary Hazard 1 0.15 over 1,500 → 225 gpm ≈ 14.2 L/s, 60–90 min, examples "auto parking garages, laundries, and restaurant kitchens"; Ordinary Hazard 2 0.20 over 1,500 → 300 gpm ≈ 18.9 L/s, 60–90 min; Extra Hazard 1 0.30 over 2,500 → 750 gpm ≈ 47 L/s, 90–120 min; Extra Hazard 2 0.40 over 2,500 → 1,000 gpm ≈ 63 L/s, 90–120 min. Coverage per head: light 130–200 ft² (12–19 m²), OH1–2 130 ft² (12 m²), EH 90–130 ft²; max spacing 15 ft (4.6 m) light/OH, 12 ft (3.7 m) EH. NFPA 13R applies to residential/lodging "four storeys or fewer in height above grade and 60 feet or less", sizing on the four most demanding heads in a compartment; beyond that, full NFPA 13.
- Source: Toolgrit, *Fire Sprinkler Hydraulic Calculations: NFPA 13 Design Fundamentals* — https://www.toolgrit.com/guides/sprinkler-hydraulic-explained (T4); ValveAtlas, *NFPA 13 vs 13R vs 13D* — https://valve-atlas.com/2026-05-26/nfpa-13-vs-13r-vs-13d-sprinkler-standards-comparison/ (T4); Total Fire Protection (T4) for spacing/coverage. **Ordinary Hazard Group 3 (0.25 over 1,500) was not retrieved from any source this pass and is therefore not stated here.** — `NEEDS VERIFICATION:` NFPA 13 current edition, Table 11.2.3.1 (or its successor), for the exact density/area pairs, OH3, hose-stream allowances and the ceiling-height limits.
- Class: STANDARD (as reproduced by T4 practice pages) — `REQUIRES CODE VERIFICATION` for any project
- Scope: NFPA-market practice; EN 12845 pairs are not retrieved here
- Confidence: Medium (values, T4 origin), High (the method: demand = density × area; duration sets the tank)
- Grid translation: tag each tile-set with a hazard class; `heads = floor_tiles/4 ÷ coverage_m²`; for an 864 m² guest floor at light hazard: 46–66 heads (coverage 12–19 m² = 48–76 tiles per head, so a pitch near 4.6 m ≈ 9 tiles is the loose end); at OH1 the same floor needs 72 heads at 12 m² (48 tiles/head, i.e. a 4 × 3 m pitch). Demand column of the riser schedule (SV-28) is set by the **most demanding zone**, not by the average.
- Exceptions / failure mode: Storage changes class on its own — "a room is classified by its most hazardous contents"; unsprinkled voids and racks invert the assumption. CODE-07/CODE-25 by ID: the egress credit is invalid without shown coverage. Symptom: a light-hazard tower with an OH3 store and a pump that was never resized.

### SV-23 Sprinkler coverage is a ceiling-geometry argument, and beams are the constraint
- Rule: Head spacing is a grid, so the plan's room module must be able to absorb a ~4.6 m (9-tile) or ~3.7 m (7-tile) pitch; and where the ceiling is obstructed, extra heads or extra drops appear. Do not claim a sprinkled ceiling over an exposed services soffit without counting the obstruction.
- Evidence: "the three times rule" — the horizontal distance from a sprinkler to an obstacle scales at three times the obstacle dimension — and obstacles narrower than "30 cm (12 in)" are disregarded, NFPA 13 Ch. 10, Table 10.2.7.2 as reported. Ceiling-height ceilings for standard-coverage heads were **not retrieved**.
- Source: Selvi, *NFPA 13 Obstruction Rules: Three Times Rule, Beam Rule and Tables* — https://selvi.org/en/blog/nfpa/nfpa-13-obstruction-rules (T4; the geometric form was paraphrased, so treat the wording as unverified) — `REQUIRES ENGINEERING VERIFICATION` against NFPA 13 Ch. 10 before any claim about beams.
- Class: STANDARD (existence of the rule) / unverified (form)
- Scope: any sprinkled space; binds hardest where the ceiling is exposed
- Confidence: Low (as retrieved), High (that beam depth and duct depth decide head layout)
- Grid translation: on the host grid the rule is invisible, so express it as a *budget*: `available ceiling zone = floor_to_floor − clear_height − slab` = 3.0 − 2.7 − 0.3 = 0 mm at the declared defaults → therefore any duct (SV-06, SV-13) either drops the ceiling, thins the floor-to-floor, or is routed in the service band (CN-19). Report `ceiling zone required (mm)` per floor as a number, and flag `exposed_soffit` tags as a sprinkler-design question.
- Exceptions / failure mode: Atrium and double-height spaces replace this with different provisions. Symptom: a "feature exposed concrete ceiling" that silently invalidates the sprinkler assumption the egress credit was taken on.

### SV-24 The fire pump room is a plant room with a code requirement to stay dry and cool
- Rule: Give the pump set the OM-17 treatment (ring, headroom, door for removal) plus 600 mm between pipe systems, a frost floor, and its own ventilation — and, for a diesel set, its combustion air, exhaust and fuel storage. Fire pumps are where OM-17 and SV-20 meet.
- Evidence: "3 ft (0.9 m) clear space around all major equipment"; "2 ft (0.6 m) minimum between pipe systems"; "at least 4 °C (40 °F)"; "ventilation fans to remove diesel fumes" and enough air "for engine combustion air and room cooling"; "dual batteries and fuel tanks rated for minimum 8 hours"; "door size must allow for removal and replacement of equipment"; NFPA 20 §§4.15, 4.28, Ch. 13 and §6.2 named.
- Source: DFS Pumps, *Designing the Perfect Fire Pump Room: NFPA 20 Guidelines* — https://dfspumps.com/fire-pump-room-nfpa-20-guidelines/ (T4 vendor) — clause numbers **named, not read** → `REQUIRES ENGINEERING VERIFICATION`.
- Class: STANDARD
- Scope: any pumped fire system
- Confidence: Medium (vendor restatement of code), High (that the room needs clearance, heat rejection and a removal path)
- Grid translation: `pump_set footprint × (footprint + 3.6 m)` — a 1.8 × 1.0 m set needs ≈ 4.0 × 3.2 m = 12.8 m² = **51 tiles** as a minimum room before the jockey pump, controller, fuel tank and the 5-tile aisle of OM-17; then check the door run ≥ 3 tiles (OM-17). Emit `fire_pump_room_tiles`, `jumbo_tank_if_any`.
- Exceptions / failure mode: A suction-tank-fed set needs the tank volume — the hydraulic numbers (SV-22's durations × demand) decide whether the basement has a room or a cistern: 9.5 L/s × 30 min = 17 m³; 18.9 L/s × 90 min = 102 m³. Symptom: a "tank in the plant room note" with no tiles anywhere.

### SV-25 Fixture units → stack calibre: read the two limits, not one
- Rule: Drainage capacity is checked twice — load through any one storey, and total load on the whole column. A stack that satisfies one and fails the other is a stack that will be rebuilt. Use the code's fixture-unit values, then the stack table.
- Evidence: IPC Table 709.1 drainage fixture units: private WC ≤ 1.6 gpf = 3, private WC > 1.6 gpf = 4, public WC ≤ 1.6 gpf = 4, public > 1.6 = 6, lavatory 1, bathtub 2, private kitchen sink 2, floor drain 2, service sink 2, urinal 4 (2 at ≤ 1 gpf), shower 2–6 by flow. IPC Table 710.1(2) drainage stack — columns `diameter | total for horizontal branch | total discharge into one branch interval | total for stack ≤ 3 branch intervals | total for stack > 3 branch intervals`: 2 in — 6/6/10/24; 2½ in — 12/9/20/42; 3 in — 20/20/48/72; 4 in — 160/90/240/500; 5 in — 360/200/540/1,100; 6 in — 620/350/960/1,900; 8 in — 1,400/600/2,200/3,600.
- Source: IPC 2021 §709.1 — https://up.codes/s/values-for-fixtures (T1); §710.1 Table 710.1(2) — https://up.codes/s/maximum-fixture-unit-load (T1). Nominal metric equivalents (4 in ≈ DN100, 5 ≈ 125, 6 ≈ 150) are the usual table pairings and must be re-read against the edition — `NEEDS VERIFICATION`.
- Class: CODE REQUIREMENT
- Scope: waterborne gravity drainage
- Confidence: High (as retrieved; both tables printed)
- Grid translation: per-floor tally then two tests. Guest floor: 28 rooms × (WC 3 + shower 2 + lav 1) = **84 soil DFU + 84 waste DFU** per floor; over 16 floors = 1,344 each + ~150 podium. With 2 soil stacks: 42/floor (≤ 90 ✓) but 672 total (> 500 ✗ for DN100) → **DN125**. With 4 stacks: 21/floor, 336 total → **DN100 ✓**. Emit `DFU/floor`, `DFU/stack`, `calibre`, and the failed test if any.
- Exceptions / failure mode: Full-flush legacy fittings (4 DFU WC) push a DN100 stack to DN125 on a 16-floor column — the fixture specification changes the shaft. Symptom: a stack "sized by the bathroom group" with no column check.

### SV-26 The slope budget: what horizontal distance one tile of fall actually buys
- Rule: Gravity drainage costs distance at a rate the code fixes per diameter, and the plan only has the fall that the floor build-up can absorb. CN-17 states the principle and the mm/m rates; this rule turns them into run lengths so its 20/40-tile placeholders can be checked rather than inherited.
- Evidence: IPC §704.1 (retrieved in CN-17 from an adoption mirror): ¼ in/ft for 2½ in and smaller, ⅛ in/ft for 3–6 in, 1/16 in/ft for 8 in and larger — i.e. ≈ 21, 10.6 and 5 mm per metre. Available fall in a floor: a 3.0 m floor-to-floor with a 0.15 m build-up allowance (declared) gives 150 mm to spend. `run = 0.15 / gradient`: at 21 mm/m → 7.1 m = **14 tiles**; at 10.6 mm/m → 14.1 m = **28 tiles**; at 5 mm/m → 30 m = 60 tiles.
- Source: IPC §704.1 via CN-17 (which carries the retrieval detail and the adoption-edition caveat: https://up.codes/s/maximum-fixture-unit-load family, ICC mirror noted as 403 in that rule); the 0.15 m build-up allowance is **this file's declared assumption**.
- Class: CODE REQUIREMENT (gradients) + arithmetic (the run lengths)
- Scope: gravity drainage; inverted for pumped systems
- Confidence: High (arithmetic), Medium (build-up allowance)
- Grid translation: set `max drain run (tiles) = 14` for small-bore waste (2½ in and smaller) and `28` for 3–6 in laterals, and *revise CN-17's placeholders accordingly* — CN-17's 20-tile figure is ~40 % too generous at ¼ in/ft and its 40-tile figure is unachievable in one storey of fall on either gradient. Cross-ref CN-17 and CN-18 by ID; the practical consequence for a hotel is that the stack must be within ~7 m of the bathroom, which is what actually places the core.
- Exceptions / failure mode: Same-floor trench drains and roof siphonic systems escape the budget; a run crossing two storeys may spend two build-ups (rarely legal, never free). Symptom: a waste run "hidden above the ceiling" of the room below it (CN-18's prohibition in numbers).

### SV-27 Wet-cell stacking, service separation and the services yard — re-derived from the arithmetic
- Rule: Wet cells stack because the fixture-unit and slope arithmetic make any other answer expensive, not because it is traditional; dirty and greasy streams stay separate because reuniting them downstream defeats both the interceptor and the stack; and every service that cannot be stacked or banded needs a yard.
- Evidence: the two drivers are now numeric — SV-25's column limits reward a compact, repeated wet group (a scattered bathroom column multiplies stacks, and SV-16 shows each added stack costs a cupboard door and a riser), while SV-26's 14/28-tile run budget is a *radius*, so the maximum spacing between stacked wet cells is set by drainage, not by layout preference. Kitchen waste requires interception and its own route (grease; see below); rainwater from roof drains is a separate stream (CN-17's stacking logic extends to it). The plant-adjacent yard is where the un-stackables live: bins, compactor, grease interceptor, laundry plant, pool plant, gas sets, and the make-up-air lobbies of SV-06/SV-20.
- Source: derived from SV-16, SV-25, SV-26, CN-17, CN-18 (by ID) and CN-14's requirements; grease-interceptor code clauses — `NEEDS VERIFICATION:` obtain IPC §1014 (or the local equivalent) for the required interceptor and its access; nothing was retrieved this pass.
- Class: DESIGN PRINCIPLE (the arithmetic-driven parts are FACT once the inputs are fixed)
- Scope: repeated-cell, food-producing and laundry-heavy buildings
- Confidence: High (the derivations), Low (interceptor specifics)
- Grid translation: `wetOverlap(f) ≥ 0.8` stays as CN-18 defines it; add `max wet-cell cluster spacing ≤ 14 tiles from a stack` and a per-floor `services_yard_tiles` for the un-stackables, each with a vehicle-capable route per CN-14/OM-18. Pool and spa make-up water, and laundry throughput water, remain **inputs the operator supplies** — no figure is claimed here.
- Exceptions / failure mode: A ground-floor kitchen below first-floor guest bathrooms is the classic forced offset (CN-18's own exception) and it is solved with a containment tray plus a pump, not by pretending the radius was met. Symptom: a services yard drawn as "storage" and never given an external door.

### SV-28 The services feasibility pass: publish the riser schedule and plant register, flag the rest
- Rule: The agent computes and publishes: per-zone airflow, per-floor water flow, hazard classification and demand, fixture-unit tallies, shaft sections in tiles, plant areas in tiles, and the louvre/air balances that come with them. The agent does not compute: friction/pressure drops, hydraulic grade lines, calibre selection against a curve, acoustic design, and any equipment selection. Where a boundary item would decide the plan, state the placeholder used, in the open.
- Evidence: this file's own worked examples are the pattern — the flows come from cited tables (SV-01, SV-02, SV-06, SV-22, SV-25), the sections from continuity (SV-13, SV-14), and the areas from clearance rules already owned by CN-12/OM-17/OM-19/OM-20. What is missing everywhere is the *curve*, and curves are the engineer's deliverable.
- Source: SKILL.md `## MEP / Services` (the existing "where duct sizes, pipe diameters, or flows would decide the question, flag it and design to a conservative spatial default") — this rule makes that instruction arithmetically executable; CN-12, OM-19 by ID.
- Class: DESIGN PRINCIPLE (process rule)
- Scope: universal
- Confidence: High
- Grid translation: mandatory deliverables before geometry freeze: (1) the **Per-space services register** (below), (2) the **riser schedule** in tiles per cluster per floor (the `## Riser schedule: 21-floor hotel` section is the worked exemplar), (3) **plant areas in tiles** with their removal path and their air balance, (4) a `REQUIRES ENGINEERING VERIFICATION` list naming every placeholder calibre and machine size. Metrics emitted: `service_shaft_tiles_per_floor`, `plant_tiles_total`, `oa_L/s_per_floor`, `kW_per_floor_diversified`, `sprinkler_demand_L/s_governing_zone`.
- Agent procedure — **the 7-step services feasibility pass**, run before geometry is frozen (CN-11's "fix the stack before the plan" is not decidable without it):
  1. Register the programme: per space type, area in tiles and occupancy (SV-01's density column, not a furniture count).
  2. Compute air: OA + extract per space, per floor in L/s (SV-01…SV-06), with the kitchen hoods by hood length, not area.
  3. Compute heat and cool: per-floor W/m² or kW/room with provenance, then the diversified plant figure (SV-07…SV-11).
  4. Compute water: DFU and WSFU tallies per floor and per column; flow from ΔT (SV-12, SV-25).
  5. Compute fire: hazard class per space, governing-zone demand, and the tank/pump room that follows (SV-22…SV-24).
  6. Convert to section and area: `A = Q ÷ v` for every duct and pipe, add insulation and clearance, produce the (count × calibre) options (SV-13…SV-16, SV-14's envelope).
  7. Test against the grid and the placement rules: shaft coordinates constant (CN-11, MS-05), branch reach inside the slope budget (SV-26 → CN-17/CN-18), cupboards corridor-served (OM-19), plant rooms reachable and aired (CN-14, OM-17, SV-20), removal paths unbroken (CN-15, OM-18) — then publish the residual and the flag list (SV-28).
- Exceptions / failure mode: Two failure modes, symmetrical: the agent asserts a duct size it cannot derive (fabrication), or refuses to reserve space and discovers the AHU in stage 4 (silence). Both are reporting failures, not engineering ones.

---

## Per-space services register

Fill this before geometry freeze, one row per space type in the programme. Every cell is a *declared input* with the standard named; cells marked `[in]` are operator/engineer inputs this file does not invent.

| Space | OA / outdoor air (SV-01) | Extract (SV-02) | Cooling load (SV-07/08) | Water: WSFU & DFU (SV-25) | Sprinkler class (SV-22) |
|---|---|---|---|---|---|
| Guest room | 5 cfm/p + 0.06 cfm/ft² (2.4 L/s·p + 0.30 L/s·m²) | bath: 25 cont / 50 interm cfm (12 / 24 L/s) | 1.8–4.4 kW per room; 8–9 L/s OA per room | 8.1 WSFU + 6 DFU soil-side split (3 soil / 3 waste) | Light 0.10 over 1,500 ft² |
| Corridor / lobby | 0.06 cfm/ft² corridor; lobby 7.5 + 0.06 | — | band 30–60 W/m² `[declare]` | staff WC 4–6 DFU each | Light |
| Restaurant / bar | 7.5 cfm/p + 0.18 cfm/ft² | — | `[in]`, high occupancy + latent | public WC 10 WSFU; 4–6 DFU | Light → OH1 where servery/kitchen |
| Kitchen (cooking) | 7.5 cfm/p + 0.12 cfm/ft² | **0.7 cfm/ft²** room + hood 200–700 cfm/ft of hood | +41 kW per 8,000 cfm of MA (worked) | foodservice sink 4 WSFU; floor drain 2 DFU; **grease `[in]`** | OH1 (0.15) |
| Laundry | 5 cfm/p + 0.12 (commercial laundry) | dryer/extractor exhaust `[in]` | high latent; `[in]` | traps 2 DFU each; large volumes | OH1 |
| Gym / health club | 20 cfm/p + 0.06 | locker 0.25 cfm/ft² | 60–90 W/m² band | shower blocks | Light |
| Pool / spa | 0.48 cfm/ft² (2.4 L/s·m²) | dehum `[in]` | latent-dominated | make-up water `[in]` | Light (deck), plant room OH1 |
| Retail | 7.5 cfm/p + 0.12; dressing 0.25 exhaust | 0.25 cfm/ft² | `[in]` | stock WC 4 DFU | Light → OH2 where stock |
| Office / BOH admin | 5 cfm/p + 0.06 | print room 0.5 cfm/ft² | band 30–60 W/m² | as business counts | Light |
| Car park (enclosed) | — | **0.75 cfm/ft²**, floor 0.05 | n/a | drains 2 DFU each | OH1 (0.15) |
| Plant / switch / pump rooms | not in the table — engineered `[in]`; generator air is SV-20 | heat-rejection driven | gains = pumps + drives (SV-15) | floor drains, plant drains | OH1 (light where bare) |
| Stores / bin / back-of-house | 0.06 cfm/ft² (warehouse row) | 0.02 cfm/ft² if uninhabited | low | — | **class by contents** — can invert to OH3 |

## Riser schedule: 21-floor hotel

Case (declared): 21 storeys, 3.0 m floor-to-floor (63 m column); L1–L4 podium (lobby, F&B + 6 m kitchen hood, laundry, pool/gym, back-of-house), L5–L20 = 16 guest floors × 28 rooms = 448 keys, L21 roof plant; typical guest floor 24 × 36 m = 864 m² = 3,456 tiles; two service clusters (A at the lift hall, B at the second stair) per MS-05. Calibre is the *derived* number, not a catalogue one; "tiles" is the plan footprint of the riser group, insulation included per SV-14.

| Service | Risers | Derived size | Why that size (rule) | Tiles/cluster A | Tiles/cluster B |
|---|---|---|---|---|---|
| Soil (WC) | 1 per cluster (2) | DN125 | 42 DFU/floor ✓ DN100's 90, but 672 total > 500 → SV-25 | 1.0 | 1.0 |
| Waste (shower/lav) | 1 per cluster (2) | DN125 | same arithmetic, 84 DFU/floor split 42/42 | 1.0 | 1.0 |
| Vent | 1 per cluster | DN80 | paired per stack; sizing rule **not retrieved** → SV-28 flag | 0.5 | 0.5 |
| Cold water (2 zones) | 2 | DN100 | ~908 WSFU/zone ≈ 200 gpm = 12.6 L/s @ 1.5 m/s (SV-12/14) | 2.0 | — |
| Hot water + return | 2 + 2 | DN80 / DN40 | same flow, ΔT and heat-loss driven | 1.5 | 0.5 |
| CHW supply + return (per zone) | 2 + 2 | DN150–200 | 38 L/s diversified @ 1.5 m/s (SV-12) | 2.5 | 2.5 |
| Sprinkler riser | 1 | DN100 | governing demand 14.2 L/s (OH1, kitchen/garage) @ ~2 m/s (SV-22/24) | 1.0 | 1.0 |
| Standpipe riser | 1 | DN125 | declared fire flow input `[in]` — **NEEDS VERIFICATION** (NFPA 14 not retrieved) | 1.5 | 1.5 |
| Bathroom extract | 1 | 0.45 × 0.30 m | 672 L/s per floor @ 5 m/s (SV-03) | 1.0 | 1.0 |
| Stair pressurisation | 1 (cluster B stair) | 0.8 × 0.75 m | 3.0–5.4 m³/s @ 9 m/s (SV-04), placeholder | — | 5.0 |
| Electrical (LV riser + 2 trays) | 1 group | 0.6 × 0.30 m × 3 ways | OM-20 separation from mechanical risers | 3.0 | 2.0 |
| ELV / comms / BMS | 1 | 0.3 × 0.30 m | — | 1.0 | 1.0 |
| **Typical guest floor total** | | | | **≈ 16 tiles (4.0 m²)** | **≈ 17 tiles (4.3 m²)** |
| Podium-only: kitchen extract + MA | 2 | 1.2 × 0.35 m each | 8,000 cfm @ 9 m/s (SV-06) | 6.0 (L1–L4) | — |

Checks against the existing rules: 33 tiles ≈ 8.3 m² of service shaft per typical floor = **0.95 %** of the 3,456-tile floor plate, and both clusters sit inside one 2-tile-deep band off the lift hall — consistent with CN-12's flagged `4 × 4 tiles (2.0 × 2.0 m)` heuristic for a combined wet group (this schedule's wet + fire envelope in cluster A is 8.5 tiles of pipe, which fits 2.0 × 2.5 m once SV-14's spacing is applied, so CN-12's floor is adequate but tight and must be reported as arithmetic, not as a habit). MS-05's clustering test passes (two declared clusters, constant coordinates); MS-20's `riser_count × services ≤ shaft_tiles` is satisfied only because the guest-floor CHW pair is inside the cluster envelope — if SV-11's distributed option is chosen instead, this table loses the CHW rows and gains 16 floor-level machine voids plus 16 condensate routes. CN-11's `shaftSet(f) == shaftSet(f+1)` holds for rows 1–12 and fails for the kitchen ducts, which is legitimate and must be declared as a deviation-register entry, not as a silent change.

## Plant area guide

Areas are derived from the clearance rules the corpus already owns, never from a "typical plant %" figure. Room for one item = `(W + 1.8 m) × (D + 1.8 m)` per OM-17's 900 mm ring; add a 5-tile (2.5 m) aisle to the door per OM-17 and a ≥ 3-tile door run for removal; two items in a row share the ring face.

| Plant | Duty (derived) | Room (tiles) | Notes / rule |
|---|---|---|---|
| Central CHW plant, 2 machines + pumps | ≈ 950 kW after diversity (SV-07/09) | **catalogue-dependent**; formula only: 2 × (3.0 × 1.6) in a row → (7.8 × 3.4) = 26.5 m² = **106 tiles**, + pumps ≈ 40 tiles | machine footprints `[in]`; SV-11, SV-15, CN-15 |
| Per-floor fan-coil / HP option | 85 kW/floor | ≈ 24 tiles (4.0 × 3.0 m) per floor × 16 = **384 tiles** of distributed void | SV-11; trades risers for voids and noise |
| Generator, 1,000 kW | room gain ≈ 225 kW | **≈ 60 tiles of room + ≈ 29 m² of louvre** (19 × 6 tiles of façade) | SV-20 — the louvre, not the room, is the constraint |
| Fire pump set | per SV-22 governing zone | **≈ 51 tiles** minimum, + tank volume (9.5 L/s × 30 min = 17 m³; 18.9 × 90 min = 102 m³) | SV-24, OM-17 |
| Switchroom, one board | SV-17/18 intake | **≈ 37 tiles** per board, less when shared | SV-19, OM-20 |
| Kitchen MA / extract fans | 8,000 cfm | ≈ 20 tiles of fan deck + 6 tiles of shaft/floor through L1–L4 | SV-06; the 41 kW coil lands in the F&B plant room |
| Pool / spa plant | `[in]` | declare — dehum plant is an air device, size by airflow not by tank | SV-02, SV-08 exception |
| Riser cupboards | per OM-19 | 2 × 2 tiles per cupboard × items × floors | OM-19's 750 × 750 mm is the reason shafts grow |

Per-floor test the agent should always run: `Σ plant tiles on floor f ÷ floor tiles on f` — for the guest tower here that is the 1 % shaft share plus a service band (CN-19: 1–2 tiles per corridor side, i.e. ~24–48 tiles on this plate), so **horizontal distribution, not the shafts, is the dominant services area on a typical floor**; on the podium it reverses, where the kitchen, pool and generator take the plate. That asymmetry is the finding to report.

---

## Sources

Tiers: T1 standards/codes/government & intergovernmental · T2 peer-reviewed, universities, professional institutions · T3 established professional publications and practice guidance · T4 professional-community/vendor · T5 anecdote. Nothing below T3 supplied a number without the rule labelling it as such.

Codes, standards and adopted code text (T1)
- NYC Mechanical Code 2022, Chapter 4 *Ventilation*, incl. Table 403.3.1.1 (OA/exhaust rates by space type; parking-garage rates; uninhabited-space 0.02 cfm/ft²) — https://up.codes/viewer/new_york_city/nyc-mechanical-code-2022/chapter/4/ventilation — read.
- IPC 2021 §709.1 *Values for Fixtures* (drainage fixture units) — https://up.codes/s/values-for-fixtures — read.
- IPC §710.1 *Maximum Fixture Unit Load*, Table 710.1(2) drainage stack — https://up.codes/s/maximum-fixture-unit-load — read.
- IPC Appendix E *Sizing of Water Piping System*, Table E103.3(2) WSFU and Table E103.3(3) flushometer-valve demand (10 → 27 gpm … 1,000 → 208 gpm), flowing-pressure values 15/8/25 psi — https://up.codes/viewer/connecticut/ipc-2015/chapter/E/sizing-of-water-piping-system — read (2015 edition; re-verify against the edition in force).
- Pennsylvania Mechanical Code 2021 §507.5 *Capacity of Hoods* (cfm per linear foot by hood type and duty) — https://up.codes/s/capacity-of-hoods — read.
- Illinois Mechanical Code 2024 §508.1/§508.1.1/§508.1.3 *Commercial Kitchen Makeup Air* (make-up during operation; 10 °F / 6 °C tolerance; balance shown on drawings) — https://up.codes/s/commercial-kitchen-makeup-air — read.
- NEC Table 220.12 section page — https://up.codes/s/lighting-load-for-specified-occupancies — landed **without** the table body; values therefore taken from T4 (see below) and flagged.
- IBC §909.20.3–909.20.5 smoke-control pressure bands, NFPA 92 Table 4.4.2.1.1 minimum 0.05 in. w.g., NFPA 101 30 lbf door force — quoted through the T3 articles below.
- CEN catalogue record prEN 12831-1 — https://standards.iteh.ai/catalog/standards/cen/2273ec20-0c6b-4ddd-bc42-20277952361f/pren-12831-1 — named, **not read**.
- MCS Heat Load Calculator reference sources, *Ventilation Rates* (CIBSE Domestic Heating Design Guide 2026 Table 2-18, 0.5 ACH) — https://heatloadcalculator.mcscertified.com/docs/reference-sources/ventilation-rates — read (thin; residential scope).
- Energy Saving Trust, *Heat loss calculations — detailed guidance* — https://greenheattoolkit.energysavingtrust.org.uk/t/heat-pump-installers-toolkit/heat-pump-system-design/heat-loss-calculations-detailed-guidance/ — read; **no numeric values were present**, so only the method's component names are used.

Professional institutions (T2)
- CIBSE Journal, *Module 69: Delivering ventilation to occupied spaces* — https://www.cibsejournal.com/cpd/modules/2014-10/ — read: office design occupancy 20 m²/person per ASHRAE 62.1-2013; AD Part F 10 L/s·person for offices; ASHRAE 62.1-2013 combined office rate 8.5 L/s·person; CIBSE Guide A Table 1.5 named as the rate table but not reproduced there.

Engineering practice and professional press (T3)
- CSE Magazine, *NFPA 92 defines design, testing of smoke control systems* — https://www.csemag.com/nfpa-92-defines-design-testing-of-smoke-control-systems/ — read (NFPA 92 min 0.05 in. w.g.; no numerical maximum specified).
- CSE Magazine, *Using a hybrid design approach to stairwell pressurization* — https://www.csemag.com/using-a-hybrid-design-approach-to-stairwell-pressurization/ — read (0.10–0.35 in. w.g. under IBC §909.20.5; 30 lbf).
- CSE Magazine, *Your questions answered: Energy, power demands for EV charging* — https://www.csemag.com/your-questions-answered-energy-power-demands-for-ev-charging/ — read (NEC 625/210.20(A) 125 % continuous rule; NEC 750 demand management).

Professional-community and vendor material (T4) — every number taken from here is labelled inside its rule
- Structra Advisors, *Stairwell Pressurization Design — Looking Past the Rule of Thumb, Part 1* — https://structradvisors.com/insights/stairwell-pressurization-design-looking-past-the-rule-of-thumb-part-1/ (300–550 cfm/floor heuristic, with its own warning).
- calcengineer, *Hotel Guest Room HVAC Sizing* — https://calcengineer.com/hvac/hotel-guest-room-hvac-sizing/ (6,000–15,000 BTU/h; 10–30 cfm OA/room; W/m² bands; 60–80 % coincidence).
- Engineering Pro Guides, *HVAC Rule of Thumb Calculator* — https://www.engproguides.com/hvac-rule-of-thumb-calculator.html (10 °F ΔT → 2.4 gpm/ton; climate override caveat).
- Bhandari, *HVAC Duct Design and Sizing: From CFM to Duct Size* — https://bhandariramesh.com/cfm-to-duct-size-velocity-and-pressure-loss/ (4.5–10 m/s trunks, 3–6 m/s branches; V̇ = A·v; worked 1,000 cfm).
- Toolgrit, *Fire Sprinkler Hydraulic Calculations* — https://www.toolgrit.com/guides/sprinkler-hydraulic-explained (density/area/duration table).
- ValveAtlas, *NFPA 13 vs 13R vs 13D* — https://valve-atlas.com/2026-05-26/nfpa-13-vs-13r-vs-13d-sprinkler-standards-comparison/ (13R: 4 storeys / 60 ft; four-most-demanding-heads rule).
- Total Fire Protection — https://www.tfp1.com/blog/fire-sprinklers-fire-sprinkler-suppression-systems-total-fire-protection/ (head coverage and spacing).
- Selvi, *NFPA 13 Obstruction Rules* — https://selvi.org/en/blog/nfpa/nfpa-13-obstruction-rules (three-times rule, 12 in threshold, Ch. 10 Table 10.2.7.2).
- DFS Pumps, *Designing the Perfect Fire Pump Room: NFPA 20 Guidelines* — https://dfspumps.com/fire-pump-room-nfpa-20-guidelines/ (0.9 m ring, 0.6 m between pipes, 4 °C, 8 h fuel).
- Practical HVAC, *Generator Room Ventilation Calculator* — https://www.practicalhvac.com/blog/generator-room-ventilations (heat-rejection splits, combustion air 0.1 m³/min per brake kW, 5 K rise, ρ/cp, 55 °C electronics).
- Neutrium, *Pump Power Calculation* — https://neutrium.net/articles/equipment/pump-power-calculation/ (P = ρgQh/3.6×10⁶; η 60–85 %).
- iKonic Lifts, *IKONIC JUPITER MRL 1000 kg* — https://www.ikoniclifts.co.uk/product/ikonic-jupiter-gearless-traction-passenger-lift/ (1,000 kg, <1.0 m/s, 240 starts/h, 1,200 mm pit).
- TradesQuote — https://www.tradesquote.ai/blog/commercial-electrical-load-calculation/ (legacy NEC 220.12 densities; 220.44 demand pair); Kopperfield — https://www.kopperfield.com/blog/lighting-load-calculations (dwelling 3 VA/ft²; edition-shift warning).

Named, **not read** this pass (no number taken from them; listed as the retrieval targets): ASHRAE 62.1 addenda PDFs at ashrae.org (Table 6-1 not machine-readable); ASHRAE *Handbook — Fundamentals*; ANSI/ASHRAE Standard 92; NFPA 13 Ch. 10/11; NFPA 14; NFPA 20; NFPA 96; CIBSE Guide A (https://ierga.com/wp-content/uploads/sites/2/2017/10/CIBSE-Guide-A-Environmental-design.pdf and https://www.cibse.org/media/ljmpptci/guide-a-presentation.pdf); CIBSE Guides B and J; CIBSE AM10; BSRIA shaft and plant-room guides; BS EN 12056-2; BS EN 12831-1:2017; IPC §1014 grease interceptors; ICC Digital Codes pages that return HTTP 403 to retrieval (per CN-17).

---

## Weak or contested

- **The ASHRAE 62.1 table is still not the ASHRAE table.** Every per-space rate in SV-01/SV-02/SV-03 comes from the NYC Mechanical Code 2022 reproduction — a jurisdiction's adoption, whose ASHRAE edition was not confirmed. Where the project's jurisdiction is elsewhere, re-read the local adoption or buy the standard. The rates are *defensible as an adoption*, not as the standard, and `environmental-design.md` EN-21/EN-25's deliberate blank stays correct for the ASHRAE text itself.
- **EN 15251 vs ASHRAE do not agree, and neither is wrong.** The corpus already carries EN 15251's 2.5–7 L/s·person band; the retrieved ASHRAE-style office row is 5 cfm/p = 2.4 L/s·person and the CIBSE-journal restatement gives AD Part F 10 L/s·person with 8.5 L/s·person attributed to 62.1. On the grid, 2.4 vs 10 L/s·person is a factor of four in duct area. Report which standard the project adopted before converting either into tiles.
- **Load densities are the weakest numbers in this file.** The 6,000–15,000 BTU/h, the <30/30–60/60–90/>90 W/m² bands and the 60–80 % coincidence are all T4 practice figures, from vendor-adjacent calculators, with no stated climate, vintage or fabric. They are usable as *order-of-magnitude placeholders that decide shaft sizes*, and unusable as plant capacities. Nothing here may be presented as "the" hotel load per room.
- **Sprinkler values are from T4 reproductions of NFPA 13, and one class is missing.** The density/area pairs are mutually consistent with published US practice, but Ordinary Hazard Group 3 could not be retrieved from any source opened this pass, so it is absent rather than zero; the hose-stream allowances and the water-storage durations were also not retrieved as code text. `NEEDS VERIFICATION:` NFPA 13 current edition Table 11.2.3.1 (and its SI column), EN 12845 hazard classes for EN markets, and NFPA 14 standpipe demands.
- **Stair pressurisation flow is a placeholder, and the file says so twice.** Code gives pressure (0.05 min in NFPA 92 as retrieved; 0.10–0.35 in. w.g. under IBC §909); the 300–550 cfm/floor figure is a heuristic its own author warns about. Any shaft reserved on that basis is a reservation, not a design — the honest output is "5 tiles reserved, engineer to confirm", never a fan size.
- **Water velocity is assumed, not sourced.** SV-12/SV-16's 1.5 m/s drives the riser calibre for the whole wet services group. At 1.0 m/s the CHW riser goes from DN180 to DN220; at 2.0 m/s noise becomes the constraint. Retrieve CIBSE Guide B or a manufacturer's sizing book and replace the assumption — the sensitivity is printed in SV-12 precisely so it can be re-run.
- **Generator and fire-pump room figures come from tool documentation and a vendor guide**, not from NFPA 20 or an OEM data sheet. The heat-rejection split and the 5 K rise are plausible and internally consistent, but a 29 m² louvre is a large claim: it is the method's output, not a measured requirement, and the OEM curve governs. Its *direction* — engine rooms are limited by façade air, not floor area — is the part worth keeping even if the magnitude moves.
- **Two conflicts with the existing corpus, both deliberate and both in this file's favour as checks, not as verdicts.** (1) CN-17's placeholder run lengths (20 tiles small waste / 40 tiles soil) are too generous against SV-26's arithmetic on a declared 0.15 m build-up (14 tiles and 28 tiles); CN-17 should cite SV-26 for the numbers or state a different build-up allowance. (2) CN-19's carried constant "service band 1–2 tiles (0.5–1.0 m)" is a *band-width* figure and cannot carry a kitchen extract duct, an all-air floor's 1.2 m² main or a pressurisation riser (SV-04/SV-06/SV-13) — those are shaft/void items; the SKILL.md carried-constants row should be scoped to "corridor distribution band", with the air items pointing here.
- **One consistency check passed and should be recorded as such**: SV-12's SI derivation and the US 2.4 gpm/ton convention agree to within 1 % (5.56 K ≡ 10 °F), and SV-08's per-room OA derived from the code table lands inside the T4 practice band of 10–30 cfm/room. Where independent instruments agree, the file says so.
- **Gaps this pass could not close** (highest value first): ASHRAE 62.1 Table 6-1 from the standard itself; NFPA 13/14 code-text tables; IPC grease-interceptor clauses; CIBSE Guide A Table 1.5 in its own words; hotel DHW draw per bed-night (the number that decides hot-water plant, and the biggest single hole in this file); machine footprints and capacities (chiller/boiler/HVAC/lift kW) — all catalogue data, all flagged rather than invented.

---

## Type-specificity audit

| Rule | Universal? | Type where it binds hardest | Type where it relaxes or inverts |
|---|---|---|---|
| SV-01, SV-07, SV-13, SV-22, SV-25, SV-28 | Universal as method | all | none — but every value is jurisdiction- and type-specific |
| SV-02 (extract rates) | Universal as instrument | hotels (every room is a wet cell), hospitals, schools | offices and retail (single core sanitary; fewer extract paths) |
| SV-03 (bathroom extract = riser) | Not universal | **hotels, residential, dormitories** | offices, retail, industrial (few, large wet cores) |
| SV-04 (pressurisation duct) | Not universal | hotels/hospitals/mixed high-rise where the stair is not vented | low-rise, open-sided, EN 12101 naturally-vented stairs |
| SV-05 (garage) | Not universal | hotels/offices/hospitals with basements | retail/logistics (open yards), mixed-mode parks |
| SV-06 (hood cfm/ft) | Not universal | **hotels, hospitals, schools with production kitchens** | residential, offices (appliance-only, waived) |
| SV-08 (room-load/OA cross-check) | Not universal | hotels, dormitories, hospitals (bed-sitting rooms) | gyms, pools, theatres (latent/occupancy-led, not room-led) |
| SV-09 (diversity) | Universal as a warning | hotels, residential (high repetition) | theatres, stadiums, data halls (simultaneity is the design case) |
| SV-10 (heating fabric + air, DHW binds) | Climate-bound | hotels/residential in mixed climates; hospitals always (steam/DHW) | cold-climate offices/industrial (fabric dominates); tropical (heating absent, DHW still present) |
| SV-11 (per-floor plant check) | Universal as a check | hotels, hospitals, office towers | low-rise, single-tenant, industrial process plant |
| SV-12, SV-14, SV-15, SV-16 (water/shaft arithmetic) | Universal | towers over ~10 storeys | 2–4-storey buildings where one stack and one pump serve all |
| SV-17, SV-18 (densities, demand factors) | Jurisdiction-bound | offices, retail, hotels | industrial (process load dwarfs density figures) |
| SV-19 (switchroom geometry) | Universal | hospitals, data, hotels with large intakes | small retail (a board in a cupboard) |
| SV-20 (generator air) | Universal where generation exists | hospitals, hotels, data centres, airports | residential (no standby, or a small set outside) |
| SV-21 (lifts, EV) | Not universal | **hotels, hospitals, offices** (lift-bank load + traffic) | low-rise, logistics (EV dominates, lifts absent) |
| SV-22, SV-23 (sprinkler class, beams) | Universal as method | hotels (whole tower light-hazard, one floor OH), warehouses (storage class) | 13R low-rise lodging (four-head rule); open/exposed ceilings — re-check everywhere |
| SV-24 (fire pump room) | Not universal | high-rise hotels, hospitals, large retail | low-rise where mains pressure may serve without a pump |
| SV-25, SV-26, SV-27 (drainage) | Universal where gravity drainage exists | **hotels, hospitals, prisons, dormitories** (cell density × column) | offices/retail (few fixtures), pumped/vacuum systems (budget void) |

Type-specific register deltas the agent must load per type: **hotels** — SV-03 + SV-25 + SV-06 dominate (one wet cell per key, one hood per outlet, one extract per bathroom), and the 448-key column is what makes DN100 become DN125; **hospitals** — add SV-01's healthcare rows (exam 7.5/0.12, dental 10/0.18, pharmacy 5/0.18), plus redundant plant (SV-11's option B) and a second standpipe; **offices** — the per-floor OA number is small and the *air distribution* is the shaft driver, so SV-13's all-air vs chilled-water contrast decides the core; **retail** — hazard class flips at the stockroom, not the sales floor; **residential** — SV-01's dwelling row and the 3 VA/ft² figure, with no extract riser per unit if the code allows passive stack ventilation (`environmental-design.md` by ID); **industrial/logistics** — the register collapses to process load plus OH/extra-hazard storage classification (SV-22's missing OH3 row is exactly the gap that matters here).
