import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "../login-form";
import { authApi, ApiError } from "@/lib/auth-api";
import { useAuthStore } from "@/lib/auth-store";

jest.mock("@/lib/auth-api", () => {
  const actual = jest.requireActual("@/lib/auth-api");
  return {
    ...actual,
    authApi: { login: jest.fn(), verifyOtp: jest.fn(), resendOtp: jest.fn() },
  };
});

jest.mock("@/lib/device-id", () => ({ getDeviceId: () => "test-device" }));

describe("LoginForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.getState().clearSession();
  });

  it("logs in directly when the API returns a session", async () => {
    (authApi.login as jest.Mock).mockResolvedValueOnce({
      user: { id: "u1", phone: "+97517123456", email: null, fullName: "Tashi Dema", role: "USER", isPhoneVerified: true },
      accessToken: "access-token",
      accessTokenExpiresAt: new Date().toISOString(),
    });

    const onDone = jest.fn();
    const user = userEvent.setup();
    render(<LoginForm onDone={onDone} />);

    await user.type(screen.getByLabelText(/phone number/i), "+97517123456");
    await user.type(screen.getByLabelText(/password/i), "SecurePass123");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(useAuthStore.getState().accessToken).toBe("access-token");
  });

  it("shows a server error message on invalid credentials", async () => {
    (authApi.login as jest.Mock).mockRejectedValueOnce(new ApiError("Invalid phone number or password", 401));

    const user = userEvent.setup();
    render(<LoginForm onDone={jest.fn()} />);

    await user.type(screen.getByLabelText(/phone number/i), "+97517123456");
    await user.type(screen.getByLabelText(/password/i), "WrongPass123");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    expect(await screen.findByText(/invalid phone number or password/i)).toBeInTheDocument();
  });

  it("shows the OTP step when the API requires device verification", async () => {
    (authApi.login as jest.Mock).mockResolvedValueOnce({
      phone: "+97517123456",
      purpose: "LOGIN",
      expiresInSeconds: 300,
      resendAvailableInSeconds: 60,
    });

    const user = userEvent.setup();
    render(<LoginForm onDone={jest.fn()} />);

    await user.type(screen.getByLabelText(/phone number/i), "+97517123456");
    await user.type(screen.getByLabelText(/password/i), "SecurePass123");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    expect(await screen.findByText(/new device/i)).toBeInTheDocument();
  });
});
