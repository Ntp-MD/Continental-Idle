# 500-person scorecard - rebuilt arrival level

> **SUPERSEDED for geometry** - this scored the first rebuild (single portal group, no courts,
> 16 WC / 4 desks). The user rated it 3/10 for realism; the current plan and its measured scorecard
> are in `07-redesign-record.md`. The capacity arithmetic below still holds; the layout verdicts do not.

Measured from the tree after the rebuild (`npx tsx tests/_verify-lobby500.tmp.ts`, headless engine
run, live Chromium run). Basis column names the source; INF = arithmetic on a sourced number.

| Requirement for 500 occupants | Basis | Provided | Verdict |
| --- | --- | --- | --- |
| Plate area | HB-01 comfortable standing 1.2 m2/p (FACT) -> 600 m2 of standing alone; code floor: IBC 2021 Table 1004.5 assembly standing 5 ft2/p -> 232 m2 / 927 tiles (`04-code-verification.md`, verified) | 1,421 m2 net envelope (100 x 60 tiles = 50.0 x 30.0 m), 1,167 m2 of it public/free | met: 5x the code floor, 1.9x the comfort figure |
| Free floor per person | HB-03 movement 8 tiles/p (FACT) | 8,075 walkable tiles; 16.1 tiles (4.02 m2) per agent live | met |
| Seats | ~35 % seated at peak = 175 (03-throughput, INF from HB-22/HB-12d) | 224 seat spots across lounge/dining/bar/cafe (173 objects, 328 interaction spots total) | met |
| Check-in | 2-3 desks (03); reception-desk = 8x1, 6 spots, cap 4, queue 4 deep | 4 desks = 32 tiles of counter, 24 guest spots, 4 rows of clear frontage in front of each (HB-20c 24 tiles) | met |
| WCs | IPC 2024 Table 403.1 (= IPC 2018 405.1), 50/50 split, round up: theater basis 6 WC, the governing (dance-hall) row 14 WC, design pick 8 WC + 2 urinals + 6 lav + 2 accessible (`04`, verified) | 16 toilet + 14 washbasin in one 108 m2 block on a shared drain stack | met above the governing row; urinals and drinking fountains have **no surviving asset**, and an accessible stall's clear floor space is not expressible on a 0.5 m grid (not representable, not approximated) |
| Vertical transport | KB refuses cars-per-occupant (MS-10/SR-17, FACT); HB-11 ~275 tiles of lift-hall standing (FACT). External traffic figures **NOT VERIFIED** (source PDFs image-only): 12-15 % 5-min HC, <=30 s interval, 1 car per 60 rooms -> 5 cars for 250 keys, labelled assumption in `04` | 6 `elevator-1` cars (2x2, cap 4, 24 spots) + 114 m2 lift hall, 3 rows clear on both sides of every car | met against the assumed rule; the count rests on an assumption, not a fetched code number |
| Egress width | IBC 2021 1005.3.2: 0.2 in/occ (0.15 sprinklered) -> 100 in / 75 in = **6 tiles / 4 tiles** of clear run; 1006.2.1.1: 3 exits once the load passes 500 (`04`, verified) | 24 tiles (12.0 m) of perimeter door run in 6 groups on 3 faces: north 4+6+4, east 4, west service 2, south BOH 4 | met, 4x the width and 2x the exit count |
| No single-file choke | agent clearance 0.5 tile; 2 tiles is the first passing width (KB 2.3/2.4, FACT) | every public opening is a 4-6 tile run; no corridor exists - rooms are open halls joined by arcade doors | met |
| One connected floor | sealed pockets fail `validateLayoutIntegrity` | 8,075/8,075 walkable tiles in 1 component; 0 2x2 solid masses; integrity "no issues" | met |
| Reachability | real A* per role from the street spawn | 10/10 roles reach 100 % of their focus targets (guest 163/163, security 125/125, chef 31/31) | met |
| BOH/FOH separation | tags gate roles (KB 2.4, FACT) + geometry | kitchen/staff/laundry behind the col-23 spine, entered from the dining servery and the west service door; guest role carries `restrictedTags: back-of-house` | met |
| Wiring | `collectWiringIssues` | 0 issues (was 5 "pool count is 0" notes - the roles behind those posts are now deployed) | met |
| Wayfinding signage | KB 18 (signage asset) | **not provided** - the `signage` asset no longer exists in the 20 surviving origin assets | gap, not fixable in data |

## Live evidence

- Chromium, Deploy through the UI: **502 agents live**, `Moving 318 Interacting 20 Chatting 62 Waiting 102`
  at t+120 s, 61.5 FPS, 0 console errors, 0 dialogs. Reaching 502 needed one code fix: the sim
  clamped each role to 100 at spawn (`useNpcSimulationCore.ts:28`), contradicting the data layer's
  1000 ceiling (`domain/schema/npc.ts:290`); raised to 1000.
- Headless real engine at the same 502: one agent per tile, 60 of the 10x10 blocks occupied, no
  `stuck`/`lost`, 5.4x realtime, 33 s wall for 180 s of sim. Service uptake in that harness
  (28/502 ever interacted) is a harness artifact - the browser at the same population shows 82 in
  interaction/chat, so the headless policy wiring under-drives targeting. Spatial absorption is the
  valid read from it; service ratios come from the browser run and the spot arithmetic.
- Concurrent demand read: 21 interacting against 336 interaction spots means the fixtures are not the
  binding constraint at 500 - the population is moving and socialising, not queuing. `Waiting` sits at
  ~19 % of the population, which is the engine's idle/latched state, not a queue overflow
  (`Queued` peaked at 1).

## What the rebuild changed structurally

- `layout.canvas` 80 x 50 -> **116 x 76 tiles** (1600x1000 px -> 2320x1520 px at tileSize 20). This is
  a layout-level field: every floor inherits the bigger frame. Payload 153 KB vs the 5 MB cap.
- 14 derived rooms: lobby 298 m2, arrival hall 220 m2, lift hall 114 m2, bathroom 108 m2, dining
  131 m2, bar 61 m2, gym 52 m2, 3 lounges 131/62/52/45 m2, kitchen 49 m2, laundry 48 m2, staff 45 m2.
- Control grid published for the next floor: perimeter rows 8/67 + cols 8/107, spine lines col 23 and
  col 92, band lines row 18/37/53, lift core rows 47-48 cols 62-81, 12-tile bay pitch.
