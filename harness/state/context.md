# Context - shared language

One canonical name per concept. This file decodes the project's jargon so chat,
slot, and code all speak the same words - "door halves split", not a paragraph
re-deriving them. The harness ships the shape; the words are project-owned.
Rewrite the glossary on adoption (see `harness/HARNESS.md` - Adopt in a new project).

## Usage rules

- Speak in glossary terms everywhere: chat, slot, `skill.md`, code. No synonyms for a locked term.
- A new hard-to-explain term emerges -> patch this file in the same change, then use it. Contested terms wait for user confirmation before locking.
- Two names for one concept -> merge to the canonical one, park the loser in the "Not" column.

## Glossary

| Term | Meaning | Not |
| ---- | ------- | --- |
| Parti | The one dominant move that organizes a floor plan (arrival axis, courtyard, corridor spine); named in the slot BEFORE any tile write; must be new per build unless the user orders reuse. | layout, floor plan, template |
| Definition | Reusable asset/config owning defaults, validation metadata, tags (identified by `id`). | template, base asset |
| Instance | References a definition by id; owns only position/rotation/instance-specific overrides. | a copy of the definition |
| Normalization | At ingress: unknown input -> canonical data or reject; idempotent, context-free. | resolution |
| Resolution | Before consumption: derives runtime values from canonical data + context; the single path. | normalization |
| Origin assets | The canonical `src/blueprint-editor/data/blueprint-data.json` store (`BlueprintDataFile`), the single source; tests seed from it via `store/seed.ts`, the app boots from `emptySeed()`. | DB, hand-edited modules |
| Walkable grid | Boolean per-cell NPC passability for a floor. | tile states |
| Tile states | Per-cell semantic state (walk/wall/door) on floors and objects. | walkable grid |
| Walkable runs | Contiguous blocked+door cell groups derived from tile states. | walls |
| Door halves | 2+ connected door tiles slide as two halves (`slideDir` -1/+1); 1 tile stays single. | door animation |
| Vestibule | An entrance air-lock: two door sets with clear floor between, for arriving/departing and luggage. | porch, lobby |
| Front of house / back of house | Guest areas (arrival, reception, lounge) vs staff/service areas (kitchen, storage, laundry, staff room) reached by a service corridor. | public/private |
| Service corridor | The staff spine from the service door to the BOH rooms; guests never use it. | guest corridor |
| Spawn zone | Per-floor, role-filtered tiles where a role's NPCs spawn (`NpcSpawnZone`); sits on that role's own work area. | pool entry |
| Interact spot | An object's stand/edge/post anchor set. | interact config |
| Interact config | An object's interaction definition. | interact spot |
| Engine | Pure, UI-framework-independent simulation shared by editor preview and runtime. | adapter |
| Editor / Runtime | Authoring app vs game; adapters own lifecycle/rendering only. | game/client |
| Editor-only field | A CanvasConfig/EditorSettings field excluded from the synced payload. | unsynced bug |
| Synced payload | The DTO the editor pushes to the runtime - never carries editor-only fields. | save file |
| Sync key | Stable per-floor identity in the synced payload: canonical label (`G`/`<n>`), else id-ordered ordinal with `_N` collision suffix; never array position. | array index, raw floor id |
| Field specs | `CANVAS_FIELD_SPECS` / `EDITOR_FIELD_SPECS` declarative schemas; keys are never enumerated by hand. | settings list |
| Free tool | Merged select+erase flow: marquee selects objects and wall/door tiles together, Delete clears both. | erase brush, erase mode |
| Street ring | Cosmetic border-ring tiles; blocked to the engine by today's contract. | sidewalk |
| Asset SVG v2 | Body shapes via `--obj-fill`/`--obj-stroke` vars; hollow details keep a literal `fill="none"`; no hardcoded colors, no backing plate. | inline hex art |
| Dirty baseline | `useDirtyBaseline`: one snapshot + a `dirty` computed. | dirty flags, JSON stringify diff |
| State lock / async action | `runExclusive` single-writer queue (store mutations) vs `useAsyncAction` (UI pending). One guard per layer. | boolean guards |
| Tile scale | 1 tile = 0.5 m - the only fixed unit. Plot/building extents are not constants: canvas width/height + `tileSize` (`CanvasConfig`) and `streetWidthTiles` (`resolveStreetTiles`) drive grid cols/rows and `resolveBuildingArea`. | pixel size, grid size, hardcoded plot dims |

## Player vocabulary

UI labels use player words, never schema names ("Shape Radius", not "Label Radius").
Test: read the label to someone who never saw the code - if they cannot guess it, rename it.