import { createAsyncThunk, createSlice, isAnyOf } from "@reduxjs/toolkit";
import type { User } from "../../api/auth";
import * as authApi from "../../api/auth";
import {
  buyAutoBuySuppliesThunk,
  buyAutoprinterThunk,
  buyGoldThunk,
  buySuppliesThunk,
  increaseCreditCapacityThunk,
  increaseCreditGenerationThunk,
  toggleAutoBuySuppliesThunk,
} from "./operationsSlice";
import { incrementCountThunk } from "./ticketSlice";

type UserUpdatePayload = Partial<
  Pick<
    User,
    | "printer_supplies"
    | "money"
    | "tickets_contributed"
    | "tickets_withdrawn"
    | "gold"
    | "autoprinters"
    | "credit_value"
    | "credit_generation_level"
    | "credit_capacity_level"
    | "auto_buy_supplies_purchased"
    | "auto_buy_supplies_active"
  >
>;

export interface AuthState {
  user: User | null;
  isCheckingAuth: boolean;
  isLoading: boolean;
  pendingRequestCount: number;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isCheckingAuth: true,
  isLoading: false,
  pendingRequestCount: 0,
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

const startLoading = (state: AuthState): void => {
  state.pendingRequestCount += 1;
  state.isLoading = state.pendingRequestCount > 0;
};

const finishLoading = (state: AuthState): void => {
  state.pendingRequestCount = Math.max(0, state.pendingRequestCount - 1);
  state.isLoading = state.pendingRequestCount > 0;
};

const mergeUserUpdate = (
  state: AuthState,
  payload: UserUpdatePayload | null | undefined,
): void => {
  if (!state.user || !payload) {
    return;
  }

  state.user = {
    ...state.user,
    ...payload,
  };
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    applyUserUpdate: (state, action: { payload: UserUpdatePayload }) => {
      if (state.user) {
        state.user = {
          ...state.user,
          ...action.payload,
        };
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
        startLoading(state);
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        finishLoading(state);
        state.user = action.payload;
        state.error = null;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        finishLoading(state);
        state.error = action.payload as string;
      });

    // signupThunk
    builder
      .addCase(signupThunk.pending, (state) => {
        startLoading(state);
        state.error = null;
      })
      .addCase(signupThunk.fulfilled, (state, action) => {
        finishLoading(state);
        state.user = action.payload;
        state.error = null;
      })
      .addCase(signupThunk.rejected, (state, action) => {
        finishLoading(state);
        state.error = action.payload as string;
      });

    // logoutThunk
    builder
      .addCase(logoutThunk.pending, (state) => {
        startLoading(state);
        state.error = null;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        finishLoading(state);
        state.user = null;
        state.error = null;
      })
      .addCase(logoutThunk.rejected, (state, action) => {
        finishLoading(state);
        state.error = action.payload as string;
      });

    builder.addMatcher(
      isAnyOf(
        buySuppliesThunk.fulfilled,
        buyGoldThunk.fulfilled,
        buyAutoBuySuppliesThunk.fulfilled,
        buyAutoprinterThunk.fulfilled,
        increaseCreditGenerationThunk.fulfilled,
        increaseCreditCapacityThunk.fulfilled,
        toggleAutoBuySuppliesThunk.fulfilled,
        incrementCountThunk.fulfilled,
      ),
      (state, action) => {
        mergeUserUpdate(state, action.payload);
      },
    );
  },
});

export const { clearError, applyUserUpdate } = authSlice.actions;
export default authSlice.reducer;
