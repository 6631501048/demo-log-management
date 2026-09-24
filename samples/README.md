# samples/

| ไฟล์ | ใช้ทำอะไร |
|---|---|
| `logs/*.json` | ตัวอย่าง log สำหรับ 5 source ที่ผ่าน JSON (api, crowdstrike, aws, m365, ad) — ใช้กับ batch import หรือ `post_logs.py` |
| `syslog/*.log` | ตัวอย่าง syslog ดิบ (firewall, network) — ใช้กับ `send_syslog.sh` |
| `send_syslog.sh` | ยิง `syslog/*.log` ไปที่ syslog listener ผ่าน UDP/TCP |
| `post_logs.py` | POST `logs/*.json` ทั้งหมดไปที่ `POST /ingest` |
| `postman_collection.json` | Postman/Insomnia collection — import แล้วมี login, ingest, search, dashboard, alerts request พร้อมใช้ |

## Quick test (หลัง `./run.sh` หรือ `make up`)
```bash
./samples/send_syslog.sh udp 127.0.0.1 514
python3 ./samples/post_logs.py --url http://localhost:3000/ingest
```

`samples/logs/ad_events.json` ตั้งใจใส่ failed-login 5 ครั้งจาก IP เดิมไว้
เพื่อ trigger alert rule ตัวอย่าง (`repeated_failed_login`) ได้ทันทีหลัง import
— ดู `docs/alerting.md`
