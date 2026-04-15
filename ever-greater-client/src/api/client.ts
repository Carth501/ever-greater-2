export type ApiErrorCode =
  | "INVALID_REQUEST"
  | "INVALID_CREDENTIALS"
  | "AUTH_REQUIRED"
  | "USER_NOT_FOUND"
  | "EMAIL_ALREADY_IN_USE"
  | "AUTO_BUY_SUPPLIES_NOT_UNLOCKED"
  | "AUTO_BUY_SUPPLIES_TOGGLE_FAILED"
  | "REGISTER_FAILED"
  | "LOGIN_FAILED"
  | "FETCH_USER_FAILED"
  | "LOGOUT_FAILED"
  | "INSUFFICIENT_RESOURCES"
  | "INVALID_OPERATION"
  | "GLOBAL_TICKET_LIMIT"
  | "OPERATION_EXECUTION_FAILED"
  | string;

export type ApiErrorPayload = {
  error?: string;
  code?: ApiErrorCode;
  detail?: string;
};

export type ApiErrorInfo = {
  message: string;
  code?: ApiErrorCode;
  detail?: string;
  status?: number;
};

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

export class AuthError extends Error {
  readonly status: number;
  readonly code?: ApiErrorCode;
  readonly detail?: string;
  constructor(
    message: string,
    status: number,
    options?: { code?: ApiErrorCode; detail?: string },
  ) {
    super(message);
    this.name = "AuthError";
    this.status = status;
    this.code = options?.code;
    this.detail = options?.detail;
  }
}

export class DomainError extends Error {
  readonly status: number;
  readonly code?: ApiErrorCode;
  readonly detail?: string;
  constructor(
    message: string,
    status: number,
    options?: { code?: ApiErrorCode; detail?: string },
  ) {
    super(message);
    this.name = "DomainError";
    this.status = status;
    this.code = options?.code;
    this.detail = options?.detail;
  }
}

async function parseApiError(response: Response): Promise<ApiErrorPayload> {
  try {
    return (await response.json()) as ApiErrorPayload;
  } catch {
    return {};
  }
}

export function getApiErrorInfo(
  error: unknown,
  fallbackMessage: string,
): ApiErrorInfo {
  if (error instanceof AuthError || error instanceof DomainError) {
    return {
      message: error.message,
      code: error.code,
      detail: error.detail,
      status: error.status,
    };
  }

  if (error instanceof NetworkError) {
    return { message: error.message };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: fallbackMessage };
}

export function formatApiErrorForDisplay(
  error: Pick<ApiErrorInfo, "message" | "code" | "detail"> | null | undefined,
): string | null {
  if (!error) {
    return null;
  }

  switch (error.code) {
    case "INVALID_CREDENTIALS":
      return "Check your email and password and try again.";
    case "EMAIL_ALREADY_IN_USE":
      return "That email is already registered. Try logging in instead.";
    case "AUTH_REQUIRED":
      return "Your session has expired. Log in again.";
    case "GLOBAL_TICKET_LIMIT":
      return error.detail || "You have reached your current withdrawal limit.";
    case "AUTO_BUY_SUPPLIES_NOT_UNLOCKED":
      return "Unlock auto-buy supplies before toggling it.";
    default:
      return error.detail || error.message;
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
    const data = await parseApiError(response);
    const message = data.error || response.statusText;
    if (response.status === 401 || response.status === 403) {
      throw new AuthError(message, response.status, {
        code: data.code,
        detail: data.detail,
      });
    }
    throw new DomainError(message, response.status, {
      code: data.code,
      detail: data.detail,
    });
  }

  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
