import { Alert, Stack, styled, Typography } from "@mui/material";
import { JSX } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logoutThunk } from "../store/slices/authSlice";
import { incrementCountThunk } from "../store/slices/ticketSlice";
import AuthHeader from "./AuthHeader";
import PrintControls from "./PrintControls";
import Shop from "./Shop";
import TicketSummary from "./TicketSummary";

type MainPageProps = {
  onLogout: () => void;
};

const GameRoot = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(3),
}));

function EverGreaterMainPage({ onLogout }: MainPageProps): JSX.Element {
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
  const autoBuyCanPrint =
    currentUser.auto_buy_supplies_purchased &&
    currentUser.auto_buy_supplies_active;
  const isButtonDisabled = supplies === 0 && !autoBuyCanPrint;

  return (
    <GameRoot>
      <AuthHeader user={currentUser} onLogout={handleLogout} />

      <TicketSummary user={currentUser} scalingNumber={scalingNumber} />

      <PrintControls
        supplies={supplies}
        isDisabled={isButtonDisabled}
        onPrintClick={handleIncrement}
      />

      {currentUser.tickets_contributed > 50 && (
        <Shop
          onPurchaseError={(message) => alert(`Purchase error: ${message}`)}
        />
      )}

      {error && <Alert severity="error">{error}</Alert>}
    </GameRoot>
  );
}

export default EverGreaterMainPage;
