import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { JSX } from "react";
import { ShopGroup, ShopRow } from "./ShopGroupLayout";

type ShopSuppliesGroupProps = {
  gold: number;
  suppliesCostInGold: number;
  canAffordSupplies: boolean;
  onBuySupplies: () => void;
};

function ShopSuppliesGroup({
  gold,
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
            200 Supplies
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cost: {suppliesCostInGold}g
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Consumable printer stock for manual and automated ticket runs.
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
