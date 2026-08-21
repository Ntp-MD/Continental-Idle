# Project Principles

## Technical principles

- Use Vue 3 Composition API with strict TypeScript.
- Keep domain engines pure TypeScript and independent from Vue.
- Keep component-specific styling scoped; use shared semantic styles only when the role is genuinely reused.
- Use theme variables for colors, spacing, typography, and z-index. Do not hardcode theme tokens.
- Keep imports at the top of modules.
- Do not add comments or documentation unless explicitly requested.

## Naming principles

- Use clear, domain-oriented names for functions, types, components, and CSS classes.
- Functions use verbs that describe intent: `create`, `get`, `list`, `update`, `delete`, `normalize`, `validate`, `resolve`, `use`, `is`, and `rotate` where applicable.
- Do not use vague names when a domain action can be named precisely.
- Keep naming consistent within a domain. Do not mix singular/plural or different terms for the same concept without a semantic reason.

## Short naming principles

Names must be as short as possible while staying unambiguous in their scope.

- Use one short word when the scope is clear.
- Do not prefix the block with the feature or subsystem it belongs to when the file already provides that context.
- Do not repeat the parent concept inside the block name.
- Drop words already implied by the block or the element's role.
- Do not add structural suffixes that describe CSS layout instead of semantics.
- Separate state from the element name using `--`. Do not cram state words into the element name.
- One modifier owns one state or variant. Do not stack multiple states in one modifier name.

Before settling on a name:

1. Write the full descriptive name.
2. Drop every word already implied by the file, block, or parent element.
3. Drop every word that describes CSS layout or styling.
4. Move state words into a `--modifier`.
5. If the result collides with another name in the same scope, add back the minimum word needed to disambiguate.
6. Verify the name still reads clearly in the template without comments.

## CSS principles

### BEM format

- Use `block__element` for structural parts, `block--modifier` for block-level states, `block__element--state` for element-level state.
- Use `__` only between Block and Element, `--` only before a state or variant Modifier.
- Do not use triple `__`, single-hyphen structural separators, or hyphen-simulated compound modifiers.
- Do not use structural elements as block modifiers.
- Quote Vue `:class` object keys containing `--`.
- Use the shortest valid BEM form.
- Reuse an existing semantic class only when the semantic role, interaction, accessibility, responsive behavior, and scope match.
- Do not merge selectors merely because they share declarations. If their roles differ, classify as `coincidental match, do not merge`.
- Every class must have a verified template, generated-markup, runtime, or documented behavior counterpart.
- Every referenced CSS variable must be declared in the project theme variable source.
- The element selector in `base.css` owns base styling; modifier classes own only the delta. Do not redeclare base element properties inside a modifier.

### File placement by scope

- A shared semantic class used across multiple components belongs in the shared stylesheet.
- A subsystem shared class used by multiple components within one subsystem belongs in the subsystem stylesheet.
- A component-specific class used by one component belongs in that component's scoped style.
- Do not place a shared class inside a scoped style, or a component-specific class inside a shared or subsystem stylesheet.

### Neutral medium classes

Prefer one neutral medium block for structural roles reused across contexts. Do not create a new block for every container.

- A neutral medium block carries a generic structural role — panel, header, group, row, search — usable in any context: sidebar, modal, panel, form.
- Use the neutral medium block wherever the structural role matches, regardless of the surrounding container.
- Do not create a context-specific block that duplicates a neutral medium role. Extend the neutral medium with a modifier or a component class for the delta only.
- A component-specific class is for content or behavior that belongs to one component only — item, tiles, name, count, selected, linked. Do not use it for structural roles a neutral medium already covers.
- Before creating a new block, check whether an existing neutral medium block covers the structural role. If it does, reuse it and add only the component-specific delta.

### Class inheritance

- A shared base class owns the full declaration set for its semantic role. A component class that extends it declares only the delta.
- Apply the base class and the component class together in the template.
- The component class must not redeclare a base property with the same value. It may override with a different value only when the delta is semantically meaningful.
- Do not duplicate an existing base class's full declaration set. Extend it instead.
- Before creating a new component class, check whether an existing shared base class covers the role. If it does, extend it and keep only the delta.
- A component class with zero unique delta is dead code. Remove it and use the base class alone.
- If no base class matches, create a new base class in the shared stylesheet and reuse it across components.

### Shared class detection

When auditing scoped styles for shared class candidates, apply these checks in order:

