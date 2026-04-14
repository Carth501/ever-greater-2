import { type WebSocketMessage } from "ever-greater-shared";
import {
  connectGlobalCountSocket,
  type SocketStatus,
  type SocketStatusDetails,
} from "../api/globalTicket";
import { applyUserUpdate } from "../store/slices/authSlice";
import { setError } from "../store/slices/errorSlice";
import {
  markUpdateReceived,
  setConnected,
  setReconnecting,
} from "../store/slices/realtimeSlice";
import {
  clearError as clearTicketError,
  updateCount,
} from "../store/slices/ticketSlice";

const CONNECT_TIMEOUT_MS = 5000;
const BASE_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 15000;

let disconnectFn: (() => void) | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let connectTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempt = 0;
let isManualDisconnect = false;
let activeUserId: number | null = null;
let activeConnectionId = 0;
let activeDispatch:
  | ((
      action: ReturnType<
        | typeof applyUserUpdate
        | typeof updateCount
        | typeof clearTicketError
        | typeof setError
        | typeof markUpdateReceived
        | typeof setConnected
        | typeof setReconnecting
      >,
    ) => void)
  | null = null;

const clearTimers = (): void => {
  if (connectTimeoutTimer) {
    clearTimeout(connectTimeoutTimer);
    connectTimeoutTimer = null;
  }

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
};

const getReconnectDelay = (attempt: number): number => {
  const backoff = Math.min(
    MAX_RECONNECT_DELAY_MS,
    BASE_RECONNECT_DELAY_MS * 2 ** Math.max(attempt - 1, 0),
  );
  const jitter = Math.floor(Math.random() * 250);
  return backoff + jitter;
};

const scheduleReconnect = (): void => {
  if (
    isManualDisconnect ||
    reconnectTimer ||
    !activeDispatch ||
    !activeUserId
  ) {
    return;
  }

  reconnectAttempt += 1;
  const delay = getReconnectDelay(reconnectAttempt);
  activeDispatch(setReconnecting(true));

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (!isManualDisconnect && activeDispatch && activeUserId) {
      startConnection(activeUserId, activeDispatch);
    }
  }, delay);
};

const handleStatus = (
  status: SocketStatus,
  connectionId: number,
  _details?: SocketStatusDetails,
): void => {
  if (!activeDispatch) {
    return;
  }

  if (connectionId !== activeConnectionId) {
    return;
  }

  if (status === "open") {
    reconnectAttempt = 0;
    if (connectTimeoutTimer) {
      clearTimeout(connectTimeoutTimer);
      connectTimeoutTimer = null;
    }
    activeDispatch(setConnected(true));
    activeDispatch(markUpdateReceived(Date.now()));
    activeDispatch(setReconnecting(false));
    return;
  }

  activeDispatch(setConnected(false));

  if (status === "error") {
    activeDispatch(setError("WebSocket connection error"));
  }

  scheduleReconnect();
};

const handleMessage = (
  message: WebSocketMessage,
  connectionId: number,
  dispatch: (
    action: ReturnType<
      | typeof applyUserUpdate
      | typeof updateCount
      | typeof clearTicketError
      | typeof setError
      | typeof markUpdateReceived
      | typeof setConnected
      | typeof setReconnecting
    >,
  ) => void,
): void => {
  if (connectionId !== activeConnectionId) {
    return;
  }

  switch (message.type) {
    case "GLOBAL_COUNT_UPDATE":
      dispatch(updateCount(message.count));
      dispatch(markUpdateReceived(Date.now()));
      dispatch(clearTicketError());
      break;
    case "USER_RESOURCE_UPDATE":
      if (Object.keys(message.user_update).length > 0) {
        dispatch(applyUserUpdate(message.user_update));
        dispatch(markUpdateReceived(Date.now()));
      }
      break;
  }
};

function startConnection(
  userId: number,
  dispatch: (
    action: ReturnType<
      | typeof applyUserUpdate
      | typeof updateCount
      | typeof clearTicketError
      | typeof setError
      | typeof markUpdateReceived
      | typeof setConnected
      | typeof setReconnecting
    >,
  ) => void,
): void {
  const connectionId = activeConnectionId + 1;
  activeConnectionId = connectionId;

  if (disconnectFn) {
    disconnectFn();
    disconnectFn = null;
  }

  if (connectTimeoutTimer) {
    clearTimeout(connectTimeoutTimer);
  }

  connectTimeoutTimer = setTimeout(() => {
    connectTimeoutTimer = null;
    if (disconnectFn) {
      disconnectFn();
      disconnectFn = null;
    }
    handleStatus("error", connectionId, {
      readyState: WebSocket.CLOSED,
      timestamp: Date.now(),
    });
  }, CONNECT_TIMEOUT_MS);

  disconnectFn = connectGlobalCountSocket(
    (message) => {
      handleMessage(message, connectionId, dispatch);
    },
    (status, details) => {
      handleStatus(status, connectionId, details);
    },
    userId,
  );
}

export function connect(
  userId: number,
  dispatch: (
    action: ReturnType<
      | typeof applyUserUpdate
      | typeof updateCount
      | typeof clearTicketError
      | typeof setError
      | typeof markUpdateReceived
      | typeof setConnected
      | typeof setReconnecting
    >,
  ) => void,
): void {
  isManualDisconnect = false;
  activeUserId = userId;
  activeDispatch = dispatch;
  clearTimers();
  dispatch(setReconnecting(false));
  startConnection(userId, dispatch);
}

export function disconnect(): void {
  isManualDisconnect = true;
  clearTimers();
  activeConnectionId += 1;

  if (disconnectFn) {
    disconnectFn();
    disconnectFn = null;
  }

  reconnectAttempt = 0;
  activeUserId = null;

  if (activeDispatch) {
    activeDispatch(setConnected(false));
    activeDispatch(setReconnecting(false));
  }

  activeDispatch = null;
}
