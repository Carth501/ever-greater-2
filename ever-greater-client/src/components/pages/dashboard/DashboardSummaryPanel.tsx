import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { AccentPanel } from "./styles";

export function DashboardSummaryPanel() {
  return (
    <AccentPanel elevation={0}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <TrendingUpIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            Why this dashboard works
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          The interface feels more intentional because the main action,
          supporting metrics, and optional panels each have distinct visual
          weight. The user can simplify the surface without losing the core
          workflow.
        </Typography>
      </Stack>
    </AccentPanel>
  );
}