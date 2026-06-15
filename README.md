# VinFast Auto Customer MFE

Frontend khach hang cho he thong VinFast ecommerce: xem xe, dang ky/dang nhap, OTP Telegram, dat coc, thanh toan, lich lai thu, don hang, bao duong, profile va notification.

## Yeu Cau

- Node.js 20+ khuyen dung
- npm
- Backend `vinfastauto` dang chay

## Cai Dat

```bash
cd vinfastauto_mfe
npm ci
```

Neu khong co `package-lock.json` phu hop, co the dung:

```bash
npm install
```

## Cau Hinh Moi Truong

Tao file `.env` trong thu muc `vinfastauto_mfe`:

```env
VITE_API_DOMAIN=http://localhost:8080/api/v1
VITE_ENABLE_DEBUG=true
```

Production vi du:

```env
VITE_API_DOMAIN=https://api.project-vinstore.online/api/v1
VITE_ENABLE_DEBUG=false
```

Khong commit `.env`.

## Chay Local

```bash
npm run dev
```

Mac dinh Vite chay tai:

```text
http://localhost:5173
```

## Build Va Preview

Kiem tra lint:

```bash
npm run lint
```

Build production:

```bash
npm run build
```

Preview ban build:

```bash
npm run preview
```

## Ket Noi Backend

Backend mac dinh:

```text
http://localhost:8080/api/v1
```

Neu app khong load du lieu, kiem tra:

- backend da chay chua
- `VITE_API_DOMAIN` co kem `/api/v1` chua
- browser console co loi CORS/network khong
- endpoint payment return cua VNPay co tro ve `http://localhost:5173/payment-result` khi chay local khong

## Ghi Chu

- Source chinh nam trong `src/pages`, `src/components`, `src/services`, `src/context`, `src/types`.
- File cau hinh API nam tai `src/config/enviroment.ts`.
- Khong dua token, password, secret hoac endpoint production rieng tu vao source code.
