import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import { JSX } from "react";
import { useAnimatedNumber } from "../../hooks/useAnimatedNumber";

interface Props {
  scalingNumber: number;
}

const Organizer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "flex-start",
  gap: theme.spacing(1),
}));

function GlobalTicketDisplay({ scalingNumber }: Props): JSX.Element {
  const displayValue = useAnimatedNumber(scalingNumber);

  return (
    <Organizer>
      <Typography variant="subtitle2" color="primary.light">
        Ticket Pool
      </Typography>
      <Typography variant="h1" fontWeight={700}>
        {displayValue.toLocaleString()}
      </Typography>
    </Organizer>
  );
}

export default GlobalTicketDisplay;
