# History - shared cross-agent intent log

Entries only. Pattern lives in `harness/harness.md` (History pattern) -
follow it when logging below.

## Entries (Doing - Finished (Agent, Model) + Detail Bullets)

- (empty - first finished task adds the first entry here)

### history log rule tightened - 2026-09-09 11:11 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- HARNESS.md History pattern now allowlists loggable work (implemented changes + decisions taken) and bans questions, no-change audits, untaken recommendations, parked ideas
- user correction: agent was logging every inquiry; persists for the session
- verified: route (md-only change, nothing runnable; bem/css/typecheck rows belong to prior-task dirt, proven green); check pass

### prune history noise - 2026-09-09 11:11 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- removed 4 no-change audit/parked entries per the tightened log rule; verified: entry headers intact; check pass

### canvas wall color preference - 2026-09-09 13:23 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- CanvasConfig.wallColor (optional color) + CANVAS_FIELD_SPECS + setCanvasWallColor + SettingsModal Walls row; EditorCanvas blocked tiles use it with CSS fallback; editor-only like labelColor, no sync mirror
- suites green: lint:bem, lint:css, typecheck (3 configs), test:blueprint-schema, test:migrate

### settings apply bottom-align - 2026-09-09 13:26 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- SettingsModal Canvas Size Apply button gets scoped settings__apply--bottom (margin-top auto), bottom-aligns with inputs in the top-aligned row
- suites green: lint:bem, lint:css, typecheck (3 configs)

### object tile orphan fix - 2026-09-09 13:35 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- EditorCanvas object-grid overlay reused floor editor__tile--walkable/blocked (orphan obj- prefix dropped) + wallColor style override + v-memo dep; zero new classes
- suites green: lint:bem, lint:css, typecheck (3 configs)

### ring paint wins - 2026-09-09 13:45 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- paintFloorTiles: street-ring walkable forcing moved before brush so explicit wall/door/erase paint sticks in the ring (also unblocks ring-crossing entrance doors); crud-reference row updated
- verified: temp ring-paint probe green (deleted same session), test:blueprint-schema + test:sync-payload green, typecheck clean

### review chain rule - 2026-09-09 13:50 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- harness.md Step 6 Review gains chain check: each changed function lists direct callers/callees with touched-or-unaffected verdict; deeper hops only on contract change
- verified: check pass

### lan save 403 fix - 2026-09-09 14:05 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- vite.config.ts origin guard now trusts private-LAN IPv4 (10/8, 172.16/12, 192.168/16); LAN saves no longer 403-revert every paint; internet origins still blocked
- verified: temp origin test green (deleted same session), typecheck (3 configs) clean, eslint clean

### wall door visibility toggles - 2026-09-09 14:15 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- editor__controls gains Walls/Doors buttons (showWallTiles/showDoorTiles in viewToggles, persisted); floor overlay renders visibleWalkableRuns, object blocked cells hide with Walls off; no new classes
- verified: lint:bem, lint:css green, typecheck (3 configs) clean

### wall door overlay decoupling - 2026-09-09 14:25 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- wall/door tiles now render on their own toggles (renderWallOverlay/renderDoorOverlay); Walk master gates walkable fills only; brush-active still shows all while painting
- verified: lint:bem, lint:css green, typecheck (3 configs) clean

### erase select-delete rework - 2026-09-09 14:40 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- erase brush marquees a persistent selection (no release commit); Delete clears it to walkable via paintFloorTiles, Esc cancels; paint brushes unchanged; crud-reference erase rows updated
- verified: temp defer-mode test green (deleted same session), lint:bem, lint:css green, typecheck clean

### erase button rename - 2026-09-09 14:45 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- Toolbar Erase label becomes Erase wall&door (+ matching aria-label); verified: lint:bem, lint:css, typecheck clean

