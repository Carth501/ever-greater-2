import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import { JSX, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { buyGoldThunk, buySuppliesThunk } from "../store/slices/authSlice";

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

  if (!currentUser) {
    return <Typography>Loading...</Typography>;
  }

  const money = currentUser.money ?? 0;
  const gold = currentUser.gold ?? 0;
  const moneyCost = 10;
  const canAfford = money >= moneyCost;
  const isButtonDisabled = isLoading || !canAfford;

  // Gold purchase calculations
  const goldCostPerUnit = 100;
  const totalGoldCost = goldQuantity * goldCostPerUnit;
  const canAffordGold = money >= totalGoldCost && goldQuantity >= 1;
  const canAffordGold1 = money >= goldCostPerUnit * 1;
  const canAffordGold10 = money >= goldCostPerUnit * 10;
  const canAffordGold100 = money >= goldCostPerUnit * 100;

  return (
    <Stack spacing={2}>
      <Typography variant="h6" fontWeight={700}>
        Shop
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Money: <strong>${money}</strong>
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Gold: <strong>{gold}g</strong>
      </Typography>

      <ShopRow>
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            100 Supplies
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cost: ${moneyCost}
          </Typography>
        </Box>
        <Button
          onClick={handleBuySupplies}
          variant="contained"
          disabled={isButtonDisabled}
        >
          {canAfford ? "Buy" : "Insufficient Money"}
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

      {error && <Alert severity="error">{error}</Alert>}
    </Stack>
  );
}

export default Shop;
