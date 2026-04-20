import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useId } from "react";
import { dashboardContent } from "./content";
import { AccentPanel } from "./styles";

export function DashboardSummaryPanel() {
  const headingId = useId();
  const descriptionId = useId();

  return (
    <Box
      component="section"
      aria-label={dashboardContent.summary.regionLabel}
      aria-describedby={descriptionId}
    >
      <AccentPanel elevation={0}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <TrendingUpIcon color="primary" />
            <Typography id={headingId} variant="h6" fontWeight={700}>
              {dashboardContent.summary.heading}
            </Typography>
          </Stack>
          <Typography id={descriptionId} variant="body2" color="text.secondary">
            {dashboardContent.summary.description}
          </Typography>
        </Stack>
      </AccentPanel>
    </Box>
  );
}
