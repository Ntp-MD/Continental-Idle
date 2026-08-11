---
trigger: always_on
---

# CSS Class Audit

This file defines the audit workflow for CSS class naming and usage. The project's general conventions remain in `AGENTS.md`; this file checks compliance and reports findings.

## 1. BEM Class Naming Audit

Audit every class added, renamed, or touched in the target files.

### Required format

```text
B__E--M
```

- `B` — Block: the independent component or feature, such as `card`, `modal`, `npcmanager`.
- `E` — Element: a structural child of the block, such as `title`, `role`, `header`.
- `M` — Modifier: a state or variant, such as `active`, `danger`, `compact`.

Use the shortest valid form:

```text
.block
.block__element
.block--modifier
.block__element--modifier
```

### Naming rules

1. A class name may contain **no more than three BEM parts**: Block, Element, and Modifier.
2. Count the BEM parts across the complete name. For example:
   - `card` = Block only
   - `card__title` = Block + Element
   - `npcmanager__role--active` = Block + Element + Modifier
3. Do not split a deliberate semantic token into extra words merely because it is a compound English term; the three-part limit applies to BEM ownership, not natural-language vocabulary inside one part.
4. Use `__` only between Block and Element.
5. Use `--` only before a state or variant Modifier.
6. Do not use a single hyphen as a BEM separator.
7. Do not simulate nested BEM with names such as `block__element__child`.
8. Do not use a structural child as a block modifier. For example, use `properties__empty` when `empty` is an empty-message element, not `properties--empty`.
9. Use an element-specific modifier when the state belongs to one element:
   - Correct: `npcmanager__role--active`
   - Incorrect: `npcmanager--role-active`
10. Use a block modifier when the state affects the entire component:
    - `modal--open`
    - `editor--loading`
11. In Vue `:class` object bindings, quote keys containing `--`:

```vue
:class="{ 'card__item--active': isActive }"
```

### Invalid examples

```text
block__element__child       # nested BEM / too many separators
block--element-state        # structural element hidden inside a modifier
block__element__sub--active # nested BEM and more than three parts
very-large-component-name   # more than three words
```

### Required BEM audit output

Report every violation in a table:

| Class      | File and lines     | Violation             | Corrected form           | Confidence |
| ---------- | ------------------ | --------------------- | ------------------------ | ---------- |
| `.example` | `path/file.vue:10` | More than three words | `.example__item--active` | High       |

If no violation is found, report:

```text
BEM audit: PASS
```

## 2. Class Normalization Audit

Class normalization means converting repeated, equivalent styling into a **reusable semantic class**. It is not merely renaming a class or merging selectors that happen to share a few declarations.

### Normalization goals

- Use one reusable base class for one semantic role.
- Use modifier classes for intentional variants or states.
- Keep component-specific layout and behavior in the component scope.
- Reduce duplicated declarations without hiding meaningful differences.
- Preserve responsive, accessibility, interaction, overflow, and focus behavior.

### Base-plus-variant pattern

Normalize repeated roles using this structure:

```html
<button class="btn btn--primary">Save</button> <button class="btn btn--danger">Delete</button>
```

```css
.btn {
  /* shared button role */
}

.btn--primary {
  /* primary-only delta */
}

.btn--danger {
  /* danger-only delta */
}
```

The base class owns shared role behavior. The modifier owns only the difference. Do not repeat base declarations inside every modifier.

### Candidate selection threshold

Use a declaration-level screen to suggest normalization candidates:

1. Compare declarations by exact CSS property/value pairs, not by property names alone.
2. Search the whole repository's CSS sources: `.css` files and `<style>`/`<style scoped>` blocks inside `.vue` files. TypeScript and JavaScript are checked for class usage and generated references, but not as CSS declaration sources.
3. When two or more selectors share **four or more exact declarations**, mark them as a normalization candidate.
4. Four shared declarations are only a screening threshold, not permission to merge automatically.
5. Before recommending the merge, verify semantic role, element context, interaction behavior, responsive behavior, accessibility, and usage scope.
6. If the selectors are semantically different, report `coincidental match, do not merge` even when they share four or more declarations.
7. Exclude declarations inherited from the base element selector when calculating the candidate threshold; do not create a class merely to repeat base behavior.
8. Separate shared declarations from real deltas. The reusable class must contain only the shared role, while variants or scoped rules preserve the deltas.
9. A candidate's replacement class must use a **neutral semantic name** based on the reusable role, not a feature, screen, file, location, or current component name. The name may be proposed freely, but the audit must explain why it represents the shared semantic role.
10. The default audit action is **suggest only**. Do not rename, merge, move, or delete CSS classes during the audit unless the user explicitly requests implementation.

