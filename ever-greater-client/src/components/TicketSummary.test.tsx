import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TicketSummary from "./TicketSummary";

// Mock the child components
vi.mock("./GlobalTicketDisplay", () => ({
  default: ({ scalingNumber }: { scalingNumber: number }) => (
    <div data-testid="global-ticket-display">{scalingNumber}</div>
  ),
}));

vi.mock("./TicketDrawCapacity", () => ({
  default: ({ user }: { user: any }) => (
    <div data-testid="ticket-draw-capacity">{user.id}</div>
  ),
}));

describe("TicketSummary", () => {
  const mockUser = {
    id: 1,
    email: "test@example.com",
    tickets_contributed: 250,
    tickets_withdrawn: 0,
    printer_supplies: 10,
    money: 100,
    gold: 50,
    autoprinters: 0,
    credit_value: 100,
    credit_capacity_level: 200,
    credit_generation_level: 1,
    auto_buy_supplies_purchased: false,
    auto_buy_supplies_active: false,
  };

  it("should render the global ticket display component", () => {
    render(<TicketSummary user={mockUser} scalingNumber={1000} />);

    expect(screen.getByTestId("global-ticket-display")).toBeTruthy();
  });

  it("should render the ticket draw capacity component", () => {
    render(<TicketSummary user={mockUser} scalingNumber={1000} />);

    expect(screen.getByTestId("ticket-draw-capacity")).toBeTruthy();
  });

  it("should display tickets contributed", () => {
    render(<TicketSummary user={mockUser} scalingNumber={1000} />);

    expect(screen.getByText("Tickets contributed: 250")).toBeTruthy();
  });

  it("should pass correct scalingNumber to GlobalTicketDisplay", () => {
    render(<TicketSummary user={mockUser} scalingNumber={5000} />);

    expect(screen.getByText("5000")).toBeTruthy();
  });

  it("should pass correct user to TicketDrawCapacity", () => {
    render(<TicketSummary user={mockUser} scalingNumber={1000} />);

    expect(screen.getByTestId("ticket-draw-capacity")).toBeTruthy();
  });
});
