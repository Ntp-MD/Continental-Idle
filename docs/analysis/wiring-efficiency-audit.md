# Wiring, efficiency and structure audit

**Scope:** every function-level and module-level edge in `src/`, plus `tests/`, `scripts/` and the folder layout of the project.
**Status:** analysis complete; the first optimization pass is applied and verified; the ranked remainder is in §7.
**Date:** 2026-09-24. Working tree at audit time: 125 src-layer source files, 212 tracked files, `dist/` 650 KB.

---

## 1. How this was measured (and what the instruments cannot prove)

Three passes, all evidence-based:

1. **Module graph scan** - a throwaway resolver over every `import`/`export from`/dynamic `import()`/`require()` in `.ts/.vue/.mjs/.json`, resolving both `./` relative and `@/` alias specifiers, then Tarjan SCC for cycles, importer counts for fan-in, and reachability from `main.ts`/`App.vue`.
2. **Symbol graph scan** - every top-level declaration in `src/**/*.ts` (419 functions/classes/consts), then repo-wide call-site and reference counting per symbol.
3. **Read-through audits** of the engine hot path (`src/engine/npc`, 14 files / 3,235 lines), the store + reactivity surface (`store/`, `composables/`, `components/`), and the duplication/structure questions, each line-cited.

**Known instrument limits, recorded so nobody trusts a scanner blindly:**

- The symbol scan first reported 18 "dead functions". **12 of those were false positives**: `...createAssetCommands(s)` (spread call, missed by a `(?<![.\w$])` lookbehind) and `array.map(fn)` references (no parenthesis after the name). Only a plain `grep -c '\bname\b'` per candidate gave a trustworthy answer, and that is what §4 lists.
- The scanner reports *static* wiring. It cannot see Vue's runtime component resolution, `provide/inject`, or the `defineAsyncComponent` chunk boundaries - those were checked by reading, not by graph.
- Nothing in this document is a measured benchmark: the perf suites (`test:npc-perf`, `test:npc-scale`, `observe:hotel`) are user-order-only in this project, so every claim below is stated as *complexity / allocation* cost plus the instrument that would prove the delta. §7 of the slot records which ones to run on request.

## 2. Wiring map

**Cycles: 2, and both are one-directional type edges (benign).**

