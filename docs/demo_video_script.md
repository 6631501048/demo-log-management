# Demo Video Script (30 นาที)

เป้าหมาย: อธิบายสถาปัตยกรรม + เดโม ingest → search → dashboard → alert
ตามที่โจทย์ข้อ 6.2 กำหนด บันทึกตามลำดับนี้ได้เลย เวลาเป็นค่าประมาณ ปรับได้

## 1. เปิดตัว + ภาพรวม (2 นาที)
- แนะนำตัว + โจทย์คืออะไรโดยสรุป
- เปิด `docs/architecture.md` โชว์ diagram data flow — พูดสั้นๆ ว่าทำไมเลือก
  Node.js/Postgres/Vue (ตอบเป็น "ทีมถนัดอยู่แล้ว + ประหยัดเวลาในกรอบ 10 วัน")

## 2. สถาปัตยกรรม + เหตุผลการออกแบบ (5 นาที)
- โชว์ deployment diagram (docs/architecture.md §4) — อธิบาย container
  ทั้ง 4 ตัว (postgres, api, syslog, web) มาจาก compose ไฟล์เดียว
- โชว์ schema กลาง (`backend/db/migrations/001_init.sql`) — อธิบาย hybrid
  column/JSONB design และทำไมเลือกแบบนี้
- พูดเรื่อง tenant model สั้นๆ (viewer ถูกบังคับ filter ที่ backend)

## 3. Ingest → Search (8 นาที)
- เปิด terminal โชว์ `./run.sh` รันจนจบ (ถ้าอัดสดใช้เวลาจริง หรือ fast-forward
  ส่วนรอ container start)
- ยิง syslog: `./samples/send_syslog.sh udp 127.0.0.1 514` → เปิด Dashboard
  โชว์ log ขึ้นภายใน 1 นาที (ตรงกับ checklist ข้อ 2)
- ยิง JSON: `python3 samples/post_logs.py` → โชว์ log อีก 5 source ขึ้น
- ใช้ FilterBar กรอง source/event_type/time range โชว์ผลลัพธ์เปลี่ยน
- (ถ้าเวลาเหลือ) โชว์ `backend/src/normalizers/` อธิบายว่าแต่ละ source
  normalize ยังไง 1-2 ตัวอย่าง

## 4. Dashboard (5 นาที)
- โชว์ 3 bar chart (Top IP / Top User / Top Event Type) + timeline
- อธิบายว่าข้อมูลมาจาก `GET /logs/summary` — query แบบไหน (group by + count)
- Login สลับ role (admin ↔ viewer) โชว์ว่า viewer เห็นข้อมูลจำกัดกว่า

## 5. Alert (5 นาที)
- โชว์ alert rule ที่ seed ไว้ (`repeated_failed_login`)
- Import `samples/logs/ad_events.json` (มี failed login 5 ครั้งจาก IP เดิม)
- รอ ≤60 วินาที → โชว์ alert ใหม่ขึ้นที่หน้า Alerts
- (ถ้าตั้ง webhook ไว้) โชว์ payload ที่ webhook รับ

## 6. Security / RBAC (3 นาที)
- Login เป็น viewer แล้วลองยิง `GET /logs?tenant=demoB` ตรงๆ ผ่าน Postman
  → โชว์ว่ายังเห็นแค่ tenant ตัวเอง (พารามิเตอร์ถูกเพิกเฉย)
- Login เป็น admin แล้วลอง `?tenant=demoB` → โชว์ว่าเห็นข้อมูลข้าม tenant ได้
- พูดสั้นๆ เรื่อง JWT + bcrypt

## 7. SaaS mode + ปิดท้าย (2 นาที)
- เปิด URL https://<vm-public-ip> โชว์ browser warning (self-signed cert)
  เข้าต่อแล้วโชว์ว่าใช้งานได้เหมือนกันทุกอย่าง
- สรุปสิ่งที่ยังไม่ทำ/ข้อจำกัดที่รู้ตัว (ดู
  `docs/acceptance_checklist.md` และ known simplifications ใน
  architecture.md §7) — แสดงว่ารู้ trade-off ที่ตัวเองเลือก ไม่ใช่ไม่รู้

## Checklist ก่อนอัดจริง
- [ ] รัน `npm test` ผ่านหมด (17 tests)
- [ ] รัน acceptance checklist ทั้ง 8 ข้อใน `docs/acceptance_checklist.md`
      ด้วยมือครบ 1 รอบ
- [ ] SaaS mode deploy ขึ้น VM จริงแล้ว เข้า HTTPS ได้
- [ ] เตรียม 2 browser tab/profile ไว้ล่วงหน้า (admin กับ viewer) จะได้ไม่ต้อง
      logout/login สลับกันตอนอัด เสียเวลา
