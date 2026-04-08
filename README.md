# Task Manager

> 🌐 [Versión en español](./README.es.md)

A fullstack task management application where each user has their own private workspace to create, organize, and track tasks. Built as a technical assessment to demonstrate production-level decisions across the full stack — from API design to cloud deployment.

---

## Table of Contents

- [How it works (user perspective)](#how-it-works-user-perspective)
- [Tech stack](#tech-stack)
- [Architecture overview](#architecture-overview)
- [Project structure](#project-structure)
- [Running locally](#running-locally)
- [API reference](#api-reference)
- [Deployment on AWS](#deployment-on-aws)

---

## How it works (user perspective)

When you open the app you land on the login page. There's no registration flow — accounts are pre-seeded (see demo credentials below). You enter your email and password, hit **Sign in**, and you're in.

Once authenticated you see your personal task list. From there you can:

- **Create a task** by clicking the **New Task** button in the top right. A modal opens where you fill in the title (required), an optional description, status, priority, and an optional due date.
- **Edit a task** by clicking the **Edit** button on any row. The same modal opens pre-filled with the task's current values.
- **Delete a task** by clicking **Delete**. A confirmation prompt prevents accidental deletions.
- **Filter tasks** using the pill buttons below the header — you can narrow the list to *Pending*, *In Progress*, or *Completed* tasks. Switching filters is instant; the list updates without a full page reload.
- **Switch language** using the EN / ES toggle in the header. The app is fully translated into English and Spanish, and your preference is saved across sessions.

Every user's data is completely isolated — you can only see and manage tasks that belong to your account.

---

## Tech stack

| Layer       | Technology                                                         |
|-------------|--------------------------------------------------------------------|
| Frontend    | React 18, TypeScript, Vite 5, Tailwind CSS v3, React Query v5     |
| Backend     | NestJS, TypeScript, TypeORM, Passport JWT                          |
| Database    | SQLite 3 via `better-sqlite3`                                      |
| Auth        | JWT (HS256), bcrypt password hashing                               |
| Testing     | Vitest, React Testing Library                                      |
| Cloud       | AWS Elastic Beanstalk (API), S3 + CloudFront (frontend)            |

---

## Architecture overview

### Backend

The API follows a layered architecture — controllers handle HTTP concerns, services own business logic, and TypeORM repositories handle persistence. Nothing leaks across layers.

Authentication is stateless: on login the server returns a signed JWT (HS256, 7-day expiry) that the client stores in `localStorage` and attaches to every subsequent request via an `Authorization: Bearer` header. The NestJS JWT strategy validates the token and injects the user payload into the request context.

Schema changes go through versioned TypeORM migration files — `synchronize: false` is set in the TypeORM config so the database schema is never modified automatically at runtime.

Every task query includes a `WHERE owner_id = :userId` clause enforced at the service layer, so there's no possibility of cross-user data leakage even if a client sends a forged task ID.

### Frontend

State is split by concern:

- `AuthContext` owns the authentication state (current user, login, logout). It reads the token and user from `localStorage` on startup so sessions survive page refreshes.
- React Query owns all server state — task list, mutations (create, update, delete), caching, and background refetching. The cache has a 30-second stale time and refetches when the window regains focus.
- `LangContext` owns the UI language. It reads the saved locale from `localStorage` and exposes a typed `t()` function that components call to get translated strings. No external i18n library — the dictionary is a plain typed object.

Pages are thin coordinators. They wire context and hooks together but contain no business logic of their own.

### Cloud (AWS)

```
                    ┌──────────────────────────┐
                    │         Route 53          │
                    │   (optional custom domain)│
                    └───────────┬───────────────┘
                                │
              ┌─────────────────┴─────────────────┐
              │                                   │
   ┌──────────▼──────────┐           ┌────────────▼────────────┐
   │     CloudFront      │           │   Elastic Beanstalk     │
   │  (CDN + HTTPS/SSL)  │           │   (NestJS API, Node 20) │
   └──────────┬──────────┘           └────────────┬────────────┘
              │  /api/* behavior                  │
              │  proxied to EB origin             │
   ┌──────────▼──────────┐           ┌────────────▼────────────┐
   │     S3 Bucket       │           │      EC2 instance       │
   │  (React SPA dist)   │           │  /var/app/current/data  │
   └─────────────────────┘           │    tasks.db (SQLite)    │
                                     └─────────────────────────┘
```

CloudFront serves the static frontend and proxies `/api/*` requests to the Elastic Beanstalk origin. This means the browser always talks to a single HTTPS domain — no mixed content issues, no CORS configuration needed in production.

> **SQLite note**: works fine for single-instance deployments. If you need horizontal scaling, swap it for RDS PostgreSQL — only the TypeORM driver and connection string need to change.

---

## Project structure

```
task-manager/
├── backend/
│   ├── src/
│   │   ├── auth/          # JWT strategy, login endpoint
│   │   ├── tasks/         # Task CRUD, DTOs, entity
│   │   ├── users/         # User entity and service
│   │   └── database/      # Migrations and seed script
│   ├── .ebextensions/     # Elastic Beanstalk config
│   ├── .platform/         # Post-deploy hooks (migrate + seed)
│   └── Procfile
└── frontend/
    ├── src/
    │   ├── api/           # Axios client and per-resource modules
    │   ├── components/ui/ # Button, Badge, Input, Select, Modal, Spinner
    │   ├── context/       # AuthContext, LangContext
    │   ├── hooks/         # useTasks — queries and mutations
    │   ├── i18n/          # Translation dictionary (EN / ES)
    │   ├── pages/         # LoginPage, TaskListPage, TaskForm
    │   ├── test/          # Vitest + React Testing Library tests
    │   ├── types/         # Shared TypeScript types
    │   └── utils/         # Helpers, style maps, localStorage wrapper
    └── vite.config.ts
```

---

## Running locally

### Prerequisites

- Node.js >= 18
- npm >= 9

### Backend

```bash
cd backend
cp .env.example .env      # set JWT_SECRET to any long random string
npm install
npm run migration:run     # creates the users and tasks tables
npm run seed              # creates 3 demo users
npm run start:dev         # http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

The Vite dev server proxies all `/api` requests to `http://localhost:3000`, so no CORS configuration is needed during development.

### Demo credentials

| Name          | Email                   | Password  |
|---------------|-------------------------|-----------|
| Alice Johnson | alice@taskmanager.dev   | Alice123! |
| Bob Smith     | bob@taskmanager.dev     | Bob123!   |
| Carol White   | carol@taskmanager.dev   | Carol123! |

### Running tests

```bash
cd frontend
npm test               # run once
npm run test:watch     # watch mode (re-runs on file save)
npm run test:coverage  # with coverage report
```

---

## API reference

All task endpoints require `Authorization: Bearer <token>`.

| Method | Path                  | Description                      |
|--------|-----------------------|----------------------------------|
| POST   | `/api/auth/login`     | Login — returns `access_token`   |
| GET    | `/api/tasks`          | List tasks (optional `?status=`) |
| POST   | `/api/tasks`          | Create a task                    |
| PUT    | `/api/tasks/:id`      | Update a task                    |
| DELETE | `/api/tasks/:id`      | Delete a task                    |

**Login response:**
```json
{
  "access_token": "<jwt>",
  "user": {
    "id": "uuid",
    "name": "Alice Johnson",
    "email": "alice@taskmanager.dev"
  }
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
  "owner_id": "uuid",
  "created_at": "...",
  "updated_at": "..."
}
```

---

## Deployment on AWS

### Prerequisites

```bash
# AWS CLI v2
brew install awscli
aws configure   # Access Key ID, Secret, region (us-east-1), output: json

# EB CLI
pip install awsebcli

# Verify
aws sts get-caller-identity
eb --version
```

---

### Backend — Elastic Beanstalk

#### 1. Build

```bash
cd backend && npm ci && npm run build
```

#### 2. Initialise the EB application (first time only)

```bash
eb init task-manager --platform "Node.js 20" --region us-east-1
```

This creates `.elasticbeanstalk/config.yml` locally — it's gitignored, don't commit it.

#### 3. Create the environment

```bash
eb create task-manager-prod \
  --instance-type t3.micro \
  --single
```

#### 4. Set environment variables

```bash
eb setenv \
  JWT_SECRET="replace-with-a-long-random-secret-min-32-chars" \
  NODE_ENV="production" \
  PORT="8080"
```

#### 5. Deploy

```bash
eb deploy task-manager-prod
# or via the helper script:
EB_ENV=task-manager-prod ./scripts/deploy-backend.sh
```

#### 6. Verify

```bash
eb status
eb logs

curl -s -X POST https://<your-eb-url>/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@taskmanager.dev","password":"Alice123!"}'
```

#### How `.ebextensions` and `.platform` work

| File/Dir | Purpose |
|----------|---------|
| `.ebextensions/01_node.config` | Pins Node.js to v20, sets `NODE_ENV` and `PORT` |
| `.ebextensions/02_sqlite.config` | Creates the data directory and sets write permissions for the SQLite file |
| `.platform/hooks/postdeploy/01_migrate_and_seed.sh` | Runs migrations and seed after each deployment — using a post-deploy hook ensures the app bundle is fully in place before the script runs |

---

### Frontend — S3 + CloudFront

#### 1. Create the S3 bucket

```bash
aws s3 mb s3://task-manager-frontend-prod --region us-east-1

aws s3api put-public-access-block \
  --bucket task-manager-frontend-prod \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

#### 2. Create the CloudFront distribution

Go to **AWS Console → CloudFront → Create distribution**:

| Setting | Value |
|---------|-------|
| Origin domain | `task-manager-frontend-prod.s3.us-east-1.amazonaws.com` |
| Origin access | Origin Access Control (OAC) |
| Viewer protocol policy | Redirect HTTP to HTTPS |
| Default root object | `index.html` |
| Custom error response | 403 → `/index.html` with status 200 (required for SPA client-side routing) |

Add a second behavior for `/api/*` pointing to the Elastic Beanstalk origin with:
- Cache policy: CachingDisabled
- Origin request policy: AllViewerExceptHostHeader (forwards the `Authorization` header)

#### 3. Set the API URL for production

```bash
# frontend/.env.production
VITE_API_BASE_URL=https://<your-cloudfront-domain>
```

#### 4. Deploy

```bash
S3_BUCKET=task-manager-frontend-prod \
CF_DISTRIBUTION_ID=EXXXXXXXXX \
./scripts/deploy-frontend.sh
```

The script builds the app, syncs `dist/` to S3 (`Cache-Control: immutable` on hashed assets, `no-cache` on `index.html`), and invalidates the CloudFront distribution.

#### 5. Verify

```bash
aws cloudfront get-invalidation \
  --distribution-id EXXXXXXXXX \
  --id <invalidation-id>
```

---

### Re-deploying after changes

```bash
# Backend
EB_ENV=task-manager-prod ./scripts/deploy-backend.sh

# Frontend
S3_BUCKET=task-manager-frontend-prod \
CF_DISTRIBUTION_ID=EXXXXXXXXX \
./scripts/deploy-frontend.sh
```
