import { Alert, Stack, styled, Typography } from "@mui/material";
import { JSX } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useGame } from "../../hooks/useGame";
import { useRealtime } from "../../hooks/useRealtime";
import AuthHeader from "../common/AuthHeader";
import PrintControls from "../game/PrintControls";
import TicketSummary from "../game/TicketSummary";
import Shop from "../shop/Shop";

type MainPageProps = {
  onLogout: () => void;
};

const GameRoot = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(3),
}));

function EverGreaterMainPage({ onLogout }: MainPageProps): JSX.Element {
  const { user: currentUser, logout } = useAuth();
  const { isConnected } = useRealtime();
  const {
    count: scalingNumber,
    error,
    supplies,
    isPrintDisabled,
    printTicket,
  } = useGame();

  const handleLogout = () => {
    logout();
    onLogout();
  };

  if (!currentUser) {
    return <Typography>Loading user data...</Typography>;
  }

  return (
    <GameRoot>
      <AuthHeader user={currentUser} onLogout={handleLogout} />

      <TicketSummary user={currentUser} scalingNumber={scalingNumber} />

      <PrintControls
        supplies={supplies}
        isDisabled={isPrintDisabled}
        onPrintClick={printTicket}
      />

      {currentUser.tickets_contributed > 50 && (
        <Shop
          onPurchaseError={(message) => alert(`Purchase error: ${message}`)}
        />
      )}

      {!isConnected && (
        <Alert severity="warning">Realtime connection unavailable</Alert>
      )}

      {error && <Alert severity="error">{error}</Alert>}
    </GameRoot>
  );
}

export default EverGreaterMainPage;
