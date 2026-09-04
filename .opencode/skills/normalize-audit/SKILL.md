---
name: normalize-audit
description: Pre-flight audit for data boundary normalization. Invoke before implementing a feature that touches data flow (migration, loading, persistence, sync, UI save, validation, engine adapter) to verify the normalization plan is complete and no boundary is missed. Also triggers on "normalize audit", "data boundary check", "normalization plan", "canonical check".
---

# Normalize Audit Skill

Use this skill to audit a feature plan (or existing code) against the canonical normalization boundary rules in the project's agent rules and normalization boundary rule files.

## When to invoke

- Before implementing a feature that touches any data flow: migration paths, JSON loaders, persistence endpoints, layout validators, sync DTOs, NPC engine adapters, or UI forms that save persisted data.
- When the user asks "normalize audit", "check normalization", "data boundary check", "normalization plan", or "canonical check".
- When adding or modifying a field on any definition type (asset, room, object, interact config, anchor, wall segment, walkable grid, tile state).
- **Mandatory after implementing any change to a definition type or origin asset file** — see the "Definition type change gate" in the project agent rules. After the audit, also run the asset verification command to validate the data file against the new type shape.

## Audit procedure

Run this procedure and report findings as a table. Do not skip steps.

### Step 1 — Inventory data boundaries

Search the codebase for every point where the feature reads or writes external/legacy/user/synced data. Check at minimum these boundary categories:

- Migration paths — where legacy shapes are converted to canonical shapes
- JSON loaders — where external data enters the system, including override application
- Persistence endpoints — save/load boundaries
- Layout validators — strict shape validation entry points
- UI form saves — components that write persisted data
- Editor engine adapters — composables that adapt editor data to the engine
- Runtime adapters + sync DTOs — components and layout modules that build the synced payload

For each boundary found, record: file, line range, what data shape enters/leaves.

### Step 2 — Map to canonical helpers

For each boundary, name the specific normalization helper from the types module that must be used. At minimum these helper categories must exist and be applied:

| Helper category | Applies to |
|---|---|
| Anchor normalization | anchor arrays at any boundary |
| Interact config normalization | interact objects at any boundary |
| Wall segment normalization | wall segment arrays at any boundary |
| Walkable grid normalization | boolean walkable grids |
| Tile state normalization | tile state grids |
| Engine target resolution | engine adapter target building (NOT at persistence boundary) |
| Anchor bounds/walkable validation | anchor bounds and walkable checks |
| Grid consistency reporting | grid consistency checks |

If a boundary handles a shape with no matching helper, flag it as **GAP — needs new helper**.

### Step 3 — Detect anti-patterns

Search the touched files for these anti-patterns and report each occurrence:

- **Inline defaults**: reading optional fields with `??` fallbacks outside the dedicated engine resolution helper. These must be replaced with the engine target resolution helper.
- **Raw cast at migration**: type assertions (`as <DefinitionType>`) in migration paths. These must pass through the corresponding normalization helper instead.
- **Override patch without re-normalize**: merging overrides via `Object.assign` (or similar) without re-normalizing the result.
- **Snapshot on placed object**: a definition field copied onto a placed object without an explicit override model.
- **New definition field without helper**: a field added to a definition type that has no normalization helper at the boundary.

### Step 4 — Inheritance risk check

If the feature adds or modifies a definition field on an origin type:

1. Confirm the field is on the origin type, not copied onto the placed object type as an editable snapshot.
2. Confirm the field is included in persistence/sync if runtime needs it.
3. Confirm the layout validator validates the new field shape.
4. If the placed object carries the field, confirm it is resolved from origin (read-only snapshot for engine use) and not independently editable — unless an explicit overrides model exists.

### Step 5 — Report

Produce this report:

```text
## Normalize Audit Report

### Boundaries touched
| File | Lines | Data shape | Helper used | Status |
|---|---|---|---|---|
| ... | ... | ... | ... | OK / GAP / ANTI-PATTERN |

### Anti-patterns found
- <file>:<line> — <pattern> — <fix>

### Inheritance risks
- <field> — <risk> — <mitigation>

### Gaps (need new helper)
- <shape> — <proposed helper name>

### Verdict
PASS / FAIL — <summary>
```

