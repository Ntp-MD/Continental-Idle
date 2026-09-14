# History - shared cross-agent intent log

Entries only. Pattern lives in `harness/HARNESS.md` (History pattern) -
follow it when logging below.

## Entries (Doing - Finished (Agent, Model) + Detail Bullets)

- (empty - first finished task adds the first entry here)

### cline chat usage strip (day/week/month limits) - 2026-09-10 (cline, cline)
- usage strip above composer replaces toolbar ctx chip: Session ctx cell (tokens vs context limit) + Day/Week/Month spend cells with live bars, warn >=70%, danger >=90%
- per-period limits persisted in cline-chat-settings-v1 (dailyLimit/weeklyLimit/monthlyLimit, $ inputs, 0 = off); resets: local midnight / Monday 00:00 / 1st of month; countdown tick every 15s (onUnmounted cleanup)
- spend tracked from CLI usage-event cost: liveCost accumulates during run, commits to localStorage cline-chat-usage-v1 on run_result (totalCost preferred) or exit; 40-day / 500-record retention; live in-run cost shows on top of committed totals
- verified: npm run lint:bem (34 pass), npm run lint:css (34 pass), npm run typecheck (3 configs), harness verify check pass (slot cleared)

### cline chat usage gauges in topbar - 2026-09-10 (cline, cline)
- usage strip moved from above composer into the toolbar, restyled as 4 compact radial SVG gauges (ctx / Day / Week / Month): ring arc = pct of limit, % in dial center, label + value + reset countdown beside; warn >=70% gold arc, danger >=90% red arc (ctx also on context_window_exceeded)
- fixed latent bug: ctxClass still emitted removed cline-chat__ctx--* modifier names after the strip edit, so ctx cell never got warn/danger colors - now emits gauge modifiers
- verified: npm run lint:bem (34 pass), npm run lint:css (34 pass), npm run typecheck (3 configs), harness verify check pass (slot cleared)

### mod-cli theme editor removed + layout width pass - 2026-09-12 08:00 UTC+7 (cline, model id n/a)
- user order: no theme setting - the whole editor is gone (constants, state, computeds, handlers, save/load/watch, template section, root :style, color/range input CSS, doc bullet + config field); a lint:css orphan-class fail caught the one template leftover (`__section` div), renamed back to `__connect`
- layout width pass (ModCLI.css, no markup change): sessions sidebar 30% -> clamp(260px, 26vw, 360px), todos 240px -> clamp(230px, 18vw, 300px), settings clamp(260px, 20vw, 340px); log + composer share a centered 900px reading column (padding-inline max() trick, zero elements added); user prompts are right-aligned cards (bg-secondary, blue right edge, max 88ch), assistant replies shrink-to-fit at max 92ch, thinking/event details capped at 110ch; empty state vertically centered (margin-block auto); scrollbar-gutter stable on the log
- verified: npm run lint:bem (35) pass, npm run lint:css (35) pass, npm run typecheck (3 configs) clean; browser rendering not verified (no dev server run this session)

### mod-cli agent-state chip - 2026-09-12 08:12 UTC+7 (cline, model id n/a)
- new toolbar chip `<output :data-state>`: Idle / Asking / Questioning / Thinking / Planning / Tasking, from an agentState computed over existing wire state only (pending permission card -> asking; question-y title or in-progress question tool -> questioning; streaming thought or ACP think-kind tool -> thinking; planMode -> planning; else tasking; no run -> idle) - hover hint per state
- CSS: pill + ::before dot (idle green, thinking/tasking blue with mod-cli-pulse, planning/asking/questioning gold), prefers-reduced-motion disables the pulse
- typecheck fail fixed: static + bound `data-state` duplicate attribute on the same element
- mod-cli/mod-cli.md: live agent state chip bullet
- verified: npm run lint:bem (35) pass, npm run lint:css (35) pass, npm run typecheck (3 configs) clean; browser rendering not verified (no dev server run this session)

