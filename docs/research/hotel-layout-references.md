# Layout research notes - RimWorld / Prison Architect / real hotel CAD

Collected 2026-09-19. Verbatim quotes kept; full pages at the URLs below.

## 1. RimWorld - Colony Building Guide (official wiki)

URL: https://rimworldwiki.com/wiki/Colony_Building_Guide

- "The most important principle here is to not put the living quarters in the center of the base. Bedrooms should be at the edge of the colony"
- "the hospital and prison can, and should, be more centrally placed. Hospitals and prisons require frequent visits"
- "Make sure that related areas are close: kitchen, freezer, warehouse and factory floor."
- "The Freezer, Kitchen, Dining Room and Recreation Room are often adjacent to one another."
- "The freezer needs three main entrances: One leading directly outdoors ... One leading to the kitchen ... One leading to the main warehouse."
- "It is common to make airlocks (a door, a short space, and then another door leading to the freezer itself)"
- "Combining the dining and rec room is often more efficient than keeping them separate ... colonists still retain the two separate positive moodlets from a combined room"
- "You should build your kitchen right next to your Freezer."
- "Workshops ... put them near your warehouse ... remember to put chairs of any sort at the interaction spot"
- "Prisons should have doors facing towards your base, so escaping prisoners will go towards your base"

## 2. RimWorld players - Francis John modular grids (via r/RimWorld)

- Francis John base divides the map into 32x16 interior rectangles; each room re-configurable (3x6 bedroom sections, grow sections, power sections). Source thread: https://www.reddit.com/r/RimWorld/comments/lw934q/base_layout/
- 11x11 grid variant: every room 11x11, knock internal walls to merge. Source: https://indiegameculture.com/guides/rimworld-base-layout-ideas/
- Adjacency diagram thread (1.6, Dec 2025): kitchen between greenhouses and housing; rec/dining between kitchen and housing; hospital and prison better near the entrance. Source: https://www.reddit.com/r/RimWorld/comments/1pk7a5o/rimworld_16_baseroom_layout_adjacency_diagram/

## 3. Prison Architect - kitchen/canteen (guides + official PA Academy video)

- Ratios (default food policy): 1 serving table ~= 40 prisoners; 1 serving table = 2 cookers; 1 cooker = 2 fridges; 1 sink per serving table; 1 chef per cooker.
- Efficient setup: 1 serving table, 2 sinks, 2 fridges, 4 cookers, 4 cooks feeds ~64 inmates.
- Kitchen needs two doors: one into the canteen, one into a staff-only corridor leading to Deliveries.
- One canteen per cell block beats one giant central canteen (migration clog, fights). Put toilets, phones, pool table, TV inside the canteen for waiting time.
- Metal detectors at canteen entrance; staff-only zoning on deliveries; showers-in-cells for privacy + zero travel.
- Sources: https://gameplay.tips/guides/4257-prison-architect.html, https://www.youtube.com/watch?v=96Tu-rx2adc (Prison Architect Academy, 2024-04-16), Paradox wiki Canteen page.

## 4. Real hotel CAD - industrial kitchen DWG for 250-300 diners

URL: https://designscad.com/downloads/kitchen-hotel-dwg-detail-autocad/ (metric, Spanish labels)

Zone labels extracted verbatim from the CAD file, in flow order:
ENTREGA (delivery) -> PROV. DIARIAS + ALMACENAMIENTO + DESPENSA + CUARTO FRIO (cold room) -> PREPARACION (with VERDURAS / CARNES split) -> FOGONES + ASADOS + PARRILLA + MARMITA (cooking battery) -> REPARTO PORCIONES (portioning) -> COMEDOR (dining) + BAR LOBBY + BAR
-> DEVOLUCION (dish return) -> LAVADO VAJILLA (dish wash) -> back to storage.
Separate loops: CIRC SUMINISTRO (clean supply) vs CIRC PERSONAL (staff) vs HUESPEDES (guests); LAVANDERIA (laundry) + BASURAS (garbage) adjacent but separate; RECEPCION decoupled from kitchen flow.

## 5. Hotel brand standards - lobby numbers (search excerpts)

- Vestibule: minimum 2.5 m between door sets; room for luggage, disabilities, emergency exit.
- Reception: 1 pod (1.2 m) per 75-100 rooms; 1.5 m clear workspace behind counter; 3.7 m queuing in front.
- Lobby area: 0.6-0.9 m2 per guestroom; sightline entry -> reception -> lifts.
- Corridors: 1.5 m min, 1.8-2.4 m preferred; elevator lobby 3x3 m clear; dead-end max 6.1 m sprinklered.
- Sources: CR Hotel Management Lobby-Areas PDF, https://uperplans.com/hotel-floor-plan-with-dimensions-in-meters/, https://archgyan.com/how-to-design-a-hotel/, Trowbridge UK lobby guidance.

## Mapping to our G lobby (64x34 tiles @ 0.5 m)

HIT: vestibule airlock, reception faces entrance + back office + luggage, kitchen 2-door (corridor + servery), lounges split W+E, restrooms off lobby, BOH on staff corridor with end deliveries, sightline entry->desk->lifts.
GAP: vestibule depth 1 m vs 2.5 m standard; desk queue ~1 m vs 3.7 m; no dirty-dish return loop; no bell desk; no staff WC/changing split.
