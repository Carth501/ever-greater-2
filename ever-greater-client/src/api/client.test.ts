import { afterEach, describe, expect, it, vi } from "vitest";
import {
  apiFetch,
  AuthError,
  DomainError,
  formatApiErrorForDisplay,
  NetworkError,
} from "./client";

const originalFetch = global.fetch;

function createJsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    ...init,
  });
}

describe("apiFetch", () => {
  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns parsed json for successful responses", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(
        createJsonResponse({ ok: true }, { status: 200 }),
      ) as typeof fetch;

    await expect(apiFetch<{ ok: boolean }>("/test")).resolves.toEqual({
      ok: true,
    });
  });

  it("throws NetworkError when fetch fails", async () => {
    global.fetch = vi
      .fn()
      .mockRejectedValue(new Error("socket down")) as typeof fetch;

    await expect(apiFetch("/test")).rejects.toMatchObject<
      Partial<NetworkError>
    >({
      name: "NetworkError",
      message: "socket down",
    });
  });

  it("throws AuthError with code and detail for auth failures", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      createJsonResponse(
        {
          error: "Not authenticated",
          code: "AUTH_REQUIRED",
          detail: "Session missing",
        },
        { status: 401, statusText: "Unauthorized" },
      ),
    ) as typeof fetch;

    await expect(apiFetch("/test")).rejects.toMatchObject<Partial<AuthError>>({
      name: "AuthError",
      message: "Not authenticated",
      status: 401,
      code: "AUTH_REQUIRED",
      detail: "Session missing",
    });
  });

  it("throws DomainError with code and detail for domain failures", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      createJsonResponse(
        {
          error: "GLOBAL_TICKET_LIMIT",
          code: "GLOBAL_TICKET_LIMIT",
          detail: "Personal ticket withdrawal limit exceeded",
        },
        { status: 400, statusText: "Bad Request" },
      ),
    ) as typeof fetch;

    await expect(apiFetch("/test")).rejects.toMatchObject<Partial<DomainError>>(
      {
        name: "DomainError",
        message: "GLOBAL_TICKET_LIMIT",
        status: 400,
        code: "GLOBAL_TICKET_LIMIT",
        detail: "Personal ticket withdrawal limit exceeded",
      },
    );
  });

  it("falls back to statusText when the error body is not json", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(
        new Response("plain text", { status: 500, statusText: "Server Error" }),
      ) as typeof fetch;

    await expect(apiFetch("/test")).rejects.toMatchObject<Partial<DomainError>>(
      {
        name: "DomainError",
        message: "Server Error",
        status: 500,
      },
    );
  });

  it("formats known api error codes into clearer UI messages", () => {
    expect(
      formatApiErrorForDisplay({
        message: "Invalid email or password",
        code: "INVALID_CREDENTIALS",
      }),
    ).toBe("Check your email and password and try again.");

    expect(
      formatApiErrorForDisplay({
        message: "GLOBAL_TICKET_LIMIT",
        code: "GLOBAL_TICKET_LIMIT",
        detail: "Personal ticket withdrawal limit exceeded",
      }),
    ).toBe("Personal ticket withdrawal limit exceeded");
  });
});
