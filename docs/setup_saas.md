# Setup: SaaS Mode (Cloud VM + HTTPS)

## 1. สร้าง VM บน Oracle Cloud Always Free (แนะนำ — ฟรีตลอดไป ไม่ใช่ trial)

1. สมัคร https://signup.oraclecloud.com (ต้องใช้บัตรเครดิตยืนยันตัวตน แต่
   จะไม่ถูกเรียกเก็บเงินถ้าใช้แค่ทรัพยากรใน Always Free tier)
2. สร้าง Compute Instance:
   - Image: **Ubuntu 22.04** (หรือ 24.04)
   - Shape: **VM.Standard.A1.Flex** (ARM, Always Free) — ตั้ง 2-4 OCPU / 8-24 GB RAM
   - ถ้าเจอ error **"Out of capacity"**: ลองเปลี่ยน Availability Domain หรือ
     เปลี่ยน region ไปที่ region ที่มีคนใช้น้อยกว่า (เช่น ap-osaka-1,
     ap-chuncheon-1 แทน region หลัก) แล้วลองใหม่อีกครั้ง — เป็นปัญหาที่พบบ่อย
     ของ tier นี้ ไม่ใช่ปัญหาที่ตั้งค่าผิด
3. เปิด Security List / Network Security Group ให้ inbound port:
   `22` (SSH), `80` (HTTP), `443` (HTTPS), `514` (syslog UDP/TCP)
4. จด Public IP ของ VM ไว้ (ใช้เป็น CN ตอนสร้าง TLS cert)

> ทางเลือกอื่น: DigitalOcean droplet ผ่าน GitHub Student Developer Pack
> (ถ้ามีอีเมลมหาวิทยาลัย/หลักฐานนักศึกษา) หรือ AWS/GCP free trial credit —
> ขั้นตอนติดตั้ง Docker + deploy ด้านล่างเหมือนกันทุก provider

## 2. ติดตั้ง Docker บน VM
```bash
ssh ubuntu@<vm-public-ip>
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
exit  # แล้ว ssh เข้าใหม่ให้ group มีผล
```

## 3. Clone repo + ตั้งค่า
```bash
git clone <your-repo-url>
cd log-management
cp .env.example .env
nano .env   # ตั้ง POSTGRES_PASSWORD, JWT_SECRET ใหม่ (อย่าใช้ค่า default ตอน deploy จริง)
```

## 4. สร้าง TLS cert (self-signed — โจทย์อนุญาตถ้าอธิบายขั้นตอนชัดเจน)
```bash
./deploy/certs/gen-cert.sh <vm-public-ip>
```
ได้ไฟล์ `deploy/certs/cert.pem` และ `deploy/certs/key.pem`

> ถ้ามีโดเมนจริงชี้มาที่ VM นี้ ใช้ Let's Encrypt/certbot แทนได้เพื่อไม่ให้
> browser เตือน — แต่สำหรับ demo self-signed ก็ผ่านเกณฑ์ตามที่โจทย์ระบุ

## 5. Deploy ด้วย TLS overlay
```bash
docker compose -f docker-compose.yml -f docker-compose.saas.yml up -d --build
```
(หรือ `make saas-up`)

## 6. สร้าง demo users
```bash
docker compose exec api node scripts/create_user.js --email admin@demoA.local --password <new-password> --role admin --tenant demoA
docker compose exec api node scripts/create_user.js --email viewer@demoA.local --password <new-password> --role viewer --tenant demoA
```

## 7. เข้าใช้งาน
`https://<vm-public-ip>` — browser จะเตือน "not secure" เพราะเป็น
self-signed cert (ตามที่คาดไว้) กด "Advanced → Proceed" เพื่อเข้าต่อ

## เทียบกับ Appliance mode
ใช้ docker-compose.yml ไฟล์เดียวกัน แค่เพิ่ม `docker-compose.saas.yml` เป็น
overlay ที่: (1) สลับ nginx config เป็นเวอร์ชัน HTTPS, (2) mount cert
directory เข้า container, (3) เปิด port 443 เพิ่ม — โค้ด backend/frontend
ตัวเดียวกันทั้งสองโหมด ไม่ต้องแก้อะไรเพิ่ม

## Troubleshooting
- **"Out of capacity" ตอนสร้าง Oracle VM**: เปลี่ยน region/AD แล้วลองใหม่
  (ดูหัวข้อ 1)
- **เข้า https:// ไม่ได้**: เช็คว่า Security List เปิด port 443 แล้ว และเช็ค
  `docker compose logs web` ว่า nginx start สำเร็จ (ถ้า cert path ผิดจะ
  fail ทันที)
- **syslog port 514 ใช้ไม่ได้**: เหมือน Appliance mode — ดู Troubleshooting
  ใน `docs/setup_appliance.md`
