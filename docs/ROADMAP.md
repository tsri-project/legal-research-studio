# งานพัฒนาต่อและเกณฑ์ตรวจรับ

## ช่วง 1 — ความพร้อมของ workflow

- merge/import-to-cloud: แสดง local/remote side-by-side เลือก record และบันทึกด้วย revision ล่าสุด ไม่ทับเงียบ
- แยก pages/hooks จาก App.jsx และเพิ่ม navigation URL
- รายการตรวจคุณภาพต่อโครงการ พร้อมผู้ตรวจและหลักฐานประกอบ
- เก็บ draft ไม่ให้หายเมื่อเปลี่ยนหน้า พร้อมเตือนงานที่ยังไม่บันทึก
- เพิ่ม provenance fields: source publisher, accessedAt, effectiveFrom/To, amendment links, parent authority และ reviewer
- ตรวจรับ: create/edit/delete/reload, backup round-trip, mobile viewport และ conflict recovery ผ่าน

## ช่วง 2 — ใช้กับทีมจริง

- relational D1 + project memberships และ RBAC (owner, researcher, reviewer)
- audit events และ version history; soft delete พร้อม restore
- แยกข้อมูล local ตาม identity เพิ่ม logout cleanup และนโยบาย retention
- ใช้ limit/page/filter ฝั่ง server แทน document 800 KB
- ตรวจรับ: สิทธิ์ทุก route, ผู้ใช้ 2 บัญชี, concurrent updates, migration และ restore จาก backup

## ช่วง 3 — เอกสารและองค์ความรู้

- R2 upload พร้อมชนิด/ขนาดไฟล์ allowlist, malware scanning และ access control
- text extraction/OCR เป็นงาน background มีสถานะและ retry; เก็บ page anchors และ content hash
- สร้าง legal authority map, evidence matrix และ amendment chain แบบแก้ไขได้
- ตรวจรับ: ทุกข้อความอ้างอิงย้อนถึงไฟล์ หน้า และเวอร์ชันจริง

## ช่วง 4 — AI ที่มีหลักฐานรองรับ

- เลือกผู้ให้บริการและตั้ง secret ฝั่ง Worker; ไม่ฝังคีย์ใน Vite
- ให้ผู้ใช้ยินยอมส่งข้อมูลเอกสารไปผู้ให้บริการที่เลือกก่อน processing
- retrieval แยกตาม project permission; ไม่มี cross-project retrieval
- ตอบแบบ structured JSON: claim, sourceId, page/section, supporting excerpt, uncertainty, verification status
- แยก quote/paraphrase/interpretation/recommendation และปฏิเสธอ้างอิงเมื่อไม่มีหลักฐาน
- ป้องกัน document prompt injection: ข้อความในเอกสารเป็นข้อมูล ไม่ใช่คำสั่ง
- ใส่ rate limits, per-user quotas, request cancellation, error/retry handling และค่าใช้จ่ายที่ติดตามได้
- ตรวจรับ: grounding accuracy, citation precision, missing-source behavior, contradictory sources และ reviewer approval

## ช่วง 5 — การส่งมอบวิชาการ

- Protocol builder, research question–method matrix, Gantt ที่ปรับ milestone ได้
- template บทที่ 1–5 ตามรูปแบบหน่วยงาน และ export DOCX/PDF
- อิง reporting guideline ให้ตรงประเภทงาน พร้อม mapping หลักฐาน ไม่สรุปคะแนนรับรองขึ้นเอง
- เก็บเกณฑ์วารสาร/เวทีรางวัลเป้าหมายแยกจาก checklist ภายใน