## Constraints

- This skill is read-only audit. Do not modify code during the audit; propose fixes only.
- If the feature touches no data boundary, report "No data boundaries touched" and exit.
- Always cite exact file paths and line numbers as proof.
- Do not invent helpers that do not exist in the types module. Flag missing helpers as GAPs.
---

# Core Principles

## Conventions

- Follow the language/framework idioms already used in the file you edit. Check neighboring files before choosing patterns, libraries, or structure.
- Never assume a library is available because it is well known; verify the project already uses it.
- Keep imports at the top of modules.
- Follow security best practices. Never log or commit secrets and keys.

## Comments and documentation

- Do not add code comments unless explicitly requested.
- Do not create `*.md` documentation files unless explicitly requested.

## Simplicity and scope

- Prefer direct, understandable implementations. Do not introduce services, databases, queues, event buses, generic repositories, facades that only forward calls, or other infrastructure without a demonstrated need.
- Do not optimize for scale the product does not have (multi-user sync, remote deployment, caching layers) unless scope changes.
- Preserve user data. Validate cross-references whenever data domains are split or recombined.
- Never two independent implementations of the same operation.

## Dead code and cleanup

- When removing a class, function, modifier, or pattern, remove every reference project-wide in the same change: call sites, templates, styles, string literals.
- Zero-delta duplicates (code identical to what it extends or wraps) are dead code; remove them instead of keeping both.
- Do not introduce a replacement unless the product requires it. If something is simply unused, delete it and stop.

## Verification

- After implementation, verify with commands appropriate to the touched boundaries: typecheck, tests, lint, production build.
- Choose verification by boundary: persistence/migration changes need read-back checks; engine changes need engine tests; template/style changes need markup lint if one exists.
- Report unrelated pre-existing failures separately; do not hide them or change unrelated systems just to make a legacy test pass.

## Decisions (ADR)

Moved to [timeline-decision.md](timeline-decision.md): chronological
timeline of DIRECTION-level decisions only (Problem / Final solution /
Trade-off / Revisit trigger). Supersedes the former docs/adr/ notes and the
inline list that used to live here. Routine fixes, refactors and cleanups are
not recorded there.

## Editor patterns (canonical)

These are the settled patterns for `src/blueprint-editor/`. Reuse them; do not
introduce a second way to do the same thing.

- Modals: wrap in `ModalShell` with `:open` / `@close`. Load heavy or rarely
  opened modals with `defineAsyncComponent`.
- Tabs: shared `.tabs__bar` / `.tabs__tab` classes with `role="tablist"`
  semantics; the tab bar stays fixed while only the panel content scrolls.
- UI showcase: every UI primitive and wrapper component must appear in
  `src/dev/UiShowcase.vue` (open via `/?showcase=1` or the toolbar button).
  No UI component may exist outside the showcase. When adding or changing a
  UI component, update the showcase in the same change.
- Confirmation: use the injected `confirm()` dialog, never `window.confirm`.
- User feedback: `useToast` for user-visible messages, `editorLog` for console
  diagnostics. Never `alert` / `console.log` for user-facing state.
- Unsaved-changes tracking: `useDirtyBaseline` - one baseline snapshot plus a
  `dirty` computed. Do not hand-roll `dirty = ref(false)` flags set at every
  mutation site, and do not stringify state into keys for comparison.
- Concurrency: store-level mutations use `withStateLock`; UI pending state uses
  `useAsyncAction`. One guard per layer - do not add extra boolean flags that
  duplicate what the layer guard already does.
- Walkable-grid domain logic (tile states, wall segments <-> edges, door
  detection) lives in `gridEditing.ts` as pure functions. Components compose
  it; they do not re-implement the math inline.
- Store access: components import from `blueprintStore` (`useAssetsStore` and
  friends). Do not import store internals from `./store/*` directly, and do not
  create pass-through facade files.
- Declarative schemas: canvas/editor settings are parsed via
  `CANVAS_FIELD_SPECS` / `EDITOR_FIELD_SPECS`. Never enumerate their keys by
  hand elsewhere.
---

# Style and Markup Principles

Framework-agnostic by intent; adapt selectors/scoping to the stack (Vue scoped styles, CSS modules, plain stylesheets).

