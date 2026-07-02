# Blueprint Editor Tool — Plan

Add a "Blueprint Editor" button on the StartScreen that opens a new browser tab as a Vue multi-page entry with a left-right layout: left panel is an asset palette, right panel is an SVG canvas with grid and exterior walls for wall drawing and drag-and-drop object placement in a data-driven approach.

---

## Architecture Overview

```
StartScreen.vue
  └── "Blueprint Editor" button → window.open('/editor.html')
                                        ↓
editor.html (Vite multi-page entry)
  └── src/editor-main.ts → mount EditorApp.vue
        └── EditorApp.vue
              ├── Left panel: Asset palette (drag-and-drop)
              ├── Right panel: SVG canvas (grid + exterior wall)
              │     ├── Wall drawing mode (click-drag room boundaries)
              │     └── Object placement (drag from palette)
              └── Properties panel (shown when object/room selected)
```

### Vite Multi-page Setup

Add entry point in `vite.config.ts`:
```ts
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        editor: fileURLToPath(new URL('./src/blueprint/editor.html', import.meta.url)),
      },
    },
  },
})
```
> **Note:** Uses `fileURLToPath` instead of `__dirname` because the project uses `"type": "module"` (ESM).

New files (all in `src/blueprint/`):
- `src/blueprint/editor.html` — HTML shell for editor page
- `src/blueprint/editor-main.ts` — entry point for editor
- `src/blueprint/EditorApp.vue` — main Vue component for editor

Files to modify:
- `src/components/overlays/StartScreen.vue` — add "Blueprint Editor" button
- `vite.config.ts` — add multi-page entry

---

## Editor Layout

```
┌──────────────────────────────────────────────────────────┐
│  Toolbar (top): Canvas W×H, Tile size, Mode toggle,      │
│                 Save, Export, Import, Clear, Add Asset    │
├──────────────┬──────────────────────────────┬────────────┤
│              │                              │            │
│  Asset       │     SVG Canvas               │ Properties │
│  Palette     │     - Grid (tile×tile)       │ Panel      │
│  (left)      │     - Exterior wall (border) │ (right)    │
│              │     - Room walls (drawn)     │            │
│  ┌────────┐  │     - Objects (placed)       │ x, y, w, h │
│  │Bed 1×2 │  │                              │ rotation   │
│  │Chair   │  │     Mode: [Wall] [Object]    │ label      │
│  │Desk    │  │                              │ category   │
│  │Elevator│  │                              │            │
│  │Door    │  │                              │            │
│  │...     │  │                              │            │
│  └────────┘  │                              │            │
│              │                              │            │
│  [+ Add New] │                              │            │
│              │                              │            │
├──────────────┴──────────────────────────────┴────────────┤
│  Floor List: G  F1  F2  F3 ... F21  [+ Add Floor]        │
└──────────────────────────────────────────────────────────┘
```

### Left Panel — Asset Palette
- Full asset catalog from floor.md, grouped by category (Structural, Furniture, Service, Kitchen, Room, Security, Misc)
- Each item shows: name + size in tiles (e.g. "Bed 1×2")
- **Drag from palette → drop on canvas**:
  - While dragging over canvas, show ghost preview snapped to grid
  - If overlapping existing object, show red (placement blocked)
  - Release = place object
- **"+ Add New Asset" button** — user defines name + size (w×h in tiles) + shape (rect/circle/round) to add custom assets
- **Floor list at bottom** — select which floor to edit (G, 1-21)

### Right Panel — Canvas
- **Configurable canvas size** — input width/height (default 1200×600)
- **Configurable tile size** — input tile size (default 25px) — tile must always be 1×1 (square only)
- Grid rendered according to tile size
- **Exterior wall drawn automatically** — border around canvas based on configured size
- Empty interior area for drag-and-drop object placement

---

## Layout Data Structure (JSON)

```json
{
  "version": 1,
  "canvas": { "width": 1200, "height": 600, "tileSize": 25 },
  "customAssets": [
    { "id": "custom-1", "name": "Custom Desk", "w": 2, "h": 1, "shape": "rect" }
  ],
  "floors": [
    {
      "id": "floor-1",
      "name": "Lobby",
      "label": "F1",
      "rooms": [
        { "id": "r1", "x": 375, "y": 0, "w": 450, "h": 175, "cat": "back", "label": "Reception Office" }
      ],
      "objects": [
        { "id": "o1", "type": "elevator", "x": 225, "y": 0, "w": 50, "h": 50, "rotation": 0 },
        { "id": "o2", "type": "bed", "x": 100, "y": 100, "w": 25, "h": 50, "rotation": 0 }
      ]
    }
  ]
}
```