Examples of neutral names:

```text
.feature-save-button + .dialog-delete-button -> .btn + .btn--primary/.btn--danger
.room-panel-box + .asset-panel-box -> .card
.header-actions + .footer-actions -> .actions
```

Do not propose names such as `.feature__button`, `.room__box`, or `.settings__actions` when the role is a reusable button, card, or action group.

### Normalization decision process

For every candidate class:

1. Inventory its declaration set and every usage across `.vue`, `.css`, `.ts`, `.tsx`, `.js`, `.jsx`, tests, and generated markup.
2. Inspect the HTML/template context and identify the semantic role of the element.
3. Compare the candidate with existing reusable classes and variants.
4. Recommend normalization only when the semantic role, behavior, and interaction model match.
5. Propose a neutral reusable role name and explain the naming rationale.
6. Recommend the project-wide role's shared stylesheet placement.
7. Recommend the subsystem stylesheet placement for subsystem-only roles.
8. Identify one-component behavior that must remain in `<style scoped>`.
9. Identify unique deltas that must remain as contextual overrides or modifiers.
10. List every static, dynamic, generated, and runtime reference that would need updating.
11. Verify that the proposed normalized class would contain no redundant base declarations.

### Safe normalization examples

```text
.card + .panel with the same card semantic role -> normalize to .card
button variants with the same button behavior -> .btn + .btn--modifier
repeated action rows with the same action-group role -> .actions
repeated form controls with the same input role -> .input + .input--modifier
```

### Do not normalize

- Different semantic roles that only share color, padding, border, or display values.
- Elements with different keyboard, focus, hover, disabled, or accessibility behavior.
- Layouts with different responsive, overflow, alignment, or stacking requirements.
- A unique component class merely because it shares declarations with a reusable role.
- A state class that changes behavior, such as `active`, `selected`, `locked`, `loading`, or `disabled`.

For unsuitable matches, report exactly:

```text
coincidental match, do not merge
```

### Required normalization output

| Existing selectors           | Shared semantic role | Proposed reusable class | Preserved differences         | Confidence |
| ---------------------------- | -------------------- | ----------------------- | ----------------------------- | ---------- |
| `.old-card`, `.feature-card` | Card surface         | `.card`                 | Feature overflow stays scoped | High       |

Also report:

- Classes normalized or promoted.
- Classes intentionally kept separate.
- Declarations removed as redundant base duplication.
- Contextual overrides retained.
- Uncertain matches requiring visual verification.

## Audit scope: all class sources

The audit must scan every place where a class can be declared, referenced, generated, or styled:

### Vue SFC files (`.vue`)

Check all of the following:

- `<template>` static `class="..."` attributes.
- Vue `:class` string, array, and object bindings.
- `<style scoped>` selectors.
- Plain `<style>` selectors, which must be treated as global CSS.
- Class names assembled in `<script setup>` or component methods.
- `classList.add`, `classList.remove`, `classList.toggle`, and `classList.contains` calls.

### Stylesheets (`.css`)

Check:

- Component-scoped CSS extracted from Vue SFCs.
- Global stylesheets such as `base.css`, `components.css`, `layout.css`, and `accessibility.css`.
- Subsystem stylesheets such as `src/blueprint-editor/editor.css`.
- CSS selectors inside `@media`, `@supports`, pseudo-classes, pseudo-elements, and combinators.
- CSS selectors that appear only as descendants or modifier targets.

### TypeScript and JavaScript (`.ts`, `.tsx`, `.js`, `.jsx`)

Check for classes hidden outside templates and styles:

- String literals containing class names.
- Arrays or maps of class names.
- `classList` calls.
- `:class`-style configuration objects.
- Dynamic construction using template literals or concatenation.
- Generated markup, render functions, and DOM creation.
- Test fixtures, snapshots, and selector strings.

A class is not unused until all `.vue`, `.css`, `.ts`, `.tsx`, `.js`, `.jsx`, test, generated, and runtime references have been checked.

## Audit rules

- Do not rename classes based only on similar declarations; inspect their semantic role and template context first.
- Check static classes, Vue `:class` bindings, script-generated classes, and CSS selectors across `.vue`, `.css`, and `.ts` files.
- Check that every renamed class is updated in templates, scripts, styles, tests, and generated-class mappings.
- Check for unused selectors only after verifying dynamic and runtime usage.
- Keep component-specific styles in `<style scoped>` unless the class is demonstrably reused.
- Reuse existing shared roles such as button, card, input, tag, actions, and layout variants when the semantic role matches.
- Do not merge selectors with different semantic roles merely because they share declarations. Report: `coincidental match, do not merge`.
- Do not duplicate declarations already supplied by the base element selector. Classify each declaration as `redundant base duplication`, `intentional override`, `base-absent declaration`, or `coincidental match, do not merge`.

