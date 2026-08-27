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

- Problem: the asset passability flag and per-tile navigation data overlapped ambiguously.
- Final solution: walkable=true bypasses the per-tile blocking grid; false = the grid governs. Flattened assets reset to fully blocked (deny-by-default). Rotation rotates navigation grids and interaction spots clockwise.
- Revisit trigger: sub-tile collision precision is ever needed.

### 4. Economy stays out until it has a purpose

- Problem: economy v1 shipped before players had a reason to care.
- Final solution: removed same day; design preserved in git history (search
  "Economy v1"). No cash/goals UI returns without a spending sink designed
  first.
- Revisit trigger: players ask what cash/goals are for, or a sink exists.

## 2026-08-25

### 5. Perimeter hotel boundary is derived, not placed

- Problem: NPCs crossed the envelope on floors without an explicit boundary, and persisted per-floor boundary data would fight canvas resize.
- Final solution: street-ring tiles are walkable only on `layout.streetFloorId`, blocked on every other floor; the envelope is derived from `isStreetTile` and `buildingArea()` instead of being persisted. Interior boundaries use explicit canvas wall segments.
- Trade-off: no sidewalk standing on non-street floors.
- Revisit trigger: exterior loitering or per-floor boundary overrides are needed.

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

- Problem: whole-floor drawing, doors, and decorations were improvised per session; results were inconsistent and unverified, and `build:hotel` could silently wipe hand-authored floors.
- Final solution: `docs/agents/floor-authoring.md` is the mandatory how-to-draw contract. Canvas walls are placed objects with logical grid coordinates, asset walls live on origin assets, doors are gaps, placements inherit origin definitions, and every floor edit must pass strict validation, engine boundary checks, BFS connectivity, and `npm run verify`. `build-hotel.mjs` remains scaffold-only while hand-authored floors are on disk.
- Trade-off: regeneration path (`npm run build:hotel`) is dangerous to run casually.
- Revisit trigger: floors return to code-generated authoring; then fold the wall conventions into `build-hotel.mjs` itself.

### 12. Room conversion was retired in favor of origin composition

- Problem: the former room conversion path created a separate room concept that did not compose cleanly with furniture, capacity, tags, or reusable presets.
- Final solution: room creation is no longer a separate canvas action. Users compose canvas wall segments and placed objects, then merge or flatten them into one origin asset. Asset-setting wall segments are edited in origin settings; canvas wall segments remain independent placed objects. Wall appearance is resolved from the global canvas settings.
- Trade-off: old room definitions and old floor content require the explicit clean-reset migration before new authoring begins.
- Revisit trigger: a future room authoring workflow needs semantic room metadata beyond origin composition.

### 13. Every load boundary routes through canonical normalize helpers

- Problem: `fetchBlueprintDataFromDisk` and `normalizeBlueprintLayout`
  spread raw disk JSON into the store via `as` casts (including an
  `as never`), bypassing `validateLayoutData()` and
  `normalizeOriginAssetFile()`. Only `npcConfig` was normalized at the
  load boundary; layout and origin assets entered unvalidated, creating
  a round-trip vulnerability where malformed/legacy persisted data could
  corrupt editor state and re-save unvalidated.
- Final solution: ALL load boundaries now route through the canonical
  helpers - `fetchBlueprintDataFromDisk` calls `validateLayoutData` +
  `normalizeOriginAssetFile` + `normalizeNpcConfig` before returning;
  `normalizeBlueprintLayout` delegates to `validateLayoutData` instead
  of duplicating validation with raw casts; `loadPersistedSyncPayload`
  dropped its `as never`/`as AssetDef[]` casts. The save path was
  already compliant (whitelist serializers + coverage records) and is
  the contract the load path must mirror. Engine-side queue defaults
  moved into a new `resolveQueueForTarget` helper paralleling
  `resolveInteractForTarget`, and corner-radius validation moved into
  `normalizeCornerRx` so `migrate.ts` and `OriginSettingPanel.vue`
  share one validator.
- Trade-off: load now rejects (returns null / throws) on data that
  previously entered silently - stricter, surfaces corruption instead
  of hiding it.
- Revisit trigger: a new ingress path (import, paste, sync receive) is
  added - it MUST route through the matching `normalize*` /
  `validateLayoutData` helper at the boundary, never via `as` casts.

## 2026-08-27

### 14. Wall canvas uses first-class segment geometry

- Problem: canvas boundaries and asset-setting boundaries were represented by separate implicit systems, which made selection, composition, and inheritance difficult to reason about.
- Final solution: `WallSegment` geometry (`x1,y1,x2,y2`) has two explicit sources. A canvas wall segment is stored on a wall placed object and is selectable/deletable through the object tool. An asset-setting wall segment is stored once on an origin asset and inherited live by every placed object that references that origin. The NPC engine consumes both sources as edge-blocking geometry. New presets merge all selected content into one origin asset and one placed object.
- Trade-off: the clean-reset migration intentionally discards old floor placements and old canvas boundaries; origin definitions are materialized before new authoring begins. Asset-setting walls remain origin-level and cannot be overridden per placement.
- Overlap policy: canvas wall segments and asset-setting wall segments are independent layers. Overlap is allowed without warning; rendering shows both and the engine treats either source as blocking the same edge. Deleting a canvas wall does not affect origin asset walls.
- Style policy: `wallColor` and `wallThickness` are controlled only by Canvas Settings and apply to every wall layer.
- Revisit trigger: per-placement wall overrides or a separate wall style per segment are requested.
