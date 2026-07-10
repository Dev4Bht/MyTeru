import { BadRequestException, ForbiddenException, HttpException } from "@nestjs/common";
import { OtpPurpose } from "@druksave/database";
import { OtpService } from "./otp.service";

describe("OtpService", () => {
  const config: Record<string, number> = {
    "otp.length": 6,
    "otp.ttlSeconds": 300,
    "otp.maxAttempts": 5,
    "otp.resendCooldownSeconds": 60,
    "otp.maxSendsPerHour": 5,
  };

  let prisma: any;
  let configService: any;
  let redis: any;
  let smsProvider: any;
  let service: OtpService;

  beforeEach(() => {
    prisma = {
      otp: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn().mockResolvedValue({ id: "otp-1" }),
        findFirst: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      device: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    configService = { get: jest.fn((key: string) => config[key]) };
    redis = {
      ttl: jest.fn().mockResolvedValue(-2),
      incr: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
      set: jest.fn().mockResolvedValue("OK"),
    };
    smsProvider = { send: jest.fn().mockResolvedValue({ success: true, providerMessageId: "sms-1" }) };

    service = new OtpService(prisma, configService, redis, smsProvider);
  });

  describe("generateAndSend", () => {
    it("rejects when still within the resend cooldown", async () => {
      redis.ttl.mockResolvedValueOnce(42);

      await expect(
        service.generateAndSend({ phone: "+97517123456", purpose: OtpPurpose.SIGNUP, deviceId: "d1" }),
      ).rejects.toBeInstanceOf(HttpException);

      expect(smsProvider.send).not.toHaveBeenCalled();
    });

    it("rejects once the hourly send limit is exceeded", async () => {
      redis.incr.mockResolvedValueOnce(6);

      await expect(
        service.generateAndSend({ phone: "+97517123456", purpose: OtpPurpose.SIGNUP, deviceId: "d1" }),
      ).rejects.toBeInstanceOf(HttpException);

      expect(smsProvider.send).not.toHaveBeenCalled();
    });

    it("invalidates prior active codes, persists a hashed code, and sends the SMS", async () => {
      const result = await service.generateAndSend({
        phone: "+97517123456",
        purpose: OtpPurpose.SIGNUP,
        deviceId: "d1",
        userId: "user-1",
      });

      expect(prisma.otp.updateMany).toHaveBeenCalledWith({
        where: { phone: "+97517123456", purpose: OtpPurpose.SIGNUP, consumedAt: null },
        data: { consumedAt: expect.any(Date) },
      });
      expect(prisma.otp.create).toHaveBeenCalled();
      const createArgs = prisma.otp.create.mock.calls[0][0].data;
      expect(createArgs.codeHash).not.toMatch(/^\d{6}$/); // never stores the raw code
      expect(smsProvider.send).toHaveBeenCalledWith(
        "+97517123456",
        expect.stringContaining("DrukSave"),
      );
      expect(redis.set).toHaveBeenCalledWith("otp:cooldown:SIGNUP:+97517123456", "1", "EX", 60);
      expect(result).toEqual({
        phone: "+97517123456",
        purpose: OtpPurpose.SIGNUP,
        expiresInSeconds: 300,
        resendAvailableInSeconds: 60,
      });
    });

    it("throws if the SMS provider fails to send", async () => {
      smsProvider.send.mockResolvedValueOnce({ success: false, error: "provider down" });

      await expect(
        service.generateAndSend({ phone: "+97517123456", purpose: OtpPurpose.SIGNUP, deviceId: "d1" }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe("verify", () => {
    const baseOtp = {
      id: "otp-1",
      phone: "+97517123456",
      purpose: OtpPurpose.SIGNUP,
      userId: "user-1",
      attempts: 0,
      maxAttempts: 5,
      expiresAt: new Date(Date.now() + 60_000),
      device: null,
    };

    it("throws when no active OTP exists", async () => {
      prisma.otp.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.verify({ phone: "+97517123456", code: "123456", purpose: OtpPurpose.SIGNUP, deviceId: "d1" }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("throws when the OTP has expired", async () => {
      prisma.otp.findFirst.mockResolvedValueOnce({ ...baseOtp, expiresAt: new Date(Date.now() - 1000) });

      await expect(
        service.verify({ phone: "+97517123456", code: "123456", purpose: OtpPurpose.SIGNUP, deviceId: "d1" }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("locks out and consumes the OTP once max attempts are reached", async () => {
      prisma.otp.findFirst.mockResolvedValueOnce({ ...baseOtp, attempts: 5 });

      await expect(
        service.verify({ phone: "+97517123456", code: "123456", purpose: OtpPurpose.SIGNUP, deviceId: "d1" }),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(prisma.otp.update).toHaveBeenCalledWith({
        where: { id: "otp-1" },
        data: { consumedAt: expect.any(Date) },
      });
    });

    it("rejects verification from a device other than the one the OTP was issued to", async () => {
      prisma.otp.findFirst.mockResolvedValueOnce({
        ...baseOtp,
        device: { deviceId: "device-a" },
      });

      await expect(
        service.verify({ phone: "+97517123456", code: "123456", purpose: OtpPurpose.SIGNUP, deviceId: "device-b" }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("increments attempts on an incorrect code without consuming it", async () => {
      const argon2 = await import("argon2");
      const codeHash = await argon2.hash("111111", { type: argon2.argon2id });
      prisma.otp.findFirst.mockResolvedValueOnce({ ...baseOtp, codeHash });

      await expect(
        service.verify({ phone: "+97517123456", code: "999999", purpose: OtpPurpose.SIGNUP, deviceId: "d1" }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.otp.update).toHaveBeenCalledWith({
        where: { id: "otp-1" },
        data: { attempts: { increment: 1 } },
      });
    });

    it("consumes the OTP and returns the userId on a correct code", async () => {
      const argon2 = await import("argon2");
      const codeHash = await argon2.hash("111111", { type: argon2.argon2id });
      prisma.otp.findFirst.mockResolvedValueOnce({ ...baseOtp, codeHash });

      const result = await service.verify({
        phone: "+97517123456",
        code: "111111",
        purpose: OtpPurpose.SIGNUP,
        deviceId: "d1",
      });

      expect(result).toEqual({ userId: "user-1" });
      expect(prisma.otp.update).toHaveBeenCalledWith({
        where: { id: "otp-1" },
        data: { consumedAt: expect.any(Date) },
      });
    });
  });
});