### mod-cli presets - 2026-09-12 08:16 UTC+7 (cline, model id n/a)
- Presets section in Settings: save current Provider + Model + Reasoning effort under a name (upsert), apply from a dropdown, Set default / Delete; the default preset re-applies on every load
- apply order matters: providerAccount first (its watch resets the model + refetches), model re-set on nextTick so the reset cannot wipe the preset's model; a model the provider does not offer still gets the existing reset-with-note guard
- storage: additive `presets` + `defaultPreset` fields in the existing SETTINGS_KEY, load-time validated; arrays always reassigned so the non-deep settings watch persists them
- cline 3.0.61 `cline config` is read-only (no set subcommand), so the CLI itself cannot store a default model - presets live in mod-cli's browser store
- `.mod-cli-chat__connect` renamed `__section`, now shared by the connect + presets groups (2 same-role call sites)
- mod-cli/mod-cli.md: Presets bullet + config fields

### mod-cli agent-state sim test - 2026-09-12 08:29 UTC+7 (cline, model id n/a)
- extracted the chip decision table to mod-cli/src/agentState.ts (pure resolveAgentState(running, planMode, items)) so the sim drives the exact logic the component computes; ModCLI.vue now imports it, labels/hints stay in the component
- sim test tests/_agent-state-sim.tmp.ts (tsx + node:assert, deleted same session): 23 scenarios - idle variants, prompt-sent tasking, thinking (stream + think-kind tool), tool running/done tasking, permission -> asking, question title -> questioning, question-kind tool -> questioning, answered card -> tasking, plan mode drafting/thinking/blocked, plus a full-run walk sampled at every stream event - all pass
- first run caught one test-scenario bug (pushed a second permission card instead of answering in place - impossible over ACP, which blocks a second request while one is pending); fixed the sim, logic unchanged
- typecheck caught a real gap tsx missed: AgentStateItem lacked toolCallId - added
- verified: npx tsx sim 23/23 pass, temp file deleted; npm run lint:bem (35) pass, npm run lint:css (35) pass, npm run typecheck (3 configs) clean, npm run lint exit=0
- verified: npm run lint:bem (35) pass, npm run lint:css (35) pass, npm run typecheck (3 configs) clean; browser rendering not verified (no dev server run this session)

### mod-cli question choice cards - 2026-09-12 08:59 UTC+7 (cline, model id n/a)
- when an agent card is a question (AskFollowupQuestion arrives as request_permission with the suggestions as options - already forwarded by the bridge), it now renders as a choice card: gold-tinted panel, bolder summary without the "- tool call" suffix, options stacked as full-width left-aligned buttons with gold hover; approval cards keep the inline look
- zero-duplication: the question heuristic is exported from agentState.ts as isQuestionCard and drives BOTH the state chip (resolveAgentState) and the card presentation (cardIsQuestion in ModCLI.vue)
- answer path unchanged: clicking a choice posts /__cline/permission with that optionId; free text is impossible over the ACP permission round-trip (choices only), documented in mod-cli.md
- sanity re-check after the refactor: tsx eval - question pending -> questioning, plain pending -> asking, plan blocked -> questioning, answered falls through -> tasking (all pass)
- verified: npm run lint:bem (35) pass, npm run lint:css (35) pass, npm run typecheck (3 configs) clean, npm run lint exit=0; browser rendering not verified (no dev server run this session)

### mod-cli suggested-pick badge - 2026-09-12 09:16 UTC+7 (cline, model id n/a)
- question choice cards now mark the agent's primary pick: the first option carries a "Suggested" pill (gold, hover hint "The agent lists its primary pick first"); badge shows on question cards with 2+ options only - approval kinds (allow/reject) are semantics, not preference, and a lone suggestion needs no marking
- wire facts driving it (verified in vite.config.ts asPermissionOptions): each choice forwards { optionId, name, kind } only - kind is the allow/reject semantic, the ACP permission round-trip carries no recommended flag and no per-option why; the one real signal is that cline maps AskFollowupQuestion.suggestions in the agent's own preference order (pick first), and the agent's reasoning, when written, is embedded in the question text (card summary)
- a hint line under the choices states the ordering + where the reasoning lives; no "why" per option is invented
- process note: plan slot not written before implementing this turn (work went inspect -> implement directly); headers still clean on the harness check
- verified: npm run lint:bem (35) pass, npm run lint:css (35) pass, npm run typecheck (3 configs) clean, npm run lint exit=0; browser rendering not verified (no dev server run this session)

