import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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

const { useAuth } = await import("../../hooks/useAuth");
const { useGame } = await import("../../hooks/useGame");
const { useOperations } = await import("../../hooks/useOperations");

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

    vi.mocked(useAuth).mockReturnValue({ user } as ReturnType<typeof useAuth>);
    vi.mocked(useGame).mockReturnValue({ count: 5000 } as ReturnType<
      typeof useGame
    >);
    vi.mocked(useOperations).mockReturnValue({
      buySupplies: vi.fn(),
      buyGold: vi.fn(),
      buyAutoprinter: vi.fn(),
      buyAutoBuySupplies: vi.fn(),
      toggleAutoBuySupplies: vi.fn(),
      increaseCreditGeneration: vi.fn(),
      increaseCreditCapacity: vi.fn(),
    } as ReturnType<typeof useOperations>);
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
