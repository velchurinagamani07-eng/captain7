# Captain 7 Eat & Play

Premium sports, dining, party, and franchise platform for Captain 7 Eat & Play in Narasaraopet.

## Stack

- React 18 + Vite
- Tailwind CSS
- React Router v6
- Framer Motion
- React Hook Form + Yup
- Firebase Auth and Firestore-ready hooks
- Render Express backend for Razorpay, notifications, analytics, and health checks
- Recharts, Swiper, React Icons, and Lucide icons

## Local Development

```bash
npm install
npm run dev
```

Run the backend separately when testing live payment APIs:

```bash
npm run server:dev
```

The app runs with local demo fallbacks where practical. Add values from `.env.example` to `client/.env` and `server/.env` to enable Firebase Auth, Firestore, Razorpay, ImgBB, and backend APIs.

## Main Routes

- `/`
- `/cricket-booking`
- `/food-menu`
- `/party-packages`
- `/gallery`
- `/contact`
- `/franchise`
- `/dashboard`
- `/admin/login`
- `/admin`

## Render API

- `GET /api/health`
- `POST /api/payments/create-order`
- `POST /api/payments/verify`
- `POST /api/notifications/whatsapp`
- `GET /api/analytics/summary`

The old `/api` folder is kept as a compatibility fallback. Production backend deployment should use the `/server` Render app.

## Firebase

Rules are in `firestore.rules`. Seed scripts are available:

```bash
npm run seed:menu
npm run seed:slots
ADMIN_EMAIL=admin@example.com npm run set-admin
```
