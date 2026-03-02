import { Middleware, isAction } from "@reduxjs/toolkit";
import { connectGlobalCountSocket } from "../../api/globalTicket";
import {
  applyUserUpdate,
  checkAuthThunk,
  logoutThunk,
} from "../slices/authSlice";
import { setError } from "../slices/errorSlice";
import {
  clearError as clearTicketError,
  updateCount,
} from "../slices/ticketSlice";

interface WebSocketState {
  socket: WebSocket | null;
  disconnectFn: (() => void) | null;
}

const wsState: WebSocketState = {
  socket: null,
  disconnectFn: null,
};

function connectWebSocket(dispatch: any, userId?: number) {
  // Disconnect existing connection if any
  if (wsState.disconnectFn) {
    wsState.disconnectFn();
  }

  // Store userId in localStorage for WebSocket authentication
  if (userId) {
    localStorage.setItem("userId", userId.toString());
  }

  wsState.disconnectFn = connectGlobalCountSocket(
    (count: number) => {
      dispatch(updateCount(count));
      dispatch(clearTicketError());
    },
    (update) => {
      const payload = {
        ...(update.supplies !== undefined
          ? { printer_supplies: update.supplies }
          : {}),
        ...(update.money !== undefined ? { money: update.money } : {}),
        ...(update.tickets_contributed !== undefined
          ? { tickets_contributed: update.tickets_contributed }
          : {}),
        ...(update.gold !== undefined ? { gold: update.gold } : {}),
        ...(update.autoprinters !== undefined
          ? { autoprinters: update.autoprinters }
          : {}),
        ...(update.credit_value !== undefined
          ? { credit_value: update.credit_value }
          : {}),
      };

      if (Object.keys(payload).length > 0) {
        dispatch(applyUserUpdate(payload));
      }
    },
    (status: "open" | "closed" | "error") => {
      if (status === "error") {
        dispatch(setError("WebSocket connection error"));
      } else if (status === "closed") {
        console.log("WebSocket disconnected");
      }
    },
  );
}

function disconnectWebSocket() {
  if (wsState.disconnectFn) {
    wsState.disconnectFn();
    wsState.disconnectFn = null;
  }
  // Clear userId from localStorage
  localStorage.removeItem("userId");
}

export const websocketMiddleware: Middleware =
  (store) => (next) => (action) => {
    const result = next(action);
    const state = store.getState();

    // Connect WebSocket when user logs in or auth is verified
    if (
      checkAuthThunk.fulfilled.match(action) ||
      (isAction(action) && action.type === "auth/login/fulfilled") ||
      (isAction(action) && action.type === "auth/signup/fulfilled")
    ) {
      if (state.auth.user) {
        connectWebSocket(store.dispatch, state.auth.user.id);
      }
    }

    // Disconnect WebSocket when user logs out
    if (logoutThunk.fulfilled.match(action)) {
      disconnectWebSocket();
    }

    return result;
  };

// Export cleanup function for app shutdown
export function cleanupWebSocket() {
  disconnectWebSocket();
}
