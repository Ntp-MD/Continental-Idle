---
trigger: always_on
---

# Reusable CSS Class Reduction Workflow

Use this workflow for every CSS/UI audit or refactor. The goal is to reduce unnecessary classes and declarations while keeping CSS semantic, reusable, maintainable, and non-Tailwind.

> **Source of truth for base rules:** naming conventions, global CSS rules, class reuse policy, base-plus-variant composition, CSS layering by responsibility, and reusable-class discovery rules live in the project's global rules file (for example, `global_rules.md`). This file adds the audit/refactor workflow. Do not duplicate project-specific rules here; defer to the project's global rules when they conflict.

---

## CSS File Placement Decision Framework

Before writing or moving any CSS rule, decide which layer owns it. The four layers map to four destinations. Use the first tier whose criteria match.

### Tier 1 — Reset / base layer → project base stylesheet

**What goes here:** element selectors (`button`, `input`, `body`, `*`, headings) that define the shared defaults every instance of that element inherits. The exact filename varies by project (`base.css`, `reset.css`, or equivalent).

**Criteria (ALL must be true):**

- The selector is an element, attribute, universal, or element pseudo-class selector — not a component class.
- The declarations apply to every instance of that element across the application.
- Removing the rule would change the default behavior or appearance of every matching element.

**Generic example:**

```css
/* base.css — shared defaults for every button */
button {
  font-family: var(--font-family);
  cursor: pointer;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  padding: var(--space-xs) var(--space-sm);
}
```

**Do NOT put here:** class-based rules, component variants, component states, or styles scoped to one component.

---

### Tier 2 — Project-wide reusable layer → shared components stylesheet

**What goes here:** class selectors reused across unrelated components, or classes belonging to an established reusable role family. The file is commonly named `components.css`, but use the project's actual shared components stylesheet.

**Criteria (ANY one is sufficient):**

- The class is referenced in two or more Vue SFC files from different subsystems.
- The class belongs to an established reusable role family such as `btn__*`, `card__*`, `badge__*`, `tag__*`, `panel__*`, `section__*`, `actions__*`, `layout__*`, `alert__*`, `input__*`, `toast__*`, or `modal__*`.
- The class is a base or variant used by a base-plus-variant composition.

**Hard rule:** If a class is used in exactly one Vue SFC and does not belong to an established reusable role family, it does not belong in the shared components stylesheet. Move it to a subsystem stylesheet or Vue SFC scoped style.

**Generic example:**

```css
/* shared components stylesheet */
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-sm);
}

.card__outlined {
  background: transparent;
  border-color: var(--color-accent);
}

.btn__primary {
  background: var(--color-brand);
  color: var(--color-on-brand);
}

.btn__danger {
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.badge {
  font-size: var(--font-xs);
  padding: var(--space-xs);
}

.actions {
  display: flex;
  gap: var(--space-sm);
}
```

**Do NOT put here:** selectors named after one feature or component (for example, `.feature__*` or `.dialog__*`) unless they are genuinely reused or belong to an established reusable role family.

---

### Tier 3 — Subsystem shared layer → subsystem stylesheet

**What goes here:** classes shared by two or more Vue SFCs inside one subsystem, but not used outside that subsystem. The exact location is project-specific, for example `src/features/editor/editor.css`.

**Criteria (ALL must be true):**

- The class is used in two or more Vue SFC files.
- All usages are inside the same subsystem or feature folder.
- The class is not used outside that subsystem.
- The class does not belong to a project-wide role family; otherwise it belongs in Tier 2.

**Generic example:**

```css
/* feature/editor/editor.css — shared only by editor forms */
.properties__row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.properties__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.input__error {
  border-color: var(--color-danger);
}
```

Import a subsystem stylesheet once through the project's normal stylesheet entry point. Do not import it separately in every Vue SFC, which can create duplicate bundles or ordering problems.

**Do NOT put here:** classes used by only one component, or classes used across multiple subsystems.

---

### Tier 4 — Component-specific layer → Vue SFC scoped style

