import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { mockUser } from "../../tests/fixtures";
import AuthHeader from "./AuthHeader";

vi.mock("./RealtimeStatusPanel", () => ({
  default: () => <div data-testid="realtime-status-panel" />,
}));

describe("AuthHeader", () => {
  const user = mockUser({
    printer_supplies: 10,
    money: 100,
    gold: 50,
    credit_value: 100,
    credit_capacity_level: 200,
    credit_generation_level: 1,
  });

  it("should render user email", () => {
    const mockOnLogout = vi.fn();
    render(<AuthHeader user={user} onLogout={mockOnLogout} />);

    expect(screen.getByText("test@example.com")).toBeTruthy();
  });

  it("should render 'Signed in as' label", () => {
    const mockOnLogout = vi.fn();
    render(<AuthHeader user={user} onLogout={mockOnLogout} />);

    expect(screen.getByText("Signed in as")).toBeTruthy();
  });

  it("should call onLogout when logout button is clicked", () => {
    const mockOnLogout = vi.fn();
    render(<AuthHeader user={user} onLogout={mockOnLogout} />);

    const logoutButton = screen.getByRole("button", { name: /logout/i });
    fireEvent.click(logoutButton);

    expect(mockOnLogout).toHaveBeenCalledOnce();
  });

  it("should render logout button", () => {
    const mockOnLogout = vi.fn();
    render(<AuthHeader user={user} onLogout={mockOnLogout} />);

    expect(screen.getByRole("button", { name: /logout/i })).toBeTruthy();
  });
});
