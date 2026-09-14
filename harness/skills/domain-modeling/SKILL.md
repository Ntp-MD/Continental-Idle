> Adapted from `mattpocock/skills` (MIT, Copyright (c) 2026 Matt Pocock). Snapshot 2026-09-12; see `NOTICE.md`.

# Domain Modeling

Build and sharpen the project's domain model as you design. This is the *active* discipline: challenging terms, inventing edge-case scenarios, and writing the glossary and decisions down the moment they crystallise. (Merely *reading* `harness/context.md` for vocabulary is not this skill: that's a one-line habit any skill can do. This skill is for when you're changing the model, not just consuming it.)

## File structure

This harness has a single context, and both homes already exist:

```
/
├── harness/
│   ├── context.md        ← the shared-language glossary (the only one - never a second)
│   └── history.md        ← the Decision Timeline lives in its entries, per AGENTS.md Decisions
└── src/
```

Create content lazily: add a glossary term only when one is resolved; record a Decision Timeline entry only when a decision crosses the AGENTS.md threshold (hard to reverse + surprising + a real trade-off).

## During the session

### Challenge against the glossary

When the user uses a term that conflicts with the existing language in `harness/context.md`, call it out immediately. "Your glossary defines 'cancellation' as X, but you seem to mean Y. Which is it?"

### Sharpen fuzzy language

When the user uses vague or overloaded terms, propose a precise canonical term. "You're saying 'account': do you mean the Customer or the User? Those are different things."

### Discuss concrete scenarios

When domain relationships are being discussed, stress-test them with specific scenarios. Invent scenarios that probe edge cases and force the user to be precise about the boundaries between concepts.

### Cross-reference with code

When the user states how something works, check whether the code agrees. If you find a contradiction, surface it: "Your code cancels entire Orders, but you just said partial cancellation is possible. Which is right?"

### Update context.md inline

When a term is resolved, update `harness/context.md` right there. Don't batch these up: capture them as they happen. Use the glossary shape already in that file (one canonical name per concept, meaning, "Not" column).

`harness/context.md` should be totally devoid of implementation details. Do not treat it as a spec, a scratch pad, or a repository for implementation decisions. It is a glossary and nothing else.

### Offer Decision Timeline entries sparingly

Only offer to record a Decision Timeline entry when all three are true:

1. **Hard to reverse**: the cost of changing your mind later is meaningful
2. **Surprising without context**: a future reader will wonder "why did they do it this way?"
3. **The result of a real trade-off**: there were genuine alternatives and you picked one for specific reasons

If any of the three is missing, skip the entry. Record it per `AGENTS.md` Decisions (Problem / Final solution / Trade-off / Revisit trigger), as a `history.md` entry per the History pattern.
