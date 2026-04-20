import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha, styled } from "@mui/material/styles";
import { JSX } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useGame } from "../../hooks/useGame";
import { useOperations } from "../../hooks/useOperations";
import { getUpgradeOperationGroups } from "./operationRegistry";

type UpgradesProps = {
  onPurchaseError?: (error: string) => void;
};

const UpgradeGroups = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(2),
  alignItems: "stretch",
}));

const UpgradesCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2.25),
  borderRadius: 20,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.96)} 0%, ${alpha(theme.palette.primary.main, 0.06)} 100%)`,
  boxShadow: `0 14px 30px ${alpha(theme.palette.common.black, 0.2)}`,
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
  },
}));

function Upgrades({ onPurchaseError }: UpgradesProps): JSX.Element {
  const { user: currentUser } = useAuth();
  const { count: globalTicketCount } = useGame();
  const operationHandlers = useOperations(onPurchaseError);

  if (!currentUser) {
    return <Typography>Loading...</Typography>;
  }
  const upgradeGroups = getUpgradeOperationGroups({
    user: currentUser,
    globalTicketCount,
    handlers: operationHandlers,
  });

  return (
    <UpgradesCard elevation={0}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="overline" color="primary.light">
            Permanent progression
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            Upgrades
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            Invest in automation and long-term production boosts.
          </Typography>
        </Box>

        <UpgradeGroups>
          {upgradeGroups.map((group) => (
            <Box key={group.key}>{group.element}</Box>
          ))}
        </UpgradeGroups>
      </Stack>
    </UpgradesCard>
  );
}

export default Upgrades;
