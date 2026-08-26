# Floor Authoring (walls, rooms, decorations)

Conventions for agent-driven drawing of whole floors in
`floorPlan.data.ts`. Follow these so every session produces the same
geometry, the same door style, and passes the same checks.

## Where

- `src/blueprint-editor/data/floorPlan.data.ts` is the persisted layout.
  Re-read it immediately before editing; the editor save-flow rewrites it
  at any moment and current content wins over chat history.
- WARNING: `npm run build:hotel` (`scripts/build-hotel.mjs`) REGENERATES
  `floorPlan.data.ts` from code and will wipe any hand-painted walls /
  manual floors. Do not run it while hand-authored floors are on disk;
  treat it as a scaffold generator only.
- Paint walls only through `applyWallSegment`
  (`src/blueprint-editor/composables/useWallPaint.ts`). Never hand-edit
  individual edge flags - the helper sets both mirror sides and keeps
  boundaries consistent with the Draw Wall tool.

## Coordinate system

- Canvas is 1600x1000 at tileSize 25: a 64x40 tile grid. Tile (x, y)
  covers pixels `[25x, 25x+25)`.
- Street ring is 8 tiles wide (`STREET_TILES`), so the buildable interior
  spans tiles x 8..55, y 8..31 (pixels 200..1400 x 200..800).
- The lobby floor is `streetFloorId`: street tiles are walkable there and
  blocked on every other floor (perimeter wall is derived, not painted).
- Walls sit on boundary lines between tiles at multiples of 25px. A
  horizontal segment at y=400 paints the boundary between rows 15 and 16.

## Wall segments

- Segments must be axis-aligned and snapped to 25px multiples.
- When redrawing an entire floor, reset every cell of `tileEdges` to `{}`
  first for a clean slate instead of painting over stale walls.
- Keep a running list of painted segments in the session summary so the
  verification step can check each one.

## Doors

- NEVER draw a door arc. No arc shapes, no door assets, no door objects -
  a door is only the gap itself. This applies even when explicitly drawing
  a detailed floor; only add door art if the user asks for it in that
  exact request.
- A door is a gap left between two wall segments.
- Main entrance: 4 tiles wide on the street-facing exterior wall.
- Interior doors: 2-3 tiles wide.

## Wall-to-room conversion

- "To Room" (canvas controls, visible in Draw Wall mode) converts selected
  painted wall segments into ONE room origin asset: `origin: 'flattened'`,
  `walkable: false`, local `tileEdges` from the segments, `tileStates` all
  `'walkable'` (interior passable), plus a plain body SVG. The source
  painted edges inside the frame are erased to avoid double-blocking.
- Asset `tileEdges` ARE the canvas wall system - same schema, same engine
  path (`getTileEdge`), rendered live with canvas `wallColor` /
  `wallThickness`. Never bake wall color/thickness into asset SVG art.
- After conversion, set tags / queue / interactSpots / entrance rows on the
  new asset via Origin settings; capacity and role matching are asset
  fields, not placement fields.

## Decorations and furniture

- Placed objects reference origin assets by id from
  `originAssets.data.ts`. Unknown type ids are silently dropped by
  `migrate` / `buildSyncedPayload` - verify every id exists first.
- Objects never carry editable color copies; they resolve fill/stroke live
  from their origin asset (SVG v2 convention). Do not set fillColor /
  strokeColor on placements unless the design deliberately overrides.
- Snap positions to the 25px grid.
- NPC awareness of furniture comes from the ASSET's fields (`walkable`,
  `walkableGrid`, `tileStates`, `tileEdges`, `interactSpots`) resolved at
  sync time - placement alone does not block movement.
- Leave walkways at least 2 tiles clear between object footprints and
  walls/doors so BFS connectivity holds after placement.

## Verification gate (mandatory)

Before reporting done after any floor edit:

1. `validateLayoutData(structuredClone(data))` returns non-null (strict).
2. Every room is SEALED: each wall crossing yields an engine blockedEdge,
   except its designed door gap(s). Check both mirror sides via the engine,
   not raw edges alone.
3. BFS over `buildNpcEngineLayout` output proves connectivity from the
   central hall to (a) the street through the main entrance and (b) every
   room through its own door.
4. Run `npm run verify` (the `test:blueprint-schema` suite is the quick
   loop while iterating).

Temp diagnostic scripts belong in `tests/_*.tmp.ts` and are deleted in the
same session.
