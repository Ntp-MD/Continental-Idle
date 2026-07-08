# Blueprint Editor Refactor Plan

Scope: `src/blueprint/` — `assets-store.ts` (2251 lines), `EditorCanvas.vue` (1317 lines), `PropertiesPanel.vue` (1173 lines), plus `types.ts`, `assets-utils.ts`, `assets-property.ts`, `assets-config.ts`, `Toolbar.vue`, `FloorTabs.vue`, `AssetPalette.vue`.

---

## ปัญหาที่พบในโค้ดปัจจุบัน

### 1. Geometry/render logic ซ้ำกันคนละไฟล์
`assetSizeFor`, `normalizeObject` อยู่ใน `assets-store.ts` แต่ `svgTransform`, `compositeOutlinePath`, `compositePartDetailsPath`, `roundedRectPath` อยู่ใน `EditorCanvas.vue`. ทั้งสองฝั่งต้องเข้าใจ shape ของ `AssetDef` (parts/linkedParts/svg/usePx) เหมือนกันแต่แยกไฟล์ — แก้กติกาการคำนวณ offset ของ composite part ต้องแก้ 2 ที่ ไม่งั้น canvas กับ store จะคำนวณพิกัดไม่ตรงกัน

### 2. `AssetDef` เป็น "god interface" ที่จริงๆ คือ 4 ชนิดต่างกัน

```ts
interface AssetDef {
  w: number; h: number
  pxW?: number; pxH?: number; usePx?: boolean      // simple (tile-based หรือ px-based)
  parts?: CompositePart[]                           // composite
  linkedParts?: LinkedPart[]                        // linked set
  svg?: string; svgViewBox?: {...}                  // custom SVG import
}
```

ทุก function ที่แตะ asset (`assetSizeFor`, `svgTransform`, properties panel ทั้ง `isCompositeAsset`/`isLinkedAsset`/`isSvgAsset`) ต้องเช็ค optional field ทีละตัวเพื่อเดาว่า asset นี้เป็นประเภทไหน — TypeScript narrow ไม่ได้เพราะไม่ใช่ discriminated union

### 3. Metadata กระจาย 3 ที่ ผูกกันด้วย `subId` string เฉยๆ

```ts
objectCustomProps: Record<string, ObjectCustomProps>   // keyed by subId
instanceLabels: Record<string, string>                 // keyed by subId
validationRules: Record<string, ValidationRule>         // keyed by subId
```

แยกจาก `ObjectData` เอง ต้องมี `cleanupObjectData(ids)` คอยไล่ลบ 3 map นี้เองทุกครั้งที่ object ถูกลบ (บรรทัด 1897) — ถ้ามี code path ไหนลืมเรียก จะเกิด orphaned entry ค้างใน layout เงียบๆ

### 4. Wall ไม่ใช่ entity จริง — เป็น convention ที่กระจายอยู่ 2 ระบบคนละแบบ

- **ระบบที่ 1**: `data-role="wall"` ฝังใน SVG string ของ asset (parse ด้วย `parseSvgRoles` ใน `assets-utils.ts`) — ใช้กับ special asset เช่น restroom
- **ระบบที่ 2**: `EditorMode = 'wall'` + `onWallMouseMove`/`eraseWallTile` ใน `EditorCanvas.vue` — วาด wall แบบ paint-tile ลง `ObjectData` ปกติ

ไม่มี `Wall` type ใน `types.ts` เลย แปลว่า **Room ไม่มีทาง derive จาก wall ได้** — `RoomData` เป็นแค่ rectangle (x,y,w,h) ที่ผู้ใช้วาดเอง ไม่ผูกกับกำแพงจริงที่ล้อมมันอยู่

### 5. ID generation เปราะ

```ts
function parseIdCounter(id: string): number | null {
  const m = id.match(/-([0-9a-z]+)$/)
  ...parseInt(suffix, 36)
}
```

ต้อง scan ทุก object/room/asset หา suffix สูงสุดตอน init (`initIdCounter`) เพื่อไม่ให้ id ชนกัน — เห็นได้จาก `assets-property.ts` มี id แปลกๆ เช่น `custom-mraerhs8-9.041026690228171e+23` (แปลว่าเคยมี bug ที่ generate เลขทศนิยม/exponential แล้วต่อเป็น id ตรงๆ มาแล้ว)

