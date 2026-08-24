# Style and Markup Principles

Framework-agnostic by intent; adapt selectors/scoping to the stack (Vue scoped styles, CSS modules, plain stylesheets).

## Naming format (BEM)

- `block__element` for structure, `block--modifier` for block states, `block__element--state` for element states.
- `__` only between block and element; `--` only before a state/variant.
- No triple `__`, no hyphen-simulated compounds, no structural elements as block modifiers.
- Quote state keys containing `--` in template bindings.
- Use the shortest valid form.

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

## Theme tokens

- Use theme variables for colors, spacing, typography, z-index, shadows, radii, transitions. Never hardcode tokens.
- Spacing uses `--gap-*` style tokens when they exist. Border widths may be hardcoded. One-off fixed dimensions may be px.
- When a spacing value appears in 3+ places, add a token before using it again.

## Inline styles and specificity

- No static inline `style="..."`; use a scoped semantic class. Dynamic `:style` is allowed for runtime-dependent values (position, data-driven color).
- No `!important`. Override element selectors with classes; override classes with compound/parent-scoped selectors. If a conflict cannot be resolved without `!important`, refactor the cascade.

## Compliance check before completion

After touching markup, styles, or classes, verify project-wide:

1. No dead selector (class absent from its own component's template).
2. No orphan class (template class with no definition).
3. No shared class redefined inside scoped styles.
4. Every class sits in the file matching its usage scope.
5. No stale reference to anything removed.
