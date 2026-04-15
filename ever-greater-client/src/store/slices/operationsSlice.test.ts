import { beforeEach, describe, expect, it, vi } from "vitest";
import * as authApi from "../../api/auth";
import { DomainError } from "../../api/client";
import * as operationsApi from "../../api/operations";
import { mockUser } from "../../tests/fixtures";
import { createTestStore } from "../../tests/utils/testStore";
import operationsReducer, {
  buyGoldThunk,
  buySuppliesThunk,
  clearError,
  OperationsState,
  toggleAutoBuySuppliesThunk,
} from "./operationsSlice";

vi.mock("../../api/auth");
vi.mock("../../api/operations");

const mockAuthApi = authApi as any;
const mockOperationsApi = operationsApi as any;

describe("operationsSlice", () => {
  const initialState: OperationsState = {
    isLoading: false,
    pendingRequestCount: 0,
    error: null,
  };

  describe("reducers", () => {
    it("should clear error", () => {
      const state: OperationsState = {
        ...initialState,
        error: "Purchase failed",
      };

      const nextState = operationsReducer(state, clearError());
      expect(nextState.error).toBeNull();
    });
  });

  describe("thunks with store", () => {
    let store: ReturnType<typeof createTestStore>;

    beforeEach(() => {
      vi.clearAllMocks();
      store = createTestStore();
    });

    it("should track loading state for successful shop operations", async () => {
      mockOperationsApi.buySupplies.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockUser()), 25);
          }),
      );

      const promise = store.dispatch(buySuppliesThunk() as any);

      let state = store.getState();
      expect(state.operations.isLoading).toBe(true);
      expect(state.operations.pendingRequestCount).toBe(1);
      expect(state.operations.error).toBeNull();

      await promise;

      state = store.getState();
      expect(state.operations.isLoading).toBe(false);
      expect(state.operations.pendingRequestCount).toBe(0);
      expect(state.operations.error).toBeNull();
    });

    it("should store operation errors in operations state", async () => {
      mockOperationsApi.buyGold.mockRejectedValueOnce(
        new DomainError("Invalid quantity", 400, {
          code: "INVALID_REQUEST",
          detail: "quantity must be a positive integer",
        }),
      );

      await store.dispatch(buyGoldThunk(0) as any);

      const state = store.getState();
      expect(state.operations.isLoading).toBe(false);
      expect(state.operations.pendingRequestCount).toBe(0);
      expect(state.operations.error).toBe("Invalid quantity");
      expect(state.operations.errorCode).toBe("INVALID_REQUEST");
      expect(state.operations.errorDetail).toBe(
        "quantity must be a positive integer",
      );
    });

    it("should keep concurrent operation requests isolated from auth loading", async () => {
      mockOperationsApi.buySupplies.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockUser()), 25);
          }),
      );
      mockAuthApi.setAutoBuySuppliesActive.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve(
                  mockUser({
                    auto_buy_supplies_purchased: true,
                    auto_buy_supplies_active: false,
                  }),
                ),
              25,
            );
          }),
      );

      const firstRequest = store.dispatch(buySuppliesThunk() as any);
      const secondRequest = store.dispatch(
        toggleAutoBuySuppliesThunk(false) as any,
      );

      let state = store.getState();
      expect(state.operations.isLoading).toBe(true);
      expect(state.operations.pendingRequestCount).toBe(2);
      expect(state.auth.isLoading).toBe(false);

      await Promise.all([firstRequest, secondRequest]);

      state = store.getState();
      expect(state.operations.isLoading).toBe(false);
      expect(state.operations.pendingRequestCount).toBe(0);
      expect(state.auth.isLoading).toBe(false);
    });
  });
});
