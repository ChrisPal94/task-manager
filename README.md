# Task Manager

A fullstack task management application built with NestJS, React, and SQLite. Supports authentication, per-user task isolation, status/priority filtering, and a clean REST API.

## Tech Stack

| Layer     | Technology                                       |
|-----------|--------------------------------------------------|
| Frontend  | React 18, TypeScript, Vite 5, Tailwind CSS v3    |
| Backend   | NestJS, TypeScript, TypeORM, Passport JWT        |
| Database  | SQLite 3 via `better-sqlite3`                    |
| Auth      | JWT (HS256), bcrypt password hashing             |

## Features

- Email + password login with JWT
- Per-user task isolation (tasks are private to each user)
- Full CRUD: create, read, update, delete tasks
- Filter tasks by status (`pending`, `in_progress`, `completed`)
- Filter tasks by priority (`low`, `medium`, `high`)
- Optional due date per task
- Request cancellation via `AbortController` — no stale fetch race conditions
- Strict TypeScript throughout (`strict: true`)

## Project Structure

```
task-manager/
├── backend/               # NestJS API
│   ├── src/
│   │   ├── auth/          # JWT strategy, login endpoint
│   │   ├── tasks/         # Tasks CRUD + DTOs
│   │   ├── users/         # User entity + service
│   │   ├── common/        # Guards, interfaces
│   │   └── database/      # Migrations + seed script
│   └── .env
└── frontend/              # React SPA
    ├── src/
    │   ├── api/           # Axios client + per-resource modules
    │   ├── components/ui/ # Button, Badge, Input, Select, Modal, Spinner
    │   ├── context/       # AuthContext (login/logout state)
    │   ├── hooks/         # useTasks (data + mutations)
    │   ├── pages/         # LoginPage, TaskListPage, TaskForm
    │   ├── types/         # Shared TypeScript types
    │   └── utils/         # Helpers, style maps, storage wrapper
    └── vite.config.ts
```

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9

### Backend

```bash
cd backend
cp .env.example .env      # set JWT_SECRET to any long random string
npm install
npm run migration:run     # creates users + tasks tables
npm run seed              # creates 3 demo users
npm run start:dev         # http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

The Vite dev server proxies all `/api` requests to `http://localhost:3000`, so no CORS config needed in development.

### Demo Credentials

| Name          | Email                       | Password   |
|---------------|-----------------------------|------------|
| Alice Johnson | alice@taskmanager.dev       | Alice123!  |
| Bob Smith     | bob@taskmanager.dev         | Bob123!    |
| Carol White   | carol@taskmanager.dev       | Carol123!  |

## API Reference

All task endpoints require `Authorization: Bearer <token>`.

| Method | Path                        | Description                       |
|--------|-----------------------------|-----------------------------------|
| POST   | `/api/auth/login`           | Login — returns `access_token`    |
| GET    | `/api/tasks`                | List tasks (optional `?status=`)  |
| POST   | `/api/tasks`                | Create a task                     |
| PUT    | `/api/tasks/:id`            | Update a task                     |
| DELETE | `/api/tasks/:id`            | Delete a task                     |

**Login response:**
```json
{
  "access_token": "<jwt>",
  "user": { "id": "...", "name": "Alice Johnson", "email": "alice@taskmanager.dev" }
}
```

**Task object:**
```json
{
  "id": "uuid",
  "title": "My task",
  "description": "Optional details",
  "status": "pending | in_progress | completed",
  "priority": "low | medium | high",
  "due_date": "2026-04-30T00:00:00.000Z | null",
  "created_at": "...",
  "updated_at": "...",
  "owner_id": "uuid"
}
```

## Architecture Notes

### Backend

- **Hexagonal-ish layering**: controllers handle HTTP concerns, services own business logic, TypeORM repositories handle persistence. No logic leaks across layers.
- **JWT auth**: stateless, HS256, 7-day expiry. The strategy validates the token and attaches the payload to `req.user`.
- **Migrations over sync**: `synchronize: false` in production config — schema changes go through versioned migration files, not auto-sync.
- **Per-user isolation**: every task query includes `WHERE owner_id = :userId` — no cross-user data leakage.

### Frontend

- **Context + hook separation**: `AuthContext` owns auth state (user, login, logout). `useTasksQuery` / `useCreateTask` / `useUpdateTask` / `useDeleteTask` own data fetching and mutations via React Query. Pages are purely presentational coordinators.
- **React Query**: cache with 30 s stale time, optimistic updates on edit/delete with automatic rollback on error, background refetch on window focus.
- **Path aliases**: `@/` maps to `src/` — no `../../` relative hell.
- **Tailwind custom colors**: `brand-*` color scale defined in `tailwind.config.js` for consistent branding without hardcoded hex values.

## Deployment on AWS

### Architecture

```
                    ┌─────────────────────────────┐
                    │         Route 53             │
                    │   (optional custom domain)   │
                    └────────────┬────────────────-┘
                                 │
              ┌──────────────────┴──────────────────┐
              │                                     │
   ┌──────────▼──────────┐             ┌────────────▼────────────┐
   │     CloudFront      │             │   Elastic Beanstalk     │
   │  (CDN + HTTPS/SSL)  │             │   (NestJS API, Node 20) │
   └──────────┬──────────┘             └────────────┬────────────┘
              │                                     │
   ┌──────────▼──────────┐             ┌────────────▼────────────┐
   │       S3 Bucket     │             │    EC2 instance         │
   │   (React SPA dist)  │             │  /var/app/current/data  │
   └─────────────────────┘             │    tasks.db (SQLite)    │
                                       └─────────────────────────┘
```

