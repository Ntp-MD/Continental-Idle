# Core Principles

## Conventions

- Follow the language/framework idioms already used in the file you edit. Check neighboring files before choosing patterns, libraries, or structure.
- Never assume a library is available because it is well known; verify the project already uses it.
- Keep imports at the top of modules.
- Follow security best practices. Never log or commit secrets and keys.

## Comments and documentation

- Do not add code comments unless explicitly requested.
- Do not create `*.md` documentation files unless explicitly requested.

## Simplicity and scope

- Prefer direct, understandable implementations. Do not introduce services, databases, queues, event buses, generic repositories, facades that only forward calls, or other infrastructure without a demonstrated need.
- Do not optimize for scale the product does not have (multi-user sync, remote deployment, caching layers) unless scope changes.
- Preserve user data. Validate cross-references whenever data domains are split or recombined.
- Never two independent implementations of the same operation.

## Dead code and cleanup

- When removing a class, function, modifier, or pattern, remove every reference project-wide in the same change: call sites, templates, styles, string literals.
- Zero-delta duplicates (code identical to what it extends or wraps) are dead code; remove them instead of keeping both.
- Do not introduce a replacement unless the product requires it. If something is simply unused, delete it and stop.

## Verification

- After implementation, verify with commands appropriate to the touched boundaries: typecheck, tests, lint, production build.
- Choose verification by boundary: persistence/migration changes need read-back checks; engine changes need engine tests; template/style changes need markup lint if one exists.
- Report unrelated pre-existing failures separately; do not hide them or change unrelated systems just to make a legacy test pass.

## Decisions (ADR)

Moved to [timeline-decision.md](timeline-decision.md): chronological
timeline of DIRECTION-level decisions only (Problem / Final solution /
Trade-off / Revisit trigger). Supersedes the former docs/adr/ notes and the
inline list that used to live here. Routine fixes, refactors and cleanups are
not recorded there.

## Editor patterns (canonical)

These are the settled patterns for `src/blueprint-editor/`. Reuse them; do not
introduce a second way to do the same thing.

- Modals: wrap in `ModalShell` with `:open` / `@close`. Load heavy or rarely
  opened modals with `defineAsyncComponent`.
- Tabs: shared `.tabs__bar` / `.tabs__tab` classes with `role="tablist"`
  semantics; the tab bar stays fixed while only the panel content scrolls.
- UI showcase: every UI primitive and wrapper component must appear in
  `src/dev/UiShowcase.vue` (open via `/?showcase=1` or the toolbar button).
  No UI component may exist outside the showcase. When adding or changing a
  UI component, update the showcase in the same change.
- Confirmation: use the injected `confirm()` dialog, never `window.confirm`.
- User feedback: `useToast` for user-visible messages, `editorLog` for console
  diagnostics. Never `alert` / `console.log` for user-facing state.
- Unsaved-changes tracking: `useDirtyBaseline` - one baseline snapshot plus a
  `dirty` computed. Do not hand-roll `dirty = ref(false)` flags set at every
  mutation site, and do not stringify state into keys for comparison.
- Concurrency: store-level mutations use `withStateLock`; UI pending state uses
  `useAsyncAction`. One guard per layer - do not add extra boolean flags that
  duplicate what the layer guard already does.
- Walkable-grid domain logic (tile states, wall segments <-> edges, door
  detection) lives in `gridEditing.ts` as pure functions. Components compose
  it; they do not re-implement the math inline.
- Store access: components import from `blueprintStore` (`useAssetsStore` and
  friends). Do not import store internals from `./store/*` directly, and do not
  create pass-through facade files.
- Declarative schemas: canvas/editor settings are parsed via
  `CANVAS_FIELD_SPECS` / `EDITOR_FIELD_SPECS`. Never enumerate their keys by
  hand elsewhere.
