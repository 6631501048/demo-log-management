# Alerting — Phase 5

## กฎที่ implement (ตรงกับตัวอย่างในโจทย์ §2.2)
**`repeated_failed_login`** — login ล้มเหลวซ้ำจาก IP/user/host เดิมภายใน N นาที

Config (เก็บใน `alert_rules.config` เป็น JSONB, ดู seed ตัวอย่างใน
`backend/db/seed/seed.sql`):
```json
{
  "type": "repeated_failed_login",
  "threshold": 5,
  "window_minutes": 5,
  "group_by": "src_ip",
  "event_type": "LogonFailed"
}
```
`group_by` รองรับเฉพาะ `src_ip`, `user`, `host` (whitelist ป้องกัน SQL
injection เพราะ config มาจาก DB ไม่ใช่ constant ในโค้ด)

โครง config เป็น generic JSONB เพื่อให้เพิ่ม rule type ใหม่ในอนาคตได้โดยไม่ต้อง
แก้ schema — แค่เพิ่ม `case` ใหม่ใน `evaluator.js#evaluateRule()`

## วิธีทำงาน
1. `backend/src/alerting/evaluator.js` รันเป็น background loop ทุก
   `ALERT_CHECK_INTERVAL_MS` (default 60s) ผ่าน `startAlertLoop()` ที่เรียกจาก
   `server.js` ตอน boot
2. แต่ละรอบ: โหลด `alert_rules` ที่ `enabled=true` ทั้งหมดทุก tenant →
   query `logs` กลุ่มตาม `group_by` ภายใน `window_minutes` ล่าสุด → ถ้ากลุ่มไหน
   นับได้ >= `threshold` → insert แถวใหม่ใน `alerts`
3. **Dedup**: ถ้ามี alert ของ rule+group เดียวกันเกิดขึ้นแล้วภายใน window
   เดียวกัน จะไม่สร้างซ้ำ (กัน spam ทุก 60 วินาทีตอน streak ยังดำเนินอยู่)
4. Alert ใหม่ทุกอันจะถูกส่งผ่าน `notifier.js`:
   - ถ้าตั้ง `ALERT_WEBHOOK_URL` → POST JSON ไปที่ URL นั้น
   - ถ้าตั้ง `SMTP_HOST` + `ALERT_EMAIL_TO` → ส่งอีเมลผ่าน nodemailer
   - ถ้าไม่ตั้งทั้งคู่ → alert ยังโชว์บนหน้า Alerts ของ UI ตามปกติ (โจทย์ระบุ
     "แสดงในหน้า Alert **หรือ**ส่ง Webhook/Email" — UI อย่างเดียวก็ผ่าน
     requirement ข้อนี้)

## API
`GET /alerts?limit=&offset=&tenant=` (ต้อง Bearer token) — tenant-scoping กฎ
เดียวกับ `/logs` (viewer เห็นแค่ tenant ตัวเอง, admin override ได้)

## Frontend
`frontend/src/views/AlertsView.vue` (สร้างไว้ตั้งแต่ Phase 4) ต่อกับ
`api.getAlerts()` เรียบร้อยแล้ว

## Tested (Phase 5, ก่อนมี DB จริง)
- `notifier.js` — ทดสอบจริงทั้ง 2 เคส: **UI-only fallback** (ไม่ตั้ง env ใดๆ)
  และ **webhook delivery** (mock HTTP receiver รับ payload ถูกต้องครบ) — ✅
  ผ่านทั้งคู่
- `evaluator.js` — syntax + SQL ผ่านการตรวจด้วยตา, ยังไม่ได้รันกับ DB จริง
  (ต้องมี Postgres) — จะ verify การนับ/dedup/insert จริงตอน Phase 6
- Frontend build ผ่านหลังต่อ `api.getAlerts()` เข้ากับ `GET /alerts`

## แผนทดสอบ end-to-end (พอมี DB ใน Phase 6)
ใช้ `samples/logs/ad_events.json` ที่เตรียมไว้ตั้งแต่ Phase 2 — มี 5 record
`LogonFailed` จาก IP เดิม (`203.0.113.77`) ภายใน ~3 นาที ตรงกับ threshold
ของ rule ตัวอย่างใน seed.sql พอดี → import แล้วรอ evaluator รอบถัดไป (≤60s)
ควรเห็น alert ใหม่ขึ้นทั้งใน DB และหน้า Alerts
