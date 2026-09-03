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
