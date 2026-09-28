# Research file — Lobby seating capacity: a demand model, not a ratio

Scope: how to size the **seats and tables** a hotel lobby floor needs, from a declared flow (people
walking in and out per day) and a declared resident population. This file exists because the corpus has
**no seats-per-key, seats-per-occupant or lobby-dwell figure anywhere** — `hotel-operating-standards.md:463`
records every F&B and lobby seating index as *missing, not weak*, and `HO-17` is explicitly derived. A
ratio invented to fill that hole would look like knowledge and behave like a guess, so this file supplies
a **method** instead: convert flow into simultaneous occupancy, then occupancy into seats, then seats into
floor area, and state every input's provenance.

Method: **Little's Law** (`L = λ × W`), the standard queueing relation between arrival rate, time spent in
a place, and how many are there at once. It is used here as arithmetic, not as a citation from this
corpus; the *inputs* are where this floor's facts come from.

Host grid: `1 tile = 0.5 m`, `1 m² = 4 tiles`. The worked case is the declared brief: plate 50 × 30 m
(1500 m², 6000 plate tiles), **502 occupants present** (470 guests + 32 staff from `npcConfig.pool`),
**500 walk-ins and 500 walk-outs per day** (`scripts/arch/spec.json`).

---

## Rules

### SC-01 Seats are sized from simultaneous occupancy, never from a share of rooms
- Rule: The number of seats is the number of people who are *sitting at the same time* during the peak
  band. Compute it as `L = λ × W`, where `λ` is seatings per hour in the peak band and `W` is the average
  minutes a seat is occupied. Do not derive seats from keys, from floor area, or from a percentage of
  occupancy — those are proxies that hide the actual question, which is how long a chair is held.
- Evidence: The same arithmetic is already the operator's own for a different lobby object: reception
  pods are sized by `desks = ceil(peak_arrivals × 4 min / peak_window_min)`
  (`professional-practice.md:311`, PP-08) — arrival rate × service time ÷ window. A seat is the same
  equation with a different dwell. The peak concentration used for both comes from
  `professional-practice.md:298,301`: "sixty arrivals at four minutes each is 240 minutes" and
  "15:00–17:00 lobbies carry 3–4× off-peak".
- Source: `architecture-skill/research/professional-practice.md` PP-08 (:298, :301, :311) · method: Little's Law (queueing theory; **not** sourced from this corpus)
- Class: METHOD (the relation) + BUILDING-TYPE CONVENTION (the peak factor borrowed from the desk case)
- Scope: any lobby with a declared daily flow. A lobby with no declared flow cannot be seated by this method — say so rather than defaulting.
- Confidence: High for the method (it is arithmetic on a standard law); Low for any single answer it produces, because `W` and the seated share are unsourced — see SC-04.
- Checkable as: `seats_required = ceil(peak_seatings_per_hour / 60 × dwell_minutes × margin)`; report the three inputs alongside the result, never the result alone.
- Exceptions / failure mode: Sizing seats from "1 per 2 rooms" on a 250-key house gives a number that
  cannot be argued with when the lobby is full at 16:00 and empty at 11:00. That is the failure this rule
  exists to prevent: a count that is *average-shaped* rather than peak-shaped.

### SC-02 Who sits: seatings are three different populations, and only one is the walk-in flow
- Rule: Count seatings separately for (a) arriving guests waiting, (b) departing guests waiting, (c) the
  resident population using the lobby as a living room. Sum them before applying the peak factor. The
  walk-in/walk-out figure is *not* the lobby population and the resident count is *not* the flow — mixing
  them double-counts or drops whichever the designer forgot.
- Evidence: The brief's own two numbers disagree in kind: `npcConfig.pool` declares 470 guests *present*
  (a standing population) while the project declares 500 in + 500 out per day (a flow). The operator's
  document treats non-resident traffic as a surcharge on the resident load rather than as its own count —
  "plus **20% additional for visitors**" for shuttle elevators (`Lobby Areas`, Module 12, 12.6.D) — which
  is evidence that the two populations are meant to be added with different weights, not merged.
