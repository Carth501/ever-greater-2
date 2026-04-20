import { describe, expect, it } from "vitest";
import { buildPrintPresentation } from "./printPresentation";

describe("buildPrintPresentation", () => {
  it("builds classic panel copy for batch shortages", () => {
    expect(
      buildPrintPresentation({
        supplies: 2,
        printQuantity: 4,
        isActionDisabled: true,
        mode: "classic",
      }),
    ).toMatchObject({
      printButtonLabel: "Print 4 tickets",
      buttonHelperText:
        "Printing is disabled because the current batch needs 4 supplies.",
      suppliesStatusText:
        "2 supplies available. 4 are required for the current batch.",
    });
  });

  it("builds dashboard copy for preview mode", () => {
    expect(
      buildPrintPresentation({
        supplies: 24,
        printQuantity: 1,
        isActionDisabled: true,
        mode: "dashboard",
        hasLiveUser: false,
      }),
    ).toMatchObject({
      printButtonLabel: "Print a ticket",
      buttonHelperText:
        "Printing is disabled in preview mode because no live account is connected.",
      suppliesStatusText:
        "Supplies are live from the current user state. Enable automation to reduce refill interruptions.",
    });
  });

  it("uses the dashboard auto-buy readiness message when stock is healthy", () => {
    expect(
      buildPrintPresentation({
        supplies: 24,
        printQuantity: 4,
        isActionDisabled: false,
        mode: "dashboard",
        hasLiveUser: true,
        isAutoBuyActive: true,
        formatNumber: (value) => `#${value}`,
      }),
    ).toMatchObject({
      printButtonLabel: "Print #4 tickets",
      buttonHelperText: "Printing is available and ready from this panel.",
      suppliesStatusText:
        "Auto-buy is active. Stock can recover without leaving the main workflow.",
    });
  });

  it("uses formatted numbers in dashboard shortage copy", () => {
    expect(
      buildPrintPresentation({
        supplies: 2,
        printQuantity: 4,
        isActionDisabled: true,
        mode: "dashboard",
        hasLiveUser: true,
        formatNumber: (value) => value.toLocaleString("en-US"),
      }),
    ).toMatchObject({
      buttonHelperText:
        "Printing is disabled because the current batch needs 4 supplies.",
      suppliesStatusText:
        "2 supplies available. 4 are required for the current batch.",
    });
  });
});