## 3. CSS Variable Audit

Every `var(--name)` reference must resolve to a custom property declared in:

```text
src/styles/variables.css
```

### Required checks

1. Extract every `var(--name)` reference from all `.css` files and every `<style>` block in `.vue` files.
2. Extract every `--name:` declaration from `src/styles/variables.css`.
3. Compare references against the declarations in `variables.css`.
4. Report every referenced variable that is not declared in `variables.css`.
5. Treat fallback values such as `var(--name, fallback)` as references to `--name`; the fallback does not make an undeclared variable valid.
6. Check variables used in CSS custom-property assignments, `@media`, `@supports`, pseudo-selectors, inline style bindings, and generated style strings.
7. Check `.ts`, `.tsx`, `.js`, and `.jsx` for generated CSS strings containing `var(--name)` or `--name:`.
8. Do not accept variables declared only inside a component `<style>`, another stylesheet, an inline `style` binding, or a script as valid replacements for `variables.css`.
9. If a local or inline custom property is needed for a deliberate runtime calculation, report it separately as a CSS variable policy exception; do not silently treat it as a project theme variable.
10. Do not invent or rename variables during an audit. Suggest the closest existing variable or report that `variables.css` needs a new declaration.

### Required variable audit output

| Variable reference | File and lines     | Declared in `variables.css` | Classification      | Suggested action                                | Confidence |
| ------------------ | ------------------ | --------------------------- | ------------------- | ----------------------------------------------- | ---------- |
| `var(--example)`   | `path/file.vue:10` | No                          | Undeclared variable | Use existing variable or add to `variables.css` | High       |

If all references are declared in `variables.css`, report:

```text
CSS variable audit: PASS
```

## 4. HTML/CSS Class Existence Audit

Every class name must have a real purpose and a verified usage path. Do not add class names as placeholders, labels, future hooks, or empty naming shells.

### Required class contract

For every class found in HTML/Vue markup:

1. The class must have a matching CSS selector or an explicit documented runtime purpose.
2. The class must be used on a real element in a rendered template, generated markup, or supported runtime path.
3. The class name must describe the element's semantic role, visual role, state, or variant.
4. The class must not exist only as an unused name in `class="..."`, `:class`, a script constant, or a CSS file.
5. A class used only for JavaScript behavior must be clearly identified as a runtime hook and must not be styled accidentally.
6. A CSS selector must not be added unless it has a verified HTML/Vue, generated markup, inheritance, combinator, or runtime usage.
7. Empty class attributes, empty class tokens, whitespace-only tokens, and placeholder class names are invalid.
8. Do not create a class solely to repeat inherited element behavior or to reserve a future style.
9. Remove obsolete class names only after checking static, dynamic, generated, script, test, and runtime references.

### Bidirectional verification

Audit in both directions:

```text
HTML/Vue/script class -> matching CSS or documented runtime purpose
CSS selector           -> matching HTML/Vue/generated/runtime usage
```

A class fails the audit when either side has no verified counterpart. A class does not become valid merely because it has a declaration or appears in a template once; the declaration and usage must serve the same semantic role.

### Required class existence output

| Class       | File and lines     | HTML/CSS counterpart | Used in rendered/runtime path | Classification      | Action                          |
| ----------- | ------------------ | -------------------- | ----------------------------- | ------------------- | ------------------------------- |
| `.example`  | `path/file.vue:10` | No                   | Yes                           | Markup-only class   | Remove or add the matching rule |
| `.obsolete` | `path/file.css:20` | Yes                  | No                            | Unused CSS selector | Remove after reference check    |

Use these exact classifications where applicable:

- `markup-only class`
- `unused CSS selector`
- `runtime hook`
- `placeholder class`
- `empty class token`
- `valid reusable class`
- `valid component-specific class`

If every class has a verified counterpart and real usage, report:

```text
HTML/CSS class existence audit: PASS
```

## Verification

After an audit or CSS refactor:

1. Search `.vue`, `.css`, `.ts`, `.tsx`, `.js`, `.jsx`, and test files for BEM names with more than three words.
2. Search all `.vue`, `.css`, and script files for triple `__` separators.
3. Search templates, scoped styles, global styles, and script-generated class names for structural classes incorrectly using `--`.
4. Search Vue `:class` bindings in `.vue` and script configuration objects in `.ts` for unquoted `--` keys.
5. Confirm every renamed class has no stale references across templates, styles, scripts, tests, snapshots, and generated markup.
6. Run the project's BEM lint, typecheck, build, and relevant tests when available.
7. Report unrelated pre-existing verification failures separately.
