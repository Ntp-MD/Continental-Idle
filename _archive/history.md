# History - shared cross-agent intent log

Entries only. Protocol + pattern live in `_archive/history-template.md` -
follow them when logging below.

## Entries (Doing - Finished (Agent, Model) + Detail Bullets)

### file-bridge setup - 2026-09-04 23:59 UTC+7 (opencode-agent, model unknown)
- bridge-status.json, bridge-task.json, bridge-feedback.json
- this board (history.md)

### door-entry fix - 2026-09-04 23:59 UTC+7 (opencode-agent, model unknown)
- door edge wins over overlapping wall in buildBlockedEdges
- Phase 18 in door-passage-engine suite

### queue patience fix - 2026-09-04 23:59 UTC+7 (opencode-agent, model unknown)
- front holds line
- transient crowd retries without blacklist

### interaction handoff fix - 2026-09-04 23:59 UTC+7 (opencode-agent, model unknown)
- 2s re-reserve cooldown so line advances

### wander no-idle-inside fix - 2026-09-04 23:59 UTC+7 (opencode-agent, model unknown)
- wander avoids interactable footprints

### npc preview controls moved from modal to right sidebar section - 2026-09-04 23:59 UTC+7 (opencode-agent, model unknown)
- controls live in the right sidebar, no modal

### npc+door audit - 2026-09-04 23:59 UTC+7 (opencode-agent, model unknown)
- engine core + door pipeline needs list

### audit fixes 1-7 - 2026-09-04 23:59 UTC+7 (opencode-agent, model unknown)
- yield-hold, diagonal passage, bounce backoff, admission guard, panel fallback, portal backoff

### door auto-close on in+out cycle + room-state doors - 2026-09-05 07:35 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- doors close after real use (in+out counts as done), hold-open when free, locked while occupied
- ajar state removed (caused half-open hover); unsealed double-bed walls
- verified: door-animation 18/18, live-hotel harness (doors shut tight 41-52%)

### queue engine - 2026-09-05 07:35 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- standalone queues, doorway guard, skip-full queues, 30s patience-timeout
- FIFO, admit-race, fuzz pins
- verified: npc-queue suite green

### review fixes - 2026-09-05 07:35 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- lastChooseTargetTick leak closed, waiting reasons on every event, portal throughput pin
- verified: suites + observe breakdown (25.7% waiting = healthy friction)

### social NPCs - 2026-09-05 07:35 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- chatting engine/policy, template lines, per-NPC canvas bubbles, soc tags
- verified: npc-social suite, 142 chats/10min live, economy intact

### hotel floor 1 layout + tag registry - 2026-09-05 07:35 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- 2 rooms with doors, reception, lounge, 3 rest-rooms; 16 assets tagged, roles bound
- verified: verify:assets zero warnings, interacting 2.7% to 25.4% live

### flatten+link fix Phases 1-4 + full-project compat check - 2026-09-05 07:37 UTC+7 (opencode-agent B, model unknown)
- merge behavior fields, single-member unlink, full-field duplicate, overlap warn

### arrival+mood plan completion - 2026-09-05 19:40 UTC+7 (Cline, model unknown)
- reviewed arrival-mood-deep-plan vs working tree: B1/B2/A1 verified done; completed missing A3 (arrival marker draw, 300-tick expiry, 50-mark cap) and A2 (street-side spawn-zone hint, isGuestRoleId dedupe)
- added test:arrival-latch (8 checks) + test:settings-completeness (10 checks) scripts, wired into test composite
- verified: typecheck, lint:bem, lint:css, test:unit 10/10, test:npc-social, verify:assets all green
- gap audit: prune moved out of event gate (tick-gated expiry), waitReasons.clear on deploy, ARRIVAL_TAG_TEXT un-exported
- implemented A4c entrance derivation (collectFloorEntrances, canvas+asset door parity with engine) + second validator hint (zones served but no street-connecting door); settings-completeness suite now 17 checks, all green
### core engine hardening per review - 2026-09-06 09:46 UTC+7 (Cline, model unknown)
- M1: options single-source - NpcEngine merges NPC_ENGINE_DEFAULT_OPTIONS + NpcEngineResolvedOptions type; removed scattered ?? fallbacks
- Me1/#1: merged wallBlocksEdge/doorBlocksEdge into segmentCoversEdge + single-pass buildEdgePartition (blocked+door, 2x fewer segment scans)
- #5: shared collectFloorWallSegments (assetUtils), used by engine layoutBuild + collectFloorEntrances
- Me4: removed per-tick releasedInteractions set (reused releasedThisTick) + fixed interacting-branch indent (C1)
- Me5: queueBuild edge-key Set replaced linear .some scans
- M2: policy role/furnished cache keys now include role.restrictedTags (config-edit stale-cache fix)
- tests/audit-behavior.ts: spread order fix (typecheck)
- verified: typecheck, npc-engine, npc-queue, npc-social, door-passage-engine 19ph, door-animation 22ph, asset-schema, arrival-latch, settings-completeness, unit 10/10

