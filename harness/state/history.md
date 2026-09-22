# History - shared cross-agent intent log

Entries only. Pattern lives in `harness/HARNESS.md` (History pattern) -
follow it when logging below. Continental-Idle project work only - no
mod-cli records, no harness-meta records.

## Entries (Doing - Finished (Agent, Model) + Detail Bullets)

### ux discoverability polish (autopilot) - 2026-09-21 (opencode, opencode-go/glm-5.3-flash)
- NpcRoleDetail -> sub-tabs Basics/Tags/Tasks/Spawn/Rates with count badges (drop Trigger Rates collapse + Basics h4); Spawn tab always shows zone-coverage badge + "Open Floor Manager" jump (over: single long scroll - because buried Trigger Rates / conditional Spawn were the reported pain)
- decision: jump-link pattern, not data merge - spawn zones stay floor-level in FloorModal; NpcRoleDetail reads coverage read-only via spawnZoneAllowsRole (over: moving zones into NPC Manager - because zone ownership is per-floor in schema/sync)
- decision: audit re-check killed 2 of 4 planned items (canvas flags already labeled, Draw hint already in modeHint EditorCanvas.vue:184) - claim-then-impact before edit
- NpcRoleList rows now show pool/focus/restrict/tasks badges (poolCounts prop, single caller wired)
- FloorModal Label/Name: explicit Edit buttons replace dblclick-to-edit
- DeployNpcModal: "Open NPC Manager" buttons (persist draft before jump, both empty and configured branches)
- Toolbar wires cross-modal jumps: open-floor-manager (persist first), open-npc-manager (close deploy first)
- verified: npm run lint:bem + lint:css + typecheck all pass; verify.mjs check pass (42-file scope warning is pre-existing working tree, this task touched 5 planned files)

### npc role appearance (autopilot) - 2026-09-21 16:06 UTC+7 (opencode, opencode-go/glm-5.3-flash)
- NpcRole.appearance?: { skinTones[<=8], trousers, hat none|cap|boater, hatColor } - empty = today behavior exactly; skin resolve via per-role cache cleared on config ingest (over: per-frame resolve - because matches dotRoleColors pattern, no per-frame alloc)
- decision: dropped shirt field (over: appearance.shirt - because role.color already owns the shirt, zero-duplication)
- decision: validator = isValidColor schema-side lenient salvage; role never dropped for bad appearance (over: strict isValidRole extension - because normalizeNpcConfig drops invalid roles + filters pool entries)
- wired: schema/npc.ts normalizeAppearance, NpcSimDot skin fields, projection resolveLook, core dotRoleLooks cache, drawNpcBody hat shapes, NpcRoleDetail UI + manager merge handler
- verified: typecheck(app) 0, lint 0, lint:bem/css pass, test:migrate pass (lenient + cap8 + round-trip), test:npc-social pass, test:unit 38/38 (+2)

### autopilot perf phase 1: diagnose (no code defect) - 2026-09-19 23:05 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- decision: attribute, don't patch blindly (over: spawn-map cache, measureText cache, paused-canvas throttle - because every measured sub-cost is ms-scale, so added complexity had no verified payoff)
- evidence: rAF ~1fps in ALL modes incl. fresh edit mode vs blank-page 158fps; timers free; 0 DOM mutations/8s; parse 3ms, stringify 6ms, validate 4ms, HTTP save ~115ms, engine layout 189ms, spawn 1ms, tick 2ms; production build e2e 3/3 in 1.9s
- conclusion: slowness is headless software rasterization + Vue dev mode, not app code; no source changed this phase; stray preview server killed, dev server kept
- residual offers: real-hardware FPS check, 994KB chunk code-split, paused-canvas throttle

### autopilot perf phase 2: paused throttle shipped - 2026-09-19 23:20 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- decision: ship only the paused-canvas throttle (500ms, canvas retains frozen frame, toggles converge within 500ms) in useNpcOverlayDraw + EditorCanvas wiring (over: code-split - because gzip is 64KB total, splitting saves nothing measurable)
- verified: typecheck + eslint + unit 26/26 + live deploy 137/137 0 errors, paused dots intact (36/36)
- no other source changed; autopilot remains on

