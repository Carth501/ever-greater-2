import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  connectGlobalCountSocket,
  type SocketStatusDetails,
} from "../api/globalTicket";
import { connect, disconnect } from "./websocketService";

vi.mock("../api/globalTicket", () => ({
  connectGlobalCountSocket: vi.fn(),
}));

type SocketStatus = "open" | "closed" | "error";

describe("websocketService", () => {
  let dispatchedActions: unknown[];
  let dispatch: Parameters<typeof connect>[1];
  let onStatus:
    | ((status: SocketStatus, details: SocketStatusDetails) => void)
    | null;
  let statusHandlers: Array<
    (status: SocketStatus, details: SocketStatusDetails) => void
  >;
  let disconnectCalls: number;
  const mockedConnectGlobalCountSocket = vi.mocked(connectGlobalCountSocket);
  const originalRandom = Math.random;

  beforeEach(() => {
    vi.useFakeTimers();
    Math.random = () => 0;

    dispatchedActions = [];
    dispatch = ((action) => {
      dispatchedActions.push(action);
    }) as Parameters<typeof connect>[1];
    onStatus = null;
    statusHandlers = [];
    disconnectCalls = 0;

    mockedConnectGlobalCountSocket.mockImplementation(
      (_onCount, _onUserUpdate, statusHandler) => {
        onStatus = statusHandler ?? null;
        if (statusHandler) {
          statusHandlers.push(statusHandler);
        }
        return () => {
          disconnectCalls += 1;
        };
      },
    );
  });

  afterEach(() => {
    disconnect();
    vi.clearAllMocks();
    vi.useRealTimers();
    Math.random = originalRandom;
  });

  it("schedules reconnect with backoff after socket error", () => {
    connect(1, dispatch);

    expect(mockedConnectGlobalCountSocket).toHaveBeenCalledTimes(1);

    onStatus?.("error", { readyState: 3, timestamp: Date.now() });

    expect(dispatchedActions).toContainEqual(
      expect.objectContaining({
        type: "realtime/setReconnecting",
        payload: true,
      }),
    );

    vi.advanceTimersByTime(1000);

    expect(mockedConnectGlobalCountSocket).toHaveBeenCalledTimes(2);
  });

  it("does not reconnect after manual disconnect", () => {
    connect(1, dispatch);
    onStatus?.("error", { readyState: 3, timestamp: Date.now() });

    disconnect();
    vi.advanceTimersByTime(20000);

    expect(mockedConnectGlobalCountSocket).toHaveBeenCalledTimes(1);
  });

  it("triggers timeout error and reconnect attempt", () => {
    connect(1, dispatch);

    vi.advanceTimersByTime(5000);

    expect(dispatchedActions).toContainEqual(
      expect.objectContaining({
        type: "error/setError",
        payload: "WebSocket connection error",
      }),
    );

    vi.advanceTimersByTime(1000);

    expect(mockedConnectGlobalCountSocket).toHaveBeenCalledTimes(2);
  });

  it("ignores stale close events from a previous socket", () => {
    connect(1, dispatch);

    const firstHandler = statusHandlers[0];
    firstHandler("error", { readyState: 3, timestamp: Date.now() });

    vi.advanceTimersByTime(1000);

    const secondHandler = statusHandlers[1];
    expect(secondHandler).toBeDefined();

    secondHandler("open", { readyState: 1, timestamp: Date.now() });
    firstHandler("closed", {
      readyState: 3,
      timestamp: Date.now(),
      closeCode: 1000,
      closeReason: "stale socket",
      wasClean: true,
    });

    const connectedActions = dispatchedActions.filter(
      (action) =>
        typeof action === "object" &&
        action !== null &&
        "type" in action &&
        (action as { type: string }).type === "realtime/setConnected",
    ) as Array<{ type: string; payload: boolean }>;

    expect(connectedActions.at(-1)).toEqual({
      type: "realtime/setConnected",
      payload: true,
    });
  });
});
