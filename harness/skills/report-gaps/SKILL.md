---
name: report-gaps
description: Report unfinished, skipped, and out-of-scope items. Use when writing the done report.
---

# Honest Done

## Use when / Don't use

- Use: every done report, even when everything succeeded (then state "none").
- Don't use: interim progress notes (track them in the slot instead).

## Rules

- Shape: the markdown-file template below - verdict headline, then fixed headings Changed / Decisions / Gaps / Verify, in that order.
- Status tag on EVERY item, no exceptions. Prefix each bullet - and any inline mention of another item or task - with exactly one tag:
  - `[fixed]` - changed and verified in this task
  - `[partial]` - partly changed this task (say what remains)
  - `[not-fixed]` - mentioned or asked for, but not changed (say why)
  - `[untouched]` - pre-existing or out of scope, deliberately left as-is (say why)
  - `[decided]` - a decision only, no code/data change
  - `[rejected]` - considered, then rejected by evidence
  - `[blocked]` - attempted, blocked (missing info, auth, external)
  Never leave "was it fixed?" to inference. Anything named anywhere in the report - including work from earlier turns - carries a tag, and anything not changed this task appears under Gaps.
- Claim verdict per request item on the same line using its tag; the `##` headline carries the overall verdict + counts.
- File changes are bullet-bold names; a why-line indented under the bullet only when the reason is not obvious. No tables (chat window width is not guaranteed).
- A Gaps section is mandatory even when empty (`(none)`). Silence is not completeness.
- Never upgrade language: "implemented" = verified working; otherwise say "written, unverified" or "verified by reading only".
- Unrelated failures: report under Gaps with `[not-fixed]` + the exact command run; never fix or hide silently.

## Template

```markdown
## <task name> - <DONE | PARTIAL | BLOCKED> (<n>/<total>)

### Changed
- `[fixed]` **<file>** - <what changed>
  <why - one line, only when the reason is not obvious>
- `[partial]` **<file>** - <what changed> (left: <what remains>)

### Decisions (veto-able)
- `[decided]` <choice> (over: <rejected> - because <reason>)   <- only non-trivial choices

### Gaps
- `[not-fixed]` <item> - <why it was not done>
- `[untouched]` <pre-existing or out-of-scope item> - <why left>
(none)   <- mandatory heading, never skipped

### Verify
- `[fixed]` <item>: <exact command(s) run> <result>
```

Collapses: task touching <2 files -> Changed + Verify only. Assumptions fold into the Changed why-line. Variants: opinion/question answers use a short Evidence + Options shape (tags still apply, no full report, no history entry); audits are read-only reports - Findings heading replaces Changed, verdict says "read-only", verify states the evidence kind (e.g. "verified by reading only").

## Verify

- State verify evidence per item: exact command + result under the Verify heading; quote unrelated-suite runs visibly.
- A skeptic reading only the report can state exactly what remains and who picks it up; otherwise rewrite.
