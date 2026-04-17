import { createAsyncThunk, createSlice, isAnyOf } from "@reduxjs/toolkit";
import type { User } from "../../api/auth";
import * as authApi from "../../api/auth";
import {
  getApiErrorInfo,
  type ApiErrorCode,
  type ApiErrorInfo,
} from "../../api/client";
import {
  buyAutoBuySuppliesThunk,
  buyAutoprinterThunk,
  buyGoldThunk,
  buySuppliesThunk,
  increaseCreditCapacityThunk,
  increaseCreditGenerationThunk,
  increaseManualPrintBatchThunk,
  increaseSuppliesBatchThunk,
  printTicketThunk,
  toggleAutoBuySuppliesThunk,
} from "../gameOperationThunks";

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
    | "manual_print_batch_level"
    | "supplies_batch_level"
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
  errorCode?: ApiErrorCode | null;
  errorDetail?: string | null;
}

const initialState: AuthState = {
  user: null,
  isCheckingAuth: true,
  isLoading: false,
  pendingRequestCount: 0,
  error: null,
  errorCode: null,
  errorDetail: null,
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
        getApiErrorInfo(error, "Failed to check authentication"),
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
      return rejectWithValue(getApiErrorInfo(error, "Failed to login"));
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
      return rejectWithValue(getApiErrorInfo(error, "Failed to sign up"));
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
      return rejectWithValue(getApiErrorInfo(error, "Failed to logout"));
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

const clearApiError = (state: AuthState): void => {
  state.error = null;
  state.errorCode = null;
  state.errorDetail = null;
};

const applyApiError = (
  state: AuthState,
  payload: ApiErrorInfo | string | null | undefined,
  fallbackMessage: string,
): void => {
  if (typeof payload === "string") {
    state.error = payload;
    state.errorCode = null;
    state.errorDetail = null;
    return;
  }

  state.error = payload?.message || fallbackMessage;
  state.errorCode = payload?.code ?? null;
  state.errorDetail = payload?.detail ?? null;
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
      clearApiError(state);
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
        clearApiError(state);
      })
      .addCase(checkAuthThunk.fulfilled, (state, action) => {
        state.isCheckingAuth = false;
        state.user = action.payload;
        clearApiError(state);
      })
      .addCase(checkAuthThunk.rejected, (state, action) => {
        state.isCheckingAuth = false;
        state.user = null;
        applyApiError(
          state,
          action.payload as ApiErrorInfo | string,
          "Failed to check authentication",
        );
      });

    // loginThunk
    builder
      .addCase(loginThunk.pending, (state) => {
        startLoading(state);
        clearApiError(state);
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        finishLoading(state);
        state.user = action.payload;
        clearApiError(state);
      })
      .addCase(loginThunk.rejected, (state, action) => {
        finishLoading(state);
        applyApiError(
          state,
          action.payload as ApiErrorInfo | string,
          "Failed to login",
        );
      });

    // signupThunk
    builder
      .addCase(signupThunk.pending, (state) => {
        startLoading(state);
        clearApiError(state);
      })
      .addCase(signupThunk.fulfilled, (state, action) => {
        finishLoading(state);
        state.user = action.payload;
        clearApiError(state);
      })
      .addCase(signupThunk.rejected, (state, action) => {
        finishLoading(state);
        applyApiError(
          state,
          action.payload as ApiErrorInfo | string,
          "Failed to sign up",
        );
      });

    // logoutThunk
    builder
      .addCase(logoutThunk.pending, (state) => {
        startLoading(state);
        clearApiError(state);
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        finishLoading(state);
        state.user = null;
        clearApiError(state);
      })
      .addCase(logoutThunk.rejected, (state, action) => {
        finishLoading(state);
        applyApiError(
          state,
          action.payload as ApiErrorInfo | string,
          "Failed to logout",
        );
      });

    builder.addMatcher(
      isAnyOf(
        buySuppliesThunk.fulfilled,
        buyGoldThunk.fulfilled,
        buyAutoBuySuppliesThunk.fulfilled,
        buyAutoprinterThunk.fulfilled,
        increaseCreditGenerationThunk.fulfilled,
        increaseManualPrintBatchThunk.fulfilled,
        increaseSuppliesBatchThunk.fulfilled,
        increaseCreditCapacityThunk.fulfilled,
        toggleAutoBuySuppliesThunk.fulfilled,
        printTicketThunk.fulfilled,
      ),
      (state, action) => {
        mergeUserUpdate(state, action.payload);
      },
    );
  },
});

export const { clearError, applyUserUpdate } = authSlice.actions;
export default authSlice.reducer;
