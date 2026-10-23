# Deploy: Cloudflare Workers Static Assets + D1 + Access

คู่มือนี้ใช้บัญชี Cloudflare ของคุณ ไม่ได้ deploy ไปบัญชีหรือโดเมนใดให้ในชุดส่งมอบ

## 1. เตรียมและยืนยันบัญชี

```bash
npm ci
npm run check
npx wrangler login
npx wrangler whoami
```

ตรวจบัญชีและสิทธิ์ก่อนสร้าง resource หากใช้ CI ให้เก็บ CLOUDFLARE_API_TOKEN และ CLOUDFLARE_ACCOUNT_ID ใน GitHub Secrets ห้ามใส่ใน source หรือ `VITE_*`

## 2. สร้างฐานข้อมูล

```bash
npx wrangler d1 create legal-research-studio-db
```

คัดลอก database_id **ที่คำสั่งคืนจริง** ไปแทน UUID placeholder ใน wrangler.jsonc ตรวจชื่อ database ให้ตรง แล้ว:

```bash
npm run db:local
npm run db:remote
```

คำสั่ง remote เปลี่ยนฐานข้อมูลจริง จึงควรตรวจ target และสำรองก่อนทุกครั้งที่มีข้อมูลอยู่ อย่าแก้ SQL migration ที่ apply แล้ว ให้เพิ่ม migration หมายเลขใหม่

## 3. ตั้งค่า Access และโดเมน

1. สร้าง Cloudflare Access Self-hosted application สำหรับ hostname ที่จะใช้ เช่น `research.your-domain.example` (ตัวอย่างเท่านั้น)
2. กำหนด Allow policy เฉพาะอีเมล/กลุ่มที่ได้รับอนุญาต และวิธี sign-in ตามองค์กร
3. คัดลอก team domain เช่น `your-team.cloudflareaccess.com` และ Application AUD ไปใส่ `ACCESS_TEAM_DOMAIN` / `ACCESS_AUD` ใน `vars` ของ wrangler.jsonc ค่านี้ไม่ใช่ API secret แต่ต้องตรง application จริง
4. ใช้ custom domain ของ Worker และ Access application hostname เดียวกัน การผูก custom domain ทำได้ผ่าน Cloudflare dashboard หรือ routes configuration ตามบัญชี
5. ตั้ง `workers_dev` เป็น false เมื่อใช้เฉพาะ custom domain และตรวจ preview/alternate hostname ว่าไม่เปิดช่องที่นโยบาย Access ไม่ครอบคลุม
6. ห้ามตั้ง `LOCAL_DEV_USER` ใน Worker production เป็นอันขาด local override อยู่เฉพาะไฟล์ ignored `.dev.vars`

Access gateway ตรวจผู้ใช้ก่อนเข้า hostname และ Worker ตรวจ JWT อีกชั้นสำหรับ `/api/*` การดูเฉพาะ email header หรือ decode payload โดยไม่ตรวจ signature ไม่เพียงพอ

## 4. Package และ Deploy

```bash
npm run check
npx wrangler deploy --dry-run --outdir outputs/worker
npm run deploy
```

ใช้ URL ที่ Wrangler คืนจริง ไม่เดา URL จากชื่อโปรเจกต์ หากตั้ง custom domain ภายหลัง ให้ตั้ง Access ให้ครอบคลุมก่อนใส่ข้อมูลจริง

## 5. ตรวจหลัง Deploy

- ไม่มี login → เข้า API ไม่ได้
- sign-in user A → GET ได้พื้นที่ของ A และ PUT ได้เฉพาะของ A
- sign-in user B ใน browser profile อีกอัน → ไม่เห็นข้อมูลของ A
- ถอด/ปลอม email header ไม่ทำให้ผ่าน Access JWT validation
- JWT หมดอายุ / audience ผิด / issuer ผิด → API ปฏิเสธ
- เปิดสอง session เขียนด้วย revision เดียวกัน → session ที่ล้าหลังได้ 409
- JSON malformed หรือ workspace เกิน 800 KB → ถูกปฏิเสธ
- เปิดข้อมูลที่มี HTML/script → แสดงเป็นข้อความและไม่รัน script
- backup ก่อนทดลองลบ นำเข้า หรือ migration ทุกครั้ง

## Cloudflare Pages ทางเลือก

ถ้าต้องการเฉพาะ frontend ที่เก็บข้อมูลในเครื่อง:

```bash
npm run build
npx wrangler pages deploy dist --project-name YOUR_PAGES_PROJECT
```

ต้องสร้าง Pages project ของคุณก่อน และใช้ชื่อจริงแทน placeholder การ deploy `dist` ไป Pages **ไม่ได้ติดตั้ง worker/index.js หรือ D1 API** ปุ่ม Cloud Sync จะไม่ทำงานจนเพิ่ม backend และกำหนด API routing/authentication ต่างหาก ชุดนี้จึงแนะนำ Workers สำหรับ full stack

## Rollback และข้อมูล

เก็บ release/commit ล่าสุดที่ใช้งานได้สำรองไว้ การ rollback Worker ไม่ได้ย้อนฐานข้อมูล D1 จึงต้องมีแผน backup/export และ migration ย้อนกลับที่ไม่ทำให้ข้อมูลสูญหาย
