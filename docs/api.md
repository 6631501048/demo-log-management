# Backend API — Phase 3

## Auth

### `POST /auth/login`
```json
// request
{ "email": "admin@demoA.local", "password": "secret123" }

// response 200
{ "ok": true, "token": "eyJ...", "user": { "email": "...", "role": "admin", "tenant": "demoA" } }

// response 401
{ "ok": false, "error": "invalid email or password" }
```
ใช้ `Authorization: Bearer <token>` ในทุก request ไปยัง `/logs/*`

### สร้าง user
Postgres seed ไม่ได้สร้าง user ให้ (password ต้องเป็น bcrypt hash จริง) —
รันแทน:
```bash
npm run create-user -- --email admin@demoA.local --password secret123 --role admin --tenant demoA
npm run create-user -- --email viewer@demoA.local --password secret123 --role viewer --tenant demoA
```

## Search & Dashboard (ต้องมี Bearer token)

### `GET /logs`
Query params: `source, event_type, severity_min, from, to, q, limit, offset`

**Tenant scoping (บังคับที่ backend เสมอ ไม่พึ่ง frontend):**
- role `viewer` → บังคับ filter ด้วย tenant ของตัวเอง (JWT claim) เสมอ, `?tenant=` ที่ส่งมาจะถูกเพิกเฉย
- role `admin` → default เป็น tenant ของตัวเอง, ใส่ `?tenant=<slug>` เพื่อดู tenant อื่นได้

```
GET /logs?source=ad&severity_min=5&from=2025-08-20T00:00:00Z&limit=50
Authorization: Bearer <token>
```

### `GET /logs/summary`
คืนข้อมูลสำหรับ dashboard: `top_ip`, `top_user`, `top_event_type`, `timeline`
(group by ชั่วโมง) — ใช้ tenant-scoping กฎเดียวกับ `/logs`

## Ingest (ไม่ต้อง user login — เป็น machine-to-machine)
`POST /ingest` ยังเปิดแบบไม่ auth by default (เหมาะกับ demo/grading) แต่รองรับ
shared-secret แบบง่าย: ตั้ง `INGEST_API_KEY` ใน `.env` แล้วส่ง header
`x-api-key: <key>` มาด้วย — ใช้ตอน deploy จริง (Phase 6, SaaS mode)

## Tested (Phase 3, ก่อนมี DB จริง)
- Password hashing/verify (bcrypt) — ✅ ผ่าน
- JWT sign/verify/expire/reject-invalid — ✅ ผ่าน
- `requireAuth` + `requireRole` middleware ผ่าน HTTP integration test จริง
  (no-token→401, valid→200, wrong-role→403, admin→200) — ✅ ผ่านทั้ง 4 เคส
- Search/summary query logic ยังไม่ทดสอบกับ DB จริง (ต้องรอ Phase 6 มี Postgres
  ให้ต่อ) — SQL ผ่านการตรวจด้วยตาแล้ว จะ verify end-to-end พร้อม Docker Compose
