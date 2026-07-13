# DrukSave

**"Helping Bhutan Save Smarter."**

Bhutan's AI-powered personal financial companion — currently in **Phase 1**
of the build roadmap: foundation, database schema, and a complete phone+OTP
authentication system. See [docs/PRD.md](./docs/PRD.md) for the full product
vision and [.claude plan](../../.claude/plans) for the phase roadmap.

## Stack

- **Monorepo**: pnpm workspaces + Turborepo
- **Backend** (`apps/api`): NestJS, TypeScript, Prisma, PostgreSQL
- **Frontend** (`apps/web`): Next.js 15 (App Router), TypeScript, TailwindCSS,
  shadcn/ui
- **Shared** (`packages/`): `database` (Prisma client), `shared` (Zod
  schemas/types), `config` (tsconfig/eslint presets)

## Getting started

```bash
cp .env.example .env          # fill in secrets before running in anything but dev
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

Seeded dev users (password `DrukSave@123` for all): `+97517123456` (Tashi
Dema, government employee), `+97517654321` (Karma Wangdi, taxi driver),
`+97517000000` (admin).

## Documentation

- [PRD](./docs/PRD.md)
- [Personas](./docs/personas.md)
- [User Stories](./docs/user-stories.md)
- [Information Architecture](./docs/information-architecture.md)
- [ER Diagram](./docs/er-diagram.md)
