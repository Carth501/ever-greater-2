import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as ticketApi from "../../api/globalTicket";
import { updateSupplies } from "./authSlice";

export interface TicketState {
  count: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: TicketState = {
  count: 0,
  isLoading: false,
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
      const result = await ticketApi.incrementGlobalCount();
      // Update supplies in auth state
      dispatch(updateSupplies(result.supplies));
      return result.count;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to increment count",
      );
    }
  },
);

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
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCountThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.count = action.payload;
        state.error = null;
      })
      .addCase(fetchCountThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // incrementCountThunk
    builder
      .addCase(incrementCountThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(incrementCountThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.count = action.payload;
        state.error = null;
      })
      .addCase(incrementCountThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { updateCount, clearError } = ticketSlice.actions;
export default ticketSlice.reducer;
