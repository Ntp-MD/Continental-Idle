## Mission

- Mode: autopilot
- Foundation-first rebuild of the editor store/persistence core (critique items 1-9; #10 recap deferred). Locked: store = `createBlueprintStore({ persistence, sync, seed })` factory (option B) + ports + single-writer `commit` + provide/inject; #2 + #1 are ONE phase; #8 guard lands before production changes. T0 done, T1 done, T2 IN PROGRESS.

## Plan

- [x] T0 (#4) single building-area resolver (`resolveBuildingArea`), no default arg, all callsites routed.
- [x] T1 (#8) test guard: `scripts/run-tests.mjs` aggregate (`npm test`), vitest covers `tests/component/**`, first UI test `tests/component/EditorCanvas.test.ts`, coverage wired.
- [ ] T2 (#2 + #5 + #7) IN PROGRESS - source refactor DONE and typechecks clean; only test rewrites + full verify remain.
      done: `store/ports.ts`, `store/httpPorts.ts` (retry/413/verify now live here), `store/state.ts` (EditorState + BlueprintStore type + initAssetFields + createEditorState + dragState), `store/createStore.ts` (factory: single-writer `save` queue + snapshot/revert + `runExclusive` replaces withStateLock), `store/index.ts` (provideBlueprintStore/useAssetsStore injection), `blueprintStore.ts` re-exports, `App.vue` creates + provides the store; command modules converted to factories with local aliases (floors, objects, assets, tags, mode, selection, metadata, npcDefault, persistence, flatten); globals removed from components (DeployNpcModal uses `store.state`, NpcRoleDetail/NpcTaskCard/AssetProperties use `store.managedTagSet`).
      remaining: rewrite `tests/test-store-crud.ts`, `tests/test-persistence.ts`, `tests/component/EditorCanvas.test.ts`; then run `npm test` + typecheck + eslint + routed lint:bem/css; then tick T2.
- [ ] T3 (#1) storage contract (format LOCKED: one canonical `src/blueprint-editor/data/blueprint-data.json`, dev middleware read/write JSON, retire `.data.ts` to seed, drop `guard:data-restore`). Design WITH T2. Depends T2.
- [ ] T4 (#6) stable sync identity (floor key not order-fragile) + game loader. Depends T2, touches runtime contract.
- [ ] T5 (#3) god-file decomposition (`types.ts`; `EditorCanvas.vue` after T1 UI tests; `npcEngine.ts` only with a base/mixin plan). Depends T1.
- [ ] T6 (#9) perf gate: thresholds + cadence for `test:npc-perf`/`test:npc-scale`, out of the fast matrix.
- [ ] #10 (deferred) process-vs-product recap after 1-9.

## Blockers

- (none) - the refactor compiles (src typechecks clean); only the 3 test rewrites are left.

## Hand-off Note

- NEXT ACTION: rewrite the 3 test files against `createBlueprintStore` (in-memory `PersistencePort` + recording `SyncPort`):
  1. `tests/test-store-crud.ts` - `const store = createBlueprintStore({ persistence, sync, seed })`; replace `state` -> `store.state`, `clamp` -> `store.clamp`, every command import -> `store.<fn>`; assert the street-width checks against `store.clamp` / `store.moveSelectedTo`.
  2. `tests/test-persistence.ts` - drop the fetch stub; success = port.save resolves true; failure = port.save rejects and assert state reverted (store owns revert now; HTTP retry/413 moved to `createHttpPersistencePort`).
  3. `tests/component/EditorCanvas.test.ts` - provide a store instance into the mount. `STORE_KEY` in `store/index.ts` is private: either export it, or mount a tiny host SFC calling `provideBlueprintStore(store)`. Pick one (prefer exporting the key for test reuse).
- THEN: `npm test` (16 steps) -> fix reds -> `npm run typecheck` -> `npx eslint .` (watch unused imports in the new store files) -> routed `lint:bem`/`lint:css` -> `node harness/scripts/verify.mjs check`.
- Then log T2 in `harness/state/history.md` and start T3 (format already locked).