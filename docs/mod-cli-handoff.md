# mod-cli — Handoff Brief (ให้ agent ตัวอื่นทำต่อ)

แปะไฟล์นี้ให้ agent ตัวใหม่ทั้งก้อน แล้วสั่งงานต่อได้เลย

## 1. งานคืออะไร

สร้าง `mod-cli` — UI (chat) ครอบ CLI เดิม ยกโฟลเดอร์เดียวไปวางใน project Node ไหนก็ได้
สเปกตัวเต็ม: `docs/mod-cli.md` (ภาษาไทย) — อ่านไฟล์นั้นก่อนเสมอ

## 2. ทำไปแล้ว (อย่าทำซ้ำ)

- [x] `mod-cli/src/ModCLI.vue` — standalone CSS (`mod-cli-chat__*`, tokens `--mod-cli-*` ของตัวเอง, ไม่พึ่ง CSS host)
- [x] Rename `ClineChat` → `ModCLI`, `clineBridge` → `modCliBridge` (symbols `ModCli*`, brand ModCLI)
- [x] Package folder `mod-cli/` (`src/ModCLI.vue` + `src/modCliBridge.ts` + `package.json`) + verify ครอบคลุม
- `src/App.vue` เปิดด้วย `?modcli` (ของเดิม `?cline` เลิกใช้แล้ว)

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

1. **Adapter Vue+Vite mount route `/mod-cli`** — แทน `?modcli` ชั่วคราวใน `App.vue`
2. **หน้า Settings (BYO API Key)** — เลือก provider → ใส่ key → Test Connection, เก็บแบบเดียวกับ CLI
3. **Provider connector** — ตอนนี้ default `cline` อย่างเดียว, โครงต้องสลับ provider ได้โดย UI เดิม (สลับ = session ใหม่)
4. **ทดสอบยกไป 2-3 project Node** (copy folder แล้ว `npm run dev` → `/mod-cli`)

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

dev: `npm run dev` → `http://localhost:5173/?modcli`

## 7. Prompt สำเร็จรูป (copy ไปแปะ)

> อ่าน `docs/mod-cli-handoff.md` + `docs/mod-cli.md` ก่อน แล้วทำข้อ 4.1 (Adapter Vue+Vite mount route `/mod-cli` แทน `?modcli`) กฎตามข้อ 5 verify ตามข้อ 6 รายงานสั้นๆ แบบ claim/changed/assumption/verified
