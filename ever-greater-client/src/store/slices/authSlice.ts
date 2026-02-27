import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { User } from "../../api/auth";
import * as authApi from "../../api/auth";

export interface AuthState {
  user: User | null;
  isCheckingAuth: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isCheckingAuth: true,
  isLoading: false,
  error: null,
};

// Async thunks
export const checkAuthThunk = createAsyncThunk(
  "auth/checkAuth",
  async (_, { rejectWithValue }) => {
    try {
      const user = await authApi.getCurrentUser();
      return user;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to check authentication",
      );
    }
  },
);

export const loginThunk = createAsyncThunk(
  "auth/login",
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      const user = await authApi.login(email, password);
      return user;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to login",
      );
    }
  },
);

export const signupThunk = createAsyncThunk(
  "auth/signup",
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      const user = await authApi.register(email, password);
      return user;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to sign up",
      );
    }
  },
);

export const logoutThunk = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logout();
      return null;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to logout",
      );
    }
  },
);

export const buySuppliesThunk = createAsyncThunk(
  "auth/buySupplies",
  async (_, { rejectWithValue }) => {
    try {
      const result = await authApi.buySupplies();
      return result;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to buy supplies",
      );
    }
  },
);

export const buyGoldThunk = createAsyncThunk(
  "auth/buyGold",
  async (quantity: number, { rejectWithValue }) => {
    try {
      const result = await authApi.buyGold(quantity);
      return result;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to buy gold",
      );
    }
  },
);

export const buyAutoprinterThunk = createAsyncThunk(
  "auth/buyAutoprinter",
  async (_, { rejectWithValue }) => {
    try {
      const result = await authApi.buyAutoprinter();
      return result;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to buy autoprinter",
      );
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateSupplies: (state, action) => {
      if (state.user) {
        state.user.printer_supplies = action.payload;
      }
    },
    updateMoney: (state, action) => {
      if (state.user) {
        state.user.money = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    // checkAuthThunk
    builder
      .addCase(checkAuthThunk.pending, (state) => {
        state.isCheckingAuth = true;
        state.error = null;
      })
      .addCase(checkAuthThunk.fulfilled, (state, action) => {
        state.isCheckingAuth = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(checkAuthThunk.rejected, (state, action) => {
        state.isCheckingAuth = false;
        state.user = null;
        state.error = action.payload as string;
      });

    // loginThunk
    builder
      .addCase(loginThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // signupThunk
    builder
      .addCase(signupThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signupThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(signupThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // logoutThunk
    builder
      .addCase(logoutThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.error = null;
      })
      .addCase(logoutThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // buySuppliesThunk
    builder
      .addCase(buySuppliesThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(buySuppliesThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.user) {
          state.user.money = action.payload.money;
          state.user.printer_supplies = action.payload.printer_supplies;
        }
        state.error = null;
      })
      .addCase(buySuppliesThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // buyGoldThunk
    builder
      .addCase(buyGoldThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(buyGoldThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.user) {
          state.user.money = action.payload.money;
          state.user.gold = action.payload.gold;
        }
        state.error = null;
      })
      .addCase(buyGoldThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // buyAutoprinterThunk
    builder
      .addCase(buyAutoprinterThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(buyAutoprinterThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.user) {
          state.user.gold = action.payload.gold;
          state.user.autoprinters = action.payload.autoprinters;
        }
        state.error = null;
      })
      .addCase(buyAutoprinterThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, updateSupplies, updateMoney } = authSlice.actions;
export default authSlice.reducer;
