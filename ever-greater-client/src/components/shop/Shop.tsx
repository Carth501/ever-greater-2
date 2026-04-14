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
import { useOperations } from "../../hooks/useOperations";
import ShopMoneyGroup from "./shop-groups/ShopMoneyGroup";
import ShopSuppliesGroup from "./shop-groups/ShopSuppliesGroup";

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
  padding: theme.spacing(2.25),
  borderRadius: 20,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.96)} 0%, ${alpha(theme.palette.primary.main, 0.06)} 100%)`,
  boxShadow: `0 14px 30px ${alpha(theme.palette.common.black, 0.2)}`,
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
  },
}));

function Shop({ onPurchaseError }: ShopProps): JSX.Element {
  const { user: currentUser } = useAuth();
  const { buySupplies, buyGold } = useOperations(onPurchaseError);

  if (!currentUser) {
    return <Typography>Loading...</Typography>;
  }

  const money = currentUser.money ?? 0;
  const gold = currentUser.gold ?? 0;
  const operationContext = { user: currentUser };

  const buySuppliesOperation = operations[OperationId.BUY_SUPPLIES];
  const buyGoldOperation = operations[OperationId.BUY_GOLD];

  const suppliesCost = getOperationCost(buySuppliesOperation, operationContext);
  const suppliesCostInGold = suppliesCost[ResourceType.GOLD] ?? 0;
  const canAffordSupplies = canAfford(currentUser, suppliesCost);

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
            Stock up on consumable resources to keep tickets printing.
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

          <ShopSuppliesGroup
            gold={gold}
            suppliesCostInGold={suppliesCostInGold}
            canAffordSupplies={canAffordSupplies}
            onBuySupplies={buySupplies}
          />
        </ShopGroups>
      </Stack>
    </ShopCard>
  );
}

export default Shop;
