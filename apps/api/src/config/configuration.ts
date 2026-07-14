export default () => ({
  nodeEnv: process.env.NODE_ENV ?? "development",
  // Render (and most PaaS hosts) assign the port to listen on via PORT;
  // API_PORT remains the override for local dev / other hosts.
  port: parseInt(process.env.PORT ?? process.env.API_PORT ?? "4000", 10),
  globalPrefix: process.env.API_GLOBAL_PREFIX ?? "api",
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:3300")
    .split(",")
    .map((origin) => origin.trim()),

  database: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessTtl: process.env.JWT_ACCESS_TTL ?? "15m",
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshTtl: process.env.JWT_REFRESH_TTL ?? "30d",
  },

  argon2: {
    memoryCost: parseInt(process.env.ARGON2_MEMORY_COST ?? "19456", 10),
    timeCost: parseInt(process.env.ARGON2_TIME_COST ?? "2", 10),
    parallelism: parseInt(process.env.ARGON2_PARALLELISM ?? "1", 10),
  },

  login: {
    maxAttempts: parseInt(process.env.LOGIN_MAX_ATTEMPTS ?? "5", 10),
    lockoutMinutes: parseInt(process.env.LOGIN_LOCKOUT_MINUTES ?? "15", 10),
  },
});
