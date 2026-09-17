## Mission

- Mode: autopilot
- Foundation-first rebuild of the editor store/persistence core (critique items 1-9; #10 recap deferred). Locked: store = `createBlueprintStore({ persistence, sync, seed })` factory (option B) + ports + single-writer `commit` + provide/inject; #2 + #1 are ONE phase; #8 guard lands before production changes. T0/T1/T2/T3 done - next is T4 (stable sync identity + game loader).

## Plan

- [x] T0 (#4) single building-area resolver (`resolveBuildingArea`), no default arg, all callsites routed.
- [x] T1 (#8) test guard: `scripts/run-tests.mjs` aggregate (`npm test`), vitest covers `tests/component/**`, first UI test `tests/component/EditorCanvas.test.ts`, coverage wired.
- [x] T2 (#2 + #5 + #7) store factory + ports + single-writer save/`runExclusive` + provide/inject. Done: factory/ports/`createStore`/`index`/`App.vue` wiring (committed earlier), all 3 suites rewritten against the factory API, revert-aliasing defect fixed (`restoreSnapshot` now installs clones), dead `fetchBlueprintDataFromDisk`/`loadInitial` retired, `crud-reference` + `ui-layout` + glossary updated to the factory API. `npm test` 16/16, typecheck clean.
- [x] T3 (#1) storage contract. Done: `vite.config.ts` reads/writes canonical `blueprint-data.json` (atomic temp+rename + validation); `.data.ts` demoted to one-time seed (`npm run seed:blueprint-data`, byte-identical regen verified); `guard:data-restore` retired (file + script + refs gone); `},`/`};` parse defect fixed; temp plugin round-trip diagnostic passed + deleted; glossary + data-flow docs updated. `npm test` 16/16, typecheck clean.
- [ ] T4 (#6) stable sync identity (floor key not order-fragile) + game loader. Depends T2, touches runtime contract.
- [ ] T5 (#3) god-file decomposition (`types.ts`; `EditorCanvas.vue` after T1 UI tests; `npcEngine.ts` only with a base/mixin plan). Depends T1.
- [ ] T6 (#9) perf gate: thresholds + cadence for `test:npc-perf`/`test:npc-scale`, out of the fast matrix.
- [ ] #10 (deferred) process-vs-product recap after 1-9.

## Blockers

- (none for T2) - the three suites are green and the change is verified.
- Unrelated, not fixed: repo-wide `npm run lint` fails only on the pre-existing `.zed/theme/*.js|mjs` bundle (temporary carried Zed theme, untouched by T2).

## Hand-off Note

- NEXT ACTION: T4 stable sync identity (floor key not order-fragile) + game loader. Depends T2 - satisfied; touches the runtime contract, so confirm the floor-key shape before changing the synced payload.
- Store API is now documented: `docs/crud-reference.md` + `docs/skill/ui-layout.md` describe the factory; `src/blueprint-editor/store/index.ts` exports `STORE_KEY` (component tests inject a store instance through it). Storage contract: `docs/skill/data-flow.md` "Origin asset authoring" + glossary `Origin assets` describe the JSON store; regen via `npm run seed:blueprint-data`.