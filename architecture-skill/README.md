# Architecture Design Skill

An operational reasoning framework that makes an AI agent design buildings like an architect rather
than like a pixel artist. It is not a "act as a professional architect" prompt: it is a fixed reasoning
order, an evidence corpus with provenance, a quantification layer, and a validation/measurement loop,
written for environments where space is discrete — a tile grid, a cell map, a block lattice.

Built for the Continental-Idle blueprint editor (1 tile = 0.5 m). The corpus is host-agnostic; only the
adapter is not. See [Porting to your own grid](#porting-to-your-own-grid).

## What is in here

```
architecture-skill/
├── SKILL.md          the procedure: order of reasoning, feasibility gate, generation ladder,
│                     validation, quantitative layer, output contract (~33 sections)
├── research/         the evidence: 38 finished domain files + 3 index/reference files (~3.8 MB)
│   ├── coverage-map.md      what each domain owns, what it refuses to repeat, open conflicts, open gaps
│   ├── sources.md           consolidated URL-bearing index
│   └── synthesized-rules.md pooled cross-domain master rules (SR-01…SR-37) + tension register
└── audit/            an adversarial evidence audit of the corpus: what is supported, what was
                      re-researched, what the auditor got wrong (start at audit/README.md)
```

Every rule in `research/` is one 8-field record, uniform across the corpus — with one deliberate
exception: `failure-patterns.md` (Domain R) records each failure as
`Failure / Cause / Detection / Severity / Prevention / Correction`, because a failure is diagnosed, not
claimed. Verified mechanically: in the other 37 domain files the count of `### ID-nn` rule headings equals
the count of `- Rule:` fields.

```
### GT-05 Round UP every functional minimum
- Rule:                 what to do, operatively
- Evidence:             what the source actually says, quoted or paraphrased, with the payload
                        (formula, table, worked numbers) that carries the decision
- Source:               document + URL + clause/edition where applicable — T1/T2/T3/T4 tier marker
- Class:                FACT | STANDARD | CODE REQUIREMENT | DESIGN PRINCIPLE | HEURISTIC |
                        BUILDING-TYPE CONVENTION | ENGINEERING CONSTRAINT | EXPERIENCE-BASED ADVICE
- Scope:                which building types, which jurisdictions, which climates
- Confidence:           High/Medium/Low + why, including anything unverified
- Grid translation:     what a plan-level engine computes or encodes, in tiles and metric keys
- Exceptions / failure: what breaks it, and the observable symptom of a design that has it
```

The `Class` field is the load-bearing one: it is what stops a vendor blog's number from reading like a
code clause. The `Grid translation` field is what makes the corpus executable instead of encyclopedic.

## The four things this skill is for

1. **Order.** Programme → relationships → zoning → circulation → core → structure → services →
   environment → geometry → grid → validation → iteration. Reversing it is allowed once you have said
   why; the usual cost of reversing it is a floor that is 40 % corridor, discovered afterwards.
2. **Feasibility before drawing.** A nine-item arithmetic gate (envelope fit, occupant load and egress
   width, vertical demand, must-touch embeddability, module register, daylight envelope, service stacks,
   structural plausibility, control grid) runs before the first tile is placed.
3. **Magnitude.** The quantitative layer supplies the numbers behind the rules: elevator round-trip-time
   and handling capacity, egress flow and ASET/RSET, load take-down and span/depth, ventilation and
   fixture-unit arithmetic, sun geometry and daylight thresholds, operating ratios, spatial-analytics
   metrics, and the KPI vector that scores the finished design.
4. **Honest reporting.** Three-valued verdicts (pass / fail / unknown), measured-vs-required diff tables,
   assumption and flag registers, a limitations statement, and the sources actually consulted. "Should be
   fine" is not an output.

## Using it with an agent

Point the agent at `SKILL.md` and let it enter through the reading rule, because the corpus is roughly
3.8 MB and reading all of it is a failure mode, not diligence:

> Design a 250-key, 21-floor hotel on a 90 × 60 tile site, 1 tile = 0.5 m. Follow
> `architecture-skill/SKILL.md`: run the pre-geometry feasibility gate before placing any tile, then the
> generation ladder, then validate. Enter research through the section → evidence map, and report every
> assumption, flag and limitation.

For a review or repair task, the same file's Validation and Failure Detection sections are the entry
point; `research/coverage-map.md` tells the reviewer which quantitative file owns the number in question.

## Porting to your own grid

Replace four things and the corpus comes with you:

| Swap | Where | What to write |
|---|---|---|
| Scale & rounding policy | `SKILL.md` § Grid / Tile Translation | Your tile size, and whether minimums round up. If a tile is 1 m, the corpus's 0.5 m precision claims (door leaves, clear widths below 1 tile) must be re-derived, not reused |
| Host facts | `SKILL.md` § Host facts verified in code | Verified facts about *your* engine, each with the file or routine it came from: how rooms are derived, how movement is costed, what a wall actually is, what the schema cannot represent. Every one of these should be established by executing your engine, not by assuming it |
| Carried constants | `SKILL.md` § Carried constants | The working defaults your agent may use without opening a research file, each labelled with class and the file holding its evidence |
| Output contract | `SKILL.md` § Output Requirements | The payload your editor consumes (coordinates, tags, grid states), in your vocabulary |

Everything else — the reasoning order, the gate, the evidence, the arithmetic — is not project-specific.
The corpus's most transferable habit is the discipline itself: no number without a source, no source
without a tier, no rule without a class.

## Extending it without duplicating it

`research/coverage-map.md` is the contract. Before adding a domain:

1. Sweep the rule titles: `grep -rn "^### " research/` — if the decision you want to write is already
   titled somewhere, you are adding a duplicate, not a domain.
2. Probe your topic's keyword coverage across `research/`, `audit/` and `SKILL.md`. Zero or
   mention-only hits mean the ground is free; heavy hits mean you are adding depth to an existing
   domain, which is a *revision*, and revisions go in the existing file.
3. Claim a rule-prefix in the prefix registry (§7 of the coverage map). Two domains with the same prefix
   has already happened once and cost a rename.
4. State your boundary in the file's first paragraph: which existing rules you sit beside, and what you
   refuse to restate.
5. Record every cross-file contradiction you find in the conflict register with a status — adjudicated,
   open, or reported-but-unverified. Averaging two conflicting numbers is how a corpus destroys itself.

Research doctrine is in `SKILL.md` § Evidence Rules: five source tiers, T4/T5 material may only enter as
Low-confidence heuristics, a caveat lives inside the rule it qualifies, and "flag for verification" is a
complete and acceptable answer while an invented number is not.

## Status, and what is known weak

- 23 original domains (A–X) plus 17 quantitative domains (Y–AP: layout solvers, spatial analytics,
  evaluation, vertical transport, fire quantification, structural sizing, services sizing,
  envelope/daylight, hospitality operating standards, compliance-as-code, construction programme, massing and
  site metrics, cost mathematics, facility-layout optimisation, inclusive-use sequencing, indoor-environment
  outcomes, post-occupancy feedback) — **1070 rules** (605 original + 465 new). Audited once adversarially
  (`audit/`, §23 covers the new layer), with the audit's own errors recorded.
- Tier-1 coverage is uneven by design: where a standard's body could not be read, the file says so. The
  two weakest new files are `structural-sizing.md` (standards cited by clause, without URLs) and
  `vertical-transport.md` (no Tier-1 document could be opened at all). Their numbers are preliminary
  checks, and their weakest claims are flagged in place.
- Open work: `sources.md` and `synthesized-rules.md` predate the quantitative layer and need a rebuild;
  the domains still unresearched are listed in `coverage-map.md` §6, and the per-file evidence census in
  §5 says which numbers are safe to lean on.
- **No license file yet.** Add one before publishing, and check the terms of any third-party document
  you quote — the corpus cites standards and vendor pages by reference, which is safe; verbatim
  reproduction of a copyrighted standard's text is not.
