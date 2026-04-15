import { configureStore, type PreloadedState } from "@reduxjs/toolkit";
import { websocketMiddleware } from "../../store/middleware/websocketMiddleware";
import authReducer from "../../store/slices/authSlice";
import errorReducer from "../../store/slices/errorSlice";
import operationsReducer from "../../store/slices/operationsSlice";
import realtimeReducer from "../../store/slices/realtimeSlice";
import ticketReducer from "../../store/slices/ticketSlice";
import type { RootState } from "../../store/store";

type TestStoreOptions = {
  preloadedState?: Partial<RootState>;
  includeWebsocketMiddleware?: boolean;
};

function buildDefaultState(): RootState {
  return {
    auth: {
      user: null,
      isCheckingAuth: true,
      isLoading: false,
      pendingRequestCount: 0,
      error: null,
      errorCode: null,
      errorDetail: null,
    },
    ticket: {
      count: 0,
      isLoading: false,
      pendingRequestCount: 0,
      error: null,
    },
    error: {
      message: null,
      timestamp: null,
    },
    operations: {
      isLoading: false,
      pendingRequestCount: 0,
      error: null,
      errorCode: null,
      errorDetail: null,
    },
    realtime: {
      isConnected: false,
      isReconnecting: false,
      lastUpdateAt: null,
    },
  };
}

function mergeState(overrides: Partial<RootState> = {}): RootState {
  const defaults = buildDefaultState();

  return {
    ...defaults,
    ...overrides,
    auth: {
      ...defaults.auth,
      ...overrides.auth,
    },
    ticket: {
      ...defaults.ticket,
      ...overrides.ticket,
    },
    error: {
      ...defaults.error,
      ...overrides.error,
    },
    operations: overrides.operations ?? defaults.operations,
    realtime: {
      ...defaults.realtime,
      ...overrides.realtime,
    },
  };
}

export function createTestStore(options: TestStoreOptions = {}) {
  const { preloadedState, includeWebsocketMiddleware = false } = options;

  return configureStore({
    reducer: {
      auth: authReducer,
      ticket: ticketReducer,
      error: errorReducer,
      operations: operationsReducer,
      realtime: realtimeReducer,
    },
    preloadedState: mergeState(preloadedState) as PreloadedState<RootState>,
    middleware: (getDefaultMiddleware) =>
      includeWebsocketMiddleware
        ? getDefaultMiddleware().concat(websocketMiddleware)
        : getDefaultMiddleware(),
  });
}

export type TestStore = ReturnType<typeof createTestStore>;