**What goes here:** classes used by exactly one component that encode unique layout, decoration, animation, overflow, or interaction behavior. This is the default destination when a class does not qualify for Tier 1, 2, or 3.

**Criteria (ANY one is sufficient):**

- The class is used in only one Vue SFC.
- The class has a feature-specific prefix and is not a reusable role.
- The declarations encode behavior unique to that component.

**Generic example:**

```css
/* inside a component's scoped style block */
.dialog {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
}

.dialog__content {
  max-width: var(--dialog-max-width);
  overflow: auto;
}
```

**Scoped style rules:**

- Put component-specific CSS inside `<style scoped>` in the Vue SFC. Do not use a plain `<style>` block for these rules.
- If the Vue SFC already has a scoped style block, append to it instead of creating a duplicate block.
- Global reusable classes referenced by the Vue `<template>` continue to work; scoping only affects selectors defined inside the scoped style block.
- Contextual overrides on global classes are allowed when they express a real component-specific delta and do not duplicate the global base or variant.

**Do NOT put here:** base, variant, or state rules that belong to reusable roles, or rules shared by multiple files in one subsystem.

---

### Decision flowchart

```text
Is the selector an element/attribute/universal selector?
├─ YES → Tier 1 (base/reset stylesheet)
└─ NO ↓

Is the class used across unrelated components or an established role family?
├─ YES → Tier 2 (shared components stylesheet)
└─ NO ↓

Is the class used by multiple files inside one subsystem?
├─ YES → Tier 3 (subsystem stylesheet)
└─ NO ↓

→ Tier 4 (Vue SFC scoped style)
```

### Quick placement test

Ask these questions in order:

1. Would removing this rule change every matching element in the application? → Tier 1.
2. Is this class used by unrelated components, or is it an established role/variant? → Tier 2.
3. Is this class shared only inside one subsystem? → Tier 3.
4. Is this class used by one component or does it encode unique behavior? → Tier 4.

If unsure, default to the narrowest scope. Promote a class to a broader stylesheet only when reuse evidence is clear.

---

## Naming Convention Enforcement (Mandatory)

Before any CSS change, perform these checks in addition to the project's global naming rules:

1. **BEM separator check**
   - Scan all class names in changed files.
   - Reject a single class name with three or more `__` separators unless the project explicitly allows another convention.
   - Rename it or split the responsibility into multiple classes.

2. **Semantic role validation**
   - For every new or renamed class, verify that it describes a reusable role or a genuinely unique component behavior, not merely a file location.
   - Reject names such as `.feature__button` when the element is an ordinary shared button.
   - Prefer role names such as `.btn__danger`, `.card__outlined`, or `.actions__center`.

3. **Duplicate name check**
   - Search the entire codebase for the proposed class name.
   - Reuse an existing class when it has the same function.
   - Choose a distinct name when an existing class has a different function.

4. **Pre-change verification**
   - List all classes being added, renamed, or removed.
   - Confirm each class complies with naming, semantic-role, and duplicate rules before editing.

5. **Post-change verification**
   - Search for single class names with three or more BEM separators.
   - Search for Vue SFC scoped button/card names that should use shared roles.
   - Correct violations before marking the task complete.

6. **Violation handling**
   - Revert the violating change.
   - Rename the class or move it to the appropriate layer.
   - Re-run the checks.
   - Never leave a known naming violation unresolved.

---

## Consolidation Targets

Apply the project's base reuse policy to these high-yield areas:

1. **Buttons** — consolidate repeated button styling into the existing button role and semantic variants.
2. **Cards** — consolidate repeated card styling into the existing card role and variants; keep unique internal behavior Vue SFC scoped.
3. **Modal/overlay surfaces** — consolidate repeated overlay behavior, but preserve real differences in size, alignment, stacking, overflow, and interaction.
4. **Action groups** — consolidate repeated action layouts; use variants for alignment, filling, wrapping, or stacking differences.
5. **Layout groups** — consolidate equivalent flex/grid arrangements into shared layout roles.
6. **Tags, badges, alerts, tabs, rows, inputs, and lists** — consolidate only when the semantic role and behavior match.

---

