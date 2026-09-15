# Agent pointers

A provider agent follows `AGENTS.md` only if a file it auto-reads points it there.
Those files are **path-bound** - each client reads a fixed location at the repo root -
so a pointer cannot live inside `harness/` and still work. This folder keeps the single
canonical text plus the provider map; the pointer is copied to a root path only for the
clients a project actually uses. Unused pointers at root are clutter.

## Map (provider -> root path)

| Provider       | Root path                         |
| -------------- | --------------------------------- |
| Cline          | `.clinerules`                     |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Claude Code    | `CLAUDE.md`                       |
| Gemini CLI     | `GEMINI.md`                       |
| Cursor         | `.cursorrules`                    |
| Windsurf       | `.windsurfrules`                  |

`pointer.txt` is the single source for every provider. Add a pointer by hand: copy
`pointer.txt` to the provider's root path. `adopt.mjs` writes no pointer by default -
pass `--agents=cline,copilot,claude,gemini,cursor,windsurf` to add the ones a client
actually needs.

Most clients now read `AGENTS.md` directly - add a pointer only for a client that does
not, or when unsure.