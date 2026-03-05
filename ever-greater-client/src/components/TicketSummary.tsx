import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import { JSX } from "react";
import type { User } from "../api/auth";
import GlobalTicketDisplay from "./GlobalTicketDisplay";
import TicketDrawCapacity from "./TicketDrawCapacity";

type TicketSummaryProps = {
  user: User;
  scalingNumber: number;
};

const TicketCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: "left",
}));

function TicketSummary({
  user,
  scalingNumber,
}: TicketSummaryProps): JSX.Element {
  return (
    <TicketCard elevation={3}>
      <GlobalTicketDisplay scalingNumber={scalingNumber} />
      <Typography variant="body1" color="text.secondary">
        Tickets contributed: {user.tickets_contributed}
      </Typography>

      <TicketDrawCapacity user={user} />
    </TicketCard>
  );
}

export default TicketSummary;
