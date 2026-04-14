import SensorsIcon from "@mui/icons-material/Sensors";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
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
  return (
    <PanelCard elevation={0}>
      <Stack spacing={2.5}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <SensorsIcon color="primary" />
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Realtime health
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Compact enough to stay visible, detailed enough to remain useful.
            </Typography>
          </Box>
        </Stack>

        <StatusList>
          <StatusRow>
            <Typography variant="body2">Connection</Typography>
            <Chip label={signalLabel} color={signalColor} size="small" />
          </StatusRow>
          <StatusRow>
            <Typography variant="body2">Last update</Typography>
            <Typography variant="body2" color="text.secondary">
              {formatTimestamp(lastUpdateAt)}
            </Typography>
          </StatusRow>
          <StatusRow>
            <Typography variant="body2">Recovery strategy</Typography>
            <Typography variant="body2" color="text.secondary">
              {hasLiveUser ? "Auto reconnect" : "Preview snapshot"}
            </Typography>
          </StatusRow>
        </StatusList>
      </Stack>
    </PanelCard>
  );
}