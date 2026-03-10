import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PrintControls from "./PrintControls";

describe("PrintControls", () => {
  it("should render the print button", () => {
    const mockOnPrintClick = vi.fn();
    render(
      <PrintControls
        supplies={10}
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
        isDisabled={false}
        onPrintClick={mockOnPrintClick}
      />,
    );

    expect(screen.getByText("15")).toBeTruthy();
  });

  it("should call onPrintClick when print button is clicked", async () => {
    const mockOnPrintClick = vi.fn();
    render(
      <PrintControls
        supplies={10}
        isDisabled={false}
        onPrintClick={mockOnPrintClick}
      />,
    );

    const printButton = screen.getByRole("button", { name: /print a ticket/i });
    await userEvent.click(printButton);

    expect(mockOnPrintClick).toHaveBeenCalledOnce();
  });

  it("should disable the print button when isDisabled is true", () => {
    const mockOnPrintClick = vi.fn();
    render(
      <PrintControls
        supplies={0}
        isDisabled={true}
        onPrintClick={mockOnPrintClick}
      />,
    );

    const printButton = screen.getByRole("button", {
      name: /print a ticket/i,
    }) as HTMLButtonElement;
    expect(printButton.disabled).toBe(true);
  });

  it("should enable the print button when isDisabled is false", () => {
    const mockOnPrintClick = vi.fn();
    render(
      <PrintControls
        supplies={10}
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
        isDisabled={false}
        onPrintClick={mockOnPrintClick}
      />,
    );

    expect(screen.getByText("Supplies")).toBeTruthy();
  });
});
