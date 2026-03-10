import { connectGlobalCountSocket } from "../api/globalTicket";
import { applyUserUpdate } from "../store/slices/authSlice";
import { setError } from "../store/slices/errorSlice";
import { setConnected } from "../store/slices/realtimeSlice";
import {
  clearError as clearTicketError,
  updateCount,
} from "../store/slices/ticketSlice";

let disconnectFn: (() => void) | null = null;

export function connect(
  userId: number,
  dispatch: (
    action: ReturnType<
      | typeof applyUserUpdate
      | typeof updateCount
      | typeof clearTicketError
      | typeof setError
      | typeof setConnected
    >,
  ) => void,
): void {
  if (disconnectFn) {
    disconnectFn();
  }

  disconnectFn = connectGlobalCountSocket(
    (count: number) => {
      dispatch(updateCount(count));
      dispatch(clearTicketError());
    },
    (update) => {
      if (Object.keys(update).length > 0) {
        dispatch(applyUserUpdate(update));
      }
    },
    (status: "open" | "closed" | "error") => {
      if (status === "open") {
        dispatch(setConnected(true));
      } else if (status === "error") {
        dispatch(setConnected(false));
        dispatch(setError("WebSocket connection error"));
      } else if (status === "closed") {
        dispatch(setConnected(false));
        console.log("WebSocket disconnected");
      }
    },
    userId,
  );
}

export function disconnect(): void {
  if (disconnectFn) {
    disconnectFn();
    disconnectFn = null;
  }
}
