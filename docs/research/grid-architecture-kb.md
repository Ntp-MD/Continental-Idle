# Grid-Based Architecture Knowledge Base

**Scope:** research + synthesis. This document does NOT design a building. It is the reference an AI design agent loads *before* it places a single tile, so that its layouts are reasoned rather than packed.
**Priority building type:** hotel. Hospital / office / residential / prison / industrial appear as comparison cases that expose transferable rules.
**Consumer:** the design agent that follows the procedure in §29 (the 17-step design process, 13-part output format and five quality levels of the original design brief, restated there).
**Method:** real architectural literature + standards, RimWorld community knowledge, Prison Architect knowledge, and concrete layout case studies, all filtered through this project's code-verified grid contract below.

## How to read this document

- **Source status (2026-09-24).** Two sources this document cites no longer exist in the tree:
  - The research brief and the design-agent brief (formerly `harness/state/temp-1` / `temp-2`) — their content is folded into this document (coverage map below, §4.6, §29), and references to a "brief step" mean the 17-step design process restated in §29.2.
  - `scripts/generate-hotel.mjs`, the generator that produced the shipped layout, deleted by user order (`harness/state/history.md:210`). Every `generate-hotel.mjs:LINE` citation below is retained as **provenance for a real, measured value**; the file itself is gone and the surviving artifact of that layout is `src/blueprint-editor/data/blueprint-data.json`. Do not re-verify a citation against the generator — verify against the shipped JSON or the engine code.
