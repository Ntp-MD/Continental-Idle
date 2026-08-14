# Project Principles

## Technical principles

- Use Vue 3 Composition API with strict TypeScript.
- Keep the NPC engine pure TypeScript and independent from Vue.
- Keep component-specific styling scoped; use shared semantic styles only when the role is genuinely reused.
- Use theme variables for colors, spacing, typography, and z-index. Do not hardcode theme tokens.
- Keep imports at the top of modules.
- Do not add comments or documentation unless explicitly requested.

## Naming principles

- Use clear, domain-oriented names for functions, types, components, and CSS classes.
- Functions use verbs that describe intent: `create`, `get`, `list`, `update`, `delete`, `normalize`, `validate`, `resolve`, `use`, `is`, and `rotate` where applicable.
- Do not use vague names such as `setData`, `patchState`, or `commitChanges` when a domain action can be named precisely.
- Keep naming consistent within a domain. Do not mix singular/plural or different terms for the same concept without a semantic reason.

## CSS and BEM principles

- Use `block__element` for structural parts.
- Use `block--modifier` for block-level states and variants.
- Use `block__element--state` when the state belongs to one element.
- Do not use triple `__`.
- Do not use a single hyphen as a structural BEM separator, such as `block-element`.
- Do not use a hyphen to simulate a compound modifier, such as `block--element-state`.
- Use `__` only between Block and Element, and `--` only between Block/Element and a state or variant Modifier.
- Do not use structural elements as block modifiers.
- Quote Vue `:class` object keys containing `--`.
- Use the shortest valid BEM form: Block, Element, Modifier.
- Reuse an existing semantic class only when the semantic role, interaction, accessibility, responsive behavior, and scope match.
- Do not merge selectors merely because they share declarations. If their roles differ, classify the match as `coincidental match, do not merge`.
- Every class must have a verified template, generated-markup, runtime, or documented behavior counterpart.
- Every referenced CSS variable must be declared in the project theme variable source.
- Keep unique component behavior in scoped styles and preserve focus, keyboard, hover, disabled, overflow, and responsive behavior during CSS changes.

## Origin asset and placed object principles

The blueprint editor has two different concepts that must not be conflated.

### Origin asset

- An origin asset is the reusable source definition identified by an asset id.
- It is the source of truth for every placed instance that references it.
- It owns reusable definition data: dimensions, walkability, walkable grids, tile states, tile edges, interaction spots, interaction capacity, interaction duration, appearance defaults, validation metadata, tags, and other asset defaults.
- Changes to an origin asset must be reflected by resolving the definition for its placed instances.

### Placed object

- A placed object is an instance on a floor and references its origin asset by type/id.
- Its user-owned instance data is position and rotation.
- Identity and reference fields are structural and are not editable definition data.
- Do not create a second editable definition source on the placed object.
- Do not infer or update an origin asset from a placed object edit.

### Inheritance contract

```text
Origin asset (source of truth)
            |
            v
Placed object (reference + position/rotation)
            |
            v
Resolved runtime object
```

When adding or changing a definition field:

1. Add it to the origin definition and canonical persisted shape.
2. Normalize and validate it at every ingress boundary.
3. Resolve it from the origin whenever an instance is created, rendered, edited, persisted, synced, or simulated.
4. Propagate origin changes by resolving again; never treat stale instance data as authority.
5. Include the origin definition in sync/export when runtime needs it.
6. Do not add a copied editable field to the placed object unless an explicit override model exists.

## Data boundary and normalization principles

A data boundary is any transition between untrusted input, persistence, runtime, sync, UI, or derived instances.

```text
external/legacy/user data
        -> migration + normalization + validation
        -> canonical domain data
        -> editor/runtime/sync consumers
```

Normalization happens at ingress:

- It accepts unknown or loosely typed input.
- It returns canonical data or rejects the input.
- It is idempotent.
- It does not depend on runtime context.

Resolution happens before consumption:

- It derives runtime values from canonical data and context.
- It may apply deterministic defaults.
- It must be the single path for derived values.

Do not combine normalization and resolution in one helper.

Canonical helpers must be the single boundary entry point for their shapes. Use the existing helpers for:

- interaction spots
- interaction configuration
- tile edges
- walkable grids
- tile states
- allowed role ids
- tags
- origin assets
- NPC configuration
- layout validation
- interaction runtime values
- resolved object definitions

