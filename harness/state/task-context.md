## Mission

Migrate tsx suites to vitest (user option a): new vitest files first, green, then delete the old tsx file + script in the same batch. Batch 1 (5 small suites) DONE - remaining batches below.

## Plan

- [x] Batch 1 new files: arrivalLatch / collision / tagMatching / assetSchema / movementCorridor (.test.ts, 1:1 body, node:assert kept)
- [x] Green-check the 5 new files via vitest (5 files / 22 tests)
- [x] Delete the 5 old tsx files + npm scripts + run-tests.mjs entries (15 -> 10 legacy steps)
- [x] Done verify: test:unit 11 files / 62 tests + lint + verify.mjs check - pass
- [x] Batch 2: persistence + social + migrate (top-level await -> beforeAll/async tests) + blueprint-schema + sync-payload
- [ ] Batch 3: settings-completeness + tower-integration
- [ ] Batch 4: store-crud + npc-queue + npc-engine (big files)
- [ ] Final: decide diagnostics (behavior/perf stay banned-unless-asked), retire run-tests.mjs + tsx dep when the last suite migrates, review verify-table wording

## Blockers

- (none)

## Hand-off Note

Next action: batch 3 = settings-completeness + tower-integration (recipe in the entry below; migrate fixture-path lesson: `tests/unit/*` needs `'..', 'fixtures'`). After batch 4 retires the last tsx suite, remove `run-tests.mjs` + `test` script + dep `tsx`.

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
