# Sakal Maratha Matrimonial — Backend API

REST API for the [Sakal Maratha Matrimonial](../Matrimonial/sakal-maratha-matrimonial.html) frontend.

## Stack

- **Node.js 18+** with Express
- **PostgreSQL** (`pg`) — local or **Amazon RDS** in production
- **JWT** authentication (email or mobile + password)

## Deploy on AWS ECS + RDS

See **[DEPLOYMENT-ECS.md](./DEPLOYMENT-ECS.md)** for `DATABASE_URL`, security groups, and task definition env vars.

**Shared DB with Data-Dashboard:** If you change `user_admin_messages` (admin broadcast inbox), read **[../IMPORTANTREADME.md](../IMPORTANTREADME.md)** and keep `src/db/database.js` in sync with `Data-Dashboard/lambda/index.js`.

## Quick start

### Docker (recommended while AWS deploys)

Requires **Docker Desktop**. See **[LOCAL-DOCKER.md](./LOCAL-DOCKER.md)**.

```powershell
cd Matrimonial-Backend
docker compose up -d --build
# Frontend: cd ..\Matrimonial && npm run dev  →  http://localhost:5173
```

Or: `.\scripts\docker-up.ps1`

### Node only (no API container)

```bash
cd Matrimonial-Backend
cp .env.example .env
# Ensure PostgreSQL is running and database "matrimonial" exists
npm install
npm run dev
```

API base URL: `http://localhost:3001`

On first run, tables are created automatically. With `SEED_ON_STARTUP=true`, demo users are added (login: `priya.jadhav@example.com` / `demo1234`).

## API overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | — | Health check |
| GET | `/api/meta` | — | Districts, education, genders (for forms) |
| POST | `/api/auth/register` | — | Register user + matrimonial profile |
| POST | `/api/auth/login` | — | Login with email or mobile |
| GET | `/api/auth/me` | JWT | Current user + profile |
| GET | `/api/profiles/search` | optional | Search (matches frontend filters) |
| GET | `/api/profiles/featured` | — | Recently joined / featured |
| GET | `/api/profiles/:id` | optional | Profile detail |
| PUT | `/api/profiles/me` | JWT | Update own profile |
| POST | `/api/interests` | JWT | Express interest in a profile |
| GET | `/api/interests/sent` | JWT | Interests you sent |
| GET | `/api/interests/received` | JWT | Interests received |
| PATCH | `/api/interests/:id/respond` | JWT | Accept / decline |
| GET | `/api/stats` | — | Hero stats (profiles, matches) |
| GET | `/api/testimonials` | — | Success stories (`?lang=mr`) |
| POST | `/api/contact` | — | Contact / support message |

## Search (frontend-aligned)

`GET /api/profiles/search?gender=bride&ageFrom=21&ageTo=30&district=pune&education=eng&lang=en`

| Query | Values |
|-------|--------|
| `gender` | `bride`, `groom` |
| `ageFrom`, `ageTo` | 18–80 |
| `district` | `all`, `pune`, `mumbai`, `nashik`, `kolhapur`, `satara`, `sangli`, `aurangabad`, `nagpur` |
| `education` | `any`, `grad`, `pg`, `eng`, `med`, `mba` |
| `lang` | `en`, `mr` (subtitle formatting) |

## Register example

```json
POST /api/auth/register
{
  "fullName": "Adarsh Patil",
  "email": "adarsh@example.com",
  "mobile": "+919876543210",
  "password": "securepass",
  "gender": "groom",
  "age": 28,
  "district": "pune",
  "education": "BE Computer",
  "educationLevel": "eng",
  "occupation": "Software Developer",
  "kul": "Patil Kul"
}
```

## Login example

```json
POST /api/auth/login
{
  "identifier": "priya.jadhav@example.com",
  "password": "demo1234"
}
```

Response includes `data.token` — send as `Authorization: Bearer <token>`.

## Demo accounts (after seed)

| Email | Password |
|-------|----------|
| priya.jadhav@example.com | demo1234 |
| sneha.patil@example.com | demo1234 |
| anita.shinde@example.com | demo1234 |

## Connecting the HTML frontend

Add to your page script (or a separate `api.js`):

```javascript
const API_BASE = 'http://localhost:3001/api';

async function apiLogin(identifier, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  const json = await res.json();
  if (json.success) {
    localStorage.setItem('smm-token', json.data.token);
    localStorage.setItem('smm-session', '1');
  }
  return json;
}
```

Replace the fake `loginForm` submit handler to call `apiLogin` instead of only `enterMainSite()`.

## Environment

See `.env.example` for `PORT`, `JWT_SECRET`, `CORS_ORIGIN`, and `DATABASE_URL`.

## Project structure

```
src/
  index.js          # Entry + listen
  app.js            # Express app
  config.js
  seed.js           # Demo data
  db/database.js
  middleware/
  routes/
  utils/
# PostgreSQL — no local data folder; use DATABASE_URL
```
