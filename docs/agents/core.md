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
- Compatibility wrappers may exist during migration, but never two independent implementations of the same operation.

## Dead code and cleanup

- When removing a class, function, modifier, or pattern, remove every reference project-wide in the same change: call sites, templates, styles, string literals.
- Zero-delta duplicates (code identical to what it extends or wraps) are dead code; remove them instead of keeping both.
- Do not introduce a replacement unless the product requires it. If something is simply unused, delete it and stop.

## Verification

- After implementation, verify with commands appropriate to the touched boundaries: typecheck, tests, lint, production build.
- Choose verification by boundary: persistence/migration changes need read-back checks; engine changes need engine tests; template/style changes need markup lint if one exists.
- Report unrelated pre-existing failures separately; do not hide them or change unrelated systems just to make a legacy test pass.
