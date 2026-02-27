import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import { JSX } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { buySuppliesThunk } from "../store/slices/authSlice";

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

  const handleBuySupplies = () => {
    if (isLoading) return;
    dispatch(buySuppliesThunk()).then((result) => {
      if (result.type === buySuppliesThunk.rejected.type) {
        onPurchaseError?.(result.payload as string);
      }
    });
  };

  if (!currentUser) {
    return <Typography>Loading...</Typography>;
  }

  const money = currentUser.money ?? 0;
  const moneyCost = 10;
  const canAfford = money >= moneyCost;
  const isButtonDisabled = isLoading || !canAfford;

  return (
    <Stack spacing={2}>
      <Typography variant="h6" fontWeight={700}>
        Shop
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Money: <strong>${money}</strong>
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

      {error && <Alert severity="error">{error}</Alert>}
    </Stack>
  );
}

export default Shop;
