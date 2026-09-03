# Data, Persistence, and Domain Principles

Floor/wall/decoration authoring conventions live in the sibling authoring guide - read it before drawing or editing anything in the persisted floor plan module.

## Definitions and instances

- A reusable definition (identified by id) owns defaults, validation metadata, tags, configuration. An instance references it by id and owns only position/rotation/instance-specific overrides.
- An instance must not carry a second editable copy of definition data. Identity/reference fields are structural, not editable definition data.
- Never infer or update a definition from an instance edit.
- When adding/changing a definition field: add to definition + canonical persisted shape, normalize at every ingress boundary, resolve from the definition whenever instances are created/rendered/edited/persisted/synced/simulated, propagate by re-resolving.
- Do not copy definition fields onto derived instances as editable snapshots unless an explicit override model exists.

## Data boundaries and normalization

A data boundary is any transition between untrusted input, persistence, runtime, UI, sync, or derived instances.

- Normalization happens at ingress: accepts unknown/loosely typed input, returns canonical data or rejects; idempotent; context-free.
- Resolution happens before consumption: derives runtime values from canonical data + context; deterministic; the single path for derived values.
- Never combine normalization and resolution in one helper.
- Canonical helpers are the single entry point for their shapes. If a new persisted/runtime shape lacks one, create and verify it before implementing consumers.
- No inline defaults in consumers when a resolver exists. No raw casts bypassing migration/validation. No untrusted patches merged without re-normalizing. No persisted fields without a validation path. No re-deriving values consumers can resolve.

Before work that changes data flow, persisted fields, migration, saves, sync, validation, or adapters: list every ingress/egress boundary touched, the canonical helper at each, the resolver each consumer uses, inheritance risks, and missing helpers. State explicitly if no boundary is touched.

## Persistence and CRUD

- Persisted domain data has one source of truth. Keep UI-only state out of persisted domain data.
- A committed action reports success only after persistence succeeded and was verified/read back. Await saves; no fire-and-forget.
- Store/domain operations own persistence; components must not need a second save for one mutation. Never run parallel saves for one committed action.
- High-frequency UI changes may draft in memory but flush once at interaction end.
- User-facing deletes confirm at the UI boundary. Cancelling a draft is not a delete and must not open a second confirmation.
- Success follows verified persistence only. Failed saves revert the in-memory state to the last successfully saved snapshot and report failure; the editor never shows unsaved mutations after a failed save.
- Removing an assignment from a form is distinct from deleting the owning entity unless the product defines otherwise.
- Destructive entity deletes: confirm -> persist -> verify -> report.

## Tags

- Tag definitions are separate from tag references on entities.
- Deleting a definition must not silently destroy references unless cascade behavior is explicitly chosen; orphan references stay visible where relevant with defined runtime behavior.
- Undefined/orphan tags must not silently control matching.
- Comparison and persistence use the canonical tag normalization helper.

## Origin asset authoring

Lessons encoded after the washer/double-bed round; follow these when adding or editing assets in the persisted origin asset module.

### Where

- The persisted asset/data modules are the ONLY persisted store. The dev server serves/saves them via the blueprint data middleware; no JSON snapshot exists or may be reintroduced as a second copy.
- Re-read the file immediately before editing - the editor save-flow rewrites it at any moment; current content wins over any earlier snapshot in memory or chat.

### Creation defaults

- Every new asset carries the canonical default fill color on every creation path (drawn, svg-import, flattened, linked set; duplicates inherit the source or fall back to the canonical default).
- Existing assets on disk are never migrated to new defaults by hand edits; defaults apply at creation time only.

### SVG art rules

- Body shapes use the theme convention: fill and stroke reference the asset fill/stroke theme variables with a fallback to the canonical default. Detail lines reference the dim text theme variable (`--text-dim`). Never hardcode decorative colors inside asset art.
- Every surface that renders an asset SVG must set the fill/stroke theme variables first via the asset color style helpers - raw attribute fallbacks alone render white-on-white. This applies to previews, palette thumbnails, and the game view, not just the editor canvas.
- The SVG is the whole visual. Editor canvas, game view, and palette preview all render the SVG alone - there is no backing plate behind placed objects. If art needs a base shape, draw it inside the SVG.
- Placed objects resolve colors live from their origin asset; they never carry editable color copies.

### Colors

- User-facing color values accept hex (`#RGB`/`#RRGGBB`/`#RRGGBBAA`) or `'transparent'`. Validate with the transparent-capable color validator, never the hex-only validator, wherever a transparent-capable input commits.
- Outline auto-derived from fill applies to hex fills only; a transparent fill leaves the outline untouched.

### Before reporting done

- Run the asset verification command: every entry must pass with ZERO warnings (stale removed-typed fields must not be re-added).
- New ids must be unique across the file; sizes are tile counts (w x h), pixel size = w x h x tileSize unless the pixel-size flag is set.
- If the asset participates in NPC simulation, decide deliberately: tile states (door rows enable queue slots), walkable grid, interact spots (snapped to nearest walkable cell within radius 5), interact durations, queue capacity, tags (portal, role restrictions).

## Domain engines (preview/runtime)

- Editor preview and runtime share one pure engine implementation, independent of UI frameworks.
- Adapters convert their source to the engine's canonical input and own lifecycle/rendering only.
- The engine owns domain logic: selection, conditions, capacity, reservations, checks, pathfinding, occupancy, durations, events.
- Convert persisted units to engine units only inside the runtime adapter; preserve runtime identity there.
- Never duplicate engine behavior in UI components or adapters.
