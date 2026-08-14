# Data Boundary Normalization Rule

This rule activates during planning and implementation of any feature that touches data flow. It is a focused companion to the "Normalization planning gate" in `AGENTS.md` — read both before starting.

## Trigger conditions

This rule applies when any of the following are true:

- The feature reads or writes data at a system edge: loading from disk, saving to storage, migrating legacy shapes, syncing between subsystems, or receiving external input.
- The feature adds, modifies, or removes a field on a persisted or runtime-resolved type that other subsystems consume.
- The feature changes the direction or shape of data flow between any two subsystems (editor, persistence, sync DTO, engine, UI).
- The feature introduces a new path where user-entered data reaches a persisted structure.
- The feature adds a new consumer of a field that was previously resolved only at a single boundary.
- The user says "normalize", "data boundary", "migration", "validation", "sync", "override", or "canonical".

## What is a data boundary

A data boundary is any point where data crosses from one trust domain or lifecycle stage to another. Concretely:

1. **Ingress boundary** — data enters the system from an untrusted or legacy source: JSON files, localStorage, sync payloads, user input, import/export. The shape is not guaranteed to match the canonical type.
2. **Egress boundary** — data leaves the system to a consumer that expects a specific shape: engine adapters, renderers, serializers, export functions. The consumer must not re-derive or re-validate what the boundary already guaranteed.
3. **Lifecycle boundary** — data transitions between persistence and runtime: load → migrate → normalize → runtime; or runtime → serialize → persist. Each transition must preserve the canonical contract.
4. **Inheritance boundary** — data flows from an origin definition to a derived instance: origin asset → placed object → resolved runtime object. The derived form must not become an independent source of truth.

If a feature touches any of these crossings, it touches a data boundary.

## Mandatory planning step

Before writing feature code, produce a "Normalization plan" with:

1. **Boundaries**: For each crossing the feature touches, identify the source domain, the target domain, and the shape that crosses.
2. **Helpers**: For each crossing, determine whether a canonical helper already exists that converts the input shape to the canonical shape. If yes, name it. If no, plan to create one before writing feature code.
3. **Resolution**: For each consumer of the resolved data, confirm the consumer reads from the resolved form, not from raw input or inlined defaults.
4. **Gaps**: If a crossing has no matching helper, the helper must be created first. Do not write feature code that bypasses an unguarded boundary.

If no data boundary is touched, state "No data boundaries touched" and proceed.

## How to identify the right helper

A canonical helper is the right helper when all of the following are true:

1. It lives in the type-definition module (currently `types.ts`), not in a store, composable, or component.
2. It accepts `unknown` or a loosely-typed input, not the canonical type itself.
3. It returns the canonical type or `undefined`/`null` on rejection.
4. It is idempotent — passing the canonical shape through it returns the same shape.
5. It is the single entry point for that shape at any boundary.

If a function does not meet all five criteria, it is not a canonical helper and must not be used as a boundary guard.

## When to create a new helper

Create a new canonical helper when:

1. A new field is added to a persisted or runtime-resolved type that other subsystems consume.
2. An existing field changes shape in a way that legacy or external data may not match.
3. A new ingress or egress path is introduced for an existing shape that previously had only one boundary.
4. A consumer is found to be re-deriving or re-validating a shape that should have been guaranteed at an earlier boundary.

Do not create a helper if the shape is already covered by an existing one. Extend the existing helper instead.

## Resolution vs normalization

These are different operations and must not be conflated:

- **Normalization** happens at ingress. It converts untrusted input to the canonical shape. It rejects invalid data. It is idempotent. It does not know about runtime context.
- **Resolution** happens at egress or before consumption. It derives runtime values from the canonical shape, possibly combining multiple canonical inputs (e.g., origin asset + placed object rotation → resolved dimensions). It may apply defaults. It is not idempotent in the sense that it depends on its inputs, but its output is deterministic given the same inputs.

A helper that does both is doing too much. Split it.

## Anti-patterns to reject

Reject any of the following during review:

1. **Inline defaults in consumers** — a consumer reads a field and applies a default value inline (`field ?? defaultValue`) when a resolver exists or should exist. The default belongs in the resolver, not the consumer.
2. **Raw cast at migration** — migration code uses `as CanonicalType` to bypass validation. Migration is an ingress boundary; it must use the canonical helper.
3. **Object assignment without re-normalization** — an override or patch merges raw input into a canonical object without passing the result through the canonical helper. The merge point is a boundary.
4. **New field without a helper** — a definition field is added to a persisted type, but no canonical helper validates it at ingress. The field is unguarded.
5. **Snapshot on a derived type** — a definition field is copied onto a derived instance as an editable value, creating a second source of truth. The derived type must resolve from the origin, not store its own copy, unless an explicit override model exists.
6. **Consumer-side re-derivation** — a consumer re-derives a value that a resolver already provides, using its own inline logic. This creates divergent resolution paths.
7. **Helper outside the type module** — a normalization or resolution function lives in a store, composable, or component. It must live in the type-definition module so every boundary imports the same logic.

## Verification after implementation

After writing code, confirm:

1. Every data boundary identified in the plan uses a canonical helper that meets all five criteria above.
2. No consumer inlines defaults for a field that has a resolver — all consumers call the resolver.
3. The schema validator covers any new field shape added to a persisted type.
4. No new field on a derived type duplicates a field that belongs to the origin type, unless an explicit override model is documented.
5. `vue-tsc` and `test:npc-engine` pass.
