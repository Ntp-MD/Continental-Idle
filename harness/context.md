# Context - shared language

One canonical name per concept. This file decodes the project's jargon so chat,
slot, and code all speak the same words - "door halves split", not a paragraph
re-deriving them. The harness ships the shape; the words are project-owned.
Rewrite the glossary on adoption (see `harness.md` - Adopt in a new project).

## Usage rules

- Speak in glossary terms everywhere: chat, slot, `skill.md`, code. No synonyms for a locked term.
- A new hard-to-explain term emerges -> patch this file in the same change, then use it. Contested terms wait for user confirmation before locking.
- Two names for one concept -> merge to the canonical one, park the loser in the "Not" column.

## Glossary

| Term | Meaning | Not |
| ---- | ------- | --- |
| Definition | Reusable asset/config owning defaults, validation metadata, tags (identified by `id`). | template, base asset |
| Instance | References a definition by id; owns only position/rotation/instance-specific overrides. | a copy of the definition |
| Normalization | At ingress: unknown input -> canonical data or reject; idempotent, context-free. | resolution |
| Resolution | Before consumption: derives runtime values from canonical data + context; the single path. | normalization |
| Origin assets | The FOUR persisted data modules (`src/blueprint-editor/data/`: `floorPlan`, `originAssets`, `npcSettings`, `tagManager`) - the only persisted store. | JSON snapshot, DB |
| Walkable grid | Boolean per-cell NPC passability for a floor. | tile states |
| Tile states | Per-cell semantic state (walk/wall/door) on floors and objects. | walkable grid |
| Walkable runs | Contiguous blocked+door cell groups derived from tile states. | walls |
| Door halves | 2+ connected door tiles slide as two halves (`slideDir` -1/+1); 1 tile stays single. | door animation |
| Interact spot | An object's stand/edge/post anchor set. | interact config |
| Interact config | An object's interaction definition. | interact spot |
| Engine | Pure, UI-framework-independent simulation shared by editor preview and runtime. | adapter |
| Editor / Runtime | Authoring app vs game; adapters own lifecycle/rendering only. | game/client |
| Editor-only field | A CanvasConfig/EditorSettings field excluded from the synced payload. | unsynced bug |
| Synced payload | The DTO the editor pushes to the runtime - never carries editor-only fields. | save file |
| Field specs | `CANVAS_FIELD_SPECS` / `EDITOR_FIELD_SPECS` declarative schemas; keys are never enumerated by hand. | settings list |
| Free tool | Merged select+erase flow: marquee selects objects or wall/door tiles, Delete clears. | erase brush, erase mode |
| Street ring | Cosmetic border-ring tiles; blocked to the engine by today's contract. | sidewalk |
| Asset SVG v2 | Body shapes via `--obj-fill`/`--obj-stroke` vars; no hardcoded colors, no backing plate. | inline hex art |
| Dirty baseline | `useDirtyBaseline`: one snapshot + a `dirty` computed. | dirty flags, JSON stringify diff |
| State lock / async action | `withStateLock` (store mutations) vs `useAsyncAction` (UI pending). One guard per layer. | boolean guards |
| Tile scale | 1 tile = 0.5 m. Plot 107x67 tiles = 53.5 x 33.5 m; building interior x9..97, y9..57 (45.5 x 25.5 m). | pixel size, grid size |

## Player vocabulary

UI labels use player words, never schema names ("Shape Radius", not "Label Radius").
Test: read the label to someone who never saw the code - if they cannot guess it, rename it.