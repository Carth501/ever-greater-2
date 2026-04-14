import { createAsyncThunk, createSlice, isAnyOf } from "@reduxjs/toolkit";
import * as authApi from "../../api/auth";
import * as operationsApi from "../../api/operations";

export interface OperationsState {
  isLoading: boolean;
  pendingRequestCount: number;
  error: string | null;
}

const initialState: OperationsState = {
  isLoading: false,
  pendingRequestCount: 0,
  error: null,
};

const startLoading = (state: OperationsState): void => {
  state.pendingRequestCount += 1;
  state.isLoading = state.pendingRequestCount > 0;
};

const finishLoading = (state: OperationsState): void => {
  state.pendingRequestCount = Math.max(0, state.pendingRequestCount - 1);
  state.isLoading = state.pendingRequestCount > 0;
};

export const buySuppliesThunk = createAsyncThunk(
  "operations/buySupplies",
  async (_, { rejectWithValue }) => {
    try {
      const user = await operationsApi.buySupplies();
      return user;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to buy supplies",
      );
    }
  },
);

export const buyGoldThunk = createAsyncThunk(
  "operations/buyGold",
  async (quantity: number, { rejectWithValue }) => {
    try {
      const user = await operationsApi.buyGold(quantity);
      return user;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to buy gold",
      );
    }
  },
);

export const buyAutoBuySuppliesThunk = createAsyncThunk(
  "operations/buyAutoBuySupplies",
  async (_, { rejectWithValue }) => {
    try {
      const user = await operationsApi.buyAutoBuySupplies();
      return user;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to unlock auto-buy supplies",
      );
    }
  },
);

export const buyAutoprinterThunk = createAsyncThunk(
  "operations/buyAutoprinter",
  async (_, { rejectWithValue }) => {
    try {
      const user = await operationsApi.buyAutoprinter();
      return user;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to buy autoprinter",
      );
    }
  },
);

export const increaseCreditGenerationThunk = createAsyncThunk(
  "operations/increaseCreditGeneration",
  async (_, { rejectWithValue }) => {
    try {
      const user = await operationsApi.increaseCreditGeneration();
      return user;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to increase credit generation",
      );
    }
  },
);

export const increaseCreditCapacityThunk = createAsyncThunk(
  "operations/increaseCreditCapacity",
  async (_, { rejectWithValue }) => {
    try {
      const user = await operationsApi.increaseCreditCapacity();
      return user;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to increase credit capacity",
      );
    }
  },
);

export const toggleAutoBuySuppliesThunk = createAsyncThunk(
  "operations/toggleAutoBuySupplies",
  async (active: boolean, { rejectWithValue }) => {
    try {
      const user = await authApi.setAutoBuySuppliesActive(active);
      return user;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to toggle auto-buy supplies",
      );
    }
  },
);

const operationsSlice = createSlice({
  name: "operations",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      isAnyOf(
        buySuppliesThunk.pending,
        buyGoldThunk.pending,
        buyAutoBuySuppliesThunk.pending,
        buyAutoprinterThunk.pending,
        increaseCreditGenerationThunk.pending,
        increaseCreditCapacityThunk.pending,
        toggleAutoBuySuppliesThunk.pending,
      ),
      (state) => {
        startLoading(state);
        state.error = null;
      },
    );

    builder.addMatcher(
      isAnyOf(
        buySuppliesThunk.fulfilled,
        buyGoldThunk.fulfilled,
        buyAutoBuySuppliesThunk.fulfilled,
        buyAutoprinterThunk.fulfilled,
        increaseCreditGenerationThunk.fulfilled,
        increaseCreditCapacityThunk.fulfilled,
        toggleAutoBuySuppliesThunk.fulfilled,
      ),
      (state) => {
        finishLoading(state);
        state.error = null;
      },
    );

    builder.addMatcher(
      isAnyOf(
        buySuppliesThunk.rejected,
        buyGoldThunk.rejected,
        buyAutoBuySuppliesThunk.rejected,
        buyAutoprinterThunk.rejected,
        increaseCreditGenerationThunk.rejected,
        increaseCreditCapacityThunk.rejected,
        toggleAutoBuySuppliesThunk.rejected,
      ),
      (state, action) => {
        finishLoading(state);
        state.error = action.payload as string;
      },
    );
  },
});

export const { clearError } = operationsSlice.actions;
export default operationsSlice.reducer;
