import { configureStore } from "@reduxjs/toolkit";
import { websocketMiddleware } from "./middleware/websocketMiddleware";
import authReducer from "./slices/authSlice";
import errorReducer from "./slices/errorSlice";
import ticketReducer from "./slices/ticketSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ticket: ticketReducer,
    error: errorReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(websocketMiddleware),
});

// Infer types for TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
