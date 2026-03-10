import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface RealtimeState {
  isConnected: boolean;
}

const initialState: RealtimeState = {
  isConnected: false,
};

const realtimeSlice = createSlice({
  name: "realtime",
  initialState,
  reducers: {
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
  },
});

export const { setConnected } = realtimeSlice.actions;
export default realtimeSlice.reducer;
