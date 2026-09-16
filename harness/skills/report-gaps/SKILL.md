---
name: report-gaps
description: Report unfinished, skipped, and out-of-scope items alongside results. Use when writing the done report.
---

# Honest Done

Purpose: make partial work impossible to mistake for finished work.

## Use when / Don't use

- Use: every done report, even when everything succeeded (then state "none").
- Don't use: interim progress notes (still track them in the slot instead).

## Rules

- Claim verdict per request item in the same line: done / partially done / not done + reason.
- Mandatory Not-done section, even if the answer is "none". Silence is not completeness.
- Never upgrade language: "implemented" = verified working. Otherwise say "written, unverified" or "verified by reading only".
- Unrelated failures: report separately with the exact command run; never fix silently, never hide.

## Workflow

1. List each requested item -> verdict + reason.
2. List unfinished/skipped/limitations (or "none").
3. State verify evidence: exact command + result. Quote unrelated-suite runs visibly.

## Verify

- A skeptic reading only the report can state exactly what remains and who should pick it up. If not, rewrite.
