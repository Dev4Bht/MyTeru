import { AuthService } from "./auth.service";

describe("AuthService", () => {
  let usersService: any;
  let devicesService: any;
  let sessionsService: any;
  let auditService: any;
  let googleAuthService: any;
  let tokensService: any;
  let service: AuthService;

  const ctx = { ip: "127.0.0.1", userAgent: "jest" };

  const googleProfile = {
    googleId: "google-sub-123",
    email: "tashi.dema@example.bt",
    fullName: "Tashi Dema",
    avatarUrl: "https://example.com/avatar.jpg",
  };

  const dbUser = {
    id: "user-1",
    email: googleProfile.email,
    googleId: googleProfile.googleId,
    role: "USER",
    profile: { fullName: googleProfile.fullName, avatarUrl: googleProfile.avatarUrl },
  };

  beforeEach(() => {
    usersService = {
      findOrCreateFromGoogle: jest.fn().mockResolvedValue(dbUser),
      findByIdOrThrow: jest.fn().mockResolvedValue(dbUser),
      recordLogin: jest.fn().mockResolvedValue(undefined),
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
    googleAuthService = { verifyIdToken: jest.fn().mockResolvedValue(googleProfile) };
    tokensService = {
      signAccessToken: jest.fn().mockReturnValue({
        accessToken: "access-token",
        expiresAt: new Date("2026-01-01T00:15:00Z"),
      }),
    };

    service = new AuthService(
      usersService,
      devicesService,
      sessionsService,
      auditService,
      googleAuthService,
      tokensService,
    );
  });

  describe("loginWithGoogle", () => {
    const dto = { idToken: "fake-id-token", deviceId: "d1" };

    it("verifies the Google ID token before doing anything else", async () => {
      await service.loginWithGoogle(dto, ctx);

      expect(googleAuthService.verifyIdToken).toHaveBeenCalledWith("fake-id-token");
    });

    it("propagates a rejected/invalid Google token without creating a session", async () => {
      googleAuthService.verifyIdToken.mockRejectedValueOnce(new Error("invalid token"));

      await expect(service.loginWithGoogle(dto, ctx)).rejects.toThrow("invalid token");
      expect(sessionsService.create).not.toHaveBeenCalled();
    });

    it("finds-or-creates the user from the verified Google profile", async () => {
      await service.loginWithGoogle(dto, ctx);

      expect(usersService.findOrCreateFromGoogle).toHaveBeenCalledWith(googleProfile);
    });

    it("registers the device, creates a session, and issues tokens", async () => {
      const result = await service.loginWithGoogle(dto, ctx);

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
        email: googleProfile.email,
        fullName: googleProfile.fullName,
        avatarUrl: googleProfile.avatarUrl,
        role: "USER",
      });
    });

    it("records the login and an audit log entry", async () => {
      await service.loginWithGoogle(dto, ctx);

      expect(usersService.recordLogin).toHaveBeenCalledWith("user-1");
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "user-1", action: "auth.google.login" }),
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
