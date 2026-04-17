import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAuth } from "../../hooks/useAuth";
import { useGame } from "../../hooks/useGame";
import { useOperations } from "../../hooks/useOperations";
import { mockUser } from "../../tests/fixtures";
import Shop from "./Shop";

vi.mock("../../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../hooks/useGame", () => ({
  useGame: vi.fn(),
}));

vi.mock("../../hooks/useOperations", () => ({
  useOperations: vi.fn(),
}));

type AuthHookValue = ReturnType<typeof useAuth>;
type GameHookValue = ReturnType<typeof useGame>;
type OperationsHookValue = ReturnType<typeof useOperations>;

describe("Shop", () => {
  function mockDependencies(userOverrides = {}) {
    const user = mockUser({
      tickets_contributed: 600,
      tickets_withdrawn: 50,
      money: 1000,
      gold: 200,
      autoprinters: 3,
      credit_value: 200,
      credit_generation_level: 2,
      credit_capacity_level: 3,
      auto_buy_supplies_purchased: true,
      auto_buy_supplies_active: true,
      ...userOverrides,
    });

    const authValue: AuthHookValue = {
      user,
      isCheckingAuth: false,
      isLoading: false,
      error: null,
      errorCode: null,
      errorDetail: null,
      login: vi.fn<(email: string, password: string) => void>(),
      logout: vi.fn<() => void>(),
      signup: vi.fn<(email: string, password: string) => void>(),
    };

    const gameValue: GameHookValue = {
      count: 5000,
      error: null,
      isLoading: false,
      supplies: user.printer_supplies,
      manualPrintQuantity: 1,
      isPrintDisabled: false,
      printTicket: vi.fn<() => void>(),
    };

    const operationsValue: OperationsHookValue = {
      isLoading: false,
      error: null,
      errorCode: null,
      errorDetail: null,
      buySupplies: vi.fn<() => void>(),
      buyGold: vi.fn<(quantity: number) => void>(),
      buyAutoprinter: vi.fn<() => void>(),
      buyAutoBuySupplies: vi.fn<() => void>(),
      toggleAutoBuySupplies: vi.fn<(active: boolean) => void>(),
      increaseCreditGeneration: vi.fn<() => void>(),
      increaseManualPrintBatch: vi.fn<() => void>(),
      increaseSuppliesBatch: vi.fn<() => void>(),
      increaseCreditCapacity: vi.fn<() => void>(),
    };

    vi.mocked(useAuth).mockReturnValue(authValue);
    vi.mocked(useGame).mockReturnValue(gameValue);
    vi.mocked(useOperations).mockReturnValue({
      ...operationsValue,
    });
  }

  it("renders consumable purchases only", () => {
    mockDependencies();

    render(<Shop />);

    expect(screen.getByRole("heading", { name: "Shop" })).toBeTruthy();
    expect(screen.getByText("Gold", { exact: true })).toBeTruthy();
    expect(screen.getByText("Up to 200 Supplies")).toBeTruthy();
    expect(screen.queryByText("Auto-Buy Supplies")).toBeNull();
    expect(screen.queryByText("Increase Credit Generation")).toBeNull();
    expect(screen.queryByText("Increase Credit Capacity")).toBeNull();
    expect(screen.queryByText("Autoprinter")).toBeNull();
  });

  it("keeps money-to-gold purchases locked behind the existing threshold", () => {
    mockDependencies({ tickets_contributed: 150 });

    render(<Shop />);

    expect(screen.queryByText("Gold", { exact: true })).toBeNull();
    expect(screen.getByText("Up to 200 Supplies")).toBeTruthy();
  });

  it("shows partial supplies purchases when gold is below the upgraded batch cap", () => {
    mockDependencies({ gold: 3, supplies_batch_level: 2 });

    render(<Shop />);

    expect(screen.getByText("Up to 800 Supplies")).toBeTruthy();
    expect(
      screen.getByText("Current purchase: 600 supplies for 3g"),
    ).toBeTruthy();
  });
});