### wall preview color - 2026-09-09 14:55 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- editor__tile-preview--blocked fill/stroke red to accent-primary; erase preview + committed fill stay red
- verified: lint:bem, lint:css green, typecheck clean

### erase selection lifecycle fix - 2026-09-09 15:20 UTC+7 (cline, cline)
- chain review found: erase selection survived floor switch (Delete erased wrong floor) and resurrected after brush cycle; dead `streetTiles` opt left after clamp removal
- EditorCanvas watches `currentFloorId` + `tileBrush` -> clearTileSelection; `streetTiles` opt removed from useCanvasTilePaint + wiring; crud-reference erase row updated
- street-ring paint vs engine (`isTileWalkable` ignores ring tileStates) accepted for now: ring tiles stay cosmetic/blocked per current contract - revisit if ring walls/doors must gate NPCs
- verified: lint:bem, lint:css, typecheck (3 configs)

### door tile animation - 2026-09-09 16:05 UTC+7 (cline, cline)
- cell door animation (replaces deleted edge-system animation): groupDoorCells pure helper in domain/types groups connected door cells into slide halves (slideDir -1/+1, axis = longest bbox side)
- new useDoorTileAnimation: NPC dot within group bbox + 1 tile pad opens the group; auto-closes 500ms after NPCs leave; transient only - not persisted, not synced, engine pass-through unchanged
- EditorCanvas: floor door cells render in their own non-memo group with CSS transform/opacity transition (220ms); visibleWalkableRuns drops door runs; v-memo deps updated; zero new classes
- object tileStates door cells (queue anchors) intentionally not animated
- verified: temp door-group test green (deleted same session), lint:bem, lint:css, typecheck (3 configs)

### tile resize rescales walkable grids - 2026-09-09 16:40 UTC+7 (cline, cline)
- user-reported: changing tileSize left tileStates/walkableGrid at old grid dims (resizeCanvas only snapped objects) - overlays/engine read stale indices at wrong pixel positions
- new rescaleFloorWalkable pure helper in domain/types: nearest-cell mapping old grid -> new rows/cols, rebuilds walkableGrid via tileStatesToWalkableGrid, no-op when dims match or no data; handles legacy grid-only floors
- resizeCanvas computes rows/cols from new w/h/tileSize and applies rescale to every floor before object snapping
- verified: temp rescale test green (deleted same session), lint:bem, lint:css, typecheck (3 configs), test:blueprint-schema, test:migrate

### npc dot size setting - 2026-09-09 17:05 UTC+7 (cline, cline)
- user-requested: NPC dot size split from tile size - new npcDotSize EditorSettings field (spec min 2 max 12, default 4, normalize/auto-UI via EDITOR_FIELD_SPECS)
- useNpcOverlayDraw takes dotSize source: dot radius + proportional stuck-cross/lost-badge; EditorCanvas wires editorSettings.npcDotSize
- SettingsModal Display > Overlay Sizes gains "NPC dot radius" row; editor-only setting, no sync payload impact
- verified: temp npc-dot-size test green (deleted same session), lint:bem, lint:css, typecheck (3 configs), test:settings-completeness, test:blueprint-schema

### settings tab consolidation - 2026-09-09 17:30 UTC+7 (cline, cline)
- user-approved option A: street ratios (dash/gap/sidewalk) moved from Scene tab into Canvas tab Street section next to ring controls; Ruler group moved Scene -> Display; Scene tab removed (4 tabs remain)
- street ratio rows bind editor draft + applyEditorField (immediate apply, min/max from EDITOR_FIELD_SPECS); no new classes, zero data changes
- verified: lint:bem, lint:css, typecheck (3 configs)

