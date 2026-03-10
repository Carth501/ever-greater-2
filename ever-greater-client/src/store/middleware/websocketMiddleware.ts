import { Middleware } from "@reduxjs/toolkit";
import { connect, disconnect } from "../../services/websocketService";
import {
  checkAuthThunk,
  loginThunk,
  logoutThunk,
  signupThunk,
} from "../slices/authSlice";

export const websocketMiddleware: Middleware =
  (store) => (next) => (action) => {
    const result = next(action);
    const state = store.getState();

    if (
      checkAuthThunk.fulfilled.match(action) ||
      loginThunk.fulfilled.match(action) ||
      signupThunk.fulfilled.match(action)
    ) {
      if (state.auth.user) {
        connect(state.auth.user.id, store.dispatch);
      }
    }

    if (logoutThunk.fulfilled.match(action)) {
      disconnect();
    }

    return result;
  };

// Export cleanup function for app shutdown
export function cleanupWebSocket() {
  disconnect();
}
