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
let printTicketSpy: ReturnType<typeof vi.fn>;

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-14T12:00:00Z"));

    printTicketSpy = vi.fn();

    mockedUseAuth.mockReturnValue({
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
      login: vi.fn(),
      logout: vi.fn(),
      signup: vi.fn(),
    });

    mockedUseGame.mockReturnValue({
      count: 321,
      error: null,
      isLoading: false,
      supplies: 24,
      isPrintDisabled: false,
      printTicket: printTicketSpy,
    });

    mockedUseRealtime.mockReturnValue({
      isConnected: true,
      isReconnecting: false,
      lastUpdateAt: Date.now(),
    });
  });

  it("renders live dashboard state and delegates print actions", () => {
    render(<DashboardPage />);

    expect(screen.getByText("operator@example.com")).toBeTruthy();
    expect(screen.getAllByText(/Realtime healthy/i).length).toBeGreaterThan(0);

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
    mockedUseRealtime.mockReturnValue({
      isConnected: true,
      isReconnecting: false,
      lastUpdateAt: Date.now() - 8_000,
    });

    render(<DashboardPage showControls={false} />);

    expect(screen.getAllByText(/Updates delayed/i).length).toBeGreaterThan(0);
  });

  it("falls back to preview mode when no live user exists", () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      isCheckingAuth: false,
      isLoading: false,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      signup: vi.fn(),
    });

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
