# Staxa Demo API

A simple task management API built to demonstrate the [Staxa](https://staxa.dev) deployment platform.

## What This Demos

- **Express + PostgreSQL** deployed through Staxa's pipeline
- **Prisma ORM** for type-safe database access and migrations
- **Auto-migration** — the app syncs its schema on first boot via `prisma db push`
- **Health checks** — `/health` and `/health/ready` for Staxa's liveness/readiness probes
- **Database auto-provisioning** — toggle "Include a database" in Staxa's wizard and `DATABASE_URL` is injected automatically
- **Zero-config deployment** — Staxa detects Express, builds the Docker image, provisions Postgres, and connects them

## Deploy on Staxa

1. Push this repo to GitHub
2. In the Staxa dashboard, click **New Tenant**
3. Select **GitHub Repo** → pick this repo
4. Staxa auto-detects **Express (Node.js 20)**
5. Toggle **Include a database** → PostgreSQL 16
6. Click **Create Tenant & Deploy**
7. Watch the real-time build → your API is live in ~60 seconds

No `.env` file needed — Staxa handles `DATABASE_URL` automatically.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | API info |
| GET | `/health` | Basic health check |
| GET | `/health/ready` | Deep health check (includes DB) |
| GET | `/api/tasks` | List tasks (query: `?status=todo&limit=50`) |
| GET | `/api/tasks/:id` | Get single task |
| POST | `/api/tasks` | Create task (`{ title, description?, status? }`) |
| PATCH | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| PATCH | `/api/tasks/bulk/status` | Bulk status update (`{ ids, status }`) |

## Local Development

```bash
# Start a local Postgres
docker run -d --name pg -e POSTGRES_PASSWORD=pass -e POSTGRES_DB=staxa_demo -p 5432:5432 postgres:16-alpine

# Run the app
DATABASE_URL=postgres://postgres:pass@localhost:5432/staxa_demo npm run dev
```

## Testing

```bash
npm test
```

Tests use mocked Prisma client — no database required.
