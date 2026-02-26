import type { User } from "../../api/auth";
import * as globalTicketApi from "../../api/globalTicket";
import { checkAuthThunk, loginThunk, logoutThunk } from "../slices/authSlice";
import { updateCount } from "../slices/ticketSlice";
import { websocketMiddleware } from "./websocketMiddleware";

jest.mock("../../api/globalTicket");

const mockGlobalTicketApi = globalTicketApi as jest.Mocked<
  typeof globalTicketApi
>;

const mockUser: User = {
  id: 1,
  email: "test@example.com",
  tickets_contributed: 5,
  printer_supplies: 100,
  money: 0,
};

describe("websocketMiddleware", () => {
  let mockDisconnect: jest.Mock;
  let dispatchedActions: any[];

  beforeEach(() => {
    dispatchedActions = [];
    mockDisconnect = jest.fn();

    mockGlobalTicketApi.connectGlobalCountSocket.mockImplementation(
      (onCount, onStatus) => {
        // Simulate WebSocket callbacks for testing
        return mockDisconnect;
      },
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockStore = () => {
    return {
      getState: jest.fn(() => ({
        auth: {
          user: mockUser,
          isCheckingAuth: false,
          isLoading: false,
          error: null,
        },
        ticket: { count: 0, isLoading: false, error: null },
        error: { message: null, timestamp: null },
      })),
      dispatch: jest.fn((action) => {
        dispatchedActions.push(action);
        return action;
      }),
    };
  };

  const createMockNext = () => {
    return jest.fn((action) => action);
  };

  it("should connect WebSocket on checkAuthThunk.fulfilled when user exists", () => {
    const store = createMockStore();
    const next = createMockNext();
    const middleware = websocketMiddleware(store)(next);

    const action = checkAuthThunk.fulfilled(mockUser, "");
    middleware(action);

    expect(mockGlobalTicketApi.connectGlobalCountSocket).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(action);
  });

  it("should connect WebSocket on loginThunk.fulfilled when user exists", () => {
    const store = createMockStore();
    const next = createMockNext();
    const middleware = websocketMiddleware(store)(next);

    const action = loginThunk.fulfilled(mockUser, "", {
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

    const action = loginThunk.fulfilled(mockUser, "", {
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
    const connectAction = checkAuthThunk.fulfilled(mockUser, "");
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
      getState: jest.fn(() => ({
        auth: {
          user: null,
          isCheckingAuth: false,
          isLoading: false,
          error: null,
        },
        ticket: { count: 0, isLoading: false, error: null },
        error: { message: null, timestamp: null },
      })),
      dispatch: jest.fn(),
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

    const next = jest.fn(() => {
      callOrder.push("next");
    });

    store.dispatch = jest.fn((action) => {
      callOrder.push("dispatch");
      return action;
    });

    const middleware = websocketMiddleware(store)(next);
    middleware(checkAuthThunk.fulfilled(mockUser, ""));

    expect(callOrder[0]).toBe("next");
  });

  describe("WebSocket callback handling", () => {
    it("should dispatch updateCount when WebSocket receives count", () => {
      const store = createMockStore();
      const next = createMockNext();
      const middleware = websocketMiddleware(store)(next);

      let onCountCallback: ((count: number) => void) | null = null;
      mockGlobalTicketApi.connectGlobalCountSocket.mockImplementation(((
        onCount: (count: number) => void,
      ) => {
        onCountCallback = onCount;
        return mockDisconnect;
      }) as any);

      middleware(checkAuthThunk.fulfilled(mockUser, ""));

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
        | ((status: "open" | "closed" | "error") => void)
        | null = null;
      mockGlobalTicketApi.connectGlobalCountSocket.mockImplementation(
        (
          _onCount: (count: number) => void,
          onStatus?: (status: "open" | "closed" | "error") => void,
        ) => {
          if (onStatus) {
            onStatusCallback = onStatus;
          }
          return mockDisconnect;
        },
      );

      middleware(checkAuthThunk.fulfilled(mockUser, ""));

      // Simulate WebSocket error
      onStatusCallback!("error");

      const errorAction = dispatchedActions.find(
        (a) => a.type === "error/setError",
      );
      expect(errorAction).toBeDefined();
      expect(errorAction.payload).toBe("WebSocket connection error");
    });
  });
});
