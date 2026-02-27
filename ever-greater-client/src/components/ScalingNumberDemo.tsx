import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import { JSX } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logoutThunk } from "../store/slices/authSlice";
import { incrementCountThunk } from "../store/slices/ticketSlice";
import GlobalTicketDisplay from "./GlobalTicketDisplay";
import Shop from "./Shop";

type ScalingNumberDemoProps = {
  onLogout: () => void;
};

const DemoRoot = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(3),
}));

const HeaderCard = styled(Paper)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: theme.spacing(2),
}));

const ControlsRow = styled(Stack)(({ theme }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: theme.spacing(2),
  flexWrap: "wrap",
}));

const TicketCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: "left",
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

function ScalingNumberDemo({ onLogout }: ScalingNumberDemoProps): JSX.Element {
  const dispatch = useAppDispatch();
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const {
    count: scalingNumber,
    error,
    isLoading,
  } = useAppSelector((state) => state.ticket);

  const handleIncrement = () => {
    dispatch(incrementCountThunk());
  };

  const handleLogout = () => {
    dispatch(logoutThunk());
    onLogout();
  };

  if (!currentUser) {
    return <Typography>Loading user data...</Typography>;
  }

  const supplies = currentUser.printer_supplies ?? 0;
  const isOutOfSupplies = supplies === 0;
  const isButtonDisabled = isLoading || isOutOfSupplies;

  return (
    <DemoRoot>
      <HeaderCard elevation={3}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            Signed in as
          </Typography>
          <Typography variant="body1" fontWeight={600}>
            {currentUser.email}
          </Typography>
        </Box>
        <Button variant="outlined" color="inherit" onClick={handleLogout}>
          Logout
        </Button>
      </HeaderCard>

      <TicketCard elevation={3}>
        <GlobalTicketDisplay scalingNumber={scalingNumber} />
        <Typography variant="body1" color="text.secondary">
          Tickets contributed: {currentUser.tickets_contributed}
        </Typography>
      </TicketCard>

      <Paper elevation={2} sx={{ p: 2 }}>
        <ControlsRow>
          <Button
            onClick={handleIncrement}
            variant="contained"
            size="large"
            disabled={isButtonDisabled}
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

      <Paper elevation={2} sx={{ p: 2 }}>
        <Shop
          onPurchaseError={(message) => alert(`Purchase error: ${message}`)}
        />
      </Paper>

      {error && <Alert severity="error">{error}</Alert>}
    </DemoRoot>
  );
}

export default ScalingNumberDemo;
