import BoltIcon from "@mui/icons-material/Bolt";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useId } from "react";
import { buildPrintPresentation } from "../../../lib/printPresentation";
import { dashboardContent } from "./content";
import { formatNumber } from "./helpers";
import { AccentPanel, PanelCard, PrintZone } from "./styles";

type DashboardPrintPanelProps = {
  hasLiveUser: boolean;
  isAutoBuyActive: boolean;
  manualPrintQuantity: number;
  onPrintTicket?: () => void;
  printButtonDisabled: boolean;
  visibleSupplies: number;
};

export function DashboardPrintPanel({
  hasLiveUser,
  isAutoBuyActive,
  manualPrintQuantity,
  onPrintTicket,
  printButtonDisabled,
  visibleSupplies,
}: DashboardPrintPanelProps) {
  const headingId = useId();
  const descriptionId = useId();
  const helperTextId = useId();
  const { printButtonLabel, buttonHelperText, suppliesStatusText } =
    buildPrintPresentation({
      supplies: visibleSupplies,
      printQuantity: manualPrintQuantity,
      isActionDisabled: printButtonDisabled,
      mode: "dashboard",
      hasLiveUser,
      isAutoBuyActive,
      formatNumber,
    });

  return (
    <Box
      component="section"
      aria-label={dashboardContent.print.regionLabel}
      aria-describedby={descriptionId}
    >
      <PanelCard elevation={0}>
        <Stack spacing={2.5}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
          >
            <Box>
              <Typography id={headingId} variant="h5" fontWeight={700}>
                {dashboardContent.print.heading}
              </Typography>
              <Typography
                id={descriptionId}
                variant="body2"
                color="text.secondary"
              >
                {dashboardContent.print.description}
              </Typography>
            </Box>
            <Box role="status" aria-live="polite" aria-atomic="true">
              <Chip
                icon={<BoltIcon />}
                label={
                  hasLiveUser
                    ? dashboardContent.print.liveChipLabel
                    : dashboardContent.print.previewChipLabel
                }
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
                  {printButtonLabel}
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
    </Box>
  );
}
