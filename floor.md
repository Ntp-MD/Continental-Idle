# Continental Idle Floor Plan Audit

## Technical Requirements
Ensure flawless X/Y coordinate programming with zero overlapping boundaries between walls and structures. Render this into a clean SVG using thin dark grey lines on a subtle engineering graph paper background, with all original room labels in clean sans-serif ALL-CAPS placed neatly according to the new logical layout.

## Corridor Accessibility
When redesigning floor layouts, always verify that every room door is adjacent to a corridor to ensure NPCs can walk to and enter rooms. No room should have a door that opens into another room or empty space without a connecting corridor. Only add doors to actual rooms—corridors, circulation areas, and non-room spaces should not have doors.

## Space Balance
Pay careful attention to balancing walking areas (corridors, pathways) and usable areas (rooms, functional spaces). Ensure logical distribution where walking areas are sufficient for navigation without wasting space, while usable areas maintain adequate proportions for their intended functions. Avoid excessive corridor space that reduces usable area efficiency, and ensure circulation paths are intuitive and minimize dead space.

## Mandatory Rules
- **100px Horizontal Corridor**: Must have 100px horizontal corridors wrapping around the central elevator on all floors except Floor 11 (rooftop). The corridor will form a complete 100px-wide cross around the elevator (vertical x=550-650, horizontal y=250-350).
- **Full Space Utilization**: Must use full available space with no dead space or wasted areas. All rooms and corridors should fill the available floor area efficiently.
- **Wall Flush**: Rooms must be flush against outer walls of the hotel building.
- **NPC Accessibility**: NPCs must be able to walk into rooms through corridors. Every room door must be accessible from a corridor with a clear walking path.
- **Door Direction**: Doors must only open inward into rooms.
- **No Dead Zones**: Corridors are walkable areas. Each floor must have no dead zones that are inaccessible.
- **Door Sizes**: Doors must use consistent sizes with 3 categories:
  - Standard doors (ประตูทั่วไป) - for regular rooms
  - Large lobby entrance doors (ประตูทางเข้า lobby ใหญ่) - for main lobby entrances
  - Sliding doors (ประตูบานเลื่อนสำหรับห้องหรู) - for luxury rooms
