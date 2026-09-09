# History - shared cross-agent intent log

Entries only. Pattern lives in `harness/harness.md` (History pattern) -
follow it when logging below.

## Entries (Doing - Finished (Agent, Model) + Detail Bullets)

- (empty - first finished task adds the first entry here)

### find old refer outdate - 2026-09-07 17:38 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- audit repo-wide grep for _archive leftovers left by partial rename
- fixed eslint.config.js ignore (harness/**/*.md so .mjs scripts still lint)
- fixed harness/scripts/harness-install.mjs default state-dir _archive -> harness + inline help comment
- fixed harness/HARNESS.md install command example (was mistakenly noted as INSTALL.md in slot)
- npx eslint harness/scripts/*.mjs --max-warnings 0 -> clean; npm run lint -> clean; npm run hcheck -> pass
- orphan _archive/WorldMap.vue (git-tracked, zero refs) flagged for user - destructive per AGENTS.md

### rename ref hygiene rule - 2026-09-08 09:24 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- autonomous-development skill now mandates git mv + grep old path/basename + same-change consumer updates
- review gate checks zero old-path refs; hcheck pass, stale grep empty

### block staged restore - 2026-09-08 09:31 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- AGENTS.md Bans + autonomous skill Step 3 now forbid checkout/restore/reset/stash/clean on tracked files, hand-edit revert only
- hcheck pass, ban grep 2 hits

### dedupe autonomous skill - 2026-09-08 10:10 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- Step 4 verify rows now point at AGENTS.md table instead of restating; Step 6 text rules point at ui-layout skill
- Step 3 helper list kept - no proper home, moving would shift pollution; hcheck pass

### harness skills.md layout - 2026-09-08 10:16 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- new harness/skills.md: placeholders <agents>/<skills>/<state> only, no self refs; harness connects to project AGENTS.md + SKILL.md via installer
- wired into HARNESS.md table + README layout; hcheck pass

### self-contained harness ecosystem - 2026-09-08 10:33 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- 4 skills git-mv to harness/skills/; hpack/AGENTS/agent/HARNESS/README rewired; cross-skill links relative
- dogfood: .opencode/skills regenerated as identical tracked copies (0 hash mismatches); hpack 14 files green; eslint clean; hcheck pass

### split universal vs project skills - 2026-09-08 10:44 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- harness/skills keeps 2 universals; normalize-audit + ui-layout project-owned in .opencode, never ship; hpack/installer/docs narrowed
- autonomous de-stained (generic dirs + patterns pointer); AGENTS.md gains Canonical patterns; hpack 12 files green; hcheck pass

### new harness from scratch - 2026-09-08 11:19 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- harness/ is now harness.md + task-context.md + history.md + scripts/verify.mjs; root AGENTS.md (slim) + skill.md (project domain)
- deleted 13 old files (HARNESS/skills.md/templates/skills/4 scripts/agent file/.opencode skills); universals folded into harness.md; no skill-tool discovery, no installer (copy folder = ship)
- verified: check pass, route prints table via markers, eslint clean, stale refs zero in live files

### simplify harness trio - 2026-09-08 11:35 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- 8 cuts, zero rules removed: dead sibling-guide ref, GAP dup, pitch noise, Adopt then-Work, merged Land+Read bullets, tightened Router line + history example
- safety dup (git ban in both files) kept deliberately - emphasis not duplication; check pass, route table intact

### merge data-schema draft - 2026-09-08 11:36 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- merged into skill.md with anchor verification: FOUR store modules, SVG v2 vars, AssetDef/CanvasConfig checklists, seeded-RNG rule all confirmed in code
- one fix: canvas settings UI is SettingsModal not Toolbar; sharpened vague store/SVG lines; check pass

### full reference check - 2026-09-08 11:42 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- 58 paths, 14 exports, CSS tokens/classes, npm scripts, markers all exist on disk
- fixed 1 stale: injected confirm() -> useConfirm() from @/composables/useConfirm
- reported not fixed: Decision Timeline pointer dangles (target archived); check pass

### harden for weak models - 2026-09-08 11:52 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- light loop section in harness.md (+ AGENTS pointer) for single-file fixes
- done-claim gate in verify.mjs check: all ticked + blank hand-off = fail; fresh/cleared slots still pass
- gate proven on 3 slot shapes via HARNESS_ROOT; eslint clean; check pass

### history rotation - 2026-09-08 11:58 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- verify.mjs compact keeps latest 20, archives older monthly; documented in History pattern
- proven on 25-entry temp fixture (20 kept + 5 archived); live history untouched (12 entries); eslint clean; check pass

### wide door split 1-vs-2 panels - 2026-09-08 14:15 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- doorPanelsData: >=2 tiles splits into 2 halves (fixed slideDir -1/+1, shared group, max 2); 1-tile stays single with doorSlideDir wall-side
- useCanvasRuns respects half, useDoorAnimation targets per group (occupancy/transit/approach/cycle)
- suites green: test:door-animation 22 phases, test:wall-paint, test:door-passage-engine; vue-tsc clean

### canvas door unit fix - 2026-09-08 14:15 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- useCanvasRuns fed px segments with tileSize 1 so every door split into halves; now passes px-per-tile as unitsPerTile
- 1-wide doors slide single into wall side again, 2/4-wide split apart; regression test in test-wall-paint
- test:wall-paint green

### 1x1 wall canonical big-bang - 2026-09-08 16:25 UTC+7 (cline, cline)
- normalizeWallSegments splits every ingress segment into 1-tile pieces (splitWallSegmentToTiles); MAX_WALL_SEGMENTS 2048->8192 post-split cap
- doorPanelsData merges collinear door pieces (mergeCollinearWallSegments) before halves computation; 3x1-tile door -> 2 halves shared group
- doorMode group ops: doorRuns/withDoorRunMode/withoutDoorRun/doorRunLabel in gridEditing; OriginSettingPanel + FloorModal list runs; store setWallDoorMode/removeWallDoor take id arrays; withSegmentDoorMode removed
- useWallPaint strokes emit N 1-tile wall objects via batched commit; legacy canvas wall objects keep their shape (paint emits 1x1 from now on)
- suites green: test full matrix + typecheck (3 tsconfigs) + lint:bem + lint:css; verify:assets 21 assets valid

### legacy wall data wipe - 2026-09-08 16:50 UTC+7 (cline, cline)
- user decision: wipe legacy wall data instead of migrating; removed flattened-2 asset (only wallSegments asset) from originAssets.data.ts
- removed 146 __canvas-wall__ objects + 3 flattened-2 objects from floorPlan.data.ts seed; no load-time wipe (paint feature stays, walls rebuilt 1x1)
- suites green: verify:assets (20 assets), test:migrate, test:blueprint-schema, typecheck; temp diagnostics deleted

### canvas wall tool -> cell plot - 2026-09-08 17:20 UTC+7 (cline, cline)
- useWallPaint reworked: click/drag plots nearest tile edge per cell (edgeAtPoint + mirrorTileEdge canonical keys); stroke mode paint/erase fixed at first edge; immediate floor mutation, one save per stroke
- EditorCanvas: wallAtEdge via wallRuns + segmentCoversTileEdge (locked walls flagged, plotting no-op); commit = save-only; dashed stroke preview removed
- test-wall-paint: plot paint/drag/erase/locked scenarios; suites green test:wall-paint, test:door-animation, test:door-passage-engine, typecheck, lint:bem, lint:css

### panel wall mode cleanup - 2026-09-08 17:35 UTC+7 (cline, cline)
- FloorWalkablePanel wall mode: Outer Walls button removed (plot tool is the way); door mode keeps it (perimeter walls under doors)
- Clear Walls now persists immediately via replaceCanvasWallSegments(floor, []) (was draft-only until Save); toast + saveBaseline
- typecheck, lint:bem, lint:css, test:wall-paint green

### floor walkable tile tools - 2026-09-08 18:25 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- FloorWalkablePanel remade tile-only: Walk/Wall/Door brushes paint tileStates, wallSegments + gridEdges + canvas wall saves dropped
- floor door tiles persist as TileState door, walkableGrid counts walkable + door per canonical consistency rule
- verify router suites green: lint:bem + lint:css + typecheck

### edge wall system removed - 2026-09-08 19:40 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- walls/doors are cell tiles only: deleted gridEditing, useWallPaint, useCanvasWallStyle, useDoorAnimation, 3 wall/door test suites
- canvas Draw Wall plot, grid Doors tab, floor/asset door lists, wall color/thickness settings removed; engine blockedEdges/doorEdges/door-passage events removed; queues anchor on tile-door cells; entrances derive from ring-crossing door tiles
- suites green: typecheck (3 configs), lint, lint:bem, lint:css, npc-engine/queue/corridor/arrival/social, blueprint/asset/sync/migrate/settings-completeness, verify:assets

### floor wall/door erase marquee - 2026-09-08 20:22 UTC+7 (cline, cline)
- FloorWalkablePanel: Walk/Wall/Door/Erase all use ONE shared drag-cover gesture - mousedown starts the marquee, dragging extends it, release commits the rect
- paint tools fill the covered rect with the brush (click = 1x1); Erase toggles tiles - wall/door -> walkable, walk -> wall (blocked), so painted walk tiles can be unplotted; live dashed preview: walk__cell--cover (accent-primary) paint, walk__cell--erase (accent-red) delete
- reuses tile editor drag pattern (mousedown start / mouseenter extend / grid mouseup+mouseleave commit); picking any brush clears erase mode; grid user-select none; hint + aria updated
- verified: typecheck (3 configs), lint:bem, lint:css green

### tile tools moved to toolbar - 2026-09-08 21:15 UTC+7 (cline, cline)
- Walk/Wall/Door/Erase moved from FloorWalkablePanel (deleted) into main Toolbar.vue as 4 tile-brush buttons; CRUD follows store.state.currentFloorId so actions apply to whichever floor is selected
- new useCanvasTilePaint composable: window-level drag-cover gesture (mousedown start / mousemove extend / mouseup commit) with live preview rect; brush() from store.state.tileBrush, onCommit -> store.paintFloorTiles(currentFloorId, brush, rect)
- store: state.tileBrush:TileBrush|null, setTileBrush() in mode.ts (clears selection), paintFloorTiles() in floors.ts (resolves states, clamps to building rect excluding street, applyTileBrush, force street walkable, rebuilds walkableGrid, saves)
- EditorCanvas: useCanvasTilePaint wired; onSvgMouseDown delegates to tile paint when brush active (skips selection/pan); renderWalkableOverlay shows when tileBrush active; preview rect rendered with editor__tile-preview--{brush} classes
- domain/types: TileBrush='walkable'|'blocked'|'door'|'erase', applyTileBrush (erase toggles walk<->blocked), resolveFloorTileStates, tileStatesToWalkableGrid
- FloorModal: no longer references FloorWalkablePanel; streetTiles computed + Edit Walkable button removed
- verified: typecheck (3 configs), lint:bem, lint:css, verify check pass

### dead ref cleanup after wall removal - 2026-09-08 20:58 UTC+7 (cline, cline)
- dropped 3 dead npm scripts from package.json (test:wall-paint, test:door-animation, test:door-passage-engine -> deleted test files); all remaining tsx test targets verified to exist
- skill.md grid parity note no longer references removed edge previews / walkable-grid domain module; aligned to domain types normalize helpers
- audit confirms no dead wall refs in live src (wall* symbols only in history log + absence-guard tests); svg-role__wall, doorRequired/tileStates door, observe-hotel kept (live features)
- verified: route clean, npm script target existence check, hcheck pass
