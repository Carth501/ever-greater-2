import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha, styled } from "@mui/material/styles";
import { JSX } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useGame } from "../../hooks/useGame";
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

const IntroCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3.5),
  borderRadius: 24,
  border: `1px solid ${alpha(theme.palette.primary.light, 0.24)}`,
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.16)} 0%, ${alpha(theme.palette.background.paper, 0.96)} 50%, ${alpha(theme.palette.secondary.dark, 0.94)} 100%)`,
  boxShadow: `0 18px 48px ${alpha(theme.palette.common.black, 0.24)}`,
}));

const MainGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.45fr) minmax(320px, 0.95fr)",
  gap: theme.spacing(3),
  alignItems: "start",
  [theme.breakpoints.down("lg")]: {
    gridTemplateColumns: "1fr",
  },
}));

const PrimaryColumn = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(3),
}));

const SecondaryColumn = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(3),
}));

function EverGreaterMainPage({ onLogout }: MainPageProps): JSX.Element {
  const { user: currentUser, logout } = useAuth();
  const {
    count: scalingNumber,
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
      <IntroCard elevation={0}>
        <Stack spacing={2}>
          <Typography variant="overline" color="primary.light">
            Live dashboard
          </Typography>
          <Typography variant="h3" sx={{ maxWidth: 760 }}>
            The production interface is now moving toward the modular preview
            style without changing the core game loop.
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 760 }}
          >
            Ticket metrics, printing, and shop actions keep their current
            behavior, but the visual hierarchy now mirrors the cleaner card
            language from the preview system.
          </Typography>
        </Stack>
      </IntroCard>

      <AuthHeader user={currentUser} onLogout={handleLogout} />

      <MainGrid>
        <PrimaryColumn>
          <TicketSummary user={currentUser} scalingNumber={scalingNumber} />

          <PrintControls
            supplies={supplies}
            isDisabled={isPrintDisabled}
            onPrintClick={printTicket}
          />
        </PrimaryColumn>

        <SecondaryColumn>
          {currentUser.tickets_contributed > 50 && <Shop />}
        </SecondaryColumn>
      </MainGrid>
    </GameRoot>
  );
}

export default EverGreaterMainPage;
