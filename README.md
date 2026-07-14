# DrukSave

**"Helping Bhutan Save Smarter."**

Bhutan's AI-powered personal financial companion — currently in **Phase 1**
of the build roadmap: foundation, database schema, and a complete
email/password authentication system. See [docs/PRD.md](./docs/PRD.md) for
the full product vision and [.claude plan](../../.claude/plans) for the
phase roadmap.

## Stack

- **Monorepo**: pnpm workspaces + Turborepo
- **Backend** (`apps/api`): NestJS, TypeScript, Prisma, PostgreSQL
- **Frontend** (`apps/web`): Next.js 15 (App Router), TypeScript, TailwindCSS,
  shadcn/ui
- **Auth**: email + password (Argon2id hashing), JWT access tokens + rotated
  refresh tokens
- **Shared** (`packages/`): `database` (Prisma client), `shared` (Zod
  schemas/types), `config` (tsconfig/eslint presets)

## Getting started

```bash
cp .env.example .env
pnpm install
docker compose -f docker/docker-compose.yml up -d
pnpm --filter @druksave/database prisma:generate
pnpm --filter @druksave/database db:migrate
pnpm --filter @druksave/database db:seed
pnpm dev                      # runs apps/api and apps/web in parallel via Turborepo
```

- API: http://localhost:4000/api
- Swagger docs: http://localhost:4000/api/docs
- Web: http://localhost:3300
- Adminer (DB inspector): http://localhost:9091 (server: `postgres`, user/pass: `druksave`)

Note: the dev Postgres/Adminer containers are published on non-default host
ports (see `docker/docker-compose.yml`) to avoid clashing with other local
services on this machine.

Sign up for an account from the web app's login page (toggle to "Create an
account") — there's nothing to pre-seed for auth; `db:seed` only populates
the shared system expense/income categories.

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
