export default () => ({
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.API_PORT ?? "4000", 10),
  globalPrefix: process.env.API_GLOBAL_PREFIX ?? "api",
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:3000")
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

  otp: {
    length: parseInt(process.env.OTP_LENGTH ?? "6", 10),
    ttlSeconds: parseInt(process.env.OTP_TTL_SECONDS ?? "300", 10),
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS ?? "5", 10),
    resendCooldownSeconds: parseInt(
      process.env.OTP_RESEND_COOLDOWN_SECONDS ?? "60",
      10,
    ),
    maxSendsPerHour: parseInt(process.env.OTP_MAX_SENDS_PER_HOUR ?? "5", 10),
  },

  login: {
    maxAttempts: parseInt(process.env.LOGIN_MAX_ATTEMPTS ?? "5", 10),
    lockoutMinutes: parseInt(process.env.LOGIN_LOCKOUT_MINUTES ?? "15", 10),
  },

  sms: {
    provider: process.env.SMS_PROVIDER ?? "twilio",
    devMode: process.env.SMS_DEV_MODE === "true",
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      fromNumber: process.env.TWILIO_FROM_NUMBER,
    },
  },
});
