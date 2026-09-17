# History - shared cross-agent intent log

Entries only. Pattern lives in `harness/HARNESS.md` (History pattern) -
follow it when logging below. Continental-Idle project work only - no
mod-cli records, no harness-meta records.

## Entries (Doing - Finished (Agent, Model) + Detail Bullets)

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
- generator .zed/theme/sync-theme-map.mjs: container surfaces (win->border, titlebar, tabs->tab.inactive_background, crumb, panel, ed, gut, six .code divs, minimap, botpanel, term, status) now carry data-goto with onclick="if(event.target===this)goto(this)" so nested token/tab clicks are untouched; leaf spots wired: â— modified dots, crumb separators->text.disabled + setup()->text, panel headers->text.muted, cursor->text.accent, curline->editor.selection, Problems count->text.accent, terminal state words + faint lines->ansi.*/editor.foreground
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
- verified: 	est:store-crud 21/21 (2 new checks: resizeCanvas over-cap rejected with canvas unchanged; addSvgAsset over-cap rejected + in-cap still imports) · 	est:blueprint-schema pass (+2 ingress cases: 100 000px/25 rejected, 6 400px/25 = 256 tiles accepted) · 	est:asset-schema pass · 	est:migrate pass · 
pm run typecheck exit 0 · 
pm run lint exit 0 · 
ode harness/scripts/verify.mjs check pass
- remaining in T1 (handoff): SettingsModal/ImportSvgModal field-level limits display, and a specific (non-generic) save-failure message for the payload-cap path
