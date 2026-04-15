import { beforeEach, describe, expect, it, vi } from "vitest";
import * as ticketApi from "../../api/globalTicket";
import * as operationsApi from "../../api/operations";
import { mockUser } from "../../tests/fixtures";
import { createTestStore } from "../../tests/utils/testStore";
import ticketReducer, {
  clearError,
  fetchCountThunk,
  incrementCountThunk,
  TicketState,
  updateCount,
} from "./ticketSlice";

vi.mock("../../api/globalTicket");
vi.mock("../../api/operations");

const mockTicketApi = ticketApi as any;
const mockOperationsApi = operationsApi as any;

describe("ticketSlice", () => {
  const initialState: TicketState = {
    count: 0,
    isLoading: false,
    pendingRequestCount: 0,
    error: null,
  };

  describe("reducers", () => {
    it("should update count", () => {
      const state = ticketReducer(initialState, updateCount(42));
      expect(state.count).toBe(42);
      expect(state.error).toBeNull();
    });

    it("should clear error", () => {
      const stateWithError: TicketState = {
        ...initialState,
        error: "Some error",
      };
      const state = ticketReducer(stateWithError, clearError());
      expect(state.error).toBeNull();
    });
  });

  describe("thunks with store", () => {
    let store: ReturnType<typeof createTestStore>;

    beforeEach(() => {
      store = createTestStore();
      vi.clearAllMocks();
    });

    it("should fetch the global count successfully", async () => {
      const mockCount = 1000;
      mockTicketApi.fetchGlobalCount.mockResolvedValueOnce(mockCount);

      await store.dispatch(fetchCountThunk() as any);

      const state = (store.getState() as { ticket: TicketState }).ticket;
      expect(state.isLoading).toBe(false);
      expect(state.count).toBe(mockCount);
      expect(state.error).toBeNull();
    });

    it("should handle fetch error", async () => {
      const errorMessage = "Failed to fetch count";
      mockTicketApi.fetchGlobalCount.mockRejectedValueOnce(
        new Error(errorMessage),
      );

      await store.dispatch(fetchCountThunk() as any);

      const state = (store.getState() as { ticket: TicketState }).ticket;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });

    it("should print ticket successfully", async () => {
      const stateWithCount: TicketState = { ...initialState, count: 100 };
      store = createTestStore({
        preloadedState: { ticket: stateWithCount },
      });

      const mockUpdatedUser = mockUser({
        tickets_contributed: 1,
        printer_supplies: 99,
        money: 1,
      });

      mockOperationsApi.printTicket.mockResolvedValueOnce(mockUpdatedUser);

      await store.dispatch(incrementCountThunk() as any);

      const state = (store.getState() as { ticket: TicketState }).ticket;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("should handle print ticket error (not authenticated)", async () => {
      const errorMessage = "Not authenticated";
      mockOperationsApi.printTicket.mockRejectedValueOnce(
        new Error(errorMessage),
      );

      await store.dispatch(incrementCountThunk() as any);

      const state = (store.getState() as { ticket: TicketState }).ticket;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });

    it("should handle print ticket error (insufficient resources)", async () => {
      const errorMessage = "Insufficient resources";
      mockOperationsApi.printTicket.mockRejectedValueOnce(
        new Error(errorMessage),
      );

      await store.dispatch(incrementCountThunk() as any);

      const state = (store.getState() as { ticket: TicketState }).ticket;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe("reducer state updates", () => {
    it("should set isLoading on fetchCountThunk.pending", () => {
      const state = ticketReducer(initialState, fetchCountThunk.pending(""));
      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    it("should set count on fetchCountThunk.fulfilled", () => {
      const mockCount = 999;
      const state = ticketReducer(
        initialState,
        fetchCountThunk.fulfilled(mockCount, ""),
      );
      expect(state.isLoading).toBe(false);
      expect(state.count).toBe(mockCount);
      expect(state.error).toBeNull();
    });

    it("should set error on fetchCountThunk.rejected", () => {
      const errorMessage = "Network error";
      const state = ticketReducer(
        initialState,
        fetchCountThunk.rejected(null, "", undefined, errorMessage),
      );
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });

    it("should set isLoading on incrementCountThunk.pending", () => {
      const state = ticketReducer(
        initialState,
        incrementCountThunk.pending(""),
      );
      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    it("should not update count on incrementCountThunk.fulfilled", () => {
      const stateWithCount: TicketState = { ...initialState, count: 100 };
      const state = ticketReducer(
        stateWithCount,
        incrementCountThunk.fulfilled(
          {
            printer_supplies: 10,
            money: 5,
            gold: 1,
            autoprinters: 0,
          },
          "",
        ),
      );
      expect(state.isLoading).toBe(false);
      expect(state.count).toBe(100);
      expect(state.error).toBeNull();
    });

    it("should set error on incrementCountThunk.rejected", () => {
      const errorMessage = "Failed to increment";
      const state = ticketReducer(
        initialState,
        incrementCountThunk.rejected(null, "", undefined, errorMessage),
      );
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });

    it("should not lose count when error occurs", () => {
      const stateWithCount: TicketState = { ...initialState, count: 50 };
      const state = ticketReducer(
        stateWithCount,
        incrementCountThunk.rejected(null, "", undefined, "Error"),
      );
      expect(state.count).toBe(50);
    });
  });

  describe("edge cases", () => {
    it("should handle zero count", () => {
      const state = ticketReducer(initialState, updateCount(0));
      expect(state.count).toBe(0);
    });

    it("should handle large count values", () => {
      const largeCount = 999999999;
      const state = ticketReducer(initialState, updateCount(largeCount));
      expect(state.count).toBe(largeCount);
    });

    it("should clear error when count is updated", () => {
      const stateWithError: TicketState = {
        count: 0,
        isLoading: false,
        pendingRequestCount: 0,
        error: "Previous error",
      };
      const state = ticketReducer(stateWithError, updateCount(42));
      expect(state.error).toBeNull();
      expect(state.count).toBe(42);
    });
  });
});
