import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha, styled } from "@mui/material/styles";
import { JSX } from "react";
import type { User } from "../../api/auth";
import GlobalTicketDisplay from "./GlobalTicketDisplay";
import TicketDrawCapacity from "./TicketDrawCapacity";

type TicketSummaryProps = {
  user: User;
  scalingNumber: number;
};

const TicketCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2.5),
  borderRadius: 20,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.28)}`,
  background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.14)} 0%, ${alpha(theme.palette.background.paper, 0.96)} 100%)`,
  boxShadow: `0 14px 30px ${alpha(theme.palette.common.black, 0.22)}`,
  textAlign: "left",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
  },
}));

const MetricsRow = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: theme.spacing(2),
  [theme.breakpoints.down("sm")]: {
    gap: theme.spacing(1.5),
  },
}));

const MetricCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.75),
  borderRadius: 16,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
  backgroundColor: alpha(theme.palette.common.white, 0.03),
}));

function TicketSummary({
  user,
  scalingNumber,
}: TicketSummaryProps): JSX.Element {
  const ticketsContributed = user.tickets_contributed ?? 0;
  const ticketsWithdrawn = user.tickets_withdrawn ?? 0;
  const remainingCapacity = Math.max(0, ticketsContributed - ticketsWithdrawn);

  return (
    <TicketCard elevation={0}>
      <Stack spacing={2}>
        <GlobalTicketDisplay scalingNumber={scalingNumber} />

        <Typography variant="body1" color="text.secondary">
          Tickets contributed: {ticketsContributed}
        </Typography>

        <MetricsRow>
          <MetricCard>
            <Typography variant="subtitle2" color="text.secondary">
              Contributions
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {ticketsContributed.toLocaleString()}
            </Typography>
          </MetricCard>

          <MetricCard>
            <Typography variant="subtitle2" color="text.secondary">
              24h Withdrawals
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {ticketsWithdrawn.toLocaleString()}
            </Typography>
          </MetricCard>

          <MetricCard>
            <Typography variant="subtitle2" color="text.secondary">
              Remaining Capacity
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {remainingCapacity.toLocaleString()}
            </Typography>
          </MetricCard>
        </MetricsRow>

        {ticketsContributed > 200 && <TicketDrawCapacity user={user} />}
      </Stack>
    </TicketCard>
  );
}

export default TicketSummary;
