# Reusable CSS Class Reduction Workflow

Use this workflow for every CSS/UI audit or refactor. The goal is to reduce the number of classes while keeping semantic, reusable CSS and avoiding Tailwind or utility-class sprawl.

---

## Core Principle: Name the Role, Not the Location

A class should describe **what an element is or how it behaves**, not the file, component, panel, or screen where it happens to be used.

Prefer:

```html
<button class="btn btn__danger">Delete</button>
<div class="card__panel">
  <div class="actions actions__center">
    <div class="layout__row"></div>
  </div>
</div>
```

Avoid component-location classes when the visual role is already reusable:

```html
<button class="supplyroute__btn supplyroute__btn__dismantle">
  <div class="powerbalance__card">
    <div class="prestige__actions"></div>
  </div>
</button>
```

Use a component-specific class only when the component has genuinely unique structure, sizing, interaction, or responsive behavior.

---

## Class Reuse Policy (mandatory before creating any new class)

1. BEFORE writing a new class, search the existing CSS/token files and templates for a class that already provides the same visual role. Search by role: `button`, `card`, `modal`, `badge`, `row`, `input`, `actions`, or `layout` — never only by component filename.
2. Reuse an existing base class whenever possible. Add a new class only for a genuinely new structural pattern or a visual/state variant.
3. Prefer the base-plus-variant pattern:
   - Base class = reusable structure, layout, spacing, border, and sizing.
   - Variant class = color, state, emphasis, or controlled size variation.
4. Do not create a component-specific button class when a reusable button variant exists. Prefer combinations such as:
   - `.btn`
   - `.btn__primary`
   - `.btn__success`
   - `.btn__danger`
   - `.btn__warning`
   - `.btn__ghost`
   - `.btn__gold`
   - `.btn__block`
   - `.btn__sm`
   - `.btn__icon`
5. Do not create a component-specific card class when an existing card variant is sufficient. Prefer `.card`, `.card__panel`, `.card__primary`, or another proven card variant.
6. Use shared layout roles for repeated flex/grid structures. Prefer reusable roles such as:
   - `.layout__row`
   - `.layout__wrap`
   - `.layout__column`
   - `.actions`
   - `.actions__center`
   - `.actions__fill`
   - `.actions__wrap`
7. NEVER name a class after the file or component it lives in when the structure is reusable. For example, do not create `.hotel-modal__button` if the element is just a reusable button. File-scoped naming is allowed only for genuinely unique structure.
8. Before finishing a task, run a duplicate-check. List every class touched or added and confirm that it does not duplicate an existing declaration block with the same properties and values.
9. When in doubt, ask: "Does this class encode a reusable role, or only WHERE it is used?" Only the reusable role justifies a new class.

---

## Class Reduction Targets

During an audit, inspect these areas first because they usually produce the largest safe reduction:

### Buttons

Migrate component-specific button classes into `.btn` plus semantic variants. Preserve unique layout behavior with contextual selectors when needed, for example:

```css
.start .btn {
  /* start-screen-specific sizing only */
}

.upgrade__card .btn {
  /* upgrade-card-specific sizing only */
}
```

Do not keep both a component button class and a reusable button class when the component class only repeats button styling.

### Cards

Use `.card` and existing card variants for repeated background, border, radius, and padding. Keep a component class only when it contributes unique internal layout or behavior.

### Modal Overlays

Reuse `.modal__overlay` for the shared overlay behavior. Add a modifier or contextual selector only for a real difference such as width, alignment, z-index, or overflow behavior.

### Action Groups

Use `.actions` for repeated button groups. Add modifiers for meaningful layout differences:

```html
<div class="actions actions__center">
  <div class="actions actions__fill">
    <div class="actions actions__wrap"></div>
  </div>
</div>
```

Do not create `.prestige__actions`, `.supplyroute__actions`, or `.errorboundary__actions` when they only provide the same flex and gap layout.

### Repeated Layout Groups

Use reusable layout roles for repeated flex/grid arrangements. Do not create separate `hstack`, `vstack`, `row`, or `wrap` classes for every component when their structure is equivalent.

Keep a component-specific selector only for additional component behavior, such as a special border, padding, width, or overflow rule.

---

## Automatic Reusable Class Discovery Rule

**Threshold:** When **4 or more identical property-value declarations** appear across multiple selectors, consider a reusable class.

A candidate is actionable only when all of the following are true:

- The selectors share the same reusable semantic role.
- The pattern appears in at least 2 usages or represents an existing base-plus-variant pattern.
- The declarations are not inherited or already supplied by a global element selector.
- Hover, focus, active, disabled, responsive, and other state modifiers are compatible.
- The proposed class reduces duplication rather than adding another wrapper or utility class.

The threshold is a discovery signal, not an automatic merge command. Semantic role and behavior take priority.

---

## When NOT to Merge

- Do not merge classes solely because they share four declarations if their semantics differ. Mark them as `coincidental match, do not merge`.
- Do not merge staff cards with assassin cards merely because both are cards.
- Do not merge unrelated controls merely because they use the same color.
- Do not create a class only to repeat global `button`, `input`, or existing base-class behavior.
- Do not replace meaningful component state classes such as selected, disabled, locked, active, hijacked, or dirty if the state changes behavior.
- Do not use a generic class to hide unique responsive or interaction behavior.
- Do not introduce Tailwind, utility-class sprawl, inline style duplication, or long class combinations that encode individual CSS properties.

---

## Naming and Structure

- Follow the repository's existing flat double-underscore BEM convention.
- Use no more than 2 `__` separators in one class name.
- Prefer reusable role names such as `.btn__ghost`, `.card__panel`, `.actions__center`, or `.layout__row`.
- Use base-plus-variant classes instead of component-location names.
- Before naming, check the directory and existing templates for a class with the same function to avoid near-duplicates.
- Keep global reusable roles in global CSS and genuinely component-specific rules in scoped CSS.
- Do not add a new CSS variable without user confirmation. Reuse existing project tokens first.

---

## Required Audit Process

1. Inventory existing role classes and their usages.
2. Identify duplicate button, card, modal, action-group, and layout patterns.
3. Separate safe reusable matches from coincidental matches.
4. Migrate templates to existing base-plus-variant classes.
5. Move only shared structure into global reusable CSS.
6. Keep unique component styling through contextual selectors or scoped CSS.
7. Remove obsolete selectors after confirming they have no remaining usages.
8. Run a duplicate-class check for every class touched or added.
9. Verify that every new class has at least 2 usages or is part of an established base-plus-variant family.
10. Run the project's build/typecheck commands and report any unrelated failures separately.

---

## Audit Output Format

When performing a CSS/UI audit, produce findings as a table:

```text
old selectors | shared declarations | proposed class name | rationale for name | confidence (high/med/low)
```

For every proposed consolidation:

- Quote the exact matched CSS/template text.
- Include verified file and line references.
- Explain why the selectors share a semantic role.
- Identify any preserved state, hover, focus, responsive, or disabled behavior.
- Explicitly report `coincidental match, do not merge` where appropriate.

After the table, report:

- Classes removed.
- Reusable classes added.
- Remaining component-specific classes and why they remain.
- Build/typecheck results.

---