### erase marquee cell guide - 2026-09-09 17:55 UTC+7 (cline, cline)
- user-requested guide back for zone-based erase: wall/door cells inside the erase marquee highlight red (45% accent) while dragging and while selection persists
- eraseGuideRects computed intersects walkableRuns (blocked+door) with tilePaintPreview rect (live drag or stored selection); rendered in own non-memo group before preview outline
- scoped class editor__erase-guide added (single component, user-approved); crud-reference erase row updated
- follow-up per user feedback: erase preview fill removed (fill: none) - dashed border + selected-cell highlights only
- user-requested erase/select coexistence: while Erase brush is active, mousedown on an object selects it (existing box-select flow); mousedown on empty tile starts the erase marquee; Walk/Wall/Door brushes stay exclusive
- objectAtLocalPoint hit-test (topmost object contains point) in EditorCanvas.onSvgMouseDown; crud-reference erase row updated
- user-requested: Select mode now selects wall/door tiles too - box marquee with no object hits sets the erase-selection (reuse setSelection from useCanvasTilePaint, brush-match guard relaxed; mousedown clears prior selection via onBoxSelectStart) - highlight + Delete work without the Erase brush
- user-approved: Erase button removed from Toolbar, Select renamed "Free tool" - tile marquee/delete lives in Free tool only; deferCommit opt + erase branch + objectAtLocalPoint deleted (dead code); paint commit now clears stale tile selection; internal 'erase' TileBrush marker kept for selection semantics
- verified: lint:bem, lint:css, typecheck (3 configs), test:blueprint-schema
- follow-up per user feedback: zone border shows only while dragging (tilePaint active gate on preview outline); after release only the selected-cell highlights remain

### harness context slot portability - 2026-09-09 19:04 UTC+7 (cline, cline)
- new harness/context.md shared-language glossary (22 locked terms from skill.md + player-vocabulary rule); Phase B + AGENTS.md read chain/canonical patterns rewired to point at it
- slot protocol now write-through + silent: append on user order/context shift, finding/root cause, decision options or landed choice - then resume; clear only when fully done; trigger comment embedded in task-context.md empty shape
- portability: Adopt section gains glossary-rewrite + agent-pointer steps; one-line .clinerules + .github/copilot-instructions.md pointers added
- todo #4 (Cline token usage UI) skipped per user choice
- verified: hcheck pass; route: no code changed - nothing to run

### selection highlight blue - 2026-09-09 19:30 UTC+7 (cline, cline)
- user-requested: selected-cell highlight (Free tool marquee, editor__erase-guide) blue instead of red - accent-red 45% -> accent-blue 45%, no new class
- object selection overlay stays accent-primary; dashed erase marquee border left red (not part of the ask)
- verified: lint:bem, lint:css, typecheck (3 configs)

### hotel ground floor build - 2026-09-09 19:55 UTC+7 (cline, cline)
- user-picked scope: full ground floor - outer walls + inner walls (A x=38 / E y=30 / F y=44 left, B y=26 / C y=44 right), 9 door gaps (incl. street entrance x52..53 y58), 6 rooms furnished: Lounge, Laundry, WC, Bar-cafe, Gym, Reception hall (desk facing entrance)
- floorPlan.data.ts: 496 blocked wall tiles + door tiles in tileStates, walkableGrid derived (door=walkable), 61 objects from the 20 existing assets (px, tile-snapped, rotation 0), entrance spawn zone (750,795,75,75); street ring 8 tiles untouched
- temp generator tests/_hotel.tmp.ts (tsx) with built-in validation: dims, building bounds, wall/door overlap, object-object overlap, BFS connectivity 4038/4038 from spawn + all doors reachable; deleted same session
- data audit: single boundary floorPlan.data.ts -> normalizeFloorWalkable; dims-matched grids; no gaps, no anti-patterns
- verified: verify:assets (20 valid), test:blueprint-schema, test:migrate, hcheck pass; eslint n/a (data file in ignore pattern)

