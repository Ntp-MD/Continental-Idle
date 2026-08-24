# Data, Persistence, and Domain Principles

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
- Success follows verified persistence only. Failed saves show no success toast; restore last canonical state.
- Removing an assignment from a form is distinct from deleting the owning entity unless the product defines otherwise.
- Destructive entity deletes: confirm → persist → verify → report.

## Tags

- Tag definitions are separate from tag references on entities.
- Deleting a definition must not silently destroy references unless cascade behavior is explicitly chosen; orphan references stay visible where relevant with defined runtime behavior.
- Undefined/orphan tags must not silently control matching.
- Comparison and persistence use the canonical tag normalization helper.

## Domain engines (preview/runtime)

- Editor preview and runtime share one pure engine implementation, independent of UI frameworks.
- Adapters convert their source to the engine's canonical input and own lifecycle/rendering only.
- The engine owns domain logic: selection, conditions, capacity, reservations, checks, pathfinding, occupancy, durations, events.
- Convert persisted units to engine units only inside the runtime adapter; preserve runtime identity there.
- Never duplicate engine behavior in UI components or adapters.