If a new persisted or runtime shape has no canonical helper, create and verify the helper before implementing the consumer.

### Boundary anti-patterns

- Do not inline defaults in consumers when a resolver exists.
- Do not use raw casts to bypass migration or persistence validation.
- Do not merge untrusted patches directly into canonical objects without re-normalizing the result.
- Do not add persisted fields without a validation/normalization path.
- Do not copy definition fields onto derived instances as editable snapshots.
- Do not re-derive values in consumers when a resolver already provides them.
- Do not place canonical normalization helpers in a component, composable, or store-specific module.

## Normalization planning gate

Before implementing a feature that changes data flow, persisted fields, migration, UI saves, sync, validation, or runtime adapters, document:

1. Every ingress and egress boundary touched.
2. The canonical helper used at each boundary.
3. The resolution helper used by each consumer.
4. Any inheritance risk between origin and derived data.
5. Any missing helper that must be created first.

If no data boundary is touched, explicitly state that no data boundaries are touched.

## Persistence principles

- Persisted domain data must have one clear source of truth.
- UI-only state such as selection, modal state, pointer drag, animation, zoom, and pan may live temporarily in browser memory; it must not be confused with persisted domain data.
- A committed CRUD action must not be reported as successful until persistence has succeeded and the written data has been verified/read back.
- Do not use fire-and-forget persistence for domain actions. Await the save before returning.
- Store/domain operations own persistence; components should not need to perform a second save for the same mutation.
- Do not run parallel saves for one committed action.
- High-frequency UI changes such as color dragging or sliders may use a draft in memory, but must flush the final value once at interaction end.
- Delete operations require confirmation at the UI boundary. Internal cleanup for cancelling a draft workflow is not a user delete and must not open a second confirmation.
- Success toasts must follow verified persistence, not merely a successful in-memory mutation.
- Failed saves must not show success. Reload or restore the last canonical persisted state when necessary.
- Keep localhost persistence simple. Do not introduce services, databases, queues, event buses, generic repositories, or distributed transaction systems without a demonstrated need.

## CRUD principles

- CRUD modules own domain operations and should use precise domain names.
- A CRUD operation may coordinate multiple related records when the user action is transactional, such as drawing an object and saving its origin.
- Keep the existing store/facade boundary if it already provides the needed access; do not add a facade that only forwards calls.
- Compatibility wrappers may exist during migration, but there must not be two independent implementations of the same operation.
- Every destructive entity delete must confirm, persist, verify, and then report success.
- Removing an assignment from a form is distinct from deleting the entity that owns it unless the product explicitly defines it as destructive.

## Tag principles

- A tag definition is separate from tag references on assets, roles, tasks, or deployment rules.
- Deleting a tag definition must not silently destroy references unless the product explicitly chooses cascade behavior.
- Orphan references must be visible at the relevant detail view and must have a defined runtime behavior.
- Undefined/orphan tags must not silently control runtime matching.
- Tag comparison and persistence must use the canonical tag normalization helper.

## Shared NPC engine principles

- Editor preview and game runtime use one pure NPC engine implementation.
- Adapters convert their source data to the engine's canonical input and own lifecycle/rendering only.
- The engine owns target selection, role/task conditions, interaction spots, capacity, reservations, blocked/walkable checks, pathfinding, repathing, waiting, movement occupancy, durations, and events.
- Convert interaction duration from persisted seconds to simulation ticks only inside runtime.
- Preserve game entity identity in the game adapter; editor preview agents may use temporary identities.
- Do not duplicate engine behavior in Vue components or adapters.

## Verification principles

After implementation, choose verification appropriate to the touched boundaries. For changes involving origin definitions, placed objects, interaction data, grids, tile states, migration, sync, or NPC adapters:

1. Run the normalization audit and fix any failed boundary.
2. Run asset/data validation.
3. Run NPC engine tests when NPC or runtime data is involved.
4. Run typecheck and the production bundler.
5. Run BEM lint when templates/styles/classes are touched.
6. Report unrelated pre-existing failures separately; do not hide them or change unrelated systems just to make a broad legacy test pass.

## Current product scope

- The project and editor are used through localhost.
- Prefer direct, understandable local file persistence over production-scale abstractions.
- Do not optimize for multi-user synchronization or remote deployment unless the product scope changes.
- Preserve user data and validate cross-domain references whenever data domains are split or recombined.
