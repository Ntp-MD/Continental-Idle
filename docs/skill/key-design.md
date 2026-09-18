# Hotel floor layout methodology

Project domain facts for authoring hotel floor plans. `AGENTS.md` states the rules; `skill.md` routes here.

## Activation

- Use: hand-authoring or generating any hotel floor plan, room geometry, or fixture layout.
- Don't use: UI markup/CSS, data-flow refactors, or NPC behavior tuning with no geometry change.

## Scale (see glossary: Tile scale)

- 1 tile = 0.5 m - the only fixed unit. Author in tiles, never pixels or meters copied from another plan.
- Plot and building are not constants: canvas width/height + `tileSize` (`CanvasConfig`) and `streetWidthTiles` (`resolveStreetTiles`) are editable. Never hardcode extents - read the live config. Grid cols/rows = canvas / `tileSize`; interior = plot minus the street ring (`resolveBuildingArea`).

## Core perspective (architect + real people)

Read a floor as a plan people live in, not a checklist. Every count and area is an output, never an input.

- Find the organizing idea first - one dominant move (arrival axis, courtyard, corridor spine, frontage) that every later choice serves.
- Program from occupancy: who arrives, what they do, how they move and leave. Space follows activity and flow; the schedule is derived, never copied.
- Movement is a sequence - arrival, threshold, lobby, corridor, room; compress and release, public to private. A corridor is a room people walk through, not leftover space.
- Privacy hierarchy: public, then circulation, then private. Guest and service worlds never cross or share sightlines.
- Right-size by relationship, not a target area: public reads generous, service compact.
- Circulation is the spine - design it first and open every occupied space onto it. A room with no door to circulation does not exist.
- Enclose, then open: walls define the void, so every enclosure needs a `door` tile or walkable gap. A sealed ring is a box no NPC or person can enter (`blocked` cells leave the walkable map); walls are the last step, zones and circulation come first.
- Egress is a life-safety invariant - visible, short, independent exits; dead ends and single-exit zones are defects, not metrics.
- Design for the body, not the diagram. Walk the plan as each person - guest with luggage, receptionist, cook, housekeeper, someone needing the toilet - and fix every route that snags, crosses a flow, or embarrasses. People need wayfinding without the plan, staff need cart-wide service routes, rooms need buffering from noise and traffic.
- The unseen counts: service corridors, storage and plant are invisible to guests but must exist for the visible spaces to work.

## Placement rules

1. Rooms are floor tile states (`blocked` walls + `door` tiles) - never authored room data; rooms derive automatically (`deriveFloorRooms`).
2. Furniture on grid: same row = same y, same column = same x, uniform pitch, mirrored pairs exact; fixtures keep 1 tile from walls.
3. A room's door tile aligns with its fixture column; furniture never blocks a door tile or the 2-tile path from any door.
4. Spawn zone sits just inside the street entrance on the entry corridor.

## Verify

After any floor write run `verify:assets`, `test:blueprint-schema`, `test:migrate` in order; keep the NPC pool consistent with floor count. Generator temp files live in `tests/_*.tmp.ts` and are deleted the same session, never committed.

1. Grid dims + furniture inside the interior + never on wall/door tiles + zero object overlap.
2. BFS from spawn: 100% of interior walkable tiles reachable + every door tile + per-room sample tiles.
3. Report room areas in m2 (tiles x 0.25) in the run output.
