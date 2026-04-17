import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha, styled } from "@mui/material/styles";
import { JSX, useId } from "react";
import { buildPrintPresentation } from "../../lib/printPresentation";

type PrintControlsProps = {
  supplies: number;
  printQuantity: number;
  isDisabled: boolean;
  onPrintClick: () => void;
};

const ControlsRow = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.2fr) minmax(220px, 0.8fr)",
  gap: theme.spacing(2),
  alignItems: "stretch",
  [theme.breakpoints.down("md")]: {
    gridTemplateColumns: "1fr",
  },
}));

const ControlsCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2.25),
  borderRadius: 20,
  border: `1px solid ${alpha(theme.palette.common.white, 0.07)}`,
  backgroundColor: alpha(theme.palette.background.paper, 0.92),
  boxShadow: `0 14px 30px ${alpha(theme.palette.common.black, 0.22)}`,
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
  },
}));

const ActionPanel = styled(Paper)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: theme.spacing(2.25),
  borderRadius: 18,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.28)}`,
  background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.14)} 0%, ${alpha(theme.palette.background.paper, 0.96)} 100%)`,
}));

interface SuppliesCardProps {
  depleted: boolean;
}

const SuppliesCard = styled(Paper, {
  shouldForwardProp: (prop) => prop !== "depleted",
})<SuppliesCardProps>(({ theme, depleted }) => ({
  padding: theme.spacing(2.25),
  borderRadius: 18,
  border: `1px solid ${depleted ? theme.palette.error.main : theme.palette.divider}`,
  backgroundColor: depleted
    ? alpha(theme.palette.error.main, 0.12)
    : alpha(theme.palette.background.paper, 0.94),
  minWidth: 200,
}));

function PrintControls({
  supplies,
  printQuantity,
  isDisabled,
  onPrintClick,
}: PrintControlsProps): JSX.Element {
  const helperTextId = useId();
  const {
    isOutOfSupplies,
    printButtonLabel,
    buttonHelperText,
    suppliesStatusText,
  } = buildPrintPresentation({
    supplies,
    printQuantity,
    isActionDisabled: isDisabled,
    mode: "classic",
  });

  return (
    <ControlsCard elevation={0}>
      <Stack spacing={2}>
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
          </Box>

          <Box role="status" aria-live="polite" aria-atomic="true">
            <Chip
              label={isOutOfSupplies ? "Refill needed" : "Ready to print"}
              color={isOutOfSupplies ? "warning" : "primary"}
            />
          </Box>
        </Stack>

        <ControlsRow>
          <ActionPanel elevation={0}>
            <Stack spacing={1.25} alignItems="center">
              <Button
                onClick={onPrintClick}
                variant="contained"
                size="large"
                disabled={isDisabled}
                aria-describedby={helperTextId}
                sx={{ minWidth: 220 }}
              >
                {printButtonLabel}
              </Button>
              <Typography
                id={helperTextId}
                variant="body2"
                color="text.secondary"
                align="center"
              >
                {buttonHelperText}
              </Typography>
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
              <Typography
                variant="body2"
                color="text.secondary"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                {suppliesStatusText}
              </Typography>
            </Stack>
          </SuppliesCard>
        </ControlsRow>
      </Stack>
    </ControlsCard>
  );
}

export default PrintControls;
