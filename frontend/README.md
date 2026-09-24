# Frontend — Phase 4

Vue 3 (Composition API) + Vite + Chart.js. No UI framework dependency —
hand-rolled dark theme in `src/style.css` to keep the bundle small.

## หน้าที่มี
- **Login** (`/login`) — POST `/auth/login`, เก็บ JWT ใน localStorage
- **Dashboard** (`/`) — FilterBar + 3 bar chart (Top IP / Top User / Top Event Type)
  + timeline line chart + log table, ทั้งหมดต่อกับ `GET /logs` และ `GET /logs/summary`
- **Alerts** (`/alerts`) — UI พร้อมแล้ว รอต่อ backend endpoint ใน Phase 5

## Auth flow
- Login สำเร็จ → เก็บ `{token, user}` ใน localStorage ผ่าน `src/store/auth.js`
- ทุก request ผ่าน `src/api.js` แนบ `Authorization: Bearer <token>` อัตโนมัติ
- ได้ 401 กลับมา (token หมดอายุ/ไม่ถูกต้อง) → เคลียร์ auth + เด้งกลับหน้า login อัตโนมัติ
- Route guard (`src/router.js`) กันหน้า Dashboard/Alerts ไม่ให้เข้าถ้ายัง login ไม่สำเร็จ

## รัน dev server
```bash
npm install
npm run dev          # http://localhost:5173, proxy /auth /logs /ingest -> :3000
```

## Build สำหรับ production
```bash
npm run build         # ได้ dist/ — เสิร์ฟผ่าน Nginx ใน docker-compose (Phase 6)
```

**ทดสอบแล้ว (Phase 4):** `npm run build` ผ่านสำเร็จ ไม่มี error ใน Vue components
ทั้ง 3 view + 4 component
