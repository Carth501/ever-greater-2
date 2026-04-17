type PrintPresentationMode = "classic" | "dashboard";

type BuildPrintPresentationOptions = {
  supplies: number;
  printQuantity: number;
  isActionDisabled: boolean;
  mode: PrintPresentationMode;
  hasLiveUser?: boolean;
  isAutoBuyActive?: boolean;
  formatNumber?: (value: number) => string;
};

type PrintPresentation = {
  isOutOfSupplies: boolean;
  hasInsufficientSupplies: boolean;
  printButtonLabel: string;
  buttonHelperText: string;
  suppliesStatusText: string;
};

function defaultFormatNumber(value: number): string {
  return String(value);
}

export function buildPrintPresentation({
  supplies,
  printQuantity,
  isActionDisabled,
  mode,
  hasLiveUser = true,
  isAutoBuyActive = false,
  formatNumber = defaultFormatNumber,
}: BuildPrintPresentationOptions): PrintPresentation {
  const isOutOfSupplies = supplies === 0;
  const hasInsufficientSupplies = supplies < printQuantity;
  const formattedSupplies = formatNumber(supplies);
  const formattedPrintQuantity = formatNumber(printQuantity);
  const printButtonLabel =
    printQuantity === 1
      ? "Print a ticket"
      : `Print ${formattedPrintQuantity} tickets`;

  if (mode === "dashboard" && !hasLiveUser) {
    return {
      isOutOfSupplies,
      hasInsufficientSupplies,
      printButtonLabel,
      buttonHelperText:
        "Printing is disabled in preview mode because no live account is connected.",
      suppliesStatusText: hasInsufficientSupplies
        ? isOutOfSupplies
          ? "No supplies available. Printing is blocked until stock is restored."
          : `${formattedSupplies} supplies available. ${formattedPrintQuantity} are required for the current batch.`
        : isAutoBuyActive
          ? "Auto-buy is active. Stock can recover without leaving the main workflow."
          : "Supplies are live from the current user state. Enable automation to reduce refill interruptions.",
    };
  }

  const buttonHelperText = hasInsufficientSupplies
    ? isOutOfSupplies
      ? mode === "dashboard"
        ? "Printing is disabled because supplies are depleted. Restore stock to continue."
        : "Printing is disabled because supplies are depleted. Refill stock to resume ticket printing."
      : `Printing is disabled because the current batch needs ${formattedPrintQuantity} supplies.`
    : isActionDisabled
      ? "Printing is temporarily unavailable while the current action finishes."
      : "Printing is available and ready from this panel.";

  const suppliesStatusText = hasInsufficientSupplies
    ? isOutOfSupplies
      ? "No supplies available. Printing is blocked until stock is restored."
      : `${formattedSupplies} supplies available. ${formattedPrintQuantity} are required for the current batch.`
    : mode === "dashboard"
      ? isAutoBuyActive
        ? "Auto-buy is active. Stock can recover without leaving the main workflow."
        : "Supplies are live from the current user state. Enable automation to reduce refill interruptions."
      : "Supplies are in a healthy range and ready for the current print loop.";

  return {
    isOutOfSupplies,
    hasInsufficientSupplies,
    printButtonLabel,
    buttonHelperText,
    suppliesStatusText,
  };
}
