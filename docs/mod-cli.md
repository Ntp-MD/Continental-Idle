# mod-cli — Universal UI CLI Standalone

## Idea หลัก

พูดง่ายๆ มันคือ IDE ที่ติดกับ layer project — เอาไปแปะกับ project ไหนก็กลายเป็น IDE ของ project นั้นทันที

มันคือ CLI แต่หน้าตา **ไม่ใช่ terminal** — เป็น UI จริงๆ (chat / panel / popup) ที่ครอบ CLI ไว้ข้างหลัง ผู้ใช้ไม่ต้องพิมพ์คำสั่งเอง หลักการคือ CLI ทำอะไรได้ UI ก็ทำแบบนั้นเลย ไม่คิด logic ใหม่

อยากได้ UI CLI แบบ standalone ตัวเดียวจบ ที่สามารถยกไปใช้กับ project ไหนก็ได้ โดยเลือกเชื่อมต่อกับ provider เช่น Cline, OpenCode แล้วเอา API Key มาใส่ตั้งค่าเอง

## เป้าหมาย / ขอบเขตที่ล็อกแล้ว

- รองรับเฉพาะ project ที่เป็น Node + npm (`npm run dev` ได้) ไม่ต้องเผื่อ PHP / static
- ทำตัวเหมือน CLI เดิมทุกอย่าง CLI ทำแบบไหน เราทำแบบนั้น แค่ห่อด้วย UI ที่สวยและใช้ง่ายขึ้น
- ไม่ผูกกับ framework ใดๆ ในโลก Node (Next / Vite / ฯลฯ ใช้ได้หมด) ใช้วิธีทำ adapter ต่อ framework เพื่อ mount route `/mod-cli`
- เริ่ม adapter แรกที่ Vue + Vite ก่อน
- ผู้ใช้ Bring Your Own API Key (BYO API Key)

## คุณสมบัติที่ต้องการ

1. **Standalone / Portable + Self-contained CSS**
   - ไฟล์เดียวหรือโฟลเดอร์เดียวจบ ไม่มี dependency ซับซ้อน
   - รันได้บน Windows / Mac / Linux
   - ยกไปวางใน project ไหนก็ใช้งานได้ทันที
   - มี CSS เป็นของตัวเอง ไม่พึ่ง CSS ของ project ปลายทาง
   - CSS ต้อง isolated / scoped ไม่ชนกับ project (เช่น prefix `mod-cli-*`, CSS Modules, Shadow DOM)
   - bundle css ไปด้วยกันกับตัว UI เสมอ
   - เรื่องลอก theme ตาม project ไว้ทำทีหลัง ตอนนี้เอา isolated ให้รอดก่อน

2. **Universal UI — หน้าหลักเป็น Session Chat**
   - หน้าหลักคือ session chat ที่ผูกกับ project นั้นๆ
   - สร้าง / สลับ / ลบ session ได้ต่อ project
   - session ต้อง persist รีเฟรชแล้วไม่หาย
   - การเปลี่ยน provider / model / reasoning = เริ่ม chat session ใหม่เสมอ ไม่สลับกลาง session เดิม
   - การแสดงผลเหมือน CLI ACP IDE ปกติ (streaming, diff ไฟล์, approve/reject)
   - โชว์วิธีคิดแบบบ่นออกมาโดยดึงจาก CLI: กำลังอ่านไฟล์ไหนอยู่ / กำลังคิดอะไร / กำลังจะทำอะไรต่อ
   - โชว์ context session current usage โดยดึงจาก CLI (เช่น % token ที่ใช้ไปของ session นี้)
   - context ผูกกับไฟล์ใน project ปัจจุบันโดยอัตโนมัติ

3. **Provider Connector**
   - เลือกเชื่อมต่อ provider ได้ เช่น:
     - Cline
     - OpenCode
     - (เพิ่มตัวอื่นในอนาคต เช่น Claude Code, Aider, Continue)
   - ลิสต์ model + ค่า reasoning ดึงจาก CLI ตัวที่เลือกอยู่ ไม่ hardcode เอง
   - สลับ provider = เริ่ม session ใหม่ โดยไม่ต้องเปลี่ยน UI

4. **Settings ก่อนใช้ (BYO API Key + Connect)**
   - ต้องเข้าหน้า Settings ก่อนเริ่มใช้: เลือก provider -> ใส่ API Key -> กดเชื่อมต่อ
   - เก็บ config แบบเดียวกับที่ CLI ใช้ ไม่แยกที่ใหม่
   - มีหน้า Settings สำหรับใส่ / ลบ / เทส key

## แนวทางการตั้งค่า (Config)

```json
{
  "provider": "opencode | cline",
  "apiKey": "USER_API_KEY",
  "model": "optional",
  "projectPath": "./"
}
```

## การติดตั้ง (2 แบบ)

- **แบบที่ 1: Install เป็น Package**
  - `npm i mod-cli` / `pnpm add mod-cli` / `bun add mod-cli`
  - เหมาะกับ project ที่ใช้ node / มี package.json อยู่แล้ว
  - อัปเดตง่ายผ่าน version

- **แบบที่ 2: ยกทั้ง Folder ไปเลย**
  - copy folder `mod-cli/` ไปวางใน project Node ไหนก็ได้แล้วรันได้เลย
  - ไม่ต้อง install ไม่ต้อง build ใหม่
  - เหมาะกับงานด่วน / อยากพกพาแบบ standalone 100%

## Flow การใช้งาน

1. ติดตั้งแบบ package หรือ copy folder `mod-cli` ไปวางใน project
2. รัน `npm run dev` เพื่อเปิด dev server ของ project นั้น
3. เข้า `http://localhost:xxxx/mod-cli` เพื่อเปิดหน้า mod-cli
4. ไปหน้า Settings -> เลือก Provider -> ใส่ API Key -> กด Test Connection
5. เริ่มใช้งาน session chat ได้เลยใน project นั้นๆ

## Next Step

- [ ] ทำ route `/mod-cli` + UI wrapper ครอบ CLI เดิม
- [ ] ทำ settings + key storage แบบเดียวกับ CLI
- [ ] ทดสอบยกไปใช้จริง 2-3 project Node
