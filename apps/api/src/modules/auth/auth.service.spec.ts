import * as argon2 from "argon2";
import { ConflictException, ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  let configService: any;
  let usersService: any;
  let devicesService: any;
  let sessionsService: any;
  let auditService: any;
  let tokensService: any;
  let service: AuthService;

  const ctx = { ip: "127.0.0.1", userAgent: "jest" };

  const dbUser = {
    id: "user-1",
    email: "tashi.dema@example.bt",
    passwordHash: "irrelevant-in-most-tests",
    role: "USER",
    lockedUntil: null,
    failedLoginCount: 0,
    profile: { fullName: "Tashi Dema", avatarUrl: null },
  };

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, unknown> = {
          "argon2.memoryCost": 19456,
          "argon2.timeCost": 2,
          "argon2.parallelism": 1,
          "login.maxAttempts": 5,
          "login.lockoutMinutes": 15,
        };
        return values[key];
      }),
    };
    usersService = {
      findByEmail: jest.fn().mockResolvedValue(null),
      findByIdOrThrow: jest.fn().mockResolvedValue(dbUser),
      create: jest.fn().mockResolvedValue(dbUser),
      recordFailedLogin: jest.fn().mockResolvedValue(undefined),
      resetFailedLogins: jest.fn().mockResolvedValue(undefined),
    };
    devicesService = {
      registerOrTouch: jest.fn().mockResolvedValue({ id: "device-1" }),
    };
    sessionsService = {
      create: jest.fn().mockResolvedValue({ sessionId: "session-1", rawToken: "raw-refresh-token" }),
      rotate: jest.fn(),
      revokeByRawToken: jest.fn().mockResolvedValue(undefined),
    };
    auditService = { record: jest.fn().mockResolvedValue(undefined) };
    tokensService = {
      signAccessToken: jest.fn().mockReturnValue({
        accessToken: "access-token",
        expiresAt: new Date("2026-01-01T00:15:00Z"),
      }),
    };

    service = new AuthService(
      configService,
      usersService,
      devicesService,
      sessionsService,
      auditService,
      tokensService,
    );
  });

  describe("signup", () => {
    const dto = {
      fullName: "Tashi Dema",
      email: "tashi.dema@example.bt",
      password: "SecurePass123",
      confirmPassword: "SecurePass123",
      deviceId: "d1",
    };

    it("rejects mismatched passwords without touching the database", async () => {
      await expect(
        service.signup({ ...dto, confirmPassword: "Different123" }, ctx),
      ).rejects.toThrow("Passwords do not match");
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it("rejects a signup when the email is already registered", async () => {
      usersService.findByEmail.mockResolvedValueOnce(dbUser);

      await expect(service.signup(dto, ctx)).rejects.toThrow(ConflictException);
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it("hashes the password, creates the user, registers a device and session, and issues tokens", async () => {
      const result = await service.signup(dto, ctx);

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: dto.email, fullName: dto.fullName }),
      );
      const createCall = usersService.create.mock.calls[0][0];
      expect(createCall.passwordHash).not.toBe(dto.password);
      expect(await argon2.verify(createCall.passwordHash, dto.password)).toBe(true);

      expect(devicesService.registerOrTouch).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "user-1", deviceId: "d1" }),
      );
      expect(sessionsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "user-1", deviceId: "device-1" }),
      );
      expect(result.tokens.accessToken).toBe("access-token");
      expect(result.tokens.refreshToken).toBe("raw-refresh-token");
      expect(result.user).toEqual({
        id: "user-1",
        email: dbUser.email,
        fullName: "Tashi Dema",
        avatarUrl: null,
        role: "USER",
      });
    });

    it("records a signup audit log entry", async () => {
      await service.signup(dto, ctx);

      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "user-1", action: "auth.signup" }),
      );
    });
  });

  describe("login", () => {
    const dto = { email: "tashi.dema@example.bt", password: "SecurePass123", deviceId: "d1" };

    it("rejects an unknown email", async () => {
      usersService.findByEmail.mockResolvedValueOnce(null);

      await expect(service.login(dto, ctx)).rejects.toThrow(UnauthorizedException);
    });

    it("rejects a login while the account is locked", async () => {
      usersService.findByEmail.mockResolvedValueOnce({
        ...dbUser,
        lockedUntil: new Date(Date.now() + 60_000),
      });

      await expect(service.login(dto, ctx)).rejects.toThrow(ForbiddenException);
    });

    it("rejects an incorrect password and records the failed attempt", async () => {
      const passwordHash = await argon2.hash("CorrectPass123");
      usersService.findByEmail.mockResolvedValueOnce({ ...dbUser, passwordHash });

      await expect(service.login(dto, ctx)).rejects.toThrow(UnauthorizedException);
      expect(usersService.recordFailedLogin).toHaveBeenCalledWith("user-1", 5, 15);
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "user-1", action: "auth.login.failed" }),
      );
      expect(sessionsService.create).not.toHaveBeenCalled();
    });

    it("logs in with a correct password, resets failed attempts, and issues tokens", async () => {
      const passwordHash = await argon2.hash(dto.password);
      usersService.findByEmail.mockResolvedValueOnce({ ...dbUser, passwordHash });

      const result = await service.login(dto, ctx);

      expect(usersService.resetFailedLogins).toHaveBeenCalledWith("user-1");
      expect(result.tokens.accessToken).toBe("access-token");
      expect(result.tokens.refreshToken).toBe("raw-refresh-token");
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "user-1", action: "auth.login.success" }),
      );
    });
  });

  describe("refresh", () => {
    it("rotates the refresh token and issues a new access token for the same user", async () => {
      sessionsService.rotate.mockResolvedValueOnce({
        rawToken: "new-refresh-token",
        sessionId: "session-2",
        userId: "user-1",
      });

      const result = await service.refresh("old-refresh-token");

      expect(sessionsService.rotate).toHaveBeenCalledWith("old-refresh-token");
      expect(result.tokens.refreshToken).toBe("new-refresh-token");
      expect(result.user.id).toBe("user-1");
    });
  });

  describe("logout", () => {
    it("revokes the session by its refresh token and records an audit entry", async () => {
      await service.logout("raw-refresh-token", ctx, "user-1");

      expect(sessionsService.revokeByRawToken).toHaveBeenCalledWith("raw-refresh-token");
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "user-1", action: "auth.logout" }),
      );
    });
  });
});
