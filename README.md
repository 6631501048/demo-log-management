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

## Quick start (จะเติมหลังจาก Phase 6)
```bash
cp .env.example .env
docker-compose up
```
