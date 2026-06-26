---
description: Exhaustive multi-pass security and correctness audit of the Continental Idle codebase
---

Perform an exhaustive, multi-pass security and correctness audit of the Continental Idle codebase.

You are operating simultaneously as:
- A **static analysis engine** that reads every symbol, import, and type annotation
- A **runtime simulator** that traces execution paths and state transitions mentally
- An **adversarial attacker** who assumes hostile input, abusive users, and worst-case timing
- A **game economy designer** who stress-tests balance curves and progression loops

You have unlimited patience. You do not stop at the first finding. You do not declare a system "probably fine." You find everything.

## Mandatory Pre-Analysis Protocol

Before writing a single finding, perform **exactly 3 structured passes** in sequence. Do not merge them. Do not skip to the report.

### Pass 1 — Static Analysis
Read every file cold. Trace:
- All imports and re-exports (dead code, circular deps, version mismatches)
- Type annotations: every `any`, unsafe `as`, missing return type, interface/runtime shape mismatch
- All function signatures vs. call sites (argument count, type coercion)
- All constants, magic numbers, and hardcoded values
- CSS/HTML: unused classes, missing ARIA, contrast issues

### Pass 2 — Runtime Path Simulation
Mentally execute the program. Trace:
- Every async flow: promise chains, unhandled rejections, race conditions, await inside loops
- Every state transition: what happens when state mutates mid-render / mid-save / mid-animation
- Every external input path: localStorage, URL params, user input, API responses, file reads
  - For each input, mark each processing step as **VALIDATED** or **UNVALIDATED**
- Every error boundary: what happens when a fetch fails, a parse throws, a worker crashes

### Pass 3 — Adversarial Review
Assume a motivated attacker or a naive user causing maximum damage. Ask:
- What happens if I send `null`, `""`, `NaN`, `Infinity`, `{}`, `[]`, or a 10MB string to every input?
- What if two async operations resolve in the wrong order?
- What if localStorage is full, corrupted, or completely missing?
- What if the user spams clicks on a purchase button?
- What if the game runs for 24 hours — do numbers overflow or go negative?
- What if the tab is closed mid-save?
- Can I inject arbitrary HTML or script via any user-controlled field?

## Analysis Categories

Audit every category. If a category is clean, state that explicitly with evidence — do not silently skip.

### 1. Correctness & Logic
Edge-case failures, off-by-one errors, incorrect operator precedence, state mutation side effects, unhandled exceptions, wrong return values, broken conditionals, incorrect comparisons (`==` vs `===`), missing `break` in switch, shadowed variables.

### 2. Security
- Injection: XSS, HTML injection, prototype pollution, SQL/NoSQL injection
- Access control: missing auth checks, client-side-only guards, exposed admin routes
- Data leaks: secrets in source, sensitive data in logs, localStorage storing PII
- Unsafe deserialization: `eval()`, `Function()`, `JSON.parse()` without schema validation
- Missing validation: unvalidated external data passed directly to DOM, filesystem, or eval

### 3. Concurrency & Async
Race conditions, deadlocks, double-invocation of async handlers, missing `await`, `.then()` chains that swallow errors, `Promise.all` vs `Promise.allSettled` misuse, shared mutable state across async boundaries, stale closures in callbacks, `setTimeout`/`setInterval` accumulation.

### 4. Performance
Memory leaks (event listeners never removed, DOM nodes retained in closures), blocking I/O on main thread, infinite loops or loops without exit, O(N²) or worse algorithms, unnecessary re-renders, polling without cleanup, large payloads held in memory.

### 5. UI/UX Coverage — Feature vs Interface Checklist
For **every feature, mechanic, and system** found in the codebase, verify that a corresponding UI layer exists. Report as a **checklist table**:

| Feature / System | Backend Logic | UI Layer | Loading State | Error State | Empty State | Notes |
|---|---|---|---|---|---|---|
| [auto-fill from code] | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | |

Flag any feature with backend logic but no user-facing interface, no feedback on action, no error/loading/empty state handling, or an incomplete interaction flow.

### 6. Game Balance & Economy
- Cost growth curves: are upgrade costs exponential, polynomial, or accidentally flat?
- Income scaling: does passive income outpace costs within N minutes of play?
- Prestige/reset multipliers: do they provide meaningful but not game-breaking gains?
- Formula verification: does any formula produce `NaN`, `Infinity`, negative currency, or divide-by-zero?
- Soft/hard caps: are there any? Are progress dead-ends possible?
- Exploit vectors: can the player purchase the same upgrade twice? Negative-cost items?
- Time simulation: what does the economy look like after 1 hour, 10 hours, 100 hours offline?

### 7. Save/Load & Persistence
- Serialization completeness: is every runtime state field included in the save payload?
- Deserialization safety: are missing/extra fields handled gracefully, or do they crash?
- Schema versioning: is there a migration path when the save format changes?
- Corruption recovery: what happens when `JSON.parse()` throws on load?
- Autosave timing: is the interval appropriate? Can a crash cause significant progress loss?
- Data loss scenarios: tab close mid-save, storage quota exceeded, private browsing
- State desync: after save → reload, does every derived/computed value recalculate correctly?

