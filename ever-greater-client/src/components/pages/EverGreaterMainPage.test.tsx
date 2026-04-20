import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../../hooks/useAuth";
import { useGame } from "../../hooks/useGame";
import { mockUser } from "../../tests/fixtures";
import EverGreaterMainPage from "./EverGreaterMainPage";

vi.mock("../../hooks/useAuth", () => ({ useAuth: vi.fn() }));
vi.mock("../../hooks/useGame", () => ({ useGame: vi.fn() }));
vi.mock("../common/AuthHeader", () => ({
  default: () => <div>Auth Header</div>,
}));
vi.mock("../game/TicketSummary", () => ({
  default: () => <div>Ticket Summary</div>,
}));
vi.mock("../game/PrintControls", () => ({
  default: () => <div>Print Controls</div>,
}));
vi.mock("../shop/Shop", () => ({
  default: () => <div>Shop</div>,
}));
vi.mock("../shop/Upgrades", () => ({
  default: () => <div>Upgrades</div>,
}));
vi.mock("./dashboard", () => ({
  DashboardAutoBuyManagementPanel: () => <div>Auto-buy management</div>,
}));

const mockedUseAuth = vi.mocked(useAuth);
const mockedUseGame = vi.mocked(useGame);

type AuthHookValue = ReturnType<typeof useAuth>;
type GameHookValue = ReturnType<typeof useGame>;

function createAuthMockValue(
  overrides: Partial<AuthHookValue> = {},
): AuthHookValue {
  return {
    user: mockUser({
      email: "operator@example.com",
      tickets_contributed: 60,
      auto_buy_supplies_purchased: false,
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
    manualPrintQuantity: 1,
    isPrintDisabled: false,
    printTicket: vi.fn<() => void>(),
    ...overrides,
  };
}

describe("EverGreaterMainPage", () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue(createAuthMockValue());
    mockedUseGame.mockReturnValue(createGameMockValue());
  });

  it("renders the auto-buy management panel for shop-eligible users", () => {
    render(<EverGreaterMainPage onLogout={vi.fn()} />);

    expect(screen.getByText("Auto-buy management")).toBeTruthy();
  });

  it("renders the auto-buy management panel for previously unlocked users even below shop threshold", () => {
    mockedUseAuth.mockReturnValue(
      createAuthMockValue({
        user: mockUser({
          tickets_contributed: 25,
          auto_buy_supplies_purchased: true,
        }),
      }),
    );

    render(<EverGreaterMainPage onLogout={vi.fn()} />);

    expect(screen.getByText("Auto-buy management")).toBeTruthy();
    expect(screen.queryByText("Shop")).toBeNull();
    expect(screen.queryByText("Upgrades")).toBeNull();
  });
});
