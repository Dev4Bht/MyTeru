import { useEffect } from "react";
import { render, waitFor } from "@testing-library/react";
import { GoogleSignInButton } from "../google-sign-in-button";
import { authApi } from "@/lib/auth-api";
import { useAuthStore } from "@/lib/auth-store";

jest.mock("next/script", () => {
  return function MockScript({ onLoad }: { onLoad?: () => void }) {
    // Real next/script fires onLoad after mount, not during render — mirror
    // that here so we don't trigger a "setState during render" warning.
    useEffect(() => {
      onLoad?.();
    }, [onLoad]);
    return null;
  };
});

jest.mock("@/lib/auth-api", () => ({
  authApi: { loginWithGoogle: jest.fn() },
}));

jest.mock("@/lib/device-id", () => ({ getDeviceId: () => "test-device" }));

describe("GoogleSignInButton", () => {
  const initialize = jest.fn();
  const renderButton = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.getState().clearSession();
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id.apps.googleusercontent.com";
    window.google = {
      accounts: { id: { initialize, renderButton } },
    };
  });

  it("initializes Google Identity Services with the configured client ID", async () => {
    render(<GoogleSignInButton onDone={jest.fn()} />);

    await waitFor(() =>
      expect(initialize).toHaveBeenCalledWith(
        expect.objectContaining({ client_id: "test-client-id.apps.googleusercontent.com" }),
      ),
    );
    expect(renderButton).toHaveBeenCalled();
  });

  it("exchanges the Google credential for a DrukSave session on successful sign-in", async () => {
    (authApi.loginWithGoogle as jest.Mock).mockResolvedValueOnce({
      user: { id: "u1", email: "tashi@example.bt", fullName: "Tashi Dema", avatarUrl: null, role: "USER" },
      accessToken: "access-token",
      accessTokenExpiresAt: new Date().toISOString(),
    });

    const onDone = jest.fn();
    render(<GoogleSignInButton onDone={onDone} />);

    await waitFor(() => expect(initialize).toHaveBeenCalled());
    const { callback } = initialize.mock.calls[0][0];

    await callback({ credential: "fake-google-id-token" });

    expect(authApi.loginWithGoogle).toHaveBeenCalledWith({
      idToken: "fake-google-id-token",
      deviceId: "test-device",
    });
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(useAuthStore.getState().accessToken).toBe("access-token");
  });
});