1. **Declaration match + semantic role match.** Compare declarations of a scoped class against existing shared classes. If they match or are close, ask whether the semantic role is the same (title, hint, empty state, flex row, flex col). If yes, replace with the shared class. If no, classify as `coincidental match, do not merge`.
2. **Delta extraction.** When a scoped class extends a shared class already applied in the template, keep only the component-specific delta. Remove every declaration that duplicates the shared class with the same value.
3. **Zero-delta detection.** A scoped class whose declarations match a shared class exactly is dead code. Remove the scoped class and use the shared class alone.
4. **Pattern repetition across files.** Grep for class name suffixes that likely repeat (`__title`, `__heading`, `__hint`, `__dim`, `__empty`, `__grow`) across files. If three or more files declare the same semantic role with similar declarations, extract a new shared class.
5. **Element selector vs class.** A scoped class that only redeclares properties already owned by an element selector in `base.css` is dead code. The element selector already covers the element; remove the scoped redeclaration.
6. **Interaction, accessibility, and responsive check.** Before merging, verify that hover, focus, active, disabled, overflow, and responsive behavior of the scoped class match the shared class. If they differ, do not merge.
7. **Block prefix is not a reason to keep a duplicate.** Different block prefixes (`settings__title`, `npc__heading`, `deploy__section`) do not prevent merging when the semantic role is the same. Merge into one shared class.
8. **Layout-only delta vs semantic delta.** A gap or padding difference is a layout delta; if the role is the same, use a modifier (`form__col--tight`). An alignment or interaction difference (`align-items: flex-start` vs `center`, clickable vs static) is a semantic delta; do not merge.

### No redefinition in scoped style

- A class already defined in a shared or subsystem stylesheet must not be redefined inside a scoped style.
- If a delta applies to the shared role itself, add it to the shared definition.
- If a delta applies to one component only, use a component-specific class. Do not reuse the shared class name.
- A scoped block that redefines a shared class with zero unique delta is dead code. Remove it.

### No dead selectors and no orphan classes

- Every selector in a scoped style block must have a matching class in the same component's template, generated markup, or `:class` binding.
- Every class in a template must have a matching definition in some CSS source.
- A selector whose class was removed from the template is dead. Remove the selector.
- A class in a template with no matching definition is an orphan. Remove the class or add the definition to the correct file.
- A base element selector already covers the element. Do not add an empty class to rely on the element selector.

### Inline styles and `!important`

- Do not use static inline `style="..."` attributes. Use a scoped semantic class instead.
- Dynamic `:style` bindings are allowed for properties that depend on runtime state, such as position, color from data, or computed dimensions.
- Do not use `:style` for constant properties or properties that could be a class.
- When multiple SVG elements share the same static style, create one scoped class and apply it to all.
- Do not use `!important`. Use selector specificity to override.
- To override an element selector, use a class selector. To override a class selector, use a compound or parent-scoped selector.
- If a cascade conflict cannot be resolved without `!important`, the CSS structure is wrong. Refactor the cascade.

### Theme tokens

- Use theme variables for all colors, spacing, typography, z-index, shadows, radii, transitions, and durations. Do not hardcode theme tokens.
- This applies to CSS properties, SVG presentation attributes, and any template attribute that accepts a CSS value.
- Spacing values must use `--gap-*` tokens. Do not hardcode spacing when a token exists.
- Fixed element dimensions may use hardcoded px when the size is a one-off design decision, not a spacing value.
- Border widths may be hardcoded; they are not spacing tokens.
- When a new spacing value appears in 3 or more places, add it as a token before using it.

### Cleanup is project-wide

- When a class, modifier, or pattern is removed, grep the entire project and remove every reference in the same change: template attributes, `:class` bindings, scoped style selectors, shared stylesheet definitions, and string literals in script files.
- Removing a class from one file is not complete until every other file that references it has been updated in the same change.
- Do not introduce a replacement unless the product requires it. If the class is simply unused, delete it and stop.

### Compliance check before task completion

After any change that touches CSS, classes, or templates, before marking the task complete, grep the entire project and verify:

1. No dead selector: no scoped style selector whose class is absent from the same component's template.
2. No orphan class: no template class with no matching CSS definition.
3. No shared class redefined inside a scoped style block.
4. No class placed in a file whose scope does not match its usage.
5. No stale reference to a removed class, modifier, or pattern remains.

If any check fails, fix it in the same change.

## Definition and instance principles

A reusable definition is the source of truth identified by an id. An instance references its definition by id and owns only position, rotation, and instance-specific overrides.

