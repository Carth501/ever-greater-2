import { describe, expect, it } from "vitest";
import { mockUser } from "../../../tests/fixtures";
import { buildDashboardViewModel, getDashboardSignalState } from "./viewModel";

describe("dashboard view model", () => {
  it("returns preview state when no live user is present", () => {
    const model = buildDashboardViewModel(
      {
        user: null,
        count: 12,
        isTicketLoading: false,
        supplies: 0,
        isPrintDisabled: true,
      },
      {
        isConnected: false,
        isReconnecting: false,
        lastUpdateAt: null,
        clock: 10_000,
      },
    );

    expect(model.hasLiveUser).toBe(false);
    expect(model.signalState).toBe("preview");
    expect(model.signalLabel).toBe("Preview data");
    expect(model.printButtonDisabled).toBe(true);
  });

  it("computes live dashboard recommendations from user state", () => {
    const model = buildDashboardViewModel(
      {
        user: mockUser({
          printer_supplies: 0,
          tickets_contributed: 600,
          tickets_withdrawn: 550,
          auto_buy_supplies_purchased: true,
          auto_buy_supplies_active: false,
          autoprinters: 3,
        }),
        count: 500,
        isTicketLoading: false,
        supplies: 0,
        isPrintDisabled: true,
      },
      {
        isConnected: true,
        isReconnecting: false,
        lastUpdateAt: 9_500,
        clock: 10_000,
      },
    );

    expect(model.signalState).toBe("healthy");
    expect(model.remainingCapacity).toBe(50);
    expect(model.bestWindow).toBe("Refill needed");
    expect(model.suggestedFocus).toBe("Refill supplies");
    expect(model.automationMix).toBeGreaterThan(0);
  });

  it("derives scaled credit upgrade costs from the shared operation definitions", () => {
    const model = buildDashboardViewModel(
      {
        user: mockUser({
          credit_generation_level: 5,
          credit_capacity_level: 2,
          autoprinters: 3,
          tickets_contributed: 800,
          tickets_withdrawn: 100,
          gold: 20,
        }),
        count: 500,
        isTicketLoading: false,
        supplies: 100,
        isPrintDisabled: false,
      },
      {
        isConnected: true,
        isReconnecting: false,
        lastUpdateAt: 9_500,
        clock: 10_000,
      },
    );

    expect(model.creditGenerationCost).toBe(7);
    expect(model.creditCapacityCost).toBe(228);
    expect(model.autoprinterCost).toBe(320);
  });

  it("identifies late realtime updates", () => {
    expect(
      getDashboardSignalState({
        hasLiveUser: true,
        isConnected: true,
        isReconnecting: false,
        lastUpdateAt: 1_000,
        clock: 9_000,
      }),
    ).toBe("late");
  });
});