- Every **major principle** uses the evidence format: `RULE / EVIDENCE / SOURCE / REASON / REAL-WORLD APPLICATION / GRID APPLICATION / EXCEPTIONS / CONFIDENCE`.
- `CONFIDENCE` is `HIGH` (multiple independent authoritative sources, or verified in this repo's code), `MEDIUM` (single source or strong inference), `LOW` (plausible, unverified — never build on it alone).
- Every rule is tagged by its origin class in §27: **UNIVERSAL** (true in real architecture *and* in grid games), **REAL-WORLD** (physical/human-factor driven, adopted here for realism and quality), **GAME-SPECIFIC** (caused by mechanics — here, by this engine's actual code), **OPTIONAL** (stylistic).
- A `RULE` that conflicts with another `RULE` is not a mistake: §22 lists the known conflicts and how to decide. When two principles collide, the building's program decides, and the decision is recorded (`DECISION -> REASON -> EVIDENCE -> TRADE-OFF`).

## Coverage map (research brief → this document)

| Brief requirement | Section |
| --- | --- |
| 1 Research real architecture | §3, §4, §12-§18 |
| 2 RimWorld | §5 |
| 3 Prison Architect | §6 |
| 4 Building types studied | §3.9, §21, §23 |
| 5 Adjacency classification | §8 |
| 6 Circulation systems | §10 |
| 7 Human scale (no blind m→tile) | §12 |
| 8 Zoning gradient | §9 |
| 9 FOH / BOH | §11 |
| 10 Vertical planning | §13 |
| 11 Structural logic | §14 |
| 12 Building services | §15 |
| 13 Daylight / orientation | §16 |
| 14 Privacy | §17 |
| 15 Wayfinding | §18 |
| 16 Space syntax | §19 |
| 17 Reality vs game optimization | §22 |
| 18 Actual player layouts (10-point analysis) | §23 |
| 19 Grid / tile translation | §2, §20 |
| 20 Reusable patterns | §21 |
| 21 Synthesis classes | §27 |
| 22 Evidence format | applied throughout |
| 23 Final KB (24 parts) | §1-§28 + §29 |
| Project grid facts | §2 (code-verified) |
| Evaluation procedure | §26 |
| Expansion | §25 |
| Anti-patterns | §24 |

# 1. Executive summary

**What this is.** A reasoning reference for an AI that must place rooms, corridors, doors, service rooms and plant on a discrete tile grid — built from real architectural practice, standards, RimWorld and Prison Architect community knowledge, and concrete layout analysis, and filtered through this project's actual engine code. It does not design a building; it makes the design *decidable*.

**The four findings that change how a grid layout should be made**

1. **The grid is coarser than the body, and that is the whole human-scale story.** One tile is 0.5 m and an agent occupies ~1 tile (§2.4, §12.1), so a 1-tile corridor is physically single file, 2 tiles is the first passing width, 3 is a comfortable pass plus a turning circle, 4 is a spine. Corridor width is therefore not a taste question and never a single number: it is chosen per context from who uses it, how often, in which direction, carrying what, at what peak (§12.2).
2. **Movement cost is tile-steps with legal diagonals — and corners are free.** The A\* here charges 1 per cardinal step and √2 per diagonal, with diagonals allowed only when both adjoining tiles are open (§2.3). Consequence: wide-open halls are the cheapest routes, 1-tile corridors the most expensive, and the folk rule "minimise bends" has no mechanical basis while "minimise tile-steps" and "never make a two-way route 1 tile wide" have a very strong one. The same code caps the search, so a mega-hall is also a fragility.
3. **The engine's semantics are fixture-based, not geometry-based.** A room exists because its furniture carries the right tag; an un-furnished space is literally typed `hall`; access control is a role's `restrictedTags`, not a lock; capacity is the number of interact spots; a queue has a length in tiles; and vertical travel is a portal interaction with a cooldown, which turns every lift question into a queue-sizing question (§2.4, §11.5, §13.1). A design that "looks" separated but is not tagged will leak, and a design that claims acoustic, thermal or daylight performance is claiming something nothing observes (§20.6, §27.2).
4. **Real architecture still wins the argument, because the failures are visible.** The transferable core is small and severe: a parti before the plan; a program with areas, adjacencies and services; buffers instead of distance for separations; one-directional flows laid out as chains; widths from bodies; legible thresholds between zones; repeated structure and stacked wet walls; two ways in and out; and space reserved for the second version of the building (§27.1). Those fifteen universal rules account for almost every difference between a plan that reads as designed and one that reads as packed.

**The framework sections.** §8 adjacency (five classes, defined by what *satisfies* them, with a full hotel matrix and a separation register), §9 zoning (an eight-level gradient Z0-Z7 mapped onto this project's tags/room types, a zone-adjacency matrix, and vertical zoning), §10 circulation (five systems, what each costs on this graph, the interaction table, spawn zones as trip origins, and emergency rules), §11 service flow (seven directed BOH chains and the spine that carries them), §12 human scale (the five width classes per context, the rounding policy, door classes, densities, and hotel benchmarks real→grid), plus §13-§18 for vertical, structural, services, daylight, privacy and wayfinding.

**The translation sections.** §2 fixes the units and caps from code; §20 converts metric programs into tile modules honestly (clear vs gross area, the wall tax, the waste taxonomy, the module grammar, aisle-by-use rules); §19 turns space syntax into nine metrics that can actually be computed from `tileStates` — including the single most useful check in this document: **sort spaces by integration and require the ranking to follow the privacy gradient** (§19.4).

**The judgement sections.** §22 is the conflict register (fourteen named clashes between the game optimum and the architectural one, each with a resolution and a class); §21 is the twelve-pattern catalogue with scalability, traffic, realism, efficiency and security ratings; §23 analyses real and player layouts; §24 is a thirty-one-item anti-pattern catalogue with symptom→cause→fix; §25 is expansion; §26 is the evaluation framework (fourteen metrics with targets, a throughput worked example, the sim as post-occupancy evaluation, and a fail-fast checklist). §27 separates universal from real-world, game-specific and merely optional; §29 is the generalized specification: ten invariants, a twelve-stage procedure with gates, the test battery, and the conflict protocol.

**How to use it.** Follow the twelve stages of §29.2; run the gates of §26.7 before judging anything; cite this document's section numbers as the evidence field of every `DECISION → REASON → EVIDENCE → TRADE-OFF`; and when the sim is runnable, run it — a layout claim that could have been tested and was not is a claim about a drawing, not about a building (§26.4).

---

# 2. The project grid contract (code-verified)

Every grid rule later in this document is translated into *these* numbers and *these* mechanics. Facts here are read from source, not assumed; anything not found in code is marked `NOT IN CODE` so the design agent does not treat it as an engine constraint.

## 2.1 Units, scale, caps

**RULE** One tile is a 0.5 m square (0.25 m², 0.25 m × 0.25 m of plan area is wrong — 0.5 m × 0.5 m = 0.25 m²). All metric-to-tile conversion in this document uses this scale.
**EVIDENCE** `scripts/generate-hotel.mjs:27` — `// ---------- grid contract: 1 tile = 0.5 m, tileSize 20 px ----------`; `harness/state/context.md:45` — "Tile scale | 1 tile = 0.5 m - the only fixed unit".
**SOURCE** This repo (code + glossary). **CONFIDENCE: HIGH**

Derived conversion table (arithmetic on the verified scale, so also HIGH):

| Real dimension | Tiles | Notes |
| --- | --- | --- |
| 0.5 m | 1 tile | the grid resolution — the smallest design step |
| 1.0 m | 2 tiles | standard room door width used by the generator |
| 1.2 m | ~2.4 → 2 or 3 tiles | accessibility minimum width; see §12 for the rounding policy |
| 2.0 m | 4 tiles | the current guest spine width (`CORR` rows 23-26) |
| 3.0 m | 6 tiles | small room / short-side of a module |
| 6.0 m | 12 tiles | a structural bay width worth repeating (§14) |

**Caps (all `src/blueprint-editor/limits.ts:8-18`)** — `MAX_GRID_ROWS = 256`, `MAX_GRID_COLUMNS = 256`, `MAX_FLOORS = 100`, `MAX_ASSETS = 1000`, `MAX_OBJECTS_PER_FLOOR = 10_000`, `MAX_NPC_ENTRIES = 1000`, `MAX_ASSET_TILES = 256`, `MAX_TAGS = 256`, street width `MIN_STREET_WIDTH_TILES = 5` … `MAX_STREET_WIDTH_TILES = 20`, `MAX_PAYLOAD_BYTES = 5 * 1024 * 1024`.
A 256 × 256 floor is 128 m × 128 m = 16,384 m² of one floor plate. The shipped canvas is 80 × 50 tiles (1600 × 1000 px at `tileSize: 20`, `src/blueprint-editor/data/blueprint-data.json:2303-2305`); the editor default is 1600 × 1200 at `tileSize: 25` = 64 × 48 tiles (`src/blueprint-editor/editorConfig.ts:14-18`). `canvasWithinGridCaps` derives cols/rows as `ceil(canvas.width / tileSize)` (`src/blueprint-editor/domain/schema/layout.ts:53-59`), so **`tileSize` is a rendering knob, not a scale knob** — changing it changes how many tiles fit, not what a tile means.
The saves are validated atomically: one object past a limit breaks *every later save* (`limits.ts:2-7`). Design consequence: a layout that needs 12,000 props on one floor is not merely ugly, it is unsavable. **CONFIDENCE: HIGH**

Street ring: default 8 tiles (`STREET_TILES = 8`, `src/blueprint-editor/domain/schema/primitives.ts:4-9`) = 4.0 m, overridable 5-20 tiles; the ring is **blocked to the engine** and cosmetic (`harness/state/context.md:41` "Street ring | Cosmetic border-ring tiles; blocked to the engine by today's contract"). So the buildable envelope starts inside the ring; do not plan a walkable street that NPCs use.

## 2.2 Tile states, walls, doors

**RULE** A floor owns a `tileStates` grid of exactly three values — `'walkable' | 'blocked' | 'door'` — and the walkability map is derived as `walkable || door`.
**EVIDENCE / SOURCE** `src/blueprint-editor/domain/schema/walkable.ts:4`, `:42-44` (`tileStatesToWalkableGrid`), `:174-190` (normalizer rejects any other value). **CONFIDENCE: HIGH**

Consequences the design agent must accept:

1. **There is no wall type.** A wall is a `blocked` tile, identical to "tile occupied by furniture" and to "tile with no floor". Structure, furniture-blocking and massing all share one state. If a layout must be readable as "load-bearing wall" vs "crate", the difference has to live in *objects placed on that tile* or in tags, not in tile state.
2. **A wall is exactly 1 tile (0.5 m) thick.** The hotel generator's own validator fails a floor that contains a 2×2 blocked mass: `fail(label, 'walls', ... 'walls must be single tile')` (`scripts/generate-hotel.mjs:788`); wall lines are painted as single rows/cols (`perimeter()`, `generate-hotel.mjs:84-89`). Real interior partitions are 0.10-0.15 m and party walls 0.20-0.30 m, so **the grid over-thickens partitions by ~3×** and the KB's room sizes are therefore *gross-ish* by half a tile per side. **UNIVERSAL mechanic, HIGH.**
3. **Doors are groups of door tiles, and ≥2 tiles slide as two halves.** `groupDoorCells` flood-fills 4-connected `'door'` cells, picks the axis by the longer span, then splits the sorted cells in half with `slideDir` −1/+1; a single tile stays single (`walkable.ts:58-101`, glossary `harness/state/context.md:27` "Door halves"). So: 1-tile door = 0.5 m (a narrow service/doorway); 2-tile = 1.0 m (the generator's room door: `doorH(g, BAND_N.wall, c0, c0 + 1)`, `generate-hotel.mjs:339`, comment at `:308` "a 2-tile (1.0 m) door"); 3-tile = 1.5 m and splits 2+1; 4-tile = 2.0 m, 2+2 — the width to use for a lobby entrance or a service opening. Door tiles are walkable, so a door never adds path cost by itself (see §2.3 for what actually costs).
4. **A door is only a door if the tile state says so.** Objects with `doorRequired` exist as an asset flag (`domain/schema/assets.ts:27`, `resolveObjectDef` `interact.ts:268-291`) but the engine's passability comes from `blocked` vs `door` — a wall tile under a door *object* still blocks. Place the tile state, then the object.
5. **Erase is a toggle**, not a clear: `applyTileBrush('erase')` flips `walkable ↔ blocked` (`walkable.ts:32-40`). Batch edits of wall lines must use explicit brushes.

## 2.3 What movement actually costs (pathfinding)

**RULE** The engine runs A\* per floor on the walkable cell list: cardinal step = 1, diagonal step = √2, and a diagonal is legal **only if both orthogonal neighbours of the corner are also walkable** (no corner-cutting). Heuristic is octile distance. Blocked-cell sets are passed per search for transient avoidance.
**EVIDENCE / SOURCE** `src/engine/npc/pathfinding.ts:162` (octile start), `:189-202` (cardinals, cost +1), `:204-227` (diagonals gated on `side1`/`side2` walkability, cost +√2), `:98-109` (transient blocked cells), `:232-235` (direction tables). **CONFIDENCE: HIGH**

This is the single most design-relevant mechanic in the whole document, and it is *not* what most grid games' conventions assume. Read the consequences:

- **Cost is tile-steps, not metres** — a route's cost is the octile length of the path the agent walks. Any "walking distance" claim in this KB must be computed on the graph this produces.
- **1-tile corridors are cardinal-only.** In a 1-wide corridor no diagonal is ever legal (both corner neighbours can't be open), so 40 tiles of corridor = 40 cost for 20 m.
- **2-tile-wide circulation unlocks diagonals**: in a 2-wide band, `Δr+1, Δc+1` has both corner cells open, so travel is up to ~1.41× faster per unit of plan distance than a 1-wide run. A 2-tile corridor costs about the same *tiles* but about 30% less *time* over distance, and it is the width at which two agents pass (see §2.4 clearance).
- **Open halls are the cheapest circulation of all**: crossing an open 10 × 10 m room diagonally is ~28 cost instead of 40 through a dog-leg corridor — which is why "corridor-as-room" layouts read as efficient and comfortable at once, and why the *real-architecture* objection (privacy, wayfinding, thermal/acoustic buffer, §17) is the reason not to do it everywhere.
- **Corners cost nothing extra and turns are not penalised** — the engine has no turn cost, no acceleration, no crowding penalty on the graph. Therefore "minimise corners" is **OPTIONAL/aesthetic** here, not a mechanic; whereas "minimise tile-steps" and "keep ≥2 tiles where two agents must pass" **are** mechanical.
- **Search is capped**: `maxIterations = max(1000, count * 2)` where `count` = walkable cells of the floor (`pathfinding.ts:167`). On a large floor an A\* that must explore a big open area from a bad start can hit the cap and return `[]` (no path) — layouts with huge undifferentiated halls and long routes are therefore *fragile*, and the practical rule is "keep the graph organised by doors and rooms rather than one mega-hall". `repathCooldownSeconds: 2`, `maxRepathAttempts: 4`, `progressWatchdogTicks: 120` (`src/blueprint-editor/domain/schema/npc.ts:94-107`) mean a failed or stalled route is retried for a few seconds and then abandoned. **HIGH** (code).

## 2.4 Agents, clearance, queues

- **Agent clearance = 0.5 tile** (`src/engine/npc/config.ts:6` `NPC_ENGINE_DEFAULT_AGENT_CLEARANCE = 0.5`), i.e. one agent's body spans a full tile. **A 1-tile corridor is strict single file; a 2-tile width is the first width where two agents pass; 3 tiles is where a queue can stand beside a through-route.** Default speed constant `NPC_DEFAULT_SPEED = 0.2` (`domain/schema/npc.ts:92`). **HIGH** (code) for the clearance value; the *interpretation* "body ≈ 1 tile" is MEDIUM (it depends on how the renderer resolves clearance).
- **Interaction capacity is spots, not room area**: `resolveInteractForTarget` defaults `capacity` to `max(1, interactSpotCount)` (`domain/schema/interact.ts:130-144`). A reception desk with 1 spot serves 1 guest at a time regardless of how grand the lobby is. **HIGH**.
- **Queues are physical and measured in tiles**: `queue.maxMembers` default 3, `queue.admissionDepth` default 4, clamped to 1-100 and 1-20 (`interact.ts:147-157`). So a queue's footprint is a design quantity: budget ~1 tile per queued agent and 4 tiles of admission depth in front of the point. **HIGH**.
- **Room identity comes from fixtures**: rooms are flood-filled from the passable map bounded by door/wall cells (`src/engine/npc/rooms.ts:1` "derive floor rooms from the engine walkable map. Door cells are …"), then typed by the tags of the fixtures inside — `ROOM_TYPE_SPECS` maps `living→Guest Bedroom`, `hygiene→Bathroom`, `wellness→Spa`, `front-desk→Lobby`, `back-of-house→Staff Room`, `storage→Storage`, etc., with `privacy: 'private'` only on bedroom/bathroom/spa, and anything unmatched becomes `hall` (`src/blueprint-editor/domain/schema/rooms.ts:9-27`). **Two hard consequences:** (a) an unmebelled space *is* a corridor to the engine, so "space plan, furniture later" leaves the room undefined; (b) a room's function can only be read from what stands in it — a design agent must place the defining fixture, not just the enclosure. **HIGH**.
- **Vertical movement is a portal interaction, not a ramp**: an asset tagged `portal` (the shipped `elevator-1` is 2 × 2 tiles, `walkable: false`, `blueprint-data.json:898-902`) builds per-floor interaction targets whose destinations are *all other floors that carry a portal* (`src/engine/npc/layoutBuild.ts:297-356`). An agent therefore paths to a spot on the car, "interacts", and appears on the destination floor's car spot; `crossFloorCooldownSeconds: 30` and a per-role `crossFloorChance` gate how often (`npc.ts:94-107`, `npc.ts:47-49`). Consequences: **lifts are queues, not distances** — vertical cost is wait + interaction time, so a floor's lift hall must absorb a boarding queue (see §13); the hoistway cells themselves are blocked and each floor's portal must sit *adjacent to that floor's hall*, never across a corridor that others must cross; there are no stairs as a path (the stair *objects* are placed for realism/egress reading, and `generate-hotel.mjs` even validates `corridor does not reach stair 2` as an egress check, `:831`). **HIGH** for the portal model; the "no stair pathing" claim is MEDIUM (verified as "no stair *cost*" — portals are the only cross-floor link built in `layoutBuild.ts`).
- **Access control is tag-based, not lock-based**: roles carry `focusTags` (what they seek) and `restrictedTags` (what they ignore) — the shipped `role-guest` has `restrictedTags: ["back-of-house","mechanical"]` (`blueprint-data.json:11042-11065`). A guest does not walk into the kitchen because the kitchen's fixtures are tagged `back-of-house`, **not** because a door stops them. So BOH/FOH separation must be expressed in *tags* to work mechanically and in *geometry* to read architecturally — do both (§11). **HIGH**.
- **Spawn zones are role-filtered rectangles per floor**: `NpcSpawnZone { id, label, x, y, w, h, roleIds? }` in **pixels** (`domain/schema/objects.ts:87-127`), `spawnZoneAllowsRole` returns true for an unlisted zone (`:97-100`), and the generator anchors a role's zone on its own work area (`zoneOf('f14-z-guest', 'Guest corridor', rect(24, 30, 25, 46), ['role-guest'])`, `generate-hotel.mjs:466`; glossary `harness/state/context.md:31`). Placement of spawn zones decides where a population *appears* at shift/arrival time — that is a circulation input, not a detail (§10.6).

## 2.5 The floor model the KB must design against

**RULE** A blueprint = a canvas + an ordered list of floors; each floor = its own `tileStates` grid + object instances + spawn zones + optional `allowedRoleIds`. There is no shared multi-floor volume, no ceilings/roofs, no wall heights.
**EVIDENCE / SOURCE** `FloorData` (`domain/schema/layout.ts:7-18`), `FloorLayoutData` (`:90-98`). **CONFIDENCE: HIGH**

Therefore every "vertical" or "section" idea from real architecture has to be re-expressed as: *same XY on each floor* (stacking/risers, §13), *an asset footprint that reads as structure* (columns, `COLUMN_CELLS` at 8-tile spacing in `generate-hotel.mjs:56`), and *a portal cell that connects levels*. Anything requiring a third dimension inside one floor (a double-height lobby, a gallery, a mezzanine) is **not expressible**; plan it as two floors with a shared core, or don't plan it.

## 2.6 Reference module already proven in this repo

The existing generator floor is the worked example the design agent should be able to reproduce and then beat (all `scripts/generate-hotel.mjs:29-62`): canvas 80 × 50 tiles, street ring 8, envelope `ENV = rows 8-41 × cols 8-71` = 64 × 34 tiles = 32.0 × 17.0 m; a **centred 4-tile (2.0 m) guest spine** `CORR rows 23-26 × cols 28-66`; two mirrored room bands 13 tiles (6.5 m) deep behind 1-tile walls at rows 22/27; bay rhythm `standard 7 cols → superior 9 → executive 12/13 → suite 19` (bathroom 4 × 6 tiles = 6.0 m² in the cheap rooms, 5 × 6 = 7.5 m² in suites); a **west core block** carrying hoistway `HOIST rows 8-14 × cols 8-27` with a 3 × 3 m+ lift hall, stair shafts `S1 cols 8-12`, `S2 cols 67-71` (2.5 m wide), two riser rooms (1.0 × 1.5 m interior), a housekeeping room, 5 cars (`LIFTS`, with the comment "Five cars, not three: a 21-floor / 116-key tower with 1200 agents moving needs the boarding slots"), 11 stair flights, only two grade openings in the whole tower (`GRADE_OPENINGS`: street door at row 8 cols 36-37, service door at col 8 rows 26-27), and a canonical core that every floor repeats ("every floor must carry the same wall lines, door cells and …", `:897`).
Its self-check list is a ready-made evaluation rubric and is merged into §26: `grid / walls / objects / rooms / access / egress / core / portal / ops / economy` (`:773`, `:1073`).

**Note on the numbers:** the generator's per-type area comments (`28.0 sq m gross` for a 7-column bay, `35.0`, `45.5-49`, `70.0`, `:58-61`) are *gross* — they include the band depth plus corridor share. Clear area of a 13 × 7 bay is 91 tiles = 22.75 m². Keep both numbers in mind: real hotel benchmarks (§12.6) are quoted in gross m²/room.

---

## 2.7 Fixture footprints and blocking (the real buildable vocabulary)

The project already defines what can be placed. A design agent must size rooms around *these* footprints, not around ideal furniture. From `src/blueprint-editor/data/blueprint-data.json` `originAssets` (72 entries); `w × h` in tiles, metres at 0.5 m/tile; `wk` = the asset's tiles stay walkable to the engine, `blk` = they block.

| Group | Asset | tiles | metres | notes the layout must respect |
| --- | --- | --- | --- | --- |
| Sleep | `bed-king` | 4 × 4 `wk` | 2.0 × 2.0 | king; 2 spots, cap 2, stay 30-90 s |
| Sleep | `bed-double` | 3 × 4 `wk` | 1.5 × 2.0 | double |
| Sleep | `bed-single` | 2 × 4 `wk` | 1.0 × 2.0 | twin |
| Sleep | `wardrobe` | 5 × 1 `blk` | 2.5 × 0.5 | must sit on a wall line |
| Sleep | `nightstand` / `luggage-rack` / `minibar` / `tv-stand` | 1 × 1 / 2 × 1 / 2 × 1 / 3 × 1 `blk` | 0.5 / 1.0 / 1.0 / 1.5 deep 0.5 | wall-adjacent furniture |
| Sleep | `desk-guest` | 4 × 2 `blk` | 2.0 × 1.0 | business desk, 1 spot |
| Sit | `sofa-1` / `single-sofa-1` / `armchair` / `bench` | 2 × 1 `wk` / 1 × 1 `wk` / 1 × 1 `wk` / 2 × 1 `wk` | 1.0 / 0.5 / 0.5 / 1.0 × 0.5 deep | seating does not block movement |
| Eat | `table-1` | 2 × 1 `blk` | 1.0 × 0.5, cap 1, 2 spots | a 2-top compressed to 0.5 m deep — see §22 conflict C-7 |
| Eat | `banquet-round` / `banquet-table` / `high-table` | 4 × 4 / 6 × 1 / 2 × 2, all `wk`, 4 / 2 / 2 spots | 2.0 dia / 3.0 × 0.5 / 1.0 × 1.0 | covers = spots, and the clearance around them is the real space cost |
| Serve | `reception-desk` | 8 × 1 `blk` | 4.0 × 0.5 | **6 spots, cap 4** — the lobby's queue is a designed area, not leftover floor |
| Serve | `greeting-desk` / `concierge-desk` / `uniform-desk` / `cafe-counter` / `bar-counter` | 3 × 1 / 3 × 1 / 3 × 1 / 4 × 1 / 4 × 1 `blk` | 1.5-2.0 × 0.5 | bar: 5 spots, cap 3 |
| Kitchen | `kitchen-table-1` / `kitchen-sink` / `table-stove` / `pass-window` / `dish-return` / `cold-store` / `dry-store-shelf` / `pastry-bench` | 2 × 1 / 2 × 1 / 2 × 1 / 4 × 1 / 2 × 1 / 3 × 2 / 4 × 1 / 3 × 1, all `blk` | 1.0-2.0 × 0.5-1.0 | the pass is the kitchen↔restaurant seam; 1-2 spots each |
| Wet | `toilet` / `washbasin` / `shower` / `bathtub` / `tub-long` | 1 × 1 / 1 × 1 / 1 × 1 / 2 × 1 / 4 × 2 `blk` | 0.5 / 0.5 / 0.5 / 1.0 × 0.5 / 2.0 × 1.0 | a 1-tile shower = 0.5 m, **below the real 0.8-0.9 m minimum** — §12.4 |
| Housekeeping | `linen-shelf` / `housekeeping-cart` / `soiled-linen` / `washer-1` / `dryer` / `ironing-table` / `towel-cabinet` | 3 × 1 / 2 × 1 / 1 × 1 / 1 × 1 / 1 × 1 / 2 × 1 / 2 × 1 `blk` | 0.5-1.5 × 0.5 | clean and soiled linen are *different* assets: keep their routes apart (§11.4) |
| Staff | `staff-locker` / `service-cart` / `office-chair` / `waste-room` | 4 × 1 / 2 × 1 / 1 × 1 / 2 × 2 `blk` (chair `wk`) | 2.0 / 1.0 / 0.5 / 1.0 × 1.0 | `waste-room` is a fixture, so a waste *room* must still be enclosed by tiles |
| Fitness/spa | `treadmill-1` / `gym-bike` / `cable-machine` / `weights-rack` / `spa-bed` / `pool-lap` | 1 × 2 / 2 × 4 / 2 × 2 / 3 × 1 / 2 × 4 / **24 × 10** | 0.5-1.0 deep / 12.0 × 5.0 | the pool is the single biggest fixed footprint: 6 m of lane × 5 m |
| Structure/services | `column` 1 × 1 / `stair-flight` 3 × 4 / `riser-closet` 2 × 2 / `ahu` 6 × 4 / `chiller` 8 × 5 / `water-tank` 4 × 4 / `fire-pump` 3 × 2 / `control-panel` 2 × 1 / `elevator-1` 2 × 2 | metres: 0.5 / 1.5 × 2.0 / 1.0 / 3.0 × 2.0 / 4.0 × 2.5 / 2.0 / 1.5 × 1.0 / 1.0 × 0.5 / 1.0 × 1.0 | plant sizes are **real-world-shaped**: a chiller wants 4 × 2.5 m plus maintenance clearance, a lift car is 1 × 1 m (smaller than a real 2.1 × 1.5 m car — §22 conflict C-8) |
| Misc | `plant-1` 1 × 1, `signage` 1 × 2, `vending-machine` 2 × 1 | | signage is 1.0 m of wall-mounted wayfinding — §18 |

**RULE** "Walkable" in an asset's tile state does not mean "the NPC fits there": seating and sleeping surfaces are walkable (`bed-*`, `sofa-*`, `armchair`, `bench`, `treadmill`, `gym-bike`, `spa-bed`, banquet/boardroom tables, `office-chair`), while tables, counters, shelves, wet fixtures and all plant block. **Consequence:** a room's *engine* free area is larger than its *architectural* free area, and an agent may path across a bed. If a route must be kept out of a room's interior, block it with a blocking asset or a `blocked` tile — do not assume the furniture does it.
**EVIDENCE / SOURCE** `originAssets[*].walkable` in `blueprint-data.json` (all rows above). **CONFIDENCE: HIGH**

**RULE** Interaction throughput per fixture is `capacity` (default = number of `interactSpots`), with `durationMin/Max` seconds: reception 4 × 5-12 s, bar 3 × 4-10 s, cafe 2 × 3-8 s, kitchen stations 1-2 × 3-15 s, guest stay in bed 30-90 s, spa 30-60 s, elevator 4 × 1-3 s, queue `maxMembers 3` (reception 4) with `admissionDepth 4` tiles.
**USE** This is the arithmetic behind every congestion claim in §10, §11 and §26: demand (agents per floor-hour arriving at one fixture) ÷ (3600 / mean service seconds × capacity) must stay under ~0.7, and the queue needs `maxMembers` × 1 tile of standing room *in front of* the spot, on the circulation side.
**CONFIDENCE: HIGH** (all values code/data-verified; the utilisation heuristic is MEDIUM — it is standard queueing practice, not an engine rule).

# 3. Real-world architecture: the transferable principles

Nine principles. Together they are the reason buildings are shaped the way they are, and each one has a grid form. References below are named standard works; where a live URL was fetched it is given, otherwise the citation is by title/author (marked `book, URL not fetched this session`) so the design agent can tell verified-from-web from known-by-name.

## P-1 The parti comes before the plan

**RULE** Every coherent plan is generated by one dominant organizational move (the parti — a spine, a core, a courtyard, a bar, a stack of repeated modules) and everything else is subordinated to it. A plan without a parti is a collection of rooms.
**EVIDENCE** Ching, *Architecture: Form, Space, and Order* (parti as the first design operation); *Architect Graphic Methodology* (S-P-A-C sequence starts from a synopsis diagram); the twin-service-core tower as the canonical modern high-rise parti — see §23 case studies.
**SOURCE** Ching, *Architecture: Form, Space, and Order*, 4th ed., "Principles and System of Ordering" — book, URL not fetched this session.
**REASON** A parti reduces an unbounded search to a few parameters (where is the spine, how long, which side is served). It also makes expansion cheap: growth repeats the parti instead of re-designing the plan.
**REAL-WORLD APPLICATION** Client brief → parti diagram → zoning diagram → plan. The parti is what survives a change of room list.
**GRID APPLICATION** Before placing a tile, state the parti in one line and draw its *lines* first: the corridor row band, the core column band, the envelope, the bay rhythm. Then a room is only ever placed *between* existing parti lines. If a placement breaks the parti, the placement is wrong, not the parti. The worked example in this repo is `2.0 m guest spine on rows 23-26 + west core + 7/9/12/19-column bays` (`scripts/generate-hotel.mjs:36-61`).
**EXCEPTIONS** Organic/pavilion campuses legitimately use several coexisting parti moves; a very small building (< ~40 tiles) can be a single room with no parti.
**CONFIDENCE: HIGH**

## P-2 Program before geometry

**RULE** A building is generated from a *program* — a list of spaces with area, occupants, equipment, adjacency and separation requirements — not from a wish list of rooms.
**EVIDENCE** Architecture programming as a formal phase (Preiser/Vischer; the Design-Pursuit programming tradition); Neufert's dimension tables are program tables first.
**SOURCE** Ernst Neufert, *Architects' Data* (3rd/4th ed.), space and dimension tables by function — book, URL not fetched this session; Lawson, *Design for Planning*; pass A URL set in §28.
**REASON** Unprogrammed plans fail in measurable ways: undersized service rooms, no storage, circulation that eats the lettable area. The program is what makes a later critique *checkable* rather than opinion.
**REAL-WORLD APPLICATION** Space program matrix: `space | users | area m² | equipment | daylight | privacy | adjacency | separation | service`.
**GRID APPLICATION** Write this matrix with the area column in **tiles** (÷ 0.25 m²) and a *clear* and a *gross* column, because the 1-tile wall and the corridor share make the two differ (§20.2). Nothing is placed until the matrix is complete — §29.2 stages 1-2.
**EXCEPTIONS** Fully repetitive back-of-house rooms (a store, a riser) can be typed straight from the catalogue instead of re-programmed.
**CONFIDENCE: HIGH**

## P-3 Adjacency drives massing more than aesthetics does

**RULE** The strongest shaper of plan form is the adjacency/separation structure of activities; distance is what users experience as "this building works" or "this building is annoying".
**EVIDENCE** The closeness-rating method (A/E/I/O/U) from architectural programming and from facility layout planning (Richard Muther's Systematic Layout Planning / REL chart); hospital planning literature treating travel distance as a design driver; hotel BOH design as a workflow adjacency problem.
**SOURCE** Richard Muther, *Plant Layout and Design* — REL chart method, book, URL not fetched this session; healthcare facility-guidelines literature via pass A (§28).
**REASON** Every trip made repeatedly is paid thousands of times; a trip made once is paid once. Adjacency must serve the *frequency-weighted* graph, not the impressive one.
**REAL-WORLD APPLICATION** Kitchen next to the service entrance and to the dining room, not next to the ballroom; housekeeping next to the service lift, not in the lobby; reception on the arrival axis; noisy plant away from bedrooms.
**GRID APPLICATION** Build the adjacency matrix of §8, then treat it as a cost function on the tile grid: `weighted distance = Σ frequency × octile-tile-distance`, measured on the *actual* path graph, not on straight lines (§19.4).
**EXCEPTIONS** Frequency is not the only weight: emergency, hygiene and security separations override convenience. A "nice" adjacency that merges two incompatible zones is worse than a long walk.
**CONFIDENCE: HIGH**

## P-4 Circulation is a hierarchy, and its size is a percentage

**RULE** Movement systems are layered (arrival → spine → branch → room interior), and different populations' systems must not share the same space at the same time. The share of a floor given to circulation is a design decision with a normal range.
**EVIDENCE** Planning texts put circulation at ~15-25 % of gross floor area in typical buildings, higher in assembly/retail; a double-loaded hotel guest corridor runs far lower because the same corridor serves both sides.
**SOURCE** Time-Saver Standards for Building Types (Frampton et al.) — per-type efficiency notes, book, URL not fetched this session; exact percentages to be pinned by pass A (§28).
**REASON** Corridor that is too wide in a low-frequency building wastes lettable area; corridor that is too narrow makes every interaction queue. Hierarchy also does wayfinding work (§18) — where every route looks equal, the plan is unreadable.
**REAL-WORLD APPLICATION** A guest path (arrival → lobby → lift → corridor → room) never shares a corridor with a linen-trolley path (delivery → store → service lift → housekeeping → rooms) except at engineered crossing points.
**GRID APPLICATION** Count circulation tiles as a budget line: `circulation % = walkable tiles belonging to no typed room`. The engine literally types unmatched space as `hall` (`src/blueprint-editor/domain/schema/rooms.ts:27`), so this percentage is computable from a build and is an evaluation metric in §26.
**EXCEPTIONS** Great rooms, lobbies and markets are deliberately "all circulation"; there the space *is* the program.
**CONFIDENCE: HIGH** for the hierarchy, MEDIUM for the percentage range until pass-A figures land

## P-5 Human scale, not tile scale, sets widths

**RULE** Widths come from bodies: a single passage, two people passing, a person with a load, a wheelchair turning, a queue standing, a stretch of evacuation. Those produce a range from ~0.6 m to ~2.4 m, and one corridor can legitimately need three of them in the same run.
**EVIDENCE** 2010 ADA Standards for Accessible Design §403: 36 in (915 mm) minimum clear width for accessible circulation, reduced to 32 in (815 mm) for short segments, with passing spaces ≥ 60 in (1525 mm) at intervals; §304 turning space 60 in. Neufert and Time-Saver give per-context corridor widths.
**SOURCE** ADA 2010 Standards for Accessible Design §403.5 (36 in / 915 mm min clear width; 32 in / 815 mm for segments ≤ 24 in / 610 mm; 60 in / 1525 mm passing spaces) and §304 (60 in turning space) — official text at https://www.ada.gov/law-and-regs/design-standards/2010-stds/ and https://www.access-board.gov/ada/chapter/ch04/ (URLs verified in this session; the numbers are from §403/§304 as published); Neufert, *Architects' Data*, circulation tables — book, URL not fetched this session.
**REASON** Below the passing dimension, two agents must *alternate* instead of pass — which is where "my NPC is stuck" complaints actually come from.
**REAL-WORLD APPLICATION** ~1.2 m outside a guest room; 1.8-2.4 m in a lobby; ~1.4 m behind a counter to move a trolley; ~1.1-1.2 m minimum escape width in most codes.
**GRID APPLICATION** Round each context width to tiles by an explicit policy (§12.4): 1 tile (0.5 m) = single file only; 2 tiles (1.0 m) = one person plus one stepping aside; 3 tiles (1.5 m) = two passing comfortably and the wheelchair turning circle; 4 tiles (2.0 m) = the current guest spine, trolley passing; 6 tiles (3.0 m) = lobby/queue domain. Because an agent body already occupies ~1 tile (§2.4), the grid is *coarser* than the human body — never assume a 1-tile read of a 0.9 m code minimum is compliant here.
**EXCEPTIONS** Short stubs into a closet legitimately use the reduced-width rule; that is exactly what the ADA short-segment allowance is for.
**CONFIDENCE: HIGH**

## P-6 Structure and services want to be repeated and stacked

**RULE** Real buildings have a structural grid and service risers that repeat floor after floor; wet areas stack, cores stack, floors span a regular bay. Plans that ignore this look — and would be — unbuildable.
**EVIDENCE** Typical reinforced-concrete hotel/office bay spans of roughly 6-9 m and a 2.5-4.5 m deep zone between core and façade; twin-core hotel tower plans (see §23); plumbing stack/vent constraints in Neufert's services sections; code requirements for two remote exits as a geometric (not paper) requirement.
**SOURCE** Neufert, *Architects' Data* (structural grid + services sections) — book, URL not fetched this session; pass A URL set (§28).
**REASON** Repetition kills cost and coordination: a stack drops straight down, a riser aligns, formwork repeats, and maintenance routes are known.
**REAL-WORLD APPLICATION** Guest bathrooms grouped back-to-back over the stack; the kitchen under the F&B outlet; the lift lobby the same shape on 20 floors.
**GRID APPLICATION** Choose a bay rhythm once and keep it on every floor; put the core in the *same tiles* on every floor (`generate-hotel.mjs:897` — "every floor must carry the same wall lines, door cells and …"); place `riser-closet` (1.0 × 1.5 m) and `column` (0.5 × 0.5 m) on the repeated lines; keep wet fixtures grouped on one side of the room, as `bathShell` does (`generate-hotel.mjs:315-322`).
**EXCEPTIONS** Ground-floor public rooms legitimately break the grid (columns traded for transfer beams) — expensive, so used at one or two levels.
**CONFIDENCE: HIGH** for the principle, MEDIUM for exact span numbers pending pass-A URLs

## P-7 Daylight, views and outlook decide the perimeter; services decide the middle

**RULE** Functions occupied for long periods want daylight and an outlook; functions people pass through, or that are machine-dominated, can be internal. Building depth is limited by how far daylight reaches.
**EVIDENCE** Side-lit depth is commonly limited to roughly 2-2.5 × floor-to-ceiling height for useful daylight, so deep plans need a courtyard or atrium; national codes require habitable-room daylight/openability; evidence-based-design results link daylight to patient and guest satisfaction.
**SOURCE** Daylight-factor method / NEUFERT daylighting tables; building-bulletin-type daylight guidance via pass A (§28).
**REASON** Perimeter is the expensive, valuable resource; interior is cheap. Placing program by daylight band removes most arbitrary adjacency fights.
**REAL-WORLD APPLICATION** Bedrooms and living rooms on the perimeter; stores, risers, staff BOH, plant and circulation on the least desirable face or internal; kitchens need an external wall for exhaust and make-up air.
**GRID APPLICATION** Compute a daylight band as "within N tiles of an envelope tile" and place program by band (§16.3). With a 0.5 m tile and the ~2.5 × storey rule, useful daylight reaches about 12-14 tiles from the façade — which is why the existing 13-row band depth (`BAND_N` rows 9-21) reads as reasonable.
**EXCEPTIONS** Pools, cinemas, dark kitchens and storage want to be internal; a window onto a service yard buys nothing.
**CONFIDENCE: HIGH**

## P-8 Access control is thresholds and information, not just walls

**RULE** Public-to-restricted transitions are handled by sequences: a threshold you can be seen at, a buffer that absorbs the transition, and a control point that reads intent. Wayfinding quality depends on those being legible.
**EVIDENCE** Kevin Lynch, *The Image of the City* (paths, edges, districts, nodes, landmarks) and *Site Planning*; Oscar Newman, *Defensible Space* (1972) on territoriality; healthcare wayfinding research on decision points; correctional direct-supervision design on line-of-sight (§23).
**SOURCE** Lynch/Newman, books, URL not fetched this session; wayfinding research via pass A (§28).
**REASON** Users navigate by recognition and by a few decision points; where every choice is equal, staff must explain the building. In a game that shows up as idle or abandoned NPC jobs; in a hotel, as guests in the wrong zone.
**REAL-WORLD APPLICATION** From the lobby you can see reception, seating and the lift hall; you cannot see the back-of-house door. Staff entrances are visibly separate.
**GRID APPLICATION** Put `signage` assets (1.0 × 0.5 m) at choice points; keep the entrance → reception → lift-hall axis visually unobstructed (a straight run of walkable tiles with no blocked cell); hide service doors behind a wall line rather than dressing them up. Measurable version in §18.5.
**EXCEPTIONS** Maximum-security facilities deliberately remove visual information; that is a different, stated goal.
**CONFIDENCE: HIGH**

## P-9 Buildings are designed for a second life

**RULE** Good plans anticipate growth, reuse and failure: reserved land, repeated modules, spare core and service capacity, and at least two ways in and out.
**EVIDENCE** Both game traditions make this explicit (RimWorld "start small, plan the expansion"; Prison Architect layouts that collapse at 300 inmates — §25); real practice states it as shell-and-core / loose-fit design.
**SOURCE** Brand, *How Buildings Learn* (pace layering) — book, URL not fetched this session; passes B/C (§28).
**REASON** A layout that only works at today's size is a demolition waiting to happen; reserving a corridor stub is cheap, re-planning an occupied floor is not.
**REAL-WORLD APPLICATION** Structure and risers sized for an extra core; a services yard kept free; a floor plate that can be split without cutting a room in half.
**GRID APPLICATION** Leave expansion joints: a corridor stub ending in `blocked` tiles as a "future door", a spare shaft cell, a module edge that can repeat. Verify with the 2× test (brief step 15; §25.2 here).
**EXCEPTIONS** On a fixed 80 × 50 canvas with an 8-tile ring, growth is vertical: reserve the core and the hoistway, not the plot.
**CONFIDENCE: HIGH**

# 4. How architects actually decide (research + method)

The profession does not design by intuition or by tip-lists; it runs a repeatable sequence. This section is the method the design agent copies, because it is what turns "looks good" into a checkable claim.

## 4.1 The programming → planning sequence

| Step | Professional name | Input | Output | Grid form |
| --- | --- | --- | --- | --- |
| 1 | Programming | client brief, users, operations | space list + areas + occupants + equipment | §4.2 matrix, areas in tiles |
| 2 | Adjacency analysis | space list | relationship chart (which pairs must/cannot touch) | §8 matrix |
| 3 | Bubble / network diagram | adjacency | abstract graph, node area ≈ program area | graph on the tile grid, §19 |
| 4 | Zoning | bubbles + site | blocks by function and by public/private gradient | §9 zone map per floor |
| 5 | Circulation diagram | zones + movement | spine, branches, service routes, exits | §10 route map |
| 6 | Massing / parti | zones + structure + daylight | the shape, the core, the bay rhythm | §2.6 module, §13, §14 |
| 7 | Schematic plan | parti + module | room shells on the grid | tile write |
| 8 | Furniture/equipment layout | room shells | fixtures in rooms | §2.7 catalogue |
| 9 | Design development + tests | plan | egress/daylight/adjacency checks, cost, POE | §26 evaluation |
| 10 | Post-occupancy evaluation | built building, observed behaviour | measured failure list → next project | run the sim, read the metrics |

**RULE** The order is the value. Steps 1-6 are decisions about *relationships*; step 7 is where tiles appear; step 8 is where the room gets its identity in this engine (§2.4). Skipping to step 7 is the single most common cause of a plan that cannot be repaired later.
**SOURCE** Programming/PLM sequence from architectural practice (Preiser/Vischer; Lawson, *Design for Planning*; facility-planning literature in §28) + this engine's room-typing behaviour (`domain/schema/rooms.ts`). **CONFIDENCE: HIGH** for the logic, MEDIUM for the naming (firms use different labels for the same steps).

## 4.2 The program matrix (the artifact to produce)

One row per space, with exactly these columns — they are the union of what a professional space program carries and what this engine can observe:

`id | name | users | occupants | clear tiles | gross tiles | fixtures (asset ids from §2.7) | interact capacity needed | privacy class | traffic level | must-adjacent | must-separate | daylight need | service need (water/waste/power/exhaust) | security tag | expansion slot`

Rules for filling it:
- `clear tiles` is the walkable floor area; `gross tiles` adds the wall share. At 0.25 m²/tile, a 28-tile clear room is 7.0 m² — small but usable for a bathroom + bedroom in this engine's terms.
- `interact capacity needed` = expected concurrent users, and it must equal the spots on the fixtures actually placed (`resolveInteractForTarget`, §2.4). A program that says "reception: 120 arrivals/hour" and one desk with cap 4 × 5-12 s is a *contradiction the matrix exposes before any tile is placed*.
- `fixtures` must come from the shipped catalogue or the design adds rooms the engine cannot type (they read as `hall`).
- `daylight need` ∈ {required, preferred, indifferent, must-be-internal} — this single column does most of the zoning work (§16).
- `service need` is what generates the riser/store/plant rooms; a program without it produces a building that cannot be maintained (§15).

## 4.3 Closeness ratings and the reason codes

Professional relationship charts use a 5-level scale — **A** absolutely essential, **E** especially important, **I** important/ordinary, **O** ordinarily not important, **U** undesirable — often drawn with the classic `A=4, E=3, I=2, O=0, U=-1` weights so a candidate plan can be *scored*. This KB's five-class system in §8.1 is the same instrument, mapped:

| §8 class | REL-chart equivalent | Weight |
| --- | --- | --- |
| MUST BE ADJACENT | A | +5 |
| SHOULD BE NEAR | E | +2 |
| NEUTRAL | O | 0 |
| SHOULD BE SEPARATED | U | −2 |
| MUST BE SEPARATED | U (with buffer/zone) | −5 |

**RULE** Every non-neutral relationship carries a *reason code*, because the reason decides how the relationship is satisfied or traded off. Codes: `WF` workflow/staff steps · `MAT` material/trolley movement · `PEP` people flow/volume · `NOI` noise · `SMEL` smell/smoke/exhaust · `HYG` hygiene/contamination · `PRIV` privacy/visual · `SEC` security/access · `FIRE` fire risk/egress · `THR` thermal/temperature control · `MAINT` maintenance access · `DAY` daylight contention · `STRUC` structure/stacking · `SUP` supervision/line of sight.
**EVIDENCE** The reason set is exactly what facility-layout and building-typology literature lists as the adjacency drivers (Muther's SLP; healthcare guideline "adjacency drivers" sections; hotel design guides' BOH workflow notes).
**SOURCE** §28 pass A/B/C source list. **CONFIDENCE: HIGH** (the classification), and note the *weights* are a convention, not a measurement — do not present a score as proof (§26.5).

## 4.4 Bubble diagram → rectilinear plan (the conversion that matters for a grid)

Architects move from graph to grid with these operations; the design agent should do them explicitly, in this order:

1. Draw the network (nodes = spaces, edges = A/E/I relationships, red edges = separations).
2. Size each node by its program area (adjacency, not aesthetics, sets node size).
3. **Cluster** nodes into blocks that share a reason code (the guest-room cluster, the F&B cluster, the housekeeping cluster, the plant cluster). A cluster becomes a zone in §9.
4. Place the **circulation element first** (spine or core), then hang clusters off it. In a grid game this is the "corridor is the skeleton" move; it is also why a "no corridors, everything is a room" plan fails P-4's wayfinding test even when it wins on distance.
5. Convert bubbles into rectangles by *shared-boundary* adjacency, not centre distance: on a tile grid two rooms are adjacent only if a wall line with a door connects them. Distance on the graph (§19.4) is the honest metric.
6. Insert separations as *buffers* — a neutral or service space between two incompatible ones (a store, a riser, a corridor) rather than a long gap. This is the standard professional answer to "must be separated but both need the perimeter".
7. Test-fit: pack, then measure the three numbers that decide whether the plan is any good — lettable/gross ratio, weighted adjacency score, circulation % (§26).

**RULE** Buffers, not distance, are how separation is achieved in a compact building.
**REASON** Distance costs perimeter, which is the scarce resource; a `dry-store` or `riser-closet` between a kitchen and a spa bed buys the same acoustic/smell separation at zero perimeter cost. **CONFIDENCE: HIGH** (universal planning practice; the *specific* buffer choices are game-verified: the generator's `RISER_W/RISER_E` sit inside the core wall line, `generate-hotel.mjs:45-46`).

## 4.5 Evidence-based design and the feedback loop

Real practice validates plans three ways before construction (movement simulation/visibility graph analysis, code and travel-distance checks, and post-occupancy evaluation of built buildings) and treats a POE finding as the next project's input. This KB's §19 gives the measurable proxies, §26 the checklist, and the engine itself is the POE: the layout is wrong when agents idle, repath, or queue across a route (§24.6 for the symptom → cause table).

**RULE** Do not defend a plan by its drawing. Defend it by the measured behaviour it produces.
**CONFIDENCE: HIGH**

## 4.6 The decision procedure for the design agent (mapping the brief's steps)

| Brief step | Do this with this KB |
| --- | --- |
| 1-2 requirements, program | §4.2 matrix, §2.7 fixtures |
| 3 adjacency | §8 (five classes + reason codes) |
| 4 zones | §9 (gradient map), §11 (FOH/BOH) |
| 5 circulation | §10 (five systems), §2.3 (cost model) |
| 6 design the grid | §20 (tile translation), §14 (bay rhythm), §2.6 (module) |
| 7 major masses | §21 (pattern catalogue), §13 (core/vertical) |
| 8 rooms | §8 matrix + §16 daylight band + §12 widths |
| 9 doors | §12.5 (door rules), §2.2 (halves/widths) |
| 10 utilities | §15 (services), §2.7 plant footprints |
| 11 movement test | §26.3 (throughput arithmetic), §2.4 (capacity/queues) |
| 12 wayfinding test | §18.5 (visibility/choice-point checks) |
| 13 realism test | §22 + §23 case studies |
| 14 gameplay test | §5, §6 (mechanic → layout tables) |
| 15 expansion test | §25 |
| 16 failure test | §24 (anti-pattern catalogue) |
| 17 iterate | DECISION → REASON → EVIDENCE → TRADE-OFF, per §"How to read" |

# 5. RimWorld findings (mechanics → layout, with the reasons)

RimWorld matters because it is the most-studied tile-grid NPC sim in existence: a decade-plus of players have reverse-engineered its scoring functions into layout convention. **The lesson for this project is methodological as much as substantive** — nearly every community rule is a *fossil of one specific mechanic*, so the transfer procedure is always: find the mechanic in this engine's code (§2), then decide whether the rule still applies. §5.5 does that per principle; §5.6 names what must not transfer.

## 5.1 The scoring functions that generate the layouts

| Mechanic (documented) | The layout rule it produces | Why the mechanic forces it | Conf. |
| --- | --- | --- | --- |
| A room is a flood-filled enclosure bounded by walls, doors, rock, coolers, vents; hard cap 5,184 tiles ([wiki: Rooms](https://rimworldwiki.com/wiki/Rooms)) | **Doors, not walls, are the real stat boundaries** — put a door wherever a stat should restart | every enclosed tile shares one stat bundle (beauty / space / cleanliness / temperature / impressiveness) | HIGH |
| Unroofed ratios: ≥ 25 % unroofed behaves as outdoors for temperature, > 25 % or > 100 tiles as "outdoors for work", 300+ tiles as *psychologically* outdoors | a "great hall" silently stops being a room past a threshold | enclosure is a **cliff, not a gradient** | HIGH |
| Roof support: "a single wall or column will support a roof in a roughly circular area 6 tiles around it"; "12 × (#) or smaller will always be able to be fully roofed" ([wiki: Roof](https://rimworldwiki.com/wiki/Roof)) | indoor span is capped ~12 tiles without columns | the roof is a structural field computed from supports, and unroofed tiles lose every indoor bonus | HIGH |
| Space = 1.4 per walkable tile (+0.5 per pass-through) **minus 0.9 per tile an object covers**; impressiveness `I = 65 × avg(wealth,beauty,space,clean) + 35 × min(...)` ([wiki: Rooms](https://rimworldwiki.com/wiki/Rooms), [wiki: Space](https://rimworldwiki.com/wiki/Space)) | furniture is *paid space*; art (1-tile, high beauty) beats case goods | the `min` term means the weakest of four stats caps the room, so adding a bed lowers the ceiling | HIGH |
| Beauty is a per-tile average with a penalty on rooms under ~40 tiles; pawns perceive ~8 tiles ([wiki: Beauty](https://rimworldwiki.com/wiki/Beauty)) | either tiny bare sleeping pods or one huge decorated commons — never a mid-size half-decorated room | averaging over a small sample + the small-room floor penalty | HIGH |
| Job selection is priority-ordered and **distance-blind**: "colonists will haul every single object, even those halfway across the map … they have no regard for efficiency" ([wiki: Work](https://rimworldwiki.com/wiki/Work)) | the *map* must perform the distance optimisation the AI will not | nothing prices walking at decision time, so travel has to be made impossible by placement | HIGH |
| Tick economics: a simple meal is 5 work units at 60 ticks/s with ~5 tiles/s walking, so a stockpile 5 tiles away costs about 2 s per meal and caps a fast cook near 33 % ([r/RimWorld](https://www.reddit.com/r/RimWorld/comments/9rkygc/til_about_the_importance_of_haulers_and_shelves/)) | ingredient shelves *inside the bench's reach tile*; bills that drop on the floor | travel is dead time subtracted from work ticks — **note: vanilla has no workbench adjacency bonus at all**; the whole convention is travel-tick economics | HIGH (community-measured; the absence of an adjacency bonus is verified against the wiki) |
| Shelves hold 3 × the capacity per tile and carry no beauty penalty, while floor piles cost −10…−15 beauty each ([wiki: Shelf](https://rimworldwiki.com/wiki/Shelf), [r/RimWorld](https://www.reddit.com/r/RimWorld/comments/1u8lgf5/140_hours_on_rimworld_and_just_learnt_about/)) | storage density is a *tile-cost multiplier*: warehouses shrink to a third | density plus the beauty term | HIGH |
| Hauling targets the highest-priority pile with space; ties go to the closest; **a higher-priority bin pulls out of a lower one** ([r/RimWorld](https://www.reddit.com/r/RimWorld/comments/1o2pmuw/please_help_me_understand_stockpiles/)) | one low-priority catch-all as overflow, and read its fill level as a diagnostic | priority inversion manufactures re-haul loops | HIGH |
| A room is one thermal node; a second wall layer halves transfer; a cooler's exhaust needs an unroofed tile ([wiki: Temperature](https://rimworldwiki.com/wiki/Temperature), [r/RimWorld freezer guide](https://www.reddit.com/r/RimWorld/comments/ynlhgu/a_definitive_guide_to_efficient_freezers_14/)) | minimise the *number* of conditioned rooms; double wall + airlock + a 2-tile exhaust chimney; staggered setpoints cut peak load | heat leaks through surface area; measured: standard 6 °C, double wall −6 °C, both −29 °C | HIGH |
| Light: 30 % needed for mood, work speed falls toward 80 % in darkness, plants stop below 51 %; a sun lamp is 100 % within 5.5 tiles and 50 % to ~10 ([wiki: Light](https://rimworldwiki.com/wiki/Light)) | greenhouse geometry *is* lamp-spacing geometry | three different thresholds (mood, growth, surgery) pull the plan apart | HIGH |
| Door open speed by material: autodoor 400 %, wood 120 %, steel 100 %, stone 45 % ([wiki: Door](https://rimworldwiki.com/wiki/Door)) | high-traffic doors are powered doors; stone doors only where hit points matter | a door's open time is a path-cost spike | HIGH |
| Player floors are faster than natural terrain and pawns take the lowest-cost path ([wiki: Floor](https://rimworldwiki.com/wiki/Floor), [r/RimWorld](https://www.reddit.com/r/RimWorld/comments/773ph1/best_kill_boxbase_defense_design/)) | **pave the routes you want used** and leave soft ground where you want delay | the cost surface is a steering lever on your own workers and on attackers | HIGH (mechanism) / MEDIUM (raid use) |
| Adjacency radii are hard predicates: a vitals monitor must be adjacent, covers the 8 surrounding tiles, one per bed, +7 % tending; joy objects must be "within 18 cells of and capable of pathing to" the pawn; recreation decays 2.5 %/h ([wiki: Vitals monitor](https://rimworldwiki.com/wiki/Vitals_monitor), [wiki: Recreation](https://rimworldwiki.com/wiki/Recreation)) | medical is a repeating 1-bed + 1-monitor module; recreation belongs within ~18 tiles of where people already are | service radii, not room quality, decide placement | HIGH |
| Surgery multipliers: outdoors 0.85, cleanliness floor 0.6, hospital bed 1.15, < 50 % light at the head penalises, hard cap 98 % ([wiki: Surgery](https://rimworldwiki.com/wiki/Surgery)) | sterile tile, bright, small, near the entrance and near a medicine pile | multiplicative room stats × a hard adjacency predicate | HIGH |
| A prison must be a fully enclosed room with ≥ 1 bed and colonists may not share it; higher prisoner mood recruits faster, lower certainty converts ideology faster ([wiki: Prison](https://rimworldwiki.com/wiki/Prison)) | **two** prisons — a soft one for recruiting, a harsh one for conversion; cell doors face inward so escapees run *into* the base | two opposing mood targets on two different pipelines | HIGH |
| Turrets and walls inflate colony wealth, which the storyteller scales raids against; modern raids bypass pathing entirely (drop pods, sappers, mechanoids) ([r/RimWorld](https://www.reddit.com/r/RimWorld/comments/bg3mn3/what_are_your_defense_kill_box_designs/), [r/RimWorld](https://www.reddit.com/r/RimWorld/comments/1id4sax/is_there_an_alternative_to_killboxes/)) | a killbox is a *phase*, not an architecture; perimeter depth (two wall layers with doors) beats one funnel | optimising one threat vector creates a new failure mode elsewhere | HIGH |
| Multi-floor is a mod implemented as pocket maps, which breaks room/mood lookups; drop pods punch through layers; roof collapse destroys the floor above ([r/RimWorld](https://www.reddit.com/r/RimWorld/comments/1kbwihw/my_first_multilevel_base/)) | vanilla "verticality" is depth of rock, unroofed shafts and elevation-as-path-cost, not storeys | room statistics do not cross levels | HIGH |

## 5.2 Findings by topic (the convention and its reason)

- **Zoning.** The canonical cluster is freezer–kitchen–dining–recreation, and the dining room must touch the *freezer* and not merely the kitchen, otherwise colonists grab food and eat wherever they stand ([Steam: Colony Building Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=1805503731)). Hospital adjacent to the entrance/killbox exit so a wounded pawn is not dragged across the map, with a medicine shelf *at* the entrance so a drafted medic can tend in place ([r/RimWorld](https://www.reddit.com/r/RimWorld/comments/17bdeuf/base_layout_what_to_change/)). Production districts are organised by **input/output streams rather than by room type** once the base industrialises ([r/RimWorld](https://www.reddit.com/r/RimWorld/comments/j4rml2/guide_for_efficient_colony_and_room_layouts/)).
- **Corridors.** The consensus geometry is **3 tiles wide with a door in the middle**: the door creates a chosen 1-tile choke, one melee blocker holds it against many, ranged pawns behind it will not friendly-fire (unsafe within ~2 tiles of a friendly), and the width carries lamps, heaters, shelves and benches *inside the hall* without blocking traffic. The named cost: "3 is better for chokepoints but it also spreads the base out more so your pawns have further to walk" ([r/RimWorld](https://www.reddit.com/r/RimWorld/comments/1grr32o/are_hallways_better_as_2_width_or_3_width/), [r/RimWorld](https://www.reddit.com/r/RimWorld/comments/yoric4/corridor_defense_one_tile_wide_or_two_tiles_wide/)). Segmentation beats continuity for defence (a series of short doored halls gives more blocker positions and costs more doors and more everyday time). 1-wide corridors fail catastrophically when something spawns *inside* them (drop pods, infestations) and cut the base in half.
- **Room dimensions.** Bedroom design is a two-way fight between the space score and beauty density: 3 × 5 with an excellent bed, stone tile and a good sculpture is near-optimal; 4 × 5 / 5 × 5 if the art is weak; tables, chairs and dressers are net-negative in a small room because they subtract space ([r/RimWorld](https://www.reddit.com/r/RimWorld/comments/1ux6txt/how_do_i_make_rooms_better_than_mediocre/)); a "wondrously impressive" room is only reachable by using sculptures instead of beds ([r/RimWorld](https://www.reddit.com/r/RimWorld/comments/1o045rg/the_smallest_possible_wondrously_impressive/)). A published practitioner spec: dining 13 × 15, workshops 15 × 15 → 20 × 20, medical 5 × 8+, sleep 4 × 4 single / 5 × 5 double, battery room 5 × 6 cooled, freezer 2-3 tiles deep ([Big Boss Battle](https://bigbossbattle.com/laying-base-rimworld/) — one player's targets, not mechanics).
- **Kitchen, storage, hauling.** Benches back-to-back with a single shelf between so the worker never moves; drop finished goods on the floor over a low-priority zone so counts register; never co-locate the kitchen with the butcher table, because filth drags the room's cleanliness and cleanliness feeds food poisoning, surgery and research speed ([r/RimWorld](https://www.reddit.com/r/RimWorld/comments/1myc0dn/stockpile_zones/), [r/RimWorld](https://www.reddit.com/r/RimWorld/comments/9rkygc/til_about_the_importance_of_haulers_and_shelves/)). The single mega-stockpile is reported as a *mood* failure (floor piles at −10/−15 beauty each) before it is a distance failure.
- **Workshops / research.** Research wants its own clean, bright room (outdoors is ×0.8) and multiple simultaneous researchers are penalty-free, so **lab area, not bench count, is the constraint**; giving each role its own room also makes the role tag meaningful ([wiki: Research](https://rimworldwiki.com/wiki/Research)).
- **Recreation and happiness.** The highest-yield mood move is consolidation: one very impressive combined dining + recreation room stacks roughly +8 / +8 / +15 per colonist, versus scattering mediocre private bedrooms — "it's nails on a chalkboard seeing people make nice bedrooms while eating in a plain tiny dining room" ([r/RimWorld](https://www.reddit.com/r/RimWorld/comments/1ux6txt/how_do_i_make_rooms_better_than_mediocre/)). Variety matters as much as quantity (tolerance fatigue above ~50 %).
- **Defence as architecture.** Embrasures (fire-through walls) beat corridors for fighting inside; 3-wide with a mid-door plus an embrasure at each intersection is the recurring "defensible corridor"; two wall layers with doors enable pop-out-shoot-retreat and force a breacher to chew depth, which *creates* the funnel; sandbags give 55 % cover, so clearing enemy cover outside firing lines is a layout act ([wiki: Cover](https://rimworldwiki.com/wiki/Cover), [r/RimWorld](https://www.reddit.com/r/RimWorld/comments/10ggo24/whats_yalls_thoughts_on_killbox_vs_no_killbox/)).
- **Utilities are peripheral leaves.** Solar is shaded by its own roof, wind needs open ground, geothermal needs a geyser, batteries must be walled, roofed, cooled and on an isolated circuit (they explode when charged and exposed), and appliances link only ~6 tiles — so power infrastructure sits outside the envelope *and* outside the future expansion ring ([wiki: Battery](https://rimworldwiki.com/wiki/Battery), [Steam beginner's guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2779784000)).
- **Farms are a leaf node with a huge haul volume.** Crops touch only freezer/kitchen/livestock, so they belong at the inner periphery; but harvest tonnage makes walking dominant ("my pawns spend 90 % of their lives walking back and forth from the gardens"), fixed by a field-side covered drop pile, shelf silos, beast/mech haulers, or a farmer's bed beside the hydroponics ([r/RimWorld](https://www.reddit.com/r/RimWorld/comments/121nz0a/trying_a_more_realistic_approach_to_colony/), [r/RimWorld](https://www.reddit.com/r/RimWorld/comments/1iursek/big_colonies_vs_walk_time_how_to_deal/)).
- **Expansion.** Start small and disposable (a wood starter shack, stone within a quadrum); keep 11 × 11 module discipline, a reference blueprint save, and an adjacency flowchart before building; living quarters go on the **periphery** precisely so beds can be added without inventing a new housing zone ([r/RimWorld](https://www.reddit.com/r/RimWorld/comments/1ekv513/whend_you_learn_to_stop_making_bases_from_wood/), [Steam: Colony Building Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=1805503731)). What breaks at scale: hauler saturation from aggressive high-priority buffers, raw walk time, and the cleaning load of big traffic areas.

## 5.3 Disagreements, and what each side is optimising

| Question | Camp A | Camp B | Resolution for a grid design agent |
| --- | --- | --- | --- |
| Corridor width | 1-2, minimum path length | 3 + mid-door (choke, utilities in the hall) | depends whether the sim punishes passing conflict; here it does (§12.1) and raid defence does not exist, so 2-3 with 4 on the primary |
| Defence | killbox / embrasure lines | field defence, natural funnels | modern threats bypass pathing, so depth and redundancy beat one funnel (§10.7's two-exit rule is the same argument) |
| Bench in the freezer | no hauling, no filth penalty | workspeed penalty from cold | the honest answer is *two rooms with an airlock*, which is this KB's §17.1 threshold logic |
| Bedrooms | tiny pods + one mega-commons (mood math) | many good private bedrooms (fairness, realism) | mood math is a scoring fact; realism is an OPTIONAL value — decide per project (§22.2) |
| Wood | never structural | thousands of hours, never burnt | risk-culture disagreement; the middle path (wood as *sacrificial* wall, stone shelves so stock is not fuel) is a transferable "flammability layering" idea |
| Diagonals/curves | they look right | they waste interior space and are mechanically near-worthless | where the grid offers no benefit, aesthetic geometry is a paid choice — state the price (§22.2) |

## 5.4 RimWorld's own anti-patterns (symptom → cause)

one giant stockpile → beauty collapse and mental breaks; 1-wide everywhere → an inside-the-corridor spawn halves the base; dining far from the freezer → "ate off the ground"; wooden storage around electronics → one short takes a quarter of the map; a single power grid with exposed batteries → a storm cascades into the freezer *and* the hospital; a finished core with no expansion ring → growth pushes outward into long paths; turret-count growth → wealth → bigger raids; over-decorated small rooms → the `min` term keeps them "mediocre"; kitchen with the butcher → cleanliness ceiling; a big hall with no roof supports → half the room silently becomes outdoors.

## 5.5 Transferable principles (class-tagged)

1. **Price distance or the AI will ignore it** — UNIVERSAL (any agent sim with job selection).
2. **Travel is dead time, interaction is productive time**: put the input inside the worker's reach — UNIVERSAL (real-world lean manufacturing's motion waste).
3. **Rooms are statistical nodes from an enclosure flood-fill; boundaries are thresholds, not gradients** — GAME-SPECIFIC numbers, UNIVERSAL shape (and directly relevant: this engine also derives rooms by flood fill, §2.4).
4. **Room quality = f(average, minimum) of independent sub-stats** → balance, never maximise one axis — UNIVERSAL design lesson.
5. **Furniture is simultaneously decoration and occupied space** — UNIVERSAL (this KB's aisle-by-use rule, §20.5).
6. **The cost surface is a steering mechanism** (floors, doors, cover) — UNIVERSAL, but inert here (this engine's step cost is uniform: cardinal 1, diagonal √2, no surface term, §2.3).
7. **Storage density is a tile-cost multiplier** (vertical/shelved storage trades build cost for footprint) — REAL-WORLD-derived.
8. **Priority systems must be monotone or they create re-haul loops** — UNIVERSAL (any queue/kanban design).
9. **Environmental fields are per-room and leak through boundaries**: fewer conditioned zones, double boundaries and airlocks beat bigger machines — REAL-WORLD-derived (and literally true in building services).
10. **Utility placement is predicate-constrained, so utilities belong to the outer ring and outside the expansion envelope** — REAL-WORLD-derived; §25.
11. **Service objects need explicit adjacency radii, and they do not stack** — GAME-SPECIFIC values, UNIVERSAL pattern (this engine's version is `interactSpots` + `capacity` + `admissionDepth`, §2.4).
12. **Sightlines and choke geometry are layout, not stats** — GAME-SPECIFIC here (no LOS system) but true of real defensive architecture.
13. **Crowding carries both a mood cost and a movement cost, both functions of walkable tiles per occupant** — REAL-WORLD-derived; in this engine only the movement half is mechanical (§22 C-5).
14. **Any block that cannot be extended without demolishing a neighbour becomes a bottleneck at scale** — UNIVERSAL; §25.
15. **Optimising one threat vector creates a new failure mode elsewhere** (killbox → bypass raids, turrets → wealth, priority hauling → hauler starvation, small impressive rooms → space penalty) — UNIVERSAL, and the reason §26.5 forbids treating a single good metric as proof.
16. **Aesthetics that ride on real mechanics are free; aesthetics that fight the grid cost space** (paving, double walls, wide main streets vs diagonals and non-boxes) — the same position as §22.2.

## 5.6 What must NOT transfer to this engine

- **Enclosure-as-stat-boundary tricks.** RimWorld players exploit "corners do not need to be filled" and build shapes this engine's room detection would type differently; verify against `engine/npc/rooms.ts` behaviour rather than importing the trick.
- **Beauty/cleanliness/light/surgery scoring.** None of these systems exists here — importing "make rooms bigger for score" would be copying a number with no referent (occupancy and comfort are *chosen* ceilings, C-5).
- **Defence geometry.** 1-tile chokes, embrasures, killboxes and wall-layer depth exist to beat raid pathing; this project has no hostile pathing, and the same 1-tile width is a *flow failure* here (§12.1).
- **Workbench adjacency bonuses.** There is none in vanilla; the convention is travel economics, so do not look for an equivalent bonus here — check `interact.capacity` instead (§2.4).
- **The "20-tile table search radius" folk figure.** It is community attribution, not a documented rule; the mechanical facts are the 18-cell joy-object reachability and the meal thoughts. The *conclusion* (distribute dining rather than centralise one hall) survives on those, and on §10.8.
- **Verticality.** Multi-floor is modded pocket-map behaviour in RimWorld; here the portal model is first-class (§2.4), so lift-bank and hall-queue reasoning (§13) is *stronger* than RimWorld's, not weaker.

**Evidence note for §5** — the table rows are **[fetched]** from a research pass that read the RimWorld wiki plus ~25 live r/RimWorld threads and three Steam guides (source list in §28); items marked community-measured are **[searched]**/thread-derived and labelled MEDIUM. Two documented gaps: the "20-tile table search" is a folk claim (§5.6) and **vanilla has no workbench adjacency bonus**, so that whole convention is travel-tick economics. A room-dimension spec sheet ([Big Boss Battle](https://bigbossbattle.com/laying-base-rimworld/)) is one practitioner's targets, not mechanics, and is cited as such.
# 6. Prison Architect findings (flow separation as a design system)

PA is the closest published model of what a hotel actually is: several populations with schedules and incompatible purposes, moving through zoned, graded rooms on a discrete grid, where the simulation scores *throughput, security and contentment* rather than tile count. Its design language is **separation first, adjacency second** — and almost every PA convention has a direct hotel reading, given in the right-hand column.

## 6.1 The flow-separation model

**Populations PA keeps apart:** new arrivals (prisoner bus), general prisoners by security tier, staff (guards, cooks, workmen, doctors, janitors), visitors, delivery vehicles, waste, and departures (release, transfer, execution → morgue). Each has its own entry point, permitted room set and time window.

**The devices, in ascending strength** — this ladder is the transferable framework, and every rung has an equivalent here:

| PA device | Mechanic | Hotel equivalent in this project |
| --- | --- | --- |
| Room access class | a room declares who may use it; a prisoner "can only work in rooms that they can access", so access bounds labour *and* need fulfilment | the role's `restrictedTags` / `focusTags` (§2.4) — the same abstraction, same consequence: an untagged room is an unusable room |
| Door keys + lock modes (Normal / Locked Open / Locked Shut); jail doors open only for guards; guards who go down **drop their keys** | door labelling is a real layout cost, not cosmetics | no lock system here: express it as geometry + tags, and never claim a "locked door" (M-26) |
| **Sectors** = "every area fully enclosed by walls and doors but not a room"; an unenclosed area reads as an unlocked path straight to the map edge | zones are **flood-able rings**; the enclosure test is binary | mirrors this engine's own room flood-fill semantics (§2.4): an unfinished corner merges zones |
| Escort override: an escorted prisoner passes any sector | supervised transit is the exception valve that makes strict zones usable | a staff escort has no mechanic here — model it as a spawn-zone/`focusTags` pairing, or as a route that only staff take |
| Separate thresholds per flow: deliveries zone, garbage zone "zoned next to the road" so trucks haul bags out, a dedicated staff entrance, visitor hours 08:00-20:00, intake at Reception | one door per population, positioned on the population's own approach | exactly §11.2's F1/F5/F6 chains and the tower's two grade openings (`generate-hotel.mjs:55`) |
| **Sally port**: "any entrance with 2 monitored doors or gates between the prisoners and the open road can be deemed secure", with a >4 m gap between the gate pairs | a trap volume between two doors | the **vestibule** (`context.md:28`) — same device, same reason (draught, luggage, control, unseen transition) |
| Screening at the seam: contraband arrives on the bus, trucks and visitors; only dogs and metal detectors find it; skip Reception and arrivals are dumped into general population unscreened | put the inspection *where the flows enter*, never downstream | the lobby security post + `front-desk` adjacency (§8.2.1): check at the threshold or not at all |
| **Checkpoint**: one-way movement when manned; pat-down quality depends on guard tiredness; **a crowded checkpoint lets prisoners pass unsearched** | congestion defeats control | the general rule: any inspection/desk queue beyond its apron becomes theatre (§10.8, C-6) |
| **Timing**: prisoners move only when the regime slot begins, so the whole population herds at once; pros **stagger meal times by tier** and avoid unscheduled gaps | schedule is a spatial instrument | the direct analogue of a hotel's breakfast peak and check-out peak — stagger or duplicate, do not just widen (§6.3) |

Real-world parallel, which PA is modelled on: five circulation flows kept apart (public/visitor, staff, prisoner transport, the service-and-support spine of kitchen/laundry/plant/receiving, and emergency), with **separation of classifications** and **one-way scheduled movement rather than free flow** as the governing principles ([Archgyan, "How to Design a Prison"](https://archgyan.com/how-to-design-a-prison/)).

## 6.2 Room patterns, with the numbers and the hotel translation

| Room | PA convention (measured/community, see §28) | Adjacency reason | Failure at scale | Hotel translation |
| --- | --- | --- | --- | --- |
| Cell | wiki minimum 2 × 3; player standard 4 × 4 (3 × 3 max-security, 5 × 5 death row); bed + toilet + enclosed + indoors | cells cluster on a dayroom and a toilet/shower cluster | grading: prisoners in below-average cells misbehave more, and new arrivals are *entitled* to an Average cell | keep the room template's quality floor constant across the tower; a "cheap" room at scale is a systemic penalty, not a saving (§12.6) |
| Dorm / holding | holding 5 × 5; dorm minimum 1 occupant per 4 tiles; privacy suffers | cheap overflow buffer | overcrowding collapses privacy → fights | multi-occupancy spaces need `occupants = clear tiles ÷ band` (§12.1), not "as many beds as fit" |
| Canteen | indoors + serving table + tables + benches; **2 benches + 1 table = 8 eaters**; **1 serving line ≈ 80 prisoners** (guide range 40-80); ≥ 20 tiles for a quality rating; "leave a hallway between tables and benches" | must touch the kitchen (trays are carried) and be reachable by every block **inside the one-hour meal window** | one door + one counter = queue, hunger, riot | servery sizing per cover, ≥ 1 aisle grid inside the dining room, and door count scaled with seats — the same arithmetic as §10.8 with `capacity = spots` (§2.4) |
| Kitchen | cooker + fridge + sink; **12 m² of workspace per cook**; ~4 cooks per 40-50 prisoners; a cooker handles ~20 ingredients; ~240 m² at full staffing; wall it off with **multiple doors**, mark Staff Only | "near the canteen and the deliveries zone or storage, to avoid long walks" | distant storage starves the canteen; a single door makes staff and prisoners cross in one doorway (contraband + collision) | the F1-F3 chain (§11.2) with a staff-only kitchen envelope of ≥ 2 doors, sized by staff count not by room aesthetics |
| Storage / deliveries | storage has no minimum; place near kitchen/centre "to minimise walking"; a worker physically carries every crate from the pad; without storage "objects are left on the floor where they drop"; trucks are 7 m, 8 items | one receiving node feeds kitchen, workshops, construction | long supply paths appear first as idle cooks and stalled builders | dry + cold store on the delivery-to-kitchen line (§8.2.3), and never let the drop point be the store |
| Showers / toilets | **1 shower head per 2-3 prisoners**; no enclosure needed; only walls and grates stop water, so drains go at the doorway line and the flanks | hygiene need + room rating; keep off the perimeter (tunnels start under the toilet) | a single cluster is a morning stampede; flooding shorts adjacent electronics | wet-room fixture ratios and a *designed* queue area outside the wet room (§12.1, §16 privacy) |
| Yard / courtyard | min 5 × 5, must be behind at least one door, "large enough to spread out" | exercise + emotional need; feeds sector grading | undersized yards concentrate people → violence; distant yards get skipped | amenities must be **near enough to be used**, not just reachable: a distance budget per repeated activity (§19.3 #7) |
| Workshops / industry | small workshops beat large ones; keep **3 tiles clear in front of every machine**; more saws than presses so presses never idle; laundry **2 washers : 4 irons : 8 baskets**, ≤ 100 workers at ≥ 400 m², an 80 m² laundry serves 250+; 4 m² per laundry/janitor worker vs 12 m² per operator; forestry regrows in ~2 days | raw material → process → storage/export, kept away from general population because tools are contraband | labour blocked by access permissions; weak walls leak contraband into housing | the plant/laundry/maintenance chain with the same **clear-apron-in-front-of-every-fixture** rule — literally required here, since a blocked `interactSpot` kills the task (§15.4) |
| Infirmary / morgue | indoors + medical bed; **~10 medical beds serve 300+**; place near the blocks and busy corridors, **not** next to mass-gathering rooms; an unconscious prisoner must be escorted, so travel time kills patients (each death is a valuation hit) | response radius | one central infirmary across the map | first-aid/medical presence per populated band, not one clinic at the far end of the tower |
| Solitary / punishment | 2 tiles (1 toilet + 1 prisoner); ~2 places per 20 inmates; doors damage-immune | near the court/processing path so escorts are short | too few → punishments stall | back-office capacity ratios scale with population, and sit on the route they serve |
| Reception (intake) | indoors + desk, table, chair, between the gate and the yard; search, strip, issue clothes from the laundry, then escorted to a cell | the seam where screening happens | skip it and arrivals enter unscreened | arrival processing (concierge/bell/`front-desk` + luggage) is a *chain with a fixture at each step* (§8.2.1) |
| Visitation | indoors + visitor table/booth; metal detector recommended; visitors 08:00-20:00 | **dead-end** the visitor route so visitors never transit housing | visitors routed through the yard = contraband + crowd mixing | non-guest visitors get a route that ends where it should, never one that crosses the guest band (§9.2 rule 4) |
| Admin / staff | office min 4 × 4 and "never has to be bigger than 4 × 4"; staff room 4 × 4 with ≥ 1 double sofa + a drink machine; 10 × 10 covering 300 guards / 500 staff | near their work area, or tired guards walk | staff energy drains → slower searches and patrols | staff amenities on the BOH spine near the rooms they serve (§11.6) — 1-1.5 m² per on-shift staff |
| Security / control | security room min 4 × 4, holding CCTV monitors, door control, phone taps; camera line of sight 13 m, one console up to 8 cameras | central sight on chokepoints | blind corridors are where contraband moves | supervision is a fixture-placement problem; note there is **no** LOS system here, so a "control room" is a realism/`mechanical`-tag statement (§17.3) |
| Death row → execution → morgue | the route is pre-planned and no other population uses it; three botched executions end the game | a dedicated, protected corridor | interception in a shared corridor | the one-flow-one-route rule: incident/transfer logistics (housekeeping, waste, medical) each need a route that does not double back through guests |

**Guard doctrine worth stealing:** guards deploy to a room, a post, or a patrol, and *if no guard is stationed in a room, one comes from another* — the system auto-borrows coverage, so response arrives from wherever is nearest. Player ratios run ~1:20 low-security to 1:5 maximum, with ≥ 2 stationed in the canteen during meals and some kept **unassigned for unforeseen work** ([wiki: Guards](https://prisonarchitect.paradoxwikis.com/Guards)). Translation: staff placement is a *coverage-radius* problem, and a fully-committed staff rota has no slack — so budget idle staff tiles in the program.

**Room grading** (0-10 per room, ±1 per object, driving population behaviour) is PA's most hotel-like mechanic: quality is scored per room and feeds behaviour, so a template that produces sub-standard rooms at scale is a systemic failure ([wiki: Room grading](https://prisonarchitect.paradoxwikis.com/Room_grading)). This engine has no grading, but it *does* type rooms from fixtures (§2.4) — the same lesson in weaker form: **the module must be good enough to be repeated.**

## 6.3 How congestion actually forms (and what fixed it)

PA's cause stack, in the order pros work through it: (1) simultaneous release from a regime slot, (2) path distance from block to function, (3) a single tile-width door as the only connector, (4) too few servers (counters, heads, cookers, machines), (5) slow floor tiles, (6) guards or objects standing in the route. The most-repeated player question — "any way to stop prisoners bunching at the canteen door?" — has exactly four published answers: **more doors, doors offset from each other, an aisle grid inside the room, and staggered meal slots by tier.**

Corollaries that transfer directly: **throughput = min(door, server, seat, fixture)**, so size all four per N users and require the weakest to pass; **queue space is designed, not discovered** (the 3-clear-tiles-in-front rule); **a crowded checkpoint leaks**, i.e. control degrades non-linearly with congestion; **movement cost is a per-tile surface** (floor materials at ~0.5-0.7 slow, ~1.2-1.3 fast — a legitimate steering lever, though this engine's cost is uniform, §2.3); and **open plan is faster and less secure at the same time**, which is precisely §22 C-1.

## 6.4 Service-routing discipline

Power: no cable-length limit from a station, but **two power stations on one grid deactivate both**, so redundancy means *separate grids per section*, and pros give each quadrant its own generator; plant rooms must stay dry because water in the plant room is catastrophic. Water/sewage: a small pipe loses pressure beyond **39 tiles** from a large one; a large pipe carries **761 tiles** from the pump; pumps *can* share a system (unlike generators) and belong centrally. Water is a **fluid**, stopped only by walls and grates — hence a drain line at every wet-room threshold. Waste is a physical haul to a road-adjacent zone by a truck, and bins inside the garbage zone are useless. Discipline observed in high-hour builds: run services in riser spines **alongside the fast-floor circulation spine**, keep plant staff-only and dry, and make each module self-sufficient "when one fails, the others run without an issue".

This engine has no fluids, cables or pressure (§20.6) — but §13.4/§13.5/§15.4 reproduce the *architectural* consequences (stacks aligned, risers on the core, per-district plant, dry access, maintenance clearance), which is exactly what makes a plan read as serviceable.

## 6.5 Expansion at 1,000 inmates (the same problem as 300 keys)

Module = **self-sufficient pod**: cells + holding + toilets/showers + yard + a service stub, with its own power and door group; 16 cells fit a 12 × 25 foundation. A 4-wide fast-floor spine carries staff, supply and risers, with functions hanging off it, and the delivery/garbage pads stay on the road side. Perimeter: a **10-tile clear zone** wall-to-anything (the contraband-throw distance), double-gated entrances, detectors and dog patrols at exits. Because rooms cap at ~20 active users and access is per-sector, **scale by cloning, never by enlarging**: more canteens, kitchens, laundries, infirmaries. Class-specific blocks with quality built to standard, promotion one grade at a time, spare dorm capacity for arrival spikes, and the cost-discipline rule: "you do not recuperate the costs of dismantled or cancelled items" — so draw the master grid before building. Every one of these lines is §25 with harder numbers attached.

## 6.6 Anti-pattern catalogue (symptom → fix)

single-door canteen → 2+ offset doors, interior aisle grid, ≥ 1 serving line per 80, staggered slots · kitchen far from storage/canteen → one staff-only supply chain · one giant cell block → repeated pods on a spine · a shared shower room → per-cluster heads with grates at the threshold (pros often build no shower room at all) · no Reception → unscreened intake and a broken clothes loop · two generators on one grid → total blackout · small pipe across the map → trunk-and-lateral · servo on the front gate → prisoners walk out · checkpoint in a narrow hall → widen or duplicate · one central infirmary → one per district · unscheduled regime gaps → an idle, hostile crowd · minimum-grade cells → chronic misconduct · a toilet on the fence line → the tunnel starts there.

## 6.7 Real correctional practice vs game mechanic (what generalises)

**Traces to real practice** (and therefore usable as REAL-WORLD class in §27): dayroom-centred pods of **48-64 cells** with **the officer stationed inside the unit and the barriers removed**, ~1 officer per 50, with fewer violent incidents and lower staff absence ([FDLE / Saunders, *Direct Supervision Jails*](https://www.fdle.state.fl.us/getContentAsset/cf278644-6a98-40be-99bb-eabfa5c9e7ce/73aabf56-e6e5-4330-95a3-5f2a270a1d2b/Saunders.pdf?language=en), [NIC](https://nicic.gov/resources/tags/direct-supervision)); the "New Generation" jail synthesis of podular + direct supervision ([OJP 103205](https://www.ojp.gov/pdffiles1/Digitization/103205NCJRS.pdf), [EBSCO overview](https://www.ebsco.com/research-starters/law/prison-and-jail-systems/)) and the finding that **linear/remote supervision "generally produces the most tension"**; sally ports and interlocking gates ([Fentress](https://blog.fentress.com/blog/sallyport/), [Wikipedia](https://en.wikipedia.org/wiki/Sally_port)); a double fence 6-8 m apart with a 6-9 m clear zone either side; **space minima** (cell ≥ 54 ft², dorm 35 ft²/person, dayroom ≈ 3.3 m²/resident, holding 50 ft² + 10 ft² per extra occupant — [Wis. Admin. Code DOC 350.06](https://www.law.cornell.edu/regulations/wisconsin/Wis-Admin-Code-SS-DOC-350-06)); and the wellbeing results — daylight, natural materials, greenery ("high levels of green vegetation are related to lower levels of self-harm and violence"), capacity not exceeding ~1,000, unobstructed sightlines under ~1.1 m, **courtyard layouts best for mental health and panopticon-style constant watch worst** ([Penal Reform International](https://www.penalreform.org/blog/build-success-prison-design-infrastructure-tool-rehabilitation/), [Justice Trends](https://justice-trends.press/the-evolution-of-prison-environments-psychological-impacts-trends-and-opportunities-why-we-must-do-better/), [HMC Architects](https://hmcarchitects.com/blog/2018-09-05/normative-designs-role-in-reducing-recidivism-rates-2018-09-05/)).

**Pure mechanics — do not generalise:** pipe-pressure and cable rules, the 20-user-per-room cap, floor-tile speed factors, one-way manned checkpoints, tunnels always starting under the toilet, 13 m camera LOS, "three botched executions = game over", per-security-day payments and grants, and the flat "open path to the map edge = escape" rule. PA's *room class labels* are an abstraction standing in for policy, key control and radio dispatch — which is why this project's `focusTags` / `restrictedTags` are its faithful equivalent, and why geometry alone is not.

## 6.8 Transferable principles (ranked for a grid design agent)

1. **Design the flows before the rooms**: enumerate populations and material streams, each with a start, an end and a permitted room set; the crossings are the defect list. → §11.2, §4.2.
2. **Every function has a service radius in tiles *and* in time**; if walk time exceeds the schedule window, clone the function rather than enlarge it. → §13.3, §25.
3. **Throughput = min(door, server, seat, fixture)**; keep a clear apron of tiles in front of every server. → §10.8, §15.4, §20.5.
4. **Corridors are capacity with a width unit** (main ≥ 4, secondary ≥ 2), and no corridor may be the only link between two zones. → §12.2, §10.7.
5. **Schedule is a spatial instrument**: staggering by population buys throughput more cheaply than widening; unscheduled gaps create idle, hostile crowds. → §10.6, §13.2.
6. **Access = label + lock state + escorted override**, with automation's footgun documented (never servo the public-facing gate). → §11.5, M-25/26.
7. **Zones are flood-able rings**: guarantee an enclosed perimeter, a sterile band outside the wall, and double-gated thresholds with real trap volume. → §9, §17.1, §2.4.
8. **Screening capacity must exceed peak crowd**, or screening becomes theatre. → §10.8, C-6.
9. **Redundancy by district, not by bigger central plant.** → §15.3, §25.3.
10. **The needs chain beats amenity count**: every need anchors to a fixture with a ratio; unmet needs convert to measurable misbehaviour. → §4.2, §2.7.
11. **Quality is per-room and repeated** — never let the module template produce sub-standard rooms at scale. → §20.4, §12.6.
12. **Put dirty/industrial/waste on the service spine** and price long supply paths in idle staff. → §11.3, §11.4.
13. **Validate at 1×, 6× and 20×**: queue length at every door, walk time to every need, and whether one corridor carries every flow. → §25.2, §26.

**Evidence note for §6** — the game figures are **[fetched]** from the Paradox Prison Architect wiki pages listed in §28 plus four high-reputation Steam guides (community-measured balance: MEDIUM as facts about PA, HIGH as *design reasoning* once translated); the real-practice claims are **[fetched]** from agency, NGO and architect sources. Reddit and Fandom pages returned 403/anti-bot in the pass, so nothing rests on them beyond titles. The two correctional PDFs listed but not machine-readable in the pass are marked as such in §28 and support no number here.

# 7. Community and streamer findings (what high-hour players agree on, and why)

The consensus layer, collected from Reddit/Steam-guide/YouTube layout discourse ([r/RimWorld layout thread](https://www.reddit.com/r/RimWorld/comments/j4rml2/guide_for_efficient_colony_and_room_layouts/), [r/prisonarchitect critiques](https://www.reddit.com/r/prisonarchitect/comments/1ams0zf/first_prison_layout_about_5_hours_in_what_do_i/), [Big Boss Battle base-laying guide](https://bigbossbattle.com/laying-base-rimworld/), plus the §23 game cases). Phrased as rules, with the mechanic that produced them and this KB's section that owns them.

**Agreed on:**
1. **Zones before rooms.** Every serious guide starts with a district plan (sleep / work / eat / store / dump / defend) — §9, §4.4.
2. **Do not create hallways for their own sake; but do create one main route.** The "no corridors" slogan is really "no *unused* corridors"; the guides' own layouts have an obvious spine — §10.3, C-2/C-3.
3. **Clear the doorway tiles.** Storage, tables and decorations never belong beside a door — §20.5, M-9.
4. **Distribute the busy services** (dining, stockpiles, canteens, toilets) at the travel optimum instead of centralising one big one — §10.8, §23.9.
5. **Size rooms by their occupant count and their furniture, not by the leftover.** Small-room penalties and furniture space taxes punish both shrinking and stuffing — §20.2, §20.5.
6. **Build for twice the population you have** (spare blocks, spare power, spare route) — §25.
7. **Two ways in/out, and an airlock at each boundary** — §10.7, §17.1.
8. **Enclosure is load-bearing**: a room that is not sealed is not a room — in RimWorld by walls, here by fixture tags (§2.4, M-14).
9. **Temperature/utility adjacency drives placement** (freezer↔kitchen; PA's boiler-room runs) — §15.3.
10. **Readability is worth tiles** — showcase builds are praised for shape and legibility, not only efficiency — §22.2.

**Disagreed on (and what the disagreement teaches):**
- *1-tile corridors (defence/space) vs 2+ (flow/maintenance)*: both are right in their own objective. This engine has no raid pathing cost, so the defence argument has no referent and the flow argument is binding → ≥ 2, primary ≥ 4 (§12.2).
- *Many small rooms (score) vs few large ones (efficiency)*: score functions decide in RimWorld; here, capacity and adjacency do. The resolution is the module (§20.4), not either extreme.
- *Open plan (cheap, bright) vs cellular (private, legible)*: hotel program forces cellular for Z2/Z3 and open for Z0/Z1 (§9, §16).
- *Min-max grid vs realistic facade/plan*: the honest answer from the showcase community is that realism has a *review* payoff and no *mechanical* one — which is exactly this KB's §22.2 position: buy realism where it buys legibility, zoning purity or module discipline; otherwise take the efficient layout and say so.

**The methodological finding (the one the design agent must keep).** Community conventions are mechanised observations about a *specific* scoring function. RimWorld's players are right about RimWorld; PA's about PA. The transferable part is not the tip but the **procedure behind it**: find the number the game scores, then shape the plan around it. §2 is that procedure

**Evidence note for §7** - the consensus items are **[searched]** forum, guide and blog sources: CONFIDENCE MEDIUM individually, HIGH where independent sources agree (doorway clearance, distributed dining, zones before rooms). Video sources are listed in §28 as evidence that the discourse exists; no rule in this document rests on them.
's output for this project, and §26 is its test battery.

# 8. Adjacency framework

## 8.1 The five classes, defined by what satisfies them

A class is only useful if a builder can tell whether it is satisfied. On a 0.5 m tile grid with graph distances (§2.3), the operational definitions are:

| Class | Satisfied when | Never satisfied by |
| --- | --- | --- |
| **MUST BE ADJACENT** | The two spaces share a wall line with a **direct door** between them, and no third space lies between; path distance ≤ ~4 tiles. | Corridor-mediated access (that is SHOULD BE NEAR at best). |
| **SHOULD BE NEAR** | Path distance ≤ 8-12 tiles, one door each, no crossing of a zone boundary of two or more steps down the gradient (§9.2). | Straight-line proximity through a wall — the graph is the truth. |
| **NEUTRAL** | Anywhere. Free variable; use these pairs to absorb leftover tiles. | — |
| **SHOULD BE SEPARATED** | Path distance ≥ 16 tiles **or** a buffer space between them; no shared wall with a door; no visual line from one to the other. | A door placed at the far end of a long shared wall still reads as adjacent to an NPC and to a reviewer. |
| **MUST BE SEPARATED** | Buffer *room* between them, or different floor, or separate entrance; no route exists that passes through one to reach the other. | Distance on the same floor with a shared corridor. |

**RULE** Adjacency is a property of the **door graph**, and separation is a property of the **wall + buffer**. A pair can be graph-adjacent and architecturally separated (a sound-locked pass hatch), or geometrically touching and functionally separated (a shared wall with no opening). Say which one you mean.
**REASON** Both real planning and grid games evaluate via the passage graph; this engine literally derives rooms and paths that way (`engine/npc/rooms.ts`, `pathfinding.ts`). **CONFIDENCE: HIGH**

## 8.2 Hotel adjacency matrix (the deliverable for the priority type)

Space names use this project's tags/assets (§2.7). Codes from §4.3. `→` direction matters when one side is the noisy/dirty/service partner.

### 8.2.1 Arrival and front of house

| Pair | Class | Reason | Notes |
| --- | --- | --- | --- |
| street entrance ↔ vestibule | MUST ADJACENT | PEP,_thr (draught), PRIV threshold | the vestibule is two door sets with clear floor between (`harness/state/context.md:28`) |
| vestibule ↔ lobby | MUST ADJACENT | PEP | the arrival reveal: the first sightline of the building |
| lobby ↔ reception desk (`front-desk`) | MUST ADJACENT, on the arrival axis | SUP, PEP, PRIV | guests queue *in* the lobby, not in the corridor to the lifts; desk needs 4 × ~1 tile of queue frontage (§2.4) |
| lobby ↔ concierge / bell desk (`front-desk`) | SHOULD NEAR | PEP, MAT (luggage) | within sight of the entrance |
| lobby ↔ lounge / café (`lounge`, `dining`) | SHOULD NEAR | PEP, DAY | visible from the entrance = the lobby sells the hotel |
| lobby ↔ guest lift hall | MUST ADJACENT (visible from the lobby) | PEP, SEC, WAY | guests must find the core without asking; do not route the lift hall through the restaurant |
| lobby ↔ retail/shop (`retail`) | SHOULD NEAR the entrance | PEP, SEC | non-guest income should not require crossing the hotel |
| lobby ↔ security/lobby post (`front-desk`, `portal`) | SHOULD NEAR | SUP | the post sees both desk and lift hall |
| luggage store ↔ vestibule | SHOULD NEAR | MAT | bags must not cross the lobby in a line |

### 8.2.2 Guest rooms and the floor

| Pair | Class | Reason | Notes |
| --- | --- | --- | --- |
| lift hall ↔ guest corridor | MUST ADJACENT | PEP | every floor, same tiles (§13.4) |
| guest corridor ↔ guest room | MUST ADJACENT (direct door, no intermediate space) | WF, PRIV | double-loaded if the corridor ≥ 4 tiles; single-loaded below that |
| room entry ↔ bathroom entry | SHOULD BE *not* direct | PRIV, NOI | the generator's 1-column in-room aisle keeps the bathroom door off the corridor line (`generate-hotel.mjs:315-322`) |
| bed ↔ bathroom | SHOULD SEPARATE (part of a buffer room) | NOI, PRIV | the bathroom is the acoustic buffer for the door |
| wardrobe / minibar / TV ↔ circulation | MUST ADJACENT to the wall they occupy, MUST NOT block the door swing | MAINT | a 1-tile wall with furniture against it is the whole storage strategy |
| guest room ↔ guest room (party wall) | MUST BE ADJACENT (that is the point) | STRUC, cost | repeat the module; the party wall is the shared structure |
| guest room ↔ exterior (window) | MUST ADJACENT for ≥ 1 habitable side | DAY | 13 rows deep is the limit; beyond that the room needs a light well (§7.2) |
| rooms of different rate tiers | NEUTRAL | — | tier by floor/orientation, not by scattering |

### 8.2.3 Food and beverage, and the service spine

| Pair | Class | Reason | Notes |
| --- | --- | --- | --- |
| delivery/service entrance ↔ dry store | MUST ADJACENT | MAT | goods enter once and are stored once |
| dry store ↔ kitchen (`cooking`) | MUST ADJACENT | MAT, WF | |
| cold store ↔ kitchen | MUST ADJACENT | MAT, HYG | |
| kitchen ↔ servery / pass (`pass-window`) ↔ restaurant (`dining`) | MUST ADJACENT (a chain) | MAT, WF, THR | the pass is a *room boundary with a hole in it*; the distance a plate travels is the KPI |
| kitchen ↔ dish return ↔ soiled service route | MUST ADJACENT, on the clean/dirty split | HYG | clean in, soiled out, never the same door |
| kitchen ↔ staff entrance/staff room | SHOULD NEAR | WF | staff do not cross the lobby in service hours |
| kitchen ↔ waste room | MUST SEPARATE from any guest route; MUST BE ADJACENT to the service exit | SMEL, HYG | waste is the one flow that must leave without meeting a guest |
| kitchen ↔ bar | SHOULD NEAR | MAT, WF | bar stock comes from the same cold store |
| restaurant/banquet ↔ pre-function/lobby | SHOULD NEAR | PEP | conference/banquet business |
| kitchen ↔ guest lift hall | SHOULD SEPARATE | SMEL, NOI, SEC | never share the guest spine |
| exhaust/air intake (kitchen) ↔ any window/openable of an occupied room | MUST SEPARATE (≥ real separation; grid form: opposite façade or on the roof level) | SMEL, THR | |

### 8.2.4 Housekeeping, laundry and BOH

| Pair | Class | Reason | Notes |
| --- | --- | --- | --- |
| service lift ↔ BOH corridor ↔ housekeeping room (`housekeeping`) | MUST BE ADJACENT (chain) | WF, MAT | the cart is loaded at the lift and never pushed down a guest corridor |
| housekeeping ↔ linen store ↔ soiled linen | MUST BE ADJACENT, clean and soiled physically split | HYG, WF | clean/soiled must not share a shelf line; use the opposite wall |
| housekeeping ↔ guest corridor | SHOULD BE NEAR | WF | the floor is her beat; keep it ≤ 12 tiles |
| laundry (`laundry`) ↔ soiled linen intake ↔ clean linen issue | MUST BE ADJACENT, in that order | WF, HYG | a linear flow, not a scatter of machines |
| laundry ↔ plant/water | SHOULD BE NEAR | MAINT | machines want the riser |
| staff room / lockers / uniform desk ↔ staff entrance | MUST BE ADJACENT chain | WF, PRIV | staff changing must not happen in a guest zone |
| BOH corridor ↔ guest corridor | MUST BE SEPARATED (different routes; crossings only at a shared door the guest never uses) | PRIV, SEC | in this engine the *tag* does the enforcing (`back-of-house`, §2.4) — build the geometry anyway |
| staff room ↔ kitchen | SHOULD BE NEAR | WF | staff meals |

### 8.2.5 Spa, pool, gym, business

| Pair | Class | Reason | Notes |
| --- | --- | --- | --- |
| changing/wet area ↔ pool / spa (`wellness`, `pool`) | MUST BE ADJACENT | HYG, PRIV | bare feet, wet floor: no dry route can bypass the wet zone |
| pool ↔ towel cabinet | SHOULD BE NEAR | WF | |
| spa treatment rooms ↔ quiet zone | MUST BE SEPARATED from the pool and the plant | NOI, PRIV | `treatment` tag; the privacy class is `private` in the engine (`schema/rooms.ts:12`) |
| gym ↔ pool | SHOULD BE NEAR | PEP | they share supervision and towels |
| pool / gym ↔ guest lift hall (same floor) | SHOULD BE NEAR | PEP | the facilities floor should be reachable without crossing a restaurant |
| business/meeting ↔ lobby or lift hall | SHOULD BE NEAR | PEP | external visitors must find it without entering the guest corridor |
| meeting room ↔ ballroom/café | SHOULD NEAR | MAT (AV cart), WF | |
| plant (`mechanical`) ↔ spa/pool | SHOULD BE NEAR (heat demand) but MUST BE SEPARATED acoustically | THR, NOI, MAINT | pool plant is the highest-load, noisiest service in a hotel |

### 8.2.6 Vertical and structural adjacencies

| Pair | Class | Reason | Notes |
| --- | --- | --- | --- |
| guest lift hall (each floor) ↔ `portal` car cells | MUST BE ADJACENT | PEP | see §13 |
| guest lift hall ↔ service lift | SHOULD BE ADJACENT but behind separate doors | WF, PRIV | shared shaft savings, separate lobbies |
| bathroom stack ↔ kitchen/wet stack ↔ risers | MUST BE ADJACENT vertically | STRUC, HYG, cost | the stacking rule; the generator's `RISER_W/E` sit inside the core wall line (`generate-hotel.mjs:45-46`) |
| plant rooms ↔ the space they serve | SHOULD BE NEAR vertically (same or adjacent floor) | THR, MAINT | |
| refuse/machine room ↔ the service yard/street | MUST BE ADJACENT | MAT | |
| stairs ↔ core | MUST BE ADJACENT | FIRE | the engine has no stair pathing (§2.4); they exist for the egress *check* and for realism (§13.6) |

## 8.3 Separation register (MUST/SHOULD SEPARATE, with the buffer that buys it)

| Pair | Class | Buffer that solves it on a compact grid |
| --- | --- | --- |
| kitchen ↔ guest bedrooms (same floor) | MUST SEPARATE | full-height wall line + corridor + the service lift; better: different floor |
| waste/soiled store ↔ food store | MUST SEPARATE | opposite corners of the BOH, different doors |
| staff corridor ↔ guest corridor | MUST SEPARATE | separate spine + one shared crossing door, `back-of-house` tagged |
| bathroom/soil stack ↔ food prep | MUST SEPARATE | riser closet between them |
| noisy plant ↔ any occupied room | MUST SEPARATE | store/riser/corridor buffer + not sharing a wall |
| gym/pool ↔ guest bedrooms | SHOULD SEPARATE | different floor or a buffer zone of circulation |
| bar/lounge ↔ meeting room | SHOULD SEPARATE | pre-function space between |
| reception queue ↔ lounge seating | SHOULD SEPARATE (visual) | a planter/`signage`/level change (not available: no level change in this engine) |
| any private room door ↔ lobby sightline | SHOULD SEPARATE | the wall that the corridor turns behind |
| openable/window of an occupied room ↔ exhaust intake | MUST SEPARATE | roof level or opposite façade (vertical separation is expressible: different floor) |

## 8.4 Adjacency signatures of the other building types (comparison)

- **Hospital** — the pair structure is *clean/sterile ↔ patient ↔ staff ↔ waste ↔ logistics* with strong directionality: CSSD touches every theatre, the morgue and the mortuary van have their own route, and the "plumbing wall" stacks wet rooms. Transferable rule: when a workflow is one-directional, build it as a **chain of MUST-BE-ADJACENT links**, not as a cluster (this is the same shape as delivery → store → kitchen → pass → servery).
- **Prison** — population separation (prisoner / staff / visitor / supply) is achieved by *zones with controlled crossings*, not by distance. Transferable rule: a small number of **engineered crossings** with a control point beats many minor ones (§10.5, §23 case study).
- **Office** — the core-to-façade depth drives everything: deep floors need a daylit perimeter ring and a dark inner band for meeting rooms, printing, and services. Transferable rule: **depth budget** per floor, then subdivide.
- **Industrial/factory** — a *material line* with in-feed and out-feed at opposite ends and everything else subordinate; column grid rigidity is the dominant constraint. Transferable rule: linear flow beats adjacency clusters.
- **Restaurant** — the whole design is a single chain: door → host → table → servery → kitchen → dish → waste. Where the chain loops back on itself, it fails.
- **School/retail** — supervision (sightlines) and dead-end control dominate; retail wants a **forced-movement** loop past the merchandise.

## 8.5 Resolving adjacency conflicts

1. A **separation** always beats an adjacency when the separation reason is `HYG`, `FIRE`, `SEC` or `PRIV`; those are non-negotiable in real codes and in the game's readability.
2. When two MUST-BE-ADJACENT chains compete for one doorway, split the chain with a *shared buffer* (the servery and the bar sharing one cold-store is legitimate; the pass sharing a door with the guest corridor is not).
3. When a pair cannot be near (structure/daylight forces it), pay the cost in *staff steps*: shorten the trip by giving the far room a satellite store instead.
4. Record the resolution: `DECISION: <pair> not adjacent → REASON: <constraint> → EVIDENCE: <§-ref> → TRADE-OFF: <extra tiles/steps accepted>`.

# 9. Zoning framework

## 9.1 The gradient

Eight levels of privacy/restriction, each defined by *who may be there without being challenged*, plus this project's tag/role mapping:

| Level | Name | Who is legitimately there | Project vocabulary (tags / room types / roles) |
| --- | --- | --- | --- |
| Z0 | **PUBLIC** | anyone off the street | `retail`, `dining`, `lounge`, `front-desk`, lobby type |
| Z1 | **SEMI-PUBLIC** | any registered guest + their guest, unescorted | `pool`, `wellness`, `fitness`, `meeting`, guest corridor near the lift hall |
| Z2 | **SEMI-PRIVATE** | a guest with a key, plus staff on duty | `living` (guest room), `treatment` |
| Z3 | **PRIVATE** | one household/one occupant | `bedroom`/`bathroom`/`spa` types are `privacy: 'private'` in `schema/rooms.ts:10-12` |
| Z4 | **STAFF** | on-duty staff, any staff | `staff`, `housekeeping`, `laundry`, staff room type |
| Z5 | **SERVICE** | staff on a task, plus contractors | `back-of-house`, `cooking`, `storage`, service corridor |
| Z6 | **UTILITY** | maintenance only, escorted | `mechanical`, `structure` (plant, risers, tanks, fire pump) |
| Z7 | **RESTRICTED / SECURITY** | named individuals, controlled | `portal` control points, BMS `control-panel`, cash/valuable store, `restrictedTags` of `role-guest` |

**RULE** A zone is defined by its *access rule*, not by its finish or its furniture. Two identical-looking corridors are different zones if one is staff-only.
**SOURCE** The gradient is the standard privacy/restriction scale of programming practice (public/private/service zoning in every building-typology text; the security-zone ladder in correctional design). Project mapping is code-verified (`schema/rooms.ts`, `blueprint-data.json` roles). **CONFIDENCE: HIGH**

## 9.2 Transition rules

1. **Steps, not jumps.** A route should not go Z0 → Z5 in one door. Insert a threshold (vestibule, pre-function, buffer corridor, reception desk you must pass). Each missing step is one guest who can walk into the kitchen.
2. **Thresholds are where the control lives.** The door between level N and level N+1 is the place for a `signage`, a post, a `control-panel`, or (in this engine) the tag boundary. A zone boundary you cannot perceive is not a boundary.
3. **Buffers absorb transitions.** Z2-Z3 (private) next to Z4-Z5 (staff) is the classic collision; a store, riser or short corridor between them buys the acoustic and visual separation (§4.4.6, §8.3).
4. **One population must never cross another's core space.** Crossing a Z0 lobby through a Z5 corridor is a design error even if the distance is short.
5. **Zone size discipline.** A zone should be contiguous and should have one edge on the circulation it needs. A non-contiguous zone (guest rooms split by a service band) doubles its circulation cost and halves its legibility.
6. **Per-floor zoning is normal; per-floor *mixed* zoning is the exception.** A floor with Z0 + Z5 (a restaurant with an open kitchen) is legitimate when the seam is engineered; a floor with three unrelated zones is a plan that has not been decided.

**GRID APPLICATION** Write the zone map *before* the room map: paint zone polygons over the tile grid (a floor's Z0 band at the entrance end, Z1 the amenity band, Z5 the core/service band, Z6 the plant band), then place rooms strictly inside their zone polygon and check that every room's door opens onto circulation of its own zone or one step up.

## 9.3 Zone adjacency matrix (which bands may share a wall)

Rows/cols are the levels above. `Y` may share a wall · `T` may touch only through a threshold/buffer room · `N` may not share a wall.

| | Z0 | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Z0** | Y | Y | T | N | T | N | N | T |
| **Z1** | | Y | Y | T | T | T | N | T |
| **Z2** | | | Y | Y | T | T | N | N |
| **Z3** | | | | Y | N | N | N | N |
| **Z4** | | | | | Y | Y | T | T |
| **Z5** | | | | | | Y | Y | T |
| **Z6** | | | | | | | Y | Y |
| **Z7** | | | | | | | | Y |

The asymmetries are the point: Z3 (a guest's bedroom) may not share a wall with Z4/Z5 because staff traffic and service noise are the two things a guest complains about; Z0 may touch Z4 only through a threshold because a staff door that opens into the lobby is how the back of house becomes visible.

## 9.4 Vertical zoning (which levels own which zone)

**RULE** In a hotel, the public zones sit at the bottom and the top; the private zones fill the middle; the service zones hug the ground and the roof plant.
**REAL-WORLD** Arrival, lobby, F&B, meetings and retail at grade (street access, emergency egress, delivery); guest rooms in the middle (quiet, daylight, view); spa/pool either at grade with the garden or on the roof (structural + drainage + exhaust cost); plant on the roof or the basement (stack effect, exhaust, water tanks); BOH at grade behind the service line, plus a satellite per guest floor.
**GRID APPLICATION** Floor-ordering rule the design agent should apply: `G = Z0+Z5 (arrival + the whole BOH spine)`, `typical = Z1+Z2 (guest bands) + a Z4 satellite (housekeeping) at the core`, `top = Z1 (pool/spa/gym) + Z6 (plant)`. The reason is not tradition but three mechanics: (1) the portal is the only vertical link, so everything with high volume must be within a short hop of a lift hall; (2) cross-floor moves are gated by `crossFloorChance` + a 30 s cooldown (§2.4), so a floor whose guests must visit two other floors for basic needs will feel broken; (3) plant and wet rooms want the same tiles on every floor (§13.5), so amenity floors are the ones that carry the extra service mass.
**CONFIDENCE: HIGH** (principle), MEDIUM (the specific ordering is a strong convention, not a law — podium/parking towers and resort horizontal plans invert it deliberately).

## 9.5 Zoning failure modes

- **The leaky boundary:** a service door that opens into the lobby. Fix: move the door to the spine, or add a threshold room.
- **The sandwich:** private rooms between public and service (both complaints at once). Fix: swap with a neutral/storage band.
- **The archipelago:** a zone in three disconnected patches; each patch needs its own circulation. Fix: re-run §9.2 rule 5 and pay a longer corridor instead.
- **The borrowed perimeter:** Z5/Z6 rooms given the best façade because they were the easiest to place. Fix: §16's daylight band — services take the interior or the worst face.
- **The single-point zone:** one floor that is the whole BOH for a 21-floor tower becomes the bottleneck; satellite stores fix it (§25.4).

# 10. Circulation framework

## 10.1 The five systems

| System | Who / what | Function | Grid signature |
| --- | --- | --- | --- |
| **Primary** | guests/customers, main flows | arrival → spine → core → floor spine | the widest, most legible run: ≥ 4 tiles, straight, on the parti axis |
| **Secondary** | room access | branches from the primary | 2-3 tiles, one door per room, no dead ends longer than ~6 tiles |
| **Tertiary** | inside a space | movement around furniture in a room | 1-2 tiles of clear aisle; the room's real cost is here (§12.2) |
| **Service** | staff, goods, linen, waste, deliveries | the parallel network that never needs the primary | own spine, own lift, own door to grade |
| **Emergency** | evacuation, responders | two independent ways out, shortest to grade | must not pass through a locked/controlled point that the fire plan unlocks |

**RULE** Design all five and draw them as separate diagrams before the plan. A plan with only one circulation diagram is a plan with one system and four accidents.
**EVIDENCE** Every planning text separates these systems; correctional and healthcare guidelines make the separation explicit (staff/prisoner/visitor/supply; patient/staff/clean/dirty). This project's own vocabulary has the pieces (`harness/state/context.md:29-30` FOH/BOH and service corridor). **CONFIDENCE: HIGH**

## 10.2 What a route costs on this grid (mechanics, not vibes)

Cost = tile-steps on the walkable graph: cardinal 1, diagonal √2 and only where both corner tiles are open (§2.3). Consequences a designer must use numerically:

- A **1-tile corridor** costs `L` for `L × 0.5 m` and admits exactly one agent: two agents going opposite ways must wait or reverse (the observed "stuck NPC" case). **Never place a MUST-BE-ADJACENT pair on a 1-tile run with any real traffic.**
- A **2-tile corridor** costs about `0.71 × L` for a diagonal zig-zag and lets two agents pass. It is the minimum honest service corridor width.
- A **4-tile spine** (the current guest spine, `CORR` = 4 rows) costs the same per tile but reads as generous, allows a cart to stand aside, and stops the corridor becoming the bottleneck when a room door is open into it.
- **Crossing an open room is the cheapest route of all** (diagonals legal), which is why hotel lobbies/great rooms work as circulation — and why using guest-room areas as shortcuts destroys privacy (§22 C-1).
- **Every door is a decision point but not a cost** (door tiles are walkable). Doors cost *attention* (wayfinding) and *conflict* (two flows meeting), not distance.
- **Long open halls are search-fragile:** the A\* iteration cap (§2.3) means a huge undifferentiated walkable area with a distant goal is the case most likely to return no path. Partitions and doors actually *help* the solver by narrowing the frontier. This is a rare GAME-SPECIFIC argument that happens to agree with a REAL-WORLD one (a legible hierarchy is easier to traverse).

**Design targets** (tiles of graph distance; each = 0.5 m): guest room door → lift hall ≤ 24 tiles (12 m); lift hall → reception ≤ 20 tiles on G; reception → any F&B servery ≤ 30 tiles; kitchen pass → farthest table ≤ 20 tiles; delivery door → dry store ≤ 10 tiles; housekeeping cart stand → farthest room door ≤ 24 tiles; any interact spot → an exit without a turn back ≤ 40 tiles. These are stated as *budgets to test*, not as code numbers; where a real guideline exists (egress travel distance, hotel corridor length limits) it is in §12.7 and §28.

## 10.3 Hierarchy rules

1. **Width follows level:** primary ≥ 4 tiles, secondary 2-3, tertiary 1-2 minimum, service 2-3 (3 where a cart must pass a person), emergency ≥ the primary width and never narrower than 3 tiles on a guest floor.
2. **The primary should be continuous and legible from the entrance**: a straight axis you can see down. In this engine that is literally "a run of walkable tiles with no blocked cell".
3. **A branch serves, it does not wander.** A secondary with more than 2 bends in 10 tiles is a sign the zoning is wrong.
4. **Never route the primary through a room's tertiary.** A guest walking through a lounge to reach the lift is a design error unless the lounge *is* the pre-function (then size it for it, §12.3).
5. **Do not optimise hierarchy away to save tiles** (§29.2 stage 12). A 1-tile shortcut everywhere has a real cost in this engine: passing conflicts (§10.2) and unreadable space (§18.5).

## 10.4 Where systems interact

| Interaction | Verdict | Device |
| --- | --- | --- |
| Service spine crosses guest spine | Acceptable **once**, engineered | a door the guest does not need + a buffered corner; `back-of-house` tag keeps guests from targeting beyond it |
| Service flow runs the guest corridor | **Fail** | build the parallel route even if it is longer |
| Emergency route passes through the lobby | Normal | the lobby must be wide enough to be both |
| Delivery flow crosses the arrival forecourt at peak | Fail at rush hour | separate the grade openings — the existing plan does exactly this: two openings only, street at row 8 cols 36-37, service at col 8 rows 26-27 (`generate-hotel.mjs:55`) |
| Waste flow shares the food route | **Never** | opposite corners / opposite doors |
| Two room doors opening into the same 2-tile corridor face-to-face | Congestion | stagger doors by ≥ 2 tiles, or widen at the pair |
| Queue forming in front of a fixture on the primary | Blocks everyone | give every high-capacity fixture its own **queue pocket** off the spine |
| Two primary routes meeting at one door | Choke | duplicate the door; a 4-tile opening is 2 halves of 2 tiles (§2.2) |

## 10.5 Choice points and crossing discipline

Every point where a route splits is where a person decides; a plan is judged by how few of those it needs and how obvious each one is. Rules: keep decision density low on the primary (few doors visible down a spine), make each decision point *visibly* different (a `signage` asset, a wider bay, a change in daylight), and never let an emergency route require an unmarked choice (§10.7). The measurable version (integration, depth, choice) is §19.

## 10.6 Spawn zones are circulation inputs

**RULE** A spawn zone is not decoration; it is where a population *appears*, and appearance points are trip origins. A guest zone in the middle of a corridor sends every arriving agent walking in both directions; a chef zone inside the kitchen is a "start of shift" that generates no useless travel.
**EVIDENCE / GRID APPLICATION** `NpcSpawnZone` is a role-filtered rect per floor (`schema/objects.ts:87-127`), and the existing floor places the guest zone *on the guest corridor* (`zoneOf('f14-z-guest', 'Guest corridor', rect(24,30,25,46), ['role-guest'])`, `generate-hotel.mjs:466`). Design procedure: for each role, ask "what is this population's first and last trip per cycle", and put the zone at the *meeting* of those, adjacent to the primary. Verify each spawn zone is itself walkable and one step from the primary — an unreachable zone is a floor with invisible staff shortages.
**CONFIDENCE: HIGH** (data-verified placement; the trip-origin reasoning is standard flow analysis).

## 10.7 Emergency circulation

**RULE** Two independent ways out of every occupied zone; the second must not require passing through the first; routes stay ≥ 3 tiles; dead ends are avoided, and where they exist they are short and unoccupied.
**EVIDENCE** Code family: exit-count and travel-distance rules keyed on occupancy and dead-end limits (ADA/IBC-style and national equivalents; the exact numbers depend on jurisdiction and are pinned in §28 by pass A). The generator's own validator already treats a corridor that fails to reach the second stair as a **hard failure**: `if (g[23][67] !== 'door' && g[24][67] !== 'door') fail(label, 'egress', 'corridor does not reach stair 2')` (`generate-hotel.mjs:831`).
**REAL-WORLD APPLICATION** Progressive horizontal evacuation in healthcare; place of relative refuge; smoke-stop doors.
**GRID APPLICATION** Since the portal is the only vertical link and there is no stair pathing (§2.4), the honest emergency model here is: **each floor must have ≥ 2 independent route groups reaching ≥ 2 separate portal/hall cells** (two lift halls, or a lift hall and a secondary hall reachable only by a different run), and the second must be open when the first is congested. Place `stair-flight` assets at both as the visual claim of egress, keep their doors off the corridor ends (as `STAIR_DOOR` rows 23-24 do), and never let one plan-line serve both exits.
**CONFIDENCE: HIGH** for the principle and for the code evidence; MEDIUM for the claim that two portals are "required" (this engine enforces nothing — it is a realism + resilience rule, not a mechanic).

## 10.8 Throughput arithmetic (the test the design agent runs)

For every interaction point: `demand/hour` (from role populations and schedules) → `required capacity = demand × mean_service_seconds / 3600`, then `utilization = required / actual capacity` where actual capacity = the fixture's `interact.capacity` (§2.4/§2.7). Design limits: ≤ 0.7 normal, ≤ 0.9 at peak, **never** > 1.0 for a repeated flow. When utilisation fails, the fix list is ordered: (1) more spots on the existing fixture, (2) a second fixture of the same kind, (3) a queue pocket, (4) move the fixture nearer the origin population, (5) reduce the demand by splitting the schedule. Adding corridor width is *last* — width does not create capacity. Worked numbers in §26.3. **And when capacity still fails, stagger the schedule before widening anything**: PA's tiered meal slots show that a population released all at once needs either duplicate facilities or a split timetable, and the timetable is cheaper (§6.3, §13.2).

# 11. Front-of-house / back-of-house (the service-flow framework)

## 11.1 The two networks

**RULE** A hospitality building has two circulation networks, and the quality of the first is bought by hiding the second. Every service route must exist as a complete graph (entry → storage → production → distribution → collection → disposal) without borrowing a guest space, or the building works only while nobody is busy.
**EVIDENCE** Hotel design guides treat BOH as a distinct design object (service entrance, service lobby, BOH corridor, service lifts, housekeeping floors); the project glossary already names it — "Front of house / back of house | Guest areas … vs staff areas (kitchen, storage, laundry, staff room) reached by a service corridor" and "Service corridor | The staff spine from the service door to the BOH rooms; guests never use it" (`harness/state/context.md:29-30`).
**SOURCE** This repo's glossary + hotel BOH practice in pass A (§28). **CONFIDENCE: HIGH**

## 11.2 The seven service flows, as grid routes

Each is a *directed* chain. Design them in this order — the chains generate the room list, not the other way round.

| # | Flow | Chain (each link is a MUST-BE-ADJACENT hop) | Grid cost, and where it breaks |
| --- | --- | --- | --- |
| F1 | **Delivery → store** | service door → receiving/holding → dry store / cold store | ~10-14 tiles; breaks when the store is on the far side of the kitchen so goods cross the production room |
| F2 | **Prepare → serve** | store → prep (`kitchen-table-1`) → cook (`table-stove`) → pass (`pass-window`) → servery (`cafe-counter`/`bar-counter`) → table | the plate distance; breaks at the pass — a 4-tile pass into a 2-tile corridor is a queue inside a working kitchen |
| F3 | **Soiled return** | table → dish return (`dish-return`) → wash (`kitchen-sink`) → store | must be a *loop*, not a reversal; breaks when clean and soiled share a door |
| F4 | **Linen, clean and soiled** | room → soiled collection (`soiled-linen`) → laundry (`washer-1`,`dryer`) → pressing (`ironing-table`) → clean issue (`linen-shelf`) → floor/room | the classic hotel failure: linen routed down the guest corridor. Grid form: two shelved ends of one BOH room, never adjacent |
| F5 | **Waste** | waste room (`waste-room`) → service route → service exit | shortest possible, and never through F2; on this grid a 1×1 m `waste-room` asset is a fixture, so the *room* needs a wall line + own door |
| F6 | **Staff** | staff entrance → locker/uniform (`staff-locker`,`uniform-desk`) → staff room → their work rooms | staff arriving through the lobby is the most common realism failure in game hotels |
| F7 | **Maintenance / plant round** | control point (`control-panel`) → risers (`riser-closet`) → plant (`ahu`,`chiller`,`water-tank`,`fire-pump`) → the fault | needs a reachable clear tile *at* each fixture — plant with no maintenance clearance is unreadable and, in this engine, unreachable (its spots must be on walkable tiles) |

## 11.3 The service spine pattern

**RULE** Put the whole BOH on one spine, 3 tiles (1.5 m) minimum, 4 tiles where a cart is turned, running from the service door to the service lift, with every service room opening onto it and no guest room opening onto it.
**GRID APPLICATION** The spine is a parallel run to the guest spine, usually behind the core band, sharing at most one engineered crossing (§10.4). Room order along it follows flow order F1→F7, because that is also the order of daily traffic. Service lift = a second `portal` cell on the same or an adjacent column, sized 2×2 tiles minimum plus its own hall; the existing module has the service car `SV1` in the same bank as the guest cars (`generate-hotel.mjs:51`) which is the *shaft-efficient, lobby-shared* variant — legitimate when the doors are separated, weak when a trolley queues in front of a guest car.
**EXCEPTIONS** Small properties (< ~15 keys/floor) may share one corridor with time separation (night audit + housekeeping before arrivals); say so in the program rather than pretending the geometry is separate.

## 11.4 Clean / dirty discipline

**RULE** Wherever a flow has a clean end and a dirty end, the two ends get different doors, different wall lines, and — if the space is small — different *times* recorded in the program. This is a hygiene rule (food, linen, waste, clinical), not a tidiness preference.
**REAL-WORLD APPLICATION** Kitchen clean goods in / waste out; laundry clean issue / soiled intake; a sick-room's linen; a pool's chemical store away from the towel store.
**GRID APPLICATION** Two openings on opposite walls of the BOH room; `soiled-linen` and `linen-shelf` never on the same wall run; the waste route exits by the door that no guest flow touches (`GRADE_OPENINGS` has exactly one such opening, `generate-hotel.mjs:55`).

## 11.5 How this engine enforces separation — and what geometry still has to do

**RULE** Mechanically, a guest does not enter a BOH space because the space's fixtures carry a tag in the role's `restrictedTags` (`role-guest` restricts `back-of-house`, `mechanical`; `blueprint-data.json:11058-11061`) and the NPC only *targets* allowed tags. There is no locked door in the path graph.
**CONSEQUENCE (important)** A beautiful separate service corridor that is not *tagged* is decoration; a tagged BOH room that is on the guest corridor is technically respected by the sim but reads as broken to a human reviewer and will fail the realism test. Do both: geometry **and** tags. Conversely, if the design agent adds a staff-only door, it must also add the tag — otherwise the guest will walk through it and the "separation" will silently leak.
**CONFIDENCE: HIGH** (code-verified).

## 11.6 BOH sizing (how much of the gross the back of house eats)

Working rule from hotel practice, to be confirmed against pass A figures (§28): BOH + back-of-house circulation is ~20-30 % of gross floor area in a full-service hotel; kitchen ≈ 15-25 % of the F&B area it serves; housekeeping/linen per guest floor ≈ 4-8 m² satellite; staff amenities ≈ 1-1.5 m² per on-shift staff member.

| BOH room | Grid size to plan | Notes |
| --- | --- | --- |
| Receiving / holding | 4 × 5 tiles (2.0 × 2.5 m) + 1 cart bay | at the service door, never in the lobby |
| Dry store | 5 × 6 tiles, `dry-store-shelf` 4 × 1 on the long wall | shelf front needs 1.2 m of standing → 2-3 tiles |
| Cold store | 4 × 5 tiles, `cold-store` 1.5 × 1 m + aisle | near both receiving and the kitchen |
| Kitchen line | 1 station per 20-25 restaurant covers, each station 2 tiles wide + 2-3 tiles of worker aisle | `kitchen-table-1`/`table-stove`/`kitchen-sink` are 1-2 tiles each |
| Pass | 2 m of pass per 30-40 covers (`pass-window` is 2 m) | with 3-4 tiles of clear servery in front |
| Dishwash/scullery | 5 × 6 tiles behind the pass, own door to the soiled route | |
| Laundry (central) | 8 × 10 tiles: 2 machines + pressing + both linen ends | per-floor satellite: 4 × 5 tiles |
| Housekeeping satellite per guest floor | 3 × 4 tiles with `linen-shelf` + `soiled-linen` on opposite walls + cart bay | this is the room most game hotels forget |
| Waste / refuse | 3 × 3 tiles with its own door to the service exit | |
| Staff room + lockers | 1 m² per on-shift staff for the room, 0.5 m per `staff-locker` tile-run | |
| Plant | see §15.4 — sizes come from the assets (`chiller` 4.0 × 2.5 m, `ahu` 3.0 × 2.0 m, `water-tank` 2.0 × 2.0 m, `fire-pump` 1.5 × 1.0 m) **+ 1 tile of maintenance clearance on the access side** |

**RULE** Every plant asset has `spots 1` with a real interaction: if the tile in front of it is not walkable, the engineer cannot do the plant round, and the room is functionally sealed. Leave the clearance.
**EVIDENCE / SOURCE** `blueprint-data.json` plant rows (§2.7) + `task-plant` posting on `ahu` (`resolveInteractForTarget` needs a standable spot). **CONFIDENCE: HIGH**

# 12. Human-scale framework

## 12.1 Body first, metric second, tile last

Real human dimensions that drive layout, and what they become on a 0.5 m grid with a 1-tile agent body:

| Human fact | Metric | Tiles | Design consequence |
| --- | --- | --- | --- |
| Shoulder width, single person | 0.45-0.55 m | ~1 | one tile is one person; a 1-tile corridor is single file *by definition* |
| Two people passing | 1.1-1.2 m | 2-3 | 2 tiles is the first true passing width, 3 is generous |
| Person + luggage trolley / housekeeping cart | 1.2-1.5 m | 3 | service spine width floor |
| Person turning with a load | 1.5 m | 3 | corner bays in BOH |
| Wheelchair turning circle | 1.50 m | 3 (1.5 m) | an accessible room needs a 3-tile clear circle somewhere |
| Seated at a table, elbow room | 0.6-0.75 m width per diner | 1-2 | seat counts = fixture spots, not table area |
| Knee space at a desk | 0.7 m deep | 2 (1.0 m) | `desk-guest` is 4 × 2 tiles = 2.0 × 1.0 m ✓ |
| Bed + walk-around | 0.6 m both sides, 0.9 m on the window side | 2 / 2 | a king (2.0 × 2.0 m) plus two 1.0 m aisles = 4.0 m of room width |
| Wardrobe opening | 0.6 m in front | 2 | `wardrobe` is 0.5 m deep → its door needs 2 tiles of aisle |
| Reach height / hanging | 1.2-1.8 m | n/a | the grid has no height, so vertical reach is invisible here — do not model it (§2.5) |
| Queue standing area per person | 0.35-0.5 m of run, 0.6 m wide | 1 tile per person | a 40-person arrival queue is 20 m of frontage |
| Crowding comfort | < 0.4 m²/pers = crush; 1-2 m²/pers in a lounge; 4-8 m²/pers dining | 1.6-8 tiles/pers | occupancy of a room = tiles ÷ this, then × 0.25 |

**SOURCE** Dimensioned from accessibility standards (ADA §304/§403/§407 — §28) and standard ergonomic tables (Neufert, Time-Saver); the tile column is this project's arithmetic. **CONFIDENCE: HIGH** for the conversions, MEDIUM for the "crowding comfort" bands (activity-dependent, and the engine has no crowding penalty at all — see §22 C-5).

## 12.2 The five width classes, by context (no universal corridor width)

**RULE** Width is a function of *who* uses the space, *how often*, *in what direction*, *carrying what*, and *what happens at peak*. The same building needs all five classes. Any layout that uses one corridor width everywhere is wrong somewhere.

| Context | Minimum functional | Comfortable | High traffic | Service | Emergency |
| --- | --- | --- | --- | --- | --- |
| Guest spine (lift hall → corridors) | 2 tiles | 3-4 | 5-6 (resort lobby spine) | n/a | ≥ primary |
| Guest room corridor (double-loaded) | 3 tiles | 4 | 4-5 | — | ≥ 3 |
| Guest room corridor (single-loaded) | 2-3 | 3 | 4 | — | ≥ 3 |
| In-room aisle | 2 tiles (1.0 m) | 2-3 | — | — | room door ≥ 2 |
| F&B dining aisle between tables | 2 tiles | 3 | 3-4 at the servery | 3 | ≥ 3 |
| Servery / queue frontage | 3 tiles | 4 + pocket | 5-6 | — | ≥ 3 |
| Kitchen work aisle (one cook) | 2 tiles | 3 | — | 3 | — |
| Kitchen aisle with a trolley crossing | 3 tiles | 4 | — | 4 | — |
| BOH spine | 3 tiles | 4 | — | 4 | ≥ 3 |
| Plant access (maintenance) | 2 tiles | 3 at the door | — | 3 | — |
| Lobby crossing | 5 tiles | 8+ | 10+ | — | ≥ 5 |
| Entrance/vestibule | 3 tiles | 4-6 | 6-8 | — | ≥ 5 |

Metric equivalents at 0.5 m/tile: 2 = 1.0 m, 3 = 1.5 m, 4 = 2.0 m, 6 = 3.0 m.
**SOURCE** Context widths are the standard content of Neufert / Time-Saver corridor tables and accessibility codes; the tile mapping is this project's. Real hotel guest corridors are commonly 1.2-1.8 m and lobbies 3-6 m — the grid's coarse 0.5 m step means the guest corridor lands at 3 or 4 tiles rather than at a metric 1.5 m. **CONFIDENCE: HIGH** (structure), MEDIUM (individual rows until pass A pins them; see §28).

## 12.3 Rounding policy (how to convert metres to tiles honestly)

1. **Never round down** for access, egress, queue or accessible widths: 0.91 m (ADA min) → 2 tiles (1.0 m) is the *minimum admissible*, and it is already 10 % under the comfortable reading. Where a code number matters and the grid cannot express it, state the shortfall in the design note rather than pretending compliance.
2. **Round to nearest** for furniture footprints and bay rhythm, because those are already asset-quantised (§2.7).
3. **Round up in multiples** for repeated modules: bays are 7 / 9 / 12 / 19 columns in the existing module — a 7.5-column bay is a sign the rhythm was not chosen, it was fallen into.
4. **Report both areas**: clear tiles (walkable) and gross tiles (including wall share + corridor share). At this grid, a 1-tile wall line adds ~0.5 m per side, so a 6 × 8-tile bathroom is 3.0 × 4.0 m gross but 2.0 × 3.0 m clear — 6.0 m², which is a *real* hotel bathroom size and explains the generator's "4 × 6 tiles = 6.0 sq m" note (`generate-hotel.mjs:376`).

## 12.4 Door rules (scale version)

| Door | Tiles | Use |
| --- | --- | --- |
| 1 tile (0.5 m) | single half-less | closet, riser, staff-only niche — **below** any accessible width; never on a guest route |
| 2 tiles (1.0 m) | two halves | the default room door, the guest room door, the BOH room door |
| 3 tiles (1.5 m) | 2 + 1 | accessible bathroom, kitchen internal door, generous suite entry |
| 4 tiles (2.0 m) | 2 + 2 | servery, main lift hall entry, service door, ballroom |
| 6+ tiles | multiple groups | the arrival vestibule — remember each group slides independently, so a wide opening is two decisions, not one |

Placement rules with mechanical weight:
- **Stagger opposite doors by ≥ 2 tiles** or widen the corridor to ≥ 4 at the pair (§10.4).
- **A door needs standing room on both sides**: ≥ 2 tiles of clear floor in front of a room door, ≥ 3 in front of a servery or a lift hall door (the queue pocket, §10.8).
- **A door on a spine is a conflict point**; the more doors a primary has on it, the slower it is — this is not modelled as a delay by the engine (no turn/stop cost, §2.3), so it is a *realism + wayfinding* rule, and it becomes mechanical only through the passing width (§12.1).
- **Never place a door so the room's first step is into a wall or a fixture**: the interact spots of the room's fixtures must be reachable from the door without crossing a blocked tile.
- **Doors mark zone transitions** (§9.2): a level change in the gradient should be a door you can see, and one door per transition step.

## 12.5 Turning areas, clear floor, and what the grid cannot do

A 3-tile square (1.5 × 1.5 m) is this grid's only faithful turning-circle primitive; a 2-tile corridor cannot turn a cart. The generator's `BATH_LAST = 12` / `PART_ROW = 6` layout (`generate-hotel.mjs:312-313`) puts a 4 × 6-tile bathroom with a 2-tile door and an entry column "kept free" — that free column *is* the turning area, and it is the discipline to copy: **every room gets one clear 2-3-tile circulation lane from its door to its first fixture before furniture is placed.**

## 12.6 Hotel dimensional benchmarks (real → grid)

| Space | Real typical | Gross tiles (at 0.25 m²) | Existing module value | Read |
| --- | --- | --- | --- | --- |
| Standard guest room incl. bathroom + share | 20-28 m² | 80-112 | 7 columns × 13 rows band = 91 clear + wall/corridor share, "28.0 sq m gross" | the module is at the *upper* real end — good |
| Superior | 28-35 m² | 112-140 | 9 × 13, "35.0 sq m gross" | ✓ |
| Executive | 40-50 m² | 160-200 | 12/13 × 13, "45.5-49" | ✓ |
| Suite | 60-90 m² | 240-360 | 19 × 13, "70.0 sq m gross" | ✓ |
| Bathroom | 4-6 m² (standard), 8-12 (suite) | 16-24 / 32-48 | 4 × 6 = 6.0 m², suite 5 × 6 = 7.5 m² | ✓ |
| Bedroom circulation aisle | 0.9-1.2 m | 2-3 | west column kept clear (2 tiles) | ✓ |
| Lift hall per floor | 6-12 m² + boarding | 24-48 + | `HALL` 12 × 14 tiles ≈ 6.0 × 7.0 m | oversized but it doubles as the queue domain |
| Reception queue frontage | 0.6 m per person standing | 1 tile / person | desk has 6 spots, cap 4 | plan ≥ 8 tiles of lobby floor in front |
| Restaurant per cover | 1.2-1.9 m² dining | 5-8 tiles/cover | `banquet-round` 2 m dia = 4 covers on 16 tiles | ✓ |
| Kitchen per cover | 0.4-0.8 m² | 2-3 tiles/cover | 5 stations × 2 tiles | size the kitchen from covers, not from taste |
| Pool deck surround | 1.5-2.0 m clear all round | 3-4 tiles | `pool-lap` 24 × 10 tiles is 12 × 5 m | the surround is the real cost, not the water |

**CONFIDENCE: HIGH** for the grid column (all measured from repo data); MEDIUM for the metric benchmark column until pinned by pass A sources in §28. Where the two disagree, §22 lists the conflict explicitly.

## 12.7 Egress numbers that are worth carrying

Typical code family (jurisdiction-dependent, to be pinned in §28): a common escape route ≥ 1.1 m wide (3 tiles), ≥ 1.8 m where more than ~50 people use it (4 tiles); travel distance to a final exit ~45-60 m on sprinklered floors (90-120 tiles — longer than any single floor here, so the binding rule is the two-exits rule, not the distance rule); dead-end corridors limited to roughly 6-15 m (12-30 tiles); exit capacity ~0.3-0.6 cm per person. Design agent note: **on an 80 × 50 canvas the exit rule is about the second stair/second hall, never about distance**, and that is exactly the check the existing validator encodes (`generate-hotel.mjs:831`). **CONFIDENCE: MEDIUM** (numbers), HIGH (the conclusion).

# 13. Vertical planning

## 13.1 The mechanic first

**RULE** In this engine, vertical movement is a portal interaction: an agent paths to a `portal` asset's interact spot on its own floor, interacts for `durationMin/Max` (the shipped car is 4 spots × 1-3 s), and appears at a spot of a portal on another floor; every portal links to every floor that carries one, and `crossFloorCooldownSeconds: 30` plus the role's `crossFloorChance` gate how often it happens (§2.4).
**CONSEQUENCE** **Vertical distance is a queue, not a walk.** A 20-floor tower and a 2-floor annex cost the same in tiles; they differ entirely in *boarding capacity and waiting*. So the design question is never "how far is the lift" but "how many agents per minute does this floor's hall have to absorb, and does it have the standing room".
**CONFIDENCE: HIGH** (code).

## 13.2 Lift bank sizing

**RULE** Size the bank from peak demand, and give the hall the standing room the queue needs.
**REAL-WORLD** Hotel practice is roughly 1 lift car per 75-125 rooms for full-service hotels, a target waiting interval of 25-35 s at peak (arrival/check-out/breakfast), one service car per bank, and freight/service cars at ~1 per 250 rooms.
**GRID FORM** `cars = ceil(rooms / 100)` as the opening estimate, then verify with §10.8: peak arrivals concentrate ~15-25 % of occupants into a 10-minute window, and each car absorbs 4 concurrent (its 4 spots, cap 4).
**EVIDENCE / SOURCE** The project's own tuning note is the same argument: *"Five cars, not three: a 21-floor / 116-key tower with 1200 agents moving needs the boarding slots, and each car's 4 spots are also the lift lobby's standing room"* (`generate-hotel.mjs:49-51`, `LIFTS` = `P1 P2 SV1 P3 P4`). Metric ratios from hotel planning literature (pass A, §28). **CONFIDENCE: HIGH** (grid), MEDIUM (metric ratio).

## 13.3 Core position and corridor reach

**RULE** Put the core so that no occupied door is more than ~20-24 tiles (10-12 m) from the lift hall, and no corridor is a dead end longer than ~12 tiles.
**REAL-WORLD** Hotel guides cap the guest corridor at roughly 25-30 m from the lift to the farthest door (guests judge a floor by that walk, and it is the egress path too); finger/split cores exist precisely to break long corridors.
**GRID FORM** On the existing 39-column spine (`CORR` cols 28-66) with a west core, the farthest bay door sits ~38 tiles from the hall — over the cap, which is the honest reading of why a *single* west core on a 32 m plate is aggressive. Fix forms: a second core at the east end (twin-core parti, the standard tower answer), a mid-span core (finger plan), or shortening the plate.
**CONFIDENCE: HIGH** (rule), MEDIUM (the 25-30 m figure — typology convention, not a code).

## 13.4 Stacking and alignment

**RULE** Anything with water, waste, exhaust or a shaft wants the same tiles on every floor. Anything that occupies people long wants the perimeter. Two stacks that miss each other by four tiles cost a horizontal run that this engine cannot express — which means the *only* place it can be expressed is space you give up on plan.
**GRID APPLICATION** Keep one canonical core: the same wall lines, the same door cells, the same riser closets, the same portal cells per floor (`generate-hotel.mjs:897` "Canonical core cells: every floor must carry the same wall lines, door cells and …"). Group wet fixtures (`toilet`, `washbasin`, `shower`, `bathtub`) on one side of the room and the same side of the floor plate, as `bathShell` does; keep kitchens above or below each other and near the same service line; keep the `riser-closet` cells identical.
**EXCEPTIONS** Deliberate inversion (a pool or a restaurant on the roof, a ballroom spanning the base) is legitimate *once* and must be paid for with a bigger plant room and a heavier core.

## 13.5 Shafts, risers and the service bar

**RULE** Reserve vertical service volume as a visible, repeated block, not as leftover. Real tall buildings carry a "service bar" between the core and the rooms: ducts, plumbing stacks, electrical risers, sprinkler mains.
**GRID FORM** the two riser rooms of the existing module (1.0 × 1.5 m interior, doors onto the core, `RISER_W`/`RISER_E`, `generate-hotel.mjs:45-46`) and the `riser-closet` asset (1.0 × 1.5 m, `structure` + `back-of-house`, its own `task-riser` round). Rule of thumb: **one 2 × 3-tile shaft per 40-60 rooms**, plus a second one when the plate exceeds ~20 m deep, and every shaft door opens on the core side of circulation, never into a guest room.

## 13.6 Stairs, in a game where they do not carry anyone

**RULE** Stairs here are non-load-bearing *claims*: they are what makes the building read as buildable and they are what the egress check looks for, and they are also the most expensive realism object per tile (a `stair-flight` is 1.5 × 2.0 m and blocks).
**GRID APPLICATION** Place 2 stair masses per floor at opposite ends of the served area (the module carries 11 `STAIR_FLIGHTS` cells across two shafts, `generate-hotel.mjs:52`), keep their doors off the corridor ends and reachable from the primary, and align them vertically — a stair that shifts by 6 tiles between floors is the fastest way to make a plan read as fake.
**CONFIDENCE: HIGH** (code + realism), and explicitly **GAME-SPECIFIC** in class: no agent walks them.

## 13.7 Floor ordering and vertical nuisance

Vertical adjacency has its own conflict table, because the grid cannot express acoustic separation between floors — so the *ordering* has to do the work:

| Above / below | Verdict | Why |
| --- | --- | --- |
| guest rooms over guest rooms | fine | the standard repeated plate |
| pool / gym / ballroom over guest rooms | **bad** | structure and vibration; put them at grade or on the roof |
| kitchen over guest rooms | **bad** | exhaust, grease, noise, delivery on the guest floor |
| plant (chiller/ahu/pump) directly over guest rooms | **bad** | noise + leakage; put plant on the roof, at grade, or above a corridor/service band |
| kitchen under restaurant/bar | **ideal** | one vertical for food, waste and staff |
| laundry under housekeeping | fine | shared riser |
| BOH band over lobby | normal | the service floor is the "ugly" plate, which is why it is at grade behind the line |
| spa over spa | good | wet stack, shared plant |

## 13.8 Core recipe (per guest floor, reusable)

1. Lift hall: 6 × 10 tiles clear minimum (the module's `HALL` is 12 × 14), directly off the spine, ≥ 2 tiles from the spine edge so a queue does not dam the corridor.
2. Portal cells: 2 × 2 per car on the hall's wall line, one of them tagged for service use; never more than 2 tiles of walk between hall centre and the farthest car.
3. Stair doors on two sides of the hall, 2 tiles apart.
4. Riser closet pair on the core's other wall.
5. Housekeeping satellite (3 × 4 tiles with a cart bay) on the core side of the corridor, ≤ 24 tiles from the farthest room door.
6. The secondary exit route starts here: a run to the second stair that does not pass through the hall.

# 14. Structural planning

## 14.1 The grid within the grid

**RULE** Real floor plans sit on a structural grid: concrete hotel/office frames run ~6-9 m bays, steel ~7.5-12 m, with the guest-room depth setting the bay in the short direction and the corridor+core setting it in the long one. Repeat the bay; do not vary the room size by varying the structure.
**GRID FORM** At 0.5 m/tile: 6 m = 12 columns, 8 m = 16 columns, 9 m = 18 columns. The existing module's column cells sit on an **8-column (4.0 m) pitch, two rows deep** (`COLUMN_CELLS`, cols 35/43/51/59 at rows 22 and 27, `generate-hotel.mjs:56`) — a 4.0 m × 2.5 m rhythm, which is a *room-module* grid (one column per two bays' party line) rather than a long-span frame. That is a legitimate structural reading of a hotel: the party-wall line carries the load, the façade does not.
**SOURCE** Module from repo; span ranges from structural planning literature (pass A, §28). **CONFIDENCE: HIGH** (principle), MEDIUM (metric span values).

## 14.2 Party walls, spans and the room module

**RULE** The repeated dimension in a hotel is the *room width* (3.4-4.2 m typical), and the party wall between two rooms is where structure and sound control coincide. On this grid the room widths are 7 / 9 / 12-13 / 19 columns = 3.5 / 4.5 / 6.0-6.5 / 9.5 m — all credible, and the suite's 9.5 m clear span is the point where a real designer would have to put a column or a beam in the room, or accept the transfer.
**GRID APPLICATION** When a bay exceeds ~12-13 columns, either place a `column` inside it (and design the furniture around it) or state the transfer-span decision. Do not silently span 19 columns.

## 14.3 Cores carry things

**RULE** The core is structural in reality (stairs + shafts = the shear wall), which is why it is rigid, repeated and hard to move — and why plan changes cluster around it rather than through it. **GRID APPLICATION** the design agent gets one core per parti, repeated per floor, and any growth beyond ~50-60 tiles of corridor reach is solved by adding a *second* core, not by moving the first.

## 14.4 Long spans, transfer and the public floor

Real hotels trade columns for space at the lobby, ballroom and restaurant levels. This grid cannot express a beam, so the honest equivalent is **fewer `column` assets on those floors + a wider clear span, and a note that this is the expensive move**. Keep the tower's column rhythm *unchanged* on those levels even if the column is hidden behind furniture (`wardrobe`, `dry-store-shelf`) — that is the trick that keeps a plan reading coherent.

## 14.5 Floor plate, depth and efficiency

**RULE** Plate depth is the master variable: it simultaneously sets the perimeter length, the daylit depth, the core-to-façade distance, the structural bay count and the corridor length. Real efficient plates are 15-24 m deep for hotels (two bands + core + two bands is what pushes past that).
**GRID FORM** the current envelope is 64 × 34 tiles = 32.0 × 17.0 m: a 17 m depth, two 6.5 m room bands and a 2.0 m spine plus walls = coherent, single-loaded-per-band, and the 32 m length is what the west core struggles with (§13.3). Efficiency metric: `lettable tiles / gross tiles` ≥ 0.72 on a guest floor, ≥ 0.60 on the service floor (§26.2).

## 14.6 What cannot be expressed (and the compensations)

| Real structural idea | Engine status | Compensation |
| --- | --- | --- |
| Wall height / storey height | none (§2.5) | hold floor-to-floor as a *program* note; never a plan feature |
| Slab / beam / soffit | none | columns + repeated rhythm |
| Double-height space | none | two floors + a shared core; do not pretend |
| Cantilever / overhang | none | place the envelope line and accept it |
| Taper/step of a tower | none per floor | vary the envelope line per floor — legal and effective |
| Roof plant | yes, as an asset on the top floor | keep it off the amenity hall axis |

# 15. Building services (utilities)

## 15.1 The systems and the rooms they force

| System | Real driver | Room/space it forces | Grid primitive |
| --- | --- | --- | --- |
| HVAC (heating/cooling) | plant near the load, exhaust and intake at the façade/roof | chiller/boiler/ahu rooms, fan decks | `chiller` 4.0 × 2.5 m, `ahu` 3.0 × 2.0 m + 1 tile access |
| Ventilation/exhaust | kitchens, pools, laundries, wastes need extraction | external wall or roof, grease duct route | plant on the envelope or the top floor |
| Plumbing + drainage | gravity, stacks, distance to the nearest soil stack | wet stacks aligned, pumps at the bottom | riser closets + wet-wall stacking (§13.4) |
| Water storage | demand + fire reserve | roof or basement tank room | `water-tank` 2.0 × 2.0 m |
| Fire protection | pumps, risers, hose reels, sprinkler mains | fire pump room at grade near the intake | `fire-pump` 1.5 × 1.0 m |
| Electrical + BMS | risers, metering, control room | control room visible & staffed | `control-panel` 1.0 × 0.5 m, `task-control-panel` |
| Lifts | cores and banking | the portal bank (§13.2) | `elevator-1` 1.0 × 1.0 m |
| Waste/refuse | hygienic storage, collection route | refuse room at the service exit | `waste-room` 1.0 × 1.0 m fixture in a walled room |
| Maintenance access | someone must stand at each item | the clear tile in front of every plant spot | standable `interactSpots` (§11.6) |

## 15.2 The substitution rule for gravity

**RULE** Drainage and stack logic cannot be computed here, so the design agent uses the *architectural* proxy: **wet over wet, plant over/beside the wet stack, risers aligned floor to floor, and no wet room placed against the façade opposite the stack line.** Getting this right is exactly what makes a plan read as designed by someone who knows where the pipes go.
**CONFIDENCE: HIGH** as a realism rule; explicitly **REAL-WORLD** in class (no mechanic enforces it).

## 15.3 Load-based placement

**RULE** Services follow demand: the pool/spa, kitchen and laundry are the three heaviest loads in a hotel (heat, water, exhaust), so the plant cluster belongs under/behind them, on the same vertical line, and the plant room size scales with the *sum* of the loads it serves — not with the floor area of the room it is on.
**GRID APPLICATION** A guest floor carries no plant beyond the risers; the amenity floors carry `ahu` + `chiller` + `water-tank` + `fire-pump` blocks in a dedicated Z6 band, and every one of them is reachable from the BOH spine, not from a guest corridor (this is also enforced by `role-guest.restrictedTags: mechanical`).

## 15.4 Plant sizing and clearance table (from shipped assets)

| Asset | tiles | m × m | spots | Plan as |
| --- | --- | --- | --- | --- |
| `chiller` | 8 × 5 | 4.0 × 2.5 | 1 | 1 per amenity/F&B cluster; needs 3 tiles of access on the service side |
| `ahu` | 6 × 4 | 3.0 × 2.0 | 1 | 1 per large zone (pool, ballroom, kitchen); ducting is expressed as adjacency, not as a route |
| `water-tank` | 4 × 4 | 2.0 × 2.0 | 1 | roof or grade; near the wet stack |
| `fire-pump` | 3 × 2 | 1.5 × 1.0 | 1 | grade, adjacent to the service exit and the intake |
| `control-panel` | 2 × 1 | 1.0 × 0.5 | 1 | a staffed or easily reached wall in Z5/Z7 |
| `riser-closet` | 2 × 2 | 1.0 × 1.0 | 1 | 1 per 40-60 rooms, on the core (§13.5) |
| `washer-1`/`dryer` | 1 × 1 | 0.5 × 0.5 | 1 | a laundry bank of 4-6 with 3 tiles of aisle |
| `cold-store` | 3 × 2 | 1.5 × 1.0 | 1 | between receiving and the kitchen line |

**RULE (verified)** These assets are `blocked` and each has exactly one interact spot: **the tile in front of the spot must be walkable on the route the engineer actually takes**, otherwise the plant round silently fails (`task-plant`, `task-riser`, `task-control-panel` post on them). Service access is therefore a *plan* property, not a section detail. **CONFIDENCE: HIGH** (data).

## 15.5 Services anti-patterns

Plant scattered across floors · plant room with no door onto a service route · a chiller whose front tile is a wall · the only riser on the guest side of the core · laundry without a soiled side · a waste room sharing a door with a store · the fire pump on the 9th floor · BMS panel behind a queue · every floor having a slightly different core (kills the whole stacking argument).

# 16. Daylight and orientation

## 16.1 The perimeter budget

**RULE** Perimeter frontage is the scarce resource; depth is the abundant one. Allocate the façade by the occupancy-length of the function, then fill the interior with things people pass through.
**GRID FORM** Define the **daylight band** as `tiles within N of an envelope tile (or an external wall line)` with `N = 12-14` (≈ the 2-2.5 × storey-depth rule at a nominal 2.6-3.0 m floor height, §7.2). Then: functions with `daylight = required` must have ≥ 40 % of their clear area inside the band and at least 2 tiles of band-facing wall.
**SOURCE** Daylight-factor/side-lighting depth conventions (CIBSE/NEUFERT-type guidance, pinned by pass A in §28). **CONFIDENCE: HIGH** (method), MEDIUM (the N value is a heuristic expressed in tiles).

## 16.2 Who needs the outside

| Needs exterior light + outlook | Indifferent (can be internal) | Must be internal / windowless is better |
| --- | --- | --- |
| guest bedrooms, suites, spa treatment rooms, restaurants, bars, lounges, gym, pool (but see privacy), meeting/ballroom (daylight-optional — black-out rooms are a *revenue* feature), offices/staff rooms with long occupancy | lift halls, guest corridors, circulation, retail back-up, dry store, laundry, housekeeping, changing rooms, dishwash, receiving | plant rooms, server/BMS (light-controlled), cold store, waste, cinema/ballroom, some kitchens (dark kitchens are normal), security control |
| Staff rooms genuinely want a window too — a windowless staff room is a real amenity failure, not a free choice. | | |

**RULE (the allocation order)** Bedrooms/lounge → F&B → spa/gym → meeting → staff → service → plant. Meeting rooms and plant are the standard "give up the façade" trades because both can be black-out and both tolerate a machine ceiling.

## 16.3 Orientation in this engine (what is actually modelled)

**RULE** There is no sun vector and no compass in the data model: the only *modelled* orientation is which side faces the street — `streetFloorId` + `streetWidthTiles` put a ring on one edge and `GRADE_OPENINGS` decides where arrival and service doors cut the envelope. Treat orientation as **face quality**, not as compass bearing: `street face` (arrival, noise, deliveries, best for public/black-out), `quiet faces` (bedrooms, spa), `corner faces` (the best rooms: two faces, views, and the natural place for a suite), and `internal` (services).
**EXCEPTION/CAUTION** Do not write "south-facing lobby gets morning light" — nothing in the sim computes it. Saying it is a fiction, and it will mislead the reviewer. Realism here comes from *placement logic* (public at the street, private away from it), not from solar geometry. **CONFIDENCE: HIGH** (§2.5 + `blueprint-data.json` street config).

## 16.4 Views, privacy and the façade trade

Where a bedroom faces the street, the design pays for it with privacy devices (§17.6); where a spa faces the street, the honest answer is to move the spa to the roof or the quiet face. Rule of thumb: **the street face below the 3rd floor is the least restful place for anything occupied for more than an hour.** In this engine the street floor is also where NPC density is highest (spawn zones, arrivals), which is the mechanical version of the same truth.

## 16.5 Deep-plan answers, ranked for this grid

1. **Shorten the band**, not the corridor: two 13-row bands + a 4-row spine is already the practical limit (§14.5).
2. **Courtyard / light well**: an internal `blocked`-faced void of ≥ 3 × 3 tiles with rooms on ≥ 2 sides reaching it. It is the only way to give a room on the middle of a deep plate a window; it costs a room and buys two lit rooms.
3. **Amenity spine on the good face**: put the circulation on the bad face and the rooms on the good one, so the walking distance does not consume daylight frontage.
4. **Sectional plates**: a 21-floor tower may change plate depth by floor (podium base with restaurant/retail, narrower tower above) — the standard real move, fully expressible here as per-floor envelope lines.
5. **Give up**: accept a windowless band of services down the middle. That is what cores are for.

## 16.6 Daylight metrics for the evaluation pass

- `daylight coverage = % of clear area of required-daylight rooms inside the band` → target ≥ 0.6.
- `black-out count = required-daylight rooms with 0 tiles of exterior wall` → target 0.
- `service-on-façade = tiles of exterior wall owned by Z5/Z6 rooms` → target ≤ 15 % (the generator's west core occupies a full façade line, which is a deliberate trade: the core is at the *least valuable* face; state it, don't hide it).

# 17. Privacy and thresholds

## 17.1 The social gradient, as a design instrument

Public → semi-public → semi-private → private is a *behavioural* sequence, and buildings that skip a step feel institutional. The devices at each step are: a **threshold** (a place where you are seen and your intent is read), a **buffer** (a space that absorbs the transition), and **control** (a door, a desk, a post, or in this engine a tag boundary).

| Transition | Real device | Grid form |
| --- | --- | --- |
| street → lobby | vestibule, canopy, doors in sequence | 2 door sets + ≥ 3 tiles of clear floor between (`context.md:28`) |
| lobby → guest floor | lift hall + key control | the hall is visible but not enterable without the portal |
| corridor → room | the door + the entry aisle you see on first step | 2 tiles of clear floor inside the door with no fixture in it |
| room → bathroom | never directly from the bed side | the generator's `PART_ROW`/entry column (`generate-hotel.mjs:312`) |
| guest zone → staff zone | service door off the spine | `back-of-house` tag + a wall line the guest never crosses |
| staff zone → plant/restricted | riser/plant doors, BMS | `mechanical` tag + Z6/Z7 access rule |

## 17.2 The first-step rule

**RULE** What a person sees in the first step inside a door defines the room's privacy. Fix it once at design time: from every room door, the first thing visible must be either the room's feature (the bed, the pool, the servery) or a wall — never a toilet, a service door, a bin store, or another room's occupant.
**GRID APPLICATION** Trace a straight 6-tile ray from each door cell in the door's facing direction; if it hits a `blocked` tile or a benign fixture, pass. This is cheap, computable, and it is the test that most "the plan looks fine but feels wrong" complaints are actually about.

## 17.3 Acoustic privacy — the honest gap

**RULE** Nothing in this engine models sound: there is no transmission, no background-noise penalty, no fixture that cares which room is next to it. So acoustic quality is **REAL-WORLD class only**: it can be pursued for realism and reviewer credibility, and it cannot be claimed as a working feature.
**Compensations that are still right** (because they are the same moves a real acoustician makes, and cost nothing on the grid): party-wall alignment (rooms share walls room-to-room, not room-to-corridor); buffers between loud and quiet (store/riser/corridor between a gym and a suite); no door facing another door within 4 tiles; mechanical plant not sharing a wall with a bedroom band; and the bathroom as the buffer in front of the bedroom door — which is exactly what the existing module does (`BATH_LAST` reaching the corridor-side wall, `generate-hotel.mjs:313`).
**CONFIDENCE: HIGH** on the gap being real (verified absence in code), MEDIUM on the effectiveness list (standard practice).

## 17.4 Visual privacy across the plan

Corridors must not look into rooms; a lift hall must not look into a service door; a pool changing area must not be visible from the gym's front row. Devices, ranked by tile cost: turn the corridor behind a wall (cheapest, costs a bend); stagger doors; screen with a blocking asset (a `wardrobe`, a `signage`, a `plant-1` reads as a screen at 0.5 m); use an entry vestibule for any private room off a public zone. Measurable form: the visibility test in §18.5.

## 17.5 What the engine does enforce about privacy

`ROOM_TYPE_SPECS` marks `bedroom`, `bathroom` and `spa` as `privacy: 'private'` and everything else as `open` (`schema/rooms.ts:10-25`), and `isPrivateRoomType` is the only privacy primitive in the codebase. So "privacy" as the engine sees it is a *label on a room type*, derived from fixtures (§2.4). Design consequence: a space intended to be private must contain the fixture that makes it private — a bedroom with no `bed-*` is, to the engine, a hallway, and any "we protected the guests' privacy" claim that rests on geometry alone is unverifiable.

## 17.6 Privacy anti-patterns

A door from the BOH straight into the dining room · a suite's bathroom door on the corridor wall · a gym facing a pool deck through glass · the lift hall as the only route to a "private" room · reception visible from the elevator but the toilet visible from reception · a private room whose door opens onto a queue.

# 18. Wayfinding

## 18.1 Lynch's five, translated

| Lynch element | Grid equivalent | How to build it here |
| --- | --- | --- |
| **Path** | a run of connected walkable tiles with a clear direction | keep primaries straight ≥ 8 tiles |
| **Edge** | wall lines, the envelope, the core | the strongest edge is the spine wall — repeat it per floor |
| **District** | a zone (§9) with a recognisable character | same fixture family + same corridor width + same colour role |
| **Node** | intersections, halls, lobbies | widen the tile at every decision point (a 2-tile corridor → 4-tile bay at the turn) |
| **Landmark** | a distinctive object visible from a decision point | `plant-1`, `signage`, `pool-lap`, `vending-machine`, a chiller behind glass — one per floor, visible from the lift hall |

**RULE** A building is legible when a person can name where they are from what they can see, without reading a sign. Signs are the repair for a plan that failed this test, so a design that needs signage everywhere is a plan to redo, not to label.
**SOURCE** Kevin Lynch, *The Image of the City* (1960) — book, URL not fetched this session; healthcare/hotel wayfinding research (decision points, landmarking) in pass A (§28). **CONFIDENCE: HIGH**

## 18.2 Visual axes

**RULE** From the entrance, and from every lift hall, there must be at least one long unobstructed sightline onto a landmark (reception desk, a bar, a pool, a window).
**GRID APPLICATION** Cast rays (Bresenham over tile centres, stopping at `blocked` cells) from the door cells and the hall centre; require ≥ 1 ray of length ≥ 10 tiles that ends on a `signage`, `front-desk`, `lounge`, `pool` or `bar` fixture. This is a real, computable check on this grid — the wall-thickness model makes it exact enough to trust (§19.3).

## 18.3 Decision-point discipline

- Few, distinct, and each one *answers a question*: "lifts or restaurant?" not "which of six doors?".
- **Choice count per 10 tiles on the primary ≤ 3**; a corridor with 12 doors in 20 tiles is unreadable for a human and, mechanically, is just a lot of conflicts (§10.4).
- Make the correct route the *visible* route: the widest continuation is what people take, so widths must encode hierarchy (§10.3) — this is the one place where width is a communication device, and it is why "uniform 2-tile everywhere" fails both the realism and the legibility test.
- Never put a decision where a queue forms (a queue hides the answer).

## 18.4 Orientation support (what is OPTIONAL and what is not)

Numbering, colour, signage assets, and consistent core layout per floor are the cheap wins; the *repeated core* is not cosmetic — an agent (and a viewer) who finds the same shape on every floor stops navigating. That is REAL-WORLD class with a game payoff: the shipped layouts keep the canonical core cells precisely for this reason (`generate-hotel.mjs:897`).

## 18.5 The measurable wayfinding checklist (grid form)

1. **Entrance test:** from the arrival door, is reception on a ray ≥ 8 tiles? ≥ 1 ray must hit a `front-desk` fixture.
2. **Floor test:** from each portal/hall cell, ≥ 1 ray ≥ 6 tiles to a landmark or an exterior-facing window line.
3. **Depth test:** average graph depth from the entrance to every interact spot, per zone — an amenity at depth 60 tiles with two bends is where guests get lost.
4. **Choice-point test:** count cells with ≥ 3 walkable neighbours on a primary; plot them; if they cluster (a "hedge"), redesign.
5. **First-step test (§17.2)** — privacy and wayfinding share it.
6. **Signage budget:** if the plan needs > 1 `signage` per 100 tiles of circulation, treat it as a smell test that failed and go back to §10.3.

**CLASS NOTE** Wayfinding in the strict human sense is only half the story here: NPCs navigate by tags, not by sightlines. So wayfinding is **REAL-WORLD** class for the agents and **OPTIONAL-to-HIGH** for the *viewer* and the reviewer. Be honest about which one a given criticism is about — and note the one place it becomes mechanical: a room the agent cannot *target* because it lacks the fixture tag is functionally invisible, which looks exactly like bad wayfinding in the sim (§24.5).

# 19. Space syntax → grid metrics

## 19.1 What space syntax claims

Space syntax (Hillier & Hanson, *The Social Logic of Space*, 1984; Hillier, "Space is the machine", 2007) models a building as a graph of spaces and treats **the configuration of that graph — not the design intent — as what predicts movement, encounter, and legibility**. Its core measures: **connectivity** (how many spaces a space touches), **depth** (how many steps from a starting space), **integration** (how accessible a space is from all others, normally `RRA = 1 / mean graph depth`, normalised for size as NAI/CRAI), **choice** (what share of all shortest paths passes through a space — the "through-route" measure), and **visibility** (ISV/IVA: what a point can see). Its empirical claim: integration and choice predict where people actually walk, better than proximity or intention.
**SOURCE** Books cited by title/author (URL not fetched this session); pass A's URL set in §28. **CONFIDENCE: HIGH** for the definitions, MEDIUM for the strength of the empirical claims in small buildings.

## 19.2 The two graphs available on this grid

| Graph | Nodes | Links | Use for |
| --- | --- | --- | --- |
| **Cell graph** (what the engine uses) | individual walkable tiles | 4-neighbour + legal diagonals (§2.3) | distances, choice, travel cost — everything the agents actually experience |
| **Space graph** (what architects draw) | flood-filled rooms and halls (§2.4) | door groups between them | integration, depth, the zoning check, "is the lobby the most integrated space?" |

**RULE** Compute both. The cell graph tells you what an agent pays; the space graph tells you what the plan *says*. A plan whose space graph is coherent and whose cell graph is hostile (a beautiful axial lobby with one 1-tile throat) is a common game-layout failure and it is invisible unless both are computed.

## 19.3 The metrics a tile grid can actually produce

Given `tileStates[row][col]` per floor (walkable / blocked / door), all of the following are a few lines of BFS/ray work — the design agent can either implement them or estimate them by hand for small plans:

1. **Depth / mean depth** — BFS levels over the cell graph from the entrance cell set. `depth(cell)`, `mean depth per space`.
2. **Integration** — per space, `RRA = 1 / mean graph distance to all other spaces`, size-corrected. Rank the spaces: a well-formed hotel has `lobby > lift hall/pre-function > guest corridor > guest room > bathroom`, and plant at the bottom.
3. **Choice (through-movement)** — for a sample of origin/destination pairs (each interact spot, each spawn zone), run shortest paths and count cell usage. Cells with high choice are your **real** primary routes, whatever the drawing calls them.
4. **Connectivity** — count of distinct door groups per space; a space with connectivity 1 is an appendage (fine for a bathroom, wrong for a restaurant).
5. **Visibility (ISV)** — ray-cast from a cell centre, stopping at `blocked` cells; count visible cells (or area). Cheap, and directly usable for §17.2's first-step test and §18.2's axes. The 1-tile wall model (§2.2) makes occlusion exact enough to trust at room scale; doors are transparent, which mirrors the visual claim of an open door.
6. **Axial lines** — maximal straight runs of walkable cells (the segment analogue). Long axial runs = the visual/spatial spine; their count and length distribution is a legibility fingerprint.
7. **Weighted adjacency score** — `Σ over program pairs (weight × shortest-path distance between the two spaces' door cells)`; this is the REL-chart score of §4.3 computed honestly on the graph. Lower is better; use it to compare two candidate layouts, never to declare one "correct".
8. **Passing-conflict exposure** — count of 1-tile-width cells on high-choice routes (§12.1). This is the metric that corresponds to the most common actual symptom in a tile sim: agents refusing to move past each other.
9. **Queue adequacy** — for each fixture with capacity < demand (§10.8), `free walkable cells within 2 tiles of its spot ≥ queue.maxMembers`.

## 19.4 The zoning-integration test (the most valuable single check here)

**RULE** Sort the spaces by integration (descending). Their **zone level** (§9.1) must be non-decreasing... i.e. the integration ranking should follow the privacy gradient: public spaces most integrated, restricted least. Any inversion is a specific, nameable defect — a service room more integrated than the lobby means guests will see deliveries; a guest room more integrated than the corridor means it is being used as a shortcut.
**REASON** Integration measures "how many routes pass through you", which is exactly what a public space should be and what a private space must not be. Fixing inversions is the fastest way to convert a plan from "rooms placed" to "zoned".
**GRID APPLICATION** rank spaces by mean depth from the entrance, compare to §9.1 levels, and repair the top three inversions before adding furniture.
**CONFIDENCE: HIGH** as a design heuristic; it inherits space syntax's own MEDIUM confidence as a *predictive* theory.

## 19.5 Where space syntax does not transfer

- It assumes **people move for reasons the configuration explains**; here NPCs move by tag-targeting and random wander, so a "high-choice cell" is a *predicted* rather than observed flow unless you actually run the sim (and then the sim's own counts are the better data — §26.4).
- Its convex/axial abstractions are coarser than a cell graph: an L-shaped corridor is one convex space but two runs; on a grid, prefer cells and use spaces only for the zoning test.
- It does not know about capacity, schedules or queues — the three things that dominate hotel crowding here. Space syntax describes the *shape* of movement; §10.8 describes its *volume*; a good layout needs both.
- Nothing in this repo computes any of it today (`NOT IN CODE`), so a design agent must either implement the metric or state that it reasoned by eye.

# 20. Grid / tile translation

## 20.1 The translation procedure (metric program → tile plan)

1. Write the program in metres (§4.2), including the **fixture list by asset id** (§2.7).
2. Convert clear areas to tiles (`m² ÷ 0.25`), then to **plausible rectangles** using the module vocabulary (see §20.4): a 24-tile room is 4 × 6 or 3 × 8, not √24 × √24 — the ratio is the design, the area is only the budget.
3. Add the wall share (§20.2) and the corridor share to get gross; check gross against the floor's `lettable / gross` target.
4. Choose the parti lines and the rhythm before any room (§3 P-1); on this grid that means: spine rows, core columns, bay column-sets, envelope lines.
5. Place rooms as whole numbers of modules between parti lines; snap every wall to a shared line so the wall is *one* tile, not two.
6. Place doors by class (§12.4), then verify the door graph (§19), then furniture against walls with the aisle first (§20.5), then the standable tiles in front of every interact spot (§15.4).
7. Only then measure widths against §12.2 and adjust — never the other way round.

## 20.2 The wall overhead (the tax this grid charges)

Because a wall is 1 tile = 0.5 m (§2.2) and real partitions are ~0.15 m, wall thickness is over-expressed by ~0.35 m per wall line, and every shared party wall is one tile *between* two rooms, not two.

| Room (clear) | Clear m² | Perimeter wall tiles | Wall tax per room (half the perimeter) | Gross incl. share |
| --- | --- | --- | --- | --- |
| 4 × 6 (bathroom) | 6.0 | 18 | ~4.5 tiles ≈ 1.1 m² | ~7.1 m² |
| 7 × 13 (standard bay band) | 22.75 | 38 | ~9.5 tiles ≈ 2.4 m² | ~25-28 m² with corridor share (matches the generator's "28.0 sq m gross") |
| 9 × 13 (superior) | 29.25 | 42 | ~10.5 ≈ 2.6 m² | ~35 m² gross ✓ |
| 19 × 13 (suite) | 61.75 | 62 | ~15.5 ≈ 3.9 m² | ~70 m² gross ✓ |

**RULE** Quote **two** areas for every space (clear and gross) and never compare a real-world benchmark in gross m² against your clear tile count. Half of every "the room is undersized" argument in this project's genre is a clear/gross confusion.
**CONFIDENCE: HIGH** (arithmetic on verified module values).

## 20.3 Wasted tiles: the taxonomy

| Waste | Grid signature | Acceptable when |
| --- | --- | --- |
| **Over-width circulation** | primary > 6 tiles with low choice | it is a lobby, a queue domain, or a viewed space |
| **Unreachable spot tile** | a fixture's interact spot tile is blocked/non-adjacent | never — the fixture is dead (§15.4) |
| **Sliver space** | 1-tile pockets between rooms, unusable for furniture, walkable but dead | never; seal it (make it `blocked`) or widen the room to absorb it |
| **Double wall** | two parallel wall lines with a tile between that no one can use | a deliberate service duct — say so, or merge the lines |
| **Dead-end stub** | ≥ 3 tiles of corridor serving nothing | an expansion joint (§9 P-9), and only then |
| **Corridor in front of a door** | the room's own door discharging into a 1-tile run | re-door the room |
| **Furniture-baiting aisle** | an aisle only wide enough to walk, not to use the fixture (a wardrobe with 1 tile in front) | never; aisle minimums are use-based (§20.5) |
| **Non-repeated module** | bay widths that vary by 1 column for no reason | never; it is the signature of an unplanned plan |

**RULE** Compute `efficiency = lettable tiles / (lettable + circulation + wall + service + waste)` per floor and per band, and treat waste as a number to reduce, not a feeling.

## 20.4 The module grammar (repeated dimensions)

The existing tower gives this project its working module set; the KB's claim is that these numbers are *a* good grammar, not the only one:

| Element | Module | Why it repeats |
| --- | --- | --- |
| Room width (party-wall pitch) | 7 / 9 / 12-13 / 19 columns = 3.5 / 4.5 / 6.0-6.5 / 9.5 m | bed + side aisles sets 7; king + lounge sets 9; living+bed sets 12-13; 19 = suite with a real bathroom |
| Room band depth | 13 rows = 6.5 m | daylight limit (§16.1) + bathroom-at-the-corridor-side stacking |
| Spine | 4 rows = 2.0 m | two-way + cart standing (§12.2) |
| Wall lines | rows 22 / 27 | shared wall between band and spine — one tile, two rooms |
| Core width | 5 columns = 2.5 m per stair, 20 columns for the hoist bank | car + hall + shaft |
| Riser room | 2 × 3 tiles interior | reachable + maintainable |
| Column pitch | 8 columns = 4.0 m, on rows 22/27 | party-wall line structure (§14.1) |
| Lift hall | 12 × 14 tiles ≈ 6.0 × 7.0 m | boarding + waiting + both stairs |

## 20.5 Aisle and footprint rules (furniture as the third dimension of the plan)

- **Wall-riding rule:** assets ≤ 1 tile deep (`wardrobe`, `dry-store-shelf`, `linen-shelf`, `staff-locker`, `signage`, `bar-counter`, `pass-window`, `kitchen-*`, `reception-desk`) belong **against a wall line**, with their aisle on the room side. A free-standing counter in the middle of a lobby is a design statement, not a default.
- **Aisle-by-use rule:** behind a wardrobe 2 tiles; in front of a bath fixture 2 tiles; at a kitchen station 2-3 tiles (1 cook) or 3-4 (crossing traffic); at a servery 3-4 tiles + the queue pocket; in front of plant 3 tiles (§15.4).
- **Bed rule:** `bed-double` is 3 × 4 tiles; add 2 tiles each side for the aisles and 2 at the foot → a *minimum* honest double room is 7 × 10 clear tiles (8.75 m² of floor + bathroom + entry = the 28 m² gross module). Anything narrower is a room where the bed is a wall.
- **Do not bisect a bay:** the generator's discipline is a general rule — fixtures and furniture live in the head strip or against the far wall, never across the middle of the room's circulation lane (`generate-hotel.mjs:306-311`).
- **Turning:** a cart needs a 3-tile square or a 4-tile corridor corner; a person with luggage, 2 tiles. Put one turning bay per BOH run of > 16 tiles.
- **Occupancy from area:** `occupants = clear tiles ÷ (activity m²/person ÷ 0.25)` (§12.1 crowding row), then reconcile with fixture spots — the smaller number wins for comfort, the larger for revenue, and the difference is a decision to record.

## 20.6 What a tile *cannot* express (so the KB never promises it)

Heights, ceiling services, structural depth, sound, smell transport, temperature (no thermal model in the NPC pathing — `NOT IN CODE` for this engine), light levels, water runs, lift travel time as motion (it is an interaction), door locking (tags instead), and view quality beyond "which face". Every one of these appears in this document as either a *placement rule* (its architectural consequence) or is explicitly tagged as unmodellable. The design agent must not claim any of them as working features.

# 21. Reusable layout patterns

Ratings: `H` strong / `M` moderate / `L` weak. `Tile efficiency` = lettable share of the plate; `Realism` = how much it reads as a real building; `Traffic` = how well it handles peak flow; `Security` = how readily it supports zone control.

| Pattern | Best use | Efficiency | Realism | Traffic | Scalability | Security |
| --- | --- | --- | --- | --- | --- | --- |
| 1 Central spine (double-loaded) | guest floors, offices | H | H | H | H | M |
| 2 Central spine (single-loaded) | hospitals, schools, narrow plates | M | H | H | H | H |
| 3 Courtyard / perimeter block | resort wings, low-rise, spa | M | H | M | M | H |
| 4 Service spine (parallel BOH) | any full-service building | M | H | H | H | H |
| 5 Modular block / repeated cell | chains, prisons, wards, floors | H | M | M | H | H |
| 6 Loop circulation | retail, banqueting, pools, kitchens | M | H | H | M | M |
| 7 Controlled chokepoint | entry control, kitchens, security cores | L | H | M (by design) | M | H |
| 8 Central core / finger plan | towers on tight sites | H | H | H | H | H |
| 9 Cluster / pavilion | campuses, resorts, spa villages | L | M | M | H | L |
| 10 Linear bar | restaurants, shops, motel, production line | H | M | H | L | L |
| 11 Radial / spoke | panoptic supervision, terminals | M | H | H | L | H |
| 12 Distributed hubs | large multi-floor towers, mega-prisons | M | H | H | H | H |

## 21.1 Pattern notes (use case · strengths · weaknesses · grid recipe)

**1 Central spine, double-loaded.** The default for guest floors: one corridor, rooms both sides, core at one end or mid-span. Strengths: minimum circulation per room, structural repetition, legible. Weaknesses: long monotonous corridor, far rooms exceed the reach budget (§13.3), one corridor = one evacuation route. Recipe: spine 4 tiles, bands ≤ 13 rows, party-wall pitch 7/9/12 columns, core within 20-24 tiles of the farthest door. **This project's current module is exactly this pattern** (`generate-hotel.mjs:36-38`), with the corridor at rows 23-26 and mirrored bands.

**2 Single-loaded spine.** Corridor against the façade, rooms behind, one-sided. Costs 30-40 % more circulation but every room gets two faces, the corridor itself is daylit, and supervision is direct. Use where depth ≤ 8-9 tiles, or for the amenity floors. Weakness: it wastes the good façade on walking — so put the spine on the *worst* face (§16.5 rule 3).

**3 Courtyard.** Rooms on ≥ 3 sides of an internal void. Buys daylight and outlook to a *private* exterior, gives identity, and shortens runs. Costs: the void is unlettable, corners are awkward (a 1-tile wall returns 4 tiles of dead corner), and in this engine the void must be `blocked`-faced so it reads as exterior. Recipe: void ≥ 6 × 6 tiles, rooms ≤ 8 tiles deep around it, one entry per side. **Evidence reinforcement:** real correctional research rates courtyard layouts best and constant-watch panoptic forms worst for occupant mental health (§6.7, [HMC Architects](https://hmcarchitects.com/blog/2018-09-05/normative-designs-role-in-reducing-recidivism-rates-2018-09-05/)), so the courtyard ranks above the radial form for occupancy quality even where supervision is weaker.

**4 Service spine.** A second, parallel circulation network with its own doors and its own vertical. It is the pattern that makes a hotel a hotel (§11.3). Costs gross floor; pays back in guest-zone purity. Recipe: 3-4 tiles wide, rooms in flow order F1→F7 (§11.2), one engineered crossing with the guest spine maximum, its own portal.

**5 Modular block / repeated cell.** Identical units tiled across a plate: prisons' cell ranges, hospital wards, guest floors, offices. Highest efficiency and cheapest expansion (add a module), lowest realism on its own (a wall of identical doors reads institutional) — cured by varying the ends, inserting a break every 4-6 units, and giving the module a shared frontage space. Recipe: module = clear width 7-9 columns, repeat 5-8 times, then a break (riser, store, stair).

**6 Loop.** A closed circuit: no dead ends, forced movement past the destinations, natural for queues and for supervision. Weaknesses: loops tempt shortcuts across zones, they are tile-hungry at small scale, and a loop with one narrow throat is worse than a spine. Recipe: minimum 2 tiles on the loop, 3-4 where two streams meet, and control the entries onto it.

**7 Controlled chokepoint.** The deliberate bottleneck: one door, one desk, one gate, one lift hall. Everything can be watched and everything must be authorised. This is the prison/security pattern and, at low intensity, the hotel lobby (reception as the chokepoint). Weaknesses: capacity, single-point failure, evacuation danger (§10.7 forbids it as the only route). Recipe: the choke cell + a 4-6-tile queuing bay on the approach side + a bypass door for emergency that is normally invisible.

**8 Central core / finger plan.** Core in the middle, corridors as fingers. Excellent for depth-limited plates and for two-exit separation, and it is the tall-tower parti. Weaknesses: fingers become dead ends (each finger is one route), and corners of the core collect queue conflict. Recipe: 3-4 fingers, each ≤ 12 tiles to the farthest door, two fingers opposite each other for the two-exit rule, the core holding the whole service bar (§13.5).

**9 Cluster / pavilion.** Grouped rooms around a shared space; the campus/resort pattern. Best social quality and identity, worst efficiency (each cluster needs its own frontage and the joins are circulation), and expansion is genuinely easy (add a cluster). Weaknesses on this grid: joins are where slivers and double walls appear (§20.3).

**10 Linear bar.** Everything in one row fronting one route: restaurants, shops, motel, production lines. Cheap, legible, brutally efficient. Fails on depth (> 13 rows and the back is dark), on expansion beyond ~15 doors, and on security (anyone passes everything to reach the end). Recipe: frontage 4-6 tiles, depth 8-13 rows, services at one end and never in the middle.

**11 Radial / spoke.** Spaces radiating from a central point; the supervision parti (Bentham's panoptic scheme is its historical form) and the terminal form. Superb for sightlines and for a single control point; poor for expansion (each new spoke disturbs the whole) and tiring to walk because every trip crosses the hub. Recipe: hub 6-10 tiles clear, 4-6 spokes, each spoke ≥ 2 tiles, and a ring if you have > 4 spokes (which converts it into a loop). **And its human cost is documented:** linear and panoptic supervision "generally produce the most tension", while placing the control point *inside* the living unit lowers violence (§6.7) - which is why #5/#12 with an embedded post beat a distant watchpoint here too.

**12 Distributed hubs.** Several mid-size cores/hubs instead of one big one — the mega-prison and the big-tower answer, and the natural form for "same parti, repeated per zone". Strengths: no single queue point, real evacuation redundancy, and expansion by hub. Weaknesses: each hub carries cost and circulation, and the plan needs an inter-hub connector that must not become a shortcut between zones.

## 21.2 Composition, not choice

**RULE** Real buildings compose two or three of these: a hotel tower is *central spine* per floor + *service spine* + *modular block* (the bay repeat), with *controlled chokepoints* at the vestibule/reception/lift hall, and *distributed hubs* once the plate exceeds ~40 tiles of reach. A pattern catalogue is a vocabulary; the parti (§3 P-1) is the sentence.
**GRID APPLICATION** State the composition in one line at the start of the design: e.g. `double-loaded central spine + parallel service spine + 9-column modular bays, twin cores (distributed hubs), chokepoint at the lift hall`. Then every placement question has an answer.

**CONFIDENCE for the catalogue:** HIGH on the pattern names and their properties (standard typology vocabulary, argued section by section), MEDIUM on the efficiency / traffic / realism / security ratings, which are comparative judgements rather than measurements. Use the ratings to *narrow* the choice of parti, never to overrule a program requirement (§22.1).


# 22. Reality vs game optimization (the conflict register)

The brief's core tension: the game optimum is shortest path / minimum corridor / maximum tile efficiency / minimum walking distance; the architectural optimum is comfort, accessibility, safety, maintenance, service flow, privacy, wayfinding, daylight, behaviour, redundancy, expansion and aesthetics. Each conflict below is real, recurring, and has a stated resolution.

| # | The efficient move | The architectural requirement | Why they conflict | Resolution for this engine | Class |
| --- | --- | --- | --- | --- | --- |
| C-1 | Diagonals across open space; corridor-as-room | Rooms must be bounded; privacy; legibility | The cheapest route is the one that crosses everything | Keep diagonals legal *inside* a room's own program; block the crossing at the room boundary with a wall line; a lobby may be a hall because it *is* a room | UNIVERSAL |
| C-2 | 1-tile corridors everywhere (minimum tiles) | Passing width, carts, egress, queues | 1 tile = 1 agent body (§12.1) so two streams deadlock | **2 tiles is the floor for any route with two-way traffic; primary ≥ 4.** A 1-tile stub ≤ 3 tiles serving one fixture is the only legitimate 1-tile run | GAME-SPECIFIC (mechanical) with REAL-WORLD width logic |
| C-3 | Minimize total corridor tiles | Circulation % has a floor for legibility + egress | Corridor is not waste; it is the structure of the plan | Hold circulation 12-25 % of gross (hotel guest floors at the low end); below 12 % something is being routed through a room | REAL-WORLD |
| C-4 | Put the kitchen wherever there is space | Chain: delivery→store→cook→serve→return→waste | One-directional flows need sequence, not proximity clusters | The chain wins over any adjacency convenience; put the BOH where the chain fits, and pay for the longer guest route to F&B | UNIVERSAL |
| C-5 | Pack occupancy to area | Comfort density, privacy, service capacity | No crowding penalty exists in the engine, so a "fine" number of guests per room is only fine to the spreadsheet | Use §12.1 bands as an *explicit* design ceiling; if the design exceeds them, say it is a revenue choice, not a layout | OPTIONAL (engine) / REAL-WORLD (review) |
| C-6 | One big lobby absorbs all queues | Queues must belong to the thing they queue for | A shared queue domain hides the decision point and blocks the through-route | Queue pockets per fixture (§10.8), sized `maxMembers × 1 tile`, off the primary | UNIVERSAL |
| C-7 | Small metric fixtures to fit more rooms | Fixtures need use clearance (a 2-top at 0.5 m depth is not sitable) | Furniture footprints in `blueprint-data.json` are *art*, not ergonomics: `table-1` is 1.0 × 0.5 m | Add the aisle to the footprint when sizing a room, never trust the asset's visual size; 2 dining tiles/cover + aisle is the honest number | GAME-SPECIFIC |
| C-8 | Minimum-size lift cars | Boarding capacity + waiting room | A `elevator-1` car is 1.0 × 1.0 m with 4 spots — the car is tiny, the *hall* is what carries traffic | Size halls and banks from demand (§13.2); do not "improve" the car | GAME-SPECIFIC |
| C-9 | Skip housekeeping/linen/waste rooms (they earn nothing) | They are the flows that make a hotel work | Non-revenue space is the first thing naive optimization deletes | Minimum BOH set per service floor is non-negotiable: store, soiled, linen, waste, staff (§11.6) | UNIVERSAL |
| C-10 | One core, one entrance, one lift hall (cheapest) | Two ways in and out; resilience | Single points fail at peak and fail the egress test | Second portal group + second stair mass per floor (§10.7) even when nothing in the sim demands it | REAL-WORLD + game resilience |
| C-11 | Fill every tile with program | Expansion joints, daylight gaps, structure rhythm | A plan with no slack cannot take the next floor's change | Reserve a spare shaft cell, a stub corridor, and a free module edge (§25) | REAL-WORLD |
| C-12 | Put services where the leftover is | Plant wants the load, the façade for exhaust, and the vertical for stacks | Leftover tiles are usually interior and far from the demand | Services get *chosen* space next to their demand; give them the worst façade, not the worst position | UNIVERSAL |
| C-13 | Make every room the same size (module discipline) | Hierarchy of rooms, view, tiering | Repetition is cheap and monotonous | Repeat the *structure*, vary the *program*: same 9-column pitch, alternate 1×/2× pitch for suites and break the run every 5-6 units | OPTIONAL (aesthetic) with H realism value |
| C-14 | Route guests through scenic interiors (short) | A guest should never pass a service door | Shortest-path beauty is where the leak is | Thresholds and turns (§17.1); distance is cheaper than dignity | REAL-WORLD |

## 22.1 The decision rule

**RULE** Order of appeal when two principles collide: (1) anything the engine *mechanically enforces* (§2 facts: passability, capacity, tags, caps); (2) anything a **code/safety** principle says (egress, hygiene separation); (3) anything a **flow/throughput** calculation says (§10.8); (4) anything a **zoning/privacy** principle says; (5) structure/repetition; (6) daylight; (7) aesthetics. Record the winner and the accepted cost: `DECISION → REASON → EVIDENCE → TRADE-OFF`.
**REASON** The order is by *cost of being wrong*: a blocked spot tile breaks a system silently; an ugly corridor breaks nothing but a reviewer's impression.
**CONFIDENCE: HIGH**

## 22.2 Where the game optimum should simply win

Where a real requirement has no referent here — acoustic separation (§17.3), thermal zones, smoke control, structural deflection, light levels — take the efficient layout and *note the omission*, rather than paying tiles for something nothing observes. The exceptions are the three cases where realism buys observationally-credible quality on this grid: **zoning purity** (a guest never sees a trolley), **legibility** (a viewer can follow where people go and why), and **module discipline** (the plan reads as designed, at a glance, in the editor). Those are the three places "wasted" tiles are the point.

# 23. Case studies (real buildings and player layouts, 10-point analysis)

*Analysis produced by research pass D; each case follows the 10-point template (macro zoning · circulation · service flow · adjacency · security · bottlenecks · expansion · why it works · why it fails · transferable principles). Sources in §28.*

## 23.1 Case 1 — The classic American hotel slab (Statler Buffalo 1908 → Stevens Chicago 1927)

Sources: [buffaloah.com](https://buffaloah.com/a/archs/ej/bechs/stat1/index.html) · [architecture-history.org](https://architecture-history.org/schools/HOTEL.html) · [hotel structural grid guide](https://hoteldevelopmentguide.com/hotel-structural-design/) · [Mingsun hotel floor-plan guide](https://www.mingsungroup.com/article/how-to-design-a-hotel-floor-plan-maximizing-efficiency-and-guest-experience-insights-by-mingsun.html) · [Studio Anyo DFMA hotels](https://studioanyo.com/design-principals-for-dfma-hotels/)

1. **Macro zoning** — public at the extremes: "major public spaces on the lower- and uppermost floors, largely identical floors of guest rooms between"; service "carefully woven throughout the plan".
2. **Circulation** — one double-loaded spine per plate; guest corridor ~1.5-1.8 m (vendor figure); lobby → core → floor stub.
3. **Service flow** — Statler's innovation was *utility into the room* (private bath per room, circulating ice water, single-handle taps), which retired the corridor service cart that older hotels needed.
4. **Adjacency** — the money rule: "bathrooms arranged in pairs along the interior wall … allow two bathrooms to share one plumbing shaft" (and mirror-image rooms). Structural spans 7.0-8.5 m, room width 3.3-3.8 m, planning module 3.6 m, room length ~7 m, module length ~16.6 m.
5. **Security** — the front desk as the single guest checkpoint; the room stack is de-facto private territory.
6. **Bottlenecks** — the elevator lobby; corridor ends where a core interrupts the spine; check-out concentrates all travel into one node.
7. **Expansion** — pure plate repetition; the Stevens opened with 3,000 rooms/3,000 baths by adding identical floors.
8. **Works** — one certified module × N; every room on the perimeter (light and air *were* the product); vertical stacks; constant marginal cost per floor.
9. **Fails** — monotony is a wayfinding defect (no landmarks: "which corridor am I in?"); long spines = long egress walks; shared party walls transmit noise; housekeeping travel dominates because cores are far from mid-corridor rooms; the plate cannot adapt to a view gradient.
10. **Transferable** — COPY: 1 spine : 2 room rows; paired-bathroom/one-shaft adjacency; service nodes repeated every 6-8 rooms rather than one per floor; public floors at the extremes; corridor counted as non-revenue so its length is minimised *subject to* egress. Grid form: a 7-9 column bay, wet fixtures on the shared-wall side, a riser pair every ~5 bays, `hall`-share tracked as non-lettable (§20.2, §26.2). DON'T COPY: plumbing stacks, lift travel time, code egress distance, acoustic transfer (nothing models them — §20.6).

## 23.2 Case 2 — The atrium hotel: Hyatt Regency Atlanta (Portman, 1967), and Kansas City 1981 as its failure

Sources: [Hyatt Regency Atlanta](https://en.wikipedia.org/wiki/Hyatt_Regency_Atlanta) · [John Portman, New Georgia Encyclopedia](https://www.georgiaencyclopedia.org/articles/arts-culture/john-portman-1924-2017/m-10325/) · [Hyatt Regency walkway collapse](https://en.wikipedia.org/wiki/Hyatt_Regency_walkway_collapse) · [1967 floor plans](https://www.researchgate.net/figure/The-plans-of-the-1967-Hyatt-Regency-in-Atlanta-GA-USA-from-bottom-to-top-the-lobby_fig2_330235831)

1. **Zoning** — the lobby *is* the volume ("a twenty-two-story lobby"); guest floors wrap inward-facing balconies around it; public functions stack vertically inside one void instead of spreading horizontally.
2. **Circulation** — express lifts to a floor, bridges across the void as secondary circulation; glass lifts as spectacle-transport.
3. **Service** — BOH corridors ring the atrium behind elevator/service walls so staff never appear over the rail.
4. **Adjacency** — the demand-generating rooms (bars, restaurants, shops) take the atrium edge and the bridges; each guest door "fronts" the void and backs onto the slab.
5. **Security** — the atrium is a supervised container: everything public is visible from everything else; room floors are reachable only through the lift lobby.
6. **Bottlenecks** — all guests, all hours, one ring of lifts; the bridges are pinch points (Kansas City's walkways carried ~1,600 people).
7. **Expansion** — the typology spread by replication; Atlanta's own retrofit problem is the roof restaurant closing 2004 and reopening 2014.
8. **Works** — maximum differentiation per tile, and the void is the wayfinding landmark: you cannot lose the atrium.
9. **Fails** — void floors earn nothing; and Kansas City's collapse (a shop-detail change to "two separate and offset sets of rods" doubled the load on the fourth-floor box beams; 114 dead, 216 injured; afterwards ASCE made engineers responsible for reviewing shop drawings) is the standing warning that circulation hung off prestige structure is fragile. Noise/smoke travel across the void; re-climating it is expensive.
10. **Transferable** — COPY: one big void per property as landmark + social condenser, budgeted as luxury; all public rooms on its edge; the vertical connector as the prestige object. Grid form (§16.5, §21.1 #3): void ≥ 6 × 6 tiles, public program on ≥ 2 sides, ≥ 8 tiles of clear edge frontage per public room, and never a bridge narrower than the route it carries. DON'T COPY: live loads, air behaviour, revenue-per-floor penalty.

## 23.3 Case 3 — Resort macro-zoning: Marina Bay Sands, Singapore (Safdie, 2010)

Sources: [Marina Bay Sands](https://en.wikipedia.org/wiki/Marina_Bay_Sands) · [Safdie Architects project page](https://www.safdiearchitects.com/projects/marina-bay-sands-hotel-and-skypark) *(the sources conflict on height/room count — 55 vs 57 storeys, 1,850 vs 2,600+ rooms; flagged, not resolved)*

1. **Zoning** — three hotel towers on a mixed podium (casino, convention, mall); the tower band is pure private, the podium is pure public.
2. **Circulation** — "a continuous lobby at the base linking the three towers", a "grand, connecting atrium lobby which extends the city's public pedestrian network"; horizontal public movement converts to vertical at the tower doors.
3. **Service** — one receiving/laundry/kitchen district in the podium feeding three vertical service groups; convention catering is the design load case.
4. **Adjacency** — casino ↔ mall ↔ convention ↔ hotel stacked in the loop that maximises dwell time; the SkyPark sits above the rooms it serves.
5. **Security** — four different publics (passer-by, mall shopper, registered guest, ticketed deck visitor) gated at four different transitions.
6. **Bottlenecks** — the SkyPark: a 340 m platform with stated capacity **3,902 people** against a tower population above it; and the tower/lift transition.
7. **Expansion** — by *adding a tower* on the shared podium; the deck doubles as the connector.
8. **Works** — "horizontal public / vertical private" separated completely; the roof solves what a second lobby would cost.
9. **Fails** — everything is downstream of two transitions; arrival happens inside a mall, so the hotel has no forecourt dignity; documented operational trouble (cost delays, a power failure during a speech, a 665,000-member data leak) and a shared roof that depends on staged construction ("five distinct joined plates").
10. **Transferable** — COPY: a shared service podium feeding N identical plates; **capacity-match amenities against total headcount, not room count**; make the connector an attraction so it absorbs footfall rather than blocking it. Grid form: amenity floors sized by `occupants × m²/person` (§12.1), distributed hubs (§21.1 #12), one public face and one service face per level. DON'T COPY: 55-floor stacks, strut structure, mall-embedded arrival.

## 23.4 Case 4 — Pavilion-plan hospital (Nightingale doctrine → US Civil War field hospitals)

Sources: [Civil War Medicine: pavilion hospitals](https://www.civilwarmed.org/surgeons-call/pavilionhospitals/) · [pavilion plan / Nightingale ward figure](https://www.researchgate.net/figure/Pavilion-Hospital-Design-plan-of-Nightingale-ward-The-pavilion-plan-consisted-of-a_fig10_387112114) · [Wellcome Collection on Nightingale and design](https://wellcomecollection.org/stories/florence-nightingale--victorian-design-and-the-treatment-of-covid-19)

1. **Zoning** — one pathology per building: separate ward pavilions; kitchens and service blocks "stood separately"; latrines downwind; administration in its own block.
2. **Circulation** — pavilions "spaced double their height apart" and "connected by corridors or walkways": a covered primary loop, short secondary spines into each ward.
3. **Service** — food, linen and waste move on the *outer* loop between pavilions, never through occupied wards; clean/dirty separated geometrically, not by shafts.
4. **Adjacency** — ward ↔ own latrine and entrance; kitchen ↔ service yard; and inside the ward, the Head Nurse's dayroom with an "observation window into the patient area".
5. **Security** — contagion control *is* access control: a pavilion holds one cohort, so quarantine is closing one node.
6. **Bottlenecks** — site-wide travel in bad weather; every ward competing for the same junction; central kitchens far from the far pavilions.
7. **Expansion** — the purest add-a-module plan in history: Nightingale's 20-32 patients per pavilion, 80-128 ft length, 30 ft maximum width; Chimborazo reached 150 pavilions, Mower 50 arranged in a circle.
8. **Works** — cheap repeatable unit, cross-ventilation, fail-isolation, trivial extension, sightline supervision, no shared egress.
9. **Fails** — its premise (miasma) was wrong; land and roof per bed are terrible; the loop is the only weather-protected route, so an enclosed version collapses back into the block plan; it cannot host lifts, imaging or flexibility.
10. **Transferable** — COPY: cohort-equal units + a covered connector loop; a hard spacing rule (gap = 2 × height) as the light/air modifier; one supervising node with an explicit sightline into the occupied room (§18.5); service circulation separated from occupant circulation *geometrically* (§11.3). DON'T COPY: miasma reasoning, single-storey growth, distance-free service runs.

## 23.5 Case 5 — Prison: Eastern State Penitentiary's radial plan vs the direct-supervision pod

Sources: [Eastern State Penitentiary](https://en.wikipedia.org/wiki/Eastern_State_Penitentiary) · [Jail — podular / direct supervision](https://en.wikipedia.org/wiki/Jail) · [NICIC podular/direct-supervision audits (PDF)](https://s3.amazonaws.com/static.nicic.gov/Library/013633.pdf) · [BSCC Jail Design Guide (PDF)](http://www.bscc.ca.gov/wp-content/uploads/024806.pdf) *(the two PDFs were not machine-readable in this session — no numbers are quoted from them)*

1. **Zoning** — ESP: "hub-and-spoke plan", an "octagonal center connecting seven radiating single-story cell blocks", each block one population. Podular: repeated self-contained pods + a separate program/service district.
2. **Circulation** — spokes are single-purpose movement tubes from one watchtower; all movement is radial, out and back through the hub. In pods, the **dayroom is the circulation generator**: cells open inward onto it, the pod opens onto the yard.
3. **Service** — meals/linen delivered down the spoke from the hub; pods handle trays and laundry per pod so service runs stay short.
4. **Adjacency** — the defining pair is *cell → observable common space*: cells tiered "around a central control station or desk".
5. **Security** — ESP: the "center tower whence the prison could be kept under constant surveillance" (conceptually Bentham's panopticon, where "guards could see into all of the cells"). Podular: 16-50 prisoners per pod, "a few prison officers, or sometimes only one, supervise each pod" — control delegated to the pod desk; sequential gates/interlocks at every junction.
6. **Bottlenecks** — the hub: every movement crosses the same octagon, so a disturbance is visible *and* blocks the only route; radial designs gave "only intermittent observation" once blocks grew to two or three tiers.
7. **Expansion** — ESP added blocks, each new spoke lengthening everyone's run; pod campuses stamp pods against a utility spine (the pavilion plan re-derived).
8. **Works** — one observer per N cells; classification expressed as which spoke you are locked in; total legibility of movement.
9. **Fails** — ESP works only single-storey, was the largest and most expensive public structure the US had erected, and did not hold (overcrowding; solitary ended by 1913; closed as a state prison 1970). Radial geometry is the worst shape for growth. Direct supervision trades that for staff exposure the plan cannot reduce.
10. **Transferable** — COPY: the small supervised unit (cells + shared dayroom) as the repeatable block; a hard occupancy cap per control node (real: 16-50); one checkpoint per zone transition; the observation post *inside* the noise, not above it. Grid form: a dayroom of ≥ 30-60 tiles serving 8-16 cells, one controlled door, the "post" fixture on the dayroom side (§2.7 `bench`/`signage`/`control-panel`). DON'T COPY: sightline physics (a game's sight is free, so over-provide it) and the land cost per spoke.

## 23.6 Case 6 — The pure plate: 860-880 North Lake Shore Drive, Mies, 1948-51

Sources: [860–880 Lake Shore Drive](https://en.wikipedia.org/wiki/860%E2%80%93880_Lake_Shore_Drive) · [typical floor plan 3-26, Art Institute](https://www.artic.edu/artworks/218068/860-880-north-lake-shore-drive-typical-floor-plan-floors-3-26) · [ArchDaily AD Classics](https://www.archdaily.com/59487/ad-classics-860-880-lake-shore-drive-mies-van-der-rohe)

1. **Zoning** — two 26-storey towers; nothing public on the plate at all.
2. **Circulation** — a single "structural core for elevators, stairs, hallways, bathrooms, and kitchens"; **two elevators serve all stories**.
3. **Service** — famously minimal: residents complained of "no garbage chutes"; no service separation.
4. **Adjacency** — wet rooms and kitchens cluster at the core so all plumbing is one stack per unit group; living/sleeping pushed to the glass.
5. **Security** — one lobby, one corridor, no public/private gradient; privacy from low neighbour count per floor.
6. **Bottlenecks** — 2 lifts for 26 floors; the core corridor is the only route.
7. **Expansion** — none on the plate; growth was the second tower.
8. **Works** — an absolute module: "a grid of square bays measuring 21 feet (6.4 m)", mullions "5+1⁄4 feet (1.6 m) apart", columns protruding "about 9 inches (23 cm) into each bay"; unit mix by *count of bays* (4 apts/floor at 1,400 ft², 8/floor at 700 ft²) — same plate, two densities.
9. **Fails** — the discipline became the criticism: exposed beams called "functionally useless", no air conditioning, leaks, and residents fighting the open plan — the pure plate underestimated how much private subdivision people demand.
10. **Transferable** — COPY: a fixed bay module where every room is an integer number of bays (§20.4 — the repo's 7/9/12/19-column set is exactly this); the core as the wet/service cluster; **unit size = bay count**, so one plate serves two tiers; treat minimal vertical circulation as an explicit trade, not a saving. DON'T COPY: no-chute/no-service-elevator minimalism — in a hotel sim staff travel *is* the gameplay (C-9).

## 23.7 Case 7 — A RimWorld colony plan

Sources: [RimWorld wiki: Room](https://rimworldwiki.com/wiki/Room) (see §5 for the mechanic table) · [Steam: Colony Building Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=1805503731) · [r/RimWorld layout thread](https://www.reddit.com/r/RimWorld/comments/j4rml2/guide_for_efficient_colony_and_room_layouts/)

1. **Zoning** — sleeping at the edge, production in the centre, freezer and kitchen adjacent, dumping and gates on one edge ("Bedrooms should be at the edge of the colony", kitchen "right next to your Freezer").
2. **Circulation** — wide internal lanes, deliberately narrow external approach ("one or two entrances with lots of defenses"); mining lanes "2 tiles between each other".
3. **Service** — the stockpile is the load-bearing node; central mass, but "avoid tiles adjacent to the doors" so haulers never queue in a doorway.
4. **Adjacency** — adjacency is sim-driven: freezer↔kitchen (spoilage/meal quality), kitchen↔dining, hospital off the corridor with doors open, bedrooms away from traffic.
5. **Security** — the airlock is the atomic device: "a door, a short space, and then another door"; enclosure defines the room ("A room is a space fully enclosed by impassable objects such as walls, doors, vents, rock, or coolers", "Corners do not need to be filled in order to enclose a room").
6. **Bottlenecks** — door tiles as single-tile funnels; stockpile door-adjacency; dining search radius — pawns look for a table "within a 20 tile radius", so one vast refectory serves far fewer than three spread halls *(folk attribution: the documented mechanics are the 18-cell joy-object radius and the meal thoughts — §5.1, §5.6)*.
7. **Expansion** — ring growth, with the room-scoring math re-evaluating automatically on every extension.
8. **Works** — the layout is an honest expression of the scoring functions (space = 1.4 × tiles; bands from cramped to extremely spacious; beauty averaged with a small-room penalty; cleanliness = tile average, feeding surgery, research and meal safety).
9. **Fails** — it optimises score, not meaning: hyper-enclosed plans make unreadable warrens; small rooms are penalised so the "efficient 3 × 4 bedroom" is mathematically punished; there is no corridor width, egress or wayfinding cost, so a plan that would be an illegal building scores perfectly. Raids punish the same optimisation daily play rewards.
10. **Transferable** — COPY: aggregate per-room scoring that rewards enclosure + size bands; keep the tiles beside doors free; service radii (a "within N tiles" rule) as a placement constraint; the airlock primitive; penalise small rooms, do not only reward big ones. DON'T COPY: score-maximal 6 × 6 warrens, or treating a door as infinite throughput (§10.8 exists precisely because of that error).

## 23.8 Case 8 — A Prison Architect mega-prison (community guide geometry)

Sources: [Steam: Rooms sizes and efficiency](https://steamcommunity.com/sharedfiles/filedetails/?id=327709860) · [Steam: How to properly set up a kitchen and canteen](https://steamcommunity.com/sharedfiles/filedetails/?id=1753327954) · [Steam: HOW TO BUILD A PRISON (2020)](https://steamcommunity.com/sharedfiles/filedetails/?id=379397146) · [r/prisonarchitect layout critiques](https://www.reddit.com/r/prisonarchitect/comments/1ams0zf/first_prison_layout_about_5_hours_in_what_do_i/) *(community-derived balance figures, not official dev data)*

1. **Zoning** — cell blocks as identical stamped units; a service district (kitchen 29 × 26 ft, shops 22 × 14, laundry, storage) with "centralized storage aid[ing] logistics"; staff rooms "close by the offices".
2. **Circulation** — block footprints tuned to walk time and staffing: protective custody 34 × 32, minimum 70 × 27, medium 64 × 23, death row 65 × 16; "**4 WIDE for main walkways**" because "smaller walkways will cause problems".
3. **Service** — hard ratios: 1 serving table = 2 cookers, 1 cooker = 2 refrigerators, one serving table ≈ 40 prisoners; laundry 2+4+8; bins at the point of generation.
4. **Adjacency** — "canteens belong adjacent to dormitories to reduce crowding"; hospital beds close together (nurse radius); appliances near each other "to prevent wasted movement" — **staff path cost is the currency**.
5. **Security** — "maintain at minimum 10 squares [of] buffer from outer walls"; layered detectors ("Metal Detectors AND Dog Patrols"); "double jail doors" as interlock.
6. **Bottlenecks** — the named one: "one large canteen … will force all of your inmates to migrate toward it"; counters below the 1:40 ratio; single-door block entries.
7. **Expansion** — add another *small* canteen/block rather than enlarge one; room-size thresholds gate function (cells "not exceeding 2 × 3", offices "4 × 4 is just fine", classrooms "maximum 20 prisoners"); and "plans define internal space — add two per dimension to foundation sizes" — walls sit *outside* the counted area.
8. **Works** — it is the pavilion plan re-derived from pathfinding: identical cells + shared dayroom + distributed dining + a perimeter buffer.
9. **Fails** — stat-threshold gaming beats architecture: a room built to satisfy "classroom ≤ 20" is a box, not a place; the 10-tile buffer and 4-wide walkways burn land past ~500 inmates; ratio-driven kitchens become appliance grids nobody can cross; because inmates need only *a* destination, players build single-purpose sprawl that fails every real wayfinding and program test.
10. **Transferable** — COPY: **ratio-based service sizing** (staff/appliance : population), distributed amenities at the travel optimum, walkway width tiers (main 4 / secondary 2), a perimeter buffer, double-door interlocks at zone boundaries, and furniture-free tiles in front of doorways. Grid form: `capacity = spots` (§2.4) with the PA ratio discipline; §12.2's width tiers; §10.8's utilisation ceiling. DON'T COPY: 2 × 3 cells and the total absence of daylight/egress constraints.

## 23.9 Cross-case synthesis

**Recurring across real and game.** (1) A repeatable unit plus a differentiated commons — identical guest plates, 20-32-bed pavilions, 16-50-person pods, PA cell blocks, RimWorld dorms; only the commons changes shape. (2) One primary spine, short secondary stubs, and **one transition node — which is where every case's failure actually happens** (Kansas City's bridges, MBS's SkyPark and lifts, PA's single mega-canteen, RimWorld's door tiles). (3) Adjacency dictated by one shared infrastructure object: paired bathrooms → one shaft, the core as the wet stack, cooker:serving-table ratios, freezer↔kitchen, control desk ↔ cells. (4) Supervision treated as a layout resource. (5) **Growth by stamping, never by editing.** (6) Buffer/sterile zones everywhere: PA's 10-tile wall buffer, the airlock, pavilion spacing at 2 × height, hotel service cores kept out of guest sight.

**Only in real buildings — and why a grid agent still cares.** Stack alignment, daylight and cross-ventilation as hard shapers, egress travel distance, acoustic party walls, crowd live-load, cost per bed, landmarks because humans have no minimap, maintenance access, and the prestige-void-vs-rentable-plate trade. None of these is enforced here (§20.6), and all of them are what makes a plan *read* as designed: they generate the corridor widths, the periodic cores, the landmark room and the public→private gradient — the affordances a viewer navigates by and a reviewer scores.

**Only in games — and the mechanic behind them.** Aggregate room scoring (RimWorld's space/beauty/cleanliness functions), radius-based service queries (the 20-tile dining search), ratio-based sizing (1 table : 40 inmates), enclosure semantics decoupled from geometry ("corners do not need to be filled"; "add two per dimension"), the door as an unlimited-throughput single tile, and free sight/supervision. Each of these has a direct analogue in this project's code — fixture-tag room typing, `focusTags` targeting with `crossFloorChance`, `interact.capacity`, `tileStates` + flood fill, walkable door cells, and no visibility system at all (§2).

**Where they diverge, and what the good designs chose.**
- *Efficient spine vs legible spine:* Statler chose the long spine; the mature game guides choose 4-wide walkways and cleared doorway tiles, and get legibility only incidentally. **Verdict: take the efficient spine, force one differentiated node every K rooms** (§18.3) — cheap in tiles, high in quality.
- *Atrium void vs rentable plate:* Portman chose the void and the industry copied it; MBS chose the hybrid (one prestige void at the base, efficient plates above). **Verdict: put the void where it serves the plates, not between them.**
- *Radial supervision vs rectangular grid:* the radial plan is the "correct" supervision geometry and it failed as a growable building; pods, PA and RimWorld all choose the rectangular unit with the control point inside the crowd. **Verdict: the grid wins whenever growth is expected** (§25).
- *Centralisation vs replication:* games centralise because hauling is scoreable; real hotels and PA's own canteen advice distribute at the travel optimum because *simultaneous* demand spikes. **Verdict: distribute at the travel optimum; centralise only what must be pooled** (cold storage, laundry plant, the kitchen line).
- *Density vs separation:* every mature case buys the buffer; only naive play maximises tiles per room (C-5, C-11).
- *Stat-optimal rooms vs meaningful rooms:* the sharpest divergence — and the reason §22.2 keeps three realism investments (zoning purity, legibility, module discipline) even though nothing in the engine pays for them.

# 24. Common mistakes (anti-pattern catalogue)

Ordered by how early they must be caught. `Symptom` is what a reviewer or the sim shows; `Fix-stage` says which design step owns it.

## 24.1 Program and zoning

| # | Anti-pattern | Symptom | Cause → Fix | Fix-stage |
| --- | --- | --- | --- | --- |
| M-1 | Unprogrammed plan | rooms "about the right size", no BOH, storage missing at the end | no §4.2 matrix → write it first | STEP 1-2 |
| M-2 | Zone inversion | a service room is more integrated than the lobby (§19.4) | adjacency not zoning → redraw the zone map before rooms | STEP 4 |
| M-3 | The archipelago zone | one zone in three patches, each with its own circulation | rooms placed into leftover space → re-cluster | STEP 4 |
| M-4 | Perimeter given to Z5/Z6 | stores and plant on the good façade, guests on the yard | services placed first because they are rigid → services get the *worst* face, not the best position | STEP 6 |
| M-5 | Amenity island | a pool floor reachable only by crossing two other zones | no pre-function → give amenities a hub | STEP 5 |

## 24.2 Circulation

| # | Anti-pattern | Symptom | Cause → Fix | Fix-stage |
| --- | --- | --- | --- | --- |
| M-6 | 1-tile two-way route | agents stall/repath; `maxRepathAttempts` burn; nobody arrives | width below passing (§12.1) → widen to 2-4, or make it one-way by design | STEP 6 |
| M-7 | Corridor as leftover | the plan's spine wobbles, bends every 6 tiles | no parti (§3 P-1) → redraw lines first | STEP 6 |
| M-8 | Queue on the primary | reception blocks the lobby, lift hall blocks the spine | no queue pocket → `maxMembers` tiles off-route | STEP 11 |
| M-9 | Door-to-door facing pair | two rooms fighting over 2 tiles of corridor | door placement unexamined → stagger ≥ 2 tiles or widen | STEP 9 |
| M-10 | The hedge | a corridor with 10+ doors in 20 tiles | undifferentiated access → group rooms behind a shared vestibule | STEP 8 |
| M-11 | One route in and out | peak collapses; egress test fails | no second portal group/stair (C-10) → add the second way before adding rooms | STEP 5 |
| M-12 | Service route through the guest zone | trolleys in the lobby | §11 not built → parallel spine (or accept and state it, §11.3) | STEP 5 |
| M-13 | Giant open hall as the solver's frontier | occasional no-path/stall on long routes (§2.3) | too little structure → introduce doors/bays to bound the search | STEP 6 |

## 24.3 Rooms, doors, furniture

| # | Anti-pattern | Symptom | Cause → Fix | Fix-stage |
| --- | --- | --- | --- | --- |
| M-14 | Unfurnished room | the engine types it `hall`; NPCs never "use" it | no defining fixture (§2.4) → place the fixture family, then judge the room | STEP 8 |
| M-15 | Bed as a wall | no aisle; the wardrobe cannot open | footprint without use clearance (§20.5) → apply the aisle-by-use rule | STEP 8 |
| M-16 | Bathroom off the corridor line | first-step violation, privacy complaint (§17.2) | door placed for tiles not for view → move the door, add the entry column | STEP 9 |
| M-17 | Fixture with a blocked spot | interaction never happens; the task silently fails | §15.4 clearance skipped → free the tile in front of the spot | STEP 10 |
| M-18 | Sliver space | 1-tile pockets, unreachable, unuseable | double wall lines / non-snapped rooms (§20.3) → seal or absorb | STEP 7 |
| M-19 | Arbitrary room sizes | 5-, 11-, 14-column bays with no rhythm | no module (§20.4) → choose the pitch, snap everything to it | STEP 6 |

## 24.4 Services, structure, vertical

| # | Anti-pattern | Symptom | Cause → Fix | Fix-stage |
| --- | --- | --- | --- | --- |
| M-20 | Scattered plant | an `ahu` in every spare corner, no riser logic | services treated as filler (§15.3) → consolidate per demand, on the stack line | STEP 10 |
| M-21 | Wandering wet walls | bathroom on the left on floor 4, right on floor 9 | stacking ignored (§13.4) → one canonical core + one wet line | STEP 6 |
| M-22 | Shifting core per floor | the tower reads as 21 unrelated floors | canonical cells not repeated (`generate-hotel.mjs:897`) → freeze the core | STEP 6 |
| M-23 | One lift, many floors | the whole hotel queues at 4 cells | §13.2 not computed → size the bank from demand | STEP 11 |
| M-24 | Stair in one corner only | egress check fails (`generate-hotel.mjs:831`) | one exit → two remote groups | STEP 5 |

## 24.5 Engine-specific traps (this project only)

| # | Trap | What happens | Rule |
| --- | --- | --- | --- |
| M-25 | Separation by geometry, no tags | guests walk into the BOH because the *fixture* is targetable (§2.4/§11.5) | tag it `back-of-house`/`mechanical` |
| M-26 | Access by "locked door" | nothing locks; agents path through door tiles | use tags + zone geometry, never an implied lock |
| M-27 | Spawn zone on an unreachable tile | a role never appears; the floor looks understaffed | zone tiles must be walkable and one hop from the primary (§10.6) |
| M-28 | One object doing two jobs | a `soiled-linen` shelf reading as clean linen | clean and dirty are different assets on different walls |
| M-29 | Walls thicker than 1 tile | the validator calls a 2×2 blocked mass a failure | single-tile wall lines only (§2.2) |
| M-30 | Past a persistence cap | the whole save stops working (atomic validation) | count objects and assets against `limits.ts` (§2.1) as a design budget |
| M-31 | "Realistic" claims the engine cannot show | a design note about light, sound, temperature or views reads as understanding the sim and does not | state it as realism intent, per §20.6 / §22.2 |

## 24.6 Reading the simulation as a diagnosis

| Observed | Most likely layout cause |
| --- | --- |
| Agents stall mid-corridor | width < passing (§12.1) or a door pair discharging into each other (M-9) |
| Repeated repath/abandon near one area | a blocked/unreachable interact spot (M-17) or a solver frontier (M-13) |
| A zone nobody enters | its fixtures lack the role's `focusTags` — functionally invisible (§18.5 note) |
| A queue that never drains | capacity < demand (§10.8) — a width fix will not help (C-6) |
| Rooms read as `hall` | no defining fixture (M-14) |
| Cross-floor traffic collapses at peak | lift bank + hall sizing (M-23, §13.2) |
| Guests appearing in service areas | tag leak (M-25) |

**CONFIDENCE** - M-1 to M-31 each trace to a rule stated earlier in this document (the §-refs are given), and the engine-specific traps M-25 to M-31 are **[repo]** code-verified (**HIGH**). The symptom-to-cause table in §24.6 is a diagnostic heuristic (**MEDIUM**): one symptom can have two causes, so read it as where to look first, not as a conclusion.


# 25. Expansion strategies

**RULE** Design the second version of the building at the same time as the first: the layout must be able to double without cutting a room in half, and the parts that are expensive to move (core, service spine, portal bank, structural rhythm, spawn zones) must be placed for the *final* size.

## 25.1 The five growth axes and what each needs reserved

| Axis | Real move | Grid reservation |
| --- | --- | --- |
| **Repeat the module** | more rooms on the same rhythm | keep the bay count ≤ the spine's reach budget (§13.3); reserve the spine end as a stub with a `blocked` future-door |
| **Stack** | more floors | the core must already carry the spare shaft cell (1 spare portal + 1 spare riser); portal capacity sized for the final floor count (§13.2) |
| **Duplicate the hub** | second core / distributed hubs (§21.1 #12) | keep the *plate* splitable: a neutral band (circulation/store) at the future join rather than a room |
| **Extend the spine** | a new wing | the spine must terminate at an expandable edge, and the BOH spine too — a service spine boxed in by walls cannot grow |
| **Convert** | reuse a floor (office→residential, retail→F&B) | keep one floor's program weakly attached: no room on it deeper than the daylight band, its wet wall adjacent to the stack |

## 25.2 The 2× test (brief step 15 as a procedure)

1. Pick the growth axis above. 2. Draw the *new* parti line on the existing plan without deleting anything. 3. Check: does the new wing need a new portal group? A new service door? A new spawn zone? A new plant block? 4. Check that the existing spine still satisfies §12.2 widths at the doubled flow. 5. Check capacity: re-run §10.8 with 2× demand, and re-run §13.2 with 2× rooms. 6. Name the thing you must delete — if the answer is "a room that works today", the current plan is already wrong.

## 25.3 Capacity margin rules

- Lift bank: size for the *final* room count; cars are cheap to add on this grid (2 × 2 cells), halls are not.
- Plant: leave one `ahu`-sized void per amenity cluster; the void is the margin.
- BOH satellite per guest floor: sized for the final floor count (a 3 × 4 satellite does not serve 40 keys).
- Services spine width: 4 tiles where the current flow needs 3 (trolley growth).
- Waste/soiled capacity: the most under-sized thing in every game hotel.

## 25.4 Phasing (what to build first, and in what order)

Phase 1 = the skeleton: envelope line, core, portal bank, service spine, primary spine, spawn zones for staff. Phase 2 = the revenue program on the good façade (guest rooms, F&B). Phase 3 = the BOH satellites and amenity fit-out. Phase 4 = the polish (signage, plants, screens). This ordering is the same argument real practice makes — "structure and services before partitions, partitions before finishes" — and here it has a mechanical payoff: nothing later has to be deleted, because the expensive parts were placed while they were still cheap.

## 25.5 Anti-expansion patterns

Building the plan to the edge of the canvas; a core surrounded on all sides by rooms; the only service door on the future growth face; one portal per floor with no spare cell; a program whose BOH scales with the *current* (not final) floor count.

**CONFIDENCE: HIGH** for the strategy (P-9 and §23.9: every mature case grows by stamping, none by editing), **MEDIUM** for the specific reservation sizes, which are this document design budgets rather than measured thresholds.


# 26. Evaluation framework

## 26.1 The five levels (the brief's final standard) as testable gates

| Level | Claim | Verified by |
| --- | --- | --- |
| 1 FUNCTIONAL | everything works | tests T-1…T-6 (hard pass/fail) |
| 2 EFFICIENT | movement and logistics reasonable | T-7…T-11 (measured against budgets) |
| 3 REALISTIC | believable architectural logic | T-12…T-16 + §22 conflict register |
| 4 SCALABLE | expands without collapse | T-17 (§25.2 2× test) |
| 5 COHERENT | a designed system, not placed rooms | T-18 (parti stated + rhythm + zoning-integration monotonic + no slivers) |

## 26.2 The metric set

| Metric | Formula (tile grid) | Target |
| --- | --- | --- |
| Lettable ratio | lettable tiles / gross tiles, per floor | ≥ 0.72 guest floors, ≥ 0.60 service floors |
| Circulation share | `hall`-typed tiles / gross | 0.12-0.25 (§10) |
| Weighted adjacency score | §19.3 #7 | compare candidates; lower wins |
| Reach | max graph distance lift hall → room door | ≤ 24 tiles (§13.3) |
| Passing exposure | 1-tile cells on high-choice routes | 0 on primary, ≤ 5 % on secondary |
| Fixture utilisation | §10.8 | ≤ 0.7 normal / ≤ 0.9 peak / never > 1.0 |
| Queue adequacy | free tiles within 2 of spot vs `maxMembers` | ≥ 1 tile per queued member |
| Standable spots | interact spot tiles reachable without crossing a wall | 100 % |
| Daylight coverage | required-daylight rooms in band | ≥ 0.6, zero black-out required rooms |
| Zoning monotonicity | integration rank vs zone level (§19.4) | inversions ≤ 2, none above one zone step |
| Module discipline | distinct bay widths used | ≤ 4 values, all from the grammar (§20.4) |
| Waste | sliver + dead-end + double-wall tiles / gross | ≤ 3 % |
| Core canonicality | same core cells on every floor | 100 % |
| Cap safety | objects, assets, tiles, payload vs `limits.ts` | ≤ 90 % of every cap |

## 26.3 The throughput worked example (the arithmetic to copy)

A floor of 40 keys with 70 % occupancy ≈ 56 guests; check-out peak concentrates ~25 % of a day's movement in 45 min. If 30 guests queue at reception and the desk is cap 4 at a mean 8.5 s (`reception-desk`, §2.7): service rate = 4 / 8.5 = 0.47 per s ≈ 28 per minute, so 30 arrivals clear in ~65 s *provided nothing else uses the desk* — but arrivals also cross `task-lobby-post` and the lift hall, and `queue.maxMembers = 4` means only 4 stand in the queue before the fifth is "elsewhere" in the sim. The layout obligation is therefore: ≥ 4 tiles of queue pocket at the desk front, ≥ 6 tiles of lobby floor between desk and lift hall so the residual crowd is in the lobby and not in the corridor, and a 4-tile spine at the hall entry. **This is how a capacity claim becomes a tile requirement** — and it is why "make the lobby bigger" is a symptom-level fix.

## 26.4 The sim as post-occupancy evaluation

Run the layout (editor preview or runtime) and read behaviour rather than intent: stalled agents, repath/abandon counts, per-cell occupancy, queue growth at each fixture, and rooms typed `hall` that should not be (§24.6 maps symptom → cause). Report the observation with the metric it violates. **RULE (hard):** when the sim is runnable, no layout claim is "verified" without it — the design brief's own instruction is "do not claim a layout works without testing it when testing is possible".

## 26.5 Scoring discipline

Never present a score as proof. The weights in §4.3 are a convention; the utilisation numbers are only as good as the demand assumption; the `hall`-share metric counts a designed lobby as circulation and would penalise a good plan. Use the numbers to **find the three worst things about the layout**, then argue about them in words. A layout that scores well and reads badly has a real defect; a layout that scores badly on one metric and is explainable on it (the lobby, the oversized lift hall) is fine — say which case you are in.

## 26.6 The report format (aligned to the design brief's output)

Produce §1 Program → §2 Zoning → §3 Adjacency → §4 Circulation → §5 Grid/module → §6 Layout → §7 Utilities → §8 Human movement → §9 Wayfinding → §10 Security → §11 Expansion → §12 Problems discovered → §13 Improvements made → §14 Final reasoning, with every important choice as `DECISION → REASON → EVIDENCE (this KB's §-ref) → TRADE-OFF`, and the §26.2 table filled in with measured values.

## 26.7 The hard checklist (fail-fast, in this order)

1. Every fixture's interact spot reachable (M-17). 2. No 1-tile two-way route (M-6). 3. Two independent exits per occupied zone (M-24). 4. Tags match zones (M-25). 5. Rooms typed by fixtures (M-14). 6. Walls single tile, no 2×2 masses (M-29). 7. Core repeated per floor (M-22). 8. Caps inside `limits.ts` (M-30). 9. Utilisation < 1.0 at every fixture. 10. Reach ≤ 24 tiles. Then, and only then, judge the plan's quality (levels 3-5).

**CONFIDENCE** - every metric in §26.2 is computable from **[repo]** data (tile states, typed rooms, spots, capacities, caps: HIGH); every *target value* is an argued design budget (**MEDIUM**) except the throughput arithmetic of §10.8 and §26.3, which is arithmetic on verified capacities (**HIGH**). §26.5 states how to read a score without mistaking it for proof.


# 27. Synthesis: what is universal, what is real-world, what is game, what is taste

Every claim in this document is classable into one of four buckets. The design agent must use the bucket when it argues, because the bucket decides how much the claim is worth.

## 27.1 UNIVERSAL — true in real architecture and in the game

1. A plan needs a parti; a collection of rooms is not a building (§3 P-1).
2. Program before geometry; areas, users, adjacencies, services written down first (§4).
3. Frequency-weighted adjacency beats impressive adjacency (§3 P-3).
4. Circulation is a hierarchy with five systems, and its share is a number (§10).
5. Separation is bought with buffers, not with distance (§4.4).
6. Chains of one-directional flows must be laid out as chains (delivery→store→kitchen→pass→return→waste) (§11.2).
7. Widths come from bodies and their activities, and no single corridor width is right everywhere (§12.2).
8. Public-to-private transitions are thresholds and need more than one step (§17).
9. Legibility requires a few distinct decision points, and the widest continuation is the one people read as "the way" (§18).
10. Integration/depth ranking should follow the privacy gradient; inversions are defects (§19.4).
11. A design is for its final size; reserve the expensive-to-move parts (core, spine, portal bank) (§25).
12. Non-revenue space (BOH, housekeeping, waste, plant, staff) is what makes a service building work; deleting it is a failure, not a saving (C-9).
13. Structure and stacks repeat; variation comes from program, not from geometry (§13.4, §14).
14. **Schedule is a spatial instrument** - a simultaneous-release population defeats any facility sized for average load; stagger it or clone the facility, but never just widen the door (§6.3, §10.8, §13.2).
15. Throughput is the minimum of door, server, seat and fixture, so design the queue apron and check the weakest link, not the prettiest one (§6.3, §10.8).

## 27.2 REAL-WORLD — physical/human-factor, adopted for credibility and quality, not enforced by the engine

1. Acoustic and olfactory separation (§17.3) — nothing models it; the layout moves that produce it are free, so produce them.
2. Daylight and view quality as *comfort* (§16) — no sun, no light level; the allocation logic is still the right allocation logic.
3. Thermal comfort, smoke control, sprinklers, fire ratings (§15) — expressed only as placement (two exits, plant away from guests).
4. Structural truth: spans, transfer, load paths (§14) — expressed as rhythm and columns, not as forces.
5. Code compliance numbers (ADA-style widths, travel distances) as *metric* values (§12.7) — the grid rounds them; state the rounding rather than claiming compliance.
6. Accessibility as dignity (queue frontage, turning areas, seated clearances) — the sim has no mobility diversity, so it is a human-reviewer value here.
7. Operational realism: staff routes, shift change, linen, refuse (§11) — partly enforced by tags, mostly by geometry.
8. Aesthetics that carry information: symmetry at the arrival axis, a revealed ceiling-free axis, module rhythm — valued because they signal competence.

## 27.3 GAME-SPECIFIC — caused by mechanics (here: by verified code)

1. Vertical travel is a portal interaction with a cooldown; there is no stair flow (§2.4, §13.1).
2. Access control is tag-based, not lock-based (§11.5, M-25/26).
3. Rooms are recognised from fixture tags; an unfurnished room is a hallway (§2.4, M-14).
4. Movement cost is tile-steps with legal diagonals and no turn cost; corners are free, so the "minimise bends" folk rule has no mechanical basis (§2.3).
5. Agent body ≈ 1 tile, so 1-tile corridors are physically single file (§12.1) — a *stronger* constraint than the real world's 0.6 m.
6. Capacity = interact spots; queue length = `maxMembers`/`admissionDepth` tiles (§2.4).
7. Walls are 1 tile thick, and a 2×2 blocked mass is rejected (§2.2).
8. Persistence caps are design budgets (§2.1, M-30).
9. A\* iteration caps make giant open halls a fragility (§2.3, M-13).
10. There is no height, so double-height spaces, mezzanines and ceiling services do not exist (§2.5, §20.6).
11. No crowding/comfort penalty per area, so occupancy is a chosen ceiling, not a constraint (C-5).
12. Spawn zones are trip origins; a role appears where its zone is (§10.6).

## 27.4 OPTIONAL — taste, and how to keep it taste

Corridor aesthetics, symmetry, decorative massing, "grand" lobbies, room-count-vs-size preferences, thematic zoning (which style of resort), and the choice between two equally valid parti moves. **RULE** an aesthetic choice is stated as one, with the cost it accepts (`DECISION → TRADE-OFF`), and never promoted into a rule. When a preference is repeated across several designs and defended with real-architecture language, promote it deliberately into REAL-WORLD and give it a source — or delete it.

# 28. Source list

*Assembled from the research passes; every entry is a URL actually consulted in this build (pass A real-architecture/standards, pass B RimWorld community, pass C Prison Architect, pass D case studies). Repo-internal facts are cited in-line with `file:line` throughout and are not repeated here.*

Legend: **[fetched]** = content read in this session · **[searched]** = returned by a live web search in this session, title/snippet-level use only · **[book]** = established reference cited by title and author, not fetched, and *no claim in this KB rests on it alone* · **[repo]** = this project's own code/data.

## Standards, codes and accessibility

- 2010 ADA Standards for Accessible Design — §403 walking surfaces (clear width 36 in, 32 in short segments, 60 in passing spaces), §304 turning space — https://www.ada.gov/law-and-regs/design-standards/2010-stds/ **[searched]** — used in §3 P-5, §12.1, §12.7
- US Access Board, ADA Chapter 4: Accessible Routes — https://www.access-board.gov/ada/chapter/ch04/ **[searched]** — same content, chapter view
- UpCodes, ADA 304.3.2 T-Shaped Turning Space — https://up.codes/s/t-shaped-space **[searched]** — turning-area geometry, §12.5
- Corada, ADA Standard Section 403 – Walking Surfaces — https://www.corada.com/documents/2010ADAStandards/403 **[searched]** — §12.1
- "ADA Hallway Width Explained: Minimum, Clearance, and Turning" (All Things Inspector) — https://allthingsinspector.com/ada-hallway-width-requirements/ **[searched]** — §12.2 corridor widths commentary

## Architectural theory, method and references

- Ernst Neufert, *Architects' Data* — space/dimension/circulation/daylight/services tables **[book]** — §3 P-2/P-4/P-5/P-6/P-7, §12, §15, §16
- *Time-Saver Standards for Building Types* (Frampton et al.) — per-type area and circulation shares **[book]** — §3 P-4, §12.2
- Kevin Lynch, *The Image of the City* (1960); *Site Planning* — paths/edges/districts/nodes/landmarks **[book]** — §3 P-8, §18.1
- Bill Hillier & Julienne Hanson, *The Social Logic of Space* (1984); Hillier, "Space is the machine" — integration/depth/choice **[book]** — §19.1
- "Bill Hillier's Legacy: Space Syntax — A Synopsis of Basic Concepts", *Sustainability* 13(6):3394, MDPI — https://www.mdpi.com/2071-1050/13/6/3394 **[searched]** — §19 definitions
- *A Space Syntax Glossary* (arkitekturforskning.net PDF) — https://arkitekturforskning.net/na/article/download/778/722 **[searched]** — §19.1/§19.3 measure definitions
- Space Syntax Handbook methodology notes (NTUA Helios PDF) — https://helios.ntua.gr/pluginfile.php/302328/mod_folder/content/0/SpaceSyntax_Handbook.pdf **[searched]** — §19.3 computation
- Space Syntax glossary chapter (JSTOR open access) — https://www.jstor.org/content/oa_chapter_edited/j.ctt1g69z0m.22 **[searched]** — §19.1
- Springer reference entry "Space Syntax: Mathematics and the Social Logic of Architecture" — https://link.springer.com/rwe/10.1007/978-3-319-70658-0_6-3 **[searched]** — §19
- Richard Muther, *Plant Layout and Design* — Systematic Layout Planning and the relationship (REL) chart with A/E/I/O/U closeness ratings **[book]** — §3 P-3, §4.3
- Brand, *How Buildings Learn*; Preiser & Vischer on programming; Lawson, *Design for Planning** [book] — §3 P-9, §4.1
- Oscar Newman, *Defensible Space* (1972) — territoriality and threshold control **[book]** — §3 P-8, §17

## Hotel planning and design

- Hotel Development Guide, "Hotel Architectural & Design Team" — https://hoteldevelopmentguide.com/hotel-architect/ **[searched]** — §11, §23.1
- Hotel Development Guide, "Hotel Structural Design and Column Grid Planning" — https://hoteldevelopmentguide.com/hotel-structural-design/ **[searched]** — §14.1, §23.1 (spans, grid)
- MINGSUN, "Guide to Hotel Room Dimensions: Standards, Layouts and Design" — https://www.mingsungroup.com/article/guide-to-hotel-room-dimensions-standards-layouts-and-design.html **[searched]** — §12.6 benchmarks
- MINGSUN, "How to Design a Hotel Floor Plan" — https://www.mingsungroup.com/article/how-to-design-a-hotel-floor-plan-maximizing-efficiency-and-guest-experience-insights-by-mingsun.html **[searched]** — §12.2 corridor width 1.5-1.8 m, §23.1
- Studio Anyo, "Design Principles for DFMA Hotels" — https://studioanyo.com/design-principals-for-dfma-hotels/ **[searched]** — §23.1 (module, paired bathrooms, spans 7.0-8.5 m)
- Watg, "Back-of-House Design: How Architecture Shapes Luxury Service" — https://www.watg.com/back-of-house-design-how-architecture-shapes-luxury-service/ **[searched]** — §11.1
- AEC Associates, "Hospitality Kitchen & Back-of-House Layout Modeling Guide" — https://theaecassociates.com/blog/hospitality-kitchen-back-of-house-layout/ **[searched]** — §11.2 kitchen chains
- BOH Planning Guidelines (Scribd document) — https://www.scribd.com/document/677632319/BOH-Planning-Guide **[searched]** — §11.6 (secondary source, treat as indicative)
- Innowave Studio, "Room Sizes in Newly Built Hotels: A Scale-by-Scale Comparison" — https://www.innowave-studio.com/post/room-sizes-in-newly-built-hotels-a-scale-by-scale-comparison-and-impact-on-hotel-site-plans **[searched]** — §12.6

## Building-type case sources

- buffaloah.com, Statler Hotel (Buffalo) — https://buffaloah.com/a/archs/ej/bechs/stat1/index.html **[searched]** — §23.1
- architecture-history.org, hotel typology page — https://architecture-history.org/schools/HOTEL.html **[searched]** — §23.1
- Wikipedia, "Hyatt Regency Atlanta" — https://en.wikipedia.org/wiki/Hyatt_Regency_Atlanta **[searched]** — §23.2
- Wikipedia, "Hyatt Regency walkway collapse" — https://en.wikipedia.org/wiki/Hyatt_Regency_walkway_collapse **[searched]** — §23.2 (structural lesson)
- New Georgia Encyclopedia, "John Portman" — https://www.georgiaencyclopedia.org/articles/arts-culture/john-portman-1924-2017/m-10325/ **[searched]** — §23.2
- ResearchGate figure, plans of the 1967 Hyatt Regency — https://www.researchgate.net/figure/The-plans-of-the-1967-Hyatt-Regency-in-Atlanta-GA-USA-from-bottom-to-top-the-lobby_fig2_330235831 **[searched]** — §23.2
- Wikipedia, "Marina Bay Sands" — https://en.wikipedia.org/wiki/Marina_Bay_Sands **[searched]** — §23.3 (capacity 3,902; source conflict on storeys/rooms, flagged)
- Safdie Architects, "Marina Bay Sands Hotel and Skypark" — https://www.safdiearchitects.com/projects/marina-bay-sands-hotel-and-skypark **[searched]** — §23.3
- Civil War Medicine, "Pavilion-Style Hospitals" (Nightingale plan data) — https://www.civilwarmed.org/surgeons-call/pavilionhospitals/ **[searched]** — §23.4
- ResearchGate figure, pavilion hospital / Nightingale ward plan — https://www.researchgate.net/figure/Pavilion-Hospital-Design-plan-of-Nightingale-ward-The-pavilion-plan-consisted-of-a_fig10_387112114 **[searched]** — §23.4
- Wellcome Collection, "Florence Nightingale, Victorian design…" — https://wellcomecollection.org/stories/florence-nightingale--victorian-design-and-the-treatment-of-covid-19 **[searched]** — §23.4
- Wikipedia, "Eastern State Penitentiary" — https://en.wikipedia.org/wiki/Eastern_State_Penitentiary **[searched]** — §23.5 (radial plan, capacity/observation)
- Wikipedia, "Jail" (podular / direct-supervision, 16-50 per pod) — https://en.wikipedia.org/wiki/Jail **[searched]** — §23.5, §6.2
- NICIC, "Audits of Podular / Direct-Supervision Jails" (PDF, not machine-readable this session) — https://s3.amazonaws.com/static.nicic.gov/Library/013633.pdf **[searched]** — no figures taken from it
- BSCC, "Jail Design Guide" 3rd ed. (PDF, not machine-readable this session) — http://www.bscc.ca.gov/wp-content/uploads/024806.pdf **[searched]** — no figures taken from it
- Wikipedia, "860–880 North Lake Shore Drive" — https://en.wikipedia.org/wiki/860%E2%80%93880_Lake_Shore_Drive **[searched]** — §23.6 (6.4 m bays, 1.6 m mullions, 2 lifts)
- Art Institute of Chicago, "typical floor plan, floors 3-26" — https://www.artic.edu/artworks/218068/860-880-north-lake-shore-drive-typical-floor-plan-floors-3-26 **[searched]** — §23.6
- ArchDaily, "AD Classics: 860–880 Lake Shore Drive" — https://www.archdaily.com/59487/ad-classics-860-880-lake-shore-drive-mies-van-der-rohe **[searched]** — §23.6

## RimWorld

- RimWorld Wiki, "Room" — space score `1.4 × tiles`, furniture `-0.9 × covered tiles`, bands `< 12.5` cramped → `≥ 349.5` extremely spacious, impressiveness formula with the min-term, cleanliness/surgery/research links, enclosure definition — https://rimworldwiki.com/wiki/Room **[fetched]** (and the mirror https://rimworld.huijiwiki.com/wiki/%E6%88%BF%E9%97%B4 **[searched]**) — §5.1, §23.7
- Steam Community, "Colony Building Guide" — bedrooms at the edge, kitchen beside the freezer, stockpile door-adjacency, airlock, 20-tile table search — https://steamcommunity.com/sharedfiles/filedetails/?id=1805503731 **[searched]** — §5.2, §23.7
- r/RimWorld, "Guide for Efficient Colony and Room Layouts?" — https://www.reddit.com/r/RimWorld/comments/j4rml2/guide_for_efficient_colony_and_room_layouts/ **[searched]** — §7
- r/RimWorld, "what is the optimal room size?" — https://www.reddit.com/r/RimWorld/comments/663amn/hey_guys_what_is_the_optimal_room_size_the_most/ **[searched]** — §5.1 size bands as community practice
- Ludeon Forums, "8x7 or 7x7 Bedrooms?" — https://ludeon.com/forums/index.php?topic=32673.0 **[searched]** — §5.1 room-proportion debate
- Big Boss Battle, "Laying Out Your Base in RimWorld" — https://bigbossbattle.com/laying-base-rimworld/ **[searched]** — §7 zoning-of-districts method
- YouTube, "Best RimWorld Base Building Guide After 5,000 Hours" — https://www.youtube.com/watch?v=exvEQxSgQb0 and "Rimworld: Understanding Bedroom Sizes!" — https://www.youtube.com/watch?v=2WyI8DFSn68 **[searched, not watched]** — cited as existence of the high-hour consensus layer only; no claim rests on them

- RimWorld Wiki, Room / Space / Beauty / Cleanliness / Light / Roof / Door / Floor / Filth / Work / Research / Temperature / Cooler / Power / Solar / Battery / Growing zone / Sun lamp / Recreation / Surgery / Vitals monitor / Prison / Thoughts / Stockpile / Shelf / Cover — mechanics support for every row of §5.1 — https://rimworldwiki.com/wiki/Rooms , https://rimworldwiki.com/wiki/Roof , https://rimworldwiki.com/wiki/Temperature , https://rimworldwiki.com/wiki/Recreation , https://rimworldwiki.com/wiki/Surgery , https://rimworldwiki.com/wiki/Shelf **[fetched via research pass]**
- r/RimWorld, "TIL about the importance of haulers and shelves" (cook throughput vs stockpile distance, bench-between-shelves, drop-on-floor, hauler saturation, floor-pile beauty) — https://www.reddit.com/r/RimWorld/comments/9rkygc/til_about_the_importance_of_haulers_and_shelves/ **[fetched via research pass]** — §5.1, §5.2
- r/RimWorld, "How do I make rooms better than mediocre?" (impressiveness balance, furniture-vs-space math, combined commons, bedroom targets) — https://www.reddit.com/r/RimWorld/comments/1ux6txt/how_do_i_make_rooms_better_than_mediocre/ **[fetched]** — §5.2, §5.3
- r/RimWorld, "Are hallways better as 2 width or 3 width?" (mid-door choke, segmented halls, embrasure intersections, spread-vs-walk cost) — https://www.reddit.com/r/RimWorld/comments/1grr32o/are_hallways_better_as_2_width_or_3_width/ **[fetched]** — §5.2
- r/RimWorld, "Corridor defense: one tile wide or two?" (3-wide + 1 choke = one blocker plus ranged without friendly fire) — https://www.reddit.com/r/RimWorld/comments/yoric4/corridor_defense_one_tile_wide_or_two_tiles_wide/ **[fetched]** — §5.2
- r/RimWorld, "A definitive guide to efficient freezers 1.4" (measured insulation deltas, 2-tile exhaust chimney, staggered setpoints) — https://www.reddit.com/r/RimWorld/comments/ynlhgu/a_definitive_guide_to_efficient_freezers_14/ **[fetched]** — §5.1
- r/RimWorld, "Please help me understand stockpiles" / "140 hours and just learnt about shelves" / "Big colonies vs walk time" / "Stockpile zones" (priority pull-through and re-haul loops, 3x shelf density, buffer shelves, kitchen-vs-butcher filth) — https://www.reddit.com/r/RimWorld/comments/1o2pmuw/please_help_me_understand_stockpiles/ · https://www.reddit.com/r/RimWorld/comments/1u8lgf5/140_hours_on_rimworld_and_just_learnt_about/ · https://www.reddit.com/r/RimWorld/comments/1iursek/big_colonies_vs_walk_time_how_to_deal/ · https://www.reddit.com/r/RimWorld/comments/1myc0dn/stockpile_zones/ **[fetched]** — §5.1, §5.2, §5.4
- r/RimWorld, defence and scale: "killbox vs no killbox" — https://www.reddit.com/r/RimWorld/comments/10ggo24/whats_yalls_thoughts_on_killbox_vs_no_killbox/ · "an alternative to killboxes" — https://www.reddit.com/r/RimWorld/comments/1id4sax/is_there_an_alternative_to_killboxes/ · "what are your kill box designs" — https://www.reddit.com/r/RimWorld/comments/bg3mn3/what_are_your_defense_kill_box_designs/ · "base layout, what to change" — https://www.reddit.com/r/RimWorld/comments/17bdeuf/base_layout_what_to_change/ · "trying a more realistic approach" — https://www.reddit.com/r/RimWorld/comments/121nz0a/trying_a_more_realistic_approach_to_colony/ · "when did you learn to stop making bases from wood" — https://www.reddit.com/r/RimWorld/comments/1ekv513/whend_you_learn_to_stop_making_bases_from_wood/ · "my first multilevel base" — https://www.reddit.com/r/RimWorld/comments/1kbwihw/my_first_multilevel_base/ **[fetched]** — §5.2, §5.3, §5.6
- Steam, "Simple Effective Base Layout Tips" — https://steamcommunity.com/sharedfiles/filedetails/?id=763942775 and "A beginner's detailed guide (1.4)" — https://steamcommunity.com/sharedfiles/filedetails/?id=2779784000 **[fetched]** — §5.2 (one big commons + tiny bedrooms, 12-tile roof span, 3-wide halls, cooler exhaust)
- Negative findings recorded deliberately: `wiki/Work_bench`, `wiki/Pathfinding` and `wiki/Work_speed` do not exist — **vanilla RimWorld has no workbench adjacency bonus**, and Ludeon forums / r/RimWorldContext returned 403/Cloudflare blocks in the pass, so no claim in this KB rests on them. The "20-tile table search radius" is a folk attribution (§5.6).**

## Prison Architect

- Steam Community, "Quick Guide to Making Efficient Kitchens, Canteens and Yards" — https://steamcommunity.com/sharedfiles/filedetails/?id=474722343 **[searched]** — §6.2
- Steam Community, "How to properly set up a kitchen and canteen" — https://steamcommunity.com/sharedfiles/filedetails/?id=1753327954 **[searched]** — §6.2 ratios, §23.8
- Steam Community, "Rooms sizes and efficiency" — https://steamcommunity.com/sharedfiles/filedetails/?id=327709860 **[searched]** — §23.8 size thresholds, "add two per dimension"
- Steam Community, "HOW TO BUILD A PRISON (2020)" — https://steamcommunity.com/sharedfiles/filedetails/?id=379397146 **[searched]** — §23.8 (4-wide walkways, block footprints, 10-tile buffer)
- r/prisonarchitect, layout critiques: "first prison layout about 5 hours in…" — https://www.reddit.com/r/prisonarchitect/comments/1ams0zf/first_prison_layout_about_5_hours_in_what_do_i/ · "Designing a better prison?" — https://www.reddit.com/r/prisonarchitect/comments/3ri2k4/designing_a_better_prison/ · "Looking to improve my kitchen layout/design" — https://www.reddit.com/r/prisonarchitect/comments/2dtkd2/looking_to_improve_my_kitchen_layoutdesign/ **[searched]** — §6.3, §7
- YouTube, "How to build the perfect kitchen and canteen — Prison Architect #30" — https://www.youtube.com/watch?v=p5UjXJd_k3g **[searched, not watched]** — existence of the canteen-rush discourse only

**Prison Architect - guides (community-measured, high reputation)**
- Steam, [Guide :: Rooms sizes and efficiency (alpha 0.30)](https://steamcommunity.com/sharedfiles/filedetails/?id=327709860) - per-tile and per-fixture numbers **[fetched]** - §23.8, §6.2
- Steam, [HOW TO BUILD A PRISON (updated 2020-08-02)](https://steamcommunity.com/sharedfiles/filedetails/?id=379397146) - corridor widths, cell sizes, ratios, drainage, zoning, staggered meals **[fetched]** - §6.2, §6.3, §6.5
- Steam, [Prison Architect Mega-Guide V1.7](https://steamcommunity.com/sharedfiles/filedetails/?id=530956194) - camera LOS, truck sizes, gate gaps, staff/infirmary capacity, cost discipline **[fetched]** - §6.1, §6.2
- Steam, [(Noob to Pro's) Guide to Prison Architect](https://steamcommunity.com/sharedfiles/filedetails/?id=369400631) - guard ratios, module self-sufficiency **[fetched]** - §6.2, §6.4
- Steam, [The Ultimate Guide to Prison Architect (outdated)](https://steamcommunity.com/sharedfiles/filedetails/?id=142966741) - open-plan travel time vs containment, saw/press balance, unscheduled-time pitfall **[fetched, ageing]** - §6.3
- Paradox wiki pages **[fetched]**, each used at §6.1-§6.4: [Room](https://prisonarchitect.paradoxwikis.com/Room) · [Needs](https://prisonarchitect.paradoxwikis.com/Needs) · [Guards](https://prisonarchitect.paradoxwikis.com/Guards) · [Doors](https://prisonarchitect.paradoxwikis.com/Doors) · [Sector](https://prisonarchitect.paradoxwikis.com/Sector) · [Checkpoint](https://prisonarchitect.paradoxwikis.com/Checkpoint) · [Contraband](https://prisonarchitect.paradoxwikis.com/Contraband) · [Kitchen](https://prisonarchitect.paradoxwikis.com/Kitchen) · [Canteen](https://prisonarchitect.paradoxwikis.com/Canteen) · [Deliveries](https://prisonarchitect.paradoxwikis.com/Deliveries) · [Storage](https://prisonarchitect.paradoxwikis.com/Storage) · [Laundry](https://prisonarchitect.paradoxwikis.com/Laundry) · [Prison Labour](https://prisonarchitect.paradoxwikis.com/Prison_Labour) · [Materials](https://prisonarchitect.paradoxwikis.com/Materials) · [Drain](https://prisonarchitect.paradoxwikis.com/Drain) · [Power Station](https://prisonarchitect.paradoxwikis.com/Power_Station) · [Water Pump Station](https://prisonarchitect.paradoxwikis.com/Water_Pump_Station) · [Yard](https://prisonarchitect.paradoxwikis.com/Yard) · [Cell](https://prisonarchitect.paradoxwikis.com/Cell) · [Dormitory](https://prisonarchitect.paradoxwikis.com/Dormitory) · [Room grading](https://prisonarchitect.paradoxwikis.com/Room_grading) · [Infirmary](https://prisonarchitect.paradoxwikis.com/Infirmary) · [Execution](https://prisonarchitect.paradoxwikis.com/Execution) · [Reception](https://prisonarchitect.paradoxwikis.com/Reception) · [Visitation](https://prisonarchitect.paradoxwikis.com/Visitation) · [Garbage](https://prisonarchitect.paradoxwikis.com/Garbage) · [Grants](https://prisonarchitect.paradoxwikis.com/Grants) · [Reports](https://prisonarchitect.paradoxwikis.com/Reports) · [Cleared for Transfer](https://prisonarchitect.paradoxwikis.com/Cleared_for_Transfer) · [Prisoner](https://prisonarchitect.paradoxwikis.com/Prisoner) · [Tips](https://prisonarchitect.paradoxwikis.com/Tips) · [Quickstart guide](https://prisonarchitect.paradoxwikis.com/Quickstart_guide)
- Developer feature highlights (PA2, for zone/checkpoint/regime semantics): [Security](https://www.paradoxinteractive.com/games/prison-architect-2/news/feature-highlight-security) · [Prisoner Management](https://www.paradoxinteractive.com/games/prison-architect-2/news/feature-highlight-prisoner-management) **[fetched]** - §6.1
- Not retrievable in the pass (403/anti-bot), listed for the bibliography and used for nothing: [r/prisonarchitect canteen-bunching thread](https://www.reddit.com/r/prisonarchitect/comments/5pxdzw/any_way_to_stop_prisoners_bunching_up_at_canteen/) · [1000+ repeatable design](https://www.reddit.com/r/prisonarchitect/comments/d0scz7/1000_prisoners_repeatable_design_safe_and_secure/) · [238.7-hour advice guide](https://www.reddit.com/r/prisonarchitect/comments/rj5l8l/advice_from_a_2387_hour_player_a_24_page_guide/) · Fandom [Needs](https://prison-architect.fandom.com/wiki/Needs) / [Tips](https://prison-architect.fandom.com/wiki/Tips_and_Tricks)

**Real correctional architecture (the source PA is modelled on)**
- [Archgyan, "How to Design a Prison"](https://archgyan.com/how-to-design-a-prison/) - five circulation flows, sally-port logic, typology comparison, 48-64 beds/unit, 3.3 m² dayroom, 1.1 m sightline rule, double-fence sterile zone **[fetched]** - §6.1, §6.7
- [FDLE / Saunders, "Direct Supervision Jails: A Management Model for the 21st Century"](https://www.fdle.state.fl.us/getContentAsset/cf278644-6a98-40be-99bb-eabfa5c9e7ce/73aabf56-e6e5-4330-95a3-5f2a270a1d2b/Saunders.pdf?language=en) - pod sizing, officer inside the unit, barrier removal, 1:50, outcome data **[fetched]** - §6.7
- [NICIC tag page, direct supervision](https://nicic.gov/resources/tags/direct-supervision) **[fetched]** · [OJP 103205, New Generation jail evaluation](https://www.ojp.gov/pdffiles1/Digitization/103205NCJRS.pdf) **[fetched]** · [EBSCO research starter, prison and jail systems](https://www.ebsco.com/research-starters/law/prison-and-jail-systems/) **[fetched]** - §6.7
- [Fentress, "The Sallyport Strengthens the Weakest Link in Prisoner Movement"](https://blog.fentress.com/blog/sallyport/) · [Wikipedia, Sally port](https://en.wikipedia.org/wiki/Sally_port) **[fetched]** - §6.1 (vestibule/interlock parallel)
- [Wisconsin Admin. Code DOC 350.06](https://www.law.cornell.edu/regulations/wisconsin/Wis-Admin-Code-SS-DOC-350-06) - cell/dorm/holding area minima **[fetched]** - §6.7, §12.6
- [Penal Reform International, "Build for success"](https://www.penalreform.org/blog/build-success-prison-design-infrastructure-tool-rehabilitation/) · [Justice Trends, prison environments and psychology](https://justice-trends.press/the-evolution-of-prison-environments-psychological-impacts-trends-and-opportunities-why-we-must-do-better/) · [HMC Architects, Normative Design and recidivism](https://hmcarchitects.com/blog/2018-09-05/normative-designs-role-in-reducing-recidivism-rates-2018-09-05/) **[fetched]** - §6.7, §16, §21 (courtyard best / panoptic watch worst)
- Found, not machine-readable in this session, supporting no number here: [BSCC Jail Design Guide 3rd ed.](http://www.bscc.ca.gov/wp-content/uploads/024806.pdf) · [NIC audits of podular direct-supervision jails](https://s3.amazonaws.com/static.nicic.gov/Library/013633.pdf) · [Cambridge, The Development of Direct Supervision](https://www.cambridge.org/core/books/environmental-psychology-of-prisons-and-jails/development-of-direct-supervision-as-a-design-and-management-system/E82747A6EB65C2E95C02234D11C72E62) · [Ohio 5120:1-8-04](https://codes.ohio.gov/ohio-administrative-code/rule-5120:1-8-04) · [Sage, Ethical prison architecture](https://journals.sagepub.com/doi/10.1177/12063312221104211)

## Repo-internal (facts, not opinions)

All in-line with `file:line` throughout §2, §2.6, §2.7, §5-§7, §11-§15, §24, §25: `src/blueprint-editor/limits.ts`, `domain/schema/{walkable,layout,primitives,assets,objects,interact,rooms,npc,helpers}.ts`, `src/engine/npc/{pathfinding,layoutBuild,rooms,config,npcEngine}.ts`, `src/blueprint-editor/editorConfig.ts`, `src/blueprint-editor/data/blueprint-data.json`, `harness/state/context.md`, `docs/skill/data-flow.md`.

**Deleted sources cited above (provenance only, do not re-open):** `scripts/generate-hotel.mjs` (deleted by user order, `harness/state/history.md:210` — its surviving output is `src/blueprint-editor/data/blueprint-data.json`); `docs/design/hotel-21-floor-program.md` and `docs/research/hotel-layout-references.md` (deleted; the 21-floor program and its reference register are not recovered anywhere — if a section's evidence needs them, treat that evidence as unverifiable rather than re-deriving it from the JSON).

## Known gaps in this source list (do not treat as closed)

1. Egress travel-distance and exit-capacity numbers (§12.7) are given as a *code family* range, not from a specific adopted standard — pin them to the jurisdiction the project targets before using them as a pass/fail gate.
2. Metric typology benchmarks (§12.2, §12.6, §11.6 percentages) come from vendor/trade guides and books; they are credible and mutually consistent, not authoritative. Where a row is marked MEDIUM, treat it as a starting budget, not a limit.
3. Video sources were confirmed to exist but not watched, so no number in this document comes from them.
4. Community figures for PA are player-derived balance, explicitly flagged as such in §23.8.

# 29. A generalized architectural reasoning specification for an AI designing buildings on a grid

> This is the KB's deliverable: not a template, but a *procedure for reasoning*, valid for any building type on any tile grid, with this project's numbers as its worked instance.

## 29.1 The ten invariants

1. **Decide the parti before the plan; never let the plan decide it afterwards.** (§3 P-1)
2. **Programme everything, including the space that earns nothing.** (§4, §11.6)
3. **Optimise the frequency-weighted graph, not the drawing.** (§3 P-3, §19)
4. **Separation is a buffer room, adjacency is a door.** (§4.4, §8.1)
5. **Widths and capacities come from bodies and demand; the grid only rounds them.** (§12, §10.8)
6. **Two of everything that keeps people alive: two ways in, two ways out, two ways up.** (§10.7, §25)
7. **Repeat the expensive parts (core, stack, rhythm); vary the cheap parts (program, finish, tier).** (§13.4, §14, §20.4)
8. **Zones must be legible in the graph, not only on the drawing.** (§9, §19.4)
9. **Design the second version now: leave joints, stubs and spare cells.** (§25)
10. **Class every claim (universal / real-world / game-specific / optional) and argue from the class.** (§27)

## 29.2 The procedure (12 stages, each with its gate)

| # | Stage | Question answered | Output | Gate before the next stage |
| --- | --- | --- | --- | --- |
| 1 | Requirements | who, how many, how busy, what must touch what | one paragraph + capacity table | no tile placed |
| 2 | Program | what spaces, what size, what fixtures | §4.2 matrix in clear + gross tiles | every row has daylight/service/privacy/adjacency |
| 3 | Adjacency | which pairs, at what class, for which reason | §8-style matrix with reason codes | every non-neutral pair has a reason |
| 4 | Zones | which gradient levels, where, per floor | zone map over the tile grid | zone-level ranking is coherent |
| 5 | Circulation | five systems, who meets whom where | route diagrams + widths chosen from §12.2 | primary ≥ 4 tiles, service ≥ 3, two exits |
| 6 | Grid/module | parti lines, bay pitch, core position, envelope | the parti drawn as tile lines | no room exists yet; rhythm ≤ 4 values |
| 7 | Masses | core, halls, big spaces, service blocks | major volumes placed | reach ≤ 24 tiles; stacks aligned per floor |
| 8 | Rooms | rooms inside zones, by adjacency + daylight + traffic | room shells on the module | no room placed "because there is space" |
| 9 | Doors | who uses it, from which side, at what peak | door groups (1/2/3/4 tiles) | no door discharges into a 1-tile run or a facing pair |
| 10 | Services | water, waste, air, power, control, maintenance | plant rooms, risers, clearance tiles | every interact spot standable |
| 11 | Furniture | what makes each room *be* that room | fixture assets from the catalogue | every room typed by a fixture |
| 12 | Test + iterate | does it work, does it read, does it grow | §26 metrics + sim observation + critique list | five levels (§26.1) reached or the gap named |

## 29.3 The test battery (run every time, in this order)

**Functional:** spots standable · passability · rooms typed · tags vs zones · caps.
**Efficient:** utilisation per fixture · reach · passing exposure · circulation share · lettable ratio.
**Realistic:** parti stated · module rhythm · stacking and repeated core · zoning-integration monotonic · service chain complete · two exits · daylight band honoured · no sliver/double-wall waste.
**Scalable:** the 2× test passed with the reservation list named.
**Coherent:** a reader can say in one sentence what this building *is*, and every zone boundary on the plan is a place where something happens (a threshold, a control, a buffer).

## 29.4 The conflict protocol

When two rules collide: apply §22.1's order of appeal (mechanical enforcement → safety → flow/throughput → zoning/privacy → structure → daylight → aesthetics); name the loser; pay for it explicitly (an extra room's width, a longer guest walk, a bigger hall); and record it as `DECISION → REASON → EVIDENCE (§-ref) → TRADE-OFF`. **Never resolve a conflict by silently dropping the requirement, and never claim a real-world property the engine cannot observe (§20.6, §27.2).**

## 29.5 The failure this specification exists to prevent

The default output of an AI on a grid is a packed, 1-tile-corridored, BOH-less, unfurnished, single-core, over-efficient plan that measures well and behaves badly — because tile-minimisation is the only thing a naive objective rewards. Every section of this document exists to replace that objective with a better one:

> **A layout is good when the architecture, the human behaviour, the gameplay mechanics, the logistics and the grid constraints all reinforce the same parti — and the design can say, for each tile group, which of those five it is serving.**

**Status of this specification** - the invariants and stages are HIGH confidence, restating §3 to §27 whose evidence is marked per section; the numeric gates are MEDIUM design budgets except those derived from **[repo]** code, which are HIGH; and every game-specific number must be re-verified against the code before a build depends on it, because this project is pre-release and its mechanics still move (§2 facts were verified against the current tree).

> **A generalized architectural reasoning specification for an AI designing buildings on a grid.**
