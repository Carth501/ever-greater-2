import { renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { Provider } from "react-redux";
import { describe, expect, it } from "vitest";
import { mockUser } from "../tests/fixtures";
import { createTestStore } from "../tests/utils/testStore";
import { useGame } from "./useGame";

function createWrapper(userOverrides = {}) {
  const store = createTestStore({
    preloadedState: {
      auth: {
        user: mockUser(userOverrides),
        isCheckingAuth: false,
        isLoading: false,
        pendingRequestCount: 0,
        error: null,
      },
    },
  });

  return function Wrapper({ children }: PropsWithChildren) {
    return <Provider store={store}>{children}</Provider>;
  };
}

describe("useGame", () => {
  it("derives the manual print quantity from the user batch level", () => {
    const { result } = renderHook(() => useGame(), {
      wrapper: createWrapper({ manual_print_batch_level: 2 }),
    });

    expect(result.current.manualPrintQuantity).toBe(4);
  });

  it("disables printing when supplies are below the manual batch and auto-buy is unavailable", () => {
    const { result } = renderHook(() => useGame(), {
      wrapper: createWrapper({
        manual_print_batch_level: 2,
        printer_supplies: 2,
        auto_buy_supplies_purchased: false,
        auto_buy_supplies_active: false,
      }),
    });

    expect(result.current.isPrintDisabled).toBe(true);
  });

  it("keeps printing enabled when auto-buy can cover a missing batch", () => {
    const { result } = renderHook(() => useGame(), {
      wrapper: createWrapper({
        manual_print_batch_level: 2,
        printer_supplies: 2,
        auto_buy_supplies_purchased: true,
        auto_buy_supplies_active: true,
      }),
    });

    expect(result.current.isPrintDisabled).toBe(false);
  });
});
