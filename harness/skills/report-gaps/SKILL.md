---
name: report-gaps
description: Report unfinished, skipped, and out-of-scope items. Use when writing the done report.
---

# Honest Done

## Use when / Don't use

- Use: every done report, even when everything succeeded (then state "none").
- Don't use: interim progress notes (track them in the slot instead).

## Rules

- Shape: the markdown-file template in `harness/HARNESS.md` Report format - verdict headline, then fixed headings Changed / Decisions / Gaps / Verify, in that order.
- Claim verdict per request item on the same line: done / partially done / not done + reason; the `##` headline carries the overall verdict + counts.
- File changes are bullet-bold names; a why-line indented under the bullet only when the reason is not obvious. No tables (chat window width is not guaranteed).
- A Gaps section is mandatory even when empty (`(none)`). Silence is not completeness.
- Never upgrade language: "implemented" = verified working; otherwise say "written, unverified" or "verified by reading only".
- Unrelated failures: report under Gaps with the exact command run; never fix or hide silently.

## Verify

- State verify evidence per item: exact command + result under the Verify heading; quote unrelated-suite runs visibly.
- A skeptic reading only the report can state exactly what remains and who picks it up; otherwise rewrite.