> **Note:** Doors and labels are skipped for now — focus on wall drawing and object placement first.

---

## Asset Catalog (from floor.md)

| Category | Items |
|---|---|
| Structural | Elevator (2×2), Column (1×1), Door-Standard (1×1), Door-Sliding (2×1), Door-Lobby (4×1) |
| Furniture | Bed (1×2), Nightstand (1×1), Desk (1×2), Chair (1×1), Sofa (1×2), Table+chairs (2×2), Plant (1×1) |
| Service | Reception counter (8×1), Concierge desk (4×1), Luggage rack (2×1), Bar counter (12×1), Bar stool (1×1) |
| Kitchen | Kitchen stove (1×2), Prep station (2×1), Storage shelf (1×2) |
| Room | Wardrobe (1×2), Minibar (1×1), TV stand (1×2), Bathtub (1×2) |
| Security | Weapon rack (2×1), Control desk (4×1), Server rack (1×2), Filing cabinet (1×1) |
| Misc | Trash bin (1×1), Helipad marker (4×4), Dining table round (4×4) |

---

## Features

### 1. Canvas Settings
- Input fields for canvas width, height (px)
- Input field for tile size (px) — tile must always be 1×1 (square only)
- **Validation**: canvas width and height must be multiples of tile size (auto-round if not)
- **Changing canvas/tile size**: warn user, then re-snap all existing objects/rooms to new grid. Objects outside new bounds are clamped inside.
- Changing values → re-render grid + exterior wall immediately

### 2. Mode Toggle (Toolbar)
- **Wall mode** — click-drag on canvas to draw room boundary rectangles
- **Object mode** — drag-and-drop objects from palette onto canvas
- Only one mode active at a time

### 3. Wall Drawing (Wall Mode)
- Click-drag on canvas to create room boundary rectangle
- Auto snap to grid (25px or configured tile size)
- Ghost preview while dragging (semi-transparent rectangle + size in tiles)
- **Overlap prevention**: rooms cannot overlap existing rooms (edge-touching allowed)
- **Objects inside rooms**: objects CAN be placed inside room boundaries (furniture inside rooms is the intended use case). Object-vs-room overlap is allowed.
- Select room category before or after drawing: public, service, back, security, utility, open
- Room fills rendered with category color (matching blueprint.html palette)
- Interior walls drawn as 1.5px strokes, exterior wall as 2px stroke
- Click room to select → edit category/label in properties panel
- Press Delete to remove selected room

### 4. Object Drag-and-Drop (Object Mode)
- **Custom mouse events** (`mousedown`/`mousemove`/`mouseup`) instead of HTML5 DnD API — gives full control over ghost preview, snap-to-grid, and cursor following
- Drag from palette → drop on canvas
- Automatic snap-to-grid
- Ghost preview while dragging (green = valid, red = overlapping)
- **Overlap prevention rules**:
  - Objects cannot overlap other objects (edge-touching allowed)
  - Objects CAN be placed inside rooms (furniture inside room boundaries is intended)
  - Rooms cannot overlap other rooms (edge-touching allowed)
  - AABB check: `rectA.x < rectB.x + rectB.w && rectA.x + rectA.w > rectB.x && rectA.y < rectB.y + rectB.h && rectA.y + rectA.h > rectB.y`
  - When blocked (red ghost), drop is rejected — item returns to palette
- Click to select → drag to move position
- Press R to rotate (swap w/h)
- Press Delete to remove

### 5. Properties Panel (Right Side)
- Shown when a room or object is selected on canvas
- Editable fields:
  - **Position**: x, y (in px, snapped to grid)
  - **Size**: width, height (in px)
  - **Rotation**: 0° or 90° (for objects)
  - **Label**: text label for rooms
  - **Category**: dropdown for rooms (public/service/back/security/utility/open)
- Changes update canvas in real-time
- **Overlap validation on edits**: if properties panel changes create an overlap, show red border on the field and revert to previous value

### 6. Add Custom Asset
- "+ Add New" button in palette
- Form: name, width (tiles), height (tiles), shape (rect/circle/round)
- Added to palette and saved in `customAssets` of layout data

