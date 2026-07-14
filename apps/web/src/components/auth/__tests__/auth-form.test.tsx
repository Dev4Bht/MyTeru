import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthForm } from "../auth-form";
import { authApi } from "@/lib/auth-api";
import { useAuthStore } from "@/lib/auth-store";

jest.mock("@/lib/auth-api", () => ({
  authApi: {
    login: jest.fn(),
    signup: jest.fn(),
  },
}));

jest.mock("@/lib/device-id", () => ({
  getDeviceId: () => "web-test-device",
}));

const mockedAuthApi = authApi as jest.Mocked<typeof authApi>;

describe("AuthForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: null, accessToken: null, status: "idle" });
  });

  it("logs in with a valid email and password", async () => {
    const user = userEvent.setup();
    const onDone = jest.fn();
    mockedAuthApi.login.mockResolvedValueOnce({
      user: { id: "1", email: "tashi@example.bt", fullName: "Tashi", avatarUrl: null, role: "USER" },
      accessToken: "token",
      accessTokenExpiresAt: new Date().toISOString(),
    });

    render(<AuthForm onDone={onDone} />);

    await user.type(screen.getByLabelText(/email/i), "tashi@example.bt");
    await user.type(screen.getByLabelText(/password/i), "SecurePass123");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(mockedAuthApi.login).toHaveBeenCalledWith({
      email: "tashi@example.bt",
      password: "SecurePass123",
      deviceId: "web-test-device",
    });
    expect(useAuthStore.getState().accessToken).toBe("token");
  });

  it("shows a server error when login fails", async () => {
    const user = userEvent.setup();
    mockedAuthApi.login.mockRejectedValueOnce(new Error("Invalid email or password"));

    render(<AuthForm onDone={jest.fn()} />);

    await user.type(screen.getByLabelText(/email/i), "tashi@example.bt");
    await user.type(screen.getByLabelText(/password/i), "WrongPass123");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByText("Invalid email or password")).toBeInTheDocument();
  });

  it("switches to signup mode and creates an account", async () => {
    const user = userEvent.setup();
    const onDone = jest.fn();
    mockedAuthApi.signup.mockResolvedValueOnce({
      user: { id: "2", email: "new@example.bt", fullName: "New User", avatarUrl: null, role: "USER" },
      accessToken: "token-2",
      accessTokenExpiresAt: new Date().toISOString(),
    });

    render(<AuthForm onDone={onDone} />);

    await user.click(screen.getByRole("button", { name: /create an account/i }));

    await user.type(screen.getByLabelText(/full name/i), "New User");
    await user.type(screen.getByLabelText(/^email$/i), "new@example.bt");
    await user.type(screen.getByLabelText(/^password$/i), "SecurePass123");
    await user.type(screen.getByLabelText(/confirm password/i), "SecurePass123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(mockedAuthApi.signup).toHaveBeenCalledWith({
      fullName: "New User",
      email: "new@example.bt",
      password: "SecurePass123",
      confirmPassword: "SecurePass123",
      deviceId: "web-test-device",
    });
  });

  it("shows a validation error for mismatched passwords without calling the API", async () => {
    const user = userEvent.setup();

    render(<AuthForm onDone={jest.fn()} />);

    await user.click(screen.getByRole("button", { name: /create an account/i }));

    await user.type(screen.getByLabelText(/full name/i), "New User");
    await user.type(screen.getByLabelText(/^email$/i), "new@example.bt");
    await user.type(screen.getByLabelText(/^password$/i), "SecurePass123");
    await user.type(screen.getByLabelText(/confirm password/i), "Different123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(mockedAuthApi.signup).not.toHaveBeenCalled();
  });
});
