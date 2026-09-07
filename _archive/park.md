# Park - shared cross-agent intent log

## Protocol

- mode: file-bridge, no MCP server
- clock: all Started/Finished stamps in UTC+7 (Asia/Bangkok), format `YYYY-MM-DD HH:MM UTC+7`
- Builder writes `bridge-task.json` + sets `READY_FOR_REVIEW`
- Reviewer writes `bridge-feedback.json` with `PASS` / `FAIL`
- Status lives in `bridge-status.json`
- Max iterations: 10, then set `BLOCKED` and stop

## Pattern (how to log)

- Shape per finished task:
  `### <doing> - <finished> (<agent>, <exact-model-id>)` followed by `- <detail>` bullets (what changed + how verified, no essays)
- Name states the exact model id/version, never a bare nickname; unrecoverable models use `(<agent>, model unknown)`
- Stamp: `YYYY-MM-DD HH:MM UTC+7` (Asia/Bangkok - convert before writing, never log UTC/Z/other zones)
- Log only when done, never in advance; extend the same block instead of adding a second one
- Times must be real (system clock) - never invent or round times for another agent's rows
- Migrated rows (pre-clock-rule, exact times unrecoverable - bridge logs were reset): day bound `23:59`, not exact clock time
- Example:
  `### example task - 2026-09-05 06:40 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)`
  `- changed X in file Y`
  `- verified with Z (all green)`

## Entries (Doing - Finished (Agent, Model) + Detail Bullets)

### file-bridge setup - 2026-09-04 23:59 UTC+7 (opencode-agent, model unknown)
- bridge-status.json, bridge-task.json, bridge-feedback.json
- this board (park.md)

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