# พรอมป์ต์เริ่มพัฒนาต่อใน Antigravity IDE

คัดลอกข้อความด้านล่างหลังเปิดโฟลเดอร์โครงการ:

```text
คุณเป็น Lead Developer ของ Legal Research Studio สำหรับครูเด่น
อ่าน AGENTS.md, README.md, docs/ARCHITECTURE.md และ docs/ROADMAP.md ก่อนแก้โค้ด
ใช้ Skills ที่เกี่ยวข้องใน .agents/skills/

เริ่มด้วย npm ci และ npm run check แล้วตรวจ workflow จริง:
1) สร้างและแก้ไขแผนวิจัย
2) เชื่อมหลักฐานและบันทึกการอ่านกับโครงการ
3) ส่งออกและนำเข้า JSON โดยข้อมูลไม่เสีย
4) ทดสอบ Cloudflare Worker + D1 ในเครื่อง

รายงานสิ่งที่ทำงานจริง ข้อบกพร่อง และข้อจำกัดก่อนเริ่มงานเฟสถัดไป
พัฒนาต่อเป็นช่วงที่ตรวจรับได้ เริ่มเพิ่ม merge/import-to-cloud ที่ตรวจ conflict
แล้วเพิ่มฐานข้อมูล relational, สิทธิ์ทีม และ audit history ตาม ROADMAP
รักษา UI ภาษาไทยและธีมเดิม ห้ามสร้างการอ้างอิงกฎหมายหรือรับรองมาตรฐานขึ้นเอง
ห้ามเพิ่มปุ่มที่อ้างว่าทำ AI ได้โดยยังไม่มี endpoint จริงและการทดสอบ
ทดสอบด้วย npm run check ทุกครั้งก่อนสรุปผล
อย่า deploy บัญชีจริงหรือ apply remote migration จนกว่างานที่สั่งจะอนุญาต
```

## ตัวอย่างสั่งงานตาม Skill

- “ใช้ research-method-design ออกแบบแบบฟอร์ม Protocol ให้เชื่อมคำถาม วัตถุประสงค์ วิธีศึกษา และหลักฐาน โดยเก็บเป็น structured data”
- “ใช้ legal-evidence-review เพิ่มช่อง amendment chain, effective date, source access date และสถานะผู้ตรวจ พร้อม migration จาก v2”
- “ใช้ react-vite-development แยกแต่ละหน้าใน App.jsx เป็น page components โดยรักษา workflow เดิม”
- “ใช้ cloudflare-deploy เตรียมแผนผูก D1 และ Access สำหรับบัญชีที่กำหนด ตรวจ dry-run ก่อน โดยยังไม่ deploy จริง”
- “ใช้ quality-and-security เพิ่ม integration tests กับ D1 และทดสอบผู้ใช้สองบัญชีไม่เห็นข้อมูลข้ามกัน”

Skills ในชุดนี้เป็นไฟล์ภายในโปรเจกต์ ใช้เพื่อให้ Agent ใน IDE อ่าน ไม่ได้ติดตั้งเข้า Skills ส่วนตัวของ ChatGPT
