# Project skills

This project only. Never ships with the harness. `AGENTS.md` states the rules; this file is a router to the project's domain facts. Read ONLY the matching doc before touching its domain.

## Routing

| Touching | Read |
| -------- | ---- |
| Data flow (migration, loaders, persistence, sync, validation, engine adapters, UI saves), definitions/instances, tags, canonical helpers, field-change checklists | `docs/skill/data-flow.md` |
| Domain engines (editor preview + runtime simulation, adapters) | `docs/skill/data-flow.md` (Domain engines) |
| Editor UI (`src/blueprint-editor/`): markup, CSS, classes, component patterns, BEM, cascade | `AGENTS.md` (UI conventions) |
| Designing, generating, inspecting, critiquing or improving a building/layout on the tile grid (adjacency, zoning, circulation, corridor/room widths, service flow, plant/risers, wayfinding, layout evaluation, "this hotel layout is wrong") | `docs/research/grid-architecture-kb.md` - start at §1 (summary), §2 (code-verified grid contract), §29 (the procedure) |

Cross-cutting: labels use player vocabulary only, and the glossary lives in `harness/state/context.md` - never a second glossary file.