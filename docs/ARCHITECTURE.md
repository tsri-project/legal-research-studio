# สถาปัตยกรรมและสัญญาข้อมูล

## โครงไฟล์

```text
src/
  App.jsx                 หน้าหลักและ state ของพื้นที่ทำงาน
  components/UI.jsx       Heading, Field, Notice, Card
  data/catalog.js         คลังแนวคิด กระบวนการ และรายการตรวจ
  lib/model.js            schema, validation, persistence, CSV, timeline
  lib/exports.js          ร่างแผนและบันทึกการอ่านแบบ Markdown
  lib/api.js              client สำหรับ Cloud Sync
  styles.css              ธีมและ responsive layout
worker/index.js           Worker routing, Access JWT, D1 API, headers
migrations/0001_workspace.sql
.agents/skills/           คำแนะนำเฉพาะงานสำหรับ Agent
```

แอปใช้ React state สำหรับหน้าจอ ใช้ localStorage สำหรับข้อมูลที่บันทึกผ่าน validation และเรียก Cloud Sync เฉพาะเมื่อผู้ใช้กด ไม่ส่งข้อมูลไป LLM หรือ third-party analytics

## Workspace v2

```json
{"schemaVersion":2,"projects":[],"evidence":[],"readings":[],"checks":[]}
```

ทุก record มี `id` ที่ไม่ซ้ำในประเภทนั้น ทุก field ของ record เป็น string; `weeks` เป็น string ของจำนวนเต็ม 6–104; หลักฐานและการอ่านมี `projectId` เป็นค่าว่างหรือ ID โครงการที่มีอยู่ รายการตรวจเป็น array เลขจำนวนเต็ม 0–11 ที่ไม่ซ้ำ

การลบโครงการจะย้ายหลักฐานและการอ่านเป็น “ไม่ระบุโครงการ” โดยไม่ลบทิ้ง

## API

- `GET /api/workspace` → `{workspace, revision, owner}`
- `PUT /api/workspace` body `{workspace, revision}` → `{revision, owner}`
- ไม่มี CORS สำหรับ cross-origin calls; PUT ต้องมี Origin ตรงกับ URL ของ Worker
- ไม่เชื่อ owner ID ที่มาจาก client; ใช้ `sub` จาก Access JWT ที่ตรวจ signature, issuer, audience, expiry และ RS256 แล้ว
- `revision=0` ใช้ insert เฉพาะเมื่อยังไม่มีแถว; revision ถัดไปใช้ UPDATE ... WHERE owner_id=? AND revision=?
- conflict ตอบ 409; ไม่มี silent last-write-wins
- API ไม่เปิดข้อมูลเมื่อ Access config/DB binding ขาดหาย
- API errors ไม่คืน stack, token หรือเอกสารให้ client

D1 แบบ document เป็นทางเริ่มต้นที่เข้าใจง่าย การเปลี่ยนเป็น relational model ต้องมี migration และแผนแปลงข้อมูล โดยแนะนำตาราง users, projects, memberships, legal_sources, source_versions, citations, findings, readings, reviews และ audit_events

## ความเป็นส่วนตัวและการขยายระบบ

Static shell ไม่มีข้อมูลวิจัยที่ฝังมา แต่ควรตั้ง Cloudflare Access ครอบคลุมทั้ง hostname เพื่อควบคุมการเข้าถึง UI ด้วย Worker ตรวจ JWT ซ้ำสำหรับ API ปิด alternate hostname ที่ไม่ได้ป้องกัน เช่น workers.dev หากไม่ใช้

ข้อมูลใน localStorage ไม่แยกตาม Access identity การสลับบัญชีใน browser profile เดียวกันไม่ทำให้ข้อมูล local เปลี่ยนผู้ใช้โดยอัตโนมัติ Cloud Sync จึงต้องเลือกเอง แสดงบัญชีเป้าหมาย และดาวน์โหลดใหม่ก่อนเขียน ควรพัฒนา user-scoped encrypted storage/logout cleanup ก่อนใช้เครื่องร่วมกัน

ไม่มี R2/files ในชุดนี้: อย่าใส่ไฟล์ base64 ลง D1 workspace ให้เพิ่ม R2 แยก metadata และสิทธิ์ก่อนรองรับ upload
