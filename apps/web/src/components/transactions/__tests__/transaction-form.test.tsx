import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TransactionForm } from "../transaction-form";
import { apiFetch } from "@/lib/api-client";

jest.mock("@/lib/api-client", () => ({
  apiFetch: jest.fn(),
}));

const mockedApiFetch = apiFetch as jest.Mock;

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("TransactionForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApiFetch.mockImplementation((path: string) => {
      if (path === "/categories") {
        return Promise.resolve([
          { id: "cat-1", userId: null, name: "Food & Dining", type: "EXPENSE", icon: "🍜", color: null, isSystem: true },
        ]);
      }
      return Promise.resolve({});
    });
  });

  it("rejects a non-positive amount without calling the API", async () => {
    const user = userEvent.setup();
    const onDone = jest.fn();

    renderWithClient(<TransactionForm onDone={onDone} />);

    await user.type(screen.getByLabelText(/amount/i), "-5");
    await user.click(screen.getByRole("button", { name: /add transaction/i }));

    expect(await screen.findByText(/amount must be greater than zero/i)).toBeInTheDocument();
    expect(mockedApiFetch).not.toHaveBeenCalledWith(
      "/transactions",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("submits a valid expense and calls onDone", async () => {
    const user = userEvent.setup();
    const onDone = jest.fn();
    mockedApiFetch.mockImplementation((path: string, options?: { method?: string }) => {
      if (path === "/categories") {
        return Promise.resolve([]);
      }
      if (path === "/transactions" && options?.method === "POST") {
        return Promise.resolve({ id: "tx-1" });
      }
      return Promise.resolve({});
    });

    renderWithClient(<TransactionForm onDone={onDone} />);

    await user.type(screen.getByLabelText(/amount/i), "450");
    await user.click(screen.getByRole("button", { name: /add transaction/i }));

    await waitFor(() =>
      expect(mockedApiFetch).toHaveBeenCalledWith(
        "/transactions",
        expect.objectContaining({ method: "POST", body: expect.objectContaining({ amountNu: 450 }) }),
      ),
    );
    await waitFor(() => expect(onDone).toHaveBeenCalled());
  });
});
