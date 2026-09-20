# History archive - 2026-09

### dead asset cleanup (public/) - 2026-09-12 11:45 UTC+7 (cline, model id n/a)
- user order: delete dead files found by the import-graph audit - removed public/Continental-Idle-logo.png, public/favicon.svg, public/icons.svg (git rm, staged D)
- audit method (read-only, temp script deleted same session): BFS import graph from index.html + vite.config + vitest.config + scripts/ + tests/, resolving relative/@-alias//root paths with .ts/.vue/.css/index.ts extension tries + dynamic import() - all 96 src files reachable at runtime; only these 3 public assets had zero string/path references repo-wide (case-insensitive grep re-checked after deletion)
- favicon in use is /Continental-Idle-fav.png (index.html) - favicon.svg was a stale duplicate; no <use href="/icons.svg#"> consumer anywhere
- verified: repo-wide grep for all 3 basenames = 0 live references; node harness/scripts/verify.mjs check pass; no suite matches a pure asset deletion

### history purge: Continental-Idle identity only - 2026-09-15 11:52 UTC+7 (muse-spark, opencode/muse-spark-1.3-contributor-free)
- user order (twice, explicit): drop every mod-cli and harness-meta record - log keeps project work only; overrides the 2026-09-14 decision against rewriting dated records (that entry itself is purged with the rest)
- verified: node harness/scripts/verify.mjs check pass

### project theme -> Zed GitHub-Dark palette - 2026-09-15 15:10 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- user order: adopt the colors in .zed/theme/zed-theme-map.html into the project theme; no new token variables
- remapped existing values only in src/styles/variables.css: bg-primary #0d1117, bg-secondary #010409, bg-tertiary #161b22, text-primary #a0a5ac, accent-blue #58a6ff, accent-green #3fb950, accent-red #f85149 (Zed editor/panel bg, tab.inactive_background, element.background, text, ansi.blue/green/red)
- single source confirmed: useNpcOverlayDraw.ts + components read tokens via getComputedStyle/var(), no hex duplicated in src; tokens count unchanged
- verified: npm run lint:bem pass (33 files, 0 violations); npm run lint:css pass (33 files, 0 violations)

### settings: canvas grid line color - 2026-09-15 15:20 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- user order: grid line color must be configurable in the Settings modal (was hardcoded to var(--border-dim) at EditorCanvas.vue:834)
- added CanvasConfig.gridColor + CANVAS_FIELD_SPECS color spec, setCanvasGridColor in store/mode.ts wired via store/index.ts, SettingsModal Canvas tab "Grid" section; EditorCanvas pattern stroke now canvas.gridColor || var(--border-dim); editor-only - not added to SyncedCanvas
- followed skill CanvasConfig field checklist: spec, setter, modal row, schema round-trip (test-blueprint-schema sampleCanvas + key list), docs/crud-reference row
- verified: lint:bem, lint:css, typecheck, lint all pass; npm run test:blueprint-schema pass

### zed theme map: terminal state visuals - 2026-09-15 15:28 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- user order: live map (#live) lacked a terminal command mock for error/success/warning/normal
- added 4 lines to the .term block in .zed/theme/sync-theme-map.mjs generator (normal prompt, green success, yellow warning, red error; each glyph data-goto its terminal.ansi.* card) plus .term line-height; regenerated zed-theme-map.html (do not hand-edit)
- synced updated sync-theme-map.mjs + zed-theme-map.html to %APPDATA%\Zed\ (byte-identical source, served by running theme-server on :18751)
- verified: regenerated from %APPDATA%\Zed\settings.json; GET http://127.0.0.1:18751/ returns the 4-line term block; tools/zed-theme-to-condo.zip left as-is (older snapshot)