### mod-cli gap-closing sweep - 2026-09-12 09:43 UTC+7 (cline, model id n/a)
- plan written to the task slot BEFORE implementing (process slip from last turn corrected); one plan item DROPPED after inspection: the planned storage.ts module was unnecessary - usage/todos/settings-load were already try-guarded, the one real miss was saveSettings (guarded in place)
- HANG FIX: answerPermission now reverts the optimistic lock on POST failure (re-clickable choice; a locked card + unanswered wire was a permanent-run-hang mode) - ModCLI.vue
- DEAD-RUN FIX: `sawRunResult` tracks whether the bridge settled the run; a stream that ends without a run_result (dev-server restart / CLI death) pushes an explanatory note instead of ending silently - review correction: the chip's running state was NEVER stuck (finally always reset it); the real gap was the silent end, now fixed
- LEAK FIX: bridge plugin now evicts ACP children on server close (`closeServer` hook) and on process exit/SIGINT/SIGTERM - verified `process.on` never existed before, orphaned `cline --acp` children were real
- REVIEW CORRECTIONS (verified, no code - the honest non-gaps): DNS-rebinding is already covered (isSafeClientRequest requires the unforgeable client marker header + Origin/Referer/Sec-Fetch-Site - a Host check would be redundant); storage guards were in place except saveSettings; apiKey surface was already clearly labelled in the field and the connection summary; the repo already has a permanent test convention (tests/test-*.ts) - the earlier "no permanent test suite" claim was wrong, mod-cli simply was not wired into it
- ROBUSTNESS: isQuestionCard wording widened (choose / pick one / select one / which) with the asymmetry rationale (mis-bucketing an approval as a question is cosmetic; the reverse styles an unanswerable prompt as an approval); ChatItem now extends AgentStateItem (one shared shape - chip table + transcript can never drift)
- OPENCODE DEFENSE: a question card with zero choices renders the no-choices note (answer in the CLI / restart) instead of dead buttons - opencode's request_permission shape stays unverified (cline-only verified, documented)
- PERMANENT TEST: tests/test-mod-cli-agent-state.ts (repo tsx convention) - chip idle/live/pending-priority/newest-card-wins + heuristic wording matrix; wired as test:mod-cli-agent-state into package.json and the test aggregate; first run caught a wrong test expectation (bare toolCallId q-123 never claimed to match) - logic unchanged, test fixed
- DOC: mod-cli.md security-posture section (verified origin guard, dev-tool trust, child eviction), choice-card answer-retry + no-choices, dead-run note, honest remaining gaps (ModCLI.vue extraction planned pre-publish, heuristic wording limit, opencode shape unverified)
- REMAINING (too large this turn): ModCLI.vue monolith extraction into composables - the last big gap, documented in the UI-gaps section
- verified: npm run test:mod-cli-agent-state (all pass), npm run typecheck (3 configs clean), npm run lint:bem (35 pass), npm run lint:css (35 pass), npm run lint (exit 0); full npm test aggregate not run (all members untouched except the new one); browser rendering not verified (no dev server run)

