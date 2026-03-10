import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { JSX } from "react";
import type { User } from "../../api/auth";

type TicketDrawCapacityProps = {
  user: User;
};

/**
 * Displays the player's ticket draw capacity from the global pool.
 * - tickets_contributed: How many tickets user has contributed (personal limit basis)
 * - tickets_withdrawn: How many tickets user has withdrawn in the past 24 hours
 * - Remaining capacity: tickets_contributed - tickets_withdrawn
 * - Personal limit modifier: Currently hardcoded to 1.0 (may be made configurable)
 */
function TicketDrawCapacity({ user }: TicketDrawCapacityProps): JSX.Element {
  const ticketsContributed = user.tickets_contributed ?? 0;
  const ticketsWithdrawn = user.tickets_withdrawn ?? 0;
  const personalLimit = ticketsContributed * 1.0; // modifier currently hardcoded to 1.0
  const remainingCapacity = Math.max(0, personalLimit - ticketsWithdrawn);

  // Ensure we don't divide by zero
  const progressValue =
    personalLimit > 0 ? (ticketsWithdrawn / personalLimit) * 100 : 0;

  return (
    <Stack spacing={1}>
      <Box>
        <Typography variant="body1" color="text.secondary">
          Personal Ticket Capacity: <strong>{ticketsWithdrawn}</strong> /{" "}
          {personalLimit} ({progressValue.toFixed(1)}%)
        </Typography>
        {personalLimit > 0 && (
          <LinearProgress
            variant="determinate"
            value={Math.min(progressValue, 100)}
            sx={{ mt: 0.5 }}
          />
        )}
      </Box>
      <Typography variant="body2" color="text.secondary">
        Remaining: <strong>{remainingCapacity}</strong>
      </Typography>
    </Stack>
  );
}

export default TicketDrawCapacity;
