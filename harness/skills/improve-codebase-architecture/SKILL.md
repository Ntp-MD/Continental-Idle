> Adapted from `mattpocock/skills` (MIT, Copyright (c) 2026 Matt Pocock). Snapshot 2026-09-12; see `NOTICE.md`.

# Improve Codebase Architecture

Surface architectural friction and propose **deepening opportunities**: refactors that turn shallow modules into deep ones. The aim is testability and AI-navigability.

_User-invoked: run only on the user's order (see the skills gate in `harness/HARNESS.md`)._

This command is _informed_ by the project's domain model and built on a shared design vocabulary:

- Read `skills/codebase-design/SKILL.md` for the architecture vocabulary (**module**, **interface**, **depth**, **seam**, **adapter**, **leverage**, **locality**) and its principles (the deletion test, "the interface is the test surface", "one adapter = hypothetical seam, two = real"). Use these terms exactly in every suggestion, and don't drift into "component," "service," "API," or "boundary."
- The domain language in `harness/context.md` gives names to good seams; Decision Timeline entries record decisions this command should not re-litigate.

## Process

### 1. Explore

**Scope before you scan: YAGNI.** Deepening a module pays off by making future changes to it easier, so put extra weight on the parts of the codebase that have recently changed. Decide *where* to look before you look:

- If the user named a direction (a module, a subsystem, a pain point), take it, and skip the inference below.
- Otherwise, walk back a good stretch of the commit history (`git log --oneline`) to find the codebase's hot spots, the files and areas that keep coming up, and let those paths pull your attention first. If the changes are scattered with no clear hot spot, widen the net.

Read the project's domain glossary (`harness/context.md`) and any Decision Timeline decisions in the area you're touching first.

Then walk the codebase yourself, in-session (single session - no sub-agents). Don't follow rigid heuristics; explore organically and note where you experience friction:

- Where does understanding one concept require bouncing between many small modules?
- Where are modules **shallow**, with an interface nearly as complex as the implementation?
- Where have pure functions been extracted just for testability, but the real bugs hide in how they're called (no **locality**)?
- Where do tightly-coupled modules leak across their seams?
- Which parts of the codebase are untested, or hard to test through their current interface?

Apply the **deletion test** to anything you suspect is shallow: would deleting it concentrate complexity, or just move it? A "yes, concentrates" is the signal you want.

### 2. Present candidates as an HTML report

Write a self-contained HTML file to the OS temp directory (so nothing lands in the repo), open it for the user, and tell them the absolute path. See [HTML-REPORT.md](HTML-REPORT.md) for the full scaffold.

The report uses **Tailwind via CDN** for layout and styling, and **Mermaid via CDN** for diagrams where a graph/flow/sequence reliably communicates the structure. Mix Mermaid with hand-crafted CSS/SVG visuals: use Mermaid when relationships are graph-shaped (call graphs, dependencies, sequences), and hand-built divs/SVG when you want something more editorial (mass diagrams, cross-sections, collapse animations). Each candidate gets a **before/after visualisation**. Be visual.

For each candidate, render a card with:

- **Files**: which files/modules are involved
- **Problem**: why the current architecture is causing friction
- **Solution**: plain English description of what would change
- **Benefits**: explained in terms of locality and leverage, and how tests would improve
- **Before / After diagram**: side-by-side, custom-drawn, illustrating the shallowness and the deepening
- **Recommendation strength**: one of `Strong`, `Worth exploring`, `Speculative`, rendered as a badge

End the report with a **Top recommendation** section: which candidate you'd tackle first and why.

**Use context.md vocabulary for the domain, and the codebase-design vocabulary for the architecture.** If `harness/context.md` defines "Order," talk about "the Order intake module," not "the FooBarHandler," and not "the Order service."

**Decision Timeline conflicts**: if a candidate contradicts an existing Decision Timeline entry, only surface it when the friction is real enough to warrant revisiting it. Mark it clearly in the card (e.g. a warning callout: _"contradicts the Decision Timeline entry of 2026-09-01, but worth reopening because…"_). Don't list every theoretical refactor a recorded decision forbids.

See [HTML-REPORT.md](HTML-REPORT.md) for the full HTML scaffold, diagram patterns, and styling guidance.

Do NOT propose interfaces yet. After the file is written, ask the user: "Which of these would you like to explore?"

### 3. Grilling loop

Once the user picks a candidate, run the **grilling** skill (read `skills/grilling/SKILL.md`) to walk the decision tree with them: constraints, dependencies, the shape of the deepened module, what sits behind the seam, what tests survive.

Side effects happen inline as decisions crystallize; apply the **domain-modeling** skill (read `skills/domain-modeling/SKILL.md`) to keep the domain model current as you go:

- **Naming a deepened module after a concept not in `harness/context.md`?** Add the term to `harness/context.md`.
- **Sharpening a fuzzy term during the conversation?** Update `harness/context.md` right there.
- **User rejects the candidate with a load-bearing reason?** Offer a Decision Timeline entry, framed as: _"Want me to record this so future architecture reviews don't re-suggest it?"_ Only offer when the reason would actually be needed by a future explorer to avoid re-suggesting the same thing; skip ephemeral reasons ("not worth it right now") and self-evident ones.
- **Want to explore alternative interfaces for the deepened module?** Read `skills/codebase-design/DESIGN-IT-TWICE.md` and work the alternatives in sequence.