### Matt Pocock improve-codebase-architecture pass - 2026-09-20 00:05 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- followed the skill for real (fetched SKILL.md + codebase-design vocabulary): explore via subagent with deletion test, visual HTML report to Temp (opened), autopilot converted the pick-step to self-decision
- report: C:\Users\disda\AppData\Local\Temp\opencode\architecture-review-20260920.html (6 candidates, top = #1 layout seam)
- decision: implement NONE yet (over: #1 full inversion - because mirroring NpcSimulationConfig/AssetDef duplicates the domain, worse locality than 7 structural type imports; over: #6 mood - because mapping is already centralized in useNpcOverlayDraw, no duplication found; #2/#4/#5 deferred as risk-over-payoff on the verified sim)
- finding for the record: runtime floor objects carry w:0/h:0 (buildSavedLayout placeholders) - any "enrichment adapter" would change movement/collision behavior, so it is NOT a safe refactor
- no source changed this pass; report is the artifact; user may still pick any candidate to grill/implement

### #5 sync projection implemented (Matt Pocock follow-through) - 2026-09-20 00:20 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user pushed back ("none worth doing?") - re-examined #5 and found the testable slice: new pure module npcSimProjection.ts (blankSimDot/updateSimDot/pruneStaleDots/pruneWaitReasons/filterDotsForFloor) + tests/unit/npcSimProjection.test.ts (10 tests), wired into useNpcSimulationCore with zero behavior change
- verified: typecheck + eslint + unit 36/36 (was 26) + live deploy 137/137 0 errors; removed one orphaned import caught by lint
- decision: #2/#4 stay deferred (over: god-module/policy splits now - because the verified sim + ride proof would carry the regression risk, payoff is future-change ease not present pain)

### AssetEditModal persistent Real Visual rail - 2026-09-20 01:50 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user order: see real visual while editing asset on every tab; preview lived in WalkableGridEditor (mounted only on non-general tabs), General had none
- AssetEditModal.vue: persistent right rail (edit__preview block, scoped delta CSS, same useAssetPreview helper) with name + WxH caption; WalkableGridEditor.vue: deleted the duplicate preview block + wiring + 2 dead CSS rules (single preview, zero duplication)
- verified: lint:bem + lint:css + typecheck green; live screenshots of General/Walkable/Interact/Assign all show the rail; 0 console errors; floor data untouched (still G-only empty per user order)

### spot references die with their asset (single save-point rule) - 2026-09-20 02:10 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user design question: how to make spawn spots disappear with their asset; claim verdict - spots already die inside the asset def, the lingering part was the task.post reference, which had TWO owners (immediate strip in assets.ts + save prune in storeUtils.ts) against the logged single-point decision
- design: one rule at the save prune point - post to unknown asset strips whole post (existed), post name missing from the asset's live names strips just the name and keeps the assetId binding (new - engine/validation already read bare-assetId as "any spot"); tasks themselves never die on furniture changes (portable work vs specific spot, no-recovery rule)
- `storeUtils.ts`: prune now takes the asset registry and builds live post-name sets; `assets.ts`: deleted the duplicate strip (object removal stays); `createStore.ts`: passes registry
- verified: store-crud 39/39 (+1 renamed-post test; deleteAsset post test still green via save-prune) + typecheck + lint + settings/sync/migrate

### no auto-delete of spawn zones (warn-only purpose check) - 2026-09-20 02:30 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user proposal: delete floor spawn zones where a deleted asset was wired; verdict: no - zones reference roles, never assets, so "its zone" needs a guessing heuristic; one shared asset deletion would nuke zones serving other roles, against the no-recovery rule; per-floor scoping already exists where the link is real (objects removed per floor, pool pruned per floor, post strip is correctly global since asset types are global)
- shipped instead: warn-only symmetry to the existing allows-role-without-zone check - zone spawns a role whose tasks/focus tags match nothing on that floor; task-less wanderers (guest/housekeeper precedent) exempt, empty floors skipped, open zones check all roles
- `validation.ts` + 4 synthetic checks in test-settings-completeness; gates green; real data shows 0 new issues (9 pre-existing, all from the empty floor)
- decision: signal, don't destroy (over: cascade zone delete - because the link is heuristic and destruction is irreversible)

### wiring trash made visible (badge + prune receipts) - 2026-09-20 02:45 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user painpoint: leftover spawn wiring accumulates invisibly unless you go looking; issues only surfaced in deploy gate/sync toast/console
- `Toolbar.vue`: passive "N wiring" badge (reused badge + flag--warning, zero new CSS) next to NPC Manager, full issue list in tooltip, click behavior unchanged; filter mirrors the existing deploy-gate precedent (spawn zone/post/pool/Task/Role/trigger rate)
- `createStore.ts` save: prune notes now toast as "Wiring cleanup: ..." receipt on success only (capped 4 + more); silent auto-cleanup becomes visible, no new auto-delete
- verified: bem/css/typecheck/lint + store-crud 39/39 + unit 36/36 + live real-data badge "9 wiring" with all 9 issues in tooltip, 0 console errors

### spawn wiring grouped by role (pool moved to NPC Manager) - 2026-09-20 03:10 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user order: compact scattered NPC settings into related groups; decision: group by role - pool counts + spawn floors + target tags moved from Deploy modal into NPC Manager role detail "Spawn" section (over: cross-links only - because the pain was configuring, not viewing)
- same draft + same queuePersist path, zero new data flow; Deploy slimmed to launch dialog (read-only totals/floors/tags + speed + override + gate + go); deleted the moved fns + dead deploy__step CSS; single editor per field preserved
- verified: bem/css/typecheck/lint green; live round-trip guest 12->13 in NPC Manager, Deploy followed to Total 19 with read-only review, reverted to 12 (pool back 12/2/2/2), 0 console errors

### spawn zone free-tool rectangle drag - 2026-09-20 03:40 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user order: zone add via X/Y/W/H numbers is unusable, want free-tool drag; new EditorMode 'zone' reusing the marquee path (Draw Object precedent): FloorModal Draw button stages label/roles, closes, arms canvas; drag creates tile-snapped zone via shared store.addSpawnZone (FloorModal Add refactored onto it, no second construction path); X/Y/W/H inputs kept for precision
- verified: store-crud 40/40 (+1) + bem/css/typecheck/lint + live drag (Zone 1 220x160, toast, mode back to object) + delete round-trip, 0 errors; floor restored to 1/0/0 + guest 12
- variance (first occurrence, not promoted): 5 legacy G zones found missing during proof; bisected live (add zone -> NPC count save -> zones intact) so the NPC-save path is innocent; one-time past loss, cause UNCERTAIN; not restored per no-recovery rule (empty floor would flag them as purposeless anyway)

### audit improve pass (#6 #1 #7-partial) - 2026-09-20 04:10 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user order: improve per the audit roadmap
- #6: traced object w/h enrichment (persisted sizes untrusted -> migrate/normalizeObject re-derives -> engine guards degrade) - contract comment at the zeroing site (dataLoader.ts, user-requested exception to no-comments) + migrate test with w:0/h:0 objects asserting re-derived sizes
- #1: tests/test-tower-integration.ts - real-seed deploy pipeline (migrate, layout build, portal symmetry, per-entry spawn cells, 120-tick smoke), seed-agnostic expectations, wired as test:tower-integration into run-tests.mjs
- #7-partial: reorderFloor swap/rejects + duplicateAsset palette-only + refreshOriginInstances size restore (caught my own hardcoded 40-vs-50 tile assumption - fixed to assetSizeFor)
- verified: npm test 16/16 + typecheck + lint + unit 36/36 + store-crud 43/43
- decision: god-module splits (#2/#3/#4) NOT started (over: bundle now - because audit times them "when touching the area" and the sim/canvas are freshly verified; splitting now buys risk without a triggering change)

### NPC persistence across floor switch - 2026-09-20 11:40 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user report (true): switching floors respawned every NPC - not a live hotel; root cause: the floor-id watcher primed lastFloorSig='' on every switch, so the deep floor watcher always saw a diff and refresh() rebuilt the engine + respawned all agents
- fix (2 lines): the floor-id watcher now primes lastFloorSig from the newly active floor before setViewFloorId - floor switch is a view change, real layout edits still rebuild via the genuine signature
- verified: typecheck + lint + unit 36/36; live: exactly one NpcSpawn log for the deploy, G(36 dots)->5->G dots unchanged, floor 5 accumulated cross-floor guests via elevators, chat bubbles firing, 0 errors

### unfocused-floor life proof (LOD question) - 2026-09-20 11:55 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user question: how do games keep unfocused floors alive; verdict: the engine is already full-fidelity global sim (tick() walks every floor, no view concept in the engine, only the render filters) - the "respawn on switch" illusion was the watcher bug fixed last entry
- live proof: deployed, ran 20s at 8x on G, switched to floor 5 never-viewed - arrival showed Chatting 8 / Waiting 1 / Idle 1 with chat bubbles and a housekeeper mid elevator ride (54 dots = pool + cross-floor guests), zero fresh-idle NPCs
- decision: stay pattern-1 (tick everything, filter view) over RimWorld-style catch-up/abstract sim - because tick cost ~2ms for the whole tower; revisit only at ~10x scale

### sim polish: trigger rates/social/focus re-aligned to redesigned hotel - 2026-09-20 14:17 UTC+7 (opencode, opencode/deepseek-v4.1-flash)
- defect: the redesign retagged amenities (dining/fitness/wellness/laundry/bar/back-of-house) but role focusTags + tagTriggerRates were left stale - guests only ever targeted living/lounge, housekeepers never targeted hygiene, amenity floors stayed near-dead
- fixed `scripts/observe-hotel.ts` (stale after the lazy-seed refactor + sync-key id remap): boots the migrated real seed so pool floorIds resolve, spawns via canonical buildRoleWalkableMap + filterNpcSpawnTiles mirroring useNpcSimulationCore.spawnAgents
- data (`blueprint-data.json` npcConfig): guest focusTags += dining/wellness/fitness/bar, housekeeper += laundry/back-of-house; tagTriggerRates now covers living/lounge/hygiene/dining/wellness/fitness/bar/laundry/cooking/front-desk/back-of-house/soc-chatty; crossFloorCooldownSeconds 30->75
- code: `useNpcSimulationCore.ts` + observe-hotel social constants socialCooldownSeconds 45->20, chat 3-8->5-14s (radius 2 unchanged)
- measured on real data (300s, 14 floors, 116 agents): chatting 3.1->7.5%, interacting 5.2->6.8%, walking 84.0->73.1%, chats 198->276; trade-off waiting 7.5->12.1% (more target-seeking -> repath-blocked congestion)
- suites: typecheck + lint + unit 36/36 + tower-integration (14 floors, 116/116, 1456 portals) + settings-completeness + npc-social + blueprint-schema + migrate + sync-payload; temp sweep deleted same session
- decision: expand focusTags + lower rates (over: raising rates alone - because the stale tag wiring, not rate magnitude, was what kept amenity floors empty)

### slot cleared (release gates outstanding) - 2026-09-20 14:22 UTC+7 (opencode, opencode/deepseek-v4.1-flash)
- user order: clear the live slot; sim polish entry above is the completed record
- parked (not abandoned): release gates - full `npm run verify` + `verify:assets` + `test:e2e`; working tree still holds the uncommitted redesign + sim-polish changes

### hotel redesign: SLAB AND STRIP parti (14 floors) - 2026-09-20 14:35 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user request: ช่วยออกแบบโรงแรมให้ใหม่ (autopilot) - parti-first gate honored: THE SLAB AND THE STRIP (new parti, named in slot before any tile write) - 6x7 elevator core punched through every floor + full-length E-W strip corridor rows 24-25; guest rooms hang off its south side, service rooms behind a wall-row service corridor on its north side
- stack: G lobby (vestibule 2 door sets + bell bench, reception facing entrance, back office, restaurant NW 6 tables, M/F toilets SW, bar SE, kitchen NE with east street delivery, staff-only service corridor rows 21-22) + F1 spa/fitness + F2 restaurant + F3 gym/spa + F4 club + F5-F12 guest (7 keys 7x14 ensuite + narrow 8th, pantry/linen/staff/storage north, deeper pantry every 3rd floor) + F13 sky suites (3 suites + sky lounge + sky bar)
- realism wiring: retags table-set->dining treadmill->fitness bathtub->wellness washer->laundry bar->bar office-chair->back-of-house; chair/bench/plant untagged (decoration); 6 new tag definitions; per-floor pool (116 NPCs: guests 84 + chef 4 + receptionist 2 + housekeeper 26); upper-floor street ring marked blocked per engine contract
- caught in-gen: 2 floor passes for 2x2 wall masses (office/kitchen shared column x50, annex/core adjacency), fixtures off wall rows, door-path clearance, G-only exterior doors (vestibule + service street door + kitchen delivery east), object ids globally unique (normalizePersistedLayoutData single objectIds set - first occurrence, not promoted)
- verified: verify:assets 22/22 0 warnings + blueprint-schema + migrate + tower-integration (14 floors, 116/116 agents, 1456 portal routes - up from 16) + settings-completeness all quiet; BFS 100% every floor; rooms 24.5-35.8 m2 keys, 45-80 m2 suites, 280-456 m2 halls; payload 2.66/5 MB; temp generator+diags deleted same session
- assumption: housekeeper watches amenity floors via their toilet/spa rooms (no dedicated zone-purpose rejection in settings check)

### remove design-doc guardrails (key-design + lessons) - 2026-09-20 19:07 UTC+7 (opencode, opencode/deepseek-v4.1-flash)
- user order (option 1): delete `docs/skill/key-design.md` + `harness/state/lessons.md` and clean every live reference
- `skill.md` hotel-floor-plan routing row removed; `harness/HARNESS.md` (inspect lessons grep + variance->lessons promotion) edited; `harness/skills/README.md` variance line retargeted to the history entries
- historical rows in `history-2026-09.md` left untouched - records of past events, not live pointers
- verified: repo-wide grep zero live `key-design`/`lessons.md` hits; `node harness/scripts/verify.mjs check` pass
- decision: full removal over emptying content (user pick) - accepts losing the only design methodology plus the parti-first guardrail against same-face rebuilds

### wipe hotel: floors removed, lobby cleared - 2026-09-20 19:17 UTC+7 (opencode, opencode/deepseek-v4.1-flash)
- user order "delete all floor and clear lobby", literal execution after declining the option questions ("just do what say"); pre-check: 14 floors (G 46 objs), vite dev server running (write raced nothing - read-back + suites clean)
- `blueprint-data.json`: floors f1-f13 removed; floor-g kept and cleared - objects [] + `walkable` + `spawnZones` removed (defaultWalkable true -> all walkable); `allowedRoleIds` kept
- NPC pool pruned to floors that still exist (app removeFloor behavior) -> 4 lobby entries (guest14 + chef2 + receptionist2 + housekeeper2 = 20); roles/tasks/tags/assets untouched (22 assets, 14 tags)
- verified: app `readBlueprintDataFile` validates (1 floor, pool 4); verify:assets 22/22 0 warnings; blueprint-schema + migrate + tower-integration (1 floor, 20/20 agents, 0 portal routes) + settings-completeness all green
- assumption: "delete all floor" = remove floor entities, "clear lobby" = empty G; pool pruned rather than cleared

### standing order: in-repo destructive edits pre-authorized - 2026-09-20 19:17 UTC+7 (opencode, opencode/deepseek-v4.1-flash)
- user order: this project is pre-release and unfinished - stop treating in-repo wipes/rebuilds as needing restore or reversibility checks
- `AGENTS.md` Operating mode: added the standing order; removed `destructive (rm/migrate/drop)` from the STOP+ask list (now scoped to actions outside the repo) and dropped the reversibility condition from the confidence rule
- still gated: secrets/auth changes, irreversible actions outside the repo, and the existing git revert bans
- decision: no restore/recovery gate for hotel content, floors, NPC/config, or state (over: keep ask-first on destructive - because the project is not finished and every earlier decision is explicitly mutable)

### new lobby: THE COURTYARD parti - 2026-09-20 19:21 UTC+7 (opencode, opencode/deepseek-v4.1-flash)
- user: "now you can build lobby difference now?" - rebuilt the wiped G with a NEW parti (old face was core-centre + S vestibule / E-W strip): THE COURTYARD, a central planted garden court with a ring of circulation around it
- program: south vestibule (2 door sets + 4-wide entrance) -> reception island facing the entrance + back office; public M/F restrooms + 5 dining tables north; open kitchen NW with 2 west street delivery doors; bar/lounge/sofa clusters west; wellness (treadmill/bathtub/shower) + elevator core east; BOH laundry/staff NE; 4 spawn zones (guest arrival, reception, kitchen, service)
- generated via temp `tests/_lobby.tmp.ts` (deleted same session): 73 objects, 50x80 tileStates; scripted checks (interior bounds, wall/door overlap, object overlap, engine BFS 3696/3696 walkable tiles reached) then atomic write
- verified: read-back validates (1 floor, 73 objects, 4 zones, 50x80); blueprint-schema + migrate + tower-integration (1 floor, 20/20 agents) + settings-completeness + verify:assets 22/22
- note: elevator core is physically present but inert - single floor, so the engine logs "portals exist on only 1 floor" (expected)
- assumption: kept the single-floor wipe state; no upper floors to connect the elevator

### harness universal move - 2026-09-21 (opencode, opencode-go/glm-5.3-flash)
- report format locked as markdown-file template (Changed/Decisions/Gaps/Verify, no tables, <2-file collapse) + audit/question variants - source of truth HARNESS.md
- verify.mjs drift subcommand: mid-task gate (empty-slot / no-ticks fail exit 1) + anchor line re-inject; plugin throws scheduled anchor every 10 edits (opencode only)
- decision: universal rules moved AGENTS.md -> HARNESS.md, AGENTS.md now digest + adapter zones (over: keeping full rules in AGENTS.md - because adopt copies HARNESS verbatim, kills cross-project drift)
- adopt.mjs scaffold + report-gaps skill updated to point at HARNESS.md; adopt smoke-tested end-to-end
- verified: verify.mjs check + table pass, drift 3 paths tested, adopt full run ok

### rail portable + spec runners - 2026-09-21 (opencode, opencode-go/glm-5.3-flash)
- plugin source moved harness/agents/opencode/ (+loader.js shim template); .opencode/plugins/ copy is a 3-line re-export; adopt --agents=opencode deploys the shim
- rail-spec.mjs: 10 regression scenarios on temp fixtures (gate lite/medium, drift 3 paths, anchor@10, check x3, adopt e2e) - real repo untouched
- ab-protocol.md: A/B measurement protocol (playground repo, 3 tasks x 3 runs x 2 conditions, process+outcome metrics, blind rubric) - runner ab-spec.mjs parked, see slot Hand-off
- verified: rail-spec 10/10, npm run lint, verify.mjs check

### ab-spec runner - 2026-09-21 (opencode, opencode-go/glm-5.3-flash)
- ab-spec.mjs built per ab-protocol.md: playground fixture builder (3 tasks = pre-seeded failing tests: multi-file/scope/pattern-reuse), conditions A (AGENTS digest + harness + plugin) vs B (one-liner), headless 'opencode run --format json' + objective metrics (tests pass, scope vs allowed, TODO delta, slot filled, pattern reuse, tool calls)
- smoke: both conditions measured on task 3 (A: slot filled=yes tests=yes; B: tests=yes) - full 18-run comparison is a user-ordered event, costs tokens
- decision: playground = synthetic mini JS repo with failing tests as task spec (over: copying the real hotel project - because objective outcome metric needs deterministic tests + zero contamination)
- rail-spec hardened: fixture stages its own empty slot (live slot leak caused 2 false FAILs when the real slot was filled)
- verified: ab-spec 2 smoke cells, rail-spec 10/10, npm run lint, verify.mjs check

### ab full comparison - 2026-09-21 (autopilot, opencode-go/glm-5.3-flash)
- 18/18 runs (3 tasks x 3 runs x 2 conditions) complete, 0 model errors
- verdict: NO outcome delta on this task set - tests pass 9/9 both, scope ok 9/9 both, pattern reuse 3/3 both; harness delivers process compliance only (slot filled 9/9) at +~1 tool call cost
- decision: scope metric fixed mid-study (staged-seed + untracked-dir collapse, 2 bugs) and ALL 18 runs rerun (over: keeping first batch - because first-batch scope numbers were all false, unusable)
- caveat: glm-5.3-flash on trivial tasks - harness value (gate/drift/anchor) targets weak models, hard tasks, long sessions; not exercised here
- verified: rail-spec 10/10 after git -uall fix in verify.mjs gitScope; metrics visible in ab-spec output

### harness efficiency pass - 2026-09-21 (opencode, opencode-go/glm-5.3-flash)
- decide-dont-stall: ask-first narrowed to secrets/auth + irreversible-outside + missing info; scope growth/dependencies/interface picks = decide + veto-able log (over: keep STOP+ask for scope - because reversibility already covers in-repo and asking stalls trusted models)
- HARNESS.md compressed 5254 -> 2514 tokens: Steps/Feature lane/thinking budget/calibration moved to harness/LANE.md (progressive disclosure, load only on multi-step work); fixed injection 6900 -> 4150 tokens (-40%)
- verified: verify.mjs check, rail-spec 10/10, opencode debug config still lists HARNESS.md (probe canary facts intact)

### lite pass - 2026-09-21 (opencode, opencode-go/glm-5.3-flash)
- HARNESS.md 2514 -> 2156 tokens: Enforcement compressed to 1 para (gate/anchor detail moved to adopt.md), report template moved to report-gaps skill (HARNESS keeps 1-line shape)
- decision: report template ownership = report-gaps skill (over: keep in HARNESS - because the skill is loaded at Done time anyway, the agent never reads the template twice)
- ANCHOR_EVERY_CALLS 10 -> 15 (tuned for strong models, rationale in rail.mjs comment); rail-spec anchor scenario updated to 15
- verified: rail-spec 10/10, npm run lint, verify.mjs check

### evidence audit - 2026-09-21 (opencode, opencode-go/glm-5.3-flash)
- verify.mjs audit: validates every file:line quote in slot + latest history entry against the working tree; exit 1 = quote points nowhere; --all scans archives (line drift = expected noise)
- decision: default scope = slot + latest entry only (over: scan everything - because old entries are frozen records whose line numbers legitimately drift as code moves)
- anti-fake: closes the fabricated-evidence gap (agent claiming file:line that does not exist); snippet-match interpretation remains out of scope (subjective)
- rail-spec: +2 scenarios (real quote passes / fabricated fails) = 12 total
- verified: rail-spec 12/12; audit --all on live repo flagged 1 expected basename-drift quote in archives

### modal ux improvements - 2026-09-22 11:37 UTC+7 (opencode, muse-spark-1.3-contributor-free)
- ModalShell close `x` -> `×`; Toolbar gear gains visible `Settings` text; Shortcuts Esc row covers closing dialogs
- WorkspaceModal titled `Workspace (Export / Import)`, import now confirms danger-style + echoes last filename
- SettingsModal: player-vocabulary labels/hints across all 4 tabs (`settingsFields.ts`), Street Rendering un-nested from Street section, Canvas instant-apply hint, `Ring` -> `Street width`, `On floor` -> `Show street on`
- AssetPickerModal count badge only when > 0 + footer Close; AssetEditModal footer autosave note + Close; FloorModal drops per-row Duplicate, adds Label-vs-Name hint, Draw toasts before closing
- NpcManagerModal orienting hint + always-visible focus-chance hint; DeployNpcModal `Walk speed` + hint, `Deployment:` heading, dropped focusin-select; origin modal titled `Save as New Asset` with size as text
- decision: `Walk speed` (over: `Preview speed` - because `useNpcSimulationCore.ts:211-212` feeds config speed into agent walk velocity); ImportSvg wired into AssetToolbar next to Browse (over: deleting the modal - because the `addSvgAsset` store path exists and the showcase kept it alive)
- verified: lint:bem pass (35 files, 0 violations); lint:css pass (35 files, 0 violations); typecheck pass (app + test + node)

### npc tags-tasks sub-tabs - 2026-09-22 11:37 UTC+7 (opencode, muse-spark-1.3-contributor-free)
- NpcManagerModal library view splits into Tags / Tasks sub-tabs with counts (`libView` + `libTabs`, reset to Tags on open); panels render full-width one at a time instead of side-by-side
- decision: sub-tabs inside Tags & Tasks (over: two top-level tabs - because the top-level Role Editor / Tags & Tasks split stays stable and the tab pattern matches NpcRoleDetail `role=tab` semantics)
- `addTask` jumps to the Tasks sub-tab so the new task is visible
- verified: lint:bem pass; lint:css pass; typecheck pass (app + test + node)

