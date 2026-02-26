import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import { JSX } from "react";

interface Props {
  scalingNumber: number;
}

const Organizer = styled(Paper)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: theme.spacing(2),
}));

function GlobalTicketDisplay({ scalingNumber }: Props): JSX.Element {
  return (
    <Organizer>
      <Typography variant="h3" color="text.secondary">
        Ticket Pool
      </Typography>
      <Typography variant="h1" fontWeight={700}>
        {scalingNumber.toLocaleString()}
      </Typography>
    </Organizer>
  );
}

export default GlobalTicketDisplay;
