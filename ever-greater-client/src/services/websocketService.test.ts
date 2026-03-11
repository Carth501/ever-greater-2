import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { connectGlobalCountSocket } from "../api/globalTicket";
import { connect, disconnect } from "./websocketService";

vi.mock("../api/globalTicket", () => ({
  connectGlobalCountSocket: vi.fn(),
}));

type SocketStatus = "open" | "closed" | "error";

describe("websocketService", () => {
  let dispatchedActions: unknown[];
  let dispatch: Parameters<typeof connect>[1];
  let onStatus: ((status: SocketStatus) => void) | null;
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
    disconnectCalls = 0;

    mockedConnectGlobalCountSocket.mockImplementation(
      (_onCount, _onUserUpdate, statusHandler) => {
        onStatus = statusHandler ?? null;
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

    onStatus?.("error");

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
    onStatus?.("error");

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
});
