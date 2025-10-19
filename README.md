# Smart Property Manager

Monorepo containing server (Express + MongoDB) and client (React + Vite + Tailwind).

## Run with Docker

```
docker compose up --build
```

- API: http://localhost:4000/api/health
- App: http://localhost:5173

Seed users (if you run manual seed below):
- admin@spm.test / admin123
- owner@spm.test / owner123
- tenant@spm.test / tenant123

## Manual Run

Server:
- cd server
- copy `.env` based on values in server/README.md
- npm i
- npm run seed
- npm run dev

Client:
- cd client
- create `.env` with `VITE_API_URL=http://localhost:4000/api`
- npm i
- npm run dev

## Notes
- Stripe payments are implemented with Payment Intents; webhook route is `/api/payments/webhook`.
- Image/document uploads: endpoint stubs can be added via `multer` (package installed); current UI expects URLs.
- Role-based access: ADMIN, OWNER, TENANT.