---

## แผนรีแฟคเตอร์ (phased, มี TypeScript gate ทุก phase)

### Phase 0 — Safety net
- รัน `vue-tsc --noEmit` ให้ผ่านที่ baseline ก่อนแตะอะไร
- เขียน snapshot test: serialize `SAVED_LAYOUT` → รันผ่านทุก CRUD action หลัก (addRoom, addObject, mergeObjects, undo/redo) → เทียบ output ก่อน/หลังรีแฟคเตอร์แต่ละ phase ต้องได้ layout เดียวกัน

### Phase 1 — ดึง geometry/render เป็น pure module ใช้ร่วมกัน

สร้าง `blueprint/geometry.ts`:

```ts
export function assetSizeFor(type, rotation, tileSize, customAssets): {w,h} | null
export function svgTransform(obj: ObjectData): string
export function compositeOutlinePath(obj, asset): string | null
export function roundedRectPath(...): string | null
```

ย้ายจาก `assets-store.ts` และ `EditorCanvas.vue` มารวมที่เดียว ทั้งสองไฟล์ import จากตรงนี้แทน — กำจัดจุด drift ข้อ 1 ทันที แค่ย้าย logic ไม่เปลี่ยนพฤติกรรม = ความเสี่ยงต่ำ เหมาะเป็น phase แรก

### Phase 2 — Discriminated union สำหรับ AssetDef

```ts
type AssetDef =
  | { kind: 'simple'; id, name, category, w, h, usePx?, pxW?, pxH? }
  | { kind: 'composite'; id, name, category, w, h, parts: CompositePart[] }
  | { kind: 'linked'; id, name, category, w, h, linkedParts: LinkedPart[] }
  | { kind: 'svg'; id, name, category, w, h, svg: string, svgViewBox: {w,h} }
```

เขียน migration function แปลงของเก่า (เดา `kind` จาก field ที่มี: มี `parts` → composite, มี `linkedParts` → linked, มี `svg` → svg, ไม่งั้น → simple) รันครั้งเดียวใน `migrate()` ที่มีอยู่แล้ว — ใส่เป็น migration step ใหม่ ไม่ต้อง manual data-fix

ผลลัพธ์: `isCompositeAsset`/`isLinkedAsset`/`isSvgAsset` ใน `PropertiesPanel.vue` เปลี่ยนจาก computed เดา field เป็น `asset.kind === 'composite'` ตรงๆ, ได้ switch-exhaustiveness check ฟรีจาก TS

### Phase 3 — แตก `assets-store.ts` เป็น slice ตาม domain

ไม่เปลี่ยน public API ของ `useAssetsStore()` (component เดิมยังเรียกแบบเดิมได้) แค่เปลี่ยนโครงสร้างภายในไฟล์:

```
blueprint/store/
  history.ts        // pushHistory, undo, redo, snapshot, restore
  persistence.ts    // migrate, loadInitial, saveLayout, syncToGame
  floors.ts         // addFloor, deleteFloor, duplicateFloor, renameFloor, reorderFloors, clearFloor(s), selectFloor
  rooms.ts          // addRoom, addRoomFromTemplate, addRoomTemplate, deleteRoomTemplate, updateRoomProps, canPlaceRoom
  objects.ts        // addObject, updateObjectProps, moveSelectedTo, commitMove, mergeObjects, createComposite/LinkedAssetFromSelection, ungroupObject, linkObjects, unlinkObject
  assetLibrary.ts   // addCustomAsset, addSvgAsset, updateCustomAsset, deleteCustomAsset, category CRUD
  zones.ts          // addZone, updateZone, deleteZone
  clipboard.ts      // copySelected, pasteObjects
  metadata.ts       // object custom props / instance labels / validation rules (ดู Phase 4)
  index.ts          // useAssetsStore() ประกอบร่างทุก slice, expose เหมือนเดิม
```

