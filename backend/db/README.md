# Database — Phase 1

## ไฟล์
- `migrations/001_init.sql` — สร้างตาราง `tenants`, `users`, `logs`, `alert_rules`, `alerts`
- `seed/seed.sql` — ข้อมูลเริ่มต้นสำหรับ dev (2 tenants, users placeholder, ตัวอย่าง alert rule)

## แนวคิดออกแบบ `logs` table

**Hybrid column/JSONB**: field ที่ต้อง filter/index บ่อย (tenant, source,
event_type, severity, timestamp, src_ip/dst_ip, user, host) เป็น column จริง
เพื่อความเร็ว ส่วน field ที่เหลือ (process, url, http_method, status_code,
rule_name, cloud.*, ports, protocol ฯลฯ) เก็บรวมใน `raw JSONB` — ยืดหยุ่นกว่า
เวลาต้อง normalize source ใหม่ที่มี field แปลกๆ โดยไม่ต้อง migrate schema ทุกครั้ง

**Multi-tenant**: ทุกแถวใน `logs` มี `tenant` (text slug) บังคับ ไม่ null และมี
composite index `(tenant, ts DESC)` เป็นตัวหลัก เพราะทุก query จริงจะ filter
ด้วย tenant + time range ก่อนเสมอ (ตรงกับ pattern การใช้งาน dashboard)

## รันยังไง (จะทำใน Phase 6 ผ่าน Docker Compose)
```bash
psql -h localhost -U logmgmt_user -d logmgmt -f backend/db/migrations/001_init.sql
psql -h localhost -U logmgmt_user -d logmgmt -f backend/db/seed/seed.sql
```

## สิ่งที่ต้องทำต่อใน Phase 3
- แทนที่ `password_hash` placeholder ใน seed.sql ด้วย hash จริงผ่าน
  `backend/scripts/create_user.js` (bcrypt)