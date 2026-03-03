import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
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
  const {
    user: currentUser,
    isLoading,
    error,
  } = useAppSelector((state) => state.auth);
  const globalTicketCount = useAppSelector((state) => state.ticket.count);

  const [goldQuantity, setGoldQuantity] = useState<number>(1);

  const handleBuySupplies = () => {
    if (isLoading) return;
    dispatch(buySuppliesThunk()).then((result) => {
      if (result.type === buySuppliesThunk.rejected.type) {
        onPurchaseError?.(result.payload as string);
      }
    });
  };

  const handleBuyGold = (quantity: number) => {
    if (isLoading) return;

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
    if (isLoading) return;
    dispatch(buyAutoprinterThunk()).then((result) => {
      if (result.type === buyAutoprinterThunk.rejected.type) {
        onPurchaseError?.(result.payload as string);
      }
    });
  };

  const handleIncreaseCreditGeneration = () => {
    if (isLoading) return;
    dispatch(increaseCreditGenerationThunk()).then((result) => {
      if (result.type === increaseCreditGenerationThunk.rejected.type) {
        onPurchaseError?.(result.payload as string);
      }
    });
  };

  const handleIncreaseCreditCapacity = () => {
    if (isLoading) return;
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
  const isButtonDisabled = isLoading || !canAffordSupplies;

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

  // Credit capacity upgrade calculations
  const creditCapacityCost =
    getOperationCost(increaseCreditCapacityOperation, operationContext)[
      ResourceType.GLOBAL_TICKETS
    ] ?? 0;
  const canAffordCreditCapacity = canAfford(currentUser, {
    [ResourceType.GLOBAL_TICKETS]: creditCapacityCost,
  });

  return (
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
          {canAffordSupplies ? "Buy" : "Insufficient Money"}
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
          <TextField
            type="number"
            size="small"
            value={goldQuantity}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val) && val >= 1) {
                setGoldQuantity(val);
              }
            }}
            inputProps={{ min: 1, style: { width: "80px" } }}
            disabled={isLoading}
          />
          <Button
            onClick={() => handleBuyGold(goldQuantity)}
            variant="contained"
            disabled={isLoading || !canAffordGold}
            size="small"
          >
            {canAffordGold ? "Buy" : "Insufficient Money"}
          </Button>
          <Button
            onClick={() => handleBuyGold(1)}
            variant="outlined"
            disabled={isLoading || !canAffordGold1}
            size="small"
          >
            {canAffordGold1 ? "Buy 1" : "Insufficient"}
          </Button>
          <Button
            onClick={() => handleBuyGold(10)}
            variant="outlined"
            disabled={isLoading || !canAffordGold10}
            size="small"
          >
            {canAffordGold10 ? "Buy 10" : "Insufficient"}
          </Button>
          <Button
            onClick={() => handleBuyGold(100)}
            variant="outlined"
            disabled={isLoading || !canAffordGold100}
            size="small"
          >
            {canAffordGold100 ? "Buy 100" : "Insufficient"}
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
          <Typography variant="caption" color="text.secondary" display="block">
            Prints 1 ticket every 4 seconds (uses supplies)
          </Typography>
        </Box>
        <Button
          onClick={handleBuyAutoprinter}
          variant="contained"
          disabled={isLoading || !canAffordAutoprinter}
        >
          {canAffordAutoprinter ? "Buy" : "Insufficient Credit"}
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
          <Typography variant="caption" color="text.secondary" display="block">
            Permanently increase credit generation by 0.1 per second
          </Typography>
        </Box>
        <Button
          onClick={handleIncreaseCreditGeneration}
          variant="contained"
          disabled={isLoading || !canAffordCreditGeneration}
        >
          {canAffordCreditGeneration ? "Buy" : "Insufficient Gold"}
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
          <Typography variant="caption" color="text.secondary" display="block">
            Permanently increase maximum credit by 1
          </Typography>
        </Box>
        <Button
          onClick={handleIncreaseCreditCapacity}
          variant="contained"
          disabled={isLoading || !canAffordCreditCapacity}
        >
          {canAffordCreditCapacity ? "Buy" : "Insufficient Tickets"}
        </Button>
      </ShopRow>

      {error && <Alert severity="error">{error}</Alert>}
    </Stack>
  );
}

export default Shop;
