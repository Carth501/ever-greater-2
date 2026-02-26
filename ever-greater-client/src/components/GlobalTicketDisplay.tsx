import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import { JSX } from "react";

interface Props {
  scalingNumber: number;
}

const TicketCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: "center",
}));

function GlobalTicketDisplay({ scalingNumber }: Props): JSX.Element {
  return (
    <TicketCard elevation={3}>
      <Typography variant="overline" color="text.secondary">
        Ticket Pool
      </Typography>
      <Typography variant="h3" fontWeight={700}>
        {scalingNumber.toLocaleString()}
      </Typography>
    </TicketCard>
  );
}

export default GlobalTicketDisplay;
