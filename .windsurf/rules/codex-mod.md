# 🚀 Performance-Optimized Development Rules

## 📋 Development Workflow (START HERE)

### 🔍 Pre-flight Checklist (MANDATORY)

- [ ] Read Rules every time before coding
- [ ] Check `variables.css` for available values
- [ ] Identify allowed exceptions for hard-coded values
- [ ] Plan BEM naming structure
- [ ] Verify no Tailwind classes will be used

### ⚡ 6-Step Development Process

1. **Read Rules first** - Understand all guidelines
2. **Read `variables.css`** - Know available values
3. **Check Exceptions** - Verify if px is allowed
4. **Correspond CSS variables** - Map HTML elements to classes
5. **Plan CSS structure** - Organize before coding
6. **Final Verification** - Double-check compliance

---

## 🏗️ Project Architecture

### Summary Stack

- **Vue 3** + Composition API + TypeScript
- **CSS Variables** — No Tailwind, BEM naming
- **CSS Properties** — Not Allowed em, rem
- **Robust Responsive Design** — Mobile-first approach

### Directory Structure

```
/assets/styles/
├── variables.css    # USER ONLY (colors, fonts, spacing, accents) *(this file can use px)*
├── reset.css        # HTML element resets (body, html, a , button, article, etc.)
├── utilities.css    # Reusable classes (.card, .container, .accent-color etc.)
├── form.css         # Base form styles (input, textarea, select, etc.)
├── animations.css   # Animations (hover, focus, transition , etc.)
└── main.css         # Import order
```

### File Organization Rules

- **UI blocks**: `components/`
- **Page-level screens**: `pages/`
- **Reusable logic**: `utils/`, `composables/`, or equivalent shared modules
- **Shared styles**: Central stylesheet

---

## 🎨 CSS & Styling Rules

### CSS Variables System

```css (variables.css)
:root {
  /* Colors Theme* use in background-color property */
  --main-color-1: ;
  --main-color-2: ;
  --main-color-3: ;
  --main-color-4: ;
  --main-color-5: ;
  --main-color-6: ;

  /* Colors Font use in color font property */
  --font-color1: ;
  --font-color2: ;

  /* Colors Accent use in button, link, etc*/
  --accent-base: ;
  --accent-primary: ;
  --accent-secondary: ;
  --accent-success: ;
  --accent-warning: ;
  --accent-error: ;

  /* Font Size use in font-size property h1-h6, p*/
  --font-xs: clamp(12px, 0.5vw, 14px);
  --font-sm: clamp(14px, 1.5vw, 16px);
  --font-md: clamp(16px, 2vw, 18px);
  --font-lg: clamp(18px, 2.5vw, 20px);
  --font-xl: clamp(20px, 3vw, 24px);

  /* Spacing use in margin and padding and gap */
  --spacing-xs: 5px;
  --spacing-sm: 10px;
  --spacing-md: 20px;
  --spacing-lg: 30px;
  --spacing-xl: 50px;
  --spacing-scale: clamp(50px, 8vw, 200px);

  /* Border Radius */
  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 15px;
  --radius-lg: 20px;
  --radius-xl: 30px;
  --radius-circle: 30px;

  /* Transitions */
  --transition-fast: 0.15s ease;
  --transition-normal: 0.3s ease;
  --transition-slow: 0.5s ease;
}
```

### Styling Guidelines

- Prefer project-wide styles in shared stylesheet when reused
- Keep component-specific styles near the component when unique
- Do not scatter same style rules across multiple files
- Avoid inline styles unless truly necessary
- Use meaningful class names that describe purpose, not appearance only
- Keep layout, spacing, and responsive rules consistent across views
- If style is shared by multiple pages, extract it instead of copying

### ⚠️ px Exception Guidelines

**ALLOWED** (check each before using):

- [ ] Single elements without siblings (icon parts, window controls)
- [ ] Micro-interactions (small gaps < 8px, precise positioning)
- [ ] Special positioning effects (negative margins, complex transforms)
- [ ] Specific design requirements where no suitable variable exists
- [ ] Performance critical elements

---

## 🎯 Utility-First CSS / Atomic CSS

### Core Concepts

