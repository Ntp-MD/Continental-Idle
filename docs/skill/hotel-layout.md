# Hotel floor layout methodology

Project domain facts for authoring hotel floor plans. `AGENTS.md` states the rules; `skill.md` routes here.

Scale and rules for authoring any hotel floor plan (hand edit or temp generator). Every floor layout follows this - do not re-derive the numbers.

## Scale (see glossary: Tile scale)

- 1 tile = 0.5 m. Plot 107 x 67 tiles = 53.5 x 33.5 m. Street ring 8 tiles (4 m) surrounds the building; building interior tiles x8..98, y8..58 = 91 x 51 tiles = 45.5 x 25.5 m (~1160 m2).

## Room size standards (hotel reference)

| Room | Target area | Rules |
| ---- | ----------- | ----- |
| Lobby | 100-200 m2 | Biggest public space; must contain the street-door axis; reception desk faces the entrance corridor |
| Restaurant | 1.5-2 m2 per seat | Main dining on ground floor; kitchen adjacent behind it with a service door |
| Kitchen | 25-30% of restaurant | Back-of-house |
| Bar-lounge | 80-170 m2 | |
| Gym | 40-80 m2 | City-hotel gym; scale treadmill count to area |
| Laundry | 30-60 m2 | Back-of-house |
| Public bathroom | 9 m2 (2 x 4.5 m) | Row of single-occupancy rooms; door and fixtures on the room's center column |
| Staff room / Storage | 25-35 / 20-30 m2 | Back-of-house block |
| Corridors | 2 m wide (4 tiles) | 10-15% of floor; EVERY room door opens onto a corridor; no dead-end rooms |

## Placement rules

1. Rooms are floor tile states (`blocked` walls + `door` tiles) - never authored room data; rooms derive automatically (`deriveFloorRooms`).
2. Furniture on grid: same row = same y, same column = same x, uniform pitch, mirrored pairs exact; fixtures keep 1 tile from walls.
3. A room's door tile aligns with its fixture column; furniture never blocks a door tile or the 2-tile path from any door.
4. Spawn zone sits just inside the street entrance on the entry corridor.

## Generator validation checklist (temp `tests/_*.tmp.ts`, deleted same session)

1. Grid dims + furniture inside building interior + furniture never on wall/door tiles + zero object overlap.
2. BFS from spawn: 100% of interior walkable tiles reachable + every door tile + per-room sample tiles.
3. Report room areas in m2 (tiles x 0.25) in the run output.
4. After write: `verify:assets`, `test:blueprint-schema`, `test:migrate`; keep NPC pool consistent with floor count.

## Design process (architect sequence - never draw walls first)

1. **Program first**: derive rooms/areas from occupant load BEFORE any layout. Occupant load = NPC pool count (see `npcSettings` pool). Formulas: guest rooms = ceil(guests / 2); restaurant seats = guests x 0.65; kitchen = 25-30% of restaurant; toilet fixtures = ceil(guests / 25) grouped into 9 m2 rooms; corridor 10-15% of floor. Ground floor = public program; guest rooms live on upper floors.
2. **Bubble diagram -> adjacency**: list required adjacencies before walls - kitchen next to restaurant (service door), laundry near service corridor, bathrooms distributed (never one cluster serving a whole floor), lobby touches every public zone via corridor, staff/storage reachable without crossing guest areas. Guest flow and service flow must not cross.
3. **Zoning**: place zones by entrance/orientation first, then corridors, then walls, then furniture. Walls are the LAST drawing step, not the first.
4. **Egress rules**: every interior tile within ~12 m (24 tiles) of a door leading to an exit path; no dead-end corridor longer than 4 tiles; each floor keeps at least 2 independent exit paths where the floor size allows.
5. **Evaluate, then iterate**: after layout compute metrics - corridor %, largest room vs target table above, walk distance (tiles) from entrance to farthest room door, dead-space %. Re-partition if a metric is off; do not just add furniture to fill space.

## Adjacency quick-reference

| Room | Must touch | Must NOT touch |
| ---- | ---------- | -------------- |
| Kitchen | Restaurant (service door) | Lobby, dining sightlines |
| Laundry/Storage | Service corridor | Lobby, restaurant |
| Bathrooms | Corridor | Kitchen, restaurant dining area |
| Staff room | Back-of-house block or lobby edge | Guest rooms |
| Gym/Spa | Corridor | Kitchen |