> **SQLite note**: SQLite works for single-instance deployments. If you need
> horizontal scaling, replace it with RDS PostgreSQL — the TypeORM config only
> requires changing the driver and connection string.

---

### Prerequisites

```bash
# AWS CLI v2
brew install awscli
aws configure   # enter Access Key ID, Secret, region (e.g. us-east-1), output: json

# EB CLI
pip install awsebcli

# Verify
aws sts get-caller-identity
eb --version
```

---

### Backend — Elastic Beanstalk

#### 1. Build the app

```bash
cd backend
npm ci
npm run build
# Output: dist/
```

#### 2. Initialise the EB application (first time only)

```bash
cd backend
eb init task-manager --platform "Node.js 20" --region us-east-1
# When asked "Do you want to set up SSH?": Yes (optional but recommended)
```

This creates a `.elasticbeanstalk/config.yml` locally. It is gitignored by default — do not commit it.

#### 3. Create the environment

```bash
eb create task-manager-prod \
  --instance-type t3.micro \
  --single                    # single instance (no load balancer) — cheapest option
```

#### 4. Set environment variables

```bash
eb setenv \
  JWT_SECRET="replace-with-a-long-random-secret-min-32-chars" \
  NODE_ENV="production" \
  PORT="8080"
```

> Never commit `.env` to the repo. EB environment variables are injected at runtime and encrypted at rest.

#### 5. Deploy

```bash
eb deploy task-manager-prod
```

Or use the helper script (also runs `npm run build` first):

```bash
EB_ENV=task-manager-prod ./scripts/deploy-backend.sh
```

#### 6. Verify

```bash
eb status          # shows environment URL and health
eb logs            # tail the last 100 lines
```

Test the live endpoint:

```bash
curl -s -X POST https://<your-eb-url>/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@taskmanager.dev","password":"Alice123!"}'
```

#### How `.ebextensions` works

The `backend/.ebextensions/` directory contains three config files that EB applies in alphabetical order on every deployment:

| File | Purpose |
|---|---|
| `01_node.config` | Pins Node.js to v20, sets `NODE_ENV` and `PORT` |
| `02_sqlite.config` | Creates `/var/app/current/data/` and sets ownership so the app can write the SQLite file |
| `03_migrate.config` | Runs `typeorm migration:run` automatically after the new bundle is installed (`leader_only: true` ensures it only runs once on multi-instance setups) |

---

### Frontend — S3 + CloudFront

#### 1. Create the S3 bucket

```bash
aws s3 mb s3://task-manager-frontend-prod --region us-east-1

# Block all public access (CloudFront will serve the files, not S3 directly)
aws s3api put-public-access-block \
  --bucket task-manager-frontend-prod \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

#### 2. Create the CloudFront distribution

Go to **AWS Console → CloudFront → Create distribution** and configure:

| Setting | Value |
|---|---|
| Origin domain | `task-manager-frontend-prod.s3.us-east-1.amazonaws.com` |
| Origin access | **Origin Access Control (OAC)** — let CloudFront access S3 privately |
| Viewer protocol policy | Redirect HTTP to HTTPS |
| Default root object | `index.html` |
| Custom error response | 403 → `/index.html` with status 200 (required for SPA routing) |

After creating, copy the **bucket policy** CloudFront generates and apply it to the S3 bucket:

```bash
aws s3api put-bucket-policy \
  --bucket task-manager-frontend-prod \
  --policy file://cloudfront-bucket-policy.json
```

#### 3. Set the API URL for production

In `frontend/vite.config.ts`, the `/api` proxy only works in development. For production, the built assets need to know the backend URL. Add it as an environment variable:

```bash
# frontend/.env.production
VITE_API_BASE_URL=https://<your-eb-url>
```

And update `frontend/src/api/http.ts`:

```ts
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  // ...
})
```

#### 4. Deploy

```bash
S3_BUCKET=task-manager-frontend-prod \
CF_DISTRIBUTION_ID=EXXXXXXXXX \
./scripts/deploy-frontend.sh
```

The script:
1. Runs `npm run build`
2. Syncs `dist/` to S3 with `Cache-Control: immutable` for hashed assets
3. Sets `Cache-Control: no-cache` on `index.html` specifically (so browsers always fetch the latest entry point)
4. Creates a CloudFront invalidation for `/*`

#### 5. Verify

```bash
# Check invalidation status
aws cloudfront get-invalidation \
  --distribution-id EXXXXXXXXX \
  --id <invalidation-id>

# App should be live at:
# https://<cloudfront-domain>.cloudfront.net
```

---

### Re-deploying after changes

```bash
# Backend only
EB_ENV=task-manager-prod ./scripts/deploy-backend.sh

# Frontend only
S3_BUCKET=task-manager-frontend-prod \
CF_DISTRIBUTION_ID=EXXXXXXXXX \
./scripts/deploy-frontend.sh
```
