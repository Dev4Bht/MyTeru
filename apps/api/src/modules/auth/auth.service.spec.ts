import * as argon2 from "argon2";
import { BadRequestException, ConflictException, ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { OtpPurpose, Role } from "@druksave/database";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  const config: Record<string, number> = {
    "argon2.memoryCost": 19456,
    "argon2.timeCost": 2,
    "argon2.parallelism": 1,
    "login.maxAttempts": 5,
    "login.lockoutMinutes": 15,
    "otp.ttlSeconds": 300,
    "otp.resendCooldownSeconds": 60,
  };

  let prisma: any;
  let configService: any;
  let usersService: any;
  let devicesService: any;
  let sessionsService: any;
  let auditService: any;
  let otpService: any;
  let tokensService: any;
  let service: AuthService;

  const ctx = { ip: "127.0.0.1", userAgent: "jest" };

  beforeEach(() => {
    prisma = {
      user: { update: jest.fn().mockResolvedValue({}) },
    };
    configService = { get: jest.fn((key: string) => config[key]) };
    usersService = {
      findByPhone: jest.fn(),
      findByIdOrThrow: jest.fn(),
      create: jest.fn(),
      updatePassword: jest.fn().mockResolvedValue({}),
      updatePhone: jest.fn().mockResolvedValue({}),
      recordFailedLogin: jest.fn().mockResolvedValue(undefined),
      resetFailedLogins: jest.fn().mockResolvedValue({}),
    };
    devicesService = {
      isKnownDevice: jest.fn(),
      registerOrTouch: jest.fn().mockResolvedValue({ id: "device-1" }),
    };
    sessionsService = {
      create: jest.fn().mockResolvedValue({ sessionId: "session-1", rawToken: "raw-refresh-token" }),
      rotate: jest.fn(),
      revokeByRawToken: jest.fn().mockResolvedValue(undefined),
      revokeAll: jest.fn().mockResolvedValue(undefined),
    };
    auditService = { record: jest.fn().mockResolvedValue(undefined) };
    otpService = {
      generateAndSend: jest.fn().mockResolvedValue({
        phone: "+97517123456",
        purpose: OtpPurpose.SIGNUP,
        expiresInSeconds: 300,
        resendAvailableInSeconds: 60,
      }),
      verify: jest.fn(),
    };
    tokensService = {
      signAccessToken: jest.fn().mockReturnValue({
        accessToken: "access-token",
        expiresAt: new Date("2026-01-01T00:15:00Z"),
      }),
    };

    service = new AuthService(
      prisma,
      configService,
      usersService,
      devicesService,
      sessionsService,
      auditService,
      otpService,
      tokensService,
    );
  });

  describe("signup", () => {
    it("rejects mismatched passwords before touching the database", async () => {
      await expect(
        service.signup(
          {
            fullName: "Tashi Dema",
            phone: "+97517123456",
            password: "SecurePass123",
            confirmPassword: "Different123",
            deviceId: "d1",
          },
          ctx,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(usersService.findByPhone).not.toHaveBeenCalled();
    });

    it("rejects signup for a phone that is already verified", async () => {
      usersService.findByPhone.mockResolvedValueOnce({ id: "user-1", isPhoneVerified: true });

      await expect(
        service.signup(
          {
            fullName: "Tashi Dema",
            phone: "+97517123456",
            password: "SecurePass123",
            confirmPassword: "SecurePass123",
            deviceId: "d1",
          },
          ctx,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it("creates an unverified user and sends a SIGNUP OTP on the happy path", async () => {
      usersService.findByPhone.mockResolvedValueOnce(null);
      usersService.create.mockResolvedValueOnce({ id: "user-1" });

      const result = await service.signup(
        {
          fullName: "Tashi Dema",
          phone: "+97517123456",
          password: "SecurePass123",
          confirmPassword: "SecurePass123",
          deviceId: "d1",
        },
        ctx,
      );

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ phone: "+97517123456", fullName: "Tashi Dema" }),
      );
      expect(otpService.generateAndSend).toHaveBeenCalledWith(
        expect.objectContaining({ purpose: OtpPurpose.SIGNUP, userId: "user-1" }),
      );
      expect(result.purpose).toBe(OtpPurpose.SIGNUP);
    });
  });

  describe("login", () => {
    const dto = { phone: "+97517123456", password: "SecurePass123", deviceId: "d1" };

    it("rejects when no account exists for the phone", async () => {
      usersService.findByPhone.mockResolvedValueOnce(null);

      await expect(service.login(dto, ctx)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("rejects while the account is locked", async () => {
      usersService.findByPhone.mockResolvedValueOnce({
        id: "user-1",
        lockedUntil: new Date(Date.now() + 60_000),
      });

      await expect(service.login(dto, ctx)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("records a failed attempt and rejects on a wrong password", async () => {
      const passwordHash = await argon2.hash("CorrectPass123", { type: argon2.argon2id });
      usersService.findByPhone.mockResolvedValueOnce({ id: "user-1", passwordHash, lockedUntil: null });

      await expect(service.login(dto, ctx)).rejects.toBeInstanceOf(UnauthorizedException);
      expect(usersService.recordFailedLogin).toHaveBeenCalledWith("user-1", 5, 15);
    });

    it("issues tokens directly for a known, trusted device", async () => {
      const passwordHash = await argon2.hash("SecurePass123", { type: argon2.argon2id });
      usersService.findByPhone.mockResolvedValueOnce({
        id: "user-1",
        phone: "+97517123456",
        passwordHash,
        role: Role.USER,
        lockedUntil: null,
        profile: { fullName: "Tashi Dema" },
      });
      devicesService.isKnownDevice.mockResolvedValueOnce(true);

      const result: any = await service.login(dto, ctx);

      expect(otpService.generateAndSend).not.toHaveBeenCalled();
      expect(sessionsService.create).toHaveBeenCalled();
      expect(result.tokens.accessToken).toBe("access-token");
      expect(result.tokens.refreshToken).toBe("raw-refresh-token");
    });

    it("requires an OTP step-up for a new, untrusted device", async () => {
      const passwordHash = await argon2.hash("SecurePass123", { type: argon2.argon2id });
      usersService.findByPhone.mockResolvedValueOnce({
        id: "user-1",
        phone: "+97517123456",
        passwordHash,
        role: Role.USER,
        lockedUntil: null,
      });
      devicesService.isKnownDevice.mockResolvedValueOnce(false);

      const result: any = await service.login(dto, ctx);

      expect(otpService.generateAndSend).toHaveBeenCalledWith(
        expect.objectContaining({ purpose: OtpPurpose.LOGIN }),
      );
      expect(sessionsService.create).not.toHaveBeenCalled();
      expect(result.purpose).toBe(OtpPurpose.SIGNUP); // shape returned by the OTP mock
    });
  });

  describe("changePassword", () => {
    it("rejects when the current password is incorrect", async () => {
      const passwordHash = await argon2.hash("CorrectPass123", { type: argon2.argon2id });
      usersService.findByIdOrThrow.mockResolvedValueOnce({ id: "user-1", passwordHash });

      await expect(
        service.changePassword(
          "user-1",
          { currentPassword: "WrongPass123", newPassword: "NewPass123", confirmPassword: "NewPass123" },
          ctx,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
