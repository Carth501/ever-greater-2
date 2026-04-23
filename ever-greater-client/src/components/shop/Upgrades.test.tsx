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
      buyGem: vi.fn<() => void>(),
      buyAutoprinter: vi.fn<() => void>(),
      buyAutoBuySupplies: vi.fn<() => void>(),
      toggleAutoBuySupplies: vi.fn<(active: boolean) => void>(),
      configureAutoBuy: vi.fn<(params: unknown) => void>(),
      increaseCreditGeneration: vi.fn<() => void>(),
      increaseTicketBatch: vi.fn<() => void>(),
      increaseManualPrintBatch: vi.fn<() => void>(),
      increaseSuppliesBatch: vi.fn<() => void>(),
      increaseMoneyPerTicket: vi.fn<() => void>(),
      increaseCreditCapacityAmount: vi.fn<() => void>(),
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
    expect(screen.queryByText("Auto-Buy Supplies")).toBeNull();
    expect(screen.getByText("Increase Ticket Batch Scale")).toBeTruthy();
    expect(screen.getByText("Increase Manual Print Batch")).toBeTruthy();
    expect(screen.getByText("Increase Supplies Batch")).toBeTruthy();
    expect(screen.getByText("Increase Credit Generation")).toBeTruthy();
    expect(screen.getByText("Increase Credit Capacity Amount")).toBeTruthy();
    expect(screen.getByText("Increase Credit Capacity")).toBeTruthy();
    expect(screen.getByText("Cost: 3g")).toBeTruthy();
    expect(screen.getByText("Cost: 20g + 0 gems · Lvl 0")).toBeTruthy();
    expect(screen.getByText("Cost: 251 tickets")).toBeTruthy();
    expect(screen.getByText("Autoprinter")).toBeTruthy();
    expect(screen.getByText("Cost: 320 credit")).toBeTruthy();
    expect(screen.queryByText("200 Supplies")).toBeNull();
    expect(screen.queryByText("Gold", { exact: true })).toBeNull();
    expect(screen.queryByText("Buy Gem")).toBeNull();
    expect(screen.queryByText("Increase Money Per Ticket")).toBeNull();
  });

  it("keeps the autoprinter upgrade behind the existing late-game threshold", () => {
    mockDependencies({ tickets_contributed: 400 });

    render(<Upgrades />);

    expect(screen.queryByText("Autoprinter")).toBeNull();
    expect(screen.queryByText("Auto-Buy Supplies")).toBeNull();
    expect(screen.getByText("Increase Ticket Batch Scale")).toBeTruthy();
    expect(screen.getByText("Increase Manual Print Batch")).toBeTruthy();
    expect(screen.getByText("Increase Supplies Batch")).toBeTruthy();
    expect(screen.getByText("Increase Credit Capacity Amount")).toBeTruthy();
    expect(screen.getByText("Increase Credit Capacity")).toBeTruthy();
    expect(screen.queryByText("Buy Gem")).toBeNull();
    expect(screen.queryByText("Increase Money Per Ticket")).toBeNull();
  });

  it("unlocks gem upgrades once the player reaches 2000 ticket capacity", () => {
    mockDependencies({ tickets_contributed: 2000, gems: 12 });

    render(<Upgrades />);

    expect(screen.getByText("Increase Money Per Ticket")).toBeTruthy();
    expect(screen.getByText("Cost: 3 gems · Lvl 0")).toBeTruthy();
    expect(
      screen.getByText("Raises each printed ticket from 1 money to 2 money."),
    ).toBeTruthy();
  });

  it("shows the auto-buy upgrade when it has not been purchased yet", () => {
    mockDependencies({
      auto_buy_supplies_purchased: false,
      auto_buy_supplies_active: false,
    });

    render(<Upgrades />);

    expect(screen.getByText("Auto-Buy Supplies")).toBeTruthy();
    expect(screen.getByText("Cost: 10g")).toBeTruthy();
  });

  it("shows the scaled general ticket batch upgrade cost for the current level", () => {
    mockDependencies({ ticket_batch_level: 2, autoprinters: 3, gold: 30 });

    render(<Upgrades />);

    expect(screen.getByText("Cost: 40g · Lvl 2")).toBeTruthy();
    expect(
      screen.getByText(
        "Doubles all ticket printing. Manual presses go from 4 tickets to 8 tickets. Autoprinter cycles go from 12 tickets to 24 tickets.",
      ),
    ).toBeTruthy();
  });

  it("shows the scaled manual print batch upgrade cost for the current level", () => {
    mockDependencies({ manual_print_batch_level: 2, gold: 30 });

    render(<Upgrades />);

    expect(screen.getByText("Cost: 30g · Lvl 2")).toBeTruthy();
    expect(
      screen.getByText(
        "Increases each manual print from 3 tickets to 4 tickets per press.",
      ),
    ).toBeTruthy();
  });

  it("shows the scaled supplies batch upgrade cost for the current level", () => {
    mockDependencies({ supplies_batch_level: 2, gold: 30 });

    render(<Upgrades />);

    expect(screen.getByText("Cost: 40g · Lvl 2")).toBeTruthy();
  });

  it("shows scaled credit upgrade costs for the current levels", () => {
    mockDependencies({
      credit_generation_level: 5,
      credit_capacity_level: 2,
      credit_capacity_amount_level: 2,
      gold: 50,
      gems: 20,
      tickets_contributed: 800,
      tickets_withdrawn: 0,
    });

    render(<Upgrades />);

    expect(screen.getByText("Cost: 7g")).toBeTruthy();
    expect(screen.getByText("Cost: 22g + 20 gems · Lvl 2")).toBeTruthy();
    expect(screen.getByText("Cost: 228 tickets")).toBeTruthy();
  });

  it("shows the scaled gem upgrade cost for the current level", () => {
    mockDependencies({
      tickets_contributed: 2000,
      gems: 100,
      money_per_ticket_level: 2,
    });

    render(<Upgrades />);

    expect(screen.getByText("Cost: 27 gems · Lvl 2")).toBeTruthy();
    expect(
      screen.getByText("Raises each printed ticket from 3 money to 4 money."),
    ).toBeTruthy();
  });
});
