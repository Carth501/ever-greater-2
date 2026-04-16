import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { JSX } from "react";
import { ShopGroup, ShopRow } from "./ShopGroupLayout";

type ShopSuppliesGroupProps = {
  gold: number;
  maxSuppliesAmount: number;
  maxSuppliesCostInGold: number;
  suppliesAmount: number;
  suppliesCostInGold: number;
  canAffordSupplies: boolean;
  onBuySupplies: () => void;
};

function ShopSuppliesGroup({
  gold,
  maxSuppliesAmount,
  maxSuppliesCostInGold,
  suppliesAmount,
  suppliesCostInGold,
  canAffordSupplies,
  onBuySupplies,
}: ShopSuppliesGroupProps): JSX.Element {
  return (
    <ShopGroup>
      <Typography variant="body2" color="text.secondary">
        Gold Available: <strong>{gold}g</strong>
      </Typography>

      <ShopRow>
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            Up to {maxSuppliesAmount} Supplies
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {suppliesCostInGold > 0
              ? `Current purchase: ${suppliesAmount} supplies for ${suppliesCostInGold}g`
              : `Batch limit: ${maxSuppliesAmount} supplies for ${maxSuppliesCostInGold}g`}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Keeps the 200 supplies per gold ratio even when you cannot afford
            the full batch.
          </Typography>
        </Box>
        <Button
          onClick={onBuySupplies}
          variant="contained"
          disabled={!canAffordSupplies}
        >
          Buy
        </Button>
      </ShopRow>
    </ShopGroup>
  );
}

export default ShopSuppliesGroup;
