const DEFAULT_API_BASE = "http://localhost:4000";
const apiBase = process.env.REACT_APP_API_BASE || DEFAULT_API_BASE;

type CountPayload = {
  count: number;
};

type IncrementPayload = {
  count: number;
  supplies: number;
  money: number;
};

type UserUpdate = {
  supplies?: number;
  money?: number;
  tickets_contributed?: number;
  gold?: number;
  autoprinters?: number;
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
  const response = await fetch(`${apiBase}/api/count`);
  if (!response.ok) {
    throw new Error("Failed to fetch ticket count");
  }
  const data = (await response.json()) as CountPayload;
  return data.count;
}

export async function incrementGlobalCount(): Promise<{
  count: number;
  supplies: number;
  money: number;
}> {
  const response = await fetch(`${apiBase}/api/increment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to increment ticket count");
  }
  const data = (await response.json()) as IncrementPayload;
  return { count: data.count, supplies: data.supplies, money: data.money };
}

export function connectGlobalCountSocket(
  onCount: (count: number) => void,
  onUserUpdate?: (update: UserUpdate) => void,
  onStatus?: (status: "open" | "closed" | "error") => void,
): () => void {
  const socket = new WebSocket(getWsUrl());

  socket.addEventListener("open", () => {
    onStatus?.("open");

    // Send authentication message with userId from localStorage or session
    try {
      const userIdStr = localStorage.getItem("userId");
      if (userIdStr) {
        const userId = parseInt(userIdStr, 10);
        if (!isNaN(userId)) {
          socket.send(JSON.stringify({ type: "authenticate", userId }));
        }
      }
    } catch (err) {
      console.error("Error sending authentication message:", err);
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
