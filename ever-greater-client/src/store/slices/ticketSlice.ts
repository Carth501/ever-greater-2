import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as ticketApi from "../../api/globalTicket";
import * as operationsApi from "../../api/operations";
import {
  updateAutoprinters,
  updateGold,
  updateMoney,
  updateSupplies,
} from "./authSlice";

export interface TicketState {
  count: number;
  isLoading: boolean;
  pendingRequestCount: number;
  error: string | null;
}

const initialState: TicketState = {
  count: 0,
  isLoading: false,
  pendingRequestCount: 0,
  error: null,
};

// Async thunks
export const fetchCountThunk = createAsyncThunk(
  "ticket/fetchCount",
  async (_, { rejectWithValue }) => {
    try {
      const count = await ticketApi.fetchGlobalCount();
      return count;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch count",
      );
    }
  },
);

export const incrementCountThunk = createAsyncThunk(
  "ticket/incrementCount",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const updatedUser = await operationsApi.printTicket();
      // Update auth state with new user resources
      dispatch(updateSupplies(updatedUser.printer_supplies));
      dispatch(updateMoney(updatedUser.money));
      dispatch(updateGold(updatedUser.gold));
      dispatch(updateAutoprinters(updatedUser.autoprinters || 0));
      // Count updates will come via WebSocket
      return undefined;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to print ticket",
      );
    }
  },
);

const startLoading = (state: TicketState): void => {
  state.pendingRequestCount += 1;
  state.isLoading = state.pendingRequestCount > 0;
};

const finishLoading = (state: TicketState): void => {
  state.pendingRequestCount = Math.max(0, state.pendingRequestCount - 1);
  state.isLoading = state.pendingRequestCount > 0;
};

const ticketSlice = createSlice({
  name: "ticket",
  initialState,
  reducers: {
    updateCount: (state, action) => {
      state.count = action.payload;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchCountThunk
    builder
      .addCase(fetchCountThunk.pending, (state) => {
        startLoading(state);
        state.error = null;
      })
      .addCase(fetchCountThunk.fulfilled, (state, action) => {
        finishLoading(state);
        state.count = action.payload;
        state.error = null;
      })
      .addCase(fetchCountThunk.rejected, (state, action) => {
        finishLoading(state);
        state.error = action.payload as string;
      });

    // incrementCountThunk
    builder
      .addCase(incrementCountThunk.pending, (state) => {
        startLoading(state);
        state.error = null;
      })
      .addCase(incrementCountThunk.fulfilled, (state) => {
        finishLoading(state);
        state.error = null;
        // Count will be updated via WebSocket updates
      })
      .addCase(incrementCountThunk.rejected, (state, action) => {
        finishLoading(state);
        state.error = action.payload as string;
      });
  },
});

export const { updateCount, clearError } = ticketSlice.actions;
export default ticketSlice.reducer;
