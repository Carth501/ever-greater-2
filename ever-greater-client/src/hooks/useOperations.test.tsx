import { act, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "../api/client";
import * as operationsApi from "../api/operations";
import { mockUser } from "../tests/fixtures";
import { createTestStore } from "../tests/utils/testStore";
import { useOperations } from "./useOperations";

vi.mock("../api/operations");

const mockOperationsApi = vi.mocked(operationsApi);

function createWrapper() {
  const store = createTestStore();

  return function Wrapper({ children }: PropsWithChildren) {
    return <Provider store={store}>{children}</Provider>;
  };
}

describe("useOperations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("binds manifest-defined operations to dispatch", async () => {
    mockOperationsApi.buySupplies.mockResolvedValueOnce(mockUser());

    const { result } = renderHook(() => useOperations(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.buySupplies();
    });

    await waitFor(() => {
      expect(mockOperationsApi.buySupplies).toHaveBeenCalledOnce();
    });
  });

  it("applies manifest validation before dispatching", () => {
    const onError = vi.fn<(message: string) => void>();

    const { result } = renderHook(() => useOperations(onError), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.buyGold(0);
    });

    expect(onError).toHaveBeenCalledWith(
      "Invalid quantity. Must be a positive integer.",
    );
    expect(mockOperationsApi.buyGold).not.toHaveBeenCalled();
  });

  it("surfaces rejected operation errors through the shared runner", async () => {
    const onError = vi.fn<(message: string) => void>();
    mockOperationsApi.increaseCreditCapacity.mockRejectedValueOnce(
      new DomainError("Not enough ticket capacity", 403, {
        code: "INSUFFICIENT_RESOURCES",
      }),
    );

    const { result } = renderHook(() => useOperations(onError), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.increaseCreditCapacity();
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith("Not enough ticket capacity");
    });
  });
});
