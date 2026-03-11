import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface RealtimeState {
  isConnected: boolean;
  isReconnecting: boolean;
}

const initialState: RealtimeState = {
  isConnected: false,
  isReconnecting: false,
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
  },
});

export const { setConnected, setReconnecting } = realtimeSlice.actions;
export default realtimeSlice.reducer;
