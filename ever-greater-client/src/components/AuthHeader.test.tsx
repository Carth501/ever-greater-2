import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AuthHeader from "./AuthHeader";

describe("AuthHeader", () => {
  const mockUser = {
    id: 1,
    email: "test@example.com",
    tickets_contributed: 5,
    tickets_withdrawn: 0,
    printer_supplies: 10,
    money: 100,
    gold: 50,
    autoprinters: 0,
    credit_value: 100,
    credit_capacity_level: 200,
    credit_generation_level: 1,
  };

  it("should render user email", () => {
    const mockOnLogout = vi.fn();
    render(<AuthHeader user={mockUser} onLogout={mockOnLogout} />);

    expect(screen.getByText("test@example.com")).toBeTruthy();
  });

  it("should render 'Signed in as' label", () => {
    const mockOnLogout = vi.fn();
    render(<AuthHeader user={mockUser} onLogout={mockOnLogout} />);

    expect(screen.getByText("Signed in as")).toBeTruthy();
  });

  it("should call onLogout when logout button is clicked", async () => {
    const mockOnLogout = vi.fn();
    render(<AuthHeader user={mockUser} onLogout={mockOnLogout} />);

    const logoutButton = screen.getByRole("button", { name: /logout/i });
    await userEvent.click(logoutButton);

    expect(mockOnLogout).toHaveBeenCalledOnce();
  });

  it("should render logout button", () => {
    const mockOnLogout = vi.fn();
    render(<AuthHeader user={mockUser} onLogout={mockOnLogout} />);

    expect(screen.getByRole("button", { name: /logout/i })).toBeTruthy();
  });
});
