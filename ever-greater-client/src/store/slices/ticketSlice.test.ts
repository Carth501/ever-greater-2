import { configureStore } from "@reduxjs/toolkit";
import * as ticketApi from "../../api/globalTicket";
import * as operationsApi from "../../api/operations";
import ticketReducer, {
  clearError,
  fetchCountThunk,
  incrementCountThunk,
  TicketState,
  updateCount,
} from "./ticketSlice";

jest.mock("../../api/globalTicket");
jest.mock("../../api/operations");

const mockTicketApi = ticketApi as jest.Mocked<typeof ticketApi>;
const mockOperationsApi = operationsApi as jest.Mocked<typeof operationsApi>;

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

    it("should print ticket successfully", async () => {
      const stateWithCount: TicketState = { ...initialState, count: 100 };
      store = configureStore({
        reducer: { ticket: ticketReducer },
        preloadedState: { ticket: stateWithCount },
      });

      const mockUpdatedUser = {
        id: 1,
        email: "test@example.com",
        tickets_contributed: 1,
        tickets_withdrawn: 0,
        printer_supplies: 99,
        money: 1,
        gold: 0,
        autoprinters: 0,
        credit_value: 0,
        credit_generation_level: 0,
        credit_capacity_level: 0,
      };

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
        incrementCountThunk.fulfilled(undefined, ""),
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
        error: "Previous error",
      };
      const state = ticketReducer(stateWithError, updateCount(42));
      expect(state.error).toBeNull();
      expect(state.count).toBe(42);
    });
  });
});