## Naming format (BEM)

- `block__element` for structure, `block--modifier` for block states, `block__element--state` for element states.
- `__` only between block and element; `--` only before a state/variant.
- No triple `__`, no hyphen-simulated compounds, no structural elements as block modifiers.
- Quote state keys containing `--` in template bindings.
- Use the shortest valid form: one short word when the scope is clear, no prefix the file already provides, no repeated parent concept, state words move into `--modifier`.

## Naming copy

- UI labels use player vocabulary, never schema names: "Shape Radius" not "Label Radius", "Passable" not "Walkthrough". Test: read the label to someone who never saw the code - if they cannot guess what it changes, rename it.
- Code identifiers may keep implementation names; only visible copy follows this rule.

## File placement by scope

- Shared semantic class used across components → shared/global stylesheet.
- Class shared within one subsystem → subsystem stylesheet.
- Class used by one component only → that component's scoped style.
- Never place a shared class in a scoped style, or a component-specific class in a shared stylesheet.

## Extend, do not duplicate

- A base class owns its full declaration set; an extending class declares only the delta. Do not redeclare a base property with the same value.
- Zero-delta classes are dead code: remove them and use the base alone.
- Before creating a new class, check for an existing one covering the role. If found, extend it with a modifier or component class for the delta only.
- Different block prefixes are not a reason to keep duplicates. Same semantic role across files → merge into one shared class.

## Coincidental matches

- Do not merge selectors merely because declarations match. If roles differ, it is a coincidental match — keep separate.
- Layout-only deltas (gap/padding) between same-role classes → use a modifier. Semantic deltas (alignment, interactivity) → do not merge.

## Neutral medium blocks

- Prefer one neutral structural block per generic role (panel, header, group, row) reused across contexts over one block per container.
- Component-specific classes are for content/behavior owned by one component (item, count, selected), not structural roles already covered.

## Dead selectors and orphan classes

- Every selector must have a matching class in the same component's template/generated markup/binding.
- Every template class must have a matching definition somewhere.
- An element selector that already covers an element does not need an empty helper class.
- When the last reference to a class is removed, remove its definition in the same change. Never retain a class "for future use".

## Theme tokens

- Use theme variables for colors, spacing, typography, z-index, shadows, radii, transitions. Never hardcode tokens.
- Spacing uses `--gap-*` style tokens when they exist. Border widths may be hardcoded. One-off fixed dimensions may be px.
- When a spacing value appears in 3+ places, add a token before using it again.

## Inline styles and specificity

- No static inline `style="..."`; use a scoped semantic class. Dynamic `:style` is allowed for runtime-dependent values (position, data-driven color).
- No `!important`. Override element selectors with classes; override classes with compound/parent-scoped selectors. If a conflict cannot be resolved without `!important`, refactor the cascade.

## Reusable class creation gate

A class is a candidate for shared/global scope only when all hold:

1. Real usage count >= 3 distinct call sites in the same change.
2. The five role dimensions match across every call site: semantic role, interaction, accessibility, responsive behavior, scope.
3. No existing class already covers the role; if one does, extend it with a modifier carrying only the delta.
4. The name describes a role, not an appearance (value/shape/color). Appearance-only intents belong to a token or utility, not a component class.
5. A token cannot replace it: if the only varying value is a color/spacing/dimension already in theme variables, use the variable; if the value appears in 3+ places, add a token first.

## Inheritance-aware declarations

Before adding or keeping a declaration, resolve its value through the cascade.
A declaration is redundant - delete it in the same change - when ALL hold:

1. The same property + value already reaches the element, either because the
   property is inheritable and an ancestor rule sets that exact value, or
   because a lower-specificity rule matching the same element sets it (element
   selector, universal `*` rule, shared class also carried by the element).
2. No UA override breaks the chain. Form controls (`button`, `input`,
   `select`, `textarea`, `option`) get font shorthand (family, size, weight,
   line-height), color, background, border, and padding from the UA
   stylesheet - re-declaring those on form controls is NOT redundant even
   when the value matches the ancestor. For every other element, inheritable
   properties (color, font-*, letter-spacing, line-height, text-transform,
   white-space, text-align) flow down untouched.