### mod-cli Unauthorized diagnosis - 2026-09-12 10:30 UTC+7 (cline, model id n/a)
- user hit the documented Unauthorized failure live - instead of leaving it a raw error bubble, the bridge now diagnoses it in chat: on a prompt failure matching /authentication required|unauthorized/i a note names the requested vs applied auth provider and the exact fix (auth command per agent - "cline auth [provider]" / "opencode auth login" - runs use the CLI's own stored sign-in, or switch the auth/billing Provider in Settings)
- implemented at the bridge /run prompt catch (single point, zero-duplication; it knows the applied provider, the UI does not until a run_result that never comes on this failure)
- TS2304 fixed: `applied` was try-block-scoped, invisible to the sibling catch - hoisted `lastAppliedProvider` to the IIFE head, set after both applyRunConfig calls
- plan DROPPED after inspection: /config authProvider exposure + selector availability marking would require a read-only spawn per probe for sign-in state the CLI does not expose cheaply - the error-time note is the honest fix; the every-value-offered limitation stands documented
- what actually resolves the user's error stays the same: cline auth in a terminal / selector back to a signed-in provider / check the default preset's providerAccount
- verified: npm run typecheck (3 configs clean), npm run lint (exit 0), npm run test:mod-cli-agent-state (pass), npm run lint:bem (35 pass), npm run lint:css (35 pass); live run not re-triggered (would need an unauthenticated provider run) - the note path matches the same message shape captured in the 2026-09-11 live smoke

### mod-cli streamed text ragged fix - 2026-09-12 10:51 UTC+7 (cline, model id n/a)
- user screenshot: thinking text rendered one short line per streamed chunk (box wide, text wrapping at ~2 words) - root cause: appendItem joined every streamed chunk with a forced `\n`, but ACP sends agent_thought_chunk/message_chunk as arbitrary small splits of one continuous text, so each split became its own line
- fix: streamed chunks concatenate directly (`item.text + text`); real newlines arrive inside chunk text and are preserved; block separation stays via iteration_start/end resetting the active items (new item + flex gap, no gluing across blocks); content_end replace path unchanged
- verified: npm run typecheck (3 configs clean), npm run lint (exit 0 - first lint run returned an ambiguous shell-integration timeout, re-run confirmed clean), npm run test:mod-cli-agent-state (pass); visual confirmation is browser-side (user refreshes and streams continuous prose)
- note: the thinking/details max-width caps (92ch/110ch) were NOT the cause - the box was wide; only the forced per-chunk newlines were

### mod-cli disconnect + archive - 2026-09-12 11:14 UTC+7 (cline, model id n/a)
- user order: mod-cli is no longer wanted - disconnected from the host and moved to _archive/
- host wiring removed: vite.config.ts dropped from 1712 to ~270 lines (the whole clineBridgePlugin + cline helpers 256-1712; guard headers renamed to their blueprint names - BLUEPRINT_CLIENT/SAVE_HEADER(_VALUE) - since isSafeClientRequest is shared with the blueprint-data plugin and the literals are x-blueprint-*); modCliPlugin + clineBridgePlugin out of the plugins array; unused imports cleaned (spawn/execFile/ChildProcess/pathToFileURL)
- src/App.vue: ModCLI async mount + route detection removed (app now serves showcase or BlueprintEditor only)
- config: tsconfig.app include drops mod-cli globs, tsconfig.node drops modCliViteAdapter, package.json drops test:mod-cli-agent-state + its aggregate entry, eslint ignores gains _archive/** (archived code out of lint, matching the typecheck exclusion)
- move: git mv failed twice (OS handle lock on mod-cli files - stuck git processes killed, stale index.lock removed, VS Code watcher holds the dir); fallback robocopy /E /MOVE (Failed 0) + git add -A - git status shows clean R renames for every mod-cli file; tests/test-mod-cli-agent-state.ts -> _archive/test-mod-cli-agent-state.ts with its import fixed to ./mod-cli/src/agentState
- AGENTS.md: the mod-cli standalone rule now states it is archived at _archive/mod-cli/ (disconnected, excluded from typecheck/lint/tests, do not import)
- leftover grep: zero live references outside AGENTS.md note + harness/history.md log (src/, vite.config.ts, package.json, tsconfigs, eslint config all clean)
- not done (intentional): localStorage keys in past browsers (cline-chat-*) are inert leftovers, harmless; _archive remains git-tracked so the code stays recoverable
- verified: npm run typecheck (3 configs clean), npm run lint (exit 0), npm run lint:bem + lint:css (33 files pass, down from 35 with mod-cli out of the scan), test:arrival-latch sanity pass, node harness/scripts/verify.mjs check pass; dev server not run (bridge removal verified by typecheck + grep)

### dead asset cleanup (public/) - 2026-09-12 11:45 UTC+7 (cline, model id n/a)
- user order: delete dead files found by the import-graph audit - removed public/Continental-Idle-logo.png, public/favicon.svg, public/icons.svg (git rm, staged D)
- audit method (read-only, temp script deleted same session): BFS import graph from index.html + vite.config + vitest.config + scripts/ + tests/, resolving relative/@-alias//root paths with .ts/.vue/.css/index.ts extension tries + dynamic import() - all 96 src files reachable at runtime; only these 3 public assets had zero string/path references repo-wide (case-insensitive grep re-checked after deletion)
- favicon in use is /Continental-Idle-fav.png (index.html) - favicon.svg was a stale duplicate; no <use href="/icons.svg#"> consumer anywhere
- verified: repo-wide grep for all 3 basenames = 0 live references; node harness/scripts/verify.mjs check pass; no suite matches a pure asset deletion

### vendored pocock skills + read chain gate - 2026-09-12 12:20 UTC+7 (cline, model id n/a)
- user order: tier 1+2 skills from mattpocock/skills vendored into harness/skills/pocock/ (22 files, full upstream fidelity, zero edits): grill-with-docs, tdd (+tests.md +mocking.md), diagnosing-bugs (+hitl-loop.template.sh), improve-codebase-architecture (+HTML-REPORT.md), plus the 3 helpers their chain requires: grilling, domain-modeling (+CONTEXT-FORMAT.md +ADR-FORMAT.md), codebase-design (+DEEPENING.md +DESIGN-IT-TWICE.md); agents/openai.yaml metadata kept for Codex-compat
- chain wiring: AGENTS.md read chain gains step 5 (harness/skills/, gated); harness/HARNESS.md gains the Vendored skills gate - two doors only (user-invoked: grill-with-docs, improve-codebase-architecture; task-trigger: tdd, diagnosing-bugs, grilling, domain-modeling, codebase-design), Skill-tool name resolution to vendored files, repo mappings (CONTEXT.md = harness/context.md glossary, ADR = Decision Timeline per AGENTS.md Decisions - no docs/adr/, no second decisions file)
- non-vendored names documented as owned by existing harness parts: code-review -> loop Step 6; to-spec/to-tickets -> feature lane (zero-duplication)
- .clinerules pointer synced (read chain mention + gate reference)
- verified: node harness/scripts/verify.mjs check pass; 22/22 vendored files byte-match upstream (raw.githubusercontent.com main); no suite matches a docs/config change

### pocock skills converted to native - 2026-09-12 12:50 UTC+7 (cline, model id n/a)
- user order (goal: harness = one software engineer whose disposition comes from the skills and whose conduct follows the steps): converted skills/pocock/ -> native harness skills - moved 7 skill folders to harness/skills/<name>/ (source level removed)
- adaptation (13 files now): 7 SKILL.md rewritten in place - frontmatter gates + Skill-tool invocations removed (gate in harness.md owns invocation; user-invoked pair restated in-file), Skill-tool references -> read skills/<name>/SKILL.md, CONTEXT.md -> harness/context.md, ADR/docs/adr -> Decision Timeline per AGENTS.md (domain-modeling File structure section rewritten to the harness layout), sub-agent dispatch -> in-session sequential (grilling fact-finding, architecture walk, DESIGN-IT-TWICE parallel designs -> rotating sequential constraints), code-review ref -> loop Step 6
- removed: agents/openai.yaml x7 (Codex metadata), ADR-FORMAT.md + CONTEXT-FORMAT.md (mapped shapes own them); kept companions tests.md mocking.md hitl-loop.template.sh HTML-REPORT.md (ADR callout -> Decision Timeline callout) DEEPENING.md DESIGN-IT-TWICE.md
- license: mattpocock/skills is MIT (Copyright (c) 2026 Matt Pocock) - attribution kept via skills/NOTICE.md (full MIT text + adaptation list) and a per-file header line in every adapted SKILL.md
- persona wiring: new harness.md Persona section (dispositions from skills + step-hook table: Step 2/A-D -> grilling/codebase-design/domain-modeling, Step 4 -> tdd, Step 5 -> diagnosing-bugs, Step 6 owns review refactor); gate renamed "Skills (skills/)" - skills are ours, maintained like any repo file
- AGENTS.md read chain step 5 + HARNESS.md read chain item 7 reworded (no pocock source); .clinerules already points at the gate (no source name - unchanged)
- verified: leftover grep over skills/ = only mapped references + negations (no Skill tool / frontmatter / ADR / docs/adr / CONTEXT-MAP / openai.yaml); node harness/scripts/verify.mjs check pass; 13 files remain (7 SKILL + 5 companions + hitl script) + NOTICE.md

### portability audit + case-path fix - 2026-09-12 13:10 UTC+7 (cline, model id n/a)
- user question: is harness/ plug-and-play portable for any project - full audit of folder + verify.mjs + cross-file references
- FIXED (portability defect): 8 references to `harness/harness.md` (lowercase) across AGENTS.md x3, .clinerules x2, harness/history.md x2, .github/copilot-instructions.md x1 vs the actual file HARNESS.md - fine on Windows case-insensitive FS, 404s on Linux/macOS (case-sensitive); all normalized to harness/HARNESS.md via literal replace (first attempt no-op'd: PowerShell -ne is case-insensitive by default - redone with -cne)
- audit verdict (reported, not fixed): verify.mjs check/compact are generic (node-only) but route/run hardcode THIS repo's suite conventions (.vue->lint:bem/lint:css/typecheck, engine/domain/assets pick, schema regex, tests/*.ts -> tsx) - the AGENTS.md verify table is display-only, not the routing source, so a new project with different suites gets wrong routes; compact hardcodes UTC+7 offset + Asia/Bangkok monthKey (History pattern says adjust zone per project but the script cannot without edits); hitl-loop.template.sh needs bash on Windows (last-resort tool, acceptable); AGENTS.md/skill.md live outside the folder by design (adopt steps 2-4 cover, "copy + documented setup" not zero-touch)
- verified: Select-String -CaseSensitive = 0 lowercase refs left / 8 uppercase; git diff confirms 3 root files + history; node harness/scripts/verify.mjs check pass

### router-from-table - project suites out of harness - 2026-09-12 13:35 UTC+7 (cline, model id n/a)
- user order: separate the project's lint/suites out of harness/ (portability defect #1 from the audit) - verify.mjs no longer knows any suite name
- verify.mjs route/run rewritten table-driven: tableRows() parses the AGENTS.md verify markers - backticked globs in the Changed cell, backticked npm scripts in the Run cell; no-slash globs match basenames, slash globs match paths; a row with no concrete script = human-pick (router lists the project's test: scripts from package.json, never auto-runs - runPlan refuses on any pick match); hardcoded route branches deleted (.vue->lint:bem/lint:css/typecheck, engine/domain/assets pick, schema regex, tests/*.ts -> tsx, harness-scripts eslint special case)
- AGENTS.md verify table (project adapter zone) rewritten machine-parseable: 7 rows - Template/markup `*.vue` (lint:bem+lint:css+typecheck), CSS `src/**/*.css`, Harness scripts `harness/scripts/*.mjs` (lint), Config TS `vite.config.ts`+`vitest.config.ts` (typecheck), Repo tests `tests/*.ts` (pick), Engine/domain TS (pick), Schema/persistence/sync (pick) - prior behavior preserved (incl. the old tests/* tsx suggestion now as a pick row)
- HARNESS.md Verify routing + Adopt step 2 document the row format; the harness now ships zero suite names - a new project only fills its own table
- globRegex bug caught by temp test on first run: multi-pass replace re-scanned inserted tokens (trailing `**` and `*schema*` false) - fixed with single-pass alternation callback; case-sensitivity of globs confirmed intentional (matches repo file naming)
- verified: temp router test 25/25 PASS then deleted same session; live `verify.mjs route` on the dirty tree routes exactly lint:bem+lint:css+typecheck+lint (no picks - correct for this tree); all 4 suites green (lint:bem 33 pass, lint:css 33 pass, eslint exit 0, typecheck 3 configs exit 0); check pass

### zone-from-stamp in compact - portability defect #2 closed - 2026-09-12 13:50 UTC+7 (cline, model id n/a)
- user order: fix per the audit list (item 1 router-from-table landed prior turn) - item 2: compact no longer hardcodes UTC+7/Asia/Bangkok
- verify.mjs: parseZone reads the UTC offset from each stamp itself (UTC+7 / UTC-05:30 / bare UTC, bogus falls back 0); header regex accepts any `UTC±H[:MM]`; parseStampDate subtracts the parsed zone; monthKey is pure arithmetic on epoch+zone (Intl/timezone dependency deleted - no machine-zone leakage, archive month follows the stamp zone)
- item 3 (minor, documented not fixed): diagnosing-bugs HITL bullet gains the Windows note (bash required - Git Bash/WSL); HARNESS.md History pattern now states any `UTC±H[:MM]` stamp works and one zone per project stays consistent
- portability verdict: all 3 audit defects closed - harness/ ships zero project suites (router reads the AGENTS.md table) and zero hardcoded zones (compact reads the stamp); hitl bash remains the one accepted minor with its note
- verified: temp zone test 14/14 PASS (zone parse incl. half-hour + negative offsets, epoch equality across zones, monthKey month-boundary flip, header regex variants) then deleted same session; live `compact --dry-run` parses every UTC+7 stamp in history (71 would archive to history-2026-09.md, 22 kept, 2 undated kept by design); check pass

### gpt-6 astra prompt audit fixes - 2026-09-14 20:28 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- user order: apply all improvements from the GPT-6 Astra article audit (options 1+2)
- AGENTS.md scope gate now covers unrequested scope growth past 3 files; a requested change spanning over 3 files is pre-authorized (article: decision boundaries vs tentative stopping)
- skill.md Layout Rule 1 + compliance check: approval gate kept for new shared classes/components/tokens; scoped delta-only modifiers and UI labels need only a report note
- verified: route (own change is md-only lines, nothing runnable; lint:bem/lint:css/typecheck/lint rows belong to prior-task dirt, left untouched per no-revert rule); check pass

### gpt-6 astra audit round 2 - 2026-09-14 20:32 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- user order: apply all 4 remaining options from the deep audit
- HARNESS.md:65/:153 scope gates mirrored to the clarified wording (unrequested growth past 3 files; requested multi-file work pre-authorized, see AGENTS.md); :118 autopilot wording aligned - closes the duplication the deep audit caught
- skill.md:211/:213 micro-gates softened (deliberate layer override / button padding need no pre-approval, noted in report); Data audit "Do not skip steps" becomes follow-in-order with stated-reason skips
- AGENTS.md gains safe-iteration permission line (run routed suite, fix, rerun without per-step approval - the article's fixture example)
- verified: route (own change is md-only lines, nothing runnable; routed suites belong to prior-task dirt, untouched); check pass

### harness standalone audit - domain refs + case-path fix round 2 - 2026-09-14 21:10 UTC+7 (cline, model id n/a)
- user order: harness/ is standalone and must not refer to the domain project - full audit (domain words, suite names, zones, case-broken refs across all md/mjs/sh)
- 6 live lowercase `harness.md` refs normalized to `harness/HARNESS.md` (verify.mjs comment, grill-with-docs + improve-codebase-architecture + tdd SKILL.md, NOTICE.md, context.md) - the earlier portability fix missed the skills converted later; 5 refs inside dated history records left untouched (a log record of a past task must not be rewritten)
- audit verdict: scripts + skills + HARNESS.md are domain-free (verify.mjs fully table-driven, adopt.mjs names only the by-design adapter files AGENTS.md/skill.md that live outside the folder); the only domain-project words left are context.md glossary + history.md entries - project-owned runtime state that adopt.mjs resets on adoption by design
- verified: case-sensitive grep = 0 live refs outside history records, npm run lint exit 0, node harness/scripts/verify.mjs check pass

### decision: domain words in harness state stay as-is - 2026-09-14 22:18 UTC+7 (cline, model id n/a)
- Decision Timeline entry (Problem / Final solution / Trade-off / Revisit trigger) - Problem: the harness-standalone directive left domain-project words only in context.md glossary + history.md entries; do they break portability?
- Final solution: keep as-is - both files are project-owned runtime state, not harness logic; adopt.mjs resets them on adoption (glossary -> empty shape, history -> preamble, history-*.md dropped), so portability is guaranteed by the adoption path rather than by scrubbing live state
- Trade-off: a raw copy of harness/ carries this project's words until adopted (cosmetic, zero logic impact) - accepted over rewriting a log/glossary whose content exists only for this project (rewriting dated history records would falsify them)
- Revisit trigger: adopt.mjs stops resetting context.md/history.md, or domain words leak into harness scripts/skills/HARNESS.md

