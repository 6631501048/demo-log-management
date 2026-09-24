# Setup: Appliance Mode

รันบนเครื่อง/VM เดียว ผ่าน Docker Compose ตามที่โจทย์กำหนด (ข้อ 2.2)

## ข้อกำหนดขั้นต่ำ (ตามโจทย์ §5)
- Ubuntu 22.04+ (หรือ Linux distro อื่นที่มี Docker)
- 4 vCPU, 8 GB RAM, 40 GB Disk
- เปิดพอร์ต: `80` (web), `3000` (API, optional), `514` (syslog UDP/TCP)

## ติดตั้ง Docker (ถ้ายังไม่มี)
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# logout/login ใหม่ให้ group มีผล
```

## ขั้นตอน (1 คำสั่ง)
```bash
git clone <your-repo-url>
cd log-management
./run.sh
```
สคริปต์นี้จะ: copy `.env.example` → `.env` (ถ้ายังไม่มี), รัน
`docker compose up -d --build`, รอ Postgres พร้อม, สร้าง demo user
(admin/viewer) ให้อัตโนมัติ

**Database schema สร้างอัตโนมัติ** ตอน Postgres container start ครั้งแรก
(ผ่าน `/docker-entrypoint-initdb.d/` — ดู `docker-compose.yml`) ไม่ต้องรัน
migration เอง

## เข้าใช้งาน
- Dashboard: http://localhost (หรือ `http://<vm-ip>`)
- Login: `admin@demoA.local` / `secret123` (หรือ `viewer@demoA.local` / `secret123`)
- API ตรงๆ: http://localhost:3000

## ทดสอบ ingestion
```bash
# Syslog (firewall + network samples)
./samples/send_syslog.sh udp 127.0.0.1 514

# HTTP JSON API (api, crowdstrike, aws, m365, ad samples)
python3 ./samples/post_logs.py --url http://localhost:3000/ingest

# หรือ batch import ตรงจากไฟล์ (ไม่ผ่าน HTTP)
docker compose exec api node ../ingest/batchImporter.js
```
เปิด Dashboard แล้ว log ควรขึ้นภายใน 1 นาที (ตรงตาม acceptance checklist
ข้อ 7 ของโจทย์)

## ทดสอบ Alert
Import `samples/logs/ad_events.json` (มี failed login 5 ครั้งจาก IP เดิม
ตรงกับ rule ตัวอย่างที่ seed ไว้) แล้วรอ evaluator รอบถัดไป (≤60 วินาที) —
alert ใหม่ควรขึ้นที่หน้า Alerts

## ทดสอบ RBAC
Login ด้วย `viewer@demoA.local` แล้วลองเรียก
`GET /logs?tenant=demoB` ตรงๆ — ควรยังเห็นแค่ข้อมูล `demoA` (พารามิเตอร์
tenant ถูกเพิกเฉยสำหรับ role viewer) เทียบกับ `admin@demoA.local` ที่ใส่
`?tenant=demoB` แล้วเห็นข้อมูลของ tenant นั้นได้จริง

## คำสั่งอื่นๆ
```bash
docker compose logs -f          # ดู log ทุก service
docker compose down             # หยุดระบบ (ข้อมูลใน volume ยังอยู่)
docker compose down -v          # หยุด + ลบข้อมูลทั้งหมด
make seed-users                 # สร้าง user เพิ่ม (ดู Makefile)
```

## Troubleshooting
- **Port 514 ใช้ไม่ได้ (permission denied)**: บาง Linux distro บล็อก
  bind port <1024 จาก non-root แม้ใน container ก็ตาม (เพราะ host-side bind) —
  ถ้าเจอปัญหา ลองรันด้วย `sudo` หรือเปลี่ยน host port mapping ใน
  `docker-compose.yml` เป็น `"5514:5514/udp"` แล้วยิง sample ไปที่ port 5514
  แทน
- **postgres ไม่ healthy**: เช็ค `docker compose logs postgres` — ปกติจะพร้อม
  ภายใน ~5 วินาที
