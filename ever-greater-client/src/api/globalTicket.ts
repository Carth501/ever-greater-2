import { type WebSocketMessage } from "ever-greater-shared";
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
  printer_supplies?: number;
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
      const message = JSON.parse(event.data as string) as WebSocketMessage;

      if (message.type === "GLOBAL_COUNT_UPDATE") {
        onCount(message.count);
      } else if (message.type === "USER_RESOURCE_UPDATE") {
        if (onUserUpdate) {
          onUserUpdate(message.user_update);
        }
      }
    } catch (err) {
      // Ignore malformed payloads.
    }
  });

  return () => {
    socket.close();
  };
}
