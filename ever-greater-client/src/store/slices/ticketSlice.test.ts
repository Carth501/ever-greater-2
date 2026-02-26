import { configureStore } from "@reduxjs/toolkit";
import * as ticketApi from "../../api/globalTicket";
import ticketReducer, {
  clearError,
  fetchCountThunk,
  incrementCountThunk,
  TicketState,
  updateCount,
} from "./ticketSlice";

jest.mock("../../api/globalTicket");

const mockTicketApi = ticketApi as jest.Mocked<typeof ticketApi>;

describe("ticketSlice", () => {
  const initialState: TicketState = {
    count: 0,
    isLoading: false,
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
    let store: ReturnType<typeof configureStore>;

    beforeEach(() => {
      store = configureStore({
        reducer: { ticket: ticketReducer },
      });
      jest.clearAllMocks();
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

    it("should increment count successfully", async () => {
      const mockNewCount = 101;
      const mockNewSupplies = 99;
      const stateWithCount: TicketState = { ...initialState, count: 100 };
      store = configureStore({
        reducer: { ticket: ticketReducer },
        preloadedState: { ticket: stateWithCount },
      });

      mockTicketApi.incrementGlobalCount.mockResolvedValueOnce({
        count: mockNewCount,
        supplies: mockNewSupplies,
        money: 0,
      });

      await store.dispatch(incrementCountThunk() as any);

      const state = (store.getState() as { ticket: TicketState }).ticket;
      expect(state.isLoading).toBe(false);
      expect(state.count).toBe(mockNewCount);
      expect(state.error).toBeNull();
    });

    it("should handle increment error (not authenticated)", async () => {
      const errorMessage = "Not authenticated";
      mockTicketApi.incrementGlobalCount.mockRejectedValueOnce(
        new Error(errorMessage),
      );

      await store.dispatch(incrementCountThunk() as any);

      const state = (store.getState() as { ticket: TicketState }).ticket;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });

    it("should handle increment error (out of supplies)", async () => {
      const errorMessage = "Out of supplies";
      mockTicketApi.incrementGlobalCount.mockRejectedValueOnce(
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

    it("should set new count on incrementCountThunk.fulfilled", () => {
      const stateWithCount: TicketState = { ...initialState, count: 100 };
      const newCount = 101;
      const state = ticketReducer(
        stateWithCount,
        incrementCountThunk.fulfilled(newCount, ""),
      );
      expect(state.isLoading).toBe(false);
      expect(state.count).toBe(newCount);
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
        error: "Previous error",
      };
      const state = ticketReducer(stateWithError, updateCount(42));
      expect(state.error).toBeNull();
      expect(state.count).toBe(42);
    });
  });
});
