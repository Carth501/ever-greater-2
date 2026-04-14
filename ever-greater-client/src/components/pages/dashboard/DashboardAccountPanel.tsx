import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SensorsIcon from "@mui/icons-material/Sensors";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PanelCard } from "./styles";
import type { SignalColor } from "./types";

type DashboardAccountPanelProps = {
  hasLiveUser: boolean;
  signalColor: SignalColor;
  signalLabel: string;
  userEmail: string;
};

export function DashboardAccountPanel({
  hasLiveUser,
  signalColor,
  signalLabel,
  userEmail,
}: DashboardAccountPanelProps) {
  return (
    <PanelCard elevation={0}>
      <Stack spacing={2}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
        >
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Signed in as
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {userEmail}
            </Typography>
          </Box>
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            flexWrap="wrap"
            justifyContent="flex-end"
          >
            <Chip
              icon={<SensorsIcon />}
              label={signalLabel}
              color={signalColor}
              variant="outlined"
            />
            <Chip
              icon={<AutoAwesomeIcon />}
              label={
                hasLiveUser ? "Live data bound" : "Preview fallback active"
              }
              color="primary"
              variant="outlined"
            />
          </Stack>
        </Stack>
      </Stack>
    </PanelCard>
  );
}
