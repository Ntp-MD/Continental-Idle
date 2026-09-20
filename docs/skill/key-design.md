# Hotel floor layout methodology

Project domain facts for authoring hotel floor plans. `AGENTS.md` states the rules; `skill.md` routes here.

## Activation

- Use: hand-authoring or generating any hotel floor plan, room geometry, or fixture layout.
- Don't use: UI markup/CSS, data-flow refactors, or NPC behavior tuning with no geometry change.
- Standing rule: before ANY action on a floor (read, write, report), re-read the live `blueprint-data.json` from disk - context/memory of floor state is always stale; the user edits floors in the app UI between turns.

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
- Chain work in process order: receiving -> storage -> prep -> cooking -> servery -> table, and dirty return -> wash -> store as its own loop. Rooms in a chain sit adjacent in that order so staff never haul past unrelated rooms (see research notes: `docs/research/hotel-layout-references.md`).
- Place fixed rooms first: rooms tied to installations or the street (kitchen, laundry, deliveries, vestibule) lock their position early; everything else wraps around them.

## Ground floor / lobby program

A public ground floor is sized by throughput, not by leftover space. Provide these, each open onto the lobby spine:

- arrival: entrance + a vestibule (two door sets, room for luggage and a queue between them) + a bell position near the entrance with the luggage store at curb side
- reception: a desk that faces the entrance, a back office behind it, a luggage store at the desk
- lounge/waiting: grouped seating split into smaller clusters rather than one giant hall, and a bar/cafe whose back-of-house kitchen sits behind it; restrooms, seating and waiting needs sit where people already wait, not across the floor
- public restrooms: M/F with an accessible stall, entered from the lobby
- vertical circulation: a walled elevator core opening onto the lobby
- back-of-house core reached from a service corridor: receiving/storage, housekeeping, laundry, staff room, plant, in chain order off the corridor with deliveries at a corridor end zoned staff-only; the kitchen keeps its own dirty-return loop (used dishes -> wash -> store) separate from the clean food chain
- guest amenities that need ground-level access (fitness, business corner) sit off the lobby, not in it

Circulation is the spine: guests move arrival -> reception -> lifts -> lounge with no dead ends, and service moves service door -> corridor -> kitchen/storage/staff with no guest crossing. Move people through it in your head - arriving with luggage, working the desk, carrying a tray, needing a toilet - and fix every route that snags or crosses another flow.

## Placement rules

1. Rooms are floor tile states (`blocked` walls + `door` tiles) - never authored room data; rooms derive automatically (`deriveFloorRooms`).
2. Furniture on grid: same row = same y, same column = same x, uniform pitch, mirrored pairs exact; fixtures keep 1 tile from walls and each other, except plumbing runs (toilet/basin) and work counters, which line tight along their wall in process order.
3. A room's door tile aligns with its fixture column; furniture never blocks a door tile or the 2-tile path from any door. Guest doors are 2 tiles wide; service doors are 2 tiles wide wherever carts pass.
4. A counter always backs onto a wall or a service room (that is its staff side, the spot set above the object); its guest side faces open floor.
5. Guest routes and service routes never share a corridor, and a service door never opens into a guest area.
6. Spawn zones sit on a role's own work area: guest arrival at the entrance, chef in the kitchen, bartender behind the bar, receptionist behind the desk. Every staffed room has a role that visits it - a room no role ever enters is unfinished program.
7. Walls are exactly 1 tile thick - never 2 tiles thick. No 2x2 solid `blocked` masses; partitions are single-tile `blocked` runs with `door` gaps.
8. A work kitchen always has two doors: one to its servery (clean chain forward) and one to the service corridor (supply and dirty return back); storage sits adjacent to the work it feeds, and a 1-tile travel lane stays clear between counter runs.

## Verify

After any floor write run `verify:assets`, `test:blueprint-schema`, `test:migrate` in order; keep the NPC pool consistent with floor count. Generator temp files live in `tests/_*.tmp.ts` and are deleted the same session, never committed.

1. Grid dims + furniture inside the interior + never on wall/door tiles + zero object overlap + walls single-tile (no 2x2 solid `blocked`).
2. BFS from spawn: 100% of interior walkable tiles reachable + every door tile + per-room sample tiles.
3. Report room areas in m2 (tiles x 0.25) in the run output.
