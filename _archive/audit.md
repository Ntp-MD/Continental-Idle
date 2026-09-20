You are acting as a senior staff/principal engineer performing a rigorous engineering audit of this entire repository.

Do NOT immediately modify any files.

Your job is to determine whether this project is well-designed, maintainable, robust, and production-quality.

Treat this as an architecture and codebase review performed before a major engineering investment.

## Phase 1 — Understand the system

First inspect the repository comprehensively.

Understand:

* application architecture
* technology stack
* entry points
* major modules
* data flow
* state management
* API boundaries
* component boundaries
* dependency relationships
* build and deployment configuration
* testing strategy
* development conventions
* important configuration files
* documentation
* scripts and tooling

Do not judge the project before understanding how the pieces interact.

Build a mental model of the system first.

## Phase 2 — Architecture audit

Evaluate:

* architecture quality
* separation of concerns
* cohesion
* coupling
* dependency direction
* module boundaries
* abstraction boundaries
* scalability
* extensibility
* circular dependencies
* inappropriate dependencies
* architectural inconsistencies
* duplicated responsibilities
* misplaced responsibilities
* premature abstractions
* missing abstractions
* architectural decisions that appear to be consequences of incremental patching

For every significant issue explain:

1. What the current design is
2. Why it is problematic
3. What architectural principle it violates
4. What the consequences are
5. What a better design would look like

Do not recommend abstractions simply because they are theoretically cleaner.

Prefer the simplest architecture that correctly supports the project's actual requirements.

## Phase 3 — Code quality audit

Inspect the implementation for:

* unnecessary complexity
* duplication
* large functions/components
* unclear naming
* inconsistent patterns
* hidden side effects
* excessive nesting
* poor error handling
* weak type safety
* magic values
* dead code
* unreachable code
* fragile logic
* inappropriate abstractions
* over-engineering
* under-engineering
* code that is difficult to test
* code that is difficult to change safely

Look for systemic problems rather than isolated style preferences.

## Phase 4 — Project structure audit

Evaluate whether the repository structure communicates the architecture clearly.

Check:

* folder organization
* module ownership
* component boundaries
* page-level boundaries
* shared code
* utilities
* composables
* domain logic
* infrastructure code
* configuration
* test organization
* dependency direction

Ask:

"If a new senior developer joined this project today, could they predict where new code belongs?"

Identify structural problems that would become worse as the project grows.

## Phase 5 — Reliability and production readiness

Look for:

* failure modes
* error propagation
* error recovery
* race conditions
* state consistency problems
* unexpected side effects
* unsafe assumptions
* concurrency issues
* resource leaks
* performance bottlenecks
* security weaknesses
* configuration problems
* environment-specific behavior
* logging problems
* observability gaps
* deployment risks
* rollback/recovery problems

Focus on realistic failure scenarios.

## Phase 6 — Testing audit

Do not judge testing by test count or coverage alone.

Determine:

* what behavior is actually protected
* what critical behavior is untested
* missing integration tests
* missing E2E tests
* weak unit tests
* missing edge cases
* missing failure-path tests
* flaky tests
* tests coupled to implementation details
* regression risks

Identify the highest-value missing tests.

## Phase 7 — Maintainability audit

Evaluate the project from the perspective of a developer who must maintain it for several years.

Look for:

* implicit knowledge
* inconsistent conventions
* difficult-to-discover behavior
* hidden dependencies
* surprising behavior
* fragile areas
* repeated patterns
* unclear ownership
* documentation gaps
* areas where a small change could cause unrelated breakage

## Phase 8 — Find systemic problems

This is extremely important.

Do not only produce a list of individual issues.

Look for patterns.

For example:

* the same design mistake repeated across multiple modules
* excessive coupling caused by one architectural decision
* duplicated logic caused by missing boundaries
* complexity caused by an incorrect state model
* testing problems caused by poor architecture
* inconsistent code caused by missing conventions

Identify the root causes.

## Phase 9 — Risk assessment

Classify findings:

### Critical

Could cause serious production failures, security problems, data corruption, or make the system fundamentally difficult to maintain.

### High

Significant architectural, reliability, maintainability, or scalability problem.

### Medium

Meaningful technical debt or recurring engineering problem.

### Low

Minor improvement with limited practical impact.

Do not inflate severity.

## Phase 10 — Prioritization

Create a prioritized remediation plan.

For each item provide:

* severity
* location
* problem
* root cause
* impact
* recommended solution
* estimated implementation complexity
* dependencies
* whether it should be fixed now or later

Prioritize based on:

Impact × Risk × Frequency × Cost of delaying

Do not prioritize based on code aesthetics.

## Phase 11 — Architecture verdict

At the end provide:

### Architecture

* strengths
* weaknesses
* major architectural risks

### Codebase

* strengths
* weaknesses
* major maintainability risks

### Testing

* strengths
* weaknesses
* important missing coverage

### Production readiness

* strengths
* weaknesses
* major operational risks

### Technical debt

Identify the debt that actually matters.

### Root causes

Identify the 3–10 systemic problems responsible for most of the issues.

### Recommended roadmap

Group recommendations into:

1. Fix immediately
2. Fix before next major feature
3. Fix when touching the area
4. Optional improvements

## Important rules

Do NOT rewrite the project.

Do NOT make changes during the audit.

Do NOT criticize code merely because you would personally write it differently.

Do NOT recommend patterns, abstractions, frameworks, libraries, or architectural changes without demonstrating the concrete problem they solve.

Do NOT optimize for theoretical purity.

Optimize for:

* correctness
* maintainability
* reliability
* simplicity
* changeability
* performance where relevant
* long-term engineering cost

Distinguish clearly between:

* actual defects
* architectural risks
* technical debt
* subjective style preferences

Whenever possible, reference the exact files, modules, functions, or components involved.

Before producing the final report, verify that your conclusions are supported by the actual repository.

The goal is not to make the code "look cleaner".

The goal is to determine whether the engineering decisions are sound and whether this codebase can be safely evolved over time.
