import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignupForm } from "../signup-form";
import { authApi } from "@/lib/auth-api";

jest.mock("@/lib/auth-api", () => ({
  authApi: { signup: jest.fn(), verifyOtp: jest.fn(), resendOtp: jest.fn() },
  isSessionResponse: (data: any) => "accessToken" in data,
}));

jest.mock("@/lib/device-id", () => ({ getDeviceId: () => "test-device" }));

describe("SignupForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows validation errors for an invalid phone and weak password", async () => {
    const user = userEvent.setup();
    render(<SignupForm onDone={jest.fn()} />);

    await user.type(screen.getByLabelText(/full name/i), "Tashi Dema");
    await user.type(screen.getByLabelText(/^phone number$/i), "1234");
    await user.type(screen.getByLabelText(/^password$/i), "short");
    await user.type(screen.getByLabelText(/confirm password/i), "short");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/valid bhutanese mobile number/i)).toBeInTheDocument();
    expect(authApi.signup).not.toHaveBeenCalled();
  });

  it("submits valid details and advances to the OTP step", async () => {
    (authApi.signup as jest.Mock).mockResolvedValueOnce({
      phone: "+97517123456",
      purpose: "SIGNUP",
      expiresInSeconds: 300,
      resendAvailableInSeconds: 60,
    });

    const user = userEvent.setup();
    render(<SignupForm onDone={jest.fn()} />);

    await user.type(screen.getByLabelText(/full name/i), "Tashi Dema");
    await user.type(screen.getByLabelText(/^phone number$/i), "+97517123456");
    await user.type(screen.getByLabelText(/^password$/i), "SecurePass123");
    await user.type(screen.getByLabelText(/confirm password/i), "SecurePass123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() =>
      expect(authApi.signup).toHaveBeenCalledWith(
        expect.objectContaining({ phone: "+97517123456", deviceId: "test-device" }),
      ),
    );

    expect(await screen.findByText(/enter the 6-digit code/i)).toBeInTheDocument();
  });
});
