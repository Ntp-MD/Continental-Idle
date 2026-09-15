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