### lobby densify 60 npcs - 2026-09-09 20:20 UTC+7 (cline, cline)
- user-requested: denser furniture + ~60 NPCs in lobby
- floorPlan.data.ts: 61 -> 127 objects (added tables+chairs rows, sofas, benches, washers row 2, WC row 2, treadmill row 2, bar stools, vending machines); BFS connectivity 3936/3936 from spawn
- npcSettings.data.ts: pool guest 26->45, chef 9->5, bartender 8->5, receptionist 6->5 = 60 total; fixed stale floorIds floor-6be566f0cf -> floor-f6bc12edb3 x3 (root cause NPCs never spawned - old floor id no longer exists)
- temp generator v2 deleted same session
- verified: verify:assets (0 warnings), test:settings-completeness, test:blueprint-schema, test:migrate, stale-ref grep 0

### aligned grid re-layout - 2026-09-09 20:40 UTC+7 (cline, cline)
- user feedback: furniture not aligned in straight lines - full re-layout on strict grid rules
- rules applied: same row = same y / same column = same x, uniform pitch (lounge+bar columns pitch 8/6, washers pitch 2, treadmills pitch 4), mirrored pairs exact around room centers (bar/gym center x68, lounge x23, reception x52.5)
- lounge: sofa row y9 + table/chair rows y14/y22 on columns x13,19,26,32 + bench row y28; laundry: washer grid 2x8 + bench row y38 pitch 4; WC: 2 identical rows y46/y54; bar: counter centered (67,10) + 12 table sets rows y16/y21 + vending corners; gym: 24 treadmills 2 rows x 12 columns + center walkway x65-71; reception: desk (49,48) centered on entrance + mirrored waiting row y55
- 140 objects, BFS 3935/3935 from spawn; temp generator v3 deleted same session
- verified: verify:assets (0 warnings), test:blueprint-schema, test:migrate, test:settings-completeness, hcheck pass

### 5 adjacent bathrooms - 2026-09-09 21:00 UTC+7 (cline, cline)
- user-requested: 5 bathrooms side by side replacing the single WC zone (x9..37, y45..57)
- walls x14/x20/x26/x32 y45..57 divide 5 rooms (5x13 each); doors on wall F at x11,17,23,29,35 + east door (38,52) kept; 13 doors total
- identical interior per room: shower y46 / washbasin y49 / toilet y52 on room center column; 151 objects total
- BFS 3865/3865 from spawn incl. per-bathroom reachability check; temp generator v4 deleted same session
- verified: verify:assets (0 warnings), test:blueprint-schema, test:migrate, hcheck pass

### room system derive + occupancy gate - 2026-09-09 21:45 UTC+7 (cline, cline)
- approved plan C refined via Matt Pocock to-spec/to-tickets (vertical tracer-bullet slices, single NpcEngine seam, out-of-scope declared)
- new ROOM_TYPE_SPECS registry (15 hotel room types incl. dormant ones: bedroom/bathroom/spa private; gym/bar/restaurant/laundry/... open; hall fallback) + resolveRoomType in domain/types - privacy from room type, AssetDef untouched
- new engine/npc/rooms.ts deriveFloorRooms: flood fill walkable map, door tiles = boundaries (belong to no room), row-major stable ids; buildNpcEngineLayout attaches roomId/roomType/roomPrivate (optional fields) to interaction targets
- NpcEngine: claimedRooms map; gate in canReserve (occupied private room excluded from chooseTarget via existing filter), claim in reserve, release in releaseReservation (single choke point) + reset; open rooms unchanged
- permanent regression tests in test-npc-engine.ts (private claim/redirect/release-via-removeAgent, open shared capacity, layout derive 2 walled rooms + door boundary)
- chain: additive-only; syncedPayload/AssetDef/editor/pathfinding untouched; queueBuild untouched (queue-at-fixture v1; outside-door relocation = follow-up)
- verified: test:npc-engine green (incl. new 'Room occupancy gate checks passed'), typecheck (3 configs), lint, hcheck pass