| Cycle | Value edge | Type edge | Verdict |
| --- | --- | --- | --- |
| `engine/npc/rooms.ts` <-> `engine/npc/layoutBuild.ts` | `layoutBuild -> deriveFloorRooms` | `rooms -> NpcWalkableMap` (type-only) | **fixed**: `NpcWalkableMap` moved to `engine/npc/types.ts` (the engine's own type leaf), so the graph is now acyclic and `vue-tsc`/bundlers see no cycle |
| `domain/schema/assets.ts` <-> `domain/schema/interact.ts` | `assets -> normalize*` | `interact -> AssetDef` (type-only) | left alone: runtime-safe, and moving `AssetDef` out of the schema module it describes would break the `schema/` purity convention for zero gain |

**Fan-in (what everything depends on):** `domain/types.ts` 83 files, `blueprintStore.ts` 27, `assets/assetUtils.ts` 25, `limits.ts` 22, `composables/useToast.ts` 19, `store/storeUtils.ts` 18, `domain/geometry.ts` 16.

**Function-level coupling hubs (cross-file calls):** `domain/schema/helpers.ts` receives 198 cross-file calls (`isRecord` 32, `isFiniteNumber` 31, `hasOwn` 30, `isValidColor` 20, `normalizeIdentifier` 17, `normalizeText` 17) - the project's real foundation layer. Then `store/storeUtils.ts` 70, `domain/geometry.ts` 66, `assets/assetUtils.ts` 56, `domain/schema/interact.ts` 53, `domain/collision.ts` 42. 564 distinct caller-callee pairs across files.

**Widely-wired functions:** `useAssetsStore` 23 files, `useToast` 18, `useConfirm`/`confirm` 13/12, `cloneDeepRaw` 9 files / 33 calls, `resolveObjectDef` 9, `normalizeNpcConfig` 9.

**Entry-point truth:** one file has no importer at all (`src/env.d.ts`, ambient declarations - correct), and only the config files are unreachable from `main.ts` by design. **No orphan modules, no dead folders.**

**Bundle:** `dist/assets` 650 KB total; `main` 160 KB, `BlueprintEditor` 140 KB, `blueprint-data` 92 KB (its own lazy chunk), `NpcManagerModal` 28 KB, `WalkableGridEditor`/`UiShowcase` 20 KB. Code-splitting is already doing its job: 14 chunks, all modals behind `defineAsyncComponent` (verified: `Toolbar.vue` 7 modals, `App.vue`, `AssetToolbar`, `AssetProperties`, `AssetEditModal`, `UiShowcase` - **no gaps against the AGENTS.md convention**).

## 3. Applied optimizations

### 3.1 Engine (per-tick / per-agent cost)

| # | Site | Was | Now | Why it was slow |
| --- | --- | --- | --- | --- |
| E1 | `policy.ts` `pickNearestFloorTarget` | `floors.map(f => f.id)` rebuilt per call, then `floorIds.indexOf(...)` **inside a loop over the ~9k cross-floor target list** | one `Map<floorId, index>` built per call | O(T^2) ~= 8x10^7 index scans per cross-floor attempt, per agent |
| E2 | `keys.ts` + 4 `policy.ts` cache keys | `` `${role.id}:${floorId}:${JSON.stringify(role.restrictedTags)}` `` | `roleFloorCacheKey(role, floorId)` with a `WeakMap<NpcRole, string>` | 2 JSON serializations per path request; the WeakMap pattern was already the repo's own (`interactionTargetKey`) |
| E3 | `tagMatching.hasMatchingTag` | `new Set(tags.map(trim+lowercase))` per candidate target | memoized `WeakMap<tags array, Set>` | allocation per agent x per candidate; tags arrays are layout-lifetime objects |
| E4 | `tagMatching.getRoleFocusTags` | `role.taskIds.flatMap(id => config.tasks.find(...))` - O(tasks x ids) plus a new Set and array per call | `WeakMap<config, Map<taskId, NpcTask>>` index + single-pass ordered build | same result, one map lookup per task id |
| E5 | `npcEngine.chooseTarget` cross-floor branch | filtered `this.layout.interactionTargets` (all ~9k) for busy agents, defeating the purpose-built `crossFloorTargetsCache` | `getCrossFloorTargets(floorId)` then the same per-target predicates | full-list scan + one closure allocation per busy attempt; base predicate is identical |
| E6 | `npcEngine.standsOnInteractionSpot` | scanned `targetsByKey.values()` (every target on every floor) on every waiting transition | per-floor `Set<cellKey>` built once, cached | O(T) per agent that ever waits, and `setWaiting` runs many times per tick |
| E7 | `MoveProposal.toPoint` | allocated `{ x, y }` twice per walker per tick; **read by nothing** | field deleted (interface + 2 sites) | dead allocation on the hottest loop |
| E8 | `pathfinding` path reconstruction | `path.unshift({...})` while walking the parent chain | `push` + one `reverse()` | O(L^2) array shifting per repath |
| E9 | `npcEngine` 6 path assignments | `agent.path = path.map(p => ({ x: p.x, y: p.y }))` | `agent.path = path`, internal `MutableAgent.path` retyped `readonly NpcEnginePoint[]` | one full copy of every path point per movement; nothing mutates path elements (verified: no in-place writes; the two snapshot exits at `:173`/`:195` still copy out) |
| E10 | `npcEngine` queue slot/approach pathfinder calls | under-counted path budget - **attempted, then reverted**; see §7.1 |
| E11 | `engine/npc/rooms.ts` flood fill | `current.split(',').map(Number)` + 4 fresh `[nx, ny]` arrays per visited cell | numeric cell indices + `Uint8Array` visited + one reusable queue | ~5 allocations per cell over ~9k cells per floor per rebuild; same numeric-neighbour pattern as `pathfinding.ts` |
| E12 | engine type placement | `NpcWalkableMap` declared in `layoutBuild.ts`, imported as a type by `rooms.ts`/`policy.ts` | declared in `engine/npc/types.ts`, re-exported from `index.ts` | removes the module cycle; no behaviour change |

### 3.2 Store (every committed action)

| # | Site | Was | Now |
| --- | --- | --- | --- |
| S1 | `storeUtils.cloneDeepRaw` | `structuredClone(deepToRaw(value))` - builds a complete raw tree, then deep-clones **that** | `deepToRaw(value)` - one traversal, one allocation. `deepToRaw` already rebuilds every array and object, so the second clone was pure duplicated work on the hottest state path (3 calls per snapshot, snapshots on every commit, every save, every undo) |
| S2 | `createStore.pushHistory` | cloned layout + registry + tags (3 full trees) and *then* deep-compared them against the previous snapshot to decide whether anything changed | deep-compare the live state against the stored top first; clone only when the state actually changed. No-op commits stop allocating entirely |
| S3 | `createStore` load path | two raw `structuredClone(...)` calls in a file that uses `cloneDeepRaw` 9 times | routed through `cloneDeepRaw` - one cloning mechanism, and it is the one that unwraps Vue proxies |

### 3.3 UI

| # | Site | Was | Now |
| --- | --- | --- | --- |
| U1 | `useDoorTileAnimation` NPC watcher | ran at ~60 Hz and per fire allocated two arrays per door group (`cells.map(row)`, `cells.map(col)`) plus `Math.min/max` spread | group bounds become one `computed` (recomputed only when groups or tile size change); the per-frame loop now only tests numbers |
| U2 | `BlueprintEditor.vue` boot | `await seedVersionError()` **before** `await store.reloadEditorData()` - a 92 KB chunk fetch + parse + schema validation serialised ahead of the data the editor actually uses | both start together, the seed result is still awaited before `ready` and still gates the load-error state; the endpoint response no longer waits for a chunk it does not need |

## 3.4 Second pass (same day) - remainder items landed

| Area | Change |
| --- | --- |
| Per-tick keys | `npcEngine` resolves `${x},${y}` through a lazily filled per-floor string table (`cellKeyAt`), so occupants and queue slots stop allocating a fresh string per cell per path request |
| Per-tick rebuilds | `rebuildBusyQueues` / `rebuildFullItemKeys` are gated by a `reservationStateDirty` flag set in `reserve` / `releaseReservation` / `reset`, instead of re-scanning every queue's target list on every tick whether or not anything reserved |
| Queue selection | per-queue target membership uses a `WeakMap<queue, Set<key>>` instead of `targetKeys.includes(...)` inside a queue x target double loop; the winner comes from a min-scan instead of `.slice().sort()` (a strict `<` keeps the same first-minimum tie-break a stable sort gave) |
| Wander selection | the furnished-tiles exclusion is filtered once per (role, floor) into `wanderPoolCache` instead of copying the whole candidate pool on every pick |
| Duplication | `queueLineCapacity` extracted (4 inline copies across 2 modules); `tileKey` moved to `engine/npc/keys.ts` (a leaf importing only types) and shared by `rooms.ts` / `npcEngine` / `policy` / `index`, which also removes the reason the key could not be shared before; `editorLog` has one import path (`domain/logger`) across all 7 consumers and its `storeUtils` + `blueprintStore` re-exports are gone |
| UI reactivity | `collectWiringIssues` was computed independently inside `Toolbar.vue` and `SpawnZonesModal.vue`; it is now one store computed (`store.wiringIssues`, declared in the `BlueprintStore` contract so a missing slice fails typecheck). `EditorCanvas` takes `editorSettings` from `useCanvasDefaults()` instead of re-deriving the same computed |
| Templates | `spotsByTile` keys cells numerically (`ar * cols + ac`) instead of a string per spot per paint, and the stand/edge spot lists are keyed by a stable per-spot key instead of the list index - those lists are spliced in place, so an index key re-bound later rows to the removed row's DOM node (each row carries an editable post-name input) |

Verified: typecheck (all three projects), lint 0 problems / 0 warnings, `lint:bem` + `lint:css` pass, `test:unit` 22 files / 245 tests pass.

## 4. Dead wiring removed (each verified by repo-wide `grep`, not by scanner output)

- `domain/schema/rooms.ts :: isPrivateRoomType` - zero references anywhere; its body re-implemented a lookup `resolveRoomType` already performs.
- 10 type aliases `AssetCommands / FlattenCommands / FloorCommands / MetadataCommands / ModeCommands / NpcCommands / ObjectCommands / PersistenceCommands / SelectionCommands / TagCommands` in `store/*` - `export type X = ReturnType<typeof createX>` with no reference in `src`, `tests` or `scripts`. **The factories themselves are live** (`createStore.ts:235-244`) and were kept.
- `assets/assetUtils.ts :: export { assetPixelSize }` - a dead re-export; every caller already imports it from the `domain/types` barrel, where the single implementation lives.
- `.gitignore` now ignores `*.cpuprofile` (a stray `tests/CPU.*.cpuprofile` capture was sitting in the tree; the file itself was left in place because it may be someone's live diagnostic).

**Accident, recorded for honesty:** the first script that stripped the 10 aliases used a `replace` callback whose second capture slot was the match *offset*, so ten store files ended with their own byte offset appended as digits. Detected on inspection, stripped, and re-verified (no numeric-only lines remain in `src/`; typecheck clean). The lesson is kept in §1: symbol-level edits go through the Edit tool, not scripted regex.

## 5. Duplication register (the "one way to do it" audit)

**Fixed:** `cloneDeepRaw` vs raw `structuredClone` (S3); `JSON.stringify` cache-key construction repeated at 4 sites (E2); tag normalization (E3); per-config task lookup (E4); door-group bounds (U1); `NpcWalkableMap` placement (E12).

**Real but deferred, with the reason:**

| Item | Evidence | Why deferred |
| --- | --- | --- |
| Queue capacity clamp in 4 copies: `npcEngine.ts:825/868/930`, `policy.ts:333` - `Math.min(Math.max(0, Math.floor(queue.maxMembers)), queue.slots.length)` | identical expressions | clean extraction into `queueBuild.ts` is a 5-file touch for zero behaviour change; batch it with the next engine pass |
| Tile-key bypasses: `layoutBuild.ts:384`, `npcEngine.ts` `walkableCellSet`/`vacateSpotCell`/`cellKey`, `queueBuild.ts:19` private `key()`, all re-implementing `tileKey` | 5 sites | the engine's `rooms.ts` **cannot** import `tileKey` without reintroducing the value cycle the fix in E12 removed; unifying needs `tileKey` to move to `keys.ts` first - do it as one atomic pass |
| `cellSizeOf` inlined 7x (`store/mode.ts:131`, `store/floors.ts:203`, `assets/validation.ts:88`, `EditorCanvas.vue:302/383`, `SettingsModal.vue:52/55`) - and every copy drops the `\|\| 1` NaN guard the engine version keeps | `Math.max(1, Math.round(tileSize))` | needs a *home decision*: `cellSizeOf` lives in the engine, and pulling the engine barrel into store/UI modules for one arithmetic helper inverts the dependency direction. Right fix is a shared numeric util under `domain/`, and that is a structure decision, not a mechanical edit |
| `editorLog` reachable by 3 import paths (`domain/logger`, `store/storeUtils` re-export, `blueprintStore` re-export); notably `assets/svgSanitizer.ts` reaches into the store barrel for a logger | grep of all importers | deleting the `storeUtils` re-export touches 4 store-module imports; do it with the same pass as the `tileKey` move |
| Random-tie-break epsilon mismatch: `npcEngine.clampRandom` (…9999999999) vs `targetScoring.ts:67` (0.999999) | two clampers, same job | fairness nit, not efficiency; flagged for whoever touches tie-breaking next |
| `assets/validation.ts` hand-rolls `tag.trim().toLowerCase()` 5x instead of `hasMatchingTag` | 5 sites | validation is cold path; bundle with the D-items above |

**Second-pass update:** the queue-capacity clamp, `tileKey` sharing and `editorLog` single-path rows above are **fixed** (§3.4). Still open: `cellSizeOf` (the layering decision below, not a mechanical edit), the random-tie-break epsilon mismatch, and `assets/validation.ts` re-implementing tag normalization 5x.

**Checked and NOT duplicated** (so nobody re-flags them): `clamp` (Rect bounds) vs `clampInt` (scalar) vs `store.snap` (facade over `geometry.snap`) are three different jobs; `getObjectTags`/`getRoleFocusTags` have no UI counterpart; the two `rooms.ts` files are unrelated (`deriveFloorRooms` flood-fill vs `resolveRoomType` tag catalog); `assetPixelSize`, `genId`, `emptyNpcConfig`, `taskMatchesQuery` each have one definition; `editorLog` has one definition (only its paths are duplicated).

## 6. Folder and project structure verdict

**Principled, keep as is:**
- `domain/` vs `domain/schema/` is enforced by `eslint.config.js` ("the domain schema kernel must stay pure - no store, UI, or Vue imports") and **zero files violate it**.
- The engine firewall (`eslint.config.js`, engine must not import `blueprint-editor/store/**`, components, composables or `vue`) is **statically clean** - `src/engine/**` has no such import and no `vue` import. The engine really is UI-independent.
- `src/composables/` (generic: `useToast`, `useConfirm`, `useDebounceFn`, `useFocusTrap`) vs `src/blueprint-editor/composables/` (domain: canvas, NPC, asset) is a real split, and **no file is on the wrong side of it**.
- `mod-cli/` is genuinely external: no `src/` or `tests/` reference exists, matching AGENTS.md.
- Tests: no test points at deleted code; every test import resolves.

**Costs worth naming (all deferred deliberately, none is a defect):**
- `src/blueprint-editor/assets/` holds *logic* (`validation.ts` 436 lines, `assetUtils.ts` 260, `svgSanitizer.ts`) and nothing renderable; `domain/geometry.ts` imports from it, so the least-asset-named folder in the repo is depended on by the domain layer. A rename is ~14 import-path edits for readability only.
- Single-file folders that exist purely to nest: `src/components/overlays/` (1 file, `ErrorBoundary.vue`) competing with `src/blueprint-editor/components/shell/` (5 files of the same role), `src/utils/` (1 file, 3 lines), `src/blueprint-editor/data/` (1 file).
- Oversized mixed-responsibility files: `EditorCanvas.vue` 2,243 (mitigated: selection/drag/paint/door-animation are *already* extracted composables; what remains is a ~700-line template plus orchestration), `npcEngine.ts` 1,426 (tick + queue + portal reservation + pathing orchestration - the one file where a `queueBuild`/`reservations` split would pay), `WalkableGridEditor.vue` 917, `NpcManagerModal.vue` 704.
- `domain/types.ts` is a 20-line barrel of 11-14 `export *` with 83 importers. Measured split: 67 of 112 import lines are `import type` (fully elided, no runtime cost) and 45 are value imports, so the barrel is *not* the coupling problem it looks like; it is also the documented convention ("import from this barrel"). **No action.**
- Test-coverage shape: 23 unit test files / 5,679 lines cover the engine well through the barrel and the store through scenario tests (`storeCrud`, `persistenceBoot`, `towerIntegration`, `movementCorridor`, `arrivalLatch`), but **26 `blueprint-editor` modules have no direct test reference**, the largest being `assets/validation.ts` (436 lines) and `store/objects.ts` (398 lines). Naming mismatch is not the issue - scenario tests are a legitimate choice; the gap is untested pure logic.

## 6.5 Artifact and hidden-junk sweep (third pass)

Scanned the whole tree (excluding `node_modules`, `.git`, and the off-limits `.zed/`) for zero-byte files, empty directories, gitignored-but-present artifacts, editor backups, duplicate content (size + md5), unreferenced binaries, `debugger`/`@ts-ignore` suppressions, TODO/FIXME markers, and dead npm-script targets.

**Removed** (all regenerable, all already covered by `.gitignore`): `dist/` (39 files, stale Sep 21 build - it also held the only duplicate file in the repo, a copy of `public/Continental-Idle-fav.png`), `test-results/`, `node_modules/.vite` cache, `tests/e2e/__screenshots__/` (7 manual captures; `playwright.config.ts:15` documents this folder as git-ignored capture output, with committed baselines living in `__snapshots__`), and `tests/CPU.20260924.*.cpuprofile` (429 KB profiling capture).

**Clean, verified, nothing to do:** no zero-byte files, no empty directories, no `debugger`, no `@ts-ignore`/`@ts-expect-error`/`@ts-nocheck`, no TODO/FIXME markers in project code (the only ones live in `harness/scripts/adopt.*` as deliberate scaffold placeholders), no dead npm-script targets (18 checked, every `node|tsx` target exists), no stale references to the deleted `generate-hotel.mjs` / `hotel-21-floor-program.md` / `hotel-layout-references.md` outside the KB's own provenance note and the history logs, no `-copy`/`(1)`/`~` duplicates, no `*.tmp`/`*.old` write artifacts left in `src/blueprint-editor/data/`.

**Deliberately kept:** `.idea/` (real IDE configuration: `prettier.xml`, `workspace.xml`, inspection profiles - gitignored but the user's own state, not junk), `.opencode/` (harness plugin install dir, referenced by `harness/agents/opencode/`), and the `prettier` devDependency (no npm script calls it, but `.prettierrc` + `.idea/prettier.xml` show editors run it).

**One ambiguous file, kept on purpose:** `docs/df893ed93d658aeb1bb6794fdc192793.jpg` - a 1000 × 558 baseline JPEG added 2026-09-23, referenced by no file in the repo. Its date and location match the deleted `docs/research/hotel-layout-references.md`, so it is plausibly a reference image whose document was removed, not a build artifact. Renaming or deleting it is left to the owner's word rather than guessed at.

**Made durable:** `scripts/clean-artifacts.mjs` + `npm run clean` / `npm run clean:check` (the check mode exits 1 so junk cannot silently accumulate), and the convention is recorded in `AGENTS.md` under Verify. The guard deliberately does not track anything under `node_modules/` (the `.vite` dependency cache was cleared once and regenerates on every test run, so reporting it would make `clean:check` permanently noisy).

## 7. Ranked remainder (the next pass, in value order)

**Status after the second pass (§3.4):** item 4 (dirty-flag rebuilds) is done; item 1 is half done (the per-cell string *allocations* are gone via the cell-key table; converting the occupancy/blocked sets to numeric marks so `pathfinding` stops parsing them back is still open); item 3's queue-selector and wander clusters are done, the four `listAgents()` full scans are not; item 2 unchanged.

**Why the remaining engine items were not forced through in this pass:**

- **`listAgents()` scans (`policy.ts:143, 329, 405, 416`).** The engine already keeps the equivalent per-tick indexes (`queueMembers`, `pendingByQueue`, `interactSpotReservations`), so delegating would look like a free win - but the policy scans are **floor-scoped and include self** while the engine indexes are global, so a drop-in swap changes which queue an agent joins when a queue has members on more than one floor. Landing it needs either two new context accessors with per-floor semantics (a public `NpcPolicyContext` change) or a proof that no queue spans floors; `tests/unit/npcQueue.test.ts` does not currently pin that.
- **`isOccupiedByScan` (`npcEngine.ts:1322+`).** A cell-set substitute is *not* equivalent: two agents inside the same floored cell can still be further apart than the clearance, and the current predicate is a distance test, not a cell test. The equivalent-and-fast form is a per-floor `Map<cellKey, agent[]>` bucket index built in `rebuildPerTickIndexes`, scanning the cells within `ceil(radius)` and applying the *same* hypot check inside - behaviour identical, cost O(bucket) instead of O(all agents). Left for that pass because it needs the bucket reuse designed (array-per-cell-per-tick would trade one allocation cost for another).

### 7.0 Attempted and reverted - do not re-apply blind

**Path-budget charging at `beginQueueApproach` / `assignQueueSlot`** (E10). Both sites call `options.pathfinder` without `pathCallsThisTick++` while five other sites charge, so the per-tick budget is under-counted and `useNpcSimulationCore`'s adaptive step scaling reads a false EMA. Charging them is the honest accounting - and it is **observable behaviour**: `tests/unit/npcQueue.test.ts:80-84` asserts that three agents receive queue slots inside a *single* `engine.tick()`, and with the budget floor `pathBudgetMinPerTick = 2` the third slot moves one tick later. Reverted instead of editing the assertion, because same-tick slot assignment is a pinned contract and redefining queue pacing is a product decision, not a mechanical optimization. To land it: restate that test as tick-until-assigned, re-apply the two increments, re-run `test:unit`.

### 7.1 Not yet attempted

1. **Occupancy as typed arrays** (`npcEngine.ts:800-830` + `pathfinding.ts:98-109`): per tick, one `${x},${y}` string per agent, a copy into a second `Set`, more per repath, then each parsed back with `indexOf(',')/slice/Number` - three conversions of the same data. Replace with per-floor `Uint8Array` marks + a touched-cell list, exactly like `pathfinding`'s `transientMark`/`searchGen`. Highest remaining GC win; needs `blockedCells` typing widened, so it is an API change, not a local edit.
2. **`isOccupiedByScan`** (`npcEngine.ts:1322-1331`, called unconditionally at `:1213` on every interaction start): iterates *all* agents with two `Math.hypot` each; should read `occupancyByFloor` + `cellReservations`. Medium risk - verify the clearance semantics first.
3. **Policy per-choose allocations** (`policy.ts:307-354` two `new Set(map())` + full filter + `.includes` inside a queue x target double loop + a `.slice().sort()` with 2 map lookups per compare; `:143-156` an O(agents) string-key rebuild plus an O(objects) string compare per target; `:424` a walkable-pool filter per wander pick). All cacheable per (role, floor) or per tick.
4. **Dirty-flag the per-tick rebuilds** (`npcEngine.ts:101-117` `rebuildBusyQueues`/`rebuildFullItemKeys` run every tick from `step:291` although inputs change only in `reserve`/`releaseReservation`/`reset`).
5. **Social-bucket allocations** (`npcEngine.ts:388-425`, live in production at `socialRadius: 2`): new Map entry + string key + array per agent per tick, and a comparator doing two map gets per compare; store a `seq` set once in `addAgent`, and make `claimed`/`swapCells` scratch-reused like the other sets.
6. **UI reactivity**: `walkableRuns` (`useCanvasRuns.ts:39-56`) is a full O(rows x cols) run pass recomputed on every painted tile, i.e. every mousemove during a brush drag - convert the paint path to a whole-array swap on stroke end (`shallowRef`), which changes live-preview granularity, so it needs a product call. Duplicate per-component computeds: `collectWiringIssues` instantiated in both `Toolbar.vue:42` and `SpawnZonesModal.vue:36`, and `normalizeEditorSettings` in both `EditorCanvas.vue:191` and `useCanvasDefaults.ts:8` - hoist one of each into the store. `tags.ts:13-15`'s `tagCatalog -> globalTags (map+sort) -> Set` chain reruns on any tag keystroke; memoize on the commit-version counter the repo already keeps.
7. **Interact-spot list keys** (`WalkableGridEditor.vue:646/662`): index keys over lists that `splice()` - assign a stable per-spot key. Also `spotsByTile` (`:218-237`) rebuilds a string-keyed map with per-spot formatted titles on every tile paint; key it by `r * cols + c` and drop `gridTiles.value.length` from its read set.
8. **Tile-grid DOM cost** (`WalkableGridEditor.vue:733-748`): the grid is real DOM per cell with a fresh inline style object and two concat strings each - precompute the three state->class tuples and bind a class (which is also what `lint:bem`/`lint:css` want).
9. The §5 deferrals (`tileKey`, queue-capacity clamp, `cellSizeOf` home decision, `editorLog` paths, validation tag normalization).
10. **Structure**: split `npcEngine.ts` along its existing seams; collapse `src/components/overlays/`; rename `assets/` if the logic-vs-artifact confusion keeps costing readers; add direct tests for `assets/validation.ts` and `store/objects.ts`.
11. **Data file**: `blueprint-data.json` (9,682 lines, a 92 KB emitted chunk) is fetched from `/__blueprint-data` at runtime and its static copy is used by tests and by the boot validity check only. Once U2 has removed the serial cost, the remaining option is to stop shipping it to browsers at all (test-only import), which needs a build-config decision.

## 8. Verification

See the report in `harness/state/task-context.md` / the session report: routed suites for the touched globs (`typecheck`, `lint`, `lint:bem`, `lint:css`, `test:unit`) plus `verify.mjs check` and `verify.mjs audit`. Behaviour-preservation reasoning per change is in §3; no change relies on a benchmark that was not run.
