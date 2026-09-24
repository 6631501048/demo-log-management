# Log Management Demo

ระบบ Log Management ที่รองรับหลายแหล่งข้อมูล (Firewall, API, CrowdStrike, AWS,
M365, AD) พร้อม normalize เข้า schema กลาง, ค้นหาได้, dashboard, alerting,
RBAC/multi-tenant และ deploy ได้ทั้งแบบ Appliance (Docker Compose) และ SaaS
(cloud VM + HTTPS)

## สถานะ
🚧 อยู่ระหว่างพัฒนา — ดูแผนงานที่ [`docs/architecture.md`](docs/architecture.md)

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
- [`docs/architecture.md`](docs/architecture.md) — สถาปัตยกรรม, data flow, tenant model
- [`docs/ingestion.md`](docs/ingestion.md) — ingestion layer (HTTP/syslog/batch), normalizer mapping
- [`docs/api.md`](docs/api.md) — auth + search API reference
- [`docs/alerting.md`](docs/alerting.md) — alert rule, evaluator, notifier

