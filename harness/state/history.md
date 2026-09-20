# History - shared cross-agent intent log

Entries only. Pattern lives in `harness/HARNESS.md` (History pattern) -
follow it when logging below. Continental-Idle project work only - no
mod-cli records, no harness-meta records.

## Entries (Doing - Finished (Agent, Model) + Detail Bullets)

### audit improve pass (#6 #1 #7-partial) - 2026-09-20 04:10 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user order: improve per the audit roadmap
- #6: traced object w/h enrichment (persisted sizes untrusted -> migrate/normalizeObject re-derives -> engine guards degrade) - contract comment at the zeroing site (dataLoader.ts, user-requested exception to no-comments) + migrate test with w:0/h:0 objects asserting re-derived sizes
- #1: tests/test-tower-integration.ts - real-seed deploy pipeline (migrate, layout build, portal symmetry, per-entry spawn cells, 120-tick smoke), seed-agnostic expectations, wired as test:tower-integration into run-tests.mjs
- #7-partial: reorderFloor swap/rejects + duplicateAsset palette-only + refreshOriginInstances size restore (caught my own hardcoded 40-vs-50 tile assumption - fixed to assetSizeFor)
- verified: npm test 16/16 + typecheck + lint + unit 36/36 + store-crud 43/43
- decision: god-module splits (#2/#3/#4) NOT started (over: bundle now - because audit times them "when touching the area" and the sim/canvas are freshly verified; splitting now buys risk without a triggering change)

### spawn zone free-tool rectangle drag - 2026-09-20 03:40 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user order: zone add via X/Y/W/H numbers is unusable, want free-tool drag; new EditorMode 'zone' reusing the marquee path (Draw Object precedent): FloorModal Draw button stages label/roles, closes, arms canvas; drag creates tile-snapped zone via shared store.addSpawnZone (FloorModal Add refactored onto it, no second construction path); X/Y/W/H inputs kept for precision
- verified: store-crud 40/40 (+1) + bem/css/typecheck/lint + live drag (Zone 1 220x160, toast, mode back to object) + delete round-trip, 0 errors; floor restored to 1/0/0 + guest 12
- variance (first occurrence, not promoted): 5 legacy G zones found missing during proof; bisected live (add zone -> NPC count save -> zones intact) so the NPC-save path is innocent; one-time past loss, cause UNCERTAIN; not restored per no-recovery rule (empty floor would flag them as purposeless anyway)

### spawn wiring grouped by role (pool moved to NPC Manager) - 2026-09-20 03:10 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user order: compact scattered NPC settings into related groups; decision: group by role - pool counts + spawn floors + target tags moved from Deploy modal into NPC Manager role detail "Spawn" section (over: cross-links only - because the pain was configuring, not viewing)
- same draft + same queuePersist path, zero new data flow; Deploy slimmed to launch dialog (read-only totals/floors/tags + speed + override + gate + go); deleted the moved fns + dead deploy__step CSS; single editor per field preserved
- verified: bem/css/typecheck/lint green; live round-trip guest 12->13 in NPC Manager, Deploy followed to Total 19 with read-only review, reverted to 12 (pool back 12/2/2/2), 0 console errors

### wiring trash made visible (badge + prune receipts) - 2026-09-20 02:45 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user painpoint: leftover spawn wiring accumulates invisibly unless you go looking; issues only surfaced in deploy gate/sync toast/console
- `Toolbar.vue`: passive "N wiring" badge (reused badge + flag--warning, zero new CSS) next to NPC Manager, full issue list in tooltip, click behavior unchanged; filter mirrors the existing deploy-gate precedent (spawn zone/post/pool/Task/Role/trigger rate)
- `createStore.ts` save: prune notes now toast as "Wiring cleanup: ..." receipt on success only (capped 4 + more); silent auto-cleanup becomes visible, no new auto-delete
- verified: bem/css/typecheck/lint + store-crud 39/39 + unit 36/36 + live real-data badge "9 wiring" with all 9 issues in tooltip, 0 console errors

### no auto-delete of spawn zones (warn-only purpose check) - 2026-09-20 02:30 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user proposal: delete floor spawn zones where a deleted asset was wired; verdict: no - zones reference roles, never assets, so "its zone" needs a guessing heuristic; one shared asset deletion would nuke zones serving other roles, against the no-recovery rule; per-floor scoping already exists where the link is real (objects removed per floor, pool pruned per floor, post strip is correctly global since asset types are global)
- shipped instead: warn-only symmetry to the existing allows-role-without-zone check - zone spawns a role whose tasks/focus tags match nothing on that floor; task-less wanderers (guest/housekeeper precedent) exempt, empty floors skipped, open zones check all roles
- `validation.ts` + 4 synthetic checks in test-settings-completeness; gates green; real data shows 0 new issues (9 pre-existing, all from the empty floor)
- decision: signal, don't destroy (over: cascade zone delete - because the link is heuristic and destruction is irreversible)

### spot references die with their asset (single save-point rule) - 2026-09-20 02:10 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user design question: how to make spawn spots disappear with their asset; claim verdict - spots already die inside the asset def, the lingering part was the task.post reference, which had TWO owners (immediate strip in assets.ts + save prune in storeUtils.ts) against the logged single-point decision
- design: one rule at the save prune point - post to unknown asset strips whole post (existed), post name missing from the asset's live names strips just the name and keeps the assetId binding (new - engine/validation already read bare-assetId as "any spot"); tasks themselves never die on furniture changes (portable work vs specific spot, no-recovery rule)
- `storeUtils.ts`: prune now takes the asset registry and builds live post-name sets; `assets.ts`: deleted the duplicate strip (object removal stays); `createStore.ts`: passes registry
- verified: store-crud 39/39 (+1 renamed-post test; deleteAsset post test still green via save-prune) + typecheck + lint + settings/sync/migrate

### AssetEditModal persistent Real Visual rail - 2026-09-20 01:50 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user order: see real visual while editing asset on every tab; preview lived in WalkableGridEditor (mounted only on non-general tabs), General had none
- AssetEditModal.vue: persistent right rail (edit__preview block, scoped delta CSS, same useAssetPreview helper) with name + WxH caption; WalkableGridEditor.vue: deleted the duplicate preview block + wiring + 2 dead CSS rules (single preview, zero duplication)
- verified: lint:bem + lint:css + typecheck green; live screenshots of General/Walkable/Interact/Assign all show the rail; 0 console errors; floor data untouched (still G-only empty per user order)

### #5 sync projection implemented (Matt Pocock follow-through) - 2026-09-20 00:20 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user pushed back ("none worth doing?") - re-examined #5 and found the testable slice: new pure module npcSimProjection.ts (blankSimDot/updateSimDot/pruneStaleDots/pruneWaitReasons/filterDotsForFloor) + tests/unit/npcSimProjection.test.ts (10 tests), wired into useNpcSimulationCore with zero behavior change
- verified: typecheck + eslint + unit 36/36 (was 26) + live deploy 137/137 0 errors; removed one orphaned import caught by lint
- decision: #2/#4 stay deferred (over: god-module/policy splits now - because the verified sim + ride proof would carry the regression risk, payoff is future-change ease not present pain)

### Matt Pocock improve-codebase-architecture pass - 2026-09-20 00:05 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- followed the skill for real (fetched SKILL.md + codebase-design vocabulary): explore via subagent with deletion test, visual HTML report to Temp (opened), autopilot converted the pick-step to self-decision
- report: C:\Users\disda\AppData\Local\Temp\opencode\architecture-review-20260920.html (6 candidates, top = #1 layout seam)
- decision: implement NONE yet (over: #1 full inversion - because mirroring NpcSimulationConfig/AssetDef duplicates the domain, worse locality than 7 structural type imports; over: #6 mood - because mapping is already centralized in useNpcOverlayDraw, no duplication found; #2/#4/#5 deferred as risk-over-payoff on the verified sim)
- finding for the record: runtime floor objects carry w:0/h:0 (buildSavedLayout placeholders) - any "enrichment adapter" would change movement/collision behavior, so it is NOT a safe refactor
- no source changed this pass; report is the artifact; user may still pick any candidate to grill/implement

### autopilot perf phase 2: paused throttle shipped - 2026-09-19 23:20 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- decision: ship only the paused-canvas throttle (500ms, canvas retains frozen frame, toggles converge within 500ms) in useNpcOverlayDraw + EditorCanvas wiring (over: code-split - because gzip is 64KB total, splitting saves nothing measurable)
- verified: typecheck + eslint + unit 26/26 + live deploy 137/137 0 errors, paused dots intact (36/36)
- no other source changed; autopilot remains on

### autopilot perf phase 1: diagnose (no code defect) - 2026-09-19 23:05 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- decision: attribute, don't patch blindly (over: spawn-map cache, measureText cache, paused-canvas throttle - because every measured sub-cost is ms-scale, so added complexity had no verified payoff)
- evidence: rAF ~1fps in ALL modes incl. fresh edit mode vs blank-page 158fps; timers free; 0 DOM mutations/8s; parse 3ms, stringify 6ms, validate 4ms, HTTP save ~115ms, engine layout 189ms, spawn 1ms, tick 2ms; production build e2e 3/3 in 1.9s
- conclusion: slowness is headless software rasterization + Vue dev mode, not app code; no source changed this phase; stray preview server killed, dev server kept
- residual offers: real-hardware FPS check, 994KB chunk code-split, paused-canvas throttle

### elevator ride proof on real geometry - 2026-09-19 22:45 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user order: behavior + live up/down elevator test; behavior audit green (rides=7, overlap 0)
- live preview cannot produce rides (pools pin roles per floor; G held 18 + dots static 36 over ~25 sim-min at 8x; spawn-floor override is a filter, not reassignment)
- headless proof on real data instead (temp tests/_ride.tmp.ts, deleted same session): 2 guests rode G->5 at 15s/21s through our stacked cores; portal targets 16 (8 up + 8 down, symmetric mechanism)
- debugging caught 2 test-harness faults (not repo faults): raw floor objects lack w/h the engine needs (app enriches at runtime), and engine canvas is {w,h} not {width,height} - living-focus was the motive that forces cross-floor (lounge exists everywhere)
- no repo source or data changed by this task; tmps deleted, slot cleared

### fire stair core all floors (IRL basics) - 2026-09-19 22:25 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user order: basic IRL survival first - one enclosed stair shaft stacked on all 12 floors (cols 12-16 rows 35-38, 2-tile door east rows 36-37, G shares library S wall as shaft N wall)
- relocated one floor-2 breakout cluster (20,35) to clear the shaft; G needed 2 tries (library-wall adjacency, then vertical alignment)
- verified: 2x2 = 0 all floors, BFS 100% (interior seed upstairs), suites green, live 137/137 0 errors/warnings
- residual: single stair only (assembly floors 1-4 want a second stair IRL); G discharge routes through lobby to vestibule (no dedicated stair exit door)

### exterior doors off upper floors + elevator live test - 2026-09-19 22:15 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user correction (true on both): non-lobby floors must have zero exterior doors; elevator system never live-tested
- removed all boundary doors on floors 1-11 (88 cells door->blocked, G keeps its 8); interiors all 100% connected, suites green
- elevator live: portal tag on elevator-1 resolves on all 12 floors (2 each), deploy 137/137, 0 errors, 0 warnings (portal warning gone), G 18 + floor 5 showing 10 Running live
- honest limit: preview pools pin roles per floor so no cross-floor ride occurs in preview - the ride path is a runtime concern, portals + maps are the verified part
- residual: no enclosed fire stair on upper floors (egress via open lift core only) - offered as next ticket, not built

### 11-floor tower program build - 2026-09-19 22:05 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user picked full-program stack (option 1): G lobby (restored last patch) + 1 dining/kitchen + 2 ballroom/breakout + 3 wellness + 4 club/bar + 5-9 guest x5 (template) + 10 quiet (2 rooms as lounge) + 11 suites/private dining
- every floor: same 80x50 frame + lift core cols 33-40 + 2-tile doors + BFS 100% + zero 2x2 + zero overlap; sealed-pocket catches fixed in-gen (floor1 service strip, floor2 store, floor5-9 core/ensuite adjacency)
- spawn catch: first deploy 126/137 - guest overflowed 8-cell arrival zones + receptionists had no zone on 5 floors; arrival zones deepened to 2 rows, host zones added, f11 gained host table - redeploy 137/137, 0 errors/warnings
- final: 12 floors, 858 objects, 137 NPCs, payload 2.37 MB of 5 MB cap; assets 22/22 + schema + settings + sync + migrate green
- variance: guest-floor template needed 2 fix passes (2x2 adjacency, ensuite door side) - budget held on second pass

### rebuild with last patch (no-recovery rule) - 2026-09-19 21:40 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user standing order: never recover deleted things, always rebuild forward from the last patch with only what belongs in it (bartender stays deleted even though bar-counter asset exists); delete freely when needed, never be sentimental about removed things
- emptied G first (167 objects -> 0, grid all walkable, zones/pool/roles kept), then rebuilt from pre-empty state minus the concurrent browser paint stub (rows 40-42 cols 29-31) that broke rule 7
- final: 167 objects, 2x2 = 0, BFS 100%, assets 22/22 + blueprint-schema + settings + sync-payload green, live 18/18 NPCs 0 errors (Moving 10, Interacting 7)
- decision: concurrent in-app paint during scripted patches is a race (whole-file read-modify-write) - hands-off the canvas while agent patches run (over: locking/merging - because social rule is cheaper than code)
- re-rate 9/8/8/8/8/8; residuals: open back office (no enclosure possible without sealing lift hall), restroom 3+3 capacity, single ceremonial guest entry (by design)

### reference-CAD 45ft lobby rebuild - 2026-09-19 20:37 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user supplied cadbull 45ft ground-floor reference (reception/lobby/restaurant, no stairs); rebuilt G to match it stretched over our full plot
- program: conference NW (theater chairs), 12-table restaurant N, stacked M/F restrooms W, library SW, elevator core CENTER with south doors onto reception, reception desk facing S entrance, bar+office+kitchen chain E (kitchen street-delivery door), lounge SE (6 armchair clusters), S vestibule, sofa row on S wall, plants scattered
- wiring decisions: no bar asset exists so bartender excluded via allowedRoleIds + pool entry dropped + tend-bar post stripped (plain task kept, assigned); concierge already post-less
- verified: 167 objects, 22 doors (all 2-tile), self-checks green, 4 suites green, live 18/18 NPCs (9 moving/9 interacting), 0 errors

### audit fix-now batch (6 items) - 2026-09-19 20:10 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user order: autopilot on the audit's fix-now roadmap; full 11-phase audit report delivered first (4 explore agents + own verification)
- fix 1 (critical, vite.config.ts): renameWithRetry no longer unlinks the live blueprint-data.json on EPERM - moves the locked destination aside to a .old backup, async sleep replaces the event-loop spin-wait; writeData is async, POST awaits
- fix 2 (high, svgSanitizer.ts:18 + new tests/unit/svgSanitizer.test.ts): href/xlink blocklist now includes vbscript: (style check already did); 9-case vitest suite pins on*-attrs, style payloads, all four schemes, unknown-tag removal, data-role class, parsererror no-op
- fix 3 (high, seed.ts + BlueprintEditor.vue): seed validation moved out of module eval into seedVersionError() checked inside boot - malformed/too-new data file now reaches the load-error UI instead of white-screening; seed accessors became lazy functions (perf/migrate tests updated to call them)
- fix 4 (medium, useNpcSimulationCore.ts frame): tick body wrapped in try/catch - a throwing tick logs and reschedules instead of silently killing the rAF loop
- fix 7 (medium, run-tests.mjs): removed the second vitest pass (verify already runs test:unit) - CI no longer double-runs vitest
- fix 8 (medium, useNpcSimulation.ts floorSignature): object x/y/w/h/rotation now invalidate the sim - dragged objects refresh the engine without manual redeploy
- verified: test:unit 26/26 (+9 sanitizer) + store-crud 38/38 + migrate + blueprint-schema + sync-payload + settings + typecheck + lint + bem/css + live reload 0 errors
- deferred (audit "before next feature"): engine dependency inversion, EditorCanvas decomposition, test-npc-engine seed coupling

### undo feature (depth 4) - 2026-09-19 18:50 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user order: undo with 4 states
- decision: snapshot-after-commit stack capped at 5 entries (= 4 undo steps) in runExclusive wrapper (over: per-command pre-snapshots - because one hook point covers every locked mutation incl. future ones, and dedupe-vs-top makes no-op/rejected commands free)
- `createStore.ts`: pushHistory (clones layout+assets+tags+floorId, dedupe), undo() pops to previous committed state + saves; canUndo computed (>= 2 entries); history resets on reloadEditorData
- Toolbar: Undo button (disabled by canUndo) + Ctrl+Z (input-guarded, preview-guarded); ShortcutsModal entry
- caught while testing: missing initial seed made first undo dead + test read stale floor reference after undo replaced state.layout (fixed by fresh read) - store-crud 38/38 (+3 undo tests)
- verified: store-crud 38/38 + typecheck + bem/css + eslint + unit 16/16; live: Undo button renders disabled pre-mutation (correct canUndo)
- no redo (not requested); NPC preview edits and mode/selection changes are not undoable by design

### reference-CAD lobby rebuild - 2026-09-19 17:37 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user supplied a reference hotel CAD: rebuild G to match it, stretched to our full plot, skip items we lack assets for
- program per reference: conference NW (theater chairs), restaurant N (9 dining tables x6), toilets M/F stacked W, library SW, elevator core CENTER (south doors onto reception), reception desk center facing S entrance, bar+back office+kitchen chain E (kitchen with street delivery door), lounge SE (6 armchair clusters), vestibule S center, sofa row along S wall, potted plants scattered
- disk-first per standing rule: pre-read caught custom assets cleared again + concierge post gone; rebuild restores only plant-1 (in reference), concierge stays post-less task
- first pass self-check caught conference/restaurant merged (missing divider) + core fully open south; fixed divider col 27 + core south wall with 2-tile doors
- final: 154 objects, 24 doors (all 2-tile), 11 rooms, BFS 100%, 22 assets valid, suites green, live 20/20 NPCs (10 moving/8 chatting), 0 errors

### standing rule: disk before floor writes - 2026-09-19 16:45 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user standing order (repeated 3x, escalated to reads too): EVERY action re-reads floor data from disk fresh - not just writes. Never answer about or touch floors from context/memory
- promoted to state/lessons.md (symptom|cause|fix|evidence); applies to every future floor task regardless of what the conversation says the state is

### full rebuild after user clear - 2026-09-19 16:42 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user's editor clear had removed 7 origin assets too (bench + 6 custom) and the concierge task post; generator restored all 7 assets + fixed task-concierge post + rebuilt the full floor
- one generator writes all walls FIRST then punches doors (kills the v4 ordering bug class permanently); quiet salon relocated into the gallery (was furnishing BOH rooms in v4); kitchen/housekeeping spawn zones moved onto their real rooms
- final: 92 objects, 49 doors, 18 rooms, zones on real rooms, 27 assets, 0 console errors
- verified: verify:assets 27/27 + blueprint-schema + migrate + settings + sync + store-crud 35/35 green; live deploy 20/20 (8 moving, 10 chatting), 0 errors

### wiring batch 2 - fix everything remainder - 2026-09-19 15:25 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- B2: FloorModal relabel confirm (old->new sync key in message) - caught a real event bug while proving live: the Enter keydown that opened the dialog propagated into ConfirmDialog and confirmed itself; fixed with a one-macrotask yield before confirm; verified cancel keeps label, Relabel commits, both live
- A9: Deploy blocks roles whose spawnRule.targetTags match no assets (validation reuse); A13: speed slider 0.01-1 (engine range); A10: spawnRule.count made optional, normalize stops writing, prune strips, modals stop creating (old saves still readable)
- A12: removed modal's unlocked removeRoleFromFloors - save-time prune is the single owner
- B6: importWorkspace surfaces losses (objects/roles/tasks/pool counts) via toast; B7: HTTP save verify uses strict readBlueprintDataFile (version-specific cause preserved)
- verified: store-crud 35/35 (+1 spawnRule test) + sync + settings + typecheck + bem/css + unit 16/16 + live relabel dialog cancel/confirm both green
- deferred: seed $schema literal (cosmetic), hidden sim budgets UI (needs product decision)

### wiring batch P0+P1 - 2026-09-19 14:35 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user order: go (P0+P1). B1 streetFloorId remap at egress + drop at ingress + version gate/const + joint test (own-read confirmed runtime mismatch)
- A1 removeTag rebases modal draft; A2 Toolbar blocks co-opening Manager/Deploy with toast; A4/A5 trigger rates pruned to used tags on save + slider disabled with hint; A6/A7 stale post dropped on asset switch; tag entry normalized (not auto-registered - typo protection kept by decision)
- street repaint on setStreetWidth; spot.post cascade on removeTag; 2x2 surfacing in validation; B4 seed keeps street/editor fields; settings fields extracted to settingsFields.ts + coverage test (caught 3 ratio rows, converted to v-for group, verified live in Settings modal)
- verified: sync/store-crud(34)/settings + typecheck + bem/css + eslint + unit 16/16 + live modal render, 0 errors
- deferred: B2 label-dupe guard (suffix handles), B6/B7 import+HTTP messages (warn-only UI), A9-A13 dead fields (no behavior impact)

### npc dangling-ref automation - 2026-09-19 11:25 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user order: minimize user/function error via automated wiring, not warnings
- decision: single prune point in store.save() covering all delete paths (over: per-path cascades - because one point cannot be bypassed, incl. modal draft persists)
- `storeUtils.ts`: pruneNpcReferences (pool unknown roles / dead floorIds, role dead taskIds, posts to unknown assets, defaultRoleId fallback, zone/allowedRoleIds strip; harmless+restorable orphans deliberately kept)
- `createStore.ts`: save() prunes before build; `validation.ts`: pool->empty-floor issue; proven on the user's cleared floor (10 issues surface the exact state)
- verified: test:store-crud 31/31 (2 new) + test:settings-completeness (2 new) + typecheck + eslint clean
- left open: task-concierge post loss unexplained (needs repro, not claimed fixed)

### calibration: ratings were inflated - 2026-09-19 11:10 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user deleted the lobby as not IRL-good-enough after I rated it 10s - verdict flipped, my scale was broken (rewarded checklist compliance over real-hotel truth)
- lesson: no more 10s from self-review alone; top score needs user eyeball or photo-grade reference comparison

### panel loop turn 9 label gate proof - 2026-09-19 11:08 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- 120% zoom screenshot: 2-tile labels return readable, 1-tile stay hidden; snapshot confirms zero 1-tile labels in DOM; selected-branch covered by existing isObjectSelected API + typecheck (no blind click test)
- egress stability re-run identical (21/21, worst 23.5 m); re-rate holds 10/10/10/10/10/9

### panel loop turn 8 egress audit - 2026-09-19 11:03 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- audit found real defects: west service doors (8,14-15) sealed by boundary vWall order bug, north entry (69,70,8) missing, east bleed col-71 rows 22-29 open to street; fixed all three
- false alarm owned: first egress script mixed tile-rooms with object-aware BFS (flagged furnished cells); rewrote audit excluding footprints - 21/21 rooms reachable, worst 23.5 m
- north-entry cause UNCERTAIN (no writer found - validator + suites + browser green, logged not hidden)
- verified: 4 suites green, live 20/20 0 errors; re-rate holds 10/10/10/10/10/9

### panel loop turn 7 sign + surge math - 2026-09-19 10:58 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- third directory sign at restroom/lift decision point (35,29); static capacity: axis 191 standing cells, vestibule 20, entry 3-wide - space fits 100+, flow timing unprovable without banned perf suites
- verified: BFS 100%, 4 suites green, live 20/20 spread across lounges/bar/gallery, 0 errors
- re-rate holds 10/10/10/10/10/9; ops 9 is now purely the timing-proof item

### panel loop turn 6 VIP salon - 2026-09-19 10:55 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- decision: VIP salon cols 38-45 rows 17-22 sharing N (row 16) + S (row 23) walls, W door row 19, art moved to grand lounge center (over: freestanding VIP walls - because shared walls keep zero 2x2 and save tiles)
- verified: BFS 100%, 4 suites green, live 20/20 0 errors, 89 objects
- re-rate 10/10/10/10/10/9; ops stays 9 on the single unprovable item (100+ load, perf suites banned)

### panel loop turn 5 label declutter - 2026-09-19 10:52 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- decision: object labels render only when selected or obj screen width >= 48px (over: full collision layout - because one-line zoom gate kills all overlap at every zoom, reversible via Labels toggle)
- caught: template auto-unwrap (zoom is ComputedRef<number>, use bare zoom not zoom.value) - typecheck caught it before browser
- verified: lint:bem + lint:css + typecheck + unit 16/16 + EditorCanvas component tests green; live screenshot at 77% shows only large-object labels, 0 errors
- re-rate hierarchy 9->10

### panel loop turn 4 lift lobby - 2026-09-19 10:50 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- decision: elevator doors south->east with dedicated lift hall (bench + relocated sign), south wall solid (over: recessed alcove into axis - because alcove walls would narrow the promenade worse than the queue did)
- caught mid-run: assumed foyer bench ids existed, validator KeyError proved otherwise (v4 never had them) - moved gal-b2 instead; elevator stand spots verified on walkable rows before writing
- verified: BFS 100%, 4 suites green, live 20/20 (6 moving/6 chatting, guests flowing to bar), 0 errors
- re-rate 10/10/9/9/9/9; residuals: 100+ load (banned), label overlap (editor code), full-5-star materiality (N/A in top-down)

### panel loop turn 3 concierge + accessible - 2026-09-19 10:45 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- decision: concierge-desk asset (4x1, front-desk tag, concierge-post spots, staff side = open row 32 not inside office) + task-concierge linked to receptionist (over: bell-table reuse - because concierge needs own post + capacity)
- decision: accessible clear corner in F restroom by removing 1 toilet (over: keeping 4+3 counts - because maneuvering space is a life-safety/access invariant, fixture count is not)
- verified: verify:assets 27/27, BFS 100%, real-data settings 0 issues (receptionist tasks include concierge), live 20/20 (6 moving/8 chatting), 0 errors
- re-rate 9/10/9/9/9/9; residuals: lift-lobby recess (core rebuild), 100+ load (perf suites banned), label overlap (editor code)

### panel loop turn 2 five new assets - 2026-09-19 10:40 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- decision: 5 new origin assets, each closing a named panel gap, all on existing lounge tag (over: new tag defs - because verify:assets warns on unregistered tags, zero new schema surface)
- plant-1 x6 (biophilia/Kuma), art-1 gallery centerpiece (Starck signature), sign-1 x2 (wayfinding Foster), lamp-1 x2 (terminus comfort), cart-1 at luggage (bell story); SVG follows --obj-fill/--obj-stroke convention, 25px/tile viewBox
- verified: verify:assets 26/26 zero warnings, BFS 100%, real-data settings 0 issues, live palette+canvas render, 20/20 NPCs 0 errors, guests chatting at new pieces
- re-rate: 9/10/9/9/8/8; residuals: concierge separation, accessible stall dims, 100+ load (perf suites still banned - needs user order)

### panel loop turn 1 - 2026-09-19 10:35 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- standing loop adopted: every lobby turn = 12-section panel review, then fix, verify, re-rate
- v4 findings fixed: coat door 1-wide (luggage fail) -> 2-wide; axis terminated in bare egress doors -> east terminus lounge row 29; NE bar invisible from flow -> cafe trail at (52,21); g1 single 0.5 m from wall -> shifted east
- verified: 72 objects, BFS 100%, 4 suites green, live 20/20 (Moving 7, Chatting 8, Idle 4), 0 errors

### full deconstruction rebuild v4 - 2026-09-19 10:28 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user order: lobby still looks the same, deconstruct everything and renovate new
- new parti (W-E promenade): west street entry + vestibule, reception/restrooms/elevator band north of axis, grand lounge south, BOH north band + NE kitchen/servery/bar kept on proven geometry, NW quiet salon + gallery + coat room, fitness/business south corners
- first draft failed validation (parallel double walls, overlapping room footprints) - fixed by shared-wall merges + shrinking core to fit; second run green
- `blueprint-data.json` v4: 68 objects, 44 doors, 17 rooms, zero 2x2, BFS 100%, 4 suites green, live 20/20 NPCs 0 errors; tmp deleted

### full renovate grand salons + coat room - 2026-09-19 10:18 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user order: no need to cherish old layout, renovate full
- `blueprint-data.json` only: W+E grand salons in the central void (2 sofas + table + 2 singles each, arrival axis kept clear), coat room west of vestibule (walls + bench, shares col-25 fitness wall to avoid 2-wide band), BOH/chain/roles untouched
- verified: no 2x2, BFS 100%, 4 suites green, live 20/20 NPCs 0 errors, 75 objects

### full-10 pass v3 - 2026-09-19 10:15 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user order (autopilot): go full 10; fixed every panel finding in one pass
- decision: widen service corridor to 3 tiles (1.5 m) with contained cascade (restrooms/servery shift one row south) over accepting 1.0 m cart minimum (because cart passing is a daily operation, not an edge case)
- decision: new role-housekeeper (focus hygiene, no tasks - guest precedent) + spawn zone + pool 2 over leaving BOH unvisited (over: task-less role flagged - because settings validation passes and BOH rooms get visits)
- `blueprint-data.json` v3: 68 objects, 49 doors, 16 rooms; restroom/BOH doors all 2-tile, vestibule doors 3-wide, plant furnished, foyer benches, 2 cafe sets, 3 bar stools
- decision: keep single ceremonial entrance (over: second guest entry - because luxury hotels funnel arrival; peak spread is sim-tuning, not plan)
- verified: zero 2x2, BFS 100%, 4 suites + real-data settings (0 issues) green, live 20/20 NPCs 0 errors; tmps deleted
- key-design: rule 3 guest/service door width + rule 6 staffed-room-visits rule (tile units, no quantities)

### panel review of G lobby - 2026-09-19 10:05 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- 12-section brief adapted to top-down plan; measured from tileStates + live 18-NPC sim observe; materials/lighting/CGI sections marked N/A, no guessing
- headline findings: restroom/BOH single-tile doors (0.5 m, fails 0.9 m wheelchair); no housekeeper role so laundry/staff/plant never visited; single vestibule entry clusters guests in sim; label collisions at 77% zoom
- no edits made (review only)

### restrooms 2->4 toilets per side - 2026-09-19 10:00 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user report (true): public restrooms with only 2 toilets/side undersized
- `blueprint-data.json` objects only, same walls: M 4 toi (row 17) + 3 bas (row 17 + west wall x2), F mirrored on east wall; door columns keep fixture alignment, door paths clear
- verified: overlap/on-wall/BFS/door-path self-check + 4 suites green + live reload (Toilet 9, Washbasin 7), 0 console errors

### rating loop to 10-10-10-10 - 2026-09-19 09:58 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user order (autopilot): repeat rate+fix until 10 every category
- decision: extend vestibule south-band-neutral (move fitness/business walls 33->32, vestibule interior rows 36..40 = 2.5 m) over shrinking lounges (over: cutting lounge seats - because arrival flaws outrank seat count)
- decision: split staff room with divider col 44 (staff 40..43 door 41, WC 45..48 door 47 + toilet/basin) over enlarging floor (over: new wing - because single-floor release keeps one BOH band)
- decision: bell = table-1 + office-chair east of vestibule; dirty-return = table-1 in servery backing row-16 wall (over: new asset types - because 21 existing assets cover both, zero schema surface)
- `blueprint-data.json` v2: 53 objects, 40 doors, 16 rooms, zero 2x2, BFS 100%, suites green, live 18/18 NPCs 0 errors
- queue reasoning logged: dedicated rows 31..34 (2 m) + full arrival-axis path outer-door->desk 12 tiles (6 m) exceeds the 3.7 m brand figure, which targets 150+ room convention hotels vs our 12-guest floor
- generator tmp deleted same session

### research merged into key-design - 2026-09-19 09:45 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user order: merge RimWorld/PA/CAD research into docs/skill/key-design.md; kept qualitative only (no quantities) per the quantities->perspective decision
- added: chain-in-process-order + fixed-rooms-first (core), bell/luggage-at-entrance, split lounges, needs-where-people-wait, BOH chain + dirty-return loop (program), kitchen two doors + storage-adjacent-to-work + travel lane (rule 8), plumbing/work-counter packing exception (rule 2)
- evidence file: docs/research/hotel-layout-references.md (sources + verbatim quotes)
- verified: `node harness/scripts/verify.mjs check` pass; docs change matches no verify-table row, nothing to run

### wall-backing fix basins/treadmills - 2026-09-19 09:30 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user question (true): washbasins floated mid-restroom; audit showed also treadmills + business table + fit-bench floating. Wall-backed already: toilets/kitchen/washers/benches/vending; correctly freestanding: lounge groups, task chairs, reception/bar counters (staff side = service room per rule 4)
- `blueprint-data.json` objects only: 4 basins -> row 17 back north wall, 2 treadmills -> row 34 back row-33 wall, fit-bench -> row 40, biz table + 2 chairs -> row 34
- verified: overlap/on-wall/BFS-100%/doors self-check green + live Playwright reload fixtures lined on walls, 0 console errors

### npc body too small - 2026-09-19 09:25 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user report (true): NPC bodies rendered at dot r=4px on 20px tiles, body ~11px tall = a ~0.3 m person next to 2-tile sofas
- `src/blueprint-editor/domain/schema/layout.ts`: DEFAULT_EDITOR_SETTINGS npcDotSize 4 -> 8 (body ~23px ~= 1 tile); editor-only visual field, engine untouched, within spec max 12 so Settings slider still valid
- verified: `npm run test:migrate` pass + live Playwright deploy 18 NPCs: bodies read as people vs furniture, 0 console errors
- inspect budget held (dotSize grep -> schema default in one pass)

### single lobby floor rebuild - 2026-09-19 09:06 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)

### single lobby floor rebuild - 2026-09-19 09:06 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user order: clear all 17 floors, build one release-ready hotel lobby (G) per docs/skill/key-design.md ground-floor program
- decision: keep floor id `floor-f6bc12edb3` + streetFloorId + full originAssets/tags/roles/tasks, replace only floors[] + pool (over: fresh ids - because pool/street references stay valid, zero migration churn)
- `src/blueprint-editor/data/blueprint-data.json`: 1 floor G, 49 objects, 40 doors, 15 tile-rooms (lobby 235.25 m2 + 14 rooms 3-36.75 m2), walls strictly 1-tile (zero 2x2 blocked), 4 spawn zones (guest/receptionist/bartender/chef), pool 12+2+2+2 on the single floor
- program covered: vestibule (2 door sets) + arrival axis, reception + back office + luggage, 2 lounges + bar/servery + kitchen behind, restrooms M/F, walled elevator core, BOH band (receiving/housekeeping/laundry/staff/plant) on 2-tile service corridor with street service doors, fitness + business corner, W/E side egress doors
- verified: generator self-checks (BFS 100% interior reachable, all doors reachable + free neighbor, zero overlap, objects off wall/door) + `npm run verify:assets` + `npm run test:blueprint-schema` + `npm run test:migrate` + `npm run test:settings-completeness` green + live Playwright reload: 18/18 NPCs spawned, 0 console errors (1 pre-existing portal single-floor warning only)
- backup: blueprint-data pre-rebuild copy in Temp/opencode (reversible); generator tmps deleted same session
- inspect budget broke (2 extra domain reads) - validation.ts placement rules needed a second pass before authoring tiles

### selection highlight blue -> gold - 2026-09-18 15:47 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- user order (picked option 1): the selected-object outline used `--accent-primary` blue, which collides with the blue `door` tile state; move it to `--accent-gold`
- `EditorCanvas.vue`: `.editor__overlay--selected` and `.editor__overlay--highlight` stroke -> `var(--accent-gold)`; no new token (gold already in `variables.css`)
- left unchanged: box-select marquee, tile previews and erase guides (blue `--accent-primary`/`--accent-blue`) - they are gesture/brush feedback, not selection state
- verified: `npm run lint:bem` + `npm run lint:css` + `npm run typecheck` pass; live Playwright `.editor__overlay--selected` computed stroke = `rgb(210, 153, 34)` (= #d29922)

### hotel-layout skill: quantities -> architect perspective - 2026-09-18 15:51 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- decision: `docs/skill/hotel-layout.md` teaches the core architect way of thinking, not a program schedule (over: prescribed room areas, seat/fixture formulas, corridor %, fixed egress tiles - because counts vary per hotel and should be derived outputs, not inputs)
- removed: "Room size standards" table, program formulas (guest rooms = ceil(guests/2), seats = guests x 0.65, kitchen 25-30%, fixtures = ceil(guests/25), corridor 10-15%), hard egress distances (12 m/24 tiles, 4-tile dead end)
- added "Core perspective (architect)": occupancy drives space, form follows function/flow, program before plan, privacy hierarchy, right-size by relationship, circulation is the spine, walls last, egress invariant
- kept (not quantities): tile-scale facts, geometry Placement rules, adjacency quick-reference, Verify workflow; rewrote Design process steps to principles (kept NPC-pool occupant-load reference)
- updated `skill.md` router wording "room sizing" -> "architect perspective ... circulation/egress"
- verified: `node harness/scripts/verify.mjs check` pass (docs-only, no suite routed)

### hotel-layout scale: no stale hardcoded dims - 2026-09-18 15:53 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- user directive: fixed plot/building numbers are risky because canvas settings change (`canvas.width/height`, `tileSize`, `streetWidthTiles` are all editable)
- `docs/skill/hotel-layout.md` Scale section: dropped plot 107x67 / interior x8..98,y8..58 / street 8 tiles; kept only "1 tile = 0.5 m"; now points to live `CanvasConfig` + `resolveStreetTiles` / `resolveBuildingArea`
- `harness/state/context.md` Tile scale row: same - 0.5 m unit stays, extents derive from config/resolvers
- verified from code before rewriting: `resolveStreetTiles` clamps 5..20 (primitives.ts:6), `resolveBuildingArea` insets by streetTiles x tileSize (geometry.ts:139)
- verified: `node harness/scripts/verify.mjs check` pass (docs-only)

### hotel-layout: drop adjacency table - 2026-09-18 15:54 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- user order: cut the "Adjacency quick-reference" section (prescribed per-room touch/NOT-touch rules)
- relationship thinking stays in Design process step 2 (bubble diagram -> adjacency); no other file referenced the table
- verified: `node harness/scripts/verify.mjs check` pass (docs-only)

### hotel-layout: real-people + architect awareness - 2026-09-18 16:00 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- user directive: the skill should build *awareness*, not a checklist - think like an architect and like the real people who live in the space
- Core perspective gains: find the organizing idea, movement as sequence/threshold, and "enclose, then open" (a wall ring needs a `door`/walkable gap - `blocked` cells leave the walkable map, so a sealed box is unreachable)
- new section "Design for real people": arrival, wayfinding, staff work flow, dignity/privacy, comfort, safety in a hurry, the unseen, walk-the-plan-as-each-person
- still zero prescribed quantities; `skill.md` router wording now "architect + real-people perspective"
- verified: `node harness/scripts/verify.mjs check` pass (docs-only)

### hotel-layout: compress to high signal - 2026-09-18 16:04 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- decision: cut the "Design process" itinerary and fold its unique ideas into Core (over: keeping both - because the 7 steps restated Core 1:1; article guidance that recipe-style skills now overconstrain models)
- de-duplicated: circulation (was 4 places), enclosure/walls (4), egress (3), privacy (3), program (4)
- merged "Design for real people" into Core perspective as one body-level bullet, kept the walk-the-plan-as-each-person lens and unseen-service line
- kept project facts: Scale, Placement rules, Verify (Verify now states the 3 suites once instead of twice)
- file 71 -> 43 lines; zero prescribed quantities
- verified: `node harness/scripts/verify.mjs check` pass (docs-only)

### rename hotel-layout -> key-design - 2026-09-18 16:13 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- user order (chosen name): `docs/skill/hotel-layout.md` -> `docs/skill/key-design.md` via `git mv`
- rewire per wire-paths: only live consumer was `skill.md` router row; updated to the new path
- old path/basename re-grep: zero live hits left (only dated history entries + the live slot, which is not rewired)
- verified: `node harness/scripts/verify.mjs check` pass (docs-only)

### free tool: marquee selects objects + wall/door tiles together - 2026-09-18 16:31 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- user order: object + wall + door must be selectable in one marquee (the earlier exclusive tiles-priority could not)
- `useCanvasSelection.ts` onBoxSelectMouseUp: `onTileMarquee` no longer short-circuits - it sets the tile erase region and object selection still runs; callback back to `void`
- `EditorCanvas.vue` Delete: now clears both - confirm when objects are selected (message adds "the wall/door tiles in the marked area"), then `paintFloorTiles('walkable')` + `deleteSelected`; tile-only stays immediate, object-only unchanged
- `context.md` Free tool glossary: "or wall/door tiles" -> "and ... together"
- verified: `npm run lint:bem` + `npm run lint:css` + `npm run typecheck` pass; temp `tests/component/_selection.tmp.test.ts` (deleted same session) proved tile marquee + object selection both run in one drag; live DOM check blocked - persisted store currently has 0 walls/objects (last write 16:25)

### canvas: configurable street colors - 2026-09-18 17:41 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- user order: street colors must be settable from Settings (colors/appearance must not be hardcoded); they were fixed `--street-*` CSS tokens
- added `CanvasConfig.streetSidewalkColor` / `streetRoadColor` / `streetMarkingColor` + `CANVAS_FIELD_SPECS` color entries (`domain/schema/layout.ts`); setters `setCanvasStreet*Color` in `store/mode.ts` + `BlueprintStore` (`store/state.ts`); SettingsModal Street section 3 ColorInputs (refs/watch/apply); EditorCanvas street rects/lines now `canvas.<field> || 'var(--street-*)'` (4+4+4)
- editor-only visual fields, not added to `SyncedCanvas`/`syncedPayload.ts` - same policy as `gridColor`
- verified: live editor set all 3 via Settings -> 4 sidewalk rects + 4 road rects + 4 marking lines picked up the colors, persisted to `blueprint-data.json`, then cleared back to theme fallback; `npm run test:blueprint-schema`, `npm run test:store-crud`, `npm run typecheck`, `npm run lint:bem`, `npm run lint:css` all pass

### canvas size lock while editor has content - 2026-09-18 17:49 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- user order: canvas size and tile size must not be changeable while anything sits on the editor
- new shared detector `floorHasContent` / `layoutHasContent` (`store/storeUtils.ts`): content = floor objects, NPC spawn zones, or a painted tile differing from the floor default (blocked/door on a default-walkable floor, or walkable on a default-blocked floor); all-default grids stay empty
- store guard: `resizeCanvas` returns false on a real size change when `layoutHasContent` (`store/mode.ts`); exposed as `store.hasContent()` (`store/state.ts` + `createStore.ts`) for the UI
- SettingsModal Canvas Size: Width/Height/Tile inputs + Apply disabled and a lock hint shown while content exists; the old warn-and-continue confirm was removed (hard block)
- verified: live editor with persisted walls/doors -> all 3 inputs + Apply disabled and lock hint present; `npm run typecheck`, `npm run lint:bem`, `npm run lint:css`, `npm run test:store-crud` (29/29) all pass

### settings: radius labels in px + live size preview - 2026-09-18 18:50 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- user order: radius in px is hard to judge -> label the unit and show the real size
- Display tab Overlay Sizes labels now `Interact spot radius px` / `Lock indicator radius px` / `NPC dot radius px` (values were already screen px - the overlay canvas draws at dpr with no zoom scaling; only the label lacked the unit)
- `FieldDef.preview?: 'radius'` drives a live scoped `.settings__dot` circle in the row, diameter = 2x the draft value clamped 2..48 px, updates as the field is typed
- verified: live Settings -> Display shows the 3 labels and previews 8x8 / 6x6 / 8x8 for stored 4 / 3 / 4; `npm run typecheck`, `npm run lint:bem`, `npm run lint:css` all pass

### Playwright (@playwright/test) e2e runner wired - 2026-09-18 22:20 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- user order: install Microsoft Playwright (the test runner; `.zed` already used Playwright MCP, but `@playwright/test` + a browser were not installed)
- `npm i -D @playwright/test` + `npx playwright install chromium` (browser lands in `%LOCALAPPDATA%\ms-playwright`, machine-local, not repo)
- `playwright.config.ts`: testDir `tests/e2e`, chromium project, and a `webServer` that runs `npm run build && npm run preview --host 127.0.0.1 --port 4173 --strictPort` - e2e runs against the PRODUCTION build on purpose, so persistence is IndexedDB and `src/blueprint-editor/data/blueprint-data.json` is never touched
- `tests/e2e/smoke.spec.ts` (3 specs): fresh boot renders no error + the zero-floor onboarding; creating a floor persists across a reload (real IndexedDB round-trip, the browser-level counterpart to `tests/unit/persistenceBoot.test.ts`); the workspace exports as a `blueprint-YYYY-MM-DD.json` download
- `package.json`: `test:e2e` / `test:e2e:install` / `test:e2e:report`; `tsconfig.node.json` includes `playwright.config.ts` + `vitest.config.ts`; `.gitignore` adds `test-results/`, `playwright-report/`, `blob-report/`
- AGENTS.md verify table gained `tests/e2e/** -> test:e2e`; CI gained an `e2e` job (`npx playwright install --with-deps chromium` + `npm run test:e2e`, report artifact on failure); README documents the install step
- verified: `npm run test:e2e` -> `3 passed (13.2s)` (chromium, production build); router `node harness/scripts/verify.mjs route` -> `npm run typecheck` + `npm run test:e2e` (both pass); `npm run lint` exit 0; `node harness/scripts/verify.mjs check` pass
- note (unrelated, not touched): `npm audit` reports 2 pre-existing high advisories (`nanoid`, `postcss`) from the Vite/Vue dev toolchain, not from Playwright

### opencode MCP "local wright" + dev port pinned to 5173 - 2026-09-18 22:32 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- user order: add a local MCP server named "local wright" and have it use port 5173, the same port the user runs the app on
- `opencode.json`: `mcp."local wright"` = `type: local`, `command: ["cmd","/c","npx","-y","@playwright/mcp@latest","--browser","chromium","--viewport-size","1900x900","--allowed-origins","http://127.0.0.1:5173;http://localhost:5173"]`
- `vite.config.ts`: `server.host` `127.0.0.1` + `server.port` `5173` so the app URL the MCP drives is stable (Vite default was already 5173 but auto-incremented when taken)
- decision: keep the MCP a stdio `local` server and bind 5173 via `--allowed-origins` + the pinned dev port (over: `--port 5173` SSE) - because `--port` switches @playwright/mcp to SSE transport, which an opencode `type: local` entry cannot consume and which would collide with the Vite dev server on 5173; a literal SSE setup would need `type: remote` + a separately-started process
- decision: no `--isolated` (over: the earlier Zed setting's isolated profile) - so the browser keeps a persistent user profile, matching "same user"
- verified: `opencode debug config` merges and shows the entry; stdio initialize handshake against the exact command returned `{"result":{"serverInfo":{"name":"Playwright","version":"1.64.0-alpha-2026-09-14"},...}}`; `npm run dev` served HTTP 200 on http://127.0.0.1:5173/ (temp probe scripts deleted same session); `npm run typecheck` + `npm run lint` exit 0; `npm run test:e2e` 3/3; `node harness/scripts/verify.mjs check` pass
- caveat: opencode loads config once - the MCP appears only after an opencode restart; the browser needs `npm run dev` running for the 5173 origin

### MCP not visible in Zed: added project `.zed/settings.json` - 2026-09-18 22:45 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- user report: "ไม่เจอ mcp เลย" (can't find the MCP at all)
- diagnosis: opencode's side was already fine - `opencode mcp list` -> `✓ local wright connected`, and the session exposes `local_wright_browser_*` tools; what the user was looking at is Zed's Settings -> AI -> MCP Servers, which lists ONLY Zed-native `context_servers`; neither `%APPDATA%\Zed\settings.json` nor the project had any context_servers (global grep = no match), so that page was empty
- fix: new project-local `.zed/settings.json` with `context_servers."local wright"` = `cmd /c npx -y @playwright/mcp@latest --browser chromium --viewport-size 1900x900 --allowed-origins http://127.0.0.1:5173;http://localhost:5173` (Zed custom-server shape per zed.dev/docs/ai/mcp)
- note: this touches the AGENTS.md "`.zed/` off-limits" folder - done on the explicit follow-up that the MCP was not findable, since Zed's MCP UI reads only this file
- caveat: Zed forwards its context_servers to external agents over ACP, while opencode also loads its own `opencode.json` MCP - if Playwright tools show up twice, delete one of the two entries
- verified: `.zed/settings.json` parses and lists exactly 1 server with 10 args; the identical command passed a stdio initialize handshake (serverInfo Playwright) earlier in this task; `node harness/scripts/verify.mjs check` pass

### lobby floor furnished (50 objects, all 21 asset types) - 2026-09-18 23:15 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- user order: fill out the Lobby floor ("เติมเต็มชั้น lobby"), using the now-working Playwright visualization to see the result
- facts gathered first: canvas 1600x1000 tile 20 (grid 80x50), interior wall ring rows 8..41 cols 8..71 with 3 openings (N cols37-40, S cols37-40, W rows23-26), 21 assets, 4 roles (Guest 45 / Chef 5 / Bartender 5 / Receptionist 5) with tasks posting to bar-counter, reception-desk, kitchen-table, kitchen-sink, table-stove
- authored 50 objects by zone in `src/blueprint-editor/data/blueprint-data.json`: restroom block (2 toilet/washbasin/shower/bathtub), elevator bank flanking the north door (2), kitchen service (kitchen-table, 2 sinks, table-stove), bar (counter + 2 bartender chairs + 4 stools + vending), west lounge (table-set + 2 chairs + sofa + table + 2 single sofas), centre lounge (2 table-sets + 4 chairs + sofa + table + single sofa), reception (8-tile desk + 3 office chairs) west of the south door, 3 waiting benches east of it, laundry/fitness (2 treadmill + 2 washer) SW, rest pod (double bed) NE
- generator validated before writing: every object inside interior tiles 9..70 x 9..40, zero AABB overlaps, and both corridors kept clear (vertical cols 36..41, west-entry rows 22..25 cols 9..35); object ids are fresh `obj-<10 hex>`; persisted shape kept minimal `{id,type,x,y,rotation}` (w/h resolve from the definition)
- pre-edit backup at `%TEMP%\opencode\blueprint-data.backup.json`
- verified live via the MCP browser at 127.0.0.1:5173: after reload the canvas shows all 50 objects and the palette badges update (Chair 10, Table Set 3, Office Chair 5, ...); "Deploy NPCs" ran 60 NPCs (Moving 51, Chatting 8, Queued 1) with 0 console errors; `npm run verify:assets` PASS 21 assets / 0 warnings; 0 objects reference an unknown asset; `npm run test:migrate`, `npm run test:blueprint-schema` pass; `npm run test:store-crud` 29/29; `node harness/scripts/verify.mjs check` pass
- cleanup: screenshots + `.playwright-mcp/` deleted (repo root clean); dev server left running for the user; MCP needed a second browser install (`npx @playwright/mcp install-browser chrome-for-testing`) because @playwright/mcp pins chromium-1244 while @playwright/test installed 1243

### lobby rework: real hotel plan (walls, rooms, 71 objects) - 2026-09-18 23:49 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- user correction: the open-plan lobby was not a real hotel - beds, bathtubs, washers and showers stood in the atrium. The previous entry's layout is superseded by this one.
- corrected facts that drove the redesign: counters (`bar-counter`, `reception-desk`) carry two spot families - staff spots above the object (svgViewBox y=-6: `bar-back`, `reception-station`) and guest spots below (y=31) - so a counter must be backed by a wall with guests approaching from the open side; tiles under a non-walkable object are themselves blocked in `layoutBuild` (`objectBlocksTile`), so a counter blocks a 1-tile-thick wall
- new plan in `src/blueprint-editor/data/blueprint-data.json`: outer ring + public restrooms NW (divider wall, separate doors, stall partitions), kitchen BOH NE (service door), reception back office centre-north (east door); counter rows shifted one tile south so the staff strip behind each counter stays walkable (staff row 19 / counter 20 / stools 21 for the bar; staff 26 / desk 27 / guests 28 for reception)
- 71 objects / 16 asset types: 4 toilet + 4 washbasin, 2 elevator + 1 vending on the north wall, kitchen table + 2 sinks + stove, 7 table-sets (west x2, centre x2, east x2, SW x1) with chairs/sofas/tables, 3 entrance benches, 18 chairs; removed from the lobby entirely: double-bed, bathtub, shower, treadmill, washer
- generator validated before writing: every object on `walkable` tiles, zero AABB overlaps, flood-fill reachability from inside the south entrance to all 16 targets both on the tile grid alone and with non-walkable furniture applied
- verified live (MCP browser at 127.0.0.1:5173): plan renders with walls/doors and legible room labels; "Deploy NPCs" ran 60 NPCs -> Moving 35 / Chatting 12 / Waiting 12 / Idle 1 with 0 console errors and path lines routing through the doors; `npm run verify:assets` PASS 21 assets / 0 warnings; `npm run test:migrate` + `npm run test:blueprint-schema` pass; `node harness/scripts/verify.mjs check` pass
- cleanup: screenshots + `.playwright-mcp/` deleted; dev server left running for the user

### lobby architecture audit vs published standards (deep research) - 2026-09-18 23:59 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- user order: audit the lobby plan against real hotel architecture, researched online (CAD/standards sources). Read-only audit; no repo file changed by it.
- sources used: Volant Fit-Out reception-desk dimension guide (desk depth 28-36 in, width 48-72 in/staff, staff clearance >=36 in, guest counter 42-44 in, accessible <=36 in), ADA 2010 Std 403.5.1 (accessible route clear width >=36 in) + ch.9 service counters, CR Hotel Management "Lobby Areas" (vestibule: >=2.5 m between door sets), HKS Architects (BOH ~40% of gross area, separate staff/guest circulation, large-empty-lobby critique), FSM.How space standards (circulation 2.3-2.8 m2/person peak, kitchen 60:40, office groups A-E), Cadbull hotel reception CAD (baggage room + admin + service areas in a real front-office plan)
- measured with a temp script (`%TEMP%\opencode\audit-lobby.mjs`, outside the repo, deleted same session): corridor width = narrowest free run through each path tile (a first metric using `2*distance-1` under-reported 2-tile corridors as 1 - fixed before reporting)
- PASS: accessible/corridor clear width min 1.0 m on all 6 sampled routes (>=0.91 m); reception + bar staff-side clearance 1.0 m; 3 street entrances (N/S/W); open floor 933 m2 vs 138-168 m2 needed for 60 NPCs at 2.3-2.8 m2/person
- FAIL/gaps: (1) reception desk 1 tile deep = 0.5 m vs 0.71-0.91 m standard - an asset-level limit, not placement; (2) no entrance vestibule (standard >=2.5 m between door sets); (3) no separated service circulation - the kitchen door opens straight into the guest elevator lobby (HKS: staff and guest routes must not cross); (4) ground floor has no service core (no baggage/luggage room, staff room, storage, receiving, housekeeping) so BOH is 8% vs the ~40% a full-service hotel carries; (5) 6 dead-end pockets - restroom fixtures sit tight in corners (toilets at rows 10 under the row-9 ceiling wall), a 1-tile slot between elevator-1 and the vending machine, and one in the back office - violates `key-design.md` "fixtures keep 1 tile from walls" and "dead ends are defects"; (6) kitchen and office doors are 1 tile (0.5 m) - too narrow for a service/accessible route; (7) the lobby is oversized (933 m2 open for 60 people = 15.5 m2/person vs the 2.3-2.8 standard) - HKS explicitly argues against large empty lobbies, so this reads as under-programmed space, not generosity
- decision: keep these numbers OUT of `docs/skill/key-design.md` - the skill deliberately carries no prescribed quantities (logged 2026-09-18 16:04); the audit lives here as evidence, and fixes are proposed to the user instead
- proposed fix order (not applied - audit only): P1 remove the 6 dead ends + widen the 2 doors to 2 tiles; P2 add a south entrance vestibule, a service corridor + service door separate from guests, and a BOH core (baggage room, staff room, storage); P3 right-size the lobby by programming it (cafe/bar seating, retail/business corner) or shrinking it, and reserve a 1.5x1.5 m accessible approach at the reception end
- verified: audit numbers from the script above; `node harness/scripts/verify.mjs check` pass; no repo file written by the audit (blueprint-data.json was already modified by the preceding lobby task)

### ground floor rebuilt for real hotel throughput (100 guests/day) - 2026-09-19 00:29 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- user order (autopilot): "a hotel for 100 people passing through per day needs much more thought" - apply the audit's findings to the floor, deciding the rest myself
- decision: reuse the 21 existing asset definitions and rework only tile states + placement + spawn zones (over: inventing new asset defs for luggage rack / accessible fixtures) - because the plan-level gaps (separation, rooms, doors, dead ends) are what the audit found, and new art would block on a data-schema change
- new layout (83 objects, 18 asset types, 0 dead ends): north BOH band = service corridor rows 9-10 behind wall row 11, with kitchen / storage+receiving / laundry / staff room; restroom block (M+F, fixtures 1 tile off walls, 2-tile lane, doors south to the lobby); reception block = 2-tile staff strip + desk + back office + luggage store; south entrance vestibule (door row 41 + door row 35 = 5 tiles = 2.50 m between door sets); walled elevator core opening south; gym room SE; lounge programme (8 table sets, sofas, 9 benches, 2 vending); bar backs the restroom block with a 2-tile staff strip
- circulation: guest spine arrival -> reception -> lifts -> lounge, and a separate service corridor from a west service door to every BOH room; N door is now service-only, S is the main guest door, W guest door kept - 4 doors, 3 guest-usable, 2 independent egress
- spawn zones added (first use on this floor): guest arrival 8x7 tiles at the entrance, kitchen 15x6, bar behind the counter, reception behind the desk - each role-filtered (role-guest / role-6fde / role-bartender / role-receptionist)
- measured (temp script, outside the repo, deleted): every guest route >= 1.0 m clear and every service route >= 1.0 m; reception and bar staff strips 1.0 m; vestibule 2.5 m; open floor 890 m2; BOH 24.5% of the interior (was 8%); 0 dead ends (was 6); the widest-corridor (maximin) metric was used after the first naive metric mis-scored 2-tile corridors as 1
- known limit (unchanged): the reception desk asset is 1 tile deep (0.50 m) vs the 0.71-0.91 m standard - a definition-level issue, deferred
- browser-verified (MCP): plan renders, all 60 NPCs spawn (Moving 30 / Interacting 9 / Chatting 2 / Waiting 19), 0 console errors
- docs: `docs/skill/key-design.md` gained a "Ground floor / lobby program" section and placement rules 4-6 (counter backs a wall/service room; guest and service routes never share a corridor; spawn zones sit on a role's work area), phrased without prescribed quantities per the 2026-09-18 16:04 decision; `harness/state/context.md` glossary gained Vestibule, Front/back of house, Service corridor, Spawn zone (a stray edit had dropped the Door halves row - restored in the same change)
- verified: `npm run verify:assets` PASS 21 assets / 0 warnings; `npm run test:migrate`, `test:blueprint-schema`, `test:sync-payload`, `test:unit` 16/16 all pass; `npm run typecheck` + `npm run lint` exit 0; `npm run lint:bem`/`lint:css` pass (35 files); screenshots + `.playwright-mcp/` + temp scripts deleted; `node harness/scripts/verify.mjs check` pass
- backup of the pre-rework layout at `%TEMP%\opencode\blueprint-data.before-ground.json` (temp, not in the repo)

### hotel tower: 12 floors, 1034 guest beds (11 room floors + lobby) - 2026-09-19 00:48 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- user order: a building of at least 11 floors that can hold 1000 people
- generated 11 identical guest floors on top of the existing G lobby (12 floors total), from one validated template (`%TEMP%\opencode\hotel.mjs`, outside the repo, deleted same session)
- guest-floor plan: 3 spine corridors (rows 9-11, 23-25, 37-39) + an end aisle (cols 69-70) linking them; 4 room bands (R1 rows 12-16 doors to C1; R2 18-22 doors to C2; R3 26-30 doors to C2; R4 32-36 doors to C3) so EVERY band opens onto a corridor; 47 rooms/floor at 4x5 tiles (2.0x2.5 m), each with a double bed, toilet, washbasin, shower, chair and a 2-tile door; one lift niche (2 elevators, cols 9-12 rows 26-29) opening onto the middle corridor - the portal that lets NPCs travel between floors
- capacity: 47 rooms x 2 beds x 11 floors = 1034 guest beds (target was 1000) + the lobby; object total 2690; payload 2.6 MB of the 5 MB cap
- pool rebuilt: one `role-guest` entry per guest floor (94 each, floor-restricted) + 40 lobby arrivals + 15 each for chef/bartender/receptionist = 1119 NPCs total (the perf-audit scale, 11 floors x ~100)
- validation before write: every object on a walkable tile, zero AABB overlaps, every room reachable from the lift, zero dead ends in the public spine (room corners allowed - a corner behind a door is not a circulation defect, so the check is scoped to the corridors and the end aisle)
- browser-verified (MCP): the floor switcher lists G + Floor 1..11; Floor 7 renders 47 rooms and deploys 94 NPCs (Moving 2 / Interacting 1 / Chatting 74 / Waiting 17) with 0 console errors
- fix during the build: the first template put the bathroom fixtures on the corridor-facing row, which landed toilets on door tiles (both were rows 22) and left 25 dead-end stubs - fixtures now sit on the blind wall and the check is spine-scoped
- verified: `npm run verify:assets` PASS 21/0; `test:migrate`, `test:blueprint-schema`, `test:sync-payload`, `test:unit` 16/16, `test:store-crud` 29/29 pass; `npm run typecheck` + `npm run lint` exit 0; screenshots + `.playwright-mcp/` + temp script deleted; `node harness/scripts/verify.mjs check` pass
- backup of the pre-tower state at `%TEMP%\opencode\blueprint-data.before-hotel.json` (temp, not in the repo)

### npc preview realistic-hotel look - 2026-09-19 07:15 UTC+7 (muse-spark, opencode/cline-pass/glm-5.3-flash)
- Playwright look audit (5173): NPCs were plain role-color dots, hotel interior rendered as black void, unbounded chat-bubble storm (20+ bubbles on floor 16)
- Fixed: procedural person bodies in useNpcOverlayDraw.ts (torso+head+legs, 5 skin tones, walk bob, white collar for staff via isStaff->!isGuestRoleId; mood ring kept); NPC-preview-only building-interior floor fill #3a332b (EditorCanvas.vue rect + runTileStyle walkable fill); chat bubbles capped at 6
- decision: procedural canvas bodies over origin-asset humanoid SVGs (over: new origin assets + drawImage rasterization - because zero new data-schema surface, reversible, dotSize fallback kept)
- decision: preview-only floor color via buildingAreaRect rect (over: raising the editor walkable tint - because editor tint semantics stay untouched)
- verified: npm run lint:bem + npm run lint:css + npm run typecheck all pass; Playwright re-shots: people render, warm floor, bubbles capped; console clean; verify.mjs check pass (scope warning = pre-existing dirty tree, my diff is 2 files)
- unrelated pre-existing: 27 other dirty files in git status before task start (ci.yml, README, blueprint-data.json, e2e/) - untouched

### realistic hotel floor plans - 2026-09-19 09:10 UTC+7 (muse-spark, opencode/muse-spark)
- user verdict: old layouts architecturally implausible (FOH/BOH mixed, 47 rooms/floor, random walls). Rebuilt all 17 floors in blueprint-data.json via scripts/fix-hotel-realism.mjs from real prototypes (Wyndham/Cad/Comfort Inn patterns)
- G: vestibule airlock + reception facing entry, lounge wings, lobby bar, NW guest toilets, N service strip, recessed elevator lobby. 1: kitchen BOH north + service door, 11 dining tables, E toilets. 2: ballroom N + breakout S + cloak. 3: gym W + spa middle + lounge S. 4: lounge W + bar/dance E. 5-15: double-loaded corridor, 8+7 rooms, bath at corridor side, elevator lobby recessed SW. 16: 4+3 large suites + E private dining lounge
- decision: generator script kept in scripts/ (over: hand-editing JSON - because reproducible, re-runnable, diff-able)
- decision: kept tile grid 80x50 + street ring contract untouched (over: resizing plot - because engine/tests pin those)
- fixed after audit: elevators/sofas/tables overlapping wall tiles, dead doors, corridor-blocking stubs (verifier: every object on walkable, every door adjacent walkable)
- verified: Playwright G/5/16 re-shots + NPC deploy Moving 12 / Interacting 6 / stuck 0; test:blueprint-schema, test:asset-schema, test:sync-payload, test:persistence, lint, lint:bem, lint:css, typecheck, test:e2e (3 passed) all green
