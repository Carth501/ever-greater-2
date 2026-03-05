import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import { JSX } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logoutThunk } from "../store/slices/authSlice";
import { incrementCountThunk } from "../store/slices/ticketSlice";
import AuthHeader from "./AuthHeader";
import PrintControls from "./PrintControls";
import Shop from "./Shop";
import TicketSummary from "./TicketSummary";

type ScalingNumberDemoProps = {
  onLogout: () => void;
};

const DemoRoot = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(3),
}));

function ScalingNumberDemo({ onLogout }: ScalingNumberDemoProps): JSX.Element {
  const dispatch = useAppDispatch();
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const { count: scalingNumber, error } = useAppSelector(
    (state) => state.ticket,
  );

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
  const isButtonDisabled = supplies === 0;

  return (
    <DemoRoot>
      <AuthHeader user={currentUser} onLogout={handleLogout} />

      <TicketSummary user={currentUser} scalingNumber={scalingNumber} />

      <PrintControls
        supplies={supplies}
        isDisabled={isButtonDisabled}
        onPrintClick={handleIncrement}
      />

      <Shop
        onPurchaseError={(message) => alert(`Purchase error: ${message}`)}
      />

      {error && <Alert severity="error">{error}</Alert>}
    </DemoRoot>
  );
}

export default ScalingNumberDemo;
