import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useId } from "react";
import { dashboardContent } from "./content";
import { PanelCard } from "./styles";

type DashboardAccountPanelProps = {
  hasLiveUser: boolean;
  userEmail: string;
};

export function DashboardAccountPanel({
  hasLiveUser,
  userEmail,
}: DashboardAccountPanelProps) {
  const headingId = useId();
  const emailId = useId();

  return (
    <Box component="section" aria-label="Account" aria-describedby={emailId}>
      <PanelCard elevation={0}>
        <Stack spacing={2}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
          >
            <Box>
              <Typography
                aria-label={dashboardContent.account.regionLabel}
                variant="subtitle2"
                color="text.secondary"
              >
                {dashboardContent.account.heading}
              </Typography>
              <Typography id={emailId} variant="h5" fontWeight={700}>
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
              <Box role="status" aria-live="polite" aria-atomic="true">
                <Chip
                  icon={<AutoAwesomeIcon />}
                  label={
                    hasLiveUser
                      ? dashboardContent.account.modeLive
                      : dashboardContent.account.modePreview
                  }
                  color="primary"
                  variant="outlined"
                />
              </Box>
            </Stack>
          </Stack>
        </Stack>
      </PanelCard>
    </Box>
  );
}
