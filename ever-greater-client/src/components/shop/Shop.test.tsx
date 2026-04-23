import { createEvent, fireEvent, render, screen } from "@testing-library/react";
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

    return { authValue, gameValue, operationsValue };
  }

  it("renders consumable purchases only", () => {
    mockDependencies();

    render(<Shop />);

    expect(screen.getByRole("heading", { name: "Shop" })).toBeTruthy();
    expect(screen.getByText("Gold", { exact: true })).toBeTruthy();
    expect(screen.getByText("Up to 200 Supplies")).toBeTruthy();
    expect(screen.queryByText("Buy Gem")).toBeNull();
    expect(screen.queryByText("Auto-Buy Supplies")).toBeNull();
    expect(screen.queryByText("Increase Credit Generation")).toBeNull();
    expect(screen.queryByText("Increase Credit Capacity")).toBeNull();
    expect(screen.queryByText("Autoprinter")).toBeNull();
  });

  it("unlocks the gem shop after reaching 2000 ticket capacity", () => {
    mockDependencies({ tickets_contributed: 2000, tickets_withdrawn: 50 });

    render(<Shop />);

    expect(screen.getByText("Buy Gem")).toBeTruthy();
    expect(screen.getByText(/Gems Owned:/)).toBeTruthy();
    expect(screen.getByText("Cost: 2000 tickets")).toBeTruthy();
  });

  it("keeps money-to-gold purchases locked behind the existing threshold", () => {
    mockDependencies({ tickets_contributed: 150 });

    render(<Shop />);

    expect(screen.queryByText("Gold", { exact: true })).toBeNull();
    expect(screen.getByText("Up to 200 Supplies")).toBeTruthy();
    expect(screen.queryByText("Buy Gem")).toBeNull();
  });

  it("shows partial supplies purchases when gold is below the upgraded batch cap", () => {
    mockDependencies({ gold: 3, supplies_batch_level: 2 });

    render(<Shop />);

    expect(screen.getByText("Up to 800 Supplies")).toBeTruthy();
    expect(
      screen.getByText("Current purchase: 600 supplies for 3g"),
    ).toBeTruthy();
  });

  it("enables gold buying only when the entered quantity is affordable", () => {
    const { operationsValue } = mockDependencies();

    render(<Shop />);

    const quantityInput = screen.getByLabelText("Gold quantity");
    const buyGoldButton = screen.getByRole("button", { name: "Buy Gold" });

    fireEvent.change(quantityInput, { target: { value: "11" } });
    expect((buyGoldButton as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(quantityInput, { target: { value: "10" } });
    expect((buyGoldButton as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(buyGoldButton);

    expect(operationsValue.buyGold).toHaveBeenCalledWith(10);
  });

  it("keeps the entered gold quantity after a purchase rerender", () => {
    const { authValue, operationsValue } = mockDependencies();

    const { rerender } = render(<Shop />);
    const quantityInput = screen.getByLabelText(
      "Gold quantity",
    ) as HTMLInputElement;

    fireEvent.change(quantityInput, { target: { value: "7" } });
    fireEvent.click(screen.getByRole("button", { name: "Buy Gold" }));

    expect(operationsValue.buyGold).toHaveBeenCalledWith(7);

    const currentUser = authValue.user;
    if (!currentUser) {
      throw new Error("Expected auth user for rerender test");
    }

    vi.mocked(useAuth).mockReturnValue({
      ...authValue,
      user: mockUser({
        ...currentUser,
        money: 300,
        gold: (currentUser.gold ?? 0) + 7,
      }),
    });

    rerender(<Shop />);

    expect(
      (screen.getByLabelText("Gold quantity") as HTMLInputElement).value,
    ).toBe("7");
    expect(
      (screen.getByRole("button", { name: "Buy Gold" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it("adjusts the gold quantity and consumes mouse wheel scrolling while hovered", () => {
    mockDependencies();

    render(<Shop />);

    const quantityInput = screen.getByLabelText(
      "Gold quantity",
    ) as HTMLInputElement;

    const increaseWheelEvent = createEvent.wheel(quantityInput, {
      deltaY: -100,
      cancelable: true,
    });
    const increasePreventDefault = vi.fn();
    increaseWheelEvent.preventDefault = increasePreventDefault;

    fireEvent(quantityInput, increaseWheelEvent);

    expect(increasePreventDefault).toHaveBeenCalled();
    expect(quantityInput.value).toBe("2");

    const decreaseWheelEvent = createEvent.wheel(quantityInput, {
      deltaY: 100,
      cancelable: true,
    });
    const decreasePreventDefault = vi.fn();
    decreaseWheelEvent.preventDefault = decreasePreventDefault;

    fireEvent(quantityInput, decreaseWheelEvent);

    expect(decreasePreventDefault).toHaveBeenCalled();
    expect(quantityInput.value).toBe("1");

    fireEvent.wheel(quantityInput, { deltaY: 100 });
    expect(quantityInput.value).toBe("1");
  });
});
