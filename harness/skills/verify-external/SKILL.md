---
name: verify-external
description: Verify external APIs, URLs, and config keys before citing them. Apply when referencing anything outside the repo.
---

# No Guessing

Inside the repo, read the code. Outside the repo, check the source. A weaker agent invents: plausible URLs, library function names, config keys, CLI flags - stated with full confidence, wrong on arrival.

## Rules

- **APIs and signatures**: confirm against the installed dependency (its types, its docs in the repo, or its actual behavior) - never from memory of a similar library.
- **URLs**: never generate a link unless you verified it exists and is useful. Links from the user's messages or local files are fine; anything else gets checked first.
- **Config keys and flags**: confirm against the tool's real schema or `--help`, not against what the name suggests it should be.
- **Versions and availability**: "latest" rots. Pin what you checked, when you checked it.

## Done-check

For every external reference in your change or report, answer: where did I verify this? "I recall" is not an answer. If you cannot name the verification, remove the reference or mark it unverified.
