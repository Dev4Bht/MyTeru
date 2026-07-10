import { PrismaClient } from "../generated/client";

export * from "../generated/client";

declare global {
  // eslint-disable-next-line no-var
  var __druksavePrisma: PrismaClient | undefined;
}

/**
 * Singleton PrismaClient. Reused across hot-reloads in dev (Next.js/Nest
 * watch mode) to avoid exhausting the Postgres connection pool.
 */
export const prisma =
  global.__druksavePrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__druksavePrisma = prisma;
}
