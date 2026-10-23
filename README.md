# Legal Research Studio — React + Vite / Cloudflare

ชุดโค้ดสำหรับเปิดใน **Antigravity IDE** และพัฒนาต่อจากเว็บห้องทำงานวิจัยกฎหมาย รุ่น 0.2.0

## เริ่มใช้งานใน 3 คำสั่ง

ใช้ Node.js 22.12 ขึ้นไป (แนะนำ Node 22 LTS ที่อัปเดตแล้ว) และ npm

```bash
npm ci
npm run dev
```

เปิด URL ที่ Vite แสดงใน Terminal (ปกติ `http://127.0.0.1:5173`) เมนูหลักใช้งานได้ทันทีโดยไม่ต้องมี API key หรือบัญชี Cloudflare ข้อมูลบันทึกใน browser profile ของเครื่องนั้น

```bash
npm run check
```

คำสั่งนี้ทดสอบโมเดลข้อมูล / API และ build production

## สิ่งที่ทำงานได้แล้ว

- React components จริง พร้อม Vite production build และ package-lock.json
- เพิ่ม แก้ไข เปิด และลบแผนวิจัย; กรอบแนวคิด; ระยะเวลา 6–104 สัปดาห์; ร่างโครงรายงาน; ส่งออก Markdown
- ค้นหา/กรองคลังวิธีวิจัย โมเดล หลักการ เครื่องมือ และแนวทางรายงาน 12 รายการ
- บัญชีกฎหมายและหลักฐาน: แหล่งต้นทาง ฉบับ มาตรา หน้า ภารกิจ ข้อค้นพบ สถานะ เชื่อมกับโครงการ และส่งออก CSV
- บันทึกอ่านบทวิจัยหลายรายการ เชื่อมโครงการ แก้ไขและส่งออก
- รายการตรวจคุณภาพ 12 ข้อ ระดับพื้นที่ทำงาน (ยังไม่แยกต่อโครงการ)
- JSON backup/restore พร้อมตรวจ schema และขีดจำกัด 800 KB
- Cloudflare Worker API + D1 พร้อมตรวจ Access JWT และป้องกันการเขียนทับด้วย revision
- Cloud Sync แบบผู้ใช้เลือกดาวน์โหลด/อัปโหลดเอง ข้อมูลแยกต่อ Access user
- Skills 5 ชุดใน `.agents/skills/` และข้อตกลงการทำงาน `AGENTS.md`

## เปิดโปรเจกต์ใน Antigravity IDE

1. แตก ZIP แล้วเปิด **โฟลเดอร์ราก** ที่มี package.json ด้วย Open Folder
2. เปิด Terminal รัน `npm ci` และ `npm run dev`
3. ให้อ่าน `AGENTS.md`, `docs/ARCHITECTURE.md` และ `docs/ANTIGRAVITY-START.md`
4. ตรวจว่า IDE ค้นพบ Skills ใน `.agents/skills/` หาก IDE รุ่นเก่าไม่พบ ให้ใช้ `.agent/skills/` ตามเอกสารของรุ่นที่ติดตั้ง อย่าคัดลอกซ้ำทั้งสองที่โดยไม่จำเป็น
5. ใช้พรอมป์ต์ใน docs/ANTIGRAVITY-START.md เพื่อเริ่มงานต่อ

Skills เป็นคำแนะนำให้ Agent ใน IDE ทำงานอย่างมีหลักเกณฑ์ **ไม่ได้ทำให้หน้าเว็บมี AI runtime โดยอัตโนมัติ**

## ทดสอบ Full stack ในเครื่อง

```bash
cp .dev.vars.example .dev.vars
npm run db:local
npm run dev:worker
```

เปิด URL ของ Wrangler (ปกติ `http://localhost:8787`) ไม่ใช่ Vite เพื่อใช้แอปพร้อม API ในโดเมนเดียวกัน `.dev.vars` มีตัวตนทดสอบเฉพาะ localhost และถูก ignore โดย Git ห้ามนำ `LOCAL_DEV_USER` ไปตั้งใน Production

เมนู **ข้อมูลและ Cloud Sync**:

