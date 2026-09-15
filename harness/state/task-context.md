## Mission

- Parked: finish the leftover audit/P5 items (giant splits, tests, dups). Audit P1-P4 + tsconfig + 4 P5 splits are DONE and verified (see harness/state/history.md, entries 2026-09-15).
- Baseline: working tree ~81 uncommitted files (harness refactor + audit fixes); nothing committed.
- Read first on resume: `harness/HARNESS.md` + this slot; history has the P5 decisions/limitations.

## Plan

- [ ] Component test for `EditorCanvas.vue` (and/or `WalkableGridEditor.vue`) — jsdom + @vue/test-utils already configured but unused; REQUIRED before any SFC split
- [ ] Split `EditorCanvas.vue` (1904) into composables/subcomponents once tests exist
- [ ] Split `npcEngine.ts` (1311) via base/mixin class (engine suites cover behavior)
- [ ] Split `domain/types.ts` (1766) — needs a section DAG + tsconfig.node include updates (sections interleaved today)
- [ ] Store CRUD tests: `selection`, `objects`, `assets`, `floors`, `metadata`, `mode`, `npcDefault`, `tags`, `state`
- [ ] Dedup `resolveRole` (duplicated in `engine/npc/policy.ts` + `blueprint-editor/composables/useNpcSimulationCore.ts`) into one shared helper
- [ ] Rename `snap`/`clamp` name collision (`domain/geometry.ts` vs `store/state.ts`) e.g. `snapToCanvas` / `clampToBuilding`
- [ ] Extract oversized functions: `useNpcOverlayDraw` (269 + `drawFrame` 164), `findNpcGridPath` (163), `validateSettingsCompleteness` (173), `useCanvasViewport` (145), `npcEngine.chooseTarget` (119) / `resolveWalkingAgents` (114), `types.normalizeOriginAsset` (122), `EditorCanvas.onKeyDown` (95), `buildNpcQueues` (87), `useDoorTileAnimation` (82)
- [ ] FINAL: `npm run verify` + `npm run build` + `verify.mjs check`

## Blockers

- (none)

## Hand-off Note

- Quickest win: the 2 dedups (`resolveRole`, `snap`/`clamp`) — small, safe. For the giant files, start by writing the `EditorCanvas` component test, then split. Verify each ticket with the routed suite (`node harness/scripts/verify.mjs route`) — do not run the full matrix unless asked.