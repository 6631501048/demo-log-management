# Log Management Demo

ระบบ Log Management ที่รองรับหลายแหล่งข้อมูล (Firewall, API, CrowdStrike, AWS,
M365, AD) พร้อม normalize เข้า schema กลาง, ค้นหาได้, dashboard, alerting,
RBAC/multi-tenant และ deploy ได้ทั้งแบบ Appliance (Docker Compose) และ SaaS
(cloud VM + HTTPS)

## สถานะ
✅ ครบทุก feature ตามโจทย์ (Phase 0-7) — เหลือแค่ deploy จริงขึ้น cloud VM +
อัดวิดีโอ demo (ดู [`docs/acceptance_checklist.md`](docs/acceptance_checklist.md))

## Tech Stack
- Backend/Ingest: Node.js + Express
- Storage: PostgreSQL (JSONB + GIN index)
- Frontend: Vue 3
- Deployment: Docker Compose

## โครงสร้าง repo
```
/docs        เอกสาร architecture, setup guide
/backend     Express API (auth, ingest, search, alert)
/frontend    Vue 3 dashboard
/ingest      Syslog listener, batch importer, normalizers
/samples     ตัวอย่าง log + สคริปต์ยิง log ทดสอบ
/tests       test cases
```

## Quick start
```bash
git clone <your-repo-url>
cd log-management
./run.sh
```
เปิด http://localhost แล้ว login ด้วย `admin@demoA.local` / `secret123`

ดูขั้นตอนละเอียด: [`docs/setup_appliance.md`](docs/setup_appliance.md) (โหมดเดียว/VM เดียว)
หรือ [`docs/setup_saas.md`](docs/setup_saas.md) (cloud VM + HTTPS)

## เอกสารอื่นๆ
- [`docs/architecture.md`](docs/architecture.md) — สถาปัตยกรรม, data flow, tenant model, security summary
- [`docs/ingestion.md`](docs/ingestion.md) — ingestion layer (HTTP/syslog/batch), normalizer mapping
- [`docs/api.md`](docs/api.md) — auth + search API reference
- [`docs/alerting.md`](docs/alerting.md) — alert rule, evaluator, notifier
- [`docs/setup_appliance.md`](docs/setup_appliance.md) — Appliance deployment
- [`docs/setup_saas.md`](docs/setup_saas.md) — SaaS deployment (Oracle Cloud walkthrough)
- [`docs/acceptance_checklist.md`](docs/acceptance_checklist.md) — self-check เทียบกับเกณฑ์กรรมการ
- [`docs/demo_video_script.md`](docs/demo_video_script.md) — script สำหรับอัด demo video 30 นาที

## Tests
```bash
cd backend && npm install   # ติดตั้งครั้งแรก (express ใช้ร่วมกับ test suite)
npm test                    # รันจาก repo root — 17 automated tests
```
ครอบคลุม: normalizer ทุก source (7 ตัว), auth (hash/JWT), RBAC middleware
(integration test ผ่าน HTTP จริง)