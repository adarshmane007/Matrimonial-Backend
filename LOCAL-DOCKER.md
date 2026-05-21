# Local Docker setup (Docker Desktop)

Runs **PostgreSQL** + **API** in containers. The **frontend** runs on your machine with Vite (port 5173).

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) running
- [Node.js 18+](https://nodejs.org/) (for the frontend only)

## 1. Start backend (Postgres + API)

```powershell
cd Matrimonial-Backend
docker compose up -d --build
```

Wait until healthy (about 30–60 seconds on first build):

```powershell
docker compose ps
curl http://localhost:3001/api/health
```

Or open in browser: http://localhost:3001/api/health

**Demo login** (seeded on first start): `priya.jadhav@example.com` / `demo1234`

## 2. Start frontend

```powershell
cd ..\Matrimonial
copy .env.example .env
npm install
npm run dev
```

Open http://localhost:5173 — login, register, biodata paste, search, etc.

## Useful commands

| Command | Purpose |
|---------|---------|
| `docker compose logs -f api` | API logs |
| `docker compose logs -f db` | Postgres logs |
| `docker compose down` | Stop containers (keeps DB volume) |
| `docker compose down -v` | Stop and **delete** database data |
| `docker compose up -d --build` | Rebuild API after code changes |

## Troubleshooting

- **Port 5432 in use** — Stop local PostgreSQL or change `db` ports in `docker-compose.yml` to `"5433:5432"` and use that port only if running API via `npm run dev` with a custom `DATABASE_URL`.
- **Port 3001 in use** — Stop other Node processes or change `api` ports to `"3002:3001"` and set `VITE_API_URL=http://localhost:3002` in `Matrimonial/.env`.
- **CORS errors** — Ensure `CORS_ORIGIN` in `docker-compose.yml` includes your Vite URL (`http://localhost:5173`).

## Without Docker (API only)

```powershell
cd Matrimonial-Backend
docker compose up -d db
cp .env.example .env
npm install
npm run dev
```

Uses Postgres in Docker and API via `npm run dev` on port 3001.