### 7. Floor Management
- Floor list at bottom (default 21 floors: G, 1-21)
- All floors start **empty** (blank gridded canvas with exterior walls only)
- Each floor has separate layout data
- **Add floor** — "+ Add Floor" button creates empty floor at end
- **Delete floor** — delete button per floor (confirm before delete)
- **Duplicate floor** — copy entire floor data to create new floor
- **Rename floor** — double-click floor name to edit (default uses name from FLOORS catalog)
- **Reorder floors** — drag-and-drop floor tabs to reorder
- Floor order stored in `floors` array (not object keys) to support reordering

### 8. Undo/Redo
- **History stack**: every action (place, move, delete, resize, rotate, property edit) pushes a snapshot to undo stack
- **Undo** (Ctrl+Z): pop from undo stack, push to redo stack, restore previous state
- **Redo** (Ctrl+Shift+Z or Ctrl+Y): pop from redo stack, push to undo stack, restore state
- **Stack limit**: max 50 entries to limit memory usage
- **Batch edits**: continuous drag counts as one undo entry (snapshot on mousedown, not on every mousemove)

### 9. Save & Sync
- **Auto-save to localStorage** on every change (debounce 500ms)
- **localStorage quota check**: wrap save in try/catch, show warning toast if quota exceeded
- **Export JSON** — download file
- **Import JSON** — upload file back into editor
- **Clear floor** — wipe current floor data

> **Deferred:** Doors and labels — will be added in a later iteration.

---

## Implementation Steps

1. **Vite multi-page setup** — add `editor.html` + `src/editor-main.ts` + modify `vite.config.ts` (use `fileURLToPath`, not `__dirname`)
2. **EditorApp.vue skeleton** — 3-column layout: left (palette) / center (canvas) / right (properties) + top toolbar + bottom floor list
3. **SVG canvas + grid** — Vue reactive canvas size, tile size, grid rendering, exterior wall. Validate canvas dimensions are multiples of tile size.
4. **Data model + history** — layout state, undo/redo stack (max 50, batch drag as one entry)
5. **Mode toggle** — Wall mode vs Object mode switch in toolbar
6. **Wall drawing** — click-drag to draw room rectangles, snap to grid, category selection, ghost preview, room-vs-room overlap check
7. **Asset palette** — hardcoded catalog from floor.md + custom assets from data
8. **Object drag-and-drop** — custom mouse events (mousedown/mousemove/mouseup) from palette → canvas → snap to grid → object-vs-object overlap check (objects CAN be inside rooms)
9. **Select/Move/Delete/Rotate** — click to select, drag to move, R to rotate, Delete to remove (works for both rooms and objects)
10. **Properties panel** — edit selected room/object attributes with overlap validation (red border + revert on conflict)
11. **Canvas resize handling** — warn user, re-snap all elements to new grid, clamp out-of-bounds items
12. **Add custom asset** — form UI + add to palette + save to data
13. **Floor management** — add/delete/duplicate/rename floors + drag-to-reorder floor list (all start empty)
14. **Save/Export/Import** — localStorage auto-save (try/catch quota check) + JSON file download/upload
15. **Data migration** — version check on load, migration function for future schema changes
16. **StartScreen button** — add "Blueprint Editor" button in StartScreen.vue → `window.open('/src/blueprint/editor.html')`

---

## Tech Notes

- **Vue 3 + SVG** — Vue reactivity for canvas state, SVG for rendering
- No new dependencies needed — Vue + vanilla SVG only
- **Vite multi-page** — `editor.html` as separate entry point from `index.html`, using `fileURLToPath` (ESM-safe)
- **Custom mouse events** for drag-and-drop (not HTML5 DnD API) — full control over ghost preview and snap-to-grid
- Snap logic: `Math.round(x / tileSize) * tileSize`
- **Overlap rules**:
  - Object-vs-object: blocked (edge-touching allowed)
  - Room-vs-room: blocked (edge-touching allowed)
  - Object-vs-room: **allowed** (furniture inside rooms is intended)
  - AABB check: `rectA.x < rectB.x + rectB.w && rectA.x + rectA.w > rectB.x && rectA.y < rectB.y + rectB.h && rectA.y + rectA.h > rectB.y`
- **Undo/redo**: history stack (max 50 entries), batch drag as one entry, Ctrl+Z / Ctrl+Shift+Z
- **Canvas validation**: width/height must be multiples of tile size; resize triggers re-snap + clamp
- **localStorage**: try/catch quota check, warning toast on failure
- **SVG performance**: grid uses `<pattern>` (efficient); for large object counts, consider virtual rendering or canvas size limits
- **Data migration**: `version` field in JSON, migration function on load for future schema changes
- Every object has an `id` (counter-based) for select/delete
- Tile is always 1×1 (square) — no rectangular tiles
