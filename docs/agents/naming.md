# Naming Principles

## Clarity

- Use clear, domain-oriented names for functions, types, components, and CSS classes.
- Functions use verbs describing intent: `create`, `get`, `list`, `update`, `delete`, `normalize`, `validate`, `resolve`, `use`, `is`, `rotate`.
- Do not use vague names when a domain action can be named precisely.
- Keep naming consistent within a domain. Do not mix singular/plural or different terms for the same concept without a semantic reason.

## Short names

Names must be as short as possible while staying unambiguous in their scope:

- Use one short word when the scope is clear.
- Do not prefix with the feature/subsystem when the file already provides that context.
- Do not repeat the parent concept inside the name (`user.userName`).
- Drop words implied by the block, file, or element role.
- Drop structural suffixes that describe layout instead of semantics (`__wrapper`, `__container`) unless the container itself is semantic.
- Separate state from the element name using `--` (see [css.md](css.md)); do not cram state words into the element name (`__activeTitle`).
- One modifier owns one state. Do not stack multiple states in one modifier name.

Before settling on a name:

1. Write the full descriptive name.
2. Drop every word already implied by the file, parent element, or role.
3. Drop every word describing styling or structure rather than meaning.
4. Move state words into a `--modifier`.
5. If it collides with another name in scope, add back the minimum needed to disambiguate.
6. Verify it still reads clearly without comments.
