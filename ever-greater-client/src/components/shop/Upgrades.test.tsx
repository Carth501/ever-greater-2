import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAuth } from "../../hooks/useAuth";
import { useGame } from "../../hooks/useGame";
import { useOperations } from "../../hooks/useOperations";
import { mockUser } from "../../tests/fixtures";
import Upgrades from "./Upgrades";

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

describe("Upgrades", () => {
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
      increaseCreditCapacity: vi.fn<() => void>(),
    };

    vi.mocked(useAuth).mockReturnValue(authValue);
    vi.mocked(useGame).mockReturnValue(gameValue);
    vi.mocked(useOperations).mockReturnValue({
      ...operationsValue,
    });
  }

  it("renders permanent upgrades only", () => {
    mockDependencies();

    render(<Upgrades />);

    expect(screen.getByRole("heading", { name: "Upgrades" })).toBeTruthy();
    expect(screen.getByText("Auto-Buy Supplies")).toBeTruthy();
    expect(screen.getByText("Increase Credit Generation")).toBeTruthy();
    expect(screen.getByText("Increase Credit Capacity")).toBeTruthy();
    expect(screen.getByText("Autoprinter")).toBeTruthy();
    expect(screen.queryByText("200 Supplies")).toBeNull();
    expect(screen.queryByText("Gold", { exact: true })).toBeNull();
  });

  it("keeps the autoprinter upgrade behind the existing late-game threshold", () => {
    mockDependencies({ tickets_contributed: 400 });

    render(<Upgrades />);

    expect(screen.queryByText("Autoprinter")).toBeNull();
    expect(screen.getByText("Auto-Buy Supplies")).toBeTruthy();
    expect(screen.getByText("Increase Credit Capacity")).toBeTruthy();
  });
});
