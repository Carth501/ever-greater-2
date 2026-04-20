import {
  parseWebSocketMessage,
  type WebSocketMessage,
} from "../../../ever-greater-shared/src/messages";
import { apiFetch } from "./client";

const DEFAULT_API_BASE = "http://localhost:4000";
let apiBase = DEFAULT_API_BASE;
try {
  apiBase = (import.meta.env.VITE_API_BASE as string) || DEFAULT_API_BASE;
} catch {
  // In test environments, import.meta may not be available
}

type CountPayload = {
  count: number;
};

export type SocketStatus = "open" | "closed" | "error";

export type SocketStatusDetails = {
  readyState: number;
  timestamp: number;
  closeCode?: number;
  closeReason?: string;
  wasClean?: boolean;
};

function getWsUrl(): string {
  if (apiBase.startsWith("https://")) {
    return `wss://${apiBase.replace("https://", "")}/ws`;
  }
  return `ws://${apiBase.replace("http://", "")}/ws`;
}

export async function fetchGlobalCount(): Promise<number> {
  const data = await apiFetch<CountPayload>(`${apiBase}/api/count`);
  return data.count;
}

export function connectGlobalCountSocket(
  onMessage?: (message: WebSocketMessage) => void,
  onStatus?: (status: SocketStatus, details: SocketStatusDetails) => void,
  userId?: number,
): () => void {
  const socket = new WebSocket(getWsUrl());

  socket.addEventListener("open", () => {
    const details: SocketStatusDetails = {
      readyState: socket.readyState,
      timestamp: Date.now(),
    };

    onStatus?.("open", details);

    if (userId !== undefined) {
      try {
        socket.send(JSON.stringify({ type: "authenticate", userId }));
      } catch (err) {
        console.error("Error sending authentication message:", err);
      }
    }
  });

  socket.addEventListener("close", (event) => {
    const details: SocketStatusDetails = {
      readyState: socket.readyState,
      timestamp: Date.now(),
      closeCode: event.code,
      closeReason: event.reason,
      wasClean: event.wasClean,
    };

    onStatus?.("closed", details);
  });
  socket.addEventListener("error", () => {
    const details: SocketStatusDetails = {
      readyState: socket.readyState,
      timestamp: Date.now(),
    };

    onStatus?.("error", details);
  });
  socket.addEventListener("message", (event) => {
    try {
      const message = parseWebSocketMessage(JSON.parse(event.data as string));

      if (message && onMessage) {
        onMessage(message);
      }
    } catch (err) {
      // Ignore malformed payloads.
    }
  });

  return () => {
    socket.close();
  };
}
