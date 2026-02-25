import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ErrorState {
  message: string | null;
  timestamp: number | null;
}

const initialState: ErrorState = {
  message: null,
  timestamp: null,
};

const errorSlice = createSlice({
  name: "error",
  initialState,
  reducers: {
    setError: (state, action: PayloadAction<string>) => {
      state.message = action.payload;
      state.timestamp = Date.now();
    },
    clearError: (state) => {
      state.message = null;
      state.timestamp = null;
    },
  },
});

export const { setError, clearError } = errorSlice.actions;
export default errorSlice.reducer;