- Source: `src/blueprint-editor/data/blueprint-data.json` (`npcConfig.pool`, `roles`) · `architecture-skill/research/lobby-parti-survey.md` LP-14 · https://crhotelmanagementgroup.com/wp-content/uploads/2024/10/12-Auto-Collect-Module-12-Elevators.pdf — T4
- Class: METHOD
- Scope: universal on this brief.
- Confidence: High that the populations are distinct; the split percentages are declared (SC-04).
- Checkable as: `seatings_per_day = walkIns × seatedShareArriving + walkOuts × seatedShareDeparting + residentsPresent × lobbyVisitsPerGuestPerDay`.
- Exceptions / failure mode: A day conference/banquet load sitting *on the same floor* is a fourth
  population and dominates all three; the corpus's own event indices (1.4 m²/person ballroom, LP-14) are
  the tool for it, and LP-12's warning that function traffic "do[es] not overload the passenger elevators"
  applies to seats too.

### SC-03 Worked result on the declared brief: about 50 seats, and the range is the honest answer
- Rule: Run the model with declared inputs and publish the number *with* its sensitivity, not as a
  specification.
- Evidence: With the brief's figures — 500 in, 500 out, 470 present; seated shares 35% / 15% / one lobby
  visit per resident per day (all declared, SC-04) — seatings/day ≈ 175 + 75 + 470 = **720**. Peak band
  from PP-08's factor: 720 ÷ 12 two-hour blocks × 3 = 180 seatings per 2 h → **λ ≈ 90/h**. At a declared
  **W = 25 min (0.417 h)**: `L = 90 × 0.417 ≈ 38` seats held at once; × 1.3 design margin (groups,
  luggage-held chairs, sub-hour spikes) → **≈ 50 seats**. Area at the operator's own seated index of
  3.3 m²/person (LP-14): 50 × 3.3 = **165 m² = 660 tiles ≈ 11% of the 6000-tile plate**.
- Source: derived on this brief from `professional-practice.md:298,301,311` (peak factor) and `lobby-parti-survey.md` LP-14 (3.3 m² seated, 1.4 m² standing)
- Class: HEURISTIC — the method is sound, two of the five inputs have no source at all.
- Scope: this plate and this flow only. Re-run for any change in declared load.
- Confidence: Medium on order of magnitude (tens, not hundreds), Low on the exact count.
- Checkable as: `seats_provided >= 50` and `seated_zone_tiles >= 660` on the declared brief; both reported with the input table below so a reviewer can disagree with an input rather than with the answer.
- Exceptions / failure mode: The last generated lobby carried 12 seating units (≈ 20–24 seats) against
  this requirement — a 2× shortfall that no area metric noticed, because area was measured per person
  *standing* (LP-14/CAP-02) and a bare plate passes that test easily.

### SC-04 The two inputs that decide the answer have no source: declare them or the number is fiction
- Rule: Publish the sensitivity. `dwell W` and `seated share of arrivals` are not in this corpus in any
  form, and they move the answer more than every other input combined.
- Evidence: Searched result — **no source found** for a lobby dwell time, a seated fraction of arrivals, a
  check-in wait distribution, or a walk-in peak factor anywhere in `architecture-skill/research/`. The
  corpus's only lobby-adjacent dwell figures are service times at a counter (PP-08's 4 min) and borrowed
  event densities (LP-14). Sensitivity on this brief: `W = 15 min → ~23 seats`, `25 → ~50`, `40 → ~60`;
  seated share of walk-ins `20% → ~30`, `35% → ~50`, `50% → ~66`.
- Source: negative result, this file · `professional-practice.md` PP-08 · `lobby-parti-survey.md` LP-14
- Class: DECLARED ASSUMPTION (each input is a project decision, not a published figure)
- Scope: universal — this is the reason the output is a range.
- Confidence: High in the sensitivity itself (it is the model recomputed), which is the point.
- Checkable as: the seating verdict must be emitted as `required = N (range A–B over the declared inputs)`; a single number with no range is a reporting bug in whatever produces it.
- Exceptions / failure mode: A brief that declares its own dwell (a resort where the lobby *is* the
  living room, 60–90 min) doubles the seat count with the same flow. That is a design input, and the
  model should be re-run rather than averaged toward the city-hotel case.

### SC-05 A seat is not a piece of furniture: the catalogue's own conversion, stated
- Rule: Convert placed furniture into seats with an explicit per-asset table, because "has 12 sofas" and
  "has 24 seats" are different claims and the plan needs the second one. Derive from footprint at
  **0.6 m of width per seated person** (a standard chair pitch, declared) and state it once.
