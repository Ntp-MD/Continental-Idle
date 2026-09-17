## Mission

Handoff at 2026-09-17 17:55 UTC+7. Implement the approved review-fix plan (D1-D9 locked): `D1=3+4 (grid cap 256, limits.ts + byte pre-check) · D2=1 (wrap every save() command) · D3=1+4(backup) · D4=1 · D5=1 · D6=1 · D7=none (over-engineer) · D8=2 (P1+P3 first) · D9=A`. First slice = P1 (T1,T2) + P3 (T6,T5,T7).

## Plan

- [x] T1 limits.ts + types.ts caps + parseCanvasConfig/migrate canvas checks
- [x] T1 buildWalkableGrid bound + store guards (assets/objects/metadata/floors/mode/flatten)
- [x] T1 httpPorts byte pre-check + vite.config MAX_PAYLOAD_BYTES + tsconfig.node include
- [x] T1 verified: test:store-crud 21/21, test:blueprint-schema, test:asset-schema, test:migrate, typecheck, lint, verify.mjs check
- [ ] T1 remainder: SettingsModal/ImportSvgModal field-level limits + specific payload-cap save message
- [ ] T2 wrap remaining save() commands (26 fns, 7 files) + 2 tests (serialization red-before-fix, deadlock guard). NO nesting runExclusive
- [ ] T6 flatten walkable=true + test
- [ ] T5 portal spot parity (layoutBuild.ts:324-352) + validation.ts warning + test
- [ ] T7 role-fallback warn in useNpcSimulationCore (not policy.ts)
- [ ] close slice: npm test (16 steps) + verify.mjs check + history decisions

## Blockers

- (none)

## Hand-off Note

Next action: finish T1 remainder (SettingsModal.vue:339-345 + ImportSvgModal.vue limits display; payload-cap message), then start T2. T2 exact list (verified call sites of `save()`): floors.ts (addFloor:16, deleteFloor:32, clearFloor:41, duplicateFloor:64, renameFloor:71, reorderFloors:81, updateFloor:110, paintFloorTiles:133), mode.ts (resizeCanvas:41, setCanvasBgColor/LabelColor/WallColor/GridColor, setStreetFloor:76, setStreetWidth:83, setEditorSettings:97, resetEditorSettings:102), objects.ts (commitMove:273, linkObjects:346, unlinkObject:364, toggleObjectLock:376), tags.ts (addTag:18, removeTag:51), assets.ts deleteAsset:224, metadata.ts pasteObjects:104, npcDefault.ts updateNpcConfig:43. Do NOT wrap moveSelectedTo / selectFloor / setMode / setTileBrush / getters. Constraint: runExclusive must never nest (deadlock). Never run `npm run seed:blueprint-data`. Temp diagnostics in tests/_*.tmp.*, deleted same session.