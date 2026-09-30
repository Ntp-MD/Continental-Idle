# Architecture Agent Harness

The execution layer under `architecture-skill/research/` - the rule corpus the numbers are drawn
from. The skill says what good architecture is;
this harness makes an agent **see** what it just drew, **measure** it against the host engine, and
**re-measure** after every repair.

    design -> render -> look -> criticise -> revise -> render again

Nothing here decides a design. It derives, measures, draws and reports. The host engine
(`src/engine/`, `src/blueprint-editor/domain/`) stays the single source of truth for walkability,
rooms, room typing and portals - the harness calls it, it never re-implements it.

## Commands

    npm run arch -- <command>          # tsx scripts/arch/cli.ts
    npm run arch:selftest              # the failure library: bad plans must fire, the control must not

| command   | what it does                                                                 |
| --------- | ---------------------------------------------------------------------------- |
| `world`   | derive the persistent world model: site, floors, rooms, doors, portals, furniture, relations, vertical record |
| `render`  | draw a floor - `--ascii` for the inner loop, `--png` for the real look, `--svg` for reports |
| `metrics` | the measured KPI vector, every value with its band and the band's source      |
| `eval`    | run the independent validators, emit findings; **exit 1 when a critical or major finding blocks "done"** |
| `compare` | A/B/C on the identical metric list, ranked under four weight profiles. Two things are removed before any ranking happens: options with a **critical** finding (the model does not hold, so it is not a candidate), and **variants** - options agreeing with another on all but one diff component. Fewer than two distinct alternatives left means it refuses to rank. `--economy` runs the real crowd over every option with one identical config (`--ticks` `--agents` `--stay` `--patience` `--footfall`, or `--standing` for a resident population) and ranks on **profit/day after payroll**, never on gross takings; an option with no crowd run is excluded from the money ranking instead of being scored zero |
| `revise`  | apply a patch, rebuild, re-measure, report cleared / still-open / introduced  |
| `loop`    | `revise` over authored `pass-N.json` patches with a before/after contact sheet |
| `selftest`| regenerate `architecture-skill/failure-library.md` from measured results      |
| `takings` | run the real NPC crowd over the payload and report what the plan **earns** - `--plan lobby/services-probe.txt [--ticks n] [--agents n] [--arrivals] [--stay s] [--patience s]`. Only a service a visitor completes bills, so income is a circulation measurement, not an opinion; `--arrivals` runs declared footfall through the street doors, `--patience` is the lever that makes reputation and net income fall together. **Exit 1 when nothing is served** |

Default payload: `src/blueprint-editor/data/blueprint-data.json`.
Output: `scripts/arch/out/` - git-ignored, regenerable, never committed.

## Look before you argue

`render --ascii` costs nothing and has already caught two modelling lies that the numbers hid:
"the whole floor is one 303-tile bedroom", and "the lifts are sitting under the doors". Read the
picture first, then the KPI table, then the findings.

    npm run arch -- render --ascii
    npm run arch -- render --png --out scripts/arch/out/floor-g.png --scale 8
    npm run arch -- render --png --zoom 20,10,60,40        # crop into the problem area
    npm run arch -- eval --png scripts/arch/out/floor-g-findings.png --md scripts/arch/out/floor-g.md

## The patch shape

`revise` and `loop` are driven by authored patches. The harness does not invent geometry - a human
or an agent decides the repair, writes it down, and the harness re-measures whether it worked.

```jsonc
{
  "intent": "one sentence: why the geometry is about to move",
  "targets": ["INT-04"],          // finding ids this patch CLAIMS to clear - re-measured, never trusted
  "rung": "retag",                // blast radius: retag | door | boundary | wall | core
  "ops": [
    { "op": "setTile",    "floor": "floor-1", "x": 12, "y": 7, "state": "door" },
    { "op": "fillRect",   "floor": "floor-1", "x0": 6, "y0": 4, "x1": 9, "y1": 4, "state": "blocked" },
    { "op": "moveObject", "floor": "floor-1", "id": "lift-2", "dx": 1, "dy": 0 },
    { "op": "removeObject","floor": "floor-1", "id": "planter-7" },
    { "op": "addObject",  "floor": "floor-1", "id": "desk-3", "type": "asset-id", "x": 14, "y": 6, "rotation": 0 }
  ]
}
```

Coordinates are **tiles**, not pixels - `revise` converts through `canvas.tileSize`. `addObject.type`
must be an asset id that already exists in the payload's `originAssets`; the harness does not create
assets. `state` is the host's `TileState`: `walkable | blocked | door` (a door is walkable).

### The rung ladder

Take the cheapest rung that clears the finding, and say which one you took.

| rung       | blast radius                          | example                                    |
| ---------- | ------------------------------------- | ------------------------------------------ |
| `retag`    | one fixture, no geometry moves        | place the discriminating fixture last      |
| `door`     | one tile in one wall                  | move a doorway off a junction              |
| `boundary` | one room edge                         | take a tile of corridor from the room next door |
| `wall`     | a wall line, several rooms move       | widen a corridor run                       |
| `core`     | massing, stairs, lifts, shafts        | thin the plate, add a second core          |