### realistic room proportions - 2026-09-09 22:10 UTC+7 (cline, cline)
- user feedback: room width ratios not realistic -> full re-layout at real-world scale (1 tile = 0.5m, plot 53.5 x 33.5m)
- new partition per hotel standards: lobby 105m2, restaurant 247m2 (~120 seats), kitchen 86m2, bar-lounge 167m2, gym 53m2, laundry 66m2, staff 25m2, storage 25m2, 5 bathrooms 2x4.5m (9m2 each); 2m-wide main/entrance/service corridors (realistic hotel corridor width), no dead-end rooms
- walls 652 tiles, 18 door gaps (5 bathrooms + 13 room/street doors), 126 objects re-placed to fit smaller rooms
- BFS 3799/3799 from entrance + per-room reachability checks; temp generator v5 + debug script deleted same session
- verified: verify:assets (0 warnings), test:blueprint-schema, test:migrate, hcheck pass

### autopilot mode in harness - 2026-09-09 22:30 UTC+7 (cline, cline)
- user-requested: mode where agent decides instead of asking
- new harness.md section: activation via user `autopilot` / `autopilot off`; mode marker `Mode: autopilot` on slot Mission line 1 survives context cutoff (RESUME restores); decide-don't-ask including scope>3 files, new deps, Phase D picks
- decision rule: reversibility > repo pattern > simplicity; every non-trivial decision logged in history as decision bullet (choice + rejected alternatives + reason); done report opens with decision log for user veto
- hard stops remain: destructive git, persisted-store deletion, secrets/auth, irreversible outside-repo
- verified: hcheck pass

