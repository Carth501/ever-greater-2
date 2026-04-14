import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { formatNumber, formatSignedValue } from "./helpers";
import { AccentPanel, MetricCard, MetricsRow } from "./styles";

type DashboardTicketPanelProps = {
  globalTicketCount: number;
  hasLiveUser: boolean;
  isTicketLoading: boolean;
  poolMomentum: number;
  remainingCapacity: number;
  ticketsContributed: number;
  ticketsWithdrawn: number;
};

export function DashboardTicketPanel({
  globalTicketCount,
  hasLiveUser,
  isTicketLoading,
  poolMomentum,
  remainingCapacity,
  ticketsContributed,
  ticketsWithdrawn,
}: DashboardTicketPanelProps) {
  return (
    <AccentPanel elevation={0}>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="subtitle2" color="primary.light">
            Ticket pool overview
          </Typography>
          <Typography variant="h2" fontWeight={700} sx={{ mt: 0.75 }}>
            {isTicketLoading && hasLiveUser
              ? "Syncing..."
              : formatNumber(globalTicketCount)}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Tickets contributed: {formatNumber(ticketsContributed)}
          </Typography>
        </Box>

        <MetricsRow>
          <MetricCard>
            <Typography variant="subtitle2" color="text.secondary">
              24h Withdrawals
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {formatNumber(ticketsWithdrawn)}
            </Typography>
          </MetricCard>
          <MetricCard>
            <Typography variant="subtitle2" color="text.secondary">
              Remaining Capacity
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {formatNumber(remainingCapacity)}
            </Typography>
          </MetricCard>
          <MetricCard>
            <Typography variant="subtitle2" color="text.secondary">
              Pool Momentum
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {formatSignedValue(poolMomentum)}
            </Typography>
          </MetricCard>
        </MetricsRow>
      </Stack>
    </AccentPanel>
  );
}