- A definition owns reusable data: defaults, validation metadata, tags, and configuration.
- An instance must not carry a second editable definition source. Identity and reference fields are structural and are not editable definition data.
- Do not infer or update a definition from an instance edit.
- When adding or changing a definition field: add it to the definition and canonical persisted shape, normalize and validate at every ingress boundary, resolve from the definition whenever an instance is created, rendered, edited, persisted, synced, or simulated, and propagate changes by resolving again. Never treat stale instance data as authority.
- Include the definition in sync/export when runtime needs it.
- Do not copy definition fields onto derived instances as editable snapshots unless an explicit override model exists.

## Data boundary and normalization principles

A data boundary is any transition between untrusted input, persistence, runtime, sync, UI, or derived instances.

- Normalization happens at ingress: accepts unknown or loosely typed input, returns canonical data or rejects, is idempotent, and does not depend on runtime context.
- Resolution happens before consumption: derives runtime values from canonical data and context, may apply deterministic defaults, and is the single path for derived values.
- Do not combine normalization and resolution in one helper.
- Canonical helpers must be the single boundary entry point for their shapes. If a new persisted or runtime shape has no canonical helper, create and verify the helper before implementing the consumer.
- Do not inline defaults in consumers when a resolver exists.
- Do not use raw casts to bypass migration or persistence validation.
- Do not merge untrusted patches directly into canonical objects without re-normalizing.
- Do not add persisted fields without a validation/normalization path.
- Do not re-derive values in consumers when a resolver already provides them.
- Do not place canonical normalization helpers in a component, composable, or store-specific module.

Before implementing a feature that changes data flow, persisted fields, migration, UI saves, sync, validation, or runtime adapters, document every ingress and egress boundary touched, the canonical helper used at each boundary, the resolution helper used by each consumer, any inheritance risk, and any missing helper. If no data boundary is touched, explicitly state that.

## Persistence and CRUD principles

- Persisted domain data must have one clear source of truth. UI-only state must not be confused with persisted domain data.
- A committed CRUD action must not be reported as successful until persistence has succeeded and the written data has been verified/read back. Await the save before returning. Do not use fire-and-forget.
- Store/domain operations own persistence; components should not need a second save for the same mutation.
- Do not run parallel saves for one committed action.
- High-frequency UI changes may use a draft in memory, but must flush the final value once at interaction end.
- Delete operations require confirmation at the UI boundary. Internal cleanup for cancelling a draft is not a user delete and must not open a second confirmation.
- Success toasts must follow verified persistence. Failed saves must not show success; reload or restore the last canonical persisted state.
- Keep persistence simple. Do not introduce services, databases, queues, event buses, generic repositories, or distributed transaction systems without a demonstrated need.
- CRUD modules own domain operations and use precise domain names. A CRUD operation may coordinate multiple related records when the user action is transactional.
- Keep the existing store/facade boundary if it provides the needed access; do not add a facade that only forwards calls.
- Compatibility wrappers may exist during migration, but there must not be two independent implementations of the same operation.
- Every destructive entity delete must confirm, persist, verify, and then report success.
- Removing an assignment from a form is distinct from deleting the entity that owns it unless the product explicitly defines it as destructive.

## Tag principles

- A tag definition is separate from tag references on any entity.
- Deleting a tag definition must not silently destroy references unless the product explicitly chooses cascade behavior.
- Orphan references must be visible at the relevant detail view and must have a defined runtime behavior.
- Undefined/orphan tags must not silently control runtime matching.
- Tag comparison and persistence must use the canonical tag normalization helper.

## Shared domain engine principles

- Editor preview and runtime use one pure domain engine implementation.
- Adapters convert their source data to the engine's canonical input and own lifecycle/rendering only.
- The engine owns domain logic: selection, conditions, capacity, reservations, checks, pathfinding, repathing, waiting, occupancy, durations, and events.
- Convert persisted units to engine units only inside the runtime adapter.
- Preserve runtime entity identity in the runtime adapter; editor preview agents may use temporary identities.
- Do not duplicate engine behavior in Vue components or adapters.

## Verification principles

After implementation, choose verification appropriate to the touched boundaries. For changes involving definitions, instances, domain data, migration, sync, or engine adapters:

1. Run the normalization audit and fix any failed boundary.
2. Run domain/data validation.
3. Run engine tests when engine or runtime data is involved.
4. Run typecheck and the production bundler.
5. Run BEM lint when templates/styles/classes are touched.
6. Report unrelated pre-existing failures separately; do not hide them or change unrelated systems just to make a broad legacy test pass.

## Product scope

- Prefer direct, understandable local persistence over production-scale abstractions.
- Do not optimize for multi-user synchronization or remote deployment unless the product scope changes.
- Preserve user data and validate cross-domain references whenever data domains are split or recombined.

## Development server

- Assume the user manages the development server and may already have it running.
- Do not start a dev server or open a duplicate server unless the user explicitly asks.
