## Mission

Two missions, both closed: (A) migrate the legacy tsx assert-suites to vitest (user option a: new vitest file first, green, then delete the tsx file + script + runner entry in the same batch); (B) design the complete 21-floor realistic hotel on the tile grid, validated floor-by-floor and building-wide.

## Plan

- [x] Batch 1 new files: arrivalLatch / collision / tagMatching / assetSchema / movementCorridor (.test.ts, 1:1 body, node:assert kept)
- [x] Green-check the 5 new files via vitest (5 files / 22 tests)
- [x] Delete the 5 old tsx files + npm scripts + run-tests.mjs entries (15 -> 10 legacy steps)
- [x] Done verify: test:unit 11 files / 62 tests + lint + verify.mjs check - pass
- [x] Batch 2: persistence + social + migrate (top-level await -> beforeAll/async tests) + blueprint-schema + sync-payload
- [x] Batch 3: settings-completeness + tower-integration (13 + 1 tests; old tsx + 2 npm scripts + runner entries removed)
- [x] Batch 4: store-crud + npc-queue + npc-engine - DONE (`storeCrud.test.ts` 48, `npcQueue.test.ts`, `npcEngine.test.ts`; the 3 tsx files + `test:store-crud`/`test:npc-queue`/`test:npc-engine` scripts deleted)
- [x] Parked cleanups 4c SettingsModal `applyCanvasColor` + 4d `positiveNumber`/`positiveInt` - DONE
- [x] Final: `scripts/run-tests.mjs` + the `test` script retired, `verify` now ends `test:unit && verify:assets`, README row updated; `tsx` stays (audit-behavior + the two perf suites + observe-hotel still use it); AGENTS verify-table needs no re-wording - the `tests/*.ts` row still matches the files that remain
- [x] Hotel: program + references in `docs/design/hotel-21-floor-program.md`, generator `scripts/generate-hotel.mjs` (21 floors, 116 keys, 1799 objects, 100 agents, 4.10/5 MB), seed regenerated, per-floor + cross-floor validators all green
- [x] Hotel visual checkpoints in the rendered editor: floor G fitted (7 spawn zones incl. the new service yard), floor 6 at 60% with NPCs deployed (dashed paths through room doors into the head strip = circulation and door accessibility proven live), floor 20 rendered, floor rail lists all 21 in program order

### Active mission (2026-09-23, live goal)

User goal: (1) NPCs must be able to go everywhere, (2) no wall may be 2 tiles thick, (3) test with 1000+ NPCs, (4) inspect elevator usage, (5) loop on game performance.

- [x] (1) Reachability - DONE. `tests/unit/hotelReachability.test.ts` (4 tests, engine-authoritative, permanent): envelope-wide single connected component per floor, every lift car boardable, zero 2x2 solid blocks, street ring reaches the lobby interior. Found and fixed three real geometry defects in `scripts/generate-hotel.mjs`: the hoistway bank was a sealed box (no NPC could ever reach a lift car on any of the 21 floors - the row-14 wall is now an arcade into the lift hall and the col-12 wall stops at row 14); the stair shafts had dead pockets behind their full-width flights (flights now tile the shaft 5x in S1 / 6x in S2, leaving only the door landing walkable); public floors (1-5, 20) carried no circulation band, so their spaces were islands separated from the hall - `publicFloor` now fills `CORR` and the hall-to-corridor link. Generator `sealed` exemptions are now empty and the `access` check is strict; a new `portal` guard fails when a car has no reachable approach tile.
- [x] (2) Wall thickness - DONE, asserted by the same test (0 masses on all 21 floors) and by the generator's `walls` check.
- [x] (3) 1000+ scale - DONE as a gate: `npm run test:npc-scale-hotel` (`tsx tests/perf-npc-scale.ts --real --scale=12`) spawns the seed's own pool scaled to 1200 agents on the real 21 floors for 5400 ticks and exits 1 if agents < 1000, p95 tick > 16.7 ms, or >5% of ticks drop a frame. Current: avg 7.02 ms, p95 10.29, 0.22% dropped frames. The harness had `const TILE = 25` hardcoded (wrong for this 20 px seed) and spawned agents anywhere in the engine map including the street ring - both fixed.
- [x] (4) Elevator usage - DONE. Measured with the seed's real roles/tasks/pool; four causes found and fixed (see below); the gate now prints rides, per-car boardings, floor pairs, the selector/route/reserve split and observed tile coverage, and `tests/unit/npcPortalCapacity.test.ts` pins cab capacity, full floor-to-floor connectivity and equal car count across floors.
- [x] (5) Performance loop - DONE, five profile-guided rounds: 24.60 -> 15.97 -> 12.86 -> 10.77 -> 7.02 ms average, dropped-frame ticks 97% -> 0.22%, measured at 2100 and then at the honest 1200-agent real-config load.