1. ส่งออก JSON ข้อมูลในเครื่องก่อน
2. กดดาวน์โหลดจากคลาวด์ เพื่อโหลดข้อมูลและ revision ล่าสุด (ครั้งแรกได้พื้นที่ว่าง)
3. สร้าง/แก้ไขข้อมูลใน UI หรือ นำเข้า JSON สำรองที่ต้องการใช้แทนข้อมูลในเครื่อง
4. ตรวจบัญชีคลาวด์ที่แสดง แล้วกดอัปโหลด ข้อมูลในเครื่องจะเขียนแทนพื้นที่ทำงานของบัญชีนั้น หลังตรวจ revision แล้ว
5. หากมี revision conflict ให้สำรองข้อมูลในเครื่อง ดาวน์โหลดล่าสุด แล้วรวมข้อมูลก่อนอัปโหลดใหม่ รุ่นนี้ยังไม่มี merge รายรายการอัตโนมัติ

### ย้ายข้อมูลเดิมขึ้นคลาวด์

ส่งออก JSON ก่อน → ดาวน์โหลดคลาวด์เพื่อรับ revision → นำเข้า JSON ที่สำรองไว้ (เปลี่ยนเฉพาะข้อมูลในเครื่อง) → ตรวจบัญชีเป้าหมาย → อัปโหลด การนำเข้าไม่ส่งข้อมูลไปคลาวด์เอง และ Worker จะปฏิเสธหากมีข้อมูลใหม่กว่าระหว่างขั้นตอน

> Cloud Sync เก็บเอกสาร JSON ทั้งพื้นที่ทำงานใน D1 หนึ่งแถวต่อผู้ใช้ ขีดจำกัด 800 KB เหมาะกับ MVP และผู้ใช้คนเดียวต่อพื้นที่ ยังไม่ใช่ฐานข้อมูลสำหรับไฟล์ PDF หรือทีมที่แก้ไขพร้อมกัน

## Deploy ไป Cloudflare

อ่าน [docs/DEPLOY-CLOUDFLARE.md](docs/DEPLOY-CLOUDFLARE.md) แล้วตั้งค่า D1, Cloudflare Access, hostname และ Wrangler ด้วยบัญชีของคุณ ไม่มี token หรือ account ID จริงอยู่ในชุดนี้

ใช้ **Cloudflare Workers Static Assets + D1** เป็นเส้นทางหลักสำหรับทั้ง frontend และ API ส่วน **Cloudflare Pages** รองรับ frontend local-storage mode ดูข้อแตกต่างในคู่มือ

## ย้ายข้อมูลจากเว็บรุ่นก่อน

ส่งออก JSON จากเว็บเดิมก่อน แล้วใช้:

```bash
node scripts/migrate-v1.mjs old-backup.json new-backup-v2.json
```

นำไฟล์ v2 เข้าที่เมนูข้อมูล สคริปต์ไม่เขียนทับไฟล์เดิม และไม่อัปโหลดไปคลาวด์ให้เอง

## ขอบเขตที่ต้องทราบ

- ยังไม่มี AI inference, ค้นกฎหมายออนไลน์, อัปโหลด PDF, OCR, citation extraction หรือสร้างข้อวิเคราะห์อัตโนมัติ
- ไม่มีทีม/บทบาทร่วมกัน ประวัติแก้ไขรายรายการ หรือ audit trail ถาวร
- localStorage ไม่เข้ารหัส และใช้ร่วมใน browser profile เดียวกัน ข้อมูลที่อ่อนไหวควรใช้เครื่องส่วนตัวและนโยบายข้อมูลที่ชัดเจน
- การลงชื่อเข้าใช้ Cloudflare Access ต้องตั้งค่าจริงก่อน API production จะเปิดใช้
- แนวทางรายงานในคลังไม่ใช่การรับรองเหรียญทอง มาตรฐานสากล หรือความถูกต้องทางกฎหมาย

อ่าน [docs/ROADMAP.md](docs/ROADMAP.md) สำหรับการพัฒนาต่อ และ [docs/VALIDATION.md](docs/VALIDATION.md) สำหรับผลตรวจชุดส่งมอบ
