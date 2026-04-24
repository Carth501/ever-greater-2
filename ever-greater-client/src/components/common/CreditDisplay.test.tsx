import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { mockUser } from "../../tests/fixtures";
import CreditDisplay from "./CreditDisplay";

const { getMaxCreditValueMock } = vi.hoisted(() => ({
  getMaxCreditValueMock: vi.fn(),
}));

vi.mock("ever-greater-shared", async () => {
  const actual = await vi.importActual<typeof import("ever-greater-shared")>(
    "ever-greater-shared",
  );

  return {
    ...actual,
    getMaxCreditValue: getMaxCreditValueMock,
  };
});

describe("CreditDisplay", () => {
  it("shows the max credit when computed capacity is greater than 1", () => {
    getMaxCreditValueMock.mockReturnValue(2);

    render(
      <CreditDisplay
        user={mockUser({
          credit_value: 1,
        })}
      />,
    );

    expect(screen.getByText(/Credit:/).textContent).toMatch(
      /^Credit:\s*1\.0\s*\/\s*2$/,
    );
  });

  it("hides the max credit when computed capacity is 1 or less", () => {
    getMaxCreditValueMock.mockReturnValue(1);

    render(
      <CreditDisplay
        user={mockUser({
          credit_value: 1,
        })}
      />,
    );

    expect(screen.getByText(/Credit:/).textContent).toMatch(/^Credit:\s*1\.0$/);
  });
});
