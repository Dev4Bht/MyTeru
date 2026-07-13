import { PrismaClient } from "../generated/client";

export * from "../generated/client";

declare global {
  // eslint-disable-next-line no-var
  var __druksavePrisma: PrismaClient | undefined;
}

/**
 * On Netlify, the app runs as a stateless serverless function with no
 * bundled native Prisma query-engine binary, so it connects to Netlify DB
 * (Neon-backed Postgres) through Prisma's Neon driver adapter instead — a
 * pure-JS/WebSocket client with nothing native to bundle. Local dev (and
 * any other host) keeps using Prisma's standard native engine.
 */
export function createPrismaClientOptions(): ConstructorParameters<typeof PrismaClient>[0] {
  if (!process.env.NETLIFY) {
    return {};
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { neonConfig } = require("@neondatabase/serverless");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaNeon } = require("@prisma/adapter-neon");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getConnectionString } = require("@netlify/database");

  if (typeof WebSocket === "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    neonConfig.webSocketConstructor = require("ws");
  }

  const adapter = new PrismaNeon({ connectionString: getConnectionString() });
  return { adapter };
}

/**
 * Singleton PrismaClient. Reused across hot-reloads in dev (Next.js/Nest
 * watch mode) and across warm serverless invocations to avoid exhausting
 * the Postgres connection pool.
 */
export const prisma =
  global.__druksavePrisma ??
  new PrismaClient({
    ...createPrismaClientOptions(),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__druksavePrisma = prisma;
}
