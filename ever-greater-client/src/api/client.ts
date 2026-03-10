export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

export class AuthError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export class DomainError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "DomainError";
    this.status = status;
  }
}

export async function apiFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    throw new NetworkError(
      error instanceof Error ? error.message : "Network request failed",
    );
  }

  if (!response.ok) {
    let message: string;
    try {
      const data = (await response.json()) as { error?: string };
      message = data.error || response.statusText;
    } catch {
      message = response.statusText;
    }
    if (response.status === 401 || response.status === 403) {
      throw new AuthError(message, response.status);
    }
    throw new DomainError(message, response.status);
  }

  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