## When Not to Merge

Defer to the project's global definitions of role, coincidental match, and unique behavior when uncertain.

- Do not merge selectors whose semantic roles differ, even if they share four declarations. Report `coincidental match, do not merge`.
- Do not replace meaningful state classes such as selected, disabled, locked, active, loading, or dirty when the state changes behavior.
- Do not use a generic class to hide unique responsive, accessibility, interaction, or overflow behavior.
- Do not merge two selectors merely because they have the same color, padding, or border.
- Do not create a class only to repeat global element behavior or an existing base class.

---

## Required Audit Process

1. Inventory role classes and their usages.
2. Identify repeated button, card, modal, action-group, layout, input, and status patterns.
3. Separate safe reusable matches from semantically unrelated matches.
4. Inspect parent/template context before changing layout or spacing.
5. Migrate templates to existing base-plus-variant roles.
6. Move only shared structure into reusable styles.
7. Preserve unique behavior through contextual or scoped styles.
8. Remove obsolete selectors only after confirming no template, script, dynamic, or generated usage remains.
9. Run duplicate-class and redundant-declaration checks for every touched class.
10. Run the project's build, lint, and typecheck commands when available.
11. Report unrelated pre-existing verification failures separately.

---

## Implicit Layout Redundancy Detection

Identify declarations that repeat sizing or layout behavior already supplied by CSS formatting rules. This is a declaration-level audit: the class may remain useful while one property is redundant.

### Core Principle

Do not assume `width: 100%` is necessary because an element should fill its parent. Verify the formatting context first:

- A normal block-level element with `width: auto` fills the available inline size by default.
- A normal `display: flex` or `display: grid` container is block-level by default and normally fills its containing block.
- A flex item normally stretches across the cross-axis when its parent uses the default `align-items: stretch`.
- A grid item normally stretches across its grid area when default stretch alignment applies.
- A positioned element with `inset: 0` already receives its containing-block edges from `top`, `right`, `bottom`, and `left`; an additional width or height may be redundant.
- A flex shorthand can override a declared width through `flex-basis`; verify whether the width has any effect.
- `inline-flex`, `inline-grid`, replaced elements, form controls, and elements under `align-items: center` or `align-self: center` are not automatically full-width.

### Detection Process

1. Search all styles for:
   - `display: flex` or `display: grid` with `width: 100%` or `height: 100%`
   - `display: block` with `width: 100%`
   - `inset: 0` with explicit width or height
   - `flex: ...` together with `width: 100%`
   - grouped selectors where only some members need the shared declaration
2. Read the parent context:
   - parent display mode
   - parent `align-items` and child `align-self`
   - whether the element is a flex or grid item
   - `max-width`, `min-width`, `flex-basis`, positioning, and replaced-element behavior
3. Classify each candidate:
   - **Redundant declaration** — removable without changing layout.
   - **Required sizing** — needed because stretch does not apply or a sizing constraint depends on it.
   - **Grouped-selector redundancy** — split the selector group before removing the property from only some members.
   - **Uncertain** — preserve until browser/visual verification.
4. Check wrapping, max-width behavior, responsive states, and sibling layout before editing.
5. Apply the smallest change: remove only the redundant declaration, not the whole class.
6. Run build and regression checks after editing.

### Required Audit Output

For each candidate, report:

| Selector   | Declaration   | Parent/context evidence      | Classification        | Confidence |
| ---------- | ------------- | ---------------------------- | --------------------- | ---------- |
| `.example` | `width: 100%` | block child of normal parent | redundant declaration | high       |

Use the exact phrase `redundant CSS declaration caused by implicit layout behavior` for confirmed cases. Use `required sizing` for declarations that must remain. Do not label a still-used selector as dead code merely because one declaration is redundant.

### Safe Examples

```css
/* redundant: a block-level element already fills its parent */
.example {
  display: block;
  width: 100%;
}

/* redundant when the item stretches to its grid track */
.grid > .item {
  display: grid;
  width: 100%;
}

/* required: inline-flex does not automatically fill the parent */
button {
  display: inline-flex;
  width: 100%;
}

/* required or potentially required: max-width depends on the width basis */
.dialog {
  width: 100%;
  max-width: 80%;
}
```

