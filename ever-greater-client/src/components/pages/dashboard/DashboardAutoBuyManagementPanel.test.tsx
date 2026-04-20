import { fireEvent, render, screen } from "@testing-library/react";
import {
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
    increaseCreditCapacity: vi.fn<() => void>(),
    ...overrides,
  };
}

describe("DashboardAutoBuyManagementPanel", () => {
  beforeEach(() => {
    mockedUseOperations.mockReturnValue(createOperationsMockValue());
  });

  it("saves updated threshold rules through configureAutoBuy", () => {
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

    fireEvent.change(screen.getByLabelText(/threshold/i), {
      target: { value: "18" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save settings/i }));

    expect(configureAutoBuy).toHaveBeenCalledWith({
      resourceKey: "printer_supplies",
      threshold: 18,
      scaleMode: AutoBuyScaleMode.MAX,
      scaleValue: 0,
    });
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
