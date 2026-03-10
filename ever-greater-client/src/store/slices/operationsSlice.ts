import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as authApi from "../../api/auth";
import * as operationsApi from "../../api/operations";

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
  initialState: {},
  reducers: {},
});

export default operationsSlice.reducer;