### hidden-bug hunt fixes (H1+H3) + H2 investigation - 2026-09-06 18:28 UTC+7 (Cline, model unknown)
- H1: street-zone hint now requires a street CELL CENTER inside the zone (engine spawn predicate parity) - sub-tile sidewalk zones no longer blessed as convention-met; +1 suite case (settings-completeness 18 checks)
- H3: unknown future wait reasons map to new 'unknown' mood (dim ring, excluded from legend) instead of 'bored' - reduces false "Bored" readings; unit test updated
- H2 (movement reservation lifecycles): investigated deeply - 3 distinct pre-existing holes (mid-move unclaimed cell, swap snap-in, diagonal corner-sweep). Attempted guards all REVERTED: they regressed test:npc-queue and did not fully eliminate corridor co-occupancy; movement arbitration rewrite needed as a separate planned change (candidate design recorded: swap only when both complete, dynamic no-corner-cut, release-on-leave claims)
- verified: typecheck, npc-engine, npc-queue 15ph, npc-social, door-passage 19ph, door-animation 22ph, settings-completeness 18, arrival-latch 8, unit 10/10; temp probes deleted
### deadcode / over-engineering cleanup - 2026-09-06 21:30 UTC+7 (Cline, model unknown)
- D1: removed dead clearDeployment() from sim core return (zero callers)
- D2/D3: un-exported scoreTarget (targetScoring) + isPostTargetTag (tagMatching) - internal-only, no external consumers
- D4: removed dead WanderMemory.clear() (zero callers)
- D5: useCanvasRuns no longer returns objDefMap (internal-only; objDef() closure keeps it)
- D6: removed dead syncIntervalMs host option (no caller ever passed it; fixed 250ms)
- N1: policy wander-memory map now sweeps dead agent ids every 1024 wander calls (bounded per-deploy growth)
- N3: shared spawnZoneAllowsRole() in domain/types replaces 4 duplicated zone-role predicate sites (layoutBuild filterNpcSpawnTiles, assetUtils floorHasSpawnZoneForRole + street hint, FloorModal isZoneRole)
- verified: typecheck, lint:bem, lint:css, npc-engine, npc-queue 15ph, npc-social, door-passage 19ph, door-animation 22ph, asset-schema, settings-completeness 18, arrival-latch 8, unit 10/10

### floor walkable door-save fix - 2026-09-07 10:50 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- FloorWalkablePanel save derives wall segments from gridEdges via edgesToWallSegments + reattachDoorModes (newly painted doors persist, doorMode kept in draft)
- save toast added (Walkable saved / Failed to save walkable); both save steps checked before success
- verified: lint:bem, lint:css, typecheck, test:wall-paint all green

### workflow state unify - 2026-09-07 11:21 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- .context/current-task.md is now the single live slot; _archive/handoff.md retired to pointer (floor-autosave entry archived verbatim inside), handoff-template.md retired
- session-handoff skill, history-template.md, install-intent.md installer, AGENTS.md wiring (slot ref, skill line, _archive append-only exception) updated to .context slot; history.md stays done-log
- verified: read-back + grep, zero live handoff-slot references remain; no src/ changes

### live slot moved to _archive - 2026-09-07 11:23 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- live slot moved .context/current-task.md to _archive/current-task.md per user directive; empty .context/ dir removed
- every consumer updated in same change: session-handoff skill, history-template.md, install-intent.md payloads, AGENTS.md wiring (scope line now: _archive holds workflow state only); past history entries left untouched
- verified: grep shows no live .context refs (only installer note + immutable past entry); no src/ changes

