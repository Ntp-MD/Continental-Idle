# UI Element Principles

This document defines the canonical pattern for every form control and interactive element in the project. Every new component must follow these patterns. Existing elements that deviate must be migrated when touched.

## Core pattern: element base + semantic class + modifier

The project uses a three-layer pattern for all interactive elements:

```text
element selector (base styling)
        + semantic class (role marker, optional on native elements)
        + modifier class (variant or state delta)
```

- The **element selector** in `base.css` owns shared appearance: dimensions, background, border, color, focus ring, disabled state, transition.
- The **semantic class** (`.btn`, `.input`, `.select`, `.textarea`) is a role marker used when the element needs a modifier or when the template must distinguish the role explicitly. It does not redeclare base styling.
- The **modifier class** (`.btn--primary`, `.input--compact`) owns only the delta from the base. It must not repeat base declarations.

### Why element selector as base

The project is a localhost tool with a single dark theme. Every `<button>`, `<input>`, `<select>`, and `<textarea>` must look consistent without requiring authors to remember a class name. The element selector guarantees a baseline. Modifiers opt in to variation.

### When to add the semantic class

Add `class="input"` or `class="btn"` when:

1. The element needs one or more modifier classes (`.btn--primary`, `.input--compact`).
2. The template uses the element in a context where the role must be explicit for readability or for a CSS combinator (`.actions > .btn`).
3. A `<select>` is styled like an `<input>` and must carry the input role for consistency.

Do not add the semantic class when the element uses only base styling.

## Button

### Base

The `button` element selector in `base.css` owns:

- font family, cursor, border, background, color, padding
- text-transform uppercase, letter-spacing, font-size, font-weight
- border-radius, transition, inline-flex centering, gap, white-space
- `:hover`, `:active`, `:disabled`, `:focus-visible` states
- `::after` overlay for hover tint

### Semantic class

`.btn` — role marker. Use when applying any `.btn--*` modifier.

### Modifiers

| Modifier        | Purpose                                       |
| --------------- | --------------------------------------------- |
| `.btn--primary` | Blue accent, hover fills background           |
| `.btn--success` | Green accent, hover fills background          |
| `.btn--danger`  | Red accent, hover fills background            |
| `.btn--warning` | Gold accent, tinted background                |
| `.btn--ghost`   | Transparent background and border             |
| `.btn--dashed`  | Dashed border, dim text, add-item affordance  |
| `.btn--icon`    | Square padding-less button, icon only         |
| `.btn--active`  | Primary inset ring, persistent selected state |
| `.btn--dirty`   | Pulsing gold glow, unsaved-changes indicator  |

### Rules

- A button may combine one variant modifier with one shape modifier: `class="btn--ghost btn--icon"`.
- Do not combine two variant modifiers (`.btn--primary .btn--danger`).
- Do not redeclare base `button` properties inside a modifier.
- Do not invent new variant colors outside the five accent tokens (`--accent-primary`, `--accent-gold`, `--accent-green`, `--accent-red`, `--accent-blue`).
- Icon-only buttons must include `aria-label`.
- Disabled buttons must use the `disabled` attribute, not a class.

### Template pattern

```vue
<button class="btn--primary" type="button" @click="save">Save</button>
<button class="btn--ghost btn--icon" type="button" aria-label="Cancel" @click="cancel">×</button>
```

## Input

### Base

The `input` element selector in `base.css` owns:

- font family, background, border, color, padding, height (`--control-height`)
- font-size, border-radius, transition, box-sizing
- `:hover`, `:focus`, `:disabled` states
- `input[type="number"]` spin-button removal

### Semantic class

`.input` — role marker. Use when applying any `.input--*` modifier, or when a `<select>` must read as an input.

### Modifiers

| Modifier           | Purpose                                      |
| ------------------ | -------------------------------------------- |
| `.input--readonly` | Dim opacity, default cursor, no focus shadow |
| `.input--num`      | Fixed 56px width, centered text              |
| `.input--compact`  | Fixed 40px width, centered, tight padding    |

### Rules

- Number inputs must declare `type="number"` and use `.input--num` or `.input--compact` for width control.
- Do not set width directly on an unmodified `.input`; use a modifier or a layout class.
- Readonly state uses `.input--readonly` class, not the `readonly` attribute alone, so the focus ring is suppressed visually.
- Do not redeclare base `input` properties inside a modifier.

### Template pattern

```vue
<input v-model="name" class="input" type="text" aria-label="Name" />
<input v-model.number="x" class="input input--compact" type="number" min="0" aria-label="X" />
```

## Select

### Base

The `select` element selector in `base.css` owns:

- all shared input base properties
- `appearance: none` and custom chevron background image
- right padding to clear the chevron
- `option` and `optgroup` background and color

### Semantic class

`.input` — a `<select>` that must look like an input carries `class="input"`. This is the same role marker as `<input>` because the visual role is identical.

### Modifiers

Select inherits `.input--readonly` and `.input--compact` when applicable.

### Rules

- Do not add a separate `.select` class. The select element uses the `.input` role marker.
- Do not restore the native chevron. The custom chevron is the project standard.
- Group options with `<optgroup>` when a select has more than 8 options or has categorical groupings.

### Template pattern

```vue
<select v-model="value" class="input" aria-label="Choose value">
  <option value="">None</option>
  <option v-for="opt in options" :key="opt.id" :value="opt.id">{{ opt.label }}</option>
</select>
```

## Textarea

### Base

The `textarea` element selector in `base.css` owns:

- all shared input base properties
- `resize: vertical`, `height: auto`, `line-height: 1.5`

### Semantic class

`.textarea` — role marker. Use when the textarea needs a modifier or when the template must distinguish it from a single-line input.

### Rules