แต่ละ slice รับ `state` (reactive) เดียวกันจาก module-level เหมือนเดิม (Vue composable singleton pattern ปัจจุบันมีอยู่แล้ว ไม่ต้องเปลี่ยนเป็น Pinia ก็ได้ ถ้าไม่อยากเพิ่ม dependency)

**Gate**: `vue-tsc --noEmit` + snapshot test จาก Phase 0 ต้องผ่านทุกไฟล์ที่แตกออกมา

### Phase 4 — รวม metadata 3 ที่เข้ากับ ObjectData

```ts
interface ObjectData {
  // ...
  customProps?: ObjectCustomProps
  instanceLabel?: string
  validationRule?: ValidationRule
}
```

ย้ายจาก `Record<subId, T>` แยก 3 map มาเป็น field บน object เดียวกัน — ตอนลบ object ก็หายไปพร้อมกันโดยอัตโนมัติ ไม่ต้องมี `cleanupObjectData` เลย ลด failure mode ข้อ 3 ทั้งหมด (ต้องเขียน migration ย้ายของเก่าเข้า field ใหม่ตอน `migrate()` เหมือนกัน)

### Phase 5 — ทำให้ Wall เป็นแนวคิดที่ explicit ขึ้น

2 ทางเลือก เลือกตามว่าจะ derive room จาก wall จริงไหม:

- **Minimal (แนะนำก่อน)**: เพิ่ม `isWall?: boolean` marker บน `ObjectData`/`AssetDef` แทนการเดาจาก type string หรือ mode ปัจจุบัน แล้วดึง `onWallMouseMove`/`eraseWallTile` ออกมาเป็น `useWallPaintTool.ts` composable — Room ยังคงเป็น rectangle อิสระเหมือนเดิม
- **Full**: เพิ่ม `Wall` entity จริง (start/end vertex) แยกจาก object ปกติ แล้วให้ Room polygon derive จาก wall ที่ล้อมรอบ — งานใหญ่กว่ามาก ควรทำเป็น phase แยกทีหลังสุด ถ้า floor-spec.md (Architect persona) ต้องการ validate "wall connectivity" แบบ graph จริงๆ

### Phase 6 — แตก `EditorCanvas.vue` (1317 บรรทัด)

```
useCanvasViewport.ts   // zoom, pan, fitToScreen, centerView, wheel/pan handlers
useCanvasSelection.ts  // box-select, click-select, multiSelect toggle
useCanvasDragDrop.ts   // palette drag ghost, room-template drag ghost
useWallPaintTool.ts    // (จาก Phase 5)
```

component เหลือแค่ template + render loop เรียก geometry จาก Phase 1

### Phase 7 — แตก `PropertiesPanel.vue` (1173 บรรทัด)

แยกตาม selection type: `RoomPropertiesForm.vue`, `ObjectPropertiesForm.vue`, `AssetPropertiesForm.vue` — แต่ละไฟล์รับ prop เดียว (room/object/asset) ไม่ต้อง import ทั้ง store แล้ว v-if กระจายทั้ง template เหมือนตอนนี้

### Phase 8 — ID generation (เก็บท้าย ไม่เร่ง)

เปลี่ยนจาก base36-suffix-counter เป็น `crypto.randomUUID()` แต่ยังคง prefix (`genId('o')` → `o-${uuid}`) เพื่อ backward-compatible กับ regex อื่นที่ parse prefix อยู่ (เช่น `editorFloorLabelToFloorId`) — ต้อง grep หา `.match(/^prefix-/)` ทุกจุดก่อนเปลี่ยน

---

## ลำดับความสำคัญแนะนำ

```
Phase 1 → Phase 3 → Phase 2 → Phase 4   (data layer — ทำให้นิ่งก่อน)
Phase 6 → Phase 7                        (UI layer)
Phase 5 → Phase 8                        (ท้ายสุด — กระทบ data model มาก / ไม่เร่งด่วน)
```

ทุก phase จบด้วย:
1. `vue-tsc --noEmit` ผ่าน
2. snapshot test (Phase 0) ต้องได้ layout เดิม
3. smoke test มือ: add room/object, undo/redo, save, switch floor, copy-paste