import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
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
import { JSX, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  buyAutoprinterThunk,
  buyGoldThunk,
  buySuppliesThunk,
  increaseCreditCapacityThunk,
  increaseCreditGenerationThunk,
} from "../store/slices/authSlice";
import CreditDisplay from "./CreditDisplay";

type ShopProps = {
  onPurchaseError?: (error: string) => void;
};

const ShopRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(2),
  padding: theme.spacing(1.5, 2),
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  flexWrap: "wrap",
}));

function Shop({ onPurchaseError }: ShopProps): JSX.Element {
  const dispatch = useAppDispatch();
  const { user: currentUser, error } = useAppSelector((state) => state.auth);
  const globalTicketCount = useAppSelector((state) => state.ticket.count);

  const [goldQuantity, setGoldQuantity] = useState<number>(1);

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
  const totalGoldCost =
    getOperationCost(buyGoldOperation, {
      user: currentUser,
      params: { quantity: goldQuantity },
    })[ResourceType.MONEY] ?? 0;
  const canAffordGold =
    goldQuantity >= 1 &&
    canAfford(currentUser, {
      [ResourceType.MONEY]: totalGoldCost,
    });
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

        <CreditDisplay user={currentUser} />
        <Typography variant="body1" color="text.secondary">
          Money: <strong>${money}</strong>
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gold: <strong>{gold}g</strong>
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Autoprinters: <strong>{autoprinters}</strong>
        </Typography>

        <ShopRow>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              200 Supplies
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cost: {suppliesCostInGold}g
            </Typography>
          </Box>
          <Button
            onClick={handleBuySupplies}
            variant="contained"
            disabled={isButtonDisabled}
          >
            Buy
          </Button>
        </ShopRow>

        <ShopRow>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              Gold
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cost: ${goldCostPerUnit} each
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              gap: 1,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <Button
              onClick={() => handleBuyGold(1)}
              variant="contained"
              disabled={!canAffordGold1}
              size="small"
            >
              Buy 1
            </Button>
            <Button
              onClick={() => handleBuyGold(10)}
              variant="contained"
              disabled={!canAffordGold10}
              size="small"
            >
              Buy 10
            </Button>
            <Button
              onClick={() => handleBuyGold(100)}
              variant="contained"
              disabled={!canAffordGold100}
              size="small"
            >
              Buy 100
            </Button>
          </Box>
        </ShopRow>

        <ShopRow>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              Autoprinter
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cost: {autoprinterCost} credit
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              Prints 1 ticket every 4 seconds (uses supplies)
            </Typography>
          </Box>
          <Button
            onClick={handleBuyAutoprinter}
            variant="contained"
            disabled={!canAffordAutoprinter}
          >
            Buy
          </Button>
        </ShopRow>

        <ShopRow>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              Increase Credit Generation
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cost: {creditGenerationCost}g
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              Permanently increase credit generation by 0.1 per second
            </Typography>
          </Box>
          <Button
            onClick={handleIncreaseCreditGeneration}
            variant="contained"
            disabled={!canAffordCreditGeneration}
          >
            Buy
          </Button>
        </ShopRow>

        <ShopRow>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              Increase Credit Capacity
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cost: {creditCapacityCost} tickets
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              Permanently increase maximum credit by 1
            </Typography>
          </Box>
          <Button
            onClick={handleIncreaseCreditCapacity}
            variant="contained"
            disabled={!canAffordCreditCapacity}
          >
            Buy
          </Button>
        </ShopRow>

        {error && <Alert severity="error">{error}</Alert>}
      </Stack>
    </Paper>
  );
}

export default Shop;
