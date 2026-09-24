# Acceptance Checklist Self-Check (ตามโจทย์ข้อ 7)

ทำตามลำดับนี้ตอนซ้อม demo หรือให้กรรมการทดสอบ — แต่ละข้อบอกว่าใช้คำสั่ง/ไฟล์ไหน

| # | Checklist (จากโจทย์) | วิธีทดสอบในโปรเจกต์นี้ | สถานะ |
|---|---|---|---|
| 1 | เปิดระบบโหมด Appliance ตามเอกสาร (1 คำสั่ง) | `./run.sh` | ✅ implement แล้ว — **ต้องรันจริงบน Linux VM เพื่อยืนยัน** (sandbox พัฒนาไม่มี Docker daemon) |
| 2 | ส่ง Syslog แล้วเห็นใน UI ภายใน 1 นาที | `./samples/send_syslog.sh udp 127.0.0.1 514` แล้วเปิด Dashboard | ✅ logic ทดสอบแล้ว (`tests/normalizers.test.js`), รอ verify กับ DB จริง |
| 3 | POST /ingest ด้วย JSON แล้วค้นหาได้ | `python3 samples/post_logs.py` แล้ว `GET /logs` | ✅ เหมือนข้อ 2 |
| 4 | อัปโหลด/ชี้ไฟล์ sample AWS/M365/AD แล้ว normalize ได้ | `docker compose exec api node ../ingest/batchImporter.js` | ✅ normalizer ทดสอบแล้วทั้ง 3 source |
| 5 | Dashboard แสดง Top N, Timeline, Filter by tenant/source/time | เปิด `/` หลัง login | ✅ implement ครบ (`DashboardView.vue`) |
| 6 | สร้าง Alert rule ตัวอย่างและเห็นการแจ้งเตือน | seed มี rule ให้แล้ว, import `samples/logs/ad_events.json` แล้วรอ ≤60s | ✅ evaluator + notifier ทดสอบแล้ว (`tests/`, manual notifier test) |
| 7 | RBAC: viewer เห็นเฉพาะ tenant ตัวเอง | login `viewer@demoA.local` แล้วลอง `?tenant=demoB` | ✅ ทดสอบผ่าน integration test จริง (`tests/rbac.test.js`) |
| 8 | โหมด SaaS เข้าใช้งานผ่าน HTTPS ได้ | `docker compose -f docker-compose.yml -f docker-compose.saas.yml up -d --build` บน cloud VM | ⚠️ implement แล้ว, **ยังไม่ได้ deploy จริงขึ้น cloud VM** — ต้องทำก่อนวันสัมภาษณ์ |

## สิ่งที่ต้องทำเองก่อน demo วันจริง (นอกเหนือจากโค้ดที่ผมช่วยไว้)
1. รัน `./run.sh` บน Linux VM จริงของคุณ (ตามที่ตอบไว้ Phase 6) — จับ error
   ที่อาจซ่อนอยู่ (permission, port conflict ฯลฯ)
2. สมัคร Oracle Cloud, สร้าง VM, deploy SaaS mode ตาม `docs/setup_saas.md`
3. รัน checklist ทั้ง 8 ข้อข้างบนด้วยตัวเองอย่างน้อย 1 รอบเต็ม ก่อนอัดวิดีโอ
4. อัดวิดีโอ demo ตาม script ใน `docs/demo_video_script.md`
