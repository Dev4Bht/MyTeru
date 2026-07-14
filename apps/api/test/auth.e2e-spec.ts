import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/database/prisma.service";

/**
 * Full auth flow against a real Postgres (docker-compose service). Run
 * `docker compose -f docker/docker-compose.yml up -d` and apply migrations
 * before running `pnpm test:e2e`.
 */
describe("Auth flow (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const deviceId = "e2e-device-1";
  const testEmail = "e2e-tester@example.bt";
  const testPassword = "SecurePass123";

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.user.deleteMany({ where: { email: testEmail } });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await app.close();
  });

  it("rejects a login for an account that doesn't exist yet", async () => {
    await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: testEmail, password: testPassword, deviceId })
      .expect(401);
  });

  it("creates a new account on signup and issues tokens", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/auth/signup")
      .send({
        fullName: "E2E Tester",
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
        deviceId,
      })
      .expect(201);

    expect(res.body.user.email).toBe(testEmail);
    expect(res.body.user.fullName).toBe("E2E Tester");
    expect(res.body.tokens.accessToken).toBeDefined();
    expect(res.body.tokens.refreshToken).toBeDefined();
  });

  it("rejects a duplicate signup for the same email", async () => {
    await request(app.getHttpServer())
      .post("/api/auth/signup")
      .send({
        fullName: "E2E Tester",
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
        deviceId: "e2e-device-dup",
      })
      .expect(409);
  });

  it("rejects a login with the wrong password", async () => {
    await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: testEmail, password: "WrongPass123", deviceId })
      .expect(401);
  });

  it("logs in with the correct password", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: testEmail, password: testPassword, deviceId })
      .expect(201);

    expect(res.body.user.email).toBe(testEmail);
    expect(res.body.tokens.accessToken).toBeDefined();
    expect(res.body.tokens.refreshToken).toBeDefined();
  });

  it("completes refresh rotation -> logout -> revoked refresh", async () => {
    const loginRes = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: testEmail, password: testPassword, deviceId })
      .expect(201);

    const firstRefreshToken = loginRes.body.tokens.refreshToken;

    const refreshRes = await request(app.getHttpServer())
      .post("/api/auth/refresh")
      .send({ refreshToken: firstRefreshToken })
      .expect(201);

    const rotatedRefreshToken = refreshRes.body.tokens.refreshToken;
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

  it("locks the account after repeated failed login attempts", async () => {
    for (let i = 0; i < 5; i += 1) {
      await request(app.getHttpServer())
        .post("/api/auth/login")
        .send({ email: testEmail, password: "WrongPass123", deviceId })
        .expect(401);
    }

    // Even the correct password is now rejected while the lockout is active.
    await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: testEmail, password: testPassword, deviceId })
      .expect(403);
  });
});
