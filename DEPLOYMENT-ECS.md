# Deploy on AWS ECS (PostgreSQL / RDS)

## Architecture

```
Internet → ALB → ECS Task (API) → Amazon RDS (PostgreSQL)
```

No EFS is required for the database. Tables are created automatically on startup.

---

## RDS setup (one-time)

1. Create **PostgreSQL** RDS in the **same VPC** as ECS.
2. Create database name, e.g. `matrimonial`.
3. Security group: allow ECS tasks → RDS on port **5432**.
4. Note the endpoint: `your-db.xxxx.region.rds.amazonaws.com`.

---

## ECS Task Definition — Environment variables

| Name | Value | Required? |
|------|--------|-------------|
| `PORT` | `3001` | Yes |
| `HOST` | `0.0.0.0` | Yes |
| `NODE_ENV` | `production` | Yes |
| `JWT_SECRET` | long random secret | Yes (use Secrets Manager) |
| `JWT_EXPIRES_IN` | `7d` | No |
| `CORS_ORIGIN` | `https://your-cloudfront-url` | Yes |
| `DATABASE_URL` | `postgresql://user:pass@endpoint:5432/matrimonial` | Yes |
| `SEED_ON_STARTUP` | `false` | Yes (prod) |
| `TRUST_PROXY` | `true` | Yes (behind ALB) |
| `DB_SSL` | `true` | Often yes for RDS |

### Example

```
PORT=3001
HOST=0.0.0.0
NODE_ENV=production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://d111111.cloudfront.net
DATABASE_URL=postgresql://appuser:SECRET@mydb.abc123.ap-south-1.rds.amazonaws.com:5432/matrimonial
SEED_ON_STARTUP=false
TRUST_PROXY=true
DB_SSL=true
```

Put `DATABASE_URL` and `JWT_SECRET` in **Secrets Manager** when possible.

**Remove** (no longer used): `DATABASE_PATH`, EFS volume for DB.

---

## ECS checklist

| Setting | Value |
|---------|--------|
| Container port | `3001` |
| Health check | `GET /api/health` |
| RDS SG | ECS → 5432 |

---

## First deploy

1. Empty RDS: set `SEED_ON_STARTUP=true` for **one** deploy only (demo users), then set back to `false`.
2. Or register users via the frontend / API.

Demo login after seed: `priya.jadhav@example.com` / `demo1234`

---

## Local development

```bash
# Create DB locally (psql or Docker)
createdb matrimonial

cp .env.example .env
# Edit DATABASE_URL if needed
npm install
npm run dev
```

---

## GitHub deploy

See [`.deploy/README.md`](./.deploy/README.md) — workflow updates ECS image only; env vars stay in the task definition.
