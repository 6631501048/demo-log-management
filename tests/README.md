# tests/

ใช้ [Node.js built-in test runner](https://nodejs.org/api/test.html)
(`node --test`) — ไม่ต้องเพิ่ม dependency test framework ใหม่ (Jest/Mocha ฯลฯ)
ทำงานได้เหมือนกันทุก OS (Windows/Mac/Linux)

## รัน (ครั้งแรก)
```bash
cd backend && npm install   # deps ของ backend
cd ../frontend && npm install  # ถ้าจะรัน frontend build ด้วย (ไม่บังคับสำหรับ test)
cd ..
npm install                 # deps ที่ repo root (มีแค่ express สำหรับ rbac.test.js)
npm test
```

## รัน (ครั้งต่อไป)
```bash
npm test   # รันจาก repo root เท่านั้น
```

## ไฟล์
| ไฟล์ | ทดสอบอะไร | จำนวนเคส |
|---|---|---|
| `normalizers.test.js` | normalizer ทั้ง 7 source (api, crowdstrike, aws, m365, ad, firewall, network) รวม syslog multi-word field parsing และ error case (unsupported source, missing tenant) | 9 |
| `auth.test.js` | bcrypt hash/verify, JWT sign/verify/reject | 4 |
| `rbac.test.js` | `requireAuth` + `requireRole` middleware ผ่าน HTTP request จริง (ไม่ mock) — no-token→401, valid→200, wrong-role→403, admin→200 | 4 |

**รวม 17 automated tests**

## สิ่งที่ยังไม่ได้ automate (ต้องทดสอบมือ, ดู `docs/testing_guide.md`)
Search/alert query logic ที่ต้องพึ่ง PostgreSQL จริง — normalizer + auth logic
แยกทดสอบได้โดยไม่ต้องมี DB แต่ SQL query เองต้อง integration test กับ DB
จริงหลัง deploy