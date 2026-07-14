import { INestApplication, UnauthorizedException, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/database/prisma.service";
import { GoogleAuthService, GoogleProfile } from "../src/modules/auth/google-auth.service";

/**
 * Full auth flow against a real Postgres (docker-compose service). Run
 * `docker compose -f docker/docker-compose.yml up -d` and apply migrations
 * before running `pnpm test:e2e`. GoogleAuthService is overridden with a
 * fake so the flow doesn't need a real Google ID token.
 */
class FakeGoogleAuthService {
  public nextProfile: GoogleProfile = {
    googleId: "google-sub-e2e",
    email: "e2e-tester@example.bt",
    fullName: "E2E Tester",
    avatarUrl: "https://example.com/avatar.jpg",
  };

  async verifyIdToken(idToken: string): Promise<GoogleProfile> {
    if (idToken === "invalid-token") {
      // Matches the real GoogleAuthService's behavior on a bad token.
      throw new UnauthorizedException("Invalid Google sign-in token");
    }
    return this.nextProfile;
  }
}

describe("Auth flow (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let googleAuth: FakeGoogleAuthService;

  const deviceId = "e2e-device-1";
  const testEmail = "e2e-tester@example.bt";

  beforeAll(async () => {
    googleAuth = new FakeGoogleAuthService();

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(GoogleAuthService)
      .useValue(googleAuth)
      .compile();

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

  it("rejects an invalid Google ID token", async () => {
    await request(app.getHttpServer())
      .post("/api/auth/google")
      .send({ idToken: "invalid-token", deviceId })
      .expect(401);
  });

  it("creates a new user on first Google sign-in and issues tokens", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/auth/google")
      .send({ idToken: "valid-token", deviceId })
      .expect(201);

    expect(res.body.user.email).toBe(testEmail);
    expect(res.body.user.fullName).toBe("E2E Tester");
    expect(res.body.tokens.accessToken).toBeDefined();
    expect(res.body.tokens.refreshToken).toBeDefined();
  });

  it("completes refresh rotation -> logout -> revoked refresh", async () => {
    const loginRes = await request(app.getHttpServer())
      .post("/api/auth/google")
      .send({ idToken: "valid-token", deviceId })
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

  it("signs the same user back in on a second visit instead of creating a duplicate", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/auth/google")
      .send({ idToken: "valid-token", deviceId: "e2e-device-2" })
      .expect(201);

    expect(res.body.user.email).toBe(testEmail);

    const count = await prisma.user.count({ where: { email: testEmail } });
    expect(count).toBe(1);
  });
});