- Always pass a `rows` attribute. Do not rely on default rows.
- Do not set `resize: horizontal` or `resize: none` in a modifier unless the layout explicitly requires it.

### Template pattern

```vue
<textarea v-model="content" class="textarea" rows="6" aria-label="Content"></textarea>
```

## Label

### Base

The `label` element selector in `base.css` owns:

- font-size (`--font-xs`), color (`--text-secondary`)
- text-transform uppercase, letter-spacing, font-weight

### Rules

- A `<label>` must either wrap its control or reference it via `for` + `id`.
- Do not add a `.label` class. The element selector is sufficient.
- Do not change label case or weight in a modifier; the uppercase small label is the project standard.

### Template pattern

```vue
<label for="floor-name">Name</label>
<input id="floor-name" v-model="name" class="input" type="text" />
```

## Checkbox

### Base

Checkbox uses the native `input[type="checkbox"]` styled by the shared `input` base in `base.css`. There is no separate checkbox class.

### Rules

- Do not create a `.checkbox` class unless a custom visual design is introduced project-wide.
- Always pair a checkbox with a `<label>` for hit area and accessibility.
- Use `:checked` binding via `v-model` or `:checked` + `@change`; do not manually toggle the DOM checked property.

### Template pattern

```vue
<label>
  <input type="checkbox" :checked="value" @change="toggle" />
  Enable feature
</label>
```

## Radio

### Base

Radio uses the native `input[type="radio"]` styled by the shared `input` base in `base.css`. There is no separate radio class.

### Rules

- Every radio in a group must share the same `name` attribute.
- Always pair a radio with a `<label>`.
- Do not create a `.radio` class unless a custom visual design is introduced project-wide.

### Template pattern

```vue
<label>
  <input type="radio" name="mode" value="auto" v-model="mode" />
  Automatic
</label>
<label>
  <input type="radio" name="mode" value="manual" v-model="mode" />
  Manual
</label>
```

## Range slider

### Base

Range uses the native `input[type="range"]`. The shared `input` base applies height and background. There is no separate range class.

### Rules

- Always declare `min`, `max`, and `step`.
- Pair the range with a `<label>` and a visible value display.
- Do not create a `.range` class unless a custom track or thumb design is introduced project-wide.

### Template pattern

```vue
<label for="speed">Speed: {{ speed }}</label>
<input id="speed" v-model.number="speed" type="range" min="0.01" max="0.2" step="0.01" />
```

## Field and form layout

### Layout classes

Use shared layout classes from `components.css` for form structure. Do not invent per-component form layout classes.

| Class              | Purpose                                  |
| ------------------ | ---------------------------------------- |
| `.layout__row`     | Horizontal row, centered, small gap      |
| `.layout__wrap`    | Horizontal row that wraps                |
| `.layout__column`  | Vertical column, centered, small gap     |
| `.actions`         | Action button row                        |
| `.actions--fill`   | Action row where buttons stretch equally |
| `.actions__center` | Centered action row                      |
| `.actions__wrap`   | Wrapping action row                      |

### Rules

- Do not create `.form`, `.field`, `.field__label`, `.field__control` classes. The project does not use a field wrapper abstraction. Pair `<label>` + control directly inside a layout class.
- Use `.layout__column` with `gap` for stacked label/control pairs.
- Use `.layout__row` for inline label/control pairs.

### Template pattern

```vue
<div class="layout__column">
  <label for="name">Name</label>
  <input id="name" v-model="name" class="input" type="text" />
</div>

<div class="actions actions--fill">
  <button class="btn--primary" @click="save">Save</button>
  <button class="btn--ghost" @click="cancel">Cancel</button>
</div>
```

## States and accessibility

### Focus

- `:focus-visible` on `button`, `select`, `input`, `textarea` uses a 2px primary outline with 2px offset.
- `:focus` on `input`, `select`, `textarea` uses a primary border and a 2px primary-tinted box-shadow.
- Do not remove focus styling. Do not replace it with a class-based focus ring.

### Disabled

- Use the `disabled` attribute, not a `.is-disabled` class.
- The element selector handles opacity, cursor, and hover suppression.
- Do not redeclare disabled styling in a modifier.

### Readonly

- Use `.input--readonly` for visual readonly suppression. The `readonly` attribute alone does not suppress the focus ring.

### Required

- Use the `required` attribute and `aria-required="true"` when a control is mandatory.
- Do not invent a `.is-required` class for the asterisk; render the asterisk in the label text.

## Token usage

- Every color must come from `variables.css`. Do not hardcode hex values in components or modifiers.
- Every spacing value must use a `--gap-*` token.
- Every radius must use a `--radius-*` token.
- Every font size must use a `--font-*` token.
- Every control height must use `--control-height`.
- Every z-index must use a `--z-layer-*` token.
- Every transition must use `--duration-*` and `--ease-out`.

## Scoped vs shared

- Base element styling lives in `base.css`.
- Shared modifiers and layout classes live in `components.css`.
- Component-specific overrides live in `<style scoped>` of the Vue SFC.
- A scoped override must not redeclare base properties. It must only add the component-specific delta.
- A scoped override must not invent a new semantic role that belongs in `components.css`. If the role is reused, promote it.

## Adding a new element or modifier

Before adding a new modifier or element pattern:

1. Check if an existing modifier already covers the variant. Extend it instead of duplicating.
2. Verify the variant is genuinely reused across more than one component. If it is single-use, keep it scoped.
3. Name the modifier after the semantic variant, not the component: `.btn--danger`, not `.modal__delete-btn`.
4. Add the modifier to `components.css` with only the delta declarations.
5. Add the modifier to the table in this document.
6. Run `npm run typecheck` and `npx vite build` to verify.
