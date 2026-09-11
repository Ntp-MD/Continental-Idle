# mod-cli — Handoff Brief (ให้ agent ตัวอื่นทำต่อ)

แปะไฟล์นี้ให้ agent ตัวใหม่ทั้งก้อน แล้วสั่งงานต่อได้เลย

## 1. งานคืออะไร

สร้าง `mod-cli` — UI (chat) ครอบ CLI เดิม ยกโฟลเดอร์เดียวไปวางใน project Node ไหนก็ได้
สเปกตัวเต็ม: `docs/mod-cli.md` (ภาษาไทย) — อ่านไฟล์นั้นก่อนเสมอ

## 2. ทำไปแล้ว (อย่าทำซ้ำ)

- [x] `mod-cli/src/ModCLI.vue` — standalone CSS (`mod-cli-chat__*`, tokens `--mod-cli-*` ของตัวเอง, ไม่พึ่ง CSS host)
- [x] Rename `ClineChat` → `ModCLI`, `clineBridge` → `modCliBridge` (symbols `ModCli*`, brand ModCLI)
- [x] Package folder `mod-cli/` (`src/ModCLI.vue` + `src/modCliBridge.ts` + `package.json`) + verify ครอบคลุม
- [x] Adapter Vue+Vite route `/mod-cli` (`mod-cli/src/modCliViteAdapter.ts` + wiring ใน `vite.config.ts`) — dev URL คือ `http://localhost:5173/mod-cli`
- `src/App.vue` mount `<ModCLI>` ด้วย route `/mod-cli` (`?modcli` และ `?cline` เลิกใช้แล้ว)

## 3. แผนที่ไฟล์

```
mod-cli/src/ModCLI.vue       # UI หลัก (ห้ามแตะ logic stream)
mod-cli/src/modCliBridge.ts  # คุย dev-server ผ่าน /__cline/* (ห้ามเปลี่ยน URL)
mod-cli/package.json         # name: mod-cli, peer: vue
src/App.vue                  # mount <ModCLI> ตอน ?modcli (dogfood ชั่วคราว)
vite.config.ts               # clineBridgePlugin() = server ฝั่ง /__cline (ของ provider cline)
docs/mod-cli.md              # สเปก
```

## 4. งานที่เหลือ (ทำตามลำดับ)

1. [x] **Adapter Vue+Vite mount route `/mod-cli`** — เสร็จแล้ว (ดู §2)
2. **หน้า Settings (BYO API Key)** — เลือก provider → ใส่ key → Test Connection, เก็บแบบเดียวกับ CLI (ยังไม่มีจริงเลย: `ModCLI.vue` ไม่มีหน้า Settings/input key/ปุ่ม Test Connection, `StoredSettings` ไม่มี field `apiKey` — ต้องได้ shape `{provider, apiKey, model, projectPath}` ตามสเปก)
3. **Provider connector** — ตอนนี้ default `cline` อย่างเดียว, โครงต้องสลับ provider ได้โดย UI เดิม (สลับ = session ใหม่) (ยังไม่ได้ทำ: `providerOptions` hardcode `['cline']`, ฝั่ง server spawn cline CLI อย่างเดียว, ลิสต์ model ดึงจาก history session ไม่ใช่จาก CLI, reasoning ไม่มีลิสต์ให้เลือก)
4. **ทดสอบยกไป 2-3 project Node** (copy folder แล้ว `npm run dev` → `/mod-cli`)

## 4a. สถานะจาก audit (2026-09-11) — อ่านก่อนเริ่มงาน

- งาน 4.1 **ยังไม่ commit**: `git status` = M `src/App.vue` / `vite.config.ts` / `tsconfig.node.json` / `docs/mod-cli-handoff.md` / `harness/*` + untracked `mod-cli/src/modCliViteAdapter.ts` — ถือว่า baseline ปัจจุบันคืองานนี้ (user เป็นคน commit เอง)
- **ไม่มี approve/reject + diff UI** ตามสเปกข้อ 2 และ run ปัจจุบัน auto-approve อยู่: client ไม่ส่ง `autoApprove` → server (`vite.config.ts` ~L424 `body.autoApprove !== false`) ตีเป็น true → ไม่ push `--auto-approve false` เข้า cline
- `docs/mod-cli.md` หัว "Next Step" ยังไม่ tick ข้อแรก (`[ ] ทำ route /mod-cli`) ทั้งที่เสร็จแล้ว — sync เอกสารด้วยเมื่อแตะงาน
- แนวทาง 4.2 ที่สอดคล้องกฎ §5: key ไปที่เดียวกับที่ CLI อ่าน (ส่งต่อเป็น env ของ child process ที่ spawn ใน `/__cline/run`), จุดทดสอบ (Test Connection) เพิ่ม route ใหม่แบบ additive ใต้ `/__cline/*` (ห้ามแก้ URL/behavior ของ route เดิม), เก็บ field เพิ่มใน `cline-chat-settings-v1` โดยไม่เปลี่ยนชื่อ key
- ไฟล์ที่จะแตะตอนทำ 4.2 = `mod-cli/src/ModCLI.vue` + `mod-cli/src/modCliBridge.ts` + `vite.config.ts` = พอดี 3 ไฟล์ (ไม่ต้องถามก่อน)

## 5. กฎเหล็ก (ห้ามแหก)

- CSS ใน `mod-cli/` ต้อง isolated เท่านั้น: prefix `mod-cli-*` + `--mod-cli-*`, ห้ามใช้ global class/vars ของ host, ห้าม `:root`, ห้าม `!important`/`box-shadow`/inline `style="..."`
- ห้ามเปลี่ยน logic stream, URL `/__cline/*`, keys `cline-chat-settings-v1` / `cline-chat-usage-v1` (settings ผู้ใช้จะหาย)
- scope เกิน 3 ไฟล์ / เพิ่ม dependency / ลบ-ย้ายไฟล์ tracked → ถามก่อนทำ (ไฟล์ใน `mod-cli/` ย้ายได้อิสระเพราะเป็นของใหม่)
- ห้าม `git checkout --` / `restore` / `reset` / `stash` / `clean` บนไฟล์ tracked — revert ด้วยการแก้โค้ดเท่านั้น
- ไฟล์ temp ทดสอบวางที่ `tests/_*.tmp.ts` ลบภายใน session เดียวกัน ห้าม commit

## 6. Verify (รันตามชนิดงาน ห้ามรันทั้ง matrix)

```powershell
npm run lint:bem
npm run lint:css
npm run typecheck   # ถ้าแตะ .vue/.ts
npm run hcheck      # ก่อนรายงานเสร็จทุกครั้ง
```

dev: `npm run dev` → `http://localhost:5173/mod-cli`

## 7. Prompt สำเร็จรูป (copy ไปแปะ)

> อ่าน `docs/mod-cli-handoff.md` (รวม §4a) + `docs/mod-cli.md` ก่อน แล้วทำข้อ 4.2 (หน้า Settings BYO API Key: เลือก provider → ใส่ key → Test Connection → เก็บแบบเดียวกับ CLI) กฎตามข้อ 5 verify ตามข้อ 6 รายงานสั้นๆ แบบ claim/changed/assumption/verified
