import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/database/prisma.service";
import { SMS_PROVIDER, SmsProvider } from "../src/modules/sms/sms-provider.interface";

/**
 * Full auth flow against a real Postgres + Redis (docker-compose services).
 * Run `docker compose -f docker/docker-compose.yml up -d` and apply
 * migrations before running `pnpm test:e2e`.
 */
class CapturingSmsProvider implements SmsProvider {
  public messages: { to: string; message: string }[] = [];

  async send(to: string, message: string) {
    this.messages.push({ to, message });
    return { success: true, providerMessageId: "e2e-fake" };
  }

  lastCodeFor(to: string): string {
    const entry = [...this.messages].reverse().find((m) => m.to === to);
    if (!entry) throw new Error(`No SMS captured for ${to}`);
    const match = /\d{6}/.exec(entry.message);
    if (!match) throw new Error(`No 6-digit code found in message: ${entry.message}`);
    return match[0];
  }
}

describe("Auth flow (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let sms: CapturingSmsProvider;

  const phone = "+97517000111";
  const deviceId = "e2e-device-1";
  const password = "SecurePass123";

  beforeAll(async () => {
    sms = new CapturingSmsProvider();

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SMS_PROVIDER)
      .useValue(sms)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.user.deleteMany({ where: { phone } });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { phone } });
    await app.close();
  });

  it("completes signup -> OTP verify -> refresh rotation -> logout -> revoked refresh", async () => {
    const signupRes = await request(app.getHttpServer())
      .post("/api/auth/signup")
      .send({ fullName: "E2E Tester", phone, password, confirmPassword: password, deviceId })
      .expect(201);

    expect(signupRes.body.purpose).toBe("SIGNUP");

    const signupCode = sms.lastCodeFor(phone);

    const verifyRes = await request(app.getHttpServer())
      .post("/api/auth/otp/verify")
      .send({ phone, code: signupCode, purpose: "SIGNUP", deviceId })
      .expect(201);

    expect(verifyRes.body.user.phone).toBe(phone);
    expect(verifyRes.body.tokens.accessToken).toBeDefined();
    const firstRefreshToken = verifyRes.body.tokens.refreshToken;

    const refreshRes = await request(app.getHttpServer())
      .post("/api/auth/refresh")
      .send({ refreshToken: firstRefreshToken })
      .expect(201);

    const rotatedRefreshToken = refreshRes.body.tokens.refreshToken;
    expect(rotatedRefreshToken).toBeDefined();
    expect(rotatedRefreshToken).not.toBe(firstRefreshToken);

    // The original (pre-rotation) refresh token must now be unusable.
    await request(app.getHttpServer())
      .post("/api/auth/refresh")
      .send({ refreshToken: firstRefreshToken })
      .expect(401);

    await request(app.getHttpServer())
      .post("/api/auth/logout")
      .send({ refreshToken: rotatedRefreshToken })
      .expect(204);

    // A revoked (logged-out) refresh token must also be unusable.
    await request(app.getHttpServer())
      .post("/api/auth/refresh")
      .send({ refreshToken: rotatedRefreshToken })
      .expect(401);
  });

  it("logs in directly on a trusted device and rejects a wrong password", async () => {
    const loginRes = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ phone, password, deviceId })
      .expect(201);

    expect(loginRes.body.tokens.accessToken).toBeDefined();

    await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ phone, password: "WrongPassword123", deviceId })
      .expect(401);
  });

  it("requires an OTP step-up when logging in from an unrecognized device", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ phone, password, deviceId: "e2e-device-NEVER-SEEN" })
      .expect(201);

    expect(res.body.purpose).toBe("LOGIN");
    expect(res.body.tokens).toBeUndefined();
  });

  it("resets the password via the forgot-password OTP flow", async () => {
    await request(app.getHttpServer())
      .post("/api/auth/password/forgot")
      .send({ phone })
      .expect(201);

    const resetCode = sms.lastCodeFor(phone);
    const newPassword = "AnotherSecurePass456";

    await request(app.getHttpServer())
      .post("/api/auth/password/reset")
      .send({ phone, code: resetCode, newPassword, confirmPassword: newPassword })
      .expect(201);

    await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ phone, password: newPassword, deviceId })
      .expect(201);
  });
});
