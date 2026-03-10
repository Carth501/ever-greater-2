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

type UserUpdate = {
  supplies?: number;
  money?: number;
  tickets_contributed?: number;
  tickets_withdrawn?: number;
  gold?: number;
  autoprinters?: number;
  credit_value?: number;
  credit_generation_level?: number;
  credit_capacity_level?: number;
  auto_buy_supplies_purchased?: boolean;
  auto_buy_supplies_active?: boolean;
};

type WebSocketPayload = {
  count?: number;
  user_update?: UserUpdate;
  authenticated?: boolean;
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
  onCount: (count: number) => void,
  onUserUpdate?: (update: UserUpdate) => void,
  onStatus?: (status: "open" | "closed" | "error") => void,
  userId?: number,
): () => void {
  const socket = new WebSocket(getWsUrl());

  socket.addEventListener("open", () => {
    onStatus?.("open");

    if (userId !== undefined) {
      try {
        socket.send(JSON.stringify({ type: "authenticate", userId }));
      } catch (err) {
        console.error("Error sending authentication message:", err);
      }
    }
  });

  socket.addEventListener("close", () => onStatus?.("closed"));
  socket.addEventListener("error", () => onStatus?.("error"));
  socket.addEventListener("message", (event) => {
    try {
      const payload = JSON.parse(event.data as string) as WebSocketPayload;

      // Handle global count update
      if (typeof payload.count === "number") {
        onCount(payload.count);
      }

      // Handle user-specific updates
      if (payload.user_update && onUserUpdate) {
        onUserUpdate(payload.user_update);
      }
    } catch (err) {
      // Ignore malformed payloads.
    }
  });

  return () => {
    socket.close();
  };
}
