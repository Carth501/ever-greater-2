import { createSlice, isAnyOf } from "@reduxjs/toolkit";
import { type ApiErrorCode, type ApiErrorInfo } from "../../api/client";
import {
  operationsStateFulfilledActions,
  operationsStatePendingActions,
  operationsStateRejectedActions,
} from "../gameOperationThunks";

export interface OperationsState {
  isLoading: boolean;
  pendingRequestCount: number;
  error: string | null;
  errorCode?: ApiErrorCode | null;
  errorDetail?: string | null;
}

const initialState: OperationsState = {
  isLoading: false,
  pendingRequestCount: 0,
  error: null,
  errorCode: null,
  errorDetail: null,
};

const startLoading = (state: OperationsState): void => {
  state.pendingRequestCount += 1;
  state.isLoading = state.pendingRequestCount > 0;
};

const finishLoading = (state: OperationsState): void => {
  state.pendingRequestCount = Math.max(0, state.pendingRequestCount - 1);
  state.isLoading = state.pendingRequestCount > 0;
};

const clearOperationError = (state: OperationsState): void => {
  state.error = null;
  state.errorCode = null;
  state.errorDetail = null;
};

const applyOperationError = (
  state: OperationsState,
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

const operationsSlice = createSlice({
  name: "operations",
  initialState,
  reducers: {
    clearError: (state) => {
      clearOperationError(state);
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(isAnyOf(...operationsStatePendingActions), (state) => {
      startLoading(state);
      clearOperationError(state);
    });

    builder.addMatcher(isAnyOf(...operationsStateFulfilledActions), (state) => {
      finishLoading(state);
      clearOperationError(state);
    });

    builder.addMatcher(
      isAnyOf(...operationsStateRejectedActions),
      (state, action) => {
        finishLoading(state);
        applyOperationError(
          state,
          action.payload as ApiErrorInfo | string,
          "Operation failed",
        );
      },
    );
  },
});

export const { clearError } = operationsSlice.actions;
export {
  buyAutoBuySuppliesThunk,
  buyAutoprinterThunk,
  buyGoldThunk,
  buySuppliesThunk,
  increaseCreditCapacityThunk,
  increaseCreditGenerationThunk,
  increaseManualPrintBatchThunk,
  increaseSuppliesBatchThunk,
  increaseTicketBatchThunk,
  toggleAutoBuySuppliesThunk,
} from "../gameOperationThunks";
export default operationsSlice.reducer;