### 8. Accessibility & Responsiveness
- Keyboard navigation: every interactive element reachable and operable via keyboard
- ARIA labels: all buttons, icons, modals, and dynamic regions properly labelled
- Color contrast: minimum 4.5:1 for body text, 3:1 for large text (WCAG AA)
- Mobile breakpoints: layout integrity at 320px, 375px, 768px
- Touch targets: minimum 44×44px for all interactive elements
- Mouse-only interactions: flag any feature that has no keyboard or touch equivalent

### 9. Dead Code & Unused Systems
- Functions declared but never called
- Components imported but never rendered
- CSS classes defined but never applied
- Event listeners registered but never triggered or never removed
- Constants or config values defined but never read
- Commented-out code blocks (indicate design churn or abandoned features)
- Orphaned data definitions (types, interfaces, enums with no consumers)

### 10. Type Safety
- `any` usage (explicit or implicit)
- Unsafe type assertions (`as SomeType` without runtime guard)
- Missing return type annotations on non-trivial functions
- Runtime shape mismatches (API response doesn't match declared interface)
- Optional chaining absent where `undefined` is possible
- Enum/union exhaustiveness: are all cases handled in switch/if chains?

### 11. Dependency & Supply Chain
- List all third-party dependencies
- Flag any pinned to an outdated or vulnerable version
- Flag any imported but unused
- Flag any that could be replaced with a native browser/Node API
- Flag any with unusual permissions, network access, or filesystem access

### 12. Architectural Debt
After all findings, add a dedicated section:
- Any system over-engineered for its current scope
- Any system that will not scale past 10× current load
- The single structural refactor that would eliminate the most bugs
- Missing systems that should exist (e.g., no error boundary, no input sanitization layer, no retry logic)

## Anti-Hallucination Contract

> **CRITICAL: Every finding must be grounded in code you actually read.**
>
> - Every finding **must cite** exact file name + line range + the specific token, expression, or pattern that is wrong.
> - If you cannot cite it precisely, classify it under **"Requires Manual Verification"** — never assert it as a confirmed bug.
> - Do not invent line numbers. Do not cite patterns you assume exist without seeing them.
> - If a category is clean based on what you read, say: *"No issues found in [Category]. Verified by tracing [specific path]."*

## Reporting Format

### Executive Summary

Open with a brief summary (5–10 sentences) covering:
- Overall codebase health
- Most critical finding
- Highest-risk category
- Coverage gaps

Then group findings:

```
CONFIRMED BUGS          → You can cite exact code proving this is wrong
HIGHLY PROBABLE BUGS    → Strong evidence but requires runtime confirmation
SUSPICIOUS CODE PATHS   → Anomalous patterns worth investigating
REQUIRES MANUAL REVIEW  → Cannot fully verify from static analysis alone
```

### Per-Finding Schema

Use this exact format for every finding:

```
#### [Severity: Critical/High/Medium/Low/Info] — [Bug Name]

| Field | Value |
|---|---|
| **Location** | `filename.ts` lines 42–67 |
| **Confidence** | 0–100% |
| **Exploitability** | Trivial / Moderate / Requires specific conditions |
| **Blast Radius** | Isolated / Feature-level / System-wide / Data loss / Security breach |

**Description:**
Clear description of the failure mode and its real-world impact on users or the system.

**Root Cause:**
Technical explanation of why the logic or implementation fails. Reference the specific expression or pattern.

**Proposed Fix:**
```typescript
// Before (broken)
const value = data[key]; // unvalidated, can be undefined

// After (fixed)
const value = data[key] ?? defaultValue;
if (!isValidValue(value)) throw new Error(`Invalid value for key: ${key}`);
```

**Verification Step:**
Exact input or scenario that reproduces the bug.
```

## Completeness Requirement

> You are **NOT done** until:
> - Every category in the Analysis Categories section has been addressed — either with findings or an explicit clean verdict with evidence
> - The Feature vs UI Checklist table is populated for every feature found in the codebase
> - The Architectural Debt section is written
> - Every finding has a Confidence score, Exploitability rating, and Blast Radius

## Audit-Fix Loop

When asked to audit AND fix, run in a continuous loop:

1. **Audit pass** — perform all 3 structured passes, report findings grouped by severity
2. **Fix pass** — implement fixes for all confirmed and highly probable bugs, starting with highest severity
3. **Verify** — run `npx vue-tsc --noEmit` and `npx vite build` to confirm no regressions
4. **Re-audit** — scan again for new issues introduced by fixes
5. **Repeat** — if new issues found, go back to step 2
6. **Stop** — only when (a) no new findings, OR (b) user explicitly says to stop

Keep a todo_list of all findings and their fix status. Summarize after each pass: what was found, what was fixed, what remains.

## Closing Principles

1. **Think step-by-step** before writing any finding — state the reasoning chain
2. **Production quality** — proposed fixes must be production-ready, not pseudocode
3. **Explicit over implicit** — no magic, no "it probably works" — show the proof
4. **Edge cases first** — the happy path is already tested; find what breaks the edges
5. **Self-review** — after writing each finding, re-read it: does the cited code actually prove this?
6. **Architecture awareness** — if a better structural approach eliminates a class of bugs, mention it
7. **No mercy on severity** — do not downgrade a Critical finding to spare feelings
8. If something is unclear, ask ONE clarifying question before proceeding
9. Add comments only where the "why" isn't obvious from the code itself

Begin your analysis now. Perform all 3 passes before writing the first finding. Be thorough, precise, and objective.
