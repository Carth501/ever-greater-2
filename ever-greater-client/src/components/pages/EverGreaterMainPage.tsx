import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import { JSX } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useGame } from "../../hooks/useGame";
import AuthHeader from "../common/AuthHeader";
import PrintControls from "../game/PrintControls";
import TicketSummary from "../game/TicketSummary";
import Shop from "../shop/Shop";
import Upgrades from "../shop/Upgrades";

type MainPageProps = {
  onLogout: () => void;
};

const GameRoot = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2.5),
  [theme.breakpoints.down("sm")]: {
    gap: theme.spacing(2),
  },
}));

const MainGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.35fr) minmax(300px, 0.9fr)",
  gap: theme.spacing(2.5),
  alignItems: "start",
  [theme.breakpoints.down("lg")]: {
    gridTemplateColumns: "1fr",
  },
  [theme.breakpoints.down("sm")]: {
    gap: theme.spacing(2),
  },
}));

const PrimaryColumn = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2.5),
}));

const SecondaryColumn = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2.5),
}));

function EverGreaterMainPage({ onLogout }: MainPageProps): JSX.Element {
  const { user: currentUser, logout } = useAuth();
  const {
    count: scalingNumber,
    supplies,
    manualPrintQuantity,
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

      <MainGrid>
        <PrimaryColumn>
          <TicketSummary user={currentUser} scalingNumber={scalingNumber} />

          <PrintControls
            supplies={supplies}
            printQuantity={manualPrintQuantity}
            isDisabled={isPrintDisabled}
            onPrintClick={printTicket}
          />
        </PrimaryColumn>

        <SecondaryColumn>
          {currentUser.tickets_contributed > 50 && (
            <>
              <Shop />
              <Upgrades />
            </>
          )}
        </SecondaryColumn>
      </MainGrid>
    </GameRoot>
  );
}

export default EverGreaterMainPage;
