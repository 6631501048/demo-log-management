# Architecture (Final — Phase 7)

## 1. เป้าหมายระบบ
Log Management demo ที่รับ log จากหลายแหล่ง (Firewall, Network, API,
CrowdStrike, AWS, M365, AD) → normalize เข้า schema กลาง → เก็บให้ค้นหาได้ →
แสดงผลบน dashboard → แจ้งเตือนตามกฎ → รองรับ multi-tenant (RBAC 2 role) →
deploy ได้ทั้งแบบ Appliance (single VM) และ SaaS (cloud VM + HTTPS)

## 2. Tech Stack (ตามที่ implement จริง)

| ส่วน | เทคโนโลยี | เหตุผล |
|---|---|---|
| Ingest / Backend API | Node.js 20 + Express | ทีมถนัดอยู่แล้ว, ecosystem รองรับทั้ง HTTP และ raw socket (syslog UDP/TCP) ได้ดี |
| Storage | PostgreSQL 15 (hybrid column + JSONB, GIN index) | Query เร็วพอสำหรับ demo, ไม่ต้องเรียนรู้ระบบใหม่ (OpenSearch) ซึ่งประหยัดเวลาที่มีจำกัด (10 วัน) |
| Frontend | Vue 3 (Composition API) + Vite + Chart.js | ทีมถนัดอยู่แล้ว, bundle เล็ก (gzip ~111KB), ไม่พึ่ง UI framework ใหญ่ |
| Auth | JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`) | มาตรฐาน, เบา, เหมาะกับ demo scope |
| Deployment | Docker Compose (+ overlay file สำหรับ SaaS) | โค้ด/image เดียวกันทั้ง 2 โหมด ต่างกันแค่ nginx config |
| Reverse Proxy / TLS | Nginx (self-signed cert สำหรับ SaaS demo) | เปิด HTTPS ได้ตามข้อกำหนดขั้นต่ำ, proxy ทุก API path ไปที่ backend |
| Alerting | `setInterval` loop ใน Node process (ไม่ใช้ library cron แยก) | เรียบง่าย ควบคุมได้เต็มที่ ไม่ต้องเพิ่ม dependency |
| Notification | Webhook (fetch) + Email (nodemailer, optional) | ตาม requirement "แสดงในหน้า Alert หรือส่ง Webhook/Email" — ทำได้ทั้ง 3 ทาง |

## 3. Data Flow

```
[Sources]
  Firewall/Syslog ──┐
  Router/Syslog ─────┼──► [Syslog Listener :514 UDP/TCP] ──┐
  HTTP API (POST) ───────► [Express /ingest endpoint] ──────┤
  File batch (AWS/M365/AD sample JSON) ─► [Batch importer] ─┤
                                                             ▼
                                                  [Normalizer per source]
                                                    (backend/src/normalizers/*)
                                                             │
                                                             ▼
                                                  [PostgreSQL: logs table]
                                                             │
                       ┌─────────────────────┬───────────────┼─────────────────────┐
                       ▼                     ▼                ▼                     ▼
                [GET /logs]          [Alert evaluator     [GET /logs/summary]  [Retention sweep
                (search)              loop, every 60s]     (dashboard)         (daily, drops >7d)]
                       │                     │                ▼
                       │                     ▼          [Vue Dashboard:
                       │              [alerts table]     charts + timeline]
                       ▼                     │
                [Vue log table]              ▼
                              [Webhook / Email / GET /alerts → Vue Alerts page]
```

## 4. Deployment Architecture (Docker Compose)

```
                         ┌─────────────────────────────────────┐
  Internet / LAN ──────► │  nginx (web container)               │
  :80 (Appliance)        │  - serves Vue SPA (built dist/)       │
  :80,:443 (SaaS, TLS)   │  - reverse-proxies /auth /logs        │
                         │    /alerts /ingest → api:3000         │
                         └───────────────┬───────────────────────┘
                                         │
                         ┌───────────────┼───────────────────────┐
                         ▼               ▼                       ▼
                 ┌──────────────┐ ┌──────────────┐      ┌──────────────┐
                 │ api container │ │ syslog        │      │ postgres      │
                 │ (Express)     │ │ container     │◄────►│ container     │
                 │ :3000         │ │ UDP/TCP :5514 │      │ (named volume │
                 │ + alert loop  │ │ (host :514)   │      │  postgres-data)│
                 │ + retention   │ └──────────────┘      └──────────────┘
                 └──────────────┘
```
ทั้ง 4 container มาจาก `docker-compose.yml` เดียว — `api` และ `syslog` ใช้
image เดียวกัน (`Dockerfile.backend`) ต่างกันแค่ `command:` ที่รัน — ดู
`docs/setup_appliance.md` / `docs/setup_saas.md` สำหรับขั้นตอน deploy

## 5. Tenant Model
- ทุก log record มีคอลัมน์ `tenant` (text slug, บังคับ ไม่ null) — ดู
  `backend/db/migrations/001_init.sql`
- ทุก authenticated request มี tenant context จาก JWT claim `tenant`
  (ผูกกับ user ตอน login — ดู `backend/src/auth.js#signToken`)
- Role `admin`: default เห็น tenant ตัวเอง, ใส่ `?tenant=<slug>` เพื่อดู
  tenant อื่นได้ (cross-tenant access ที่ตั้งใจ สำหรับ operator)
- Role `viewer`: query ถูกบังคับ filter ด้วย tenant ของตัวเองเสมอที่
  **backend** (`backend/src/routes/logs.js`, `routes/alerts.js`) — ส่ง
  `?tenant=` มาแก้ไม่ได้ ถูกเพิกเฉยเสมอ กัน bypass จาก frontend
- Index `(tenant, ts DESC)` เป็น query pattern หลักที่ทุก endpoint ใช้

## 6. Security Summary
- **AuthN**: JWT (HS256, secret จาก env), password hash ด้วย bcrypt (cost 10)
- **AuthZ**: middleware `requireAuth` + `requireRole()` บังคับทุก route ใต้
  `/logs`, `/logs/summary`, `/alerts` — ทดสอบผ่าน integration test จริง
  (`tests/rbac.test.js`)
- **Multi-tenant isolation**: บังคับที่ SQL query level เสมอ ไม่พึ่ง client
- **TLS**: เปิดใน SaaS mode ผ่าน nginx (self-signed หรือ Let's Encrypt ก็ได้)
- **SQL injection**: parameterized query ทุกจุด, ยกเว้น dynamic column name
  ใน alert evaluator (`group_by`) ที่ผ่าน whitelist ก่อนเสมอ (ดู
  `backend/src/alerting/evaluator.js`)
- **Ingest auth**: optional shared-secret (`INGEST_API_KEY` + header
  `x-api-key`) สำหรับ machine-to-machine ingest ตอน deploy จริง

## 7. Known Simplifications (บันทึกไว้ให้กรรมการเห็นว่าตั้งใจ)
- Syslog ไม่มี tenant field ในตัว → fix ต่อ listener instance ผ่าน
  `SYSLOG_DEFAULT_TENANT` (ของจริงจะ map ด้วย source IP/listener แยกต่อลูกค้า)
- Retention ใช้ periodic `DELETE` ไม่ใช่ partition-drop (เหมาะกับข้อมูลระดับ
  demo; scale ใหญ่ควรใช้ partition by month แทน)
- Alert evaluator รองรับ rule type เดียว (`repeated_failed_login`) — โครง
  config เป็น JSONB generic รองรับเพิ่ม type ใหม่ได้โดยไม่ต้อง migrate schema