### Do Not Misclassify

- A used selector with one unnecessary declaration is not dead code.
- Use `redundant CSS declaration` or `implicit layout redundancy` for that case.
- Use `unused CSS` or `dead CSS` only when the whole selector has no verified template, script, dynamic, generated, inheritance, or role-family usage.
- Preserve width when it creates an intentional full-width line, works with `max-width`, or overrides non-stretch alignment.

---

## Unused Class Detection

Identify and remove CSS classes that are declared but never used in Vue templates, `<script setup>`/TypeScript, generated class names, or supported role families.

### Detection Process

1. Extract class selectors from all stylesheets, scoped styles, and subsystem styles.
2. Search Vue SFC `<template>` blocks for static class attributes and dynamic `:class` bindings.
3. Search `<script setup>`/TypeScript for class strings, `classList` calls, conditional maps, and constructed class names.
4. Identify classes that appear only in other CSS selectors; these are candidates, not automatic removals.
5. Check base-plus-variant families and documented extension points before removal.

### Removal Criteria

Remove a class only when ALL are true:

- It is declared in a project stylesheet.
- It is not referenced in Vue templates, `<script setup>`/TypeScript, generated markup, or dynamic class construction.
- It is not a required base, variant, state, inheritance target, or subsystem role.
- Removing it does not leave a broken selector or empty declaration.

### Exceptions

Do NOT remove classes that:

- Belong to an established role family, even if currently unused.
- Are required by a third-party library or Vue integration.
- Are used through inheritance, combinator selectors, generated markup, or runtime class generation.
- Are documented examples or intentional extension points.

---

## Empty Declaration Detection

Identify and remove style declarations with no properties.

### Detection Process

1. Scan all stylesheets and scoped style blocks for empty class blocks.
2. Treat whitespace-only and comment-only blocks as empty.
3. Check whether the selector is part of a meaningful combinator, inheritance, Vue-generated style, or runtime pattern before removal.

```css
.example {
} /* empty — remove after usage verification */

.example {
  /* comment only — remove or document an intentional placeholder */
}
```

### Removal Criteria

Remove the declaration only when ALL are true:

- The block is empty or contains only comments/whitespace.
- The selector is not a meaningful combinator or Vue/runtime hook.
- It is not a target for `<script setup>` manipulation or generated styles.
- Removing it does not break a base-plus-variant contract.

---

## Audit Output Format

When performing a CSS/UI audit, produce findings as a table with:

`old selectors | shared declarations | proposed class or declaration | rationale | confidence (high/med/low)`

For every proposed consolidation or redundant-declaration removal:

- Quote the exact matched CSS and Vue `<template>` text.
- Include verified file and line references when available.
- Explain the shared semantic role or the parent-layout evidence.
- Identify preserved state, hover, focus, responsive, disabled, accessibility, and interaction behavior.
- Explicitly report unsuitable matches as `coincidental match, do not merge`.

After the table, report:

- Classes/declarations removed.
- Reusable classes added or promoted.
- Remaining component-specific or subsystem-specific styles and why they remain.
- Uncertain cases that need visual/browser verification.
- Build, lint, and typecheck results.

---

## Audit-Specific Checklist

These items supplement the project's global CSS rules:

- [ ] Interactive elements have visible focus styles and acceptable text contrast.
- [ ] Base/reset styles live in the base stylesheet.
- [ ] Reusable variants live in the shared components stylesheet.
- [ ] Subsystem-shared styles live in a subsystem stylesheet.
- [ ] Component-specific styles live inside Vue SFC `<style scoped>` blocks.
- [ ] No redundant declarations remain after parent-context review.
- [ ] No unused classes remain without a documented exception.
- [ ] No empty declarations remain without a documented placeholder reason.
- [ ] No variant duplicates base declarations.
- [ ] Dynamic, script-generated, inherited, and third-party class usage was checked.
- [ ] Build, lint, and typecheck pass, or unrelated failures are reported separately.