3. No intermediate rule between the source and this element changes the value.

Keep the declaration even when the value matches, when any of these hold:

- It is a normalize rule whose job is pinning a value against a UA default
  (e.g. `p` font-size, `textarea` line-height after a UA font shorthand).
- The value intentionally differs from the inherited one.
- A state rule (`:hover` / `:focus` / `:disabled`) re-asserts a base value to
  cancel a real leak from another state rule. If no leak exists, the
  re-assertion is redundant.

Also redundant: the same property declared twice inside one rule block - keep
the last, delete the earlier ones.

## Sizing and control defaults

- Inputs size to their value by default (`field-sizing: content` plus a
  `min-width: 5ch` floor). Never cap an input with `max-width` - the value
  and placeholder define the plausible width themselves.
- `select` and `textarea` fill their row (`width: 100%`).
- Sizing is explicit per element through utilities: `size--fit` (shrink to
  content), `size--fill` (fill the row), `size--stretch` (take the remaining
  flex space). Never blanket-apply stretch or fill from a parent selector -
  the element decides its own sizing.
- Buttons follow the `reset.css` padding. Custom button padding requires
  approval; the only exceptions are structural controls (grid-cell buttons,
  icon-only close/remove with fixed geometry, hidden overlay inputs).
- State modifiers: `flag--*` is the ONLY state vocabulary for UI controls -
  toggles, semantic colors, and selection all use it (selection = `flag--active`
  on the item). Never create a block-specific state modifier (e.g.
  `--selected`) for UI controls. Block-specific `--state` classes are allowed
  only for domain rendering internals (canvas drawing, grid tile states).
- Tabs use the shared `.tabs__bar` / `.tabs__tab`
  classes (`.tabs--sidebar` for vertical) with `role="tablist"` semantics.
  Tab selection uses `flag--active`, like every other UI control.
  Do not create per-component tab classes. Keep the tab bar fixed and scroll
  only the panel content.

## Layer precedence and duplicate approval

Layers, base first: `reset.css` (element base, always wins) -> `components.css`
(shared semantic classes) -> `layout.css` (app-shell layout: sidebar, panels) -> scoped component styles.

- `reset.css` owns the base values for every element type. `components.css`
  and scoped styles must not re-declare a property + value that `reset.css`
  already provides for that element (see Inheritance-aware declarations).
  Any such duplicate requires explicit user approval in the same change -
  the default action is delete.
- `components.css` owns shared semantic classes. Scoped styles must not
  re-declare a property + value already provided by a shared class the
  element carries (for example a `flag--*` modifier). Any such duplicate
  requires explicit user approval - the default action is delete.
- When `reset.css` and `components.css` would define the same property for
  the same role, `reset.css` wins: `components.css` declares only the delta
  that creates the new role.
- State modifiers with different semantics are not duplicates even when
  values look similar: `flag--*` is a toggle state (border + color), while
  `--selected` / `--active` on a block is a selection highlight (background
  tint). Keep them separate.

## Compliance check before completion

After touching markup, styles, or classes, verify project-wide:

1. No dead selector (class absent from its own component's template).
2. No orphan class (template class with no definition).
3. No shared class redefined inside scoped styles.
4. Every class sits in the file matching its usage scope.
5. No stale reference to anything removed.
6. Every shared class has >= 3 real call sites and a verifiable counterpart in template/markup/binding.
7. No zero-delta extending class remains.
8. No pair of classes shares a role without being merged, and no pair with differing roles is merged.
9. No declaration re-asserts a value already provided by inheritance or a lower-specificity rule, except the keep-cases listed under Inheritance-aware declarations.
10. No declaration duplicates `reset.css` or `components.css` values without explicit user approval in the change (Layer precedence and duplicate approval).

# Recap

- variables.css token value dont add token without approval
- reset.css is parent inherit declare
- other .css file can't not override declare without approval
- other stlye in .vue file can't not override declare without approval
---

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

- Body shapes use the theme convention: fill and stroke reference the asset fill/stroke theme variables with a fallback to the canonical default. Detail lines reference the dim text theme variable (`--text-secondary`). Never hardcode decorative colors inside asset art.
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