What the elevator investigation actually found, in order: the selector always chose the *nearest* floor (now density-scored in `policy.ts`); portal targets were built with `capacity: 1` so one rider blocked a whole cab for every destination (now the asset's `interact.capacity`, 4); `NpcRole.crossFloorChance` did not exist, so an agent only ever rode when its own floor had nothing free (added to the schema + normalizer + policy, seeded per role); and the decisive one - the harness was spawning agents on the street ring, outside the envelope, so 15597 "repath-failed" events were agents that could never reach anything. With in-building spawns: 7 rides -> 149, 66 cars, 53 floor pairs, idle 1179 -> 85, and 52.5% of all in-building walkable cells physically visited with every one of the 21 floors entered. Binding limit now: 5 cabs x 4 places = 20 boarding slots per floor (43k "car at capacity" rejections at 1200 agents) - documented as an operational finding in the design doc.

## Blockers

- (none)

### Active mission (2026-09-24, live order)

User order: "clear all floor and emtrp lobby i will build with myself".

- [x] Seed cleared. `blueprint-data.json` now holds one floor - `floor-g` "Lobby", `defaultWalkable: true`, `objects: []`, no `walkable` grid, no spawn zones, no `allowedRoleIds` - and `npcConfig.pool` is 6 guests on that floor. Canvas, the 22 tags, 72 originAssets, 10 roles and 19 tasks are untouched: that catalog is what the hand-build needs. 4.13 MB -> 63 KB. Pre-clear copy left at `%TEMP%\blueprint-data.before-empty-lobby.json`; the tower is regenerable with `node scripts/generate-hotel.mjs --write` (verified: dry run and `--out` still emit 21 floors / 116 keys / 1988 objects from the cleared base).
- [x] Tower gates decoupled from the working seed. New `tests/unit/hotelFixture.ts` runs the generator into a temp dir (new `--out=<file>` flag on `scripts/generate-hotel.mjs`, 0.23 s) and returns normalized floors plus the engine layout. `hotelReachability.test.ts` (2 tests) and `npcPortalCapacity.test.ts` (3) now police the GENERATED tower, so a floor under construction can never redden `test:unit`. `tests/unit/floorGeometry.test.ts` (2 tests, new) is the one suite that judges the working seed: no 2x2 solid block, read through `resolveFloorTileStates` so a `defaultWalkable: false` floor is evaluated correctly, and the street ring must reach the street floor's interior.
- [x] `npm run test:npc-scale-hotel` measures the generated tower as well (`--real` now reads `generatedHotel()`), otherwise the 1000+ agent gate would have been timing an empty lobby.
- [ ] Expected advisory noise while the lobby is empty - the editor's Settings-completeness panel, not a gate: roles focus on tags no placed asset carries, tasks post to unplaced assets, and the street floor has no street-side spawn zone. All of it clears as objects get placed.

## Hand-off Note

Nothing in flight. Done gate for the whole set: lint, typecheck, lint:bem (36 files / 0), lint:css (36 / 0), test:unit 21 files / 241 tests, verify:assets 72/0/0, `verify.mjs check` pass; the generator is byte-stable across consecutive runs (`md5 3095d08d`). Un-banned-by-default leftovers for a future order only: `test:behavior`, `test:npc-perf`, `test:npc-scale`, `observe:hotel`. Hotel items deliberately left open are written up in `docs/design/hotel-21-floor-program.md` §9 (no basement, no window/curtain-wall primitive, no vestibule model, 4.0 sq m bathrooms, accessible-key ratio, pool size assumption).

## Additional Note from user

ข้อ 2 — apply*Color ใน SettingsModal.vue:99-159
สภาพปัจจุบัน: 7 ฟังก์ชัน 56 บรรทัด หกตัวเหมือนกันเป๊ะ ต่างกันแค่ setter กับสตริงข้อความ (และพิมพ์ข้อความซ้ำ 2 ครั้งในฟังก์ชันเดียวกัน — ครั้งใน if (!saved) ครั้งใน catch) ตัวที่เจ็ด applyCanvasBgColor:99-105 ไม่มีบรรทัด if (!saved) ที่พี่น้องมี

บั๊กจริง ไม่ใช่ความสวย: ตัว setter ทุกตัวใน store/mode.ts:54-115 คืน false เมื่อ isValidColor ไม่ผ่าน จากนั้นเรียก saveBlueprintData() เสมอ — ถ้าสีพื้นหลังไม่ผ่านเกณฑ์ หรือเซฟล้มเหลว applyCanvasBgColor จะเงียบสนิท ขณะที่ ColorInput.vue:commitValue() ยิง update:modelValue ก่อน commit แล้ว swatch เปลี่ยนสีให้ผู้ใช้อย่างที่เห็น ผู้ใช้จึงเข้าใจว่าบันทึกสำเร็จทั้งที่ไม่ได้

เพิ่มเช็กแล้วไม่เกิด toast ปลอม เพราะไม่มีเส้นทาง "ค่าเท่าเดิม → คืน false" และ useAsyncAction.ts:7 โยน Action already in progress เมื่อยุ่งอยู่ → ตกไป catch อยู่แล้ว

จุดที่ต้องตัดสินใจ (อย่างเดียว): repo มี 2 อนุบัญญัติ并存 — if (!saved) เงียบเมื่อสำเร็จ (12 ที่) กับ reportSaved toast ทั้งสองทาง (11 ที่ เช่น FloorModal.vue:73,140,156,261 และ SettingsModal.vue:93 ในไฟล์เดียวกันนี้)

ทาง A (ผมเลือก): helper applyColor(failMsg, setter) ในไฟล์ คงพฤติกรรมเงียบเมื่อสำเร็จ → UX เปลี่ยน 0 อย่าง, 56 → ~10 บรรทัด, template ไม่แตะเลยเพราะชื่อ handler เดิมยังอยู่
ทาง B: รันผ่าน reportSaved ที่ import ไว้แล้วที่บรรทัด 4 → ตรง pattern ไฟล์มากขึ้น แต่ได้ success toast ทุกครั้งที่เลือกสี (ColorInput ยิง commit ตอน change เท่านั้น ไม่ใช่ทุกจังหวะลาก → ครั้งต่อการเลือกสีหนึ่งครั้ง ไม่รัวแต่เห็นทุกที)
Route verify: *.vue → lint:bem + lint:css + typecheck

ข้อ 3 — 4 จุดที่รวมว่า "mechanical ~60 LOC" ผมเรียงใหม่หลังตรวจเอง
3-1 ดีจริง: domain/schema/npc.ts:288-302 — 14 บรรทัด ยาวราว 200 ตัวอักษร/บรรทัด รูปแบบ isFiniteNumber(c.K) && c.K > 0 ? [Math.floor(c.K)] : DEFAULT ในบรรทัดเหล่านี้ 8 ตัวมี Math.floor 6 ตัวไม่มี (crossFloorCooldownSeconds, repathCooldownSeconds, repathCooldownExponent, triggerRatePeriodSeconds, frameSimBudgetMs) — ความต่างนี้ต้องคงไว้ (int/float แยกกัน) ไฟล์นี้มี clampInt ใช้อยู่แล้วที่บรรทัด 285 การเพิ่ม positive(c, key, def, int?) คู่กับมันจึงเป็นการใช้ convention เดิม ไม่ใช่ abstraction ใหม่ → 14 → ~2 บรรทัด และปิดความเสี่ยง copy-paste ผิดฟิลด์ ซึ่งเป็นบั๊กที่เงียบที่สุดในชั้น normalization และบรรทัดพวกนี้เป็นจุดที่อ่านยากที่สุดของไฟล์ด้วย

3-2 barrels: จริงแต่เป็นเครื่องสำอาง ผม grepped แยก "ใคร import ผ่าน barrel" แทนที่จะนับชื่อเปล่า — buildWalkableMap, cellSizeOf, pixelToCell โผล่แค่ index.ts กับไฟล์ที่นิยามมัน (layoutBuild.ts) คือไม่มีใคร import ผ่าน barrel ส่วน symbol ยังมีชีวิตเพราะใน engine import ตรงจาก ./layoutBuild ฝั่ง blueprintStore.ts ก็มี ~8 ชื่อในสภาพเดียวกัน (readBlueprintDataFile, createHttpPersistencePort, createIndexedDbStorage, isIndexedDbAvailable, resolvePersistenceMode, PersistenceUnavailableError, InvalidBlueprintDataError, UnsupportedBlueprintVersionError) — แต่ ต้องแก้ตัวเลขที่ผมส่งมาก่อน: createMemoryStorage / createLocalPersistencePort ยังถูกใช้ผ่าน barrel จริง (tests/unit/persistenceBoot.test.ts) รวมสองไฟล์ ≈ 15 บรรทัด ผลประโยชน์คือความสะอาดล้วนๆ และการเก็บ barrel ให้ "ครบเป็น public surface" เป็นความจงใจที่ได้ → ผมไม่ recommend เป็นที่หนึ่ง และการลบ blueprintStore.ts ทิ้งต้อง rewiring 28 จุด ซึ่งไม่คุ้ม

3-3 ผมถอย: alias block ใน store/{assets,metadata,objects,mode}.ts (const clamp = (rect) => store.clamp(rect), saveBlueprintData = () => store.save(), withStateLock = <T>(fn) => store.runExclusive(fn) × 4 ไฟล์ ≈ 24 บรรทัด) — มันซ้ำจริง แต่มันคือ alias ที่ทำให้ body อ่านสะอาด การรวมเป็น storeFacade(store) คือ abstraction ที่ task ไม่ได้ขอ + เสีย type narrowing ท้องถิ่น → ขัดกฎ zero-premature-abstraction ของ repo เอง ไม่ทำ

Route verify: **/domain/** → suite เดียวที่ตรง (human pick — test:settings-completeness หรือ test:npc-engine)
