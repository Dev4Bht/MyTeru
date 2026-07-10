import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OtpStep } from "../otp-step";
import { authApi } from "@/lib/auth-api";
import { useAuthStore } from "@/lib/auth-store";

jest.mock("@/lib/auth-api", () => ({
  authApi: { verifyOtp: jest.fn(), resendOtp: jest.fn() },
  isSessionResponse: (data: any) => "accessToken" in data,
}));

describe("OtpStep", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.getState().clearSession();
  });

  it("disables resend during the cooldown and verifies a correct code", async () => {
    (authApi.verifyOtp as jest.Mock).mockResolvedValueOnce({
      user: { id: "u1", phone: "+97517123456", email: null, fullName: "Tashi Dema", role: "USER", isPhoneVerified: true },
      accessToken: "access-token",
      accessTokenExpiresAt: new Date().toISOString(),
    });

    const onVerified = jest.fn();
    const user = userEvent.setup();
    render(
      <OtpStep
        phone="+97517123456"
        purpose="SIGNUP"
        deviceId="test-device"
        resendAvailableInSeconds={60}
        onVerified={onVerified}
      />,
    );

    expect(screen.getByRole("button", { name: /resend code in/i })).toBeDisabled();

    await user.type(screen.getByLabelText(/verification code/i), "123456");
    await user.click(screen.getByRole("button", { name: /^verify$/i }));

    await waitFor(() => expect(onVerified).toHaveBeenCalled());
    expect(authApi.verifyOtp).toHaveBeenCalledWith({
      phone: "+97517123456",
      code: "123456",
      purpose: "SIGNUP",
      deviceId: "test-device",
    });
  });

  it("shows a server error message when verification fails", async () => {
    (authApi.verifyOtp as jest.Mock).mockRejectedValueOnce(new Error("Incorrect code. Please try again."));

    const user = userEvent.setup();
    render(
      <OtpStep
        phone="+97517123456"
        purpose="SIGNUP"
        deviceId="test-device"
        resendAvailableInSeconds={0}
        onVerified={jest.fn()}
      />,
    );

    await user.type(screen.getByLabelText(/verification code/i), "000000");
    await user.click(screen.getByRole("button", { name: /^verify$/i }));

    expect(await screen.findByText(/incorrect code/i)).toBeInTheDocument();
  });
});
