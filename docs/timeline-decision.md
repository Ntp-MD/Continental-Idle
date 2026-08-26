# Decision Timeline

Direction-level decisions ONLY: choices that constrain how future work must
be designed. This is the project's decision memory, not a changelog -
routine fixes, refactors and minor cleanups do NOT belong here.

- Format per entry: Problem -> Final solution -> (Trade-off when real) ->
  Revisit trigger.
- Grouped by date, oldest-first within each date.
- Supersedes the former docs/adr/ notes and the Decisions list that lived in
  docs/agents/core.md.

---

## 2026-08-24

### 1. No undo/redo in the blueprint editor

- Problem: destructive actions could lose work; owner chose no history stack.
- Final solution: confirms state the truth ("cannot be undone"), never
  reference Ctrl+Z; per-mutation autosave via `saveBlueprintData` is the
  safety net.
- Revisit trigger: user requests history after losing work.

### 2. Placements inherit everything from origin assets (rotation-only editable)

- Problem: per-instance copies of colors/details drifted from origins and
  doubled the persisted schema.
- Final solution: instances edit rotation only; every other property resolves
  live from the origin asset (`defaultFillColor` / `defaultStrokeColor`,
  outline derived from fill). No editable per-instance copies, ever.
- Revisit trigger: per-instance recoloring is requested again.

### 3. `asset.walkable` is the single passability master switch

- Problem: asset flag and painted per-tile grid overlapped ambiguously.
- Final solution: walkable=true bypasses walkableGrid/tileEdges entirely;
  false = grid governs. Flattened assets reset to fully blocked
  (deny-by-default). Rotation rotates grid/states/edges/spots clockwise.
- Revisit trigger: sub-tile collision precision is ever needed.

### 4. Economy stays out until it has a purpose

- Problem: economy v1 shipped before players had a reason to care.
- Final solution: removed same day; design preserved in git history (search
  "Economy v1"). No cash/goals UI returns without a spending sink designed
  first.
- Revisit trigger: players ask what cash/goals are for, or a sink exists.

## 2026-08-25

### 5. Perimeter hotel wall is derived, not painted

- Problem: NPCs crossed the envelope on floors without hand-painted walls,
  and persisted per-floor walls would fight canvas resize.
- Final solution: street-ring tiles are walkable ONLY on
  `layout.streetFloorId`, blocked on every other floor; derived from
  `isStreetTile` / `buildingArea()` instead of being persisted. Interior
  walls stay hand-painted in `walkable.tileEdges`.
- Trade-off: no sidewalk standing on non-street floors.
- Revisit trigger: exterior loitering or per-floor wall overrides needed.

### 6. Synced objects derive size from origin assets

- Problem: `serializeObject` persists no w/h, so copying sizes verbatim
  synced undefined dimensions - placed objects rendered invisible on fresh
  boot.
- Final solution: `buildSyncedObject` derives missing/non-positive sizes via
  `assetSizeFor` (rotation-aware). Placements carry no authoritative
  dimensions by design.
- Trade-off: object whose asset vanished syncs as 0x0.
- Revisit trigger: the schema starts persisting authoritative sizes.

### 7. Browser persistence limited to view toggles

- Problem: persisted floor/mode/selection ids dangled across devices
  (localStorage does not travel with git-tracked data); the zoom key was
  broken by design (wrote localStorage, read sessionStorage).
- Final solution: only `blueprint-view-toggles` persists; sessions open
  deterministic on floor G / object mode / fit-to-screen; boot guards fall
  back on any stale id.
- Trade-off: refresh restores nothing except toggles.
- Revisit trigger: single-device restore matters again (fingerprint-gate any
  restored id against current data).

### 8. NPC presence is tag-driven

- Problem: the game sim never received asset tags, so staff roles could not
  match floors at runtime; placement was guesswork.
- Final solution: roles and tasks bind through asset tags +
  `spawnRule.targetTags`. Pool `count` spawns per MATCHING floor; a role
  appears only on floors whose placed assets carry its tags. All content
  lives in the four `src/blueprint-editor/data/*.data.ts` modules.
- Revisit trigger: portals between floors, per-floor allowedRoleIds, or
  role-specific walkables.

### 9. Floors are authored by script and measured by harness

- Problem: one-off floor edits drifted and agent behavior was unmeasurable.
- Final solution: `build-hotel.mjs` (`npm run build:hotel`) is the permanent
  idempotent authoring tool (throws on furniture/rib-column overlap; tag
  taxonomy kept narrow on purpose). `observe-hotel.ts`
  (`npm run observe:hotel`, seeded) is the measurement gate before shipping
  behavior changes.
- Revisit trigger: presentation polish (day/night tint) if the diorama feels
  flat on long watches.

## 2026-08-26

### 10. Cache purge happens only at dev startup

- Problem: chaining `clear-cache` into typecheck/build/verify wiped the LIVE
  dev server's Vite optimizer cache mid-session - forced reloads and Windows
  file-lock crashes surfaced as "system down" alerts (engine itself proven
  leak-free by seeded soak test).
- Final solution: `clear-cache` runs ONLY on `npm run dev`; verify paths
  never purge caches; manual recovery via `npm run clear-cache`.
- Trade-off: verification may see a warm-but-revalidated cache.
- Revisit trigger: phantom stale-module errors - rerun isolated first, then
  purge manually; never re-chain the purge into verify paths.

### 11. Agent floor authoring follows a written convention

- Problem: whole-floor drawing (walls via `walkable.tileEdges`, doors,
  decorations) was improvised per session; results were inconsistent and
  unverified, and `build:hotel` could silently wipe hand-painted floors.
- Final solution: `docs/agents/floor-authoring.md` is the mandatory
  how-to-draw contract - paint only via `applyWallSegment`, doors are gaps
  (never arc objects), placements reference origin asset ids with live
  color resolution, and every floor edit must pass the verification gate
  (strict validate + per-room seal check + BFS door connectivity +
  `npm run verify`). `build-hotel.mjs` is demoted to scaffold-only while
  hand-authored floors are on disk.
- Trade-off: regeneration path (`npm run build:hotel`) is now dangerous to
  run casually.
- Revisit trigger: floors return to code-generated authoring - then fold
  the wall conventions into `build-hotel.mjs` itself.

### 12. Asset tileEdges are the canvas wall system; rooms convert one-way

- Problem: painted floor walls (`walkable.tileEdges`) and `isWall` objects
  were two unmanaged wall concepts; rooms assembled from pieces (bathroom:
  needs capacity + tags) had no path into the wall/blocking system.
- Final solution: ONE wall representation - `TileEdges[][]`. Asset-level
  edges block NPCs through the same engine path as floor walls and render
  live with canvas `wallColor`/`wallThickness` (never baked into SVG).
  "To Room" converts framed painted walls into a single room asset
  (flattened, walkable:false, interior tileStates 'walkable', perimeter
  edges with door gaps) and erases the source edges. One-way: no
  object->painted-wall conversion.
- Trade-off: converted rooms are full-tile rects (boundary-line walls
  snap inward); free-form wall shapes stay in the painted system.
- Revisit trigger: L-shaped / non-rectangular room assets are requested,
  or live per-object wall thickness separate from canvas config.
