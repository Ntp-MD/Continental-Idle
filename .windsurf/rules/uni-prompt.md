# CSS Pattern-Compliance Audit Prompt

Use when: CSS files suspected of deviating from the design-system contract —
hardcoded px instead of tokens, wrong spacing scale, broken BEM naming,
wrong import order, or inconsistent margin/padding usage.

---

## STEP 0 — Define the Pattern Contract (fill in before running)

```
CSS PATTERN CONTRACT:
- [ ] Spacing tokens: all margin/padding/gap values must use
      --gap-xs / --gap-sm / --gap-md / --gap-lg / --gap-xl — no raw px
- [ ] Font tokens: all font-size must use --font-xs through --font-xl — no raw px/rem
- [ ] No-hardcode-px policy: any bare px value outside token definitions
      themselves is a violation
- [ ] Naming: flat-hyphen BEM only (.block-element-modifier), no nested
      selectors, no camelCase, no double-underscore/double-dash BEM syntax
- [ ] Import order: strict file import order per project-base.md
      (e.g. tokens → reset → layout → components → utilities)
- [ ] Color tokens: no hardcoded hex/rgb/hsl outside the token definition file
- [ ] Other project-specific rules: <...>
```

If any line is blank or the person hasn't specified the token file location,
the agent must ask before proceeding rather than guess a value.

---

## STEP 1 — Audit Prompt (Pass 1: Inventory)

```
Audit [FILE(S)/GLOB] against the CSS PATTERN CONTRACT above.

Rules for this pass:
1. Do NOT edit anything. Inventory only.
2. Check every rule in the contract against every selector — do not skip
   selectors that "look standard" without checking.
3. For every deviation, report:
   - File path + line number + selector
   - Which contract rule is violated
   - Actual value vs. expected token (literal values, not paraphrased)
   - Confidence: High / Medium / Low
     - High = clearly a raw px/hex where a token rule applies
     - Medium = ambiguous (e.g. a one-off value that might be intentional,
       like a border-radius nobody tokenized yet)
     - Low = possible false positive — flag only, do not act on it
   - Blast radius: Local (single selector) / Component (class reused across
     multiple files) / Systemic (a token itself is inconsistently defined)
4. Anti-hallucination contract: never claim a value is wrong without quoting
   the literal CSS you inspected. If unsure whether a token exists for this
   case, say so instead of assuming.
5. Completeness gate: state explicitly "Checked N files × M selectors × K
   rules." before returning the report.
```

---

## STEP 2 — Review Gate (human-in-the-loop)

Person reviews the Pass 1 report and approves which findings proceed.
Only High/Medium confidence items move to Pass 2 automatically;
Low confidence items need explicit sign-off.

---

## STEP 3 — Fix Prompt (Pass 2: Remediation)

```
Fix only the approved findings: [list, or "all High/Medium"].

Rules for this pass:
1. One file at a time. Show a before/after diff limited to the changed
   declarations (not the whole file).
2. Do not touch anything outside the approved list — log anything else
   noticed as a new Low-confidence finding instead of fixing it.
3. If a fix touches a class used in multiple files (Component/Systemic blast
   radius), list every other file referencing that class before editing.
4. After fixing, re-run the Pass 1 checklist on just the touched files to
   confirm zero remaining violations.
```

---

## STEP 4 — Verification Prompt (Pass 3: Confirm)

```
Re-audit [files touched in Pass 2] against the full CSS PATTERN CONTRACT.
Report remaining violations only. If zero:
"0 violations across N files — contract satisfied."
If a lint/build command exists (e.g. stylelint, npx vue-tsc --noEmit for
<style> blocks), run it and report pass/fail before declaring complete.
```

---

## Ready-made contract for Mod's project-base.md system

```
- Spacing: --gap-xs/sm/md/lg/xl only, no raw px in margin/padding/gap
- Typography: --font-xs through --font-xl only, no raw px/rem font-size
- Naming: flat-hyphen BEM, no nesting, no camelCase
- Import order: tokens.css → reset.css → layout.css → components/* → utilities.css
- Color: no hardcoded hex/rgb outside tokens.css
```

Swap this block into Step 0 and the rest of the prompt runs unchanged.