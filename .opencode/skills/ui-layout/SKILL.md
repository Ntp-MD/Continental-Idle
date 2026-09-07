---
name: ui-layout
description: Canonical form, markup, CSS, and class patterns for the blueprint editor. Invoke when touching templates, markup, styles, classes, or the UI showcase, or when the user says layout, form row, css class, bem, or showcase. Pairs with autonomous-development at Implement and Review.
---

# Skill: ui-layout

Canonical form/markup/CSS/class patterns for `src/blueprint-editor/` UI.

Pairs with `autonomous-development`: invoke it at Implement (step 3) and
Review (step 6) for every template/markup/CSS/class change, before running
the Verify row for that change. Triggers on: layout, form row/col, css
class, bem, showcase, two-column, section grouping, spacing, label copy.

## Rules

1. Reuse first, approval to add. Grep `src/styles/components.css` plus
   neighboring components for a class covering the role; extend it with a
   modifier carrying only the delta. A new class, component, token, or UI
   label needs explicit user approval first - never assume it from a build
   order. Blanket "implement until end" covers plan execution, never new
   design vocabulary.
2. Two-section rows use the shared rule
   `.form__row.form--start > div { flex: 1; }`: one row, plain `div`
   groups, never a `form__row` nested inside a `form__row`. Nesting is only
   for horizontal controls whose children are not `div`s (buttons, inputs).
   Groups stack vertically as `form__col`; sections separate with
   `form__col form--section`.
3. Tabs use the shared `.tabs__bar` / `.tabs__tab` classes with
   `role="tablist"` semantics; the bar stays fixed while only the panel
   scrolls. Never create per-component tab classes.
4. Showcase gate: a new UI primitive or wrapper must appear in
   `src/dev/UiShowcase.vue` in the same change. Static SVG samples with
   presentation attributes need no CSS and no showcase entry beyond their
   section. Feature panels/cards reachable through an already-showcased
   modal need no extra entry.
5. Labels use player vocabulary, never schema names ("Shape Radius" not
   "Label Radius", "Passable" not "Walkthrough"). Test: read the label to
   someone who never saw the code - if they cannot guess what it changes,
   rename it.
6. No static inline `style="..."`; use a scoped semantic class owned by the
   file that uses it. Dynamic `:style` is allowed for runtime-dependent
   values only. No `!important`. No `box-shadow` / `drop-shadow`; state via
   borders only. Spacing uses `--gap-*` tokens; never hardcode them.

## Grid editor parity

`WalkableGridEditor.vue` (asset) and `FloorWalkablePanel.vue` (floor) are
deliberately separate (different units, save flows, content) - do NOT merge
them. Keep them equal instead: touching brushes, modes, hints, legends,
edge previews, or tile visuals in one file requires checking the other file
in the same change and mirroring what applies. Shared math stays in the
walkable-grid domain module; only the thin brush glue may parallel.

## Verify

- `lint:bem` + `lint:css` (+ `typecheck` if a Vue SFC changed).
- Bans: no `verify` / full matrix, `test:npc-perf`, `test:npc-scale`,
  `test:behavior`, or `observe:hotel`. Temp diagnostics go in
  `tests/_*.tmp.ts`, deleted same session, never committed.

## Pre-report checklist

- Zero new classes without an approval reference, or every new class
  accounted for with one.
- Every template class has a definition; every definition is used; shared
  classes live in the shared stylesheet, component classes in scoped styles.
- Correspondence clean: zero references to anything removed.
