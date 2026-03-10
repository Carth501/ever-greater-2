import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import {
  OperationId,
  ResourceType,
  canAfford,
  getOperationCost,
  operations,
} from "ever-greater-shared";
import { JSX } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  buyAutoBuySuppliesThunk,
  buyAutoprinterThunk,
  buyGoldThunk,
  buySuppliesThunk,
  increaseCreditCapacityThunk,
  increaseCreditGenerationThunk,
  toggleAutoBuySuppliesThunk,
} from "../store/slices/operationsSlice";
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

function Shop({ onPurchaseError }: ShopProps): JSX.Element {
  const dispatch = useAppDispatch();
  const { user: currentUser, error } = useAppSelector((state) => state.auth);
  const globalTicketCount = useAppSelector((state) => state.ticket.count);

  const handleBuySupplies = () => {
    dispatch(buySuppliesThunk()).then((result) => {
      if (result.type === buySuppliesThunk.rejected.type) {
        onPurchaseError?.(result.payload as string);
      }
    });
  };

  const handleBuyGold = (quantity: number) => {
    // Validate quantity
    if (!Number.isInteger(quantity) || quantity < 1) {
      onPurchaseError?.("Invalid quantity. Must be a positive integer.");
      return;
    }

    dispatch(buyGoldThunk(quantity)).then((result) => {
      if (result.type === buyGoldThunk.rejected.type) {
        onPurchaseError?.(result.payload as string);
      }
    });
  };

  const handleBuyAutoprinter = () => {
    dispatch(buyAutoprinterThunk()).then((result) => {
      if (result.type === buyAutoprinterThunk.rejected.type) {
        onPurchaseError?.(result.payload as string);
      }
    });
  };

  const handleBuyAutoBuySupplies = () => {
    dispatch(buyAutoBuySuppliesThunk()).then((result) => {
      if (result.type === buyAutoBuySuppliesThunk.rejected.type) {
        onPurchaseError?.(result.payload as string);
      }
    });
  };

  const handleToggleAutoBuySupplies = (active: boolean) => {
    dispatch(toggleAutoBuySuppliesThunk(active)).then((result) => {
      if (result.type === toggleAutoBuySuppliesThunk.rejected.type) {
        onPurchaseError?.(result.payload as string);
      }
    });
  };

  const handleIncreaseCreditGeneration = () => {
    dispatch(increaseCreditGenerationThunk()).then((result) => {
      if (result.type === increaseCreditGenerationThunk.rejected.type) {
        onPurchaseError?.(result.payload as string);
      }
    });
  };

  const handleIncreaseCreditCapacity = () => {
    dispatch(increaseCreditCapacityThunk()).then((result) => {
      if (result.type === increaseCreditCapacityThunk.rejected.type) {
        onPurchaseError?.(result.payload as string);
      }
    });
  };

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
    <Paper elevation={2} sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h6" fontWeight={700}>
          Shop
        </Typography>

        <ShopGroups>
          {currentUser.tickets_contributed > 200 && (
            <ShopMoneyGroup
              money={money}
              goldCostPerUnit={goldCostPerUnit}
              canAffordGold1={canAffordGold1}
              canAffordGold10={canAffordGold10}
              canAffordGold100={canAffordGold100}
              onBuyGold={handleBuyGold}
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
            onBuySupplies={handleBuySupplies}
            onBuyAutoBuySupplies={handleBuyAutoBuySupplies}
            onToggleAutoBuySupplies={handleToggleAutoBuySupplies}
            onIncreaseCreditGeneration={handleIncreaseCreditGeneration}
          />

          {currentUser.tickets_contributed > 500 && (
            <ShopCreditGroup
              user={currentUser}
              autoprinters={autoprinters}
              autoprinterCost={autoprinterCost}
              canAffordAutoprinter={canAffordAutoprinter}
              onBuyAutoprinter={handleBuyAutoprinter}
            />
          )}

          <ShopGlobalTicketsGroup
            globalTicketCount={globalTicketCount}
            remainingCapacity={remainingCapacity}
            creditCapacityCost={creditCapacityCost}
            canAffordCreditCapacity={canAffordCreditCapacity}
            onIncreaseCreditCapacity={handleIncreaseCreditCapacity}
          />
        </ShopGroups>

        {error && <Alert severity="error">{error}</Alert>}
      </Stack>
    </Paper>
  );
}

export default Shop;
