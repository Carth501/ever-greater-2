import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha, styled } from "@mui/material/styles";
import { JSX } from "react";

type PrintControlsProps = {
  supplies: number;
  isDisabled: boolean;
  onPrintClick: () => void;
};

const ControlsRow = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.2fr) minmax(220px, 0.8fr)",
  gap: theme.spacing(2),
  alignItems: "stretch",
  [theme.breakpoints.down("sm")]: {
    gridTemplateColumns: "1fr",
  },
}));

const ControlsCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2.5),
  borderRadius: 22,
  border: `1px solid ${alpha(theme.palette.common.white, 0.07)}`,
  backgroundColor: alpha(theme.palette.background.paper, 0.92),
  boxShadow: `0 14px 30px ${alpha(theme.palette.common.black, 0.22)}`,
}));

const ActionPanel = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2.5),
  borderRadius: 20,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.28)}`,
  background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.14)} 0%, ${alpha(theme.palette.background.paper, 0.96)} 100%)`,
}));

interface SuppliesCardProps {
  depleted: boolean;
}

const SuppliesCard = styled(Paper, {
  shouldForwardProp: (prop) => prop !== "depleted",
})<SuppliesCardProps>(({ theme, depleted }) => ({
  padding: theme.spacing(2.5),
  borderRadius: 20,
  border: `1px solid ${depleted ? theme.palette.error.main : theme.palette.divider}`,
  backgroundColor: depleted
    ? alpha(theme.palette.error.main, 0.12)
    : alpha(theme.palette.background.paper, 0.94),
  minWidth: 200,
}));

function PrintControls({
  supplies,
  isDisabled,
  onPrintClick,
}: PrintControlsProps): JSX.Element {
  const isOutOfSupplies = supplies === 0;

  return (
    <ControlsCard elevation={0}>
      <Stack spacing={2.5}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={2}
        >
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Print controls
            </Typography>
            <Typography variant="body2" color="text.secondary">
              The primary action stays obvious even as the dashboard becomes
              more modular.
            </Typography>
          </Box>

          <Chip
            label={isOutOfSupplies ? "Refill needed" : "Ready to print"}
            color={isOutOfSupplies ? "warning" : "primary"}
          />
        </Stack>

        <ControlsRow>
          <ActionPanel elevation={0}>
            <Stack spacing={2}>
              <Typography variant="subtitle2" color="primary.light">
                Main action
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Printing remains the clearest call to action, with the accent
                reserved for the highest-priority interaction.
              </Typography>
              <Button
                onClick={onPrintClick}
                variant="contained"
                size="large"
                disabled={isDisabled}
                sx={{ alignSelf: "flex-start", minWidth: 220 }}
              >
                Print a ticket
              </Button>
            </Stack>
          </ActionPanel>

          <SuppliesCard elevation={0} depleted={isOutOfSupplies}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Supplies
              </Typography>
              <Typography variant="h3" fontWeight={700}>
                {supplies}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isOutOfSupplies
                  ? "No supplies available. Printing is blocked until stock is restored."
                  : "Supplies are in a healthy range and ready for the current print loop."}
              </Typography>
            </Stack>
          </SuppliesCard>
        </ControlsRow>
      </Stack>
    </ControlsCard>
  );
}

export default PrintControls;
