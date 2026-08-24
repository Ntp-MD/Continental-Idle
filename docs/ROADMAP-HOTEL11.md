# The Continental - Ambient Diorama Plan

> Vision: a living John-Wick-style hotel you WATCH. Eleven floors of quiet
> luxury - staff gliding through corridors, guests lingering at the bar,
> elevator queues forming naturally. No goals, no currency. Civilization
> as a screensaver.

Success metric: watch 10 minutes and it feels alive, calm and expensive.

Written 2026-08-24 (revised same day after scope reveal: this is an
observation diorama, NOT an idle game - economy was removed accordingly).

---

## Current State Snapshot

- Game boots from persisted blueprint automatically; Hotel tab renders
  floors + walking NPC dots; World Map tab decorative; editor at /editor.
- Engine capabilities that map directly to the fantasy:
  - interaction with min/max dwell time -> guests linger politely
  - queueing -> elevator / reception lines
  - allowedRoleIds per floor -> staff-only back of house
  - spawnZones -> arrivals at the street
  - focusTags / restrictedTags -> purposeful destinations
  - portal objects -> elevator travel between floors
- Theme tokens already lean JW: accent-gold, dark backgrounds.

## Step 1 - Behavior Audit (small scale)

Goal: prove "civilized" reads correctly with 3 floors and a handful of NPCs.

Setup: G = lobby (reception counter + lounge seats), F1 = lounge/bar,
F2 = staff area. Two roles only:

- Staff (concierge): focusTag `front-desk`, restrictedTag `guest-area`,
  allowed on all floors.
- Guest: focusTag empty (wanders), restrictedTag `back-of-house`.

Observe and record:

| Check              | Believable means                                               |
| ------------------ | -------------------------------------------------------------- |
| Staff pathing      | Walks corridor lines, parks at reception spot, dwells, returns |
| Guest roaming      | Visits lounge seats / bar spots, never enters F2               |
| Elevator etiquette | Queues form (no overlap), riders exit before entering          |
| Idle moments       | Some guests simply stand - stillness is part of the fantasy    |

Findings:

```
-
```

## Step 2 - PERF SPIKE (the spectacle lives or dies here)

The whole product IS the crowd, so numbers come early:

```
npm run test:npc-scale      # harness already clones layout to 11 floors
```

Fill the table (adjust perFloor scenarios to [25, 50, 75, 100]):

| Scenario | tick ms avg/max | notes |
| -------- | --------------- | ----- |
| 11 x 25  |                 |       |
| 11 x 50  |                 |       |
| 11 x 75  |                 |       |
| 11 x 100 |                 |       |

Decision rules:

- tick <= 6ms at target -> simulate every floor simultaneously (best show).
- over budget -> viewed-floor full simulation + others idle-shimmer,
  or lower per-floor cap. Decide BEFORE authoring content.

Answer here:

```
Q1 all-floors simultaneous viable?
Q2 chosen strategy + knobs:
```

## Step 3 - Continental Asset Set (need-driven)

Palette guidance for defaults: charcoal `#1b1e24`, deep red `#5c1a1a`,
brass `#b08d57`, cream `#e8e2d6`. Keep outlines `--asset-outline`.

| Floor   | Pieces worth having                                                               |
| ------- | --------------------------------------------------------------------------------- |
| G lobby | reception desk (counter-bar works), lounge sofa/chair pair, rug?, plant, signage? |
| F1-F3   | dining tables / bar counter / โยนโบว์ลิ่ง / casino                                |
| F5      | พื้นที่เก็บของและห้องพักสำหรับ staff                                              |
| F6-F9   | normal room / executive room / vip room                                           |
| F10     | spa/library seating variants / fitness                                            |
| F11     | operation room / safe house for me                                                |

Create each via Draw Object or SVG import; badge must stay non-yellow.

Editor polish happens HERE driven by authoring friction (add notes below):

```
-
```

## Step 4 - Author 11 Floors (content pass)

Per-floor loop:

1. Place furniture (lobby/rooms/corridor skeleton).
2. Edit Walkable: corridors + amenity tiles walkable; room interiors blocked;
   doors on corridor side; paint passages if flattened pieces used.
3. Interact spots on seats/desks (these are the poses guests strike).
4. Floor Manager: defaultWalkable, staff-only flags for back floors,
   spawn zone at street entrance on G.
5. Labels toggle sanity check. Next floor.

## Step 5 - Crowd Tuning

Deploy full population per step 2 decision. Tune until it FEELS calm:

| Knob                                | File                    | Feel lever               |
| ----------------------------------- | ----------------------- | ------------------------ |
| ticksPerSecond (60)                 | engine/npc/config.ts    | overall pace of life     |
| config.speed per role               | NPC Manager deploy      | staff brisk, guests slow |
| interact durationMin/Max            | asset interact config   | how long people linger   |
| MAX_SIMULATION_STEPS / FRAME_BUDGET | useNpcSimulationCore.ts | smoothness under load    |

## Step 6 - Presentation Pass (small, high-value)

- Title/footer already says "Continental" - keep.
- Replace Editor entry button with something quieter (gear icon top-right).
- Optional: minimal chip showing current floor + occupant count.
- Optional later: subtle vignette overlay (CSS radial-gradient), day/night
  tint toggle. Skip unless bored - do not decorate past usefulness.

## Completion Criteria

- [ ] Step 1 findings recorded - zero unbelievable behaviors open
- [ ] Step 2 table filled, strategy locked
- [ ] 11 floors authored, no yellow badges
- [ ] Full crowd runs smoothly per step 2 decision
- [ ] 10-minute watch test passes (subjective, but write one sentence why)
- [ ] npm run verify green, npm run build green
