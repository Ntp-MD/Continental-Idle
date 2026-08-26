# AGENT_PROGRESS

Mission: 11-storey hotel CAD design system (structured SVG floor plans, fresh-drawn, no origin assets).

## Status: COMPLETE - verify + build green

## Completed this session
- Stage 1 repo inspection: existing app = blueprint editor + NPC diorama
  (HotelCanvas renders synced floors; build-hotel.mjs authors furniture).
  Kept untouched per scope discipline.
- Stage 2-3 architecture: `src/cad/` pure-TS system, units in metres,
  SCALE 28 px/m.
  - spec.ts: 44 x 22 m slab, 4.0 m grid A-M x 1-4, ext wall 300,
    partitions 200, light 100, corridor clear 2200, floor-to-floor 3400.
  - Central core x16-28: stair SC-1 (3750 x 4650, U-run 20R@170),
    4 lifts (P1-P3 passenger + S1 service, 1900 pitch) opening north to
    the corridor, common MEP riser behind. Wing stairs SC-A / SC-B at
    opposite ends for egress; their back strips absorbed as L-shaped
    corner rooms / terraces (no dead interior rooms).
  - Guest module: 3800 wide, room 6700 deep + entry hall + bath strip
    stacked identically on every typical floor; soil shafts at 4 fixed
    positions per floor.
- Stage 5 ground floor: lobby lounge + reception/concierge, storefront
  entrance with canopy note, restaurant (~90 covers), private dining in
  core-under strip, main kitchen + cold/dry stores with service point,
  public WC block (M/F/access), loading dock NW, staff canteen/lockers/
  office/admin, luggage store off lobby.
- Stage 6-7 floors 2-9: one template, king/twin mix, corner kings both
  ends, accessible king beside the lifts, Deluxe Suite L-module over the
  core strip, housekeeping room on every floor, 16 keys each.
- Stage 8: floor 10 premium (Signature Suite double-bay, Grand Suite,
  Club Lounge with bar, deluxe mix). Floor 11 signature (Presidential
  Suite 4-bay with living/master/second/gallery, Signature Suite,
  Executive Lounge, Sky Bar + terrace, Owner's Suite L, private dining,
  2 meeting rooms). Roof R: lift motor room, 3 stair bulkheads, AHU deck,
  cooling towers, PV array, dishes, hatches.
- Stage 9 CAD details: poche envelope, columns on all grid crossings,
  door swings (single/double/openings), window + storefront glyphs,
  dimension chains (bays + overall in mm, corridor CLR, core dims),
  grid bubbles A-M/1-4, legend, north arrow, scale bar, title block per
  sheet with drawing numbers A-G01 ... A-R01.
- Stage 10 QC: `src/cad/validate.ts` + `tests/test-cad-layout.ts`
  (wired into `npm test`): duplicate ids/numbers, bounds, overlaps,
  connectivity BFS from corridor, core/lift/stair stacking, bath
  stacking across typical floors, fixture containment, door-on-edge,
  svg structure/groups/balance. 15 checks green.
- Stage 11 visual audit fixes applied:
  - Administration width formula produced negative rect (fixed).
  - Cold/Dry store overlap 0.72 sqm (fixed).
  - Soil shafts collided with toilets (moved to corridor-side wall).
  - Sky Bar fixtures exceeded room bounds (repositioned).
  - Club Lounge furniture exceeded bay (relaid out).
  - Overall dim chains rendered off-sheet; scale bar ran into the title
    block (ORG moved to 112/104, offsets -1.95/-2.65, scale bar 10 m).
  - Floor 11 sheet title collided with drawing number (renamed).
  - Presidential gallery access rewired (living gets own corridor door;
    bath opens off gallery; bogus living-to-bath opening removed).
  - Floor 11 service flow: pantry now connects to Executive Lounge and
    internally to its hall; housekeeping room gained its internal
    hall opening on all floors.
- Stage 12 UI integration: new Plans tab (`CadPlans.vue`) in GameLayout
  with level buttons G..11,R and keys/GFA readout. v-html mount decision
  recorded (sanitizer strips style/use needed by CAD linework; content is
  first-party generated).
- docs/agents/core.md ADR entry added.

## Verification performed
- npm run verify: green (typecheck, BEM lint, full suites incl.
  test:cad, verify:assets 24 assets).
- npm run build: green after fixing strict-mode errors caught only by
  vue-tsc -b (unused const, boolean arithmetic TS2363/TS2367).
- Text-frame + text-collision audits over all 12 sheets: clean.

## Long-run stability audit (user-reported "system down" alerts)
- Soak test (temp harness, 11 floors x 100 agents): 400k ticks at 60tps,
  heap flat 17 -> 22 MB, agent count stable, events drained per chunk.
  Engine has NO leak; all engine maps are bounded or expire by tick.
- ROOT CAUSE of IDE "system down" alerts during long runs: `clear-cache`
  (deletes node_modules/.vite - the LIVE dev server optimizer cache) was
  chained into typecheck, build and verify. Every verification pass in a
  long session wiped the running `npm run dev` server's cache -> forced
  re-optimization/full reloads or hard crashes on Windows file locks.
- Fix: clear-cache now runs ONLY on `npm run dev` (fresh start, safe).
  typecheck / build / test no longer purge it; verified green twice
  without the purge (it was never needed there). Manual recovery still
  available via the standalone script.
- No console spam in hot paths; game-side deep watch is one-shot per
  payload swap, not per frame.

## Remaining
1. Optional polish: pan/zoom in CadPlans if sheets feel small at 1:100;
   per-room area labels on typical floors (currently suites/public only);
   section/elevation drawings if a vertical drawing set is wanted.

## Known issues
- None open.

## Next recommended action
User opens the Plans tab and reviews each level; report anything that
breaks plausibility and it gets redrawn.
