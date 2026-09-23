# Ingestion — Phase 2

## โปรโตคอลที่รองรับ (≥ 2 ตามข้อกำหนด)
1. **HTTP JSON** — `POST /ingest` (backend/src/routes/ingest.js), รองรับ source:
   `api`, `crowdstrike`, `aws`, `m365`, `ad`
2. **Syslog UDP/TCP** — `ingest/syslogListener.js`, รองรับ source: `firewall`, `network`
3. **File batch** — `ingest/batchImporter.js` อ่าน `.json` จาก `samples/logs/`
   (ใช้ normalizer ชุดเดียวกับ HTTP endpoint)

## วิธีทดสอบ (หลัง Phase 6 มี DB จริงแล้ว)

```bash
# 1. ติดตั้ง deps
cd backend && npm install

# 2. รัน API server
npm start                     # POST /ingest ที่ :3000

# 3. รัน syslog listener (อีก terminal)
npm run ingest:syslog         # UDP+TCP ที่ :5514 (ดู .env)

# 4. ยิงตัวอย่าง syslog
../samples/send_syslog.sh udp 127.0.0.1 5514

# 5. ยิงตัวอย่าง JSON ผ่าน HTTP API
python3 ../samples/post_logs.py --url http://localhost:3000/ingest

# 6. หรือ import แบบ batch จากไฟล์ตรงๆ (ไม่ผ่าน HTTP)
npm run ingest:batch
```

## Known simplification: tenant สำหรับ syslog
Syslog message ดิบไม่มี field tenant ในตัว (ต่างจาก JSON sources) ในดีโม่นี้
เลย fix tenant ต่อ listener instance ผ่าน `SYSLOG_DEFAULT_TENANT` env var
ของจริงจะ map ด้วย source IP ของอุปกรณ์หรือ listener แยกต่อลูกค้า — ระบุไว้
ใน docs/architecture.md ด้วยเพื่อให้กรรมการเห็นว่าเป็นการตัดสินใจที่ตั้งใจ
ไม่ใช่ bug

## Normalizer mapping
| source | ไฟล์ | รับข้อมูลจาก |
|---|---|---|
| api | `backend/src/normalizers/api.js` | HTTP POST / batch file |
| crowdstrike | `backend/src/normalizers/crowdstrike.js` | HTTP POST / batch file |
| aws | `backend/src/normalizers/aws.js` | HTTP POST / batch file |
| m365 | `backend/src/normalizers/m365.js` | HTTP POST / batch file |
| ad | `backend/src/normalizers/ad.js` | HTTP POST / batch file |
| firewall | `backend/src/normalizers/firewall.js` | syslog listener |
| network | `backend/src/normalizers/network.js` | syslog listener |

ทุก normalizer คืน object รูปแบบเดียวกัน (ตรงกับ `logs` table columns) แล้ว
ส่งต่อให้ `backend/src/db.js#insertLog()` — ดูรายละเอียด column mapping ที่
`backend/db/README.md`

## Tested (Phase 2, ก่อนมี DB จริง)
รัน normalizer logic แบบ standalone (ไม่ต่อ DB) กับ sample data ทุกไฟล์ใน
`samples/logs/` และ `samples/syslog/` แล้ว ผลลัพธ์ normalize ถูกต้องตาม schema
กลาง — จะ verify แบบ end-to-end (มี DB จริง) อีกครั้งใน Phase 6 ตอนต่อ Docker
Compose