### floor-autosave - 2026-09-07 11:25 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- FloorWalkablePanel mirrors WalkableGridEditor watch(dirty)+debounce300ms autosave; save derives wall segments via edgesToWallSegments + reattachDoorModes; footer hint shows auto-saving state
- agent-side done, suites green (lint:bem, lint:css, typecheck, test:wall-paint); user retest of door paint pending at slot retirement - archived entry cleared with this log as its record

### modal header status - 2026-09-07 11:56 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- ModalShell gains `status` + `statusTone` props rendering shared `.modal__status` (success/warn/fail, borders only, hidden when empty) - all 10 ModalShell consumers inherit it
- NpcManager ad-hoc `npc__status-text` header slot migrated to the shared props (fail on invalid/missing default, warn on unsaved, success on saved); Walkable dirty state wired to header (warn while auto-saving, success when saved)
- UiShowcase ModalShell sample demos all three tones with a live switcher
- verified: lint:bem, lint:css, typecheck all green; zero refs to removed class

### footer status removed - 2026-09-07 13:41 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- FloorWalkablePanel #footer drops duplicated dirty/saved span, header status stays single source of truth; buttons row keeps right-align via existing .modal__footer rule, no CSS change
- verified: lint:bem, lint:css, typecheck all green

### walkable select-tool review - 2026-09-07 13:43 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- confirmed: activateTile paints walkBrush on every click in select mode (mousedown selects edge, click then paints tile) - FloorWalkablePanel.vue:268-271 vs parity WalkableGridEditor.vue:540-545 which never paints in door/select tab
- noted: select-mode hint copy describes door painting (line 394 v-else), Delete label ambiguous, no hover preview in select mode (same gap in parity file)
- no code changed, awaiting user pick of fix scope

### walkable select-tool fix - 2026-09-07 13:45 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- FloorWalkablePanel: activateTile paints only in walk mode (select clicks no longer dirty tiles + trigger autosave); select gets own hint copy; Delete renamed Delete doors; Clear Doors/Walls scoped to door mode (Outer Walls stays in both)
- parity checked: WalkableGridEditor already click-safe, its Delete/hint deltas left untouched (different toolbar architecture, needs separate approval)
- verified: lint:bem, lint:css, typecheck all green

### floor walkable select-edge visibility - 2026-09-07 13:52 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- FloorWalkablePanel: right/bottom/left v-if now includes isSelectedEdge, parity with top edge + WalkableGridEditor; selected edges render even with no wall/door under them
- verified: lint:bem, lint:css, typecheck all green

