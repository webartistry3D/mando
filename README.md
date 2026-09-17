# mando — Nigerian SME Operations

Sell → Invoice → Get Paid → Track Expenses → Deliver → Know Your Numbers

## Quick Start

```bash
# Install dependencies
npm install

# Start both API and frontend
npm run dev

# API only:  npm run dev:api    (port 3000)
# App only:  npm run dev:app    (port 5173)
```

## Environment

Copy `.env.example` to `.env` and fill in:

```
DATABASE_URL=postgresql://user:password@localhost:5432/mando
AUTH_SECRET=your-secret-key
GCS_PROJECT_ID=your-gcs-project
GCS_CLIENT_EMAIL=your-sa-email
GCS_PRIVATE_KEY=your-sa-private-key
GCS_BUCKET_NAME=your-bucket
VITE_API_URL=http://localhost:3000/api/v1
```

## Database

```bash
# Run migrations
npm run db:migrate

# Seed expense categories
npm run db:seed
```

## Architecture

- `/app` — Vite + React + TypeScript PWA (Tailwind + shadcn/ui)
- `/api` — Express + TypeScript + Prisma + PostgreSQL
- npm workspaces monorepo

## API Endpoints

All under `/api/v1/`:

- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- `GET/PATCH/DELETE /business`, `GET/PATCH /business/settings`, `GET/POST/PATCH/DELETE /business/members`, `POST /business/invite`
- `GET/POST/PATCH/DELETE /customers`, `GET /customers/:id/transactions`
- `GET/POST/PATCH/DELETE /products`, `GET /products/:id/inventory`
- `POST /inventory/stock-in`, `/stock-out`, `/adjustment`, `GET /inventory/transactions`
- `GET/POST/PATCH/DELETE /estimates`, `POST /estimates/:id/convert`
- `GET/POST/PATCH/DELETE /invoices`, `POST /invoices/:id/issue`
- `GET/POST/PATCH/DELETE /payments`
- `GET/POST/PATCH/DELETE /expenses`, `GET/POST /expenses/categories`
- `GET/POST/PATCH/DELETE /deliveries`
- `GET /sales/overview`
- `GET /dashboard/summary`, `GET /dashboard/activity`
- `GET /reports/sales`, `/expenses`, `/profit`, `/products`, `/customers`
- `GET/POST/DELETE /attachments`
- `GET/PATCH /notifications`, `POST /notifications/read-all`

## Deployment (Render)

1. Push to GitHub/GitLab
2. In Render dashboard: New → Blueprint → connect repo → deploy `render.yaml`
3. Set `CORS_ORIGIN` to your frontend URL, `VITE_API_URL` to your API URL
4. Run `npx prisma migrate deploy` on first deploy

## License

Proprietary — mando © 2026
