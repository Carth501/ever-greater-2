import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha, styled } from "@mui/material/styles";
import {
  OperationId,
  ResourceType,
  canAfford,
  getOperationCost,
  operations,
} from "ever-greater-shared";
import { JSX } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useGame } from "../../hooks/useGame";
import { useOperations } from "../../hooks/useOperations";
import ShopCreditGroup from "./shop-groups/ShopCreditGroup";
import ShopGlobalTicketsGroup from "./shop-groups/ShopGlobalTicketsGroup";
import UpgradeGoldGroup from "./shop-groups/UpgradeGoldGroup";

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
  const {
    buyAutoprinter,
    buyAutoBuySupplies,
    toggleAutoBuySupplies,
    increaseCreditGeneration,
    increaseCreditCapacity,
  } = useOperations(onPurchaseError);

  if (!currentUser) {
    return <Typography>Loading...</Typography>;
  }

  const gold = currentUser.gold ?? 0;
  const autoprinters = currentUser.autoprinters ?? 0;
  const operationContext = { user: currentUser };

  const autoBuySuppliesOperation = operations[OperationId.AUTO_BUY_SUPPLIES];
  const buyAutoprinterOperation = operations[OperationId.BUY_AUTOPRINTER];
  const increaseCreditGenerationOperation =
    operations[OperationId.INCREASE_CREDIT_GENERATION];
  const increaseCreditCapacityOperation =
    operations[OperationId.INCREASE_CREDIT_CAPACITY];

  const autoBuySuppliesCost =
    getOperationCost(autoBuySuppliesOperation, operationContext)[
      ResourceType.GOLD
    ] ?? 0;
  const canAffordAutoBuySupplies = canAfford(currentUser, {
    [ResourceType.GOLD]: autoBuySuppliesCost,
  });

  const creditGenerationCost =
    getOperationCost(increaseCreditGenerationOperation, operationContext)[
      ResourceType.GOLD
    ] ?? 0;
  const canAffordCreditGeneration = canAfford(currentUser, {
    [ResourceType.GOLD]: creditGenerationCost,
  });

  const autoprinterCost =
    getOperationCost(buyAutoprinterOperation, operationContext)[
      ResourceType.CREDIT
    ] ?? 0;
  const canAffordAutoprinter = canAfford(currentUser, {
    [ResourceType.CREDIT]: autoprinterCost,
  });

  const ticketsContributed = currentUser.tickets_contributed ?? 0;
  const ticketsWithdrawn = currentUser.tickets_withdrawn ?? 0;
  const remainingCapacity = Math.max(0, ticketsContributed - ticketsWithdrawn);

  const creditCapacityCost =
    getOperationCost(increaseCreditCapacityOperation, operationContext)[
      ResourceType.GLOBAL_TICKETS
    ] ?? 0;
  const canAffordCreditCapacity =
    canAfford(currentUser, {
      [ResourceType.GLOBAL_TICKETS]: creditCapacityCost,
    }) && remainingCapacity >= creditCapacityCost;

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
          <UpgradeGoldGroup
            gold={gold}
            autoBuyCost={autoBuySuppliesCost}
            autoBuyPurchased={currentUser.auto_buy_supplies_purchased}
            autoBuyActive={currentUser.auto_buy_supplies_active}
            canAffordAutoBuyUnlock={canAffordAutoBuySupplies}
            creditGenerationCost={creditGenerationCost}
            canAffordCreditGeneration={canAffordCreditGeneration}
            onBuyAutoBuySupplies={buyAutoBuySupplies}
            onToggleAutoBuySupplies={toggleAutoBuySupplies}
            onIncreaseCreditGeneration={increaseCreditGeneration}
          />

          {currentUser.tickets_contributed > 500 && (
            <ShopCreditGroup
              user={currentUser}
              autoprinters={autoprinters}
              autoprinterCost={autoprinterCost}
              canAffordAutoprinter={canAffordAutoprinter}
              onBuyAutoprinter={buyAutoprinter}
            />
          )}

          <ShopGlobalTicketsGroup
            globalTicketCount={globalTicketCount}
            remainingCapacity={remainingCapacity}
            creditCapacityCost={creditCapacityCost}
            canAffordCreditCapacity={canAffordCreditCapacity}
            onIncreaseCreditCapacity={increaseCreditCapacity}
          />
        </UpgradeGroups>
      </Stack>
    </UpgradesCard>
  );
}

export default Upgrades;
