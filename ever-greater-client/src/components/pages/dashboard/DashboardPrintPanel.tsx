import BoltIcon from "@mui/icons-material/Bolt";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useId } from "react";
import { formatNumber } from "./helpers";
import { AccentPanel, PanelCard, PrintZone } from "./styles";

type DashboardPrintPanelProps = {
  hasLiveUser: boolean;
  isAutoBuyActive: boolean;
  onPrintTicket?: () => void;
  printButtonDisabled: boolean;
  visibleSupplies: number;
};

export function DashboardPrintPanel({
  hasLiveUser,
  isAutoBuyActive,
  onPrintTicket,
  printButtonDisabled,
  visibleSupplies,
}: DashboardPrintPanelProps) {
  const helperTextId = useId();
  const isOutOfSupplies = visibleSupplies === 0;
  const buttonHelperText = !hasLiveUser
    ? "Printing is disabled in preview mode because no live account is connected."
    : isOutOfSupplies
      ? "Printing is disabled because supplies are depleted. Restore stock to continue."
      : printButtonDisabled
        ? "Printing is temporarily unavailable while the current action finishes."
        : "Printing is available and ready from this panel.";
  const suppliesStatusText = isOutOfSupplies
    ? "No supplies available. Printing is blocked until stock is restored."
    : isAutoBuyActive
      ? "Auto-buy is active. Stock can recover without leaving the main workflow."
      : "Supplies are live from the current user state. Enable automation to reduce refill interruptions.";

  return (
    <PanelCard elevation={0}>
      <Stack spacing={2.5}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
        >
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Print controls
            </Typography>
            <Typography variant="body2" color="text.secondary">
              The primary action stays obvious even when more panels are
              enabled.
            </Typography>
          </Box>
          <Box role="status" aria-live="polite" aria-atomic="true">
            <Chip
              icon={<BoltIcon />}
              label={hasLiveUser ? "Live action" : "Preview only"}
              color="primary"
            />
          </Box>
        </Stack>

        <PrintZone>
          <AccentPanel elevation={0}>
            <Stack spacing={2}>
              <Typography variant="subtitle2" color="primary.light">
                Main action
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {hasLiveUser
                  ? "This button reflects the real disabled state from the store and can use the current print handler when live data is available."
                  : "Printing remains the clearest call to action, with the accent color reserved for the highest-priority interaction."}
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={hasLiveUser ? onPrintTicket : undefined}
                disabled={printButtonDisabled}
                aria-describedby={helperTextId}
                sx={{ alignSelf: "flex-start", minWidth: 220 }}
              >
                Print a ticket
              </Button>
              <Typography
                id={helperTextId}
                variant="body2"
                color="text.secondary"
              >
                {buttonHelperText}
              </Typography>
            </Stack>
          </AccentPanel>

          <PanelCard elevation={0}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Supplies
              </Typography>
              <Typography variant="h3" fontWeight={700}>
                {formatNumber(visibleSupplies)}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                {suppliesStatusText}
              </Typography>
            </Stack>
          </PanelCard>
        </PrintZone>
      </Stack>
    </PanelCard>
  );
}
