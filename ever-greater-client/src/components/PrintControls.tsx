import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import { JSX } from "react";

type PrintControlsProps = {
  supplies: number;
  isDisabled: boolean;
  onPrintClick: () => void;
};

const ControlsRow = styled(Stack)(({ theme }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: theme.spacing(2),
  flexWrap: "wrap",
}));

interface SuppliesCardProps {
  depleted: boolean;
}

const SuppliesCard = styled(Paper, {
  shouldForwardProp: (prop) => prop !== "depleted",
})<SuppliesCardProps>(({ theme, depleted }) => ({
  padding: theme.spacing(1.5, 2.5),
  border: `1px solid ${depleted ? theme.palette.error.main : theme.palette.divider}`,
  backgroundColor: depleted
    ? theme.palette.error.light
    : theme.palette.background.paper,
  minWidth: 200,
}));

function PrintControls({
  supplies,
  isDisabled,
  onPrintClick,
}: PrintControlsProps): JSX.Element {
  const isOutOfSupplies = supplies === 0;

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <ControlsRow>
        <Button
          onClick={onPrintClick}
          variant="contained"
          size="large"
          disabled={isDisabled}
        >
          Print a ticket
        </Button>
        <SuppliesCard elevation={0} depleted={isOutOfSupplies}>
          <Typography variant="subtitle2" color="text.secondary">
            Supplies
          </Typography>
          <Typography variant="h6" fontWeight={700}>
            {supplies}
          </Typography>
        </SuppliesCard>
      </ControlsRow>
    </Paper>
  );
}

export default PrintControls;
