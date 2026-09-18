# Editor UI layout

Project domain facts for `src/blueprint-editor/` UI form, markup, CSS, and class patterns. `AGENTS.md` states the rules; `skill.md` routes here.

## Activation

- Use: any change under `src/blueprint-editor/` touching markup, CSS, classes, components, store CRUD, or modals.
- Don't use: pure engine/domain logic, floor geometry, or migration code with no UI surface. Read only this doc for UI tasks (plus glossary for labels).

Canonical form/markup/CSS/class patterns for `src/blueprint-editor/` UI.

## Rules

1. Reuse first, approval to add. Grep `src/styles/components.css` plus neighboring components for a class covering the role; extend with a modifier carrying only the delta. A new shared class, component, or token needs explicit user approval first. A scoped delta-only modifier or a new UI label does not - use player vocabulary and note it in the report.
2. Two-section rows use `.form__row.form--start > div { flex: 1; }`: one row, plain `div` groups, never a `form__row` nested inside a `form__row`. Nesting is only for horizontal controls whose children are not `div`s. Groups stack as `form__col`; sections separate with `form__col form--section`.
3. Tabs use shared `.tabs__bar` / `.tabs__tab` with `role="tablist"`; the bar stays fixed while only the panel scrolls. Never per-component tab classes. Selection uses `flag--active` like every other UI control.
4. Showcase gate: a new UI primitive or wrapper must appear in `src/dev/UiShowcase.vue` in the same change. Static SVG samples need no CSS and no extra entry. Feature panels reachable through an already-showcased modal need no extra entry.
5. Labels use player vocabulary, never schema names ("Shape Radius" not "Label Radius"). Test: read the label to someone who never saw the code - if they cannot guess, rename it.
6. No static inline `style="..."`; dynamic `:style` only for runtime values. No `!important`. No `box-shadow` / `drop-shadow`; state via borders only. Spacing uses `--gap-*` tokens.
7. A class is shared/global only when: 3+ real call sites, same role/interaction/accessibility/responsive/scope, no existing class covers it, name describes a role not an appearance, and no token can replace it.

## Naming (BEM)

- `block__element` for structure, `block--modifier` for block states, `block__element--state` for element states. No triple `__`, no hyphen-simulated compounds.
- State vocabulary for UI controls is `flag--*` ONLY (selection = `flag--active`). Block-specific `--state` classes are allowed only for domain rendering internals (canvas drawing, grid tile states).
- Different block prefixes are not a reason to keep duplicates: same semantic role across files merges into one shared class. Coincidental declaration matches with differing roles stay separate.

## Scope and cascade

- Shared semantic class -> shared/global stylesheet. Subsystem-shared -> subsystem stylesheet. Single-component -> scoped style. Never cross these lines.
- A base class owns its full declaration set; an extending class declares only the delta. Zero-delta classes are dead code.
- Layers, base first: `reset.css` -> `components.css` -> `layout.css` -> scoped styles. Never re-declare a property + value the lower layer already provides; a deliberate override needs no pre-approval - note it in the report.
- Inputs size to their value by default (`field-sizing: content`, `min-width: 5ch` floor); never cap with `max-width`. `select` and `textarea` fill their row. Sizing is explicit per element (`size--fit` / `size--fill` / `size--stretch`).
- Buttons follow the `reset.css` padding; deliberate custom padding needs no pre-approval - use sparingly and note it in the report (except structural controls: grid-cell buttons, icon-only close/remove, hidden overlay inputs).

## Grid editor parity

`WalkableGridEditor.vue` (asset walkable/interact grid) and the floor tile-paint flow (`EditorCanvas.vue` + `useCanvasTilePaint.ts` + `store/floors.ts`) are deliberately separate - do NOT merge them. Touching brushes, modes, hints, legends, or tile visuals in one requires checking the other in the same change. Shared math stays in the domain types module (pure normalize helpers).

## Component patterns

- Store: components import from the shared blueprint store (`useAssetsStore` and friends). Do not import store internals directly, and do not create pass-through facade files.
- Modals: wrap in `ModalShell` with `:open` / `@close`. Load heavy or rarely opened modals with `defineAsyncComponent`.
- Unsaved-changes tracking: `useDirtyBaseline` - one baseline snapshot plus a `dirty` computed. Do not hand-roll dirty flags, and do not stringify state for comparison.
- Concurrency: store-level mutations run through the store's single-writer `runExclusive` queue; UI pending state uses `useAsyncAction`. One guard per layer, no extra boolean flags duplicating the guard.
- Walkable-grid domain logic (tile states incl. door tiles) normalizes in the domain types module as pure functions. Components compose it, never re-implement the math inline.
- Declarative schemas: canvas/editor settings are parsed via `CANVAS_FIELD_SPECS` / `EDITOR_FIELD_SPECS`. Never enumerate their keys by hand elsewhere.
- Confirmation: `useConfirm().confirm` from `@/composables/useConfirm`, never `window.confirm`. User feedback: `useToast` for visible messages, `editorLog` for console diagnostics. Never `alert` / `console.log` for user-facing state.

## Verify (compliance check before completion)

- Run the routed suite for the change: `*.vue` -> `npm run lint:bem && npm run lint:css`; CSS-only (`src/**/*.css`) -> same two; store changes -> the single matching `test:<name>` (human pick via `node harness/scripts/verify.mjs route`).
- Project-wide class audit after touching markup, styles, or classes: no dead selectors, no orphan classes, no shared class redefined in scoped styles, every class in its scope's file, no stale references, every shared class has 3+ call sites, no zero-delta classes, no unmerged same-role pairs, no merged differing-role pairs, no redundant inherited declarations, no layer duplicates without approval, zero new shared classes without an approval reference (scoped delta-only modifiers and UI labels are noted in the report instead).