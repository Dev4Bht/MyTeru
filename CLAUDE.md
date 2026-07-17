# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

This is a pnpm workspaces + Turborepo monorepo. Run everything from the repo root unless noted.

```bash
pnpm install                  # install all workspace deps
pnpm dev                      # runs apps/api (port 4000) and apps/web (port 3300) in parallel

pnpm build                    # turbo build, all packages (respects dependency graph)
pnpm typecheck                # turbo typecheck, all packages
pnpm lint                     # turbo lint, all packages
pnpm test                     # turbo test (jest unit tests), all packages
pnpm test:e2e                 # turbo test:e2e (apps/api only has e2e specs)
```

Scope any of the above to one workspace with `--filter`, e.g. `pnpm --filter @druksave/api test`.

Run a single test file directly (faster than going through turbo):

```bash
cd apps/api && pnpm exec jest src/modules/auth/auth.service.spec.ts
cd apps/web && pnpm exec jest src/components/auth/__tests__/auth-form.test.tsx
```

Database (from repo root, needs `packages/database`'s Prisma schema and a running Postgres):

```bash
pnpm --filter @druksave/database prisma:generate   # regenerate Prisma client after schema.prisma changes
pnpm --filter @druksave/database db:migrate         # create + apply a new dev migration
pnpm --filter @druksave/database db:migrate:deploy  # apply pending migrations, no new migration (used in prod)
pnpm --filter @druksave/database db:seed            # seed shared system categories
pnpm --filter @druksave/database db:studio          # Prisma Studio
```

Local dev infra: `docker compose -f docker/docker-compose.yml up -d` starts Postgres on port **5433** (not 5432) and Adminer on **9091** — non-default ports specifically to avoid clashing with other local services. Web dev server is pinned to port **3300** (not 3000) for the same reason.

After changing `packages/shared` (zod schemas/types consumed by both apps), rebuild it before typechecking the apps that import it: `pnpm --filter @druksave/shared build`.

## Architecture

**Monorepo layout**: `apps/api` (NestJS), `apps/web` (Next.js 15 App Router), `packages/database` (Prisma schema + generated client, package name `@druksave/database`), `packages/shared` (zod schemas + inferred TS types shared by both apps, package name `@druksave/shared`).

**Prisma schema is ahead of the API**: `packages/database/prisma/schema.prisma` defines the full product surface (money domain, goals, AI/insights, notifications, reports) up front so later phases are additive migrations, not schema fights. Several models (`Analytics`, `Insight`, `AiPrediction`, `Notification`, `Report`) exist in the schema with no corresponding API module yet — don't assume a model has an endpoint just because it's in the schema; check `apps/api/src/modules/`.

**Table name mapping gotcha**: every Prisma model maps to a lowercase/pluralized table via `@@map(...)` (e.g. `User` → `"users"`, `RecurringTransaction` → `"recurring_transactions"`). Any raw SQL (`$queryRaw`/`$executeRaw`) must reference the mapped name, not the PascalCase model name — this has been a real source of runtime-only bugs (Prisma's typed query builder catches nothing here; it only breaks at query time).

**Every API DTO exists twice**: a zod schema in `packages/shared/src/schemas/*.schema.ts` (used by web forms via `zodResolver`, also the source of the inferred `CreateXDto`/`UpdateXDto` TS types used on both sides), and a hand-written `class-validator` DTO class in `apps/api/src/modules/*/dto/*.dto.ts` (used by Nest's `ValidationPipe`, which runs with `whitelist: true, forbidNonWhitelisted: true, transform: true`). These two are not derived from each other — keep them in sync manually when changing a shape. A field that's genuinely optional in both must be `@IsOptional()` on the Nest side *and* handled by the caller so an empty string never gets sent for a `@IsDateString()` field (class-validator's `@IsOptional()` only skips `undefined`, not `""`).

**Auth**: email + password only (no OAuth). Argon2id hashing (cost params in `configuration.ts` → `ARGON2_*` env vars). Access tokens are short-lived JWTs; refresh tokens are opaque, hashed at rest, and rotated on every use (`SessionsService`). `AuthService.login` runs an Argon2 verify against a fixed dummy hash even for an unknown email specifically to keep timing indistinguishable from a wrong-password response (prevents email enumeration) — preserve that ordering (dummy-verify before the `!user` throw) if you touch this method, and check account lockout (`user.lockedUntil`) *before* verifying the real password hash, not after, or a malformed hash on a locked account throws instead of returning a clean 403. Failed-login counting (`UsersService.recordFailedLogin`) uses a single atomic raw SQL `UPDATE` (increment + conditional lockout in one statement) to avoid a check-then-act race between concurrent attempts.

**Auth token flow web ↔ api**: the browser never calls the NestJS API directly for login/signup/refresh/logout — it calls Next.js route handlers under `apps/web/src/app/api/auth/*`, which server-side proxy to the API via `lib/server/api-proxy.ts`'s `callApi()`. The refresh token is set as an httpOnly cookie by `lib/server/auth-cookie.ts` and is never readable from browser JS; the access token lives only in the Zustand store (`lib/auth-store.ts`, in-memory, not persisted) and is re-derived on page load by `hydrateSession()` calling `/api/auth/refresh`. Every other authenticated API call (transactions, budgets, goals, etc.) *does* go straight from the browser to the NestJS API (`lib/api-client.ts`'s `apiFetch`), attaching the in-memory access token as a Bearer header, with a one-shot silent refresh-and-retry on a 401.

**Recurring transactions are a real scheduler, not just templates**: `RecurringTransactionsService` has an `@Cron(CronExpression.EVERY_HOUR)` job (`processDue`) that materializes any `RecurringTransaction` whose `nextRunAt` has passed into an actual `Transaction` row, catching up on missed cycles (capped) if the process was down. Creating or reactivating a recurring template also calls `materializeNow()` immediately so the first occurrence doesn't wait for the next hourly tick.

**Budgets are plan-based, not per-line CRUD**: there's no `POST /budgets` for a single line. The whole feature is built around `GET/POST /budgets/plan` — one bulk endpoint that takes an `income[]` and `allocations[]` array, finds-or-creates a `Category` per line (by name if no `categoryId` given), upserts a `Budget` row per line (period `MONTHLY`, evergreen — `endDate: null`), and optionally creates/pauses a matching `RecurringTransaction` per the line's `autoPost` flag (so e.g. rent can auto-post monthly while a discretionary "outing" allocation stays a plain tracked limit). `BudgetsService.getPlan` computes actuals via a single `groupBy` against `Transaction`, not per-line queries.

**Frontend shell**: `components/dashboard/dashboard-shell.tsx` renders a bottom tab bar on mobile and a left sidebar on desktop from the same `NAV_LINKS` array — pages under `app/dashboard/*` render only their content, not their own nav. Less-frequently-used destinations (Categories) are deliberately kept off the primary tab bar and linked to from context instead (e.g. a "Manage categories" link on the budget page) rather than crowding five-plus tabs.

**Design system**: `components/ui/*` are shadcn/ui-style primitives (Radix + `class-variance-authority` + Tailwind), themed around a Bhutanese saffron/maroon palette defined as CSS custom properties in `app/globals.css` (not Tailwind's default palette) — extend the theme via those tokens, not by hardcoding colors.

**Deployment**: primary target is Render, driven entirely by `render.yaml` (a Blueprint provisioning `druksave-db` + `druksave-api` + `druksave-web` as one unit — use Render's **New + → Blueprint** flow pointing at this repo, not the generic "New Web Service" wizard, which won't pick up build/start commands, region, or env vars from the file). Both Render services are on the free plan, which sleeps after inactivity and cold-starts (tens of seconds) on the next request — `lib/server/api-proxy.ts`'s `callApi()` has a bounded timeout and returns a real "server is starting up" message for this case rather than letting it surface as an opaque failure.

`netlify.toml` is a secondary/alternative target: `apps/api/netlify/functions/nest-api.ts` wraps the same NestJS app (unchanged — same controllers/guards/pipes) as a single Netlify Function via `serverless-http`, caching the bootstrapped app across warm invocations. `esbuild` bundles the function and statically resolves every `require()`, so `@nestjs/microservices`, `@nestjs/websockets/socket-module`, and `argon2` (native binary) are listed under `external_node_modules` even though they're not really used at runtime — leaving them out of that list breaks the build. The two deploy paths are independent; changes to one don't need the other kept in sync unless you're actively using it.
