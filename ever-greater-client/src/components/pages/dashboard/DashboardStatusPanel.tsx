import SensorsIcon from "@mui/icons-material/Sensors";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useId } from "react";
import { formatTimestamp } from "./helpers";
import { PanelCard, StatusList, StatusRow } from "./styles";
import type { SignalColor } from "./types";

type DashboardStatusPanelProps = {
  hasLiveUser: boolean;
  lastUpdateAt: number | null;
  signalColor: SignalColor;
  signalLabel: string;
};

export function DashboardStatusPanel({
  hasLiveUser,
  lastUpdateAt,
  signalColor,
  signalLabel,
}: DashboardStatusPanelProps) {
  const headingId = useId();
  const descriptionId = useId();

  return (
    <Box
      component="section"
      aria-label="Realtime status"
      aria-describedby={descriptionId}
    >
      <PanelCard elevation={0}>
        <Stack spacing={2.5}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <SensorsIcon color="primary" />
            <Box>
              <Typography id={headingId} variant="h6" fontWeight={700}>
                Realtime health
              </Typography>
              <Typography
                id={descriptionId}
                variant="body2"
                color="text.secondary"
              >
                Compact enough to stay visible, detailed enough to remain
                useful.
              </Typography>
            </Box>
          </Stack>

          <Box component="dl" sx={{ m: 0 }}>
            <StatusList>
              <StatusRow>
                <Typography component="dt" variant="body2">
                  Connection
                </Typography>
                <Box role="status" aria-live="polite" aria-atomic="true">
                  <Chip label={signalLabel} color={signalColor} size="small" />
                </Box>
              </StatusRow>
              <StatusRow>
                <Typography component="dt" variant="body2">
                  Last update
                </Typography>
                <Typography
                  component="dd"
                  variant="body2"
                  color="text.secondary"
                  sx={{ m: 0 }}
                >
                  {formatTimestamp(lastUpdateAt)}
                </Typography>
              </StatusRow>
              <StatusRow>
                <Typography component="dt" variant="body2">
                  Recovery strategy
                </Typography>
                <Typography
                  component="dd"
                  variant="body2"
                  color="text.secondary"
                  sx={{ m: 0 }}
                >
                  {hasLiveUser ? "Auto reconnect" : "Preview snapshot"}
                </Typography>
              </StatusRow>
            </StatusList>
          </Box>
        </Stack>
      </PanelCard>
    </Box>
  );
}
