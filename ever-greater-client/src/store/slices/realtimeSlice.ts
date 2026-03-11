import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface RealtimeState {
  isConnected: boolean;
  isReconnecting: boolean;
  lastUpdateAt: number | null;
}

const initialState: RealtimeState = {
  isConnected: false,
  isReconnecting: false,
  lastUpdateAt: null,
};

const realtimeSlice = createSlice({
  name: "realtime",
  initialState,
  reducers: {
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
      if (action.payload) {
        state.isReconnecting = false;
      }
    },
    setReconnecting: (state, action: PayloadAction<boolean>) => {
      state.isReconnecting = action.payload;
    },
    markUpdateReceived: (state, action: PayloadAction<number | undefined>) => {
      state.lastUpdateAt = action.payload ?? Date.now();
    },
  },
});

export const { setConnected, setReconnecting, markUpdateReceived } =
  realtimeSlice.actions;
export default realtimeSlice.reducer;
