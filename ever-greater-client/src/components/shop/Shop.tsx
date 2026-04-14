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
import ShopGoldGroup from "./shop-groups/ShopGoldGroup";
import ShopMoneyGroup from "./shop-groups/ShopMoneyGroup";

type ShopProps = {
  onPurchaseError?: (error: string) => void;
};

const ShopGroups = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(2),
  alignItems: "stretch",
}));

const ShopCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2.5),
  borderRadius: 22,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.96)} 0%, ${alpha(theme.palette.primary.main, 0.06)} 100%)`,
  boxShadow: `0 14px 30px ${alpha(theme.palette.common.black, 0.2)}`,
}));

function Shop({ onPurchaseError }: ShopProps): JSX.Element {
  const { user: currentUser } = useAuth();
  const { count: globalTicketCount } = useGame();
  const {
    buySupplies,
    buyGold,
    buyAutoprinter,
    buyAutoBuySupplies,
    toggleAutoBuySupplies,
    increaseCreditGeneration,
    increaseCreditCapacity,
  } = useOperations(onPurchaseError);

  if (!currentUser) {
    return <Typography>Loading...</Typography>;
  }

  const money = currentUser.money ?? 0;
  const gold = currentUser.gold ?? 0;
  const autoprinters = currentUser.autoprinters ?? 0;
  const operationContext = { user: currentUser };

  const buySuppliesOperation = operations[OperationId.BUY_SUPPLIES];
  const buyGoldOperation = operations[OperationId.BUY_GOLD];
  const autoBuySuppliesOperation = operations[OperationId.AUTO_BUY_SUPPLIES];
  const buyAutoprinterOperation = operations[OperationId.BUY_AUTOPRINTER];
  const increaseCreditGenerationOperation =
    operations[OperationId.INCREASE_CREDIT_GENERATION];
  const increaseCreditCapacityOperation =
    operations[OperationId.INCREASE_CREDIT_CAPACITY];

  const suppliesCost = getOperationCost(buySuppliesOperation, operationContext);
  const suppliesCostInGold = suppliesCost[ResourceType.GOLD] ?? 0;
  const canAffordSupplies = canAfford(currentUser, suppliesCost);
  const isButtonDisabled = !canAffordSupplies;

  // Gold purchase calculations
  const goldCostPerUnit =
    getOperationCost(buyGoldOperation, {
      user: currentUser,
      params: { quantity: 1 },
    })[ResourceType.MONEY] ?? 0;
  const canAffordGold1 = canAfford(currentUser, {
    [ResourceType.MONEY]:
      getOperationCost(buyGoldOperation, {
        user: currentUser,
        params: { quantity: 1 },
      })[ResourceType.MONEY] ?? 0,
  });
  const canAffordGold10 = canAfford(currentUser, {
    [ResourceType.MONEY]:
      getOperationCost(buyGoldOperation, {
        user: currentUser,
        params: { quantity: 10 },
      })[ResourceType.MONEY] ?? 0,
  });
  const canAffordGold100 = canAfford(currentUser, {
    [ResourceType.MONEY]:
      getOperationCost(buyGoldOperation, {
        user: currentUser,
        params: { quantity: 100 },
      })[ResourceType.MONEY] ?? 0,
  });

  // Autoprinter calculations
  const autoprinterCost =
    getOperationCost(buyAutoprinterOperation, operationContext)[
      ResourceType.CREDIT
    ] ?? 0;
  const canAffordAutoprinter = canAfford(currentUser, {
    [ResourceType.CREDIT]: autoprinterCost,
  });

  // Credit generation upgrade calculations
  const creditGenerationCost =
    getOperationCost(increaseCreditGenerationOperation, operationContext)[
      ResourceType.GOLD
    ] ?? 0;
  const canAffordCreditGeneration = canAfford(currentUser, {
    [ResourceType.GOLD]: creditGenerationCost,
  });

  const autoBuySuppliesCost =
    getOperationCost(autoBuySuppliesOperation, operationContext)[
      ResourceType.GOLD
    ] ?? 0;
  const canAffordAutoBuySupplies = canAfford(currentUser, {
    [ResourceType.GOLD]: autoBuySuppliesCost,
  });

  // Calculate remaining draw capacity
  const ticketsContributed = currentUser.tickets_contributed ?? 0;
  const ticketsWithdrawn = currentUser.tickets_withdrawn ?? 0;
  const remainingCapacity = Math.max(0, ticketsContributed - ticketsWithdrawn);

  // Credit capacity upgrade calculations
  const creditCapacityCost =
    getOperationCost(increaseCreditCapacityOperation, operationContext)[
      ResourceType.GLOBAL_TICKETS
    ] ?? 0;
  const canAffordCreditCapacity =
    canAfford(currentUser, {
      [ResourceType.GLOBAL_TICKETS]: creditCapacityCost,
    }) && remainingCapacity >= creditCapacityCost;

  return (
    <ShopCard elevation={0}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="overline" color="primary.light">
            Upgrades and automation
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            Shop
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            Each group is still driven by the existing progression rules, but
            the live interface now presents them with the cleaner modular card
            structure from the preview.
          </Typography>
        </Box>

        <ShopGroups>
          {currentUser.tickets_contributed > 200 && (
            <ShopMoneyGroup
              money={money}
              goldCostPerUnit={goldCostPerUnit}
              canAffordGold1={canAffordGold1}
              canAffordGold10={canAffordGold10}
              canAffordGold100={canAffordGold100}
              onBuyGold={buyGold}
            />
          )}

          <ShopGoldGroup
            gold={gold}
            suppliesCostInGold={suppliesCostInGold}
            isSuppliesButtonDisabled={isButtonDisabled}
            autoBuyCost={autoBuySuppliesCost}
            autoBuyPurchased={currentUser.auto_buy_supplies_purchased}
            autoBuyActive={currentUser.auto_buy_supplies_active}
            canAffordAutoBuyUnlock={canAffordAutoBuySupplies}
            creditGenerationCost={creditGenerationCost}
            canAffordCreditGeneration={canAffordCreditGeneration}
            onBuySupplies={buySupplies}
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
        </ShopGroups>
      </Stack>
    </ShopCard>
  );
}

export default Shop;