The rung you declare is a claim, so it is measured: `revise` classifies every operation and reports
the **effective** rung, escalating and flagging `UNDERSTATED` when the ops cost more than the label.
Deleting a portal is a `core` change however you name it; a tile write spanning `WALL_CELL_THRESHOLD`
(8) cells or more is a `wall` change. An honest label is never downgraded.

```
# Revision - rung "core"
blast radius: declared "retag", measured "core" from the operations  <- UNDERSTATED: removeObject on lift-a - a portal is the core
- cleared   : none
- introduced: CIR-07
```

That run is a real one: the patch claimed it would clear `CIR-07` by deleting a lift, and it both
understated its rung and *caused* the finding it claimed to fix. Two lies caught in one re-measurement.

### The cheapest rung is measured too

`revise --challenge` asks R6's other question: could a cheaper repair have cleared the same claims? It
removes operations from **your own** patch, one at a time, re-measuring each subset, and reports what
is provably spare. It never invents geometry - a design decision stays a decision.

```
## Rung minimality - could a cheaper repair have cleared the same claims?
- cleared by the full patch: INT-04
- operations declared: 3, proven necessary: 2, spare: 1
- trials: 5
- SPARE OPERATIONS - each of these was removable without losing a single cleared finding:
  - {"op":"addObject","floor":"floor-1","id":"sofa-bottom","type":"fx-sofa","x":11,"y":11}
```

Note which operation that names: the **lift lobby**. The three placements tag two room blocks and a lobby; the probe reports the lobby as the redundant one, because circulation does not need a fixture to stop it being typed as a lost room. That is the architect's answer, arrived at independently by measurement.

Greedy, so a saving that needs two operations removed together is missed; `capped` says when the trial
budget stopped the search and the result is a bound rather than a proof. Cost is one re-measure per
trial, which is why it is asked for and not always on.

The probe also earned its keep by disagreeing with this harness's own author: a three-fixture retag was
expected to be minimal and measured as one operation short of it. That is a live weakness in `INT-04`,
not in the probe - see the note in `harness/state/history.md`.

### A repair can make it worse, and that is the point

`revise` reports three lists: `cleared`, `still open`, `introduced`. `introduced` is the cascade -
the finding your repair created somewhere else. A real run of this harness on a fixture:

    pass 2  cleared: INT-04   introduced: GATE-02, GATE-04, GEO-04
    -> the sofa landed on a portal tile, sealing the lift and overlapping a fixture

The retag rung cleared the mistyped room and broke vertical circulation. Only the re-measurement
shows that. Never report a repair from `intent`; report it from `cleared` minus `introduced`.

Both `revise` and every `loop` pass append a **metric diff** for each storey - room tiles, circulation
share, net-to-gross, furnished clearance, unreachable tiles, and the rest - so a repair is attributed
in numbers and not only in finding ids. Retagging one mistyped region, for instance, moves
`roomTiles 0 -> 18` and `circulationShare 0.567 -> 0.433` on the same row, which is the mechanism
`INT-04` describes made visible.

## Evaluators

`checks.ts` runs in this order, and the order is load-bearing:

1. **gate** (`GATE-*`) - model integrity. Do the tile classes reconcile? Is anything sealed off? Is a
   door leading into a wall? If a gate fails, the model is lying and every semantic finding below is
   forced to `unknown` - you cannot judge a plan whose geometry does not add up.
2. **geometry** (`GEO-*`) - slivers, room minima, proportion, furniture overlap, out of bounds.
3. **circulation** (`CIR-*`) - width, dead ends, sealed rooms, travel distance, desire-line detour
   measured over the host's real octile A*, portal presence.
4. **interior** (`INT-*`) - furnished clearance, coverage, door reserve, and untagged rooms. An enclosed
   region is treated as circulation only if the arrival cell is inside it or it has doors into two or
   more other spaces; size is never the test, and the KPI (`rooms collapsed to hallway`) and the finding
   come from that one classifier. Regions excused by door count alone are reported separately as
   `hall regions called circulation by door count, not arrival`, so a judgement that *removes* findings
   stays visible and arguable. Plus the priority-ladder trap where one hygiene sink retypes a restaurant
   as a bathroom.
5. **operations** (`OPS-*`) - back-of-house presence, catchment ratio, service door into a public room.
6. **environment** (`ENV-*`) - sidelit depth, windowless long-stay, privacy at junctions.
7. **building** (`BLD-*`) - portal coverage, stack drift, floor-to-floor consistency.

Every finding carries `why` (the mechanism, not the rule id), `correction` (what to do), and `cells`
(tile coordinates you can point at on the render). Verdicts are three-valued: `pass | fail | unknown`.
`unknown` is never promoted to `pass` - travel distance without a jurisdiction is `unknown`, and
stays `unknown`.

