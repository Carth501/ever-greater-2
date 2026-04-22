import { fireEvent, render, screen } from "@testing-library/react";
import {
  AutoBuyResourceKey,
  AutoBuyScaleMode,
  getDefaultAutoBuySettings,
} from "ever-greater-shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOperations } from "../../../hooks/useOperations";
import { mockUser } from "../../../tests/fixtures";
import { DashboardAutoBuyManagementPanel } from "./DashboardAutoBuyManagementPanel";

vi.mock("../../../hooks/useOperations", () => ({ useOperations: vi.fn() }));

const mockedUseOperations = vi.mocked(useOperations);

type OperationsHookValue = ReturnType<typeof useOperations>;

function createOperationsMockValue(
  overrides: Partial<OperationsHookValue> = {},
): OperationsHookValue {
  return {
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
    increaseCreditCapacity: vi.fn<() => void>(),
    ...overrides,
  };
}

describe("DashboardAutoBuyManagementPanel", () => {
  beforeEach(() => {
    mockedUseOperations.mockReturnValue(createOperationsMockValue());
  });

  it("saves updated printer supplies rules through configureAutoBuy", () => {
    const configureAutoBuy = vi.fn<(params: unknown) => void>();
    mockedUseOperations.mockReturnValue(
      createOperationsMockValue({ configureAutoBuy }),
    );

    render(
      <DashboardAutoBuyManagementPanel
        hasLiveUser
        manualPrintQuantity={4}
        user={mockUser({
          gold: 12,
          auto_buy_supplies_purchased: true,
          auto_buy_supplies_active: true,
          auto_buy_settings: getDefaultAutoBuySettings(),
        })}
      />,
    );

    fireEvent.change(screen.getByLabelText("Printer supplies threshold"), {
      target: { value: "18" },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: /save printer supplies settings/i,
      }),
    );

    expect(configureAutoBuy).toHaveBeenCalledWith({
      resourceKey: AutoBuyResourceKey.PRINTER_SUPPLIES,
      threshold: 18,
      scaleMode: AutoBuyScaleMode.MAX,
      scaleValue: 0,
    });
  });

  it("saves updated gold rules through configureAutoBuy", () => {
    const configureAutoBuy = vi.fn<(params: unknown) => void>();
    mockedUseOperations.mockReturnValue(
      createOperationsMockValue({ configureAutoBuy }),
    );

    render(
      <DashboardAutoBuyManagementPanel
        hasLiveUser
        manualPrintQuantity={4}
        user={mockUser({
          money: 1200,
          gold: 2,
          auto_buy_supplies_purchased: true,
          auto_buy_supplies_active: true,
          auto_buy_settings: getDefaultAutoBuySettings(),
        })}
      />,
    );

    fireEvent.change(screen.getByLabelText("Gold threshold"), {
      target: { value: "6" },
    });
    fireEvent.mouseDown(screen.getByRole("combobox", { name: "Gold scale" }));
    fireEvent.click(screen.getByRole("option", { name: "Custom Value" }));
    fireEvent.change(screen.getByLabelText("Money custom value"), {
      target: { value: "300" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /save gold settings/i }),
    );

    expect(configureAutoBuy).toHaveBeenCalledWith({
      resourceKey: AutoBuyResourceKey.GOLD,
      threshold: 6,
      scaleMode: AutoBuyScaleMode.CUSTOM_VALUE,
      scaleValue: 3,
    });
  });

  it("shows the gold custom value field using the automated operation spend resource", () => {
    render(
      <DashboardAutoBuyManagementPanel
        hasLiveUser
        manualPrintQuantity={4}
        user={mockUser({
          money: 1200,
          gold: 2,
          auto_buy_supplies_purchased: true,
          auto_buy_supplies_active: true,
          auto_buy_settings: {
            ...getDefaultAutoBuySettings(),
            gold: {
              threshold: 5,
              scaleMode: AutoBuyScaleMode.CUSTOM_VALUE,
              scaleValue: 3,
            },
          },
        })}
      />,
    );

    expect(
      (screen.getByLabelText("Money custom value") as HTMLInputElement).value,
    ).toBe("300");
  });

  it("shows gold preview action with money first and gold second", () => {
    render(
      <DashboardAutoBuyManagementPanel
        hasLiveUser
        manualPrintQuantity={4}
        user={mockUser({
          money: 623600,
          gold: 0,
          auto_buy_supplies_purchased: true,
          auto_buy_supplies_active: true,
          auto_buy_settings: {
            ...getDefaultAutoBuySettings(),
            gold: {
              threshold: 10,
              scaleMode: AutoBuyScaleMode.MAX,
              scaleValue: 0,
            },
          },
        })}
      />,
    );

    expect(screen.getByText("623,600 money")).toBeTruthy();
    expect(screen.getByText("6,236 gold at the current rate")).toBeTruthy();
  });

  it("delegates pause and resume actions through toggleAutoBuySupplies", () => {
    const toggleAutoBuySupplies = vi.fn<(active: boolean) => void>();
    mockedUseOperations.mockReturnValue(
      createOperationsMockValue({ toggleAutoBuySupplies }),
    );

    render(
      <DashboardAutoBuyManagementPanel
        hasLiveUser
        manualPrintQuantity={4}
        user={mockUser({
          auto_buy_supplies_purchased: true,
          auto_buy_supplies_active: true,
        })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /pause auto-buy/i }));

    expect(toggleAutoBuySupplies).toHaveBeenCalledWith(false);
  });
});