- **Utility Classes** - Base utility classes (`.card`, `.badge`, etc.)
- **Component Overrides** - Component-specific style additions
- **DRY Principle** - Don't Repeat Yourself
- **Single Source of Truth** - Single source for base styles

### Architecture Structure

```
utilities.css (base)
├── .card (base styles)
├── .badge (base styles)
└── .section (base styles)

components (specific)
├── feature-card (inherits .card + specific additions)
├── testimonial-card (inherits .card + specific additions)
└── pricing-card (inherits .card + specific additions)
```

### Implementation

**1. Base Utility Classes (utilities.css)**

```css
.card {
  border: 1px solid var(--main-color-4);
  border-radius: var(--radius-lg);
  padding: var(--gap-lg);
  transition:
    border-color var(--transition-normal),
    transform var(--transition-normal);
}
```

**2. Component Usage (HTML)**

```html
<article class="card feature-card hover-lift">
  <!-- content -->
</article>
```

**3. Component Overrides (Component CSS)**

```css
.feature-card {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.08);
  /* Only properties that need to be added/changed */
}
```

### Benefits

- ✅ **Reduced Duplication** - No need to rewrite border, padding repeatedly
- ✅ **Easy Maintenance** - Edit once, use throughout project
- ✅ **Consistency** - All cards have the same base
- ✅ **Smaller Bundle** - CSS compresses better
- ✅ **Scalable** - Easy to add new components

### Usage Rules

1. **Create Base Class** in `utilities.css` for reusable UI
2. **Components Must Include Base Class** as part of their composition
3. **Add Only Overrides** in component CSS
4. **Don't Repeat Properties** that exist in base class
5. **Verify Consistency** between base and overrides

---

## 🧩 Vue Component Rules

### Component Structure

- Use **PascalCase** for Vue component filenames and component names
- Keep template, script, and style sections clearly separated
- Prefer composition-oriented code for shared state and logic
- Avoid putting heavy business logic directly inside templates
- Use computed values for derived UI state instead of recalculating inside template
- Use watchers only when reactive side effects are actually needed

### Code Organization

- Keep each component focused on single responsibility
- If component becomes too large, split into smaller components
- Shared UI should be extracted into reusable components
- Page-level code should stay thin and mostly compose smaller components
- Put helper logic in utility files instead of duplicating in multiple components
- Keep API/data access logic separate from display logic whenever possible

---

## 📝 Naming Conventions

- **Components**: `PascalCase`
- **Functions and variables**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE` when truly constant values
- **Files and folders**: Use names that match role of content
- Keep names short, but not vague

---

## 🏛️ Semantic HTML Structure

### Heading Hierarchy Rules:

- **h1**: Use ONCE per page (main title/hero section)
- **h2**: Use for major section headers (features, pricing, contact)
- **h3-h6**: Use for subsections and nested content

**Best Practices:**

- Semantic hierarchy: h1 → h2 → h3 → h4 → h5 → h6
- No skipping levels (h1 → h3 is invalid)
- Descriptive, concise text for screen readers
- WCAG 2.1 AA standards

---

## 🔧 Editing Rules

### Development Principles

- Make the smallest safe change that solves the problem
- Do not rewrite unrelated parts of the app
- Always choose variables over hardcoded values
- Preserve existing structure unless there is strong reason to refactor it
- If you add a new pattern, use it consistently in related area
- Avoid accidental duplication of pages, components, or styles

### Guiding Principle

- If you are unsure where new code belongs, follow current repo pattern first
- Keep the project easy to read, easy to deploy, and easy to extend

---

## ✅ Final Verification Checklist

### Code Quality Checklist

Before committing or finalizing changes, verify:

- [x] **CSS Variables**: All variables are defined in `variables.css`
- [x] **Class Attributes**: No undefined variables in HTML class attributes
- [x] **Class Selectors**: No undefined variables in CSS class selectors
- [x] **CSS Files**: All CSS variables are properly defined
- [x] **Vue Components**: No undefined variables in Vue components
- [x] **Style Integration**: All Vue variables are defined in styles/
- [x] **Non-class Attributes**: All non-class attributes have CSS declarations

### Final Verification

- [ ] Code follows existing patterns and conventions
- [ ] No hardcoded values where variables should be used
- [ ] Components are focused and reusable
- [ ] Styles are organized and consistent
- [ ] Project remains easy to read, deploy, and extend
