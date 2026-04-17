import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PrintControls from "./PrintControls";

describe("PrintControls", () => {
  it("should render the print button", () => {
    const mockOnPrintClick = vi.fn();
    render(
      <PrintControls
        supplies={10}
        printQuantity={1}
        isDisabled={false}
        onPrintClick={mockOnPrintClick}
      />,
    );

    expect(
      screen.getByRole("button", { name: /print a ticket/i }),
    ).toBeTruthy();
  });

  it("should display the current supplies count", () => {
    const mockOnPrintClick = vi.fn();
    render(
      <PrintControls
        supplies={15}
        printQuantity={1}
        isDisabled={false}
        onPrintClick={mockOnPrintClick}
      />,
    );

    expect(screen.getByText("15")).toBeTruthy();
  });

  it("should call onPrintClick when print button is clicked", () => {
    const mockOnPrintClick = vi.fn();
    render(
      <PrintControls
        supplies={10}
        printQuantity={1}
        isDisabled={false}
        onPrintClick={mockOnPrintClick}
      />,
    );

    const printButton = screen.getByRole("button", { name: /print a ticket/i });
    fireEvent.click(printButton);

    expect(mockOnPrintClick).toHaveBeenCalledOnce();
  });

  it("should disable the print button when isDisabled is true", () => {
    const mockOnPrintClick = vi.fn();
    render(
      <PrintControls
        supplies={0}
        printQuantity={1}
        isDisabled={true}
        onPrintClick={mockOnPrintClick}
      />,
    );

    const printButton = screen.getByRole("button", {
      name: /print a ticket/i,
    }) as HTMLButtonElement;
    expect(printButton.disabled).toBe(true);
    expect(
      screen.getByText(
        /printing is disabled because supplies are depleted\. refill stock to resume ticket printing\./i,
      ),
    ).toBeTruthy();
  });

  it("should enable the print button when isDisabled is false", () => {
    const mockOnPrintClick = vi.fn();
    render(
      <PrintControls
        supplies={10}
        printQuantity={1}
        isDisabled={false}
        onPrintClick={mockOnPrintClick}
      />,
    );

    const printButton = screen.getByRole("button", {
      name: /print a ticket/i,
    }) as HTMLButtonElement;
    expect(printButton.disabled).toBe(false);
  });

  it("should render the Supplies label", () => {
    const mockOnPrintClick = vi.fn();
    render(
      <PrintControls
        supplies={10}
        printQuantity={1}
        isDisabled={false}
        onPrintClick={mockOnPrintClick}
      />,
    );

    expect(screen.getByText("Supplies")).toBeTruthy();
  });

  it("announces readiness state and button guidance", () => {
    const mockOnPrintClick = vi.fn();
    render(
      <PrintControls
        supplies={10}
        printQuantity={1}
        isDisabled={false}
        onPrintClick={mockOnPrintClick}
      />,
    );

    expect(screen.getAllByRole("status").length).toBeGreaterThanOrEqual(2);
    expect(
      screen.getByText(/printing is available and ready from this panel\./i),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /supplies are in a healthy range and ready for the current print loop\./i,
      ),
    ).toBeTruthy();
  });

  it("shows the batch quantity in the button label", () => {
    const mockOnPrintClick = vi.fn();
    render(
      <PrintControls
        supplies={10}
        printQuantity={4}
        isDisabled={false}
        onPrintClick={mockOnPrintClick}
      />,
    );

    expect(
      screen.getByRole("button", { name: /print 4 tickets/i }),
    ).toBeTruthy();
  });

  it("explains when supplies are below the current batch requirement", () => {
    const mockOnPrintClick = vi.fn();
    render(
      <PrintControls
        supplies={2}
        printQuantity={4}
        isDisabled={true}
        onPrintClick={mockOnPrintClick}
      />,
    );

    expect(
      screen.getByText(
        /printing is disabled because the current batch needs 4 supplies\./i,
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /2 supplies available\. 4 are required for the current batch\./i,
      ),
    ).toBeTruthy();
  });
});
