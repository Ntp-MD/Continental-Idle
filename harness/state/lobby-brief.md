# Lobby brief — floor-g (approved parti, 2026-09-27)

This file is the handoff for a fresh session. It exists because the design decision below was made in
chat and nowhere else. Read this first, then `scripts/arch/spec.json`, then the two research files named
at the bottom. Do not re-derive what is settled here — but do re-check anything marked ⚠.

## Site reading (confirmed by the user, and by the payload)
The hotel is **a city block in the middle of a town: streets on all four sides**. This is not a mood, it
is in the data — `streetWidthTiles: 8`, `streetFloorId: floor-g`, and the host's `isStreetTile` produces
an 8-tile ring on every edge, leaving a 100 × 60 tile plate (50 × 30 m, 1500 m²) as an island.

Consequences that follow from it, and that the previous designs ignored:
- there is no "back" of the building — service can take any of the four sides, so it should take the one
  that costs the guest experience least, not the default south;
- more than one public door is legitimate, which changes egress travel and kills the "single entrance at
  one corner" assumption that produced a 61.5 m travel distance;
- every side can be daylit, so the daylight band is no longer limited to one frontage (LP-13);
- the ground floor meets the street directly on all sides → retail / F&B can face outward and earn.

## PARTI — approved: "ถนนในร่ม / the covered street"
> The lobby is one long indoor street running between two doors, deliberately empty in the middle.
> Seating bays line the daylit edges like shopfronts. Reception and bell stand at the near end of the
> street — first thing you meet, not the thing you walk past. The vertical core is a plaza part-way
> along it, visible from the desk. Everything that serves the hotel sits **behind a gallery band** that
> the guest street never looks through.

This is the governing idea. Every later choice must be derivable from it: if a move does not make the
street read as a street, it is wrong regardless of whether it passes the checks.

## Programme floors (from `scripts/arch/spec.json`; ≥ means the spec is a MINIMUM)
| item | floor | source |
|---|---|---|
| standing / circulation field | ≥ 703 m² (2,812 tiles) | LP-14 1.4 m²/ped ⚠ programme only, never egress |
| seated area | ≥ 162 m² (647 tiles) | LP-14 3.3 m²/ped |
| seats | ≥ 49 (range 23–66) | SC-01/03 Little's Law; ⚠ dwell + seated share are declared, unsourced |
| seat clusters | ≥ 3, largest ÷ smallest ≥ 2, ≥ 60% in daylight | LP-06, LP-13 (LBNL T2) |
| reception stations | ≥ 5 (keys method says 3–4) | PP-08 vs LP-04 — two methods, both reported |
| counter length | ≥ 6.0 m at 1.2 m/station | LP-04 |
| queue band in front of counter | ≥ 3.7 m deep, kept clear | LP-04 |
| work space behind counter | ≥ 1.5 m | LP-04 |
| lift cars | ≥ 3 | LP-12 ⚠ one brand's ratio |
| lift foyer | ≥ 3 m deep in front of the portal line | LP-12 |
| WC groups | ≥ 2 (40 m travel cap cannot be met by one on this plate) | LP-09 ⚠ fixture counts unsourced |
| vestibule | ≥ 2.5 m between the two door lines | LP-02 |
| bell / luggage | ~9 carts ≈ 9 m², reachable from the kerb not the main door | LP-01, LP-11 |
| tables | ~1 per 4 seats | ⚠ **no source at all** — convention only |

## State of the repo right now
- `floor-g` is **empty** (cleared; street ring intact). No plan exists yet.
- The rectangle generator `scripts/arch/build-lobby.ts` was **deleted on purpose**: its
  `(ix0,iy0,ix1,iy1)` + rect-fill model could only ever emit bands of boxes, which is why every plan came
  out generic. Any new generator must draw at **1 tile = 1 map cell** so that floating wall segments,
  L/T plans, partial screens, bays, courtyards and an intentionally empty street are all expressible.
- The harness (`scripts/arch/`) is green: `npm run arch:selftest` → PASSED 14/14, `npm run lint` → 0/0.
  It measures and judges; it does **not** design.
- `scripts/arch/spec.json` holds the traffic + seating inputs. Nothing reads `seating` yet — `CAP-03`
  (seats provided vs `λ×W`) is not built.
- 90 assets exist in `originAssets`, each with its own white line-art silhouette, tagged by category.
- ⚠ Known harness defects still open: `CIR-04` measures travel distance from the declared arrival point
  across the whole plate (fine) but its 30 m screen is unsourced; `ENV-03` fires on WC doors beside
  junctions and has never changed a decision; the harness has **no** measure for partial walls,
  sightlines, or "does the street read as a street".

## What to do next, one step at a time
1. Draw the parti as a bubble/zone diagram on the 100 × 60 plate (street axis, two doors, bays, gallery
   band, core plaza, service side) — as a tile-level map, not as room rectangles.
2. Only then place rooms, then furniture, then run `npm run arch eval` and read the render **by eye**.
3. Build `CAP-03` when there is something to measure it against.

## Knowledge to read (in this order)
1. `architecture-skill/research/lobby-parti-survey.md` — LP-01…LP-29, the positive model with
   `Checkable as:` per rule, and its own concentration warning (six of nine origins are one brand).
2. `architecture-skill/research/seating-capacity-model.md` — SC-01…SC-07, the seating arithmetic and
   which inputs have no source.
3. `docs/df893ed93d658aeb1bb6794fdc192793.jpg` — the reference plan the user supplied. **Open it.** It is
   the source of the "floating screens, furnished hall, reception at the end, gallery band" moves.
4. `scripts/arch/README.md` — what the harness can and cannot decide (`CAPABILITY_MANIFEST.cannotRun`).
