# Architecture (Draft — Phase 0)

> สถานะ: ร่างเริ่มต้น จะเติมรายละเอียด + diagram ฉบับเต็มใน Phase 7
> หลังจากระบบ implement เสร็จจริง (เพื่อให้ตรงกับของจริง ไม่ใช่แค่แผน)

## 1. เป้าหมายระบบ
Log Management demo ที่รับ log จากหลายแหล่ง (Firewall, API, CrowdStrike, AWS,
M365, AD) → normalize เข้า schema กลาง → เก็บให้ค้นหาได้ → แสดงผลบน dashboard
→ แจ้งเตือนตามกฎ → รองรับ multi-tenant และ deploy ได้ทั้งแบบ Appliance และ SaaS

## 2. Tech Stack (ตัดสินใจ)

| ส่วน | เทคโนโลยี | เหตุผล |
|---|---|---|
| Ingest / Backend API | Node.js + Express | ทีมถนัดอยู่แล้ว, ecosystem รองรับทั้ง HTTP และ raw socket (syslog) ได้ดี |
| Storage | PostgreSQL 15 (JSONB + GIN index) | Query เร็วพอสำหรับ demo, ไม่ต้องเรียนรู้ระบบใหม่ (OpenSearch) ซึ่งประหยัดเวลาที่มีจำกัด (10 วัน), ยังรองรับ full-text/JSON search ได้ผ่าน GIN index |
| Frontend | Vue 3 (Composition API) + Chart.js | ทีมถนัดอยู่แล้ว, เขียน dashboard ได้เร็ว |
| Auth | JWT (jsonwebtoken) + bcrypt | มาตรฐาน, เบา, เหมาะกับ demo scope |
| Deployment | Docker Compose | ตรงกับ requirement "Appliance = รันเครื่องเดียว" ได้ตรงตัว และ deploy ขึ้น cloud VM ได้แบบเดียวกัน (SaaS) |
| Reverse Proxy / TLS | Nginx (self-signed cert สำหรับ SaaS demo) | ง่าย, เปิด HTTPS ได้ตามข้อกำหนดขั้นต่ำ |
| Alerting | Node cron job (node-cron) query DB ตามรอบ | ไม่ต้องพึ่ง external service, ควบคุมได้เต็มที่ |

**หมายเหตุ:** พิจารณา OpenSearch ไว้เป็นทางเลือกถ้ามีเวลาเหลือ (คะแนนหมวด
Storage & Query อาจสูงกว่า) แต่ Postgres ถูกเลือกเป็น baseline เพื่อความเสี่ยง
ต่ำสุดในกรอบเวลา 10 วัน

## 3. Data Flow (คร่าว ๆ)

```
[Sources]
  Firewall/Syslog ──┐
  Router/Syslog ─────┼──► [Syslog Listener :514 UDP/TCP] ──┐
  HTTP API (POST) ───────► [Express /ingest endpoint] ──────┤
  File batch (AWS/M365/AD sample JSON) ─► [Batch importer] ─┤
                                                             ▼
                                                  [Normalizer per source]
                                                             │
                                                             ▼
                                                  [PostgreSQL: logs table]
                                                             │
                                       ┌─────────────────────┼─────────────────────┐
                                       ▼                     ▼                     ▼
                                [Search API]          [Alert cron job]      [Dashboard summary API]
                                       │                     │                     │
                                       ▼                     ▼                     ▼
                                  [Vue Frontend] ◄── [Alert list UI]        [Charts/Timeline]
```

## 4. Tenant Model (แนวคิดเบื้องต้น)

- ทุก log record มีคอลัมน์ `tenant` (บังคับ ไม่ null)
- ทุก API request ต้องมี tenant context: มาจาก JWT claim (`tenant_id`) ของ user ที่ login
- Role `admin`: เห็นทุก tenant (หรือ tenant ที่ตัวเองดูแล — จะสรุปอีกทีตอน implement)
- Role `viewer`: query ถูก filter ด้วย `WHERE tenant = :jwt_tenant` เสมอ บังคับที่ backend
  ไม่ใช่ frontend (กัน bypass)
- เก็บ index บน `tenant` เพื่อ query เร็วและเผื่อทำ partition ตาม tenant ในอนาคต

## 5. ประเด็นที่ยังไม่ฟันธง (รอ Phase 1-2)
- Schema ตารางแบบละเอียด (คอลัมน์ไหนเป็น column จริง / ไหนอยู่ใน JSONB raw)
- รูปแบบ syslog parser (เขียนเอง vs ใช้ library เช่น `glossy`/`syslogd`)
- วิธี retention (cron ลบ record เก่า vs partition by month)
