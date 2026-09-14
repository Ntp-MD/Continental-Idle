# NOTICE - skill attribution

The skills in this folder are adapted from [`mattpocock/skills`](https://github.com/mattpocock/skills)
(vendored as a snapshot on 2026-09-12, upstream `main`).

MIT License - Copyright (c) 2026 Matt Pocock

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Local adaptations (this repo, MIT too)

- Provider-specific metadata and invocations removed: frontmatter gates and
  `agents/openai.yaml` (Codex) - the skills gate in `harness/HARNESS.md` owns invocation.
- "Call the Skill tool with X" resolves to reading `skills/<name>/SKILL.md` in-session.
- Sub-agent dispatch (grilling fact-finding, improve-codebase-architecture walk,
  design-it-twice parallel exploration) runs sequentially, in-session.
- Upstream doc homes mapped to this harness: `CONTEXT.md` -> `harness/context.md`
  (the single glossary), ADRs -> Decision Timeline entries per `AGENTS.md` Decisions
  (no `docs/adr/`, no second decisions file); the `CONTEXT-FORMAT.md` and
  `ADR-FORMAT.md` companions are therefore dropped - the mapped shapes own them.
- `code-review` (cited by tdd) is not vendored: the loop's Step 6 review owns it.
- Per-file headers carry the same attribution line.
