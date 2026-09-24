# tests/

ใช้ [Node.js built-in test runner](https://nodejs.org/api/test.html)
(`node --test`) — ไม่ต้องเพิ่ม dependency ใหม่ (Jest/Mocha ฯลฯ)

## รัน
```bash
cd backend && npm install   # ครั้งแรกเท่านั้น (express ต้องมีให้ rbac.test.js ใช้)
cd ..
npm test
```

## ไฟล์
| ไฟล์ | ทดสอบอะไร | จำนวนเคส |
|---|---|---|
| `normalizers.test.js` | normalizer ทั้ง 7 source (api, crowdstrike, aws, m365, ad, firewall, network) รวม syslog multi-word field parsing และ error case (unsupported source, missing tenant) | 9 |
| `auth.test.js` | bcrypt hash/verify, JWT sign/verify/reject | 4 |
| `rbac.test.js` | `requireAuth` + `requireRole` middleware ผ่าน HTTP request จริง (ไม่ mock) — no-token→401, valid→200, wrong-role→403, admin→200 | 4 |

**รวม 17 automated tests** — ทั้งหมด pass ก่อน commit ล่าสุด

## สิ่งที่ยังไม่ได้ automate (ต้องทดสอบมือ, ดู `docs/acceptance_checklist.md`)
Search/alert query logic ที่ต้องพึ่ง PostgreSQL จริง (normalizer + auth logic
แยกทดสอบได้โดยไม่ต้องมี DB แต่ SQL query เองต้อง integration test กับ DB
จริงหลัง deploy — ยังไม่มี test DB ใน environment ที่พัฒนา)
