const DEFAULT_API_BASE = "http://localhost:4000";
const apiBase = process.env.REACT_APP_API_BASE || DEFAULT_API_BASE;

type CountPayload = {
  count: number;
};

type IncrementPayload = {
  count: number;
  supplies: number;
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
  return { count: data.count, supplies: data.supplies };
}

export function connectGlobalCountSocket(
  onCount: (count: number) => void,
  onStatus?: (status: "open" | "closed" | "error") => void,
): () => void {
  const socket = new WebSocket(getWsUrl());

  socket.addEventListener("open", () => onStatus?.("open"));
  socket.addEventListener("close", () => onStatus?.("closed"));
  socket.addEventListener("error", () => onStatus?.("error"));
  socket.addEventListener("message", (event) => {
    try {
      const payload = JSON.parse(event.data as string) as CountPayload;
      if (typeof payload.count === "number") {
        onCount(payload.count);
      }
    } catch (err) {
      // Ignore malformed payloads.
    }
  });

  return () => {
    socket.close();
  };
}