## What the harness cannot decide

These lines are the `CAPABILITY_MANIFEST.cannotRun` strings verbatim, and `arch:selftest` fails if this
file stops matching them - a hand-paraphrased list of limits silently loses the limits it did not copy,
which is how this section ended up naming five of eight.

- measured illuminance or climate-based daylight simulation - only a depth proxy (EQ-*)
- a per-typology daylight depth cap - one declared window head height is applied to every room, so a bedroom can pass a cap written for a glazed lobby
- transient smoke filling and tenability over time - no fire model runs here at all
- dynamic crowd behaviour beyond octile A* plus portal queues
- thermal and energy simulation, measured acoustics
- anything needing a section: heights, slab and beam geometry, door leaf swing, risers, slopes
- real time - the host floor list has no vertical dimension at all
- code compliance - a jurisdiction and edition are inputs this host does not carry, so code checks report UNKNOWN
- cost - no rates are supplied; money cells are parameters needing a region and a year, never inventions (CM-*)
- a market revenue verdict - the money columns in arch compare rank on the declared tariff table and day wage in src/blueprint-editor/domain/economy, so profit here is a balance-sheet shape, not a price
- an occupant-load area factor for a lobby, lounge, bar, gym, spa or pool - the corpus carries none, so capacity is judged against the declared population and never against an invented density (SP-04, HO-26)
- desks or seats per key - HO-22 retrieved none; PP-08 station counts are computed only from the arrival rate declared in scripts/arch/spec.json, and the walk-in to walk-out split in that file is an assumption, not a measurement
- sightlines and drag lines - C-values cannot be measured on this grid and the 1.1-1.3 drag band is a tuning knob, not a threshold (human-scale.md:474, PP-13)
- a circulation-share ceiling - TH-15 is office practice data and EC-17 states the hotel range has no source at all, so the share is published without a pass mark

Geometry and logic findings, the agent may close itself. Code-jurisdiction, structural, fire, access
and operational-capacity findings stay **OPEN** for a qualified reviewer regardless of the numbers.

## Files

| file          | role                                                            |
| ------------- | --------------------------------------------------------------- |
| `types.ts`    | the harness vocabulary - no stage invents a private shape        |
| `world.ts`    | `buildWorld()`: derive the persistent world model from a payload |
| `metrics.ts`  | `measureFloor()`, `floorKpis()`, `buildingKpis()`               |
| `checks.ts`   | the seven validator stages                                       |
| `evaluate.ts` | gate-first ordering, capability manifest, report formatting      |
| `compare.ts`  | option measurement, weight profiles, ranking, Pareto set         |
| `revise.ts`   | patch application and the cleared / still-open / introduced diff |
| `render.ts`   | ASCII, PNG, SVG, contact sheet                                   |
| `png.ts`      | dependency-free PNG encoder + 5x7 glyph font                     |
| `fixtures.ts` | 13 plans: one control, twelve documented failures, two of them multi-storey |
| `selftest.ts` | the four contracts below, and regenerates the failure library      |
| `cli.ts`      | the command surface                                              |

`scripts/arch/**` is executed by `tsx` and is **not** covered by `npm run typecheck` (which scans
`src/**` only). `selftest` is its check, and it proves six contracts rather than one:

1. **Detection** - every bad fixture fires its documented findings, the control fires none of its.
2. **Repair** - a no-op patch earns zero credit, and `cleared` / `still open` / `introduced` are each
   reproducible from the two reports rather than from the patch's own claim.
3. **Compare** - an option with a critical finding is absent from every weight profile's ranking and
   from the Pareto set.
4. **Section** - portal drift is blamed on the storey that actually moved, and on no other. Two
   storeys that already stack must never be told to move, and a floor that merely has no core is
   reported as cut off (BLD-01) rather than as drifting.
5. **Render** - the picture is a real image: a parseable chunk stream ending at IEND, an IHDR that
   agrees with the reported size, a pixel buffer that matches it, more than a couple of distinct
   colours (a blank canvas would be valid PNG and still useless), a contact sheet wider than one
   panel, and an upper storey whose arrival cell is one of its own core's boarding cells.
6. **Vector** - every published KPI is judgeable as printed: non-blank label, unit, band and band
   source, a finite value, a `direction` inside `up | down | band`, percentages inside 0-100, and keys
   unique within one storey's vector. A number whose band went blank stops the suite instead of
   shipping an unjudgeable row.

Per-floor metrics fold by kind, in one place used by both the table and the ranking: a **gate** takes
the worst floor, a descriptive metric takes the mean. Averaging `reconciles` over three storeys turns
one lying floor into 0.67 and reads as mostly fine, and summing it prints `3` for a 0/1 flag.

Run it after touching this directory. Fixtures are single- or multi-storey: give a fixture `floors`
instead of `plan` to exercise anything about the section - all storeys share one canvas, exactly as
they do in the host, so a core that lands on different cells per floor is a real drift.