### walkable legend selected entry - 2026-09-07 14:05 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- FloorWalkablePanel legend gains Selected swatch (walk__swatch--selected, 2px solid accent-primary, mirrors --wall/--door pattern); WalkableGridEditor mirrored with walkablegrid__dot--selected gradient bar per parity rule
- select writes no door data (verified: updateTile returns after toggleEdgeSelection, save derives from gridEdges only) - the blue line users saw was the selection highlight (#1f6feb vs door #4493f8)
- verified: lint:bem, lint:css, typecheck all green

### walkable select tool rework - 2026-09-07 14:20 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- FloorWalkablePanel select now covers tiles + edges: click body toggles tile, drag box-selects tile rects, click near edge toggles edge; readout shows summary counts plus per-item kind (Tile R/C Walkable/Blocked, Edge R/C side Door/Wall/Empty); selected tiles get walk__cell--selected outline; clearEdgeSelection renamed clearSelection (clears both sets, local-only)
- no data-path change: selection stays outside dirty baseline, walk/door paint flows untouched; WalkableGridEditor not mirrored (separate approval precedent)
- verified: lint:bem, lint:css, typecheck all green

### walkable wall brush split - 2026-09-07 14:30 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- FloorWalkablePanel modes split walk/wall/door/select: new Wall brush via toggleWallAt (wall-only toggle, wall-off also clears its door so no silent door loss on save); Door keeps auto-wall; hover preview works in both (gold wall, blue door); action row shared across wall+door, per-mode hints
- verified: lint:bem, lint:css, typecheck all green

### walkable per-mode buttons - 2026-09-07 14:38 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- FloorWalkablePanel action row split per mode: Wall gets Outer Walls/Clear Walls, Door gets Outer Walls/Clear Doors, Select keeps selection tools only (Outer Walls dropped); full clear still available via footer Reset in any mode
- verified: lint:bem, lint:css, typecheck all green

### walkable door-delete resurrection fix - 2026-09-07 14:55 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- every wall segment is stored in TWO mirror grid cells, but delete/toggles mutated one side only; edgesToWallSegments merges with door-wins so the surviving mirror resurrected the door on autosave while toast truthfully said saved
- gridEditing gains pure mirrorTileEdge helper; FloorWalkablePanel applies toggleDoorAt/toggleWallAt/deleteSelectedDoors to both sides via updateMirroredEdge (out-of-range mirrors guarded)
- verified: temp round-trip proof (single-side resurrects all spans, dual-side removes exactly selected span, file deleted same session); test:blueprint-schema, lint:bem, lint:css, typecheck all green

### walkable asset mirror fix + delete removes walls - 2026-09-07 15:05 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- WalkableGridEditor: same single-side defect fixed (toggleDoorAt/toggleEdgeAt/deleteSelectedDoors dual-side via local updateMirroredEdge reusing domain mirrorTileEdge); wall-off also clears orphan door (zero persisted-behavior change, orphans were dropped on save anyway)
- FloorWalkablePanel Delete doors now removes wall + door on both mirrors; button relabeled Delete doors + walls, select hint updated
- verified: temp round-trip proof (deleted span vanishes entirely, neighbors keep doors; file deleted same session); test:blueprint-schema, lint:bem, lint:css, typecheck all green

### walkable save fixes B1-B4 - 2026-09-07 15:25 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- B1: useDebouncedCallback gains flush(); floor close() and asset hide flush when dirty; asset keep-editing branch re-arms timer (temp flush proof passed, file deleted same session)
- B2: isSaving entry guard + deep-watch edited-during-save flag + finally second-pass-or-baseline in both panels; Save button disabled while saving; failures keep status quo (stay dirty, no auto-retry - dropped the retry bonus to avoid hammering failing persistence)
- B3: floor resetWalkable clears both selection sets + box anchor; B4: asset clearAllEdges deletes orphan door flags
- verified: lint:bem, lint:css, typecheck all green

### harness full-engage bundle - 2026-09-07 15:55 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- scripts/hslot.mjs: slot CLI (new/tick/note/block/show/check/done) with 10-header validation, UTC+7 stamps, secrets scan, >3-file scope guard, HARNESS_ROOT hermetic demos
- scripts/hverify.mjs: git-status router to AGENTS.md Verify rows (vue/css to bem+css+typecheck, engine/domain+schema stay human-pick, scripts to eslint) + run mode stopping on first fail, bans reminder
- HARNESS.md story doc; AGENTS.md Verify pointer; package.json hslot/hverify/hcheck shortcuts
- verified: temp-root full lifecycle incl. negative paths (done-refused, secret-caught), real-tree route correct (domain file prompts test:blueprint-schema), eslint + prettier clean

### harness memory layer - 2026-09-07 16:15 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- scripts/hrecall.mjs: keyword retrieval over history (title x3, bullets x1, newest wins ties; --limit, --json with split agent/model); shares hslot parser via main-guarded export, zero duplication
- hslot compact [--older-than DAYS] [--dry-run]: rotates old entries to monthly _archive/history-YYYY-MM.md, undated entries kept, nothing deleted; hslot new gains --step seeding (found by testing: empty plan left tick with nothing to do)
- verified: temp-root scoring order/json/no-match, compact move + dry-run + idempotent re-run + archive contents; eslint + prettier clean

### hpack bundle + installer - 2026-09-07 16:35 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- scripts/hpack.mjs: versioned bundle (11 payload files + VERSION + MANIFEST.json, date-stamped) from repo sources, refuses non-empty out without --force, optional --zip via system tar
- scripts/harness-install.mjs (ships as install.mjs): copy-if-missing skills/scripts/templates, never overwrites live slot, package.json shortcuts, managed AGENTS.md markers, test:* detect; HARNESS.md portability section rewritten
- verified: fresh + lived-in temp projects (slot/history/custom shortcuts preserved, re-run fully idempotent, AGENTS block exactly once), post-prettier end-to-end lifecycle; eslint + prettier clean