- Evidence: Footprints are engine data (`originAssets.w/h` in tiles at 0.5 m). `sofa-1` is 2 × 1 tiles =
  1.0 × 0.5 m → 2 persons at 0.5 m each, or 1 at a comfortable 1.0 m; `single-sofa-1` is 1 × 1 tile =
  0.5 m → 1; `bench` is 2 × 1 tiles → 2; `custom-table-set` is 2 × 3 tiles = 1.0 × 1.5 m → a four-seat
  group. **No source in this corpus gives a seat pitch for hotel lounge furniture**; 0.6 m is the
  conventional chair width used across seating design and is recorded here as a declared convention so a
  reviewer can change it and see the seat count move.
- Source: `src/blueprint-editor/data/blueprint-data.json` (`originAssets`) · pitch: declared convention, **no source found**
- Class: BUILDING-TYPE CONVENTION
- Scope: the current catalogue only; a new seating asset needs its own row.
- Confidence: High for the footprints (engine data), Medium for the pitch.
- Checkable as: `seats_provided = Σ placed_asset.seats`, with `sofa-1: 2`, `single-sofa-1: 1`,
  `bench: 2`, `custom-table-set: 4`, `table-1: 2 (with its two seat tiles)`, `dining-table-4: 8`,
  `cafe-table-2: 4`, `high-table-1: 4`, `armchair-1: 1`, `dining-chair-1: 1`, `bar-stool-1: 1`,
  `pool-lounger-1: 1`, `theatre-seat-1: 1`, `office-chair: 1 (staff, not guest seats)`.
- Exceptions / failure mode: Counting a table as seats inflates capacity — a table with nothing to sit at
  is a surface, not capacity. Count seats, then separately require roughly one table per four seats so
  the seats are usable.

### SC-06 Seats must be clusters of differing size, and most of them must be in the daylight band
- Rule: Do not satisfy the seat count with one uniform run. LP-06 requires **≥ 3 clusters and ≥ 2 sizes**
  (largest ÷ smallest ≥ 2), and LP-13 requires the daylit share of seating to be **≥ 60%** of seat tiles.
- Evidence: `lobby-parti-survey.md` LP-06 ("varied seating groupings … quiet / private or open / visible",
  "intimate groupings with cocktail tables of varied height", and the outlet rule "1 for every 3 seating
  areas", which only makes sense if groups are discrete) and LP-13 (LBNL: perimeter daylight depth
  1.5–2.0 × window head height; on a 30 m plate a single frontage cannot light the whole floor).
- Source: `architecture-skill/research/lobby-parti-survey.md` LP-06, LP-13 · https://eta-publications.lbl.gov/sites/default/files/tips-for-daylighting-2013.pdf — T2
- Class: BUILDING-TYPE CONVENTION (clustering) + STANDARD (daylight depth)
- Scope: any lobby with a seating programme.
- Confidence: High (three sources on clustering, two of them official; LBNL on depth).
- Checkable as: cluster = seat tiles within 6 tiles (3 m) of each other; require `clusters ≥ 3`,
  `maxClusterSeats / minClusterSeats ≥ 2`, and `seatTilesInDaylightBand / seatTiles ≥ 0.6`. A useful
  distribution for 50 seats: 2 large groups (14 each), 3 medium (6 each), 4 small (2 each) = 56 seats.
- Exceptions / failure mode: The named failure in LP-06 is exactly what earlier generated plans produced:
  several identical clusters, which satisfies "has seats" and reads as a gate at an airport.

### SC-07 What this model must never be used for
- Rule: `L = λ × W` sizes **comfort and programme**. It is not an egress calculation, not a fire load, and
  not a code occupant load.
- Evidence: The operator document says this about its own densities: the 1.4 / 3.3 m² figures are for
  elevator sizing and "**This criteria is not used for fire exit capacity; see Module <14>**"
  (`Module 12`, 12.6.C.3). The corpus's egress and occupant-load rules live elsewhere
  (`building-codes.md` CODE-01 factors, `fire-safety-quantification.md`).
- Source: https://crhotelmanagementgroup.com/wp-content/uploads/2024/10/12-Auto-Collect-Module-12-Elevators.pdf — T4 · `architecture-skill/research/building-codes.md` CODE-01
- Class: SCOPE LIMIT
- Scope: this file.
- Confidence: High — the source disclaims itself.
- Checkable as: any seating number produced here must be labelled `programme capacity`, never `egress capacity`, and the harness's `CAP-01`/`CAP-02` rows keep their own (standing/area) basis.
- Exceptions / failure mode: The likely misuse is a future check that "seats ≥ occupant load" and calls it
  a safety result. It would be wrong twice: the load is not the flow, and seats are not exits.
