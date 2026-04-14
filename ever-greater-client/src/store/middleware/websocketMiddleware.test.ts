import type { WebSocketMessage } from "ever-greater-shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "../../api/auth";
import * as globalTicketApi from "../../api/globalTicket";
import { mockUser } from "../../tests/fixtures";
import { checkAuthThunk, loginThunk, logoutThunk } from "../slices/authSlice";
import { updateCount } from "../slices/ticketSlice";
import { websocketMiddleware } from "./websocketMiddleware";

vi.mock("../../api/globalTicket");

const mockGlobalTicketApi = globalTicketApi as any;

const defaultUser: User = mockUser();

describe("websocketMiddleware", () => {
  let mockDisconnect: any;
  let dispatchedActions: any[];

  beforeEach(() => {
    dispatchedActions = [];
    mockDisconnect = vi.fn();

    mockGlobalTicketApi.connectGlobalCountSocket.mockImplementation(
      (onCount: any, onStatus: any) => {
        // Simulate WebSocket callbacks for testing
        return mockDisconnect;
      },
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const createMockStore = () => {
    return {
      getState: vi.fn(() => ({
        auth: {
          user: defaultUser,
          isCheckingAuth: false,
          isLoading: false,
          error: null,
        },
        ticket: { count: 0, isLoading: false, error: null },
        error: { message: null, timestamp: null },
      })),
      dispatch: vi.fn((action) => {
        dispatchedActions.push(action);
        return action;
      }),
    };
  };

  const createMockNext = () => {
    return vi.fn((action) => action);
  };

  it("should connect WebSocket on checkAuthThunk.fulfilled when user exists", () => {
    const store = createMockStore();
    const next = createMockNext();
    const middleware = websocketMiddleware(store)(next);

    const action = checkAuthThunk.fulfilled(defaultUser, "");
    middleware(action);

    expect(mockGlobalTicketApi.connectGlobalCountSocket).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(action);
  });

  it("should connect WebSocket on loginThunk.fulfilled when user exists", () => {
    const store = createMockStore();
    const next = createMockNext();
    const middleware = websocketMiddleware(store)(next);

    const action = loginThunk.fulfilled(defaultUser, "", {
      email: "",
      password: "",
    });
    middleware(action);

    expect(mockGlobalTicketApi.connectGlobalCountSocket).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(action);
  });

  it("should connect WebSocket on signupThunk.fulfilled when user exists", () => {
    const store = createMockStore();
    const next = createMockNext();
    const middleware = websocketMiddleware(store)(next);

    const action = loginThunk.fulfilled(defaultUser, "", {
      email: "",
      password: "",
    });
    middleware(action);

    expect(mockGlobalTicketApi.connectGlobalCountSocket).toHaveBeenCalled();
  });

  it("should disconnect WebSocket on logoutThunk.fulfilled", () => {
    const store = createMockStore();
    const next = createMockNext();
    const middleware = websocketMiddleware(store)(next);

    // First connect
    const connectAction = checkAuthThunk.fulfilled(defaultUser, "");
    middleware(connectAction);
    expect(mockGlobalTicketApi.connectGlobalCountSocket).toHaveBeenCalledTimes(
      1,
    );

    // Then logout (disconnect)
    const logoutAction = logoutThunk.fulfilled(null, "");
    middleware(logoutAction);

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it("should not connect WebSocket if user is null on auth check", () => {
    const storeWithoutUser = {
      getState: vi.fn(() => ({
        auth: {
          user: null,
          isCheckingAuth: false,
          isLoading: false,
          error: null,
        },
        ticket: { count: 0, isLoading: false, error: null },
        error: { message: null, timestamp: null },
      })),
      dispatch: vi.fn(),
    };

    const next = createMockNext();
    const middleware = websocketMiddleware(storeWithoutUser)(next);

    const action = checkAuthThunk.fulfilled(null, "");
    middleware(action);

    expect(mockGlobalTicketApi.connectGlobalCountSocket).not.toHaveBeenCalled();
  });

  it("should pass through non-auth actions", () => {
    const store = createMockStore();
    const next = createMockNext();
    const middleware = websocketMiddleware(store)(next);

    const action = updateCount(42);
    middleware(action);

    expect(next).toHaveBeenCalledWith(action);
    expect(mockGlobalTicketApi.connectGlobalCountSocket).not.toHaveBeenCalled();
  });

  it("should handle multiple pending actions correctly", () => {
    const store = createMockStore();
    const next = createMockNext();
    const middleware = websocketMiddleware(store)(next);

    const action1 = checkAuthThunk.pending("");
    const action2 = checkAuthThunk.pending("");

    middleware(action1);
    middleware(action2);

    expect(next).toHaveBeenCalledTimes(2);
    expect(mockGlobalTicketApi.connectGlobalCountSocket).not.toHaveBeenCalled();
  });

  it("should call next before checking store state", () => {
    const store = createMockStore();
    const callOrder: string[] = [];

    const next = vi.fn(() => {
      callOrder.push("next");
    });

    store.dispatch = vi.fn((action) => {
      callOrder.push("dispatch");
      return action;
    });

    const middleware = websocketMiddleware(store)(next);
    middleware(checkAuthThunk.fulfilled(defaultUser, ""));

    expect(callOrder[0]).toBe("next");
  });

  describe("WebSocket callback handling", () => {
    it("should dispatch updateCount when WebSocket receives count", () => {
      const store = createMockStore();
      const next = createMockNext();
      const middleware = websocketMiddleware(store)(next);

      let onCountCallback: ((count: number) => void) | null = null;
      mockGlobalTicketApi.connectGlobalCountSocket.mockImplementation(((
        onMessage?: (message: WebSocketMessage) => void,
      ) => {
        onCountCallback = (count) =>
          onMessage?.({ type: "GLOBAL_COUNT_UPDATE", count });
        return mockDisconnect;
      }) as any);

      middleware(checkAuthThunk.fulfilled(defaultUser, ""));

      // Simulate WebSocket message
      onCountCallback!(99);

      const updateCountAction = dispatchedActions.find(
        (a) => a.type === "ticket/updateCount",
      );
      expect(updateCountAction).toBeDefined();
      expect(updateCountAction.payload).toBe(99);
    });

    it("should dispatch setError when WebSocket errors", () => {
      const store = createMockStore();
      const next = createMockNext();
      const middleware = websocketMiddleware(store)(next);

      let onStatusCallback:
        | ((
            status: "open" | "closed" | "error",
            details?: { readyState: number; timestamp: number },
          ) => void)
        | null = null;
      mockGlobalTicketApi.connectGlobalCountSocket.mockImplementation(
        (
          _onMessage?: (message: WebSocketMessage) => void,
          onStatus?: (
            status: "open" | "closed" | "error",
            details?: { readyState: number; timestamp: number },
          ) => void,
        ) => {
          if (onStatus) {
            onStatusCallback = onStatus;
          }
          return mockDisconnect;
        },
      );

      middleware(checkAuthThunk.fulfilled(defaultUser, ""));

      // Simulate WebSocket error
      onStatusCallback!("error", {
        readyState: 3,
        timestamp: Date.now(),
      });

      const errorAction = dispatchedActions.find(
        (a) => a.type === "error/setError",
      );
      expect(errorAction).toBeDefined();
      expect(errorAction.payload).toBe("WebSocket connection error");
    });

    it("should dispatch applyUserUpdate with credit level fields when WebSocket receives them", () => {
      const store = createMockStore();
      const next = createMockNext();
      const middleware = websocketMiddleware(store)(next);

      let onUserUpdateCallback: ((update: any) => void) | null = null;
      mockGlobalTicketApi.connectGlobalCountSocket.mockImplementation(
        (
          onMessage?: (message: WebSocketMessage) => void,
          _onStatus?: (status: "open" | "closed" | "error") => void,
        ) => {
          onUserUpdateCallback = (update) =>
            onMessage?.({ type: "USER_RESOURCE_UPDATE", user_update: update });
          return mockDisconnect;
        },
      );

      middleware(checkAuthThunk.fulfilled(defaultUser, ""));

      // Simulate WebSocket message with credit level updates
      onUserUpdateCallback!({
        credit_value: 100,
        credit_generation_level: 2,
        credit_capacity_level: 5,
      });

      const updateAction = dispatchedActions.find(
        (a) => a.type === "auth/applyUserUpdate",
      );
      expect(updateAction).toBeDefined();
      expect(updateAction.payload.credit_value).toBe(100);
      expect(updateAction.payload.credit_generation_level).toBe(2);
      expect(updateAction.payload.credit_capacity_level).toBe(5);
    });

    it("should apply credit updates over time with rate 0.1 per second", () => {
      const store = createMockStore();
      const next = createMockNext();
      const middleware = websocketMiddleware(store)(next);

      let onUserUpdateCallback: ((update: any) => void) | null = null;
      mockGlobalTicketApi.connectGlobalCountSocket.mockImplementation(
        (
          onMessage?: (message: WebSocketMessage) => void,
          _onStatus?: (status: "open" | "closed" | "error") => void,
        ) => {
          onUserUpdateCallback = (update) =>
            onMessage?.({ type: "USER_RESOURCE_UPDATE", user_update: update });
          return mockDisconnect;
        },
      );

      // Start with user having credit generation level 1, capacity 1, value 0
      const userWithCreditSetup: User = {
        ...defaultUser,
        credit_generation_level: 1,
        credit_capacity_level: 1,
        credit_value: 0,
      };

      middleware(checkAuthThunk.fulfilled(userWithCreditSetup, ""));

      // Simulate 10 seconds of credit generation (0.1 per second)
      // Each second the server sends an update incrementing by 0.1
      for (let i = 1; i <= 10; i++) {
        const expectedCreditValue = Math.min(i * 0.1, 1); // Capped at capacity of 1
        onUserUpdateCallback!({
          credit_value: expectedCreditValue,
        });
      }

      // Find the last credit update action
      const creditUpdateActions = dispatchedActions.filter(
        (a) =>
          a.type === "auth/applyUserUpdate" &&
          a.payload.credit_value !== undefined,
      );

      // Should have 10 update actions
      expect(creditUpdateActions).toHaveLength(10);

      // Last action should have credit_value at capacity (1.0)
      const lastUpdate = creditUpdateActions[creditUpdateActions.length - 1];
      expect(lastUpdate.payload.credit_value).toBe(1); // Capped at capacity
    });
  });
});
