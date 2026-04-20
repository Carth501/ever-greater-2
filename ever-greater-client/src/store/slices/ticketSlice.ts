import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { type ApiErrorInfo } from "../../api/client";
import * as ticketApi from "../../api/globalTicket";
import { printTicketThunk } from "../gameOperationThunks";

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

const startLoading = (state: TicketState): void => {
  state.pendingRequestCount += 1;
  state.isLoading = state.pendingRequestCount > 0;
};

const finishLoading = (state: TicketState): void => {
  state.pendingRequestCount = Math.max(0, state.pendingRequestCount - 1);
  state.isLoading = state.pendingRequestCount > 0;
};

const getTicketErrorMessage = (
  payload: ApiErrorInfo | string | null | undefined,
): string => {
  if (typeof payload === "string") {
    return payload;
  }

  return payload?.message || "Failed to print ticket";
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

    // printTicketThunk
    builder
      .addCase(printTicketThunk.pending, (state) => {
        startLoading(state);
        state.error = null;
      })
      .addCase(printTicketThunk.fulfilled, (state) => {
        finishLoading(state);
        state.error = null;
        // Count will be updated via WebSocket updates
      })
      .addCase(printTicketThunk.rejected, (state, action) => {
        finishLoading(state);
        state.error = getTicketErrorMessage(
          action.payload as ApiErrorInfo | string,
        );
      });
  },
});

export const { updateCount, clearError } = ticketSlice.actions;
export default ticketSlice.reducer;