### 5-floor hotel build - 2026-09-09 23:05 UTC+7 (cline, cline)
- autopilot task: 5 floors per user (top = owner's floor, others agent-decided)
- decision log: [1] 30 guest rooms split F1-F3 x10 (4x11m incl. en-suite bath) over bigger/fewer rooms - program formula ceil(60/2)=30 and floor plate fits 10x(8w+1) exactly; [2] F4 = penthouse (master 176m2 + living 210m2 + office + private dining + kitchenette + powder) over more guest rooms - owner floor per user; [3] new elevator-1 portal asset (21st asset) on all 5 floors over stairs-only - enables real NPC cross-floor travel (guest role already targets 'portal'); [4] guest floor south bands = housekeeping/linen/lounge/storage/mechanical back-of-house over cramming more rooms - realistic hotel programming
- floors: G lobby (elevator in lobby) + F1-F3 guest (10 rooms each, 30 total = program target) + F4 penthouse
- room system integration: 30 bedrooms auto-detected (beds tag 'living') -> private 1-occupant rooms; 30 en-suite bathrooms auto-detected private; portals connect all floors
- per-floor BFS validation 100% (G 127 obj, F1-F3 71, F4 45); temp generator v6 + debug script deleted same session
- verified: verify:assets (21 valid, 0 warnings), test:blueprint-schema, test:migrate, test:sync-payload (exit 0), test:settings-completeness, test:npc-engine, hcheck pass

### blueprint save 413 fix - 2026-09-10 10:45 UTC+7 (cline, glm)

- vite MAX_REQUEST_BYTES 1MB -> 5MB (floorPlan.data.ts 1.59MB exceeded; response/module caps already 5MB); persistence.ts fails fast on 413, retry loop skipped (payload cannot shrink)
- user-reported: floor delete threw ErrorBoundary after 3x retry hang; suites green: typecheck, test:blueprint-schema, hcheck

### floor one-click clear - 2026-09-10 10:45 UTC+7 (cline, glm)
- clearFloor(id) store CRUD (empties objects, keeps floor/tiles/zones, no save when empty) + FloorModal footer Clear button (useConfirm, flag--danger, disabled when empty) + crud-reference row
- data audit PASS: objects:[] canonical shape, normalizeBlueprintDataFile path unchanged, no gaps; suites green: typecheck, lint:bem, lint:css, test:blueprint-schema, hcheck

### data audit fixes (F1+F2) - 2026-09-10 13:08 UTC+7 (cline, glm)
- full-project read-only data audit (skill.md Steps 1-5) across 20 boundaries: verdict PASS, 5 minor findings (F1-F5)
- F1: `syncNpcConfigToState` now runs `normalizeNpcConfig` before storing (fallback raw on failure) - single entry point; both modal callers already pre-normalized, zero behavior change
- F2: new `resolveDefaultWalkable` (domain/types.ts) replaces 3 inline `?? true` / typeof defaults (syncedPayload, migrate, layoutBuild)
- docs/crud-reference.md syncNpcConfigToState row updated (CRUD gate); test-blueprint-schema gains resolveDefaultWalkable block
- suites green: typecheck, test:blueprint-schema, test:migrate, test:sync-payload (EXIT=0), hcheck

### data audit fixes (F3-F5) - 2026-09-10 14:05 UTC+7 (cline, cline)
- original F3-F5 wording lost with prior agent context; re-derived via fresh skill.md Steps 1-5 pass over the 20 boundaries (same verdict PASS)
- F3 decision: `buildSyncedObject` now resolves through `resolveObjectDef` (single resolution path) over per-field normalize* calls - the old inline copy duplicated resolveObjectDef and skipped rotation, so a rotated object's walkableGrid/tileStates/interactSpots left the sync DTO un-resolved while its w/h were already rotation-swapped; unrotated objects byte-identical, new rotated-tileStates assertion in test-sync-payload
- F4 decision: migrate() drops raw `typeof` re-reads of resolution-owned fields (w/h/radius/padding/labelPadding/rx/fillColor) - normalizeObject overwrote them from the asset immediately after; keeps `label`/`collapsed` (instance-owned, resolution does not touch); dropped now-unused normalizeCornerRx import
- F5: buildSavedLayout replaces `as ObjectData` raw cast with a typed map callback return (plain annotation, no cast)
- reported-not-fixed: scripts/observe-hotel.ts:38 `floorPlanData as never` raw cast (dev script, not a runtime boundary)
- suites green: typecheck (3 configs), test:migrate, test:sync-payload, test:blueprint-schema (all EXIT=0), hcheck pass

### cline chat context meter - 2026-09-10 15:14 UTC+7 (cline, cline)
- ClineChat.vue toolbar ctx chip: context used = input + cacheRead + cacheWrite tokens from the latest CLI `usage` event (run_result `usage.inputTokens` fallback when no usage event arrived); warn >=70%, danger >=90% or when finishReason / done reason is `context_window_exceeded`
- new settings field "Context limit (tokens)" persisted in cline-chat-settings-v1; chip shows used / limit + % + mini bar; resets on New chat
- verified: npm run lint:bem (34 files pass), npm run lint:css (34 files pass), npm run typecheck (3 configs) green; live smoke dev server /__cline/config + /__cline/history ok

### cline chat usage strip (day/week/month limits) - 2026-09-10 (cline, cline)
- usage strip above composer replaces toolbar ctx chip: Session ctx cell (tokens vs context limit) + Day/Week/Month spend cells with live bars, warn >=70%, danger >=90%
- per-period limits persisted in cline-chat-settings-v1 (dailyLimit/weeklyLimit/monthlyLimit, $ inputs, 0 = off); resets: local midnight / Monday 00:00 / 1st of month; countdown tick every 15s (onUnmounted cleanup)
- spend tracked from CLI usage-event cost: liveCost accumulates during run, commits to localStorage cline-chat-usage-v1 on run_result (totalCost preferred) or exit; 40-day / 500-record retention; live in-run cost shows on top of committed totals
- verified: npm run lint:bem (34 pass), npm run lint:css (34 pass), npm run typecheck (3 configs), harness verify check pass (slot cleared)

### cline chat usage gauges in topbar - 2026-09-10 (cline, cline)
- usage strip moved from above composer into the toolbar, restyled as 4 compact radial SVG gauges (ctx / Day / Week / Month): ring arc = pct of limit, % in dial center, label + value + reset countdown beside; warn >=70% gold arc, danger >=90% red arc (ctx also on context_window_exceeded)
- fixed latent bug: ctxClass still emitted removed cline-chat__ctx--* modifier names after the strip edit, so ctx cell never got warn/danger colors - now emits gauge modifiers
- verified: npm run lint:bem (34 pass), npm run lint:css (34 pass), npm run typecheck (3 configs), harness verify check pass (slot cleared)

### mod-cli idea doc - 2026-09-10 17:35 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- expanded docs/mod-cli.md stub (2 lines) into full idea + REQ-1/2/3 in Thai: IDE-like CLI MVP (chat + diff approve + output first), setup wizard (engine -> model provider -> key -> default model -> test connection), portable-folder first then npm global
- locked correction: Cline/opencode are agent engines (subprocess/server), OpenRouter is the model provider - mod-cli is shell + router, never a second engine
- verified: route (docs-only change, nothing runnable for this file), check pass (no secrets)

### mod-cli decouple from harness - 2026-09-10 17:40 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- user correction (persists): docs/mod-cli.md is a standalone idea, not tied to this project - stripped 3 harness-coupled lines (copy-folder-of-harness, test:<name> gate, test:mod-cli suite) into neutral wording
- verified: check pass (no secrets); route suites shown belong to prior-task dirt, not this change

### cline chat standalone css - 2026-09-10 16:46 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- src/dev/ClineChat.vue is now self-contained: cline-chat__* renamed to mod-cli-chat__*, own --mod-cli-* tokens on the root (dark values copied from variables.css), own button/input/select/textarea/label base in scoped style; shared size--*/flag--*/empty deps removed (replaced by __btn/--fit/--active/--danger, __session--active, __empty); storage keys + logic untouched
- verified: lint:bem pass, lint:css pass, typecheck (3 configs) clean, hcheck pass (22-file scope warning is prior-task dirt, not this change)

### modcli rename - 2026-09-10 16:46 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- renamed src/dev/ClineChat.vue -> ModCLI.vue + clineBridge.ts -> modCliBridge.ts (plain move, both untracked); all Cline* symbols -> ModCli* (types, fetch/stream/stop fns, clineVersion), brand/placeholder/empty/exit strings -> ModCLI; App.vue now mounts <ModCLI> on ?modcli
- kept deliberately: /__cline/* endpoints + clineBridgePlugin (provider adapter plumbing), provider default 'cline', cline-chat-settings/usage-v1 keys (no user data loss), datalist ids
- verified: lint:bem pass, lint:css pass, typecheck (3 configs) clean, hcheck pass (22-file scope warning is prior-task dirt)

### mod-cli package folder - 2026-09-10 16:46 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- new mod-cli/ package (user-picked option 1): src/ModCLI.vue + src/modCliBridge.ts moved from src/dev, minimal package.json (name mod-cli, peer vue); App.vue imports ../mod-cli/src/ModCLI.vue
- verify coverage extended, not weakened: tsconfig.app.json include gains mod-cli/**/*.ts|vue (listFilesOnly proves both files in program), lint-bem + lint-css-compliance scan src + mod-cli with existsSync guard
- verified: lint:bem pass (34 files), lint:css pass (34 files), typecheck (3 configs) clean, hcheck pass (24-file scope warning is prior-task dirt + this approved scope)

### mod-cli handoff brief - 2026-09-10 16:46 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- new docs/mod-cli-handoff.md: handoff brief for another agent (done-state, file map, 4 remaining tasks in order, hard rules, verify commands, copy-paste prompt)
- verified: hcheck pass (docs-only, nothing runnable; scope warning is prior-task dirt + approved scope)
