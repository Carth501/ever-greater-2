import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockUser } from "../../tests/fixtures";
import { dashboardContent } from "./dashboard/content";
import DashboardPage from "./DashboardPage";

vi.mock("../../hooks/useAuth", () => ({ useAuth: vi.fn() }));
vi.mock("../../hooks/useGame", () => ({ useGame: vi.fn() }));
vi.mock("../../hooks/useOperations", () => ({ useOperations: vi.fn() }));
vi.mock("../../hooks/useRealtime", () => ({ useRealtime: vi.fn() }));

import { useAuth } from "../../hooks/useAuth";
import { useGame } from "../../hooks/useGame";
import { useOperations } from "../../hooks/useOperations";
import { useRealtime } from "../../hooks/useRealtime";

const mockedUseAuth = vi.mocked(useAuth);
const mockedUseGame = vi.mocked(useGame);
const mockedUseOperations = vi.mocked(useOperations);
const mockedUseRealtime = vi.mocked(useRealtime);

type AuthHookValue = ReturnType<typeof useAuth>;
type GameHookValue = ReturnType<typeof useGame>;
type OperationsHookValue = ReturnType<typeof useOperations>;
type RealtimeHookValue = ReturnType<typeof useRealtime>;

let printTicketSpy: GameHookValue["printTicket"];

function createAuthMockValue(
  overrides: Partial<AuthHookValue> = {},
): AuthHookValue {
  return {
    user: mockUser({
      email: "operator@example.com",
      printer_supplies: 24,
      tickets_contributed: 1000,
      tickets_withdrawn: 100,
      auto_buy_supplies_purchased: true,
      auto_buy_supplies_active: true,
    }),
    isCheckingAuth: false,
    isLoading: false,
    error: null,
    errorCode: null,
    errorDetail: null,
    login: vi.fn<(email: string, password: string) => void>(),
    logout: vi.fn<() => void>(),
    signup: vi.fn<(email: string, password: string) => void>(),
    ...overrides,
  };
}

function createGameMockValue(
  overrides: Partial<GameHookValue> = {},
): GameHookValue {
  return {
    count: 321,
    error: null,
    isLoading: false,
    supplies: 24,
    manualPrintQuantity: 1,
    isPrintDisabled: false,
    printTicket: printTicketSpy,
    ...overrides,
  };
}

function createRealtimeMockValue(
  overrides: Partial<RealtimeHookValue> = {},
): RealtimeHookValue {
  return {
    isConnected: true,
    isReconnecting: false,
    lastUpdateAt: Date.now(),
    ...overrides,
  };
}

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
    configureAutoBuy:
      vi.fn<
        (
          params: OperationsHookValue["configureAutoBuy"] extends (
            arg: infer Arg,
          ) => void
            ? Arg
            : never,
        ) => void
      >(),
    increaseCreditGeneration: vi.fn<() => void>(),
    increaseTicketBatch: vi.fn<() => void>(),
    increaseManualPrintBatch: vi.fn<() => void>(),
    increaseSuppliesBatch: vi.fn<() => void>(),
    increaseMoneyPerTicket: vi.fn<() => void>(),
    increaseCreditCapacityAmount: vi.fn<() => void>(),
    increaseCreditCapacity: vi.fn<() => void>(),
    ...overrides,
  };
}

describe("DashboardPage accessibility gate", () => {
  beforeEach(() => {
    printTicketSpy = vi.fn<() => void>();
    mockedUseAuth.mockReturnValue(createAuthMockValue());
    mockedUseGame.mockReturnValue(createGameMockValue());
    mockedUseOperations.mockReturnValue(createOperationsMockValue());
    mockedUseRealtime.mockReturnValue(createRealtimeMockValue());
  });

  it("exposes stable landmark regions for screen-reader navigation", () => {
    render(<DashboardPage />);

    expect(
      screen.getByRole("main", { name: dashboardContent.mainRegionLabel }),
    ).toBeTruthy();

    expect(
      screen.getByRole("region", { name: dashboardContent.hero.regionLabel }),
    ).toBeTruthy();
    expect(
      screen.getByRole("region", {
        name: dashboardContent.toolbar.regionLabel,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("region", {
        name: dashboardContent.account.regionLabel,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("region", { name: dashboardContent.ticket.regionLabel }),
    ).toBeTruthy();
    expect(
      screen.getByRole("region", { name: dashboardContent.print.regionLabel }),
    ).toBeTruthy();
    expect(
      screen.getByRole("region", {
        name: dashboardContent.autoBuy.regionLabel,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("region", { name: dashboardContent.shop.regionLabel }),
    ).toBeTruthy();
    expect(
      screen.getByRole("region", { name: dashboardContent.status.regionLabel }),
    ).toBeTruthy();
    expect(
      screen.getByRole("region", {
        name: dashboardContent.insights.regionLabel,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("region", {
        name: dashboardContent.summary.regionLabel,
      }),
    ).toBeTruthy();
  });

  it("provides named panel visibility toggles for keyboard/screen-reader users", () => {
    render(<DashboardPage />);

    expect(
      screen.getByRole("checkbox", { name: /account visibility/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole("checkbox", { name: /ticket pool visibility/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole("checkbox", { name: /print controls visibility/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole("checkbox", {
        name: /auto-buy management visibility/i,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("checkbox", { name: /shop modules visibility/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole("checkbox", { name: /realtime health visibility/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole("checkbox", { name: /insights visibility/i }),
    ).toBeTruthy();
  });

  it("supports keyboard-only toggles and print activation", async () => {
    render(<DashboardPage />);

    const accountToggle = screen.getByRole("checkbox", {
      name: /account visibility/i,
    });

    await act(async () => {
      accountToggle.focus();
    });
    await act(async () => {
      await userEvent.keyboard("[Space]");
    });

    expect(
      screen.queryByRole("region", {
        name: dashboardContent.account.regionLabel,
      }),
    ).toBeNull();

    const printButton = screen.getByRole("button", { name: /print a ticket/i });
    await act(async () => {
      printButton.focus();
    });
    await act(async () => {
      await userEvent.keyboard("[Enter]");
    });

    expect(printTicketSpy).toHaveBeenCalledTimes(1);
  });
});
