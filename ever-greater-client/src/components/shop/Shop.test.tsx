import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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

const { useAuth } = await import("../../hooks/useAuth");
const { useGame } = await import("../../hooks/useGame");
const { useOperations } = await import("../../hooks/useOperations");

describe("Shop", () => {
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
  });

  it("toggles live shop groups off and on", () => {
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

    render(<Shop />);

    expect(screen.getByText("Gold Available:", { exact: false })).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: /hide gold & supplies/i }),
    );

    expect(screen.queryByText("Gold Available:", { exact: false })).toBeNull();
    expect(
      screen.getByRole("button", { name: /show gold & supplies/i }),
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: /show gold & supplies/i }),
    );

    expect(screen.getByText("Gold Available:", { exact: false })).toBeTruthy();
  });
});