### zed theme map: full navigate recheck - 2026-09-15 15:36 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- user order: some spots in the live mock still had no goto nav - full recheck
- generator .zed/theme/sync-theme-map.mjs: container surfaces (win->border, titlebar, tabs->tab.inactive_background, crumb, panel, ed, gut, six .code divs, minimap, botpanel, term, status) now carry data-goto with onclick="if(event.target===this)goto(this)" so nested token/tab clicks are untouched; leaf spots wired: ● modified dots, crumb separators->text.disabled + setup()->text, panel headers->text.muted, cursor->text.accent, curline->editor.selection, Problems count->text.accent, terminal state words + faint lines->ansi.*/editor.foreground
- fidelity fixes found during recheck: .panel .ph now uses c('text.muted') (was stale literal #6e7681), .gut background key editor.gutter -> editor.gutter.background (matched the real card key)
- regenerated + synced byte-identical to %APPDATA%\Zed\ ; audit: live-mock inline-colored tags without data-goto = 0 except the tab-close x (map chrome #8b949e, no override token)
- verified: node sync-theme-map.mjs regen ok; GET :18751/ contains the new guards/nav; hash match repo vs deployed

### project audit fixes (P1-P4 + tests + cleanups) - 2026-09-15 18:40 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- T0 verify table: added `tests/unit/**` (`test:unit`), `src/blueprint-editor/store/**`, `scripts/*.mjs` rows; added `**/*Payload*` (case-sensitive miss on syncedPayload.ts)
- T1.1 migrate.ts: `normalizeObjectPlacement(o)!` -> `migrateObjects()` drops invalid placements + warns; regression case in test-migrate
- T1.2 docs: ui-layout FloorWalkablePanel -> real floor tile-paint files; building interior x8..98/y8..58 (91x51); crud-reference sync + getLinkedObjects/initAssetFields/editorLog; HARNESS table mode + slot shape + "one script folder"
- T1.3 .gitignore `.zed/theme/settings.json`; T1.4 removed `.github/copilot-instructions.md`
- T2.1 NPC option defaults single source (`domain/types.ts`: NPC_OPTION_DEFAULTS/NPC_FRAME_DEFAULTS/NPC_DEFAULT_SPEED); fixed `speed` 1/30 -> 0.2 drift in useNpcSimulationCore
- T2.2 `interactionTargetKey` single source (`engine/npc/keys.ts`), replaced 6+ dups; octileDistance single source (`engine/npc/distance.ts`); pathfinding indent fix
- T2.3 useDirtyBaseline -> cloneDeepRaw + deepEqualRaw (JSON.stringify removed); T2.4 verify-assets fields parsed from ASSET_DEF_FIELD_COVERAGE; T2.5 removed dead paletteGhostParts; editorLog -> leaf `domain/logger.ts`
- T3 new suites: test-collision, test-tag-matching, test-persistence (+ package.json scripts, added to `test` composite)
- T4 engine purity: eslint no-restricted-imports on `src/engine/**` (no UI/store/vue) + engine now linted (found no-useless-assignment); relocated `useNpcSimulationCore` + `ConfirmDialog` into blueprint-editor
- decision: enforce an eslint engine-purity boundary + keep the pure domain kernel in place (over: moving the 1766-line domain kernel to `src/domain/` - because engine already depends only on the framework-free leaf and the move's blast radius is the whole app)
- P5 size splits (started): `assetUtils.ts` 579 -> `assetUtils.ts` 264 + `assets/validation.ts` 317; `objects.ts` 533 -> 371 + `store/flatten.ts` 172 (SVG gen out of the store); both typecheck+lint+npm test+build green
- tsconfig.node.json: switched to `module: ESNext` + `moduleResolution: bundler` (was nodenext) so domain files import extensionless like the rest; include stays explicit (types.ts + logger.ts) because a domain glob pulls collision/geometry -> assets (DOM) - `npm run typecheck`/build green
- decision: `domain/types.ts` left whole (over: splitting - because its sections are interleaved 1-13 with dense cross-refs; splitting risks import cycles + tsconfig churn for no behavior gain; it is a pure leaf kernel)
- P5 continued: `policy.ts` rewritten (nested closures -> module functions taking a `PolicyState` bag; `createNpcEnginePolicy` now ~25 lines) - typecheck + npc-engine/queue/social/movement-corridor suites + lint green
- P5 continued: `useNpcSimulationCore.ts` rewritten (closures -> `NpcSimCoreState` + module functions) - typecheck + lint + arrival-latch + unit + `npm run verify` + build green
- decision: `npcEngine.ts` left whole (over: splitting - it is one cohesive class, ~80 `this`-bound methods; a real size cut needs a base/mixin class split, not a file move)
- decision: `EditorCanvas.vue` left whole (over: splitting - no component tests exist; `@vue/test-utils`+jsdom are configured but unused, so an SFC split would be unguarded)
- verified: `npm run verify` (typecheck + lint + lint:bem + lint:css + guard:data-restore + test:unit + all tsx suites + verify:assets) pass; `npm run build` pass

### editor UX/UI pass - 2026-09-16 15:04 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- T1 dev-only gate: UI Showcase button + `?showcase` route behind `import.meta.env.DEV` (`shell/Toolbar.vue`, `App.vue`)
- T2 `[role="button"]:focus-visible` added to `styles/reset.css` (span/div list rows were unfocusable-styled)
- T3 `useToast`: `dismiss(id)` + per-type durations (error persists, warning 6s); `ToastContainer.vue` close button (reuses `.card__item--remove`), toast `pointer-events`, `role=alert/status` + `aria-atomic`
- T4 `EditorCanvas.vue`: `modeHint` names active `tileBrush`; `.editor__canvas--brush` crosshair cursor
- T5 grouped Toolbar controls and canvas view toggles with `.form__row` + `.right--border` + `.form__hint`; canvas toggle "Walk" -> "Walkable"; added new `shell/ShortcutsModal.vue` (ModalShell, `.badge` rows) triggered by a `?` button and `?` key
- T7 `ImportSvgModal` primary action moved to `#footer` + inline `ModalShell` status; `SettingsModal`/`DeployNpcModal` validation inline via `:status`/`:status-tone` (was toast); `AssetEditModal` has no actions (unchanged)
- T8 `DeployNpcModal` role rows `role=button` + tabindex + Enter/Space (`NpcRoleList` already compliant)
- T9 `PropertiesPanel` sections via `.form--section` + editor wrapper
- T10 Deploy wrapped in `useAsyncAction` (`pending` disables button); Sync Game is synchronous so no pending needed (audit assumption corrected)
- verified: `npm run typecheck` + `npm run lint:bem` + `npm run lint:css` pass (routed suite for `*.vue`). Unrelated: `npm run lint` fails only on pre-existing `.zed/theme/*.js|mjs` errors (untouched)

### store grill + street-width clamp fix - 2026-09-16 17:17 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- user order: learn the project, find parts needing more rigor, then grill them
- added `tests/test-store-crud.ts` (17 checks: store CRUD, tile pipeline, geometry) + `test:store-crud` npm script, wired into the `test` chain
- fixed defect found by the grill: object bounds used a hardcoded 8-tile street inset while the canvas draws `resolveStreetTiles(layout)` - `store/state.ts` clamp, `store/objects.ts` moveMembersTo, `useCanvasDragDrop.ts` ghost now pass the resolved street width
- decision: derive the street inset from `resolveStreetTiles(state.layout)` at the clamp callsite (over: passing the width through every signature - because the layout is the single source)
- open finding (not fixed - needs a product choice): `pasteObjects` offsets a copy by one tile, so any object wider than one tile overlaps its source and the whole paste is rejected
- open finding: `paintFloorTiles` forces the street ring walkable then applies the brush, so a brush can still overwrite the ring
- verified: `npx tsx tests/test-store-crud.ts` 17/17; `npm run typecheck:test`; `npx eslint` on the 3 changed src files + new suite; routed `lint:bem` + `lint:css` + `typecheck` pass. Unrelated: `npm run lint` fails only on pre-existing `.zed/theme/*.js|mjs` errors

### store/persistence foundation plan (decision) - 2026-09-16 17:29 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- decision: store boundary = option B `createBlueprintStore({ persistence, sync, seed })` factory (over: A keep singleton + inject port - leaves global state; C command bus/event-sourced - single-writer over-engineering, future debt)
- decision: #2 (store purity) and #1 (storage contract) are ONE foundation phase, not sequential tickets - the boundary and the storage format must be designed together or the store stays shaky
- decision: foundation = factory + PersistencePort + SyncPort + single-writer `commit` (replaces `withStateLock`); #5/#7 fall out of the boundary, #6 is the boundary identity rule
- decision: #8 test guard lands before any production change; #10 process recap deferred until 1-9 done
- plan written to slot (T0-T6, order T0 -> T1 -> T2 -> T3 -> T4 -> T5 -> T6); open: T3 storage format (JSON file + dev middleware vs generated TS vs SQLite)
- no code changed in this entry

### T3 storage format decision - 2026-09-16 17:29 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- decision: canonical store = one `src/blueprint-editor/data/blueprint-data.json` in the existing `BlueprintDataFile` shape (over: generated TS from JSON - keeps data-as-code + stale artifact; SQLite - native dep/portability/diff review, overkill for 4 collections single-writer)
- why this wins: the dev middleware already validates with `normalizeBlueprintDataFile` and writes atomically (temp + rename retry) at vite.config.ts:141-200; only the fragile `readDataModule` string-slice at vite.config.ts:131-139 changes; `server.watch.ignored` already lists `data/*.json`; the persisted artifact becomes identical to the domain DTO
- the four `.data.ts` demote to a one-time seed/migration input; `PersistencePort` = GET load / POST save; `guard:data-restore` retires with T3
- reversible: hidden behind `PersistencePort`, so a future DB swap needs no core change
- no code changed in this entry

### T0 (#4) single building-area resolver - 2026-09-16 17:35 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- replaced `buildingArea(width,height,tileSize, streetTiles = STREET_TILES)` with `resolveBuildingArea(layout)` in `domain/geometry.ts` - the inset now derives from `resolveStreetTiles(layout)` inside one function, no default arg (kills the drift class that caused the street-width bug)
- routed all callsites through it: `store/state.ts` clamp, `store/objects.ts` moveMembersTo, `composables/useCanvasDragDrop.ts` ghost, `components/canvas/EditorCanvas.vue` buildingAreaRect
- dropped the now-dead `canvasWidth`/`canvasHeight` opts from `useCanvasDragDrop` + its `EditorCanvas` call
- updated `tests/test-store-crud.ts` to the new resolver; `rg '\bbuildingArea\b'` now returns 0 non-resolver hits
- verified: `npx tsx tests/test-store-crud.ts` 17/17; `npm run typecheck`; `npx eslint` on the 5 changed src files + the suite; routed `lint:bem` + `lint:css`; `npm run test:blueprint-schema` (matching domain suite) all pass. Unrelated: `npm run lint` still fails only on pre-existing `.zed/theme/*.js|mjs`

### T1 (#8) test guard, option C - 2026-09-16 17:42 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- decision: T1 = option C hybrid (target end state = vitest single runner; keep legacy tsx suites behind a temporary runner and migrate file-by-file) - over A (keeps two runners permanently) and B (big-bang migration with no guard yet)
- added `scripts/run-tests.mjs` as the single aggregate; `npm test` now runs vitest + the 14 tsx suites + verify:assets with one explicit exit code (16/16 green)
- first UI test: `tests/component/EditorCanvas.test.ts` mounts EditorCanvas (stubbed injected `npcSimulation`) and pins the building outline rect to `resolveBuildingArea` for default + changed street width; `tests/setup.ts` polyfills ResizeObserver/matchMedia
- `vitest.config.ts` include now covers `tests/component/**`; AGENTS verify row widened to `tests/**/*.test.ts` -> `test:unit`; coverage report wired (`test:coverage`, v8)
- remaining (ongoing): migrate the legacy tsx suites into vitest one at a time, then retire the runner
- verified: `npm test` 16/16; `npm run typecheck`; `npm run test:coverage` (report ok); `npx eslint` on runner/setup/component test/vitest.config; `node harness/scripts/verify.mjs table` ok. Unrelated: `npm run lint` still fails only on pre-existing `.zed/theme/*.js|mjs`

### T2 store factory - decisions - 2026-09-16 17:54 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- decision: store consumption shape = A (instance `store.state` reactive + commands as methods + `provideBlueprintStore`/`useAssetsStore` inject) over B free functions / C read-model only - because UI template churn is near-zero, it matches the existing `npcSimulation` provide/inject pattern, and single-writer `commit` is still enforced
- decision: each command module becomes a factory closing over `store`, with local aliases (`state`, `toast`, `snap`, `saveBlueprintData`, ...) so function bodies stay byte-identical (over editing every body or a class conversion) - least-risk mechanical path
- decision: `runExclusive` serialized queue replaces `withStateLock` reject - removes the "Operation in progress" failure (#5); one write path
- decision: HTTP retry/413/verify moved into `createHttpPersistencePort`; the store owns the snapshot/revert + serialized `save()` - persistence boundary is typed (#7 SyncPort replaces `CustomEvent` string), store owns transaction semantics
- decision: `App.vue` creates + provides the store (over `BlueprintEditor.vue`) - because the `?showcase` UiShowcase mounts under App without BlueprintEditor
- status: decisions logged mid-implementation - the src refactor landed with the 3 test files still red; the completion entry follows

### T2 (#2 + #5 + #7) store factory - done - 2026-09-16 19:19 UTC+7 (cline, model id n/a)
- finished the T2 remainder: rewrote the 3 suites against `createBlueprintStore` - `tests/test-store-crud.ts` (in-memory `PersistencePort`/`SyncPort` harness, `store.state` + command aliases instead of the retired module globals; new check: two overlapping commands queue instead of rejecting - the #5 regression), `tests/test-persistence.ts` (recording port: payload shape on success, reject and `false` both revert, max in-flight saves = 1, plus the moved HTTP-port behaviour - 413 stops immediately, a transient failure retries then succeeds, an unverifiable read-back exhausts the 3 attempts, backoff timer mocked so the suite stays fast), `tests/component/EditorCanvas.test.ts` (fresh store per test, injected through `STORE_KEY`, which `store/index.ts` now exports)
- fixed the defect the new persistence check caught: `restoreSnapshot()` installed the save-point snapshot by reference, so after one failed save the live state WAS the snapshot - the next live edit corrupted the saved baseline and a later failure could no longer revert. Rollback now installs `cloneDeepRaw` clones (`store/createStore.ts`)
- dead code retired (orphaned by this refactor, zero non-doc references): `fetchBlueprintDataFromDisk` (`store/dataLoader.ts`, superseded by `createHttpPersistencePort.load`), `loadInitial` (`store/migrate.ts`, superseded by `defaultSeed`); the port's load log label renamed to match
- docs kept in step with the store API (ui-layout rule 4 gate): `docs/crud-reference.md` (factory + inject intro, save-under-`runExclusive` convention, `store.save()` / `PersistencePort.load` / `PersistencePort.save` / `SyncPort.emit` rows, `runExclusive` + `captureSnapshot`/`restoreSnapshot` rows, `defaultSeed` replaces `loadInitial`), `docs/skill/ui-layout.md` concurrency bullet, glossary row in `harness/state/context.md` (`withStateLock` -> `runExclusive`)
- verified: `npm test` 16/16 steps; `npm run test:store-crud` 18/18 checks; `npm run test:persistence` passed; `npm run test:unit` exit 0; `npm run typecheck` exit 0; `npx eslint tests src/blueprint-editor/store --max-warnings 0` clean; `node harness/scripts/verify.mjs check` pass. Unrelated, not fixed: repo-wide `npm run lint` still fails only on the pre-existing `.zed/theme/*.js|mjs` bundle
- variance (Test/Fix step): the editor tool reported success for writes to `harness/state/history.md` without persisting them (git status showed the file untouched twice) - the entry was re-applied by an atomic script write and verified with `git status` + `verify.mjs check`

### T3 (#1) storage contract - 2026-09-17 08:16 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- canonical store is now one `src/blueprint-editor/data/blueprint-data.json` (`BlueprintDataFile`): `vite.config.ts` dev middleware reads JSON (replaced the `readDataModule` string-slice), atomic temp+rename write + `normalizeBlueprintDataFile` validation kept
- the four `.data.ts` demoted to a one-time seed input: new `scripts/seed-blueprint-data.ts` + `npm run seed:blueprint-data` regenerates the JSON byte-identical (SEED-IDENTICAL, live store untouched); `defaultSeed()` still boots from them at runtime; no port change (`createHttpPersistencePort` GET/POST already the boundary)
- `guard:data-restore` retired: script file deleted, npm script gone, zero code/config references repo-wide (only log mentions remain)
- defect fixed while verifying: the JSON-read rewrite shipped `},` instead of `};` (`vite.config.ts:230`) so the file did not parse - caught by the temp plugin round-trip diagnostic, fixed, typecheck clean
- temp diagnostic `tests/_t3-plugin.tmp.ts` (GET serve / POST persist + read-back / invalid->400 against the real plugin on a stubbed dev server) passed, deleted same session; glossary `Origin assets` row + `docs/skill/data-flow.md` updated to the JSON store
- verified: temp diagnostic PASS; `npm run seed:blueprint-data` SEED-IDENTICAL; `npm run test:persistence` + `npm run test:blueprint-schema` pass; `npm test` 16/16; `npm run typecheck` clean; `npx eslint` on the 8 touched src/config/script files clean; `node harness/scripts/verify.mjs check` pass

### T4 (#6) stable sync identity + game loader - 2026-09-17 10:19 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- decision: floor-key shape = keep canonical `G`/`<n>`, stabilize the non-canonical fallback + `_N` collision suffix by ordering floors on stable `floor.id` (over switching keys to raw `floor.id`, or adding an explicit persisted key field) - preserves the runtime contract for every canonical floor while making the previously array-order-dependent cases deterministic
- moved sync-key logic out of `store/storeUtils.ts` into `src/blueprint-editor/syncedPayload.ts`: `assignSyncKey(label,index,used)` -> `assignSyncKeys(floors): Map<id,key>` + `compareFloorKeys`; syncedPayload now imports `editorLog` from `domain/logger` so it no longer drags in Vue through storeUtils (the "runs headless" doc claim is now actually true)
- added `loadSyncedPayload(payload)` (ingress): payload -> `FloorData[]` + `SyncedRuntimeCanvas`; normalizes `walkable`/`spawnZones`/`allowedRoleIds` via the canonical helpers, orders floors G-first then numeric. Asset defs stay a caller concern (engine needs an asset map)
- `scripts/observe-hotel.ts` now uses `loadSyncedPayload` - removed the inline 12-line payload->FloorData conversion (the anti-pattern this ticket closes); no engine import added
- tests `tests/test-sync-payload.ts`: reorder-stability (non-canonical labels + colliding `F1`) and loader round-trip + ingress-normalization cases; docs `docs/crud-reference.md` (assignSyncKey row moved to the sync table + loader rows), `docs/skill/data-flow.md` (new "Sync payload (editor <-> game)" section), glossary `Sync key` row in `harness/state/context.md`
- verified: `npm run test:sync-payload` pass; `npm run test:store-crud` 18/18 (storeUtils changed); `npm run typecheck` exit 0; `npx eslint` on the 4 changed TS files --max-warnings 0 clean; `node harness/scripts/verify.mjs check` pass. Unrelated, not fixed: repo-wide `npm run lint` still fails only on the pre-existing `.zed/theme/*.js|mjs` bundle; untracked `_archive/opencode-cline-pass-setup.md` is the user's personal note (not T4)

### Toolbar dev-only showcase button parse fix - 2026-09-17 10:24 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- user-reported dev error: `import.meta may appear only with 'sourceType: "module"'` at `Toolbar.vue:203` - the UI Showcase button had `v-if="import.meta.env.DEV"` inline in the template; Vue compiles template expressions as non-module scripts, so `import.meta` is invalid there (introduced by `aedfd53`, pre-existing, not T4)
- hoisted to `const isDev = import.meta.env.DEV` in `<script setup>` (same pattern as `App.vue:19`) and switched the binding to `v-if="isDev"`
- verified: temp `tests/_toolbar-compile.tmp.ts` compiled the real SFC template via `@vue/compiler-sfc` - clean + `isDev` present, with a negative control proving the check still rejects inline `import.meta`; deleted same session. Routed: `npm run lint:bem` pass (34 files), `npm run lint:css` pass, `npm run typecheck` exit 0; `node harness/scripts/verify.mjs check` pass. Unrelated: `npm run lint` still fails only on pre-existing `.zed/theme/*.js|mjs`

### Placed-object SVG details hidden by opaque wall overlay - 2026-09-17 14:20 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- user report: placed-item SVG detail (the line art) does not render on the canvas at rest, but appears while zooming and disappears when zoom stops. Root cause verified by dumping the live DOM (Chrome headless `--dump-dom` + screenshot): each object group draws its walkable/wall overlay cell with an inline opaque `fill: rgb(255,255,255)` (`canvas.wallColor` default `#ffffff`) *after* the asset SVG, so the blocked-cell rect covered the art. During zoom/pan `isInteracting` disables the overlay (EditorCanvas.vue:132), revealing the art - exactly the reported symptom
- fix: dropped the `canvas.wallColor` fill override on per-object grid cells (EditorCanvas.vue:1300) so blocked cells keep the translucent `editor__tile--blocked` style; `wallColor` still paints opaque floor wall tiles (EditorCanvas.vue:1135, drawn under objects). Removed the now-unused `canvas.wallColor` dep from the object overlay `v-memo`
- assumption: object blocked cells are the item's own footprint diagnostic, not painted wall tiles, so they must not occlude the asset art ("the SVG is the whole visual", docs/skill/data-flow.md:116)
- verified: `npm run lint:bem` pass (34 files), `npm run lint:css` pass (34 files), `npm run typecheck` exit 0; headless screenshots before/after (temp, deleted same session) show the washbasin interior ellipse/circle/lines hidden before and visible after; `node harness/scripts/verify.mjs check` pass

### canvas interaction fixes (autopilot batch 1) - 2026-09-17 15:05 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- user order: familiarize with the project, list what to fix from 0 to now, then utopilot on the ranked list (rank 1 = rendering-bug class A3+A4). User also scoped out of debt: .zed/theme is a personal extension (not project debt), E14 runtime-consumer gap and E15 mod-cli archive.
- decision: reject A3 (convert the hand-injected asset SVG into declarative Vue) - over doing the refactor - because the -svg-content directive + sanitized ppendChild is the pragmatic escape hatch for arbitrary untrusted SVG (no clean Vue-native path for foreign SVG namespaces) and the reported bug was never the directive itself, only overlay order/fill
- decision: fix A4 by deleting the interaction gate rather than keeping it - over preserving the "hide overlays while pan/zoom" optimization - because the overlay groups are -memo'd on inputs that do NOT change during pan/zoom, so the gate forced an unmount/remount (the expensive path) instead of the memo hit it was meant to protect; removing it is strictly cheaper and stops overlay content from changing mid-interaction (the same class that masked the opaque-overlay bug)
- A4 change: EditorCanvas.vue - removed isInteracting and its && !isInteracting.value from enderWalkableOverlay/enderWallOverlay/enderDoorOverlay/enderInteractSpots/enderObjectHighlights; dropped the now-unused zooming destructure
- C8 change: store/metadata.ts pasteObjects offset is now the selection's tile-rounded bounding box (per axis) instead of a fixed one tile, so a copy wider than one tile no longer self-overlaps and gets rejected; 	ests/test-store-crud.ts open probe promoted to a real check (19/19) plus the single-tile case unchanged
- left as-is with reason: C9 brush-over-street-ring matches the documented contract (docs/crud-reference.md - explicit paint wins, unpainted ring stays walkable); C7 SVG overlap exemption kept (19/21 assets are SVG decorative art, enabling collision is a product choice, not a defect)
- verified: 
pm run lint:bem pass (34 files); 
pm run lint:css pass (34 files); 
pm run typecheck exit 0; 
pm run test:unit 3 files / 12 tests pass; 
pm run test:store-crud 19/19; 
px eslint on the 3 changed files --max-warnings 0; CDP headless runtime check on the real app: overlay tiles = 2 at rest, 2 immediately after wheel (mid-debounce), 2 after settle -> PASS (temp script + profile deleted same session); 
ode harness/scripts/verify.mjs check pass
- still open from the audit (not in this batch): A1 all assets default #ffffff (reads as plain white squares at fit zoom - product/design choice), A2 --obj-fill var serves both body and hollow detail (42 ar(--obj-fill,none) occurrences, no visual effect while all assets are white), B5 seed loorPlan.data.ts 305KB duplicates the canonical JSON, B6 production build cannot persist (dev-middleware-only endpoint), D12 only one component test

### canvas regression guards + debt triage (autopilot batch 2) - 2026-09-17 15:15 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- D12: extended 	ests/component/EditorCanvas.test.ts with two regression guards - (1) a placed asset svg is never covered by an inline opaque wall fill on its overlay cell, (2) overlays stay mounted mid-zoom instead of unmounting (the A4 class). Test harness raises the object's walkableGrid to a forced blocked cell and sets canvas.wallColor: '#ffffff' so the old binding would actually fire
- negative control run: reintroducing the opaque :style="fill: wallColor" made guard 1 fail (`expected 'fill: rgb(255,255,255);' not to contain 'fill'`); reintroducing the !zooming gate on the overlay computed made guard 2 fail (`overlay stays mounted while the zoom is still active: expected 0 to be greater than 0`); both reverted, 14/14 green
- debt triage with reasons (no code change): A1 all assets #ffffff deferred (product/design choice and would rewrite persisted asset data - autopilot hard-stop); A2 --obj-fill body/hollow conflation deferred (42 occurrences but zero visible effect while every asset is white; changing it alters the SVG art contract without a visible win); B5 seed data deferred (the .data.ts seed is the only synchronous boot + test fixture source, and importing the 370KB JSON would re-bundle exactly what T3 unbundled; removal needs an async boot + test fixtures); B6 production persistence deferred (documented dev-tool constraint - the endpoint only exists in configureServer; adding a server is infra, not a code fix); C7 SVG overlap exemption kept (19/21 assets are decorative SVG; enabling collision is a product choice); C9 brush-over-street-ring kept (matches docs/crud-reference.md); E16 clone inconsistency skipped (verified no leak - defaultSeed() structuredClones the layout and createEditorState clones each asset, so nested canvas/floor refs never alias the module constants; objDef cost is a Map lookup); D13 domain/types.ts monolith kept (prior logged decision); D14 tsx->vitest migration stays ongoing (declared)
- verified: 
pm run test:unit 3 files / 14 tests pass (both new guards green after negative control); 
pm run lint:bem pass (34 files); 
pm run lint:css pass (34 files); 
pm run typecheck exit 0; 
px eslint on the 3 touched files --max-warnings 0; 
ode harness/scripts/verify.mjs check pass

### lint scope aligned to project boundary - 2026-09-17 15:24 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- user order: .zed/theme is a personal extension bundle, not project source - cut it out of project consideration
- eslint.config.js: added .zed/** to the global ignores and dropped the now-dead .zed/**/*.mjs node-globals block; no rule or project file changed
- effect: 
pm run lint (eslint . --max-warnings 0) now exits 0 repo-wide instead of 35 errors from .zed/theme/theme-map.js (the recurring "unrelated, not fixed" line in every prior entry is gone)
- verified: 
pm run lint exit 0; project-only run 
px eslint src tests scripts vite.config.ts vitest.config.ts --max-warnings 0 exit 0 (unchanged); 
ode harness/scripts/verify.mjs check pass

### A1 asset palette + B5 seed out of app bundle - 2026-09-17 15:55 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- user order: A1 option 1 (curated per-asset default colors) and B5 option 1 (move the .data.ts seed out of the app bundle)
- A1: one curated defaultFillColor per asset (21), written to BOTH originAssets.data.ts and lueprint-data.json by a temp script (both are ingress sources; the JSON is the live store, the module the seed) - wood #8a6f4d/#9a7b4f, metal grey #7f8fa6/#6b7c93, textile #6d7f9c/#7d8a7a, porcelain #7fb3ba, shower/sink #8fbcc2, appliance #7a8794/#6f7a86/#a4614f/#5b6169, lift #7a828c. Instances without an explicit illColor now read distinct colors instead of a uniform white square at fit zoom
- B5: store/dataLoader.ts made pure (uildBlueprintData/uildSavedLayout/
ormalizeBlueprintLayout take explicit args, no .data.ts import); new store/seed.ts owns defaultSeed() + seedTagDefinitions/seedLayout/seedNpcConfig/seedOriginAssets; createStore.ts gained emptySeed() (default canvas, no floors/assets/tags); App.vue boots from emptySeed() and fills via eloadEditorData() (dev middleware); migrate() lost its originAssets default to stay import-cycle-free; defaultSeed dropped from the barrels (store/index.ts, lueprintStore.ts) - tests import it from store/seed
- decision: emptySeed for production boot over a lazy .data.ts fallback - because the middleware (and any future server) is the single ingress and a fallback would re-import the module into the app graph, keeping the 305KB in the bundle; a boot-failure today surfaces as the existing "Failed to load editor" state
- docs updated: docs/crud-reference.md (uildSavedLayout(layout, config), emptySeed(), defaultSeed() rows), docs/skill/data-flow.md origin-asset bullet, glossary Origin assets row
- verified: 
pm run verify:assets PASS 21 assets / 0 errors / 0 warnings; seed-vs-JSON fill parity 21 assets / 0 mismatches, live JSON still 1 floor / 2 objects; 
pm run test:blueprint-schema + 	est:asset-schema + 	est:settings-completeness + 	est:sync-payload + 	est:migrate + 	est:persistence + 	est:store-crud 19/19 + 	est:unit 14/14 pass; 
pm run typecheck exit 0; 
pm run lint exit 0; 
pm run lint:bem/lint:css pass (34 files); 
pm run test:npc-scale pass; 
pm run build exit 0; CDP headless boot check PASS (empty seed -> 21 asset rows + 2 objects loaded from the middleware, zero runtime exceptions); bundle grep: obj-fill,#ffffff, originAssetsData, loorPlanData = 0 hits in dist/assets/*.js (the ~305KB seed art is no longer shipped); temp scripts + chrome profile deleted same session; 
ode harness/scripts/verify.mjs check pass

### A2 SVG hollow-detail convention fix - 2026-09-17 16:35 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- proof first (read-only): rendered all 19 svg assets twice (current vs literal `none`) and pixel-diffed in headless Chrome - 13/19 differed (double-bed 429, washer 278, vending 351, kitchen-table 337, bathtub 218, table-stove 158, washbasin 143, office-chair 90, kitchen-sink 89, shower 85, toilet 74, elevator 24, reception 6 px of 14400); B (hollow) is correct - e.g. the vending slots and washer door read as dark recesses instead of being flooded with the body color
- root cause: `applySvgColorConvention` rewrote `fill="none"` to `var(--obj-fill,none)`; the `none` fallback is dead because every render surface always sets `--obj-fill` (`svgColorVarStyle` writes it whenever a fill exists), so the detail shape filled with the body color
- fix: `applySvgColorConvention` leaves `fill="none"` / `fill="#foo"` as-is (`domain/types.ts`) + migrated 42 `var(--obj-fill,none)` -> `none` in BOTH `originAssets.data.ts` and `blueprint-data.json` (temp script, parity re-checked); `tests/test-blueprint-schema.ts` convention cases updated
- effect: object detail art now renders as drawn (hollow), matching the `Asset SVG v2` contract; no instance/persisted data change (asset defs only, `defaultFillColor` untouched)
- contract locked: `docs/skill/data-flow.md` SVG v2 bullet + glossary `Asset SVG v2` row now state hollow details keep a literal `fill="none"`
- verified: post-migration A/B pixel diff = **0 differing assets / 0 pixels**; `npm run verify:assets` PASS 21 assets / 0 warnings; `npm run test:blueprint-schema` + `test:asset-schema` + `test:migrate` + `test:persistence` + `test:settings-completeness` + `test:sync-payload` pass; `npm run test:store-crud` 19/19; `npm run test:unit` 14/14; `npm run typecheck` exit 0; `npm run lint` exit 0; `npm run lint:bem`/`lint:css` pass (34 files); CDP real-app check: washbasin `--obj-fill #7fb3ba` with 2 detail nodes at computed `fill: none`, shower 3; temp scripts/profiles deleted same session; `node harness/scripts/verify.mjs check` pass

### T1 persistence caps at construction + limits module - 2026-09-17 17:55 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- user order: approved plan, start T1 (D1=3+4). Root cause: the schema normalizer caps (256 grid rows AND columns / 100 floors / 10 000 objects / 1 000 assets) were never enforced by the construction paths, and saving is whole-file atomic - one over-cap entity makes every later save fail (HTTP 400, 3 retries, generic toast, in-memory revert). Also the 5 MB payload cap existed only in the dev middleware, unchecked by the client
- new src/blueprint-editor/limits.ts = the single source: MAX_GRID_ROWS/COLUMNS 256, MAX_ASSETS 1000, MAX_FLOORS 100, MAX_OBJECTS_PER_FLOOR 10000, MAX_NPC_ENTRIES 1000, MAX_ASSET_TILES 256, MAX_PAYLOAD_BYTES 5 MB; domain/types.ts imports + re-exports them (its private copies removed)
- MAX_ASSET_TILES (256) now bounds asset w/h at ingress (
ormalizeOriginAsset) while MAX_ASSET_DIMENSION (10 000) still bounds defaultPadding/radius/labelPadding
- parseCanvasConfig gained canvasWithinGridCaps() (new export) - rejects a canvas whose ceil(size/tileSize) exceeds the grid cap; migrate.ts re-checks the merged canvas so a partial canvas payload cannot slip past
- uildWalkableGrid now returns undefined past the grid cap (its only caller state.ts initAssetFields guards); construction guards added in ddSvgAsset/duplicateAsset (tiles + MAX_ASSETS), eginDrawnObject/ddObject (tiles + MAX_OBJECTS_PER_FLOOR), pasteObjects (would-exceed check before any mutation), ddFloor/duplicateFloor (MAX_FLOORS), esizeCanvas (grid caps), lattenToSvgAsset (MAX_ASSETS)
- httpPorts.save measures 
ew TextEncoder().encode(body).length against MAX_PAYLOAD_BYTES and throws before the network; ite.config.ts uses MAX_PAYLOAD_BYTES for the request/response/data-module caps (no duplicated literal)
- 	sconfig.node.json include gained src/blueprint-editor/limits.ts (vite.config + types.ts now import it)
- verified: 	est:store-crud 21/21 (2 new checks: resizeCanvas over-cap rejected with canvas unchanged; addSvgAsset over-cap rejected + in-cap still imports) � 	est:blueprint-schema pass (+2 ingress cases: 100 000px/25 rejected, 6 400px/25 = 256 tiles accepted) � 	est:asset-schema pass � 	est:migrate pass � 
pm run typecheck exit 0 � 
pm run lint exit 0 � 
ode harness/scripts/verify.mjs check pass
- remaining in T1 (handoff): SettingsModal/ImportSvgModal field-level limits display, and a specific (non-generic) save-failure message for the payload-cap path

### T1 remainder + T2 single-writer + T5/T6/T7 review fixes - 2026-09-17 19:35 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- T1 remainder: SettingsModal canvas width/height gained `:max` from MAX_GRID_ROWS/COLUMNS x tile, tile input `:max` from CANVAS_FIELD_SPECS, and applyCanvasSize pre-checks canvasWithinGridCaps with a specific toast; ImportSvgModal shows/validates the MAX_ASSET_TILES cap on auto-derived w/h, warns + disables Import when oversized; payload-cap now surfaces "Failed to save blueprint data - it exceeds the maximum save size" (PayloadTooLargeError checked in createStore)
- T2 single-writer: wrapped every remaining save() command in runExclusive - floors.ts (addFloor/deleteFloor/clearFloor/duplicateFloor/renameFloor/reorderFloors/updateFloor/paintFloorTiles), mode.ts (resizeCanvas + 4 color setters + setStreetFloor/setStreetWidth/setEditorSettings/resetEditorSettings), objects.ts (commitMove/linkObjects/unlinkObject/toggleObjectLock), tags.ts (addTag/removeTag), assets.ts deleteAsset, metadata.ts pasteObjects, npcDefault.ts updateNpcConfig; no nested runExclusive (a wrapped command never calls another wrapped command)
- T6 flattenToSvgAsset now emits `walkable: true` with an all-walkable grid + tileStates, so merging decorative art no longer creates blocked terrain NPCs cannot cross
- T5 portal spot parity: buildPortalInteractionTargets clamps the destination spot index to the destination portal's interactSpot count (Math.min) so a paired portal with fewer spots no longer dead-ends silently; validatePortalConfiguration warns when placed portal assets have mismatched interactSpot counts
- T7: spawnAgents (useNpcSimulationCore) warns once via editorLog when a pool entry references an undefined role and the resolveRole fallback substitutes another role (policy.ts untouched)
- new tests: store-crud `serialization: the first save payload excludes a concurrently started command` (red before the runExclusive wrap) + `deadlock guard: a burst of mixed mutating commands all settle` + `flattenToSvgAsset() merges into a walkable asset by default`; npc-engine parity block (mismatched portals still yield one target per source spot, every destinationPortalKey resolves, fallback key asserted) + validation mismatch warning; persistence payload-cap message assertion
- decision: `PayloadTooLargeError` moved to `store/ports.ts` and re-exported from `store/index.ts` (over: keeping it private in httpPorts) - because the store must surface a specific message without importing the HTTP port
- decision: portal parity handled by clamping the destination index (over: mapping by interactSpot `post`/anchor) - because `post` is optional and not guaranteed unique, clamp is deterministic and keeps both directions traversable; the mismatch is surfaced as a validation warning
- verified: `npm test` 16/16 steps pass (unit 14/14, store-crud 24/24, npc-engine, persistence, blueprint/asset schema, migrate, settings-completeness, sync-payload, collision, tag-matching, queue/social/arrival/movement/behavior); `npm run typecheck` exit 0; `npm run lint` exit 0; `npm run lint:bem`/`lint:css` pass (34 files); `node harness/scripts/verify.mjs check` pass

### T4.3 asset delete cascade + palette purge - 2026-09-17 20:47 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- user order: ลบ origin asset ที่อยู่ในถังได้ทั้งหมด ("ถ้า asset ที่มีอยู่มันเป็นอุปสรรคให้ลบได้เลย"); locked decisions D1=A (clear task.post) + D2=A (add bulk purge); no backup/undo (confirm-only)
- root cause: `deleteAsset` blocked any in-use asset; if the asset were removed while instances remained, `normalizeBlueprintDataFile` rejects the whole file (objects must reference an existing asset, `domain/types.ts:1736`) - the whole-file atomic save would then fail forever, and `migrate.ts:67-71` would silently drop the orphan objects on the next load
- `store/assets.ts`: new private `removeAssetInstances(assetIds: ReadonlySet<string>)` - per floor drops matching objects (locked included), `store.dissolveGroupsIfSmall`, `recalcCollapsed`, rebuilds `selectionState` from surviving refs, and clears `task.post` whose `assetId` matches; `deleteAsset` now cascades (single id, still `withStateLock` + one save); new `deleteAllAssets()` purges the whole registry in one save and returns the count
- `store/state.ts`: `deleteAllAssets(): Promise<number>` added to `BlueprintStore`
- UI: `AssetProperties.vue` drops the in-use block, confirm shows the placed-object count, and blocks while `isNpcPreview`; `AssetToolbar.vue` adds a danger `Delete All` in the Assets List header (confirm shows assets/instances/floors); `EditorCanvas.vue` resets draft refs when the draft object disappears
- docs: `docs/crud-reference.md` delete row rewritten to document the cascade + new `deleteAllAssets` row
- decision: cascade deletes locked instances too (over: skip locked - because skipping would leave a dangling `type` and block every later save); the count is surfaced in the confirm dialog
- decision: clear `task.post` on delete (over: leave it dangling for the validation warning) - because runtime behavior is identical ("behaves as a plain tag task", `validation.ts:166`) but the config stays clean
- verified: `npm run test:store-crud` 27/27 (3 new checks: cascade incl. locked + no-dangling-ref invariant, task.post cleared, bulk purge); `npm run test:blueprint-schema` pass; `npm run test:asset-schema` pass; `npm run test:unit` 14/14 (EditorCanvas component); `npm run typecheck` exit 0; `npm run lint` exit 0; `npm run lint:bem`/`lint:css` pass (34 files); `node harness/scripts/verify.mjs check` pass

### zero to hero: local-first persistence + schema gate + seed single source + domain split + release - 2026-09-17 21:50 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- user order: plan is approved, autopilot until done. Locked: editor-only + frozen contract, static + IndexedDB (Q1=A, no fallback), seed single JSON (Q2=A), split domain/types after P1 (Q4=A), engine coverage only (Q5=A), no undo/redo, no backup
- T0.1 schema version gate: new `store/schemaMigration.ts` (`readBlueprintDataFile`) - exact version normalizes, older runs a version-keyed migration chain, newer throws `UnsupportedBlueprintVersionError`, malformed throws `InvalidBlueprintDataError`; `httpPorts.load` now uses it and treats 404 as "no workspace" but throws on unreachable/non-JSON (was: any failure silently returned null -> blank editor); golden fixture `tests/fixtures/blueprint-data.v2.golden.json` + round-trip/idempotence/rejection cases in `tests/test-migrate.ts`
- T0.3 seed single source: `store/seed.ts` now reads `src/blueprint-editor/data/blueprint-data.json` through the version gate; deleted `originAssets.data.ts`/`floorPlan.data.ts`/`npcSettings.data.ts`/`tagManager.data.ts` and `scripts/seed-blueprint-data.ts`; `scripts/verify-assets.mjs` reads the JSON (was parsing TS source text); `scripts/observe-hotel.ts` + `tests/perf-npc-scale.ts` read `seedLayout`/`seedOriginAssets`; `store/dataLoader.ts` lost the dead `normalizeBlueprintLayout`; `package.json` lost `seed:blueprint-data`
- T1 local-first: new `store/localPort.ts` (`BlueprintStorage` + `createLocalPersistencePort` + `createIndexedDbStorage` + `createMemoryStorage` + `isIndexedDbAvailable`), `store/persistenceFactory.ts` (`VITE_PERSISTENCE` else dev->http / build->idb, throws when IndexedDB is missing), `store/workspaceFile.ts` (`serializeWorkspace`/`parseWorkspace`); `App.vue` boots through the factory and renders a boot error instead of an empty editor; `editorConfig.ts` gained `persistenceMode`
- T1.3 export/import: `exportWorkspace()`/`importWorkspace(file)` in `store/persistence.ts` (import replaces layout/assets/tags/npcConfig under `runExclusive`, resets selection, one save), new `WorkspaceModal.vue` wired in Toolbar + UiShowcase, documented in `docs/crud-reference.md`
- T3.1 domain split: `domain/types.ts` (1778 lines) split into `domain/schema/{helpers,primitives,walkable,interact,objects,assets,npc,rooms,layout,payload,dataFile}.ts` by dependency order; `types.ts` is now a barrel so every existing import path is unchanged; `normalizeTags` moved to helpers, `SVG_COLOR_VALUE_RE` to helpers, `normalizeAssetColor`/`isValidTagTriggerRates`/`normalizeTagTriggerRates` exported
- T3.2 boundary lint: `eslint.config.js` adds `no-restricted-imports` for `src/blueprint-editor/domain/schema/**` (no store/UI/Vue/@) alongside the existing engine rule; proven to fire with a temp violating file
- T3.3 engine coverage: `vitest.config.ts` no longer excludes `src/engine/**` (measured, no threshold, banned perf suites untouched)
- T5 release: `.github/workflows/ci.yml` runs `npm run build` after `npm run verify`; `README.md` + `CHANGELOG.md` added; `package.json` version 1.0.0
- T6.1 onboarding: Toolbar shows a `role="status"` row with "Create first floor" + "Import workspace" when the workspace has zero floors
- P7 cleanup: `git rm` on `_archive/` (11 files) and `tools/zed-theme-to-condo.zip`; removed untracked `src/prompt/`; AGENTS.md workflow note updated
- correction (user order, same day): `_archive/` (11 files) and `tools/zed-theme-to-condo.zip` were restored byte-identical from `HEAD` via `git show` redirection (not `git restore`) and re-added; AGENTS.md archive note reverted. The P7 cleanup bullet above no longer reflects the repo state - only `src/prompt/` (empty, untracked) stays removed.
- decision: local port is IndexedDB-only with no localStorage fallback (over: fallback) - because localStorage shares the 5 MB `MAX_PAYLOAD_BYTES` cap; tests exercise the port through `createMemoryStorage`
- decision: `blueprint-data.json` is the single starter and the `*.data.ts` modules + `seed:blueprint-data` are retired (over: keeping both with a guard) - reverses the earlier B5 deferral now that the JSON is read through the version gate and stays out of the app bundle
- decision: `domain/types.ts` split by section into a dependency-ordered `domain/schema/*` with a barrel (over: leaving the monolith) - because the schema kernel boundary cannot be enforced while everything lives in one file
- verified: `npm run verify` -> `16/16 test steps passed` (typecheck, lint, lint:bem/lint:css 35 files, unit 16/16, full tsx matrix, verify:assets 21 assets 0 warnings); `npm run build` exit 0; `git status` shows the new schema/*.ts + WorkspaceModal; `node harness/scripts/verify.mjs check` pass
- not done (needs an explicit order): git commit + `v1.0.0` tag

### full feature documentation - 2026-09-18 09:26 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- read-only reverse-engineering of every user-facing surface; no source behaviour changed
- new `docs/feature-documentation.md`: overview, IA, 40+ feature inventory, per-feature detail (canvas, floors, assets, NPC, settings, workspace/sync), 10 end-to-end workflows, permissions/guards, full settings table, edge cases, unverified list, coverage checklist
- verified by exhaustive static source inspection of all 32 `.vue` components, store/domain/persistence/syncedPayload, composables, editorConfig and schema field specs; interactive browser run not performed (noted in doc section 9)
- note: a live-looking API key (`sk_...`) was pasted by the user into chat; recommend rotating it

### thai non-technical user guide - 2026-09-18 09:37 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- user order: not technical, public-release style, then: more detail naming every button/thing
- new `docs/user-guide-th.md`: plain-language Thai guide - screen overview, toolbar groups, canvas + view toggles + zoom + floor switcher, asset palette + picker, properties panel states, Edit Asset 4 tabs, Settings 4 tabs, Save-Origin / Floor / NPC / Deploy / Workspace / Shortcuts modals, full keyboard table, 3 step-by-step examples, toasts/confirms
- no source behaviour changed; exact on-screen English labels kept inline so users can match the UI
- verified: `node harness/scripts/verify.mjs check` pass; route -> no matching suite (docs only)

### remove Sync Game button - 2026-09-18 10:12 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- user order: remove the toolbar `Sync Game` button "so it is not confusing"
- `Toolbar.vue`: deleted the button, its `onSyncToGame` handler, and the now-unused `.editor__toolbar--spacer` scoped class (zero call sites left)
- store `syncToGame()` deliberately kept (`store/persistence.ts`, `state.ts` interface) - it is now UI-unreachable, documented as such; the toolbar has no other button that applies the blueprint to the game
- docs kept true in the same change: `docs/crud-reference.md` (How -> No UI), `docs/feature-documentation.md` (inventory + feature section + workflow 5.9 + permissions row marked removed), `docs/user-guide-th.md` (section 2.6 removed, example step reworded), `docs/skill/data-flow.md` (egress note), `syncedPayload.ts` header comment
- decision: keep the store function, remove only the UI (over: delete `syncToGame` too) - because removing it touches the store interface/persistence contract and is a separate order; the button was the confusion source
- verified: `node harness/scripts/verify.mjs route` -> `npm run lint:bem` pass (35 files), `npm run lint:css` pass (35 files), `npm run typecheck` exit 0, `npm run test:sync-payload` exit 0
- not mine: `src/blueprint-editor/data/blueprint-data.json` was already modified in the working tree before this task (read-only inspected, never written here)

### drop generated docs, keep crud-reference - 2026-09-18 10:40 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- user order: delete the generated documentation (option 1); duplicated content across three docs confused agents
- removed `docs/feature-documentation.md` and `docs/user-guide-th.md` (both untracked, created this session)
- kept `docs/crud-reference.md` - it is the tracked canonical store-CRUD doc referenced by `docs/skill/ui-layout.md` rule 4
- no live references remain outside `history.md` (point-in-time log, left unrewritten)
- verified: `node harness/scripts/verify.mjs check` pass; grep shows no non-history references

### wiring audit fixes 1-6 - 2026-09-18 11:52 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- user order: fix audit items 1-6, defer item 7 (doc mismatches); read-only audit found them first
- 1 `store/migrate.ts`: carries `editorSettings` through migration (was persisted+validated, then dropped by `migrate` -> Settings editor tabs reverted on every reload/import)
- 2 `syncedPayload.ts` `toObjectData`: routes through `normalizeObjectPlacement` + `normalizeText`, drops objects with unusable placement, instead of raw-copying id/type/x/y/rotation/colors/label
- 3 `domain/schema/dataFile.ts` `validateLayoutData`: now a pure `boolean` validator (no raw cast, no mutation); `migrate.ts` call site updated
- 4 `vite.config.ts`: dev middleware `/__blueprint-data` uses canonical `readBlueprintDataFile` (version gate + migration chain) instead of `normalizeBlueprintDataFile`; `tsconfig.node.json` includes `store/schemaMigration.ts`
- 5 `store/localPort.ts` save: adds read-back verification (parse + canonical normalize) matching the HTTP port, instead of returning true blindly
- 6 `store/floors.ts`: `renameFloor`/`updateFloor` normalize name/label via `normalizeText` and refuse blank (a blank label previously made every later whole-file save fail)
- regression checks added to the matching suites: `tests/test-migrate.ts` (editorSettings survives/absent), `tests/test-sync-payload.ts` (ingress object drop + color/label normalization), `tests/test-store-crud.ts` (blank rename/label refused)
- decision: `validateLayoutData` returns boolean (over: returning a normalized cast) - because it is a validation guard whose result `migrate` only truthy-checks; a cast return was the anti-pattern
- verified: `npm run typecheck` exit 0; `npm run test:migrate` pass; `npm run test:sync-payload` pass; `npm run test:store-crud` 29/29; `npm run test:persistence` pass; `npm run test:blueprint-schema` pass; `npm run test:asset-schema` pass; `npm run test:settings-completeness` pass; `npm run test:unit` 16/16; `node harness/scripts/verify.mjs check` pass
- pending (user decision): item 7 crud-reference mismatches (`clearSelection`, `isNpcPreview`, `selectFloor`, `dissolveGroupsIfSmall`, `tagCatalog`)

### delete crud-reference - 2026-09-18 12:05 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- user order: delete `docs/crud-reference.md` immediately (it was the tracked canonical store-CRUD doc; item 7 mismatches are moot now)
- deleted the file and removed the dangling "CRUD gate" sentence from `docs/skill/ui-layout.md` rule 4 (it told agents to update a file that no longer exists); Showcase gate kept
- no live references remain outside `history.md` (point-in-time log) and `_archive/save.txt` (archived, excluded from checks)
- trade-off: the repo loses the enforced store-CRUD/UI wiring map; store API is still discoverable from the `BlueprintStore` interface in `store/state.ts`
- file is recoverable from git history if needed
- note: the opencode harness gate blocked the first ui-layout.md edit because the slot Mission was empty; filled the slot then retried
- verified: `node harness/scripts/verify.mjs check` pass (docs-only change, no suite routed)

### add zed playwright mcp settings - 2026-09-18 12:22 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- user order: project-local `.zed/settings.json` for the Zed Playwright MCP extension, viewport 1900x900
- new file `.zed/settings.json`: `context_servers.mcp-server-playwright.settings` = chromium, headless false, isolated true, viewport_size "1900x900"
- extension itself must still be installed in Zed (`zed: extensions` or Install Dev Extension); the settings file only configures it
- no custom `playwright` server key added, so no duplicate tool set
- verified: file is valid JSON and visible to git as untracked; `node harness/scripts/verify.mjs check` pass (no suite routed for editor config)

### playwright mcp wired + G2 verified in a real browser - 2026-09-18 14:15 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- user order: use Playwright MCP; agent has its own playwright tools (headless chrome-for-testing) and drove the running dev server for real
- `.zed/settings.json` rewritten to a custom local server `playwright` (`cmd /c npx -y @playwright/mcp@latest --browser chromium --viewport-size 1900x900 --isolated`) because the extension-based `mcp-server-playwright` entry never connected (toggle stayed off); extension may still need uninstalling to remove the stale list row
- `.gitignore`: added `.playwright-mcp/` (MCP writes snapshot/console artifacts into the repo)
- E2E verification of fix #1: on http://localhost:5173 Settings -> Display -> `Object label` 8 -> 12 -> blur -> POST `/__blueprint-data` 200 -> reload -> reopen Settings -> Display -> value still 12. Real-browser proof that `editorSettings` now survives `migrate`; headless suites could not catch this
- observed: toolbar snapshot has no `Sync Game` button (removal confirmed in the live app); canvas shows `Empty floor - drag objects from the palette` which matches the seed (`objects=0`, 1 floor `G Lobby`, 21 assets)
- benign pre-existing console warning confirmed live: `Migration: layout integrity issues: NPC defaultRoleId references unknown role:` - `migrate` runs before the top-level npcConfig is assigned, so the integrity check sees no roles (log noise, no data effect)
- restored `src/blueprint-editor/data/blueprint-data.json` from a temp backup after the test write (test had persisted `editorSettings` into the seed; now `editorSettings: undefined`, 1 floor, 21 assets)
- verified: live browser run above; `node harness/scripts/verify.mjs check` pass

### playwright asset placement proven - 2026-09-18 14:32 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- question: can an agent place assets via Playwright? Answer: yes, demonstrated end-to-end
- why it works: palette drop is a custom flow (`mousedown` on the asset row -> `startAssetDrag` -> window `mousemove`/`mouseup` -> `addObject`), not native HTML5 DnD, so a raw `page.mouse.down/move/up` sequence drives it; Playwright's `browser_drag`/`dragAndDrop` (native dragstart/drop) would NOT trigger it
- run: `browser_evaluate` returned asset row center (147,216) + canvas SVG rect; `browser_run_code_unsafe` did `mouse.move -> down -> 12 interpolated moves -> move canvas center -> up`
- result: palette badge for "Table 1" went 0 -> "1 placed object", and the seed gained `{"id":"obj-4777e9d306","type":"table-1","x":780,"y":500,"rotation":0}` (persisted placement only, no w/h - resolved from the definition, matching the definition/instance contract)
- caveats recorded: drop must end inside the canvas SVG and pass `canPlaceObject` (building bounds + no overlap + mode `object`); every placement auto-saves to the active port, so with `npm run dev` it rewrites `blueprint-data.json` (back up or use `preview`)
- restored `src/blueprint-editor/data/blueprint-data.json` from the temp backup after the test (floor objects back to 0)

### all origin asset fills set to white - 2026-09-18 14:42 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- user order: set every asset's Appearance fill color to `#ffffff` (interim)
- edited the canonical store `src/blueprint-editor/data/blueprint-data.json` directly: all 21 `originAssets[].defaultFillColor` = `#ffffff` (was 13 distinct colors)
- only `defaultFillColor` changed; `defaultStrokeColor`, geometry, tags, grids untouched
- verified: `npm run verify:assets` -> PASS 21 assets valid, 0 errors, 0 warnings; live reload in the browser shows the placed object rendering white
- state: the seed still holds 1 object (`table-1` at 780,500) from the earlier placement test - my test artifact, left in place
- trade-off: direct store edit bypasses the editor UI (no per-asset propagate pass), but fill lives only on the definition and instances resolve it, so no instance update is needed
- reversible via the temp backup or git

### free tool marquee can select wall/door tiles - 2026-09-18 15:42 UTC+7 (opencode, cline-pass/deepseek-v4.1-flash)
- bug: free-tool marquee selected only objects whenever any object overlapped the rect, so wall/door tiles were unreachable (e.g. edge-road to edge-road drag)
- root cause `useCanvasSelection.ts` onBoxSelectMouseUp: `onTileMarquee` ran only in the `hitIds.length === 0` branch
- fix: tile marquee now runs first and, when it hits a blocked/door run, wins exclusive over object selection; EditorCanvas `onTileMarquee` returns true when it set the erase region
- note: a marquee can never start on an object (`onObjectMouseDown` stops propagation), so no start-point disambiguation was needed
- trade-off: rects that cross a wall now select tiles, not objects; object marquee still works inside wall-free areas (multi-select also via shift-click)
- verified: `npm run lint:bem` + `npm run lint:css` + `npm run typecheck` pass (route for the `.vue` change)
- verified live (Playwright, dev server): marquee over a blocked tile + the table-1 object -> 7 `.editor__erase-guide`, 0 object overlays; marquee around the same object in a wall-free rect -> 0 guides, 1 object overlay
