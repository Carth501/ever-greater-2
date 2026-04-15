import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockUser } from "../../tests/fixtures";
import DashboardPage from "./DashboardPage";

vi.mock("../../hooks/useAuth", () => ({ useAuth: vi.fn() }));
vi.mock("../../hooks/useGame", () => ({ useGame: vi.fn() }));
vi.mock("../../hooks/useRealtime", () => ({ useRealtime: vi.fn() }));

import { useAuth } from "../../hooks/useAuth";
import { useGame } from "../../hooks/useGame";
import { useRealtime } from "../../hooks/useRealtime";

const mockedUseAuth = vi.mocked(useAuth);
const mockedUseGame = vi.mocked(useGame);
const mockedUseRealtime = vi.mocked(useRealtime);

type AuthHookValue = ReturnType<typeof useAuth>;
type GameHookValue = ReturnType<typeof useGame>;
type RealtimeHookValue = ReturnType<typeof useRealtime>;

let printTicketSpy: GameHookValue["printTicket"];

function createAuthMockValue(
  overrides: Partial<AuthHookValue> = {},
): AuthHookValue {
  return {
    user: mockUser({
      email: "operator@example.com",
      printer_supplies: 24,
      tickets_contributed: 1000,
      tickets_withdrawn: 100,
      auto_buy_supplies_purchased: true,
      auto_buy_supplies_active: true,
    }),
    isCheckingAuth: false,
    isLoading: false,
    error: null,
    errorCode: null,
    errorDetail: null,
    login: vi.fn<(email: string, password: string) => void>(),
    logout: vi.fn<() => void>(),
    signup: vi.fn<(email: string, password: string) => void>(),
    ...overrides,
  };
}

function createGameMockValue(
  overrides: Partial<GameHookValue> = {},
): GameHookValue {
  return {
    count: 321,
    error: null,
    isLoading: false,
    supplies: 24,
    isPrintDisabled: false,
    printTicket: printTicketSpy,
    ...overrides,
  };
}

function createRealtimeMockValue(
  overrides: Partial<RealtimeHookValue> = {},
): RealtimeHookValue {
  return {
    isConnected: true,
    isReconnecting: false,
    lastUpdateAt: Date.now(),
    ...overrides,
  };
}

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-14T12:00:00Z"));

    printTicketSpy = vi.fn<() => void>();

    mockedUseAuth.mockReturnValue(createAuthMockValue());
    mockedUseGame.mockReturnValue(createGameMockValue());
    mockedUseRealtime.mockReturnValue(createRealtimeMockValue());
  });

  it("renders live dashboard state and delegates print actions", () => {
    render(<DashboardPage />);

    expect(
      screen.getByRole("main", { name: /dashboard preview/i }),
    ).toBeTruthy();
    expect(screen.getByText("operator@example.com")).toBeTruthy();
    expect(
      screen.getByRole("region", {
        name: /a cleaner command center for printing, monitoring, and upgrading/i,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("region", { name: /panel visibility/i }),
    ).toBeTruthy();
    expect(screen.getAllByText(/Realtime healthy/i).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("region", { name: /signed in account/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole("region", { name: /ticket pool overview/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole("region", { name: /print controls/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole("region", { name: /modular shop surfaces/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole("region", { name: /realtime health/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole("region", { name: /secondary insights/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole("region", { name: /why this dashboard works/i }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /print a ticket/i }));

    expect(printTicketSpy).toHaveBeenCalled();
  });

  it("applies toolbar toggles and preset changes", () => {
    render(<DashboardPage />);

    expect(screen.getByText(/Modular shop surfaces/i)).toBeTruthy();

    fireEvent.click(screen.getAllByRole("checkbox")[3]);
    expect(screen.queryByText(/Modular shop surfaces/i)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Focused preset/i }));
    expect(screen.queryByText(/Secondary insights/i)).toBeNull();
  });

  it("renders delayed realtime status when updates go stale", () => {
    mockedUseRealtime.mockReturnValue(
      createRealtimeMockValue({ lastUpdateAt: Date.now() - 8_000 }),
    );

    render(<DashboardPage showControls={false} />);

    expect(screen.getAllByText(/Updates delayed/i).length).toBeGreaterThan(0);
  });

  it("falls back to preview mode when no live user exists", () => {
    mockedUseAuth.mockReturnValue(createAuthMockValue({ user: null }));

    render(<DashboardPage showControls={false} />);

    expect(screen.getByText(/operator@evergreater.app/i)).toBeTruthy();
    expect(screen.getAllByText(/Preview data/i).length).toBeGreaterThan(0);
    expect(
      (
        screen.getByRole("button", {
          name: /print a ticket/i,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(
      screen.getByText(
        /printing is disabled in preview mode because no live account is connected\./i,
      ),
    ).toBeTruthy();
  });

  it("surfaces live print guidance when printing is available", () => {
    render(<DashboardPage />);

    expect(
      screen.getByText(/printing is available and ready from this panel\./i),
    ).toBeTruthy();
  });
});
