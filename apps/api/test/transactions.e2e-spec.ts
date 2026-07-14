import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/database/prisma.service";

/**
 * Full transaction/category CRUD flow against a real Postgres (docker-compose
 * service). Run `docker compose -f docker/docker-compose.yml up -d` and apply
 * migrations before running `pnpm test:e2e`.
 */
describe("Transactions flow (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;

  const testEmail = "e2e-transactions@example.bt";
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

    const signupRes = await request(app.getHttpServer())
      .post("/api/auth/signup")
      .send({
        fullName: "E2E Transactions Tester",
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
        deviceId: "e2e-tx-device",
      })
      .expect(201);

    accessToken = signupRes.body.tokens.accessToken;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await app.close();
  });

  it("rejects unauthenticated requests", async () => {
    await request(app.getHttpServer()).get("/api/transactions").expect(401);
  });

  it("lists system categories for the new user", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every((c: { isSystem: boolean }) => c.isSystem)).toBe(true);
  });

  it("creates a custom category, then forbids deleting a system category", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Weekend Hikes", type: "EXPENSE" })
      .expect(201);

    expect(createRes.body.isSystem).toBe(false);

    const listRes = await request(app.getHttpServer())
      .get("/api/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
    const systemCategory = listRes.body.find((c: { isSystem: boolean }) => c.isSystem);

    await request(app.getHttpServer())
      .delete(`/api/categories/${systemCategory.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/api/categories/${createRes.body.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(204);
  });

  let transactionId: string;

  it("creates a transaction with a merchant name", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        type: "EXPENSE",
        amountNu: 450,
        merchantName: "Bhutan Telecom",
        description: "Monthly internet bill",
        occurredAt: "2026-07-10",
      })
      .expect(201);

    expect(res.body.amountNu).toBe("450");
    expect(res.body.merchantName).toBe("Bhutan Telecom");
    transactionId = res.body.id;
  });

  it("lists transactions filtered by type", async () => {
    await request(app.getHttpServer())
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ type: "INCOME", amountNu: 25000, occurredAt: "2026-07-01" })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get("/api/transactions?type=EXPENSE")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.items.length).toBe(1);
    expect(res.body.items[0].type).toBe("EXPENSE");
    expect(res.body.total).toBe(1);
  });

  it("returns a month-to-date summary", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/transactions/summary?month=2026-07")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.totalIncomeNu).toBe("25000");
    expect(res.body.totalExpenseNu).toBe("450");
    expect(res.body.balanceNu).toBe("24550");
    expect(res.body.transactionCount).toBe(2);
  });

  it("updates a transaction it owns", async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/transactions/${transactionId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ description: "Updated bill" })
      .expect(200);

    expect(res.body.description).toBe("Updated bill");
  });

  it("deletes a transaction it owns", async () => {
    await request(app.getHttpServer())
      .delete(`/api/transactions/${transactionId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/api/transactions/${transactionId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(404);
  });
});
