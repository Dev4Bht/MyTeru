# DrukSave

**"Helping Bhutan Save Smarter."**

Bhutan's AI-powered personal financial companion — currently in **Phase 1**
of the build roadmap: foundation, database schema, and a complete Google
Sign-In authentication system. See [docs/PRD.md](./docs/PRD.md) for the full
product vision and [.claude plan](../../.claude/plans) for the phase
roadmap.

## Stack

- **Monorepo**: pnpm workspaces + Turborepo
- **Backend** (`apps/api`): NestJS, TypeScript, Prisma, PostgreSQL
- **Frontend** (`apps/web`): Next.js 15 (App Router), TypeScript, TailwindCSS,
  shadcn/ui
- **Auth**: Google Sign-In (Google Identity Services) — no passwords, no OTP/SMS
- **Shared** (`packages/`): `database` (Prisma client), `shared` (Zod
  schemas/types), `config` (tsconfig/eslint presets)

## Getting started

```bash
cp .env.example .env          # then set GOOGLE_CLIENT_ID + NEXT_PUBLIC_GOOGLE_CLIENT_ID (see below)
pnpm install
docker compose -f docker/docker-compose.yml up -d
pnpm --filter @druksave/database prisma:generate
pnpm --filter @druksave/database db:migrate
pnpm --filter @druksave/database db:seed
pnpm dev                      # runs apps/api and apps/web in parallel via Turborepo
```

- API: http://localhost:4000/api
- Swagger docs: http://localhost:4000/api/docs
- Web: http://localhost:3000
- Adminer (DB inspector): http://localhost:9091 (server: `postgres`, user/pass: `druksave`)

Note: the dev Postgres/Adminer containers are published on non-default host
ports (see `docker/docker-compose.yml`) to avoid clashing with other local
services on this machine.

### Google Sign-In setup (required to actually log in)

1. Go to [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
2. Create an **OAuth 2.0 Client ID** of type **Web application**
3. Under **Authorized JavaScript origins**, add `http://localhost:3000`
   (plus your deployed URL, once you have one)
4. Copy the client ID into `.env` as both `GOOGLE_CLIENT_ID` (used by the API
   to verify tokens) and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (used by the web app
   to render the Sign-In button)

Without this, the app still builds and runs, but the Sign-In button will
show a "not configured" error and the API will refuse Google login attempts.

Accounts are created automatically on first sign-in — there's no separate
signup step and nothing to seed for login; `db:seed` only populates the
shared system expense/income categories.

## Deployment

The primary deploy target is **Render** via `render.yaml` (a Blueprint
defining the API, the web app, and a managed Postgres database as one
unit) — see the Render dashboard's **New + → Blueprint** flow, pointing at
this repo. `netlify.toml` is also present as an alternative (wraps the
NestJS API as a single Netlify Function; connects to Netlify DB via a Neon
driver adapter instead of Postgres' native engine).

## Documentation

- [PRD](./docs/PRD.md)
- [Personas](./docs/personas.md)
- [User Stories](./docs/user-stories.md)
- [Information Architecture](./docs/information-architecture.md)
- [ER Diagram](./docs/er-diagram.md)
