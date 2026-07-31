# Reusable CSS Class Reduction Workflow

Use this workflow for every CSS/UI audit or refactor. The goal is to reduce the number of classes while keeping CSS semantic, reusable, maintainable, and non-Tailwind.

---

## Core Principle: Name the Role, Not the Location

A class must describe what an element is, how it is structured, or which reusable state it represents. It must not describe the file, component, panel, screen, or feature where the element happens to appear.

Before creating or keeping a class, determine whether it represents:

- A reusable semantic role.
- A reusable structural layout.
- A reusable visual variant.
- A reusable interaction or state.
- Truly unique component structure or behavior.

If it only identifies where the element is used while repeating an existing visual role, replace it with the existing reusable role and preserve only the genuinely unique styling through a contextual selector or scoped rule.

Do not use Tailwind, utility-class sprawl, or classes that encode individual CSS properties. Keep the implementation as semantic, role-based CSS.

---

## Class Reuse Policy (mandatory before creating any new class)

1. Before writing a new class, search existing CSS, token files, and templates for a class that provides the same semantic role or visual structure. Search by role and behavior, not only by component filename.
2. Reuse an existing base class whenever possible. Add a class only for a genuinely new structural pattern, visual variant, or meaningful state.
3. Use a base-plus-variant design:
   - The base class owns reusable structure, layout, spacing, border, sizing, and shared behavior.
   - The variant class owns color, state, emphasis, or a controlled size difference.
4. Consolidate repeated button styling into the existing button role and its semantic variants. Do not retain component-specific button classes when they only repeat the shared button structure.
5. Consolidate repeated card styling into the existing card role and its variants. Retain a component class only when it contributes unique internal layout or behavior.
6. Consolidate repeated modal overlay behavior into the shared overlay role. Add a modifier or contextual selector only for a real difference in dimensions, alignment, stacking, overflow, or interaction.
7. Consolidate repeated action-group layout into the shared action role. Use variants only for meaningful alignment, filling, wrapping, or stacking differences.
8. Consolidate repeated flex/grid arrangements into shared layout roles. Do not create separate component-scoped row, column, stack, or wrap classes when their structure is equivalent.
9. Never name a reusable class after the file or component it lives in. File-scoped naming is allowed only for genuinely unique structure or behavior.
10. Before finishing, run a duplicate-check. List every class touched or added and confirm that no class duplicates an existing declaration block with the same properties and values.
11. When uncertain, ask whether the class represents a reusable role or merely its location. Only reusable roles justify new classes.

---

## Safe Class Reduction Areas

Inspect these areas first because they commonly contain the largest safe reductions:

### Button Roles

Find component-specific button selectors that repeat the global button structure or an existing semantic variant. Migrate their templates to the shared button role and preserve only component-specific sizing or placement through contextual or scoped CSS.

Do not remove a class if it represents a meaningful interaction state, accessibility state, disabled behavior, responsive change, or unique button structure.

### Card Roles

Compare all card-like selectors for background, border, radius, padding, shadow, hover behavior, and state modifiers. Consolidate selectors that share the same card role. Keep separate variants when their visual hierarchy, density, state, or behavior differs.

### Modal Overlays

Identify repeated full-screen overlay behavior and consolidate it into the shared modal overlay role. Keep component-specific selectors only for genuine dialog differences.

### Action Groups

Identify repeated groups of controls that use the same flex/grid alignment, gap, wrapping, and spacing. Consolidate the shared structure and retain variants only where alignment, filling, wrapping, stacking, or responsive behavior differs.

### Repeated Layout Groups

Identify repeated row, column, stack, wrap, and centering structures. Consolidate only when the semantic role and behavior match. Preserve additional component-specific rules through contextual selectors rather than duplicating the entire layout declaration block.

---

## Automatic Reusable Class Discovery Rule

When four or more identical property-value declarations appear across multiple selectors, consider a reusable class. This is a discovery signal, not an automatic merge instruction.

A candidate is actionable only when all of the following are true:

- The selectors share the same reusable semantic role.
- The pattern appears in at least two usages or belongs to an established base-plus-variant family.
- The declarations are not inherited or already supplied by a global element selector.
- Hover, focus, active, disabled, responsive, and other state modifiers are compatible.
- The proposed class reduces duplication instead of adding utility-class sprawl.
- The change does not conceal meaningful component behavior.

Semantic role, behavior, and maintainability always take priority over the declaration-count threshold.

---

## When Not to Merge

- Do not merge selectors solely because they share four declarations if their semantic roles differ.
- Do not merge unrelated controls only because they use the same color, spacing, or border.
- Do not create a class only to repeat global element behavior or an existing base class.
- Do not replace meaningful selected, disabled, locked, active, loading, dirty, or other state classes when the state changes behavior.
- Do not use a generic class to hide unique responsive, accessibility, interaction, or overflow behavior.
- Report unsuitable matches as `coincidental match, do not merge`.

---

## Naming and Structure

- Follow the repository's existing flat double-underscore BEM convention.
- Use no more than two `__` separators in one class name.
- Prefer semantic role names and base-plus-variant structure.
- Check the directory and existing templates for equivalent or near-duplicate class names before naming anything new.
- Keep global reusable roles in global CSS.
- Keep genuinely component-specific rules in scoped CSS.
- Reuse existing design tokens.
- Do not add a new CSS variable without user confirmation.

---

## Required Audit Process

1. Inventory existing role classes and their usages.
2. Identify repeated button, card, modal, action-group, and layout patterns.
3. Separate safe reusable matches from semantically unrelated matches.
4. Migrate templates to existing base-plus-variant roles.
5. Move only shared structure into global reusable CSS.
6. Preserve unique component behavior through contextual selectors or scoped CSS.
7. Remove obsolete selectors only after confirming that no usages remain.
8. Run a duplicate-class check for every class touched or added.
9. Verify that every new class has at least two usages or belongs to an established base-plus-variant family.
10. Run the project build and typecheck commands.
11. Report unrelated pre-existing verification failures separately from changes made during the audit.

---

## Audit Output Format

When performing a CSS/UI audit, produce findings as a table with these columns:

`old selectors | shared declarations | proposed class name | rationale for name | confidence (high/med/low)`

For every proposed consolidation:

- Quote the exact matched CSS or template text.
- Include verified file and line references.
- Explain why the selectors share a semantic role.
- Identify preserved state, hover, focus, responsive, disabled, accessibility, and interaction behavior.
- Explicitly report unsuitable matches as `coincidental match, do not merge`.

After the table, report:

- Classes removed.
- Reusable classes added.
- Remaining component-specific classes and why they remain.
- Build and typecheck results.

---
