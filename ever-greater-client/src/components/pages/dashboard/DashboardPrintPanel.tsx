import BoltIcon from "@mui/icons-material/Bolt";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
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
          <Chip
            icon={<BoltIcon />}
            label={hasLiveUser ? "Live action" : "Preview only"}
            color="primary"
          />
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
                sx={{ alignSelf: "flex-start", minWidth: 220 }}
              >
                Print a ticket
              </Button>
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
              <Typography variant="body2" color="text.secondary">
                {visibleSupplies === 0
                  ? "No supplies available. Printing is blocked until stock is restored."
                  : isAutoBuyActive
                    ? "Auto-buy is active. Stock can recover without leaving the main workflow."
                    : "Supplies are live from the current user state. Enable automation to reduce refill interruptions."}
              </Typography>
            </Stack>
          </PanelCard>
        </PrintZone>
      </Stack>
    </PanelCard>
  );
}
